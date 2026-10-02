# Metriken M7-UX

- erzeugt: 2026-10-02T11:32:21+02:00
- Art: Meilenstein
- Handbuch: 1.9

## Aufwand

- Sessions: 1, Agenten: 34, Delegationen: 34
- Dauer: 169.1 min
- Tool-Aufrufe: 1046
- Input-Tokens: 2034
- Cache-Write-Tokens: 5277886
- Cache-Read-Tokens: 98219746
- Output-Tokens: ≥ 722473

| Lead                 | Agenten | Dauer          | Tool-Aufrufe | Input          | Cache-Write    | Cache-Read     | Output         |
| -------------------- | ------- | -------------- | ------------ | -------------- | -------------- | -------------- | -------------- |
| lead-design          | 1       | 2.1 min        | 19           | 34             | 67728          | 754859         | ≥ 10323        |
| lead-qa              | 3       | 18.9 min       | 154          | 308            | 676086         | 17286348       | ≥ 92929        |
| lead-tech            | 27      | 141.3 min      | 829          | 1644           | 4435771        | 79376936       | ≥ 591775       |
| studio-coach         | 1       | nicht gemessen | 18           | nicht gemessen | nicht gemessen | nicht gemessen | nicht gemessen |
| studio-director      | 1       | 2.0 min        | 8            | 14             | 15610          | 83369          | ≥ 1186         |
| studio-process-coach | 1       | 4.8 min        | 18           | 34             | 82691          | 718234         | 26260          |

| Modell            | Agenten | Dauer          | Tool-Aufrufe   | Input | Cache-Write | Cache-Read | Output   |
| ----------------- | ------- | -------------- | -------------- | ----- | ----------- | ---------- | -------- |
| claude-opus-5-5   | 5       | nicht gemessen | nicht gemessen | 896   | 2415322     | 68621037   | ≥ 279430 |
| claude-sonnet-5-5 | 28      | nicht gemessen | nicht gemessen | 1138  | 2862564     | 29598709   | ≥ 443043 |

Schätzung gegen Ist:

- Verglichene Agenten: 28
- Geschätzt: 196 min, Ist: 122.5 min, Abweichung: -37.5 %
- Werkzeugaufrufe geschätzt: 1100, Ist: 709

## Qualität

- Ergebnisse: 23 (ungeprüft: 1)
- Erstabnahme-Quote: 59 %
- Review-Runden im Mittel: 1.45, Maximum: 3
- Nacharbeit: 6 (26 %)
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
  "agents": 34,
  "by_lead": [
    {
      "agents": 1,
      "agents_measured": 1,
      "cache_read": 754859,
      "cache_write": 67728,
      "duration_s": 125.739,
      "input": 34,
      "key": "lead-design",
      "output": 10323,
      "output_lower_bound": true,
      "tool_calls": 19
    },
    {
      "agents": 3,
      "agents_measured": 3,
      "cache_read": 17286348,
      "cache_write": 676086,
      "duration_s": 1133.672,
      "input": 308,
      "key": "lead-qa",
      "output": 92929,
      "output_lower_bound": true,
      "tool_calls": 154
    },
    {
      "agents": 27,
      "agents_measured": 27,
      "cache_read": 79376936,
      "cache_write": 4435771,
      "duration_s": 8480.409,
      "input": 1644,
      "key": "lead-tech",
      "output": 591775,
      "output_lower_bound": true,
      "tool_calls": 829
    },
    {
      "agents": 1,
      "agents_measured": 0,
      "cache_read": null,
      "cache_write": null,
      "duration_s": null,
      "input": null,
      "key": "studio-coach",
      "output": null,
      "output_lower_bound": false,
      "tool_calls": 18
    },
    {
      "agents": 1,
      "agents_measured": 1,
      "cache_read": 83369,
      "cache_write": 15610,
      "duration_s": 117.681,
      "input": 14,
      "key": "studio-director",
      "output": 1186,
      "output_lower_bound": true,
      "tool_calls": 8
    },
    {
      "agents": 1,
      "agents_measured": 1,
      "cache_read": 718234,
      "cache_write": 82691,
      "duration_s": 288.006,
      "input": 34,
      "key": "studio-process-coach",
      "output": 26260,
      "output_lower_bound": false,
      "tool_calls": 18
    }
  ],
  "by_model": [
    {
      "agents": 5,
      "agents_measured": 5,
      "cache_read": 68621037,
      "cache_write": 2415322,
      "duration_s": null,
      "input": 896,
      "key": "claude-opus-5-5",
      "output": 279430,
      "output_lower_bound": true,
      "tool_calls": null
    },
    {
      "agents": 28,
      "agents_measured": 28,
      "cache_read": 29598709,
      "cache_write": 2862564,
      "duration_s": null,
      "input": 1138,
      "key": "claude-sonnet-5-5",
      "output": 443043,
      "output_lower_bound": true,
      "tool_calls": null
    }
  ],
  "created": "2026-10-02T11:32:21+02:00",
  "delegations": 34,
  "estimate_vs_actual": {
    "actual_min": 122.5,
    "actual_tools": 709,
    "count": 28,
    "deviation_pct": -37.5,
    "estimated_min": 196,
    "estimated_tools": 1100
  },
  "handbook_version": "1.9",
  "incidents_open": 1,
  "kennung": "M7-UX",
  "kind": "milestone",
  "quality": {
    "ci_failures": null,
    "ci_runs": null,
    "escalations": null,
    "failed_agents": 0,
    "first_pass_rate": 0.5909090909090909,
    "gap_agents": 0,
    "rejected": 0,
    "results": 23,
    "review_rounds_max": 3,
    "review_rounds_mean": 1.4545454545454546,
    "rework": 6,
    "rework_share": 0.2608695652173913,
    "unchecked": 1
  },
  "session_cost": null,
  "sessions": 1,
  "totals": {
    "cache_read": 98219746,
    "cache_write": 5277886,
    "duration_s": 10145.507,
    "input": 2034,
    "output": 722473,
    "output_lower_bound": true,
    "tool_calls": 1046
  }
}
```
