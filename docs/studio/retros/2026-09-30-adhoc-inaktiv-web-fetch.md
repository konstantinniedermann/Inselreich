# Retro adhoc inaktiv-web-fetch — 2026-09-30

- Datum: 2026-09-30
- Art: adhoc
- Auslöser: inaktiv:25e8352d-e7fa-409a-b7b9-7f90fd3d92b0:a40b8c1cfc7352b49
- Datenbasis: `.studio/events.jsonl` (Zeilen 66–71), `tools/studio/model.py` (`touch`, `on_spawned`, `on_agent_stop`, `on_session_end`, Parallelitäts-Spannen), `tools/studio/effort.py` (`quality`, `incidents`), `tools/studio/hook.py` (SubagentStart/-Stop, PostToolUse)

## Befunde

### B1 · Kein Hänger, sondern Messartefakt

- Beobachtung: Der eingebaute Agent `web-fetch` lief im Vordergrund, lieferte sein Ergebnis und war nach rund 31 s fertig. Für ihn gibt es weder `agent_start` noch `agent_stop`; der Vorfall entstand nur, weil das Modell ihn nie schliesst.
- Beleg: `.studio/events.jsonl` — `spawn` (web-fetch, `background:false`) 09:36:47, zwei `heartbeat` (WebFetch) 09:36:49/09:36:51, `spawned` mit `child_id` a40b8c1cfc7352b49 09:37:18; danach arbeitet `main` weiter (Bash 09:37:26). Ein Vordergrund-`spawned` (PostToolUse) entsteht erst nach dem Ende des Kindes. Über alle Events ist a40b8c1cfc7352b49 der einzige abgeschlossene Agent ohne `agent_stop`; die übrigen drei ohne Stopp (lead-production, production-studio-ops, general-purpose) laufen noch.
- Deutung: Eingebaute Agenten wie `web-fetch` lösen hier keine SubagentStart-/SubagentStop-Hooks aus. `on_spawned` (`model.py`) hängt das Kind nur ein und schliesst es nicht → Status bleibt LIVE → nach 300 s «inaktiv».
- Wirkung: ein Fehlalarm und eine Ad-hoc-Retro (ein Coach-Start).

### B2 · Welche Metriken das Artefakt verfälscht

- «Gescheiterte Agenten»: nicht betroffen — der Status wird nie `failed`, nur `active` bzw. bei Session-Ende `ended` (`model.py` `on_session_end`).
- «Agenten mit Lücke»: nicht betroffen — `max_gap` wächst nur in `touch` bei neuen Events des Knotens; nach 09:36:51 kommen keine mehr, die grösste Lücke bleibt bei rund 1,4 s.
- Betroffen ist stattdessen die **Laufzeit/Parallelität**: Ohne `stopped` rechnet `model.py` die Spanne bis `now` bzw. bis Session-Ende (`end = c["stopped"] … else self.now`, offener Lauf in `_runs`). So wird die Laufzeit zu hoch angesetzt, ebenso die Spitzen-Parallelität der Leads, falls ein Lead eingebaute Agenten startet. Zusätzlich fehlen `duration_ms`/`tool_count` im `spawned`-Event; die Aufwandserfassung für diesen Agenten ist also leer.

## Befragung der Leads

- lead-production (S16-01, ad694696ecfead09a): Ja, der Fall ist abgedeckt. Das Kriterium ist allerdings `tool_response.status == "completed"`; hook.py übernimmt diesen Wert neu ins `spawned`-Event. Beim Hintergrund-Start steht dort `async_launched`. Das background-Flag des Spawn-Eintrags spielt keine Rolle. Ist das Kind noch nicht final, setzt `on_spawned` es auf `done`, setzt `stopped = ts` und schliesst mit `close_run` den offenen Lauf. Damit endet die Laufzeit, und es entsteht kein `inaktiv`-Vorfall mehr. Der Fix ist in Arbeit (Branch fix/s16-wartung), das Review folgt.

## Vorschläge

Keine Experimente. Der Fehler ist offensichtlich, und die Behebung läuft bereits als S16-01. Für die Abnahme von S16-01 empfohlen (L0 entscheidet):

- Abnahmekriterium: Ein Test mit genau dieser Event-Folge (`spawn` im Vordergrund, `heartbeat`, `spawned` ohne `agent_start`/`agent_stop`) ergibt `status == "done"`, `stopped` = Zeitpunkt von `spawned`, keinen `inaktiv`-Vorfall und eine Laufzeit von ≈ 31 s.
- Gegenprobe: Ein `spawned` mit `status: async_launched` (Hintergrund) darf das Kind **nicht** schliessen.

## Bewertung laufender Experimente

- nicht Gegenstand dieser Ad-hoc-Retro.

## Änderungen an lernen.md

- geändert: Die Zeile zu «inaktiv» ist um die eingebauten Agenten ergänzt (kein SubagentStart/-Stop; bis S16-01 gilt «inaktiv» nach einem Vordergrund-`spawned` als Messartefakt). Die Zeilenzahl bleibt bei 6.
