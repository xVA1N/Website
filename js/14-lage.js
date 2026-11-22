/* MeinKamerad – Lagekarte: taktische Zeichen, Linien, Pfeile und Räume auf einer Online-Karte oder einem eigenen Bild.
   Mehrere Lagekarten, Koordinaten in MGRS. Teil von index.html, Reihenfolge der Skripte beachten. */
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
// Farben für Linien, Pfeile und Räume (eigene Kräfte blau, Feind rot wie in APP-6)
var LAGE_FARBEN = { blau: ['#0060C0', 'Blau (eigene)'], rot: ['#D01818', 'Rot (Feind)'], schwarz: ['#111111', 'Schwarz (allgemein)'], gruen: ['#118833', 'Grün (Hindernis, Gelände)'] };
var LAGE_TYPEN = { linie: 'Linie', pfeil: 'Pfeil', raum: 'Raum' };

/* ---------- Speicher: mehrere Lagekarten ---------- */
function lageNeu(name) {
  return { id: 'k' + Date.now() + Math.floor(Math.random() * 1000), name: name, modus: 'topo', mitte: [51.0, 10.3], zoom: 6, zeichen: [], formen: [] };
}
function lageKartePruefen(k) {
  var l = lageNeu(typeof k.name === 'string' && k.name.trim() ? k.name.trim().slice(0, 40) : 'Lagekarte');
  if (typeof k.id === 'string' && /^k[\w-]+$/.test(k.id)) l.id = k.id;
  if (['topo', 'osm', 'bild'].indexOf(k.modus) >= 0) l.modus = k.modus;
  if (Array.isArray(k.mitte) && k.mitte.length === 2 && isFinite(k.mitte[0]) && isFinite(k.mitte[1])) l.mitte = k.mitte;
  if (isFinite(k.zoom)) l.zoom = k.zoom;
  if (Array.isArray(k.zeichen)) l.zeichen = k.zeichen.filter(function (z) {
    return z && typeof z.sidc === 'string' && /^\d{20}$/.test(z.sidc) && (z.ebene === 'karte' || z.ebene === 'bild') && isFinite(z.x) && isFinite(z.y);
  });
  if (Array.isArray(k.formen)) l.formen = k.formen.filter(function (f) {
    return f && LAGE_TYPEN[f.typ] && LAGE_FARBEN[f.farbe] && (f.ebene === 'karte' || f.ebene === 'bild') && Array.isArray(f.punkte) &&
      f.punkte.length >= 2 && f.punkte.every(function (p) { return Array.isArray(p) && isFinite(p[0]) && isFinite(p[1]); });
  });
  return l;
}
function lageLaden() {
  var alle = null, alt = null;
  try {
    var j = JSON.parse(localStorage.getItem(LAGE_KEY) || 'null');
    if (j && j.version === 2 && Array.isArray(j.karten)) alle = { version: 2, aktiv: j.aktiv, karten: j.karten.map(lageKartePruefen) };
    else if (j && typeof j === 'object') alt = j;
  } catch (e) { /* ohne Speicher leer */ }
  if (!alle) {
    // Alter Speicherstand mit nur einer Karte: übernehmen, das Bild unter dem neuen Namen ablegen
    var erste = lageKartePruefen(alt || {});
    erste.name = 'Lage 1';
    alle = { version: 2, aktiv: erste.id, karten: [erste] };
    try {
      var bild = localStorage.getItem(LAGE_BILD_KEY);
      if (bild) { localStorage.setItem(LAGE_BILD_KEY + '-' + erste.id, bild); localStorage.removeItem(LAGE_BILD_KEY); }
      if (alt) localStorage.setItem(LAGE_KEY, JSON.stringify(alle));
    } catch (e) { /* egal */ }
  }
  if (!alle.karten.length) alle.karten.push(lageNeu('Lage 1'));
  if (!alle.karten.some(function (k) { return k.id === alle.aktiv; })) alle.aktiv = alle.karten[0].id;
  return alle;
}
var LAGE_ALLE = lageLaden();
var LAGE = LAGE_ALLE.karten.filter(function (k) { return k.id === LAGE_ALLE.aktiv; })[0];
function lageSpeichern() {
  try { localStorage.setItem(LAGE_KEY, JSON.stringify(LAGE_ALLE)); return true; }
  catch (e) { lageMeldung('Speichern nicht möglich, der Speicher dieses Browsers ist voll.', true); return false; }
}
function lageBildKey(k) { return LAGE_BILD_KEY + '-' + (k || LAGE).id; }
function lageBild() { try { return localStorage.getItem(lageBildKey()) || ''; } catch (e) { return ''; } }
function lageMeldung(t, fehler) { $('lage-meldung').className = 'u-meldung' + (fehler ? ' fehler' : ''); $('lage-meldung').textContent = t; }
function lageEbene() { return LAGE.modus === 'bild' ? 'bild' : 'karte'; }

