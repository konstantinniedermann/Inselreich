# T03 · Zustand und Save (R15)

Plan: [Index](../2026-10-14-handel-2.md) · AK-H2-20, AK-H2-21, AK-H2-22 · Spec §3 · Modell sonnet · ≈ 45 Tools

**Files:**

- Modify: `src/sim/types.ts` (`FarOffer`, `World.farOffer`, `World.farSkip`, `Order.island?`, `World.version`),
  `src/sim/world.ts` (`createWorld`), `src/sim/save.ts` (Version, Migration, Prüfung)
- Create: `tests/sim/farOrder-save.test.ts`
- Modify: `tests/sim/save-contract.test.ts` (Z. 58), `tests/sim/buyPct.test.ts` (Z. 51) — nur die Schlüssel-Ende-Prüfung

**Interfaces:**

- Consumes: `foldBackFarOrders` (T02), `FAR_ORDER_DURATION` nur **nicht** (P-3: die Prüfung liest ihn nicht).
- Produces (T04–T09 nutzen genau diese Namen):

```ts
/** Offenes Fernangebot der Periode (Handel 2); nie zugleich mit Vertrag, Vertragsangebot oder Fernauftrag. */
export interface FarOffer {
  island: number;
  good: GoodId;
  amount: number;
  reward: number;
}
// Order: `island?: number` — nur bei Fernaufträgen, sonst fehlt der Schlüssel
// World (am Ende, nach contractOffer): farOffer: FarOffer | null; farSkip: number | null;
```

- `migrateV14ToV15(raw)` (vorläufige Nummer, T09 legt fest); `SAVE_VERSION = 15`; `World.version: 15`; `createWorld` schreibt 15.

## Schritte

- [ ] **Step 1: Failing test** — `tests/sim/farOrder-save.test.ts`. Testwelt ohne Sim-Regeln: Felder direkt setzen (Regeln
      kommen in T04/T05). Insel über `kind` bestimmen: `const B = w.islands.findIndex((x) => x.kind === 'B')`.

```ts
const P = (k: number): number => ORDER_FIRST_TICK + k * ORDER_PERIOD;
const isl = (w: World, kind: 'A' | 'B' | 'C'): number =>
  w.islands.findIndex((x) => x.kind === kind);
const load = (w: World): LoadResult => deserialize(serialize(w));
const bad = (w: World): void =>
  expect(load(w)).toEqual({ ok: false, reason: 'Beschädigter Spielstand' });

function farWorldRaw(): World {
  // Periode 0, Tick P(0)+10, Zufallsauftrag + Fernangebot
  const w = createWorld(3, { unlockAll: true });
  w.tick = P(0) + 10;
  w.order = {
    period: 0,
    good: 'wood',
    amount: 20,
    reward: 20 * orderUnitReward('wood'),
    due: P(0) + ORDER_DURATION,
  };
  w.farOffer = { island: isl(w, 'B'), good: 'rum', amount: 15, reward: 450 };
  return w;
}
function farOrderRaw(due = P(0) + 1700): World {
  // laufender Fernauftrag, farSkip = 1
  const w = createWorld(3, { unlockAll: true });
  w.tick = P(0) + 10;
  w.order = { period: 0, good: 'rum', amount: 15, reward: 450, due, island: isl(w, 'B') };
  w.farSkip = 1;
  return w;
}
```

Fälle:

- **AK-H2-21:** `createWorld(3).version === SAVE_VERSION`; `farOffer`, `farSkip` `null`, letzte zwei Schlüssel
  `['farOffer', 'farSkip']`. Vorversion bauen: `const raw = JSON.parse(serialize(w)); delete raw.farOffer; delete raw.farSkip;
raw.version = SAVE_VERSION - 1;` → `deserialize` ok, `farOffer`/`farSkip` `null`, `serialize` gleich dem Original.
  «danach 10 Perioden bitgleich»: Original und Geladenes je `stepAt`-frei mit `step` bis `P(10)` laufen lassen, `serialize`
  gleich (Laufzeit < 2 s, sonst Welt ohne Häuser). `version: SAVE_VERSION + 1` → `{ ok: false, reason: 'Unbekannte Version' }`,
  `expect(() => deserialize(...)).not.toThrow()`.
- **AK-H2-20:** `farOrderRaw(P(0) + 1500)` lädt ok; `due` `P(0) + 600`, `P(0) + 1800` → beschädigt; Zufallsauftrag-Form
  mit `island` und `due = P(0) + 600` → beschädigt. Gegenprobe `farOrderRaw()` (1700) lädt ok.
- **AK-H2-22** je Fall beschädigt: `farOffer.island` 0; `= islands.length`; `good: 'tools'`; `amount: 0`; `farOffer` bei
  `order = null`; `farOffer` bei Fernauftrag (`farOrderRaw` + `farOffer`); `farOffer` bei `contract ≠ null` (Vertrag
  `{ good: 'rum', amount: 5, price: 27, island: 0 }`, `order = null`); `farOffer` bei `contractOffer ≠ null`;
  `order.island` 0; `farSkip` 2 bei Periode 0; `farSkip` 1.5; `farSkip` gesetzt bei `tick < ORDER_FIRST_TICK`.
  Gegenprobe: `farWorldRaw()` mit `w.islands[B].kontorId === null` (Ausgangslage, kein Kontor) lädt ok.
