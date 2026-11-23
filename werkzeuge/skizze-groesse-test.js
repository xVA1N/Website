// Prüft die Größe von Zeichen in Skizzen (50–300 %), auch mit Rückgängig. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html#skizze'); await p.waitForTimeout(500);
  await p.click('#sk-neu'); await p.click('[data-sk-art="panorama"]'); await p.waitForTimeout(300);
  const pos = async (cx, cy) => p.evaluate(([cx, cy]) => { const s = document.getElementById('sk-blatt'), pt = s.createSVGPoint(); pt.x = 22 + cx * 10; pt.y = 148 - cy * 10; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }, [cx, cy]);
  const tippe = async (cx, cy) => { const [x, y] = await pos(cx, cy); await p.mouse.click(x, y); await p.waitForTimeout(40); };
  await p.click('[data-v-fach="Objekte"]'); await p.click('[data-v-wz="haus"]'); await tippe(4, 3); await tippe(11, 8); await p.click('[data-v="abbrechen"]');
  await tippe(4, 3);
  for (let i = 0; i < 3; i++) await p.click('[data-v="groesser"]');
  console.log('Anzeige:', await p.textContent('#sk-v-prozent'), '| Skala:', await p.evaluate(() => skElement(skAuswahl).skala));
  await p.screenshot({ path: 'groesse.png' });
  await p.click('#sk-v-zurueck'); console.log('nach Rückgängig:', await p.evaluate(() => skElement(skAuswahl) && skElement(skAuswahl).skala));
  await p.click('[data-v="kleiner"]'); await p.click('[data-v="kleiner"]'); console.log('kleiner:', await p.textContent('#sk-v-prozent'), '| Knopf gesperrt:', await p.isDisabled('[data-v="kleiner"]'));
  // Ziehen funktioniert weiter am großen Haus
  console.log('Fehler', errs); await b.close();
})();
