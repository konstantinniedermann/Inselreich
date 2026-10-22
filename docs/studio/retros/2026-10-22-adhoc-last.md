# Retro adhoc Rechnerlast-Fenster — 2026-10-22

- Datum: 2026-10-22
- Art: adhoc
- Auslöser: R809 (Nutzerfrage nach Engpass Last); `load_abort` 6 Mal in 3b332328, 39 Mal in e6dbb809; `test_failed` 06:56 UTC (UI-HAEPPCHEN-G)
- Datenbasis: `.studio/events.jsonl` (Sessions 3b332328 und e6dbb809, UTC), `docs/studio/rulings.md` R786–R809, `docs/studio/lernen.md` Z. 24–25, `tools/testlock/testlock.ts`, `tools/studio/loadsnap.py`, `Makefile` (check, zeittests), Scratchpad e6dbb809 (`m2.sh`, `m2.log`), `python3 tools/studio/metrics.py --efficiency`

## Befunde

### B1 · Wartezeit je Release: 35 bis 60 Minuten, zwei Datenpunkte

- Beobachtung: e6dbb809: `lead-tech` wartet ab 17:27 auf «Last ≤ 6 für make check (aktuell > 20)»; die Prüfläufe `integrate` scheitern 17:44 und 17:49 und laufen erst 17:58/17:59 grün. Danach Messfenster ORT-A: `waiting`/`blocked` 18:03 bis 20:11 (Session-Ende `clear`, mitten in der Messung; `m2.log` bricht bei T14-AK32 ab). 3b332328: 6 `load_abort` 06:32 bis 06:50, `make check` UI-G rot 06:56; bis 07:50 kein neuer Lauf, also mindestens 54 Minuten.
- Beleg: `load_abort`-Events (Zeiten oben), `status`-Events `waiting` (lead-tech 17:27, 18:03; tech-ui-engineer 19:27, 19:36), `test_failed` 06:56.
- Wirkung: rund 30 bis 35 Minuten je Merge-Check bei Fremd- und Mischlast, mindestens 54 Minuten für UI-G; ORT-A-Messung über zwei Sessions nicht abgeschlossen. Nur zwei Datenpunkte: Muster wahrscheinlich, Streuung unbekannt.

### B2 · Der rote Lauf von heute ist hausgemacht, nicht Fremdlast

- Beobachtung: `test_failed` 06:56 startete bei Load 3,9 (unter der Schwelle 8), mit 9 Vitest-Workern auf 10 Kernen (8 Performance-Kerne). Die 9 roten Dateien sind Zeit- und Timeout-Fehler: «Hook timed out in 10000 ms» (forest, shorePine, seaKorridor), «Test timed out» (trees-wald, wildlife), Wandzeit-Budgets (terrain 1623 > 1500 ms, perf 2,78 > 2,5 ms, save 5,65 > 5 ms). Kein einziger Fachfehler von UI-G. Dasselbe Bild am 17:44 UTC bei Load 5,6: `perf.test.ts` 2,65 > 2,5 ms.
- Beleg: `.studio/events.jsonl`, Events `test_failed` 2026-10-22T06:56 und 2026-10-21T17:44; Effizienz-Ampel: Flake-Verdacht 10, davon 6 von 10 bei Last ≥ 8.
- Wirkung: Jeder volle Lauf erzeugt seine Last selbst (9 Worker plus Build, `studio-test` mit 1009 Tests in 72 s); die Schwelle «Load ≤ 8 beim Start» sagt nichts über die Last während des Laufs. Der Nutzerwert «Last 87» ist daher kein Fremdwert.

### B3 · Eigen gegen fremd: Eigenlast überwiegt, Fremdlast löst aus

- Beobachtung: Summe der CPU-Anteile der Top-5-Prozesse über die 26 `load`-Abbrüche: Python 3.13 (Homebrew) rund 6000 (davon drei Proben mit 498 %, 100 %, 61 %), testlock/node-vitest rund 880, WebKit-XPC 557, WindowServer 473, Chrome 536, Safari 171. Aktuell (09:50 lokal, Load 5,0): vite und Chrome aus `.worktrees/ort-a-k1`, also die eigene Messung.
- Beleg: `load_abort.top5` in `.studio/events.jsonl`; `uptime`-Spalten in `m2.log` (vor Lauf 2,4 bis 3,4, nach Lauf bis 6,08 durch den eigenen Chrome); `loadsnap.py` kürzt `cmd` auf 60 Zeichen (`CMD_MAX`).
- Deutung: Der Python-Prozess ist nicht identifizierbar (Pfad abgeschnitten); wahrscheinlich Studio-Werkzeuge oder `studio-test`, unbelegt. Fremd belegt: WebKit/Safari/WindowServer, Chrome-Leerlauf des Fremdprojekts Munica (N-102, `blocked` 18:05), Nutzer-Session. Dropbox/fileproviderd tauchen in den Top-5 dieser Proben nicht auf (N-102 und `lernen.md` Z. 25 nannten sie früher). Anteil eigen gegen fremd lässt sich mit den heutigen Daten nur grob trennen: eigen mindestens 60 % der Summe, aber auf wenige Proben verteilt.

