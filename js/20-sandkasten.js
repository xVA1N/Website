/* MeinKamerad – Geländesandkasten: Gelände in 3D formen, Wald, Gewässer, Wege und Ortschaften setzen,
   taktische Zeichen als Fähnchen und Bewegungspfeile für die Befehlsausgabe, Sichtbereich eines Beobachters für die Ausbildung.
   Grundfläche 1 × 1 km, Höhen zur besseren Lesbarkeit doppelt überhöht. three.js liegt in vendor/ und wird erst hier geladen.
   Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';

var SBX_KEY = 'meinkamerad-sandkasten';
var SBX_N = 96;                 // Kästchen je Seite, (N+1)² Höhenpunkte
var SBX_W = 100;                // Kantenlänge in Szene-Einheiten (1 Einheit = 10 m)
var SBX_M = 1000;               // Kantenlänge in Metern
var SBX_UEB = 2;                // Überhöhung
var SBX_HMIN = -30, SBX_HMAX = 150;
var SBX_ARTEN = {
  frei: { name: 'Selbst formen', text: 'Wie im echten Sandkasten: Hügel aufschütten, Senken graben, Wald, Wasser, Wege und Ortschaften setzen.' },
  echt: { name: 'Echtes Gelände', text: 'Einen Ausschnitt auf der Karte wählen und das Höhenrelief als Sandkasten laden.', bald: true }
};
// Flächen, die auf den Sand gemalt werden (je Höhenpunkt)
var SBX_FLAECHE = { sand: 0, wald: 1, wasser: 2, ort: 3 };
// Linien, frei mit dem Finger gezogen und aufs Gelände gelegt
var SBX_LINIE = {
  strasse: { name: 'Straße', breite: 1.1, farbe: 0x6E6C66 },
  weg: { name: 'Weg', breite: 0.6, farbe: 0xB48A58 },
  fluss: { name: 'Bach, Fluss', breite: 1.5, farbe: 0x3F78B6 },
  pfeil_eigen: { name: 'Bewegung eigene', breite: 0.9, farbe: 0x1F5FBF, pfeil: true },
  pfeil_feind: { name: 'Bewegung Feind', breite: 0.9, farbe: 0xC62828, pfeil: true }
};
// Taktische Zeichen nach APP-6D (Land, Einheit); Größen nach Bundeswehr-Brauch: Trupp •, Gruppe ••, Zug •••, Kompanie I
var SBX_ZEICHEN = [
  ['Inf-Gruppe', '13121100'], ['Inf-Zug', '14121100'], ['PzGren-Zug', '14121102'], ['Panzerzug', '14120500'],
  ['Aufkl-Trupp', '12121300'], ['Inf-Kompanie', '15121100']
];
// Werkzeuge im Dock
var SBX_DOCK = [
  ['Formen', [['huegel', 'Hügel aufschütten'], ['senke', 'Senke graben'], ['glaetten', 'Glätten'], ['ebnen', 'Einebnen']]],
  ['Gelände', [['wald', 'Wald'], ['wasser', 'Wasser, See'], ['ort', 'Ortschaft'], ['strasse', 'Straße'], ['weg', 'Weg'], ['fluss', 'Bach, Fluss'], ['radieren', 'Fläche entfernen']]],
  ['Lage', [['zeichen', 'Taktisches Zeichen'], ['pfeil_eigen', 'Bewegung eigene'], ['pfeil_feind', 'Bewegung Feind'], ['entfernen', 'Zeichen, Linie entfernen']]],
  ['Ausbildung', [['beob', 'Sichtbereich Beobachter']]]
];
var SBX_HILFE = {
  huegel: 'Gedrückt halten und wischen: Sand aufschütten. Zwei Finger drehen, zoomen und verschieben.',
  senke: 'Gedrückt halten und wischen: Sand abtragen.',
  glaetten: 'Über Kanten wischen, um sie weich zu machen.',
  ebnen: 'Beim ersten Antippen wird die Höhe gemerkt, Wischen ebnet auf diese Höhe ein.',
  wald: 'Über den Sand wischen, um Wald zu setzen.', wasser: 'Über den Sand wischen, um Wasser zu setzen.', ort: 'Über den Sand wischen, um Häuser zu setzen.',
  radieren: 'Über Wald, Wasser oder Ortschaft wischen, um sie zu entfernen.',
  strasse: 'Mit dem Finger die Straße ziehen.', weg: 'Mit dem Finger den Weg ziehen.', fluss: 'Mit dem Finger den Bach ziehen.',
  pfeil_eigen: 'Mit dem Finger die Bewegung ziehen, die Spitze kommt ans Ende.', pfeil_feind: 'Mit dem Finger die Bewegung ziehen, die Spitze kommt ans Ende.',
  zeichen: 'Zeichen wählen, dann auf den Sand tippen.', entfernen: 'Ein Zeichen, eine Linie oder einen Pfeil antippen, um es zu entfernen.',
  beob: 'Auf den Standort des Beobachters tippen. Rot getönt ist, was er nicht sieht (Ziel stehend, 2 m); Wald und Häuser verdecken die Sicht.'
};

/* ===== Speicher ===== */
function sbxLaden() {
  try {
    var d = JSON.parse(localStorage.getItem(SBX_KEY) || 'null');
    if (d && Array.isArray(d.liste)) return d;
  } catch (e) { /* neu anlegen */ }
  return { liste: [] };
}
var SBX = sbxLaden();
function sbxSpeichern() {
  try { localStorage.setItem(SBX_KEY, JSON.stringify(SBX)); return true; } catch (e) { return false; }
}
function sbxB64(arr) {
  var b = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength), s = '';
  for (var i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
  return btoa(s);
}
function sbxAusB64(s, Typ, n) {
  var out = new Typ(n);
  if (!s) return out;
  try {
    var bin = atob(s), b = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    var t = new Typ(b.buffer, 0, Math.min(n, Math.floor(b.length / Typ.BYTES_PER_ELEMENT)));
    out.set(t);
  } catch (e) { /* leer lassen */ }
  return out;
}

/* ===== Gelände-Daten des offenen Sandkastens ===== */
var SBX_P = SBX_N + 1;
var sbxAkt = null;          // gespeicherter Eintrag
var sbxH = null;            // Höhen in Metern, Float32Array (P×P)
var sbxF = null;            // Flächen je Höhenpunkt, Uint8Array
var sbxSicht = null;        // 1 = vom Beobachter nicht sichtbar
function sbxIdx(i, j) { return j * SBX_P + i; }
// Szene-Koordinaten (0..W) zu Gitter
function sbxHoehe(x, z) {
  var gx = Math.max(0, Math.min(SBX_N - 1e-6, x / SBX_W * SBX_N)), gz = Math.max(0, Math.min(SBX_N - 1e-6, z / SBX_W * SBX_N));
  var i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j;
  var a = sbxH[sbxIdx(i, j)], b = sbxH[sbxIdx(i + 1, j)], c = sbxH[sbxIdx(i, j + 1)], d = sbxH[sbxIdx(i + 1, j + 1)];
  return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz;
}
function sbxY(m) { return m / 10 * SBX_UEB; }
function sbxFlaecheBei(x, z) {
  var i = Math.round(x / SBX_W * SBX_N), j = Math.round(z / SBX_W * SBX_N);
  if (i < 0 || j < 0 || i > SBX_N || j > SBX_N) return 0;
  return sbxF[sbxIdx(i, j)];
}
// gleichmäßiges Rauschen je Punkt für Sandkorn und Baumstellung
function sbxZufall(i, j, k) { var s = Math.sin(i * 127.1 + j * 311.7 + (k || 0) * 74.7) * 43758.5453; return s - Math.floor(s); }

