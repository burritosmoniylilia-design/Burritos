const CACHE = 'moni-y-lilia-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './data.js',
  './firebase-config.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Cache-first para el "shell" de la app. Todo lo que va a Firestore
// (firestore.googleapis.com) se deja pasar directo a la red, nunca se cachea aquí.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin.includes('googleapis') || url.origin.includes('gstatic') || url.origin.includes('firebaseio')) {
    return; // deja pasar sin interceptar (Firebase maneja su propio caché/offline)
  }
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
