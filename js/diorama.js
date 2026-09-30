// Le lieu de la lumière : trois petits dioramas isométriques à résoudre à deux.
// Les règles sont dans rules.js, les cartes dans levels.js ; ici on anime et on dessine.
import { mix, ease, rng, poly, disc, glow, ring, paw, hand, drawGirl, drawFox } from './draw.js';
import { CHAPTERS } from './levels.js';
import * as R from './rules.js';
import { uiButton } from './icons.js';
import { CAMP } from './road.js';

const HW = 32, HH = 16;
const HINT_AFTER = 22;
const MIN_TILE = 76;   // largeur minimale d'une case à l'écran, en pixels, pour viser du doigt

// Chaque couleur est une paire [éteint, rallumé]. Éteint ne veut pas dire illisible :
// dalles claires sur fond sombre, monuments et mécanismes dans des teintes à part.
const BASE = {
  bgTop: ['#17152e', '#a6dfd2'], bgBot: ['#2a2952', '#4fb9ab'],
  top: ['#b3b0e8', '#f7f0d0'], left: ['#726eb2', '#e9b9a8'], right: ['#4b4884', '#b7a2cf'],
  lily: ['#4f9ea6', '#7ecb8f'], lilyS: ['#3a7a86', '#5fb078'],
  p: ['#f08aa8', '#f08a6c'], q: ['#6fb0f2', '#5f9fe0'],
  u: ['#5fd0bc', '#4fc4ae'], v: ['#f0bf6a', '#f2b35a'], k: ['#8fd8f6', '#7fd8f0'], j: ['#b9a0f4', '#b79cf0'],
  plank: ['#d9a0c4', '#d8896f'], plankS: ['#8a5f96', '#a9604f'],
  reed: ['#5f5e9e', '#3a8f7f'], ink: ['#e6e2fa', '#5c4560'], hole: ['#1d1b38', '#5c4560'],
  glass: ['#8d88c8', '#ffdf8e'], roof: ['#e0708e', '#e8706a'], roofS: ['#a8506e', '#b9554f'],
  towerL: ['#d4d0f6', '#fff6e0'], towerR: ['#9a96d4', '#ecc6b6'],
  ripple: ['#6a6cb0', '#c9f2e6'],
  mirror: ['#dfe6ff', '#eefaff'], leaf: ['#5fae9a', '#6fbf7a'], leafS: ['#468a7e', '#4fa066'],
};
const THEMES = {
  marais: {},
  foret: {
    bgTop: ['#0f1c2a', '#d6ecbc'], bgBot: ['#1c3540', '#6fb98c'],
    top: ['#a6c6d4', '#fbf4d8'], left: ['#6690a6', '#e7bd90'], right: ['#43677e', '#8dba9c'],
    reed: ['#4f8290', '#3f8f5f'], ripple: ['#4f7e8e', '#e6f6cf'],
    roof: ['#7fd09a', '#5fae6c'], roofS: ['#569a72', '#468f58'],
  },
  falaises: {
    bgTop: ['#0f1630', '#c6e8f2'], bgBot: ['#1c2e5c', '#58a6cb'],
    top: ['#b0bbec', '#fff5e2'], left: ['#6e7cba', '#f0bba2'], right: ['#47538e', '#a8b6de'],
    reed: ['#5a6cb0', '#4f8fb0'], ripple: ['#5f74ba', '#e6f6ff'],
  },
  montagne: {
    bgTop: ['#15122c', '#fbdcd4'], bgBot: ['#2c2752', '#b8a6d8'],
    top: ['#c6c2f0', '#fbf9ff'], left: ['#8580c0', '#dcc6ec'], right: ['#57528e', '#a094d0'],
    ripple: ['#8f8ad0', '#ffffff'], roof: ['#8fa6f2', '#8f9fe0'], roofS: ['#6a7cc4', '#6f7fc0'],
  },
  ciel: {
    bgTop: ['#08081c', '#ffe9bd'], bgBot: ['#1c1a44', '#f2a78f'],
    top: ['#bcb8f0', '#fffbf0'], left: ['#7a76ba', '#f5c3aa'], right: ['#4e4a8a', '#c79cd2'],
    ripple: ['#a9a6e6', '#fff6d8'], roof: ['#f2c76a', '#f2b35a'], roofS: ['#c49a4a', '#d0903c'],
  },
};
const RAISE_COLOR = { r: 'p', s: 'q', k: 'k', j: 'j', u: 'u', v: 'v' };

const iso = (x, y) => [(x - y) * HW, (x + y) * HH];
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

