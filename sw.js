const APP_VERSION = 'v2.6.2';
const CACHE_NAME = 'timetasks-cache-' + APP_VERSION;
const ASSETS_TO_CACHE = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(ASSETS_TO_CACHE); })
      .then(function() { return self.skipWaiting(); })
      .catch(function(err) { console.warn('SW install failed:', err); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cache) {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
        return res;
      }).catch(function() {
        return caches.match(req).then(function(r) { return r || caches.match('./index.html'); });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
        return res;
      });
    })
  );
});