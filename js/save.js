const KEY = 'lueur-save-v1';

// Réglages : volumes de 0 à 1, indices auto | ask | never, vue des énigmes auto | near | far.
const defaults = () => ({
  music: 0.8,
  sfx: 0.8,
  hints: 'auto',
  zoom: 'auto',
  calm: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
});

const fresh = () => ({
  chapter: 0,
  scene: 'road',
  x: 120,
  finds: {},
  berries: false,
  bridge: false,
  stage: 0,
  lit: false,
  bond: 0,
  best: 0,          // nombre de régions déjà rallumées
  opts: defaults(),
});

export function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || {};
    const state = Object.assign(fresh(), saved);
    state.opts = { ...defaults(), ...saved.opts };
    state.best = Math.max(state.best | 0, state.chapter + (state.lit ? 1 : 0));
    return state;
  } catch {
    return fresh();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* stockage indisponible : on joue sans sauvegarde */ }
}

export function wipe() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* idem */ }
}

// Tout recommencer, en gardant les réglages.
export function restart(state) {
  const opts = state.opts;
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, fresh(), { opts });
  save(state);
}
