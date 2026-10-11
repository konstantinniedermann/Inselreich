# Anhang 04: Nachtrag Gate Spec (R500)

Befund → Änderung. Keine neuen Spielwerte; alle Zahlen stammen aus Anhang 01 oder den Defs.

| Befund                        | Änderung in der Spec                                                                                                                                                                                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-B1 AK-31 pinnt U6-Wortlaut | AK-M14E1-31: Bestandstext von `UNLOCK_NOTICE` bleibt Präfix (nicht gepinnt), angehängt genau der Satz aus Anhang 03 B; Test `startsWith` + Rest. M13-Textänderungen brechen ihn nicht.                                                                                                  |
| QA-B4 Ersatzregel ohne Signal | R3.4 neuer Punkt 5: Testhook meldet die Stufe von C (1 Zufall, 2 16 Richtungen, 3 neue Ersatzregel), Name [Tech]. AK-M14E1-14 zählt nur Stufe 3: ≤ 3 (gemessen 1, Seed 963).                                                                                                            |
| QA-B5 Seed 963                | R3.4 und Punkt 1: 963 ist **Messseed** (in A3 gemessener Wurf-Seed, in `tests/sim/` bisher nicht gepinnt), wird mit AK-M14E1-12/-13/-15 neu gepinnt. Anhang 01 A3 «kein gepinnter Seed wirft» bleibt wahr (Pin-Seeds 1, 3, 7, 13, 42); 963 ist kein Bestands-Pin.                       |
| QA-B6 AK-11 ohne Erwartung    | Tickgenauer Vergleich über 600 Ticks bei aktivem Sturm: `state`, `progress` je Tick gleich, Bestandszuwachs gleich; Erwartung aus `STORM_TICK_DIVISOR` und Zykluslänge der Def berechnet (`src/sim/production.ts`: im Sturm entfällt jeder Tick mit `tick % STORM_TICK_DIVISOR !== 0`). |
| QA-B7 AK-09 Funktion/Einheit  | `goodsBalance(world, 1).stone.produced === 20`; Einheit: Bilanz je 100 Ticks (`ui/time.ts`, «/ min» in der UI); Muster `tests/sim/flow.test.ts`. Wert 20 unverändert.                                                                                                                   |
| QA-B8 Schiff unterwegs        | Neues AK-M14E1-42 (-36 war vergeben): Schiffsfelder und Ankunftstick nach Migration unverändert.                                                                                                                                                                                        |
| QA-B9 «wie AK-12»             | AK-M14E1-15: «wie AK-M14E1-12».                                                                                                                                                                                                                                                         |

Offen für den Plan (kein Entscheid hier): Der Sturm-Vergleich in AK-11 setzt voraus, dass Fruchtbar den Zyklus der
Zuckerrohrplantage nicht ändert; sonst gilt der Vergleich nur für `state`/`progress`-Gleichlauf nach Zyklus-Skalierung
(Tech klärt am Code, Anhang 01 A1).
