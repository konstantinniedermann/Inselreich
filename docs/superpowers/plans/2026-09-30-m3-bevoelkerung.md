# M3 Bevölkerung — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wohnhäuser mit Stufen (Pioniere → Siedler → Bürger), Bedürfnissen, Diensten, Versorgungsradius, Wachstum und Aufstieg; Steuern; Siegbedingung; sichtbar in HUD und Inspect-Panel.

**Architecture:** Neues Sim-System `population.ts` (reine Funktionen auf `World`), Steuern in `economy.ts`, Sieg in `tick.ts`. Reihenfolge je Schritt: `tick++` → Produktion → Bevölkerung → Wirtschaft → Sieg. UI liest nur Zustand.

**Tech Stack:** wie M1/M2. Keine neuen Abhängigkeiten.

**Spec:** `docs/superpowers/specs/2026-09-29-inselreich-design.md` (Abschnitte 2.5 Versorgung, 2.7, 2.8 Steuern, 2.9) · GitHub-Issue #3

## Global Constraints

- Keine Laufzeit-Abhängigkeiten; `src/sim/**` DOM-frei (ESLint-Liste), Welt JSON-fähig, Aktionen liefern `Result`.
- Spielwerte nur aus `src/sim/defs/tiers.ts` (`TIERS`, `WIN_CITIZENS`) und `defs/buildings.ts` (`supplyRadius`, `serviceRadius`).
- Versorgung (Spec 2.5): Haus ist `supplied`, wenn Abstand Haus-Mitte ↔ Kontor-Mitte ≤ `kontor.supplyRadius` **oder** ein Markt mit `connected === true` im Abstand ≤ `market.supplyRadius` liegt. Nicht versorgt → alle Güterbedürfnisse unerfüllt, keine Entnahme.
- Verbrauch (Spec 2.7): je Tick `demand[good] += inhabitants × rate / 100`; bei `demand ≥ 1` eine Einheit entnehmen: gelingt → `demand −= 1`, `satisfied[good] = true`; misslingt → `satisfied[good] = false`, `demand` bleibt (gekappt bei 1).
  **Ruling (Ergänzung zur Spec):** Ein neues Haus und ein frisch aufgestiegenes Haus setzen `demand` für jedes (neue) Bedarfsgut auf 1, damit die erste Entnahme sofort erfolgt und nicht erst nach 200 Ticks.
- Dienste: `faith`/`school` erfüllt, wenn ein angebundenes Gebäude mit diesem `service` im Abstand ≤ `serviceRadius` liegt (Mitte ↔ Mitte). Gespeichert in `house.services: Partial<Record<ServiceId, boolean>>`.
- Wachstum alle 50 Ticks (`tick % 50 === 0`): alle Bedürfnisse der eigenen Stufe (Güter + Dienste + versorgt) erfüllt → +1 (bis `maxInhabitants`), sonst −1 (min 1).
- `satisfiedSince`: Tick, seit dem alle eigenen Bedürfnisse durchgehend erfüllt sind; bei jeder Unerfülltheit auf den aktuellen Tick gesetzt.
- Aufstieg (geprüft im Wachstums-Tick): `inhabitants === max` ∧ `tick − satisfiedSince ≥ 300` ∧ Dienste der nächsten Stufe verfügbar ∧ `stock[g] ≥ 1` für jedes neue Bedarfsgut ∧ `checkAfford(upgradeCost)` → `pay`, `tier + 1`, `demand[neu] = 1`, `satisfiedSince = tick`. Bei Geld < 0 sperrt `checkAfford` automatisch.
- Steuern: alle 100 Ticks (gleicher Takt wie Unterhalt) `money += floor(Σ inhabitants × TIERS[tier].tax × (alleErfüllt ? 1 : 0.5))`; `stats.taxes` hält den Wert pro 100 Ticks (jeden Aufruf aktualisiert).
- Sieg: `world.won = true`, sobald Σ Einwohner in Häusern mit `tier === 3` ≥ `WIN_CITIZENS`; bleibt true.
- UI-Sprache Deutsch (CH, kein ß). Commit-Präfixe wie bisher.

## Review Focus

