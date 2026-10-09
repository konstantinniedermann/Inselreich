# T1a Weltform, Save v10, Bestandstests (`tech-sim-engineer`)

Plan-Index: [../2026-10-09-steuer-je-stufe.md](../2026-10-09-steuer-je-stufe.md) (Global Constraints, DoD). AK-IDs: AK-T01, T03, T06, T17 (Grundfall), T18 (high/normal, P-1), T19 (Formfälle + QA-g), T20 (QA-b), T21 (Kette, v4), T22, T23 (+ TECH-B1), T24 (+ TECH-B2), T25 — Wortlaut in Spec §8 und Anhang 02.

**Ziel:** Nur die Form ändert sich; alle vier Regler bleiben gleich (`setTaxLevel` setzt alle vier), das Verhalten ist bitgleich zu `main`. Regeln je Stufe folgen in T1b.

## Interfaces — Produces (T1b und T2 nutzen genau diese Namen)

- `types.ts`: `TaxLevelDef.pctByTier?: Partial<Record<Tier, number>>` (Wert erst T1b); `World.taxLevels: Record<Tier, TaxLevel>`, `World.taxLockedUntil: Record<Tier, number>` (statt `taxLevel`).
- `defs/tiers.ts`: `TIER_IDS: readonly Tier[]`. `townhall.ts`: `effectiveTaxLevel(w, tier): TaxLevel` (aktiv ? `taxLevels[tier]` : `'normal'`), `taxPct(level, tier): number` (`pctByTier?.[tier] ?? pct`).
- `tax.ts`: `taxLocked(w, tier): boolean`. `population.ts`: `tierCap(tier, level): number`, `taxBaseByTier(world): Record<Tier, number>`.
- `save.ts`: `SAVE_VERSION = 10`, `migrateV9ToV10(raw): void`. `tests/sim/helpers.ts`: `foldBackToV9(v10): Record<string, unknown>`, `setAllTax(w, level): void`.

## Schritt 1 — Tests zuerst (rot), im neuen `describe('I-028 Save v10')` in `tests/sim/save.test.ts`

- [ ] **1.1 AK-T01 + P-1:** `createWorld(3, { unlockAll: true })` → `taxLevels` `{1:'normal',2:'normal',3:'normal',4:'normal'}`, `taxLockedUntil` `{1:0,…,4:0}`, `'taxLevel' in w === false`; `expect(SAVE_VERSION).toBe(10)`; `createWorld(3).version === 10`.
- [ ] **1.2 AK-T03 (Bitgleichheit):** Häuser roh wie `addHouse` in `tests/sim/taxes.test.ts` (Muster kopieren), aktive Amtsstube (`placeTownhall`). Welt ohne Häuser → `taxUnits === 0` für jede Einstellung (Randfall leere Insel). Nur Stufen 1–3: `setAllTax(w, L)` für L ∈ {normal, high} → `taxUnits(w) === TAX_LEVELS[L].pct × Σₜ taxBaseByTier(w)[t]`; alle normal mit einem Kaufleute-Haus → `100 × Σ`.
- [ ] **1.3 AK-T06:** `TIER_IDS.map((t) => tierCap(t, 'high'))` → `[3, 6, 11, 15]`; für `normal` und `low` → `[4, 8, 15, 20]`.
- [ ] **1.4 AK-T17 Grundfall:** `w.taxLevels = {1:'low',2:'normal',3:'high',4:'high'}`, `w.taxLockedUntil = {1:1300,2:0,3:900,4:0}` direkt gesetzt → `deserialize(serialize(w))` ok und `toEqual(w)`.
- [ ] **1.5 AK-T18 (high, normal) + P-1:** v9-Text über `JSON.stringify(foldBackToV9(JSON.parse(serialize(w))))` mit `setAllTax(w, 'high')` und allen Sperren 450 → geladen: alle vier `'high'`, alle Sperren 450, `version === 10`, kein `taxLevel`; dasselbe für `normal`/0. Jede Fixture v1…v9 (`tests/sim/fixtures/save-v*.json`, `see-route-start-v9.json`, `z3-scenario-v9.json`) lädt mit `version === 10`.
- [ ] **1.6 AK-T19 Formfälle + QA-g:** je `'Beschädigter Spielstand'`, kein Wurf: `taxLevels['2'] = 'extreme'`; `taxLevels` ohne `"3"` / mit `"5"`; nur `taxLevel`; `taxLockedUntil['1']` = −1, 1.5, `'300'`; `taxLockedUntil` als Zahl; `taxLockedUntil` `{"1":0,"2":0,"4":0}` und `{"1":0,"2":0,"3":0,"4":0,"5":0}`; v9 mit `taxLevel 'extreme'`.
- [ ] **1.7 AK-T20 (QA-b):** gültiger Stand mit `version = SAVE_VERSION + 1` → `'Unbekannte Version'`, kein Wurf; Zahl aus `SAVE_VERSION`.
- [ ] **1.8 AK-T21 Kette, v4:** `save-v4.json` → alle `'high'`, alle Sperren 5100. (v2 mit Kaufleute-Ausnahme folgt in T1b.)
- [ ] **1.9 AK-T24 + TECH-B2 (H-5)**, Helfer-Tests in `save.test.ts`:
  - `{1..4:'normal'}` → `taxLevel 'normal'`; `{1..3:'low',4:'normal'}` → `'low'`; `{1:'low',2:'normal',3:'normal',4:'normal'}` → wirft; Sperren `{1:1300,2:1300,3:1300,4:0}` → `taxLockedUntil 1300`.
  - Eingabe mit Zusatzschlüssel `foo` → wirft; Eingabe, die noch `taxLevel` enthält → wirft.
  - Frischer Stand: `Object.keys(foldBackToV9(JSON.parse(serialize(createWorld(3)))))` gleich den Schlüsseln von `see-route-start-v9.json`.
  - Migrierter v8: Fall «T00 save-v8.json lädt (v8)» (`save.test.ts:1387`) → `JSON.stringify(foldBackToV8(foldBackToV9(JSON.parse(serialize(r.world)))))` === Fixture-Text.
  - Migrierter v9: `see-route-start-v9.json` laden → `JSON.stringify(foldBackToV9(JSON.parse(serialize(r.world))))` === Fixture-Text.
