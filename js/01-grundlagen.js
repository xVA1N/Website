/* MeinKamerad – Daten aus daten.js, Hilfsfunktionen, Reiter und Aufbau der Bedienelemente. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';

/* ===== DATEN: kommen aus daten.js (window.MK_DATEN). Hier wird nichts von Hand eingetragen. ===== */
var D = window.MK_DATEN;
if (!D) {
  document.querySelector('.wrap').insertAdjacentHTML('afterbegin',
    '<p class="notice" role="alert"><strong>Die Datei daten.js fehlt oder enthält einen Fehler.</strong> Bitte prüfen, ob sie neben index.html liegt und Kommas und Anführungszeichen stimmen.</p>');
  throw new Error('daten.js fehlt oder ist fehlerhaft');
}
var TAB_A = D.grundgehaltA;
var TAB_B = D.grundgehaltB;
var FZ = D.familienzuschlag;
var STUFE_MIN = D.stufeVon;
var STUFE_MAX = STUFE_MIN + TAB_A.A3.length - 1;
var AVZ = D.auslandsverwendung;
var AVZ_STUFEN = AVZ.tagessatzJeStufe;

function nr(bg) { return parseInt(bg.slice(1), 10); }
// "A3-A5, B1" -> passt die Besoldungsgruppe bg hinein?
function inGruppen(bg, text) {
  if (!text) return true;
  return text.split(',').some(function (teil) {
    var r = teil.replace(/\s/g, '').split('-'), von = r[0], bis = r[1] || r[0];
    return von.charAt(0) === bg.charAt(0) && bis.charAt(0) === bg.charAt(0) && nr(bg) >= nr(von) && nr(bg) <= nr(bis);
  });
}
// Laufbahn für Erhöhungsbeträge und Zulagen. Offizieranwärter zählen wie Unteroffiziere,
// Unteroffizieranwärter (in A 3 und A 4) wie Mannschaften.
function laufbahn(gruppe) {
  if (gruppe === 'mannschaft' || gruppe === 'uffz_anw') return 'Mannschaften';
  if (['leutnant', 'hauptmann', 'stabsoffz', 'general'].indexOf(gruppe) >= 0) return 'Offiziere';
  return 'Unteroffiziere';
}
function passt(eintrag, d) {
  return inGruppen(d.bg, eintrag.gruppen) && (!eintrag.laufbahn || eintrag.laufbahn === laufbahn(d.gruppe));
}
function erhoehung(d) {
  var e = D.erhoehungsbetraege.filter(function (x) { return passt(x, d); })[0];
  return e ? e.betrag : 0;
}
function plusFuer(tabelle, bg) {
  for (var k in tabelle) { if (inGruppen(bg, k)) return tabelle[k]; }
  return 0;
}
// partner: Partner/in im öffentlichen Dienst. kgBeiMir: ich erhalte das Kindergeld.
function stufe1(verheiratet, partner) {
  if (!verheiratet) return 0;
  return Math.round(FZ.verheiratet * (partner ? FZ.anteilStufe1BeiPartnerImOeD : 1) * 100) / 100;
}
function familienzuschlag(bg, verheiratet, kinder, partner, kgBeiMir) {
  var b = stufe1(verheiratet, partner);
  if (partner && !kgBeiMir) kinder = 0;
  for (var k = 1; k <= kinder; k++) {
    b += k === 1 ? FZ.erstesKind : k === 2 ? FZ.zweitesKind : FZ.jedesWeitereKind;
    b += plusFuer(k === 1 ? FZ.plusErstesKind : FZ.plusWeiteresKind, bg);
  }
  return Math.round(b * 100) / 100;
}

var STELLENZULAGEN = [{ id: 'keine', name: 'Keine Stellenzulage' }].concat(D.stellenzulagen.map(function (z) {
  var o = { id: z.id, name: z.name, nr: z.nr, dauer: z.dauer, quelle: z.quelle, auswahlLabel: z.auswahlLabel,
    nurGruppen: z.nurGruppen, nebenAnderen: z.nebenAnderen, differenzNeben: z.differenzNeben || [], nichtNebenAVZ: z.nichtNebenAVZ,
    vollNeben: z.vollNeben || [], nurDienstgrade: z.nurDienstgrade, nurDienstgradeText: z.nurDienstgradeText, hinweis: z.hinweis };
  if (z.staffel) o.betrag = function (d) {
    var e = z.staffel.filter(function (x) { return passt(x, d); })[0];
    return e ? e.betrag : null;
  };
  return o;
}));
var EINSATZGEBIETE = [{ id: 'keine', name: 'Keine Auslandsverwendung', stufe: 0 }].concat(AVZ.gebiete);
var FUEHRUNG = [{ id: 'keine', name: 'Keine Führungsfunktion' }].concat(D.fuehrungszulagen);
// Betrag der Führungszulage, null wenn sie für diese Besoldungsgruppe nicht vorgesehen ist
function gruppenText(t) { return t.replace(/-/g, ' bis ').replace(/([AB])(\d)/g, '$1 $2'); }
function fuehrungBetrag(f, d) {
  if (!f.betrag) return 0;
  return f.gruppen && !inGruppen(d.bg, f.gruppen) ? null : f.betrag;
}

