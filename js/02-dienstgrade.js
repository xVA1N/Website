/* MeinKamerad – Abzeichen und Listen der Dienstgrade. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

/* ===== Symbole: stilisierte Linien-Zeichen je Dienstgrad, keine amtlichen Abzeichen ===== */
// Form und Anzahl: chev = Winkel (Mannschaften), bar = Balken (ohne Portepee), dia = Raute (mit Portepee),
// ring = Kreis (Anwärter), star = Sterne (Leutnante, Hauptleute), laub = Kranz mit Sternen (Stabsoffiziere, Generale)
var RANG = {
  soldat: ['chev', 0], gefr: ['chev', 1], korp: ['kor', 1], stkorp: ['kor', 2], ogefr: ['chev', 2], hgefr: ['chev', 3], stgefr: ['chev', 4], ostgefr: ['chev', 5],
  uffz: ['bar', 1], stuffz: ['bar', 2],
  schuetze_ua: ['bar', 1], gefr_ua: ['bar', 2], ogefr_ua: ['bar', 3], hgefr_ua: ['bar', 4], gefr_fa: ['chev', 1], uffz_fa: ['bar', 1],
  fw: ['dia', 1], ofw: ['dia', 2], hfw: ['dia', 3], stfw: ['dia', 4], ostfw: ['dia', 5],
  fj: ['ring', 1], faehnrich: ['ring', 2], ofaehnrich: ['ring', 3],
  lt: ['star', 1], olt: ['star', 2], hptm: ['star', 3], sthptm: ['star', 4], sa13: ['star', 3],
  maj: ['laub', 0], oberstlt: ['laub', 1], oberst: ['laub', 2], sa14: ['laub', 0], sa15: ['laub', 1], sa16: ['laub', 2],
  bgen: ['laub', 1], gmaj: ['laub', 2], glt: ['laub', 3], gen: ['laub', 4], sb6: ['laub', 1], sb7: ['laub', 2], sb9: ['laub', 3]
};
function sStern(cx, cy, r) {
  var pts = [];
  for (var i = 0; i < 10; i++) {
    var w = -Math.PI / 2 + i * Math.PI / 5;
    var rr = i % 2 ? r * 0.45 : r;
    pts.push((cx + rr * Math.cos(w)).toFixed(1) + ' ' + (cy + rr * Math.sin(w)).toFixed(1));
  }
  return '<path d="M' + pts.join(' L') + ' Z"/>';
}
function sRaute(cx, cy, r) {
  return '<path d="M' + cx + ' ' + (cy - r) + ' L' + (cx + r) + ' ' + cy + ' L' + cx + ' ' + (cy + r) + ' L' + (cx - r) + ' ' + cy + ' Z"/>';
}
function sKreis(cx, cy, r) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>'; }
var POS = {
  1: [[12, 12]],
  2: [[7.5, 12], [16.5, 12]],
  3: [[6, 12], [12, 12], [18, 12]],
  4: [[8, 7.5], [16, 7.5], [8, 16.5], [16, 16.5]],
  5: [[6, 7.5], [12, 7.5], [18, 7.5], [9, 16.5], [15, 16.5]]
};
function haufen(fn, n) {
  var r = n === 1 ? 6 : n === 2 ? 4.3 : 3.3;
  return POS[n].map(function (p) { return fn(p[0], p[1], r); }).join('');
}
/* Schulterklappen: eigene Zeichnung nach dem Vorbild der Originale (Heer/Luftwaffe), ohne Waffenfarben, mit silberner Litze bei Offizieranwärtern */
function schulter(id) {
  var ALIAS = { sa13: 'hptm', sa14: 'maj', sa15: 'oberstlt', sa16: 'oberst', sb6: 'bgen', sb7: 'gmaj', sb9: 'glt' };
  var k = ALIAS[id] || id, o = '', fa = /_fa$/.test(k);
  if (fa) k = k.replace('_fa', '');
  function raute(x, y, h, c) { return '<path class="' + c + '" d="M' + x + ' ' + (y - h - 0.7) + 'L' + (x + h) + ' ' + y + 'L' + x + ' ' + (y + h + 0.7) + 'L' + (x - h) + ' ' + y + 'Z"/>'; }
  function wink(x, y, w) { return '<path class="ch" d="M' + (x - w) + ' ' + (y + w * 0.7) + 'L' + x + ' ' + y + 'L' + (x + w) + ' ' + (y + w * 0.7) + '"/>'; }
  var strich = { gefr: 1, ogefr: 2, hgefr: 3, stgefr: 4, ostgefr: 5 }, i, n;
  if (strich[k]) {
    // Bei fünf Streifen enger setzen, damit der oberste unter der Querlinie bleibt
    var abst = strich[k] >= 5 ? 5.1 : 6;
    for (i = 0; i < strich[k]; i++) { var y = +(44.5 - i * abst).toFixed(1); o += '<path class="st" d="M8 ' + (y + 3) + 'L20 ' + (y - 3) + '"/>'; }
  }
  var ua = { schuetze_ua: 0, gefr_ua: 1, ogefr_ua: 2, hgefr_ua: 3 };
  if (ua[k] !== undefined) {
    for (i = 0; i < ua[k]; i++) { var yy = 44 - i * 6; o += '<path class="st" d="M8 ' + (yy + 3) + 'L20 ' + (yy - 3) + '"/>'; }
    var by = ua[k] ? 44 - (ua[k] - 1) * 6 - 8.5 : 41;
    o += '<path class="st" d="M8 ' + by + 'H20"/>';
  }
  // Korporal: breiter Schrägbalken, Stabskorporal: schmaler Streifen darüber
  if (k === 'korp') o += '<path class="fl" d="M8 38.7L20.3 32.5V39.7L8 46.2Z"/>';
  if (k === 'stkorp') o += '<path class="fl" d="M7.7 35.9L20.1 29.4V31.6L7.7 38Z"/><path class="fl" d="M7.7 38.6L20.1 32.3V39.6L7.7 46.3Z"/>';
  var U = 'M6 49V28a8 8 0 0 1 16 0V49', Ui = 'M10 48V28.5a4 4 0 0 1 8 0V48';
  if (k === 'uffz') o += '<path class="u1" d="' + U + '"/>';
  if (k === 'stuffz') o += '<path class="u1" d="M6 48V28a8 8 0 0 1 16 0V48Z"/>';
  if (['fw', 'ofw', 'hfw', 'stfw', 'ostfw'].indexOf(k) >= 0) {
    o += '<path class="u1" d="M6 48V28a8 8 0 0 1 16 0V48Z"/>';
    var sw = function (y) { return wink(14, y, 4); };
    var schleife = function (t) {
      return '<path class="ch" d="M11 ' + (t + 3.2) + 'L14 ' + t + 'L17 ' + (t + 3.2) + '"/>' +
        '<path class="ch" d="M11 ' + (t + 3.2) + 'L17.5 ' + (t + 10.5) + 'M17 ' + (t + 3.2) + 'L10.5 ' + (t + 10.5) + '"/>';
    };
    if (k === 'fw') o += sw(38);
    if (k === 'ofw') o += sw(36.5) + sw(40.2);
    if (k === 'hfw') o += schleife(34);
    if (k === 'stfw') o += schleife(27) + wink(14, 40.5, 3.8);
    if (k === 'ostfw') o += schleife(25) + wink(14, 38.2, 3.8) + wink(14, 41.5, 3.8);
  }
  if (['fj', 'faehnrich', 'ofaehnrich'].indexOf(k) >= 0) {
    o += '<path class="u1" d="' + U + '"/>';
    if (k === 'faehnrich') o += wink(14, 39, 3.6);
    if (k === 'ofaehnrich') o += raute(14, 39, 3.2, 'fl');
    o += '<path class="sil" d="M2.6 50.8H25.4"/>';
  }
  var rt = { lt: [[14, 42]], olt: [[14, 42], [14, 34]], hptm: [[14, 42], [14, 34], [14, 26]], sthptm: [[9.5, 42], [18.5, 42], [14, 34], [14, 26]] };
  if (rt[k]) rt[k].forEach(function (q) { o += raute(q[0], q[1], 3.3, 'fl'); });
  var kranz = { maj: 1, oberstlt: 2, oberst: 3, bgen: 1, gmaj: 2, glt: 3, gen: 4 };
  if (kranz[k]) {
    var gold = ['bgen', 'gmaj', 'glt', 'gen'].indexOf(k) >= 0, c = gold ? 'au' : 'fl', t, cx, cy;
    var LEAF = 'M0 0C.8-1.5 1.8-1.7 2.4-1C3-1.8 4-1.6 4.4-.7C5-1.1 5.8-.6 5.6 0C5.8.6 5 1.1 4.4.7C4 1.6 3 1.8 2.4 1C1.8 1.7.8 1.5 0 0Z';
    var br = '<path class="stm ' + c + '" d="M14 45.5A6.5 6.5 0 0 0 20.44 39.9"/>';
    [82, 58, 34, 10].forEach(function (tt) {
      var r = tt * Math.PI / 180, x = 14 + 6.5 * Math.cos(r), y = 39 + 6.5 * Math.sin(r);
      var ang = Math.atan2(-Math.cos(r), Math.sin(r)) * 180 / Math.PI + 30;
      br += '<path class="' + c + '" transform="translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') rotate(' + ang.toFixed(1) + ') scale(1)" d="' + LEAF + '"/>';
    });
    o += br + '<g transform="matrix(-1 0 0 1 28 0)">' + br + '</g>';
    for (n = 0; n < kranz[k]; n++) o += raute(14, 38 - n * 7.5, 3.1, c);
  }
  if (fa) o += '<path class="gld" d="M2.6 50.8H25.4"/>';
  return '<svg class="sk" viewBox="0 0 28 53" aria-hidden="true"><path class="kb" d="M5 9a9 9 0 0 1 18 0L26 50H2Z"/><path class="kb" d="M5.4 17H22.6"/>' + o + '</svg>';
}
function rangBild(id) {
  if (state.tsk !== 'marine') return schulter(id);
  return rangIcon(id);
}
function rangIcon(id) {
  var s = RANG[id];
  if (!s) return '';
  var f = s[0], n = s[1], m = '', i;
  if (f === 'chev') {
    if (n === 0) { m = sKreis(12, 12, 2.6); }
    for (i = 0; i < n; i++) {
      var y = 12 + (i - (n - 1) / 2) * 3.6;
      m += '<path d="M5 ' + (y + 1.8).toFixed(1) + ' L12 ' + (y - 1.8).toFixed(1) + ' L19 ' + (y + 1.8).toFixed(1) + '"/>';
    }
  } else if (f === 'bar') {
    for (i = 0; i < n; i++) {
      var by = 12 + (i - (n - 1) / 2) * 5;
      m += '<path d="M5 ' + by + ' L19 ' + by + '"/>';
    }
  } else if (f === 'kor') {
    m = '<path fill="currentColor" stroke="none" d="M5 16.5L19 9.5V14L5 21Z"/>';
    if (n === 2) m += '<path fill="currentColor" stroke="none" d="M5 13.5L19 6.5V8L5 15Z"/>';
  } else if (f === 'dia') { m = haufen(sRaute, n);
  } else if (f === 'ring') { m = haufen(sKreis, n);
  } else if (f === 'star') { m = haufen(sStern, n);
  } else if (f === 'laub') {
    var kranz = '<path d="M10 12 C5 11 4 6 6 4 C9 6 10 9 10 12 Z"/><path d="M14 12 C19 11 20 6 18 4 C15 6 14 9 14 12 Z"/>';
    if (n === 0) {
      m = '<g transform="translate(0 4)">' + kranz + '</g>';
    } else {
      var xs = { 1: [12], 2: [9, 15], 3: [6, 12, 18], 4: [4.5, 9.5, 14.5, 19.5] }[n];
      m = kranz + xs.map(function (x) { return sStern(x, 18, n === 4 ? 2.3 : 2.8); }).join('');
    }
  }
  return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + m + '</svg>';
}

/* ===== Darstellung der Listen ===== */
var gruppeOffen = {};
var INFO_ICON = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.8v.1"/></svg>';
