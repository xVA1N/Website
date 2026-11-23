const { chromium } = require('playwright'); const K = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 420, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html#symbole'); await p.waitForTimeout(1200); await p.click('#foto-panel > summary');
  await p.setInputFiles('#foto-datei', K + '/echt1.png');
  await p.waitForFunction(() => !document.getElementById('foto-bereich').hidden && window.fotoBild);
  await p.evaluate(() => { const f = fotoBild.width / 1206; fotoAuswahl = { x0: 160 * f, y0: 258 * f, x1: 912 * f, y1: 810 * f }; fotoZeichnen(); });
  await p.click('#foto-erkennen');
  await p.waitForFunction(() => { const a = document.getElementById('foto-t'), b = document.getElementById('foto-m'); const f = e => !e || e.value || /nicht|keine/.test(e.placeholder); return f(a) && f(b); }, null, { timeout: 60000 });
  console.log(await p.$eval('.foto-sicht span', e => e.innerText), '| T:', await p.$eval('#foto-t', e => e.value), '| M:', await p.$eval('#foto-m', e => e.value));
  await p.click('#foto-ergebnis button[data-foto-sidc]'); await p.waitForTimeout(300);
  console.log('Baukasten:', await p.$eval('#ms-bez', e => e.value), await p.$eval('#ms-hoeher', e => e.value), await p.$eval('#ms-staerke', e => e.value), await p.$eval('#ms-art', e => e.selectedOptions[0].textContent));
  const v = await p.$('#ms-vorschau'); await v.screenshot({ path: K + '/echt1-ergebnis.png' });
  console.log(errs); await b.close();
})();
