# M12 E0 — Abdeckung AK → Task

Teil des Plans, Einstieg [index.md](index.md). Spec §4.7 (21 AK) und Auflagen R227.

| AK       | Kurz                                                                                 | Task (Test entsteht)    | Testdatei                                | Prüfart        |
| -------- | ------------------------------------------------------------------------------------ | ----------------------- | ---------------------------------------- | -------------- |
| AK-E0-01 | `createWorld` v7, eine Insel, keine v6-Felder oben                                   | T03                     | `tests/sim/save.test.ts`                 | Vitest         |
| AK-E0-02 | Fold-back der 4 `createWorld`-Varianten = Pin                                        | T00 (Pin), T03          | `save.test.ts`, `e0Pins.ts`              | Vitest         |
| AK-E0-03 | `save-v6.json` lädt, Fold-back = Fixture                                             | T00 (Fixture), T03      | `save.test.ts`                           | Vitest         |
| AK-E0-04 | Kette v1 … v5, `sortedJson`-Hash = Pin                                               | T00 (Pin), T03          | `save.test.ts`                           | Vitest         |
| AK-E0-05 | Weiterlauf 300 Schritte, `serialize` zeichengleich                                   | T00 (Rezept), T03       | `save.test.ts`, `fixtureV6.ts`           | Vitest         |
| AK-E0-06 | nur Kontor; Sperren wörtlich (P-14)                                                  | T03                     | `save.test.ts`                           | Vitest         |
| AK-E0-07 | N01–N20 + N21, Garbage mit v7                                                        | T03                     | `save.test.ts`                           | Vitest         |
| AK-E0-08 | Round-trip v7 und geladener v6                                                       | T03                     | `save.test.ts`                           | Vitest         |
| AK-E0-09 | `version 8`; v7 im Build vor E0                                                      | T03 (Test), T06 (Probe) | `save.test.ts`; Ledger/PR-Text           | Vitest + Probe |
| AK-E0-10 | Inselbezug I01–I12                                                                   | T04                     | `tests/sim/islands.test.ts`              | Vitest         |
| AK-E0-11 | Versorgung, Dienste, Wege nie über Inseln                                            | T04                     | `islands.test.ts`                        | Vitest         |
| AK-E0-12 | Abdeckung = Referenz (D1, `off`, Werkzeugmacher, Radiusgrenze, `isSupplied`, Gründe) | T05                     | `tests/sim/population.test.ts`           | Vitest         |
| AK-E0-13 | Aktualität ohne Tick, `serialize` unverändert                                        | T05                     | `population.test.ts`                     | Vitest         |
| AK-E0-14 | globale Id-Reihenfolge beim Aufstieg                                                 | T04                     | `islands.test.ts`                        | Vitest         |
| AK-E0-15 | D1 ≤ `perfBudget(PIN ≤ 6)`, Verhältnis ≥ 5                                           | T05                     | `tests/sim/perf.test.ts`                 | Vitest         |
| AK-E0-16 | `balance.test.ts` unverändert, flow/upgrade grün                                     | alle (T06 Nachweis)     | bestehende                               | Vitest + Git   |
| AK-E0-17 | `OFF_FINGERPRINT`, `normalized` mit Fold-back                                        | T00 (Pin), T03          | `balance-crises.test.ts`, `save.test.ts` | Vitest         |
| AK-E0-18 | `balance-merchants` `[6750, 11200, 320]`                                             | alle (T06 Nachweis)     | bestehende                               | Vitest         |
| AK-E0-19 | Zufallsfolge = Schritt-0-Liste                                                       | T00                     | `balance-crises.test.ts`                 | Vitest         |
| AK-E0-20 | sichtbar nichts, v6-Autosave lädt                                                    | T06                     | `.studio/qa/M12-E0/`                     | Browser-Check  |
| AK-E0-21 | Zählungen über beide Inseln                                                          | T04                     | `islands.test.ts`                        | Vitest         |

R227-Pflichtpunkte → Entscheid: B3 → P-4; B4 → P-8; QA 5 → P-7; QA 6 → P-10; QA 7 → P-11; QA 8 → P-8, P-13;
QA 9 → P-12; mechanischer Diff `controller.ts` → Global Constraints und Review-Fokus T01, Final-Review T06.
