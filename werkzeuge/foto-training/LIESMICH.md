# Training der Fotoerkennung

Die Fotoerkennung auf der Seite „Taktische Zeichen“ nutzt ein kleines Erkennungsnetz (`vendor/foto-netz.js`). Es wurde ausschließlich mit künstlich erzeugten Zeichen trainiert, es gibt keine echten Fotos im Training.

## Ablauf

1. **Trainingsbilder erzeugen** (`gen.js`, braucht Node und Playwright): zeichnet Zeichen mit milsymbol, verändert sie wie eine Handzeichnung auf Papier (Strichstärke, Drehung, Scherung, Verbiegen, Schatten, Unschärfe, Flecken, Rauschen) und bereitet sie mit `js/foto-kern.js` genauso auf wie die Website. Beispiel: `node gen.js . 20000 1234 ./train1` erzeugt `train1.x` (Bilder 64 × 64) und `train1.y` (Rahmen, Symbol, Größe).
2. **Trainieren** (`train.py`, braucht TensorFlow): erwartet `train1` bis `train5`, `val` und `rau` im selben Ordner, trainiert und schreibt `foto-netz.js`, das nach `vendor/` kopiert wird.
3. **Prüfen** mit unabhängigen „Fotos“ (`fotos.js` erzeugt schräg fotografierte, mit einem Rauschfilter verbogene Zeichen auf Papier; `t61.js` lädt sie über die echte Seite hoch und vergleicht).

`klassen.json` enthält die 45 erkannten Landeinheiten (Code und deutscher Name), dazu kommt „ohne Symbol“ (000000). Neue Einträge müssen hier und in `js/12-symbole.js` (`MS_ARTEN`) stehen, danach neu erzeugen und trainieren.

## Stand

Auf 300 unabhängig erzeugten Test-Fotos: Rahmen 99,7 %, Symbol 99,7 % (unter den drei Vorschlägen 100 %), Größe 99,3 %. Echte Handzeichnungen von Menschen weichen stärker ab (andere Proportionen, Handschrift bei Buchstaben, Schraffuren), dort ist die Trefferquote voraussichtlich niedriger und nicht gemessen.
