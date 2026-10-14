# Retro session b54ed3bd-ende — 2026-10-14

- Datum: 2026-10-14
- Art: session
- Auslöser: Session-Ende b54ed3bd (R616–R645)
- Datenbasis: `docs/studio/metriken/S-2026-10-14-b54ed3bd.md`, `python3 tools/studio/metrics.py --efficiency` (Historie) und `--since 2026-10-14T00:00:00`, `docs/studio/rulings.md` R615–R645, `docs/studio/experimente.md`, `.studio/archiv/briefings/` (Lead-Tech- und Integrator-Briefings ab 2026-10-12), `.studio/events.jsonl` (`load_abort`), Vorgänger `docs/studio/retros/2026-10-13-session-6584aaa4-ende.md`

## Befunde

### B1 · E-062 (Turnkappe 60) wurde nie angewendet

- Beobachtung: Kein Plan-Briefing an `lead-tech` seit dem Start von E-062 (2026-10-12) nennt die Kappe: 0 Treffer für „Turn“/„Kappe“ in allen `lead-tech`-Briefings ab 20261012 (u. a. `20261014-120859-lead-tech-4pGzJSSX.md`, `plan-handel-2`); der einzige Treffer ist `20261011-154444-lead-tech-TqyJF3C1.md`, vor dem Start. Auch `.claude/agents/lead-tech.md`, `docs/studio/STUDIO.md` und `templates/briefing.md` enthalten die Kappe nicht. Messwerte (`lead_stats.rows`, Kostengewicht): `plan-handel-2` 61 Turns, 1,54 M; `plan-ui-aufraeum-3` 23 + 7 Turns, 0,28 M; `plan-i-100` 7 Turns, 0,08 M; Vorsession `plan-I-047` 70 Turns, 1,48 M; Ausgang 2,46–4,26 M bei 90–105 Turns.
- Beleg: `grep -ci turn .studio/archiv/briefings/*lead-tech*` (ab 20261012: 0); `docs/studio/metriken/S-2026-10-14-b54ed3bd.md` (`efficiency.lead_stats.rows`); `docs/studio/experimente.md` E-062.
- Deutung (Vermutung): Die unabhängige Variable fehlte, die Messwerte sind keine Wirkung der Kappe. Die kleinen Pläne (7–30 Turns) liegen von sich aus darunter; einziger echter Test ist `plan-handel-2` (61 Turns, ≈ 3 % über 1,5 M, Gewicht statt reiner Cache-Write-Menge). Die Pläne sind kleiner als im Ausgang, aber ohne Kappe, vermutlich wegen kleinerem Planumfang.

### B2 · E-063: 3 von 18 Integrator-Briefings nennen den Hauptcheckout, alle mit Ruling

- Beobachtung: Seit dem Start (Handbuch 1.52) gibt es 18 Integrator-Briefings (ab 20261013-13). 15 nennen `.worktrees/integrate`; 3 nennen den Hauptcheckout als Arbeitsort: `20261014-110547-A1LPaCAc` (R627), `-121737-vB7jMWgF` (R636), `-124750-Not1j9cF` (R644), jeweils „laut R6xx dort freigegeben“, reine Doku-/Werkzeug-Merges ohne `push-check`. In den Rulings R616–R645 steht kein Vorfall durch einen Hauptcheckout-Merge. Eine Auswertung der `push_check`-Ereignisse nach „Arbeitsbaum verändert“ habe ich nicht erhoben.
- Beleg: `.studio/archiv/briefings/*production-integrator*` (Grep „Hauptcheckout“ / `.worktrees/integrate`); `docs/studio/rulings.md` R627, R636, R644.
- Deutung: Schwelle „0 Briefings mit Hauptcheckout“ formal verfehlt (10-Läufe-Zeitraum erfüllt, 18 Läufe), aber die drei Fälle sind bewusste Ausnahmen per Ruling. Die Messgrösse trennt Ausnahme und Ablauffehler nicht.

### B3 · Briefing-Verbote nur im Text werden gebrochen (drei Klassen, je 1–2 Fälle)

