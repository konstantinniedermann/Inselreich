# Retro session ca9d40c8-ende — 2026-10-16

- Datum: 2026-10-16
- Art: session
- Auslöser: Session-Ende ca9d40c8 (R709–R746)
- Datenbasis: `docs/studio/metriken/S-2026-10-16-ca9d40c8.md`, `python3 tools/studio/metrics.py --efficiency` (Historie), `.studio/events.jsonl` (Session ca9d40c8: `test_failed`, `load_abort`, `guard_block`), `docs/studio/rulings.md` R708, R709, R712, R734–R736, R740, R743, R746, Vorschlagslisten von `docs/studio/retros/2026-10-16-prozess-rel21-25.md` und `docs/studio/retros/2026-10-16-adhoc-budget.md` (nicht gedoppelt), `docs/studio/lernen.md`. Kein Lead befragt, Archiv nicht gelesen (Kurz-Retro, Budget 0 Starts).

## Befunde

### B1 · Schätzung: Minuten −51 %, Tools nur −17 %

- Beobachtung: 39 verglichene Agenten, geschätzt 455 min, Ist 223,1 min (−51,0 %); Werkzeugaufrufe geschätzt 2695, Ist 2234.
- Beleg: Metrik-Datei, Abschnitt «Schätzung gegen Ist».
- Deutung: Dritte Session in Folge mit Minuten-Überschätzung bei brauchbarer Tool-Schätzung (f52039fc: 851 min gegen 160, Tools −11 %; c64c0775: 742 gegen 99; beide in `lernen.md`). Muster, nicht Einzelfall: die Tool-Schätzung trägt, die Minutenspalte nicht. Die Regel «Minuten = Tools ÷ 6» steht im Handbuch, wird aber offenbar nicht angewandt. Ob freie Minuten oder Tools÷6 gerechnet wurden, ist aus den Metriken nicht zu trennen (Datenlücke).

### B2 · Last: Läufe bei hoher Last, Messung der Wirkung von R708 V2 nicht möglich

- Beobachtung: 10 `test_failed`-Ereignisse mit Last, 6 bei Last ≥ 8, 1 bei Last ≥ 20 (max 34,1). 12 `load_abort`: 8 Grund `lock`, 4 Grund `load`; im Abbruch 12:12 liefen 20 bis 23 Vitest-Worker, beim Abbruch 12:06 `load` 8,06 mit Fremdprozessen (Finder, WhatsApp, N-102). Die Flake-Zeile der Session zeigt 0 Verdachtsnamen. Beim Schreiben dieser Retro: Last 40,8.
- Beleg: `.studio/events.jsonl` (Session ca9d40c8, Arten `test_failed`, `load_abort`); Ampelzeile «Flake-Verdacht» in der Session-Datei (0).
- Deutung: R708 V2 («davon Last ≥ 8» ≤ 50 % über 3 Sessions) ist nicht bewertbar: `test_passed` trägt kein Lastfeld, der Nenner fehlt; die Flake-Zeile kennt nur Verdachtsfälle (0 hier). Von 10 roten Läufen waren die meisten legitime TDD-Rotphasen (RedactTest, GuardAllowlistTest, `imports.test.ts` nach R716-Lockerung): der Anteil «6 von 10» sagt über Flakes nichts. Die Last selbst ist teils eigene Parallelität (Deckel 6, ORT-A + I-112 + TOOL + Review), teils Fremdlast; die R703/R708-Regel begrenzt nur die dritte Umsetzung, nicht die Worker je Lauf.

### B3 · Delta-Review-Ketten: frisch gestartet, aber Befundklasse wechselt

