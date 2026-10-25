# T05 · Klang: `shipDock` in `src/audio/`

Umsetzer `art-audio-engineer` · ≈ 35 Tools · AK K5 bis K8, K10 · blocked-by: – (sofort; Worktree `.worktrees/leben-see-klang`, `git merge main` vor Start) · Spec: Teil P2 «Gestaltung und Pegel»

## Dateien

- ändern: `src/audio/sound.ts` (`SoundEvent`, `THROTTLE_MS`), `src/audio/buildSounds.ts` (Figur), `tests/audio/sound.test.ts`
- neu (bei Bedarf): `tests/audio/shipDock.test.ts`
- nicht ändern: `src/audio/manifest.ts` (`SFX_FILES`), `public/`, `docs/CREDITS.md`, `src/ui/`, `src/sim/`; **keine Importe** aus `src/sim/` oder `src/ui/`

## Verhalten

1. `SoundEvent` um `'shipDock'` erweitern; **kein** Eintrag in `SFX_FILES`, **kein** Eintrag in `FIGURE_S` (kein Ducking). `THROTTLE_MS.shipDock = 4000` (gemessen an `ctx.currentTime`).
2. Synthetische Figur nach dem Bausteinschema von `WATER`/`BELL` (`tone`/`burst`): dumpfer Anschlag 150 → 90 Hz, 0,09 s, dazu kurzer gefilterter Rausch-Impuls (Tauknarren). Spitzenpegel jedes Bausteins ≤ 0,08, Effekte-Bus. Kein Dur-Akkord (nicht als `coin`/`upgrade` hörbar).
3. Stumm, `setHidden(true)` und vor `unlock()` spielen nichts (bestehender Pfad von `play`; nur prüfen).

## Testfälle (rot zuerst; Fake-`AudioContext` aus `tests/audio/sound.test.ts`)

- **K5** `play('shipDock')` erzeugt Bausteine, jede Spitze ≤ 0,08, keine Quelle aus geladenem Sample; `SFX_FILES`/`public/` unverändert. **K6** zweiter Aufruf < 4000 ms später nicht, ≥ 4000 ms ja; `debugState().events.shipDock` zählt nur gespielte. **K7** Spitzenpegel `shipDock` < `coin`, < `build`, < `order`, < `alarm`; `FIGURE_S.shipDock` fehlt, `debugState().duck` bleibt 1. **K8** `muted`, `setHidden(true)`, vor `unlock()` → keine Bausteine. **K10** `npx vitest run tests/assets` grün, keine Asset-Änderung.

## Prüfschritte / Task-Review

Gezielte Tests (Exit 0), `tsc`, eslint/prettier. Reviewer: Importregel `src/audio/`, Pegel-Tabelle, kein neues Asset.
