/* MeinKamerad – Dienst zu ungünstigen Zeiten. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

/* ===== Dienst zu ungünstigen Zeiten: Dienste eintragen, Rechner teilt auf ===== */
var DUZ_KEY = 'meinkamerad-duz';
var DUZ_MAX_TAGE = 7;
var RX_DT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
function duzLaden() {
  try {
    var j = JSON.parse(localStorage.getItem(DUZ_KEY) || 'null');
    if (Array.isArray(j)) return j.map(function (x) {
      // Ältere Einträge (Tag, von, bis) umwandeln
      if (x && x.datum && x.von && x.bis && !x.start) {
        var endTag = x.bis <= x.von ? iso(plusTage(vonIso(x.datum), 1)) : x.datum;
        return { id: x.id, start: x.datum + 'T' + x.von, ende: endTag + 'T' + x.bis };
      }
      return x;
    }).filter(function (x) { return x && RX_DT.test(x.start) && RX_DT.test(x.ende) && x.ende > x.start; });
  } catch (e) { /* ohne Speicher weiter */ }
  return [];
}
var DUZ_DIENSTE = duzLaden();
function duzSpeichern() { try { localStorage.setItem(DUZ_KEY, JSON.stringify(DUZ_DIENSTE)); } catch (e) { /* nicht speicherbar */ } }
function minuten(hhmm) { var t = hhmm.split(':'); return (+t[0]) * 60 + (+t[1]); }
function tagNr(isoTag) { var t = isoTag.split('-'); return Date.UTC(+t[0], +t[1] - 1, +t[2]) / 864e5; }
// Dauer in Minuten nach Kalender (ohne Zeitumstellung)
function duzDauer(x) { return (tagNr(x.ende.slice(0, 10)) - tagNr(x.start.slice(0, 10))) * 1440 + minuten(x.ende.slice(11)) - minuten(x.start.slice(11)); }
function dtKurz(dt) { return datumKurz(dt.slice(0, 10)).slice(0, -4) + ' ' + dt.slice(11); }
// Kategorie einer Minute nach § 3 Abs. 2 und § 4 Abs. 1 EZulV
function duzKategorie(datum, min, land) {
  var d = vonIso(datum), j = d.getFullYear(), w = d.getDay();
  if (w === 0 || feiertage(j, land)[datum]) return 'so';
  var ostern = ostersonntag(j), mmdd = datum.slice(5);
  var sonder = datum === iso(plusTage(ostern, -1)) || datum === iso(plusTage(ostern, 48)) || mmdd === '12-24' || mmdd === '12-31';
  if (sonder && min >= 12 * 60) return 'so';
  if (w === 6 && min >= 13 * 60 && min < 20 * 60) return 'sa';
  if (min >= 20 * 60 || min < 6 * 60) return 'na';
  return '';
}
// Minuten je Kategorie; mit monat (JJJJ-MM) nur die Minuten in diesem Monat
function duzDienstAuswerten(x, monat, land) {
  var start = minuten(x.start.slice(11)), dauer = duzDauer(x), tag0 = vonIso(x.start.slice(0, 10));
  var r = { so: 0, sa: 0, na: 0, dauer: dauer, imMonat: 0 }, tage = {};
  for (var m = 0; m < dauer; m++) {
    var abs = start + m, off = Math.floor(abs / 1440);
    var tag = tage[off] || (tage[off] = iso(plusTage(tag0, off)));
    if (monat && tag.slice(0, 7) !== monat) continue;
    r.imMonat++;
    var k = duzKategorie(tag, abs % 1440, land);
    if (k) r[k]++;
  }
  return r;
}
function duzImMonat(x, monat) { return x.start.slice(0, 7) <= monat && monat <= x.ende.slice(0, 7); }
function duzMonatAuswerten(monat, land) {
  var s = { so: 0, sa: 0, na: 0 };
  DUZ_DIENSTE.forEach(function (x) {
    if (!duzImMonat(x, monat)) return;
    var r = duzDienstAuswerten(x, monat, land);
    s.so += r.so; s.sa += r.sa; s.na += r.na;
  });
  return { so: s.so / 60, sa: s.sa / 60, na: s.na / 60 };
}
// Vorbelegung: Beginn am 1. des gewählten Monats um 7 Uhr, Ende am Folgetag um 7 Uhr (24-Stunden-Dienst)
function duzFormVorbelegen() {
  var erster = state.duzMonat + '-01';
  $('duz-start-tag').value = erster;
  $('duz-start-zeit').value = '07:00';
  $('duz-ende-tag').value = iso(plusTage(vonIso(erster), 1));
  $('duz-ende-zeit').value = '07:00';
}
function renderDuzListe(land, h) {
  $('duz-monat').value = state.duzMonat;
  $('duz-land').value = land;
  var aktiv = document.activeElement;
  if ($('duz-start-tag').value.slice(0, 7) !== state.duzMonat && aktiv !== $('duz-start-tag') && aktiv !== $('duz-ende-tag')) duzFormVorbelegen();
  var monat = state.duzMonat;
  var liste = DUZ_DIENSTE.filter(function (x) { return duzImMonat(x, monat); });
  $('duz-liste').hidden = !liste.length;
  $('duz-liste').innerHTML = liste.map(function (x) {
    var r = duzDienstAuswerten(x, monat, land), teile = [];
    if (r.so) teile.push(stdText(r.so, true) + ' Sonn-/Feiertag');
    if (r.sa) teile.push(stdText(r.sa, true) + ' Samstag');
    if (r.na) teile.push(stdText(r.na, true) + ' nachts');
    var ft = [x.start.slice(0, 10), x.ende.slice(0, 10)].map(function (t) { return feiertage(vonIso(t).getFullYear(), land)[t]; }).filter(Boolean);
    return '<div class="fav-item"><div class="zeile" style="cursor:default"><span class="n">' + dtKurz(x.start) + ' bis ' + dtKurz(x.ende) + '</span><span class="r">' + stdText(r.dauer, true) + '</span>' +
      '<span class="s">' + (ft.length ? ft.join(', ') + ' · ' : '') + (r.imMonat !== r.dauer ? stdText(r.imMonat, true) + ' in diesem Monat · ' : '') + (teile.length ? teile.join(', ') : 'keine ungünstigen Zeiten') + '</span></div>' +
      '<span class="u-eintrag-akt"><button type="button" data-duz-weg="' + x.id + '" aria-label="Dienst ab ' + dtKurz(x.start) + ' löschen">Löschen</button></span></div>';
  }).join('');
  var S = D.duz.saetze;
  $('duz-summe').innerHTML = liste.length ? [
    ['Sonn- und Feiertage', h.so, S.sonnFeiertag], ['Samstage 13–20 Uhr', h.sa, S.samstag], ['Nachts 20–6 Uhr', h.na, S.nacht]
  ].map(function (z) { return '<dt>' + z[0] + '</dt><dd>' + zahlDe(z[1]) + ' Std. × ' + eur.format(z[2]) + ' = ' + eur.format(Math.round(z[1] * z[2] * 100) / 100) + '</dd>'; }).join('') : '';
}
function monatName(m) { return MONATE[+m.slice(5) - 1] + ' ' + m.slice(0, 4); }
// Betrag eines Monats nach § 3 Abs. 1 (Besoldungsordnung A, mehr als Mindeststunden)
function duzMonatBetrag(monat, d, land) {
  var h = duzMonatAuswerten(monat, land), S = D.duz.saetze, std = h.so + h.sa + h.na;
  var betrag = Math.round((h.so * S.sonnFeiertag + h.sa * S.samstag + h.na * S.nacht) * 100) / 100, grund = '';
  if (std && d.bg.charAt(0) !== D.duz.nurOrdnung) { betrag = 0; grund = 'ordnung'; }
  else if (std && std <= D.duz.mindestStunden) { betrag = 0; grund = 'grenze'; }
  return { h: h, std: std, betrag: betrag, grund: grund };
}
function duzStdZelle(h, std) {
  return '<td class="zahl">' + zahlDe(std) + (std ? '<span class="klein">' + [['So/Ft', h.so], ['Sa', h.sa], ['Nacht', h.na]].filter(function (x) { return x[1]; })
    .map(function (x) { return x[0] + ' ' + zahlDe(x[1]); }).join(' · ') + '</span>' : '') + '</td>';
}
function renderDuzSeite(d, land) {
  var m = state.duzMonat;
  // Dienstgrad-Auswahl direkt auf der DuZ-Seite (gemeinsam mit dem Rechner)
  if (document.activeElement !== $('duz-dg')) {
    $('duz-dg').innerHTML = GRUPPEN.map(function (g) {
      var opts = DIENSTGRADE.filter(function (x) { return x.gruppe === g.id && sichtbar(x); })
        .map(function (x) { return '<option value="' + x.id + '">' + x.n[state.tsk] + (abkuerzung(x.id) ? ' (' + abkuerzung(x.id) + ')' : '') + '</option>'; }).join('');
      return opts ? '<optgroup label="' + g.name + '">' + opts + '</optgroup>' : '';
    }).join('');
    $('duz-dg').value = d.id;
  }
  $('duz-bg-wrap').hidden = d.bgs.length < 2;
  $('duz-bg').innerHTML = d.bgs.map(function (b) { return '<option value="' + b + '">' + bgLabel(b) + '</option>'; }).join('');
  $('duz-bg').value = d.bg;
  $('duz-fuer').textContent = (d.bg.charAt(0) !== D.duz.nurOrdnung
    ? 'In Besoldungsordnung B gibt es keine Zulage für Dienst zu ungünstigen Zeiten, die Beträge unten sind deshalb 0 €. '
    : 'Wichtig ist nur, ob du in Besoldungsordnung A bist; die Höhe der Zulage hängt nicht vom Dienstgrad ab. ') +
    'Die Auswahl gilt auch im Rechner.';
  $('duz-liste-titel').textContent = 'Dienste im ' + monatName(m);
  var mb = duzMonatBetrag(m, d, land);
  $('duz-v-betrag').innerHTML = '<strong>Zulage ' + monatName(m) + ': ' + eur.format(mb.betrag) + '</strong>' +
    (mb.grund === 'grenze' ? ' (erst ab mehr als ' + D.duz.mindestStunden + ' Stunden, eingetragen sind ' + zahlDe(mb.std) + ')' : '') +
    (mb.grund === 'ordnung' ? ' (nur Besoldungsordnung A)' : '');
  $('duz-grenze').textContent = D.duz.mindestStunden;
  Array.prototype.forEach.call(document.querySelectorAll('input[name="duz-zeitraum"]'), function (r) { r.checked = r.value === state.duzZeitraum; });
  // Monate des gewählten Zeitraums
  var j = +m.slice(0, 4), mi = +m.slice(5) - 1, monate = [];
  if (state.duzZeitraum === 'monat') monate = [mi];
  else if (state.duzZeitraum === 'quartal') { var q = Math.floor(mi / 3) * 3; monate = [q, q + 1, q + 2]; }
  else monate = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  var sum = { so: 0, sa: 0, na: 0, std: 0, betrag: 0 };
  var zeilen = monate.map(function (k) {
    var mm = j + '-' + p2(k + 1), r = duzMonatBetrag(mm, d, land);
    sum.so += r.h.so; sum.sa += r.h.sa; sum.na += r.h.na; sum.std += r.std; sum.betrag += r.betrag;
    return '<tr' + (mm === m ? ' class="aktiv"' : '') + '><th scope="row">' + MONATE[k] + '</th>' + duzStdZelle(r.h, r.std) +
      '<td class="zahl">' + eur.format(r.betrag) + (r.grund === 'grenze' ? '<span class="klein">unter Grenze</span>' : '') + (r.grund === 'ordnung' ? '<span class="klein">nur Ordnung A</span>' : '') + '</td></tr>';
  });
  var titel = state.duzZeitraum === 'monat' ? monatName(m) : state.duzZeitraum === 'quartal' ? (Math.floor(mi / 3) + 1) + '. Quartal ' + j : 'Jahr ' + j;
  $('duz-tabelle').innerHTML = '<caption class="hint" style="caption-side:top;text-align:left;padding:8px 10px">' + titel + ' · Stunden und Zulage</caption>' +
    '<thead><tr><th scope="col">Monat</th><th scope="col">Stunden</th><th scope="col">Zulage</th></tr></thead><tbody>' +
    zeilen.join('') + (monate.length > 1 ? '<tr class="summe"><th scope="row">Summe</th>' + duzStdZelle(sum, sum.std) + '<td class="zahl">' + eur.format(Math.round(sum.betrag * 100) / 100) + '</td></tr>' : '') + '</tbody>';
  $('duz-kal-zeigen').checked = !!UZ.diensteZeigen;
}
function stdText(minOderStd, istMin) { var h = istMin ? minOderStd / 60 : minOderStd; return zahlDe(h) + ' Std.'; }
