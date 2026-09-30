# Was das Studio gelernt hat

<!-- Kuratiert vom studio-coach, höchstens 40 Inhaltszeilen; Veraltetes streichen. -->

- Leads starten Arbeiter immer im Vordergrund (`run_in_background: false`), sonst landet der Arbeiterbericht bei L0 statt beim Lead (ADR-007).
- Fix-Runden und Rückfragen setzen denselben Agenten per `SendMessage` fort, statt ihn neu zu starten; der Kontext bleibt erhalten.
- Das Modell im Agent-Aufruf explizit setzen; sonst erbt der Agent das Modell der Session.
- Implementierer ändern Dateien mit Edit/Write statt mit Shell-Einzeilern (sed, perl, Heredoc); Einzeiler liessen Agenten hängen (Befund M2).
- Neue Personas lädt die Datei-Überwachung in laufenden Sessions — ausser `.claude/agents/` fehlte beim Session-Start; dann lädt die Session keine Projekt-Personas, auch nicht nach `/clear`. Rückfall: `general-purpose` mit Kopfzeile `Persona:` und dem Persona-Text im Briefing.
- Die Anzeige „inaktiv" ist bei langen Bash-Aufrufen ohne Lebenszeichen erwartbar (Heuristik, kein Fehler). Eingebaute Agenten (z. B. `web-fetch`) senden kein SubagentStart/-Stop; liegt ein Vordergrund-`spawned` vor, ist „inaktiv" ein Messartefakt (Retro 2026-09-30).
- Ein roter Pages-Lauf mit „Failed to get ID Token" (`deploy-pages`) ist ein Plattform-Timeout: einmal `gh run rerun`, erst bei Wiederholung untersuchen; der grüne Rerun schliesst `ci:<run>` (Retro 2026-09-30 ci-pages, R58).
- Budgetfreigaben gelten nur in der Session, in der L0 sie loggt: nach `/clear` oder Session-Wechsel neu loggen, sonst zählt der Start in keiner Zeile (Retro 2026-09-30 budget-lead-tech, R58).
- Ein Nutzungslimit beendet die Session ohne Vorwarnung: `state.md` laufend nachführen, nicht erst im Session-Ende; die Übergabe steht nie nur im Chat (Retro session-25e8352d, R66).
- Fragen zum Verhalten des Harness (z. B. ob Persona-Frontmatter Zusatzfelder toleriert) per Headless-Lauf prüfen statt in einer eigenen Nutzersession — dauerte rund 1 min (Retro Studio-Graph B4).
- Subagenten legen Dateien, die wie Berichte heissen (`report.md`), oft nicht ab; der Schlussbericht ist der Report und wird ohnehin archiviert. Weder Guard noch Hook verursachen das (Retro M5 B5).
- Modellwahl nach Aufgabe; ein näher rückendes Limit ist nie ein Grund für ein schwächeres Modell, L0 fährt herunter (R71, Retro M5 B6).