var GRUPPEN = [
  { id: 'mannschaft', name: 'Mannschaften', standard: 'ogefr' },
  { id: 'uffz_ohne', name: 'Unteroffiziere ohne Portepee', standard: 'uffz' },
  { id: 'fw_anw', name: 'Feldwebelanwärter', standard: 'uffz_fa' },
  { id: 'uffz_mit', name: 'Unteroffiziere mit Portepee', standard: 'fw' },
  { id: 'uffz_anw', name: 'Unteroffizieranwärter', standard: 'ogefr_ua' },
  { id: 'anwaerter', name: 'Offizieranwärter', standard: 'faehnrich' },
  { id: 'leutnant', name: 'Leutnante', standard: 'lt' },
  { id: 'hauptmann', name: 'Hauptleute', standard: 'hptm' },
  { id: 'stabsoffz', name: 'Stabsoffiziere', standard: 'maj' },
  { id: 'general', name: 'Generale', standard: 'bgen' }
];
var TSK = [
  { id: 'heer', name: 'Heer' },
  { id: 'luft', name: 'Luftwaffe' },
  { id: 'marine', name: 'Marine' },
  { id: 'san', name: 'Sanitätsdienst' }
];
// Im Sanitätsdienst gelten bis zu den Leutnanten die üblichen Dienstgrade, darüber die Sanitätsoffiziere.
var SAN_UNTEN = ['mannschaft', 'uffz_ohne', 'uffz_mit', 'uffz_anw', 'fw_anw', 'anwaerter', 'leutnant'];
// dg: Dienstgrad mit Namen je Teilstreitkraft (Heer, Marine, optional Luftwaffe und Sanitätsdienst)
function dg(id, heer, marine, gruppe, bgs, amt, o) {
  o = o || {};
  return { id: id, gruppe: gruppe, bgs: bgs, amt: amt, zusatz: '',
    n: { heer: heer, luft: o.luft || heer, marine: marine, san: SAN_UNTEN.indexOf(gruppe) >= 0 ? (o.san || heer) : null } };
}
// sdg: Sanitätsoffizier, nur im Sanitätsdienst
function sdg(id, name, gruppe, bgs, zusatz) {
  return { id: id, gruppe: gruppe, bgs: bgs, zusatz: zusatz, n: { heer: null, luft: null, marine: null, san: name } };
}
// Zuordnung nach Anlage I BBesG (Besoldungsordnungen A und B), noch gegenzuprüfen.
// bgs: mögliche Besoldungsgruppen. amt: 'ja' = Amtszulage, 'möglich' = bei herausgehobener Funktion.
var DIENSTGRADE = [
  dg('soldat', 'Soldat (z. B. Grenadier, Jäger, Kanonier)', 'Matrose', 'mannschaft', ['A3'], undefined, { luft: 'Flieger', san: 'Sanitätssoldat' }),
  dg('gefr', 'Gefreiter', 'Gefreiter', 'mannschaft', ['A3'], 'ja'),
  dg('ogefr', 'Obergefreiter', 'Obergefreiter', 'mannschaft', ['A4']),
  dg('hgefr', 'Hauptgefreiter', 'Hauptgefreiter', 'mannschaft', ['A4'], 'ja'),
  dg('stgefr', 'Stabsgefreiter', 'Stabsgefreiter', 'mannschaft', ['A5']),
  dg('ostgefr', 'Oberstabsgefreiter', 'Oberstabsgefreiter', 'mannschaft', ['A5'], 'ja'),
  dg('korp', 'Korporal', 'Korporal', 'mannschaft', ['A6']),
  dg('stkorp', 'Stabskorporal', 'Stabskorporal', 'mannschaft', ['A6']),
  dg('uffz', 'Unteroffizier', 'Maat', 'uffz_ohne', ['A5']),
  dg('stuffz', 'Stabsunteroffizier', 'Obermaat', 'uffz_ohne', ['A6', 'A7']),
  dg('fw', 'Feldwebel', 'Bootsmann', 'uffz_mit', ['A7']),
  dg('ofw', 'Oberfeldwebel', 'Oberbootsmann', 'uffz_mit', ['A7'], 'ja'),
  dg('hfw', 'Hauptfeldwebel', 'Hauptbootsmann', 'uffz_mit', ['A8'], 'ja'),
  dg('stfw', 'Stabsfeldwebel', 'Stabsbootsmann', 'uffz_mit', ['A9']),
  dg('ostfw', 'Oberstabsfeldwebel', 'Oberstabsbootsmann', 'uffz_mit', ['A9'], 'möglich'),
  dg('schuetze_ua', 'Schütze (UA)', 'Matrose (UA)', 'uffz_anw', ['A3'], undefined, { luft: 'Flieger (UA)', san: 'Sanitätssoldat (UA)' }),
  dg('gefr_ua', 'Gefreiter (UA)', 'Gefreiter (UA)', 'uffz_anw', ['A3']),
  dg('ogefr_ua', 'Obergefreiter (UA)', 'Obergefreiter (UA)', 'uffz_anw', ['A4']),
  dg('hgefr_ua', 'Hauptgefreiter (UA)', 'Hauptgefreiter (UA)', 'uffz_anw', ['A4']),
  dg('gefr_fa', 'Gefreiter (FA)', 'Gefreiter (FA)', 'fw_anw', ['A3']),
  dg('uffz_fa', 'Unteroffizier (FA)', 'Maat (FA)', 'fw_anw', ['A5']),
  dg('fj', 'Fahnenjunker', 'Seekadett', 'anwaerter', ['A5']),
  dg('faehnrich', 'Fähnrich', 'Fähnrich zur See', 'anwaerter', ['A7']),
  dg('ofaehnrich', 'Oberfähnrich', 'Oberfähnrich zur See', 'anwaerter', ['A8'], 'ja'),
  dg('lt', 'Leutnant', 'Leutnant zur See', 'leutnant', ['A9']),
  dg('olt', 'Oberleutnant', 'Oberleutnant zur See', 'leutnant', ['A10']),
  dg('hptm', 'Hauptmann', 'Kapitänleutnant', 'hauptmann', ['A11', 'A12']),
  dg('sthptm', 'Stabshauptmann', 'Stabskapitänleutnant', 'hauptmann', ['A13'], 'möglich'),
  dg('maj', 'Major', 'Korvettenkapitän', 'stabsoffz', ['A13']),
  dg('oberstlt', 'Oberstleutnant', 'Fregattenkapitän', 'stabsoffz', ['A14', 'A15']),
  dg('oberst', 'Oberst', 'Kapitän zur See', 'stabsoffz', ['A16', 'B2', 'B3']),
  dg('bgen', 'Brigadegeneral', 'Flottillenadmiral', 'general', ['B6']),
  dg('gmaj', 'Generalmajor', 'Konteradmiral', 'general', ['B7']),
  dg('glt', 'Generalleutnant', 'Vizeadmiral', 'general', ['B9']),
  dg('gen', 'General', 'Admiral', 'general', ['B10']),
  sdg('sa13', 'Stabsarzt', 'hauptmann', ['A13'], 'Ebenso Stabsapotheker und Stabsveterinär'),
  sdg('sa14', 'Oberstabsarzt', 'stabsoffz', ['A14'], 'Ebenso Oberstabsapotheker und Oberstabsveterinär'),
  sdg('sa15', 'Oberfeldarzt', 'stabsoffz', ['A15'], 'Ebenso Oberfeldapotheker und Oberfeldveterinär. Marine: Flottillenarzt, Flottillenapotheker'),
  sdg('sa16', 'Oberstarzt', 'stabsoffz', ['A16', 'B2', 'B3'], 'Ebenso Oberstapotheker und Oberstveterinär. Marine: Flottenarzt, Flottenapotheker'),
  sdg('sb6', 'Generalarzt', 'general', ['B6'], 'Ebenso Generalapotheker. Marine: Admiralarzt'),
  sdg('sb7', 'Generalstabsarzt', 'general', ['B7'], 'Marine: Admiralstabsarzt'),
  sdg('sb9', 'Generaloberstabsarzt', 'general', ['B9'], 'Marine: Admiraloberstabsarzt')
];