- Beobachtung: I-112 lief Final-Review BEDENKEN (R734) → Delta-Review BEDENKEN (R740, neue Befundklasse Leistung statt Anzeige) → Delta; ORT-A C2 brauchte 2 Zusatz-Delta-Reviews (R723, R729); TOOL-GUARD-REDACT eines (R732) und das Folgepaket ALLOWLIST eines (R743). In allen Rulings steht «frisch»; keine Fortsetzung belegt.
- Beleg: `docs/studio/rulings.md` R723, R729, R732, R734, R740, R743.
- Deutung: R708 V1 (0 Fortsetzungs-Delta-Reviews in 5 Controller-Paketen) hält bis jetzt in 4 Paketen; das fünfte fehlt. Die Kette bei I-112 entstand, weil der Fix zu Befund 2 eine Regression im Lazy-Test (I-078 AK-14) auslöste: der Umsetzer prüfte den Wächtertest nicht vor dem Delta-Review. Ein Fall, daher Messauftrag, kein Vorschlag.

### B4 · Cache-Write 5 min rot: Pause ist kaum noch das Problem

- Beobachtung: Session 26,6 % = Erstladung 5,9 + Wachstum 16,8 (Metrik-Zeile: «übriges Wachstum» 22,7 inkl. Erstladung) + Pause 3,9 (Neuschreibung 14,6 % des Postens). Historie 28,0 % (Pause 12,5, Wachstum 15,5). Fünfte Retro in Folge rot. Wachstum nach Rolle: lead-tech 3,9, qa-code-reviewer 5,4, art-rendering-engineer 2,6, lead-design 2,4, tech-ui-engineer 1,3.
- Beleg: Metrik-Datei, Zeilen «Cache-Write 5 min aufgeteilt/dreigeteilt»; `docs/studio/retros/2026-10-16-session-66d37b15-ende.md` B2.
- Deutung: Die Pause-Neuschreibung sank von 5,7 auf 3,9 Punkte (E-066 greift am Rand); der Posten wird von Wachstum getragen. qa-code-reviewer 5,4 Punkte bei 39 Instanzen und Kontext-Mittel 28k: viele kleine Instanzen, jede mit Erstladung und Wachstum, also eine Review-Zahl-Frage (E-068), kein Kontextproblem.

### B5 · L0-Kontext: Mittel 248k bei einer Instanz, Max 419k

- Beobachtung: Eine L0-Instanz über 558 min, Mittel 248k (an der Gelb-Grenze), Max 419k (gelb, Hist. 774k rot).
- Beleg: Metrik-Datei, Tabelle «Rolle», Zeile L0.
- Deutung: Der Messauftrag aus R708 («L0-Zwischenstand in `state.md` ab 250k») verlangt die Handlung, aber nicht den Schnitt; das Mittel zeigt, dass L0 die Session über der Schwelle fuhr. Ob der Zwischenstand tatsächlich geschrieben wurde, habe ich nicht geprüft.

### B6 · Guard wirkt, Arbeiter laufen trotzdem hinein

- Beobachtung: 12 `guard_block`: 7 × `stash`, 3 × `kill-by-name`, 1 × `delete` (`git worktree remove --force`), 1 × `constitution`; Verursacher art-rendering-engineer, tech-sim-engineer, qa-code-reviewer.
- Beleg: `.studio/events.jsonl` (Art `guard_block`, Session ca9d40c8); E-064.
- Deutung: Kein Schaden (alle geblockt), je Block ein Wiederholungsversuch. Briefings nennen die Sperren offenbar nicht (R576 beschreibt dieselbe Lücke). Kosten gering, daher nur Beobachtung.

## Effizienz-Ampel

Quelle: Session-Datei und Historie (`--efficiency`).

