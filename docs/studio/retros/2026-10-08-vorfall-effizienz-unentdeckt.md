# Vorfall-Retro: Effizienz-Muster blieb unentdeckt — 2026-10-08

- Datum: 2026-10-08
- Art: adhoc (Vorfall, R315)
- Auslöser: R315 (Nutzeranweisung nach R314); Paket RETRO-EFFIZIENZ-SELBST
- Datenbasis: `docs/studio/retros/*.md` (alle seit 2026-10-02), `docs/studio/rulings.md` (R233, R278, R302, R305, R314, R315), `docs/studio/experimente.md` (E-029, E-036 bis E-038), `docs/studio/templates/retro.md`, `tools/studio/effort.py` (`incidents`), `.studio/events.jsonl` (Starts von `studio-process-coach`), `python3 tools/studio/metrics.py --efficiency` (32 Sessions)
- Grenzen: Kurz-Retro; Kosten je Paketfamilie nicht neu gemessen (stehen in `2026-10-08-proc-aufwandsverteilung.md`). Das Wegwerf-Skript aus dem Scratchpad liegt in der laufenden Session nicht mehr vor; Abschnitt P2 beschreibt es nach Bericht B4 dieser Retro.

## Beobachtung

### B1 · Die Ampel wurde gelesen, Cache-Write stand in 11 Retros rot

- Beleg (Cache-Write 5 min, jeweils rot, Schwelle 25 %): `2026-10-02-adhoc-token-effizienz.md` B2 (28,6 %), `2026-10-04-session-e13c3631.md` (25,9 %), `2026-10-05-session-ad51d3c5.md` (28,8 %), `2026-10-05-prozess-retro-rel-03.md` (28,8 %), `2026-10-05-prozess-rel04-e0.md` (25,7 %), `2026-10-06-adhoc-ci-ht4.md` (26,1 %), `2026-10-06-session-e51712dd.md` (35,8 %), `2026-10-06-prozess-rel05.md` (35,8 %), `2026-10-07-adhoc-session-7db07561.md` (39,6 %), `2026-10-07-session-7db07561-ende.md` (42,9 %), `2026-10-08-session-8ef9d27f-ende.md` (29,2 %).
- Die Ursache stand schon am 2026-10-02 in B2: Wer länger als 5 min auf einen Vordergrund-Arbeiter wartet, schreibt danach den Kontext neu. Es fehlte also nicht die Beobachtung, sondern ein Hebel, der trifft.
- Die Einträge der Folge-Retros lauten: „Ursache nicht untersucht (Vorfall ohne Bezug)" (ci-ht4), „Ursache unbelegt; kein Experiment, alle 3 Plätze belegt" (e51712dd), „nicht belegt (keine Aufschlüsselung)" (7db07561 adhoc), „Hypothese" (7db07561 ende), „durch E-036 und R314 Hebel 1 abgedeckt" (8ef9d27f).

### B2 · Der einzige angenommene Hebel zielte auf die falsche Grösse

- R233 V1 (Warte-Turn-Enden der Leads senken, `waiting` loggen) misst „Turns mit Wartetext je 30 min". Die Neuschreibung entsteht aber durch eine Pause über 5 min zwischen zwei Modellaufrufen, nicht durch Wartetext. Die Umsetzung ruhte ausserdem nach R237 (`2026-10-05-prozess-rel04-e0.md`, Zeile zu R233 V1); nach R278 (7) blieb sie „bestehen", ohne Messung.
- E-029 (Lead-Übergabe) steht seit 2026-10-06 auf „vorgeschlagen", E-036 (Cache-Write gegen Wartezeit) seit 2026-10-07, beide ohne Start. Der Grund steht in `2026-10-06-session-e51712dd.md`: alle Experiment-Plätze belegt.
- Erst `2026-10-08-proc-aufwandsverteilung.md` B4 wertete die Transkripte aus: 21,7 von 22,9 Punkten der Neuschreibungen folgen auf eine Pause über 5 min; Umsetzer 12,0 Punkte (112 von 115 Ereignissen nach einem Bash-Aufruf), Leads 7,5 Punkte (Median 9 bis 14 min Pause). Diese Auswertung war ein Wegwerf-Skript, das keine Retro vorher geschrieben hatte.