/* ===== three.js Szene ===== */
var sbxT = null;            // { renderer, scene, camera, gelaende, baeume, haeuser, daecher, linien, zeichen, beob, ... }
var sbxKam = { theta: 0.6, phi: 0.95, r: 125, ziel: null };
var sbxNeuZeichnen = true;
function ladeThree() { return window.THREE ? Promise.resolve() : ladeSkript('vendor/three.min.js'); }

function sbxSzeneBauen() {
  var T = window.THREE, buehne = $('sbx-buehne');
  var r = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
  buehne.appendChild(r.domElement);
  var scene = new T.Scene();
  scene.background = new T.Color(0xDCD8CD);
  var cam = new T.PerspectiveCamera(40, 1, 0.5, 2000);
  scene.add(new T.HemisphereLight(0xFFFFFF, 0x8A7F6A, 0.65));
  var sonne = new T.DirectionalLight(0xFFF4E0, 0.85);
  sonne.position.set(-60, 120, -30); sonne.target.position.set(SBX_W / 2, 0, SBX_W / 2);
  sonne.castShadow = true; sonne.shadow.mapSize.set(2048, 2048);
  var sc = sonne.shadow.camera; sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80; sc.near = 10; sc.far = 400;
  sonne.shadow.bias = -0.0008;
  scene.add(sonne); scene.add(sonne.target);

  // Gelände
  var geo = new T.PlaneGeometry(SBX_W, SBX_W, SBX_N, SBX_N);
  geo.rotateX(-Math.PI / 2); geo.translate(SBX_W / 2, 0, SBX_W / 2);
  geo.setAttribute('color', new T.BufferAttribute(new Float32Array(SBX_P * SBX_P * 3), 3));
  var gelaende = new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true }));
  gelaende.receiveShadow = true; gelaende.castShadow = true;
  scene.add(gelaende);

  // Holzkasten mit Boden
  var holz = new T.MeshLambertMaterial({ color: 0x8B5E34 });
  var dick = 2.4, hoch = 9, unten = -7;
  [[SBX_W / 2, -dick / 2, SBX_W + 2 * dick, dick], [SBX_W / 2, SBX_W + dick / 2, SBX_W + 2 * dick, dick], [-dick / 2, SBX_W / 2, dick, SBX_W], [SBX_W + dick / 2, SBX_W / 2, dick, SBX_W]].forEach(function (b) {
    var m = new T.Mesh(new T.BoxGeometry(b[2], hoch, b[3]), holz);
    m.position.set(b[0], unten + hoch / 2, b[1]); m.castShadow = true; m.receiveShadow = true; scene.add(m);
  });
  var boden = new T.Mesh(new T.BoxGeometry(SBX_W, 1, SBX_W), new T.MeshLambertMaterial({ color: 0xC9B48C }));
  boden.position.set(SBX_W / 2, unten - 0.5, SBX_W / 2); scene.add(boden);
  var tisch = new T.Mesh(new T.PlaneGeometry(1200, 1200), new T.MeshLambertMaterial({ color: 0xB9B3A4 }));
  tisch.rotation.x = -Math.PI / 2; tisch.position.set(SBX_W / 2, unten - 1, SBX_W / 2); tisch.receiveShadow = true; scene.add(tisch);

  // Bäume (grünes Sägemehl, kleine Büschel) und Häuser (Holzklötze mit Dach)
  var max = SBX_P * SBX_P;
  var baumGeo = new T.IcosahedronGeometry(0.75, 0); baumGeo.scale(1, 1.25, 1);
  var baeume = new T.InstancedMesh(baumGeo, new T.MeshLambertMaterial({ color: 0x4E7A3A, flatShading: true }), max);
  baeume.castShadow = true; baeume.receiveShadow = true; baeume.count = 0; scene.add(baeume);
  var hausGeo = new T.BoxGeometry(1.5, 1.1, 1.1); hausGeo.translate(0, 0.55, 0);
  var haeuser = new T.InstancedMesh(hausGeo, new T.MeshLambertMaterial({ color: 0xE8DCC4 }), max);
  haeuser.castShadow = true; haeuser.count = 0; scene.add(haeuser);
  var dachGeo = new T.CylinderGeometry(0, 0.95, 0.7, 4, 1); dachGeo.rotateY(Math.PI / 4); dachGeo.scale(1.15, 1, 0.85); dachGeo.translate(0, 1.45, 0);
  var daecher = new T.InstancedMesh(dachGeo, new T.MeshLambertMaterial({ color: 0xA6452E, flatShading: true }), max);
  daecher.castShadow = true; daecher.count = 0; scene.add(daecher);

  var linien = new T.Group(), zeichen = new T.Group(); scene.add(linien); scene.add(zeichen);
  // Beobachter: kleine Figur mit Fernglas-Kopf
  var beob = new T.Group();
  var kp = new T.Mesh(new T.CylinderGeometry(0.35, 0.55, 2.2, 10), new T.MeshLambertMaterial({ color: 0x1F5FBF })); kp.position.y = 1.1;
  var kopf = new T.Mesh(new T.SphereGeometry(0.5, 12, 10), new T.MeshLambertMaterial({ color: 0xF1D3B0 })); kopf.position.y = 2.6;
  beob.add(kp); beob.add(kopf); beob.visible = false; kp.castShadow = true; kopf.castShadow = true; scene.add(beob);

  sbxT = { T: T, renderer: r, scene: scene, cam: cam, gelaende: gelaende, baeume: baeume, haeuser: haeuser, daecher: daecher, linien: linien, zeichen: zeichen, beob: beob, ray: new T.Raycaster(), tex: {} };
  sbxGroesse();
  window.addEventListener('resize', sbxGroesse);
  sbxEingabe(r.domElement);
  (function schleife() {
    requestAnimationFrame(schleife);
    if ($('sbx-voll').hidden) return;
    sbxPinselSchritt();
    if (sbxNeuZeichnen) { sbxNeuZeichnen = false; sbxKameraSetzen(); r.render(scene, cam); }
  })();
}
function sbxGroesse() {
  if (!sbxT) return;
  var b = $('sbx-buehne'), w = b.clientWidth || window.innerWidth, h = b.clientHeight || window.innerHeight;
  sbxT.renderer.setSize(w, h, false);
  sbxT.renderer.domElement.style.width = '100%'; sbxT.renderer.domElement.style.height = '100%';
  sbxT.cam.aspect = w / h; sbxT.cam.updateProjectionMatrix();
  sbxNeuZeichnen = true;
}
function sbxKameraSetzen() {
  var k = sbxKam, z = k.ziel || { x: SBX_W / 2, y: 0, z: SBX_W / 2 };
  k.phi = Math.max(0.08, Math.min(1.45, k.phi)); k.r = Math.max(18, Math.min(260, k.r));
  var c = sbxT.cam;
  c.position.set(z.x + k.r * Math.sin(k.phi) * Math.sin(k.theta), z.y + k.r * Math.cos(k.phi), z.z + k.r * Math.sin(k.phi) * Math.cos(k.theta));
  c.lookAt(z.x, z.y, z.z);
}
function sbxAnsichtZuruecksetzen(vonOben) {
  sbxKam = { theta: vonOben ? 0 : 0.6, phi: vonOben ? 0.08 : 0.95, r: vonOben ? 150 : 125, ziel: { x: SBX_W / 2, y: 0, z: SBX_W / 2 } };
  sbxNeuZeichnen = true;
}