1. **Haus ausserhalb jedes Versorgungsradius:** verbraucht nichts, alle Güterbedürfnisse unerfüllt, schrumpft auf 1, steigt nie auf. (Test Task 1)
2. **Markt vorhanden, aber nicht angebunden:** zählt nicht als Versorgung. (Test Task 1)
3. **Aufstieg mit leerem Lager des neuen Guts:** bleibt Pionier trotz voller Zufriedenheit; sobald 1 Stoff im Lager und Kapelle in Reichweite → Aufstieg, Kosten abgezogen. (Test Task 2)
4. **Steuern halb bei Unzufriedenheit:** Haus mit 4 Pionieren ohne Nahrung → 4 Gold statt 8 pro 100 Ticks. (Test Task 3)
5. **Sieg genau bei 50 Bürgern:** 49 → false, 50 → true, danach auch bei Schrumpfen true. (Test Task 3)

---

### Task 1: Versorgung, Verbrauch, Zufriedenheit, Wachstum

**Files:**

- Create: `src/sim/population.ts`
- Modify: `src/sim/types.ts` (`HouseState.services`), `src/sim/build.ts` (Haus-Initialisierung: `services: {}`, `demand` = 1 je Bedarfsgut der Stufe 1)
- Test: `tests/sim/population.test.ts`

**Interfaces:**

- Consumes: `TIERS`, `BUILDING_DEFS`, `center`, `buildingsOfType`, `takeStock`.
- Produces:

```ts
export const GROWTH_INTERVAL = 50;
export function isSupplied(world: World, house: Building): boolean;
export function serviceAvailable(world: World, house: Building, service: ServiceId): boolean; // angebundenes Gebäude mit def.service === service im serviceRadius
export function allNeedsMet(house: HouseState, tier: TierDef): boolean; // supplied && alle needs-Güter satisfied === true && alle tier.services === true
export function tickPopulation(world: World): void; // je Haus: supplied, services, Verbrauch, satisfiedSince; bei tick % 50 === 0: Wachstum (+ Aufstieg ab Task 2)
```

- Test-Helfer (in `tests/sim/helpers.ts` ergänzen): `houseNearKontor(w): Building` (setzt eine freie Kachel 4er-angrenzend an den Kontor-Footprint auf `grass` und platziert ein Haus), `houseFar(w): Building` (Kachel mit Abstand > 8 zu Kontor auf `grass` setzen, Haus platzieren).

- [ ] **Step 1: Failing tests**

```ts
it('new house pulls food immediately and is satisfied', () => { h = houseNearKontor(w); tickPopulation(w) → stock.food 19, h.house.satisfied.food true, supplied true });
it('consumes inhabitants*rate/100 per tick', () => { inhabitants 4 → nach 1 Tick food 19 (Initial-Entnahme), danach nächste Entnahme nach 50 Ticks (4×0.5/100 = 0.02/Tick) → nach 51 Ticks food 18 });
it('unsatisfied when stock empty, demand capped at 1', () => { food 0 → satisfied.food false, demand ≤ 1 });
it('grows every 50 ticks when satisfied, shrinks otherwise, min 1 max 4', ...);
it('house outside supply radius never consumes and never grows', () => { houseFar; food bleibt 20; supplied false; inhabitants bleibt 1 nach 200 Ticks });
it('market supplies only when connected', () => { Markt fern vom Kontor, Haus daneben: connected false → supplied false; Markt-connected = true manuell → supplied true });
it('satisfiedSince resets on any unmet need', ...);
```

- [ ] **Step 2: Run FAIL → Step 3: implementieren (types, build, population) → Step 4: PASS, `make check`.**
- [ ] **Step 5: Commit** `feat: Versorgung, Verbrauch, Zufriedenheit und Wachstum der Häuser`

---

### Task 2: Dienste und Aufstieg

**Files:**

- Modify: `src/sim/population.ts` (`tryUpgrade(world, house): boolean`, Aufruf im Wachstums-Tick nach dem Wachstum), `tests/sim/population.test.ts`

**Interfaces:**

- Produces: `export function tryUpgrade(world: World, b: Building): boolean` — Bedingungen laut Global Constraints; bei Erfolg `pay(upgradeCost)`, `tier + 1`, `demand[neu] = 1`, `satisfiedSince = world.tick`, return true.

- [ ] **Step 1: Failing tests**

