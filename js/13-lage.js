/* MeinKamerad – Lagekarte: taktische Zeichen auf einer Online-Karte oder einem eigenen Bild. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

var LAGE_KEY = 'meinkamerad-lage', LAGE_BILD_KEY = 'meinkamerad-lage-bild';
// Kartengrundlagen: freie Online-Karten mit Quellenangabe nach deren Nutzungsbedingungen
var LAGE_KARTEN = {
  topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', max: 17, sub: 'abc',
    quelle: 'Karte: © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA), Daten: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende' },
  osm: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', max: 19, sub: '',
    quelle: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende' }
};

function lageLaden() {
  var l = { modus: 'topo', mitte: [51.0, 10.3], zoom: 6, zeichen: [] };
  try {
    var j = JSON.parse(localStorage.getItem(LAGE_KEY) || 'null');
    if (j && typeof j === 'object') {
      if (['topo', 'osm', 'bild'].indexOf(j.modus) >= 0) l.modus = j.modus;
      if (Array.isArray(j.mitte) && j.mitte.length === 2 && isFinite(j.mitte[0]) && isFinite(j.mitte[1])) l.mitte = j.mitte;
      if (isFinite(j.zoom)) l.zoom = j.zoom;
      if (Array.isArray(j.zeichen)) l.zeichen = j.zeichen.filter(function (z) {
        return z && typeof z.sidc === 'string' && /^\d{20}$/.test(z.sidc) && (z.ebene === 'karte' || z.ebene === 'bild') && isFinite(z.x) && isFinite(z.y);
      });
    }
  } catch (e) { /* ohne Speicher leer */ }
  return l;
}
var LAGE = lageLaden();
function lageSpeichern() {
  try { localStorage.setItem(LAGE_KEY, JSON.stringify(LAGE)); return true; }
  catch (e) { lageMeldung('Speichern nicht möglich, der Speicher dieses Browsers ist voll.', true); return false; }
}
function lageBild() { try { return localStorage.getItem(LAGE_BILD_KEY) || ''; } catch (e) { return ''; } }
function lageMeldung(t, fehler) { $('lage-meldung').className = 'u-meldung' + (fehler ? ' fehler' : ''); $('lage-meldung').textContent = t; }
function lageEbene() { return LAGE.modus === 'bild' ? 'bild' : 'karte'; }

var lageKarte = null, lageGrund = null, lageMarker = {}, lageBereit = null, lageWartend = null;

function ladeLeaflet() {
  if (window.L) return Promise.resolve();
  if (!document.getElementById('leaflet-css')) {
    var l = document.createElement('link');
    l.id = 'leaflet-css'; l.rel = 'stylesheet'; l.href = 'vendor/leaflet.css';
    document.head.appendChild(l);
  }
  return ladeSkript('vendor/leaflet.js');
}

function zeigeLage() {
  if (lageBearbId) lageBearbeitenEnde();
  if (!lageBereit) {
    lageBereit = Promise.all([ladeLeaflet(), ladeMilsymbol()]).then(function () { msGeladen = true; lageAufbauen(); }, function () {
      lageBereit = null;
      $('lage-karte').innerHTML = '<p class="lage-leer">Die Kartenbibliothek konnte nicht geladen werden. Bitte die Verbindung prüfen und die Seite neu öffnen.</p>';
    });
  } else {
    lageBereit.then(function () { lageGrundlage(); });
  }
}

function lageAufbauen() { lageGrundlage(); }
// Karte neu anlegen, weil Online-Karte und Bild verschiedene Koordinatensysteme brauchen
function lageNeueKarte(bild) {
  if (lageKarte) { lageKarte.remove(); lageKarte = null; }
  lageMarker = {}; lageGrund = null;
  $('lage-karte').innerHTML = '';
  lageKarte = L.map('lage-karte', { crs: bild ? L.CRS.Simple : L.CRS.EPSG3857, zoomControl: true, attributionControl: true, minZoom: bild ? -5 : 2, zoomSnap: bild ? 0.25 : 1 });
  lageKarte.attributionControl.setPrefix('');
  lageKarte.on('moveend', function () {
    if (LAGE.modus === 'bild') return;
    var c = lageKarte.getCenter();
    LAGE.mitte = [Math.round(c.lat * 1e5) / 1e5, Math.round(c.lng * 1e5) / 1e5];
    LAGE.zoom = lageKarte.getZoom();
    lageSpeichern();
  });
}

