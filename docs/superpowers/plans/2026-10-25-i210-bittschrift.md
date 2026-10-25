# Plan I-210 · Bittschrift (Stufe voll)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (Controller `lead-tech` auf `sonnet`). Schritte mit `- [ ]`. Arbeiter bekommen nur ihre Task-Datei und die AK-IDs.

Owner `lead-tech` · Meilenstein M14 · **Spec:** `docs/superpowers/specs/2026-10-25-i210-bittschrift-design.md` (`design/i210-bittschrift` @ `74f3b181`, 25 AK-BS, Anhänge 01–05), Rechnung `…-i210-bittschrift-rechnung.md`, Gate Spec BEDENKEN (`.studio/handoffs/2026-10-25-lead-qa-gate-spec-I-210.md`), Rulings R904, R911, R918 (kein Zukaufmodell, B-4 bleibt Restrisiko), R921 (I-201 Festindex). Task-Dateien in [`2026-10-25-i210-bittschrift/`](2026-10-25-i210-bittschrift/).

**Ziel:** Nach Ziel 1 bitten Bürger alle 10 min um Waren; «Ja» kostet jetzt und bringt später befristet Einwohner, Takt oder Lagerraum, «Nein» bringt sofort 3 min Genügsamkeit bei einer Ware.

**Spielerwirkung:** Eine Karte mit zwei Spalten, Folgelast und Reserve als Zahl; der Bedarf der Bewohner wird sichtbar und zur Entscheidung.

## Architektur (≤ 15 Zeilen)

- Werte: neue Datei `src/sim/defs/petitions.ts` (Konstanten §4.1, `PETITION_IDS`, `PETITIONS` als Daten: `cost`, `reward`, `when`, `anchor` als Unions, Texte inkl. `noReason`).
- **Blattmodul `src/sim/petitionEffect.ts`** (Muster I-201 `feastEffect`): einzige Leseorte-API `overcrowdCap`, `needRate`, `petitionCycle`, `storageCap`, ab T11 `bellActive`, `voucherAt`, `useVoucher`. Importiert nur `./defs/*`, `./types`, `./world` (`HOME`), ab T11 `./feastEffect`. Jede Abfrage kehrt bei `effects.length === 0` sofort zurück (bitgleich und billig).
- **Strom:** `src/sim/petitionRng.ts` mit `petitionRng(seed, tick)` (ADR-010-Formel, `PETITION_SALT`); eigenes Modul, damit AK-BS-01 die Aufrufe per `vi.mock` zählen kann (P-7).
- `src/sim/petitions.ts`: `tickPetitions` (Reihenfolge a–d, Spec §3.4), `answerPetition`, `petitionPreview`; importiert, was es braucht, wird aber von keinem Leseort importiert.
- Tick-Platz: `step` ruft `tickPetitions` nach `tickCrises`, vor `checkWin`; `StepReport.petitions: PetitionEvent[]` (kein Spielstand).
- Leseorte: Wachstum in `tickPopulation` (Überbelegung), `consume` und `goodsBalance` (Genügsamkeit), `cycleOf` (Takt), `addStock`/Kauf/Entladen/`queries` (Lager); ab T11 `upgradeStatus` (Glocke) und `holdFeast`/`feastBlockReason` (Gutschein).
- Save: Weltfeld `petitions`, `SAVE_VERSION` = main + 1 (beim Merge neu vergeben, R909), Migration setzt «aus», `isValidPetitions` nach Anhang 04.
- UI: `src/ui/petition.ts` (DOM-freies Kartenmodell), `src/ui/petitionCard.ts` (DOM), `src/ui/petitionLog.ts` (Chronik, Muster `crisisLog`), Kästchen im Dialog «Neue Insel», Chip in der Kopfleiste, Panelzeilen.

## Entscheide des Plans (Entwurf für das Gate Plan)

