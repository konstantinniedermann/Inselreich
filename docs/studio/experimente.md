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

Reihenfolge der Wartenden auf einen freien Platz (R375): E-038 (frühestens 2026-10-22), E-048,
E-049, E-044; E-054 läuft seit R459; E-055 (Budget-Warnung, Retro c64c0775-b V1) danach; E-056 und E-057 (Retro 2cfa57e0 V1, V3) zuletzt; E-058 (V2) ist eine Vorlagenzeile ohne Platz.

---

## E-022 · angepasst (übernommen, R319) · Merge-Hygiene

- Hypothese: Wenn `.gitattributes` für `docs/beobachtungen.md` `merge=union` setzt und der `production-integrator` in einem eigenen Worktree (`git worktree add .worktrees/integrate main`, Push von dort, Hauptcheckout danach `git pull --ff-only`) statt im Hauptcheckout mergt, dann entstehen keine Konflikte im Anhänge-Journal und keine Vorfälle durch den geteilten Arbeitsbaum (Retro M11 B1, B4; R196, R198).
- Messgrösse: in M12 0 manuell aufgelöste Konflikte in `docs/beobachtungen.md`, 0 verlorene oder doppelte Einträge (Sichtprüfung im Review) und 0 Vorfälle durch gemeinsam genutzten Hauptcheckout (Ausgang M11: 3 Konflikte, H-R7, C7, R2; 2 L0-Ablauffehler).
- Zeitraum: M12.
- Anpassung R303 (Handbuch 1.23): `merge=union` entfällt (Zeile aus `.gitattributes` entfernt), Standardmerge; Messgrösse zusätzlich 0 zurückgeholte gestrichene Zeilen und 0 Doppelabschnitte in 3 Merges, die `docs/beobachtungen.md` berühren (E-031). Rückfall dafür: Zeile `docs/beobachtungen.md merge=union` wiederherstellen.
- Rückfall: Zeile aus `.gitattributes` entfernen; Persona `production-integrator` 1.3 und `lead-production` 1.5, Handbuch 1.14 (`git show HEAD~1:docs/studio/STUDIO.md`).
- Dateien: `.gitattributes`, `.claude/agents/production-integrator.md`, `.claude/agents/lead-production.md`, `docs/studio/STUDIO.md` (Merge), `docs/studio/CHANGELOG.md`
- Ruling: R201
- Start: Handbuch 1.15 (Persona-Fassungen gelten ab einem späteren Zug)
- Bewertung: – (Datenpunkt, [Nachtrag](retros/2026-10-04-session-e13c3631.md) N4: 1 Formatabweichung in `docs/beobachtungen.md` nach union-Merge in REL-02, vom Integrator behoben; 0 Konflikte; Zeitraum M12 nicht begonnen); Datenpunkt 2 ([Retro session-e51712dd](retros/2026-10-06-session-e51712dd.md) B3): 0 Konflikte, 1 Formatabweichung nach Union-Merge in REL-05 (R276), keine Hauptcheckout-Vorfälle belegt → weiter beobachten
- Urteil R319 (Coach 2026-10-08): **übernehmen**, Teil `merge=union` bereits zurückgenommen (R303). Gegen Schwelle: 0 Konflikte und 0 Hauptcheckout-Vorfälle in beiden Datenpunkten (Retros e13c3631-Nachtrag N4, session-e51712dd B3), 2 Formatabweichungen nach Union-Merge sind durch den Wegfall von `union` erledigt. Der Worktree-Teil steht in `production-integrator` 1.7 (R264) und im Handbuch. Der Zeitraum „M12“ ist ohne Meilenstein-Ende nicht mehr bestimmbar; die Restprüfung (E-031: 0 zurückgeholte Zeilen in 3 Merges) läuft als Regel ohne Platz, die Session-Retro prüft sie mit `git diff <merge-base> HEAD -- docs/beobachtungen.md`.

## E-027 · behalten (R350) · Discovery-Strang mit Ideen-Pool

- Hypothese: Wenn `lead-design` nach jedem Release- oder Meilenstein-Merge (spätestens jede zweite Session) eine Ideen-Runde verantwortet, in der `design-idea-scout` höchstens 5 Ideen in `docs/ideen.md` einträgt, `lead-design` sie mit dem Raster (Spielspass ×2, Säulen-Passung, Aufwand, Risiko) bewertet und höchstens 2 an L0 pitcht, L0 je Runde ein Ruling fällt und jedes Release einen Platz für eine Studio-Idee reserviert, dann entwickelt sich das Spiel auch ohne Nutzer-Input weiter, zu begrenzten Kosten (R207 (1); Prozess-Retro 2026-10-04 B1).
- Messgrösse: Anteil der im Zeitraum eingeplanten Bausteine (Häppchen und Meilenstein-Bausteine) mit Studio-Ursprung (Verweis auf `I-nnn` im Ruling) ≥ 25 %; eine Idee gilt als eingeplant, sobald ein Ruling sie mit Release- oder M-Ziel nennt (R224 (5)) und ≥ 2 Studio-Ideen live (Ausgang: 0 von 20 Programmpunkten, 0 Häppchen). Gegenproben: je Runde ≤ 2 Starts und ≤ 80 Tool-Aufrufe (Paket-ID `IDEEN-nn`); von live gegangenen Studio-Ideen höchstens 1 von 3 per Nutzer-Einwand verworfen oder zurückgenommen.
- Zeitraum: 3 Ideen-Runden (voraussichtlich M12 und die Releases daneben).
- Rückfall: keine Ideen-Runden; `docs/ideen.md` bleibt als Archiv; `design-idea-scout` zurück nach „Auf Abruf“ als `design-genre-researcher`; `lead-design` 1.5 (`git show HEAD:.claude/agents/lead-design.md`).
- Dateien: `docs/studio/STUDIO.md` (Discovery-Strang), `.claude/agents/lead-design.md`, `.claude/agents/design-idea-scout.md` (neu), `docs/studio/roster.md`, `tools/studio/tests/test_model.py` (`PERSONA_NAMES`), `docs/ideen.md` (neu), `docs/studio/CHANGELOG.md`
- Ruling: R208, Zählregel R224 (5) (Handbuch 1.18)
- Start: 2026-10-04 (Handbuch 1.16)
- Bewertung: – (Datenpunkt 1 von 3 Runden, [Retro session-e13c3631](retros/2026-10-04-session-e13c3631.md) B5: IDEEN-01 mit 2 Agenten und 35 Tool-Aufrufen; 2 von 5 Ideen eingeplant, 1 Studio-Idee live (H-U2, REL-01), Studio-Anteil 1 von 5 Häppchen = 20 %; Nutzer-Einwände 0, Playtest steht aus); Datenpunkt 2 von 3 Runden, [Nachtrag](retros/2026-10-04-session-e13c3631.md) N5: IDEEN-02 mit 1 Start, 2 von 4 Ideen eingeplant (H-A2 live in REL-02, I-007 für REL-04), 2 Studio-Ideen live (Schwelle ≥ 2 erreicht), Studio-Anteil live 2 von 5 Häppchen, eingeplant je nach Zählregel offen; Nutzer-Einwände 0) Messwert 2 ([Retro session-ad51d3c5](retros/2026-10-05-session-ad51d3c5.md)): REL-03 Studio-Anteil 1 von 4 = 25 % (H-U1/I-001), M12-Bausteine I-004/I-006/I-008 eingeplant (R225); IDEEN-02 offen. Messwert 3 ([Retro session-e51712dd](retros/2026-10-06-session-e51712dd.md)): R250–R277 ohne `I-nnn`-Ruling, IDEEN-03 nicht belegt und fällig → weiter beobachten.
- Urteil R319 (Coach 2026-10-08): **verlängern**, bis IDEEN-03 gelaufen ist, höchstens bis 2026-10-22. Gegen Schwelle: Studio-Anteil 20 % / 25 % (Soll ≥ 25 %, einmal erreicht), 2 Studio-Ideen live (erreicht), Nutzer-Einwände 0, Gegenproben eingehalten (IDEEN-01: 35 Aufrufe, IDEEN-02: 1 Start). Es liegen aber nur 2 von 3 Ideen-Runden vor; Messwert 3 ist ohne `I-nnn`-Ruling seit R250 und ohne IDEEN-03. Ein Urteil jetzt wäre Schätzung. Rückfall am Stichtag: ohne IDEEN-03 `zurückgenommen` (Pool bleibt Archiv).
- Urteil R350 (Coach 2026-10-08): **behalten**. Beobachtung: IDEEN-03 ist gelaufen, Gate OK mit Bündeln TASTEN-KOMFORT (I-022, I-023, I-025) und PANEL-UEBERSICHT (I-026) als nächste Pakete (R337). Damit liegen 3 von 3 Ideen-Runden vor; Studio-Ideen live ≥ 2 (erreicht, R319), Nutzer-Einwände 0. Deutung: Der Studio-Anteil eingeplanter Bausteine steigt mit R337 deutlich über 25 %, weil 4 Ideen mit Studio-Ursprung auf einmal eingeplant sind. Lücke: Starts und Tool-Aufrufe von IDEEN-03 (Gegenprobe ≤ 2 Starts, ≤ 80 Aufrufe) wurden nicht gesondert erhoben; die Bewertung stützt sich auf R337 und R319. Der Strang bleibt Regel (STUDIO.md, Discovery-Strang); L0 bestätigt per Ruling.

## E-030 · angepasst (R319) · Zeittests lokal seriell

