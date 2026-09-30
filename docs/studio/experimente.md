# Experimente

Jede Änderung an Handbuch, Personas, Vorlagen, Budget-Heuristiken oder Dashboard-Ansichten ist ein
Experiment ([Verfassung §10](VERFASSUNG.md#10-verbesserungsprozess-grundzüge), Ablauf im Handbuch
[STUDIO.md](STUDIO.md), Abschnitt „Verbesserungsschleife"). Der `studio-coach` schlägt vor und
pflegt diese Datei; der Projektleiter entscheidet je Vorschlag per Ruling.

**Format** — ein Abschnitt je Experiment, Felder erklärt in
[templates/experiment.md](templates/experiment.md):

```markdown
## E-<nnn> · <status> · <Kurztitel>

- Hypothese: <wenn wir X ändern, dann Y>
- Messgrösse: <Kennzahl mit Schwelle>
- Zeitraum: <wie lange beobachtet wird>
- Rückfall: <exakter Zustand/Version, zu dem zurückgekehrt wird>
- Dateien: <betroffene Dateien>
- Ruling: <R-Nummer>
- Start: Handbuch <Version>
- Bewertung: –
```

**Status:**

| Status           | Bedeutung                                                 |
| ---------------- | --------------------------------------------------------- |
| `vorgeschlagen`  | vom Coach vorgeschlagen, Ruling von L0 steht aus          |
| `laufend`        | angenommen und umgesetzt, Beobachtungszeitraum läuft      |
| `behalten`       | Schwelle erreicht, Änderung bleibt                        |
| `angepasst`      | Änderung bleibt in angepasster Form (neues Ruling)        |
| `zurückgenommen` | Schwelle verfehlt, Rückfallzustand wiederhergestellt      |
| `abgelehnt`      | L0 hat den Vorschlag per Ruling abgelehnt (nie umgesetzt) |

Höchstens **3** Experimente sind gleichzeitig `laufend` (geprüft von
`tools/studio/tests/test_docs.py`).

---
