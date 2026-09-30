// Les règles des dioramas, sans aucun dessin : le jeu, les indices et le vérificateur
// (tools/check.mjs) s'appuient tous sur ce fichier.
//
// Légende des cartes :
//   .  eau / vide       #  pierre            o  nénuphar (renard seulement)
//   G  départ fille     F  départ renard     L  lumière à rallumer (but de la fille)
//   p  dalle → lève r   q  dalle → lève s    (levée tant qu'on reste sur la dalle)
//   W  roue du pont     P  pivot du pont tournant
//   a  b  les deux bouts d'un terrier (renard seulement)
//   t  bascule : à chaque passage, les dalles u descendent et les v montent (ou l'inverse)
//   E  source du rayon  M N  miroirs         Y  roue des miroirs
//   K  cristal : éclairé par le rayon, il lève les dalles k et baisse les dalles j
//
// Une dalle levée reste levée tant que quelqu'un se tient dessus.

const SOLID = 'EMNK';
const RAISED = 'rskjuv';
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export const cell = (L, x, y) => (L.map[y] && L.map[y][x]) || null;
const at = (p, x, y) => p[0] === x && p[1] === y;
const occupied = (s, x, y) => at(s.girl, x, y) || at(s.fox, x, y);
const pressed = (L, s, c) => (L.pos[c] || []).some(([x, y]) => occupied(s, x, y));

function trace(L, mir) {
  let [x, y] = L.pos.E[0];
  let [dx, dy] = L.lv.beam;
  const path = [[x, y]];
  for (let i = 0; i < 80; i++) {
    x += dx;
    y += dy;
    const c = cell(L, x, y);
    path.push([x, y]);
    if (!c) return { lit: false, path };
    if (c === 'K') return { lit: true, path };
    if (c === 'M' || c === 'N') {
      // '/' renvoie (dx,dy) vers (-dy,-dx) ; '\' vers (dy,dx)
      const slash = (c === 'M') !== mir;
      [dx, dy] = slash ? [-dy, -dx] : [dy, dx];
    } else if (c === 'E' || c === 'L') {
      return { lit: false, path };
    }
  }
  return { lit: false, path };
}

export function parse(lv) {
  const pos = {};
  lv.map.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '.' && c !== '#') (pos[c] ||= []).push([x, y]);
  }));
  const L = { lv, map: lv.map, pos, goal: pos.L[0], pivot: pos.P ? pos.P[0] : null, beams: null };
  if (pos.E) L.beams = [trace(L, false), trace(L, true)];
  return L;
}

export function start(L) {
  return { girl: [...L.pos.G[0]], fox: [...L.pos.F[0]], vert: L.lv.bridge === 'v', flip: false, mir: false };
}

export function onArm(L, s, x, y) {
  const p = L.pivot;
  if (!p) return false;
  return s.vert ? x === p[0] && Math.abs(y - p[1]) === 1 : y === p[1] && Math.abs(x - p[0]) === 1;
}

export const beam = (L, s) => L.beams && L.beams[+s.mir];

export function isUp(L, s, c, x, y) {
  if (occupied(s, x, y)) return true;
  if (c === 'r') return pressed(L, s, 'p');
  if (c === 's') return pressed(L, s, 'q');
  if (c === 'k') return beam(L, s).lit;
  if (c === 'j') return !beam(L, s).lit;
  if (c === 'u') return !s.flip;
  return s.flip;
}

export function walkable(L, s, who, x, y) {
  const c = cell(L, x, y);
  if (!c) return false;
  if (onArm(L, s, x, y)) return true;
  if (c === '.' || SOLID.includes(c)) return false;
  if (c === 'o') return who === 'fox';
  if (RAISED.includes(c)) return isUp(L, s, c, x, y);
  return true;
}

