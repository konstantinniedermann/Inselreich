# T06 · Periodenfolge, Rundreise, Fristbeleg (R7, R8, R11)

Plan: [Index](../2026-10-14-handel-2.md) · AK-H2-16…19 (inkl. R633 A3), 23, 27, 31 · Modell sonnet · ≈ 55 Tools

**Files:**

- Modify: `src/sim/orders.ts` (nur `nextOrderTick`, R11)
- Create: `tests/sim/farOrder-period.test.ts` (AK-16…19, 23), `tests/sim/farOrder-sea.test.ts` (AK-27, 31)

**Interfaces:**

- Consumes: `acceptFarOrder`, `deliverOrder` (T05); `farWorld`, `islandOf`, `stepAt`, `periodStart`, `dropKontor` (T04);
  Seed-3-Seewege aus T01 (Zahlen als Konstante kopieren: `const SEED3_LANES = { A: …, B: …, C: … }` mit Verweis auf
  `farOrder-defs.test.ts`).
- Produces: `nextOrderTick(world)` überspringt die gesperrte Periode. T07 (UI «Nächster Auftrag in m:ss») nutzt das.

## Schritte

- [ ] **Step 1: Failing tests** — `tests/sim/farOrder-period.test.ts`. Grundlage: `w = farWorld(3, ['B'])`,
      `stepAt(w, periodStart(1))`, `acceptFarOrder(w)` ok, `P = periodStart(1)`, `B = islandOf(w,'B')`.

- **AK-H2-16:** `stepAt(w, periodStart(2))` → `order` weiter der Fernauftrag, `farOffer` `null`, `farSkip` `null`. Uhr auf
  `P + 1700` stellen (`stepAt(w, P + 1700)`), Lager Rum 15 auf B → `deliverOrder(w, B)` ok (Gegenprobe in einer Kopie).
  Ohne Lieferung `stepAt(w, P + 1701)` → `order` `null`. `stepAt(w, periodStart(3))` → `order` gleich
  `{ period: 3, ...orderForPeriod(3, 3, maxHouseTier(w)), due: periodStart(3) + ORDER_DURATION }`, `farOffer` gesetzt (R3).
- **AK-H2-17:** annehmen, Lager 15, `stepAt(w, P + 100)`, `deliverOrder(w, B)` ok → `nextOrderTick(w) === periodStart(3)`;
  `stepAt(w, periodStart(2))` → `order`, `farOffer`, `farSkip` `null`; `stepAt(w, periodStart(3))` → Zufallsauftrag.
- **AK-H2-18:** früh geliefert (wie 17) → `contractOffer` gesetzt → `acceptContract(w)` ok (Rum auf B); Lager Rum B 0 →
  `stepAt(w, periodStart(2))`: Report-Ereignis `broken`, Geld − Strafe (`contractPenalty`), **kein** Zufallsauftrag, kein
  Fernangebot; `stepAt(w, periodStart(3))` → Zufallsauftrag. Variante mit Rum ≥ Vertragsmenge → bei `periodStart(2)` Lieferung wie
  I-047 (`delivered`). (Wie der Report das Vertragsereignis trägt: `tests/sim/contract.test.ts` grep `broken`.)
- **AK-H2-19 + A3 (R633):** Rundreise `r = deserialize(serialize(x))`, `r.ok`, `serialize(r.world) === serialize(x)`, danach
  Original und Geladenes je 3 Perioden nur `step` (bis `x.tick + 3 * ORDER_PERIOD`), `serialize` gleich. Stände:
  (1) offenes Fernangebot (vor dem Annehmen); (2) laufender Fernauftrag (nach dem Annehmen); (3) `farSkip` gesetzt nach früher
  Lieferung; (4) **A3:** früh geliefert + Vertrag angenommen, Tick `P + 500` (`farSkip` und `contract` zugleich);
  (5) **A3:** derselbe Lauf mitten in der gesperrten Periode, Tick `periodStart(2) + 450` (Vertrag läuft, kein Auftrag).
- **AK-H2-23:** Funktion `script(seed)` mit fester Folge: Angebot in k = 1 annehmen, Rum auf B legen, liefern, 6 Perioden
  `step`, in Periode 3 erneut annehmen und verfallen lassen → zwei Läufe gleiches `serialize`. Kein `Math.random`.

`tests/sim/farOrder-sea.test.ts`:

