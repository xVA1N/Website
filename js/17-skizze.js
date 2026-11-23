/* MeinKamerad – Skizzen auf dem Meldeblatt: Gelände- und Wegeskizzen mit Raster, Maßstab und Marschweg.
   Teil von index.html, Reihenfolge der Skripte beachten. Alles bleibt im Browser dieses Geräts. */
'use strict';

// Blatt in Millimetern: Raster 16 × 12 cm, oben die Maßstäbe, rechts Erläuterungen und Unterschrift
var SK_B = 222, SK_H = 160, SK_GX = 22, SK_GY = 28, SK_GW = 160, SK_GH = 120;
var SK_TINTE = '#2B2B2B', SK_BLAU = '#1E3A8A';
var SK_MASSSTAEBE = [
  { m: 10000, text: '1 : 10 000', x: SK_GX, cm: 4, teile: [0, 100, 200, 300, 400], einheit: 'm' },
  { m: 25000, text: '1 : 25 000', x: SK_GX + 50, cm: 4, teile: [0, 250, 500, 750, 1000], einheit: 'm' },
  { m: 50000, text: '1 : 50 000', x: SK_GX + 100, cm: 6, teile: [0, 500, 1000, 1500, 2000, 2500, 3000], einheit: 'm' }
];
// Werkzeuge: Art, Name, Form (linie, flaeche, punkt)
var SK_WERKZEUGE = [
  ['Linien', [['strasse', 'Straße', 'linie'], ['weg', 'Weg', 'linie'], ['bahn', 'Bahnlinie', 'linie'], ['fluss', 'Fluss, Bach', 'linie'], ['marsch', 'Marschweg', 'linie']]],
  ['Flächen', [['ort', 'Ortschaft', 'flaeche'], ['nadelwald', 'Nadelwald', 'flaeche'], ['laubwald', 'Laubwald', 'flaeche'], ['mischwald', 'Mischwald', 'flaeche']]],
  ['Zeichen', [['kirche', 'Kirche', 'punkt'], ['gebaeude', 'Einzelgebäude', 'punkt'], ['bruecke', 'Brücke', 'punkt'], ['baum', 'Einzelbaum', 'punkt'], ['nadelbaum', 'Nadelbaum', 'punkt'], ['laubbaum', 'Laubbaum', 'punkt'],
    ['kuppe', 'Kuppe', 'punkt'], ['tp', 'Trig. Punkt', 'punkt'], ['text', 'Text', 'punkt'], ['nord', 'Nordpfeil', 'punkt']]],
  // Stellungsskizze: Schützen und Waffen als NATO-Zeichen (APP-6D), Feuer und Sperren. Die vierte Angabe ist eine feste Zahl von Punkten.
  ['Stellung', [['schuetze', 'Schütze (Gewehr)', 'punkt'], ['mg', 'MG', 'punkt'], ['mgs', 'MG schwer', 'punkt'], ['gran', 'Granatwerfer', 'punkt'],
    ['pzf', 'Panzerfaust', 'punkt'], ['pzabw', 'PzAbw-Lenkflugkörper', 'punkt'], ['gruppe', 'Gruppe ••', 'punkt'], ['trupp', 'Trupp •', 'punkt'], ['beob', 'Beobachtungsposten', 'punkt']]],
  ['Feuer', [['hsr', 'Hauptschussrichtung', 'linie', 2], ['feuer', 'Feuerbereich', 'linie', 3], ['ziel', 'Zielpunkt mit Entfernung', 'linie', 2]]],
  ['Sperren', [['draht', 'Drahtsperre', 'linie'], ['minen', 'Minensperre', 'flaeche'], ['graben', 'Graben', 'linie']]]
];
var SK_ART = {};
SK_WERKZEUGE.forEach(function (g) { g[1].forEach(function (w) { SK_ART[w[0]] = { name: w[1], form: w[2], n: w[3] || 0 }; }); });
// NATO-Zeichen der Stellungsskizze: Code ohne Zugehörigkeit (die setzt eigene „3“ oder Feind „6“ ein)
var SK_NATO = { schuetze: '15000011010300', mg: '15000011020200', mgs: '15000011020300', gran: '15000011030100', pzf: '15000011170100', pzabw: '15000011120100', gruppe: '10001312110000', trupp: '10001212110000' };
// Weitere Zeichen aus „Meine Zeichen“ oder dem Baukasten tragen ihren eigenen Code (art 'nato')
SK_ART.nato = { name: 'Taktisches Zeichen', form: 'punkt', n: 0 };
var skNatoWahl = null, skBaukastenFuer = null;
function skIstNato(e) { return !!(SK_NATO[e.art] || (e.art === 'nato' && e.sidc)); }
function skNatoSidc(e) {
  if (e.art === 'nato') { var c = e.sidc; return /[36]/.test(c.charAt(3)) ? c.substr(0, 3) + (e.feind ? '6' : '3') + c.substr(4) : c; }
  return '100' + (e.feind ? '6' : '3') + SK_NATO[e.art] + '00';
}
var SK_ROT = '#B3261E';

/* ===== Speicher ===== */
var SK_KEY = 'meinkamerad-skizzen';
// Arten von Skizzen: jede hat ihr eigenes Dock mit den passenden Werkzeugen (Einträge: Beschriftung, Bild, Fach oder Werkzeug)
var SK_ARTEN = {
  gelaende: { name: 'Gelände- und Wegeskizze', kurz: 'Geländeskizze', text: 'Gelände mit Straßen, Wäldern und Ortschaften, dazu der Marschweg mit Entfernungen.',
    dock: [['Linien', 'strasse', 'fach'], ['Flächen', 'nadelwald', 'fach'], ['Zeichen', 'kirche', 'fach'], ['Marschweg', 'marsch', 'wz']] },
  stellung: { name: 'Stellungsskizze', kurz: 'Stellungsskizze', text: 'Schützen und Waffen als NATO-Zeichen, Hauptschussrichtung, Feuerbereich, Zielpunkte und Sperren.',
    dock: [['Stellung', 'schuetze', 'fach'], ['Feuer', 'feuer', 'fach'], ['Gelände', 'nadelwald', 'fach', ['strasse', 'weg', 'fluss', 'ort', 'nadelwald', 'laubwald', 'mischwald', 'gebaeude', 'baum', 'nadelbaum', 'laubbaum', 'kuppe', 'text', 'nord']], ['Sperren', 'draht', 'fach']] },
  entfernung: { name: 'Entfernungsskizze', kurz: 'Entfernungsskizze', text: 'Eigener Standort und Zielpunkte mit Entfernungen.', bald: true },
  panorama: { name: 'Panoramaskizze', kurz: 'Panoramaskizze', text: 'Ansicht des Geländes auf einem Foto, mit Geländepunkten und Entfernungen.', bald: true }
};
function skArt(s) { return SK_ARTEN[s && s.art] && !SK_ARTEN[s.art].bald ? s.art : 'gelaende'; }
function skNeu(name, art) {
  var heute = new Date();
  return { id: 's' + Date.now(), art: art || 'gelaende', name: name, massstab: 25000, zaehlung: 'teil', datum: heute.toISOString().slice(0, 10), unterschrift: '', erlaeuterung: '',
    elemente: [{ id: 'e' + Date.now(), art: 'nord', pts: [[SK_GX + 148, SK_GY + 18]], winkel: 0 }] };
}
function skLaden() {
  var d = null;
  try { d = JSON.parse(localStorage.getItem(SK_KEY) || 'null'); } catch (e) { d = null; }
  if (!d || !Array.isArray(d.liste)) d = { aktiv: null, liste: [] };
  if (!d.liste.some(function (s) { return s.id === d.aktiv; })) d.aktiv = d.liste.length ? d.liste[0].id : null;
  return d;
}
var SK = skLaden();
function skSpeichern() { try { localStorage.setItem(SK_KEY, JSON.stringify(SK)); } catch (e) { /* Speichern nicht möglich, die Skizze gilt bis zum Neuladen */ } }
function skAktiv() { return SK.liste.filter(function (s) { return s.id === SK.aktiv; })[0]; }

/* ===== Zustand der Bedienung ===== */
var skVoll = false, skAnsicht = null, skFach = null, skVollKey = '', skFinger = {}, skPinch = null, skWerkzeug = null, skPunkte = [], skAuswahl = null, skVerlauf = [], skZoom = 1;
function skMerken() { skVerlauf.push(JSON.stringify(skAktiv())); if (skVerlauf.length > 40) skVerlauf.shift(); $('sk-v-zurueck').disabled = false; }
function skElement(id) { return skAktiv().elemente.filter(function (e) { return e.id === id; })[0]; }

/* ===== Geometrie ===== */
function skRund(v) { return Math.round(v * 100) / 100; }
function skLaenge(a, b) { return Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])); }
function skPfad(pts, zu) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + skRund(p[0]) + ',' + skRund(p[1]); }).join(' ') + (zu ? ' Z' : ''); }
// Entlang einer Linie in festen Abständen Punkte mit Richtung erzeugen (für Bahnlinie und Fluss)
function skEntlang(pts, schritt) {
  var aus = [], rest = 0;
  for (var i = 1; i < pts.length; i++) {
    var a = pts[i - 1], b = pts[i], l = skLaenge(a, b);
    if (!l) continue;
    var dx = (b[0] - a[0]) / l, dy = (b[1] - a[1]) / l;
    for (var s = rest; s <= l; s += schritt) aus.push({ x: a[0] + dx * s, y: a[1] + dy * s, dx: dx, dy: dy });
    rest = s - l;
  }
  return aus;
}
// Meter je Millimeter auf dem Blatt
function skMeterJeMm(s) { return s.massstab / 1000; }
// Ohne Maßstab (0) gibt es keine berechneten Entfernungen; am Marschweg stehen dann die von Hand eingetragenen
// Trennen bei Semikolon, Komma mit Leerzeichen oder Leerzeichen zwischen zwei Zahlen; „1,2 km“ und „ca. 800“ bleiben ganz
function skHandEntf(e) { var t = String(e.entf || ''); if (/^\s*\d{2,}(\s*,\s*\d{2,})+\s*$/.test(t)) t = t.replace(/,/g, ';'); return t.replace(/(\d)\s+(?=\d)/g, '$1;').split(/\s*;\s*|,\s+/).map(function (x) { return x.trim(); }).filter(Boolean); }
function skOhneMassstab(s) { return !s.massstab; }
function skMeter(s, mm) { var m = mm * skMeterJeMm(s); return m < 1000 ? Math.round(m / 10) * 10 : Math.round(m / 50) * 50; }

