# Retro session session-191cc1e4-ende — 2026-10-08

- Datum: 2026-10-08
- Art: session (gebündelt mit Ad-hoc „CI auf main rot“)
- Auslöser: Session-Ende 191cc1e4; `ci:37763554612`; Vorfall Kollision (R324, R325)
- Datenbasis: `docs/studio/metriken/S-2026-10-08-191cc1e4.md`, `docs/studio/rulings.md` (R323–R328), `tools/zeitreserve/rule.ts`, `.studio/zeitreserve.json`, `docs/studio/STUDIO.md` (Ende 0a, Lastregel), `git worktree list`. Kurz-Retro, keine Leads befragt (Auftrag mit Befunden von L0; Berichte als Rulings gelesen).

## Befunde

### B1 · Zwei L0-Sessions, ein Worktree (R324/R325)

- Beobachtung: Zwei L0-Sessions starteten lead-art auf FIX-REL07 im selben Worktree `.worktrees/rel07-aufloesung`; ein Engineer setzte `forest.ts`, `iso.ts`, `renderer.ts` zurück, die `__prof`-Hooks der anderen Session gingen verloren. Die Session sah ungecommittete Änderungen und deutete sie als „Vorinstanz“.
- Beleg: `docs/studio/rulings.md` R324, R325; Handbuch Ende 0a (seit 1.24) verlangt die Prüfung von Worktree-HEAD und Dashboard, galt aber nur für den Neustart nach Abbruch.
- Deutung: Der Satz steht im Abschnitt Abbruch/Session-Ende; eine zweite L0-Session wendet ihn nicht an, weil sie sich nicht als Neustart sieht. Es ist der dritte Fall paralleler L0 (R107/R118, R274b, R324): Hinweis reicht offenbar nicht, ein mechanischer Schutz fehlt. E-034 ist angenommen, wartet aber auf einen Platz und deckt diesen Weg nicht ab.
- Wirkung: Arbeiterstunde verloren, Doppelarbeit an (a), Zwischenstand c94e99a gerettet (R325).

### B2 · CI rot trotz grünem lokalem `make check` (R328)

- Beobachtung: `make zeitreserve` wurde auf dem Runner rot (decorSea: `shipAt` 3596 ms, Tönung 3123 ms), lokal grün auch mit `CI=true`.
- Beleg: `tools/zeitreserve/rule.ts`: Fehler erst ab `FAIL_DURATION_MS` = 2000 ms, Faktor 4 lokal, 1 auf `GITHUB_ACTIONS`. Lokale Zeiten derselben Tests: 1218 und 1196 ms (`.studio/zeitreserve.json`), also unter der Schwelle, nie geprüft. `CI=true` setzt `GITHUB_ACTIONS` nicht.
- Deutung: Das Verhältnis Runner : lokal beträgt hier ≈ 3 (3,0 und 2,6); die Prüfung ist lokal blind für Tests zwischen etwa 670 und 2000 ms. Die frühere Lehre „Timeout ≥ 5 × lokale Laufzeit“ (lernen.md) wird nicht erzwungen. Dritter roter Lauf dieser Art nach R318/R322.
- Wirkung: Ein roter main-Lauf nach dem Release, Trivial-Fix R328, kein Produktschaden.

### B3 · lead-art rund 40 Tools über Schätzung, ohne Antrag

- Beobachtung: lead-art 185 Tool-Aufrufe in 3 Instanzen, 68 min (Metrik-Datei); R326 (6) nennt rund 40 über der Schätzung ohne Antrag. Handbuch verlangt den Antrag vor dem Überschreiten (`templates/budgetantrag.md`).
- Deutung: Ursachen laut L0: Kollision (B1) und Messungen auf zwei Fenstergrössen. Die Regel besteht; es fehlt keine neue Regel. Mit nur einem Vorfall ist ein weiterer Hebel nicht belegt.
- Wirkung: Überschreitung ohne Entscheid von L0; über R326 nachträglich erfasst.

### B4 · Messung unter Last (Last 6–15)

- Beobachtung: lead-art meldete eine Grundlast-Regression (Seed 7, rund 5 verlorene Frames je 900 ms), die lead-qa bei Last ≤ 4 nicht fand (0,28 Frames, Seed 14: 0).
- Beleg: R326 (2), R327.
- Deutung: Die Lastregel (E-030, Handbuch Lastregel) knüpft an parallele `vitest`-/`make check`-Läufe per `ps`, nicht an eine Zahl, und nennt Browser-Messungen nur im Zusammenhang mit roten Zeittests. Eine Schwelle „1-min-Load ≤ 4“ steht nirgends. Gegenprobe heute: `uptime` 2,24.
- Wirkung: Eine ganze Prüfrunde (Gate R326, Nachprüfung lead-qa 46 min) wurde nötig, die R326 durch die Bedingung zwar sauber auffing.

### B5 · Worktree-Halde

- Beobachtung: 24 Worktrees unter `.worktrees/`; 20 Branches sind in main enthalten, keiner hat ungesicherte Änderungen (`git merge-base --is-ancestor`, `git status --porcelain`).
- Deutung: Reines Aufräumen ist gefahrlos möglich (`git worktree remove` ohne `--force`); die Halde erhöht das Verwechslungsrisiko aus B1 (mehr Pfade, die belegt wirken). Direkter Kostenbeleg fehlt; kein Experiment, nur Handbuch-Vorschlag.

