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
var LAGE_TYPEN = { linie: 'Linie (frei)', pfeil: 'Pfeil (frei)', raum: 'Raum (frei)', grenze: 'Grenze', ende: 'Linie', richtung: 'Angriffsrichtung', achse: 'Angriffsachse', sperre: 'Sperre' };
// Führungszeichen nach APP-6D (Control Measures): Code, Originalbezeichnung, deutsche Übersetzung (frei), Darstellung, Kürzel, Variante.
// Darstellung: grenze, ende (Kürzel an beiden Enden), richtung (Linie mit Spitze), achse (breiter Pfeil), raum (Fläche mit Kürzel), sperre.
// Variante: haupt (Hauptangriff), neben (Nebenangriff), geplant (gestrichelt), feind (rot), feindv (rot, gestrichelt).
var LAGE_FZ_GRUPPEN = [
  ['Linien', [
    ['110100', 'Boundary', 'Gefechtsstreifengrenze', 'grenze', ''],
    ['140300', 'Phase Line', 'Phasenlinie', 'ende', 'PL'],
    ['141000', 'Line of Departure', 'Ablauflinie', 'ende', 'LD'],
    ['141100', 'Line of Departure/Line of Contact', 'Ablauflinie/Gefechtsberührungslinie', 'ende', 'LD/LC'],
    ['140200', 'Line of Contact', 'Gefechtsberührungslinie', 'ende', 'LC'],
    ['140900', 'Limit of Advance', 'Grenze des Vorgehens', 'ende', 'LOA'],
    ['140700', 'Final Coordination Line', 'Letzte Koordinierungslinie', 'ende', 'FCL'],
    ['141600', 'Release Line', 'Entlassungslinie', 'ende', 'RL'],
    ['141400', 'Bridgehead Line (BL)', 'Brückenkopflinie', 'ende', 'BL'],
    ['141500', 'Holding Line (HL)', 'Haltelinie', 'ende', 'HL'],
    ['260100', 'Fire Support Coordination Line (FSCL)', 'Feuerunterstützungs-Koordinierungslinie', 'ende', 'FSCL'],
    ['260200', 'Coordinated Fire Line (CFL)', 'Koordinierte Feuerlinie', 'ende', 'CFL'],
    ['260500', 'Restrictive Fire Line', 'Feuerbeschränkungslinie', 'ende', 'RFL']
  ]],
  ['Angriffe', [
    ['140602', 'Direction of Attack – Friendly Direction of Main Attack', 'Richtung des Hauptangriffs', 'richtung', '', 'haupt'],
    ['140603', 'Direction of Attack – Friendly Direction of Supporting Attack', 'Richtung des Nebenangriffs', 'richtung', '', 'neben'],
    ['140604', 'Direction of Attack – Friendly Planned or On Order', 'Angriffsrichtung, geplant oder auf Befehl', 'richtung', '', 'geplant'],
    ['140606', 'Direction of Attack – Enemy Confirmed', 'Angriffsrichtung Feind, bestätigt', 'richtung', '', 'feind'],
    ['140607', 'Direction of Attack – Enemy Templated or Suspected', 'Angriffsrichtung Feind, vermutet', 'richtung', '', 'feindv'],
    ['151403', 'Axis of Advance – Main Attack', 'Angriffsachse, Hauptangriff', 'achse', '', 'haupt'],
    ['151404', 'Axis of Advance – Supporting Attack', 'Angriffsachse, Nebenangriff', 'achse', '', 'neben'],
    ['151405', 'Axis of Advance – Supporting Attack Planned or on Order', 'Angriffsachse, geplant oder auf Befehl', 'achse', '', 'geplant'],
    ['151407', 'Axis of Advance – Enemy Confirmed', 'Angriffsachse Feind, bestätigt', 'achse', '', 'feind'],
    ['151408', 'Axis of Advance – Enemy Templated or Suspected', 'Angriffsachse Feind, vermutet', 'achse', '', 'feindv']
  ]],
  ['Räume', [
    ['150200', 'Assembly Area (AA)', 'Verfügungsraum', 'raum', 'AA'],
    ['151600', 'Attack Position', 'Angriffsstellung', 'raum', 'ATK'],
    ['151500', 'Assault Position', 'Sturmausgangsstellung', 'raum', 'ASLT'],
    ['151700', 'Objective', 'Angriffsziel', 'raum', 'OBJ'],
    ['151300', 'Engagement Area (EA)', 'Wirkungsraum', 'raum', 'EA'],
    ['120200', 'Named Area of Interest', 'Beobachtungsraum (NAI)', 'raum', 'NAI'],
    ['150600', 'Drop Zone (DZ)', 'Absetzzone', 'raum', 'DZ'],
    ['150800', 'Landing Zone (LZ)', 'Landezone', 'raum', 'LZ'],
    ['150900', 'Pick-Up Zone (PZ)', 'Aufnahmezone', 'raum', 'PZ'],
    ['150700', 'Extraction Zone (EZ)', 'Extraktionszone', 'raum', 'EZ'],
    ['240201', 'Free Fire Area – Irregular', 'Feuerfreiraum', 'raum', 'FFA'],
    ['240401', 'Restricted Fire Area – Irregular', 'Feuerbeschränkungsraum', 'raum', 'RFA']
  ]],
  ['Sperren', [
    ['290100', 'Obstacle Line', 'Sperrlinie (vereinfacht)', 'sperre', '']
  ]]
];
var LAGE_FZ = {};
LAGE_FZ_GRUPPEN.forEach(function (g) { g[1].forEach(function (e) { LAGE_FZ[e[0]] = { code: e[0], o: e[1], de: e[2], art: e[3], kurz: e[4], v: e[5] || '' }; }); });
// Alte Formen (vor dem Katalog) auf APP-6D-Codes abbilden
var LAGE_ALT_CODE = { grenze: '110100', phase: '140300', achse: '151404', sperre: '290100' };
function lageFz(f) { return f && f.code ? LAGE_FZ[f.code] : null; }
function lageFormName(f) { var z = lageFz(f); return z ? z.de : LAGE_TYPEN[f.typ]; }
function lageVariante(f) { var z = lageFz(f); return z ? z.v : ''; }
// Größe an der Gefechtsstreifengrenze (Zeichen der höchsten Ebene, deren Grenze es ist)
var LAGE_STUFEN = { 'I': 'Kompanie', 'II': 'Bataillon', 'III': 'Regiment', 'X': 'Brigade', 'XX': 'Division', 'XXX': 'Korps' };
// Breite der Angriffsachse als Anteil ihrer Länge, damit sie mit der Karte mitwächst
var LAGE_BREITEN = { s: ['schmal', 0.08], m: ['mittel', 0.14], b: ['breit', 0.22] };

