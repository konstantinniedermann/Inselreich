# Retro adhoc Ampel Steuerung — 2026-10-08

- Datum: 2026-10-08
- Art: adhoc
- Auslöser: `ampel:steuerung:S-2026-10-05-e51712dd`, `ampel:cache_write_5m:S-2026-10-05-e51712dd` (erste Vorfälle des Auslösers aus TOOL-AMPEL, R317)
- Datenbasis: `python3 tools/studio/metrics.py --efficiency --sessions 15` (335 Agenten, Abschnitt „Neuschreibungen nach Pause > 5 min“); `docs/studio/metriken/S-2026-10-05-6a98e530.md`, `…-e51712dd.md`, `…-ad51d3c5.md`; Transkripte der Sessions 6a98e530, e51712dd, 7db07561, b2a8949d, 8ef9d27f, ad51d3c5 unter `~/.claude/projects/-Users-KN-CAS-projekte-anno-clone/`; `.studio/events.jsonl`; `docs/studio/experimente.md` (E-029, E-036 bis E-038); die Retros `2026-10-08-proc-aufwandsverteilung.md` und `2026-10-08-vorfall-effizienz-unentdeckt.md` (nichts davon neu erhoben, nur die Zerlegung der Steuerung ist neu).
- Grenzen: Die Zerlegung stammt aus Wegwerf-Skripten im Scratchpad (nicht im Repo), gewichtet wie `tools/studio/efficiency.py` (Kostengewicht, Schätzung). Die Zahlen weichen um höchstens 1 Punkt von den Metrik-Dateien ab (6a98e530: 63,3 % statt 64,3 %; e51712dd: 55,8 % statt 55,0 %). „Gate“ lässt sich aus den Transkripten nicht von sonstiger L0-Arbeit trennen (siehe M1).

## Befunde

Der Vorfall `cache_write_5m` ist durch R314 und E-037 adressiert (Retro proc-aufwandsverteilung B4). Hier nur festgehalten. Ein Teil davon ist aber nicht von E-037 erfasst (B3).

### B1 · Der Vorfall ist alt, die Rückkopplung kam drei Tage zu spät

- Beobachtung: Rot sind drei Sessions vom 5.10. (6a98e530 64,3 %, ad51d3c5 64,8 %, e51712dd 55,0 %), danach 29,2 %, 4,6 % und 32,8 % (alle grün); der Wert über 15 Sessions ist 38,3 % (grün). E-029 („Aufschlüsselung der Steuerung, Ursache der zweiten roten Session in Folge“) steht seit 2026-10-05 auf „vorgeschlagen“ ohne Start.
- Beleg: `docs/studio/metriken/S-2026-10-05-*.md` (Zeile Steuerungsanteil), `S-2026-10-06-7db07561.md`, `S-2026-10-07-b2a8949d.md`, `S-2026-10-08-8ef9d27f.md`; `docs/studio/experimente.md` Zeile 54 bis 61.
- Wirkung: Das ist dasselbe Muster wie in `2026-10-08-vorfall-effizienz-unentdeckt.md` B1/B2: Messauftrag („Aufschlüsselung“) wartete auf einen Experiment-Platz. Der neue Auslöser hat das Muster sichtbar gemacht, ohne zu viel zu melden: die Sessions waren Planungs- und Gate-Sitzungen mit wenig Umsetzern (Umsetzeranteil 20,8 % und 27,7 %).

### B2 · Wo die Steuerung entstand (6a98e530 / e51712dd, Anteile am Gesamtgewicht der Session)

