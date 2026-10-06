# M12 Teil E1 „Archipel: Inseln erzeugen und darstellen" — Implementation Plan (Index)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`)
> syntax. Arbeiter bekommen nur ihre Task-Datei und die AK-IDs, nie diesen Index als Ganzes.

**Goal:** Zwei Fremdinseln (A „Möweninsel", B „Felsbucht") entstehen deterministisch aus `world.seed`, liegen im
Save v8 und sind ab Spielstart im Meer um die Heimat zu sehen; die Kamera zoomt bis 0,125 über den ganzen Archipel.
Nichts ist dort baubar (E2).

**Architecture (≤ 15 Zeilen):**

1. `src/sim/islands.ts` (neu, rein): `generateForeignIslands(seed)`, `homeAnchor(…)`, `seaLanes(islands)`; eigener
   Strom `createRng((seed ^ ISLANDS_SALT) >>> 0)`, Werte in `src/sim/defs/sea.ts` (neu).
2. `Island` + `kind`, `ox`, `oy`, `anchor`; `kontorId: number | null`. `createWorld` hängt A, B an; Heimat bleibt
   bitgleich (`generateMap` unverändert). Save v8 mit `migrateV7ToV8` (wirft nie), Ladeprüfung v8.
3. Archipel-Koordinaten: Kachel `(x, y)` der Insel `i` liegt bei `(ox + x, oy + y)`. Weil `project` linear ist, zeichnet
   der Renderer jede Insel mit einer **Inselkamera** `islandCam(cam, isl)` (Kamera um `project(ox, oy)` verschoben)
   in Inselkoordinaten — die Heimat (0, 0) bekommt dieselbe Kamera, ihr Bild und ihre Aufrufliste bleiben gleich.
4. **Inselansicht** `islandView(world, i)`: für `i = 0` die Welt selbst; sonst `Object.create(world)` mit eigenen
   `islands: [isl]`, `buildings: {}`, `seed` (Render-Variante). Damit laufen Terrain, Wasser, Massiv, Bäume, Leben
   unverändert je Insel. Nur lesend; E2 (Gebäude auf Fremdinseln) verallgemeinert `buildings` (Übergabe-Hinweis).
5. `src/render/archipel.ts` (neu, rein): `visibleIslands`, `pickArchipel`, `archipelBounds`, `islandCam`,
   `ARCHIPEL_VIEW`; `camera.ts`: Klemmung an ein Rechteck, Zoom 0,125 … 2.
6. Terrain je Insel: Heimat sofort, Fremdinseln im Leerlauf über einen reinen **Cache-Plan** (`cachePlan.ts`, Uhr
   injiziert) in Schritten ≤ 8 ms, Notfall synchron; Meerkante (äusserste 2 Kacheln = `waterDeep`), Viertel-Kopie,
   Detailstufe ≤ 0,25. Speicher in `limits.ts`.
7. Messung R1–R5 mit erweitertem `perf.mjs` (`--zoom`, `--focus home|archipel`, Aufwärmen, Frame-Maximum).

**Tech Stack:** TypeScript, Vite, Vitest, Canvas 2D. Keine neue Abhängigkeit (ADR-001).

**Status:** Gate Plan mit BEDENKEN bestanden (**R231**), Plan-Nachtrag R231 eingearbeitet (Abschnitt „Nachtrag R231“). Prozessstufe voll. **Spec:** `docs/superpowers/specs/2026-10-05-m12-weite-welt-spec.md`
§5, §9 mit Anhang 02 (E1), Anhang 03 B (Save v8), Anhang 04 (AK E1, AK-M12-B1…B5, Auflagen), Stand
`docs/m12-brainstorming` @ **fbeebca** (D-139, in diese Branch gemerged). Rulings: R226–R231, R74.
Basis-Plan: E0 (`feat/m12-e0`, `docs/superpowers/plans/2026-10-05-m12-e0-inseln/`). Testnamen beginnen mit der
AK-Nummer, `describe('M12 E1 …')`.