| Kennzahl                   | Wert                                  | Ampel      | Befund / Ursache                                                      | Hebel oder Messauftrag mit Frist                                                                                                                                     |
| -------------------------- | ------------------------------------- | ---------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cache-Write 5 min          | 26,6 % (Hist. 28,0 %)                 | rot        | B4: Wachstum 16,8 + Erstladung 5,9, Pause nur 3,9                     | Abschnitt «Cache-Write nach Rolle» und V3 unten (Wartepausen ORT-A); E-068 läuft; Messauftrag Tool-Ergebnisgrösse aus 66d37b15 offen, studio-coach, Frist 2026-10-23 |
| L0-Kontext Max             | 419k (Hist. 774k)                     | gelb / rot | B5: Mittel 248k, eine Instanz über 558 min                            | V3 unten: Schnitt bei Gate-Übergang ab 300k, Messgrösse Max ≤ 300k in den nächsten 2 Sessions                                                                        |
| Steuerungsanteil bereinigt | 43,4 % (Hist. 43,9 %)                 | gelb       | Leads 33,1 % + L0 20,4 % roh 53,5 %; lead-tech 94 Agenten, 1812 Tools | beobachten; hängt an Delegations-Zahl (B3, E-068), kein neuer Hebel                                                                                                  |
| opus-Anteil                | 45,5 % (Hist. 67,8 %)                 | grün/gelb  | Session grün; Historie gelb aus Pflicht-opus                          | kein Hebel                                                                                                                                                           |
| Grösste gelesene Datei     | 26,4 KB (Hist. 66,7 KB)               | grün/gelb  | Session `.studio/qa/playtest-i047/report.md`; Historie nicht benannt  | Messauftrag R708 erledigt (`docs/beobachtungen.md` 57,5 KB, R712); Session grün                                                                                      |
| Flake-Verdacht             | 0 (Hist. 9, davon 6 bei Last ≥ 8)     | grün / rot | B2: Nenner fehlt                                                      | V1 unten: Last auch bei `test_passed`, Frist 2026-10-30                                                                                                              |
| Umsetzeranteil             | 22,7 % (Hist. 20,7 %)                 | grün       | Produktivanteil 36,6 % grün                                           | –                                                                                                                                                                    |
| Cache-Write nach Pause     | lead-tech 2,4 % (gleich wie Historie) | Info       | Pause 3,9 % der Session                                               | –                                                                                                                                                                    |

## Cache-Write nach Rolle (Auftrag L0, R316: zweite rote Session in Folge)

Quelle: Neuberechnung aus den Transkripten der Session mit den Funktionen von `tools/studio/efficiency.py` (128 Instanzen, 8,81 M Tokens Cache-Write 5 min). Hinweis: die 6,3 M «lead-tech» in der Tabelle «Aufwand» der Session-Datei sind die Summe des Lead-Baums (94 Agenten, 79 davon Arbeiter und Reviewer); die Rolle `lead-tech` selbst hat 15 Instanzen und 2,24 M (25 %).

| Rolle                  | Instanzen | Cache-Write 5 min | Anteil | Erstladung | Pause | je Aufruf |
| ---------------------- | --------- | ----------------- | ------ | ---------- | ----- | --------- |
| lead-tech              | 15        | 2,24 M            | 25 %   | 14 %       | 40 %  | 4,5k      |
| qa-code-reviewer       | 39        | 1,46 M            | 17 %   | 27 %       | 0 %   | 3,5k      |
| art-rendering-engineer | 10        | 1,10 M            | 12 %   | 10 %       | 10 %  | 3,2k      |
| lead-design            | 5         | 0,79 M            | 9 %    | 18 %       | 24 %  | 5,9k      |
| tech-ui-engineer       | 13        | 0,51 M            | 6 %    | 26 %       | 6 %   | 2,9k      |

