> **Task-ID:** T01 (Paket M11-P1a) — Teil 1 von 3
> **AK-IDs:** AK-P1-01, -02, -03, -04, -05, -06, -07, -13; AK-SAV-01, -02, -04, -05; RF-1, RF-2
> **blocked-by:** T00 (Review OK)
> **Strang:** `feat/m11-sim` · Worktree `.worktrees/m11-sim` · Implementierer `tech-sim-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-11-bitgleich-neupin.md](orga-11-bitgleich-neupin.md)
> **Teile:** **T01a-fluss-save.md** (diese: Kopf, Fakten, Tests Steuer/Unterhalt) · [T01b-fluss-save.md](T01b-fluss-save.md) (Tests Lauf/Naht/Save, Rot-Beleg) · [T01c-fluss-save.md](T01c-fluss-save.md) (Umsetzung, Doku, Commit)

## T01: Fluss je Tick, Typen, Save v6, Naht `cycleOf`

**Ziel:** Steuer und Unterhalt buchen je Schritt mit ganzzahligem Übertrag (Spec 3.1); alle M11-Typen, Save v6
(Spec 5); `levels.ts` als einziger Leseort für Zyklus und Unterhalt; `upgrade2`/`upgrade3` im Freischaltbaum (Spec 4).
Die Baseline bricht bewusst; Pins zieht T03 nach.

**Code-Fakten (Ist `<BASIS>`):**

- `src/sim/population.ts:200-210` `totalTaxes` (Σ EW × tax × (erfüllt ? 1 : `UNSATISFIED_TAX_FACTOR`), dann
  `floor(× pct / 100)`); `:213-216` `tickTaxes` bucht nur bei `tick % UPKEEP_INTERVAL === 0`. **Spec 13-8 stimmt:**
  `tickTaxes` liegt in `population.ts` (`tax.ts` hat nur die Amtsstuben-Aktionen). Stufe über `effectiveTaxLevel` (M10).
- `src/sim/economy.ts:56-60` `totalUpkeep` liest `BUILDING_DEFS[b.defId].upkeep`; `:62-66` `tickEconomy` bucht im 100er-Takt.
- Lesezugriffe Zyklus/Unterhalt (Grep `\.(cycle|upkeep)\b`): `production.ts:20,45`, `queries.ts:78-80` (`goodsBalance`),
  `economy.ts:58`, `src/render/errands.ts:255,333,351`. `src/ui/` (`hover`, `texts`, `inspect`, `buildMenu`) bleibt T10/T11.
- `src/sim/types.ts:89-90` `BuildingState`, `:30-34` `SiteRule`, `:100-111` `Building`, `:161` `UnlockFunction`,
  `:183-211` `World` (`version: 5`, letztes Feld `upgradeStops`).
- `src/sim/world.ts:76` `version: 5`; `:96-98` letzte Felder (Schlüsselreihenfolge zählt für `serialize`).
- `src/sim/save.ts:19` `SAVE_VERSION = 5`; `:30-35` `isValidBuilding` (nur `defId`, `x`, `y`); `:182-188` `migrateV4ToV5`;
  `:232-263` `isValidV5Fields`/`isWellFormed`; `:266-290` `deserialize` mit `fromV4` (`:277-278`) und
  `deriveUnlocks` nach `isWellFormed` (`:285`, M10-Muster bleibt).
- `src/sim/defs/unlocks.ts:45` U3 `functions`, `:67` U5 `functions`, `:93-97` `FUNCTION_LABELS` (`Record`, `tsc`-pflichtig).
- `src/ui/texts.ts:54-71` `stateInfo`: `switch` ohne `default` → `noForest` bricht `tsc` (TS2366, Prototyp); T01 fügt genau einen `case` an (T01c).
- `tests/sim/taxes.test.ts:24-48` `addHouse` (Haus ohne Kacheln), `:123-170` `colony`/`readyHouse`, `beforeEach` mit Amtsstube.

**Erwartete Dateien:**

- `src/sim/`: `types.ts`, `world.ts`, `save.ts`, `population.ts`, `economy.ts`, `production.ts`, `queries.ts` (nur
  `cycleOf` in `goodsBalance`), `levels.ts` (neu), `defs/levels.ts` (neu, leer), `defs/timing.ts`, `defs/tiers.ts`,
  `defs/unlocks.ts`
- `src/render/errands.ts` (nur `cycleOf`); `src/ui/texts.ts` (nur `case 'noForest'`)
- `tests/sim/`: `defs.test.ts`, `taxes.test.ts`, `economy.test.ts`, `balance-flow.test.ts` (neu), `levels.test.ts` (neu),
  `save.test.ts`, `imports.test.ts`, `unlocks.test.ts` (nur Zeile 112), `scenario-saves.test.ts` (nur Zeile 480)
- Doku: `docs/arc42.md` (§5 Bausteine `levels.ts`/`save.ts`, §6 Buchung je Tick, §8 Persistenz v6, §12 Glossar „Bilanz")
- **Nicht anfassen:** `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, `src/sim/defs/goods.ts`,
  `src/sim/defs/crises.ts`, `package*.json`, Balancing-Pins (T03), übrige `src/ui/`-Dateien (T10/T11), `src/audio/`

