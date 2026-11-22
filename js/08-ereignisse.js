/* MeinKamerad – Bedienung von Rechner, Dienstgraden, Zulagen und DuZ. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

/* ===== Ereignisse ===== */
$('gruppen').addEventListener('change', function (e) {
  var g = GRUPPEN.filter(function (x) { return x.id === e.target.value; })[0];
  if (!g) return;
  waehleGruppe(g.id);
  fuelleDienstgrade();
  render();
});
$('tsk').addEventListener('change', function (e) {
  var cur = DIENSTGRADE.filter(function (x) { return x.id === state.dienstgrad; })[0];
  state.tsk = e.target.value;
  if (!sichtbar(cur)) waehleGruppe(state.gruppe);
  fuelleDienstgrade();
  render();
});
$('dienstgrad').addEventListener('change', function (e) {
  state.dienstgrad = e.target.value;
  state.bg = '';
  render();
});
$('bg-seg').addEventListener('change', function (e) {
  state.bg = e.target.value;
  render();
});
$('stufen').addEventListener('change', function (e) {
  state.stufe = Number(e.target.value);
  render();
});
$('stufen-tabelle').addEventListener('click', function (e) {
  var b = e.target.closest('button[data-stufe]');
  if (!b) return;
  state.stufe = Number(b.getAttribute('data-stufe'));
  render();
});
$('r-stkl').addEventListener('change', function (e) { state.stkl = +e.target.value; render(); });
$('r-kirche').addEventListener('change', function (e) { state.kirche = e.target.checked; render(); });
$('verheiratet').addEventListener('change', function (e) {
  state.verheiratet = e.target.checked;
  render();
});
$('partner-oed').addEventListener('change', function (e) {
  state.partner = e.target.checked;
  render();
});
$('kg-bei').addEventListener('change', function (e) {
  state.kgBei = e.target.value;
  render();
});
$('kind-minus').addEventListener('click', function () {
  state.kinder = Math.max(0, state.kinder - 1);
  render();
});
$('kind-plus').addEventListener('click', function () {
  state.kinder = Math.min(6, state.kinder + 1);
  render();
});
$('stelle').addEventListener('change', function (e) {
  state.stelle = e.target.value;
  state.dauer = 0;
  render();
});
$('dauer').addEventListener('change', function (e) {
  state.dauer = Number(e.target.value);
  render();
});
$('gebiet').addEventListener('change', function (e) {
  state.gebiet = e.target.value;
  render();
});
[['fue', 'frageFue', 'fuehrung'], ['stelle', 'frageStelle', 'stelle'], ['duz', 'frageDuz', 'duz-r-monat'], ['avz', 'frageAvz', 'gebiet']].forEach(function (q) {
  Array.prototype.forEach.call(document.querySelectorAll('input[name="frage-' + q[0] + '"]'), function (r) {
    r.addEventListener('change', function (e) {
      state[q[1]] = e.target.value === 'ja';
      render();
      if (state[q[1]]) $(q[2]).focus();
    });
  });
});
// Dienste zu ungünstigen Zeiten
$('duz-land').innerHTML = Object.keys(D.urlaub.bundeslaender).map(function (k) { return '<option value="' + k + '">' + D.urlaub.bundeslaender[k] + '</option>'; }).join('');
$('duz-monat').addEventListener('change', function (e) {
  if (/^\d{4}-\d{2}$/.test(e.target.value)) { state.duzMonat = e.target.value; render(); }
});
$('duz-land').addEventListener('change', function (e) { UZ.land = e.target.value; uSpeichern(); render(); });
function duzMeldung(t, fehler) { $('duz-meldung').className = 'u-meldung' + (fehler ? ' fehler' : ''); $('duz-meldung').textContent = t; }
$('duz-start-tag').addEventListener('change', function (e) {
  var et = $('duz-ende-tag');
  // Ende-Tag mitziehen: bei gleicher Uhrzeit ein Tag später, sonst mindestens der Beginn-Tag
  if (e.target.value && (!et.value || et.value <= e.target.value)) {
    et.value = $('duz-ende-zeit').value && $('duz-ende-zeit').value <= $('duz-start-zeit').value ? iso(plusTage(vonIso(e.target.value), 1)) : e.target.value;
  }
});
$('duz-add').addEventListener('click', function () {
  var st = $('duz-start-tag').value, sz = $('duz-start-zeit').value, et = $('duz-ende-tag').value, ez = $('duz-ende-zeit').value;
  if (!st || !sz || !et || !ez) { duzMeldung('Bitte Beginn und Ende jeweils mit Tag und Uhrzeit eintragen.', true); return; }
  var neu = { id: 'd' + Date.now(), start: st + 'T' + sz, ende: et + 'T' + ez };
  if (neu.ende <= neu.start) {
    duzMeldung('Das Ende liegt nicht nach dem Beginn.' + (et === st ? ' Geht der Dienst über Mitternacht, beim Ende den nächsten Tag wählen.' : ''), true);
    return;
  }
  if (duzDauer(neu) > DUZ_MAX_TAGE * 1440) { duzMeldung('Ein Dienst darf höchstens ' + DUZ_MAX_TAGE + ' Tage dauern. Bitte in mehrere Dienste aufteilen.', true); return; }
  var konflikt = DUZ_DIENSTE.filter(function (x) { return x.start < neu.ende && neu.start < x.ende; })[0];
  if (konflikt) { duzMeldung('Überschneidet sich mit dem Dienst ' + dtKurz(konflikt.start) + ' bis ' + dtKurz(konflikt.ende) + '.', true); return; }
  DUZ_DIENSTE.push(neu);
  DUZ_DIENSTE.sort(function (a, b) { return a.start < b.start ? -1 : 1; });
  duzSpeichern();
  if (!duzImMonat(neu, state.duzMonat)) state.duzMonat = st.slice(0, 7);
  var r = duzDienstAuswerten(neu, '', UZ.land);
  duzMeldung('Dienst eingetragen: ' + stdText(r.dauer, true) + ', davon ' + stdText(r.so + r.sa + r.na, true) + ' zu ungünstigen Zeiten.');
  duzFormVorbelegen();
  render();
});
$('duz-liste').addEventListener('click', function (e) {
  var b = e.target.closest('button[data-duz-weg]');
  if (!b) return;
  DUZ_DIENSTE = DUZ_DIENSTE.filter(function (x) { return x.id !== b.getAttribute('data-duz-weg'); });
  duzSpeichern();
  duzMeldung('Dienst gelöscht.');
  render();
});
$('avz-tage').addEventListener('input', function (e) {
  var n = parseInt(e.target.value, 10);
  if (!isNaN(n)) { state.tage = n; render(); }
});

