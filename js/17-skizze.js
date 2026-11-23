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
    ['kuppe', 'Kuppe', 'punkt'], ['tp', 'Trig. Punkt', 'punkt'], ['text', 'Text', 'punkt'], ['nord', 'Nordpfeil', 'punkt']]]
];
var SK_ART = {};
SK_WERKZEUGE.forEach(function (g) { g[1].forEach(function (w) { SK_ART[w[0]] = { name: w[1], form: w[2] }; }); });

/* ===== Speicher ===== */
var SK_KEY = 'meinkamerad-skizzen';
function skNeu(name) {
  var heute = new Date();
  return { id: 's' + Date.now(), name: name, massstab: 25000, zaehlung: 'teil', datum: heute.toISOString().slice(0, 10), unterschrift: '', erlaeuterung: '',
    elemente: [{ id: 'e' + Date.now(), art: 'nord', pts: [[SK_GX + 148, SK_GY + 18]], winkel: 0 }] };
}
function skLaden() {
  var d = null;
  try { d = JSON.parse(localStorage.getItem(SK_KEY) || 'null'); } catch (e) { d = null; }
  if (!d || !Array.isArray(d.liste) || !d.liste.length) d = { aktiv: null, liste: [skNeu('Skizze 1')] };
  if (!d.liste.some(function (s) { return s.id === d.aktiv; })) d.aktiv = d.liste[0].id;
  return d;
}
var SK = skLaden();
function skSpeichern() { try { localStorage.setItem(SK_KEY, JSON.stringify(SK)); } catch (e) { /* Speichern nicht möglich, die Skizze gilt bis zum Neuladen */ } }
function skAktiv() { return SK.liste.filter(function (s) { return s.id === SK.aktiv; })[0]; }

