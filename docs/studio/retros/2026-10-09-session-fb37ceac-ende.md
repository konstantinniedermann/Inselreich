# Retro session fb37ceac — 2026-10-09

- Datum: 2026-10-09
- Art: session
- Auslöser: Session-Ende fb37ceac (REL-11 + REL-12 live, I-028 von Brainstorming bis Merge, REL-13 Gate OK, Push offen); Vorfall `inaktiv:fb37ceac-624a-4512-976a-df144c4234fb:aff1e92221e715417`; Ampel `ampel:steuerung:S-2026-10-09-fb37ceac` (Steuerungsanteil rot, zweite Session in Folge)
- Datenbasis: `python3 tools/studio/metrics.py --efficiency` (Historie, 37 Sessions) und `--sessions 1`, `docs/studio/metriken/S-2026-10-09-fb37ceac.md` (Rohwerte `lead_stats`, `rewrite_stats`), `docs/studio/rulings.md` R411–R419, `.studio/events.jsonl` (Session `fb37ceac`, 1553 Zeilen, per Skript: Spawns mit `model`/`resolved_model`, Lead-Status), `.studio/archiv/berichte/20261009-15*…19*` (T1a, T1b, T2), `docs/studio/STUDIO.md` „Modellwahl“ und „Limits“, `docs/studio/metriken/richtwerte.md`, Retros [session-e90e097e-ende](2026-10-09-session-e90e097e-ende.md) und [release-rel12-prozess](2026-10-09-release-rel12-prozess.md). Zeiten UTC.

## Befunde

### B1 · Leads und Coach liefen gegen die Modelltabelle auf opus

- Beobachtung: L0 startete 13 Lead- und Coach-Instanzen, 12 davon mit `model: opus` (Events `kind: spawn`, `agent_id: main`). Die Modelltabelle `STUDIO.md` Zeile 133 sieht `sonnet` vor für den Controller in der Umsetzung, `lead-qa`-Gate-Urteile, `lead-production` und die Kurz-Retro. Abweichend: lead-qa 5 (Gate Spec, Gate Plan, Gate Merge, Release-Check REL-12 und REL-13), lead-production 2 (Gate Plan, BEOB-AUSW-03), lead-tech als Controller 2 (Umsetzung I-028, Instanz 2), studio-coach Kurz-Retro 1 (diese Retro). Das sind 10 von 13; lead-tech Gate Spec ist unklar (Tabelle nennt nur „Plan“). Frontmatter `lead-tech`, `lead-qa`, `lead-production`: `sonnet`.
- Vergleich: in den vier Vorsessions waren es je 0–2 (56d273bd 0 von 13, e90e097e 1 von 11, 29c3791b 1–2, 191cc1e4 1 von 5; immer lead-qa). Die Ampelzeile „Persona-Starts (Modell gegen Frontmatter)“ zeigt 0 / 0: Sie zählt nur `general-purpose`-Starts, typisierte Starts mit `model`-Override fallen durch.
- Wirkung: Kostengewicht dieser Instanzen 4,4–5,4 M von 16,96 M (26–32 %; `lead_stats.rows`, Spanne, weil die beiden grossen lead-tech-Zeilen Plan und Instanz 2 nicht eindeutig zuzuordnen sind). Mit dem Modellfaktor 0,6 für sonnet (`tools/studio/efficiency.py` Zeile 36) wären es ≈ 2 M weniger: opus-Anteil ≈ 49–56 % statt 75,6 %, Steuerungsanteil ≈ 53 % statt 58,8 % (Überschlag).
- Deutung: Die Briefing-Kopfzeile übernimmt das Modell aus der Tabellenzeile `metriken/richtwerte.md` (Zeile 86: „lead-qa | opus | Gate- oder Final-Prüfung“; Stand 2026-10-01, Spalte heisst „Modell“, gemeint ist „gemessen auf“). Belegt ist das nur indirekt: jede Kopfzeile dieser Session nennt „lead-qa opus …“ bzw. „lead-production opus Auswertung“. Der Hebel E-038 („Leads bei Ein-Umsetzer-Paketen auf sonnet“) ist als Regel schon im Handbuch, wird aber nicht durchgesetzt. Neu ist nicht die Regel, sondern ein mechanischer Riegel (V1).

