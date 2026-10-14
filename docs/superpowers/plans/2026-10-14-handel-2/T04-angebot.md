# T04 · Angebot, Rotation, Baseline (R1–R4, R12, R13)

Plan: [Index](../2026-10-14-handel-2.md) · AK-H2-01…06, 07 (nur «Angebot bleibt»), 24, 32 · R633 T2, T3 · Modell sonnet · ≈ 45 Tools

**Files:**

- Modify: `src/sim/orders.ts`
- Create: `tests/sim/farHelpers.ts`, `tests/sim/farOrder-offer.test.ts`, `tests/sim/farOrder-baseline.test.ts`

**Interfaces:**

- Consumes: `FarOffer`, `World.farOffer/farSkip` (T03), `OrderDef.far` (T01).
- Produces: `export function farGood(world: World, island: number): GoodId | null`,
  `export function farEligible(world: World): number[]`; `tickOrders` nach R12 (inkl. `farSkip`-Verbrauch Schritt 4).
  Testhelfer (T05/T06 nutzen sie): `periodStart(k)`, `islandOf(w, kind)`, `farWorld(tier, kinds, seed = 3)`,
  `stepAt(w, t)`, `dropKontor(w, i)`.

## Schritte

- [ ] **Step 1: Testhelfer** — `tests/sim/farHelpers.ts`:

```ts
export const periodStart = (k: number): number => ORDER_FIRST_TICK + k * ORDER_PERIOD;
export function islandOf(w: World, kind: IslandKind): number {
  const i = w.islands.findIndex((x) => x.kind === kind);
  if (i < 1) throw new Error(`islandOf: ${kind} fehlt`);
  return i;
}
/** Seed-Welt, alles freigeschaltet, ein Haus der Stufe `tier`, Fremdkontore auf `kinds`. */
export function farWorld(tier: Tier, kinds: readonly IslandKind[], seed = 3): World {
  const w = createWorld(seed, { unlockAll: true });
  setHouse(houseNearKontor(w), tier, 1);
  for (const k of kinds) foundKontor2Literal(w, islandOf(w, k));
  return w;
}
/** Uhr so stellen, dass der nächste Schritt auf Tick `t` fällt, und ihn ausführen. */
export function stepAt(w: World, t: number): StepReport {
  w.tick = t - 1;
  return step(w);
}
/** Fremdkontor abreissen: `demolish`; scheitert es, Literal-Gegenstück zu foundKontor2Literal (im Bericht nennen). */
export function dropKontor(w: World, i: number): void {
  /* demolish(w, w.islands[i].kontorId!) → ok erwartet */
}
```

- [ ] **Step 2: Failing tests** — `tests/sim/farOrder-offer.test.ts` (Felsbucht `B`, Rum 15, 450; Möweninsel `A`, Weidenau `C`):

- **AK-H2-01:** `farWorld(3, ['B'])`, `stepAt(w, periodStart(2))` → `w.order` gleich
  `{ period: 2, ...orderForPeriod(3, 2, 3), due: periodStart(2) + ORDER_DURATION }` (kein `island`-Schlüssel:
  `'island' in w.order` false); `w.farOffer` `{ island: islandOf(w,'B'), good: 'rum', amount: 15, reward: 450 }`.
- **AK-H2-02:** `farWorld(3, [])` → `farOffer` `null`, `order` wie in AK-01. Gesperrt: `farWorld(3, ['B'])`,
  `w.unlocked = w.unlocked.filter((u) => u !== FUNCTION_ENTRY.orders)` → `farOffer` `null`.
- **AK-H2-03:** `farWorld(3, ['C'])` → `null`; `farWorld(4, ['C'])` → Glas 12, 444; `farWorld(2, ['A'])` → Stoff 20, 440.
- **AK-H2-04:** `farWorld(4, ['A','B','C'])`, einmal `stepAt(w, periodStart(0))`, danach nur `step` bis `periodStart(5)`
  (Spec: keine Aktion ausser `step`); `farOffer.island` an jedem Periodenbeginn → `[A,B,C,A,B,C]` (über `islandOf`).
  Stufe 3 → `[A,B,A,B,…]`; Stufe 2 → stets `A`. Laufzeit ≈ 4500 Schritte; > 2 s im Bericht nennen.
- **AK-H2-05:** Vertrag `{ good: 'wood', amount: 1, price: 1, island: 0 }`, Heimatlager Holz ≥ 1 → am Periodenbeginn
  `order` und `farOffer` `null`. Heimatlager Holz 0 → Bruch im Tick, `order` gesetzt **und** `farOffer` gesetzt.
- **AK-H2-06:** (a) Zufallsauftrag liefern (`deliverOrder(w, 0)` mit genug Ware) → `farOffer` `null` — gehört zu R4 b,
  braucht die Zeile aus T05; hier als `it.todo` **nicht** anlegen, sondern erst in T05; (b) `stepAt(w, P + 601)` → `order`
  und `farOffer` `null`; (c) bei `w.tick = P + 600` (Schritte bis dahin) besteht das Angebot.
- **AK-H2-07 (Teil):** nach dem Angebot `dropKontor(w, B)`; Schritte bis `P + 600` → `farOffer` unverändert.
- **AK-H2-32:** `farWorld(3, ['B'])`, Vertrag Holz, Heimatlager Holz 999; Perioden k … k + 3 per `stepAt`: in **jedem**
  Schritt dazwischen `farOffer === null && order === null` (Schleife über `step` mit Prüfung). Nach `cancelContract(w)` beim
  nächsten Periodenbeginn Zufallsauftrag und Fernangebot. (Annehmen-Teil «`acceptFarOrder` → Kein Fernangebot» in T05.)
