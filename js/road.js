// Le sentier : marche en vue de côté à travers la région du chapitre, jusqu'au camp.
import { mix, ease, clamp, rng, poly, disc, glow, ring, hand, drawGirl, drawFox, icon } from './draw.js';
import { CHAPTERS } from './levels.js';

// Chaque couleur est une paire [éteint, rallumé].
const MARAIS = {
  skyTop: ['#1f1d3d', '#86cfc6'], skyBot: ['#5a4f7f', '#fde6c4'],
  far: ['#3d3a68', '#b4dfc9'], farS: ['#353260', '#9fd2bd'],
  mid: ['#312f59', '#8cc9b0'], midS: ['#2b2950', '#79bba3'],
  treeA: ['#292747', '#57a394'], treeAS: ['#222040', '#468c80'],
  treeB: ['#33315c', '#74b9a6'], treeBS: ['#2c2a52', '#63aa98'],
  edge: ['#9d9bd2', '#fff7dc'], ground: ['#5b578f', '#efd6ab'], under: ['#2f2c52', '#d3a58d'],
  water: ['#34356a', '#62c5b8'], waterD: ['#232347', '#3fa79c'], waterHi: ['#5d60a0', '#b9ece0'],
  reed: ['#1c1a36', '#2f7668'], post: ['#191830', '#6b4f63'], wood: ['#8f86bd', '#c98e6b'],
  moon: ['#d9d6f2', '#fff3cf'], bush: ['#4b4985', '#4f9f83'], bushS: ['#3c3a70', '#3f8a72'],
  cap: ['#8d8ac0', '#ffffff'],
};

