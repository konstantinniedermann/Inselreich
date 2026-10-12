# Retro session 1a73e6c1 — 2026-10-12

- Datum: 2026-10-12
- Art: session (Kurz-Retro, `studio-coach`, sonnet)
- Auslöser: Session-Ende 1a73e6c1 (R564–R577); Beobachtung Stash-Vorfall UI-AUFRAEUM-2 (R576)
- Datenbasis: `docs/studio/metriken/S-2026-10-12-1a73e6c1.md` (erzeugt 11:41), `python3 tools/studio/metrics.py --efficiency --sessions 1` (live), `docs/beobachtungen.md` (Eintrag 2026-10-12 Stash), `docs/studio/rulings.md` R564–R577, `.studio/archiv/briefings/20261012-*production-integrator*`, `git log --merges --since=2026-10-12`, `docs/studio/state.md`, `docs/studio/experimente.md` (E-062, E-063)

## Befunde

### B1 · Stash-Vorfall UI-AUFRAEUM-2 T02: Textregel wirkt nicht, der Guard sperrt nur `stash clear/drop`

- Beobachtung: Ein Arbeiter führte `git stash; git stash pop` aus, `pop` wendete einen fremden Stash an (Konflikt in `tools/studio/tests/test_metrics.py`, per `git restore` behoben); die zwei fremden Stashes blieben erhalten. In T01 gingen ungesicherte Änderungen durch `git checkout` verloren (`docs/beobachtungen.md`, Eintrag 2026-10-12, R576).
- Beleg: `tools/studio/guard.py` Z. 318 sperrt nur `stash clear|drop`; `lernen.md` führt „Kein bares `git stash` bei parallelen Worktrees“ seit R116; das Integrator-Briefing R576 trägt „kein `git stash`“ (`.studio/archiv/briefings/20261012-093648-production-integrator-MUEvERmA.md`), das Umsetzer-Briefing offenbar nicht.
- Wirkung: kein Datenverlust (Stash-Liste unverändert), aber derselbe Klassenfehler wie R116 (ddd9a9ac B5). Beobachtung: Textregel in `lernen.md` plus Briefing-Zeile beim Integrator; Deutung: Eine Regel nur im Lernen-Text erreicht den Umsetzer nicht, der Stapel ist allen Worktrees gemeinsam. Gleiches Muster wie R562/REL-M13 (Textregel reichte nicht, Werkzeug nötig).
- Einzelfall? Ein Auftreten in dieser Session, aber zweites Auftreten der Klasse nach R116 — Hinweis, noch kein Befund über Häufigkeit; das Risiko (fremder Stash angewendet) ist mit einer Guard-Regel billig auszuschliessen.

### B2 · Integrator nur im Worktree `integrate` (R565 P1): keine Kollision

- Beobachtung: 5 Integrator-Läufe am 2026-10-12. Der erste (REL-M13, 06:20) ist vor R565 und nennt den Hauptcheckout; die vier danach (07:37, 09:05, 09:20, 09:36) nennen alle `.worktrees/integrate` als Arbeitsort. Merge-Commits seit R565: M14-E1 `b903c694`, TOOL-BUENDEL-9 `d809832f`, UI-AUFRAEUM-2 `bdeb04c1`, je mit eigener Nachricht und dem L0-Docs-Commit als erstem Elternteil; 0 Merge-Commits mit fremder Nachricht, keine `push_check`-Ereignisse mit „Arbeitsbaum verändert“ (Ereignislog `.studio/events.jsonl`, 2026-10-12).
- Beleg: Briefings `.studio/archiv/briefings/20261012-073752…`, `-090505…`, `-092031…`, `-093648…`; `git log --merges --since=2026-10-12`.
- Wirkung/Deutung: 4 von 10 Läufen der E-063-Messung, 0 Verstösse. Die Aussage trägt noch nicht (nur Lauf 4 von 10, ein Push gab es in dieser Session nach R565 nicht, also fehlt der `push-check`-Teil der Hypothese). Weiter beobachten.

### B3 · state.md der Vorsession 5500c465 nicht nachgeführt

- Beobachtung: `docs/studio/state.md` zeigt „Stand: 2026-10-11 (Studio-Session f2a404fd, R537–R552 …)“; R553–R563 stehen dort nicht. Nur die Release-Notiz (62da7923, R564) und Handbuch 1.52 (89be195b) wurden zwischendurch nachgeführt. Der nächste Stand-Commit steht für diese Session noch aus (Aufgabe L0 im Session-Ende).
- Beleg: `docs/studio/state.md` Z. 7; `git log -- docs/studio/state.md`: Commits 1ec2d88f (f2a404fd), 62da7923, 89be195b; `docs/studio/rulings.md` R553–R563.
- Deutung: Die Regel „state.md laufend nachführen“ (lernen.md, R66; Session-Ende-Routine im Handbuch) ist eine Textregel, nichts im Werkzeug prüft sie. Zweiter belegter Anlass der Klasse (erster: R66, Nutzungslimit) — Hinweis, noch kein Muster.

### B4 · Eine Session 436 min mit halbierter Parallelität

- Beobachtung: 402 Agenten, 58 Delegationen, 1245 Tool-Aufrufe, 436 min; Erstabnahme 100 %, Nacharbeit 0, Schätzung gegen Ist −26,7 % (151 min gegen 110,7 min). lead-tech trägt 4,10 M von 5,41 M Cache-Write (76 %; 41 Agenten, 8 Instanzen mit 14 Neuschreibungen > 20k).
- Beleg: `docs/studio/metriken/S-2026-10-12-1a73e6c1.md`, Tabellen „Aufwand“ und Effizienz.

## Effizienz-Ampel

