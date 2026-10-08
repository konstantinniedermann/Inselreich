# ART-WALD-RAUTEN — Implementation Plan

> R352, Stufe leicht, Fehlerbehebung Darstellung (kein Kurzdesign). Lead: lead-art. Meilenstein REL-09.
> Fassung 2 nach Gate R355 (B9–B13 eingearbeitet).
> Quelle: `docs/beobachtungen.md` (ART-WALD-RAUTEN; Bildbefund „Meeresfelsen wie Boote"; Konsolen-Warnung `willReadFrequently`).

## Ziel

Die Landfarben- und Waldkanten wirken heute rasterartig (Rauten): Waldmaske, Wiesen-Tonflecken, Gras/Sand-Treppe,
Sand-Stufen, Gebirgs-Fussring, Schaum ohne Objekt. Ursache (Hypothese, in T00 zu bestätigen): Typ- und Saumfelder liegen
auf dem groben Knotenraster (`RASTER` = 4 Texturpixel, `terrain.ts`) und werden bilinear gelesen (`landShares`,
`paintPixels`); Schwellen und Tonstufen nach der Interpolation legen die Kanten auf die Zellen, die in der Isometrie als
Rauten erscheinen. Dazu: Meeresfelsen bei Zoom 0,5 wirken wie Boote; Konsolen-Warnung `willReadFrequently`.

## Global Constraints

- `src/render/` schreibt nie in die Welt; keine Änderung in `src/sim/` (Felder entstehen render-seitig aus `terrainFields`). Falls die Ursache in der Welterzeugung (`src/sim/islands.ts`) liegt: stoppen, Entscheidungsfrage an L0 (Überschneidung mit SEE-F1-FAHRLINIE).
- Determinismus: nur Seed-abgeleitetes Rauschen (`hash2`/vorhandene Salze, neue Salze in `decor.ts`-Kopfliste eintragen), kein `Math.random`.
- Perf nicht schlechter: Kaltstart Seed 7 ≈ 8,3 s (PERF-L57) darf um höchstens Messrauschen (±3 %) steigen; Warm-Frame unverändert. Mehrkosten pro Pixel nur in `paintPixels` (Kaltstart-Pfad), nichts im Frame.
- Messläufe nur einzeln bei 1-min-Load ≤ 4 (R329); im Bericht die Zahl der Hintergrund-Läufe nennen (E-037). Geplant: 2 Kaltstart-Messungen (vorher/nachher), 2 Galerie-Läufe je Bildrunde, alle `run_in_background: true` wenn > 4 min.
- Höchstens 2 Bildrunden (Galerie-Vergleich vorher/nachher + Nachbesserung).
- Keine neuen Abhängigkeiten, keine Assets (alles prozedural; keine Lizenzfrage).
- `make check` grün; Balancing-Test unberührt.

## Branch und Worktree

Worktree `.worktrees/wald-rauten`, Branch `fix/wald-rauten` (von main). Merge nur über Gate Merge (lead-art prüft, L0 entscheidet).

## Datei-Ownership (Strang ART-WALD-RAUTEN)

| Datei                                                                                                                                                                                                                        | Task          | Eigner                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------- |
| `src/render/terrain.ts`                                                                                                                                                                                                      | T02, T03      | Umsetzer A (T00–T03, T05) |
| `src/render/terrainField.ts`, `src/render/woodField.ts`, `src/render/saum.ts`, `src/render/dunes.ts`, `src/render/ring.ts` (nur wenn T00 sie als Kantenquelle belegt)                                                        | T02           | Umsetzer A                |
| `tests/render/rauten.test.ts` (neu), `tests/render/terrain*.test.ts`, `tests/render/dunes.test.ts`, `tests/render/saum.test.ts`                                                                                              | T01, T02, T03 | Umsetzer A                |
| `src/render/water.ts` (Schaum ohne Objekt, Meeresfels-Schaum), `src/render/decor.ts`/`decorStamps.ts` (Meeresfels-Stempel), `tests/render/decorSea.test.ts`, `tests/render/decorStamps.test.ts`, `tests/render/seaRender.ts` | T04           | Umsetzer B                |
| `docs/beobachtungen.md` (nur eigene Zeilen), `docs/arc42.md` (nur falls Modulbeschreibung betroffen)                                                                                                                         | T06           | lead-art                  |

Nicht anfassen: `src/ui/**`, `src/sim/**`, `src/render/ship.ts`, `src/render/shipLane.ts`, `src/render/renderer.ts`, `tests/render/ship*.test.ts`,
`tests/render/renderer.test.ts`.

Welle 1: `src/render/decor.ts` und `tests/render/decorSea.test.ts` gehören diesem Strang; SEE-F1 wartet mit seinem T3 auf unseren Merge. Umsetzer B meldet daher **früh** (Handoff/Bericht an lead-art direkt nach T04), lead-art meldet an L0.

## Überschneidungen mit Parallelpaketen

- **SEE-F2-UX** (`src/ui/`): keine Überschneidung (disjunkt).
- **SEE-F1-FAHRLINIE** (`src/sim/islands.ts`, Schiffspose in `src/render/`): disjunkt, solange wir `ship.ts`, `shipLane.ts`, `renderer.ts` meiden. Berührungspunkt `water.ts` (Schiffs-Kielwasser?): vor Beginn von T04 `grep -n ship src/render/water.ts`; gibt es Treffer, Änderung auf den Schaum-Teil beschränken und lead-tech per Handoff informieren. Berührungspunkt Welt: `terrainFields` liest Inselfelder aus `src/sim/islands.ts` nur lesend; ändert FAHRLINIE dort Feldformen, ist die Rauten-Metrik (T01) neu zu messen.
- Merge-Reihenfolge ohne Abhängigkeit; Konflikte nur in `docs/beobachtungen.md` möglich (Zeilen getrennt halten).

## Tasks

Umsetzer A und B laufen parallel (disjunkte Dateien); Galerie-/Messläufe einzeln.

### T00 — Diagnose und Vorher-Basis (A, danach B liest mit)

1. Worktree anlegen, `make check` grün bestätigen.
2. Vorher-Galerie: `node tools/render-qa/galerie.mjs --out <scratch>/vorher --root .worktrees/wald-rauten --seeds 1,2,5,7 --motive wald,gebirgsfuss,kueste,wiese,gesamt` (inkl. Zoom 0,5 und `--zoom-extra`). Ein Lauf.
3. Kaltstart Seed 7 messen (`tools/render-qa/kalt.mjs`), Wert als Basis notieren.
4. Je Kantenart (Waldmaske, Tonflecken, Gras/Sand, Sand-Stufen, Fussring, Schaum) die erzeugende Funktion benennen (`landShares`, `paintPixels`, `duneContrast`, `saumAt`, Fussring in `ring.ts`/`massif.ts`, Schaum in `water.ts`/`saum.ts`) und das Ursachen-Urteil (Knotenraster bilinear vs. Stufung) in einer Notiz im PR/Plan-Anhang festhalten.

- **AK-T00:** Vorher-Bilder liegen vor; Ursache je Kantenart benannt; Dateiliste von T02 bestätigt oder korrigiert (Abweichung = Meldung an lead-art vor Weiterarbeit).

### T01 — Testfirst: Rautigkeits-Metrik (A)

Neu `tests/render/rauten.test.ts`. Der Test ruft **dieselbe reine Abtastfunktion wie `paintPixels`** (in T01 aus `paintPixels` als exportierte reine Funktion herausgelöst, z. B. `sampleShares(grid, fx, fy)`; `paintPixels` ruft sie selbst, keine Kopie). Metrik je Kantenart auf Pixelauflösung (Fenster Seed 1, 2, 7): Anteil der Kantenschritte entlang der Knotenzellen-Achsen und mittlere Länge gerader Kantenstücke. Gemessen werden **Wald/Wiese (Waldanteil 0,5)** und **Gras/Sand (Sandanteil 0,5)** sowie die Sand-Stufen (Töne vor/nach Stufung); Fussring und Schaum sind nur Bildprobe (T06).

- Schwelle wird **vor T02** festgelegt: erst Messung am unveränderten Code, Schwelle mit Reserve (mind. 30 % unter dem Ist), dann der rote Lauf als **eigener Commit** („test: Rauten-Metrik rot") im Branch, erst danach T02.
- **AK-T01:** Test ruft die gemeinsame Abtastfunktion; roter Lauf committet (Hash im Bericht); deterministisch.

### T02 — Kanten brechen: pixelfeine Verwerfung und weiche Interpolation (A)

In `terrain.ts` (und nur den in T00 belegten Quellen) vor dem bilinearen Lesen die Abtastposition je Pixel um eine kleine, seedbasierte Rauschverschiebung (Amplitude unter einem Knoten, feine Wellenlänge) versetzen; Stufung der Sand-Töne und Schwellen der Wiesen-Tonflecken erst nach der Verwerfung anwenden, damit Stufen keine Zellkanten nachzeichnen; Gebirgs-Fussring und Küstenschaum-Anteil an derselben Verschiebung teilen, damit Ringe und Landkanten übereinstimmen. Kein zweites Raster, kein Mehrfachdurchlauf.

- **AK-T02a:** `rauten.test.ts` grün (Wald/Wiese, Gras/Sand und Sand-Stufen unter der Schwelle, 3 Seeds). Gebirgs-Fussring und Schaum ohne Objekt: AK ist die Bildprobe (T06, Galerie `gebirgsfuss`, `kueste`), kein Metriktest.
- **AK-T02b:** Bestehende Tests grün; `tests/render/terrain*.test.ts` und Farbtests (`goodColors`, `groundBeach`) ohne Schwellenänderung ausser begründeten Einzelfällen, die im Bericht stehen.
- **AK-T02c:** Terrain-Felder bleiben bitgleich bei gleichem Seed (Wiederholungstest) und `patchGrid`/`updateTerrainLayer` liefern an Rändern keine Naht (Test: Patch vs. Vollaufbau gleiche Pixel im Überlapp).
- **AK-T02d:** Kaltstart Seed 7: `node tools/render-qa/kalt.mjs --a <main> --b .worktrees/wald-rauten --runs 3 --seed 7`, Median B ≤ Median A + 3 %.

### T03 — Trivial-Fix `willReadFrequently` (A, `terrain.ts`)

Nur Kontexte, deren Fläche per `getImageData` zurückgelesen wird (`repaintFarWater`, `paintQuarterStrip`-Pfad: `quarter`/`half`), mit `{ willReadFrequently: true }` anlegen; die grosse Bodenebene und alles, was per `drawImage` zur GPU geht, bleibt ohne Flag (Flag erzwingt Software-Raster).

- **AK-T03a:** Test mit Fake-Kontext: `getContext('2d', …)`-Argument der Rücklese-Flächen enthält `willReadFrequently: true`, das der Bodenebene nicht.
- **AK-T03b:** Prüfweg Konsolen-Warnung: Umsetzer A lädt Seed 7 per `tools/render-qa/lib.mjs`/`sitzung.mjs` (Headless-Chrome, CDP `Runtime.consoleAPICalled` und `Log.entryAdded` mitlesen) in main und im Worktree; Ergebnis: Warnung in main vorhanden, im Worktree null Treffer. Wer: Umsetzer A (einmalig 2 Seitenladungen, kein eigenes Werkzeug-Commit nötig, Skript im Scratchpad). Kaltstart wie AK-T02d.

### T04 — Meeresfelsen bei Zoom 0,5 und Schaum ohne Objekt (B)

Bildbefund: Fels + Schaumring ergibt bei Zoom 0,5 eine Bootssilhouette (länglich, hell umrandet). Mittel (kleinstes zuerst): Schaumring unregelmässig und enger an den Fels binden; Fels höher/zackiger und dunkler als Bootsrumpf; bei Zoom < 0,7 kein längliches Stempelmass. Schaum ohne Objekt (Schaum, wo weder Küste noch Fels): Quelle in T00 benennen, auf Objekte beschränken. Zoom-Schwellen nur über den bestehenden `zoom`-Parameter (`water.ts`), kein Eingriff in `renderer.ts`. **Neue Salze in `decor.ts` legt nur Umsetzer B an** (L0-Entscheid B13); A braucht er für T02 keine, sonst Bitte an B.

- **AK-T04a:** Test (Fake-Kontext/`seaRender.ts`): Meeresfels bei Zoom 0,5: Breite : Höhe ≤ 1,3 : 1 (Silhouette inkl. Schaumring); Schaum nur an Fels/Wrack/Eiland/Küste (kein Schaum an Wasserkachel ohne Objekt).
- **AK-T04b:** Bildprobe Zoom 0,5 und 1 (Galerie `kueste`, `gesamt`): Fels und Boot unterscheidbar, Schiff (Seefahrt) bleibt als Schiff lesbar. Review durch lead-art.

### T05 — Gischt-Sichtprüfung (A, beim Galerie-Lauf)

`drawFallSparks` wird inzwischen in `renderer.ts` (Zeile 809) gerufen; der Eintrag „nie vom Renderer gerufen" in ART-C7-ANSCHLUSS ist insoweit veraltet. Beim Galerie-Lauf einen Seed mit Wasserfall im Bild (Motiv `gebirgsfuss`) prüfen: Funken sichtbar, nicht zu hell/gross.

- **AK-T05:** Befund (sichtbar ja/nein, Auffälligkeit) im Bericht; Änderung am Code nur, wenn offensichtlicher Fehler, sonst Beobachtungs-Eintrag.

### T06 — Nachher-Galerie, Reviews, Doku (lead-art)

**Reviews (Pflicht, B9):** je Umsetzer (A, B) ein `qa-code-reviewer` (sonnet) auf den jeweiligen Diff gegen Plan und AK; danach **Final-Review mit `model: opus`** (`qa-code-reviewer`) über die ganze Branch. Fixes der Reviews per SendMessage an den Umsetzer.

Nachher-Galerie (Bildrunde 1), Vergleich mit T00; bei Mängeln eine Nachbesserung und Bildrunde 2, dann Schluss. Bildrunden: Zuordnung Fussring und Schaum siehe T02. Beobachtungen aktualisieren (ART-WALD-RAUTEN geschlossen bzw. Rest; ART-C7-ANSCHLUSS Teilpunkte Meeresfelsen/Gischt streichen). `docs/arc42.md` nur bei geänderter Modulbeschreibung.

- **AK-T06:** Gate-Merge-Unterlagen: Vorher/Nachher-Bilder, Kaltstart-Mediane, drei Review-Urteile (A, B, Final opus); Anzahl Hintergrund-Läufe im Bericht.

## Abdeckung

| Befund                                                  | Task          |
| ------------------------------------------------------- | ------------- |
| Waldmaske, Tonflecken, Gras/Sand, Sand-Stufen, Fussring | T00, T01, T02 |
| Schaum ohne Objekt                                      | T00, T04      |
| Meeresfelsen wie Boote (Zoom 0,5)                       | T04           |
| `willReadFrequently`                                    | T03           |
| Gischt-Sichtprüfung                                     | T05           |

## Budgetantrag

Freigabe R355: 170 Tools gesamt.

| Posten                                             | Umfang                                                                                                                            |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `art-rendering-engineer` A (T00–T03, T05), sonnet  | 1 Start, ≤ 55 Tools                                                                                                               |
| `art-rendering-engineer` B (T04), sonnet           | 1 Start, ≤ 30 Tools; parallel zu A nur, wenn studioweit ≤ 4 andere Arbeiter laufen (R241), sonst seriell (B zuerst, wegen SEE-F1) |
| `qa-code-reviewer` A, B (sonnet)                   | 2 Starts, je ≤ 15 Tools                                                                                                           |
| `qa-code-reviewer` Final (**opus**)                | 1 Start, ≤ 25 Tools                                                                                                               |
| lead-art (Galerie-Sichtung, Gate, Doku, Fixrunden) | ≤ 30 Tools                                                                                                                        |
| Messläufe                                          | Kaltstart 1 Messung (3 Läufe/Seite), Galerie je Bildrunde 1; einzeln, Last ≤ 4 (R329)                                             |
| Gesamt                                             | 5 Starts, ≤ 170 Tools                                                                                                             |

Grösse der Assets: unverändert (keine Dateien unter `public/`).
