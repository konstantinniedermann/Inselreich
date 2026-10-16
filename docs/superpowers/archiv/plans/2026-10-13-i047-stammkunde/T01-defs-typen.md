# T01 — Defs, Typen, Invarianten (AK-SK-26, AK-SK-27)

Paket I047-SIM, Task (a). Persona `tech-sim-engineer`. Dateien: `src/sim/types.ts`, `src/sim/defs/goods.ts`,
`src/sim/orders.ts` (nur zwei reine Helfer), `tests/sim/contract.test.ts` (neu). Kein Save, kein Verhalten.
Schätzung ≈ 15 Tools.

## Kontext (nur das)

- `src/sim/defs/goods.ts`: `GOODS` mit `order: { tier, min, max }`, `ORDER_PREMIUM = 0.75`, `STORAGE_CAP = 100`.
- `src/sim/types.ts:87` `OrderDef`, `World` ab Zeile 252 (letzter Schlüssel heute `buyPct`).
- `src/sim/orders.ts`: `orderUnitReward(good) = floor(buy × ORDER_PREMIUM)`.
- `src/sim/trade.ts:92` `buy(world, good, n, island)`; Edikt Handel `world.edict = 'trade'` (`EdictId`).
- Werte (Spec B.3, Anhang W.1): `CONTRACT_PREMIUM = 0.68`, `CONTRACT_PENALTY_PCT = 100`, `CONTRACT_MIN_TIER = 3`;
  `order.contract`: Holz 23, Nahrung 28, Stein 14, Wolle 17, Stoff 7, Zuckerrohr 17, Rum 5, Glas 4.

## Tests zuerst (Rot-Beleg)

Neue Datei `tests/sim/contract.test.ts`, `describe('AK-SK-26 Werte und Invarianten')`; für **jedes** Gut `g` mit
`GOODS[g].order` (Schleife über `GOOD_IDS`, keine Liste im Test):

- [ ] `p = contractUnitPrice(g)` ist `Math.floor(GOODS[g].buy * CONTRACT_PREMIUM)`; `p < orderUnitReward(g)`;
      `p < 0.8 * GOODS[g].buy` (streng).
- [ ] `m = GOODS[g].order.contract`: `Number.isInteger(m)`, `1 ≤ m ≤ STORAGE_CAP`; `V = m × p` mit `135 ≤ V ≤ 140`.
- [ ] `contractPenalty({ good: g, amount: m, price: p, island: HOME })` ist
      `Math.ceil((m * p * CONTRACT_PENALTY_PCT) / 100)` (AK-SK-17 wird in T03 über `tickOrders` geprüft).
- [ ] Konstanten: `CONTRACT_PREMIUM === 0.68`, `CONTRACT_PENALTY_PCT === 100` und `≥ 1`, `CONTRACT_MIN_TIER === 3` und
      `TIER_IDS` (bzw. die Stufenliste aus `defs/tiers`) enthält sie.
- [ ] Mengen-Pin: Objekt `{ wood: 23, food: 28, stone: 14, wool: 17, cloth: 7, cane: 17, rum: 5, glass: 4 }` gleich den
      Def-Werten (Schutz gegen versehentliches Nachstellen; Änderung nur per Ruling, Spec B.5).
- [ ] Rum-Beispiel: `contractUnitPrice('rum') === 27`, `V === 135`, Strafe `135`.
- [ ] Werkzeug, Gewürz: `GOODS.tools.order === undefined` (kein Vertragsgut).

`describe('AK-SK-27 Kaufen und Liefern nie Gewinn')`: für jedes Auftragsgut eine Welt `createWorld(3, { unlockAll:
true })`, `edict = 'trade'`, Geld 10 000, Lager des Guts 0:

- [ ] `const before = w.money; expect(buy(w, g, m).ok).toBe(true);` dann **nur rechnerisch** die Vertragszahlung
      `m × contractUnitPrice(g)` gutschreiben (die Regel kommt in T03; T03 ersetzt diese Zeile durch eine echte
      Lieferung über `tickOrders`, siehe T03). Erwartung: `w.money < before`, Verlust zwischen 24 und 46 (W.3).
- [ ] `npx vitest run tests/sim/contract.test.ts; echo EXIT=$?` → `EXIT=1` (Import fehlt), Beleg in den Bericht.

## Umsetzung

- [ ] `types.ts`: `OrderDef` um `contract: number` (Pflicht, JSDoc «Menge je Vertragslieferung, I-047»). Neue Typen
      (noch ohne `World`-Felder, die kommen in T03/T03):

```ts
/** Liefervertrag (I-047): Menge und Stückpreis beim Annehmen festgeschrieben. */
export interface Contract {
  good: GoodId;
  amount: number;
  price: number;
  island: number;
}
/** Angebot nach einer Auftragslieferung, gilt bis zum nächsten Periodenbeginn. */
export interface ContractOffer {
  good: GoodId;
  island: number;
}
```

- [ ] `defs/goods.ts`: drei Konstanten neben `ORDER_PREMIUM` mit JSDoc; `contract` in den acht `order`-Einträgen.
- [ ] `orders.ts`: `export function contractUnitPrice(good: GoodId): number` (`Math.floor(GOODS[good].buy *
CONTRACT_PREMIUM)`) und `export function contractPenalty(c: Contract): number` (`Math.ceil((c.amount * c.price *
CONTRACT_PENALTY_PCT) / 100)`) — der Bruch nutzt die beim Annehmen festgeschriebenen Werte des Vertrags.
- [ ] Prüfen, dass kein anderer Ort `OrderDef` literal baut: `grep -rn "min:.*max:" src tests --include=*.ts`
      (Treffer mit `order`-Bezug um `contract` ergänzen, sonst `tsc` rot).
- [ ] Grün: `npx vitest run tests/sim/contract.test.ts tests/sim/orders.test.ts tests/sim/defs.test.ts; echo EXIT=$?`
      → `EXIT=0`; `npx tsc --noEmit; echo EXIT=$?` → `EXIT=0`.
- [ ] `tests/sim/balance.test.ts` unangetastet (`git diff --stat -- tests/sim/balance.test.ts` leer).
- [ ] Commit `feat: Stammkunde-Werte und Vertragstypen (AK-SK-26/27)`.

## Bericht (an den Controller)

Rot-/Grün-Exit-Codes, Commit-Hash, Abweichungen. Keine Agenten starten.
