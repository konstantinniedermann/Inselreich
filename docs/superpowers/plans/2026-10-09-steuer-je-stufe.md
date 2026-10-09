# Steuer je Stufe (I-028) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vier getrennte Steuerregler (Pioniere, Siedler, Bürger, Kaufleute) in der Amtsstube, Save v10, ohne Spielstand- oder Baseline-Bruch.

**Architecture:** Der Weltzustand trägt `taxLevels`/`taxLockedUntil` je Stufe; jede Regel liest `effectiveTaxLevel(world, tier)` für die Stufe des betroffenen Hauses. Steuer wird je Stufe summiert und einmal verbucht (bitgleich bei vier gleichen Reglern). Save v10 migriert v9 in einem Schritt; Hash-Pins falten über `foldBackToV9` zurück. Die UI bekommt reine Helfer in `src/ui/taxView.ts` und ein 4 × 3-Raster im Amtsstuben-Panel.

**Tech Stack:** TypeScript, Vitest, Canvas-2D-App ohne Laufzeit-Abhängigkeit.

**Spec:** `docs/superpowers/specs/2026-10-09-steuer-je-stufe-design.md` mit `anhang-01-rechenbeispiele.md` und (entsteht parallel) `anhang-02-gate-auflagen.md`; verbindlich zusätzlich R412 und R414 (Auflagen a–i, B1, B2, P-1, P-2) in `docs/studio/rulings.md`.

Prozessstufe voll · Paket I-028 · Meilenstein ohne · Planbasis `main` @ c717f7b.

## Global Constraints

- `SAVE_VERSION = 10` fest (R414 P-1); Migration `migrateV9ToV10`; R8.5 (v11) nur Notfallregel, falls vor dem Merge doch E6 v10 belegt.
- Sim-Gründe bleiben wörtlich `'Sperrzeit'` und `'Steuer zu hoch'`; die UI erfährt die Stufe über `ReasonCtx.tier?: Tier` in `src/ui/hints.ts` (R414 P-2).
- Menge C aus R6.2 ist die reine Sim-Funktion `taxChangeSet`, von `setTaxLevel` und UI gemeinsam genutzt (R414 P-2, DRY).
- Neuer Def-Wert nur `TAX_LEVELS.high.pctByTier = { 4: 115 }` (R412 O1); keine Wertänderung für Stufen 1–3.
- `tests/sim/balance.test.ts` und `tests/sim/e0Pins.ts` bleiben byte-gleich zu `main`; kein Pin-Wert wird geändert (AK-T22, AK-T23, AK-T25).
- `src/sim/` DOM-frei, kein RNG-Zugriff in neuen Pfaden, Aktionen werfen nie, `{ ok, reason }`.
- Keine neue Abhängigkeit, kein ADR (Spec §9).
- UI desktop-first, Panel-Spalte 280 px; unter 900 px nur «stürzt nicht ab».
- Commit-Präfixe `feat:`, `fix:`, `test:`, `docs:`, `refactor:`; kein Rebase, kein Force-Push.

## Review Focus

1. **Key-Reihenfolge migrierter Stände:** `migrateV9ToV10` hängt `taxLevels` hinten an; jeder Pin über einen migrierten, _unsortierten_ JSON-Text muss über `foldBackToV9` (Reihenfolge `V9_WORLD_KEYS`, B2) laufen. Test: AK-T24 Fall «migrierter Stand» in T1.
2. **Feste `version = 10` als «unbekannt» in Bestandstests:** 9 Stellen in `save.test.ts` prüfen heute `version 10 → Unbekannte Version`; nach v10 ist das gültig. Alle auf `SAVE_VERSION + 1` (R414 b). Test: T1 Schritt 1.7.
3. **Fest ohne Häuser im Radius:** Neue Regel lehnt nur ab, wenn H nicht leer ist und kein Haus «normal» hat; Bestandstests mit leerem Radius würden still grün. Test: AK-T14 Fall «kein Haus im Radius, alle hoch → ok» in T1.
4. **Kaufleute «niedrig» über Umwege:** Direktzuweisung in Tests, Migration und `setTaxLevel('low')` dürfen nie `taxLevels[4] = 'low'` erzeugen; Ladeprüfung weist es ab. Test: AK-T10, AK-T18, AK-T19 in T1; Helfer `setAllTax` nutzt `taxTarget`.
5. **Sperrhinweis «alle Stufen» nennt die richtige Stufe:** kleinste _gesperrte_ Stufe in C, nicht die kleinste gesperrte überhaupt. Test: AK-T31 Fall «Pioniere gesperrt, aber schon Ziel» in T2.

---

## Architektur (≤ 15 Zeilen)

- `src/sim/defs/tiers.ts`: `TIER_IDS`, `TAX_LEVELS.high.pctByTier`. `src/sim/types.ts`: `TaxLevelDef.pctByTier?`, `World.taxLevels`, `World.taxLockedUntil: Record<Tier, number>`.
- `src/sim/townhall.ts` (keine Zyklen, importiert nur Defs): `effectiveTaxLevel(w, tier)`, `taxPct(level, tier)`, `taxTarget(level, tier)`, `canRiseTier(tier)`.
- `src/sim/tax.ts`: `taxChangeSet(w, level)`, `taxLocked(w, tier)`, `setTierTaxLevel`, `setTaxLevel`, `noRiseReason(tier)`.
- `src/sim/population.ts`: `tierCap(tier, level)`, `taxBaseByTier(world)`; `houseCap`, `upgradeStatus`, `taxUnits` je Stufe.
- `src/sim/feast.ts`: Steuer-Ablehnung nach R7.3 über Häuser im Radius. `src/sim/unlocks.ts`: `taxBlocks` nach Vorstufe.
- `src/sim/save.ts`: v10, `migrateV9ToV10`, `isValidTaxFields`. `tests/sim/helpers.ts`: `foldBackToV9`, `setAllTax`.
- `src/ui/taxView.ts` (neu, rein): Summary, Mix-Liste, Tooltips, Minute, Sperrtext, Statuszeile, Kopfzeilen-Tooltip.
- `src/ui/inspect.ts` (Raster), `hud.ts`, `hover.ts`, `hints.ts` (`ReasonCtx.tier`), `guide.ts`, `app.ts` (Aktion `setTierTax`), `src/style.css`.
- Datenfluss UI → Sim nur über `setTaxLevel`/`setTierTaxLevel`; `src/render/` unberührt.

## Datei-Ownership (ein Strang `steuer-je-stufe`, Branch `feat/steuer-je-stufe`, Worktree `.worktrees/steuer-je-stufe`)

