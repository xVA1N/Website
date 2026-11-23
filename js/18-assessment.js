/* MeinKamerad – Assessment Trainer: Übungsaufgaben im Stil der bekannten Testarten (keine Originalaufgaben).
   Aufgaben werden zufällig erzeugt, Ergebnisse bleiben im Browser. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';

var AT_BEREICHE = { mathe: 'Mathe', logik: 'Logik', konzentration: 'Konzentration' };
var AT_STUFEN = ['leicht', 'mittel', 'schwer'];
var AT_KEY = 'meinkamerad-assessment';

/* ===== Hilfen ===== */
function atZ(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function atWahl(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function atMische(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function atZahl(n) { return Number(n).toLocaleString('de-DE', { maximumFractionDigits: 2 }); }
// Vier Antworten: die richtige und drei plausible falsche, gemischt
function atAuswahl(richtig, falsche) {
  var r = String(richtig), liste = [r];
  falsche.forEach(function (f) { f = String(f); if (liste.length < 4 && liste.indexOf(f) < 0) liste.push(f); });
  // Zu wenige plausible Falschantworten: weitere in derselben Form erzeugen (Zahl mit Einheit, Buchstabe)
  var m = r.match(/^([+−]?)(\d[\d.]*(?:,\d+)?)(.*)$/), abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', k = 1;
  while (liste.length < 4 && k < 40) {
    var x = null;
    if (/^[A-Z]$/.test(r)) { var pos = abc.indexOf(r) + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 3; if (pos >= 0 && pos < 26) x = abc[pos]; }
    else if (m) { var zahl = Number(m[2].replace(/\./g, '').replace(',', '.')), neu = zahl + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.max(1, Math.round(zahl * 0.2)); if (neu > 0) x = m[1] + atZahl(neu) + m[3]; }
    if (x && liste.indexOf(x) < 0) liste.push(x);
    k++;
  }
  liste = atMische(liste);
  return { optionen: liste, richtig: liste.indexOf(r) };
}
// Typische Fehler bei Zahlen: knapp daneben, Zehnerstelle, Faktor 10
function atFalscheZahlen(c, schritt) {
  schritt = schritt || Math.max(1, Math.round(Math.abs(c) * 0.1));
  return atMische([c + schritt, c - schritt, c + 2 * schritt, c - 2 * schritt, c + 10, c - 10, c * 10, Math.round(c / 10)])
    .filter(function (x) { return x > 0 && x !== c; }).map(atZahl);
}
function atAufgabe(bereich, typ, frage, auswahl, erklaerung) {
  return { bereich: bereich, typ: typ, frage: frage, optionen: auswahl.optionen, richtig: auswahl.richtig, erklaerung: erklaerung };
}

/* ===== Mathe ===== */
var AT_MATHE = {
  grundrechnen: function (s) {
    var op = atWahl(s === 0 ? ['+', '−', '×'] : ['+', '−', '×', '÷']), a, b, c;
    if (op === '+') { a = atZ([10, 100, 1000][s], [99, 999, 9999][s]); b = atZ([10, 100, 100][s], [99, 999, 9999][s]); c = a + b; }
    else if (op === '−') { a = atZ([20, 200, 1000][s], [99, 999, 9999][s]); b = atZ(5, a - 1); c = a - b; }
    else if (op === '×') { a = atZ(2, [9, 19, 99][s]); b = atZ(2, [9, 9, 99][s]); if (s === 2 && a < 11) a += 11; c = a * b; }
    else { b = atZ(2, [9, 9, 12][s]); c = atZ(2, [10, 20, 99][s]); a = b * c; }
    return atAufgabe('mathe', 'Grundrechnen', 'Rechne ohne Taschenrechner: <b>' + atZahl(a) + ' ' + op + ' ' + atZahl(b) + '</b> = ?',
      atAuswahl(atZahl(c), atFalscheZahlen(c, op === '×' ? b : (op === '÷' ? 1 : 10))), atZahl(a) + ' ' + op + ' ' + atZahl(b) + ' = ' + atZahl(c));
  },
  prozent: function (s) {
    if (s < 2 || Math.random() < 0.5) {
      var p = atWahl([[10, 20, 25, 50], [5, 15, 30, 40, 75], [12, 35, 45, 65, 85]][s]), g = atZ(2, 20) * 20, w = g * p / 100;
      return atAufgabe('mathe', 'Prozent', 'Wie viel sind <b>' + p + ' %</b> von <b>' + atZahl(g) + '</b>?', atAuswahl(atZahl(w), atFalscheZahlen(w, Math.max(1, Math.round(g * 0.05)))),
        p + ' % von ' + atZahl(g) + ' = ' + atZahl(g) + ' × ' + p + ' ÷ 100 = ' + atZahl(w));
    }
    var alt = atZ(2, 20) * 20, pr = atWahl([5, 10, 15, 20, 25, 30, 40, 50]) * atWahl([1, -1]), neu = alt * (100 + pr) / 100;
    return atAufgabe('mathe', 'Prozent', 'Ein Wert ändert sich von <b>' + atZahl(alt) + '</b> auf <b>' + atZahl(neu) + '</b>. Um wie viel Prozent?',
      atAuswahl((pr > 0 ? '+' : '−') + Math.abs(pr) + ' %', [(pr > 0 ? '+' : '−') + (Math.abs(pr) + 5) + ' %', (pr > 0 ? '−' : '+') + Math.abs(pr) + ' %', (pr > 0 ? '+' : '−') + Math.max(1, Math.abs(pr) - 5) + ' %', (pr > 0 ? '+' : '−') + Math.abs(pr) * 2 + ' %']),
      'Änderung ' + atZahl(neu - alt) + ' ÷ ' + atZahl(alt) + ' × 100 = ' + (pr > 0 ? '+' : '−') + Math.abs(pr) + ' %');
  },
  dreisatz: function (s) {
    if (s === 0 || Math.random() < 0.5) {
      var m1 = atZ(2, 6), preis = atZ(2, 9), m2 = atZ(m1 + 1, 12), w1 = m1 * preis, w2 = m2 * preis;
      var ding = atWahl([['Kanister Kraftstoff kosten', '€', 'Kanister kosten'], ['Soldaten tragen', 'kg Gepäck', 'Soldaten tragen'], ['Stunden Marsch ergeben', 'km', 'Stunden Marsch ergeben']]);
      return atAufgabe('mathe', 'Dreisatz', m1 + ' ' + ding[0] + ' ' + w1 + ' ' + ding[1] + '. Wie viel ' + ding[1].replace(/^kg Gepäck$/, 'kg') + ' ergeben ' + m2 + ' ' + ding[2].split(' ')[0] + '?',
        atAuswahl(atZahl(w2), atFalscheZahlen(w2, preis)), w1 + ' ÷ ' + m1 + ' = ' + preis + ' je Einheit, × ' + m2 + ' = ' + w2);
    }
    // Umgekehrt proportional: mehr Leute, weniger Zeit
    var l1 = atWahl([2, 3, 4, 6]), t1 = atWahl([6, 8, 12, 24]), gesamt = l1 * t1, teiler = [], i;
    for (i = 2; i <= 12; i++) if (gesamt % i === 0 && i !== l1) teiler.push(i);
    var l2 = atWahl(teiler), t2 = gesamt / l2;
    return atAufgabe('mathe', 'Dreisatz', l1 + ' Soldaten brauchen für einen Stellungsbau ' + t1 + ' Stunden. Wie lange brauchen ' + l2 + ' Soldaten bei gleicher Leistung?',
      atAuswahl(atZahl(t2) + ' h', [atZahl(t1 * l2 / l1) + ' h', atZahl(t2 + 1) + ' h', atZahl(Math.max(1, t2 - 1)) + ' h', atZahl(t2 * 2) + ' h']),
      'Umgekehrt proportional: ' + l1 + ' × ' + t1 + ' = ' + gesamt + ' Arbeitsstunden, ÷ ' + l2 + ' = ' + atZahl(t2) + ' h');
  },
  einheiten: function (s) {
    var f = atWahl([
      function () { var k = atZ(1, 9) + atWahl([0, 0.5, 0.25]); return ['<b>' + atZahl(k) + ' km</b> sind wie viele Meter?', atZahl(k * 1000) + ' m', [atZahl(k * 100) + ' m', atZahl(k * 10000) + ' m', atZahl(k * 1000 + 500) + ' m'], '1 km = 1.000 m']; },
      function () { var m = atWahl([15, 30, 45, 90, 150, 75]); return ['<b>' + m + ' Minuten</b> sind wie viele Stunden?', atZahl(m / 60) + ' h', [atZahl(m / 100) + ' h', atZahl(m / 60 + 0.5) + ' h', atZahl(Math.round(m / 6) / 10 + 0.1) + ' h'], '60 min = 1 h, also ' + m + ' ÷ 60']; },
      function () { var l = atZ(1, 9) + atWahl([0, 0.5]); return ['<b>' + atZahl(l) + ' Liter</b> sind wie viele Milliliter?', atZahl(l * 1000) + ' ml', [atZahl(l * 100) + ' ml', atZahl(l * 10) + ' ml', atZahl(l * 10000) + ' ml'], '1 l = 1.000 ml']; },
      function () { var v = atWahl([18, 36, 54, 72, 90, 108]); return ['<b>' + v + ' km/h</b> sind wie viele Meter pro Sekunde?', atZahl(v / 3.6) + ' m/s', [atZahl(v / 3.6 + 5) + ' m/s', atZahl(v * 3.6) + ' m/s', atZahl(v / 6) + ' m/s'], 'km/h ÷ 3,6 = m/s']; },
      function () { var h = atZ(1, 9); return ['<b>' + h + ' Hektar</b> sind wie viele Quadratmeter?', atZahl(h * 10000) + ' m²', [atZahl(h * 1000) + ' m²', atZahl(h * 100) + ' m²', atZahl(h * 100000) + ' m²'], '1 ha = 100 m × 100 m = 10.000 m²']; }
    ].slice(0, s === 2 ? 5 : s === 1 ? 4 : 3))();
    return atAufgabe('mathe', 'Einheiten', f[0], atAuswahl(f[1], f[2]), f[3]);
  },
  textaufgabe: function (s) {
    var v = atWahl([[4, 5, 6], [40, 60, 80], [45, 75, 90]][s]), minuten = atWahl([[30, 60, 90], [45, 90, 120], [20, 40, 100]][s]), strecke = v * minuten / 60;
    if (Math.random() < 0.5) {
      return atAufgabe('mathe', 'Textaufgabe', (v < 10 ? 'Eine Gruppe marschiert mit ' : 'Ein Fahrzeug fährt mit ') + v + ' km/h. Welche Strecke legt sie in ' + minuten + ' Minuten zurück?',
        atAuswahl(atZahl(strecke) + ' km', [atZahl(strecke * 2) + ' km', atZahl(v * minuten / 100) + ' km', atZahl(strecke + v / 4) + ' km']), 'Strecke = ' + v + ' km/h × ' + atZahl(minuten / 60) + ' h = ' + atZahl(strecke) + ' km');
    }
    return atAufgabe('mathe', 'Textaufgabe', 'Für ' + atZahl(strecke) + ' km braucht eine Kolonne mit ' + v + ' km/h wie lange?',
      atAuswahl(minuten + ' min', [(minuten + 15) + ' min', Math.max(5, minuten - 15) + ' min', Math.round(strecke / v * 100) + ' min']), 'Zeit = ' + atZahl(strecke) + ' km ÷ ' + v + ' km/h = ' + atZahl(minuten / 60) + ' h = ' + minuten + ' min');
  },
  bruch: function (s) {
    var n = atWahl([2, 3, 4, 5, 8]), z = atZ(1, n - 1), g = n * atZ(2, [6, 12, 25][s]), w = g / n * z;
    return atAufgabe('mathe', 'Bruchrechnen', 'Wie viel sind <b>' + z + '/' + n + '</b> von <b>' + atZahl(g) + '</b>?', atAuswahl(atZahl(w), atFalscheZahlen(w, g / n)),
      atZahl(g) + ' ÷ ' + n + ' × ' + z + ' = ' + atZahl(w));
  }
};

/* ===== Logik ===== */
// Zahlenreihen: Regel, Folge und eine kurze Erklärung
function atReihe(s) {
  var a = atZ(1, 12), d = atZ(2, 9), q = atWahl([2, 3]), r = [], i, regel;
  var typen = [['plus', 'minus', 'mal'], ['wechsel', 'wachsend', 'malplus', 'plus', 'quadrat'], ['zwei', 'fibo', 'wechselop', 'wachsend2', 'malminus']][s], t = atWahl(typen);
  if (t === 'plus') { for (i = 0; i < 7; i++) r.push(a + i * d); regel = 'Jeweils +' + d; }
  else if (t === 'minus') { a = atZ(60, 99); for (i = 0; i < 7; i++) r.push(a - i * d); regel = 'Jeweils −' + d; }
  else if (t === 'mal') { a = atZ(1, 4); for (i = 0; i < 7; i++) r.push(a * Math.pow(q, i)); regel = 'Jeweils ×' + q; }
  else if (t === 'wechsel') { var e = atZ(1, 9); r.push(a); for (i = 1; i < 7; i++) r.push(r[i - 1] + (i % 2 ? d : e)); regel = 'Abwechselnd +' + d + ' und +' + e; }
  else if (t === 'wachsend') { r.push(a); for (i = 1; i < 7; i++) r.push(r[i - 1] + i); regel = 'Der Abstand wächst um 1: +1, +2, +3 …'; }
  else if (t === 'wachsend2') { r.push(a); for (i = 1; i < 7; i++) r.push(r[i - 1] + i * 2 + 1); regel = 'Der Abstand wächst um 2: +3, +5, +7 …'; }
  else if (t === 'malplus') { a = atZ(1, 3); var p = atZ(1, 3); r.push(a); for (i = 1; i < 7; i++) r.push(r[i - 1] * 2 + p); regel = 'Jeweils ×2 und +' + p; }
  else if (t === 'malminus') { a = atZ(3, 6); r.push(a); for (i = 1; i < 7; i++) r.push(r[i - 1] * 2 - 1); regel = 'Jeweils ×2 und −1'; }
  else if (t === 'quadrat') { var o = atZ(1, 4); for (i = 0; i < 7; i++) r.push((i + o) * (i + o)); regel = 'Quadratzahlen: ' + o + '², ' + (o + 1) + '², ' + (o + 2) + '² …'; }
  else if (t === 'zwei') { var b = atZ(30, 60), e2 = atZ(2, 5); for (i = 0; i < 7; i++) r.push(i % 2 ? b - Math.floor(i / 2) * e2 : a + (i / 2) * d); regel = 'Zwei Reihen ineinander: jede zweite Zahl +' + d + ', die anderen −' + e2; }
  else if (t === 'fibo') { r = [a, atZ(1, 9)]; for (i = 2; i < 7; i++) r.push(r[i - 1] + r[i - 2]); regel = 'Jede Zahl ist die Summe der beiden vorigen'; }
  else { var f = atZ(2, 6); r.push(a); for (i = 1; i < 7; i++) r.push(i % 2 ? r[i - 1] + f : r[i - 1] * 2); regel = 'Abwechselnd +' + f + ' und ×2'; }
  return { reihe: r.slice(0, 6), loesung: r[6], regel: regel };
}
var AT_LOGIK = {
  zahlenreihe: function (s) {
    var z = atReihe(s);
    return atAufgabe('logik', 'Zahlenreihe', 'Welche Zahl setzt die Reihe fort?<div class="at-reihe">' + z.reihe.map(atZahl).join('<span>,</span> ') + '<span>,</span> <b>?</b></div>',
      atAuswahl(atZahl(z.loesung), atFalscheZahlen(z.loesung, Math.max(1, Math.abs(z.reihe[5] - z.reihe[4])))), z.regel + ', also ' + atZahl(z.loesung) + '.');
  },
  buchstabenreihe: function (s) {
    var abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', schritte = [[2], [1, 2], [3, 1]][s], rueck = s === 2 && Math.random() < 0.5, i, pos = [], gesamt = 0;
    for (i = 0; i < 6; i++) gesamt += schritte[i % schritte.length];
    var start = rueck ? atZ(gesamt, 25) : atZ(0, 25 - gesamt);
    pos.push(start);
    for (i = 1; i < 7; i++) pos.push(pos[i - 1] + (rueck ? -1 : 1) * schritte[(i - 1) % schritte.length]);
    var richtig = abc[pos[6]], falsch = [pos[6] + 1, pos[6] - 1, pos[6] + 2, pos[6] - 2].filter(function (x) { return x >= 0 && x < 26; }).map(function (x) { return abc[x]; });
    return atAufgabe('logik', 'Buchstabenreihe', 'Welcher Buchstabe setzt die Reihe fort?<div class="at-reihe">' + pos.slice(0, 6).map(function (x) { return abc[x]; }).join('<span>,</span> ') + '<span>,</span> <b>?</b></div>',
      atAuswahl(richtig, falsch), (rueck ? 'Rückwärts im Alphabet, ' : 'Im Alphabet ') + (schritte.length > 1 ? 'abwechselnd ' + schritte.join(' und ') + ' Schritte' : 'jeweils ' + schritte[0] + ' Schritte') + ', also ' + richtig + '.');
  },
  analogie: function (s) {
    var regeln = [
      [function (x) { return x * 2; }, 'verdoppeln'], [function (x) { return x + 7; }, '+7'], [function (x) { return x * x; }, 'quadrieren'],
      [function (x) { return x * 3 - 1; }, '×3 und −1'], [function (x) { return x * x + 1; }, 'quadrieren und +1'], [function (x) { return (x + 1) * 2; }, '+1 und dann ×2']
    ].slice(0, [3, 5, 6][s]);
    var r = atWahl(regeln), xs = atMische([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3), c = r[0](xs[2]);
    return atAufgabe('logik', 'Zahlenanalogie', 'Nach welcher Regel geht es weiter?<div class="at-reihe">' + xs[0] + ' → ' + r[0](xs[0]) + '<span>;</span> ' + xs[1] + ' → ' + r[0](xs[1]) + '<span>;</span> ' + xs[2] + ' → <b>?</b></div>',
      atAuswahl(atZahl(c), atFalscheZahlen(c, Math.max(1, Math.round(c * 0.15)))), 'Regel: ' + r[1] + ', also ' + xs[2] + ' → ' + atZahl(c) + '.');
  }
};

/* ===== Konzentration ===== */
var AT_KONZ = {
  // Durchstreichtest: „d“ mit genau zwei Strichen zählen
  dstriche: function (s) {
    var n = [12, 16, 20][s], ziel = 0, h = '';
    for (var i = 0; i < n; i++) {
      var buchst = Math.random() < 0.55 ? 'd' : 'p', oben = atZ(0, 2), unten = atZ(0, 2);
      if (oben + unten === 0) oben = 1;
      if (oben + unten > 3) unten = 1;
      if (buchst === 'd' && oben + unten === 2) ziel++;
      h += '<span class="at-d"><i>' + '|'.repeat(oben) + '</i><b>' + buchst + '</b><i>' + '|'.repeat(unten) + '</i></span>';
    }
    return atAufgabe('konzentration', 'Durchstreichtest', 'Wie viele <b>d</b> haben <b>genau zwei Striche</b> (oben und unten zusammen)?<div class="at-dzeile">' + h + '</div>',
      atAuswahl(String(ziel), [ziel + 1, Math.max(0, ziel - 1), ziel + 2, Math.max(0, ziel - 2)].map(String)), 'Richtig ist ' + ziel + '. Nur „d“ zählen, „p“ nicht, und nur mit genau zwei Strichen.');
  },
  vergleich: function (s) {
    var laenge = [6, 8, 10][s], paare = 5, gleich = 0, h = '';
    for (var i = 0; i < paare; i++) {
      var a = '', k;
      for (k = 0; k < laenge; k++) a += atZ(0, 9);
      var b = a;
      if (Math.random() < 0.55) {
        var stelle = atZ(0, laenge - 1), arr = b.split('');
        if (Math.random() < 0.5 && stelle < laenge - 1 && arr[stelle] !== arr[stelle + 1]) { var t = arr[stelle]; arr[stelle] = arr[stelle + 1]; arr[stelle + 1] = t; }
        else arr[stelle] = String((+arr[stelle] + atZ(1, 8)) % 10);
        b = arr.join('');
      }
      if (a === b) gleich++;
      h += '<div class="at-paar"><span>' + a + '</span><span>' + b + '</span></div>';
    }
    return atAufgabe('konzentration', 'Zahlen vergleichen', 'Wie viele Paare sind <b>genau gleich</b>?<div class="at-paare">' + h + '</div>',
      atAuswahl(String(gleich), [0, 1, 2, 3, 4, 5].filter(function (x) { return x !== gleich; }).map(String)), (gleich === 1 ? 'Ein Paar ist' : gleich + ' Paare sind') + ' gleich. Abweichungen sind oft vertauschte oder geänderte Ziffern.');
  },
  rechenkette: function (s) {
    var schritte = [3, 4, 5][s], x = atZ(2, 12), start = x, text = [], i;
    for (i = 0; i < schritte; i++) {
      var op = atWahl(['+', '−', '×', '÷']), z;
      if (op === '÷') { var t = [2, 3, 4, 5].filter(function (d) { return x % d === 0; }); if (!t.length) op = '+'; else { z = atWahl(t); x = x / z; } }
      if (op === '×') { z = atZ(2, 4); if (x * z > 200) { op = '−'; } else x = x * z; }
      if (op === '−' && x < 3) op = '+';
      if (op === '−') { z = atZ(1, Math.min(9, x - 1)); x = x - z; }
      if (op === '+') { z = atZ(2, 15); x = x + z; }
      text.push(op + ' ' + z);
    }
    return atAufgabe('konzentration', 'Rechenkette', 'Im Kopf, Schritt für Schritt von links nach rechts:<div class="at-reihe">' + start + ' ' + text.join(' ') + ' = <b>?</b></div>',
      atAuswahl(atZahl(x), atFalscheZahlen(x, 2)), 'Schritt für Schritt: ' + start + ' ' + text.join(' ') + ' = ' + atZahl(x) + ' (ohne Punkt vor Strich, der Reihe nach).');
  }
};
var AT_GEN = { mathe: AT_MATHE, logik: AT_LOGIK, konzentration: AT_KONZ };
function atNeueAufgabe(bereich, stufe) {
  var g = AT_GEN[bereich], typen = Object.keys(g);
  if (bereich === 'mathe' && stufe === 0) typen = typen.filter(function (t) { return t !== 'bruch'; });
  return g[atWahl(typen)](stufe);
}

/* ===== Speicher und Stand ===== */
function atLaden() {
  var d = null;
  try { d = JSON.parse(localStorage.getItem(AT_KEY) || 'null'); } catch (e) { d = null; }
  if (!d || typeof d !== 'object') d = {};
  if (!d.antworten || typeof d.antworten !== 'object') d.antworten = {};
  if (!Array.isArray(d.verlauf)) d.verlauf = [];
  Object.keys(AT_BEREICHE).forEach(function (b) { if (!Array.isArray(d.antworten[b])) d.antworten[b] = []; });
  return d;
}
var AT = atLaden();
function atSpeichern() { try { localStorage.setItem(AT_KEY, JSON.stringify(AT)); } catch (e) { /* ohne Speicher gilt der Stand bis zum Neuladen */ } }
// Stand je Bereich: Anteil richtiger unter den letzten 30 Antworten
function atStand(b) { var l = AT.antworten[b].slice(-30); return l.length ? Math.round(l.filter(Boolean).length / l.length * 100) : null; }

/* ===== Ablauf ===== */
var atLauf = null, atUhr = 0;
function atStartZeigen() {
  $('view-assessment').classList.remove('at-laeuft');
  $('at-start').hidden = false; $('at-quiz').hidden = true; $('at-ergebnis').hidden = true;
  var schwach = null;
  $('at-stand').innerHTML = Object.keys(AT_BEREICHE).map(function (b) {
    var st = atStand(b), n = AT.antworten[b].length;
    // Empfehlung: zuerst ein noch nie geübter Bereich, sonst der schwächste
    if (!schwach || (schwach[1] !== null && (st === null || st < schwach[1]))) schwach = [b, st];
    return '<div class="at-stand"><span>' + AT_BEREICHE[b] + '</span><div class="at-stand-balken"><div style="width:' + (st || 0) + '%"></div></div><b>' + (st === null ? '–' : st + ' %') + '</b><small>' + n + ' Aufgaben</small></div>';
  }).join('');
  $('at-empfehlung').textContent = schwach ? 'Heute üben: ' + AT_BEREICHE[schwach[0]] + (schwach[1] === null ? ' (noch nicht geübt).' : ' (dein schwächster Bereich).') : '';
  $('at-verlauf-wrap').hidden = !AT.verlauf.length;
  $('at-verlauf').innerHTML = AT.verlauf.slice(-8).reverse().map(function (v) {
    return '<div class="at-verlauf-zeile"><span>' + esc(v.datum) + '</span><span>' + esc(v.titel) + '</span><b>' + v.richtig + ' / ' + v.gesamt + '</b><small>' + Math.floor(v.sek / 60) + ':' + String(v.sek % 60).padStart(2, '0') + ' min</small></div>';
  }).join('');
}
function zeigeAssessment() { if (!atLauf) atStartZeigen(); }
function atWert(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
function atStarten(modus) {
  var aufgaben = [], i, bereich = atWert('at-bereich') || 'gemischt', stufe = +(atWert('at-stufe') || 1);
  if (modus === 'test') {
    // Testsimulation: 7 Mathe, 7 Logik, 6 Konzentration, Stufe mittel, gemischt
    stufe = 1;
    for (i = 0; i < 7; i++) aufgaben.push(atNeueAufgabe('mathe', stufe));
    for (i = 0; i < 7; i++) aufgaben.push(atNeueAufgabe('logik', stufe));
    for (i = 0; i < 6; i++) aufgaben.push(atNeueAufgabe('konzentration', stufe));
    aufgaben = atMische(aufgaben);
  } else {
    for (i = 0; i < 10; i++) aufgaben.push(atNeueAufgabe(bereich === 'gemischt' ? atWahl(Object.keys(AT_BEREICHE)) : bereich, stufe));
  }
  atLauf = { modus: modus, aufgaben: aufgaben, nr: 0, antworten: [], start: Date.now(), limit: modus === 'test' ? 15 * 60 : 0, aufgabeStart: Date.now(),
    titel: modus === 'test' ? 'Testsimulation' : 'Üben: ' + (AT_BEREICHE[bereich] || 'Gemischt') + ', ' + AT_STUFEN[stufe] };
  $('at-start').hidden = true; $('at-ergebnis').hidden = true; $('at-quiz').hidden = false;
  $('view-assessment').classList.add('at-laeuft');
  clearInterval(atUhr); atUhr = setInterval(atUhrTick, 500);
  atAufgabeZeigen(); atUhrTick();
  $('at-quiz').scrollIntoView({ block: 'start' });
}
function atUhrTick() {
  if (!atLauf) { clearInterval(atUhr); return; }
  var sek = Math.floor((Date.now() - atLauf.start) / 1000);
  if (atLauf.limit) {
    var rest = Math.max(0, atLauf.limit - sek);
    $('at-uhr').textContent = 'noch ' + Math.floor(rest / 60) + ':' + String(rest % 60).padStart(2, '0');
    $('at-uhr').classList.toggle('knapp', rest < 60);
    if (!rest) atEnde();
  } else $('at-uhr').textContent = Math.floor(sek / 60) + ':' + String(sek % 60).padStart(2, '0');
}
function atAufgabeZeigen() {
  var l = atLauf, a = l.aufgaben[l.nr];
  l.aufgabeStart = Date.now();
  $('at-fortschritt').textContent = 'Aufgabe ' + (l.nr + 1) + ' von ' + l.aufgaben.length;
  $('at-balken-fill').style.width = (l.nr / l.aufgaben.length * 100) + '%';
  $('at-bereich').textContent = AT_BEREICHE[a.bereich] + ' · ' + a.typ;
  $('at-frage').innerHTML = a.frage;
  $('at-optionen').innerHTML = a.optionen.map(function (o, i) { return '<button type="button" class="at-option" data-at-i="' + i + '">' + esc(o) + '</button>'; }).join('');
  $('at-feedback').hidden = true; $('at-weiter').hidden = true;
}
$('at-optionen').addEventListener('click', function (ev) {
  var b = ev.target.closest('button[data-at-i]');
  if (!b || !atLauf || $('at-optionen').classList.contains('gesperrt')) return;
  var l = atLauf, a = l.aufgaben[l.nr], i = +b.getAttribute('data-at-i'), ok = i === a.richtig;
  l.antworten.push({ ok: ok, gewaehlt: i, sek: Math.round((Date.now() - l.aufgabeStart) / 1000) });
  AT.antworten[a.bereich].push(ok ? 1 : 0);
  if (AT.antworten[a.bereich].length > 200) AT.antworten[a.bereich] = AT.antworten[a.bereich].slice(-200);
  atSpeichern();
  if (l.modus === 'test') { atWeiter(); return; }
  // Üben: sofort zeigen, was richtig war, mit Erklärung
  $('at-optionen').classList.add('gesperrt');
  Array.prototype.forEach.call($('at-optionen').children, function (x, j) { if (j === a.richtig) x.classList.add('richtig'); else if (j === i) x.classList.add('falsch'); });
  $('at-feedback').hidden = false;
  $('at-feedback').className = 'at-feedback ' + (ok ? 'ok' : 'nein');
  $('at-feedback').innerHTML = '<b>' + (ok ? 'Richtig.' : 'Leider falsch.') + '</b> ' + esc(a.erklaerung);
  $('at-weiter').hidden = false; $('at-weiter').textContent = l.nr + 1 < l.aufgaben.length ? 'Weiter' : 'Auswertung';
  $('at-weiter').focus();
});
function atWeiter() {
  $('at-optionen').classList.remove('gesperrt');
  atLauf.nr++;
  if (atLauf.nr >= atLauf.aufgaben.length) { atEnde(); return; }
  atAufgabeZeigen();
}
$('at-weiter').addEventListener('click', atWeiter);
function atEnde() {
  var l = atLauf;
  if (!l) return;
  clearInterval(atUhr); atLauf = null;
  var sek = Math.round((Date.now() - l.start) / 1000), richtig = l.antworten.filter(function (x) { return x.ok; }).length, je = {};
  l.aufgaben.forEach(function (a, i) {
    je[a.bereich] = je[a.bereich] || [0, 0];
    je[a.bereich][1]++;
    if (l.antworten[i] && l.antworten[i].ok) je[a.bereich][0]++;
  });
  var heute = new Date();
  AT.verlauf.push({ datum: heute.toLocaleDateString('de-DE'), titel: l.titel, richtig: richtig, gesamt: l.aufgaben.length, sek: sek });
  if (AT.verlauf.length > 50) AT.verlauf = AT.verlauf.slice(-50);
  atSpeichern();
  var quote = Math.round(richtig / l.aufgaben.length * 100), fehler = '';
  l.aufgaben.forEach(function (a, i) {
    var an = l.antworten[i];
    if (an && an.ok) return;
    fehler += '<li><span class="at-fehler-bereich">' + AT_BEREICHE[a.bereich] + ' · ' + a.typ + '</span><div class="at-fehler-frage">' + a.frage + '</div>' +
      (an ? 'Deine Antwort: <b>' + esc(a.optionen[an.gewaehlt]) + '</b> · ' : 'Nicht beantwortet · ') + 'Richtig: <b>' + esc(a.optionen[a.richtig]) + '</b><br><small>' + esc(a.erklaerung) + '</small></li>';
  });
  $('at-quiz').hidden = true; $('at-ergebnis').hidden = false;
  $('view-assessment').classList.remove('at-laeuft');
  $('at-ergebnis').innerHTML = '<h2>' + esc(l.titel) + ': Auswertung</h2>' +
    '<div class="at-gesamt"><b>' + richtig + ' von ' + l.aufgaben.length + '</b><span>' + quote + ' % richtig · ' + Math.floor(sek / 60) + ':' + String(sek % 60).padStart(2, '0') + ' min' + (l.antworten.length < l.aufgaben.length ? ' · ' + (l.aufgaben.length - l.antworten.length) + ' nicht geschafft' : '') + '</span></div>' +
    Object.keys(je).map(function (b) { var p = Math.round(je[b][0] / je[b][1] * 100); return '<div class="at-stand"><span>' + AT_BEREICHE[b] + '</span><div class="at-stand-balken"><div style="width:' + p + '%"></div></div><b>' + je[b][0] + ' / ' + je[b][1] + '</b></div>'; }).join('') +
    (fehler ? '<h3>Zum Nacharbeiten</h3><ol class="at-fehler">' + fehler + '</ol>' : '<p class="hint">Alles richtig. Versuch es als Nächstes eine Stufe schwerer.</p>') +
    '<div class="dg-aktionen"><button type="button" class="knopf primaer" id="at-nochmal">Noch einmal</button><button type="button" class="knopf sekundaer" id="at-zurueck">Zur Übersicht</button></div>';
  $('at-nochmal').addEventListener('click', function () { atStarten(l.modus); });
  $('at-zurueck').addEventListener('click', atStartZeigen);
  $('at-ergebnis').scrollIntoView({ block: 'start' });
}
$('at-ueben').addEventListener('click', function () { atStarten('ueben'); });
$('at-test').addEventListener('click', function () { atStarten('test'); });
$('at-abbrechen').addEventListener('click', function () {
  inlineAbfrage(this.parentNode, { text: 'Durchgang beenden? Bisher beantwortete Aufgaben werden ausgewertet.', ok: 'Beenden', gefahr: true, fertig: atEnde });
});
$('at-verlauf-weg').addEventListener('click', function () {
  inlineAbfrage(this.parentNode, { text: 'Verlauf und Stand wirklich löschen?', ok: 'Löschen', gefahr: true, fertig: function () { try { localStorage.removeItem(AT_KEY); } catch (e) { /* egal */ } AT = atLaden(); atStartZeigen(); } });
});
// Seite verlassen: laufenden Durchgang anhalten (die Uhr läuft nicht weiter)
window.addEventListener('hashchange', function () { if (atLauf && location.hash !== '#assessment') { clearInterval(atUhr); atLauf = null; } });
if (aktuelleAnsicht === 'assessment') zeigeAssessment();
