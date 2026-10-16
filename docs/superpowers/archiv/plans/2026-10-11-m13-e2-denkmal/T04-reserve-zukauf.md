# T04 · Reserve, Zukauf-Funktion, Fortschritt (TDD)

Strang sim · Worktree `.worktrees/m13-e2-sim` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M13E2-09 (Spec R6, R7,
§4; Anhang 01 A) · blocked-by T03 · Grösse S (≈ 20 Tools) · Auflage A3, Setzung R489 (tech B1 a), tech B5

**Zweck:** Die Bausteine des Zugs (T05) stehen einzeln geprüft bereit; die UI (T10) liest dieselben Funktionen. Nach
dieser Task zweigt der UI-Strang ab (Hash im Ledger).

**Files:**

- Modify: `src/sim/monument.ts`, `src/sim/trade.ts`, `tests/sim/monument.test.ts`, `tests/sim/trade.test.ts`
- Lesen: Spec R6, R7; `buyPrice`, `noKontorTrade`, `buy` in `trade.ts`; `goodLock` in `unlocks.ts`; `isSupplied`
  (Fundort per `grep -rn "export function isSupplied" src/sim`), `TIERS[*].needs`.

## Schnittstelle

```ts
// src/sim/monument.ts
/** Sperrbestand je Gut (R6.1). In E2 immer 0; den Rumpf ersetzt I-049 (Fall K1). Signatur nicht ändern. */
export function monumentLock(w: World, g: MonumentGood): number;
/** R6.1/R6.2: max(MIN, ⌈TICKS × U_g / 100⌉, lock), ganzzahlig. */
export function monumentReserve(w: World, g: MonumentGood): number;
/** Σ delivered / Σ Soll des laufenden Abschnitts als ganze Prozent ⌊100 × Σd / ΣS⌋; ohne running 0. */
export function monumentProgress(w: World): number;

// src/sim/trade.ts
/** R7.1: null = Zukauf möglich; sonst Grund aus noKontorTrade(w, HOME) bzw. goodLock(w, g). */
export function monumentBuyBlock(w: World, g: MonumentGood): string | null;
/** R7.3: einziger Zukaufweg. Liefert 1 (gekauft, money −= buyPrice(w, g, 1)) oder 0 (nichts geändert). */
export function buyMonumentUnit(w: World, g: MonumentGood): 0 | 1;
```

- **Reserve ganzzahlig (A3):** `S = Σ inhabitants × Math.round(TIERS[tier].needs[g] × 1000)` über Häuser der Heimat
  mit `isSupplied(w, b)` (Betriebe zählen nicht, Fremdinseln nicht); `a = MONUMENT_RESERVE_TICKS × S`, `b = 100 ×
1000`; `⌈a / b⌉ = Math.floor((a + b − 1) / b)`; Ergebnis `Math.max(MONUMENT_RESERVE_MIN, ⌈a / b⌉,
monumentLock(w, g))`. Kein Gleitkomma-Vergleich, kein `DEFICIT_EPSILON`, kein RNG.
- **`buyMonumentUnit`:** `monumentBuyBlock !== null` → 0; `price = buyPrice(w, g, 1)`; `w.money < price` → 0, nichts
  ändern; sonst `w.money −= price`, 1. **Kein** Lagerzugang, keine Lagergrenze, `sellPct` und alle übrigen Felder
  unverändert; `buy()` bleibt unverändert. Kommentar: «Einhängepunkt I-048 (Kaufanteil zahlen, nicht heben, R489)».
- `trade.ts` importiert **nicht** `monument.ts` (kein Kreis); `MonumentGood` kommt aus `types.ts`.

## Schritte

- [ ] **Schritt 0:** `grep -n "export function" src/sim/trade.ts src/sim/supply.ts src/sim/coverage.ts`.
- [ ] **Schritt 1: Test zuerst (rot).**
  - `tests/sim/monument.test.ts`, **AK-09 Reserve:** jede Zeile Anhang 01 A exakt (0, 20, 25, 26, 40, 60, 61, 80, 81
    versorgte Kaufleute in einem Haus bzw. verteilt; Glas/Gewürz und Stein/Werkzeug); Summenfolge-Fall: 80 Kaufleute
    auf viele Häuser mit ungünstiger Reihenfolge verteilt → 64, nicht 65; unversorgte Häuser (ausserhalb Kontor- und
    Marktradius, `houseFar` aus `helpers.ts`) und Häuser auf einer Fremdinsel zählen nicht; eine Glashütte im Lauf
    ändert die Stein-Reserve nicht; `monumentLock` liefert für alle vier Güter 0. Häuser über `village(n)` und
    `setHouse(h, 4, n)` aus `tests/sim/helpers.ts`.
  - **Hilfstests (kein eigenes AK, Abnahme in AK-11/T05):** `tests/sim/trade.test.ts` `describe('buyMonumentUnit
(R7.3)')`: Preis 15/40/50/40 ohne Edikt, 12/32/40/32 mit wirkendem Handel; `money = Preis` → 1, Geld 0; `money =
Preis − 1` → 0, `serialize` unverändert; Lager und `sellPct` unverändert; ohne Kontor (`kontorId = null`,
    synthetisch) → `monumentBuyBlock` nicht `null`, Ergebnis 0. `monumentProgress`: 0 ohne `running`; Σ 414 / 520 → 79.

```bash
npx vitest run tests/sim/monument.test.ts tests/sim/trade.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen.**

```bash
npx vitest run tests/sim/monument.test.ts tests/sim/trade.test.ts tests/sim/imports.test.ts tests/sim/balance.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: Denkmal-Reserve ganzzahlig, Zukauf-Funktion in trade.ts (M13-E2 T04)`.

## Bericht

Tabelle Anhang 01 A mit Ist-Werten, Rot-Zeile, Exit-Codes. Der Controller notiert den abgenommenen Hash als
**Abzweig für den UI-Strang** im Ledger und meldet ihn dem UI-Controller.
