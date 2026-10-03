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

## E-015 · laufend · Nachweiszeilen im Lead-Bericht

- Hypothese: Wenn die Berichtsvorlage des Leads für jedes Paket zwei Pflichtzeilen trägt („Rot-Beleg: Commit/Lauf oder Abweichung mit Begründung“, „Nachprüfung nach Review-BEDENKEN: Reviewer, Ergebnis oder entfällt“), dann meldet kein Lead ein Paket „bereit für Gate Merge“ ohne diese Nachweise, und L0 muss sie nicht mehr im Gate nachfordern.
- Messgrösse: über die nächsten 8 Pakete mit Gate Merge 0 Gate-Rulings, in denen L0 einen fehlenden Rot-Beleg oder eine fehlende Nachprüfung feststellt (Ausgangswert Session 08e7b5f1: 2 von 4 Paketen, R174, R178). Gegenprobe: Lead-Berichte bleiben ≤ 15 Zeilen.
- Zeitraum: die nächsten 8 Pakete mit Gate Merge (rund M10 Stufe 1/2).
- Rückfall: `docs/studio/templates/bericht.md` und Handbuch ohne die zwei Zeilen (Handbuch 1.13, `git show HEAD:docs/studio/templates/bericht.md`).
- Dateien: `docs/studio/templates/bericht.md`, `docs/studio/STUDIO.md` (Version), `docs/studio/CHANGELOG.md`
- Ruling: R179, R180, R190 (Start)
- Start: Handbuch 1.14
- Bewertung: –

## E-017 · laufend · Doku als eigener Plan-Task mit Eigentümer

- Hypothese: Wenn der Plan die Doku (README, arc42, ADR, Spec-Verweise) als eigenen Task mit Eigentümer führt und das Umsetzer-Briefing die D1-Dateien ausdrücklich erlaubt, dann schreibt kein Lead D1 selbst und das Final-Review meldet keine fehlende Doku (Retro M10 B3; Prozess-Retro M10 V1).
- Messgrösse: in M11 0 Final-Reviews mit fehlender Doku und 0 Lead-Commits mit Doku-Inhalt statt Umsetzer-Commits (Ausgang M10: 1 von 1; M8: 1 zweite Doku-Runde). Gegenprobe: Ownership-Überschneidungen zwischen parallelen Instanzen 0.
- Zeitraum: M11.
- Rückfall: `docs/studio/templates/briefing.md` und Persona `lead-tech` ohne die Zeile (Handbuch 1.13, `git show HEAD~1:docs/studio/templates/briefing.md`).
- Dateien: `docs/studio/templates/briefing.md`, `docs/studio/STUDIO.md` (Briefing-Standard, Plan-Format), `.claude/agents/lead-tech.md`, `docs/studio/CHANGELOG.md`
- Ruling: R190
- Start: Handbuch 1.14
- Bewertung: –

## E-022 · laufend · Merge-Hygiene

- Hypothese: Wenn `.gitattributes` für `docs/beobachtungen.md` `merge=union` setzt und der `production-integrator` in einem eigenen Worktree (`git worktree add .worktrees/integrate main`, Push von dort, Hauptcheckout danach `git pull --ff-only`) statt im Hauptcheckout mergt, dann entstehen keine Konflikte im Anhänge-Journal und keine Vorfälle durch den geteilten Arbeitsbaum (Retro M11 B1, B4; R196, R198).
- Messgrösse: in M12 0 manuell aufgelöste Konflikte in `docs/beobachtungen.md`, 0 verlorene oder doppelte Einträge (Sichtprüfung im Review) und 0 Vorfälle durch gemeinsam genutzten Hauptcheckout (Ausgang M11: 3 Konflikte, H-R7, C7, R2; 2 L0-Ablauffehler).
- Zeitraum: M12.
- Rückfall: Zeile aus `.gitattributes` entfernen; Persona `production-integrator` 1.3 und `lead-production` 1.5, Handbuch 1.14 (`git show HEAD~1:docs/studio/STUDIO.md`).
- Dateien: `.gitattributes`, `.claude/agents/production-integrator.md`, `.claude/agents/lead-production.md`, `docs/studio/STUDIO.md` (Merge), `docs/studio/CHANGELOG.md`
- Ruling: R201
- Start: Handbuch 1.15 (Persona-Fassungen gelten ab einem späteren Zug)
- Bewertung: –

