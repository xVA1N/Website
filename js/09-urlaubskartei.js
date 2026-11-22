/* MeinKamerad – Urlaubskartei (Einträge nur im Browser). Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

/* ===== Urlaubskartei (Einträge nur im Browser) ===== */
var UD = D.urlaub;
var U_KEY = 'meinkamerad-urlaub';
var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
var WT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
var WT_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
var ARTEN = { urlaub: 'Erholungsurlaub', dza: 'Dienstzeitausgleich', atb: 'ATB', sonder: 'Sonderurlaub' };
// Konten der Übersicht: jedes zählt die Einträge einer Art
var KONTEN = [
  { art: 'urlaub', name: 'Erholungsurlaub', info: 'Jahresurlaub inklusive Zusatzurlaub', farbe: 'var(--accent)' },
  { art: 'dza', name: 'Überstunden', info: 'Abbau als Dienstzeitausgleich', farbe: 'var(--warn-bg)', rand: 'var(--warn-line)', stunden: true },
  { art: 'atb', name: 'ATB', info: 'Ausnahmetatbestand', farbe: 'var(--atb)' },
  { art: 'sonder', name: 'Sonderurlaub', info: 'Zum Beispiel Kindkranktage', farbe: 'var(--fg)' }
];
var heute = new Date();
var RX_FARBE = /^#[0-9a-fA-F]{6}$/;
var FARBEN = [['#D64545', 'Rot'], ['#E07B24', 'Orange'], ['#C9A227', 'Gelb'], ['#3C9D5D', 'Grün'], ['#1F9AA0', 'Türkis'],
  ['#3A6FD8', 'Blau'], ['#8B5CC7', 'Lila'], ['#D2549A', 'Pink'], ['#7A7F87', 'Grau']];
function uLaden() {
  var u = { land: 'NW', anspruch: {}, rest: {}, zusatz: {}, konten: {}, eintraege: [], tags: [], markierungen: [] };
  try {
    var j = JSON.parse(localStorage.getItem(U_KEY) || 'null');
    if (j && typeof j === 'object') {
      if (UD.bundeslaender[j.land]) u.land = j.land;
      u.diensteZeigen = !!j.diensteZeigen;
      if (j.dienstzeiten && typeof j.dienstzeiten === 'object') u.dienstzeiten = j.dienstzeiten;
      ['anspruch', 'rest', 'zusatz', 'konten'].forEach(function (k) { if (j[k] && typeof j[k] === 'object') u[k] = j[k]; });
      if (Array.isArray(j.tags)) u.tags = j.tags.filter(function (t) { return t && t.id && typeof t.name === 'string' && RX_FARBE.test(t.farbe); });
      if (Array.isArray(j.markierungen)) u.markierungen = j.markierungen.filter(function (m) { return m && /^\d{4}-\d{2}-\d{2}$/.test(m.von) && /^\d{4}-\d{2}-\d{2}$/.test(m.bis); });
      if (Array.isArray(j.eintraege)) u.eintraege = j.eintraege.filter(function (e) { return e && /^\d{4}-\d{2}-\d{2}$/.test(e.von) && /^\d{4}-\d{2}-\d{2}$/.test(e.bis) && ARTEN[e.art]; });
    }
  } catch (e) { /* ohne Speicher mit leerem Planer weiter */ }
  return u;
}
var UZ = uLaden();
var uAnsicht = { jahr: heute.getFullYear(), monat: heute.getMonth(), auswahlStart: '' };
function uSpeichern() { try { localStorage.setItem(U_KEY, JSON.stringify(UZ)); } catch (e) { /* nicht speicherbar */ } }

