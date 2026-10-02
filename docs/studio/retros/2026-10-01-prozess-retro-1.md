# Retro adhoc Prozess-Retro 1 (Effizienz) — 2026-10-01

- Datum: 2026-10-01
- Art: adhoc (erste Prozess-Retro nach R127, Auftrag R128)
- Rolle: `studio-process-coach` (gestartet als `general-purpose` mit Persona-Kopfzeile, siehe B6)
- Zeitraum: M6, M7 inkl. Isometrie, M7-UX-Vorbereitung (R82–R128)
- Auslöser: keine offenen Vorfälle; Nutzerauftrag „interne Prozesse effizienter machen, nicht das Produkt“
- Datenbasis: `docs/studio/rulings.md` (R91–R128), `docs/studio/retros/2026-10-01-meilenstein-m7.md`, `docs/studio/metriken/M7.md`, `metriken/S-2026-10-01-5e248230.md`, `metriken/S-2026-10-01-ddd9a9ac.md`, `docs/studio/experimente.md`, `docs/studio/lernen.md`, `docs/studio/state.md`, `docs/studio/STUDIO.md`, `docs/studio/VERFASSUNG.md` §9/§10, `docs/studio/roster.md`, `git log -150`, `.studio/events.jsonl` (Session 8c0e0295), `.studio/archiv/briefings/`, `.studio/usage/`
- Umfang: ein Start, rund 30 Werkzeugaufrufe. Keine Lead-Befragung (keine Agent-IDs, Archiv reicht).
- Effizienz heisst hier: weniger Agenten-Starts, Werkzeugaufrufe und Limit-Verbrauch je abgenommenem Ergebnis, weniger Wartezeit, keine Doppelarbeit, weniger Übergabe- und Doku-Aufwand.

## Beobachtung

### B1 · Verwaltung gegen Lieferung

- Commits: Von den letzten 150 Commits ohne Merges ändern **70 (47 %) nur Studio-Verwaltung** (`docs/studio/`, `.claude/`, `tools/studio/`, `docs/beobachtungen.md`). 51 davon ändern `state.md` oder `rulings.md`. Nach Präfix: 79 `docs:`, 31 `feat:`, 19 `fix:`, 11 `test:`, 3 `refactor:`.
- Geänderte Zeilen: `docs/studio/` 2 059, `src/` 10 182, `tests/` 11 756, Specs und Pläne 3 983. Die Verwaltung macht rund 7 % der Zeilen aus, aber knapp die Hälfte der Commits.
- Agenten: In M7 kosteten `studio-coach` und `lead-production` zusammen 36,4 von 698,7 min (5,2 %) (`metriken/M7.md`). Die L0-Hauptsession 5e248230 hatte 174 Nachrichten mit 40,9 Mio. Cache-Read-Tokens, die Subagenten derselben Session 339 Mio. (`.studio/usage/5e248230…json`, `metriken/S-2026-10-01-5e248230.md`). L0 macht also rund 11 % aus.
- Starts: M7 hatte 61 Delegationen für 38 Ergebnisse, also 1,6 Starts je Ergebnis. Die Erstabnahme-Quote lag bei 50 %, im Mittel gab es 1,5 Review-Runden (`metriken/M7.md`).

### B2 · Doppelarbeit durch parallele L0-Sessions (M7)

- Die Cloud-Session ddd9a9ac und die lokale Session 5e248230 arbeiteten gleichzeitig an M7. Vier Pakete (A1, A2, R5, X1a) wurden neu umgesetzt. Allein lokal kostete das 7 Agenten, 70,3 min und 157 Werkzeugaufrufe (Retro M7 B1). Die M8-Spec galt als verloren (R107) und war es nicht (R125).
- Für die Abstimmung brauchte es 3 Rulings (Umnummerierung R118, R119, R120) und 1 Revert. Die lokale Welle 2 (R118) wurde auf einem veralteten Stand geplant und durch R119 überholt. Die Doku-Auflage im Final-Review (R123) folgt aus derselben Spaltung.
- Ruling-Nummern kollidierten 3-mal in 2 Episoden (R90, R107, R118).
- Das 5h-Limit ist ein Kontolimit: `.studio/limits.json` führt einen Wert, nicht einen je Session. Zur Zeit dieser Retro steht es bei 81 %.

### B3 · Rebase-Vorfall R124