## E-018 · vorgeschlagen · Blindtest-Prüflinge erst nach dem Urteil

- Hypothese: Wenn die Briefing-Vorlage des `qa-playtester` bei Blindtests vorschreibt, Probe-Dateien (z. B. `galerie.probes.json`) erst nach dem schriftlichen Urteil zu öffnen, und der Rater-Start im Paketbudget des Lead-Auftrags steht, dann gibt es keine Blindtests mit Vorbehalt und keine Budgetüberschreitung durch den Rater (Retro M10 B5, R181, R183).
- Messgrösse: über die nächsten 3 Blindtests 0 mit Vorbehalt „Probe vorab gesehen“ und 0 Budgetüberschreitungen durch Rater-Starts (Ausgang M10: 1 von 2 Vorbehalt, 1 Überschreitung 4/3).
- Zeitraum: die nächsten 3 Blindtests (M9 Welle 2 / M11).
- Rückfall: Playtester-Briefing ohne Zusatz (`git show HEAD:docs/studio/templates/briefing.md`).
- Dateien: `docs/studio/templates/briefing.md`, `.claude/agents/qa-playtester.md`, `docs/studio/CHANGELOG.md`
- Ruling: R190 (vorgeschlagen, wartet auf Platz)
- Start: –
- Bewertung: –

## E-019 · vorgeschlagen · Parallelität aus der Dateimatrix

- Hypothese: Wenn das Gate Plan vor jeder Parallelitätszusage eine Dateimatrix je Task prüft (gleiche Datei in zwei Tasks = seriell, im Plan benannt) und Bestandstests der geänderten Module im Task-Text nennt, dann stimmt die geplante mit der gemessenen Parallelität überein (Prozess-Retro M10 V3). Erweitert (R201): das Gate Plan prüft zusätzlich die Abhängigkeiten zwischen Tasks, und Task-Dateien werden nach Rulings nachgezogen (Ausgang M11: T04b trug nach R192 noch den alten Wortlaut, R194).
- Messgrösse: Differenz geplante minus gemessene Parallelität je Welle = 0 in den nächsten 2 Wellen (Ausgangswert M10-UI: 2 geplant, 1 gemessen).
- Zeitraum: die nächsten 2 Wellen.
- Rückfall: Gate-Plan-Briefing ohne die Prüfzeile.
- Dateien: `docs/studio/gates.md`, `docs/studio/CHANGELOG.md`
- Ruling: R190, R201 (erweitert, wartet auf Platz)
- Start: –
- Bewertung: –

## E-020 · vorgeschlagen · Nachführaufwand des Parallelstrangs als Berichtszeile

- Hypothese: Wenn der Lead-Bericht den Nachführaufwand eines parallelen Doku-Strangs (Minuten, Befunde mit Ursprung im Parallelstrang) als Zeile trägt, lässt sich nach 2 Meilensteinen entscheiden, ob der Parallelbetrieb netto spart (Prozess-Retro M10 V5).
- Messgrösse: Nachführaufwand ≤ 20 % der Design-Dauer (Ausgangswert M10: nicht erfasst; 1 von 4 blockierenden Spec-Befunden mit Ursprung in M10). Gegenprobe: Lead-Berichte bleiben ≤ 15 Zeilen.
- Zeitraum: 2 Meilensteine.
- Rückfall: `docs/studio/templates/bericht.md` ohne die Zeile.
- Dateien: `docs/studio/templates/bericht.md`, `docs/studio/CHANGELOG.md`
- Ruling: R190 (vorgeschlagen, wartet auf Platz)
- Start: –
- Bewertung: –

## E-023 · vorgeschlagen · Letzten roten Testlauf sichern

- Hypothese: Wenn `make check` und `make studio-test` bei Rot Testname und Ausgabe in `.studio/last-red.txt` sichern (Werkzeug, Verantwortung `lead-production`), dann lässt sich ein flakiger Test benennen und ist nicht mehr „Name unbekannt" (Retro M11 B6).
- Messgrösse: 100 % der roten Testläufe in M12 haben einen benannten Test in der Datei (Ausgang M11: 2 rote Läufe, 0 benannt, 17 Wiederholungen ohne Reproduktion). Gegenprobe: Laufzeit von `make check` + höchstens 2 s.
- Zeitraum: M12.
- Rückfall: Sicherungszeile aus dem Makefile entfernen.
- Dateien: `Makefile`, `tools/studio/`, `docs/studio/CHANGELOG.md`
- Ruling: R201 (vorgeschlagen, wartet auf Platz)
- Start: –
- Bewertung: –

