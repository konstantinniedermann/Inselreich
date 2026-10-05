# Anhang 02 — E1: Fremdinseln, Archipel, Render

Zur [Spec M12](../2026-10-05-m12-weite-welt-spec.md), Teil E1 (Abschnitt 5). Werte aus dem
[Vorschlag, Anhang 01](../2026-10-05-m12-weite-welt-design/anhang-01-wirtschaft.md) §1b. **[Tech]** = lead-tech
entscheidet im Plan; **[Art]** = lead-art entscheidet. Save **v8** = E1 (R228 (3)). Insel C ist gestrichen (R228
(2)): zwei Fremdinseln.

## A. Inseln (`src/sim/defs/sea.ts`, Eintrag `ISLANDS`)

| `kind` | Name       | `dMin`–`dMax` | Fahrzeit `10 × d` | Höchstgrösse | `traits`            | Garantie im Generator                                |
| ------ | ---------- | ------------- | ----------------- | ------------ | ------------------- | ---------------------------------------------------- |
| `A`    | Möweninsel | 25–30         | 250–300           | 24 × 24      | `spice`             | Kontorplatz an der Küste + 2 Plätze Gewürzplantage   |
| `B`    | Felsbucht  | 35–40         | 350–400           | 36 × 36      | `spice`, `mountain` | Kontorplatz + 3 Plätze Plantage + 1 Platz Steinbruch |

- Heimat: `kind 'home'`, Name „Heimat" (`sea.ts` `HOME_NAME`), keine `traits`; trägt nie `spice`.
- „Platz" = eine Lage, an der `canPlace` für das Gebäude auf der frisch erzeugten Insel `ok` liefert (Plätze
  überlappen nicht). Merkmal `spice` ist ein Inselmerkmal, kein Kachelterrain.