### B3 · Prozess-Aussensicht: REL-05 ja, REL-06 nein

- REL-03, REL-04, REL-05 haben je eine Prozess-Retro (`2026-10-05-prozess-retro-rel-03.md`, `2026-10-05-prozess-rel04-e0.md`, `2026-10-06-prozess-rel05.md`). Die Retro REL-05 hat V5 (Cache-Write aufnehmen) vorgeschlagen; R278 (7) hat es in „R233 V1 bleibt" umgewandelt, also keinen neuen Hebel.
- Nach REL-06 (Commit `e7cee11`, R302, 2026-10-07) gibt es keinen Start von `studio-process-coach` bis zum 2026-10-08 06:55Z (Events in `.studio/events.jsonl`). Die Ad-hoc-Retro 7db07561 und die Session-Ende-Retro vom `studio-coach` deckten Vorfälle ab, aber nicht die Frage „Wo wartet jemand?" (R127 verlangt die Aussensicht nach jedem Release).
- Es gibt keinen Auslöser, der das erzwingt: `effort.incidents` kennt nur `failed`, `inaktiv`, `ci`, `budget` und Review-Runden (`tools/studio/effort.py`, Funktion `incidents`). „Release gemergt" und „Ampel rot" sind keine Vorfälle.

### B4 · Vorlage und Werkzeug zielen auf das Symptom

- `docs/studio/templates/retro.md` verlangt bei Rot „Experiment-Vorschlag **oder die Begründung, warum keiner folgt**". Die Begründung „Ursache unbelegt" oder „Plätze belegt" genügt formal und kam fünfmal vor (B1).
- Die Ampel zeigt Anteile über die ganze Historie oder eine Session. Sie zeigt nicht, nach welchem Ereignis die Neuschreibung folgt (Pause, Bash, Subagent-Wartezeit) und in welcher Paketfamilie. Das ist genau die Auswertung, die B2 liefern musste.

## Deutung

5-Why:

1. Warum blieb der Hebel aus? Jede Retro schloss die rote Zeile mit Hypothese oder „abgedeckt durch X", ohne dass X die Pause traf.
2. Warum genügte die Hypothese? Die Vorlage lässt die Begründung statt eines Vorschlags zu, und Retros sind auf ihren Anlass zugeschnitten (CI-Fehler, Session-Ende), nicht auf die rote Zeile.
3. Warum gab es keine Messung? Die Messung (E-036) war ein Experiment-Vorschlag und wartete auf einen Platz; das Werkzeug, das die Pause ausweist, existiert nur als Wegwerf-Skript.
4. Warum erzwang nichts die Aussensicht? Ein roter Wert über Sessions ist kein Vorfall im Sinn von `effort.incidents`; die Release-Retro hängt an der Erinnerung von L0 (REL-06 ausgefallen).
5. Wurzel: Die Rückkopplung hängt an Disziplin (Lesen, Erinnern) statt an einem Auslöser und einem Pflichtergebnis. Muster, kein Einzelfall: 11 von 11 Retros mit roter Zeile endeten ohne passenden Hebel.