/* ---------- Speicher: mehrere Lagekarten ---------- */
function lageNeu(name) {
  return { id: 'k' + Date.now() + Math.floor(Math.random() * 1000), name: name, modus: 'topo', mitte: [51.0, 10.3], zoom: 6, zeichen: [], formen: [], sichtbar: { eigen: true, feind: true, sonst: true } };
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
    if (f && LAGE_ALT_CODE[f.typ] && !f.code) { f.code = LAGE_ALT_CODE[f.typ]; f.typ = LAGE_FZ[f.code].art; }
    if (f && f.code && LAGE_FZ[f.code]) f.typ = LAGE_FZ[f.code].art;
    return f && LAGE_TYPEN[f.typ] && LAGE_FARBEN[f.farbe] && (f.ebene === 'karte' || f.ebene === 'bild') && Array.isArray(f.punkte) &&
      f.punkte.length >= 2 && f.punkte.every(function (p) { return Array.isArray(p) && isFinite(p[0]) && isFinite(p[1]); });
  }).map(function (f) {
    if (f.typ === 'grenze' && !LAGE_STUFEN[f.stufe]) f.stufe = 'II';
    if (f.typ === 'achse' && !LAGE_BREITEN[f.breite]) f.breite = 'm';
    return f;
  });
  l.sichtbar = { eigen: true, feind: true, sonst: true };
  if (k.sichtbar && typeof k.sichtbar === 'object') ['eigen', 'feind', 'sonst'].forEach(function (x) { if (k.sichtbar[x] === false) l.sichtbar[x] = false; });
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
// Ebene zum Ein- und Ausblenden: eigene Kräfte, Feind, Sonstiges
function lageZugZeichen(z) { var c = z.sidc.charAt(3); return c === '3' || c === '2' ? 'eigen' : (c === '6' || c === '5' ? 'feind' : 'sonst'); }
function lageZugForm(f) { return f.farbe === 'blau' ? 'eigen' : (f.farbe === 'rot' ? 'feind' : 'sonst'); }
function lageSichtbarZ(z) { return LAGE.sichtbar[lageZugZeichen(z)] !== false; }
function lageSichtbarF(f) { return LAGE.sichtbar[lageZugForm(f)] !== false; }
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
  LAGE.zeichen.filter(function (z) { return z.ebene === ebene && lageSichtbarZ(z); }).forEach(function (z) {
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
  var flaeche = f.typ === 'raum' || f.typ === 'achse', v = lageVariante(f), fz = !!lageFz(f);
  var strich = f.gestrichelt || v === 'geplant' || v === 'feindv';
  return { color: LAGE_FARBEN[f.farbe][0], weight: flaeche ? 2.5 : (f.typ === 'grenze' ? 3.5 : 3), opacity: vorschau ? 0.7 : 1, dashArray: strich ? '9 7' : null,
    fillColor: LAGE_FARBEN[f.farbe][0], fillOpacity: f.typ === 'raum' ? (fz ? 0.05 : 0.08) : (f.typ === 'achse' && !fz ? 0.12 : 0), lineCap: 'round', lineJoin: 'round' };
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
// Angriffsachse: breiter Pfeil um die Mittellinie (in Kartenkoordinaten, skaliert mit der Karte)
function lageAchse(punkte, breite) {
  var crs = lageKarte.options.crs;
  var pp = punkte.map(function (p) { return crs.project(p); });
  var gesamt = 0;
  for (var i = 1; i < pp.length; i++) gesamt += pp[i].distanceTo(pp[i - 1]);
  var w = gesamt * LAGE_BREITEN[breite][1] / 2;
  var n = pp.length, last = pp[n - 1], vor = pp[n - 2];
  var dx = last.x - vor.x, dy = last.y - vor.y, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len;
  var kopf = Math.min(w * 3, len * 0.8);
  var ende = L.point(last.x - ux * kopf, last.y - uy * kopf);
  var mitte = pp.slice(0, n - 1).concat([ende]);
  var links = [], rechts = [];
  mitte.forEach(function (q, i) {
    var a = mitte[Math.max(0, i - 1)], b = mitte[Math.min(mitte.length - 1, i + 1)];
    var tx = b.x - a.x, ty = b.y - a.y, tl = Math.sqrt(tx * tx + ty * ty) || 1;
    var nx = -ty / tl, ny = tx / tl;
    links.push(L.point(q.x + nx * w, q.y + ny * w)); rechts.push(L.point(q.x - nx * w, q.y - ny * w));
  });
  var nx2 = -uy, ny2 = ux;
  var ring = links.concat([L.point(ende.x + nx2 * w * 2, ende.y + ny2 * w * 2), last, L.point(ende.x - nx2 * w * 2, ende.y - ny2 * w * 2)]).concat(rechts.reverse());
  return ring.map(function (q) { return crs.unproject(q); });
}
// Sperre: Dreiecke entlang der Linie (in Bildschirmpixeln, deshalb nach jedem Zoom neu)
function lageZaehne(punkte) {
  var lp = punkte.map(function (p) { return lageKarte.latLngToLayerPoint(p); }), ringe = [], abstand = 26, h = 9, rest = abstand / 2;
  for (var i = 1; i < lp.length; i++) {
    var a = lp[i - 1], b = lp[i], dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
    if (!len) continue;
    var ux = dx / len, uy = dy / len, pos = rest;
    while (pos + 6 <= len) {
      var m = L.point(a.x + ux * pos, a.y + uy * pos);
      ringe.push([lageKarte.layerPointToLatLng(L.point(m.x - ux * 6, m.y - uy * 6)), lageKarte.layerPointToLatLng(L.point(m.x + uy * h, m.y - ux * h)), lageKarte.layerPointToLatLng(L.point(m.x + ux * 6, m.y + uy * 6))]);
      pos += abstand;
    }
    rest = pos - len;
  }
  return ringe.length ? ringe.map(function (r) { return [r]; }) : [];
}
function lageMitte(pk) {
  if (pk.length === 2) return L.latLng((pk[0].lat + pk[1].lat) / 2, (pk[0].lng + pk[1].lng) / 2);
  return pk[Math.floor((pk.length - 1) / 2)];
}
// Offene Pfeilspitze (zwei Striche) am letzten Punkt, in Bildschirmpixeln; zurueck verschiebt sie Richtung Anfang
function lageOffeneSpitze(punkte, zurueck) {
  var s = lagePfeilSpitze(punkte), n = punkte.length;
  if (!zurueck) return [s[1], s[0], s[2]];
  var a = lageKarte.latLngToLayerPoint(punkte[n - 2]), b = lageKarte.latLngToLayerPoint(punkte[n - 1]);
  var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy) || 1, vx = -dx / len * zurueck, vy = -dy / len * zurueck;
  return [s[1], s[0], s[2]].map(function (p) { var q = lageKarte.latLngToLayerPoint(p); return lageKarte.layerPointToLatLng(L.point(q.x + vx, q.y + vy)); });
}
// Zweite, innere Spitze der Angriffsachse beim Hauptangriff (in Kartenkoordinaten wie die Achse)
function lageAchseHaupt(punkte, breite) {
  var ring = lageAchse(punkte, breite), crs = lageKarte.options.crs, n = ring.length;
  // Ring: linke Seite …, Flügel links, Spitze, Flügel rechts, rechte Seite …
  var k = Math.floor(n / 2), fl = crs.project(ring[k - 1]), sp = crs.project(ring[k]), fr = crs.project(ring[k + 1]);
  // Verkleinerte zweite Spitze innerhalb der ersten (zum Schwerpunkt hin gestaucht)
  var cx = (fl.x + sp.x + fr.x) / 3, cy = (fl.y + sp.y + fr.y) / 3, f = 0.5;
  return [fl, sp, fr].map(function (q) { return crs.unproject(L.point(cx + (q.x - cx) * f, cy + (q.y - cy) * f)); });
}
function lageFormLayerBauen(f, vorschau) {
  var g = L.layerGroup(), stil = lageStil(f, vorschau);
  var pk = f.punkte.map(function (p) { return L.latLng(p[0], p[1]); });
  var haupt = f.typ === 'raum' && pk.length >= 3 ? L.polygon(pk, stil) : (f.typ === 'achse' && pk.length >= 2 ? L.polygon(lageAchse(pk, f.breite || 'm'), stil) : L.polyline(pk, stil));
  haupt.addTo(g);
  if (f.typ === 'sperre' && pk.length >= 2) {
    var zaehne = L.polygon(lageZaehne(pk), { color: stil.color, weight: 1, fillColor: stil.color, fillOpacity: 1, opacity: stil.opacity, interactive: false });
    zaehne.addTo(g);
    g.zaehne = zaehne;
  }
  if (f.typ === 'grenze' && pk.length >= 2) {
    L.tooltip({ permanent: true, direction: 'center', className: 'lage-stufe', interactive: false }).setLatLng(lageMitte(pk)).setContent(esc(f.stufe || 'II')).addTo(g);
  }
  var fz = lageFz(f), v = lageVariante(f);
  if (f.typ === 'achse' && v === 'haupt' && pk.length >= 2) L.polyline(lageAchseHaupt(pk, f.breite || 'm'), { color: stil.color, weight: stil.weight, opacity: stil.opacity, dashArray: stil.dashArray, interactive: false }).addTo(g);
  if (f.typ === 'richtung' && pk.length >= 2) {
    if (v === 'haupt') {
      var sv = L.polygon(lagePfeilSpitze(pk), { color: stil.color, weight: 1, fillColor: stil.color, fillOpacity: 1, opacity: stil.opacity });
      sv.addTo(g); g.spitze = sv;
      var zw = L.polyline(lageOffeneSpitze(pk, 10), { color: stil.color, weight: 3, opacity: stil.opacity, interactive: false });
      zw.addTo(g); g.spitzeZurueck = zw;
    } else {
      var so = L.polyline(lageOffeneSpitze(pk, 0), { color: stil.color, weight: 3, opacity: stil.opacity, lineCap: 'round', lineJoin: 'round' });
      so.addTo(g); g.spitzeOffen = so;
    }
  }
  if (f.typ === 'grenze' && pk.length >= 2 && !vorschau && (f.text || f.text2)) {
    // Bezeichnungen der Nachbarn links und rechts der Linie, senkrecht zur Linie versetzt (Pixelabstand, unabhängig vom Zoom)
    var a0 = lageKarte.latLngToLayerPoint(pk[0]), a1 = lageKarte.latLngToLayerPoint(pk[1]), gx = a1.x - a0.x, gy = a1.y - a0.y, gl = Math.sqrt(gx * gx + gy * gy) || 1;
    var nx = gy / gl * 22, ny = -gx / gl * 22, ort = L.latLng((pk[0].lat * 3 + pk[1].lat) / 4, (pk[0].lng * 3 + pk[1].lng) / 4);
    if (f.text) L.tooltip({ permanent: true, direction: 'center', className: 'lage-formtext', interactive: false, offset: [nx, ny] }).setLatLng(ort).setContent(esc(f.text)).addTo(g);
    if (f.text2) L.tooltip({ permanent: true, direction: 'center', className: 'lage-formtext', interactive: false, offset: [-nx, -ny] }).setLatLng(ort).setContent(esc(f.text2)).addTo(g);
  }
  if (f.typ === 'ende' && pk.length >= 2 && !vorschau) {
    var pl = esc(fz ? fz.kurz : 'PL') + (f.text ? ' ' + esc(f.text) : '');
    L.tooltip({ permanent: true, direction: 'left', className: 'lage-formtext', interactive: false, offset: [-6, 0] }).setLatLng(pk[0]).setContent(pl).addTo(g);
    L.tooltip({ permanent: true, direction: 'right', className: 'lage-formtext', interactive: false, offset: [6, 0] }).setLatLng(pk[pk.length - 1]).setContent(pl).addTo(g);
  }
  if (f.typ === 'pfeil' && pk.length >= 2) {
    var spitze = L.polygon(lagePfeilSpitze(pk), { color: stil.color, weight: 1, fillColor: stil.color, fillOpacity: 1, opacity: stil.opacity });
    spitze.addTo(g);
    g.spitze = spitze;
  }
  var marke = f.typ === 'raum' && fz && fz.kurz ? fz.kurz + (f.text ? ' ' + f.text : '') : f.text;
  if (marke && !vorschau && f.typ !== 'ende' && f.typ !== 'grenze') {
    var mitte = (f.typ === 'raum' && pk.length >= 3) || f.typ === 'achse' ? haupt.getBounds().getCenter() : lageMitte(pk);
    L.tooltip({ permanent: true, direction: 'center', className: 'lage-formtext', interactive: false }).setLatLng(mitte).setContent(esc(marke)).addTo(g);
  }
  g.haupt = haupt;
  return g;
}
function lageFormenZeigen() {
  Object.keys(lageFormLayer).forEach(function (id) { lageKarte.removeLayer(lageFormLayer[id]); });
  lageFormLayer = {};
  var ebene = lageEbene();
  if (ebene === 'bild' && !lageBild()) return;
  LAGE.formen.filter(function (f) { return f.ebene === ebene && lageSichtbarF(f); }).forEach(function (f) {
    var g = lageFormLayerBauen(f, false).addTo(lageKarte);
    g.eachLayer(function (l) {
      if (l instanceof L.Path) l.bindPopup(function () {
        var p = f.punkte[f.punkte.length - 1];
        var z = lageFz(f);
        return '<div class="lage-popup"><b>' + esc(lageFormName(f)) + '</b>' + (z ? '<span class="lage-popup-orig">APP-6D ' + z.code + ': ' + esc(z.o) + '</span>' : '') +
          (f.text ? '<span>' + esc(f.text) + (f.text2 ? ' | ' + esc(f.text2) : '') + '</span>' : '') +
          (f.typ === 'pfeil' || f.typ === 'richtung' || f.typ === 'achse' ? lageMgrsText(p[0], p[1]) : '') + lagePopupKnoepfe(f.id, f.gesperrt, true) + '</div>';
      }, { minWidth: 200 });
    });
    lageFormLayer[f.id] = g;
  });
}
function lagePfeileNeu() {
  Object.keys(lageFormLayer).forEach(function (id) {
    var g = lageFormLayer[id], f = lageForm(id);
    if (g.spitze && f) g.spitze.setLatLngs(lagePfeilSpitze(f.punkte.map(function (p) { return L.latLng(p[0], p[1]); })));
    if (g.zaehne && f) g.zaehne.setLatLngs(lageZaehne(f.punkte.map(function (p) { return L.latLng(p[0], p[1]); })));
    if (g.spitzeOffen && f) g.spitzeOffen.setLatLngs(lageOffeneSpitze(f.punkte.map(function (p) { return L.latLng(p[0], p[1]); }), 0));
    if (g.spitzeZurueck && f) g.spitzeZurueck.setLatLngs(lageOffeneSpitze(f.punkte.map(function (p) { return L.latLng(p[0], p[1]); }), 10));
  });
  if (lageZeichnen && lageZeichnen.vorschau && lageZeichnen.vorschau.zaehne && lageZeichnen.punkte.length >= 2) {
    lageZeichnen.vorschau.zaehne.setLatLngs(lageZaehne(lageZeichnen.punkte.map(function (p) { return L.latLng(p[0], p[1]); })));
  }
  if (lageZeichnen && lageZeichnen.vorschau && lageZeichnen.vorschau.spitze && lageZeichnen.punkte.length >= 2) {
    lageZeichnen.vorschau.spitze.setLatLngs(lagePfeilSpitze(lageZeichnen.punkte.map(function (p) { return L.latLng(p[0], p[1]); })));
  }
}

// Zeichnen: Typ wählen, dann Punkte auf die Karte tippen
function lageZeichnenStart(typ, code) {
  if (!lageKarte) return;
  if (LAGE.modus === 'bild' && !lageBild()) { lageMeldung('Zuerst ein Bild wählen.', true); return; }
  lagePunkteEnde();
  lageZeichnenEnde();
  lageZeichnen = { typ: typ, code: code || '', punkte: [], vorschau: null };
  lageOptionenZeigen(typ);
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
  lageOptionenZeigen(lageFormBearbId && lageForm(lageFormBearbId) ? lageForm(lageFormBearbId).typ : lageFzGewaehlt());
  lageLeiste();
}
function lageMindest(typ) { return typ === 'raum' ? 3 : 2; }
function lageVorschau() {
  if (lageZeichnen.vorschau) lageKarte.removeLayer(lageZeichnen.vorschau);
  lageZeichnen.vorschau = null;
  if (!lageZeichnen.punkte.length) return;
  var f = { typ: lageZeichnen.typ, code: lageZeichnen.code, farbe: $('lage-farbe').value, gestrichelt: $('lage-gestrichelt').checked, punkte: lageZeichnen.punkte, stufe: $('lage-stufe').value, breite: $('lage-breite').value };
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
  var neu = { id: 'f' + Date.now(), typ: lageZeichnen.typ, farbe: $('lage-farbe').value, gestrichelt: $('lage-gestrichelt').checked,
    text: $('lage-text').value.trim().slice(0, 40), ebene: lageEbene(), punkte: lageZeichnen.punkte.slice() };
  if (lageZeichnen.code) neu.code = lageZeichnen.code;
  if (neu.typ === 'grenze') { neu.stufe = $('lage-stufe').value; neu.text2 = $('lage-text2').value.trim().slice(0, 40); }
  if (neu.typ === 'achse') neu.breite = $('lage-breite').value;
  LAGE.formen.push(neu);
  lageZeichnenEnde();
  lageSpeichern();
  lageFormenZeigen();
  renderLageListe();
  lageMeldung(lageFormName(neu) + ' gespeichert.');
}
// Leiste über der Karte: Anleitung und Knöpfe während des Zeichnens oder Punkte-Verschiebens
function lageLeiste() {
  var el = $('lage-leiste');
  document.querySelectorAll('#lage-werkzeug button[data-lage-typ]').forEach(function (b) {
    var t = b.getAttribute('data-lage-typ');
    b.setAttribute('aria-pressed', String(!!lageZeichnen && (t === 'fz' ? !!lageZeichnen.code : !lageZeichnen.code && lageZeichnen.typ === t)));
  });
  if (lageZeichnen) {
    var n = lageZeichnen.punkte.length, min = lageMindest(lageZeichnen.typ);
    el.hidden = false;
    $('lage-leiste-text').textContent = lageFormName(lageZeichnen) + ': ' + (n < min ? 'Tippe auf die Karte, um Punkte zu setzen (mindestens ' + min + ').' : n + ' Punkte. Weitere setzen oder „Fertig“ tippen.') +
      ({ pfeil: ' Die Spitze kommt an den letzten Punkt.', richtung: ' Die Spitze kommt an den letzten Punkt.', achse: ' Die Spitze kommt an den letzten Punkt.', sperre: ' Die Zacken zeigen nach links in Zeichenrichtung.', grenze: ' Die Bezeichnungen stehen links und rechts in Zeichenrichtung.' }[lageZeichnen.typ] || '');
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
  var c = LAGE_FARBEN[f.farbe][0], v = lageVariante(f), z = lageFz(f);
  var d = f.gestrichelt || v === 'geplant' || v === 'feindv' ? ' stroke-dasharray="4 3"' : '';
  var txt = function (t, y) { return '<text x="20" y="' + y + '" text-anchor="middle" font-size="' + (t.length > 3 ? 7 : 9) + '" font-weight="700" fill="' + c + '">' + esc(t) + '</text>'; };
  if (f.typ === 'raum') return '<svg viewBox="0 0 40 30"><path d="M6 8l20-4 9 14-14 8-15-6z" fill="' + c + '" fill-opacity=".1" stroke="' + c + '" stroke-width="2.5"' + d + '/>' + (z && z.kurz ? txt(z.kurz, 19) : '') + '</svg>';
  if (f.typ === 'pfeil') return '<svg viewBox="0 0 40 30"><path d="M5 24L30 8" stroke="' + c + '" stroke-width="3"' + d + ' fill="none"/><path d="M36 4l-11 1 6 8z" fill="' + c + '"/></svg>';
  if (f.typ === 'richtung') return '<svg viewBox="0 0 40 30"><path d="M4 24L33 7" stroke="' + c + '" stroke-width="3"' + d + ' fill="none"/>' +
    (v === 'haupt' ? '<path d="M37 4l-11 1 6 8z" fill="' + c + '"/><path d="M22 6l6 8" stroke="' + c + '" stroke-width="2.5"/>' : '<path d="M26 5l11-1-5 10" stroke="' + c + '" stroke-width="3" fill="none"/>') + '</svg>';
  if (f.typ === 'achse') return '<svg viewBox="0 0 40 30"><path d="M3 12h21V6l13 9-13 9v-6H3z" fill="none" stroke="' + c + '" stroke-width="2"' + d + '/>' + (v === 'haupt' ? '<path d="M19 6l8 9-8 9" fill="none" stroke="' + c + '" stroke-width="2"/>' : '') + '</svg>';
  if (f.typ === 'grenze') return '<svg viewBox="0 0 40 30"><path d="M3 15h34" stroke="' + c + '" stroke-width="3"' + d + '/><rect x="13" y="8" width="14" height="14" fill="#fff"/>' + txt(f.stufe || 'II', 19) + '</svg>';
  if (f.typ === 'ende') return '<svg viewBox="0 0 40 30"><path d="M3 20h34" stroke="' + c + '" stroke-width="3"' + d + '/>' + txt(z ? z.kurz : 'PL', 13) + '</svg>';
  if (f.typ === 'sperre') return '<svg viewBox="0 0 40 30"><path d="M3 20h34" stroke="' + c + '" stroke-width="3"/><path d="M7 20l4-7 4 7M17 20l4-7 4 7M27 20l4-7 4 7" fill="' + c + '"/></svg>';
  return '<svg viewBox="0 0 40 30"><path d="M4 22C14 6 24 26 36 8" stroke="' + c + '" stroke-width="3"' + d + ' fill="none"/></svg>';
}
function renderLageListe() {
  var ebene = lageEbene();
  var zAlle = LAGE.zeichen.filter(function (z) { return z.ebene === ebene; }), fAlle = LAGE.formen.filter(function (f) { return f.ebene === ebene; });
  var zl = zAlle.filter(lageSichtbarZ), fl = fAlle.filter(lageSichtbarF), versteckt = zAlle.length + fAlle.length - zl.length - fl.length;
  $('lage-anz').textContent = zAlle.length + fAlle.length ? String(zAlle.length + fAlle.length) : '';
  ['eigen', 'feind', 'sonst'].forEach(function (x) { $('lage-sicht-' + x).checked = LAGE.sichtbar[x] !== false; });
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
    return zeile(f.id, lageFormIcon(f), esc(lageFormName(f)) + (f.typ === 'grenze' ? ' ' + esc(f.stufe || 'II') : '') + (f.typ === 'achse' ? ' (' + LAGE_BREITEN[f.breite || 'm'][0] + ')' : '') +
      (f.text ? ' · ' + esc(f.text) : '') + (f.text2 ? ' | ' + esc(f.text2) : '') + (f.gestrichelt ? ' (gestrichelt)' : ''), f.gesperrt);
  })).join('');
  $('lage-liste').innerHTML = (html || '<p class="hint" style="padding:12px">' + (versteckt ? 'Alles ist ausgeblendet.' : 'Noch nichts auf dieser Grundlage.') + '</p>') +
    (html && versteckt ? '<p class="hint" style="padding:8px 12px">' + versteckt + ' ausgeblendet.</p>' : '');
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
  if (f.stufe) $('lage-stufe').value = f.stufe;
  if (f.breite) $('lage-breite').value = f.breite;
  lageOptionenZeigen(f.typ);
  $('lage-form-bearb').hidden = false;
  $('lage-text2').value = f.text2 || '';
  $('lage-form-bearb-text').textContent = lageFormName(f) + ' bearbeiten: Farbe, Strich und Beschriftung oben ändern, dann übernehmen.';
  $('lage-werkzeug').scrollIntoView({ block: 'center' });
}
function lageFormBearbeitenEnde() { lageFormBearbId = null; $('lage-form-bearb').hidden = true; lageOptionenZeigen(lageZeichnen ? lageZeichnen.typ : lageFzGewaehlt()); }
function lageFzGewaehlt() { var z = LAGE_FZ[$('lage-fz').value]; return z ? z.art : ''; }
// Zusatzfelder je Typ: Größe an der Grenze, Breite der Angriffsachse
function lageOptionenZeigen(typ) {
  $('lage-stufe-wrap').hidden = typ !== 'grenze'; $('lage-text2-wrap').hidden = typ !== 'grenze'; $('lage-breite-wrap').hidden = typ !== 'achse';
  var mitCode = lageZeichnen ? !!lageZeichnen.code : !lageFormBearbId;
  $('lage-text-label').textContent = typ === 'grenze' ? 'Bezeichnung links' : (typ === 'ende' || (typ === 'raum' && mitCode) ? 'Name' : 'Beschriftung');
}
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
  var typ = b.getAttribute('data-lage-typ'), code = '';
  if (typ === 'fz') { code = $('lage-fz').value; typ = LAGE_FZ[code].art; }
  if (lageZeichnen && lageZeichnen.typ === typ && lageZeichnen.code === code) { lageZeichnenEnde(); return; }
  lageFormBearbeitenEnde();
  lageZeichnenStart(typ, code);
});
$('lage-fz').innerHTML = LAGE_FZ_GRUPPEN.map(function (g) {
  return '<optgroup label="' + g[0] + '">' + g[1].map(function (e) { return '<option value="' + e[0] + '">' + esc(e[2]) + ' · ' + esc(e[1]) + ' (' + e[0] + ')</option>'; }).join('') + '</optgroup>';
}).join('');
// APP-6 zeichnet Führungszeichen schwarz, feindliche rot
$('lage-fz').addEventListener('change', function () {
  var z = LAGE_FZ[$('lage-fz').value];
  $('lage-farbe').value = z.v === 'feind' || z.v === 'feindv' ? 'rot' : 'schwarz';
  if (lageZeichnen && lageZeichnen.code) lageZeichnenStart(z.art, z.code);
  else if (!lageZeichnen && !lageFormBearbId) lageOptionenZeigen(z.art);
});
lageOptionenZeigen(lageFzGewaehlt());
['lage-farbe', 'lage-gestrichelt', 'lage-stufe', 'lage-breite'].forEach(function (id) { $(id).addEventListener('change', function () { if (lageZeichnen) lageVorschau(); }); });
// Ebenen ein- und ausblenden
['eigen', 'feind', 'sonst'].forEach(function (x) {
  $('lage-sicht-' + x).addEventListener('change', function (e) { LAGE.sichtbar[x] = e.target.checked; lageSpeichern(); if (lageKarte) { lageKarte.closePopup(); lageFormenZeigen(); lageZeichenZeigen(); } });
});

