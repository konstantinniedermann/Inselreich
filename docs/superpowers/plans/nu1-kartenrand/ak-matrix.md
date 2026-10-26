# NU-1 · AK-Zuordnung, Review Focus, Rulings, Gate-Vorprüfliste

## AK-Zuordnung (56 AK + 25a/b; AK-25 gilt als ersetzt durch 25a/b, R979 N1)

| AK (AK-NU1-…)                                | Beleg                                                                                           | Task               |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------ |
| 01, 02                                       | `tests/sim/expedition.test.ts` (Kartenhaus, `U7`, `flammableRect`)                              | T01                |
| 08, 30                                       | `tests/sim/expedition-defs.test.ts` (Wächter Defs, Packlage 57/63/61, 32/36/43, 48/49/49)       | T01                |
| 03–06, 11–13, 14 (Sperren), 52–54            | `tests/sim/expedition.test.ts` (Start, Abbruch, Schiff, Abriss)                                 | T04                |
| 05 (HAFEN-Fall)                              | `tests/sim/expedition.test.ts`, Schiff mit `dwell` in der Heimat                                | T09                |
| 17                                           | `tests/sim/expedition-cards.test.ts` (Ziehung, Seeds 1–3 gepinnt und nachgerechnet)             | T04                |
| 07, 09, 10, 14 (Rückkehr), 15, 16, 26, 34–36 | `tests/sim/expedition.test.ts` (Ablauf, Wahl, Meldungen)                                        | T05                |
| 18                                           | `tests/sim/expedition-cards.test.ts` (Vergabe)                                                  | T05                |
| 19, 20                                       | `tests/sim/finds.test.ts` (19 Rest «ab Rückkehr» in T05)                                        | T03, T05           |
| 21                                           | `tests/sim/finds.test.ts` (keine Doppelten, `'complete'` einmal)                                | T05                |
| 37, 38                                       | `tests/sim/finds-save.test.ts` (38 als **Kappung**, R979 N2)                                    | T03                |
| 39                                           | `tests/sim/finds-storage.test.ts` (Lager, Kontor T03; Rückkehr T05)                             | T03, T05           |
| 40                                           | `tests/sim/finds-storage.test.ts` (Quelltext-Wächter `src/sim`)                                 | T03                |
| 23, 24, 41–44, 46                            | `tests/sim/expedition-save.test.ts` (Version relativ, Migration, Ladeprüfung)                   | T02 (23 auch T09)  |
| 22, 45, 55                                   | `tests/sim/expedition-save.test.ts` (Rundreise, kanonische Ladung)                              | T06                |
| 25a                                          | Lauf `balance*`, `seaGolden`, Seeds-1–3-Pins unverändert; `expedition-baseline.test.ts`         | T06, T09           |
| 25b                                          | Pins laut [`pins.md`](pins.md) mit Kommentar `// NU-1 25b (E-NU-4)`                             | T01, T02, T06, T09 |
| 27, 28, 29, 56                               | `tests/ui/expeditionView.test.ts`, `tests/ui/seaMapView.test.ts`                                | T07                |
| 31, 32, 47–51                                | Einbau T08 (Vitest-Verdrahtung `tests/ui/expeditionDialog.test.ts`); Browser `.studio/qa/NU-1/` | T08, T10           |
| 33                                           | Review der Doku im Final-Review; `make docs-check` Exit 0                                       | T11                |

## Review Focus (Eingaben ohne eigenes AK; Test im genannten Task)

1. **Wartezustand, neue Route ohne Heimat:** `setRoute` auf Fremd ⇄ Fremd in `boarding` würde das Schiff nie anlegen lassen und den Stand für K11 «beschädigt» machen → Grund «Schiff ist auf Expedition» (E-NU-6) → T04.
2. **Lager über der Grenze aus Bestandsständen:** Kappung beim Laden (N2) darf Szenario- und Fixture-Stände nicht verändern; Vorprüfung aller Lager-Schreiber → T03 (`scenario-saves` grün).
3. **Fundstück F1 bei laufender Fahrt:** `left` bleibt, erst die nächste Abfahrt ist kürzer (P-4) → T05.
4. **S-Option mit Nahrung kippt die Proviantprüfung** («Fest am Strand» bei 5 Nahrung) → Umkehr, kein Fund → T05.
5. **Kartenhaus-Abriss mit Sammlung:** Fundstücke wirken weiter, neuer Start «Kein Kartenhaus» → T04.

## Ruling-Zuordnung (Gate-Vorprüfliste Punkt 5)

| Ruling bzw. Entwurf | Inhalt                                                                                                                      | Task                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| R976 (1)–(4)        | Spec frei, Salt, ADR-010-Nachtrag in der Umsetzung, Kartenhaus brennt nicht                                                 | T01, T04, T11               |
| R978                | Auflagen 1–6, 8, 9 als AK 37–56; Auflage 7 und U7-Pins als Plan-Risiko                                                      | T02–T07, Risiken, `pins.md` |
| R979 N1             | AK-25 ersetzt durch 25a/b                                                                                                   | T06, T09                    |
| R979 N2             | AK-38 als Kappung beim Laden                                                                                                | T03                         |
| R909                | Save-Nummer per Merge-Reihenfolge (`SAVE_V_KARTENRAND`)                                                                     | T02, T09                    |
| E-NU-1 (R985)       | `unlockAll` und «Nächste Freischaltung» ohne `U7` (P-2, P-3)                                                                | T01                         |
| E-NU-2 (R985)       | Fundstück-Faktor in `effectiveCycle`, F1 ohne Umrechnung laufender Fahrten (P-4)                                            | T03, T09                    |
| E-NU-3 (R985)       | Wirkbeginn im Rückkehr-Tick für Systeme nach `tickExpedition` (P-5)                                                         | T05, T11                    |
| E-NU-4 (R985)       | Ruling-Notiz zu den 25b-Pins (`pins.md`)                                                                                    | T01, T02, T06, T09          |
| E-NU-5 (R985)       | Meldungstext der Vorwarnung Überlauf (Spec §3.11.3 nennt keinen): «Expedition kehrt bald heim: Lager fasst nicht alle Ware» | T07                         |
| E-NU-6 (R985)       | `setRoute` in `boarding` nur mit Heimat-Ende, sonst «Schiff ist auf Expedition»                                             | T04                         |

## Gate-Vorprüfliste (E-078, R957 V2)

1. **Delta-Review = frischer opus-Start**, nie `SendMessage`-Fortsetzung: Index, Controller-Briefing, erste Zeile.
2. **«Last ≤ 4 nötig» in jedem Messtask:** T00–T10 je Kopfzeile «Testsperre: Last ≤ 4 nötig» bzw. «Last:» (T10); T11 ohne Testlauf.
3. **Zeit-Tests mit Messwert:** [`zeiten.md`](zeiten.md) (Messung vorher), Nachmessung T09; neue Tests < 500 ms (T05 Schritt Zeiten, T06 AK-22).
4. **Index und Task-Dateien widerspruchsfrei:** Tabelle (Task, Datei, AK-IDs, `blocked-by`, Modell, Persona) = Kopfzeile jeder Task-Datei; AK-Zuordnung oben = Tabelle.
5. **Jeder angenommene Ruling-Entwurf einem Task zugeordnet:** Tabelle «Ruling-Zuordnung» oben.
