> Teil des Plans M11, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### E-010: Controller-Wechsel (Instanzschnitt, R190)

Regel (E-010, R190): Eine Controller-Instanz übergibt spätestens nach **6 Arbeiter-Starts** (Implementierer, Reviewer,
Playtester; Fix-Runden per `SendMessage` zählen nicht) oder **200k Kontext**. Übergabe per Ledger
`.superpowers/sdd/m11/ledger.md` (SHAs, Urteile, offene Rulings) und einem Satz Status; die frische Instanz läuft auf
`sonnet` und bekommt je Arbeiter nur die Task-Datei und die AK-IDs.

| Instanz | Tasks (Arbeiter-Starts)                                                                  | Starts | Übergabe an / nach                |
| ------- | ---------------------------------------------------------------------------------------- | ------ | --------------------------------- |
| C1      | T00 (2), T01 (2), T02 (2)                                                                | 6      | C2 (nach T02 OK, SHA ins Ledger)  |
| C2      | T03 (2), danach T10 (2) + QA-UI T10 (1)                                                  | 5      | C3/C4 starten ab T03-SHA (Ledger) |
| C3      | T04 (2), T05 (2), T06 (2) auf `feat/m11-sources`                                         | 6      | C5 (T06-SHA im Ledger)            |
| C4      | T07 (2), T08 (2) auf `feat/m11-upgrade`                                                  | 4      | C5 (T08-SHA im Ledger)            |
| C5      | T09 (2) auf `feat/m11-sim`, B1 (2) auf `feat/m11-scen`                                   | 4      | C6 (T09-SHA)                      |
| C6      | T11 (2) + QA-UI (1), T12 (2) + QA-UI (1) auf `feat/m11-ui`                               | 6      | C7                                |
| C7      | D1 (2), merge `feat/m11-scen`/`feat/m11-render` in `feat/m11-ui`, Final-Review anstossen | 2      | lead-qa                           |

- C3 und C4 laufen **gleichzeitig** (W4), dazu C2 mit T10: drei Controller, drei Worktrees, überschneidungsfreie
  Ownership ([orga-07](orga-07-datei-ownership.md)). Zu jeder Zeit höchstens vier Arbeiter gleichzeitig.
- C5 startet erst, wenn C3 und C4 ihre SHAs im Ledger haben (kein Warten mit grossem Kontext, sondern neue Instanz).
- R1, R2 und QA-ART startet `lead-art` mit eigenem Controller (eigenes Budget); Übergabe der SHAs über das Ledger.
- Die Instanzzahl (7) steht ausserhalb der Budgetformel (+7 Starts L0, [orga-16](orga-16-budgetantrag.md)).
