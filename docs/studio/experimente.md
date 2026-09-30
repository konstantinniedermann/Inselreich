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

## E-001 · laufend · Schätzung aus Richtwerten statt Menschenzeit

- Hypothese: Wenn Leads die Kopfzeile `Schätzung:` aus einer Richtwert-Tabelle je Rolle und Plan-Art (Ist-Mediane aus `docs/studio/metriken/`, vom Coach je Meilenstein nachgeeicht) ableiten statt aus Menschenzeit, dann sinkt die Abweichung Schätzung gegen Ist von −93 % (Studio-Graph) bzw. −69 % (M5, nachgezählt) auf höchstens ±50 %.
- Messgrösse: In der Meilenstein-Metrik (`metriken/<id>.md`, Abschnitt „Schätzung gegen Ist“) liegt die Abweichung der Minuten bei höchstens ±50 % und die der Werkzeugaufrufe ebenfalls bei höchstens ±50 %, über mindestens 10 verglichene Agenten.
- Zeitraum: der nächste abgeschlossene Meilenstein mit mindestens 10 verglichenen Agenten, höchstens 3 Sessions.
- Rückfall: Handbuch 1.0, Abschnitt „Briefing-Standard“ und `templates/briefing.md` im Stand von 723aaee (`git show 723aaee:docs/studio/STUDIO.md`); Richtwert-Datei entfernen.
- Dateien: `docs/studio/STUDIO.md` (Briefing-Standard: ein Satz „Schätzung aus Richtwerten, nicht Menschenzeit“), `docs/studio/templates/briefing.md` (Hinweis an der Kopfzeile), neu `docs/studio/metriken/richtwerte.md` (Tabelle Rolle × Plan-Art: Median Minuten und Tools), `docs/studio/CHANGELOG.md`
- Ruling: R54
- Start: Handbuch 1.1
- Bewertung: Vorschlag des Coaches (Retro M5, `retros/2026-09-30-meilenstein-m5.md` B2): Schwelle verfehlt (Minuten −77,9 %, Werkzeugaufrufe +60,5 %, 20 Agenten), aber Behandlung kaum angewendet (4 von 107 Briefings) → `angepasst`: Hauptgrösse Werkzeugaufrufe, Schwelle ±50 % über mindestens 10 Agenten in M6, Kopfzeile nennt die Richtwert-Zeile; Status bis zum Ruling von L0 unverändert `laufend`

## E-002 · laufend · Datei-Eigentum bei parallelen L0-Sessions

- Hypothese: Wenn parallele L0-Sessions geteilte Studio-Dateien (u. a. `tools/studio/model.py`, `tools/studio/hook.py`, `tools/studio/dashboard/`, Handbuch) beim Start in `docs/studio/state.md` einer Session zuordnen und die andere Session gegen fremde Dateien erst nach deren Merge plant (R43 als Regel), dann entfallen Plan-Nachführungen und Zusatz-Tasks wegen Basis-Drift.
- Messgrösse: In der nächsten Episode mit zwei gleichzeitig laufenden L0-Sessions (erkennbar an überlappenden Lebenszeiten zweier L0-Sessions in `.studio/events.jsonl`; die Kopfzahl „Sessions“ der Meilenstein-Metrik ist bis zum Fix aus Retro Studio-Graph B3 nicht belastbar) gibt es 0 Rulings, BEDENKEN oder Zusatz-Tasks mit Anlass „Basis-Drift“ bzw. „Nachführen gegen main“ (Zählung in `docs/studio/rulings.md` und Gate-Berichten). Ausgangswert Studio-Graph: 2 Nachführungen und 1 Zusatz-Task (R43, R52).
- Zeitraum: die nächsten 2 Episoden mit parallelen L0-Sessions; ohne solche Episode bis Ende M6 offen halten, dann `weiter beobachten` oder `zurückgenommen` mangels Daten.
- Rückfall: Handbuch 1.0, Abschnitt „Session-Start und -Ende“ im Stand von 723aaee; `state.md` ohne Abschnitt „Parallele Sessions“.
- Dateien: `docs/studio/STUDIO.md` (Session-Start: Schritt „andere L0-Session aktiv → Datei-Eigentum und Merge-Reihenfolge in state.md eintragen oder übernehmen“), `docs/studio/state.md` (Abschnitt „Parallele Sessions“), `docs/studio/CHANGELOG.md`
- Ruling: R55
- Start: Handbuch 1.2
- Bewertung: Zwischenstand (Retro M5 B8): 1 von 2 Episoden (baff17bb und 25e8352d, rund 4,5 h parallel), 0 Basis-Drift-Rulings seit R55 → weiter beobachten

## E-003 · vorgeschlagen · Zweck-Gegenprobe bei Auslegungen

- Hypothese: Wenn L0 bei jeder Auslegung einer Nutzeranweisung (Autonomie, Schritt 2) im Ruling einen Satz „Zweck der Anweisung: …; Auslegung widerspricht ihm nicht, weil …“ festhält, dann werden Auslegungen, die dem erklärten Zweck widersprechen, vor der Umsetzung erkannt, und Korrektur-Rulings wegen Fehlauslegung entfallen.
- Messgrösse: Anzahl Rulings, die ein früheres Auslegungs-Ruling wegen Fehlauslegung korrigieren (Stichwort „Korrektur von R…“ in `docs/studio/rulings.md`), in den nächsten 3 Sessions: höchstens 0. Ausgangswert: 2 in Session 2bf010b4 (R69 korrigiert R68, R71 korrigiert R69).
- Zeitraum: die nächsten 3 Sessions mit mindestens einer Nutzeranweisung, die ausgelegt werden muss; Freigabe der Stellenzahl erst wenn E-001 oder E-002 bewertet ist (höchstens 3 laufende Experimente).
- Rückfall: Handbuch 1.6, Abschnitt „Autonomie“ ohne den Zusatz (`git show fa58e4b:docs/studio/STUDIO.md`).
- Dateien: `docs/studio/STUDIO.md` (Abschnitt „Autonomie“, Ablauf Schritt 2: ein Halbsatz), `docs/studio/CHANGELOG.md`
- Ruling: –
- Start: –
- Bewertung: –
