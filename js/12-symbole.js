/* MeinKamerad – Taktische Zeichen nach NATO APP-6 (Baukasten). Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

// Truppengattungen der Landeinheiten (APP-6D, Symbolsatz 10). Code = Entity, Entity Type und Subtype.
var MS_ARTEN = [
  ['Kampftruppen', [
    ['121100', 'Infanterie, Jäger'],
    ['121102', 'Panzergrenadiere (mechanisierte Infanterie)'],
    ['121104', 'Infanterie, motorisiert'],
    ['120500', 'Panzertruppe'],
    ['121300', 'Aufklärung'],
    ['121303', 'Aufklärung, motorisiert'],
    ['120501', 'Panzeraufklärung'],
    ['120400', 'Panzerabwehr'],
    ['120100', 'Luftbewegliche Kräfte'],
    ['121700', 'Spezialkräfte'],
    ['121500', 'Scharfschützen'],
    ['121000', 'Verbundene Waffen'],
    ['121900', 'Unbemannte Systeme']
  ]],
  ['Unterstützung', [
    ['130300', 'Artillerie'],
    ['130301', 'Panzerartillerie'],
    ['130800', 'Mörser'],
    ['130400', 'Artilleriebeobachter'],
    ['130500', 'Streitkräftegemeinsame taktische Feuerunterstützung'],
    ['130100', 'Flugabwehr'],
    ['140700', 'Pioniere'],
    ['140701', 'Panzerpioniere'],
    ['140800', 'Kampfmittelbeseitigung'],
    ['140100', 'ABC-Abwehr'],
    ['140103', 'ABC-Aufklärung'],
    ['141200', 'Feldjäger'],
    ['141700', 'Sicherung'],
    ['120600', 'Heeresflieger (Hubschrauber)'],
    ['120800', 'Flächenflugzeuge']
  ]],
  ['Führung und Information', [
    ['111000', 'Fernmelde, Führungsunterstützung'],
    ['150500', 'Elektronische Kampfführung'],
    ['151000', 'Militärisches Nachrichtenwesen'],
    ['110300', 'Zivil-militärische Zusammenarbeit (CIMIC)'],
    ['110400', 'Informationsoperationen'],
    ['210000', 'Cyber'],
    ['141100', 'Geoinformationsdienst']
  ]],
  ['Logistik und Sanität', [
    ['161300', 'Sanität'],
    ['161400', 'Sanitätseinrichtung'],
    ['161100', 'Instandsetzung'],
    ['163400', 'Nachschub'],
    ['163600', 'Transport'],
    ['160400', 'Munition'],
    ['162500', 'Betriebsstoff'],
    ['164700', 'Wasser'],
    ['160100', 'Personal, Verwaltung'],
    ['160500', 'Militärmusik']
  ]]
];
// Größe (Echelon, APP-6D) mit deutschen Bezeichnungen
var MS_GROESSEN = [['00', 'ohne Angabe'], ['11', 'Trupp'], ['12', 'Gruppe'], ['13', 'Halbzug'], ['14', 'Zug'], ['15', 'Kompanie'],
  ['16', 'Bataillon'], ['17', 'Regiment'], ['18', 'Brigade'], ['21', 'Division'], ['22', 'Korps'], ['23', 'Armee']];

var msGeladen = false, msLaedt = false;
function zeigeSymbole() {
  if (window.ms) { msGeladen = true; renderSymbol(); return; }
  if (msLaedt) return;
  msLaedt = true;
  var sc = document.createElement('script');
  sc.src = 'vendor/milsymbol.js';
  sc.onload = function () { msGeladen = true; renderSymbol(); };
  sc.onerror = function () { msLaedt = false; $('ms-vorschau').innerHTML = '<p class="hint">Die Zeichen-Bibliothek konnte nicht geladen werden. Bitte die Verbindung prüfen und die Seite neu öffnen.</p>'; };
  document.head.appendChild(sc);
}

function msWert(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
function msSidc() {
  var hq = ($('ms-stab').checked ? 2 : 0) + ($('ms-tf').checked ? 4 : 0);
  // Version 10, Wirklichkeit 0, Zugehörigkeit, Symbolsatz 10 (Landeinheit), Status, Stab/Task Force, Größe, Truppengattung, keine Zusätze
  return '10' + '0' + msWert('ms-zug') + '10' + msWert('ms-status') + hq + $('ms-groesse').value + $('ms-art').value + '0000';
}
function msSymbol(groesse) {
  var farbe = $('ms-farbe').value;
  var o = { size: groesse || 80, fill: farbe !== 'ohne', colorMode: farbe === 'ohne' ? 'Light' : farbe, standard: 'APP6' };
  if ($('ms-bez').value.trim()) o.uniqueDesignation = $('ms-bez').value.trim();
  if ($('ms-hoeher').value.trim()) o.higherFormation = $('ms-hoeher').value.trim();
  if ($('ms-info').value.trim()) o.additionalInformation = $('ms-info').value.trim();
  if ($('ms-staerke').value) o.reinforcedReduced = $('ms-staerke').value;
  return new window.ms.Symbol(msSidc(), o);
}
function renderSymbol() {
  if (!msGeladen) return;
  var sidc = msSidc();
  $('ms-code').textContent = sidc;
  var sym = msSymbol(80);
  var v = typeof sym.isValid === 'function' && !sym.isValid() ? '<p class="hint">Für diese Auswahl gibt es kein gültiges Zeichen.</p>' : '';
  $('ms-vorschau').innerHTML = sym.asSVG() + v;
  $('ms-vorschau').setAttribute('aria-label', 'Taktisches Zeichen: ' + $('ms-art').selectedOptions[0].textContent + ', ' + $('ms-groesse').selectedOptions[0].textContent);
}

// Auswahllisten einmal füllen
$('ms-art').innerHTML = MS_ARTEN.map(function (g) {
  return '<optgroup label="' + g[0] + '">' + g[1].map(function (a) { return '<option value="' + a[0] + '">' + a[1] + '</option>'; }).join('') + '</optgroup>';
}).join('');
$('ms-groesse').innerHTML = MS_GROESSEN.map(function (g) { return '<option value="' + g[0] + '">' + g[1] + '</option>'; }).join('');
$('ms-groesse').value = '15';
['ms-zug', 'ms-status'].forEach(function (id) { $(id).addEventListener('change', renderSymbol); });
['ms-art', 'ms-groesse', 'ms-stab', 'ms-tf', 'ms-staerke', 'ms-farbe'].forEach(function (id) { $(id).addEventListener('change', renderSymbol); });
['ms-bez', 'ms-hoeher', 'ms-info'].forEach(function (id) { $(id).addEventListener('input', renderSymbol); });

// Herunterladen
function msDateiname(endung) {
  var t = ($('ms-bez').value.trim() || $('ms-art').selectedOptions[0].textContent).toLowerCase()
    .replace(/[äöüß]/g, function (c) { return { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[c]; }).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return 'zeichen-' + (t || 'symbol') + '.' + endung;
}
function msLaden(blob, name) {
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}
$('ms-svg').addEventListener('click', function () {
  if (!msGeladen) return;
  msLaden(new Blob([msSymbol(100).asSVG()], { type: 'image/svg+xml' }), msDateiname('svg'));
});
$('ms-png').addEventListener('click', function () {
  if (!msGeladen) return;
  var c = msSymbol(200).asCanvas(2);
  c.toBlob(function (b) { if (b) msLaden(b, msDateiname('png')); }, 'image/png');
});
if (window.claude && typeof window.claude.use === 'function') {
  $('ms-knoepfe').hidden = true;
  $('ms-download-hinweis').hidden = false;
}