// Grundlage wechseln: Online-Karte (Längen- und Breitengrade) oder eigenes Bild (Pixel)
function lageGrundlage() {
  if (!window.L || !window.ms) return;
  document.querySelector('input[name="lage-modus"][value="' + LAGE.modus + '"]').checked = true;
  $('lage-bild-steuerung').hidden = LAGE.modus !== 'bild';
  lageNeueKarte(LAGE.modus === 'bild');
  if (LAGE.modus === 'bild') {
    var bild = lageBild();
    $('lage-bild-weg').hidden = !bild;
    if (!bild) {
      lageKarte.setView([0, 0], 0);
      $('lage-karte').insertAdjacentHTML('beforeend', '<p class="lage-leer">Noch kein Bild gewählt. Tippe oben auf „Bild wählen“.</p>');
      lageZeichenZeigen();
      return;
    }
    var img = new Image();
    img.onload = function () {
      if (LAGE.modus !== 'bild') return;
      var g = [[0, 0], [-img.height, img.width]];
      lageGrund = L.imageOverlay(bild, g).addTo(lageKarte);
      lageKarte.fitBounds(g);
      lageZeichenZeigen();
    };
    img.src = bild;
  } else {
    var k = LAGE_KARTEN[LAGE.modus];
    lageGrund = L.tileLayer(k.url, { maxZoom: k.max, subdomains: k.sub || 'abc', attribution: k.quelle }).addTo(lageKarte);
    // Laden keine Kartenbilder (z. B. in einer Vorschau, die fremde Server sperrt, oder ohne Netz), einen Hinweis zeigen
    var geladen = false, fehler = 0;
    lageGrund.on('tileload', function () { geladen = true; var h = $('lage-karte').querySelector('.lage-kachelfehler'); if (h) h.remove(); });
    lageGrund.on('tileerror', function () {
      fehler++;
      if (geladen || fehler < 3 || $('lage-karte').querySelector('.lage-kachelfehler')) return;
      $('lage-karte').insertAdjacentHTML('beforeend', '<p class="lage-kachelfehler">Die Kartenbilder lassen sich hier nicht laden, zum Beispiel ohne Netz oder in einer Vorschau, die fremde Server sperrt. Auf der Website funktioniert die Karte. Alternativ „Eigenes Bild“ als Grundlage wählen.</p>');
    });
    lageKarte.setView(LAGE.mitte, Math.min(LAGE.zoom, k.max));
    lageZeichenZeigen();
  }
}

var SCHLOSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
var SCHLOSS_OFFEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>';
function lageIcon(z) {
  var sym = msSymbolAus(z, 30), gr = sym.getSize(), an = sym.getAnchor();
  return L.divIcon({ className: 'lage-zeichen' + (z.gesperrt ? ' gesperrt' : ''), html: sym.asSVG() + (z.gesperrt ? '<span class="lage-schloss" title="Gesperrt" style="left:' + Math.round(an.x - 8) + 'px;top:' + Math.round(gr.height + 3) + 'px">' + SCHLOSS + '</span>' : ''),
    iconSize: [gr.width, gr.height], iconAnchor: [an.x, an.y] });
}
function lageZeichen(id) { return LAGE.zeichen.filter(function (z) { return z.id === id; })[0]; }
function lagePos(z) { return z.ebene === 'bild' ? [z.y, z.x] : [z.y, z.x]; }

