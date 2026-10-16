> **Task-ID:** T02 (Paket M11-P1b) — Teil 2 von 2
> **AK-IDs / blocked-by / Strang:** siehe [T02a-daempfung.md](T02a-daempfung.md)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints)
> **Teile:** [T02a-daempfung.md](T02a-daempfung.md) · **T02b-daempfung.md** (diese: Rot-Beleg, Umsetzung, Doku, Commit)

## Schritt 1c: Prüfhilfe AK-P1-14 (`tests/sim/imports.test.ts`, im M11-`describe` aus T01)

```ts
it('PLAN-FLOW flow.ts importiert weder population noch queries; queries re-exportiert goodsBalance', () => {
  expect(importsOf('flow')).not.toContain('population');
  expect(importsOf('flow')).not.toContain('queries');
  expect(readFileSync(`${SIM}/queries.ts`, 'utf8')).toMatch(
    /export \{[^}]*goodsBalance[^}]*\} from '\.\/flow'/,
  );
});
```

## Schritt 2: Rot-Beleg

`npx vitest run tests/sim/flow.test.ts tests/sim/flow-count.test.ts tests/sim/imports.test.ts` vor der Umsetzung:

| AK / Test      | Erwartete Meldung vor der Umsetzung                                             |
| -------------- | ------------------------------------------------------------------------------- |
| AK-P1-08 … -12 | `Failed to resolve import "../../src/sim/flow"` (ganze Datei `flow.test.ts`)    |
| RF-3           | `Failed to resolve import "../../src/sim/flow"` (`vi.mock` auf fehlendes Modul) |
| PLAN-FLOW      | `ENOENT … src/sim/flow.ts`                                                      |

Zweiter Beleg nach dem Anlegen von `flow.ts` **ohne** Einbau in `population.ts` (Zwischenstand, nicht committen):
AK-P1-09 `expected 1300 to be -1` (1 Fischer steigt bei t0+300 auf), AK-P1-12 Grund mit `300` statt `600`,
RF-3 `Tick 50: expected 0 to be 1`. Beide Läufe ins Ledger.

## Schritt 3: Umsetzung

- [ ] **`src/sim/flow.ts` (neu)** — Importe nur `./defs/buildings`, `./defs/goods`, `./defs/tiers`, `./levels`,
      `./supply`, `./world`, `./types`:

```ts
/** Netto je Gut über 100 Ticks; fehlt ein Gut, zählt 0 (Spec 3.2). */
export type Budget = Partial<Record<GoodId, number>>;
/** Toleranz für Gleitkomma-Raten (z. B. 8 × 0,2); kein Spielwert. */
const DEFICIT_EPSILON = 1e-9;

export function goodsBalance(
  world: World,
): Record<GoodId, { produced: number; consumed: number; net: number }>;
// Inhalt 1:1 aus queries.ts:63-84 (Stand T01, mit cycleOf); nur die Versorgung lautet jetzt
// `const c = center(BUILDING_DEFS[b.defId], b.x, b.y); if (!inSupplyRange(world, c.cx, c.cy)) continue;`

/** Netto-Bilanz als Budget (reine Umformung, ruft goodsBalance nicht selbst). */
export const budgetFrom = (bal: ReturnType<typeof goodsBalance>): Budget =>
  Object.fromEntries(GOOD_IDS.map((g) => [g, bal[g].net]));

/** Δ je Gut der Zielstufe: maxEW(Ziel) × Rate Ziel − EW × Rate jetzt; {} ohne Zielstufe. */
export function upgradeDelta(house: HouseState): Budget {
  const cur = TIERS[house.tier];
  if (cur.upgradeCost === null) return {};
  const next = TIERS[(house.tier + 1) as Tier];
  const d: Budget = {};
  for (const g of Object.keys(next.needs) as GoodId[])
    d[g] = next.maxInhabitants * next.needs[g]! - house.inhabitants * (cur.needs[g] ?? 0);
  return d;
}

/** Erstes Gut (GOOD_IDS-Reihenfolge) mit budget − Δ < −1e-9, sonst null. */
export function deficitGood(budget: Budget, house: HouseState): GoodId | null; // Schleife über GOOD_IDS

/** Für die UI (T12): { good, net = goodsBalance.net − Δ } des ersten Defizitguts, sonst null; null ohne Haus. */
export function upgradeDeficit(world: World, b: Building): { good: GoodId; net: number } | null;
```

- [ ] **`src/sim/queries.ts`:** `goodsBalance` entfernen, `export { goodsBalance } from './flow';` (Import `isSupplied`
      bleibt für `houseDiagnosis`). UI-Importe aus `queries.ts` bleiben gültig.
