# ADR-013: Inselmodell im Weltzustand

Status: angenommen · Datum: 2026-10-05 · Bezug: R226 F-06, R227 F-S1 … F-S3, [ADR-002](ADR-002-sim-render-trennung.md),
[ADR-005](ADR-005-tick-reihenfolge-und-zustaende.md) · Meilenstein M12, Paket E0

## Kontext

Bis M11 hatte die Welt genau eine Insel: Kartenraster (`width`, `height`, `tiles`), Kontor-Id und Lager lagen
flach im Weltzustand. M12 bringt ab E1 mehrere Inseln. E0 bereitet das Datenmodell vor und ändert sichtbar nichts:
Spielwerte, Tick-Ergebnis des Referenzlaufs und Bedienung bleiben gleich, `src/sim/defs/` und der Balancing-Test
bleiben unberührt.

Die Entscheidung betrifft die Form des Welt-Zustands und damit das Speicherformat. ADR-002 (Sim als JSON-fähiges
Datenmodell) bleibt gültig; ein Nachtrag dort würde die Entscheidung verstecken (R227 F-S3), daher ein eigenes ADR.

## Entscheidung

1. **Je Insel** liegen Raster, Kontor und Lager: `world.islands[i]` mit `width`, `height`, `tiles`, `kontorId`,
   `stock` (Typ `Island` in `src/sim/types.ts`). E0 erzeugt und lädt genau eine Insel (Index `HOME = 0`).
2. **Global** bleiben die Gebäudeliste `world.buildings` und die Id-Vergabe (`nextBuildingId`) sowie Geld, Steuer,
   Statistik, Freischaltungen, Auftrag, Krise und Tick. Ein Gebäude gehört über das Pflichtfeld `island` (Index) zu
   seiner Insel.
3. **Abarbeitung in Id-Reihenfolge:** Die Systeme iterieren weiter über `Object.values(world.buildings)`
   (aufsteigende Id) und lesen je Gebäude `b.island`. Damit bleibt die Reihenfolge, die der Referenzlauf kennt.
4. **`island` ist Pflichtfeld, ohne Kompatibilitäts-Zugriffe (R227 F-S1, F-S2):** Es gibt keine Aliase auf `World`
   (kein `world.tiles`, `world.stock` o. ä.). Zugriffe gehen über Helfer in `src/sim/world.ts` (`home`, `islandOf`,
   `idx`, `inBounds`, `tileAt`, `adjacentOf`, `tilesInRadius`, die die Insel als Parameter nehmen). Aktionen mit
   Bauplatz nehmen den Inselindex als letzten Parameter mit Vorgabe `HOME`; ein ungültiger Index liefert
   `{ ok: false, reason }` statt eines Wurfs (`islandAt` in `src/sim/placement.ts`, gibt `null` zurück).
5. **Abgeleitete Abdeckung steht nie im Save:** `buildCoverage(world)` in `src/sim/coverage.ts` sammelt je Insel die
   Versorgungs- und Dienstquellen in einem Durchlauf. Das Ergebnis lebt nur innerhalb eines `tickPopulation`-Aufrufs
   und wird als `cov` weitergereicht. Aufrufer ohne `cov` (UI, Abfragen) filtern je Aufruf frisch
   (`serviceBuildings`). Wie `connected` wird auch die Anbindung nach dem Laden neu abgeleitet.
6. **Jede Formänderung bekommt je Merge eine eigene `SAVE_VERSION` (R227 F-S3):** E0 hebt auf **7**. Migration
   `migrateV6ToV7` in `src/sim/save.ts` wirft nie und setzt die Schlüssel reihenfolgetreu neu ein
   (`islands = [{ width, height, tiles, kontorId, stock }]` an der Stelle von `width`, je Gebäude `island: 0` nach
   `state`). **v7 ist damit eingefroren**: Spätere Formänderungen (E1 ff.) bekommen v8 und eine eigene Migration,
   v7 wird nicht nachträglich geändert. Ein Fixture-Stand v6 (`tests/sim/fixtures/save-v6.json`) belegt die
   Migration.
