/* MeinKamerad – Vergleich mehrerer Dienstgrade. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

/* ===== Vergleich ===== */
var VGL_MAX = 4;
var aktuelleAnsicht = 'start';
function imVergleich(id) { return state.vergleich.some(function (x) { return x.id === id; }); }
function dgById(id) { return DIENSTGRADE.filter(function (x) { return x.id === id; })[0]; }
function dgName(d) { return d.n[state.tsk] || d.n.san || d.n.heer; }
function vergleichUmschalten(id) {
  if (imVergleich(id)) state.vergleich = state.vergleich.filter(function (x) { return x.id !== id; });
  else if (state.vergleich.length < VGL_MAX) state.vergleich.push({ id: id, bg: dgById(id).bgs[0] });
}
// Monatsbetrag ohne Familie und Verwendungszulagen
function vglWerte(x) {
  var d = dgById(x.id), bg = x.bg;
  var dd = { id: d.id, gruppe: d.gruppe, bg: bg };
  var grund = istA(bg) ? TAB_A[bg][state.vglStufe - STUFE_MIN] : TAB_B[bg];
  var plus = erhoehung(dd);
  var az = D.amtszulagen[d.id];
  var amt = az && (az.art === 'immer' || state.vglAmt) ? az.betrag : 0;
  return { d: d, bg: bg, grund: grund, plus: plus, az: az, amt: amt, summe: Math.round((grund + plus + amt) * 100) / 100 };
}
function renderLeiste() {
  var n = state.vergleich.length;
  var zeigen = n > 0 && aktuelleAnsicht === 'dienstgrade';
  $('vgl-leiste').hidden = !zeigen;
  document.body.classList.toggle('mit-leiste', zeigen);
  $('vgl-leiste-text').textContent = n === 1 ? '1 Dienstgrad ausgewählt' : n + ' Dienstgrade ausgewählt' + (n >= VGL_MAX ? ' (Maximum)' : '');
}
function renderVergleich() {
  var n = state.vergleich.length;
  $('vgl-neu').innerHTML = '<option value="">' + (n >= VGL_MAX ? 'Maximal ' + VGL_MAX + ' Dienstgrade' : 'Bitte wählen …') + '</option>' +
    GRUPPEN.map(function (g) {
      var opts = DIENSTGRADE.filter(function (d) { return d.gruppe === g.id && sichtbar(d) && !imVergleich(d.id); })
        .map(function (d) { return '<option value="' + d.id + '">' + dgName(d) + (abkuerzung(d.id) ? ' (' + abkuerzung(d.id) + ')' : '') + '</option>'; }).join('');
      return opts ? '<optgroup label="' + g.name + '">' + opts + '</optgroup>' : '';
    }).join('');
  $('vgl-neu').disabled = n >= VGL_MAX;
  Array.prototype.forEach.call(document.querySelectorAll('input[name="vgl-stufe"]'), function (r) { r.checked = Number(r.value) === state.vglStufe; });
  $('vgl-amt').checked = state.vglAmt;
  $('vgl-leer').hidden = n > 0;
  $('vgl-tabelle-wrap').hidden = n === 0;
  if (!n) { $('vgl-tabelle').innerHTML = ''; renderLeiste(); return; }

  var w = state.vergleich.map(vglWerte);
  var basis = w[0].summe;
  function zeile(titel, zellen, cls) {
    return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><th scope="row">' + titel + '</th>' + zellen.join('') + '</tr>';
  }
  var html = '';
  html += zeile('Dienstgrad', w.map(function (v) {
    return '<td><div class="kopf"><span class="rk' + (state.tsk !== 'marine' ? ' bild' : '') + '">' + rangBild(v.d.id) + '</span>' +
      '<span class="name">' + dgName(v.d) + '</span>' + (abkuerzung(v.d.id) ? '<span class="abk">' + abkuerzung(v.d.id) + '</span>' : '') +
      '<button type="button" class="entfernen" data-vgl-weg="' + v.d.id + '">Entfernen</button></div></td>';
  }));
  html += zeile('Gruppe', w.map(function (v) {
    return '<td>' + GRUPPEN.filter(function (g) { return g.id === v.d.gruppe; })[0].name + '</td>';
  }));
  html += zeile('Besoldungs&shy;gruppe', w.map(function (v) {
    if (v.d.bgs.length < 2) return '<td>' + bgLabel(v.bg) + '</td>';
    return '<td><select data-vgl-bg="' + v.d.id + '" aria-label="Besoldungsgruppe ' + dgName(v.d) + '">' +
      v.d.bgs.map(function (b) { return '<option value="' + b + '"' + (b === v.bg ? ' selected' : '') + '>' + bgLabel(b) + '</option>'; }).join('') + '</select></td>';
  }));
  html += zeile('Grundgehalt', w.map(function (v) {
    return '<td class="zahl">' + eur.format(v.grund + v.plus) + '<span class="klein">' + (istA(v.bg) ? 'Stufe ' + state.vglStufe : 'fester Betrag') +
      (v.plus ? ', inkl. ' + eur.format(v.plus) + ' Erhöhungsbetrag' : '') + '</span></td>';
  }));
  html += zeile('Amtszulage', w.map(function (v) {
    if (!v.az) return '<td class="zahl">–</td>';
    if (v.amt) return '<td class="zahl">' + eur.format(v.amt) + '</td>';
    return '<td class="zahl">–<span class="klein">möglich: ' + eur.format(v.az.betrag) + '</span></td>';
  }));
  html += zeile('Summe pro Monat', w.map(function (v) { return '<td class="zahl">' + eur.format(v.summe) + '</td>'; }), 'summe');
  html += zeile('Unterschied', w.map(function (v, i) {
    if (i === 0) return '<td class="zahl">Basis</td>';
    var diff = Math.round((v.summe - basis) * 100) / 100;
    return '<td class="zahl' + (diff > 0 ? ' plus' : '') + '">' + (diff > 0 ? '+' : diff < 0 ? '−' : '±') + eur.format(Math.abs(diff)) +
      '<span class="klein">' + (diff >= 0 ? '+' : '−') + eur.format(Math.abs(diff * 12)) + ' im Jahr</span></td>';
  }));
  html += zeile('Spanne Grundgehalt', w.map(function (v) {
    if (!istA(v.bg)) return '<td class="zahl">' + eur.format(TAB_B[v.bg]) + '</td>';
    var t = TAB_A[v.bg];
    return '<td class="zahl">' + eur.format(t[0] + v.plus) + ' bis ' + eur.format(t[t.length - 1] + v.plus) + '<span class="klein">Stufe ' + STUFE_MIN + ' bis ' + STUFE_MAX + '</span></td>';
  }));
  html += zeile('', w.map(function (v) {
    return '<td><button type="button" class="knopf primaer" data-rechner="' + v.d.id + '" data-bg="' + v.bg + '">Im Rechner</button></td>';
  }));
  $('vgl-tabelle').innerHTML = html;
  renderLeiste();
}