// NATO-Rangcode nach STANAG 2116 (OR = Mannschaften und Unteroffiziere, OF = Offiziere)
var NATO_RANG = {
  soldat: 'OR-1', schuetze_ua: 'OR-1', gefr: 'OR-2', gefr_ua: 'OR-2', gefr_fa: 'OR-2',
  ogefr: 'OR-3', ogefr_ua: 'OR-3', hgefr: 'OR-4', hgefr_ua: 'OR-4', stgefr: 'OR-4', ostgefr: 'OR-4',
  korp: 'OR-4', stkorp: 'OR-4', uffz: 'OR-5', uffz_fa: 'OR-5', stuffz: 'OR-5', fj: 'OR-5',
  fw: 'OR-6', ofw: 'OR-6', faehnrich: 'OR-6', hfw: 'OR-7', ofaehnrich: 'OR-7', stfw: 'OR-8', ostfw: 'OR-9',
  lt: 'OF-1', olt: 'OF-1', hptm: 'OF-2', sthptm: 'OF-2', sa13: 'OF-2', maj: 'OF-3', sa14: 'OF-3',
  oberstlt: 'OF-4', sa15: 'OF-4', oberst: 'OF-5', sa16: 'OF-5', bgen: 'OF-6', sb6: 'OF-6',
  gmaj: 'OF-7', sb7: 'OF-7', glt: 'OF-8', sb9: 'OF-8', gen: 'OF-9'
};
// Frühester Beförderungszeitpunkt nach der Soldatenlaufbahnverordnung, gezählt ab Diensteintritt.
// Nur eingetragen, wo die Mindestdienstzeit eindeutig ist (Mannschaften).
var BEFOERDERUNG = { gefr: '3 Monaten', ogefr: '6 Monaten', hgefr: '12 Monaten', stgefr: '36 Monaten', ostgefr: '48 Monaten', korp: '7 Jahren', stkorp: '10 Jahren' };
// Abkürzungen der Dienstgrade: [Heer, Marine, Luftwaffe, Sanitätsdienst]. Fehlt Luftwaffe oder
// Sanitätsdienst, gilt die Abkürzung des Heeres. Anwärterzusätze (UA)/(FA) werden angehängt.
var ABK = {
  soldat: ['z. B. Gren, Jg, Kan', 'Matr', 'Flg', 'SanSdt'],
  gefr: ['Gefr', 'Gefr'], ogefr: ['OGefr', 'OGefr'], hgefr: ['HptGefr', 'HptGefr'],
  stgefr: ['StGefr', 'StGefr'], ostgefr: ['OStGefr', 'OStGefr'], korp: ['Kpl', 'Kpl'], stkorp: ['SKpl', 'SKpl'],
  uffz: ['Uffz', 'Maat'], stuffz: ['StUffz', 'OMaat'],
  fw: ['Fw', 'Btsm'], ofw: ['OFw', 'OBtsm'], hfw: ['HptFw', 'HBtsm'], stfw: ['StFw', 'StBtsm'], ostfw: ['OStFw', 'OStBtsm'],
  schuetze_ua: ['S', 'Matr', 'Flg', 'SanSdt'], gefr_ua: ['Gefr', 'Gefr'], ogefr_ua: ['OGefr', 'OGefr'], hgefr_ua: ['HptGefr', 'HptGefr'],
  gefr_fa: ['Gefr', 'Gefr'], uffz_fa: ['Uffz', 'Maat'],
  fj: ['Fhj', 'SKad'], faehnrich: ['Fhr', 'FhrzS'], ofaehnrich: ['OFhr', 'OFhrzS'],
  lt: ['Lt', 'LtzS'], olt: ['OLt', 'OLtzS'],
  hptm: ['Hptm', 'KptLt'], sthptm: ['StHptm', 'StKptLt'],
  maj: ['Maj', 'KKpt'], oberstlt: ['Oberstlt', 'FKpt'], oberst: ['O', 'KptzS'],
  bgen: ['BrigGen', 'FltlAdm'], gmaj: ['GenMaj', 'KAdm'], glt: ['GenLt', 'VAdm'], gen: ['Gen', 'Adm'],
  sa13: [null, null, null, 'StArzt'], sa14: [null, null, null, 'OStArzt'], sa15: [null, null, null, 'OFArzt'],
  sa16: [null, null, null, 'OTArzt'], sb6: [null, null, null, 'GenArzt'], sb7: [null, null, null, 'GenStArzt'],
  sb9: [null, null, null, 'GenOStArzt']
};
function abkuerzung(id) {
  var a = ABK[id];
  if (!a) return '';
  var i = { heer: 0, marine: 1, luft: 2, san: 3 }[state.tsk];
  var k = a[i] || a[0] || '';
  var zusatz = (id.match(/_(ua|fa)$/) || [])[1];
  return k && zusatz ? k + ' (' + zusatz.toUpperCase() + ')' : k;
}