## E-024 · vorgeschlagen · Wellen-Zuschnitt nach Dauer als Hinweis

- Hypothese: Wenn das Gate Plan je Welle die geschätzte Dauer je Strang als Hinweis nennt (längster Strang bestimmt die Welle) und Wellen so geschnitten werden, dass Stränge ähnlich lang sind, dann sinkt die Wartezeit der Leads auf den längsten Strang (Prozess-Retro M11).
- Messgrösse: Verhältnis längster zu mittlerem Strang je Welle ≤ 1,5 in M12 (Ausgang: aus `docs/studio/metriken/M12.md` je Welle zu erheben; M11 nicht erhoben). Nur Hinweis, kein Gate-Kriterium.
- Zeitraum: M12.
- Rückfall: Gate-Plan-Briefing ohne den Hinweis.
- Dateien: `docs/studio/gates.md`, `docs/studio/CHANGELOG.md`
- Ruling: R201 (vorgeschlagen, wartet auf Platz)
- Start: –
- Bewertung: –

## E-025 · vorgeschlagen · L0-Prüfzeile ohne Pipe

- Hypothese: Wenn das Handbuch für L0 eine feste Prüfzeile vorschreibt (`make studio-test >/dev/null && npx prettier --check <dateien>`, nie Pipe oder `;`), dann geht kein roter Lauf mehr durch (R193, R202, Retro 9b13950a B2).
- Messgrösse: 0 L0-Ablauffehler „roter Lauf übersehen" in M12 (Ausgang: 2 in einer Session, R193 und R202). Gegenprobe: keine zusätzlichen Tool-Aufrufe je Gate (Mittel M11).
- Zeitraum: M12.
- Rückfall: Zeile aus dem Handbuch entfernen.
- Dateien: `docs/studio/STUDIO.md`, `docs/studio/CHANGELOG.md`
- Ruling: –
- Start: –
- Bewertung: –

## E-026 · vorgeschlagen · Integrator-Persona: detached Arbeitsbaum

- Hypothese: Wenn die Persona `production-integrator` den tatsächlich nutzbaren Weg nennt (`git worktree add --detach .worktrees/integrate origin/main`, Push `git push origin HEAD:main`), dann entfällt die stille Abweichung (Retro 9b13950a B4).
- Messgrösse: 0 Integrator-Berichte mit Abweichung von der Persona-Anweisung in M12 (Ausgang: 1 von 7 Integrator-Instanzen, H-R8). Gegenprobe: kein Merge auf einen veralteten Stand (CI auf main grün).
- Zeitraum: M12.
- Rückfall: Persona 1.4 wiederherstellen.
- Dateien: `.claude/agents/production-integrator.md`, `docs/studio/CHANGELOG.md`
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

## E-010 · behalten · Schlanke Steuerung

