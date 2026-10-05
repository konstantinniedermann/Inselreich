# Anhang 02 — E1: Fremdinseln, Archipel, Render

Zur [Spec M12](../2026-10-05-m12-weite-welt-spec.md), Teil E1 (Abschnitt 5). Werte aus dem
[Vorschlag, Anhang 01](../2026-10-05-m12-weite-welt-design/anhang-01-wirtschaft.md) §1b. **[Tech]** = lead-tech
entscheidet im Plan; **[Art]** = lead-art entscheidet. Save: „v8 (oder je Merge eine Version)" nach F-S1.

## A. Inseln (`src/sim/defs/sea.ts`, Eintrag `ISLANDS`)

| `kind` | Name (Vorschlag Spec) | `dMin`–`dMax` | Fahrzeit `10 × d` | Höchstgrösse | `traits`            | Garantie im Generator                                    | Streichung |
| ------ | --------------------- | ------------- | ----------------- | ------------ | ------------------- | -------------------------------------------------------- | ---------- |
| `A`    | Möweninsel            | 25–30         | 250–300           | 24 × 24      | `spice`             | Kontorplatz an der Küste + 2 Plätze Gewürzplantage       | Pflicht    |
| `B`    | Felsbucht             | 35–40         | 350–400           | 36 × 36      | `spice`, `mountain` | Kontorplatz + 3 Plätze Plantage + 1 Platz Steinbruch     | Pflicht    |
| `C`    | Grünland              | 55–65         | 550–650           | 48 × 48      | `mountain`          | Kontorplatz + ≥ 300 Gras, ≥ 100 Wald, 1 Platz Steinbruch | **zuerst** |

- Garantien für C (Gras, Wald) sind **Vorschlag Spec**; lead-design bestätigt sie im Gate Spec.
- Heimat: `kind 'home'`, Name „Heimat" (`sea.ts` `HOME_NAME`), keine `traits`; trägt nie `spice`.
- „Platz" = eine Lage, an der `canPlace` für das Gebäude auf der frisch erzeugten Insel `ok` liefert (Plätze
  überlappen nicht). Merkmal `spice` ist ein Inselmerkmal, kein Kachelterrain.
- Wird C gestrichen, entfällt die Zeile; `ISLANDS` hat dann zwei Einträge, die Save-Prüfung zählt
  `1 + ISLANDS.length`. Erz und Minen sind gestrichen (Vorschlag §6).
- Namen sind eigene, allgemeine Wörter (ADR-006); lead-design bestätigt sie im Gate Spec.

## B. Generator (`src/sim/islands.ts` neu, [Tech] Name)

- **Eigener Zufallsstrom:** eine Instanz `createRng((seed ^ ISLANDS_SALT) >>> 0)` für alle Fremdinseln, in der
  Reihenfolge A, B, C; `ISLANDS_SALT` neue Konstante in `sea.ts`, verschieden von Auftrags- und Krisen-Salz. `seed`
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
- **Rahmen:** Achsenparalleles Rechteck um alle Inseln mit `W + H ≤ 440` Kacheln; damit passt der ganze Archipel bei
  Zoom 0,125 in 1920 × 1080 (Breite `(W + H) · 32 · 0,125 ≤ 1760`, Rand für Gebäudehöhen).

## C. Save-Felder E1 (Teil von v8)

`Island` + `kind`, `ox`, `oy`, `anchor { x, y }`; `kontorId: number | null` (null nur bei Fremdinsel ohne Kontor).
Fremdinseln entstehen in `createWorld` und bei der Migration v7 → v8 aus `world.seed`; ihr `stock` hat alle Güter 0.
Name, Merkmale und Fahrzeit kommen aus `ISLANDS` bzw. `seaLanes`, nicht aus dem Save.

## D. Darstellung

- **Weltkoordinaten:** Kachel `(x, y)` der Insel `i` liegt im Archipel bei `(ox + x, oy + y)`; Projektion wie heute.
  Heimat mit `(0, 0)` → Heimatbild unverändert.
- **Offenes Meer:** eine gezeichnete Fläche hinter allen Inseln (eine Füllung je Frame, keine Kacheln). Farbe und
  Muster [Art], Bedingung: Übergang zum Wasserrand der Inselcaches ohne sichtbare Kante bei Zoom 1 (Sichtprüfung).
- **Reihenfolge:** Meer → Inseln nach Tiefe (`ox + oy` aufsteigend, dann Index) → je Insel wie heute. Schiffe auf See
  nach den Böden, vor den Sprites der Insel, an der sie liegen [Art].
