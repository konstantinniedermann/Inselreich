# Was das Studio gelernt hat

<!-- Kuratiert vom studio-coach, höchstens 40 Inhaltszeilen; Veraltetes streichen. -->

- Leads starten Arbeiter immer im Vordergrund (`run_in_background: false`), sonst landet der Arbeiterbericht bei L0 statt beim Lead (ADR-007).
- Fix-Runden und Rückfragen setzen denselben Agenten per `SendMessage` fort, statt ihn neu zu starten; der Kontext bleibt erhalten.
- Das Modell im Agent-Aufruf explizit setzen; sonst erbt der Agent das Modell der Session.
- Implementierer ändern Dateien mit Edit/Write statt mit Shell-Einzeilern (sed, perl, Heredoc); Einzeiler liessen Agenten hängen (Befund M2).
- Neue Personas lädt die Datei-Überwachung in laufenden Sessions — ausser `.claude/agents/` fehlte beim Session-Start; dann lädt die Session keine Projekt-Personas, auch nicht nach `/clear`. Rückfall: `general-purpose` mit Kopfzeile `Persona:` und dem Persona-Text im Briefing.
- Die Anzeige „inaktiv" ist bei langen Bash-Aufrufen ohne Lebenszeichen erwartbar (Heuristik, kein Fehler). Eingebaute Agenten (z. B. `web-fetch`) senden kein SubagentStart/-Stop; liegt ein Vordergrund-`spawned` vor, ist „inaktiv" ein Messartefakt (Retro 2026-09-30). Gleiches gilt für einen Knoten, der nur `bind`-Events und kein `agent_start` hat (Phantomknoten, Retro ci-pages B3).
- Ein roter Pages-Lauf mit „Failed to get ID Token" (`deploy-pages`) ist ein Plattform-Timeout: einmal `gh run rerun`, erst bei Wiederholung untersuchen. `ci.py` sieht den grünen Rerun nicht; bis zum Fix gilt der Vorfall danach als erledigt (Retro 2026-09-30 ci-pages).
- Die Budget-Anzeige führt je Lead-Rolle nur eine Phase und zählt Kinder aller Sessions: Bei parallelen Sessions überschreibt eine neue Freigabe die fremde. Ein Budget-Vorfall wird deshalb zuerst je Session und Paket nachgezählt, bis der Fix da ist (Retro 2026-09-30 budget-lead-tech).
- Fragen zum Verhalten des Harness (z. B. ob Persona-Frontmatter Zusatzfelder toleriert) per Headless-Lauf prüfen statt in einer eigenen Nutzersession — dauerte rund 1 min (Retro Studio-Graph B4).
- Die Meilenstein-Metrik ordnet Agenten ohne Kopfzeile dem global laufenden Meilenstein zu, auch aus fremden Sessions: Bei parallelen Sessions „Agenten“, „Sessions“ und Ergebnisse je Session nachzählen, bis der Fix da ist (Retro Studio-Graph B3).
