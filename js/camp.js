// Le camp : on partage à manger, puis un jeu avec le renard, différent à chaque région.
// On peut lui montrer les trouvailles du sentier ; le carnet garde tout ce qu'on a trouvé et vu.
// Le ciel garde une constellation par région rallumée.
import { rng, poly, disc, glow, ring, drawGirl, drawFox, icon, heart } from './draw.js';
import { CRITTERS, portrait } from './critters.js';
import { CHAPTERS } from './levels.js';
import { foodOf, findsOf } from './road.js';
import { uiButton } from './icons.js';

const pentagram = [0, 1, 2, 3, 4].map(i => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  return [Math.cos(a) * 36, Math.sin(a) * 36];
});

// Une constellation par chapitre : étoiles (x, y), traits entre indices, place dans le ciel (u, v).
export const SKY = [
  { // le renard
    at: [-0.27, 0.46],
    stars: [[-72, 12], [-36, 0], [-6, -8], [24, -34], [32, -14], [54, -6], [22, 8], [18, 36], [-28, 34]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [2, 6], [6, 7], [1, 8]],
  },
  { // l'arbre
    at: [0.27, 0.44],
    stars: [[0, 40], [0, 10], [-28, -6], [0, -38], [28, -6]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1]],
  },
  { // le phare
    at: [-0.23, 0.2],
    stars: [[-14, 38], [14, 38], [8, -12], [-8, -12], [0, -32], [-38, -24], [38, -24]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [2, 4], [4, 5], [4, 6]],
  },
  { // la montagne
    at: [0.25, 0.18],
    stars: [[-60, 30], [-24, -18], [-4, 8], [22, -34], [60, 30]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  { // l'étoile
    at: [0, 0.3],
    stars: pentagram,
    lines: [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]],
  },
];

// Couleurs du ciel et du sol, nuit d'avant puis nuit d'après.
const NIGHT = [
  { sky: ['#141230', '#4a4273'], lit: ['#12263f', '#3f6f7c'], hill: ['#262346', '#1d3f4a'], tree: ['#1d1b3a', '#173540'], ground: ['#2f2c55', '#234c54'], edge: ['#3e3a6c', '#2f636a'] },
  { sky: ['#0e1a2c', '#2f4f5c'], lit: ['#10302c', '#4f8a6a'], hill: ['#1c3040', '#1f4a3c'], tree: ['#142634', '#173a30'], ground: ['#223848', '#285040'], edge: ['#2f4c5e', '#386a54'] },
  { sky: ['#0f1634', '#3c4a86'], lit: ['#10284a', '#4a86aa'], hill: ['#222c5c', '#1f4468'], tree: ['#1a224c', '#183858'], ground: ['#2a3468', '#24507a'], edge: ['#3a4684', '#306a98'] },
  { sky: ['#15122e', '#54487e'], lit: ['#2a1e44', '#a87a9a'], hill: ['#2c2852', '#4a3a6a'], tree: ['#221f44', '#3a2e58'], ground: ['#3a3668', '#5a4a80'], edge: ['#54508a', '#7a66a0'] },
  { sky: ['#08081c', '#2a2660'], lit: ['#1c1440', '#c07a6a'], hill: ['#1c1a44', '#4a3060'], tree: ['#16143a', '#3a2650'], ground: ['#24215a', '#5a3a6a'], edge: ['#38347a', '#8a5a80'] },
];

// Ce qu'on fait au camp de chaque région, dans l'ordre.
//   feed   partager le goûter        pet    une caresse
//   fetch  lancer un bâton           hide   cache-cache derrière les buissons
//   stars  relier des étoiles
const PLAN = [['feed', 'pet'], ['feed', 'fetch'], ['feed', 'hide'], ['feed', 'stars'], ['feed', 'pet']];
const ROUNDS = 2;

