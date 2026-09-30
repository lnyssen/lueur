// Les animaux du sentier : deux par région. Chacun réagit à sa façon quand la fille approche,
// et rejoint le carnet la première fois qu'on le voit réagir.
import { poly, disc, glow } from './draw.js';

const INK = '#2b2748';

export const CRITTERS = {
  marais: [['frog', 860], ['heron', 2330]],
  foret: [['owl', 860], ['deer', 2330]],
  falaises: [['gulls', 860], ['crab', 2300]],
  montagne: [['marmot', 860], ['ibex', 2300]],
  ciel: [['whale', 860], ['starbirds', 2330]],
};

export const makeCritter = (kind, x) => ({ kind, x, x0: x, y: 0, state: 'idle', t: 0, k: 0, face: 1 });

// Fait vivre l'animal. Renvoie true à l'instant où il réagit pour la première fois de la visite.
export function updateCritter(c, girlX, dt, sfx) {
  const d = girlX - c.x0, ad = Math.abs(d);
  let met = false;
  const react = (state, sound) => {
    c.state = state;
    c.t = 0;
    if (sound) sfx(sound);
    met = true;
  };
  c.t += dt;
  switch (c.kind) {
    case 'frog':
      if (c.state === 'idle' && ad < 70) react('hop', 'plop');
      if (c.state === 'hop' && c.t > 0.7) c.state = 'gone';
      if (c.state === 'gone' && ad > 320) c.state = 'idle';
      break;
    case 'heron':
    case 'gulls':
    case 'starbirds':
      if (c.state === 'idle' && ad < 120) react('fly', 'flap');
      if (c.state === 'fly' && c.t > 4) c.state = 'gone';
      if (c.state === 'gone' && ad > 700) c.state = 'idle';
      break;
    case 'owl':
      c.k += ((ad < 190 ? 1 : 0) - c.k) * Math.min(1, dt * 5);      // les yeux s'ouvrent
      c.face = Math.sign(d) || 1;
      if (c.state === 'idle' && ad < 60) react('hoot', 'hoot');
      if (c.state === 'hoot' && c.t > 1.2) c.state = 'calm';
      if (c.state === 'calm' && ad > 400) c.state = 'idle';
      break;
    case 'deer':
      c.k += ((ad < 260 ? 1 : 0) - c.k) * Math.min(1, dt * 4);      // la tête se lève
      if (c.state === 'idle' && ad < 130) { c.face = d > 0 ? -1 : 1; react('bound', 'pad'); }
      if (c.state === 'bound') { c.x += c.face * 210 * dt; if (c.t > 2.4) c.state = 'gone'; }
      if (c.state === 'gone' && ad > 800) { c.state = 'idle'; c.x = c.x0; }
      break;
    case 'crab': {
      // il garde ses distances, de côté, jusqu'à son trou
      const gd = girlX - c.x;
      if (c.state === 'idle' && Math.abs(gd) < 95) react('run', 'pad');
      if (c.state === 'run') {
        if (Math.abs(gd) < 110) c.x += (gd > 0 ? -1 : 1) * 150 * dt;
        if (Math.abs(c.x - c.x0) > 170) c.state = 'gone';
      }
      if (c.state === 'gone' && ad > 600) { c.state = 'idle'; c.x = c.x0; }
      break;
    }
    case 'marmot': {
      const out = ad > 120 && ad < 460;
      if (!out && c.k > 0.6 && ad <= 120 && c.state !== 'hid') react('hid', 'whistle');
      if (out) c.state = 'idle';
      c.k += ((out ? 1 : 0) - c.k) * Math.min(1, dt * 7);
      break;
    }
    case 'ibex':
      if (c.state === 'idle' && ad < 150) react('leap', 'pad');
      if (c.state === 'leap' && c.t > 0.9) c.state = 'far';
      if (c.state === 'far' && ad > 700) c.state = 'idle';
      break;
    case 'whale':
      if (c.state === 'idle' && ad < 90) react('swim', 'whale');
      if (c.state === 'swim' && c.t > 16) c.state = 'gone';
      break;
  }
  return met;
}