var lageKarte = null, lageGrund = null, lageMarker = {}, lageFormLayer = {}, lageBereit = null, lageWartend = null;
var lageZeichnen = null;   // { typ, punkte, linie } während eine Form gezeichnet wird
var lagePunkteBearb = null; // { id, griffe } während die Punkte einer Form verschoben werden

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
  renderLageWahl();
  if (!lageBereit) {
    lageBereit = Promise.all([ladeLeaflet(), ladeMilsymbol()]).then(function () { msGeladen = true; lageGrundlage(); }, function () {
      lageBereit = null;
      $('lage-karte').innerHTML = '<p class="lage-leer">Die Kartenbibliothek konnte nicht geladen werden. Bitte die Verbindung prüfen und die Seite neu öffnen.</p>';
    });
  } else {
    lageBereit.then(function () { lageGrundlage(); });
  }
}

/* ---------- Auswahl der Lagekarte ---------- */
function renderLageWahl() {
  $('lage-wahl').innerHTML = LAGE_ALLE.karten.map(function (k) { return '<option value="' + k.id + '">' + esc(k.name) + '</option>'; }).join('');
  $('lage-wahl').value = LAGE.id;
  $('lage-karte-weg').disabled = LAGE_ALLE.karten.length < 2;
}
function lageWechseln(id) {
  var k = LAGE_ALLE.karten.filter(function (x) { return x.id === id; })[0];
  if (!k) return;
  lageZeichnenEnde(); lagePunkteEnde();
  LAGE = k; LAGE_ALLE.aktiv = k.id;
  lageSpeichern(); renderLageWahl(); lageMeldung('');
  if (window.L && window.ms) lageGrundlage();
}

/* ---------- Karte und Grundlage ---------- */
// Karte neu anlegen, weil Online-Karte und Bild verschiedene Koordinatensysteme brauchen
function lageNeueKarte(bild) {
  if (lageKarte) { lageKarte.remove(); lageKarte = null; }
  lageMarker = {}; lageFormLayer = {}; lageGrund = null;
  $('lage-karte').innerHTML = '';
  lageKarte = L.map('lage-karte', { crs: bild ? L.CRS.Simple : L.CRS.EPSG3857, zoomControl: true, attributionControl: true, minZoom: bild ? -5 : 2, zoomSnap: bild ? 0.25 : 1 });
  lageKarte.attributionControl.setPrefix('');
  lageKarte.on('moveend', function () {
    lageKoordinateZeigen();
    if (LAGE.modus === 'bild') return;
    var c = lageKarte.getCenter();
    LAGE.mitte = [Math.round(c.lat * 1e5) / 1e5, Math.round(c.lng * 1e5) / 1e5];
    LAGE.zoom = lageKarte.getZoom();
    lageSpeichern();
  });
  lageKarte.on('move', lageKoordinateZeigen);
  lageKarte.on('zoomend', lagePfeileNeu);
  lageKarte.on('click', lageKartenKlick);
  // Fadenkreuz in der Mitte und Koordinatenanzeige (nur auf Online-Karten)
  $('lage-karte').insertAdjacentHTML('beforeend', '<div class="lage-kreuz" aria-hidden="true"></div><div class="lage-koord" id="lage-koord" aria-live="off"></div>');
  $('lage-karte').classList.toggle('mit-koord', !bild);
}
function lageKoordinateZeigen() {
  var el = $('lage-koord');
  if (!el || !lageKarte) return;
  if (LAGE.modus === 'bild') { el.textContent = ''; return; }
  var c = lageKarte.getCenter();
  el.textContent = 'MGRS ' + nachMgrs(c.lat, c.lng, 5);
}