// Aufgeklappter Bereich unter einem Dienstgrad
function dgDetail(d, g) {
  var info = state.infoDg === d.id;
  var html = '<div class="dg-detail" id="dg-detail-' + d.id + '"><div class="dg-aktionen">' +
    '<button type="button" class="knopf primaer" data-rechner="' + d.id + '"><svg class="ic" aria-hidden="true"><use href="#i-calc"/></svg>Zum Rechner</button>' +
    '<button type="button" class="knopf sekundaer" data-vgl="' + d.id + '" aria-pressed="' + imVergleich(d.id) + '"><svg class="ic" aria-hidden="true"><use href="#i-vgl"/></svg>' + (imVergleich(d.id) ? 'Im Vergleich ✓' : 'Zum Vergleich') + '</button>' +
    '<button type="button" class="knopf sekundaer" data-fav-dg="' + d.id + '" aria-pressed="' + istFav('dienstgrade', d.id) + '"><svg class="ic stern" aria-hidden="true"><use href="#i-star"/></svg>' + (istFav('dienstgrade', d.id) ? 'Favorit ✓' : 'Favorit') + '</button>' +
    '<button type="button" class="knopf sekundaer" data-info="' + d.id + '" aria-expanded="' + info + '"><svg class="ic" aria-hidden="true"><use href="#i-book"/></svg>' + (info ? 'Infos ausblenden' : 'Weitere Infos') + '</button>' +
    '</div>';
  if (info) {
    var zeilen = [];
    if (abkuerzung(d.id)) zeilen.push(['Abkürzung', abkuerzung(d.id)]);
    if (NATO_RANG[d.id]) zeilen.push(['NATO-Rang', NATO_RANG[d.id]]);
    if (BEFOERDERUNG[d.id]) zeilen.push(['Beförderung', 'Frühestens nach ' + BEFOERDERUNG[d.id] + ' Dienstzeit ab Diensteintritt']);
    zeilen.push(['Dienstgradgruppe', g.name]);
    zeilen.push(['Besoldungsgruppe', bgsLabel(d.bgs)]);
    d.bgs.forEach(function (bg) {
      zeilen.push(['Grundgehalt ' + bgLabel(bg), istA(bg)
        ? 'Stufe ' + STUFE_MIN + ': ' + eur.format(TAB_A[bg][0]) + ' bis Stufe ' + STUFE_MAX + ': ' + eur.format(TAB_A[bg][TAB_A[bg].length - 1])
        : eur.format(TAB_B[bg]) + ' (fester Betrag)']);
    });
    var az = D.amtszulagen[d.id];
    if (az) zeilen.push(['Amtszulage', eur.format(az.betrag) + (az.art === 'immer' ? '' : ' bei Funktionen, die sich abheben') + ' (Anlage I, ' + az.fussnote + ')']);
    var andere = [['heer', 'Heer'], ['luft', 'Luftwaffe'], ['marine', 'Marine'], ['san', 'Sanitätsdienst']]
      .filter(function (t) { return t[0] !== state.tsk && d.n[t[0]] && d.n[t[0]] !== d.n[state.tsk]; })
      .reduce(function (acc, t) {
        var vorhanden = acc.filter(function (x) { return x.name === d.n[t[0]]; })[0];
        if (vorhanden) vorhanden.tsk.push(t[1]); else acc.push({ name: d.n[t[0]], tsk: [t[1]] });
        return acc;
      }, [])
      .map(function (x) { return x.tsk.join(', ') + ': ' + x.name; });
    if (andere.length) zeilen.push(['In anderen Teilstreitkräften', andere.join(' · ')]);
    if (d.zusatz) zeilen.push(['Hinweis', d.zusatz]);
    var eigen = (D.dienstgradInfos || {})[d.id];
    html += '<div class="dg-info"><dl class="info">' + zeilen.map(function (z) { return '<dt>' + z[0] + '</dt><dd>' + z[1] + '</dd>'; }).join('') + '</dl>' +
      (eigen ? '<div class="eigen"></div>' : '') + '</div>';
  }
  return html + '</div>';
}