- Hypothese: Wenn `perfBudget`-Zeittests lokal nach dem parallelen Testlauf allein laufen, flackern sie nicht mehr unter Mehrfachlast (Retro [session-6a98e530](retros/2026-10-05-session-6a98e530.md) B1).
- Messgrösse: 0 lokale Flackerfälle in `docs/beobachtungen.md` und Lead-Berichten in 2 Sessions (Ausgang ≥ 5 Fälle in 3 Sessions).
- Zeitraum: die nächsten 2 Sessions.
- Rückfall: `vitest`-Konfiguration und `make check` auf den Stand vor der Änderung.
- Dateien: `vite.config.ts`, `Makefile` (Paket TOOL-E030, lead-tech); `docs/studio/STUDIO.md` (Lastregel, Handbuch 1.19)
- Ruling: R249 (3), R250 (Start), R251 (Platz nach Abschluss E-028)
- Start: 2026-10-05 (Handbuch 1.20, Paket TOOL-E030)
- Bewertung: Datenpunkt 1 von 2 Sessions ([Retro session-e51712dd](retros/2026-10-06-session-e51712dd.md)): 0 neue Flacker-Einträge seit dem Start, zwei rote CI-Läufe waren fehlende Runner-Reserve, kein lokales Flackern; Lead-Berichte nicht ausgewertet → weiter beobachten
- Urteil R319 (Coach 2026-10-08): **übernehmen als angepasst**. Gegen Schwelle: Soll 0 lokale Flackerfälle in 2 Sessions; Datenpunkt 1 (e51712dd) 0 Fälle, `docs/beobachtungen.md` kennt seit dem Start keinen Eintrag. Beim Gegenlesen dieser Rotation scheiterte aber `tests/sim/save.test.ts` B6 (`createWorld` Mittel ≤ `perfBudget(5)`) in einem `make check` einmal, im Wiederholungslauf grün (Last unbelegt, Messung im selben Lauf). Schwelle damit knapp verfehlt (1 Fall; Ausgang ≥ 5 in 3 Sessions). Die Lastregel bleibt (Handbuch 1.19, `vite.config.ts`); Restursache ist das Zeitbudget einzelner Tests, das gehört in TOOL-TIMEOUTS/`perfBudget` (R318), nicht in ein weiteres Experiment. Beobachtung in `docs/beobachtungen.md` eingetragen.

## E-029 · ersetzt durch E-042 (R319) · Lead-Übergabe bei 200k mit Aufschlüsselung der Steuerung

- Hypothese: Wenn der Steuerungsanteil je Tätigkeit (Gate, Spec, Plan, Controller, Warten) aufgeschlüsselt und jede Lead-Instanz bei 200k Kontext per Ledger übergibt (R190), dann sinken Lead-Kontext Max und Steuerungsanteil, und die Ursache der zweiten roten Session in Folge wird lesbar (Retro [session-6a98e530](retros/2026-10-05-session-6a98e530.md) E1).
- Messgrösse: Lead-Kontext Max ≤ 300k und Steuerungsanteil ≤ 55 % (Session-Zeile, `metrics.py --efficiency`; Ausgang 343k, 64,3 %).
- Zeitraum: die nächsten 2 Sessions.
- Rückfall: Zustand wie jetzt (R190 ohne Durchsetzung).
- Dateien: `tools/studio/metrics.py` (Aufschlüsselung), `.claude/agents/lead-tech.md`
- Ruling: –
- Ersetzt: V1 und M1 der Retro [ampel-steuerung](retros/2026-10-08-ampel-steuerung.md), Ruling R319; die Aufschlüsselung liefert M1 (lead-tech), die Übergabe-Regel E-042.

## E-042 · angepasst (R420) · Lead-Ablösung per Handoff, Statusturns der Leads entfallen

- Hypothese: Wenn ein Lead nach dem Abschlussbericht nicht fortgesetzt, sondern per Handoff durch einen neuen Lead abgelöst wird (V1), und die Leads `active`/`done` nicht mehr melden, weil Hook-Events sie ersetzen (V2), sinken die Neuschreibungen des Lead-Kontexts nach Turn-Ende und die Turn-Zahl der Leads, ohne dass Übergabe oder Dashboard leiden (Retro [ampel-steuerung](retros/2026-10-08-ampel-steuerung.md) B3, V1, V2; ersetzt E-029).
- Messgrösse: (V1) Lead-Neuschreibungen ≥ 20k nach Turn-Ende je Lead-Instanz ≤ 0,6 (Ausgang 1,2; 91 in 78 Instanzen, 6 Sessions); (V2) alleinstehende `log.py status`-Turns je Lead-Instanz ≤ 1 (Ausgang 3,2). Beide über 3 Sessions mit zusammen ≥ 10 Lead-Starts. Gegenprobe: Starts je Paket höchstens +1 gegenüber Ausgang, Review-Runden im Mittel ≤ 2, Briefing-Rückfragen nicht häufiger, Dashboard zeigt jeden Lead mit Paket (Stichprobe aus `.studio/events.jsonl`). Getrennt von E-037: dort zählen Umsetzer-Instanzen und Bash-Vorgänger.
- Messbarkeit: Solange M1 (Metrik-Spalte „vorher Turn-Ende“, lead-tech) fehlt, zählen Sessions erst ab dem ersten Metrik-Lauf mit M1; vorher gilt das Wegwerf-Skript der Retro nur als Stichprobe. Spätestens nach 2 Sessions ohne M1 meldet der Coach das als Blocker an L0.
- Zeitraum: 3 Sessions mit ≥ 10 Lead-Starts, höchstens bis 2026-11-05.
- Rückfall: Handbuch 1.26 und Lead-Personas vor dieser Änderung (`git show <Commit>~1:docs/studio/STUDIO.md`, `.claude/agents/lead-*.md`); `active`/`done` wieder melden, Regel „Fortsetzen statt neu starten“ wie 1.26.
- Dateien: `docs/studio/STUDIO.md`, `docs/studio/verbesserung.md`, `.claude/agents/lead-*.md`, `docs/studio/CHANGELOG.md`
- Ruling: R319
- Start: 2026-10-08 (Handbuch 1.27, Leads 1.10/1.6/1.8); V2-Vorbedingung geprüft (Dashboard und Modell brauchen `active`/`done` nicht, siehe Retro-Nachtrag und Coach-Bericht)
- Bewertung: –
- Datenpunkt S-2026-10-08-29c3791b (Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md)): V1 ≈ 1,0 Neuschreibungen nach Turn-Ende je Lead-Instanz (13 in 13, nicht erreicht); V2 0,38 Status-Turns je Instanz (erreicht); Review-Runden 1,00.
- Endstand S-2026-10-08-29c3791b (Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) Nachtrag Teil 2, ersetzt den Datenpunkt oben, Session zählt einmal): V1 18 in 22 Lead-Instanzen = 0,82 (nicht erreicht; Teil 2 allein ≈ 0,56, abgeleitet); V2 14 in 22 = 0,64 (erreicht); Review-Runden 1,00.
- Datenpunkt S-2026-10-09-e90e097e (Retro [session-e90e097e-ende](retros/2026-10-09-session-e90e097e-ende.md)): V1 5 Neuschreibungen > 20k in 11 Lead-Instanzen = 0,45 (obere Schranke, erreicht); V2 nicht erhoben (Messauftrag nächste Session); Review-Runden 1,29. Zweite von drei Sessions.
- Datenpunkt 3 von 3, S-2026-10-09-fb37ceac (Retro [session-fb37ceac-ende](retros/2026-10-09-session-fb37ceac-ende.md)): V1 9 in 12 = 0,75; V2 23 in 12 = 1,92 (Briefing-Vorlage führt „Start“/„Fertig“ ohne Ausnahme für Leads, B5); Review-Runden 1,40. Gepoolt V1 0,71 (Schwelle ≤ 0,6 verfehlt), V2 1,09 (≤ 1 verfehlt). Empfehlung Coach: **angepasst** (Handoff und „kein `active`/`done`“ bleiben, Vorlagenzeile „(nicht Leads)“, V2-Messung endet); Urteil per Ruling offen.
- Bewertung (R420): **angepasst**. Handoff und „kein `active`/`done` für Leads“ bleiben; die Briefing-Vorlage führt Start/Fertig nur noch für Arbeiter (Handbuch 1.36); die V2-Messung endet.

## E-018 · vorgeschlagen · Blindtest-Prüflinge erst nach dem Urteil

- Hypothese: Wenn die Briefing-Vorlage des `qa-playtester` bei Blindtests vorschreibt, Probe-Dateien (z. B. `galerie.probes.json`) erst nach dem schriftlichen Urteil zu öffnen, und der Rater-Start im Paketbudget des Lead-Auftrags steht, dann gibt es keine Blindtests mit Vorbehalt und keine Budgetüberschreitung durch den Rater (Retro M10 B5, R181, R183).
- Messgrösse: über die nächsten 3 Blindtests 0 mit Vorbehalt „Probe vorab gesehen“ und 0 Budgetüberschreitungen durch Rater-Starts (Ausgang M10: 1 von 2 Vorbehalt, 1 Überschreitung 4/3).
- Zeitraum: die nächsten 3 Blindtests (M9 Welle 2 / M11).
- Rückfall: Playtester-Briefing ohne Zusatz (`git show HEAD:docs/studio/templates/briefing.md`).
- Dateien: `docs/studio/templates/briefing.md`, `.claude/agents/qa-playtester.md`, `docs/studio/CHANGELOG.md`
- Ruling: R190 (vorgeschlagen, wartet auf Platz)
- Start: –
- Bewertung: –
- Datenpunkt 1, Release-Check REL-10 (R389, R390; Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) Nachtrag Teil 2 B13): CLI-Rater urteilte ohne Kontext „Boot“ für den Meeresfels und entschied den Widerspruch aus R381; zweiter Datenpunkt ist die Abnahme von ART-MEERESFELS.

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