### B4 · Drei Vorgänge, drei Schwellen, eine Ressource

- Beobachtung: Messung Load ≤ 4 (zuletzt ≤ 2,6; Schritt `wait3` in `m2.sh` wartet bis ≤ 3,5), Testsperre Abbruch bei > 8 und Sperre R380, `push-check` ≤ 4. Die Testsperre (`testlock.ts`) kennt die Messungen nicht, die Messungen (`messfenster.mjs`, `m2.sh`) nicht die Sperre; die Koordination läuft über Ruling-Text (R803: «nie beides gleichzeitig»).
- Beleg: `tools/testlock/testlock.ts` Z. 88–93; `m2.sh`; R802, R803; `lernen.md` Z. 24–25.
- Wirkung: Eine Messung wartet auf Ruhe, ein `make check` wartet auf die Messung (19:32 «keine Testläufe bis Freigabe»), beide auf Fremdlast. Die Last als Näherung ist zu streng für die Messung (die A/A-Kontrolle prüft die Güte direkt) und zu lose für den Check (Start ≤ 8 verhindert nicht, dass der Lauf rot wird).

## Effizienz-Ampel

| Kennzahl                          | Wert   | Ampel | Befund / Ursache                                                         | Hebel oder Messauftrag mit Frist                            |
| --------------------------------- | ------ | ----- | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Flake-Verdacht (rot, später grün) | 10     | rot   | B2: Zeit- und Timeout-Tests unter Eigenlast                              | V1 und V2; Messung Flake-Zähler bis nach 3 Releases         |
| Steuerungsanteil bereinigt        | 43,8 % | gelb  | nicht Thema dieser Retro                                                 | – (Befund ausserhalb Scope, Aufmerksamkeit durch L0)        |
| Cache-Write 5 min                 | 27,9 % | rot   | Neuschreibung nach Pause 12,3 %: Wartezeiten auf Fenster verschärfen das | V3 (weniger Warten erzeugt weniger Pausen); Messung nach V3 |
| L0-Kontext Max                    | 774 k  | rot   | nicht Thema dieser Retro                                                 | – (offen aus früheren Retros)                               |

## Befragung der Leads

- nicht befragt (ein Start, Archiv und Events gelesen).

## Vorschläge

Nach Hebel sortiert. Jeder ist ein Experiment; keiner ändert Handbuch oder Verfassung, die Umsetzung entscheidet L0 per Ruling.

### V1 · Merge-Gate mit Teilbeleg, voller `make check` nur einmal je Release

- Änderung: Für Merge nach `main` genügt der Teilbeleg (gezielte Vitest-Dateien des Strangs, `studio-test`, `lint`, `tsc`, wie R795 und R800 praktiziert). Der volle `make check` läuft einmal vor dem Release-Push (zusammen mit `push-check`); CI (`make check-push`-Schritte) bleibt die zweite Instanz.
- Nutzen: Je Merge entfällt das Warten auf ein Fenster (bisher 30 bis 54 min); voller Lauf einmal je Release statt je Strang.
- Kosten: Eine Ruling-Zeile; keine Werkzeug-Änderung.
- Risiko: Integrationsfehler fallen erst beim Release auf, dann mit mehreren Strängen gemischt. Rückfall: alter Zustand per Ruling. Messgrösse: Anzahl `test_failed` beim Release-Check je Release (Schwelle: ≤ 1 Datei durch Integration, sonst Rücknahme).

### V2 · Check-Last senken: weniger Worker, rote Zeittests einmal einzeln wiederholen

- Änderung: `npm test` unter `make check` mit `--maxWorkers=5` (Experiment) statt 9; rote Dateien, deren Meldung «timed out» oder ein Wandzeit-Budget ist, einmal einzeln bei Start-Last ≤ 4 wiederholen, bevor Exit 1 gemeldet wird; Wiederholung im Event vermerken (Flake bleibt messbar).
- Nutzen: Der heutige Lauf (Start-Load 3,9, 9 Worker, nur Timeouts) wäre grün oder mit 1 bis 2 Dateien rot; erwartet 6 bis 10 Flake-Verdachtsfälle weniger je Monat.
- Kosten: Eine Konfigurationszeile und ein kleiner Wiederholschritt in `tools/studio/testrun.py` oder `Makefile` (Umsetzer, ca. 1 Start); Laufzeit der Suite wächst um geschätzt 20 bis 40 %.
- Risiko: Wiederholung maskiert echte Zeitregressionen; deshalb nur Timeouts und die Wandzeit-Dateien, die Reserve-Prüfung `zeitreserve` bleibt streng. Messgrösse: Flake-Verdacht aus der Effizienz-Ampel ≤ 2; Rückfall: Wert 9 und keine Wiederholung. Der Erfolg ist nicht vorab belegt; der Versuch braucht einen A/B-Lauf (ein Lauf je Einstellung bei gleicher Last) und gehört deshalb in ein Messfenster.

