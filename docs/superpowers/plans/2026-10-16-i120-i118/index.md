# Plan I-120 «Wohlstandsklang» + I-118 «Aufstiegs-Funkeln»

Spec: `docs/superpowers/specs/2026-10-16-i120-i118-wohlstand-klang-funkeln.md` (R700, Kurve B, Funkel-Uhr nur bei `speed > 0`) · Stufe leicht · Kein Save, keine Sim-Änderung, keine Assets, keine Abhängigkeit · Balancing-Test unberührt.

## Ziel

Versorgung wird hörbar (Stadtschicht `town` folgt dem Anteil voll versorgter Häuser im Bild), Aufstieg sichtbar (Lichtkranz und Funken am Haus, 1500 ms).

## Architektur (Kern)

- **«Voll versorgt» (Fundstelle, lesend):** `allNeedsMet(house, TIERS[house.tier])` in `src/sim/population.ts:71` (`supplied` und alle Waren `satisfied` und alle Dienste). Genau der Begriff, mit dem die Steuer (`population.ts:244`) und Ziel 3 (`goal3.ts:13`) rechnen. Kein neues Prädikat in `sim/`. `src/render/viewStats.ts` importiert schon aus `../sim/…`, `src/audio/` bekommt nur Zahlen.
- **Teil A Brücke:** `viewStats(...)` (Render) liefert `suppliedShare`/`houses` → bestehender Aufruf `sound.setAmbience({view: viewStats(...)})` in `app.ts` (~1671) bleibt **unverändert**. `ViewStats` in `src/audio/mix.ts` bekommt die zwei optionalen Felder (Spiegel). Kein neuer Import in `src/audio/`.
- **Teil A Klang:** `townFactor` (Kurve B) und `smoothShare` (τ 10 s, Audio-Uhr) rein in `ambience.ts`; Wind +0,15·(1−Faktor) nur bei `houses > 0`.
- **Teil B Zustand:** Aufstiegs-Map `Map<id, tier>` und aktive Liste leben **lokal in `launch()`** (`app.ts`, neben `monumentFlareStart`, ~1508). Laden und «Neue Insel» starten `launch()` neu (`startGame(root, loaded)`), die Map beginnt leer, ein Reset ist nicht nötig (AK-B7 testet `detectRises` mit leerer Map).
- **Funkel-Uhr:** `riseClockMs` in `launch()` wird je Frame um `dt` erhöht, nur wenn `state.speed > 0` (Pause friert ein, AK-B6). `Rise.startMs` auf dieser Uhr. `RenderFx.rises?: {id, startMs}[]` und `RenderFx.riseClockMs?`; der Renderer bleibt zustandslos.
- **Zeichnen:** `drawRiseGlow` in `fx.ts` im additiven Durchgang 10 (nach Feuerschein, vor Flare), darunter bleiben Statusmarken (Signalebene, nach Durchgang 11, `statusMarks.ts`). Deckel `CAPS.riseGlow [6,6]`, `CAPS.riseSparks [8,0]`; Auswahl «6 jüngste» in reinem `pickRises`.

## Datei-Ownership

| Strang   | Persona                  | Worktree/Branch                 | Dateien (exklusiv)                                                                                                                                                                                                                            |
| -------- | ------------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A Audio  | `art-audio-engineer`     | `.worktrees/i120` / `feat/i120` | `src/audio/mix.ts`, `src/audio/ambience.ts`, `tests/audio/ambience.test.ts`, `tests/audio/mix.test.ts`                                                                                                                                        |
| R Render | `art-rendering-engineer` | `.worktrees/i118` / `feat/i118` | `src/render/viewStats.ts`, `src/render/aufstieg.ts` (neu), `src/render/fx.ts`, `src/render/limits.ts`, `src/render/renderer.ts`, `src/ui/app.ts` (nur Aufstiegs-Zustand + `fx`-Felder), `tests/render/{viewStats,aufstieg,fx,limits}.test.ts` |
| D Doku   | Strang R, letzter Task   | wie R                           | `docs/arc42.md` (Modul `aufstieg.ts`, `viewStats`-Felder), `README.md` (ein Satz Spielanleitung); D1-Dateien ausdrücklich erlaubt                                                                                                             |

Beide Stränge teilen **keine** Datei. `ViewStats`-Felder stehen in beiden Spiegeln (`mix.ts`, `viewStats.ts`), die Namen sind in AK-A6/AK-A2 festgelegt; der Typ-Spiegel wird nicht verdrahtet geprüft, sondern über den Test A6/A2.

## Dateimatrix gegen laufende Stränge

