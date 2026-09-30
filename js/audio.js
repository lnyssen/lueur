// Le son : une musique douce générée en direct (nappe + notes égrenées) et de petits bruitages.
// Rien n'est enregistré : tout sort d'oscillateurs Web Audio.

const ROOTS = [50, 53, 57, 52, 48];            // ré, fa, la, mi, do : un ton par chapitre
const DARK = { scale: [0, 3, 5, 7, 10], chords: [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]] };
const LIT = { scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]] };
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

export class Sound {
  constructor(opts) {
    this.vol = { music: opts.music, sfx: opts.sfx };
    this.ctx = null;
    this.root = ROOTS[0];
    this.mode = DARK;
    this.lit = false;
    this.walk = 2;
  }

  // À appeler sur un geste de la joueuse : les navigateurs n'autorisent le son qu'à ce moment-là.
  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);
    // deux volumes séparés : la musique d'un côté, les bruitages de l'autre
    this.musicBus = ctx.createGain();
    this.fxBus = ctx.createGain();
    this.musicBus.gain.value = this.vol.music;
    this.fxBus.gain.value = this.vol.sfx;
    this.musicBus.connect(this.master);
    this.fxBus.connect(this.master);
    // un écho feutré en guise de réverbération
    const delay = ctx.createDelay(1), fb = ctx.createGain(), damp = ctx.createBiquadFilter();
    delay.delayTime.value = 0.37;
    fb.gain.value = 0.38;
    damp.type = 'lowpass';
    damp.frequency.value = 1800;
    delay.connect(damp).connect(fb).connect(delay);
    damp.connect(this.master);
    this.echo = delay;
    // la nappe : trois voix tenues derrière un filtre
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 520;
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0;
    this.padGain.gain.setTargetAtTime(0.05, ctx.currentTime, 2.5);
    this.padFilter.connect(this.padGain).connect(this.musicBus);
    this.pad = [0, 1, 2].map(i => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'triangle' : 'sine';
      o.detune.value = [-5, 4, 7][i];
      o.connect(this.padFilter);
      o.start();
      return o;
    });
    this.next = ctx.currentTime + 0.1;
    this.beatN = 0;
    this.chord(ctx.currentTime, 0, 0.1);
    this.timer = setInterval(() => this.tick(), 200);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) ctx.suspend();
      else ctx.resume();
    });
  }

  setVolumes(music, sfx) {
    this.vol = { music, sfx };
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(music, this.ctx.currentTime, 0.05);
    this.fxBus.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
  }

  // Le ton du chapitre, et l'humeur : éteint (mineur, feutré) ou rallumé (majeur, clair).
  mood(chapter, lit) {
    this.root = ROOTS[chapter % ROOTS.length];
    this.lit = lit;
    this.mode = lit ? LIT : DARK;
    if (!this.ctx) return;
    this.padFilter.frequency.setTargetAtTime(lit ? 1500 : 520, this.ctx.currentTime, 1.5);
    this.chord(this.ctx.currentTime, Math.floor(this.beatN / 16), 1.2);
  }

  chord(t, i, glide = 0.8) {
    const c = this.mode.chords[i % 4];
    this.pad.forEach((o, k) => o.frequency.setTargetAtTime(hz(this.root - 12 + c[k] + (k === 2 ? 12 : 0)), t, glide));
  }

  tick() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    if (this.next < ctx.currentTime) this.next = ctx.currentTime + 0.05;
    while (this.next < ctx.currentTime + 0.45) {
      const n = this.beatN++;
      if (n % 16 === 0) this.chord(this.next, n / 16);
      // une marche aléatoire sur la gamme, avec des silences
      if (Math.random() < (this.lit ? 0.5 : 0.3)) {
        this.walk = Math.max(0, Math.min(9, this.walk + Math.round((Math.random() - 0.5) * 4)));
        const sc = this.mode.scale;
        const note = this.root + 12 + sc[this.walk % 5] + 12 * Math.floor(this.walk / 5);
        this.bell(hz(note), this.next, 1.8, 0.05, 'sine', this.musicBus);
      }
      this.next += 0.62;
    }
  }

  bell(f, t, dur, vol, type = 'sine', bus = this.fxBus) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
    o.connect(g);
    g.connect(bus);
    const send = ctx.createGain();
    send.gain.value = bus.gain.value;
    g.connect(send).connect(this.echo);
    o.start(t);
    o.stop(t + dur + 0.05);
    return o;
  }

  noise(t, dur, vol, f0, f1) {
    const ctx = this.ctx;
    const len = Math.ceil(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf;
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
    src.connect(bp).connect(g).connect(this.fxBus);
    src.start(t);
  }

  // Degré de la gamme du moment, `oct` octaves au-dessus de la tonique.
  deg(i, oct = 1) {
    const sc = this.mode.scale;
    return hz(this.root + 12 * oct + sc[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5));
  }

  play(name) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.vol.sfx) return;
    const t = ctx.currentTime;
    const maj = i => hz(this.root + 24 + [0, 4, 7, 12, 16, 19, 24][i]);
    switch (name) {
      case 'step': this.noise(t, 0.05, 0.035, 900, 500); break;
      case 'pad': this.noise(t, 0.04, 0.025, 1600, 900); break;
      case 'tap': this.bell(this.deg(2, 2), t, 0.25, 0.04); break;
      case 'yip': {
        const o = this.bell(760, t, 0.16, 0.06, 'triangle');
        o.frequency.exponentialRampToValueAtTime(1250, t + 0.09);
        const o2 = this.bell(900, t + 0.13, 0.18, 0.05, 'triangle');
        o2.frequency.exponentialRampToValueAtTime(1500, t + 0.22);
        break;
      }
      case 'pickup': this.bell(this.deg(2, 2), t, 0.6, 0.08); this.bell(this.deg(4, 2), t + 0.09, 0.9, 0.08); break;
      case 'heart': this.bell(this.deg(3, 2), t, 0.7, 0.06); this.bell(this.deg(5, 2), t + 0.14, 1, 0.06); break;
      case 'plate': this.bell(140, t, 0.3, 0.16); this.noise(t, 0.08, 0.04, 400, 200); break;
      case 'toggle': this.bell(196, t, 0.3, 0.12); this.bell(262, t + 0.12, 0.4, 0.1); break;
      case 'wheel': for (let i = 0; i < 5; i++) this.noise(t + i * 0.13, 0.03, 0.06, 2400, 1800); break;
      case 'mirror': {
        const o = this.bell(1400, t, 0.7, 0.05);
        o.frequency.exponentialRampToValueAtTime(2100, t + 0.4);
        break;
      }
      case 'crystal': [4, 5, 6].forEach((d, i) => this.bell(maj(d), t + i * 0.08, 1.2, 0.05)); break;
      case 'burrow': this.noise(t, 0.35, 0.09, 1400, 220); break;
      case 'leap': this.noise(t, 0.4, 0.06, 500, 1600); break;
      case 'plank': this.bell(110, t, 0.35, 0.2); this.noise(t, 0.12, 0.08, 700, 250); break;
      case 'light': [0, 1, 2, 3].forEach((d, i) => this.bell(maj(d), t + i * 0.11, 1.6, 0.07)); break;
      case 'plop': this.noise(t, 0.12, 0.09, 500, 160); this.bell(240, t + 0.02, 0.2, 0.06); break;
      case 'flap': for (let i = 0; i < 5; i++) this.noise(t + i * 0.09, 0.06, 0.05, 900, 500); break;
      case 'hoot': this.bell(330, t, 0.35, 0.09); this.bell(262, t + 0.32, 0.6, 0.09); break;
      case 'whistle': {
        const o = this.bell(1700, t, 0.3, 0.05);
        o.frequency.exponentialRampToValueAtTime(2300, t + 0.08);
        break;
      }
      case 'whale': {
        const o = this.bell(110, t, 3.5, 0.12, 'triangle');
        o.frequency.exponentialRampToValueAtTime(175, t + 1.4);
        o.frequency.exponentialRampToValueAtTime(98, t + 3.2);
        break;
      }
      case 'windup': this.noise(t, 0.9, 0.035, 250, 900); break;
      case 'wind': this.noise(t, 1.6, 0.09, 900, 260); break;
      case 'relight':
        [0, 1, 2, 3, 4, 5, 6].forEach((d, i) => this.bell(maj(d), t + i * 0.16, 3.2, 0.07));
        [0, 2].forEach(d => this.bell(maj(d) / 4, t, 4, 0.12, 'triangle'));
        break;
    }
  }
}
