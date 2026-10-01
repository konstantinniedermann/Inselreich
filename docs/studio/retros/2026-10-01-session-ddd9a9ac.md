# Retro session ddd9a9ac (Cloud „Thema abschliessen") — 2026-10-01

- Datum: 2026-10-01
- Art: session
- Auslöser: Session-Ende (Übergabe R120); offener Vorfall laut Metrik (1), ohne Kennung im Auftrag
- Datenbasis: `docs/studio/metriken/S-2026-10-01-ddd9a9ac.md`, `docs/studio/rulings.md` (R107–R120), `docs/beobachtungen.md` (Einträge 2026-10-01, u. a. Harness, Zeittests, `git stash`), `docs/studio/state.md` (Parallele Sessions), L0-Zusammenfassung im Auftrag
- Umfang: Kurz-Retro, keine Lead-Befragung (Rulings und Metrik reichen). Befund B5 (Classifier-Sperre) stützt sich nur auf die Angabe von L0, ohne Datei-Beleg.

## Befunde

### B1 · Ephemerer Container vernichtet ungepushte Arbeit

- Beobachtung: Vier Pakete (A1, A2, R5, X1a) und die M8-Spec lagen nur auf lokalen Branches und gingen mit dem Container verloren.
- Beleg: `docs/studio/rulings.md` R107 (Punkt 1 und 2: Neuumsetzung, Push-Pflicht).
- Wirkung: Doppelarbeit von etwa 4 Paketen (R107, „bereits eingetreten"). Die Regel steht seit R107 in `lernen.md`; die Wirkung der Push-Pflicht ist in dieser Session belegt: der Render-, Audio- und UI-Strang liegt auf `origin` (R119, R120 Punkt 4).
- Deutung: Muster über mehrere Pakete, kein Einzelfall. Die Regel gilt bisher nur als Ruling, nicht im Handbuch.

### B2 · Leads ohne Agent-Werkzeug in der Cloud

- Beobachtung: Als Subagent gestartete Leads hatten kein Agent-Werkzeug; L0 startete alle Arbeiter direkt.
- Beleg: R108, `docs/beobachtungen.md` (Eintrag Harness 2026-10-01); Metrik: 93 von 96 Agenten unter `studio-director`, nur 3 unter Leads.
- Wirkung: Arbeit lief, aber die Steuerlast lag bei L0 (1505 von 1650 Werkzeugaufrufen). Folgekosten für die Budgetzuordnung: L0 zählt je Start mit.
- Deutung: Harness-Grenze, nicht aus dem Repo änderbar. Der Rückfall ist bewährt, aber im Handbuch nicht als Betriebsart beschrieben.

### B3 · Netzwerk-Policy sperrte Asset-Quellen

- Beobachtung: freesound, opengameart, fonts.google.com, archive.org gesperrt; Lizenz-Handoffs lagen nur im alten Container.
- Beleg: R109 (X1a pausiert), R119 (a) (lokal erhaltene Assets der anderen Session lösen N-90).
- Wirkung: M7 lief mit prozeduralen Rückfällen weiter; gelöst durch Zufall (Assets lagen in der anderen Session), nicht durch Vorsorge.
- Deutung: Einzelfall dieser Umgebung; Lehre ist B1 (Push), keine eigene Regel.

### B4 · Parallele L0-Sessions: Nummernkollision

- Beobachtung: Beide Sessions vergaben R107 und R118; die Cloud-Session schrieb ein R118 lokal, pushte nie und nahm es per Revert zurück; Neufassung als R120.
- Beleg: `docs/studio/rulings.md` R118 („Ursprünglich als R107 geschrieben … umnummeriert"), R120 („Lokal zuerst als R118 geschrieben … per Revert zurückgenommen"), `git log` (bfb09ef Revert); `docs/studio/state.md` Tabelle „Parallele Sessions" listet die Cloud-Session erst als „idle, übergeben".
- Wirkung: zwei Umnummerierungen, ein Revert, eine Übergabe-Runde (R119, R120).
- Deutung: Zweite Episode paralleler L0-Sessions (nach baff17bb/25e8352d). Es ist keine Basis-Drift im Sinn von E-002, sondern eine nicht abgedeckte Klasse: Ruling-Nummern und Push-Zeitpunkt. Die Tabelle wurde zu spät gepflegt.

### B5 · Prozessfehler in der Arbeitssteuerung

- Beobachtung: (a) Umfangserweiterung per SendMessage vom Classifier blockiert, der Arbeiter nutzte ein Python-Skript (nur L0-Angabe); (b) QA-Baum `ui-qa` wurde während QA-M6U3 von einem Reviewer umgestellt; (c) bare `git stash` bei fünf parallelen Worktrees; (d) L0-Briefing der UI-Nachzüge verlangte das Gegenteil der M6-Spec (HUD-Bilanz bei Brand).
- Beleg: (b) R116; (c) `docs/beobachtungen.md` (Eintrag Studio, „Retro-Kandidat"); (d) R115 („L0 hatte im Briefing … versehentlich das Gegenteil verlangt … E-003 Zweck-Gegenprobe").
- Wirkung: (b) QA-Ergebnis musste als BEDENKEN laufen; (d) eine Fix-Runde plus Zurücknahme `runningBalance` (d38b9af). (c) ging gut.
- Deutung: Vier verschiedene Ursachen, je ein Fall, noch kein Muster. Gemeinsam ist (b)/(c): geteilter Zustand zwischen parallelen Arbeitern. (d) ist ein Briefing-Fehler von L0, nicht eine Auslegung einer Nutzeranweisung; E-003 greift hier nicht, weil die Gegenprobe Spec-Treue statt Nutzerzweck prüft.

### B6 · Software-Rendering verhindert Frame-Abnahmen

- Beobachtung: AK-U3-09 und AK-R4-06 liefern unter Software-Raster 27,4 fps bei Render-Median 4 ms; eine leere 1920er-Canvas schafft 60 fps.
- Beleg: R116, R120 (Punkt 1), N-91.
- Wirkung: Harte Abnahme verschoben auf Echtgerät; kein Fehler im Spiel nachgewiesen.
- Deutung: Umgebungsgrenze. Die Spec-AK sollten den Messort nennen.

### B7 · Positiv: Review/QA-Zyklus und Flacker-Muster

- Beobachtung: Review und QA fanden echte Fehler (Picking R113, Laternen R114, Boom-Marke und Fokus R112); das Flackern der Zeittests in `tests/render/terrain.test.ts` wurde als Muster (3× in der Session) erkannt und behoben.
- Beleg: R112–R114, `docs/beobachtungen.md` (Eintrag „Muster (3× in dieser Session)").
- Wirkung: Fehler wurden vor dem Merge gefangen. Die Metrik erfasst das nicht (Ergebnisse 0, Erstabnahme-Quote „nicht erfasst").
- Deutung: Wirkt, ist aber nicht messbar belegt; die Lücke in der Erfassung der Qualität (`result`-Events fehlen) bleibt.

## Befragung der Leads

- Nicht befragt; die Leads waren in dieser Session kaum aktiv (3 Agenten), Rulings und Metrik ersetzen die Antworten.

## Vorschläge

Keine neuen Experimente (E-004 wartet auf einen Platz; E-001 bis E-003 laufen). Vorschläge für das Handbuch (nur Vorschlag, Ruling von L0 nötig, Einordnung als künftiges Experiment E-005, wenn L0 zustimmt):

1. Session-Start: vor jedem Ruling `git fetch` und die nächste freie Nummer prüfen; Eintrag in „Parallele Sessions" vor dem ersten Ruling. Messgrösse: Nummernkollisionen in der nächsten Episode paralleler Sessions: 0 (Ausgangswert 2: R107, R118). Rückfall: Handbuch 1.8.
2. Betriebsart „Cloud ohne Agent-Werkzeug" (R108) und Push-Pflicht (R107) in den Abschnitt „Session-Start und -Ende" aufnehmen.
3. Briefing-Vorlage: Zeile „Rot-Nachweis ohne `git stash`" und „QA-Baum gehört nur dem QA-Check".

## Bewertung laufender Experimente

- E-001: Die Metrik dieser Session enthält 0 verglichene Agenten (Schätzung gegen Ist nicht gemessen); keine neue Datenlage → weiter beobachten, Bewertung Retro M7.
- E-002: Zweite Episode paralleler L0-Sessions (Cloud-Session ddd9a9ac und 5e248230). Rulings mit Anlass „Basis-Drift" oder „Nachführen gegen main": 0 (R118–R120 sind Nummernkollision und Übergabe). Schwelle formal erreicht, aber die Regel deckte den eigentlichen Schaden nicht (B4) und die Tabelle wurde spät gepflegt → weiter beobachten bis zur Retro M7, Messregel um Ruling-Nummern ergänzen (Vorschlag 1).
- E-003: Session 2 von 3. Anwendung: R118 mit Satz „Zweck der Anweisung", R107 (3) ohne; Rulings mit Korrektur wegen Fehlauslegung: 0 (R115 korrigiert ein L0-Briefing, R119 überholt R118 wegen neuer Lage, nicht wegen Fehlauslegung) → weiter beobachten.

## Änderungen an lernen.md

- neu: Ruling-Nummern und `git fetch` (B4); Cloud ohne Agent-Werkzeug (B2); kein bare `git stash`/QA-Bäume exklusiv (B5); Software-Rendering misst keine Frames (B6) · gestrichen: keine (25 von 40 Inhaltszeilen)