Hinweis zur Ehrlichkeit: R305 („keine neuen generellen Prozesse") bremste Werkzeug-Pakete zusätzlich; R315 ist eine neuere, ausdrückliche Nutzeranweisung und deckt die Vorschläge unten.

## Vorschläge (KISS: ein Auslöser, eine Pflicht, eine Messung)

### V1 · Auslöser: rote Ampelzeile in zwei Sessions in Folge ist ein Vorfall (Hebel: sicher, sofort)

- Auslöser: Die beiden letzten Session-Metrik-Dateien (`docs/studio/metriken/S-*.md`) führen dieselbe Zeile rot und je mindestens 10 Agenten (sonst Rauschen, vgl. 3-Agenten-Session 8ef9d27f).
- Rolle: L0 sieht den Vorfall wie „CI fehlgeschlagen" über Hook (`incident_notice`) und startet den `studio-process-coach` ad hoc; der Coach quittiert mit `log.py retro --triggers ampel:<kennzahl>:<n>`.
- Werkzeug: `effort.incidents` um eine Gruppe `ampel:<kennzahl>:<n>` erweitern (`n` = bisher quittierte + 1; feuert erneut erst nach zwei weiteren roten Sessions). Kein neuer Hook, keine neue Datei.
- Aufwand: klein (eine Funktion plus Test in `tests/studio/`), Studio-Werkzeug-Paket.
- Messgrösse: Zeit von zweiter roter Session bis Retro-Quittung ≤ 1 Session; Rückschau: Cache-Write hätte am 2026-10-03 gefeuert (erste zwei rote Session-Dateien), also fünf Tage vor R314.
- Rückfall: Gruppe aus `incidents` entfernen; Retro-Pflicht bleibt.

### V2 · Pflicht: rote Zeile verlangt Ruling-Vorschlag, „Ursache unbelegt" zählt nicht als Begründung

- Auslöser: jede Retro mit roter Ampelzeile (auch Ad-hoc).
- Rolle: Autor der Retro (`studio-coach` oder `studio-process-coach`).
- Werkzeug: Vorlage `templates/retro.md`, Ampel-Tabelle um die Spalte „Hebel (E-/R-Nr.) oder Messauftrag mit Frist" ergänzen; Regel: Bei Rot ist die Hypothese kein Ende, sondern ein Messauftrag, der bis zur nächsten Retro Daten liefert. In der dritten Retro in Folge mit derselben roten Zeile ist ein Vorschlag Pflicht, die Begründung entfällt. Ein Satz in `lernen.md`.
- Aufwand: sehr klein (Vorlage + ein Satz), Handbuch-Änderung durch `studio-coach` nach L0-Ruling.
- Messgrösse: Anteil roter Ampelzeilen mit Hebel oder Messauftrag in der Retro = 100 % (Ausgang: 0 von 11 mit passendem Hebel).
- Rückfall: Spalte streichen.

### V3 · Messung: E-036 ausbauen und festschreiben (kein neues Experiment)

- Auslöser: Jedes `metrics.py`-Lauf für eine Session-Datei.
- Rolle: `studio-coach` lässt die Auswertung beim Metrik-Lauf mitlaufen; Process-Coach liest sie.
- Werkzeug: E-036 (in `tools/studio/metrics.py` bzw. `efficiency.py`) erweitert um (a) Aufschlüsselung der Neuschreibungen über 20k nach Pause über 5 min, nach Rolle und nach Paketfamilie (Paket-ID-Präfix, z. B. `H-R`, `REL`), (b) Anteil der vorangehenden Bash-Aufrufe, (c) Zeile „Median-Pause je Lead". Ausgabe als Abschnitt der Session-Datei, nicht als zusätzliche Ampel (keine weitere Zeile, die keiner liest).
- Aufwand: mittel (halber bis ganzer Tag Werkzeug-Paket; Vorlage ist das Skript aus `proc-aufwandsverteilung`).
- Messgrösse: Abschnitt in jeder neuen Session-Datei vorhanden; E-037 wird gegen (b) „Neuschreibungen nach Pause je Umsetzer-Instanz < 20" bewertet, die heute von Hand ausgezählt werden müsste.
- Rückfall: Abschnitt entfernen, rein lesend.
- Reihenfolge: V2 sofort (nur Text), V1 und V3 als ein Werkzeug-Paket „TOOL-AMPEL"; V3 ist Voraussetzung, damit E-037/E-038 überhaupt messbar sind.

Nicht vorgeschlagen: eine zusätzliche Auslöser-Regel für „Release gemergt". Der Rest von B3 lässt sich mit einer Zeile in der Release-Checkliste von L0 lösen („nach Merge auf main: `studio-process-coach` starten, R127"); die Wirkung ist wie bei V1 über das Quittieren messbar. Das ist ein Detail für L0, kein viertes Werkzeug.

