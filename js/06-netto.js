/* MeinKamerad – Netto-Rechner: Lohnsteuer, Solidaritätszuschlag und Kirchensteuer (Näherung). Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

var ST = D.steuer;

// Einkommensteuer nach § 32a EStG für ein zu versteuerndes Einkommen in Euro (Grundtabelle)
function estTarif(zve) {
  var x = Math.floor(Math.max(0, zve)), t;
  if (x <= ST.grundfreibetrag) return 0;
  if (x <= ST.zone2Bis) { var y = (x - ST.grundfreibetrag) / 10000; t = (ST.zone2[0] * y + ST.zone2[1]) * y; }
  else if (x <= ST.zone3Bis) { var z = (x - ST.zone2Bis) / 10000; t = (ST.zone3[0] * z + ST.zone3[1]) * z + ST.zone3[2]; }
  else if (x <= ST.zone4Bis) t = 0.42 * x - ST.zone4Abzug;
  else t = 0.45 * x - ST.zone5Abzug;
  return Math.floor(t);
}
// Jahressteuer je Steuerklasse: Klasse III mit Splitting, sonst Grundtabelle
function estKlasse(zve, stkl) { return stkl === 3 ? 2 * estTarif(zve / 2) : estTarif(zve); }
function abrunden(b) { return Math.floor(b * 100 + 1e-6) / 100; }

// o: { steuerpflichtig (Monat), stkl (1–4), kinder, kirche (bool), land, pvMonat }
// Ergebnis je Monat. Rentenversicherung und Krankenversicherung fallen bei Soldaten nicht an,
// berücksichtigt wird nur der selbst gezahlte Beitrag zur privaten Pflegeversicherung.
function nettoBerechnen(o) {
  var stkl = [1, 2, 3, 4].indexOf(o.stkl) >= 0 ? o.stkl : 1;
  var jahr = o.steuerpflichtig * 12;
  var abzug = ST.arbeitnehmerPauschbetrag + ST.sonderausgabenPauschbetrag + Math.max(0, o.pvMonat || 0) * 12;
  if (stkl === 2) abzug += ST.entlastungAlleinerziehende;
  var zve = Math.max(0, jahr - abzug);
  var lstJahr = estKlasse(zve, stkl);
  // Für Soli und Kirchensteuer zählen die Kinderfreibeträge: in Klasse I halb (der andere Elternteil erhält die andere Hälfte),
  // in Klasse II und III voll, in Klasse IV halb (jeder Ehegatte die Hälfte)
  var anteil = stkl === 2 || stkl === 3 ? 1 : 0.5;
  var zveK = Math.max(0, zve - (o.kinder || 0) * anteil * ST.kinderfreibetragJeKind);
  var bemJahr = estKlasse(zveK, stkl);
  var freigrenze = ST.soliFreigrenze * (stkl === 3 ? 2 : 1);
  var soliJahr = bemJahr <= freigrenze ? 0 : Math.min(bemJahr * ST.soliSatz, (bemJahr - freigrenze) * ST.soliMilderung);
  var satz = ST.kirchensteuer[o.land] || ST.kirchensteuer.standard;
  var lst = abrunden(lstJahr / 12), soli = abrunden(soliJahr / 12), kist = o.kirche ? abrunden(bemJahr / 12 * satz) : 0;
  return { lst: lst, soli: soli, kist: kist, kistSatz: satz, abzuege: Math.round((lst + soli + kist) * 100) / 100 };
}
// Vorschlag für die Steuerklasse aus den Familienangaben
function stklVorschlag() {
  if (state.verheiratet) return 4;
  return state.kinder > 0 ? 2 : 1;
}