| Strang                                                                                                      | Berührt                                                                                           | Konflikt                                                                           | Reihenfolge                                                                               |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| UI-AUFRAEUM-4 (`hud.ts`, `menu.ts`, `eventLogView.ts`, Cache)                                               | keine Datei von A oder R (`app.ts` nicht im Plan)                                                 | keiner                                                                             | beliebig                                                                                  |
| ORT-A (Plan: `iso.ts`, `limits.ts`, `groundDecor.ts`/`decor.ts`, `renderer.ts` nur Durchgang 5, `trees.ts`) | R: `limits.ts` (CAPS-Block, zwei neue Zeilen), `renderer.ts` (Durchgang 10 + Import + `RenderFx`) | Text-Nachbarschaft in `limits.ts`/Importblock von `renderer.ts`, Hunks verschieden | **I-120 sofort, I-118 nach ORT-A**; sonst vor Merge `main` einmergen, Konflikt hand lösen |
| I-114 / UI-HAEPPCHEN-D (`hud.ts`, `farOrder.ts`, `app.ts`)                                                  | R: `app.ts` an zwei Stellen (Zustand ~1508, Frame-Schleife ~1680)                                 | möglich in `app.ts`, kleine Hunks                                                  | I-118 nach beiden, oder `main` vor Merge-Gate einmergen; Verdrahtung ≤ 20 Zeilen          |
| Strang A (nur `src/audio/`, `tests/audio/`) kollidiert mit nichts und kann zuerst nach `main`.              |

## Tasks

| Task | Titel                                             | Datei              | AK             | Strang     | blocked-by | Modell |
| ---- | ------------------------------------------------- | ------------------ | -------------- | ---------- | ---------- | ------ |
| T00  | Zeitmessung Bestandstests                         | T00-zeitmessung.md | R392           | A, R       | –          | sonnet |
| T01  | `townFactor`, `smoothShare`, `ambienceMix`        | T01-klang-kurve.md | A1–A4, A7      | A          | T00        | sonnet |
| T02  | Motor: Glättung, Wind, Fake-Context-Test          | T02-klang-motor.md | A5             | A          | T01        | sonnet |
| T03  | `viewStats`: `suppliedShare`, `houses`            | T03-viewstats.md   | A6             | R          | T00        | sonnet |
| T04  | `aufstieg.ts`: `detectRises`, `pickRises`, Deckel | T04-aufstieg.md    | B1, B4, B7, B8 | R          | T00        | sonnet |
| T05  | `drawRiseGlow` in `fx.ts`                         | T05-glow.md        | B2, B3, B5     | R          | T04        | sonnet |
| T06  | Verdrahtung `renderer.ts` + `app.ts`, Uhr         | T06-verdrahtung.md | B5, B6         | R          | T03, T05   | sonnet |
| T07  | Doku: arc42, README                               | T07-doku.md        | –              | R          | T06        | sonnet |
| T08  | Review A, Review R, Browser-Check                 | T08-review.md      | alle           | Controller | T02, T07   | sonnet |

A und R laufen parallel in getrennten Worktrees. T03 und T04 sind innerhalb R unabhängig (ein Umsetzer, nacheinander).

## Zeitmessung (R392, vorab gemessen)

Betroffene Bestandsdateien (`tests/audio`, `tests/render/{fx,viewStats,limits}.test.ts`): 9 Dateien, 146 Tests, Vitest 2,0 s, Wand 2,7 s. T00 misst zusätzlich die volle Suite (`make test`) und trägt den Wert in die Task-Datei ein; neue Tests dürfen die Suite um höchstens 1 s verlängern (reine Mathematik, Fake-Kontext, keine Timer).

## Schätzung Umsetzung (E-068)

| Paket                                                                                                                                                                                                                                                                                           | Starts                                                                      | Tools | Diff-Schätzung                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------- |
| Audio (A)                                                                                                                                                                                                                                                                                       | 1 Umsetzer, 1 Reviewer (opus nicht nötig)                                   | ≈ 40  | Quelle ≈ 80, Tests ≈ 120 Zeilen (≈ 200, ≤ 300: **ein** Reviewer am Ende)                |
| Render (R)                                                                                                                                                                                                                                                                                      | 1 Umsetzer (T03–T07), 1 Reviewer                                            | ≈ 60  | Quelle ≈ 170, Tests ≈ 220 Zeilen (> 300: ein Reviewer, da Gesamtdiff, kein Task-Review) |
| Browser-Check                                                                                                                                                                                                                                                                                   | 1 `qa-playtester` (Aufstieg per Schnellvorlauf, Tag/Nacht, Marken sichtbar) | ≈ 20  | –                                                                                       |
| Zusammen **5 Starts** (2 Umsetzer, 2 Reviewer, 1 Playtester), Parallelität 2. Budgetantrag: 5 Starts + 30 % Puffer = **7 Starts**, Parallelität 2; Final-Review durch einen der beiden Reviewer auf `opus` für R (grösserer Diff), A auf `sonnet`. Tools gesamt ≈ 120 (Spec: ≈ 90 ohne Review). |

## Risiken

- Doppelte Spiegelung von `ViewStats` (Audio/Render) driftet: AK-A2/A6 benennen die Feldnamen, Review prüft beide.
- Wirkung im Bild (Funkeln erkennbar, Kranz nicht über Marken): nur der Browser-Check zeigt es; Tuning ≤ 1 Fix-Runde, Konstanten in `fx.ts`.
- Hörbarkeit der Kurve: Faktor 2 ist im Test gesichert, der Eindruck braucht Nutzerohr; Nachstimmen kostet eine Konstante (Umkehrbarkeit: billig, kein ADR).