## E-015 · behalten · Nachweiszeilen im Lead-Bericht

- Ruling: R179, R180, R190 (Start), R208 (Abschluss)
- Bewertung: 7 von 8 Gate-Merge-Paketen erreicht, 0 Beanstandungen (Schwelle 0 erfüllt); R206 nennt die Nachweise nicht, die Regel misst nur Beanstandungen ([Prozess-Retro](retros/2026-10-04-prozess-kreativitaet-tempo.md) V4). Vor E-028 abgeschlossen, damit weniger Gate-Merges die Messgrundlage nicht verdünnen.

## E-017 · behalten · Doku als eigener Plan-Task mit Eigentümer

- Ruling: R190 (Start), R208 (Abschluss)
- Bewertung: Zeitraum M11 vorbei; Schwelle „0 Final-Reviews mit fehlender Doku“ verfehlt (ein niedriger Doku-Nachtrag, R199 Punkt 3), die Fehlerklasse ist aber von „fehlt“ zu „Nachtrag niedrig“ gewandert und die Zeile kostet wenig ([Prozess-Retro](retros/2026-10-04-prozess-kreativitaet-tempo.md) V4)

## E-028 · behalten · Release-Bündel für Häppchen

- Ruling: R208 (Start), R224 (1) (Lesart), R251 (Abschluss)
- Bewertung: Zeitraum erreicht, 4 Releases mit 10 Häppchen. (1) Gate-Merge-Rulings und Pushes je Häppchen gesamt 4/10 = 0,4, Schwelle erfüllt (REL-01 0,33; REL-02 0,5 bei 2 Häppchen; REL-03 0,25; REL-04 1,0 als Ausnahme kritischer Pfad, R243, seit Handbuch 1.19 durch R249 (1), (2) geregelt); Integrator-Instanzen nicht vollständig erhoben. (2) Leerlauf nach Ursache getrennt nie erhoben (REL-02 19,5 min ursachengemischt): unbelegt, nicht verfehlt. (3) Releases mit Spieländerung je Session 2, 1, 1 (≤ 2 erfüllt). Gegenproben: UI-Tasks mit Screenshot-Abschnitt in allen 4 Releases (R232, R244); `make check` vor jedem Merge grün; Fix-Commits auf main je Release ≤ 1 (REL-03: Hotfix H-T3, R234, R235); Cache-Write 5 min 25,9 %, 25,3 %, 25,7 % (≤ 26,8 %); kein Abbruch. Die Arbeitsweise bleibt Regel (STUDIO.md Umsetzungszyklus Stufe leicht, [gates.md](gates.md#gate-merge-release)); Belege: [Retro e13c3631](retros/2026-10-04-session-e13c3631.md), [Retro ad51d3c5](retros/2026-10-05-session-ad51d3c5.md), [Prozess-Retro REL-04](retros/2026-10-05-prozess-rel04-e0.md).

## E-026 · übernommen R264 · Integrator-Persona: detached Arbeitsbaum

- Ruling: R264 (als Persona-Korrektur ohne Experiment übernommen, Persona production-integrator 1.7; Belege Retro 9b13950a B4 und [adhoc-e1-c3](retros/2026-10-06-adhoc-e1-c3.md) B5)

## E-031 · angenommen als Teil von E-022 (R303) · Merge-Hygiene ohne union für `docs/beobachtungen.md`

- Hypothese: Wenn `merge=union` für `docs/beobachtungen.md` entfällt und Konflikte am Dateiende manuell gelöst werden, kehren ausgewertete (gestrichene) Zeilen nicht mehr zurück (Retro [adhoc session-7db07561](retros/2026-10-07-adhoc-session-7db07561.md) B2; R294).
- Messgrösse: 0 zurückgeholte gestrichene Zeilen und 0 Doppelabschnitte in den nächsten 3 Merges, die die Datei berühren (`git diff <merge-base> HEAD`); manuelle Auflösung ≤ 5 min je Fall (Ausgang: ~490 Zeilen, R294).
- Zeitraum: 3 Merges.
- Rückfall: Zeile `docs/beobachtungen.md merge=union` in `.gitattributes` wiederherstellen.
- Dateien: `.gitattributes`, `.claude/agents/production-integrator.md`, `docs/studio/STUDIO.md` (Merge), `docs/studio/CHANGELOG.md`
- Ruling: –

## E-032 · angenommen als Werkzeug-Paket TOOL-CHECK-ZEITTEST (R303) · Mechanische Zeittest- und Format-Prüfung in `make check`

- Hypothese: Wenn `make check` Tests mit lokaler Laufzeit ≥ 1 s ohne Timeout ≥ 5 × Laufzeit meldet und geänderte Doku-Dateien mit `prettier --check` prüft, bleibt main bei Zeittest- und Formatfehlern grün (Retro adhoc session-7db07561 B1; R267, R271, R290, R302).
- Messgrösse: 0 rote CI-Läufe auf main durch Zeittest-Timeout oder Prettier in 3 Releases (Ausgang: 3 in 2 Sessions); Nebenmessgrösse Cache-Write je Session.
- Zeitraum: 3 Releases.
- Rückfall: Schritt aus `make check` entfernen.
- Dateien: `Makefile`, `tools/` (Prüfskript), `docs/studio/STUDIO.md`
- Ruling: –

## E-033 · vorgemerkt (R303) · Blinder Rater vor dem Stapeln von Optik-Layern

- Hypothese: Wenn der blinde Rater (Fragen 1–2, ein Start) direkt nach dem Layer-Merge in den Release-Kandidaten läuft, fallen Bildmängel vor dem Stapeln auf und bleiben isolierbar (Retro adhoc session-7db07561 B4; R298, R300).
- Messgrösse: 0 Bildfrage-Durchfälle, die erst im Release-Lauf auffallen, in 3 Optik-Releases (Ausgang: 2 Gate-Runden WALD L1); Gegenprobe ≤ 1 zusätzlicher Rater-Start je Layer.
- Zeitraum: 3 Optik-Releases.
- Rückfall: Rater nur im Release-Lauf.
- Dateien: `docs/studio/STUDIO.md` (Release-Lauf), `.claude/agents/lead-qa.md`
- Ruling: –

## E-034 · vorgeschlagen (angenommen R308, wartet auf Platz) · Übergabe-Prüfzeile bei Session-Abbruch

- Hypothese: Wenn L0 beim Abbruch Agenten mit Heartbeat < 10 min in `state.md` als „kann weiterlaufen“ nennt und beim Start vor jedem Neustart Worktree-Stand und Dashboard prüft, entstehen keine zwei Schreiber im selben Worktree und `state.md` ist nicht veraltet (Retro [session-7db07561-ende](retros/2026-10-07-session-7db07561-ende.md) B1).
- Messgrösse: bei den nächsten 3 Abbrüchen oder Pausen 0 Worktrees mit zwei Schreibern und 0 Abweichungen zwischen `state.md` und Worktree-HEAD beim Start (Ausgang: 1 Abweichung bei L7 in 1 Abbruch).
- Zeitraum: die nächsten 3 Abbrüche, höchstens 4 Wochen.
- Rückfall: Handbuch auf die Fassung vor der Änderung.
- Dateien: `docs/studio/STUDIO.md` (Ende, Punkt 1; Start, Punkt 5)
- Ruling: R308
- Start: Handbuch 1.24 (Satz gilt seit 2026-10-07); Zählung `laufend` erst bei freiem Platz (3 laufen: E-022, E-027, E-030)

## E-035 · vorgeschlagen · Überholte CI-Vorfälle automatisch erledigen

- Hypothese: Wenn `effort.incidents()` einen roten main-Lauf auslässt, sobald derselbe Workflow später auf main grün lief, erscheinen keine erledigten „CI auf main fehlgeschlagen“-Meldungen mehr (Retro [session-7db07561-ende](retros/2026-10-07-session-7db07561-ende.md) B3).
- Messgrösse: 0 offene `ci:`-Vorfälle bei grünem main in den nächsten 2 Sessions; alle roten Läufe weiter in den CI-Events und der Metrik sichtbar (Stichprobe `metrics.py`); Retro-Pflicht für rote Läufe unverändert (Rot ist im Retro-Bericht genannt).
- Zeitraum: die nächsten 2 Sessions.
- Rückfall: Änderung in `effort.py` zurücknehmen (`git revert`).
- Dateien: `tools/studio/effort.py`, `tools/studio/tests/test_effort.py`
- Ruling: –

## E-036 · übernommen als Werkzeug (R316 V3, R319) · Cache-Write je Instanz gegen Wartezeit ausweisen

- Hypothese: Der Cache-Write-Anteil (rot, 42,9 %) entsteht überwiegend nach Lücken > 5 min ohne Aufruf; die Auswertung je Instanz bestätigt oder widerlegt das (Retro [session-7db07561-ende](retros/2026-10-07-session-7db07561-ende.md), Ampel).
- Messgrösse: Anteil der Neuschreibungen > 20k direkt nach einer Lücke > 5 min; Schwelle: ≥ 60 % bestätigt die Hypothese, dann folgt ein eigenes Experiment zur Wartegestaltung; < 30 % widerlegt sie.
- Zeitraum: eine Auswertung über die letzten 5 Sessions, danach Bewertung.
- Rückfall: Zusatz in `metrics.py` entfernen; rein lesend, keine Änderung am Ablauf.
- Dateien: `tools/studio/metrics.py`
- Ruling: –
- Urteil R319 (Coach 2026-10-08): **abschliessen**. Die Auswertung ist als Tabelle „Neuschreibungen nach Pause > 5 min“ in `metrics.py --efficiency` Dauerbestandteil (TOOL-AMPEL); die Hypothese ist durch Retro ampel-steuerung B3 für Leads gestützt (91 von 125 Fällen nach Turn-Ende). Kein Slot nötig.

## E-037 · angepasst (R420) · Lange Bash-Läufe im Hintergrund (Hebel 1)

- Hypothese: Wenn Umsetzer und Leads lange Bash-Läufe im Hintergrund starten und spätestens alle 4 min abfragen, läuft die 5-min-Cache-Frist seltener ab und der Cache-Write-5-min-Anteil sinkt (Retro [proc-aufwandsverteilung](retros/2026-10-08-proc-aufwandsverteilung.md); R314). ADR-007 bleibt: Arbeiter-Starts bleiben im Vordergrund.
- Messgrösse: Cache-Write-5-min-Anteil laut Session-Datei (`metrics.py`, Abschnitt „Effizienz“), Ausgang 29,2 % (Historie) bzw. 21,7 % (8ef9d27f); Schwelle ≤ 20 % im Mittel über 3 Sessions mit Umsetzern, ohne Anstieg der Review-Runden.
- Zeitraum: 3 Sessions, höchstens 4 Wochen.
- Rückfall: Handbuch auf die Fassung vor der Änderung.
- Dateien: `docs/studio/STUDIO.md`, `.claude/agents/lead-*.md`, `.claude/agents/tech-*.md` (nur nach Ruling)
- Ruling: R314
- Start: 2026-10-08, Platz frei durch Rotation R319 (E-022, E-030 abgeschlossen); Handbuch 1.25 gilt seit 2026-10-08, Zählung der 3 Sessions ab Handbuch 1.27
- Datenpunkt S-2026-10-08-29c3791b (Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md)): 27,2 %; nur 7 von 27 Neuschreibungen > 20k nach Bash, 20 nach Turn-Ende (≈ 80 % Gewicht) — der mögliche Effekt von E-037 ist gedeckelt.
- Hinweis: Der frühere kombinierte E-037 (Hebel 1 und 5) war doppelt eingetragen; Hebel 5 steht unverändert als E-038.
- Endstand S-2026-10-08-29c3791b (Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) Nachtrag Teil 2): 24,3 %; 35 Neuschreibungen > 20k, 90 % des Gewichts nach Turn-Ende, davon eine L0-Neuschreibung nach 620 min Pause mit 25 % des Gewichts.
- Datenpunkt 2 von 3, S-2026-10-09-e90e097e (Retro [session-e90e097e-ende](retros/2026-10-09-session-e90e097e-ende.md)): 24,1 % (Schwelle ≤ 20 % nicht erreicht).
- Datenpunkt 3 von 3, S-2026-10-09-fb37ceac (Retro [session-fb37ceac-ende](retros/2026-10-09-session-fb37ceac-ende.md)): 31,7 %; Mittel 26,7 % (Schwelle ≤ 20 % verfehlt); Neuschreibungen nach Bash 31 % des Gewichts, davon der Grossteil unter Fremdlast (verwaister Vitest-Worker). Empfehlung Coach: **angepasst** (Regel bleibt als Hygiene, kein Cache-Write-Hebel; Platz an E-050); Urteil per Ruling offen.
- Messauftrag (R438 V1, Frist 2026-10-24, durch L0 oder Lead-Start, nicht durch den Coach): Probe, ob ein Vordergrundstart (`run_in_background: false`, Boolean) aus einem Lead greift; Messgrösse: Arbeiter läuft im Vordergrund und der Lead erhält den Rückgabewert ohne Polling (ja/nein). Greift er nicht, passt ein Handbuch-Minor die Vordergrund-Regel (ADR-007) an; Rückfall: Regel unverändert.
- Bewertung (R420): **angepasst**. Die Regel „lange Bash-Läufe im Hintergrund“ bleibt als Hygiene, ist aber kein Cache-Write-Hebel mehr; der Platz geht an E-050.

