# Retro session b73acd32-ende — 2026-10-26

- Datum: 2026-10-26
- Art: session
- Auslöser: Session-Ende b73acd32 (R972–R1003, 5 h 88 %), erste Session mit E-080 und E-081 im Handbuch (1.79)
- Datenbasis: `docs/studio/metriken/S-2026-10-26-b73acd32.md` (623,8 min, 810 Agenten, davon 88 gemessen, Handbuch 1.79), `docs/studio/rulings.md` (R972–R1003), `docs/beobachtungen.md` («Messfenster-Sperre bremst direkte vitest-Läufe nicht», 2026-10-26), `docs/studio/experimente.md` (E-066, E-080, E-081), `.studio/events.jsonl` (nur Zählung `testlock: ABBRUCH`). Beobachtungen zu Messfenster, Controller-Grenze, Gates und Fenster (5 h ≈ 73 % → 88 %) stammen aus dem Auftrag von L0; keine Paketberichte und keine `limits.json`-Reihe gelesen.

Beobachtung und Deutung sind je Befund getrennt. Kurz-Retro, keine Leads befragt (Budget keins).

## Befunde

### B1 · Die Messfenster-Sperre greift nur über Make-Ziele

- Beobachtung: Rund 14 Messungen angemeldet und gestaffelt; zweimal liefen trotzdem fremde `npx vitest`-Läufe in ein gesperrtes Fenster: eine hängende Probe `tests/sim/zz.test.ts` (19 min, 100 % CPU, R233 (4) verletzt) in AUSBAU-LOGIK während der Sperre «plan-I-223 zeiten», später ein `vitest related` ohne `--maxWorkers`; Last 20–33.
- Beleg: `docs/beobachtungen.md` «Messfenster-Sperre bremst direkte vitest-Läufe nicht (mittel)»; `tools/testlock/testlock.ts` Z. 98 und 201 (die Abbruchmeldung des Werkzeugs empfiehlt selbst «gezielt per `npx vitest run <datei>`»); `.studio/events.jsonl` (9 Zeilen `testlock: ABBRUCH` über die ganze Historie, nicht auf die Session eingegrenzt).
- Deutung: Die Sperre schützt nur, wer das Make-Ziel benutzt. Das Werkzeug lenkt Arbeiter bei Abbruch auf genau den Weg, den die Sperre nicht sieht. Zweiter Fall nach 8361ff82 B1 (ZEITPIN-D1, dort Last 10–50 aus Controller-Läufen): das Muster «Fremdlast im Messfenster» besteht jetzt über zwei Sessions, auch mit gesetzter Sperre. Ob der erste Verstoss ein Briefing-Mangel (kein Satz «nur Make-Ziele») oder ein Werkzeugmangel ist, ist nicht belegt; 2 von ≈ 14 Fenstern (≈ 14 %) gestört.
- Wirkung: Das Messpaket «plan-I-223 zeiten» lief bei Last 20–33; sein Ergebnis (Zeiten ≤ +8 %, R1001) ist dadurch nicht mit Last ≤ 4 belegt, Deutung, nicht nachgemessen.

### B2 · Controller-Grenze (6 Arbeiter-Starts) wird erst mit expliziter Briefing-Zeile gehalten

- Beobachtung: I-210 (11 Starts) und I-223 (8) überzogen die Grenze von 6 Arbeiter-Starts je Instanz; nach einer expliziten Grenze im Briefing hielten die Folgeinstanzen sie ein. Folge: I-210 ×3, AUSBAU-LOGIK ×2, I-223 ×2 Instanzen.
- Beleg: `docs/studio/STUDIO.md` Z. 336–338 und `.claude/agents/lead-tech.md` Z. 108–109 (R190: Übergabe spätestens nach 6 Arbeiter-Starts); Angabe L0 (Instanzzahlen); Metrik `lead-tech` 12 Instanzen, Kontext Max 310k (über der 200k-Grenze der Regel).
- Deutung: Die Regel steht in Persona und Handbuch, wird aber nicht gezählt; die Instanz hat keinen Zähler, nur ihr Gedächtnis. Zwei von drei Paketen mit Folgeinstanzen überzogen, ein Muster über Pakete, noch nicht über Sessions. Überschreiten kostet Kontextwachstum (siehe Ampel: lead-tech-Kontext Median 82k gelb).
- Wirkung: Kontext Max 310k bei einem lead-tech; der Hebel (Briefing-Zeile) wirkte erst nach der Überschreitung.

### B3 · Gates: 4 BEDENKEN/ZURÜCK-Zyklen ohne zweites Gate, ein ZURÜCK im Final-Review

