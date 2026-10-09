# T1b Regeln je Stufe, Aktionen (`tech-sim-engineer`)

Plan-Index: [../2026-10-09-steuer-je-stufe.md](../2026-10-09-steuer-je-stufe.md) (Global Constraints, DoD). AK-IDs: AK-T02, T04, T05, T07–T12, T13 (+ QA-i), T14 (+ QA-a), T15 (+ TECH-H-R7.4), T16, T17 (+ QA-h), T18 (Fall low), T19 (Fall Kaufleute low), T21 (v2 + TECH-H-§6), T42 (Sim-Teil) — Wortlaut in Spec §8 und Anhang 02 (Anhang geht vor).

**Ziel:** Die Regeln aus Spec R2–R7 je Stufe, Kaufleute «hoch» 115 %, «niedrig» für Kaufleute gesperrt, `setTierTaxLevel` und `setTaxLevel` über die Menge C.

## Interfaces

**Consumes (aus T1a):** `TIER_IDS`, `effectiveTaxLevel(w, tier)`, `taxPct(level, tier)`, `taxLocked(w, tier)`, `tierCap`, `taxBaseByTier`, `migrateV9ToV10`, `isValidTaxFields`, `foldBackToV9`, `setAllTax`.

**Produces (T2 nutzt genau diese Namen):**

```ts
// src/sim/tax.ts (P-2: taxTarget und taxChangeSet hier)
export const canRiseTier = (tier: Tier): boolean => TIERS[tier].upgradeCost !== null;
export const taxTarget = (level: TaxLevel, tier: Tier): TaxLevel =>
  level === 'low' && !canRiseTier(tier) ? 'normal' : level;
export const taxChangeSet = (w: World, level: TaxLevel): Tier[] =>
  TIER_IDS.filter((t) => w.taxLevels[t] !== taxTarget(level, t)); // neues Array, aufsteigend
export const noRiseReason = (tier: Tier): string => `${TIERS[tier].name} steigen nicht auf`;
export function setTierTaxLevel(w: World, tier: number, level: string): Result;
// src/sim/unlocks.ts (TECH-H-R7.4)
export function triggerTaxBlocked(world: World, trigger: UnlockTrigger): boolean;
```

`save.ts` und `helpers.ts` importieren `taxTarget`/`canRiseTier` aus `tax.ts` (kein Zyklus).

## Schritt 1 — Tests zuerst (rot)

Neue Datei `tests/sim/taxTiers.test.ts`. Helfer: `addHouse` nach Muster `tests/sim/taxes.test.ts` (rohes Haus, `services` für alle `TIERS[tier].services` = `met`, `supplied = met`); `town4()` nach Muster `town(n)` in `tests/sim/merchants.test.ts` (versorgte Seed-3-Welt, vier Häuser, Lager je Gut 500), danach `placeTownhall(w)` und Dienste wieder `connected = true`.