## E-038 · laufend (angepasst R420) · Lead-Schicht bei Ein-Umsetzer-Paketen schlank (Hebel 5)

- Hypothese: Wenn Leads bei Ein-Umsetzer-Paketen auf sonnet laufen oder die Lead-Schicht entfällt, sinken opus- und Steuerungsanteil ohne mehr Nacharbeit (Retro [proc-aufwandsverteilung](retros/2026-10-08-proc-aufwandsverteilung.md); R314). Hebel 2–4 erst nach Messung von E-037.
- Messgrösse (R420): Starts über der Modelltabelle (STUDIO.md, Abschnitt Modelle) ≤ 1 je Session (Ausgang 10 von 13 in fb37ceac) und opus-Anteil (Ausgang 74,1 %) ≤ 60 % über 3 Sessions; Steuerungsanteil (Ausgang 49,8 % Historie) ≤ 40 % weiter beobachtet; Gegenprobe: Review-Runden im Mittel ≤ 2 und Erstabnahme-Quote nicht schlechter.
- Zeitraum: 3 Sessions mit Ein-Umsetzer-Paketen.
- Rückfall: Handbuch und Lead-Personas auf die Fassung vor der Änderung.
- Dateien: `docs/studio/STUDIO.md`, `.claude/agents/lead-*.md`
- Ruling: R314
- Start: erst nach Bewertung von E-037 (getrennte Wirkung); frühestens 2026-10-22 (E-027-Stichtag), spätestens beim nächsten freien Platz. Die Regel 1.25 „Ein-Umsetzer-Pakete“ gilt bereits; die Messung beginnt erst mit dem Start. Reihenfolge der Plätze: E-037, E-042, danach E-038 (R319).
- Anpassung vorgeschlagen (Retro [session-fb37ceac-ende](retros/2026-10-09-session-fb37ceac-ende.md) V1): Die Modelltabelle sieht sonnet für Controller, lead-qa-Gate-Urteile, lead-production und Kurz-Retro schon vor; in fb37ceac liefen 10 von 13 Lead-/Coach-Starts trotzdem auf opus. Mechanik neu: (a) `metriken/richtwerte.md` Spalte „Modell“ → „gemessen auf“; (b) Werkzeug TOOL-MODELL-GUARD prüft typisierte Persona-Starts gegen das Frontmatter (opus nur mit Tabellen-Ausnahme in der Kopfzeile `Modell:`), Ampelzeile zählt sie mit. Messgrösse zusätzlich: Starts über der Tabelle ≤ 1 je Session (Ausgang 10). Der Stichtag 2026-10-22 entfällt (E-027 abgeschlossen, R350). Status bis zum Ruling unverändert.
- Start: 2026-10-09 (R420, Handbuch 1.36); der Stichtag 2026-10-22 entfällt. Werkzeug-Paket TOOL-MODELL-GUARD folgt; bis dahin zählt die Messung die Starts per Hand aus den Spawn-Events. Das Einsatzmodell bestimmt die Modelltabelle in STUDIO.md, nicht die Spalte in `richtwerte.md`.
- Datenpunkt 1 von 3, S-2026-10-09-c64c0775 (Retro [session-c64c0775-ende](retros/2026-10-09-session-c64c0775-ende.md) B3): 0 von 40 Starts über der Tabelle (Ausgang 10 von 13); opus-Anteil 68,4 % (Schwelle ≤ 60 % verfehlt); Gegenprobe Review-Runden 1,00, Erstabnahme 100 % erfüllt. `modelguard` ab Merge im Modus `warn`, die Wirkung kommt bisher von der Kopfzeile. Weiter beobachten.
- Datenpunkt 3 von 3, S-2026-10-10-2cfa57e0 (Retro [session-2cfa57e0-ende](retros/2026-10-10-session-2cfa57e0-ende.md) B3): 0 Starts über der Tabelle, opus 74,4 % (Schwelle ≤ 60 % zum zweiten Mal verfehlt), Steuerung bereinigt 25,2 %, Review-Runden 1,00. Urteil **angepasst** (R459): die opus-Schwelle wird nicht mehr hier, sondern in E-054 (Pläne auf sonnet) verfolgt, weil die opus-Starts aus Plan-, Spec- und Review-Starts laut Tabelle stammen; Messgrössen Starts über der Tabelle ≤ 1 je Session und Steuerung ≤ 40 % bleiben hier. Rückfall unverändert.
- Datenpunkt 2 von 3, S-2026-10-10-c64c0775 (Retro [session-c64c0775-b-ende](retros/2026-10-10-session-c64c0775-b-ende.md) B5): 0 von 39 Starts über der Tabelle (erfüllt); opus-Anteil 66,5 % (verfehlt); Steuerung bereinigt 37,6 % (≤ 40 % erfüllt), roh 68,7 %; Review-Runden 1,00, Erstabnahme 100 % erfüllt. `modelguard` `deny` seit 1.38: 0 Blockaden, 0 Fehlalarme. Weiter beobachten.

## E-039 · übernommen (R315) · Vergleichsart im Perf-Artefakt

- Hypothese: Wenn jede Perf-Ablage im Dateinamen die Vergleichsart und im Kopf die beiden Stände (`aa-` bzw. `ab-<A>-vs-<B>`, Commit-Hashes) nennt und L0 nur Zahlen aus dem Lead-Bericht meldet, wird kein A/A-Lauf mehr als A/B gelesen (Retro [session-8ef9d27f-ende](retros/2026-10-08-session-8ef9d27f-ende.md) B1).
- Messgrösse: 0 Fehlzitate von Perf-Werten in Rulings und Nutzermeldungen in den nächsten 3 Release-Läufen (Stichprobe: Ruling-Zahl gegen Gate-Bericht; Ausgang 1 Fall in 1 Lauf). Gegenprobe: Perf-Auswertung bleibt mit denselben Dateien möglich.
- Zeitraum: die nächsten 3 Release-Läufe.
- Rückfall: Satz im Handbuch streichen; Namensschema ist rein lesend.
- Dateien: `docs/studio/STUDIO.md` (Release-Lauf), `.claude/agents/lead-qa.md`; Kopfzeile in `tools/render-qa/perf.mjs` nur als späteres Werkzeug-Paket
- Ruling: R315

