/* MeinKamerad – Start der Seite. Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

window.addEventListener('hashchange', route);

profilAnwenden();
fuelleDienstgrade();
render();
route();
