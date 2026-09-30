# Metriken Studio-Graph

- erzeugt: 2026-09-30T16:03:50+02:00
- Art: Meilenstein
- Handbuch: 1.0

## Aufwand

- Sessions: 2, Agenten: 96, Delegationen: 34
- Dauer: 74.2 min
- Tool-Aufrufe: 503
- Input-Tokens: 762
- Cache-Write-Tokens: 1904777
- Cache-Read-Tokens: 20281337
- Output-Tokens: ≥ 204360

| Lead            | Agenten | Dauer          | Tool-Aufrufe   | Input          | Cache-Write    | Cache-Read     | Output         |
| --------------- | ------- | -------------- | -------------- | -------------- | -------------- | -------------- | -------------- |
| lead-design     | 2       | 22.5 min       | 77             | nicht gemessen | nicht gemessen | nicht gemessen | nicht gemessen |
| lead-production | 3       | 3.7 min        | 32             | 36             | 44421          | 349982         | 4741           |
| lead-qa         | 2       | 11.3 min       | 88             | 162            | 648958         | 8628177        | ≥ 59269        |
| lead-tech       | 25      | 35.1 min       | 288            | 538            | 1162479        | 10633101       | 131592         |
| studio-coach    | 2       | 1.5 min        | 18             | 26             | 48919          | 670077         | ≥ 8758         |
| studio-director | 62      | nicht gemessen | nicht gemessen | nicht gemessen | nicht gemessen | nicht gemessen | nicht gemessen |

| Modell            | Agenten | Dauer          | Tool-Aufrufe   | Input | Cache-Write | Cache-Read | Output  |
| ----------------- | ------- | -------------- | -------------- | ----- | ----------- | ---------- | ------- |
| claude-opus-5-5   | 4       | nicht gemessen | nicht gemessen | 206   | 727665      | 9528475    | ≥ 71321 |
| claude-sonnet-5-5 | 26      | nicht gemessen | nicht gemessen | 556   | 1177112     | 10752862   | 133039  |

Schätzung gegen Ist:

- Verglichene Agenten: 28
- Geschätzt: 655 min, Ist: 44.2 min, Abweichung: -93.3 %
- Werkzeugaufrufe geschätzt: 847, Ist: 375

## Qualität

- Ergebnisse: 14 (ungeprüft: 0)
- Erstabnahme-Quote: 71 %
- Review-Runden im Mittel: 1.29, Maximum: 2
- Nacharbeit: 4 (29 %)
- Verworfen: 0
- CI-Läufe: nicht erfasst, Fehlschläge auf main: nicht erfasst
- Eskalationen: nicht erfasst
- Gescheiterte Agenten: 0, Agenten mit Lücke: 0

## Vorfälle

- Offene Vorfälle: 1

## Grenzen der Messung

- Output-Tokens mit «≥» sind eine Untergrenze: Nachrichten ohne abgeschlossene Zählung fehlen in der Summe.
- Sitzungskosten: nicht gemessen (kein Transkript-Stand).

## Rohwerte

```json
{
  "agents": 96,
  "by_lead": [
    {
      "agents": 2,
      "agents_measured": 0,
      "cache_read": null,
      "cache_write": null,
      "duration_s": 1352.813,
      "input": null,
      "key": "lead-design",
      "output": null,
      "output_lower_bound": false,
      "tool_calls": 77
    },
    {
      "agents": 3,
      "agents_measured": 2,
      "cache_read": 349982,
      "cache_write": 44421,
      "duration_s": 224.765,
      "input": 36,
      "key": "lead-production",
      "output": 4741,
      "output_lower_bound": false,
      "tool_calls": 32
    },
    {
      "agents": 2,
      "agents_measured": 2,
      "cache_read": 8628177,
      "cache_write": 648958,
      "duration_s": 675.703,
      "input": 162,
      "key": "lead-qa",
      "output": 59269,
      "output_lower_bound": true,
      "tool_calls": 88
    },
    {
      "agents": 25,
      "agents_measured": 25,
      "cache_read": 10633101,
      "cache_write": 1162479,
      "duration_s": 2106.466,
      "input": 538,
      "key": "lead-tech",
      "output": 131592,
      "output_lower_bound": false,
      "tool_calls": 288
    },
    {
      "agents": 2,
      "agents_measured": 1,
      "cache_read": 670077,
      "cache_write": 48919,
      "duration_s": 92.174,
      "input": 26,
      "key": "studio-coach",
      "output": 8758,
      "output_lower_bound": true,
      "tool_calls": 18
    },
    {
      "agents": 62,
      "agents_measured": 0,
      "cache_read": null,
      "cache_write": null,
      "duration_s": null,
      "input": null,
      "key": "studio-director",
      "output": null,
      "output_lower_bound": false,
      "tool_calls": null
    }
  ],
  "by_model": [
    {
      "agents": 4,
      "agents_measured": 4,
      "cache_read": 9528475,
      "cache_write": 727665,
      "duration_s": null,
      "input": 206,
      "key": "claude-opus-5-5",
      "output": 71321,
      "output_lower_bound": true,
      "tool_calls": null
    },
    {
      "agents": 26,
      "agents_measured": 26,
      "cache_read": 10752862,
      "cache_write": 1177112,
      "duration_s": null,
      "input": 556,
      "key": "claude-sonnet-5-5",
      "output": 133039,
      "output_lower_bound": false,
      "tool_calls": null
    }
  ],
  "created": "2026-09-30T16:03:50+02:00",
  "delegations": 34,
  "estimate_vs_actual": {
    "actual_min": 44.2,
    "actual_tools": 375,
    "count": 28,
    "deviation_pct": -93.3,
    "estimated_min": 655,
    "estimated_tools": 847
  },
  "handbook_version": "1.0",
  "incidents_open": 1,
  "kennung": "Studio-Graph",
  "kind": "milestone",
  "quality": {
    "ci_failures": null,
    "ci_runs": null,
    "escalations": null,
    "failed_agents": 0,
    "first_pass_rate": 0.7142857142857143,
    "gap_agents": 0,
    "rejected": 0,
    "results": 14,
    "review_rounds_max": 2,
    "review_rounds_mean": 1.2857142857142858,
    "rework": 4,
    "rework_share": 0.2857142857142857,
    "unchecked": 0
  },
  "session_cost": null,
  "sessions": 2,
  "totals": {
    "cache_read": 20281337,
    "cache_write": 1904777,
    "duration_s": 4451.921,
    "input": 762,
    "output": 204360,
    "output_lower_bound": true,
    "tool_calls": 503
  }
}
```
