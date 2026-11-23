// Prüft das Vollbild der Skizzen im Hoch- und Querformat (Nadel-/Laubbaum setzen, Marschweg). Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [w, h, name] of [[390, 844, 'hoch'], [844, 390, 'quer']]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/index.html#skizze'); await p.waitForTimeout(600);
    await p.click('#sk-vollbild'); await p.waitForTimeout(300);
    const pos = async (cx, cy) => p.evaluate(([cx, cy]) => { const s = document.getElementById('sk-blatt'), pt = s.createSVGPoint(); pt.x = 22 + cx * 10; pt.y = 148 - cy * 10; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }, [cx, cy]);
    const tippe = async (cx, cy) => { const [x, y] = await pos(cx, cy); await p.mouse.click(x, y); await p.waitForTimeout(30); };
    await p.click('button[data-sk-wz="nadelbaum"]');
    for (const q of [[2, 3], [3, 3.6], [2.6, 2.2], [3.8, 2.6]]) await tippe(...q);
    await p.click('button[data-sk-wz="nadelbaum"]');
    await p.locator('button[data-sk-wz="laubbaum"]').scrollIntoViewIfNeeded(); await p.click('button[data-sk-wz="laubbaum"]');
    for (const q of [[6, 8], [7, 8.6], [6.6, 7.2]]) await tippe(...q);
    await p.click('button[data-sk-wz="laubbaum"]');
    await p.locator('button[data-sk-wz="marsch"]').scrollIntoViewIfNeeded(); await p.click('button[data-sk-wz="marsch"]');
    for (const q of [[12, 1], [9, 4], [11, 9]]) await tippe(...q);
    await p.screenshot({ path: 'voll-' + name + '.png' });
    await p.click('#sk-leiste-fertig'); await p.waitForTimeout(200);
    const info = await p.evaluate(() => ({ n: SK.liste[0].elemente.length, voll: document.getElementById('sk-arbeit').classList.contains('vollbild'), svgW: document.getElementById('sk-blatt').getBoundingClientRect().width, scrollY: document.documentElement.scrollHeight }));
    await p.click('#sk-vollbild'); await p.waitForTimeout(200);
    console.log(name, JSON.stringify(info), 'nach Schließen vollbild:', await p.evaluate(() => document.getElementById('sk-arbeit').classList.contains('vollbild')));
    await p.evaluate(() => localStorage.clear()); await p.close();
  }
  console.log('Fehler', errs); await b.close();
})();