/* ===== Zeichnen ===== */
function skNadel(x, y) {
  return '<path d="M' + (x - 1.1) + ',' + (y + 0.7) + ' L' + (x - 0.2) + ',' + (y - 1.9) + ' L' + (x + 1.4) + ',' + (y + 1.6) + '" fill="none" stroke="' + SK_TINTE + '" stroke-width=".5" stroke-linecap="round" stroke-linejoin="round"/>';
}
function skLaub(x, y) {
  return '<path d="M' + (x - 0.5) + ',' + (y + 1.1) + ' C' + (x - 2) + ',' + (y + 0.7) + ' ' + (x - 2) + ',' + (y - 1.8) + ' ' + x + ',' + (y - 1.8) +
    ' C' + (x + 1.9) + ',' + (y - 1.8) + ' ' + (x + 1.9) + ',' + (y + 0.5) + ' ' + (x + 0.7) + ',' + (y + 1.3) + ' L' + (x + 1.9) + ',' + (y + 1.4) +
    '" fill="none" stroke="' + SK_TINTE + '" stroke-width=".5" stroke-linecap="round" stroke-linejoin="round"/>';
}
function skDefs() {
  return '<defs>' +
    '<clipPath id="sk-raster-clip"><rect x="' + SK_GX + '" y="' + SK_GY + '" width="' + SK_GW + '" height="' + SK_GH + '"/></clipPath>' +
    '<pattern id="sk-schraffur" width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2.2" stroke="' + SK_TINTE + '" stroke-width=".45"/></pattern>' +
    // Handgezeichnete Waldzeichen wie im Meldeblock: Nadelwald ein spitzes Λ mit kürzerem linken Schenkel,
    // Laubwald eine unten offene Schleife (links eingerollt, rechts kurzer Fuß). Locker und versetzt verteilt.
    '<pattern id="sk-nadel" width="13" height="11" patternUnits="userSpaceOnUse">' + skNadel(3, 4) + skNadel(9.5, 9.5) + '</pattern>' +
    '<pattern id="sk-laub" width="13" height="11" patternUnits="userSpaceOnUse">' + skLaub(3, 4) + skLaub(9.5, 9.5) + '</pattern>' +
    '<pattern id="sk-minen" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1" fill="none" stroke="' + SK_ROT + '" stroke-width=".4"/></pattern>' +
    '<pattern id="sk-misch" width="13" height="11" patternUnits="userSpaceOnUse">' + skNadel(3, 4) + skLaub(9.5, 9.5) + '</pattern>' +
    '</defs>';
}
function skBlatt(s) {
  var h = '<rect x="0" y="0" width="' + SK_B + '" height="' + SK_H + '" fill="#F4F0E6"/>';
  // Maßstäbe oben, die nicht benutzten durchgestrichen
  h += '<text x="' + (SK_GX + SK_GW / 2) + '" y="5.2" text-anchor="middle" font-size="2.6" fill="#555">Die nicht benutzten Maßstäbe durchstreichen</text>';
  SK_MASSSTAEBE.forEach(function (m) {
    var y = 14, b = m.cm * 10, n = m.teile.length - 1;
    h += '<text x="' + (m.x + b / 2) + '" y="10.5" text-anchor="middle" font-size="3" fill="' + SK_TINTE + '">' + m.text + '</text>';
    h += '<line x1="' + m.x + '" y1="' + y + '" x2="' + (m.x + b) + '" y2="' + y + '" stroke="' + SK_TINTE + '" stroke-width=".35"/>';
    m.teile.forEach(function (t, i) {
      var x = m.x + b * i / n;
      h += '<line x1="' + x + '" y1="' + (y - 1.2) + '" x2="' + x + '" y2="' + y + '" stroke="' + SK_TINTE + '" stroke-width=".3"/>' +
        '<text x="' + x + '" y="' + (y + 3.4) + '" text-anchor="middle" font-size="2.3" fill="' + SK_TINTE + '">' + t + (i === n ? ' m' : '') + '</text>';
    });
    if (m.m !== s.massstab) h += '<line x1="' + (m.x + b / 2 - 9) + '" y1="13" x2="' + (m.x + b / 2 + 9) + '" y2="6" stroke="' + SK_TINTE + '" stroke-width=".7" stroke-linecap="round"/>';
  });
  // Raster mit Zentimeterlinien und Beschriftung
  for (var i = 1; i < 16; i++) h += '<line x1="' + (SK_GX + i * 10) + '" y1="' + SK_GY + '" x2="' + (SK_GX + i * 10) + '" y2="' + (SK_GY + SK_GH) + '" stroke="#9A968C" stroke-width=".2" stroke-dasharray=".6 .9"/>';
  for (i = 1; i < 12; i++) h += '<line x1="' + SK_GX + '" y1="' + (SK_GY + i * 10) + '" x2="' + (SK_GX + SK_GW) + '" y2="' + (SK_GY + i * 10) + '" stroke="#9A968C" stroke-width=".2" stroke-dasharray=".6 .9"/>';
  h += '<rect x="' + SK_GX + '" y="' + SK_GY + '" width="' + SK_GW + '" height="' + SK_GH + '" fill="none" stroke="' + SK_TINTE + '" stroke-width=".4"/>';
  for (i = 0; i <= 16; i++) h += '<text x="' + (SK_GX + i * 10) + '" y="' + (SK_GY + SK_GH + 4.4) + '" text-anchor="middle" font-size="2.6" fill="' + SK_TINTE + '">' + i + '</text>';
  for (i = 0; i <= 12; i++) h += '<text x="' + (SK_GX - 2.2) + '" y="' + (SK_GY + SK_GH - i * 10 + 0.9) + '" text-anchor="end" font-size="2.6" fill="' + SK_TINTE + '">' + i + '</text>';
  // Rechts, quer gestellt: Erläuterungen sowie Datum und Unterschrift
  var rx = SK_GX + SK_GW + 7, ry = SK_GY + SK_GH, zeilen = skUmbrechen(s.erlaeuterung, 52, 3);
  h += '<g transform="translate(' + rx + ',' + ry + ') rotate(-90)">' +
    '<text x="0" y="0" font-size="2.9" font-weight="600" fill="' + SK_TINTE + '">Erläuterungen:</text>' +
    zeilen.map(function (z, j) { return '<text x="0" y="' + (4.6 + j * 4.4) + '" font-size="3.2" fill="' + SK_BLAU + '">' + esc(z) + '</text>'; }).join('') + '</g>';
  var ux = SK_B - 7, datum = s.datum ? s.datum.split('-').reverse().join('.') : '';
  h += '<g transform="translate(' + ux + ',' + ry + ') rotate(-90)">' +
    '<text x="0" y="0" font-size="3.4" fill="' + SK_BLAU + '">' + esc(datum) + '</text>' +
    '<text x="' + SK_GH + '" y="0" text-anchor="end" font-size="3.4" fill="' + SK_BLAU + '">' + esc(s.unterschrift || '') + '</text>' +
    '<line x1="' + (SK_GH - 62) + '" y1="1.4" x2="' + SK_GH + '" y2="1.4" stroke="' + SK_TINTE + '" stroke-width=".25"/>' +
    '<text x="' + SK_GH + '" y="4.2" text-anchor="end" font-size="2.3" fill="#555">(Unterschrift)</text>' +
    '<text x="0" y="4.2" font-size="2.3" fill="#555">(Datum)</text></g>';
  return h;
}
function skUmbrechen(t, breite, max) {
  var w = String(t || '').replace(/\s+/g, ' ').trim().split(' '), z = [], akt = '';
  w.forEach(function (x) { if (!x) return; if ((akt + ' ' + x).trim().length > breite && akt) { z.push(akt); akt = x; } else akt = (akt + ' ' + x).trim(); });
  if (akt) z.push(akt);
  if (z.length > max) { z = z.slice(0, max); z[max - 1] = z[max - 1].slice(0, breite - 1) + '…'; }
  return z;
}
// Ein Element als SVG; mit Treffer = breite unsichtbare Fläche zum Antippen
function skElementSvg(s, e, mitTreffer) {
  var a = e.art, p = e.pts, h = '', t = '';
  var tr = function (d, zu) { return mitTreffer ? '<path d="' + d + '" fill="' + (zu ? 'rgba(0,0,0,0.001)' : 'none') + '" stroke="rgba(0,0,0,0.001)" stroke-width="5" pointer-events="all"/>' : ''; };
  if (a === 'strasse') h = '<path d="' + skPfad(p) + '" fill="none" stroke="' + SK_TINTE + '" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>' + tr(skPfad(p));
  else if (a === 'weg') h = '<path d="' + skPfad(p) + '" fill="none" stroke="' + SK_TINTE + '" stroke-width=".6" stroke-dasharray="2.2 1.4" stroke-linecap="round"/>' + tr(skPfad(p));
  else if (a === 'bahn') {
    h = '<path d="' + skPfad(p) + '" fill="none" stroke="' + SK_TINTE + '" stroke-width=".9" stroke-linejoin="round"/>';
    skEntlang(p, 3).forEach(function (q, i) { if (i) h += '<line x1="' + skRund(q.x - q.dy * 1.8) + '" y1="' + skRund(q.y + q.dx * 1.8) + '" x2="' + skRund(q.x + q.dy * 1.8) + '" y2="' + skRund(q.y - q.dx * 1.8) + '" stroke="' + SK_TINTE + '" stroke-width=".6"/>'; });
    h += tr(skPfad(p));
  } else if (a === 'fluss') {
    var w = skEntlang(p, 0.8).map(function (q, i) { var o = Math.sin(i * 0.8) * 0.9; return [q.x - q.dy * o, q.y + q.dx * o]; });
    if (p.length) w.push(p[p.length - 1]);
    h = '<path d="' + skPfad(w) + '" fill="none" stroke="' + SK_TINTE + '" stroke-width=".55" stroke-linejoin="round"/>' + tr(skPfad(p));
  } else if (a === 'marsch') {
    h = '<path d="' + skPfad(p) + '" fill="none" stroke="' + SK_BLAU + '" stroke-width=".9" stroke-dasharray=".1 1.5" stroke-linecap="round" stroke-linejoin="round"/>';
    var summe = 0;
    p.forEach(function (q, i) {
      if (!i) { h += '<path d="M' + (q[0] - 1.6) + ',' + (q[1] - 1.6) + ' L' + (q[0] + 1.6) + ',' + (q[1] + 1.6) + ' M' + (q[0] - 1.6) + ',' + (q[1] + 1.6) + ' L' + (q[0] + 1.6) + ',' + (q[1] - 1.6) + '" stroke="' + SK_BLAU + '" stroke-width=".6"/>'; return; }
      var v = p[i - 1], l = skLaenge(v, q);
      summe += l;
      // Pfeil in der Mitte der Teilstrecke
      if (l > 6) {
        var mx = (v[0] + q[0]) / 2, my = (v[1] + q[1]) / 2, dx = (q[0] - v[0]) / l, dy = (q[1] - v[1]) / l;
        h += '<path d="M' + skRund(mx - dx * 1.6 - dy * 1.2) + ',' + skRund(my - dy * 1.6 + dx * 1.2) + ' L' + skRund(mx) + ',' + skRund(my) + ' L' + skRund(mx - dx * 1.6 + dy * 1.2) + ',' + skRund(my - dy * 1.6 - dx * 1.2) + '" fill="none" stroke="' + SK_BLAU + '" stroke-width=".55" stroke-linecap="round"/>';
      }
      var m = skOhneMassstab(s) ? (skHandEntf(e)[i - 1] || '') : skMeter(s, s.zaehlung === 'gesamt' ? summe : l);
      h += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="2" fill="none" stroke="' + SK_BLAU + '" stroke-width=".5"/>' +
        '<text x="' + skRund(q[0] - 2.6) + '" y="' + skRund(q[1] - 2.4) + '" text-anchor="end" font-size="3.4" fill="' + SK_BLAU + '" paint-order="stroke" stroke="#F4F0E6" stroke-width=".9">' + m + '</text>';
    });
    h += tr(skPfad(p));
  } else if (a === 'hsr' && p.length > 1) {
    // Hauptschussrichtung: kräftiger Pfeil von der Stellung weg
    var hq = p[p.length - 1], hv = p[0], hl = skLaenge(hv, hq) || 1, hx = (hq[0] - hv[0]) / hl, hy = (hq[1] - hv[1]) / hl;
    h = '<path d="M' + hv[0] + ',' + hv[1] + ' L' + skRund(hq[0] - hx * 1.5) + ',' + skRund(hq[1] - hy * 1.5) + '" stroke="' + SK_ROT + '" stroke-width=".8" stroke-linecap="round"/>' +
      '<path d="M' + skRund(hq[0] - hx * 3.2 - hy * 1.6) + ',' + skRund(hq[1] - hy * 3.2 + hx * 1.6) + ' L' + hq[0] + ',' + hq[1] + ' L' + skRund(hq[0] - hx * 3.2 + hy * 1.6) + ',' + skRund(hq[1] - hy * 3.2 - hx * 1.6) + ' Z" fill="' + SK_ROT + '"/>' + tr(skPfad(p));
  } else if (a === 'feuer' && p.length > 1) {
    // Feuerbereich: linke und rechte Grenze von der Stellung aus, dazu ein Bogen
    var o = p[0], la = p[1], ra = p[2] || p[1], r = Math.min(skLaenge(o, la), skLaenge(o, ra)) * 0.35;
    var w1 = Math.atan2(la[1] - o[1], la[0] - o[0]), w2 = Math.atan2(ra[1] - o[1], ra[0] - o[0]), d = w2 - w1;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    h = '<path d="M' + o[0] + ',' + o[1] + ' L' + la[0] + ',' + la[1] + ' M' + o[0] + ',' + o[1] + ' L' + ra[0] + ',' + ra[1] + '" stroke="' + SK_ROT + '" stroke-width=".5" stroke-dasharray="2 1" fill="none"/>' +
      (p.length > 2 ? '<path d="M' + skRund(o[0] + Math.cos(w1) * r) + ',' + skRund(o[1] + Math.sin(w1) * r) + ' A' + skRund(r) + ',' + skRund(r) + ' 0 0 ' + (d > 0 ? 1 : 0) + ' ' + skRund(o[0] + Math.cos(w2) * r) + ',' + skRund(o[1] + Math.sin(w2) * r) + '" fill="none" stroke="' + SK_ROT + '" stroke-width=".45"/>' +
        '<path d="M' + o[0] + ',' + o[1] + ' L' + skRund(o[0] + Math.cos(w1) * r) + ',' + skRund(o[1] + Math.sin(w1) * r) + ' A' + skRund(r) + ',' + skRund(r) + ' 0 0 ' + (d > 0 ? 1 : 0) + ' ' + skRund(o[0] + Math.cos(w2) * r) + ',' + skRund(o[1] + Math.sin(w2) * r) + ' Z" fill="rgba(179,38,30,.10)" stroke="none"/>' : '') + tr(skPfad(p));
  } else if (a === 'ziel' && p.length > 1) {
    // Zielpunkt: dünner Strahl von der Stellung, Kreuz am Ziel, Name und Entfernung
    var zv = p[0], zz = p[1], zm = skOhneMassstab(s) ? '' : skMeter(s, skLaenge(zv, zz)), ztext = [e.name || '', zm].filter(function (x) { return x !== ''; }).join(' ');
    h = '<path d="M' + zv[0] + ',' + zv[1] + ' L' + zz[0] + ',' + zz[1] + '" stroke="' + SK_BLAU + '" stroke-width=".35"/>' +
      '<path d="M' + (zz[0] - 1.3) + ',' + (zz[1] - 1.3) + ' L' + (zz[0] + 1.3) + ',' + (zz[1] + 1.3) + ' M' + (zz[0] - 1.3) + ',' + (zz[1] + 1.3) + ' L' + (zz[0] + 1.3) + ',' + (zz[1] - 1.3) + '" stroke="' + SK_BLAU + '" stroke-width=".55"/>' +
      (ztext ? '<text x="' + zz[0] + '" y="' + skRund(zz[1] - 2.6) + '" text-anchor="middle" font-size="3.2" fill="' + SK_BLAU + '" paint-order="stroke" stroke="#F4F0E6" stroke-width=".9">' + esc(ztext) + '</text>' : '') + tr(skPfad(p));
  } else if (a === 'draht') {
    h = '<path d="' + skPfad(p) + '" fill="none" stroke="' + SK_TINTE + '" stroke-width=".45"/>';
    skEntlang(p, 4).forEach(function (q, i) { if (i) h += '<path d="M' + skRund(q.x - 1.2) + ',' + skRund(q.y - 1.2) + ' L' + skRund(q.x + 1.2) + ',' + skRund(q.y + 1.2) + ' M' + skRund(q.x - 1.2) + ',' + skRund(q.y + 1.2) + ' L' + skRund(q.x + 1.2) + ',' + skRund(q.y - 1.2) + '" stroke="' + SK_TINTE + '" stroke-width=".45"/>'; });
    h += tr(skPfad(p));
  } else if (a === 'graben') {
    // Graben als Zickzack-Linie
    var zk = skEntlang(p, 1.6).map(function (q, i) { var o2 = i % 2 ? 1 : -1; return [q.x - q.dy * o2, q.y + q.dx * o2]; });
    h = '<path d="' + skPfad(zk.length ? zk : p) + '" fill="none" stroke="' + SK_TINTE + '" stroke-width=".5" stroke-linejoin="round"/>' + tr(skPfad(p));
  } else if (a === 'minen') h = '<path d="' + skPfad(p, true) + '" fill="url(#sk-minen)" stroke="' + SK_ROT + '" stroke-width=".5" stroke-linejoin="round"/>' + tr(skPfad(p, true), true);
  else if (a === 'ort') h = '<path d="' + skPfad(p, true) + '" fill="url(#sk-schraffur)" stroke="' + SK_TINTE + '" stroke-width=".7" stroke-linejoin="round"/>' + tr(skPfad(p, true), true);
  else if (a === 'nadelwald' || a === 'laubwald' || a === 'mischwald') {
    h = '<path d="' + skPfad(p, true) + '" fill="rgba(120,175,90,0.20)" stroke="none"/><path d="' + skPfad(p, true) + '" fill="url(#sk-' + { nadelwald: 'nadel', laubwald: 'laub', mischwald: 'misch' }[a] + ')" stroke="' + SK_TINTE + '" stroke-width=".25" stroke-dasharray="1 1"/>' + tr(skPfad(p, true), true);
  } else {
    var x = p[0][0], y = p[0][1], dreh = e.winkel ? ' rotate(' + e.winkel + ')' : '';
    if (a === 'kirche') t = '<circle cx="0" cy="0" r="1.5" fill="none" stroke="' + SK_TINTE + '" stroke-width=".5"/><path d="M0,-1.5 V-5 M-1.3,-3.6 H1.3" stroke="' + SK_TINTE + '" stroke-width=".5"/>';
    else if (a === 'gebaeude') t = '<rect x="-1.6" y="-1.2" width="3.2" height="2.4" fill="' + SK_TINTE + '"/>';
    else if (a === 'bruecke') t = '<path d="M-2.4,-3.2 Q-1,0 -2.4,3.2 M2.4,-3.2 Q1,0 2.4,3.2 M-2.4,-3.2 L-3.4,-4 M-2.4,3.2 L-3.4,4 M2.4,-3.2 L3.4,-4 M2.4,3.2 L3.4,4" fill="none" stroke="' + SK_TINTE + '" stroke-width=".55" stroke-linecap="round"/>';
    else if (skIstNato(e)) {
      // NATO-Zeichen über milsymbol, auf etwa 8 mm Rahmenbreite verkleinert
      if (window.ms) {
        var mo = { size: 30, standard: 'APP6', fill: true, colorMode: 'Light' };
        if (e.opt) Object.keys(e.opt).forEach(function (k) { if (k !== 'size') mo[k] = e.opt[k]; });
        var code = skNatoSidc(e), sechseck = code.substr(4, 2) === '15' && code.charAt(3) === '3';
        // Eigene Waffen und Ausrüstung als Sechseck wie auf den Spielsteinen der Ausbildung; Feind bleibt die Raute nach APP-6
        if (sechseck) { mo.frame = false; mo.fill = false; mo.monoColor = '#000000'; }
        var sym = new window.ms.Symbol(code, mo), an = sym.getAnchor(), k = 0.27;
        t = (sechseck ? '<path d="M0,-4.6 L3.98,-2.3 L3.98,2.3 L0,4.6 L-3.98,2.3 L-3.98,-2.3 Z" fill="#80E0FF" stroke="#000" stroke-width=".45" stroke-linejoin="round"/>' : '') +
          '<g transform="scale(' + k + ') translate(' + skRund(-an.x) + ',' + skRund(-an.y) + ')">' + sym.asSVG() + '</g>';
      } else t = '<circle r="3" fill="none" stroke="' + SK_TINTE + '" stroke-width=".4"/>';
    } else if (a === 'beob') t = '<path d="M0,-3 L3,2.2 L-3,2.2 Z" fill="none" stroke="' + (e.feind ? SK_ROT : SK_TINTE) + '" stroke-width=".55" stroke-linejoin="round"/><circle cx="0" cy=".5" r=".55" fill="' + (e.feind ? SK_ROT : SK_TINTE) + '"/>';
    else if (a === 'nadelbaum') t = skNadel(0, 0);
    else if (a === 'laubbaum') t = skLaub(0, 0);
    else if (a === 'baum') t = '<circle cx="0" cy="-2.4" r="1.7" fill="none" stroke="' + SK_TINTE + '" stroke-width=".5"/><path d="M0,-0.7 V1.6" stroke="' + SK_TINTE + '" stroke-width=".5"/>';
    else if (a === 'kuppe') t = '<path d="M-4.5,0.6 C-4.6,-2.2 -1.4,-3.3 1.2,-2.8 C3.8,-2.3 5,-0.6 4.4,1 C3.8,2.6 0.8,3 -1.6,2.7 C-3.6,2.4 -4.4,1.8 -4.5,0.6 Z" fill="none" stroke="' + SK_TINTE + '" stroke-width=".5"/><path d="M-2.4,0.4 C-2.4,-1 -0.6,-1.4 0.8,-1.1 C2.2,-0.8 2.6,0.2 2,0.8 C1.2,1.5 -2.3,1.6 -2.4,0.4 Z" fill="none" stroke="' + SK_TINTE + '" stroke-width=".4"/>';
    else if (a === 'tp') t = '<path d="M0,-2.4 L2.2,1.4 L-2.2,1.4 Z" fill="none" stroke="' + SK_TINTE + '" stroke-width=".5"/><circle cx="0" cy="0.2" r=".45" fill="' + SK_TINTE + '"/>';
    else if (a === 'text') t = '<text x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-size="' + (e.groesse || 3.6) + '" fill="' + SK_BLAU + '" paint-order="stroke" stroke="#F4F0E6" stroke-width=".8">' + esc(e.text || 'Text') + '</text>';
    else if (a === 'nord') t = '<path d="M0,6 V-6 M-1.6,-3.6 L0,-6.4 L1.6,-3.6" fill="none" stroke="' + SK_TINTE + '" stroke-width=".6" stroke-linecap="round" stroke-linejoin="round"/><text x="2.6" y="1.6" font-size="4" font-weight="600" fill="' + SK_TINTE + '">N</text>';
    var gr = a === 'text' ? Math.max(4, String(e.text || 'Text').length * (e.groesse || 3.6) * 0.32) : (a === 'nord' ? 5 : 4.5);
    if (skIstNato(e)) dreh = '';
    h = '<g transform="translate(' + skRund(x) + ',' + skRund(y) + ')' + dreh + '">' + t + (mitTreffer ? '<rect x="' + (-gr) + '" y="-5" width="' + (2 * gr) + '" height="' + (a === 'nord' ? 12 : 8) + '" fill="rgba(0,0,0,0.001)" pointer-events="all"/>' : '') + '</g>';
  }
  return h;
}
// Name eines Elements (z. B. Südwald, Schlierhof): bei Flächen in der Mitte, bei Linien neben der Mitte, bei Zeichen rechts daneben
// Ankerpunkt des Namens (ohne Verschiebung)
function skNameAnker(e) {
  var p = e.pts, f = SK_ART[e.art] ? SK_ART[e.art].form : 'punkt', x, y, anker = 'middle';
  if (f === 'flaeche') {
    x = 0; y = 0;
    p.forEach(function (q) { x += q[0]; y += q[1]; });
    x /= p.length; y /= p.length;
  } else if (f === 'linie') {
    var ges = 0, i;
    for (i = 1; i < p.length; i++) ges += skLaenge(p[i - 1], p[i]);
    var rest = ges / 2;
    for (i = 1; i < p.length; i++) {
      var l = skLaenge(p[i - 1], p[i]);
      if (rest <= l || i === p.length - 1) {
        var t = l ? rest / l : 0, dx = l ? (p[i][0] - p[i - 1][0]) / l : 1, dy = l ? (p[i][1] - p[i - 1][1]) / l : 0;
        if (dy > 0 || (dy === 0 && dx < 0)) { dx = -dx; dy = -dy; }
        x = p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t + dy * 3.2;
        y = p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t - dx * 3.2;
        break;
      }
      rest -= l;
    }
  } else { x = p[0][0] + 3.6; y = p[0][1] + 1.2; anker = 'start'; }
  return { x: x, y: y, anker: anker };
}
// Verschobene Namen hängen an einem dünnen Strich zum Element, wie auf dem Meldeblatt üblich
function skNameSvg(e, mitTreffer) {
  if (!e.name || e.art === 'text' || e.art === 'ziel' || !e.pts || !e.pts.length) return '';
  var a = skNameAnker(e), x = a.x, y = a.y, anker = a.anker, h = '';
  if (e.nameVersatz) {
    x += e.nameVersatz[0]; y += e.nameVersatz[1]; anker = 'middle';
    var ax = a.anker === 'start' ? a.x - 3.6 : a.x, ay = a.anker === 'start' ? a.y - 1.2 : a.y, dx = ax - x, dy = ay - y, l = Math.sqrt(dx * dx + dy * dy);
    if (l > 5) h += '<line x1="' + skRund(x + dx / l * 3) + '" y1="' + skRund(y + dy / l * 3) + '" x2="' + skRund(ax - dx / l * 0.8) + '" y2="' + skRund(ay - dy / l * 0.8) + '" stroke="' + SK_BLAU + '" stroke-width=".4" stroke-linecap="round" pointer-events="none"/>';
  }
  var breite = String(e.name).length * 1.9 + 2;
  h += '<text x="' + skRund(x) + '" y="' + skRund(y) + '" text-anchor="' + anker + '" dominant-baseline="middle" font-size="3.6" fill="' + SK_BLAU + '" paint-order="stroke" stroke="#F4F0E6" stroke-width="1.1" stroke-linejoin="round" pointer-events="none">' + esc(e.name) + '</text>';
  if (mitTreffer) h += '<rect class="sk-name" data-sk-name="' + e.id + '" x="' + skRund(anker === 'start' ? x - 1 : x - breite / 2) + '" y="' + skRund(y - 3) + '" width="' + skRund(breite) + '" height="6" fill="rgba(0,0,0,0.001)" pointer-events="all"/>';
  return h;
}
function skSvg(s, bearbeiten) {
  var h = skDefs() + skBlatt(s) + '<g clip-path="url(#sk-raster-clip)">';
  // Flächen unten, dann Linien, dann Zeichen
  var rang = function (e) { var f = SK_ART[e.art] ? SK_ART[e.art].form : 'punkt'; return f === 'flaeche' ? 0 : (f === 'linie' ? (e.art === 'marsch' ? 2 : 1) : 3); };
  s.elemente.slice().sort(function (a, b) { return rang(a) - rang(b); }).forEach(function (e) {
    h += '<g class="sk-el' + (bearbeiten && skAuswahl === e.id ? ' gewaehlt' : '') + (e.gesperrt ? ' gesperrt' : '') + '" data-sk="' + e.id + '">' + skElementSvg(s, e, bearbeiten) + '</g>';
  });
  // Namen ganz oben, damit sie lesbar und greifbar bleiben
  s.elemente.forEach(function (e) { h += skNameSvg(e, bearbeiten); });
  h += '</g>';
  if (bearbeiten) {
    // Begonnene Linie oder Fläche
    if (skPunkte.length) {
      var zu = SK_ART[skWerkzeug].form === 'flaeche' && skPunkte.length > 2;
      h += '<g pointer-events="none">' + (skPunkte.length > 1 ? skElementSvg(s, { art: skWerkzeug, pts: skPunkte }, false) : '') +
        '<path d="' + skPfad(skPunkte, zu) + '" fill="none" stroke="#C62828" stroke-width=".35" stroke-dasharray="1 1"/>' +
        skPunkte.map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="1.1" fill="#C62828"/>'; }).join('') + '</g>';
    }
    // Gewähltes Element: gestrichelter Rahmen; Griffe zum Verschieben einzelner Punkte bei Linien und Flächen
    var g = skAuswahl && skElement(skAuswahl);
    if (g && g.pts && g.pts.length) {
      var xs = g.pts.map(function (q) { return q[0]; }), ys = g.pts.map(function (q) { return q[1]; }), pk = SK_ART[g.art] && SK_ART[g.art].form === 'punkt';
      var rx = pk ? (g.art === 'text' ? Math.max(5, String(g.text || '').length * 1.2 + 2) : 5) : 2, ry = pk ? (g.art === 'nord' ? 7.5 : 5) : 2;
      h += '<rect x="' + skRund(Math.min.apply(null, xs) - rx) + '" y="' + skRund(Math.min.apply(null, ys) - ry) + '" width="' + skRund(Math.max.apply(null, xs) - Math.min.apply(null, xs) + 2 * rx) + '" height="' + skRund(Math.max.apply(null, ys) - Math.min.apply(null, ys) + 2 * ry) +
        '" fill="none" stroke="#C62828" stroke-width=".4" stroke-dasharray="1.4 1" rx="1" pointer-events="none"/>';
    }
    if (g && !g.gesperrt && SK_ART[g.art] && SK_ART[g.art].form !== 'punkt') {
      h += g.pts.map(function (q, i) { return '<circle class="sk-griff" data-i="' + i + '" cx="' + q[0] + '" cy="' + q[1] + '" r="2.2" fill="rgba(255,255,255,.85)" stroke="#C62828" stroke-width=".5"/>'; }).join('');
    }
  }
  return h;
}
function skRendern() {
  var s = skAktiv();
  if (!skVoll || !s) return;
  $('sk-blatt').innerHTML = skSvg(s, true);
  skAnsichtSetzen();
  skVollLeiste();
}
// Kleines Vorschaubild eines Werkzeugs (für die Knöpfe)
function skIcon(art, daten) {
  var f = SK_ART[art] ? SK_ART[art].form : 'punkt', e = { art: art, winkel: 0, text: 'Abc' }, inhalt;
  if (daten && art === 'nato') { e.sidc = daten.sidc; e.opt = daten.opt; e.feind = daten.feind; }
  if (art === 'marsch') {
    inhalt = '<path d="M3,13 L11,6 L20,9" fill="none" stroke="' + SK_BLAU + '" stroke-width="1.1" stroke-dasharray=".1 1.8" stroke-linecap="round"/>' +
      '<path d="M1.6,11.6 L4.4,14.4 M1.6,14.4 L4.4,11.6" stroke="' + SK_BLAU + '" stroke-width=".8"/><circle cx="11" cy="6" r="1.9" fill="none" stroke="' + SK_BLAU + '" stroke-width=".7"/><circle cx="20" cy="9" r="1.9" fill="none" stroke="' + SK_BLAU + '" stroke-width=".7"/>';
  } else {
    e.pts = f === 'flaeche' ? [[2, 2.5], [21, 1.5], [22.5, 13.5], [2.5, 14]] : art === 'feuer' ? [[12, 15], [3, 2], [21, 2]] : art === 'hsr' ? [[5, 13], [20, 3]] : art === 'ziel' ? [[4, 13.5], [19, 5]]
      : f === 'linie' ? [[1.5, 12.5], [8, 5], [15, 10], [22.5, 3.5]] : [[12, art === 'nord' ? 8 : (art === 'gruppe' || art === 'trupp' || art === 'nato') ? 9.6 : SK_NATO[art] ? 8 : 9]];
    if (art === 'nord' || art === 'text') e.groesse = 6;
    inhalt = skElementSvg({ massstab: 0, zaehlung: 'teil' }, e, false);
    if (f === 'punkt' && art !== 'text') inhalt = '<g transform="translate(12,8) scale(' + (art === 'nord' ? 1.05 : (SK_NATO[art] || art === 'nato') ? 1.3 : 2.1) + ') translate(-12,-' + (art === 'nord' ? 8 : 8.5) + ')">' + inhalt + '</g>';
  }
  return '<svg class="sk-ic" viewBox="0 0 24 16" aria-hidden="true">' + inhalt + '</svg>';
}