// Auswahl in den Nachschlage-Reitern übernimmt den Wert in den Rechner
$('dg-liste').addEventListener('click', function (e) {
  var zeile = e.target.closest('button[data-dg]');
  if (zeile) {
    var id = zeile.getAttribute('data-dg');
    state.offenDg = state.offenDg === id ? '' : id;
    state.infoDg = '';
    renderDienstgrade();
    var neu = document.querySelector('#dg-liste button[data-dg="' + id + '"]');
    if (neu) neu.focus();
    return;
  }
  var favBtn = e.target.closest('button[data-fav-dg]');
  if (favBtn) {
    var fid = favBtn.getAttribute('data-fav-dg');
    favUmschalten('dienstgrade', fid);
    renderDienstgrade();
    var neuFav = document.querySelector('#dg-liste button[data-fav-dg="' + fid + '"]');
    if (neuFav) neuFav.focus();
    return;
  }
  var vglBtn = e.target.closest('button[data-vgl]');
  if (vglBtn) {
    var vid = vglBtn.getAttribute('data-vgl');
    vergleichUmschalten(vid);
    renderDienstgrade();
    renderVergleich();
    var neuVgl = document.querySelector('#dg-liste button[data-vgl="' + vid + '"]');
    if (neuVgl) neuVgl.focus();
    return;
  }
  var infoBtn = e.target.closest('button[data-info]');
  if (infoBtn) {
    var iid = infoBtn.getAttribute('data-info');
    state.infoDg = state.infoDg === iid ? '' : iid;
    renderDienstgrade();
    var neuInfo = document.querySelector('#dg-liste button[data-info="' + iid + '"]');
    if (neuInfo) neuInfo.focus();
    return;
  }
  var b = e.target.closest('button[data-rechner]');
  if (!b) return;
  var dd = DIENSTGRADE.filter(function (x) { return x.id === b.getAttribute('data-rechner'); })[0];
  if (!dd) return;
  state.gruppe = dd.gruppe;
  state.dienstgrad = dd.id;
  state.bg = '';
  fuelleDienstgrade();
  render();
  go('rechner');
});
$('amt-check').addEventListener('change', function (e) {
  state.amtHerausgehoben = e.target.checked;
  render();
});
$('fuehrung').addEventListener('change', function (e) {
  state.fuehrung = e.target.value;
  render();
});
function zulSternKlick(e) {
  var s = e.target.closest('button[data-fav-zul]');
  if (!s) return false;
  var key = s.getAttribute('data-fav-zul');
  favUmschalten('zulagen', key);
  renderZulagen();
  var neu = document.querySelector('button[data-fav-zul="' + key + '"]');
  if (neu) neu.focus();
  return true;
}
$('fue-liste').addEventListener('click', function (e) {
  if (zulSternKlick(e)) return;
  var b = e.target.closest('button[data-fuehrung]');
  if (!b) return;
  state.fuehrung = b.getAttribute('data-fuehrung');
  state.frageFue = true;
  render();
  go('rechner');
});
$('zul-liste').addEventListener('click', function (e) {
  if (zulSternKlick(e)) return;
  var b = e.target.closest('button[data-stelle]');
  if (!b) return;
  state.stelle = b.getAttribute('data-stelle');
  state.frageStelle = true;
  state.dauer = 0;
  render();
  go('rechner');
});
$('avz-liste').addEventListener('click', function (e) {
  var b = e.target.closest('button[data-gebiet]');
  if (!b) return;
  state.gebiet = b.getAttribute('data-gebiet');
  state.frageAvz = true;
  render();
  go('rechner');
});