- **Kette:** Fixture-Lauf bleibt grün: `tests/sim/save.test.ts` (v1 … v14) ohne Änderung.

- [ ] **Step 2: Rot-Beleg** — `npx vitest run tests/sim/farOrder-save.test.ts; echo EXIT=$?` → `EXIT=1`.

- [ ] **Step 3: Typen und Start** — `types.ts` wie unter Interfaces; `World.version: 15`. `world.ts` `createWorld`:
      `version: 15`, am Ende nach `contractOffer: null` → `farOffer: null, farSkip: null`.

- [ ] **Step 4: Save** — `save.ts`:

```ts
export const SAVE_VERSION = 15;

/** v14 → v15 (Handel 2): Fernangebot. Neue Schlüssel am Ende, verlustfrei; wirft nie. */
export function migrateV14ToV15(raw: Record<string, unknown>): void {
  if (!('farOffer' in raw)) raw.farOffer = null;
  if (!('farSkip' in raw)) raw.farSkip = null;
  raw.version = 15;
}
// deserialize: nach `if (raw.version === 13) migrateV13ToV14(raw);`
//   if (raw.version === 14) migrateV14ToV15(raw);
```

`isValidOrder(o, tick, islandCount)` (Aufrufer `isValidV2Fields` reicht `(raw.islands as unknown[]).length` weiter):

```ts
const offered = ORDER_FIRST_TICK + o.period * ORDER_PERIOD;
if (!isInt(tick) || tick < offered || tick > o.due) return false;
if (o.island === undefined) return o.due === offered + ORDER_DURATION;
// Fernauftrag (R15.3/4, P-3): liest FAR_ORDER_DURATION nicht
return (
  isIntBetween(o.island, 1, islandCount - 1) &&
  o.due > offered + ORDER_DURATION &&
  o.due <= offered + 2 * ORDER_PERIOD - 1
);
```

`isIntBetween` existiert in `save.ts` (grep); sonst `isInt(o.island) && o.island >= 1 && o.island < islandCount`.

```ts
/** Fernangebot und Sperre (Handel 2, R15.1/2/5): strukturell, nicht gegen Spielwerte; Kontor wird nicht verlangt. */
function isValidFarFields(raw: Record<string, unknown>): boolean {
  const { farOffer, farSkip, order, contract, contractOffer, tick } = raw;
  const count = (raw.islands as unknown[]).length;
  if (farOffer !== null) {
    if (!isObject(farOffer) || !isOrderGoodOnIsland(farOffer, count) || farOffer.island === 0)
      return false;
    if (
      !isInt(farOffer.amount) ||
      farOffer.amount < 1 ||
      !isInt(farOffer.reward) ||
      farOffer.reward < 0
    )
      return false;
    if (!isObject(order) || 'island' in order || contract !== null || contractOffer !== null)
      return false;
  }
  if (farSkip === null) return true;
  if (!isInt(farSkip) || !isInt(tick) || tick < ORDER_FIRST_TICK) return false;
  return farSkip === Math.floor((tick - ORDER_FIRST_TICK) / ORDER_PERIOD) + 1;
}
```

In `isWellFormed` nach `isValidContractFields(raw)`: `if (!isValidFarFields(raw)) return false;`. Fehlt ein Schlüssel
(`undefined`), scheitert die Prüfung (gewollt). Kommentar über `isValidOrder` um den Fernauftrag ergänzen.

- [ ] **Step 5: Schlüssel-Ende-Prüfungen** — `save-contract.test.ts:58` und `buyPct.test.ts:51` prüfen heute die letzten
      Schlüssel. Auf Teilfolge umstellen, ohne die Aussage zu schwächen:

```ts
const keys = Object.keys(json(w));
expect(keys.slice(keys.indexOf('contract'), keys.indexOf('contract') + 2)).toEqual([
  'contract',
  'contractOffer',
]);
```

(`buyPct`: analog `['buyPct', 'contract', 'contractOffer']` ab `indexOf('buyPct')`.)

- [ ] **Step 6: Grün** — `npx vitest run tests/sim/farOrder-save.test.ts tests/sim/save.test.ts tests/sim/save-contract.test.ts
tests/sim/save-v13.test.ts tests/sim/buyPct.test.ts tests/sim/scenario-saves.test.ts tests/sim/seaGolden.test.ts
tests/sim/helpers.test.ts tests/sim/balance.test.ts; echo EXIT=$?` → 0; `npx tsc --noEmit; echo EXIT=$?` → 0.
      Ein roter Golden-Test heisst: Faltkette ruft `foldBackFarOrders` nicht → in T02-Code beheben, nicht im Test.

- [ ] **Step 7: Commit** — `git commit -m "feat: Fernangebot im Weltzustand, Save-Prüfung und Migration (Handel 2 T03)"`.

## Abnahme

- Tests nennen keine Versionszahl (grep `version.*1[45]` in den neuen/geänderten Tests leer).
- `tickOrders`, `deliverOrder` ohne Diff (Regeln folgen in T04/T05).
- Bericht: Rot-Beleg, Exit-Codes, Liste der angepassten Alt-Tests mit Begründung.
