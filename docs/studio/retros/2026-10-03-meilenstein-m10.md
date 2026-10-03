# Retro meilenstein m10 — 2026-10-03

- Datum: 2026-10-03
- Art: meilenstein
- Auslöser: Meilenstein M10 (Merge 268fa23, Gate Merge R188)
- Datenbasis: `docs/studio/metriken/M10.md` (4 Sessions, 51 Delegationen, Handbuch 1.13), `python3 tools/studio/metrics.py --efficiency` (ganze Historie: 17 Sessions), `docs/studio/rulings.md` R180–R189, `docs/studio/experimente.md`, `.studio/archiv/berichte/20261003-111949-lead-tech-a470ca48bad9510a6.md`, `.studio/archiv/berichte/20261003-085612-studio-coach-aa3d9ef0a93176d3f.md`, `.studio/archiv/briefings/`, `.studio/events.jsonl` (Budget-Events)

Grenze der Messung: `M10.md` zählt 4 Sessions, darunter die Vorbereitung in Session 58d6bc4a. Der Vergleich mit den Ausgangswerten von E-010 (ganze Historie) hat daher nicht dieselbe Basis; die Richtung ist belastbar, die Grösse der Verbesserung nur ungefähr. Lead-Berichte nennen keine Rückfragen-Zählung; die Gegenprobe stützt sich auf zwei Berichte und die Review-Runden (Mittel 1,25).

## Befunde

### B1 · Steuerung bleibt rot, Lead-Kontext ist grün

- Beobachtung: Steuerungsanteil 62,2 % (Ausgang 67,2 %, Schwelle ≤ 40 %); Lead-Kontext-Median 76k (Schwelle ≤ 80k, erreicht); Cache-Write 5 min 25,8 % (Ausgang 28,6 %, Schwelle ≤ 15 %). Leads tragen 48,4 % der Kosten, lead-tech 26 der 51 Delegationen mit 80 Mio. Cache-Read bei einem Instanz-Maximum von 549k.
- Beleg: `docs/studio/metriken/M10.md`, Abschnitte „Effizienz“ und „Aufwand“.
- Deutung (getrennt): Die Regeln „frische Instanz je Auftrag“ senken den Median, aber einzelne Lead-Instanzen (UI-Welle M10-UI mit 10 Starts, Fix-Runde D1) wachsen weiter auf Hunderte k. Der Rest ist Warten auf Arbeiter und Selbst-Arbeit (B3). Hypothese, nicht belegt.
- Wirkung: Bei Rot dominiert die Steuerung weiter; Umsetzer nur 12,5 % (gelb).

### B2 · Grosse Dateien: Spec 59 KB trotz 40-KB-Regel

- Beobachtung: Die M10-Spec ist 59,0 KB, das Design 56,4 KB; die Regel „Specs ≤ 40 KB“ stand im Handbuch 1.13, wurde aber erst für M11 als Auflage vergeben (R185 (3)). L0-Kontext Max 404k (Ausgang 774k, Schwelle 250k).
- Beleg: `docs/studio/metriken/M10.md`, „Grösste Lese-Ergebnisse“; `docs/studio/rulings.md` R185.
- Wirkung: Jede Lektüre der Spec kostet bei Reviewern und Leads Cache-Write; die Grösse wird von keinem Gate geprüft.

### B3 · Ownership-Grenze führt zu Selbst-Arbeit des Leads und zu ZURÜCK im Final-Review

- Beobachtung: D1 (README, arc42, Spec-Verweise) fehlte beim Final-Review; die Umsetzer-Instanz lehnte Doku ausserhalb ihrer Ownership ab, lead-tech schrieb D1 selbst. Zusätzlich `hud.ts:110` `role="img"` (Regression). Final-Review ZURÜCK, dann Nachprüfung BEDENKEN (Doku), dann 1 Docs-Commit.
- Beleg: `.studio/archiv/berichte/20261003-111949-lead-tech-a470ca48bad9510a6.md`, `docs/studio/rulings.md` R186, R188.
- Wirkung: eine zusätzliche Runde (Fix, Nachprüfung, Docs-Commit) und Lead-Kontext für Schreibarbeit; die Doku-Lücke war bekannt (D1 im Plan), nur die Zuständigkeit war nicht zugeordnet. Deutung: Briefing-Lücke, kein Disziplinfehler des Implementierers.