- Beobachtung: (a) Warte-Agenten und `sleep` trotz „keine Warte-Agenten, keine sleep-Befehle“ in der Budgetzeile (R618, `tool-hotfix-zr`/`tool-buendel-12`); (b) `lead-design` startete Arbeiter zweimal im Hintergrund (R635, ADR-007); (c) `make check` bei Last 10,8 trotz Grenze 8 (R630). Zu (c): `tools/testlock/testlock.ts` prüft die Last nur beim Start (`LOAD_MAX = 8`, Zeilen 26/88); `.studio/events.jsonl` zeigt am 2026-10-14 4 `load_abort` (Last bis 22,0), 79 `lock`-Abbrüche, 2 `kein_ruhiges_fenster`: das Werkzeug erzwingt die Grenze beim Start, der Fall R630 ist damit nicht erklärt (Last stieg vermutlich nach dem Start; unbelegt).
- Beleg: `docs/studio/rulings.md` R618, R630, R635; `tools/testlock/testlock.ts`; `.studio/events.jsonl` (`load_abort`).
- Deutung: Jede Klasse ist für sich ein Einzelfall oder ein Zweitfall, zusammen ein Muster: Verbote nur im Briefing wirken bei sonnet-Leads nicht verlässlich, Werkzeug-Sperren (E-064, Testlock) schon. Kein Vorschlag in dieser Retro; Messauftrag unten.

### B4 · Zeitreserve-Gate: zwei Releases in Folge mit Substanz bei Bestandstests

- Beobachtung: REL-21: erste Ursache war eine veraltete Markierungsliste (R623, `zeitreserve-marked.json`), danach Substanz bei drei Bestandstests (R624) und Paket TOOL-ZEITRESERVE-21. REL-22: ZURÜCK wegen `tests/tools/zeitreserve.test.ts` (≈ 2,08 s × 4 > 50 % von 5000 ms, R642); Ursache laut R644 sporadische `spawnSync`-Startstocker ≈ 2 s bei 74 ms Testzeit, behoben durch 20-s-Timeout. Ein Test des Prüfwerkzeugs verletzte die Regel, die er prüft. Der REL-22-Push verschiebt sich in die Folgesession.
- Beleg: `docs/studio/rulings.md` R623, R624, R642, R644.
- Wirkung: zwei Zusatzpakete (TOOL-ZEITRESERVE-21, REL22-FIX) und ein Delta-Check mehr.

### B5 · Gate- und Release-Muster: Delta-Check und Auflagen im Briefing wirken

- Beobachtung: REL-21 Delta-Check fand den Preisfehler Fremdinsel aus dem Zusammenspiel zweier Häppchen (R622), den Einzel-Reviews nicht sahen. Die Auflagen aus Gate I-100 (R619) gingen ins Umsetzungs-Briefing; Gate Merge danach OK mit beiden Auflagen erfüllt (R630). Zum Vergleich kostete die Nacharbeits-Folgeinstanz bei UI-AUFRAEUM-3 (R617) 0,06 M (`plan-ui-aufraeum-3`, 7 Turns).
- Deutung: Ein Fall je Variante; beide günstig in der Stufe leicht. Keine Aussage über die billigere Variante möglich, nur: keiner der beiden Wege erzeugte eine zweite Runde. Weiter beobachten.
- Nutzerauftrag Dashboard-Karte (R643–R645, drei Muster-Iterationen per SendMessage an dieselbe Instanz): Kosten nicht getrennt ausgewiesen, keine Auswertung (lernen.md hat die Regel zur Schätzbuchung).

## Effizienz-Ampel

Quelle: `docs/studio/metriken/S-2026-10-14-b54ed3bd.md` (Session) und `metrics.py --efficiency` (Historie, 55 Sessions).

