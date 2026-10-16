# T03 · `routeBalance` (Sim, lesend, I-103)

Umsetzer `tech-sim-engineer` · ≈ 40 Tools · AK B1, B2, B3, B4, B5a, B6 (+ Z1) · blocked-by: T02

## Dateien

- neu: `src/sim/routeBalance.ts`, `tests/sim/routeBalance.test.ts`
- nicht ändern: `flow.ts`, `ships.ts`, `types.ts`, `defs/`, `save.ts`; kein Zustand, kein RNG

## Verhalten (P-2: Einheit je 100 Ticks)

```ts
export interface RouteBalance {
  /** Umlaufzeit a→b→a in Ticks (laneTicks beider Richtungen). */
  cycleTicks: number;
  /** Warenwert (Σ q · GOODS[g].sell) je 100 Ticks, ungerundet. */
  goodsPer100: number;
  /** SHIP.upkeep je 100 Ticks (= UPKEEP_INTERVAL). */
  upkeepPer100: number;
  net100: number; // goodsPer100 − upkeepPer100
}
export function routeBalance(
  world: World,
  route: Route,
  balances: Map<number, ReturnType<typeof goodsBalance>> = new Map(),
): RouteBalance | null;
```

1. `T = laneTicks(world.islands, a, b) + laneTicks(world.islands, b, a)`; `T <= 0` → `null` (Z1, Lane fehlt).
2. Je Richtung: Quelle `a` für `route.ab`, Quelle `b` für `route.ba`. `k = Liste.length` (≤ `ROUTE_GOODS_PER_DIRECTION`); leere Liste → Beitrag 0.
3. Je Gut `g` der Richtung: `q = min(⌊SHIP.capacity ÷ k⌋, ⌊max(0, net_Quelle[g] × T ÷ FLOW_TICKS⌋))`, wobei `net_Quelle = goodsBalance(world, Quelle).net[g]` je 100 Ticks (Deckel `⌊net × T ÷ 100⌋`, die Zahl 100 als lokale Konstante `FLOW_TICKS = 100` mit Kommentar «Einheit von goodsBalance»).
4. `goodsPer100 = Σ q · GOODS[g].sell × 100 ÷ T` (erst summieren, dann teilen). Gewürz zum `buy`-Preis, Reserve, Lager, Zweitverteilung, Vorliebe, Handel: **nicht** eingerechnet (Untergrenze, Kurzdesign Regel 2/3).
5. `balances` ist das Memo des Aufrufers (eine Rechnung je Quellinsel je Anzeige-Schritt); `routeBalance` füllt es, schreibt nie in `world`.
6. Kosten-Beleg (siehe Index «Kosten»): nach grün ein Mikro-Lauf (temporäres Skript im Scratchpad, nicht committen) mit `performance.now()` über 100 Aufrufe `goodsBalance` auf der grössten Welt der Balancing-Tests; Wert (ms je Aufruf, H, B) in den Task-Bericht. Über 2 ms: Befund an den Controller, `cov`-Weg prüfen.

## Testfälle (rot zuerst; Beleg im Bericht)

Weltaufbau mit Betrieben auf Insel `a`/`b` wie in `tests/sim/flow.test.ts` / `ships.test.ts` (Hilfen suchen). Erwartungen aus `defs` berechnet (`GOODS`, `SHIP`), nie als Literal.

- **AK-B1** ein Gut je Richtung, grosser Überschuss: `q = SHIP.capacity` je Richtung, `goodsPer100 === (Σ q · sell) × 100 ÷ T`.
- **AK-B2** zwei Güter einer Richtung: je `⌊capacity ÷ 2⌋` (25), wenn Überschuss reicht.
- **AK-B3** Überschuss 0 oder negativ: Menge 0 für das Gut; Route ohne jeden Überschuss: `goodsPer100 === 0`, `net100 === −SHIP.upkeep`.
- **AK-B4** kleiner Überschuss: Menge `⌊net × T ÷ 100⌋` (kleiner als der Anteil).
- **AK-B5a** `upkeepPer100 === SHIP.upkeep`, `net100 === goodsPer100 − upkeepPer100`.
- **AK-B6** `JSON.stringify(world)` vor/nach gleich; zwei Aufrufe (mit und ohne gefülltes `balances`) liefern `toEqual`; `balances`-Memo erzeugt höchstens einen Eintrag je Quellinsel.
- **Z1** Welt ohne Lane zwischen `a` und `b`: `null`, kein Wurf.

## Prüfschritte / Task-Review

Reviewer: Datei DOM-frei, kein `Math.random`, kein UI-Import, keine Wertliteral ausser `FLOW_TICKS`; `tsc`, `make lint` Exit 0; `git diff main -- src/sim/defs src/sim/types.ts` leer.