function renderDienstgrade() {
  $('dg-liste').innerHTML = GRUPPEN.map(function (g) {
    var liste = DIENSTGRADE.filter(function (d) { return d.gruppe === g.id && sichtbar(d); });
    if (!liste.length) return '';
    var zeilen = liste.map(function (d) {
      var b0 = d.bgs[0];
      var ab = istA(b0)
        ? 'Grundgehalt ab ' + eur.format(TAB_A[b0][0])
        : 'Fester Betrag ' + eur.format(TAB_B[b0]);
      if (d.amt === 'ja') ab += ' · Amtszulage ' + eur.format(D.amtszulagen[d.id].betrag);
      if (d.amt === 'möglich') ab += ' · Amtszulage möglich';
      if (d.zusatz) ab += ' · ' + d.zusatz;
      var offen = state.offenDg === d.id;
      return '<div class="dg-item' + (offen ? ' offen' : '') + '">' +
        '<button type="button" class="zeile mit-icon mit-pfeil" data-dg="' + d.id + '" aria-expanded="' + offen + '" aria-controls="dg-detail-' + d.id + '"' + (d.id === state.dienstgrad ? ' aria-current="true"' : '') + '>' +
        '<span class="rk' + (state.tsk !== 'marine' ? ' bild' : '') + '">' + rangBild(d.id) + '</span><span class="n">' + d.n[state.tsk] + (abkuerzung(d.id) ? '<span class="abk">' + abkuerzung(d.id) + '</span>' : '') + '</span><span class="r">' + bgsLabel(d.bgs).replace(/ oder /g, ' / ') + '</span><span class="s">' + ab + '</span><span class="pfeil" aria-hidden="true"></span></button>' +
        (offen ? dgDetail(d, g) : '') + '</div>';
    }).join('');
    var offen = (g.id in gruppeOffen) ? gruppeOffen[g.id] : g.id === state.gruppe;
    return '<details class="panel" data-g="' + g.id + '"' + (offen ? ' open' : '') + '><summary><h2>' + g.name + '</h2>' +
      '<a class="info-link" href="#gruppe-' + g.id.replace(/_/g, '-') + '" aria-label="Woher kommt der Name? ' + g.name + '">' + INFO_ICON + '</a></summary>' +
      '<div class="liste">' + zeilen + '</div></details>';
  }).join('');
  var eigenEl = document.querySelector('#dg-liste .dg-info .eigen');
  if (eigenEl) eigenEl.textContent = D.dienstgradInfos[state.infoDg];
}

