# T07 · Betrieb stilllegen (Sim) und Browser-Szenarien (TDD)

Strang sim · Worktree `.worktrees/m13-e1-sim` · Umsetzer `tech-sim-engineer` (sonnet, Fortsetzung) · AK-M13STL-01…08, PLAN-M13-02/03/04 · Spec §8.1 (S1–S6), Anhang 01 B · blocked-by T06 · Grösse M (≈ 35 Tools)

**Files:**

- Create: `src/sim/pause.ts`, `tests/sim/pause.test.ts`
- Modify: `src/sim/levels.ts` (+ `buildingUpkeep`), `src/sim/economy.ts` (`totalUpkeep` summiert `buildingUpkeep`), `src/sim/production.ts` (`advance`), `src/sim/flow.ts` (`goodsBalance`), `src/sim/crises.ts` (`tickCrises`, Ende des Ausfalls), `src/sim/roads.ts` (`recomputeConnectivity`), `tests/sim/scenarios.ts`, `tests/sim/scenario-saves.test.ts` (Namensliste, `WON_AFTER_FIRST_TICK`)
- Lesen: `src/sim/upgrade.ts`, `src/sim/build.ts` (`demolish`, `paidCost`), `src/sim/crises.ts` (`beginCrisis`, `fireTarget`), `tests/sim/fire.test.ts`, `tests/sim/production.test.ts`, `tests/sim/utilization.test.ts`

## Schnittstelle und Regeln

```ts
// src/sim/pause.ts — Betrieb stilllegen (I-035, Spec §8). Kein Zufall, wirft nie, kein Geld, keine Amtsstube.
export function setPaused(world: World, id: unknown, paused: unknown): Result;
// src/sim/levels.ts — einziger Upkeep-Leseort (PLAN-NAHT)
export const buildingUpkeep = (b: Building): number =>
  b.paused === true ? Math.ceil((upkeepOf(b) * PAUSED_UPKEEP_PCT) / 100) : upkeepOf(b);
```

- **`setPaused` Prüfreihenfolge (S2, wörtlich):** Gebäude zu `id` fehlt (auch Nicht-Zahl, `'2'`, `NaN`, über `Object.hasOwn(world.buildings, …)` nur bei ganzzahligem `id`) → `'Gebäude nicht gefunden'`; `typeof paused !== 'boolean'` → `'Ungültiger Wert'`; `BUILDING_DEFS[defId].produces === undefined` → `'Nur Betriebe lassen sich stilllegen'`; `true` und schon still → `'Schon stillgelegt'`; `false` und läuft → `'Läuft bereits'`. Stilllegen: `b.paused = true`, `state = 'paused'` ausser `'burning'`. Anfahren: `delete b.paused`; `state = b.outageUntil !== undefined ? 'burning' : b.connected ? 'ok' : 'notConnected'`.
- **Vorrang überall:** Ausfall → stillgelegt → Anbindung. `advance`: nach dem Ausfall-Zweig `if (b.paused === true) { b.state = 'paused'; return false; }` (kein Fortschritt, keine Entnahme, `progress` bleibt; `eff` sinkt über Zielwert 0 von selbst). `tickCrises` Ausfall-Ende: `b.state = b.paused ? 'paused' : b.connected ? 'ok' : 'notConnected'`. `recomputeConnectivity`: nach `burning` `else if (b.paused === true) b.state = 'paused'`.
- **Bilanz (S5):** `goodsBalance` überspringt `b.paused === true` (weder Erzeuger noch Verbraucher).
- **Unterhalt (S4):** `totalUpkeep` summiert `buildingUpkeep(b)`; mit Sparen erst je Gebäude halbieren, dann die Summe (T05).
- **Unverändert (S6, §6 d):** `fireTarget` liest weder `state` noch `paused`; `upgradeBuilding` behält das Flag; Abriss erstattet wie bei laufendem Betrieb; Freischaltungen zählen weiter.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot).** `tests/sim/pause.test.ts`, `describe('M13-E1 Betrieb stilllegen (AK-M13STL-01…08)')`, Welt `createWorld(3, { unlockAll: true })`, Gebäude roh eingesetzt und angebunden (`putBuilding` bzw. `placeBuilding` + Weg). Je AK ein `it` mit genau den Werten aus Spec §8.3:
  1. `STL-01` Ablauf; 2. `STL-02` Gründe und Unversehrtheit (inkl. Matrix `id` × `paused`, `serialize` unverändert bei `ok: false`; **PLAN-M13-03** Quelltextprobe `pause.ts` ohne `'./rng'`, ohne `Math.random`); 3. `STL-03` Produktion ruht (Fischer, Weberei), Anfahren produziert ab dem nächsten Schritt; 4. `STL-04` Unterhalt 55 → 43 → 34 (Sparen, wirkende Amtsstube), 100 × `tickEconomy` −34, `buildingUpkeep` 5 → 3, 25 → 13, 33 → 17, 43 → 22; 5. `STL-05` Bilanz und Kette; 6. `STL-06` Brand über `beginCrisis` (Muster `fire.test.ts`), Ende des Ausfalls → `'paused'`; `fireTarget` gleich mit und ohne Flag; 7. `STL-07` Ausbau und Abriss; 8. `STL-08` Anbindung.

  2. **`PLAN-M13-04` Determinismus (R460 A2):** gleicher Seed, gleiche `setPaused`-Folge (an/aus, Brand während Stilllegung, Abriss während Stilllegung) über mehrere tausend Ticks, zweimal → gleiches `serialize`; einmal `deserialize(serialize(w))` mitten im Lauf nach einem `setPaused` → gleiches Endergebnis wie ohne Laden.

