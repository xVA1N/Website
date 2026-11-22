/* MeinKamerad – Darstellung des Rechners. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

/* ===== Darstellung des Rechners ===== */
function render() {
  var d = aktuell();
  var a = istA(d.bg);

  var multi = d.bgs.length > 1;
  $('bg-feld').hidden = !multi;
  if (multi) {
    $('bg-seg').innerHTML = d.bgs.map(function (b) {
      return '<label><input type="radio" name="bg" value="' + b + '"><span>' + bgLabel(b) + '</span></label>';
    }).join('');
    document.querySelector('input[name="bg"][value="' + d.bg + '"]').checked = true;
  }
  $('zus-hint').hidden = !d.zusatz;
  $('zus-hint').textContent = d.zusatz ? d.zusatz + '.' : '';
  var az = D.amtszulagen[d.id];
  $('amt-hint').hidden = !az;
  $('amt-hint').textContent = !az ? '' : az.art === 'immer'
    ? 'Für diesen Dienstgrad wird eine Amtszulage von ' + eur.format(az.betrag) + ' gezahlt (Anlage I, ' + az.fussnote + ').'
    : 'In Funktionen, die sich abheben, ist eine Amtszulage von ' + eur.format(az.betrag) + ' möglich (Anlage I, ' + az.fussnote + ').';
  $('amt-check-wrap').hidden = !(az && az.art === 'moeglich');
  $('amt-check').checked = state.amtHerausgehoben;
  $('amt-check-sub').textContent = az ? 'Amtszulage ' + eur.format(az.betrag) : '';
  var amtBetrag = az && (az.art === 'immer' || state.amtHerausgehoben) ? az.betrag : 0;

  document.querySelector('input[name="gruppe"][value="' + state.gruppe + '"]').checked = true;
  document.querySelector('input[name="tsk"][value="' + state.tsk + '"]').checked = true;

  $('stufen-feld').hidden = !a;
  $('tabelle-panel').hidden = !a;
  if (a) {
    document.querySelector('input[name="stufe"][value="' + state.stufe + '"]').checked = true;
    $('stufen-hint').textContent = 'Mit der Dienstzeit steigt die Stufe. Wählbar sind die Stufen ' + STUFE_MIN + ' bis ' + STUFE_MAX + ' nach dem Stand vom ' + D.stand.gueltigAb + '.';
  } else {
    $('stufen-hint').textContent = '';
  }

  $('verheiratet').checked = state.verheiratet;
  $('partner-oed').checked = state.partner;
  $('amt-verheiratet').textContent = '+' + eur.format(stufe1(true, state.partner));
  $('kg-wrap').hidden = !(state.partner && state.kinder > 0);
  document.querySelector('input[name="kg-bei"][value="' + state.kgBei + '"]').checked = true;
  var famInfo = [];
  if (state.partner && state.verheiratet) famInfo.push('Stufe 1 wird geteilt: Du erhältst ' + eur.format(stufe1(true, true)) + ' statt ' + eur.format(FZ.verheiratet) + ', den Rest erhält dein Partner oder deine Partnerin (§ 40 Abs. 4 BBesG).');
  if (state.partner && state.kinder > 0) famInfo.push(state.kgBei === 'ich'
    ? 'Die Kinderbeträge erhältst du, weil du das Kindergeld bekommst (§ 40 Abs. 5 BBesG).'
    : 'Die Kinderbeträge erhält dein Partner oder deine Partnerin, weil er oder sie das Kindergeld bekommt (§ 40 Abs. 5 BBesG).');
  $('fam-info').hidden = !famInfo.length;
  $('fam-info').textContent = famInfo.join(' ');
  var kg = state.kinder && (!state.partner || state.kgBei === 'ich') ? state.kinder * D.kindergeld.jeKind : 0;
  $('kg-info').hidden = !kg;
  $('kg-info').textContent = kg ? 'Dazu kommt Kindergeld von ' + eur.format(kg) + ' im Monat (' + eur.format(D.kindergeld.jeKind) + ' je Kind, ' + D.kindergeld.fundstelle + '). Es zahlt die Familienkasse, deshalb ist es nicht in der Bruttobesoldung enthalten.' : '';
  $('kinder').textContent = String(state.kinder);
  $('kind-minus').disabled = state.kinder <= 0;
  $('kind-plus').disabled = state.kinder >= 6;

  // Fragen: Ja/Nein steuert, ob der Bereich aufklappt und mitgerechnet wird
  [['fue', 'frageFue'], ['stelle', 'frageStelle'], ['duz', 'frageDuz'], ['avz', 'frageAvz']].forEach(function (q) {
    document.querySelector('input[name="frage-' + q[0] + '"][value="' + (state[q[1]] ? 'ja' : 'nein') + '"]').checked = true;
    $('frage-' + q[0] + '-inhalt').hidden = !state[q[1]];
  });
  var fz = FUEHRUNG.filter(function (f) { return f.id === (state.frageFue ? state.fuehrung : 'keine'); })[0];
  $('fuehrung').value = state.fuehrung;
  var fueBetrag = fuehrungBetrag(fz, d);
  $('fuehrung-info').textContent = fz.id === 'keine'
    ? 'Zulagen für Kompaniechef, Zugführer, Gruppenführer, Kompaniefeldwebel und vergleichbare Funktionen.'
    : fueBetrag === null
      ? 'Diese Zulage gibt es nur in ' + gruppenText(fz.gruppen) + ', nicht für ' + bgLabel(d.bg) + '.'
      : 'Nr. ' + fz.nr + ' der Vorbemerkungen zu den Besoldungsordnungen A und B: ' + eur.format(fueBetrag) + ' pro Monat (Anlage IX, gültig ab ' + D.stand.gueltigAb + ').';
  fueBetrag = fueBetrag || 0;
  var sz = STELLENZULAGEN.filter(function (z) { return z.id === (state.frageStelle ? state.stelle : 'keine'); })[0];
  $('stelle').value = state.stelle;
  $('dauer-wrap').hidden = !sz.dauer;
  $('dauer-label').textContent = sz.auswahlLabel || 'Dauer in dieser Verwendung';
  if (sz.dauer) {
    if ($('dauer').getAttribute('data-for') !== sz.id) {
      $('dauer').innerHTML = sz.dauer.map(function (x, i) { return '<option value="' + i + '">' + x.label + '</option>'; }).join('');
      $('dauer').setAttribute('data-for', sz.id);
    }
    $('dauer').value = String(state.dauer);
  }
  var stelleBetrag = 0;
  var stelleInfo = 'Die Höhe hängt von der Verwendung und von der Besoldungsgruppe ab.';
  if (sz.nurDienstgrade && sz.nurDienstgrade.indexOf(d.id) < 0) {
    stelleInfo = 'Diese Zulage gibt es nur für ' + sz.nurDienstgradeText + '.';
  } else if (sz.nurGruppen && !inGruppen(d.bg, sz.nurGruppen)) {
    stelleInfo = 'Diese Zulage gibt es nur in ' + gruppenText(sz.nurGruppen) + ', nicht für ' + bgLabel(d.bg) + '.';
  } else if (sz.dauer) {
    stelleBetrag = sz.dauer[state.dauer].betrag;
  } else if (sz.betrag) {
    var sb = sz.betrag(d);
    if (sb === null) { stelleInfo = 'Für ' + bgLabel(d.bg) + ' ist für diese Zulage kein Betrag hinterlegt.'; }
    else { stelleBetrag = sb; }
  }
  if (stelleBetrag) {
    stelleInfo = 'Nr. ' + sz.nr + ' der Vorbemerkungen zu den Besoldungsordnungen A und B: ' + eur.format(stelleBetrag) + ' pro Monat (' + (sz.quelle || 'Anlage IX, gültig ab ' + D.stand.gueltigAb) + ').' + (sz.hinweis ? ' ' + sz.hinweis : '');
  }
  $('stelle-info').textContent = stelleInfo;

  var geb = EINSATZGEBIETE.filter(function (g) { return g.id === (state.frageAvz ? state.gebiet : 'keine'); })[0];
  $('gebiet').value = state.gebiet;
  $('tage-wrap').hidden = !geb.stufe;
  var tage = Math.min(31, Math.max(1, state.tage || 1));
  var tagessatz = geb.stufe ? AVZ_STUFEN[geb.stufe] : 0;
  var avz = tagessatz * tage;
  $('avz-info').textContent = geb.stufe
    ? (AVZ.gebieteBeispiel ? 'Beispielzuordnung: ' : '') + 'Stufe ' + geb.stufe + ', ' + eur.format(tagessatz) + ' pro Tag, ' + tage + ' Tage.'
    : 'Ohne Auslandsverwendung entfällt der Zuschlag.';

  // Regeln aus Anlage I, wenn mehrere Zulagen zusammentreffen
  var regeln = [];
  if (stelleBetrag && sz.nichtNebenAVZ && avz) {
    regeln.push('Die Zulage Nr. ' + sz.nr + ' wird nicht neben dem Auslandsverwendungszuschlag gezahlt, deshalb 0 €.');
    stelleBetrag = 0;
  }
  if (fueBetrag && fz.nichtNebenAmtszulageIn && d.bg === fz.nichtNebenAmtszulageIn && amtBetrag) {
    regeln.push('Neben einer Amtszulage in ' + bgLabel(d.bg) + ' wird die Zulage Nr. ' + fz.nr.split(' ')[0] + ' nicht gezahlt (Nr. 4 Abs. 3).');
    fueBetrag = 0;
  }
  if (fueBetrag && stelleBetrag) {
    var nrF = fz.nr.split(' ')[0];
    var fRed = fz.nebenAnderen === 'differenz';
    var sRed = (sz.nebenAnderen === 'differenz' && sz.vollNeben.indexOf(nrF) < 0) || sz.differenzNeben.indexOf(nrF) >= 0;
    if (fRed && sRed) {
      regeln.push('Beide Zulagen werden nebeneinander nur gezahlt, soweit sie die andere übersteigen. Gezahlt wird deshalb nur die höhere.');
      if (fueBetrag >= stelleBetrag) stelleBetrag = 0; else fueBetrag = 0;
    } else if (fRed) {
      regeln.push('Die Führungszulage wird neben der Stellenzulage nur gezahlt, soweit sie diese übersteigt (Nr. 4 Abs. 3): ' +
        eur.format(fueBetrag) + ' − ' + eur.format(stelleBetrag) + ' = ' + eur.format(Math.max(0, fueBetrag - stelleBetrag)) + '.');
      fueBetrag = Math.max(0, fueBetrag - stelleBetrag);
    } else if (sRed) {
      regeln.push('Die Stellenzulage Nr. ' + sz.nr + ' wird neben der Zulage Nr. ' + nrF + ' nur gezahlt, soweit sie diese übersteigt: ' +
        eur.format(stelleBetrag) + ' − ' + eur.format(fueBetrag) + ' = ' + eur.format(Math.max(0, stelleBetrag - fueBetrag)) + '.');
      stelleBetrag = Math.max(0, stelleBetrag - fueBetrag);
    } else {
      regeln.push('Beide Zulagen werden nebeneinander voll gezahlt.');
    }
  }
  $('zul-regel').hidden = !regeln.length;
  $('zul-regel').textContent = regeln.join(' ');

  var plus = erhoehung(d);
  var grund = (a ? TAB_A[d.bg][state.stufe - STUFE_MIN] : TAB_B[d.bg]) + plus;
  var kgBeiMir = state.kgBei === 'ich';
  var fam = familienzuschlag(d.bg, state.verheiratet, state.kinder, state.partner, kgBeiMir);
  // Dienst zu ungünstigen Zeiten (EZulV §§ 3 bis 5)
  var DZ = D.duz, dzF = state.frageDuz ? 1 : 0;
  if (!state.duzMonat) state.duzMonat = iso(new Date()).slice(0, 7);
  var dzLand = UZ.land, dzH = duzMonatAuswerten(state.duzMonat, dzLand);
  renderDuzListe(dzLand, dzH);
  renderDuzSeite(d, dzLand);
  $('duz-r-monat').value = state.duzMonat;
  var dzAnz = DUZ_DIENSTE.filter(function (x) { return duzImMonat(x, state.duzMonat); }).length;
  $('duz-r-kurz').textContent = monatName(state.duzMonat) + ': ' + (dzAnz ? dzAnz + (dzAnz === 1 ? ' Dienst, ' : ' Dienste, ') + zahlDe(dzH.so + dzH.sa + dzH.na) + ' Std. zu ungünstigen Zeiten.' : 'noch keine Dienste eingetragen.');
  var duzStd = dzF * (dzH.so + dzH.sa + dzH.na);
  var duz = Math.round(dzF * (dzH.so * DZ.saetze.sonnFeiertag + dzH.sa * DZ.saetze.samstag + dzH.na * DZ.saetze.nacht) * 100) / 100;
  var duzInfo = 'Sätze je Stunde: Sonn- und Feiertage ' + eur.format(DZ.saetze.sonnFeiertag) + ', Samstage ' + eur.format(DZ.saetze.samstag) + ', nachts ' + eur.format(DZ.saetze.nacht) + ' (' + DZ.fundstelle + ', gültig ab ' + DZ.gueltigAb + ').';
  if (duzStd > 0) {
    if (d.bg.charAt(0) !== DZ.nurOrdnung) {
      duz = 0;
      duzInfo = 'Die Zulage gibt es nur in Besoldungsgruppen mit aufsteigenden Gehältern (Besoldungsordnung A), nicht für ' + bgLabel(d.bg) + ' (§ 3 Abs. 1 EZulV).';
    } else if (duzStd <= DZ.mindestStunden) {
      duz = 0;
      duzInfo = 'Erst ab mehr als ' + DZ.mindestStunden + ' Stunden im Monat gibt es die Zulage. Im gewählten Monat sind es ' + zahlDe(duzStd) + ' Stunden zu ungünstigen Zeiten (§ 3 Abs. 1 EZulV).';
    } else {
      duzInfo = zahlDe(duzStd) + ' Stunden ergeben ' + eur.format(duz) + '. ' + duzInfo;
      if (avz) duzInfo += ' Neben dem Auslandsverwendungszuschlag wird die Zulage nicht gezahlt (§ 5 EZulV). Trag hier nur Dienste außerhalb der Auslandsverwendung ein.';
    }
  }
  duzInfo += ' Ausgeschlossen ist sie auch bei Dienst nach § 30c Abs. 4 Soldatengesetz und wenn der Dienst anders abgegolten oder ausgeglichen wird (§ 5 EZulV).';
  $('duz-info').textContent = duzInfo;
  $('z-duz').textContent = eur.format(duz);
  var brutto = Math.round((grund + amtBetrag + fam + fueBetrag + stelleBetrag + duz + avz) * 100) / 100;

  $('brutto').textContent = eur.format(brutto);
// Netto: Lohnsteuer auf die steuerpflichtigen Bezüge. Auslandsverwendungszuschlag ist steuerfrei (§ 3 Nr. 64 EStG),
// die Zulage für Dienst zu ungünstigen Zeiten wird als steuerfrei nach § 3b EStG angenommen.
var stkl = state.stkl || stklVorschlag();
var steuerpfl = grund + amtBetrag + fam + fueBetrag + stelleBetrag;
var nt = nettoBerechnen({ steuerpflichtig: steuerpfl, stkl: stkl, kinder: state.kinder, kirche: state.kirche, land: UZ.land, pvMonat: state.pvMonat });
var netto = Math.round((brutto - nt.abzuege) * 100) / 100;
$('r-stkl').value = String(stkl);
$('r-kirche').checked = state.kirche;
$('netto').textContent = eur.format(netto);
$('n-brutto').textContent = eur.format(brutto);
$('n-lst').textContent = '− ' + eur.format(nt.lst);
$('n-soli').textContent = '− ' + eur.format(nt.soli);
$('n-kist-zeile').hidden = !state.kirche;
$('n-kist-t').textContent = 'Kirchensteuer (' + String(nt.kistSatz * 100).replace('.', ',') + ' %)';
$('n-kist').textContent = '− ' + eur.format(nt.kist);
$('netto-info').textContent = 'Steuerklasse ' + ['I', 'II', 'III', 'IV'][stkl - 1] + (state.stkl ? '' : ' (Vorschlag aus den Familienangaben)') +
  '. Soldaten zahlen keine Renten-, Arbeitslosen- und Krankenversicherung. ' +
  (state.pvMonat ? 'Berücksichtigt ist ein Beitrag zur privaten Pflegeversicherung von ' + eur.format(state.pvMonat) + ', den du selbst überweist. ' : 'Den Beitrag zur privaten Pflegeversicherung zahlst du selbst, eintragen kannst du ihn im Profil. ') +
  (avz || duz ? 'Auslandsverwendungszuschlag und DuZ sind als steuerfrei gerechnet. ' : '') +
  (state.kinder ? 'Kindergeld kommt zusätzlich. ' : '') + ST.hinweis;
  $('kette').textContent = d.name + ' · ' + bgLabel(d.bg) + (a ? ' · Stufe ' + state.stufe : ' · feste Beträge, keine Stufen');
  $('z-grund').textContent = eur.format(grund);
  $('z-fam').textContent = eur.format(fam);
  $('z-amt').textContent = eur.format(amtBetrag);
  $('z-fue').textContent = eur.format(fueBetrag);
  $('z-zul').textContent = eur.format(stelleBetrag);
  $('z-avz').textContent = eur.format(avz);
  $('z-jahr').textContent = eur.format(Math.round((grund + amtBetrag + fam + fueBetrag + stelleBetrag) * 1200) / 100);
  $('plus-hint').hidden = !plus;
  $('plus-hint').textContent = plus ? 'Im Grundgehalt enthalten: Erhöhungsbetrag von ' + eur.format(plus) + ' nach Anlage IV.' : '';

  if (a) {
    var werte = TAB_A[d.bg];
    $('tabelle-titel').textContent = 'Alle Stufen in ' + bgLabel(d.bg);
    $('stufen-tabelle').innerHTML = werte.map(function (v, i) {
      var stufe = STUFE_MIN + i;
      var delta = i > 0 ? '+' + eur.format(v - werte[i - 1]) : '';
      return '<button type="button" data-stufe="' + stufe + '" aria-pressed="' + (stufe === state.stufe) + '">' +
        '<span>Stufe ' + stufe + '</span><span class="v">' + eur.format(v) + '</span><span class="d">' + delta + '</span></button>';
    }).join('');
  }

  renderDienstgrade();
  renderZulagen();
  renderVergleich();
  if (aktuelleAnsicht === 'favoriten') renderFavoriten();
}