- **P-1 Stränge:** A Sim-Kern (`.worktrees/i210`, `feat/i210`, T00–T05, T11), B Messung (`.worktrees/i210-mess`, `feat/i210-mess` von A @ T03, T06–T08, T12), C UI (`.worktrees/i210-ui`, `feat/i210-ui` von A @ T04, T09, T10, T14). Dateien disjunkt (Matrix). Rückführung B → A, C → A per Merge, kein Rebase.
- **P-2 Reihenfolge I-201 (R911):** Phase 1 (T00–T10) ohne I-201. Phase 2 (T11, T12, T14) startet erst, wenn I-201 in `main` ist: A merged `main`, B4/B5 lesen über `feastEffect` (I-201 Regel 8, mit Festindex R921). I-210 geht erst nach I-201 nach `main`. Wird I-201 verworfen, ist das ein Befund an L0 (Rückfall laut Spec §10: B4/B5 gegen `feast.ts` und `FEAST_RUM` von `main`).
- **P-3 Überbelegung ohne Signaturbruch:** `houseCap(world, house)` bleibt (kein Insel-Parameter; 8 Testaufrufe und `ui/balancePreview.ts`). Der Wachstumsschritt in `tickPopulation` liest `overcrowdCap(world, b.island, house.tier, houseCap(world, house))`. Das Hauspanel nutzt dieselbe Abfrage. Wirkung wie Spec §3.5, Leseort eine Zeile tiefer.
- **P-4 Genügsamkeit auch in `goodsBalance`:** `needRate` wirkt in `consume` und in `flow.ts` (`consumed` der Häuser). Sonst zeigten Karte («heute netto»), Bilanz und Wachstumsbudget während der Genügsamkeit falsche Netto-Werte. Die Spec nennt nur `consume`; Ergänzung bitte bestätigen.
- **P-5 Lagergrenze an allen HOME-Kappungen:** `addStock(isl, good, n, cap = STORAGE_CAP)`. Einen Cap aus `storageCap(...)` übergeben die Produktion (`production.ts`), der Kauf (`trade.ts` Prüfung und Einlagern) sowie, zusätzlich zur Spec, das Entladen der Schiffe (`ships.ts` `unload`) und die Raumabfrage `queries.ts`. Sonst stoppt ein Schiff bei 100, obwohl das Lager 120 zeigt. Bitgleich ohne Wirkung.
- **P-6 `wonTick`:** `checkWin` läuft nach `tickPetitions`. Setzt `checkWin` `won` im Tick T, sieht `tickPetitions` es in T + 1 und setzt `next = T + 1 + PETITION_FIRST`. AK-BS-02 prüft genau das; «wonTick» heisst im Plan T + 1.
- **P-7 Strom-Spion:** AK-BS-01 per `vi.mock('../../src/sim/petitionRng', …)` mit Durchreichen und Zähler, erwartet 0 Aufrufe. Eine Seed-Suche über `createRng` wäre bei 20 000 Ticks nicht kollisionsfrei.
- **P-8 Testdateien (B-5):** Die Regeln liegen in `petitions.test.ts` (kurz), Langläufe in `petitionsRuns.test.ts` (AK-01, -03, -10) und `petitionsHarmless.test.ts` (AK-13), der Save in `petitionsSave.test.ts` und der Controller in `petitionsController.test.ts`. Dominanz in drei Dateien: `petitionsDominance-b1b3`, `-b4b5`, `-b6b9`. Dazu `petitionsStable.test.ts`. Jede Datei < 30 s unter Testlock (Messregel T00/T06).
- **P-9 Seeds `[3, 7]`** je Lage. Gesenkt wird nur nach der Messregel in T00 bzw. T06: ein Seed (3) je betroffener Datei, mit R553-Begründung im Test-Kopf und im Bericht. Ersatz für einen nicht baubaren Seed ist eine feste Konstante, nie eine Suche zur Laufzeit.
- **P-10 Helfer:** Lagen baut `tests/sim/petitionWorlds.ts` (neu); `tests/sim/helpers.ts` hat 29 KB und bleibt unberührt (E-057, Präzedenz I-201 P-2).
- **P-11 AK-BS-17:** Ein echter Test nur für Ziel 2 mit `runMerchants` (Welt `petitionsOn: true`, nie eine Antwort). Er erwartet `wonMerchants` bis `MERCHANT_TICK_LIMIT`. Der Ziel-1-Teil entfällt, weil die erste Karte erst nach Ziel 1 kommt (Anhang 02, B-10).
- **P-12 AK-BS-23:** Liegt `src/sim/challenge.ts` (INSELPROBEN) bei T02 auf `main`, prüft T02 alle drei `ChallengeStart`-Arten auf `petitions.on === false`. Sonst übernimmt der INSELPROBEN-Plan den AK unverändert (Anhang 02, B-8); der Controller meldet das an L0.
- **P-13 Kartenmodell zweigeteilt:** `petitionPreview` (Sim, Zahlen, AK-BS-18) in T04. Texte, Nein-Begründung und B6-Zeile (AK-BS-24, -25) liegen in `src/ui/petition.ts` (T09).
- **P-14 Kostenwaren AUSBAU-LOGIK:** Ändert AUSBAU-LOGIK vor dem Merge Ketten oder Waren, prüft T16 Kosten und `when` in den Defs und lässt die Dominanzdateien erneut laufen (Spec §10).