// Amtszulagen kommen aus daten.js
DIENSTGRADE.forEach(function (x) {
  var az = D.amtszulagen[x.id];
  x.amt = az ? (az.art === 'immer' ? 'ja' : 'möglich') : undefined;
});

/* ===== Hilfen ===== */
function zahlDe(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }
var eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
var $ = function (id) { return document.getElementById(id); };
var bgLabel = function (bg) { return bg.replace(/^([AB])/, '$1 '); };
var istA = function (bg) { return bg.charAt(0) === 'A'; };

var state = {
  tsk: 'heer',
  gruppe: 'uffz_mit',
  dienstgrad: 'fw',
  bg: '',
  stufe: 3,
  verheiratet: false,
  kinder: 0,
  partner: false,
  kgBei: 'ich',
  fuehrung: 'keine',
  stelle: 'keine',
  amtHerausgehoben: false,
  offenDg: '',
  vergleich: [],
  vglStufe: 3,
  vglAmt: false,
  infoDg: '',
  dauer: 0,
  gebiet: 'keine',
  tage: 30,
  frageFue: false,
  frageStelle: false,
  frageDuz: false,
  frageAvz: false,
  duzMonat: '',
  duzZeitraum: 'monat',
  stkl: 0,
  kirche: false,
  pvMonat: 0
};

