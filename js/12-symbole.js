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
// Größe (Echelon) für Einheiten, Beweglichkeit für Ausrüstung, Schleppantenne für Schiffe (Feld 9–10 des APP-6D-Codes)
var MS_GROESSEN = [['00', 'ohne Angabe'], ['11', 'Team, Besatzung (Team/Crew)'], ['12', 'Trupp • (Squad)'], ['13', 'Gruppe •• (Section)'], ['14', 'Zug ••• (Platoon/Detachment)'],
  ['15', 'Kompanie (Company/Battery/Troop)'], ['16', 'Bataillon (Battalion/Squadron)'], ['17', 'Regiment (Regiment/Group)'], ['18', 'Brigade'],
  ['21', 'Division'], ['22', 'Korps (Corps)'], ['23', 'Armee (Army)'], ['24', 'Heeresgruppe (Army Group/Front)'], ['25', 'Region (Region/Theatre)'], ['26', 'Kommando (Command)']];
var MS_BEWEGLICH = [['00', 'ohne Angabe'], ['31', 'Rad, eingeschränkt geländegängig (Wheeled limited cross country)'], ['32', 'Rad, geländegängig (Wheeled cross country)'],
  ['33', 'Kette (Tracked)'], ['34', 'Rad und Kette (Wheeled and tracked combination)'], ['35', 'Gezogen (Towed)'], ['36', 'Schiene (Rail)'], ['37', 'Tragtiere (Pack animals)'],
  ['41', 'Schnee (Over snow)'], ['42', 'Schlitten (Sled)'], ['51', 'Leichter (Barge)'], ['52', 'Amphibisch (Amphibious)']];
var MS_SCHLEPP = [['00', 'ohne Angabe'], ['61', 'Kurze Schleppantenne (Short towed array)'], ['62', 'Lange Schleppantenne (Long towed array)']];
function msFeld910(satz) {
  if (satz === '10' || satz === '11') return ['Größe', MS_GROESSEN];
  if (satz === '15') return ['Beweglichkeit', MS_BEWEGLICH];
  if (satz === '30' || satz === '35') return ['Schleppantenne', MS_SCHLEPP];
  return null;
}
// Weitere Textfelder (Buchstabe des APP-6-Feldes, Name der milsymbol-Option, Bezeichnung)
var MS_FELDER = [['C', 'quantity', 'Anzahl'], ['G', 'staffComments', 'Stabsbemerkung'], ['V', 'type', 'Typ (z. B. Waffensystem)'], ['W', 'dtg', 'Datum-Zeit-Gruppe'],
  ['Q', 'direction', 'Bewegungsrichtung in Grad'], ['J', 'evaluationRating', 'Bewertung (z. B. A1)'], ['K', 'combatEffectiveness', 'Gefechtswert'],
  ['Y', 'location', 'Ort'], ['Z', 'speed', 'Geschwindigkeit'], ['AS', 'country', 'Land (Länderkennung)'], ['AA', 'specialHeadquarters', 'Besonderer Stab']];
// Deutsche Bezeichnungen für häufige Landeinheiten (frei übersetzt)
var MS_DEUTSCH = {};
MS_ARTEN.forEach(function (g) { g[1].forEach(function (a) { MS_DEUTSCH['10:' + a[0]] = a[1]; }); });

// Fremde Bibliotheken erst laden, wenn sie gebraucht werden (je Datei nur einmal)
var SKRIPTE = {};
function ladeSkript(src) {
  if (!SKRIPTE[src]) {
    SKRIPTE[src] = new Promise(function (ok, fehler) {
      var sc = document.createElement('script');
      sc.src = src;
      sc.onload = ok;
      sc.onerror = function () { delete SKRIPTE[src]; fehler(new Error(src)); };
      document.head.appendChild(sc);
    });
  }
  return SKRIPTE[src];
}
var msGeladen = false;
function ladeMilsymbol() {
  return Promise.all([window.ms ? Promise.resolve() : ladeSkript('vendor/milsymbol.js'), window.APP6D ? Promise.resolve() : ladeSkript('vendor/app6d-katalog.js')])
    .then(function () { if (!msGeladen) { msGeladen = true; msAufbauen(); } });
}
function zeigeSymbole() {
  msFavAlleZeigen();
  ladeMilsymbol().then(function () { renderSymbol(); }, function () {
    $('ms-vorschau').innerHTML = '<p class="hint">Die Zeichen-Bibliothek konnte nicht geladen werden. Bitte die Verbindung prüfen und die Seite neu öffnen.</p>';
  });
}