7. **Ladeprüfung:** `deserialize` prüft in E0 genau eine Insel (Kartengrösse, Kachelanzahl, alle Güter im Lager,
   `kontorId` verweist auf ein Kontor mit `island 0`, keine v6-Schlüssel auf oberster Ebene) und für jedes Gebäude
   `island` als ganze Zahl im Indexbereich.

## Verworfene Alternativen

- **Je Insel eine eigene Welt mit eigener Gebäudeliste.** Dann hätten Geld, Id-Vergabe, Steuer, Krisen und Auftrag
  mehrere Besitzer, und Schiffe zwischen Inseln bräuchten eine Klammer darüber. Die globale Liste mit `island` am
  Gebäude hält Ids eindeutig und die Reihenfolge deterministisch.
- **Inselkennung an der Kachel.** Sie würde jede Kachel vergrössern und den Save aufblähen; die Zugehörigkeit steht
  schon im Raster, das einer Insel gehört. Das Gebäude trägt ohnehin `island`.
- **Abdeckungsraster mit Invalidierung.** Ein gespeichertes oder zwischengespeichertes Raster für Versorgung und
  Dienste bräuchte bei jedem Bau, Abriss, Ausfall und jeder Anbindungsänderung eine Invalidierung und wäre eine
  zweite Wahrheit neben den Gebäuden. Die Sammlung je Tick ist ein Durchlauf über die Gebäude und bleibt ohne
  Zustand.

## Folgen

- Alle Zugriffe auf Raster, Kontor und Lager in Sim, Render und UI gehen über Insel und Helfer. Der Compiler meldet
  jeden vergessenen Zugriff (`npx tsc --noEmit`), weil es keine Aliase gibt. Neu in dieser Form: `Coverage` nur
  innerhalb von `tickPopulation`.
- Der Renderer rechnet in E0 weiter mit der Heimat. Eine flache Kopie der Heimatinsel samt Seed (`fieldWorld(world)`
  in `src/render/terrainField.ts`) dient als Eingabe der Geländefelder und ist je Welt zwischengespeichert; für
  mehrere Inseln muss E1 die Felder je Insel bilden.
- Regeln nach Inseln: Versorgung, Dienste, Wege und Feuerschutz gelten je Insel; Auftrag, Bilanz und Brandziel gelten
  nur für die Heimat; Zählungen (Bürger, Kaufleute, Ziele, Unterhalt) bleiben global. `isSupplySource` in
  `coverage.ts` fragt dafür das Kontor der eigenen Insel ab.
- **Kosten der Umkehr:** v7-Stände liegen ab jetzt in den Autosaves der Spieler. Wer E0 zurücknimmt, lässt Stände
  zurück, die ältere Builds mit `Unbekannte Version` abweisen. Die Probe AK-E0-09 prüft genau das. Es gibt keinen
  Weg zurück von v7 nach v6.
- E1 lockert die Ladeprüfung von genau einer Insel auf n Inseln (Kartengrösse je Insel, `kontorId` je Insel) und
  hebt `SAVE_VERSION` auf 8, falls sich die Form ändert.

## Nachtrag E1: Darstellung des Archipels

Datum: 2026-10-06 · Bezug: M12 Paket E1, Spec M12 Anhang 02, R228, R231 (D-139), R257, R261, R265

### Kontext

E1 bringt zwei Fremdinseln (A „Möweninsel" 24 × 24, B „Felsbucht" 36 × 36, `ISLANDS` in `src/sim/defs/sea.ts`) neben die
Heimat. Der Renderer kannte bisher genau ein Raster. Mit mehreren Rastern wachsen Render-Last und Speicher: je Insel
eine Terrain-Ebene mit Kopien für kleine Zoomstufen. Die Heimat darf weder langsamer werden noch ihr Bild ändern
(AK-E1-10, AK-E1-14); die Fremdinseln dürfen keinen Frame blockieren.

### Entscheidung