/* ===== Gelände zeichnen ===== */
var SBX_FARBE = { sand: [0.86, 0.75, 0.56], wald: [0.33, 0.50, 0.25], wasser: [0.28, 0.52, 0.78], ort: [0.74, 0.70, 0.63], sicht: [0.86, 0.22, 0.18] };
function sbxGelaendeAktualisieren() {
  var g = sbxT.gelaende.geometry, pos = g.attributes.position, col = g.attributes.color;
  for (var j = 0; j < SBX_P; j++) for (var i = 0; i < SBX_P; i++) {
    var k = sbxIdx(i, j), h = sbxH[k];
    pos.setY(k, sbxY(h));
    var f = sbxF[k], c = f === 1 ? SBX_FARBE.wald : f === 2 ? SBX_FARBE.wasser : f === 3 ? SBX_FARBE.ort : SBX_FARBE.sand;
    var korn = (sbxZufall(i, j) - 0.5) * 0.07, hell = Math.max(-0.05, Math.min(0.06, h / 1500));
    var r = c[0] + korn + hell, gg = c[1] + korn + hell, b = c[2] + korn * 0.8 + hell;
    if (sbxSicht && sbxSicht[k]) { r = r * 0.5 + SBX_FARBE.sicht[0] * 0.5; gg = gg * 0.5 + SBX_FARBE.sicht[1] * 0.5; b = b * 0.5 + SBX_FARBE.sicht[2] * 0.5; }
    col.setXYZ(k, r, gg, b);
  }
  pos.needsUpdate = true; col.needsUpdate = true;
  g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox();
  sbxNeuZeichnen = true;
}
function sbxBewuchsAktualisieren() {
  var T = sbxT.T, m = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), p = new T.Vector3(), achse = new T.Vector3(0, 1, 0);
  var nb = 0, nh = 0;
  for (var j = 0; j < SBX_P; j++) for (var i = 0; i < SBX_P; i++) {
    var f = sbxF[sbxIdx(i, j)];
    if (f === 1) {
      for (var t = 0; t < 2; t++) {
        var x = (i + (sbxZufall(i, j, t) - 0.5) * 0.9) * SBX_W / SBX_N, z = (j + (sbxZufall(j, i, t + 3) - 0.5) * 0.9) * SBX_W / SBX_N;
        var gr = 0.8 + sbxZufall(i, j, t + 7) * 0.6;
        p.set(x, sbxY(sbxHoehe(x, z)) + 0.35 * gr, z); s.set(gr, gr, gr); q.setFromAxisAngle(achse, sbxZufall(i, j, t + 9) * 6.28);
        m.compose(p, q, s); sbxT.baeume.setMatrixAt(nb++, m);
      }
    } else if (f === 3 && (i + j) % 2 === 0) {
      var hx = (i + (sbxZufall(i, j, 1) - 0.5) * 0.5) * SBX_W / SBX_N, hz = (j + (sbxZufall(j, i, 2) - 0.5) * 0.5) * SBX_W / SBX_N;
      var hy = Math.min(sbxY(sbxHoehe(hx - 0.6, hz)), sbxY(sbxHoehe(hx + 0.6, hz)), sbxY(sbxHoehe(hx, hz - 0.5)), sbxY(sbxHoehe(hx, hz + 0.5)));
      p.set(hx, hy, hz); s.set(1, 0.9 + sbxZufall(i, j, 4) * 0.4, 1); q.setFromAxisAngle(achse, Math.round(sbxZufall(i, j, 5) * 4) * Math.PI / 2 + (sbxZufall(i, j, 6) - 0.5) * 0.3);
      m.compose(p, q, s); sbxT.haeuser.setMatrixAt(nh, m); sbxT.daecher.setMatrixAt(nh, m); nh++;
    }
  }
  sbxT.baeume.count = nb; sbxT.haeuser.count = nh; sbxT.daecher.count = nh;
  sbxT.baeume.instanceMatrix.needsUpdate = true; sbxT.haeuser.instanceMatrix.needsUpdate = true; sbxT.daecher.instanceMatrix.needsUpdate = true;
  sbxNeuZeichnen = true;
}
// Linie als Band auf dem Gelände, Pfeile mit Spitze
function sbxBand(l) {
  var T = sbxT.T, art = SBX_LINIE[l.art], pts = [], i;
  for (i = 0; i < l.pts.length - 1; i++) {
    var a = l.pts[i], b = l.pts[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / 0.5));
    for (var k = 0; k < n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  pts.push(l.pts[l.pts.length - 1]);
  if (pts.length < 2) return null;
  var spitze = art.pfeil ? 2.6 : 0, laenge = 0;
  for (i = 1; i < pts.length; i++) laenge += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  // Band endet vor der Spitze
  if (spitze) { var rest = spitze; while (pts.length > 2 && rest > 0) { var e = pts[pts.length - 1], v = pts[pts.length - 2], dd = Math.hypot(e[0] - v[0], e[1] - v[1]); if (dd > rest) { pts[pts.length - 1] = [e[0] + (v[0] - e[0]) * rest / dd, e[1] + (v[1] - e[1]) * rest / dd]; rest = 0; } else { pts.pop(); rest -= dd; } } }
  var pos = [], idx = [], w = art.breite / 2, heb = art.pfeil ? 0.35 : 0.14;
  for (i = 0; i < pts.length; i++) {
    var p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(pts.length - 1, i + 1)], tx = p1[0] - p0[0], tz = p1[1] - p0[1], tl = Math.hypot(tx, tz) || 1;
    var nx = -tz / tl * w, nz = tx / tl * w, x = pts[i][0], z = pts[i][1];
    pos.push(x + nx, sbxY(sbxHoehe(x + nx, z + nz)) + heb, z + nz, x - nx, sbxY(sbxHoehe(x - nx, z - nz)) + heb, z - nz);
    if (i > 0) { var o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
  }
  if (spitze && laenge > 1) {
    var ende = l.pts[l.pts.length - 1], letzter = pts[pts.length - 1], rx = ende[0] - letzter[0], rz = ende[1] - letzter[1], rl = Math.hypot(rx, rz) || 1;
    var bx = -rz / rl * art.breite * 1.5, bz = rx / rl * art.breite * 1.5, s0 = pos.length / 3;
    pos.push(letzter[0] + bx, sbxY(sbxHoehe(letzter[0] + bx, letzter[1] + bz)) + heb, letzter[1] + bz,
      letzter[0] - bx, sbxY(sbxHoehe(letzter[0] - bx, letzter[1] - bz)) + heb, letzter[1] - bz,
      ende[0], sbxY(sbxHoehe(ende[0], ende[1])) + heb, ende[1]);
    idx.push(s0, s0 + 1, s0 + 2);
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  var mesh = new T.Mesh(g, new T.MeshLambertMaterial({ color: art.farbe, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
  mesh.receiveShadow = true; mesh.userData.id = l.id;
  return mesh;
}
function sbxLinienAktualisieren() {
  var g = sbxT.linien;
  while (g.children.length) { var c = g.children.pop(); c.geometry.dispose(); c.material.dispose(); }
  sbxAkt.linien.forEach(function (l) { var m = sbxBand(l); if (m) g.add(m); });
  sbxNeuZeichnen = true;
}
// Taktisches Zeichen als Fähnchen auf einer Nadel
function sbxZeichenTextur(z) {
  var key = z.sidc + JSON.stringify(z.opt || {});
  if (sbxT.tex[key]) return sbxT.tex[key];
  var sym = msSymbolAus({ sidc: z.sidc, opt: Object.assign({ standard: 'APP6' }, z.opt || {}) }, 90), can = sym.asCanvas(2);
  var tex = new sbxT.T.CanvasTexture(can); tex.anisotropy = 4;
  if ('colorSpace' in tex) tex.colorSpace = sbxT.T.SRGBColorSpace; else tex.encoding = sbxT.T.sRGBEncoding;
  sbxT.tex[key] = { tex: tex, seite: can.width / can.height };
  return sbxT.tex[key];
}
function sbxZeichenAktualisieren() {
  var T = sbxT.T, g = sbxT.zeichen;
  while (g.children.length) { var c = g.children.pop(); c.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== sbxT.nadelMat) o.material.dispose(); }); }
  if (!window.ms) return;
  sbxT.nadelMat = sbxT.nadelMat || new T.MeshLambertMaterial({ color: 0x3A3A36 });
  sbxAkt.zeichen.forEach(function (z) {
    var t = sbxZeichenTextur(z), grp = new T.Group(), y = sbxY(sbxHoehe(z.x, z.z)), hoch = 4.2;
    var nadel = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, hoch, 6), sbxT.nadelMat); nadel.position.set(0, hoch / 2, 0); nadel.castShadow = true;
    var sp = new T.Sprite(new T.SpriteMaterial({ map: t.tex, depthTest: true }));
    var b = 5.2; sp.scale.set(b, b / t.seite, 1); sp.center.set(0.5, 0); sp.position.set(0, hoch, 0);
    grp.add(nadel); grp.add(sp); grp.position.set(z.x, y, z.z); grp.userData.id = z.id;
    g.add(grp);
  });
  sbxNeuZeichnen = true;
}
function sbxBeobAktualisieren() {
  var b = sbxAkt.beob;
  sbxT.beob.visible = !!b;
  if (b) sbxT.beob.position.set(b.x, sbxY(sbxHoehe(b.x, b.z)), b.z);
  sbxSichtBerechnen();
}
// Sichtbereich: Augenhöhe 2 m über Grund, Ziel stehend 2 m über Grund; Wald verdeckt 15 m, Häuser 8 m
function sbxSichtBerechnen() {
  var b = sbxAkt && sbxAkt.beob;
  if (!b) { sbxSicht = null; return; }
  var auge = sbxHoehe(b.x, b.z) + 2, ox = b.x / SBX_W * SBX_N, oz = b.z / SBX_W * SBX_N;
  sbxSicht = new Uint8Array(SBX_P * SBX_P);
  var huelle = function (gx, gz) {
    var i = Math.round(gx), j = Math.round(gz), f = sbxF[sbxIdx(i, j)];
    return sbxHoehe(gx * SBX_W / SBX_N, gz * SBX_W / SBX_N) + (f === 1 ? 15 : f === 3 ? 8 : 0);
  };
  for (var j = 0; j < SBX_P; j++) for (var i = 0; i < SBX_P; i++) {
    var dx = i - ox, dz = j - oz, d = Math.hypot(dx, dz);
    if (d < 1.5) continue;
    var ziel = sbxH[sbxIdx(i, j)] + 2, n = Math.ceil(d * 2), frei = true;
    for (var s = 1; s < n - 1; s++) {
      var t = s / n, sichtlinie = auge + (ziel - auge) * t;
      if (huelle(ox + dx * t, oz + dz * t) > sichtlinie) { frei = false; break; }
    }
    if (!frei) sbxSicht[sbxIdx(i, j)] = 1;
  }
}
function sbxAllesAktualisieren() {
  sbxSichtBerechnen(); sbxGelaendeAktualisieren(); sbxBewuchsAktualisieren(); sbxLinienAktualisieren(); sbxZeichenAktualisieren(); sbxBeobAktualisieren(); sbxGelaendeAktualisieren();
}