/* ===== Zustand der Bedienung ===== */
var skVoll = false, skAnsicht = null, skFach = null, skVollKey = '', skFinger = {}, skPinch = null, skWerkzeug = null, skPunkte = [], skAuswahl = null, skVerlauf = [], skZoom = 1;
function skMerken() { skVerlauf.push(JSON.stringify(skAktiv())); if (skVerlauf.length > 40) skVerlauf.shift(); $('sk-zurueck').disabled = false; }
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
  } else if (a === 'ort') h = '<path d="' + skPfad(p, true) + '" fill="url(#sk-schraffur)" stroke="' + SK_TINTE + '" stroke-width=".7" stroke-linejoin="round"/>' + tr(skPfad(p, true), true);
  else if (a === 'nadelwald' || a === 'laubwald' || a === 'mischwald') {
    h = '<path d="' + skPfad(p, true) + '" fill="rgba(120,175,90,0.20)" stroke="none"/><path d="' + skPfad(p, true) + '" fill="url(#sk-' + { nadelwald: 'nadel', laubwald: 'laub', mischwald: 'misch' }[a] + ')" stroke="' + SK_TINTE + '" stroke-width=".25" stroke-dasharray="1 1"/>' + tr(skPfad(p, true), true);
  } else {
    var x = p[0][0], y = p[0][1], dreh = e.winkel ? ' rotate(' + e.winkel + ')' : '';
    if (a === 'kirche') t = '<circle cx="0" cy="0" r="1.5" fill="none" stroke="' + SK_TINTE + '" stroke-width=".5"/><path d="M0,-1.5 V-5 M-1.3,-3.6 H1.3" stroke="' + SK_TINTE + '" stroke-width=".5"/>';
    else if (a === 'gebaeude') t = '<rect x="-1.6" y="-1.2" width="3.2" height="2.4" fill="' + SK_TINTE + '"/>';
    else if (a === 'bruecke') t = '<path d="M-2.4,-3.2 Q-1,0 -2.4,3.2 M2.4,-3.2 Q1,0 2.4,3.2 M-2.4,-3.2 L-3.4,-4 M-2.4,3.2 L-3.4,4 M2.4,-3.2 L3.4,-4 M2.4,3.2 L3.4,4" fill="none" stroke="' + SK_TINTE + '" stroke-width=".55" stroke-linecap="round"/>';
    else if (a === 'nadelbaum') t = skNadel(0, 0);
    else if (a === 'laubbaum') t = skLaub(0, 0);
    else if (a === 'baum') t = '<circle cx="0" cy="-2.4" r="1.7" fill="none" stroke="' + SK_TINTE + '" stroke-width=".5"/><path d="M0,-0.7 V1.6" stroke="' + SK_TINTE + '" stroke-width=".5"/>';
    else if (a === 'kuppe') t = '<path d="M-4.5,0.6 C-4.6,-2.2 -1.4,-3.3 1.2,-2.8 C3.8,-2.3 5,-0.6 4.4,1 C3.8,2.6 0.8,3 -1.6,2.7 C-3.6,2.4 -4.4,1.8 -4.5,0.6 Z" fill="none" stroke="' + SK_TINTE + '" stroke-width=".5"/><path d="M-2.4,0.4 C-2.4,-1 -0.6,-1.4 0.8,-1.1 C2.2,-0.8 2.6,0.2 2,0.8 C1.2,1.5 -2.3,1.6 -2.4,0.4 Z" fill="none" stroke="' + SK_TINTE + '" stroke-width=".4"/>';
    else if (a === 'tp') t = '<path d="M0,-2.4 L2.2,1.4 L-2.2,1.4 Z" fill="none" stroke="' + SK_TINTE + '" stroke-width=".5"/><circle cx="0" cy="0.2" r=".45" fill="' + SK_TINTE + '"/>';
    else if (a === 'text') t = '<text x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-size="' + (e.groesse || 3.6) + '" fill="' + SK_BLAU + '" paint-order="stroke" stroke="#F4F0E6" stroke-width=".8">' + esc(e.text || 'Text') + '</text>';
    else if (a === 'nord') t = '<path d="M0,6 V-6 M-1.6,-3.6 L0,-6.4 L1.6,-3.6" fill="none" stroke="' + SK_TINTE + '" stroke-width=".6" stroke-linecap="round" stroke-linejoin="round"/><text x="2.6" y="1.6" font-size="4" font-weight="600" fill="' + SK_TINTE + '">N</text>';
    var gr = a === 'text' ? Math.max(4, String(e.text || 'Text').length * (e.groesse || 3.6) * 0.32) : (a === 'nord' ? 5 : 4.5);
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
  if (!e.name || e.art === 'text' || !e.pts || !e.pts.length) return '';
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
  $('sk-blatt').innerHTML = skSvg(s, true);
  if (skVoll) skAnsichtSetzen();
  else { $('sk-blatt').setAttribute('viewBox', '0 0 ' + SK_B + ' ' + SK_H); $('sk-blatt').style.width = (skZoom * 100) + '%'; }
  $('sk-zurueck').disabled = !skVerlauf.length;
  skAuswahlZeigen();
  if (skVoll) skVollLeiste();
}
// Kleines Vorschaubild eines Werkzeugs (für die Knöpfe)
function skIcon(art) {
  var f = SK_ART[art] ? SK_ART[art].form : 'punkt', e = { art: art, winkel: 0, text: 'Abc' }, inhalt;
  if (art === 'marsch') {
    inhalt = '<path d="M3,13 L11,6 L20,9" fill="none" stroke="' + SK_BLAU + '" stroke-width="1.1" stroke-dasharray=".1 1.8" stroke-linecap="round"/>' +
      '<path d="M1.6,11.6 L4.4,14.4 M1.6,14.4 L4.4,11.6" stroke="' + SK_BLAU + '" stroke-width=".8"/><circle cx="11" cy="6" r="1.9" fill="none" stroke="' + SK_BLAU + '" stroke-width=".7"/><circle cx="20" cy="9" r="1.9" fill="none" stroke="' + SK_BLAU + '" stroke-width=".7"/>';
  } else {
    e.pts = f === 'flaeche' ? [[2, 2.5], [21, 1.5], [22.5, 13.5], [2.5, 14]] : f === 'linie' ? [[1.5, 12.5], [8, 5], [15, 10], [22.5, 3.5]] : [[art === 'text' ? 12 : 12, art === 'nord' ? 8 : 9]];
    if (art === 'nord' || art === 'text') e.groesse = 6;
    inhalt = skElementSvg({ massstab: 25000, zaehlung: 'teil' }, e, false);
    if (f === 'punkt' && art !== 'text') inhalt = '<g transform="translate(12,8) scale(' + (art === 'nord' ? 1.05 : 2.1) + ') translate(-12,-' + (art === 'nord' ? 8 : 8.5) + ')">' + inhalt + '</g>';
  }
  return '<svg class="sk-ic" viewBox="0 0 24 16" aria-hidden="true">' + inhalt + '</svg>';
}

