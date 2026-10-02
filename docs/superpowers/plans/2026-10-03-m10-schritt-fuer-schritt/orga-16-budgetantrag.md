> Teil des Plans M10, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Budgetantrag

Formel Handbuch: Pakete × 2 + QA-Checks + 1 Final-Review, × 1,3, aufgerundet.

```text
Lead: lead-tech
Phase: M10-umsetzung
Pakete:
- M10-S1A Task 1 Freischalt-Modell, Save v5 (nein)
- M10-S1B Task 2 Sperren anwenden (nein)
- M10-F1  Task 3 Roden und Aufforsten (nein)
- M10-S2  Task 4 Amtsstube, Steuer, Sperre, Werkzeugmacher (nein)
- M10-B1  Task 5 Messung und Szenarien (nein)
- M10-U1  Task 6 Bedienung Freischaltung (ja)
- M10-U2  Task 7 Hilfe, Forst, Amtsstuben-Panel (ja)
- M10-U3  Task 8 Mouse-over (ja)
- M10-U4  Task 9 Symbole im Einbau (ja)
Formel: 9 × 2 + 4 (QA-U1 … QA-U4) = 22 → × 1,3 = 28,6 → aufgerundet 29
Parallelität: 3 (W2 und W4: zwei Implementierer in zwei Worktrees, dazu ein Reviewer bzw. ein QA-Check parallel zum nächsten UI-Task)
Bisher frei/verbraucht: M10-PLAN 2 frei / 0 verbraucht (kein Plan-Architekt gestartet)
Begründung Mehrbedarf: —
Beantragt: 29 Starts, Parallelität 3
```

```text
Lead: lead-art
Phase: M10-umsetzung
Pakete:
- M10-A1 Symbolsatz (ja, Blindtest)
- M10-R1 Amtsstube-Silhouette, Terrain-Teil-Neuzeichnung (ja, Blindtest; Messung in QA-U2)
Formel: 2 × 2 + 1 (QA-ART) = 5 → × 1,3 = 6,5 → aufgerundet 7
Parallelität: 1
Beantragt: 7 Starts, Parallelität 1
```

```text
Lead: lead-qa
Phase: M10-umsetzung
Pakete: Final-Review M10 über feat/m10-ui (enthält alle Stränge), Prüfer qa-code-reviewer mit model: opus
Formel: 1 → × 1,3 = 1,3 → aufgerundet 2 (Reserve für eine Zweitprüfung)
Beantragt: 2 Starts, Parallelität 1
```

- **Summe** 29 + 7 + 2 = **38** (Formel über alles: 11 × 2 + 5 + 1 = 28 → × 1,3 = 36,4 → 37; die Aufrundung je Lead
  ergibt 38). Ausserhalb der Formel: +1 Start L0 für die E-010-Instanz. Fix-Runden per `SendMessage` zählen nicht.
- **Stufung (R164, B2):** Kein Start vor dem Gate Merge M8.
  - **Stufe 1** (nach dem Gate Merge M8): lead-tech **11** für Tasks 1–4 (4 × 2 = 8 → × 1,3 = 10,4 → 11),
    lead-art **3** für A1 (1 × 2 = 2 → × 1,3 = 2,6 → 3).
  - **Stufe 2** (nach Freigabe durch L0): lead-tech 18 (Tasks 5–9, QA-U1 … QA-U4), lead-art 4 (R1, QA-ART),
    lead-qa 2.
  - Liegt das Wochenfenster über 80 %, gilt Parallelität **2** statt 3. Der Controller prüft das vor jeder Welle
    (`.studio/limits.json`) und startet dann höchstens zwei Agenten gleichzeitig.
- Logging je Stufe durch L0, z. B. Stufe 1:
  `log.py budget --lead lead-tech --grant 11 --parallel 3 --phase M10-umsetzung` und
  `log.py budget --lead lead-art --grant 3 --parallel 1 --phase M10-umsetzung`. Bei jedem Session-Wechsel nur den
  **Rest** neu loggen.
- Gegenüber Spec 19 (10 Pakete): +1 Paket durch die Teilung S1 (P2), −1 Start durch D1 ohne Start (P5).

---
