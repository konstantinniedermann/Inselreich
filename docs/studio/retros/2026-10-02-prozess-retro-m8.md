# Retro adhoc Prozess-Retro M8 (Aussensicht) — 2026-10-02

- Datum: 2026-10-02
- Art: adhoc (Prozess-Aussensicht nach Release, R127)
- Rolle: `studio-process-coach`
- Zeitraum: Session 58d6bc4a (15:25–22:11 MESZ): Programm Nutzerfeedback (R144–R148), M8 komplett (R146–R165),
  M9 H-R1/H-R2, BUG-LICHT, Design, Spec und Plan M10
- Auslöser: Release M8 (main @ 2bf964e, CI und Pages grün)
- Datenbasis: `docs/studio/rulings.md` R144–R165, `docs/studio/metriken/S-2026-10-02-58d6bc4a.md`,
  `docs/studio/metriken/M8.md`, `.studio/handoffs/retro-notizen-58d6bc4a.md`, `.superpowers/sdd/m8/ledger.md`,
  `.studio/events.jsonl` (gezielt: `package`, `budget`, `status`, `ci`, `agent_start/stop`), `.studio/limits.json`,
  Subagent-Transkripte der Session (nur Zeitstempel der Tool-Aufrufe), `git log --first-parent main`
- Zeiten in MESZ (Events in UTC + 2 h)
- Umfang: ein Start, 21 Werkzeugaufrufe, keine Lead-Befragung

## Beobachtung

### B0 · Eckzahlen

- Session: 59 Delegationen, 2 465 Tool-Aufrufe, Cache-Read 280 Mio. (Opus 238,5 Mio., 85 %), Output ≥ 2,08 Mio.
  Erstabnahme 80 %, Nacharbeit 8 %, 60 CI-Läufe, 0 Fehlschläge auf main (Metrik Session).
- M8: 1 950 Tool-Aufrufe, Erstabnahme 88 %, Nacharbeit 8 %, Review-Runden im Mittel 1,06 (M7-UX: 59 %, 26 %, 1,45).
  Schätzung Werkzeugaufrufe 1 049, Ist 1 510 (+44 %); Session 1 062 gegen 2 329 (+119 %).
- Auf main liegen 34 First-Parent-Commits der Session, davon 22 Ruling-Commits mit je eigenem Push (`git log`).
- Wochenkontingent: 69 % bei R148 (15:52), 77 % beim Start von W5 (Ledger Z. 40), 82 % am Ende (`.studio/limits.json`,
  `seven_day_pct`). Reset in rund 4,6 Tagen.

### B1 · Kritischer Pfad M8: 149 min in zwei hängenden Tool-Aufrufen

- Die M8-Technik war um 19:18 fertig (Task 6–8, QA-B, D1; `package` M8-D1 `done`). Das Final-Review begann erst um
  21:53, nach dem Blindtest M8-R1 (lead-art).
- Blindtest-Agent `a3c74c25` (qa-playtester): Teil A hatte 18 Tool-Aufrufe zwischen 19:16:18 und 19:18:23. Danach lief
  **ein** Bash-Aufruf von 19:18:44 bis 20:25:17 (66,6 min). Teil B hatte 10 Aufrufe zwischen 20:27 und 20:29, danach lief
  wieder ein Bash-Aufruf von 20:29:43 bis 21:52:20 (82,6 min). Transkript
  `~/.claude/projects/…/58d6bc4a-…/subagents/agent-a3c74c2523a8aa00a.jsonl`.
- Beide Aufrufe enthalten dasselbe Aufräumen: Bericht anhängen, `kill`, `pkill -f`, `lsof -i`, `rm -rf …/chrome-prof`,
  `ls`. Der Agent nennt selbst „etwa 14 Tool-Aufrufe, rund 6 min Wartezeit" (`.studio/archiv/berichte/20261002-195229-qa-playtester-a3c74c2523a8aa00a.md`).
- Ein Bash-Aufruf darf höchstens 10 min laufen. Über alle Subagenten der Session hinweg gibt es nur diese zwei Aufrufe über
  10 min. Sechs weitere liegen bei 8,3–10,0 min (lead-art H-R1/H-R2-Läufe, Skript dieser Retro).