- Ein Lead committete im Hauptcheckout, während der Integrator dort einen `--no-ff`-Merge machte. Danach lief ein `git pull --rebase`, der den Merge in 39 kopierte Commits linearisierte (R124 (1), Retro M7 B2).
- Das ist kein Einzelfall. In M7 gab es 6 fremde Schreibzugriffe auf geteilte Arbeitsbäume (Retro M7 B2, E-006).

### B4 · Gates: jede Prüfung brauchte genau eine Nacharbeit

- Alle 6 Spec- und Plan-Gates in M6/M7 endeten mit BEDENKEN, einer Nacharbeit und meist einer Zweitprüfung. Kein Gate endete mit ZURÜCK (R82, R87, R83→R84, R93→R95, R96→R98, R122→R124 (4); Retro M7 B5).
- Vorbereitung M7-UX bis zum ersten Code: mindestens 6 archivierte Starts bis Gate Spec (lead-design, design-ux-heuristiker, qa-playtester, design-spec-author, lead-tech, lead-qa; `.studio/archiv/briefings/*` mit `Paket: M7-UX`). Danach folgten Zweitprüfung lead-qa, Plan lead-tech, Gate Plan mit 2 Prüfern (lead-qa, lead-production) und Planpflege. Dazu kamen 4 Rulings (R121, R122, R124 (4), R125). Das Umsetzungsbudget beträgt 36.
- R125 verzichtete bereits auf die Zweitprüfung, ohne erkennbaren Schaden bis jetzt.

### B5 · Umfang des Regelwerks und der Rulings

- Wortzahlen: `rulings.md` 13 547 (1 628 Zeilen, 128 Rulings), `STUDIO.md` 5 575 (689 Zeilen), `experimente.md` 1 724, `VERFASSUNG.md` 1 210, `gates.md` 1 181, `lernen.md` 712. Die Personas haben 426–1 120 Wörter. Insgesamt sind das rund 36 000 Wörter.
- Rulings sind länger geworden: R1–R39 im Mittel 43 Wörter, **R100–R128 im Mittel 156 Wörter** (Maximum R103 mit 288). Allein am 2026-10-01 entstanden 38 Rulings (R91–R128).
- Rulings übernehmen Inhalte anderer Dokumente:
  - R125 (a)–(g) ist Plantext.
  - R120 (1) enthält INT-Messwerte.
  - R124 (1) enthält einen Zeitablauf, der zusätzlich in Retro M7 B2 und im Bericht von lead-production steht.
  - R110, R111, R116 und R117 sind reine Abnahmen ohne Alternative.
- `STUDIO.md` nach Abschnitten:
  - „Messung und Aufwand“: 81 Zeilen.
  - „Verbesserungsschleife“: 82 Zeilen.
  - „Logging-Pflicht“ mit Befehlsreferenz (Z. 568–641): rund 74 Zeilen. Die Personas führen ihre Log-Befehle zusätzlich selbst, z. B. `studio-process-coach.md`, Abschnitt „Bericht und Logging“.
- `experimente.md`: Das Feld „Bewertung“ führt die Zwischenstände fort. Bei E-001 sind das rund 250 Wörter Verlauf, die auch in den Retros stehen.
- Retros: 10 Berichte in 2 Tagen (9 791 Wörter). Diese Retro und die M7-Retro analysieren dieselben zwei Vorfälle (B2, B3).
- Positiv: Der Start-Kontext ist hart begrenzt (`tools/studio/context.py`: `LIMIT = 9500` Zeichen).

### B6 · Persona `studio-process-coach` nicht geladen

- Ablauf in UTC (`.studio/events.jsonl`, Session 8c0e0295):
  - 15:24:14: Commit 339c728 legt `.claude/agents/studio-process-coach.md` an.
  - 15:24:19: lead-production meldet `agent_stop`.
  - 15:24:40: `spawn` mit `subagent_type: studio-process-coach`, kein `spawned`.
  - 15:24:56: Rückfall auf `general-purpose`.
- Auch die Agentenliste dieser Subagent-Session enthält `studio-coach`, aber nicht `studio-process-coach`.
- Der Rückfall-Start wird als Rolle `general-purpose` mit `persona_version: ""` erfasst (`agent_start` a5add9f9a9168c256).
- Herkunft der Gegenaussage in `lernen.md` (Zeile „Neue Personas lädt die Datei-Überwachung …“) und `roster.md` Z. 80–84: Der Plan Studio 1.5 (5fd6c27) hat sie vorgegeben. Er ersetzte dabei den früheren Hinweis „erst in der nächsten Session“. Eine Probe oder ein Beleg dafür ist nicht auffindbar.

