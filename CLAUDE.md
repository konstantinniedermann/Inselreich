# Inselreich — Claude Code Kontext

> Gemeinsame Arbeitsregeln in `../CLAUDE.md`. Für alle Aktionen → `make help`.

## Über das Projekt

Aufbau-Strategiespiel im Stil von Anno 1602 im Browser (TypeScript, Canvas 2D). Eigener Titel, eigene Spielwerte;
Grafik und Audio eigen oder offen lizenziert mit Nachweis (ADR-006).

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
| Vollständig | alles                                                                                      | Architektur, Querschnitt                  |

## Dokumentation

- Einstieg: `docs/index.md`; Architektur nach arc42 in `docs/arc42.md` — bei Änderungen an Modulen, Tick-Ablauf oder Persistenz mitführen.
- Spec: `docs/superpowers/specs/`, Pläne: `docs/superpowers/plans/`, ADRs: `docs/adr/`
- Spielanleitung im `README.md` — bei Änderungen an Bedienung oder Spielwerten mitführen.
- Befunde ausserhalb des Scopes: `docs/beobachtungen.md`