- Beobachtung: BEDENKEN mit Nachtrag und Kurzprüfung bei NU-1 Spec (R978), I-223 Spec (R982), I-223 Plan (R989), NU-1 Plan (R991); I-215 Plan «OK mit Auflagen» (R974). HAFEN L1: ZURÜCK im Gate Merge (R990, unladbarer Spielstand), mit OK nachgeholt (R994). Kein Gate musste wiederholt werden.
- Beleg: R974, R978, R982, R989, R990, R991, R994; Metrik: Erstabnahme-Quote 20 %, Review-Runden im Mittel 1,60 (Max 3), Nacharbeit 21 % (3 von 14).
- Deutung: Der Nachtrag-plus-Kurzprüfung-Weg (kein zweites Gate) hat funktioniert, der Gate-Teil ist wirksam. Vier BEDENKEN in fünf Spec-/Plan-Gates sind kein Einzelfall, aber die Ursachen sind nicht gelesen; `lernen.md` führt bereits die Klasse «Spec-Entwurf arbeitet ein Ruling nicht ein» (f8716d75: 2 von 3). Ob es dieselbe Klasse ist, bleibt offen (Messauftrag M3). Der unladbare Spielstand wurde im Final-Review gefangen, nicht vorher: Save-Abweisungstest wäre die feste Regel (Projektregel), Ursache nicht untersucht.
- Wirkung: Erstabnahme 20 % ist niedrig; Fixrunden sind aber billig (kein zweites Gate).

### B4 · Doku-Änderungen auf main blockierten das Vorspulen

- Beobachtung: REL-33 gepusht, REL-34 lokal gebündelt; das `main`-Vorspulen scheiterte zuerst an unkommittierten L0-Doku-Änderungen (Patch-Workaround).
- Beleg: Angabe L0; R995 (REL-34 lokal auf main). Git-Status zu Beginn dieses Auftrags zeigt weiter `docs/beobachtungen.md`, `docs/studio/rulings.md` geändert und eine Metrik-Datei ungetrackt.
- Deutung: Wiederkehrend (`lernen.md`, Zeilen zu `pull --rebase` und «Vor einem L0-Commit bei ausstehendem Bericht …»): L0 hält Doku uncommittet, solange ein Integrator-Lauf aussteht (R697). Ein Einzelfall in dieser Session; kein neuer Vorschlag.
- Wirkung: ein Workaround, kein Verlust.

## Effizienz-Ampel

Quelle: Abschnitt «Effizienz» von `docs/studio/metriken/S-2026-10-26-b73acd32.md`.

| Kennzahl             | Wert   | Ampel | Befund / Ursache                                                                                                                                            | Hebel oder Messauftrag mit Frist                                                                               |
| -------------------- | ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Cache-Write 5 min    | 24,5 % | gelb  | Wachstum 16,5 %, nach Pause 7,9 % (3,9 M Tokens; vorher 1,7 %): lead-tech 3,4 % Pause + 3,5 % Wachstum, qa-code-reviewer 4,7 % Wachstum; Grenze zu rot 25 % | E-076 (Handbuch 1.76 in main erst ab REL-33, R980: Teilsession), E-066 und E-068 laufen; kein neuer Hebel (B5) |
| Lead-Kontext Median  | 82k    | gelb  | `lead-tech` 12 Instanzen, Kontext Max 310k, 16 Neuschreibungen > 20k; Instanzen über 6 Starts (B2)                                                          | E-082 (Briefing-Zeile Startzähler), Frist 2026-11-19                                                           |
| L0-Kontext Max       | 391k   | gelb  | eine L0-Instanz, Session 623,8 min; Ursache nicht aufgeschlüsselt                                                                                           | Messauftrag M4: L0-Kontext je Ruling-Block (bis nächste Session-Retro)                                         |
| Steuerungsanteil roh | 49,4 % | Info  | Bereinigt 27,1 % grün (E-049); Plan 12,7 %, Design 6,9 %, Gate 2,7 % herausgerechnet                                                                        | –                                                                                                              |

Cache-Write 5 min steht in der Session-Retro-Reihe zum vierten Mal in Folge gelb (47d29586 24,6 %, 8361ff82 24,2 %, jetzt 24,5 %); R316 verlangt einen Hebel: er besteht aus E-076, E-066 und E-068 (alle laufen, kein weiterer Vorschlag, damit die Wirkung trennbar bleibt, Prüffrage 4). Beobachtung zur Wirkung: Der Pausenanteil stieg von 1,7 % auf 7,9 % und die Kennzahl blieb auf 24,5 %: weder E-076 (Teilsession) noch E-066 zeigen Wirkung (B5).

### B5 · E-066 zeigt in zwei Datenpunkten keine Wirkung auf die Neuschreibungen