$('dg-liste').addEventListener('toggle', function (e) {
  var d = e.target;
  if (d && d.tagName === 'DETAILS') gruppeOffen[d.getAttribute('data-g')] = d.open;
}, true);

var vglStufenHtml = '';
for (var vs = STUFE_MIN; vs <= STUFE_MAX; vs++) {
  vglStufenHtml += '<label><input type="radio" name="vgl-stufe" value="' + vs + '"><span>' + vs + '</span></label>';
}
$('vgl-stufe').innerHTML = vglStufenHtml;
$('vgl-stufe').addEventListener('change', function (e) { state.vglStufe = Number(e.target.value); renderVergleich(); });
$('vgl-amt').addEventListener('change', function (e) { state.vglAmt = e.target.checked; renderVergleich(); });
$('vgl-neu').addEventListener('change', function (e) {
  if (!e.target.value) return;
  vergleichUmschalten(e.target.value);
  renderVergleich();
  renderDienstgrade();
  $('vgl-neu').focus();
});
$('vgl-leeren').addEventListener('click', function () {
  state.vergleich = [];
  renderDienstgrade();
  renderVergleich();
});
$('vgl-tabelle').addEventListener('change', function (e) {
  var id = e.target.getAttribute('data-vgl-bg');
  if (!id) return;
  state.vergleich.forEach(function (x) { if (x.id === id) x.bg = e.target.value; });
  renderVergleich();
});
$('vgl-tabelle').addEventListener('click', function (e) {
  var weg = e.target.closest('button[data-vgl-weg]');
  if (weg) {
    vergleichUmschalten(weg.getAttribute('data-vgl-weg'));
    renderVergleich();
    renderDienstgrade();
    return;
  }
  var b = e.target.closest('button[data-rechner]');
  if (!b) return;
  var dd = dgById(b.getAttribute('data-rechner'));
  state.gruppe = dd.gruppe;
  state.dienstgrad = dd.id;
  state.bg = b.getAttribute('data-bg');
  if (istA(state.bg)) state.stufe = state.vglStufe;
  fuelleDienstgrade();
  render();
  go('rechner');
});

$('seite-fav').addEventListener('click', function () {
  if (!SEITEN_FAV[aktuelleAnsicht]) return;
  favUmschalten('seiten', aktuelleAnsicht);
  renderSeitenStern();
});

// Berechnung speichern
$('calc-fav-open').addEventListener('click', function () {
  $('calc-fav-form').hidden = false;
  $('calc-fav-open').hidden = true;
  $('calc-fav-msg').textContent = '';
  $('calc-fav-name').value = $('kette').textContent;
  $('calc-fav-name').focus();
  $('calc-fav-name').select();
});
function calcFormZu() { $('calc-fav-form').hidden = true; $('calc-fav-open').hidden = false; }
$('calc-fav-abbrechen').addEventListener('click', function () { calcFormZu(); $('calc-fav-open').focus(); });
$('calc-fav-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var name = $('calc-fav-name').value.trim() || $('kette').textContent;
  var snap = {};
  snap.duzDienste = DUZ_DIENSTE.filter(function (x) { return duzImMonat(x, state.duzMonat || ''); });
  CALC_KEYS.forEach(function (k) { snap[k] = state[k]; });
  FAV.berechnungen.unshift({ id: 'b' + Date.now(), name: name.slice(0, 60), snap: snap, brutto: $('brutto').textContent, kette: $('kette').textContent });
  FAV.berechnungen = FAV.berechnungen.slice(0, 20);
  favSpeichern();
  calcFormZu();
  $('calc-fav-msg').textContent = 'Gespeichert unter Favoriten: „' + name.slice(0, 60) + '“.';
  $('calc-fav-open').focus();
});