### B2 · Ein Drittel des Lead-Aufwands war Gate- und Plan-Arbeit ohne Delegation

- Beobachtung: 7 von 12 Lead-Starts tragen im Briefing „Budget: keins, keine Agenten starten“ (Gate Spec ×2, Plan, Gate Plan ×2, Gate Merge, BEOB-AUSW-03). Ihr Kostengewicht: 2,3–3,3 M = 13,5–19,4 Prozentpunkte der Session. Alle tragen Paket-IDs `I-028` oder `BEOB-AUSW-03`.
- Deutung: Der Namensfilter von E-049 (`PLAN`, `SPEC`, `BRAIN`, `PERF`, `MESS`) hätte hier 0 Instanzen herausgerechnet, „bereinigt“ wäre gleich „roh“ (58,8 %). Nach der Budget-Kopfzeile bereinigt liegt der Steuerungsanteil bei ≈ 39–45 %. E-049 misst in der heutigen Form nicht, was es soll (V2).

### B3 · Verwaister Vitest-Worker hielt die Last über die ganze Umsetzung hoch

- Beobachtung: T1a Last 3,8 → 5–6, T1b Last 6–7 (Nachmessung bei ≤ 4,2), T2 erster `make check` unter Last 20 mit 10 reinen Zeit-Timeouts, Zeitvergleich bei 5,3 (Berichte `20261009-153757-tech-sim-engineer-…`, `…-155625-…`, `…-183432-tech-ui-engineer-…`). T2 lief 16:11–18:34 (2,4 h). L0 beendete den Worker per PID (Turn-Ende 18:52:21: „verwaisten Testprozess beendet“); Herkunft laut L0 Session e90e097e. `state.md` Zeile 53 nennt jetzt die Prüfung vor dem Push; TOOL-STUDIO-HYGIENE (`docs/beobachtungen.md` Zeile 63) will den Fall in der Testsperre melden.
- Wirkung: tech-ui-engineer 10 Neuschreibungen > 20k (1,0 M Kostengewicht, 7 nach Bash, Median-Pause 15,6 min), L0 eine Neuschreibung nach 211 min Pause (315k); Zeitabnahmen in T1a, T1b und T2 mussten nachgemessen werden.
- Deutung: Erster belegter Fall eines verwaisten Workers, aber dritter und vierter Fall von „Last > 4 verfälscht Zeitabnahmen“ (R401, R413, B4 der Retro e90e097e). Wann der Worker angefangen hat, ist nicht belegt (keine Last-Zeitreihe). Kein eigener Vorschlag: Das Werkzeug-Paket ist triagiert. Empfehlung an L0: TOOL-STUDIO-HYGIENE zusammen mit TOOL-PRETTIER-HOOK (R417 V2) in der nächsten Session starten; bis dahin `ps` nach PPID 1 beim Session-Start (lernen.md, neu).

### B4 · Vorfall „Agent unbekannt ist inaktiv“ aff1e92221e715417: Messartefakt, bekannte Form

- Beobachtung: Das einzige Event zu dieser ID ist ein `heartbeat` (Bash) um 19:31:53 ohne Rolle, ohne `spawn`, `agent_start` oder `agent_stop` (`events.jsonl` Zeile 60719). Er liegt zwischen Heartbeats von lead-qa (REL-13) und lead-production (BEOB-AUSW-03), umgeben von rollenlosen `internal`-Stops („Checking the release delta with git diff“, 19:31:47). Im ganzen Log gibt es 14 solche Einzel-Heartbeats in 10 Sessions (Skript über `.studio/events.jsonl`).
- Deutung: zweite Form des Phantoms aus `lernen.md` (Session 6a98e530), kein Budgetverstoss, kein Paket. Die Release-Retro beschrieb die erste Form (Spawn „no-op“ ohne Start). Der Filter in TOOL-STUDIO-HYGIENE deckt bisher nur „Spawn ohne `agent_start`“ ab; er sollte auch „einzelner rollenloser Heartbeat ohne Spawn“ ausblenden (Befund ausserhalb Scope, im Bericht).