function bird(ctx, x, y, s, flap, body, wing) {
  poly(ctx, [x - 7 * s, y, x, y - 3 * s, x + 8 * s, y, x, y + 3 * s], body);
  poly(ctx, [x - 2 * s, y - 1 * s, x + 3 * s, y - 1 * s, x + 1 * s, y - (4 + flap * 11) * s], wing);
  poly(ctx, [x - 2 * s, y, x + 3 * s, y, x - 1 * s, y - (2 + flap * 8) * s], wing);
}

function legs(ctx, xs, y, len, a, col) {
  ctx.strokeStyle = col;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  xs.forEach((lx, i) => {
    const sw = a * (i % 2 ? -1 : 1) * 5;
    ctx.beginPath();
    ctx.moveTo(lx, y - len);
    ctx.lineTo(lx + sw, y);
    ctx.stroke();
  });
}

// Un cervidé low-poly, pour le cerf (bois) et le bouquetin (cornes).
function hoofed(ctx, x, y, face, t, o) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face * o.s, o.s);
  legs(ctx, [-13, -8, 9, 13], 0, 22, o.run ? Math.sin(t * 16) : 0, o.dark);
  poly(ctx, [-18, -38, 12, -40, 18, -30, 14, -20, -16, -20], o.col);
  poly(ctx, [-18, -38, -22, -34, -18, -30], '#fff1de');
  // le cou et la tête se lèvent avec `up`
  const hx = 18 + 6 * o.up, hy = -22 - 26 * o.up;
  poly(ctx, [10, -38, 17, -30, hx + 2, hy + 4, hx - 5, hy], o.col);
  poly(ctx, [hx - 6, hy - 6, hx + 2, hy - 8, hx + 11, hy - 1, hx + 3, hy + 4, hx - 5, hy + 2], o.col);
  disc(ctx, hx + 2, hy - 3, 1.2, INK);
  ctx.strokeStyle = o.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (o.horns) {
    ctx.arc(hx - 10, hy - 8, 12, -1.3, 0.5);
  } else {
    ctx.moveTo(hx - 2, hy - 7); ctx.lineTo(hx - 5, hy - 19); ctx.lineTo(hx - 11, hy - 23);
    ctx.moveTo(hx - 5, hy - 19); ctx.lineTo(hx, hy - 25);
  }
  ctx.stroke();
  ctx.restore();
}