/* ===== Ablage: gespeicherte Skizzen, neue Skizze, Wahl der Art ===== */
function skDatum(d) { return d ? d.split('-').reverse().join('.') : ''; }
function skAblageZeigen() {
  $('sk-ablage').hidden = false; $('sk-arten').hidden = true;
  if (!window.ms && SK.liste.some(function (s) { return s.elemente.some(function (e) { return skIstNato(e); }); })) ladeMilsymbol().then(skAblageZeigen, function () {});
  $('sk-anz').textContent = SK.liste.length ? '(' + SK.liste.length + ')' : '';
  $('sk-leer').hidden = SK.liste.length > 0;
  $('sk-liste').innerHTML = SK.liste.map(function (s) {
    var n = s.elemente.filter(function (e) { return e.art !== 'nord'; }).length;
    return '<div class="sk-eintrag"><button type="button" class="sk-oeffnen" data-sk-auf="' + s.id + '" aria-label="Skizze öffnen: ' + esc(s.name) + '">' +
      '<svg class="sk-mini" viewBox="0 0 ' + SK_B + ' ' + SK_H + '" aria-hidden="true" font-family="Carlito, Calibri, Arial, sans-serif">' + skSvg(s, false) + '</svg>' +
      '<span class="sk-eintrag-text"><b>' + esc(s.name) + '</b><small>' + esc(SK_ARTEN[skArt(s)].kurz) + ' · ' + (s.massstab ? '1:' + s.massstab.toLocaleString('de-DE') : 'ohne Maßstab') + '</small><small>' +
      esc(skDatum(s.datum)) + ' · ' + n + (n === 1 ? ' Element' : ' Elemente') + '</small></span></button>' +
      '<div class="sk-eintrag-knoepfe"><button type="button" class="knopf sekundaer" data-sk-name="' + s.id + '">Umbenennen</button><button type="button" class="knopf sekundaer" data-sk-weg="' + s.id + '">Löschen</button></div></div>';
  }).join('');
}
// Beim Anzeigen der Seite die Ablage aufbauen; eine offene Skizze bleibt offen (Schließen beim Verlassen übernimmt hashchange)
function zeigeSkizze() { skAblageZeigen(); }
function skArtenZeigen() {
  $('sk-ablage').hidden = true; $('sk-arten').hidden = false;
  var bild = { gelaende: skIcon('nadelwald'), stellung: skIcon('feuer'), entfernung: skIcon('marsch'), panorama: skIcon('kuppe') };
  $('sk-arten-liste').innerHTML = Object.keys(SK_ARTEN).map(function (k) {
    var a = SK_ARTEN[k];
    return '<button type="button" class="sk-art" data-sk-art="' + k + '"' + (a.bald ? ' disabled' : '') + '>' + bild[k] + '<span><b>' + esc(a.name) + (a.bald ? ' <em>folgt</em>' : '') + '</b><small>' + esc(a.text) + '</small></span></button>';
  }).join('');
  $('sk-arten').scrollIntoView({ block: 'start' });
}
$('sk-neu').addEventListener('click', skArtenZeigen);
$('sk-arten-zurueck').addEventListener('click', skAblageZeigen);
$('sk-arten-liste').addEventListener('click', function (ev) {
  var b = ev.target.closest('button[data-sk-art]');
  if (!b || b.disabled) return;
  var art = b.getAttribute('data-sk-art'), nr = SK.liste.filter(function (s) { return skArt(s) === art; }).length + 1;
  var s = skNeu(SK_ARTEN[art].kurz + ' ' + nr, art);
  SK.liste.unshift(s); skSpeichern();
  skOeffnen(s.id);
});
$('sk-liste').addEventListener('click', function (ev) {
  var auf = ev.target.closest('[data-sk-auf]'), name = ev.target.closest('[data-sk-name]'), weg = ev.target.closest('[data-sk-weg]');
  if (auf) { skOeffnen(auf.getAttribute('data-sk-auf')); return; }
  var id = (name || weg) && (name || weg).getAttribute(name ? 'data-sk-name' : 'data-sk-weg'), s = id && SK.liste.filter(function (x) { return x.id === id; })[0];
  if (!s) return;
  var nach = (name || weg).parentNode;
  if (name) inlineAbfrage(nach, { text: 'Neuer Name der Skizze', wert: s.name, ok: 'Speichern', fertig: function (n) { s.name = n; skSpeichern(); skAblageZeigen(); } });
  else inlineAbfrage(nach, { text: 'Skizze „' + s.name + '“ wirklich löschen?', ok: 'Löschen', gefahr: true, fertig: function () {
    SK.liste = SK.liste.filter(function (x) { return x.id !== s.id; });
    if (SK.aktiv === s.id) SK.aktiv = null;
    skSpeichern(); skAblageZeigen();
  } });
});

