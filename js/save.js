const KEY = 'lueur-save-v1';

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
  muted: false,
});

export function load() {
  try {
    return Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {});
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