## Global Constraints

- **Basis:** `feat/m12-e1` von `feat/m12-e0` @ 593b77d; nur **Merge**, nie Rebase (Verfassung §6.3). `feat/m12-e0`
  wird von E1 nie beschrieben.
- **Merge-Fluss (R231 prod-B2):** nur `main` → `feat/m12-e0` → `feat/m12-e1`. E1 holt REL-03 **über E0** (E0 merged
  `main`, dann E1 `feat/m12-e0`); E1 merged `main` direkt **nur per L0-Ruling**. Erst nach dem E0-Merge auf `main` holt
  E1 nur noch `main`. Feste Merge-Punkte E0 → E1: vor T00 (ab E0-T03), vor T02 (ab E0-T05, Review OK), vor T03/T04
  (E0 enthält REL-03), vor T08 (E0 fertig). Ändert E0 nach dem T02-Merge noch `src/sim` (E0-T06, Final-Review), merged
  E1 neu und der T02-Reviewer prüft nach (R231 prod-B1).
- **Reihenfolge:** Sim-Teil T00 nach **E0-T03**, T02 nach **E0-T05** (Review OK); alle **Render-Tasks T03–T08 sind
  `blocked-by` REL-03 auf `main`** (R228, R230), geholt über E0. Merge-Reihenfolge auf `main`: REL-03 → E0 → E1.
  Fällt H-R12b aus REL-03, wartet H-R12b bis E1 auf `main` ist (`blocked-by` auf dem Board, R231 prod-B3).
- **Bitgleich (AK-M12-B1…B4):** `git diff main -- tests/sim/balance.test.ts` leer; `OFF_REFERENCE`,
  `OFF_FINGERPRINT 0x701c6da5`, „normal"/„mild" 7850, `balance-merchants` `[6750, 11200, 320]`, Zufallsfolge (AK-E0-19)
  unverändert. Erlaubt ist nur, dass `normalized()` die v8-Felder entfernt. Weicht ein Pin ab: **nicht nachstellen**,
  anhalten, Meldung Controller → lead-tech → L0 (R74).
- `src/sim/` DOM-frei, deterministisch; der einzige neue `createRng`-Aufruf ist der Inselstrom (`ISLANDS_SALT`).
  Spielwerte nur in `src/sim/defs/sea.ts`; Render-Konstanten (`ARCHIPEL_VIEW`, `LOD_ZOOM`, `SLICE_MS`) in `src/render/`.
  `src/render/` schreibt nie in die Welt. Migrationen und `deserialize` werfen nie.
- Je Task: Test-Commit (rot, Rot-Beleg im Commit-Text) und Umsetzungs-Commit getrennt; `make check` und
  `CI=true make check` grün am Task-Ende. Präfixe `test:`, `feat:`, `refactor:`, `docs:`. Prettier über alle Dateien.
- Befunde ausserhalb Scope → `docs/beobachtungen.md`. Keine Issues.

## Entscheide des Plans