// layer : 'back' (derrière le sentier) ou 'front' (sur le sentier). L : lumière 0..1.
export function drawCritter(ctx, c, G, t, L, layer, view) {
  const x = c.x, k = c.kind;
  const far = k === 'whale' || k === 'deer' || k === 'ibex';
  if ((layer === 'back') !== far || c.state === 'gone') return;

  if (k === 'frog') {
    const h = c.state === 'hop' ? Math.min(1, c.t / 0.6) : 0;
    const fx = x - 2 + h * 34, fy = G + 41 - Math.sin(Math.PI * h) * 22 + (h > 0.85 ? (h - 0.85) * 60 : 0);
    ctx.beginPath();
    ctx.ellipse(x, G + 44, 20, 6, 0, 0.3, Math.PI * 2);
    ctx.lineTo(x, G + 44);
    ctx.fillStyle = L > 0.5 ? '#7ecb8f' : '#3f6b78';
    ctx.fill();
    if (h < 1) {
      poly(ctx, [fx - 7, fy, fx - 5, fy - 6, fx + 3, fy - 7, fx + 7, fy - 3, fx + 6, fy], '#5fae5a');
      disc(ctx, fx + 3, fy - 6.5, 2, '#eef7d8');
      disc(ctx, fx + 3.5, fy - 6.5, 0.9, INK);
    }
  } else if (k === 'heron') {
    const f = c.state === 'fly' ? c.t : 0;
    const hx = x + f * 90, hy = G + 30 - f * 70 - f * f * 12;
    const grey = L > 0.5 ? '#e9eef4' : '#a9a6d6', dark = L > 0.5 ? '#8fa0b8' : '#6a67a0';
    if (!f) legs(ctx, [hx - 3, hx + 3], hy, 26, 0, dark);
    const by = hy - (f ? 0 : 26);
    poly(ctx, [hx - 16, by - 4, hx - 4, by - 14, hx + 10, by - 10, hx + 12, by - 2, hx - 2, by + 2], grey);
    poly(ctx, [hx + 8, by - 10, hx + 12, by - 30, hx + 16, by - 30, hx + 13, by - 8], grey);
    poly(ctx, [hx + 11, by - 34, hx + 18, by - 33, hx + 30, by - 29, hx + 17, by - 28, hx + 11, by - 28], grey);
    poly(ctx, [hx + 18, by - 32, hx + 31, by - 29, hx + 18, by - 29], '#f2b64a');
    disc(ctx, hx + 15, by - 31.5, 1, INK);
    if (f) {
      const fl = Math.sin(f * 9);
      poly(ctx, [hx - 12, by - 8, hx + 8, by - 9, hx - 6, by - 10 - fl * 30, hx - 24, by - 8 - fl * 22], dark);
    } else {
      poly(ctx, [hx - 16, by - 4, hx - 2, by - 12, hx + 4, by - 4, hx - 8, by], dark);
    }
  } else if (k === 'gulls' || k === 'starbirds') {
    const star = k === 'starbirds';
    [[-40, 0.2], [-14, 1.3], [12, 2.1], [38, 0.7], [60, 1.7]].forEach(([dx, ph], i) => {
      let bx = x + dx, by = G - 6, flap = 0;
      if (c.state === 'fly') {
        const f = c.t;
        bx += (i % 2 ? 1 : -1) * f * (50 + i * 14) + Math.sin(f * 2 + ph) * 20;
        by -= f * (60 + i * 9) + Math.sin(f * 3 + ph) * 10;
        flap = 0.5 + 0.5 * Math.sin(f * 14 + ph);
      }
      if (star) {
        glow(ctx, bx, by - 3, 12, 0.5);
        bird(ctx, bx, by - 3, 1, flap, '#fff1c8', '#ffd78a');
      } else {
        bird(ctx, bx, by, 1.1, flap, L > 0.5 ? '#ffffff' : '#d6d4f2', L > 0.5 ? '#9fb0c8' : '#8e8cc0');
        disc(ctx, bx + 6, by - 1, 0.8, INK);
      }
    });
  } else if (k === 'owl') {
    const wood = L > 0.5 ? '#6b4a3a' : '#15202c';
    ctx.fillStyle = wood;
    ctx.fillRect(x - 5, G - 120, 10, 122);
    poly(ctx, [x + 4, G - 84, x + 40, G - 92, x + 40, G - 88, x + 4, G - 76], wood);
    const ox = x + 26, oy = G - 92, spread = c.state === 'hoot' ? Math.sin(Math.min(1, c.t / 0.5) * Math.PI) : 0;
    const body = L > 0.5 ? '#a9784e' : '#7a6a8e', belly = L > 0.5 ? '#f0dcc0' : '#c6c0e0';
    poly(ctx, [ox - 9 - spread * 12, oy - 16 - spread * 8, ox - 9, oy - 22, ox - 7, oy - 2], body);
    poly(ctx, [ox + 9 + spread * 12, oy - 16 - spread * 8, ox + 9, oy - 22, ox + 7, oy - 2], body);
    poly(ctx, [ox - 9, oy, ox - 10, oy - 18, ox - 7, oy - 28, ox, oy - 25, ox + 7, oy - 28, ox + 10, oy - 18, ox + 9, oy], body);
    poly(ctx, [ox - 5, oy - 1, ox - 6, oy - 13, ox + 6, oy - 13, ox + 5, oy - 1], belly);
    for (const s of [-1, 1]) {
      const ex = ox + s * 4, ey = oy - 19;
      disc(ctx, ex, ey, 3.2, belly);
      if (c.k > 0.15) {
        disc(ctx, ex, ey, 3 * c.k, '#ffd24a');
        disc(ctx, ex + c.face * 0.9, ey, 1.4 * c.k, INK);
      } else {
        ctx.fillStyle = INK;
        ctx.fillRect(ex - 2.5, ey - 0.5, 5, 1);
      }
    }
    poly(ctx, [ox - 1.5, oy - 17, ox + 1.5, oy - 17, ox, oy - 13.5], '#f2b64a');
  } else if (k === 'deer') {
    if (c.state === 'bound') {
      const hop = Math.abs(Math.sin(c.t * 5.2));
      hoofed(ctx, x, G - 2 - hop * 34, c.face, t, { s: 0.95, up: 1, run: true, col: L > 0.5 ? '#c9925e' : '#5a5690', dark: L > 0.5 ? '#8a5a3c' : '#3c3a6c' });
    } else {
      hoofed(ctx, x, G - 2, 1, t, { s: 0.95, up: c.k, col: L > 0.5 ? '#c9925e' : '#5a5690', dark: L > 0.5 ? '#8a5a3c' : '#3c3a6c' });
    }
  } else if (k === 'ibex') {
    const rock = L > 0.5 ? '#b8a8d8' : '#3a3668', rockS = L > 0.5 ? '#9f90c8' : '#2e2b58';
    for (const rx of [c.x0, c.x0 + 170]) {
      poly(ctx, [rx - 34, G + 4, rx - 22, G - 70, rx + 4, G - 78, rx + 4, G + 4], rock);
      poly(ctx, [rx + 4, G + 4, rx + 4, G - 78, rx + 24, G - 66, rx + 36, G + 4], rockS);
    }
    let ix = c.x0 - 6, iy = G - 76;
    if (c.state === 'leap') {
      const h = Math.min(1, c.t / 0.9);
      ix += 170 * h;
      iy -= Math.sin(Math.PI * h) * 60;
    } else if (c.state === 'far') {
      ix += 170;
    }
    hoofed(ctx, ix, iy, 1, t, { s: 0.8, up: 1, horns: true, run: c.state === 'leap', col: L > 0.5 ? '#a08a78' : '#6a66a0', dark: L > 0.5 ? '#6a5a50' : '#45427a' });
  } else if (k === 'crab') {
    const hx = c.x0 + 176;
    poly(ctx, [hx - 22, G + 2, hx - 14, G - 20, hx + 8, G - 24, hx + 22, G + 2], L > 0.5 ? '#c99a86' : '#3a4280');
    ctx.beginPath();
    ctx.ellipse(hx - 4, G - 3, 9, 6, 0, Math.PI, 0);
    ctx.fillStyle = INK;
    ctx.fill();
    const run = c.state === 'run' ? Math.sin(t * 30) : 0;
    const red = '#f06a5a';
    ctx.strokeStyle = '#c94a44';
    ctx.lineWidth = 1.8;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + s * 6, G - 6);
        ctx.lineTo(x + s * (12 + i * 2) + run * 2 * (i % 2 ? 1 : -1), G - 1 - i);
        ctx.stroke();
      }
      poly(ctx, [x + s * 8, G - 10, x + s * 15, G - 17, x + s * 12, G - 9], red);
      disc(ctx, x + s * 3, G - 13, 1.6, '#fff1de');
      disc(ctx, x + s * 3, G - 13, 0.8, INK);
    }
    ctx.beginPath();
    ctx.ellipse(x, G - 7, 9, 5.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = red;
    ctx.fill();
  } else if (k === 'marmot') {
    const earth = L > 0.5 ? '#c4b4e6' : '#4a467c';
    const up = c.k * 22;
    if (up > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 20, G - 40, 40, 40);
      ctx.clip();
      const my = G + 20 - up;
      poly(ctx, [x - 8, my, x - 9, my - 16, x - 5, my - 24, x + 5, my - 24, x + 9, my - 16, x + 8, my], '#b08a5e');
      poly(ctx, [x - 4, my, x - 5, my - 12, x + 5, my - 12, x + 4, my], '#ecd6b0');
      disc(ctx, x - 5, my - 24, 2, '#8a6a44');
      disc(ctx, x + 5, my - 24, 2, '#8a6a44');
      disc(ctx, x - 2.6, my - 19, 1, INK);
      disc(ctx, x + 2.6, my - 19, 1, INK);
      disc(ctx, x, my - 16.5, 1.1, INK);
      ctx.restore();
    }
    poly(ctx, [x - 20, G + 1, x - 10, G - 5, x + 10, G - 5, x + 20, G + 1], earth);
  } else if (k === 'whale') {
    // elle traverse le ciel, très loin, très lentement
    const p = c.t / 16;
    const wx = view.cam + view.VW + 260 - p * (view.VW + 620), wy = G - 250 + Math.sin(c.t * 0.6) * 14;
    const tail = Math.sin(c.t * 1.6) * 12;
    ctx.globalAlpha = 0.5 * Math.sin(Math.PI * Math.min(1, p));
    const col = L > 0.5 ? '#ffffff' : '#b9b4ea';
    poly(ctx, [wx - 110, wy - 4, wx - 70, wy - 34, wx + 20, wy - 40, wx + 90, wy - 16, wx + 150, wy - 6 + tail * 0.4, wx + 90, wy + 8, wx - 40, wy + 22, wx - 100, wy + 12], col);
    poly(ctx, [wx + 140, wy - 6 + tail * 0.4, wx + 190, wy - 30 + tail, wx + 176, wy - 4 + tail, wx + 192, wy + 18 + tail], col);
    poly(ctx, [wx - 20, wy + 16, wx + 6, wy + 50, wx + 24, wy + 12], col);
    disc(ctx, wx - 78, wy - 8, 3, INK);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) disc(ctx, wx + 200 + i * 26, wy + Math.sin(c.t * 2 + i) * 16, 1.6, `rgba(255,244,200,${0.7 - i * 0.1})`);
  }
}