// Cases où `who` peut aller en un pas (le terrier compte pour un pas).
export function moves(L, s, who) {
  const [x, y] = s[who];
  const out = [];
  for (const [dx, dy] of DIRS) {
    if (walkable(L, s, who, x + dx, y + dy)) out.push([x + dx, y + dy]);
  }
  if (who === 'fox') {
    const c = cell(L, x, y);
    if (c === 'a' || c === 'b') out.push(...(L.pos[c === 'a' ? 'b' : 'a'] || []));
  }
  return out;
}

export function step(L, s, who, to) {
  const n = { ...s, [who]: [to[0], to[1]] };
  if (cell(L, to[0], to[1]) === 't') n.flip = !s.flip;
  return n;
}

// Quelle roue la fille peut-elle tourner, là où elle se tient ?
export function wheel(L, s) {
  const c = cell(L, s.girl[0], s.girl[1]);
  if (c === 'W' && L.pivot) return 'W';
  if (c === 'Y' && L.beams) return 'Y';
  return null;
}

// Ceux que le pont emporte en tournant : [{ who, d }] avec d = -1 ou +1 le long du bras.
export function riders(L, s) {
  const [px, py] = L.pivot;
  const out = [];
  for (const who of ['girl', 'fox']) {
    const [x, y] = s[who];
    const d = s.vert ? y - py : x - px;
    if ((s.vert ? x === px : y === py) && Math.abs(d) === 1) out.push({ who, d });
  }
  return out;
}

export function turn(L, s) {
  const w = wheel(L, s);
  if (w === 'Y') return { ...s, mir: !s.mir };
  const [px, py] = L.pivot;
  const n = { ...s, vert: !s.vert };
  for (const { who, d } of riders(L, s)) n[who] = n.vert ? [px, py + d] : [px + d, py];
  return n;
}

export const solved = (L, s) => at(s.girl, L.goal[0], L.goal[1]);
export const key = s => `${s.girl},${s.fox},${+s.vert}${+s.flip}${+s.mir}`;

export function actions(L, s) {
  const out = [];
  for (const who of ['girl', 'fox']) {
    for (const to of moves(L, s, who)) out.push({ who, to });
  }
  if (wheel(L, s)) out.push({ who: 'girl', turn: true });
  return out;
}

export const apply = (L, s, a) => (a.turn ? turn(L, s) : step(L, s, a.who, a.to));

// Chemin le plus simple vers la lumière depuis l'état s : liste d'actions, ou null.
// Changer de personnage coûte cher, pour que la solution se lise « l'un, puis l'autre ».
export function solve(L, s) {
  const SWITCH = 6;
  const best = new Map([[key(s) + '-', 0]]);
  const prev = new Map();
  const buckets = [[{ s, last: '-', k: key(s) + '-' }]];
  for (let cost = 0; cost < buckets.length; cost++) {
    for (const cur of buckets[cost] || []) {
      if (best.get(cur.k) !== cost) continue;
      if (solved(L, cur.s)) {
        const out = [];
        for (let k = cur.k; prev.has(k); k = prev.get(k).from) out.unshift(prev.get(k).a);
        return out;
      }
      for (const a of actions(L, cur.s)) {
        const n = apply(L, cur.s, a);
        const last = a.who[0];
        const nk = key(n) + last;
        const c = cost + 1 + (cur.last !== '-' && cur.last !== last ? SWITCH : 0);
        if (best.has(nk) && best.get(nk) <= c) continue;
        best.set(nk, c);
        prev.set(nk, { from: cur.k, a });
        (buckets[c] ||= []).push({ s: n, last, k: nk });
      }
    }
  }
  return null;
}

// L'indice : qui doit bouger, et jusqu'où (le bout de sa série de pas).
export function hint(L, s) {
  const sol = solve(L, s);
  if (!sol || !sol.length) return null;
  const who = sol[0].who;
  if (sol[0].turn) return { who, turn: true, to: s.girl };
  let to = sol[0].to;
  for (let i = 1; i < sol.length && sol[i].who === who && !sol[i].turn; i++) to = sol[i].to;
  return { who, to };
}
