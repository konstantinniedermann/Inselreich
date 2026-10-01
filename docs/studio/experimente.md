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
- Bewertung: Stufe 1 (Retro M5, `retros/2026-09-30-meilenstein-m5.md` B2): Schwelle verfehlt (Minuten −77,9 %, Werkzeugaufrufe +60,5 %, 20 Agenten), Behandlung kaum angewendet (4 von 107 Briefings) → `angepasst` per R75 (Hauptgrösse Werkzeugaufrufe, Kopfzeile nennt Tabellenzeile); läuft als Stufe 2 weiter, deshalb Status `laufend`. Zwischenstand Session 664ac8d3 (`retros/2026-09-30-session-664ac8d3.md` B2, B3): Anwendung 9 von 15 Starts seit 1.7 (60 %); Werkzeugaufrufe +68 % über 10 Agenten, davon 9 fortgesetzt (+91 %); Vorschlag Messregel für Folgeaufträge, Ruling offen. Zwischenstand Session 5e248230 (`retros/2026-10-01-session-5e248230.md` B7): Werkzeugaufrufe −23,1 % und Minuten +11,7 % über 44 Agenten, Tabellenzeile in 40 von 45 Briefings → weiter beobachten, Bewertung Retro M7. **Bewertung Retro M7** (`retros/2026-10-01-meilenstein-m7.md` B4): Werkzeugaufrufe −0,3 % (1813 → 1807) über 43 Agenten, Schwelle ±50 % erreicht; Minuten +33,0 % (nur berichtet); Anwendung 42 von 60 M7-Briefings (70 %) → Empfehlung `behalten`, Ruling offen; Richtwerte nachgeeicht (`metriken/richtwerte.md`, „Nacheichung M7“)

## E-002 · laufend · Datei-Eigentum bei parallelen L0-Sessions

- Hypothese: Wenn parallele L0-Sessions geteilte Studio-Dateien (u. a. `tools/studio/model.py`, `tools/studio/hook.py`, `tools/studio/dashboard/`, Handbuch) beim Start in `docs/studio/state.md` einer Session zuordnen und die andere Session gegen fremde Dateien erst nach deren Merge plant (R43 als Regel), dann entfallen Plan-Nachführungen und Zusatz-Tasks wegen Basis-Drift.
- Messgrösse: In der nächsten Episode mit zwei gleichzeitig laufenden L0-Sessions (erkennbar an überlappenden Lebenszeiten zweier L0-Sessions in `.studio/events.jsonl`; die Kopfzahl „Sessions“ der Meilenstein-Metrik ist bis zum Fix aus Retro Studio-Graph B3 nicht belastbar) gibt es 0 Rulings, BEDENKEN oder Zusatz-Tasks mit Anlass „Basis-Drift“ bzw. „Nachführen gegen main“ (Zählung in `docs/studio/rulings.md` und Gate-Berichten). Ausgangswert Studio-Graph: 2 Nachführungen und 1 Zusatz-Task (R43, R52).
- Zeitraum: die nächsten 2 Episoden mit parallelen L0-Sessions; ohne solche Episode bis Ende M6 offen halten, dann `weiter beobachten` oder `zurückgenommen` mangels Daten.
- Rückfall: Handbuch 1.0, Abschnitt „Session-Start und -Ende“ im Stand von 723aaee; `state.md` ohne Abschnitt „Parallele Sessions“.
- Dateien: `docs/studio/STUDIO.md` (Session-Start: Schritt „andere L0-Session aktiv → Datei-Eigentum und Merge-Reihenfolge in state.md eintragen oder übernehmen“), `docs/studio/state.md` (Abschnitt „Parallele Sessions“), `docs/studio/CHANGELOG.md`
- Ruling: R55
- Start: Handbuch 1.2
- Bewertung: Zwischenstand (Retro M5 B8): 1 von 2 Episoden (baff17bb und 25e8352d, rund 4,5 h parallel), 0 Basis-Drift-Rulings seit R55 → weiter beobachten; Session 5e248230: keine parallele Episode, 0 Basis-Drift-Rulings in R91–R105 → weiter beobachten; Cloud-Session ddd9a9ac (`retros/2026-10-01-session-ddd9a9ac.md` B4): zweite Episode, 0 Basis-Drift-Rulings, aber Nummernkollision R107/R118 und Revert (nicht abgedeckte Klasse) → weiter beobachten bis Retro M7, Messregel um Ruling-Nummern ergänzen vorgeschlagen. **Bewertung Retro M7** (`retros/2026-10-01-meilenstein-m7.md` B1): Zeitraum erreicht (2 Episoden), Basis-Drift-Rulings 0 in beiden → Schwelle formal erfüllt; der Schaden der 2. Episode lag ausserhalb der Messregel (2 Nummernkollisionen, 4 Pakete neu umgesetzt, 1 Welle auf veraltetem Stand), Eintrag in „Parallele Sessions“ kam zu spät → Empfehlung `angepasst` über E-005 (übernimmt den Platz), Ruling offen

