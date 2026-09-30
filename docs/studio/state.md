# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-09-30

## Aktuelles Projekt und Phase

- Projekt: **Inselreich** (Aufbau-Strategiespiel im Browser).
- MVP-Meilensteine M1–M4 fertig (Fundament, Wirtschaft, Bevölkerung, Persistenz & Feinschliff).
- Studio 1.5 in Betrieb: Verfassung 1.0 (vorläufig bis N-001), Handbuch 1.3, Autonomie mit
  Warteschlange, Guard, Aufwandsmessung, Dashboard mit fünf Reitern, Studio-Coach.
- Laufender Meilenstein: **M5 Spielerlebnis** — Wellen 1–5 abgenommen (R60–R66), Welle 6
  (Abschluss) läuft. Plan `docs/superpowers/plans/2026-09-30-m5-spielerlebnis.md`, Übergaben
  `.studio/handoffs/m5-welle-*.md`.

## Parallele Sessions

Datei-Eigentum bei gleichzeitig laufenden L0-Sessions (STUDIO.md, „Session-Start und -Ende“,
Experiment E-002). Gegen fremde Pfade wird erst nach deren Merge geplant.

| Session                  | Stand         | besitzt                                             | bis      |
| ------------------------ | ------------- | --------------------------------------------------- | -------- |
| Prozess-Graph (baff17bb) | abgeschlossen | nichts mehr (gemergt 723aaee)                       | –        |
| M5/S17 (25e8352d)        | abgeschlossen | nichts mehr (S17 gemergt; M5 übergeben an 2bf010b4) | –        |
| M5 Welle 6 (2bf010b4)    | aktiv         | `.worktrees/m5-*`, `src/`, `tests/`                 | Merge M5 |

## Seit letzter Session erledigt

- M5 Wellen 1–5 umgesetzt und abgenommen (R60–R64, R66): Werkzeugmacher, Tag-Nacht-Tönung,
  Aufträge, Ton, Sim-Abfragen, Bedienkomfort; Träger (A5/S3b) gestrichen (R64). Sieg-Tick 6050.
- Tempo-Vorgaben R65 (noch nicht im Handbuch — überträgt der Coach in der M5-Retro).
- S17 Werkzeug gemergt (R58), Handbuch 1.3.

## Laufende Pakete

- M5-D1 Doku-Pass (lead-tech, `feat/m5-sim`), danach Final-Review (lead-qa, opus).

Sechs Strang-Branches in `.worktrees/m5-*`, Integrationsstand `test/m5-int`; nichts davon auf
`main`.

## Pausierte Pakete

keine

## Budget

Session 2bf010b4, Phase M5-abschluss (R66): lead-tech 5, lead-qa 2, lead-production 1. Nach
Session-Wechsel neu loggen.

## Offene Entscheide

- L0: keine
- Nutzer: siehe [warteschlange.md](warteschlange.md)

## Nächste Schritte

1. D1 Doku-Pass (Befunde Welle 1–5 nach `docs/beobachtungen.md`, README, arc42, ADRs, Specs,
   CLAUDE.md um `src/audio`), D1-SHA in `test/m5-int`.
2. Final-Review (lead-qa, opus) über die festen SHAs aus `.studio/handoffs/m5-welle-5.md` plus D1.
3. Gate Merge (L0), serieller Merge und Push durch `production-integrator`.
4. Meilenstein-Retro (studio-coach), inkl. Übertrag R65 ins Handbuch; `state.md` nachführen.
5. Danach: `beobachtungen-auswerten` und nächsten Meilenstein wählen.
