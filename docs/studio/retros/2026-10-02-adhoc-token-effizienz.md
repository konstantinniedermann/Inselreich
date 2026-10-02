# Retro adhoc Token-Effizienz — 2026-10-02

- Datum: 2026-10-02
- Art: adhoc
- Auslöser: Nutzerauftrag Token-Effizienz (R167), kein Vorfall mit ID
- Datenbasis: `.studio/handoffs/EFF-analyse.md` (15 Hauptsessions, 512 Subagenten-Transkripte), `docs/studio/rulings.md` (R166, R167), `docs/studio/experimente.md`, `.studio/events.jsonl`

Einschränkung: Die Zahlen stammen aus der L0-Analyse (Schätzung nach Kostengewicht, keine Abrechnung); der Coach hat sie nicht neu berechnet. Das Werkzeug-Paket EFF-W macht sie reproduzierbar.

## Befunde

### B1 · Steuerung kostet mehr als Umsetzung

- Beobachtung: Leads (Steuerung) 44,8 % des Kostengewichts, L0 22,4 %, Review/QA/Merge 12,4 %, Design/Spec/Plan 7,8 %, Umsetzer 5,0 %, Studio-Betrieb 4,5 %. lead-tech allein 20 %.
- Beleg: `.studio/handoffs/EFF-analyse.md`, Abschnitt „Anteil nach Rollenklasse“
- Wirkung: Steuerung (L0 + Leads) 67,2 %, Umsetzer 5,0 %. Das Wochenfenster geht an Koordination, nicht an Spielentwicklung.
- Deutung: Ein Muster über alle 15 Sessions, kein Einzelfall. Ursache: langlebige Leads auf opus als Controller sammeln alle Arbeiterberichte, jeder Schritt liest den ganzen Kontext neu (Cache-Read 61,6 %).

### B2 · Cache-Write 5 min durch wartende Leads

- Beobachtung: Cache-Write 5 min 28,6 %. Neuschreibungen über 20k: lead-tech 51, general-purpose 84, lead-qa 31, lead-art 29, lead-design 27.
- Beleg: `.studio/handoffs/EFF-analyse.md`, Tabelle „Kontext je Rolle“
- Wirkung: Wer länger als 5 min auf einen Vordergrund-Arbeiter wartet, schreibt danach den ganzen Kontext neu.
- Deutung: Der Kontext der wartenden Leads ist gross (Mittel 113k bis 169k). Kleiner Kontext oder kürzere Lebensdauer senkt beides.

### B3 · Riesige Dokumente werden ganz gelesen

- Beobachtung: Plan M8 310 KB, Plan M10 274 KB, Spec M10 169 KB, `rulings.md` 55 KB, `STUDIO.md` 31 KB. Leseaufrufe: `rulings.md` ca. 870, Plan M8 ca. 430, `STUDIO.md` ca. 420.
- Beleg: `.studio/handoffs/EFF-analyse.md`, Ursache 3
- Wirkung: Jeder Arbeiter und Reviewer lädt Dokumente weit über seinen Task hinaus; das Gewicht landet im Kontext und damit im Cache.
- Deutung: Das Plan-Format (eine Datei je Plan) verleitet zum Ganz-Lesen. Das Format ist die Wurzel, nicht die Disziplin der Leser.

### B4 · Lange L0-Sessions, Bilder im L0-Kontext

- Beobachtung: L0-Kontext Mittel 141k, Max 774k; L0 las selbst Screenshots. Handbuch verlangt Übergabe bei 50 % Kontext.
- Beleg: `.studio/handoffs/EFF-analyse.md`, Ursache 4; `docs/studio/STUDIO.md`, Abschnitt „Limits und Sessiongrösse“
- Wirkung: L0-Anteil 22,4 %; ein Max von 774k heisst, die 50 %-Regel griff nicht oder zu spät.

### B5 · Modell geerbt statt gewählt

- Beobachtung: 2040 von 3666 `general-purpose`-Aufrufen liefen auf opus (geerbt), darunter ca. 40 Task-Reviews. Gesamt: opus 83 %, sonnet 12 %, fable 5 %.
- Beleg: `.studio/handoffs/EFF-analyse.md`, Ursache 5; Regel „Modell explizit setzen“ steht seit langem in `docs/studio/lernen.md`
- Wirkung: Die Regel stand im Handbuch und in `lernen.md`, wurde aber nicht durchgesetzt. Ohne Guard keine Wirkung (Teil von EFF-W).

### B6 · Warum fanden die Retros es nicht?

