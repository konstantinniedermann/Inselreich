# T02 · Ersatzregel Stufe 3 und Testhook (TDD)

Strang SIM · Worktree `.worktrees/m14-e1` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M14E1-15 (Mechanik), Spec R3.4
Punkte 3–5 · Auflage Tech-B4 · blocked-by T01 · ≈ 30 Tools · Entscheidung E2 · ADR-010 Nachtrag M14-E1

**Zweck:** `generateForeignIslands` wirft nie mehr bei fehlender Lage. Noch ohne Insel C (die kommt in T03); die
Mechanik wird an den bestehenden Inseln geprüft. Bestehende Welten bleiben bitgleich, weil Stufe 3 nur dort greift, wo
heute geworfen würde.

## Files

- Modify: `src/sim/islands.ts` (`place` Stufe 3, `fitIsland` exportiert, Optionen `forceLastStage`, `onStage`),
  `src/sim/defs/sea.ts` (`FALLBACK_FAR_STEP = 4`, `FALLBACK_FAR_STEPS = 10` mit Kommentar).
- Create: `tests/sim/islands-c.test.ts` (wird in T03 und T05 erweitert).

## Schritte

- [ ] 0. `grep -n "function place\|function layoutValid\|function spanOk\|function lanesClear\|failShapes\|throw new Error" src/sim/islands.ts`.
- [ ] 1. Rote Tests in `islands-c.test.ts`:
  - **Stufen-Signal:** `onStage` meldet für Seeds 1, 3, 7, 13, 42 je Def genau einen Aufruf; Stufen ∈ {1, 2}; Seeds 1…50:
    Mehrheit Stufe 1.
  - **Erzwungen (`forceLastStage: 'B'`):** Seeds 1…50 → B ohne Landüberlappung mit Heimat und A, `gapBetween` ≥
    `ISLAND_GAP_MIN` zu jeder Insel (Hilfsfunktion im Test aus `ox/oy/width/height`), Seeweg 0–2 vorhanden
    (`seaLanes`), `onStage` meldet 3; A bitgleich zur Welt ohne Option (Züge von Stufe 1 werden weiter gezogen).
  - **Bestehende Seewege unberührt:** mit `forceLastStage: 'B'` kreuzt kein Seeweg zwischen den übrigen Inseln das
    Rechteck von B (`clipInside` < 1e-9).
  - **Determinismus:** zweimal derselbe Aufruf → `JSON.stringify` gleich; Stufe 3 ruft `rng` nicht (Zähl-Wrapper um
    `createRng` ist nicht nötig: Vergleich A bitgleich genügt, weil B nach A zieht — zusätzlich Test mit
    `forceLastStage: 'A'`: B ändert sich höchstens in der Lage, nicht in der Form).
  - **`fitIsland`:** platziert eine Form gegen eine künstliche, dichte Inselliste (Heimat plus zwei Inseln direkt
    angrenzend) ohne Wurf, Lücke ≥ `ISLAND_GAP_MIN`.
  - **Spanne protokollieren:** Seeds 1…300 mit `forceLastStage: 'B'` → grösste Summe Breite + Höhe des
    Archipel-Rechtecks als `console.info` im Bericht (kein Assert; Risiko E8).
- [ ] 2. `npx vitest run tests/sim/islands-c.test.ts; echo EXIT=$?` → rot.
- [ ] 3. Umsetzen nach E2: nach den 16 Richtungen statt `throw` die Stufe 3 (Suche, dann konstruktiv). Kein `rng()` in
      Stufe 3. `opts.forceLastStage === def.kind`: Stufe-1-Schleife zieht `theta` und `t` wie heute, prüft aber nicht;
      Stufe 2 und Suche entfallen; konstruktive Lage. `onStage?.(def.kind, stufe)` genau einmal je Def.
- [ ] 4. Grün: `islands-c.test.ts`, `islands-gen.test.ts`, `islands-rng.test.ts`, `islands.test.ts`,
      beide Seed-Dateien, `seaGolden.test.ts`, `save.test.ts` (unverändert grün, keine Diffs an Bestandstests).
- [ ] 5. `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`. Commit `feat: Ersatzregel Stufe 3 für
Fremdinseln (M14-E1 T02)`.

## Hinweise

- `throw` bleibt nur in `makeShape` (Ersatzform ungültig) — dort scheitert laut A3 nie etwas; nicht anfassen.
- Testzeit: Erzwungen 50 Seeds ≈ `generateForeignIslands` × 50 (ohne `createWorld`, Heimat-Lage per `generateMap` +
  `homeAnchor` wie `world.ts`); Budget 1,5 s für den Spannen-Lauf (300 Seeds), sonst je Test < 200 ms.