- [ ] **1.10 Rot belegen:** `npx vitest run tests/sim/save.test.ts; echo EXIT=$?` → FAIL; Auszug je Fall in den Bericht. Commit `test: I-028 T1a Save v10 und Weltform (rot)`.

## Schritt 2 — Umsetzung (Verhalten bitgleich)

- [ ] **2.1 Typen, Defs, `createWorld`:** Felder wie oben; `createWorld`: `version: 10`, `taxLevels` alle `DEFAULT_TAX_LEVEL`, `taxLockedUntil` alle 0 (je `Object.fromEntries(TIER_IDS.map(…))`), an der bisherigen Schlüsselstelle.
- [ ] **2.2 `townhall.ts`:** `effectiveTaxLevel(w, tier)` und `taxPct` wie oben (`taxPct` hier wegen Import-Zyklus `tax → unlocks → population`).
- [ ] **2.3 `tax.ts`:** `taxLocked(w, t) = w.tick < w.taxLockedUntil[t]`. `setTaxLevel` behält Reihenfolge und Gründe; «bereits aktiv», wenn alle vier `=== level`; «Sperrzeit», wenn irgendein `taxLocked`; sonst alle vier auf `level` und Sperre `tick + TAX_SWITCH_LOCK` (Verhalten wie heute, C-Logik erst in T1b).
- [ ] **2.4 `population.ts`:** `houseCap = tierCap(house.tier, effectiveTaxLevel(world, house.tier))`; `upgradeStatus`: `base` aus `effectiveTaxLevel(world, house.tier)`; `taxBaseByTier` = Sₜ (Id-Reihenfolge); `taxUnits = Σₜ S[t] × taxPct(effectiveTaxLevel(world, t), t)` (JSDoc: Bitgleich-Argument Spec §6 b).
- [ ] **2.5 `feast.ts`, `unlocks.ts`:** nur `effectiveTaxLevel(world)` → `effectiveTaxLevel(world, 1)` (in T1a stehen alle vier Regler gleich; T1b ersetzt beide Stellen durch die Regeln R7.3/R7.4).
- [ ] **2.6 `save.ts`:** `SAVE_VERSION = 10`. Steuer-Teil von `isValidV2Fields` → `isValidTaxFields(raw)`: `taxLevels` und `taxLockedUntil` sind Objekte mit genau den Schlüsseln `TIER_IDS.map(String)`; jeder Level ein Schlüssel von `TAX_LEVELS`, jede Sperre `isInt` und ≥ 0 (Kaufleute-«low»-Regel erst in T1b). `migrateV9ToV10(raw)` (wirft nie): falls `'taxLevel' in raw` → `raw.taxLevels = Object.fromEntries(TIER_IDS.map((t) => [t, raw.taxLevel]))`, `delete raw.taxLevel`; falls `'taxLockedUntil' in raw` → je Stufe der alte Wert; `raw.version = 10`; ungültige Werte unverändert übernehmen (Prüfung weist ab). `deserialize`: nach der v8-Zeile `if (raw.version === 9) migrateV9ToV10(raw);`.
- [ ] **2.7 `src/ui` mechanisch (nur Kompilieren, gleiches Ergebnis):** `effectiveTaxLevel(world)` → `effectiveTaxLevel(world, 1)` in `hover.ts:166`, `hud.ts:107/518/526`, `inspect.ts:637/990`, `guide.ts:165`; `world.taxLevel` → `world.taxLevels[1]` (`inspect.ts:633`); `w.taxLockedUntil` → `w.taxLockedUntil[1]` (`hints.ts:144`, `inspect.ts:638`).
- [ ] **2.8 Helfer `tests/sim/helpers.ts`** (Spec §6, TECH-B2): `setAllTax(w, L)` setzt alle vier `taxLevels[t] = L` (T1b: `taxTarget`). `foldBackToV9(v10)`: erlaubte Schlüssel = `V9_WORLD_KEYS` mit `taxLevels` statt `taxLevel`, sonst `throw` (auch für `taxLevel`, `foo`); Werte a…d der Stufen 1–4 müssen `a === b === c` und (`d === a` oder `a === 'low' && d === 'normal'`) erfüllen, sonst `throw`; Ergebnis neu aufbauen in `V9_WORLD_KEYS`-Folge, nur vorhandene Schlüssel: `version` 9, `taxLevel` = a, `taxLockedUntil` = Maximum der vier Sperren, Rest unverändert.
- [ ] **2.9 Grün:** `npx vitest run tests/sim/save.test.ts; echo EXIT=$?` → PASS für die neuen Fälle. Commit `feat: I-028 T1a Weltform je Stufe und Save v10`.