/* ===== Eingabe: Werkzeug, Drehen, Zoomen ===== */
var sbxWerkzeug = null, sbxZeichenWahl = null, sbxFeind = false, sbxPinsel = 'mittel';
var SBX_PINSEL = { klein: 3, mittel: 6, gross: 11 };
var sbxZeiger = {}, sbxStrich = null, sbxGeste = null;
function sbxTreffer(cx, cy) {
  var el = sbxT.renderer.domElement, r = el.getBoundingClientRect(), T = sbxT.T;
  sbxT.ray.setFromCamera(new T.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), sbxT.cam);
  var hit = sbxT.ray.intersectObject(sbxT.gelaende, false)[0];
  return hit ? { x: hit.point.x, z: hit.point.z, y: hit.point.y } : null;
}
function sbxEingabe(el) {
  el.addEventListener('pointerdown', function (ev) {
    el.setPointerCapture(ev.pointerId);
    sbxZeiger[ev.pointerId] = { x: ev.clientX, y: ev.clientY, taste: ev.button };
    var ids = Object.keys(sbxZeiger);
    if (ids.length === 2) { sbxStrichAbbrechen(); sbxGeste = null; return; }
    if (ids.length > 2) return;
    if (ev.button === 2 || !sbxWerkzeug) { sbxGeste = { art: 'drehen' }; return; }
    sbxStrichStart(ev.clientX, ev.clientY);
  });
  el.addEventListener('pointermove', function (ev) {
    var z = sbxZeiger[ev.pointerId]; if (!z) return;
    var ids = Object.keys(sbxZeiger);
    if (ids.length === 2) {
      var a = sbxZeiger[ids[0]], b = sbxZeiger[ids[1]];
      var vorD = Math.hypot(a.x - b.x, a.y - b.y), vorM = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, vorW = Math.atan2(b.y - a.y, b.x - a.x);
      z.x = ev.clientX; z.y = ev.clientY;
      var d = Math.hypot(a.x - b.x, a.y - b.y), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, w = Math.atan2(b.y - a.y, b.x - a.x);
      if (vorD > 0 && d > 0) sbxKam.r *= vorD / d;
      var dw = w - vorW; if (dw > Math.PI) dw -= 2 * Math.PI; if (dw < -Math.PI) dw += 2 * Math.PI;
      sbxKam.theta -= dw;
      sbxKam.phi -= (m.y - vorM.y) * 0.006;
      sbxVerschieben(m.x - vorM.x, 0);
      sbxNeuZeichnen = true; return;
    }
    var dx = ev.clientX - z.x, dy = ev.clientY - z.y;
    z.x = ev.clientX; z.y = ev.clientY;
    if (sbxGeste && sbxGeste.art === 'drehen') { sbxKam.theta -= dx * 0.008; sbxKam.phi -= dy * 0.006; sbxNeuZeichnen = true; return; }
    if (sbxStrich) sbxStrichWeiter(ev.clientX, ev.clientY);
  });
  var ende = function (ev) {
    if (!sbxZeiger[ev.pointerId]) return;
    delete sbxZeiger[ev.pointerId];
    if (!Object.keys(sbxZeiger).length) { if (sbxStrich) sbxStrichEnde(); sbxGeste = null; }
  };
  el.addEventListener('pointerup', ende); el.addEventListener('pointercancel', ende);
  el.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
  el.addEventListener('wheel', function (ev) { ev.preventDefault(); sbxKam.r *= Math.exp(ev.deltaY * 0.0012); sbxNeuZeichnen = true; }, { passive: false });
}
// Verschieben in Bildschirmrichtung auf der Tischebene
function sbxVerschieben(dx, dy) {
  var k = sbxKam, f = k.r * 0.0016;
  k.ziel = k.ziel || { x: SBX_W / 2, y: 0, z: SBX_W / 2 };
  k.ziel.x -= (Math.cos(k.theta) * dx - Math.sin(k.theta) * dy) * f;
  k.ziel.z -= (-Math.sin(k.theta) * dx - Math.cos(k.theta) * dy) * f;
  k.ziel.x = Math.max(-20, Math.min(SBX_W + 20, k.ziel.x)); k.ziel.z = Math.max(-20, Math.min(SBX_W + 20, k.ziel.z));
}

