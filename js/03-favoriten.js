/* MeinKamerad – Favoriten (im Browser gespeichert). Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

/* ===== Favoriten (im Browser gespeichert) ===== */
var FAV_KEY = 'meinkamerad-favoriten';
var SEITEN_FAV = { rechner: ['Rechner', 'i-calc', 'Dienstgrad, Stufe, Familie und Zulagen zum Bruttobetrag'],
  dienstgrade: ['Dienstgrade', 'i-rank', 'Alle Dienstgrade mit Besoldungsgruppe'],
  zulagen: ['Zulagen', 'i-plus', 'Führungszulagen, Stellenzulagen, Auslandsverwendung'],
  vergleich: ['Vergleich', 'i-vgl', 'Dienstgrade nebeneinander vergleichen'],
  urlaub: ['Urlaubskartei', 'i-cal', 'Urlaub, Überstunden, ATB und Kalender-Export'],
  duz: ['DuZ-Rechner', 'i-clock', 'Dienste zu ungünstigen Zeiten, Übersicht je Monat, Quartal und Jahr'] };
var CALC_KEYS = ['tsk', 'gruppe', 'dienstgrad', 'bg', 'stufe', 'verheiratet', 'kinder', 'partner', 'kgBei', 'frageFue', 'frageStelle', 'frageDuz', 'frageAvz', 'duzMonat', 'stkl', 'kirche', 'pvMonat',
  'fuehrung', 'stelle', 'dauer', 'gebiet', 'tage', 'amtHerausgehoben'];
