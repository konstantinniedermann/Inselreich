# Roster

Wer im Studio arbeitet. Verbindliche Regeln: [STUDIO.md](STUDIO.md). Persona-Dateien liegen unter
`.claude/agents/<name>.md`.

## Namensschema (R11, R28)

- L0: Hauptsession, Rolle `studio-director` (keine Persona-Datei; Output-Style `Projektleiter`).
- L1: `lead-<bereich>`.
- L1-Stabsstelle: `studio-<rolle>`, direkt unter L0, ohne Arbeiter (z. B. `studio-coach`).
- L2: `<bereich>-<rolle>`, Rolle in Kleinbuchstaben mit Bindestrich.
- Bereiche: `production`, `design`, `tech`, `art` (umfasst Audio), `qa`; Stabsstellen und L0 im
  Bereich `studio`.

Das Dashboard leitet Ebene und Bereich allein aus dem Namen ab. Ein Name ausserhalb des Schemas
erscheint als L2 im Bereich „extern". Umbenennen = Persona-Datei und dieses Roster ändern.

## Modellstufen (R10)

stark = `opus`, mittel = `sonnet`, klein = `haiku`. Einsatzregeln: STUDIO.md, Abschnitt
„Modellwahl".

## Aktive Personas

| Name                      | Ebene | Bereich    | Modell   | Version | Zweck                                                                                           |
| ------------------------- | ----- | ---------- | -------- | ------- | ----------------------------------------------------------------------------------------------- |
| `studio-coach`            | L1    | studio     | `opus`   | 1.0     | Stabsstelle: Retros, Metriken, Experimente, lernen.md; setzt Handbuch-Änderungen nach Ruling um |
| `lead-production`         | L1    | production | `opus`   | 1.0     | Studio-Produzent: Board, Budget-Überblick, state.md-Entwurf, Merges, Onboarding                 |
| `lead-design`             | L1    | design     | `opus`   | 1.0     | Spielerlebnis und Regeln: Brainstorming mit L0, Specs, Wirtschaft                               |
| `lead-tech`               | L1    | tech       | `opus`   | 1.0     | Architektur, Implementierungspläne, Controller der Umsetzung im Worktree                        |
| `lead-art`                | L1    | art        | `opus`   | 1.0     | Art Direction und Audio, Asset-Scouting, Lizenzen, CREDITS                                      |
| `lead-qa`                 | L1    | qa         | `opus`   | 1.0     | Testmanagement, Reviews, Final-Review, Determinismus und Regression                             |
| `production-integrator`   | L2    | production | `sonnet` | 1.0     | Merged nach dem Merge-Gate seriell, prüft `make check`, CI und Pages                            |
| `design-spec-author`      | L2    | design     | `opus`   | 1.0     | Schreibt Specs mit testbaren Abnahmekriterien nach `docs/superpowers/specs/`                    |
| `design-economy-designer` | L2    | design     | `opus`   | 1.0     | Produktionsketten, Kreisläufe, Steuern und Unterhalt; rechnet Bilanzen je Einwohner             |
| `tech-sim-engineer`       | L2    | tech       | `sonnet` | 1.0     | Setzt Regeln in `src/sim/` um: DOM-frei, deterministisch, TDD, Save-Migrationen                 |
| `tech-ui-engineer`        | L2    | tech       | `sonnet` | 1.0     | Setzt Bedienung und Darstellung in `src/ui/`, `src/render/` um (Card-UI, mobile-first)          |
| `art-license-checker`     | L2    | art        | `opus`   | 1.0     | Prüft jede Asset-Quelle gegen Positiv-/Negativliste, trägt CREDITS ein, hat Veto                |
| `qa-code-reviewer`        | L2    | qa         | `sonnet` | 1.0     | Prüft Diffs gegen Brief und Spec, Urteil OK/BEDENKEN/ZURÜCK, ändert keinen Code                 |
| `qa-playtester`           | L2    | qa         | `sonnet` | 1.0     | Browser-Check per Headless-Chrome, Screenshots, Playtest-Report                                 |

**Persona-Versionen:** Frontmatter-Feld `version` in `.claude/agents/<name>.md`. Erhöht wird sie nur
über die Verbesserungsschleife (Handbuch, Abschnitt „Verbesserungsschleife") mit Eintrag in
[CHANGELOG.md](CHANGELOG.md); die Spalte `Version` hier zieht der Coach dabei nach.

## Auf Abruf

Noch keine Persona-Datei. Entsteht, wenn ein Paket die Rolle braucht (R1).

| Name                            | Lead              | Modell (Vorschlag) | Einzeiler                                                                              |
| ------------------------------- | ----------------- | ------------------ | -------------------------------------------------------------------------------------- |
| `production-studio-ops`         | `lead-production` | `sonnet`           | Wartet die Studio-Werkzeuge (Dashboard, Hooks, `log.py`, Make-Ziele)                   |
| `production-onboarding-analyst` | `lead-production` | `sonnet`           | Prüft neue Personas und Briefings auf Vollständigkeit gegen STUDIO.md                  |
| `production-chronist`           | `lead-production` | `sonnet`           | Fasst Chronik, Rulings und Pakete zu Meilenstein-Rückblicken und state.md-Entwürfen    |
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
   `description`, `tools`, `model`, `version: 1.0`; Arbeiter ohne `Agent`-Tool).
2. Der Production-Lead prüft sie gegen STUDIO.md, verschiebt die Zeile hier von „Auf Abruf" nach
   „Aktive Personas", führt Organigramm und Lead-Tabelle in STUDIO.md nach (keine Regeländerung) und committet
   (`docs: Persona <name>`).
3. Die Datei-Überwachung lädt neue oder geänderte Agent-Dateien nach wenigen Sekunden; nur wenn
   `.claude/agents/` beim Session-Start fehlte, erst in der **nächsten Session**. Dann startet der
   Lead `general-purpose` mit der Kopfzeile `Persona: <name>`, dem zu den Abschnitten von
   [templates/persona.md](templates/persona.md) ausgebauten Persona-Text im Briefing und dem Modell
   explizit im Agent-Aufruf (sonst erbt der Agent das Modell der Session).
