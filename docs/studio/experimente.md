# Experimente

Jede Änderung an Handbuch, Personas, Vorlagen, Budget-Heuristiken oder Dashboard-Ansichten ist ein
Experiment ([Verfassung §10](VERFASSUNG.md#10-verbesserungsprozess-grundzüge), Ablauf im Handbuch
[verbesserung.md](verbesserung.md#verbesserungsschleife)). Der `studio-coach` pflegt die Datei,
L0 entscheidet per Ruling.

**Format:** ein Abschnitt je Experiment nach [templates/experiment.md](templates/experiment.md);
abgeschlossene Experimente stehen unten mit Ruling und Bewertung in je einer Zeile.

**Status:** `vorgeschlagen` (Ruling aus oder angenommen und wartet auf Platz) → `laufend` →
`behalten`, `angepasst` (neues Ruling) oder `zurückgenommen` (Rückfall hergestellt); `abgelehnt`
heisst nie umgesetzt.

Höchstens **3** Experimente sind gleichzeitig `laufend` (geprüft von
`tools/studio/tests/test_docs.py`).

---

## E-007 · laufend · Eine aktive L0-Session je Repo

- Hypothese: Wenn standardmässig nur eine L0-Session je Repo aktiv ist und Parallelität nur per L0-Ruling mit Datei-Eigentum erlaubt wird, dann entfallen Doppelarbeit, Ruling-Nummernkollisionen und Wellen auf veraltetem Stand (Prozess-Retro 1 B2).
- Messgrösse: bis Ende M8 0 min Überlappung zweier L0-Sessions ohne Ausnahme-Ruling (überlappende Lebenszeiten in `.studio/events.jsonl`) und 0 Ereignisse der Klassen (a) Nummernkollision, (b) Paket neu umgesetzt, (c) Welle auf veraltetem Stand (Ausgangswert M7: 2, 4, 1). Anwendung nach dem Werkzeug-Paket: Test belegt den Warnblock.
- Zeitraum: bis Ende M8.
- Rückfall: Absatz „Parallele L0-Sessions“ und E-005 aus `git show 6bb5b14:docs/studio/<datei>` (Handbuch 1.8).
- Dateien: `docs/studio/STUDIO.md` (Session-Start), `docs/studio/lernen.md`, `docs/studio/CHANGELOG.md`; Folgepaket lead-production: `tools/studio/context.py` (Warnblock) mit Test
- Ruling: R129 (1)
- Start: Handbuch 1.9 (Regel); Start-Hook-Warnung folgt als Werkzeug-Paket
- Bewertung: Zwischenstand M7-UX: (a)–(c) je 0; Session `2a96d607` 2 min parallel, nur lesend ([Retro M7-UX](retros/2026-10-02-meilenstein-m7ux.md))

## E-008 · laufend · Ein Gate für Folgepakete

- Hypothese: Wenn Folgepakete (ein Strang, ohne Save-Format- oder Architekturänderung) Spec und Plan in einem Dokument mit einem Gate durchlaufen (`lead-tech` und `lead-qa` parallel, Zweitprüfung nur bei Blocker), dann sinken die Starts bis zum ersten Code ohne Qualitätsverlust.
- Messgrösse: Starts vom Paketstart bis zum ersten Umsetzungs-Commit (`spawn`-Events je Paket, Fortsetzungen eingerechnet) mindestens 3 unter dem Ausgangswert M7-UX (7 Starts bis zum ersten Implementierer). Gegenprobe: Erstabnahme-Quote der Umsetzung ≥ 50 % und höchstens 1 Task-Review-BEDENKEN je Paket mit Ursache „Spec- oder Plan-Lücke“.
- Zeitraum: die nächsten 2 Folgepakete, längstens bis Ende M8.
- Rückfall: `STUDIO.md` (Prozessstufen, Gate-Tabelle) und `gates.md` aus `git show 6bb5b14:docs/studio/<datei>`.
- Dateien: `docs/studio/STUDIO.md`, `docs/studio/gates.md`, `docs/studio/CHANGELOG.md`
- Ruling: R129 (2)
- Start: Handbuch 1.9
- Bewertung: Zwischenstand M7-UX: noch kein Folgepaket (PAGES-LIMIT war Nutzerauftrag)

## E-009 · laufend · Rulings verweisen, Handbuch-Kern gestrafft

- Hypothese: Wenn Rulings nur entscheiden und verweisen (≤ 60 Wörter, keine Abnahme-Rulings), R1–R99 im Archiv liegen und `STUDIO.md` auf einen Kern ≤ 400 Zeilen gestrafft ist, dann sinken Ruling-Text, Doppelwahrheiten und Lese-Kontext je Delegation.
- Messgrösse: im nächsten Meilenstein Mittel ≤ 80 Wörter je Ruling und 0 reine Abnahme-Rulings; `STUDIO.md` ≤ 400 Zeilen, `experimente.md` ≤ 900 Wörter. Gegenprobe: 0 Retro-Befunde „Information fehlte im Ruling“. Nur berichtet: Cache-Write-Tokens je Delegation gegen M7 (≈ 305 000).
- Zeitraum: nächster Meilenstein (M8).
- Rückfall: die genannten Dateien aus `git show 6bb5b14:docs/studio/<datei>`; `verbesserung.md` und `rulings-archiv.md` entfernen.
- Dateien: unter `docs/studio/`: `STUDIO.md`, `verbesserung.md`, `rulings.md`, `rulings-archiv.md`, `templates/ruling.md`, `roster.md`, `experimente.md`, `CHANGELOG.md`
- Ruling: R129 (3), (4)
- Start: Handbuch 1.9
- Bewertung: Zwischenstand M7-UX: Schwellen erfüllt (R130–R136 Mittel 50 Wörter, 0 Abnahme-Rulings, `STUDIO.md` 398 Zeilen; Cache-Write je Delegation ≈ 155 000)

## E-010 · vorgeschlagen · Controller-Wechsel nach der Hälfte der Tasks

- Hypothese: Wenn der Controller bei Plänen mit mehr als 6 Tasks nach dem mittleren QA-Block per Ledger an eine frische `lead-tech`-Instanz übergibt, sinkt seine Cache-Last ohne Informationsverlust (Prozess-Retro M7-UX B0, V4).
- Messgrösse: Cache-Read beider Controller je abgeschlossenem Task (`usage` je agent_id) ≤ 3,5 Mio. (M7-UX: 50,2 Mio. auf 10 Tasks). Abbruch: ein Ruling der zweiten Hälfte widerspricht der ersten (Final-Review) oder der Nachfolger fragt mehr als einmal nach.
- Zeitraum: nächster Meilenstein mit mehr als 6 Tasks.
- Rückfall: ein Controller je Meilenstein (Handbuch 1.10).
- Dateien: `docs/studio/STUDIO.md` (Umsetzungszyklus), `docs/studio/CHANGELOG.md`
- Ruling: R136 (angenommen, Start bei freiem Platz)
- Start: –
- Bewertung: –

## E-006 · vorgeschlagen · Exklusive Arbeitsbäume

- Hypothese: Wenn das Handbuch das Eigentum an Arbeitsbäumen festlegt (Hauptcheckout L0, im Merge-Fenster der Integrator; sonst nur eigene Worktrees; HEAD-Prüfung vor Merge und Push), entfallen Vorfälle durch fremde Schreibzugriffe.
- Messgrösse: Vorfälle „fremder Schreibzugriff auf geteilten Arbeitsbaum“ bis Ende M8: 0 (Ausgangswert M7: 6, [Retro M7](retros/2026-10-01-meilenstein-m7.md)).
- Zeitraum: bis Ende M8 (M7-UX eingeschlossen).
- Rückfall: Handbuch und `.claude/agents/production-integrator.md` vor der Umsetzung; R124 (2) gilt weiter.
- Dateien: `docs/studio/STUDIO.md`, `.claude/agents/production-integrator.md`, `docs/studio/templates/briefing.md`, `docs/studio/CHANGELOG.md`
- Ruling: R126 (angenommen, Start bei freiem Platz; R129)
- Start: –
- Bewertung: Zwischenstand M7-UX: 0 Vorfälle bei drei Worktrees (Prozess-Retro M7-UX B5)

## Abgeschlossen

Verlauf und Zwischenstände stehen in den verlinkten Retros; frühere Fassungen in Git
(`git show 6bb5b14:docs/studio/experimente.md`).

## E-001 · behalten · Schätzung aus Richtwerten statt Menschenzeit

- Ruling: R54, angepasst R75, behalten R126
- Bewertung: Werkzeugaufrufe −0,3 % über 43 Agenten, Schwelle ±50 % erreicht ([Retro M7](retros/2026-10-01-meilenstein-m7.md) B4)

## E-002 · angepasst · Datei-Eigentum bei parallelen L0-Sessions

- Ruling: R55, angepasst R126 (→ E-005)
- Bewertung: Schwelle formal erfüllt, Schaden lag ausserhalb der Messregel ([Retro M7](retros/2026-10-01-meilenstein-m7.md) B1)

## E-003 · behalten · Zweck-Gegenprobe bei Auslegungen

- Ruling: R75, behalten R129
- Bewertung: 3 von 3 Sessions, 0 Korrekturen wegen Fehlauslegung ([Prozess-Retro 1](retros/2026-10-01-prozess-retro-1.md))

## E-004 · abgelehnt · Rechenweg im Budget-Ruling

- Ruling: R106 (1), abgelehnt R129 vor dem ersten Prüffall
- Bewertung: misst nur eine Schreibweise und verlängert Rulings ([Prozess-Retro 1](retros/2026-10-01-prozess-retro-1.md) B7)

## E-005 · angepasst · Abstimmung paralleler L0-Sessions über origin

- Ruling: R126, ersetzt durch R129 (1) (→ E-007); nie als eigene Stufe umgesetzt
- Bewertung: Die Schritte gelten nur bei per Ruling erlaubter Parallelität (Handbuch, Session-Start)
