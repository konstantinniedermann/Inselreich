# M14-E1 · Abdeckung AK → Task und Auflagen → Task

Gehört zum [Index](../2026-10-11-m14-e1-inselcharakter.md). AK-Texte: Spec §10 (mit Anhang 04), Erwartungswerte Save:
Anhang 02 F. Testdatei, sofern nicht anders genannt: `tests/sim/islandTraits.test.ts`.

## AK → Task

| AK                              | Inhalt (kurz)                                                     | Task                                                | Testort                      |
| ------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------- | ---------------------------- |
| AK-M14E1-01                     | Defs `TRAIT_*`, `ISLANDS[0..1]`                                   | T01                                                 | `islandTraits.test.ts`       |
| AK-M14E1-01                     | `ISLANDS` 3 Einträge, `ISLANDS[2]` Soll                           | T03                                                 | `islandTraits.test.ts`       |
| AK-M14E1-02                     | Ganzzahligkeit Trait-Zyklen                                       | T01                                                 | `islandTraits.test.ts`       |
| AK-M14E1-03                     | `cycleOf` Heimat, Felsbucht, Möweninsel                           | T01                                                 | `islandTraits.test.ts`       |
| AK-M14E1-03                     | `cycleOf` Weidenau                                                | T03                                                 | `islandTraits.test.ts`       |
| AK-M14E1-04                     | Ausstoss 600 Ticks Felsbucht/Heimat                               | T01                                                 | `islandTraits.test.ts`       |
| AK-M14E1-04                     | Ausstoss Weidenau 24                                              | T03                                                 | `islandTraits.test.ts`       |
| AK-M14E1-05, -06, -07, -08, -10 | Verbrauch, Stufe × Trait, Heimat, Altstand-`progress`, Lager voll | T01                                                 | `islandTraits.test.ts`       |
| AK-M14E1-09                     | `goodsBalance(world, 1).stone.produced === 20`                    | T01                                                 | `islandTraits.test.ts`       |
| AK-M14E1-11                     | Sturm Weidenau vs. Heimat (E6)                                    | T03                                                 | `islandTraits.test.ts`       |
| AK-M14E1-12                     | A/B bitgleich, Seeds 1…1000, 963, Pins                            | T01 (Fixture + Test), T03 (erneut grün)             | `islands-seeds-a/-b.test.ts` |
| AK-M14E1-13                     | C wirft nie, Seeds 1…1000, 963                                    | T05                                                 | `islands-seeds-a/-b.test.ts` |
| AK-M14E1-14                     | Band 30–35, Stufe 3 ≤ 3                                           | T05                                                 | `islands-seeds-a/-b.test.ts` |
| AK-M14E1-15                     | Seed 963 und `forceLastStage`                                     | T02 (Mechanik an B), T03 (C, Seed 963)              | `islands-c.test.ts`          |
| AK-M14E1-16                     | C ohne Gebirge, ≥ 6 Plätze, `failShapes`                          | T05                                                 | `islands-seeds-a.test.ts`    |
| AK-M14E1-17                     | Felsbucht ≥ 3 Steinbruch-Plätze                                   | T01                                                 | `islands-seeds-a.test.ts`    |
| AK-M14E1-18                     | Baseline ohne Diff gegen `9113e574`                               | T05 (Prüfung), jeder Task (Rahmen)                  | `git diff 9113e574 -- …`     |
| AK-M14E1-19                     | Fremdinsel-Pins wertgleich, C-Lanes neu                           | T03                                                 | `seaGolden.test.ts`          |
| AK-M14E1-20, -21                | Rundlauf v13, Migration v12 → v13                                 | T03                                                 | `save-v13.test.ts`           |
| AK-M14E1-22, -23, -25, -42      | Kette, Ladeprüfung 23a–f, Inkompatibel, Schiff unterwegs          | T04                                                 | `save-v13.test.ts`           |
| AK-M14E1-24                     | Rückfaltung 24a, 24h                                              | T03                                                 | `helpers.test.ts`            |
| AK-M14E1-24                     | Rückfaltung 24b–24g                                               | T04                                                 | `helpers.test.ts`            |
| AK-M14E1-26                     | Inselkarte Möweninsel, Felsbucht                                  | T01                                                 | `ui/islandCard.test.ts`      |
| AK-M14E1-26                     | Inselkarte Weidenau                                               | T06                                                 | `ui/islandCard.test.ts`      |
| AK-M14E1-27 … -31, -33          | Hover, Seekarte, Gebäude-Info, Bauleiste, U6, Seekarte Render     | T06                                                 | `tests/ui/`, `tests/render/` |
| AK-M14E1-32                     | Inselliste vier Einträge                                          | T03 (Liste, mechanisch), T06 (Taste 9, Lagerleiste) | `ui/islandJump.test.ts`      |
| AK-M14E1-34 … -41               | Browser, Stände aus T05                                           | T08                                                 | `.studio/qa/m14-e1/`         |

Spec §11 Doku (README, arc42, Hauptspec-Verweis): T07.

## Auflagen R500, R501, R554 → Task

| Auflage          | Inhalt                                                                                 | Task                                                  |
| ---------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| QA-B2            | B3 nach I-048/M13-E2 prüfen, Rangfolge Playtest-Kriterium, Kippen → Ruling             | T00 (Eingaben-Diff), T08 (Playtest-Frage), E8         |
| QA-B3            | Vergleichsbasis `main` @ `9113e574`; Test «Controller Seed 3 gründet nie auf B oder C» | Rahmen, T05                                           |
| QA-B10           | Abriss mit laufendem `progress`, Neubau `progress 0` + Trait-Zyklus, Ausbau mit Gebühr | T01                                                   |
| QA-B11           | Fester Fixture-Slot `tests/sim/fixtures/save-v12-felsbucht.json` (Pflicht)             | T05                                                   |
| Tech-B1          | `cycleOf(world, b)`, Aufrufer mechanisch, UI blocked-by SIM                            | T01, E1                                               |
| Tech-B2          | Migration mit eingefrorenem Literal, nie `createWorld`                                 | T03, E3                                               |
| Tech-B3          | A/B bitgleich 1…1000 + Lagevergleich in der Migration                                  | T01 (Fixture), T03 (Migration), T04 (Test Abweichung) |
| Tech-B4          | Ersatzregel konstruktiv                                                                | T02, E2                                               |
| Tech-B5          | `clipRim`/`fallbackTerrain` nicht mehr fest auf `'A'`/`'B'`                            | T03                                                   |
| Tech-B6          | Pin-Liste                                                                              | E5, T03                                               |
| Tech-B8          | Kette v7 → v8 liefert 4 Inseln, `addSpiceToIslands` über 4 Inseln                      | T04                                                   |
| ADR-010-Nachtrag | Strom `ISLANDS_SALT`, Stufe 3 ohne Zufall                                              | erledigt mit diesem Plan                              |
| R501             | AK-11-Vorbedingung am Code geprüft: trifft nicht zu → Vergleich nach Zyklus-Skalierung | E6, T03                                               |
| R554             | Plan jetzt, Umsetzung erst nach Release M13, Basis `9113e574`                          | Index, T00                                            |
| R553 V1          | Wertgrenzen > 1 Lauf oder Risiko mit Rückfall                                          | E7, E8                                                |
| R392/E-052       | Testzeiten berührter Tests vorab                                                       | ownership.md «Testzeiten»                             |
