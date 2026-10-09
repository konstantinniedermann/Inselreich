# Steuer je Stufe (I-028) Implementation Plan — Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vier getrennte Steuerregler (Pioniere, Siedler, Bürger, Kaufleute) in der Amtsstube, Save v10, ohne Spielstand- oder Baseline-Bruch.

**Architecture:** siehe Abschnitt «Architektur». **Tech Stack:** TypeScript, Vitest, Canvas 2D, keine Laufzeit-Abhängigkeit.

**Spec:** `docs/superpowers/specs/2026-10-09-steuer-je-stufe-design.md` mit `anhang-01-rechenbeispiele.md` und `anhang-02-gate-auflagen.md` (geht der Spec bei Widerspruch vor; **42 AK**). Verbindlich: R412, R414, R415.

Prozessstufe voll · Paket I-028 · Meilenstein ohne · Planbasis `main` @ 2987213 · Format E-010: dieser Index plus je Task eine Datei ≤ 10 KB im Ordner [`2026-10-09-steuer-je-stufe/`](2026-10-09-steuer-je-stufe/). Arbeiter und Task-Reviewer lesen nur ihre Task-Datei und die genannten AK-IDs (Spec + Anhang 02).

## Global Constraints

- `SAVE_VERSION = 10` fest (P-1); `migrateV9ToV10`; R8.5 nur Notfallregel mit eigenem L0-Ruling.
- Sim-Gründe bleiben wörtlich `'Sperrzeit'` und `'Steuer zu hoch'`; die UI erfährt die Stufe über `ReasonCtx.tier?: Tier` (P-2).
- `taxTarget` und `taxChangeSet` liegen in `src/sim/tax.ts` (P-2); `setTaxLevel`, Migration, `setAllTax` und die UI (`taxSummary`, Sperrhinweis) nutzen nur sie — kein zweiter Code für ziel(t).
- Neuer Def-Wert nur `TAX_LEVELS.high.pctByTier = { 4: 115 }` (R412 O1); keine Wertänderung für Stufen 1–3.
- `tests/sim/balance.test.ts`, `tests/sim/e0Pins.ts`, `tests/sim/e1Pins.ts` und `tests/sim/fixtures/` bleiben byte-gleich zu `main`; kein Pin-Wert ändert sich.
- `src/sim/` DOM-frei, kein RNG-Zugriff in neuen Pfaden, Aktionen werfen nie (`{ ok, reason }`).
- Keine neue Abhängigkeit, kein ADR (Spec §9). UI desktop-first, Panel 280 px; unter 900 px nur «stürzt nicht ab».
- Commit-Präfixe `feat:`, `fix:`, `test:`, `docs:`, `refactor:`; kein Rebase, kein Force-Push.

## Review Focus

1. **Key-Reihenfolge migrierter Stände:** `migrateV9ToV10` hängt `taxLevels` hinten an; jeder Text- oder Hash-Vergleich läuft über `foldBackToV9` (Reihenfolge `V9_WORLD_KEYS`, nur vorhandene Schlüssel). Test: AK-T24 in T1a.
2. **`version = 10` als «unbekannt» in Bestandstests:** 9 Stellen in `save.test.ts`; nach v10 gültig. Alle auf `SAVE_VERSION + 1`. Test: T1a Schritt 3.
3. **Fest ohne Häuser im Radius:** Ablehnung nur, wenn H nicht leer ist und kein Haus «normal» hat. Test: AK-T14 in T1b.
4. **Kaufleute «niedrig» über Umwege:** Migration, `setTaxLevel('low')` und `setAllTax` erzeugen nie `taxLevels[4] = 'low'`; die Ladeprüfung weist es ab. Test: AK-T10, AK-T18, AK-T19 in T1b.
5. **Sperrhinweis «alle Stufen»:** kleinste gesperrte Stufe _in C_, nicht die kleinste gesperrte überhaupt. Test: AK-T31 in T2.

## Architektur (≤ 15 Zeilen)

