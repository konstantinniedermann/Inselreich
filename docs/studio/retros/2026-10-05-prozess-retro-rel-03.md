# Prozess-Retro REL-03 und M12-Vorlauf — 2026-10-05

- Datum: 2026-10-05
- Art: meilenstein
- Auslöser: Release REL-03 (Merge 1a24d25, R232), Prozess-Retro nach R127; Paket PROZESS-RETRO-REL-03
- Datenbasis: `docs/studio/metriken/S-2026-10-05-ad51d3c5.md`, `python3 tools/studio/metrics.py --efficiency`, `docs/studio/rulings.md` (R225–R232), `docs/studio/gates.md`, `.studio/events.jsonl` (2026-10-05, Zeiten dort in UTC, Commit-Zeiten lokal = UTC+2), `git log` 2026-10-05

Rahmen: Eine Session, 468 min, 517 Agenten-Einträge (davon 482 `studio-director`-Hook-Einträge, 37 echte Delegationen), 1424 Tool-Aufrufe. Beobachtung, Deutung und Vorschlag sind je Befund getrennt. Grenze der Daten: Kosten je Gate sind nicht einzeln gemessen, nur je Lead-Rolle; Wartezeit ist aus Statusereignissen und Commit-Zeiten abgeleitet, nicht gemessen.

## Befunde

### B1 · Art-Strang (Frage a): der Zuschnitt war nicht die Ursache der Länge

- Beobachtung: `lead-art` 08:21Z bis 09:56Z (95 min), 6 Agenten, 253 min Summe über alle Instanzen, 446 Tool-Aufrufe (Metrik, Tabelle je Lead). Das ist Faktor ≈ 2,7 Parallelität innerhalb des Strangs. Die Häppchen hängen an den Dateien: H-R13 wird dreimal in `feat/h-r12b-duenen` gemerged (`fdd93e6`, `7179aef`, `ad0eef5`), H-R12b läuft bis 11:45 lokal (`0213f4b`), also nach dem Bericht "release-reif" 09:56Z weiter. S1-Rest ist dagegen früh fertig (`cf3809f` 10:33, `37822c1` 10:36 lokal). H-R12b ist laut R232 der dritte Dünen-Anlauf; für ihn gibt es zwei Spec-Stände (`a772ac2` 10:27, `79f3926` 11:06, `1f87a48` 11:43).
- Deutung: Der längste Pfad ist H-R13 → H-R12b (gleiche Terrain-Dateien, serielle Abhängigkeit) plus Bildrunden, nicht die Zahl der Häppchen je Lead-Instanz. Eine Aufteilung auf mehr Leads hätte die Abhängigkeit nicht aufgelöst, aber die Steuerungskosten erhöht (Steuerungsanteil rot). Wurzel (5-Why) der Länge von H-R12b: Dünen sahen nach dem Bild komisch aus → die Spec legte Malpfad und Perf-Budget fest, aber nicht die Bildabnahme (Referenz, Zahl der Runden) → jede Runde brauchte eine neue Spec-Ergänzung → ein dritter Anlauf ohne Abbruchkriterium. Muster oder Einzelfall ist mit dieser Datenlage nicht entscheidbar (R221 und R232 nennen den Strang, frühere Retros nicht ausgewertet).
- Wirkung: Der Engpass ist die Zeit bis H-R13 stabil war (Review-Fix `0b4d172`, 11:40 lokal); H-R12b wird erst 12:01 lokal gemerged (`aa2ee4b`).
- Antwort auf (a): Der Zuschnitt war vertretbar, weil die Abhängigkeit seriell war. Ein Hebel liegt davor (V3).

### B2 · Gates für M12 (Frage b): Nutzen belegt, Kosten klein, Einsparung nur bei zwei Gates

