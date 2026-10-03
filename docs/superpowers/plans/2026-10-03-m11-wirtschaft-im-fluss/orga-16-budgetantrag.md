> Teil des Plans M11, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Budgetantrag

Formel Handbuch: Pakete × 2 + QA-Checks + 1 Final-Review, × 1,3, aufgerundet. Controller-Instanzen (E-010) und die
Plan-Architekten stehen ausserhalb der Formel.

```text
Lead: lead-tech
Phase: M11-umsetzung
Pakete:
- M11-S0  T00 Fixture, Ist-Messung (nein)
- M11-P1A T01 Fluss, Save v6 (nein)
- M11-P1B T02 Dämpfung (nein)
- M11-P1C T03 Umschreiben, Neupin (nein)
- M11-P2A T04 Quellen (nein)
- M11-P2B T05 Wald live (nein)
- M11-P2C T06 Auslastung (nein)
- M11-P3A T07 Ausbau-Kern (nein)
- M11-P3B T08 Ausbau-Rest (nein)
- M11-INT T09 Integration (nein)
- M11-U1  T10 UI Fluss (ja)
- M11-U2  T11 UI Betrieb (ja)
- M11-U3  T12 UI Haus, Bau (ja)
- M11-B1  B1 Balancing, Szenarien (nein)
- M11-D1  D1 Doku (nein)
Formel: 15 × 2 + 3 (QA-UI nach T10, T11, T12) = 33 → × 1,3 = 42,9 → aufgerundet 43
Parallelität: 4 (W4: drei Implementierer in drei Worktrees plus ein Reviewer bzw. QA-Check)
Bisher frei/verbraucht: M11-PLAN 3 Starts (Plan-Architekten A, B, C)
Beantragt: 43 Starts, Parallelität 4
```

```text
Lead: lead-art
Phase: M11-umsetzung
Pakete:
- M11-R1 Ring, Marke noForest, Tageslicht (ja)
- M11-R2 Silhouetten Jagdhütte/Rinderfarm, Stufen-Aufsatz (ja, Blindtest)
Formel: 2 × 2 + 1 (QA-ART) = 5 → × 1,3 = 6,5 → aufgerundet 7
Parallelität: 1
Beantragt: 7 Starts, Parallelität 1
```

```text
Lead: lead-qa
Phase: M11-umsetzung
Pakete: Final-Review M11 über feat/m11-ui (enthält alle Stränge), qa-code-reviewer mit model: opus
Formel: 1 → × 1,3 = 1,3 → aufgerundet 2
Beantragt: 2 Starts, Parallelität 1
```

- **Summe** 43 + 7 + 2 = **52** (Formel über alles: 17 × 2 + 4 + 1 = 39 → × 1,3 = 50,7 → 51; die Aufrundung je Lead ergibt 52).
  Ausserhalb der Formel: **+7 Starts L0** für die E-010-Controller-Instanzen C1 bis C7 ([orga-13](orga-13-e010-controller-wechsel.md)).
  Fix-Runden per `SendMessage` zählen nicht.
- **Stufung (nach M10-Muster R164):**
  - **Stufe 1** (nach Gate Plan): lead-tech **11** für T00 bis T03 (4 × 2 = 8 → × 1,3 = 10,4 → 11); lead-art **3** für R1
    (1 × 2 = 2 → × 1,3 = 2,6 → 3).
  - **Stufe 2** (nach Gate Plan Stufe 1 und Pin-Prüfung T03 durch L0): lead-tech 32 (T04 bis T12, B1, D1, QA-UI), lead-art 4
    (R2, QA-ART), lead-qa 2.
  - Liegt das Wochenfenster über 80 %, gilt Parallelität **2** statt 4 (`.studio/limits.json` vor jeder Welle prüfen).
- Logging durch L0, z. B. Stufe 1: `log.py budget --lead lead-tech --grant 11 --parallel 4 --phase M11-umsetzung`,
  `log.py budget --lead lead-art --grant 3 --parallel 1 --phase M11-umsetzung`. Bei Session-Wechsel nur den **Rest** loggen.
