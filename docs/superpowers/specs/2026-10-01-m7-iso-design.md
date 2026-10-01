# M7-ISO — Nachtrag zur M7-Spec: Isometrische Darstellung

Datum: 2026-10-01 · Paket M7-ISO · Status: **Gate Spec: Nacharbeit eingearbeitet** (Urteil L0 NACHARBEIT, Rulings R92, R93; Zweitprüfung `lead-qa`) · Prozessstufe voll ·
Autor `lead-art`

Grundlage:

- Nutzeranweisung 2026-10-01: „ich möchte isometrische Grafiken"
- Auslegung durch L0: Ruling **R91** (Darstellung wechselt auf Isometrie, im Render-Strang von M7)
- M7-Spec [`2026-09-30-m7-stimmung-design.md`](2026-09-30-m7-stimmung-design.md), Stand `7c504e9`
- ADR-003 (Top-down) wird abgelöst durch [ADR-012](../../adr/ADR-012-isometrische-darstellung.md)
- Technische Bestandsaufnahme von `art-rendering-engineer` (Sicht `lead-tech`, 2026-10-01; Formeln und
  Tiefenschlüssel per Skript gegengerechnet). Der Inhalt steht in den Abschnitten 3 bis 9. Die Gegenprüfung des
  Entwurfs (Urteil BEDENKEN, B1–B4 und H1–H7) ist eingearbeitet.

**Vorrang:** Dieser Nachtrag ändert die M7-Spec nur an den Stellen, die Abschnitt 13 aufzählt. Bei Widerspruch gilt
der Nachtrag. Alles andere gilt unverändert weiter, auch Kennzeichnung, Palette, Lesbarkeitsregeln und
Performance-Grenzen. Für „Setzung Spec" und „Änderung" gelten die Bedeutungen aus der M7-Spec.

## 1. Ziel und Verständnis

**Gesagt hat der Nutzer:** „ich möchte isometrische Grafiken". **Ausgelegt hat L0 (R91):** Das Spiel wechselt auf
die Rautenprojektion wie Anno 1602. Dazu gehören 2:1-Rautenkacheln, eine feste Blickrichtung ohne Drehen, Gebäude
mit sichtbarer Höhe und eine Tiefensortierung.

**Annahmen von `lead-art` in diesem Nachtrag:**

- Der Boden bleibt flach. Die Sim kennt keine Höhen, und M7 ändert `src/sim/` nicht.
- Höhe haben nur Objekte: Gebäude, Bäume, Schiff und Figuren.
- Die Spielregeln bleiben gleich, ebenso das Kachelraster der Sim und das Speicherformat.

**Spielerzweck:** Ich schaue schräg von oben auf meine Insel. Häuser stehen als kleine Körper mit Wänden und
Dächern auf dem Land, Bäume stehen aufrecht, das Schiff liegt vor dem Kontor. Ich erkenne weiter auf einen Blick,
was fehlt, was arbeitet und was stillsteht. Dafür sorgen die Signale über allem (M7-Spec 4.3).

**Erfolg:**

- Das erste isometrische Bild geht am Slice-Stopp mit Vorher/Nachher an den Nutzer (AK-ISO-18).
- Alle Bedienwege (Bauen, Weg ziehen, Auswählen, Abreissen, Kamera) funktionieren auf Rauten (AK-ISO-14).
- Die Lesbarkeit hält auch dann, wenn ein Gebäude hinter einem höheren steht (AK-ISO-15).

## 2. Betrachtete Ansätze

### 2.1 Projektion

| Ansatz                                              | Urteil                                                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **A. Echte Isometrie 2:1, feste Blickrichtung**     | **gewählt** (R91). Das ist der Kern des Anno-1602-Looks.                                                         |
| B. Schräg gezeichnete Sprites auf dem Quadratgitter | verworfen. Die Lage wirkt weiter wie Draufsicht; R91 nennt das ausdrücklich als die Auslegung, die es nicht ist. |
| C. Drehbare Kamera (4 Richtungen)                   | verworfen. R91 verlangt eine feste Richtung; Drehen vervierfacht Sprites und Tests (YAGNI).                      |

### 2.2 Boden (Terrain, Wasser, Küste)

