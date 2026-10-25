# T03 Wirkung: `cycleOf` und `sellPrice`

Persona `tech-sim-engineer` · Strang A · Tools ≈ 55 · AK-FE7, FE8, FE9, FE10, FE11, FE12, FE15 (Rest), FE16, FE21, Review Focus 2 bis 4 · blocked-by T02.

**Files:** Modify `src/sim/levels.ts` (`cycleOf`), `src/sim/trade.ts` (`sellPrice`), `tests/sim/feastKinds.test.ts`.

**Interfaces:**

- Consumes (T01): `harvestActive(world, b)`, `harvestCycle(cycle)`, `marketActive(world, island)`, `FEAST_KINDS` — aus `./feastEffect` bzw. `./defs/feast`; (T02) `holdFeast(world, id, kind)`.
- Produces: `cycleOf` und `sellPrice` mit unveränderter Signatur; ohne laufendes Erntefest bzw. Markttag bitgleich.

```ts
// levels.ts, cycleOf: Erntefest nach effectiveCycle, einziger Leseort
const c = effectiveCycle(world, b.island, b.defId, levelDef(b)?.cycle ?? base);
return harvestActive(world, b) ? harvestCycle(c) : c;
// trade.ts, sellPrice
const market = marketActive(world, island) ? FEAST_KINDS.market.sellPct : 100;
const m = Math.max(boom, prefer, market);
```

`effectiveCycle` bleibt unverändert (Panel-Vorschau der nächsten Stufe rechnet bewusst ohne Erntefest, P-10, Test in T06). `world.sellPct` (Sättigung) unberührt.

## Schritte

