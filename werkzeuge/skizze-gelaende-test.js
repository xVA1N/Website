// Prüft die Geländeskizze: Wald, Straßen als Doppellinie, Fluss mit Uferlinien, Weg, Ortschaft, Export. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html#skizze'); await p.waitForTimeout(500);
  await p.click('#sk-neu'); await p.click('[data-sk-art="gelaende"]'); await p.waitForTimeout(300);
  console.log('Titel:', await p.textContent('#sk-v-titel'), '| Dock:', await p.$$eval('#sk-v-leiste .sk-v-wahl', x => x.map(b => b.textContent).join(', ')));
  const pos = async (cx, cy) => p.evaluate(([cx, cy]) => { const s = document.getElementById('sk-blatt'), pt = s.createSVGPoint(); pt.x = 22 + cx * 10; pt.y = 148 - cy * 10; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }, [cx, cy]);
  const tippe = async (cx, cy) => { const [x, y] = await pos(cx, cy); await p.mouse.click(x, y); await p.waitForTimeout(40); };
  const linie = async (w, pts) => { await p.click('[data-v-fach="Linien"]'); await p.click(`[data-v-wz="${w}"]`); for (const q of pts) await tippe(...q); if (await p.$('.sk-v-knoepfe [data-v="fertig"]')) await p.click('.sk-v-knoepfe [data-v="fertig"]'); await p.click('.sk-v-knoepfe [data-v="auswahlfertig"]'); };
  const objekt = async (w, pts) => { await p.click('[data-v-fach="Objekte"]'); await p.click(`[data-v-wz="${w}"]`); for (const q of pts) await tippe(...q); await p.click('[data-v="abbrechen"]'); };
  const gp = async (cx, cy, n) => { await p.click('[data-v-wz="gpunkt"]'); await tippe(cx, cy); await p.keyboard.type(n); await p.keyboard.press('Enter'); };
  const fl = async (fach, w, pts) => { await p.click(`[data-v-fach="${fach}"]`); await p.click(`[data-v-wz="${w}"]`); for (const q of pts) await tippe(...q); await p.click('.sk-v-knoepfe [data-v="fertig"]'); await p.click('.sk-v-knoepfe [data-v="auswahlfertig"]'); };
  await fl('Flächen', 'nadelwald', [[0.3, 0.3], [0.3, 4], [6, 5], [8, 2], [7, 0.3]]);
  await fl('Linien', 'strasse', [[0, 6], [5, 5.5], [9, 7], [16, 6.5]]);
  await fl('Linien', 'strasse', [[7, 0], [7.5, 3], [9, 7], [10, 12]]);
  await fl('Linien', 'fluss', [[12, 0], [12.5, 3], [11.5, 6], [13, 9], [12.5, 12]]);
  await fl('Linien', 'weg', [[1, 12], [2, 8], [3, 6.2]]);
  await fl('Flächen', 'ort', [[2, 8], [4.5, 7.5], [5, 9.5], [2.5, 10]]);
  await p.click('#sk-v-einpassen'); await p.screenshot({ path: 'gel-editor.png' });
  console.log('Elemente:', await p.evaluate(() => skAktiv().elemente.map(e => e.art + (e.name ? '=' + e.name : '')).join(', ')));
  await p.click('#sk-v-blatt-auf');
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await p.click('#sk-png'); const d = await dl; if (d) await d.saveAs('gel-export.png'); console.log('Export:', d && d.suggestedFilename());
  console.log('Fehler', errs); await b.close();
})();
