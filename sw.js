/* MeinKamerad – Service Worker: macht die Seite offline nutzbar und als App installierbar.
   Strategie: immer zuerst aus dem Netz laden (damit neue Werte aus daten.js sofort ankommen),
   bei fehlender Verbindung die zuletzt gespeicherte Fassung nehmen.
   Bei neuen Dateien die Liste DATEIEN ergänzen und VERSION hochzählen. */
var VERSION = 'meinkamerad-v12';
var DATEIEN = [
  './', 'index.html', 'style.css', 'daten.js', 'manifest.webmanifest',
  'js/01-grundlagen.js', 'js/02-dienstgrade.js', 'js/03-favoriten.js', 'js/04-vergleich.js', 'js/05-duz.js',
  'js/06-netto.js', 'js/07-rechner.js', 'js/08-ereignisse.js', 'js/09-urlaubskartei.js', 'js/10-profil.js',
  'js/11-zeitstrahl.js', 'js/12-symbole.js', 'js/13-koordinaten.js', 'js/14-lage.js', 'js/15-start.js', 'js/16-foto.js', 'js/17-skizze.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(DATEIEN); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('meinkamerad-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var eigen = url.origin === self.location.origin;
  var schrift = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!eigen && !schrift) return;
  if (schrift) {
    // Schriften ändern sich nicht: aus dem Speicher, sonst laden und merken
    e.respondWith(caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) { var k = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, k); }); return res; });
    }));
    return;
  }
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) { var k = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, k); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
  }));
});
