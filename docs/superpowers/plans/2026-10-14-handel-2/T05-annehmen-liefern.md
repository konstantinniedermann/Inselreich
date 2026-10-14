# T05 · Annehmen und Liefern (R5, R6, R9, R10, Guard T4)

Plan: [Index](../2026-10-14-handel-2.md) · AK-H2-06 (a), 07 (Annehmen), 08–15, 26, 32 (Annehmen), **AK-H2-P1** (R633 T4) ·
Modell sonnet · ≈ 40 Tools

**Files:**

- Modify: `src/sim/orders.ts`
- Create: `tests/sim/farOrder-accept.test.ts`

**Interfaces:**

- Consumes: `farWorld`, `islandOf`, `stepAt`, `periodStart`, `dropKontor` (`tests/sim/farHelpers.ts`, T04); `farEligible` (T04).
- Produces: `export function acceptFarOrder(world: World): Result`; `deliverOrder` mit Ortsprüfung R6 und `farOffer = null`
  bei Erfolg. T07/T08 rufen genau diese Namen.

## Schritte

- [ ] **Step 1: Failing tests** — `tests/sim/farOrder-accept.test.ts`. Grundlage je Test: `w = farWorld(3, ['B'])`,
      `stepAt(w, periodStart(1))` (k = 1, `P = periodStart(1)`), `B = islandOf(w, 'B')`; `snap = serialize(w)` vor Fehlfällen.

- **AK-H2-08:** `acceptFarOrder(w)` → `{ ok: true }`; `w.order` gleich
  `{ period: 1, good: 'rum', amount: 15, reward: 450, due: P + FAR_ORDER_DURATION, island: B }`, `farOffer` `null`,
  `farSkip` `2`; `money` und alle Lager gleich vorher.
- **AK-H2-09** (je `serialize` unverändert): Sperre **und** kein Angebot (`farOffer = null`, `orders` gesperrt wie T04) →
  Grund gleich `functionLock(w, 'orders')`; kein Angebot → `'Kein Fernangebot'`; Angebot + Vertrag (konstruiert:
  `w.contract = { good: 'wood', amount: 1, price: 1, island: 0 }`) → `'Vertrag läuft'`; Angebot ohne Kontor
  (`dropKontor(w, B)`) → `'Kein Kontor auf Felsbucht'` (Name über `islandName(w, B)`). Das ist zugleich **AK-H2-07** (Annehmen).
- **AK-H2-P1 (R633 T4):** konstruiert `w.order = null`, Angebot bleibt, Kontor da, kein Vertrag → `acceptFarOrder` →
  `{ ok: false, reason: 'Kein Auftrag' }`, `serialize` unverändert (fünfte Prüfung, Plan-Entscheid P-B).
- **AK-H2-10:** nach dem Annehmen alle Häuser auf Stufe 1 (`setHouse(house, 1, 1)`) → `order` unverändert; Felsbucht-Lager
  Rum 15, `deliverOrder(w, B)` → Geld + 450.
- **AK-H2-11:** angenommen, Felsbucht-Lager Rum 20, `sellPct.rum` merken → `deliverOrder(w, B)` ok, Lager 5, Geld + 450,
  `order` `null`, `farOffer` `null`, `contractOffer` `{ good: 'rum', island: B }` (Stufe 3 ≥ `CONTRACT_MIN_TIER`),
  `sellPct.rum` gleich.
- **AK-H2-12:** angenommen, Heimatlager Rum 50 → `deliverOrder(w, HOME)` → `'Nur auf Felsbucht'`; ebenso mit
  `islandOf(w,'A')` und mit `9`; je `serialize` unverändert.
- **AK-H2-13:** angenommen, `dropKontor(w, B)`, Lager Rum 20 → `deliverOrder(w, B)` → `'Kein Kontor auf Felsbucht'`.
  Verfall ohne Strafe: Vergleichswelt `v = structuredClone(w)` mit `v.order = null`; beide `stepAt(.., P + FAR_ORDER_DURATION + 1)`
  → `w.order` `null`, `w.money - before === v.money - beforeV`.