export class Camp {
  constructor(game) {
    this.g = game;
    const st = game.state;
    this.ch = st.chapter;
    this.last = this.ch === CHAPTERS.length - 1;
    this.food = foodOf(CHAPTERS[this.ch].id);
    this.t = 0;
    this.acts = st.lit ? [] : PLAN[this.ch].slice();
    this.act = this.acts.shift() || null;
    this.p = { phase: 'wait', t: 0, round: 0 };      // l'état du jeu en cours
    this.fox = { dx: 0, y: 0, face: -1, mode: 'sit' };
    this.asleep = st.lit;
    this.doneT = 0;
    this.toss = null;
    this.eatT = 0;
    this.happyT = 0;
    this.hearts = [];
    this.shake = [0, 0, 0];
    this.spot = 0;
    this.picked = [false, false, false, false];
    this.gift = null;
    this.carnet = false;
    this.chimed = false;
    st.shown ||= {};
    st.stars ||= {};
    st.seen ||= {};
    game.mood(st.lit);
    const r = rng(21 + this.ch * 13);
    this.stars = [];
    for (let i = 0; i < 90; i++) this.stars.push([r(), r(), 0.5 + r() * 1.2, r() * 6]);
    this.pines = [];
    for (let i = 0; i < 9; i++) this.pines.push([r(), 70 + r() * 90]);
    this.shooting = [];
  }

  layout() {
    const v = this.g.view;
    this.s = Math.min(v.w / 420, v.h / 540);
    this.VW = v.w / this.s;
    this.VH = v.h / this.s;
    this.G = this.VH * 0.76;
    this.cx = this.VW / 2;
    this.girlX = this.cx - 64;
    this.foxX = this.cx + 62;
    this.foodX = this.girlX - 34;
    this.next = [this.VW - 46, this.VH - 46];
    this.back = [46, this.VH - 46];
    this.book = [38 / this.s, 38 / this.s];
    this.bushes = [this.cx - 150, this.cx + 104, this.cx + 162].map(x => Math.max(40, Math.min(this.VW - 46, x)));
    this.dots = [[-70, 8], [-24, -18], [26, -4], [72, -22]].map(([x, y]) => [this.cx + x, this.G * 0.66 + y]);
  }

  // les trouvailles de cette région qu'on n'a pas encore montrées au renard
  gifts() {
    const st = this.g.state;
    return findsOf(CHAPTERS[this.ch].id).filter(id => st.finds[id] && !st.shown[id]);
  }

  pointer(type, sx, sy) {
    if (type !== 'down') return;
    this.layout();
    const st = this.g.state;
    const x = sx / this.s, y = sy / this.s, G = this.G, p = this.p;
    const near = (px, py, r) => Math.hypot(x - px, y - py) < r;
    if (this.carnet) { this.carnet = false; this.g.sfx('tap'); return; }
    if (near(...this.book, 24 / this.s)) { this.carnet = true; this.g.sfx('tap'); return; }
    if (st.lit) {
      if (near(...this.back, 34)) this.g.go('road');
      else if (this.t > 3 && near(...this.next, 36)) {
        this.g.sfx('light');
        if (this.last) {
          st.finished = true;
          this.g.go('ending');
        } else {
          // en route pour la région suivante
          Object.assign(st, { chapter: this.ch + 1, x: 120, berries: false, bridge: false, stage: 0, lit: false });
          this.g.go('road');
        }
      }
      return;
    }
    if (!this.act) {
      if (this.doneT > 1 && near(...this.next, 36)) {
        st.stage = 0;
        this.g.go('diorama');
        return;
      }
      // montrer une trouvaille au renard
      const list = this.gifts();
      const i = list.findIndex((id, k) => near(this.foodX + k * 30, G - 12, 20));
      if (i >= 0 && !this.gift && !this.asleep) {
        this.gift = { id: list[i], x0: this.foodX + i * 30, t: 0 };
        st.shown[list[i]] = true;
        this.g.sfx('tap');
      }
      return;
    }
    if (this.act === 'feed') {
      if (p.phase === 'wait' && !this.toss && near(this.foodX, G - 12, 34)) { this.toss = { t: 0 }; this.g.sfx('tap'); }
    } else if (this.act === 'pet') {
      if (p.phase === 'wait' && near(this.foxX, G - 22, 46)) { p.phase = 'joy'; p.t = 0; this.happyT = 1.6; this.burst(); }
    } else if (this.act === 'fetch') {
      if (p.phase === 'wait' && near(this.girlX + 30, G - 8, 34)) { p.phase = 'fly'; p.t = 0; this.g.sfx('leap'); }
    } else if (this.act === 'hide' && p.phase === 'hidden') {
      const i = this.bushes.findIndex(bx => near(bx, G - 18, 38));
      if (i === this.spot) { p.phase = 'found'; p.t = 0; this.g.sfx('yip'); }
      else if (i >= 0) { this.shake[i] = 1; this.g.sfx('pad'); }
    } else if (this.act === 'stars') {
      const i = this.dots.findIndex(([dx, dy]) => near(dx, dy, 30));
      if (i >= 0 && !this.picked[i]) {
        this.picked[i] = true;
        this.g.sfx('pickup');
        if (this.picked.every(Boolean)) { p.phase = 'joy'; p.t = 0; this.burst(); }
      }
    }
  }

