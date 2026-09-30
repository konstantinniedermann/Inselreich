# Retro meilenstein M5 — 2026-09-30

- Datum: 2026-09-30
- Art: meilenstein
- Auslöser: meilenstein:M5 (Pflicht-Retro); eingeschlossen die Kurz-Retro der Session 2bf010b4
- Datenbasis: `docs/studio/metriken/M5.md`, `docs/studio/metriken/S-2026-09-30-2bf010b4.md`, `docs/studio/metriken/Studio-Graph.md` (Vergleich), `docs/studio/rulings.md` R56–R72, `.studio/handoffs/m5-welle-*.md`, `.studio/events.jsonl`, `.studio/archiv/berichte/`, `.studio/qa/M5-FR/report.md`, `docs/studio/retros/2026-09-30-session-25e8352d.md`
- Umfang: ein Start; Leads nicht befragt (Archiv-Berichte und Übergaben gelesen), weil alle Fragen aus Dateien beantwortbar waren.

## Kennzahlen M5 (Beobachtung)

- 2 Sessions (25e8352d, 2bf010b4), 61 Delegationen, 43 Ergebnisse, Erstabnahme 68 % (Studio-Graph: 71 %), Review-Runden im Mittel 1,35 (Max 3), Nacharbeit 12 % (Studio-Graph: 29 %). Beleg: `docs/studio/metriken/M5.md`.
- Dauer 422 min, 1993 Werkzeugaufrufe; davon lead-tech 39 Agenten, 257 min, 1202 Aufrufe (60 %).
- Die Kopfzahl „Agenten 480“ ist nicht belastbar: 419 davon sind `studio-director`-Knoten, bei denen nur 2 gemessen sind (`metriken/M5.md`, Tabelle „Lead“; in der Session-Metrik 128 von 142). Ob das Phantom-Knoten sind, habe ich nicht geprüft.

## Befunde

### B1 · Budget-Treue: lead-tech hält die Freigabe ein

- Beobachtung: Phase `M5-umsetzung` hatte 33 Starts (parallel 3). Nach Welle 5 waren 28 verbraucht, Welle 6 brauchte 1 weiteren Start (Reviewer, Autor war lead-tech selbst); der Wert „33“ ist also Freigabe, nicht Verbrauch. Zusammen mit den Phasen M5-01 (4), M5-plan (2) und M5-abschluss (5) wurden 44 Starts freigegeben und 39 Agenten gezählt.
- Beleg: `.studio/events.jsonl` (kind `budget`, 14:34Z und 17:54Z); `.studio/handoffs/m5-welle-5.md` Abschnitt „Budget“ („33 − 28 = 5 frei“); `.studio/handoffs/m5-welle-6.md` („4 frei“); `metriken/M5.md` (lead-tech 39).
- Deutung: Die gestaffelte Freigabe (R59: Muss-Pakete 45, Kann-Posten erst nach Beschluss) und Fortsetzen statt Neustart (R65 (4)) haben gewirkt: kein Budget-Vorfall, Verbrauch etwa 85–90 % der Freigabe. Ein einzelner Meilenstein belegt noch kein Muster.
- Wirkung: kein Mehrbudget nötig; A4 und S4 liefen innerhalb der freien Muss-Starts (R64).

### B2 · Schätzung: Minuten zu hoch, Werkzeugaufrufe zu niedrig (E-001 fällig)

- Beobachtung: 20 verglichene Agenten: geschätzt 1053 min, Ist 232,7 min (−77,9 %); Werkzeugaufrufe geschätzt 1244, Ist 1997 (+60,5 %). Die Schwelle von E-001 (je ±50 %) ist verfehlt. Die Richtwert-Tabelle hat aber kaum gewirkt: nur 4 von 107 archivierten Briefings nennen „Richtwert“ (grobe Zählung per `grep`), viele Kopfzeilen lauten weiterhin „150 min, 140 Tools“.
- Beleg: `metriken/M5.md` Abschnitt „Schätzung gegen Ist“; `.studio/archiv/briefings/` (Kopfzeilen `Schätzung:`); `docs/studio/metriken/richtwerte.md`.
- Deutung: Die Hypothese ist weder bestätigt noch widerlegt, weil die Behandlung selten angewendet wurde. Die Werkzeugaufrufe sind die stabilere Grösse (im Mittel 100 Aufrufe je Agent), Minuten streuen mit dem Tempo.
- Wirkung: Schätzungen sind für Planung und Budget weiter unbrauchbar für Minuten.

