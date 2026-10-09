# Retro adhoc release-rel12 — 2026-10-09

- Datum: 2026-10-09
- Art: adhoc (Release-Retro nach R127/R316)
- Auslöser: Push REL-11 + REL-12 `5d14854..3417346`, CI 37949164666, Pages 37949941925 (R416); Vorfall `inaktiv:fb37ceac-624a-4512-976a-df144c4234fb:adf27249890570d9f`
- Datenbasis: `docs/studio/rulings.md` R410–R416, `docs/studio/retros/2026-10-09-session-e90e097e-ende.md`, `.studio/events.jsonl` (Session `fb37ceac`, 619 Zeilen, per Skript gefiltert), `.studio/archiv/briefings/20261009-14*.md`, `git log 5d14854..3417346`, `python3 tools/studio/metrics.py --efficiency` (Historie, 37 Sessions; Session-Datei entsteht erst am Session-Ende). Zeiten in UTC (Event-Log), Commit-Zeiten in `git log` sind Ortszeit (+2 h). „HB“ = Heartbeat-Events je Agent, Näherung für Tool-Aufrufe.

## Befunde

### B1 · Push-Gate-Abbruch an `make lint` durch Doku-Commit (B-a)

- Beobachtung: Integrator-Start 14:47:32, `failed` 14:48:10 („make lint rot (Prettier: …steuer-je-stufe-vorschlag.md)“), Ursache Commit `bb86f7d` (lead-design, Brainstorming I-028). Trivial-Fix `4806006`, zweiter Integrator-Lauf 14:56:03–15:13:11 (R416). Die Briefings von lead-design und design-economy-designer (`.studio/archiv/briefings/20261009-140313-lead-design-vUuJm5ZV.md`, `…-140644-design-economy-designer-SCdoe9Hu.md`) enthalten weder `prettier` noch `docs-check`. design-spec-author lief Prettier von sich aus (Event 14:28:35), lead-tech `make docs-check` vor `630ce91` (R416).
- Wirkung: 1 zusätzlicher Integrator-Lauf, 1 Fix-Commit, 1 Beobachtungs-Commit (`eb412ae`), Ruling-Teil R416 (2). Der Abbruch kam nach 38 s, nicht nach `make test`.
- Deutung: Der Integrator-Vorlauf aus V1 (R410) hat gewirkt. Die Messgrösse von V1 („0 Integrator-Abbrüche mit Ursache tsc/lint/zeittests/conflicts in 5 Gates“) ist nach Wortlaut verfehlt: Gate 1 von 5, Ursache lint. Die Pflichtzeile von V1 sitzt aber nur in der Task-DoD der Code-Pakete; Doku-Pakete haben keine. Empfehlung zur Zählung: als Abbruch zählen, mit Vermerk „Doku-Paket, ausserhalb des V1-Geltungsbereichs“; für die Code-Pakete gibt es seit R410 noch keinen Datenpunkt. 5-Why: lint rot ← Datei unformatiert ← Commit ohne Prettier ← Briefing ohne Formatzeile ← V1 deckt nur Code-Pakete ab ← **Formatprüfung hängt an Briefing-Zeilen statt an einem mechanischen Schritt beim Commit**. Muster: zweite Klasse „schnelle Prüfung erst im Integrator“ nach B1/B2 der Vorgänger-Retro.

### B2 · Vorfall „Agent unbekannt ist inaktiv“ ist ein Phantom, nicht lead-design (B-b)

- Beobachtung: Das einzige Event zu `adf27249890570d9f` ist ein `spawn` um 14:29:33 (`events.jsonl` Zeile 59523): `subagent_type` general-purpose, `description` „Updating handoff and logging done“, `prompt_head` „no-op“, Briefing-Datei enthält nur „no-op“. Der Spawner ist `adf27…` selbst, nicht lead-design (`a9a75da85c25500ed`, dessen Spawns stehen mit eigener ID im Log). Für `adf27…` und für ein Kind gibt es weder `agent_start` noch `agent_stop`. Die Beschreibung hat dieselbe Form wie die 98 rollenlosen `agent_stop`-Zusammenfassungen der Session („Writing lead-design handoff file“, 14:18:59). Über alle 1102 Spawns im Log gibt es genau einen mit `prompt_head` „no-op“.
- Wirkung: Ein L0-Turn Nachverfolgung (Turn-Ende 14:39:50) und eine Fehlzuschreibung an lead-design („Start nicht im Budget“). Kein Budgetverbrauch.
- Deutung: Wahrscheinlich ein Harness-Nebenagent (Zusammenfassung), der einen Agent-Aufruf mit Prompt „no-op“ abgesetzt hat. Den hat der Spawn-Hook erfasst, gestartet ist kein Agent. Einzelfall (1 von 1102), kein Budgetverstoss von lead-design. Kein Vorschlag. Hinweis für die Werkzeug-Pflege: Spawns von Agenten ohne `agent_start` mit Prompt „no-op“ sollte die Inaktiv-Erkennung ausblenden (Befund ausserhalb Scope, siehe Bericht).

