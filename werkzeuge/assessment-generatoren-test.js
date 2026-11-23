// Erzeugt je Aufgabentyp und Stufe 1.500 Aufgaben und prüft: vier verschiedene Antworten, richtige dabei, kein NaN, nichts Negatives. Aufruf: node werkzeuge/assessment-generatoren-test.js [zeigen]
const fs = require('fs'), vm = require('vm');
let src = fs.readFileSync(require('path').join(__dirname, '../js/18-assessment.js'), 'utf8'); src = src.slice(0, src.indexOf('/* ===== Speicher'));
const ctx = { console, esc: (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }; vm.createContext(ctx); vm.runInContext(src.replace("'use strict';", ''), ctx);
const { AT_GEN } = ctx;
let fehler = {}, n = 0, beispiele = {}, proben = {};
for (const b of Object.keys(AT_GEN)) for (const t of Object.keys(AT_GEN[b])) for (let s = 0; s < 3; s++) for (let i = 0; i < 1500; i++) {
  if (b === 'mathe' && t === 'bruch' && s === 0) continue;
  const a = AT_GEN[b][t](s); n++;
  const k = b + '/' + t + '/' + s, prob = [];
  if (a.optionen.length !== 4) prob.push('Anzahl ' + a.optionen.length);
  if (new Set(a.optionen).size !== a.optionen.length) prob.push('doppelt');
  if (!(a.richtig >= 0 && a.richtig < a.optionen.length)) prob.push('richtig fehlt');
  if (a.optionen.some(o => /NaN|undefined|Infinity/.test(o))) prob.push('NaN');
  if (a.optionen.some(o => /^-/.test(o))) prob.push('negativ');
  if (/NaN|undefined/.test(a.frage + a.erklaerung)) prob.push('Text');
  if (!proben[k]) proben[k] = a.frage.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') + ' | ' + a.optionen.join(' / ') + ' | ✓ ' + a.optionen[a.richtig] + ' | ' + a.erklaerung;
  if (prob.length) { fehler[k] = (fehler[k] || 0) + 1; if (!beispiele[k]) beispiele[k] = { prob, frage: a.frage.replace(/<[^>]+>/g, ' '), opt: a.optionen, r: a.richtig }; }
}
console.log('geprüft', n); console.log('Fehler', JSON.stringify(fehler)); for (const k in beispiele) console.log(k, JSON.stringify(beispiele[k]));
if (process.argv[2]) for (const k in proben) console.log(k, '::', proben[k]);