| Teil                                                      | 6a98e530 | e51712dd | Beleg und Lesart                                                                                                                                                                                                                 |
| --------------------------------------------------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerung gesamt (Leads + L0)                             | 63,3 %   | 55,8 %   | Leads 429 / 729 Turns, L0 81 / 199 Turns                                                                                                                                                                                         |
| Briefings (erster Aufruf jeder Lead-Instanz)              | 3,1 %    | 1,6 %    | 16 / 22 Lead-Starts; Start-Kontext 27 bis 30k. Klein.                                                                                                                                                                            |
| Warten: Turn-Ende, dann Neuschreibung nach Pause > 5 min  | 3,8 %    | 14,6 %   | Lead und L0, kein Tool im Vorgänger-Aufruf                                                                                                                                                                                       |
| Warten: Bash-Aufruf, dann Pause > 5 min                   | 0,7 %    | 4,9 %    | Bereich von E-037 Hebel 1                                                                                                                                                                                                        |
| Doku/state nachführen (Turn nach Edit/Write)              | 5,1 %    | 0,1 %    | Einzelfall in 6a98e530 (Rulings, Commits)                                                                                                                                                                                        |
| Neustarts von Leads                                       | 0        | 0        | kein Lead zweimal für dasselbe Paket; einziger Fall: lead-art ART-STIL-02-umsetzung 8 Starts in 7db07561 (dort Steuerung 29,2 %)                                                                                                 |
| Gates (L0)                                                | –        | –        | L0 gesamt 13,0 % / 18,9 %; nicht trennbar                                                                                                                                                                                        |
| Rest: Lead-Turns mit Handarbeit (Lesen, git, Tests, Logs) | ca. 50 % | ca. 30 % | Leads: Bash 347 / 597 von 429 / 729 Turns (81 %), dagegen nur 38 / 66 Agent-Aufrufe, also rund 11 Turns je Delegation. Kostenart: Cache-Read 24 / 13 Punkte, Output 12 / 5 Punkte (Turn-Zahl), Cache-Write 5 min 14 / 19 Punkte. |

- Konzentration: Drei Lead-Instanzen tragen 29 % (6a98e530: M12-SEE-PLAN 20,3 %, M12-E0-C3 qa 4,4 %, M12-I010 4,2 %) bzw. 17,6 % (e51712dd: M12-E1-C3 9,7 %, M12-SEE-C3 4,0 %, M12-SEE-C1 3,9 %). M12-SEE-PLAN: lead-tech auf opus (Plan auf opus, R264, gewollt), 89 Turns, 75 Bash und 19 Write, ein Agent-Aufruf; die 19 Plan-Dateien entstanden je in einem eigenen Turn.
- Lead-Bash nach Art (beide Sessions): `log.py` 288 von 944 (30 %), git 200 (21 %), Dateien lesen in der Shell 145 (15 %), Tests/Check 86, Sonstiges 254, Warteschleifen 44.
- Statusmeldungen als eigener Turn (nur dieser Aufruf im Turn): 120 in beiden Sessions (done 32, waiting 45, delegated 30, active 11, übrige 2), also rund 10 % der 1158 Lead-Turns; 38 Lead-Instanzen, im Mittel 3,2 je Instanz. Die Hook-Events `agent_start` (985) und `agent_stop` (983) decken `active`/`done` (je 315) bereits ab, der `agent_stop` trägt `summary`.

### B3 · Die Neuschreibungen der Leads folgen auf ein Turn-Ende, nicht auf Bash

- Beobachtung: Neuschreibungen ≥ 20k nach Pause > 5 min in L0 und Leads, Sessions 6a98e530, e51712dd, 7db07561, b2a8949d, 8ef9d27f, ad51d3c5: Lead nach Turn-Ende ohne Tool 91 Fälle (65 % des Gewichts, Median-Pause 15,1 min), Lead nach Bash 34 Fälle (19 %, 9,3 min), L0 nach Turn-Ende 10 Fälle (16 %, 91,3 min = Nutzer- und Gate-Pausen). Keiner folgt auf einen Agent- oder SendMessage-Aufruf.
- Beleg: Tabelle „Neuschreibungen nach Pause > 5 min“ (`metrics.py --efficiency`): „vorher Bash/Agent“ nur 13 % (lead-art) und 37 % (lead-tech) bestätigt dasselbe.
- Wirkung: E-037 Hebel 1 (Bash-Läufe im Hintergrund, Abfrage ≤ 4 min) trifft die 19 %. Der grosse Rest sind Fortsetzungen eines Leads nach seinem Abschluss- oder Zwischenbericht (Handbuch „Fortsetzen statt neu starten“, `docs/studio/STUDIO.md` Zeile 60): jede Fortsetzung nach > 5 min schreibt den ganzen Lead-Kontext (Median 60 bis 100k) neu, ein Neustart mit Handoff begänne bei 27 bis 30k.

