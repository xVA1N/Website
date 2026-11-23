/* MeinKamerad – Lexikon: Fahrzeuge und Waffen der Bundeswehr, kurz mit den wichtigsten technischen Daten.
   Bilder: nur echte Seitenansichten, aus Fotos (Wikimedia Commons) in Bleistift-Skizzen umgewandelt.
   Ohne passende Seitenansicht bleibt der Eintrag vorerst ohne Bild.
   Daten aus den Seiten der Bundeswehr (Quelle je Eintrag). */

var LEX_KATEGORIEN = { alle: 'Alle', kette: 'Kettenfahrzeuge', rad: 'Radfahrzeuge', hand: 'Handwaffen', pzabw: 'Panzerabwehr' };
var LEX_BW = 'https://www.bundeswehr.de/de/ausruestung-technik-bundeswehr/';

var LEXIKON = [
  { id: 'leopard2', name: 'Leopard 2 A7V', art: 'Kampfpanzer', kat: 'kette',
    daten: [['Besatzung', '4'], ['Gewicht', '63,9 t'], ['Bewaffnung', '120-mm-Glattrohrkanone'], ['Motor', '1.500 PS'], ['Höchstgeschwindigkeit', '63 km/h'], ['Maße L × B × H', '10,97 × 3,75 × 3,0 m']],
    quelle: LEX_BW + 'landsysteme-bundeswehr/leopard-2' },
  { id: 'puma', name: 'Puma', art: 'Schützenpanzer', kat: 'kette',
    daten: [['Besatzung', '3 + 6 Panzergrenadiere'], ['Gewicht', '43 t (Schutzstufe C)'], ['Bewaffnung', '30-mm-Maschinenkanone, MG4, MELLS'], ['Motor', '1.088 PS'], ['Höchstgeschwindigkeit', '70 km/h'], ['Besonderheit', 'unbemannter Turm']],
    quelle: LEX_BW + 'landsysteme-bundeswehr/schuetzenpanzer-puma' },
  { id: 'pzh2000', name: 'Panzerhaubitze 2000', art: 'Artillerie', kat: 'kette',
    daten: [['Besatzung', '5'], ['Gewicht', '57 t'], ['Bewaffnung', '155-mm-Haubitze, 60 Schuss an Bord'], ['Reichweite Waffe', '30 km, mit Reichweitenmunition 40 km'], ['Motor', '1.000 PS'], ['Höchstgeschwindigkeit', '60 km/h'], ['Maße L × B × H', '11,7 × 3,6 × 3,5 m']],
    quelle: LEX_BW + 'landsysteme-bundeswehr/panzerhaubitze-2000' },
  { id: 'boxer', name: 'Boxer', art: 'Gepanzertes Transportkraftfahrzeug (GTK)', kat: 'rad',
    daten: [['Besatzung', 'bis 10 Personen'], ['Gewicht', '36,5 t'], ['Bewaffnung', '40-mm-Granatmaschinenwaffe oder 12,7-mm-sMG'], ['Motor', '720 PS'], ['Höchstgeschwindigkeit', '103 km/h'], ['Maße L × B × H', '8,3 × 3,0 × 3,4 m']],
    quelle: LEX_BW + 'landsysteme-bundeswehr/gtk-boxer' },
  { id: 'fennek', name: 'Fennek', art: 'Spähwagen', kat: 'rad',
    daten: [['Besatzung', '3'], ['Gewicht', '11,8 t'], ['Bewaffnung', 'MG5, GMW oder MG3 in Waffenstation'], ['Motor', '240 PS'], ['Höchstgeschwindigkeit', '115 km/h'], ['Reichweite', '1.000 km Straße'], ['Maße L × B', '5,58 × 2,55 m']],
    quelle: LEX_BW + 'landsysteme-bundeswehr/spaehwagen-fennek' },
  { id: 'dingo2', name: 'Dingo 2', art: 'Allschutz-Transport-Fahrzeug (ATF)', kat: 'rad',
    daten: [['Besatzung', 'bis 8 Personen'], ['Gewicht', '12,6 t'], ['Motor', '222 PS'], ['Höchstgeschwindigkeit', '89 km/h'], ['Maße L × B × H', '6,1 × 2,43 × 2,6 m']],
    quelle: LEX_BW + 'landsysteme-bundeswehr/atf-dingo' },
  { id: 'g95', name: 'G95', art: 'Sturmgewehr', kat: 'hand',
    daten: [['Kaliber', '5,56 × 45 mm'], ['Gewicht', '3,4 kg (A1), 3,3 kg (KA1)'], ['Länge', '860–942 mm (A1), 796–878 mm (KA1)'], ['Lauflänge', '419 mm (A1), 355 mm (KA1)'], ['Kadenz', '850 Schuss/min'], ['Einsatzschussweite', '450 m']],
    quelle: LEX_BW + 'ausruestung-bewaffnung/gewehr-g95' },
  { id: 'g36', name: 'G36', art: 'Sturmgewehr', kat: 'hand',
    daten: [['Kaliber', '5,56 × 45 mm'], ['Gewicht', '3,6 kg'], ['Länge', '1.000 mm (eingeklappt 750 mm)'], ['Lauflänge', '480 mm'], ['Magazin', '30 Schuss'], ['Kadenz', '750 Schuss/min'], ['Einsatzschussweite', '500 m']],
    quelle: LEX_BW + 'ausruestung-bewaffnung/gewehr-g36' },
  { id: 'mg5', name: 'MG5', art: 'Maschinengewehr', kat: 'hand',
    daten: [['Kaliber', '7,62 × 51 mm'], ['Gewicht', '12,4 kg (MG5), 12,0 kg (MG5A2)'], ['Lauflänge', '550 mm (MG5), 460 mm (MG5A2)'], ['Kadenz', '800 Schuss/min'], ['Einsatzschussweite', 'bis 1.200 m']],
    quelle: LEX_BW + 'ausruestung-bewaffnung/mg5' },
  { id: 'pzf3', name: 'Panzerfaust 3', art: 'Panzerabwehrhandwaffe', kat: 'pzabw',
    daten: [['Kaliber', '60 mm Rohr, 110 mm Gefechtskopf'], ['Gewicht', 'etwa 13 kg'], ['Einsatzschussweite', '400 m stehende, 300 m bewegte Ziele'], ['Durchschlag', '700 mm Panzerstahl']],
    quelle: LEX_BW + 'ausruestung-bewaffnung/panzerfaust-3' }
];

