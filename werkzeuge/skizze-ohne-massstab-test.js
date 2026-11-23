// Prüft „ohne Maßstab“: alle Maßstäbe durchgestrichen, Entfernungen am Marschweg von Hand. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html#skizze'); await p.waitForTimeout(600);
  await p.click('input[name="sk-massstab"][value="0"] + span');
  console.log('Maßstab:', await p.evaluate(() => SK.liste[0].massstab), '| durchgestrichen:', await p.evaluate(() => (document.getElementById('sk-blatt').innerHTML.match(/stroke-width=".7" stroke-linecap="round"/g) || []).length));
  await p.click('#sk-vollbild'); await p.waitForTimeout(300);
  console.log('Titel:', await p.textContent('#sk-v-titel'));
  const pos = async (cx, cy) => p.evaluate(([cx, cy]) => { const s = document.getElementById('sk-blatt'), pt = s.createSVGPoint(); pt.x = 22 + cx * 10; pt.y = 148 - cy * 10; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }, [cx, cy]);
  const tippe = async (cx, cy) => { const [x, y] = await pos(cx, cy); await p.mouse.click(x, y); await p.waitForTimeout(40); };
  await p.click('[data-v-wz="marsch"]'); for (const q of [[13, 1], [6, 2], [7, 6], [10, 10]]) await tippe(...q); await p.click('[data-v="fertig"]');
  console.log('Feld:', await p.getAttribute('#sk-v-name', 'placeholder'), '| Hinweis:', await p.textContent('.sk-v-kopf small'));
  await p.fill('#sk-v-name', '800, 400, 1600'); await p.waitForTimeout(200);
  console.log('Beschriftungen:', await p.evaluate(() => Array.from(document.querySelectorAll('#sk-blatt text')).map(t => t.textContent).filter(t => /^\d+$/.test(t) && +t >= 400).join(' ')));
  await p.click('.sk-v-knoepfe [data-v="auswahlfertig"]');
  await p.screenshot({ path: 'ohne-massstab.png' });
  await p.click('#sk-v-zu');
  console.log('Fehler', errs); await b.close();
})();
