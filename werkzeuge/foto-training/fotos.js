// Erzeugt "Fotos" handskizzierter Zeichen (rough.js, Papier, Perspektive, Schatten) als PNG
const { chromium } = require('playwright');
const fs = require('fs');
const K = process.argv[2], N = +process.argv[3], MIT_TEXT = process.argv[4] === 'text', PRE = MIT_TEXT ? 'tfoto' : 'foto';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 640, height: 640 } });
  await p.setContent('<html><body style="margin:0;background:#6b5d4f;overflow:hidden"><div id="b" style="width:640px;height:640px;display:grid;place-items:center;perspective:900px"><div id="p" style="width:520px;height:520px;display:grid;place-items:center;box-shadow:0 10px 40px rgba(0,0,0,.6)"></div></div></body></html>');
  await p.addScriptTag({ path: '../../vendor/milsymbol.js' });
  await p.addScriptTag({ path: K + '/rough/package/bundled/rough.js' });
  const klassen = JSON.parse(fs.readFileSync(K + '/klassen.json', 'utf8'));
  const RAHMEN = ['3', '6', '4', '1'], GR = ['00', '11', '12', '13', '14', '15', '16', '17', '18', '21', '22', '23'];
  const meta = [];
  let s = 4242; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = 0; i < N; i++) {
    const ri = Math.floor(rnd() * 4), si = Math.floor(rnd() * klassen.length), gi = 1 + Math.floor(rnd() * 11);
    const sidc = '100' + RAHMEN[ri] + '1000' + GR[gi] + klassen[si][0] + '0000';
    const stift = ['#111', '#1a2a6c', '#222', '#3b2a1a'][Math.floor(rnd() * 4)];
    const farbig = rnd() < 0.3;
    const VERB = ['PzGrenBtl', 'JgBtl', 'PzBtl', 'PiBtl', 'AufklBtl', 'PzGrenBrig', 'PzBrig', 'Div', 'ArtBtl', 'SanRgt'];
    const t = MIT_TEXT ? String(1 + Math.floor(rnd() * 6)) + './' + String(100 + Math.floor(rnd() * 900)) : '';
    const mm = MIT_TEXT ? VERB[Math.floor(rnd() * VERB.length)] + ' ' + String(1 + Math.floor(rnd() * 400)) : '';
    await p.evaluate(({ sidc, stift, farbig, r1, r2, r3, r4, r5, t, mm }) => {
      const opt = { size: 120, fill: farbig, colorMode: 'Light', outlineWidth: 0, strokeWidth: 3 + r3 * 4, standard: 'APP6' }; if (!farbig) opt.monoColor = stift; if (t) opt.uniqueDesignation = t; if (mm) opt.higherFormation = mm; const sym = new ms.Symbol(sidc, opt);
      const pap = document.getElementById('p');
      const hell = 225 + Math.floor(r4 * 30);
      pap.style.background = `linear-gradient(${Math.floor(r5 * 360)}deg, rgb(${hell},${hell},${hell - 8}), rgb(${hell - 50},${hell - 48},${hell - 55}))`;
      pap.style.transform = `rotateX(${(r1 - 0.5) * 34}deg) rotateY(${(r2 - 0.5) * 34}deg) rotateZ(${(r3 - 0.5) * 30}deg) scale(${0.85 + r4 * 0.2})`;
      // Handzeichnung: Linien über einen Rauschfilter verbiegen (anders als die Verzerrung beim Training)
      const seed = Math.floor(r5 * 1000), staerke = 3 + r1 * 7, frequenz = (0.015 + r2 * 0.03).toFixed(3);
      pap.innerHTML = `<svg width="0" height="0" style="position:absolute"><filter id="h${seed}"><feTurbulence type="fractalNoise" baseFrequency="${frequenz}" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="${staerke}"/></filter></svg>` +
        `<div style="width:${(t ? 330 : 260) + r5 * (t ? 100 : 140)}px;filter:url(#h${seed}) blur(${(r4 * 0.8).toFixed(2)}px)">${sym.asSVG().replace('<svg ', '<svg style="width:100%;height:auto" ')}</div>`;
    }, { sidc, stift, farbig, r1: rnd(), r2: rnd(), r3: rnd(), r4: rnd(), r5: rnd(), t, mm });
    // Lage des Zeichens im Bild (wie ein Mensch den Rahmen ziehen würde, mit zufälligem Rand)
    const box = await p.evaluate(() => { const r = document.querySelector('#p > div').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; });
    const rand = 0.04 + rnd() * 0.14, bw = box[2] - box[0], bh = box[3] - box[1];
    const aus = [Math.max(0, box[0] - bw * rand), Math.max(0, box[1] - bh * rand), Math.min(640, box[2] + bw * rand), Math.min(640, box[3] + bh * rand)];
    await p.screenshot({ path: `${K}/${PRE}${i}.png` });
    meta.push({ aus, t, mm, datei: `${PRE}${i}.png`, rahmen: RAHMEN[ri], symbol: klassen[si][0], groesse: GR[gi], name: klassen[si][1] });
  }
  fs.writeFileSync(K + (MIT_TEXT ? '/tfotos.json' : '/fotos.json'), JSON.stringify(meta));
  await b.close();
})();
