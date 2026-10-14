# T01 · Werte, Invarianten, Seewege Seed 3

Plan: [Index](../2026-10-14-handel-2.md) · AK-H2-25, AK-H2-27 (nur Pin der Seewege, A1 aus R633) · Modell sonnet · ≈ 30 Tools

**Files:**

- Modify: `src/sim/types.ts` (nur `OrderDef`), `src/sim/defs/goods.ts` (cloth, rum, glass), `src/sim/defs/timing.ts`
- Create: `tests/sim/farOrder-defs.test.ts`
- Modify (eine Zeile, Nachtrag): `docs/superpowers/specs/2026-10-14-handel-2-fernangebot/anhang-01-werte.md` W.2 «gemessen Seed 3: …»

**Interfaces:**

- Produces: `OrderDef.far?: number`; `FAR_ORDER_DURATION` (export aus `src/sim/defs/timing.ts`); Konstanten
  `SEED3_LANES` im Test (Möweninsel, Felsbucht, Weidenau), die T06 (AK-H2-27) wiederverwendet — **exportiert** aus
  `tests/sim/farOrder-defs.test.ts` ist nicht erlaubt (Vitest-Datei); daher in T06 dieselben Zahlen als Konstante kopieren
  und hier im Kommentar auf T06 verweisen.

## Schritte

- [ ] **Step 1: Failing test schreiben** — `tests/sim/farOrder-defs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { GOODS, GOOD_IDS, STORAGE_CAP } from '../../src/sim/defs/goods';
import {
  ISLANDS,
  ROUTE_GOODS_PER_DIRECTION,
  SHIP,
  SHIP_TICKS_PER_SEA_TILE,
} from '../../src/sim/defs/sea';
import { FAR_ORDER_DURATION, ORDER_DURATION, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { orderUnitReward } from '../../src/sim/orders';
import { laneTicks } from '../../src/sim/islands';
import { createWorld } from '../../src/sim/world';

const FAR_GOODS = GOOD_IDS.filter((g) => GOODS[g].order?.far !== undefined);

describe('Handel 2 Defs (AK-H2-25)', () => {
  it('Werte wörtlich: Frist 1700, Stoff 20, Rum 15, Glas 12, sonst kein order.far', () => {
    expect(FAR_ORDER_DURATION).toBe(1700);
    expect(FAR_GOODS).toEqual(['cloth', 'rum', 'glass']);
    expect([GOODS.cloth.order!.far, GOODS.rum.order!.far, GOODS.glass.order!.far]).toEqual([
      20, 15, 12,
    ]);
  });
  it.each(FAR_GOODS)('Invarianten je Fern-Gut %s (Spec §6)', (g) => {
    const far = GOODS[g].order!.far!;
    expect(orderUnitReward(g)).toBeLessThan(0.8 * GOODS[g].buy);
    expect(far * orderUnitReward(g)).toBeGreaterThanOrEqual(440);
    expect(far * orderUnitReward(g)).toBeLessThanOrEqual(450);
    expect(Number.isInteger(far) && far >= 1).toBe(true);
    expect(far).toBeLessThanOrEqual(Math.floor(SHIP.capacity / ROUTE_GOODS_PER_DIRECTION));
    expect(far).toBeLessThanOrEqual(STORAGE_CAP);
  });
  it('jedes prefers-Gut hat order.far; Frist-Invariante', () => {
    for (const d of ISLANDS) for (const g of d.prefers) expect(GOODS[g].order?.far).toBeDefined();
    const dMax = Math.max(...ISLANDS.map((d) => d.dMax));
    expect(ORDER_DURATION + 2 * SHIP_TICKS_PER_SEA_TILE * dMax).toBeLessThanOrEqual(
      FAR_ORDER_DURATION,
    );
    expect(FAR_ORDER_DURATION).toBeLessThanOrEqual(2 * ORDER_PERIOD - 1);
  });
});
```

Zweiter `describe` (A1, R633): Seed-3-Seewege messen und pinnen.

