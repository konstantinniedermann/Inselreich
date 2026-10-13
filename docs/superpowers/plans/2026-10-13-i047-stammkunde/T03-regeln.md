# T03 — Regeln R1–R12 und `StepReport.contract` (AK-SK-01…20, 24, 25)

Paket I047-SIM, Task (b) aus R584 Tech 2. Persona `tech-sim-engineer`, Fortsetzung nach T02. Schätzung ≈ 25 Tools.
Dateien: `src/sim/orders.ts`, `src/sim/tick.ts`, `src/sim/types.ts` (Ereignistyp), `tests/sim/contract.test.ts`,
`tests/sim/tick.test.ts` (eine Zeile), `docs/arc42.md` Bausteine/Laufzeit (D1).

## Kontext (nur das)

Spec B.2 R1–R12 (Wortlaut im Briefing), `orders.ts` (94 Zeilen: `tickOrders`, `deliverOrder`, `nextOrderTick`),
`tick.ts` (`StepReport { lost }`, `tickOrders` zwischen `tickMarket` und `tickCrises`), `trade.ts:85`
`noKontorTrade` (liefert «Kein Kontor auf <Insel>»), `placement.ts:23` `islandAt`, `unlocks.ts:97` `functionLock`.
Testhilfen: `createWorld(3, { unlockAll: true })`, `seaWorld()`/`foundKontor2Literal(w, 1)` (`seaHelpers.ts`),
`startColony`/`runColony` (`controller.ts:359/376`, Parameter `stop` wird jeden Schritt gerufen).

## Typen (`types.ts`) und Rückgabe

```ts
export type ContractBreakReason = 'lock' | 'island' | 'kontor' | 'stock';
/** Vertragsereignis eines Schritts (R12), nur im StepReport, nie im Save. `island` = Lieferinsel (Entwurf L0 1). */
export type ContractEvent =
  | { kind: 'delivered'; good: GoodId; amount: number; pay: number; island: number }
  | { kind: 'broken'; good: GoodId; reason: ContractBreakReason; penalty: number; island: number };
```

`tickOrders(world: World): ContractEvent | null` (bisher `void`; Aufrufer in `orders.test.ts`/`unlocks.test.ts`
ignorieren den Wert weiter). `StepReport` wird `{ lost: ShipLoss[]; contract: ContractEvent | null }`; `step` setzt
`const contract = tickOrders(world);` an der bisherigen Stelle und gibt `{ lost, contract }` zurück.
`tests/sim/tick.test.ts:201` → `toEqual({ lost: [], contract: null })`.

## Tests zuerst (Rot-Beleg) — `tests/sim/contract.test.ts`

Hilfen im Test: `periodStart(k) = ORDER_FIRST_TICK + k * ORDER_PERIOD`; `toTick(w, t)` setzt `w.tick = t - 1` vor dem
Schritt; `twin(w)` = `deserialize(serialize(w))` als Vergleichslauf. Stufe 3 über ein Haus mit `house.tier = 3`
(`putBuilding` aus `helpers.ts`) oder ein vorhandenes Wohnhaus anheben. Beispielgut Rum (m 5, p 27, V 135, P 135).

- [ ] **01** Stufe 3, aktiver Rum-Auftrag, Lager ≥ Menge: `deliverOrder` ok → `contractOffer = { good: 'rum', island:
HOME }`; Lieferung auf Insel 1 (Kontor dort) → `island: 1`.
- [ ] **02** Höchststufe 2 → Angebot bleibt `null`. **03** zu wenig Ware → `fail`, `serialize` unverändert.
- [ ] **04** Lieferung bei `T − 300`: Schritte bis `T − 1` → Angebot besteht; nach Schritt `T` → `null`, `order` ist
      `orderForPeriod(seed, k, maxHouseTier)` (Felder `good`, `amount`, `reward`).
- [ ] **05** `contract` gesetzt, konstruiert `order` aktiv, `deliverOrder` ok → `contractOffer` bleibt `null`;
      `acceptContract` ohne Angebot → `fail('Kein Angebot')`.