| Task | Eigentümer          | Dateien (ausschliesslich in diesem Task)                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1   | `tech-sim-engineer` | `src/sim/{types,world,townhall,tax,population,feast,unlocks,save}.ts`, `src/sim/defs/tiers.ts`; `tests/sim/{taxTiers.test.ts (neu),helpers.ts,save.test.ts,goal3.test.ts,balance-crises.test.ts,scenario-saves.test.ts,scenarios.ts,unlocks.test.ts,taxes.test.ts,townhall.test.ts,feast.test.ts,merchants.test.ts}`; **mechanisch nur zum Kompilieren:** `src/ui/{hover,hints,hud,inspect,guide}.ts`, `tests/ui/{feast,hints,hud,inspect,startCard,guide}.test.ts` |
| T2   | `tech-ui-engineer`  | `src/ui/taxView.ts` (neu), `src/ui/{inspect,hud,hover,hints,guide,app}.ts`, `src/style.css`, `tests/ui/taxView.test.ts` (neu), `tests/ui/{format,hints,hud,hover,inspect,guide,startCard}.test.ts`; D1-Doku ausdrücklich erlaubt (E-017): `README.md`, `docs/arc42.md`                                                                                                                                                                                              |
| T3   | `qa-playtester`     | nur `.studio/qa/steuer-je-stufe/` (Screenshots, Szenenskript); ändert keinen Code                                                                                                                                                                                                                                                                                                                                                                                   |

Seriell T1 → T2 → T3 im selben Worktree (T2 berührt dieselben `src/ui`-Dateien wie T1 mechanisch, darum keine Parallelität). `tests/sim/balance.test.ts`, `tests/sim/e0Pins.ts`, `tests/sim/e1Pins.ts`, alle Fixtures unter `tests/sim/fixtures/` sind für alle Tasks **gesperrt**.

## Budgetantrag

Formel: Pakete × 2 + QA-Checks + 1 Final-Review = 2 × 2 + 1 + 1 = **6**; + 30 % = 7,8 → **8 Starts**, Parallelität **1**.

| Start | Rolle               | Modell | Zweck                        |
| ----- | ------------------- | ------ | ---------------------------- |
| 1     | `tech-sim-engineer` | sonnet | T1                           |
| 2     | `qa-code-reviewer`  | sonnet | Review T1                    |
| 3     | `tech-ui-engineer`  | sonnet | T2                           |
| 4     | `qa-code-reviewer`  | sonnet | Review T2                    |
| 5     | `qa-playtester`     | sonnet | T3 Browser-Check             |
| 6     | `qa-code-reviewer`  | opus   | Final-Review über die Branch |
| 7–8   | Puffer              | –      | nur nach Meldung an L0       |

Fix-Runden per SendMessage zählen nicht. Controller `lead-tech` auf `sonnet` (Controller-Regel, ≤ 4 Tasks, Übergabe nach 6 Arbeiter-Starts). Schätzung gesamt ≈ 310 Tools, ≈ 52 min (richtwerte.md: Sim-Code ≈ 80, UI-Code ≈ 60, 2 × Task-Review 11, Playtest 47, Final-Review 60, Controller ≈ 40).

## Task-Tabelle

| ID  | Titel                                           | Dateien                       | AK-IDs                                 | Strang          | blocked-by          | Modell |
| --- | ----------------------------------------------- | ----------------------------- | -------------------------------------- | --------------- | ------------------- | ------ |
| T0  | Basismessung Testzeiten (R392), Controller      | keine                         | –                                      | steuer-je-stufe | Push dieser Session | sonnet |
| T1  | Sim + Save v10 + Bestandstests                  | siehe Ownership T1            | AK-T01–T25, R414 a, b, g, h, i, B1, B2 | steuer-je-stufe | T0                  | sonnet |
| T2  | UI: Helfer, Raster, Kopfzeile, Hinweise, Doku   | siehe Ownership T2            | AK-T26–T33, R414 c, d (T33), e         | steuer-je-stufe | T1 (Review OK)      | sonnet |
| T3  | Browser-Check `qa-playtester`                   | `.studio/qa/steuer-je-stufe/` | AK-T34–T41, R414 d (T36), f            | steuer-je-stufe | T2 (Review OK)      | sonnet |
| T4  | Final-Review `qa-code-reviewer` über die Branch | –                             | alle, insb. AK-T22, T23, T25           | steuer-je-stufe | T3                  | opus   |

## Pflichten je Task (DoD, gilt für T1 und T2)

- **R392 Zeiten:** vor dem Task auf `main` messen (T0), nach dem Task dieselben Dateien auf main und Branch unmittelbar nacheinander; kein bestehender Test > 500 ms oder > +50 %; Zeiten vorher/nachher im Bericht.
- **Schnelle Make-Prüfungen** (R398, R410), jede mit `; echo EXIT=$?`, nie in eine Pipe: `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts` → Exit 0.
- **Rot-Beleg (R395, R410):** je neuem Testfall die rote Ausgabe vor dem Fix im Task-Bericht (Befehl + Auszug); Commit-Reihenfolge allein genügt nicht.
- **Abschluss:** `make check` Exit 0 (Lauf > 4 min → `run_in_background: true`, alle 4 min abfragen, E-037); `git diff main -- tests/sim/balance.test.ts tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/fixtures/` leer.
- Entfällt eine Vorbedingung, nennt die Abnahme die Fehlerrichtung und belegt, dass das abhängige Gate erfüllbar bleibt (R395). Prüfschritte nicht zur Budgetersparnis streichen; Mehrbedarf vorher melden.

---

## T0 Basismessung (Controller, R392, E-052)

Nur bei Maschinenlast ≤ 4 (`uptime`, Wert in den Bericht; bei der Planung 4,83 → darum hier noch keine Zeiten). Auf `main` im Hauptcheckout:

```bash
npx vitest related --run src/sim/population.ts src/sim/tax.ts src/sim/townhall.ts src/sim/save.ts src/sim/feast.ts src/sim/unlocks.ts src/sim/world.ts src/sim/defs/tiers.ts > "$SCRATCH/t1-main.txt"; echo EXIT=$?
npx vitest run tests/ui/feast.test.ts tests/ui/hints.test.ts tests/ui/hud.test.ts tests/ui/inspect.test.ts tests/ui/startCard.test.ts tests/ui/guide.test.ts tests/ui/hover.test.ts tests/ui/format.test.ts > "$SCRATCH/t2-main.txt"; echo EXIT=$?
```

(`$SCRATCH` = Scratchpad-Verzeichnis der Controller-Session.) Alle Tests > 200 ms mit Zeit ins Ledger `.superpowers/sdd/steuer-je-stufe/ledger.md`; T1/T2-Briefing nennt diese Liste. Bei Last > 4 verschieben, nicht erzwingen; dann `blocked`-Status mit Grund loggen.

Danach Worktree anlegen: `git worktree add .worktrees/steuer-je-stufe -b feat/steuer-je-stufe main`.

---

## T1 Sim + Save v10 + Bestandstests (`tech-sim-engineer`)

