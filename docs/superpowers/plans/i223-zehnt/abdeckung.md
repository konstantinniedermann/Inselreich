# Plan I-223 · Abdeckung

Zurück zum [Index](index.md).

## AK-Zuordnung (27 AK)

| AK                           | Beleg                                                                                                                    | Task     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| 08, 27                       | `tests/sim/tithe-save.test.ts`                                                                                           | T01, T06 |
| 01 (Hashes), 16 (Kette)      | 17 Verbraucher einzeln grün (Liste T01), `seaGolden` ohne Diff                                                           | T01, T06 |
| 14                           | `tithe.test.ts`: Werte (T01), Literal `1800` in `tax.ts`/`population.ts` (T03)                                           | T01, T03 |
| 01, 02–04, 06, 11–13, 22, 25 | `tests/sim/tithe.test.ts` (Exaktwerte Spec, P-9)                                                                         | T02      |
| 05, 07, 15, 24, 26           | `tests/sim/tithe.test.ts`                                                                                                | T03      |
| 09, 10, 21, 23               | `tests/ui/titheView.test.ts`                                                                                             | T04      |
| 17–20 (Vorbereitung)         | `tests/ui/tithe-source.test.ts` (Quelltext), Screenshot `t05-panel.png`                                                  | T05      |
| 16                           | T06 gezielt (17 Verbraucher, Zehnt-Tests, `balance.test.ts`); gesamte Suite per `make push-check` des Integrators (R989) | T06      |
| 17–20                        | Browser (`.studio/qa/I-223/`)                                                                                            | T07      |

## Review Focus (Eingaben ohne eigenes AK; Test im genannten Task)

1. `setTithe` mit `tier` 1,5, `NaN`, `'1'` (String) und `on` `1`/`null` → «Ungültige Stufe» bzw. «Ungültiger Wert», Welt gleich → T03.
2. Edikt mit Steuerpunkten aktiv: Werkzeugmenge sinkt im selben Verhältnis wie `effectiveTaxPct` (Randfall Spec) → T02.
3. Werkzeug **und** Stein am selben Schritt voll: `titheLost` hat beide Schlüssel, je Gut eigene Summe → T02.
4. Pionierhaus auf einer Fremdinsel: Ware landet in der Heimat, Fremdlager unverändert (Regel 5) → T02.
5. Steuerstufe wechseln, während der Zehnt gesperrt ist (und umgekehrt): beide Sperren unabhängig (Regel 8) → T03.

## Ruling-Zuordnung (Gate-Vorprüfliste Punkt 5)

| Ruling bzw. Entwurf                     | Inhalt                                                                                                          | Task         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------ |
| R981 L1–L3                              | Sperre je Stufe, Amtsstube Pflicht, Migration statt Abweisen                                                    | T01, T03     |
| R982 Auflagen 1–8                       | Faltkette, Verfall prüfbar, Geldzahl, Kursband, Absolutwert, zweiter Grund, schmaler Literaltest, Save-Nr./Doku | T01–T04, T08 |
| R983                                    | 17 Verbraucher einzeln grün                                                                                     | T01, T06     |
| R909                                    | Save-Nummer per Merge-Reihenfolge                                                                               | T01, T06     |
| R977                                    | Werte (100 %, 10 %, Kurs 83 %, 1800)                                                                            | T01          |
| Entwürfe P-1 bis P-9, E-ZE-1 bis E-ZE-3 | `entscheide.md`                                                                                                 | je Entscheid |
