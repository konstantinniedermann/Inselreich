# Plan STADTRECHT · V4 käufliche Rats-Sitzungen mit A/B-Wahl (Stufe voll)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (Controller `lead-tech` auf `sonnet`). Steps in den Task-Dateien als Checkbox (`- [ ]`).

Owner `lead-tech` · **Spec:** `docs/superpowers/specs/2026-10-23-stadtrecht-design.md` (`design/stadtrecht` @ `6d77e150`, AK-ST-01 bis AK-ST-17) · Gate Spec: `.studio/handoffs/2026-10-25-lead-qa-gate-STADTRECHT.md`, Nachtrag `.studio/handoffs/2026-10-25-lead-design-STADTRECHT-nachtrag.md`, Rulings R870, R874 · L0-Entscheid B7 angenommen (Satzspalte `taxPct + charterTaxPoints`, Prognose über `effectiveTaxPct`) · Plan gegen main `ec144e82`, ohne Testläufe. Task-Dateien in [`2026-10-25-stadtrecht/`](2026-10-25-stadtrecht/).

**Stufe voll (begründet):** neues Weltfeld mit Save-Sprung und Migration, neue Sim-Aktion, sechs neue Spielwerte-Einträge, Eingriff in den gemeinsamen Hebel-Leser des Rats und in die Steuerformel, UI in einer Datei, die Seerecht zuvor umbaut. Jeder dieser Punkte allein verlangt Task-Reviews und einen Final-Review auf opus.

**Goal:** Ab Ziel 1 kauft der Spieler in der Rats-Karte sechs Sitzungen nacheinander (`buyCharter(world, side)`), je Sitzung +2 Steuerpunkte (A) oder ein Takt-Hebel (B); ohne Kauf bleibt jeder Lauf bitgleich.

**Architecture (≤ 15 Zeilen):**

- `src/sim/defs/charter.ts` (neu): `CHARTER_SESSIONS` (6 Einträge: Name, Geld, Stein, Glas, `a { taxPoints, name, text }`, `b { lever, name, text }`), `CHARTER_UNLOCK = 'won'`, `CHARTER_NOTE`, `CHARTER_AFFORDABLE_MESSAGE`. Typen `CharterSide = 'A' | 'B'` (eigener Typ, nicht `CouncilSide`, R874 5), `CharterLever = Extract<CouncilLever, { kind: 'cycle' }>`, `CharterSessionDef` in `types.ts`.
- Weltfeld `World.charter: CharterSide[]` (Länge 0 bis 6, Index = Sitzung − 1), `createWorld` setzt `[]`.
- `src/sim/charter.ts` (neu): `charterUnlocked`, `nextCharter`, `buyCharterReason`, `buyCharter`. Zahlt aus `world.money` und `islands[HOME].stock` (wie `monument.ts`), Sperrbestand gilt nicht. Importiert nur `defs/*`, `types`, `world` (`HOME`).
- **Einziger Leseort (R706 a) bleibt `src/sim/council.ts`:** `activeLever` liest nach den Ratsstufen die B-Seiten aus `world.charter` (P-2), dazu neu `charterTaxPoints(world)`. `edicts.ts` `effectiveTaxPct` addiert `charterTaxPoints` (importiert dafür `./council`, kein Zyklus).
- Save: `isValidCharter` direkt nach `isValidCouncil` (beide vor `isValidV9Fields`), Migration `Vorgänger → SAVE_VERSION` setzt `[]`. Version siehe P-3.
- UI: `src/ui/charter.ts` (neu, DOM-frei: `charterView`, `charterAffordable`, `charterBecameAffordable`), `src/ui/council.ts` (Marke), `src/ui/councilCard.ts` (Abschnitt «Stadtrecht · Rang k von 6»), `app.ts` (Kauf-Callback, Meldung), `taxView.ts`/`guide.ts` (B7).

