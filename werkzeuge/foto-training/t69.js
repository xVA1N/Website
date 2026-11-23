// Prüft ein echtes Foto: node t69.js <Ordner> <Bildname ohne .png> '[x0,y0,x1,y1]' (Auswahl in Pixeln bei 1206 px Breite), Seite über python3 -m http.server 8765
const { chromium } = require('playwright'); const K = process.argv[2], BILD = process.argv[3], A = JSON.parse(process.argv[4]);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 420, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html#symbole'); await p.waitForTimeout(1200); await p.click('#foto-panel > summary');
  await p.setInputFiles('#foto-datei', K + '/' + BILD + '.png');
  await p.waitForFunction(() => !document.getElementById('foto-bereich').hidden && window.fotoBild);
  await p.evaluate((A) => { const f = fotoBild.width / 1206; fotoAuswahl = { x0: A[0] * f, y0: A[1] * f, x1: A[2] * f, y1: A[3] * f }; fotoZeichnen(); }, A);
  await p.click('#foto-erkennen');
  await p.waitForFunction(() => { const a = document.getElementById('foto-t'), b = document.getElementById('foto-m'); const f = e => !e || e.value || /nicht|keine/.test(e.placeholder); return f(a) && f(b); }, null, { timeout: 60000 });
  console.log(await p.$eval('.foto-sicht span', e => e.innerText), '| T:', await p.$eval('#foto-t', e => e.value || e.placeholder), '| M:', await p.$eval('#foto-m', e => e.value || e.placeholder));
  console.log(await p.$$eval('.foto-vorschlag b', es => es.map(e => e.innerText).join(' / ')));
  const c = await p.$('#foto-sicht'); await c.screenshot({ path: K + '/' + BILD + '-sicht.png' });
  console.log(errs); await b.close();
})();