```ts
it('faith service needs a connected chapel within radius 10', () => { Kapelle platzieren (connected manuell), Abstand ≤ 10 → true; connected=false → false; Abstand 11 → false });
it('upgrades pioneer house to settler when all conditions hold', () => { Haus max 4, Kapelle connected in Reichweite, cloth ≥ 1, satisfiedSince = tick−300 → tryUpgrade true; tier 2; money −100, wood −5, tools −2; demand.cloth === 1 });
it('does not upgrade without cloth in stock / without chapel / before 300 ticks / below max / when unaffordable', () => { fünf Negativfälle, jeweils tier bleibt 1, kein Geldabzug });
it('settler → citizen needs faith and school and rum', ...);
it('citizen house has no further upgrade', () => { tier 3 → tryUpgrade false });
it('smoke: scripted colony reaches Siedler within 3000 steps', () => { Layout: Wege, 2 Fischerhütten, Schäferei, Weberei, Kapelle, 2 Häuser am Kontor; vorab buy(wood, 40); 3000 × step → mind. ein Haus tier ≥ 2, kein Fehler, money > −5000 });
```

- [ ] **Step 2: FAIL → implementieren → PASS, `make check`.** — [ ] **Step 3: Commit** `feat: Dienste und Aufstieg der Bevölkerungsstufen`

---

### Task 3: Steuern, Sieg, Tick-Reihenfolge

**Files:**

- Modify: `src/sim/economy.ts` (`totalTaxes(world): number`, `tickEconomy` bucht Steuern im selben Takt), `src/sim/tick.ts` (Reihenfolge, `checkWin`), `src/sim/population.ts` (export `citizens(world): number`)
- Test: `tests/sim/economy.test.ts`, `tests/sim/tick.test.ts` (neu)

- [ ] **Step 1: Failing tests**

```ts
it('taxes full when satisfied, half otherwise, floored', () => { Haus 4 Pioniere zufrieden → totalTaxes 8; unzufrieden → 4; 3 Einwohner unzufrieden → floor(3) = 3 });
it('books taxes and upkeep together every 100 ticks; stats reflect both', ...);
it('win at 50 citizens and stays won', () => { Häuser tier 3 mit Summe 49 → won false; 50 → true; Einwohner reduzieren → bleibt true });
it('step order: tick, production, population, economy, win', () => { Spy-frei: Zustand nach 100 steps prüfen — Steuern gebucht, Produktion gelaufen, tick 100 });
```

- [ ] **Step 2: FAIL → implementieren → PASS, `make check`.** — [ ] **Step 3: Commit** `feat: Steuern, Siegbedingung und vollständige Tick-Reihenfolge`

---

### Task 4: UI — Bevölkerung im HUD, Haus-Panel, Siegbanner

**Files:**

- Modify: `src/ui/hud.ts` (Chips „Pioniere 4 · Siedler 0 · Bürger 0", Bilanz „Steuern +8 · Unterhalt −45 / 100 Ticks"), `src/ui/inspect.ts` (Haus: Stufe, Einwohner/max, Liste der Bedürfnisse mit ✓/✗ inkl. Dienste und „Versorgt", Aufstiegsbedingungen als Liste mit ✓/✗ und Kosten), `src/ui/app.ts` (Siegbanner einmalig via `showMessage('Ziel erreicht: 50 Bürger!', 'info', true)` wenn `world.won` von false auf true wechselt), `src/style.css`, `README.md` (Bevölkerung, Ziel)

- [ ] **Step 1: Implementieren.** — [ ] **Step 2: `make check`.** — [ ] **Step 3: Controller-Browsercheck** (Haus bauen → Panel zeigt Bedürfnisse; nach Laufzeit Einwohner steigen; HUD-Chips). — [ ] **Step 4: Commit** `feat: Bevölkerung im HUD, Haus-Panel und Siegbanner`

---

## Self-Review (durchgeführt)

- Spec-Abdeckung: 2.5 Versorgung (T1), 2.7 komplett (T1, T2), 2.8 Steuern/Sperre (T3, checkAfford), 2.9 Sieg (T3), UI (T4). Smoke-Test aus Spec §4 in T2.
- Typkonsistenz: `HouseState.services` in T1 eingeführt, in T2/T4 verwendet; `tryUpgrade` T2, `citizens` T3; `totalTaxes` T3.
- Review Focus 1–5 durch Tests in T1, T2, T3 abgedeckt.
