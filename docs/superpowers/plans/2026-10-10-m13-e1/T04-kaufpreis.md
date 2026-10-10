# T04 · `buyPrice(world, good, n)` mit Edikt Handel, mechanische Aufrufer (TDD)

Strang sim · Worktree `.worktrees/m13-e1-sim` · Umsetzer `tech-sim-engineer` (sonnet, Fortsetzung) · AK-M13E1-09, 10, 13 (Kaufpreis-Teil), 21 · Spec R4, Anhang 01 C, Anhang 03 E, R455 T-B1, R456 · blocked-by T03 · Grösse S (≈ 20 Tools)

**Files:**

- Modify: `src/sim/trade.ts` (`buyPrice`, Aufruf in `buy`), `tests/sim/edicts.test.ts` (neuer `describe`)
- **Mechanisch**, nur `buyPrice(x, n)` → `buyPrice(w, x, n)` ohne jede andere Änderung: `tests/sim/trade.test.ts` (Z. 88), `tests/sim/controller.ts` (Z. 181, 191–193), `tests/sim/merchantsController.ts` (Z. 141, 160, 176, 223), `tests/sim/balance-upgrade.test.ts` (Z. 23, R456: einzige Ausnahme vom leeren `balance*`-Diff), `src/ui/app.ts` (`tradeCtx`, nach REL-17 ≈ Z. 838–840, per Symbolsuche `grep -n tradeCtx` finden: `buyPrice(world, good, n)`), `src/ui/trade.ts` (Z. 105 und Z. 158: `buyPrice(world, good, n)`). Danach berührt der Sim-Strang `src/ui/` nicht mehr (Entscheid E3).
- Lesen: `src/sim/orders.ts` (`orderUnitReward`, `GOODS[g].order`), `src/sim/defs/crises.ts` (`BOOM_PCT`), `tests/sim/crises.test.ts` (Boom-Objekt)

## Schnittstelle

```ts
/** Kaufpreis für n Stück; mit wirkendem Edikt Handel (`buyPct < 100`) über die Gesamtmenge aufgerundet (Spec R4). */
export function buyPrice(world: World, good: GoodId, n: number): number {
  const pct = activeEdictDef(world)?.buyPct ?? 100;
  const base = n * GOODS[good].buy;
  return pct < 100 ? Math.floor((base * pct + 99) / 100) : base; // ganzzahlig, = ⌈base·pct/100⌉
}
```

Ohne wirkendes Edikt exakt `n × buy` (bitgleich, R1.3). `buy` nutzt `buyPrice(world, good, n)`; Auftragsprämie und `sellPrice` bleiben unverändert.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot).** In `tests/sim/edicts.test.ts` `describe('M13-E1 Kaufpreis Handel')`, Welt `edictWorld()` aus T03, `setEdict(w, 'trade')`:
  1. `AK-M13E1-09`: Nahrung 1 → 7, 10 → 64; Glas 10 → 400; Gewürz 1 → 32; ohne Edikt Nahrung 10 → 80; `buy(w, 'food', 10)` mit Handel senkt `money` um 64 (Lager vorher unter `STORAGE_CAP − 10`); Handel erlassen, Amtsstube `outageUntil` gesetzt → Nahrung 10 → 80 (**AK-M13E1-13** Kaufpreis-Teil; ebenso Amtsstube nicht angebunden).
  2. `AK-M13E1-10` Arbitrage: Tabelle Anhang 01 C für n = 1 exakt (Spalte «n = 1»); für alle `GOOD_IDS` und n ∈ {1, 10, 100}: `buyPrice(w, g, n) > n × orderUnitReward(g)` für Güter mit `GOODS[g].order`, und `> sellPrice(w′, g, n)` in einer Welt `w′` mit `crisis = { kind: 'boom', good: g, … }` (gültige Form wie `crises.test.ts`) und `sellPct[g] = 100`.

```bash
npx vitest run tests/sim/edicts.test.ts; echo EXIT=$?   # rot: Signatur buyPrice(world, …) fehlt (tsc-/Laufzeitfehler)
```

- [ ] **Schritt 2: Umsetzen** in `trade.ts`, dann alle Aufrufer mechanisch umstellen (`npx tsc --noEmit` findet jeden). Keine Controller-Strategie ändern (Spec §2).

```bash
npx vitest run tests/sim/edicts.test.ts tests/sim/trade.test.ts tests/sim/balance.test.ts tests/sim/balance-merchants.test.ts tests/sim/balance-upgrade.test.ts tests/sim/orders.test.ts tests/ui/trade.test.ts tests/ui/hints.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
git diff --diff-filter=M --stat main -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/seePins.ts; echo EXIT=$?   # nur balance-upgrade.test.ts, 1 Zeile
git diff -U0 main -- tests/sim/controller.ts tests/sim/merchantsController.ts tests/sim/balance-upgrade.test.ts tests/sim/trade.test.ts src/ui/app.ts src/ui/trade.ts   # jede +/- Zeile enthält buyPrice(w…, sonst nichts
```

- [ ] **Schritt 3: Commit.** `feat: Kaufpreis mit Edikt Handel, Aufrufer mit Welt (M13-E1 T04)`.

## Bericht

Je AK Testname und Rot-Zeile; Ausgabe der beiden Diff-Proben (AK-M13E1-21: Baseline 6750 / 11 500 grün, nur T-B1-Zeile); Exit-Codes. Danach meldet der Controller dem UI-Controller: Sim-Stand T04 bereit.
