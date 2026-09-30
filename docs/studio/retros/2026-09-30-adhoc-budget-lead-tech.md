# Retro adhoc budget-lead-tech — 2026-09-30

- Datum: 2026-09-30
- Art: adhoc
- Auslöser: budget:lead-tech:M5-01 („Budget von lead-tech überschritten: 7 von 4“, beim Nachzählen 8 von 4)
- Datenbasis: `.studio/events.jsonl` (Budget-Events Zeilen 1881, 2586), `tools/studio/model.py` (`on_budget` Z. 548–566, `budget_view` Z. 890–934), Nachzählung mit `model._Builder` über alle Events (Knoten je `session_id` und `package`)

## Befunde

### B1 · Keine echte Überschreitung: Die Freigabe M5-01 hat die Phase der Graph-Session überschrieben

- Beobachtung: Zwei Sessions führen einen eigenen `lead-tech`. Die Graph-Session (baff17bb) erhielt um 12:56:49 die Freigabe `graph-umsetzung` mit 32 Starts, parallel 2 (Z. 1881). L0 (25e8352d) gab um 13:28:09 `M5-01` mit 4 Starts, parallel 1 frei (Z. 2586). `on_budget` führt je Lead-Rolle nur eine Phase: Die neue Phase ersetzt die alte und setzt `since` neu. `budget_view` zählt ab `since` alle Kinder aller Knoten mit der Rolle `lead-tech`, ohne Session und ohne Paket zu prüfen.
- Beleg (nachgezählt je Session, Stand der Nachzählung):

  | Session              | Freigabe                        | Starts gesamt | davon nach 13:28:09                     | Urteil         |
  | -------------------- | ------------------------------- | ------------- | --------------------------------------- | -------------- |
  | baff17bb (Graph)     | graph-umsetzung: 32, parallel 2 | 25 (G-1…G-10) | 6 (G-9 ×3, G-6c ×2, G-10)               | im Rahmen      |
  | 25e8352d (L0, M5-01) | M5-01: 4, parallel 1            | 2             | 2 (tech-sim-engineer, qa-code-reviewer) | im Rahmen      |
  | Anzeige              | M5-01: 4                        | –             | 8 = 6 + 2                               | falscher Alarm |

- Deutung: Keine Session hat ihr Budget überschritten. Der Vorfall ist ein Messartefakt der Budget-Zuordnung. Die Zahl steigt weiter, solange die Graph-Session Arbeiter startet (Meldung 7, Nachzählung 8). Die Parallelitäts-Prüfung hat denselben Fehler: Sie misst die Spitze über beide Sessions gegen `parallel 1` von M5-01. Diese Spitze habe ich nicht getrennt nachgezählt.
- Wirkung: ein Fehlalarm, eine Ad-hoc-Retro (ein Coach-Start) und eine Rückfrage von L0. Schwerer wiegt, dass die Graph-Session seit 13:28 keine gültige Budget-Anzeige mehr hat: Ihre 32er-Freigabe ist im Modell verschwunden, eine echte Überschreitung dort bliebe unbemerkt.

### B2 · Parallele Sessions sind der Normalfall, das Modell nimmt eine Session an

- Beobachtung: Beide Sessions schreiben seit dem Vormittag in dieselbe `.studio/events.jsonl` (erste Freigabe der Graph-Session Z. 235, 10:00). Die Knoten tragen `session_id` und `package` bereits; `on_budget` und `budget_view` nutzen beides nicht.
- Deutung: Belegt ist ein Fall. Ob auch der Phantomknoten aus Retro ci-pages B3 von der zweiten Session stammt, ist offen. Die Ursache ist trotzdem strukturell: Jede Kennzahl, die je Rolle statt je (Rolle, Session) zusammenfasst, kann bei parallelen Sessions kippen.

## Befragung der Leads

- keine; Event-Log und Code belegen den Befund vollständig.

## Vorschläge

Keine Experimente; B1 ist ein Fehler im Werkzeug.

Paket-Kandidat für L0 (Empfehlung: annehmen, nach dem Merge der Prozess-Graph-Session, weil sie gerade in `tools/studio/model.py` arbeitet):

- **Budgets je (Lead, Phase) führen statt je Lead.** `on_budget` legt je Schlüssel (Rolle, Phase) einen Eintrag an; eine neue Phase ersetzt keine fremde. Ein Budget-Event trägt `session_id` (vorhanden) und optional `package`.
- **Kinder der Freigabe zuordnen:** Ein Kind zählt nur für die Freigabe seiner Session (über den Eltern-Knoten), bei mehreren Phasen einer Session über das `package` bzw. `since`. `budget_view` zeigt je (Lead, Phase) eine Zeile; der Vorfall-Schlüssel bleibt `budget:<lead>:<phase>`.
- **Parallele Sessions als Normalfall** in Tests abdecken.
- Abnahme: Die Event-Folge von heute (graph-umsetzung 32 in baff17bb, danach M5-01 4 in 25e8352d, Kinder wie in B1) ergibt keinen offenen Budget-Vorfall; M5-01 zeigt 2 von 4, graph-umsetzung 25 von 32. Gegenprobe: Ein fünfter Start unter M5-01 in derselben Session erzeugt `budget:lead-tech:M5-01`. Gleiches gilt für die Parallelitätsspitze.

## Bewertung laufender Experimente

- nicht Gegenstand dieser Ad-hoc-Retro.

## Änderungen an lernen.md

- neu: Budget-Vorfälle bei parallelen Sessions zuerst je Session nachzählen, bis der Fix da ist. Die Datei hat jetzt 8 Zeilen.