**Files:** siehe Ownership T1. **Interfaces — Produces (T2 nutzt genau diese Namen):**

```ts
// src/sim/defs/tiers.ts
export const TIER_IDS: readonly Tier[]; // [1, 2, 3, 4], aus Object.keys(TIERS)
// src/sim/townhall.ts
export function effectiveTaxLevel(w: World, tier: Tier): TaxLevel;
export function taxPct(level: TaxLevel, tier: Tier): number; // pctByTier?.[tier] ?? pct
export function canRiseTier(tier: Tier): boolean; // TIERS[tier].upgradeCost !== null
export function taxTarget(level: TaxLevel, tier: Tier): TaxLevel; // 'low' && !canRiseTier → 'normal'
// src/sim/tax.ts
export function taxChangeSet(w: World, level: TaxLevel): Tier[]; // aufsteigend, taxLevels[t] !== taxTarget(level, t)
export function taxLocked(w: World, tier: Tier): boolean; // w.tick < w.taxLockedUntil[tier]
export function noRiseReason(tier: Tier): string; // `${TIERS[tier].name} steigen nicht auf`
export function setTierTaxLevel(w: World, tier: number, level: string): Result;
export function setTaxLevel(w: World, level: string): Result;
// src/sim/population.ts
export function tierCap(tier: Tier, level: TaxLevel): number; // max(1, ⌊maxInhabitants × occupancy⌋)
export function taxBaseByTier(world: World): Record<Tier, number>; // Sₜ nach R2.1
// tests/sim/helpers.ts
export function foldBackToV9(v10: Record<string, unknown>): Record<string, unknown>;
export function setAllTax(w: World, level: TaxLevel): void; // taxLevels[t] = taxTarget(level, t), Sperren unberührt
```

### Schritt 1 — Tests zuerst (rot), `tests/sim/taxTiers.test.ts` neu

- [ ] **1.1 Testwelt.** Lokale Helfer nach dem Muster `addHouse` aus `tests/sim/taxes.test.ts` (rohes Haus, `services` für alle `TIERS[tier].services` = `met`, `supplied = met`) und `merchantTown()` nach dem Muster `town(1)` aus `tests/sim/merchants.test.ts` (echte, versorgte Seed-3-Welt; Lager je Gut 500, `spice` 500), jeweils danach `placeTownhall(w)` und Dienste wieder `connected = true`.
- [ ] **1.2 AK-T01, AK-T04, AK-T06:**

```ts
it('AK-T01 createWorld: vier Regler normal, Sperren 0, kein taxLevel', () => {
  const w = createWorld(3, { unlockAll: true });
  expect(w.taxLevels).toEqual({ 1: 'normal', 2: 'normal', 3: 'normal', 4: 'normal' });
  expect(w.taxLockedUntil).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0 });
  expect('taxLevel' in w).toBe(false);
});
it('AK-T04 taxPct', () => {
  expect(taxPct('high', 4)).toBe(115);
  for (const t of [1, 2, 3] as const) expect(taxPct('high', t)).toBe(130);
  for (const t of TIER_IDS) expect([taxPct('low', t), taxPct('normal', t)]).toEqual([70, 100]);
});
it('AK-T06 Zielbelegung je Stufe', () => {
  expect(TIER_IDS.map((t) => tierCap(t, 'high'))).toEqual([3, 6, 11, 15]);
  for (const l of ['normal', 'low'] as const)
    expect(TIER_IDS.map((t) => tierCap(t, l))).toEqual([4, 8, 15, 20]);
});
```

- [ ] **1.3 AK-T02, AK-T03, AK-T13:** Welt nach Anhang 01 A (Pioniere 4 erfüllt, Siedler 8 erfüllt + 8 unerfüllt, Bürger 11 erfüllt, Kaufleute 15 erfüllt), `w.taxLevels = { 1: 'low', 2: 'normal', 3: 'high', 4: 'high' }`, `taxCarry = 0`, `money = 0`: `taxUnits(w) === 133_860`; danach 100 × `tickTaxes(w)` (ohne `tickPopulation`) → `money 669`, `taxCarry 6000`, `stats.taxes 669`. AK-T03: Welt ohne Häuser → `taxUnits === 0` bei jeder Einstellung (Randfall leere Insel); nur Stufen 1–3, `setAllTax(w, L)` für L ∈ {normal, high} → `taxUnits === TAX_LEVELS[L].pct × Σ taxBaseByTier`; alle normal mit Kaufleuten → `100 × Σ`. AK-T13 inkl. R414 (i): alle vier «hoch», Amtsstube `outageUntil = tick + 100` → `effectiveTaxLevel(w, t) === 'normal'` ∀t, `taxUnits === 100 × Σ`, `houseCap` voll, `taxLevels` weiter «hoch»; `setTierTaxLevel(w, 2, 'low')` bei `taxLockedUntil[2] = tick + 50` → `'Amtsstube wirkt nicht'`, Sperre unverändert, nach 50 Ticks (`w.tick += 50`) gilt `taxLocked(w, 2) === false`; Amtsstube abreissen (`demolish`), neue mit `placeTownhall` → `effectiveTaxLevel(w, 3) === 'high'`, `taxLevels` unverändert, keine neue Sperre.
- [ ] **1.4 AK-T05:** `merchantTown()`, Haus Stufe 4 mit 20 Einwohnern, alle Bedürfnisse erfüllt; `step(w)` bis `w.tick === 450`; `setTierTaxLevel(w, 4, 'high')` ok → `houseCap(w, h.house) === 15`; 250 × `step` → Einwohner 15; weitere 500 × `step` → weiter 15; danach `allNeedsMet` wahr und `taxUnits(w) === 75_900` (einziges Haus). Kontrollwert «normal»: `20 × 22 × 2 × 100 === 88_000` gegen dasselbe Haus vor dem Umschalten.
- [ ] **1.5 AK-T07, AK-T08, AK-T09, AK-T10, AK-T11, AK-T12, AK-T16:** Werte exakt nach Spec §8.1 und Anhang 01 E (Tabelle Zeile für Zeile als ein Test). AK-T11: `const before = serialize(w)`; Ergebnis `{ ok: false, reason: 'Kaufleute steigen nicht auf' }`; `serialize(w) === before`; auch in `createWorld(3, { unlockAll: true })` ohne Amtsstube derselbe Grund. AK-T16:

```ts
it('AK-T16 werfen nie, ändern bei fail nichts, kein RNG', () => {
  for (const tier of [-1, 0, 1, 4, 5, 1.5, NaN])
    for (const level of ['low', 'normal', 'high', '', 'x']) {
      const w = taxWorld(); // aktive Amtsstube
      const before = serialize(w);
      const r = setTierTaxLevel(w, tier, level);
      if (!r.ok) expect(serialize(w)).toBe(before);
      else expect(withoutTax(serialize(w))).toBe(withoutTax(before));
    }
  for (const level of ['low', 'normal', 'high', '', 'x']) {
    const w = taxWorld();
    const before = serialize(w);
    const r = setTaxLevel(w, level);
    if (!r.ok) expect(serialize(w)).toBe(before);
    else expect(withoutTax(serialize(w))).toBe(withoutTax(before));
  }
});
// withoutTax(json): JSON.parse, `taxLevels` und `taxLockedUntil` löschen, JSON.stringify.
```

