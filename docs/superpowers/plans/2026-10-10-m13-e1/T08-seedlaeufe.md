# T08 · Seed-Läufe B1/B3: `balance-edicts.test.ts` (Pflicht-Stopp bei Grenzverfehlung)

Strang sim · Worktree `.worktrees/m13-e1-sim` · Umsetzer `tech-sim-engineer` (sonnet, Fortsetzung) · AK-M13E1-17, 18, 19, 21, PLAN-M13-01 · Spec §6, Anhang 03 (ganz lesen) · R455 T-B2/T-B3/Q-B2/Q-B4 · blocked-by T07 · Grösse M (≈ 35 Tools)

**Files:**

- Create: `tests/sim/balance-edicts.test.ts`
- Lesen, **nicht ändern**: `tests/sim/merchantsController.ts` (`runMerchants`, `newMerchantTrajectory`, `MERCHANT_TICK_LIMIT`), `tests/sim/controller.ts` (`startColony`, `layoutFor`), `tests/sim/balance-merchants.test.ts` (Pins 6750 / 11 500), `tests/sim/scenarios.ts` (`M13_TOWNHALL_AT` aus T07), `tests/sim/helpers.ts`. Kein Eintrag in `ZEITTESTS` (`vite.config.ts`): die Datei misst keine Wandzeit.

## Aufbau (Anhang 03 A)

- `beforeAll` (Timeout 15 000 ms) rechnet **einmal**: Phase 1 `createWorld(3)`, `startColony`, `runMerchants(w, layout, t, (x) => x.won)` (erwartet `won` bei 6750); Amtsstube an `M13_TOWNHALL_AT` (Kosten vorher gutschreiben, `placeBuilding` ok, `connected`), Stand `P1 = serialize(w)`. Dann K′ = Kopie von `P1`, `runMerchants` bis `wonMerchants`/12 000 → `K_ARM`, und Stand `KW` nach K′ für die Welle (D.1).
- Jede Variante: `deserialize(P1)`-Kopie, eigene `layoutFor(kopie)` und `newMerchantTrajectory()`; Edikt-Varianten: +600 Geld, `setEdict(kopie, id)` → `ok: true` im selben Tick; «reich»: +20 000 Geld vor Amtsstube und Edikt (also eigener Stand `P1R` im `beforeAll`).
- Messgrösse `t.wonMerchantsTick` bzw. `null`. Alle Grenzen relativ zu K′ (nicht zum Pin 11 500).
- **Festwerte (R455 T-B2):** Nach der ersten Messung stehen K′, Sparen, Handel, Wohlfahrt je Lauf, `fullTick[i]` (K, W) und `money` (K, S, W) der Welle als `const` oben in der Datei und werden zusätzlich mit `toBe` geprüft. Erste Messung mit `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-edicts.test.ts --silent=false` (Log-Muster wie `balance-merchants.test.ts`).

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot).** Datei mit den Grenzen aus Anhang 03 B–E und Platzhalter-Festwerten `NaN` anlegen; je AK ein `it` mit Timeout:
  1. `AK-M13E1-19` «arm» (15 000 ms): K′ ≤ 12 000; Sparen und Handel je `K′ − 600 ≤ Tick ≤ K′ − 100`; Wohlfahrt `null` oder `> K′`.
  2. `AK-M13E1-17` «reich» (10 000 ms): K′reich ≤ 8000; Wohlfahrt reich `< K′reich`.
  3. `AK-M13E1-18` «Welle» (15 000 ms): ab `KW` ohne Controller `step` + alle 10 Ticks `topUp` (Heimatlager Nahrung, Stoff, Rum, Glas, Gewürz, Holz, Werkzeug, Stein je auf 100, ohne Geld) bis T0 (nächstes Vielfaches von 200); drei Kopien K, S, W (S, W: +600, Edikt); in jeder dieselben 4 Wohnhäuser über `placeBuilding` an festen Plätzen `WAVE_SLOTS` (im Kontor- und Dienstradius von Kapelle, Schule, Badehaus; einmal bestimmen, als Konstante ablegen; Baukosten gutschreiben); Lauf bis T0 + 3000. Abnahmen: alle 4 Häuser voll (Stufe 4, 20) in K und W bis T0 + 3000; `fullK[i] − fullW[i] ≥ 250` je Haus; `money(W) − money(K) > 0`; `money(W) > money(S)`; kein neues Haus schrumpft (Einwohner je Schritt nie kleiner als zuvor).
  4. `AK-M13E1-21` Baseline: `runMerchants` ab einer Kopie **ohne** Amtsstube (Stand vor dem Setzen) → `wonMerchantsTick === 11 500` und Phase-1-`won` bei 6750 (Kopierweg verzerrt nichts).
  5. `PLAN-M13-01` Determinismus: Wohlfahrt «arm» zweimal aus `P1` → gleicher Tick und gleiches `serialize` am Ende; einmal mit `deserialize(serialize(x))` bei Tick `won + 1000` → gleicher Tick, gleiches `serialize`.