/* Rückgängig: Zustand vor jedem Schritt */
var sbxVerlauf = [];
function sbxMerken() {
  sbxVerlauf.push({ h: sbxH.slice(), f: sbxF.slice(), linien: JSON.stringify(sbxAkt.linien), zeichen: JSON.stringify(sbxAkt.zeichen), beob: JSON.stringify(sbxAkt.beob || null) });
  if (sbxVerlauf.length > 25) sbxVerlauf.shift();
  $('sbx-zurueck').disabled = false;
}
function sbxRueckgaengig() {
  var v = sbxVerlauf.pop(); if (!v) return;
  sbxH.set(v.h); sbxF.set(v.f); sbxAkt.linien = JSON.parse(v.linien); sbxAkt.zeichen = JSON.parse(v.zeichen); sbxAkt.beob = JSON.parse(v.beob);
  $('sbx-zurueck').disabled = !sbxVerlauf.length;
  sbxAllesAktualisieren(); sbxSichern();
}

var SBX_FORMEN = { huegel: 1, senke: 1, glaetten: 1, ebnen: 1 };
var SBX_MALEN = { wald: 1, wasser: 2, ort: 3, radieren: 0 };
function sbxStrichStart(cx, cy) {
  var p = sbxTreffer(cx, cy), w = sbxWerkzeug;
  if (!p) { sbxGeste = { art: 'drehen' }; return; }
  if (SBX_FORMEN[w] || w in SBX_MALEN) {
    sbxMerken();
    sbxStrich = { art: w, p: p, ebene: sbxHoehe(p.x, p.z), zuletzt: 0 };
    if (w in SBX_MALEN) sbxMalen(p);
    return;
  }
  if (SBX_LINIE[w]) { sbxStrich = { art: w, pts: [[p.x, p.z]] }; return; }
  if (w === 'zeichen') {
    if (!sbxZeichenWahl) { sbxMeldung('Zuerst unten ein Zeichen wählen.'); return; }
    sbxMerken();
    sbxAkt.zeichen.push({ id: 'z' + Date.now().toString(36), sidc: sbxZeichenWahl.sidc, opt: sbxZeichenWahl.opt || {}, x: p.x, z: p.z });
    sbxZeichenAktualisieren(); sbxSichern(); return;
  }
  if (w === 'entfernen') { sbxEntfernen(cx, cy, p); return; }
  if (w === 'beob') {
    sbxMerken(); sbxAkt.beob = { x: p.x, z: p.z };
    sbxBeobAktualisieren(); sbxGelaendeAktualisieren(); sbxSichern();
    var anteil = 0; for (var i = 0; i < sbxSicht.length; i++) anteil += sbxSicht[i];
    sbxMeldung('Sichtbar: etwa ' + Math.round(100 - anteil / sbxSicht.length * 100) + ' % der Fläche.');
  }
}
function sbxStrichWeiter(cx, cy) {
  var p = sbxTreffer(cx, cy); if (!p) return;
  if (sbxStrich.pts) {
    var l = sbxStrich.pts[sbxStrich.pts.length - 1];
    if (Math.hypot(p.x - l[0], p.z - l[1]) > 0.9) { sbxStrich.pts.push([p.x, p.z]); sbxStrichVorschau(); }
    return;
  }
  sbxStrich.p = p;
  if (sbxStrich.art in SBX_MALEN) sbxMalen(p);
}
function sbxStrichVorschau() {
  var alt = sbxT.vorschau; if (alt) { sbxT.scene.remove(alt); alt.geometry.dispose(); alt.material.dispose(); }
  sbxT.vorschau = sbxStrich && sbxStrich.pts.length > 1 ? sbxBand({ art: sbxStrich.art, pts: sbxStrich.pts }) : null;
  if (sbxT.vorschau) sbxT.scene.add(sbxT.vorschau);
  sbxNeuZeichnen = true;
}
function sbxStrichEnde() {
  var s = sbxStrich; sbxStrich = null;
  if (s.pts) {
    var v = sbxT.vorschau; sbxT.vorschau = null; if (v) { sbxT.scene.remove(v); v.geometry.dispose(); v.material.dispose(); }
    var lang = 0; for (var i = 1; i < s.pts.length; i++) lang += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
    if (lang < 2) { sbxMeldung('Etwas länger ziehen.'); return; }
    sbxMerken();
    sbxAkt.linien.push({ id: 'l' + Date.now().toString(36), art: s.art, pts: s.pts.map(function (p) { return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]; }) });
    sbxLinienAktualisieren(); sbxSichern(); return;
  }
  sbxSichtBerechnen(); sbxGelaendeAktualisieren(); sbxBewuchsAktualisieren(); sbxLinienAktualisieren(); sbxZeichenAktualisieren(); sbxBeobAktualisieren(); sbxGelaendeAktualisieren();
  sbxSichern();
}
function sbxStrichAbbrechen() {
  if (!sbxStrich) return;
  var hatte = !sbxStrich.pts; sbxStrich = null;
  if (sbxT.vorschau) sbxStrichVorschau();
  if (hatte) sbxRueckgaengig();
}
// Formen läuft in jedem Bild, solange der Finger liegt
function sbxPinselSchritt() {
  var s = sbxStrich; if (!s || !SBX_FORMEN[s.art]) return;
  var jetzt = performance.now(); if (jetzt - s.zuletzt < 30) return; s.zuletzt = jetzt;
  var rad = SBX_PINSEL[sbxPinsel] / SBX_W * SBX_N, cx = s.p.x / SBX_W * SBX_N, cz = s.p.z / SBX_W * SBX_N;
  var i0 = Math.max(0, Math.floor(cx - rad)), i1 = Math.min(SBX_N, Math.ceil(cx + rad)), j0 = Math.max(0, Math.floor(cz - rad)), j1 = Math.min(SBX_N, Math.ceil(cz + rad));
  var alt = s.art === 'glaetten' ? sbxH.slice() : null;
  for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
    var d = Math.hypot(i - cx, j - cz) / rad; if (d >= 1) continue;
    var w = 0.5 + 0.5 * Math.cos(d * Math.PI), k = sbxIdx(i, j);
    if (s.art === 'huegel') sbxH[k] += 1.6 * w;
    else if (s.art === 'senke') sbxH[k] -= 1.6 * w;
    else if (s.art === 'ebnen') sbxH[k] += (s.ebene - sbxH[k]) * 0.25 * w;
    else if (s.art === 'glaetten' && i > 0 && j > 0 && i < SBX_N && j < SBX_N) {
      var m = (alt[k - 1] + alt[k + 1] + alt[k - SBX_P] + alt[k + SBX_P]) / 4; sbxH[k] += (m - sbxH[k]) * 0.5 * w;
    }
    sbxH[k] = Math.max(SBX_HMIN, Math.min(SBX_HMAX, sbxH[k]));
  }
  sbxGelaendeAktualisieren();
}
function sbxMalen(p) {
  var wert = SBX_MALEN[sbxStrich.art], rad = SBX_PINSEL[sbxPinsel] * 0.6 / SBX_W * SBX_N, cx = p.x / SBX_W * SBX_N, cz = p.z / SBX_W * SBX_N;
  for (var j = Math.max(0, Math.floor(cz - rad)); j <= Math.min(SBX_N, Math.ceil(cz + rad)); j++)
    for (var i = Math.max(0, Math.floor(cx - rad)); i <= Math.min(SBX_N, Math.ceil(cx + rad)); i++)
      if (Math.hypot(i - cx, j - cz) <= rad) sbxF[sbxIdx(i, j)] = wert;
  sbxGelaendeAktualisieren();
  var jetzt = performance.now();
  if (!sbxStrich.bewuchs || jetzt - sbxStrich.bewuchs > 120) { sbxStrich.bewuchs = jetzt; sbxBewuchsAktualisieren(); }
}
// Zeichen oder Linie nahe am getippten Punkt entfernen
function sbxEntfernen(cx, cy, p) {
  var T = sbxT.T, el = sbxT.renderer.domElement, r = el.getBoundingClientRect(), best = null, bestD = 28;
  sbxAkt.zeichen.forEach(function (z) {
    [0, 2, 4.2, 5.5].forEach(function (h) {
      var v = new T.Vector3(z.x, sbxY(sbxHoehe(z.x, z.z)) + h, z.z).project(sbxT.cam);
      var d = Math.hypot((v.x + 1) / 2 * r.width + r.left - cx, (1 - v.y) / 2 * r.height + r.top - cy);
      if (d < bestD) { bestD = d; best = { art: 'zeichen', id: z.id }; }
    });
  });
  if (!best && p) {
    var grenz = 2.2;
    sbxAkt.linien.forEach(function (l) {
      for (var i = 0; i < l.pts.length - 1; i++) {
        var a = l.pts[i], b = l.pts[i + 1], vx = b[0] - a[0], vz = b[1] - a[1], ll = vx * vx + vz * vz || 1;
        var t = Math.max(0, Math.min(1, ((p.x - a[0]) * vx + (p.z - a[1]) * vz) / ll)), d = Math.hypot(a[0] + vx * t - p.x, a[1] + vz * t - p.z);
        if (d < grenz) { grenz = d; best = { art: 'linie', id: l.id }; }
      }
    });
  }
  if (!best && sbxAkt.beob && p && Math.hypot(sbxAkt.beob.x - p.x, sbxAkt.beob.z - p.z) < 3) best = { art: 'beob' };
  if (!best) { sbxMeldung('Hier ist nichts zum Entfernen.'); return; }
  sbxMerken();
  if (best.art === 'zeichen') { sbxAkt.zeichen = sbxAkt.zeichen.filter(function (z) { return z.id !== best.id; }); sbxZeichenAktualisieren(); }
  else if (best.art === 'linie') { sbxAkt.linien = sbxAkt.linien.filter(function (l) { return l.id !== best.id; }); sbxLinienAktualisieren(); }
  else { sbxAkt.beob = null; sbxBeobAktualisieren(); sbxGelaendeAktualisieren(); }
  sbxSichern();
}

