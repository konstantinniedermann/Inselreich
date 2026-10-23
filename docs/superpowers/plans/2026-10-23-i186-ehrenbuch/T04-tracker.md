# T04 · Tracker `reset`/`observe`, je Schritt, bitgleich

Umsetzer `tech-ui-engineer` · ≈ 35 Tools · AK-EB-09, AK-EB-10, AK-EB-06, AK-EB-03 (Tick-Bezug N7) · blocked-by: T01 (OK) · Strang A (`.worktrees/i186-ehrenbuch`) · Spec §2.1 Tracker, §11 N7

## Dateien

- neu: `src/ui/honorTracker.ts`, `tests/ui/honorTracker.test.ts`
- nicht ändern: `src/sim/`, `src/ui/app.ts` (folgt in T05)

## Verhalten

1. `createHonorTracker(world: World): HonorTracker` ruft intern `reset(world)`.
2. `reset(world)`: Schnappschuss = `honorMarks(world)`.
3. `observe(world, run: HonorRun | null): HonorId[]` = `newHonors(snapshot, world, run)`, danach Schnappschuss = `honorMarks(world)`. Kein DOM, kein `localStorage`, keine Uhr, schreibt nie in die Welt.
4. Tick-Bezug (N7, P-3): Der Aufrufer liest `world.tick` direkt nach `observe`; das ist der Tick nach dem `step`, in dem der Wechsel geschah. Als JSDoc an `observe` festhalten.

## Testfälle (rot zuerst), `tests/ui/honorTracker.test.ts`

- **EB-09 a:** Welt mit `won`, `wonMerchants`, `wonSpice`, `monumentDone`, allen Kontoren und einem `trial.passed`-Eintrag; `createHonorTracker(w)`, ein `step(w)`, `observe` → `[]`.
- **EB-09 b:** Welt kurz vor Ziel 1 (Szenario `m8-kurz-vor-sieg` aus `tests/sim/scenarios.ts`, `SCENARIOS['m8-kurz-vor-sieg']!()`), `step` bis `won` wechselt, je Schritt `observe` → genau einmal `citizenTown`; mit `run = { seed: w.seed, unlockMode: 'stepwise' }` und Tick ≤ Schwelle auch `swiftFound`. Ein weiteres `observe` ohne Wechsel → `[]`.
- **EB-09 c:** frische Welt `createWorld(S)` (wie «Neue Insel»), `observe` → `[]`.
- **EB-10:** 8 Schritte in einem «Frame» wie die Spielschleife (`for` 8 × `step(w); hits.push(...observe(w, run).map((id) => ({ id, tick: w.tick })))`), Welt so gewählt, dass `won` in Schritt 3 wechselt (Szenario-Tick passend setzen, z. B. `GROWTH_INTERVAL`-Takt minus 3); der Eintrag trägt den Tick nach Schritt 3, nicht den nach Schritt 8.
- **EB-03 (N7):** `won` wechselt im Schritt, nach dem `w.tick === HONOR_SWIFT_CITIZEN_TICK` gilt → `swiftFound`; eine Welt, deren Wechsel bei `+ 1` liegt → nicht. Ticks über Konstanten, nie Literal.
- **EB-06:** zwei Welten `createWorld(S)`, je 1000 `step`, eine mit `observe` nach jedem Schritt → `serialize(a) === serialize(b)`. Laufzeit messen und im Bericht nennen; über 500 ms lokal: Schrittzahl nicht senken, sondern Controller melden.

## Prüfungen (Teilbeleg)

- `npx vitest run tests/ui/honorTracker.test.ts tests/sim/honors.test.ts; echo EXIT=$?` (rot vorher, grün nachher)
- `npx tsc --noEmit; echo EXIT=$?` · `make lint; echo EXIT=$?` · `make zeittests; echo EXIT=$?` · `make conflicts; echo EXIT=$?`

Commit: `feat: Ehrenbuch-Tracker je Schritt (I-186)`