(Die Welt trägt keinen RNG-Zustand, `createRng(seed)` ist zustandslos je Aufruf; dass sich bei `ok` ausser `taxLevels`/`taxLockedUntil` nichts ändert, belegt «kein RNG-Zugriff, keine Nebenwirkung».)

- [ ] **1.6 AK-T14 (in `tests/sim/feast.test.ts`, neuer `describe`) inkl. R414 (a):** Kapelle wie im bestehenden `beforeEach`; zweites Haus im Radius über `forceGrass` + `placeBuilding`. Fälle: Siedler «normal» + Bürger «hoch» → `holdFeast` ok, Siedler-Wartezeit 150, Bürger «Steuer zu hoch»; nur «hoch» → `Steuer «hoch»: kein Aufstieg`; nur «niedrig» → `Steuer «niedrig»: Fest ohne Wirkung`; niedrig + hoch → `Steuer: Fest wirkt auf kein Haus`; Haus «normal» ausserhalb des Radius ändert nichts; kein Haus im Radius (Haus abreissen) und alle «hoch» → ok; **(a)** nur Kaufleute-Haus «normal» im Radius, Stufen 1–3 «hoch» → ok. Bei jeder Ablehnung `stock.rum` und `feastAt` unverändert.
- [ ] **1.7 AK-T15:** wie Spec; `tierWish 2` true genau bei Pioniere «hoch»; Siedler «hoch» allein → false; `tierWish 3`/`tierReached 3` true bei Siedler «hoch»; ohne Amtsstube false; Auslöser `houses` false. Prüfen über `nextUnlocks` mit gesetztem `w.unlocked` (Muster `townhall.test.ts` AK-S2-12).
- [ ] **1.8 Save (in `tests/sim/save.test.ts`, neuer `describe('I-028 Save v10')`):** AK-T17 Rundlauf mit `{1:'low',2:'normal',3:'high',4:'high'}` / `{1:1300,2:0,3:900,4:0}` tief gleich; **R414 (h):** `merchantTown()` mit gemischten Reglern, Lauf A 500 Ticks; Lauf B: nach 200 Ticks `deserialize(serialize(b))`, weitere 300 → `serialize(a) === serialize(b)`. AK-T18 über `foldBackToV9(JSON.parse(serialize(w)))` mit `taxLevel` high/low/normal und Sperre 450 (Tabelle Anhang 01 D; `version 10`, kein `taxLevel`). AK-T19 inkl. **R414 (g)** (`taxLockedUntil` ohne Schlüssel `"2"` und mit Zusatzschlüssel `"5"`): je `{ ok: false, reason: 'Beschädigter Spielstand' }`, `expect(() => deserialize(...)).not.toThrow()`. AK-T20 **R414 (b):** `version = SAVE_VERSION + 1` → `'Unbekannte Version'`. AK-T21: alle Fixtures v1…v9 laden ok; `save-v2.json` → `{1..3:'low',4:'normal'}`, Sperren 1300; `save-v4.json` → alle `'high'`, Sperren 5100.
- [ ] **1.9 AK-T24 (in `save.test.ts`) inkl. B2:** `{1..4:'normal'}` → `taxLevel 'normal'`; `{1..3:'low',4:'normal'}` → `'low'`; `{1:'low',2:'normal',3:'normal',4:'normal'}` → wirft; Sperren `{1:1300,2:1300,3:1300,4:0}` → 1300; Schlüsselfolge `Object.keys(foldBackToV9(v10))` gleich `V9_WORLD_KEYS`; **Fall migrierter Stand:** `JSON.stringify(foldBackToV9(JSON.parse(serialize(loadOk(fixtureV9)))))` === Fixture-Text (`tests/sim/fixtures/z3-scenario-v9.json`).
- [ ] **1.10 Rot belegen:** `npx vitest run tests/sim/taxTiers.test.ts tests/sim/feast.test.ts tests/sim/save.test.ts; echo EXIT=$?` → FAIL (`taxPct is not exported`, `taxLevels undefined` …); Auszug je Testfall in den Bericht. Danach `test: I-028 Tests Steuer je Stufe (rot)` committen.

### Schritt 2 — Umsetzung Sim

- [ ] **2.1 Typen und Defs.** `types.ts`: `TaxLevelDef.pctByTier?: Partial<Record<Tier, number>>`; `World.taxLevels: Record<Tier, TaxLevel>` an der Stelle von `taxLevel`, `taxLockedUntil: Record<Tier, number>`. `defs/tiers.ts`: `high: { name: 'hoch', pct: 130, upgradeWait: null, occupancy: 0.75, pctByTier: { 4: 115 } }`, `export const TIER_IDS = Object.keys(TIERS).map(Number) as Tier[];`. `world.ts` `createWorld`: `version: 10`, `taxLevels: Object.fromEntries(TIER_IDS.map((t) => [t, DEFAULT_TAX_LEVEL]))`, `taxLockedUntil: Object.fromEntries(TIER_IDS.map((t) => [t, 0]))` (beide mit `as Record<Tier, …>`, an der bisherigen Schlüsselstelle).
- [ ] **2.2 `townhall.ts`:**

```ts
export function effectiveTaxLevel(w: World, tier: Tier): TaxLevel {
  return townhallActive(w) ? w.taxLevels[tier] : 'normal';
}
export const taxPct = (level: TaxLevel, tier: Tier): number =>
  TAX_LEVELS[level].pctByTier?.[tier] ?? TAX_LEVELS[level].pct;
export const canRiseTier = (tier: Tier): boolean => TIERS[tier].upgradeCost !== null;
export const taxTarget = (level: TaxLevel, tier: Tier): TaxLevel =>
  level === 'low' && !canRiseTier(tier) ? 'normal' : level;
```

- [ ] **2.3 `tax.ts`** (Prüfreihenfolge exakt R6.1/R6.2; `asTier` gibt es schon, für `NaN`/`1.5` → `null`):