## E-040 · vorgeschlagen · Bau-Ruckel-Szenario im Perf-Werkzeug

- Hypothese: Wenn `perf.mjs` ein Szenario „n Gebäude im laufenden Spiel bauen“ misst und je Bau die Frames > 25 ms zählt, fällt ein Bau-Ruckeln im Häppchen statt im Release-Lauf auf (Retro [session-8ef9d27f-ende](retros/2026-10-08-session-8ef9d27f-ende.md) B2; R313 (a)).
- Messgrösse: Ruckel-Frames je Bau, Schwelle: Kandidat ≤ main + 1 (Ausgang main 0, REL-07 4–6); in den nächsten 3 Optik-Releases 0 Ruckel-Befunde, die erst der Release-Lauf findet. Gegenprobe: `renderMedian`-Messung unverändert (neues Szenario ergänzt, ersetzt nichts).
- Zeitraum: die nächsten 3 Optik-Releases; Umsetzung als Werkzeug-Paket nach R305, Kosten rund ein Häppchen.
- Rückfall: Szenario aus `perf.mjs` entfernen (`git revert`).
- Dateien: `tools/render-qa/perf.mjs`, `docs/studio/STUDIO.md` (Abnahmekriterien Optik-Häppchen)
- Ruling: –

## E-041 · übernommen (R315) · Fortsetzungspunkt und Messskripte im Repo

- Hypothese: Wenn lange QA-Läufe nach jedem Teil eine Datei `.studio/qa/<id>/stand.md` (erledigt, offen, Fortsetzungspunkt) fortschreiben und Messskripte unter `tools/render-qa/` statt im Scratchpad liegen, übernimmt eine Folgeinstanz ohne Rekonstruktion (Retro [session-8ef9d27f-ende](retros/2026-10-08-session-8ef9d27f-ende.md) B3; ergänzt E-034 um die Lead-Seite).
- Messgrösse: bei den nächsten 3 Abbrüchen oder Zeitüberschreitungen eines QA-Laufs: 0 wiederholte Teilläufe und 0 Skripte nur im Scratchpad (Ausgang: 1 Abbruch, Seed 14 und Ruckel-Skript betroffen).
- Zeitraum: die nächsten 3 Abbrüche, höchstens 6 Wochen.
- Rückfall: Handbuch auf die Fassung vor der Änderung.
- Dateien: `docs/studio/STUDIO.md` (Release-Lauf), `.claude/agents/lead-qa.md`
- Ruling: R315

## E-043 · übernommen als Werkzeug (R356) · Zeitreserve lokal gegen geschätzte Runner-Zeit

- Hypothese: Wenn `make zeitreserve` lokal die gemessene Laufzeit mit dem beobachteten Runner-Faktor 3 hochrechnet und dann die Runner-Regel (Faktor 1, Schwelle 2000 ms) anwendet, fallen Zeittests ohne CI-Reserve vor dem Push auf (Retro [session-191cc1e4-ende](retros/2026-10-08-session-191cc1e4-ende.md) B2).
- Messgrösse: 0 rote CI-Läufe wegen `zeitreserve` in den nächsten 3 Pushes mit neuen oder geänderten Zeittests (Ausgang: 1 Fall in dieser Session, davor R318/R322). Gegenprobe: höchstens 2 lokale Meldungen, die der Runner nicht bestätigt (Vorabzählung: 4 Meldungen im Bestand).
- Messbarkeit: Der lokale Faktor 4 und die Runner-Regel bleiben in `rule.ts` unverändert erkennbar; die Hochrechnung läuft als zusätzlicher Modus, `.studio/zeitreserve.json` bleibt unverändert, damit rote Runner-Läufe weiter dieselbe Messgrundlage haben.
- Zeitraum: 3 Pushes mit Zeittest-Änderung, höchstens bis 2026-11-05.
- Rückfall: Zusatzmodus in `tools/zeitreserve/` und Makefile entfernen (`git revert`).
- Dateien: `tools/zeitreserve/rule.ts`, `tools/zeitreserve/check.ts`, `Makefile` (Paket TOOL-ZEITRESERVE-RUNNER, lead-tech)
- Ruling: R329 (Werkzeug-Paket TOOL-ZEITRESERVE-RUNNER aufs Board; Start in späterer Session; bis dahin `make zeitreserve` vor jedem Push), R356 (gebaut mit TOOL-ZEITRESERVE-RUNNER, `make zeitreserve` rechnet × 3 hoch; übernommen als Werkzeug, kein Experimentplatz)
- Messauftrag (R356, Coach je Session-Retro): die Messgrösse oben läuft weiter. Datenpunkt 1 ist der REL-09-Push (CI-Ergebnis stand bei der Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) aus); vor dem Merge zwei echte Funde (R363, R370).

## E-044 · vorgeschlagen · Worktree-Belegung vor jedem Agent-Start

- Hypothese: Wenn jeder Paketstart seine Worktree-Belegung (Pfad, Session-ID, Zeit) als Ereignis schreibt und der Guard einen Agent-Start im Worktree, den eine andere Session mit Heartbeat < 10 min belegt, mit Hinweis blockt, entstehen keine zwei Schreiber im selben Worktree auch bei zwei L0-Sessions (Retro [session-191cc1e4-ende](retros/2026-10-08-session-191cc1e4-ende.md) B1). Ergänzt E-034, das nur den Abbruch-Fall per Handbuchsatz regelt.
- Messgrösse: 0 Fälle von zwei Schreibern in einem Worktree in den nächsten 3 Sessions oder 4 Wochen (Ausgang: 3 Fälle paralleler L0, R107/R118, R274b, R324); Gegenprobe: 0 Fehlblocks bei Heartbeat > 10 min oder derselben Session.
- Messbarkeit: Blockierte Starts landen als Ereignis im Log (`events.jsonl`), so bleibt zählbar, wie oft der Schutz griff; die Zählung der Kollisionen ändert sich nicht.
- Zeitraum: 3 Sessions, höchstens bis 2026-11-12. Start erst bei freiem Platz (3 laufen: E-027, E-037, E-042; E-027 endet spätestens 2026-10-22).
- Rückfall: Guard-Prüfung ausschalten (`git revert`), Handbuch Ende 0a wie Fassung 1.27.
- Dateien: `tools/studio/guard.py`, `tools/studio/log.py`, `docs/studio/STUDIO.md` (Start, Punkt 5)
- Ruling: –

## E-045 · übernommen (R329) · Lastgrenze für Perf- und Ruckel-Messungen

- Hypothese: Wenn Perf- und Ruckel-Messungen nur bei 1-min-Load ≤ 4 gelten und der Bericht `uptime` vor und nach dem Lauf nennt, melden Berichte keine Regressionen mehr, die bei Wiederholung unter ruhiger Last verschwinden (Retro [session-191cc1e4-ende](retros/2026-10-08-session-191cc1e4-ende.md) B4).
- Messgrösse: In den nächsten 2 Perf-/Hitch-Messberichten nennen 100 % den Load; 0 Befunde, die lead-qa bei Load ≤ 4 nicht reproduziert (Ausgang: 1 Grundlast-Regression bei Load 6–15, R326/R327).
- Zeitraum: die nächsten 2 Perf- oder Hitch-Messungen, höchstens bis 2026-11-05.
- Rückfall: Satz aus dem Handbuch (Lastregel) streichen, Fassung vor der Änderung.
- Dateien: `docs/studio/STUDIO.md` (Lastregel), `.claude/agents/lead-art.md`, `.claude/agents/lead-qa.md` (nur nach Ruling)
- Ruling: R329

## E-046 · behalten (R420) · Ampelzeile „Actions-Minuten“

- Hypothese: Wenn `metrics.py --efficiency` den Monatsverbrauch an Actions-Minuten (Konto und Repo Inselreich) aus `gh api "/users/<login>/settings/billing/usage?year=…&month=…"` als Ampelzeile ausweist, fällt ein Verbrauchsanstieg in der nächsten Retro statt erst durch den Nutzer auf (Retro [session-56d273bd-ende](retros/2026-10-08-session-56d273bd-ende.md) B1; R333).
- Messgrösse: Zwei Zeilen: Inselreich-Minuten im Monat (grün ≤ 150, gelb > 150, rot > 400; Erwartung nach R334: 50–150) und Konto-Minuten (gelb > 1000, rot > 1600 von 2000). Die Zeile ist wirksam, wenn jede Session-Datei in den nächsten 3 Sessions sie mit Wert nennt (0 × „nicht erfasst“, ausser bei fehlendem `gh`) und kein Verbrauchsstand mehr erst durch den Nutzer entdeckt wird.
- Messbarkeit: Die Zeile steht zusätzlich zu den Token-Zeilen; keine bestehende Kennzahl und keine Schwelle ändert sich. Bei fehlendem `gh` oder fehlendem Token: „nicht erfasst“ statt Nullwert.
- Zeitraum: 3 Sessions, höchstens bis 2026-11-12.
- Rückfall: Änderung in `tools/studio/efficiency.py` bzw. `metrics.py` zurücknehmen (`git revert`).
- Dateien: `tools/studio/efficiency.py`, `tools/studio/metrics.py`, `tools/studio/tests/`, `docs/studio/verbesserung.md` (Schwellen; nur nach Ruling)
- Ruling: R344, R349
- Datenpunkt 1 von 3, S-2026-10-08-29c3791b: Monat 918, Konto 1182, Session 0 mit Wert; kein Verbrauch erst durch den Nutzer entdeckt.
- Datenpunkt 1 ergänzt (Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) Nachtrag Teil 2): Session-Minuten 8 (REL-09-Push), Monat 926, Konto 1192.
- Datenpunkt 2 von 3, S-2026-10-09-e90e097e (Retro [session-e90e097e-ende](retros/2026-10-09-session-e90e097e-ende.md)): Monat 934, Konto 1201, Session 8; kein Verbrauch erst durch den Nutzer entdeckt.
- Datenpunkt 3 von 3, S-2026-10-09-fb37ceac (Retro [session-fb37ceac-ende](retros/2026-10-09-session-fb37ceac-ende.md)): Monat 942, Konto 1210, Session 8 (Wert in `metrics.py --efficiency`, Abschnitt „Actions-Minuten“, nicht in der Session-Datei); kein Verbrauch erst durch den Nutzer entdeckt. Empfehlung Coach: **behalten**; Urteil per Ruling offen.
- Bewertung (R420): **behalten**. Die Zeile steht in allen 3 Session-Dateien mit Wert.

