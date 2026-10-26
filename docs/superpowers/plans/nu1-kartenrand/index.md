# Plan NU-1 · Kartenrand (Erweiterung «Neue Ufer», Stufe voll)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (Controller `lead-tech` auf `sonnet`). Schritte mit `- [ ]`. Arbeiter bekommen nur ihre Task-Datei und die AK-IDs.

**Spec:** `docs/superpowers/specs/2026-10-25-nu1-kartenrand-design.md` (`design/neue-ufer` @ `00e17e3f`), Anhang 02 (normativ, inkl. §8 AK-25a/b, 37–56), Anhang 01 (Rechnung). Gate Spec `.studio/handoffs/2026-10-26-lead-qa-gate-spec-NEUE-UFER.md`; Rulings R976, R978, R979, R909. Plan gegen main `07cd8183` (`SAVE_VERSION` 19).

**Ziel:** Nach Ziel 3 ein Kartenhaus, eine Expedition je Zeit in drei Nebelgebiete mit Wahl-Karten, Proviant, Umweg und Umkehr, acht Fundstücke als Dauerhebel, Save main + 1.

**Spielerwirkung:** Neue Frage «Welches Schiff gebe ich her, was packe ich ein?»; Ziele 1–3 bleiben bitgleich (alles hinter `wonSpice`).

## Architektur (≤ 15 Zeilen)

- Defs: `src/sim/defs/expedition.ts` (neu: Konstanten, `SEA_AREAS`, `EXPEDITION_CARDS`, `FINDS`), `maphouse` in `defs/buildings.ts`, `U7` in `defs/unlocks.ts`.
- **Blatt `src/sim/finds.ts`** (importiert nur `./defs/*`, `./types`): `hasFind`, `findCycle`, `findTravel`, `routeGoodsPerDirection`, `storageCap`, `findServiceRadius`, `supplyRadiusOf`, `findNote`. Einzige Stelle neben `defs/` mit `STORAGE_CAP`/`ROUTE_GOODS_PER_DIRECTION` (AK-40).
- **Blatt `src/sim/expeditionCore.ts`** (importiert nur `./defs/*`, `./types`): `expeditionShipAway`, `boardsNow`, `beginSection`, `turnBack`, `backTicks`. Brücke für `ships.ts` ohne Importkreis (PLAN-B9).
- **`src/sim/expedition.ts`** (neu): `startExpedition`, `startReason`, `cancelExpedition`, `chooseOption`, `optionReason`, `drawCards`, `tickExpedition`, `soleSpiceShip`, `areaDuration`. Importiert `ships.ts` (`storeCargoHome`), nie umgekehrt.
- Tick: `tickExpedition(world, lost)` direkt nach `tickShips` in `step()`; `StepReport.expedition: ExpeditionNotice[]`. Anlegen in `boarding` passiert in `tickShips` (Haken vor `handleDocked`).
- Wirkorte: `effectiveCycle` (F3/F6/F8), `laneTicksOf`/`travelTicksOf` (F1), `serviceRadiusOf` (F4), `inSupplyRange`/`queries.ts` (F5), Lagerkappungen (F7), Routenprüfung (F2).
- Save: `src/sim/expeditionSave.ts` (neu: Ladeprüfung, Migration, Kappung N2); `save.ts` nur Konstante `SAVE_V_KARTENRAND`, Kettenzeile, zwei Prüf- und ein Kappungsaufruf.
- UI: DOM-freie Helfer `src/ui/expeditionView.ts`, `seaMapView.ts`; Einbau in `inspect.ts`, `app.ts`, `hud.ts`, Seekarte, `renderer.ts`.

## Entscheide und Risiken

Plan-Entscheide P-1 bis P-12 (Entwürfe E-NU-1 bis E-NU-6 an L0) und Risiken: [`entscheide.md`](entscheide.md). AK-Zuordnung, Review Focus, Ruling-Zuordnung und Gate-Vorprüfliste: [`ak-matrix.md`](ak-matrix.md). Pin-Liste 25b: [`pins.md`](pins.md).

## Dateimatrix (Ownership; nie zwei Umsetzer gleichzeitig an einer Datei)

| Datei                                                                                                                   | Tasks                   |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `src/sim/defs/expedition.ts` (neu), `defs/buildings.ts`, `defs/unlocks.ts`, `src/sim/unlocks.ts`                        | T01, T09                |
| `src/sim/types.ts`, `src/sim/world.ts`                                                                                  | T01, T02, T04, T05, T09 |
| `src/sim/save.ts`, `src/sim/expeditionSave.ts` (neu)                                                                    | T02, T03, T09           |
| `src/sim/finds.ts` (neu), `levels.ts`, `islands.ts`, `council.ts`, `supply.ts`, `economy.ts`, `trade.ts`, `queries.ts`  | T03, T09                |
| `src/sim/ships.ts`                                                                                                      | T03, T04, T09           |
| `src/sim/expeditionCore.ts`, `src/sim/expedition.ts` (neu), `src/sim/build.ts`, `src/sim/tick.ts`                       | T04, T05, T09           |
| `tests/sim/expedition*.test.ts`, `tests/sim/finds*.test.ts` (neu); Pins laut `pins.md` (u. a. `helpers.ts` nur Faltung) | T01–T06, T09            |
| `src/render/sprites.ts` (nur Platzhalter-Zuordnung `maphouse`, T01 Schritt 5)                                           | T01                     |
| `src/ui/expeditionView.ts` (neu), `seaMapView.ts`, `src/render/seaMap.ts`, `tests/ui/` (neu)                            | T07, T08                |
| Lagergrenze/Radius-Stellen in `src/ui/`, `src/render/overlays.ts` (Liste T07)                                           | T07                     |
| `src/ui/expeditionDialog.ts` (neu), übrige UI-Dateien und `renderer.ts` (Liste T08)                                     | T08                     |
| `README.md`, `docs/arc42.md`, `docs/spielwerte.md`, `docs/adr/ADR-010-…`, `docs/adr/ADR-005-…`                          | T11                     |

