// Primitives de dessin partagées par toutes les scènes : couleurs, formes, personnages.

const rgbCache = new Map();
function rgb(hex) {
  let v = rgbCache.get(hex);
  if (!v) {
    v = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    rgbCache.set(hex, v);
  }
  return v;
}

// Mélange la couleur « éteinte » et la couleur « rallumée » d'une paire.
export function mix(pair, t, alpha = 1) {
  const a = rgb(pair[0]), b = rgb(pair[1]);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return alpha === 1 ? `rgb(${r},${g},${bl})` : `rgba(${r},${g},${bl},${alpha})`;
}

export const ease = t => t * t * (3 - 2 * t);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function poly(ctx, pts, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export function disc(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function glow(ctx, x, y, r, alpha = 0.5, color = '255,214,130') {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${color},${alpha})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Anneau qui pulse : « tu peux toucher ici ».
export function ring(ctx, x, y, t, r = 15) {
  const p = (t * 0.8) % 1;
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = `rgba(255,236,190,${0.75 * (1 - p)})`;
  ctx.beginPath();
  ctx.arc(x, y, r + p * 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,236,190,0.7)';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.stroke();
}

const INK = '#2b2748';

// La fille : ciré jaune à capuche pointue, lanterne à la main. Pieds en (x, y).
export function drawGirl(ctx, x, y, s, facing, t, walking, opts = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * facing, s * (opts.brace ? 0.78 : 1));   // accroupie contre le vent
  const sw = walking ? Math.sin(t * 11) : 0;
  const bob = walking ? Math.abs(Math.sin(t * 11)) * 1.5 : Math.sin(t * 2) * 0.6;
  if (opts.sit) {
    // assise sur une pierre : cuisses à l'horizontale, jambes qui descendent jusqu'au sol
    ctx.fillStyle = INK;
    ctx.fillRect(0, -12, 13, 4.5);
    ctx.fillRect(10, -9, 4, 9);
    ctx.fillRect(10, -1.5, 6, 1.5);
    ctx.translate(0, 2);
  } else {
    ctx.fillStyle = INK;
    ctx.fillRect(-5 + sw * 3, -12, 4, 12);
    ctx.fillRect(2 - sw * 3, -12, 4, 12);
  }
  ctx.translate(0, -bob);
  glow(ctx, 19, -22, 38, 0.42);
  poly(ctx, [-7, -40, 7, -40, 13, -10, -13, -10], '#f4c542');
  poly(ctx, [-7, -40, -1, -40, -6, -10, -13, -10], '#e0a92a');
  ctx.strokeStyle = '#e0a92a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(3, -34);
  ctx.lineTo(17, -30);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillRect(18.4, -30, 1.2, 4);
  ctx.fillRect(15.5, -27, 7, 2);
  ctx.fillRect(15.5, -16, 7, 2);
  ctx.fillStyle = '#ffe08f';
  ctx.fillRect(16.5, -25, 5, 9);
  poly(ctx, [-10, -40, -11, -53, -6, -66, 7, -58, 10, -47, 8, -40], '#f4c542');
  poly(ctx, [-10, -40, -11, -53, -6, -66, -3, -52, -4, -40], '#e0a92a');
  disc(ctx, 3, -48, 6.4, '#f6d7c0');
  poly(ctx, [-3, -55, 8, -55, 9.5, -50, 3, -52, -3, -49], INK);
  disc(ctx, 5.6, -47.4, 1, INK);
  ctx.restore();
}

function foxHead(ctx, eyeClosed) {
  poly(ctx, [0, -6, 4, -17, 8, -9, 13, -17, 15, -7, 25, 0, 14, 4, 2, 4], '#f08a3c');
  poly(ctx, [4, -17, 8, -9, 5, -9], '#c9622a');
  poly(ctx, [10, 0, 25, 0, 14, 4, 4, 4], '#fff1de');
  disc(ctx, 25, 0, 1.6, INK);
  if (eyeClosed) {
    ctx.fillStyle = INK;
    ctx.fillRect(12.5, -4.4, 3.4, 1);
  } else {
    disc(ctx, 14, -4, 1.3, INK);
  }
}

// Le renard. Modes : idle, walk, sniff, sit, sleep, happy. Pattes en (x, y).
export function drawFox(ctx, x, y, s, facing, t, mode = 'idle') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * facing, s);
  const O = '#f08a3c', D = '#c9622a', W = '#fff1de';
  const wag = Math.sin(t * (mode === 'happy' ? 16 : 3)) * (mode === 'happy' ? 5 : 2.5);

  if (mode === 'sleep') {
    const br = 1 + Math.sin(t * 1.6) * 0.04;
    ctx.save();
    ctx.scale(1, br);
    ctx.beginPath();
    ctx.ellipse(0, -8, 19, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = O;
    ctx.fill();
    ctx.restore();
    poly(ctx, [-18, -7, -20, -2, 4, 0, 17, -3, 11, -8, -4, -4], D);
    poly(ctx, [8, -1, 17, -3, 11, -8, 7, -5], W);
    ctx.save();
    ctx.translate(2, -6);
    ctx.rotate(0.35);
    ctx.scale(0.9, 0.9);
    foxHead(ctx, true);
    ctx.restore();
  } else if (mode === 'sit' || mode === 'happy') {
    poly(ctx, [-9, -5, -27, -10 + wag, -36, -5 + wag, -25, 0, -9, 0], O);
    poly(ctx, [-27, -10 + wag, -36, -5 + wag, -25, 0, -29, -5 + wag], W);
    poly(ctx, [-10, 0, -11, -12, 0, -28, 9, -26, 10, 0], O);
    poly(ctx, [3, -24, 9, -26, 10, -5, 5, -5], W);
    ctx.fillStyle = INK;
    ctx.fillRect(4, -7, 2.6, 7);
    ctx.fillRect(7.6, -7, 2.6, 7);
    ctx.save();
    ctx.translate(2, -30);
    foxHead(ctx, mode === 'happy');
    ctx.restore();
  } else {
    const a = mode === 'walk' ? Math.sin(t * 14) : 0;
    const bob = mode === 'walk' ? Math.abs(Math.sin(t * 14)) * 1.2 : 0;
    ctx.translate(0, -bob);
    // les pattes pivotent autour de la hanche, à l'intérieur du corps
    const leg = (hx, swing) => {
      ctx.save();
      ctx.translate(hx, -13);
      ctx.rotate(swing * 0.5);
      ctx.fillStyle = INK;
      ctx.fillRect(-1.4, 0, 2.8, 13 + bob);
      ctx.restore();
    };
    leg(-12, a);
    leg(-8, -a);
    leg(7, -a);
    leg(11, a);
    poly(ctx, [-16, -21, -34, -30 + wag, -45, -24 + wag, -34, -14 + wag, -16, -12], O);
    poly(ctx, [-34, -30 + wag, -45, -24 + wag, -34, -14 + wag, -38, -23 + wag], W);
    poly(ctx, [-18, -22, 10, -24, 16, -16, 12, -9, -16, -9], O);
    poly(ctx, [-16, -9, 12, -9, 14, -13, -12, -12], D);
    ctx.save();
    if (mode === 'sniff') {
      ctx.translate(12, -14);
      ctx.rotate(0.75 + Math.sin(t * 9) * 0.06);
    } else {
      ctx.translate(9, -22);
    }
    foxHead(ctx, false);
    ctx.restore();
  }
  ctx.restore();
}