- [ ] **1.1 AK-T04:** `taxPct('high', 4) === 115`; Stufen 1–3 «hoch» 130; `low` 70, `normal` 100 für alle Stufen.
- [ ] **1.2 AK-T02:** Welt Anhang 01 A, `taxLevels = {1:'low',2:'normal',3:'high',4:'high'}`, `taxCarry = 0`, `money = 0` → `taxUnits === 133_860`; 100 × `tickTaxes` (ohne `tickPopulation`) → `money 669`, `taxCarry 6000`, `stats.taxes 669`.
- [ ] **1.3 AK-T05:** `town4()` mit nur einem Kaufleute-Haus (20 Einw., erfüllt); `step` bis `tick === 450`; `setTierTaxLevel(w, 4, 'high')` ok → `houseCap === 15`; 250 × `step` → 15 Einw.; weitere 500 → 15; dann `taxUnits === 75_900` (Kontrolle vor dem Umschalten: 88 000).
- [ ] **1.4 AK-T07–T12, T16** nach Spec §8.1 und Anhang 01 E (Tabelle E Zeile für Zeile). AK-T11: `serialize` vorher = nachher, ohne Amtsstube derselbe Grund. AK-T16: `tier` ∈ {−1, 0, 1, 4, 5, 1.5, NaN} × `level` ∈ {'low','normal','high','','x'}; bei `ok: false` `serialize` gleich; bei `ok` `serialize` ohne `taxLevels`/`taxLockedUntil` gleich (Welt ohne RNG-Zustand: kein Zufall, keine Nebenwirkung).
- [ ] **1.5 AK-T13 + QA-i (H-2), Wortlaut Anhang 02:** alle vier «hoch», `outageUntil > tick` → `effectiveTaxLevel(w, t) === 'normal'` ∀t, `taxUnits === 100 × Σ`, `houseCap` voll, `taxLevels` «hoch», nach Ausfallende wieder `'high'`. Zusatz: Tick 1000 `setTierTaxLevel(w, 2, 'high')` ok, `taxLockedUntil[2] === 1300`; `demolish(w, hall.id)` ok; bei Tick 1100 `setTierTaxLevel(w, 2, 'normal')` → `'Braucht eine Amtsstube'`, `effectiveTaxLevel(w, 2) === 'normal'`, `taxLevels[2] === 'high'`; `step` bis 1350; neue Amtsstube mit `placeBuilding(w, 'townhall', k.x, k.y + 3)` (Weg `k.x, k.y + 2` steht noch; sonst `placeRoad`), `connected` prüfen; dann `taxLockedUntil[2] === 1300`, `effectiveTaxLevel(w, 2) === 'high'`, `setTierTaxLevel(w, 2, 'normal')` ok.
- [ ] **1.6 AK-T15 + TECH-H-R7.4:** über `nextUnlocks` wie Spec (tierWish 2 genau bei Pioniere «hoch», Siedler «hoch» allein false; tierWish/tierReached 3 bei Siedler «hoch»; ohne Amtsstube false; `houses` false). Direkt: alle vier «hoch», aktive Amtsstube → `triggerTaxBlocked(w, { kind: 'tierWish', tier: 1 })` und `{ kind: 'tierReached', tier: 1 }` → `false`, ohne Wurf; `{ kind: 'tierWish', tier: 2 }` → `true`.
- [ ] **1.7 AK-T42 (Sim, B-1), Wortlaut Anhang 02:** `taxTarget('low',1)` low, `('low',4)` normal, `('high',4)` high, `('normal',3)` normal. Tabelle `taxChangeSet` (`it.each`, je mit aktiver Amtsstube **und** mit `outageUntil > tick`): alle normal → normal `[]`, low `[1,2,3]`, high `[1,2,3,4]`; `{1..3:'low',4:'normal'}` → low `[]`, normal `[1,2,3]`; `{1:'low',2:'normal',3:'normal',4:'high'}` → normal `[1,4]`, high `[1,2,3]`. Je Aufruf `serialize` vorher = nachher, zwei Aufrufe liefern verschiedene Arrays (`not.toBe`). Gleichlauf: je Stand × L ∈ {low, normal, high}, keine Sperre: `setTaxLevel(w, L).ok === (c.length > 0)` mit `c = taxChangeSet(w, L)` vorher; Stufen in c haben danach `taxTarget(L, t)` und Sperre `tick + 300`, alle anderen Wert und Sperre wie vorher.
- [ ] **1.8 AK-T14 + QA-a** (`tests/sim/feast.test.ts`, neuer `describe`): Fälle nach Spec (Siedler «normal» + Bürger «hoch» → ok, Siedler-Wartezeit 150, Bürger «Steuer zu hoch»; nur «hoch»; nur «niedrig»; niedrig + hoch → `Steuer: Fest wirkt auf kein Haus`; Haus «normal» ausserhalb ändert nichts; kein Haus im Radius und alle «hoch» → ok). QA-a: genau ein Haus im Radius, Kaufleute (Stufe 4), Regler `{1:'high',2:'high',3:'high',4:'normal'}`, Rum 30 → `holdFeast` ok, `stock.rum === 30 - FEAST_RUM`, `feastAt === w.tick`. Bei jeder Ablehnung Rum und `feastAt` unverändert.
- [ ] **1.9 Save** (`tests/sim/save.test.ts`, `describe('I-028 Save v10')`): **AK-T17 + QA-h (H-1):** `town4()` bei `tick = 1000`, Häuser Stufen 1–4 versorgt, Regler/Sperren `{1:'low',2:'normal',3:'high',4:'high'}` / `{1:1300,2:0,3:900,4:0}`; `w2 = deserialize(serialize(w)).world`; beide 600 × `step`, bei `tick === 1300` in beiden `setTierTaxLevel(·, 1, 'normal')` → ok; danach `serialize(w2) === serialize(w)` und `w2.tick === 1600`. **AK-T18 Fall low:** v9 `taxLevel 'low'`, Sperre 450 → `{1..3:'low',4:'normal'}`, alle Sperren 450. **AK-T19:** `taxLevels['4'] = 'low'` → `'Beschädigter Spielstand'`. **AK-T21 + TECH-H-§6 (H-6):** `save-v2.json` → `{1..3:'low',4:'normal'}`, Sperren 1300; für `save-v2.json` (L = low) und `save-v4.json` (L = high): 0 Häuser mit `tier === 4`, `taxUnits(world) === (townhallActive(world) ? taxPct(L, 1) : 100) × Σₜ taxBaseByTier(world)[t]`.
- [ ] **1.10 Rot:** `npx vitest run tests/sim/taxTiers.test.ts tests/sim/feast.test.ts tests/sim/save.test.ts; echo EXIT=$?` → FAIL, Auszug je Fall. Commit `test: I-028 T1b Regeln je Stufe (rot)`.