- `src/sim/types.ts`: `TaxLevelDef.pctByTier?`, `World.taxLevels: Record<Tier, TaxLevel>`, `World.taxLockedUntil: Record<Tier, number>`. `src/sim/defs/tiers.ts`: `TIER_IDS`, `pctByTier`.
- `src/sim/townhall.ts`: `effectiveTaxLevel(w, tier)`, `taxPct(level, tier)` (hier statt in `tax.ts`: `population.ts` braucht `taxPct`, und `tax.ts → unlocks.ts → population.ts` wäre ein Import-Zyklus).
- `src/sim/tax.ts`: `canRiseTier`, `taxTarget`, `taxChangeSet`, `taxLocked`, `noRiseReason`, `setTierTaxLevel`, `setTaxLevel`.
- `src/sim/population.ts`: `tierCap`, `taxBaseByTier`; `houseCap`, `upgradeStatus`, `taxUnits` je Stufe des Hauses.
- `src/sim/feast.ts`: Steuer-Ablehnung über Häuser im Radius (R7.3). `src/sim/unlocks.ts`: `triggerTaxBlocked` (exportiert, R7.4).
- `src/sim/save.ts`: v10, `migrateV9ToV10`, `isValidTaxFields`. `tests/sim/helpers.ts`: `foldBackToV9`, `setAllTax`.
- `src/ui/taxView.ts` (neu, rein) + `inspect.ts` (Raster 4 × 3 + «alle Stufen»), `hud.ts`, `hover.ts`, `hints.ts`, `guide.ts`, `app.ts`.
- Schnitt: **T1a** ändert nur die Form (Verhalten bitgleich, alle vier Regler immer gleich), **T1b** bringt die Regeln je Stufe, **T2** die Bedienung.

## Datei-Ownership (ein Strang `steuer-je-stufe`, Branch `feat/steuer-je-stufe`, Worktree `.worktrees/steuer-je-stufe`)

Seriell T1a → T1b → T2 → T3 → T4 im selben Worktree (nie zwei Umsetzer gleichzeitig). Gesperrt für alle: `tests/sim/balance.test.ts`, `tests/sim/e0Pins.ts`, `tests/sim/e1Pins.ts`, `tests/sim/fixtures/`, `src/render/`.

| Task | Eigentümer          | Dateien                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1a  | `tech-sim-engineer` | `src/sim/{types,world,townhall,tax,population,feast,unlocks,save}.ts`, `src/sim/defs/tiers.ts`; `tests/sim/{helpers.ts,save.test.ts,goal3.test.ts,balance-crises.test.ts,scenario-saves.test.ts,scenarios.ts,unlocks.test.ts,taxes.test.ts,townhall.test.ts,feast.test.ts,merchants.test.ts}`; mechanisch: `src/ui/{hover,hints,hud,inspect,guide}.ts`, `tests/ui/{feast,hints,hud,inspect,startCard,guide}.test.ts` |
| T1b  | `tech-sim-engineer` | `src/sim/{defs/tiers,townhall,tax,population,feast,unlocks,save}.ts`; `tests/sim/{taxTiers.test.ts (neu),helpers.ts,save.test.ts,feast.test.ts}`                                                                                                                                                                                                                                                                     |
| T2   | `tech-ui-engineer`  | `src/ui/taxView.ts` (neu), `src/ui/{inspect,hud,hover,hints,guide,app}.ts`, `src/style.css`; `tests/ui/{taxView.test.ts (neu),format,hints,hud,hover,inspect,guide,startCard}.test.ts`; D1-Doku ausdrücklich erlaubt (E-017): `README.md`, `docs/arc42.md`                                                                                                                                                           |
| T3   | `qa-playtester`     | nur `.studio/qa/steuer-je-stufe/` (Screenshots, Szenenskript); kein Code                                                                                                                                                                                                                                                                                                                                             |
| T4   | `qa-code-reviewer`  | liest nur                                                                                                                                                                                                                                                                                                                                                                                                            |

**`hover.test.ts`** (R415 Punkt 3): gehört allein **T2**. T1a ändert in `hover.ts` nur `effectiveTaxLevel(world)` → `effectiveTaxLevel(world, 1)` (bei vier gleichen Reglern gleiches Ergebnis); `hover.test.ts` hat heute keinen Zugriff auf `taxLevel` und bleibt in T1a unberührt und grün. T2 ergänzt dort AK-T33 (Hauszeile, Amtsstube «gemischt»).