1. **Archipel-Koordinaten:** Jede Insel trägt einen Ursprung `ox`, `oy` (Kacheln) im gemeinsamen Raum; die Heimat liegt
   bei 0/0. Die Fremdinseln erzeugt `generateForeignIslands(seed, home)` in `src/sim/islands.ts` aus einem eigenen
   Zufallsstrom (`seed ^ ISLANDS_SALT`, `createRng`), in fester Reihenfolge A, dann B. Der Seeweg `d` zählt nur die
   offene See ausserhalb aller Inselrechtecke, gemessen zwischen den Ankern (`seaLanes`, `seaLength`; D-139);
   `travelTicks(d)` = `SHIP_TICKS_PER_SEA_TILE` × `d`.
2. **Inselkamera statt Inselparameter:** Die Zeichner bleiben unverändert und rechnen in Inselkoordinaten.
   `islandCam(cam, isl)` in `src/render/archipel.ts` verschiebt die Kamera um `project(ox, oy)` (die Projektion ist
   linear). Culling (`visibleIslands`, Tiefenfolge nach `ox + oy`, dann Index) und Picking (`pickArchipel`) laufen je
   Insel; `cameraBounds` hält die Bildmitte im Archipel-Rahmen plus `CAMERA_MARGIN` (8 Kacheln). Mindestzoom ist
   0,125 (`ZOOM_STEPS`).
3. **Inselansicht nur lesend:** `islandView(world, i)` liefert für die Heimat die Welt selbst, sonst eine Welt mit
   einer Insel über die Prototypkette (nie beschrieben, je Welt zwischengespeichert). `buildings` ist dort `{}`:
   Gebäude auf Fremdinseln gibt es erst ab E2. Der Seed der Ansicht ist abgeleitet (Bildvariante, kein Sim-Zug).
4. **Terrain-Cache je Insel:** Die Heimatebene steht sofort. Die Fremdinseln rastert ein Plan
   (`createCachePlan` in `src/render/cachePlan.ts`, Uhr eingespeist) nach dem ersten gezeichneten Frame im Leerlauf in
   Scheiben von höchstens `SLICE_MS` = 8 ms (`createIslandLayers` und `idleSchedule` in `src/ui/islandLayers.ts`,
   `requestIdleCallback` mit `IDLE_TIMEOUT_MS` = 100). Der teuerste bisher gemessene Schritt begrenzt die Folgescheiben
   (Abklingen `WORST_DECAY` 0,95); unteilbare Schritte laufen als `solo` allein. Die Schritte kommen aus
   `terrainJob` (`src/render/terrain.ts`): Gitterbänder (`GRID_BAND_ROWS` 2), Malschritte (`SLICE_ROWS` 16 Pixelzeilen),
   Halb- und Viertelkopie (`QUARTER_STRIPS` 8). Fehlt eine Ebene im Bild, rastert der **Notfall** (`finish`)
   sie synchron im Frame; er wird gezählt (`emergencyFrames`).
5. **Detailstufe:** Ab Zoom ≤ `LOD_ZOOM` = 0,25 entfallen Figuren, Tiere, Rauch, Schaum und Wellen; der Boden kommt aus
   der Viertel-Kopie (lead-art B5). Das Meer ist eine Fläche in `waterDeep`, die äussersten 2 Kacheln jeder Ebene
   laufen darauf aus.
6. **Streichvariante:** `ARCHIPEL_VIEW` in `archipel.ts` (`'sea'`, Streichvariante `'jump'`) zeichnet mit `'jump'` nur
   die aktive Insel; Sim, Save und UI bleiben gleich.

### Folgen

- **Save v8** (`SAVE_VERSION` 8, `src/sim/save.ts`): je Insel kommen `kind` (`'home'`, `'A'`, `'B'`), `ox`, `oy` und
  `anchor` hinzu; Fremdinseln haben `kontorId null` und Lager 0. Die Ladeprüfung verlangt `1 + ISLANDS.length` Inseln,
  die Art je Index, Raster höchstens `size`, ganzzahlige `ox`/`oy`, `anchor` innerhalb des Rasters und für die
  Fremdinseln `kontorId null`. `migrateV7ToV8` ergänzt die Heimat um `kind`, `ox`, `oy`, `anchor` und erzeugt A und B aus `seed`; lässt sich
  der Stand nicht aufbauen, setzt sie nur die Version, und die Ladeprüfung weist ihn mit `Beschädigter Spielstand`
  ab. Nach R261 (Verfassung 1.2) müssen ältere Stände nicht ladbar sein; die Migration ist ein Entgegenkommen, keine
  Zusage, und v7 bleibt in E1 ladbar, weil der Code es so tut.