/* ===== Blatt-Fenster: Name, Maßstab, Kopfangaben, Bild speichern ===== */
function skBlattFelder() {
  var s = skAktiv();
  $('sk-b-name').value = s.name;
  document.querySelectorAll('input[name="sk-massstab"]').forEach(function (r) { r.checked = +r.value === s.massstab; });
  document.querySelectorAll('input[name="sk-zaehlung"]').forEach(function (r) { r.checked = r.value === s.zaehlung; });
  $('sk-datum').value = s.datum || '';
  $('sk-unterschrift').value = s.unterschrift || '';
  $('sk-erlaeuterung').value = s.erlaeuterung || '';
}
function skBlattAuf(an) {
  $('sk-v-blatt').hidden = !an;
  if (an) { skBlattFelder(); skFach = null; skVollLeiste(); }
}
$('sk-v-blatt-auf').addEventListener('click', function () { skBlattAuf($('sk-v-blatt').hidden); });
$('sk-v-blatt-zu').addEventListener('click', function () { skBlattAuf(false); });
$('sk-v-blatt-fertig').addEventListener('click', function () { skBlattAuf(false); });
$('sk-b-name').addEventListener('input', function () { var n = this.value.trim().slice(0, 40); if (n) { skAktiv().name = n; skSpeichern(); skVollLeiste(); } });
document.querySelectorAll('input[name="sk-massstab"]').forEach(function (r) { r.addEventListener('change', function () { skMerken(); skAktiv().massstab = +r.value; skSpeichern(); skVollKey = ''; skRendern(); }); });
document.querySelectorAll('input[name="sk-zaehlung"]').forEach(function (r) { r.addEventListener('change', function () { skAktiv().zaehlung = r.value; skSpeichern(); skRendern(); }); });
[['sk-datum', 'datum'], ['sk-unterschrift', 'unterschrift'], ['sk-erlaeuterung', 'erlaeuterung']].forEach(function (f) {
  $(f[0]).addEventListener('input', function () { skAktiv()[f[1]] = this.value; skSpeichern(); skRendern(); });
});

