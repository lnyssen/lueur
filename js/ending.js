// La fin : le chemin du retour à travers les cinq régions rallumées, puis la maison.
import { Road } from './road.js';
import { SKY, SKY_SECRET, complete } from './camp.js';
import { CHAPTERS } from './levels.js';
import { uiButton } from './icons.js';
import { rng, poly, disc, glow, drawGirl, drawFox } from './draw.js';

const LEG = 5.5;      // secondes passées dans chaque région
const FLASH = 0.7;    // fondu clair entre deux régions

export class Ending {
  constructor(game) {
    this.g = game;
    this.t = 0;
    this.idx = CHAPTERS.length - 1;
    this.legT = 0;
    this.home = false;
    this.homeT = 0;
    game.mood(true);
    this.enter();
    const r = rng(77);
    this.stars = [];
    for (let i = 0; i < 110; i++) this.stars.push([r(), r(), 0.5 + r() * 1.2, r() * 6]);
    this.flies = [];
    for (let i = 0; i < 18; i++) this.flies.push([r(), r(), r() * 6, 0.4 + r()]);
  }

  // Un sentier déjà rallumé, qu'on traverse vers la gauche : on rentre.
  enter() {
    const st = { ...this.g.state, chapter: this.idx, lit: true, bridge: true, berries: true, x: 2720 };
    const quiet = { ...this.g, state: st, quiet: true, save() {}, go() {}, announce() {}, mood() {} };
    this.road = new Road(quiet);
    this.road.light = 1;
    this.road.keys.left = true;
    this.g.mood(true, this.idx);
  }

  pointer(type, sx, sy) {
    if (type !== 'down') return;
    const v = this.g.view;
    if (this.home && this.homeT > 5 && Math.hypot(sx - 46, sy - (v.h - 46)) < 34) {
      this.g.go('camp');
    } else if (!this.home) {
      this.legT = Math.max(this.legT, LEG - FLASH);     // un toucher : on passe à la région suivante
    }
  }

  key(type, k) {
    if (type === 'down' && (k === ' ' || k === 'Enter' || k === 'ArrowLeft')) this.pointer('down', 46, this.g.view.h - 46);
  }

  update(dt) {
    this.t += dt;
    if (this.home) {
      this.homeT += dt;
      return;
    }
    this.legT += dt;
    this.road.update(dt);
    if (this.legT >= LEG) {
      this.legT = 0;
      this.idx--;
      if (this.idx < 0) {
        this.home = true;
        this.g.sfx('relight');
        this.g.say('fin');
      } else {
        this.enter();
      }
    }
  }