function sichtbar(d) { return !!d.n[state.tsk]; }
function aktuell() {
  var d = DIENSTGRADE.filter(function (x) { return x.id === state.dienstgrad; })[0];
  var bg = d.bgs.indexOf(state.bg) >= 0 ? state.bg : d.bgs[0];
  return { id: d.id, name: d.n[state.tsk], gruppe: d.gruppe, bgs: d.bgs, amt: d.amt, zusatz: d.zusatz, bg: bg };
}
function bgsLabel(bgs) { return bgs.map(bgLabel).join(' oder '); }
function waehleGruppe(gid) {
  var g = GRUPPEN.filter(function (x) { return x.id === gid; })[0];
  var liste = DIENSTGRADE.filter(function (d) { return d.gruppe === gid && sichtbar(d); });
  var wahl = liste.filter(function (d) { return d.id === g.standard; })[0] || liste[0];
  state.gruppe = gid;
  state.dienstgrad = wahl.id;
  state.bg = '';
}


/* ===== Erklärseiten: Herkunft der Namen der Dienstgradgruppen ===== */
var INFO = {
  mannschaft: { kurz: 'Alle Soldatinnen und Soldaten ohne Unteroffizier- oder Offizierlaufbahn, vom Soldaten bis zum Stabskorporal.', t: [
    ['Mannschaft', 'Ursprünglich die Gesamtheit der Männer einer Truppe oder einer Schiffsbesatzung, abgeleitet von „Mann“. Gemeint sind die Soldaten ohne Führungsaufgabe.'],
    ['Gefreiter', 'Wörtlich der „Gefreite“, also jemand, der von bestimmten Pflichten befreit wurde, etwa vom Wachdienst. Er stand damit über den einfachen Soldaten.'],
    ['Ober-, Haupt-, Stabs-, Oberstabsgefreiter', 'Die Vorsilben zeigen nur die jeweils nächsthöhere Stufe innerhalb der Mannschaften an.'],
    ['Korporal, Stabskorporal', 'Die höchsten Mannschaftsdienstgrade, seit 2021. „Korporal“ kommt über das Französische vom italienischen „caporale“, abgeleitet von „capo“, Kopf: der Anführer einer kleinen Gruppe.'],
    ['Matrose und Flieger', 'Bei der Marine heißt der einfachste Dienstgrad Matrose (niederländisch „matroos“, Seemann), bei der Luftwaffe Flieger.']
  ] },
  uffz_ohne: { kurz: 'Unteroffizier und Stabsunteroffizier, bei der Marine Maat und Obermaat.', t: [
    ['Unteroffizier', 'Der Dienstgrad „unter“ den Offizieren. Unteroffiziere führen kleine Gruppen und bilden aus.'],
    ['Portepee', 'Vom französischen „porte-épée“, Degenträger. Das Portepee war die Quaste am Degen oder Säbel, die nur Offizieren und höheren Unteroffizieren zustand. „Ohne Portepee“ heißt: Diese Unteroffiziere trugen sie nicht.'],
    ['Stabsunteroffizier', 'Die Vorsilbe „Stabs-“ bezeichnet die höhere Stufe innerhalb des Dienstgrades.'],
    ['Maat', 'Marine-Begriff aus dem Niederdeutschen („mate“, Gefährte, Gehilfe). Der Maat war Gehilfe des Bootsmanns.']
  ] },
  uffz_mit: { kurz: 'Feldwebel bis Oberstabsfeldwebel, bei der Marine Bootsmann bis Oberstabsbootsmann.', t: [
    ['Mit Portepee', 'Das Portepee war die Quaste am Säbel (siehe Unteroffiziere ohne Portepee). Wer sie trug, gehörte zu den höheren Unteroffizieren.'],
    ['Feldwebel', 'Früher „Feldweibel“. Ein „Weibel“ war ein Gerichts- oder Amtsdiener. Der Feldweibel sorgte im Feld für Ordnung und Disziplin der Truppe.'],
    ['Ober-, Haupt-, Stabs-, Oberstabsfeldwebel', 'Die Vorsilben zeigen die höheren Stufen an.'],
    ['Bootsmann', 'An Bord beaufsichtigte der Bootsmann Boote, Takelage und Mannschaft. Er ist das Marine-Gegenstück zum Feldwebel.']
  ] },
  uffz_anw: { kurz: 'Soldaten in der Ausbildung zum Unteroffizier. Hinter dem Dienstgrad steht „(UA)“.', t: [
    ['Anwärter', 'Wer eine „Anwartschaft“ hat, also auf eine Laufbahn vorbereitet wird, ohne sie schon erreicht zu haben.'],
    ['UA', 'Kürzel für Unteroffizieranwärter. Der Zusatz in Klammern zeigt, dass der Dienstgrad im Anwärterstatus geführt wird.']
  ] },
  fw_anw: { kurz: 'Soldaten in der Ausbildung zum Feldwebel. Hinter dem Dienstgrad steht „(FA)“.', t: [
    ['Anwärter', 'Wer eine „Anwartschaft“ hat, also auf eine Laufbahn vorbereitet wird, ohne sie schon erreicht zu haben.'],
    ['FA', 'Kürzel für Feldwebelanwärter. Der Zusatz in Klammern zeigt den Anwärterstatus. Auf der Schulterklappe erkennt man ihn an einer Litze am unteren Rand.']
  ] },
  anwaerter: { kurz: 'Soldaten in der Ausbildung zum Offizier: Fahnenjunker, Fähnrich und Oberfähnrich, bei der Marine Seekadett und Fähnrich zur See.', t: [
    ['Fahnenjunker', '„Junker“ kommt von mittelhochdeutsch „juncherre“, junger Herr. Gemeint war der adlige Nachwuchs, der zur Fahne gehörte.'],
    ['Fähnrich', 'Der Fahnenträger. Früher trug der jüngste Offizier die Fahne („Fähnlein“) seiner Einheit.'],
    ['Oberfähnrich', 'Die höhere Stufe des Fähnrichs.'],
    ['Seekadett', 'Bei der Marine. „Kadett“ kommt vom französischen „cadet“, dem jüngeren Sohn und späteren Zögling einer Militärschule.'],
    ['Silberne Litze', 'Offizieranwärter erkennt man auf der Schulterklappe an der silbernen Litze am unteren Rand.']
  ] },
  leutnant: { kurz: 'Leutnant und Oberleutnant, bei der Marine Leutnant zur See und Oberleutnant zur See.', t: [
    ['Leutnant', 'Vom französischen „lieutenant“: „lieu“ heißt Ort oder Platz, „tenant“ haltend. Der Leutnant ist also der „Platzhalter“ oder Stellvertreter, ursprünglich der des Hauptmanns.'],
    ['Oberleutnant', 'Die höhere Stufe des Leutnants.'],
    ['Zur See', 'Der Zusatz kennzeichnet bei der Marine die Seeoffiziere.']
  ] },
  hauptmann: { kurz: 'Hauptmann und Stabshauptmann, bei der Marine Kapitänleutnant und Stabskapitänleutnant. Im Sanitätsdienst Stabsarzt.', t: [
    ['Hauptmann', 'Der „Anführer“ einer Kompanie. Das Wort geht auf lateinisch „capitaneus“ zurück, den, der am „Kopf“ (caput, Haupt) steht.'],
    ['Kapitänleutnant', 'Marine-Dienstgrad mit gleichem Ursprung wie „Kapitän“ (capitaneus). Er entspricht dem Hauptmann.'],
    ['Stabsarzt', 'Im Sanitätsdienst: Arzt im Rang eines Hauptmanns. „Stab“ steht hier für die höhere Stufe.']
  ] },
  stabsoffz: { kurz: 'Major, Oberstleutnant und Oberst, bei der Marine Korvettenkapitän, Fregattenkapitän und Kapitän zur See.', t: [
    ['Stabsoffizier', 'Offiziere, die im „Stab“ eines Kommandeurs arbeiten oder selbst Verbände führen. Der Stab ist das Führungs- und Planungsteam einer Einheit.'],
    ['Major', 'Von lateinisch „maior“, der Größere. Er steht über dem Hauptmann.'],
    ['Oberstleutnant', 'Der Stellvertreter des Obersten.'],
    ['Oberst', 'Von „oberster“: der oberste Offizier eines Regiments.'],
    ['Korvettenkapitän, Fregattenkapitän', 'Bei der Marine. Korvette und Fregatte sind Schiffstypen, nach denen die Stufen benannt sind.'],
    ['Oberstabsarzt, Oberfeldarzt, Oberstarzt', 'Entsprechende Dienstgrade im Sanitätsdienst. Ein „Feldarzt“ ist ein Arzt im Feld.']
  ] },
  general: { kurz: 'Brigadegeneral, Generalmajor, Generalleutnant und General, bei der Marine Flottillenadmiral, Konteradmiral, Vizeadmiral und Admiral.', t: [
    ['General', 'Von lateinisch „generalis“, allgemein. Ein General hat „allgemeine“ Befehlsgewalt, nicht nur über einen einzelnen Truppenteil.'],
    ['Brigadegeneral', 'Führt in der Regel eine Brigade.'],
    ['Generalmajor, Generalleutnant', 'Mehr Stufen über dem Brigadegeneral. „Leutnant“ steht hier für „Stellvertreter“ des Generals.'],
    ['Admiral', 'Aus dem Arabischen („amir al-bahr“, Herrscher des Meeres). Bei der Marine tragen die Generale diese Bezeichnung.'],
    ['Generalarzt und weitere', 'Entsprechende Dienstgrade im Sanitätsdienst.']
  ] }
};
function zeigeGruppe(slug) {
  var gid = slug.replace(/-/g, '_'), g = GRUPPEN.filter(function (x) { return x.id === gid; })[0], inf = INFO[gid];
  if (!g || !inf) { go('dienstgrade'); return null; }
  $('gruppe-inhalt').innerHTML =
    '<a class="zurueck" href="#dienstgrade"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Zurück zu den Dienstgraden</a>' +
    '<section class="panel"><h2>Was gehört dazu?</h2><p>' + inf.kurz + '</p></section>' +
    '<section class="panel"><h2>Woher kommt der Name?</h2><dl class="begriffe">' +
    inf.t.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl></section>' +
    '<p class="hint">Die Erklärungen sind aus allgemeinem Sprachwissen zusammengestellt, nicht aus einer amtlichen Quelle.</p>';
  return g.name;
}

