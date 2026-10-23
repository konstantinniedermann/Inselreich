# Plan UI-HAEPPCHEN-I · I-168 Kasse leer in + I-167 Bestand im Bau-Tooltip + I-170 Wachstumsbremse (Stufe leicht)

Owner `lead-tech` · Quelle: Kurzdesign `docs/superpowers/specs/2026-10-22-ui-haeppchen-i-design.md` (`design/ui-haeppchen-i` @ `3da866fa`, AK-I1 bis I29), Gate R831 (F1 bis F8). Task-Dateien in [`2026-10-22-ui-haeppchen-i/`](2026-10-22-ui-haeppchen-i/). Plan ohne Testläufe und ohne Code.
Spielerwirkung: P1 Geld-Chip zeigt «Kasse leer in ≈ m:ss» und färbt sich. P2 Bau-Tooltip zeigt «Steht: n (k still)». P3 Einwohner-Chip nennt, woran die Häuser der Stufe hängen (und nach dem Stadtplanung-Merge den Lärm).
**Kein Save** (`SAVE_VERSION` unberührt), **kein Spielwert**, keine Abhängigkeit (ADR-001), kein ADR, **kein `src/sim/`-Diff**.

## Entscheide des Plans

- **P-1 Zwei Stränge, Worktrees aus `plan/ui-haeppchen-i`:** A = P1, dann P3 (`feat/ui-haeppchen-i-a`, `.worktrees/ui-haeppchen-i-a`), B = P2 (`feat/ui-haeppchen-i-b`, `.worktrees/ui-haeppchen-i-b`). A seriell, weil beide `hud.ts` ändern; B parallel (`buildMenu.ts`). Vor Start `git merge main`.
- **P-2 Startbedingungen (F8):** A/T01 und B/T08 sofort bei freier Testsperre (R380). A/T02 (P3 Grundteil) nach T01, **ohne** Stadtplanung. A/T05 (Lärm-Zeile) erst nach dem Stadtplanung-Merge, holt `main` per `git merge main` herein, **kein Rebase**. Geht A vorher nach main, läuft T05 auf `feat/ui-haeppchen-i-a2` ab main.
- **P-3 Lärm als eigener letzter Task** (T05), weil `quiet.ts`/`NOISE_OCCUPANCY` auf main fehlen. T02 legt das Feld `noise` im Typ `GrowthBrake` schon an, damit T05 nur füllt.
- **P-4 Rechenzeit (AK-I27):** T02 misst vorab in Vitest (Median aus 20, ≥ 200 Häuser, nur `console.log`, keine Zeit-Assertion); massgeblich ist die Browser-Messung in T03 (und T06 mit Lärm). **Über 4 ms: Status `blocked`, Plan und P3 gehen an L0 zurück.** Rückfall-Optionen für L0: Intervall 1000 auf 2000 ms oder nur der sichtbare Chip rechnet.
- **P-5 Neue Tests in eigenen Dateien**, `tests/ui/hud.test.ts` nur mit einer kurzen Ergänzung am Dateiende (Beipack-Konflikt klein halten).
- **P-6 Doku (Roster-Regel E-017):** je Strang ein Doku-Task per `SendMessage` an den Umsetzer, README-Tabelle nur unten anfügen.

## Konflikte (aus der Spec, Stellen disjunkt)