| Nr. | Entscheid                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-1 | **`d` (entschieden D-139, R231):** aufgerundete Länge des Teils der Fahrlinie **ausserhalb aller Inselrechtecke** (offene See). Grund: Heimatanker liegt 13–31 Kacheln (Median 20, Seeds 1…200 gemessen) im Heimatrechteck; mit Anker-zu-Anker-Länge ist das Band 25–30 für die Mehrheit der Seeds unerfüllbar.                                                                                                                       |
| P-2 | Inselgrösse **fest = Höchstgrösse** (A 24 × 24, B 36 × 36); Wasserrand `ISLAND_RIM = 4` (Land nur in `[4, n − 5]`), damit die Meerkante (2 Kacheln `waterDeep`, 2 Kacheln Übergang) nie an Land stösst. A hat kein Gebirge (Merkmal fehlt): Gebirge → Wiese.                                                                                                                                                                          |
| P-3 | Garantien in E1 über **reine Geländeprüfung** `siteFits(tiles, w, h, fp, x, y)` mit Fussabdruck und `site` aus `ISLAND_SITES` (`sea.ts`: Kontor = `kontor`-Regeln, Plantage = 2 × 2 `radius grass r2 min4 free`, Steinbruch = `quarry`-Regeln). Die Kreuzprobe per `canPlace(…, island)` macht T02 für `quarry`; `kontor2`/`spicefarm` gibt es erst in E2/E3 — deren Pläne prüfen dieselben Plätze per `canPlace` (Übergabe-Hinweis). |
| P-4 | Zugfolge im Inselstrom: je Insel (A, dann B) zuerst Form-Versuche (`noiseSeed = floor(rng() · 2³¹)` je Versuch), dann Lage-Versuche (Winkel, Abstand). Ersatzform und Ersatzlage je `kind` fest in `islands.ts`.                                                                                                                                                                                                                      |
| P-5 | **B6:** `createWorld` **gesamt** ≤ 5 ms je Aufruf (`perfBudget(5)`, Mittel Seeds 1…50; Spec-Wortlaut, R231 qa-B5); Längen mit `Math.sqrt(dx*dx+dy*dy)`, nie `Math.hypot`. Kaputter `seed` (kein endlicher Wert) → `migrateV7ToV8` setzt keine Fremdinseln, Ladeprüfung meldet „Beschädigter Spielstand".                                                                                                                              |
| P-6 | Ladeprüfung v8: Fremdinsel-`kontorId` muss in E1 `null` sein (`kontor2` existiert erst ab E2; E2 erweitert die Regel nach Anhang 03 B). Gebäude auf einer Fremdinsel mit `kontorId null` laden (AK-E1-06).                                                                                                                                                                                                                            |
| P-7 | Inselkamera + Inselansicht (Architektur 3, 4) statt Inselparameter in allen Zeichnern: Heimat-Aufrufliste bleibt gleich (AK-E1-10), Rückfall billig. ADR-013-Nachtrag in T08.                                                                                                                                                                                                                                                         |
| P-8 | Cache-Plan in Schritten (Felder, Gitterfenster, Malbänder zu `SLICE_ROWS = 32` Pixelzeilen, Deko, Halb-, Viertel-Kopie); ein Leerlauf-Slot führt Schritte aus, solange `verstrichen + teuersterSchritt ≤ SLICE_MS (8)`. So hält jede Scheibe 8 ms, auch wenn ein `CHUNK`-Band (512 Zeilen) allein länger braucht.                                                                                                                     |
| P-9 | Messbedingungen (QA Teil B, AK-E1-19): Entwickler-Mac (CPU-Modell und Node-Version druckt `perf.mjs` mit), Headless-Chrome, DPR 2, 1920 × 1080, Seeds 14 und 3 **einzeln ausgewiesen**, `--runs 3` abwechselnd A/B; Aufwärmen R3: warten bis `cachesReady()`, dann 5 s bei Zielzoom, dann 15 s Messfenster.                                                                                                                           |

## Task-Tabelle