- Beobachtung: Fünf Gate-Runden plus das Gate Brainstorming (R226, L0 selbst): Spec E0 (R227: lead-tech 4, lead-qa 9 Punkte), Spec E1–E6 (R228: tech 6, art 6, qa 8; ein blockender Punkt A1 "unladbare Autosaves"), Plan E0 (R229: qa 5, prod 4), Delta-Gate (R230: nicht blockend, 1 Start), Plan E1 (R231: prod 4, qa 7). Prüfer-Starts gesamt ≈ 10 (events: lead-tech 2, lead-art 1, lead-qa 5, lead-production 2 für Gates). Kostenanteil: `lead-qa` 5 Instanzen = 7,9 % Cache-Write, 5,0 % Cache-Read der Session, `lead-production` 0,5 %; je Gate-Lauf 2–3 min (Events 08:48–08:51Z, 09:03–09:06Z, 09:08–09:11Z, 09:15–09:17Z, 09:35–09:37Z). Zwei Gates verhinderten reale Fehler: A1 (Ladeprüfung, R228 (1)) und D-139 (Fahrstrecke `d`, gefunden erst beim E1-Plan, nicht im Gate Spec).
- Deutung: Ein kombiniertes Gate (Stufe leicht) war für M12 nicht erlaubt (Save-Format, Architektur → voll, STUDIO.md Abschnitt Prozessstufen) und hätte A1 voraussichtlich später, nach Umsetzung, sichtbar gemacht. Die Kosten der Gates sind klein gegen die Session (≈ 10 %, grobe Schätzung aus Lead-Anteilen); Einsparpotenzial liegt woanders: (1) R227 enthält sieben mechanische Spec-Auflagen (Zählung, Verweise, Seed, Hash-Form), die ein Selbstcheck des Spec-Autors gefunden hätte; (2) das Plan-Gate E1 wiederholt Punkte aus R229 (prod-B2 "Merge-Fluss" ≈ R229 prod-B1/Reihenfolge); der Folgeplan E1 baut auf E0 auf, ein Prüfer (lead-qa) plus L0-Selbstprüfung der Ownership hätte genügt. D-139 zeigt umgekehrt: das Gate Spec prüft Testbarkeit, nicht Zahlenbeispiele mit echten Weltmassen (Heimatanker 13–31 Kacheln tief im Rechteck).
- Wirkung: geschätzt 1–2 Prüfer-Starts (≈ 1–2 % der Session) und 7 Nachbesserungsschritte weniger; keine Qualitätseinbusse belegt.

### B3 · Wartezeiten auf L0-Gates (Frage c): praktisch keine, Warten steckt woanders

- Beobachtung: Zwischen Prüferbericht und Ruling-Commit liegen ≤ 1 min (Prüferberichte 08:36Z, 08:51Z, 09:06Z, 09:11Z, 09:17Z, 09:37Z, 10:10Z gegen `10:36`, `10:51`, `11:07`, `11:12`, `11:17`, `11:37`, `12:10` lokal in den Commits `1827ab1`, `020850e`, `872af96`, `88931da`, `5d286bb`, `d0db854`, `04725ca`). Die Pipeline überlappt: Spec E1–E6 wurde geschrieben, während Gate E0 und Plan E0 liefen (09:02Z Spec komplett).
- Echte Wartestrecken: (1) `lead-tech` C1 liegt 09:15–09:43Z in 6 Turn-Enden "ich warte auf Implementierer/Review" (09:15, 09:21, 09:25, 09:32, 09:33, 09:40Z), Parallelität 1 laut R227; (2) `lead-design` wartet 08:28–08:33Z auf den Wirtschafts-Anhang; (3) H-U1 ist seit 08:48Z fertig und liegt bis zum Release-Review 10:03Z (≈ 75 min) auf der Branch, der Review startet erst nach dem letzten Häppchen; (4) M12-E1-Render und E0 warten auf REL-03 auf main (R229–R231).
- Deutung: Das Gate-Latenzproblem existiert nicht; Wartezeit ist Strang-Serialisierung (Ownership, Merge-Reihenfolge), die bewusst gewählt wurde (R229 holt H-U1 per Merge in E0, damit T01 nicht wartet: gute Entscheidung, T01 begann 09:22Z). Kostenrelevant ist das Warten der Leads als Turn-Ende: jedes Aufwachen liest den Lead-Kontext (Median 85k, `lead-tech` Max 254k) neu, nach > 5 min Pause wird der 5-min-Cache neu geschrieben.