  drawHome(ctx) {
    const v = this.g.view, t = this.t;
    const s = Math.min(v.w / 420, v.h / 540), VW = v.w / s, VH = v.h / s, G = VH * 0.76, cx = VW / 2;
    ctx.save();
    ctx.scale(s, s);
    const sky = ctx.createLinearGradient(0, 0, 0, G);
    sky.addColorStop(0, '#15183c');
    sky.addColorStop(0.7, '#5a4c86');
    sky.addColorStop(1, '#f2a78f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VW, VH);
    for (const [u, w, r, ph] of this.stars) disc(ctx, u * VW, w * G * 0.8, r, `rgba(235,232,255,${0.35 + 0.35 * Math.sin(t * 1.2 + ph)})`);

    // les cinq constellations, toutes allumées
    const k = Math.min(1, VW / 560) * 0.85;
    (complete(this.g.state) ? [...SKY, SKY_SECRET] : SKY).forEach(({ stars, lines, at }, i) => {
      const P = stars.map(([x, y]) => [cx + at[0] * VW + x * k, G * (at[1] * 0.8 + 0.2) + y * k]);
      ctx.strokeStyle = 'rgba(255,236,190,0.7)';
      ctx.lineWidth = 1.2;
      for (const [a, b] of lines) {
        ctx.beginPath();
        ctx.moveTo(...P[a]);
        ctx.lineTo(...P[b]);
        ctx.stroke();
      }
      P.forEach(([x, y], j) => { glow(ctx, x, y, 11, 0.5 + 0.2 * Math.sin(t * 2 + j + i)); disc(ctx, x, y, 2.2, '#fff6d8'); });
    });

    // collines et sol
    ctx.beginPath();
    ctx.moveTo(0, G);
    ctx.quadraticCurveTo(VW * 0.25, G - 60, VW * 0.55, G - 18);
    ctx.quadraticCurveTo(VW * 0.8, G - 46, VW, G - 24);
    ctx.lineTo(VW, G);
    ctx.fillStyle = '#3a3668';
    ctx.fill();
    ctx.fillStyle = '#4a4580';
    ctx.fillRect(0, G - 2, VW, VH - G + 2);
    ctx.fillStyle = '#6a64a4';
    ctx.fillRect(0, G - 2, VW, 5);

    // la maison
    const hx = cx + 40;
    poly(ctx, [hx - 6, G, hx - 6, G - 64, hx + 86, G - 64, hx + 86, G], '#d9d2f0');
    poly(ctx, [hx + 50, G, hx + 50, G - 64, hx + 86, G - 64, hx + 86, G], '#b3abd8');
    poly(ctx, [hx - 16, G - 62, hx + 40, G - 104, hx + 96, G - 62], '#e0708e');
    poly(ctx, [hx + 40, G - 104, hx + 96, G - 62, hx + 50, G - 62], '#b8506e');
    ctx.fillStyle = '#b3abd8';
    ctx.fillRect(hx + 62, G - 104, 12, 28);
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.25 + i / 3) % 1;
      disc(ctx, hx + 68 + Math.sin(p * 5 + i) * 6, G - 108 - p * 46, 4 + p * 7, `rgba(235,232,255,${0.3 * (1 - p)})`);
    }
    ctx.fillStyle = '#4a3a5a';
    ctx.fillRect(hx + 6, G - 36, 20, 36);
    glow(ctx, hx + 66, G - 34, 46, 0.55);
    ctx.fillStyle = '#ffdf8e';
    ctx.fillRect(hx + 56, G - 46, 20, 22);
    ctx.fillStyle = '#4a3a5a';
    ctx.fillRect(hx + 65.2, G - 46, 1.6, 22);
    ctx.fillRect(hx + 56, G - 35.8, 20, 1.6);
    // la lanterne, accrochée près de la porte
    ctx.fillRect(hx - 4, G - 58, 1.4, 12);
    glow(ctx, hx - 3.3, G - 40, 60 + Math.sin(t * 3) * 3, 0.6);
    ctx.fillStyle = '#2b2748';
    ctx.fillRect(hx - 7.5, G - 47, 8.5, 2);
    ctx.fillRect(hx - 7.5, G - 34, 8.5, 2);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(hx - 6.5, G - 45, 6.5, 11);
    ctx.fillStyle = '#8f88c0';
    ctx.fillRect(hx - 22, G - 5, 60, 5);

    drawGirl(ctx, hx - 40, G, 1.1, 1, t, false, { sit: true });
    drawFox(ctx, hx - 78, G, 1.1, 1, t, 'sleep');
    for (const [u, w, ph, sp] of this.flies) {
      const x = u * VW + Math.sin(t * sp + ph) * 22, y = G - 16 - w * 120 + Math.cos(t * sp * 0.8 + ph) * 12;
      const a = 0.4 + 0.5 * Math.sin(t * 2.2 + ph * 3);
      if (a > 0) { glow(ctx, x, y, 9, a * 0.6); disc(ctx, x, y, 1.4, `rgba(255,244,190,${a})`); }
    }
    ctx.restore();
    if (this.homeT > 5) uiButton(ctx, 46, v.h - 46, 'back', { r: 24 });
  }

  draw(ctx) {
    const v = this.g.view;
    if (this.home) {
      this.drawHome(ctx);
      const a = Math.max(0, 1 - this.homeT / 1.2);
      if (a) { ctx.fillStyle = `rgba(255,246,226,${a})`; ctx.fillRect(0, 0, v.w, v.h); }
      return;
    }
    this.road.draw(ctx);
    // fondu clair à l'entrée et à la sortie de chaque région
    const a = Math.max(1 - this.legT / FLASH, (this.legT - (LEG - FLASH)) / FLASH, 0);
    if (a > 0) { ctx.fillStyle = `rgba(255,246,226,${Math.min(1, a)})`; ctx.fillRect(0, 0, v.w, v.h); }
  }
}