## E-003 · laufend · Zweck-Gegenprobe bei Auslegungen

- Hypothese: Wenn L0 bei jeder Auslegung einer Nutzeranweisung (Autonomie, Schritt 2) im Ruling einen Satz „Zweck der Anweisung: …; Auslegung widerspricht ihm nicht, weil …“ festhält, dann werden Auslegungen, die dem erklärten Zweck widersprechen, vor der Umsetzung erkannt, und Korrektur-Rulings wegen Fehlauslegung entfallen.
- Messgrösse: Anzahl Rulings, die ein früheres Auslegungs-Ruling wegen Fehlauslegung korrigieren (Stichwort „Korrektur von R…“ in `docs/studio/rulings.md`), in den nächsten 3 Sessions: höchstens 0. Ausgangswert: 2 in Session 2bf010b4 (R69 korrigiert R68, R71 korrigiert R69).
- Zeitraum: die nächsten 3 Sessions ab Handbuch 1.7 mit mindestens einer Nutzeranweisung, die ausgelegt werden muss (Ruling mit „Auslegung“); ohne solche Session bis Ende M7 offen halten, dann `weiter beobachten` oder `zurückgenommen` mangels Daten. Nebenbei gezählt: Anteil der Auslegungs-Rulings mit Satz „Zweck der Anweisung“ (Anwendung).
- Rückfall: Handbuch 1.6, Abschnitt „Autonomie“ ohne den Zusatz (`git show fa58e4b:docs/studio/STUDIO.md`).
- Dateien: `docs/studio/STUDIO.md` (Abschnitt „Autonomie“, Ablauf Schritt 2: ein Halbsatz), `docs/studio/CHANGELOG.md`
- Ruling: R75
- Start: Handbuch 1.7
- Bewertung: Zwischenstand Session 5e248230 (`retros/2026-10-01-session-5e248230.md`, Session 1 von 3): Anwendung 2/2 (R91, R105), 0 Korrekturen wegen Fehlauslegung (R97 berichtigt eine Rechnung, keine Auslegung) → weiter beobachten; Session ddd9a9ac (`retros/2026-10-01-session-ddd9a9ac.md`, Session 2 von 3): Anwendung 1 von 2 (R118 ja, R107 (3) nein), 0 Korrekturen wegen Fehlauslegung (R115 korrigiert ein L0-Briefing) → weiter beobachten; Retro M7: 2 von 3 Sessions (5e248230 mit R91, R105, R118 je mit Zweck-Satz; ddd9a9ac R107 (3) ohne), 0 Korrekturen wegen Fehlauslegung (R119 überholt R118 wegen neuer Lage, R117 betrifft eine Spec-Auslegung) → weiter beobachten, eine Session fehlt

## E-004 · vorgeschlagen · Rechenweg im Budget-Ruling

- Hypothese: Wenn L0 im Budget-Ruling je Lead-Anteil den Rechenweg nennt (Eigenwert × Faktor = Rohwert → gerundeter Anteil; Budget = Summe der Anteile) statt nur der Zahlen, dann fallen Rechenfehler beim Schreiben auf, und Korrektur-Rulings zum Budget entfallen.
- Messgrösse: Rulings, die eine Budgetzahl eines früheren Rulings berichtigen (Zählung in `docs/studio/rulings.md`), in den nächsten 3 Gate-Plan-Rulings mit Budget: 0. Ausgangswert: 2 (Rundungsfehler in R88 laut R97; R96 → R97). Nebenbei gezählt: Anteil der Budget-Rulings mit Rechenweg (Anwendung).
- Zeitraum: die nächsten 3 Gate-Plan-Rulings mit Budget.
- Rückfall: Handbuch in der Version vor der Umsetzung, Budget-Abschnitt ohne den Satz zum Rechenweg.
- Dateien: `docs/studio/STUDIO.md` (Budget-Abschnitt, ein Satz), `docs/studio/CHANGELOG.md`
- Ruling: R106 (1) (angenommen, Start bei freiem Platz)
- Start: Platz frei, sobald L0 „E-001 behalten“ bestätigt (Retro M7); Umsetzung durch den Coach nach dem Ruling, erster Prüffall Budget-Ruling Gate Plan M7-UX (R122 (4))
- Bewertung: –

## E-005 · vorgeschlagen · Abstimmung paralleler L0-Sessions über origin (Stufe 2 von E-002)