const FOOD = {
  berries: ['#d8405a', '#c23350', '#e8566c'],
  myrtilles: ['#5468d0', '#4355b8', '#7488e8'],
  argousier: ['#f09a3c', '#de8428', '#ffb45a'],
  eglantine: ['#e0607a', '#c84a66', '#f58aa0'],
  astres: ['#ffd35a', '#f2b93c', '#ffe9a0'],
};

function star(ctx, r1, r2, n, fill) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? r2 : r1;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  poly(ctx, pts, fill);
}

// Petites icônes : trouvailles du sentier et nourriture du camp.
export function icon(ctx, id, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (FOOD[id]) {
    const [a, b, c] = FOOD[id];
    disc(ctx, -3.5, 2, 4, a);
    disc(ctx, 3.5, 2.5, 4, b);
    disc(ctx, 0, -3.5, 4, c);
    poly(ctx, [0, -8, 5, -11, 3, -6], '#5fae7c');
  } else if (id === 'feather') {
    ctx.rotate(-0.7);
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.4, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f3efff';
    ctx.fill();
    ctx.fillStyle = '#9d9bd2';
    ctx.fillRect(-0.5, -9, 1, 21);
  } else if (id === 'shell') {
    ctx.beginPath();
    ctx.arc(0, 3, 8, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = '#f3b6b0';
    ctx.fill();
    ctx.strokeStyle = '#d98a8a';
    ctx.lineWidth = 0.9;
    for (const a of [-0.9, -0.3, 0.3, 0.9]) {
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.lineTo(Math.sin(a) * 8, 3 - Math.cos(a) * 8);
      ctx.stroke();
    }
  } else if (id === 'stone') {
    poly(ctx, [-7, 4, -5, -4, 1, -7, 7, -2, 6, 5, -2, 6], '#8fd0d8');
    poly(ctx, [-5, -4, 1, -7, 2, -1, -3, 1], '#c9f0f0');
  } else if (id === 'acorn') {
    ctx.beginPath();
    ctx.ellipse(0, 2, 5, 6.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#d9a566';
    ctx.fill();
    poly(ctx, [-6.5, 0, -5, -5, 0, -7, 5, -5, 6.5, 0], '#8a5a3c');
    ctx.fillStyle = '#8a5a3c';
    ctx.fillRect(-0.7, -10, 1.4, 4);
  } else if (id === 'leaf') {
    ctx.rotate(0.5);
    poly(ctx, [0, -10, 6, -2, 4, 6, 0, 10, -4, 6, -6, -2], '#f0a04a');
    poly(ctx, [0, -10, 6, -2, 4, 6, 0, 10], '#e0803a');
  } else if (id === 'mushroom') {
    ctx.fillStyle = '#f6ead6';
    ctx.fillRect(-2.5, -1, 5, 9);
    ctx.beginPath();
    ctx.arc(0, 0, 9, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = '#e0605a';
    ctx.fill();
    disc(ctx, -4, -4, 1.5, '#fff1de');
    disc(ctx, 3, -5, 1.2, '#fff1de');
  } else if (id === 'starfish') {
    star(ctx, 10, 4, 5, '#f5946a');
    disc(ctx, 0, 0, 1.6, '#ffd0b0');
  } else if (id === 'glass') {
    poly(ctx, [-7, 3, -4, -5, 3, -6, 8, 0, 4, 6, -3, 6], '#7fd6b8');
    poly(ctx, [-4, -5, 3, -6, 2, -1, -3, 0], '#c6f4e2');
  } else if (id === 'driftwood') {
    ctx.rotate(-0.3);
    poly(ctx, [-10, -2, 8, -3.5, 10, 0, 7, 3, -10, 2.5], '#c9a98a');
    poly(ctx, [2, -3, 6, -9, 8, -8, 5, -3], '#c9a98a');
  } else if (id === 'crystal') {
    poly(ctx, [0, -10, 6, -2, 3, 9, -3, 9, -6, -2], '#b9a6f0');
    poly(ctx, [0, -10, 6, -2, 0, 0], '#e6dcff');
  } else if (id === 'cone') {
    for (let i = 0; i < 4; i++) {
      const w = 6.5 - i * 1.3, yy = 6 - i * 4.4;
      poly(ctx, [-w, yy, 0, yy - 6, w, yy], i % 2 ? '#8a5a3c' : '#a8744c');
    }
  } else if (id === 'snow') {
    ctx.strokeStyle = '#eef6ff';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(-Math.cos(a) * 9, -Math.sin(a) * 9);
      ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
      ctx.stroke();
    }
  } else if (id === 'stardust') {
    star(ctx, 9, 3.2, 4, '#ffe9a0');
    disc(ctx, 7, -7, 1.4, '#fff6d8');
    disc(ctx, -7, 6, 1.1, '#fff6d8');
  } else if (id === 'moon') {
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, -1.2, 1.2, true);
    ctx.arc(5, 0, 8.15, 1.808, -1.808, false);
    ctx.closePath();
    ctx.fillStyle = '#fff1c8';
    ctx.fill();
  } else if (id === 'comet') {
    poly(ctx, [4, 4, -10, -3, -7, -8], 'rgba(200,230,255,0.6)');
    disc(ctx, 4, 3, 4, '#dff2ff');
  }
  ctx.restore();
}

export function heart(ctx, x, y, s, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ff9a8a';
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.bezierCurveTo(-8, -2, -4, -8, 0, -3.5);
  ctx.bezierCurveTo(4, -8, 8, -2, 0, 4);
  ctx.fill();
  ctx.restore();
}

// Empreinte de renard : le signe de l'indice.
export function paw(ctx, x, y, t, s = 1) {
  const k = s * (1 + 0.12 * Math.sin(t * 4));
  glow(ctx, x, y, 22 * k, 0.45);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k * 0.62);
  ctx.fillStyle = 'rgba(255,236,190,0.96)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 6.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [dx, dy] of [[-7, -3], [-2.5, -7], [2.5, -7], [7, -3]]) {
    ctx.beginPath();
    ctx.ellipse(dx, dy, 2.4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Main fantôme qui montre où toucher, pour apprendre le premier geste sans un mot.
export function hand(ctx, x, y, t) {
  const p = (t * 0.9) % 1;
  const press = p < 0.25 ? p / 0.25 : p < 0.45 ? 1 : Math.max(0, 1 - (p - 0.45) / 0.2);
  if (p > 0.25 && p < 0.8) {
    const r = (p - 0.25) / 0.55;
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - r)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6 + r * 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(x + 3, y + 14 - press * 10);
  ctx.rotate(-0.35);
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.arc(0, 0, 4, Math.PI, 0);
  ctx.lineTo(4, 14);
  ctx.lineTo(12, 16);
  ctx.arc(10, 22, 6, -1.2, 0.6);
  ctx.lineTo(10, 34);
  ctx.lineTo(-7, 34);
  ctx.lineTo(-11, 22);
  ctx.lineTo(-4, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