Quelle: `docs/studio/metriken/S-2026-10-12-1a73e6c1.md` (11:41) und live `metrics.py --efficiency --sessions 1`.

| Kennzahl                                                                                         | Wert                                         | Ampel      | Befund / Ursache                                                                                                                                                                                                                             | Hebel oder Messauftrag mit Frist                                                                                                                                      |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil (bereinigt)                                                                     | 47,2 % (live 47,3 %); roh 49,9 %             | gelb       | B4: L0 18,2 % + Leads 31,7 %. Herausgerechnet nur 2,7 % (Plan), weil die Pläne Kurzpläne waren; bei halbierter Parallelität teilt sich dieselbe Steuerung auf weniger Umsetzerarbeit (Umsetzer 21,6 %).                                      | Messauftrag `studio-coach` bis Retro der nächsten Session: Steuerung je Lead-Instanz (`lead_stats.rows`) nach „Strang mit Umsetzer“ gegen „Gate/Merge-Turns“.         |
| Cache-Write 5 min                                                                                | 28,2 %                                       | rot        | B4: lead-tech 76 % der Cache-Write-Menge (4,10 M von 5,41 M); fünfte Retro in Folge gelb/rot (REL-19 28,4 %, M13 23,5/28,3 %, f2a404fd 26,1 %).                                                                                              | E-062 (Turnkappe, gestartet R565) bekommt den Datenpunkt in der nächsten Plan-Session; V3 unten (Messauftrag mit Frist), kein neues Experiment.                       |
| L0-Kontext Max                                                                                   | 264k (live 266k)                             | gelb       | Eine L0-Instanz über 436 min, Mittel 174k (Start 62k); nur 16 k über der Schwelle, rot erst bei 500k.                                                                                                                                        | Messauftrag `studio-coach` bis nächste Session-Retro: Kontextverlauf von L0 gegen R-Zahl; ohne Anstieg > 300k kein Hebel.                                             |
| Flake-Verdacht                                                                                   | Datei 7 (rot); live 0 (grün)                 | Abweichung | Datei (11:41) und Live-Lauf widersprechen sich bei gleichem Zeitraum. 7 Tests (terrain, save, buildMenu, tooltip) stehen in der Datei. Seit R565 V3 zählt die Zeile „nur im gewählten Zeitraum und trennt Arbeitsbäume“ (`ced8a1a4`, 10:22). | Messauftrag `lead-tech` (Controller-Bündel) bis nächste Session: Datei und Live-Lauf an denselben Ereignissen nachrechnen; bis dahin gilt die Datei nicht als Befund. |
| Umsetzeranteil, Produktivanteil, Lead-Kontext Median, opus-Anteil, Persona-Starts, grösste Datei | 21,6 % / 25,8 % / 65k / 44,3 % / 0 / 39,1 KB | grün       | –                                                                                                                                                                                                                                            | –                                                                                                                                                                     |

Hinweis grösste Datei 39,1 KB (Spec i048) knapp unter der gelben Grenze 40 KB.

## Pflichtpunkte L0

- (a) Stash: Vorschlag V1.
- (b) R565 P1 hat bisher gewirkt (B2); Bewertung E-063 erst nach 10 Läufen.
- (c) state.md: Vorschlag V2.
- (d) Ampel: Tabelle oben; Flake-Widerspruch als Messauftrag, kein Befund.

## Befragung der Leads

Nicht befragt (Kurz-Retro); Grundlage sind Archiv-Berichte und Briefings, Schlussbericht Controller UI-AUFRAEUM-2 über den Beobachtungs-Eintrag.

## Vorschläge

Details in `docs/studio/experimente.md`.

- **V1 · E-064** Guard sperrt `git stash` (ausser `list`/`show`) und eine Zeile im Umsetzer-Briefing. Kosten ≈ 10 Zeilen `guard.py` + 3 Tests (ein TOOL-Bündel-Punkt, ≈ 10 Tools); Nutzen: schliesst die Klasse „fremder Stash“ (R116, R576) ohne Textdisziplin. Risiko: legitimer Stash-Gebrauch von L0 (Rückfall: Regel streichen).
- **V2 · E-065** Session-Start-/`make check`-Warnung, wenn die höchste R-Nr. in `rulings.md` die im `Stand`-Satz von `state.md` um mehr als 5 übersteigt. Kosten ≈ 15 Zeilen + Test; Nutzen: macht die vergessene Nachführung sichtbar. Warnung, kein Fehler (blockiert keine Pushes).
- **V3 · Messauftrag (kein Experiment)** `metrics.py --efficiency` Cache-Write-Anteil je Plan-/Strang-Instanz von lead-tech aufschlüsseln (E-062 liefert Plan-Turns); Frist: Retro der nächsten Session, die ein Plan-Briefing enthält.

## Bewertung laufender Experimente

- E-063: 4 von 10 Läufen nach Einführung, 0 Briefings mit Hauptcheckout, 0 Merge-Commits mit fremder Nachricht, 0 `push_check` „Arbeitsbaum verändert“; `push-check`-Lauf im Worktree noch nicht beobachtet → weiter beobachten.
- E-062: kein Plan-Briefing mit Turnkappe in dieser Session ausgewertet (UI-HAEPPCHEN-A/B waren Kurzpläne) → weiter beobachten.
- E-060: kein Budget-Hook-Ereignis in dieser Retro geprüft → weiter beobachten (nicht bewertet).

## Änderungen an lernen.md

- erweitert: Zeile „Kein bares `git stash`“ um den Fall UI-AUFRAEUM-2 (Textregel genügte nicht, Guard-Vorschlag E-064). Keine Zeile neu, Obergrenze 40 eingehalten.
