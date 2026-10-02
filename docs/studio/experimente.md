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

## E-010 · laufend · Controller-Wechsel nach der Hälfte der Tasks

- Hypothese: Wenn der Controller bei Plänen mit mehr als 6 Tasks nach dem mittleren QA-Block und vor einer Wartezeit über einen 5-h-Reset per Ledger an eine frische `lead-tech`-Instanz übergibt und Doku-Pakete delegiert, bleibt die Cache-Last jedes Controllers niedrig, ohne Informationsverlust (Prozess-Retro M7-UX B0, V4; Retro M8).
- Messgrösse: Cache-Read **je Controller** je abgeschlossenem Task ≤ 3,5 Mio. (Tabelle „Tokens je Agent“ aus metrics.py, sonst Transkript je agent_id; M7-UX: 5,02 Mio., M8: 2,31 und 4,21 Mio.). Abbruch: ein Ruling der zweiten Hälfte widerspricht der ersten (Final-Review) oder der Nachfolger fragt mehr als einmal nach.
- Zeitraum: M10.
- Rückfall: ein Controller je Meilenstein (Handbuch 1.10, Satz in Schritt 4 streichen); Fassung 1.11: `git show c1e0fa4:docs/studio/STUDIO.md`.
- Dateien: `docs/studio/STUDIO.md` (Umsetzungszyklus), `docs/studio/CHANGELOG.md`; Werkzeug-Paket lead-production: `tools/studio/metrics.py` (Tokens je Agent)
- Ruling: R136, Start R137, angepasst R166
- Start: Handbuch 1.11 (Messung M8), angepasst Handbuch 1.12 (Messung M10)
- Bewertung: M8 (Fassung 1.11): M-1 2,31 Mio./Task, M-2 0, M-3 4,21 Mio./Task (Störgrössen: Warten über 5-h-Reset, D1 und Diagnose selbst); Summe 3,02 Mio./Task; Abbruch nicht ausgelöst → angepasst R166 ([Retro M8](retros/2026-10-02-meilenstein-m8.md))

## E-011 · laufend · Rebase-Verbot in der Briefing-Vorlage

- Hypothese: Wenn die Briefing-Vorlage direkt nach den festen Regeln die Zeile „Git: kein Rebase (auch kein `pull --rebase`), kein reset --hard, kein Force-Push; main per Merge holen“ trägt, dann weist niemand mehr Rebase an und keiner wird ausgeführt.
- Messgrösse: über M9 und M10 0 Briefings und Pläne mit Rebase-Anweisung (`.studio/archiv/briefings/`, `docs/superpowers/plans/`; Verbotssätze ausgenommen) und 0 ausgeführte Rebases auf geteilten Branches (Ausgangswert Session 58d6bc4a: 3 Anweisungen, 1 Ausführung; R124 (2): 1 Ausführung).
- Zeitraum: bis Ende M10.
- Rückfall: `docs/studio/templates/briefing.md` ohne Git-Zeile (`git show c1e0fa4:docs/studio/templates/briefing.md`, Handbuch 1.11).
- Dateien: `docs/studio/templates/briefing.md`, `docs/studio/STUDIO.md` (Version), `docs/studio/CHANGELOG.md`. Guard-Teil (`git pull --rebase`, `-r`, `pull.rebase true` blocken) braucht die Nutzerfreigabe: [Warteschlange N-92](warteschlange.md)
- Ruling: R166
- Start: Handbuch 1.12
- Bewertung: –

## E-013 · laufend · Budget-Phase gleich Paket-ID

- Hypothese: Wenn L0 jede Freigabe mit `--phase` gleich der Paket-ID des Leads loggt (auch je Integrator-Start eine eigene Freigabe), dann stimmen Dashboard-Zählung und Lead-Bericht überein.
- Messgrösse: über M9 und M10 0 Abweichungen zwischen „verbraucht“ im Lead-Bericht und der Dashboard-Zeile und 0 Starts, die auf eine fremde Freigabe fallen (`budget`- gegen `spawn`-Events; Ausgangswert Session 58d6bc4a: lead-art 6/4 statt 3/4, 1 Integrator-Start ohne Freigabe).
- Zeitraum: bis Ende M10.
- Rückfall: Handbuch 1.11, Abschnitt „Budget“ (`git show c1e0fa4:docs/studio/STUDIO.md`).
- Dateien: `docs/studio/STUDIO.md` (Budget), `docs/studio/CHANGELOG.md`
- Ruling: R166
- Start: Handbuch 1.12
- Bewertung: –

## E-012 · vorgeschlagen · Pages nur bei Spieländerungen

- Hypothese: Wenn `pages.yml` Pushes ignoriert, die nur Nicht-Build-Pfade ändern (`paths-ignore`, z. B. `docs/**`, `.superpowers/**`, `.claude/**`, `tools/studio/**`; vorher prüfen, dass nichts davon in `dist/` landet), dann sinken die Deploys stark und Spiel-Merges werden nicht mehr abgebrochen.
- Messgrösse: Anteil Pages-Läufe mit `docs:`-Titel je Session ≤ 10 % (Ausgangswert 24 von 31 = 77 %) und 0 abgebrochene Läufe zu Spiel-Merges über 3 Sessions; Gegenprobe: jeder Merge mit `src/`, `public/` oder `index.html` hat einen grünen Pages-Lauf.
- Zeitraum: 3 Sessions ab Umsetzung.
- Rückfall: `.github/workflows/pages.yml` ohne `paths-ignore` (Stand c1e0fa4).
- Dateien: `.github/workflows/pages.yml` (Werkzeug-Paket lead-production), `docs/studio/CHANGELOG.md`
- Ruling: R166 (angenommen; wartet auf Platz, höchstens 3 laufend, und auf das Paket lead-production)
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

## E-007 · behalten · Eine aktive L0-Session je Repo

- Ruling: R129 (1), behalten R166
- Bewertung: Ende M8 (a)–(c) je 0 (Ausgangswert 2/4/1), Session-Übergänge ohne Überlappung ausser 2 min nur lesend (M7-UX); Start-Hook-Warnung nicht gebaut ([Retro M8](retros/2026-10-02-meilenstein-m8.md))

## E-008 · behalten · Ein Gate für Folgepakete

- Ruling: R129 (2), behalten R166
- Bewertung: BUG-LICHT, H-R1, H-R2 je 2 Starts bis zum ersten Code (Schwelle ≤ 4), 0 Spec-/Plan-Lücken; Erstabnahme 1/3 (Code-Fix, visuelle Auflage), nicht der Gate-Form zugerechnet ([Retro M8](retros/2026-10-02-meilenstein-m8.md))