### B3 · Parallelität Spec-Nachtrag ‖ Plan: lohnt sich (B-c)

- Beobachtung: Plan lead-tech 14:34:11–14:44:01 parallel zum Nachtrag design-spec-author 14:34:32–14:39:08. Der Nachtrag führte AK-T42 neu ein (Status 14:38:55), der Plan nannte „41 AK + R414“. Das Plan-Briefing (`…-143411-lead-tech-nPGjAfBB.md`, Punkt 6) verbot, `anhang-02` anzufassen, und gab keinen Lesepfad dafür. lead-qa meldete AK-T42 als B-1 im Gate Plan (R415).
- Wirkung: Seriell hätte der Plan frühestens 14:39:32 begonnen, also ≈ 5 min später. Die Lücke kostete 1 von ≈ 10 Nacharbeitspunkten. Die Nacharbeit war ohnehin fällig (E-010, B-2, B-3; siehe B4).
- Deutung: Netto positiv, Parallelität beibehalten. Die Lücke entstand, weil die AK-Nummer im Nachtrag vergeben wurde statt im Gate-Ruling R414, der gemeinsamen Quelle beider paralleler Agenten.

### B4 · Gate-Kette Brainstorming → Spec → Plan (B-d)

| Stufe         | Arbeit (Dauer, HB)                                                                | Gate (Dauer, HB)                                                    | Urteil                        | Nacharbeit (Dauer, HB)                                                          |
| ------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| Brainstorming | lead-design 14:03–14:19 (16,0 min), darin design-economy-designer 9,7 min (13 HB) | L0 allein, R412 < 1 min                                             | OK                            | –                                                                               |
| Spec          | design-spec-author 14:20–14:29 (8,6 min, 31 HB)                                   | lead-tech 3,2 min (19 HB) ‖ lead-qa 2,8 min (12 HB); R414 14:34     | OK mit Auflagen (2× BEDENKEN) | Nachtrag 4,6 min (25 HB), 15 Auflagen, AK-T42                                   |
| Plan          | lead-tech 14:34–14:44 (9,8 min)                                                   | lead-qa 2,2 min (3 HB) ‖ lead-production 1,1 min (6 HB); R415 14:47 | BEDENKEN                      | lead-tech 7,5 min (Plan + Nacharbeit 66 HB); Delta-Check L0 < 1 min, R416 14:56 |

- Beobachtung: Kette 14:03 → 14:56 = 53 min. Gates zusammen ≈ 7 min (13 %), Nacharbeit 12,1 min (23 %). Gate Plan: lead-production bemängelt E-010 (T1 19,4 KB), lead-qa drei blockende Punkte (R415). Das Plan-Briefing sagt „ändern nur die Plan-Datei“; `grep "E-010\|10 KB"` im Briefing findet 0 Treffer. `docs/studio/gates.md` Zeile 245–258 verlangt Index plus Task-Dateien ≤ 10 KB.
- Deutung: Die Gates sind schnell und billig. Die Spec-Auflagen sind echter Prüfnutzen (15 konkrete Testfälle). Die Plan-Nacharbeit war zur Hälfte selbst verursacht. 5-Why: Gate Plan BEDENKEN ← T1 zu gross und Einzeldatei ← Briefing verlangte eine Datei und nannte das Format nicht ← L0 schreibt das Deliverable frei statt aus `gates.md` ← **das Plan-Briefing hat keine feste Formatzeile**. Muster offen: erster belegter Fall in dieser Form.

### B5 · Release-Check REL-12: schlank, Leistungsmessung unter Last ungültig (B-e)