- [ ] **Tests zuerst** in `tests/sim/feastKinds.test.ts`. Aufbau: Kapelle wie T02; Werkstatt Stufe 3 mit Basiszyklus 50 → `b.level = 3` (c = 20; Wert per `cycleOf` vor dem Fest prüfen); Fest per `holdFeast` mit aufgefülltem Lager oder (FE8) direkt gesetzt.
  - **AK-FE7:** `cycleOf` = 15 während `active`, 20 bei `tick = feastAt + FEAST_DURATION`, 20 für einen Betrieb ausserhalb des Radius und auf Insel 1. Inselvorteil: Betrieb auf einer Fremdinsel mit passendem Trait (`traitOf` ≠ undefined, Muster `tests/sim/*trait*` per `rg -ln "traitOf" tests/sim`) → `cycleOf` = `harvestCycle(effectiveCycle(…))`. Ratsbeschluss (Muster `tests/sim/council.test.ts`) → ebenso. Brand der Kapelle (`outageUntil`) → 20; nach Brandende (`outageUntil` entfernt, Fest noch aktiv) → 15. Abriss der Kapelle im Erntefest (`demolish`, danach `connected = true` für den Betrieb, siehe T02): `cycleOf` im selben Tick 20; `progress` vorher 7 → nachher 7.
  - **AK-FE8:** zwei Kapellen mit überlappendem Radius, beide `feastAt = tick`, `feastKind = 'harvest'` direkt gesetzt → `cycleOf` = 15, nicht 11.
  - **AK-FE9:** Betrieb `progress = 17`, Eingänge reichlich, Ausgang leer; Erntefest beginnt; `step(w)` (aus `src/sim/tick.ts`) einmal → Ausgang +1, `progress = 0`; über 600 Ticks ab Festbeginn Zuwachs des Ausgangs in `[39, 41]` (⌊600/15⌋ ± 1). Krise aus (`crisisLevel: 'off'`), Lager vorher so setzen, dass weder Eingang 0 noch Ausgang 100 erreicht wird.
  - **AK-FE10:** `ref(w, good, n, m)` im Test = Schleife der Spec (`acc += GOODS[g].sell × pct × m`, `pct = max(SELL_FLOOR, pct − SELL_DROP)`, `⌊acc / 10000⌋`). Markttag auf HOME: `sellPrice(w, 'rum', 10, HOME) === ref(w, 'rum', 10, 125)`; ohne Markttag `=== ref(…, 100)` und gleich dem Wert vor T03 (Charakterisierung). Boom auf Rum (`w.crisis = { kind: 'boom', good: 'rum', … }`, Feldform per `rg -n "kind: 'boom'" tests/sim`) → `ref(…, 150)`. Vorliebe-Insel (`twoIslandWorld` mit `kind` einer Insel, deren `prefers` das Gut enthält, oder `ISLANDS`-Eintrag per `rg -n "prefers" src/sim/defs/sea.ts`), Markttag dort → gleich dem Wert ohne Markttag (130). Zwei Markttage auf HOME → einmal 125. Nach `sell(w, 'rum', 10)` mit und ohne Markttag: `w.sellPct` gleich.
  - **AK-FE11:** K1 Aufstiegsfest, K2 Erntefest, Radien überlappen: Haus in beiden → `feastActive` wahr; Betrieb in beiden → 15; Haus nur im Radius von K2 → `feastActive` falsch.
  - **AK-FE12:** Erntefest an K, `w.tick = feastAt + FEAST_COOLDOWN`, `holdFeast(w, K, 'ascension')` ok → `'feastKind' in K` falsch, Betrieb im Radius wieder 20.
  - **Review Focus 2:** Heimat-Erntefest, Betrieb auf Insel 1 an denselben `x, y` wie ein Heimatbetrieb im Radius → Insel-1-Betrieb 20, Heimatbetrieb 15.
  - **Review Focus 3:** Markttag-Kapelle brennt → Faktor 100; Brandende → 125; Abriss → 100 im selben Tick.
  - **Review Focus 4:** Markttag auf Insel 1 (mit Kontor) → `sellPrice(…, HOME)` gleich ohne Markttag.
  - **AK-FE15 (Rest):** Quelltext ohne Kommentare von `src/sim/feastEffect.ts`, `src/sim/levels.ts`, `src/sim/trade.ts` enthält kein `/\b(75|125)\b/`.
  - **AK-FE21 (Rest):** `levels.ts` und `trade.ts` importieren aus `./feastEffect` und nicht aus `./feast`.
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/feastKinds.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen** wie oben.
- [ ] **Grün:** `npx vitest run tests/sim/feastKinds.test.ts tests/sim/feast.test.ts; echo EXIT=$?` → 0; dazu `npx vitest related --run src/sim/levels.ts src/sim/trade.ts; echo EXIT=$?` → 0.
- [ ] **AK-FE16 Balancing und Baselines:** `npx vitest run tests/sim/balance.test.ts tests/sim/balance-crises.test.ts tests/sim/farOrder-baseline.test.ts tests/sim/reserve-bitgleich.test.ts; echo EXIT=$?` → 0 (Liste aus T00; weicht sie ab, die T00-Liste). **Laufzeit P-7, Wand an Wand:** `git worktree add --detach .worktrees/i201-base $(git merge-base main HEAD)` (vorher `git worktree list`), dann abwechselnd Basis und Branch je 3 × `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?`, jeder Lauf bei 1-min-Load ≤ 4 (`uptime` davor), Median je Seite; Mediane und Last je Lauf ins Ledger. Branch > Basis + 10 % → zuerst allokationsfreie Schleife in `harvestActive`/`marketActive` (`for … in` mit Frühabbruch), erneut messen; bleibt es darüber, Befund an den Controller (Cache nur mit Festversion, ADR und AK-FE14-Test, nicht in diesem Task). Danach `git worktree remove .worktrees/i201-base`. Keine Datei unter `tests/sim/balance.test.ts`, `tests/sim/controller.ts` oder Baselines geändert (`git diff --stat` belegt).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `git add src/sim/levels.ts src/sim/trade.ts tests/sim/feastKinds.test.ts` · `feat: Erntefest in cycleOf, Markttag in sellPrice (I-201 T03)`. Danach meldet der Controller den Hash für die Abzweigung der Stränge B und C.