### B7 · Laufende und vorgeschlagene Experimente

| Exp.  | Gegenstand                        | Wirkung auf Effizienz                                                                          | Stand                                            |
| ----- | --------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| E-001 | Schätzung aus Richtwerten         | indirekt (Budget plausibel); Schwelle erreicht (−0,3 %)                                        | `behalten` (R126)                                |
| E-002 | Datei-Eigentum paralleler L0      | Schaden lag ausserhalb der Messregel                                                           | `angepasst` → E-005 (R126)                       |
| E-003 | Zweck-Gegenprobe bei Auslegungen  | verhindert Korrektur-Rulings; 0 Korrekturen                                                    | 3. Session liegt jetzt vor (R128 mit Zweck-Satz) |
| E-004 | Rechenweg im Budget-Ruling        | nur Schreibweise; Ausgangsschaden 1 Korrektur-Ruling (R97, 93 Wörter); verlängert Rulings      | laufend (R126)                                   |
| E-005 | Abstimmung paralleler L0 (origin) | trifft den grössten Schaden (B2), aber über 3 Handschritte, u. a. `git fetch` vor jedem Ruling | angenommen (R126)                                |
| E-006 | Exklusive Arbeitsbäume            | trifft B3; Kern gilt schon als Ruling R124 (2) und R125 (e)                                    | wartet auf Platz                                 |

## Deutung

- **B1: Verwaltung bindet L0, keine Agenten.** Die Verwaltung kostet kaum Agentenzeit (5 %), aber fast jeden zweiten Commit. Jeder Verwaltungs-Commit ist für L0 eine Kette aus Lesen, Edit, prettier und Commit. Der grösste Hebel liegt deshalb nicht bei der Zahl der Retros oder der Leads. Er liegt bei (a) vermiedener Doppelarbeit (B2), (b) Starts vor dem ersten Code (B4) und (c) Text, den L0 schreibt und alle Agenten wieder lesen (B5).
- **B2, 5-Why:**
  1. Warum wurden 4 Pakete neu umgesetzt? Die Branches lagen nur lokal.
  2. Warum schadete das? Die Cloud-Session startete in einem frischen Container und kannte nur `origin`.
  3. Warum arbeiteten zwei Sessions gleichzeitig an M7? Keine wusste beim Start von der anderen.
  4. Warum nicht? Der Eintrag „Parallele Sessions“ liegt in einer lokalen Datei. Der Start-Hook liest den lokalen Stand und nicht `origin`.
  5. Warum ist das ein Handprotokoll? E-002 und E-005 setzen auf Disziplin von L0 statt auf ein technisches Signal.

  **Wurzel:** Es gibt kein gemeinsames Signal „L0 ist aktiv“. Dazu kommt: Parallele Sessions teilen dasselbe Kontolimit. Sie gewinnen also nur Wanduhrzeit und keine Kapazität, bezahlen aber mit Abstimmung und Doppelarbeit. Das ist ein Muster (2 Episoden).

- **B3, 5-Why:**
  1. Warum wurde der Merge linearisiert? Im Merge-Fenster lief `pull --rebase` im Hauptcheckout.
  2. Warum dort? Ein Lead committete im geteilten Hauptcheckout.
  3. Warum durfte er? Das Eigentum an Arbeitsbäumen war nicht geregelt.

  **Wurzel:** Der Hauptcheckout ist eine geteilte, schreibbare Ressource. Das ist ein Muster (6 Fälle). R124 (2) und R125 (e) regeln es schon. E-006 würde dieselbe Regel nur noch einmal als Experiment messen.

