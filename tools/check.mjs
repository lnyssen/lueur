// Vérifie chaque diorama : une solution existe, et aucun état atteignable n'est une impasse.
import { CHAPTERS } from '../js/levels.js';
import { parse, start, solve, actions, apply, key, solved } from '../js/rules.js';

let bad = 0;
for (const [ci, ch] of CHAPTERS.entries()) {
  for (const [li, lv] of ch.levels.entries()) {
    const widths = new Set(lv.map.map(r => r.length));
    const L = parse(lv), s0 = start(L);
    const sol = solve(L, s0);
    // états atteignables, puis ceux d'où la lumière reste atteignable
    const seen = new Map([[key(s0), s0]]), back = new Map(), queue = [s0], goals = [];
    while (queue.length) {
      const s = queue.pop(), k = key(s);
      if (solved(L, s)) goals.push(k);
      for (const a of actions(L, s)) {
        const n = apply(L, s, a), nk = key(n);
        (back.get(nk) || back.set(nk, []).get(nk)).push(k);
        if (!seen.has(nk)) { seen.set(nk, n); queue.push(n); }
      }
    }
    const ok = new Set(goals), q2 = [...goals];
    while (q2.length) for (const p of back.get(q2.pop()) || []) if (!ok.has(p)) { ok.add(p); q2.push(p); }
    const dead = seen.size - ok.size;
    let text = '—';
    if (sol) {
      const parts = [];
      for (const a of sol) {
        const label = a.turn ? 'roue' : `${a.who === 'girl' ? 'fille' : 'renard'}→${a.to}`;
        const last = parts[parts.length - 1];
        if (!a.turn && last && last.who === a.who && !last.turn) last.label = label;
        else parts.push({ who: a.who, turn: a.turn, label });
      }
      text = parts.map(p => p.label).join('  ');
    }
    // le monument de la dernière étape ne doit rien cacher : les cases derrière lui restent vides
    const hidden = [];
    if (li === ch.levels.length - 1) {
      const [gx, gy] = L.goal;
      for (let k = 1; k <= 3; k++) {
        const c = lv.map[gy - k]?.[gx - k];
        if (c && c !== '.') hidden.push(`${c}(${gx - k},${gy - k})`);
      }
    }
    const flag = !sol || dead || widths.size > 1 || hidden.length;
    if (flag) bad++;
    console.log(`${flag ? '✗' : '✓'} ${ch.id} ${li + 1} : ${sol ? sol.length + ' pas' : 'SANS SOLUTION'}, ${seen.size} états, ${dead} impasses${widths.size > 1 ? ', LIGNES INÉGALES' : ''}${hidden.length ? ', CACHÉ PAR LE MONUMENT : ' + hidden : ''}\n    ${text}`);
  }
}
process.exit(bad ? 1 : 0);
