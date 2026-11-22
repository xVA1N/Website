# MeinKamerad

Besoldungsrechner für Soldaten: vom Dienstgrad zum Bruttobetrag, mit Familienzuschlag, Stellenzulagen und Auslandsverwendungszuschlag. Nicht amtlich, ohne Gewähr.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `daten.js` | **Alle Beträge und Stand-Angaben.** Die Seite übernimmt sie automatisch an jeder Stelle. Nur diese Datei wird bei einer Besoldungsanpassung geändert. |
| `index.html` | Aufbau der Seite (Überschriften, Felder, Knöpfe). |
| `style.css` | Gestaltung: Farben, Abstände, Schrift, helles und dunkles Design. |
| `js/` | Die Logik, nach Bereichen aufgeteilt und in dieser Reihenfolge geladen: `01-grundlagen`, `02-dienstgrade`, `03-favoriten`, `04-vergleich`, `05-duz`, `06-rechner`, `07-ereignisse`, `08-urlaubskartei`, `09-profil`, `10-start`. |

Die Dateien brauchen keinen Build-Schritt. GitHub Pages veröffentlicht sie so, wie sie im Repository liegen.

## Werte ändern (zum Beispiel bei einer Besoldungsanpassung)

Nur `daten.js` bearbeiten, direkt auf GitHub im Browser:

1. Im Repository auf **`daten.js`** klicken.
2. Oben rechts auf das **Stift-Symbol** („Edit this file“) klicken.
3. Werte ändern, etwa `gueltigAb`, die Grundgehalt-Tabellen oder den Familienzuschlag.
4. **„Commit changes…“** klicken und bestätigen.

Fertig. Alle Stellen der Seite, an denen der Wert vorkommt, zeigen danach den neuen Wert.

Regeln:

- Beträge mit Punkt als Dezimalzeichen: `2706.99`, nicht `2.706,99`.
- Texte stehen in Anführungszeichen.
- Nach jedem Eintrag ein Komma, außer nach dem letzten in einer Liste.
- Besoldungsgruppen wie im Gesetz, Bereiche mit Bindestrich: `"A3-A5"`, `"A14, A15, B1"`.

Wenn danach in der Seite der Hinweis „Die Datei daten.js fehlt oder enthält einen Fehler“ erscheint, fehlt meist ein Komma oder ein Anführungszeichen.

Wenn die Zuordnung der Einsatzgebiete zu Stufen geprüft ist, `gebieteBeispiel: false` setzen. Dann verschwinden alle Beispiel-Hinweise auf der Seite.

## Text „Über MeinKamerad“

Auf der Seite Mehr steht oben das Feld „Über MeinKamerad“. Den Text trägst du in `daten.js` ganz oben bei `ueber` ein, zum Beispiel:

```js
ueber: "Erster Absatz.\n\nZweiter Absatz.",
```

`\n\n` beginnt einen neuen Absatz. Solange der Text leer ist, steht dort „Text folgt.“

## Eigene Infos zu Dienstgraden

Auf der Seite Dienstgrade klappt ein Dienstgrad beim Antippen auf. Unter „Weitere Infos“ erscheinen die Eckdaten und, falls vorhanden, ein eigener Text. Diesen Text trägst du in `daten.js` unter `dienstgradInfos` ein, zum Beispiel:

```js
dienstgradInfos: {
  hfw: "Häufig als Kompaniefeldwebel (Spieß) eingesetzt.",
},
```

Die Kürzel der Dienstgrade (hfw, ostgefr usw.) stehen als Liste direkt darüber in `daten.js`.

## Mein Profil

Unter „Mein Profil“ (Personen-Symbol oben rechts) trägt jeder Nutzer einmal Dienstgrad, Besoldungsgruppe, Stufe, Familie, Bundesland und Dienstzeiten ein. Rechner, DuZ-Rechner und Urlaubskartei übernehmen die Werte. Gespeichert wird nur im Browser, es gibt keinen Login und keinen Server. Mit „Daten sichern“ und „Daten laden“ lassen sich alle Einträge als Datei auf ein anderes Gerät übertragen.

## Urlaubskartei

Die Feiertage aller Bundesländer stehen in `daten.js` unter `urlaub.feiertage` als Regeln (festes Datum, Abstand zu Ostern oder Buß- und Bettag), sodass sie für jedes Jahr automatisch berechnet werden. Dort steht auch der vorgeschlagene Jahresanspruch (`standardAnspruch`). Die Übersicht führt vier Konten (Erholungsurlaub, Überstunden, ATB = Ausnahmetatbestand, Sonderurlaub), jeweils mit dem Anspruch dieses Jahres und dem Rest aus dem Vorjahr. Überstunden werden in Stunden geführt. Ein Tag Dienstzeitausgleich zieht die Stunden dieses Wochentags ab. Der Vorschlag für die Dienstzeiten (Beginn, Ende, Pause je Wochentag) steht in `daten.js` unter `urlaub.dienstzeiten`, jeder Nutzer kann ihn in der Urlaubskartei ändern. Eigene Markierungen (Name und Farbe, z. B. „Lehrgang“) legt jeder Nutzer in der Urlaubskartei über das Plus selbst an. Die Einträge der Nutzer werden nur in ihrem Browser gespeichert.

## Quellen

- Grundgehalt (Anlage IV), Familienzuschlag (Anlage V) und Stellenzulagen (Anlage IX) des Bundesbesoldungsgesetzes, gültig ab 1. März 2024, BGBl. 2023 I Nr. 414.
- Stellenzulage Combat Controller (Nr. 5b): BGBl. 2025 I Nr. 72.
- Stellenzulagen fliegerische Verwendung (Nr. 6), Prüfpersonal (Nr. 6a), maritimer Bereich (Nr. 9a), Feuerwehr (Nr. 10), Rettungsmediziner/Gebietsärzte (Nr. 11): Voraussetzungen aus Anlage I, Beträge aus Anlage IX, gültig ab 1. März 2024.
- Zulagen für Führungsfunktionen (Nr. 4 und 4a, Kompaniechef bis Kompaniefeldwebel): Anlage IX, gültig ab 1. März 2024, BGBl. 2023 I Nr. 414.
- Amtszulagen, Voraussetzungen der Zulagen und Regeln für ihr Zusammentreffen: Anlage I BBesG (Vorbemerkungen und Fußnoten), Stand 22. November 2026.
- Auslandsverwendungszuschlag: Tagessätze nach § 3 AuslVZV, gültig ab 6. März 2025, BGBl. 2025 I Nr. 78. Die Zuordnung der Einsatzgebiete zu Stufen ist ein Beispiel.
- Dienst zu ungünstigen Zeiten: §§ 3 bis 5 Erschwerniszulagenverordnung, Beträge gültig ab 1. März 2024, BGBl. 2023 I Nr. 414.
- Kindergeld: § 6 BKGG, gültig ab 1. Januar 2026, BGBl. 2024 I Nr. 449.