/* ===== Bedienleiste ===== */
var sbxFach = null, sbxMeldungUhr = null;
function sbxMeldung(t) {
  var m = $('sbx-meldung'); m.textContent = t; m.hidden = !t;
  clearTimeout(sbxMeldungUhr); if (t) sbxMeldungUhr = setTimeout(function () { m.hidden = true; }, 3500);
}
// Kleine Bilder für die Werkzeuge (Strichzeichnung, 40 × 27)
var SBX_BILD = {
  huegel: '<path d="M2 24 C10 24 12 8 20 8 S30 24 38 24" fill="#E9DCC0" stroke="#7A6440"/>',
  senke: '<path d="M2 8 C10 8 12 22 20 22 S30 8 38 8" fill="none" stroke="#7A6440"/><path d="M2 8 C10 8 12 22 20 22 S30 8 38 8 V26 H2 Z" fill="#E9DCC0" stroke="none"/>',
  glaetten: '<path d="M2 20 L8 14 L12 19 L18 11 L22 18 L28 12 L32 18 L38 15" fill="none" stroke="#B9A57E"/><path d="M2 20 C12 15 26 15 38 17" fill="none" stroke="#7A6440"/>',
  ebnen: '<path d="M2 22 L10 12 L16 18 L22 9 L30 22" fill="none" stroke="#B9A57E" stroke-dasharray="2 2"/><path d="M2 17 H38" stroke="#7A6440"/>',
  wald: '<g fill="#4E7A3A"><circle cx="10" cy="14" r="5"/><circle cx="20" cy="11" r="6"/><circle cx="30" cy="15" r="5"/><circle cx="16" cy="19" r="5"/><circle cx="25" cy="20" r="5"/></g>',
  wasser: '<ellipse cx="20" cy="14" rx="15" ry="8" fill="#5D8FC6"/><path d="M12 13 q2-2 4 0 t4 0 M20 17 q2-2 4 0 t4 0" fill="none" stroke="#fff" stroke-width="1.2"/>',
  ort: '<path d="M6 22 V14 L11 9 L16 14 V22 Z M20 22 V12 L26 6 L32 12 V22 Z" fill="#E8DCC4" stroke="#7A6440"/><path d="M5 14 L11 8 L17 14 M19 12 L26 5 L33 12" fill="none" stroke="#A6452E" stroke-width="2"/>',
  strasse: '<path d="M3 22 C14 22 20 8 37 6" fill="none" stroke="#6E6C66" stroke-width="5" stroke-linecap="round"/>',
  weg: '<path d="M3 22 C14 22 20 8 37 6" fill="none" stroke="#B48A58" stroke-width="3" stroke-linecap="round"/>',
  fluss: '<path d="M3 8 C12 8 14 20 22 20 S32 10 37 12" fill="none" stroke="#3F78B6" stroke-width="4.5" stroke-linecap="round"/>',
  radieren: '<path d="M8 20 L20 8 L30 18 L22 24 H12 Z" fill="#F4C7C3" stroke="#B3261E"/><path d="M14 14 L24 22" stroke="#B3261E"/>',
  zeichen: '<path d="M12 25 V6" stroke="#3A3A36"/><rect x="12" y="4" width="18" height="12" fill="#80E0FF" stroke="#000"/><path d="M12 4 L30 16 M30 4 L12 16" stroke="#000"/>',
  pfeil_eigen: '<path d="M4 20 C14 20 20 12 28 10" fill="none" stroke="#1F5FBF" stroke-width="3.5" stroke-linecap="round"/><path d="M26 4 L36 9 L28 16 Z" fill="#1F5FBF"/>',
  pfeil_feind: '<path d="M4 20 C14 20 20 12 28 10" fill="none" stroke="#C62828" stroke-width="3.5" stroke-linecap="round"/><path d="M26 4 L36 9 L28 16 Z" fill="#C62828"/>',
  entfernen: '<path d="M12 6 L28 22 M28 6 L12 22" stroke="#B3261E" stroke-width="3" stroke-linecap="round"/>',
  beob: '<path d="M8 22 L38 4 M8 22 L38 24" stroke="#B3261E" stroke-dasharray="2 2"/><circle cx="8" cy="18" r="3" fill="#F1D3B0" stroke="#000"/><path d="M8 21 V26" stroke="#1F5FBF" stroke-width="3"/>',
  karte: '<path d="M3 6 L13 3 L27 7 L37 4 V22 L27 25 L13 21 L3 24 Z" fill="#F4F0E6" stroke="#58635B"/><path d="M8 18 C14 10 22 18 32 9" fill="none" stroke="#7A6440"/>'
};
function sbxIc(name) { return '<svg class="sk-ic" viewBox="0 0 40 27" aria-hidden="true" fill="none" stroke-width="1.6" stroke-linejoin="round">' + (SBX_BILD[name] || '') + '</svg>'; }
function sbxUntenZeigen() {
  var u = $('sbx-unten-karte');
  if (sbxWerkzeug) {
    var name = '', w = sbxWerkzeug;
    SBX_DOCK.forEach(function (g) { g[1].forEach(function (x) { if (x[0] === w) name = x[1]; }); });
    var h = '<div class="sk-v-kopf"><div><b>' + esc(name) + '</b><small>' + esc(SBX_HILFE[w] || '') + '</small></div><button type="button" class="sk-v-x" data-sbx-fertig aria-label="Werkzeug schließen">✕</button></div>';
    if (SBX_FORMEN[w] || w in SBX_MALEN) {
      h += '<div class="seg sbx-seg">' + ['klein', 'mittel', 'gross'].map(function (k) {
        return '<label><input type="radio" name="sbx-pinsel" value="' + k + '"' + (k === sbxPinsel ? ' checked' : '') + '><span>' + { klein: 'Klein', mittel: 'Mittel', gross: 'Groß' }[k] + '</span></label>';
      }).join('') + '</div>';
    }
    if (w === 'zeichen') h += sbxZeichenFach();
    if (w === 'beob' && sbxAkt.beob) h += '<div class="sk-v-knoepfe"><button type="button" class="sk-v-knopf" data-sbx-beob-weg>Sichtbereich ausblenden</button></div>';
    u.innerHTML = h; u.hidden = false; $('sbx-dock').hidden = true; $('sbx-fach').hidden = true;
    return;
  }
  u.hidden = true; $('sbx-dock').hidden = false;
  $('sbx-dock').innerHTML = SBX_DOCK.map(function (g, i) {
    return '<button type="button" class="sk-v-wahl" data-sbx-fach="' + i + '" aria-pressed="' + (sbxFach === i) + '">' + sbxIc(g[1][0][0]) + '<span>' + esc(g[0]) + '</span></button>';
  }).join('');
  var f = $('sbx-fach');
  if (sbxFach === null) { f.hidden = true; return; }
  f.hidden = false;
  f.innerHTML = SBX_DOCK[sbxFach][1].map(function (x) {
    return '<button type="button" class="sk-v-wahl" data-sbx-wz="' + x[0] + '">' + sbxIc(x[0]) + '<span>' + esc(x[1]) + '</span></button>';
  }).join('');
}
function sbxZeichenFach() {
  var liste = SBX_ZEICHEN.map(function (z) { return { name: z[0], sidc: '100' + (sbxFeind ? '6' : '3') + '1000' + z[1] + '0000', opt: {} }; });
  var meine = (FAV.zeichen || []).map(function (z) { return { name: z.name, sidc: z.sidc, opt: z.opt || {}, meine: true }; });
  var alle = liste.concat(meine);
  sbxT.zeichenListe = alle;
  var h = '<div class="seg sbx-seg"><label><input type="radio" name="sbx-feind" value="0"' + (sbxFeind ? '' : ' checked') + '><span>Eigene</span></label><label><input type="radio" name="sbx-feind" value="1"' + (sbxFeind ? ' checked' : '') + '><span>Feind</span></label></div>';
  h += '<div class="sk-v-fach sbx-zeichen-fach">' + alle.map(function (z, i) {
    var sel = sbxZeichenWahl && sbxZeichenWahl.sidc === z.sidc && JSON.stringify(sbxZeichenWahl.opt || {}) === JSON.stringify(z.opt);
    var bild = window.ms ? msSymbolAus({ sidc: z.sidc, opt: Object.assign({ standard: 'APP6' }, z.opt) }, 22).asSVG() : '';
    return '<button type="button" class="sk-v-wahl" data-sbx-z="' + i + '" aria-pressed="' + !!sel + '"><span class="sk-v-bild">' + bild + '</span><span>' + esc(z.name) + '</span></button>';
  }).join('') + (meine.length ? '' : '<p class="sk-v-fach-hinweis">Unter „Taktische Zeichen“ gespeicherte „Meine Zeichen“ erscheinen hier ebenfalls.</p>') + '</div>';
  return h;
}