```bash
npx vitest run tests/sim/pause.test.ts; echo EXIT=$?   # rot: Modul pause.ts fehlt
```

- [ ] **Schritt 2: Umsetzen.** Danach Baseline und Umfeld:

```bash
npx vitest run tests/sim/pause.test.ts tests/sim/edicts.test.ts tests/sim/production.test.ts tests/sim/utilization.test.ts tests/sim/fire.test.ts tests/sim/fire-rng.test.ts tests/sim/roads.test.ts tests/sim/connect.test.ts tests/sim/economy.test.ts tests/sim/flow.test.ts tests/sim/imports.test.ts tests/sim/save-v11.test.ts tests/sim/balance.test.ts tests/sim/balance-crises.test.ts tests/sim/balance-merchants.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Browser-Szenarien (Entscheid E7, Spec 10.4, R452).** In `tests/sim/scenarios.ts` zwei Einträge in `RAW_SCENARIOS`:
  - `m13-ziel1`: `createWorld(3)`, `startColony`, `runMerchants(w, layout, t, (x) => x.won)` (wie Phase 1 in T08), dann Amtsstube auf einem festen, angebundenen Platz ausserhalb des Layouts (Baukosten vorher gutschreiben), `money = 3000`; Konstante des Platzes als `M13_TOWNHALL_AT` exportieren (T08 nutzt sie).
  - `m13-vor-ziel`: gleicher Lauf mit `stop = (x) => x.tick >= 6000` (Sieg erst 6750), `expect(w.won).toBe(false)`, gleiche Amtsstube, `money = 3000`. (Die Amtsstube ist ab den ersten Siedlern frei, U3; beide Stände haben sie freigeschaltet.)
  - `scenario-saves.test.ts`: beide Namen in die vereinbarte Liste; `m13-ziel1` in `WON_AFTER_FIRST_TICK`. Prüfen: `npx vitest run tests/sim/scenario-saves.test.ts; echo EXIT=$?` (AK-S5-01 lädt jedes Szenario, Timeout 15 s; Laufzeit im Bericht nennen).

- [ ] **Schritt 4: Commit(s).** `feat: Betrieb stilllegen mit halbem Unterhalt (M13-E1 T07)`; `test: Szenarien ab Ziel 1 für den Browser-Lauf (M13-E1 T07)`.

## Bericht

Je AK Testname und Rot-Zeile, Exit-Codes, Laufzeit `scenario-saves.test.ts` vorher/nachher, Zeilenzahl `pause.ts`. Danach meldet der Controller: Sim-Stand T07 bereit (UI T12).
