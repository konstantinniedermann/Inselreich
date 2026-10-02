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
- Bewertung: Ende M8: (a)–(c) je 0 (Ausgangswert 2/4/1); Session-Übergang 2042a460 → 58d6bc4a ohne Überlappung, einzig `2a96d607` 2 min nur lesend (M7-UX); Start-Hook-Warnung nicht umgesetzt → Empfehlung behalten, Ruling offen ([Retro M8](retros/2026-10-02-meilenstein-m8.md))

## E-008 · laufend · Ein Gate für Folgepakete

- Hypothese: Wenn Folgepakete (ein Strang, ohne Save-Format- oder Architekturänderung) Spec und Plan in einem Dokument mit einem Gate durchlaufen (`lead-tech` und `lead-qa` parallel, Zweitprüfung nur bei Blocker), dann sinken die Starts bis zum ersten Code ohne Qualitätsverlust.
- Messgrösse: Starts vom Paketstart bis zum ersten Umsetzungs-Commit (`spawn`-Events je Paket, Fortsetzungen eingerechnet) mindestens 3 unter dem Ausgangswert M7-UX (7 Starts bis zum ersten Implementierer). Gegenprobe: Erstabnahme-Quote der Umsetzung ≥ 50 % und höchstens 1 Task-Review-BEDENKEN je Paket mit Ursache „Spec- oder Plan-Lücke“.
- Zeitraum: die nächsten 2 Folgepakete, längstens bis Ende M8.
- Rückfall: `STUDIO.md` (Prozessstufen, Gate-Tabelle) und `gates.md` aus `git show 6bb5b14:docs/studio/<datei>`.
- Dateien: `docs/studio/STUDIO.md`, `docs/studio/gates.md`, `docs/studio/CHANGELOG.md`
- Ruling: R129 (2)
- Start: Handbuch 1.9
- Bewertung: Ende M8 (BUG-LICHT, H-R1, H-R2): je 2 Starts bis zum ersten Code (Schwelle ≤ 4) erfüllt; 0 BEDENKEN wegen Spec-/Plan-Lücke erfüllt; Erstabnahme 1/3 = 33 % < 50 % verfehlt (Ursachen Code-Fix H-R1, visuelle Auflage H-R2 R160, nicht die Gate-Form) → Empfehlung behalten, Ruling offen ([Retro M8](retros/2026-10-02-meilenstein-m8.md))

## E-010 · laufend · Controller-Wechsel nach der Hälfte der Tasks

- Hypothese: Wenn der Controller bei Plänen mit mehr als 6 Tasks nach dem mittleren QA-Block per Ledger an eine frische `lead-tech`-Instanz übergibt, sinkt seine Cache-Last ohne Informationsverlust (Prozess-Retro M7-UX B0, V4).
- Messgrösse: Cache-Read beider Controller je abgeschlossenem Task (`usage` je agent_id) ≤ 3,5 Mio. (M7-UX: 50,2 Mio. auf 10 Tasks). Abbruch: ein Ruling der zweiten Hälfte widerspricht der ersten (Final-Review) oder der Nachfolger fragt mehr als einmal nach.
- Zeitraum: nächster Meilenstein mit mehr als 6 Tasks.
- Rückfall: ein Controller je Meilenstein (Handbuch 1.10, Satz in Schritt 4 streichen).
- Dateien: `docs/studio/STUDIO.md` (Umsetzungszyklus), `docs/studio/CHANGELOG.md`
- Ruling: R136, Start R137
- Start: Handbuch 1.11 (Messung ab Plan M8)
- Bewertung: M-1 2,31 Mio./Task ≤ 3,5; M-2 0; M-3 4,21 Mio./Task > 3,5 (Störgrössen: Warten über 5-h-Reset, D1 und Diagnose selbst); Summe 3,02 Mio./Task (M7-UX 5,02); Abbruch nicht ausgelöst → Empfehlung angepasst: Schwelle je Controller, Übergabe vor Reset-Wartezeit, Doku delegieren, Messung M10 mit metrics.py-Zeile je Agent; Ruling offen ([Retro M8](retros/2026-10-02-meilenstein-m8.md))