  key(type, k) {
    if (type !== 'down') return;
    this.layout();
    const G = this.G, tap = (px, py) => this.pointer('down', px * this.s, py * this.s);
    if (this.carnet) return tap(0, 0);
    if (k === 'c') return tap(...this.book);
    if (k === 'ArrowLeft' && this.g.state.lit) return tap(...this.back);
    if (k !== ' ' && k !== 'Enter' && k !== 'ArrowRight') return;
    if (!this.act) tap(...this.next);
    else if (this.act === 'feed') tap(this.foodX, G - 12);
    else if (this.act === 'pet') tap(this.foxX, G - 22);
    else if (this.act === 'fetch') tap(this.girlX + 30, G - 8);
    else if (this.act === 'hide') tap(this.bushes[this.spot], G - 18);
    else if (this.act === 'stars' && this.picked.includes(false)) tap(...this.dots[this.picked.indexOf(false)]);
  }

  burst() {
    for (let i = 0; i < 3; i++) this.hearts.push({ x: this.foxX + this.fox.dx - 10 + i * 12, y: this.G - 50, life: 1 + i * 0.2 });
    this.g.sfx('heart');
  }

  nextAct() {
    this.act = this.acts.shift() || null;
    this.p = { phase: 'wait', t: 0, round: 0 };
    this.fox = { dx: 0, y: 0, face: -1, mode: 'sit' };
    if (this.act === 'hide') this.p.phase = 'away';
    if (!this.act) {
      const st = this.g.state;
      st.bond = Math.max(st.bond, this.ch + 1);
      this.g.save();
    }
  }