// Lagekarte als Datei weitergeben und wieder einlesen (mit eigenem Bild)
function lageDateiname() {
  var t = LAGE.name.toLowerCase().replace(/[äöüß]/g, function (c) { return { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[c]; }).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return 'lagekarte-' + (t || 'lage') + '.json';
}
$('lage-export').addEventListener('click', function () {
  var daten = { app: 'MeinKamerad', typ: 'lagekarte', version: 1, gesichert: new Date().toISOString(), karte: LAGE, bild: lageBild() || null };
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(daten)], { type: 'application/json' }));
  a.download = lageDateiname();
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  lageMeldung('Lagekarte „' + LAGE.name + '“ als Datei gespeichert.');
});
$('lage-import-knopf').addEventListener('click', function () { $('lage-import').click(); });
$('lage-import').addEventListener('change', function (e) {
  var f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  var r = new FileReader();
  r.onload = function () {
    try {
      var j = JSON.parse(String(r.result));
      if (!j || j.app !== 'MeinKamerad' || j.typ !== 'lagekarte' || !j.karte) throw new Error('falsch');
      var k = lageKartePruefen(j.karte);
      k.id = lageNeu('').id;
      if (LAGE_ALLE.karten.some(function (x) { return x.name === k.name; })) k.name = (k.name + ' (eingelesen)').slice(0, 40);
      if (typeof j.bild === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(j.bild)) {
        try { localStorage.setItem(lageBildKey(k), j.bild); } catch (err) { lageMeldung('Das Bild der Lagekarte passt nicht in den Speicher dieses Browsers.', true); return; }
      } else if (k.modus === 'bild') k.modus = 'topo';
      LAGE_ALLE.karten.push(k);
      lageWechseln(k.id);
      lageMeldung('Lagekarte „' + k.name + '“ eingelesen.');
    } catch (err) { lageMeldung('Diese Datei enthält keine Lagekarte von MeinKamerad.', true); }
  };
  r.readAsText(f);
});
if (window.claude && typeof window.claude.use === 'function') $('lage-export').title = 'In dieser Vorschau sind Downloads gesperrt.';
$('lage-leiste-zurueck').addEventListener('click', function () { if (lageZeichnen) { lageZeichnen.punkte.pop(); lageVorschau(); lageLeiste(); } });
$('lage-leiste-fertig').addEventListener('click', function () { if (lageZeichnen) lageZeichnenFertig(); else lagePunkteEnde(); });
$('lage-leiste-abbrechen').addEventListener('click', function () { lageZeichnenEnde(); lagePunkteEnde(); });
$('lage-form-uebernehmen').addEventListener('click', function () {
  var f = lageForm(lageFormBearbId);
  if (f) {
    f.farbe = $('lage-farbe').value; f.gestrichelt = $('lage-gestrichelt').checked; f.text = $('lage-text').value.trim().slice(0, 40);
    if (f.typ === 'grenze') { f.stufe = $('lage-stufe').value; f.text2 = $('lage-text2').value.trim().slice(0, 40); }
    if (f.typ === 'achse') f.breite = $('lage-breite').value;
    lageSpeichern(); lageFormenZeigen(); renderLageListe(); lageMeldung('Geändert.');
  }
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