### B5 · Lead-Statusturns: Briefing-Vorlage widerspricht E-042

- Beobachtung: Leads meldeten 23 alleinstehende Statusturns in 12 Instanzen (1,92 je Instanz; `lead_stats`), lead-tech allein 14. lead-tech meldete `active` und `done` je Auftrag (Events 14:30, 14:32, 14:34, 14:43, 14:47, 14:55, 15:14), obwohl Persona Zeile 136 und `STUDIO.md` Zeile 70 das nach E-042 abgeschafft haben. Die Briefing-Vorlage `templates/briefing.md` Zeile 49 und 54 führt „Start“ und „Fertig“ für jede Rolle ohne Ausnahme; dazu kommen je Arbeiterstart `delegated` und `waiting`.
- Deutung: Die Rangfolge Persona vor Briefing hilft nicht, wenn der Block im Briefing wörtlich steht. Teil der E-042-Bewertung (unten).

### B6 · Positiv

- I-028 lief in einer Session von Brainstorming (14:03) bis zum lokalen Merge (R418, ≈ 19:30): 42/42 AK, Review-Runden 1,40, Balancing-Test unverändert, Rot-Beleg in T1a, T1b und T2 je mit Commit und Auszug. Schätzung 186 min gegen Ist 93,9 min (−49,5 %). REL-13 ohne Browser-Leistungsmessung (Handbuch 1.35, R419). `docs/beobachtungen.md` von 110 KB auf 36,8 KB archiviert (BEOB-AUSW-03): Messauftrag R417 erfüllt.

## Effizienz-Ampel

Quelle: Abschnitt „Effizienz“ der Session-Datei (Session) und `metrics.py --efficiency` (Historie, 37 Sessions). Steuerungsanteil: dritte Retro in Folge rot (e90e097e, release-rel12, fb37ceac) → Hebel-Vorschlag Pflicht (V1). Grösste Datei: dritte Retro in Folge gelb → Hebel-Vorschlag Pflicht (V3).

