# T03 · Schalter `setTithe`, Determinismus, Kursband

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 45 Tools · blocked-by: T02 · AK-ZE-05, -07, -14 (Literal), -15, -24, -26 · Spec Regeln 6, 8; R981 L1/L2

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`. Läuft parallel zu T04 (Strang B): höchstens 2 gleichzeitige Testläufe.

**Files:** Modify `src/sim/tax.ts`, `tests/sim/tithe.test.ts`. Sonst nichts (T04 arbeitet in `src/ui/`).

## Interfaces

- Consumes (T01): `TITHE_GOOD`, `TITHE_SWITCH_LOCK`, Welt-Felder. (T02): `titheActive`.
- Produces (`tax.ts`):
  ```ts
  export function titheLocked(world: World, tier: TitheTier): boolean; // world.tick < titheLockedUntil[tier]
  export function setTithe(world: World, tier: unknown, on: unknown): Result;
  ```

## Inhalt

`setTithe`, Prüfreihenfolge wörtlich Spec Regel 6, erster Treffer gewinnt, bei `fail` keine Änderung:

1. `asTier(tier)` (bestehend, nur `number`) `=== null` → `'Ungültige Stufe'` (deckt 7, `'x'`, `undefined`, 1,5, `NaN`, `'1'`);
2. `!Object.hasOwn(TITHE_GOOD, t)` → `` `Kein Zehnt für ${TIERS[t].name}` ``;
3. `typeof on !== 'boolean'` → `'Ungültiger Wert'`;
4. `!townhallActive(world)` → `townhallReason(world)`;
5. `world.titheOn[t] === on` → `on ? 'Zehnt bereits aktiv' : 'Geld bereits aktiv'`;
6. `titheLocked(world, t)` → `'Sperrzeit'`;
7. `titheOn[t] = on`, `titheLockedUntil[t] = world.tick + TITHE_SWITCH_LOCK`, `return ok`.
   `asTier` erwartet heute `number`; Signatur auf `unknown` erweitern oder vorher `typeof tier === 'number'` prüfen (Verhalten von `setTierTaxLevel` unverändert).

## Tests (`tests/sim/tithe.test.ts`)

Testwelt wie T02 (`village` + `placeTownhall`).

- **AK-ZE-05 Sperre:** bei Tick T `setTithe(w, 1, true)` → `ok`, `titheLockedUntil[1]` = T + `TITHE_SWITCH_LOCK`; `w.tick = T + TITHE_SWITCH_LOCK − 1`, `setTithe(w, 1, false)` → `{ ok: false, reason: 'Sperrzeit' }`, `JSON.stringify(w)` gleich vorher; bei T + `TITHE_SWITCH_LOCK` → `ok`. Stufe 2 bei T + 1 frei.
- **AK-ZE-05 Gründe** (`it.each`, je Welt-Snapshot vor/nach gleich, `not.toThrow`): Stufe 3 → «Kein Zehnt für Bürger»; Stufe 4 → «Kein Zehnt für Kaufleute»; 7, `'x'`, `undefined` → «Ungültige Stufe»; `on = 'ja'` → «Ungültiger Wert»; ohne Amtsstube (Welt ohne `placeTownhall`) → «Braucht eine Amtsstube»; gleicher Zustand → «Zehnt bereits aktiv» / «Geld bereits aktiv».
- **Randfälle Spec:** `money = −100` → `setTithe(w, 1, true)` `ok` (kein Geld-Sperrgrund); `trial.active = 'selfSupply'` → `ok` (Zehnt ist kein Zukauf); Zehnt aus nach Ablauf der Sperre lässt `titheCarry` unverändert (Regel 9).
- **AK-ZE-26:** Amtsstube mit `connected = false` → «Amtsstube wirkt nicht»; ebenso mit `outageUntil` gesetzt; Welt gleich.
- **Review Focus 1:** `tier` 1,5, `NaN`, `'1'` → «Ungültige Stufe»; `on` `1`, `null` → «Ungültiger Wert».
- **Review Focus 5:** `setTithe(w, 1, true)` ok; danach `setTierTaxLevel(w, 1, 'high')` → `ok` (Zehnt-Sperre bremst die Steuer nicht); `setTithe(w, 1, false)` → «Sperrzeit». Umgekehrt: Steuer gesperrt, `setTithe(w, 2, true)` → `ok`.
- **AK-ZE-07 Determinismus:** Seed 3, Testwelt mit Amtsstube, Pionieren und Siedlern; Lauf: `setTithe(1, true)` bei Tick 600, `setTithe(2, true)` bei Tick 900, insgesamt 3000 `step`; zweimal → gleiches `serialize`. Zweiter Teil: Zehnt Stufe 1 an, 300 `step`, `serialize` → `deserialize` → weitere 2700 `step` → `serialize` gleich dem durchgelaufenen Lauf; im geladenen Stand direkt nach dem Laden `setTithe(w, 1, false)` → «Sperrzeit» (bis zum gespeicherten Ende). Ziel < 500 ms (sonst Schrittzahl in Rücksprache mit dem Controller nicht ändern, sondern messen und melden).
- **AK-ZE-14 Literal:** Quelltext von `src/sim/tax.ts` und `src/sim/population.ts` (`readFileSync`), Kommentare entfernt (`/\/\*[\s\S]*?\*\/|\/\/.*$/gm`), enthält nicht `/\b1800\b/`.
- **AK-ZE-15 Kursband:** für jedes g in `Object.keys(TITHE_UNITS_PER_100)`: k = 100 / `TITHE_UNITS_PER_100[g]`; `max(GOODS[g].sell × max(BOOM_PCT, PREFER_PCT) / 100, Math.floor(GOODS[g].buy × ORDER_PREMIUM)) < k`, `k < GOODS[g].buy`, `k > GOODS[g].buy × EDICTS.trade.buyFactorPct / 100`. Importe aus `defs/goods.ts`, `defs/crises.ts`, `defs/sea.ts`, `defs/edicts.ts`; keine Zahl-Literale ausser 100.
- **AK-ZE-24 kein Stapeln:** Welt mit Boom auf `cloth` (Krisen-Zustand nach `rg -n "boom" src/sim/crises.ts`) und Fremdinsel mit `prefers` ⊇ `cloth`, `sellPct.cloth` 100: `sellPrice(w, 'cloth', 1, X)` = `Math.floor(GOODS.cloth.sell × Math.max(BOOM_PCT, PREFER_PCT) / 100)`; Boom auf `stone` → `sellPrice(w, 'stone', 1, HOME)` = 9 und < 100 / `TITHE_UNITS_PER_100.stone`.

## Schritte

- [ ] Tests schreiben; **Rot:** `npx vitest run tests/sim/tithe.test.ts; echo EXIT=$?` → ≠ 0 (AK-ZE-15/24 dürfen schon grün sein: sie sichern bestehende Defs bzw. `trade.ts`; im Ledger vermerken).
- [ ] Umsetzen.
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/sim/taxTiers.test.ts tests/sim/townhall.test.ts tests/sim/trade.test.ts; echo EXIT=$?` → 0.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: I-223 setTithe mit Sperre je Stufe (T03)`.