| Task | Titel                                                | Datei                                            | AK-IDs                                           | Strang    | blocked-by             | Implementierer / Modell                   | Schätzung |
| ---- | ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------ | --------- | ---------------------- | ----------------------------------------- | --------- |
| T00  | Schritt 0: Fixture `save-v7.json`, Pins              | [T00-schritt-0.md](T00-schritt-0.md)             | Vorbed. AK-E1-05, AK-M12-B5                      | sim       | Gate Plan, E0-T03      | tech-sim-engineer / sonnet                | 25 Tools  |
| T01  | Generator, Lage, Fahrlinien (`islands.ts`, `sea.ts`) | [T01-generator.md](T01-generator.md)             | AK-E1-01 (Gelände), -02, -04; B6 Teil            | sim       | T00, D-139 ✓ (R231)    | tech-sim-engineer / sonnet                | 55 Tools  |
| T02  | Save v8, `createWorld`, Migration, Ladeprüfung       | [T02-save-v8.md](T02-save-v8.md)                 | AK-E1-01 (canPlace), -03, -05, -06; B1–B5; qa-B4 | sim       | T01, **E0-T05** (OK)   | tech-sim-engineer / sonnet                | 60 Tools  |
| T03  | Kamera, Culling, Picking, Zoom (rein)                | [T03-kamera-archipel.md](T03-kamera-archipel.md) | AK-E1-07 … -09, -12/-13 (Teil), -17 (Vitest)     | render    | T02, **REL-03** via E0 | tech-ui-engineer / sonnet                 | 45 Tools  |
| T04  | Terrain je Insel: Meerkante, Cache-Plan, Speicher    | [T04-terrain-cache.md](T04-terrain-cache.md)     | AK-E1-11, -20, -21                               | terrain ∥ | T02, **REL-03** via E0 | tech-ui-engineer / sonnet                 | 55 Tools  |
| T05  | Renderer: Archipel zeichnen, Detailstufe             | [T05-renderer.md](T05-renderer.md)               | AK-E1-10, -12, -22                               | render    | T03, T04               | tech-ui-engineer / sonnet                 | 55 Tools  |
| T06  | UI: Leerlauf-Rasterung, Zoom, Kamera, Mouse-over     | [T06-ui.md](T06-ui.md)                           | AK-E1-11 (Verdrahtung), -13, -17 (Teil); Sonde   | render    | T05                    | tech-ui-engineer / sonnet + qa-playtester | 45 Tools  |
| T07  | Messung R1–R5, Sichtprüfung                          | [T07-messung.md](T07-messung.md)                 | AK-E1-14 … -19                                   | render    | T06                    | tech-ui-engineer / sonnet + qa-playtester | 45 Tools  |
| T08  | Abschluss: Doku, Proben, Final-Review                | [T08-abschluss-doku.md](T08-abschluss-doku.md)   | AK-M12-B1 … B5 (Nachweis), Doku                  | render    | T07, E0-T06            | tech-sim-engineer (D1) / sonnet           | 30 Tools  |

Je Task danach `qa-code-reviewer` (sonnet, Urteil OK/BEDENKEN/ZURÜCK, ~10 Tools). **Final-Review durch `lead-qa`**
auf **opus** über die ganze Branch (wie R229 qa-B1). Abdeckung AK → Task: [abdeckung.md](abdeckung.md).

## Datei-Ownership