| Ansatz                                                                                                                   | Urteil                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Bodentextur im Kachelraum, wie in R1a geplant, und je Frame mit der affinen Iso-Matrix gezeichnet („Bodenmatrix")** | **gewählt.** R1a bleibt fast unverändert: `terrainField`, Teil-Neuzeichnung und Rechenraster bleiben im Kachelraum. Die Textur ist durchgehend, deshalb gibt es keine Nähte an Rautenkanten. Der Speicher bleibt wie geplant. |
| B. Vorgerenderte Iso-Ebene in Bildpixeln                                                                                 | verworfen. Bei Faktor 1 sind es 4096 × 2048 = 32 MB, und die Hälfte ist leer. Faktor 2 (8192 × 4096) überschreitet die Canvas-Flächengrenze von Safari (≈ 16,7 Mio. Pixel). R1a müsste neu geschnitten werden.                |
| C. Rautenkacheln je Frame aus Kachel-Sprites (klassische Tile-Blits)                                                     | verworfen. Es gibt Nähte an den Rautenkanten. Die weiche Küste aus dem Feld `s` (M7-Spec 5.1) liesse sich nur über viele Übergangskacheln nachbauen.                                                                          |

### 2.3 Grafikquelle

| Ansatz                                                                       | Urteil                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Prozedurale Canvas-Sprites aus Iso-Primitiven (Quader, Dach, Stempel)** | **gewählt.** Palette, Signalabstände (AK-R1-03) und Kachelmassstab bleiben in einer Hand, der Stil passt zur übrigen prozeduralen Grafik. Kein Lizenzrisiko, kein Gewicht unter `public/`, Zustände (Stufe, Arbeit, Fenster) sind direkt zeichenbar.                                                      |
| B. Offen lizenziertes isometrisches Tileset (CC0)                            | jetzt nicht. Die Tür aus M7-Spec 2.3 bleibt offen, mit Massstab 64 × 32 statt 32 px. Erst nach einem Slice-Urteil, das bei einem Posten „überzeugt nicht" sagt, kommt ein Scouting mit Lizenzprüfung durch `art-license-checker`. Eine konkrete Quelle ist nicht benannt, deshalb ist auch keine geprüft. |

### 2.4 Gebäudeform

| Ansatz                                                                             | Urteil                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Echte Körper: Grundriss auf der Footprint-Raute, zwei sichtbare Wände, Dach** | **gewählt.** Das trägt den Anno-Look, Licht und Schatten fallen eindeutig. Mit einem gemeinsamen Primitiv `isoBox` (Wandhöhe, Dachform, Farben) entstehen alle 13 Typen aus Parametern und Zubehör. |
| B. Frontansicht als aufrechter Aufsteller auf der Raute                            | verworfen. Sie wirkt wie Pappfiguren und passt nicht zur Bodenperspektive.                                                                                                                          |

## 3. Entscheidungen der Detailfragen

| Nr.  | Frage                            | Entscheidung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Kennz.       |
| ---- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| D-01 | Rautengrösse                     | `ISO_W = 64`, `ISO_H = 32` Bildpixel bei Zoom 1. Die Fläche gleicht der heutigen Kachel (1024 px²), deshalb sind bei gleichem Zoom gleich viele Kacheln sichtbar. Bei 48 × 24 wäre ein Haus bei Zoom 0,5 nur 24 px breit, und der Blindtest AK-R2-02 wäre gefährdet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Setzung Spec |
| D-02 | Blickrichtung                    | Fest. Die Kachel (0, 0) liegt oben, die Kachelachse +x läuft nach rechts unten, +y nach links unten. Kein Drehen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | R91          |
| D-03 | Projektion und Umkehrung         | Rein in `src/render/iso.ts`: `project(fx, fy) = ((fx − fy)·32, (fx + fy)·16)`, `unproject(X, Y) = (X/64 + Y/32, Y/32 − X/64)`. `tileToScreen` liefert die **obere Ecke** der Raute, gerundet auf ganze Pixel. `screenToTile` ist `floor(unproject(…))`. Das ist halboffen: Ein Punkt auf einer Kante gehört zur Kachel mit dem grösseren Index. `screenToTileF` liefert die ungerundete Kachelposition (für D-13). Die Signaturen von `screenToTile` und `tileToScreen` bleiben.                                                                                                                                                                                                                                                                                                                                                                                                                                        | Setzung Spec |
| D-04 | Kamera-Grenzen                   | `cam.x/y` bleiben Weltpixel der Iso-Ebene. Begrenzt wird über den **Sichtmittelpunkt**: Er wird per `unproject` in Kachelkoordinaten auf `[0, W] × [0, H]` geklemmt und zurückprojiziert (`clampToMap`). Jede Kartenecke ist erreichbar. Ausserhalb der Kartenraute wird `waterDeep` gefüllt (offene See).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Setzung Spec |
| D-05 | Zoom                             | Stufenlos 0,5 bis 2 wie bisher, Zoom am Cursor über `zoomAt`. Dessen Signatur ändert sich **bewusst**: Die Kartengrösse geht als `map: { w, h }` in Kacheln hinein statt als Weltpixel, damit der Typ-Check jeden alten Aufrufer findet. Bei Zoom 0,5 ist die Insel (Kachelmitten im Radius ≤ 29,5 Kacheln, samt Kachelfläche ≤ 30,5 Kacheln, also ≤ 1381 × 691 px) auf 1920 × 1080 ganz sichtbar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | unverändert  |
| D-06 | Bodenebene                       | Ansatz 2.2 A. Die Textur aus R1a wird mit der Bodenmatrix `a = z·32/T, b = z·16/T, c = −a, d = b, e = −cam.x·z, f = −cam.y·z` gezeichnet (T = Texturpixel je Kachel, `TEX = 32` mal Auflösungsfaktor), per `ctx.transform` auf die bestehende DPR-Skalierung. Die Abbildung erhält Winkel und Seitenverhältnis der Kachelachsen nicht, ihr Flächenmassstab ist `z²·1024/T²`. Wasser, Schaum, Wellen und Wege zeichnen im Kachelraum unter derselben Matrix (Helfer `withGround(ctx, cam, fn)`).                                                                                                                                                                                                                                                                                                                                                                                                                         | Setzung Spec |
| D-07 | Auflösungsfaktor der Bodentextur | Bleibt wie M7-Spec 5.1: 2 bei `devicePixelRatio ≥ 1,5`, sonst 1. Kein Canvas über 16 777 216 Pixel (Safari-Grenze).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | unverändert  |
| D-08 | Bäume und Fels                   | **Bäume** wandern aus der Textur in den sortierten Objektdurchgang, als aufrechte, vorgerenderte Stempel (3–5 Kronen je Waldkachel, Varianten aus `hash2`). In der Textur blieben sie flache Ellipsen und würden von Gebäuden davor falsch überdeckt. Ein Stempel bleibt seitlich in der Spaltenbreite seiner Kachel; den weichen Waldrand (¼ Kachel, Regel 4.3.5) trägt der Waldboden in der Textur, nicht die Kronen. **Fels** bleibt flach in der Textur, mit Relief und Kanten, ohne Schlagschatten. Aufrechte Felsspitzen und Berge mit Höhe sind kein Teil von M7.                                                                                                                                                                                                                                                                                                                                                | Setzung Spec |
| D-09 | Zeichenreihenfolge               | Tiefenschlüssel `2x + w + 2y + h` (doppelte Summe des Footprint-Mittelpunkts), bei Gleichstand x, dann Id. Das ist korrekt für achsparallele Quadrate jeder Grösse. Heute gibt es nur 1 × 1 und 2 × 2. Punktobjekte (Figur, Baum, Schiff, Fischerboot) zählen als 1 × 1-Quadrat um ihren Mittelpunkt, auch an gebrochenen Positionen; der Schlüssel ist `2·cx + 2·cy`. Gecacht über `layoutKey` wird nur die Liste der festen Objekte (Gebäude, Baumstempel); Schiff, Figuren und Fischerboot werden je Frame einsortiert. Renderer und Picking nutzen dieselbe reine Funktion `sortedObjects(world, moving)`.                                                                                                                                                                                                                                                                                                          | Setzung Spec |
| D-10 | Ebenen je Frame                  | Neue Reihenfolge in Abschnitt 5 (ersetzt M7-Spec 4.3.1). Alle Schatten liegen in einem eigenen Durchgang **vor** den Objekten, sonst übermalt ein seitlicher Schatten die Fassade des Nachbarn.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Änderung     |
| D-11 | Licht und Schatten               | Das Licht kommt im **Bild** von links oben, im Kachelraum ist das die Richtung `(−3, −1)` normiert. Die linke Wand ist hell, die rechte im Schatten. Das ist eine Setzung für die Lesbarkeit, keine Folge des Vektors (physikalisch lägen beide sichtbaren Wände im Gegenlicht). Der Schatten fällt im Bild nach rechts unten, im Kachelraum Richtung `(+3, +1)`. Das gilt auch für das Relief von R1a, dessen Lichtvektor sich ändert.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Änderung     |
| D-12 | Höhenhülle                       | Ein Sprite ragt höchstens `H_MAX = 2·ISO_H` (64 px bei Zoom 1) über die obere Ecke seiner Footprint-Raute. Türme (Kapelle, Feuerwache) dürfen bis `H_TOWER = 3·ISO_H`. Seitlich bleibt jedes Sprite innerhalb der Rautenbreite seines Footprints, ein Punktobjekt innerhalb der Spaltenbreite einer Kachel (`ISO_W·z`). Was seitlich ragt (Flagge, Rauch), gehört in den Luftdurchgang.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Setzung Spec |
| D-13 | Bauvorschau und Footprint-Anker  | Der Cursor liegt über der Mitte des Footprints: `origin = floor(f − w/2 + 1/2)` je Achse (`footprintOrigin`). Für 1 × 1 ist das die Kachel unter dem Cursor. Bisher sass die obere linke Ecke am Cursor; die Spielanleitung im README führt D1 nach. Die Vorschau bleibt in der Signalebene: Rautenfläche, Umriss und halbtransparenter Geist des Gebäudes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Änderung     |
| D-14 | Picking                          | **Auswählen und Abreissen:** zuerst die exakte **Körperhülle** der Gebäude (`bodyHull`: konvexes Sechseck aus Footprint-Raute und derselben Raute um die Höhe nach oben versetzt), geprüft in umgekehrter Zeichenreihenfolge (`pickBuilding`), sonst die Bodenkachel. `pickBuilding` trifft nur Gebäude; Bäume, Schiff und Figuren sind nicht anklickbar. Das Bildrechteck `spriteBounds` dient nur für Culling und Effekte, nie fürs Picking (seine leeren Ecken liegen über Nachbarkacheln). Weil `bodyHull` konvex ist, trifft sie auch die schmalen leeren Zwickel neben einem Satteldach über der Kachel dahinter; das ist hingenommen. **Bauen und Weg ziehen:** immer die Bodenkachel (`screenToTile`). **Hover:** Die Bodenraute erscheint immer: ohne Treffer die Kachel unter dem Cursor, mit Treffer (Auswählen, Abreissen) die Footprint-Raute des getroffenen Gebäudes und zusätzlich dessen Körperumriss. | Setzung Spec |
| D-15 | Weg ziehen                       | Bleibt kachelweise. Ein waagerechter Zug im Bild ergibt eine Treppe aus x- und y-Schritten. Das ist für die Sim gültig. Eine Achssperre ist UI-Komfort und nicht Teil von M7.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | unverändert  |
| D-16 | Einzugsgebiet (Radius)           | Die Sim-Metrik ist ein euklidischer Kreis im Kachelraum. Sein exaktes Bild ist eine achsparallele Ellipse mit den Halbachsen `r·z·32·√2` und `r·z·16·√2`. Eine Rautenfläche wäre eine andere Metrik und ist deshalb verboten. Abdeckungs-Umrisse (`outlineSegments`) bleiben und werden über die Endpunkte projiziert.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Setzung Spec |
| D-17 | Signal-Striche                   | Umrisse, Auswahl und Hover werden **nicht** unter der Bodenmatrix gezogen (die Strichbreite würde verzerrt). Die Punkte werden projiziert und im Bildraum gezogen. Gleichartige Rauten liegen in **einem** Pfad, damit bei gebrochenem Zoom keine Nähte entstehen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Setzung Spec |
| D-18 | Schiff                           | Das Schiff ankert an der Rautenmitte und ist Teil des sortierten Durchgangs. `shipTile` wählt unter den Wasserfeldern am Kontor das mit dem **grössten x + y** (bei Gleichstand das kleinere x), also das vordere Feld. Bisher war es das erste, und das liegt in Iso hinter dem Kontor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Änderung     |
| D-19 | Figuren (R4)                     | `walkerAt` rechnet unverändert im Kachelraum. Die Figur wird projiziert, als Punktobjekt sortiert, ihr Schatten liegt im Schattendurchgang. Möwen, Rauch und Regen bilden den Luftdurchgang und werden nicht sortiert.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Setzung Spec |
| D-20 | Tönung, Wetter, Fensterlicht     | Tönung und Wetter liegen im Bildraum und bleiben unverändert (ein Multiply-Durchgang, AK-R1-05). Die Fensteranker liegen auf der linken und rechten Wand und werden relativ zu `spriteBounds` angegeben und liegen in `bodyHull`, nicht mehr zum Footprint. Der weiche Schein (M7-Spec 6.2, „0,6 Kachel Radius") ist ein Kreis im Bildraum mit Radius `0,6·ISO_H·z`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Änderung     |
| D-21 | Grafikquelle                     | Prozedural (2.3 A). Die Tür nach M7-Spec 2.3 bleibt, mit Massstab 64 × 32.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Änderung     |
| D-22 | Lange Gebäude                    | Gibt es nicht. Kommt später ein Footprint mit `w ≠ h`, reicht der Schlüssel aus D-09 nicht mehr, dann ist ein Vergleich über die trennende Achse nötig. Das steht in ADR-012.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Hinweis      |

## 4. Projektion und Kamera (R0-ISO)

Der Modulschnitt ist frei von Zyklen: `iso.ts` kennt keine Kamera, `camera.ts` importiert aus `iso.ts`, nie umgekehrt.

- **`src/render/iso.ts`** (rein, DOM-frei, ohne `Camera`):
  - Konstanten `ISO_W`, `ISO_H`, `H_MAX`, `H_TOWER` und `TEX = 32` (Texturpixel je Kachel bei Faktor 1, ersetzt
    `TILE` für `terrain.ts` und R1a);
  - `project`, `unproject` (Weltpixel der Iso-Ebene ↔ Kachelkoordinaten), `depthKey`, `footprintOrigin`,
    `radiusEllipse` (Halbachsen in Weltpixeln);
  - `sortedObjects(world, moving)` (Gebäude und Baumstempel, dazu die bewegten Objekte des Frames). Die Lage der
    Baumstempel leitet `iso.ts` selbst aus der Welt ab: Waldkachel, unbebaut, Variante aus `hash2`. `iso.ts` importiert
    weder `terrain.ts` noch `camera.ts`; sonst entstünde ein Zyklus bzw. eine DOM-Abhängigkeit;
  - `spriteBounds(def, b)` (Bildbox in Weltpixeln samt Höhe, für Culling und Effekte) und `bodyHull(def, b)`
    (Sechseck in Weltpixeln, fürs Picking), beide mit **Platzhalter-Höhen** je Kategorie; R1b und R2 ersetzen die
    Höhen durch die Silhouetten-Parameter, die Signaturen bleiben;
  - `pickBuilding(hulls, wx, wy)` in Weltpixeln über bereits sortierte Hüllen, nur Gebäude.
- **`src/render/camera.ts`** (alles, was eine Kamera braucht):
  - `Camera`, `createCamera`;
  - `screenToTile` und `tileToScreen` (Signaturen unverändert, rechnen isometrisch), neu `screenToTileF`
    (ungerundet), `screenToWorld` (für `pickBuilding`) und `tileCorners(cam, tx, ty)` (die vier gerundeten Ecken einer
    Raute, eine benannte Funktion für AK-ISO-03);
  - `clampToMap(cam, map, viewW, viewH)` mit `map = { w, h }` in Kacheln, `visibleTileRange(cam, view, map)`,
    `groundMatrix(cam, texPerTile)`;
  - `zoomAt(cam, f, sx, sy, view, map)`: Die Signatur ändert sich **bewusst**, damit der Typ-Check jeden alten
    Aufrufer findet (D-05);
  - neu `centerOn(cam, fx, fy, view, map)` zum Zentrieren auf einen Kachelpunkt (Kontor in `app.ts`).
  - `clampCamera` und `TILE` entfallen ohne Übergangs-Hülle.
- Die Aufrufer in `input.ts` und `app.ts` stellt R0-ISO selbst um (R92, Abschnitt 12), sonst wird `make check` nicht
  grün.
- **Culling:** `visibleTileRange`: Das Bildrechteck wird unten um `H_TOWER·z` px erweitert (hohe Sprites ragen von
  unterhalb ins Bild), seine vier Ecken werden zurückprojiziert, die Kachel-Box der Ecken wird auf die Karte
  geklemmt. Massgeblich ist AK-ISO-05. Die Box ist etwa doppelt so gross wie nötig; das ist unkritisch, die Karte hat
  höchstens 4096 Kacheln.
- **`viewStats` (R5):** Gezählt werden nur Kacheln, deren Mitte im Bild liegt. Die Box allein würde die Anteile
  verfälschen.

## 5. Ebenen je Frame (ersetzt M7-Spec 4.3.1)

1. Hintergrund `waterDeep` (Bildraum, ausserhalb der Kartenraute)
2. Bodentextur unter der Bodenmatrix (gecacht, M7-Spec 5.1)
3. Wasser dynamisch unter der Bodenmatrix: Wellen, Schaum, Kann Glitzern (5.2)
4. Wege unter der Bodenmatrix (5.4)
5. **Schatten:** alle Schatten von Gebäuden, Bäumen, Schiff und Figuren, ein Durchgang
6. **Sortierter Objektdurchgang** nach `depthKey`: Bäume, Gebäude, Schiff, Figuren. Arbeitszeichen liegen am Gebäude,
   Rauch nicht.
7. **Luft:** Betriebs- und Herdrauch, Feuer und Rauch, Dampf, Möwen
8. Kann: Wolkenschatten
9. Tönung: genau ein Multiply-Durchgang (unverändert)
10. Additiver Durchgang: Fensterlicht, Laternen, Feuerglühen (unverändert)
11. Regen und Sturmschlieren (unverändert)
12. Signale, ungetönt (unverändert): Platzierungsanzeige, Radius-Ellipse, Bedarfssymbole, Punkt „nicht angebunden",
    Warnring, Boom-Münze, Gelöscht-Haken, Auswahl, Hover

Die Signale liegen über allen Objekten. Ein Gebäude, das hinter einem höheren steht, bleibt so an seinen Signalen
und am Umriss bei Hover oder Auswahl erkennbar (AK-ISO-15).

## 6. Boden (R1a)

- Die Bodentextur, `coastField`, die Wasserfarbe nach Tiefe, Strand, Übergänge, Gras, das Relief und die
  Teil-Neuzeichnung bleiben, wie M7-Spec 5.1 sie beschreibt, im Kachelraum. Zwei Dinge ändern sich:
  - Der Lichtvektor des Reliefs ist `(−3, −1)` normiert (D-11).
  - Die Textur enthält **keine Baumkronen** mehr. Waldkacheln zeigen dort nur den Waldboden, die Bäume kommen als
    Stempel (D-08).
- **Baumstempel:** Je Waldkachel ohne Bebauung entsteht ein Stempel aus 3–5 aufrechten Kronen, jede mit Stamm,
  Krone `crown`, Lichtkappe `crownLight` links oben und Schatten im Schattendurchgang.
  - Die Lage der Kronen kommt aus `hash2`, wie in M7-Spec 5.1.
  - Die Stempel werden je Variante und Zoomstufe vorgerendert und per `drawImage` gezeichnet.
  - Kronen bleiben in der Spaltenbreite ihrer Kachel (D-12). Den weichen Waldrand bis ¼ Kachel (Regel 4.3.5) trägt
    der Waldboden in der Textur.
  - Nach einem Bau auf Waldkachel verschwindet der Stempel dieser Kachel, die Nachbarn bleiben (AK-R1-06 gilt
    unverändert).
- **Wasser (5.2):** Schaumlinie, Wellen und Sturmparameter zeichnen unter der Bodenmatrix. Sie folgen so der Küste
  ohne eigene Rautenlogik.
- **Wege (5.4, R2):** Die Erdpfade zeichnen unter der Bodenmatrix. Die Breiten 0,62 und 0,5 Kachel gelten im
  Kachelraum, und Q7 (lückenlose Nähte) bleibt.
- **Nur der sichtbare Teil:** Gezeichnet wird je Frame nur das Quell-Teilrechteck `visibleTileRange · T` der Textur,
  nie die ganze Textur.
- **Verzerrte Striche sind gewollt:** Strichbreiten unter der Bodenmatrix (Wellen, Schaum, Wegränder) werden
  richtungsabhängig verzerrt. Das ist erwünscht, weil sie auf dem Boden liegen. Signal-Striche zeichnen nie unter der
  Matrix (D-17).
- **Vorskalierte Kopie bei kleinem Zoom:** bleibt (M7-Spec 5.1). Die Schwelle legt der Plan nach Messung fest, der
  Standard ist Zoom ≤ 0,5.

## 7. Objekte (R1b, R2, R4)

### 7.1 Bildsprache der Gebäude (ersetzt M7-Spec 5.5, Absatz „Bildsprache")

- Jedes Gebäude ist ein Körper aus dem Primitiv `isoBox`:
  - Der **Grundriss** liegt auf der Footprint-Raute, je Seite höchstens 0,1 Kachel eingezogen. Er deckt damit
    ≥ 64 % der Raute; Hof und Zubehör füllen den Rest.
  - Die zwei sichtbaren **Wände** sind links hell und rechts im Schatten. Die Luma der linken Wand liegt ≥ 10 % über
    der rechten.
  - Das **Dach** hat eine Dachfamilie je Kategorie wie bisher. Die Firstlinie trennt die Lichtseite von der
    Schattenseite.
- Gebäude samt Hof (Zaun, Feld, Stapel, Stände) bedecken **≥ 80 % der Footprint-Raute** im Bild (AK-R1-09, neu
  gefasst).
- Die Höhenhülle folgt D-12. Richtwerte bei Zoom 1:
  - Pionierhütte etwa 0,8 · ISO_H, Siedlerhaus 1,2 · ISO_H, Bürgerhaus 1,6 · ISO_H (zwei Geschosse)
  - Betriebe 2 × 2 etwa 1,2 bis 1,6 · ISO_H
  - Türme bis 3 · ISO_H
- Die Silhouetten-Tabelle (Formen, Zubehör, Dachfamilien, Kategorie-Fallback, Feuerwache als `Partial`) gilt
  unverändert. Sie wird in Iso-Primitiven gezeichnet.
- **Aufteilung des Gebäude-Zeichnens** (Änderung gegenüber dem R1b-Zuschnitt „`drawBuilding` zeichnet Schatten und
  Silhouette"):
  - **Körper** (sortierter Durchgang): Silhouette mit Hof, Zubehör, Schafen (Kann) und Arbeitszeichen. Alles liegt in
    `bodyHull`. Die Hüllenhöhe schliesst First, Kamin und Glockenstuhl ein.
  - **Schatten** (Schattendurchgang): eigene Funktion.
  - **Luft** (Luftdurchgang): Betriebs- und Herdrauch sowie Kontor-Flagge, je eine eigene Funktion.
- **Fensteranker** (für 6.2) sind Rechtecke bzw. Parallelogramme auf der linken und rechten Wand, relativ zu
  `spriteBounds` (D-20).
- **Sprite-Cache:** Die M7-Spec 12.2 erlaubt ihn je `(defId, Stufe, Zoomstufe)`. Wegen der vielen Polygone empfiehlt
  `lead-art` den Cache; die Entscheidung bleibt beim Plan.
- **`spriteBounds(def, b)`** ist rein und liefert die Bildbox samt Höhe in Weltpixeln. Er dient für Culling, das
  `Rect` der Effekte aus R3 sowie die Lage von Bedarfssymbol und rotem Punkt (oben an der Box). Fürs Picking dient
  allein **`bodyHull(def, b)`** (D-14).

### 7.2 Schiff, Figuren, Leben

- Schiff nach D-18; die Rumpfrichtung zeigt im Bild nach links unten oder rechts unten, je nach Bewegungsrichtung im
  Kachelraum.
- Figuren nach D-19.
- Möwen, Herdrauch und Kann-Posten (Schafe, Fischerboot) bleiben wie in M7-Spec 5.6. Das Fischerboot ist ein
  Punktobjekt im sortierten Durchgang. Die Schafe liegen im Footprint der Schäferei und werden im Zeichenaufruf des
  Gebäudes gezeichnet, nicht als eigene sortierte Objekte (Plan-Thema, Abschnitt 16).

## 8. Signale, Overlays, Bauvorschau, Picking

- **Hervorhebung, Hover und Auswahl** sind Rauten im Bildraum (D-17). Die Auswahl umreisst die Footprint-Raute und
  zusätzlich die Körperhülle.
- **Hover-Schnitt zwischen R0-ISO und U0-ISO** (die Schnittstelle `Hover { x, y, tool, ok }` bleibt):
  - R0-ISO zeichnet bei den Werkzeugen Auswählen und Abreissen immer die Bodenraute auf `hover.x/y`. Steht dort ein
    Gebäude, zeichnet es zusätzlich dessen Footprint-Raute und Körperumriss.
  - U0-ISO setzt `hover.x/y` bei einem Treffer von `pickBuilding` auf die Ursprungskachel des getroffenen Gebäudes,
    sonst auf die Bodenkachel unter dem Cursor.
- Die **Radiusanzeige** ist eine Ellipse (D-16). Abdeckungs-Umrisse aus `overlays.ts` und M6-R2 werden über ihre
  Endpunkte projiziert. Die Cache-Logik bleibt unverändert.
- **Bedarfssymbol und roter Punkt** sitzen oben an `spriteBounds`, in der Signalebene.
- **Bauvorschau** nach D-13: Rautenfläche in der Signalfarbe (gültig bzw. ungültig), Umriss und halbtransparenter
  Geist.
- **Picking** nach D-14. `pickBuilding` bekommt die Körperhüllen der Gebäude aus `sortedObjects` und `bodyHull`, den
  Punkt über `screenToWorld`. Die Anbindung in der UI (`input.ts`, `app.ts`, auch der Touch-Pfad `downTile`) macht
  das Paket U0-ISO (Abschnitt 12).

## 9. Leistung, Speicher, Risiken der Technik

- Die Grenzen aus M7-Spec 12 gelten unverändert: Median ≥ 30 fps hart, Ziel 60, `renderMedian` ≤ 8 ms bei
  1280 × 800 und Zoom 1, Aufbau der Terrain-Ebene ≤ 1500 ms, Teil-Neuzeichnung ≤ 8 ms.
- **Neu im Frame:**
  - affines Zeichnen der Bodentextur;
  - Sortieren von etwa 300 Objekten (unter 0,1 ms, gecacht);
  - bis etwa 800 Baumstempel bei Zoom 0,5 per `drawImage`.
- **Messung im Slice (Slice-Messprofil, AK-ISO-17):** Die Perf-Sonde aus M7-U1 gibt es im Slice noch nicht, deshalb
  wird per CDP gemessen. Ein eingespieltes Zählskript misst die Abstände der `requestAnimationFrame`-Aufrufe, am
  Produktcode ändert sich nichts. Gemessen wird in sichtbarem Chrome, ohne Wetter und Feuer (die gibt es im Slice
  noch nicht), Ton aus. Das Profil:
  - `leistung-50`, 1920 × 1080, Zoom 0,5, auf den Kontor zentriert;
  - `galerie`, 1280 × 800, Zoom 1, auf den Kontor zentriert;
  - je 30 s Einlaufen, 10 s Zählen, 3 Läufe, Median der fps und P95 des Frame-Intervalls;
  - dazu als Ersatz für `renderMedian` der Median der Skriptdauer je Frame aus einem CDP-Trace
    (`devtools.timeline`). Das zeigt den Spielraum auch bei 60-Hz-Vsync.

  **Vorher-Messung** mit demselben Profil auf dem `main`-Stand vor R0-ISO (Abschnitt 14, AK-ISO-18). So werden die
  Mehrkosten des affinen Zeichnens sichtbar.

- **Firefox (R93):** Das Risiko ist hingenommen. Der Grenzwert gilt nur in Chrome; eine Firefox-Messung mit demselben
  Profil dient zur Orientierung, ohne Grenzwert.
- **Rückfälle bei zu langsamem Bodenzeichnen**, in dieser Reihenfolge. Keiner ändert eine Spec-Grenze:
  1. Die vorskalierte Kopie wird früher genutzt (Schwelle per Plan).
  2. Die Bodentextur kommt bei Zoom ≤ 0,75 auf Faktor 1.
  3. Liegt der Wert auch bei Faktor 1 unter 30 fps: vorgerenderte **Iso-Blöcke** aus 8 × 8 Kacheln (512 × 256 px,
     nur Faktor 1). Jeder Block ist ein volles Rechteck, aus dem Feld gerendert, die Ecken mit dem Inhalt der
     Nachbarn. Blöcke überlappen sich mit gleichem Inhalt, deshalb gibt es keine Nähte an Rautenkanten. Bei
     `leistung-50` und Zoom 0,5 ist die ganze Karte sichtbar, das sind 64 Blöcke und bis zu 32 MB. Die Obergrenze
     setzt der Plan als LRU-Grenze. Die Teil-Neuzeichnung zeichnet die betroffenen Blöcke neu.
- **Speicher:** Die Bodentextur bleibt wie M7-Spec 5.1 bei 16 bzw. 64 MB, dazu kommt die halbe Kopie. Die
  Baumstempel brauchen weniger als 2 MB. Kein Canvas ist grösser als 16 777 216 Pixel (AK-ISO-19).

## 10. Tests: was bleibt, was sich ändert

| Datei                                                                      | Folge                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/render/daynight.test.ts`                                            | bleibt (wird in R1b ohnehin nach M7-Spec 6.1 umgeschrieben)                                                                                                                                                                                                                                   |
| `tests/render/overlays.test.ts`                                            | bleibt (Cache-Logik und Segmente im Kachelraum)                                                                                                                                                                                                                                               |
| `tests/render/ship.test.ts`                                                | **Änderung (R92):** Die Datei hat zwei Fälle. „Ohne Auftrag kein Schiff" bleibt. „Erste Wasserkachel am Kontor" wird zu „vorderes Wasserfeld (grösstes x + y)" (D-18). Dazu kommt ein Fall mit eigens gebauter Welt und Gleichstand (AK-ISO-11). Einen Interpolationstest gibt es dort nicht. |
| `tests/render/camera.test.ts`                                              | **Änderung (R92, R93):** alle vier Tests, Zuordnung siehe unten                                                                                                                                                                                                                               |
| `tests/ui/input.test.ts`                                                   | `panDelta` bleibt. Neue Fälle für `footprintOrigin` stehen in `tests/render/iso.test.ts`.                                                                                                                                                                                                     |
| `tests/render/iso.test.ts` (neu)                                           | AK-ISO-01 bis -09, -21                                                                                                                                                                                                                                                                        |
| `terrainField`, `palette`, `life`, `weather`, `viewStats` (alle neu in M7) | rechnen im Kachelraum und bleiben projektionsfrei. Nur `viewStats` bekommt den Mittelpunkt-Fall (AK-ISO-12).                                                                                                                                                                                  |

**Zuordnung der Kameratests alt → neu (R93 Punkt 1).** Die alte Abdeckung bleibt erhalten:

| alter Test in `camera.test.ts`                        | neu                                                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| „round-trips tile <-> screen" (Kachel 10/7, Zoom 1,5) | AK-ISO-01: alle Kacheln, Zoomstufen wie unten, gebrochener Versatz                                                          |
| „clamps to world bounds"                              | AK-ISO-04: `clampToMap`, Mittelpunkt-Regel, Ecken, nicht quadratische Karte                                                 |
| „zoom stays within 0.5..2 and never NaN"              | AK-ISO-04: 20 × Zoom-in bis 2, 40 × Zoom-out bis 0,5, kein `NaN`                                                            |
| „AK-A1-05 ganze Pixel ohne Lücke oder Überlappung"    | AK-ISO-03: Zoomstufen 0,5 · 0,75 · 1,1 · 1,33 · 1,7 · 2, Versatz (13,7 / 5,3), n = 0 … 63, beide Achsen, über `tileCorners` |

Der Review prüft nach R92, dass sich nur diese Erwartungen ändern und nur aus Gründen der Projektion.

Die Test-Strategie der Projekt-CLAUDE.md gilt weiter (Vitest gegen reine Render-Mathematik). Sie kommt um „Projektion
und Tiefensortierung" dazu; das trägt D1 nach.

## 11. Abgrenzung — was bleibt wie geplant

- **Audio** (A1 bis A3), **Assets** (X1a, X1b), **UI-Anmutung** (M7-U2), **Einstellungen und Credits** (M7-U1):
  unverändert. `zn` aus M7-Spec 7.3 hängt nur am Zoom, und der Zoombereich bleibt.
- Palette, Signalfarben, Lesbarkeitsregeln 4.3.2 bis 4.3.5, Tageslicht, Wetter, Krisen-Effekte (Inhalt), Obergrenzen
  und Performance-Grenzen: unverändert.
- Die M6-Schnittstelle (M7-Spec 11.3) und `RenderFx` bleiben unverändert, bis auf das optionale Dev-Feld
  `RenderFx.raster` (Abschnitt 13, R94). `render(...)` behält seine Signatur.
- `src/sim/`, das Speicherformat und die Spielwerte: unverändert. Die Kamera wird nicht gespeichert, deshalb ist
  keine Migration nötig.
- M6-Sim und M8 sind nicht betroffen. M9 baut auf dem isometrischen Slice auf (R91).

## 12. Pakete, Auswirkungen auf die M7-Tasks, Slice-Stopp

**Neue Pakete:**

| Paket  | Inhalt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Strang                                                          | Dateien                                                                                                                                                                                                                                                                                                                                                                                             | hängt ab von                                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| R0-ISO | **Iso-Grundumbau** im heutigen Look, zwei Tasks in einem Paket. **Task 1:** die reine Mathematik aus Abschnitt 4 test-first, neben den alten Funktionen (`TILE` und `clampCamera` bleiben noch). **Task 2:** Umstellung. Boden (heutige Terrain-Ebene) als Quell-Teilrechteck unter der Bodenmatrix, `water.ts` unter der Bodenmatrix, Hover und Auswahl als Rauten mit Hover-Schnitt nach Abschnitt 8, Overlays projiziert mit Radius-Ellipse, Gebäude als Platzhalter-Körper (`isoBox` in den heutigen Kategoriefarben) nach `sortedObjects`, Schiff nach D-18, Rautenraster `?raster=1`. Dazu die UI-Aufrufer, danach Entfernen von `TILE` und `clampCamera`. Gemergt wird erst nach beiden Tasks. | Render, mit **Ownership-Ausnahme** nach R92 für die UI-Aufrufer | `iso.ts` (neu), `camera.ts`, `renderer.ts`, `water.ts`, `overlays.ts`, `ship.ts`, `sprites.ts` (nur Platzhalter), `terrain.ts` (nur Import `TILE` → `TEX`); `src/ui/input.ts` (Importzeile 3, Kamera-Aufrufe), `src/ui/app.ts` (Importzeile 10, Kamera-Aufrufe, Zentrieren über `centerOn`, Lesen von `?raster=1` im Dev-Build); `tests/render/iso.test.ts` (neu), `camera.test.ts`, `ship.test.ts` | Gate Spec; erstes Paket von M7 in Render und UI |
| U0-ISO | UI-Bedienung: Bau-Ursprung über `footprintOrigin` und `screenToTileF`; Auswählen, Abreissen und Hover über `pickBuilding` mit `bodyHull` (Hover-Schnitt nach Abschnitt 8); auch der Touch-Pfad (`downTile`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | UI (`tech-ui-engineer`)                                         | `input.ts`, `app.ts`; ggf. `tests/ui/input.test.ts`                                                                                                                                                                                                                                                                                                                                                 | R0-ISO auf `main`                               |

**Warum R0-ISO den Renderer gleich mit umstellt (Änderung):** Rechnet nur die Kamera isometrisch, zeichnet der
Renderer aber noch von oben, entsteht ein Mischbild. Dann ist der Baum zwischen den Paketen nicht spielbar, und die
Browser-Prüfung von R1a sähe falsche Bilder. Nach R0-ISO ist das Spiel dagegen vollständig isometrisch und bedienbar,
noch im alten Look (AK-ISO-20). R1a und R1b ändern danach nur noch das Aussehen.

**Warum R0-ISO UI-Dateien berührt (R92 Punkt 1):** `clampCamera` und `TILE` entfallen, und `zoomAt` ändert die
Signatur (D-05). Ohne die Aufrufer in `input.ts` und `app.ts` wird `make check` nicht grün. Geändert werden nur:

- die Importzeilen (`input.ts:3`, `app.ts:10`);
- die Kamera-Aufrufe (heute `input.ts` 66–74, 196–198, 296–298 und `app.ts` 150–151, 381, 388–390);
- das Lesen von `?raster=1` im Dev-Build. Das ist eine kleine Erweiterung der Ausnahme aus R92, bestätigt durch
  R94; der Renderer bekommt das Flag als optionales Feld `RenderFx.raster`.

Weil R0-ISO das erste Paket an diesen Dateien ist, gibt es keinen Konflikt.

**Merge-Punkt:** R0-ISO wird nach seiner Abnahme auf `main` gemergt. Erst danach starten U0-ISO, R1a und R5 auf
diesem Stand. Weitere Merges aus dem Render-Strang in den UI-Strang braucht der Slice nicht, denn `bodyHull` und
`spriteBounds` mit Platzhalter-Höhen liefert schon R0-ISO.

**UI-Strang:** U0-ISO steht am Anfang der seriellen Kette für `app.ts` und `input.ts`, vor M7-U1 und M6-U1. Ob M7-U2
parallel zu R0-ISO läuft und der UI-Strang vor U0-ISO `git merge main` macht, entscheidet L0 im Gate Plan (Abschnitt
16). Damit fällt die Setzung „Slice ohne `app.ts`" (Tech B3) für R0-ISO weg; R1a und R1b bleiben ohne `app.ts`.

**Ownership `renderer.ts`** (M7-Spec 13): Ändern dürfen ihn R0-ISO, R1, R3 und R4, in dieser Reihenfolge.

**Auswirkungen auf die bestehenden Tasks** (Schätzung des Mehraufwands aus der Bestandsaufnahme):

| Task  | Folge                                                                                                                                                                                                                                             | Mehraufwand |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| R1a   | angepasst, klein: Lichtvektor (D-11), keine Kronen in der Textur, Baumstempel (D-08), `water.ts` unter der Bodenmatrix                                                                                                                            | +15 %       |
| R1b   | angepasst, mittel bis gross: Ebenen nach Abschnitt 5 vollständig, Schattendurchgang, Primitiv `isoBox` ausgebaut, 3 Silhouetten in Iso, echte Höhen in `spriteBounds` und `bodyHull`. Projektion, Rauten, Ellipse und Schiff liefert schon R0-ISO | +35 %       |
| R2    | angepasst, mittel bis gross: 10 Silhouetten und Fallback in Iso, Fensteranker auf den Wänden, Erdwege unter der Bodenmatrix                                                                                                                       | +40 %       |
| R2-FW | angepasst: Feuerwache als Turmkörper (H_TOWER)                                                                                                                                                                                                    | +40 %       |
| M6-R2 | fast unverändert: `overlayPlan` bleibt, das Zeichnen projiziert die Endpunkte (macht R0-ISO für alle Umrisse)                                                                                                                                     | ±0          |
| R3    | angepasst, klein: Effekt-`Rect` aus `spriteBounds`, Sturmwasser unter der Bodenmatrix                                                                                                                                                             | +10 %       |
| R4    | angepasst, klein bis mittel: Figuren und Fischerboot im sortierten Durchgang, Schatten im Schattendurchgang, Fensterlicht an den Wand-Ankern, Leistungsmessung mit affinem Zeichnen                                                               | +15 %       |
| R5    | angepasst, klein: Mittelpunkt-Fall (AK-ISO-12); hängt jetzt an R0-ISO                                                                                                                                                                             | +10 %       |

Insgesamt kommen auf die bestehenden Render-Tasks etwa +25 % dazu, plus R0-ISO (2 Tasks in einem Paket) und U0-ISO
(≈ ¾ Task).

**Slice-Stopp (bleibt, mit erstem Iso-Bild; R93 Punkt 2):**

- Reihenfolge: R0-ISO (Merge auf `main`) → R1a ∥ U0-ISO ∥ R5 → R1b → QA des Slice.
- Danach fällt L0 das **Slice-Urteil** nach AK-R1-08 in der Fassung von AK-ISO-18.
- Die Vorher/Nachher-Bilder gehen dem Nutzer direkt zu, mit dem Hinweis, dass dies das erste isometrische Bild ist.
- R2, R3 und R4 starten erst nach dem Urteil von L0. Auf die Reaktion des Nutzers wird nicht gewartet (Verfassung
  §5). Kommt sie, hat sie Vorrang und kann R2 bis R4 stoppen.

## 13. Geänderte Stellen der M7-Spec, der M5-Spec und weiterer Dokumente

| Stelle M7-Spec                                                  | bisher                                                            | mit M7-ISO                                                                                                             |
| --------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 2.2 (Baum-Wiegen gestrichen)                                    | Begründung: Bäume in der gecachten Ebene                          | bleibt gestrichen (YAGNI); die Begründung entfällt, weil die Bäume jetzt Stempel sind                                  |
| 2.3 Tür für fremde Grafik                                       | Kachelmassstab 32 px                                              | Rautenmassstab 64 × 32 (D-21)                                                                                          |
| 3 Nicht in M7                                                   | „Keine Isometrie (ADR-003 bleibt)"                                | Isometrie nach diesem Nachtrag; ADR-003 ist ersetzt durch ADR-012                                                      |
| 4.3.1 Ebenenreihenfolge                                         | 10 Ebenen, Schatten mit Gebäuden                                  | 12 Ebenen nach Abschnitt 5                                                                                             |
| 4.4 I1 (Küste)                                                  | Übergang nicht auf der Kachelgrenze                               | nicht auf der Rautenkante, Fassung AK-ISO-18                                                                           |
| 4.4 I2 (Wasser)                                                 | Farbproben nach `s` je Kachel                                     | Farbproben an Rautenmitten bzw. im projizierten Schaumstreifen, Fassung AK-ISO-18                                      |
| 4.4 I3 (Schatten)                                               | Streifen rechts unterhalb                                         | gilt im Bild unverändert (Schatten nach rechts unten, D-11)                                                            |
| 4.4 I5 (Wald)                                                   | ≥ 3 Kronen je Waldkachel                                          | ≥ 3 aufrechte Kronen je Waldkachel (Stempel, D-08)                                                                     |
| 5.1 Wald, Relief                                                | Kronen in der Terrain-Ebene; Licht links oben im Kachelraum       | Kronen als Stempel (Abschnitt 6); Lichtvektor `(−3, −1)` im Kachelraum                                                 |
| 5.2, 5.4                                                        | Kachelraum                                                        | Kachelraum unter der Bodenmatrix (D-06)                                                                                |
| 5.5 Bildsprache                                                 | top-down mit angedeuteter Front, nach Unterkante sortiert         | Körper aus `isoBox`, nach `depthKey` sortiert (7.1, D-09)                                                              |
| 5.5 Fensteranker                                                | relativ zum Footprint                                             | auf den Wänden, relativ zu `spriteBounds` (D-20)                                                                       |
| 5.5 / R1b-Zuschnitt Gebäude-Zeichnen                            | `drawBuilding` zeichnet Schatten und Silhouette, Rauch am Gebäude | getrennt in Körper, Schatten, Luft (7.1); geprüft wird der Körper (AK-ISO-10)                                          |
| 6.3 Schatten                                                    | Versatz 0,12 Kachel nach rechts unten                             | im Bild nach rechts unten, im Kachelraum `(+3, +1)`, eigener Durchgang (D-10, D-11)                                    |
| 6.3 Schatten bei Felsen                                         | Felsen werfen Schatten                                            | entfällt; Fels ist flach in der Textur (D-08)                                                                          |
| 6.2 Schein der Fenster                                          | „0,6 Kachel Radius"                                               | Kreis im Bildraum mit Radius `0,6·ISO_H·z` (D-20)                                                                      |
| 7.2 `viewStats`                                                 | sichtbare Kacheln                                                 | Kacheln mit Mitte im Bild (Abschnitt 4)                                                                                |
| 11.1 `RenderFx`                                                 | ohne Raster                                                       | zusätzlich optional `raster?: boolean` (Dev-Build, R0-ISO)                                                             |
| 13 Pakete, R1 „Kein `app.ts`"                                   | Slice ohne UI-Änderung                                            | neu R0-ISO (mit UI-Aufrufern nach R92) und U0-ISO; der Slice braucht beide (Abschnitt 12)                              |
| 13 Parallelität                                                 | R5 sofort startbar                                                | R5 nach R0-ISO                                                                                                         |
| 13 Ownership `renderer.ts`                                      | R1, R3, R4                                                        | R0-ISO, R1, R3, R4                                                                                                     |
| 15 ADR-Liste                                                    | ADR-003 bleibt                                                    | ADR-012 ersetzt ADR-003                                                                                                |
| AK-R1-08                                                        | „dieselben Ausschnitte"                                           | Fassung AK-ISO-18                                                                                                      |
| AK-R1-09                                                        | ≥ 80 % des Footprints gefüllt, abgelesen mit Kachelraster         | ≥ 80 % der Pixel in der Maske der Footprint-Raute weichen um ΔE2000 > 10 vom Boden ohne Gebäude ab (Fassung AK-ISO-13) |
| AK-R2-03                                                        | Fensteranker im Footprint                                         | Fensteranker innerhalb von `bodyHull` und auf einer Wand                                                               |
| AK-R5-01                                                        | —                                                                 | ergänzt durch AK-ISO-12                                                                                                |
| M5-Spec AK-A1-04 (Schiffsplatz, `ship.test.ts`)                 | erstes Wasserfeld am Kontor                                       | vorderes Wasserfeld, AK-ISO-11 (bewusste Teständerung, **R92**)                                                        |
| M5-Spec AK-A1-05 und die übrigen drei Tests in `camera.test.ts` | Quadratgitter                                                     | Zuordnung alt → neu in Abschnitt 10 (bewusste Teständerung, **R92, R93**)                                              |
| README, Spielanleitung                                          | Gebäude hängt mit der oberen linken Ecke am Cursor; Draufsicht    | Cursor über der Footprint-Mitte (D-13); isometrische Ansicht; Nachtrag im Doku-Pass D1                                 |
| arc42 4, 9, 11; Projekt-CLAUDE.md Test-Strategie                | Top-down nach ADR-003                                             | Isometrie nach ADR-012; Tests für Projektion und Tiefensortierung; Nachtrag im Doku-Pass D1                            |

## 14. Abnahmekriterien

Für Browser-Checks gilt M7-Spec 14: Chrome per CDP, Screenshots unter `.studio/qa/M7-<Paket>/`, Szenario-Saves aus
M7-Spec 14.1. Pixelangaben sind CSS-Pixel bei `devicePixelRatio = 1`. Das **Rautenraster** (`?raster=1`, nur im
Dev-Build) liefert R0-ISO. Gemessen wird immer auf einem zweiten Screenshot ohne Raster.

**Neues Szenario `verdeckung`** (nur Testcode in `tests/sim/scenarios.ts`, kein `src/sim/`, angelegt in R1b): ein
Wohnhaus mit Bedarfssymbol und ein Betrieb mit rotem Punkt, jeweils direkt **hinter** einem höheren Gebäude, die
Bildspalten überlappen sich echt. Ab R2/R2-FW kommt ein Turm dazu.

**Zuordnung zu den Paketen:**

| Paket            | AK                                                                            |
| ---------------- | ----------------------------------------------------------------------------- |
| R0-ISO           | AK-ISO-01 bis -09, -11, -20, -21; AK-ISO-10 für Platzhalter-Körper und Schiff |
| R1a              | AK-ISO-19; AK-ISO-10 für Baumstempel                                          |
| R1b              | AK-ISO-13; AK-ISO-10 für die drei Slice-Typen                                 |
| U0-ISO           | AK-ISO-14                                                                     |
| R5               | AK-ISO-12                                                                     |
| Slice (nach R1b) | AK-ISO-15, -16, -17, -18                                                      |
| R2, R2-FW        | AK-ISO-10 für die übrigen Silhouetten; AK-ISO-15 und -16 noch einmal mit Turm |

### R0-ISO — Projektion, Kamera, Sortierung, Picking (Vitest, `tests/render/iso.test.ts`, `camera.test.ts`)

Zoomstufen sind immer 0,5 · 0,75 · 1 · 1,1 · 1,33 · 1,7 · 2. Die Kameraversätze sind (0, 0) und (13,7, 5,3).

- **AK-ISO-01** Rundreise: Für alle 64 × 64 Kacheln, alle Zoomstufen und beide Versätze liefert `screenToTile` am
  Bildpunkt der Rautenmitte (exakt projiziert und auf ganze Pixel gerundet) die Kachel zurück.
- **AK-ISO-02** Kanten, gegen das exakte `project`:
  - Ein Punkt 0,01 px unter dem exakten (ungerundeten) Bildpunkt der oberen Ecke von (x, y) gehört zu (x, y), ein
    Punkt 1 px darüber zu (x − 1, y − 1).
  - Bei Zoom 1 und 0,5 mit ganzzahliger Kamera wird jede Pixelmitte über 3 × 3 Kacheln geprüft, die mehr als 1 px
    von jeder gezeichneten Rautenkante entfernt ist. `screenToTile` liefert dort genau die Kachel, deren gezeichnete
    Raute (Polygon aus `tileCorners`) den Punkt enthält.
- **AK-ISO-03** Ganze Pixel, Nachfolger des M5-Tests AK-A1-05, über `tileCorners`, alle Zoomstufen, Versatz
  (13,7, 5,3), n = 0 … 63:
  - Alle Ecken sind ganzzahlig.
  - Schritt (n, 0) → (n + 1, 0): `dx ∈ {⌊32z⌋, ⌈32z⌉}`, `dy ∈ {⌊16z⌋, ⌈16z⌉}`.
  - Schritt (0, n) → (0, n + 1): `−dx ∈ {⌊32z⌋, ⌈32z⌉}`, `dy ∈ {⌊16z⌋, ⌈16z⌉}`.
  - Benachbarte Rauten teilen ihre Ecken pixelgleich.
- **AK-ISO-04** Kamera, auf Karten 64 × 64 und 48 × 64 (deckt vertauschte w/h auf):
  - Nach `clampToMap` liegt der Sichtmittelpunkt in `[0, w] × [0, h]` (Kachelraum), und jede der vier Kartenecken ist
    als Sichtmittelpunkt erreichbar.
  - `zoomAt` hält den Weltpunkt unter dem Cursor auf ±1 px, solange nicht geklemmt wird.
  - Nach 20 × Hineinzoomen ist der Zoom 2, nach 40 × Herauszoomen 0,5, und es entsteht nie `NaN`.
  - `centerOn` legt den Kachelpunkt auf ±1 px in die Bildmitte, solange nicht geklemmt wird.
- **AK-ISO-05** Culling, Brute force über alle Kacheln: für 3 Kameras (eine an einer Kartenecke, geklemmt) × Zoom
  0,5 · 1 · 2 × Karten 64 × 64 und 48 × 64. `visibleTileRange` enthält jede Kachel, deren Raute samt Höhenhülle
  `H_TOWER` den Sichtbereich schneidet, und liefert keinen Index ausserhalb der Karte.
- **AK-ISO-06** Tiefe: Geprüft werden alle Paare nicht überlappender Footprints in einem 8 × 8-Fenster, deren
  Bildspalten sich echt überlappen. Footprints sind 1 × 1, 2 × 2 sowie Punktobjekte als 1 × 1-Quadrat um ihren
  Mittelpunkt, mit Mittelpunkten im 0,25-Raster. Für jedes Paar zeichnet `depthKey` das hintere zuerst. Hinten heisst
  nach der Referenz der trennenden Achse: `A.x + A.w ≤ B.x` oder `A.y + A.h ≤ B.y`.
- **AK-ISO-07** Radius: `radiusEllipse` liefert die Halbachsen `r·32·√2` und `r·16·√2` Weltpixel (im Bild mal `z`).
  Für jede Kachel der Karte gilt: Ihre Mitte liegt in `tilesInRadius` (Sim-Metrik) genau dann, wenn die projizierte
  Mitte in der Ellipse liegt. Ausgenommen sind Kacheln, deren Abstand höchstens 1e-9 von `r` abweicht.
- **AK-ISO-08** Picking über `bodyHull` und `pickBuilding`:
  - Überdeckt die vordere Hülle die hintere, liefert der Überdeckungsbereich die vordere.
  - Ein Klick auf das Dach über der Kachel dahinter trifft das Gebäude.
  - **Negativfall:** Ein Punkt in `spriteBounds`, aber ausserhalb der Körperhülle, liefert `null`. Beispiel: die linke
    untere Ecke der Box über der vorderen linken Nachbarkachel, auf der ein Weg liegt.
  - **Negativfall:** Ein Punkt nur über einem Baumstempel, dem Schiff oder einer Figur liefert `null`.
  - Ein Punkt in keiner Hülle liefert `null`.
- **AK-ISO-09** Bau-Anker:
  - Für 1 × 1 gilt `footprintOrigin = screenToTile`.
  - Für 2 × 2 und jeden Cursorpunkt enthält der Footprint den Cursor, und der Cursor liegt je Achse höchstens ½
    Kachel von der Footprint-Mitte entfernt.
  - Am Kartenrand liefert `footprintOrigin` auch Ursprünge mit Teilen ausserhalb der Karte, ohne Fehler. Die
    Gültigkeit prüft wie bisher die Sim.
- **AK-ISO-11** Schiff (`ship.test.ts`):
  - Ohne Auftrag gibt es kein Schiff (unverändert).
  - In `createWorld(1)` liegt das Schiff auf dem Wasserfeld am Kontor mit dem grössten x + y.
  - Eine eigens gebaute Welt mit Gleichstand: ein 2 × 2-Kontor bei (kx, ky), Wasser nur auf (kx + 2, ky + 1) und
    (kx + 1, ky + 2). Das Ergebnis ist (kx + 1, ky + 2), also das kleinere x, und es ist deterministisch.
- **AK-ISO-21** Sortierung und Cache:
  - `sortedObjects` liefert für drei Permutationen derselben Gebäudeliste dieselbe Reihenfolge.
  - Nach einem Bau (Sim-Aktion) enthält die gecachte Liste das neue Gebäude.
  - Nach einem Abriss fehlt das abgerissene Gebäude, und `pickBuilding` liefert auf seiner früheren Hülle `null`
    bzw. das Gebäude dahinter.

### Weitere Vitest-Kriterien

- **AK-ISO-10** Formen (Fake-Kontext, der alle Pfadpunkte aufzeichnet: `moveTo`, `lineTo`, `rect`, `arc` ± Radius):
  - **Gebäude** (Platzhalter-Körper in R0-ISO, Slice-Typen in R1b, übrige und Fallback in R2):
    - Der Grundriss ist je Seite höchstens 0,1 Kachel eingezogen.
    - Die Höhe ist ≤ `H_MAX`, bei Türmen ≤ `H_TOWER` (an den Parametern von `isoBox`).
    - Geprüft wird nur der Körper-Aufruf (7.1), nicht Schatten und Luft. Jeder seiner Pfadpunkte liegt in `bodyHull`
      (Toleranz 0,5 px) und damit auch in `spriteBounds`. So trifft das Picking alles Sichtbare des Körpers, und auch
      Dachüberstände fallen auf.
  - **Baumstempel** (R1a) **und Schiff** (R0-ISO): Jeder Pfadpunkt liegt in `spriteBounds` und seitlich in der
    Spaltenbreite einer Kachel.
- **AK-ISO-12** `viewStats` (R5): Ein Ausschnitt, dessen Box eine Landkachel enthält, deren Mitte ausserhalb des
  Bildes liegt, zählt diese Kachel nicht. Die Anteile summieren sich weiter zu 1. Das ergänzt AK-R5-01.
- **AK-ISO-19** Speicher (R1a): Die reine Grössenfunktion `terrainLayerSize(world, scale)` liefert für Faktor 1 und 2
  sowie die halbe Kopie je Canvas höchstens 16 777 216 Pixel.

### Browser-Checks

- **AK-ISO-20** (R0-ISO, 1280 × 800, `galerie`) Das Spiel ist vollständig isometrisch, noch im alten Look:
  - Boden, Wasser, Wege, Platzhalter-Gebäude, Schiff, Overlays und Hover sind Rauten bzw. Körper. Details der
    verzerrten Bodentextur (flache Kronen, Bergdreiecke) zählen als Boden.
  - Bauen, Weg ziehen, Auswählen und Abreissen über die Bodenkachel sowie die Kamera funktionieren.
  - Bis U0-ISO gilt noch der alte Anker: Die Ursprungskachel liegt am Cursor.
  - Der Hover bei Auswählen und Abreissen zeigt den Gebäudeumriss nach Abschnitt 8.
  - `?raster=1` blendet das Rautenraster ein.
  - In der Konsole stehen keine Fehler.
- **AK-ISO-13** (R1b, 1280 × 800, `galerie`, Zoom 1, Tick 0, klares Wetter)
  - Mit Raster sind die Rauten 64 × 32 px gross, und die Blickrichtung entspricht D-02.
  - Wohnhaus, Kontor und Holzfäller stehen als Körper da.
  - Ohne Raster gilt `L_links ≥ 1,1 · L_rechts`, je als Luma-Mittel über 3 × 3 px in der Mitte der Wand.
  - Rechts unterhalb jedes Typs liegt ein Schattenstreifen, dessen Luma ≥ 15 % unter dem Gras daneben liegt (I3).
  - **AK-R1-09, neue Fassung:** In der Pixelmaske der Footprint-Raute (aus `project`) weichen ≥ 80 % der Pixel um
    ΔE2000 > 10 vom Boden ohne Gebäude ab. Die Referenz ist derselbe Ausschnitt aus dem Save ohne diese Gebäude
    (Testcode).
- **AK-ISO-14** (U0-ISO, 1280 × 800, Zoom 1 und 0,5) Bedienung:
  - Hover zeigt an 5 Stichproben je 2 px innerhalb einer Rautenkante die richtige Raute.
  - Ein 2 × 2-Bau setzt den Footprint so, dass der Cursor in seiner Raute liegt.
  - Ein Klick auf das Dach eines Gebäudes, das über die Kachel dahinter ragt, wählt das Gebäude aus. Abreissen
    funktioniert auf dieselbe Weise.
  - **Negativfall:** Mit Abreissen entfernt ein Klick in die leere Ecke der Bildbox eines Gebäudes über einem Weg auf
    der Nachbarkachel den Weg, nicht das Gebäude.
  - Hover über einem Gebäude zeigt dessen Footprint-Raute und Körperumriss, ohne Treffer die Bodenraute.
  - Weg ziehen legt einen durchgehenden Weg.
  - Die Kamera erreicht alle vier Kartenecken; ausserhalb der Kartenraute ist nur offene See.
  - Klick und Hover ausserhalb der Kartenraute bewirken nichts.
  - Zoom am Cursor: An 3 Stellen ist die Hover-Kachel vor und nach einem Zoomschritt dieselbe.
  - In der Konsole stehen keine Fehler.
- **AK-ISO-15** (Slice, 1280 × 800, `verdeckung`) Verdeckung:
  - Bedarfssymbol und roter Punkt der verdeckten Gebäude sind vollständig sichtbar.
  - Ihre Pixelwerte entsprechen dem Palettenwert ±2 je Kanal, also ungetönt.
  - Hover über die sichtbare Fläche des verdeckten Gebäudes zeigt seine vollständige Footprint-Raute und seinen
    Körperumriss.
- **AK-ISO-16** (Slice, 1280 × 800, `verdeckung` und `galerie`) Reihenfolge: `qa-playtester` prüft drei Stellen, die
  der Plan benennt:
  1. Das vordere Gebäude überdeckt das hintere, nie umgekehrt.
  2. Eine Baumreihe vor einem Gebäude überdeckt dessen Sockel, Bäume dahinter werden vom Gebäude überdeckt.
  3. Kein Schatten liegt auf einer Fassade.
- **AK-ISO-17** (Slice) Leistung nach dem Slice-Messprofil aus Abschnitt 9:
  - Gemeldet werden Vorher (`main`) und Nachher, je fps-Median, P95 des Frame-Intervalls und Median der
    Skriptdauer je Frame.
  - Liegt der Median in Chrome bei `leistung-50` unter 30 fps, ist das BEDENKEN mit den Rückfällen aus Abschnitt 9.
  - Firefox wird nur zur Orientierung gemeldet (R93).
  - Die harte Abnahme bleibt AK-R4-06.
- **AK-ISO-18** (**Slice-Urteil**, ersetzt die Ausschnittsdefinition von AK-R1-08) Vorher/Nachher:
  - **Vorher** wird neu aufgenommen, und zwar auf dem `main`-Stand an der Abzweigung von R0-ISO (`git merge-base`).
    Der Hash steht im QA-Bericht; beim Schreiben dieser Spec war `main` auf `23e742b`. Die alten `ist`-Bilder dienen
    nicht als Vorher-Bild, weil Fenstergrösse und Kamera abweichen.
  - Vorher und Nachher haben dasselbe Szenario, dieselbe Fenstergrösse, denselben Zoom und sind auf den Kontor
    zentriert (vorher über die Zentrierung beim Laden, nachher über `centerOn`).
  - Die Ausschnitte:
    - `galerie`, Zoom 1, 1280 × 800
    - `leistung-50`, Zoom 0,5, 1920 × 1080
    - `tag-3000`, Zoom 1, 1280 × 800
    - `galerie` bei Tick 2300, Zoom 1, 1280 × 800
  - Jedes Nachher-Bild entsteht zweimal: mit Raster für die Geometrie und ohne Raster für die Messung.
  - Die Prüfmerkmale aus M7-Spec 4.4 gelten in dieser Fassung (Farbnähe wie dort):
    - **I1:** Auf 10 zufällig gewählten Küstenkacheln liegt der Sand/Wasser-Übergang an ≥ 8 nicht auf der Rautenkante.
      Gemessen wird ein Abstand ≥ 2 px bei Zoom 1; die Kantenlage kommt aus `project`. Eine Grasfläche aus 4 × 4
      Kacheln zeigt ≥ 3 Farbwerte mit ΔE ≥ 3 untereinander.
    - **I2:** Die Rautenmitte von Wasserkacheln mit Landkontakt ist farbnah zu `waterShallow`, die von Wasserkacheln
      mit `−s ≥ 6` farbnah zu `waterDeep`. An ≥ 8 von 10 Küsten-Wasserkacheln gibt es Pixel farbnah zu `foam` im
      projizierten Streifen `−s < 0,15`.
    - I3 und I5 wie in AK-ISO-13 bzw. Abschnitt 13, I7 unverändert.
  - Das Urteil fällt L0 nach der QA (R93). Die Bilder gehen dem Nutzer direkt zu, mit dem Hinweis, dass dies das
    erste isometrische Bild ist.

## 15. Risiken und offene Punkte mit Empfehlung

1. **Auslegungsrisiko (R91):** Meinte der Nutzer nur schräg gezeichnete Sprites, ist der Nachtrag zu gross.
   _Regelung (R93):_ Der Nutzer bekommt die Slice-Bilder direkt. R2 bis R4 starten nach dem Urteil von L0, ohne auf
   den Nutzer zu warten. Seine Reaktion hat Vorrang und kann sie stoppen. Im schlimmsten Fall wird ein bereits
   gestarteter Render-Task verworfen.
2. **Leistung des affinen Zeichnens.** _Regelung:_ Messung im Slice (AK-ISO-17), drei Rückfälle nach Abschnitt 9.
   Das Firefox-Risiko ist nach R93 hingenommen; es gibt dort nur eine Orientierungsmessung.
3. **Verdeckung hinter hohen Gebäuden** erschwert Bauen und Auswählen. _Empfehlung:_ Signale und Umrisse in der
   Signalebene, Picking über die Körperhülle, Höhenhülle (D-12, D-14, AK-ISO-15). Durchsichtige Vordergebäude erst
   bei Bedarf nach dem Playtest (Eintrag in `docs/beobachtungen.md`).
4. **Treppen beim Weg ziehen** (D-15). _Empfehlung:_ So lassen. Fällt es im Playtest auf, kommt eine Achssperre als
   UI-Komfort, ausserhalb von M7.
5. **Ownership und Teständerungen:** geregelt durch R92 und R93. Die Ausnahme aus R92 umfasst auch das Lesen von
   `?raster=1` in `app.ts` (Abschnitt 12), bestätigt durch R94.
6. **Berge mit Höhe** gibt es nicht (D-08). Der Anno-Look kennt sie. _Empfehlung:_ Kandidat für M9 bzw. eine spätere
   Stimmungsrunde (Eintrag in `docs/beobachtungen.md`). Die Sim hat keine Höhe, und das soll so bleiben.

## 16. An den Plan (nicht in der Spec gelöst)

- **Zoom-Caches rastern** (QA 15): Sprite- und Baumstempel-Caches „je Zoomstufe" brauchen bei stufenlosem Zoom eine
  Rasterung, z. B. Stufen 0,5 · 0,75 · 1 · 1,5 · 2 mit Skalierung dazwischen. Dazu ein Vitest, der eine Obergrenze
  der Cache-Einträge prüft.
- **Schafe** (Tech B9, Kann-Posten): im Zeichenaufruf der Schäferei, nicht als eigene sortierte Objekte.
- **Schatten in einem Pfad** (Tech B10): Alle Schatten des Schattendurchgangs als ein Pfad mit einer Füllung, damit
  sich überlappende halbtransparente Schatten nicht doppelt abdunkeln.
- **M7-U2 parallel zu R0-ISO** (Tech B8): Der Vorschlag ist angenommen, L0 entscheidet im Gate Plan. Der UI-Strang macht
  nach dem Merge von R0-ISO und vor U0-ISO `git merge main`.
- **Benannte Prüfstellen** für AK-ISO-16 und die Lage der Gebäude im Szenario `verdeckung`.

## 17. Nacharbeit Gate Spec — geänderte Stellen (für die Zweitprüfung durch `lead-qa`)

| Auflage L0                                             | Stelle in diesem Nachtrag                                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 1 Picking über Körperhülle, Hover (QA 1, Tech B1)      | D-14, 4, 7.1, 8, AK-ISO-08, AK-ISO-14, AK-ISO-15                                                                               |
| 2 Slice-Messprofil, Teilrechteck, Rückfälle (QA 2, B6) | 6, 9, AK-ISO-17                                                                                                                |
| 3 Vorher-Bilder, I1/I2 auf Rautenkanten (QA 3)         | AK-ISO-18, 13 (I1, I2)                                                                                                         |
| 4 Dateiliste R0-ISO (B2)                               | 12                                                                                                                             |
| 5 Hover-Schnitt R0-ISO/U0-ISO (B3)                     | 8, 12, AK-ISO-20                                                                                                               |
| 6 Modulschnitt ohne Zyklus (B4)                        | 4                                                                                                                              |
| 7 `?raster=1` in R0-ISO (QA 5)                         | 12, 13 (11.1 `RenderFx`), 14 Vorspann, AK-ISO-20                                                                               |
| 8 AK-Schärfungen (QA 4, 6–14, B5, B11)                 | 10 (Zuordnung Kameratests), 14 (Szenario `verdeckung`, Paketzuordnung, AK-ISO-02 bis -05, -09 bis -11, -13, -14, -20, neu -21) |
| 9 Schätzung (B7)                                       | 12                                                                                                                             |
| R93 (Kameratests, Slice-Stopp, Firefox)                | 9, 10, 12 (Slice-Stopp), 15                                                                                                    |
| Plan-Themen (QA 15, B8, B9, B10)                       | 16                                                                                                                             |
| Zweite Gegenprüfung (B1–B3, H1–H3)                     | D-14, 4, 7.1, 9, 13, AK-ISO-02, AK-ISO-10, AK-ISO-17                                                                           |
