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
- Messgrösse (ab Handbuch 1.7, R75): In der Meilenstein-Metrik (`metriken/<id>.md`, Abschnitt „Schätzung gegen Ist“) liegt die Abweichung der **Werkzeugaufrufe** bei höchstens ±50 %, über mindestens 10 verglichene Agenten; die Minuten werden nur berichtet, nicht bewertet. Anwendung prüfbar: Anteil der Briefings mit Kopfzeile „Tabellenzeile“ (Zählung in `.studio/archiv/briefings/`) wird mitberichtet; unter 50 % gilt die Stufe als nicht angewendet und wird nicht bewertet. Vorher (Handbuch 1.1 bis 1.6): Minuten und Werkzeugaufrufe je höchstens ±50 %.
- Zeitraum: M6 und M7 zusammen, bis mindestens 10 verglichene Agenten mit Tabellenzeile vorliegen; Bewertung in der Retro des Meilensteins, in dem die Zahl erreicht ist.
- Rückfall: Handbuch 1.0, Abschnitt „Briefing-Standard“ und `templates/briefing.md` im Stand von 723aaee (`git show 723aaee:docs/studio/STUDIO.md`); Richtwert-Datei entfernen. Nur die Anpassung zurücknehmen: Briefing-Standard und `templates/briefing.md` im Stand von Handbuch 1.6 (`git show fa58e4b:docs/studio/STUDIO.md`).
- Dateien: `docs/studio/STUDIO.md` (Briefing-Standard: Hauptgrösse Tools, Minuten abgeleitet, Kopfzeile nennt Tabellenzeile), `docs/studio/templates/briefing.md` (Kopfzeile und Beispiel), `docs/studio/metriken/richtwerte.md` (Tabelle Rolle × Modell × Plan-Art: Median Minuten und Tools), `docs/studio/CHANGELOG.md`
- Ruling: R54, angepasst R75
- Start: Handbuch 1.1, angepasst Handbuch 1.7
- Bewertung: Stufe 1 (Retro M5, `retros/2026-09-30-meilenstein-m5.md` B2): Schwelle verfehlt (Minuten −77,9 %, Werkzeugaufrufe +60,5 %, 20 Agenten), Behandlung kaum angewendet (4 von 107 Briefings) → `angepasst` per R75 (Hauptgrösse Werkzeugaufrufe, Kopfzeile nennt Tabellenzeile); läuft als Stufe 2 weiter, deshalb Status `laufend`. Zwischenstand Session 664ac8d3 (`retros/2026-09-30-session-664ac8d3.md` B2, B3): Anwendung 9 von 15 Starts seit 1.7 (60 %); Werkzeugaufrufe +68 % über 10 Agenten, davon 9 fortgesetzt (+91 %); Vorschlag Messregel für Folgeaufträge, Ruling offen. Zwischenstand Session 5e248230 (`retros/2026-10-01-session-5e248230.md` B7): Werkzeugaufrufe −23,1 % und Minuten +11,7 % über 44 Agenten, Tabellenzeile in 40 von 45 Briefings → weiter beobachten, Bewertung Retro M7

## E-002 · laufend · Datei-Eigentum bei parallelen L0-Sessions

- Hypothese: Wenn parallele L0-Sessions geteilte Studio-Dateien (u. a. `tools/studio/model.py`, `tools/studio/hook.py`, `tools/studio/dashboard/`, Handbuch) beim Start in `docs/studio/state.md` einer Session zuordnen und die andere Session gegen fremde Dateien erst nach deren Merge plant (R43 als Regel), dann entfallen Plan-Nachführungen und Zusatz-Tasks wegen Basis-Drift.
- Messgrösse: In der nächsten Episode mit zwei gleichzeitig laufenden L0-Sessions (erkennbar an überlappenden Lebenszeiten zweier L0-Sessions in `.studio/events.jsonl`; die Kopfzahl „Sessions“ der Meilenstein-Metrik ist bis zum Fix aus Retro Studio-Graph B3 nicht belastbar) gibt es 0 Rulings, BEDENKEN oder Zusatz-Tasks mit Anlass „Basis-Drift“ bzw. „Nachführen gegen main“ (Zählung in `docs/studio/rulings.md` und Gate-Berichten). Ausgangswert Studio-Graph: 2 Nachführungen und 1 Zusatz-Task (R43, R52).
- Zeitraum: die nächsten 2 Episoden mit parallelen L0-Sessions; ohne solche Episode bis Ende M6 offen halten, dann `weiter beobachten` oder `zurückgenommen` mangels Daten.
- Rückfall: Handbuch 1.0, Abschnitt „Session-Start und -Ende“ im Stand von 723aaee; `state.md` ohne Abschnitt „Parallele Sessions“.
- Dateien: `docs/studio/STUDIO.md` (Session-Start: Schritt „andere L0-Session aktiv → Datei-Eigentum und Merge-Reihenfolge in state.md eintragen oder übernehmen“), `docs/studio/state.md` (Abschnitt „Parallele Sessions“), `docs/studio/CHANGELOG.md`
- Ruling: R55
- Start: Handbuch 1.2
- Bewertung: Zwischenstand (Retro M5 B8): 1 von 2 Episoden (baff17bb und 25e8352d, rund 4,5 h parallel), 0 Basis-Drift-Rulings seit R55 → weiter beobachten; Session 5e248230: keine parallele Episode, 0 Basis-Drift-Rulings in R91–R105 → weiter beobachten