**Tech Stack:** TypeScript, Vitest, Canvas-freie DOM-UI; keine neue Abhängigkeit (ADR-001); kein ADR nötig (Hebel- und Save-Muster aus I-112/I-153, Entscheide als Ruling).

## Entscheide des Plans

- **P-1 Startbedingung:** Der Strang startet, sobald **Seerecht auf main** ist (nach R874 4 liegen damit Stadtplanung und Inselproben schon dort). Grund: T04 ändert `activeLever` (Seerecht schreibt ihn um), T06 baut auf die dreiseitige Karte (R874 5), T02 nimmt die Save-Nummer nach allen Vorgängern. Option für L0 siehe E-2 (Frühstart T01).
- **P-2 Charter im Hebel-Leser:** `activeLever(world: LeverWorld, kind, key?)` mit `type LeverWorld = Pick<World, 'council'> & { readonly charter?: readonly CharterSide[] }`. Zuerst die Ratsstufen wie heute, danach `world.charter ?? []`: Index i mit `'B'` liefert `CHARTER_SESSIONS[i].b.lever`, wenn Art und Schlüssel passen. Optional, damit die Seerecht-Helfer (`seaTileTicks(raw)` im Save, `Pick<World, 'council'>`) ihre Signatur behalten. Disjunktheit (AK-ST-01) macht die Reihenfolge wirkungslos.
- **P-3 Save-Nummer (R874 4, R674):** T02 setzt `SAVE_VERSION` = Stand main beim Start von T02 + 1 (erwartet 22 nach Stadtplanung 19, Inselproben 20, Seerecht 21), Migration `migrateV<n−1>ToV<n>`. Tests versionsneutral (Fixture über `foldBackCharter` mit `SAVE_VERSION − 1`). Landet bis zum Merge-Gate ein weiterer Save-Sprung auf main, zieht T09 die Nummer nach.
- **P-4 Faltketten:** Jede Testkette, die heute mit dem äussersten Faltschritt beginnt (`foldBackTrial` bzw. nach Stadtplanung `foldBackStadt`, nach Inselproben deren Schritt), bekommt `foldBackCharter` aussen (T02, per `rg -n "foldBack[A-Z][a-z]+\(" tests`). Exakte Versions-Pins früherer Stränge (z. B. Seerecht `PRE_SEERECHT_VERSION + 1`) werden auf `toBeGreaterThanOrEqual` umgestellt, nur diese Zeile.
- **P-5 Karten- und Listentexte (Textvorschlag, kein Spielwert):** A-Name «Steuer +2 %», A-Text «+2 % Steuer in allen Stufen.»; B-Name «<Gebäude> schneller» (Steinbrüche, Werkzeugmacher, Gewürzplantagen, Fischerhütten, Schäfereien, Zuckerrohrplantagen), B-Text laut Spec §3.1. Liste: `${Recht}: ${Seitenname}` («Marktrecht: Steuer +2 %»). Kostenzeile ohne Nullposten («5000 Geld · 20 Stein»). Hinweis «Gilt für die ganze Partie.» (`CHARTER_NOTE`). Änderung durch `lead-design` im Task-Review von T01 möglich, ohne Plan-Nachtrag.
- **P-6 Marke:** `councilBadge`: offene Beschlüsse → «Rat · n»; sonst `charterAffordable` → «Rat · Stadtrecht» (aktiv); sonst Rat je offen gewesen **oder** `charterUnlocked` → «Rat»; sonst `null`. Damit öffnet Umschalt + R nach Ziel 1 die Karte auch ohne je offenen Ratsbeschluss (`councilToggleAllowed` unverändert über die Marke).
- **P-7 Hinweis:** `charterBecameAffordable(prev: boolean | null, next: boolean)`; `app.ts` hält `prevCharterAffordable` in der Spiel-Closure (startet `null`, Laden und «Neue Insel» bauen die Closure neu, R-Muster `prevCouncil`).
- **P-8 Steuer-Anzeige (B7):** `taxEffect(level, charterPts = 0)` in `guide.ts` (Standard 0 hält Bestandstests), `tierTaxTooltip` addiert `charterTaxPoints(world)`; Aufrufer mit Welt (`taxView.ts`, `inspect.ts:684`) reichen die Punkte durch. Prognose `tierTaxPerMinute` bleibt auf `effectiveTaxPct`.
- **P-9 Fixtures Browser-Check (B8):** `tests/sim/charterFixtures.ts` (T03) baut die Stände «Glas 0», «alles leistbar», «Rang 6» aus `createWorld` plus Setzungen; der Playtester lädt sie im Seitenkontext (`await import('/tests/sim/charterFixtures.ts')`, `serialize`, Autosave, «Fortsetzen», Muster `tools/render-qa/sitzung.mjs`) und hat damit automatisch den `SAVE_VERSION` des Merge-Stands.
- **P-10 Wächter R-1:** T04 ergänzt einen Grep-Test: in `src/sim/` liest nur `council.ts`, `charter.ts`, `save.ts`, `world.ts` das Feld `charter`; `src/ui/` liest es nur über `src/sim/charter.ts` bzw. `src/ui/charter.ts`.