## E-011 · vorgeschlagen · Rebase-Verbot in Briefing und Guard

- Hypothese: Wenn die Briefing-Vorlage im festen Regelteil „Integration nur per `merge` bzw. `git pull --ff-only`, nie Rebase“ trägt und der Guard `git pull --rebase`/`-r`/`--rebase=…` sowie `git config pull.rebase true` blockt, dann weist niemand mehr Rebase an und keiner wird ausgeführt.
- Messgrösse: über M9 und M10 0 Briefings in `.studio/archiv/briefings/` mit Rebase-Anweisung (ausgenommen Verbotssätze) und 0 ausgeführte Rebases auf geteilten Branches; Guard-Test für die vier Formen grün (Ausgangswert Session 58d6bc4a: 3 Anweisungen, 1 Ausführung; R124 (2): 1 Ausführung).
- Zeitraum: bis Ende M10.
- Rückfall: `templates/briefing.md` und `tools/studio/guard.py` im Stand vor der Umsetzung (Handbuch 1.11, `git show <commit>` im CHANGELOG).
- Dateien: `docs/studio/templates/briefing.md`, `docs/studio/CHANGELOG.md`, `docs/studio/STUDIO.md` (Version); Werkzeug-Paket lead-production: `tools/studio/guard.py`, `tools/studio/tests/`
- Ruling: –
- Start: –
- Bewertung: –

## E-012 · vorgeschlagen · Pages nur bei Spieländerungen

- Hypothese: Wenn `pages.yml` Pushes ignoriert, die nur Doku und Studio-Dateien ändern (`paths-ignore`: `docs/**`, `.superpowers/**`, `.claude/**`, `tools/studio/**`; vorher prüfen, dass nichts davon in `dist/` landet), dann sinken die Deploys stark und Spiel-Merges werden nicht mehr abgebrochen.
- Messgrösse: Pages-Läufe je Session mit `docs:`-Titel ≤ 10 % (Ausgangswert 24 von 31 = 77 %) und 0 abgebrochene Läufe zu Spiel-Merges über die nächsten 3 Sessions; Gegenprobe: jeder Merge mit `src/`, `public/` oder `index.html` hat einen grünen Pages-Lauf.
- Zeitraum: die nächsten 3 Sessions.
- Rückfall: `.github/workflows/pages.yml` ohne `paths-ignore` (Stand vor der Umsetzung).
- Dateien: `.github/workflows/pages.yml` (Paket lead-production), `docs/studio/CHANGELOG.md`
- Ruling: –
- Start: –
- Bewertung: –

## E-013 · vorgeschlagen · Budget-Log je Start, Phase gleich Paket-ID

- Hypothese: Wenn L0 jede Freigabe mit `--phase` gleich der Paket-ID loggt (je Paket eine Zeile, auch für jeden Integrator-Start), dann stimmen Dashboard-Zählung und Lead-Bericht überein.
- Messgrösse: über M9 und M10 0 Abweichungen zwischen „verbraucht“ im Lead-Bericht und der Dashboard-Zeile, 0 Starts ohne passende Freigabe (Ausgangswert Session 58d6bc4a: lead-art 6/4 statt 3/4, 1 Integrator-Start ohne Log).
- Zeitraum: bis Ende M10.
- Rückfall: Handbuch 1.11, Abschnitt „Budget-Zählung“ in `verbesserung.md`.
- Dateien: `docs/studio/verbesserung.md` (Budget-Zählung), `docs/studio/STUDIO.md` (Version), `docs/studio/CHANGELOG.md`
- Ruling: –
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

## E-009 · behalten · Rulings verweisen, Handbuch-Kern gestrafft

- Ruling: R129 (3), (4), behalten R137
- Bewertung: M7-UX: Rulings im Mittel 50 Wörter, 0 Abnahme-Rulings, `STUDIO.md` ≤ 400 Zeilen ([Retro M7-UX](retros/2026-10-02-meilenstein-m7ux.md))
