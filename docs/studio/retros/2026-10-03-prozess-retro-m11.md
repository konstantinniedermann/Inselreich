# Prozess-Retro M11 — 2026-10-03

- Datum: 2026-10-03
- Art: meilenstein
- Auslöser: Release M11 (Merge aa5b3b9, R200), Prozess-Retro nach R127; Paket PRETRO-M11
- Datenbasis: `docs/studio/metriken/M11.md`, `.superpowers/sdd/m11/ledger.md`, `docs/studio/rulings.md` (R185–R200), `docs/studio/experimente.md` (E-010, E-019, E-020), `git log` 2026-10-03 14:26–16:35, `python3 tools/studio/metrics.py --efficiency`

Rahmen: M11 lief in einer Session von Design bis Merge (Metrik: 54 Agenten, 307,8 min, 1514 Tool-Aufrufe, Erstabnahme 100 %, Nacharbeit 0). Beobachtung, Deutung und Vorschlag sind je Befund getrennt. Grenze der Datenbasis: Übergabekosten je Controller-Instanz sind nicht einzeln gemessen (nur Lead-Summen), Aussagen dazu sind Deutung.

## Befunde

### B1 · Controller-Wechsel mit Deckel 6: funktioniert, Kosten der Übergabe nicht messbar

- Beobachtung: 7 Controller-Instanzen C1–C7 (Ledger). Starts: C1 6 (Übergabe nach T02), C2 2 + 3 Fortsetzungen, C3 6, C4 4, C5 4, C6 6 + 3 Fortsetzungen. Der Deckel wurde dreimal exakt erreicht (C1, C3, C6), zweimal per „Fortsetzung" umgangen (C2, C6), ohne dass das Ledger die Regel dafür nennt. Ergebnis: Steuerungsanteil 29,8 %, Lead-Kontext-Median 61k (beide grün), Erstabnahme 100 % (`docs/studio/metriken/M11.md`). Die E-010-Gegenprobe (höchstens 1 Rückfrage je 10 Tasks wegen fehlendem Planteil) hält mit 1 echter Rückfrage bei 16 Ergebnissen (C3: „Spec-Widerspruch" GOODS.food.sell, R194; Ursache: Task-Datei T04b trug alten Wortlaut). Weitere Übergabe-Reibungen ohne Rückfrage: Auftrag nannte „Ziffer" für Rinderfarm, Plan sagt Taste entfällt (C6); orga-12 führte zwei geänderte Tests nicht auf; D1-Prüfliste-Muster „function $f" passt nicht auf `export const` (C7).
- Deutung: Der Wechsel spart Kontext (Median 61k statt bis 169k Ausgangswert) und die Ledger-Übergabe verliert kaum Information; verloren geht, was nicht im Ledger steht, sondern in Task-Dateien, die nach einem Ruling nicht nachgezogen werden (3 von 4 Reibungen). Der Fortsetzungs-Weg ist eine stille Deckel-Ausnahme: Zählung „Starts" und „Fortsetzungen" ist uneinheitlich, die Messgrösse „Starts je Instanz" ist damit nicht vergleichbar.
- Wirkung: kein messbarer Nacharbeitsaufwand (Nacharbeit 0), aber 1 Rückfrage + 3 Hinweis-Korrekturen.
- Bewertung E-010: Messgrössen Steuerungsanteil, Lead-Kontext-Median, Gegenprobe erfüllt → behalten. Keine neue Regel; V3 deckt die Task-Datei-Lücke.

### B2 · Welle W4: echte Parallelität, aber unausgewogen