## E-047 · übernommen als Werkzeug (R350) · `log.py queue` formatiert selbst

- Hypothese: Wenn `log.py queue` nach dem Schreiben `npx prettier --write docs/studio/warteschlange.md` aufruft (bei fehlendem `npx` mit Warnung), bleibt `make check` nach jedem Warteschlangen-Eintrag grün, auch bei `*` oder `_` im Text (Retro [session-56d273bd-ende](retros/2026-10-08-session-56d273bd-ende.md) B2).
- Messgrösse: 0 rote `make check` wegen `docs/studio/warteschlange.md` in den nächsten 5 Einträgen (Ausgang: 1 von 1 Eintrag mit Glob-Text, N-98, rot); ein Test mit Eintrag `docs/**, **/*.md, a_b_c` besteht.
- Messbarkeit: Die Event-Zeile `queue` bleibt unverändert; nur die Datei wird nach dem Schreiben normalisiert.
- Zeitraum: die nächsten 5 Einträge, höchstens bis 2026-11-12.
- Rückfall: Aufruf entfernen (`git revert`); Hinweis in lernen.md bleibt.
- Dateien: `tools/studio/log.py` bzw. `tools/studio/studio_docs.py`, `tools/studio/tests/`
- Ruling: R344, R349 (angenommen), R350 (Werkzeug-Fix ohne offene Hypothese, Wirkung per Test belegt; kein Experimentplatz)

## E-048 · vorgeschlagen · Ist aus der Zählung am Gate, Richtwert für UI-Pakete mit Browser-Abnahme

- Hypothese: Wenn das Gate das Ist der Tool-Aufrufe aus der Budget-Zählung liest (nicht aus der Selbstangabe des Leads) und UI-Pakete mit Final-Review und Browser-Abnahme mit 150 statt 120 Tools budgetiert werden, entstehen weder Überzüge um mehr als 10 % noch widersprüchliche Selbstangaben (Retro [session-56d273bd-ende](retros/2026-10-08-session-56d273bd-ende.md) B3).
- Messgrösse: Bei den nächsten 3 UI-Paketen mit Browser-Abnahme: Ist ≤ 150 und Abweichung Selbstangabe gegen Zählung ≤ 10 % (Ausgang: TASTEN-KOMFORT 147/120, PANEL-UEBERSICHT 136/120, Selbstangabe „ca. 100“ gegen 136).
- Messbarkeit: Das höhere Budget verdeckt keinen Überzug, weil die Schwelle absolut (150) und gegen die Zählung gelesen wird; die Schätzung-gegen-Ist-Zeile der Metrik bleibt unverändert.
- Zeitraum: 3 UI-Pakete, höchstens bis 2026-11-19. Ergänzender Messauftrag (B4): Ergebnis des CI-Laufs nach dem ersten `zeitreserve-push` im Bericht der nächsten Retro nennen.
- Rückfall: Handbuchsätze (Budget, Gate) auf die Fassung vor der Änderung.
- Dateien: `docs/studio/STUDIO.md` (Budget-Zählung, Gate Merge; nur nach Ruling)
- Ruling: R344, R349 (angenommen; wartet auf Platz, höchstens 3 laufend, R350; Handbuch-Sätze und Version 1.31 zurückgenommen)

## E-049 · laufend (angepasst R420) · Steuerungsanteil bereinigt um Plan- und Messpakete

- Hypothese: Wenn `metrics.py --efficiency` neben dem Steuerungsanteil eine Zeile „Steuerungsanteil bereinigt“ ausweist, die Lead-Instanzen mit Plan-, Spec-, Brainstorm- oder Messpaketen (Paketname enthält `PLAN`, `SPEC`, `BRAIN`, `PERF` oder `MESS`; Liste in `efficiency.py`) herausrechnet, lässt sich die Wirkung von E-042 und E-038 auf die eigentliche Steuerung getrennt lesen (Retro [m12](retros/2026-10-08-m12.md) B4; Messauftrag R344).
- Messgrösse: In 3 Session-Dateien steht die Zeile mit Wert (0 × „nicht erfasst“); Gegenprobe: bereinigt plus herausgerechnete Lead-Pakete plus L0 ergibt den Rohwert auf 0,1 Prozentpunkte. Ausgang M12: roh 59,3 %, bereinigt ≈ 41,7 % (Handrechnung aus `lead_stats.rows`). Schwellen wie die Rohzeile (gelb > 40 %, rot > 50 %).
- Messbarkeit: Die Rohzeile und ihre Schwellen bleiben unverändert; die neue Zeile ist zusätzlich. Pakete ohne erkennbaren Namen zählen zur Steuerung (konservativ).
- Zeitraum: 3 Sessions nach dem Merge, höchstens bis 2026-11-19.
- Rückfall: Zeile in `tools/studio/efficiency.py` entfernen (`git revert`).
- Dateien: `tools/studio/efficiency.py`, `tools/studio/metrics.py`, `tools/studio/tests/`, `docs/studio/verbesserung.md` (Schwellen; nur nach Ruling)
- Ruling: R410 (V3): startet, sobald E-046 bewertet ist (spätestens 2026-11-12; Hebel nach R316)
- Anpassung vorgeschlagen (Retro [session-fb37ceac-ende](retros/2026-10-09-session-fb37ceac-ende.md) V2): Der Namensfilter trifft in fb37ceac keine Instanz (alle Lead-Pakete heissen `I-028`, `REL-…`, `BEOB-…`). Herausgerechnet werden stattdessen Lead-Instanzen mit „Budget: keins“ in der Briefing-Kopfzeile (`prompt_head` im `spawn`-Event): 7 von 12, bereinigt ≈ 39–45 % gegen roh 58,8 %. Gegenprobe neu: roh = bereinigt + herausgerechnete Lead-Instanzen. Status bis zum Ruling unverändert.
- Start: 2026-10-09 (R420, Handbuch 1.36): Bereinigung nach der Briefing-Zeile „Budget: keins“ statt nach Paketname; Gegenprobe roh = bereinigt + herausgerechnete Lead-Instanzen. Umsetzung in `efficiency.py` als eigenes Werkzeug-Paket.
- Datenpunkt 1 von 3, S-2026-10-09-c64c0775 (Retro [session-c64c0775-ende](retros/2026-10-09-session-c64c0775-ende.md) B2): roh 71,7 %, bereinigt 69,6 %, herausgerechnet 2,0 Punkte (2 von 14 Lead-Instanzen); Gegenprobe roh = bereinigt + herausgerechnet erfüllt. Der Filter trifft die Plan-Instanzen (35,4 %) nicht. Anpassung vorgeschlagen (Retro V2): Klassen und Bereinigung nach Freigabephase `plan-*`, `design-*`, `gate-*` plus „Budget: keins“; Ausgang bereinigt ≈ 30 %. Status bis zum Ruling unverändert.
- Anpassung umgesetzt (R433 V2, TOOL-BUENDEL-2, 319fa8bc): herausgerechnet werden Lead-Instanzen mit Freigabephase `plan-*`/`design-*`/`gate-*` (Zuordnung `claim_budgets`) oder „Budget: keins“; die Zeile nennt den Anteil je Grund. Rohzeile und Klassen unverändert (Entscheid E1 im Plan); Messgrösse ‚Klasse Design/Spec/Plan > 0‘ gelesen als ‚herausgerechnet Plan > 0 bei Plan-Instanzen‘. Zählung der Datenpunkte beginnt mit der ersten Session nach dem Merge neu; Frist 2026-11-19 unverändert.
- Datenpunkt 1 von 3 nach der Anpassung, S-2026-10-10-c64c0775 (Retro [session-c64c0775-b-ende](retros/2026-10-10-session-c64c0775-b-ende.md) B2): roh 68,7 %, bereinigt 37,6 %, herausgerechnet 31,1 Punkte (Plan 16,2, Design 1,7, Gate 0,0, nur Budget keins 13,2; 5 von 11 Lead-Instanzen); Gegenprobe erfüllt. Weiter beobachten.

## E-050 · behalten (R459) · Fortsetzung nach Pause als frische Instanz (Umsetzer)