## Budgetantrag

Formel: Pakete × 2 + QA-Checks + 1 Final-Review = 3 × 2 + 1 + 1 = **8**; + 30 % = 10,4 → **11 Starts**, Parallelität **1** (R415).

| Start | Rolle               | Modell | Zweck                                  |
| ----- | ------------------- | ------ | -------------------------------------- |
| 1     | `tech-sim-engineer` | sonnet | T1a                                    |
| 2     | `qa-code-reviewer`  | sonnet | Review T1a                             |
| 3     | `tech-sim-engineer` | sonnet | T1b (frisch, liest nur T1b-Datei)      |
| 4     | `qa-code-reviewer`  | sonnet | Review T1b                             |
| 5     | `tech-ui-engineer`  | sonnet | T2                                     |
| 6     | `qa-code-reviewer`  | sonnet | Review T2                              |
| 7     | `qa-playtester`     | sonnet | T3                                     |
| 8     | `qa-code-reviewer`  | opus   | T4 Final-Review                        |
| 9–11  | Puffer              | –      | nur nach Meldung an L0 (vor Überschr.) |

Fix-Runden per SendMessage zählen nicht. **Controller-Übergabe:** Instanz 1 (`lead-tech`, sonnet) führt T0, T1a, T1b, T2 (4 Tasks, Starts 1–6) und übergibt nach Start 6 per Ledger `.superpowers/sdd/steuer-je-stufe/ledger.md` und einem Satz Status; Instanz 2 führt T3 und T4. Schätzung ≈ 330 Tools, ≈ 55 min.

## Task-Tabelle

| ID  | Titel                                         | Datei                                                         | AK-IDs (Spec + Anhang 02)                                                                                                                        | Strang          | blocked-by          | Modell |
| --- | --------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------- | ------ |
| T0  | Basismessung (R392), Worktree                 | dieser Index                                                  | –                                                                                                                                                | steuer-je-stufe | Push dieser Session | sonnet |
| T1a | Weltform, Save v10, Bestandstests             | [T1a-weltform.md](2026-10-09-steuer-je-stufe/T1a-weltform.md) | AK-T01, T03, T06, T17 (Grundfall), T18 (high/normal + P-1), T19 (Form + QA-g), T20, T21 (v4), T22, T23 (+B1), T24 (+B2/H-5), T25                 | steuer-je-stufe | T0                  | sonnet |
| T1b | Regeln je Stufe, Aktionen                     | [T1b-regeln.md](2026-10-09-steuer-je-stufe/T1b-regeln.md)     | AK-T02, T04, T05, T07–T16, T13 (+QA-i/H-2), T14 (+QA-a), T15 (+R7.4), T17 (+QA-h/H-1), T18 (low), T19 (Kaufleute low), T21 (v2 + H-6), T42 (Sim) | steuer-je-stufe | T1a (Review OK)     | sonnet |
| T2  | UI: Helfer, Raster, Kopfzeile, Hinweise, Doku | [T2-ui.md](2026-10-09-steuer-je-stufe/T2-ui.md)               | AK-T26–T33 (+QA-c, QA-d T33, QA-e, AK-T31/T32-Zusatz), T42 (UI)                                                                                  | steuer-je-stufe | T1b (Review OK)     | sonnet |
| T3  | Browser-Check                                 | [T3-playtest.md](2026-10-09-steuer-je-stufe/T3-playtest.md)   | AK-T34–T41 (+QA-d T36, QA-f/H-4)                                                                                                                 | steuer-je-stufe | T2 (Review OK)      | sonnet |
| T4  | Final-Review über die Branch                  | [T4-final.md](2026-10-09-steuer-je-stufe/T4-final.md)         | alle 42 AK                                                                                                                                       | steuer-je-stufe | T3                  | opus   |

## Pflichten je Umsetzungs-Task (DoD für T1a, T1b, T2)