| Kennzahl                 | Session (Historie)                  | Ampel             | Befund / Ursache                                                                                                                                                                                                           | Hebel oder Messauftrag mit Frist                                                                                                                        |
| ------------------------ | ----------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil         | 58,8 % (50,7 %)                     | rot (rot)         | B1, B2. Beobachtung: L0 13,1 %, Leads 45,8 %; Controller lead-tech I-028 kostete 2,8–3,8 M, so viel wie alle Umsetzer (17,6 % ≈ 3,0 M). Deutung: zum Teil strukturell (Gates, Plan), zum Teil Modellwahl gegen die Tabelle | V1 (E-038 angepasst: Modell-Riegel, Start jetzt) und V2 (E-049 angepasst: Bereinigung nach Budget-Kopfzeile, Start jetzt)                               |
| Umsetzeranteil           | 17,6 % (23,7 %)                     | grün              | –                                                                                                                                                                                                                          | –                                                                                                                                                       |
| Cache-Write 5 min        | 31,7 % (29,1 %)                     | rot (rot)         | B3. Beobachtung: 23 Neuschreibungen, 15,2 % des Kostengewichts, 68,9 % nach Turn-Ende; tech-ui-engineer 7 nach Bash unter Last 20. E-037 dritter Datenpunkt verfehlt (unten)                                               | E-050 (Umsetzer frisch statt Fortsetzung) auf einen freien Platz; TOOL-STUDIO-HYGIENE nächste Session (B3); V1 senkt den Preis der Lead-Neuschreibungen |
| Lead-Kontext Median      | 69k (70k)                           | grün              | –                                                                                                                                                                                                                          | –                                                                                                                                                       |
| L0-Kontext Max           | 225k (774k)                         | grün (rot)        | Messauftrag aus 29c3791b erfüllt: 225k (bis Session-Ende 240k) unter der Übergabeschwelle 25 % (`STUDIO.md` „Sessiongrösse“, ≈ 250k bei 1M-Fenster); Historienwert aus 29c3791b                                            | Kein Hebel nötig; der Historienwert fällt erst mit `--sessions` heraus                                                                                  |
| opus-Anteil              | 75,6 % (71,7 %)                     | gelb (gelb)       | B1: 12 von 13 Lead-/Coach-Starts auf opus, 10 davon gegen die Tabelle                                                                                                                                                      | V1                                                                                                                                                      |
| general-purpose auf opus | 0 (0)                               | grün              | Zeile zählt typisierte Starts nicht (B1)                                                                                                                                                                                   | V1 erweitert die Zählung                                                                                                                                |
| Grösste gelesene Datei   | 66,7 KB (66,7 KB)                   | gelb (gelb)       | Beobachtung: Final-Review las `review-final-3417346..aee3c6b.diff` (Datei 289 KB, Teil gelesen), dazu 46,9 KB aus `review-36c98ff..5174971.diff` (165 KB). Ursache `docs/beobachtungen.md` aus den Vorretros erledigt      | V3 (Review-Diff je Datei statt Gesamtdatei)                                                                                                             |
| Actions-Minuten (Monat)  | Inselreich 942, Konto 1210, Sess. 8 | rot / gelb / grün | Monat +8 min (ein Push REL-11 + REL-12); hoher Monatswert aus der Zeit vor R333–R335                                                                                                                                       | Kein neuer Hebel; E-046 Datenpunkt 3 (unten); Monatswert fällt am 2026-11-01 zurück                                                                     |

## Befragung der Leads

- Nicht befragt (Kurz-Retro ohne Agentenstart). Quellen: Archiv-Berichte T1a, T1b, T2, Ruling-Texte R411–R419, Event-Log.

## Vorschläge

Höchstens 3. Platzlage: E-037, E-042 und E-046 haben mit dieser Session ihren dritten Datenpunkt (Bewertung unten); werden sie abgeschlossen, sind 3 Plätze frei. Empfehlung: E-038 (V1), E-049 (V2), E-050 (Wartende, Cache-Write-Hebel). E-048 (Platz 2 der Warteliste) wartet weiter: Die Ampel-Pflicht nach R316 geht vor.

### V1 · E-038 angepasst: Modell nach Tabelle mechanisch durchsetzen, Start jetzt

- Hypothese: Wenn Lead- und Coach-Starts das Modell aus der Modelltabelle (`STUDIO.md` „Modellwahl“) erhalten und ein Riegel opus-Overrides gegen ein sonnet-Frontmatter nur mit einer Tabellen-Ausnahme zulässt, sinken opus- und Steuerungsanteil ohne mehr Nacharbeit (B1). Umsetzung zweistufig: (a) sofort `metriken/richtwerte.md`: Spalte „Modell“ in „gemessen auf“ umbenennen, Hinweis „Modell nach `STUDIO.md`, nicht aus dieser Tabelle“ (Coach); (b) Werkzeug-Paket TOOL-MODELL-GUARD: der Guard prüft auch typisierte Persona-Starts (`model` gegen Frontmatter; opus über sonnet nur mit Kopfzeile `Modell: opus (Ausnahme: Plan|Final-Review|Meilenstein-Retro|…)`), die Ampelzeile „Persona-Starts (Modell gegen Frontmatter)“ zählt typisierte Starts mit.
- Messgrösse: Lead-/Coach-Starts mit Modell über der Tabelle ≤ 1 je Session (Ausgang 10 von 13); opus-Anteil Session ≤ 60 % (Ausgang 75,6 %); Steuerungsanteil bereinigt (V2) ≤ 40 %; je über 3 Sessions mit Umsetzungspaket. Gegenprobe: Review-Runden im Mittel ≤ 2, Gate-Urteile von lead-qa ohne später nachgereichten blockenden Punkt (Zählung in Gate-Rulings), Erstabnahme nicht unter 40 %.
- Messbarkeit: verbessert sich; die Override-Zählung entsteht erst mit (b). Bis dahin zählt der Coach per Skript aus `spawn`-Events (wie in dieser Retro).
- Zeitraum: 3 Sessions mit Umsetzungspaket, höchstens bis 2026-11-19.
- Rückfall: Spaltenname in `richtwerte.md` zurück, Guard-Erweiterung per `git revert`; Modelle wieder frei nach Briefing.
- Dateien: `docs/studio/metriken/richtwerte.md`, `docs/studio/experimente.md`, Werkzeug: `tools/studio/` (Guard, `efficiency.py`), `tools/studio/tests/`, `docs/studio/CHANGELOG.md` (nur nach Ruling). Der alte Stichtag 2026-10-22 entfällt: er hing am Platz von E-027, das R350 abgeschlossen hat.