- **AK-H2-27 (Fristbeleg, R629 c):** je `kind` A, B, C: `w = farWorld(4, [kind])` (also `farEligible = [i]`),
  `L = laneTicks(w.islands, 0, i)` gleich `SEED3_LANES[kind]`, Heimatlager Gut der Insel 50, Schiff anlegen (`buyShip`, Geld
  setzen; dann Felder setzen). Uhr so, dass der nächste Periodenbeginn `P` kommt; Schritte bis `w.tick = P + 600`.
  - **Fall A:** `setRoute(w, id, { a: 0, b: i, ab: [{ good, reserve: 0 }], ba: [] })`, dann Schiff `port: i, to: 0,
left: L, cargo: {}`; `acceptFarOrder` ok; `step` bis Lager auf i ≥ Menge → dieser Tick `=== P + 600 + 2 * L` und
    `≤ P + FAR_ORDER_DURATION`; `deliverOrder(w, i)` ok.
  - **Fall B:** Route `{ a: 0, b: i, ab: [], ba: [{ good: 'spice', reserve: 0 }] }`, Schiff `port: 0, to: i, left: L`;
    `acceptFarOrder`, dann `updateRoute(w, id, { …, ab: [{ good, reserve: 0 }] })` → erster Tick mit Lager ≥ Menge
    `=== P + 600 + 3 * L`; `expect(tick <= P + FAR_ORDER_DURATION).toBe(kind !== 'B')` für A und C `true`; für B den
    gemessenen Wahrheitswert festhalten (Spec: Felsbucht d 37–40 darf `false` sein, O-4).
  - Weicht ein Tick um ±1 von der Formel ab (Liegezeit, Reihenfolge in `step`): **stoppen**, Bericht an den Controller —
    Spec §5 nimmt «keine Liegezeit» an, die Abweichung entscheidet L0.
- **AK-H2-31 (A2, Anhang 03):** (a) Seed 963: `w = farWorld(4, ['C'], 963)`; Stufe 3 belegen wie `islands-c.test.ts`
  (`generateForeignIslands(963, …, { onStage })` meldet für C `[3]`) und `laneTicks(w.islands, 0, C) / SHIP_TICKS_PER_SEA_TILE

  > dMax(C)`. Periodenbeginn → `farOffer = { island: C, good: 'glass', amount: 12, reward: 444 }`; annehmen → `due = P + 1700`;
Glas 12 auf C → `deliverOrder(w, C)`ok, Geld + 444. Gegenprobe ohne Lieferung:`stepAt(.., P + 1701)`→`order` `null`,
Geldänderung gleich Vergleichslauf mit `order = null`(wie AK-H2-13). (b) Seed 3,`farWorld(3, ['A','B'])`, Fernauftrag Rum
nach B, Rum 15 im Lager von A, Route `{ a: A, b: B, ab: [{ good: 'rum', reserve: 0 }], ba: [] }`mit Schiff in A;`deliverOrder(w, A)`→`'Nur auf Felsbucht'`; `step`bis Lager B ≥ 15 →`deliverOrder(w, B)`ok. Kein Test garantiert die
Lieferung vor`due` (bekannte Grenze).

- [ ] **Step 2: Rot-Beleg** — `npx vitest run tests/sim/farOrder-period.test.ts tests/sim/farOrder-sea.test.ts; echo EXIT=$?`
      → `EXIT=1` (mindestens AK-17 über `nextOrderTick`; welche Tests schon grün sind, im Bericht auflisten — sie belegen T04/T05).

- [ ] **Step 3: Umsetzen** — `nextOrderTick`:

```ts
/** Tick des nächsten Auftragsangebots; überspringt die nach einem Fernauftrag gesperrte Periode (R11). */
export function nextOrderTick(world: World): number {
  const t = world.tick;
  if (t < ORDER_FIRST_TICK) return ORDER_FIRST_TICK;
  const k = Math.floor((t - ORDER_FIRST_TICK) / ORDER_PERIOD) + 1;
  return ORDER_FIRST_TICK + ORDER_PERIOD * (k === world.farSkip ? k + 1 : k);
}
```

- [ ] **Step 4: Grün** — beide neuen Dateien plus `tests/sim/farOrder-*.test.ts tests/sim/orders.test.ts
tests/sim/contract.test.ts tests/sim/ships.test.ts tests/sim/balance.test.ts; echo EXIT=$?` → 0 (Datei `ships.test.ts` nur
      falls vorhanden, sonst `grep -l setRoute tests/sim`). `npx tsc --noEmit; echo EXIT=$?` → 0. Laufzeit je neue Datei nennen.

- [ ] **Step 5: Commit** — `git commit -m "feat: gesperrte Folgeperiode, Rundreise und Fristbeleg Seed 3 (Handel 2 T06)"`.

## Abnahme

- AK-27 Fall A gepinnt mit den T01-Werten; Fall B Felsbucht-Ergebnis im Bericht und als Zeile für Anhang 01 W.2 (Controller trägt
  den Nachtrag ins Ledger, Spec-Nachtrag durch lead-design nur bei Abweichung).
- Keine Änderung an `tickOrders`; R7 kam in T04 (falls ein Test hier einen Fehler in T04 zeigt: Fix in `orders.ts`, im Bericht).