## E-003 · laufend · Zweck-Gegenprobe bei Auslegungen

- Hypothese: Wenn L0 bei jeder Auslegung einer Nutzeranweisung (Autonomie, Schritt 2) im Ruling einen Satz „Zweck der Anweisung: …; Auslegung widerspricht ihm nicht, weil …“ festhält, dann werden Auslegungen, die dem erklärten Zweck widersprechen, vor der Umsetzung erkannt, und Korrektur-Rulings wegen Fehlauslegung entfallen.
- Messgrösse: Anzahl Rulings, die ein früheres Auslegungs-Ruling wegen Fehlauslegung korrigieren (Stichwort „Korrektur von R…“ in `docs/studio/rulings.md`), in den nächsten 3 Sessions: höchstens 0. Ausgangswert: 2 in Session 2bf010b4 (R69 korrigiert R68, R71 korrigiert R69).
- Zeitraum: die nächsten 3 Sessions ab Handbuch 1.7 mit mindestens einer Nutzeranweisung, die ausgelegt werden muss (Ruling mit „Auslegung“); ohne solche Session bis Ende M7 offen halten, dann `weiter beobachten` oder `zurückgenommen` mangels Daten. Nebenbei gezählt: Anteil der Auslegungs-Rulings mit Satz „Zweck der Anweisung“ (Anwendung).
- Rückfall: Handbuch 1.6, Abschnitt „Autonomie“ ohne den Zusatz (`git show fa58e4b:docs/studio/STUDIO.md`).
- Dateien: `docs/studio/STUDIO.md` (Abschnitt „Autonomie“, Ablauf Schritt 2: ein Halbsatz), `docs/studio/CHANGELOG.md`
- Ruling: R75
- Start: Handbuch 1.7
- Bewertung: Zwischenstand Session 5e248230 (`retros/2026-10-01-session-5e248230.md`, Session 1 von 3): Anwendung 2/2 (R91, R105), 0 Korrekturen wegen Fehlauslegung (R97 berichtigt eine Rechnung, keine Auslegung) → weiter beobachten

## E-004 · vorgeschlagen · Rechenweg im Budget-Ruling

- Hypothese: Wenn L0 im Budget-Ruling je Lead-Anteil den Rechenweg nennt (Eigenwert × Faktor = Rohwert → gerundeter Anteil; Budget = Summe der Anteile) statt nur der Zahlen, dann fallen Rechenfehler beim Schreiben auf, und Korrektur-Rulings zum Budget entfallen.
- Messgrösse: Rulings, die eine Budgetzahl eines früheren Rulings berichtigen (Zählung in `docs/studio/rulings.md`), in den nächsten 3 Gate-Plan-Rulings mit Budget: 0. Ausgangswert: 2 (Rundungsfehler in R88 laut R97; R96 → R97). Nebenbei gezählt: Anteil der Budget-Rulings mit Rechenweg (Anwendung).
- Zeitraum: die nächsten 3 Gate-Plan-Rulings mit Budget.
- Rückfall: Handbuch in der Version vor der Umsetzung, Budget-Abschnitt ohne den Satz zum Rechenweg.
- Dateien: `docs/studio/STUDIO.md` (Budget-Abschnitt, ein Satz), `docs/studio/CHANGELOG.md`
- Ruling: – (offen)
- Start: erst, wenn ein Platz frei wird (höchstens 3 laufend; frühestens nach der Bewertung von E-001 in der Retro M7)
- Bewertung: –
