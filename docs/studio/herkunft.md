# Herkunft übernommener Bausteine

Das Studio übernimmt Ideen und Strukturen aus fremden Projekten. Übernommene Skills, Personas und
Prozessbausteine sind ausführbare Anweisungen an Agenten; deshalb ist ihre Herkunft hier mit
Lizenz und Stand festgehalten.

**Regel:** Upstream-Änderungen werden nie blind nachgezogen. Eine neue Upstream-Fassung wird
gelesen, bewertet und nur als eigene, angepasste Änderung übernommen (mit neuem Commit-Stand in
dieser Tabelle).

## Quellen

| Kürzel | Projekt                                                                                                              | Lizenz           | Stand                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------- |
| CCGS   | Claude Code Game Studios, <https://github.com/Donchitos/Claude-Code-Game-Studios>                                    | MIT              | Commit `b21fa0f7f289fc3e726cf36fb12b9bc1e7a51e4d` |
| disler | claude-code-hooks-multi-agent-observability, <https://github.com/disler/claude-code-hooks-multi-agent-observability> | **keine Lizenz** | gelesen 2026-09-30                                |

**MIT-Hinweis CCGS:** „Copyright (c) 2026 Donchitos". Die MIT-Lizenz erlaubt Nutzung und
Bearbeitung mit Nennung des Copyright-Vermerks und des Lizenztexts. Übernommen sind nur
Struktur und Ideen, auf Deutsch neu formuliert und gekürzt.

**disler:** Ohne Lizenz gilt das volle Urheberrecht. Übernommen ist **nur die Idee, kein Code** —
die Technik ist bewusst eine andere (siehe [ADR-008](../adr/ADR-008-studio-telemetrie.md)).

## Bausteine

| Baustein                     | Quelle | Lizenz       | Commit/Version | Was übernommen                                                                                                                                                                                                                                                                   | Was angepasst                                                                                                                                                                        |
| ---------------------------- | ------ | ------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gate-Prüfungen               | CCGS   | MIT          | `b21fa0f`      | Aufbau der `.claude/docs/director-gates/*.md`: prüfende Rolle mit Modellstufe, Auslöser, Kontext, Prüffragen, dreistufiges Urteil                                                                                                                                                | Auf Deutsch neu geschrieben; vier Gates statt vieler; Fragen für Inselreich (Säulen, Determinismus, Save-Format, Balancing-Test, Ownership, Budget, Lizenzen) → [gates.md](gates.md) |
| Persona-Texte                | CCGS   | MIT          | `b21fa0f`      | Haltung, Qualitätsmassstäbe und Prüffragen aus `producer`, `game-designer`, `economy-designer`, `systems-designer`, `technical-director`, `lead-programmer`, `qa-lead`, `qa-tester`, `art-director`, `audio-director`, `gameplay-programmer`, `ui-programmer`, `release-manager` | Gekürzt, auf Web/TypeScript/Canvas und die Projektregeln umgeschrieben, keine Engine-Bezüge, ohne „frage vor jedem Schreiben" → `.claude/agents/`                                    |
| Subagent-Protokoll           | CCGS   | MIT          | `b21fa0f`      | Idee aus `log-agent.sh` / `log-agent-stop.sh`: Subagent-Start und -Stop per Hook protokollieren                                                                                                                                                                                  | Neu in Python (Standardbibliothek) als `tools/studio/hook.py`, mit Eltern-Kind-Zuordnung und Heartbeat                                                                               |
| Zustand gegen Kontextverlust | CCGS   | MIT          | `b21fa0f`      | Idee aus `pre-compact.sh` / `post-compact.sh` und `session-state/active.md`: Erinnerung nach Kompaktierung, Zustandsdatei                                                                                                                                                        | SessionStart-Hook gibt Rolle L0 und Lesehinweis aus; Zustandsdatei ist [state.md](state.md), von L0 gepflegt                                                                         |
| Prozess-Leichtigkeit         | CCGS   | MIT          | `b21fa0f`      | Lehre aus der Rigor-Messung: schwerer Prozess brachte kein besseres Spiel                                                                                                                                                                                                        | Zwei Prozessstufen leicht/voll (R2) in [STUDIO.md](STUDIO.md)                                                                                                                        |
| Koordinationsregeln          | CCGS   | MIT          | `b21fa0f`      | Ideen aus `coordination-rules.md` (vertikale Delegation, Eskalation an gemeinsame Elternstufe, parallele Aufrufe) und `COLLABORATIVE-DESIGN-PRINCIPLE.md` (Frage → Optionen → Empfehlung)                                                                                        | Eigene Formulierung in STUDIO.md „Kommunikation" und „Was den Nutzer betrifft"                                                                                                       |
| Playtest-Report              | CCGS   | MIT          | `b21fa0f`      | Idee eines strukturierten Playtest-Berichts                                                                                                                                                                                                                                      | Eigene Vorlage [templates/playtest-report.md](templates/playtest-report.md) für Headless-Chrome-Checks                                                                               |
| Dashboard-Form               | disler | keine Lizenz | —              | **Nur Idee:** Hooks → lokaler Server → Live-Oberfläche; Event-Feed, Aktivitäts-Puls, Filter nach Session                                                                                                                                                                         | Eigene Umsetzung ohne fremden Code: JSONL statt HTTP-POST und SQLite, Polling statt WebSocket, Standardbibliothek und reines HTML/CSS/JS statt Bun/Vue (ADR-008)                     |
