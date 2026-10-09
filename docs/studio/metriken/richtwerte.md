# Richtwerte für die Schätzung

Grundlage für die Kopfzeile `Schätzung:` im Briefing (Handbuch [STUDIO.md](../STUDIO.md),
„Briefing-Standard“; Experiment E-001, R54). Der `studio-coach` pflegt die Datei von Hand und eicht
sie nach jedem Meilenstein nach. Die Werte sind gemessene Ist-Mediane je Start, keine Schätzungen.
Die Datei hat bewusst keinen Abschnitt „Rohwerte“, damit der Dashboard-Verlauf sie nicht als
Metrik liest.

Stand: 2026-10-01 (Nacheichung M7, unten) · Datenbasis bis M5/Studio-Graph: `metriken/Studio-Graph.md` und Nachzählung aus
`.studio/events.jsonl` (Records mit Kopfzeile `Schätzung:`, je Start; bei Leads der ganze
Teilbaum), siehe Retro [2026-09-30-meilenstein-studio-graph.md](../retros/2026-09-30-meilenstein-studio-graph.md).

## So schätzen

1. Starts planen: je Task Umsetzung + Review, dazu eine Fix-Runde bei jedem dritten bis sechsten Task
   (Nacharbeit Studio-Graph 4 von 12, M7 6 von 38), Playtests und Final-Review.
2. Je Start den Median aus der Tabelle nehmen, passend zu Rolle, Messmodell und Plan-Art, und summieren. Das Einsatzmodell bestimmt die Modelltabelle in `STUDIO.md` (Abschnitt Modelle), nicht die Spalte „gemessen auf“.
3. Ohne passende Zeile: erst die Werkzeugaufrufe schätzen, dann Minuten ≈ Tools ÷ 4 (gemessen
   8,5 Tools/min in Studio-Graph, 4,1 in M5, 3,9 in M7; mit ÷ 6 lagen die Minuten in M7 um +33 %
   zu tief).
4. Nicht in Menschenzeit schätzen. Menschenzeit lag 5- bis 20-fach über dem Ist.

Plan-Art: **Code im Plan** = der Plan enthält den fertigen Code, der Arbeiter übernimmt und testet
(Studio-Graph). **Spec/offen** = der Arbeiter entwirft selbst, oder die Plan-Art ist nicht erfasst
(M5, Arbeit ohne Meilenstein).

## Arbeiter

| Rolle                   | gemessen auf | Plan-Art     | n   | Median min | Median Tools | Spanne min |
| ----------------------- | ------------ | ------------ | --- | ---------- | ------------ | ---------- |
| production-studio-ops   | sonnet       | Code im Plan | 10  | 1,1        | 10           | 0,6–3,6    |
| production-studio-ops   | sonnet       | Spec/offen   | 2   | 2,9        | 24           | 2,0–3,7    |
| tech-ui-engineer        | sonnet       | Code im Plan | 2   | 1,5        | 15           | 1,4–1,6    |
| tech-sim-engineer       | sonnet       | Spec/offen   | 1   | 1,4        | 13           | –          |
| qa-code-reviewer        | sonnet       | Task-Review  | 13  | 0,6        | 6            | 0,2–1,4    |
| qa-code-reviewer        | opus         | Final-Review | 1   | 6,9        | 53           | –          |
| qa-code-reviewer        | opus         | Task-Review  | 2   | 1,6        | 19           | 1,1–2,1    |
| qa-playtester           | sonnet       | Code im Plan | 2   | 4,3        | 27           | 2,4–6,2    |
| production-integrator   | sonnet       | Merge        | 3   | 1,8        | 14           | 1,8–2,0    |
| design-spec-author      | opus         | Spec/offen   | 1   | 11,7       | 38           | –          |
| design-economy-designer | opus         | Spec/offen   | 1   | 8,6        | 28           | –          |
| design-genre-researcher | sonnet       | Spec/offen   | 1   | 0,4        | 9            | –          |
| studio-coach            | opus         | Retro        | 4   | 1,7        | 16           | 1,4–4,2    |