- [ ] **06** `declineContract`: mit Angebot ok, `contractOffer null`, übriges `serialize` gleich; ohne → `fail('Kein
Angebot')`.
- [ ] **07** `acceptContract` → `contract = { good: 'rum', amount: 5, price: 27, island: HOME }`, Angebot `null`;
      Schleife über alle Auftragsgüter: `amount = order.contract`, `price = contractUnitPrice(g)`.
- [ ] **08** Angebot auf Insel ohne Kontor → `fail('Kein Kontor auf …')`, `serialize` gleich; `orders` gesperrt
      (`unlocked` ohne Freischaltung, konstruiert) → Sperrgrund, `serialize` gleich.
- [ ] **09** Lager 12, Geld 1000, Schritt auf `T`: Lager 7, Geld = Vergleichslauf (ohne Vertrag) + 135, `order null`,
      Vertrag besteht, `report.contract = { kind: 'delivered', good: 'rum', amount: 5, pay: 135, island: HOME }`;
      zwischen zwei Periodenbeginnen keine Abbuchung. Inselfall: Vertrag Insel 1, Heimat Rum 0, Insel 1 Rum 12 →
      Insel 1 danach 7, Heimat 0.
- [ ] **10** Lager genau 5 → Lieferung, Lager 0, Vertrag besteht.
- [ ] **11** Boom Rum (`crisis = { period, kind: 'boom', from: 0, until: 99999, good: 'rum' }`) und `edict = 'trade'`
      → `pay` 135, `sellPct.rum` unverändert; `goodLocks` auf Rum → Lieferung findet statt.
- [ ] **12** Lager 0 → Geld = Vergleichslauf − 135, `contract null`, `order` gleich `orderForPeriod(seed, k,
maxHouseTier)`, `report.contract.kind 'broken'`, `reason 'stock'`, `penalty 135`; nach Bruch und nach Lieferung
      `contractOffer null`. **13** Lager 4 → Bruch, Lager bleibt 4.
- [ ] **14** Vertrag Insel 1, dort Kontor abgerissen (`demolishBuilding` oder `kontorId = null` konstruiert), Lager
      ausreichend → `reason 'kontor'`, Lager unverändert.
- [ ] **15** `orders` gesperrt und Lager 0 → `reason 'lock'`; `cancelContract` bei Sperre → ok, kein Geldabzug.
- [ ] **16** Geld −50: Bruch → Vergleichslauf − 135 (negativ); Lieferung bei −50 zahlt 135.
- [ ] **17** Für jedes Auftragsgut: Bruch-`penalty` = `Math.ceil(m * p * CONTRACT_PENALTY_PCT / 100)`.
- [ ] **18** `cancelContract` mitten in der Periode → ok, Geld gleich, `order null` bis `T`, bei `T` Zufallsauftrag;
      ohne Vertrag → `fail('Kein Vertrag')`. `contract.island = islands.length` konstruiert → Schritt `T` →
      `reason 'island'`, Strafe abgezogen, kein Wurf.
- [ ] **19** `tick = T − 1`, `cancelContract`, `step` → keine Abbuchung, kein Abzug, Zufallsauftrag aktiv. Gegenprobe:
      `step` auf `T` (Lieferung), dann `cancelContract` → Lager/Geld wie nach Lieferung, `nextOrderTick(w) === T +
ORDER_PERIOD`, bis dahin `order null`.
- [ ] **20** Stufe nach Annehmen auf 2 senken → nächste Lieferung findet statt.
- [ ] **24** Zwei Läufe gleicher Seed, Folge Liefern → Annehmen → 5 Perioden → Lager leeren → Bruch → neuer Auftrag
      liefern → Annehmen → Kündigen: `serialize` bitgleich.
- [ ] **24b (R11)** Zufallsauftrag der Periode `k` nach einem Vertrag gleich `orderForPeriod(seed, k, maxHouseTier)`.
- [ ] **AK-SK-27 echt:** in T01-Test die rechnerische Gutschrift durch eine echte Lieferung (Vertrag gesetzt, Schritt
      auf `T`, Geld gegen Vergleichslauf) ersetzen.