### B6 · Positiv

- Nutzerwünsche „nur aufnehmen“ (R323): 1 Start, 7 Tool-Aufrufe, Ist-Stand-Prüfung vor dem Eintrag I-022…I-026. Das bedingte Gate-Ruling R326 sparte eine Fix-Runde (R327: Bedingung griff nicht). Erstabnahme-Quote 100 %, 0 Nacharbeit (Metrik-Datei). Beides als Muster behalten, kein Handlungsbedarf.

## Effizienz-Ampel

Quelle: `python3 tools/studio/metrics.py --efficiency` (Historie, 33 Sessions) und Abschnitt „Effizienz“ der Session-Datei (1 Session, 9 Agenten, 317 Aufrufe, schwache Basis: ein Lead dominiert). Historie und Session getrennt gelesen.

| Kennzahl                       | Historie / Session | Ampel (Hist./Sess.) | Befund / Ursache                                                                                                      | Hebel oder Messauftrag mit Frist                                                                                                             |
| ------------------------------ | ------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil               | 50,0 % / 73,2 %    | gelb / rot          | B1, B3: lead-art 59,9 % Kostenanteil bei einem Umsetzer; Kollision verdoppelte die Arbeit                             | E-038 (R314, Start frühestens 2026-10-22); E-044 beseitigt die Kollisionsursache; Messauftrag Coach: Session-Zeile in nächster Session-Retro |
| Umsetzeranteil                 | 24,6 % / 23,0 %    | grün / grün         | –                                                                                                                     | –                                                                                                                                            |
| Cache-Write 5 min              | 29,2 % / 31,8 %    | rot / rot           | Wartezeiten der Leads (lead-art Median-Pause 13,3 min, 88 % nach Turn-Ende, Historie-Datei); B3 verlängerte die Läufe | E-042 und E-037 laufen (R319, R314); Messauftrag Coach: Wirkung E-042 in der Retro der 3. Session nach Handbuch 1.27 (bis 2026-11-05)        |
| Lead-Kontext Median            | 75k / 101k         | grün / gelb         | Session: eine lead-art-Kette mit 185 Aufrufen, Einzelfall                                                             | E-042 (Ablösung per Handoff)                                                                                                                 |
| L0-Kontext Max                 | 774k / 118k        | rot / grün          | Historischer Höchstwert, Session unauffällig                                                                          | – (Session grün; kein neuer Vorschlag)                                                                                                       |
| opus-Anteil                    | 73,8 % / 73,2 %    | gelb / gelb         | lead-art und Engineer auf opus; Sonnet nur bei 7 von 10 Agenten                                                       | E-038 (R314)                                                                                                                                 |
| Persona-Starts general-purpose | 0 / 0              | grün / grün         | –                                                                                                                     | –                                                                                                                                            |
| Grösste gelesene Datei         | 59,0 KB / 27,6 KB  | gelb / grün         | Historie: Spec in altem Worktree; Session grün                                                                        | Messauftrag Coach: Dateigrösse in der nächsten Retro nur prüfen, solange Session gelb/rot                                                    |

Stand der Wiederholung: Cache-Write und Steuerung stehen in der dritten Retro in Folge gelb oder rot; Hebel-Vorschlag ist Pflicht (R316). Der Vorschlag liegt in den bereits angenommenen E-038, E-042, E-037; ein viertes Experiment auf dieselbe Zeile würde deren Messbarkeit verschlechtern (drei laufen). Neu ist E-044, der eine Ursache für Steuerungsmehraufwand (Kollision) mechanisch verhindert.

## Befragung der Leads

- lead-art, lead-qa: nicht befragt (Kurz-Retro); Rulings R324–R327 und Metrik-Datei gelesen.

## Vorschläge

- E-043 · Zeitreserve lokal gegen geschätzte Runner-Zeit rechnen (B2). Vorab gezählt: Mit Faktor 3 und Schwelle 2000 ms bei CI-Zeit meldet die Regel 4 Tests des heutigen Bestands (58 Tests liegen zwischen 667 und 2000 ms lokal).
- E-044 · Worktree-Belegung vor jedem Agent-Start (B1).
- E-045 · Lastgrenze 1-min-Load ≤ 4 für Perf- und Ruckel-Messungen (B4).
- B5 (Aufräumen) und B3 (Antrag): Handbuch-Vorschlag an L0, kein Experiment.

## Bewertung laufender Experimente

- E-030 (angepasst, R319): kein neuer lokaler Flackerfall in dieser Session; B4 betrifft Browser-Messung, nicht `perfBudget`. Keine Änderung.
- E-027, E-037, E-042: Zeitraum läuft; kein Messwert dieser Session auswertbar (E-042 braucht ≥ 10 Lead-Starts, hier 3). Weiter beobachten.

## Änderungen an lernen.md

- erweitert: Zeile paralleler L0-Sessions (dritter Fall R324) · Zeile Zeittest/Runner (Blindfleck 2000 ms, R328) · neu: Messen nur bei Load ≤ 4 · gestrichen: keine. 39 von 40 Zeilen.
