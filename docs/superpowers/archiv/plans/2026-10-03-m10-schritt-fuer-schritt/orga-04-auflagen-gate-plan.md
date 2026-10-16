> Teil des Plans M10, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Auflagen Gate Plan (R164) — Fundstellen in diesem Plan

| Auflage                                                                                                         | Fundstelle                                                                          |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| QA 1: BG-3 mit `buildColony` (normal, mit und ohne `unlockAll`, je zweimal) und Laden U4–U5                     | „Bitgleich-Messung", BG-3                                                           |
| QA 2: Final-Review durch `qa-code-reviewer` mit `model: opus`, Kopfzeile `Modell: opus`                         | „Final-Review M10", Budget lead-qa                                                  |
| QA 3: Taste I im Browser                                                                                        | QA-U1 Schritt 12; Abdeckung AK-S2-16                                                |
| QA 4: Abdeckungs-Grep gegen die echte Vitest-Ausgabe                                                            | Task 1 „Review-Zusatz"                                                              |
| B1: Board — M10-U4 nach M10-QA-U2, Pakete M10-DOC und M10-MERGE, Ids H-R3/H-R4/M8-MERGE                         | „Board-Paketliste"                                                                  |
| B2: Budget gestuft (Stufe 1 nach Gate Merge M8: T1–T4 lead-tech 11, A1 lead-art 3); > 80 % → Parallelität 2     | „Budgetantrag"                                                                      |
| B3: fremde Testdateien aus dem Lauf melden; Konflikte im W5-Merge löst Controller 2; R1 ohne `beobachtungen.md` | „Bewusst geänderte Tests", „Wellen" (W5), Paket R1, Ownership R1                    |
| B4: `noService` und H-R3 `statusMarks.ts`: Standardfall in H-R3; Nachtrag durch Controller 2 als Ausnahme       | „Abhängigkeiten ausserhalb M10", Task 7 Vorher-Schritt                              |
| B5: H-R4 in `errands.ts`, R1 ohne Kommentar in `life.ts`                                                        | „Abhängigkeiten ausserhalb M10", Paket R1; Kommentar `life.ts` in Task 8 (AK-R1-05) |