/* Bilder: Datei liegt in bilder/lexikon/, Herkunft und Lizenz stehen unter dem Bild */
var LEX_BILDER = {
  g36: { datei: 'g36.webp', autor: 'DomoK, freigestellt von Auge=mit', lizenz: 'CC BY-SA 4.0', lizenzUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', seite: 'https://commons.wikimedia.org/wiki/File:Gewehr_G36_noBG.png' }
};

var lexKat = 'alle';

function lexKarte(e) {
  var b = LEX_BILDER[e.id];
  var bild = b
    ? '<figure class="lex-bild"><img src="bilder/lexikon/' + b.datei + '" alt="' + esc(e.name) + ', Seitenansicht als Skizze" loading="lazy">' +
      '<figcaption>Skizze nach Foto von ' + esc(b.autor) + ', <a href="' + b.seite + '" target="_blank" rel="noopener">Wikimedia Commons</a>, ' +
      '<a href="' + b.lizenzUrl + '" target="_blank" rel="noopener">' + esc(b.lizenz) + '</a>, bearbeitet</figcaption></figure>'
    : '<div class="lex-bild lex-ohne">Bild folgt</div>';
  return '<article class="lex-karte" id="lex-' + e.id + '">' + bild +
    '<div class="lex-text"><h3>' + esc(e.name) + '</h3><p class="lex-art">' + esc(e.art) + '</p>' +
    '<dl class="lex-daten">' + e.daten.map(function (d) { return '<dt>' + esc(d[0]) + '</dt><dd>' + esc(d[1]) + '</dd>'; }).join('') + '</dl>' +
    '<a class="lex-quelle" href="' + e.quelle + '" target="_blank" rel="noopener">Quelle: bundeswehr.de</a></div></article>';
}

function zeigeLexikon() {
  var such = ($('lex-suche').value || '').trim().toLowerCase();
  var liste = LEXIKON.filter(function (e) {
    if (lexKat !== 'alle' && e.kat !== lexKat) return false;
    if (!such) return true;
    return (e.name + ' ' + e.art + ' ' + LEX_KATEGORIEN[e.kat]).toLowerCase().indexOf(such) >= 0;
  });
  $('lex-filter').innerHTML = Object.keys(LEX_KATEGORIEN).map(function (k) {
    return '<label><input type="radio" name="lex-kat" value="' + k + '"' + (k === lexKat ? ' checked' : '') + '><span>' + LEX_KATEGORIEN[k] + '</span></label>';
  }).join('');
  $('lex-liste').innerHTML = liste.length ? liste.map(lexKarte).join('') : '<p class="hint">Kein Eintrag gefunden.</p>';
}

$('lex-filter').addEventListener('change', function (ev) { if (ev.target.name === 'lex-kat') { lexKat = ev.target.value; zeigeLexikon(); } });
$('lex-suche').addEventListener('input', zeigeLexikon);
if (aktuelleAnsicht === 'lexikon') zeigeLexikon();
