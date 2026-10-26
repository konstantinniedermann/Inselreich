# Zeit-Tests I-215 (R392/R905), Messung vorher

Messung 2026-10-25 22:33–22:35 im Plan-Worktree (main `1de17074`), Messfenster frei beim Start (`make messfenster`),
**Last 3,44 beim Start, 9,71 am Ende** (fremde Läufe kamen dazu): Werte sind Orientierung, nicht Pin-tauglich.
`npx vitest related --run` über die zwölf geplanten Quelldateien (wegen `types.ts` praktisch die ganze Suite): 4397 Tests,
1 rot = `tests/sim/perf.test.ts` AK-E0-15a D1 (bekannt, auf main rot, R954, Paket ZEITPIN-D1).

- `tests/sim/` und `tests/ui/`: **120 Tests > 200 ms**, davon **50 > 500 ms** (Tabelle). Die übrigen 227 Tests > 200 ms
  liegen unter `tests/render/`; Volllast ändert dort keinen Code (nur Typ `BuildingState`).
- Regel R905: kein Test neu > 500 ms; Tests der Tabelle höchstens + 50 %. T08 misst nachher mit demselben Befehl (Last ≤ 4
  während des ganzen Laufs) und trägt die Spalte «Branch» nach. Neue Tests dieses Pakets (`overtime*.test.ts`): Läufe mit
  3000 Schritten (AK-VL-07, -15, -17, -19) im Blick behalten; Ziel je Test < 500 ms.
- Volle Rohdaten (nicht versioniert): Scratchpad der Plan-Session, `times.json`.