### V2 · E-049 angepasst: Bereinigung nach Budget-Kopfzeile statt Paketname, Start jetzt

- Hypothese: Wenn die Zeile „Steuerungsanteil bereinigt“ Lead-Instanzen herausrechnet, deren Briefing „Budget: keins“ trägt (Gate, Plan, Auswertung ohne Delegation), statt nach Paketnamen, misst sie die eigentliche Steuerung und macht V1 lesbar (B2).
- Messgrösse: In 3 Session-Dateien steht die Zeile mit Wert; Gegenprobe roh = bereinigt + herausgerechnete Lead-Instanzen (auf 0,1 Prozentpunkte). Ausgang fb37ceac: Namensfilter 0 Instanzen, Budget-Filter 7 von 12, bereinigt ≈ 39–45 % (Handrechnung aus `lead_stats.rows`). Schwellen wie die Rohzeile.
- Messbarkeit: Rohzeile bleibt unverändert; Instanzen ohne Kopfzeile zählen zur Steuerung (konservativ).
- Zeitraum: 3 Sessions nach dem Merge, höchstens bis 2026-11-19.
- Rückfall: Zeile entfernen (`git revert`).
- Dateien: wie E-049 (`tools/studio/efficiency.py`, `metrics.py`, Tests); Quelle der Kopfzeile: `prompt_head` im `spawn`-Event.

### V3 · Final-Review liest den Diff je Datei (Hebel „Grösste gelesene Datei“)

- Hypothese: Wenn der Controller keinen Gesamt-Diff als Datei ablegt, sondern dem Reviewer die Liste aus `git diff --stat <range>` gibt und der Reviewer je Datei `git diff <range> -- <datei>` liest, bleibt die grösste Leseeinheit unter 40 KB, und der Reviewer-Kontext sinkt (Ausgang: Diff-Dateien 145–289 KB, Leseergebnis 66,7 KB, qa-code-reviewer Kontext Max 267k).
- Messgrösse: Ampelzeile „Grösste gelesene Datei“ ≤ 40 KB in 3 Sessions mit Final-Review; Gegenprobe: Final-Review-Befunde je Paket nicht weniger (Zählung im Review-Bericht), Review-Runden ≤ 2.
- Messbarkeit: Ampelzeile unverändert; nichts wird verdeckt.
- Zeitraum: 3 Sessions mit Final-Review, höchstens bis 2026-11-19.
- Rückfall: Satz streichen.
- Dateien: `.claude/agents/lead-tech.md`, `.claude/agents/qa-code-reviewer.md`, `docs/studio/STUDIO.md` (Umsetzung, Schritt 4), `docs/studio/CHANGELOG.md` (nur nach Ruling). Als Persona-Zeile übernehmen ohne Experiment-Platz (Vorbild E-052, R392), Wirkung über die Ampel.

Empfehlung: V1 annehmen (a sofort, b als Werkzeug-Paket), V2 annehmen, V3 annehmen als Persona-Zeile.

## Bewertung laufender Experimente

