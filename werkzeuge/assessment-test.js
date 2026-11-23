// Prüft den Assessment Trainer im Browser: Kachel, Üben mit Rückmeldung, Abbrechen, Testsimulation mit Zeitablauf, Stand und Verlauf. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html#start'); await p.waitForTimeout(400);
  await p.locator('nav[aria-label="Bewerbung und Karriere"]').screenshot({ path: 'at-kachel.png' });
  await p.click('a[href="#assessment"]'); await p.waitForTimeout(400);
  console.log('Titel:', await p.textContent('#titel'), '| Teilstreitkraft sichtbar:', await p.isVisible('#tsk'));
  await p.screenshot({ path: 'at-start.png', fullPage: true });
  // Üben Logik, Antworten: abwechselnd richtig/falsch
  await p.click('input[name="at-bereich"][value="logik"] + span'); await p.click('#at-ueben'); await p.waitForTimeout(200);
  for (let i = 0; i < 10; i++) {
    const r = await p.evaluate(() => atLauf.aufgaben[atLauf.nr].richtig);
    const w = i % 3 === 0 ? (r + 1) % 4 : r;
    await p.click(`[data-at-i="${w}"]`);
    if (i === 0) await p.screenshot({ path: 'at-ueben-falsch.png' });
    if (i === 1) await p.screenshot({ path: 'at-ueben-richtig.png' });
    await p.click('#at-weiter');
  }
  await p.waitForTimeout(200); await p.screenshot({ path: 'at-auswertung.png', fullPage: true });
  console.log('Auswertung:', await p.textContent('.at-gesamt'));
  // Konzentration ansehen
  await p.click('#at-zurueck'); await p.click('input[name="at-bereich"][value="konzentration"] + span'); await p.click('input[name="at-stufe"][value="2"] + span'); await p.click('#at-ueben'); await p.waitForTimeout(200);
  for (let i = 0; i < 4; i++) { const typ = await p.evaluate(() => atLauf.aufgaben[atLauf.nr].typ); await p.screenshot({ path: 'at-konz-' + i + '.png' }); console.log('Konz-Typ', typ); const r = await p.evaluate(() => atLauf.aufgaben[atLauf.nr].richtig); await p.click(`[data-at-i="${r}"]`); await p.click('#at-weiter'); }
  await p.click('#at-abbrechen'); await p.click('.inline-abfrage [data-ok]'); await p.waitForTimeout(200);
  console.log('Abbruch-Auswertung:', await p.textContent('.at-gesamt'));
  // Testsimulation: 5 beantworten, dann Zeit ablaufen lassen
  await p.click('#at-zurueck'); await p.click('#at-test'); await p.waitForTimeout(300);
  console.log('Uhr:', await p.textContent('#at-uhr'), '|', await p.textContent('#at-fortschritt'));
  await p.screenshot({ path: 'at-test.png' });
  for (let i = 0; i < 5; i++) { const r = await p.evaluate(() => atLauf.aufgaben[atLauf.nr].richtig); await p.click(`[data-at-i="${r}"]`); }
  await p.evaluate(() => { atLauf.start -= 15 * 60 * 1000; }); await p.waitForTimeout(800);
  console.log('Test-Ende:', await p.textContent('.at-gesamt'));
  await p.click('#at-zurueck'); await p.waitForTimeout(200);
  console.log('Stand:', await p.$$eval('.at-stand', x => x.map(e => e.innerText.replace(/\n/g, ' ')).join(' | ')), '| Empfehlung:', await p.textContent('#at-empfehlung'));
  await p.screenshot({ path: 'at-start2.png', fullPage: true });
  await p.reload(); await p.waitForTimeout(400); console.log('nach Neuladen Verlauf:', await p.$$eval('.at-verlauf-zeile', x => x.length));
  console.log('Fehler', errs); await b.close();
})();