### B4 · Nachweise fehlen weiter bis zum Gate (Messzeuge für E-015)

- Beobachtung: Fixes T08/T09 ohne erneuten Reviewer-Lauf (R184, „R136 verletzt“, im Final-Review nachgeholt). Die Zählung für E-015 steht damit bei 3 von 5 Paketen seit Session 08e7b5f1 (R174, R178, R184); K3 wurde ohne vorheriges Streich-Ruling aus M10 genommen und erst durch R186 nachträglich gedeckt.
- Beleg: `docs/studio/rulings.md` R174, R178, R184, R186.
- Wirkung: L0 fordert im Gate nach; E-015 ist belegt und wartet nur auf einen Platz.

### B5 · Blindtest und Budget: Planungslücken bei Prüf-Instanzen

- Beobachtung: A1-Blindtest 4 von 3 Starts (Tafel plus blinder Rater, nachträglich freigegeben, R181). R1-Blindtest: Tester sah vorab `galerie.probes.json`, gilt mit Vorbehalt (R183).
- Beleg: `docs/studio/rulings.md` R181, R183.
- Wirkung: ein Nachweis mit Vorbehalt, ein Start über Budget. Das Budget war nicht auf den Rater-Start ausgelegt (Planungslücke, keine Phasen-Verwechslung).

### B6 · Weitere gelbe Zeilen der Ampel

- Beobachtung: Umsetzeranteil 12,5 % (gelb), L0-Kontext Max 404k (gelb), opus-Anteil 73,2 % (gelb), grösste Datei 59,0 KB (gelb). Persona-Starts als general-purpose auf opus: 0 (grün; Gesamthistorie 41, rot, aber vor 1.13).
- Beleg: `docs/studio/metriken/M10.md`; `python3 tools/studio/metrics.py --efficiency` (Gesamt).
- Deutung: Der opus-Anteil entsteht durch Leads auf opus (9 opus-Agenten tragen 79 Mio. von 132 Mio. Cache-Read); Umsetzer laufen auf sonnet (42 Agenten). Kein eigener Vorschlag, weil B1 dieselbe Ursache trägt.

## Effizienz-Ampel

Quelle: `docs/studio/metriken/M10.md` (Meilenstein). Gesamthistorie in Klammern.

| Kennzahl                      | Wert            | Ampel | Befund / Ursache                                |
| ----------------------------- | --------------- | ----- | ----------------------------------------------- |
| Steuerungsanteil (L0 + Leads) | 62,2 % (61,7 %) | rot   | B1; Experiment-Vorschlag E-016 und E-010 weiter |
| Umsetzeranteil                | 12,5 % (6,8 %)  | gelb  | B1/B6, folgt aus Steuerung                      |
| Cache-Write 5 min             | 25,8 % (24,8 %) | rot   | B1/B2; E-016, Spec-Grösse in E-010              |
| Lead-Kontext Median           | 76k (96k)       | grün  | –                                               |
| L0-Kontext Max                | 404k (774k)     | gelb  | B2; Übergabe-Regel greift teilweise             |
| opus-Anteil                   | 73,2 % (79,8 %) | gelb  | B6                                              |
| general-purpose auf opus      | 0 (41)          | grün  | –                                               |
| Grösste gelesene Datei        | 59,0 KB         | gelb  | B2                                              |

Rot-Zeilen: Steuerung und Cache-Write haben den Vorschlag E-016 (Lead-Übergabe-Deckel) und die Fortsetzung von E-010 mit Gate-Kriterium Spec-Grösse; ein weiterer Vorschlag wäre doppelt, weil die Hebel nicht getrennt messbar wären.