// Favoriten-Seite
$('fav-calc').addEventListener('click', function (e) {
  var weg = e.target.closest('button[data-fav-calc-weg]');
  if (weg) {
    var wid = weg.getAttribute('data-fav-calc-weg');
    FAV.berechnungen = FAV.berechnungen.filter(function (b) { return b.id !== wid; });
    favSpeichern();
    renderFavoriten();
    return;
  }
  var o = e.target.closest('button[data-fav-calc]');
  if (!o) return;
  var b = FAV.berechnungen.filter(function (x) { return x.id === o.getAttribute('data-fav-calc'); })[0];
  if (!b) return;
  CALC_KEYS.forEach(function (k) { if (k in b.snap) state[k] = b.snap[k]; });
  // Ältere Favoriten ohne Fragen: aus den Werten ableiten
  if (!('frageFue' in b.snap)) state.frageFue = state.fuehrung !== 'keine';
  if (!('frageStelle' in b.snap)) state.frageStelle = state.stelle !== 'keine';
  if (!('frageDuz' in b.snap)) state.frageDuz = false;
  if (!('frageAvz' in b.snap)) state.frageAvz = state.gebiet !== 'keine';
  // Dienste des gespeicherten Monats wiederherstellen, andere Monate bleiben unverändert
  if (Array.isArray(b.snap.duzDienste) && b.snap.duzMonat) {
    var gesp = b.snap.duzDienste.map(function (x) {
      if (x.datum && !x.start) return { id: x.id, start: x.datum + 'T' + x.von, ende: (x.bis <= x.von ? iso(plusTage(vonIso(x.datum), 1)) : x.datum) + 'T' + x.bis };
      return { id: x.id, start: x.start, ende: x.ende };
    }).filter(function (x) { return RX_DT.test(x.start) && RX_DT.test(x.ende); });
    DUZ_DIENSTE = DUZ_DIENSTE.filter(function (x) { return !duzImMonat(x, b.snap.duzMonat) && !gesp.some(function (g) { return g.start < x.ende && x.start < g.ende; }); }).concat(gesp);
    DUZ_DIENSTE.sort(function (a, c) { return a.start < c.start ? -1 : 1; });
    duzSpeichern();
  }
  var dd = dgById(state.dienstgrad);
  state.gruppe = dd.gruppe;
  if (dd.bgs.indexOf(state.bg) < 0) state.bg = '';
  if (!FUEHRUNG.some(function (f) { return f.id === state.fuehrung; })) state.fuehrung = 'keine';
  if (!STELLENZULAGEN.some(function (z) { return z.id === state.stelle; })) { state.stelle = 'keine'; state.dauer = 0; }
  if (!EINSATZGEBIETE.some(function (g) { return g.id === state.gebiet; })) state.gebiet = 'keine';
  if (!(state.stufe >= STUFE_MIN && state.stufe <= STUFE_MAX)) state.stufe = STUFE_MIN;
  var sz = STELLENZULAGEN.filter(function (z) { return z.id === state.stelle; })[0];
  if (sz && sz.dauer && !sz.dauer[state.dauer]) state.dauer = 0;
  fuelleDienstgrade();
  render();
  go('rechner');
});
$('fav-dg').addEventListener('click', function (e) {
  var weg = e.target.closest('button[data-fav-dg-weg]');
  if (weg) { favUmschalten('dienstgrade', weg.getAttribute('data-fav-dg-weg')); renderFavoriten(); renderDienstgrade(); return; }
  var o = e.target.closest('button[data-fav-dg-open]');
  if (!o) return;
  var dd = dgById(o.getAttribute('data-fav-dg-open'));
  state.offenDg = dd.id;
  state.infoDg = '';
  gruppeOffen[dd.gruppe] = true;
  renderDienstgrade();
  go('dienstgrade');
  var ziel = document.querySelector('#dg-liste button[data-dg="' + dd.id + '"]');
  if (ziel) { ziel.scrollIntoView({ block: 'center' }); ziel.focus({ preventScroll: true }); }
});
$('fav-zul').addEventListener('click', function (e) {
  var s = e.target.closest('button[data-fav-zul]');
  if (s) { favUmschalten('zulagen', s.getAttribute('data-fav-zul')); renderFavoriten(); renderZulagen(); return; }
  var o = e.target.closest('button[data-fav-zul-open]');
  if (!o) return;
  var t = o.getAttribute('data-fav-zul-open').split(':');
  if (t[0] === 'fuehrung') { state.fuehrung = t[1]; state.frageFue = true; }
  else { state.stelle = t[1]; state.dauer = 0; state.frageStelle = true; }
  render();
  go('rechner');
});