/* ===== Ablage, Öffnen, Schließen ===== */
function sbxNeu(art) {
  var h = new Float32Array(SBX_P * SBX_P);
  // leicht unebener Sand
  for (var j = 0; j < SBX_P; j++) for (var i = 0; i < SBX_P; i++) h[sbxIdx(i, j)] = 10 + Math.sin(i * 0.11) * 0.3 + Math.cos(j * 0.09 + 1) * 0.3;
  var nr = SBX.liste.length + 1;
  var s = { id: 'sbx' + Date.now().toString(36), name: 'Sandkasten ' + nr, art: art, datum: new Date().toISOString(), linien: [], zeichen: [], beob: null, f: '' };
  s.h = sbxB64(sbxHoehenAlsDm(h));
  SBX.liste.unshift(s); sbxSpeichern();
  return s;
}
function sbxHoehenAlsDm(h) { var a = new Int16Array(h.length); for (var i = 0; i < h.length; i++) a[i] = Math.round(h[i] * 10); return a; }
function sbxSichern() {
  if (!sbxAkt) return;
  sbxAkt.h = sbxB64(sbxHoehenAlsDm(sbxH)); sbxAkt.f = sbxB64(sbxF); sbxAkt.datum = new Date().toISOString();
  if (!sbxSpeichern()) sbxMeldung('Speicher voll: Der Sandkasten konnte nicht gesichert werden.');
}
function sbxOeffnen(id) {
  var s = SBX.liste.filter(function (x) { return x.id === id; })[0]; if (!s) return;
  $('sbx-laden').hidden = false;
  Promise.all([ladeThree(), ladeMilsymbol().catch(function () {})]).then(function () {
    $('sbx-laden').hidden = true;
    sbxAkt = s; s.linien = s.linien || []; s.zeichen = s.zeichen || [];
    var dm = sbxAusB64(s.h, Int16Array, SBX_P * SBX_P); sbxH = new Float32Array(dm.length); for (var i = 0; i < dm.length; i++) sbxH[i] = dm[i] / 10;
    sbxF = sbxAusB64(s.f, Uint8Array, SBX_P * SBX_P);
    sbxVerlauf = []; $('sbx-zurueck').disabled = true;
    sbxWerkzeug = null; sbxFach = null;
    $('sbx-voll').hidden = false; document.documentElement.classList.add('sk-voll');
    $('sbx-titel').textContent = s.name + ' · 1 × 1 km';
    if (!sbxT) sbxSzeneBauen(); else sbxGroesse();
    sbxAnsichtZuruecksetzen(false);
    sbxAllesAktualisieren(); sbxUntenZeigen();
    if (location.hash !== '#sandkasten') history.replaceState(null, '', '#sandkasten');
    sbxMeldung('Ein Finger dreht, zwei Finger zoomen und verschieben.');
  }, function () {
    $('sbx-laden').hidden = true;
    $('sbx-meldung-ablage').textContent = '3D-Darstellung konnte nicht geladen werden. Bitte die Verbindung prüfen.';
  });
}
function sbxVorschaubild() {
  try {
    sbxKameraSetzen(); sbxT.renderer.render(sbxT.scene, sbxT.cam);
    var q = sbxT.renderer.domElement, c = document.createElement('canvas'), w = 240, h = Math.round(w * 0.62);
    c.width = w; c.height = h;
    var s = Math.max(w / q.width, h / q.height), sw = w / s, sh = h / s;
    c.getContext('2d').drawImage(q, (q.width - sw) / 2, (q.height - sh) / 2, sw, sh, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.72);
  } catch (e) { return ''; }
}
function sbxSchliessen() {
  if ($('sbx-voll').hidden) return;
  if (sbxAkt) { sbxStrich = null; sbxAkt.bild = sbxVorschaubild(); sbxSichern(); }
  $('sbx-voll').hidden = true; document.documentElement.classList.remove('sk-voll');
  sbxAkt = null; sbxSicht = null;
  sbxAblageZeigen();
}
function sbxDatum(iso) { try { return new Date(iso).toLocaleDateString('de-DE'); } catch (e) { return ''; } }
function sbxAblageZeigen() {
  $('sbx-ablage').hidden = false; $('sbx-arten').hidden = true;
  $('sbx-anz').textContent = SBX.liste.length ? '(' + SBX.liste.length + ')' : '';
  $('sbx-leer').hidden = SBX.liste.length > 0;
  $('sbx-liste').innerHTML = SBX.liste.map(function (s) {
    var n = (s.zeichen || []).length;
    return '<div class="sk-eintrag"><button type="button" class="sk-oeffnen" data-sbx-auf="' + s.id + '" aria-label="Sandkasten öffnen: ' + esc(s.name) + '">' +
      (s.bild ? '<img class="sk-mini sbx-mini" src="' + s.bild + '" alt="">' : '<span class="sk-mini sbx-mini sbx-mini-leer" aria-hidden="true"></span>') +
      '<span class="sk-eintrag-text"><b>' + esc(s.name) + '</b><small>' + esc(SBX_ARTEN[s.art] ? SBX_ARTEN[s.art].name : '') + ' · 1 × 1 km</small><small>' +
      esc(sbxDatum(s.datum)) + ' · ' + n + (n === 1 ? ' Zeichen' : ' Zeichen') + '</small></span></button>' +
      '<div class="sk-eintrag-knoepfe"><button type="button" class="knopf sekundaer" data-sbx-name="' + s.id + '">Umbenennen</button><button type="button" class="knopf sekundaer" data-sbx-weg="' + s.id + '">Löschen</button></div></div>';
  }).join('');
}
function sbxArtenZeigen() {
  $('sbx-ablage').hidden = true; $('sbx-arten').hidden = false;
  $('sbx-arten-liste').innerHTML = Object.keys(SBX_ARTEN).map(function (k) {
    var a = SBX_ARTEN[k];
    return '<button type="button" class="sk-art" data-sbx-art="' + k + '"' + (a.bald ? ' disabled' : '') + '>' + sbxIc(k === 'frei' ? 'huegel' : 'karte') + '<span><b>' + esc(a.name) + (a.bald ? ' <em>folgt</em>' : '') + '</b><small>' + esc(a.text) + '</small></span></button>';
  }).join('');
}
function zeigeSandkasten() { if ($('sbx-voll').hidden) sbxAblageZeigen(); }