export class Diorama {
  constructor(game) {
    this.g = game;
    const st = game.state;
    this.chapter = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, st.chapter | 0))];
    this.stage = Math.max(0, Math.min(this.chapter.levels.length - 1, st.stage | 0));
    this.C = { ...BASE, ...THEMES[this.chapter.id] };
    game.mood(false);
    this.load();
  }

  load() {
    this.lv = this.chapter.levels[this.stage];
    this.final = this.stage === this.chapter.levels.length - 1;
    const L = this.L = R.parse(this.lv);
    this.s = R.start(L);
    this.t = 0;
    this.sel = 'girl';
    this.done = false;
    this.doneT = 0;
    this.base = 0;
    this.wheelA = 0;
    this.pendingTurn = false;
    this.ripples = [];
    this.idle = 0;
    this.hint = null;
    this.zoomK = 0;
    this.overview = false;
    this.cam = null;
    this.resetArm = 0;
    this.opts = this.g.state.opts;
    this.tutorial = (this.g.state.chapter | 0) === 0 && this.stage === 0 && this.opts.hints !== 'never';
    this.ask = false;
    this.mirT = 1;
    this.beamA = R.beam(L, this.s)?.lit ? 1 : 0;
    this.br = L.pivot ? { turning: false, t: 0, riders: [] } : null;
    this.cells = [];
    this.raise = new Map();
    this.bounds = null;
    L.map.forEach((row, y) => [...row].forEach((c, x) => {
      this.cells.push([x, y, c]);
      if (RAISE_COLOR[c]) this.raise.set(x + ',' + y, R.isUp(L, this.s, c, x, y) ? 1 : 0);
    }));
    const mk = ([x, y]) => ({ fx: x, fy: y, dx: x, dy: y, path: [], step: null, face: 1, sink: 0, moving: false });
    this.anim = { girl: mk(this.s.girl), fox: mk(this.s.fox) };
    const r = rng(11 + this.stage * 7 + (this.g.state.chapter | 0) * 31);
    this.reeds = [];
    for (const [x, y, c] of this.cells) {
      if (c !== '.' || this.nearPivot(x, y) || r() > 0.2) continue;
      this.reeds.push([x + (r() - 0.5) * 0.5, y + (r() - 0.5) * 0.5, 10 + r() * 12, r() * 6]);
    }
    this.waves = [];
    for (let i = 0; i < 40; i++) this.waves.push([r(), r(), 10 + r() * 26, r() * 6]);
  }

  nearPivot(x, y) {
    const p = this.L.pivot;
    return p && Math.abs(x - p[0]) + Math.abs(y - p[1]) <= 1;
  }

  touch() {
    this.idle = 0;
    this.hint = null;
  }

  // Chemin pour `who` jusqu'à `to`, en tenant compte des bascules traversées en route.
  route(who, to) {
    const L = this.L;
    const k = s => s[who] + ',' + s.flip;
    const prev = new Map([[k(this.s), null]]);
    const queue = [this.s];
    while (queue.length) {
      const cur = queue.shift();
      if (same(cur[who], to)) {
        const out = [];
        for (let c = cur; prev.get(k(c)); c = prev.get(k(c))) out.unshift(c[who]);
        return out;
      }
      for (const m of R.moves(L, cur, who)) {
        const n = R.step(L, cur, who, m);
        if (prev.has(k(n))) continue;
        prev.set(k(n), cur);
        queue.push(n);
      }
    }
    return null;
  }

  // Sur petit écran le diorama entier donnerait des cases trop petites pour le doigt :
  // on zoome alors sur le personnage actif, et la caméra le suit.
  layout() {
    const v = this.g.view;
    if (!this.bounds) {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [x, y, c] of this.cells) {
        if (c === '.' && !this.nearPivot(x, y)) continue;
        const [sx, sy] = iso(x, y);
        x0 = Math.min(x0, sx - HW); x1 = Math.max(x1, sx + HW);
        y0 = Math.min(y0, sy - HH); y1 = Math.max(y1, sy + HH);
      }
      this.bounds = { x0, x1, y0: y0 - (this.final ? 120 : 70), y1: y1 + 40 };
    }
    const { x0, x1, y0, y1 } = this.bounds;
    const fit = Math.min((v.w - 28) / (x1 - x0), (v.h - 170) / (y1 - y0), 2.3);
    const close = Math.max(fit, MIN_TILE / (HW * 2));
    this.canZoom = close > fit * 1.08 && this.opts.zoom !== 'far';
    const k = this.canZoom ? ease(this.zoomK) : 0;
    this.sc = fit + (close - fit) * k;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const a = this.anim[this.sel];
    const [ax, ay] = iso(a.dx, a.dy);
    const halfW = v.w / 2 / close - 24, halfH = (v.h - 50) / 2 / close - 60;
    const clampTo = (val, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, val)));
    this.aim = [clampTo(ax, x0 + halfW, x1 - halfW), clampTo(ay - 20, y0 + halfH, y1 - halfH)];
    if (!this.cam) this.cam = [...this.aim];
    const cx = mx + (this.cam[0] - mx) * k, cy = my + (this.cam[1] - my) * k;
    this.ox = v.w / 2 - cx * this.sc;
    this.oy = (v.h - 50) / 2 + 20 - cy * this.sc;
    this.ui = {
      girl: [v.w / 2 - 36, v.h - 46],
      fox: [v.w / 2 + 36, v.h - 46],
      reset: [38, 38],
      view: [90, 38],
    };
  }

  pointer(type, sx, sy) {
    if (type !== 'down' || this.done) return;
    this.layout();
    const near = (p, r) => Math.hypot(sx - p[0], sy - p[1]) < r;
    if (near(this.ui.girl, 30)) { this.sel = 'girl'; this.g.sfx('tap'); return; }
    if (near(this.ui.fox, 30)) {
      // toucher le renard déjà choisi : il montre où aller
      if (this.sel === 'fox') this.ask = true;
      this.sel = 'fox';
      this.g.sfx('yip');
      return;
    }
    if (near(this.ui.reset, 24)) {
      // deux appuis pour recommencer, pour ne pas tout perdre d'un doigt qui glisse
      if (this.resetArm > 0) this.load();
      else this.resetArm = 2.5;
      this.g.sfx('tap');
      return;
    }
    if (this.canZoom && near(this.ui.view, 24)) { this.overview = !this.overview; this.g.sfx('tap'); return; }
    for (const who of ['girl', 'fox']) {
      const a = this.anim[who];
      const [ix, iy] = iso(a.dx, a.dy);
      if (Math.hypot(sx - (this.ox + ix * this.sc), sy - (this.oy + (iy - 20) * this.sc)) > 18 * this.sc) continue;
      if (who !== this.sel) {
        // toucher le corps de l'autre personnage le sélectionne
        this.sel = who;
        this.g.sfx(who === 'fox' ? 'yip' : 'tap');
        return;
      }
      if (who === 'fox') { this.ask = true; this.g.sfx('yip'); return; }
    }
    const lx = (sx - this.ox) / this.sc, ly = (sy - this.oy) / this.sc;
    const x = Math.round((lx / HW + ly / HH) / 2), y = Math.round((ly / HH - lx / HW) / 2);
    this.tap(x, y, lx, ly);
  }

  key(type, k) {
    if (type !== 'down' || this.done) return;
    if (k === 'Tab' || k === ' ') this.sel = this.sel === 'girl' ? 'fox' : 'girl';
    if (k === 'r') this.load();
    if (k === 'h') this.ask = true;
    const d = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[k];
    const me = this.s[this.sel];
    if (d && !this.anim[this.sel].step) this.tap(me[0] + d[0], me[1] + d[1]);
    if (k === 'Enter') this.tap(this.s.girl[0], this.s.girl[1]);
  }

  tap(x, y, lx, ly) {
    const s = this.s;
    if (R.wheel(this.L, s) && same(s.girl, [x, y]) && !this.anim.girl.step) {
      this.pendingTurn = true;
      this.touch();
      return;
    }
    const path = this.route(this.sel, [x, y]);
    if (path && path.length) {
      this.anim[this.sel].path = path;
      this.touch();
    } else if (!path && lx !== undefined) {
      this.ripples.push({ x: lx, y: ly, t: 0 });
    }
  }

  angle() {
    const b = this.br;
    const k = b.turning ? ease(b.t) : 0;
    return this.s.vert ? (Math.PI / 2) * (1 - k) : (Math.PI / 2) * k;
  }

  update(dt) {
    this.t += dt;
    const st = this.g.state, L = this.L, b = this.br;
    const turning = b && b.turning;

    for (const who of ['girl', 'fox']) {
      const a = this.anim[who];
      // on enchaîne les cases sans temps mort : le reste du temps d'un pas passe au suivant
      let budget = dt;
      while (budget > 1e-6) {
        if (!a.step) {
          if (!a.path.length || turning) break;
          const next = a.path[0], from = this.s[who];
          if (!R.moves(L, this.s, who).some(m => same(m, next))) { a.path = []; break; }
          a.path.shift();
          const jump = Math.abs(next[0] - from[0]) + Math.abs(next[1] - from[1]) > 1;
          const d = iso(next[0], next[1])[0] - iso(from[0], from[1])[0];
          if (d) a.face = Math.sign(d);
          const before = this.s;
          this.s = R.step(L, this.s, who, next);
          a.step = { from, to: next, t: 0, jump };
          const c = R.cell(L, next[0], next[1]);
          if (jump) this.g.sfx('burrow');
          else if (before.flip !== this.s.flip) this.g.sfx('toggle');
          else if (c === 'p' || c === 'q') this.g.sfx('plate');
          else this.g.sfx(who === 'fox' ? 'pad' : 'step');
        }
        const sp = a.step, speed = sp.jump ? 1.7 : who === 'fox' ? 6.2 : 5;
        const use = Math.min(budget, (1 - sp.t) / speed);
        sp.t += use * speed;
        budget -= use;
        const k = Math.min(1, sp.t);
        if (sp.jump) {
          const half = k < 0.5;
          [a.fx, a.fy] = half ? sp.from : sp.to;
          a.sink = half ? k * 2 : 2 - k * 2;
        } else {
          a.fx = sp.from[0] + (sp.to[0] - sp.from[0]) * k;
          a.fy = sp.from[1] + (sp.to[1] - sp.from[1]) * k;
        }
        if (sp.t >= 1 - 1e-6) { a.step = null; a.sink = 0; }
      }
      // la position affichée suit en douceur : départs, arrêts et virages arrondis
      const follow = a.step && a.step.jump ? 1 : 1 - Math.exp(-dt * 16);
      a.dx += (a.fx - a.dx) * follow;
      a.dy += (a.fy - a.dy) * follow;
      a.moving = (!!a.step && !a.step.jump) || a.path.length > 0 || Math.hypot(a.fx - a.dx, a.fy - a.dy) > 0.06;
    }
    const still = ['girl', 'fox'].every(w => !this.anim[w].step && !this.anim[w].path.length);

    if (this.pendingTurn && still && !turning) {
      this.pendingTurn = false;
      const w = R.wheel(L, this.s);
      if (w === 'W') {
        b.turning = true;
        b.t = 0;
        b.riders = R.riders(L, this.s);
        this.g.sfx('wheel');
      } else if (w === 'Y') {
        this.s = R.turn(L, this.s);
        this.mirT = 0;
        this.g.sfx('mirror');
      }
    }
    if (b && b.turning) {
      b.t += dt / 0.7;
      this.wheelA += dt * 5;
      const a = this.angle(), [px, py] = L.pivot;
      for (const { who, d } of b.riders) {
        const r = this.anim[who];
        r.fx = r.dx = px + d * Math.cos(a);
        r.fy = r.dy = py + d * Math.sin(a);
      }
      if (b.t >= 1) {
        b.turning = false;
        this.s = R.turn(L, this.s);
        for (const { who } of b.riders) { const r = this.anim[who]; [r.fx, r.fy] = this.s[who]; [r.dx, r.dy] = this.s[who]; }
      }
    }
    if (this.mirT < 1) {
      this.mirT = Math.min(1, this.mirT + dt / 0.5);
      this.wheelA += dt * 5;
    }
    if (L.beams) {
      const target = R.beam(L, this.s).lit && this.mirT >= 1 ? 1 : 0;
      if (target && this.beamA === 0) this.g.sfx('crystal');
      this.beamA += Math.sign(target - this.beamA) * Math.min(Math.abs(target - this.beamA), dt * 3);
    }
    for (const [x, y, c] of this.cells) {
      if (!RAISE_COLOR[c]) continue;
      const k = x + ',' + y, z = this.raise.get(k);
      const target = R.isUp(L, this.s, c, x, y) && !(c === 'k' && this.mirT < 1 && !this.beamA) ? 1 : 0;
      this.raise.set(k, z + Math.sign(target - z) * Math.min(Math.abs(target - z), dt * 5));
    }
    for (const r of this.ripples) r.t += dt * 1.6;
    this.ripples = this.ripples.filter(r => r.t < 1);

    // l'indice : après un moment sans bouger, le renard regarde vers le prochain endroit utile
    if (!this.done && still && !turning) {
      this.idle += dt;
      // selon le réglage : tout seul après un moment, seulement à la demande, ou jamais
      const wait = this.tutorial && this.t < 60 ? 2.5 : this.opts.hints === 'auto' ? HINT_AFTER : Infinity;
      const asked = this.ask && this.opts.hints !== 'never';
      this.ask = false;
      if ((this.idle > wait || asked) && !this.hint) {
        this.hint = R.hint(L, this.s);
        if (this.hint && !this.tutorial) this.g.sfx('yip');
      }
    }

    // vue d'ensemble au début, à la fin, pendant un indice ou à la demande ; sinon vue rapprochée
    this.layout();
    const always = this.opts.zoom === 'near';
    const near = (always || this.t > 1.6) && !this.done && !this.overview && !this.hint && (always || !this.tutorial);
    const calm = this.opts.calm;   // moins d'animations : la vue change d'un coup, sans glisser
    this.zoomK = calm ? +near : this.zoomK + Math.sign(+near - this.zoomK) * Math.min(Math.abs(+near - this.zoomK), dt * 1.6);
    const glide = calm ? 1 : 1 - Math.exp(-dt * 4);
    this.cam[0] += (this.aim[0] - this.cam[0]) * glide;
    this.cam[1] += (this.aim[1] - this.cam[1]) * glide;
    this.resetArm = Math.max(0, this.resetArm - dt);

    if (!this.done && !this.anim.girl.step && R.solved(L, this.s)) {
      this.done = true;
      this.hint = null;
      if (this.final) {
        st.lit = true;
        st.best = Math.max(st.best | 0, (st.chapter | 0) + 1);
        st.bridge = true;
        st.x = CAMP - 240;
        this.g.mood(true);
        this.g.sfx('relight');
      } else {
        st.stage = this.stage + 1;
        this.g.sfx('light');
      }
      this.g.save();
    }
    if (this.done) {
      const before = this.doneT;
      this.doneT += dt;
      const end = this.final ? 4.2 : 2.6;
      if (before < end && this.doneT >= end) this.g.go(this.final ? 'road' : 'diorama');
    }
  }

  block(ctx, x, y, z, top, L, alpha = 1) {
    const C = this.C;
    const [cx, cy0] = iso(x, y);
    const cy = cy0 - z, D = 46, e = 0.5;
    ctx.globalAlpha = alpha;
    const gl = ctx.createLinearGradient(0, cy, 0, cy + D + HH);
    gl.addColorStop(0, mix(C.left, L));
    gl.addColorStop(1, mix(C.left, L, 0));
    poly(ctx, [cx - HW - e, cy, cx, cy + HH, cx, cy + HH + D, cx - HW - e, cy + D], gl);
    const gr = ctx.createLinearGradient(0, cy, 0, cy + D + HH);
    gr.addColorStop(0, mix(C.right, L));
    gr.addColorStop(1, mix(C.right, L, 0));
    poly(ctx, [cx, cy + HH, cx + HW + e, cy, cx + HW + e, cy + D, cx, cy + HH + D], gr);
    poly(ctx, [cx, cy - HH - e, cx + HW + e, cy, cx, cy + HH + e, cx - HW - e, cy], top);
    ctx.globalAlpha = 1;
  }

  // Le même motif gravé sur une dalle et sur ce qui la commande : on les relie sans se fier à la couleur.
  glyph(ctx, kind, cx, cy, col, k = 1) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const a = 9 * k, b = 4.5 * k;
    if (kind === 'p') {
      ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2);
    } else if (kind === 'q') {
      ctx.moveTo(cx - a, cy - b); ctx.lineTo(cx + a, cy + b);
      ctx.moveTo(cx - a, cy + b); ctx.lineTo(cx + a, cy - b);
    } else if (kind === 'u') {
      ctx.moveTo(cx - a, cy); ctx.lineTo(cx + a, cy);
    } else if (kind === 'v') {
      ctx.moveTo(cx - a, cy - 2.5); ctx.lineTo(cx + a, cy - 2.5);
      ctx.moveTo(cx - a, cy + 2.5); ctx.lineTo(cx + a, cy + 2.5);
    } else if (kind === 'k') {
      ctx.moveTo(cx, cy - b * 1.3); ctx.lineTo(cx + a, cy); ctx.lineTo(cx, cy + b * 1.3); ctx.lineTo(cx - a, cy);
      ctx.closePath();
    } else if (kind === 'j') {
      // le losange barré : levée quand le cristal est éteint
      ctx.moveTo(cx, cy - b * 1.3); ctx.lineTo(cx + a, cy); ctx.lineTo(cx, cy + b * 1.3); ctx.lineTo(cx - a, cy);
      ctx.closePath();
      ctx.moveTo(cx - a, cy); ctx.lineTo(cx + a, cy);
    }
    ctx.stroke();
  }

  diamond(ctx, x, y, z, k, fill) {
    const [cx, cy0] = iso(x, y);
    const cy = cy0 - z;
    poly(ctx, [cx, cy - HH * k, cx + HW * k, cy, cx, cy + HH * k, cx - HW * k, cy], fill);
  }

  arm(ctx, d, a, L) {
    const [px, py] = this.L.pivot;
    const ux = Math.cos(a) * d, uy = Math.sin(a) * d, vx = -Math.sin(a) * 0.36, vy = Math.cos(a) * 0.36;
    const corner = (l, w) => iso(px + ux * l + vx * w, py + uy * l + vy * w);
    const q = [corner(0.3, -1), corner(1.5, -1), corner(1.5, 1), corner(0.3, 1)];
    poly(ctx, q.flatMap(([x, y]) => [x, y + 7]), mix(this.C.plankS, L));
    poly(ctx, q.flat(), mix(this.C.plank, L));
  }

  wheelProp(ctx, x, y, c, L, t) {
    const [cx, cy0] = iso(x, y);
    const cy = cy0 - 7, wy = cy - 25;
    const col = R.cell(this.L, x, y) === 'Y' ? c('mirror') : c('plank');
    ctx.fillStyle = c('ink');
    ctx.fillRect(cx - 2.5, cy - 23, 5, 24);
    ctx.strokeStyle = c('hole');
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(cx, wy, 15, 7.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.6;
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = this.wheelA + (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * 15, wy - Math.sin(a) * 7.5);
      ctx.lineTo(cx + Math.cos(a) * 15, wy + Math.sin(a) * 7.5);
      ctx.stroke();
    }
    disc(ctx, cx, wy, 3, c('ink'));
    const busy = (this.br && this.br.turning) || this.mirT < 1 || this.anim.girl.step;
    if (same(this.s.girl, [x, y]) && !busy && !this.done) ring(ctx, cx, wy, t, 16);
  }

  // La lumière du lieu : un simple lampadaire, ou le grand monument de la dernière étape.
  goalProp(ctx, x, y, c, L, t) {
    const C = this.C, id = this.chapter.id;
    const [cx, cy0] = iso(x, y);
    const on = ease(Math.min(1, this.doneT / 0.8));
    const glass = mix(C.glass, on);
    let top = 54;
    if (!this.final) {
      const cy = cy0 - 8;
      ctx.fillStyle = c('ink');
      ctx.fillRect(cx - 1.5, cy - 38, 3, 39);
      ctx.fillRect(cx - 6, cy - 40, 12, 2.5);
      ctx.fillRect(cx - 6, cy - 55, 12, 2.5);
      ctx.fillStyle = glass;
      ctx.fillRect(cx - 4.5, cy - 52.5, 9, 12.5);
      if (on) glow(ctx, cx, cy - 46, 30 + on * 50, 0.6 * on);
    } else if (id === 'foret') {
      // l'arbre aux lucioles
      const cy = cy0 - 6;
      poly(ctx, [cx - 5, cy, cx + 5, cy, cx + 3, cy - 40, cx - 3, cy - 40], c('towerR'));
      const blob = (dx, dy, r, col) => poly(ctx, [cx + dx - r, cy + dy, cx + dx - r * 0.6, cy + dy - r * 0.8, cx + dx, cy + dy - r, cx + dx + r * 0.7, cy + dy - r * 0.7, cx + dx + r, cy + dy, cx + dx + r * 0.5, cy + dy + r * 0.6, cx + dx - r * 0.5, cy + dy + r * 0.6], col);
      blob(-14, -44, 18, c('leafS'));
      blob(14, -48, 19, c('leafS'));
      blob(0, -62, 22, c('leaf'));
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4 + t * 0.4, rr = 8 + (i % 4) * 7;
        const fx = cx + Math.cos(a) * rr * 1.3, fy = cy - 56 + Math.sin(a * 1.3) * rr * 0.8;
        if (on) glow(ctx, fx, fy, 8, 0.6 * on * (0.6 + 0.4 * Math.sin(t * 3 + i)));
        disc(ctx, fx, fy, 1.5, mix(C.glass, on));
      }
      if (on) glow(ctx, cx, cy - 56, 50 + on * 60, 0.4 * on);
      top = 96;
    } else if (id === 'montagne') {
      // l'observatoire
      const cy = cy0 - 6, w = 17, h = 34;
      poly(ctx, [cx - w, cy - 3, cx, cy + 5, cx, cy + 5 - h, cx - w, cy - 3 - h], c('towerL'));
      poly(ctx, [cx, cy + 5, cx + w, cy - 3, cx + w, cy - 3 - h, cx, cy + 5 - h], c('towerR'));
      poly(ctx, [cx - 4, cy, cx, cy + 3, cx, cy - 12, cx - 4, cy - 15], c('hole'));
      ctx.beginPath();
      ctx.ellipse(cx, cy - h - 1, w, 19, 0, Math.PI, 0);
      ctx.fillStyle = c('roof');
      ctx.fill();
      poly(ctx, [cx - 3, cy - h - 19, cx + 3, cy - h - 19, cx + 5, cy - h - 2, cx - 1, cy - h - 2], glass);
      if (on) {
        glow(ctx, cx, cy - h - 12, 36 + on * 60, 0.6 * on);
        ctx.strokeStyle = `rgba(255,240,200,${0.5 * on})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + 1, cy - h - 18);
        ctx.lineTo(cx + 40, cy - h - 170);
        ctx.stroke();
      }
      top = 80;
    } else if (id === 'ciel') {
      // l'étoile sur son socle
      const cy = cy0 - 6;
      poly(ctx, [cx - 9, cy - 2, cx, cy + 3, cx, cy - 22, cx - 9, cy - 27], c('towerL'));
      poly(ctx, [cx, cy + 3, cx + 9, cy - 2, cx + 9, cy - 27, cx, cy - 22], c('towerR'));
      const sy = cy - 58 + Math.sin(t * 1.6) * 3, pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5 + t * 0.3 * on, rr = i % 2 ? 9 : 21;
        pts.push(cx + Math.cos(a) * rr, sy + Math.sin(a) * rr);
      }
      if (on) glow(ctx, cx, sy, 50 + on * 90, 0.7 * on);
      poly(ctx, pts, glass);
      top = 96;
    } else {
      // la tour (marais) ou le phare (falaises)
      const cy = cy0 - 6, w = 14, h = id === 'falaises' ? 70 : 58;
      poly(ctx, [cx - w, cy - 3, cx, cy + 4, cx, cy + 4 - h, cx - w, cy - 3 - h], c('towerL'));
      poly(ctx, [cx, cy + 4, cx + w, cy - 3, cx + w, cy - 3 - h, cx, cy + 4 - h], c('towerR'));
      if (id === 'falaises') {
        for (const f of [0.3, 0.62]) {
          const yy = cy - h * f;
          poly(ctx, [cx - w, yy - 3, cx, yy + 4, cx, yy - 8, cx - w, yy - 15], c('roof'));
          poly(ctx, [cx, yy + 4, cx + w, yy - 3, cx + w, yy - 15, cx, yy - 8], c('roofS'));
        }
      }
      poly(ctx, [cx - 4, cy - 1, cx, cy + 2, cx, cy - 14, cx - 4, cy - 17], c('hole'));
      const ty = cy - h;
      poly(ctx, [cx - w - 3, ty - 3, cx, ty + 5, cx + w + 3, ty - 3, cx, ty - 11], c('top'));
      poly(ctx, [cx - 10, ty - 5, cx, ty, cx, ty - 17, cx - 10, ty - 22], glass);
      poly(ctx, [cx, ty, cx + 10, ty - 5, cx + 10, ty - 22, cx, ty - 17], glass);
      poly(ctx, [cx - 13, ty - 21, cx, ty - 15, cx, ty - 46], c('roof'));
      poly(ctx, [cx, ty - 15, cx + 13, ty - 21, cx, ty - 46], c('roofS'));
      ctx.fillStyle = c('ink');
      ctx.fillRect(cx - 0.6, ty - 60, 1.2, 15);
      poly(ctx, [cx, ty - 60, cx + 16, ty - 57 + Math.sin(t * 3) * 2, cx, ty - 53], c('roof'));
      if (on) glow(ctx, cx, ty - 12, 40 + on * 70, 0.65 * on);
      if (on && id === 'falaises') {
        const a = t * 1.2;
        ctx.fillStyle = `rgba(255,236,170,${0.22 * on})`;
        for (const s of [1, -1]) poly(ctx, [cx, ty - 12, cx + s * Math.cos(a) * 260, ty - 40 + Math.sin(a) * 50, cx + s * Math.cos(a) * 260, ty + 16 + Math.sin(a) * 50], ctx.fillStyle);
      }
      top = h + 26;
    }
    if (!this.done) {
      glow(ctx, cx, cy0 - top, 17 + Math.sin(t * 1.5) * 2, 0.5);
      disc(ctx, cx, cy0 - top, 2.6, 'rgba(255,236,190,0.95)');
    }
  }

  draw(ctx) {
    this.layout();
    const v = this.g.view, t = this.t, C = this.C, LV = this.L, s = this.s;
    const L = this.base + (1 - this.base) * ease(Math.min(1, this.doneT / 1.8));
    const c = n => mix(C[n], L);
    const watery = !['montagne', 'ciel'].includes(this.chapter.id);

    const bg = ctx.createLinearGradient(0, 0, 0, v.h);
    bg.addColorStop(0, c('bgTop'));
    bg.addColorStop(1, c('bgBot'));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, v.w, v.h);
    ctx.fillStyle = c('ripple');
    for (const [u, w, len, ph] of this.waves) {
      ctx.globalAlpha = (watery ? 0.1 : 0.3) + 0.08 * Math.sin(t + ph);
      if (watery) ctx.fillRect(u * v.w + Math.sin(t * 0.5 + ph) * 8, v.h * (0.2 + w * 0.8), len, 1.5);
      else ctx.fillRect(u * v.w, v.h * w, 1.6 + (len % 2), 1.6 + (len % 2));
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(this.ox, this.oy);
    ctx.scale(this.sc, this.sc);

    // — passe 1 : le sol, du fond vers l'avant —
    const tiles = [];
    for (const [x, y, ch] of this.cells) {
      if (ch === '.') continue;
      tiles.push([x + y, () => {
        const [cx, cy] = iso(x, y);
        if (ch === 'o') {
          const bob = Math.sin(t * 1.4 + x * 2 + y) * 1.2;
          for (const [dy, col] of [[5, 'lilyS'], [3, 'lily']]) {
            ctx.beginPath();
            ctx.ellipse(cx, cy + dy + bob, 23, 11.5, 0, 0.35, Math.PI * 2);
            ctx.lineTo(cx, cy + dy + bob);
            ctx.fillStyle = c(col);
            ctx.fill();
          }
          return;
        }
        if (RAISE_COLOR[ch]) {
          const k = this.raise.get(x + ',' + y), col = mix(C[RAISE_COLOR[ch]], L);
          this.block(ctx, x, y, -15 * (1 - k), col, L, 0.35 + 0.65 * k);
          this.glyph(ctx, RAISE_COLOR[ch], cx, cy + 15 * (1 - k), 'rgba(40,30,70,0.5)');
          if (k < 0.98) {
            // baissée : un contour pointillé montre où le chemin peut apparaître
            ctx.globalAlpha = 1 - k;
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(cx, cy - HH + 2);
            ctx.lineTo(cx + HW - 4, cy);
            ctx.lineTo(cx, cy + HH - 2);
            ctx.lineTo(cx - HW + 4, cy);
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
          }
          return;
        }
        this.block(ctx, x, y, 0, c('top'), L);
        if (ch === 'p' || ch === 'q') {
          const down = same(s.girl, [x, y]) || same(s.fox, [x, y]);
          this.diamond(ctx, x, y, 0, 0.62, c('right'));
          this.diamond(ctx, x, y, down ? 0 : 2.5, 0.54, mix(C[ch], L));
          this.glyph(ctx, ch, cx, cy - (down ? 0 : 2.5), 'rgba(40,30,70,0.5)', 0.7);
        } else if (ch === 't') {
          // bascule : la moitié levée montre quelle couleur de dalle est en haut
          this.diamond(ctx, x, y, 0, 0.66, c('right'));
          const up = s.flip ? 'v' : 'u', dn = s.flip ? 'u' : 'v';
          poly(ctx, [cx, cy - HH * 0.56 - 3, cx + HW * 0.56, cy - 3, cx, cy + HH * 0.56 - 3, cx, cy - 3], mix(C[up], L));
          poly(ctx, [cx, cy - HH * 0.56, cx, cy + HH * 0.56, cx - HW * 0.56, cy], mix(C[dn], L, 0.75));
        } else if (ch === 'a' || ch === 'b') {
          ctx.beginPath();
          ctx.ellipse(cx, cy - 1, 15, 7.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = c('right');
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(cx, cy + 0.5, 12, 5.6, 0, 0, Math.PI * 2);
          ctx.fillStyle = c('hole');
          ctx.fill();
        } else if (ch === 'P') {
          ctx.beginPath();
          ctx.ellipse(cx, cy, 15, 7.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = c('plankS');
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(cx, cy - 2, 9, 4.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = c('plank');
          ctx.fill();
        }
      }]);
    }
    if (this.br) {
      const a = this.angle(), [px, py] = LV.pivot;
      for (const d of [-1, 1]) {
        tiles.push([px + py + d * (Math.cos(a) + Math.sin(a)) * 0.9, () => this.arm(ctx, d, a, L)]);
      }
    }
    tiles.sort((a, b) => a[0] - b[0]);
    for (const [, fn] of tiles) fn();

    for (const r of this.ripples) {
      ctx.strokeStyle = mix(C.ripple, L, 0.7 * (1 - r.t));
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, 6 + r.t * 18, 3 + r.t * 9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // — passe 2 : tout ce qui dépasse du sol, trié par profondeur —
    const props = [];
    if (watery) {
      for (const [x, y, h, ph] of this.reeds) {
        props.push([x + y, () => {
          const [cx, cy] = iso(x, y);
          for (let i = -1; i <= 1; i++) {
            const sway = Math.sin(t + ph + i) * 1.5;
            poly(ctx, [cx + i * 5 - 1.5, cy, cx + i * 7 + sway, cy - h - i * 3, cx + i * 5 + 1.5, cy], c('reed'));
          }
        }]);
      }
    }
    for (const [x, y, ch] of this.cells) {
      const [cx, cy] = iso(x, y);
      if (ch === 'W' || ch === 'Y') props.push([x + y - 0.1, () => this.wheelProp(ctx, x, y, c, L, t)]);
      else if (ch === 'L') props.push([x + y - 0.1, () => this.goalProp(ctx, x, y, c, L, t)]);
      else if (ch === 'E') props.push([x + y, () => {
        glow(ctx, cx, cy - 16, 26, 0.5, '200,240,255');
        poly(ctx, [cx, cy - 28, cx + 7, cy - 16, cx, cy - 4, cx - 7, cy - 16], '#dff6ff');
        poly(ctx, [cx, cy - 28, cx + 7, cy - 16, cx, cy - 16], '#ffffff');
      }]);
      else if (ch === 'K') props.push([x + y, () => {
        const a = this.beamA;
        if (a) glow(ctx, cx, cy - 16, 22 + a * 26, 0.6 * a, '160,230,255');
        poly(ctx, [cx, cy - 30, cx + 8, cy - 18, cx + 5, cy - 3, cx - 5, cy - 3, cx - 8, cy - 18], mix(['#5f6aa0', '#9fe6ff'], a));
        poly(ctx, [cx, cy - 30, cx + 8, cy - 18, cx, cy - 14], mix(['#7d88bd', '#e6fbff'], a));
      }]);
      else if (ch === 'M' || ch === 'N') props.push([x + y, () => {
        const slash = (ch === 'M') !== s.mir;
        const to = slash ? -Math.PI / 4 : Math.PI / 4;
        const a = to + (slash ? 1 : -1) * (Math.PI / 2) * (1 - ease(this.mirT));
        const dx = Math.cos(a) * 0.4, dy = Math.sin(a) * 0.4;
        const [ax, ay] = iso(x - dx, y - dy), [bx, by] = iso(x + dx, y + dy);
        ctx.fillStyle = c('ink');
        ctx.fillRect(cx - 1.5, cy - 8, 3, 8);
        ctx.beginPath();
        ctx.moveTo(ax, ay - 8);
        ctx.lineTo(bx, by - 8);
        ctx.lineTo(bx, by - 32);
        ctx.lineTo(ax, ay - 32);
        ctx.closePath();
        ctx.fillStyle = c('mirror');
        ctx.fill();
        ctx.strokeStyle = c('ink');
        ctx.lineWidth = 2;
        ctx.stroke();
      }]);
    }
    const shared = same(s.girl, s.fox) && !this.anim.girl.moving && !this.anim.fox.moving;
    for (const who of ['fox', 'girl']) {
      const a = this.anim[who];
      props.push([a.dx + a.dy + (who === 'girl' ? 0.05 : 0), () => {
        let [cx, cy] = iso(a.dx, a.dy);
        if (shared) cx += who === 'fox' ? -12 : 8;
        const moving = a.moving;
        const here = this.s[who], ch = R.cell(LV, here[0], here[1]);
        const dz = RAISE_COLOR[ch] ? 15 * (1 - this.raise.get(here[0] + ',' + here[1])) : 0;
        if (who === this.sel && !this.done && !a.sink) {
          ctx.strokeStyle = `rgba(255,236,190,${0.65 + 0.25 * Math.sin(t * 4)})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(cx, cy + 1 + dz, 15, 7.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        const k = 0.62 * (1 - a.sink);
        if (k < 0.05) return;
        if (who === 'girl') {
          drawGirl(ctx, cx, cy + 2 + dz, k, a.face, t, moving);
        } else {
          let face = a.face, mode = moving ? 'walk' : this.done ? 'happy' : who === this.sel ? 'idle' : 'sit';
          if (this.hint && !moving) {
            // le renard se tourne vers l'endroit utile
            const d = iso(this.hint.to[0], this.hint.to[1])[0] - iso(a.dx, a.dy)[0];
            if (d) face = Math.sign(d);
            mode = 'sit';
            disc(ctx, cx + face * 4, cy - 40 + Math.sin(t * 5) * 2, 2.2, 'rgba(255,236,190,0.9)');
          }
          drawFox(ctx, cx, cy + 3 + dz, k, face, t, mode);
        }
      }]);
    }
    props.sort((a, b) => a[0] - b[0]);
    for (const [, fn] of props) fn();

    // le rayon passe au-dessus de tout
    if (LV.beams) {
      const path = R.beam(LV, s).path.map(([x, y]) => { const [px, py] = iso(x, y); return [px, py - 17]; });
      const a = this.mirT < 1 ? 0.25 : 1;
      for (const [w, col] of [[7, `rgba(190,235,255,${0.2 * a})`], [1.8, `rgba(235,250,255,${0.9 * a})`]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        path.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.stroke();
      }
    }

    if (this.hint && !this.done) {
      const [hx, hy] = iso(this.hint.to[0], this.hint.to[1]);
      paw(ctx, hx, hy - (this.hint.turn ? 46 : 0), t, 1 / Math.max(0.7, this.sc));
    }

    if (this.done) {
      const [gx, gy] = iso(LV.goal[0], LV.goal[1]);
      const k = this.doneT / 1.6;
      if (k < 1) {
        ctx.strokeStyle = `rgba(255,236,190,${0.8 * (1 - k)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(gx, gy - 20, k * 420, k * 210, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // — interface —
    const n = this.chapter.levels.length;
    for (let i = 0; i < n; i++) {
      const x = v.w / 2 + (i - (n - 1) / 2) * 22, lit = i < this.stage || (i === this.stage && this.done);
      if (lit) glow(ctx, x, 30, 13, 0.5);
      disc(ctx, x, 30, 4.5, lit ? '#ffdf8e' : 'rgba(255,255,255,0.22)');
    }
    for (const who of ['girl', 'fox']) {
      const [x, y] = this.ui[who], on = this.sel === who;
      const nudge = this.hint && this.hint.who === who && !on;
      if (on || nudge) glow(ctx, x, y, nudge ? 46 + Math.sin(t * 5) * 8 : 46, 0.35);
      disc(ctx, x, y, 27, on ? 'rgba(255,244,215,0.26)' : 'rgba(255,255,255,0.1)');
      ctx.strokeStyle = `rgba(255,244,215,${on ? 0.9 : 0.35})`;
      ctx.lineWidth = on ? 2 : 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 27, 0, Math.PI * 2);
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.clip();
      if (who === 'girl') drawGirl(ctx, x - 3, y + 21, 0.62, 1, 0, false);
      else drawFox(ctx, x + 2, y + 13, 0.62, 1, 0, 'sit');
      ctx.restore();
    }
    {
      const [x, y] = this.ui.reset, armed = this.resetArm > 0;
      uiButton(ctx, x, y, 'restart', { active: armed, glowing: armed });
      if (armed) {
        // le temps qu'il reste pour confirmer
        ctx.strokeStyle = '#ffd682';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 24, -Math.PI / 2, -Math.PI / 2 + (this.resetArm / 2.5) * Math.PI * 2);
        ctx.stroke();
      }
    }
    if (this.canZoom) uiButton(ctx, this.ui.view[0], this.ui.view[1], this.overview ? 'shrink' : 'expand', { active: this.overview });
    if (this.tutorial && this.hint && !this.done) {
      // le tout premier diorama : une main montre quoi toucher, d'abord le bon personnage, puis la case
      if (this.hint.who !== this.sel) {
        hand(ctx, this.ui[this.hint.who][0], this.ui[this.hint.who][1], t);
      } else {
        const [hx, hy] = iso(this.hint.to[0], this.hint.to[1]);
        hand(ctx, this.ox + hx * this.sc, this.oy + (hy - (this.hint.turn ? 30 : 0)) * this.sc, t);
      }
    }
  }
}
