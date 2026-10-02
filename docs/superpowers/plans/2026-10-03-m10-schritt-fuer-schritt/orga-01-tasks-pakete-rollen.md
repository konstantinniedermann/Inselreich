> Teil des Plans M10, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Tasks, Pakete, Rollen

| Task          | Paket      | Inhalt                                                                                                    | Implementierer (Modell)                                                    | Branch / Worktree                           |
| ------------- | ---------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| 1             | M10-S1A    | Vorlauf Fixture v4; Freischalt-Modell: Defs, `unlocks.ts`, `tickUnlocks`, `createWorld`, Save v5          | `tech-sim-engineer` (sonnet), Roster-Text `tech-save-engineer` im Briefing | `feat/m10-sim` · `.worktrees/m10-sim`       |
| 2             | M10-S1B    | Sperren anwenden: `buildLock`, `canPlace`, `buy`, `deliverOrder`, `unlockAll` in Tests, `nextStep`-Filter | `tech-sim-engineer` (sonnet)                                               | `feat/m10-sim` · `.worktrees/m10-sim`       |
| 3             | M10-F1     | Wald roden und aufforsten (Sim), `layoutKey` mit Geländeart                                               | `tech-sim-engineer` (sonnet)                                               | `feat/m10-forest` · `.worktrees/m10-forest` |
| 4             | M10-S2     | Amtsstube, wirksame Steuer, Ausgabesperre, Werkzeugmacher `noService`, Aufstiegsstopp (K1), Taste I       | `tech-sim-engineer` (sonnet)                                               | `feat/m10-sim` · `.worktrees/m10-sim`       |
| 5             | M10-B1     | Freischalt-Messung, M8-B1-Messung, Szenarien `m10-*` mit Prüfpunkten                                      | `tech-sim-engineer` (sonnet)                                               | `feat/m10-scen` · `.worktrees/m10-scen`     |
| 6             | M10-U1     | Bauleiste, Tasten, Liste, Chips, Handel, Auftrag, Meldung, Ton, „Alles frei", Kopfzeile, Dev-Sonde        | `tech-ui-engineer` (sonnet)                                                | `feat/m10-ui` · `.worktrees/m10-ui`         |
| 7             | M10-U2     | Hilfe-Karte, `nextStep`, Forst-Bedienung, Amtsstuben-Panel, Tooltips, Gründe, K4, K5                      | `tech-ui-engineer` (sonnet)                                                | `feat/m10-ui` · `.worktrees/m10-ui`         |
| 8             | M10-U3     | Mouse-over                                                                                                | `tech-ui-engineer` (sonnet)                                                | `feat/m10-ui` · `.worktrees/m10-ui`         |
| 9             | M10-U4     | Symbole im Einbau, K2, K3                                                                                 | `tech-ui-engineer` (sonnet)                                                | `feat/m10-ui` · `.worktrees/m10-ui`         |
| A1            | M10-A1     | Symbolsatz `icons.ts` (lead-art)                                                                          | `art-rendering-engineer` (Controller `lead-art`)                           | `feat/m10-icons` · `.worktrees/m10-icons`   |
| R1            | M10-R1     | Amtsstube-Silhouette, Terrain-Teil-Neuzeichnung nach Geländewechsel, Cache-Kommentare (lead-art)          | `art-rendering-engineer` (Controller `lead-art`)                           | `feat/m10-render` · `.worktrees/m10-render` |
| QA-U1 … QA-U4 | je UI-Task | Browser-Checks mit festen Prüfpunkten                                                                     | `qa-playtester` (sonnet)                                                   | `.worktrees/m10-qa` (detached, nur lesen)   |
| QA-ART        | A1, R1     | Blindtests AK-A1-03, AK-R1-04 (lead-art)                                                                  | `qa-playtester` (sonnet, Controller `lead-art`)                            | `.worktrees/m10-qa-art` (detached)          |
| D1            | M10-D1     | README, Hauptspec-Verweise, arc42 §5/§8 (lead-tech, kein Start)                                           | —                                                                          | `feat/m10-ui`                               |

- **Review je Task:** `qa-code-reviewer` (sonnet), Urteil OK / BEDENKEN / ZURÜCK. Fix-Runden per `SendMessage` an
  denselben Implementierer (kein neuer Start).
- **Kein eigener `tech-save-engineer`-Start** (wie M6, M8): Task 1 bekommt den Roster-Text ins Briefing.
- **B1 durch `tech-sim-engineer`** (Spec 19 nennt `design-balancing-analyst`; die Persona hat keine Datei; wie M8).
- **ADR-005-Nachtrag und arc42 §6/§8 Persistenz** schreibt `lead-tech` selbst nach Task 2 (Spec 19 S1, AK-S1-05 (c),
  AK-S1-20), **D1** nach QA-U4 (P5).
