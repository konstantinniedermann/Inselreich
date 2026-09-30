# Richtwerte für die Schätzung

Grundlage für die Kopfzeile `Schätzung:` im Briefing (Handbuch [STUDIO.md](../STUDIO.md),
„Briefing-Standard“; Experiment E-001, R54). Der `studio-coach` pflegt die Datei von Hand und eicht
sie nach jedem Meilenstein nach. Die Werte sind gemessene Ist-Mediane je Start, keine Schätzungen.
Die Datei hat bewusst keinen Abschnitt „Rohwerte“, damit der Dashboard-Verlauf sie nicht als
Metrik liest.

Stand: 2026-09-30 · Datenbasis: `metriken/Studio-Graph.md` und Nachzählung aus
`.studio/events.jsonl` (Records mit Kopfzeile `Schätzung:`, je Start; bei Leads der ganze
Teilbaum), siehe Retro [2026-09-30-meilenstein-studio-graph.md](../retros/2026-09-30-meilenstein-studio-graph.md).

## So schätzen

1. Starts planen: je Task Umsetzung + Review, dazu eine Fix-Runde bei jedem dritten Task (Nacharbeit
   Studio-Graph 4 von 12), Playtests und Final-Review.
2. Je Start den Median aus der Tabelle nehmen, passend zu Rolle, Modell und Plan-Art, und summieren.
3. Ohne passende Zeile: erst die Werkzeugaufrufe schätzen, dann Minuten ≈ Tools ÷ 6 (gemessen
   8,5 Tools/min in Studio-Graph, 4,1 Tools/min in M5).
4. Nicht in Menschenzeit schätzen. Menschenzeit lag 5- bis 20-fach über dem Ist.

Plan-Art: **Code im Plan** = der Plan enthält den fertigen Code, der Arbeiter übernimmt und testet
(Studio-Graph). **Spec/offen** = der Arbeiter entwirft selbst, oder die Plan-Art ist nicht erfasst
(M5, Arbeit ohne Meilenstein).

## Arbeiter

| Rolle                   | Modell | Plan-Art     | n   | Median min | Median Tools | Spanne min |
| ----------------------- | ------ | ------------ | --- | ---------- | ------------ | ---------- |
| production-studio-ops   | sonnet | Code im Plan | 10  | 1,1        | 10           | 0,6–3,6    |
| production-studio-ops   | sonnet | Spec/offen   | 2   | 2,9        | 24           | 2,0–3,7    |
| tech-ui-engineer        | sonnet | Code im Plan | 2   | 1,5        | 15           | 1,4–1,6    |
| tech-sim-engineer       | sonnet | Spec/offen   | 1   | 1,4        | 13           | –          |
| qa-code-reviewer        | sonnet | Task-Review  | 13  | 0,6        | 6            | 0,2–1,4    |
| qa-code-reviewer        | opus   | Final-Review | 1   | 6,9        | 53           | –          |
| qa-code-reviewer        | opus   | Task-Review  | 2   | 1,6        | 19           | 1,1–2,1    |
| qa-playtester           | sonnet | Code im Plan | 2   | 4,3        | 27           | 2,4–6,2    |
| production-integrator   | sonnet | Merge        | 3   | 1,8        | 14           | 1,8–2,0    |
| design-spec-author      | opus   | Spec/offen   | 1   | 11,7       | 38           | –          |
| design-economy-designer | opus   | Spec/offen   | 1   | 8,6        | 28           | –          |
| design-genre-researcher | sonnet | Spec/offen   | 1   | 0,4        | 9            | –          |
| studio-coach            | opus   | Retro        | 4   | 1,7        | 16           | 1,4–4,2    |

## Leads (ganzer Teilbaum)

| Rolle           | Modell | Anlass                    | n   | Median min | Median Tools |
| --------------- | ------ | ------------------------- | --- | ---------- | ------------ |
| lead-design     | opus   | Spec mit Arbeitern (M5)   | 1   | 31,6       | 129          |
| lead-production | opus   | Auswertung/Plan (M5)      | 1   | 16,4       | 202          |
| lead-production | opus   | Merge-Gate (Studio-Graph) | 1   | 0,6        | 18           |
| lead-tech       | opus   | kleines Paket (M5)        | 2   | 3,2        | 33           |
| lead-qa         | opus   | Review-Paket (M5)         | 1   | 2,0        | 13           |

Zeilen mit n < 3 sind Anhaltspunkte, keine belastbaren Werte. Die Minuten der Leads hängen an der
Zahl ihrer Starts; bei grossen Paketen die Arbeiterzeilen summieren.