- Beobachtung: `lead-tech` 16 Neuschreibungen > 20k in b73acd32 (Schwelle ≤ 5, Ausgang 8 in 6584aaa4/b54ed3bd); dbac5fc4 hatte 3. Pausenanteil `lead-tech` 3,4 Punkte (Schwelle des Experiments: Ausgang 2,6, dbac5fc4 1,4). Folgeinstanzen mit Übergabe liefen in dieser Session, besonders I-210 ×3, AUSBAU-LOGIK ×2, I-223 ×2.
- Beleg: `docs/studio/experimente.md` E-066 (Messgrösse, Datenpunkt 1); Metrik Tabelle «5-min-Neuschreibungen > 20k» (`lead-tech` 12 Instanzen, 16); R646, R984 (2).
- Deutung: Die Messgrösse zählt absolut je Session, nicht je Instanz oder Paket; b73acd32 hatte 12 `lead-tech`-Instanzen bei 623,8 min, dbac5fc4 war klein. Die Schwelle ist damit nicht trennbar von der Sessiongrösse (so schon im Datenpunkt 1 vermerkt). 16 > 5 ist ein klarer Wert gegen die Schwelle, aber ohne Normierung kein Beleg gegen die Hypothese. Es besteht Zeitdruck: Platz für E-080 (R984 (2)).
- Wirkung: E-066 belegt Wirkung weder für noch gegen die Hypothese; es belegt Platz in der Zählung.

## Befragung der Leads

- Nicht befragt (Budget keins). Berichte nicht gelesen; Belege aus Rulings, Metrik, Beobachtungen und Angaben von L0.

## Bewertung laufender Experimente

- **E-080 (Messfenster-Sperre), Messpunkt 1 von 2:** Die Schwelle («Läuferzahl je Stand ≥ geforderte Zahl in 2 von 2 Messpaketen») ist nicht auswertbar: die Läuferzahlen stehen in den Paketberichten, die diese Retro nicht gelesen hat (Zwischenstand L0: «HAFEN T01, I-210 T03 mit gesetzter Sperre»). Was sich belegen lässt, ist die Gegenprobe: die Sperre hielt die angemeldeten Controller auf Make-Wegen ab, aber 2 von ≈ 14 Fenstern wurden über direktes `npx vitest` gestört (B1). Urteil: **offen, Tendenz teilweise**; die Sperre ist notwendig, aber nicht hinreichend. Erstes Messpaket mit sauberem Ergebnis steht aus (M2). Messauftrag M2 aus 8361ff82 (war die Sperre bei ZEITPIN-D1 gesetzt?) ist aus den Unterlagen nicht beantwortbar: `events.jsonl` trägt keine Sperre je Paket; Messauftrag entfällt, da E-080 den Fall ab jetzt je Paket im Bericht erhebt.
- **E-081 (Startgrenze nach Zuwachs), Messpunkt 1 von 3 (Zwischenstände je Session):** Pakete mit Zwischenstand: I-210 (R988, später bereit R1003) und AUSBAU-LOGIK (R1002, «Fortsetzung später»); damit 2 > 1 (Schwelle ≤ 1, Ausgang 3). Ob beides durch das Fenster bedingt war oder durch Inhalt (Testlagen, BEDENKEN), ist aus den Rulings nicht trennbar. Gegenprobe Fenster am Ende: 88 % im Band 85–90 %: erfüllt. R1001: E-081 liess bei 83 % keine neue Welle neben I-210 und AUSBAU-LOGIK zu, Gates Merge in der Reihenfolge I-223, I-210, AUSBAU-LOGIK. Faktor 1,8: Zuwachs ab 5 h ≈ 73 % bis 88 % = 15 Punkte; die Agentenzahl der Wellen steht nicht in den Unterlagen, der Faktor ist nicht nachgemessen (M1). Urteil: **kein Urteil, Datenpunkt 1 von 3 erfasst**. Beachte: E-081 galt formal erst ab 73 %, also nicht für die erste Welle.
- **E-066, Empfehlung an L0 (Entwurf):** `angepasst` und abschliessen: Regel «Folgeinstanz statt Fortsetzung» bleibt als Praxis (sie wird gelebt, 3 Pakete mit Folgeinstanzen, B2), die Messung wird beendet, weil die absolute Messgrösse nicht von der Sessiongrösse trennbar ist (B5); Platz geht an E-080 (R984 (2)). Rückfall nicht nötig, da die Regel kostenneutral ist. Ersatz: die Wirkung auf Pausenneuschreibungen liest `lernen.md` weiter über die Ampelzeile «Neuschreibung nach Pause», nicht über ein Experiment.
- E-071 bis E-074, E-076 bis E-079: keine neue Datenlage; E-076 galt erst ab REL-33 (R980), Bewertung erst ab der nächsten vollen Session.

## Vorschläge

