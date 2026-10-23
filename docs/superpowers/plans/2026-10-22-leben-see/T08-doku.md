# T08 · Doku (D1, E-017)

Umsetzer `tech-ui-engineer` (Fortsetzung per `SendMessage`) · ≈ 15 Tools · blocked-by: T04, T07 · das Umsetzer-Briefing erlaubt die D1-Dateien ausdrücklich

## Dateien

- ändern: `README.md` (Abschnitt Leben/Ton: «Schiffe ziehen ein Kielwasser, ein leiser Anlegeton meldet die Ankunft»), `docs/arc42.md` (Render: Schiffe und `wake.ts`; Audio: Ereignis `shipDock`, Auslöser über `SoundSnapshot.ships`; Tick-Ablauf und Persistenz unverändert vermerken)
- Befunde ausserhalb Scope (z. B. Rumpf-Spiegelung, Einstellungsschalter, Sample-Option) in `docs/beobachtungen.md`
- nicht ändern: Specs, `docs/studio/`

Prüfen: Links, `npx prettier --check` auf den Markdown-Dateien; kein Test nötig.