## Deutung

5-Why zur Steuerung (Muster, nicht Einzelfall: drei rote Sessions am 5.10., je ein Planungs- oder Gate-Schwerpunkt):

1. Warum rot? Leads und L0 hatten 55 bis 65 % des Gewichts, Umsetzer nur 21 bis 28 %.
2. Warum viel Lead-Gewicht? 10 bis 11 Lead-Turns je Delegation, davon 81 % Bash-Handarbeit, und wenige sehr lange Lead-Instanzen (3 Instanzen = 18 bis 29 %).
3. Warum viele Turns? Jede kleine Handlung (git, `log.py`, Datei lesen, Plan-Datei schreiben) ist ein eigener Modell-Turn mit vollem Lead-Kontext; jeder Statusaufruf steht in der Persona als „eigener Bash-Befehl“, wird aber von vielen Leads auch als eigener Turn gefahren (120 von 1158).
4. Warum teuer pro Turn? Der Kontext ist 60 bis 100k, und nach jedem Turn-Ende mit Pause > 5 min wird er neu geschrieben (B3).
5. Wurzel: Leads arbeiten als Hand-Arbeiter im Vordergrund und werden fortgesetzt statt abgelöst; die Messung zeigte das nicht, weil E-029 (Aufschlüsselung) auf einen Platz wartete (B1).

Abgrenzung zu E-037: Ein Teil überschneidet sich, der Hauptteil nicht. Überschneidung: Bash-Warten nach Pause > 5 min (0,7 / 4,9 Punkte), Gesamtwert Cache-Write 5 min, Hebel 5 (sonnet statt opus) für die Kosten pro Turn. Eigenständig: Turn-Zahl der Leads (Cache-Read und Output der Leads, 36 / 18 Punkte), Turn-Ende-Fortsetzungen (65 % der Lead-Neuschreibungen), Statusturns. Wechselwirkung: E-037 Hebel 1 fügt Abfrage-Turns hinzu (je ca. 0,1 × Kontext); das ist billiger als eine Neuschreibung, aber nicht null. Deshalb wird die Turn-Zahl getrennt gemessen.

Nicht Ursache (belegt): Briefings (1,6 bis 3,1 %), Neustarts von Leads (0 in beiden Sessions), Doku-Nachführen (Einzelfall 5,1 % in 6a98e530). Plan-Autorenschaft des Leads auf opus (R264) ist gewollt und mit 20 % in einer Instanz der grösste Einzelposten; einzelner Fall in diesen Sessions, daher kein Hebel, nur Messung (M1).

## Effizienz-Ampel

Quelle: `python3 tools/studio/metrics.py --efficiency --sessions 15` (15 Sessions, 335 Agenten).

| Kennzahl                              | Wert    | Ampel | Befund / Ursache                                                         | Hebel oder Messauftrag mit Frist                                                                                                                                                     |
| ------------------------------------- | ------- | ----- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Steuerungsanteil                      | 38,3 %  | grün  | Vorfall rückwirkend (B1 bis B3); Wert über 15 Sessions knapp unter Gelb  | V1 und V2 (unten); M1                                                                                                                                                                |
| Cache-Write 5 min                     | 34,6 %  | rot   | durch R314/E-037 adressiert; Lead-Turn-Ende-Anteil ausserhalb E-037 (B3) | E-037 (R314); V1 für den Lead-Anteil; Wirkung getrennt über M1                                                                                                                       |
| L0-Kontext Max                        | 446k    | gelb  | Session-Länge; L0 schreibt mit 1-h-Cache, Pausen Median 105 min          | Messauftrag: `studio-coach` weist in der nächsten Session-Retro Session und Zeitpunkt des Maximums aus und prüft die Übergabe bei > 250k (E-029-Logik), Frist: nächste Session-Retro |
| opus-Anteil                           | 70,3 %  | gelb  | Plan-Leads auf opus (R264, gewollt), Art- und Design-Leads auf opus      | E-038 (R314); M1 weist opus-Anteil der Lead-Turns aus, Frist: erster Metrik-Lauf nach M1                                                                                             |
| Grösste gelesene Datei                | 47,6 KB | gelb  | `docs/superpowers/specs/2026-10-02-programm-nutzerfeedback.md`           | Messauftrag: `lead-design` teilt Specs > 40 KB beim nächsten Spec-Paket (Anhang-Muster wie `m12-weite-welt-spec/`), Prüfung in der nächsten Session-Retro                            |
| Umsetzeranteil, Lead-Kontext, Persona | grün    | –     | –                                                                        | –                                                                                                                                                                                    |

