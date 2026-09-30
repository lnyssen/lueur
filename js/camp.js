// Le camp : on partage à manger, on caresse le renard, il s'endort.
// Le ciel garde une constellation par région rallumée.
import { rng, poly, disc, glow, ring, drawGirl, drawFox, icon, heart } from './draw.js';
import { CHAPTERS } from './levels.js';
import { foodOf } from './road.js';

const pentagram = [0, 1, 2, 3, 4].map(i => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  return [Math.cos(a) * 36, Math.sin(a) * 36];
});

// Une constellation par chapitre : étoiles (x, y), traits entre indices, place dans le ciel (u, v).
const SKY = [
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

export class Camp {
  constructor(game) {
    this.g = game;
    const st = game.state;
    this.ch = st.chapter;
    this.last = this.ch === CHAPTERS.length - 1;
    this.food = foodOf(CHAPTERS[this.ch].id);
    this.t = 0;
    this.fed = false;
    this.petted = false;
    this.asleep = st.lit;
    this.doneT = 0;
    this.toss = null;
    this.eatT = 0;
    this.happyT = 0;
    this.hearts = [];
    this.chimed = false;
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
  }

  pointer(type, sx, sy) {
    if (type !== 'down') return;
    this.layout();
    const st = this.g.state;
    const x = sx / this.s, y = sy / this.s, G = this.G;
    const near = (px, py, r) => Math.hypot(x - px, y - py) < r;
    if (st.lit) {
      if (near(...this.back, 34)) this.g.go('road');
      else if (!this.last && this.t > 3 && near(...this.next, 36)) {
        // en route pour la région suivante
        Object.assign(st, { chapter: this.ch + 1, x: 120, berries: false, bridge: false, stage: 0, lit: false });
        this.g.sfx('light');
        this.g.go('road');
      }
      return;
    }
    if (this.asleep) {
      if (this.doneT > 1.4 && near(...this.next, 36)) {
        st.stage = 0;
        this.g.go('diorama');
      }
      return;
    }
    if (!this.fed && !this.toss && near(this.foodX, G - 12, 34)) {
      this.toss = { t: 0 };
      this.g.sfx('tap');
    } else if (!this.petted && near(this.foxX, G - 22, 46)) {
      this.petted = true;
      this.happyT = 1.6;
      this.burst();
    }
  }

  key(type, k) {
    if (type !== 'down') return;
    this.layout();
    const tap = (px, py) => this.pointer('down', px * this.s, py * this.s);
    if (k === 'ArrowLeft' && this.g.state.lit) return tap(...this.back);
    if (k !== ' ' && k !== 'Enter' && k !== 'ArrowRight') return;
    if (this.asleep) tap(...this.next);
    else if (!this.fed) tap(this.foodX, this.G - 12);
    else tap(this.foxX, this.G - 22);
  }

  burst() {
    for (let i = 0; i < 3; i++) this.hearts.push({ x: this.foxX - 10 + i * 12, y: this.G - 50, life: 1 + i * 0.2 });
    this.g.sfx('heart');
  }

  update(dt) {
    this.layout();
    const st = this.g.state;
    this.t += dt;
    if (this.toss) {
      this.toss.t += dt / 0.7;
      if (this.toss.t >= 1) {
        this.toss = null;
        this.fed = true;
        this.eatT = 1.3;
        this.burst();
      }
    }
    this.eatT = Math.max(0, this.eatT - dt);
    this.happyT = Math.max(0, this.happyT - dt);
    for (const h of this.hearts) { h.y -= 22 * dt; h.life -= dt * 0.7; }
    this.hearts = this.hearts.filter(h => h.life > 0);
    if (this.fed && this.petted && !this.asleep && !this.eatT && !this.happyT) {
      this.asleep = true;
      st.bond = Math.max(st.bond, this.ch + 1);
      this.g.save();
    }
    if (this.asleep) this.doneT += dt;
    if (st.lit && !this.chimed && this.t > 0.8) {
      this.chimed = true;
      this.g.sfx(this.last ? 'relight' : 'crystal');
    }
    // à la toute fin, des étoiles filantes
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
  }

  draw(ctx) {
    this.layout();
    const { VW, VH, G, cx, t } = this;
    const st = this.g.state, N = NIGHT[this.ch], pick = p => p[st.lit ? 1 : 0];
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
      const earned = i < this.ch || (i === this.ch && st.lit);
      this.constellation(ctx, i, !earned ? null : i === this.ch ? 'new' : 'old');
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

    // personnages
    drawGirl(ctx, this.girlX, G, 1.15, 1, t, false, { sit: true });
    const foxMode = this.asleep ? 'sleep' : this.happyT ? 'happy' : this.eatT ? 'sniff' : 'sit';
    drawFox(ctx, this.foxX, G, 1.15, -1, t, foxMode);

    if (!this.fed && !this.toss && !st.lit) {
      icon(ctx, this.food, this.foodX, G - 10, 1.1);
      ring(ctx, this.foodX, G - 12, t, 17);
    }
    if (this.toss) {
      const f = this.toss.t;
      icon(ctx, this.food, this.foodX + (this.foxX - 24 - this.foodX) * f, G - 10 - Math.sin(Math.PI * f) * 70, 1.1);
    }
    if (this.fed && !this.petted && !this.eatT) ring(ctx, this.foxX - 6, G - 44, t, 17);
    for (const h of this.hearts) heart(ctx, h.x, h.y, 1.3, Math.min(1, h.life));

    // lien avec le renard : un point par chapitre
    for (let i = 0; i < CHAPTERS.length; i++) {
      const x = cx + (i - 2) * 20, y = VH - 26;
      disc(ctx, x, y, 4.5, i < st.bond ? '#ffd78a' : 'rgba(255,255,255,0.14)');
      if (i < st.bond) glow(ctx, x, y, 12, 0.45);
    }

    const arrow = (x, y, dir) => {
      glow(ctx, x, y, 44, 0.3);
      disc(ctx, x, y, 22, 'rgba(255,244,215,0.16)');
      ctx.strokeStyle = 'rgba(255,244,215,0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.stroke();
      poly(ctx, [x - 6 * dir, y - 8, x + 8 * dir, y, x - 6 * dir, y + 8], 'rgba(255,244,215,0.9)');
    };
    if (st.lit) {
      arrow(...this.back, -1);
      if (!this.last && t > 3) arrow(...this.next, 1);
    } else if (this.asleep && this.doneT > 1.4) {
      arrow(...this.next, 1);
    }
    ctx.restore();
  }
}
