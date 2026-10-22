# T02 · Sim-Leser `depart` und `routeBalance`; Szenario, Wächter, Determinismus

Umsetzer `tech-sim-engineer` · ≈ 50 Tools · AK-SR-5 (Rückruf), AK-SR-6 bis AK-SR-10 · blocked-by: T01 · Worktree `.worktrees/seerecht` (`feat/seerecht`) · Spec §3.2, §6, §8, Anhang §2–§4

## Dateien

- ändern: `src/sim/ships.ts` (`depart`, Import), `src/sim/routeBalance.ts` (`cycleTicks`, Import, Doc-Kommentar Z. 14), `tests/sim/council.test.ts` (neue Fälle im Block `I-153 Seerecht`), `tests/sim/routeBalance.test.ts`
- neu: `tests/sim/seerecht.test.ts`
- nicht ändern: `council.ts`/Defs (T01), `save.ts` (T05), `balance*.test.ts`

## Interfaces

- Consumes (T01): `laneTicksOf(world, a, b)`, `seaTileTicks(world)`, `COUNCIL[4].C!.lever`, `laneWorld(d)` aus `tests/sim/seaHelpers.ts`.
- Produces: `tests/sim/seerecht.test.ts` (T06 ergänzt dort den Grep-Wächter).

## Verhalten

- `depart`: `ship.left = laneTicksOf(world, ship.port, to)`.
- `routeBalance`: `cycleTicks = laneTicksOf(world, route.a, route.b) + laneTicksOf(world, route.b, route.a)`; Rundung und Rest unverändert.

## Steps

- [ ] **Tests rot.**
  - `tests/sim/council.test.ts`:
    - `AK-SR-5 Rückruf`: `homing`-Schiff unterwegs zur Fremdinsel, `decree(w, 4, 'C')`, Schiff kommt an und legt über `depart` heimwärts ab → `left === 8 * d` (`laneWorld`, d aus dem Helfer).
    - `AK-SR-6`: nach dem Beschluss ablegendes Schiff auf Seeweg d hat `left === 8 * d` und liegt nach genau `8 * d` Ticks (`step`) im Zielhafen, nach `8 * d − 1` noch nicht; ohne Beschluss `10 * d`.
    - `AK-SR-10`: zwei Läufe gleicher Seed und Aktionsfolge, darin `decree(w, 4, 'C')` bei mindestens zwei fahrenden Schiffen, danach 200 `step`: `fnv1a32(sortedJson(w1)) === fnv1a32(sortedJson(w2))` (Helfer aus `tests/sim/helpers.ts`).
  - `tests/sim/routeBalance.test.ts` `AK-SR-9`: Route Heimat ⇄ Insel mit d 35 (`laneWorld(35)`): `routeBalance(...).cycleTicks` 700 ohne, 560 mit `council[4] = 'C'`; `goodsPer100` mit Seerecht = ohne × 700 / 560 (gleiche Rundung, `toBeCloseTo` mit 9 Stellen).
  - `tests/sim/seerecht.test.ts`:
    - `AK-SR-7` (B1 Gewinnlage): `laneWorld(35)`, ein Schiff (`buyShip`), Route (`setRoute`) `ab: []`, `ba`: Gewürz. Vor jedem `step`: Insellager Gewürz = `ROUTE_RESERVE.default + SHIP.capacity`, Heimatlager Gewürz = 0. Ankunfts-Ticks ab Ablegen in der Heimat aufzeichnen (Übergang `to !== null` → `to === null` mit `port`). Ohne Seerecht: erste Ankunft Insel 350, Heimat 700, Heimankünfte im Abstand 700; mit Seerecht (Beschluss vor dem ersten Ablegen): 280, 560, Abstand 560. Über 5650 Ticks: in der Heimat entladen ohne 400 (8 × 50), mit 500 (10 × 50). Mengen per Lager-Differenz bei Ankunft, nicht über `routeBalance`.
    - `AK-SR-8` (Wertewächter, nur Defs), Beschreibung enthält «Fällt dieser Test, Seerecht-Wert neu prüfen (R805).»: mit `cap = SHIP.capacity`, `need = TIERS[4].needs.spice * 80`, `c = COUNCIL[4].C!.lever.value`, `t = SHIP_TICKS_PER_SEA_TILE`: `cap * 100 / (2 * c * 35) >= need`, `cap * 100 / (2 * t * 35) < need`, `cap * 100 / (2 * t * 30) >= need`.
- [ ] **Lauf rot:** `npx vitest run tests/sim/council.test.ts tests/sim/routeBalance.test.ts tests/sim/seerecht.test.ts; echo EXIT=$?` → ≠ 0 (AK-SR-8 darf schon grün sein, Rest rot; im Bericht trennen).
- [ ] **Umsetzen** `depart`, `routeBalance`.
- [ ] **Lauf grün:** dieselben Dateien plus `tests/sim/ships.test.ts tests/sim/ships-rng.test.ts tests/sim/seaRoute.test.ts tests/sim/farOrder-sea.test.ts; echo EXIT=$?` → 0; `tsc`, eslint/prettier → 0.
- [ ] **Commit:** `feat: Abfahrt und Routen-Bilanz lesen die wirksame Fahrzeit (I-153 T02)`.

## Hinweise

- Ist die Tick-Reihenfolge (Laden/Entladen vor oder nach Abfahrt) für AK-SR-7 anders als angenommen, gilt: der Umlauf (700/560) wird über Ankunfts-Ticks geprüft (lead-qa Q4); weicht die Menge ab, `blocked` mit Messwerten melden, keine Erwartung ändern.
- Keine Uhr, keine RNG-Abhängigkeit ausser `createWorld`.

## Task-Review

`depart`/`routeBalance` nur über `laneTicksOf`; Szenario prüft Ankunfts-Ticks direkt; Wächter zweiseitig mit Def-Werten, keine Literal-Erwartung 8,93/7,14; `balance*.test.ts` ohne Diff.