- **R392 Zeiten:** Basis aus T0; nach dem Task dieselben Dateien auf main und Branch unmittelbar nacheinander; kein bestehender Test > 500 ms oder > +50 %; Zeiten vorher/nachher im Bericht.
- **Schnelle Make-Prüfungen** (R398, R410), je `; echo EXIT=$?`, nie in eine Pipe: `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts` → Exit 0.
- **Rot-Beleg** (R395, R410): je neuem Testfall die rote Ausgabe vor dem Fix im Task-Bericht.
- **Abschluss:** alle Tests grün (`make check` Exit 0; Lauf > 4 min → `run_in_background: true`, alle 4 min abfragen, E-037); `git diff main -- tests/sim/balance.test.ts tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/fixtures/` leer; bei Doku-Änderung `make docs-check` Exit 0.
- Entfällt eine Vorbedingung: Fehlerrichtung nennen und belegen, dass das abhängige Gate erfüllbar bleibt (R395). Prüfschritte nicht zur Budgetersparnis streichen; Mehrbedarf vorher melden.

## T0 Basismessung und Worktree (Controller)

Nur bei Last ≤ 4 (`uptime` in den Bericht; bei der Planung 4,83, darum noch keine Zeiten). Auf `main` im Hauptcheckout, `$SCRATCH` = Scratchpad der Controller-Session:

```bash
npx vitest related --run src/sim/population.ts src/sim/tax.ts src/sim/townhall.ts src/sim/save.ts src/sim/feast.ts src/sim/unlocks.ts src/sim/world.ts src/sim/defs/tiers.ts > "$SCRATCH/sim-main.txt"; echo EXIT=$?
npx vitest run tests/ui/feast.test.ts tests/ui/hints.test.ts tests/ui/hud.test.ts tests/ui/inspect.test.ts tests/ui/startCard.test.ts tests/ui/guide.test.ts tests/ui/hover.test.ts tests/ui/format.test.ts > "$SCRATCH/ui-main.txt"; echo EXIT=$?
```

Tests > 200 ms mit Zeit ins Ledger; die Briefings T1a/T1b/T2 nennen diese Liste. Bei Last > 4 verschieben (`blocked` loggen). Danach `git worktree add .worktrees/steuer-je-stufe -b feat/steuer-je-stufe main`.

## Zuordnung AK → Task (42 AK, Anhang 02)

| AK / Auflage                                          | Task                  |
| ----------------------------------------------------- | --------------------- |
| AK-T01, T03, T06                                      | T1a                   |
| AK-T02, T04, T05, T07–T12, T16                        | T1b                   |
| AK-T13 + QA-i (H-2)                                   | T1b                   |
| AK-T14 + QA-a                                         | T1b                   |
| AK-T15 + TECH-H-R7.4 (`triggerTaxBlocked`, B-2)       | T1b                   |
| AK-T17 Grundfall / + QA-h (H-1)                       | T1a / T1b             |
| AK-T18 high, normal, P-1 / Fall low                   | T1a / T1b             |
| AK-T19 Formfälle + QA-g / Fall `taxLevels[4] = 'low'` | T1a / T1b             |
| AK-T20 (QA-b)                                         | T1a                   |
| AK-T21 Kette, v4 / v2 + TECH-H-§6 (H-6)               | T1a / T1b             |
| AK-T22, T23 + TECH-B1, T24 + TECH-B2 (H-5), T25       | T1a (T4 prüft erneut) |
| AK-T26–T28, T29 + QA-c, T30 + QA-e                    | T2                    |
| AK-T31 + P-2-Zusatz (B-3), T32 + P-2-Zusatz           | T2                    |
| AK-T33 + QA-d (H-3)                                   | T2                    |
| AK-T42 Sim (B-1) / UI-Teil `taxSummary`               | T1b / T2              |
| AK-T34–T35, T36 + QA-d + QA-f (H-3, H-4), T37–T41     | T3                    |
| Doku Spec §9                                          | T2                    |

## Selbstprüfung (lead-tech)

- Spec R1–R8, §5 Randfälle, §6 Baseline, §7 U-1…U-13 und §7.6 (AK-T40) sind verteilt; leere Insel als Zusatzzeile in AK-T03 (T1a).
- Namen und Typen in den Interfaces-Blöcken der Task-Dateien sind identisch (T1a produziert, T1b/T2 konsumieren).
- `feastActive` bleibt ohne Inselprüfung (Spec «gleiche Geometrie»; Beobachtung bereits eingetragen, 34f362a).