- Hypothese: Wenn ein Lead einen Umsetzer, dessen letzter Turn mehr als 5 min zurückliegt und dessen Kontext über 40k liegt, für Fix-Runde oder Folge-Task nicht per `SendMessage` fortsetzt, sondern eine neue Instanz mit Review-Befund, Commit-Stand und Dateiliste als Briefing startet, sinken die 5-min-Neuschreibungen der Umsetzer nach Turn-Ende, ohne dass Review-Runden steigen (Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) B2; Pflicht-Hebel Cache-Write, Dauer-Rot).
- Messgrösse: Umsetzer-Neuschreibungen > 20k nach Turn-Ende je Umsetzer-Instanz ≤ 0,2 über 3 Sessions mit Umsetzern (Ausgang S-2026-10-08-29c3791b: 7 in 12 Instanzen von art-rendering-engineer, tech-ui-engineer, tech-sim-engineer ≈ 0,58, Gewicht ≈ 350k). Gegenprobe: Cache-Write der Folgeinstanz gesamt kleiner als die ersetzte Neuschreibung (Stichprobe 3 Fälle aus `rewrite_stats` und Instanzdaten), Review-Runden im Mittel ≤ 2, Erstabnahme nicht schlechter.
- Messbarkeit: `rewrite_stats.by_role` zählt je Rolle; E-042 zählt nur Leads, E-037 nur Neuschreibungen nach Bash — die drei Wirkungen bleiben getrennt lesbar. Der Cache-Write-Anteil der Ampel bleibt unverändert.
- Zeitraum: 3 Sessions mit Umsetzern, höchstens bis 2026-11-19; Start erst bei freiem Platz.
- Rückfall: Satz in `STUDIO.md` (Delegation, Fix-Runden) und in den Lead-Personas entfernen; Fortsetzung per `SendMessage` wie bisher.
- Dateien: `docs/studio/STUDIO.md`, `.claude/agents/lead-*.md` (nur nach Ruling)
- Ruling: –
- Ruling: R420 (Start 2026-10-09, Handbuch 1.36)
- Datenpunkt 1 von 3, S-2026-10-09-c64c0775 (Retro [session-c64c0775-ende](retros/2026-10-09-session-c64c0775-ende.md)): 0 Umsetzer-Neuschreibungen > 20k in 8 Umsetzer-Instanzen (Schwelle ≤ 0,2 erfüllt); Gegenprobe Review-Runden 1,00 erfüllt. Einschränkung: kurze Läufe (Kontext Mittel 38k) lassen die 40k-Schwelle kaum greifen; Fix-Runde T07 lief als frische Instanz.
- Datenpunkt 2 von 3, S-2026-10-10-c64c0775 (Retro [session-c64c0775-b-ende](retros/2026-10-10-session-c64c0775-b-ende.md)): 0 Umsetzer-Neuschreibungen > 20k nach Turn-Ende in 6 Umsetzer-Instanzen (eine nach Bash/Agent, nicht gezählt); Review-Runden 1,00 erfüllt. Kontext Mittel 36k, Schwelle greift kaum.
- Datenpunkt 3 von 3, S-2026-10-10-2cfa57e0 (Retro [session-2cfa57e0-ende](retros/2026-10-10-session-2cfa57e0-ende.md) V4): 0 Umsetzer-Neuschreibungen > 20k in 5 Umsetzer-Instanzen, Review-Runden 1,00. Urteil **behalten** (R459). Fortgeführter Nachtrag S-2026-10-10-5a00a316: 2 Neuschreibungen > 20k in 16 Umsetzer-Instanzen (tech-sim 1, tech-ui 1; ≈ 0,13 je Instanz, Schwelle ≤ 0,2 gehalten; Rollentabelle, nicht nach Turn-Ende getrennt).

## E-051 · übernommen als Werkzeug (R375, R380) · Werkzeug-Riegel für volle Testläufe

- Hypothese: Wenn `make check`, `make test` und `make zeitreserve-push` vor dem vollen Vitest-Lauf eine Sperre `.studio/locks/vitest` atomar nehmen (`mkdir`, darin PID, Paket, Zeit; Sperre eines toten PID gilt als frei) und bei belegter Sperre oder 1-min-Load > 8 mit Hinweis abbrechen statt zu blockieren, laufen nie zwei volle Läufe zugleich und kein Gate-Urteil entsteht unter Fremdlast (Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) B4; R357, R369).
- Messgrösse: 0 Fälle zweier gleichzeitiger voller Vitest-Läufe und 0 Gate-Läufe bei Load > 8 in 3 Sessions mit ≥ 3 parallelen Strängen (Ausgang S-2026-10-08-29c3791b: Load 57 (R357), `make check` bei Load 12,7 mit fremdem Lauf (R369), Playtester gegen R329 (R369), Echtprobe wegen Last ausgefallen (R362)). Gegenprobe: 0 hängende Sperren; Abbrüche je Session sichtbar und Wartezeit bis zum erfolgreichen Lauf im Median ≤ 10 min.
- Messbarkeit: Sperr-Ereignisse (genommen, abgebrochen, verwaist freigegeben) als Event in `.studio/events.jsonl`, so bleibt zählbar, wie oft der Riegel griff. Abbruch statt Blockieren hält Bash-Aufrufe kurz (keine neue Cache-Pause, E-037).
- Zeitraum: 3 Sessions mit Parallelität, höchstens bis 2026-11-19. Werkzeug ohne offene Hypothese zur Regel selbst: L0 kann es wie E-043/E-047 als Werkzeug-Paket führen (Messauftrag statt Platz).
- Rückfall: Sperre in `Makefile` entfernen (`git revert`); R357 gilt weiter als Handbuchsatz.
- Dateien: `Makefile`, `tools/studio/` (kleines Sperr-Skript), `tools/studio/tests/` (Paket TOOL-TESTLOCK, lead-tech, ≈ 40 Tools)
- Ruling: R375 (als Werkzeug ohne Experimentplatz), R380 (Merge TOOL-TESTLOCK), R387 (FIX-TESTLOCK-RACE)
- Datenpunkt S-2026-10-08-29c3791b (Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) Nachtrag Teil 2 B11): Echtprobe zweier `make test` — zweiter bricht ab (R380); eigener ABA-Wettlauf ≈ 3 von 100 Runden gefunden und behoben (R385, R387).

## E-052 · übernommen als Vorlagenzeile (R392) · Testzeit-Ausgang vor Task 1

- Hypothese: Wenn das Briefing für Pakete mit `src/`-Änderung vor Task 1 die Zeiten der berührten Tests auf main verlangt (`npx vitest related --run <geplante src-Dateien>`, Tests > 200 ms in den Plan) und die Abnahme dieselben Dateien A/B main/Branch unmittelbar nacheinander vergleicht, werden Testzeit-Regressionen bestehender Tests im Plan geschätzt und vor dem Merge-Stand gefunden (Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) Nachtrag Teil 2 B8, B9; R370, R385, R386, R388).
- Messgrösse: In den nächsten 3 Paketen mit `src/`-Änderung 0 Merge-Abbrüche und 0 Mehrbedarfs-Freigaben wegen Testzeiten bestehender Tests (Ausgang S-2026-10-08-29c3791b: 3 Pakete, KORRIDOR 40 Tools und 3 Merge-Abbrüche). Gegenprobe: Mehraufwand der Messung ≤ 5 Tools je Paket; keine gestrichenen Prüfschritte des Plans.
- Messbarkeit: Der Ausgang steht im Plan, das A/B im Bericht; `zeitreserve` bleibt unverändert als unabhängige Gegenprobe.
- Zeitraum: 3 Pakete mit `src/`-Änderung, höchstens bis 2026-11-19.
- Rückfall: Briefing-Vorlage und Handbuch 1.31. Stufe 2 bei Misserfolg: `zeitreserve` gegen main-Baseline je Test (Werkzeug, nach E-053).
- Dateien: `docs/studio/templates/briefing.md`, `docs/studio/STUDIO.md`, `docs/studio/CHANGELOG.md` (nur nach Ruling)
- Ruling: R392 (Vorlagenzeile ohne Experimentplatz wie E-043/E-047; die Messgrösse gilt als Messauftrag des Coachs, Bewertung nach 3 Paketen)
- Start: 2026-10-09, Handbuch 1.32

## E-053 · übernommen als Werkzeug (R394, TOOL-GATES-2b) · `zeitreserve` urteilt nach Fremdlast vor dem Lauf

- Hypothese: Wenn `zeitreserve` `strict` urteilt, sobald die Last vor dem Lauf ≤ 4 ist und die Testsperre (E-051) gehalten wird, statt `max(loadStart, loadEnd) ≤ 4` zu verlangen, wird die Messung am Push-Gate auf ruhigem Rechner belastbar, ohne dass rote CI-Läufe wegen Zeittests zunehmen (Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) Nachtrag Teil 2 B10; R385 (3): Start 2,8 → Ende 9,8; `tools/zeitreserve/reporter.ts:54`, `rule.ts:116`).
- Vorbedingung: lead-tech belegt, dass Faktor 4 und Runner ×3 (E-043) aus vollen Läufen mit Eigenlast kalibriert sind; sonst entfällt der Vorschlag.
- Beleg (TOOL-GATES-2): nicht belegbar, Vorschlag entfällt. Faktor 4 stammt aus Einzeltests (R302: 2 s lokal, 8,1 s Runner; H-T4: 4,97 s), Faktor 3 aus Retro session-191cc1e4 und E-043 (Commit afb14a8, 2026-10-08 13:11). Die Last wird erst seit c69938d (R353, 18:54) mitgemessen; für beide Faktoren gibt es keine Lastangabe und keinen Beleg für volle Läufe mit Eigenlast. Ein Datenpunkt (Retro prozess-rel08) liegt bei 1,8.
- Entscheid (R394): Vitest lastet die 10 Kerne selbst aus, `loadMax ≤ 4` ist mit vollem Lauf nicht erreichbar (Start 2,7 → Ende 10,3). Die Faktoren stammen aus Einzeltests ohne Eigenlast, Messungen unter Eigenlast überschätzen die Runner-Zeit: Fehlalarme möglich, verpasste Regressionen nicht (Einzellauf bei ruhiger Last klärt, R391); die Vorbedingung gilt damit als erfüllt (R393 hatte sie zu eng gelesen).
- Messgrösse: 0 Urteile `unreliable` in den nächsten 3 Push-Gates mit `loadStart ≤ 4`. Gegenprobe: Messauftrag E-043 (0 rote CI-Läufe wegen `zeitreserve` in 3 Pushes mit Zeittest-Änderung).
- Messbarkeit: `loadStart`, `loadEnd` und `loadMax` bleiben in der Ausgabe; die alte Regel bleibt je Lauf nachrechenbar.
- Zeitraum: 3 Push-Gates, höchstens bis 2026-11-19.
- Rückfall: `git revert` der Änderung in `tools/zeitreserve/`.
- Dateien: `tools/zeitreserve/rule.ts`, `tools/zeitreserve/reporter.ts`, `tests/tools/` (Paket lead-tech, ≈ 15 Tools)
- Ruling: –

