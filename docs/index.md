# Inselreich — Dokumentation

Einstieg in die Projektdokumentation. Die Spielanleitung und die Entwicklungsbefehle stehen im
[README](../README.md).

## Architektur

- [Architekturdokumentation nach arc42](arc42.md) — Ziele, Bausteine, Laufzeit, Verteilung, Konzepte, Risiken, Glossar

## Studio (Arbeitsweise)

Lokal, nicht Teil des Spiels.

- [VERFASSUNG.md](studio/VERFASSUNG.md) — Regeln des Nutzers; nur der Nutzer ändert sie
- [STUDIO.md](studio/STUDIO.md) — Handbuch: Hierarchie, Ablauf, Autonomie, Messung, Verbesserungsschleife
- [CHANGELOG.md](studio/CHANGELOG.md) — Versionen von Handbuch und Personas
- [warteschlange.md](studio/warteschlange.md) — Nutzerentscheid-Warteschlange
- [experimente.md](studio/experimente.md) — Experimente der Verbesserungsschleife
- [lernen.md](studio/lernen.md) — kuratierte Erkenntnisse (beim Session-Start geladen)
- [retros/](studio/retros/README.md) — Retro-Berichte des Studio-Coachs
- [metriken/](studio/metriken/README.md) — verdichtete Metriken je Session und Meilenstein
- [gates.md](studio/gates.md) — Freigabe-Gates
- [roster.md](studio/roster.md) — Personas, Versionen und Modellstufen
- [rulings.md](studio/rulings.md) — Entscheide
- [state.md](studio/state.md) — aktueller Stand
- [herkunft.md](studio/herkunft.md) — Herkunft und Lizenz übernommener Vorlagen
- [templates/](studio/templates/) — Vorlagen (Briefing, Bericht, Übergabe, Ruling, Playtest, Budgetantrag, Persona, Retro, Experiment)

## Assets

- [CREDITS.md](CREDITS.md) — Nachweis übernommener Grafik und Audio
- [licenses/](licenses/README.md) — Lizenztexte

## Entscheidungen (ADRs)

- [ADR-001 Tech-Stack](adr/ADR-001-tech-stack.md)
- [ADR-002 Simulation getrennt von Darstellung](adr/ADR-002-sim-render-trennung.md)
- [ADR-003 Top-down statt Isometrie](adr/ADR-003-topdown-statt-isometrie.md)
- [ADR-004 Eigener Titel, eigene Grafik, eigene Spielwerte](adr/ADR-004-eigene-assets.md) — abgelöst durch ADR-006
- [ADR-005 Tick-Reihenfolge und Zustände](adr/ADR-005-tick-reihenfolge-und-zustaende.md)
- [ADR-006 Eigene oder offen lizenzierte Inhalte mit Nachweis](adr/ADR-006-offene-lizenzen.md)
- [ADR-007 Studio-Hierarchie mit nativen, verschachtelten Subagenten](adr/ADR-007-studio-hierarchie.md)
- [ADR-008 Studio-Telemetrie über Hooks, JSONL und Dashboard](adr/ADR-008-studio-telemetrie.md)
- [ADR-009 Studio-Autonomie, Verfassung und Selbstverbesserung](adr/ADR-009-studio-autonomie-und-lernen.md)
- [ADR-010 Zufall je Periode aus dem Seed statt RNG-Strom im Save](adr/ADR-010-zufall-je-periode.md)

## Specs

- [Design-Spec MVP](superpowers/specs/2026-09-29-inselreich-design.md) — Spielkonzept, Datenmodell, Module
- [Kurz-Spec Balancing-Revision](superpowers/specs/2026-09-30-balancing-design.md) — Steuern und Luxusverbrauch
- [Design-Spec M5 Spielerlebnis](superpowers/specs/2026-09-30-m5-spielerlebnis-design.md) — Steuerregler, Verkaufssättigung, Aufträge, Ambiente, Bedienkomfort, Save v2
- [Design-Spec Studio](superpowers/specs/2026-09-30-studio-design.md) — Hierarchie, Telemetrie, Dashboard
- [Design-Spec Studio 1.5](superpowers/specs/2026-09-30-studio-autonomie-design.md) — Projektleiter, Autonomie, Messung, Selbstverbesserung
- [Design-Spec Prozess-Graph](superpowers/specs/2026-09-30-studio-prozessgraph-design.md) — Graph im Reiter Live, Namen, Nachrichten

## Implementierungspläne

- [M1 Fundament](superpowers/plans/2026-09-29-m1-fundament.md)
- [M2 Wirtschaft](superpowers/plans/2026-09-29-m2-wirtschaft.md)
- [M3 Bevölkerung](superpowers/plans/2026-09-30-m3-bevoelkerung.md)
- [M4 Persistenz und Feinschliff](superpowers/plans/2026-09-30-m4-persistenz-feinschliff.md)
- [M5 Spielerlebnis](superpowers/plans/2026-09-30-m5-spielerlebnis.md)
- [Studio-Setup](superpowers/plans/2026-09-30-studio-setup.md)
- [Studio 1.5](superpowers/plans/2026-09-30-studio-autonomie.md)
- [Studio Prozess-Graph](superpowers/plans/2026-09-30-studio-prozessgraph.md)

## Befunde

- [Beobachtungen](beobachtungen.md) — Posteingang für Befunde ausserhalb des Scopes