- **R633 T3 / R13:** für k = 0…19 und Stufe 1…4: `order` aus einer Welt **mit** Fremdkontoren gleich der aus einer Welt
  **ohne** (gleicher Seed) und gleich `orderForPeriod(3, k, maxHouseTier(w))`. Zusätzlich: `git diff main -- src/sim/orders.ts`
  ändert die Funktion `orderForPeriod` nicht (Review-Punkt); `tests/sim/orders.test.ts` (AK-S2-13, ORDER_PINS) läuft unverändert.

`tests/sim/farOrder-baseline.test.ts` (**R633 T2, AK-H2-24**):

```ts
it('Controller-Lauf: nie Fernangebot, Sperre oder Fernauftrag (Baseline bitgleich)', () => {
  const w = createWorld(3);
  const { layout, t } = startColony(w);
  let steps = 0;
  runColony(w, layout, t, {}, (x) => {
    steps++;
    expect(x.farOffer).toBeNull();
    expect(x.farSkip).toBeNull();
    expect(x.order === null || !('island' in x.order)).toBe(true);
    return false;
  });
  expect(steps).toBeGreaterThan(1000);
}, 60_000);
```

(`runColony` ruft `stop` nach jedem Schritt; `expect` im Callback bricht bei Verstoss ab.) Laufzeit messen; Ziel ≤ 50 % des
Timeouts (R593). `balance.test.ts` und `controller.ts` **nicht** anfassen.

- [ ] **Step 3: Rot-Beleg** — `npx vitest run tests/sim/farOrder-offer.test.ts tests/sim/farOrder-baseline.test.ts; echo EXIT=$?`
      → `EXIT=1` (Baseline darf schon grün sein; Offer-Tests müssen rot sein — im Bericht trennen).

- [ ] **Step 4: Umsetzen** — `src/sim/orders.ts` (Import `ISLANDS` aus `./defs/sea`):

```ts
/** Vorliebe-Gut der Fremdinsel mit `order.far` (erstes in `prefers`); Heimat oder ohne → `null` (R1). */
export function farGood(world: World, island: number): GoodId | null {
  const isl = world.islands[island];
  if (island === HOME || isl === undefined) return null;
  const def = ISLANDS.find((d) => d.kind === isl.kind);
  return def?.prefers.find((g) => GOODS[g].order?.far !== undefined) ?? null;
}

/** Wählbare Fremdinseln in Indexfolge: Kontor, Gut mit `order.far`, Stufe erreicht (R1). */
export function farEligible(world: World): number[] {
  const max = maxHouseTier(world);
  const out: number[] = [];
  for (let i = 1; i < world.islands.length; i++) {
    if (world.islands[i]!.kontorId === null) continue;
    const g = farGood(world, i);
    if (g !== null && GOODS[g].order!.tier <= max) out.push(i);
  }
  return out;
}

/** Fernangebot der Periode `k` nach R2/R3: Rotation ohne Zufall; nicht bei Vertrag oder Sperre. */
function offerFarOrder(world: World, k: number): void {
  if (world.contract !== null || functionLock(world, 'orders') !== null) return;
  const e = farEligible(world);
  if (e.length === 0) return;
  const island = e[k % e.length]!;
  const good = farGood(world, island)!;
  const amount = GOODS[good].order!.far!;
  world.farOffer = { island, good, amount, reward: amount * orderUnitReward(good) };
}
```

`tickOrders` nach R12 (Kommentar über der Funktion nachführen):

```ts
const t = world.tick;
if (world.order !== null && t > world.order.due) {
  world.order = null;
  world.farOffer = null;
}
if (t < ORDER_FIRST_TICK || (t - ORDER_FIRST_TICK) % ORDER_PERIOD !== 0) return null;
const k = (t - ORDER_FIRST_TICK) / ORDER_PERIOD;
world.contractOffer = null;
const skip = world.farSkip === k;
if (world.farSkip !== null) world.farSkip = null;
const ev = world.contract === null ? null : settleContract(world, world.contract);
if (ev?.kind === 'delivered') return ev;
if (world.order === null && !skip) {
  offerRandomOrder(world, k);
  offerFarOrder(world, k);
}
return ev;
```

`offerRandomOrder` und `orderForPeriod` bleiben **unverändert** (T3).

- [ ] **Step 5: Grün** — `npx vitest run tests/sim/farOrder-offer.test.ts tests/sim/farOrder-baseline.test.ts
tests/sim/orders.test.ts tests/sim/contract.test.ts tests/sim/tick.test.ts tests/sim/balance.test.ts
tests/sim/balance-crises.test.ts tests/sim/farOrder-save.test.ts; echo EXIT=$?` → 0. `npx tsc --noEmit; echo EXIT=$?` → 0.

- [ ] **Step 6: Commit** — `git commit -m "feat: Fernangebot am Periodenbeginn mit Rotation (Handel 2 T04)"`.

## Abnahme

- `git diff --stat main -- tests/sim/balance.test.ts tests/sim/controller.ts` leer.
- Kein neuer Aufruf von `createRng`; `orderForPeriod` ohne Diff.
- Bericht: Rot-Beleg, Exit-Codes, Laufzeit Baseline-Test und Offer-Test.
