# T03 · Render-Cache `shipLane` mit wirksamer Fahrzeit

Umsetzer `art-rendering-engineer` · ≈ 30 Tools · AK-SR-15 · blocked-by: T01 · Worktree `.worktrees/seerecht-render` (`feat/seerecht-render` ab `feat/seerecht` nach T01) · Spec §3.2 «Render-Cache», §3.3

## Dateien

- ändern: `src/render/shipLane.ts` (`ticksCache`, `cachedTicks`, Import, Doc-Kommentare Z. 20 und 89), `tests/render/shipLane.test.ts`
- nicht ändern: `src/sim/` (nur lesen), `renderer.ts`, `seaMap.ts` (lesen `shipPose` unverändert)

## Interfaces

- Consumes (T01): `laneTicksOf(world, a, b)`, `seaTileTicks(world)` aus `src/sim/council.ts`; `laneWorld(d)` aus `tests/sim/seaHelpers.ts`.
- Produces: keine neue Schnittstelle; `shipPose(world, ship)` unverändert in der Signatur.

## Verhalten (Plan P-2)

- `cachedTicks(world, from, to)`: Cache weiter je `world.islands` (WeakMap), Schlüssel `${from}-${to}-${seaTileTicks(world)}`, Wert `laneTicksOf(world, from, to)`. Kein Verwerfen nötig; Render schreibt nie in die Welt.

## Steps

- [ ] **Test rot** in `tests/render/shipLane.test.ts`, `describe('I-153 Seerecht Pose und Cache')`, Welt `laneWorld(30)`, Schiffe per `shipLiteral`:
  - `AK-SR-15 a`: Schiff `left` 150 nach `island`: `shipPose` vor dem Beschluss (füllt den Cache) liefert den Punkt bei t = 0,5 (`pointAt(lanePoints(w, 0, island), 0.5)`); `council[4] = 'open'`, `decree(w, 4, 'C')` → `left` 120, `shipPose` wieder t = 0,5 (`toBeCloseTo` je Koordinate, 9 Stellen).
  - `AK-SR-15 b`: Schiff `left` 7: vorher t = 1 − 7/300 (0,97667), nachher `left` 6, t = 1 − 6/240 (0,975); Positionsabstand ≤ Länge der Linie × 1/(8 × 30) (über `pointAt` beider t).
  - `AK-SR-15 c`: nach dem Beschluss abgelegtes Schiff (`left` 240) liegt bei t = 0 (Start-Anker); Kommentar: mit 10er-Cache wäre t = 0,2.
  - Review Focus 3: dieselbe Insellage, neue Welt aus `laneWorld(30)` ohne Beschluss nach einer Welt mit Beschluss → t aus 10 × d.
- [ ] **Lauf rot:** `npx vitest run tests/render/shipLane.test.ts; echo EXIT=$?` → ≠ 0 (c rot mit t 0,2).
- [ ] **Umsetzen** nach Verhalten.
- [ ] **Lauf grün:** `npx vitest run tests/render/shipLane.test.ts tests/render/decorSea.test.ts; echo EXIT=$?` → 0; `tsc`, eslint/prettier → 0.
- [ ] **Commit:** `feat: Schiffs-Pose rechnet mit der wirksamen Fahrzeit (I-153 T03)`.

## Task-Review

Kein Literal 8/10; Cache-Schlüssel enthält die wirksamen Ticks; keine Schreibzugriffe auf die Welt; Bestandstests unverändert grün.