// Grundlage wechseln: Online-Karte (Längen- und Breitengrade) oder eigenes Bild (Pixel)
function lageGrundlage() {
  if (!window.L || !window.ms) return;
  document.querySelector('input[name="lage-modus"][value="' + LAGE.modus + '"]').checked = true;
  $('lage-bild-steuerung').hidden = LAGE.modus !== 'bild';
  $('lage-ziel-wrap').hidden = LAGE.modus === 'bild';
  lageNeueKarte(LAGE.modus === 'bild');
  if (LAGE.modus === 'bild') {
    var bild = lageBild();
    $('lage-bild-weg').hidden = !bild;
    if (!bild) {
      lageKarte.setView([0, 0], 0);
      $('lage-karte').insertAdjacentHTML('beforeend', '<p class="lage-leer">Noch kein Bild gewählt. Tippe oben auf „Bild wählen“.</p>');
      lageAllesZeigen();
      return;
    }
    var img = new Image();
    img.onload = function () {
      if (LAGE.modus !== 'bild') return;
      var g = [[0, 0], [-img.height, img.width]];
      lageGrund = L.imageOverlay(bild, g).addTo(lageKarte);
      lageKarte.fitBounds(g);
      lageAllesZeigen();
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
    lageAllesZeigen();
  }
}
function lageAllesZeigen() { lageFormenZeigen(); lageZeichenZeigen(); lageKoordinateZeigen(); }

/* ---------- Taktische Zeichen ---------- */
var SCHLOSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
var SCHLOSS_OFFEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>';
function lageIcon(z) {
  var sym = msSymbolAus(z, 30), gr = sym.getSize(), an = sym.getAnchor();
  return L.divIcon({ className: 'lage-zeichen' + (z.gesperrt ? ' gesperrt' : ''), html: sym.asSVG() + (z.gesperrt ? '<span class="lage-schloss" title="Gesperrt" style="left:' + Math.round(an.x - 8) + 'px;top:' + Math.round(gr.height + 3) + 'px">' + SCHLOSS + '</span>' : ''),
    iconSize: [gr.width, gr.height], iconAnchor: [an.x, an.y] });
}
function lageZeichen(id) { return LAGE.zeichen.filter(function (z) { return z.id === id; })[0]; }
function lageForm(id) { return LAGE.formen.filter(function (f) { return f.id === id; })[0]; }
function lageMgrsText(lat, lng) { return LAGE.modus === 'bild' ? '' : '<span class="lage-popup-mgrs">MGRS ' + esc(nachMgrs(lat, lng, 5)) + '</span>'; }
function lagePopupKnoepfe(id, gesperrt, mitPunkten) {
  return '<div class="lage-popup-knoepfe">' +
    '<button type="button" class="knopf sekundaer" data-lage-sperre="' + id + '" aria-pressed="' + !!gesperrt + '">' + (gesperrt ? SCHLOSS_OFFEN + 'Entsperren' : SCHLOSS + 'Sperren') + '</button>' +
    '<button type="button" class="knopf sekundaer" data-lage-bearb="' + id + '"' + (gesperrt ? ' disabled' : '') + '>Bearbeiten</button>' +
    (mitPunkten ? '<button type="button" class="knopf sekundaer" data-lage-punkte="' + id + '"' + (gesperrt ? ' disabled' : '') + '>Punkte verschieben</button>' : '') +
    '<button type="button" class="knopf sekundaer" data-lage-weg="' + id + '"' + (gesperrt ? ' disabled' : '') + '>Löschen</button>' +
    '</div>' + (gesperrt ? '<small>Gesperrt: nicht verschiebbar, nicht änderbar.</small>' : '');
}

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
    var m = L.marker([z.y, z.x], { icon: lageIcon(z), draggable: !z.gesperrt, keyboard: true, title: (z.name || '') + (z.gesperrt ? ' (gesperrt)' : ''), autoPan: true, zIndexOffset: 500 }).addTo(lageKarte);
    m.on('dragend', function () {
      var p = m.getLatLng();
      z.x = p.lng; z.y = p.lat;
      lageSpeichern();
    });
    m.bindPopup(function () {
      return '<div class="lage-popup"><b>' + esc(z.name || 'Zeichen') + '</b>' + (z.opt && z.opt.uniqueDesignation ? '<span>' + esc(z.opt.uniqueDesignation) + '</span>' : '') +
        lageMgrsText(z.y, z.x) + lagePopupKnoepfe(z.id, z.gesperrt, false) + '</div>';
    }, { minWidth: 200 });
    lageMarker[z.id] = m;
  });
  renderLageListe();
}