- Beobachtung: Keine der Retros M7, M7-UX, M8 und der Session-Retros benennt Token-Effizienz als Befund. `metrics.py` zeigt absolute Tokens je Lead und Modell, aber keine Anteile nach Rollenklasse, keine Kontextgrössen, keine 5-min-Neuschreibungen und keine Schwellen. E-010 mass nur Cache-Read je Controller je Task, nicht das Verhältnis Steuerung zu Umsetzung. Die Retro-Vorlage hat keinen Pflichtpunkt Effizienz.
- Beleg: `.studio/handoffs/EFF-analyse.md`, Abschnitt „Warum die Retros es nicht fanden“; `docs/studio/templates/retro.md` (kein Effizienz-Abschnitt); `docs/studio/experimente.md` E-010
- Wirkung: Das Problem blieb bis zu einer Nutzerfrage unsichtbar. Eine Retro findet nur, was ihre Datenbasis und ihre Vorlage zeigen.
- Deutung: Zwei Ursachen. (1) Messlücke: keine Kennzahl mit Schwelle. (2) Prozesslücke: kein Pflichtpunkt, also hing der Fund an der Aufmerksamkeit des Coachs. Zusätzlich war E-010 zu eng gemessen (Teilgrösse statt Anteil), und die Prüffrage 4 der Persona („Verschlechtert der Vorschlag die Messbarkeit?“) fragt nach Experimenten, nicht nach dem Gesamtbild. Gegenmassnahme: Abschnitt „Effizienz“ in `metrics.py` mit Ampel und Pflichtpunkt „Effizienz-Ampel“ in jeder Retro.

## Befragung der Leads

- Keine Befragung (Budget: keine Agenten starten). Datenbasis ist die L0-Analyse; Lead-Berichte nicht neu gelesen.

## Effizienz-Ampel

Das Werkzeug (`metrics.py --efficiency`, EFF-W) liegt noch nicht vor; die Ampel ist hier von Hand aus der L0-Analyse gegen die Schwellen aus `docs/studio/verbesserung.md` gelesen.

| Kennzahl                                  | Wert                   | Ampel        | Ursache                                 |
| ----------------------------------------- | ---------------------- | ------------ | --------------------------------------- |
| Steuerungsanteil (L0 + Leads)             | 67,2 %                 | rot          | B1                                      |
| Umsetzer                                  | 5,0 %                  | rot          | B1                                      |
| Cache-Write 5 min                         | 28,6 %                 | rot          | B2                                      |
| Lead-Kontext-Median                       | Mittel 81k bis 169k    | gelb bis rot | B2 (Median nicht vorhanden, nur Mittel) |
| L0-Kontext Max                            | 774k                   | rot          | B4                                      |
| opus-Anteil                               | 83 %                   | rot          | B5                                      |
| Persona-Starts `general-purpose` auf opus | 2040 Aufrufe insgesamt | rot          | B5 (nicht nur Personas)                 |
| grösste gelesene Datei                    | 310 KB (Plan M8)       | rot          | B3                                      |

Jede Zeile rot oder gelb: Vorschläge unten (E-010 angepasst, E-014) und Handbuch 1.13; die Modellwahl (B5) ist eine Regeländerung mit Guard (EFF-W), kein Experiment.

## Vorschläge

- E-010 wird zu „Schlanke Steuerung“ angepasst (Ursachen B1, B2). Messgrössen in M10: Steuerungsanteil ≤ 40 %, Lead-Kontext-Median ≤ 80k, Cache-Write 5 min ≤ 15 %. Rückfall Handbuch 1.12.
- Neu E-014 „Task-Dateien und kurze L0-Sessions“ (Ursachen B3, B4). Messgrössen: grösste gelesene Datei ≤ 40 KB, L0-Kontext Max ≤ 250k. Status `vorgeschlagen`, weil kein Platz frei ist (siehe unten).
- Modellwahl neu (B5): kein Experiment, Regel im Handbuch 1.13 (Ruling R167: die Wahl folgt der Aufgabe).
- Nicht vorgeschlagen: M6 „weniger Prozess je Paket“ erst nach Messung M10 (R167).

Messbarkeit: Keiner der Vorschläge verschlechtert die Messung. Die Messgrössen kommen aus demselben Abschnitt „Effizienz“; die Teilung der Pläne ändert nur die Dateigrösse, nicht die Ereignisse.

## Bewertung laufender Experimente

- E-010: noch keine Messung unter 1.12 (Zeitraum M10); wird mit Auftrag R167 zu „Schlanke Steuerung“ angepasst.
- E-011: Zeitraum M9 und M10, unter 1.12 noch keine abgeschlossenen Pakete → weiter beobachten.
- E-013: Zeitraum M9 und M10. In `.studio/events.jsonl` haben nur 3 `spawn`/`budget`-Ereignisse `handbook_version` 1.12; die Session 58d6bc4a lief unter 1.11 (Ausgangswert, nicht Messung). Die dortigen Phasen (`M10-design`, `M8-umsetzung`, `M10-plan`) gleichen der Paket-ID nicht, das ist der Ausgangszustand. Eine regelkonforme Bewertung ist nicht möglich → weiter beobachten, E-014 bleibt `vorgeschlagen`.

## Änderungen an lernen.md

- neu: Effizienz-Ampel jeder Retro lesen (Befund B6); Persona-Start als `general-purpose` immer mit `model` (B5) · gestrichen: die Zeile „Das Modell im Agent-Aufruf explizit setzen“ wird mit der neuen Zeile zusammengelegt