/* ===== Eingaben auf dem Blatt ===== */
function skPunktAus(ev) {
  var svg = $('sk-blatt'), pt = svg.createSVGPoint();
  pt.x = ev.clientX; pt.y = ev.clientY;
  var q = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [skRund(Math.max(SK_GX, Math.min(SK_GX + SK_GW, q.x))), skRund(Math.max(SK_GY, Math.min(SK_GY + SK_GH, q.y)))];
}
var skZug = null;
$('sk-blatt').addEventListener('pointerdown', function (ev) {
  if (ev.button > 0) return;
  var p = skPunktAus(ev), griff = ev.target.closest('.sk-griff'), el = ev.target.closest('.sk-el');
  skZug = { start: p, x: ev.clientX, y: ev.clientY, bewegt: false, id: ev.pointerId, treffer: !!(griff || el || ev.target.closest('.sk-name')) };
  if (skWerkzeug) return;
  var name = ev.target.closest('.sk-name');
  if (name) {
    var ne = skElement(name.getAttribute('data-sk-name'));
    if (skAuswahl !== ne.id) { skAuswahl = ne.id; skRendern(); }
    if (!ne.gesperrt) { skZug.e = ne; skZug.name = (ne.nameVersatz || [0, 0]).slice(); }
  } else if (griff && skAuswahl) { skZug.griff = +griff.getAttribute('data-i'); skZug.e = skElement(skAuswahl); }
  else if (el) {
    var id = el.getAttribute('data-sk');
    if (skAuswahl !== id) { skAuswahl = id; skRendern(); }
    var e = skElement(id);
    if (e && !e.gesperrt) { skZug.e = e; skZug.alt = JSON.parse(JSON.stringify(e.pts)); }
  }
  if (skZug.e) { skZug.vorher = JSON.stringify(skAktiv()); $('sk-blatt').setPointerCapture(ev.pointerId); ev.preventDefault(); }
});
$('sk-blatt').addEventListener('pointermove', function (ev) {
  if (!skZug || !skZug.e || ev.pointerId !== skZug.id) return;
  if (!skZug.bewegt && Math.abs(ev.clientX - skZug.x) + Math.abs(ev.clientY - skZug.y) < 6) return;
  skZug.bewegt = true;
  var p = skPunktAus(ev);
  if (skZug.name) skZug.e.nameVersatz = [skRund(skZug.name[0] + p[0] - skZug.start[0]), skRund(skZug.name[1] + p[1] - skZug.start[1])];
  else if (skZug.griff !== undefined) skZug.e.pts[skZug.griff] = p;
  else {
    var dx = p[0] - skZug.start[0], dy = p[1] - skZug.start[1];
    skZug.e.pts = skZug.alt.map(function (q) { return [skRund(q[0] + dx), skRund(q[1] + dy)]; });
  }
  if (!skZug.plan) skZug.plan = requestAnimationFrame(function () { skZug && (skZug.plan = 0); skRendern(); });
});
function skZugEnde(ev) {
  var z = skZug;
  skZug = null;
  if (!z || ev.pointerId !== z.id) return;
  if (z.e && z.bewegt) { skVerlauf.push(z.vorher); skSpeichern(); skRendern(); return; }
  if (Math.abs(ev.clientX - z.x) + Math.abs(ev.clientY - z.y) > 8) return;
  if (skWerkzeug) { skSetzen(skPunktAus(ev)); return; }
  if (!z.treffer && skAuswahl) { skAuswahl = null; skRendern(); }
}
$('sk-blatt').addEventListener('pointerup', skZugEnde);
$('sk-blatt').addEventListener('pointercancel', function () { skZug = null; });