```ts
export const taxLocked = (w: World, t: Tier): boolean => w.tick < w.taxLockedUntil[t];
export const noRiseReason = (t: Tier): string => `${TIERS[t].name} steigen nicht auf`;
export const taxChangeSet = (w: World, level: TaxLevel): Tier[] =>
  TIER_IDS.filter((t) => w.taxLevels[t] !== taxTarget(level, t));

export function setTierTaxLevel(world: World, tier: number, level: string): Result {
  const t = asTier(tier);
  if (t === null || !Object.hasOwn(TAX_LEVELS, level)) return fail('Ungültige Stufe');
  if (level === 'low' && !canRiseTier(t)) return fail(noRiseReason(t));
  if (!townhallActive(world)) return fail(townhallReason(world));
  if (world.taxLevels[t] === level) return fail('Stufe bereits aktiv');
  if (taxLocked(world, t)) return fail('Sperrzeit');
  world.taxLevels[t] = level as TaxLevel;
  world.taxLockedUntil[t] = world.tick + TAX_SWITCH_LOCK;
  return ok;
}
export function setTaxLevel(world: World, level: string): Result {
  if (!Object.hasOwn(TAX_LEVELS, level)) return fail('Ungültige Stufe');
  if (!townhallActive(world)) return fail(townhallReason(world));
  const c = taxChangeSet(world, level as TaxLevel);
  if (c.length === 0) return fail('Stufe bereits aktiv');
  if (c.some((t) => taxLocked(world, t))) return fail('Sperrzeit');
  for (const t of c) {
    world.taxLevels[t] = taxTarget(level as TaxLevel, t);
    world.taxLockedUntil[t] = world.tick + TAX_SWITCH_LOCK;
  }
  return ok;
}
```

- [ ] **2.4 `population.ts`:** `tierCap(tier, level) = Math.max(1, Math.floor(TIERS[tier].maxInhabitants * TAX_LEVELS[level].occupancy))`; `houseCap(world, house) = tierCap(house.tier, effectiveTaxLevel(world, house.tier))`; `upgradeStatus`: `base = TAX_LEVELS[effectiveTaxLevel(world, house.tier)].upgradeWait` (Rest unverändert). `taxBaseByTier` summiert `inhabitants × tier.tax × (allNeedsMet ? TAX_UNIT : 1)` je Stufe in Id-Reihenfolge; `taxUnits = Σ_{t ∈ TIER_IDS} S[t] × taxPct(effectiveTaxLevel(world, t), t)`. Bitgleich-Argument Spec §6 (b) in den JSDoc.
- [ ] **2.5 `feast.ts`:** in `feastBlock` den Steuerblock ersetzen durch `taxBlock(world, chapel)`: H = `Object.values(world.buildings)` mit `b.house`, Mittelpunktabstand ≤ `serviceRadius` (dieselbe Rechnung wie `feastActive`; als gemeinsamer Helfer `inChapelRadius(chapel, house)` herausziehen, `feastActive` nutzt ihn, Verhalten bitgleich). Levels `effectiveTaxLevel(world, h.house.tier)`; H leer oder ein `normal` → `null`; alle `high` → `` `Steuer «${TAX_LEVELS.high.name}»: kein Aufstieg` ``; alle `low` → `` `Steuer «${TAX_LEVELS.low.name}»: Fest ohne Wirkung` ``; sonst `'Steuer: Fest wirkt auf kein Haus'`.
- [ ] **2.6 `unlocks.ts` `nextUnlocks`:** `taxBlocks: (u.trigger.kind === 'tierWish' || u.trigger.kind === 'tierReached') && u.trigger.tier >= 2 && effectiveTaxLevel(w, (u.trigger.tier - 1) as Tier) === 'high'` (R414 Hinweis R7.4).
- [ ] **2.7 `save.ts`:** `SAVE_VERSION = 10`. `isValidV2Fields`: Steuer-Teil ersetzt durch `isValidTaxFields(raw)`:

```ts
const TIER_KEYS = TIER_IDS.map(String);
const hasTierKeys = (o: unknown): o is Record<string, unknown> =>
  isObject(o) &&
  Object.keys(o).length === TIER_KEYS.length &&
  TIER_KEYS.every((k) => Object.hasOwn(o, k));
function isValidTaxFields(raw: Record<string, unknown>): boolean {
  const { taxLevels: lv, taxLockedUntil: lk } = raw;
  if (!hasTierKeys(lv) || !hasTierKeys(lk)) return false;
  return TIER_IDS.every((t) => {
    const l = lv[t],
      x = lk[t];
    return (
      typeof l === 'string' &&
      Object.hasOwn(TAX_LEVELS, l) &&
      !(l === 'low' && !canRiseTier(t)) &&
      isInt(x) &&
      x >= 0
    );
  });
}
/** v9 → v10 (I-028 R8.2): ein Regler wird vier; Kaufleute «niedrig» → «normal». Wirft nie; Ungültiges prüft isValidTaxFields. */
export function migrateV9ToV10(raw: Record<string, unknown>): void {
  const l = raw.taxLevel,
    x = raw.taxLockedUntil;
  if ('taxLevel' in raw) {
    raw.taxLevels = Object.fromEntries(TIER_IDS.map((t) => [t, taxTarget(l as TaxLevel, t)]));
    delete raw.taxLevel;
  }
  if ('taxLockedUntil' in raw) raw.taxLockedUntil = Object.fromEntries(TIER_IDS.map((t) => [t, x]));
  raw.version = 10;
}
```

`migrateV1ToV2` bleibt (setzt v2-`taxLevel`, die Kette trägt es bis v9). `deserialize`: nach `migrateV8ToV9` die Zeile `if (raw.version === 9) migrateV9ToV10(raw);`. Ein v9-Stand mit `taxLevel` als Zahl landet über `taxTarget` unverändert in `taxLevels` und wird abgewiesen.

- [ ] **2.8 Mechanisch in `src/ui` (nur Kompilieren, T2 ersetzt alles):** `effectiveTaxLevel(world)` → `effectiveTaxLevel(world, 1)` in `hover.ts:166`, `hud.ts:107/518/526`, `inspect.ts:637/990`, `guide.ts:165`; `world.taxLevel` → `world.taxLevels[1]` (`inspect.ts:633`); `w.taxLockedUntil` → `w.taxLockedUntil[1]` (`hints.ts:144`, `inspect.ts:638`). Kein Verhaltenswechsel bei einheitlichem Stand.
- [ ] **2.9 Helfer `tests/sim/helpers.ts`:**

```ts
const V10_WORLD_KEYS = V9_WORLD_KEYS.map((k) => (k === 'taxLevel' ? 'taxLevels' : k));
export function setAllTax(w: World, level: TaxLevel): void {
  for (const t of TIER_IDS) w.taxLevels[t] = taxTarget(level, t);
}
/** v10 → v9-Form (I-028, B2): einheitliche Regler → `taxLevel`, Sperre = Maximum, Schlüssel in V9_WORLD_KEYS-Reihenfolge. */
export function foldBackToV9(v10: Record<string, unknown>): Record<string, unknown> {
  for (const k of Object.keys(v10))
    if (!V10_WORLD_KEYS.includes(k)) throw new Error(`foldBackToV9: unbekannter Schlüssel ${k}`);
  const lv = v10.taxLevels as Record<string, string>;
  const [a, b, c, d] = ['1', '2', '3', '4'].map((k) => lv[k]);
  if (!(a === b && b === c && (d === a || (a === 'low' && d === 'normal'))))
    throw new Error('foldBackToV9: Regler nicht einheitlich');
  const lock = Math.max(...Object.values(v10.taxLockedUntil as Record<string, number>));
  const out: Record<string, unknown> = {};
  for (const k of V9_WORLD_KEYS)
    out[k] = k === 'version' ? 9 : k === 'taxLevel' ? a : k === 'taxLockedUntil' ? lock : v10[k];
  return out;
}
```