Strang A (T00–T06, T09–T11) und B (T07, T08) teilen keine Datei; B zweigt nach T05 ab. Nicht angefasst: `tests/sim/balance*.test.ts`, `tests/sim/controller.ts`, `seaGolden.test.ts`, `docs/studio/` (insbesondere `rulings.md`), Spec-Dateien. Sprite/Nebel-Optik: Paket NU1-ART (`lead-art`).

## Tasks

| Task | Titel                                            | Datei                | AK-IDs (AK-NU1-…)                                                              | Strang | blocked-by        | Modell | Tools | Persona             |
| ---- | ------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------ | ------ | ----------------- | ------ | ----- | ------------------- |
| T00  | Vorab: Worktree, Basis, Nachbarn, Pin-Liste      | `T00-vorab.md`       | –                                                                              | A      | Gate Plan         | sonnet | 20    | `tech-sim-engineer` |
| T01  | Defs, Kartenhaus, `U7`                           | `T01-defs.md`        | 01, 02, 08, 30, 25b (Freischaltung)                                            | A      | T00               | sonnet | 50    | `tech-sim-engineer` |
| T02  | Weltfelder, Save-Schritt, Ladeprüfung, Faltung   | `T02-save.md`        | 23, 24, 41, 42, 43, 44, 46, 25b (Save)                                         | A      | T01               | sonnet | 65    | `tech-sim-engineer` |
| T03  | Fundstück-Helfer und Wirkorte (F1–F8)            | `T03-finds.md`       | 19, 20, 37, 38, 39 (Lager, Kontor), 40                                         | A      | T02               | sonnet | 70    | `tech-sim-engineer` |
| T04  | Start, Abbruch, Schiff, Abriss, Ziehung          | `T04-start.md`       | 03, 04, 05, 06, 11, 12, 13, 14 (Sperren), 17, 52, 53, 54                       | A      | T03               | sonnet | 70    | `tech-sim-engineer` |
| T05  | Ablauf, Wahl, Rückkehr, Vergabe, Meldungen       | `T05-ablauf.md`      | 07, 09, 10, 14 (Rückkehr), 15, 16, 18, 19 (Rest), 21, 26, 34–36, 39 (Rückkehr) | A      | T04               | sonnet | 70    | `tech-sim-engineer` |
| T06  | Rundreise, Hash, Baseline                        | `T06-rundreise.md`   | 22, 45, 55, 25a, 25b (Schlussliste)                                            | A      | T05               | sonnet | 45    | `tech-sim-engineer` |
| T07  | UI-Helfer: Packen, Karte, Log, Seekarte          | `T07-ui-helfer.md`   | 27, 28, 29, 56                                                                 | B      | T05               | sonnet | 65    | `tech-ui-engineer`  |
| T08  | UI-Einbau: Karte, Dialoge, HUD, Seekarte, Liste  | `T08-ui-einbau.md`   | 31, 32, 47–51 (Einbau)                                                         | B      | T07               | sonnet | 75    | `tech-ui-engineer`  |
| T09  | Merge-Stand: main, Save-Nr., Faltung, HAFEN-Naht | `T09-merge-stand.md` | 23, 25a, 25b, 05 (HAFEN)                                                       | A      | T06, T08 (B in A) | sonnet | 45    | `tech-sim-engineer` |
| T10  | Browser-Check                                    | `T10-playtest.md`    | 31, 32, 47, 48, 49, 50, 51                                                     | A      | T09               | sonnet | 40    | `qa-playtester`     |
| T11  | Doku, ADR-010/ADR-005-Nachtrag                   | `T11-doku.md`        | 33                                                                             | A      | T10               | sonnet | 20    | `tech-ui-engineer`  |

Reihenfolge: T00 → T01 → T02 → T03 → T04 → T05 → (T06 ‖ T07 → T08) → B in A → T09 → T10 → T11 → Final-Review. Summe ≈ 635 Tools.

## Budget (Starts-Antrag, Formel)

Pakete mit eigenem Review T01–T08 = 8 → × 2 = 16 · QA-Check 1 (T10) · Final-Review 1 → 18; + 30 % = 23,4 → **24 Starts**. Geplant 14: Umsetzer A `tech-sim-engineer` 2 (A1 T00–T03, A2 T04–T06 und T09; Übergabe per Ledger wegen Kontext) · Umsetzer B `tech-ui-engineer` 1 (T07, T08, T11 per `SendMessage`) · `qa-code-reviewer` T01–T08 8 · `qa-playtester` T10 1 · Final-Review **`model: opus`** 1 · Delta-Reserve 1 eingeplant; Rest 10 für frische Delta-Reviews (opus) und Umsetzer-Ablösung. T09 und T11 prüft das Final-Review mit (Merge bzw. Doku; AK-33 ist «Review»). **Parallelität 2** (A und B), höchstens 2 gleichzeitige Testläufe.

## Controller-Briefing und Prüfpflichten

Wörtlich aus [`briefing.md`](briefing.md) übernehmen (Delta-Review immer frischer opus-Start; Testsperre «Last ≤ 4 nötig»; Rot zuerst; Teilbeleg je Task; kein Versionsliteral).

## Zeit-Tests (R392/R905)

Siehe [`zeiten.md`](zeiten.md). Regel R905: kein neuer Test > 500 ms; Tests > 500 ms auf main höchstens + 50 %. T09 misst nachher mit demselben Befehl (Last ≤ 4 nötig) und trägt die Spalte «Branch» nach.