- [ ] **25 Controller:** `w = createWorld(3)`, `{ layout, t } = startColony(w)`, `runColony(w, layout, t, {}, (x) => {
if (x.contract !== null || x.contractOffer !== null) seen++; return false; })` → `seen === 0`, Endwelt beide
      `null`. Zusätzlich `readFileSync('tests/sim/controller.ts')` enthält weder `deliverOrder` noch `acceptContract`.
      Laufzeit im Bericht; `balance.test.ts` unverändert.
- [ ] `npx vitest run tests/sim/contract.test.ts tests/sim/tick.test.ts; echo EXIT=$?` → `EXIT=1`, Beleg.

## Umsetzung (`orders.ts`)

- [ ] R1 in `deliverOrder` nach erfolgreicher Abbuchung: `if (world.contract === null && maxHouseTier(world) >=
CONTRACT_MIN_TIER) world.contractOffer = { good: o.good, island };` Rückgabe `ok`.
- [ ] R3 `acceptContract(world): Result` — Reihenfolge `functionLock` → `'Kein Angebot'` → `noKontorTrade(world,
offer.island)`; Erfolg: `contract = { good, amount: GOODS[good].order!.contract, price: contractUnitPrice(good),
island }`, `contractOffer = null`. Keine Stufenprüfung.
- [ ] R4 `declineContract`, R5 `cancelContract` (ohne Sperrprüfung, kein Geld, `order` bleibt).
- [ ] `tickOrders` (R2, R6, R7, R10, R11), Ablauf:

```ts
const t = world.tick;
if (world.order !== null && t > world.order.due) world.order = null;
if (t < ORDER_FIRST_TICK || (t - ORDER_FIRST_TICK) % ORDER_PERIOD !== 0) return null;
world.contractOffer = null; // R2: erster Schritt am Periodenbeginn
const ev = world.contract === null ? null : settleContract(world); // R6/R7
if (ev?.kind === 'delivered') return ev; // kein Zufallsauftrag in dieser Periode
if (world.order === null) {
  /* Zufallsauftrag wie bisher, orderForPeriod(seed, k, maxHouseTier) */
}
return ev;
```

- [ ] `settleContract` (nicht exportiert): Bruchgrund in der Reihenfolge `lock`, `island`, `kontor`, `stock` (erste
      zutreffende); Lieferung `stock -= amount`, `money += amount * price`; Bruch `money -= contractPenalty(c)`,
      `contract = null`. Liest nie `sell`, `sellPct`, `buyPct`, Edikt, Boom, `goodLocks`.

- [ ] Ohne Vertrag bleibt der Verlauf bitgleich: `orders.test.ts`, `unlocks.test.ts`, `seaGolden.test.ts`,
      `balance*.test.ts` grün ohne Änderung.
- [ ] `docs/arc42.md`: Bausteinzeile `orders.ts` (Vertrag, drei Aktionen), `tick.ts` (`StepReport.contract`),
      Laufzeit-Zeile `tickOrders` (Angebot löschen → Vertrag → Zufallsauftrag; jetzt mit Geld und Lager beim Vertrag).
- [ ] Grün: `npx vitest run tests/sim/contract.test.ts tests/sim/tick.test.ts tests/sim/orders.test.ts
tests/sim/unlocks.test.ts tests/sim/save-contract.test.ts tests/ui/ships.test.ts; echo EXIT=$?` → `EXIT=0`;
      `npx tsc --noEmit; echo EXIT=$?` → `EXIT=0`.
- [ ] Commit `feat: Stammkunde-Regeln R1–R12 und StepReport.contract (AK-SK-01…20/24/25)`.

## Hinweis

Lehnt L0 Entwurf 1 (`island` im Ereignis) ab, entfällt das Feld; der Kontor-Text in T04 nutzt dann keinen Inselnamen.
