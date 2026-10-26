# Plan I-223 · Zehnt (Stufe voll)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (Controller `lead-tech` auf `sonnet`). Schritte mit `- [ ]`. Arbeiter bekommen nur ihre Task-Datei und die AK-IDs.

Owner `lead-tech` · Meilenstein ohne · **Spec:** `docs/superpowers/specs/2026-10-26-i223-zehnt-design.md` (`design/ideen20-folgen` @ `4c506883`, 29 991 B, AK-ZE-01…27), Rechnung `…-i223-zehnt-rechnung.md` (R977). Gate Spec BEDENKEN, Auflagen 1–8 (`.studio/handoffs/2026-10-26-lead-qa-gate-spec-I-223.md`), Rulings R981, R982, R983, R909.

**Ziel:** Je ein Schalter `Geld | Zehnt` für Pioniere (100 % Steuer als Werkzeug) und Siedler (10 % als Stein) in der Amtsstube, 1800 Ticks Sperre je Stufe, drei Welt-Felder mit Save-Schritt.

**Spielerwirkung:** Werkzeug- oder Stein-Engpass ohne Bergplatz lösen, 17 % unter Zukauf, bezahlt mit Kassen-Reichweite (Warnung vor dem Einschalten).

## Architektur (≤ 15 Zeilen)

- Werte: `TITHE_GOOD`, `TITHE_PCT`, `TITHE_UNITS_PER_100`, `TITHE_CARRY_DIVISOR` in `defs/tiers.ts`; `TITHE_SWITCH_LOCK` 1800 in `defs/timing.ts`. Typen `TitheTier`, `TitheGood` in `types.ts`.
- Welt: `titheOn`, `titheLockedUntil`, `titheCarry` (`types.ts`, Start in `world.ts` neben `taxCarry`).
- **Ein Rechenkern** `titheSplit(world): TitheSplit` in `population.ts` neben `taxUnits` (Geldanteil je Stufe, Zehntanteil je Gut, nach Regel 3 und 7). Nutzer: `tickTaxes`, neues `moneyTaxes(world)`, UI-Helfer `titheView.ts`, `balancePreview.ts` (DRY, Tech 3/4).
- `tickTaxes(world): TitheLoss` bucht Geldanteil wie heute, Ware per `addStock(home(world), g, n)` (Kappung über dessen Rückgabewert, nie `STORAGE_CAP` im neuen Code); `step` legt den Verfall als `StepReport.titheLost` ab (kein Welt-Feld).
- `setTithe(world, tier, on): Result` in `tax.ts`, Prüfreihenfolge Spec Regel 6; Wirkung nur mit `townhallActive` (Regel 7).
- `stats.taxes` = Geldanteil (`moneyTaxes`), `totalTaxes` bleibt Nennsteuer. Bau-Vorschau nutzt `moneyTaxes` (AK-ZE-23).
- Save: `SAVE_VERSION` = main + 1 (R909), Migration setzt Startwerte, `isValidTithe(raw)` im Strukturcheck; Testfaltung `dropTithe` in **allen drei** Kettenköpfen `foldBackToV13/V12/V11`, äusserer Schritt `foldBackTithe`.
- UI: DOM-freier Helfer `src/ui/titheView.ts` (Texte, Strom, Bestätigung, Verfall-Sammler); Schalter im Amtsstuben-Panel (`inspect.ts`), Dialog `titheDialog.ts` über `openModal` (`modal.ts`), Verdrahtung in `app.ts`.
- Standard `Geld`, Controller schaltet nie → Buchung bitgleich, `balance.test.ts` und `seaGolden`-Hashes unverändert; kein Balancing-Ruling.

## Entscheide und Nachbarn

Entscheide P-1 bis P-9 und Ruling-Entwürfe E-ZE-1 bis E-ZE-3: [`entscheide.md`](entscheide.md). Überschneidungen mit offenen Paketen (per Pfad) und Risiken: [`nachbarn.md`](nachbarn.md). Zeit-Tests: [`zeiten.md`](zeiten.md).

## Dateimatrix (Ownership)

| Datei                                                                                                                               | T01 | T02 | T03 | T04 | T05 | T06 | T08 |
| ----------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- | --- | --- | --- | --- |
| `src/sim/defs/tiers.ts`, `src/sim/defs/timing.ts`, `src/sim/types.ts`, `src/sim/world.ts`                                           | ja  |     |     |     |     | ja  |     |
| `src/sim/save.ts` (42 KB, abschnittsweise), `tests/sim/tithe-save.test.ts` (neu)                                                    | ja  |     |     |     |     | ja  |     |
| `tests/sim/helpers.ts` (nur Faltung), `tests/sim/helpers.test.ts`, `farOrder-save.test.ts`, `save-loyalty.test.ts`                  | ja  |     |     |     |     | ja  |     |
| `src/sim/population.ts`, `src/sim/tick.ts`, `tests/sim/tick.test.ts` (nur Literal)                                                  |     | ja  |     |     |     | ja  |     |
| `tests/sim/tithe.test.ts` (neu)                                                                                                     | ja¹ | ja  | ja  |     |     | ja  |     |
| `src/sim/tax.ts`                                                                                                                    |     |     | ja  |     |     | ja  |     |
| `src/ui/titheView.ts` (neu), `src/ui/balancePreview.ts`, `tests/ui/titheView.test.ts` (neu)                                         |     |     |     | ja  | ja  | ja  |     |
| `src/ui/inspect.ts` (45 KB), `src/ui/app.ts`, `src/style.css`, `src/ui/titheDialog.ts` (neu), `tests/ui/tithe-source.test.ts` (neu) |     |     |     |     | ja  | ja  |     |
| `README.md`, `docs/arc42.md`, `docs/superpowers/plans/i223-zehnt/zeiten.md` (Spalte «Branch»)                                       |     |     |     |     |     |     | ja  |