function skSetzen(p) {
  var f = SK_ART[skWerkzeug].form;
  if (f === 'punkt') {
    var e = { id: 'e' + Date.now(), art: skWerkzeug, pts: [p], winkel: 0 };
    if (skWerkzeug === 'nato' && skNatoWahl) { e.sidc = skNatoWahl.sidc; e.opt = skNatoWahl.opt; e.titel = skNatoWahl.titel; e.feind = skNatoWahl.feind; }
    skMerken();
    skAktiv().elemente.push(e);
    if (skWerkzeug === 'text') {
      // Text: gleich auswählen und das Eingabefeld öffnen
      e.text = 'Text';
      skWerkzeug = null; skAuswahl = e.id;
      skSpeichern(); skRendern();
      var feld = $('sk-v-name');
      if (feld) { feld.value = ''; feld.placeholder = 'Text eingeben'; feld.focus(); }
      return;
    }
    skSpeichern(); skRendern();
    return;
  }
  skPunkte.push(p);
  if (SK_ART[skWerkzeug].n && skPunkte.length >= SK_ART[skWerkzeug].n) { skFertig(); return; }
  skRendern();
}
function skFertig() {
  var f = skWerkzeug && SK_ART[skWerkzeug].form;
  if (f === 'linie' || f === 'flaeche') {
    var min = SK_ART[skWerkzeug].n || (f === 'flaeche' ? 3 : 2);
    if (skPunkte.length < min) { skMeldung('Mindestens ' + min + ' Punkte setzen.', true); return; }
    skMerken();
    var e = { id: 'e' + Date.now(), art: skWerkzeug, pts: skPunkte.slice() };
    skAktiv().elemente.push(e);
    skAuswahl = e.id;
    skSpeichern();
  }
  skWerkzeug = null; skPunkte = [];
  skRendern();
}
var skMeldungUhr = 0;
function skMeldung(t, fehler) {
  if (!skVoll) return;
  $('sk-v-meldung').textContent = t; $('sk-v-meldung').hidden = !t;
  clearTimeout(skMeldungUhr);
  if (t) skMeldungUhr = setTimeout(function () { $('sk-v-meldung').hidden = true; }, 3500);
}

function skWerkzeugWaehlen(w) {
  if (skPunkte.length && skWerkzeug !== w) skPunkte = [];
  skWerkzeug = skWerkzeug === w ? null : w;
  if (!skWerkzeug) skPunkte = [];
  skAuswahl = null; skFach = null; skMeldung('');
  skRendern();
}
function skAbbrechen() { skWerkzeug = null; skPunkte = []; skRendern(); }
function skPunktZurueck() { skPunkte.pop(); skRendern(); }

