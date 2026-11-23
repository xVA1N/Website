/* MeinKamerad – Zeichen aus Foto erkennen (Probe). Alles läuft im Browser, das Foto verlässt das Gerät nicht.
   Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

var FOTO_RAHMEN_NAME = { '3': 'Eigene', '6': 'Feind', '4': 'Neutral', '1': 'Unbekannt' };
var FOTO_FARBE_ZU = { blau: 0, rot: 1, gruen: 2, gelb: 3 }; // Reihenfolge wie die Rahmenklassen 3, 6, 4, 1
var fotoZiffernNetz = null, fotoNetz = null, fotoBild = null, fotoAuswahl = null, fotoMass = 1, fotoLeser = null, fotoLeserLaedt = null, fotoLauf = 0;

// Texterkennung (Tesseract.js, offline aus vendor/tesseract) für die Beschriftungen links und rechts vom Zeichen
function fotoLeserLaden() {
  if (fotoLeser) return Promise.resolve(fotoLeser);
  if (fotoLeserLaedt) return fotoLeserLaedt;
  var abs = function (p) { return new URL(p, location.href).href; };
  fotoLeserLaedt = ladeSkript('vendor/tesseract/tesseract.min.js').then(function () {
    return window.Tesseract.createWorker('eng', 1, { workerPath: abs('vendor/tesseract/worker.min.js'), corePath: abs('vendor/tesseract/tesseract-core-lstm.wasm.js'),
      langPath: abs('vendor/tesseract'), gzip: true, cacheMethod: 'none' });
  }).then(function (w) {
    return w.setParameters({ tessedit_pageseg_mode: '7', tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz./-()+ ' }).then(function () { fotoLeser = w; return w; });
  });
  fotoLeserLaedt.catch(function () { fotoLeserLaedt = null; });
  return fotoLeserLaedt;
}
// Nachbearbeitung der gelesenen Texte mit Wissen über übliche Schreibweisen
// Bezeichnung links: meist „Kompanie./Bataillon“, z. B. 2./371
function fotoTextT(t) {
  var z = t.replace(/\s+/g, '').replace(/[Oo]/g, '0').replace(/[Il|]/g, '1').replace(/S/g, '5').replace(/Z/g, '2').replace(/B/g, '8').replace(/,/g, '.');
  var m = /^(\d{1,2})\.?[\/1J](\d{2,4})$/.exec(z) || /^(\d{1,2})\.(\d{3})$/.exec(z) || /^(\d{1,2})\/(\d{2,4})$/.exec(z) ||
    /^(\d)\.7(\d{3})$/.exec(z) || /^(\d)(\d{3})$/.exec(z);
  if (m) return m[1] + './' + m[2];
  return t;
}
// Übergeordnete Einheit rechts: Abkürzung mit einer Liste gängiger Verbandsbezeichnungen abgleichen, Zahl bereinigen
var FOTO_GATTUNG = ['Pz', 'PzGren', 'Jg', 'GebJg', 'FschJg', 'Pi', 'PzPi', 'GebPi', 'Art', 'PzArt', 'Aufkl', 'PzAufkl', 'Fm', 'FüUstg', 'San', 'Log', 'Instd', 'Nsch',
  'Trsp', 'ABCAbw', 'FJg', 'Wach', 'Ausb', 'Flak', 'HFlg', 'Lufttrsp', 'Fla', 'EloKa', 'Inf', 'Lw', 'Mar', 'Sich', 'Unterst', 'Stabs', 'Kdo'];
var FOTO_EBENE = ['Btl', 'Rgt', 'Brig', 'Kp', 'Zg', 'Bttr', 'Staffel', 'Gr', 'Div', 'Kdo'];
var FOTO_WOERTER = ['Div', 'Brig', 'Rgt', 'Btl', 'Kp', 'Korps', 'KSK', 'Kdo', 'DSK', 'DSO', 'EinsFüKdoBw'];
FOTO_GATTUNG.forEach(function (g) { FOTO_EBENE.forEach(function (e) { FOTO_WOERTER.push(g + e); }); });
function fotoAbstand(a, b) {
  var d = [], i, j;
  for (i = 0; i <= a.length; i++) { d[i] = [i]; }
  for (j = 1; j <= b.length; j++) d[0][j] = j;
  for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function fotoTextM(t) {
  return t.split(/\s+/).filter(Boolean).map(function (w) {
    // Überwiegend Ziffern: Zahl, verwechselte Buchstaben zu Ziffern
    var ziffern = (w.match(/\d/g) || []).length;
    if (ziffern && ziffern >= w.length / 2) return w.replace(/[OoQD]/g, '0').replace(/[Il|]/g, '1').replace(/[Zz]/g, '2').replace(/[Ss]/g, '5').replace(/B/g, '8');
    // Sonst Abkürzung: verwechselte Ziffern zu Buchstaben, dann mit der Liste abgleichen
    var best = null, bd = Infinity, lw = w.replace(/2/g, 'z').replace(/0/g, 'o').replace(/1/g, 'l').replace(/5/g, 's').toLowerCase();
    FOTO_WOERTER.forEach(function (k) { var dd = fotoAbstand(lw, k.toLowerCase()); if (dd < bd) { bd = dd; best = k; } });
    if (best && bd <= Math.max(1, Math.floor(best.length / 4))) return best;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}
// Nacheinander lesen; ein einzelnes Zeichen (z. B. eine Ziffer) im Einzelzeichen-Modus, sonst als Zeile
var fotoLeseKette = Promise.resolve();
// Erst das eigene Ziffernnetz (Handschrift und Druck); nur wenn es unsicher ist oder Buchstaben vorkommen, Tesseract
function fotoTextLesen(teile, auf, feld) {
  if (fotoZiffernNetz && teile.length <= 12) {
    var z = fotoZiffernLesen(teile, auf.breite, fotoZiffernNetz);
    if (z.sicher >= (feld === 'foto-m' ? 0.85 : 0.6) && /\d/.test(z.text)) return Promise.resolve(z.text);
  }
  return fotoTesseractLesen(teile, auf);
}
function fotoTesseractLesen(teile, auf) {
  var r = fotoUmriss(teile), einzeln = teile.length === 1 && (r.x1 - r.x0) < (r.y1 - r.y0) * 1.3;
  var job = fotoLeseKette.then(function () { return fotoLeserLaden(); }).then(function (w) {
    // Ein einzelnes Zeichen neben dem Rahmen ist fast immer eine Ziffer (Kompanie, Bataillon), dann nur Ziffern zulassen
    var erlaubt = einzeln ? '0123456789' : '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz./-()+ ';
    return w.setParameters({ tessedit_pageseg_mode: einzeln ? '10' : '7', tessedit_char_whitelist: erlaubt }).then(function () { return w.recognize(fotoTextBild(teile, auf.ctx, auf.ox, auf.oy)); });
  });
  fotoLeseKette = job.catch(function () {});
  return job
    .then(function (r) { return String(r.data.text || '').replace(/\s+/g, ' ').trim().slice(0, 30); });
}

function fotoLaden() {
  if (fotoNetz) return Promise.resolve();
  return Promise.all([ladeMilsymbol(), window.fotoErkennen ? Promise.resolve() : ladeSkript('js/foto-kern.js'), window.FOTO_NETZ ? Promise.resolve() : ladeSkript('vendor/foto-netz.js'),
    window.FOTO_ZIFFERN ? Promise.resolve() : ladeSkript('vendor/foto-ziffern.js')])
    .then(function () { fotoNetz = fotoNetzLaden(window.FOTO_NETZ); fotoZiffernNetz = fotoNetzLaden(window.FOTO_ZIFFERN); });
}
function fotoMeldung(t, fehler) { $('foto-meldung').className = 'u-meldung' + (fehler ? ' fehler' : ''); $('foto-meldung').textContent = t; }

// Bild in einen Arbeits-Canvas laden (längste Seite höchstens 1400 Pixel) und verkleinert anzeigen
function fotoAnzeigen(img) {
  var s = Math.min(1, 1400 / Math.max(img.width, img.height));
  var arbeit = document.createElement('canvas');
  arbeit.width = Math.round(img.width * s); arbeit.height = Math.round(img.height * s);
  arbeit.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, arbeit.width, arbeit.height);
  fotoBild = arbeit;
  fotoAuswahl = null;
  var cv = $('foto-canvas');
  cv.width = arbeit.width; cv.height = arbeit.height;
  fotoZeichnen();
  $('foto-bereich').hidden = false;
  $('foto-ergebnis').innerHTML = '';
  fotoMeldung('');
}
function fotoZeichnen() {
  var cv = $('foto-canvas'), ctx = cv.getContext('2d');
  ctx.drawImage(fotoBild, 0, 0);
  if (fotoAuswahl) {
    var a = fotoAuswahlNorm();
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(0, 0, cv.width, a.y); ctx.fillRect(0, a.y + a.h, cv.width, cv.height - a.y - a.h);
    ctx.fillRect(0, a.y, a.x, a.h); ctx.fillRect(a.x + a.w, a.y, cv.width - a.x - a.w, a.h);
    ctx.strokeStyle = '#FFD54A'; ctx.lineWidth = Math.max(2, cv.width / 250); ctx.strokeRect(a.x, a.y, a.w, a.h);
  }
}
function fotoAuswahlNorm() {
  var a = fotoAuswahl;
  return { x: Math.min(a.x0, a.x1), y: Math.min(a.y0, a.y1), w: Math.abs(a.x1 - a.x0), h: Math.abs(a.y1 - a.y0) };
}
// Auswahlrahmen mit Finger oder Maus ziehen
(function () {
  var cv = $('foto-canvas'), aktiv = false;
  var punkt = function (e) {
    var r = cv.getBoundingClientRect(), sx = cv.width / r.width;
    return [Math.max(0, Math.min(cv.width, (e.clientX - r.left) * sx)), Math.max(0, Math.min(cv.height, (e.clientY - r.top) * sx))];
  };
  cv.addEventListener('pointerdown', function (e) { if (!fotoBild) return; aktiv = true; cv.setPointerCapture(e.pointerId); var p = punkt(e); fotoAuswahl = { x0: p[0], y0: p[1], x1: p[0], y1: p[1] }; e.preventDefault(); });
  cv.addEventListener('pointermove', function (e) { if (!aktiv) return; var p = punkt(e); fotoAuswahl.x1 = p[0]; fotoAuswahl.y1 = p[1]; fotoZeichnen(); });
  var ende = function () { if (!aktiv) return; aktiv = false; var a = fotoAuswahlNorm(); if (a.w < 12 || a.h < 12) fotoAuswahl = null; fotoZeichnen(); };
  cv.addEventListener('pointerup', ende); cv.addEventListener('pointercancel', ende);
})();

// Erkennen: aufbereiten, Netz rechnen, Farbe einbeziehen, drei Vorschläge zeigen
function fotoAuswerten() {
  if (!fotoBild || !fotoNetz) return;
  var ctx = fotoBild.getContext('2d', { willReadFrequently: true });
  var a = fotoAuswahl ? fotoAuswahlNorm() : { x: 0, y: 0, w: fotoBild.width, h: fotoBild.height };
  a = { x: Math.round(a.x), y: Math.round(a.y), w: Math.max(1, Math.round(a.w)), h: Math.max(1, Math.round(a.h)) };
  var auf = fotoAufbereiten(ctx, a.x, a.y, a.w, a.h);
  if (!auf) { fotoMeldung('Im gewählten Bereich ist keine Zeichnung zu erkennen. Bitte enger um das Zeichen ziehen oder ein deutlicheres Foto nehmen.', true); $('foto-ergebnis').innerHTML = ''; return; }
  var e = fotoErkennen(fotoNetz, auf.daten);
  // Kräftige Farbe stützt die Zugehörigkeit (blau eigene, rot Feind, grün neutral, gelb unbekannt)
  var farbe = fotoFarbe(ctx, a.x + auf.box.x0, a.y + auf.box.y0, auf.box.x1 - auf.box.x0 + 1, auf.box.y1 - auf.box.y0 + 1);
  var rahmen = Array.prototype.slice.call(e.rahmen);
  Object.keys(FOTO_FARBE_ZU).forEach(function (k) { rahmen[FOTO_FARBE_ZU[k]] *= 1 + Math.min(20, farbe[k] * 200); });
  var summe = rahmen.reduce(function (x, y) { return x + y; }, 0);
  rahmen = rahmen.map(function (x) { return x / summe; });
  var kl = fotoNetz.klassen, beste = function (arr) { var i = 0; for (var j = 1; j < arr.length; j++) if (arr[j] > arr[i]) i = j; return i; };
  var ri = beste(rahmen), gi = beste(e.groesse);
  // Die Form über dem Rahmen (Punkte, Striche oder Kreuze) legt die Art fest, das Netz die Anzahl
  var gForm = auf.groesse && auf.groesse.indexOf(kl.groesse[gi]) < 0;
  if (gForm) auf.groesse.forEach(function (c) { var i = kl.groesse.indexOf(c); if (i >= 0 && (auf.groesse.indexOf(kl.groesse[gi]) < 0 || e.groesse[i] > e.groesse[gi])) gi = i; });
  var symbole = Array.prototype.map.call(e.symbol, function (p, i) { return [p, i]; }).sort(function (x, y) { return y[0] - x[0]; }).slice(0, 3);
  var pz = function (p) { return Math.round(p * 100) + ' %'; };
  var mitText = auf.links.length || auf.rechts.length || auf.staerke;
  var textFelder = '<div class="foto-texte u-felder p-felder"' + (mitText ? '' : ' hidden') + '>' +
    '<div><label class="label" for="foto-t" style="display:block">Bezeichnung links (T)</label><input type="text" id="foto-t" maxlength="30" autocomplete="off" placeholder="' + (auf.links.length ? 'wird gelesen …' : 'keine gefunden') + '"></div>' +
    '<div><label class="label" for="foto-m" style="display:block">Übergeordnete Einheit rechts (M)</label><input type="text" id="foto-m" maxlength="30" autocomplete="off" placeholder="' + (auf.rechts.length ? 'wird gelesen …' : 'keine gefunden') + '"></div></div>';
  var staerkeText = { '(+)': 'verstärkt (+)', '(-)': 'vermindert (−)' }[auf.staerke] || '';
  var gName = function (code) { var g = MS_GROESSEN.filter(function (x) { return x[0] === code; })[0]; return g ? g[1].replace(/\s*\(.*\)$/, '') : code; };
  $('foto-ergebnis').innerHTML =
    textFelder + '<div class="foto-sicht"><canvas id="foto-sicht" width="64" height="64"></canvas><span>So sieht die Erkennung das Zeichen. Rahmen: <b>' + FOTO_RAHMEN_NAME[kl.rahmen[ri]] + '</b> (' + pz(rahmen[ri]) + '), Größe: <b>' + gName(kl.groesse[gi]) + '</b> (' + (gForm ? 'an der Form erkannt' : pz(e.groesse[gi])) + ')' + (staerkeText ? ', Stärke: <b>' + staerkeText + '</b>' : '') + '.</span></div>' +
    symbole.map(function (sp, n) {
      var code = kl.symbol[sp[1]], sidc = '100' + kl.rahmen[ri] + '1000' + kl.groesse[gi] + code + '0000';
      var name = code === '000000' ? 'Nur Rahmen, ohne Symbol' : msNameKurz('10', code);
      var svg = fotoVorschlagSvg(sidc, auf.staerke);
      return '<button type="button" class="foto-vorschlag" data-foto-sidc="' + sidc + '" data-foto-staerke="' + (auf.staerke || '') + '" data-foto-name="' + esc(name) + '"><span class="bild">' + svg + '</span><span><b>' + (n + 1) + '. ' + esc(name) + '</b>' +
        '<small>' + FOTO_RAHMEN_NAME[kl.rahmen[ri]] + ' · ' + gName(kl.groesse[gi]) + '</small><br><span class="wert">' + pz(sp[0]) + '</span> <small>Übernehmen</small></span></button>';
    }).join('');
  // Aufbereitetes Bild als kleine Vorschau zeigen, damit man sieht, was erkannt wurde
  var sc = $('foto-sicht').getContext('2d'), id = sc.createImageData(FOTO_N, FOTO_N);
  for (var i = 0; i < FOTO_N * FOTO_N; i++) { var v = 255 - Math.round(auf.daten[i] * 255); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  sc.putImageData(id, 0, 0);
  fotoMeldung(symbole[0][0] < 0.4 ? 'Die Erkennung ist unsicher. Prüfe die Vorschläge oder versuche ein deutlicheres, enger zugeschnittenes Foto.' : '');
  // Beschriftungen lesen (dauert beim ersten Mal einige Sekunden, weil die Texterkennung geladen wird)
  var lauf = ++fotoLauf;
  fotoUebernommen = false;
  [['foto-t', auf.links], ['foto-m', auf.rechts]].forEach(function (z) {
    if (!z[1].length) return;
    fotoTextLesen(z[1], auf, z[0]).then(function (t) {
      if (lauf !== fotoLauf || !$(z[0])) return;
      if (!$(z[0]).value) $(z[0]).value = t ? (z[0] === 'foto-t' ? fotoTextT(t) : fotoTextM(t)) : '';
      $(z[0]).placeholder = t ? '' : 'nicht lesbar';
      fotoTexteAbgleichen();
    }, function () { if (lauf === fotoLauf && $(z[0])) $(z[0]).placeholder = 'Texterkennung nicht verfügbar'; });
  });
}

// Vorschaubild eines Vorschlags, mit den Beschriftungen aus den Feldern T und M
function fotoVorschlagSvg(sidc, staerke) {
  var opt = { size: 30, standard: 'APP6' }, t = $('foto-t'), m = $('foto-m');
  if (staerke) opt.reinforcedReduced = staerke;
  if (t && t.value.trim()) opt.uniqueDesignation = t.value.trim();
  if (m && m.value.trim()) opt.higherFormation = m.value.trim();
  return new window.ms.Symbol(sidc, opt).asSVG();
}
// Nach einer Änderung an T oder M: Vorschaubilder neu zeichnen und, wenn schon ein
// Vorschlag übernommen wurde, den Baukasten sofort mitziehen
var fotoUebernommen = false;
function fotoTexteAbgleichen() {
  Array.prototype.forEach.call(document.querySelectorAll('#foto-ergebnis button[data-foto-sidc]'), function (b) {
    b.querySelector('.bild').innerHTML = fotoVorschlagSvg(b.getAttribute('data-foto-sidc'), b.getAttribute('data-foto-staerke'));
  });
  if (!fotoUebernommen) return;
  $('ms-bez').value = $('foto-t') ? $('foto-t').value.trim() : '';
  $('ms-hoeher').value = $('foto-m') ? $('foto-m').value.trim() : '';
  renderSymbol();
}

// Bedienung
$('foto-ergebnis').addEventListener('input', function (e) {
  if (e.target.id === 'foto-t' || e.target.id === 'foto-m') fotoTexteAbgleichen();
});
$('foto-knopf').addEventListener('click', function () { $('foto-datei').click(); });
$('foto-datei').addEventListener('change', function (e) {
  var f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  fotoMeldung('Wird geladen …');
  var url = URL.createObjectURL(f), img = new Image();
  img.onload = function () {
    URL.revokeObjectURL(url);
    fotoLaden().then(function () { fotoAnzeigen(img); }, function () { fotoMeldung('Die Erkennung konnte nicht geladen werden. Bitte die Verbindung prüfen.', true); });
  };
  img.onerror = function () { URL.revokeObjectURL(url); fotoMeldung('Diese Datei ist kein lesbares Bild.', true); };
  img.src = url;
});
$('foto-ganz').addEventListener('click', function () { fotoAuswahl = null; fotoZeichnen(); fotoAuswerten(); });
$('foto-erkennen').addEventListener('click', fotoAuswerten);
$('foto-ergebnis').addEventListener('click', function (e) {
  var b = e.target.closest('button[data-foto-sidc]');
  if (!b) return;
  var opt = { fill: true, colorMode: 'Medium', standard: 'APP6' };
  if ($('foto-t') && $('foto-t').value.trim()) opt.uniqueDesignation = $('foto-t').value.trim();
  if ($('foto-m') && $('foto-m').value.trim()) opt.higherFormation = $('foto-m').value.trim();
  if (b.getAttribute('data-foto-staerke')) opt.reinforcedReduced = b.getAttribute('data-foto-staerke');
  msFormularSetzen({ sidc: b.getAttribute('data-foto-sidc'), opt: opt });
  fotoUebernommen = true;
  $('ms-vorschau').scrollIntoView({ block: 'center' });
  fotoMeldung('„' + b.getAttribute('data-foto-name') + '“ in den Baukasten übernommen. Dort kannst du alles anpassen.');
});