// Par chapitre : les couleurs, la forme des arbres, le premier plan, les trouvailles, le goûter.
const THEMES = {
  marais: { C: MARAIS, tree: 'pine', front: 1, finds: ['feather', 'shell', 'stone'], food: 'berries' },
  foret: {
    tree: 'round', front: 0.8, finds: ['acorn', 'leaf', 'mushroom'], food: 'myrtilles',
    C: {
      ...MARAIS,
      skyTop: ['#16223a', '#bfe6c0'], skyBot: ['#3f5a6a', '#fdf3c8'],
      far: ['#2c4258', '#a9d9a8'], farS: ['#263a50', '#93cb98'],
      mid: ['#22364a', '#7fc08a'], midS: ['#1d2f42', '#6bb07a'],
      treeA: ['#182a3a', '#3f8f5c'], treeAS: ['#132332', '#33794d'],
      treeB: ['#21374a', '#62ab74'], treeBS: ['#1b3042', '#529a66'],
      edge: ['#8fb0c0', '#fbf6d6'], ground: ['#4f6f86', '#d9c48f'], under: ['#25384a', '#a98a62'],
      water: ['#223a52', '#6fc0a8'], waterD: ['#16283c', '#489a88'], waterHi: ['#4a6f8c', '#c9f0d8'],
      reed: ['#101e2c', '#2f7a4c'], post: ['#0f1a26', '#5c4a3a'], wood: ['#7f9bb0', '#b9835a'],
      bush: ['#3f6076', '#4f9f60'], bushS: ['#30506a', '#3f8a50'],
    },
  },
  falaises: {
    tree: 'rock', front: 0.45, finds: ['starfish', 'glass', 'driftwood'], food: 'argousier',
    C: {
      ...MARAIS,
      skyTop: ['#141c3c', '#9fd6ec'], skyBot: ['#4a4f86', '#ffe9cf'],
      far: ['#34407a', '#c9d6ee'], farS: ['#2d386e', '#b3c3e4'],
      mid: ['#2a3468', '#e9c9b0'], midS: ['#242d5c', '#d9b09a'],
      treeA: ['#222a55', '#c99a86'], treeAS: ['#1c2348', '#b08070'],
      treeB: ['#2c3668', '#dcb8a4'], treeBS: ['#262f5c', '#c9a18e'],
      edge: ['#a3a8dc', '#fff8e6'], ground: ['#5c649c', '#f0dcb8'], under: ['#2c3260', '#d0a890'],
      water: ['#2a3a78', '#4fa6cc'], waterD: ['#1a2452', '#2f80b0'], waterHi: ['#5a6cb0', '#c6ecfa'],
      reed: ['#161c3c', '#5f9f8a'], post: ['#141a36', '#6b5560'], wood: ['#8f96c8', '#c99a78'],
      bush: ['#4a5490', '#7fb08a'], bushS: ['#3c467c', '#6a9a78'],
    },
  },
  montagne: {
    tree: 'pine', front: 0, caps: true, finds: ['crystal', 'cone', 'snow'], food: 'eglantine',
    C: {
      ...MARAIS,
      skyTop: ['#1b1838', '#f6c9c4'], skyBot: ['#5a4c80', '#fff0dc'],
      far: ['#46427a', '#d9cdf0'], farS: ['#3c386c', '#c0b2e4'],
      mid: ['#38346a', '#c4b4e6'], midS: ['#302c5c', '#a998d6'],
      treeA: ['#262348', '#6f7fb8'], treeAS: ['#1f1c3e', '#5c6aa6'],
      treeB: ['#322f5c', '#93a0d0'], treeBS: ['#2a2750', '#7f8cc0'],
      edge: ['#c9c6ee', '#ffffff'], ground: ['#7a76b0', '#e9e2f6'], under: ['#35325c', '#b8a8d8'],
      water: ['#3a3668', '#e6dcf4'], waterD: ['#26234a', '#c4b6e4'], waterHi: ['#6a66a0', '#ffffff'],
      post: ['#191830', '#5a5080'], wood: ['#a39fd2', '#b89ac0'],
      bush: ['#5a5690', '#8f9fd0'], bushS: ['#48447c', '#7a8ac0'],
    },
  },
  ciel: {
    tree: 'cloud', front: 0, finds: ['stardust', 'moon', 'comet'], food: 'astres',
    C: {
      ...MARAIS,
      skyTop: ['#0b0a20', '#f7b79a'], skyBot: ['#2f2a60', '#ffeec4'],
      far: ['#2a2758', '#ffd9c0'], farS: ['#242150', '#f6c4ae'],
      mid: ['#332f66', '#fff1dc'], midS: ['#2b285a', '#f9dcc4'],
      treeA: ['#46427e', '#ffffff'], treeAS: ['#3a3670', '#f4e0d4'],
      treeB: ['#38346c', '#fff4e6'], treeBS: ['#302c60', '#f4d6c6'],
      edge: ['#b9b4ea', '#fffdf4'], ground: ['#6a66a8', '#f6dcc6'], under: ['#2c2958', '#e0b0a0'],
      water: ['#1c1a44', '#fbd0b0'], waterD: ['#0e0d28', '#f4a890'], waterHi: ['#5a56a0', '#fff6e0'],
      post: ['#15142e', '#8a6a80'], wood: ['#9894cc', '#e0b090'],
      bush: ['#5a56a0', '#f4c0a8'], bushS: ['#48448a', '#e0a890'],
    },
  },
};

const LEN = 3400;
const GAP = [1900, 1990];
const BUSH = 1500;
export const CAMP = 3220;
const FIND_X = [520, 1180, 2560];