### B3 · Tempo-Regeln R65: Wirkung nicht sauber messbar

- Beobachtung: Nach R65 (16:47Z) wurden 10 Ergebnisse gebucht, im Mittel 0,8 Review-Runden, Maximum 2; davor 73 Ergebnisse, Mittel 1,08. Welle 5 wurde in einer Runde abgenommen (R66), Welle 6 brauchte für D1 eine Runde BEDENKEN mit 3 wichtigen Befunden. Die Ergebnisse tragen kein `package`-Feld, eine Zuordnung zu M5 ist nicht möglich.
- Beleg: `.studio/events.jsonl` (kind `result`, Zeitschnitt 16:47Z); `rulings.md` R66; `.studio/handoffs/m5-welle-6.md`.
- Deutung: Der Trend ist plausibel (weniger Runden, kürzere Checks), aber die Datenbasis besteht aus 10 Ergebnissen ohne Paketbezug, ein Befund ist es nicht. Der Preis (R65: kleine Fehler fallen erst im Final-Review auf) ist im Final-Review sichtbar: 18 Kann-Befunde (A-1 bis A-5, B-F2 bis B-F9, D-1 bis D-5) und ein Entscheidungsbedarf (B-F1), kein Muss-Fix (`.studio/qa/M5-FR/report.md`). Die Regel hat also keinen Schaden an der Qualität gezeigt.
- Wirkung: nicht quantifizierbar. Empfehlung: `log.py result` soll das Paket immer tragen (siehe Vorschläge).

### B4 · R62-Auflage verletzt: Shell-Heredoc statt Edit

- Beobachtung: Der D1-Autor (lead-tech) fügte Spec-Verweise per Python-Heredoc ein und meldete das selbst: „war aber nicht im Sinn der Auflage R62“. Die Datei-Änderung war korrekt, der Review fand daran nichts.
- Beleg: `.studio/archiv/berichte/20260930-181134-lead-tech-a93e5c623c28a4f4c.md` Zeile 32; Regel in `docs/studio/lernen.md` (Implementierer ändern Dateien mit Edit/Write).
- Deutung: Einzelfall, selbst gemeldet, ohne Schaden. Die Regel steht seit M2 in `lernen.md` und in den Personas, wird aber nicht vom Guard geprüft; bei Doku-Änderungen mit mehreren Einfügungen ist das Heredoc die bequemere Form. Ein zweiter Fall würde ein Muster belegen. Ich schlage keine Änderung vor.
- Hinweis: Ich habe selbst in dieser Session Tabellen im CHANGELOG per Python-Skript erzeugt (Handbuch 1.5/1.6), weil zehn gleichförmige Einträge anfielen. Die Regel zielt auf Code und fragile Mehrzeiler; bei reiner Textgenerierung ist ihr Nutzen gering. Das Handbuch sagt dazu nichts (Klärung unten).

### B5 · Final-Review-Report konnte nicht von einem Subagenten abgelegt werden: weder Guard noch Hook

- Beobachtung: `lead-qa` meldete: „Den Report konnte ich nicht unter `.studio/qa/M5-FR/report.md` ablegen: Die Umgebung blockiert Report-Dateien von Subagenten.“ Seine Determinismus-Probe `determinism-probe.test.ts.txt` im selben Ordner wurde dagegen geschrieben. L0 legte den Report daraufhin selbst ab (Kopfzeile „abgelegt durch L0“). Die Playtest-Reports `.studio/qa/M5-{U1a,U1b,U2,U3,A1,A3,A4,B1}/report.md` schrieben Subagenten dagegen selbst.
- Beleg: `.studio/archiv/berichte/20260930-181848-lead-qa-aa3ad78f8e8aa06b5.md` Zeile 15; `.studio/qa/M5-FR/`; `tools/studio/guard.py` (enthält keine Regel zu `.studio/qa` oder zu Berichtsdateien, nur irreversible Aktionen und die Verfassung); `.claude/settings.json` (Hooks: `hook.py` schreibt nur Events, `guard.py` ist der einzige Schreib-Hook; alle mit `|| true`).
- Deutung: Der Guard ist nicht die Ursache. Plausibelste Erklärung: Die Anweisungen der Laufzeitumgebung an Subagenten verbieten Dateien, die wie Berichte, Zusammenfassungen oder Befunde heissen (mein eigener Auftrag trägt dieselbe Zeile: „Do NOT Write report/summary/findings/analysis .md files“). Es wirkt als Modellverhalten, nicht als technische Sperre; das erklärt, warum Playtest-Reports teils doch entstanden. Das ist eine Deutung, belegt ist nur das Fehlen einer Regel im Guard. Ob ein Schreibversuch technisch scheitert, habe ich nicht getestet.
- Wirkung: ein Zusatzschritt für L0; der Inhalt ging nicht verloren, weil der Schlussbericht ohnehin archiviert wird (`.studio/archiv/berichte/`).

