# T01 · `previewOrder` (Sim-Lesefunktion, I-102)

Umsetzer `tech-sim-engineer` · ≈ 40 Tools · I102 AK-1, 2, 3, 4, 5, 7a, 9 · blocked-by: T00

## Dateien

- ändern: `src/sim/orders.ts` (neue exportierte Funktion), `tests/sim/orders.test.ts` (neue `describe('previewOrder')`)
- nicht ändern: `types.ts`, `defs/`, `save.ts`; kein neues Feld, kein RNG-Zustand

## Verhalten

```ts
/** Vorschau des nächsten Zufallsauftrags (nur Gut); reine Lesefunktion, kein RNG-Vorziehen (ADR-010). */
export function previewOrder(world: World): { tick: number; good: GoodId } | null;
```

1. `null`, wenn `world.contract !== null` oder `world.contractOffer !== null` oder `functionLock(world, 'orders') !== null` (Import vorhanden, Z. 14).
2. `tick = nextOrderTick(world)` (springt über `farSkip`), `k = (tick - ORDER_FIRST_TICK) / ORDER_PERIOD`, `good = orderForPeriod(world.seed, k, maxHouseTier(world)).good`. Nur `good` zurück, Menge/Prämie nie.
3. Keine Schreibzugriffe auf `world`; kein `createRng` ausserhalb `orderForPeriod`.

## Testfälle (rot zuerst; Beleg im Bericht)

Hilfen: `runTo(world, tick)` und `createWorld`/`home` stehen in `tests/sim/orders.test.ts`; Seeds aus `ORDER_PINS` nur falls nötig. Erwartungen für Zeit: Ticks als Zahlen (Sim-Test, kein Text).

- **AK-1** Ticks vor `ORDER_FIRST_TICK`, in der Lücke (`ORDER_FIRST_TICK + ORDER_DURATION + 1`) und mitten im Auftrag: `tick === nextOrderTick(world)`, `good === orderForPeriod(seed, k, maxHouseTier(world)).good`.
- **AK-2** `JSON.stringify(world)` vor/nach zwei Aufrufen gleich, beide Ergebnisse gleich; `runTo` bis zum Angebot: `world.order.good === Vorschau.good` (gleiche Stufe).
- **AK-3** Stufenaufstieg: Welt mit `maxHouseTier` 1, danach Haus Stufe 2 (Gebäude-Aufbau wie bestehende Tests für `maxHouseTier`) → Vorschau entspricht `orderPool(2)`-Auftrag; Abriss senkt zurück; das Angebot nutzt die Stufe zum Angebotszeitpunkt (Stufenwechsel vor dem Angebot ändert das Gut, soweit der Seed die Pools unterscheidet: Seed so wählen, dass `orderForPeriod(seed,k,1).good !== orderForPeriod(seed,k,2).good`, sonst Seed-Suche im Test festschreiben).
- **AK-4** Laufender Vertrag → `null`; offenes Angebot → `null`; Funktion gesperrt → `null`; nach `cancelContract` wieder Wert.
- **AK-5** Sperrperiode: nach `acceptFarOrder` (Hilfen `foundKontor2Literal`, `seaWorld`) zeigt die Vorschau `tick = ORDER_FIRST_TICK + (period + 2) * ORDER_PERIOD` und das Gut dieser Periode; nach Lieferung (`world.order === null`) ebenfalls nicht die gesperrte Periode.
- **AK-7a** Zwei Weltkopien, eine mit Aufrufen von `previewOrder` in jedem Schritt, gleiche `step`-Folge: `JSON.stringify` bitgleich. `tests/sim/balance.test.ts` unberührt und grün.
- **AK-9** `git diff main -- src/sim/types.ts src/sim/defs` leer.

## Prüfschritte / Task-Review

Reviewer: Funktion schreibt nichts; keine Wertkonstante, kein Zufall ausserhalb `orderForPeriod`; `tsc`, `make lint` Exit 0; `make zeittests`, `make conflicts` vor «bereit».
