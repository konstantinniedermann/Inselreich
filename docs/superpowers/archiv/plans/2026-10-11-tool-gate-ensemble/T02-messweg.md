# T02 — Messweg `trackedBuy` (GE-3)

**Dateien:** `tests/sim/controller.ts`, `tests/sim/ensemble.test.ts`.

Vorlage: `git show bc57f8ba:tests/sim/controller.ts` (Zeilen um `surcharge`, `volume`, `trackedBuy`). Branch `feat/i048-b` nicht mergen, nur Code lesen und übernehmen (R549 (4)). `buyQuote`, `edictBuyPct`, `BUY_CAP`, `GOODS` existieren auf `main` (`src/sim/trade.ts`, `src/sim/defs/goods.ts`); Messbasis ist der Listenpreis (Anteil 100, Edikt eingerechnet).

- [ ] **Schritt 1: Test zuerst** (in `ensemble.test.ts`): (a) Nach `runColony` bis Tick 1500 mit Phase 0: `buyVolume(w) > 0` und `buySurcharge(w) === 0` (`BUY_RISE` ist 0 auf `main`). (b) Zustand mit und ohne Messweg gleich: erledigt durch den unveränderten GE-1-Test (serialize) plus `npx vitest related --run tests/sim/controller.ts`.
- [ ] **Schritt 2: Rot-Beleg.** `EXIT=1`, Grund: `buyVolume` nicht exportiert / 0. Ausgabe in den Bericht.
- [ ] **Schritt 3: Umsetzung.** `WeakMap`-Zähler je Welt, `trackedBuy(w, g, n)` ruft `buy` und rechnet nur nach dem Erfolg; `buyMissing` (Zeile ~183) nutzt `trackedBuy` statt `buy`; `export function buySurcharge` und `buyVolume`. Keine Zustandsänderung an der Welt, keine zweite `buy`-Variante.
- [ ] **Schritt 4: Grün,** `npx vitest related --run tests/sim/controller.ts; echo EXIT=$?` → 0 (sieben Importeure inkl. `balance.test.ts`).
- [ ] **Schritt 5: Commit** `test: Messweg trackedBuy im Controller (TOOL-GATE-ENSEMBLE T02)`.