## Dateimatrix (Ownership)

| Datei                                                                                                                | T01 | T02 | T03 | T04 | T05 | T06–T08, T12 | T09 | T10 | T11 | T14 |
| -------------------------------------------------------------------------------------------------------------------- | --- | --- | --- | --- | --- | ------------ | --- | --- | --- | --- |
| `src/sim/defs/petitions.ts`, `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/petitionRng.ts` (neu)                  | ja  |     |     |     |     |              |     |     |     |     |
| `src/sim/petitionEffect.ts` (neu)                                                                                    | ja  |     | ja  |     |     |              |     |     | ja  |     |
| `src/sim/petitions.ts` (neu), `src/sim/tick.ts`                                                                      |     | ja  | ja  | ja  |     |              |     |     | ja  |     |
| `src/sim/population.ts`, `flow.ts`, `levels.ts`, `economy.ts`, `production.ts`, `trade.ts`, `ships.ts`, `queries.ts` |     |     | ja  |     |     |              |     |     | ja¹ |     |
| `src/sim/feast.ts` bzw. `feastEffect.ts`-Aufrufer                                                                    |     |     |     |     |     |              |     |     | ja  |     |
| `src/sim/save.ts`                                                                                                    |     |     |     |     | ja  |              |     |     |     |     |
| `tests/sim/petitions.test.ts`, `petitionsRuns.test.ts`, `petitionsHarmless.test.ts` (neu)                            | ja  | ja  | ja  | ja  |     |              |     |     | ja  |     |
| `tests/sim/petitionsSave.test.ts`, `petitionsController.test.ts` (neu)                                               |     |     |     |     | ja  |              |     |     |     |     |
| `tests/sim/petitionWorlds.ts`, `petitionsDominance-*.test.ts`, `petitionsStable.test.ts` (neu)                       |     |     |     |     |     | ja           |     |     |     |     |
| `src/ui/petition.ts`, `src/ui/petitionCard.ts` (neu), `src/ui/settings.ts`, `src/ui/menu.ts`, `src/ui/hud.ts`        |     |     |     |     |     |              | ja  |     |     | ja  |
| `src/ui/app.ts`, `src/style.css`                                                                                     |     |     |     |     |     |              | ja  | ja  |     | ja  |
| `src/ui/petitionLog.ts` (neu), `src/ui/inspect.ts`                                                                   |     |     |     |     |     |              |     | ja  |     | ja  |
| `tests/ui/petition.test.ts`, `tests/ui/petitionLog.test.ts`, `tests/ui/settings.test.ts` (neu bzw. Zusatz)           |     |     |     |     |     |              | ja  | ja  |     | ja  |
| `README.md`, `docs/arc42.md`, `docs/adr/` (ADR-005-Nachtrag)                                                         |     |     |     |     |     |              |     |     |     | ja  |

