# M13-E1 Implementation Plan — Index (Edikte der Amtsstube, Betrieb stilllegen)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nach Ziel 1 erlässt der Spieler in der Amtsstube genau ein Edikt (Sparen, Handel, Wohlfahrt; 600 Geld, 5 min Sperre); jeder Betrieb lässt sich stilllegen (halber Unterhalt, keine Erzeugung). Beides im Save-Sprung v11.

**Spec:** [2026-10-10-m13-e1-edikte-design.md](../../specs/2026-10-10-m13-e1-edikte-design.md) mit Anhängen 01–05 (Stand `3acc7e2f`); Rulings R452 (Ansatz A, O1–O11, B1–B3), R455 (Nacharbeit, Q-B3), R456 (Ausnahme `balance-upgrade.test.ts`, Plan frei).

Prozessstufe **voll** · Meilenstein M13 · Paket M13-E1 · Planbasis `main` @ `2dbf1ff4` · Format E-010: dieser Index, [ak.md](ak.md) (Zuordnung aller AK-M13E1-01…41 und AK-M13STL-01…11) und je Task eine Datei ≤ 10 KB. Arbeiter und Reviewer lesen nur ihre Task-Datei und die dort genannten AK in der Spec.

## Global Constraints

- `src/sim/` DOM-frei, deterministisch, kein Zufall in neuen Pfaden; Aktionen werfen nie, liefern `{ ok, reason }`; neue Werte nur in `src/sim/defs/`. Keine Wertänderung an bestehenden Defs, keine Laufzeit-Abhängigkeit, kein ADR nötig (Spec §11).
- **Baseline (Spec §6, AK-M13E1-21):** `git diff --diff-filter=M main -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/seePins.ts` nennt nur `balance-upgrade.test.ts` (eine Zeile `buyPrice`, R456). Kein Hash-Pin, kein `CHAIN_HASHES`/`V6_FORMS`-Wert ändert sich; ein roter Pin heisst **Stopp und Meldung**, nie nachpinnen.
- **Pflicht-Stopp T08:** Verfehlt ein Seed-Wert eine Grenze relativ zu K′, stoppt der Umsetzer und meldet an `lead-design`; Grenzen und Festwerte ändert nur ein Ruling L0 (Anhang 03 A, P-1).
- TOOL-TESTLOCK (R380): in Tasks nur gezielte Läufe `npx vitest run <Dateien>`, je Code-Task `npx tsc --noEmit` und `make lint` Exit 0 (R398); `make test`/`make check` nur der Controller (Entscheid E8). Exit-Codes `; echo EXIT=$?`, nie in eine Pipe. Code mit Edit/Write, nicht per sed/perl. Commit-Präfixe `feat:`/`test:`/`refactor:`/`docs:`; vor Doku-Commits `make docs-check`. Kein Rebase, `main` und der Sim-Branch werden per Merge geholt.
- Desktop-first: Panel-Spalte 280 px ab 1280 px; schmaler nur «stürzt nicht ab». Alle Zahlen im UI aus Defs und Sim-Abfragen.

## Architektur