| Kennzahl                           | Wert                                          | Ampel                          | Befund / Ursache                                                                                                                                                                                                                                                | Hebel oder Messauftrag mit Frist                                                                                                                                             |
| ---------------------------------- | --------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil (bereinigt)       | 43,2 % (Historie 44,0 %)                      | gelb                           | L0 25,0 %, Leads 44,1 % (roh 69,2 %). L0-Messauftrag aus 6584aaa4: 25,0 % bei 72 Delegationen in 315 min (0,35 Punkte je Delegation) gegen 22,2 % bei 97 in 590 min (0,23). Deutung: kürzere Session verteilt L0-Fixkosten (Start 62k) auf weniger Delegationen | **V1** (E-066, Folgeinstanz senkt Lead-Anteil); dritte Retro in Folge gelb, V1 ist der Pflicht-Hebel                                                                         |
| Umsetzeranteil                     | 4,2 % (Historie 21,2 %)                       | rot                            | Session ohne Umsetzungs-Grossauftrag: 8 `tech-ui-engineer`, 2 `tech-sim-engineer`, dafür Release-Check, Plan, Spec, Werkzeug                                                                                                                                    | Kein Befund: Produktivanteil 32,9 % grün (R488 V4)                                                                                                                           |
| Cache-Write 5 min                  | 26,9 % (Historie 28,2 %)                      | rot                            | Aufteilung (TOOL-BUENDEL-12): Neuschreibung nach Pause 7,3 % (lead-tech 2,6 %, lead-design 3,5 %), übriges Wachstum 19,6 % (lead-tech 5,9 %, qa-code-reviewer 3,1 %, qa-playtester 2,7 %). Nur 27,2 % der Menge sind Pausen-Neuschreibung                       | **V1** deckt höchstens 2,6 Punkte (rot → gelb erst bei vollem Erfolg); **V3** Messauftrag zum Wachstum, Frist nächste Session-Retro                                          |
| L0-Kontext Max                     | 341k (Historie 774k)                          | gelb                           | Eine L0-Instanz, Start 62k, Mittel 210k, Dauer 315 min; Historienwert 774k gehört zu früheren Sessions                                                                                                                                                          | Messauftrag studio-coach, nächste Session-Retro: Kontext-Max je 100 Delegationen; rot erst > 500k, kein Vorschlag                                                            |
| opus-Anteil                        | 53,5 % (Historie 69,3 %)                      | grün                           | Session grün; Historie gelb                                                                                                                                                                                                                                     | –                                                                                                                                                                            |
| Tests rot, später grün (Flake)     | 8 (Session-Datei); 0 mit `--since 2026-10-14` | rot (Datei) / grün (Seit-Wert) | Die Session-Datei zeigt dieselbe Historienliste wie 6584aaa4; mit `--since` ab Session-Beginn sind es 0. Der Messauftrag aus 6584aaa4 („Liste ab Merge-Datum neu“) ist damit erfüllt: keine neuen Flake-Verdachtsfälle seit R595                                | Beobachtung `docs/beobachtungen.md` (Session-Datei reicht `since` nicht an die Flake-Zeile weiter); Messauftrag studio-coach: Zeile in der nächsten Session-Retro gegenlesen |
| Lead-Kontext Median, grösste Datei | 52k / 23,6 KB                                 | grün                           | –                                                                                                                                                                                                                                                               | –                                                                                                                                                                            |

## Befragung der Leads

Keine Befragung: Budget keins, keine Agenten starten; Grundlage sind Metriken, Rulings und Briefing-Archiv.

## Vorschläge

Höchstens 3; Entwürfe, die Rulings schreibt L0.