## Befragung der Leads

- Nicht befragt (kein Start, Aufwand klein halten). Auswertung der Lead-Transkripte (Sessions 6a98e530, e51712dd) und Hook-Events in `.studio/events.jsonl`.

## Vorschläge

Höchstens 2 Hebel, beide unabhängig von E-037 messbar. Dazu ein Messauftrag (M1), der beide Messgrössen in die Metrik-Datei bringt, damit sie nicht wieder von Hand ausgezählt werden.

### V1 · Leads nach Abschlussbericht nicht fortsetzen, sondern mit Handoff ablösen (Hebel; schärft E-029)

- Hypothese: Fortsetzungen eines Leads nach einer Pause > 5 min schreiben dessen ganzen Kontext neu (Median 60 bis 100k). Ein neuer Lead mit Handoff-Datei (Start 27 bis 30k) kostet dafür rund die Hälfte bis ein Drittel. Wenn die Regel „Fortsetzen statt neu starten“ für Leads bei Kontext > 60k und erwarteter Pause > 5 min durch „neuer Start mit Handoff“ ersetzt wird, sinken die Lead-Neuschreibungen nach Turn-Ende ohne Qualitätsverlust. Grundlage: B3.
- Einsparung: Lead-Neuschreibungen nach Turn-Ende sind rund 5 Punkte des Gesamtgewichts (7,8 % Lead-Neuschreibungen mal 65 %). Etwa die Hälfte spart 2 bis 3 Punkte, grob 5 bis 7 % der Steuerung. Spanne unsicher: der Handoff-Aufwand ist abzuziehen.
- Messgrösse: Lead-Neuschreibungen ≥ 20k nach Turn-Ende je Lead-Instanz. Ausgang 91 in 78 Lead-Instanzen (1,2 je Instanz, 6 Sessions); Schwelle ≤ 0,6 über 3 Sessions mit ≥ 10 Lead-Starts. Gegenprobe: Starts je Paket höchstens +1 gegenüber Ausgang, Briefing-Rückfragen und Review-Runden (Mittel ≤ 2) nicht höher. Getrennt von E-037: E-037 (b) zählt Umsetzer-Instanzen und Bash-Vorgänger, V1 zählt Leads und Turn-Ende-Vorgänger.
- Rückfall: Zeile „Fortsetzen statt neu starten“ in `docs/studio/STUDIO.md` und Lead-Personas auf Version vor der Änderung; Regel streichen, wenn die Schwelle nicht erreicht wird oder die Gegenprobe kippt.
- Aufwand: klein (ein Absatz im Handbuch und in den `lead-*`-Personas, `studio-coach` setzt nach Ruling um). Kein neues Experiment-Slot nötig, wenn V1 als Regel mit Messfrist wie R314 gilt; sonst als geschärfter E-029 starten.

### V2 · Statusturns streichen oder bündeln (Hebel; Streichen vor neuer Regel)

- Hypothese: `status --status active` und `done` doppeln die Hook-Events `agent_start` und `agent_stop` (`summary` im Stop-Event). `delegated` und `waiting` können im selben Turn stehen wie der Agent- oder SendMessage-Aufruf (parallele Tool-Blöcke; jeder Aufruf bleibt ein eigener Bash-Befehl, Persona-Regel unberührt). Wenn Leads nur noch `waiting`/`blocked`/`failed` und `delegated` im Folgeturn melden und `active`/`done` entfallen, sinkt die Turn-Zahl der Leads um rund 10 %.
- Einsparung: 120 von 1158 Lead-Turns in zwei Sessions; ein Statusturn ist billig (kein Output), daher 2 bis 4 Punkte des Gesamtgewichts in Sessions wie diesen.
- Messgrösse: alleinstehende `log.py status`-Turns je Lead-Instanz. Ausgang 3,2; Schwelle ≤ 1 über 3 Sessions. Gegenprobe: Dashboard und `state.md` zeigen aktive Leads unverändert (Stichprobe aus `.studio/events.jsonl`: jeder Lead hat `agent_start` und `agent_stop`).
- Vorbedingung: `studio-coach` prüft vor der Umsetzung, dass Dashboard und `effort.py` `active`/`done` nicht aus den `log`-Events, sondern aus den Hook-Events beziehen. Zeigt die Prüfung eine Abhängigkeit, entfällt V2 oder wird auf „bündeln“ beschränkt.
- Rückfall: Persona- und Handbuchtext zurück (`git show <Commit>~1:…`).
- Aufwand: klein (Persona-Zeilen in `lead-*.md` und Abschnitt Logging in `STUDIO.md`).