/* ---------- Linien, Pfeile und Räume ---------- */
function lageStil(f, vorschau) {
  return { color: LAGE_FARBEN[f.farbe][0], weight: f.typ === 'raum' ? 2.5 : 3, opacity: vorschau ? 0.7 : 1, dashArray: f.gestrichelt ? '9 7' : null,
    fillColor: LAGE_FARBEN[f.farbe][0], fillOpacity: f.typ === 'raum' ? 0.08 : 0, lineCap: 'round', lineJoin: 'round' };
}
// Pfeilspitze am letzten Punkt, in Bildschirmpixeln berechnet, damit sie bei jedem Zoom gleich groß bleibt
function lagePfeilSpitze(punkte) {
  var n = punkte.length;
  var a = lageKarte.latLngToLayerPoint(punkte[n - 2]), b = lageKarte.latLngToLayerPoint(punkte[n - 1]);
  var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len;
  var l = 18, w = 10;
  var basis = L.point(b.x - ux * l, b.y - uy * l);
  return [punkte[n - 1], lageKarte.layerPointToLatLng(L.point(basis.x - uy * w, basis.y + ux * w)), lageKarte.layerPointToLatLng(L.point(basis.x + uy * w, basis.y - ux * w))];
}
function lageFormLayerBauen(f, vorschau) {
  var g = L.layerGroup(), stil = lageStil(f, vorschau);
  var pk = f.punkte.map(function (p) { return L.latLng(p[0], p[1]); });
  var haupt = f.typ === 'raum' && pk.length >= 3 ? L.polygon(pk, stil) : L.polyline(pk, stil);
  haupt.addTo(g);
  if (f.typ === 'pfeil' && pk.length >= 2) {
    var spitze = L.polygon(lagePfeilSpitze(pk), { color: stil.color, weight: 1, fillColor: stil.color, fillOpacity: 1, opacity: stil.opacity });
    spitze.addTo(g);
    g.spitze = spitze;
  }
  if (f.text && !vorschau) {
    var mitte = f.typ === 'raum' && pk.length >= 3 ? haupt.getBounds().getCenter() : pk[Math.floor((pk.length - 1) / 2)];
    if (f.typ !== 'raum' && pk.length === 2) mitte = L.latLng((pk[0].lat + pk[1].lat) / 2, (pk[0].lng + pk[1].lng) / 2);
    L.tooltip({ permanent: true, direction: 'center', className: 'lage-formtext', interactive: false }).setLatLng(mitte).setContent(esc(f.text)).addTo(g);
  }
  g.haupt = haupt;
  return g;
}
function lageFormenZeigen() {
  Object.keys(lageFormLayer).forEach(function (id) { lageKarte.removeLayer(lageFormLayer[id]); });
  lageFormLayer = {};
  var ebene = lageEbene();
  if (ebene === 'bild' && !lageBild()) return;
  LAGE.formen.filter(function (f) { return f.ebene === ebene; }).forEach(function (f) {
    var g = lageFormLayerBauen(f, false).addTo(lageKarte);
    g.eachLayer(function (l) {
      if (l instanceof L.Path) l.bindPopup(function () {
        var p = f.punkte[f.punkte.length - 1];
        return '<div class="lage-popup"><b>' + LAGE_TYPEN[f.typ] + ' · ' + LAGE_FARBEN[f.farbe][1] + '</b>' + (f.text ? '<span>' + esc(f.text) + '</span>' : '') +
          (f.typ === 'pfeil' ? lageMgrsText(p[0], p[1]) : '') + lagePopupKnoepfe(f.id, f.gesperrt, true) + '</div>';
      }, { minWidth: 200 });
    });
    lageFormLayer[f.id] = g;
  });
}
function lagePfeileNeu() {
  Object.keys(lageFormLayer).forEach(function (id) {
    var g = lageFormLayer[id], f = lageForm(id);
    if (g.spitze && f) g.spitze.setLatLngs(lagePfeilSpitze(f.punkte.map(function (p) { return L.latLng(p[0], p[1]); })));
  });
  if (lageZeichnen && lageZeichnen.vorschau && lageZeichnen.vorschau.spitze && lageZeichnen.punkte.length >= 2) {
    lageZeichnen.vorschau.spitze.setLatLngs(lagePfeilSpitze(lageZeichnen.punkte.map(function (p) { return L.latLng(p[0], p[1]); })));
  }
}

