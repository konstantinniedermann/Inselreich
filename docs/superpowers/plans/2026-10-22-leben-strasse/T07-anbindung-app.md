# T07 · Anbindung `app.ts`: `speed` neben `timeMs`

Umsetzer `tech-ui-engineer` (neuer Start) · ≈ 10 Tools · blocked-by T06 · Spec: `docs/superpowers/specs/2026-10-22-leben-strasse-design.md`, „Konflikte und Startbedingung“

## Dateien

- ändern: `src/ui/app.ts` genau eine Zeile in einem **eigenen Commit**: an der Stelle, die `RenderFx.timeMs` setzt (≈ Z. 1789, per `rg "timeMs" src/ui/app.ts` prüfen), `speed: state.speed` ergänzen (Typ `0 | 1 | 2 | 4`; falls `state.speed` anders heisst oder breiter typisiert ist, Zuordnung melden, nicht raten).
- nicht ändern: Rest von `app.ts`, `src/render/`

## Prüfschritte

`npx tsc --noEmit; echo EXIT=$?`, eslint/prettier auf `app.ts`. Ein Test ist nicht nötig (eine Zeile, Beleg im Browser-Check T08: Pause friert Figuren ein). Reviewer: Diff ist eine Zeile.
