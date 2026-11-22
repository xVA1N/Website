/* MeinKamerad – Mein Zeitstrahl: nächste Erfahrungsstufen und frühester Beförderungszeitpunkt. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

// Mindestdienstzeit in Monaten ab Diensteintritt (Soldatenlaufbahnverordnung, nur Mannschaften hinterlegt)
var BEF_MONATE = { gefr: 3, ogefr: 6, hgefr: 12, stgefr: 36, ostgefr: 48, korp: 84, stkorp: 120 };
var BEF_FOLGE = ['soldat', 'gefr', 'ogefr', 'hgefr', 'stgefr', 'ostgefr', 'korp', 'stkorp'];
var MONATE_KURZ = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

function plusMonate(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, d.getDate()); }
function monatText(d) { return MONATE_KURZ[d.getMonth()] + ' ' + d.getFullYear(); }
function datumText(d) { return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear(); }
function dauerText(monate) {
  var j = Math.floor(monate / 12), m = monate % 12;
  return [j ? j + (j === 1 ? ' Jahr' : ' Jahre') : '', m ? m + (m === 1 ? ' Monat' : ' Monate') : ''].filter(Boolean).join(' und ') || 'weniger als 1 Monat';
}

function renderZeitstrahl(p, d, bg) {
  var heuteD = new Date(), zeilen = [], hinweise = [];
  var tsk = p.tsk || state.tsk;

  // Erfahrungsstufen (nur Besoldungsordnung A)
  if (!istA(bg)) {
    hinweise.push('In ' + bgLabel(bg) + ' gibt es feste Beträge und keine Erfahrungsstufen.');
  } else if (!p.stufeSeit) {
    hinweise.push('Trag ein, seit wann du in deiner aktuellen Stufe bist. Dann siehst du, wann die nächsten Stufen kommen.');
  } else {
    var tab = TAB_A[bg], start = vonIso(p.stufeSeit + '-01'), s = p.stufe, dat = start;
    for (; s < STUFE_MAX; s++) {
      var lz = D.stufenlaufzeit[s];
      if (!lz) break;
      dat = plusMonate(dat, lz * 12);
      var betrag = tab[s + 1 - STUFE_MIN], plus = betrag - tab[s - STUFE_MIN];
      zeilen.push({ d: dat, t: 'Stufe ' + (s + 1), s: eur.format(betrag) + ' (+' + eur.format(plus) + ')', vorbei: dat <= heuteD });
    }
    if (s >= STUFE_MAX && !zeilen.length) hinweise.push('Du bist in der Endstufe ' + STUFE_MAX + '.');
  }

  // Beförderung (nur wo die Mindestdienstzeit hinterlegt ist)
  var i = BEF_FOLGE.indexOf(d.id), naechster = i >= 0 ? BEF_FOLGE[i + 1] : null;
  if (naechster && BEF_MONATE[naechster]) {
    if (p.eintritt) {
      var bd = plusMonate(vonIso(p.eintritt), BEF_MONATE[naechster]), nd = dgById(naechster);
      zeilen.push({ d: bd, t: 'Beförderung: ' + (nd.n[tsk] || nd.n.heer), s: 'frühestens, nach ' + dauerText(BEF_MONATE[naechster]) + ' Dienstzeit', vorbei: bd <= heuteD });
    } else {
      hinweise.push('Trag deinen Diensteintritt ein, dann siehst du, ab wann eine Beförderung frühestens möglich ist.');
    }
  } else if (d.id !== 'stkorp') {
    hinweise.push('Beförderungsfristen sind bisher nur für Mannschaften hinterlegt.');
  }
  if (p.eintritt) {
    var e = vonIso(p.eintritt), mon = (heuteD.getFullYear() - e.getFullYear()) * 12 + heuteD.getMonth() - e.getMonth() - (heuteD.getDate() < e.getDate() ? 1 : 0);
    if (mon >= 0) hinweise.unshift('Dienstzeit bisher: ' + dauerText(mon) + '.');
  }

  zeilen.sort(function (a, b) { return a.d - b.d; });
  $('p-zeitstrahl').innerHTML = (zeilen.length ? '<ol class="zeitstrahl">' + zeilen.map(function (z) {
    return '<li class="' + (z.vorbei ? 'vorbei' : '') + '"><span class="wann">' + (z.t.indexOf('Stufe') === 0 ? monatText(z.d) : datumText(z.d)) + '</span>' +
      '<span class="was"><b>' + esc(z.t) + '</b><small>' + esc(z.s) + (z.vorbei ? ' · bereits erreicht' : '') + '</small></span></li>';
  }).join('') + '</ol>' : '') +
    (hinweise.length ? '<p class="hint">' + hinweise.map(esc).join(' ') + '</p>' : '') +
    '<p class="hint">Der Stufenaufstieg setzt anforderungsgerechte Leistungen voraus, Zeiten ohne Bezüge verschieben ihn (§ 27 BBesG). Ob befördert wird, hängt von Eignung, Leistung und freien Stellen ab.</p>';
}