- Beobachtung: Budget 3 Starts, verbraucht 1 (qa-playtester; einziger Spawn von lead-qa `acd9f8ec`). qa-playtester 14:04–14:25 (40 HB), Urteil BEDENKEN: B1–B4 und Smoke bestanden, B5 bei Load 4,6–4,9 „formal nicht gültig“. R413 nahm B5 über den Cache-Test (R406) ab. Parallel rechnete design-economy-designer Python-Simulationen (`bal.py`, `toggle.py`, Events 14:10–14:14), und design-spec-author arbeitete ab 14:20. Der Playtester fragte die Last mehrfach ab (Events 14:04:36, 14:16:08).
- Deutung: Dritter Fall von Leistungsmessung unter Last > 4 (R401 Load 5,8–6,6; B4 der Vorgänger-Retro; R413), damit ein Muster. 5-Why: B5 ungültig ← Last 4,6–4,9 ← paralleles Paket mit Rechenlast ← R411 prüfte Parallelität nur auf Dateien („dateidisjunkt, nur docs/“) ← **die Parallelitätsprüfung kennt CPU-sensible Schritte nicht**. Zugleich hat ein deterministischer Test die AK bereits gedeckt; die Browser-Messung war doppelte Arbeit.

### B6 · Positiv

- Release REL-11 + REL-12 live, CI und Pages grün (R416). Die ganze Kette Brainstorming bis Plan-Freigabe von I-028 lief in 53 min parallel zum Release-Check. Lead-Gates liefen paarweise parallel (14:30, 14:44). Delta-Check durch L0 statt Zweitprüfung (R415/R416).

## Effizienz-Ampel

Quelle: `metrics.py --efficiency` (Historie, 37 Sessions); Session-Werte folgen in der Session-Retro.

| Kennzahl               | Wert (Historie) | Ampel | Befund / Ursache                                                                                                                                                                                                                            | Hebel oder Messauftrag mit Frist                                                                                                              |
| ---------------------- | --------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil       | 50,7 %          | rot   | Beobachtung: bis zum Push 14 `agent_start`, davon 0 Umsetzer (Leads, Design, QA, Integrator). Deutung: Release- und Gate-Strecke ist strukturell Steuerung. Vierte Retro in Folge rot                                                       | Hebel bereits per Ruling: E-049 (R410 V3, Start nach E-046, spätestens 2026-11-12), E-038 ab 2026-10-22; kein neuer Hebel                     |
| Cache-Write 5 min      | 29,1 %          | rot   | Beobachtung: Leads beendeten den Turn wartend und wurden nach > 5 min fortgesetzt: lead-qa 14:04:26 → 14:25:27 (21 min), lead-design 14:06:50 → 14:16:26 und 14:20:29 → 14:29:01. Deutung: Warte-Neuschreibungen wie in der Vorgänger-Retro | E-037 (dritter Datenpunkt aus dieser Session, Bewertung in der Session-Retro), E-042                                                          |
| L0-Kontext Max         | 774k            | rot   | Historienwert aus 29c3791b; Session-Wert erst am Session-Ende                                                                                                                                                                               | Messauftrag studio-coach, Session-Retro fb37ceac: L0-Max gegen die Übergabeschwelle nennen                                                    |
| opus-Anteil            | 71,8 %          | gelb  | Diese Strecke lief nur mit opus-Personas (Leads, Spec, Plan); kein Umsetzer                                                                                                                                                                 | E-038                                                                                                                                         |
| Grösste gelesene Datei | 59,0 KB         | gelb  | Beobachtung: `docs/beobachtungen.md` ist 110 681 B (`wc -c`); ganz gelesen wäre das rot (> 100 KB). Messauftrag der Vorgänger-Retro (Archivieren bei BEOB-AUSW, ≤ 40 KB) ist offen                                                          | Messauftrag lead-production: erledigte Einträge archivieren, Ziel ≤ 40 KB, Frist nächste Session; sonst Hebel-Vorschlag in der nächsten Retro |
| übrige Zeilen          | –               | grün  | –                                                                                                                                                                                                                                           | –                                                                                                                                             |

## Befragung der Leads

- Nicht befragt (adhoc, kein Agentenstart). Quellen: Ruling-Texte, Event-Log und archivierte Briefings.

## Vorschläge

Höchstens 3, nach Hebel sortiert. Eintrag in `experimente.md` erst nach Ruling.

### V1 · Plan-Briefing mit fester Formatzeile; neue AK-Nummern vergibt das Gate-Ruling