  update(dt) {
    this.layout();
    const st = this.g.state, p = this.p, f = this.fox;
    this.t += dt;
    p.t += dt;
    this.eatT = Math.max(0, this.eatT - dt);
    this.happyT = Math.max(0, this.happyT - dt);
    this.shake = this.shake.map(v => Math.max(0, v - dt * 2.5));

    if (this.act === 'feed') {
      if (this.toss) {
        this.toss.t += dt / 0.7;
        if (this.toss.t >= 1) { this.toss = null; this.eatT = 1.3; this.burst(); p.phase = 'eat'; p.t = 0; }
      }
      f.mode = this.eatT ? 'sniff' : 'sit';
      if (p.phase === 'eat' && p.t > 1.4) this.nextAct();
    } else if (this.act === 'pet') {
      f.mode = this.happyT ? 'happy' : 'sit';
      if (p.phase === 'joy' && p.t > 1.8) this.nextAct();
    } else if (this.act === 'fetch') {
      // le bâton part, le renard court le chercher et le rapporte
      const far = Math.min(this.VW - 40 - this.foxX, 120);
      if (p.phase === 'fly' && p.t > 0.6) { p.phase = 'run'; p.t = 0; }
      if (p.phase === 'run') {
        f.dx = Math.min(far, f.dx + 260 * dt); f.face = 1; f.mode = 'walk';
        if (f.dx >= far) { p.phase = 'back'; p.t = 0; this.g.sfx('pad'); }
      } else if (p.phase === 'back') {
        f.dx = Math.max(-70, f.dx - 240 * dt); f.face = -1; f.mode = 'walk';
        if (f.dx <= -70) { p.phase = 'drop'; p.t = 0; this.happyT = 0.9; this.g.sfx('yip'); }
      } else if (p.phase === 'drop') {
        f.mode = 'happy';
        if (p.t > 0.9) {
          p.round++;
          if (p.round >= ROUNDS) { this.burst(); p.phase = 'joy'; p.t = 0; }
          else { p.phase = 'home'; p.t = 0; }
        }
      } else if (p.phase === 'home') {
        f.dx = Math.min(0, f.dx + 200 * dt); f.face = 1; f.mode = 'walk';
        if (f.dx >= 0) { p.phase = 'wait'; f.face = -1; f.mode = 'sit'; }
      } else if (p.phase === 'joy') {
        f.mode = 'happy';
        if (p.t > 1.6) this.nextAct();
      }
    } else if (this.act === 'hide') {
      // le renard file se cacher ; on le cherche derrière les buissons
      if (p.phase === 'away') {
        f.dx += 300 * dt; f.face = 1; f.mode = 'walk';
        if (this.foxX + f.dx > this.VW + 50) { p.phase = 'hidden'; p.t = 0; this.spot = (this.spot + 1 + Math.floor(Math.random() * 2)) % 3; }
      } else if (p.phase === 'found') {
        const k = Math.min(1, p.t / 0.6), from = this.bushes[this.spot] - this.foxX;
        f.dx = from * (1 - k); f.y = -40 * Math.sin(Math.PI * k); f.face = from > 0 ? -1 : 1; f.mode = k < 1 ? 'walk' : 'happy';
        if (p.t > 1.5) {
          p.round++;
          if (p.round >= ROUNDS) { this.burst(); p.phase = 'joy'; p.t = 0; f.dx = 0; f.y = 0; }
          else { p.phase = 'away'; p.t = 0; f.y = 0; }
        }
      } else if (p.phase === 'joy') {
        f.mode = 'happy'; f.face = -1;
        if (p.t > 1.4) this.nextAct();
      }
    } else if (this.act === 'stars') {
      f.mode = 'sit';
      if (p.phase === 'joy' && p.t > 2.6) this.nextAct();
    } else if (!st.lit) {
      // les jeux sont finis : on peut encore montrer ses trouvailles, puis le renard s'endort
      if (this.gift) {
        this.gift.t += dt / 0.6;
        if (this.gift.t >= 1) {
          this.gift = null;
          this.happyT = 1.2;
          this.burst();
          if (findsOf(CHAPTERS[this.ch].id).every(id => st.shown[id]) && !st.stars[this.ch]) {
            st.stars[this.ch] = true;     // les trois : une étoile de plus dans la constellation
            this.g.sfx('crystal');
          }
          this.g.save();
        }
      }
      f.mode = this.happyT ? 'happy' : 'sit';
      this.doneT += dt;
      if (!this.asleep && !this.gift && !this.happyT && !this.gifts().length && this.doneT > 0.6) this.asleep = true;
    }

    for (const h of this.hearts) { h.y -= 22 * dt; h.life -= dt * 0.7; }
    this.hearts = this.hearts.filter(h => h.life > 0);
    if (st.lit && !this.chimed && this.t > 0.8) {
      this.chimed = true;
      this.g.sfx(this.last ? 'relight' : 'crystal');
    }
    if (st.lit && this.last && Math.random() < dt * 0.6) {
      this.shooting.push({ x: Math.random() * this.VW, y: Math.random() * this.G * 0.5, life: 1 });
    }
    for (const s of this.shooting) { s.x += 240 * dt; s.y += 90 * dt; s.life -= dt * 1.2; }
    this.shooting = this.shooting.filter(s => s.life > 0);
  }

  constellation(ctx, i, state) {
    const { stars, lines, at } = SKY[i];
    const k = Math.min(1, this.VW / 560) * 0.85;
    const ox = this.cx + at[0] * this.VW, oy = Math.max(60, this.G * at[1]);
    const P = stars.map(([x, y]) => [ox + x * k, oy + y * k]);
    if (state) {
      // la plus récente se trace trait par trait
      const prog = state === 'new' ? Math.min(lines.length, Math.max(0, this.t - 0.8) * 1.6) : lines.length;
      ctx.strokeStyle = 'rgba(255,236,190,0.7)';
      ctx.lineWidth = 1.2;
      for (let j = 0; j < lines.length; j++) {
        const f = Math.max(0, Math.min(1, prog - j));
        if (!f) continue;
        const a = P[lines[j][0]], b = P[lines[j][1]];
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
        ctx.stroke();
      }
    }
    P.forEach(([x, y], j) => {
      if (state) {
        glow(ctx, x, y, 11, 0.5 + 0.2 * Math.sin(this.t * 2 + j + i));
        disc(ctx, x, y, 2.2, '#fff6d8');
      } else {
        disc(ctx, x, y, 1.5, 'rgba(235,232,255,0.28)');
      }
    });
    if (state && this.g.state.stars[i]) {
      // l'étoile des trois trouvailles : plus grosse, avec ses rayons
      const [x, y] = P[0], r = 9 + Math.sin(this.t * 2.4) * 1.5;
      glow(ctx, x, y, 26, 0.7);
      poly(ctx, [x, y - r, x + 2, y - 2, x + r, y, x + 2, y + 2, x, y + r, x - 2, y + 2, x - r, y, x - 2, y - 2], '#fff6d8');
    }
  }