## Konflikte und Reihenfolge (Stand Plan, `git diff --name-only main...<branch>`)

| Datei                                     | Vorgänger auf main vor Start                              | Stadtrecht                                  | Befund                                                 |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| `src/sim/council.ts`                      | Seerecht (`activeLever`, `isCouncilSide`, `seaTileTicks`) | T04 (`activeLever`, `charterTaxPoints`)     | nach P-1 kein Konflikt, T04 baut auf Seerecht-Form auf |
| `src/sim/save.ts`, `world.ts`, `types.ts` | Stadtplanung, Inselproben, Seerecht (je Version, Felder)  | T01 (`types.ts` Typen), T02 (Feld, Version) | Version nur in T02/T09                                 |
| `src/ui/councilCard.ts`, `council.ts`     | Seerecht T04 (drei Karten, `councilSides`)                | T05 (`council.ts` Marke), T06 (Abschnitt)   | R874 5: Seerecht-UI zuerst                             |
| `src/ui/app.ts`                           | Stadtplanung, ORT-A, Seerecht (Z. ≈ 633)                  | T06 (Callback, Meldung ≈ Z. 1002)           | vor T06 `git merge main`                               |
| `src/ui/guide.ts`                         | Stadtplanung                                              | T05 (`taxEffect`)                           | Stellen disjunkt                                       |
| `tests/sim/helpers.ts`                    | Stadtplanung (`foldBackStadt`), Inselproben               | T02 (`foldBackCharter`)                     | Faltschritt aussen (P-4)                               |
| `README.md`, `docs/arc42.md`              | alle                                                      | T08                                         | nur ergänzen, bei Konflikt alle Zeilen behalten        |

## Datei-Ownership