function favLeer() { return { seiten: [], dienstgrade: [], zulagen: [], berechnungen: [], zeichen: [] }; }
function favLaden() {
  var f = favLeer();
  try {
    var j = JSON.parse(localStorage.getItem(FAV_KEY) || 'null');
    if (j && typeof j === 'object') Object.keys(f).forEach(function (k) { if (Array.isArray(j[k])) f[k] = j[k]; });
  } catch (e) { /* ohne Speicher geht es mit leeren Favoriten weiter */ }
  return f;
}
var FAV = favLaden();
function favSpeichern() {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(FAV)); } catch (e) { /* Speichern nicht möglich, Favoriten gelten bis zum Neuladen */ }
}
function istFav(art, id) { return FAV[art].indexOf(id) >= 0; }
function favUmschalten(art, id) {
  if (istFav(art, id)) FAV[art] = FAV[art].filter(function (x) { return x !== id; });
  else FAV[art].push(id);
  favSpeichern();
}
function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
// Über „MeinKamerad“ (Text aus daten.js, Absätze mit Leerzeile getrennt)
(function () {
  var t = typeof D.ueber === 'string' ? D.ueber.trim() : '';
  $('ueber-text').innerHTML = t ? t.split(/\n\s*\n/).map(function (a) { return '<p>' + esc(a.trim()).replace(/\n/g, '<br>') + '</p>'; }).join('')
    : '<p class="hint" style="margin-top:0">Text folgt.</p>';
})();
function sternKlein(key, name) {
  var an = istFav('zulagen', key);
  return '<button type="button" class="stern-klein" data-fav-zul="' + key + '" aria-pressed="' + an + '" aria-label="' +
    (an ? 'Aus Favoriten entfernen: ' : 'Als Favorit markieren: ') + esc(name) + '"><svg class="ic" aria-hidden="true"><use href="#i-star"/></svg></button>';
}
function renderSeitenStern() {
  var s = SEITEN_FAV[aktuelleAnsicht];
  $('seite-fav').hidden = !s;
  if (!s) return;
  var an = istFav('seiten', aktuelleAnsicht);
  $('seite-fav').setAttribute('aria-pressed', String(an));
  $('seite-fav').setAttribute('aria-label', (an ? 'Seite aus Favoriten entfernen: ' : 'Seite zu Favoriten hinzufügen: ') + s[0]);
}
function zulageAusKey(key) {
  var t = key.split(':'), liste = t[0] === 'fuehrung' ? FUEHRUNG : STELLENZULAGEN;
  var z = liste.filter(function (x) { return x.id === t[1]; })[0];
  return z ? { art: t[0], z: z } : null;
}
function renderFavoriten() {
  var d = aktuell();
  var seiten = FAV.seiten.filter(function (k) { return SEITEN_FAV[k]; });
  var dgs = FAV.dienstgrade.map(dgById).filter(Boolean);
  var zul = FAV.zulagen.map(zulageAusKey).filter(Boolean);
  var calc = FAV.berechnungen.filter(function (b) { return b && b.snap && dgById(b.snap.dienstgrad); });
  var zeichen = FAV.zeichen.filter(function (z) { return z && z.sidc; });
  $('fav-leer').hidden = !!(seiten.length || dgs.length || zul.length || calc.length || zeichen.length);
  $('fav-zeichen-wrap').hidden = !zeichen.length;
  if (zeichen.length) msFavZeigen('fav-zeichen');

  $('fav-seiten-wrap').hidden = !seiten.length;
  $('fav-seiten').innerHTML = seiten.map(function (k) {
    var s = SEITEN_FAV[k];
    return '<a class="tile" href="#' + k + '"><span class="box"><svg class="ic"><use href="#' + s[1] + '"/></svg></span><span><span class="tt">' + s[0] + '</span><span class="td">' + s[2] + '</span></span></a>';
  }).join('');

  $('fav-calc-wrap').hidden = !calc.length;
  $('fav-calc').innerHTML = calc.map(function (b) {
    return '<div class="fav-item"><button type="button" class="zeile" data-fav-calc="' + esc(b.id) + '"><span class="n">' + esc(b.name) + '</span><span class="r">' + esc(b.brutto) + '</span>' +
      '<span class="s">' + esc(b.kette) + ' · Stand beim Speichern</span></button>' +
      '<button type="button" class="stern-klein loeschen" data-fav-calc-weg="' + esc(b.id) + '" aria-label="Berechnung löschen: ' + esc(b.name) + '">×</button></div>';
  }).join('');

  $('fav-dg-wrap').hidden = !dgs.length;
  $('fav-dg').innerHTML = dgs.map(function (x) {
    var b0 = x.bgs[0];
    var ab = istA(b0) ? 'Grundgehalt ab ' + eur.format(TAB_A[b0][0]) : 'Fester Betrag ' + eur.format(TAB_B[b0]);
    return '<div class="fav-item"><button type="button" class="zeile mit-icon" data-fav-dg-open="' + x.id + '">' +
      '<span class="rk' + (state.tsk !== 'marine' ? ' bild' : '') + '">' + rangBild(x.id) + '</span><span class="n">' + dgName(x) +
      (abkuerzung(x.id) ? '<span class="abk">' + abkuerzung(x.id) + '</span>' : '') + '</span><span class="r">' + bgsLabel(x.bgs).replace(/ oder /g, ' / ') + '</span><span class="s">' + ab + '</span></button>' +
      '<button type="button" class="stern-klein" data-fav-dg-weg="' + x.id + '" aria-pressed="true" aria-label="Aus Favoriten entfernen: ' + esc(dgName(x)) + '"><svg class="ic" aria-hidden="true"><use href="#i-star"/></svg></button></div>';
  }).join('');

  $('fav-zul-wrap').hidden = !zul.length;
  $('fav-zul-kopf').textContent = 'Beträge für ' + d.name + ' (' + bgLabel(d.bg) + '). Tippe auf eine Zulage, um sie im Rechner zu wählen.';
  $('fav-zul').innerHTML = zul.map(function (x) {
    var text, z = x.z;
    if (x.art === 'fuehrung') {
      var fb = fuehrungBetrag(z, d);
      text = fb === null ? 'Nur für ' + gruppenText(z.gruppen) : eur.format(fb) + ' pro Monat';
    } else if (z.nurGruppen && !inGruppen(d.bg, z.nurGruppen)) {
      text = 'Nur für ' + gruppenText(z.nurGruppen);
    } else if (z.dauer) {
      text = z.dauer.map(function (y) { return y.label + ' ' + eur.format(y.betrag); }).join(' · ');
    } else {
      var sb = z.betrag(d);
      text = sb === null ? 'Für ' + bgLabel(d.bg) + ' nicht hinterlegt' : eur.format(sb) + ' pro Monat';
    }
    return '<div class="fav-item"><button type="button" class="zeile" data-fav-zul-open="' + x.art + ':' + z.id + '"><span class="n">' + z.name + '</span><span class="r">Nr. ' + z.nr.split(' ')[0] + '</span>' +
      '<span class="s">' + (x.art === 'fuehrung' ? 'Führungsfunktion · ' : 'Besondere Verwendung · ') + text + '</span></button>' +
      sternKlein(x.art + ':' + z.id, z.name) + '</div>';
  }).join('');
}