- `ISLANDS` hat genau zwei Einträge; die Save-Prüfung zählt `1 + ISLANDS.length` = 3 Inseln. Eine dritte Insel
  (früher C „Grünland") ist nicht im Scope; sie liesse sich später mit eigener Save-Version anhängen. Erz und Minen
  sind gestrichen (Vorschlag §6).
- Namen sind eigene, allgemeine Wörter (ADR-006); lead-design bestätigt sie im Gate Spec.

## B. Generator (`src/sim/islands.ts` neu, [Tech] Name)

- **Eigener Zufallsstrom:** eine Instanz `createRng((seed ^ ISLANDS_SALT) >>> 0)` für alle Fremdinseln, in der
  Reihenfolge A, B; `ISLANDS_SALT` neue Konstante in `sea.ts`, verschieden von Auftrags- und Krisen-Salz. `seed`
  ist `world.seed` (nach `generateMap`). Heimat-Generator, Auftrags- und Krisenstrom bleiben unberührt.
- **Insel:** Rauschfeld wie `mapgen` auf der Inselgrösse (Wasserrand ≥ 2 Kacheln), dann Garantieprüfung aus A. Fehlt
  eine Garantie, neuer Versuch im selben Strom, höchstens `ISLAND_TRIES` (= 50, `sea.ts`); danach feste Ersatzform
  je `kind` (Rechteck-Insel mit Garantien, im Generator hinterlegt). Ergebnis bleibt deterministisch.
- **Plätze im Meer:** Versatz `ox`, `oy` (ganzzahlig, Archipel-Kacheln); Heimat `(0, 0)`. Inselrechtecke überlappen
  nie, Abstand zwischen Rechtecken ≥ `ISLAND_GAP_MIN` (= 8). Jede Insel hat einen **Ankerplatz** `anchor` (Wasserkachel
  im eigenen Raster, 4er-angrenzend an Land, über Wasser mit dem Rand verbunden); Heimat: nächste solche Kachel zum
  Heimatkontor (Mitte zu Mitte, bei Gleichstand kleinstes `y`, dann `x`).
- **Fahrlinie** zwischen zwei Inseln: Polylinie Anker → höchstens 2 Wegpunkte → Anker; kein Segment schneidet ein
  Inselrechteck ausser die Endsegmente innerhalb der eigenen Randzone. `d` = aufgerundete Länge in Kacheln. Linien und
  `d` sind eine reine Funktion `seaLanes(islands)` aus `ox`, `oy`, `anchor`, `width`, `height` (nicht im Save).
- **Band:** `d(0, i)` liegt im Band der Insel (A). `d(i, j)` zwischen Fremdinseln ist frei (Ergebnis der Linie).
- **Rahmen:** Achsenparalleles Rechteck um alle Inseln mit `W + H ≤ 300` Kacheln (`sea.ts` `ARCHIPEL_SPAN_MAX`);
  damit passt der ganze Archipel bei Zoom 0,125 auch in 1280 × 800 (Breite `300 · 32 · 0,125 = 1200`, Höhe 600).

## C. Save-Felder E1 (Save v8)

`Island` + `kind`, `ox`, `oy`, `anchor { x, y }`; `kontorId: number | null` (null nur bei Fremdinsel ohne Kontor).
Fremdinseln entstehen in `createWorld` und bei der Migration v7 → v8 aus `world.seed`; ihr `stock` hat alle Güter 0.
Name, Merkmale und Fahrzeit kommen aus `ISLANDS` bzw. `seaLanes`, nicht aus dem Save.

## D. Darstellung

- **Weltkoordinaten:** Kachel `(x, y)` der Insel `i` liegt im Archipel bei `(ox + x, oy + y)`; Projektion wie heute.
  Heimat mit `(0, 0)` → Heimatbild unverändert.
- **Offenes Meer:** eine gezeichnete Fläche in `waterDeep` hinter allen Inseln (eine Füllung je Frame, keine
  Kacheln). **Meerkante (lead-art B3):** In jedem Inselcache laufen die äussersten 2 Kacheln genau auf `waterDeep`
  aus; Wellen und Schaum sind dort 0. Damit gibt es keine Kante zwischen Cache und Meer (AK-E1-17).
- **Reihenfolge:** Meer → Inseln nach Tiefe (`ox + oy` aufsteigend, dann Index) → je Insel wie heute.
- **Schiffe (lead-art B6, E4):** Ein Schiff im Rechteck einer Insel wird in deren Tiefensortierung einsortiert; auf
  offener See nach seiner Tiefe zwischen den Inseln. Bei Zoom ≤ 0,25 hat ein Schiff mindestens ≈ 12 CSS-px Breite
  (AK-E4-15).
- **Terrain-Cache je Insel** (`buildTerrainLayer` je Insel):
  - Heimat **sofort** zum Erstbild (wie heute).
  - Fremdinseln **im Leerlauf nach dem Erstbild** (R228 (4), F-P3), in **Scheiben**: Zeilenbänder (`CHUNK`) von
    `paintRegion`, je Scheibe höchstens **8 ms** nach eigener Uhr (`performance.now()`), eine Scheibe je
    Leerlauf-Slot (`requestIdleCallback`, sonst `setTimeout(0)`), Reihenfolge A, B. **Notfall:** Kommt eine Insel ins
    Bild, bevor ihr Cache fertig ist, werden ihre restlichen Scheiben im selben Frame synchron gerastert; diese Frames
    werden in R4 getrennt ausgewiesen.
  - **Begründung:** Das Erstbild bleibt beim heutigen Aufwand; ein Aufbau „beim ersten Sichtkontakt" ruckelt beim
    Schwenken; Scheiben ≤ 8 ms halten jeden Frame unter dem R4-Grenzwert.
- **Speicher (lead-art B4)** als Eintrag in `src/render/limits.ts`, ehrlich gerechnet mit Faktor 2 bei DPR 2 (Faktor
  nicht senken): A 1536² ≈ 9,4 MB, B 2304² ≈ 21,2 MB, zusammen ≈ 30,7 MB; dazu `halfLayer` (¼ Fläche) ≈ 7,7 MB und
  Viertel-Kopie (1/16) aller drei Inseln ≈ 6,1 MB → **≈ 44,5 MB zusätzlich** zur heutigen Heimat.
- **Culling je Insel** (reine Mathematik, `src/render/camera.ts`): `visibleIslands(camera, view, islands)` liefert
  die Inseln, deren projiziertes Rechteck (plus Sprite-Rand `H_TOWER`) den Ausschnitt schneidet;
  `visibleTileRange` je Insel in Inselkoordinaten. Unsichtbare Inseln erzeugen keinen Zeichenaufruf.
- **Picking:** Bildschirm → Archipel-Kachel → `(insel, x, y)` oder `null` (offenes Meer, zwischen Rechtecken oder
  Wasserkachel ausserhalb jeder Insel). Kamera-Grenze: Archipel-Rahmen + 8 Kacheln.
- **Zoom:** `ZOOM_STEPS` (`src/render/iso.ts`, Render-Konstante) erhält `0.25` und `0.125`; Mindestzoom **0,125**
  (R228 (4)).
- **Detailstufe (lead-art B5, verbindlich):** ab Zoom ≤ 0,25 ohne Figuren, Tiere, Rauch, Schaum und Wellen; Böden aus
  einer **Viertel-Kopie** je Inselcache (analog `halfLayer`).
- **Mouse-over Insel:** über Land einer Fremdinsel (Auswahl-Werkzeug) Karte „Name · B × H · Merkmale · Fahrzeit
  m:ss" (Fahrzeit `10 × d(0, i)` Ticks bei Tempo 1); vor U6 zusätzlich „Seefahrt mit den Kaufleuten" (E2).

## E. Messprotokoll Render (A/B mit `tools/render-qa/perf.mjs`)

E1 erweitert `perf.mjs` um `--zoom <z>` und `--focus home|archipel` (`home`: Heimatkontor in der Mitte; `archipel`:
Rahmenmitte); die Dev-Sonde liest Kacheln nach E0 über `islands[0]`. Bedingungen wie Stilrahmen §5: Headless, DPR 2,
1920 × 1080, `--runs 3`, abwechselnd A/B, Median der Mediane; je Seed 14 (H-R9) und 3 einzeln. A ist `main` nach dem
REL-03-Merge.

| Messung | A                    | B                                                                                           | Grenze (entschieden R228 (4)/(5))                             |
| ------- | -------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| R1      | main, Zoom 1, `home` | E1, Zoom 1, `home` (nur Heimat im Bild)                                                     | `renderMedian` B − A ≤ +0,2 ms                                |
| R2      | main                 | E1                                                                                          | Heimat `buildMs` B ≤ A × 1,3 (Erstbild, nur Heimat gerastert) |
| R3      | E1, Zoom 1, `home`   | E1, Zoom 0,125, `archipel`; erst nach Aufbau aller Terrain- und Massiv-Caches und Aufwärmen | `renderMedian` B ≤ 2 × A, **hart**                            |
| R4      | —                    | E1, Zoom 1, `--focus home`, Leerlauf-Rasterung von A und B läuft                            | kein Frame > 50 ms; Notfall-Frames getrennt ausgewiesen       |
| R5      | —                    | E1, Dev-Sonde: Dauer jeder Leerlauf-Scheibe                                                 | jede Scheibe ≤ 8 ms                                           |

## F. Streichvariante B (Rückfall der Darstellung)

Schalter `ARCHIPEL_VIEW: 'sea' | 'jump'` in `src/render/` (Render-Konstante, kein Spielwert). Bei `'jump'`: nur die
aktive Insel wird gezeichnet, kein Meer dazwischen, Kamera-Grenze = Inselrechteck, Inselwechsel nur per Kamerasprung
(E2). `src/sim/`, Save und `src/ui/` ändern sich dafür nicht (AK-E1-12).