- **Speicher:** `ARCHIPEL_EXTRA_BYTES` in `src/render/limits.ts` ≈ 44,5 MB (Fremdinsel-Ebenen mit halber und Viertel-Kopie,
  Viertel-Kopie der Heimat, Faktor `ARCHIPEL_LAYER_SCALE` 2).
- Die Heimat bleibt bildgleich zu `main` (AK-E1-10) und im Takt gleich (AK-E1-14). Der Renderer bildet Geländefelder
  je Insel aus `islandView`.
- Der Notfall ist planmässig synchron: Beim Sofort-Zoom auf noch nicht fertige Ebenen blockiert ein Frame 160–450 ms.

### Verworfene Alternativen (E1)

- **Inselparameter durch alle Zeichner:** Jeder Zeichner bekäme Ursprung und Insel als Parameter. Das berührt alle
  Zeichner samt Tests und gefährdet die Bildgleichheit der Heimat; die Inselkamera ändert keinen Zeichner.
- **Aufbau beim ersten Sichtkontakt:** Das Rastern der Fremdinseln (in der Grössenordnung 1,5 s) fiele in den Frame, der sie erstmals zeigt, und
  ruckelt sichtbar. Aufbau im Leerlauf nach dem Erstbild vermeidet das; der Notfall bleibt als Rückfall.

### Messwerte R1–R5 (T07)

Bedingungen: Apple M1 Pro, Headless-Chrome 154, 1920 × 1080, Seed 14, Stand `3727c3f` (B) gegen E0-Stand (A),
Notfall-Frames 0. Last in der Spalte = `uptime`-Load vor dem Lauf. Der Gesamtcheck `make check` und `CI=true make check`
(1833 bestanden, 1 übersprungen) lief **unter Systemlast** (Load 21 → 9, macOS-Systemdienste), Messläufe bei der
angegebenen Last.

| AK (Messung)               | Wert                                         | Bedingung             | Last    |
| -------------------------- | -------------------------------------------- | --------------------- | ------- |
| AK-E1-14 (R1)              | Δ 0,0 ms (A 26,1 / B 26,1), Grenze ≤ +0,2    | DPR 2, 7 Läufe        | 2,4–3,8 |
| AK-E1-15 (R2)              | `buildMs` ×1,08 (1531 / 1656), Grenze ≤ ×1,3 | wie AK-E1-14          | wie 14  |
| AK-E1-16 (R3)              | ×0,07 (1,9 / 26,2 ms), Grenze ≤ ×2,0         | DPR 2                 | 3,1–3,3 |
| AK-E1-18 (R4, entscheidet) | 16,8 / 33,3 / 33,3 ms, Grenze ≤ 50           | DPR 1, `--idle`, 3 L. | 2,4     |
| AK-E1-18 informativ        | 66,7 ms (Grundframe dort 50 ms)              | DPR 2                 | 3,9–5,4 |
| AK-E1-19 (R5), Scheiben    | p95 7,7–7,9, Median 5,4, Maximum 8,4–9,7     | DPR 2, 3 Läufe        | 3,9–5,4 |
| AK-E1-19 (R5), Scheiben    | p95 7,7–8,0, Maximum 8,3–9,4                 | DPR 1, 6 Läufe        | 3,2–3,5 |

Seed 3 lag in der früheren Serie 3 ähnlich (AK-E1-14 ±0,0, AK-E1-15 ×1,0, AK-E1-16 ×0,06). Einordnung der Messregeln:
R257 (AK-E1-18 bei DPR 1 entschieden) und R265 (AK-E1-19 nach p95) stehen als Nachtrag in der Spec. Das Rest-Maximum
von AK-E1-19 (8,4–10,1 ms) ist eine periodische Spitze etwa alle 16 Malschritte; der Browser-Flush der Aufzeichnung
ist eine **Vermutung, nicht belegt**. Die frühere Spitze von 15–30 ms lag im eigenen Code (unteilbare halbe Kopie)
und ist behoben.