1. **Defs und Typen (T01):** `src/sim/defs/edicts.ts` (`EDICTS`, `EDICT_IDS`, `EDICT_COST`, `EDICT_UNLOCK`), `EDICT_LOCK` in `timing.ts`, `PAUSED_UPKEEP_PCT` in `buildings.ts`; `EdictId`, `EdictDef` in `types.ts`.
2. **Save v11 zuerst (T02):** Weltfelder `edict`, `edictLockedUntil`, `Building.paused?`, Zustand `'paused'`, `SAVE_VERSION 11`, `migrateV10ToV11`, Prüfung C1–C7 und `foldBackToV10` landen **in einem Commit**; sonst sind Rundlauf und Hash-Pins zwischen zwei Tasks rot.
3. **`src/sim/edicts.ts` (T03, T05, T06):** `activeEdictDef`, `activeEdict`, `edictReason` (reine Prüfung R2 Schritte 1–6, auch für die UI), `setEdict`; später `edictTaxPoints`, `effectiveTaxPct`, `growthInterval`, `edictUpgradeWait`. Importiert nur `townhall`, `types`, `defs/*`; `townhall.ts` bleibt Blatt (PLAN-B9, deshalb `effectiveTaxPct` hier statt in `townhall.ts`, Entscheid E1).
4. **Wirkungen:** `buyPrice(world, good, n)` in `trade.ts` (T04); `taxUnits`, `totalUpkeep`/`tickEconomy` (T05); `tickPopulation`-Takt und Stapelregel in `upgradeStatus` (T06). Ohne wirkendes Edikt bitgleich (R1.3).
5. **Stilllegen (T07):** neues `src/sim/pause.ts` (`setPaused`), `buildingUpkeep` in `levels.ts` (einziger Upkeep-Leseort, PLAN-NAHT); `advance`, `goodsBalance`, `tickCrises`, `recomputeConnectivity` mit Vorrang Ausfall → stillgelegt → Anbindung.
6. **Seed-Läufe (T08):** `tests/sim/balance-edicts.test.ts` nach Anhang 03, Phase 1/2 einmal in `beforeAll`, Varianten als `deserialize(serialize(…))`-Kopien.
7. **UI (T09–T12):** reine Helfer `src/ui/edictView.ts`; DOM-Abschnitt `src/ui/edictSection.ts`, eingehängt in `renderTownhall`/`updateTownhall` (`inspect.ts`); Kontor, Steuer-Tooltips, Haus-Text; Stilllegen-Knopf, Zustandstexte, Problemliste ohne stillgelegte Betriebe.
8. **Doku (T13), Browser (T14), Final-Review opus (T15).**

## Stränge, Worktrees, Datei-Ownership

| Strang | Worktree                | Branch            | Abzweig                                                                                    |
| ------ | ----------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| sim    | `.worktrees/m13-e1-sim` | `feat/m13-e1-sim` | von `main` nach Gate Plan (REL-17 berührt `src/sim`, `tests/sim` nicht)                    |
| ui     | `.worktrees/m13-e1-ui`  | `feat/m13-e1-ui`  | von `main` **nach dem REL-17-Merge**, dann `git merge --no-ff feat/m13-e1-sim` (Stand T03) |