| Datei                              | Wer                                                                                                                                 | Befund                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/hud.ts`                    | A (T01 `moneyView`/`updateMoney` ≈ 147 bis 185; T02/T05 Stufen-Chips ≈ 350 bis 425) und UI-BEIPACK-FERN (`syncGoalChip`, Fern-Text) | Stellen disjunkt, Rebase-/Merge-Konflikt klein. Wer später mergt, löst per `git merge main`. T01/T02 fassen Ziel-Chip und Fern-Text nicht an. |
| `tests/ui/hud.test.ts`             | A und Beipack                                                                                                                       | beide hängen am Dateiende an; Konflikt trivial, beide Blöcke behalten                                                                         |
| `README.md` (Tabelle am Ende)      | A, B, H, Beipack                                                                                                                    | nur Zeilen unten anfügen; bei Konflikt alle Zeilen behalten                                                                                   |
| `src/ui/buildMenu.ts`              | nur B                                                                                                                               | kein Konflikt (Stadtplanung berührt die Datei laut Spec nicht)                                                                                |
| `src/style.css`                    | nur A/T01 (zwei Selektoren)                                                                                                         | Stadtplanung berührt sie nicht                                                                                                                |
| `src/ui/problems.ts`, `inspect.ts` | Stadtplanung                                                                                                                        | A liest nur (`houseDiagnosis`, `SERVICE_BUILDING`), ändert nichts                                                                             |

H (`app.ts`, `storage.ts`, `menu.ts`, `startCard.ts`) und ORT-A (`app.ts`, `devProbes.ts`, `src/render/`) teilen keine Datei.

## Dateimatrix (Ownership)

| Datei                                                                    | T01 | T02 | T05 | T08 | Doku (T04/T07/T10) |
| ------------------------------------------------------------------------ | --- | --- | --- | --- | ------------------ |
| `src/ui/cashReach.ts`, `tests/ui/cashReach.test.ts`                      | ja  |     |     |     |                    |
| `src/ui/hud.ts`                                                          | ja  | ja  | ja  |     |                    |
| `src/style.css`                                                          | ja  |     |     |     |                    |
| `src/ui/growthBrake.ts`, `tests/ui/growthBrake*.test.ts`                 |     | ja  | ja  |     |                    |
| `tests/ui/hud.test.ts` (Ende)                                            | ja  | ja  |     |     |                    |
| `src/ui/buildStand.ts`, `src/ui/buildMenu.ts`, `tests/ui/build*.test.ts` |     |     |     | ja  |                    |
| `README.md`, `docs/arc42.md`, `docs/beobachtungen.md`                    |     |     |     |     | ja                 |

Nicht angefasst: `src/sim/`, `src/render/`, `src/audio/`, `docs/studio/`, Specs. T03, T06, T09 (Browser-Check) ändern keine Datei.

## Tasks

| Task | Titel                                                  | Datei                       | AK-IDs                   | Strang | blocked-by                    | Modell | Tools | Persona            |
| ---- | ------------------------------------------------------ | --------------------------- | ------------------------ | ------ | ----------------------------- | ------ | ----- | ------------------ |
| T01  | P1 `cashReach`, Geld-Chip, CSS                         | `T01-kassen-reichweite.md`  | I1 bis I8                | A      | Testsperre frei               | sonnet | 40    | `tech-ui-engineer` |
| T02  | P3 Grundteil `growthBrake`, Chip-Refresh, Messung      | `T02-wachstumsbremse.md`    | I17 bis I22, I24 bis I26 | A      | T01                           | sonnet | 55    | `tech-ui-engineer` |
| T03  | Browser-Check A (P1, P3) und Messung (`qa-playtester`) | `T03-playtest-a.md`         | I9, I27, I28             | A      | T02                           | sonnet | 35    | `qa-playtester`    |
| T04  | Doku A (README)                                        | `T04-doku-a.md`             | –                        | A      | T03                           | sonnet | 12    | `tech-ui-engineer` |
| T05  | P3 Lärm-Zeile (`git merge main`)                       | `T05-laermzeile.md`         | I23                      | A      | T04, **Stadtplanung gemergt** | sonnet | 30    | `tech-ui-engineer` |
| T06  | Browser-Check Lärm (`qa-playtester`)                   | `T06-playtest-laerm.md`     | I29                      | A      | T05                           | sonnet | 20    | `qa-playtester`    |
| T07  | Doku Lärm (README)                                     | `T07-doku-laerm.md`         | –                        | A      | T06                           | sonnet | 8     | `tech-ui-engineer` |
| T08  | P2 `standLine`, Tooltip-Zeile                          | `T08-bestand-bautooltip.md` | I10 bis I15              | B      | Testsperre frei               | sonnet | 45    | `tech-ui-engineer` |
| T09  | Browser-Check B (`qa-playtester`)                      | `T09-playtest-b.md`         | I16                      | B      | T08                           | sonnet | 20    | `qa-playtester`    |
| T10  | Doku B (README)                                        | `T10-doku-b.md`             | –                        | B      | T09                           | sonnet | 8     | `tech-ui-engineer` |

Summe ≈ 273 Tools (Spec ≈ 110 für Umsetzung; Rest Browser-Check, Doku, Messung). Nur Lauf (kein eigener Test): AK-I8 und AK-I26/I15 «Sim unberührt» (`git diff main -- src/sim` leer, `SAVE_VERSION` unberührt, `balance.test.ts` grün) im Abschluss je Strang.

## Budget (Vorschlag für das Gate Plan)

**Gesamt 16 Starts, Parallelität 2** (A und B gleichzeitig). Geplant **12**: Strang A neun (T01-Umsetzer 1, T01-Review sonnet 2, T02-Umsetzer 3, T02-Review 4, T03 `qa-playtester` 5, T05-Umsetzer 6, T05-Review 7, T06 `qa-playtester` 8, Final-Review `qa-code-reviewer` **opus** über die ganze Branch 9; bei Split auf `-a2` ist dessen opus-Review der Final-Review); Strang B drei (T08-Umsetzer 10, Review als Final-Review **opus** 11, T09 `qa-playtester` 12; bei nur einem Umsetzer-Task gilt der opus-Review als Final-Review). T04, T07, T10 und Fix-Runden per `SendMessage` (zählen nicht). **Reserve 4** (Fix-Runden ohne SendMessage-Weg, Wiederholung der Messung, Split `-a2`); Delta-Review (R553) per `SendMessage` zählt nicht. Rechnung: 12 × 1,3 = 15,6, aufgerundet 16. Controller: Lead `sonnet`, höchstens 4 Tasks je Instanz.

## Test- und Prüfpflichten (für jedes Umsetzer-Briefing wörtlich)

- **Testsperre (R380):** Tests erst bei freier Sperre (`uptime`: 1-min-Load ≤ 4, kein anderer `vitest`/`make check`-Lauf; sonst `waiting` melden).
- **Gezielt, nie `make check` je Task:** die Befehle stehen in der jeweiligen Task-Datei. Je Task `npx tsc --noEmit; echo EXIT=$?` (R398), eslint und prettier auf die berührten Dateien, Exit-Codes im Bericht (nie in eine Pipe).
- **Rot zuerst:** Test vor der Umsetzung laufen lassen, rote Ausgabe (Exit ≠ 0) im Bericht.
- **Zeittests (R270):** keine berührte Datei steht in `ZEITTESTS`; neue Tests nutzen keine Uhr (nur gestubbte `performance.now`); Spielzeiten über `formatGameTime`/`secToTicks`, nie als Literal geraten.
- **Keine `Contract`-Literale** in neuen Tests (R679-2).
- **Abschluss je Strang (Controller, einmal):** `make check; echo EXIT=$?` bei freier Sperre, `tests/sim/balance.test.ts` grün, `git diff main -- src/sim` leer.

## AK-Zuordnung (29 AK)

| AK                       | Beleg                                                       | Task                |
| ------------------------ | ----------------------------------------------------------- | ------------------- |
| I1 bis I7                | `tests/ui/cashReach.test.ts`, `tests/ui/hud.test.ts`        | T01                 |
| I8, I15, I26 (Sim-Teil)  | Lauf: Sim-Diff leer, `balance`, `SAVE_VERSION`              | Abschluss je Strang |
| I9                       | Browser-Check                                               | T03                 |
| I10 bis I14              | `tests/ui/buildStand.test.ts`, `tests/ui/buildMenu.test.ts` | T08                 |
| I16                      | Browser-Check                                               | T09                 |
| I17 bis I22, I24 bis I26 | `tests/ui/growthBrake.test.ts`, `tests/ui/hud.test.ts`      | T02                 |
| I23                      | `tests/ui/growthBrake.test.ts`                              | T05                 |
| I27, I28                 | Browser-Check, Messung berichtet                            | T03                 |
| I29                      | Browser-Check                                               | T06                 |

## Ruling-Entwürfe (für `docs/studio/rulings.md`, L0 entscheidet)

- **R832-E (Gate Plan UI-HAEPPCHEN-I):** Plan freigegeben: Strang A (P1, dann P3) und Strang B (P2) parallel; A/T01 und B/T08 bei freier Testsperre; Budget 16 Starts (12 geplant, 4 Reserve), Parallelität 2; kein Save, kein Spielwert, kein ADR.
- **R833-E (Lärm-Zeile nach Merge):** P3 Regel 5 läuft als eigener letzter Task T05 erst nach dem Stadtplanung-Merge; `main` kommt per `git merge main` in den Branch, kein Rebase. Geht Strang A vorher nach main, folgt T05 auf `feat/ui-haeppchen-i-a2` ab main.
- **R834-E (Rechenzeit-Grenze AK-I27):** Median einer `growthBrakes`-Rechnung mit ≥ 200 Häusern über 4 ms im Browser: P3 geht vor dem Merge an L0 zurück (Optionen: Intervall 2000 ms, nur sichtbarer Chip).
- **R835-E (Konfliktregeln):** `hud.ts` gemeinsam mit UI-BEIPACK-FERN, Stellen disjunkt, Reihenfolge egal, Konflikte per `git merge main`; neue Tests in eigenen Dateien, `hud.test.ts` nur am Ende; README-Tabelle nur unten anfügen, bei Konflikt alle Zeilen behalten (H, Beipack, A, B).