```ts
/** Gemessen in T01 (main @ <hash>), wiederverwendet in T06 AK-H2-27. Reihenfolge Möweninsel, Felsbucht, Weidenau. */
const SEED3_LANES = { A: 0, B: 0, C: 0 }; // Step 3 setzt die gemessenen Werte

describe('Seed 3 Seewege (AK-H2-27 Pin, A1)', () => {
  it('dMin ≤ d ≤ dMax je Fremdinsel und laneTicks gepinnt', () => {
    const w = createWorld(3);
    for (const kind of ['A', 'B', 'C'] as const) {
      const i = w.islands.findIndex((x) => x.kind === kind);
      const def = ISLANDS.find((d) => d.kind === kind)!;
      const lt = laneTicks(w.islands, 0, i);
      const d = lt / SHIP_TICKS_PER_SEA_TILE;
      expect(d).toBeGreaterThanOrEqual(def.dMin);
      expect(d).toBeLessThanOrEqual(def.dMax);
      expect(lt).toBe(SEED3_LANES[kind]);
    }
  });
});
```

`d` aus `laneTicks` zurückrechnen ist nur gültig, wenn `laneTicks = SHIP_TICKS_PER_SEA_TILE × d` gilt (Spec §5); prüfe das in
`src/sim/islands.ts` (`travelTicks`). Weicht es ab, `seaLength`/Lane-`d` direkt verwenden und im Bericht nennen.

- [ ] **Step 2: Rot-Beleg** — `npx vitest run tests/sim/farOrder-defs.test.ts; echo EXIT=$?` → `EXIT=1`
      (Import `FAR_ORDER_DURATION` fehlt / `far` undefiniert).

- [ ] **Step 3: Seewege messen** — einmal `node`-frei über Vitest: setze vorübergehend `SEED3_LANES` falsch, lies die
      `expected`-Werte aus der Fehlermeldung, trage die drei gemessenen Zahlen ein. Erwartete Spannen (Anhang 01 W.2):
      Möweninsel 250–300, Felsbucht 350–400, Weidenau 300–350. Liegt ein Wert ausserhalb: **stoppen**, Bericht an den Controller
      (Spec-Abweichung, L0).

- [ ] **Step 4: Minimal umsetzen**

`src/sim/types.ts`, `OrderDef`:

```ts
  /** Menge eines Fernauftrags (Handel 2); nur Vorliebe-Güter der Fremdinseln. */
  far?: number;
```

`src/sim/defs/goods.ts`: `cloth.order` `far: 20`, `rum.order` `far: 15`, `glass.order` `far: 12` (am Ende des `order`-Objekts).

`src/sim/defs/timing.ts`, direkt nach `ORDER_DURATION`:

```ts
/**
 * Frist eines Fernauftrags ab Periodenbeginn (Ticks, Handel 2, 2:50 bei 1×); unter 2 × ORDER_PERIOD.
 * Die Save-Prüfung liest diesen Wert nicht (Spec R15, P-3): eine Änderung braucht keine Migration.
 */
export const FAR_ORDER_DURATION = 1700;
```

- [ ] **Step 5: Grün** — `npx vitest run tests/sim/farOrder-defs.test.ts tests/sim/balance.test.ts tests/sim/orders.test.ts; echo EXIT=$?`
      → `EXIT=0`. `npx tsc --noEmit; echo EXIT=$?` → 0.

- [ ] **Step 6: Spec-Nachtrag** — in Anhang 01 unter W.2 eine Zeile: «Gemessen (Plan T01, Seed 3): Möweninsel L = …,
      Felsbucht L = …, Weidenau L = … (gepinnt in `tests/sim/farOrder-defs.test.ts`).» `npx prettier --check <datei>; echo EXIT=$?`.

- [ ] **Step 7: Commit**

```bash
git add src/sim/types.ts src/sim/defs/goods.ts src/sim/defs/timing.ts tests/sim/farOrder-defs.test.ts docs/superpowers/specs/2026-10-14-handel-2-fernangebot/anhang-01-werte.md
git commit -m "feat: Handel 2 Werte, Invarianten und Seewege Seed 3 (T01)"
```

## Abnahme

- Balancing-Test grün, Datei ohne Diff (`git diff --stat main -- tests/sim/balance.test.ts` leer).
- Keine Änderung an `orderForPeriod`, `orderPool`, `ORDER_PREMIUM`.
- Bericht: Rot-Beleg, drei gemessene `laneTicks`, Exit-Codes.