- E-037 (Cache-Write ≤ 20 % im Mittel über 3 Sessions): 24,3 % (29c3791b), 24,1 % (e90e097e), 31,7 % (fb37ceac), Mittel 26,7 % → Schwelle verfehlt. Neuschreibungen nach Bash sind die Minderheit (fb37ceac 31 % des Gewichts, davon der Grossteil unter Fremdlast, B3). Empfehlung: **angepasst** — die Regel „lange Bash-Läufe im Hintergrund“ bleibt als Hygiene, sie ist kein Cache-Write-Hebel mehr; Platz frei für E-050.
- E-042 (Lead-Handoff, Statusturns): V1 Lead-Neuschreibungen nach Turn-Ende je Instanz 0,82 / 0,45 / 0,75 (fb37ceac: 9 in 12), gepoolt 32 in 45 = 0,71 → Schwelle ≤ 0,6 verfehlt; V2 0,64 / nicht erhoben / 1,92, gepoolt 1,09 → Schwelle ≤ 1 verfehlt (B5). Gegenprobe Review-Runden 1,00 / 1,29 / 1,40 eingehalten. Deutung V1: Lead-Starts laufen als „async“ (lernen.md Zeile 1); jeder Arbeiterbericht nach > 5 min weckt den Lead mit voller Neuschreibung (lead-tech 6, Median-Pause 15,6 min). Empfehlung: **angepasst** — Handoff und „kein `active`/`done`“ bleiben; Briefing-Vorlage Logging-Block: „Start“ und „Fertig“ mit „(nicht Leads, E-042)“ markieren; V2-Messung endet, weil `delegated`/`waiting` je Arbeiterstart strukturell sind. Die Lead-Kosten verfolgt V1/V2.
- E-046 (Actions-Minuten): Datenpunkt 3 von 3 mit Wert (Monat 942, Konto 1210, Session 8); in 3 Sessions kein Verbrauch erst vom Nutzer entdeckt → Schwelle erreicht. Einschränkung: Die Zeile steht im Abschnitt „Actions-Minuten“ von `metrics.py --efficiency`, nicht in der Session-Datei. Empfehlung: **behalten**, Messgrösse auf „`--efficiency` nennt den Wert“ lesen.
- Messgrössen aus R410: V1 (0 Integrator-Abbrüche der Klasse tsc/lint/zeittests/conflicts in 5 Gates): 2 von 5 Gates, 1 Abbruch (lint, Doku-Paket, R416), Merge I-028 ohne Abbruch (R418). V2 (Rot-Beleg ≤ 20 % in 3 Paketen mit neuen Tests): Paket 1 von 3 I-028 erfüllt (T1a, T1b, T2 mit rotem Commit und Auszug; einziger Fall ohne Rot AK-T20, im Bericht begründet).
- Messgrössen aus R417: V1 (0 Gate-Plan-Punkte Format/AK in 3 Gate Plan): seit R417 kein Gate Plan, 0 von 3. V2 (TOOL-PRETTIER-HOOK): noch nicht gebaut; Zwischenregel `make docs-check` vor Doku-Commits, seit R417 kein lint-Abbruch (Merge I-028). V3 (0 Urteile „unter Last ungültig“ in 3 Release-Checks): REL-13 ohne Browser-Messung, 1 von 3 erfüllt.
- E-038, E-048, E-049, E-050: wartend, keine Bewertung (V1, V2, Platzvergabe).

## Änderungen an lernen.md

- neu: Verwaiste Vitest-Worker vor Test- und Messläufen prüfen (B3); Doku-Format vor jedem Commit, zusammengeführt mit der state.md-Zeile (R416); Modell aus der Modelltabelle, nicht aus der Richtwert-Zeile (B1, in die Zeile „Modell explizit“) · zusammengeführt: die beiden Zeilen zu „inaktiv“ (B4, 14 Einzel-Heartbeats in 10 Sessions) · gestrichen: Zeile „Kontextwert-Sprung gegenprüfen“ (R80, Altbefund ohne Fall seit dem Sensor-Fix).
