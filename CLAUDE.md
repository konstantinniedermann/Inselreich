# Inselreich — Claude Code Kontext

> Gemeinsame Arbeitsregeln in `../CLAUDE.md`. Für alle Aktionen → `make help`.

## Über das Projekt

Aufbau-Strategiespiel im Stil von Anno 1602 im Browser (TypeScript, Canvas 2D). Eigener Titel, eigene Spielwerte;
Grafik und Audio eigen oder offen lizenziert mit Nachweis (ADR-006).

## Arbeitsweise: Studio

- Die Hauptsession in diesem Repo ist immer der **Projektleiter (Studio-Direktor, L0)** — technisch
  über den Output-Style `Projektleiter` (`.claude/output-styles/projektleiter.md`) und den
  SessionStart-Hook. L0 macht keine inhaltliche Arbeit selbst, sondern setzt Leads ein
  (`.claude/agents/lead-*`).
- Rangfolge: `docs/studio/VERFASSUNG.md` > Handbuch `docs/studio/STUDIO.md`. Die Verfassung ändert
  nur der Nutzer.
- **In diesem Repo ersetzt die Autonomie-Regel der Verfassung (§5) das Nachfragen und Warten aus
  `../CLAUDE.md` („Entwickler-Kontext", „Beim Start" Punkt 3):** L0 fragt nicht zurück, Vorbehalte
  gehen in `docs/studio/warteschlange.md`.
- Start- und Ende-Routine: `docs/studio/STUDIO.md`, Abschnitt „Session-Start und -Ende".

## Architektur-Regeln

- `src/sim/` ist DOM-frei und deterministisch; Welt-Zustand ist ein JSON-fähiges Objekt (ADR-002).
- Sim-Aktionen werfen nicht; sie liefern `{ ok, reason }`.
- Spielwerte nur in `src/sim/defs/`, nirgends hart im Code.
- Keine Laufzeit-Abhängigkeiten; Ausnahmen nur per L0-Ruling mit eigenem ADR (ADR-001). Der Hook `dep-guard` wird nie umgangen.
- `src/render/` schreibt nie in die Welt; `src/audio/` importiert nichts aus `src/sim/` oder `src/ui/`.

## Test-Strategie

Vitest gegen `src/sim/` und reine Mathematik in `src/render/` (Kamera, Tag-Nacht-Tönung, Schiffsposition). Renderer und UI werden manuell im Browser geprüft.
Vitest zusätzlich gegen `src/audio/` (Fake-`AudioContext`), die Cache-Logik in `src/render/overlays.ts` und reine, DOM-freie Helfer in `src/ui/` (`tests/ui/`).
Der Balancing-Test (`tests/sim/balance.test.ts`) ist Regressionsschutz für die Spielwerte: Jede Änderung in `src/sim/defs/` muss ihn grün lassen.

## Context-Scopes

| Scope       | Pfade                                                                                      | Wann verwenden                            |
| ----------- | ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Sim         | `src/sim/`, `tests/`                                                                       | Spielregeln, Balancing, Bugs in der Logik |
| Render      | `src/render/`, `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/defs/`, `src/sim/noise.ts` | Darstellung, Kamera                       |
| UI          | `src/ui/` (inkl. `src/ui/storage.ts`), `index.html`, `src/style.css`                       | Bedienung, Layout, Speichern/Laden        |
| Audio       | `src/audio/`, `tests/audio/`                                                               | Ton, Klangereignisse                      |
| Studio      | `docs/studio/`, `.claude/agents/`, `.claude/output-styles/`, `tools/studio/`               | Arbeitsweise, Personas, Dashboard         |
| Vollständig | alles                                                                                      | Architektur, Querschnitt                  |

## Dokumentation

- Einstieg: `docs/index.md`; Architektur nach arc42 in `docs/arc42.md` — bei Änderungen an Modulen, Tick-Ablauf oder Persistenz mitführen.
- Spec: `docs/superpowers/specs/`, Pläne: `docs/superpowers/plans/`, ADRs: `docs/adr/`
- Spielanleitung im `README.md` — bei Änderungen an Bedienung oder Spielwerten mitführen.
- Befunde ausserhalb des Scopes: `docs/beobachtungen.md`