/* ===== Reiter ===== */
var VIEWS = { start: 'Was möchtest du öffnen?', rechner: 'Rechner', dienstgrade: 'Dienstgrade', zulagen: 'Zulagen', mehr: 'Mehr', vergleich: 'Vergleich', favoriten: 'Favoriten', urlaub: 'Urlaubskartei', duz: 'DuZ-Rechner', profil: 'Mein Profil', symbole: 'Taktische Zeichen', lage: 'Lagekarte' };

function show(v) {
  var titel = null, tab = v;
  if (v.indexOf('gruppe-') === 0) {
    titel = zeigeGruppe(v.slice(7));
    if (titel === null) return;
    v = 'gruppe'; tab = 'dienstgrade';
  }
  if (!VIEWS[v] && v !== 'gruppe') v = tab = 'start';
  // Werkzeuge erreicht man über Start, deshalb ist dort der Reiter Start aktiv
  if (['rechner', 'dienstgrade', 'zulagen', 'vergleich', 'gruppe', 'urlaub', 'duz', 'symbole', 'lage'].indexOf(v) >= 0) tab = 'start';
  if (v === 'profil') tab = '';
  ['start', 'rechner', 'dienstgrade', 'zulagen', 'mehr', 'gruppe', 'vergleich', 'favoriten', 'urlaub', 'duz', 'profil', 'symbole', 'lage'].forEach(function (k) { $('view-' + k).hidden = k !== v; });
  document.querySelector('.wrap').setAttribute('data-view', v);
  aktuelleAnsicht = v;
  renderLeiste();
  renderSeitenStern();
  if (v === 'favoriten') renderFavoriten();
  if (v === 'urlaub') renderUrlaub();
  if (v === 'duz') render();
  if (v === 'profil') renderProfil();
  if (v === 'symbole') zeigeSymbole();
  if (v === 'lage') zeigeLage();
  if (v === 'profil') $('profil-btn').setAttribute('aria-current', 'page'); else $('profil-btn').removeAttribute('aria-current');
  if (v === 'rechner') renderProfilHinweis();
  $('titel').textContent = titel || VIEWS[v];
  var tabs = document.querySelectorAll('.tabbar a');
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].getAttribute('data-tab') === tab) tabs[i].setAttribute('aria-current', 'page');
    else tabs[i].removeAttribute('aria-current');
  }
  window.scrollTo(0, 0);
}
function route() { show((location.hash || '').replace('#', '')); }
function go(v) {
  try { location.hash = v; } catch (e) { /* Ansicht wird unten trotzdem umgeschaltet */ }
  show(v);
}