export class Road {
  constructor(game) {
    this.g = game;
    const st = game.state;
    if (st.lit) st.bridge = true;
    this.chapter = CHAPTERS[st.chapter];
    this.theme = THEMES[this.chapter.id];
    this.finds = this.theme.finds.map((id, i) => ({ id, x: FIND_X[i] }));
    this.t = 0;
    this.light = 0;
    this.cam = 0;
    this.girl = { x: clamp(st.x, 60, LEN - 60), face: st.lit ? -1 : 1, walking: false };
    this.fox = { x: this.girl.x - 50, face: 1, mode: 'idle', idle: 0, y: 0 };
    this.foxState = 'follow';
    this.target = this.girl.x;
    this.hold = false;
    this.holdSX = 0;
    this.keys = {};
    this.want = null;
    this.gapReady = false;
    this.leapT = 0;
    this.plankA = st.bridge ? 0 : 1.45;
    this.sparks = [];
    this.saveT = 0;
    this.stepT = 0;
    this.leaving = false;
    this.frogT = -1;
    this.walked = st.x > 200;
    game.mood(st.lit);
    if (!st.lit && st.x < 200) game.announce();

    const r = rng(7 + st.chapter * 101);
    const hills = (step, lo, hi) => {
      const pts = [];
      let x = -200, up = false;
      while (x < 2600) {
        pts.push([x, up ? lo + (hi - lo) * (0.5 + r() * 0.5) : lo * (0.5 + r() * 0.6)]);
        x += step * (0.7 + r() * 0.7);
        up = !up;
      }
      return pts;
    };
    this.farHills = hills(130, 60, 190);
    this.midHills = hills(110, 30, 110);
    const trees = (gap, lo, hi, span) => {
      const out = [];
      let x = -100;
      while (x < span) {
        out.push([x, lo + r() * (hi - lo), r()]);
        x += gap * (0.4 + r() * 1.4);
      }
      return out;
    };
    this.treesFar = trees(70, 50, 105, 3200);
    this.treesNear = trees(150, 95, 170, 4200);
    this.reeds = [];
    for (let x = 40; x < LEN * 1.25 + 1400; x += 150 + r() * 260) {
      const blades = [];
      for (let i = 0; i < 5 + r() * 3; i++) blades.push([(r() - 0.5) * 46, 46 + r() * 70, (r() - 0.5) * 20, r() > 0.6]);
      this.reeds.push([x, blades]);
    }
    this.posts = [];
    for (let x = 300; x < LEN - 100; x += 420) {
      if (x < GAP[0] - 50 || x > GAP[1] + 50) this.posts.push(x);
    }
    this.tufts = [];
    for (let x = 0; x < LEN + 400; x += 30 + r() * 90) this.tufts.push([x, 4 + r() * 6]);
    this.stars = [];
    for (let i = 0; i < 46; i++) this.stars.push([r(), r(), 0.6 + r() * 1.1, r() * 6]);
    this.ripples = [];
    for (let i = 0; i < 90; i++) this.ripples.push([r() * (LEN + 800) - 200, r(), 14 + r() * 30, r() * 6]);
    this.flies = [];
    for (let i = 0; i < 26; i++) this.flies.push([r(), r(), r() * 6, 0.4 + r()]);
  }

  layout() {
    const v = this.g.view;
    this.s = Math.min(v.h / 540, v.w / 380);
    this.VW = v.w / this.s;
    this.VH = v.h / this.s;
    this.G = this.VH - Math.max(130, this.VH * 0.26);
  }

  pointer(type, sx, sy) {
    this.layout();
    const x = sx / this.s + this.cam, y = sy / this.s;
    if (type === 'down') {
      const hit = this.hitTest(x, y);
      if (hit === 'leap') return this.leap();
      if (hit) {
        this.want = hit;
        this.target = hit.x - 18 * Math.sign(hit.x - this.girl.x || 1);
        return;
      }
      this.want = null;
      this.hold = true;
      this.holdSX = sx;
      this.target = x;
    } else if (type === 'move') {
      if (this.hold) this.holdSX = sx;
    } else {
      this.hold = false;
    }
  }

  key(type, k) {
    const down = type === 'down';
    if (k === 'ArrowLeft' || k === 'a' || k === 'q') this.keys.left = down;
    if (k === 'ArrowRight' || k === 'd') this.keys.right = down;
    if (down && (k === ' ' || k === 'Enter')) {
      if (this.gapReady) return this.leap();
      const near = this.things().find(o => Math.abs(o.x - this.girl.x) < 70);
      if (near) this.take(near);
    }
  }

  leap() {
    this.foxState = 'leap';
    this.leapT = 0;
    this.gapReady = false;
    this.g.sfx('yip');
    this.g.sfx('leap');
  }

  things() {
    const st = this.g.state;
    const out = this.finds.filter(f => !st.finds[f.id]);
    if (!st.berries) out.push({ id: 'food', x: BUSH });
    return out;
  }

  hitTest(x, y) {
    const st = this.g.state, G = this.G;
    if (this.gapReady && !st.bridge) {
      const nearFox = Math.abs(x - this.fox.x) < 44 && y > G - 70 && y < G + 24;
      const nearPlank = x > GAP[0] - 20 && x < GAP[1] + 60 && y > G - 130 && y < G + 30;
      if (nearFox || nearPlank) return 'leap';
    }
    for (const o of this.things()) {
      if (Math.abs(x - o.x) < 36 && y > G - 80 && y < G + 26) return o;
    }
    return null;
  }

