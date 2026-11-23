// Prüft Umbenennen und Löschen von Skizzen und Lagekarten bei gesperrten Browser-Dialogen. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  // Dialoge sperren wie in einer eingebetteten Vorschau
  await p.addInitScript(() => { window.prompt = () => null; window.confirm = () => false; window.alert = () => {}; });
  await p.route(/tile|openstreetmap|arcgis|opentopomap/, r => r.abort());
  await p.goto('http://localhost:8765/index.html#skizze'); await p.waitForTimeout(600);
  await p.click('#sk-karte-name'); await p.fill('.inline-abfrage input', 'Marschweg Übung'); 
  await p.locator('.inline-abfrage').screenshot({ path: 'abfrage-name.png' });
  await p.click('.inline-abfrage [data-ok]');
  console.log('Skizze umbenannt:', await p.evaluate(() => SK.liste.map(s => s.name).join(' | ')), '| Auswahl zeigt:', await p.$eval('#sk-wahl', s => s.selectedOptions[0].textContent));
  await p.click('#sk-karte-neu'); await p.click('#sk-karte-weg');
  await p.locator('.inline-abfrage').screenshot({ path: 'abfrage-weg.png' });
  console.log('Frage:', await p.textContent('.inline-abfrage p'));
  await p.click('.inline-abfrage [data-ok]');
  console.log('nach Löschen:', await p.evaluate(() => SK.liste.map(s => s.name).join(' | ')));
  await p.click('#sk-karte-weg'); console.log('letzte, Frage:', await p.textContent('.inline-abfrage p')); await p.click('.inline-abfrage [data-ok]');
  console.log('nach Löschen der letzten:', await p.evaluate(() => SK.liste.map(s => s.name + '(' + s.elemente.length + ')').join(' | ')));
  await p.click('#sk-karte-name'); await p.click('.inline-abfrage [data-abbr]'); console.log('Abbrechen schließt:', await p.$('.inline-abfrage') === null);
  // Lagekarte
  await p.evaluate(() => go('lage')); await p.waitForTimeout(1500);
  await p.click('#lage-karte-name'); await p.fill('.inline-abfrage input', 'Übung Nord'); await p.keyboard.press('Enter');
  console.log('Lage umbenannt:', await p.$eval('#lage-wahl', s => s.selectedOptions[0].textContent));
  await p.click('#lage-karte-weg'); await p.click('.inline-abfrage [data-ok]'); await p.waitForTimeout(300);
  console.log('Lage nach Löschen:', await p.$eval('#lage-wahl', s => Array.from(s.options).map(o => o.textContent).join(' | ')));
  console.log('Fehler', errs); await b.close();
})();