¹ T11 nur `population.ts` (`upgradeStatus`). Nicht angefasst: `tests/sim/balance.test.ts`, `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, `tests/sim/helpers.ts`, `src/render/`, `src/audio/`, `docs/studio/`, Specs. `menu.ts` nur, falls der Dialog «Neue Insel» dort liegt (T09 prüft per `rg`).

## Tasks

| Task | Titel                                         | Datei                  | AK-IDs (AK-BS-…)                                           | Strang | blocked-by         | Modell | Tools | Persona             |
| ---- | --------------------------------------------- | ---------------------- | ---------------------------------------------------------- | ------ | ------------------ | ------ | ----- | ------------------- |
| T00  | Vorab: Testzeiten, Tickrate, Basis            | `T00-vorab.md`         | –                                                          | A      | Gate Plan          | sonnet | 25    | `tech-sim-engineer` |
| T01  | Defs, Typen, Weltfeld, Blattmodul             | `T01-defs-blatt.md`    | 09, 16 (Defs), 01 (`createWorld`)                          | A      | T00                | sonnet | 45    | `tech-sim-engineer` |
| T02  | Ziehen, Antwort, Frist, Nachspiel, Tick-Platz | `T02-ablauf.md`        | 01, 02, 03 (ohne Save), 06, 07, 08, 11 (Anker), 12, 16, 23 | A      | T01                | sonnet | 70    | `tech-sim-engineer` |
| T03  | Wirkungen an den Leseorten                    | `T03-wirkung.md`       | 10 (ohne Erntefest), 11 (Haus), 13, 14                     | A      | T02                | sonnet | 70    | `tech-sim-engineer` |
| T04  | Kartenvorschau `petitionPreview`              | `T04-vorschau.md`      | 18                                                         | A      | T03                | sonnet | 30    | `tech-sim-engineer` |
| T05  | Save, Migration, Prüfregeln; Controller       | `T05-save.md`          | 15, 03 (Save), 17                                          | A      | T04                | sonnet | 50    | `tech-sim-engineer` |
| T06  | Lagen-Helfer, Dominanz B1–B3                  | `T06-dominanz-b1b3.md` | 04 (B1–B3)                                                 | B      | T03                | sonnet | 70    | `tech-sim-engineer` |
| T07  | Dominanz B6–B9 mit Ersatzmass                 | `T07-dominanz-b6b9.md` | 04 (B6–B9)                                                 | B      | T06                | sonnet | 70    | `tech-sim-engineer` |
| T08  | Messlauf stabile Stadt                        | `T08-stabil.md`        | 05                                                         | B      | T06                | sonnet | 60    | `tech-sim-engineer` |
| T09  | Karte, Neues Spiel, Chip                      | `T09-karte.md`         | 24, 25; Vitest-Teil 19, 22                                 | C      | T04                | sonnet | 60    | `tech-ui-engineer`  |
| T10  | Chronik und Panels                            | `T10-chronik.md`       | Vitest-Teil 20, 21                                         | C      | T09                | sonnet | 45    | `tech-ui-engineer`  |
| T11  | B4/B5 nach I-201                              | `T11-fest.md`          | 10 (Erntefest), 11 (B4), B4/B5-Regeln                      | A      | I-201 in main, T05 | sonnet | 55    | `tech-sim-engineer` |
| T12  | Dominanz B4–B5                                | `T12-dominanz-b4b5.md` | 04 (B4–B5)                                                 | B      | T11, T07           | sonnet | 45    | `tech-sim-engineer` |
| T13  | Browser-Check                                 | `T13-playtest.md`      | 19, 20, 21, 22                                             | A      | T14                | sonnet | 35    | `qa-playtester`     |
| T14  | Anzeige B4/B5 und Doku                        | `T14-anzeige-doku.md`  | Anhang 05 (Glocke, Gutschein)                              | C      | T10, T11           | sonnet | 35    | `tech-ui-engineer`  |
| T15  | Zeiten gegen main (R392) und Teilbeleg        | `T15-zeiten.md`        | 01 (Baseline)                                              | A      | T12, T13           | sonnet | 20    | `tech-sim-engineer` |
| T16  | Abschluss: Save-Nummer, Final-Review          | `T16-abschluss.md`     | alle                                                       | A      | T15                | –      | 15    | Controller          |

Summe ≈ 750 Tools. Je Umsetzungs-Task T01–T12 und T14 ein `qa-code-reviewer` (sonnet, OK/BEDENKEN/ZURÜCK). Danach Final-Review **`model: opus`** über `feat/i210` an `lead-qa`; bei ZURÜCK folgt ein Delta-Review desselben Reviewers per `SendMessage` (R553).

## AK-Zuordnung (25 AK)

| AK            | Beleg (Datei)                                                                             | Task          |
| ------------- | ----------------------------------------------------------------------------------------- | ------------- |
| 01            | `createWorld`-Form (T01), Strom-Spion 20 000 T `petitionsRuns` (T02), Baselines (T15)     | T01, T02, T15 |
| 02, 06–08, 12 | `petitions.test.ts`                                                                       | T02           |
| 03            | `petitionsRuns.test.ts` (Folge, Krisen); Save mitten in der Frist `petitionsSave.test.ts` | T02, T05      |
| 04            | `petitionsDominance-b1b3` / `-b6b9` / `-b4b5`                                             | T06, T07, T12 |
| 05            | `petitionsStable.test.ts`                                                                 | T08           |
| 09            | `petitions.test.ts` (Wächter Defs)                                                        | T01           |
| 10            | `petitions.test.ts` (Stapeln, Ablauf), `petitionsRuns` (60 000 T); Erntefest T11          | T03, T11      |
| 11            | Anker (T02), Haus abgerissen (T03), Glocke (T11)                                          | T02, T03, T11 |
| 13            | `petitionsHarmless.test.ts`                                                               | T03           |
| 14            | `petitions.test.ts`                                                                       | T03           |
| 15            | `petitionsSave.test.ts`                                                                   | T05           |
| 16            | Strukturtest Defs (T01), `petitions.ts` (T02)                                             | T01, T02      |
| 17            | `petitionsController.test.ts`                                                             | T05           |
| 18            | `petitions.test.ts`                                                                       | T04           |
| 19–22         | Vitest der Helfer (T09, T10), Browser (T13)                                               | T09, T10, T13 |
| 23            | `petitions.test.ts` (P-12)                                                                | T02           |
| 24, 25        | `tests/ui/petition.test.ts`                                                               | T09           |

## Review Focus (Eingaben, die kein AK nennt; Test im genannten Task)

1. **Wirkung auf Fremdinseln:** Häuser einer Fremdinsel bekommen weder Überbelegung noch Genügsamkeit, ihr Lager bleibt bei 100 (nur HOME, Spec §3). B6 wirkt dagegen auf Gewürzplantagen jeder Insel. → T03
2. **Laden mit laufendem Speicherbau über 100:** Ein Stand mit Stoff 117 und laufendem B9 lädt (die Save-Prüfung kennt keine Lagergrenze, `save.ts` prüft nur `number`); nach dem Laden läuft die Wirkung weiter, bei Ablauf wird auf 100 geschnitten, Ereignis «Vorbei» mit 17 verdorben. → T05
3. **Antwort genau im Fristtick:** Im Tick `drawnAt + 1200` gilt die Frist vor dem Ziehen (Reihenfolge b vor d). Ein «Ja» der UI im selben Frame danach liefert «Schon beantwortet», ohne Wurf und ohne Abbuchung. → T02
4. **Sieg vor `petitionsOn` geladen:** Ein migrierter Stand mit `won: true` hat `on: false` und zieht nie, auch nach 60 000 T. → T05
5. **Doppelklick «Ja»:** Der zweite Aufruf liefert «Schon beantwortet», das Lager wird nur einmal belastet. → T02

## Budget (Starts-Antrag)

Geplant **21 Starts:** Umsetzer A `tech-sim-engineer` (T00–T05) 1, B `tech-sim-engineer` (T06–T08) 1, C `tech-ui-engineer` (T09, T10) 1. Phase 2 nach der I-201-Pause je Strang ein Neustart (T11, T12, T14) 3; dieser entfällt bei Fortsetzung per `SendMessage` in derselben Session. Dazu `qa-code-reviewer` je Task (T01–T12, T14) 13, `qa-playtester` (T13) 1 und Final-Review `qa-code-reviewer` **opus** 1. Mit 30 % Puffer: 21 × 1,3 = 27,3, **beantragt 28 Starts, 3 Arbeiter gleichzeitig, höchstens 2 gleichzeitige Testläufe** (B ist mess-schwer; A und C wechseln sich ab). Fix-Runden und das Delta-Review per `SendMessage` zählen nicht. T15 läuft beim Umsetzer A per `SendMessage`. Die Starts der Controller-Instanzen gibt L0 frei, sie zählen nicht hier.

**Controller-Ablösung (R167, R190):** höchstens 4 Tasks bzw. 6 Arbeiter-Starts je Instanz, Übergabe per Ledger. Vorschlag: I1 T00–T03 und Start B; I2 T04, T05, T06 und Start C; I3 T07–T10; I4 Phase 2 T11, T12, T14; I5 T13, T15, T16 und Final-Review. Vor jeder Abzweigung und jedem Phase-2-Start prüft der Controller `.studio/limits.json` und `uptime`; bei gelb oder rot gibt es keine neue Welle.

## Prüfpflichten (Umsetzer-Briefing wörtlich)

- **Testsperre (R380), Messfenster (R920 V1):** Tests laufen nur bei 1-min-Load ≤ 4 und ohne fremden `vitest`/`make check`-Lauf, sonst `waiting`. **Messschritte (T00 Tickrate, T00/T15 Testzeiten, T03 Wand an Wand, T06–T08 und T12 Dateidauer): Last ≤ 4 nötig**, vorher `make messfenster; echo EXIT=$?` mit Exit 0. Das Briefing nennt «Last ≤ 4 nötig».
- **Rot zuerst:** Je neuem Test läuft er vor der Umsetzung mit Exit ≠ 0 (`…; echo EXIT=$?`, nie in eine Pipe); das kommt ins Ledger. Für die Dominanz gilt Rot per Stub-Werte (T06): Der Stub wird nie committet.
- **Teilbeleg je Task (R810):** gezielte Tests (Befehl in der Task-Datei), `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`. Nie `make check` je Task.
- **Baseline bitgleich:** `npx vitest run tests/sim/balance.test.ts tests/sim/balance-crises.test.ts tests/sim/balance-merchants.test.ts; echo EXIT=$?` grün in T03 und T15, ohne Änderung an Test, Controller oder Baseline (Liste ergänzt T00).
- **Doku-Commits:** `make docs-check; echo EXIT=$?` mit Exit 0 vor jedem Commit unter `docs/` oder `README.md`.
- **Keine Uhr in neuen Tests** (nur der T00-Messprobe, nie committet); Volltextsuche mit `rg <muster> <pfad>` (R683). Dateien > 30 KB nur abschnittsweise lesen (E-057; `save.ts` 41 KB, `app.ts` 72 KB, `inspect.ts` 45 KB, `hud.ts` 36 KB, Spec 40 KB).
- **Gezielt stagen**, Commit-Präfixe `feat:`/`test:`/`docs:`; kein Rebase, kein `reset --hard`, kein Force-Push.
- **Rückmeldung:** «Melde dein Ergebnis per SendMessage an <agentId des Controllers>, nie an main.»

## Risiken

- **R-BS-4 (Spec §10, R918):** Ein vorbereitetes «Ja» dominiert in der stabilen Stadt mit Krisen aus. AK-BS-05 zeigt es als ΔGeld; das ist kein Testfehler. Hebel ist die Lohnseite (R918), der Plan ändert keine Werte.
- **R553 Rangfolge (AK-BS-04):** Nach Def-Änderungen (AUSBAU-LOGIK, I-201) kann eine Lage kippen. Dann gilt der Rückfall nach Anhang 03 §4, nur per Ruling in den Defs. Die Berichte von T06, T07 und T12 nennen je Lage und Seed die Nettowerte und den Abstand zur Kippgrenze.
- **Testlaufzeit (B-5):** ≈ 270 000 T in `-b1b3`, ≈ 220 000 T in `-b6b9`, ≈ 77 000 T in `-b4b5`. T00 misst die Tickrate, T06 die echte Dateidauer; danach gelten Messregel und P-9.
- **Save-Kette:** SEERECHT (v19 auf dem Branch), INSELPROBEN (`SAVE_V_CHALLENGE`), FLAECHE und STADTRECHT heben die Version ebenfalls. Darum keine feste Nummer in Tests; T16 vergibt main + 1 beim Merge (R909).
- **Phase-2-Wartezeit:** Hängt I-201 länger, liegt Strang A fertig, aber ungemergt. Die Merge-Drift prüft T11 per `git log` auf die Leseort-Dateien.