## Leads (ganzer Teilbaum)

| Rolle           | gemessen auf | Anlass                    | n   | Median min | Median Tools |
| --------------- | ------------ | ------------------------- | --- | ---------- | ------------ |
| lead-design     | opus         | Spec mit Arbeitern (M5)   | 1   | 31,6       | 129          |
| lead-production | opus         | Auswertung/Plan (M5)      | 1   | 16,4       | 202          |
| lead-production | opus         | Merge-Gate (Studio-Graph) | 1   | 0,6        | 18           |
| lead-tech       | opus         | kleines Paket (M5)        | 2   | 3,2        | 33           |
| lead-qa         | opus         | Review-Paket (M5)         | 1   | 2,0        | 13           |

Zeilen mit n < 3 sind Anhaltspunkte, keine belastbaren Werte. Die Minuten der Leads hängen an der
Zahl ihrer Starts; bei grossen Paketen die Arbeiterzeilen summieren.

## Nacheichung M7

Stand: 2026-10-01 · Datenbasis: Records mit Meilenstein M7 aus `.studio/events.jsonl` (lokale
Sessions 664ac8d3 und 5e248230; die Cloud-Session ddd9a9ac fehlt), Arbeiter mit gemessener Dauer,
mit und ohne Fortsetzung zusammen. Plan-Art „Spec/offen“ (in M7 nicht erfasst). Siehe Retro
[2026-10-01-meilenstein-m7.md](../retros/2026-10-01-meilenstein-m7.md) B4. Weicht eine Zeile hier von
der Tabelle oben ab, gilt die M7-Zeile (jüngere Daten).

| Rolle                  | gemessen auf | Anlass               | n   | Median min | Median Tools | Spanne min |
| ---------------------- | ------------ | -------------------- | --- | ---------- | ------------ | ---------- |
| art-rendering-engineer | sonnet       | Render-Task          | 4   | 17,2       | 62           | 2,2–39,4   |
| art-audio-engineer     | sonnet       | Audio/Assets-Task    | 3   | 11,8       | 38           | 2,7–23,8   |
| art-asset-scout        | sonnet       | Scouting             | 2   | 3,5        | 54           | 3,0–4,0    |
| art-license-checker    | opus         | Lizenzprüfung        | 2   | 6,2        | 37           | 3,7–8,8    |
| tech-ui-engineer       | sonnet       | UI-Task              | 3   | 2,1        | 12           | 1,0–3,4    |
| qa-code-reviewer       | sonnet       | Task-Review          | 8   | 1,6        | 11           | 1,1–27,9   |
| qa-code-reviewer       | opus         | Task- / Final-Review | 5   | 8,1        | 60           | 5,0–15,0   |
| qa-playtester          | sonnet       | QA-Check             | 8   | 13,4       | 47           | 5,4–26,5   |
| production-integrator  | sonnet       | Merge                | 4   | 2,2        | 11           | 1,5–3,1    |
| design-spec-author     | opus         | Kurz-Spec (M7-UX)    | 1   | 27,7       | 69           | –          |
| design-ux-heuristiker  | opus         | UX-Analyse           | 1   | 4,8        | 32           | –          |

Leads (eigene Dauer, Werkzeugaufrufe des ganzen Teilbaums):

| Rolle           | gemessen auf | Anlass                     | n   | Median min | Median Tools |
| --------------- | ------------ | -------------------------- | --- | ---------- | ------------ |
| lead-art        | opus         | Spec mit Arbeitern (M7)    | 1   | 29,6       | 241          |
| lead-tech       | opus         | Plan / Plan-Überarbeitung  | 3   | 26,7       | 82           |
| lead-qa         | opus         | Gate- oder Final-Prüfung   | 3   | 8,3        | 57           |
| lead-design     | opus         | UX-Analyse mit Kurz-Spec   | 1   | 15,8       | 295          |
| lead-production | opus         | Plan-Prüfung (Gate, M7-UX) | 1   | 22,8       | 225          |