| Task     | Dateien (exklusiv)                                                                                                                                                                                                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T01      | `src/sim/defs/edicts.ts` (neu), `src/sim/defs/timing.ts`, `src/sim/defs/buildings.ts`, `src/sim/types.ts`, `tests/sim/defs.test.ts`                                                                                                                                                                                  |
| T02      | `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/save.ts`, `tests/sim/helpers.ts`, `tests/sim/save-v11.test.ts` (neu), `tests/sim/save.test.ts` (nur Version/Index); **Typ-Brücke** `src/ui/texts.ts`, `src/ui/panelView.ts` (je ein `case 'paused'`, E3)                                                            |
| T03      | `src/sim/edicts.ts` (neu), `src/sim/build.ts`, `tests/sim/edicts.test.ts` (neu)                                                                                                                                                                                                                                      |
| T04      | `src/sim/trade.ts`, `tests/sim/trade.test.ts`, `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, `tests/sim/balance-upgrade.test.ts` (je nur `buyPrice(w, …)`), `tests/sim/edicts.test.ts`; **mechanisch** `src/ui/app.ts` (`tradeCtx`), `src/ui/trade.ts` (2 Aufrufe) (E3)                             |
| T05      | `src/sim/edicts.ts`, `src/sim/population.ts` (`taxUnits`), `src/sim/economy.ts`, `tests/sim/edicts.test.ts`                                                                                                                                                                                                          |
| T06      | `src/sim/edicts.ts`, `src/sim/population.ts` (`tickPopulation`, `upgradeStatus`), `tests/sim/edicts.test.ts`                                                                                                                                                                                                         |
| T07      | `src/sim/pause.ts` (neu), `src/sim/levels.ts`, `src/sim/economy.ts`, `src/sim/production.ts`, `src/sim/flow.ts`, `src/sim/crises.ts`, `src/sim/roads.ts`, `tests/sim/pause.test.ts` (neu), `tests/sim/scenarios.ts`, `tests/sim/scenario-saves.test.ts`                                                              |
| T08      | `tests/sim/balance-edicts.test.ts` (neu)                                                                                                                                                                                                                                                                             |
| T09      | `src/ui/edictView.ts` (neu), `tests/ui/edictView.test.ts` (neu), `src/ui/hints.ts`, `tests/ui/hints.test.ts`                                                                                                                                                                                                         |
| T10      | `src/ui/edictSection.ts` (neu), `src/ui/inspect.ts` (Amtsstube, `InspectActions`), `src/ui/app.ts` (Aktion `setEdict`), `src/style.css`, `src/ui/edictView.ts`, `tests/ui/edictView.test.ts`                                                                                                                         |
| T11      | `src/ui/trade.ts`, `src/ui/taxView.ts`, `src/ui/inspect.ts` (`upgradeOkText`), `tests/ui/trade.test.ts`, `tests/ui/taxView.test.ts`, `tests/ui/inspect.test.ts`                                                                                                                                                      |
| T12      | `src/ui/inspect.ts` (Betrieb), `src/ui/texts.ts`, `src/ui/panelView.ts`, `src/ui/hover.ts`, `src/ui/guide.ts`, `src/ui/problems.ts`, `src/ui/hints.ts`, `src/ui/app.ts` (Aktion `setPaused`), `src/style.css`, `tests/ui/{panelView,inspect,hover,guide,problems,hints}.test.ts`, `tests/render/statusMarks.test.ts` |
| T13      | `README.md`, `docs/arc42.md`, `docs/beobachtungen.md`                                                                                                                                                                                                                                                                |
| T14, T15 | keine (Ablage `.studio/qa/m13-e1/`, Review)                                                                                                                                                                                                                                                                          |

**Strang-Grenze:** Der Sim-Strang berührt `src/ui/` nur in T02 (Typ-Brücke) und T04 (drei mechanische `buyPrice`-Zeilen), beide **vor** dem ersten Merge in den UI-Strang. Danach gehört `src/ui/` allein dem UI-Strang; der Sim-Strang ändert nach T04 keine Datei ausserhalb `src/sim/`, `tests/sim/`. Der UI-Strang ändert nie `src/sim/` oder `tests/sim/`. Je Strang ein Arbeiter zugleich.

**Sim-Stand im UI-Strang** (`git merge --no-ff feat/m13-e1-sim` durch den UI-Controller): vor T09 (T03 fertig), vor T10 (T04), vor T11 (T06), vor T12 (T07), vor T13 (T08) und zuletzt nach dem letzten Sim-Fix.

## Berührungspunkte REL-17 und TOOL-BUENDEL-3

- **REL-17** (`.worktrees/rel-17`, `feat/rel-17`): neue Datei `src/ui/problems.ts` (T12 braucht `problemList`/`isCutOff`, AK-M13STL-11), `app.ts` (Importe Z. 53/89–95/109, `jumpToProblem` ≈ 426, Zug-Flags ≈ 750, `onHotkey` ≈ 790, `dragEnd` ≈ 842, Abriss-Zweig ≈ 891), `hover.ts` (`export HOUSE_TITLES` Z. 77), `input.ts`, `hotkeys.ts`, `messages.ts`, README, arc42, Beobachtungen. → UI-Strang **blocked-by REL-17-Merge** (zweigt danach ab, keine Konflikte). Sim-Strang: einzige Berührung ist T04 `tradeCtx` (`app.ts` Z. 813 auf `main`), ≥ 13 Zeilen von jedem REL-17-Hunk → kein Konflikt; vor dem Gate Merge `git merge main` im Sim-Worktree.
- **TOOL-BUENDEL-3** (`tool/b3-py`): `docs/arc42.md`, `Makefile`, `vite.config.ts` (`ZEITTESTS`). M13-E1 ändert `Makefile` und `vite.config.ts` nicht (`balance-edicts.test.ts` misst keine Wandzeit, gehört **nicht** in `ZEITTESTS`); T13 holt `main` vor der arc42-Änderung.
- **Merge-Reihenfolge:** REL-17 → (TOOL-BUENDEL-3) → M13-E1. Ein Gate Merge für den Meilenstein (gates.md „Gate Merge“, kein Ein-Paket-Release); `production-integrator` merged seriell `feat/m13-e1-sim`, dann `feat/m13-e1-ui`, je `--no-ff` mit `make check`. Vorprobe `git merge-tree --write-tree main feat/m13-e1-ui` Exit 0.

## Tasks

| ID  | Titel                                       | Datei                                              | AK ([ak.md](ak.md))             | Strang | blocked-by        | Modell | Grösse   |
| --- | ------------------------------------------- | -------------------------------------------------- | ------------------------------- | ------ | ----------------- | ------ | -------- |
| T01 | Defs und Typen Edikte                       | [T01-defs.md](T01-defs.md)                         | E1-02                           | sim    | Gate Plan         | sonnet | S ≈ 12   |
| T02 | Save v11, Migration, C1–C7, `foldBackToV10` | [T02-save-v11.md](T02-save-v11.md)                 | E1-01, 22–25, 26 (Sim)          | sim    | T01               | sonnet | M ≈ 35   |
| T03 | `edicts.ts`: `setEdict`, Abriss             | [T03-edikte.md](T03-edikte.md)                     | E1-03, 04, 05, 14, 15           | sim    | T02               | sonnet | M ≈ 25   |
| T04 | `buyPrice(world, …)` und Aufrufer           | [T04-kaufpreis.md](T04-kaufpreis.md)               | E1-09, 10, 13 (Kauf), 21        | sim    | T03               | sonnet | S ≈ 20   |
| T05 | Steuer und Unterhalt, Endzustand            | [T05-steuer-unterhalt.md](T05-steuer-unterhalt.md) | E1-06, 07, 08, 13 (Geld), 20    | sim    | T04               | sonnet | M ≈ 25   |
| T06 | Wachstumstakt und Stapelregel               | [T06-takt-wartezeit.md](T06-takt-wartezeit.md)     | E1-11, 12, 13 (Takt), 16        | sim    | T05               | sonnet | M ≈ 30   |
| T07 | Betrieb stilllegen (Sim), Szenarien         | [T07-stilllegen.md](T07-stilllegen.md)             | STL-01…08                       | sim    | T06               | sonnet | M ≈ 35   |
| T08 | Seed-Läufe B1/B3                            | [T08-seedlaeufe.md](T08-seedlaeufe.md)             | E1-17, 18, 19, 21, PLAN-M13-01  | sim    | T07               | sonnet | M ≈ 35   |
| T09 | Reine Helfer `edictView.ts`, Gründe         | [T09-edikt-view.md](T09-edikt-view.md)             | E1-26 (UI), 27–30               | ui     | T03, REL-17-Merge | sonnet | M ≈ 25   |
| T10 | Amtsstuben-Panel «Edikt»                    | [T10-amtsstube-panel.md](T10-amtsstube-panel.md)   | U-1…U-6 (Browser 34–37, 39, 40) | ui     | T09, T04          | sonnet | M ≈ 35   |
| T11 | Kontor, Steuer-Tooltips, Haus-Text          | [T11-kontor-steuer.md](T11-kontor-steuer.md)       | E1-31, 32, 33                   | ui     | T10, T06          | sonnet | M ≈ 25   |
| T12 | Stilllegen im UI, Problemliste              | [T12-stilllegen-ui.md](T12-stilllegen-ui.md)       | STL-09, 11                      | ui     | T11, T07          | sonnet | M ≈ 40   |
| T13 | Doku README, arc42, Beobachtungen           | [T13-doku.md](T13-doku.md)                         | Spec §11, Anhang 05             | ui     | T12, T08          | sonnet | S ≈ 15   |
| T14 | Browser-Lauf am Kandidaten                  | [T14-browser.md](T14-browser.md)                   | E1-34…41, STL-10                | –      | T13               | sonnet | 1 Lauf   |
| T15 | Final-Review opus über beide Stränge        | [T15-final.md](T15-final.md)                       | alle                            | –      | T14               | opus   | 1 Review |

Je Task: Umsetzer (`tech-sim-engineer` bzw. `tech-ui-engineer`) → `qa-code-reviewer` (sonnet, Urteil OK/BEDENKEN/ZURÜCK) → Fix-Runde per SendMessage bis OK. Nach T02 läuft einmal `make test` durch den Sim-Controller (E8); am Strang-Ende `git merge main` und `make check` durch den Controller.

**Controller (R167, R190):** `lead-tech` auf `sonnet`, je Instanz ≤ 4 Tasks: **A** sim T01–T04, **B** sim T05–T08, **C** ui T09–T12, **D** ui T13–T14 und Abschluss (Rulings, Handoff, „bereit fürs Final-Review“). A und C laufen ab T09 parallel, danach B und C bzw. B und D. Übergabe per Ledger `.superpowers/sdd/m13-e1-<strang>/ledger.md` und einem Satz Status.

## Review Focus

1. Ohne Edikt und ohne Stilllegung bitgleich: Baseline-Diff (oben) und alle Pin-Tests grün, `balance.test.ts` 6750 (T04, T08, T15).
2. `buyPrice` rundet **auf** über die Gesamtmenge (`⌊(n·buy·pct + 99) / 100⌋`), keine Marge 0 (AK-M13E1-10).
3. Stapelregel: `max(low, min(base, Fest ? low : ∞, edictWait))`, Defizit-Faktor danach; «hoch» bleibt `null` (T06).
4. Vorrang Ausfall → stillgelegt → Anbindung in `advance`, `tickCrises`, `recomputeConnectivity`, `setPaused` und `stateInfo` (T07, T12).
5. `foldBackToV9` faltet v11 über `foldBackToV10`, Aufrufer in `balance-crises`, `save`, `goal3`, `seaGolden` unverändert (T02).
6. Edikt-Karten: Knoten bleiben über Ticks gleich (Fokus), «Zu wenig Geld» klickbar mit `unaffordable` (T10).

## Budgetantrag

```text
Lead: lead-tech
Phase: M13-E1
Pakete:
- T01–T08 Sim (nein)
- T09 edictView (nein), T10 Amtsstube (ja), T11 Kontor/Steuer (ja), T12 Stilllegen-UI (ja), T13 Doku (nein)
Formel: 13 × 2 + 1 + 1 Final-Review = 28 → × 1,3 = 36,4 → aufgerundet 37
Parallelität: 2 (Stränge sim und ui, je 1 Arbeiter; Browser 1)
Bisher frei/verbraucht: —
Begründung Mehrbedarf: —
Beantragt: 37 Starts, Parallelität 2 (davon 1 Final-Review an lead-qa)
```

Aufteilung: **lead-tech 36** (T01–T14 mit dem ganzen Puffer), **lead-qa 1** (T15). Geplant sind **10 Arbeiter-Starts**: je Controller-Instanz Umsetzer + Reviewer (A, B, C je 2; D: Umsetzer T13 + Reviewer + `qa-playtester` T14 = 3) und das Final-Review; dazu 4 Controller-Instanzen (zählen nach R433 zum Paket). QA-Check: **ein** Browser-Lauf T14 statt je UI-Task (E6). **Schätzung:** ≈ 860 Tools, ≈ 145 min Summe, Wandzeit ≈ 95 min (Umsetzer 13 Tasks ≈ 355, Reviewer 13 × ≈ 10 = 130, Fix-Runden ≈ 60, Controller 4 × ≈ 40 = 160, Playtester ≈ 60, Final-Review ≈ 60, lead-qa ≈ 35; Minuten = Tools ÷ 6).

## Entscheidungen für das Gate Plan

- **E1 Modulzuordnung:** `effectiveTaxPct`, `edictTaxPoints`, `growthInterval` in `edicts.ts` statt `townhall.ts` (Spec §4 [Tech]); `townhall.ts` muss Blatt bleiben (`tests/sim/imports.test.ts` PLAN-B9). `setPaused` in neuem `pause.ts`, `buildingUpkeep` in `levels.ts` (PLAN-NAHT: nur `levels.ts` liest `upkeep`). Empfehlung ja.
- **E2 Task-Schnitt 8 + 5** statt 6–7 + 5–6 (Gate-Spec-Schätzung): Save v11 vor `edicts.ts` (atomarer Versionssprung), `buyPrice` früh (T04), damit der Sim-Strang `src/ui/` vor dem UI-Start verlässt; Wirkungen in T05/T06 geteilt (≤ 10 KB, ≤ 35 Tools). UI startet nach T03 statt T02. Empfehlung ja.
- **E3 Typ-Brücke:** `'paused'` in `BuildingState` bricht `tsc` in `texts.ts` (`stateInfo` ohne Default) und `panelView.ts` (`never`); T02 setzt dort je einen `case 'paused'` mit Wortlaut aus U-12, T04 stellt drei `buyPrice`-Aufrufe in `src/ui/` mechanisch um. Alternative: UI-Strang vor T02 starten (Konflikte in denselben Zeilen). Empfehlung ja.
- **E4 Trenn-Warnung:** stillgelegte Betriebe fehlen nicht nur in `problemList` (Spec S6, AK-M13STL-11), sondern auch in `cutOffIds` (REL-17 E4: Warnung und Klasse 1 sind dieselbe Menge). Empfehlung ja; `lead-design` kann im Gate widersprechen (eine Zeile in T12).
- **E5 v10-Stand für AK-M13E1-15/24** im Test über `foldBackToV10(serialize(w))` statt neuem 300-KB-Fixture; echte Altstände prüft die Kette über die v1…v9-Fixtures. Empfehlung ja.
- **E6 Ein Browser-Lauf** T14 am Kandidaten für T10–T12 (wie R453 E9), statt drei. Spart 2 Starts und ≈ 100 Tools; Risiko: UI-Befund spät → Fix im UI-Strang, T14 Teil-Wiederholung. Empfehlung ja.
- **E7 Browser-Stand ab Ziel 1 (R452):** neue Szenarien `m13-ziel1` (Referenz-Controller Seed 3 bis `won`, Amtsstube, Geld 3000) und `m13-vor-ziel` (gleicher Lauf vor `won`) in `tests/sim/scenarios.ts` (T07), geschrieben über `SCENARIO_OUT`. Empfehlung ja.
- **E8 `make test` nach T02** durch den Sim-Controller (Versionssprung berührt die ganze Suite), sonst nur gezielte Läufe. Empfehlung ja.
- **E9 Pflicht-Stopp** T08 und roter Hash-Pin: Meldung statt Anpassung (Spec Anhang 03 A, R455). Info.

## Ausgelagert (nicht M13-E1)

Denkmal (E2, O7/O8/O11), Controller-Strategie mit Edikt oder Stilllegung, Statusmarke «stillgelegt» (P-4), Wechselgebühr und Feinwerte (P-5), Chronik-Einträge, Tastenkürzel, Hinweis P-2 im Vorschlag-Anhang (lead-design), Ausbau-Vorschau mit halbem Unterhalt (bleibt nominal).