| Datei                                                                                                                                                                                        | T01 | T02 | T03 | T04 | T05 | T06 | T08 | T09                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- | --- | --- | --- | --- | --------------------- |
| `src/sim/defs/charter.ts` (neu), `src/sim/types.ts` (Typen `CharterSide`, `CharterLever`, `CharterSessionDef`)                                                                               | ja  |     |     |     |     |     |     |                       |
| `tests/sim/charter.test.ts` (neu; je Task eigener `describe`-Block am Ende)                                                                                                                  | ja  |     | ja  | ja  |     |     |     |                       |
| `src/sim/types.ts` (`World.charter`), `src/sim/world.ts`, `src/sim/save.ts`, `tests/sim/charter-save.test.ts` (neu)                                                                          |     | ja  |     |     |     |     |     | ja                    |
| `tests/sim/helpers.ts` (`foldBackCharter`), Faltketten und Versions-Pins in `tests/sim/*save*.test.ts`, `helpers.test.ts`                                                                    |     | ja  |     |     |     |     |     | ja                    |
| `src/sim/charter.ts` (neu), `tests/sim/charterFixtures.ts` (neu)                                                                                                                             |     |     | ja  |     |     |     |     |                       |
| `src/sim/council.ts`, `src/sim/edicts.ts` (nur `effectiveTaxPct`, Kopfkommentar), `tests/sim/charter-levers.test.ts` (neu)                                                                   |     |     |     | ja  |     |     |     |                       |
| `src/ui/charter.ts` (neu), `src/ui/council.ts`, `src/ui/taxView.ts`, `src/ui/guide.ts`, `src/ui/inspect.ts` (Z. ≈ 684), `tests/ui/council.test.ts` (Ende), `tests/ui/taxView.test.ts` (Ende) |     |     |     |     | ja  |     |     |                       |
| `src/ui/councilCard.ts`, `src/ui/app.ts`, `src/style.css` (`.council-*`, `.charter-*`), `tests/ui/councilCard.test.ts` (Ende)                                                                |     |     |     |     |     | ja  |     |                       |
| `README.md`, `docs/arc42.md`, `docs/spielwerte.md`, `docs/beobachtungen.md` (D1, E-017)                                                                                                      |     |     |     |     |     |     | ja  | `arc42.md` Save-Zeile |