// Zeichen der aktuellen Ebene als verschiebbare Marker
function lageZeichenZeigen() {
  Object.keys(lageMarker).forEach(function (id) { lageKarte.removeLayer(lageMarker[id]); });
  lageMarker = {};
  var ebene = lageEbene();
  if (ebene === 'bild' && !lageBild()) {
    if (lageWartend) lageMeldung('Zuerst ein Bild wählen, dann wird das Zeichen daraufgesetzt.');
    renderLageListe(); return;
  }
  if (lageWartend) {
    // Neues Zeichen aus dem Baukasten in die Mitte des sichtbaren Ausschnitts setzen
    var c = lageKarte.getCenter();
    LAGE.zeichen.push({ id: 'z' + Date.now(), sidc: lageWartend.sidc, opt: lageWartend.opt, name: lageWartend.name, ebene: ebene, x: c.lng, y: c.lat });
    lageWartend = null;
    lageSpeichern();
    lageMeldung('Zeichen in die Kartenmitte gesetzt. Zum Verschieben gedrückt halten und ziehen.');
  }
  LAGE.zeichen.filter(function (z) { return z.ebene === ebene; }).forEach(function (z) {
    var m = L.marker(lagePos(z), { icon: lageIcon(z), draggable: !z.gesperrt, keyboard: true, title: (z.name || '') + (z.gesperrt ? ' (gesperrt)' : ''), autoPan: true }).addTo(lageKarte);
    m.on('dragend', function () {
      var p = m.getLatLng();
      z.x = p.lng; z.y = p.lat;
      lageSpeichern();
    });
    m.bindPopup(function () {
      return '<div class="lage-popup"><b>' + esc(z.name || 'Zeichen') + '</b>' + (z.opt && z.opt.uniqueDesignation ? '<span>' + esc(z.opt.uniqueDesignation) + '</span>' : '') +
        '<div class="lage-popup-knoepfe">' +
        '<button type="button" class="knopf sekundaer" data-lage-sperre="' + z.id + '" aria-pressed="' + !!z.gesperrt + '">' + (z.gesperrt ? SCHLOSS_OFFEN + 'Entsperren' : SCHLOSS + 'Sperren') + '</button>' +
        '<button type="button" class="knopf sekundaer" data-lage-bearb="' + z.id + '"' + (z.gesperrt ? ' disabled' : '') + '>Bearbeiten</button>' +
        '<button type="button" class="knopf sekundaer" data-lage-weg="' + z.id + '"' + (z.gesperrt ? ' disabled' : '') + '>Löschen</button>' +
        '</div>' + (z.gesperrt ? '<small>Gesperrt: nicht verschiebbar, nicht änderbar.</small>' : '') + '</div>';
    }, { minWidth: 200 });
    lageMarker[z.id] = m;
  });
  renderLageListe();
}

function renderLageListe() {
  var ebene = lageEbene(), liste = LAGE.zeichen.filter(function (z) { return z.ebene === ebene; });
  $('lage-anz').textContent = liste.length ? String(liste.length) : '';
  $('lage-liste').innerHTML = liste.length ? liste.map(function (z) {
    return '<div class="fav-item"><button type="button" class="zeile mit-icon" data-lage-zeige="' + z.id + '">' +
      '<span class="lage-liste-zeichen">' + (window.ms ? msSymbolAus({ sidc: z.sidc, opt: { fill: z.opt.fill, colorMode: z.opt.colorMode, standard: 'APP6' } }, 18).asSVG() : '') + '</span>' +
      '<span class="n">' + esc(z.name || 'Zeichen') + (z.opt && z.opt.uniqueDesignation ? ' · ' + esc(z.opt.uniqueDesignation) : '') + '</span>' +
      (z.gesperrt ? '<span class="lage-liste-schloss" title="Gesperrt">' + SCHLOSS + '</span>' : '') + '</button>' +
      (z.gesperrt ? '' : '<button type="button" class="stern-klein loeschen" data-lage-weg="' + z.id + '" aria-label="Zeichen löschen">×</button>') + '</div>';
  }).join('') : '<p class="hint" style="padding:12px">Noch keine Zeichen auf dieser Grundlage.</p>';
}

function lageSperren(id) {
  var z = lageZeichen(id);
  if (!z) return;
  z.gesperrt = !z.gesperrt;
  lageSpeichern();
  lageZeichenZeigen();
  if (lageMarker[id]) lageMarker[id].openPopup();
  lageMeldung(z.gesperrt ? 'Zeichen gesperrt.' : 'Zeichen entsperrt.');
}
// Bearbeiten: Baukasten mit den Werten des Zeichens füllen und zurück auf die Karte
var lageBearbId = null;
function lageBearbeiten(id) {
  var z = lageZeichen(id);
  if (!z || z.gesperrt) return;
  lageBearbId = id;
  msFormularSetzen(z);
  $('ms-auf-karte').lastChild.textContent = 'Änderungen übernehmen';
  $('ms-bearb-abbrechen').hidden = false;
  $('ms-bearb-hinweis').hidden = false;
  go('symbole');
}
function lageBearbeitenEnde() {
  lageBearbId = null;
  $('ms-auf-karte').lastChild.textContent = 'Auf Lagekarte setzen';
  $('ms-bearb-abbrechen').hidden = true;
  $('ms-bearb-hinweis').hidden = true;
}
function lageLoeschen(id) {
  var zz = lageZeichen(id);
  if (zz && zz.gesperrt) return;
  LAGE.zeichen = LAGE.zeichen.filter(function (z) { return z.id !== id; });
  lageSpeichern();
  if (lageKarte) lageKarte.closePopup();
  lageZeichenZeigen();
  lageMeldung('Zeichen gelöscht.');
}

