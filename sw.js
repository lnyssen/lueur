// Hors ligne : on sert d'abord le réseau (pour que les mises à jour arrivent tout de suite),
// et la copie gardée en cache quand il n'y a pas de connexion.
const CACHE = 'lueur-v3';
const FILES = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/main.js', 'js/save.js', 'js/draw.js', 'js/audio.js', 'js/levels.js', 'js/rules.js',
  'js/road.js', 'js/camp.js', 'js/diorama.js', 'js/icons.js', 'js/settings.js', 'js/critters.js', 'js/ending.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(url.pathname, copy));
        }
        return res;
      })
      .catch(() => caches.match(url.pathname).then(hit => hit || caches.match('index.html'))),
  );
});
