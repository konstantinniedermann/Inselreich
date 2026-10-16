> **Task-ID:** T02 (Paket M11-P1b) — Teil 1 von 2
> **AK-IDs:** AK-P1-08, -09, -10, -11, -12, -14 (Review, Prüfhilfe als Test); RF-3
> **blocked-by:** T01 (Review OK)
> **Strang:** `feat/m11-sim` · Worktree `.worktrees/m11-sim` · Implementierer `tech-sim-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-11-bitgleich-neupin.md](orga-11-bitgleich-neupin.md)
> **Teile:** **T02a-daempfung.md** (diese: Fakten, Tests) · [T02b-daempfung.md](T02b-daempfung.md) (Rot-Beleg, Umsetzung, Doku, Commit)

## T02: Gedämpfter Aufstieg, `flow.ts`

**Ziel:** Ein Haus, dessen Aufstieg ein Gut der Zielstufe ins Minus drückt, wartet `UPGRADE_DEFICIT_WAIT_FACTOR`-mal so
lange (Spec 3.2). Die Bilanz rechnet einmal je Wachstumstakt in `tickPopulation`; `goodsBalance` zieht nach `flow.ts`.

**Code-Fakten (Stand nach T01):**

- `src/sim/queries.ts:6` importiert `isSupplied` aus `population.ts`; `:63-84` `goodsBalance` (nach T01 mit `cycleOf`).
  **Importzyklus geprüft:** `population.ts` importiert `queries.ts` nicht; `queries.ts` → `population.ts`. Würde
  `population.ts` `goodsBalance` aus `queries.ts` holen, entstünde der Kreis (Test `imports.test.ts`). Darum `flow.ts`.
- `src/sim/population.ts:39-43` `isSupplied` = `inSupplyRange(world, center(def, x, y))` (`supply.ts:13`; `supply.ts`
  importiert nur `defs/buildings`, `types`, `world`). `flow.ts` nutzt denselben Ausdruck ohne `population.ts`.
- `population.ts:121-148` `upgradeStatus(world, b)` (Wartezeit `:132-135`, Grund
  `Bedürfnisse noch nicht ${wait} Ticks erfüllt`); `:155-170` `tryUpgrade(world, b)`; `:180-198` `tickPopulation`,
  Wachstumsblock `:190-196` ruft `tryUpgrade` je Haus in Objektreihenfolge (= Id aufsteigend).
- Aufrufer: `src/ui/hover.ts:97` `upgradeStatus(world, b)`; `src/ui/hud.ts:65,241,366` `goodsBalance` über `queries.ts`;
  `src/ui/hints.ts:170` übersetzt jede Zahl im Wartegrund (600 → „1 min"). Optionaler dritter Parameter bleibt kompatibel.
- `TIERS` (`defs/tiers.ts:7-46`): Bedarf je EW pro 100 Ticks; `UPGRADE_DEFICIT_WAIT_FACTOR` steht seit T01 in `timing.ts`.
- Testhelfer: `village(n, { unlockAll })` (`helpers.ts:116`, Häuser im Kontor-Radius, Geld 5000), `setHouse`,
  `placeService` (setzt `connected` von Hand), `placeTownhall` (baut Weg und Amtsstube). `placeBuilding`/`placeRoad`
  rufen `recomputeConnectivity`: Betriebe ohne Kacheln (`addRaw`) deshalb **nach** allen Bauaktionen anlegen.

**Erwartete Dateien:**

- `src/sim/flow.ts` (neu), `src/sim/queries.ts` (Umzug, Re-Export), `src/sim/population.ts`
- `tests/sim/flow.test.ts` (neu), `tests/sim/flow-count.test.ts` (neu, RF-3; eigene Datei wegen `vi.mock`),
  `tests/sim/imports.test.ts`
- Doku: `docs/arc42.md` (§5 Baustein `flow.ts`, `queries.ts`-Zeile), `docs/adr/ADR-005-tick-reihenfolge-und-zustaende.md`
  (Nachtrag M11)
- **Nicht anfassen:** `tests/sim/controller.ts`, `src/ui/` (UI übersetzt den Grund schon), Pins und rote Alttests (T03),
  `src/sim/levels.ts`, `src/sim/save.ts`, `types.ts`

## Schritt 1: Tests zuerst

- [ ] **`tests/sim/flow.test.ts` (neu)** — Testwelten nur mit P1-Gebäuden:

```ts
import { describe, expect, it } from 'vitest';
import { deficitGood, upgradeDeficit, upgradeDelta } from '../../src/sim/flow';
import { upgradeStatus } from '../../src/sim/population';
import { setTaxLevel } from '../../src/sim/tax';
import { step } from '../../src/sim/tick';
import type { Building, BuildingDefId, HouseState, Tier, World } from '../../src/sim/types';
import { placeService, placeTownhall, setHouse, village } from './helpers';