$('sbx-neu').addEventListener('click', sbxArtenZeigen);
$('sbx-arten-zurueck').addEventListener('click', sbxAblageZeigen);
$('sbx-arten-liste').addEventListener('click', function (ev) {
  var b = ev.target.closest('button[data-sbx-art]'); if (!b || b.disabled) return;
  var s = sbxNeu(b.getAttribute('data-sbx-art')); sbxAblageZeigen(); sbxOeffnen(s.id);
});
$('sbx-liste').addEventListener('click', function (ev) {
  var b = ev.target.closest('button'); if (!b) return;
  if (b.hasAttribute('data-sbx-auf')) { sbxOeffnen(b.getAttribute('data-sbx-auf')); return; }
  var id = b.getAttribute('data-sbx-name') || b.getAttribute('data-sbx-weg'), s = SBX.liste.filter(function (x) { return x.id === id; })[0];
  if (!s) return;
  if (b.hasAttribute('data-sbx-name')) {
    inlineAbfrage(b.parentNode, { text: 'Neuer Name', wert: s.name, ok: 'Speichern', fertig: function (t) { t = (t || '').trim(); if (t) { s.name = t.slice(0, 40); sbxSpeichern(); } sbxAblageZeigen(); } });
  } else {
    inlineAbfrage(b.parentNode, { text: '„' + s.name + '“ wirklich löschen?', ok: 'Löschen', gefahr: true, fertig: function () { SBX.liste = SBX.liste.filter(function (x) { return x.id !== id; }); sbxSpeichern(); sbxAblageZeigen(); } });
  }
});
$('sbx-zu').addEventListener('click', function () { sbxSchliessen(); if (location.hash !== '#sandkasten') location.hash = '#sandkasten'; });
$('sbx-zurueck').addEventListener('click', sbxRueckgaengig);
$('sbx-ansicht').addEventListener('click', function () {
  var oben = sbxKam.phi > 0.3; sbxAnsichtZuruecksetzen(oben);
  sbxMeldung(oben ? 'Ansicht von oben' : 'Schräge Ansicht');
});
$('sbx-bild').addEventListener('click', function () {
  if (!sbxT) return;
  sbxKameraSetzen(); sbxT.renderer.render(sbxT.scene, sbxT.cam);
  sbxT.renderer.domElement.toBlob(function (blob) {
    if (!blob) return;
    var n = (sbxAkt ? sbxAkt.name : 'sandkasten').toLowerCase().replace(/[äöüß]/g, function (c) { return { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[c]; }).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    msLaden(blob, (n || 'sandkasten') + '.png');
    sbxMeldung('Bild gespeichert');
  }, 'image/png');
});
$('sbx-dock').addEventListener('click', function (ev) {
  var b = ev.target.closest('[data-sbx-fach]'); if (!b) return;
  var i = +b.getAttribute('data-sbx-fach'); sbxFach = sbxFach === i ? null : i; sbxUntenZeigen();
});
$('sbx-fach').addEventListener('click', function (ev) {
  var b = ev.target.closest('[data-sbx-wz]'); if (!b) return;
  sbxWerkzeug = b.getAttribute('data-sbx-wz');
  if (sbxWerkzeug === 'zeichen' && !sbxZeichenWahl) sbxZeichenWahl = null;
  sbxUntenZeigen();
});
$('sbx-unten-karte').addEventListener('click', function (ev) {
  if (ev.target.closest('[data-sbx-fertig]')) { sbxWerkzeug = null; sbxStrich = null; sbxUntenZeigen(); return; }
  if (ev.target.closest('[data-sbx-beob-weg]')) { sbxMerken(); sbxAkt.beob = null; sbxBeobAktualisieren(); sbxGelaendeAktualisieren(); sbxSichern(); sbxUntenZeigen(); return; }
  var z = ev.target.closest('[data-sbx-z]');
  if (z) { sbxZeichenWahl = sbxT.zeichenListe[+z.getAttribute('data-sbx-z')]; sbxUntenZeigen(); sbxMeldung('Jetzt auf den Sand tippen.'); }
});
$('sbx-unten-karte').addEventListener('change', function (ev) {
  if (ev.target.name === 'sbx-pinsel') sbxPinsel = ev.target.value;
  if (ev.target.name === 'sbx-feind') {
    sbxFeind = ev.target.value === '1';
    if (sbxZeichenWahl) { var c = sbxZeichenWahl.sidc; if (/[36]/.test(c.charAt(3))) sbxZeichenWahl = { name: sbxZeichenWahl.name, sidc: c.substr(0, 3) + (sbxFeind ? '6' : '3') + c.substr(4), opt: sbxZeichenWahl.opt }; }
    sbxUntenZeigen();
  }
});
// Seite verlassen: Sandkasten schließen und sichern
window.addEventListener('hashchange', function () { if (location.hash !== '#sandkasten') sbxSchliessen(); });
window.addEventListener('pagehide', function () { if (sbxAkt) sbxSichern(); });
if (aktuelleAnsicht === 'sandkasten') zeigeSandkasten();