- lead-art wartete in der Zeit asynchron. Weder lead-art noch L0 haben den Hänger bemerkt (kein `status`, kein Vorfall).

### B2 · Wartezeit auf den 5-h-Reset

- Merge Sim 10779f9 um 16:59 (R158, 5-h-Fenster 58 %, R69). W5 startete um 19:01. Damit wartete der M8-Strang 119 min.
- In der Wartezeit liefen H-R2 (lead-art, bis 18:07, 3 Playtest-Runden) und die M10-Spec (design-spec-author 16:42–17:07).
  Von 18:07 bis 19:01 lief kein Agent (`agent_start/stop`).
- Controller 2 überbrückte die Pause mit lebendem Kontext. E-010 M-3: 4,21 Mio. Cache-Read je Task, Schwelle 3,5 Mio.
  Der Ledger (Z. 175) nennt als Störgrösse „Wartezeit über 5-h-Reset (Kontext blieb, Cache neu geschrieben)".

### B3 · Nutzernachtrag S11: Gate-Kaskade und zweite Doku-Runde

- Spec und Plan M8 gingen um 15:40 nach main (f6d3d37, R146). Der Nachtrag S11 kam um 15:41 (Prompt-Event), R147 um 15:41.
- Danach folgte die Kette Spec-Delta 413d6b8 → R150 → Plan-Delta 3b6abdc → R151 (W8–W10, Spec nachführen) →
  Delta-Gate lead-qa → R152 BEDENKEN (B2 Doku-Abgleich Spec/Plan) → zweite Doku-Runde 42ee72a um 16:25.
- Die Spec wurde dreimal angefasst (Delta, W8–W10, B2) und der Plan zweimal (Delta, B1/B2). Es gab vier L0-Entscheide
  (R147, R150–R152) und zwei Integrator-Merges. Durchlauf H-M8 15:52–16:23 (31 min).

### B4 · Schreibzugriffe auf main, Pages-Stau und Rebase

- Die 22 Ruling-Pushes lösten je einen Pages-Lauf aus. Lauf 37020496927 hing rund 30 min in `queued`. Mit
  `cancel-in-progress: false` wurden um 17:02 sechs Folgeläufe abgebrochen, darunter der Merge H-R1 (`ci`-Events,
  Retro-Notizen).
- L0 führte im Hauptcheckout `git pull --rebase` aus, um einen lokalen Ruling-Commit (R147) nach einem Integrator-Merge
  nachzuziehen. Dieselbe Anweisung stand in zwei SendMessages und im Plan-Vermerk. lead-design verweigerte. Der Guard-Hook
  erkannte `pull --rebase` nicht (Retro-Notizen). Am 2026-10-01 hatte ein fremder `git pull -q --rebase` schon einmal
  einen `--no-ff`-Merge linearisiert (`decision` lead-production, 16:08).
- Serialisierung über den Hauptcheckout: BUG-LICHT wartete 15 min auf den laufenden Doku-Merge (R153, `status` 16:24 →
  16:39). Die drei M8-Merges liefen seriell in 7 min (22:02 → 22:09).

### B5 · Gate-Muster „BEDENKEN mit Auflagen, keine Zweitprüfung"

- Das Muster kam in der Session fünfmal vor: R152, R160, R163, R164, R165. Jede Auflage wurde in einer Runde geschlossen,
  keine löste ein neues Gate aus, es gab keinen Revert. Vom Urteil bis zum Abschluss: R152 5 min, R165 7 min, R160 24 min,
  R163/R164 bis zum Doku-Merge 3329346 (20:23).
- R165 legt die Nachprüfung als „L0 per Diff `src tests`" fest.

### B6 · Übergabe per Ledger (E-010)

- Controller 1 lag bei 2,31 Mio. je Task (M-1), Controller 2 bei 4,21 Mio. (M-3). Zusammen sind das 24,2 Mio. für 8 Tasks
  mit QA. In M7-UX waren es 50,2 Mio. für 10 Tasks, also 3,0 statt 5,0 Mio. je Task (−40 %).
- Controller 2 fragte 0-mal bei Controller 1 nach, und kein Ruling der zweiten Hälfte widerspricht der ersten (Ledger Z. 177,
  R161 bestätigt C2-2).