const hs = (tier: Tier, inhabitants: number): HouseState => ({
  tier,
  inhabitants,
  demand: {},
  satisfied: {},
  services: {},
  satisfiedSince: 0,
  supplied: true,
});
/** Angebundener Betrieb ohne Kacheln; nach allen Bauaktionen anlegen (recomputeConnectivity). */
function addRaw(w: World, defId: BuildingDefId, extra: Partial<Building> = {}): void {
  const id = w.nextBuildingId++;
  w.buildings[id] = { id, defId, x: 0, y: 0, connected: true, progress: 0, state: 'ok', ...extra };
}
/** n volle Pionierhäuser (4 EW), Kapelle, Fischer, Webereien; Lager voll genug; t0 = 1000 (Vielfaches von 50). */
function ready(n: number, fishers: number, weavers: number, tax?: 'low' | 'high') {
  const { w, houses } = village(n, { unlockAll: true });
  const k = w.buildings[w.kontorId]!;
  if (tax) {
    placeTownhall(w); // vor der Kapelle: Bauen setzt connected neu
    expect(setTaxLevel(w, tax).ok).toBe(true);
  }
  placeService(w, 'chapel', k.x + 2, k.y + 2);
  for (let i = 0; i < fishers; i++) addRaw(w, 'fisher'); // je 2,5 Nahrung / 100 Ticks
  for (let i = 0; i < weavers; i++) addRaw(w, 'weaver'); // je 2,0 Stoff (nominell, ohne Wolle)
  Object.assign(w.stock, { food: 100, cloth: 100, wood: 100, tools: 50 });
  w.tick = 1000;
  for (const h of houses) {
    setHouse(h, 1, 4);
    h.house!.satisfiedSince = 1000;
  }
  return { w, h: houses[0]!, houses };
}
/** Schritte bis `until`; Tick des Aufstiegs auf Stufe 2, sonst −1. */
function upTick(w: World, h: Building, until: number): number {
  while (w.tick < until) {
    step(w);
    if (h.house!.tier === 2) return w.tick;
  }
  return -1;
}