/* ===== Bedienfelder ===== */
function skFelderZeigen() {
  var s = skAktiv();
  $('sk-wahl').innerHTML = SK.liste.map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('');
  $('sk-wahl').value = s.id;
  document.querySelectorAll('input[name="sk-massstab"]').forEach(function (r) { r.checked = +r.value === s.massstab; });
  document.querySelectorAll('input[name="sk-zaehlung"]').forEach(function (r) { r.checked = r.value === s.zaehlung; });
  $('sk-datum').value = s.datum || '';
  $('sk-unterschrift').value = s.unterschrift || '';
  $('sk-erlaeuterung').value = s.erlaeuterung || '';
  $('sk-karte-weg').disabled = SK.liste.length < 2;
}
function skWerkzeugeZeigen() {
  $('sk-werkzeuge').innerHTML = SK_WERKZEUGE.map(function (g) {
    return '<div class="sk-gruppe"><span class="label">' + g[0] + '</span><div class="sk-knoepfe">' + g[1].map(function (w) {
      return '<button type="button" class="sk-wz" data-sk-wz="' + w[0] + '" aria-pressed="' + (skWerkzeug === w[0]) + '">' + skIcon(w[0]) + w[1] + '</button>';
    }).join('') + '</div></div>';
  }).join('');
}
function skLeisteZeigen() {
  var f = skWerkzeug && SK_ART[skWerkzeug].form;
  $('sk-leiste').hidden = !skWerkzeug;
  if (!skWerkzeug) return;
  var n = SK_ART[skWerkzeug].name;
  $('sk-leiste-text').textContent = skWerkzeug === 'text' ? 'Text: auf das Raster tippen, dann den Text eingeben.' : f === 'punkt' ? n + ': auf das Raster tippen, um es zu setzen. Mehrere nacheinander sind möglich.'
    : n + ': Punkte nacheinander auf das Raster tippen' + (f === 'flaeche' ? ' (Umriss, mindestens drei)' : '') + ', dann „Fertig“.' + (skPunkte.length ? ' Gesetzt: ' + skPunkte.length + '.' : '');
  $('sk-leiste-zurueck').hidden = f === 'punkt';
  $('sk-leiste-zurueck').disabled = !skPunkte.length;
}
function skAuswahlZeigen() {
  var e = skAuswahl && skElement(skAuswahl);
  $('sk-auswahl').hidden = !e;
  if (!e) return;
  var art = SK_ART[e.art] || { name: e.art, form: 'punkt' }, s = skAktiv(), info = '';
  if (e.art === 'marsch') {
    var l = 0;
    for (var i = 1; i < e.pts.length; i++) l += skLaenge(e.pts[i - 1], e.pts[i]);
    info = ' · ' + (e.pts.length - 1) + ' Teilstrecken' + (skOhneMassstab(s) ? ', ohne Maßstab: Entfernungen von Hand eintragen' : ', zusammen ' + skMeter(s, l).toLocaleString('de-DE') + ' m');
  }
  $('sk-auswahl-text').textContent = art.name + info + (e.gesperrt ? ' · gesperrt' : '');
  $('sk-auswahl-sperren').textContent = e.gesperrt ? 'Entsperren' : 'Sperren';
  $('sk-auswahl-drehen').hidden = art.form !== 'punkt' || e.gesperrt;
  $('sk-auswahl-text-wrap').hidden = !!e.gesperrt;
  $('sk-auswahl-eingabe').placeholder = e.art === 'text' ? 'Text' : 'Name, z. B. ' + ({ ort: 'Schlierhof', nadelwald: 'Südwald', laubwald: 'Nordwald', mischwald: 'Kreuzwald', kuppe: 'Kahler Berg', fluss: 'Aue', strasse: 'nach Oststadt' }[e.art] || 'Spitzbaum');
  var hand = e.art === 'marsch' && skOhneMassstab(s);
  $('sk-auswahl-name-label').textContent = e.art === 'text' ? 'Text' : hand ? 'Entfernungen je Wegpunkt in m' : 'Name (Beschriftung)';
  if (hand) $('sk-auswahl-eingabe').placeholder = 'z. B. 800, 400, 1600';
  if (document.activeElement !== $('sk-auswahl-eingabe')) $('sk-auswahl-eingabe').value = (e.art === 'text' ? e.text : hand ? e.entf : e.name) || '';
  $('sk-auswahl-weg').disabled = !!e.gesperrt;
}
function skAllesZeigen() { skFelderZeigen(); skWerkzeugeZeigen(); skLeisteZeigen(); skRendern(); }
function zeigeSkizze() { skAllesZeigen(); }

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
  if (z.e && z.bewegt) { skVerlauf.push(z.vorher); $('sk-zurueck').disabled = false; skSpeichern(); skRendern(); return; }
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
    skMerken();
    skAktiv().elemente.push(e);
    if (skWerkzeug === 'text') {
      // Text: gleich auswählen und das Eingabefeld öffnen
      e.text = 'Text';
      skWerkzeug = null; skAuswahl = e.id;
      skSpeichern(); skWerkzeugeZeigen(); skLeisteZeigen(); skRendern();
      var feld = skVoll ? $('sk-v-name') : $('sk-auswahl-eingabe');
      if (feld) { feld.value = ''; feld.placeholder = 'Text eingeben'; feld.focus(); }
      return;
    }
    skSpeichern(); skRendern();
    return;
  }
  skPunkte.push(p);
  skLeisteZeigen(); skRendern();
}
function skFertig() {
  var f = skWerkzeug && SK_ART[skWerkzeug].form;
  if (f === 'linie' || f === 'flaeche') {
    var min = f === 'flaeche' ? 3 : 2;
    if (skPunkte.length < min) { skMeldung('Mindestens ' + min + ' Punkte setzen.', true); return; }
    skMerken();
    var e = { id: 'e' + Date.now(), art: skWerkzeug, pts: skPunkte.slice() };
    skAktiv().elemente.push(e);
    skAuswahl = e.id;
    skSpeichern();
  }
  skWerkzeug = null; skPunkte = [];
  skWerkzeugeZeigen(); skLeisteZeigen(); skRendern();
}
var skMeldungUhr = 0;
function skMeldung(t, fehler) {
  $('sk-meldung').className = 'u-meldung' + (fehler ? ' fehler' : ''); $('sk-meldung').textContent = t;
  if (!skVoll) return;
  $('sk-v-meldung').textContent = t; $('sk-v-meldung').hidden = !t;
  clearTimeout(skMeldungUhr);
  if (t) skMeldungUhr = setTimeout(function () { $('sk-v-meldung').hidden = true; }, 3500);
}