- [ ] **2.10 Grün:** `npx vitest run tests/sim/taxTiers.test.ts tests/sim/feast.test.ts tests/sim/save.test.ts; echo EXIT=$?` → PASS. Commit `feat: I-028 Steuer je Stufe in der Sim, Save v10`.

### Schritt 3 — Bestandstests anpassen (nur Form, Erwartungen für Stufen 1–3 bleiben)

- [ ] **3.1 B1 v9-Byte-Vergleiche** (Fixtures unverändert): `tests/sim/save.test.ts:1767` → `expect(json).toBe(JSON.stringify(foldBackToV9(JSON.parse(serialize(seeRouteStart())))))`; `tests/sim/goal3.test.ts:139` → ebenso mit `spiceGoalScenario({ forBrowser: true })`.
- [ ] **3.2 `foldBackToV8(x)` → `foldBackToV8(foldBackToV9(x))`** an allen 18 Stellen in `save.test.ts` und in `normalized()` von `tests/sim/balance-crises.test.ts:25`; Hash-Werte über `deserialize(...).world` (`CHAIN_HASHES`) ebenso. Kein Pin-Wert ändert sich (AK-T23, AK-T25).
- [ ] **3.3 Versions-Assertions:** jede Assertion auf die _aktuelle_ Version (`save.test.ts` 114, 119, 135, 371, 390, 411, 529, 551, 572, 593, 671, 695, 699, 889, 995, 1009, 1019, 1032, 1225, 1226, 1252, 1347, 1433, 1434, 1654; `scenario-saves.test.ts:514`; `unlocks.test.ts:129`) → `toBe(SAVE_VERSION)` plus **eine** feste Prüfung `expect(SAVE_VERSION).toBe(10)` im neuen I-028-`describe`. **Bleibt 9:** `save.test.ts:1521` (`migrateV8ToV9` direkt) und jede Assertion auf eine über `foldBackToV9` erzeugte Form.
- [ ] **3.4 «Unbekannte Version» (R414 b):** `version = 10` / `version: 10` → `SAVE_VERSION + 1` in `save.test.ts` 173, 254, 494, 620, 775, 890, 1168, 1337, 1662.
- [ ] **3.5 Steuerfelder in `save.test.ts`:** 120–121, 136–137 → `taxLevels`/`taxLockedUntil` als Objekte; AK-S1-03 (147–148) → `w.taxLevels = {1:'high',2:'high',3:'high',4:'high'}`, `w.taxLockedUntil = {1:450,2:450,3:450,4:450}`; AK-S1-04 (160, 168, 169) → `taxLevels['2'] = 'extrem'`, `taxLockedUntil['1'] = 1.5` / `-7`; 400/414–415/559/578 → Erwartung über lokale Funktion `expectedLevels(v9Level)` = `Object.fromEntries(TIER_IDS.map((t) => [t, taxTarget(v9Level, t)]))`; AK-S1-12 (675–679) → `taxLevels` alle `'high'`, `'taxLockedUntil'` aus der Schleife nehmen und `{1..4: raw.taxLockedUntil}` prüfen.
- [ ] **3.6 Direktzuweisungen `w.taxLevel = L` → `setAllTax(w, L)`:** `tests/sim/{taxes.test.ts:214,236,263,265, townhall.test.ts:91,99,101,293,299,345, feast.test.ts:66,73,78,174,176, merchants.test.ts:183, scenarios.ts:626}`. `merchants.test.ts:183` ist die mit R412 freigegebene Stelle: Haus ist Bürger (Stufe 3), Erwartung `['Steuer zu hoch']` bleibt. Lesezugriffe: `taxes.test.ts:189,192,195,199,202` → `taxLockedUntil[1]`/`taxLevels[1]` (Stufe-1-Sicht, Werte gleich); `townhall.test.ts:107,132,136,139,356` → Objekte; `effectiveTaxLevel(w)` → `effectiveTaxLevel(w, 2)` in `townhall.test.ts` (Siedler-Welt); `scenario-saves.test.ts:372` → `taxLevels` alle `'normal'`.
- [ ] **3.7 `tests/ui` mechanisch:** `feast.test.ts:57`, `hud.test.ts:150`, `inspect.test.ts:242`, `startCard.test.ts:100`, `guide.test.ts:31,90,189,202,413` → `setAllTax(w, …)`; `hints.test.ts:69` → `w.taxLockedUntil[1] = …`, `:191` → `setTaxLevel(w, w.taxLevels[1])`, `:210` → `setAllTax(w, 'normal')`.
- [ ] **3.8 Prüfen:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts` je `; echo EXIT=$?`; `npx vitest run tests/sim tests/ui; echo EXIT=$?`; `make check; echo EXIT=$?`; Diff-Sperre aus «Pflichten». Commit `test: I-028 Bestandstests auf Save v10 und Steuer je Stufe`.

---

## T2 UI, Hinweise, Doku (`tech-ui-engineer`)

**Interfaces — Consumes:** alle «Produces» aus T1. **Produces** (`src/ui/taxView.ts`, rein, DOM-frei):

```ts
export type TaxSummary = TaxLevel | 'mixed';
export function taxSummary(w: World): TaxSummary; // gespeicherter Stand; L wenn ∀t taxLevels[t] === taxTarget(L, t)
export function taxSummaryText(w: World): string; // TAX_LEVELS[L].name | 'gemischt'
export function taxMixList(w: World): string; // 'P niedrig · S normal · B normal · K hoch'
export function tierTaxTooltip(tier: Tier, level: TaxLevel): string;
export function tierTaxPerMinute(w: World, tier: Tier): number; // ⌊S × taxPct(eff, t) × 3 / 100⌋
export function taxLockText(w: World, tier: Tier): string; // 'wieder änderbar in 20 s' | ''
export function taxStatusLine(w: World): string; // aktiv: taxEffect(L) | 'Steuer gemischt: ' + taxMixList; inaktiv: taxEffect('normal')
export function taxButtonTitle(w: World): string; // L → taxEffect(L); mixed → taxMixList
export function lockedTierFor(w: World, level: TaxLevel): Tier | undefined; // taxChangeSet(w, level).find(t => taxLocked(w, t))
```

`taxEffect(level)` (bestehend in `guide.ts`) wird ohne neuen Parameter erweitert (YAGNI; Spec 7.1 `tier?` wird nicht gebraucht, `tierTaxTooltip` deckt die Stufe ab): Zusatz aus den Defs, `' (' + Name + ' ' + taxPct + ' %)'` für jede Stufe mit `taxPct(L, t) !== TAX_LEVELS[L].pct`, und `' (' + Name + ' normal)'` für jede Stufe mit `taxTarget(L, t) !== L`.

### Schritt 1 — Tests zuerst (rot), `tests/ui/taxView.test.ts` neu

- [ ] **1.1 AK-T26/T27:** Stände aus Spec; `taxSummaryText` «gemischt»; `taxButtonText(w)` «Steuer gemischt».
- [ ] **1.2 AK-T28:** alle 12 Zellen aus Anhang 01 C als Tabelle (`it.each`), u. a. `tierTaxTooltip(4, 'high') === '115 % · 15 Einwohner'`, `(4, 'low') === 'Kaufleute steigen nicht auf'`, `(1, 'low') === '70 % · Aufstieg nach 15 s · 4 Einwohner'`.
- [ ] **1.3 AK-T29 inkl. R414 (c):** `taxEffect('high') === 'hoch: 130 % Steuer (Kaufleute 115 %) · kein Aufstieg · Häuser nur zu 75 % belegt'`; `taxEffect('low') === 'niedrig: 70 % Steuer (Kaufleute normal) · Aufstieg nach 15 s Zufriedenheit · Häuser voll belegt'`; `taxEffect('normal')` = heutiger Text.
- [ ] **1.4 AK-T30 inkl. R414 (e):** Welt aus Anhang 01 A → `[33, 504, 1201, 2277]`; Amtsstube `outageUntil` gesetzt → wirksam normal: `[48, 504, 924, 1980]`.
- [ ] **1.5 AK-T31:** `taxLockedUntil[2] = tick + 200` → `taxLockText(w, 2) === 'wieder änderbar in 20 s'`, Stufe 1 `''`; `friendlyReason(w, 'Sperrzeit', { tier: 2 }) === 'Steuer für Siedler erst in 20 s wieder änderbar'`; Pioniere und Bürger gesperrt, «alle hoch» → `lockedTierFor(w, 'high') === 1`, Text nennt Pioniere; **Review Focus 5:** Pioniere schon «hoch» und gesperrt, Bürger gesperrt → `lockedTierFor(w, 'high') === 3`.
- [ ] **1.6 AK-T32:** `friendlyReason(w, 'Steuer zu hoch', { tier: 3 }) === "Steuer ‚hoch' für Bürger verhindert den Aufstieg"`; Leitfaden `nextStep` (Welt aus `guide.test.ts` mit vollem Siedler-Haus, `w.taxLevels[2] = 'high'`) → `"Steuer ‚hoch' für Siedler verhindert den Aufstieg: stelle sie auf ‚normal' oder ‚niedrig'"`.
- [ ] **1.7 AK-T33 inkl. R414 (d):** `hover.test.ts`: Bürger-Haus, aktive Amtsstube, Bürger «hoch» → letzte Zeile `'Steuer: hoch'`; ohne Amtsstube Zeilen wie heute; Amtsstube bei gemischtem Stand → `'Steuer: gemischt'`; `inspect.test.ts`: Ruhe-Ansicht bei gemischtem Stand → `tax` beginnt mit `'Steuer gemischt: '`.
- [ ] **1.8 Rot:** `npx vitest run tests/ui/taxView.test.ts tests/ui/hover.test.ts tests/ui/inspect.test.ts tests/ui/hints.test.ts tests/ui/guide.test.ts; echo EXIT=$?` → FAIL mit Auszug je Fall. Commit `test: I-028 UI-Helfer Steuer je Stufe (rot)`.

### Schritt 2 — Umsetzung

- [ ] **2.1 `src/ui/taxView.ts`** nach «Produces»; alle Zahlen aus `TAX_LEVELS`, `TIERS`, `taxPct`, `tierCap`, `taxBaseByTier`, `formatGameTime`.
- [ ] **2.2 `hints.ts`:** `ReasonCtx.tier?: Tier`; Zeile `Sperrzeit` → `c.tier === undefined ? null : \`Steuer für ${TIERS[c.tier].name} erst in ${formatGameTime(w.taxLockedUntil[c.tier] - w.tick)} wieder änderbar\``; Zeile `Steuer zu hoch`→ mit`c.tier` «… für {Gruppe} …», ohne Stufe der heutige Text.
- [ ] **2.3 Aufrufer mit Stufe:** `hover.ts:107` und `inspect.ts:167` → `{ …, tier: house.tier }`.
- [ ] **2.4 `app.ts`:** `setTax` → `const tier = lockedTierFor(world, level); const r = setTaxLevel(world, level); if (!r.ok) showError(friendlyReason(world, r.reason, { tier }))`; neue Aktion `setTierTax(tier, level)` → `setTierTaxLevel` mit `{ tier }`; `InspectActions` in `inspect.ts` um `setTierTax(tier: Tier, level: TaxLevel): void` erweitern.
- [ ] **2.5 `inspect.ts` Amtsstube (U-1…U-6):** `renderTownhall` baut einmal: Zeile «alle Stufen» (`data-tax-all=L`, Klick `setTax`) und je `TIER_LIST`-Stufe eine Zeile (`data-tax-tier=t`, Name, 3 Knöpfe `data-tax=L`, `data-field="tax-min-t"`, `data-field="tax-lock-t"`); Zeile `tax-lock` entfällt. `updateTownhall` setzt nur `active`/`aria-pressed`, `disabled` (Kaufleute «niedrig», `title = tierTaxTooltip`), Texte und `hidden` — keine Knoten neu (U-6). `tax-effect` ← `taxStatusLine`. Ruhe-Ansicht (`inspect.ts:990`) ← `taxStatusLine(world) + (aktiv ? '' : ' (keine Amtsstube)')`.
- [ ] **2.6 `hud.ts`:** `taxView.text` ← `taxSummaryText`; `taxButtonText` ← `` `Steuer ${taxSummaryText(world)}` `` (nur aktiv); nach `setChip(header, 'tax', tax)` den `title` des Steuer-Knopfs auf `taxButtonTitle(world)` setzen, nur bei Änderung; `balanceTooltip` ohne Amtsstube → `TAX_LEVELS.normal.name` (wirksam immer normal).
- [ ] **2.7 `hover.ts`:** `townhallInfo` → `` `Steuer: ${taxSummaryText(world)}` ``; `houseInfo` → mit `townhallActive` letzte Zeile `` `Steuer: ${TAX_LEVELS[effectiveTaxLevel(world, house.tier)].name}` ``.
- [ ] **2.8 `guide.ts` (U-12):** kleinste `t ∈ TIER_IDS` mit `TAX_LEVELS[effectiveTaxLevel(w, t)].upgradeWait === null` und `houses.some((h) => h.house!.tier === t && canRise(h))` → Satz mit `TIERS[t].name`.
- [ ] **2.9 `src/style.css`:** Raster `.tax-grid { display: grid; grid-template-columns: minmax(0, 5.5em) repeat(3, minmax(0, 1fr)) minmax(0, auto); gap: 4px; }`, kein `min-width` über 280 px; `.tax-lock` weiterverwenden.
- [ ] **2.10 Bestandstests mit geänderter Erwartung (Spec-gewollt):** `format.test.ts:41` (`taxTooltip('low')` mit «(Kaufleute normal)», `('high')` mit «(Kaufleute 115 %)»), `hints.test.ts` AK-UX-03-Zeile `Sperrzeit` mit `{ tier: 1 }`, `hud.test.ts`/`inspect.test.ts`/`hover.test.ts` an Raster und neue Hauszeile anpassen; jede Änderung im Bericht mit Spec-Verweis.
- [ ] **2.11 Doku (D1):** README «Steuern und Steuerregler» nach Spec §9 neu (Tabelle wörtlich, Kaufleute-Satz), mitführen Z. 58, 114, 240–241, 411, 426, 433 (Zeilen am Stand prüfen); `docs/arc42.md` Baustein `save.ts` (v10, `migrateV9ToV10`), Abschnitt Steuerstufe (`taxLevels`, `effectiveTaxLevel(world, tier)`, `pctByTier`, `taxChangeSet`), Persistenz («Gespeichert wird immer Version 10», Kette v1 … v10, Prüfung je Stufe), UI-Baustein `taxView.ts`.
- [ ] **2.12 Prüfen und committen:** schnelle Make-Prüfungen, `npx vitest run tests/ui; echo EXIT=$?`, `make check; echo EXIT=$?`, R392-Vergleich. Commits `feat: I-028 Amtsstube mit Steuer je Stufe`, `docs: I-028 README und arc42 Steuer je Stufe`.