## Frage 3 · Spannung zu Parallelität

- Beobachtung: Verfassung §5.8 verlangt Parallelisieren; ADR-007 und `docs/studio/STUDIO.md` (Vordergrund-Regel) halten Arbeiter-Starts im Vordergrund. R314 und das Handbuch 1.25 betreffen nur das Bash-Werkzeug und die Lead-Schicht bei genau einem Umsetzer.
- Deutung: Keine Kollision. Hintergrund-Bash lässt mehrere Agent-Aufrufe in einer Nachricht unberührt; ein Ein-Umsetzer-Paket hat ohnehin keine Parallelität zwischen Arbeitern, es entfällt nur eine Berichtsschicht. Die strukturelle Kost bleibt: Wo ein Lead mehrere Arbeiter parallel hält, ruft er sie im Vordergrund auf und kommt nach der längsten Laufzeit zurück (Median 9 bis 14 min bei `lead-tech`/`lead-art`, Bericht B4). Jeder Rückkehr nach über 5 min schreibt den Lead-Kontext neu (Median 75k, Ampel grün). Das ist der Preis der Hierarchie und wird mit R314 Hebel 1 nicht gesenkt, weil Hebel 1 den Lead nicht berührt.
- Hebel, der Parallelität erhält und die Kost senkt (Empfehlung, noch nicht belegt):
  1. Kontext des Leads vor dem Fan-out klein halten: der Lead liest vorher keine grossen Dateien und gibt Arbeitern Pfade statt Inhalte. Kosten je Rückkehr ≈ 1,25 × Kontext, also linear zum Kontext; Median 75k ist schon grün, die Streuung nicht (`lead-art` bis 2,7 Mio Cache-Write in `2026-10-05-session-ad51d3c5.md`).
  2. Alle Leads auf `sonnet` für Fan-out-Phasen mit klarem Briefing (Modellfaktor 0,6 laut `efficiency.py`); Parallelität bleibt, Kost sinkt um 40 % je Neuschreibung. R314 Hebel 5 setzt das bisher nur für Ein-Umsetzer-Pakete um; die Erweiterung wäre ein Messpunkt in E-038, nicht eine neue Regel.
  3. Zu prüfen, nicht zu beschliessen: ob sich für Leads ein 1-h-Cache einstellen lässt. Die Ampel weist „Cache-Write 1 h" bereits mit 3,1 % aus, es gibt also einen Weg dorthin. Rechnerisch (1,25 pro 5-min-Neuschreibung gegen 2,0 einmalig pro Stunde) lohnt sich 1 h ab der zweiten Rückkehr innerhalb einer Stunde. Ob und wie das steuerbar ist, ist ungeprüft; ein Probe-Start des Coaches ist der erste Schritt.
  4. Die Regel „Fortsetzen statt neu starten" widerspricht dem Cache bei Pausen über 5 min nicht (der fortgesetzte Agent schreibt ohnehin neu), sie sollte aber bei Kontext über 150k durch die Übergabe von E-029 ersetzt werden, weil dort jede Fortsetzung am teuersten ist.
- Kein Hebel nimmt die Parallelität, ausser man würde die Vordergrund-Regel aufheben; das wäre eine ADR-007-Änderung und gehört nicht in diese Retro.

## Effizienz-Ampel

Quelle: `python3 tools/studio/metrics.py --efficiency` (32 Sessions, 29610 Aufrufe).

