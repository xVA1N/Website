const { chromium } = require('playwright');
const fs = require('fs');
const K = process.argv[2], N = +(process.argv[3] || 300);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 420, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://../../index.html#symbole'); await p.waitForTimeout(1200);
  await p.click('#foto-panel > summary');
  const meta = JSON.parse(fs.readFileSync(K + '/fotos.json', 'utf8')).slice(0, N);
  let r = 0, s1 = 0, s3 = 0, g = 0, alles = 0, zeit = 0; const fehler = [];
  for (const m of meta) {
    await p.setInputFiles('#foto-datei', K + '/' + m.datei);
    await p.waitForFunction(() => !document.getElementById('foto-bereich').hidden && window.fotoBild, null, { timeout: 15000 });
    // Ausschnitt wie von Hand: mittlerer Bereich des Bildes
    await p.evaluate((a) => { const f = fotoBild.width / 640; fotoAuswahl = { x0: a[0] * f, y0: a[1] * f, x1: a[2] * f, y1: a[3] * f }; fotoZeichnen(); }, m.aus);
    const t0 = Date.now(); await p.click('#foto-erkennen'); zeit += Date.now() - t0;
    const v = await p.$$eval('#foto-ergebnis button[data-foto-sidc]', a => a.map(x => x.getAttribute('data-foto-sidc')));
    if (!v.length) { fehler.push(m.datei + ' nichts erkannt'); continue; }
    const a = v[0], ok = { r: a.charAt(3) === m.rahmen, s: a.substr(10, 6) === m.symbol, g: a.substr(8, 2) === m.groesse };
    r += ok.r; s1 += ok.s; g += ok.g; alles += ok.r && ok.s && ok.g; s3 += v.some(x => x.substr(10, 6) === m.symbol);
    if (!ok.s && fehler.length < 12) fehler.push(m.datei + ' ' + m.name + ' -> ' + a.substr(10, 6));
  }
  const n = meta.length, pz = x => (100 * x / n).toFixed(1) + ' %';
  console.log('Fotos', n, '| Rahmen', pz(r), '| Symbol', pz(s1), '(unter den 3 Vorschlägen', pz(s3) + ') | Größe', pz(g), '| alles richtig', pz(alles), '| Zeit je Erkennung', Math.round(zeit / n), 'ms');
  console.log('Beispiele für Fehler:', fehler.join('; '));
  console.log('Seitenfehler', errs);
  await b.close();
})();