function renderZulagen() {
  var d = aktuell();
  $('zul-kopf').textContent = 'Beträge für ' + d.name + ' (' + bgLabel(d.bg) + ') nach Anlage IX BBesG, gültig ab ' + D.stand.gueltigAb + '. Tippe auf eine Zulage, um sie im Rechner zu wählen.';
  $('fue-kopf').textContent = 'Beträge für ' + d.name + ' (' + bgLabel(d.bg) + ') nach Anlage IX BBesG, gültig ab ' + D.stand.gueltigAb + '. Tippe auf eine Funktion, um sie im Rechner zu wählen.';
  $('fue-liste').innerHTML = FUEHRUNG.filter(function (f) { return f.id !== 'keine'; }).map(function (f) {
    var b = fuehrungBetrag(f, d);
    var text = b === null ? 'Nur für ' + gruppenText(f.gruppen) + ', nicht für ' + bgLabel(d.bg) : eur.format(b) + ' pro Monat';
    return '<div class="fav-item"><button type="button" class="zeile" data-fuehrung="' + f.id + '"' + (f.id === state.fuehrung ? ' aria-current="true"' : '') + '>' +
      '<span class="n">' + f.name + '</span><span class="r">Nr. ' + f.nr.split(' ')[0] + '</span><span class="s">' + text + (f.nr.indexOf(' ') > 0 ? ' · Nr. ' + f.nr : '') + '</span></button>' +
      sternKlein('fuehrung:' + f.id, f.name) + '</div>';
  }).join('');
  $('zul-liste').innerHTML = STELLENZULAGEN.filter(function (z) { return z.id !== 'keine'; }).map(function (z) {
    var text;
    if (z.dauer) {
      text = z.dauer.map(function (x) { return x.label + ' ' + eur.format(x.betrag); }).join(' · ') + ' pro Monat';
    } else {
      var b = z.betrag(d);
      text = b === null ? 'Für ' + bgLabel(d.bg) + ' nicht hinterlegt' : eur.format(b) + ' pro Monat';
    }
    return '<div class="fav-item"><button type="button" class="zeile" data-stelle="' + z.id + '"' + (z.id === state.stelle ? ' aria-current="true"' : '') + '>' +
      '<span class="n">' + z.name + '</span><span class="r">Nr. ' + z.nr + '</span><span class="s">' + text + '</span></button>' +
      sternKlein('stelle:' + z.id, z.name) + '</div>';
  }).join('');

  $('avz-liste').innerHTML = EINSATZGEBIETE.filter(function (g) { return g.stufe > 0; }).map(function (g) {
    return '<button type="button" class="zeile" data-gebiet="' + g.id + '"' + (g.id === state.gebiet ? ' aria-current="true"' : '') + '>' +
      '<span class="n">' + g.name + '</span><span class="r">Stufe ' + g.stufe + '</span><span class="s">' + eur.format(AVZ_STUFEN[g.stufe]) + ' pro Tag' + (AVZ.gebieteBeispiel ? ' (Beispiel)' : '') + '</span></button>';
  }).join('');
}
