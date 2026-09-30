# Roster

Wer im Studio arbeitet. Verbindliche Regeln: [STUDIO.md](STUDIO.md). Persona-Dateien liegen unter
`.claude/agents/<name>.md`.

## Namensschema (R11)

- L0: Hauptsession, Rolle `studio-director` (keine Persona-Datei).
- L1: `lead-<bereich>`.
- L2: `<bereich>-<rolle>`, Rolle in Kleinbuchstaben mit Bindestrich.
- Bereiche: `production`, `design`, `tech`, `art` (umfasst Audio), `qa`.

Das Dashboard leitet Ebene und Bereich allein aus dem Namen ab. Ein Name ausserhalb des Schemas
erscheint als L2 im Bereich „extern". Umbenennen = Persona-Datei und dieses Roster ändern.

## Modellstufen (R10)

stark = `opus`, mittel = `sonnet`, klein = `haiku`. Einsatzregeln: STUDIO.md, Abschnitt
„Modellwahl".

## Aktive Personas

| Name                      | Ebene | Bereich    | Modell   | Zweck                                                                                  |
| ------------------------- | ----- | ---------- | -------- | -------------------------------------------------------------------------------------- |
| `lead-production`         | L1    | production | `opus`   | Studio-Produzent: Board, Budget-Überblick, state.md-Entwurf, Merges, Onboarding        |
| `lead-design`             | L1    | design     | `opus`   | Spielerlebnis und Regeln: Brainstorming mit L0, Specs, Wirtschaft                      |
| `lead-tech`               | L1    | tech       | `opus`   | Architektur, Implementierungspläne, Controller der Umsetzung im Worktree               |
| `lead-art`                | L1    | art        | `opus`   | Art Direction und Audio, Asset-Scouting, Lizenzen, CREDITS                             |
| `lead-qa`                 | L1    | qa         | `opus`   | Testmanagement, Reviews, Final-Review, Determinismus und Regression                    |
| `production-integrator`   | L2    | production | `sonnet` | Merged nach dem Merge-Gate seriell, prüft `make check`, CI und Pages                   |
| `design-spec-author`      | L2    | design     | `opus`   | Schreibt Specs mit testbaren Abnahmekriterien nach `docs/superpowers/specs/`           |
| `design-economy-designer` | L2    | design     | `opus`   | Produktionsketten, Kreisläufe, Steuern und Unterhalt; rechnet Bilanzen je Einwohner    |
| `tech-sim-engineer`       | L2    | tech       | `sonnet` | Setzt Regeln in `src/sim/` um: DOM-frei, deterministisch, TDD, Save-Migrationen        |
| `tech-ui-engineer`        | L2    | tech       | `sonnet` | Setzt Bedienung und Darstellung in `src/ui/`, `src/render/` um (Card-UI, mobile-first) |
| `art-license-checker`     | L2    | art        | `opus`   | Prüft jede Asset-Quelle gegen Positiv-/Negativliste, trägt CREDITS ein, hat Veto       |
| `qa-code-reviewer`        | L2    | qa         | `sonnet` | Prüft Diffs gegen Brief und Spec, Urteil OK/BEDENKEN/ZURÜCK, ändert keinen Code        |
| `qa-playtester`           | L2    | qa         | `sonnet` | Browser-Check per Headless-Chrome, Screenshots, Playtest-Report                        |

## Auf Abruf

Noch keine Persona-Datei. Entsteht, wenn ein Paket die Rolle braucht (R1).

| Name                            | Lead              | Modell (Vorschlag) | Einzeiler                                                                              |
| ------------------------------- | ----------------- | ------------------ | -------------------------------------------------------------------------------------- |
| `production-studio-ops`         | `lead-production` | `sonnet`           | Wartet die Studio-Werkzeuge (Dashboard, Hooks, `log.py`, Make-Ziele)                   |
| `production-onboarding-analyst` | `lead-production` | `sonnet`           | Prüft neue Personas und Briefings auf Vollständigkeit gegen STUDIO.md                  |
| `production-chronist`           | `lead-production` | `haiku`            | Fasst Chronik, Rulings und Pakete zu Meilenstein-Rückblicken und state.md-Entwürfen    |
| `design-genre-researcher`       | `lead-design`     | `sonnet`           | Recherchiert Mechaniken vergleichbarer Aufbauspiele (nur Mechaniken, ADR-006)          |
| `design-balancing-analyst`      | `lead-design`     | `sonnet`           | Rechnet und simuliert Balancing-Szenarien, schlägt Werte für `src/sim/defs/` vor       |
| `tech-save-engineer`            | `lead-tech`       | `sonnet`           | Save-Format: Versionierung, Migrationen, Tests für alte Spielstände                    |
| `tech-plan-architect`           | `lead-tech`       | `opus`             | Schreibt Implementierungspläne für grosse Meilensteine im Auftrag des Tech-Leads       |
| `art-asset-scout`               | `lead-art`        | `sonnet`           | Sucht offen lizenzierte Assets und liefert Kandidaten mit Lizenzangaben                |
| `art-rendering-engineer`        | `lead-art`        | `sonnet`           | Canvas-2D-Darstellung: prozedurale Grafik, Animation, Wetter                           |
| `art-audio-engineer`            | `lead-art`        | `sonnet`           | Synthetisches Audio und Einbindung lizenzierter Musik und Sounds                       |
| `qa-determinism-checker`        | `lead-qa`         | `sonnet`           | Prüft gleicher Seed → gleicher Zustand über lange Läufe und Speichern/Laden-Rundreisen |

## Neue Persona anlegen

1. Der zuständige Lead schreibt `.claude/agents/<name>.md` nach
   [templates/persona.md](templates/persona.md) (Name nach Schema, Frontmatter `name`,
   `description`, `tools`, `model`; Arbeiter ohne `Agent`-Tool).
2. Der Production-Lead prüft sie gegen STUDIO.md, verschiebt die Zeile hier von „Auf Abruf" nach
   „Aktive Personas", führt Organigramm und Lead-Tabelle in STUDIO.md nach (keine Regeländerung) und committet
   (`docs: Persona <name>`).
3. Claude Code lädt neue Agent-Dateien erst in der **nächsten Session**. Bis dahin startet der Lead
   `general-purpose` mit der Kopfzeile `Persona: <name>` und dem Persona-Text im Briefing.