// Gewähltes Element
function skLoeschen() {
  if (!skAuswahl) return;
  skMerken();
  skAktiv().elemente = skAktiv().elemente.filter(function (e) { return e.id !== skAuswahl; });
  skAuswahl = null; skSpeichern(); skRendern();
}
function skSperren() {
  var e = skAuswahl && skElement(skAuswahl);
  if (!e) return;
  skMerken(); e.gesperrt = !e.gesperrt; skSpeichern(); skRendern();
}
function skDrehen() {
  var e = skAuswahl && skElement(skAuswahl);
  if (!e) return;
  skMerken(); e.winkel = ((e.winkel || 0) + 15) % 360; skSpeichern(); skRendern();
}
function skNameAendern(wert) {
  var e = skAuswahl && skElement(skAuswahl);
  if (!e) return;
  if (e.art === 'text') e.text = wert.slice(0, 40) || 'Text';
  else if (e.art === 'marsch' && skOhneMassstab(skAktiv())) e.entf = wert.slice(0, 80);
  else e.name = wert.slice(0, 40);
  skSpeichern(); skRendern();
}
function skAuswahlEnde() { skAuswahl = null; skRendern(); }
function skRueckgaengig() {
  var alt = skVerlauf.pop();
  if (!alt) return;
  var s = JSON.parse(alt), i = SK.liste.map(function (x) { return x.id; }).indexOf(s.id);
  if (i >= 0) SK.liste[i] = s;
  if (skAuswahl && !skElement(skAuswahl)) skAuswahl = null;
  skVollKey = '';
  skSpeichern(); if (!$('sk-v-blatt').hidden) skBlattFelder(); skRendern();
}
/* ===== Vollbild ===== */
// Ausschnitt des Blatts (viewBox) passend zum Seitenverhältnis des Bildschirms
function skBuehne() { return $('sk-v-buehne').getBoundingClientRect(); }
// Einpassen zeigt Raster und Maßstäbe möglichst groß; Datum und Unterschrift rechts erreicht man durch Verschieben
// Freigehalten werden oben die Knopfleiste, im Hochformat unten das Dock und im Querformat rechts die Leiste.
function skEinpassen() {
  var r = skBuehne(), quer = r.width > r.height * 1.3, unten = $('sk-v-leiste').closest('.sk-v-unten').getBoundingClientRect();
  var oben = 64, rechts = quer ? Math.min(r.width * 0.5, unten.width + 20) : 0, frei = quer ? 8 : Math.min(r.height * 0.35, r.bottom - unten.top + 8);
  var fw = Math.max(120, r.width - rechts - 8), fh = Math.max(120, r.height - oben - frei);
  var bx = SK_GX - 10, by = 2, bw = SK_GW + 14, bh = SK_GY + SK_GH + 6 - by, u = Math.max(bw / fw, bh / fh);
  skAnsicht = { x: bx + bw / 2 - (4 + fw / 2) * u, y: by + bh / 2 - (oben + fh / 2) * u, w: u * r.width };
}
function skAnsichtSetzen() {
  if (!skAnsicht) { skVollLeiste(); skEinpassen(); }
  var r = skBuehne(), h = skAnsicht.w * r.height / Math.max(1, r.width);
  $('sk-blatt').setAttribute('viewBox', skRund(skAnsicht.x) + ' ' + skRund(skAnsicht.y) + ' ' + skRund(skAnsicht.w) + ' ' + skRund(h));
}
function skAnsichtBegrenzen() {
  var r = skBuehne(), h = skAnsicht.w * r.height / Math.max(1, r.width);
  skAnsicht.x = Math.max(-skAnsicht.w + 30, Math.min(SK_B - 30, skAnsicht.x));
  skAnsicht.y = Math.max(-h + 30, Math.min(SK_H - 30, skAnsicht.y));
}
function skOeffnen(id) {
  SK.aktiv = id; skSpeichern();
  skVerlauf = []; skAuswahl = null; skWerkzeug = null; skPunkte = []; skFach = null; skVollKey = ''; skAnsicht = null; skFinger = {}; skPinch = null;
  skVoll = true;
  $('sk-v-buehne').appendChild($('sk-blatt'));
  $('sk-voll').hidden = false; $('sk-v-blatt').hidden = true;
  document.documentElement.classList.add('sk-voll');
  skRendern();
  if (skArt(skAktiv()) === 'stellung' && !window.ms) ladeMilsymbol().then(function () { skVollKey = ''; skRendern(); }, function () { skMeldung('Die NATO-Zeichen konnten nicht geladen werden. Bitte die Verbindung prüfen.', true); });
  skMeldung('Mit zwei Fingern zoomen und verschieben. Blatt-Angaben unter ⚙.');
}
function skSchliessen() {
  skVoll = false; skWerkzeug = null; skPunkte = []; skAuswahl = null;
  $('sk-parkplatz').appendChild($('sk-blatt'));
  $('sk-voll').hidden = true;
  document.documentElement.classList.remove('sk-voll');
  skAblageZeigen();
}
// Untere Leiste: Dock, Werkzeug in Arbeit oder gewähltes Element. Nur neu bauen, wenn sich der Zustand ändert (Eingabefeld behält den Fokus).
function skVollLeiste() {
  var e = skAuswahl && skElement(skAuswahl);
  $('sk-v-titel').textContent = skAktiv().name + ' · ' + (skAktiv().massstab ? '1:' + skAktiv().massstab.toLocaleString('de-DE') : 'ohne Maßstab');
  $('sk-v-zurueck').disabled = !skVerlauf.length;
  var key = [skWerkzeug, skAuswahl, e && e.gesperrt, e && e.feind, skPunkte.length, skFach, skAktiv().massstab, !!window.ms].join('|');
  if (key === skVollKey) {
    if (e && document.activeElement !== $('sk-v-name') && $('sk-v-name')) $('sk-v-name').value = (e.art === 'text' ? e.text : e.art === 'marsch' && skOhneMassstab(skAktiv()) ? e.entf : e.name) || '';
    return;
  }
  skVollKey = key;
  var h = '', fach = '';
  if (e) {
    var art = e.art === 'nato' ? { name: e.titel || 'Taktisches Zeichen', form: 'punkt' } : SK_ART[e.art] || { name: e.art, form: 'punkt' }, info = e.gesperrt ? 'gesperrt' : 'Ziehen zum Verschieben';
    if (e.art === 'marsch') { var l = 0; for (var i = 1; i < e.pts.length; i++) l += skLaenge(e.pts[i - 1], e.pts[i]); info = skOhneMassstab(skAktiv()) ? 'Entfernungen der Reihe nach eintragen' : 'zusammen ' + skMeter(skAktiv(), l).toLocaleString('de-DE') + ' m'; }
    else if (e.art === 'ziel') info = skOhneMassstab(skAktiv()) ? 'Ohne Maßstab: Entfernung mit in den Namen schreiben' : 'Entfernung ' + skMeter(skAktiv(), skLaenge(e.pts[0], e.pts[1])).toLocaleString('de-DE') + ' m';
    else if (skIstNato(e) || e.art === 'beob') info = (e.feind ? 'Feind' : 'Eigene Kräfte') + (e.gesperrt ? ' · gesperrt' : ' · Ziehen zum Verschieben');
    else if (art.form !== 'punkt' && !e.gesperrt) info = 'Ziehen verschiebt, Griffe verschieben Punkte';
    h = '<div class="sk-v-kopf">' + skIcon(e.art, e) + '<div><b>' + esc(art.name) + '</b><small>' + info + '</small></div><button type="button" class="sk-v-x" data-v="auswahlfertig" aria-label="Auswahl schließen">✕</button></div>' +
      (e.gesperrt ? '' : '<input type="text" class="sk-v-name" id="sk-v-name" maxlength="40" autocomplete="off" enterkeyhint="done" placeholder="' + (e.art === 'marsch' && skOhneMassstab(skAktiv()) ? 'Entfernungen in m, z. B. 800, 400, 1600' : e.art === 'text' ? 'Text eingeben' : 'Name, z. B. ' + ({ ort: 'Schlierhof', nadelwald: 'Südwald', laubwald: 'Nordwald', mischwald: 'Kreuzwald', kuppe: 'Kahler Berg', fluss: 'Aue', ziel: skOhneMassstab(skAktiv()) ? 'Spitzbaum 600' : 'Spitzbaum', schuetze: 'Schütze 1', mg: 'MG 1', gruppe: '1./371' }[e.art] || 'Spitzbaum')) + '" value="' + esc((e.art === 'text' ? (e.text === 'Text' ? '' : e.text) : e.art === 'marsch' && skOhneMassstab(skAktiv()) ? e.entf : e.name) || '') + '">') +
      '<div class="sk-v-knoepfe">' + (art.form === 'punkt' && !e.gesperrt && !skIstNato(e) && e.art !== 'beob' ? '<button type="button" class="sk-v-knopf" data-v="drehen">↻ Drehen</button>' : '') +
      ((skIstNato(e) || e.art === 'beob') && !e.gesperrt ? '<button type="button" class="sk-v-knopf" data-v="feind">' + (e.feind ? 'Eigene' : 'Feind') + '</button>' : '') +
      '<button type="button" class="sk-v-knopf" data-v="sperren">' + (e.gesperrt ? 'Entsperren' : 'Sperren') + '</button>' +
      (e.gesperrt ? '' : '<button type="button" class="sk-v-knopf gefahr" data-v="loeschen">Löschen</button>') +
      '<button type="button" class="sk-v-knopf primaer" data-v="auswahlfertig">Fertig</button></div>';
  } else if (skWerkzeug) {
    var f = SK_ART[skWerkzeug].form, hinweis = skWerkzeug === 'text' ? 'Auf das Blatt tippen, dann Text eingeben' : f === 'punkt' ? 'Auf das Blatt tippen, mehrmals möglich'
      : ({ hsr: 'Stellung, dann die Richtung antippen', feuer: 'Stellung, dann linke und rechte Grenze antippen', ziel: 'Stellung, dann das Ziel antippen' }[skWerkzeug] ||
        (skWerkzeug === 'marsch' ? 'Start, dann die Wegpunkte antippen' : f === 'flaeche' ? 'Umriss Punkt für Punkt antippen' : 'Punkte nacheinander antippen')) + (skPunkte.length ? ' · ' + skPunkte.length + ' gesetzt' : '');
    h = '<div class="sk-v-kopf">' + skIcon(skWerkzeug, skWerkzeug === 'nato' ? skNatoWahl : null) + '<div><b>' + esc(skWerkzeug === 'nato' && skNatoWahl ? skNatoWahl.titel : SK_ART[skWerkzeug].name) + '</b><small>' + hinweis + '</small></div><button type="button" class="sk-v-x" data-v="abbrechen" aria-label="Werkzeug beenden">✕</button></div>' +
      '<div class="sk-v-knoepfe">' + (f === 'punkt' ? '' : '<button type="button" class="sk-v-knopf" data-v="punktzurueck"' + (skPunkte.length ? '' : ' disabled') + '>↶ Punkt zurück</button>') +
      '<button type="button" class="sk-v-knopf primaer" data-v="fertig">✓ Fertig</button></div>';
  } else {
    var dock = SK_ARTEN[skArt(skAktiv())].dock;
    h = '<div class="sk-v-dock" style="grid-template-columns:repeat(' + dock.length + ',1fr)">' + dock.map(function (d) {
      return d[2] === 'wz' ? '<button type="button" class="sk-v-wahl" data-v-wz="' + d[1] + '">' + skIcon(d[1]) + esc(d[0]) + '</button>'
        : '<button type="button" class="sk-v-wahl" data-v-fach="' + d[0] + '" aria-pressed="' + (skFach === d[0]) + '">' + skIcon(d[1]) + esc(d[0]) + '</button>';
    }).join('') + '</div>';
    if (skFach) {
      var dk = dock.filter(function (d) { return d[0] === skFach; })[0], g = SK_WERKZEUGE.filter(function (x) { return x[0] === skFach; })[0];
      var liste = dk && dk[3] ? dk[3].map(function (k) { return [k, SK_ART[k].name]; }) : g ? g[1] : [];
      if (skFach === '+Zeichen') {
        fach = '<button type="button" class="sk-v-wahl" data-v-fach="Stellung"><span class="sk-v-plus-zeichen">‹</span>Zurück</button>' + FAV.zeichen.map(function (z) {
          var bild = '';
          try { bild = window.ms ? '<span class="sk-v-bild">' + msSymbolAus(z, 18).asSVG() + '</span>' : ''; } catch (x) { bild = ''; }
          return '<button type="button" class="sk-v-wahl" data-v-fav="' + esc(z.id) + '">' + bild + esc(msFavName(z)) + '</button>';
        }).join('') + '<button type="button" class="sk-v-wahl sk-v-plus" data-v="baukasten"><span class="sk-v-plus-zeichen">+</span>Neues Zeichen im Baukasten</button>' +
          (FAV.zeichen.length ? '' : '<p class="sk-v-fach-hinweis">Unter „Meine Zeichen“ gespeicherte Zeichen erscheinen hier.</p>');
      } else fach = liste.filter(function (w) { return w[0] !== 'marsch'; }).map(function (w) { return '<button type="button" class="sk-v-wahl" data-v-wz="' + w[0] + '">' + skIcon(w[0]) + esc(w[1]) + '</button>'; }).join('') +
        (skFach === 'Stellung' ? '<button type="button" class="sk-v-wahl sk-v-plus" data-v-fach="+Zeichen"><span class="sk-v-plus-zeichen">+</span>Weitere Zeichen</button>' : '');
    }
  }
  $('sk-v-leiste').innerHTML = h;
  $('sk-v-fach').innerHTML = fach;
  $('sk-v-fach').hidden = !fach;
}
$('sk-voll').addEventListener('click', function (ev) {
  var b = ev.target.closest('button');
  if (!b) return;
  if (b.hasAttribute('data-v-fach')) { var f = b.getAttribute('data-v-fach'); skFach = skFach === f && !b.closest('#sk-v-fach') ? null : f; skVollLeiste(); return; }
  if (b.hasAttribute('data-v-wz')) { skWerkzeugWaehlen(b.getAttribute('data-v-wz')); return; }
  if (b.hasAttribute('data-v-fav')) {
    var z = msFavHolen(b.getAttribute('data-v-fav'));
    if (!z) return;
    skNatoWahl = { sidc: z.sidc, opt: z.opt, titel: msFavName(z), feind: z.sidc.charAt(3) === '6' };
    skWerkzeug = null; skWerkzeugWaehlen('nato');
    return;
  }
  var v = b.getAttribute('data-v');
  if (v === 'abbrechen') skAbbrechen();
  else if (v === 'fertig') skFertig();
  else if (v === 'punktzurueck') skPunktZurueck();
  else if (v === 'drehen') skDrehen();
  else if (v === 'sperren') skSperren();
  else if (v === 'baukasten') { skBaukastenFuer = SK.aktiv; skSchliessen(); go('symbole'); $('ms-in-skizze').hidden = false; $('ms-vorschau').scrollIntoView({ block: 'center' }); }
  else if (v === 'feind') { var fe = skAuswahl && skElement(skAuswahl); if (fe) { skMerken(); fe.feind = !fe.feind; skSpeichern(); skRendern(); } }
  else if (v === 'loeschen') skLoeschen();
  else if (v === 'auswahlfertig') skAuswahlEnde();
});
$('sk-v-leiste').addEventListener('input', function (ev) { if (ev.target.id === 'sk-v-name') skNameAendern(ev.target.value); });
$('sk-v-leiste').addEventListener('focusin', function (ev) { if (ev.target.id === 'sk-v-name' && skAuswahl) skMerken(); });
$('sk-v-leiste').addEventListener('keydown', function (ev) { if (ev.target.id === 'sk-v-name' && ev.key === 'Enter') { ev.target.blur(); skAuswahlEnde(); } });
$('sk-v-zu').addEventListener('click', skSchliessen);
$('sk-v-zurueck').addEventListener('click', skRueckgaengig);
$('sk-v-einpassen').addEventListener('click', function () { skEinpassen(); skAnsichtSetzen(); });
document.addEventListener('keydown', function (e) { if (skVoll && e.key === 'Escape') { if (!$('sk-v-blatt').hidden) skBlattAuf(false); else skSchliessen(); } });
window.addEventListener('resize', function () { if (skVoll) { skAnsichtBegrenzen(); skAnsichtSetzen(); } });
window.addEventListener('hashchange', function () { if (skVoll && location.hash !== '#skizze') skSchliessen(); });