---

## T3 Browser-Check (`qa-playtester`)

Szene: Testwelt `unlockAll`, aktive Amtsstube, je ein Haus Stufe 1–4 (Szenario lokal im Playtest-Skript unter `.studio/qa/steuer-je-stufe/`, nicht im Repo-Code). Screenshots `<ak>-<breite>x<höhe>.png` bei 1280×720 und 1920×1080; AK-T41 bei 800×600.

- [ ] AK-T34 Raster, Hervorhebung, `scrollWidth ≤ clientWidth`. AK-T35 Kaufleute «niedrig» `disabled`, Tooltips. AK-T36 inkl. **R414 (d, f):** Sperrtext nur in der Pioniere-Zeile, zählt herunter; Siedler «hoch» sofort; Kopfzeile «gemischt», Tooltip «P niedrig · S hoch · B normal · K normal»; `tax-effect` beginnt mit «Steuer gemischt: »; dieselben Knoten vor/nach 20 Ticks (`isSameNode` über eine gemerkte Referenz) und `document.activeElement` bleibt auf einem per Tastatur fokussierten Knopf. AK-T37 Fehlermeldung nennt Pioniere. AK-T38 «alle niedrig». AK-T39 Mouse-over Bürger-Haus. AK-T40 Chronik vorher = nachher. AK-T41 800×600 ohne Überlappung, kein waagrechtes Scrollen, Konsole leer.
- Schlussbericht = Playtest-Report (kein eigener Report-Pfad); Befund → Fix-Runde an `tech-ui-engineer` per SendMessage, danach Nachprüfung derselben AK.