  bush(ctx, x, G, shake, col, colS) {
    const w = Math.sin(this.t * 40) * 3 * shake;
    for (const [dx, r, s] of [[-13, 14, 1], [13, 15, 1], [0, 20, 0]]) {
      const bx = x + dx + w;
      poly(ctx, [bx - r, G + 1, bx - r * 0.6, G - r * 0.8, bx, G - r * 1.25, bx + r * 0.7, G - r * 0.7, bx + r, G + 1], s ? colS : col);
    }
  }

  // Le carnet : trois trouvailles et deux animaux par région, et l'étoile quand tout a été montré au renard.
  drawCarnet(ctx) {
    const { VW, VH } = this, st = this.g.state;
    ctx.fillStyle = 'rgba(14,13,34,0.7)';
    ctx.fillRect(0, 0, VW, VH);
    const W = Math.min(340, VW - 24), rowH = 58, H = rowH * 5 + 36;
    const x0 = (VW - W) / 2, y0 = (VH - H) / 2;
    ctx.fillStyle = '#f4ecd8';
    ctx.beginPath();
    ctx.roundRect(x0, y0, W, H, 16);
    ctx.fill();
    ctx.fillStyle = 'rgba(42,39,80,0.12)';
    ctx.fillRect(x0 + W / 2 - 0.5, y0 + 14, 1, H - 28);
    const tint = ['#62c5b8', '#6fbf7a', '#58a6cb', '#b8a6d8', '#f2a78f'];
    CHAPTERS.forEach((chap, i) => {
      const y = y0 + 18 + rowH * i + rowH / 2;
      const items = [...findsOf(chap.id).map(id => ['find', id]), ...CRITTERS[chap.id].map(([k]) => ['seen', k])];
      const step = (W - 70) / 5;
      disc(ctx, x0 + 18, y, 6, tint[i]);
      items.forEach(([type, id], j) => {
        const x = x0 + 50 + step * j + (j >= 3 ? 10 : 0);
        const has = type === 'find' ? st.finds[id] : st.seen[id];
        disc(ctx, x, y, 22, has ? 'rgba(42,39,80,0.9)' : 'rgba(42,39,80,0.1)');
        if (!has) { disc(ctx, x, y, 2.5, 'rgba(42,39,80,0.3)'); return; }
        if (type === 'find') icon(ctx, id, x, y, 1.5);
        else portrait(ctx, id, x, y);
        if (type === 'find' && st.shown[id]) disc(ctx, x + 16, y - 16, 4, '#f08a3c');   // montrée au renard
      });
      if (st.stars[i]) {
        const x = x0 + W - 16, r = 8;
        poly(ctx, [x, y - r, x + 2, y - 2, x + r, y, x + 2, y + 2, x, y + r, x - 2, y + 2, x - r, y, x - 2, y - 2], '#f0a63c');
      }
    });
  }