- [ ] **`src/sim/population.ts`** (Import `budgetFrom`, `deficitGood`, `goodsBalance`, `upgradeDelta`, Typ `Budget` aus
      `./flow`; `UPGRADE_DEFICIT_WAIT_FACTOR` aus `./defs/timing`):
  - `upgradeStatus(world, b, budget?: Budget)`: an `:132` `const base = TAX_LEVELS[effectiveTaxLevel(world)].upgradeWait;`
    `const wait = base === null ? null : base * (deficitGood(budget ?? budgetFrom(goodsBalance(world)), house) !== null
? UPGRADE_DEFICIT_WAIT_FACTOR : 1);` — Grund wie heute mit der wirksamen Zahl. Ohne `budget` (UI) frisch gerechnet.
  - `tryUpgrade(world, b, budget?: Budget)`: `upgradeStatus(world, b, budget)`; bei Erfolg **vor** dem Stufenwechsel
    `const d = upgradeDelta(house)`, danach `if (budget) for (const g of Object.keys(d) as GoodId[]) budget[g] =
(budget[g] ?? 0) - d[g]!;` (nur erfolgreiche Aufstiege ziehen ab).
  - `tickPopulation`: vor der Häuserschleife `const growth = world.tick % GROWTH_INTERVAL === 0 && world.tick > 0;`
    `const budget = growth ? budgetFrom(goodsBalance(world)) : undefined;` und im Wachstumsblock
    `tryUpgrade(world, b, budget)`. `goodsBalance` immer über den Import aufrufen (RF-3 zählt den Modul-Export).
- [ ] Doc-Kommentare: `upgradeStatus`/`tryUpgrade`/`tickPopulation` nennen Budget je Wachstumstakt, Id-Reihenfolge,
      „Lager und Brand zählen nicht (nominell, R115)".

## Schritt 4: Grün

```bash
npx vitest run tests/sim/flow.test.ts tests/sim/flow-count.test.ts tests/sim/imports.test.ts tests/sim/queries.test.ts
npx tsc --noEmit && npm run lint && npm run build
npx vitest run 2>&1 | grep -E "^ FAIL" | sort    # = Rotliste T01 plus Dämpfungsliste unten
```

Testzählbefehl (index.md); Ledger-Messung ohne Pin: `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-crises.test.ts
tests/sim/balance-merchants.test.ts --silent=false` → erwartet Spec 14 (Ref 6750/117/339, normal 7850, Kaufleute
6750/11 200/320); Plan-Prototyp auf M10-Code bestätigt genau diese Werte.

**Neu rot durch die Dämpfung (18, für T03; Testwelten ohne Erzeuger sind Defizitwelten):** `population` „upgrades
pioneer house…", „does not upgrade before 300 ticks…", „lists all unmet reasons…", „settler to citizen…", „consumes the
checked good…", „does not draw a second unit…", „taxes a house at the full rate…", „is attempted in the growth tick
only", „a house built late must wait the full UPGRADE_WAIT…"; `merchants` M8:AK-S1-06, -07, -09; `taxes` AK-S1-05,
-06, -09; `crises` RF-2 „Aufstieg im Tick des Periodenstarts…"; `tick` AK-S2-13; `townhall` M10:AK-S2-13. Gesamt nach
T02: 34 rote Tests. Weitere rote Tests: Stopp, Meldung.

## Schritt 5: Doku

- [ ] `docs/arc42.md` §5 Ebene 2: neue Zeile `flow.ts` („`goodsBalance` (nominell), `upgradeDelta`, `deficitGood`,
      `upgradeDeficit`; importiert weder `population.ts` noch `queries.ts`"), Zeile `queries.ts` „re-exportiert
      `goodsBalance`", Zeile `population.ts` „Aufstieg mit doppelter Wartezeit bei prospektivem Defizit".
- [ ] `docs/adr/ADR-005-tick-reihenfolge-und-zustaende.md`: Abschnitt „Nachtrag M11 (2026-10-03): Buchung je Tick,
      Budget im Wachstumstakt" — (1) `step`-Reihenfolge unverändert; `tickTaxes`/`tickEconomy` buchen je Schritt mit
      Übertrag, `stats` bleiben Nominalwerte je 100 Ticks; (2) `tickPopulation` rechnet im Wachstumstakt einmal vor der
      Häuserschleife das Budget, jeder erfolgreiche Aufstieg zieht sein Δ ab (Id-Reihenfolge, deterministisch);
      (3) Begründung: Aufstieg und Buchung im selben Schritt sehen denselben Stand (RF-2); Kosten bei Irrtum: Faktor 1.

## Schritt 6: Commit und Push

```bash
git add src/sim tests/sim docs/arc42.md docs/adr/ADR-005-tick-reihenfolge-und-zustaende.md
git commit -m "feat: M11-T02 Gedämpfter Aufstieg, flow.ts mit goodsBalance und Budget je Wachstumstakt (Spec 3.2)"
git -C .worktrees/m11-sim push -u origin feat/m11-sim
```

## Risiken/Randfälle

- **AK-P1-10 widerspricht Spec 3.2:** Mit Budget je Takt (Regel und Messgrundlage von M-01 … M-11) steigt das zweite
  Haus bei t0+350 auf, nicht t0+600 (Plan-Prototyp: 1300/1350). Der Test prüft Regel und Reihenfolge; Abweichung steht
  in orga-05, Entscheid L0. Nicht die Regel an den AK-Text anpassen (sonst brechen die Sollwerte).
- `vi.mock` in `flow-count.test.ts` gilt für die ganze Datei; dort keine anderen Tests ablegen.
- `deficitGood` liest nur Güter der Zielstufe; ein Gut ohne Bedarf heute zählt mit Rate 0 (Rum 2→3 = 3,0, 13-2).
- UI ruft `upgradeStatus` ohne Budget je Frame: ein `goodsBalance` je Aufruf, unkritisch (nur geöffnetes Panel).