## Schritt 1: Tests zuerst (Teil 1)

- [ ] **`tests/sim/defs.test.ts`** (Importe aus `defs/timing` und `defs/tiers` ergänzen):

```ts
describe('M11 Werte P1 (Anhang 01 A.1, A.2)', () => {
  it('AK-P1-01 TAX_UNIT 2, UNSATISFIED_TAX_FACTOR 0,5, TAX_CARRY_DIVISOR 20 000, Faktor 2, EFF 256/1000', () => {
    expect([TAX_UNIT, UNSATISFIED_TAX_FACTOR, TAX_CARRY_DIVISOR]).toEqual([2, 0.5, 20000]);
    expect([UPGRADE_DEFICIT_WAIT_FACTOR, EFF_WINDOW, EFF_MAX]).toEqual([2, 256, 1000]);
  });
});
```

- [ ] **`tests/sim/taxes.test.ts`** (nutzt `w`, `addHouse`, `colony`, `readyHouse` der Datei; Importe `taxUnits` aus
      `population`, `TAX_CARRY_DIVISOR` aus `defs/tiers`, `UPKEEP_INTERVAL`, `totalUpkeep` sind schon da):

```ts
describe('M11 Steuer je Tick (Spec 3.1)', () => {
  const sum = (d: number[]): number => d.reduce((a, b) => a + b, 0);
  /** n × tickTaxes; Zuwachs je Aufruf; Übertrag ganzzahlig 0 … 19 999. */
  const run = (n: number): number[] => {
    const d: number[] = [];
    for (let i = 0; i < n; i++) {
      const m = w.money;
      tickTaxes(w);
      d.push(w.money - m);
      expect(
        Number.isInteger(w.taxCarry) && w.taxCarry >= 0 && w.taxCarry < TAX_CARRY_DIVISOR,
      ).toBe(true);
    }
    return d;
  };
  it('AK-P1-02 20 Siedlerhäuser à 8 EW, erfüllt, normal: je Schritt +11 oder +12, nach 100 genau +1120', () => {
    for (let i = 0; i < 20; i++) addHouse(w, 2, 8, true);
    const d = run(100);
    expect(new Set(d)).toEqual(new Set([11, 12]));
    expect(sum(d)).toBe(1120);
    expect(w.stats.taxes).toBe(1120); // Nominalwert je 100 Ticks bleibt
  });
  it('AK-P1-03 niedrig +784; 10 von 20 unerfüllt +840 je 100 Schritte', () => {
    for (let i = 0; i < 20; i++) addHouse(w, 2, 8, true);
    expect(setTaxLevel(w, 'low').ok).toBe(true);
    expect(sum(run(100))).toBe(784);
    w = createWorld(3, { unlockAll: true });
    placeTownhall(w);
    for (let i = 0; i < 20; i++) addHouse(w, 2, 8, i < 10);
    expect(sum(run(100))).toBe(840);
  });
  it('RF-1 Übertrag über Steuerstufen-Wechsel (Amtsstube brennt): kein Verlust, keine Doppelbuchung', () => {
    for (let i = 0; i < 7; i++) addHouse(w, 2, 8, i % 2 === 0);
    expect(setTaxLevel(w, 'low').ok).toBe(true);
    const th = Object.values(w.buildings).find((b) => b.defId === 'townhall')!;
    const m0 = w.money;
    let units = 0;
    for (let i = 0; i < 137; i++) {
      if (i === 41) Object.assign(th, { outageUntil: 1_000_000, state: 'burning' }); // wirksam ab jetzt „normal"
      units += taxUnits(w);
      run(1);
    }
    expect((w.money - m0) * TAX_CARRY_DIVISOR + w.taxCarry).toBe(units);
  });
  it('RF-2 Aufstieg und Buchung im selben Schritt: Steuer des neuen Standes, Geld ganzzahlig', () => {
    colony(w);
    const h = readyHouse(w, 1, 4, 0);
    h.house!.satisfiedSince = 0; // weit zurück: robust gegen die Dämpfung aus T02 (höchstens 600)
    w.tick = 999; // nächster Schritt = Wachstumstakt 1000
    const [m0, c0, u0] = [w.money, w.taxCarry, w.upkeepCarry];
    step(w);
    expect(h.house!.tier).toBe(2);
    expect(w.stats.taxes).toBe(totalTaxes(w));
    const tax = Math.floor((c0 + taxUnits(w)) / TAX_CARRY_DIVISOR);
    const upk = Math.floor((u0 + totalUpkeep(w)) / UPKEEP_INTERVAL);
    expect(w.money).toBe(m0 - TIERS[1].upgradeCost!.money + tax - upk);
    expect(Number.isInteger(w.money)).toBe(true);
  });
});
```

