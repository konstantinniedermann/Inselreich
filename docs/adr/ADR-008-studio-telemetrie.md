# ADR-008: Studio-Telemetrie über Hooks, JSONL und ein Dashboard aus der Standardbibliothek

Status: akzeptiert · Datum: 2026-09-30

## Kontext

Der Nutzer will live sehen, wer im Studio (ADR-007) gerade woran arbeitet, wer hängt und wie viel
Budget verbraucht ist. Dieser Live-Status darf nicht von der Disziplin der Agenten abhängen: Ein
Agent, der das Loggen vergisst oder abstürzt, muss trotzdem sichtbar sein.

Claude Code liefert Hooks für Session-Start/-Ende, Prompts, Turn-Ende, Subagent-Start/-Stop und
jeden Tool-Aufruf; Tool-Hooks feuern auch in Subagenten und tragen `agent_id` und `agent_type`.
Ein Eltern-Feld fehlt, lässt sich aber aus `PreToolUse(Agent)` → `SubagentStart` →
`PostToolUse(Agent)` rekonstruieren. Ein Agent kennt seine eigene `agent_id` nicht.

Vorbild für die Form ist disler/claude-code-hooks-multi-agent-observability (Hooks → Server →
Live-UI mit Event-Feed, Aktivitäts-Puls, Session-Filter). Das Repo hat keine Lizenz; übernommen
wird nur die Idee (siehe `docs/studio/herkunft.md`). Projektregel: keine neuen Abhängigkeiten
(ADR-001 gilt fürs Spiel; fürs Studio: nur Python-Standardbibliothek und reines HTML/CSS/JS).

## Optionen

1. **disler-Architektur:** Hooks senden per HTTP-POST an einen Server, Speicherung in SQLite,
   Push per WebSocket, Oberfläche mit Bun und Vue.
2. **JSONL + Standardbibliothek:** Hooks hängen je Event eine JSON-Zeile an eine Datei an; ein
   Python-Server liest die Datei, berechnet den Zustand und liefert ihn als JSON; ein statisches
   Dashboard pollt.

## Entscheidung

Option 2.

- **R5:** Hooks (`tools/studio/hook.py`) und `tools/studio/log.py` schreiben append-only nach
  `.studio/events.jsonl` im Hauptrepo (auch aus Worktrees); `model.py` leitet daraus den Zustand
  ab; `server.py` liest nur. Kein HTTP-POST aus Hooks, keine Datenbank. Hooks werfen nie und
  blockieren nie.
- **R6:** Das Dashboard pollt `GET /api/state` alle 2 s statt WebSocket.
- Automatisch aus Hooks: Start/Stop, Eltern-Kind-Links, Heartbeat bei jedem Tool-Aufruf, Zählung
  der L2-Starts je Lead. Explizit per `log.py`: Status, Budget, Pakete, Entscheide.
- Server bindet nur an `127.0.0.1` (Standard-Port 8765), keine schreibenden Endpunkte; alle Daten
  werden im Browser per `textContent` gesetzt.

## Konsequenzen

- Hooks funktionieren ohne laufenden Server; das Dashboard kann jederzeit nachträglich gestartet
  werden und zeigt die ganze Session.
- Keine neuen Pakete; Tests laufen mit `unittest` in `make check` (R8).
- **Grenzen:**
  - Kein Heartbeat während langer Denkphasen ohne Tool-Aufruf; solche Agenten können nach
    `STUDIO_INACTIVE_SECONDS` (Standard 300) fälschlich als inaktiv erscheinen. Ausnahmen: `idle`
    und Knoten mit aktiven Kindern (R9).
  - Ein Agent kennt seine ID nicht. Explizite `log.py`-Events ordnet eine Heuristik zu: Der Hook
    sieht den `log.py`-Aufruf mit `agent_id` (`bind`), sonst gilt der zuletzt gestartete Knoten
    gleicher Rolle. Deshalb `log.py` immer als eigenen Bash-Aufruf ausführen.
  - Die Datei wächst stetig → Archivieren mit `make studio-archive`.
  - Nur lokal: kein Zugriff von anderen Geräten, keine Mehrbenutzer-Sicht.
  - 2 s Verzögerung im Dashboard.
  - Datenschutz: `events.jsonl` speichert die erste Zeile von Nutzer-Prompts (≤ 120 Zeichen) und
    Abschlussmeldungen von Agenten (≤ 600 Zeichen) im Klartext; lokal und gitignored. Archivieren
    oder löschen mit `make studio-archive`.
