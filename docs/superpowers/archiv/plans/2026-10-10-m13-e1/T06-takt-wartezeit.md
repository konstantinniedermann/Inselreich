# T06 · Wachstumstakt und Stapelregel der Aufstiegs-Wartezeit (TDD)

Strang sim · Worktree `.worktrees/m13-e1-sim` · Umsetzer `tech-sim-engineer` (sonnet, Fortsetzung) · AK-M13E1-11, 12, 13 (Takt- und Wartezeit-Teil), 16 · Spec R5, R7, Anhang 01 D, E, G · blocked-by T05 · Grösse M (≈ 30 Tools)

**Files:**

- Modify: `src/sim/edicts.ts` (+ `growthInterval`, `edictUpgradeWait`), `src/sim/population.ts` (`tickPopulation`, `upgradeStatus`; Doku-Kommentar), `tests/sim/edicts.test.ts` (neuer `describe`)
- Lesen: `src/sim/feast.ts` (`feastActive`), `src/sim/flow.ts` (`upgradeDeficit`, `dampsOn`), `tests/sim/upgrade.test.ts`, `tests/sim/feast.test.ts`, `tests/sim/merchants.test.ts` (Häuser voll mit Diensten), `tests/sim/helpers.ts` (`village`, `placeService`, `setHouse`)

## Schnittstelle und Regeln

```ts
// src/sim/edicts.ts
export function growthInterval(w: World): number; // activeEdictDef(w)?.growthInterval ?? GROWTH_INTERVAL
export function edictUpgradeWait(w: World): number | null; // activeEdictDef(w)?.upgradeWait ?? null
```

- **Takt (R5.1):** `tickPopulation`: `growth = world.tick % growthInterval(world) === 0 && world.tick > 0`. Phase des Ticks, nicht ab Erlass; wirkt auch beim Schrumpfen.
- **Stapelregel (R7.1), in `upgradeStatus`:**

```ts
const low = TAX_LEVELS.low.upgradeWait!; // Def-Test: Zahl
const edictWait = edictUpgradeWait(world) ?? Infinity;
const waitBase =
  base === null ? null : Math.max(low, Math.min(base, festive ? low : Infinity, edictWait));
const wait = waitBase === null ? null : waitBase * (damped ? UPGRADE_DEFICIT_WAIT_FACTOR : 1);
```

«hoch» (`base === null`) bleibt `'Steuer zu hoch'`; `festive` und `damped` nur bei `base !== null` wie heute. Ohne Edikt und Fest identisch zu heute (`min(base, ∞) = base ≥ low`).

- Kommentar `upgradeStatus` um die Stapelregel ergänzen (ein Satz, Spec R7).

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot).** `describe('M13-E1 Takt und Wartezeit')`, Welt `edictWorld()`; Takt-Tests rufen `tickPopulation` je Tick mit `w.tick++` (kein volles `step`, damit Produktion und Krisen nicht mitspielen); Lager vor jedem Tick auffüllen, wo die AK «erfüllt» verlangt.
  1. `AK-M13E1-11` Wachsen/Schrumpfen nach Anhang 01 G: Pionierhaus 1 Einwohner, erfüllt, ab Tick 2000 → keins 4 Einwohner bei 2150 und 3 bei 2149; Wohlfahrt 4 bei 2120 und 3 bei 2119. Kaufleute-Haus 20, Nahrung 0 ab 2000 → bei 2400 keins 12, Wohlfahrt 10. Erlass Wohlfahrt bei 2010 (über `setEdict`, Sperre egal) → erster Wachstumsschritt 2040. `growthInterval` mit brennender Amtsstube und Wohlfahrt = 50.
  2. `AK-M13E1-12` Stapelregel: Siedlerhaus voll (8), Dienste und Waren da, `satisfiedSince = tick − 100`; je Zeile von Anhang 01 D (acht Zeilen) der Grund aus `upgradeStatus(w, b).reasons`: `Bedürfnisse noch nicht {wait} Ticks erfüllt` mit 300 / 200 / 150 / 150 / 150 / 150 / 150 und «hoch» → `Steuer zu hoch`; mit Defizit (Budget mit negativem Netto für ein Gut der Zielstufe, als `budget`-Argument übergeben) 600 / 400 / 300 …. Fest über `feastAt` an einer Kapelle in Reichweite (`feast.test.ts`-Muster).
  3. `AK-M13E1-13` (Teil): Wohlfahrt erlassen, Amtsstube `outageUntil` → `growthInterval 50`, Wartezeit wie ohne Edikt; nach Ausfall 40 / 200. Ebenso nicht angebunden.
  4. `AK-M13E1-16` Pfadzeiten (Anhang 01 E): ein Haus bei t0 = 2000, Stufe 1, 1 Einwohner, `satisfiedSince = t0`, `won = true`; ab t0 + 1 vor jedem Tick Lager (alle Bedarfsgüter und Aufstiegskosten) auf 100 und Geld hoch; Kapelle, Schule, Badehaus in Reichweite; **kein Defizit**: Erzeuger roh und angebunden einsetzen, bis `upgradeDeficit(w, b) === null` — diese Vorbedingung vor jedem Aufstieg im Test prüfen (`expect`). Ergebnis «Stufe 4 mit 20 Einwohnern» bei keins 3200, keins + P/S «niedrig» 2950, Wohlfahrt 2880, Wohlfahrt + P/S «niedrig» 2800; Zwischenstufen (Aufstiegs-Ticks) nach der Tabelle exakt.

```bash
npx vitest run tests/sim/edicts.test.ts; echo EXIT=$?   # rot: Takt 50 und Wartezeit 300 auch mit Wohlfahrt
```

- [ ] **Schritt 2: Umsetzen.** Danach Baseline:

```bash
npx vitest run tests/sim/edicts.test.ts tests/sim/population.test.ts tests/sim/upgrade.test.ts tests/sim/feast.test.ts tests/sim/merchants.test.ts tests/sim/taxTiers.test.ts tests/sim/imports.test.ts tests/sim/balance.test.ts tests/sim/balance-merchants.test.ts tests/sim/balance-upgrade.test.ts tests/ui/inspect.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: Wohlfahrt beschleunigt Takt und Aufstieg, Stapelregel (M13-E1 T06)`.

## Bericht

Je AK Testname und Rot-Zeile; für AK-M13E1-16 die gemessenen Zwischenstufen-Ticks je Zeile (Tabelle) und wie die Defizit-Vorbedingung erfüllt wurde; Exit-Codes. Weicht eine Pfadzeit von Anhang 01 E ab: **nicht** den Erwartungswert ändern, sondern Stopp und Meldung (Rechenbefund an `lead-design`). Danach meldet der Controller: Sim-Stand T06 bereit (UI T11).