- [ ] **`tests/sim/economy.test.ts`** (nutzt `w` aus `beforeEach`; Importe `step`, `demolish`, `placeBuilding`,
      `tickTaxes`, `forceGrass`, Typen `Building`, `BuildingDefId`):

```ts
/** Betrieb ohne Kacheln (Muster addHouse in taxes.test.ts); zählt für Unterhalt und Bilanz. */
function addRaw(world: World, defId: BuildingDefId): Building {
  const id = world.nextBuildingId++;
  const b: Building = { id, defId, x: 0, y: 0, connected: true, progress: 0, state: 'ok' };
  world.buildings[id] = b;
  return b;
}
const SET_115 = [
  'fisher',
  'weaver',
  'distillery',
  'toolmaker',
  'school',
  'chapel',
  'market',
] as const; // 5+15+20+25+25+15+10

describe('M11 Unterhalt je Tick (Spec 3.1)', () => {
  it('AK-P1-04 Unterhalt Σ 115 ohne Häuser: je Schritt −1 oder −2, nach 100 genau −115; upkeepCarry 0 … 99', () => {
    for (const id of SET_115) addRaw(w, id);
    expect(totalUpkeep(w)).toBe(115);
    const d: number[] = [];
    for (let i = 0; i < 100; i++) {
      const m = w.money;
      tickEconomy(w);
      d.push(m - w.money);
      expect(Number.isInteger(w.upkeepCarry) && w.upkeepCarry >= 0 && w.upkeepCarry < 100).toBe(
        true,
      );
    }
    expect(new Set(d)).toEqual(new Set([1, 2]));
    expect(d.reduce((a, b) => a + b, 0)).toBe(115);
  });
  it('AK-P1-06 Abriss eines Fischers bei upkeepCarry 50: Übertrag bleibt, nächster Schritt ohne die 5', () => {
    for (const id of SET_115) addRaw(w, id);
    const fisher = Object.values(w.buildings).find((b) => b.defId === 'fisher')!;
    w.upkeepCarry = 50;
    expect(demolish(w, fisher.id).ok).toBe(true);
    expect(w.upkeepCarry).toBe(50);
    const m = w.money;
    tickEconomy(w);
    expect(w.stats.upkeep).toBe(110);
    expect([m - w.money, w.upkeepCarry]).toEqual([1, 60]); // floor(160 / 100), Rest 60
  });
  it('AK-P1-07 Geld 10, Unterhalt 115, ohne Häuser: nach 20 Schritten < 0, „Kein Geld"; Steuer bucht weiter', () => {
    const k = w.buildings[w.kontorId]!;
    forceGrass(w, k.x + 2, k.y);
    for (const id of SET_115) addRaw(w, id);
    w.money = 10;
    for (let i = 0; i < 20; i++) step(w);
    expect(w.money).toBe(-13); // 10 − floor(20 × 115 / 100)
    expect(placeBuilding(w, 'house', k.x + 2, k.y)).toEqual({ ok: false, reason: 'Kein Geld' });
    const id = w.nextBuildingId++;
    w.buildings[id] = {
      ...{ id, defId: 'house', x: k.x + 2, y: k.y, connected: true, progress: 0, state: 'ok' },
      house: {
        tier: 1,
        inhabitants: 4,
        demand: {},
        satisfied: { food: true },
        services: {},
        satisfiedSince: 0,
        supplied: true,
      },
    };
    const m = w.money;
    for (let i = 0; i < 100; i++) tickTaxes(w);
    expect(w.money - m).toBe(8); // 4 EW × 2 × TAX_UNIT 2 × pct 100 × 100 / 20 000
  });
});
```

Weiter mit [T01b-fluss-save.md](T01b-fluss-save.md).