$('sk-werkzeuge').addEventListener('click', function (ev) {
  var b = ev.target.closest('button[data-sk-wz]');
  if (!b) return;
  skWerkzeugWaehlen(b.getAttribute('data-sk-wz'));
  if (skWerkzeug) $('sk-blatt').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});
function skWerkzeugWaehlen(w) {
  if (skPunkte.length && skWerkzeug !== w) skPunkte = [];
  skWerkzeug = skWerkzeug === w ? null : w;
  if (!skWerkzeug) skPunkte = [];
  skAuswahl = null; skFach = null; skMeldung('');
  skWerkzeugeZeigen(); skLeisteZeigen(); skRendern();
}
function skAbbrechen() { skWerkzeug = null; skPunkte = []; skWerkzeugeZeigen(); skLeisteZeigen(); skRendern(); }
function skPunktZurueck() { skPunkte.pop(); skLeisteZeigen(); skRendern(); }
$('sk-leiste-fertig').addEventListener('click', skFertig);
$('sk-leiste-zurueck').addEventListener('click', skPunktZurueck);
$('sk-leiste-abbrechen').addEventListener('click', skAbbrechen);

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
  skSpeichern(); skFelderZeigen(); skRendern();
}
$('sk-auswahl-weg').addEventListener('click', skLoeschen);
$('sk-auswahl-sperren').addEventListener('click', skSperren);
$('sk-auswahl-drehen').addEventListener('click', skDrehen);
$('sk-auswahl-eingabe').addEventListener('input', function () { skNameAendern(this.value); });
// Vor dem Ändern des Namens den Stand merken, damit Rückgängig den alten Namen zurückholt
$('sk-auswahl-eingabe').addEventListener('focus', function () { if (skAuswahl) skMerken(); });
$('sk-auswahl-fertig').addEventListener('click', skAuswahlEnde);
$('sk-zurueck').addEventListener('click', skRueckgaengig);
$('sk-zoom-plus').addEventListener('click', function () { skZoom = Math.min(4, skZoom + 0.5); skRendern(); });
$('sk-zoom-minus').addEventListener('click', function () { skZoom = Math.max(1, skZoom - 0.5); skRendern(); });