### B6 · Fehldeutung der Modellregel: R68 → R69 → R71

- Beobachtung: Der Nutzer wollte das Nutzungslimit schonen, ohne die Arbeit zu sperren. R68 (4) stufte die Modelle herunter, R69 stellte alles auf opus, R71 nahm das zurück: Modellwahl nach Aufgabe, nur kein Downgrade wegen des Limits. Zwei Korrekturen in einer Session.
- Beleg: `rulings.md` R68, R69, R71; `CHANGELOG.md` Handbuch 1.5 und 1.6 (zehn Persona-Versionssprünge, danach zehn zurück); 3 Coach-Agenten in M5 (`metriken/M5.md`).
- Deutung: Beide Auslegungen widersprachen dem erklärten Zweck der Anweisung (R69 „höherer Verbrauch je Session“ verteuert, statt das Limit zu schonen), und der Widerspruch stand im Ruling selbst unter „Kosten bei Irrtum“. Die Autonomie-Regel verlangt eine Auslegung und deren Kosten, aber keine Gegenprobe gegen den Zweck der Anweisung. Zwei Fälle in kurzer Folge, gleiche Ursache: ein Muster, allerdings innerhalb einer Session und eines Themas.
- Wirkung: zwei Coach-Starts für Handbuch 1.5 und 1.6 samt zweimaliger Umstellung von zehn Personas; der Coach brauchte in M5 insgesamt 4,9 min Agentenzeit (`metriken/M5.md`). Kein Schaden am Spiel.

### B7 · Sessionlänge der Vorsession: 7,5 h, Ende durch Limit

- Beobachtung: Session 25e8352d lief 09:32Z bis 17:03Z (451 min), sie umfasste S16/S17 (Werkzeug), die M5-Spec, den Plan und die Wellen 1 bis 5 und endete ohne `session_end`. Abzüglich der 2bf010b4-Werte entfallen auf sie rund 334 min Agentenzeit, 1365 Werkzeugaufrufe und 129,5 Mio. Cache-Read-Tokens (Differenz `M5.md` minus `S-2026-09-30-2bf010b4.md`).
- Beleg: `.studio/events.jsonl` (Erstes und letztes Event der Session); Retro `2026-09-30-session-25e8352d.md`; R68 (3), R66.
- Deutung: Die Session bündelte mehrere Abschnitte. Der Kontextverbrauch ist nicht gemessen (Sensor fehlt, STUDIO-LIMIT läuft noch), ein Zusammenhang mit dem Limit-Ende ist daher Vermutung. R68 (3) und Handbuch 1.6 („Sessiongrösse ≈ ein Abschnitt, Übergabe bei 50 % Kontext“) setzen bereits an.
- Wirkung: Limit-Ende ohne Session-Ende-Routine; die Folgesession musste `state.md` rekonstruieren (Retro 25e8352d B1).

### B8 · Parallele L0-Sessions ohne Basis-Drift (E-002)