```bash
npx vitest run tests/sim/balance-edicts.test.ts; echo EXIT=$?   # rot: Festwerte NaN
```

- [ ] **Schritt 2: Messen und Festwerte eintragen.** Messlauf mit Log, Werte in die `const` schreiben, erneut laufen lassen.
  - **Pflicht-Stopp (Anhang 03 A, E9):** Verfehlt ein Messwert eine Grenze relativ zu K′ (inkl. Welle D), **keine** Grenze und keinen Festwert anpassen, nicht weiterarbeiten: Messwerte (alle Varianten, `fullTick`, `money`) an den Controller; der meldet an `lead-design`, L0 entscheidet per Ruling (P-1 Rückfall «zwei Edikte»). Vorher prüfen (P-1): verzerren `topUp` oder `WAVE_SLOTS` die Welle (z. B. Haus ausserhalb eines Dienstradius)?
- [ ] **Schritt 3: Laufzeit (R455 T-B3).** `CI=true npx vitest run tests/sim/balance-edicts.test.ts --reporter=verbose; echo EXIT=$?` → Dauer je `it` und `beforeAll` ≤ 50 % des Timeouts (≤ 5 000 / 7 500 / 7 500 ms; `beforeAll` ≤ 7 500 ms). Liegt ein Wert darüber: Datei je Lauf teilen (`balance-edicts-arm.test.ts` …), Timeout **nicht** erhöhen. Der Controller bestätigt mit `make test` (schreibt `.studio/zeitreserve.json`) am Strang-Ende.
- [ ] **Schritt 4: Baseline-Probe** (AK-M13E1-21):

```bash
npx vitest run tests/sim/balance.test.ts tests/sim/balance-merchants.test.ts tests/sim/balance-upgrade.test.ts tests/sim/balance-crises.test.ts tests/sim/balance-flow.test.ts; echo EXIT=$?
git diff --diff-filter=M --stat main -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/seePins.ts; echo EXIT=$?   # nur balance-upgrade.test.ts
git diff main -- tests/sim/controller.ts tests/sim/merchantsController.ts --stat; echo EXIT=$?   # nur T04-Zeilen
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 5: Commit.** `test: Seed-Läufe Edikte für die Auflagen B1 und B3 (M13-E1 T08)`.

## Bericht

Tabelle der Messwerte (K′, Sparen, Handel, Wohlfahrt arm; K′/Wohlfahrt reich; Welle `fullK`, `fullW`, `money` K/S/W) mit Grenze und Abstand; Laufzeiten unter `CI=true` gegen Timeout; Exit-Codes. Danach meldet der Controller: Sim-Strang fertig (`git merge main`, `make check`, Bericht an L0 über den Abschluss-Controller D).