Höchstens 3; Status `vorgeschlagen`. Keine Einträge in `docs/studio/experimente.md` in diesem Branch (die Nummern E-082 und E-083 trägt der Coach nach dem Ruling ein, damit Rulings und Datei nicht auseinanderlaufen).

### E-082 · Startzähler für Arbeiter-Starts im Controller-Briefing

- Hypothese: Wenn das Controller-Briefing eine Pflichtzeile «Arbeiter-Starts dieser Instanz: 0 von 6; nach dem sechsten Start Übergabe, kein siebter» trägt und der Controller den Zähler in jedem Zwischenstand-Satz nennt, überschreitet keine Instanz die Grenze von 6, weil der Zähler im Kontext steht statt im Gedächtnis (Ausgang: 2 von 3 Paketen mit Folgeinstanzen überzogen, 11 und 8 Starts).
- Messgrösse: Instanzen mit mehr als 6 Arbeiter-Starts = 0 in den nächsten 2 Sessions mit Controller-Paketen (Ausgang 2 Instanzen in b73acd32); Gegenprobe: Lead-Kontext Max ≤ 250k und Zahl der Folgeinstanzen je Paket ≤ 2 (Ausgang bis 3).
- Messbarkeit: nicht verschlechtert; Starts je Instanz stehen in den Ereignissen `agent_start` je Lead, Zähler im Bericht.
- Zeitraum: 2 Sessions, höchstens bis 2026-11-19.
- Rückfall: Zeile streichen, Regel R190 wie bisher in Persona und Handbuch.
- Dateien: `docs/studio/templates/briefing.md` (Zeile für Controller-Pakete), `docs/studio/STUDIO.md` (Abschnitt «Schlanke Steuerung»); nur nach L0-Ruling. Ohne Platz (passiv, Muster E-071).

### E-083 · Messfenster-Sperre im vitest-Setup prüfen (Werkzeug, nur Vorschlag)

- Hypothese: Wenn der vitest-Aufruf (globales Setup) die Sperrdatei von `tools/messfenster/lock.ts` liest und bei fremdem Besitzer mit Exit 3 abbricht, laufen keine Tests mehr in ein gesperrtes Messfenster, auch nicht über direktes `npx vitest` (B1).
- Messgrösse: Läufe fremder Besitzer im gesperrten Fenster = 0 über 2 Messpakete (Ausgang 2 in ≈ 14 Fenstern, ≈ 14 %); Gegenprobe: kein Fehlalarm, Läufe des Fensterbesitzers = 100 % durchgelassen (Test mit ≥ 100 Wiederholungen nach Regel R385).
- Messbarkeit: nicht verschlechtert, ausser E-080 und E-083 überlagern sich: E-083 startet deshalb erst nach der Bewertung von E-080 (oder nach dem zweiten E-080-Messpaket), damit die Läuferzahl dem Hebel zuordenbar bleibt.
- Zeitraum: Werkzeugpaket klein (Stufe leicht), dann 2 Messpakete, höchstens bis 2026-12-03.
- Rückfall: Setup-Prüfung entfernen; stattdessen Briefing-Pflichtzeile «im gesperrten Fenster nur Make-Ziele, kein `npx vitest`» und Abbruchmeldung in `testlock.ts` ohne Hinweis auf `npx vitest run`.
- Dateien: `vitest.config.*` oder Setup-Datei, `tools/messfenster/lock.ts`, `tools/testlock/testlock.ts` (Meldung); nur nach L0-Ruling und mit Werkzeug-Paket. Kein Code in dieser Retro.

Ein dritter Vorschlag entfällt: Für B3 (Gates) fehlt die Ursachenlage, dafür M3.

## Messaufträge

- M1 (L0, bis nächste Session-Retro): je Welle Fensterstand Start, Ende und Agentenzahl im Ruling notieren (Faktor 1,8 aus E-081 nachmessen).
- M3 (studio-coach, nächste Retro): die vier BEDENKEN (R978, R982, R989, R991) auf «Ruling nicht eingearbeitet» gegen andere Ursachen klassieren; trifft es in ≥ 3 von 4 zu, Vorschlag «Rulings-Abgleich» in der Spec-/Plan-Vorlage.
- M4 (studio-coach, nächste Retro): L0-Kontext 391k je Ruling-Block aufschlüsseln (Ampel gelb, Ursache nicht belegt).

## Änderungen an lernen.md

- Zeile «Ruckel- und Perf-Messungen …» um einen Satz ergänzt (keine neue Zeile, Deckel 40 gehalten): Die Sperre greift nur über Make-Ziele und die Abbruchmeldung von `testlock` empfiehlt selbst `npx vitest run`; direkte Läufe stören das Fenster trotz Sperre (2 von ≈ 14 Fenstern in b73acd32, Retro session-b73acd32-ende B1).