// Zwei Finger: zoomen und verschieben. Ein Finger auf freiem Papier verschiebt ebenfalls (auch mit Werkzeug, ein kurzes Tippen setzt dann den Punkt).
function skFingerMitte() {
  var f = Object.keys(skFinger).map(function (k) { return skFinger[k]; }).slice(0, 2);
  return { x: (f[0].x + f[1].x) / 2, y: (f[0].y + f[1].y) / 2, d: Math.max(1, Math.sqrt(Math.pow(f[0].x - f[1].x, 2) + Math.pow(f[0].y - f[1].y, 2))) };
}
$('sk-blatt').addEventListener('pointerdown', function (ev) {
  if (!skVoll) return;
  skFinger[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
  try { $('sk-blatt').setPointerCapture(ev.pointerId); } catch (e) { /* ohne Erfassung geht es auch */ }
  if (Object.keys(skFinger).length === 2) {
    // Begonnenes Ziehen eines Elements zurücknehmen, jetzt wird gezoomt
    if (skZug && skZug.e && skZug.bewegt && skZug.vorher) { var alt = JSON.parse(skZug.vorher), i = SK.liste.map(function (x) { return x.id; }).indexOf(alt.id); if (i >= 0) SK.liste[i] = alt; }
    skZug = null;
    var m = skFingerMitte(), r = skBuehne(), u = skAnsicht.w / r.width;
    skPinch = { d0: m.d, w0: skAnsicht.w, px: skAnsicht.x + (m.x - r.left) * u, py: skAnsicht.y + (m.y - r.top) * u };
    return;
  }
  if (skZug && !skZug.e) skZug.pan = { x: skAnsicht.x, y: skAnsicht.y, u: skAnsicht.w / skBuehne().width };
});
$('sk-blatt').addEventListener('pointermove', function (ev) {
  if (!skVoll || !skFinger[ev.pointerId]) return;
  skFinger[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
  var r = skBuehne();
  if (skPinch && Object.keys(skFinger).length >= 2) {
    var m = skFingerMitte(), w = Math.max(28, Math.min(SK_B * 2, skPinch.w0 * skPinch.d0 / m.d)), u = w / r.width;
    skAnsicht = { x: skPinch.px - (m.x - r.left) * u, y: skPinch.py - (m.y - r.top) * u, w: w };
    skAnsichtBegrenzen(); skAnsichtSetzen();
    return;
  }
  if (skZug && skZug.pan && ev.pointerId === skZug.id) {
    var dx = ev.clientX - skZug.x, dy = ev.clientY - skZug.y;
    if (!skZug.bewegt && Math.abs(dx) + Math.abs(dy) < 8) return;
    skZug.bewegt = true;
    skAnsicht.x = skZug.pan.x - dx * skZug.pan.u; skAnsicht.y = skZug.pan.y - dy * skZug.pan.u;
    skAnsichtBegrenzen(); skAnsichtSetzen();
  }
});
function skFingerWeg(ev) {
  if (!skVoll) return;
  delete skFinger[ev.pointerId];
  if (skPinch && Object.keys(skFinger).length < 2) { skPinch = null; skZug = null; }
}
$('sk-blatt').addEventListener('pointerup', skFingerWeg);
$('sk-blatt').addEventListener('pointercancel', skFingerWeg);

/* ===== Export als Bild ===== */
$('sk-png').addEventListener('click', function () {
  var s = skAktiv(), px = 12;
  var quelle = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + SK_B + ' ' + SK_H + '" width="' + SK_B * px + '" height="' + SK_H * px + '" font-family="Carlito, Calibri, Arial, sans-serif">' + skSvg(s, false) + '</svg>';
  var img = new Image();
  img.onload = function () {
    var c = document.createElement('canvas');
    c.width = SK_B * px; c.height = SK_H * px;
    c.getContext('2d').drawImage(img, 0, 0);
    var name = 'skizze-' + (s.name.toLowerCase().replace(/[äöüß]/g, function (x) { return { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[x]; }).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meldeblatt') + '.png';
    c.toBlob(function (b) { if (b) msLaden(b, name); }, 'image/png');
  };
  img.onerror = function () { skMeldung('Das Bild konnte nicht erzeugt werden.', true); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(quelle);
});
if (window.claude && typeof window.claude.use === 'function') {
  $('sk-png').hidden = true;
  $('sk-download-hinweis').hidden = false;
}

// Wurde die Seite direkt mit #skizze geöffnet, ist sie schon sichtbar, bevor dieses Skript geladen ist
if (aktuelleAnsicht === 'skizze') zeigeSkizze();

// Aus dem Baukasten: zusammengestelltes Zeichen in die Skizze einfügen, aus der „Neues Zeichen im Baukasten“ gewählt wurde
$('ms-in-skizze').addEventListener('click', function () {
  var s = SK.liste.filter(function (x) { return x.id === skBaukastenFuer; })[0];
  $('ms-in-skizze').hidden = true;
  if (!s || !msGeladen) { skBaukastenFuer = null; go('skizze'); return; }
  var a = msAuswahl(), e = { id: 'e' + Date.now(), art: 'nato', sidc: a.sidc, opt: a.opt, titel: a.name, feind: a.sidc.charAt(3) === '6', pts: [[SK_GX + SK_GW / 2, SK_GY + SK_GH / 2]], winkel: 0 };
  s.elemente.push(e); skSpeichern();
  skBaukastenFuer = null;
  go('skizze'); skOeffnen(s.id);
  skAuswahl = e.id; skRendern();
  skMeldung('Zeichen in die Mitte gesetzt. Zum Verschieben ziehen.');
});