### B4 · Statusbuchführung: Wartezustand wird als "done" geloggt

- Beobachtung: Mindestens 8 `done`-Einträge sind Warte-Texte ("ich warte auf seine Rückmeldung", `lead-tech` 09:15, 09:21, 09:25, 09:33, 09:40Z; `lead-design` 08:28, 08:37, 08:49Z; Quelle `.studio/events.jsonl`). Die Metrik zählt 12 Ergebnisse, davon 4 ungeprüft, und 2 "Agenten mit Lücke".
- Deutung: Wurzel: Ein Turn-Ende wird vom Hook als `done` verbucht, die Rolle meldet nicht `waiting` (Persona-Regel "Warten/Hindernis" nicht angewandt oder Turn-Ende ohne Statusaufruf). Folge: Wartezeit ist in Dashboard und Metrik nicht von Arbeit trennbar; meine Frage (c) lässt sich nur indirekt beantworten.

## Effizienz-Ampel

Quelle: `python3 tools/studio/metrics.py --efficiency`, Abschnitt der Sessiondatei (1 Session) und Gesamtlauf (21 Sessions).

| Kennzahl                          | Session | Gesamt | Ampel (Session / Gesamt) | Befund / Ursache                                                                    |
| --------------------------------- | ------- | ------ | ------------------------ | ----------------------------------------------------------------------------------- |
| Steuerungsanteil (L0 + Leads)     | 64,8 %  | 56,2 % | rot / rot                | B3: Leads als wartende Relais (L0 nur 7,0 %, Leads 57,9 %); V1                      |
| Umsetzeranteil                    | 18,5 %  | 14,1 % | grün / gelb              | Session besser als Verlauf; kein Befund                                             |
| Cache-Write 5 min                 | 28,8 %  | 25,3 % | rot / rot                | B3: Aufwachen nach > 5 min Pause (Wartepausen der Leads); V1                        |
| Lead-Kontext Median               | 61k     | 80k    | grün / grün              | –                                                                                   |
| L0-Kontext Max                    | 242k    | 774k   | grün / rot               | Gesamt-Rot stammt aus früheren Sessions, hier nicht belegt                          |
| opus-Anteil                       | 77,4 %  | 76,9 % | gelb / gelb              | Gates und Leads auf opus; V2 senkt minimal, kein eigener Vorschlag                  |
| Persona-Starts general-purpose/opus | 0     | 44     | grün / rot               | Session sauber, Gesamt-Rot Historie früherer Sessions; keine Aktion        |
| Grösste gelesene Datei            | 46,8 KB | 59 KB  | gelb / gelb              | `anh.diff` und Spec 37 KB (M12): Grenze der Spec-Grösse; V3 (Selbstcheck) mindert   |

## Vorschläge

Höchstens 5, nach Hebel sortiert. Jeder: L0 entscheidet (annehmen / ablehnen).

### V1 · Warte-Turn-Enden der Leads senken und als `waiting` loggen (L0 entscheidet)

- Wirkung: weniger Aufwachen mit Neuschreibung des Lead-Kontexts; erwartet Cache-Write 5 min unter 25 % und Steuerungsanteil Richtung 55 %; zugleich wird Wartezeit messbar (B4).
- Massnahme: (a) Leads bündeln unabhängige, kleine Tasks desselben Packages in einen Implementierer-Start (C1 brauchte für T00–T02 3 Implementierer-Läufe, 2 Reviews, 6 Warte-Turns in 28 min); (b) wartender Zustand immer mit `log.py status --status waiting`.
- Messgrösse: Turn-Enden mit Wartetext je Lead-Instanz ≤ 3 je 30 min (jetzt 6 bei `lead-tech` C1); Cache-Write 5 min ≤ 25 %; Anteil `done`-Einträge mit Wartetext 0.
- Rückfall: Einzel-Starts je Task wie bisher. Aufwand: klein (Persona-/Briefing-Satz, 1 Zählregel für `studio-coach`).

### V2 · Folgeplan-Gate mit einem Prüfer (L0 entscheidet)