describe('M11 Gedämpfter Aufstieg (Spec 3.2)', () => {
  it('AK-P1-08 deficitGood 1→2: Budget = Δ → null; Nahrung 1,999 → food; Stoff 1,599 → cloth', () => {
    const h = hs(1, 4);
    expect(deficitGood({ food: 2.0, cloth: 1.6 }, h)).toBeNull();
    expect(deficitGood({ food: 1.999, cloth: 1.6 }, h)).toBe('food');
    expect(deficitGood({ food: 2.0, cloth: 1.599 }, h)).toBe('cloth');
  });
  it('AK-P1-09 volles Pionierhaus: 2 Fischer t0+300; 1 Fischer erst t0+600; niedrig 150/300; hoch nie', () => {
    const a = ready(1, 2, 1); // Nahrung 5,0 − 2,0 = 3,0 ≥ Δ 2,0; Stoff 2,0 ≥ 1,6
    expect(upTick(a.w, a.h, 2000)).toBe(1300);
    const b = ready(1, 1, 1); // 2,5 − 2,0 = 0,5 < 2,0
    expect(upTick(b.w, b.h, 1300)).toBe(-1);
    expect(upgradeStatus(b.w, b.h).reasons).toContain('Bedürfnisse noch nicht 600 Ticks erfüllt');
    expect(upTick(b.w, b.h, 2000)).toBe(1600);
    const lo = ready(1, 2, 1, 'low');
    expect(upTick(lo.w, lo.h, 2000)).toBe(1150);
    const lo1 = ready(1, 1, 1, 'low');
    expect(upTick(lo1.w, lo1.h, 2000)).toBe(1300);
    const hi = ready(1, 2, 1, 'high');
    expect(upTick(hi.w, hi.h, 2000)).toBe(-1);
  });
  it('AK-P1-10 zwei volle Pionierhäuser, 3 Fischer, 2 Webereien: kleinere Id t0+300, die andere sieht Rest 1,5 − 2,0', () => {
    const { w, houses } = ready(2, 3, 2); // Nahrung 7,5 − 4,0 = 3,5
    const [a, b] = [...houses].sort((x, y) => x.id - y.id);
    while (w.tick < 1300) step(w);
    expect([a!.house!.tier, b!.house!.tier]).toEqual([2, 1]);
    while (w.tick < 1350) step(w);
    expect(b!.house!.tier).toBe(2); // neues Budget im nächsten Takt (Spec 3.2): 3,5 − 2,0 ≥ 0; siehe Risiken T02b
  });
  it('AK-P1-11 upgradeDelta bei vollem Haus (± 1e-9); Stufe 4 ohne Ziel leer', () => {
    const near = (d: Partial<Record<string, number>>, exp: Record<string, number>): void => {
      expect(Object.keys(d).sort()).toEqual(Object.keys(exp).sort());
      for (const g of Object.keys(exp)) expect(Math.abs(d[g]! - exp[g]!)).toBeLessThan(1e-9);
    };
    near(upgradeDelta(hs(1, 4)), { food: 2.0, cloth: 1.6 });
    near(upgradeDelta(hs(2, 8)), { food: 3.5, cloth: 1.4, rum: 3.0 });
    near(upgradeDelta(hs(3, 15)), { food: 2.5, cloth: 1.0, rum: 1.0, glass: 2.0 });
    expect(upgradeDelta(hs(4, 20))).toEqual({});
  });
  it('AK-P1-12 Rum 100 im Lager bei Rum-Defizit → 600; brennende Brennerei zählt nominell', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const h = houses[0]!;
    setHouse(h, 2, 8);
    for (let i = 0; i < 4; i++) addRaw(w, 'fisher'); // Nahrung 10,0 − 4,0 = 6,0 ≥ 3,5
    for (let i = 0; i < 2; i++) addRaw(w, 'weaver'); // Stoff 4,0 − 1,6 = 2,4 ≥ 1,4
    const burning = { state: 'burning', outageUntil: 1_000_000 } as const;
    addRaw(w, 'distillery', burning); // Rum 2,0 nominell < Δ 3,0
    w.stock.rum = 100;
    w.tick = 1300;
    h.house!.satisfiedSince = 1000;
    expect(upgradeStatus(w, h).reasons).toContain('Bedürfnisse noch nicht 600 Ticks erfüllt');
    expect(upgradeDeficit(w, h)?.good).toBe('rum');
    expect(Math.abs(upgradeDeficit(w, h)!.net + 1)).toBeLessThan(1e-9); // 2,0 − 3,0
    addRaw(w, 'distillery', burning); // 4,0 − 3,0 ≥ 0
    expect(upgradeStatus(w, h).reasons.some((r) => r.startsWith('Bedürfnisse noch nicht'))).toBe(
      false,
    );
    expect(upgradeDeficit(w, h)).toBeNull();
  });
});
```

- [ ] **`tests/sim/flow-count.test.ts` (neu, Muster `tests/render/errandsGraph.test.ts`):**

```ts
import { describe, expect, it, vi } from 'vitest';

const calls = { goodsBalance: 0 };
vi.mock('../../src/sim/flow', async (orig) => {
  const m = await orig<typeof import('../../src/sim/flow')>();
  return {
    ...m,
    goodsBalance: (w: Parameters<typeof m.goodsBalance>[0]) => {
      calls.goodsBalance++;
      return m.goodsBalance(w);
    },
  };
});

import { step } from '../../src/sim/tick';
import { village } from './helpers';

describe('M11 Budget je Wachstumstakt (Review Focus 3)', () => {
  it('RF-3 tickPopulation rechnet goodsBalance genau einmal je Wachstumstakt, dazwischen nie', () => {
    const { w } = village(3, { unlockAll: true });
    for (let t = 1; t <= 200; t++) {
      const before = calls.goodsBalance;
      step(w);
      expect(calls.goodsBalance - before, `Tick ${t}`).toBe(t % 50 === 0 ? 1 : 0);
    }
  });
});
```

- [ ] **`tests/sim/imports.test.ts`:** Fall `PLAN-FLOW` (Code in T02b, Schritt 1c).

Weiter mit [T02b-daempfung.md](T02b-daempfung.md).