// Portrait pour le carnet : l'animal au repos, centré sur (x, y).
export function portrait(ctx, kind, x, y) {
  const c = makeCritter(kind, 0);
  c.k = 1;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 21, 0, Math.PI * 2);
  ctx.clip();
  const set = { frog: [0, -44, 1.5], heron: [-6, 12, 0.66], gulls: [14, 7, 2.4], starbirds: [14, 10, 2.4], owl: [-26, 106, 1.1], deer: [-2, 30, 0.72], ibex: [6, 96, 0.8], crab: [0, 10, 1.4], marmot: [0, 10, 1.2], whale: [0, 0, 1] }[kind];
  ctx.translate(x, y);
  ctx.scale(set[2], set[2]);
  ctx.translate(set[0], set[1]);
  if (kind === 'whale') {
    const col = '#d9d6f6';
    ctx.scale(0.17, 0.17);
    poly(ctx, [-110, -4, -70, -34, 20, -40, 90, -16, 150, -6, 90, 8, -40, 22, -100, 12], col);
    poly(ctx, [140, -6, 190, -30, 176, -4, 192, 18], col);
    disc(ctx, -78, -8, 5, INK);
  } else {
    drawCritter(ctx, c, 0, 0, 1, kind === 'deer' || kind === 'ibex' ? 'back' : 'front', { cam: 0, VW: 0 });
  }
  ctx.restore();
}