## E-054 · laufend (R459) · Plan-Instanz bei Stufe leicht und Werkzeug-Paketen auf sonnet

- Hypothese: Wenn Pläne für Stufe-leicht-Häppchen und Werkzeug-Bündel (kein Architekturentscheid, kein Save, kein neuer Spielwert) von `lead-tech` auf sonnet statt opus geschrieben werden, sinkt das Kostengewicht der Plan-Instanz um den Modellfaktor (0,6), ohne dass die Gate-Plan-Befunde zunehmen (Retro [session-c64c0775-ende](retros/2026-10-09-session-c64c0775-ende.md) B2; Ausgang `REL-14-PLAN` 1,38 M, `TOOL-BUENDEL` 2,01 M, zusammen 35,4 % der Session).
- Messgrösse: Kostengewicht je Plan-Instanz ≤ 60 % des Ausgangs bei vergleichbarem Umfang und Steuerungsanteil bereinigt (E-049) ≤ 40 % über 3 Pläne; Gegenprobe: Gate-Plan-Befunde je Plan nicht über Ausgang (REL-14: 5, Bündel: 12, alle nicht blockierend) und 0 blockierende, Review-Runden im Mittel ≤ 2, Erstabnahme nicht unter 90 %.
- Messbarkeit: `lead_stats.rows` und die Gate-Rulings bleiben unverändert lesbar.
- Zeitraum: 3 Pläne, höchstens bis 2026-11-19; Start erst bei freiem Platz.
- Rückfall: Modelltabelle (Zeile „Tech-Lead beim Plan“) und `lead-tech.md` auf die Fassung vor der Änderung.
- Dateien: `docs/studio/STUDIO.md` (Modellwahl), `.claude/agents/lead-tech.md`, `docs/studio/CHANGELOG.md` (nur nach Ruling)
- Ruling: R459 (Start 2026-10-10, erster Fall UI-GUT-CHIP R461, zweiter TOOL-BUENDEL-4 R464)
- Datenpunkt 1 und 2 von 3, S-2026-10-10-5a00a316 (Retro [session-5a00a316-ende](retros/2026-10-10-session-5a00a316-ende.md) B1): Plan-Instanz `UI-GUT-CHIP` Gewicht 0,46 M in 25 Turns (≈ 33 % des Ausgangs REL-14-PLAN 1,38 M), `TOOL-BUENDEL-4` 0,23 M in 15 Turns (≈ 11 % von 2,01 M); Tools Plan + Nacharbeit 15 + 8 bzw. 11 + 4. Gate-Plan-Befunde 9 (UI-GUT-CHIP) und 6 (Bündel), je 0 blockierend, Nacharbeit ohne Zweitprüfung (R462, R465). Kostenschwelle ≤ 60 % je Plan erfüllt; die Befundzahl 9 liegt über dem Ausgang REL-14 (5), unter dem des Bündels (12) — Vergleichsbasis uneinheitlich, bei n = 2 kein Urteil. Vorbehalt Umfang: UI-GUT-CHIP Plan T01–T08, Bündel T01–T07 + T08; Umfang des Ausgangs nicht gegengeprüft. Messlücke: Steuerung bereinigt (E-049) war in dieser Session nicht auswertbar (Retro B2); opus-Anteil Session 37,0 % (Historie 71,1 %), durch den Modellwechsel allein nicht erklärbar (Session ohne Spec-Autor). Weiter beobachten, Datenpunkt 3 beim nächsten Plan.

## E-055 · übernommen als Werkzeug (R443, TOOL-BUENDEL-3) · Warnung bei Lead-Start mit Budgetzeile ohne Freigabe

- Hypothese: Wenn der Spawn-Hook bei einem Lead-Start, dessen Kopfzeile „Budget: n …“ (n > 0) lautet, im Session-Log keine Zeile `kind: budget` derselben Rolle findet und eine Warnung ausgibt (`warn`, kein Blocken), entstehen keine Budget-Vorfälle „ohne Freigabe“ mehr (Retro [session-c64c0775-b-ende](retros/2026-10-10-session-c64c0775-b-ende.md) B1; R440).
- Messgrösse: 0 Budget-Vorfälle „ohne Freigabe“ oder „n von m“ durch fehlende Freigabezeile in 3 Sessions (Ausgang 1 in c64c0775-b); Gegenprobe: 0 Fehlwarnungen bei „Budget: keins“ und bei Folge-Controllern (R433 V3 b).
- Messbarkeit: Das Dashboard zählt unverändert; die Warnung ist nur zusätzliche Ausgabe.
- Zeitraum: 3 Sessions nach dem Merge, höchstens bis 2026-11-19; Start bei freiem Platz oder als Werkzeug ohne Platz (Entscheid L0, wie E-051).
- Rückfall: Hook-Zweig entfernen (`git revert`).
- Dateien: `tools/studio/budgetwarn.py`, `tools/studio/modelguard.py`, `tools/studio/tests/`
- Ruling: R443, Gate Merge TOOL-BUENDEL-3
- Start: mit Merge
- Bewertung: –

## E-056 · vorgeschlagen (wartet auf Platz) · Beobachtungs-Einträge erst im letzten Commit nach `git merge main`

- Hypothese: Wenn Stränge ihre Einträge in `docs/beobachtungen.md` erst als letzten Commit vor „bereit“ und nach `git merge main` schreiben, entstehen bei der Konfliktprobe keine Konflikte in dieser Datei (Retro [session-2cfa57e0-ende](retros/2026-10-10-session-2cfa57e0-ende.md) B3; R458).
- Messgrösse: 0 Konflikte in `docs/beobachtungen.md` bei `git merge-tree` in 3 Merges, die die Datei berühren (Ausgang 3 Fälle, zuletzt R458); Gegenprobe: 0 verlorene Einträge.
- Messbarkeit: Konfliktprobe und Diff der Datei bleiben unverändert lesbar.
- Zeitraum: 3 Merges, höchstens bis 2026-11-19.
- Rückfall: Pflichtzeile streichen; Eigentümer löst Konflikte wie bisher (R303, E-031).
- Dateien: `docs/studio/templates/briefing.md`, `.claude/agents/lead-tech.md` (nur nach Ruling)
- Ruling: –

## E-057 · vorgeschlagen (wartet auf Platz) · Grosse Dateien gezielt lesen

- Hypothese: Wenn Briefings für Dateien über 30 KB (README, `docs/ideen.md`, Specs, Pläne) den benötigten Abschnitt oder Zeilenbereich nennen und Teillesen (`offset`/`limit`) vorschreiben, sinken die Lese-Ergebnisse über 30 KB und mit ihnen der Cache-Write-Anteil (Retro [session-2cfa57e0-ende](retros/2026-10-10-session-2cfa57e0-ende.md) Ampel; Pflichthebel R316).
- Messgrösse: Lese-Ergebnisse > 30 KB je Session ≤ 2 (Ausgang 4) und Cache-Write-5-min-Anteil der Session ≤ 18 % (Ausgang 20,2 %) über 3 Sessions; Gegenprobe: Review-Runden im Mittel ≤ 1,5, Erstabnahme ≥ 90 %.
- Messbarkeit: Liste „Grösste Lese-Ergebnisse“ und Kostenart der Metrik-Datei bleiben unverändert.
- Zeitraum: 3 Sessions, höchstens bis 2026-11-19.
- Rückfall: Pflichtzeile und Persona-Satz streichen.
- Dateien: `docs/studio/templates/briefing.md`, `.claude/agents/lead-*.md` (nur nach Ruling)
- Ruling: –

## E-058 · umgesetzt (Vorlagenzeile, kein Platz; R459, R464) · Integrator-Briefing nennt beide Prüfbefehle

- Hypothese: Wenn die Pflichtzeile „Integrator“ `make check` und `make check-ci-perf` mit Exit-Code im Bericht nennt und die Persona klarstellt, dass sie auch bei schweigendem Briefing gilt, läuft der Perf-Lauf in jedem Merge (Retro [session-2cfa57e0-ende](retros/2026-10-10-session-2cfa57e0-ende.md) B4).
- Messgrösse: 3 von 3 Integrator-Merge-Berichten nennen `make check-ci-perf` mit Exit-Code (Ausgang 0 von 3); Gegenprobe: Merge-Dauer des Integrators ≤ 8 min.
- Messbarkeit: Die Berichte im Archiv bleiben die Quelle, die Zählung ändert sich nicht.
- Zeitraum: 3 Merges, höchstens bis 2026-11-19.
- Rückfall: Zeile und Persona-Satz streichen.
- Dateien: `docs/studio/templates/briefing.md`, `.claude/agents/production-integrator.md` (nur nach Ruling)
- Ruling: R459, R464 (Umsetzung mit Handbuch 1.43 und Persona production-integrator 1.9; Beobachtung läuft über die nächsten 3 Merges)
