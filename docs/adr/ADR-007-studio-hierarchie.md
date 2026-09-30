# ADR-007: Studio-Hierarchie mit nativen, verschachtelten Subagenten

Status: akzeptiert · Datum: 2026-09-30

## Kontext

Die Arbeit an Inselreich soll ein virtuelles Studio mit drei Ebenen übernehmen: Die Hauptsession
ist der Studio-Direktor (L0) und spricht als einzige mit dem Nutzer; fünf Leads (L1) steuern ihre
Bereiche; Arbeiter (L2) setzen um. Berichte laufen L2 → L1 → L0, damit der Kontext von L0 klein
bleibt.

Kurztests mit Claude Code 2.1.285 (headless, isoliertes Testprojekt, Hooks protokollieren jedes
Event) ergaben:

- **Verschachtelung geht.** Main → `test-lead` → `test-worker` lief, sofern `Agent` in den `tools`
  des Leads steht. Laut Doku sind 3 Ebenen unter Main möglich
  (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), 20 gleichzeitig.
- **Berichtsweg nur im Vordergrund.** Subagenten laufen standardmässig im Hintergrund. Ein Lead,
  der nicht wartet, beendet sich, und die Meldung des Arbeiters landet bei Main. Mit
  `run_in_background: false` blockiert der Lead, erhält das Ergebnis selbst, und Main sieht nur den
  Lead-Bericht (Test mit 20-s-Arbeiter).
- **L1 als eigene headless Sessions** (`claude -p` im Worktree) ist möglich und lädt Projekt-Hooks
  und Agents; Steuerung, Berichtsweg und Kosten sind aber schwerer zu kontrollieren.
- **Agent Teams** (experimentell) kennen keine verschachtelten Teams und passen nicht zu drei
  Ebenen.
- **Fortsetzen geht.** `SendMessage` an einen bereits beendeten Subagenten setzt ihn mit vollem
  Kontext fort (in der Setup-Session für Fix-Runden genutzt).
- Die Hauptsession als eigener Agent (`"agent"` in settings) ersetzt den Standard-Systemprompt von
  Claude Code (R4) — L0 wird deshalb über `CLAUDE.md` und `docs/studio/STUDIO.md` geführt.

## Optionen

1. **Nativ:** L0 startet Leads als Subagenten, Leads starten Arbeiter als Subagenten im
   Vordergrund.
2. **A — Leads als eigene Sessions:** L0 startet je Lead eine headless Session im Worktree;
   Austausch über Dateien bzw. Cross-Session-Messaging.
3. **B — flach mit Briefing-Dateien:** Leads schreiben Briefings nach `.studio/handoffs/`, L0
   startet jeden Arbeiter selbst (1:1), Ergebnisse gehen an L0 und von dort an den Lead.
4. **Agent Teams:** mehrere Sessions mit gemeinsamer Aufgabenliste.

## Entscheidung

**Nativ**, mit der **Vordergrund-Regel**: L0 darf Leads im Hintergrund starten; Leads starten
Arbeiter immer mit `run_in_background: false`; Parallelität entsteht durch mehrere Agent-Aufrufe
in derselben Nachricht; Arbeiter haben kein `Agent`-Tool und starten keine Agenten.

**Rückfall B.** Auslöser: Verschachtelung oder Vordergrund-Warten funktioniert nach einem
Claude-Code-Update nicht mehr → L1 schreibt Briefings nach `.studio/handoffs/`, L0 startet 1:1.
Personas, Briefing-Standard und Telemetrie bleiben dabei unverändert; nur der Startweg ändert sich.

## Konsequenzen

- Genutzt wird eine Tiefe von 2 der möglichen 3 Ebenen unter Main; eine Reserve bleibt.
- Parallelität gibt es nur innerhalb eines Leads per Mehrfachaufruf; ein Lead blockiert, bis alle
  seine Arbeiter fertig sind. Parallele Leads startet L0.
- Der Kontext von L0 bleibt klein, weil nur Lead-Berichte (≤ ~15 Zeilen) zurückkommen.
- Ein beendeter Agent lässt sich per `SendMessage` fortsetzen; sein Kontext bleibt vollständig
  erhalten (in der Setup-Session für Fix-Runden erprobt). Fix-Runden und Rückfragen — auch der
  Brainstorming-Dialog zwischen L0 und Design-Lead — laufen deshalb als Fortsetzung desselben
  Agenten; nur ein neuer Agent-Start verliert den Kontext.
- Querabstimmung zwischen Leads läuft über Übergabedokumente, damit Ergebnisse unabhängig vom
  Kontext eines einzelnen Agenten nachlesbar bleiben.
- Das Verhalten hängt an Claude-Code-Interna (Hintergrund-Standard, Tiefenlimit). Nach Updates den
  Berichtsweg im Dashboard prüfen; bei Bruch greift Rückfall B.