- Ursache 1, belegt: Pausen > 5 min. In lead-tech machen sie 40 % des Postens (0,90 M); allein ORT-A (3 Instanzen C1–C3) 1,03 M, davon 0,65 M Pause, also die Hälfte der Pause-Neuschreibung der ganzen Session (1,3 M). Die Controller warten auf Messläufe und Arbeiter (R736, R739; N-102 verlängert die Fenster).
- Ursache 2, belegt: viele kleine Instanzen. qa-code-reviewer 39 Instanzen mit 27 % Erstladung und 0 % Pause; lead-qa und lead-production tragen 44 bzw. 57 % Erstladung. Der Posten wächst mit der Zahl der Starts (E-068), nicht mit der Kontextgrösse.
- Ursache 3, nicht belegt: Kontextaufbau grosser Controller. Maximaler Kontext der teuersten lead-tech-Instanzen 146k, 165k, 116k (Median Lead-Kontext 59k, grün); der Aufbau je Aufruf (4,5k) liegt nur 1–2k über dem der Arbeiter.
- Pakete mit mehreren Instanzen: I-112 4 Instanzen, 0,38 M (davon plan-I-112 0,16 M ohne Pause); sonst ein bis drei. Das ist keine Streuung über viele Instanzen je Paket, sondern ORT-A.
- Hebel: V3 (Wartepausen). Der Kontextaufbau braucht keinen Hebel, die Review-Zahl läuft über E-068.

## Befragung der Leads

Keine; Archiv nicht gelesen (Kurz-Retro, Budget 0 Starts).

## Vorschläge (Entwürfe an L0)

- **V1 · Lastfeld für alle Testläufe und Worker-Deckel (B2), Empfehlung annehmen.** Werkzeug-Paket (lead-tech, sonnet): `test_passed` und `test_failed` tragen `load` und die Zahl der Vitest-Worker beim Start (E-070-Erweiterung, `tools/studio/loadsnap.py`); `make check` und `make test` begrenzen bei 1-min-Last ≥ 8 die Worker (z. B. `--maxWorkers=2`; Wert aus lead-tech zu prüfen). Messgrösse: Anteil der Läufe mit Last ≥ 8 an allen Läufen (heute unbekannt, Nenner) wird ausgewiesen; Ziel ≤ 25 % über 2 Sessions, zusätzlich max Last ≤ 20. Frist: Umsetzung 2026-10-23, Bewertung 2026-10-30 (zwei Sessions). Messbarkeit besser, nicht schlechter. Rückfall: Feld belassen, Worker-Deckel zurücknehmen. Werkzeug-Paket ohne Experimentplatz (wie E-043).
- **V2 · Schätzung nur in Tools (B1), Empfehlung annehmen.** In den Briefing-Kopfzeilen (`docs/studio/templates/briefing.md`, nur per Ruling) steht die Schätzung als «n Tools»; die Minuten setzt das Werkzeug (`log.py spawn`) als Tools ÷ 6 ein. Messgrösse: Minuten-Abweichung in `metrics.py` Betrag ≤ 30 % in den nächsten 2 Session-Retros (heute −51 %, vorher −51…−85 %); Tool-Abweichung bleibt Vergleich. Rückfall: freie Minuten wieder zulassen. Messbarkeit unverändert (Tools werden weiter einzeln verglichen).
- **V3 · Wartepausen der Controller: je Instanz höchstens eine Pause > 5 min (Cache-Write-Abschnitt), Empfehlung annehmen.** Ein lead-tech-Controller, der auf einen Arbeiter oder Messlauf länger als 5 min wartet, schliesst die Instanz mit Handoff ab und wird danach als Folgeinstanz gestartet (E-066, R646, auf alle Controller-Pakete ausgeweitet, nicht nur auf Fortsetzungen nach Gate). Handbuch-Minor in `docs/studio/STUDIO.md` per Ruling. Messgrösse: Pause-Anteil der lead-tech-Instanzen ≤ 20 % ihres Cache-Write 5 min (heute 40 %, 0,90 von 2,24 M) und Cache-Write 5 min der Session ≤ 25 % (heute 26,6 %), über die nächsten 2 Session-Dateien mit Controller-Paketen; Frist 2026-10-30. Risiko: jede Folgeinstanz kostet 19–33k Erstladung (gegen 150–330k je Pause-Neuschreibung bei ORT-A) und braucht Handoff-Disziplin. Messbarkeit unverändert (`cw5_first`, `rewrite_events` je Instanz). Rückfall: R646-Zustand (Folgeinstanz nur nach Gate).
- Experimente: keine neuen. Platz belegt durch E-063, E-066, E-068.