## T4 Final-Review (`qa-code-reviewer`, opus, über `git diff main...feat/steuer-je-stufe`)

Prüft Spec, Anhänge 01/02, R412/R414, alle 41 AK, die Diff-Sperre (AK-T22/T23/T25), Determinismus (R414 h), Doku-Konsistenz README/arc42, Commit-Konvention. Ergebnis an `lead-qa`.

## Zuordnung AK → Task

| AK / Auflage                                           | Task                                  | Ort                                                  |
| ------------------------------------------------------ | ------------------------------------- | ---------------------------------------------------- |
| AK-T01–T13, T15, T16; R414 (i) in T13                  | T1                                    | `tests/sim/taxTiers.test.ts`                         |
| AK-T14; R414 (a)                                       | T1                                    | `tests/sim/feast.test.ts`                            |
| AK-T17 (+ h), T18, T19 (+ g), T20 (+ b), T21           | T1                                    | `tests/sim/save.test.ts`                             |
| AK-T22, T23, T25                                       | T1 (Diff-Sperre, Schritt 3.2/3.8), T4 | `balance.test.ts`, `e0Pins.ts`, Pin-Dateien          |
| AK-T24; B2                                             | T1                                    | `tests/sim/save.test.ts`, `tests/sim/helpers.ts`     |
| B1                                                     | T1                                    | `save.test.ts:1767`, `goal3.test.ts:139`             |
| AK-T26–T31; R414 (c), (e)                              | T2                                    | `tests/ui/taxView.test.ts`                           |
| AK-T32                                                 | T2                                    | `tests/ui/taxView.test.ts` (über `hints`, `guide`)   |
| AK-T33; R414 (d) Teil T33                              | T2                                    | `tests/ui/hover.test.ts`, `tests/ui/inspect.test.ts` |
| AK-T34–T41; R414 (d) Teil T36, (f)                     | T3                                    | `.studio/qa/steuer-je-stufe/`                        |
| P-1 (v10 fest), P-2 (`ReasonCtx.tier`, `taxChangeSet`) | T1 / T2                               | `save.ts`, `tax.ts`, `hints.ts`                      |
| Doku Spec §9                                           | T2                                    | `README.md`, `docs/arc42.md`                         |

## Selbstprüfung (lead-tech)

- Spec-Abdeckung: R1–R8, §5 Randfälle (Ausfall/Abriss → AK-T13 + i; Haus über Belegung → AK-T05; negatives Geld → bestehender RF-3a bleibt; leere Insel → Zusatzzeile in AK-T03), §6 Baseline, §7 U-1…U-13 vollständig auf T2/T3 verteilt; §7.6 Chronik → AK-T40.
- Typen: `effectiveTaxLevel(w, tier)`, `taxPct`, `taxTarget`, `canRiseTier`, `taxChangeSet`, `taxLocked`, `tierCap`, `taxBaseByTier`, `setAllTax`, `foldBackToV9` in T1 definiert, in T2 identisch benutzt.
- Bewusst nicht: `feastActive` bekommt keine Insel-Prüfung (Spec «gleiche Geometrie»); Befund dazu geht an L0 als Beobachtung.