| Strang / Worktree                                                                                                                                                                           | Dateien                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Tasks        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| sim · `feat/m12-e1` · `.worktrees/m12-e1`                                                                                                                                                   | neu `src/sim/islands.ts`, `src/sim/defs/sea.ts`; `src/sim/types.ts`, `world.ts`, `save.ts`; `supply.ts`, `roads.ts`, `queries.ts` u. a. (nur `kontorId`-`null`-Fälle, T02); `tests/sim/islands-gen.test.ts` (neu), `islands-rng.test.ts` (neu), `save.test.ts`, `balance-crises.test.ts` (nur `normalized`), `helpers.ts` (`foldBackToV7`), `fixtureV7.ts`, `fixtures/save-v7.json`, `e1Pins.ts`                                                        | T00–T02      |
| render · `feat/m12-e1` · `.worktrees/m12-e1`                                                                                                                                                | neu `src/render/archipel.ts`; `src/render/camera.ts`, `iso.ts`, `renderer.ts`; `src/ui/app.ts`, `input.ts`, `hover.ts`, `devProbes.ts`, neu `src/ui/islandCard.ts`, `src/ui/islandLayers.ts`; `tools/render-qa/perf.mjs`; `tests/render/archipel.test.ts` (neu), `camera.test.ts`, `iso.test.ts`, `renderer.test.ts` (`HOME_CALLS` in T03), `tests/ui/islandCard.test.ts`, `tests/ui/islandLayers.test.ts` (neu), übrige `tests/ui/*` bei Signaturbruch | T03, T05–T07 |
| terrain · `feat/m12-e1-terrain` · `.worktrees/m12-e1-terrain` (von `feat/m12-e1` nach T02 und E0-Merge mit REL-03; zurück per Merge erst **nach** dem `HOME_CALLS`-Commit aus T03, vor T05) | `src/render/terrain.ts`, `terrainField.ts`, `water.ts`, `limits.ts`, neu `src/render/cachePlan.ts`; `tests/render/terrain.test.ts`, `water.test.ts`, `limits.test.ts` (neu), `cachePlan.test.ts` (neu)                                                                                                                                                                                                                                                  | T04          |
| Doku (D1, E-017)                                                                                                                                                                            | `docs/adr/ADR-013-inselmodell-im-weltzustand.md` (Nachtrag), `docs/arc42.md`, `README.md` (Zoom, Inseln ansehen)                                                                                                                                                                                                                                                                                                                                        | T08          |
| **Nicht anfassen**                                                                                                                                                                          | `tests/sim/balance.test.ts`, `src/sim/mapgen.ts`, `src/sim/rng.ts`, übrige `src/sim/defs/**`, `src/audio/**`, `package*.json`, Branches `feat/m12-e0`, `docs/m12-brainstorming`                                                                                                                                                                                                                                                                         | —            |

T03 und T04 laufen **parallel** (getrennte Worktrees, getrennte Dateien); sonst Parallelität 1.

## Risiken

- **R-1 REL-03/H-R12b:** REL-03 kommt nur über E0 (prod-B2). Fällt H-R12b heraus, wartet es auf E1 (prod-B3), sonst
  doppelte `terrain.ts`-Konflikte mit T04/T05.
- **R-2 E0 noch in Arbeit:** T00 erzeugt `save-v7.json` mit v7-Code ab E0-T03. Ändert E0 danach die v7-Form (Review),
  wird T00 wiederholt (Rezept bleibt). T02 wartet auf E0-T05 (prod-B1); spätere `src/sim`-Änderungen von E0 → Neu-Merge
  und Nachprüfung T02.
- **R-3 Scheiben > 8 ms:** ein unteilbarer Schritt (`terrainFields`, ein Gitterfenster) kann länger dauern; R5 zeigt es,
  Fix-Runde teilt feiner (Fenstergrösse), Grenze wird nicht gelockert.
- **R-4 Meerkante an der Heimat:** Heimatland reicht teils bis Kachel 1; die erzwungene Tiefwasser-Kante ändert dort
  Pixel und ab Zoom ≤ 0,75 (Rand im Bild) auch Wellenstriche der äussersten 4 Kacheln. AK-E1-17 (Sicht, lead-art)
  entscheidet. `HOME_CALLS` (AK-E1-10) entsteht vor dem Terrain-Merge mit Kameras, die den 4-Kachel-Rand nachweislich
  nicht zeigen (Zoom 1 und 2, 1280 × 800); bei Zoom 0,5 ist die Abweichung am Rand gewollt und nicht gepinnt (qa-B1).
- **R-5 R3 ≤ 2 × hart:** bei Zoom 0,125 sind alle Massive und Bäume aller Inseln im Bild. Hebel in T05: Detailstufe;
  reicht das nicht, Meldung an L0 (Streichvariante B, AK-E1-12).
- **R-6 Inselansicht ist E1-eng** (keine Fremdgebäude). E2-Plan muss `buildings` je Insel einführen (Beobachtung in T08).

## Steuerung, Controller-Wechsel (E-010, R190) und Budgetantrag

