// Prüft die Panoramaskizze im Querformat: Horizont, Wald- und Heckensilhouetten, Geländelinie, Grenzen, Objekte, Geländepunkte mit Namen, Export. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html#skizze'); await p.waitForTimeout(500);
  await p.click('#sk-neu'); await p.click('[data-sk-art="panorama"]'); await p.waitForTimeout(300);
  console.log('Titel:', await p.textContent('#sk-v-titel'), '| Dock:', await p.$$eval('#sk-v-leiste .sk-v-wahl', x => x.map(b => b.textContent).join(', ')));
  const pos = async (cx, cy) => p.evaluate(([cx, cy]) => { const s = document.getElementById('sk-blatt'), pt = s.createSVGPoint(); pt.x = 22 + cx * 10; pt.y = 148 - cy * 10; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }, [cx, cy]);
  const tippe = async (cx, cy) => { const [x, y] = await pos(cx, cy); await p.mouse.click(x, y); await p.waitForTimeout(40); };
  const linie = async (w, pts) => { await p.click('[data-v-fach="Linien"]'); await p.click(`[data-v-wz="${w}"]`); for (const q of pts) await tippe(...q); if (await p.$('.sk-v-knoepfe [data-v="fertig"]')) await p.click('.sk-v-knoepfe [data-v="fertig"]'); await p.click('.sk-v-knoepfe [data-v="auswahlfertig"]'); };
  const objekt = async (w, pts) => { await p.click('[data-v-fach="Objekte"]'); await p.click(`[data-v-wz="${w}"]`); for (const q of pts) await tippe(...q); await p.click('[data-v="abbrechen"]'); };
  const gp = async (cx, cy, n) => { await p.click('[data-v-wz="gpunkt"]'); await tippe(cx, cy); await p.keyboard.type(n); await p.keyboard.press('Enter'); };
  await linie('horizont', [[0, 7.5], [3, 8.2], [6, 7.6], [9, 8.6], [12, 8], [16, 8.4]]);
  await linie('nadelkulisse', [[0.5, 7.8], [2.5, 8.1], [4.5, 7.9]]);
  await linie('waldkulisse', [[10, 8.3], [12.5, 8.1], [15.5, 8.3]]);
  await linie('gelaendelinie', [[0, 4], [4, 5.2], [8, 4.6], [12, 5.5], [16, 4.8]]);
  await linie('hecke', [[5, 5.8], [8, 6.2], [11, 6]]);
  await linie('strasse', [[8, 0], [8.5, 3], [10, 5]]);
  await linie('grenze', [[2, 0.5], [2, 9.5]]);
  await linie('grenze', [[14, 0.5], [14, 9.5]]);
  await objekt('haus', [[6.5, 6.6], [7.2, 6.7]]); await objekt('kirchturm', [[11.5, 8.6]]); await objekt('baum', [[3.5, 3.4]]); await objekt('nadelbaum', [[13, 3.8]]);
  await gp(7.2, 6.8, 'Rotes Haus 900'); await gp(11.6, 9.1, 'Heudorf 1700'); await gp(9.5, 4.9, 'Steinbrücke 400'); await gp(3.5, 3.5, 'Spitzbaum 250');
  await p.click('#sk-v-einpassen'); await p.screenshot({ path: 'pano-editor.png' });
  console.log('Elemente:', await p.evaluate(() => skAktiv().elemente.map(e => e.art + (e.name ? '=' + e.name : '')).join(', ')));
  await p.click('#sk-v-blatt-auf');
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await p.click('#sk-png'); const d = await dl; if (d) await d.saveAs('pano-export.png'); console.log('Export:', d && d.suggestedFilename());
  console.log('Fehler', errs); await b.close();
})();
