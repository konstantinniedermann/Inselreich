# Inselreich — Claude Code Kontext

> Gemeinsame Arbeitsregeln in `../CLAUDE.md`. Für alle Aktionen → `make help`.

## Über das Projekt

Aufbau-Strategiespiel im Stil von Anno 1602 im Browser (TypeScript, Canvas 2D). Eigener Titel, eigene Spielwerte;
Grafik und Audio eigen oder offen lizenziert mit Nachweis (ADR-006).

## Arbeitsweise: Studio

- Die Hauptsession in diesem Repo ist immer der **Studio-Direktor (L0)** nach `docs/studio/STUDIO.md`.
  L0 macht keine inhaltliche Arbeit selbst, sondern setzt Leads ein (`.claude/agents/lead-*`).
- **Session-Start** (zusätzlich zur gemeinsamen Start-Routine in `../CLAUDE.md`; Details: `docs/studio/STUDIO.md`, Abschnitt «Session-Start und -Ende»):
  1. `docs/studio/STUDIO.md` und `docs/studio/state.md` lesen.
  2. `make studio` ausführen und dem Nutzer die Dashboard-URL nennen (der Browser öffnet sich beim ersten Subagenten-Start automatisch).
  3. In wenigen Zeilen Stand, laufende Arbeit, offene Entscheide und Budgetstand zeigen.
  4. Auf den Auftrag warten oder den laufenden Plan fortsetzen.
- **Session-Ende:** laufende Agenten abschliessen oder pausieren und loggen; `docs/studio/state.md`
  nachführen; Kurzbericht an den Nutzer.

## Architektur-Regeln

- `src/sim/` ist DOM-frei und deterministisch; Welt-Zustand ist ein JSON-fähiges Objekt (ADR-002).
- Sim-Aktionen werfen nicht; sie liefern `{ ok, reason }`.
- Spielwerte nur in `src/sim/defs/`, nirgends hart im Code.
- Keine Laufzeit-Abhängigkeiten (ADR-001).

## Test-Strategie

Vitest gegen `src/sim/` und reine Mathematik in `src/render/` (Kamera). Renderer und UI werden manuell im Browser geprüft.
Der Balancing-Test (`tests/sim/balance.test.ts`) ist Regressionsschutz für die Spielwerte: Jede Änderung in `src/sim/defs/` muss ihn grün lassen.

## Context-Scopes

| Scope       | Pfade                                                                                      | Wann verwenden                            |
| ----------- | ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Sim         | `src/sim/`, `tests/`                                                                       | Spielregeln, Balancing, Bugs in der Logik |
| Render      | `src/render/`, `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/defs/`, `src/sim/noise.ts` | Darstellung, Kamera                       |
| UI          | `src/ui/` (inkl. `src/ui/storage.ts`), `index.html`, `src/style.css`                       | Bedienung, Layout, Speichern/Laden        |
| Studio      | `docs/studio/`, `.claude/agents/`, `tools/studio/`                                         | Arbeitsweise, Personas, Dashboard         |
| Vollständig | alles                                                                                      | Architektur, Querschnitt                  |

## Dokumentation

- Einstieg: `docs/index.md`; Architektur nach arc42 in `docs/arc42.md` — bei Änderungen an Modulen, Tick-Ablauf oder Persistenz mitführen.
- Spec: `docs/superpowers/specs/`, Pläne: `docs/superpowers/plans/`, ADRs: `docs/adr/`
- Spielanleitung im `README.md` — bei Änderungen an Bedienung oder Spielwerten mitführen.
- Befunde ausserhalb des Scopes: `docs/beobachtungen.md`