function msSatz(c) { return window.APP6D ? window.APP6D.filter(function (x) { return x.c === c; })[0] : null; }
// Originalbezeichnung: vollständiger Pfad (Entity – Entity Type – Entity Subtype) oder nur der letzte Teil für die eingerückte Liste
function msBlatt(e) { return e[1].split(' – ').pop(); }
function msName(satz, e, voll) { var de = MS_DEUTSCH[satz + ':' + e[0]], o = voll ? e[1] : msBlatt(e); return de ? de + ' (' + o + ')' : o; }
function msNameKurz(satz, code) {
  var s = msSatz(satz), e = s && s.e.filter(function (x) { return x[0] === code; })[0];
  return e ? (MS_DEUTSCH[satz + ':' + code] || msBlatt(e)) : code;
}
// Liste der Einträge des gewählten Symbolsatzes, gefiltert nach dem Suchtext
function msArtenFuellen(wunsch) {
  var satz = $('ms-satz').value, s = msSatz(satz), q = $('ms-suche').value.trim().toLowerCase();
  var alt = wunsch || $('ms-art').value;
  var treffer = s.e.filter(function (e) {
    if (!q) return true;
    return e[0].indexOf(q) === 0 || e[1].toLowerCase().indexOf(q) >= 0 || (MS_DEUTSCH[satz + ':' + e[0]] || '').toLowerCase().indexOf(q) >= 0;
  });
  var opt = function (e, einr) {
    return '<option value="' + e[0] + '">' + (einr ? new Array(e[2] + 1).join(' ') : '') + esc(msName(satz, e, !einr)) + (e[3] ? ' – Oberbegriff' : '') + ' · ' + e[0] + '</option>';
  };
  var html = '';
  if (satz === '10' && !q) {
    html += '<optgroup label="Häufig (deutsch)">' + MS_ARTEN.map(function (g) { return g[1].map(function (a) { return '<option value="' + a[0] + '">' + esc(a[1]) + '</option>'; }).join(''); }).join('') + '</optgroup>';
    html += '<optgroup label="Alle Einträge (APP-6D)">' + treffer.map(function (e) { return opt(e, true); }).join('') + '</optgroup>';
  } else {
    html = treffer.map(function (e) { return opt(e, !q); }).join('');
  }
  $('ms-art').innerHTML = html || '<option value="">Kein Treffer</option>';
  $('ms-art-anz').textContent = q ? '(' + treffer.length + ' Treffer)' : '(' + s.e.length + ')';
  if (alt && $('ms-art').querySelector('option[value="' + alt + '"]')) $('ms-art').value = alt;
}
function msZusaetzeFuellen(m1, m2) {
  var s = msSatz($('ms-satz').value);
  [['ms-m1', s.m1, m1], ['ms-m2', s.m2, m2]].forEach(function (z) {
    $(z[0] + '-wrap').hidden = !z[1].length;
    $(z[0]).innerHTML = '<option value="00">ohne</option>' + z[1].filter(function (m) { return m[0] !== '00'; }).map(function (m) { return '<option value="' + m[0] + '">' + esc(m[1]) + ' · ' + m[0] + '</option>'; }).join('');
    $(z[0]).value = z[2] && $(z[0]).querySelector('option[value="' + z[2] + '"]') ? z[2] : '00';
  });
  var f = msFeld910($('ms-satz').value), g = $('ms-groesse').value;
  $('ms-groesse-wrap').hidden = !f;
  if (f) {
    $('ms-groesse-label').textContent = f[0];
    $('ms-groesse').innerHTML = f[1].map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('');
    $('ms-groesse').value = f[1].some(function (x) { return x[0] === g; }) ? g : '00';
  } else {
    $('ms-groesse').innerHTML = '<option value="00">ohne</option>';
  }
}
function msAufbauen() {
  $('ms-satz').innerHTML = window.APP6D.map(function (s) { return '<option value="' + s.c + '">' + s.de + ' (' + s.n + ') · ' + s.c + '</option>'; }).join('');
  $('ms-satz').value = '10';
  $('ms-felder').innerHTML = MS_FELDER.map(function (f) {
    return '<div><label class="label" for="ms-f-' + f[1] + '" style="display:block">' + f[2] + ' (' + f[0] + ')</label><input type="text" id="ms-f-' + f[1] + '" data-ms-feld="' + f[1] + '" maxlength="30" autocomplete="off"></div>';
  }).join('');
  msArtenFuellen('121100');
  msZusaetzeFuellen();
  $('ms-groesse').value = '15';
}