## Befragung der Leads

- Keine Befragung gestartet (Kurz-Auftrag, Kosten). Archiv-Berichte gelesen: lead-tech `.studio/archiv/berichte/20261003-111949-lead-tech-a470ca48bad9510a6.md`, Zwischenstand Coach `.studio/archiv/berichte/20261003-085612-studio-coach-aa3d9ef0a93176d3f.md` (Gegenprobe E-010 sauber, Review-Runde 1,00). Die Prozess-Retro (R127, Aussensicht) läuft getrennt.

## Vorschläge

Alle als `vorgeschlagen` in `docs/studio/experimente.md`; keiner startet vor dem Ruling, die Plätze regelt R180 (höchstens 3 laufend).

- E-016 · Lead-Übergabe-Deckel (gegen B1)
- E-017 · Ownership-Zuordnung für D1 im Umsetzer-Briefing (gegen B3)
- E-018 · Playtester: Probe-Dateien erst nach dem Urteil (gegen B5, R183)

## Bewertung laufender Experimente

- E-010: 1 von 5 Schwellen erreicht (Lead-Kontext Median 76k); Steuerung 62,2 % (Ausgang 67,2 %), Cache-Write 25,8 % (28,6 %), grösste Datei 59 KB (310 KB), L0-Max 404k (774k) verfehlt, alle in Richtung Schwelle. Gegenprobe sauber (keine Rückfragen wegen Planteil, Review-Runden 1,25), Abbruch nicht ausgelöst. → Vorschlag: angepasst (Wirkung erkennbar, Schwellen nicht erreicht), Zeitraum M11, Schwellen unverändert, ergänzt um Gate-Kriterium „Spec/Plan-Dateien ≤ 40 KB“ (lead-qa prüft die Dateigrösse im Gate Spec).
- E-011: 0 Rebase-Anweisungen in den Briefings und Plänen seit Handbuch 1.12 (nur Verbotssätze und Ruling-Zitate), 0 Rebase-Ausführungen (Reflog Hauptcheckout: letzter Rebase 2026-10-01 vor E-011; Reflogs der Worktrees ohne Treffer). Einschränkung: 68 von 86 Briefings seit Start tragen die Git-Zeile; die 18 ohne (Reviewer, Playtester, Coach, einzelne Leads) enthalten keine Rebase-Anweisung. M9 Welle 2 lief noch nicht; der Zeitraum „bis Ende M10“ ist erfüllt. → Vorschlag: behalten. Die Einschränkung (Zeile fehlt in 21 % der Briefings) geht als Hinweis an L0, kein Grund zur Anpassung.
- E-013: Alle 27 Freigaben seit 2026-10-02 tragen eine Phase, die einer Paket-ID entspricht (Events `budget`, `.studio/events.jsonl`). 4 Pakete haben zwei Freigaben mit derselben Phase (M10-S1A, M10-A1, M10-QA, M11-SPEC; Nachfreigaben). Eine Überschreitung (A1 4/3, R181) entstand durch einen nicht eingeplanten Rater-Start, nicht durch eine fremde Freigabe. Ein Abgleich Dashboard-Zeile gegen Lead-Bericht war nicht automatisiert möglich (nur Event-Sicht). → Vorschlag: behalten; der Mangel „Nachfreigaben statt Gesamtbudget“ ist als Hinweis vermerkt, nicht Teil der Hypothese.
- Folge: Werden E-011 und E-013 behalten, ist E-015 startklar (R180); mit E-010 laufen dann 2, ein Platz bleibt für E-016/E-017/E-018 nach Rangfolge von L0.

## Änderungen an lernen.md

- Vorschlag, nicht umgesetzt: neu „Blind-Test-Prüflinge werden erst nach dem Urteil geöffnet; ein Rater-Start gehört ins Paketbudget (R181, R183, Retro M10 B5)“; gestrichen: keine. Die Zeile folgt nach Ruling zu E-018.