// Dienst zu ungünstigen Zeiten auf der Seite Zulagen (feste Werte, einmal einsetzen)
$('duz-z-min').textContent = D.duz.mindestStunden;
$('duz-z-liste').innerHTML = [
  ['Sonn- und Feiertage', D.duz.saetze.sonnFeiertag, 'auch Samstag vor Ostern und Pfingsten sowie 24. und 31. Dezember jeweils ab 12 Uhr'],
  ['Samstage 13 bis 20 Uhr', D.duz.saetze.samstag, ''],
  ['Nachts 20 bis 6 Uhr', D.duz.saetze.nacht, 'an allen übrigen Tagen']
].map(function (z) { return '<dt>' + z[0] + '</dt><dd>' + eur.format(z[1]) + ' je Stunde' + (z[2] ? ' (' + z[2] + ')' : '') + '</dd>'; }).join('');
$('duz-z-quelle').textContent = 'Stand ' + D.duz.gueltigAb + ', ' + D.duz.fundstelle + '. Im Rechner kannst du deine Stunden eintragen.';

/* ===== Stand-Angaben aus daten.js überall einsetzen ===== */
var TEXTE = { gueltigAb: D.stand.gueltigAb, fundstelle: D.stand.fundstelle, gesetz: D.stand.gesetz,
  hinweis: D.stand.hinweis, avzHoechstsatz: eur.format(AVZ.hoechstsatz),
  avzMin: eur.format(Math.min.apply(null, Object.keys(AVZ_STUFEN).map(function (k) { return AVZ_STUFEN[k]; }))),
  avzFundstelle: AVZ.fundstelle, avzGueltigAb: AVZ.gueltigAb };