- Hypothese: Wenn jede L0-Session vor ihrem ersten Ruling `git fetch` ausführt und ihren Eintrag in „Parallele Sessions“ (`state.md`) auf `main` pusht, vor jedem Ruling die nächste freie R-Nummer gegen `origin/main` prüft und Strang-Branches nach jeder Abnahme pusht (R107 als Handbuchregel), dann entfallen in Episoden paralleler L0-Sessions Nummernkollisionen, verlorene Arbeit und Wellen auf veraltetem Stand.
- Messgrösse: In der nächsten Episode paralleler L0-Sessions (überlappende Lebenszeiten in `.studio/events.jsonl` oder zwei aktive Zeilen in „Parallele Sessions“) 0 Ereignisse der Klassen (a) Ruling-Nummernkollision, (b) Paket neu umgesetzt wegen ungepushtem Branch, (c) Welle oder Paket wegen veraltetem Stand gestoppt oder überholt, (d) Ruling mit Anlass „Basis-Drift“/„Nachführen gegen main“ (Zählung in `docs/studio/rulings.md`). Ausgangswert Episode M7: (a) 2, (b) 4 Pakete, (c) 1, (d) 0. Nebenbei: Anwendung = Eintrag der zweiten Session in „Parallele Sessions“ auf `origin/main` vor ihrem ersten Ruling (ja/nein).
- Zeitraum: die nächste Episode paralleler L0-Sessions; ohne Episode bis Ende M8 offen halten, dann `weiter beobachten` oder `zurückgenommen` mangels Daten.
- Rückfall: Handbuch in der Version vor der Umsetzung, Abschnitt „Session-Start und -Ende“ im Stand von E-002 (Handbuch 1.2, R55); die Push-Pflicht gilt dann weiter als Ruling R107.
- Dateien: `docs/studio/STUDIO.md` (Session-Start: Schritte `git fetch` und Push des Eintrags vor dem ersten Ruling; Rulings: Nummer gegen `origin/main`; Push-Pflicht für Strang-Branches), `docs/studio/state.md` (Abschnitt „Parallele Sessions“: Hinweis „Eintrag vor dem ersten Ruling pushen“), `docs/studio/CHANGELOG.md`
- Ruling: – (offen)
- Start: übernimmt den Platz von E-002, sobald L0 „E-002 angepasst“ bestätigt
- Bewertung: –

## E-006 · vorgeschlagen · Exklusive Arbeitsbäume

- Hypothese: Wenn das Handbuch das Eigentum an Arbeitsbäumen festlegt — Hauptcheckout gehört L0 (Studio-Dateien) und während eines Merge-Fensters nur dem Integrator; Leads und Arbeiter committen nur in eigenen Worktrees oder Branches; QA-Bäume und Scratchpad-Unterordner gehören exklusiv dem jeweiligen Check; nur `git pull --ff-only`, kein bares `git stash` — und der Integrator laut Persona HEAD unmittelbar vor dem Merge und vor dem Push prüft, dann entfallen Vorfälle durch fremde Schreibzugriffe auf geteilte Arbeitsbäume.
- Messgrösse: Vorfälle „fremder Schreibzugriff auf geteilten Arbeitsbaum“ (Zählung in `docs/studio/rulings.md`, Integrator- und QA-Berichten unter `.studio/archiv/berichte/` und `docs/beobachtungen.md`) bis Ende M8: 0. Ausgangswert M7: 6 (Probe-Revert auf main, QA-Baum `ui-qa` umgestellt R116, `lib.mjs` im Scratchpad R111, bares `git stash` bei fünf Worktrees, Lead-Commit im Hauptcheckout im Merge-Fenster, `pull --rebase` R124). Nebenbei: Anteil der Merge-Berichte mit HEAD-Prüfung vor Merge und vor Push (Anwendung).
- Zeitraum: bis Ende M8 (M7-UX eingeschlossen).
- Rückfall: Handbuch und `.claude/agents/production-integrator.md` in der Version vor der Umsetzung; R124 (2) gilt dann weiter als Ruling.
- Dateien: `docs/studio/STUDIO.md` (Abschnitt zu Branches/Merges: Eigentum der Arbeitsbäume), `.claude/agents/production-integrator.md` (HEAD-Prüfung vor Merge und Push, Persona Minor), `docs/studio/templates/briefing.md` (Zeile „Arbeitsbaum:“), `docs/studio/CHANGELOG.md`
- Ruling: – (offen)
- Start: erst, wenn ein Platz frei wird (nach Abschluss von E-003); bis dahin gilt R124 (2) als Ruling und steht in `lernen.md`
- Bewertung: –