- Hypothese: Wenn Leads einen Auftrag je Instanz abarbeiten (Gate-Urteil, Spec, Plan je eine Instanz), der Controller in der Umsetzung auf `sonnet` läuft und höchstens 4 Tasks je Instanz übernimmt, dann Übergabe per Ledger an eine frische Instanz, Leads nicht mit grossem Kontext auf Arbeiter warten, Pläne aus einem Index plus einer Datei je Task (≤ 10 KB) bestehen, Specs höchstens 40 KB haben, `rulings.md` nie ganz gelesen wird (nur per grep) und L0 nach jedem Gate-Block, spätestens bei 25 % Kontext, übergibt und keine Bilder liest, sinken der Steuerungsanteil und die 5-min-Neuschreibungen, ohne Informationsverlust (Ad-hoc-Retro Token-Effizienz B1, B2; zuvor: Controller-Wechsel nach der Hälfte der Tasks, Prozess-Retro M7-UX B0, V4; Retro M8).
- Messgrösse: in M10 gemessen mit dem Abschnitt „Effizienz“ aus `metrics.py` (`--efficiency`): Steuerungsanteil (L0 + Leads) ≤ 40 %, Lead-Kontext-Median ≤ 80k, Cache-Write 5 min ≤ 15 %, grösste gelesene Datei ≤ 40 KB, L0-Kontext Max ≤ 250k (Ausgangswerte: 67,2 %, bis 169k, 28,6 %, 310 KB, 774k). Zusatz (R190, aus E-016): Lead-Instanz übergibt spätestens bei 200k Kontext oder nach 6 Arbeiter-Starts (Lead-Kontext Max ≤ 300k, Steuerungsanteil ≤ 55 % als Zwischenwert); Gate Spec prüft Spec ≤ 40 KB und Task-Dateien ≤ 10 KB (`lead-qa`). Gegenprobe: höchstens 1 Rückfrage je 10 Tasks wegen fehlendem Planteil. Abbruch: ein Ruling der späteren Tasks widerspricht einem früheren (Final-Review) oder eine Folgeinstanz fragt mehr als einmal nach.
- Zeitraum: M11 (angepasst nach M10, R190).
- Rückfall: Handbuch 1.12 (Umsetzungszyklus Schritt 4: Controller-Wechsel nach dem mittleren QA-Block; `git show a5c8fcf:docs/studio/STUDIO.md`).
- Dateien: `docs/studio/STUDIO.md` (Umsetzungszyklus, Modellwahl), `.claude/agents/lead-tech.md`, `.claude/agents/lead-design.md`, `.claude/agents/design-spec-author.md`, `docs/studio/CHANGELOG.md`; Werkzeug EFF-W: `tools/studio/metrics.py`
- Ruling: R136, R137, R166, R167, R168 (E-014 eingegliedert), R190 (E-016 eingegliedert)
- Start: Handbuch 1.11 (Messung M8), angepasst 1.12, angepasst 1.13 (Messung M10), angepasst 1.14 (Messung M11)
- Bewertung: M11 (Fassung 1.14): Steuerungsanteil 29,8 % (≤ 40 %), Lead-Kontext-Median 61k (≤ 80k), Umsetzeranteil 20,7 % → behalten, abgeschlossen (R201); Cache-Write 5 min (26,5 %), grösste Datei (46,1 KB) und L0-Kontext Max (296k) werden in M12 ohne Experiment beobachtet ([Retro M11](retros/2026-10-03-meilenstein-m11.md)). Frühere: M8 (Fassung 1.11): Summe 3,02 Mio. Cache-Read je Task, Abbruch nicht ausgelöst → angepasst R166 ([Retro M8](retros/2026-10-02-meilenstein-m8.md)); Token-Analyse: Steuerung 67,2 %, Umsetzer 5,0 % → angepasst R167 ([Ad-hoc-Retro](retros/2026-10-02-adhoc-token-effizienz.md))

## E-008 · behalten · Ein Gate für Folgepakete

- Ruling: R129 (2), behalten R166
- Bewertung: BUG-LICHT, H-R1, H-R2 je 2 Starts bis zum ersten Code (Schwelle ≤ 4), 0 Spec-/Plan-Lücken; Erstabnahme 1/3 (Code-Fix, visuelle Auflage), nicht der Gate-Form zugerechnet ([Retro M8](retros/2026-10-02-meilenstein-m8.md))

## E-011 · behalten · Rebase-Verbot in der Briefing-Vorlage

- Ruling: R166, behalten R190
- Bewertung: 0 Rebase-Anweisungen, 0 Ausführungen seit 1.12 → behalten R190 ([Retro M10](retros/2026-10-03-meilenstein-m10.md), B-Hinweis: 18 von 86 Briefings ohne Git-Zeile)

## E-013 · behalten · Budget-Phase gleich Paket-ID

- Ruling: R166, behalten R190
- Bewertung: 27 Freigaben, alle Phase gleich Paket-ID, keine fremde Freigabe; 4 Pakete mit Nachfreigabe, 1 Überschreitung (A1 4/3) → behalten R190 ([Retro M10](retros/2026-10-03-meilenstein-m10.md))

## E-021 · abgelehnt · QA-Stichprobe nach der Hälfte der UI-Strecke

- Ruling: R190 (V4 der Prozess-Retro M10 abgelehnt; die Ursache deckt E-015 billiger ab)
