# Stilrahmen „Gemalte Tonstufen" (ART-STIL-01)

- Status: Entwurf zum Gate (L0) · Paket ART-STIL-01 · Ruling R209 Phase 1 · Autor: lead-art · 2026-10-04
- Grundlage: Galerie `.studio/qa/ART-STIL-01/01…15` (main 9a34776, Seed 1, Tag, 1920×1080, DPR 2, lokal,
  nicht versioniert; Skript `skripte/gal.mjs`), Code-Bestandsaufnahme art-rendering-engineer, ADR-012, lernen.md
  („Bildziel vor Code").
- Nutzerfeedback: Gebirge gelungen; Unebenheiten auch für die anderen Terrains; Dünen „komisch"; Terrains und
  Häuser passen stilistisch nicht zusammen.

## 1 Diagnose

Kernbefund: Auf der Insel stehen **drei Bildsprachen** nebeneinander. Die Lichtrichtung ist dabei schon einheitlich.
Das Gebirge malt Form in **gestuften Tonflächen** mit Korn und ohne Kontur. Der Boden (Wiese, Waldboden, Sand) ist
ein **weicher Verlauf**, der im Nahzoom unscharf wirkt. Häuser, Bäume, Schaum und Wege sind **Vektorflächen**,
die Häuser zusätzlich mit dunkler 1-px-Kontur. Im Schlüsselbild 13 sieht man das so: Das Massiv liegt wie ein
grauer Haufen auf einem gelbgrünen Teppich, und davor stehen gezeichnete Häuser.

- **D1** **Flächig vs. plastisch:** Das Gebirge hat 5 Tonstufen mit harter Tonkante, die Wiese stufenlose Verläufe (±20 %). Unebenheit liest sich auf der Wiese als Farbfleck, nicht als Form. — Bild 13, 03, 02 · `massif.ts` `toneStep`/`ROCK_TONES` (~658–746) vs. `terrain.ts` Wiese 542–566, `SHADE_MAX_FLUR`
- **D2** **Zwei Schärfeebenen:** Bei Zoom 2 wirkt der Boden wie unscharf fotografiert. Darauf liegen scharfe Vektor-Büschel, ebenso scharfe Bäume und Häuser. — Bild 04, 06, 08, 12 · `terrain.ts` `RASTER` 4 (Knotenraster, interpoliert), Rauschen 0,09–0,5/Kachel; `groundDecor.ts` `paintDecor`
- **D3** **Sättigung verkehrt:** Die Wiese ist kräftig gelbgrün, die Bäume sind satt grün, das Gebirge ist entsättigt kühlgrau. Der Boden konkurriert mit den Gebäuden, das Massiv wirkt fremd. — Bild 13, 03, 05 · `palette.ts` `grassLight`, Warm-Verlauf der Wiese (`terrain.ts` ~486ff.), `crownLight`
- **D4** **Lichtfarbe uneinheitlich:** Das Gebirge hat kühle Schatten (waterDeep) und warme Lichter (sandDry). Häuser mischen mit Schwarz und Weiss (±18 %), das ergibt graue, „schmutzige" Schattenseiten. Die Richtung steht dreimal im Code, mit gleichem Wert. — Bild 12, 02 · `sprites.ts` `wallColors`/`roofColors` 157–164, `SHADOW_DIR` :25; `trees.ts` `DIR` :45; `light.ts` `LIGHT` :8
- **D5** **Kontur nur bei Häusern:** `EDGE` (wallTimber, mit 55 % Schwarz gemischt) zieht 1 px bei jedem Zoom, dazu `OUTLINE` rgba(0,0,0,.6). Boden, Bäume und Gebirge haben keine Kontur, deshalb wirken die Häuser aufgeklebt (Comic-Look). — Bild 12, 11, 15 · `sprites.ts` :19, :27, `poly` :57
- **D6** **Relief-Massstab:** Das Gebirge hat bis 135 px Höhe. Die Wiese hat `HILL_AMP` 2,1 und Dünen `DUNE_AMP` 1,3 bei weicher Schattierung. Am Massivfuss fehlt ein Übergang (Vorberge), der Berg steht auf flachem Grund. — Bild 13, 01 · `massif.ts` `AMP_CAP` :32; `terrain.ts` :39–40
- **D7** **Dünen:** Hellweisse Streifen laufen **quer** zur Küste bis an den Schaum und brechen abrupt ab („Zebra"). Sie haben keinen Kamm, keine Leeseite und kein Korn; Sand ist die einzige glatte Fläche. — Bild 07, 08 · `terrain.ts` `duneRidge` 261–277 (globale Richtung π/4 ± 0,55, nicht küstenbezogen), `duneMask` 254, Licht 455–464
- **D8** **Eckige Flecken** in der Wiese, teils kachelparallel. Vermutet sind Mischgrenzen der Bodenarten in der Rasterung; die Ursache klärt H-R11. — Bild 07, 08 · `terrain.ts` `computeWindow` 326–485 (nicht verifiziert)
- **D9** **Wald:** Der dunkle, weiche Waldboden-Hof läuft über die Baumkante hinaus. Die Kronen haben zwei Töne (Fläche plus Lichtkappe) statt einer Tonleiter. — Bild 06, 05 · `terrain.ts` 568–575 (`FOREST_FLOOR`), `trees.ts` 158–160
- **D10** **Wasser:** Der Tiefenverlauf ist weich, der Schaum vektorhart. Im Tiefwasser verläuft eine harte, gerade Diagonale (Kartenrand bzw. Tiefenfeld). Für REL-01 nur vermerkt. — Bild 07, 09 · `terrain.ts` `waterColor` 517–523, `water.ts`

Was das Gebirge gelingen lässt (Referenz): ein echtes Höhenfeld, Facettenlicht mit Elevation (`relLight`), eine
**gestufte Tonleiter** mit kühlen Schatten und warmen Lichtern, Kanten aus Krümmung (Grate), Korn und Textur. Alles
wird einmal gerastert, nichts davon kostet je Frame.

## 2 Stilrahmen (prüfbare Regeln)

Das Gebirge H-R9 ist die Referenz. Die Häuser bleiben gezeichnet, sprechen aber dieselbe Licht- und Tonsprache.

- **S1 Ein Licht:** Richtung nur aus `light.ts` (`LIGHT`). Schattenseiten mischen zum kühlen Schattenton
  (Richtung `waterDeep`/`rockDark`), Lichtseiten zum warmen Lichtton (`sandDry`), nie zu reinem Schwarz oder Weiss.
  Prüfung: keine lokale Lichtkonstante und keine Mischung mit `#000000`/`#ffffff` in Flächenfarben (grep, Test).
- **S2 Form in Tonstufen:** Licht auf Form (Gebirge, Bodenrelief, Dünen, Kronen, Dächer) erscheint in 3–5 Stufen
  mit weicher Kante von 1–2 px, wie `toneStep`/`TONE_EDGE_PX`. Farbvariation (Feuchte, Bewuchs) darf weich bleiben,
  Licht ist gestuft. Die Stufen entstehen je Pixel nach der Interpolation, nicht im Knotenraster.
- **S3 Eine Schärfe:** Der Boden ist bei Zoom 2 so scharf wie die Objekte: Tonkanten höchstens 2 CSS-px breit,
  Korn in 1 px. Streudekor (Büschel, Blüten) setzt Akzente, die Textur trägt es nicht.
- **S4 Kontur als Ton:** keine schwarzen Linien. Die Silhouette ist ein dunkler Ton der Eigenfarbe (eine Stufe unter
  der Schattenseite), Innenkanten entstehen nur aus dem Facettenkontrast. Lesbarkeit geht vor: Gebäude bleiben bei
  Zoom 1 gegen jeden Boden abgesetzt.
- **S5 Wert- und Sättigungsleiter:** Signale > Gebäude > Bäume > Boden > Tiefwasser. Der Boden ist der ruhigste
  Bildteil: Die Wiese geht ins Oliv und wird weniger gesättigt, das Gebirge bleibt. Wiese und Gebirge teilen die
  Lichtfarben.
- **S6 Relief nur gemalt:** Höhe nur im Bild, nie in der Geometrie (ADR-012 Nr. 4, D-08). Je Boden gibt es ein
  Höhenfeld aus `rotNoise`, Merkmale 1–4 Kacheln (Hügel) plus 0,3–0,6 (Mikro). Bei Zoom 1 zeigt jeder Hügel
  mindestens 2 Tonstufen. Auf bebaubaren Kacheln ändert sich der Ton innerhalb einer Kachel um höchstens 1 Stufe, so
  steht kein Haus sichtbar am Hang. Zum Gebirge hin wachsen die Hügel zu Vorbergen an.

## 3 Bildziel je Element

Jedes Häppchen liefert Vorher/Nachher-Bilder mit derselben Kamera wie die Galerie (`gal.mjs`, Bildnummern wie unten).

- **Gebirge** (Referenz 01, 02, 13): (1) Massiv-Inneres unverändert (Pixeldiff im Massivkern ≈ 0). (2) Der Fuss geht über Vorberge und Schuttband in die Wiese über; in 13 ist keine Kante „Haufen auf Teppich" mehr zu sehen.
- **Wiese** (Referenz 03, 04): (1) Zoom 1: Hügel in ≥ 2 Tonstufen, Lichtseite links oben. (2) Zoom 2: keine Unschärfe, Tonkanten ≤ 2 CSS-px, Korn sichtbar. (3) Mittlere Sättigung (HSL-S, fester Ausschnitt in 03) mindestens 15 % relativ unter main; keine eckigen, kachelparallelen Flecken (D8).
- **Wald** (Referenz 05, 06): (1) Der Waldboden-Hof endet höchstens 0,5 Kachel hinter der äussersten Krone. (2) Kronen in 3 Tönen (kühler Schatten, Mitte, warme Kappe), Licht aus `LIGHT`. (3) Wald bleibt bei Zoom 1 dunkler als die Wiese und als Wald lesbar.
- **Dünen** (Referenz 07, 08): (1) Kämme laufen parallel zur Küste (±30°) mit ≥ 1 Kachel Abstand zum nassen Saum, nie bis in den Schaum. (2) Jede Düne zeigt eine scharfe Kammlinie, die Luvseite hell und die Leeseite 1–2 Stufen dunkler; kein Ton heller als `sandDry` plus 1 Stufe. (3) Zoom 2: Rippeln/Korn sichtbar.
- **Häuser** (Referenz 11, 12, 15): (1) Keine schwarze Kontur, Silhouette in dunkler Eigenfarbe (S4). (2) Schattenseite kühler als die Lichtseite (Blauanteil b/(r+g+b) messbar höher), Licht aus `light.ts`. (3) Blindtest Probenblatt 15: Typ-Erkennung nicht schlechter als H-R7-Endstand; bei Zoom 1 hebt sich jedes Gebäude von der Wiese ab.
- **Wasser** (Referenz 09, 10): REL-01: unverändert (Regressionsbild). Ziel für später: Tiefenbänder in Stufen, keine gerade Diagonale.

## 4 Prämissen gegen die Sim (geprüft)

- `isLand` (`src/sim/mapgen.ts:11`): sand, grass, forest; Gebirge ist kein Land. `checkGround`
  (`src/sim/placement.ts:18`) verlangt Land ohne Gebäude oder Weg. Bebaubar sind also Wiese, Wald und Sand, das
  Gebirge nie.
- Die Sim kennt keine Höhe (`Terrain`, `src/sim/types.ts:3`). Picking geschieht flach auf der Bodenebene
  (`screenToTile`, `camera.ts:35`), Gebäude über `bodyHull` (`iso.ts:98`).
- Folge: Alle Häppchen bleiben **rein darstellend**, im einmal gerasterten Bodenbild oder in Sprites. Sie
  verschieben keine Geometrie und ändern weder Sim, Save noch Spielwerte. Vertikal versetzte Kacheln sind
  ausgeschlossen, weil sie `unproject`, Culling, `groundMatrix` und Tiefensortierung brechen würden.
- Vorberge (H-R13) liegen auf bebaubaren Kacheln, deshalb gilt dort die Hanggrenze aus S6. Dünen liegen auf
  bebaubarem Sand, sie sind nur Ton, keine Sperre.

## 5 Performance-Budget

- Basis: `renderMedian` ≈ 4 ms (Seed 7, 1920×1080, DPR 2, Zoom 1; H-R8, `docs/beobachtungen.md`). Headless mit
  `--disable-gpu` misst absolut anders (≈ 27 ms), es zählt nur das A/B-Delta mit `tools/render-qa/perf.mjs`.
- Je Frame: Pro Häppchen höchstens +0,2 ms `renderMedian`, für REL-01 insgesamt höchstens +0,5 ms. Erwartet wird
  ≈ 0, weil Boden und Sprites gecacht sind.
- Erstbild-Rasterung: `buildTerrainLayer` `buildMs` höchstens +30 % je Häppchen, für REL-01 höchstens +50 %
  gegenüber main. `updateTerrainLayer` `lastPatchMs` höchstens +30 %. Keine Teilflächen im Erstbild.
- Sprite- und Massiv-Cache: keine neuen Schlüssel, Speicherobergrenzen unverändert (`limits.ts`).
- Hauptrisiko: Tonstufen je Pixel (S2/S3) kosten Rasterzeit. Gegenmittel ist eine Stufen-Tabelle und Auswertung
  nur auf Land, wie im Massiv.

## 6 Zuschnitt in Häppchen

Jedes Häppchen hat Prozessstufe leicht, einen Worktree, Bildkriterien aus §3 und höchstens 2 Bild-Fix-Runden. Die
Schätzungen in Werkzeugaufrufen enthalten Engineer, Review und Playtest. Sie sind nach H-R9 bewusst hoch angesetzt
(geschätzt 200, Ist 450).

**H-R10 Ein Licht für Häuser und Bäume** — Ziel: Häuser und Bäume sprechen die Licht- und Tonsprache des
Gebirges (S1, S4). Dateien: `sprites.ts` (`wallColors`, `roofColors`, `EDGE`, `OUTLINE`, `SHADOW_DIR`), `trees.ts`
(`DIR`, Kronen in 3 Tönen), `palette.ts` (Helfer für warmen bzw. kühlen Ton, eigenes `mixHex` in `sprites.ts`
entfällt), Tests unter `tests/render/`. Bildkriterien: Häuser (1)–(3), Wald (2). Risiko: Lesbarkeit der Gebäude
(Blindtest mit Rater einplanen); Rasterzeit nur beim Cache-Aufbau. Schätzung: **110 Tools**.

**H-R11 Bodenrelief Wiese und Wald in Tonstufen** — Ziel: Unebenheiten für die Wiese und den Waldboden, scharf
und ruhig (S2, S3, S5, S6). Dateien: `terrain.ts` (Wiesen- und Waldzweig, `meadowHill`, Schattierung je Pixel
gestuft, Sättigung, D8), `light.ts` (Tonleiter-Helfer, aus `massif.ts` hierher verschoben), `massif.ts` (nur
Import statt eigener Definition), `groundDecor.ts` (Büschel an die Tonstufen anpassen), `palette.ts` nur lesen.
Bildkriterien: Wiese (1)–(3), Wald (1), (3). Risiko: `buildMs` (Hauptrisiko des Releases); Wiese bei Zoom 1 zu
unruhig, die Gebäude müssen sich abheben (S5). Schätzung: **150 Tools**.

**H-R12 Dünen neu** — Ziel: Dünenfelder, die als Sandformen lesbar sind (D7). Ansatz: Die Kämme folgen dem
Küstenfeld (`fields.coast`; Höhe als periodische Funktion des Küstenabstands, längs verwirbelt und segmentiert) und
sind dadurch automatisch küstenparallel. Asymmetrisches Profil (flache Luv-, steile Leeseite), Kamm aus Krümmung
wie die Grate, Rippeln und Sandkorn. Dateien: neu `src/render/dunes.ts` (reine Funktion plus Tests
`tests/render/dunes.test.ts`); Andocken in `terrain.ts` nur im Sandzweig (ersetzt `duneRidge`/`duneMask`). Bildkriterien:
Dünen (1)–(3). Risiko: gering, nur Sandfläche; das Andocken kollidiert in `terrain.ts` mit H-R11. Schätzung:
**100 Tools**.

**H-R13 Vorberge und Gebirgsfuss** — Ziel: Das Massiv wächst aus dem Gelände, statt auf ihm zu liegen (D6).
Dateien: `terrain.ts` (Hügelamplitude nach Nähe zum Gebirge über `fields.types.mountain`), `massif.ts` (Schuttband
in den Tonstufen der Wiese, Massiv-Inneres unberührt). Bildkriterien: Gebirge (1), (2); Hanggrenze S6 auf
bebaubaren Kacheln. Risiko: Die Referenz kann leiden; Pixeldiff im Massivkern ist Pflicht. Schätzung: **80 Tools**.

### Dateimatrix (W = schreibt, L = liest)

- **Datei** H-R10 — Bild H-R11 · H-R12
  | --------------------------- | -------------- | -------------- | --------------------------- | --------------- |
  | `src/render/sprites.ts` | W | – | – | – |
  | `src/render/trees.ts` | W | – | – | – |
  | `src/render/palette.ts` | W | L | L | L |
  | `src/render/light.ts` | L | W | L | L |
  | `src/render/massif.ts` | – | W (Import) | – | W (Schuttband) |
  | `src/render/terrain.ts` | – | W | W (nur Sandzweig, Andocken) | W |
  | `src/render/groundDecor.ts` | – | W | – | – |
  | `src/render/dunes.ts` (neu) | – | – | W | – |
  | `tests/render/…` | sprites, trees | terrain, light | dunes | terrain, massif |

Parallelität: H-R10, H-R11 und der Kern von H-R12 (`dunes.ts` mit Tests) laufen gleichzeitig. Das Andocken von
H-R12 in `terrain.ts` und H-R13 folgen seriell nach dem Merge von H-R11: main per Merge holen, dann andocken.

### Release-Vorschlag

- **REL-01 „Aus einem Guss" (3 Häppchen):** H-R10, H-R11, H-R12. Das deckt die drei Nutzerpunkte ab: Unebenheiten
  für die Terrains, Dünen und Häuser passend zum Gelände. Schätzung zusammen etwa 360 Tools plus Lead-Steuerung. Das
  Release-Gate verlangt die Vorher/Nachher-Galerie 01–15, das A/B-Perf-Delta und den Blindtest Häuser.
- **H-R13** ist der vierte Kandidat für REL-01, wenn das Budget reicht. Sonst geht er als erstes Häppchen in REL-02.
- **Später (REL-02 ff.):** Wasser in Tiefenstufen samt gerader Diagonale (D10); Wege mit Lichtkante und Rand in
  Tonstufen; Kontaktschatten (AO) und Hofplatten am Gebäudefuss; Nachtstimmung (Beobachtung H-R9); Galerie-Skript
  nach `tools/render-qa/` versionieren.

## 7 Nicht-Ziele

Keine Höhen in Sim oder Save, keine Änderung an Picking und Bauregeln, keine fremden Grafik-Assets (alles
prozedural, ADR-006 unberührt), kein Umbau des Gebirgs-Inneren.
