# T06 · Anbindung `renderer.ts`: `RenderFx.speed`, Gehuhr, `dir`/`step`

Umsetzer `art-rendering-engineer` (neuer Start) · ≈ 25 Tools · AK-T7, T9 (Lauf) · blocked-by T05 **und ORT-A gemergt** · Spec: `docs/superpowers/specs/2026-10-22-leben-strasse-design.md`, „Konflikte und Startbedingung“

## Vorbedingung (erster Schritt)

`git -C .worktrees/leben-strasse merge main` (**kein Rebase**). Konflikte in `renderer.ts` nur nach dem Muster lösen: ORT-A-Text bleibt vollständig, die LEBEN-STRASSE-Zeilen werden drumherum eingefügt; Liste der Konflikte im Bericht. `limits.ts` bleibt unberührt.

## Dateien

- ändern: `src/render/renderer.ts` (rund 8 Zeilen: Import, `RenderFx.speed?: 0 | 1 | 2 | 4`, `walkClock(world, fx.timeMs, fx.speed)` vor dem Walker-Block, `tickClock(world, fx.timeMs, fx.speed)`, `walkerAt(..., walkMs, ...)`, `figureLook` + neue `drawWalker`/`drawErrandLoad`-Aufrufe), `tests/render/renderer*.test.ts` (Dateinamen vorher mit `ls tests/render`)
- nicht ändern: `limits.ts`, `life.ts`, `errands.ts`, `pace.ts`, `src/ui/`

## Verhalten

1. `RenderFx.speed` optional; fehlt es (Tests, Galerie, Dev): 1.
2. `reduceMotion` und Obergrenzen (`CAPS.walkers`, `walkersLeft`, `errandCap`) wie bisher; Tiefensortierung der Figuren unverändert.
3. Ein Test: `render` mit `fx.speed = 0` zeichnet bei verschiedenem `timeMs` dieselben Figurpositionen (Fake-Kontext, Aufrufprotokoll gleich); ohne `speed` Verhalten wie 1.

## Prüfschritte / Task-Review

Gezielter Test `renderer*`, `tsc`, eslint/prettier. Reviewer: nur die benannten Hunks im Diff gegen main; ORT-A-Block unversehrt (`git diff main` auf ORT-A-Hunks leer).