Nicht angefasst: `src/sim/defs/council.ts`, `src/sim/defs/buildings.ts`, `src/sim/population.ts`, `tests/sim/balance*.test.ts`, `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, `src/render/`, `src/audio/`, `docs/studio/`, Specs. T00 und T07 ändern keine Datei.

## Worktree

`feat/stadtrecht` in `.worktrees/stadtrecht` ab `plan/stadtrecht`, vor T00 `git merge main` (Merge, kein Rebase); vor T06 und T09 erneut `git merge main`. Ein Strang, **seriell** (T01–T04 teilen `types.ts`/Tests, T05/T06 brauchen T03/T04). Vor Anlage `git worktree list` prüfen (R329).

## Tasks

| Task | Titel                                                     | Datei              | AK-IDs                                | Strang | blocked-by                         | Modell | Tools | Persona                              |
| ---- | --------------------------------------------------------- | ------------------ | ------------------------------------- | ------ | ---------------------------------- | ------ | ----- | ------------------------------------ |
| T00  | Testzeiten der berührten Tests messen (Controller)        | `T00-messung.md`   | –                                     | sr     | Seerecht auf main, Testsperre frei | sonnet | 10    | Controller                           |
| T01  | Defs und Typen                                            | `T01-defs.md`      | AK-ST-01                              | sr     | T00                                | sonnet | 30    | `tech-sim-engineer`                  |
| T02  | Weltfeld, Save, Migration, Faltketten                     | `T02-save.md`      | AK-ST-11, AK-ST-02 (Feld)             | sr     | T01                                | sonnet | 50    | `tech-sim-engineer`                  |
| T03  | `buyCharter` / `buyCharterReason`, Fixtures               | `T03-kauf.md`      | AK-ST-02 (Kauf), 03, 04, 05, 08, 09   | sr     | T02                                | sonnet | 45    | `tech-sim-engineer`                  |
| T04  | Leser: Hebel, Steuer, Determinismus, Wächter              | `T04-leser.md`     | AK-ST-06 (Sim), 07, 10, 12            | sr     | T03                                | sonnet | 50    | `tech-sim-engineer`                  |
| T05  | UI-Helfer: Ansicht, Marke, Hinweis, Steuer-Anzeige        | `T05-ui-helfer.md` | AK-ST-13, 14, 15, AK-ST-06 (Prognose) | sr     | T04                                | sonnet | 45    | `tech-ui-engineer`                   |
| T06  | Rats-Karte Abschnitt Stadtrecht, `app.ts`, CSS            | `T06-ratskarte.md` | Vorarbeit AK-ST-16/17 (Fake-DOM)      | sr     | T05, `git merge main`              | sonnet | 45    | `tech-ui-engineer`                   |
| T07  | Browser-Check 1280 px                                     | `T07-playtest.md`  | AK-ST-16, AK-ST-17                    | sr     | T06                                | sonnet | 35    | `qa-playtester`                      |
| T08  | Doku (D1, E-017)                                          | `T08-doku.md`      | –                                     | sr     | T07                                | sonnet | 15    | `tech-ui-engineer` (Fortsetzung T06) |
| T09  | Nachzug vor dem Merge-Gate: `git merge main`, Save-Nummer | `T09-nachzug.md`   | AK-ST-11 (Lauf), AK-ST-12 (Lauf)      | sr     | T08, Final-Review OK               | sonnet | 25    | `tech-sim-engineer`                  |

Summe ≈ 350 Tools.

## Global Constraints (gelten in jedem Task)

- `src/sim/` DOM-frei, deterministisch, kein RNG im Stadtrecht; Aktionen werfen nie (`{ ok, reason }`); Spielwerte nur in `src/sim/defs/charter.ts` (Werte R870 R-2, Änderung nur per Werte-Ruling).
- Kein Controller kauft (R870 R-1); `tests/sim/balance*.test.ts`, `controller.ts`, `merchantsController.ts` ohne Diff.
- Tests lesen Kosten, Punkte und Takte aus den Defs; Ausnahme AK-ST-07 (Zielwerte 40/40/40/28/35/35 aus Spec §3.1). Keine feste Save-Nummer in Tests.
- Bestehende Tests nur ergänzen; Anpassung nur, wo der Plan sie nennt (Faltketten, Versions-Pins P-4).
- Desktop-first ab 1280 px; bei 800 px nur «stürzt nicht ab».

## Test- und Prüfpflichten (wörtlich in jedes Umsetzer-Briefing)

- **Testsperre (R380):** Tests nur bei freier Sperre (`uptime`: 1-min-Load ≤ 4, kein anderer `vitest`/`make check`-Lauf; sonst `waiting`).
- **Rot zuerst:** neuer Test vor der Umsetzung, rote Ausgabe (Exit ≠ 0) im Bericht.
- **Teilbeleg je Task (R810), nie `make check` je Task:** `npx vitest run <Testdateien des Tasks>; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?` (R398), `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`. Exit-Codes nie in eine Pipe.
- **Zeitreserve:** Laufzeit der berührten Tests mit der T00-Messung vergleichen; > 20 % langsamer im Bericht nennen.
- **Zeittests (R270):** keine Uhr in neuen Tests; neue Tests nicht in `ZEITTESTS`.
- **Balancing (R810):** `git diff main -- tests/sim/balance*.test.ts tests/sim/controller.ts tests/sim/merchantsController.ts src/sim/defs/council.ts src/sim/defs/buildings.ts; echo EXIT=$?` leer; der Balancing-Lauf selbst im Release-`make push-check`. Wertänderung nur per Ruling.
- **Meldeweg (R856):** «Melde dein Ergebnis per SendMessage an <agentId des Controllers>, nie an main.»

## Review Focus (nicht durch AK abgedeckt, Test im genannten Task)

1. Abgewiesener Kauf ändert nichts, auch nicht `charter` bei Teilzahlung (Reihenfolge: erst prüfen, dann abziehen) → T03, tiefer Vergleich.
2. `activeLever` mit Rats-**und** Stadtrecht-Hebel in einer Welt (z. B. `council[4] = 'A'` Glasrecht plus `charter = ['B']`): beide wirken → T04.
3. Kauf in der Pause: Karte, Marke und Kasse zeigen den neuen Stand ohne Tick → T06 (Fake-DOM: nach `onBuyCharter` ruft der Aufrufer `update`), T07 Browser.
4. Gewählte, nicht gekaufte Seite bleibt nach `update` markiert; nach dem Kauf ist keine Seite markiert → T06.
5. Speichern direkt nach einem Kauf lädt (Länge = Rang) → T02/T03 Roundtrip mit Fixture «Rang 6».

## Budget (Antrag für das Gate Plan)

Formel: 7 Umsetzer-Tasks mit eigenem Start (T01–T06, T09) × 2 + 1 QA-Check (T07) + 1 Final-Review (`lead-qa`, opus) + 3 Controller-Instanzen (R874 A2) = 19; × 1,3 = 24,7 → **25 Starts, Parallelität 1.**
Geplant **18**: Umsetzer 7, Reviews `qa-code-reviewer` T01–T06 (6), T07 `qa-playtester` (1), Final-Review (1), Controller (3). T09-Review per `SendMessage` an den T02-Reviewer, T08 per `SendMessage` an die T06-Instanz, Fix-Runden und Delta-Review (R553) per `SendMessage` (zählen nicht). Reserve 7 (Ersatzstarts, falls eine Fortsetzungs-Instanz nicht mehr vorliegt; Wiederholung T07).
Controller (`sonnet`, ≤ 4 Tasks, ≤ 6 Arbeiter-Starts je Instanz, R167/R190): **I1** T00–T03 (6 Starts), **I2** T04–T06 (6 Starts), **I3** T07, T08, nach dem Final-Review T09 (2 Starts; Final-Review startet L0 bei `lead-qa`).

## AK-Zuordnung (17 AK)

| AK                      | Beleg                                                                                                | Task     |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| AK-ST-01                | `tests/sim/charter.test.ts` (Defs)                                                                   | T01      |
| AK-ST-02                | `charter-save.test.ts` (neue Welt `[]`), `charter.test.ts` (Kauf vor `won`)                          | T02, T03 |
| AK-ST-03 bis 05, 08, 09 | `tests/sim/charter.test.ts` (Kauf)                                                                   | T03      |
| AK-ST-06                | `tests/sim/charter-levers.test.ts` (Satz, Edikt, Tick-Ertrag), `tests/ui/taxView.test.ts` (Prognose) | T04, T05 |
| AK-ST-07, 10, 12        | `tests/sim/charter-levers.test.ts`; AK-ST-12 `balance*` im Release-`push-check`                      | T04      |
| AK-ST-11                | `tests/sim/charter-save.test.ts`; Lauf erneut in T09                                                 | T02, T09 |
| AK-ST-13 bis 15         | `tests/ui/council.test.ts`, `tests/ui/taxView.test.ts`                                               | T05      |
| AK-ST-16, 17            | Browser, `.studio/qa/STADTRECHT/`                                                                    | T07      |

## Ruling-Entwürfe (für L0, R471)

- **ST-E1 (Gate Plan STADTRECHT):** Plan `plan/stadtrecht` freigegeben: T00–T09, ein Strang seriell, 25 Starts (18 geplant), Parallelität 1, drei Controller-Instanzen; kein ADR, keine Abhängigkeit.
- **ST-E2 (Startbedingung, P-1):** Umsetzung startet, wenn Seerecht auf main ist; Frühstart von T01 nur nach E-2.
- **ST-E3 (Leseort, P-2, P-10):** `activeLever` liest `world.charter` als optionales Feld nach den Ratsstufen, `charterTaxPoints` liegt in `council.ts`; Grep-Wächter sichert R870 R-1.
- **ST-E4 (Save, P-3, P-4):** Version = main + 1 beim Start von T02, Nachzug in T09; `foldBackCharter` aussen, exakte Versions-Pins früherer Stränge werden zu `≥`.
- **ST-E5 (Texte, P-5):** Karten- und Listentexte laut P-5, Feinschliff durch `lead-design` im T01-Review.
