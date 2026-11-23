// Prüft „Weitere Zeichen“ in der Stellungsskizze: aus „Meine Zeichen“ einfügen und ein neues Zeichen über den Baukasten. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  // Ein Zeichen unter „Meine Zeichen“ speichern (Sanität, Kompanie)
  await p.goto('http://localhost:8765/index.html#symbole'); await p.waitForSelector('#ms-vorschau svg');
  await p.evaluate(() => { msFormularSetzen({ sidc: '10031000151613000000', opt: { fill: true, colorMode: 'Medium', standard: 'APP6', uniqueDesignation: '3./SanRgt' } }); });
  await p.click('#ms-fav'); await p.waitForTimeout(200);
  await p.evaluate(() => go('skizze')); await p.waitForTimeout(300);
  await p.click('#sk-neu'); await p.click('[data-sk-art="stellung"]'); await p.waitForFunction(() => window.ms); await p.waitForTimeout(300);
  await p.click('[data-v-fach="Stellung"]'); await p.waitForTimeout(100);
  await p.screenshot({ path: 'plus-fach.png' });
  await p.click('#sk-v-fach [data-v-fach="+Zeichen"]'); await p.waitForTimeout(100);
  await p.screenshot({ path: 'plus-zeichen.png' });
  await p.click('[data-v-fav]');
  console.log('Werkzeug:', await p.evaluate(() => skWerkzeug), '|', await p.textContent('.sk-v-kopf b'));
  const pos = async (cx, cy) => p.evaluate(([cx, cy]) => { const s = document.getElementById('sk-blatt'), pt = s.createSVGPoint(); pt.x = 22 + cx * 10; pt.y = 148 - cy * 10; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }, [cx, cy]);
  const [x, y] = await pos(6, 6); await p.mouse.click(x, y); await p.waitForTimeout(100); await p.click('[data-v="abbrechen"]');
  // Neues Zeichen über den Baukasten
  await p.click('[data-v-fach="Stellung"]'); await p.click('#sk-v-fach [data-v-fach="+Zeichen"]'); await p.click('[data-v="baukasten"]'); await p.waitForTimeout(400);
  console.log('Ansicht:', await p.evaluate(() => aktuelleAnsicht), '| Knopf sichtbar:', await p.isVisible('#ms-in-skizze'));
  await p.evaluate(() => { msFormularSetzen({ sidc: '10061000141205000000', opt: { fill: true, colorMode: 'Medium', standard: 'APP6' } }); });
  await p.click('#ms-in-skizze'); await p.waitForTimeout(400);
  console.log('zurück in Skizze:', await p.isVisible('#sk-voll'), '| gewählt:', await p.textContent('.sk-v-kopf b'), '| Elemente:', await p.evaluate(() => skAktiv().elemente.map(e => e.art + (e.titel ? '=' + e.titel : '') + (e.feind ? '(Feind)' : '')).join(', ')));
  await p.click('.sk-v-knoepfe [data-v="auswahlfertig"]');
  await p.screenshot({ path: 'plus-ergebnis.png' });
  console.log('Fehler', errs); await b.close();
})();
