// Prüft Umbenennen und Löschen von Lagekarten bei gesperrten Browser-Dialogen. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  // Dialoge sperren wie in einer eingebetteten Vorschau
  await p.addInitScript(() => { window.prompt = () => null; window.confirm = () => false; window.alert = () => {}; });
  await p.route(/tile|openstreetmap|arcgis|opentopomap/, r => r.abort());
  await p.goto('http://localhost:8765/index.html#lage');
  // Lagekarte
  await p.waitForTimeout(1500);
  await p.click('#lage-karte-name'); await p.fill('.inline-abfrage input', 'Übung Nord'); await p.keyboard.press('Enter');
  console.log('Lage umbenannt:', await p.$eval('#lage-wahl', s => s.selectedOptions[0].textContent));
  await p.click('#lage-karte-weg'); await p.click('.inline-abfrage [data-ok]'); await p.waitForTimeout(300);
  console.log('Lage nach Löschen:', await p.$eval('#lage-wahl', s => Array.from(s.options).map(o => o.textContent).join(' | ')));
  console.log('Fehler', errs); await b.close();
})();
