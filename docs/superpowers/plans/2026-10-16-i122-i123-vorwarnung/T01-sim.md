# T01 · Sim: Warnwert, `nextSettleTick`, `contractWarning`, Probe farSkip

`tech-sim-engineer` · ≈ 35 Tools · AK-W1 bis AK-W6 · blocked-by: T00 · Test zuerst (rot vor Umsetzung, Rot-Beleg ins Ledger)

Dateien: `src/sim/defs/goods.ts` (nur die neue Konstante), `src/sim/orders.ts`, `tests/sim/contractWarning.test.ts` (neu), Defs-Test (bestehende Datei, `rg -n "CONTRACT_LOYAL_AFTER" tests/sim`). Kein `types.ts`, `save.ts`, `world.ts`.

## Umsetzung

1. `goods.ts` bei den Vertragswerten (nach `CONTRACT_LOYAL_AFTER`): `/** Warnfenster vor der Vertragsabrechnung in Ticks (I-122): 30 s bei 1×, nur Anzeige und Klang. */ export const CONTRACT_WARN_TICKS = 300;`
2. `orders.ts` (`ORDER_FIRST_TICK`, `ORDER_PERIOD`, `CONTRACT_WARN_TICKS` importieren):

```ts
/** Nächster Periodenbeginn strikt nach `tick` (ohne `farSkip`: der Vertrag wird jede Periode abgerechnet). */
export function nextSettleTick(world: World): number {
  const t = world.tick;
  if (t < ORDER_FIRST_TICK) return ORDER_FIRST_TICK;
  return ORDER_FIRST_TICK + ORDER_PERIOD * (Math.floor((t - ORDER_FIRST_TICK) / ORDER_PERIOD) + 1);
}

export interface ContractWarning {
  good: GoodId;
  island: number;
  amount: number;
  stock: number;
  missing: number;
  reason: 'stock' | 'kontor';
  restTicks: number;
  outcome: 'excuse' | 'break';
  penalty: number; // penalty 0 bei 'excuse'
}

/** Vorwarnung (I-122): reine Lesefunktion, kein RNG, schreibt nie. `null` ausserhalb des Fensters oder wenn der Spieler nichts tun kann. */
export function contractWarning(world: World): ContractWarning | null {
  const c = world.contract;
  if (c === null) return null;
  const restTicks = nextSettleTick(world) - world.tick;
  if (restTicks > CONTRACT_WARN_TICKS) return null;
  const reason = breakReason(world, c);
  if (reason !== 'stock' && reason !== 'kontor') return null; // null = liefert, 'lock'/'island' = nicht behebbar
  const stock = world.islands[c.island]!.stock[c.good];
  const excuse = c.deliveries >= CONTRACT_LOYAL_AFTER;
  return {
    good: c.good,
    island: c.island,
    amount: c.amount,
    stock,
    missing: Math.max(0, c.amount - stock),
    reason,
    restTicks,
    outcome: excuse ? 'excuse' : 'break',
    penalty: excuse ? 0 : contractPenalty(c),
  };
}
```

`breakReason` bleibt privat (P-1). Doc-Kommentare deutsch wie Bestand.

## Tests (`contractWarning.test.ts`, Hilfen aus `tests/sim/contract.test.ts` und `helpers.ts`)

AK-W1 `nextSettleTick`: Tick 0 und 599 → 600; Tick 600 → 1500; mit `farSkip === k` unverändert (ignoriert) · AK-W2 Vertrag 5 Rum, Lager 0, `tick = settle - CONTRACT_WARN_TICKS` → `missing` 5, `restTicks` 300; `settle - 301` → `null`; Lager 5 → `null`; kein Vertrag → `null` · AK-W3 `deliveries` 4 → `'break'`, `penalty === contractPenalty(c)`; 5 → `'excuse'`, `penalty` 0 · AK-W4 Kontor weg → `reason 'kontor'`; Sperre (`'lock'`) und fehlende Insel → `null` · AK-W5 `JSON.stringify(world)` vor/nach gleich, `world.rng` unverändert, Replay-/Baseline-Test (`rg -ln "baseline" tests/sim`) unverändert grün · AK-W6 `Number.isInteger(CONTRACT_WARN_TICKS)`, `0 < … < ORDER_PERIOD`.

**Probe R738 (P-6):** Test «nach Fernauftrag und Vertrag: `nextOrderTick(w) !== nextSettleTick(w)`, `tickOrders` rechnet am `nextSettleTick` ab»: Zustand per Weltbau (`farSkip = k`, `contract` gesetzt, `tick` in Periode k-1). Ergebnis (bestätigt/widerlegt) ins Ledger und in den Bericht; der Test bleibt als Dokumentation.

## Prüfschritte

`npx vitest run tests/sim/contractWarning.test.ts; echo EXIT=$?` · `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` · `npx tsc --noEmit; echo EXIT=$?` · `make lint; echo EXIT=$?` · `make conflicts; echo EXIT=$?` · `git diff --stat feat/i122-i123 -- src/sim/types.ts src/sim/save.ts src/sim/world.ts` leer. Commit `feat: contractWarning und nextSettleTick (I-122)`.