- **Terrain-Cache je Insel** (`buildTerrainLayer` je Insel, eigener Eintrag in `limits.ts`):
  - Heimat **sofort** zum Erstbild (wie heute).
  - Fremdinseln **im Leerlauf nach dem Erstbild**, eine je Leerlauf-Slot (`requestIdleCallback`, sonst
    `setTimeout(0)`), Reihenfolge A, B, C. Wird eine Insel sichtbar, bevor ihr Cache steht, wird sie im selben Frame
    gerastert (Notfall), bis dahin nichts gezeichnet.
  - **Begründung:** Erstbild-Budget (`buildMs` ≤ +30 %) bleibt bei der Heimat allein; „beim ersten Sichtkontakt"
    hätte beim Schwenken einen Ruckler von der Grösse eines Insel-Aufbaus (bei C ≈ 56 % des Heimat-Aufbaus), der
    Leerlauf-Weg erledigt alles in den ersten Sekunden ohne Ruckler. Speicher zusätzlich bei Faktor 1: A ≈ 2,4 MB,
    B ≈ 5,3 MB, C ≈ 9,4 MB (≈ 17 MB), bekannt und begrenzt.
- **Culling je Insel** (reine Mathematik, `src/render/camera.ts`): `visibleIslands(camera, view, islands)` liefert
  die Inseln, deren projiziertes Rechteck (plus Sprite-Rand `H_TOWER`) den Ausschnitt schneidet;
  `visibleTileRange` je Insel in Inselkoordinaten. Unsichtbare Inseln erzeugen keinen Zeichenaufruf.
- **Picking:** Bildschirm → Archipel-Kachel → `(insel, x, y)` oder `null` (offenes Meer, zwischen Rechtecken oder
  Wasserkachel ausserhalb jeder Insel). Kamera-Grenze: Archipel-Rahmen + 8 Kacheln.
- **Zoom:** `ZOOM_STEPS` (`src/render/iso.ts`, Render-Konstante) erhält `0.25` und `0.125`; Mindestzoom 0,125.
  Unter Zoom 0,5 darf eine Detailstufe Figuren, Tiere und Wetterteilchen weglassen [Art].
- **Mouse-over Insel:** über Land einer Fremdinsel (Auswahl-Werkzeug) Karte „Name · B × H · Merkmale · Fahrzeit
  m:ss" (Fahrzeit `10 × d(0, i)` Ticks bei Tempo 1); vor U6 zusätzlich „Seefahrt mit den Kaufleuten" (E2).

## E. Messprotokoll Render (A/B mit `tools/render-qa/perf.mjs`)

E1 erweitert `perf.mjs` um `--zoom <z>` und `--focus home|archipel` (`home`: Heimatkontor in der Mitte; `archipel`:
Rahmenmitte); die Dev-Sonde liest Kacheln nach E0 über `islands[0]`. Bedingungen wie Stilrahmen §5: DPR 2,
1920 × 1080, `--runs 3`, abwechselnd A/B, Median der Mediane; Seeds 14 (H-R9) und 3.

| Messung | A                    | B                                       | Grenze                                                                    |
| ------- | -------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| R1      | main, Zoom 1, `home` | E1, Zoom 1, `home` (nur Heimat im Bild) | `renderMedian` B − A ≤ +0,2 ms                                            |
| R2      | main                 | E1                                      | Heimat `buildMs` B ≤ A × 1,3 (Erstbild, nur Heimat gerastert)             |
| R3      | E1, Zoom 1, `home`   | E1, Zoom 0,125, `archipel`              | `renderMedian` B ≤ 2 × A (**Vorschlag, lead-art bestätigt im Gate Spec**) |
| R4      | —                    | E1, `archipel`, Leerlauf-Rasterung      | kein Frame > 50 ms nach dem Erstbild bis alle Caches stehen [Art: Zahl]   |

## F. Streichvariante B (Rückfall der Darstellung)

Schalter `ARCHIPEL_VIEW: 'sea' | 'jump'` in `src/render/` (Render-Konstante, kein Spielwert). Bei `'jump'`: nur die
aktive Insel wird gezeichnet, kein Meer dazwischen, Kamera-Grenze = Inselrechteck, Inselwechsel nur per Kamerasprung
(E2). `src/sim/`, Save und `src/ui/` ändern sich dafür nicht (AK-E1-12).
