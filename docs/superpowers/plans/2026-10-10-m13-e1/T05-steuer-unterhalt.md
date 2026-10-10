# T05 · Steuer und Unterhalt mit Edikt, Endzustand B2 (TDD)

Strang sim · Worktree `.worktrees/m13-e1-sim` · Umsetzer `tech-sim-engineer` (sonnet; erster Task der Controller-Instanz B, neuer Start mit Ledger) · AK-M13E1-06, 07, 08, 13 (Steuer- und Unterhalts-Teil), 20 · Spec R3, Anhang 01 A, B, F · blocked-by T04 · Grösse M (≈ 25 Tools)

**Files:**

- Modify: `src/sim/edicts.ts` (+ `edictTaxPoints`, `effectiveTaxPct`), `src/sim/population.ts` (nur `taxUnits`), `src/sim/economy.ts` (`totalUpkeep`, Kommentar `tickEconomy`), `tests/sim/edicts.test.ts` (neuer `describe`)
- Lesen: `src/sim/townhall.ts` (`taxPct`, `effectiveTaxLevel`), `src/sim/tax.ts`, `tests/sim/taxTiers.test.ts` (Welt «gemischt» aus I-028:AK-T02), `tests/sim/economy.test.ts`, `tests/sim/helpers.ts` (`setHouse`, `putBuilding`)

## Schnittstelle

```ts
// src/sim/edicts.ts
export function edictTaxPoints(w: World): number; // activeEdictDef(w)?.taxPoints ?? 0
/** Wirksamer Steuersatz in % je Stufe: Satz der Steuerstufe minus Edikt-Punkte (Spec R3.3). */
export function effectiveTaxPct(w: World, tier: Tier): number; // taxPct(effectiveTaxLevel(w, tier), tier) − edictTaxPoints(w)

// src/sim/population.ts — taxUnits: Σₜ base[t] × effectiveTaxPct(w, t)
// src/sim/economy.ts
/** Unterhalt je 100 Ticks, wirksam: Summe S (Gebäude + Schiffe), mit Edikt upkeepPct < 100 → ⌊S × pct / 100⌋. */
export function totalUpkeep(world: World): number;
```

- **Kein Importkreis:** `population.ts` und `economy.ts` importieren `./edicts`; `edicts.ts` importiert weder `population` noch `economy` (`tests/sim/imports.test.ts`).
- `tickEconomy` bucht `stats.upkeep = totalUpkeep(world)` wie heute; nur der Kommentar „bleibt der Nominalwert“ wird zu „wirksamer Wert (Edikt Sparen, Spec R3.2)“. `TAX_CARRY_DIVISOR` und Verbuchung bleiben.
- Summe S bleibt in diesem Task `upkeepOf(b)` je Gebäude; T07 tauscht auf `buildingUpkeep(b)` (Stilllegen).
- Bitgleich ohne Edikt: `edictTaxPoints = 0`, Prozentzweig nur bei `upkeepPct < 100`.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot).** `describe('M13-E1 Steuer und Unterhalt')`, Welt `edictWorld()` (T03); Häuser roh (`putBuilding`/`setHouse`, `allNeedsMet` über gesetzte `satisfied`, `services`, `supplied`), Steuerstufen über `w.taxLevels` direkt.
  1. `AK-M13E1-06`: Welt A.1 (fünf Häuser, Stufen je Tabelle) → `taxUnits` keins 133 860, Sparen 125 796, Wohlfahrt 128 100, Handel 133 860 (Edikt direkt über `w.edict = …` setzen, die Aktion ist in T03 geprüft); Kaufleute «hoch» mit Sparen → `effectiveTaxPct(w, 4) === 108`.
  2. `AK-M13E1-07`: 100 × `tickTaxes` ab `taxCarry 0`, `money 0` → Welt A.1: 669 / 6000, 628 / 19 600, 640 / 10 000 (`money` / `taxCarry`); Welt A.2 (4 Kaufleute à 20, erfüllt, «normal») → 1760 / 1636 / 1672.
  3. `AK-M13E1-08`: Welt Anhang 01 B Zeile 1 (Kontor, Amtsstube, 2 Fischer, Glashütte; sonst keine Gebäude) → `totalUpkeep` keins 55, Sparen 44, Handel 55, Wohlfahrt 55; Zeile 3 (+1 Schiff) 70 / 56; 100 × `tickEconomy` ab `upkeepCarry 0` mit Sparen → `money` −44, `stats.upkeep === 44`.
  4. `AK-M13E1-13` (Teil): Sparen erlassen, Amtsstube `outageUntil` gesetzt → `taxUnits` und `totalUpkeep` wie ohne Edikt; `edict`, `edictLockedUntil` unverändert; Ausfall entfernt → Sparen-Werte. Gleiches mit nicht angebundener Amtsstube.
  5. `AK-M13E1-20` «bewusst klein» (Testname enthält diese Worte): Welt A.2 + Kontor + Amtsstube + 32 Schulen roh (nominal 820), 600 × (`tickTaxes`, `tickEconomy`) ab Überträgen 0 → Bilanz keins 5640, Sparen 5884, Wohlfahrt 5112, Handel 5640; `buyPrice(w, 'stone', 48)` mit Handel 576, ohne 720.

```bash
npx vitest run tests/sim/edicts.test.ts; echo EXIT=$?   # rot: edictTaxPoints/effectiveTaxPct fehlen, Werte ohne Abzug
```

- [ ] **Schritt 2: Umsetzen.** Danach Baseline prüfen: ohne Edikt keine Zahl anders.

```bash
npx vitest run tests/sim/edicts.test.ts tests/sim/taxes.test.ts tests/sim/taxTiers.test.ts tests/sim/economy.test.ts tests/sim/townhall.test.ts tests/sim/imports.test.ts tests/sim/balance.test.ts tests/sim/balance-flow.test.ts tests/sim/balance-merchants.test.ts tests/ui/taxView.test.ts tests/ui/hud.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: Edikte wirken auf Steuer und Unterhalt (M13-E1 T05)`.

## Bericht

Je AK Testname und Rot-Zeile, Exit-Codes, `git diff --stat main...HEAD`; Bestätigung, dass `balance.test.ts` 6750 unverändert grün ist.
