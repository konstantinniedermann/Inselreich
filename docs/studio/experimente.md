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

## E-010 · laufend · Schlanke Steuerung

- Hypothese: Wenn Leads einen Auftrag je Instanz abarbeiten (Gate-Urteil, Spec, Plan je eine Instanz), der Controller in der Umsetzung auf `sonnet` läuft und höchstens 4 Tasks je Instanz übernimmt, dann Übergabe per Ledger an eine frische Instanz, Leads nicht mit grossem Kontext auf Arbeiter warten, Pläne aus einem Index plus einer Datei je Task (≤ 10 KB) bestehen, Specs höchstens 40 KB haben, `rulings.md` nie ganz gelesen wird (nur per grep) und L0 nach jedem Gate-Block, spätestens bei 25 % Kontext, übergibt und keine Bilder liest, sinken der Steuerungsanteil und die 5-min-Neuschreibungen, ohne Informationsverlust (Ad-hoc-Retro Token-Effizienz B1, B2; zuvor: Controller-Wechsel nach der Hälfte der Tasks, Prozess-Retro M7-UX B0, V4; Retro M8).
- Messgrösse: in M10 gemessen mit dem Abschnitt „Effizienz“ aus `metrics.py` (`--efficiency`): Steuerungsanteil (L0 + Leads) ≤ 40 %, Lead-Kontext-Median ≤ 80k, Cache-Write 5 min ≤ 15 %, grösste gelesene Datei ≤ 40 KB, L0-Kontext Max ≤ 250k (Ausgangswerte: 67,2 %, bis 169k, 28,6 %, 310 KB, 774k). Gegenprobe: höchstens 1 Rückfrage je 10 Tasks wegen fehlendem Planteil. Abbruch: ein Ruling der späteren Tasks widerspricht einem früheren (Final-Review) oder eine Folgeinstanz fragt mehr als einmal nach.
- Zeitraum: M10.
- Rückfall: Handbuch 1.12 (Umsetzungszyklus Schritt 4: Controller-Wechsel nach dem mittleren QA-Block; `git show a5c8fcf:docs/studio/STUDIO.md`).
- Dateien: `docs/studio/STUDIO.md` (Umsetzungszyklus, Modellwahl), `.claude/agents/lead-tech.md`, `.claude/agents/lead-design.md`, `.claude/agents/design-spec-author.md`, `docs/studio/CHANGELOG.md`; Werkzeug EFF-W: `tools/studio/metrics.py`
- Ruling: R136, R137, R166, R167, R168 (E-014 eingegliedert)
- Start: Handbuch 1.11 (Messung M8), angepasst 1.12, angepasst 1.13 (Messung M10)
- Bewertung: M8 (Fassung 1.11): Summe 3,02 Mio. Cache-Read je Task, Abbruch nicht ausgelöst → angepasst R166 ([Retro M8](retros/2026-10-02-meilenstein-m8.md)); Token-Analyse: Steuerung 67,2 %, Umsetzer 5,0 % → angepasst R167 ([Ad-hoc-Retro](retros/2026-10-02-adhoc-token-effizienz.md))

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

## E-015 · laufend · Nachweiszeilen im Lead-Bericht

- Hypothese: Wenn die Berichtsvorlage des Leads für jedes Paket zwei Pflichtzeilen trägt („Rot-Beleg: Commit/Lauf oder Abweichung mit Begründung“, „Nachprüfung nach Review-BEDENKEN: Reviewer, Ergebnis oder entfällt“), dann meldet kein Lead ein Paket „bereit für Gate Merge“ ohne diese Nachweise, und L0 muss sie nicht mehr im Gate nachfordern.
- Messgrösse: über die nächsten 8 Pakete mit Gate Merge 0 Gate-Rulings, in denen L0 einen fehlenden Rot-Beleg oder eine fehlende Nachprüfung feststellt (Ausgangswert Session 08e7b5f1: 2 von 4 Paketen, R174, R178). Gegenprobe: Lead-Berichte bleiben ≤ 15 Zeilen.
- Zeitraum: die nächsten 8 Pakete mit Gate Merge (rund M10 Stufe 1/2).
- Rückfall: `docs/studio/templates/bericht.md` und Handbuch ohne die zwei Zeilen (Handbuch 1.13, `git show HEAD:docs/studio/templates/bericht.md`).
- Dateien: `docs/studio/templates/bericht.md`, `docs/studio/STUDIO.md` (Version), `docs/studio/CHANGELOG.md`
- Ruling: –
- Start: –
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