¹ T01 legt `tithe.test.ts` mit dem Defs-Block (AK-ZE-14 Teil Werte) an. T07 (Browser) ändert keine Datei ausser `.studio/qa/I-223/`. Nicht angefasst: `tests/sim/balance*.test.ts`, `tests/sim/controller.ts`, `tests/sim/seaGolden.test.ts`, `src/sim/economy.ts` (nur Import `addStock`), `src/render/`, `src/audio/`, `docs/studio/` (insbesondere `rulings.md`), Spec-Dateien.

## Tasks

| Task | Titel                                         | Datei                | AK-IDs (AK-ZE-…)                                     | Strang | blocked-by | Modell | Tools | Persona             |
| ---- | --------------------------------------------- | -------------------- | ---------------------------------------------------- | ------ | ---------- | ------ | ----- | ------------------- |
| T00  | Vorab: Worktree, Basis, Nachbarn              | `T00-vorab.md`       | –                                                    | A      | Gate Plan  | sonnet | 15    | `tech-sim-engineer` |
| T01  | Modell und Save: Defs, Felder, Kette, Faltung | `T01-save.md`        | 01 (Hashes), 08, 14 (Werte), 16 (17 Verbraucher), 27 | A      | T00        | sonnet | 60    | `tech-sim-engineer` |
| T02  | Buchung: `titheSplit`, `tickTaxes`, `step`    | `T02-buchung.md`     | 01, 02, 03, 04, 06, 11, 12, 13, 22, 25               | A      | T01        | sonnet | 55    | `tech-sim-engineer` |
| T03  | Schalter `setTithe`, Determinismus, Kursband  | `T03-schalter.md`    | 05, 07, 14 (Literal), 15, 24, 26                     | A      | T02        | sonnet | 45    | `tech-sim-engineer` |
| T04  | UI-Helfer `titheView.ts`, Bau-Vorschau        | `T04-helfer.md`      | 09, 10, 21, 23                                       | B      | T02        | sonnet | 45    | `tech-ui-engineer`  |
| T05  | Panel: Schalter, Dialog, Meldung (B in A)     | `T05-panel.md`       | 17–20 (Vorbereitung)                                 | A      | T03, T04   | sonnet | 55    | `tech-ui-engineer`  |
| T06  | Merge-Stand: main holen, Save-Nr., Faltung    | `T06-merge-stand.md` | 01, 08, 16, 27 (erneut)                              | A      | T05        | sonnet | 35    | `tech-sim-engineer` |
| T07  | Browser-Check Amtsstube                       | `T07-playtest.md`    | 17, 18, 19, 20                                       | A      | T06        | sonnet | 35    | `qa-playtester`     |
| T08  | Doku README und arc42                         | `T08-doku.md`        | – (Auflage 8, Tech 6)                                | A      | T07        | sonnet | 12    | `tech-ui-engineer`  |

Reihenfolge: T00 → T01 → T02 → (T03 ‖ T04) → B in A mergen → T05 → T06 → T07 → T08 → Final-Review. Summe ≈ 357 Tools.

## Abdeckung

AK-Zuordnung (27 AK), Review Focus (5 Eingaben, je mit Test im Task) und Ruling-Zuordnung (Gate-Vorprüfliste Punkt 5): [`abdeckung.md`](abdeckung.md).

## Budget (Starts-Antrag, Formel)

Pakete mit eigenem Review T01–T05 = 5 → × 2 = 10 · QA-Checks 1 (T07) · Final-Review 1 → 12; + 30 % = 15,6 → **16 Starts**. Geplant 9: Umsetzer A `tech-sim-engineer` 1 (T00–T03, T06 per `SendMessage`) · Umsetzer B `tech-ui-engineer` 1 (T04, T05, T08 per `SendMessage`) · `qa-code-reviewer` T01–T05 5 · `qa-playtester` T07 1 · Final-Review **`model: opus`** 1. Reserve 7 für frische Delta-Reviews. T06 und T08 prüft das Final-Review mit (Merge bzw. Doku ohne neue Regel). **Parallelität 2** (T03 ‖ T04), höchstens 2 gleichzeitige Testläufe.

## Controller-Briefing und Prüfpflichten

Wörtlich zu übernehmen aus [`briefing.md`](briefing.md) (Delta-Review frisch auf opus, Controller-Regel, Testsperre «Last ≤ 4 nötig», Rot zuerst, Teilbeleg, Balancing).

## Zeit-Tests (R392/R905, vorab gemessen)

Siehe [`zeiten.md`](zeiten.md). Regel R905: neu > 500 ms verboten; schon auf main > 500 ms höchstens + 50 %. Neue Läufe mit 3000 Schritten (AK-ZE-07) und 600 `tickTaxes`-Aufrufen im Blick; Ziel je Test < 500 ms. T06 misst nachher nur gezielt (Last ≤ 4), T08 trägt die Spalte «Branch» nach.