- **B4: Eine Nacharbeitsquote von 100 % ist kein Prüferfolg, sondern ein Taktmerkmal.** Die Prüffragen von lead-tech und lead-qa stehen vorab in `gates.md`. Die erste Einreichung ist also vorhersehbar unvollständig, und die Zweitprüfung findet in der Regel nichts Neues (R124 (4) OK, R125 ohne). Bei Folgepaketen ohne Architektur- oder Save-Änderung, wie M7-UX, sind Spec-Gate und Plan-Gate zwei Wartestufen für dieselben Prüfer. Verfassung §9 schützt Task-Review, Tests, QA, Lizenz und Final-Review, aber nicht die Zahl der Gates.
- **B5: Das Regelwerk ist für Agenten mit begrenztem Kontext an der Grenze.** Die Verfassung (1 210 Wörter) ist tragbar. `STUDIO.md` mischt Kernablauf (alle) mit Mess- und Verbesserungsdetails (nur Coaches) und einer Befehlsreferenz, die in den Personas doppelt steht. `rulings.md` ist zum Protokoll geworden: Rulings erzählen nach, statt zu entscheiden. Das kostet L0 Ausgabe-Tokens und Lesern Kontext, und es erzeugt doppelte Wahrheiten (der Zeitablauf R124 steht dreifach). `lernen.md` ist mit 25 Zeilen in Ordnung. Retros: Ein Start ist billig (4–6 min), aber jede Retro erzeugt Rulings, Experiment-Text und Handbuch-Minors. Die Pflicht zur Kurz-Retro je Session steht in der Verfassung (§10.2). Ändern könnte sie nur der Nutzer über die Warteschlange, deshalb kommt hier kein Vorschlag.
- **B6: Einzelfall, widerlegt aber eine ungeprüfte Annahme.** Die Zeile in `lernen.md` war nie belegt (Herkunft: Plan, kein Befund) und verstösst gegen die eigene Regel „Harness-Fragen per Headless-Probe“. Wahrscheinliche, aber unbewiesene Ursache: Die Agentenliste wird nur an einer Rundengrenze oder beim Session-Start neu eingelesen und nicht mitten im Zug. Der Schaden ist klein: ein Fehlstart von 16 s und die falsche Rollen-Zuordnung in der Metrik. Die Folge der falschen Zeile ist aber, dass L0 einen Fehlstart einplant, statt direkt den Rückfall zu wählen.
- **B7:** E-004 misst eine Schreibweise und verlängert Rulings, das widerspricht B5. E-005 trifft den richtigen Schaden mit dem teuersten Mittel (Handschritte je Ruling). E-006 ist inhaltlich schon in Kraft. E-003 ist bewertbar: 3 Sessions (5e248230, ddd9a9ac, 8c0e0295) mit 0 Korrekturen wegen Fehlauslegung.

## Vorschläge

Nach Hebel sortiert. Streichen geht vor neuen Regeln. Für die Plätze (höchstens 3 laufend):

- E-003 als `behalten` schliessen.
- E-004 ablehnen.
- E-005 durch V1 ersetzen.
- E-006 bleibt wartend, weil R124 (2) schon wirkt.

Damit laufen **V1, V2 und V3+V4** als ein Experiment. V5 ist eine Fehlerkorrektur (§10.5, ohne Platz). Umsetzung von V2–V5 in **einem** Sammelstart `studio-coach`.

### V1 · Eine aktive L0-Session je Repo, Signal im Start-Hook (ersetzt E-005)

- Änderung:
  - `tools/studio/context.py`: `git fetch -q origin main` mit 5 s Timeout, dann die Zeile `Stand:` aus `origin/main:docs/studio/state.md` lesen. Meldet sie „Session <andere ID> läuft“, kommt ganz oben ein Warnblock: „Andere L0-Session aktiv: nur lesen, beenden oder Übernahme per Ruling“.
  - `STUDIO.md`, „Session-Start“: neuer Punkt 2a. Der erste Commit der Session setzt die Stand-Zeile „Session <id> läuft“ und wird gepusht.
  - Gestrichen werden: der Absatz „Parallele L0-Sessions“ (7 Zeilen), die Tabelle „Parallele Sessions“ in `state.md` und die drei Handschritte von E-005 („fetch vor jedem Ruling“).
  - Bewusste Parallelität nur per Ruling mit getrennten Strängen. Dann gelten R107 (Push-Pflicht) und die E-005-Schritte als Ausnahme-Regel.
