> Teil des Plans M11, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### QA-Übersicht

| Prüfung                    | Wer                                  | Wann               | Gegenstand                                                                                                         |
| -------------------------- | ------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Task-Review je Task        | `qa-code-reviewer` (sonnet)          | nach jedem Task    | Spec-Konformität, Rot-Beleg, Testzählung, Ownership, Doku-Schritt                                                  |
| AK-P1-14 (Review)          | Reviewer T02                         | T02                | `flow.ts` ohne Import von `population.ts`/`queries.ts`; nur `levels.ts` liest `def.cycle`/`def.upkeep` (grep)      |
| AK-BAS-06 (Review lead-qa) | Reviewer T03, Final-Review           | T03, Final         | Haupt-Pins = Spec 14 oder Meldung an L0; „(M11 S10)" in Umschreibungen; kein Test gelöscht; AK-F1-05 umgeschrieben |
| AK-R161-03 (Review)        | Reviewer T12                         | T12                | `production.ts` ohne Stein-Reserve; Testhelfer-Stein bleibt                                                        |
| AK-M11B-03 (Review)        | Reviewer B1                          | B1                 | Anhang 03 belegt M-09, M-13, M-14 mit Zahlen; A13 berichtet                                                        |
| AK-M11B-04 (Review)        | Reviewer D1                          | D1                 | README und arc42 nach Spec 12 nachgeführt                                                                          |
| Browser-Check UI           | `qa-playtester` (sonnet)             | nach T10, T11, T12 | AK-UI-01/-02, -04/-06/-07/-08/-10, AK-R161-02; Rahmen Anhang 02 G, 1280 × 800 und 1920 × 1080                      |
| QA-ART                     | `lead-art` mit `lead-qa`             | nach R2, B1        | AK-RND-05 (Ring sichtbar, Silhouetten, Stufen 1/2/3 unterscheidbar)                                                |
| Final-Review               | `qa-code-reviewer` mit `model: opus` | nach D1            | ganze Branch `feat/m11-ui`; Abdeckungs-Grep; Bitgleich; Doku-Konsistenz                                            |