- M-1 und M-3 hat der Controller von Hand aus den Transkripten gerechnet, weil `metrics.py` keine Zeile je Agent kennt. Die
  Task-Ausgaben liegen unter einer zweiten Session-ID (Ledger Z. 43, Z. 126).
- Querübergabe: lead-art fragte um 20:25 nach dem Task-7-SHA, „lead-tech nicht erreichbar". Der SHA lag seit 19:06 vor.
  Das kostete 2 min.

### B7 · Board und Budget-Log

- Paketstatus wurde doppelt geschrieben: H-R1 `done` um 16:50 und 17:00, H-R2 um 18:06 und 18:07, M8-S1 um 16:36 zweimal
  mit verschiedenen Titeln, M8-B1/B2/U/QA-B/D1 um 19:06–19:18 und noch einmal um 22:03.
- Das Budget lead-art H-R2 steht im Dashboard mit 6/4, lead-art meldet 3/4. M10-DOCS-MERGE lief ohne Budget-Log
  (Retro-Notizen).

## Deutung

- **B1 · Einzelfall mit hohem Hebel, Ursache noch offen.** 5-Why: M8 kam 2,5 h später auf main → Final-Review wartete auf
  den Blindtest → zwei Aufräum-Aufrufe liefen 67 und 83 min → **die Laufzeit liegt über der Grenze von 10 min, also hat
  nicht der Befehl gewartet, sondern etwas davor oder daneben.** Am wahrscheinlichsten ist ein Freigabe-Dialog für
  `kill`/`pkill`/`rm -rf`, den niemand sah. Belegt ist das nicht → **Wurzel: Ein Hänger auf dem kritischen Pfad ist
  unsichtbar, weil ein asynchron wartender Lead keinen Herzschlag seines Arbeiters prüft und das Aufräumen jedes Mal frei
  zusammengesetzt wird.** Die 385 min „Dauer" von lead-art in der Session-Metrik sind dadurch um 149 min überzeichnet.
- **B2 · Bewusste Bremse, aber in falscher Reihenfolge.** R69 hat richtig gebremst. Vor dem Reset bekamen aber Stränge
  späterer Meilensteine (H-R2, M10-Spec) das knappe 5-h-Fenster, während der Strang mit dem nächsten Release wartete.
  Laut Kanban-Logik (erst abschliessen, dann neu beginnen) verlängert das die Durchlaufzeit von M8, ohne den Gesamtdurchsatz
  zu erhöhen. Für den Nutzer sichtbar waren H-R1, H-R2 und BUG-LICHT, die M10-Spec war es nicht. Unsicher bleibt, ob W5 ohne
  diese Stränge vor dem Reset noch Platz gehabt hätte, weil es keine Zuordnung von Limit-Prozent zu Strängen gibt.