function msWert(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
// APP-6D-Code (20 Stellen): Version, Kontext, Zugehörigkeit, Symbolsatz, Status, Stab/Task Force/Täuschung, Feld 9–10, Eintrag, Zusatz 1, Zusatz 2
function msSidc() {
  var hq = ($('ms-dummy').checked ? 1 : 0) + ($('ms-stab').checked ? 2 : 0) + ($('ms-tf').checked ? 4 : 0);
  return '10' + $('ms-kontext').value + msWert('ms-zug') + $('ms-satz').value + msWert('ms-status') + hq + ($('ms-groesse').value || '00') +
    ($('ms-art').value || '000000') + ($('ms-m1').value || '00') + ($('ms-m2').value || '00');
}
// Aktuelle Auswahl als speicherbare Angaben (ohne Größe der Darstellung)
function msAuswahl() {
  var farbe = $('ms-farbe').value;
  var o = { fill: farbe !== 'ohne', colorMode: farbe === 'ohne' ? 'Light' : farbe, standard: 'APP6' };
  if ($('ms-bez').value.trim()) o.uniqueDesignation = $('ms-bez').value.trim();
  if ($('ms-hoeher').value.trim()) o.higherFormation = $('ms-hoeher').value.trim();
  if ($('ms-info').value.trim()) o.additionalInformation = $('ms-info').value.trim();
  if ($('ms-staerke').value) o.reinforcedReduced = $('ms-staerke').value;
  document.querySelectorAll('#ms-felder input[data-ms-feld]').forEach(function (el) {
    var v = el.value.trim(), k = el.getAttribute('data-ms-feld');
    if (!v) return;
    if (k === 'direction') { var n = parseFloat(v.replace(',', '.')); if (isFinite(n)) o.direction = ((n % 360) + 360) % 360; }
    else o[k] = v;
  });
  var satz = $('ms-satz').value, g = $('ms-groesse').value, gl = $('ms-groesse').selectedOptions[0];
  return { sidc: msSidc(), opt: o, name: msNameKurz(satz, $('ms-art').value) + (g && g !== '00' && gl ? ', ' + gl.textContent.replace(/\s*\(.*\)$/, '') : '') };
}
function msSymbolAus(a, groesse) {
  var o = {};
  Object.keys(a.opt || {}).forEach(function (k) { o[k] = a.opt[k]; });
  o.size = groesse || 80;
  return new window.ms.Symbol(a.sidc, o);
}
function msSymbol(groesse) { return msSymbolAus(msAuswahl(), groesse); }
// Formular aus einem gespeicherten Zeichen füllen (Code und Beschriftungen)
function msFormularSetzen(z) {
  var c = z.sidc, o = z.opt || {};
  var r = document.querySelector('input[name="ms-zug"][value="' + c.charAt(3) + '"]');
  if (r) r.checked = true;
  r = document.querySelector('input[name="ms-status"][value="' + c.charAt(6) + '"]');
  if (r) r.checked = true;
  $('ms-kontext').value = ['0', '1', '2'].indexOf(c.charAt(2)) >= 0 ? c.charAt(2) : '0';
  var hq = +c.charAt(7);
  $('ms-dummy').checked = (hq & 1) === 1;
  $('ms-stab').checked = (hq & 2) === 2;
  $('ms-tf').checked = (hq & 4) === 4;
  if (msSatz(c.substr(4, 2))) $('ms-satz').value = c.substr(4, 2);
  $('ms-suche').value = '';
  msArtenFuellen(c.substr(10, 6));
  msZusaetzeFuellen(c.substr(16, 2), c.substr(18, 2));
  if ($('ms-groesse').querySelector('option[value="' + c.substr(8, 2) + '"]')) $('ms-groesse').value = c.substr(8, 2);
  $('ms-staerke').value = o.reinforcedReduced || '';
  $('ms-farbe').value = o.fill === false ? 'ohne' : (o.colorMode || 'Medium');
  $('ms-bez').value = o.uniqueDesignation || '';
  $('ms-hoeher').value = o.higherFormation || '';
  $('ms-info').value = o.additionalInformation || '';
  document.querySelectorAll('#ms-felder input[data-ms-feld]').forEach(function (el) { var k = el.getAttribute('data-ms-feld'); el.value = o[k] !== undefined ? o[k] : ''; });
  renderSymbol();
}
function renderSymbol() {
  if (!msGeladen) return;
  var sidc = msSidc();
  $('ms-code').textContent = sidc;
  var sym = msSymbol(80);
  var v = typeof sym.isValid === 'function' && !sym.isValid() ? '<p class="hint">Diese Kombination ist in APP-6D nicht vorgesehen, das Zeichen ist unvollständig.</p>' : '';
  $('ms-vorschau').innerHTML = sym.asSVG() + v;
  $('ms-vorschau').setAttribute('aria-label', 'Taktisches Zeichen: ' + msAuswahl().name);
  msFavKnopf();
}

// Meine Zeichen: oft gebrauchte Zeichen als Favoriten (im Browser gespeichert, wie alle Favoriten)
function msFavSchluessel(a) { return a.sidc + JSON.stringify(a.opt || {}); }
function msFavGefunden(a) { var k = msFavSchluessel(a); return FAV.zeichen.filter(function (z) { return msFavSchluessel(z) === k; })[0]; }
function msFavKnopf() {
  var an = !!msFavGefunden(msAuswahl());
  $('ms-fav').setAttribute('aria-pressed', String(an));
  $('ms-fav').lastChild.textContent = an ? 'In meinen Zeichen ✓' : 'Zu meinen Zeichen';
}
function msFavName(z) { return z.name + (z.opt && z.opt.uniqueDesignation ? ' · ' + z.opt.uniqueDesignation : '') + (z.opt && z.opt.higherFormation ? ' / ' + z.opt.higherFormation : ''); }
// Kacheln in einen Container zeichnen; die Bibliothek wird bei Bedarf nachgeladen
function msFavZeigen(id) {
  var el = $(id);
  if (!FAV.zeichen.length) { el.innerHTML = ''; return; }
  ladeMilsymbol().then(function () {
    el.innerHTML = FAV.zeichen.map(function (z) {
      var svg = '';
      try { svg = msSymbolAus(z, 34).asSVG(); } catch (e) { svg = ''; }
      return '<div class="msfav"><button type="button" class="msfav-zeichen" data-msfav="' + esc(z.id) + '" aria-label="' + esc(msFavName(z)) + '">' +
        '<span class="bild">' + svg + '</span><span class="name">' + esc(msFavName(z)) + '</span></button>' +
        '<button type="button" class="msfav-weg" data-msfav-weg="' + esc(z.id) + '" aria-label="Aus meinen Zeichen entfernen: ' + esc(msFavName(z)) + '">×</button></div>';
    }).join('');
  }, function () { el.innerHTML = '<p class="hint">Die Zeichen-Bibliothek konnte nicht geladen werden.</p>'; });
}
function msFavAlleZeigen() {
  $('msfav-leer').hidden = FAV.zeichen.length > 0;
  msFavZeigen('msfav-liste');
  if (typeof lageFavZeigen === 'function') lageFavZeigen();
}
function msFavWeg(id) {
  FAV.zeichen = FAV.zeichen.filter(function (z) { return z.id !== id; });
  favSpeichern();
  msFavAlleZeigen();
  if (msGeladen) msFavKnopf();
  if (aktuelleAnsicht === 'favoriten') renderFavoriten();
}
function msFavHolen(id) { return FAV.zeichen.filter(function (z) { return z.id === id; })[0]; }
$('ms-fav').addEventListener('click', function () {
  if (!msGeladen) return;
  var a = msAuswahl(), da = msFavGefunden(a);
  if (da) { msFavWeg(da.id); return; }
  FAV.zeichen.unshift({ id: 'm' + Date.now(), sidc: a.sidc, opt: a.opt, name: a.name });
  FAV.zeichen = FAV.zeichen.slice(0, 40);
  favSpeichern();
  msFavAlleZeigen();
  msFavKnopf();
});
// Antippen öffnet das Zeichen im Baukasten, × entfernt es
function msFavKlick(e) {
  var weg = e.target.closest('button[data-msfav-weg]');
  if (weg) { msFavWeg(weg.getAttribute('data-msfav-weg')); return; }
  var b = e.target.closest('button[data-msfav]'), z = b && msFavHolen(b.getAttribute('data-msfav'));
  if (!z) return;
  if (aktuelleAnsicht !== 'symbole') go('symbole');
  ladeMilsymbol().then(function () { msFormularSetzen(z); $('ms-vorschau').scrollIntoView({ block: 'center' }); });
}
$('msfav-liste').addEventListener('click', msFavKlick);
$('fav-zeichen').addEventListener('click', msFavKlick);

// Bedienung
$('ms-satz').addEventListener('change', function () { $('ms-suche').value = ''; msArtenFuellen(); msZusaetzeFuellen(); renderSymbol(); });
$('ms-suche').addEventListener('input', function () { if (msGeladen) { msArtenFuellen(); renderSymbol(); } });
['ms-zug', 'ms-status'].forEach(function (id) { $(id).addEventListener('change', renderSymbol); });
['ms-art', 'ms-m1', 'ms-m2', 'ms-groesse', 'ms-kontext', 'ms-stab', 'ms-tf', 'ms-dummy', 'ms-staerke', 'ms-farbe'].forEach(function (id) { $(id).addEventListener('change', renderSymbol); });
['ms-bez', 'ms-hoeher', 'ms-info'].forEach(function (id) { $(id).addEventListener('input', renderSymbol); });
$('ms-felder').addEventListener('input', renderSymbol);

// Herunterladen
function msDateiname(endung) {
  var t = ($('ms-bez').value.trim() || msAuswahl().name).toLowerCase()
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