- Erwartete Einsparung: Die M7-Episode kostete ≥ 7 Agenten, 70 min und 157 Werkzeugaufrufe Neuumsetzung, 3 Abstimmungs-Rulings, 1 Revert und eine Doku-Auflage. Ausserdem entfällt bei E-005 ein `git fetch` je Ruling (38 an einem Tag). Keine Kapazität geht verloren, weil das Kontolimit ohnehin geteilt ist.
- Messgrösse: Bis Ende M8 0 Minuten Überlappung zweier L0-Sessions ohne Ausnahme-Ruling (überlappende Lebenszeiten in `.studio/events.jsonl`) und 0 Ereignisse der E-005-Klassen (a)–(c). Anwendung: ein Test in `tools/studio/tests/` belegt den Warnblock.
- Rückfall: Handbuch 1.8, Abschnitt „Session-Start und -Ende“ (E-002-Absatz) und `state.md` mit Tabelle; E-005 in der Fassung `experimente.md` @ 339c728.
- Aufwand: rund 20 Zeilen Python, 1 Test, 3 Zeilen Handbuch. 1 Start (Werkzeug), Handbuchteil im Sammelstart.

### V2 · Ein kombiniertes Gate für Folgepakete

- Änderung:
  - `STUDIO.md`, „Prozessstufen“: Die Stufe **leicht** gilt auch für Folgepakete eines laufenden oder abgeschlossenen Meilensteins ohne Save-Format- oder Architekturänderung und mit einem Strang (Beispiel M7-UX), unabhängig von der Paketzahl.
  - Spec und Plan stehen in **einem** Dokument (Plan als Schlussabschnitt). Ein Gate mit lead-tech und lead-qa läuft parallel, Budget und Ownership prüft L0 selbst (wie bisher bei leicht).
  - Auf BEDENKEN folgt eine Nacharbeit **ohne** Zweitprüfung. Eine Zweitprüfung gibt es nur bei einem blockierenden Punkt oder ZURÜCK.
  - `gates.md`: Zeile „Spec/Plan kombiniert“ um lead-tech ergänzen.
  - §9 bleibt unberührt: Review je Task, QA, Final-Review.
- Erwartete Einsparung je Folgepaket: rund 3 Starts (Gate Plan mit 2 Prüfern und eine Zweitprüfung), 1–2 Rulings und eine Wartestufe. Bei M7-UX wären das rund 8 % des Umsetzungsbudgets gewesen.
- Messgrösse: Starts vom Paketstart bis zum ersten Umsetzungs-Commit, Fortsetzungen eingerechnet (Zählung der `spawn`-Events je Paket), mindestens 3 unter dem Ausgangswert M7-UX. Den Ausgangswert zählt der Coach einmal aus `events.jsonl`. Qualitäts-Gegenprobe: Erstabnahme-Quote der Umsetzung ≥ 50 % (M7) und höchstens 1 Task-Review-BEDENKEN je Paket mit Ursache „Spec- oder Plan-Lücke“.
- Rückfall: `STUDIO.md` 1.8 „Prozessstufen“ und `gates.md` @ 339c728.
- Aufwand: rund 10 Zeilen Handbuch, 1 Zeile `gates.md`, im Sammelstart.

### V3 · Rulings entscheiden nur und verweisen

- Änderung:
  - `templates/ruling.md` und `STUDIO.md`, „Gates und Dokumentation“: Ein Ruling ist der Entscheid in 1–3 Sätzen plus Pfad zum Bericht, Plan oder zur Retro, mit dem Richtwert **≤ 60 Wörter**.
  - Nicht mehr ins Ruling gehören Listen aus Gate-Berichten, Planpflege-Punkte, Messwerte und Zeitabläufe. Sie stehen schon im Archiv-Bericht oder im Plan.
  - Abnahmen ohne Alternative (Typ R110, R111, R116, R117) werden nur per `log.py result` erfasst und nicht als Ruling.
  - R1–R99 ziehen mechanisch nach `docs/studio/rulings-archiv.md` um. Es gibt keine Links `rulings.md#…` im Repo (grep: 0).
- Erwartete Einsparung: rund 60 % Ruling-Text (R100–R128: 4 512 → ≤ 1 800 Wörter) und rund 4–6 Rulings weniger je Meilenstein. `rulings.md` für die laufende Arbeit sinkt von 13 547 auf unter 5 000 Wörter. Weniger Doppelwahrheiten.
- Messgrösse: Mittel ≤ 80 Wörter je Ruling im nächsten Meilenstein (Zählskript wie in dieser Retro) und 0 reine Abnahme-Rulings. Gegenprobe: 0 Retro-Befunde „Information fehlte im Ruling“.
- Rückfall: `templates/ruling.md` und `STUDIO.md` @ 339c728; Archiv zurück in `rulings.md`.
- Aufwand: 2 Dateien mit je ≤ 5 Zeilen, ein mechanischer Umzug, im Sammelstart.