- Beobachtung: R193 (9c75b76, 14:49) gibt W4 frei: C2/T10, C3/T04–T06 (6 Starts), C4/T07–T08 (4 Starts) in drei Worktrees. Fertig: T10 d268c12 14:52, C4 ed4fa1b 14:57, C3 3d12868 15:04; Abnahme R194 15:06, Integration T09 7164dc4 15:10. Die Merges in T09 waren konfliktfrei (Ledger: „Merge 0252860 konfliktfrei"); Pins bitgleich. Die kritische Strecke war C3 (15 min), C2 war nach 3 min, C4 nach 8 min fertig und stand bis zur Abnahme still (≈ 14 bzw. 9 min).
- Deutung: Die Ownership-Matrix (orga-07/-09/-13) hat Konflikte verhindert, die Dateimatrix-Idee aus E-019 hat sich damit praktisch bestätigt, ist aber formal nie gestartet (E-019 „vorgeschlagen, wartet auf Platz", Start „–"), die Differenz geplant minus gemessen wurde nicht erhoben. Die Wellendauer wird vom längsten Strang bestimmt; Aufteilung 6 : 4 : 1 Tasks war die Ursache der Leerlaufzeit (Zuschnitt folgte den Modulen, nicht der Dauer).
- Wirkung: Wartezeit der Welle durch den langsamsten Strang ≈ 15 min bei 3 Strängen; mit ausgeglichenem Zuschnitt (T05/T06 auf zwei Stränge) wären grob 8–10 min denkbar (Schätzung, nicht belegt).

### B3 · M9-Render-Häppchen parallel zu M11: Abhängigkeit erst im Gate Plan entdeckt

- Beobachtung: H-R6 (R191) und H-R7 (R195, Merge 15:26 nach drei Fix-Runden, Commits 14:26–14:54) liefen neben M11. R2 hängt von H-R7 ab; die Abhängigkeit stand nicht im Plan, Gate Plan M11 endete BEDENKEN (R192): „R2 blocked-by H-R7", Cache-Schlüssel mit Variante/Material/Level, Budget 52; die Plan-Instanz lief für die Fix-Runde über den E-010-Deckel (225k). R2 startete real erst nach dem H-R7-Merge (5be96fe 15:48).
- Deutung: Wurzel (5-Why): Plan-Nachzug → Abhängigkeit zu einem anderen laufenden Strang nicht sichtbar → Gate Spec/Plan prüfen Dateien und Tests des eigenen Meilensteins, nicht die Schnittstellen zu parallelen Strängen → keine Vorlagezeile „blocked-by anderer Strang" → Parallelbetrieb war eine L0-Entscheidung (R184), nicht eine Planvorgabe. Die Serialisierung selbst kostete nichts: R2 lag nicht auf der kritischen Strecke. Das Gate Plan fing den Fehler vor der Umsetzung ab; Kosten: 1 Fix-Runde plus Kontext über Deckel (E-020 misst Nachführaufwand, ebenfalls nicht gestartet).
- Wirkung: 1 Fix-Runde, 0 verworfene Arbeit.

### B4 · Vorfall f8f234e: L0-Doku-Commit im Hauptcheckout, während der Integrator dort mergt

- Beobachtung: `f8f234e` („docs: Ruling R196") ist ein Merge-Commit (Eltern 6a9f8d4, 7d56d6a) mit 13 Dateien, darunter `src/render/material.ts`, `variants.ts`, `tests/render/variants.test.ts` (1353 Einfügungen). Der Integrator mergte H-R7 (R195) im Hauptcheckout; L0 committete R196 dazwischen. Der Titel `docs:` beschreibt den Inhalt nicht, die Spiel-Änderung kam so ohne eigenen Merge-Eintrag auf main. R198 hält die Folgeregel fest: „kein eigener Commit im Hauptcheckout, solange ein Integrator dort arbeitet". Schon `rulings.md` Z. 410–417 (frühere Dauerregel) verbot dies für Leads; L0 war nicht adressiert. Zweiter Ablauffehler derselben Art in M11: R193, Push trotz rotem prettier-Check (7d588a2).
- Deutung: Wurzel: Integrator und L0 teilen einen Arbeitsbaum → jede Regel „nicht gleichzeitig" hängt an Disziplin → Regel galt nur für Leads → mit R198 jetzt ergänzt, aber die dritte Regel gegen dieselbe Fehlerklasse (Muster, kein Einzelfall). Streichen vor neue Regel: Wenn der Integrator in einem eigenen Worktree mergt, gibt es den gemeinsamen Baum nicht mehr.
- Wirkung: eine verschleierte Merge-Historie, kein Datenverlust; Aufräumkosten gering.

### B5 · `docs/beobachtungen.md`: 3 Konflikte durch gleichzeitiges Anhängen

- Beobachtung: Konflikte in `7d56d6a` (main → feat/h-r7-varianz), `005c342` (render → feat/m11-ui), dazu der Marker-Fix `b863aa5` („Konfliktmarker entfernt"), das heisst, Marker wurden einmal committet. Zusätzlich `7d588a2` (prettier-Nacharbeit nach 35f023c) und „arc42 nach Merge mit Prettier formatiert" (9ed0598; Ledger: 68 Zeilen Rauschen in T11 und T12).
- Deutung: Wurzel: Alle Stränge hängen am selben Dateiende an (append-only, Zeilen 700+), jeder Parallelzweig trägt dort Befunde ein → derselbe Hunk ändert sich in zwei Zweigen → Konflikt, auch bei beidseitig erhaltenem Inhalt. Die Marker-Panne zeigt, dass die manuelle Auflösung selbst fehleranfällig ist.
- Wirkung: 3 Merge-Unterbrechungen und 1 Korrektur-Commit, jeweils Minuten, aber in allen drei Fällen auf dem Pfad der Integration.

### B6 · Flaky Test: dreimal gesehen, nie benannt

- Beobachtung: R197 „zweimal gesehen, Name unbekannt"; Ledger C7: `make check` 3×, vitest 6×, studio-test 8× grün, Test nicht reproduziert; Kandidaten nur vermutet (studio-test Zeitstempel, beobachtungen ~720); auch B1/Implementierer sah einen roten Lauf.
- Deutung: Die Diagnose scheiterte, weil die rote Ausgabe nach dem Lauf weg ist, nicht am Rätselcharakter des Tests. 17 Wiederholungsläufe sind der Preis dafür.
- Wirkung: ≈ 17 Läufe ohne Ergebnis, Risiko bleibt offen.

## Effizienz-Ampel

Quelle: `docs/studio/metriken/M11.md` (M11, 2 Sessions) und `metrics.py --efficiency` (alle 17 Sessions). Die beiden Auswertungen weichen stark ab, weil die Gesamtmessung ältere, teurere Sessions enthält.

| Kennzahl                                | M11    | alle Sessions | Ampel (M11 / gesamt) | Befund / Ursache                                            |
| --------------------------------------- | ------ | ------------- | -------------------- | ----------------------------------------------------------- |
| Steuerungsanteil                        | 29,8 % | 58,9 %        | grün / rot           | B1: Deckel-6-Wechsel; Gesamtwert durch Alt-Sessions         |
| Umsetzeranteil                          | 20,7 % | 7,6 %         | grün / rot           | wie oben                                                    |
| Cache-Write 5 min                       | 26,5 % | 24,8 %        | rot / gelb           | B7                                                          |
| Lead-Kontext Median                     | 61k    | 83k           | grün / gelb          | B1                                                          |
| L0-Kontext Max                          | –      | 774k          | – / rot              | nicht M11-spezifisch, Ausgangswert E-010 unverändert (774k) |
| opus-Anteil                             | –      | 77,6 %        | – / gelb             | M11: 7 von 54 Agenten opus                                  |
| Persona-Starts general-purpose auf opus | –      | 44            | – / rot              | Gesamtwert, kein M11-Beleg                                  |
| Grösste gelesene Datei                  | –      | 59,0 KB       | – / gelb             | Specs über 40 KB (m10-Spec 59 KB)                           |

### B7 · Cache-Write rot in M11 (26,5 %)

- Beobachtung: Cache-Write 5,14 Mio. gegen Cache-Read 140,3 Mio. (`metriken/M11.md`); 54 Agenten, davon 36 lead-tech. Die Schwelle (rot > 25 %) bezieht sich auf 5-min-Neuschreibungen.
- Deutung (Hypothese, nicht belegt): Je frischer Controller- und Arbeiter-Start entsteht ein neuer Cache-Aufbau; Pausen von mehr als 5 min (Wartezeiten auf Abnahme, B2) lassen den Cache verfallen. Der Zusammenhang mit B1/B2 ist plausibel, aber nicht je Instanz gemessen.
- Vorschlag: keiner eigener. Begründung: Eine Gegenmassnahme (weniger Instanzen) widerspricht E-010; die Messung je Instanz fehlt (V5 ergänzt sie nicht). Der Wert wird in M12 erneut gemessen; ist er dort wieder rot, ist ein Experiment „Pausen unter 5 min" fällig.

## Befragung der Leads

- Nicht befragt (ein Start, Datenlage ausreichend); Quellen: Ledger, Rulings R185–R200, Git-Historie.

## Vorschläge

Sortiert nach Hebel.

### V1 · Integrator im eigenen Worktree (Regel R198 ersetzen) — zu B4

- Hypothese: Wenn `production-integrator` Merges in einem eigenen Worktree (`.worktrees/integration`) durchführt und nur das Ergebnis per `git pull --ff-only` im Hauptcheckout ankommt, entfällt die Fehlerklasse „Commit im geteilten Baum", und die Regel aus R198 und Z. 416 wird überflüssig.
- Messgrösse: 0 Merge-Commits auf main mit Fremddateien unter `docs:`-Titel in den nächsten 2 Meilensteinen (Ausgang M11: 1, f8f234e).
- Rückfall: Integrator im Hauptcheckout mit Regel R198.
- Aufwand: klein (Briefing production-integrator, ein Satz; Handbuch-Änderung über L0/studio-coach).
- Empfehlung: annehmen.

### V2 · `.gitattributes` mit `merge=union` für `docs/beobachtungen.md` — zu B5

- Hypothese: Wenn Git die append-only-Datei per Union-Merge zusammenführt, entstehen keine Konfliktmarker, die Integrationen laufen ohne Unterbrechung.
- Messgrösse: 0 Konflikte in `beobachtungen.md` in M12 (Ausgang M11: 3 + 1 Marker-Fix). Gegenprobe: keine doppelten Einträge (stichprobenartig `git diff` nach jedem Merge).
- Rückfall: Zeile in `.gitattributes` löschen.
- Aufwand: sehr klein (eine Zeile, ein Test-Merge).
- Empfehlung: annehmen.

### V3 · E-019 starten, ergänzt um Strang-Abhängigkeit und Task-Datei-Nachzug — zu B1, B2, B3

- Hypothese: Wenn das Gate Spec/Plan eine Zeile „blocked-by anderer laufender Strang" prüft (H-R7 → R2 wäre aufgefallen) und jedes Ruling, das eine Spec-Aussage klärt, die betroffene Task-Datei im selben Zug nachzieht (T04b-Fall), sinken Plan-Nachträge und Rückfragen.
- Messgrösse: 0 Gate-Plan-Urteile BEDENKEN wegen Strang-Abhängigkeit und Differenz geplante minus gemessene Parallelität = 0 in den nächsten 2 Wellen (Ausgang: 1 BEDENKEN-Runde R192; W4 geplant 3, gemessen 3, aber nicht erhoben).
- Rückfall: Gate-Plan-Briefing ohne Prüfzeile (wie in E-019).
- Aufwand: klein; E-019 ist formuliert, braucht einen Platz (Limit laufender Experimente: E-010, E-015 u. a.; Platz durch Bewertung/Abschluss freimachen).
- Empfehlung: annehmen, E-019 um die zwei Aussagen erweitern und vor E-020 starten.

### V4 · Wellen-Zuschnitt nach Dauer — zu B2

- Hypothese: Wenn L0 parallele Stränge einer Welle so zuschneidet, dass die geschätzte Dauer (nicht die Modulgrenze) ausgeglichen ist (Spanne ≤ 1 Task), sinkt die Wellendauer.
- Messgrösse: Zeitspanne zwischen erstem und letztem Strangende einer Welle ≤ 5 min (Ausgang W4: ≈ 12 min, 14:52 bis 15:04), Wellendauer gegenüber Plan nicht länger.
- Rückfall: Zuschnitt nach Modulen wie bisher.
- Aufwand: klein, aber nur sinnvoll, wenn die Dateimatrix es zulässt (Konfliktfreiheit hat Vorrang; deshalb Empfehlung teilweise).
- Empfehlung: annehmen als Hinweis in die Wellenplanung, nicht als Regel; in V3 mitmessen statt eigenes Experiment.

### V5 · Rote Testausgabe sichern — zu B6

- Hypothese: Wenn `make check` bzw. die Test-Wrapper die Ausgabe des letzten roten Laufs unter `.studio/` ablegen (überschrieben beim nächsten roten Lauf), ist ein flakiger Test beim ersten Auftreten benennbar.
- Messgrösse: Name des Tests ist bei jedem Vorkommen innerhalb eines Laufs bekannt; 0 Wiederholungsläufe nur zur Reproduktion (Ausgang M11: 17 Läufe ohne Ergebnis).
- Rückfall: Wrapper ohne Ablage.
- Aufwand: klein (Makefile oder Wrapper, `tools/studio/`; Umsetzung L0/Tech, nicht in dieser Retro).
- Empfehlung: annehmen.

## Bewertung laufender Experimente

- E-010: Steuerungsanteil 29,8 % (Schwelle ≤ 40 %), Lead-Kontext-Median 61k (≤ 80k), Rückfragen 1 bei 16 Ergebnissen (≤ 1 je 10 Tasks erfüllt knapp), grösste Datei im M11-Zeitraum nicht gesondert ausgewiesen (gesamt 59 KB über 40 KB) → behalten, Datei-Grösse separat prüfen (Gate Spec).
- E-019, E-020: nicht gestartet, keine Bewertung (siehe V3).

## Änderungen an lernen.md

- keine (Vorschläge an L0; Umsetzung durch `studio-coach` nach Ruling).