## Schritt 3 — Bestandstests (nur Form; jede Geld-, Steuer- und Pin-Erwartung bleibt)

- [ ] **3.1 TECH-B1:** `save.test.ts:1767` → `expect(json).toBe(JSON.stringify(foldBackToV9(JSON.parse(serialize(seeRouteStart())))))`; `goal3.test.ts:139` ebenso mit `spiceGoalScenario({ forBrowser: true })`; `deserialize(json).ok` bleibt.
- [ ] **3.2** `foldBackToV8(x)` → `foldBackToV8(foldBackToV9(x))` an allen 18 Stellen in `save.test.ts` (inkl. `CHAIN_HASHES`) und in `normalized()` von `balance-crises.test.ts:25`.
- [ ] **3.3 Versionen:** Assertions auf die aktuelle Version → `toBe(SAVE_VERSION)`: `save.test.ts` 114, 119, 135, 371, 390, 411, 529, 551, 572, 593, 671, 695, 699, 889, 995, 1009, 1019, 1032, 1225, 1226, 1252, 1347, 1433, 1434, 1654; `scenario-saves.test.ts:514`; `unlocks.test.ts:129`. **Bleibt 9:** `save.test.ts:1521` (`migrateV8ToV9` direkt).
- [ ] **3.4 «Unbekannte Version»:** `version = 10` / `version: 10` → `SAVE_VERSION + 1` in `save.test.ts` 173, 254, 494, 620, 775, 890, 1168, 1337, 1662.
- [ ] **3.5 Steuerfelder `save.test.ts`:** 120–121, 136–137 → Objekte; AK-S1-03 (147–148) → alle vier `'high'` / 450; AK-S1-04 (160, 168, 169) → `taxLevels['2'] = 'extrem'`, `taxLockedUntil['1'] = 1.5` / `-7`; 400, 414–415, 559, 578 → je Stufe der v9-Wert (T1b: `taxTarget`); AK-S1-12 (675–679) → alle `'high'`, Sperre je Stufe = `raw.taxLockedUntil`.
- [ ] **3.6 Direktzuweisungen `w.taxLevel = L` → `setAllTax(w, L)`:** `taxes.test.ts:214,236,263,265`, `townhall.test.ts:91,99,101,293,299,345`, `feast.test.ts:66,73,78,174,176`, `merchants.test.ts:183` (Bürger-Haus, Erwartung bleibt; R412), `scenarios.ts:626`. Lesezugriffe: `taxes.test.ts:189,192,195,199,202` → `[1]`; `townhall.test.ts:107,132,136,139,356` → Objekte; `effectiveTaxLevel(w)` → `effectiveTaxLevel(w, 2)` in `townhall.test.ts`; `scenario-saves.test.ts:372` → alle `'normal'`.
- [ ] **3.7 `tests/ui` mechanisch:** `feast.test.ts:57`, `hud.test.ts:150`, `inspect.test.ts:242`, `startCard.test.ts:100`, `guide.test.ts:31,90,189,202,413` → `setAllTax`; `hints.test.ts:69` → `w.taxLockedUntil[1] = …`, `:191` → `setTaxLevel(w, w.taxLevels[1])`, `:210` → `setAllTax(w, 'normal')`. `hover.test.ts` bleibt unberührt.
- [ ] **3.8 Prüfen:** schnelle Make-Prüfungen; `make check; echo EXIT=$?` → **alle Tests grün**; Diff-Sperre (Index, DoD). Commit `test: I-028 T1a Bestandstests auf Save v10`.
