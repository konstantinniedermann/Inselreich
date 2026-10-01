# M7-ISO — Nachtrag zur M7-Spec: Isometrische Darstellung

Datum: 2026-10-01 · Paket M7-ISO · Status: **Entwurf für Gate Spec** (`lead-tech`, `lead-qa`) · Prozessstufe voll ·
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

| Nr.  | Frage                            | Entscheidung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Kennz.       |
| ---- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| D-01 | Rautengrösse                     | `ISO_W = 64`, `ISO_H = 32` Bildpixel bei Zoom 1. Die Fläche gleicht der heutigen Kachel (1024 px²), deshalb sind bei gleichem Zoom gleich viele Kacheln sichtbar. Bei 48 × 24 wäre ein Haus bei Zoom 0,5 nur 24 px breit, und der Blindtest AK-R2-02 wäre gefährdet.                                                                                                                                                                                                                                                                                                                                           | Setzung Spec |
| D-02 | Blickrichtung                    | Fest. Die Kachel (0, 0) liegt oben, die Kachelachse +x läuft nach rechts unten, +y nach links unten. Kein Drehen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | R91          |
| D-03 | Projektion und Umkehrung         | Rein in `src/render/iso.ts`: `project(fx, fy) = ((fx − fy)·32, (fx + fy)·16)`, `unproject(X, Y) = (X/64 + Y/32, Y/32 − X/64)`. `tileToScreen` liefert die **obere Ecke** der Raute, gerundet auf ganze Pixel. `screenToTile` ist `floor(unproject(…))`. Das ist halboffen: Ein Punkt auf einer Kante gehört zur Kachel mit dem grösseren Index. `screenToTileF` liefert die ungerundete Kachelposition (für D-13). Die Signaturen von `screenToTile` und `tileToScreen` bleiben.                                                                                                                               | Setzung Spec |
| D-04 | Kamera-Grenzen                   | `cam.x/y` bleiben Weltpixel der Iso-Ebene. Begrenzt wird über den **Sichtmittelpunkt**: Er wird per `unproject` in Kachelkoordinaten auf `[0, W] × [0, H]` geklemmt und zurückprojiziert (`clampToMap`). Jede Kartenecke ist erreichbar. Ausserhalb der Kartenraute wird `waterDeep` gefüllt (offene See).                                                                                                                                                                                                                                                                                                     | Setzung Spec |
| D-05 | Zoom                             | Stufenlos 0,5 bis 2 wie bisher, Zoom am Cursor über `zoomAt`. Dessen Signatur ändert sich **bewusst**: Die Kartengrösse geht als `map: { w, h }` in Kacheln hinein statt als Weltpixel, damit der Typ-Check jeden alten Aufrufer findet. Bei Zoom 0,5 ist die Insel (Kachelmitten im Radius ≤ 29,5 Kacheln, samt Kachelfläche ≤ 30,5 Kacheln, also ≤ 1381 × 691 px) auf 1920 × 1080 ganz sichtbar.                                                                                                                                                                                                             | unverändert  |
| D-06 | Bodenebene                       | Ansatz 2.2 A. Die Textur aus R1a wird mit der Bodenmatrix `a = z·32/T, b = z·16/T, c = −a, d = b, e = −cam.x·z, f = −cam.y·z` gezeichnet (T = Texturpixel je Kachel, `TEX = 32` mal Auflösungsfaktor), per `ctx.transform` auf die bestehende DPR-Skalierung. Die Abbildung erhält Winkel und Seitenverhältnis der Kachelachsen nicht, ihr Flächenmassstab ist `z²·1024/T²`. Wasser, Schaum, Wellen und Wege zeichnen im Kachelraum unter derselben Matrix (Helfer `withGround(ctx, cam, fn)`).                                                                                                                | Setzung Spec |
| D-07 | Auflösungsfaktor der Bodentextur | Bleibt wie M7-Spec 5.1: 2 bei `devicePixelRatio ≥ 1,5`, sonst 1. Kein Canvas über 16 777 216 Pixel (Safari-Grenze).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | unverändert  |
| D-08 | Bäume und Fels                   | **Bäume** wandern aus der Textur in den sortierten Objektdurchgang, als aufrechte, vorgerenderte Stempel (3–5 Kronen je Waldkachel, Varianten aus `hash2`). In der Textur blieben sie flache Ellipsen und würden von Gebäuden davor falsch überdeckt. Ein Stempel bleibt seitlich in der Spaltenbreite seiner Kachel; den weichen Waldrand (¼ Kachel, Regel 4.3.5) trägt der Waldboden in der Textur, nicht die Kronen. **Fels** bleibt flach in der Textur, mit Relief und Kanten, ohne Schlagschatten. Aufrechte Felsspitzen und Berge mit Höhe sind kein Teil von M7.                                       | Setzung Spec |
| D-09 | Zeichenreihenfolge               | Tiefenschlüssel `2x + w + 2y + h` (doppelte Summe des Footprint-Mittelpunkts), bei Gleichstand x, dann Id. Das ist korrekt für achsparallele Quadrate jeder Grösse. Heute gibt es nur 1 × 1 und 2 × 2. Punktobjekte (Figur, Baum, Schiff, Fischerboot) zählen als 1 × 1-Quadrat um ihren Mittelpunkt, auch an gebrochenen Positionen; der Schlüssel ist `2·cx + 2·cy`. Gecacht über `layoutKey` wird nur die Liste der festen Objekte (Gebäude, Baumstempel); Schiff, Figuren und Fischerboot werden je Frame einsortiert. Renderer und Picking nutzen dieselbe reine Funktion `sortedObjects(world, moving)`. | Setzung Spec |
| D-10 | Ebenen je Frame                  | Neue Reihenfolge in Abschnitt 5 (ersetzt M7-Spec 4.3.1). Alle Schatten liegen in einem eigenen Durchgang **vor** den Objekten, sonst übermalt ein seitlicher Schatten die Fassade des Nachbarn.                                                                                                                                                                                                                                                                                                                                                                                                                | Änderung     |
| D-11 | Licht und Schatten               | Das Licht kommt im **Bild** von links oben, im Kachelraum ist das die Richtung `(−3, −1)` normiert. Die linke Wand ist hell, die rechte im Schatten. Das ist eine Setzung für die Lesbarkeit, keine Folge des Vektors (physikalisch lägen beide sichtbaren Wände im Gegenlicht). Der Schatten fällt im Bild nach rechts unten, im Kachelraum Richtung `(+3, +1)`. Das gilt auch für das Relief von R1a, dessen Lichtvektor sich ändert.                                                                                                                                                                        | Änderung     |
| D-12 | Höhenhülle                       | Ein Sprite ragt höchstens `H_MAX = 2·ISO_H` (64 px bei Zoom 1) über die obere Ecke seiner Footprint-Raute. Türme (Kapelle, Feuerwache) dürfen bis `H_TOWER = 3·ISO_H`. Seitlich bleibt jedes Sprite innerhalb der Rautenbreite seines Footprints, ein Punktobjekt innerhalb der Spaltenbreite einer Kachel (`ISO_W·z`). Was seitlich ragt (Flagge, Rauch), gehört in den Luftdurchgang.                                                                                                                                                                                                                        | Setzung Spec |
| D-13 | Bauvorschau und Footprint-Anker  | Der Cursor liegt über der Mitte des Footprints: `origin = floor(f − w/2 + 1/2)` je Achse (`footprintOrigin`). Für 1 × 1 ist das die Kachel unter dem Cursor. Bisher sass die obere linke Ecke am Cursor; die Spielanleitung im README führt D1 nach. Die Vorschau bleibt in der Signalebene: Rautenfläche, Umriss und halbtransparenter Geist des Gebäudes.                                                                                                                                                                                                                                                    | Änderung     |
| D-14 | Picking                          | **Auswählen und Abreissen:** zuerst die Sprite-Hülle (`spriteBounds`), geprüft in umgekehrter Zeichenreihenfolge (`pickBuilding`), sonst die Bodenkachel. **Bauen und Weg ziehen:** immer die Bodenkachel (`screenToTile`).                                                                                                                                                                                                                                                                                                                                                                                    | Setzung Spec |
| D-15 | Weg ziehen                       | Bleibt kachelweise. Ein waagerechter Zug im Bild ergibt eine Treppe aus x- und y-Schritten. Das ist für die Sim gültig. Eine Achssperre ist UI-Komfort und nicht Teil von M7.                                                                                                                                                                                                                                                                                                                                                                                                                                  | unverändert  |
| D-16 | Einzugsgebiet (Radius)           | Die Sim-Metrik ist ein euklidischer Kreis im Kachelraum. Sein exaktes Bild ist eine achsparallele Ellipse mit den Halbachsen `r·z·32·√2` und `r·z·16·√2`. Eine Rautenfläche wäre eine andere Metrik und ist deshalb verboten. Abdeckungs-Umrisse (`outlineSegments`) bleiben und werden über die Endpunkte projiziert.                                                                                                                                                                                                                                                                                         | Setzung Spec |
| D-17 | Signal-Striche                   | Umrisse, Auswahl und Hover werden **nicht** unter der Bodenmatrix gezogen (die Strichbreite würde verzerrt). Die Punkte werden projiziert und im Bildraum gezogen. Gleichartige Rauten liegen in **einem** Pfad, damit bei gebrochenem Zoom keine Nähte entstehen.                                                                                                                                                                                                                                                                                                                                             | Setzung Spec |
| D-18 | Schiff                           | Das Schiff ankert an der Rautenmitte und ist Teil des sortierten Durchgangs. `shipTile` wählt unter den Wasserfeldern am Kontor das mit dem **grössten x + y** (bei Gleichstand das kleinere x), also das vordere Feld. Bisher war es das erste, und das liegt in Iso hinter dem Kontor.                                                                                                                                                                                                                                                                                                                       | Änderung     |
| D-19 | Figuren (R4)                     | `walkerAt` rechnet unverändert im Kachelraum. Die Figur wird projiziert, als Punktobjekt sortiert, ihr Schatten liegt im Schattendurchgang. Möwen, Rauch und Regen bilden den Luftdurchgang und werden nicht sortiert.                                                                                                                                                                                                                                                                                                                                                                                         | Setzung Spec |
| D-20 | Tönung, Wetter, Fensterlicht     | Tönung und Wetter liegen im Bildraum und bleiben unverändert (ein Multiply-Durchgang, AK-R1-05). Die Fensteranker liegen auf der linken und rechten Wand und werden relativ zur Sprite-Hülle angegeben, nicht mehr zum Footprint. Der weiche Schein (M7-Spec 6.2, „0,6 Kachel Radius") ist ein Kreis im Bildraum mit Radius `0,6·ISO_H·z`.                                                                                                                                                                                                                                                                     | Änderung     |
| D-21 | Grafikquelle                     | Prozedural (2.3 A). Die Tür nach M7-Spec 2.3 bleibt, mit Massstab 64 × 32.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Änderung     |
| D-22 | Lange Gebäude                    | Gibt es nicht. Kommt später ein Footprint mit `w ≠ h`, reicht der Schlüssel aus D-09 nicht mehr, dann ist ein Vergleich über die trennende Achse nötig. Das steht in ADR-012.                                                                                                                                                                                                                                                                                                                                                                                                                                  | Hinweis      |

## 4. Projektion und Kamera (R0-ISO)

- Das neue Modul `src/render/iso.ts` ist rein und DOM-frei. Es enthält:
  - die Konstanten `ISO_W`, `ISO_H`, `H_MAX`, `H_TOWER` und `TEX = 32` (Texturpixel je Kachel bei Faktor 1, ersetzt
    `TILE` für R1a);
  - die Funktionen `project`, `unproject`, `clampToMap`, `visibleTileRange`, `depthKey`, `footprintOrigin` und
    `radiusEllipse`;
  - `sortedObjects(world, moving)` und `spriteBounds(def, b, cam)` mit **Platzhalter-Höhen** je Kategorie; R1b und R2
    ersetzen die Höhen durch die Silhouetten-Parameter, die Signaturen bleiben;
  - die Matrix `groundMatrix(cam, texPerTile)`;
  - die Funktion `pickBuilding(items, sx, sy)`. Sie nimmt bereits sortierte Hüllen entgegen und kennt keine
    Silhouetten.
- `camera.ts` behält `Camera`, `createCamera`, `screenToTile` und `tileToScreen` mit unveränderten Signaturen; sie
  rechnen jetzt isometrisch. Neu ist `screenToTileF` (ungerundet). `zoomAt` nimmt `map: { w, h }` in Kacheln (D-05).
  `clampCamera` und `TILE` entfallen ohne Übergangs-Hülle.
- Die UI ruft künftig `clampToMap(cam, { w: world.width, h: world.height }, viewW, viewH)` mit Kachelmassen auf, nicht
  mehr `world.width · TILE`. Diese Aufrufer stellt R0-ISO selbst um (Abschnitt 12), sonst wird `make check` nicht
  grün.
- **Culling:** `visibleTileRange(cam, view)`: Das Bildrechteck wird unten um `H_TOWER·z` px erweitert (hohe Sprites
  ragen von unterhalb ins Bild), seine vier Ecken werden zurückprojiziert, die Kachel-Box der Ecken ist der Bereich.
  Massgeblich ist AK-ISO-05. Sie ist
  doppelt so gross wie nötig. Das ist unkritisch, die Karte hat höchstens 4096 Kacheln.
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
- **Fensteranker** (für 6.2) sind Rechtecke bzw. Parallelogramme auf der linken und rechten Wand, relativ zur
  Sprite-Hülle (D-20).
- **Sprite-Cache:** Die M7-Spec 12.2 erlaubt ihn je `(defId, Stufe, Zoomstufe)`. Wegen der vielen Polygone empfiehlt
  `lead-art` den Cache; die Entscheidung bleibt beim Plan.
- **`spriteBounds(def, b, cam)`** ist rein und liefert die Bildbox samt Höhe. Er dient für Culling, Picking, das
  `Rect` der Effekte aus R3 sowie die Lage von Bedarfssymbol und rotem Punkt (oben an der Hülle).

### 7.2 Schiff, Figuren, Leben

- Schiff nach D-18; die Rumpfrichtung zeigt im Bild nach links unten oder rechts unten, je nach Bewegungsrichtung im
  Kachelraum.
- Figuren nach D-19.
- Möwen, Herdrauch und Kann-Posten (Schafe, Fischerboot) bleiben wie in M7-Spec 5.6. Das Fischerboot ist ein
  Punktobjekt im sortierten Durchgang.

## 8. Signale, Overlays, Bauvorschau, Picking

- **Hervorhebung, Hover und Auswahl** sind Rauten im Bildraum (D-17). Die Auswahl umreisst die Footprint-Raute und
  zusätzlich die Sprite-Hülle.
- Die **Radiusanzeige** ist eine Ellipse (D-16). Abdeckungs-Umrisse aus `overlays.ts` und M6-R2 werden über ihre
  Endpunkte projiziert. Die Cache-Logik bleibt unverändert.
- **Bedarfssymbol und roter Punkt** sitzen oben an `spriteBounds`, in der Signalebene.
- **Bauvorschau** nach D-13: Rautenfläche in der Signalfarbe (gültig bzw. ungültig), Umriss und halbtransparenter
  Geist.
- **Picking** nach D-14. `pickBuilding` bekommt die Hüllen aus `sortedObjects` und `spriteBounds`. Die Anbindung in der
  UI (`input.ts`, `app.ts`) macht das neue Paket U0-ISO (Abschnitt 12).

## 9. Leistung, Speicher, Risiken der Technik

- Die Grenzen aus M7-Spec 12 gelten unverändert: Median ≥ 30 fps hart, Ziel 60, `renderMedian` ≤ 8 ms bei
  1280 × 800 und Zoom 1, Aufbau der Terrain-Ebene ≤ 1500 ms, Teil-Neuzeichnung ≤ 8 ms.
- **Neu im Frame:**
  - affines Zeichnen der Bodentextur;
  - Sortieren von etwa 300 Objekten (unter 0,1 ms, gecacht);
  - bis etwa 800 Baumstempel bei Zoom 0,5 per `drawImage`.
- **Messung im Slice:** `renderMedian` und fps bei `leistung-50` werden schon im Slice gemessen und gemeldet
  (AK-ISO-17). So zeigt sich ein Problem vor R2 bis R4.
- **Rückfall bei zu langsamem affinem Zeichnen** (z. B. Firefox ohne GPU-Canvas): Die vorskalierte Kopie wird früher
  genutzt (Schwelle per Plan). Bleibt es zu langsam, kommt die Bodentextur bei Zoom ≤ 0,75 auf Faktor 1. Beides
  ändert keine Spec-Grenze.
- **Speicher:** Die Bodentextur bleibt wie M7-Spec 5.1 bei 16 bzw. 64 MB, dazu kommt die halbe Kopie. Die
  Baumstempel brauchen weniger als 2 MB. Kein Canvas ist grösser als 16 777 216 Pixel (AK-ISO-19).

## 10. Tests: was bleibt, was sich ändert

| Datei                                                                      | Folge                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/render/daynight.test.ts`                                            | bleibt (wird in R1b ohnehin nach M7-Spec 6.1 umgeschrieben)                                                                                                                                                                  |
| `tests/render/overlays.test.ts`                                            | bleibt (Cache-Logik und Segmente im Kachelraum)                                                                                                                                                                              |
| `tests/render/ship.test.ts`                                                | **Änderung:** Der Fall „erstes Wasserfeld" wird zu „vorderes Wasserfeld (grösstes x + y)" (D-18, AK-ISO-11). Die Interpolation bleibt.                                                                                       |
| `tests/render/camera.test.ts`                                              | **Änderung:** Rundreise auf die Rautenmitte. Begrenzung nach der Mittelpunkt-Regel (D-04). Der M5-Schritttest (n, n) → (n+1, n+1) wird zu (n, 0) → (n+1, 0) mit `dx ∈ {⌊32z⌋, ⌈32z⌉}` und `dy ∈ {⌊16z⌋, ⌈16z⌉}` (AK-ISO-03). |
| `tests/ui/input.test.ts`                                                   | `panDelta` bleibt. Neue Fälle für `footprintOrigin` stehen in `tests/render/iso.test.ts`.                                                                                                                                    |
| `tests/render/iso.test.ts` (neu)                                           | AK-ISO-01 bis -09                                                                                                                                                                                                            |
| `terrainField`, `palette`, `life`, `weather`, `viewStats` (alle neu in M7) | rechnen im Kachelraum und bleiben projektionsfrei. Nur `viewStats` bekommt den Mittelpunkt-Fall (AK-ISO-12).                                                                                                                 |

Die Test-Strategie der Projekt-CLAUDE.md gilt weiter (Vitest gegen reine Render-Mathematik). Sie kommt um „Projektion
und Tiefensortierung" dazu; das trägt D1 nach.

## 11. Abgrenzung — was bleibt wie geplant

- **Audio** (A1 bis A3), **Assets** (X1a, X1b), **UI-Anmutung** (M7-U2), **Einstellungen und Credits** (M7-U1):
  unverändert. `zn` aus M7-Spec 7.3 hängt nur am Zoom, und der Zoombereich bleibt.
- Palette, Signalfarben, Lesbarkeitsregeln 4.3.2 bis 4.3.5, Tageslicht, Wetter, Krisen-Effekte (Inhalt), Obergrenzen
  und Performance-Grenzen: unverändert.
- Die M6-Schnittstelle (M7-Spec 11.3) und `RenderFx` bleiben unverändert. `render(...)` behält seine Signatur.
- `src/sim/`, das Speicherformat und die Spielwerte: unverändert. Die Kamera wird nicht gespeichert, deshalb ist
  keine Migration nötig.
- M6-Sim und M8 sind nicht betroffen. M9 baut auf dem isometrischen Slice auf (R91).

## 12. Pakete, Auswirkungen auf die M7-Tasks, Slice-Stopp

**Neue Pakete:**

| Paket  | Inhalt                                                                                                                                                                                                                                                                                                                                                                                                                                          | Strang                                                                         | Dateien                                                                                                                                                                                                                                       | hängt ab von                                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| R0-ISO | **Iso-Grundumbau** im heutigen Look: `iso.ts` nach Abschnitt 4. Renderer: Boden (heutige Terrain-Ebene) unter der Bodenmatrix, `water.ts` unter der Bodenmatrix, Hover und Auswahl als Rauten, Overlays projiziert mit Radius-Ellipse, Gebäude als Platzhalter-Körper (`isoBox` in den heutigen Kategoriefarben) nach `sortedObjects`, Schiff nach D-18. Dazu die Aufrufer von `clampToMap`, `zoomAt` und Zentrieren in `input.ts` und `app.ts` | Render, mit **Ownership-Ausnahme** für die Aufrufer in `input.ts` und `app.ts` | `iso.ts` (neu), `camera.ts`, `renderer.ts`, `water.ts`, `overlays.ts`, `ship.ts`, `sprites.ts` (nur Platzhalter); `src/ui/input.ts`, `src/ui/app.ts` (nur Kamera-Aufrufe); `tests/render/iso.test.ts` (neu), `camera.test.ts`, `ship.test.ts` | Gate Spec; erstes Paket von M7 in Render und UI |
| U0-ISO | UI-Bedienung: Bau-Ursprung über `footprintOrigin` und `screenToTileF`, Auswählen und Abreissen über `pickBuilding` mit `sortedObjects` und `spriteBounds`                                                                                                                                                                                                                                                                                       | UI (`tech-ui-engineer`)                                                        | `input.ts`, `app.ts`; ggf. `tests/ui/input.test.ts`                                                                                                                                                                                           | R0-ISO auf `main`                               |

**Warum R0-ISO den Renderer gleich mit umstellt (Änderung):** Rechnet nur die Kamera isometrisch, zeichnet der
Renderer aber noch von oben, entsteht ein Mischbild. Dann ist der Baum zwischen den Paketen nicht spielbar, und die
Browser-Prüfung von R1a sähe falsche Bilder. Nach R0-ISO ist das Spiel dagegen vollständig isometrisch und bedienbar,
noch im alten Look (AK-ISO-20). R1a und R1b ändern danach nur noch das Aussehen.

**Warum R0-ISO zwei UI-Dateien berührt (Ownership-Ausnahme, Ruling L0 nötig):** `clampCamera` und `TILE` entfallen, und
`zoomAt` ändert die Signatur (D-05). Ohne die Aufrufer in `input.ts` und `app.ts` wird `make check` nicht grün.
Geändert werden nur diese Aufrufe (heute `input.ts` 66–74, 196–198, 296–298 und `app.ts` 150–151, 381, 388–390). Weil
R0-ISO das erste Paket ist und noch kein UI-Paket an diesen Dateien arbeitet, gibt es keinen Konflikt.

**Merge-Punkt:** R0-ISO wird nach seiner Abnahme auf `main` gemergt. Erst danach starten U0-ISO, R1a und R5 auf
diesem Stand. Weitere Merges aus dem Render-Strang in den UI-Strang braucht der Slice nicht, denn `spriteBounds` mit
Platzhalter-Höhen liefert schon R0-ISO.

**UI-Strang:** U0-ISO steht am Anfang der seriellen Kette für `app.ts` und `input.ts`, vor M7-U1 und M6-U1. Mit
M7-U2 teilt es keine Datei, beide laufen parallel. Damit fällt die Setzung „Slice ohne `app.ts`" (Tech B3) für R0-ISO
weg; R1a und R1b bleiben ohne `app.ts`.

**Ownership `renderer.ts`** (M7-Spec 13): Ändern dürfen ihn R0-ISO, R1, R3 und R4, in dieser Reihenfolge.

**Auswirkungen auf die bestehenden Tasks** (Schätzung des Mehraufwands aus der Bestandsaufnahme):

| Task  | Folge                                                                                                                                                                                                                              | Mehraufwand |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| R1a   | angepasst, klein: Lichtvektor (D-11), keine Kronen in der Textur, Baumstempel (D-08), `water.ts` unter der Bodenmatrix                                                                                                             | +15 %       |
| R1b   | angepasst, mittel bis gross: Ebenen nach Abschnitt 5 vollständig, Schattendurchgang, Primitiv `isoBox` ausgebaut, 3 Silhouetten in Iso, echte Höhen in `spriteBounds`. Projektion, Rauten, Ellipse und Schiff liefert schon R0-ISO | +35 %       |
| R2    | angepasst, mittel bis gross: 10 Silhouetten und Fallback in Iso, Fensteranker auf den Wänden, Erdwege unter der Bodenmatrix                                                                                                        | +40 %       |
| R2-FW | angepasst: Feuerwache als Turmkörper (H_TOWER)                                                                                                                                                                                     | +40 %       |
| M6-R2 | fast unverändert: `overlayPlan` bleibt, das Zeichnen projiziert die Endpunkte (macht R0-ISO für alle Umrisse)                                                                                                                      | ±0          |
| R3    | angepasst, klein: Effekt-`Rect` aus `spriteBounds`, Sturmwasser unter der Bodenmatrix                                                                                                                                              | +10 %       |
| R4    | angepasst, klein bis mittel: Figuren und Fischerboot im sortierten Durchgang, Schatten im Schattendurchgang, Fensterlicht an den Wand-Ankern, Leistungsmessung mit affinem Zeichnen                                                | +15 %       |
| R5    | angepasst, klein: Mittelpunkt-Fall (AK-ISO-12); hängt jetzt an R0-ISO                                                                                                                                                              | +10 %       |

Insgesamt kommen auf die bestehenden Render-Tasks etwa +25 % dazu, plus R0-ISO (≈ 1½ Tasks) und U0-ISO (≈ ½ Task).

**Slice-Stopp (bleibt, mit erstem Iso-Bild):** Die Reihenfolge ist R0-ISO (Merge auf `main`) → R1a ∥ U0-ISO ∥ R5 →
R1b → **Slice-Urteil** nach AK-R1-08 in der Fassung von AK-ISO-18. Die Vorher/Nachher-Bilder gehen an den
Nutzer. Erst danach starten R2, R3 und R4.

## 13. Geänderte Stellen der M7-Spec, der M5-Spec und weiterer Dokumente

| Stelle M7-Spec                                   | bisher                                                         | mit M7-ISO                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 2.2 (Baum-Wiegen gestrichen)                     | Begründung: Bäume in der gecachten Ebene                       | bleibt gestrichen (YAGNI); die Begründung entfällt, weil die Bäume jetzt Stempel sind       |
| 2.3 Tür für fremde Grafik                        | Kachelmassstab 32 px                                           | Rautenmassstab 64 × 32 (D-21)                                                               |
| 3 Nicht in M7                                    | „Keine Isometrie (ADR-003 bleibt)"                             | Isometrie nach diesem Nachtrag; ADR-003 ist ersetzt durch ADR-012                           |
| 4.3.1 Ebenenreihenfolge                          | 10 Ebenen, Schatten mit Gebäuden                               | 12 Ebenen nach Abschnitt 5                                                                  |
| 4.4 I3 (Schatten)                                | Streifen rechts unterhalb                                      | gilt im Bild unverändert (Schatten nach rechts unten, D-11)                                 |
| 4.4 I5 (Wald)                                    | ≥ 3 Kronen je Waldkachel                                       | ≥ 3 aufrechte Kronen je Waldkachel (Stempel, D-08)                                          |
| 5.1 Wald, Relief                                 | Kronen in der Terrain-Ebene; Licht links oben im Kachelraum    | Kronen als Stempel (Abschnitt 6); Lichtvektor `(−3, −1)` im Kachelraum                      |
| 5.2, 5.4                                         | Kachelraum                                                     | Kachelraum unter der Bodenmatrix (D-06)                                                     |
| 5.5 Bildsprache                                  | top-down mit angedeuteter Front, nach Unterkante sortiert      | Körper aus `isoBox`, nach `depthKey` sortiert (7.1, D-09)                                   |
| 5.5 Fensteranker                                 | relativ zum Footprint                                          | auf den Wänden, relativ zur Sprite-Hülle (D-20)                                             |
| 6.3 Schatten                                     | Versatz 0,12 Kachel nach rechts unten                          | im Bild nach rechts unten, im Kachelraum `(+3, +1)`, eigener Durchgang (D-10, D-11)         |
| 6.3 Schatten bei Felsen                          | Felsen werfen Schatten                                         | entfällt; Fels ist flach in der Textur (D-08)                                               |
| 6.2 Schein der Fenster                           | „0,6 Kachel Radius"                                            | Kreis im Bildraum mit Radius `0,6·ISO_H·z` (D-20)                                           |
| 7.2 `viewStats`                                  | sichtbare Kacheln                                              | Kacheln mit Mitte im Bild (Abschnitt 4)                                                     |
| 13 Pakete, R1 „Kein `app.ts`"                    | Slice ohne UI-Änderung                                         | neu R0-ISO und U0-ISO; der Slice braucht U0-ISO (Abschnitt 12)                              |
| 13 Parallelität                                  | R5 sofort startbar                                             | R5 nach R0-ISO                                                                              |
| 13 Ownership `renderer.ts`                       | R1, R3, R4                                                     | R0-ISO, R1, R3, R4                                                                          |
| 15 ADR-Liste                                     | ADR-003 bleibt                                                 | ADR-012 ersetzt ADR-003                                                                     |
| AK-R1-08                                         | „dieselben Ausschnitte"                                        | Fassung AK-ISO-18                                                                           |
| AK-R1-09                                         | ≥ 80 % des Footprints gefüllt, mit Kachelraster                | ≥ 80 % der Footprint-Raute, mit Rautenraster                                                |
| AK-R2-03                                         | Fensteranker im Footprint                                      | Fensteranker innerhalb der Sprite-Hülle und auf einer Wand                                  |
| AK-R5-01                                         | —                                                              | ergänzt durch AK-ISO-12                                                                     |
| M5-Spec AK-A1-04 (Schiffsplatz, `ship.test.ts`)  | erstes Wasserfeld am Kontor                                    | vorderes Wasserfeld, AK-ISO-11 (**bewusste Teständerung, Ruling L0 nötig**)                 |
| M5-Spec AK-A1-05 (Schritttest, `camera.test.ts`) | Schritt (n, n) → (n+1, n+1)                                    | Schritt (n, 0) → (n+1, 0), AK-ISO-03 (**bewusste Teständerung, Ruling L0 nötig**)           |
| README, Spielanleitung                           | Gebäude hängt mit der oberen linken Ecke am Cursor; Draufsicht | Cursor über der Footprint-Mitte (D-13); isometrische Ansicht; Nachtrag im Doku-Pass D1      |
| arc42 4, 9, 11; Projekt-CLAUDE.md Test-Strategie | Top-down nach ADR-003                                          | Isometrie nach ADR-012; Tests für Projektion und Tiefensortierung; Nachtrag im Doku-Pass D1 |

## 14. Abnahmekriterien

Für Browser-Checks gilt dasselbe wie in M7-Spec 14: Chrome per CDP bei 1280 × 800 und 1920 × 1080, Screenshots
unter `.studio/qa/M7-<Paket>/`, Szenario-Saves aus M7-Spec 14.1. Der Dev-Build darf ein **Rautenraster** einblenden
(`?raster=1`, wie die übrigen Dev-Parameter nur mit `import.meta.env.DEV`).

### R0-ISO — Projektion (Vitest, `tests/render/iso.test.ts`)

- **AK-ISO-01** Rundreise: Für alle 64 × 64 Kacheln, die Zoomstufen 0,5 · 0,75 · 1 · 1,25 · 1,5 · 1,75 · 2 und zwei
  Kameraversätze gilt `screenToTile(tileToScreen(Rautenmitte)) = Kachel`.
- **AK-ISO-02** Kanten: Die obere Ecke von (x, y) gehört zu (x, y), ein Pixel darüber zu (x − 1, y − 1). Jeder
  Bildpunkt in der Kartenraute gehört zu genau einer Kachel (Abtastung in 0,25-px-Schritten über 3 × 3 Kacheln).
- **AK-ISO-03** Ganze Pixel: Für den Schritt (n, 0) → (n + 1, 0) gilt `dx ∈ {⌊32z⌋, ⌈32z⌉}` und
  `dy ∈ {⌊16z⌋, ⌈16z⌉}`. Benachbarte Rauten teilen ihre gerundeten Ecken. Das ersetzt den M5-Schritttest in
  `camera.test.ts`.
- **AK-ISO-04** Kamera: Nach `clampToMap` liegt der Sichtmittelpunkt in `[0, W] × [0, H]` (Kachelraum). Jede der vier
  Kartenecken ist als Sichtmittelpunkt erreichbar. `zoomAt` hält den Weltpunkt unter dem Cursor auf ±1 px, solange
  nicht geklemmt wird. Bei Zoom 0,5 und 2 entsteht kein `NaN`. Der Zoom bleibt in `[0,5, 2]`.
- **AK-ISO-05** Culling: Für 3 Kameras × 3 Zoomstufen enthält `visibleTileRange` jede Kachel, deren Raute samt
  Höhenhülle `H_TOWER` den Sichtbereich schneidet (Brute force über alle Kacheln).
- **AK-ISO-06** Tiefe: Geprüft werden alle Paare nicht überlappender Footprints in einem 8 × 8-Fenster, deren
  Bildspalten sich echt überlappen. Die Footprints sind 1 × 1, 2 × 2 sowie Punktobjekte als 1 × 1-Quadrat um ihren
  Mittelpunkt, mit Mittelpunkten im 0,25-Raster. Für jedes Paar zeichnet `depthKey` das hintere zuerst. Hinten heisst nach der
  Referenz der trennenden Achse: `A.x + A.w ≤ B.x` oder `A.y + A.h ≤ B.y`.
- **AK-ISO-07** Radius: `radiusEllipse` liefert die Halbachsen `r·z·32·√2` und `r·z·16·√2`. Für jede Kachel der Karte
  gilt: Ihre Mitte liegt in `tilesInRadius` (Sim-Metrik) genau dann, wenn die projizierte Mitte in der Ellipse liegt
  (ausgenommen Kacheln, deren Abstand höchstens 1e-9 von `r` abweicht).
- **AK-ISO-08** Picking: Bei zwei Hüllen, deren vordere die hintere überdeckt, liefert `pickBuilding` im
  Überdeckungsbereich die vordere. Ein Punkt in keiner Hülle liefert `null`. Bei einem Fake-Gebäude mit Höhe trifft ein
  Klick auf das Dach über der Kachel dahinter das Gebäude.
- **AK-ISO-09** Bau-Anker: Für 1 × 1 gilt `footprintOrigin = screenToTile`. Für 2 × 2 und jeden Cursorpunkt enthält der
  Footprint den Cursor, und der Cursor liegt je Achse höchstens ½ Kachel von der Footprint-Mitte entfernt.
- **AK-ISO-20** (Browser, 1280, `galerie`, nach R0-ISO) Das Spiel ist vollständig isometrisch, noch im alten Look:
  - Boden, Wasser, Wege, Platzhalter-Gebäude, Schiff, Overlays und Hover sind Rauten bzw. Körper. Kein Element ist
    noch top-down gezeichnet.
  - Bauen, Weg ziehen, Auswählen über die Bodenkachel und die Kamera funktionieren.
  - In der Konsole stehen keine Fehler.

### R1a, R1b, R4, R5 — Darstellung (Vitest)

- **AK-ISO-10** Silhouetten (R1b für die 3 Slice-Typen, R2 für den Rest): Für jede Silhouette, auch den Fallback,
  gilt: Der Grundriss ist je Seite höchstens 0,1 Kachel eingezogen, und die Höhe ist ≤ `H_MAX` bzw. ≤ `H_TOWER` bei Türmen (beides an den
  Parametern von `isoBox`). Ein Fake-Kontext zeichnet alle Pfadpunkte auf (`moveTo`, `lineTo`, `rect`, `arc` ± Radius).
  Jeder Punkt liegt in `spriteBounds` und seitlich in der Spaltenbreite der Footprint-Raute; so fallen auch
  Dachüberstände auf.
- **AK-ISO-11** Schiff: `shipTile` wählt unter den Wasserfeldern am Kontor das mit dem grössten x + y, bei Gleichstand
  das kleinere x. Das Ergebnis ist deterministisch. Ohne Wasserfeld bleibt das M5-Verhalten.
- **AK-ISO-12** `viewStats`: Ein Ausschnitt, dessen Box eine Landkachel enthält, deren Mitte ausserhalb des Bildes
  liegt, zählt diese Kachel nicht. Die Anteile summieren sich weiter zu 1. Das ergänzt AK-R5-01.
- **AK-ISO-19** Speicher: Die reine Grössenfunktion der Terrain-Ebenen (`terrainLayerSize(world, scale)`) liefert für
  Faktor 1 und 2 sowie die halbe Kopie je Canvas höchstens 16 777 216 Pixel.

### Browser-Checks

- **AK-ISO-13** (1280, `galerie`, Zoom 1, `?raster=1`) Die Rauten sind 64 × 32 px gross, und die Blickrichtung
  entspricht D-02. Wohnhaus, Kontor und Holzfäller stehen als Körper da. Die Luma der linken Wand liegt ≥ 10 % über
  der rechten, und der Schatten liegt rechts unterhalb (I3 nach Abschnitt 13).
- **AK-ISO-14** (1280, nach U0-ISO) Bedienung:
  - Hover zeigt an 5 Stichproben nahe den Rautenkanten die exakte Raute unter dem Cursor.
  - Ein 2 × 2-Bau setzt den Footprint so, dass der Cursor in seiner Raute liegt.
  - Ein Klick auf das Dach eines Gebäudes, das über die Kachel dahinter ragt, wählt das Gebäude aus. Abreissen
    funktioniert auf dieselbe Weise.
  - Weg ziehen legt einen durchgehenden Weg.
  - Die Kamera erreicht alle vier Kartenecken, und ausserhalb der Kartenraute ist nur offene See zu sehen.
  - Zoom am Cursor hält den Punkt unter dem Cursor.
  - In der Konsole stehen keine Fehler.
- **AK-ISO-15** (1280, `bedarf` und `galerie`) Verdeckung: Ein Wohnhaus mit Bedarfssymbol bzw. ein Betrieb mit rotem
  Punkt **hinter** einem höheren Gebäude zeigt sein Signal vollständig und ungetönt (Pixelwerte ±2 wie AK-R1-07).
  Hover über seine sichtbare Fläche zeigt den vollständigen Footprint-Umriss in der Signalebene.
- **AK-ISO-16** (1280, `galerie`) Reihenfolge: `qa-playtester` prüft im Screenshot drei benannte Stellen (der Plan
  benennt sie):
  1. Das vordere Gebäude überdeckt das hintere, nie umgekehrt.
  2. Eine Baumreihe vor einem Gebäude überdeckt dessen Sockel, Bäume dahinter werden vom Gebäude überdeckt.
  3. Kein Schatten liegt auf einer Fassade.
- **AK-ISO-17** (Slice, Perf-Sonde nach M7-Spec 9.5) `renderMedian` bei 1280 × 800 und Zoom 1 sowie fps bei
  `leistung-50` und Zoom 0,5 (Messmethode nach M7-Spec 12.1) werden schon im Slice gemessen und gemeldet. Unter
  30 fps ist das BEDENKEN mit Rückfall nach Abschnitt 9. Die harte Abnahme bleibt AK-R4-06.
- **AK-ISO-18** (**Slice-Urteil**, ersetzt die Ausschnittsdefinition von AK-R1-08) Vorher/Nachher:
  - Gleiches Szenario, gleiche Fenstergrösse, gleicher Zoom, die Kamera auf dieselbe Kachel zentriert.
  - Ausschnitte wie AK-R1-08: `galerie` Zoom 1 und 1280 × 800; `leistung-50` Zoom 0,5, wegen der Iso-Breite
    1920 × 1080 statt 1400 × 1500; `tag-3000`; `galerie` bei Tick 2300.
  - Die Prüfmerkmale aus M7-Spec 4.4 (I1, I2, I3, I5, I7) gelten in der Fassung von Abschnitt 13.
  - Urteil L0, `lead-art` und `lead-design`. Die Bilder gehen im Bericht an den Nutzer, mit dem Hinweis, dass dies
    das erste isometrische Bild ist.

## 15. Risiken und offene Punkte mit Empfehlung

1. **Auslegungsrisiko (R91):** Meinte der Nutzer nur schräg gezeichnete Sprites, ist der Nachtrag zu gross.
   _Empfehlung:_ Der Slice-Stopp (AK-ISO-18) ist der früheste Punkt, an dem der Nutzer das Bild sieht. Vor R2 bis R4
   ist nichts verloren.
2. **Leistung des affinen Zeichnens** in Firefox oder ohne GPU-Canvas. _Empfehlung:_ Messung im Slice (AK-ISO-17),
   Rückfall nach Abschnitt 9.
3. **Verdeckung hinter hohen Gebäuden** erschwert Bauen und Auswählen. _Empfehlung:_ Signale und Umrisse in der
   Signalebene (AK-ISO-15) und eine Höhenhülle (D-12). Durchsichtige Vordergebäude erst bei Bedarf nach dem
   Playtest, Eintrag in `docs/beobachtungen.md`.
4. **Treppen beim Weg ziehen** (D-15). _Empfehlung:_ So lassen. Fällt es im Playtest auf, kommt eine Achssperre als
   UI-Komfort, ausserhalb von M7.
5. **Ownership und Teständerungen:** R0-ISO berührt die Kamera-Aufrufe in `input.ts` und `app.ts` und ändert zwei
   M5-Tests (Abschnitt 13). _Empfehlung:_ Beides als Ruling L0 im Gate Spec. U0-ISO steht vor M7-U1 und M6-U1 im
   UI-Strang, das bestätigt das Gate Plan.
6. **Berge mit Höhe** gibt es nicht (D-08). Der Anno-Look kennt sie. _Empfehlung:_ Kandidat für M9 bzw. eine spätere
   Stimmungsrunde, Eintrag in `docs/beobachtungen.md`. Die Sim hat keine Höhe, und das soll so bleiben.