- Wirkung: 1 Start je Folgeplan (≈ 0,5 % Session), weniger doppelte Punkte (prod-B2 in R231 ≈ R229).
- Massnahme: Plan-Gate eines Teils, der auf einem bereits gegateten Plan aufbaut (E1 nach E0, E2–E4 nach E1), mit `lead-qa` plus L0-Selbstprüfung der Ownership; `lead-production` nur bei neuer Branch- oder Merge-Struktur. Bei Abweichung Rückfall auf zwei Prüfer.
- Messgrösse: Anteil der Punkte aus dem zweiten Prüfer, die in einem früheren Ruling schon standen, ≤ 30 % (jetzt ≈ 1 von 4); blockende Punkte nach Umsetzung, die das Gate hätte finden sollen: 0.
- Rückfall: zwei Prüfer. Aufwand: klein (gates.md Satz, Ruling).

### V3 · Spec-Selbstcheck mit Zahlenbeispiel vor dem Gate Spec (L0 entscheidet)

- Wirkung: weniger Nachbesserungsschritte (R227 7 mechanische Auflagen, R228 drei Fix-Commits `872af96`-Runde, R230-Auflage, D-139) und früheres Finden von Massfehlern wie D-139.
- Massnahme: `design-spec-author` liefert mit der Spec drei Zeilen: Zählungen gegen `src/` geprüft, Verweise auf AK/Pins vollständig, ein Rechenbeispiel mit realen Weltmassen je Mechanik mit Zahlen. Bei H-R12b zusätzlich: Bildabnahme (Referenzbild, höchstens 2 Bildrunden; danach Stopp-Bericht statt dritter Anlauf).
- Messgrösse: mechanische BEDENKEN-Punkte je Gate Spec ≤ 3 (jetzt 7 in R227); Bildrunden je Häppchen ≤ 2 (jetzt H-R12b 3 Anläufe); Zahl der Spec-Fix-Commits nach dem Gate ≤ 1.
- Rückfall: keine Checkliste, Gates wie bisher. Aufwand: klein (Vorlage `templates/spec`, falls vorhanden).

### V4 · Fertige Häppchen früh prüfen, Release-Review nur auf Delta (L0 entscheidet)

- Wirkung: Wartezeit der fertigen Branches (H-U1 ≈ 75 min) sinkt; Review-Schlusspunkt kürzer (jetzt 7 min, Start erst nach letztem Häppchen). Token-Wirkung neutral; Zweck ist Durchlaufzeit.
- Massnahme: opus-Review je Häppchen bei release-reif, am Release nur Integrations-Delta und `make check`/CI.
- Messgrösse: Zeit von release-reif bis Review-Start ≤ 15 min; Dauer Release-Review ≤ 5 min.
- Rückfall: ein Review am Schluss über alle Häppchen. Aufwand: mittel, nur wenn Review-Starts nicht steigen (sonst ablehnen: Netto-Kosten).

### V5 · Nichts ändern am Gate Brainstorming oder an der Zahl der Gates für Stufe voll (L0 entscheidet: Feststellung)

- Begründung: B2 zeigt Nutzen (A1, D-139-Schleife) bei ≈ 10 % Kostenanteil; ein kombiniertes Gate für M12 widerspräche den Prozessstufen und würde den Befund A1 erst in der Umsetzung finden. Rückfallzustand ist der Ist-Zustand; keine Aufwände.

## Beantwortung der Fragen

- (a) Zuschnitt: vertretbar. Länge kommt aus serieller Dateiabhängigkeit und Bildrunden; Hebel V3, nicht mehr Leads.
- (b) Fünf Gates: gerechtfertigt für Stufe voll, ein kombiniertes Gate hätte nicht gereicht (Save-Format). Einsparung klein und gezielt (V2, V3).
- (c) Wartezeit auf L0-Gates ≤ 1 min; Wartezeit entsteht in Strangserialisierung und beim Warten der Leads (V1, V4).

## Bewertung laufender Experimente

- E-027/E-028 (R224/R225, Handbuch 1.18): in dieser Session erst eingeführt; Datenbasis für ein Urteil fehlt → weiter beobachten.

## Änderungen an lernen.md

- keine (Zuständigkeit `studio-coach`).