| Kennzahl                             | Wert   | Ampel | Befund / Ursache                                                            |
| ------------------------------------ | ------ | ----- | --------------------------------------------------------------------------- |
| Steuerungsanteil                     | 49,8 % | gelb  | Leads 34,9 %; B2, Frage 3                                                   |
| Umsetzeranteil                       | 24,6 % | grün  | –                                                                           |
| Cache-Write 5 min                    | 29,2 % | rot   | B1 bis B4; V1 bis V3; E-037 läuft an                                        |
| Lead-Kontext Median                  | 75k    | grün  | –                                                                           |
| L0-Kontext Max                       | 774k   | rot   | kein Vorschlag: andere Ursache (Session-Länge), E-029 deckt die Übergabe ab |
| opus-Anteil                          | 74,1 % | gelb  | steht in E-038 (sonnet-Leads)                                               |
| Persona als general-purpose auf opus | 45     | rot   | Nachtrag (V2, R316): siehe Abschnitt „Nachtrag V2“                          | Messauftrag bis zum nächsten Metrik-Lauf nach TOOL-AMPEL |
| Grösste gelesene Datei               | 59 KB  | gelb  | –                                                                           |

## Bewertung laufender Experimente

- E-037/E-038: noch nicht gestartet (Plätze). Empfehlung: V3 als Messgrundlage vor dem Start fertigstellen, sonst sind (b) und (c) von Hand auszuzählen.
- E-036: in V3 aufgegangen (Ruling: E-036 durch V3 ersetzen oder erweitern).

## Änderungen an lernen.md

- Vorschlag (für `studio-coach` nach Ruling): „Rote Ampelzeile in der Retro verlangt Hebel oder Messauftrag; ‚Ursache unbelegt' ist kein Abschluss" (V2).

## Nachtrag V2 (R316): Persona als general-purpose auf opus

- Beobachtung: `tools/studio/guard.py` (`agent_reason`, Zeilen 503 bis 514) blockt einen Persona-Start als `general-purpose` nur, wenn `model` fehlt. Probe mit Hook-Payload (`hook_event_name: PreToolUse`): ohne `model` Deny (R167), mit `model: "opus"` kein Deny. Die Kennzahl `persona_opus` (`tools/studio/efficiency.py`, Zeile 334) zählt jeden Persona-Start mit Modell opus, über die gesamte Historie (32 Sessions), also auch Starts vor dem Guard (Commit `5f75b26`, 2026-10-04) und Starts mit ausdrücklichem `model: opus`.
- Beobachtung: `.studio/events.jsonl` (`kind: spawned`) trägt weder `model` noch Agent-Typ; die 45 lassen sich daraus nicht nach Datum oder Modellquelle trennen (538 `spawned` vor, 315 ab 2026-10-04).
- Deutung (Hypothese): Der Guard prüft Abwesenheit, nicht Angemessenheit. Ein ausdrückliches `opus` für eine sonnet-Persona passiert ihn; ebenso zählt die Kennzahl auch zulässige Starts der opus-Personas (z. B. `studio-coach`, Frontmatter `model: opus`) mit. Ob die 45 Altlast, Fehlstarts oder zulässig sind, ist unbelegt.
- Messauftrag mit Frist (kein Hebel, solange die Ursache unbelegt ist): TOOL-AMPEL (lead-tech) trennt `persona_opus` nach Startdatum (vor/nach 2026-10-04) und nach Abweichung vom Frontmatter-Modell der Persona (Start-Modell opus bei Persona-Modell sonnet). Frist: erster Metrik-Lauf nach dem Merge von TOOL-AMPEL, spätestens die nächste Session-Retro; diese Retro wertet aus.
- Hebel-Vorschlag, bedingt: Zeigt die Trennung Starts nach 2026-10-04 mit Modell ungleich Persona-Modell, ergänzt der Guard eine Prüfung „`model` weicht vom Frontmatter der Persona ab“ (Werkzeug-Paket, L0-Ruling). Zeigt sie nur Altlast oder zulässige Starts, wird die Kennzahl auf Abweichungen umgestellt und die Zeile fällt von selbst auf grün.
- Rückfall: keiner nötig (reine Messung).