- Hypothese: Wenn jedes Plan-Briefing das Format aus `gates.md` (E-010: Index plus Task-Dateien ≤ 10 KB) als feste Zeile nennt und L0 neue AK im Gate-Spec-Ruling selbst nummeriert (statt im Nachtrag), entfallen Format- und AK-Lücken in der Plan-Nacharbeit (B3, B4). Spec-Nachtrag und Plan dürfen weiter parallel laufen.
- Erwartete Einsparung: je Plan ≈ 4–8 min lead-tech-Nacharbeit; ein Teil eines Gate-Laufs.
- Messgrösse: Gate-Plan-Punkte der Klasse „Format E-010“ oder „AK fehlt, weil später vergeben“ = 0 in den nächsten 3 Gate Plan (Ausgang 2 Punkte in R415). Zählung über Ruling-Texte.
- Messbarkeit: Die Punkte bleiben in den Gate-Rulings zählbar, nichts geht verloren.
- Rückfall: Zeile aus der Briefing-Vorlage streichen.
- Aufwand: klein (studio-coach, eine Vorlagenzeile plus ein Satz in `gates.md`).
- Dateien: `docs/studio/templates/briefing.md`, `docs/studio/gates.md`, `docs/studio/CHANGELOG.md` (nur nach Ruling).

### V2 · Prettier-Prüfung beim Commit statt weiterer Pflichtzeile für Doku-Pakete

- Hypothese: Ein Commit-Schritt, der geänderte `*.md`/`*.ts` mit `npx prettier --check` prüft (Git-pre-commit oder PreToolUse-Hook auf `git commit`, vorhandenes Prettier, keine neue Abhängigkeit), fängt unformatierte Doku-Commits unabhängig vom Briefing ab (B1). Eine Briefing-Zeile für Doku-Pakete wäre die dritte Regel dieser Klasse; der mechanische Schritt ersetzt sie.
- Erwartete Einsparung: je Vorfall 1 Integrator-Lauf, 1 Fix-Commit und ein Ruling-Absatz; Push 8 min früher (B1: 14:48 → 14:56).
- Messgrösse: Integrator-Abbrüche mit Ursache Prettier/`make lint` = 0 in den nächsten 5 Push- oder Merge-Gates (Ausgang 1, R416). Die V1-Zählung aus R410 bleibt getrennt nach Code- und Doku-Paketen.
- Messbarkeit: Der Hook schreibt bei Ablehnung eine Zeile ins Event-Log; Abbrüche bleiben zählbar.
- Rückfall: Hook entfernen, stattdessen Pflichtzeile `make docs-check` in jedem Briefing mit Doku-Commit.
- Aufwand: klein bis mittel (production-studio-ops, 1 Start; Hook darf Commits in Worktrees nicht spürbar bremsen, Ziel < 3 s).
- Dateien: `.claude/settings.json` bzw. Hook unter `tools/studio/`, `docs/studio/STUDIO.md`, `docs/studio/CHANGELOG.md` (nur nach Ruling).

### V3 · Leistungs-AK: Browser-Messung streichen, wenn ein deterministischer Test sie deckt

- Hypothese: Wenn eine Leistungs-AK durch einen deterministischen Test belegt ist (wie B5 durch den Cache-Test, R406), entfällt die Browser-Messung im Release-Check. Wo kein Test möglich ist, plant L0 sie nur ohne paralleles Paket mit Rechenlast (B5; drei Fälle).
- Erwartete Einsparung: Lastabfragen und Messläufe des Playtesters sowie BEDENKEN-Urteile nur wegen Last; weniger Konflikt mit parallelen Strängen.
- Messgrösse: Release-Check- oder Merge-Urteile mit „unter Last, formal nicht gültig“ = 0 in den nächsten 3 Release-Checks (Ausgang 1 in R413, dazu R401).
- Messbarkeit: Der Testnachweis steht in der AK-Zuordnung des Plans; die Zählung über Rulings bleibt möglich.
- Rückfall: Browser-Messung wieder für alle Leistungs-AK.
- Aufwand: klein (Satz in `gates.md`/Release-Check-Abschnitt, studio-coach).
- Dateien: `docs/studio/gates.md`, `docs/studio/CHANGELOG.md` (nur nach Ruling).

Empfehlung: V1 annehmen, V2 annehmen (Hook vor Briefing-Zeile), V3 annehmen.

## Bewertung laufender Experimente

- E-037, E-042, E-046: keine Bewertung in dieser Ad-hoc-Retro; die Session-Datei fb37ceac fehlt noch (Session-Retro).
- V1 aus R410: 1 Abbruch der Klasse lint in Gate 1 von 5, im Doku-Paket (B1); für Code-Pakete kein Datenpunkt. V2 aus R410: kein Paket mit neuen Tests in diesem Zeitraum.