- **B3 · Muster: Ein Delta läuft durch dieselbe Kette wie eine neue Spec.** Jede Zwischenstufe (Spec-Delta, Plan-Delta,
  Gate) brachte eine L0-Sichtung, und die Widersprüche W8–W10 tauchten erst im Plan-Delta auf. Darum musste die Spec ein
  zweites Mal nachgeführt werden und B2 („Doku-Abgleich") war nötig. Die doppelte Doku-Runde ist ein Zufall des Timings
  (1 min), die dreifache Spec-Nachführung ist strukturell.
- **B4 · Muster, zweites Vorkommen: Zwei Schreiber auf main.** 5-Why: L0 hat `pull --rebase` ausgeführt → der lokale
  Ruling-Commit liess sich nicht fast-forward nachziehen → der Integrator hatte inzwischen gepusht → L0 committet Rulings
  direkt auf main im Hauptcheckout, und der Integrator merged gleichzeitig nach main → **Wurzel: Rulings sind
  Einzel-Pushes auf denselben Branch, auf dem gemerged wird, und jeder Push startet einen Deploy.** Die Verfassung (§6.3)
  verbietet den Rebase bereits. Die Lücke ist nur der Hook, der die Schreibweise `pull --rebase` nicht erkennt.
- **B5 · Bewährt.** Das Muster hat in der Session fünf Zweitprüfungen gespart und zeigte keine Qualitätseinbusse:
  Erstabnahme M8 88 %, 0 Fehlschläge auf main. Ein Risiko bleibt: Die Nachprüfung per Diff bei L0 (R165) grenzt an
  inhaltliche Arbeit von L0. Solange sie nur die benannten Auflagen abhakt, ist das vertretbar. Kein Vorschlag.
- **B6 · Übergabe trägt.** Es ging keine Information verloren, und je Task fiel deutlich weniger Cache an als in M7-UX. Die
  Schwelle verfehlte nur die zweite Hälfte, und zwar wegen B2: Die Pause über den Reset schrieb den Cache neu. Der
  natürliche Übergabepunkt wäre genau diese Pause gewesen. Die Handrechnung kostet bei jeder Messung Controller-Zeit.
- **B7 · Rauschen, kein Schaden.** Es gibt zwei Schreiber je Paketstatus (Lead und L0). Das ist dasselbe Muster wie in B4
  im Kleinen. Die Budget-Abweichung gehört zum studio-coach.

## Vorschläge

Nach Hebel sortiert. Kein Vorschlag ist umgesetzt, L0 entscheidet.

### V1 · Hänger auf dem kritischen Pfad sichtbar machen, Aufräumen als festes Skript (B1)

- Inhalt: (a) Zuerst die Ursache klären, mit einer Frage an den Nutzer: Stand um 20:25 bzw. 21:52 ein Freigabe-Dialog
  offen? (b) Vite und Chrome räumt ein festes Repo-Skript auf (z. B. Make-Ziel `qa-stop`, ohne `pkill -f` und
  `rm -rf` frei formuliert), Playtester-Briefings nennen nur noch dieses Skript. (c) Das Dashboard meldet einen Tool-Aufruf,
  der länger als 12 min offen ist, als Vorfall an L0. Das liegt über der Bash-Grenze und ist damit immer ein Hänger.
- Erwartete Einsparung: In M8 149 min Durchlaufzeit bis zum Release. Allgemein wird der Hänger nach 12 statt nach 67 min
  gesehen.
- Messgrösse mit Schwelle: Tool-Aufrufe über 10 min in den Subagent-Transkripten je Meilenstein = 0 (M8: 2). Gemessen mit
  demselben Zeitstempel-Skript wie in dieser Retro.
- Rückfallzustand: Aufräumen frei formuliert, kein Alarm.
- Aufwand: (b) lead-tech oder lead-qa rund 20 min; (c) lead-tech in `tools/studio/` rund 1 h.

### V2 · Ruling-Pushes entkoppeln: kein Pages-Lauf für Doku, Hook kennt `pull --rebase` (B4)

- Inhalt: (a) In `pages.yml` kommt `paths-ignore` für `docs/studio/**` und `.studio/**`, sodass Ruling-Pushes keinen Deploy
  mehr starten. (b) Der Guard-Hook blockt auch `pull --rebase`, `pull -r` und `-c pull.rebase=true`, mit Test. (c) Optional:
  L0 bündelt Rulings, die keine Freigabe auslösen, bis zum nächsten Merge-Fenster.
- Erwartete Einsparung: rund 22 Pages-Läufe je Session. Kein Stau wie bei 37020496927 (30 min, 6 Abbrüche). Der dritte
  Rebase-Vorfall wird verhindert, statt dass ihn ein Lead bemerkt.
- Messgrösse mit Schwelle: Pages-Läufe je Session ≤ Merges von `feat`/`fix` + 2. Abgebrochene Pages-Läufe 0. Rebase-Versuche
  im Hauptcheckout 0 über die nächsten 2 Meilensteine.
- Rückfallzustand: `pages.yml` und Hook wie heute.
- Aufwand: (a) 3 Zeilen durch lead-production oder den Integrator; (b) eine Regex-Zeile mit Test, rund 20 min.

### V3 · Im knappen 5-h-Fenster zuerst abschliessen, dann neu beginnen (B2)

- Inhalt: Eine Ergänzung zu R69 im Handbuch. Ab 45 % im 5-h-Fenster bekommt der Strang mit dem nächsten Merge auf main
  Vorrang. Neue Design- oder Spec-Arbeit für spätere Meilensteine startet nur, wenn kein Release-Strang auf das Fenster
  wartet. Laufende Pakete laufen weiter.
- Erwartete Einsparung: In M8 bis zu 119 min Durchlaufzeit, falls W5 vor dem Reset Platz gehabt hätte. Die
  Häppchen-Lieferung für den Nutzer bleibt gleich, weil sichtbare Häppchen meist Release-Stränge sind.
- Messgrösse mit Schwelle: Pause zwischen dem Ende einer Welle und dem Start der nächsten Welle desselben Meilensteins
  ≤ 30 min (M8: 119 min). Gegenprobe: Merges auf main je Session sinken nicht (heute 8).
- Rückfallzustand: R69 wie heute.
- Aufwand: studio-coach, ein Satz in `docs/studio/STUDIO.md` (Abschnitt Herunterfahren).

### V4 · Nutzernachtrag zu einer laufenden Spec: ein Delta-Paket, ein Ruling (B3)

- Inhalt: Ein Delta zu Spec und Plan, das kleiner als eine Session ist, läuft als **ein** Paket. lead-design und lead-tech
  schreiben Spec- und Plan-Delta im selben Branch und lösen Widersprüche (W-Liste) zuerst gemeinsam. Danach folgt das
  Delta-Gate von lead-qa und **ein** L0-Ruling. Die Doku geht erst nach diesem Ruling nach main.
- Erwartete Einsparung: zwei L0-Sichtungen, eine Spec-Nachführung, rund 10–15 min je Delta. Die zweite Doku-Runde entfällt,
  sofern das Delta vor dem Doku-Merge bekannt ist.
- Messgrösse mit Schwelle: L0-Rulings je Delta ≤ 1 neben dem Auslöser (S11: 3). Spec-Commits je Delta ≤ 2 (S11: 3).
- Rückfallzustand: die gestaffelte Kette wie in R150–R152.
- Aufwand: studio-coach, ein Absatz in `docs/studio/gates.md`.

### V5 · E-010: Wechselpunkt an die erzwungene Pause legen, Messung per Werkzeug (B2, B6)

- Inhalt: (a) Wartet eine Welle auf einen Reset, übergibt der Controller an dieser Stelle per Ledger, statt mit lebendem
  Kontext zu warten. Der Wechsel „nach der Hälfte" bleibt der Rückfall. (b) `metrics.py` bekommt eine Tabelle
  „Tokens je Agent" (`usage` je agent_id), auch über Session-IDs hinweg. Dann entfällt die Handrechnung aus den Transkripten.
- Erwartete Einsparung: M-3 ohne den neu geschriebenen Cache (Ledger: 4,21 → geschätzt ≤ 3,5 Mio. je Task). Pro Messpunkt
  entfällt eine Handrechnung des Controllers.
- Messgrösse mit Schwelle: Cache-Read je Task ≤ 3,5 Mio. für beide Controller im nächsten Meilenstein mit mehr als 6 Tasks
  (M10). Handrechnungen im Ledger: 0.
- Rückfallzustand: E-010 in der heutigen Fassung.
- Aufwand: (a) studio-coach, eine Zeile in `docs/studio/experimente.md`; (b) lead-tech in `tools/studio/` rund 1 h.

## Bewertung laufender Experimente

- E-010: M-1 2,31 Mio. ≤ 3,5 Mio., M-3 4,21 Mio. > 3,5 Mio. (Störgrösse Reset). Kein Abbruchkriterium greift (0 Rückfragen,
  0 Widersprüche) → weiter beobachten in M10, mit V5.
- E-006: In M8 gab es keinen fremden Schreibzugriff auf einen Arbeitsbaum. Der Rebase-Versuch von L0 (B4) betrifft den
  Hauptcheckout, und den hat L0 selbst ausgelöst. Die Bewertung liegt beim studio-coach.

## Risiken

- Wochenkontingent 82 % mit Reset in rund 4,6 Tagen. Laut Handbuch wird über 80 % die Parallelität reduziert. Die Session
  hat rund 13 Prozentpunkte gekostet. M10 ist mit 29 Starts lead-tech grösser als M8 (25, R143). Ohne Stufung (R164 B2)
  reicht der Rest voraussichtlich nicht für M10 und M9 Welle 2 zusammen.
