# Was das Studio gelernt hat

<!-- Kuratiert vom studio-coach, höchstens 40 Inhaltszeilen; Veraltetes streichen. -->

- Leads starten Arbeiter immer im Vordergrund (`run_in_background: false`), sonst landet der Arbeiterbericht bei L0 statt beim Lead (ADR-007). Das Agent-Werkzeug eines Subagenten hat den Schalter (Headless-Probe, Retro session-5e248230 B3); `async_launched` unterscheidet Vorder- und Hintergrund nicht, Beleg ist, wer den Bericht erhält.
- Fix-Runden und Rückfragen setzen denselben Agenten per `SendMessage` fort, statt ihn neu zu starten; der Kontext bleibt erhalten.
- Das Modell im Agent-Aufruf explizit setzen; sonst erbt der Agent das Modell der Session.
- Implementierer ändern Dateien mit Edit/Write statt mit Shell-Einzeilern (sed, perl, Heredoc); Einzeiler liessen Agenten hängen (Befund M2). Reine Textgenerierung in Doku per Skript ist ausgenommen (Handbuch 1.7, R75).
- Neue Personas lädt die Datei-Überwachung in laufenden Sessions — ausser `.claude/agents/` fehlte beim Session-Start; dann lädt die Session keine Projekt-Personas, auch nicht nach `/clear`. Rückfall: `general-purpose` mit Kopfzeile `Persona:` und dem Persona-Text im Briefing.
- Die Anzeige „inaktiv" ist bei langen Bash-Aufrufen oder langen Schreibschritten ohne Lebenszeichen erwartbar (Heuristik, kein Fehler; Spec-Autor mit Lücken bis 7,4 min, Retro session-664ac8d3 B1). Eingebaute Agenten (z. B. `web-fetch`) senden kein SubagentStart/-Stop; liegt ein Vordergrund-`spawned` vor, ist „inaktiv" ein Messartefakt (Retro 2026-09-30). Ein Hintergrund-Start aus einem Lead liefert nach dem ersten Heartbeat keine Hook-Events mehr; „Agent unbekannt inaktiv" ist dann ein Artefakt, und sein Aufwand fehlt in der Metrik (Retro session-5e248230 B1).
- Ein roter Pages-Lauf mit „Failed to get ID Token" (`deploy-pages`) ist ein Plattform-Timeout: einmal `gh run rerun`, erst bei Wiederholung untersuchen; der grüne Rerun schliesst `ci:<run>` (Retro 2026-09-30 ci-pages, R58).
- Budgetfreigaben gelten nur in der Session, in der L0 sie loggt: nach `/clear` oder Session-Wechsel neu loggen, sonst zählt der Start in keiner Zeile (Retro 2026-09-30 budget-lead-tech, R58).
- Ein Nutzungslimit beendet die Session ohne Vorwarnung: `state.md` laufend nachführen, nicht erst im Session-Ende; die Übergabe steht nie nur im Chat (Retro session-25e8352d, R66).
- Fragen zum Verhalten des Harness (z. B. ob Persona-Frontmatter Zusatzfelder toleriert) per Headless-Lauf prüfen statt in einer eigenen Nutzersession — dauerte rund 1 min (Retro Studio-Graph B4).
- Subagenten legen Dateien, die wie Berichte heissen (`report.md`), oft nicht ab; der Schlussbericht ist der Report und wird ohnehin archiviert. Weder Guard noch Hook verursachen das (Retro M5 B5).
- Vor einer Übergabe wegen des Kontextwerts einen einzelnen Sprung einmal gegenprüfen (`ts` und `session_id` in `.studio/limits.json`): Veraltete Werte werden noch nicht markiert, der erste Wert nach dem Merge zeigte 77 %, kurz darauf 17 % (R80, Beobachtung Restbefunde Limit-Sensor).
- Ein per SendMessage fortgesetzter Agent bucht allen Aufwand auf seine erste Schätzung und das zuletzt geloggte Paket; Schätzung gegen Ist daher getrennt nach „mit/ohne Fortsetzung" lesen (Retro session-664ac8d3 B2).
- Modellwahl nach Aufgabe; ein näher rückendes Limit ist nie ein Grund für ein schwächeres Modell, L0 fährt herunter (R71, Retro M5 B6).
- Schreibende Git-Proben (revert, merge, reset) nur im Paket-Branch oder einem eigenen Worktree, nie im Haupt-Checkout auf main; vorher `git branch --show-current` (Retro session-5e248230 B6).
- L0 formatiert `docs/studio/state.md` vor jedem Commit mit `npx prettier --write`; sonst wird `make check` auf main rot (Retro session-5e248230 B6).
- Der Session-Container ist ephemer: nur gepushte Branches überleben einen Session-Wechsel. Strang-Branches nach jeder Abnahme nach `origin` pushen (R107; Verlust von A1, A2, R5, X1a, M8-Spec).
- Vor jedem Ruling `git fetch` und die nächste freie R-Nummer prüfen; bei paralleler L0-Session zuerst in „Parallele Sessions" eintragen. Beide Sessions vergaben R107 und R118, Folge: Umnummerierung, Revert, Übergabe R120 (Retro ddd9a9ac B4).
- Cloud-Session: Subagent-Leads haben kein Agent-Werkzeug; L0 startet Arbeiter direkt, Leads nur für Arbeit ohne Delegation (R108, Retro ddd9a9ac B2).
- Kein bares `git stash` bei parallelen Worktrees (gemeinsamer Stash-Stapel); Rot-Nachweis per WIP-Commit oder `git worktree add --detach`. QA-Bäume gehören nur dem laufenden QA-Check (R116, Retro ddd9a9ac B5).
- Software-Rendering (Cloud) misst Frames nicht belastbar: 27 fps bei Render-Median 4 ms; Frame-Abnahmen auf Echtgerät mit GPU, Headless mit `--disable-gpu` (R116, Retro ddd9a9ac B6).
