/* MeinKamerad – Start der Seite. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

window.addEventListener('hashchange', route);

profilAnwenden();
fuelleDienstgrade();
render();
route();

// Als App: Service Worker nur auf der echten Website (https), nicht in der Vorschau oder als Datei
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !(window.claude && window.claude.use)) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* ohne Offline-Funktion weiter */ }); });
}
// Installieren: Android und Chrome bieten einen eigenen Dialog an, iPhone über „Teilen“
var installEreignis = null;
var alsApp = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
var istIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function renderInstallieren() {
  $('app-fertig').hidden = !alsApp;
  $('app-knopf').hidden = alsApp || !installEreignis;
  $('app-ios').hidden = alsApp || !istIos;
  $('app-sonst').hidden = alsApp || istIos || !!installEreignis;
}
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEreignis = e; renderInstallieren(); });
window.addEventListener('appinstalled', function () { alsApp = true; installEreignis = null; renderInstallieren(); });
$('app-knopf').querySelector('button').addEventListener('click', function () {
  if (!installEreignis) return;
  installEreignis.prompt();
  installEreignis.userChoice.then(function () { installEreignis = null; renderInstallieren(); });
});
renderInstallieren();