### M1 · Messauftrag (kein Hebel): Zerlegung der Steuerung als Abschnitt der Metrik-Datei

- Inhalt: In `tools/studio/efficiency.py`/`metrics.py` unter „Neuschreibungen nach Pause > 5 min“ eine Spalte „vorher kein Tool (Turn-Ende)“ ergänzen (heute nur „vorher Bash/Agent“), dazu je Session: Lead-Turns je Delegation, alleinstehende Statusturns je Lead-Instanz, Anteil der Lead-Instanzen mit ≥ 70 Turns am Gesamtgewicht, opus-Anteil der Lead-Turns, Ausgabe nur in der Session-Datei, keine neue Ampelzeile.
- Verantwortlich: `studio-coach` mit `lead-tech` (Werkzeug-Paket, Nachtrag zu TOOL-AMPEL). Frist: erster Metrik-Lauf nach der nächsten Session, spätestens in 2 Sessions.
- Zweck: V1 und V2 messen, E-029 („Aufschlüsselung der Steuerung“) ersetzen, und prüfen, ob lange Plan-Lead-Instanzen (M12-SEE-PLAN, 89 Turns) wiederkehren; erst dann ist ein Hebel dafür vertretbar.

### Ruling-Vorschlag an L0

R318 (Vorschlag): (1) V1 und V2 annehmen, Wirkung ab Handbuch-Version nach Umsetzung, Frist 3 Sessions mit ≥ 10 Lead-Starts, Bewertung in der nächsten Session-Retro des `studio-coach`. (2) M1 beauftragen. (3) E-029 durch V1 und M1 ersetzen (E-029 bleibt als Verweis). (4) Die Messaufträge der Ampel-Tabelle (L0-Kontext, Spec-Grösse) gelten mit den genannten Fristen. Empfehlung: annehmen; das Risiko ist V1 (Übergabeverlust), abgesichert durch Gegenprobe und Rückfall.

## Bewertung laufender Experimente

- E-037/E-038: noch nicht gestartet (kein Platz, Regel gilt seit Handbuch 1.25). Die Messgrössen bleiben unverändert; V1 und V2 greifen auf anderen Zählgrössen (Lead-Turns). Wechselwirkung beachten: E-037 Hebel 1 erhöht die Turn-Zahl um Abfrage-Turns, M1 weist beide getrennt aus.
- E-029: nicht gestartet seit 2026-10-05; Hypothese in B1 bis B3 teils belegt (Konzentration auf wenige lange Lead-Instanzen, Turn-Zahl); Vorschlag: durch V1 und M1 ersetzen. E-036: in der Tabelle „Neuschreibungen nach Pause > 5 min“ aufgegangen.

## Änderungen an lernen.md

- Vorschlag (für `studio-coach` nach Ruling): „Ein Lead wartet nicht über Pausen > 5 min; er berichtet und wird per Handoff abgelöst (V1)“ und „Statusmeldungen, die ein Hook-Event doppelt, entfallen (V2)“. Bis zum Ruling keine Änderung.

## Befunde ausserhalb des Scopes

- Die Klasse „Leads“ der Ampel mischt Orchestrierung und Autorenarbeit (Plan-Leads schreiben selbst). Das macht die Zeile „Steuerungsanteil“ in Planungssessions strukturell rot. Kein Eingriff in die Schwellen (sonst würde die Ampel geschönt); M1 liefert die Trennung. In `docs/beobachtungen.md` eingetragen.