  draw(ctx) {
    this.layout();
    const { VW, VH, G, cx, t } = this;
    const st = this.g.state, N = NIGHT[this.ch], pick = p => p[st.lit ? 1 : 0], p = this.p, f = this.fox;
    ctx.save();
    ctx.scale(this.s, this.s);

    const pal = st.lit ? N.lit : N.sky;
    const sky = ctx.createLinearGradient(0, 0, 0, G);
    sky.addColorStop(0, pal[0]);
    sky.addColorStop(1, pal[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VW, VH);
    for (const [u, v, r, ph] of this.stars) {
      disc(ctx, u * VW, v * G * 0.85, r, `rgba(235,232,255,${0.35 + 0.35 * Math.sin(t * 1.2 + ph)})`);
    }
    for (const s of this.shooting) {
      ctx.strokeStyle = `rgba(255,246,216,${s.life})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - 34, s.y - 13);
      ctx.stroke();
    }
    for (let i = 0; i < SKY.length; i++) {
      const earned = i < Math.max(this.ch, st.best | 0) || (i === this.ch && st.lit);
      this.constellation(ctx, i, !earned ? null : i === this.ch && st.lit ? 'new' : 'old');
    }

    // le jeu des étoiles : quatre étoiles basses à toucher, qui se relient
    if (this.act === 'stars') {
      const done = this.picked.every(Boolean);
      ctx.strokeStyle = 'rgba(255,236,190,0.8)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        if (!this.picked[i] || !this.picked[i + 1]) continue;
        ctx.beginPath();
        ctx.moveTo(...this.dots[i]);
        ctx.lineTo(...this.dots[i + 1]);
        ctx.stroke();
      }
      this.dots.forEach(([x, y], i) => {
        if (this.picked[i]) { glow(ctx, x, y, 16, 0.7); disc(ctx, x, y, 3, '#fff6d8'); }
        else { disc(ctx, x, y, 2.4, '#fff6d8'); ring(ctx, x, y, t + i * 0.3, 12); }
      });
      if (done) glow(ctx, cx, G * 0.66 - 8, 120, 0.18);
    }

    // horizon
    ctx.beginPath();
    ctx.moveTo(0, G);
    ctx.quadraticCurveTo(VW * 0.3, G - 70, VW * 0.62, G - 22);
    ctx.quadraticCurveTo(VW * 0.85, G - 50, VW, G - 30);
    ctx.lineTo(VW, G);
    ctx.fillStyle = pick(N.hill);
    ctx.fill();
    for (const [u, h] of this.pines) {
      const x = u * VW;
      if (Math.abs(x - cx) < 90) continue;
      for (let i = 2; i >= 0; i--) {
        const apex = G + 4 - h + i * h * 0.24, bot = apex + h * 0.42, hw = h * 0.38 * (0.5 + i * 0.22);
        poly(ctx, [x, apex, x - hw, bot, x + hw, bot], pick(N.tree));
      }
    }
    ctx.fillStyle = pick(N.ground);
    ctx.fillRect(0, G - 2, VW, VH - G + 2);
    ctx.fillStyle = pick(N.edge);
    ctx.fillRect(0, G - 2, VW, 5);

    // feu
    glow(ctx, cx, G - 14, 170 + Math.sin(t * 7) * 8, 0.34, '255,170,90');
    poly(ctx, [cx - 20, G - 1, cx + 16, G - 9, cx + 19, G - 4, cx - 17, G + 4], '#3a2a3a');
    poly(ctx, [cx + 20, G - 1, cx - 16, G - 9, cx - 19, G - 4, cx + 17, G + 4], '#4d3340');
    const fl = (w, h, c, ph) => {
      const wob = Math.sin(t * 9 + ph) * 3, hh = h * (0.85 + 0.15 * Math.sin(t * 13 + ph));
      poly(ctx, [cx - w, G - 5, cx - w * 0.5 + wob * 0.4, G - hh * 0.6, cx + wob, G - 5 - hh, cx + w * 0.6 + wob * 0.4, G - hh * 0.5, cx + w, G - 5], c);
    };
    fl(13, 40, '#f0703c', 0);
    fl(9, 30, '#f8a544', 2);
    fl(5, 18, '#ffe08f', 4);

    // cache-cache : le renard dépasse derrière son buisson
    const hiding = this.act === 'hide';
    if (hiding && p.phase === 'hidden') {
      const bx = this.bushes[this.spot], flick = Math.sin(t * 5) * 3;
      poly(ctx, [bx + 14, G - 8, bx + 30, G - 16 + flick, bx + 38, G - 10 + flick, bx + 28, G - 2], '#f08a3c');
      poly(ctx, [bx + 30, G - 16 + flick, bx + 38, G - 10 + flick, bx + 31, G - 9 + flick], '#fff1de');
      poly(ctx, [bx - 8, G - 24, bx - 4, G - 34, bx, G - 25], '#f08a3c');
      poly(ctx, [bx + 1, G - 25, bx + 5, G - 34, bx + 9, G - 24], '#f08a3c');
    }

    // personnages
    drawGirl(ctx, this.girlX, G, 1.15, 1, t, false, { sit: true });
    const shown = !(hiding && (p.phase === 'hidden' || (p.phase === 'away' && this.foxX + f.dx > VW + 40)));
    if (shown) drawFox(ctx, this.foxX + f.dx, G + f.y, 1.15, f.face, t, this.asleep ? 'sleep' : f.mode);
    if (hiding) this.bushes.forEach((bx, i) => this.bush(ctx, bx, G, this.shake[i], pick(N.edge), pick(N.hill)));
    if (hiding && p.phase === 'hidden') this.bushes.forEach(bx => ring(ctx, bx, G - 30, t, 12));

    // le goûter
    if (this.act === 'feed' && !this.toss && p.phase === 'wait') {
      icon(ctx, this.food, this.foodX, G - 10, 1.1);
      ring(ctx, this.foodX, G - 12, t, 17);
    }
    if (this.toss) {
      const k = this.toss.t;
      icon(ctx, this.food, this.foodX + (this.foxX - 24 - this.foodX) * k, G - 10 - Math.sin(Math.PI * k) * 70, 1.1);
    }
    if (this.act === 'pet' && p.phase === 'wait') ring(ctx, this.foxX - 6, G - 44, t, 17);

    // le bâton
    if (this.act === 'fetch') {
      const stick = (x, y, a) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.fillStyle = '#b98a5e';
        ctx.fillRect(-11, -1.5, 22, 3);
        ctx.fillRect(3, -5, 2.5, 5);
        ctx.restore();
      };
      const far = Math.min(VW - 40 - this.foxX, 120), sx0 = this.girlX + 30;
      if (p.phase === 'wait') { stick(sx0, G - 3, 0.1); ring(ctx, sx0, G - 8, t, 15); }
      else if (p.phase === 'fly') { const k = Math.min(1, p.t / 0.6); stick(sx0 + (this.foxX + far + 16 - sx0) * k, G - 3 - Math.sin(Math.PI * k) * 90, k * 9); }
      else if (p.phase === 'run') stick(this.foxX + far + 16, G - 3, 0.2);
      else if (p.phase === 'back') stick(this.foxX + f.dx - 28, G - 26, 0.1);
      else if (p.phase === 'drop' || p.phase === 'home') stick(sx0, G - 3, 0.1);
    }

    // les trouvailles à montrer
    if (!this.act && !st.lit && !this.asleep) {
      this.gifts().forEach((id, i) => {
        icon(ctx, id, this.foodX + i * 30, G - 10, 1.1);
        ring(ctx, this.foodX + i * 30, G - 12, t + i * 0.3, 13);
      });
    }
    if (this.gift) {
      const k = this.gift.t;
      icon(ctx, this.gift.id, this.gift.x0 + (this.foxX - 26 - this.gift.x0) * k, G - 10 - Math.sin(Math.PI * k) * 60, 1.2);
    }
    for (const h of this.hearts) heart(ctx, h.x, h.y, 1.3, Math.min(1, h.life));

    // lien avec le renard : un point par chapitre
    for (let i = 0; i < CHAPTERS.length; i++) {
      const x = cx + (i - 2) * 20, y = VH - 26;
      disc(ctx, x, y, 4.5, i < st.bond ? '#ffd78a' : 'rgba(255,255,255,0.14)');
      if (i < st.bond) glow(ctx, x, y, 12, 0.45);
    }

    const arrow = (x, y, dir) => uiButton(ctx, x, y, dir > 0 ? 'next' : 'back', { r: 24, glowing: dir > 0 });
    if (st.lit) {
      arrow(...this.back, -1);
      if (t > 3) arrow(...this.next, 1);
    } else if (!this.act && this.doneT > 1) {
      arrow(...this.next, 1);
    }
    uiButton(ctx, this.book[0], this.book[1], 'book', { r: 20 / this.s, active: this.carnet });
    if (this.carnet) this.drawCarnet(ctx);
    ctx.restore();
  }
}