function p2(n) { return (n < 10 ? '0' : '') + n; }
function iso(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
function vonIso(s) { var t = s.split('-'); return new Date(+t[0], +t[1] - 1, +t[2]); }
function plusTage(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
function datumKurz(s) { var d = vonIso(s); return WT[(d.getDay() + 6) % 7] + ' ' + p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear(); }
function tageText(n) { var t = String(n).replace('.', ','); return t + (n === 1 ? ' Tag' : ' Tage'); }
function ostersonntag(j) {
  var a = j % 19, b = Math.floor(j / 100), c = j % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mon = Math.floor((h + l - 7 * m + 114) / 31), tag = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(j, mon - 1, tag);
}
var ftCache = {};
function feiertage(j, land) {
  var key = j + land;
  if (ftCache[key]) return ftCache[key];
  var m = {}, ostern = ostersonntag(j);
  UD.feiertage.forEach(function (f) {
    if (f.laender !== 'alle' && f.laender.split(',').indexOf(land) < 0) return;
    var d;
    if (f.regel === 'fest') { var t = f.datum.split('-'); d = new Date(j, +t[0] - 1, +t[1]); }
    else if (f.regel === 'ostern') d = plusTage(ostern, f.tage);
    else if (f.regel === 'bussbettag') { d = new Date(j, 10, 22); while (d.getDay() !== 3) d.setDate(d.getDate() - 1); }
    if (d) m[iso(d)] = f.name;
  });
  ftCache[key] = m;
  return m;
}
function ftName(d) { return feiertage(d.getFullYear(), UZ.land)[iso(d)] || ''; }
function istFrei(d) { var w = d.getDay(); return w === 0 || w === 6 || !!ftName(d); }
// Arbeitstage eines Zeitraums, optional nur innerhalb eines Jahres
function arbeitstage(von, bis, nurJahr) {
  var n = 0, d = vonIso(von), ende = vonIso(bis);
  for (; d <= ende; d = plusTage(d, 1)) {
    if (nurJahr && d.getFullYear() !== nurJahr) continue;
    if (!istFrei(d)) n++;
  }
  return n;
}
function eintragAm(s) {
  return UZ.eintraege.filter(function (e) { return e.von <= s && s <= e.bis; })[0];
}
function jahrWert(k, j) { var v = UZ[k][j]; return typeof v === 'number' && v >= 0 ? v : (k === 'anspruch' ? UD.standardAnspruch : 0); }
// feld: 'neu' (dieses Jahr) oder 'alt' (aus dem Vorjahr). Ältere Speicherstände (anspruch, rest, zusatz) gelten weiter.
function kontoWert(art, feld, j) {
  var k = UZ.konten[j] && UZ.konten[j][art], v = k && k[feld];
  if (typeof v === 'number' && v >= 0) return v;
  if (art !== 'urlaub') return 0;
  return feld === 'neu' ? jahrWert('anspruch', j) + jahrWert('zusatz', j) : jahrWert('rest', j);
}
function zahl(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }

// Dienste, die an diesem Tag stattfinden (Ende genau um 0 Uhr zählt nicht mehr)
function diensteAm(s) {
  return DUZ_DIENSTE.filter(function (x) { return x.start.slice(0, 10) <= s && (s < x.ende.slice(0, 10) || (s === x.ende.slice(0, 10) && x.ende.slice(11) !== '00:00')); });
}
function tagById(id) { return UZ.tags.filter(function (t) { return t.id === id; })[0]; }
// Markierungen eines Tages, nur solche mit vorhandenem Tag
function markierungenAm(s) {
  return UZ.markierungen.filter(function (m) { return m.von <= s && s <= m.bis && tagById(m.tag); })
    .map(function (m) { return { m: m, t: tagById(m.tag) }; });
}
function tagKlassen(d) {
  var s = iso(d), c = ['u-tag'], e = eintragAm(s);
  var w = d.getDay();
  if (w === 0 || w === 6) c.push('we');
  if (ftName(d)) c.push('ft');
  if (s === iso(heute)) c.push('heute');
  if (e) c.push('art-' + e.art, e.status);
  var sv = $('u-von').value, sb = $('u-bis').value || sv;
  if (sv && sv <= s && s <= sb) c.push('sel');
  if (sv && s === sv) c.push('sel-a');
  if (sv && s === sb) c.push('sel-b');
  var di = UZ.diensteZeigen ? diensteAm(s) : [];
  if (di.length) c.push('dienst');
  var mk = markierungenAm(s);
  if (mk.length) c.push('mark');
  if (mk.length > 1) c.push('mark2');
  return { cls: c.join(' '), e: e, di: di, mk: mk };
}

// Dienstzeiten je Wochentag (1 = Montag … 5 = Freitag): eigene Werte, sonst Vorschlag aus daten.js
var DZ_TAGE = [[1, 'mo', 'Mo'], [2, 'di', 'Di'], [3, 'mi', 'Mi'], [4, 'do', 'Do'], [5, 'fr', 'Fr']];
var RX_ZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;
function dienstzeit(k) {
  var e = UZ.dienstzeiten && UZ.dienstzeiten[k], v = (UD.dienstzeiten || {})[k] || ['', '', 0];
  var z = e ? [e.b, e.e, e.p] : v;
  return { b: RX_ZEIT.test(z[0]) ? z[0] : '', e: RX_ZEIT.test(z[1]) ? z[1] : '', p: Math.max(0, +z[2] || 0) };
}
function minuten(t) { return +t.slice(0, 2) * 60 + +t.slice(3); }
function stundenAm(k) {
  var z = dienstzeit(k);
  if (!z.b || !z.e) return 0;
  var m = minuten(z.e) - minuten(z.b);
  if (m <= 0) m += 1440;
  return Math.max(0, m - z.p) / 60;
}
function wochenStunden() { return DZ_TAGE.reduce(function (a, t) { return a + stundenAm(t[1]); }, 0); }
// Stunden, die ein Zeitraum Dienstzeitausgleich nach den Dienstzeiten abzieht
function ausgleichStunden(von, bis, nurJahr) {
  var h = 0, d = vonIso(von), ende = vonIso(bis);
  for (; d <= ende; d = plusTage(d, 1)) {
    if (nurJahr && d.getFullYear() !== nurJahr) continue;
    if (istFrei(d)) continue;
    var t = DZ_TAGE[d.getDay() - 1];
    if (t) h += stundenAm(t[1]);
  }
  return h;
}
function dienstzeitenHtml() {
  var zeilen = DZ_TAGE.map(function (t) {
    var z = dienstzeit(t[1]);
    return '<span class="tg">' + t[2] + '</span>' +
      '<input type="time" step="300" aria-label="' + WT_LANG[t[0]] + ' Beginn" data-dz="' + t[1] + '" data-dz-feld="b" value="' + z.b + '">' +
      '<input type="time" step="300" aria-label="' + WT_LANG[t[0]] + ' Ende" data-dz="' + t[1] + '" data-dz-feld="e" value="' + z.e + '">' +
      '<input type="number" min="0" max="240" step="5" inputmode="numeric" aria-label="' + WT_LANG[t[0]] + ' Pause in Minuten" data-dz="' + t[1] + '" data-dz-feld="p" value="' + z.p + '">' +
      '<span class="h">' + zahl(stundenAm(t[1])) + '</span>';
  }).join('');
  return '<div class="u-dz-tab"><span></span><span class="k">Beginn</span><span class="k">Ende</span><span class="k">Pause (Min.)</span><span class="k">Std.</span>' + zeilen + '</div>' +
    '<p class="hint" style="margin-top:8px">Ein Tag Dienstzeitausgleich zieht in der Urlaubskartei die Stunden dieses Wochentags vom Überstundenkonto ab. Ohne Beginn und Ende zählt der Tag nicht.</p>';
}
function renderKonten(j) {
  var summe = {};
  KONTEN.forEach(function (k) { summe[k.art] = { gen: 0, gepl: 0, tage: 0 }; });
  UZ.eintraege.forEach(function (e) {
    var n = arbeitstage(e.von, e.bis, j), s = summe[e.art];
    if (!n || !s) return;
    s.tage += n;
    s[e.status === 'genehmigt' ? 'gen' : 'gepl'] += e.art === 'dza' ? ausgleichStunden(e.von, e.bis, j) : n;
  });
  $('u-konten-titel').textContent = 'Übersicht ' + j;
  $('u-konten').innerHTML = KONTEN.map(function (k) {
    var neu = kontoWert(k.art, 'neu', j), alt = kontoWert(k.art, 'alt', j), s = summe[k.art];
    var id = 'u-k-' + k.art, eh = k.stunden ? ' Std.' : '', ehL = k.stunden ? ' (Std.)' : '';
    var uebrig = neu + alt - s.gen - s.gepl;
    var stand = 'Genehmigt ' + zahl(s.gen) + eh + ' · geplant ' + zahl(s.gepl) + eh;
    if (k.stunden) stand += (s.tage ? ' (' + tageText(s.tage) + ')' : '') + '</div><div class="u-dz-kurz">Dienstzeiten: ' + zahl(wochenStunden()) + ' Std. je Woche · <a href="#profil">im Profil ändern</a></div><div hidden>';
    return '<div class="u-konto" style="--kfarbe:' + k.farbe + (k.rand ? ';--krand:' + k.rand : '') + '">' +
      '<div class="kopf"><b>' + k.name + '</b>' + (k.info ? '<small>' + k.info + '</small>' : '') +
      '<div class="uebrig' + (uebrig < 0 ? ' minus' : '') + '">' + zahl(uebrig) + '<span>' + (k.stunden ? 'Std. übrig' : 'übrig') + '</span></div></div>' +
      '<div class="felder">' +
      '<div><label for="' + id + '-neu">' + j + ehL + '</label><input type="number" id="' + id + '-neu" data-konto="' + k.art + '" data-feld="neu" min="0" max="' + (k.stunden ? 2000 : 366) + '" step="0.5" inputmode="decimal" value="' + neu + '"></div>' +
      '<div><label for="' + id + '-alt">Aus ' + (j - 1) + ehL + '</label><input type="number" id="' + id + '-alt" data-konto="' + k.art + '" data-feld="alt" min="0" max="' + (k.stunden ? 2000 : 366) + '" step="0.5" inputmode="decimal" value="' + alt + '"></div>' +
      '</div><div class="stand">' + stand + '</div></div>';
  }).join('');
}

function renderUrlaub() {
  var j = uAnsicht.jahr, land = UZ.land;
  $('u-land').value = land;
  $('u-jahr').textContent = j;
  $('u-hinweis').textContent = UD.hinweis;
  renderKonten(j);

  // Monatskalender
  var m = uAnsicht.monat, erster = new Date(j, m, 1), versatz = (erster.getDay() + 6) % 7;
  var tageImMonat = new Date(j, m + 1, 0).getDate();
  $('u-monat').textContent = MONATE[m] + ' ' + j;
  var html = WT.map(function (t) { return '<div class="wt" aria-hidden="true">' + t + '</div>'; }).join('');
  for (var i = 0; i < versatz; i++) html += '<span class="u-tag leer" aria-hidden="true"></span>';
  for (var t = 1; t <= tageImMonat; t++) {
    var d = new Date(j, m, t), k = tagKlassen(d), ft = ftName(d);
    var label = WT_LANG[d.getDay()] + ', ' + t + '. ' + MONATE[m] + (ft ? ', Feiertag ' + ft : '') +
      (k.e ? ', ' + ARTEN[k.e.art] + ' ' + k.e.status : '') + (k.cls.indexOf('sel') >= 0 ? ', ausgewählt' : '') +
      (k.di.length ? ', Dienst ' + k.di.map(function (x) { return dtKurz(x.start) + ' bis ' + dtKurz(x.ende); }).join(' und ') : '') +
      (k.mk.length ? ', ' + k.mk.map(function (x) { return x.t.name; }).join(', ') : '');
    var titel = [ft].concat(k.mk.map(function (x) { return x.t.name; })).filter(Boolean).join(', ');
    html += '<button type="button" class="' + k.cls + '" data-tag="' + iso(d) + '" aria-label="' + esc(label) + '"' + (titel ? ' title="' + esc(titel) + '"' : '') +
      (k.mk.length ? ' style="--tagfarbe:' + k.mk[0].t.farbe + (k.mk.length > 1 ? ';--tagfarbe2:' + k.mk[1].t.farbe : '') + '"' : '') + '>' + t + '</button>';
  }
  $('u-kal').innerHTML = html;
  var ftMonat = Object.keys(feiertage(j, land)).filter(function (s) { return vonIso(s).getMonth() === m; }).sort();
  $('u-feiertage-monat').textContent = ftMonat.length
    ? 'Feiertage in ' + UD.bundeslaender[land] + ': ' + ftMonat.map(function (s) { return feiertage(j, land)[s] + ' (' + p2(vonIso(s).getDate()) + '.' + p2(m + 1) + '.)'; }).join(', ')
    : 'Keine landesweiten Feiertage in ' + UD.bundeslaender[land] + ' in diesem Monat.';

  // Einträge des Jahres
  $('u-eintraege-jahr').textContent = j;
  var liste = UZ.eintraege.filter(function (e) { return +e.von.slice(0, 4) <= j && +e.bis.slice(0, 4) >= j; })
    .sort(function (a, b) { return a.von < b.von ? -1 : 1; });
  $('u-liste-leer').hidden = liste.length > 0;
  $('u-liste').hidden = !liste.length;
  $('u-liste').innerHTML = liste.map(function (e) {
    var n = arbeitstage(e.von, e.bis);
    return '<div class="fav-item"><button type="button" class="zeile" data-u-zeige="' + e.id + '"><span class="n">' + ARTEN[e.art] + (e.status === 'genehmigt' ? ' ✓' : '') + '</span>' +
      '<span class="r">' + tageText(n) + '</span><span class="s">' + datumKurz(e.von) + (e.bis !== e.von ? ' bis ' + datumKurz(e.bis) : '') +
      ' · ' + (e.status === 'genehmigt' ? 'genehmigt' : 'geplant') + (e.notiz ? ' · ' + esc(e.notiz) : '') + '</span></button>' +
      '<span class="u-eintrag-akt"><button type="button" data-u-status="' + e.id + '">' + (e.status === 'genehmigt' ? 'Auf geplant' : 'Genehmigt') + '</button>' +
      '<button type="button" data-u-weg="' + e.id + '" aria-label="Eintrag löschen">Löschen</button></span></div>';
  }).join('');

  // Brückentage
  $('u-bruecken-jahr').textContent = j;
  var vorschlaege = brueckentage(j);
  $('u-bruecken-anz').textContent = vorschlaege.length ? vorschlaege.length + (vorschlaege.length === 1 ? ' Vorschlag' : ' Vorschläge') : '';
  $('u-bruecken').innerHTML = vorschlaege.length ? vorschlaege.map(function (v) {
    return '<button type="button" class="zeile" data-u-bruecke="' + v.von + '|' + v.bis + '"><span class="n">' + datumKurz(v.von) + (v.bis !== v.von ? ' bis ' + datumKurz(v.bis) : '') + '</span>' +
      '<span class="r">' + tageText(v.frei) + ' frei</span><span class="s">' + tageText(v.urlaub) + ' Urlaub · ' + v.anlass + '</span></button>';
  }).join('') : '<p class="hint" style="padding:12px">Keine Vorschläge für dieses Jahr.</p>';

  // Jahresübersicht
  $('u-jahresansicht').innerHTML = MONATE.map(function (name, mi) {
    var ers = new Date(j, mi, 1), vs = (ers.getDay() + 6) % 7, n = new Date(j, mi + 1, 0).getDate(), g = '', ut = 0, dt = 0;
    for (var x = 0; x < vs; x++) g += '<i class="x"></i>';
    for (var tt = 1; tt <= n; tt++) {
      var dd = new Date(j, mi, tt), e = eintragAm(iso(dd)), c = [];
      if (dd.getDay() === 0 || dd.getDay() === 6) c.push('we');
      if (ftName(dd)) c.push('ft');
      if (e && !istFrei(dd)) { c.push('art-' + e.art, e.status); if (e.art === 'urlaub') ut++; }
      if (UZ.diensteZeigen && diensteAm(iso(dd)).length) { c.push('dienst'); dt++; }
      var mkt = markierungenAm(iso(dd));
      if (mkt.length) c.push('mark');
      g += '<i class="' + c.join(' ') + '"' + (mkt.length ? ' style="--tagfarbe:' + mkt[0].t.farbe + '"' : '') + '></i>';
    }
    var info = [ut ? tageText(ut) + ' Urlaub' : '', dt ? dt + (dt === 1 ? ' Diensttag' : ' Diensttage') : ''].filter(Boolean);
    return '<button type="button" class="u-mini" data-u-monat="' + mi + '" aria-label="' + name + ' ' + j + ' anzeigen' + (info.length ? ', ' + info.join(', ') : '') + '">' +
      '<span class="mn">' + name + (info.length ? '<small>' + info.join(' · ') + '</small>' : '') + '</span><span class="g" aria-hidden="true">' + g + '</span></button>';
  }).join('');

  renderMarkierungen(j);
  $('u-dienste-zeigen').checked = !!UZ.diensteZeigen;
  $('u-leg-dienst').hidden = !UZ.diensteZeigen;
  uVorschau();
  renderSeitenStern();
}

function renderMarkierungen(j) {
  $('u-leg-tags').innerHTML = UZ.tags.map(function (t) { return '<span class="l-tag" style="--tagfarbe:' + t.farbe + '">' + esc(t.name) + '</span>'; }).join('');
  var wahl = $('u-mark-tag').value;
  $('u-mark-tag').innerHTML = UZ.tags.length
    ? UZ.tags.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('')
    : '<option value="">Noch keine Markierung angelegt</option>';
  if (tagById(wahl)) $('u-mark-tag').value = wahl;
  $('u-mark-tag').disabled = !UZ.tags.length;
  $('u-mark-add').disabled = !UZ.tags.length;
  if (!$('u-tag-farben').innerHTML) {
    $('u-tag-farben').innerHTML = FARBEN.map(function (f, i) {
      return '<label><input type="radio" name="u-tag-farbe" value="' + f[0] + '"' + (i === 0 ? ' checked' : '') + ' aria-label="' + f[1] + '"><span class="sw" style="--tagfarbe:' + f[0] + '"></span></label>';
    }).join('') + '<label><input type="radio" name="u-tag-farbe" value="eigen" aria-label="Eigene Farbe"><span class="sw" style="background:conic-gradient(#d64545,#c9a227,#3c9d5d,#1f9aa0,#3a6fd8,#8b5cc7,#d64545)"></span></label>' +
      '<input type="color" id="u-tag-farbe-eigen" value="#3a6fd8" aria-label="Eigene Farbe wählen">';
  }
  var ys = String(j);
  $('u-tag-liste').innerHTML = UZ.tags.map(function (t) {
    var tage = 0;
    UZ.markierungen.forEach(function (m) {
      if (m.tag !== t.id) return;
      for (var d = vonIso(m.von); d <= vonIso(m.bis); d = plusTage(d, 1)) if (iso(d).slice(0, 4) === ys) tage++;
    });
    return '<div class="fav-item"><div class="zeile" style="cursor:default"><span class="n"><span class="u-chip" style="--tagfarbe:' + t.farbe + '"></span>' + esc(t.name) + '</span><span class="r">' + tage + (tage === 1 ? ' Tag' : ' Tage') + '</span><span class="s">in ' + j + '</span></div>' +
      '<span class="u-eintrag-akt"><button type="button" data-u-tag-weg="' + t.id + '" aria-label="Markierung ' + esc(t.name) + ' löschen">Löschen</button></span></div>';
  }).join('');
  $('u-tag-liste').hidden = !UZ.tags.length;
  $('u-mark-jahr').textContent = j;
  var mliste = UZ.markierungen.filter(function (m) { return tagById(m.tag) && m.von.slice(0, 4) <= ys && m.bis.slice(0, 4) >= ys; })
    .sort(function (a, b) { return a.von < b.von ? -1 : 1; });
  $('u-mark-leer').hidden = mliste.length > 0;
  $('u-mark-liste').hidden = !mliste.length;
  $('u-mark-liste').innerHTML = mliste.map(function (m) {
    var t = tagById(m.tag);
    return '<div class="fav-item"><button type="button" class="zeile" data-u-mark-zeige="' + m.id + '"><span class="n"><span class="u-chip" style="--tagfarbe:' + t.farbe + '"></span>' + esc(t.name) + '</span>' +
      '<span class="r"></span><span class="s">' + datumKurz(m.von) + (m.bis !== m.von ? ' bis ' + datumKurz(m.bis) : '') + (m.notiz ? ' · ' + esc(m.notiz) : '') + '</span></button>' +
      '<span class="u-eintrag-akt"><button type="button" data-u-mark-weg="' + m.id + '" aria-label="Markierung löschen">Löschen</button></span></div>';
  }).join('');
}

// Brückentage: kurze Arbeitstag-Folgen (bis 4 Tage) zwischen freien Tagen, an die ein Feiertag grenzt
function brueckentage(j) {
  var erg = [], d = new Date(j, 0, 1), ende = new Date(j, 11, 31);
  while (d <= ende) {
    if (istFrei(d)) { d = plusTage(d, 1); continue; }
    var start = d, n = 0;
    while (!istFrei(d) && d <= ende) { n++; d = plusTage(d, 1); }
    var vor = plusTage(start, -1), nach = d;
    if (n > 4 || !istFrei(vor) || !istFrei(nach)) continue;
    var a = vor, b = nach, namen = [];
    while (istFrei(a)) { if (ftName(a)) namen.unshift(ftName(a)); a = plusTage(a, -1); }
    while (istFrei(b)) { if (ftName(b)) namen.push(ftName(b)); b = plusTage(b, 1); }
    if (!namen.length) continue;
    var frei = Math.round((b - a) / 864e5) - 1;
    if (frei / n < 2) continue;
    erg.push({ von: iso(start), bis: iso(plusTage(nach, -1)), urlaub: n, frei: frei, anlass: namen.filter(function (x, i) { return namen.indexOf(x) === i; }).join(', ') });
  }
  return erg;
}

function uVorschau() {
  var von = $('u-von').value, bis = $('u-bis').value, el = $('u-vorschau');
  el.className = 'u-meldung';
  if (!von || !bis) { el.textContent = ''; return; }
  if (bis < von) { el.className = 'u-meldung fehler'; el.textContent = 'Das Ende liegt vor dem Beginn.'; return; }
  var n = arbeitstage(von, bis);
  el.textContent = 'Ausgewählt: ' + datumKurz(von) + (bis !== von ? ' bis ' + datumKurz(bis) : '') + ', ' + n + ' ' + (n === 1 ? 'Arbeitstag' : 'Arbeitstage') + ' (ohne Wochenenden und Feiertage).' +
    (uAnsicht.auswahlStart ? ' Tippe auf den letzten Tag, um den Zeitraum zu verlängern.' : '');
}
function uMeldung(t, fehler) { var el = $('u-vorschau'); el.className = 'u-meldung' + (fehler ? ' fehler' : ''); el.textContent = t; }

function icsText(t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
function icsExport(nurJahr) {
  var imJahr = function (e) { return !nurJahr || (+e.von.slice(0, 4) <= nurJahr && +e.bis.slice(0, 4) >= nurJahr); };
  var liste = UZ.eintraege.filter(imJahr);
  var marks = UZ.markierungen.filter(function (m) { return imJahr(m) && tagById(m.tag); });
  if (!liste.length && !marks.length) { uMeldung('Keine Einträge zum Exportieren.', true); return; }
  var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  var z = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MeinKamerad//Urlaubskartei//DE', 'CALSCALE:GREGORIAN'];
  liste.forEach(function (e) {
    z.push('BEGIN:VEVENT', 'UID:' + e.id + '@meinkamerad', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + e.von.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + iso(plusTage(vonIso(e.bis), 1)).replace(/-/g, ''),
      'SUMMARY:' + icsText(ARTEN[e.art] + (e.status === 'genehmigt' ? '' : ' (geplant)')),
      'DESCRIPTION:' + icsText(arbeitstage(e.von, e.bis) + ' Arbeitstag(e)' + (e.notiz ? '. ' + e.notiz : '')),
      'TRANSP:OPAQUE', 'END:VEVENT');
  });
  marks.forEach(function (m) {
    z.push('BEGIN:VEVENT', 'UID:' + m.id + '@meinkamerad', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + m.von.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + iso(plusTage(vonIso(m.bis), 1)).replace(/-/g, ''),
      'SUMMARY:' + icsText(tagById(m.tag).name), 'DESCRIPTION:' + icsText(m.notiz || ''), 'TRANSP:TRANSPARENT', 'END:VEVENT');
  });
  z.push('END:VCALENDAR');
  var blob = new Blob([z.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'urlaub' + (nurJahr ? '-' + nurJahr : '') + '.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  var anz = liste.length + marks.length;
  uMeldung(anz + (anz === 1 ? ' Eintrag' : ' Einträge') + ' exportiert.');
}

$('u-land').innerHTML = Object.keys(UD.bundeslaender).map(function (k) { return '<option value="' + k + '">' + UD.bundeslaender[k] + '</option>'; }).join('');
$('u-land').addEventListener('change', function (e) { UZ.land = e.target.value; uSpeichern(); renderUrlaub(); });
function jahrWechsel(n) { uAnsicht.jahr += n; renderUrlaub(); }
$('u-jahr-zurueck').addEventListener('click', function () { jahrWechsel(-1); });
$('u-jahr-vor').addEventListener('click', function () { jahrWechsel(1); });
$('u-konten').addEventListener('change', function (e) {
  var art = e.target.getAttribute('data-konto'), feld = e.target.getAttribute('data-feld');
  if (!art || !feld) return;
  var j = uAnsicht.jahr, v = parseFloat(String(e.target.value).replace(',', '.'));
  var k = UZ.konten[j] || (UZ.konten[j] = {}), w = k[art] || (k[art] = {});
  if (isNaN(v) || v < 0) delete w[feld]; else w[feld] = Math.min(v, art === 'dza' ? 2000 : 366);
  uSpeichern(); renderUrlaub();
});
function monatWechsel(n) {
  uAnsicht.monat += n;
  if (uAnsicht.monat < 0) { uAnsicht.monat = 11; uAnsicht.jahr--; }
  if (uAnsicht.monat > 11) { uAnsicht.monat = 0; uAnsicht.jahr++; }
  renderUrlaub();
}
$('u-monat-zurueck').addEventListener('click', function () { monatWechsel(-1); });
$('u-monat-vor').addEventListener('click', function () { monatWechsel(1); });
// Auswahl im Kalender: Anfang und Ende antippen oder tippen und ziehen
function auswahlSetzen(a, b) {
  $('u-von').value = a < b ? a : b;
  $('u-bis').value = a < b ? b : a;
}
function auswahlTippen(s) {
  if (uAnsicht.auswahlStart && uAnsicht.auswahlStart !== s) {
    auswahlSetzen(uAnsicht.auswahlStart, s);
    uAnsicht.auswahlStart = '';
  } else {
    uAnsicht.auswahlStart = s;
    auswahlSetzen(s, s);
  }
}
// Nur die Markierung der Tage neu setzen (schnell, für das Ziehen)
function auswahlZeigen() {
  var sv = $('u-von').value, sb = $('u-bis').value || sv;
  Array.prototype.forEach.call(document.querySelectorAll('#u-kal button[data-tag]'), function (b) {
    var t = b.getAttribute('data-tag');
    b.classList.toggle('sel', !!sv && sv <= t && t <= sb);
    b.classList.toggle('sel-a', !!sv && t === sv);
    b.classList.toggle('sel-b', !!sv && t === sb);
  });
  uVorschau();
}
var zug = null, klickIgnorieren = 0;
function tagUnter(x, y) {
  var el = document.elementFromPoint(x, y);
  var b = el && el.closest ? el.closest('#u-kal button[data-tag]') : null;
  return b ? b.getAttribute('data-tag') : '';
}
$('u-kal').addEventListener('pointerdown', function (e) {
  var b = e.target.closest('button[data-tag]');
  if (!b || e.pointerType === 'touch' || (e.pointerType === 'mouse' && e.button !== 0)) return;
  zug = { start: b.getAttribute('data-tag'), ende: b.getAttribute('data-tag'), bewegt: false, id: e.pointerId };
  try { $('u-kal').setPointerCapture(e.pointerId); } catch (x) { /* nicht nötig */ }
});
$('u-kal').addEventListener('pointermove', function (e) {
  if (!zug || e.pointerId !== zug.id) return;
  var t = tagUnter(e.clientX, e.clientY);
  if (!t || t === zug.ende) return;
  zug.ende = t;
  if (t !== zug.start) zug.bewegt = true;
  if (zug.bewegt) { uAnsicht.auswahlStart = ''; auswahlSetzen(zug.start, t); auswahlZeigen(); }
});
function zugEnde(e) {
  if (!zug || e.pointerId !== zug.id) return;
  var z = zug; zug = null;
  klickIgnorieren = Date.now();
  if (z.bewegt) { uAnsicht.auswahlStart = ''; auswahlSetzen(z.start, z.ende); }
  else auswahlTippen(z.start);
  renderUrlaub();
  var neu = document.querySelector('#u-kal button[data-tag="' + z.ende + '"]');
  if (neu) neu.focus({ preventScroll: true });
}
$('u-kal').addEventListener('pointerup', zugEnde);
$('u-kal').addEventListener('pointercancel', function (e) { if (zug && e.pointerId === zug.id) { zug = null; renderUrlaub(); } });
// Finger: kurz gedrückt halten startet das Ziehen, sofortige Bewegung scrollt die Seite
var halte = null, fingerZug = null;
$('u-kal').addEventListener('touchstart', function (e) {
  if (e.touches.length !== 1) { clearTimeout(halte && halte.timer); halte = null; return; }
  var b = e.target.closest('button[data-tag]');
  if (!b) return;
  var t0 = e.touches[0];
  halte = { tag: b.getAttribute('data-tag'), x: t0.clientX, y: t0.clientY };
  halte.timer = setTimeout(function () {
    fingerZug = { start: halte.tag, ende: halte.tag, bewegt: false };
    halte = null;
    $('u-kal').classList.add('ziehen');
    uAnsicht.auswahlStart = '';
    auswahlSetzen(fingerZug.start, fingerZug.start);
    auswahlZeigen();
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (x) { /* ohne Vibration */ }
  }, 350);
}, { passive: true });
$('u-kal').addEventListener('touchmove', function (e) {
  var t0 = e.touches[0];
  if (halte) {
    if (Math.abs(t0.clientX - halte.x) > 8 || Math.abs(t0.clientY - halte.y) > 8) { clearTimeout(halte.timer); halte = null; }
    return;
  }
  if (!fingerZug) return;
  e.preventDefault();
  var t = tagUnter(t0.clientX, t0.clientY);
  if (!t || t === fingerZug.ende) return;
  fingerZug.ende = t;
  if (t !== fingerZug.start) fingerZug.bewegt = true;
  auswahlSetzen(fingerZug.start, t);
  auswahlZeigen();
}, { passive: false });
function fingerEnde() {
  if (halte) { clearTimeout(halte.timer); halte = null; return; }
  if (!fingerZug) return;
  var z = fingerZug; fingerZug = null;
  $('u-kal').classList.remove('ziehen');
  klickIgnorieren = Date.now();
  if (z.bewegt) { uAnsicht.auswahlStart = ''; auswahlSetzen(z.start, z.ende); }
  else { uAnsicht.auswahlStart = z.start; auswahlSetzen(z.start, z.start); }
  renderUrlaub();
}
$('u-kal').addEventListener('touchend', fingerEnde);
$('u-kal').addEventListener('touchcancel', fingerEnde);
$('u-kal').addEventListener('contextmenu', function (e) { if (e.target.closest('button[data-tag]')) e.preventDefault(); });
// Tastatur (Enter/Leertaste) löst nur einen Klick aus
$('u-kal').addEventListener('click', function (e) {
  if (Date.now() - klickIgnorieren < 350) return;
  var b = e.target.closest('button[data-tag]');
  if (!b) return;
  auswahlTippen(b.getAttribute('data-tag'));
  renderUrlaub();
  var neu = document.querySelector('#u-kal button[data-tag="' + b.getAttribute('data-tag') + '"]');
  if (neu) neu.focus();
});
$('u-von').addEventListener('input', function () { uAnsicht.auswahlStart = ''; auswahlZeigen(); });
$('u-bis').addEventListener('input', function () { uAnsicht.auswahlStart = ''; auswahlZeigen(); });
$('u-auswahl-weg').addEventListener('click', function () { uAnsicht.auswahlStart = ''; $('u-von').value = ''; $('u-bis').value = ''; $('u-notiz').value = ''; renderUrlaub(); });
$('u-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var von = $('u-von').value, bis = $('u-bis').value || von;
  if (!von) { uMeldung('Bitte einen Beginn wählen.', true); return; }
  if (bis < von) { uMeldung('Das Ende liegt vor dem Beginn.', true); return; }
  var konflikt = UZ.eintraege.filter(function (x) { return x.von <= bis && von <= x.bis; })[0];
  if (konflikt) { uMeldung('Der Zeitraum überschneidet sich mit ' + ARTEN[konflikt.art] + ' vom ' + datumKurz(konflikt.von) + '. Bitte zuerst diesen Eintrag löschen oder andere Tage wählen.', true); return; }
  var art = document.querySelector('input[name="u-art"]:checked').value;
  var n = arbeitstage(von, bis);
  if (!n) { uMeldung('In diesem Zeitraum liegen keine Arbeitstage, es wird kein Urlaub verbraucht.', true); return; }
  UZ.eintraege.push({ id: 'u' + Date.now(), von: von, bis: bis, art: art,
    status: document.querySelector('input[name="u-status"]:checked').value, notiz: $('u-notiz').value.trim().slice(0, 80) });
  uSpeichern();
  uAnsicht.auswahlStart = '';
  $('u-von').value = ''; $('u-bis').value = ''; $('u-notiz').value = '';
  var dv = vonIso(von); uAnsicht.jahr = dv.getFullYear(); uAnsicht.monat = dv.getMonth();
  renderUrlaub();
  uMeldung(ARTEN[art] + ' eingetragen: ' + tageText(n) + '.');
});
$('u-liste').addEventListener('click', function (e) {
  var w = e.target.closest('button[data-u-weg]');
  if (w) { UZ.eintraege = UZ.eintraege.filter(function (x) { return x.id !== w.getAttribute('data-u-weg'); }); uSpeichern(); renderUrlaub(); uMeldung('Eintrag gelöscht.'); return; }
  var st = e.target.closest('button[data-u-status]');
  if (st) { UZ.eintraege.forEach(function (x) { if (x.id === st.getAttribute('data-u-status')) x.status = x.status === 'genehmigt' ? 'geplant' : 'genehmigt'; }); uSpeichern(); renderUrlaub(); return; }
  var z = e.target.closest('button[data-u-zeige]');
  if (z) {
    var ein = UZ.eintraege.filter(function (x) { return x.id === z.getAttribute('data-u-zeige'); })[0];
    if (ein) { var dv = vonIso(ein.von); uAnsicht.jahr = dv.getFullYear(); uAnsicht.monat = dv.getMonth(); renderUrlaub(); $('u-kal').scrollIntoView({ block: 'center' }); }
  }
});
$('u-bruecken').addEventListener('click', function (e) {
  var b = e.target.closest('button[data-u-bruecke]');
  if (!b) return;
  var t = b.getAttribute('data-u-bruecke').split('|');
  $('u-von').value = t[0]; $('u-bis').value = t[1]; uAnsicht.auswahlStart = '';
  var dv = vonIso(t[0]); uAnsicht.monat = dv.getMonth();
  renderUrlaub();
  $('u-form').scrollIntoView({ block: 'start' });
});
$('u-jahresansicht').addEventListener('click', function (e) {
  var b = e.target.closest('button[data-u-monat]');
  if (!b) return;
  uAnsicht.monat = +b.getAttribute('data-u-monat');
  renderUrlaub();
  $('u-monat').scrollIntoView({ block: 'center' });
});
// In der Artefakt-Vorschau auf claude.ai sind .ics-Downloads nicht erlaubt: dort Hinweis statt Knöpfen
if (window.claude && typeof window.claude.use === 'function') {
  $('u-export-knoepfe').hidden = true;
  $('u-export-hinweis').hidden = false;
}
// Eigene Markierungen
function tagMeldung(t, fehler) { $('u-tag-meldung').className = 'u-meldung' + (fehler ? ' fehler' : ''); $('u-tag-meldung').textContent = t; }
$('u-tag-farben').addEventListener('input', function (e) {
  if (e.target.id === 'u-tag-farbe-eigen') document.querySelector('input[name="u-tag-farbe"][value="eigen"]').checked = true;
});
function tagFormular(auf) {
  $('u-tag-neu').hidden = !auf;
  $('u-tag-auf').setAttribute('aria-expanded', auf ? 'true' : 'false');
  $('u-tag-auf').setAttribute('aria-label', auf ? 'Neue Markierung schließen' : 'Neue Markierung anlegen');
  if (auf) { tagMeldung(''); $('u-tag-name').focus(); }
}
$('u-tag-auf').addEventListener('click', function () { tagFormular($('u-tag-neu').hidden); });
$('u-tag-zu').addEventListener('click', function () { $('u-tag-name').value = ''; tagFormular(false); $('u-tag-auf').focus(); });
$('u-tag-add').addEventListener('click', function () {
  var name = $('u-tag-name').value.trim().slice(0, 30);
  if (!name) { tagMeldung('Bitte einen Namen eingeben.', true); $('u-tag-name').focus(); return; }
  if (UZ.tags.some(function (t) { return t.name.toLowerCase() === name.toLowerCase(); })) { tagMeldung('Eine Markierung mit diesem Namen gibt es schon.', true); return; }
  var w = document.querySelector('input[name="u-tag-farbe"]:checked');
  var farbe = w && w.value === 'eigen' ? $('u-tag-farbe-eigen').value : (w ? w.value : FARBEN[0][0]);
  if (!RX_FARBE.test(farbe)) farbe = FARBEN[0][0];
  var t = { id: 't' + Date.now(), name: name, farbe: farbe.toUpperCase() };
  UZ.tags.push(t);
  uSpeichern();
  $('u-tag-name').value = '';
  tagFormular(false);
  renderUrlaub();
  $('u-mark-tag').value = t.id;
  tagMeldung('Markierung „' + name + '“ angelegt. Wähle oben im Kalender Tage aus und tippe auf „Markierung eintragen“.');
});
$('u-tag-liste').addEventListener('click', function (e) {
  var b = e.target.closest('button[data-u-tag-weg]');
  if (!b) return;
  var id = b.getAttribute('data-u-tag-weg'), t = tagById(id);
  var anz = UZ.markierungen.filter(function (m) { return m.tag === id; }).length;
  if (anz && b.getAttribute('data-bestaetigt') !== '1') {
    b.setAttribute('data-bestaetigt', '1');
    b.textContent = 'Wirklich löschen?';
    tagMeldung('„' + t.name + '“ ist ' + anz + (anz === 1 ? ' Zeitraum' : ' Zeiträumen') + ' zugeordnet. Beim Löschen werden diese mit entfernt. Zum Bestätigen noch einmal tippen.', true);
    return;
  }
  UZ.tags = UZ.tags.filter(function (x) { return x.id !== id; });
  UZ.markierungen = UZ.markierungen.filter(function (m) { return m.tag !== id; });
  uSpeichern();
  renderUrlaub();
  tagMeldung('Markierung „' + t.name + '“ gelöscht.');
});
$('u-mark-add').addEventListener('click', function () {
  var tagId = $('u-mark-tag').value, von = $('u-von').value, bis = $('u-bis').value || von;
  if (!tagById(tagId)) { uMeldung('Bitte zuerst unter „Eigene Markierungen“ eine Markierung anlegen.', true); tagFormular(true); $('u-tag-neu').scrollIntoView({ block: 'center' }); return; }
  if (!von) { uMeldung('Bitte im Kalender oder oben einen Zeitraum wählen.', true); return; }
  if (bis < von) { uMeldung('Das Ende liegt vor dem Beginn.', true); return; }
  var dopp = UZ.markierungen.filter(function (m) { return m.tag === tagId && m.von <= bis && von <= m.bis; })[0];
  if (dopp) { uMeldung('„' + tagById(tagId).name + '“ ist für einen Teil dieser Tage schon eingetragen (' + datumKurz(dopp.von) + (dopp.bis !== dopp.von ? ' bis ' + datumKurz(dopp.bis) : '') + ').', true); return; }
  UZ.markierungen.push({ id: 'm' + Date.now(), tag: tagId, von: von, bis: bis, notiz: $('u-notiz').value.trim().slice(0, 80) });
  uSpeichern();
  uAnsicht.auswahlStart = '';
  $('u-von').value = ''; $('u-bis').value = ''; $('u-notiz').value = '';
  var dv = vonIso(von); uAnsicht.jahr = dv.getFullYear(); uAnsicht.monat = dv.getMonth();
  renderUrlaub();
  uMeldung('„' + tagById(tagId).name + '“ eingetragen: ' + datumKurz(von) + (bis !== von ? ' bis ' + datumKurz(bis) : '') + '.');
});
$('u-mark-liste').addEventListener('click', function (e) {
  var w = e.target.closest('button[data-u-mark-weg]');
  if (w) { UZ.markierungen = UZ.markierungen.filter(function (m) { return m.id !== w.getAttribute('data-u-mark-weg'); }); uSpeichern(); renderUrlaub(); return; }
  var z = e.target.closest('button[data-u-mark-zeige]');
  if (z) {
    var m = UZ.markierungen.filter(function (x) { return x.id === z.getAttribute('data-u-mark-zeige'); })[0];
    if (m) { var dv = vonIso(m.von); uAnsicht.jahr = dv.getFullYear(); uAnsicht.monat = dv.getMonth(); renderUrlaub(); $('u-kal').scrollIntoView({ block: 'center' }); }
  }
});
$('u-export-jahr').addEventListener('click', function () { icsExport(uAnsicht.jahr); });
$('u-export-alle').addEventListener('click', function () { icsExport(0); });

// DuZ-Seite und Verknüpfung mit dem Kalender
$('duz-r-monat').addEventListener('change', function (e) {
  if (/^\d{4}-\d{2}$/.test(e.target.value)) { state.duzMonat = e.target.value; render(); }
});
$('duz-dg').addEventListener('change', function (e) {
  var dd = dgById(e.target.value);
  if (!dd) return;
  state.gruppe = dd.gruppe; state.dienstgrad = dd.id; state.bg = '';
  fuelleDienstgrade(); render();
});
$('duz-bg').addEventListener('change', function (e) { state.bg = e.target.value; render(); });
$('duz-zeitraum').addEventListener('change', function (e) { state.duzZeitraum = e.target.value; render(); });
function diensteZeigen(an) { UZ.diensteZeigen = an; uSpeichern(); render(); renderUrlaub(); }
$('duz-kal-zeigen').addEventListener('change', function (e) { diensteZeigen(e.target.checked); });
$('u-dienste-zeigen').addEventListener('change', function (e) { diensteZeigen(e.target.checked); });
function duzIcs(liste, dateiname) {
  if (!liste.length) { duzMeldung('Keine Dienste zum Exportieren.', true); return; }
  var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  var z = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MeinKamerad//DuZ//DE', 'CALSCALE:GREGORIAN'];
  liste.forEach(function (x) {
    var r = duzDienstAuswerten(x, '', UZ.land);
    z.push('BEGIN:VEVENT', 'UID:' + x.id + '@meinkamerad', 'DTSTAMP:' + stamp,
      'DTSTART:' + x.start.replace(/[-:]/g, '') + '00', 'DTEND:' + x.ende.replace(/[-:]/g, '') + '00',
      'SUMMARY:Dienst', 'DESCRIPTION:' + icsText(stdText(r.dauer, true) + ', davon ' + stdText(r.so + r.sa + r.na, true) + ' zu ungünstigen Zeiten'),
      'END:VEVENT');
  });
  z.push('END:VCALENDAR');
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([z.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }));
  a.download = dateiname;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  duzMeldung(liste.length + (liste.length === 1 ? ' Dienst' : ' Dienste') + ' exportiert.');
}
$('duz-export-monat').addEventListener('click', function () { duzIcs(DUZ_DIENSTE.filter(function (x) { return duzImMonat(x, state.duzMonat); }), 'dienste-' + state.duzMonat + '.ics'); });
$('duz-export-alle').addEventListener('click', function () { duzIcs(DUZ_DIENSTE.slice(), 'dienste.ics'); });
if (window.claude && typeof window.claude.use === 'function') {
  $('duz-export-knoepfe').hidden = true;
  $('duz-export-hinweis').hidden = false;
}