// Blatt: Auswahl, Maßstab, Kopfangaben
$('sk-wahl').addEventListener('change', function () { SK.aktiv = this.value; skVerlauf = []; $('sk-zurueck').disabled = true; skAuswahl = null; skPunkte = []; skSpeichern(); skAllesZeigen(); });
$('sk-karte-neu').addEventListener('click', function () {
  var s = skNeu('Skizze ' + (SK.liste.length + 1));
  SK.liste.push(s); SK.aktiv = s.id; skVerlauf = []; $('sk-zurueck').disabled = true; skAuswahl = null; skSpeichern(); skAllesZeigen();
});
$('sk-karte-name').addEventListener('click', function () {
  var s = skAktiv(), n = window.prompt('Name der Skizze', s.name);
  if (n && n.trim()) { s.name = n.trim().slice(0, 40); skSpeichern(); skFelderZeigen(); }
});
$('sk-karte-weg').addEventListener('click', function () {
  if (SK.liste.length < 2) return;
  var s = skAktiv();
  if (!window.confirm('Skizze „' + s.name + '“ löschen?')) return;
  SK.liste = SK.liste.filter(function (x) { return x.id !== s.id; });
  SK.aktiv = SK.liste[0].id; skVerlauf = []; $('sk-zurueck').disabled = true; skAuswahl = null; skSpeichern(); skAllesZeigen();
});
document.querySelectorAll('input[name="sk-massstab"]').forEach(function (r) { r.addEventListener('change', function () { skMerken(); skAktiv().massstab = +r.value; skSpeichern(); skRendern(); }); });
document.querySelectorAll('input[name="sk-zaehlung"]').forEach(function (r) { r.addEventListener('change', function () { skAktiv().zaehlung = r.value; skSpeichern(); skRendern(); }); });
[['sk-datum', 'datum'], ['sk-unterschrift', 'unterschrift'], ['sk-erlaeuterung', 'erlaeuterung']].forEach(function (f) {
  $(f[0]).addEventListener('input', function () { skAktiv()[f[1]] = this.value; skSpeichern(); skRendern(); });
});