- Beobachtung: Die Sessions baff17bb (Prozess-Graph, 09:40Z bis 14:13Z) und 25e8352d (S16/S17, M5) liefen rund 4,5 h parallel. `state.md` führte die Tabelle „Parallele Sessions“ mit Datei-Eigentum. In den Rulings R56 bis R72 gibt es keinen Eintrag mit Anlass „Basis-Drift“ oder „Nachführen gegen main“ (Ausgangswert Studio-Graph: 2 Nachführungen, 1 Zusatz-Task).
- Beleg: `.studio/events.jsonl` (session_start/session_end), `docs/studio/state.md` Abschnitt „Parallele Sessions“, `rulings.md`.
- Deutung: Eine von zwei verlangten Episoden, Schwelle erreicht. Die Pfade der beiden Sessions waren schon von Natur aus weitgehend disjunkt (Studio-Werkzeug gegen Spiel); die Wirkung der Regel ist daher nicht von der Pfadtrennung zu trennen.

## Befragung der Leads

- Alle Leads: nicht befragt, Archiv-Berichte und Übergaben gelesen (Begründung: Kurzfassung der Belege reicht, ein Start).

## Vorschläge

Höchstens 3 Experimente laufen gleichzeitig; E-001 und E-002 laufen, deshalb nur ein neues Experiment, alles andere ohne Experiment. Nichts davon ist umgesetzt, L0 entscheidet.

1. **E-003 (neu, `vorgeschlagen`): Zweck-Gegenprobe bei Auslegungen.** Siehe `docs/studio/experimente.md`.
2. **E-001 anpassen (Vorschlag `angepasst`, bleibt `laufend`):** Hauptgrösse werden die Werkzeugaufrufe; Minuten nur abgeleitet (Tools ÷ 4 bis 8). Schwelle: Abweichung der Werkzeugaufrufe höchstens ±50 % über mindestens 10 Agenten in M6; Anwendung prüfbar machen (Kopfzeile nennt die Tabellenzeile). Änderung am Handbuch und an `templates/briefing.md`, Rückfall wie in E-001.
3. **Ohne Experiment (offensichtliche Fehler):**
   - Pläne und Briefings sollen für Final-Review und Playtests keinen Report-Dateipfad verlangen; der Schlussbericht ist der Report und liegt archiviert vor. Wo eine Datei gebraucht wird, legt sie L0 oder der Lead ab.
   - `log.py result` soll `--package` verlangen, damit Wirkung je Paket auswertbar ist (B3). Das betrifft `tools/studio/` (Paket für lead-production, nicht Coach).
   - Handbuch klärt, ob die Edit/Write-Regel auch für rein textliche Massenänderungen gilt (B4), oder nimmt Skripte ausdrücklich aus.
4. **Zu E-002:** weiter beobachten (nur eine von zwei Episoden); Zeitraum unverändert bis Ende M6.

## Bewertung laufender Experimente

- E-001: Minuten −77,9 %, Werkzeugaufrufe +60,5 % bei 20 Agenten, Schwelle (±50 %) verfehlt, Behandlung kaum angewendet (4 von 107 Briefings) → Vorschlag `angepasst` (siehe Vorschlag 2), L0 bestätigt per Ruling.
- E-002: 1 Episode, 0 Basis-Drift-Rulings seit R55 (Ausgangswert 3) → weiter beobachten.

## Kurz-Retro Session 2bf010b4 (M5-Abschluss)

- Beobachtung: 87,9 min, 628 Werkzeugaufrufe, 15 Delegationen, 0 gescheiterte Agenten, 0 rote CI auf `main` (2 Läufe); Erstabnahme 50 % bei 5 Ergebnissen, 3 davon ungeprüft; Schätzung −76,8 % (8 Agenten). Die Session lieferte D1, Final-Review, Gate Merge (R70), M6-Wahl (R72), drei Handbuchstände (1.4 bis 1.6) und den Limit-Sensor (in Arbeit). Beleg: `metriken/S-2026-09-30-2bf010b4.md`.
- Deutung: Die Session war kurz (88 min Agentenzeit) und abgeschlossen statt abgebrochen; das Muster aus 25e8352d (B1 der dortigen Retro) wiederholte sich nicht. Zwei der drei Handbuchstände dieser Session gehen auf die Modell-Korrektur zurück (B6).
- Offene Vorfälle in der Session-Metrik: 2 (IDs nicht ausgewertet; nicht quittiert, weil ich sie nicht eindeutig zuordnen kann).

## Änderungen an lernen.md

- neu: Final-Review-Report nicht als Datei verlangen (B5); Modellwahl und Limit (R71, B6) · gestrichen: keine
