/* MeinKamerad – Mein Profil und Daten sichern. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

/* ===== Mein Profil (nur im Browser gespeichert) ===== */
var P_KEY = 'meinkamerad-profil';
var P_FELDER = ['tsk', 'dienstgrad', 'bg', 'stufe', 'verheiratet', 'partner', 'kinder', 'kgBei'];
function profilLaden() {
  try {
    var j = JSON.parse(localStorage.getItem(P_KEY) || 'null');
    if (j && typeof j === 'object' && dgById(j.dienstgrad)) return j;
  } catch (e) { /* ohne Speicher kein Profil */ }
  return null;
}
var PROF = profilLaden();
function profilSpeichern() { try { localStorage.setItem(P_KEY, JSON.stringify(PROF)); } catch (e) { /* nicht speicherbar */ } }
// Profil in den Rechner (und damit in den DuZ-Rechner) übernehmen
function profilAnwenden() {
  if (!PROF) return;
  var d = dgById(PROF.dienstgrad);
  if (TSK.some(function (t) { return t.id === PROF.tsk; })) state.tsk = PROF.tsk;
  if (!d || !d.n[state.tsk]) return;
  state.dienstgrad = d.id; state.gruppe = d.gruppe;
  state.bg = d.bgs.indexOf(PROF.bg) >= 0 ? PROF.bg : d.bgs[0];
  if (PROF.stufe >= STUFE_MIN && PROF.stufe <= STUFE_MAX) state.stufe = PROF.stufe;
  state.verheiratet = !!PROF.verheiratet;
  state.partner = !!PROF.verheiratet && !!PROF.partner;
  state.kinder = Math.max(0, Math.min(6, +PROF.kinder || 0));
  state.kgBei = PROF.kgBei === 'partner' ? 'partner' : 'ich';
}
function profilText() {
  var d = dgById(PROF.dienstgrad), bg = d.bgs.indexOf(PROF.bg) >= 0 ? PROF.bg : d.bgs[0];
  var t = [(d.n[PROF.tsk] || d.n.heer || d.n.san), bgLabel(bg) + (istA(bg) ? ', Stufe ' + PROF.stufe : '')];
  if (PROF.verheiratet) t.push('verheiratet');
  if (PROF.kinder) t.push(PROF.kinder + (PROF.kinder === 1 ? ' Kind' : ' Kinder'));
  return t.join(' · ');
}
function profilGleichState() {
  var d = aktuell();
  return PROF && state.tsk === PROF.tsk && d.id === PROF.dienstgrad && d.bg === (dgById(PROF.dienstgrad).bgs.indexOf(PROF.bg) >= 0 ? PROF.bg : d.bgs[0]) &&
    (!istA(d.bg) || state.stufe === PROF.stufe) && state.verheiratet === !!PROF.verheiratet && state.kinder === (+PROF.kinder || 0) &&
    state.partner === (!!PROF.verheiratet && !!PROF.partner) && (!state.partner || !state.kinder || state.kgBei === PROF.kgBei);
}
function renderProfilHinweis() {
  var zeigen = !!PROF && !profilGleichState();
  $('r-profil-wrap').hidden = !zeigen;
  if (zeigen) $('r-profil-text').textContent = 'Mein Profil: ' + profilText();
}
function renderProfil() {
  var p = PROF || { tsk: state.tsk, dienstgrad: state.dienstgrad, bg: aktuell().bg, stufe: state.stufe, verheiratet: state.verheiratet, partner: state.partner, kinder: state.kinder, kgBei: state.kgBei };
  var d = dgById(p.dienstgrad), tsk = TSK.some(function (t) { return t.id === p.tsk; }) ? p.tsk : 'heer';
  if (!d.n[tsk]) d = DIENSTGRADE.filter(function (x) { return x.n[tsk]; })[0];
  var bg = d.bgs.indexOf(p.bg) >= 0 ? p.bg : d.bgs[0];
  $('p-tsk').innerHTML = TSK.map(function (t) { return '<option value="' + t.id + '">' + t.name + '</option>'; }).join('');
  $('p-tsk').value = tsk;
  $('p-dg').innerHTML = GRUPPEN.map(function (g) {
    var opts = DIENSTGRADE.filter(function (x) { return x.gruppe === g.id && x.n[tsk]; })
      .map(function (x) { return '<option value="' + x.id + '">' + x.n[tsk] + (abkuerzung(x.id) ? ' (' + abkuerzung(x.id) + ')' : '') + '</option>'; }).join('');
    return opts ? '<optgroup label="' + g.name + '">' + opts + '</optgroup>' : '';
  }).join('');
  $('p-dg').value = d.id;
  $('p-bg-wrap').hidden = d.bgs.length < 2;
  $('p-bg').innerHTML = d.bgs.map(function (b) { return '<option value="' + b + '">' + bgLabel(b) + '</option>'; }).join('');
  $('p-bg').value = bg;
  $('p-stufe-wrap').hidden = !istA(bg);
  var st = '';
  for (var i = STUFE_MIN; i <= STUFE_MAX; i++) st += '<option value="' + i + '">Stufe ' + i + '</option>';
  $('p-stufe').innerHTML = st;
  $('p-stufe').value = String(p.stufe >= STUFE_MIN && p.stufe <= STUFE_MAX ? p.stufe : STUFE_MIN);
  $('p-verh').checked = !!p.verheiratet;
  $('p-partner-wrap').hidden = !p.verheiratet;
  $('p-partner').checked = !!p.partner;
  var ki = '';
  for (i = 0; i <= 6; i++) ki += '<option value="' + i + '">' + i + '</option>';
  $('p-kinder').innerHTML = ki;
  $('p-kinder').value = String(+p.kinder || 0);
  $('p-kg-wrap').hidden = !(p.verheiratet && p.partner && +p.kinder > 0);
  $('p-kg').value = p.kgBei === 'partner' ? 'partner' : 'ich';
  $('p-land').innerHTML = $('u-land').innerHTML;
  $('p-land').value = UZ.land;
  $('p-dz').innerHTML = dienstzeitenHtml();
  $('p-dz-summe').textContent = zahl(wochenStunden()) + ' Std. je Woche';
}
function profilAusFormular() {
  var d = dgById($('p-dg').value), tsk = $('p-tsk').value;
  if (!d || !d.n[tsk]) d = DIENSTGRADE.filter(function (x) { return x.n[tsk]; })[0];
  var bg = d.bgs.indexOf($('p-bg').value) >= 0 ? $('p-bg').value : d.bgs[0];
  var verh = $('p-verh').checked;
  PROF = { tsk: tsk, dienstgrad: d.id, bg: bg, stufe: +$('p-stufe').value || STUFE_MIN, verheiratet: verh,
    partner: verh && $('p-partner').checked, kinder: +$('p-kinder').value || 0, kgBei: $('p-kg').value === 'partner' ? 'partner' : 'ich' };
  profilSpeichern();
  profilAnwenden();
  fuelleDienstgrade();
  render();
  renderProfil();
}
['p-tsk', 'p-dg', 'p-bg', 'p-stufe', 'p-verh', 'p-partner', 'p-kinder', 'p-kg'].forEach(function (id) { $(id).addEventListener('change', profilAusFormular); });
$('p-land').addEventListener('change', function (e) { UZ.land = e.target.value; uSpeichern(); renderUrlaub(); render(); });
$('p-dz').addEventListener('change', function (e) {
  var dzTag = e.target.getAttribute('data-dz');
  if (!dzTag) return;
  var dz = UZ.dienstzeiten || (UZ.dienstzeiten = {}), alt = dienstzeit(dzTag), wert = e.target.value, fd = e.target.getAttribute('data-dz-feld');
  var neuZ = { b: alt.b, e: alt.e, p: alt.p };
  if (fd === 'p') neuZ.p = Math.min(240, Math.max(0, parseInt(wert, 10) || 0));
  else neuZ[fd] = RX_ZEIT.test(wert) ? wert : '';
  dz[dzTag] = neuZ;
  uSpeichern(); renderProfil();
});
$('r-profil').addEventListener('click', function () { profilAnwenden(); fuelleDienstgrade(); render(); renderProfilHinweis(); });

