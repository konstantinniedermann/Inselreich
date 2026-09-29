# Inselreich — Claude Code Kontext

> Gemeinsame Arbeitsregeln in `../CLAUDE.md`. Für alle Aktionen → `make help`.

## Über das Projekt

Aufbau-Strategiespiel im Stil von Anno 1602 im Browser (TypeScript, Canvas 2D). Eigener Titel,
eigene Grafik, eigene Spielwerte (ADR-004).

## Architektur-Regeln

- `src/sim/` ist DOM-frei und deterministisch; Welt-Zustand ist ein JSON-fähiges Objekt (ADR-002).
- Sim-Aktionen werfen nicht; sie liefern `{ ok, reason }`.
- Spielwerte nur in `src/sim/defs/`, nirgends hart im Code.
- Keine Laufzeit-Abhängigkeiten (ADR-001).

## Test-Strategie

Vitest gegen `src/sim/` und reine Mathematik in `src/render/` (Kamera). Renderer und UI werden manuell im Browser geprüft.

## Context-Scopes

| Scope       | Pfade                                                                                      | Wann verwenden                            |
| ----------- | ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Sim         | `src/sim/`, `tests/`                                                                       | Spielregeln, Balancing, Bugs in der Logik |
| Render      | `src/render/`, `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/defs/`, `src/sim/noise.ts` | Darstellung, Kamera                       |
| UI          | `src/ui/`, `index.html`, `src/style.css`                                                   | Bedienung, Layout                         |
| Vollständig | alles                                                                                      | Architektur, Querschnitt                  |

## Dokumentation

- Spec: `docs/superpowers/specs/`, Pläne: `docs/superpowers/plans/`, ADRs: `docs/adr/`
- Befunde ausserhalb des Scopes: `docs/beobachtungen.md`
