> Teil des Plans M11, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Tasks, Pakete, Rollen

| Task | Paket   | Inhalt                                               | Implementierer (Modell)                                                    | Branch / Worktree                             |
| ---- | ------- | ---------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------- |
| T00  | M11-S0  | Fixture `save-v5.json`, Ist-Messung der Basis        | `tech-sim-engineer` (sonnet)                                               | `feat/m11-sim` · `.worktrees/m11-sim`         |
| T01  | M11-P1A | Fluss je Tick, Typen, Save v6, Naht `cycleOf`        | `tech-sim-engineer`, Roster-Text `tech-save-engineer` im Briefing (sonnet) | `feat/m11-sim`                                |
| T02  | M11-P1B | Gedämpfter Aufstieg, `flow.ts`                       | `tech-sim-engineer` (sonnet)                                               | `feat/m11-sim`                                |
| T03  | M11-P1C | Rote Tests umschreiben, Neupin                       | `tech-sim-engineer` (sonnet)                                               | `feat/m11-sim`                                |
| T04  | M11-P2A | Jagdhütte, Rinderfarm, `free`                        | `tech-sim-engineer` (sonnet)                                               | `feat/m11-sources` · `.worktrees/m11-sources` |
| T05  | M11-P2B | Holzfäller braucht Wald (`noForest`)                 | `tech-sim-engineer` (sonnet)                                               | `feat/m11-sources`                            |
| T06  | M11-P2C | Auslastung `eff`                                     | `tech-sim-engineer` (sonnet)                                               | `feat/m11-sources`                            |
| T07  | M11-P3A | Ausbau-Kern, `LEVELS`, `upgradeBuilding`             | `tech-sim-engineer` (sonnet)                                               | `feat/m11-upgrade` · `.worktrees/m11-upgrade` |
| T08  | M11-P3B | Erstattung, `deriveUnlocks`, Brand, Kette            | `tech-sim-engineer` (sonnet)                                               | `feat/m11-upgrade`                            |
| T09  | M11-INT | Integration P2 + P3, `LEVELS` `hunter`/`cattlefarm`  | `tech-sim-engineer` (sonnet)                                               | `feat/m11-sim`                                |
| T10  | M11-U1  | Kontostand je Frame, Bilanz-Drossel, Zugriffsersatz  | `tech-ui-engineer` (sonnet)                                                | `feat/m11-ui` · `.worktrees/m11-ui`           |
| T11  | M11-U2  | Betriebs-Panel, Ausbau, Mouse-over                   | `tech-ui-engineer` (sonnet)                                                | `feat/m11-ui`                                 |
| T12  | M11-U3  | Haus-Defizit, R161, Bauleiste, Taste, Meldungen      | `tech-ui-engineer` (sonnet)                                                | `feat/m11-ui`                                 |
| R1   | M11-R1  | Ring, Marke `noForest`, Tageslicht                   | `art-rendering-engineer` (sonnet), lead-art                                | `feat/m11-render` · `.worktrees/m11-render`   |
| R2   | M11-R2  | Silhouetten, Stufen-Aufsatz                          | `art-rendering-engineer` (sonnet), lead-art                                | `feat/m11-render`                             |
| B1   | M11-B1  | Fischer-Ausbau-Variante, Szenarien, Endwelt-Prüfung  | `tech-sim-engineer` (sonnet)                                               | `feat/m11-scen` · `.worktrees/m11-scen`       |
| D1   | M11-D1  | README, arc42, ADR-005, Spec-Verweise, Beobachtungen | `tech-sim-engineer` (sonnet)                                               | `feat/m11-ui`                                 |

**Reviewer:** `qa-code-reviewer` (sonnet) je Task; **Browser-Check:** `qa-playtester` (sonnet) nach T10, T11, T12;
**QA-ART** (lead-art, mit lead-qa) nach R1/R2 und B1; **Final-Review** `qa-code-reviewer` mit `model: opus` (lead-qa) über
`feat/m11-ui`. Fix-Runden per `SendMessage` an denselben Arbeiter (zählen nicht als Start).