Array.prototype.forEach.call(document.querySelectorAll('[data-mk]'), function (el) {
  el.textContent = TEXTE[el.getAttribute('data-mk')] || '';
});
Array.prototype.forEach.call(document.querySelectorAll('[data-mk-avz-platzhalter]'), function (el) {
  el.hidden = !AVZ.gebieteBeispiel;
});

/* ===== Aufbau der Bedienelemente ===== */
$('tsk').innerHTML = TSK.map(function (t) {
  return '<label><input type="radio" name="tsk" value="' + t.id + '"><span>' + t.name + '</span></label>';
}).join('');

$('gruppen').innerHTML = GRUPPEN.map(function (g) {
  return '<label><input type="radio" name="gruppe" value="' + g.id + '"><span>' + g.name + '</span></label>';
}).join('');

var stufenHtml = '';
for (var s = STUFE_MIN; s <= STUFE_MAX; s++) {
  stufenHtml += '<label><input type="radio" name="stufe" value="' + s + '"><span>' + s + '</span></label>';
}
$('stufen').innerHTML = stufenHtml;

$('fuehrung').innerHTML = FUEHRUNG.map(function (f) {
  return '<option value="' + f.id + '">' + f.name + '</option>';
}).join('');
$('stelle').innerHTML = STELLENZULAGEN.map(function (z) {
  return '<option value="' + z.id + '">' + z.name + '</option>';
}).join('');
$('gebiet').innerHTML = EINSATZGEBIETE.map(function (g) {
  return '<option value="' + g.id + '">' + g.name + '</option>';
}).join('');

$('hint-kind').textContent = 'Familienzuschlag: 1. und 2. Kind je ' + eur.format(FZ.erstesKind) + ', ab dem 3. Kind je ' + eur.format(FZ.jedesWeitereKind) + ', in A 3 bis A 5 etwas mehr';

function fuelleDienstgrade() {
  $('dienstgrad').innerHTML = DIENSTGRADE
    .filter(function (d) { return d.gruppe === state.gruppe && sichtbar(d); })
    .map(function (d) {
      return '<option value="' + d.id + '">' + d.n[state.tsk] + ' (' + bgsLabel(d.bgs) + ')</option>';
    }).join('');
  $('dienstgrad').value = state.dienstgrad;
}