## Bewertung laufender Messaufträge und Experimente

- **R708 V1** (0 Fortsetzungs-Delta-Reviews in 5 Controller-Paketen): 4 von 5 Paketen belegt, 0 Verstösse (I-112, ORT-A C2, TOOL-GUARD-REDACT, TOOL-GUARD-ALLOWLIST; Rulings nennen «frisch»). Bewertung nach dem fünften Controller-Paket.
- **R708 V2** («davon Last ≥ 8» ≤ 50 % über 3 Sessions): Session 1 von 3, Flake-Zeile 0; nicht bewertbar (B2, Nenner fehlt). Bewertung nach V1-Daten.
- **R712 V1** (push-check misst bei Exit 1 nach, 0 Ausnahme-Rulings über 3 Pushes): Umsetzung TOOL-BUENDEL-14 Gate OK (R718); seitdem 0 Pushes und 0 `push_check`-Ereignisse in der Session. Daten: 0 von 3 Pushes, REL-26 steht aus.
- **R712 V2** (≤ 2 lead-qa- und ≤ 1 Integrator-Start je Release): kein Release in der Session; lead-qa 8 Agenten dieser Session gehören zu Paket-Gates, nicht zum Release-Weg. Daten: 0 von 3 Releases.
- **R712 V3** (≤ 1 Zeitreserve-Paket über 3 Releases): Umsetzung TOOL-BUENDEL-14; kein Release, kein Datenpunkt.
- **R712 V4** (Pre-Commit formatiert selbst, ≤ 1 Abweisung je Session): Session-Ereignisse zeigen 0 `precommit`/`hook_block`; eine Prettier-Abweisung ist in diesen Arten nicht erkennbar. Nach TOOL-BUENDEL-14: erster Datenpunkt «0 Abweisungen», mit der Einschränkung, dass die Ereignisart nicht sicher ist. Bewertung nach 2 Sessions.
- **R735 V1** (≤ 1 Start über Budget je Paket, 5 Pakete): R740 gab bei I-112 den Ansatz vor und schrieb «bei erneutem BEDENKEN derselben Klasse: V1»; I-112 steht bei 24 von 25 (unter Budget). ORT-A C3 8 von 8, Puffer 8 von 12. Zählung 1 von 5 Paketen mit Zusatzstarts ≤ 1 über Budget; weiter beobachten.
- **R735 V2** (Messwerkzeug-Tasks ≤ 2 Review-Runden): kein Messwerkzeug-Task in der Session abgeschlossen; T09 steht aus. Kein Datenpunkt.
- **R735 V3** (jedes Budget-Ruling nennt «n von m»): R736 «8 von 8», R740 «24 von 25», R734 «22 von 25»; R743 nennt «+1 Start» ohne Gesamtzahl (nicht geprüft). Bis hierher 3 von 4 geprüften; Messgrösse 10/10 bis 2026-11-15 noch offen.
- **E-068:** Datenpunkt 2: qa-code-reviewer 39 Instanzen, Wachstum 5,4 Punkte (Datenpunkt 1: 7 Instanzen, 1,9). Paketzuordnung nicht geprüft; weiter beobachten.
- **E-066:** lead-tech Pause 2,4 % gleichbleibend, Pause gesamt 3,9 % (Hist. 12,5 %): kein Widerspruch zur Hypothese.

## Änderungen an lernen.md

- Geändert (40 Inhaltszeilen bleiben): Eintrag zur Last um B2 ergänzt (eigene Vitest-Worker bis 23, Last bis 34, Nenner fehlt), Eintrag zur Schätzung um die dritte Session ca9d40c8 ergänzt (−51 % Minuten, Tools −17 %); Pages-Eintrag gekürzt. Gestrichen: keine Aussage, nur Kürzungen.