// Bedienung
document.querySelectorAll('input[name="lage-modus"]').forEach(function (r) {
  r.addEventListener('change', function (e) { LAGE.modus = e.target.value; lageSpeichern(); lageMeldung(''); lageGrundlage(); });
});
$('lage-liste').addEventListener('click', function (e) {
  var w = e.target.closest('button[data-lage-weg]');
  if (w) { lageLoeschen(w.getAttribute('data-lage-weg')); return; }
  var b = e.target.closest('button[data-lage-zeige]');
  if (b && lageMarker[b.getAttribute('data-lage-zeige')]) {
    var m = lageMarker[b.getAttribute('data-lage-zeige')];
    lageKarte.panTo(m.getLatLng());
    m.openPopup();
    $('lage-karte').scrollIntoView({ block: 'center' });
  }
});
$('lage-karte').addEventListener('click', function (e) {
  var w = e.target.closest('button[data-lage-weg]');
  if (w) { lageLoeschen(w.getAttribute('data-lage-weg')); return; }
  var s = e.target.closest('button[data-lage-sperre]');
  if (s) { lageSperren(s.getAttribute('data-lage-sperre')); return; }
  var b = e.target.closest('button[data-lage-bearb]');
  if (b) lageBearbeiten(b.getAttribute('data-lage-bearb'));
});
$('lage-bild-knopf').addEventListener('click', function () { $('lage-bild-datei').click(); });
$('lage-bild-weg').addEventListener('click', function () {
  try { localStorage.removeItem(LAGE_BILD_KEY); } catch (e) { /* egal */ }
  LAGE.zeichen = LAGE.zeichen.filter(function (z) { return z.ebene !== 'bild'; });
  lageSpeichern(); lageGrundlage(); lageMeldung('Bild und die Zeichen darauf entfernt.');
});
// Bild verkleinern (längste Seite höchstens 2000 Pixel), damit es in den Speicher des Browsers passt
$('lage-bild-datei').addEventListener('change', function (e) {
  var f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  var r = new FileReader();
  r.onload = function () {
    var img = new Image();
    img.onload = function () {
      var s = Math.min(1, 2000 / Math.max(img.width, img.height));
      var c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      var daten = c.toDataURL('image/jpeg', 0.82);
      try { localStorage.setItem(LAGE_BILD_KEY, daten); }
      catch (err) { lageMeldung('Das Bild ist zu groß für den Speicher dieses Browsers. Bitte ein kleineres Bild wählen.', true); return; }
      LAGE.zeichen = LAGE.zeichen.filter(function (z) { return z.ebene !== 'bild'; });
      lageSpeichern(); lageGrundlage(); lageMeldung('Bild übernommen.');
    };
    img.onerror = function () { lageMeldung('Diese Datei ist kein lesbares Bild.', true); };
    img.src = String(r.result);
  };
  r.readAsDataURL(f);
});
// Aus dem Baukasten: Zeichen merken und zur Karte wechseln
$('ms-auf-karte').addEventListener('click', function () {
  if (!msGeladen) return;
  if (lageBearbId) {
    var z = lageZeichen(lageBearbId), a = msAuswahl();
    if (z) { z.sidc = a.sidc; z.opt = a.opt; z.name = a.name; lageSpeichern(); }
    lageBearbeitenEnde();
    go('lage');
    lageMeldung('Zeichen geändert.');
    return;
  }
  lageWartend = msAuswahl();
  go('lage');
});
$('ms-bearb-abbrechen').addEventListener('click', function () { lageBearbeitenEnde(); go('lage'); });