  take(o) {
    const st = this.g.state;
    if (o.id === 'food') st.berries = true;
    else st.finds[o.id] = true;
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      this.sparks.push({ x: o.x, y: this.G - 16, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40 - 30, life: 1 });
    }
    this.g.sfx('pickup');
    this.g.save();
  }

  moveFox(tx, dt) {
    const f = this.fox, dx = tx - f.x;
    if (Math.abs(dx) > 4) {
      const v = clamp(Math.abs(dx) * 3, 60, 200);
      f.x += Math.sign(dx) * Math.min(Math.abs(dx), v * dt);
      f.face = Math.sign(dx);
      f.mode = 'walk';
      f.idle = 0;
      return false;
    }
    f.idle += dt;
    return true;
  }

  update(dt) {
    this.layout();
    const st = this.g.state, g = this.girl, f = this.fox;
    this.t += dt;
    if (st.lit && this.light < 1) this.light = Math.min(1, this.light + dt / 3.5);

    // la fille
    if (this.hold) this.target = this.holdSX / this.s + this.cam;
    if (this.keys.left) { this.target = g.x - 60; this.want = null; }
    if (this.keys.right) { this.target = g.x + 60; this.want = null; }
    const hi = st.bridge ? LEN - 40 : GAP[0] - 62;
    this.target = clamp(this.target, 40, hi);
    const dx = this.target - g.x;
    g.walking = Math.abs(dx) > 3;
    if (g.walking) {
      g.x += Math.sign(dx) * Math.min(Math.abs(dx), 125 * dt);
      g.face = Math.sign(dx);
      if (g.x > 260) this.walked = true;
      this.stepT += dt;
      if (this.stepT > 0.29) { this.stepT = 0; this.g.sfx('step'); }
    }
    if (this.want && Math.abs(this.want.x - g.x) < 34) {
      g.face = Math.sign(this.want.x - g.x) || 1;
      this.take(this.want);
      this.want = null;
    }

    // le renard
    if (this.foxState === 'leap') {
      this.leapT += dt / 0.7;
      const k = Math.min(1, this.leapT);
      f.x = GAP[0] - 24 + (GAP[1] + 30 - (GAP[0] - 24)) * k;
      f.y = -52 * Math.sin(Math.PI * k);
      f.face = 1;
      f.mode = 'walk';
      if (k >= 1) { f.y = 0; this.foxState = 'plank'; this.leapT = 0; f.face = -1; f.mode = 'sniff'; }
    } else if (this.foxState === 'plank') {
      this.leapT += dt / 0.8;
      const k = Math.min(1, this.leapT);
      this.plankA = 1.45 * (1 - k * k);
      if (k >= 1) {
        st.bridge = true;
        this.g.sfx('plank');
        this.g.save();
        this.foxState = 'wait';
        f.idle = 0;
      }
    } else if (this.foxState === 'wait') {
      f.face = -1;
      f.mode = 'happy';
      if (g.x > GAP[1] - 10) this.foxState = 'follow';
    } else if (!st.bridge && g.x > GAP[0] - 170) {
      if (this.foxState !== 'gap') this.g.sfx('yip');
      this.foxState = 'gap';
      if (this.moveFox(GAP[0] - 24, dt)) { f.face = 1; f.mode = 'sit'; this.gapReady = true; }
    } else if (!st.berries && Math.abs(g.x - (BUSH - 40)) < 230) {
      if (this.foxState !== 'bush') this.g.sfx('yip');
      this.foxState = 'bush';
      this.gapReady = false;
      if (this.moveFox(BUSH - 34, dt)) { f.face = 1; f.mode = 'sniff'; }
    } else {
      this.foxState = 'follow';
      this.gapReady = false;
      if (this.moveFox(g.x - 46 * g.face, dt)) {
        f.face = g.face;
        f.mode = f.idle > 1.6 ? 'sit' : 'idle';
      }
    }

    this.cam = clamp(g.x - this.VW * 0.42, 0, LEN - this.VW);
    for (const p of this.sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; p.life -= dt * 1.4; }
    this.sparks = this.sparks.filter(p => p.life > 0);

    if (st.lit && this.frogT < 0 && Math.abs(g.x - 860) < 60) this.frogT = 0;
    if (this.frogT >= 0) { this.frogT += dt / 0.6; if (this.frogT > 1) this.frogT = -1; }

    this.saveT += dt;
    if (this.saveT > 2 && !this.leaving) { this.saveT = 0; st.x = g.x; this.g.save(); }
    if (g.x > CAMP - 30 && !this.leaving) {
      this.leaving = true;
      st.x = CAMP - 240;
      this.g.go('camp');
    }
  }

  hills(ctx, pts, par, base, cl, cs, cap) {
    const off = -this.cam * par;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const x1 = a[0] + off, x2 = b[0] + off;
      if (x2 < -10 || x1 > this.VW + 10) continue;
      poly(ctx, [x1, base - a[1], x2 + 0.6, base - b[1], x2 + 0.6, base + 2, x1, base + 2], b[1] > a[1] ? cl : cs);
    }
    if (!cap) return;
    // neige sur les sommets
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], a = pts[i - 1], b = pts[i + 1];
      if (p[1] < a[1] || p[1] < b[1] || p[1] < 120) continue;
      const x = p[0] + off, y = base - p[1], k = 0.28;
      poly(ctx, [x, y, x + (a[0] - p[0]) * k, y + (p[1] - a[1]) * k, x + (a[0] - p[0]) * k * 0.4, y + (p[1] - a[1]) * k * 0.7, x + (b[0] - p[0]) * k * 0.5, y + (p[1] - b[1]) * k * 0.8, x + (b[0] - p[0]) * k, y + (p[1] - b[1]) * k], cap);
    }
  }

  trees(ctx, list, par, base, cl, cs) {
    const off = -this.cam * par, kind = this.theme.tree, t = this.t;
    for (const [wx, h, v] of list) {
      let x = wx + off;
      if (x < -120 || x > this.VW + 120) continue;
      if (kind === 'pine') {
        ctx.fillStyle = cs;
        ctx.fillRect(x - h * 0.03, base - h * 0.12, h * 0.06, h * 0.12 + 2);
        for (let i = 2; i >= 0; i--) {
          const apex = base - h + i * h * 0.24, bot = apex + h * 0.42, hw = h * 0.38 * (0.5 + i * 0.22);
          poly(ctx, [x, apex, x - hw, bot, x, bot], cl);
          poly(ctx, [x, apex, x + hw, bot, x, bot], cs);
        }
      } else if (kind === 'round') {
        // grands feuillus : tronc fin, houppier à facettes
        const H = h * 1.35, r = H * 0.3, cy = base - H + r;
        ctx.fillStyle = cs;
        ctx.fillRect(x - H * 0.025, cy, H * 0.05, H - r + 2);
        poly(ctx, [x - r, cy, x - r * 0.7, cy - r * 0.75, x, cy - r, x, cy + r * 0.8, x - r * 0.6, cy + r * 0.7], cl);
        poly(ctx, [x, cy - r, x + r * 0.7, cy - r * 0.75, x + r, cy, x + r * 0.6, cy + r * 0.7, x, cy + r * 0.8], cs);
      } else if (kind === 'rock') {
        // aiguilles de roche dressées dans la mer
        const w = h * (0.22 + v * 0.2), H = h * (0.7 + v * 0.6);
        poly(ctx, [x - w, base + 2, x - w * 0.7, base - H * 0.8, x - w * 0.1, base - H, x, base + 2], cl);
        poly(ctx, [x, base + 2, x - w * 0.1, base - H, x + w * 0.6, base - H * 0.86, x + w, base + 2], cs);
      } else {
        // nuages qui dérivent
        x += Math.sin(t * 0.15 + wx) * 12;
        const y = base - h * (0.4 + v * 1.4), w = h * 0.6;
        for (const [dx, dy, r] of [[-w * 0.5, 0, 0.32], [0, -w * 0.18, 0.44], [w * 0.5, 0, 0.3]]) {
          ctx.beginPath();
          ctx.ellipse(x + dx, y + dy, w * r * 1.4, w * r, 0, Math.PI, 0);
          ctx.fillStyle = dx > 0 ? cs : cl;
          ctx.fill();
        }
      }
    }
  }

  lamp(ctx, x, G, L, c) {
    const id = this.chapter.id, glass = mix(['#55527f', '#ffdf8e'], L);
    let gx = x, gy = G - 60;
    ctx.fillStyle = c('post');
    if (id === 'foret') {
      // lampion rond pendu à une branche
      ctx.fillRect(x - 1.5, G - 80, 3, 82);
      ctx.fillRect(x - 1.5, G - 80, 19, 2.5);
      ctx.fillRect(x + 15, G - 78, 1.2, 9);
      gx = x + 15.5; gy = G - 61;
      disc(ctx, gx, gy, 8, glass);
      ctx.fillStyle = c('post');
      ctx.fillRect(gx - 4, gy - 9.5, 8, 2.5);
      ctx.fillRect(gx - 3, gy + 7, 6, 2);
    } else if (id === 'falaises') {
      // balise rayée
      poly(ctx, [x - 7, G + 1, x - 4, G - 58, x + 4, G - 58, x + 7, G + 1], c('post'));
      poly(ctx, [x - 5.6, G - 26, x - 4.6, G - 44, x + 4.6, G - 44, x + 5.6, G - 26], c('wood'));
      gy = G - 66;
      disc(ctx, x, gy, 7, glass);
      ctx.fillStyle = c('post');
      ctx.fillRect(x - 6, gy + 6, 12, 2.5);
    } else if (id === 'montagne') {
      // cairn : des pierres empilées, la dernière s'allume
      const stones = [[13, 0, 12], [10, 12, 10], [8, 22, 9], [5.5, 31, 7]];
      for (const [w, y, h] of stones) poly(ctx, [x - w, G - y + 1, x - w * 0.8, G - y - h, x + w * 0.7, G - y - h - 1, x + w, G - y + 1], c('post'));
      gy = G - 44;
      poly(ctx, [x - 5, gy + 5, x - 3, gy - 5, x + 4, gy - 6, x + 6, gy + 5], glass);
    } else if (id === 'ciel') {
      // une étoile au bout d'une tige
      ctx.fillRect(x - 1, G - 64, 2, 66);
      gy = G - 72;
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 4, r = i % 2 ? 4 : 11;
        pts.push(x + Math.cos(a) * r, gy + Math.sin(a) * r);
      }
      poly(ctx, pts, glass);
    } else {
      // lanterne du marais
      ctx.fillRect(x - 1.5, G - 76, 3, 78);
      ctx.fillRect(x - 1.5, G - 76, 17, 2.5);
      ctx.fillRect(x + 13, G - 74, 1.2, 8);
      ctx.fillRect(x + 9, G - 67, 9, 2);
      ctx.fillRect(x + 9, G - 54, 9, 2);
      ctx.fillStyle = glass;
      ctx.fillRect(x + 10, G - 65, 7, 11);
      gx = x + 13.5;
    }
    if (L > 0.02) glow(ctx, gx, gy, 58, 0.5 * L);
  }

  draw(ctx) {
    this.layout();
    const { VW, VH, G, t } = this;
    const st = this.g.state, C = this.theme.C;
    const L = ease(this.light);
    const c = n => mix(C[n], L);
    ctx.save();
    ctx.scale(this.s, this.s);

    const sky = ctx.createLinearGradient(0, 0, 0, G);
    sky.addColorStop(0, c('skyTop'));
    sky.addColorStop(1, c('skyBot'));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VW, VH);

    for (const [u, v, r, ph] of this.stars) {
      const a = (1 - L) * (0.45 + 0.4 * Math.sin(t * 1.3 + ph));
      if (a > 0.02) disc(ctx, u * VW, v * G * 0.7, r, `rgba(235,232,255,${a})`);
    }
    const tall = VH > VW;
    const mx = VW * (tall ? 0.76 : 0.87) - this.cam * 0.02, my = G * (tall ? 0.55 : 0.3);
    glow(ctx, mx, my, 90, 0.18 + 0.3 * L, '255,240,205');
    disc(ctx, mx, my, 24, c('moon'));

    this.hills(ctx, this.farHills, 0.1, G + 8, c('far'), c('farS'), this.theme.caps && c('cap'));
    this.hills(ctx, this.midHills, 0.25, G + 8, c('mid'), c('midS'));
    this.trees(ctx, this.treesFar, 0.5, G + 6, c('treeB'), c('treeBS'));
    this.trees(ctx, this.treesNear, 0.8, G + 6, c('treeA'), c('treeAS'));

    // ce qui s'étend sous le sentier : eau, brume ou mer de nuages
    const wg = ctx.createLinearGradient(0, G, 0, VH);
    wg.addColorStop(0, c('water'));
    wg.addColorStop(1, c('waterD'));
    ctx.fillStyle = wg;
    ctx.fillRect(0, G + 4, VW, VH - G);
    ctx.fillStyle = c('waterHi');
    for (const [wx, v, len, ph] of this.ripples) {
      const x = wx - this.cam + Math.sin(t * 0.6 + ph) * 6;
      if (x < -60 || x > VW + 10) continue;
      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t + ph);
      ctx.fillRect(x, G + 34 + v * (VH - G - 40), len, 1.5);
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(-this.cam, 0);

    // dans le marais : un nénuphar et, une fois la lumière revenue, une grenouille (clin d'œil à la mare)
    if (this.chapter.id === 'marais') {
      ctx.beginPath();
      ctx.ellipse(860, G + 44, 20, 6, 0, 0.3, Math.PI * 2);
      ctx.lineTo(860, G + 44);
      ctx.fillStyle = mix(['#3f6b78', '#7ecb8f'], L);
      ctx.fill();
      if (st.lit) {
        const k = this.frogT >= 0 ? this.frogT : 0;
        const fx = 858 + k * 14, fy = G + 41 - Math.sin(Math.PI * k) * 16;
        poly(ctx, [fx - 7, fy, fx - 5, fy - 6, fx + 3, fy - 7, fx + 7, fy - 3, fx + 6, fy], '#5fae5a');
        disc(ctx, fx + 3, fy - 6.5, 2, '#eef7d8');
        disc(ctx, fx + 3.5, fy - 6.5, 0.9, '#2b2748');
      }
    }

    // berge
    const bank = (x1, x2) => {
      ctx.fillStyle = c('under');
      ctx.fillRect(x1, G + 22, x2 - x1, 8);
      ctx.fillStyle = c('ground');
      ctx.fillRect(x1, G + 6, x2 - x1, 17);
      ctx.fillStyle = c('edge');
      ctx.fillRect(x1, G, x2 - x1, 6.5);
    };
    bank(-300, GAP[0]);
    bank(GAP[1], LEN + 900);
    for (const [x, h] of this.tufts) {
      if (x > GAP[0] - 8 && x < GAP[1] + 8) continue;
      poly(ctx, [x - 3, G + 0.5, x, G - h, x + 3, G + 0.5], c('edge'));
    }

    // planche du gué
    const hx = GAP[1] + 2, len = GAP[1] - GAP[0] + 6;
    ctx.save();
    ctx.translate(hx, G + 2);
    ctx.rotate(this.plankA);
    ctx.fillStyle = c('wood');
    ctx.fillRect(-len, -4, len, 6);
    ctx.fillStyle = c('post');
    ctx.fillRect(-len, 2, len, 2);
    ctx.restore();
    ctx.fillStyle = c('post');
    ctx.fillRect(hx + 2, G - 16, 4, 18);

    // les lumières du sentier, une forme par région
    for (const x of this.posts) this.lamp(ctx, x, G, L, c);

    // le buisson où le renard flaire le goûter
    for (const [dx, r, shade] of [[-16, 15, 1], [14, 17, 1], [0, 21, 0]]) {
      poly(ctx, [BUSH + dx - r, G + 1, BUSH + dx - r * 0.6, G - r * 0.8, BUSH + dx, G - r * 1.25, BUSH + dx + r * 0.7, G - r * 0.7, BUSH + dx + r, G + 1], shade ? c('bushS') : c('bush'));
    }
    if (!st.berries) {
      icon(ctx, this.theme.food, BUSH + 4, G - 14, 0.8);
      if (this.foxState === 'bush' && this.fox.mode === 'sniff') ring(ctx, BUSH + 2, G - 16, t);
    }

    // trouvailles
    for (const o of this.finds) {
      if (st.finds[o.id]) continue;
      glow(ctx, o.x, G - 10, 22, 0.25 + 0.12 * Math.sin(t * 2), '240,236,255');
      icon(ctx, o.id, o.x, G - 10 + Math.sin(t * 2 + o.x) * 1.5);
    }

    // foyer du camp
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      disc(ctx, CAMP + 40 + Math.cos(a) * 15, G + 1 + Math.sin(a) * 3, 4, c('under'));
    }
    poly(ctx, [CAMP + 28, G, CAMP + 50, G - 7, CAMP + 53, G - 3, CAMP + 31, G + 3], c('post'));
    poly(ctx, [CAMP + 52, G, CAMP + 30, G - 7, CAMP + 27, G - 3, CAMP + 49, G + 3], c('wood'));
    ring(ctx, CAMP + 40, G - 24, t, 10);

    // personnages
    if (this.gapReady && !st.bridge) ring(ctx, this.fox.x + 4, G - 46, t);
    drawFox(ctx, this.fox.x, G + this.fox.y, 1, this.fox.face, t, this.fox.mode);
    drawGirl(ctx, this.girl.x, G, 1, this.girl.face, t, this.girl.walking);

    for (const p of this.sparks) disc(ctx, p.x, p.y, 1.8, `rgba(255,236,190,${p.life})`);
    ctx.restore();

    // herbes du premier plan
    if (this.theme.front) {
      const off = -this.cam * 1.25, fh = this.theme.front;
      for (const [wx, blades] of this.reeds) {
        const x = wx + off;
        if (x < -60 || x > VW + 60) continue;
        for (const [dx, h, lean, head] of blades) {
          const sway = Math.sin(t * 0.9 + wx + dx) * 3;
          const bx = x + dx, tx = bx + lean + sway, ty = VH - h * fh;
          poly(ctx, [bx - 2.2, VH + 4, tx, ty, bx + 2.2, VH + 4], c('reed'));
          if (head && fh === 1) {
            ctx.beginPath();
            ctx.ellipse(tx, ty + 9, 2.6, 8, 0, 0, Math.PI * 2);
            ctx.fillStyle = c('reed');
            ctx.fill();
          }
        }
      }
    }

    // lucioles une fois la région rallumée
    if (L > 0.05) {
      for (const [u, v, ph, sp] of this.flies) {
        const x = ((u * (VW + 200) - this.cam * 0.9) % (VW + 200) + VW + 200) % (VW + 200) - 100 + Math.sin(t * sp + ph) * 22;
        const y = G - 20 - v * 150 + Math.cos(t * sp * 0.8 + ph) * 14;
        const a = L * (0.4 + 0.5 * Math.sin(t * 2.2 + ph * 3));
        if (a > 0) { glow(ctx, x, y, 9, a * 0.6); disc(ctx, x, y, 1.4, `rgba(255,244,190,${a})`); }
      }
    }

    if (st.chapter === 0 && !st.lit && !this.walked && this.t > 2.5) {
      hand(ctx, Math.min(VW - 50, this.girl.x - this.cam + 130), G - 26, t);
    }

    // besace : les trois trouvailles du chapitre et le goûter
    const slots = [...this.theme.finds, 'food'];
    for (let i = 0; i < slots.length; i++) {
      const id = slots[i], has = id === 'food' ? st.berries : st.finds[id];
      const x = 26 + i * 34, y = 28;
      disc(ctx, x, y, 14, has ? 'rgba(255,244,215,0.22)' : 'rgba(255,255,255,0.07)');
      ctx.strokeStyle = `rgba(255,244,215,${has ? 0.7 : 0.28})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.stroke();
      if (has) icon(ctx, id === 'food' ? this.theme.food : id, x, y, 0.85);
    }
    ctx.restore();
  }
}

// Le goûter du chapitre, pour le camp.
export const foodOf = chapterId => THEMES[chapterId].food;