### V3 · Messungen in einen festen, angekündigten Block legen

- Änderung: Messungen laufen als ein Block (Serie wie `m2.sh`, `make messfenster`) am Anfang einer Session oder nach einer Merge-Welle. L0 setzt vorher eine Sperrdatei `.studio/messfenster` (Rolle, Ende-Zeit); `testlock.ts` bricht in dieser Zeit mit «Messfenster» ab (statt Last), und L0 startet keine Umsetzung mit Testlauf. Merges laufen vorher, Prüfläufe danach; kein Wechsel mitten im Block. Messdauer (T14, T17: rund 70 min) im Sessionplan einplanen, nicht «bei Gelegenheit».
- Nutzen: Kein gegenseitiges Blockieren mehr (B4); Messungen werden nicht mehr über Sessiongrenzen abgebrochen (e6dbb809 endete mitten in T14-AK32); weniger Wartepausen und damit weniger Cache-Neuschreibung.
- Kosten: Ein Werkzeug-Paket klein (Sperrdatei plus 10 Zeilen in `testlock.ts` und `messfenster.mjs`); Sessionplan etwas starrer.
- Risiko: Fremdlast (Munica, Nutzer) bleibt; der Block blockiert Umsetzer-Prüfläufe bis zu 70 min. Gegenmassnahme: Umsetzung ohne Testlauf (Plan, Design, Spec) füllt die Zeit, wie R809 es schon tut. Messgrösse: `waiting`-Minuten mit Grund «Last» oder «Messfenster» je Release ≤ 20 min (Quelle: `status`-Events); Rückfall: heutiger Ablauf.

### V4 · Messschwelle durch die A/A-Kontrolle ersetzen

- Änderung: Eine ORT-A-Messung gilt, wenn die A/A-Kontrolle im selben Block innerhalb einer festgelegten Streuung liegt, statt Load ≤ 4 oder ≤ 2,6 vor dem Lauf. Load bleibt Warnung, nicht Tor.
- Nutzen: Kein Warten auf eine Zahl, die die Messung selbst überschreitet (`uptime` nach dem Lauf bis 6,08 durch den eigenen Chrome, `m2.log`); weniger Wiederholungen. Erwartet: weniger als die Hälfte der `wait3`-Schleifen.
- Kosten: Eine Ruling plus ein Eintrag in `docs/studio/lernen.md` (Z. 25 anpassen, durch `studio-coach`); Streuungsgrenze aus den bisherigen A/A-Läufen herleiten.
- Risiko: Falsch positive Messungen bei starker Fremdlast, wenn A und B gleichzeitig gestört werden; deshalb A/A im selben Block und nach der Serie wiederholen. Messgrösse: A/A-Abweichung je Block gegen die Grenze; Rückfall: Load ≤ 4.

### V5 · Lastprotokoll um Eigen/Fremd erweitern (Messbarkeit)

- Änderung: `tools/studio/loadsnap.py` zeigt im `load_abort`-Event den Skriptnamen statt der ersten 60 Zeichen und eine Klasse `eigen` (Pfad unter dem Repo, `.worktrees`, `tools/`, vitest, vite, Chrome mit `--user-data-dir` im Scratchpad) oder `fremd`; die Retro rechnet damit den Eigenanteil.
- Nutzen: B3 wird belegt statt geschätzt; V1 bis V4 bekommen eine Messgrösse «Eigenanteil der Last» (heute offen).
- Kosten: Klein (ein Umsetzer-Start, Tests in `tools/studio/tests`); Risiko gering (nur Zusatzfelder).
- Messgrösse: Anteil `unbekannt` in `load_abort` unter 10 %; Rückfall: alte Felder bleiben erhalten.

## Empfehlung

Zuerst V2 als Experiment (kleinster Eingriff, zielt auf die heutige Ursache B2; ein A/B-Lauf liefert den Beleg), danach V1 (grösster Hebel auf die Wartezeit) und V5 (macht die übrigen messbar). V3 und V4 gehören zusammen und lösen den ORT-A-Konflikt; sie brauchen einen Plan.

## Bewertung laufender Experimente

- keine laufenden Experimente mit Bezug zur Last (R708 V2 ist Ruling, kein Experiment).

## Änderungen an lernen.md

- keine (V4 nur auf Annahme durch L0, Umsetzung `studio-coach`).

## Befunde ausserhalb Scope

- Effizienz-Ampel: L0-Kontext Max 774 k (rot), Steuerungsanteil 43,8 % (gelb) bleiben offen; nicht Gegenstand dieser Retro.