### V4 · Handbuch-Kern und Experiment-Bestand straffen

- Änderung:
  - `STUDIO.md`: „Messung und Aufwand“ (81 Zeilen) und „Verbesserungsschleife“ (82 Zeilen) ziehen nach `docs/studio/verbesserung.md` um. Diese Datei lesen nur die Coaches und L0 bei Retros.
  - Die Befehlsreferenz unter „Logging-Pflicht“ (Z. 568–641) wird gestrichen und durch einen Verweis auf `python3 tools/studio/log.py --help` und die Personas ersetzt.
  - Ziel: Kern ≤ 400 Zeilen, als Prüfung in `tools/studio/tests/test_docs.py`.
  - `experimente.md`: „Bewertung“ wird je Experiment auf eine Zeile gekürzt (Stand und Link auf die Retro). E-001, E-002 und E-003 kommen in einen Abschnitt „Abgeschlossen“ mit je einer Zeile. E-004 wird `abgelehnt`, E-005 durch V1 ersetzt, E-006 bleibt wartend.
- Erwartete Einsparung: `STUDIO.md` rund −40 % (etwa 2 200 Wörter ≈ 3 000 Tokens) für jeden Leser, `experimente.md` rund −50 %. Experiment-Plätze werden frei für V1 und V2.
- Messgrösse: `STUDIO.md` ≤ 400 Zeilen und `experimente.md` ≤ 900 Wörter. Die Wirkung wird nur berichtet: Cache-Write-Tokens je Delegation in der nächsten Meilenstein-Metrik gegen M7 (18 578 672 / 61 ≈ 305 000).
- Rückfall: `git show 339c728:docs/studio/STUDIO.md` und `git show 339c728:docs/studio/experimente.md`.
- Aufwand: Umzug und Streichung ohne neue Regel, im Sammelstart (zusammen mit V2, V3, V5 ≤ 35 Werkzeugaufrufe).

### V5 · Annahme zum Persona-Laden korrigieren (Fehlerkorrektur)

- Änderung: Die Zeile „Neue Personas lädt die Datei-Überwachung …“ in `lernen.md` und Schritt 3 in `roster.md` (Z. 80–84) werden ersetzt durch: „Eine neu angelegte Persona ist in der laufenden Session nicht verlässlich als Agent-Typ verfügbar (Befund 8c0e0295: Fehlstart 26 s nach dem Commit). Im selben Zug direkt `general-purpose` mit Kopfzeile `Persona:` und dem Auftrag ‚Persona-Datei zuerst lesen‘ starten; regulär ab der nächsten Session.“ Optional prüft eine Headless-Probe (≈ 1 min), ob eine neue Nutzerrunde reicht.
- Erwartete Einsparung: 1 Fehlstart je Onboarding-Session. Wichtiger: Die Rolle wird geplant und nicht zufällig auf `general-purpose` gebucht.
- Messgrösse: 0 `spawn` ohne `spawned` (unbekannter Agent-Typ) nach einem Onboarding, Zählung in `.studio/events.jsonl`.
- Rückfall: `lernen.md` und `roster.md` @ 339c728.
- Aufwand: 2 Zeilen, im Sammelstart.

## Befunde ausserhalb Scope

- `metriken/*`: Die Zeile `studio-director` zählt 811 bzw. 812 „Agenten“ (Eintrag schon in `docs/beobachtungen.md`, Z. 549). Ein Ursachenhinweis aus dieser Session: `agent_stop`-Events ohne vorheriges `spawn` mit Zusammenfassungen wie „Classifying commits in git log“ (agent_id a50f1aef892ea6b1e u. a.). Vermutlich sind das Hilfsaufrufe des Harness. Ein Hinweis für den Eintrag, kein neuer Eintrag.

## Bewertung laufender Experimente

- E-003: 3 von 3 Sessions mit Auslegung (5e248230, ddd9a9ac, 8c0e0295/R128), 0 Korrekturen wegen Fehlauslegung, Schwelle 0 erreicht → Empfehlung `behalten` (V4).
- E-004: Empfehlung `abgelehnt` vor dem ersten Prüffall, siehe B7 und Deutung.
- E-005: Empfehlung, ihn durch V1 zu ersetzen.

## Änderungen an lernen.md

- keine durch diese Retro. V5 ist ein Vorschlag an L0, die Umsetzung macht `studio-coach`.