| Instanz (sonnet) | Tasks (Arbeiter-Starts)                                                                   | Starts | ab                    |
| ---------------- | ----------------------------------------------------------------------------------------- | ------ | --------------------- |
| C1               | T00 (2), T01 (2), T02 (2)                                                                 | 6      | E0-T03; T02 ab E0-T05 |
| C2               | Merge `feat/m12-e0` (mit REL-03); T03 ∥ T04 (4), Merge terrain nach `HOME_CALLS`; T05 (2) | 6      | T02, REL-03 in E0     |
| C3               | T06 (2) + qa-playtester (1), T07 (2) + qa-playtester (1)                                  | 6      | T05                   |
| C4               | T08 Doku-Umsetzer (1) + Review (1), Final-Review an lead-qa (1); Bericht L0               | 3      | T07                   |

**Übergabe:** Ledger `.superpowers/sdd/m12-e1/ledger.md` (SHAs, Urteile, Rot-Belege, Messwerte) und `.studio/handoffs/`.
Braucht eine Instanz einen Ersatz-Implementierer (7. Start), übergibt sie **vor** diesem Start (R229 prod-B3).
**L0 startet die vier Controller-Instanzen ausserhalb der Formel** (wie E0, R231 prod-B4).

**Budget (freigegeben R231):** lead-tech 27, lead-qa 1. Rechnung: `9 Tasks × 2 + 2 QA-Checks + 1 Final-Review = 21`; +30 % = 27,3 → **28 Starts**: lead-tech 27,
lead-qa 1 (Final-Review), Reserve 6 (Ersatz, Nach-Review; der opus-Reviewer von lead-qa im Final-Review geht zu Lasten der Reserve). Parallelität 2 (nur T03 ∥ T04), sonst 1. Fix-Runden per `SendMessage` zählen
nicht. Richtwert **≈ 520 Tools** (Umsetzung 415, Reviews 90, Playtests 25, Final 25 — Steuerung ausserhalb).

## Nachtrag R231 (Gate Plan, ohne Zweitprüfung)

| Punkt         | Umsetzung im Plan                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| D-139         | P-1 entschieden; T01 `seaLength` (Teil ausserhalb aller Rechtecke); Spec fbeebca gemerged                              |
| prod-B1       | T02 `blocked-by` E0-T05 (Review OK); Neu-Merge + Nachprüfung bei späteren E0-`src/sim`-Änderungen (Global Constraints) |
| prod-B2       | Merge-Fluss `main` → E0 → E1; T03/T04/T08 Schritt 0 mergen `feat/m12-e0`, `main` direkt nur per L0-Ruling              |
| prod-B3       | H-R12b wartet bei Ausfall aus REL-03 bis E1 auf `main` (Global Constraints, R-1)                                       |
| prod-B4/qa-B7 | Task-Tabelle (`blocked-by` D-139, E0-T05, E0-T06), Ownership ergänzt; Controller startet L0 ausserhalb der Formel      |
| qa-B1         | `HOME_CALLS` in T03 vor dem Terrain-Merge, Kameras ohne 4-Kachel-Rand (Test prüft das), R-4 benennt Zoom ≤ 0,75        |
| qa-B2         | T06 `createIslandLayers` (rein) mit Vitest zuerst; Browser-Schritt „direkt nach Laden auf 0,125, keine Lücke"          |
| qa-B3         | T03 AK-E1-17 als Vitest Seeds 1…200 (Archipel bei 0,125 in 1280 × 800)                                                 |
| qa-B4         | T02: Fremdinseln nach Migration aus `save-v1` … `save-v6` gleich `createWorld(seed)`, Garantien AK-E1-02 erfüllt       |
| qa-B5         | P-5 „`createWorld` gesamt ≤ 5 ms" (Spec-Wortlaut), T02 gleich                                                          |
| qa-B6         | T06: Quelle des v7-Autosaves = Build von `feat/m12-e0` (bzw. `main`, wenn E0 dort ist), gleiche Origin                 |