// Zeichnen: Typ wählen, dann Punkte auf die Karte tippen
function lageZeichnenStart(typ) {
  if (!lageKarte) return;
  if (LAGE.modus === 'bild' && !lageBild()) { lageMeldung('Zuerst ein Bild wählen.', true); return; }
  lagePunkteEnde();
  lageZeichnenEnde();
  lageZeichnen = { typ: typ, punkte: [], vorschau: null };
  lageKarte.closePopup();
  lageKarte.doubleClickZoom.disable();
  $('lage-karte').classList.add('zeichnet');
  lageLeiste();
}
function lageZeichnenEnde() {
  if (lageZeichnen && lageZeichnen.vorschau && lageKarte) lageKarte.removeLayer(lageZeichnen.vorschau);
  lageZeichnen = null;
  if (lageKarte) lageKarte.doubleClickZoom.enable();
  $('lage-karte').classList.remove('zeichnet');
  lageLeiste();
}
function lageMindest(typ) { return typ === 'raum' ? 3 : 2; }
function lageVorschau() {
  if (lageZeichnen.vorschau) lageKarte.removeLayer(lageZeichnen.vorschau);
  lageZeichnen.vorschau = null;
  if (!lageZeichnen.punkte.length) return;
  var f = { typ: lageZeichnen.typ, farbe: $('lage-farbe').value, gestrichelt: $('lage-gestrichelt').checked, punkte: lageZeichnen.punkte };
  var g = lageFormLayerBauen(f, true);
  lageZeichnen.punkte.forEach(function (p) { L.circleMarker(p, { radius: 5, color: '#FFFFFF', weight: 2, fillColor: LAGE_FARBEN[f.farbe][0], fillOpacity: 1 }).addTo(g); });
  lageZeichnen.vorschau = g.addTo(lageKarte);
}
function lageKartenKlick(e) {
  if (!lageZeichnen) return;
  lageZeichnen.punkte.push([e.latlng.lat, e.latlng.lng]);
  lageVorschau();
  lageLeiste();
}
function lageZeichnenFertig() {
  if (!lageZeichnen || lageZeichnen.punkte.length < lageMindest(lageZeichnen.typ)) return;
  LAGE.formen.push({ id: 'f' + Date.now(), typ: lageZeichnen.typ, farbe: $('lage-farbe').value, gestrichelt: $('lage-gestrichelt').checked,
    text: $('lage-text').value.trim().slice(0, 40), ebene: lageEbene(), punkte: lageZeichnen.punkte.slice() });
  var typ = lageZeichnen.typ;
  lageZeichnenEnde();
  lageSpeichern();
  lageFormenZeigen();
  renderLageListe();
  lageMeldung(LAGE_TYPEN[typ] + ' gespeichert.');
}
// Leiste über der Karte: Anleitung und Knöpfe während des Zeichnens oder Punkte-Verschiebens
function lageLeiste() {
  var el = $('lage-leiste');
  document.querySelectorAll('#lage-werkzeug button[data-lage-typ]').forEach(function (b) {
    b.setAttribute('aria-pressed', String(!!lageZeichnen && lageZeichnen.typ === b.getAttribute('data-lage-typ')));
  });
  if (lageZeichnen) {
    var n = lageZeichnen.punkte.length, min = lageMindest(lageZeichnen.typ);
    el.hidden = false;
    $('lage-leiste-text').textContent = LAGE_TYPEN[lageZeichnen.typ] + ': ' + (n < min ? 'Tippe auf die Karte, um Punkte zu setzen (mindestens ' + min + ').' : n + ' Punkte. Weitere setzen oder „Fertig“ tippen.') +
      (lageZeichnen.typ === 'pfeil' ? ' Die Spitze kommt an den letzten Punkt.' : '');
    $('lage-leiste-zurueck').hidden = !n;
    $('lage-leiste-fertig').hidden = false;
    $('lage-leiste-fertig').disabled = n < min;
  } else if (lagePunkteBearb) {
    el.hidden = false;
    $('lage-leiste-text').textContent = 'Ziehe die runden Punkte an die neue Stelle.';
    $('lage-leiste-zurueck').hidden = true;
    $('lage-leiste-fertig').hidden = false;
    $('lage-leiste-fertig').disabled = false;
  } else {
    el.hidden = true;
  }
}
// Punkte einer vorhandenen Form verschieben
function lagePunkteStart(id) {
  var f = lageForm(id);
  if (!f || f.gesperrt) return;
  lageZeichnenEnde();
  lagePunkteEnde();
  lageKarte.closePopup();
  lagePunkteBearb = { id: id, griffe: [] };
  f.punkte.forEach(function (p, i) {
    var gr = L.marker(p, { draggable: true, zIndexOffset: 1000, icon: L.divIcon({ className: 'lage-griff', iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(lageKarte);
    gr.on('drag', function () { var q = gr.getLatLng(); f.punkte[i] = [q.lat, q.lng]; lageFormNeuZeichnen(f); });
    gr.on('dragend', function () { lageSpeichern(); });
    lagePunkteBearb.griffe.push(gr);
  });
  lageLeiste();
}
function lagePunkteEnde() {
  if (lagePunkteBearb && lageKarte) lagePunkteBearb.griffe.forEach(function (g) { lageKarte.removeLayer(g); });
  var war = !!lagePunkteBearb;
  lagePunkteBearb = null;
  lageLeiste();
  if (war && lageKarte) { lageFormenZeigen(); renderLageListe(); }
}
function lageFormNeuZeichnen(f) {
  if (lageFormLayer[f.id]) lageKarte.removeLayer(lageFormLayer[f.id]);
  lageFormLayer[f.id] = lageFormLayerBauen(f, false).addTo(lageKarte);
}

/* ---------- Liste unter der Karte ---------- */
function lageFormIcon(f) {
  var c = LAGE_FARBEN[f.farbe][0], d = f.gestrichelt ? ' stroke-dasharray="4 3"' : '';
  if (f.typ === 'raum') return '<svg viewBox="0 0 40 30"><path d="M6 8l20-4 9 14-14 8-15-6z" fill="' + c + '" fill-opacity=".12" stroke="' + c + '" stroke-width="2.5"' + d + '/></svg>';
  if (f.typ === 'pfeil') return '<svg viewBox="0 0 40 30"><path d="M5 24L30 8" stroke="' + c + '" stroke-width="3"' + d + ' fill="none"/><path d="M36 4l-11 1 6 8z" fill="' + c + '"/></svg>';
  return '<svg viewBox="0 0 40 30"><path d="M4 22C14 6 24 26 36 8" stroke="' + c + '" stroke-width="3"' + d + ' fill="none"/></svg>';
}
function renderLageListe() {
  var ebene = lageEbene();
  var zl = LAGE.zeichen.filter(function (z) { return z.ebene === ebene; }), fl = LAGE.formen.filter(function (f) { return f.ebene === ebene; });
  $('lage-anz').textContent = zl.length + fl.length ? String(zl.length + fl.length) : '';
  var zeile = function (id, icon, text, gesperrt) {
    return '<div class="fav-item"><button type="button" class="zeile mit-icon" data-lage-zeige="' + id + '">' +
      '<span class="lage-liste-zeichen">' + icon + '</span><span class="n">' + text + '</span>' +
      (gesperrt ? '<span class="lage-liste-schloss" title="Gesperrt">' + SCHLOSS + '</span>' : '') + '</button>' +
      (gesperrt ? '' : '<button type="button" class="stern-klein loeschen" data-lage-weg="' + id + '" aria-label="Löschen">×</button>') + '</div>';
  };
  var html = zl.map(function (z) {
    return zeile(z.id, window.ms ? msSymbolAus({ sidc: z.sidc, opt: { fill: z.opt.fill, colorMode: z.opt.colorMode, standard: 'APP6' } }, 18).asSVG() : '',
      esc(z.name || 'Zeichen') + (z.opt && z.opt.uniqueDesignation ? ' · ' + esc(z.opt.uniqueDesignation) : ''), z.gesperrt);
  }).concat(fl.map(function (f) {
    return zeile(f.id, lageFormIcon(f), LAGE_TYPEN[f.typ] + (f.text ? ' · ' + esc(f.text) : '') + (f.gestrichelt ? ' (gestrichelt)' : ''), f.gesperrt);
  })).join('');
  $('lage-liste').innerHTML = html || '<p class="hint" style="padding:12px">Noch nichts auf dieser Grundlage.</p>';
}

/* ---------- Sperren, Bearbeiten, Löschen ---------- */
function lageObjekt(id) { return lageZeichen(id) || lageForm(id); }
function lageSperren(id) {
  var o = lageObjekt(id);
  if (!o) return;
  o.gesperrt = !o.gesperrt;
  lageSpeichern();
  lageAllesZeigen();
  if (lageMarker[id]) lageMarker[id].openPopup();
  else if (lageFormLayer[id]) lageFormLayer[id].haupt.openPopup();
  lageMeldung(o.gesperrt ? 'Gesperrt.' : 'Entsperrt.');
}
// Zeichen: Baukasten mit den Werten füllen. Form: Farbe, Strich und Beschriftung im Formular ändern.
var lageBearbId = null, lageFormBearbId = null;
function lageBearbeiten(id) {
  if (lageForm(id)) { lageFormBearbeiten(id); return; }
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
function lageFormBearbeiten(id) {
  var f = lageForm(id);
  if (!f || f.gesperrt) return;
  lageZeichnenEnde(); lagePunkteEnde();
  lageKarte.closePopup();
  lageFormBearbId = id;
  $('lage-farbe').value = f.farbe;
  $('lage-gestrichelt').checked = !!f.gestrichelt;
  $('lage-text').value = f.text || '';
  $('lage-form-bearb').hidden = false;
  $('lage-form-bearb-text').textContent = LAGE_TYPEN[f.typ] + ' bearbeiten: Farbe, Strich und Beschriftung oben ändern, dann übernehmen.';
  $('lage-werkzeug').scrollIntoView({ block: 'center' });
}
function lageFormBearbeitenEnde() { lageFormBearbId = null; $('lage-form-bearb').hidden = true; }
function lageLoeschen(id) {
  var o = lageObjekt(id);
  if (!o || o.gesperrt) return;
  LAGE.zeichen = LAGE.zeichen.filter(function (z) { return z.id !== id; });
  LAGE.formen = LAGE.formen.filter(function (f) { return f.id !== id; });
  lageSpeichern();
  if (lageKarte) lageKarte.closePopup();
  if (lageFormBearbId === id) lageFormBearbeitenEnde();
  lageAllesZeigen();
  lageMeldung('Gelöscht.');
}

/* ---------- Bedienung ---------- */
document.querySelectorAll('input[name="lage-modus"]').forEach(function (r) {
  r.addEventListener('change', function (e) { lageZeichnenEnde(); lagePunkteEnde(); LAGE.modus = e.target.value; lageSpeichern(); lageMeldung(''); lageGrundlage(); });
});
$('lage-wahl').addEventListener('change', function (e) { lageWechseln(e.target.value); });
$('lage-karte-neu').addEventListener('click', function () {
  var k = lageNeu('Lage ' + (LAGE_ALLE.karten.length + 1));
  // Neue Karte startet am aktuellen Ausschnitt
  k.mitte = LAGE.mitte.slice(); k.zoom = LAGE.zoom; k.modus = LAGE.modus === 'bild' ? 'topo' : LAGE.modus;
  LAGE_ALLE.karten.push(k);
  lageWechseln(k.id);
  lageMeldung('Neue Lagekarte „' + k.name + '“ angelegt. Den Namen kannst du mit „Umbenennen“ ändern.');
});
$('lage-karte-name').addEventListener('click', function () {
  var n = window.prompt('Name der Lagekarte', LAGE.name);
  if (n === null) return;
  n = n.trim().slice(0, 40);
  if (!n) return;
  LAGE.name = n; lageSpeichern(); renderLageWahl();
});
$('lage-karte-weg').addEventListener('click', function () {
  if (LAGE_ALLE.karten.length < 2) return;
  if (!window.confirm('Lagekarte „' + LAGE.name + '“ mit allen Zeichen und Formen löschen?')) return;
  try { localStorage.removeItem(lageBildKey()); } catch (e) { /* egal */ }
  var weg = LAGE.id;
  LAGE_ALLE.karten = LAGE_ALLE.karten.filter(function (k) { return k.id !== weg; });
  lageWechseln(LAGE_ALLE.karten[0].id);
  lageMeldung('Lagekarte gelöscht.');
});
$('lage-werkzeug').addEventListener('click', function (e) {
  var b = e.target.closest('button[data-lage-typ]');
  if (!b) return;
  var typ = b.getAttribute('data-lage-typ');
  if (lageZeichnen && lageZeichnen.typ === typ) { lageZeichnenEnde(); return; }
  lageFormBearbeitenEnde();
  lageZeichnenStart(typ);
});
['lage-farbe', 'lage-gestrichelt'].forEach(function (id) { $(id).addEventListener('change', function () { if (lageZeichnen) lageVorschau(); }); });
$('lage-leiste-zurueck').addEventListener('click', function () { if (lageZeichnen) { lageZeichnen.punkte.pop(); lageVorschau(); lageLeiste(); } });
$('lage-leiste-fertig').addEventListener('click', function () { if (lageZeichnen) lageZeichnenFertig(); else lagePunkteEnde(); });
$('lage-leiste-abbrechen').addEventListener('click', function () { lageZeichnenEnde(); lagePunkteEnde(); });
$('lage-form-uebernehmen').addEventListener('click', function () {
  var f = lageForm(lageFormBearbId);
  if (f) { f.farbe = $('lage-farbe').value; f.gestrichelt = $('lage-gestrichelt').checked; f.text = $('lage-text').value.trim().slice(0, 40); lageSpeichern(); lageFormenZeigen(); renderLageListe(); lageMeldung('Geändert.'); }
  lageFormBearbeitenEnde();
});
$('lage-form-abbrechen').addEventListener('click', lageFormBearbeitenEnde);
$('lage-liste').addEventListener('click', function (e) {
  var w = e.target.closest('button[data-lage-weg]');
  if (w) { lageLoeschen(w.getAttribute('data-lage-weg')); return; }
  var b = e.target.closest('button[data-lage-zeige]');
  if (!b) return;
  var id = b.getAttribute('data-lage-zeige');
  if (lageMarker[id]) { lageKarte.panTo(lageMarker[id].getLatLng()); lageMarker[id].openPopup(); }
  else if (lageFormLayer[id]) { var h = lageFormLayer[id].haupt; lageKarte.fitBounds(h.getBounds(), { maxZoom: lageKarte.getZoom(), padding: [30, 30] }); h.openPopup(); }
  $('lage-karte').scrollIntoView({ block: 'center' });
});
$('lage-karte').addEventListener('click', function (e) {
  var b;
  if ((b = e.target.closest('button[data-lage-weg]'))) { lageLoeschen(b.getAttribute('data-lage-weg')); return; }
  if ((b = e.target.closest('button[data-lage-sperre]'))) { lageSperren(b.getAttribute('data-lage-sperre')); return; }
  if ((b = e.target.closest('button[data-lage-punkte]'))) { lagePunkteStart(b.getAttribute('data-lage-punkte')); return; }
  if ((b = e.target.closest('button[data-lage-bearb]'))) lageBearbeiten(b.getAttribute('data-lage-bearb'));
});
// Zu einer Koordinate springen (MGRS oder Breite, Länge)
$('lage-ziel-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var p = koordinateLesen($('lage-ziel').value);
  if (!p) { lageMeldung('Koordinate nicht erkannt. Beispiel: 32U NB 12345 67890 oder 51,05, 10,30.', true); return; }
  if (lageKarte) lageKarte.setView(p, Math.max(lageKarte.getZoom(), 13));
  lageMeldung('Karte auf ' + nachMgrs(p[0], p[1], 5) + ' ausgerichtet.');
});
$('lage-bild-knopf').addEventListener('click', function () { $('lage-bild-datei').click(); });
$('lage-bild-weg').addEventListener('click', function () {
  try { localStorage.removeItem(lageBildKey()); } catch (e) { /* egal */ }
  LAGE.zeichen = LAGE.zeichen.filter(function (z) { return z.ebene !== 'bild'; });
  LAGE.formen = LAGE.formen.filter(function (f) { return f.ebene !== 'bild'; });
  lageSpeichern(); lageGrundlage(); lageMeldung('Bild und alles darauf entfernt.');
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
      try { localStorage.setItem(lageBildKey(), daten); }
      catch (err) { lageMeldung('Das Bild ist zu groß für den Speicher dieses Browsers. Bitte ein kleineres Bild wählen.', true); return; }
      LAGE.zeichen = LAGE.zeichen.filter(function (z) { return z.ebene !== 'bild'; });
      LAGE.formen = LAGE.formen.filter(function (x) { return x.ebene !== 'bild'; });
      lageSpeichern(); lageGrundlage(); lageMeldung('Bild übernommen.');
    };
    img.onerror = function () { lageMeldung('Diese Datei ist kein lesbares Bild.', true); };
    img.src = String(r.result);
  };
  r.readAsDataURL(f);
});
// Aus dem Baukasten: Zeichen merken und zur Karte wechseln, oder ein bearbeitetes Zeichen übernehmen
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