- **V1 · E-066 starten: Folgeinstanz statt Fortsetzung bei `lead-tech`** (Experiment, Text in `docs/studio/experimente.md`). Voraussetzung ist ein freier Platz: Empfehlung, E-062 mit B1 als „nie angewendet“ zurückzunehmen (Rückfall ist der heutige Zustand, es gibt nichts zurückzubauen). Kosten: eine Persona-Zeile (`lead-tech.md`, Minor) plus Ruling; Nutzen höchstens 2,6 Punkte Cache-Write (Pausenanteil lead-tech dieser Session), daher eher Gelb-Nähe als Gelb. Messgrösse: Neuschreibungen ≥ 20k von lead-tech ≤ 5 je Session (Ausgang 8 in b54ed3bd, 9 in 6584aaa4) über 3 Sessions; Rückfall: Zeile streichen. Die Messbarkeit leidet nicht (Aufteilung seit TOOL-BUENDEL-12 in der Metrik).
- **V2 · E-063 anpassen, nicht abschliessen** (verlängern bis zum nächsten Merge-Block). Die Messgrösse trennt künftig „Briefing mit Hauptcheckout ohne Ruling-Nummer“ (Soll 0) von „Hauptcheckout per Ruling für Doku-/Werkzeug-Merges“ (zulässig, wird gezählt). Kosten: eine Zeile im Experimenttext, keine Datei ausser `experimente.md`; Rückfall: Messgrösse wie bisher. Bei Zustimmung entfällt für L0 jede Persona-Änderung.
- **V3 · Messauftrag, kein Experiment: Wachstum des Cache-Write 5 min** (19,6 % der Kosten, grösster roter Anteil) nach Ursache aufschlüsseln: Wachstum je Turn gegen Grösse der Tool-Ergebnisse (Lese-Ergebnisse, Test-Ausgaben) für `lead-tech`, `qa-code-reviewer`, `qa-playtester`. Verantwortlich: studio-coach, Frist: nächste Session-Retro. Kosten: ≈ 15 Tool-Aufrufe in der nächsten Kurz-Retro; Nutzen: macht aus der Vermutung „Kontextwachstum“ einen Befund oder schliesst sie aus.

Nicht vorgeschlagen, aber Messauftrag: B3 (Verbote nur im Text). Zählung in der nächsten Retro über Rulings und Events (Warte-Agent/`sleep`, Hintergrundstart durch Leads, Last-Verstoss). Ab 3 Verstössen derselben Klasse in einer Session folgt ein Guard- oder Werkzeug-Vorschlag nach dem Muster E-064.

## Bewertung laufender Experimente

- **E-062** (Turnkappe 60): kein Plan-Briefing seit dem Start nennt die Kappe (B1); Messwerte `plan-handel-2` 61 Turns / 1,54 M, `plan-ui-aufraeum-3` 30 Turns / 0,28 M, `plan-i-100` 7 Turns / 0,08 M sind nicht der Kappe zuzuschreiben → **zurückgenommen (nie angewendet, nicht bewertbar)**; Neustart nur mit dem Satz in `lead-tech.md` oder der Briefing-Vorlage (L0-Ruling nötig). Keine Aussage „behalten“, denn die Schwelle (≤ 1,5 M, 0 blockierende Befunde) wäre ohne Anwendung zufällig erfüllt (Gate-Plan-Urteile R617 BEDENKEN, R619 BEDENKEN, R639 OK, keines ZURÜCK).
- **E-063** (Integrator im Worktree): 15 von 18 Briefings mit Worktree, 3 mit Hauptcheckout per Ruling (R627, R636, R644), 0 genannte Vorfälle in R616–R645 → **angepasst** (V2); L0 bestätigt per Ruling.
- **E-064** (Stash-Sperre): läuft seit R614 (2026-10-13); in R616–R645 und im Archiv dieser Session kein Stash-Fall genannt, die 10 Umsetzer-Pakete sind noch nicht erreicht → weiter beobachten.
- **Freigabe-Vorschlag E-066** (R615): Platz wird frei, wenn L0 E-062 per Ruling zurücknimmt (V1). E-065 und E-067 warten weiter (Reihenfolge R615: E-066, E-065, E-067).

## Änderungen an lernen.md

- neu: Zeitreserve-Gate-Zeile (Tests des Prüfwerkzeugs selbst, zwei Releases in Folge, R624/R642/R644) · gestrichen: Zeile „Die E-049-Bereinigung greift nur bei Budget-Phasen mit Präfix …“ (Werkzeug-Detail, durch die Budget-Zeile und die Zeile „nur Budget keins“ der Ampel abgedeckt).