## Schritt 2 — Umsetzung

- [ ] **2.1 Defs:** `high: { name: 'hoch', pct: 130, upgradeWait: null, occupancy: 0.75, pctByTier: { 4: 115 } }`.
- [ ] **2.2 `tax.ts`:** Funktionen aus «Produces»; `setTierTaxLevel` Prüfreihenfolge R6.1:

`setTierTaxLevel` (R6.1): `asTier(tier) === null` oder unbekanntes `level` → `'Ungültige Stufe'`; `'low'` und `!canRiseTier(t)` → `noRiseReason(t)`; keine aktive Amtsstube → `townhallReason`; gleicher Wert → `'Stufe bereits aktiv'`; `taxLocked` → `'Sperrzeit'`; sonst Wert setzen, `taxLockedUntil[t] = tick + TAX_SWITCH_LOCK`.
`setTaxLevel` R6.2: Ungültig → Amtsstube → `c = taxChangeSet(world, level)`; leer → `'Stufe bereits aktiv'`; `c.some(taxLocked)` → `'Sperrzeit'` (nichts geändert); sonst je `t ∈ c`: `taxLevels[t] = taxTarget(level, t)`, Sperre `tick + TAX_SWITCH_LOCK`.

- [ ] **2.3 `feast.ts` R7.3:** gemeinsamer Helfer `inChapelRadius(chapel, house)` (Rechnung aus `feastActive`, dort genutzt, bitgleich); `taxBlock(world, chapel)`: H = Wohnhäuser mit `inChapelRadius`; Stufen-Level `effectiveTaxLevel(world, h.house.tier)`; H leer oder ein `normal` → `null`; alle `high` → `` `Steuer «${TAX_LEVELS.high.name}»: kein Aufstieg` ``; alle `low` → `` `Steuer «${TAX_LEVELS.low.name}»: Fest ohne Wirkung` ``; sonst `'Steuer: Fest wirkt auf kein Haus'`. Position in `feastBlock` wie heute (vor der Rum-Prüfung).
- [ ] **2.4 `unlocks.ts`:** `triggerTaxBlocked = (w, tr) => (tr.kind === 'tierWish' || tr.kind === 'tierReached') && tr.tier >= 2 && effectiveTaxLevel(w, (tr.tier - 1) as Tier) === 'high'`; `nextUnlocks` setzt `taxBlocks: triggerTaxBlocked(w, u.trigger)`.
- [ ] **2.5 `save.ts`:** in `migrateV9ToV10` `taxTarget(l as TaxLevel, t)` statt `l` (ungültige Werte bleiben unverändert und werden abgewiesen); in `isValidTaxFields` zusätzlich `!(l === 'low' && !canRiseTier(t))`.
- [ ] **2.6 `tests/sim/helpers.ts`:** `setAllTax` → `w.taxLevels[t] = taxTarget(level, t)`. `save.test.ts` (T1a 3.5): Erwartung der Kettenfälle auf `taxTarget(v9Level, t)` umstellen.
- [ ] **2.7 Grün:** gezielte Dateien, dann schnelle Make-Prüfungen und `make check; echo EXIT=$?` → **alle Tests grün**, Diff-Sperre. Bestandstests, die jetzt rot würden, nur dann anpassen, wenn sie Kaufleute unter «hoch»/«niedrig» rechnen (R412) — jede Änderung im Bericht mit Grund. Commit `feat: I-028 T1b Steuer je Stufe in der Sim`.