- **AK-H2-14:** Felsbucht-Lager 14 → `'Nicht genug Ware auf Felsbucht'`, Lager bleibt 14.
- **AK-H2-15:** Boom auf Rum (`w.crisis = { period: 0, kind: 'boom', from: w.tick, until: w.tick + 100, good: 'rum' }` — Form
  per grep `crisisWindow` prüfen; alternativ ein gültiger Boom aus `beginCrisis`), `w.edict = 'trade'`,
  `w.goodLocks = [{ tier: 1, good: 'rum' }]` → Lieferung zahlt 450. Zweite Welt: Zufallsauftrag (nicht annehmen), Kontor auf
  Möweninsel (`farWorld(3, ['A','B'])`), Ware im Möweninsel-Lager → `deliverOrder(w, islandOf(w,'A'))` ok.
- **AK-H2-06 (a):** Zufallsauftrag mit Ware im Heimatlager liefern → `farOffer` `null` (R4 b).
- **AK-H2-26:** je Fern-Gut `g` (Stoff/Möweninsel Stufe 2, Rum/Felsbucht Stufe 3, Glas/Weidenau Stufe 4): `w.edict = 'trade'`,
  `buyPct` 100, Geld 10 000, Lager 0; annehmen, `buy(w, g, far, i)` ok, `deliverOrder(w, i)` ok → `money` danach < davor,
  Differenz `−40`, `−30`, `−36` (Spec). Weicht eine Zahl ab: **stoppen**, Bericht an den Controller (Spec-Rechnung, L0).
- **AK-H2-32 (Annehmen):** laufender Vertrag, `farOffer` `null` → `acceptFarOrder` → `'Kein Fernangebot'`.

- [ ] **Step 2: Rot-Beleg** — `npx vitest run tests/sim/farOrder-accept.test.ts; echo EXIT=$?` → `EXIT=1`.

- [ ] **Step 3: Umsetzen** — `src/sim/orders.ts`, Import `FAR_ORDER_DURATION`:

```ts
/**
 * Nimmt das Fernangebot an (R5): ersetzt den Zufallsauftrag der Periode durch den Fernauftrag mit langer Frist und
 * sperrt die Folgeperiode. Prüfreihenfolge Sperre, Angebot, Vertrag, Kontor, Auftrag (Guard, Plan T4); kostet nichts.
 */
export function acceptFarOrder(world: World): Result {
  const lock = functionLock(world, 'orders');
  if (lock !== null) return fail(lock);
  const offer = world.farOffer;
  if (offer === null) return fail('Kein Fernangebot');
  if (world.contract !== null) return fail('Vertrag läuft');
  const noKontor = noKontorTrade(world, offer.island);
  if (noKontor !== null) return fail(noKontor);
  const o = world.order;
  if (o === null) return fail('Kein Auftrag');
  world.order = {
    period: o.period,
    good: offer.good,
    amount: offer.amount,
    reward: offer.reward,
    due: ORDER_FIRST_TICK + o.period * ORDER_PERIOD + FAR_ORDER_DURATION,
    island: offer.island,
  };
  world.farOffer = null;
  world.farSkip = o.period + 1;
  return ok;
}
```

`deliverOrder`: direkt nach `if (o === null) return fail('Kein Auftrag');`

```ts
if (o.island !== undefined && island !== o.island)
  return fail(`Nur auf ${islandName(world, o.island)}`);
```

und nach `world.order = null;` → `world.farOffer = null;`. Sonst nichts an `deliverOrder` ändern (R10: kein `sellPct`,
kein `goodLocks`). Kommentar der Funktion um R6 ergänzen.

- [ ] **Step 4: Grün** — `npx vitest run tests/sim/farOrder-accept.test.ts tests/sim/farOrder-offer.test.ts
tests/sim/farOrder-save.test.ts tests/sim/contract.test.ts tests/sim/orders.test.ts tests/sim/balance.test.ts; echo EXIT=$?`
      → 0; `npx tsc --noEmit; echo EXIT=$?` → 0.

- [ ] **Step 5: Commit** — `git commit -m "feat: Fernauftrag annehmen und am Fern-Kontor liefern (Handel 2 T05)"`.

## Abnahme

- Jeder Fehlfall prüft `serialize` vorher = nachher. Reihenfolge der Gründe genau wie oben.
- `farSkip` wird hier nur gesetzt; verbraucht wird er in `tickOrders` (T04 Schritt 4), Periodenfolge prüft T06.
- Bericht: Rot-Beleg, Exit-Codes, die drei gemessenen AK-26-Differenzen.
