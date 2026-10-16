# T04 — Kontrast `--ink-muted` (AK-UT-11, -12, -13)

Dateien: `src/style.css`, `tests/ui/contrast.test.ts`. Vorhandene `luminance`/`contrast`/`rootVars` weiterverwenden, nichts duplizieren.

## Tests zuerst (Rot-Beleg)

- [ ] AK-UT-12: `PAIRS` (oder neuer `it`) ergänzen: `--ink-muted` gegen `--parchment` (Soll ≥ 4,5, ist 6,70) und `--parchment-edge` (≥ 4,5, ist 5,13); `--parchment-muted` gegen `--wood` und `--wood-light` bleiben (6,42 / 4,98). Negativ-Fall: `--parchment-muted` gegen `--parchment` < 4,5 (Ist 1,67) dokumentiert, warum der Wechsel nötig war.
- [ ] AK-UT-11/13: Test liest `style.css`, zerlegt in Regeln (vorhandenes Muster) und verlangt: keine Regel mit `color: var(--parchment-muted)`, deren Selektor auf Pergament liegt, ausser `.btn…` (Holz). Mindestens `.edict-card.locked`, `.edict-when`, `.monument-reserve`, `.ship-reserve` nutzen `--ink-muted`; die «lohnt, wenn …»-Zeile: Selektor per `grep -n "lohnt" src/ui/edictView.ts` ermitteln und aufnehmen. Gestrichelter Rand von `.edict-card.locked` bleibt (`border-style: dashed`).
- [ ] `npx vitest run tests/ui/contrast.test.ts; echo EXIT=$?` → `EXIT=1`, Beleg.

## Umsetzung

- [ ] Token `--ink-muted: #5a4a30;` neben `--parchment-muted` (Zeile 24).
- [ ] Verwendungen prüfen: `grep -n 'parchment-muted' src/style.css`; Zeilen 1156, 1205, 1209, 1239 (Pergament) wechseln, `.btn.unaffordable` (Zeile 212, Holz) bleibt. Weitere Pergament-Treffer ebenfalls wechseln und im Bericht nennen.
- [ ] Grün, `EXIT=0`; Commit `fix: Kontrast blasser Pergament-Texte, Token --ink-muted (AK-UT-11..13)`.
