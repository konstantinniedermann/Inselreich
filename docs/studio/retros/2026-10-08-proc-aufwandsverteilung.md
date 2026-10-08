# Retro adhoc Aufwandsverteilung nach Arbeitsart — 2026-10-08

- Datum: 2026-10-08
- Art: adhoc
- Auslöser: Nutzerfrage „Was braucht am meisten Zeit? Ist es das Testen des Designs mit den Iterationen?" (PROC-AUFWAND)
- Datenbasis: die letzten 15 Haupttranskripte (3.–8.10., 464 Transkripte inkl. Subagenten) unter `~/.claude/projects/-Users-KN-CAS-projekte-anno-clone/`; `.studio/events.jsonl` und `.studio/archive/` (spawn/spawned für Agent→Paket); Gewichtung wie `tools/studio/efficiency.py`. Wegwerf-Skripte im Scratchpad, nicht im Repo.

## Methode und Grenzen (zuerst lesen)

- Zuordnung Agent→Paket: Persona/Paket aus dem spawn-Event (Verknüpfung über `child_id`), sonst aus der Kopfzeile des ersten Prompts. Alle 463 Subagent-Transkripte sind zugeordnet. Die Klassifikation „Grafik / Funktion / Release / Studio" folgt der Paket-ID (ART-\*, WALD-\*, H-R\*, M\*-R\*, REL-03-ART = Grafik; REL-\* = Release; M\*-Sim/UI/Audio = Funktion).
- Zeit: Wanduhr in Minuten. Jede Minute wird auf die gleichzeitig aktiven Schritte gleich verteilt. Ein Schritt zählt höchstens 15 min. Leerlauf = Lücken von 5 bis 90 min ohne jede Aktivität. Lücken über 90 min (39 h, Nächte) sind Pause und nicht eingerechnet. Basis: 78,7 h Wanduhr in Arbeitsfenstern.
- „Leerlauf" kann nicht zwischen Warten auf den Nutzer und Warten auf CI trennen. Wirklich gemessen ist nur „nichts lief".
- Grafik „Prüfen" und „Nacharbeit" sind Näherungen. Prüfen = (a) Playtester-, Blind-Rater-Instanzen, (b) Schritte eines Render-Engineers, die ein PNG lesen oder Playwright, Screenshot, Perf, Messung, Probe starten (Regex). Nacharbeit = die übrigen Schritte von Instanzen, die erkennbar ein zweiter oder dritter Anlauf sind (Fix-Runde L1, H-R12 „stetige Felder", H-R12b, WALD-02). Iterationen innerhalb einer Instanz zählen als Bauen, ausser sie sind Prüfschritte. Spanne: Prüfen ±3 Punkte, Nacharbeit ±4 Punkte.
- Das Fenster ist grafiklastig (ART-STIL-02 L1–L7, WALD-02, H-R-Reihe). Es steht nicht für ein „normales" Jahr.
- Steuerung = L0 + alle `lead-*`, auch die Leads der Grafik-Pakete. Die Voll-Sicht je Paketfamilie steht separat unter B2.

## Beobachtung

### B1 · Verteilung nach Arbeitsart

| Arbeitsart                         | Zeit (Wanduhr) | Token (Kostengewicht) | Agentenminuten |
| ---------------------------------- | -------------: | --------------------: | -------------: |
| Grafik: Bauen                      |         11,7 % |                16,5 % |         16,4 % |
| Grafik: Prüfen                     |         10,7 % |                 9,9 % |         11,8 % |
| Grafik: Nacharbeit nach Prüfung    |         13,4 % |                14,2 % |         11,5 % |
| **Grafik gesamt**                  |     **35,8 %** |            **40,6 %** |     **39,7 %** |
| Spiel-Funktionen (Sim/UI/Audio)    |         14,8 % |                13,2 % |         19,2 % |
| Review / Merge / Release / CI      |         13,2 % |                 7,5 % |         13,9 % |
| Steuerung: Leads                   |         14,1 % |                26,9 % |         21,9 % |
| Steuerung: L0                      |          3,9 % |                10,3 % |          3,7 % |
| Studio-Betrieb (Retros/Tools)      |          1,3 % |                 1,4 % |          1,7 % |
| Leerlauf (5–90 min ohne Aktivität) |         16,9 % |                     — |              — |

Belege: Skripte `agg.py` und `fam.py` (Scratchpad). Die Token-Summe stimmt mit der Ampel überein (L0 10,3 %).

### B2 · Voll-Sicht je Paketfamilie (alle Rollen eines Pakets zusammen)

| Familie                             | Token  | Agentenstunden | davon Bauen | davon Leads | davon Review/QA/Merge |
| ----------------------------------- | ------ | -------------- | ----------- | ----------- | --------------------- |
| Grafik                              | 54,7 % | 54 h (49 %)    | 39,5 %      | 12,5 %      | 2,6 %                 |
| Funktion                            | 27,9 % | 39 h (36 %)    | 11,6 %      | 12,5 %      | 3,9 %                 |
| L0                                  | 10,3 % | 4 h            | —           | —           | —                     |
| Release (REL-\*)                    | 5,2 %  | 10 h           | 0,9 %       | 1,6 %       | 2,7 %                 |
| Studio-Betrieb                      | 1,8 %  | 3 h            | —           | —           | —                     |
| Quer: Wald-Thema (L1, Fix, WALD-02) | 22,3 % | ca. 20 h       | —           | —           | —                     |

Das Wald-Thema allein (ART-STIL-02 L1, Fix-Runde R298, WALD-02 samt Lead und Blind-Rater, 15 Transkripte) ist ein Fünftel aller Tokens. Der WALD-02-Umsetzer läuft von 09:23 bis 20:13 Uhr (zwei Sitzungen).

### B3 · Iterationen

| Kennzahl                                             | Grafik (20 Einheiten, 33 Umsetzer-Instanzen)               | Funktion (ca. 65 Aufgaben, 65 Umsetzer-Instanzen) |
| ---------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| Runden je Einheit (Bauen → Prüfen → erneuter Anlauf) | 1,35 (27 Anläufe / 20 Einheiten); Spitzen: Wald 4, Dünen 3 | ca. 1,07 (4–5 Fix- oder Folgeläufe)               |
| Prüf-Agenten je Einheit                              | 39 Instanzen / 20 = ca. 2                                  | 98 Instanzen / 65 = ca. 1,5                       |
| Prüfzyklen innerhalb einer Umsetzer-Instanz          | Mittel 9,5, Median 8 (Bild-/Perf-Schritte)                 | Mittel 3,9, Median 3 (Testläufe)                  |
| Dauer einer Umsetzer-Instanz                         | Median 71 min, Mittel 129 min                              | Median 8 min, Mittel 19 min                       |
| Token je Umsetzer-Instanz                            | im Mittel 1,2 % der Gesamtsumme                            | im Mittel 0,08 %                                  |
| Anteil Prüfschritte an den Umsetzer-Kosten           | 22 % der Kosten, 24 % der Zeit                             | nicht vergleichbar erhoben                        |

Die Rundenzählung ist von Hand aus der Paketfolge abgeleitet (Tabelle in diesem Lauf: `seq.py`). Sie ist grob, die Richtung ist eindeutig.

### B4 · Warum die Token so verteilt sind: 5-min-Cache

- 33,8 % des Kostengewichts sind Cache-Writes 5 min (deckt sich mit der Ampel). Davon sind 22,9 Punkte Neuschreibungen über 20k, und 21,7 Punkte davon folgen auf eine Pause von mehr als 5 min zwischen zwei Modellaufrufen. Die Neuschreibungen sind also fast ausschliesslich Ablauf der 5-min-Frist, nicht Kontextwachstum.
- Verursacher: art-rendering-engineer 12,0 Punkte (115 Ereignisse, Median 12 min Pause, 112 davon nach einem Bash-Aufruf: Perf-Läufe, vitest unter Last, Warteschleifen), Leads 7,5 Punkte (lead-art 98 Ereignisse, Median 14 min; lead-tech 75, Median 9 min: sie warten auf Subagenten), Funktion/Release/Rest 2,2 Punkte.

## Deutung

- Der Eindruck stimmt in der Richtung, in der Aufteilung nicht ganz. Grafik ist der grösste Block (36 % Zeit, 41 % Token, in der Voll-Sicht 55 % Token). Reines Prüfen ist mit 11 % Zeit und 10 % Token nicht der Haupttreiber. Prüfen plus Nacharbeit nach der Prüfung sind zusammen 24 % Zeit und 24 % Token, also etwa ein Viertel der Arbeit.
- 5-Why zum Wald: (1) Warum so teuer? Drei Anläufe plus Fix-Runde. (2) Warum Anlauf 2 und 3? Blind-Rater und Sichtprüfung fielen erst nach vollem Umbau. (3) Warum erst dann? Der Prüfmassstab (Anmutung) ist nicht vorab messbar. Der Umsetzer prüft selbst per Bild, 9,5 Zyklen je Instanz. (4) Warum läuft jeder Zyklus lang? Bild-, Perf- und Test-Läufe dauern länger als 5 min, und der Kontext (Median 122k) wird jedes Mal neu geschrieben. (5) Wurzel: Grafik-Pakete haben keinen Aufwandsdeckel und kein Stopp-Gate nach dem ersten verfehlten Prüfurteil, und die Umsetzer-Instanzen sind 15-mal grösser als bei Funktions-Aufgaben.
- Funktions-Aufgaben sind klein, parallel und bestehen den ersten Anlauf fast immer. Dort ist die Prüfung kein Engpass.
- Leerlauf 17 % ist der zweitgrösste Einzelposten. Ursache nicht geklärt (Nutzerwartezeit gegen CI), also kein Hebel vorgeschlagen.
- Der 5-min-Cache kostet etwa 22 % des Gesamtgewichts. Das ist ein reiner Ablauf-Effekt (lange Wartezeiten bei grossem Kontext), kein Qualitätsgewinn. Er trifft Grafik (Umsetzer 12,0 Punkte) und alle Leads (7,5 Punkte) am stärksten.

## Vorschlag

Nach Hebel sortiert; Einsparung als Anteil am Gesamtgewicht, mit Spanne.

1. **Lange Läufe im Takt unter 5 min abfragen.** Umsetzer starten Perf-, Test- und Bildläufe im Hintergrund und fragen alle ≤ 4 min ab. Leads warten auf Subagenten ebenfalls im Takt (Hintergrund-Spawn plus kurzes Polling). Ein Poll kostet etwa 0,1 × Kontext (Cache-Read), eine Neuschreibung 1,25 ×. Einsparung 8–14 % Token. Aufwand klein (Regel im Umsetzer- und Lead-Briefing, Handbuch-Abschnitt). Messgrösse: Ampel „Cache-Write 5 min" unter 15 % (jetzt 33,7 %), Zahl Neuschreibungen nach Pause > 5 min je Umsetzer unter 20 (jetzt 115 in 33 Instanzen). Rückfall: Regel streichen, wenn Cache-Write nicht fällt oder Polling die Laufzeit verlängert.
2. **Aufwandsdeckel und Stopp-Gate für Grafik-Pakete.** Vor dem Bauen werden die Prüfkriterien messbar festgelegt (Zahl oder Bildvergleich). Nach dem ersten verfehlten Prüfurteil entscheidet L0, ob ein weiterer Anlauf lohnt. Deckel zum Beispiel 3 % Token oder 2 h je Anlauf. Einsparung: ein Ausreisser wie das Wald-Thema (22 %) verkürzt sich um 5–10 Punkte je Kampagne, über das ganze Fenster 3–8 %. Aufwand mittel (Gate-Eintrag, Messgrösse im Budget). Messgrösse: kein Grafik-Paket über 2 Anläufe ohne Ruling. Rückfall: Deckel anheben, wenn Pakete wegen Abbruch schlechter ausfallen.
3. **Grafik-Umsetzung in Häppchen von höchstens 45 min.** Ein Start je Schritt mit Handoff-Datei, wie H-R15 und die Funktions-Aufgaben. Median Kontext Render-Engineer von 122k auf unter 80k. Einsparung 4–8 % Token (weniger Rewrite-Volumen, weniger Reads), plus kürzere Wartezeit je Prüfschleife. Aufwand mittel (Briefing-Regel, Lead plant kleiner). Risiko: mehr Starts, Übergabeverlust. Messgrösse: Kontext-Median art-rendering-engineer unter 80k, Starts je Grafik-Paket höchstens +2. Rückfall: zurück zu grossen Paketen.
4. **Billigere Vorprüfung vor Playtester und Blind-Rater.** Skript für Pixel-/Kennzahl-Vergleich (Vorher/Nachher, Kontrast, Kanten) liefert Zahl und Ausschnitt statt voller 4K-Bilder in den Kontext. Der Umsetzer liest nur Ausschnitte. Prüfschritte machen 22 % der Umsetzer-Kosten aus (ca. 9 % Gesamt). Einsparung 3–5 %. Aufwand mittel (ein Skript in `tools/`, Umsetzung durch L0-Auftrag). Messgrösse: Anteil PNG-Reads an Umsetzer-Reads halbiert. Rückfall: Skript entfernen, wenn Blind-Rater öfter widerspricht.
5. **Lead-Schicht verkleinern und billiger fahren.** Leads kosten 26,9 % (Grafik 12,5 %, Funktion 12,5 %). Bei Ein-Umsetzer-Häppchen (H-R-Reihe) startet L0 den Umsetzer direkt und lässt `lead-art` weg. Wo ein Lead bleibt, läuft er auf sonnet statt opus (lead-art: 29 von 47 Starts auf opus). Einsparung 3–6 %. Aufwand klein (Regel in STUDIO.md, Modellvorgabe im Spawn). Messgrösse: Leads-Anteil unter 20 % (Ampel „Steuerung" bleibt unter 40 %). Rückfall: Lead wieder einsetzen, wenn Briefing-Rückfragen oder Fehlstarts zunehmen.

Die Vorschläge 1 und 3 verstärken sich (kleinerer Kontext senkt den Preis jeder verbleibenden Neuschreibung). Wirkung getrennt messbar, wenn zuerst 1 eingeführt wird und dann nach einer Woche 3.

## Befunde ausserhalb des Scopes

- Die Rollenklassen der Ampel führen Leads der Grafik-Pakete unter „Leads". Für die Frage „was kostet Grafik" wäre eine Auswertung nach Paketfamilie nützlicher. Möglicher Folgeschritt: Option `--by-package` in `efficiency.py` (Auftrag an `studio-coach`, nicht von mir umgesetzt).
- Der Leerlauf (17 %) ist nicht in Nutzerwartezeit und Systemwartezeit getrennt. Ein Event „wartet auf Nutzer" fehlt.