/* ===== Vollbild ===== */
// Ausschnitt des Blatts (viewBox) passend zum Seitenverhältnis des Bildschirms
function skBuehne() { return $('sk-v-buehne').getBoundingClientRect(); }
// Einpassen zeigt Raster und Maßstäbe möglichst groß; Datum und Unterschrift rechts erreicht man durch Verschieben
function skEinpassen() {
  var r = skBuehne(), a = r.height / Math.max(1, r.width), bx = SK_GX - 10, by = 2, bw = SK_GW + 14, bh = SK_GY + SK_GH + 6 - by;
  var w = Math.max(bw, bh / a);
  skAnsicht = { x: bx + bw / 2 - w / 2, y: by + bh / 2 - w * a / 2, w: w };
}
function skAnsichtSetzen() {
  if (!skAnsicht) skEinpassen();
  var r = skBuehne(), h = skAnsicht.w * r.height / Math.max(1, r.width);
  $('sk-blatt').setAttribute('viewBox', skRund(skAnsicht.x) + ' ' + skRund(skAnsicht.y) + ' ' + skRund(skAnsicht.w) + ' ' + skRund(h));
}
function skAnsichtBegrenzen() {
  var r = skBuehne(), h = skAnsicht.w * r.height / Math.max(1, r.width);
  skAnsicht.x = Math.max(-skAnsicht.w + 30, Math.min(SK_B - 30, skAnsicht.x));
  skAnsicht.y = Math.max(-h + 30, Math.min(SK_H - 30, skAnsicht.y));
}
function skVollbild(an) {
  skVoll = an;
  var svg = $('sk-blatt');
  if (an) $('sk-v-buehne').appendChild(svg); else document.querySelector('#sk-arbeit .sk-buehne').appendChild(svg);
  $('sk-voll').hidden = !an;
  document.documentElement.classList.toggle('sk-voll', an);
  skFach = null; skVollKey = ''; skAnsicht = null; skZoom = 1; skFinger = {}; skPinch = null;
  skRendern();
  if (an) skMeldung('Mit zwei Fingern zoomen und verschieben.');
  else { skWerkzeugeZeigen(); skLeisteZeigen(); $('sk-arbeit').scrollIntoView({ block: 'start' }); }
}
// Untere Leiste: Dock, Werkzeug in Arbeit oder gewähltes Element. Nur neu bauen, wenn sich der Zustand ändert (Eingabefeld behält den Fokus).
var SK_DOCK = [['Linien', 'strasse'], ['Flächen', 'nadelwald'], ['Zeichen', 'kirche']];
function skVollLeiste() {
  var e = skAuswahl && skElement(skAuswahl);
  $('sk-v-titel').textContent = skAktiv().name + ' · ' + (skAktiv().massstab ? '1:' + skAktiv().massstab.toLocaleString('de-DE') : 'ohne Maßstab');
  $('sk-v-zurueck').disabled = !skVerlauf.length;
  var key = [skWerkzeug, skAuswahl, e && e.gesperrt, skPunkte.length, skFach, skAktiv().massstab].join('|');
  if (key === skVollKey) {
    if (e && document.activeElement !== $('sk-v-name') && $('sk-v-name')) $('sk-v-name').value = (e.art === 'text' ? e.text : e.art === 'marsch' && skOhneMassstab(skAktiv()) ? e.entf : e.name) || '';
    return;
  }
  skVollKey = key;
  var h = '', fach = '';
  if (e) {
    var art = SK_ART[e.art] || { name: e.art, form: 'punkt' }, info = e.gesperrt ? 'gesperrt' : 'Ziehen zum Verschieben';
    if (e.art === 'marsch') { var l = 0; for (var i = 1; i < e.pts.length; i++) l += skLaenge(e.pts[i - 1], e.pts[i]); info = skOhneMassstab(skAktiv()) ? 'Entfernungen der Reihe nach eintragen' : 'zusammen ' + skMeter(skAktiv(), l).toLocaleString('de-DE') + ' m'; }
    else if (art.form !== 'punkt' && !e.gesperrt) info = 'Ziehen verschiebt, Griffe verschieben Punkte';
    h = '<div class="sk-v-kopf">' + skIcon(e.art) + '<div><b>' + esc(art.name) + '</b><small>' + info + '</small></div><button type="button" class="sk-v-x" data-v="auswahlfertig" aria-label="Auswahl schließen">✕</button></div>' +
      (e.gesperrt ? '' : '<input type="text" class="sk-v-name" id="sk-v-name" maxlength="40" autocomplete="off" enterkeyhint="done" placeholder="' + (e.art === 'marsch' && skOhneMassstab(skAktiv()) ? 'Entfernungen in m, z. B. 800, 400, 1600' : e.art === 'text' ? 'Text eingeben' : 'Name, z. B. ' + ({ ort: 'Schlierhof', nadelwald: 'Südwald', laubwald: 'Nordwald', mischwald: 'Kreuzwald', kuppe: 'Kahler Berg', fluss: 'Aue' }[e.art] || 'Spitzbaum')) + '" value="' + esc((e.art === 'text' ? (e.text === 'Text' ? '' : e.text) : e.art === 'marsch' && skOhneMassstab(skAktiv()) ? e.entf : e.name) || '') + '">') +
      '<div class="sk-v-knoepfe">' + (art.form === 'punkt' && !e.gesperrt ? '<button type="button" class="sk-v-knopf" data-v="drehen">↻ Drehen</button>' : '') +
      '<button type="button" class="sk-v-knopf" data-v="sperren">' + (e.gesperrt ? 'Entsperren' : 'Sperren') + '</button>' +
      (e.gesperrt ? '' : '<button type="button" class="sk-v-knopf gefahr" data-v="loeschen">Löschen</button>') +
      '<button type="button" class="sk-v-knopf primaer" data-v="auswahlfertig">Fertig</button></div>';
  } else if (skWerkzeug) {
    var f = SK_ART[skWerkzeug].form, hinweis = skWerkzeug === 'text' ? 'Auf das Blatt tippen, dann Text eingeben' : f === 'punkt' ? 'Auf das Blatt tippen, mehrmals möglich'
      : (skWerkzeug === 'marsch' ? 'Start, dann die Wegpunkte antippen' : f === 'flaeche' ? 'Umriss Punkt für Punkt antippen' : 'Punkte nacheinander antippen') + (skPunkte.length ? ' · ' + skPunkte.length + ' gesetzt' : '');
    h = '<div class="sk-v-kopf">' + skIcon(skWerkzeug) + '<div><b>' + esc(SK_ART[skWerkzeug].name) + '</b><small>' + hinweis + '</small></div><button type="button" class="sk-v-x" data-v="abbrechen" aria-label="Werkzeug beenden">✕</button></div>' +
      '<div class="sk-v-knoepfe">' + (f === 'punkt' ? '' : '<button type="button" class="sk-v-knopf" data-v="punktzurueck"' + (skPunkte.length ? '' : ' disabled') + '>↶ Punkt zurück</button>') +
      '<button type="button" class="sk-v-knopf primaer" data-v="fertig">✓ Fertig</button></div>';
  } else {
    h = '<div class="sk-v-dock">' + SK_DOCK.map(function (d) {
      return '<button type="button" class="sk-v-wahl" data-v-fach="' + d[0] + '" aria-pressed="' + (skFach === d[0]) + '">' + skIcon(d[1]) + d[0] + '</button>';
    }).join('') + '<button type="button" class="sk-v-wahl" data-v-wz="marsch">' + skIcon('marsch') + 'Marschweg</button></div>';
    if (skFach) {
      var g = SK_WERKZEUGE.filter(function (x) { return x[0] === skFach; })[0];
      fach = g[1].filter(function (w) { return w[0] !== 'marsch'; }).map(function (w) { return '<button type="button" class="sk-v-wahl" data-v-wz="' + w[0] + '">' + skIcon(w[0]) + esc(w[1]) + '</button>'; }).join('');
    }
  }
  $('sk-v-leiste').innerHTML = h;
  $('sk-v-fach').innerHTML = fach;
  $('sk-v-fach').hidden = !fach;
}
$('sk-voll').addEventListener('click', function (ev) {
  var b = ev.target.closest('button');
  if (!b) return;
  if (b.hasAttribute('data-v-fach')) { var f = b.getAttribute('data-v-fach'); skFach = skFach === f ? null : f; skVollLeiste(); return; }
  if (b.hasAttribute('data-v-wz')) { skWerkzeugWaehlen(b.getAttribute('data-v-wz')); return; }
  var v = b.getAttribute('data-v');
  if (v === 'abbrechen') skAbbrechen();
  else if (v === 'fertig') skFertig();
  else if (v === 'punktzurueck') skPunktZurueck();
  else if (v === 'drehen') skDrehen();
  else if (v === 'sperren') skSperren();
  else if (v === 'loeschen') skLoeschen();
  else if (v === 'auswahlfertig') skAuswahlEnde();
});
$('sk-v-leiste').addEventListener('input', function (ev) { if (ev.target.id === 'sk-v-name') skNameAendern(ev.target.value); });
$('sk-v-leiste').addEventListener('focusin', function (ev) { if (ev.target.id === 'sk-v-name' && skAuswahl) skMerken(); });
$('sk-v-leiste').addEventListener('keydown', function (ev) { if (ev.target.id === 'sk-v-name' && ev.key === 'Enter') { ev.target.blur(); skAuswahlEnde(); } });
$('sk-v-zu').addEventListener('click', function () { skVollbild(false); });
$('sk-v-zurueck').addEventListener('click', skRueckgaengig);
$('sk-v-einpassen').addEventListener('click', function () { skEinpassen(); skAnsichtSetzen(); });
$('sk-vollbild').addEventListener('click', function () { skVollbild(true); });
document.addEventListener('keydown', function (e) { if (skVoll && e.key === 'Escape') skVollbild(false); });
window.addEventListener('resize', function () { if (skVoll) { skAnsichtBegrenzen(); skAnsichtSetzen(); } });
window.addEventListener('hashchange', function () { if (skVoll) skVollbild(false); });

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
  var quelle = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + SK_B + ' ' + SK_H + '" width="' + SK_B * px + '" height="' + SK_H * px + '" font-family="IBM Plex Sans, Arial, sans-serif">' + skSvg(s, false) + '</svg>';
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
