# Zeit-Tests NU-1 (R392/R905), Messung vorher

Messung 2026-10-26 08:18:49–08:22:02Z im Plan-Worktree (main `07cd8183`), Messfenster-Sperre durch L0 («plan-NU-1 zeiten»),
**Last 3,86 beim Start, 3,91 am Ende**. **Störung:** In `.worktrees/ausbau-logik` lief während des Fensters etwa 1 min ein fremder
`vitest related --maxWorkers=2` (Hinweis L0); der Lauf wurde nicht wiederholt. Kein Test liegt über 500 ms und zugleich mehr als
1,5× über dem main-Wert aus Plan I-215 (`plan/i215-volllast`, `zeiten.md`); alle Werte liegen darunter, daher keine Einzelnachmessung.
Werte sind Grundlage für die Liste > 200 ms; die Abnahme misst main und Branch direkt nacheinander (T09).

Ergebnis: 4374 Tests (4363 grün, 11 übersprungen), 0 rot, Exit 0. `tests/sim/` und `tests/ui/`: **71 Tests > 200 ms**, davon **15 > 500 ms** (Tabelle);
164 weitere Tests > 200 ms liegen unter `tests/render/` und `tests/audio/` (NU-1 ändert dort nur Platzhalter und Filter). Rohdaten
(nicht versioniert): Scratchpad der Plan-Session, `nu1-times.json`.

## Befehl (im Plan-Worktree, Last ≤ 4 nötig während des ganzen Laufs)

```bash
npx vitest related --run \
  src/sim/types.ts src/sim/world.ts src/sim/save.ts src/sim/ships.ts src/sim/levels.ts src/sim/islands.ts \
  src/sim/council.ts src/sim/supply.ts src/sim/economy.ts src/sim/trade.ts src/sim/queries.ts src/sim/build.ts \
  src/sim/tick.ts src/sim/unlocks.ts src/sim/defs/buildings.ts src/sim/defs/unlocks.ts \
  src/ui/seaMapView.ts src/ui/inspect.ts src/ui/app.ts src/ui/hud.ts src/ui/trade.ts src/ui/storageFull.ts \
  src/ui/hints.ts src/ui/hover.ts src/ui/buildMenu.ts src/ui/ships.ts src/ui/panelView.ts \
  src/render/seaMap.ts src/render/overlays.ts src/render/renderer.ts src/render/sprites.ts \
  --maxWorkers=2 --reporter=json --outputFile=<scratchpad>/nu1-times.json; echo EXIT=$?
```

Wegen `types.ts` praktisch die ganze Suite. Ausgabe nur im Scratchpad; Tabelle unten: Tests aus `tests/sim/` und `tests/ui/` > 500 ms (Datei, Name, ms), Anzahl > 200 ms, Last vor/nach.

## Regel

R905: kein neuer Test > 500 ms (Ziel T05/T06); Tests der Tabelle höchstens + 50 %. T09 misst nachher mit demselben Befehl und trägt die Spalte «Branch» nach.

| ms (main) | Datei                           | Test                                                    | ms (Branch, T09) |
| --------- | ------------------------------- | ------------------------------------------------------- | ---------------- |
| 6243      | `sim/perf.test.ts`              | AK-E0-15a D1: Mittel je Schritt (best-of-3) innerhalb d |                  |
| 5592      | `sim/perf.test.ts`              | AK-E0-15b D1: Abdeckung per buildCoverage mindestens 5  |                  |
| 2901      | `sim/population.test.ts`        | AK-E0-12a D1: Abdeckung gleich Referenz über 1000 Schri |                  |
| 864       | `sim/islands-c.test.ts`         | Spanne protokollieren (Seeds 1..300)                    |                  |
| 851       | `sim/scenario-saves.test.ts`    | AK-S5-01 jedes Szenario ist ladbar und Version 2        |                  |
| 707       | `sim/connect.test.ts`           | matches a reference search on many seeded layouts of ro |                  |
| 583       | `sim/islands-gen.test.ts`       | AK-E1-02: Lage, Lücken, Seewege und Rahmen für Seeds 1… |                  |
| 582       | `sim/islands-gen.test.ts`       | D-139: d zählt nur die Strecke ausserhalb der Inselrech |                  |
| 569       | `sim/unlock-timeline.test.ts`   | AK-BAS-03 off 150/350/550/4150/6750; normal …/5150/7850 |                  |
| 563       | `sim/scenario-saves.test.ts`    | AK-S5-02 AK-B2-04 schreibt je Szenario genau eine Datei |                  |
| 534       | `sim/balance-merchants.test.ts` | AK-B1-04 Laden beim ersten Kaufmann: gleicher Endzustan |                  |
| 530       | `sim/buyPct.test.ts`            | Zusatz: Verkauf und Kauf erholen sich je nach eigenem I |                  |
| 525       | `sim/balance-edicts.test.ts`    | PLAN-M13-01 Determinismus: Wohlfahrt arm zweimal und mi |                  |
| 513       | `sim/islands-seeds-b.test.ts`   | AK-M14E1-12: Seeds (Block ab 501)                       |                  |
| 501       | `sim/seaRoute.test.ts`          | AK1/AK2: Start und Ende sind die Anker, alle Punkte lie |                  |
