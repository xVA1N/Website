// Prüft Englisch im Assessment Trainer: Lückentext, Rückmeldung, keine Wiederholung in einem Durchgang, Anteil in der Testsimulation. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html#assessment'); await p.waitForTimeout(400);
  await p.click('input[name="at-bereich"][value="englisch"] + span'); await p.click('input[name="at-stufe"][value="0"] + span'); await p.click('#at-ueben'); await p.waitForTimeout(200);
  const r = await p.evaluate(() => atLauf.aufgaben[0].richtig); await p.click(`[data-at-i="${(r + 1) % 4}"]`); await p.screenshot({ path: 'en-falsch.png' });
  await p.click('#at-weiter'); await p.screenshot({ path: 'en-frage.png' });
  const saetze = await p.evaluate(() => atLauf.aufgaben.map(a => a.erklaerung.split('→ ')[1]));
  console.log('10 Sätze, verschieden:', new Set(saetze).size);
  await p.click('#at-abbrechen'); await p.click('.inline-abfrage [data-ok]');
  await p.click('#at-zurueck'); await p.click('#at-test'); await p.waitForTimeout(200);
  console.log('Simulation je Bereich:', JSON.stringify(await p.evaluate(() => atLauf.aufgaben.reduce((m, a) => (m[a.bereich] = (m[a.bereich] || 0) + 1, m), {}))));
  await p.evaluate(() => { atLauf.start -= 16 * 60000; }); await p.waitForTimeout(800); await p.click('#at-zurueck');
  console.log('Stand:', await p.$$eval('#at-stand .at-stand', x => x.map(e => e.innerText.replace(/\n/g, ' ')).join(' | ')));
  console.log('Fehler', errs); await b.close();
})();