| ms (main) | Datei                                 | Test                                                    | ms (Branch, T08) |
| --------- | ------------------------------------- | ------------------------------------------------------- | ---------------- |
| 8546      | `sim/perf.test.ts`                    | AK-E0-15a D1: Mittel je Schritt (best-of-3) innerhalb d |                  |
| 7271      | `sim/perf.test.ts`                    | AK-E0-15b D1: Abdeckung per buildCoverage mindestens 5  |                  |
| 5255      | `sim/population.test.ts`              | AK-E0-12a D1: Abdeckung gleich Referenz über 1000 Schri |                  |
| 2106      | `sim/scenario-saves.test.ts`          | AK-S5-01 jedes Szenario ist ladbar und Version 2        |                  |
| 1460      | `sim/islands-c.test.ts`               | Spanne protokollieren (Seeds 1..300)                    |                  |
| 1442      | `sim/connect.test.ts`                 | matches a reference search on many seeded layouts of ro |                  |
| 1275      | `sim/scenario-saves.test.ts`          | AK-S5-02 AK-B2-04 schreibt je Szenario genau eine Datei |                  |
| 1015      | `sim/balance-merchants.test.ts`       | AK-B1-04 Laden beim ersten Kaufmann: gleicher Endzustan |                  |
| 1007      | `sim/buyPct.test.ts`                  | Zusatz: Verkauf und Kauf erholen sich je nach eigenem I |                  |
| 948       | `sim/unlock-timeline.test.ts`         | AK-BAS-03 off 150/350/550/4150/6750; normal …/5150/7850 |                  |
| 932       | `sim/balance-edicts.test.ts`          | PLAN-M13-01 Determinismus: Wohlfahrt arm zweimal und mi |                  |
| 917       | `sim/islands-gen.test.ts`             | D-139: d zählt nur die Strecke ausserhalb der Inselrech |                  |
| 910       | `sim/balance-crises.test.ts`          | AK-BAS-02 Schwellen: Sieg ≤ 7500 und Geld > 0; normal + |                  |
| 909       | `sim/islands-seeds-b.test.ts`         | AK-M14E1-12: Seeds (Block ab 901)                       |                  |
| 906       | `sim/islands-gen.test.ts`             | AK-E1-02: Lage, Lücken, Seewege und Rahmen für Seeds 1… |                  |
| 905       | `sim/islands-seeds-a.test.ts`         | AK-M14E1-12: Seeds (Block ab 1)                         |                  |
| 893       | `sim/balance-edicts.test.ts`          | AK-M13E1-19 arm: Sparen und Handel früher, Wohlfahrt ni |                  |
| 843       | `sim/islands-seeds-a.test.ts`         | AK-M14E1-12: Seeds (Block ab 101)                       |                  |
| 802       | `sim/islands-seeds-b.test.ts`         | AK-M14E1-12: Seeds (Block ab 701)                       |                  |
| 799       | `sim/islands-seeds-b.test.ts`         | AK-M14E1-12: Seeds (Block ab 801)                       |                  |
| 787       | `sim/islands-seeds-b.test.ts`         | AK-M14E1-12: Seeds (Block ab 501)                       |                  |
| 777       | `sim/islands-seeds-b.test.ts`         | AK-M14E1-12: Seeds (Block ab 601)                       |                  |
| 769       | `sim/islands-c.test.ts`               | erzwungene Stufe 3: gültige Lage, Lücke, Seeweg, A bitg |                  |
| 729       | `sim/balance-edicts.test.ts`          | AK-M13E1-18 Welle: vier neue Häuser, Wohlfahrt schnelle |                  |
| 696       | `sim/balance-crises.test.ts`          | AK-B2-06 Laden mitten im Sturm (aktiv, Seed 3: Tick 260 |                  |
| 691       | `sim/islandTraits-controller.test.ts` | Seed 3: Felsbucht und Weidenau ohne Kontor, Gebäude und |                  |
| 689       | `sim/unlocks.test.ts`                 | AK-S1-17 „Alles frei" bitgleich: buildColony liefert de |                  |
| 675       | `sim/seaRoute.test.ts`                | AK1/AK2: Start und Ende sind die Anker, alle Punkte lie |                  |
| 674       | `sim/balance-crises.test.ts`          | AK-B2-05 Laden mitten im Brand: gleicher Endzustand, gl |                  |
| 664       | `sim/balance-merchants.test.ts`       | AK-B1-01 Sieg 6750, zweites Ziel bis 12 000, Geld > 0,  |                  |
| 655       | `sim/islands-seeds-a.test.ts`         | AK-M14E1-12: Seeds (Block ab 251)                       |                  |
| 644       | `sim/islands-gen.test.ts`             | AK-E1-04: Ersatzform erfüllt alle Garantien und ist det |                  |
| 644       | `sim/inselmarkt.test.ts`              | AK-IM-04 Heimat bitgleich zur alten Formel              |                  |
| 625       | `sim/edicts.test.ts`                  | AK-M13E1-05 wirft nie, ändert bei Ablehnung nichts, kei |                  |
| 622       | `sim/seaRoute.test.ts`                | Küstenabstand: mindestens 1,5 Kacheln zur Landmitte, au |                  |
| 612       | `sim/islands-seeds-a.test.ts`         | AK-M14E1-12: Seeds (Block ab 151)                       |                  |
| 598       | `sim/buyPct.test.ts`                  | Kaufpreis > Boom-Verkaufserloes, Anteil 100 und 160     |                  |
| 592       | `sim/taxTiers.test.ts`                | setTierTaxLevel: Result, bei Fehler Welt gleich, bei ok |                  |
| 590       | `sim/seaRoute.test.ts`                | Richtungswechsel je abgetastetem Schritt höchstens 30 G |                  |
| 588       | `sim/islands-seeds-a.test.ts`         | AK-M14E1-12: Seeds (Block ab 201)                       |                  |
| 571       | `sim/islands-gen.test.ts`             | AK-E1-01: Gelände, Plätze und Anker für Seeds 1…200 (Bl |                  |
| 568       | `sim/seaRoute.test.ts`                | Route liegt dicht abgetastet ganz auf Wasser und ist ni |                  |
| 547       | `sim/islands-gen.test.ts`             | AK-E1-01: Gelände, Plätze und Anker für Seeds 1…200 (Bl |                  |
| 534       | `sim/balance-crises.test.ts`          | AK-BAS-01 Referenz off: Sieg 6750, minMoney 117, endMon |                  |
| 531       | `sim/islands-gen.test.ts`             | AK-E1-01: Gelände, Plätze und Anker für Seeds 1…200 (Bl |                  |
| 525       | `sim/islands-gen.test.ts`             | AK-E1-01: Gelände, Plätze und Anker für Seeds 1…200 (Bl |                  |
| 523       | `sim/balance-merchants.test.ts`       | AK-B1-02 Messwerte vollständig: Endzustand, erster Kauf |                  |
| 522       | `sim/trial-run.test.ts`               | AK-6 mit Sollzufuhr besteht                             |                  |
| 522       | `sim/islands-seeds-a.test.ts`         | AK-M14E1-12: Seeds (Block ab 51)                        |                  |
| 501       | `sim/islands-gen.test.ts`             | AK-E1-01: Gelände, Plätze und Anker für Seeds 1…200 (Bl |                  |
