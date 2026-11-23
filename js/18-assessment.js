/* MeinKamerad – Assessment Trainer: Übungsaufgaben im Stil der bekannten Testarten (keine Originalaufgaben).
   Aufgaben werden zufällig erzeugt, Ergebnisse bleiben im Browser. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';

var AT_BEREICHE = { mathe: 'Mathe', logik: 'Logik', konzentration: 'Konzentration', englisch: 'Englisch' };
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
// Abwechslung: aus einem gemischten Stapel ziehen; jeder Eintrag kommt erst wieder, wenn alle anderen dran waren.
// Die Stapel werden mit dem Stand gespeichert, so geht die Abwechslung über Durchgänge hinweg weiter.
var atStapelOhneSpeicher = { stapel: {}, letzte: {} };
function atZiehe(key, alle) {
  var d = typeof AT !== 'undefined' ? AT : atStapelOhneSpeicher;
  if (!d.stapel) d.stapel = {};
  if (!d.letzte) d.letzte = {};
  var stapel = (d.stapel[key] || []).filter(function (x) { return alle.indexOf(x) >= 0; });
  if (!stapel.length) {
    stapel = atMische(alle);
    // Nicht direkt mit dem zuletzt gezogenen weitermachen
    if (stapel.length > 1 && stapel[stapel.length - 1] === d.letzte[key]) { var t = stapel[0]; stapel[0] = stapel[stapel.length - 1]; stapel[stapel.length - 1] = t; }
  }
  var x = stapel.pop();
  d.stapel[key] = stapel; d.letzte[key] = x;
  return x;
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
  massstab: function (s) {
    var m = atWahl(s === 0 ? [10000, 25000] : [10000, 25000, 50000]), cm = s === 0 ? atZ(2, 9) : atZ(2, 18) / 2, meter = cm * m / 100;
    if (s === 2 && Math.random() < 0.5) {
      return atAufgabe('mathe', 'Kartenmaßstab', 'Auf einer Karte <b>1:' + atZahl(m) + '</b> sind zwei Punkte im Gelände <b>' + atZahl(meter) + ' m</b> voneinander entfernt. Wie viele Zentimeter sind das auf der Karte?',
        atAuswahl(atZahl(cm) + ' cm', [atZahl(cm * 10) + ' cm', atZahl(cm / 10) + ' cm', atZahl(cm * 2) + ' cm', atZahl(cm + 1) + ' cm']), '1 cm auf der Karte sind ' + atZahl(m / 100) + ' m, also ' + atZahl(meter) + ' ÷ ' + atZahl(m / 100) + ' = ' + atZahl(cm) + ' cm');
    }
    return atAufgabe('mathe', 'Kartenmaßstab', 'Auf einer Karte <b>1:' + atZahl(m) + '</b> messen Sie <b>' + atZahl(cm) + ' cm</b>. Wie weit ist das im Gelände?',
      atAuswahl(atZahl(meter) + ' m', [atZahl(meter * 10) + ' m', atZahl(meter / 10) + ' m', atZahl(cm * m / 1000) + ' m', atZahl(meter + m / 100) + ' m']), '1 cm auf der Karte sind ' + atZahl(m / 100) + ' m, also ' + atZahl(cm) + ' × ' + atZahl(m / 100) + ' = ' + atZahl(meter) + ' m');
  },
  uhrzeit: function (s) {
    var start = atZ(5, s === 2 ? 22 : 17) * 60 + atWahl([0, 15, 30, 45, 10, 50]), dauer = atZ(1, s === 0 ? 3 : 5) * 60 + atWahl(s === 0 ? [0, 30] : [15, 25, 40, 45, 55]), ende = (start + dauer) % 1440;
    var hm = function (x) { x = ((x % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0') + ' Uhr'; };
    var dz = Math.floor(dauer / 60) + ' h' + (dauer % 60 ? ' ' + dauer % 60 + ' min' : '');
    return atAufgabe('mathe', 'Uhrzeit', 'Abmarsch ist um <b>' + hm(start) + '</b>. Der Marsch dauert <b>' + dz + '</b>. Wann ist die Ankunft?',
      atAuswahl(hm(ende), [hm(ende + 60), hm(ende - 60), hm(ende + 15), hm(ende - 30), hm(ende + 30)]), hm(start).replace(' Uhr', '') + ' + ' + dz + ' = ' + hm(ende) + (start + dauer >= 1440 ? ' (über Mitternacht)' : ''));
  },
  gleichung: function (s) {
    var x = atZ(2, 12), a = atZ(2, 9), b = atZ(1, 20), c, frage;
    if (s === 0) { frage = 'x + ' + b + ' = ' + (x + b); c = 'x = ' + (x + b) + ' − ' + b + ' = ' + x; }
    else if (s === 1) { frage = a + 'x + ' + b + ' = ' + (a * x + b); c = a + 'x = ' + (a * x) + ', also x = ' + (a * x) + ' ÷ ' + a + ' = ' + x; }
    else { var k = atZ(1, a - 1), dd = a * x + b - k * x, kx = function (n) { return (n === 1 ? '' : n) + 'x'; }; frage = a + 'x + ' + b + ' = ' + kx(k) + ' + ' + dd; c = kx(a - k) + ' = ' + (dd - b) + ', also x = ' + x; }
    return atAufgabe('mathe', 'Gleichung', 'Löse nach x auf: <div class="at-reihe">' + frage + '</div>', atAuswahl('x = ' + x, ['x = ' + (x + 1), 'x = ' + (x - 1), 'x = ' + (x + 2), 'x = ' + (x * 2)]), c);
  },
  flaeche: function (s) {
    var l = atZ(3, [12, 40, 400][s]), b = atZ(2, [9, 25, 250][s]);
    if (s === 2) { var ha = l * b / 10000; l = atZ(2, 8) * 100; b = atZ(1, 6) * 50; ha = l * b / 10000;
      return atAufgabe('mathe', 'Fläche', 'Ein Übungsgelände ist <b>' + l + ' m</b> lang und <b>' + b + ' m</b> breit. Wie viele Hektar sind das?', atAuswahl(atZahl(ha) + ' ha', [atZahl(ha * 10) + ' ha', atZahl(ha / 10) + ' ha', atZahl(ha + 1) + ' ha', atZahl((l + b) * 2 / 100) + ' ha']), l + ' × ' + b + ' = ' + atZahl(l * b) + ' m², ÷ 10.000 = ' + atZahl(ha) + ' ha'); }
    if (Math.random() < 0.5) return atAufgabe('mathe', 'Fläche', 'Ein Rechteck ist ' + l + ' m lang und ' + b + ' m breit. Wie groß ist die <b>Fläche</b>?', atAuswahl(atZahl(l * b) + ' m²', [atZahl(2 * (l + b)) + ' m²', atZahl(l * b + l) + ' m²', atZahl(l + b) + ' m²', atZahl(l * b - b) + ' m²']), 'Fläche = Länge × Breite = ' + l + ' × ' + b + ' = ' + atZahl(l * b) + ' m²');
    return atAufgabe('mathe', 'Umfang', 'Ein Rechteck ist ' + l + ' m lang und ' + b + ' m breit. Wie lang ist der <b>Umfang</b>?', atAuswahl(atZahl(2 * (l + b)) + ' m', [atZahl(l * b) + ' m', atZahl(l + b) + ' m', atZahl(2 * l + b) + ' m', atZahl(4 * l) + ' m']), 'Umfang = 2 × (Länge + Breite) = 2 × ' + (l + b) + ' = ' + atZahl(2 * (l + b)) + ' m');
  },
  durchschnitt: function (s) {
    var n = [3, 4, 5][s], schnitt = atZ(10, [30, 80, 200][s]), werte = [], i, summe = 0;
    for (i = 0; i < n - 1; i++) { var w = schnitt + atZ(-9, 9); werte.push(w); summe += w; }
    var letzter = schnitt * n - summe;
    if (letzter <= 0) { letzter = schnitt; werte = werte.map(function () { return schnitt; }); }
    werte.push(letzter);
    var was = atWahl([['Schießergebnisse', 'Ringe'], ['Liegestütze an ' + n + ' Tagen', 'Stück'], ['Marschzeiten', 'min']]);
    return atAufgabe('mathe', 'Durchschnitt', 'Wie hoch ist der <b>Durchschnitt</b>? ' + was[0] + ': <div class="at-reihe">' + werte.join('<span>,</span> ') + '</div>',
      atAuswahl(atZahl(schnitt) + ' ' + was[1], atFalscheZahlen(schnitt, 2).map(function (x) { return x + ' ' + was[1]; })), 'Summe ' + werte.reduce(function (a, b) { return a + b; }, 0) + ' ÷ ' + n + ' = ' + schnitt);
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
  var typen = [['plus', 'minus', 'mal'], ['wechsel', 'wachsend', 'malplus', 'plus', 'quadrat'], ['zwei', 'fibo', 'wechselop', 'wachsend2', 'malminus']][s], t = atZiehe('reihe/' + s, typen);
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
var AT_TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
var AT_FANTASIE = ['Plimps', 'Trubs', 'Zorks', 'Melbs', 'Quiren', 'Dranks', 'Fleps', 'Gorms'];
var AT_LOGIK = {
  wochentag: function (s) {
    var heute = atZ(0, 6), n = atZ(3, [10, 40, 100][s]), vor = s > 0 && Math.random() < 0.4, ziel = ((heute + (vor ? -n : n)) % 7 + 7) % 7;
    return atAufgabe('logik', 'Wochentage', 'Heute ist <b>' + AT_TAGE[heute] + '</b>. Welcher Tag ist ' + (vor ? 'vor' : 'in') + ' <b>' + n + ' Tagen</b>' + (vor ? ' gewesen' : '') + '?',
      atAuswahl(AT_TAGE[ziel], [AT_TAGE[(ziel + 1) % 7], AT_TAGE[(ziel + 6) % 7], AT_TAGE[(ziel + 2) % 7], AT_TAGE[(ziel + 5) % 7]]), n + ' Tage = ' + Math.floor(n / 7) + (Math.floor(n / 7) === 1 ? ' Woche' : ' Wochen') + ' und ' + (n % 7) + (n % 7 === 1 ? ' Tag; ' : ' Tage; ') + (n % 7) + ' Tage ' + (vor ? 'zurück' : 'weiter') + ' von ' + AT_TAGE[heute] + ' ist ' + AT_TAGE[ziel] + '.');
  },
  symbole: function (s) {
    var a = atZ(2, 9), b = atZ(1, 9), c = atZ(1, 6), z = ['▲', '■', '●'];
    var zeilen = [z[0] + ' + ' + z[0] + ' = ' + (2 * a), z[0] + ' + ' + z[1] + ' = ' + (a + b)], frage = z[1], loes = b, weg = z[0] + ' = ' + a + ', also ' + z[1] + ' = ' + (a + b) + ' − ' + a + ' = ' + b;
    if (s === 1) { frage = z[0] + ' × ' + z[1]; loes = a * b; weg += ', also ' + z[0] + ' × ' + z[1] + ' = ' + a * b; }
    if (s === 2) { zeilen.push(z[1] + ' + ' + z[2] + ' + ' + z[2] + ' = ' + (b + 2 * c)); frage = z[0] + ' + ' + z[1] + ' + ' + z[2]; loes = a + b + c; weg += ', ' + z[2] + ' = ' + c + ', Summe ' + (a + b + c); }
    return atAufgabe('logik', 'Symbolgleichung', 'Jedes Zeichen steht für eine Zahl. Was ergibt <b>' + frage + '</b>?<div class="at-reihe at-zeilen">' + zeilen.join('<br>') + '</div>', atAuswahl(String(loes), atFalscheZahlen(loes, 1)), weg);
  },
  matrix: function (s) {
    var regel = atWahl(s === 0 ? ['summe'] : s === 1 ? ['summe', 'produkt', 'differenz'] : ['produkt', 'summeplus', 'differenz']), zeilen = [], i, plus = atZ(1, 5);
    var f = { summe: function (x, y) { return x + y; }, produkt: function (x, y) { return x * y; }, differenz: function (x, y) { return x - y; }, summeplus: function (x, y) { return x + y + plus; } }[regel];
    for (i = 0; i < 3; i++) { var x = atZ(regel === 'differenz' ? 10 : 2, regel === 'produkt' ? 9 : 30), y = atZ(1, regel === 'produkt' ? 9 : regel === 'differenz' ? x - 1 : 20); zeilen.push([x, y, f(x, y)]); }
    var loes = zeilen[2][2], text = { summe: 'Die dritte Zahl ist die Summe der beiden ersten', produkt: 'Die dritte Zahl ist das Produkt der beiden ersten', differenz: 'Die dritte Zahl ist die Differenz der beiden ersten', summeplus: 'Die dritte Zahl ist die Summe der beiden ersten plus ' + plus }[regel];
    return atAufgabe('logik', 'Zahlenmatrix', 'Welche Zahl fehlt? Jede Zeile folgt derselben Regel.<table class="at-matrix">' + zeilen.map(function (z, j) { return '<tr><td>' + z[0] + '</td><td>' + z[1] + '</td><td>' + (j === 2 ? '<b>?</b>' : z[2]) + '</td></tr>'; }).join('') + '</table>',
      atAuswahl(String(loes), atFalscheZahlen(loes, Math.max(1, Math.round(loes * 0.1)))), text + ': ' + zeilen[2][0] + ' und ' + zeilen[2][1] + ' → ' + loes + '.');
  },
  schluss: function (s) {
    var w = atMische(AT_FANTASIE), A = w[0], B = w[1], C = w[2], name = atWahl(['Kalo', 'Rimo', 'Tess', 'Venn']);
    var vorlagen = [
      ['Alle ' + A + ' sind ' + B + '. Alle ' + B + ' sind ' + C + '.', 'Sind alle ' + A + ' auch ' + C + '?', 0, 'Wenn alle ' + A + ' zu den ' + B + ' gehören und alle ' + B + ' zu den ' + C + ', gehören auch alle ' + A + ' zu den ' + C + '.'],
      ['Alle ' + A + ' sind ' + B + '. ' + name + ' ist ein ' + A.replace(/s$/, '') + '.', 'Ist ' + name + ' ein ' + B.replace(/s$/, '') + '?', 0, name + ' gehört zu den ' + A + ', und alle ' + A + ' sind ' + B + '.'],
      ['Alle ' + A + ' sind ' + B + '. ' + name + ' ist ein ' + B.replace(/s$/, '') + '.', 'Ist ' + name + ' ein ' + A.replace(/s$/, '') + '?', 2, 'Es gibt vielleicht ' + B + ', die keine ' + A + ' sind. Ob ' + name + ' dazugehört, ist offen.'],
      ['Alle ' + A + ' sind ' + B + '. Einige ' + B + ' sind ' + C + '.', 'Sind einige ' + A + ' auch ' + C + '?', 2, 'Die ' + B + ', die ' + C + ' sind, könnten genau die sein, die keine ' + A + ' sind.'],
      ['Kein ' + A.replace(/s$/, '') + ' ist ein ' + B.replace(/s$/, '') + '. Alle ' + C + ' sind ' + A + '.', 'Ist irgendein ' + C.replace(/s$/, '') + ' ein ' + B.replace(/s$/, '') + '?', 1, 'Alle ' + C + ' gehören zu den ' + A + ', und kein ' + A.replace(/s$/, '') + ' ist ein ' + B.replace(/s$/, '') + '.']
    ].slice(0, [3, 4, 5][s]);
    var v = atWahl(vorlagen), opt = ['Ja, das folgt sicher.', 'Nein, das ist sicher falsch.', 'Das lässt sich nicht sicher sagen.', 'Nur, wenn es mehr ' + A + ' als ' + B + ' gibt.'];
    return { bereich: 'logik', typ: 'Schlussfolgern', frage: 'Was folgt aus den Aussagen? (Die Wörter sind erfunden.)<div class="at-satz">' + esc(v[0]) + '</div><p><b>' + esc(v[1]) + '</b></p>', optionen: opt, richtig: v[2], erklaerung: v[3] };
  },
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
var AT_ORTE = [['Müller', '53113 Bonn'], ['Schmidt', '24937 Flensburg'], ['Becker', '93055 Regensburg'], ['Wagner', '26871 Papenburg'], ['Hoffmann', '72488 Sigmaringen'], ['Schulz', '19288 Ludwigslust'], ['Koch', '56070 Koblenz'], ['Richter', '01099 Dresden'], ['Klein', '66111 Saarbrücken'], ['Wolf', '34117 Kassel']];
var AT_KONZ = {
  symbolzaehlen: function (s) {
    var n = [24, 32, 40][s], satz = s === 0 ? ['★', '☆', '●'] : s === 1 ? ['★', '☆', '✦', '✧'] : ['★', '☆', '✦', '✧', '✶'], ziel = 0, h = '';
    for (var i = 0; i < n; i++) { var x = atWahl(satz); if (x === '★') ziel++; h += '<span>' + x + '</span>'; }
    return atAufgabe('konzentration', 'Zeichen zählen', 'Wie oft kommt der <b>gefüllte fünfzackige Stern ★</b> vor?<div class="at-zeichen">' + h + '</div>', atAuswahl(String(ziel), [ziel + 1, Math.max(0, ziel - 1), ziel + 2, Math.max(0, ziel - 2), ziel + 3].map(String)), 'Richtig ist ' + ziel + '. Zeilenweise zählen und ähnliche Zeichen (☆, ✦) nicht mitzählen.');
  },
  buchstaben: function (s) {
    var n = [30, 40, 50][s], satz = s === 0 ? 'bdpq' : 'bdpqgo', ziel = 0, t = '';
    for (var i = 0; i < n; i++) { var x = satz[atZ(0, satz.length - 1)]; if (x === 'b') ziel++; t += x; }
    return atAufgabe('konzentration', 'Buchstaben zählen', 'Wie oft kommt das <b>b</b> vor?<div class="at-reihe at-buchstaben">' + t.replace(/(.{10})/g, '$1 ') + '</div>', atAuswahl(String(ziel), [ziel + 1, Math.max(0, ziel - 1), ziel + 2, Math.max(0, ziel - 2)].map(String)), 'Richtig ist ' + ziel + '. Achtung bei d, p und q, die wie gespiegelte b aussehen.');
  },
  listen: function (s) {
    var paare = atMische(AT_ORTE).slice(0, [4, 5, 5][s]), gleich = 0, h = '';
    paare.forEach(function (p) {
      var a = p[0] + ', ' + p[1], b = a;
      if (Math.random() < 0.5) {
        var art = atZ(0, 2);
        if (art === 0) b = p[0].replace('ü', 'ue').replace('o', 'oo').replace('e', 'ee').slice(0, p[0].length + 1) + ', ' + p[1];
        else if (art === 1) { var plz = p[1].slice(0, 5).split(''), k = atZ(0, 3), t = plz[k]; plz[k] = plz[k + 1]; plz[k + 1] = t; if (plz.join('') === p[1].slice(0, 5)) plz[4] = String((+plz[4] + 1) % 10); b = p[0] + ', ' + plz.join('') + p[1].slice(5); }
        else b = p[0] + ', ' + p[1].slice(0, 6) + p[1].slice(6).replace(/[aeiou]/, function (v) { return v === 'a' ? 'e' : 'a'; });
      }
      if (a === b) gleich++;
      h += '<div class="at-paar at-paar-text"><span>' + esc(a) + '</span><span>' + esc(b) + '</span></div>';
    });
    return atAufgabe('konzentration', 'Listen vergleichen', 'Wie viele Zeilen sind links und rechts <b>genau gleich</b>?<div class="at-paare">' + h + '</div>',
      atAuswahl(String(gleich), [0, 1, 2, 3, 4, 5].filter(function (x) { return x !== gleich && x <= paare.length; }).map(String)), (gleich === 1 ? 'Eine Zeile ist' : gleich + ' Zeilen sind') + ' gleich. Typische Abweichungen: vertauschte Ziffern in der Postleitzahl, ein Buchstabe im Namen oder Ort.');
  },
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
/* ===== Englisch: Lückensätze mit einem einzusetzenden Wort ===== */
// [Stufe 0–2, Satz mit ___, richtiges Wort, drei falsche, Erklärung]
var AT_ENGLISCH = [
  [0, 'My name ___ Paul.', 'is', ['are', 'am', 'be'], '„is“ gehört zu he/she/it und zu einem Namen: My name is …'],
  [0, 'I ___ a soldier.', 'am', ['is', 'are', 'be'], 'Zu „I“ gehört „am“.'],
  [0, 'They ___ in the barracks.', 'are', ['is', 'am', 'be'], 'Zu „they“ gehört „are“.'],
  [0, 'We ___ two dogs.', 'have', ['has', 'having', 'haves'], 'Zu „we“ gehört „have“; „has“ nur bei he/she/it.'],
  [0, 'She ___ a new car.', 'has', ['have', 'haves', 'having'], 'Bei he/she/it heißt es „has“.'],
  [0, 'This is ___ apple.', 'an', ['a', 'the', 'any'], 'Vor einem Vokal-Laut steht „an“: an apple.'],
  [0, 'He is ___ good driver.', 'a', ['an', 'any', 'some'], 'Vor einem Konsonanten-Laut steht „a“.'],
  [0, 'The map is ___ the table.', 'on', ['in', 'at', 'under the'], '„on“ = auf (einer Fläche).'],
  [0, 'The keys are ___ my bag.', 'in', ['on', 'at', 'of'], '„in“ = in (etwas drin).'],
  [0, 'I get up ___ six o’clock.', 'at', ['in', 'on', 'to'], 'Bei Uhrzeiten steht „at“.'],
  [0, 'My birthday is ___ May.', 'in', ['on', 'at', 'to'], 'Bei Monaten steht „in“.'],
  [0, 'We meet ___ Monday.', 'on', ['in', 'at', 'to'], 'Bei Wochentagen steht „on“.'],
  [0, '___ you speak English?', 'Do', ['Does', 'Are', 'Is'], 'Fragen mit „you“ im Präsens bildet man mit „Do“.'],
  [0, '___ he work here?', 'Does', ['Do', 'Is', 'Are'], 'Bei he/she/it fragt man mit „Does“.'],
  [0, 'I can’t find ___ phone.', 'my', ['me', 'I', 'mine'], 'Vor einem Nomen steht das besitzanzeigende „my“.'],
  [0, 'Please give ___ the map.', 'me', ['my', 'I', 'mine'], 'Als Objekt („mir“) steht „me“.'],
  [0, 'There are three ___ in the room.', 'men', ['man', 'mans', 'mens'], 'Mehrzahl von „man“ ist „men“.'],
  [0, 'Turn ___ at the next corner.', 'left', ['leave', 'lift', 'last'], '„turn left“ = links abbiegen.'],
  [0, 'Water is ___ for you.', 'good', ['well', 'goods', 'better than'], 'Nach „is“ steht das Adjektiv „good“.'],
  [0, 'How ___ are you? – I am 20.', 'old', ['many', 'much', 'age'], 'Nach dem Alter fragt man „How old …?“'],
  [0, 'It is cold. Close the ___, please.', 'window', ['weather', 'water', 'winter'], '„window“ = Fenster.'],
  [0, 'I am hungry. I want to ___ something.', 'eat', ['drink', 'sleep', 'wear'], '„eat“ = essen.'],
  [0, 'The soldiers ___ every morning.', 'run', ['runs', 'running', 'is run'], 'Zu „the soldiers“ (they) gehört die Grundform „run“.'],
  [0, 'He ___ coffee every day.', 'drinks', ['drink', 'drinking', 'drinked'], 'Bei he/she/it im Präsens: -s anhängen.'],
  [0, 'This bag is very ___. I can’t carry it.', 'heavy', ['light', 'easy', 'small'], '„heavy“ = schwer (Gewicht).'],
  [1, 'Yesterday I ___ to the doctor.', 'went', ['go', 'goes', 'gone'], '„yesterday“ verlangt die Vergangenheit: go → went.'],
  [1, 'We ___ the film last night.', 'saw', ['see', 'seen', 'sees'], 'Vergangenheit von „see“ ist „saw“.'],
  [1, 'She ___ a letter right now.', 'is writing', ['writes', 'wrote', 'write'], '„right now“ verlangt die Verlaufsform: is writing.'],
  [1, 'Look! It ___.', 'is raining', ['rains', 'rained', 'rain'], '„Look!“ zeigt etwas, das gerade passiert: Verlaufsform.'],
  [1, 'He didn’t ___ the answer.', 'know', ['knew', 'knows', 'known'], 'Nach „didn’t“ steht die Grundform.'],
  [1, 'My brother is ___ than me.', 'taller', ['tall', 'tallest', 'more tall'], 'Vergleich mit „than“: -er anhängen.'],
  [1, 'This is the ___ day of my life.', 'best', ['good', 'better', 'most good'], 'Superlativ von „good“ ist „best“.'],
  [1, 'This test is ___ difficult than the last one.', 'more', ['most', 'much', 'many'], 'Bei langen Adjektiven: more … than.'],
  [1, '___ do you live? – In Berlin.', 'Where', ['When', 'Who', 'What'], 'Nach dem Ort fragt man mit „Where“.'],
  [1, '___ is your instructor? – Sergeant Miller.', 'Who', ['Where', 'Which', 'How'], 'Nach einer Person fragt man mit „Who“.'],
  [1, 'How ___ water do you need?', 'much', ['many', 'lot', 'few'], '„water“ ist nicht zählbar: how much.'],
  [1, 'How ___ soldiers are in your group?', 'many', ['much', 'lot', 'more'], '„soldiers“ ist zählbar: how many.'],
  [1, 'Is there ___ milk in the fridge?', 'any', ['a', 'many', 'few'], 'In Fragen steht meist „any“.'],
  [1, 'I would like ___ tea, please.', 'some', ['any', 'many', 'a few'], 'In Bitten und Angeboten steht „some“.'],
  [1, 'The train leaves ___ 10 minutes.', 'in', ['on', 'at', 'after'], '„in 10 minutes“ = in 10 Minuten.'],
  [1, 'I was born ___ 2004.', 'in', ['on', 'at', 'since'], 'Bei Jahreszahlen steht „in“.'],
  [1, 'You ___ wear a helmet here. It is the rule.', 'must', ['mustn’t', 'can’t', 'don’t'], '„must“ = müssen (Pflicht).'],
  [1, 'You ___ smoke in the vehicle. It is forbidden.', 'mustn’t', ['must', 'needn’t', 'can'], '„mustn’t“ = nicht dürfen (Verbot).'],
  [1, 'She speaks English very ___.', 'well', ['good', 'nice', 'goodly'], 'Wie man etwas tut: Adverb „well“.'],
  [1, 'They ___ playing football when it started to rain.', 'were', ['was', 'are', 'did'], 'Verlaufsform der Vergangenheit bei „they“: were + -ing.'],
  [1, 'I ___ my homework yesterday.', 'did', ['done', 'do', 'does'], 'Vergangenheit von „do“ ist „did“.'],
  [1, 'The opposite of “early” is ___.', 'late', ['soon', 'fast', 'last'], '„early“ = früh, „late“ = spät.'],
  [1, 'Can you ___ me the way to the station?', 'tell', ['say', 'speak', 'talk'], 'Jemandem etwas sagen/erklären: „tell someone“.'],
  [1, 'Our unit ___ to the exercise area tomorrow.', 'is going', ['go', 'went', 'gone'], 'Feste Pläne für die Zukunft: is going.'],
  [1, 'I’m sorry, I ___ understand.', 'don’t', ['doesn’t', 'not', 'isn’t'], 'Verneinung bei „I“ im Präsens: don’t.'],
  [2, 'I have lived here ___ 2019.', 'since', ['for', 'from', 'ago'], 'Zeitpunkt (seit 2019) → „since“.'],
  [2, 'I have lived here ___ five years.', 'for', ['since', 'ago', 'during'], 'Zeitdauer (seit fünf Jahren) → „for“.'],
  [2, 'She ___ in Hamburg three years ago.', 'lived', ['has lived', 'lives', 'is living'], '„ago“ verlangt die einfache Vergangenheit.'],
  [2, 'Have you ever ___ to London?', 'been', ['was', 'went', 'go'], 'Present Perfect: have + been.'],
  [2, 'I ___ already finished my report.', 'have', ['am', 'did', 'was'], '„already“ + Present Perfect: have finished.'],
  [2, 'If it rains, we ___ stay inside.', 'will', ['would', 'are', 'did'], 'If-Satz Typ 1: if + Präsens, dann will.'],
  [2, 'If I had more time, I ___ learn Spanish.', 'would', ['will', 'can', 'am'], 'If-Satz Typ 2: if + Vergangenheit, dann would.'],
  [2, 'The bridge ___ built in 1950.', 'was', ['is', 'has', 'did'], 'Passiv in der Vergangenheit: was built.'],
  [2, 'English ___ spoken in many countries.', 'is', ['are', 'has', 'does'], 'Passiv im Präsens: is spoken.'],
  [2, 'The man ___ helped us was very kind.', 'who', ['which', 'where', 'what'], 'Relativpronomen für Personen: „who“.'],
  [2, 'The vehicle ___ we used was new.', 'which', ['who', 'where', 'whose'], 'Relativpronomen für Dinge: „which“ (oder „that“).'],
  [2, 'I am looking forward to ___ you.', 'seeing', ['see', 'saw', 'seen'], 'Nach „look forward to“ steht -ing.'],
  [2, 'He decided ___ the army.', 'to join', ['joining', 'join', 'joined'], 'Nach „decide“ steht „to“ + Grundform.'],
  [2, 'I don’t mind ___ early.', 'getting up', ['to get up', 'get up', 'got up'], 'Nach „mind“ steht die -ing-Form.'],
  [2, 'He is used to ___ in the cold.', 'working', ['work', 'worked', 'works'], '„be used to“ (gewohnt sein) + -ing.'],
  [2, 'By the time we arrived, the bus ___ left.', 'had', ['has', 'was', 'did'], 'Vorvergangenheit: had + Partizip.'],
  [2, 'You ___ have told me earlier!', 'should', ['shall', 'will', 'can'], '„should have“ = hättest … sollen (Kritik).'],
  [2, 'Neither my friend ___ I knew the answer.', 'nor', ['or', 'and', 'but'], '„neither … nor“ = weder … noch.'],
  [2, 'The report must ___ finished by Friday.', 'be', ['been', 'being', 'is'], 'Passiv nach Modalverb: must be + Partizip.'],
  [2, 'She told me that she ___ the day before.', 'had arrived', ['arrives', 'arriving', 'has arrive'], 'Indirekte Rede, Vorvergangenheit: had arrived.']
];
var AT_SPRACHE = {
  lueckentext: function (s) {
    var alle = AT_ENGLISCH.map(function (x, j) { return j; }).filter(function (j) { return AT_ENGLISCH[j][0] === s; }), e = AT_ENGLISCH[atZiehe('englisch/' + s, alle)];
    var satz = esc(e[1]).replace('___', '<span class="at-luecke">_____</span>');
    return atAufgabe('englisch', 'Lückentext', 'Setze das passende Wort ein:<div class="at-satz" lang="en">' + satz + '</div>', atAuswahl(e[2], e[3]), e[4] + ' → ' + e[1].replace('___', e[2]));
  }
};
var AT_GEN = { mathe: AT_MATHE, logik: AT_LOGIK, konzentration: AT_KONZ, englisch: AT_SPRACHE };
function atNeueAufgabe(bereich, stufe) {
  var g = AT_GEN[bereich], typen = Object.keys(g);
  if (bereich === 'mathe' && stufe === 0) typen = typen.filter(function (t) { return t !== 'bruch'; });
  return g[atZiehe('typ/' + bereich + '/' + stufe, typen)](stufe);
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
    // Testsimulation: 6 Mathe, 6 Logik, 4 Konzentration, 4 Englisch, Stufe mittel, gemischt
    stufe = 1;
    for (i = 0; i < 6; i++) aufgaben.push(atNeueAufgabe('mathe', stufe));
    for (i = 0; i < 6; i++) aufgaben.push(atNeueAufgabe('logik', stufe));
    for (i = 0; i < 4; i++) aufgaben.push(atNeueAufgabe('konzentration', stufe));
    for (i = 0; i < 4; i++) aufgaben.push(atNeueAufgabe('englisch', stufe));
    aufgaben = atMische(aufgaben);
    atSpeichern();
  } else {
    for (i = 0; i < 10; i++) aufgaben.push(atNeueAufgabe(bereich === 'gemischt' ? atZiehe('bereich', Object.keys(AT_BEREICHE)) : bereich, stufe));
    atSpeichern();
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