// Daten sichern und laden: alle Einträge dieser Seite im Browser
function pMeldung(t, fehler) { $('p-meldung').className = 'u-meldung' + (fehler ? ' fehler' : ''); $('p-meldung').textContent = t; }
$('p-export').addEventListener('click', function () {
  var daten = { app: 'MeinKamerad', version: 1, gesichert: new Date().toISOString(), eintraege: {} };
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('meinkamerad-') === 0) daten.eintraege[k] = localStorage.getItem(k);
    }
  } catch (e) { pMeldung('Der Speicher dieses Browsers ist nicht lesbar.', true); return; }
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(daten, null, 1)], { type: 'application/json' }));
  a.download = 'meinkamerad-daten.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  pMeldung('Daten gesichert: meinkamerad-daten.json');
});
$('p-import-knopf').addEventListener('click', function () { $('p-import').click(); });
$('p-import').addEventListener('change', function (e) {
  var f = e.target.files && e.target.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function () {
    try {
      var j = JSON.parse(String(r.result));
      if (!j || j.app !== 'MeinKamerad' || !j.eintraege || typeof j.eintraege !== 'object') throw new Error('falsch');
      var keys = Object.keys(j.eintraege).filter(function (k) { return k.indexOf('meinkamerad-') === 0 && typeof j.eintraege[k] === 'string'; });
      keys.forEach(function (k) { JSON.parse(j.eintraege[k]); });
      keys.forEach(function (k) { localStorage.setItem(k, j.eintraege[k]); });
      pMeldung('Daten geladen, die Seite wird neu geladen.');
      setTimeout(function () { location.reload(); }, 600);
    } catch (err) { pMeldung('Diese Datei enthält keine gesicherten MeinKamerad-Daten.', true); }
  };
  r.readAsText(f);
  e.target.value = '';
});
if (window.claude && typeof window.claude.use === 'function') {
  $('p-sicher-knoepfe').hidden = true;
  $('p-sicher-hinweis').hidden = false;
}
