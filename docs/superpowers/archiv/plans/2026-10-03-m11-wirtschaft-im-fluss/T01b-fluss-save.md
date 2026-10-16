> **Task-ID:** T01 (Paket M11-P1a) — Teil 2 von 3
> **AK-IDs / blocked-by / Strang:** siehe [T01a-fluss-save.md](T01a-fluss-save.md)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints)
> **Teile:** [T01a-fluss-save.md](T01a-fluss-save.md) · **T01b-fluss-save.md** (diese: Tests Lauf/Naht/Save, Rot-Beleg) · [T01c-fluss-save.md](T01c-fluss-save.md)

## Schritt 1: Tests zuerst (Teil 2)

- [ ] **`tests/sim/balance-flow.test.ts` (neu).** Eigene Schleife wie `runColony` (`controller.ts:296-317`), damit
      das Geld direkt vor und nach `step` lesbar ist; `controller.ts` bleibt unverändert, der Lauf ist bitgleich zum
      Referenzlauf (gleiche `control`-Aufrufe vor gleichen Schritten).

```ts
import { describe, expect, it } from 'vitest';
import { WIN_CITIZENS } from '../../src/sim/defs/tiers';
import { citizens } from '../../src/sim/population';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { CONTROL_INTERVAL, control, MAX_TICKS, startColony } from './controller';

const tierSum = (w: World): number =>
  Object.values(w.buildings).reduce((s, b) => s + (b.house?.tier ?? 0), 0);

describe('M11 Fluss im Referenzlauf (Spec 3.1)', () => {
  it('AK-P1-05 Seed 3, Krisen aus: |Δ − (taxes − upkeep) / 100| ≤ 2 in jedem Schritt ohne Aufstieg', () => {
    const w = createWorld(3);
    const { layout } = startColony(w);
    let checked = 0;
    while (w.tick < MAX_TICKS && citizens(w) < WIN_CITIZENS) {
      if (w.tick % CONTROL_INTERVAL === 0) control(w, layout, {});
      const [m0, t0] = [w.money, tierSum(w)];
      step(w);
      if (tierSum(w) > t0) continue; // Aufstieg bezahlt in step (Spec 11.1)
      const d = w.money - m0 - (w.stats.taxes - w.stats.upkeep) / 100;
      expect(Math.abs(d), `Tick ${w.tick}`).toBeLessThanOrEqual(2);
      checked++;
    }
    expect(w.won).toBe(true);
    expect(checked).toBeGreaterThan(6000);
  });
});
```

- [ ] **`tests/sim/levels.test.ts` (neu):**

```ts
import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';
import { cycleOf, upkeepOf, utilization } from '../../src/sim/levels';
import type { Building, BuildingDefId } from '../../src/sim/types';

const at = (defId: BuildingDefId, extra: Partial<Building> = {}): Building =>
  ({ id: 1, defId, x: 0, y: 0, connected: true, progress: 0, state: 'ok', ...extra }) as Building;

describe('M11 Naht cycleOf/upkeepOf (Spec 3.1, Anhang 01 C)', () => {
  it('AK-P1-13 ohne level liefern cycleOf/upkeepOf def.cycle/def.upkeep für jedes Gebäude (Fischer 40/5)', () => {
    for (const id of BUILDING_IDS) {
      expect(cycleOf(at(id)), id).toBe(BUILDING_DEFS[id].cycle); // undefined ohne Zyklus
      expect(upkeepOf(at(id)), id).toBe(BUILDING_DEFS[id].upkeep);
      expect(utilization(at(id)), id).toBe(BUILDING_DEFS[id].produces ? 1000 : null);
    }
    expect([cycleOf(at('fisher')), upkeepOf(at('fisher'))]).toEqual([40, 5]);
    expect([0, 94208, 256000].map((eff) => utilization(at('fisher', { eff })))).toEqual([
      0, 368, 1000,
    ]);
  });
});
```

- [ ] **`tests/sim/imports.test.ts`** (neuer `describe`; nutzt `SIM`, `files`, `readFileSync` der Datei):

```ts
describe('M11 Naht Zyklus und Unterhalt (Prüfhilfe AK-P1-14)', () => {
  it('PLAN-NAHT src/sim (ausser levels.ts, defs/) und render/errands.ts lesen cycle/upkeep nie direkt', () => {
    const read = /\b(def|BUILDING_DEFS\[[^\]]+\])\.(cycle|upkeep)\b/;
    const paths = files.filter((m) => m !== 'levels').map((m) => `${SIM}/${m}.ts`);
    for (const f of [...paths, 'src/render/errands.ts'])
      expect(read.test(readFileSync(f, 'utf8')), f).toBe(false);
    expect(importsOf('levels').every((m) => m === 'types' || m.startsWith('defs/'))).toBe(true);
  });
});
```

- [ ] **`tests/sim/save.test.ts`** (neuer `describe` am Ende; Importe `BUILDING_DEFS`, `utilization`, Typ `BuildingDefId`;
      `loadOk`, `tampered`, `village`, `step` sind in der Datei vorhanden):

```ts
const addRawB = (w: World, defId: BuildingDefId): Building => {
  const id = w.nextBuildingId++;
  return (w.buildings[id] = { id, defId, x: 0, y: 0, connected: true, progress: 0, state: 'ok' });
};

describe('M11 Save v6 (Spec 5)', () => {
  it('AK-SAV-01 createWorld: version 6, Überträge 0; nach 1000 Schritten Round-trip gleich', () => {
    const w = createWorld(3);
    expect([w.version, w.taxCarry, w.upkeepCarry]).toEqual([6, 0, 0]);
    const v = village(4);
    for (let i = 0; i < 1000; i++) step(v.w);
    expect(loadOk(serialize(v.w))).toEqual(v.w);
  });
  it('AK-SAV-02 save-v5.json lädt als v6 (Überträge 0, ohne eff/level, Auslastung 1000); v1–v4 durch die Kette', () => {
    const w = loadOk(readFileSync('tests/sim/fixtures/save-v5.json', 'utf8'));
    expect([w.version, w.taxCarry, w.upkeepCarry]).toEqual([6, 0, 0]);
    for (const b of Object.values(w.buildings)) {
      expect([b.eff, b.level]).toEqual([undefined, undefined]);
      expect(utilization(b)).toBe(BUILDING_DEFS[b.defId].produces ? 1000 : null);
    }
    expect(() => {
      for (let i = 0; i < 100; i++) step(w);
    }).not.toThrow();
    for (const f of ['save-v1.json', 'save-v2.json', 'save-v3.json', 'save-v4.json'])
      expect(loadOk(readFileSync(`tests/sim/fixtures/${f}`, 'utf8')).version, f).toBe(6);
  });
  it('AK-SAV-04 Beschädigter Spielstand bei kaputten Überträgen, eff, level, state; noForest angenommen', () => {
    const { w: v, houses } = village(1);
    const fisher = addRawB(v, 'fisher'); // fisher erhält in P3 einen LEVELS-Eintrag: Fälle bleiben gültig
    const chapel = addRawB(v, 'chapel');
    const on = (id: number, k: string, val: unknown) => (r: Record<string, unknown>) => {
      (r.buildings as Record<string, Record<string, unknown>>)[String(id)]![k] = val;
    };
    const cases: ((r: Record<string, unknown>) => void)[] = [
      (r) => (r.taxCarry = -1),
      (r) => (r.taxCarry = 20000),
      (r) => (r.taxCarry = 1.5),
      (r) => (r.upkeepCarry = 100),
      on(fisher.id, 'eff', -1),
      on(fisher.id, 'eff', 256001),
      on(fisher.id, 'eff', 1.5),
      on(houses[0]!.id, 'eff', 1000),
      on(fisher.id, 'level', 1),
      on(fisher.id, 'level', 4),
      on(chapel.id, 'level', 2),
      on(fisher.id, 'state', 'foo'),
    ];
    for (const c of cases) {
      expect(() => deserialize(tampered(v, c))).not.toThrow();
      expect(deserialize(tampered(v, c))).toEqual({ ok: false, reason: 'Beschädigter Spielstand' });
    }
    for (const ok of [
      on(fisher.id, 'state', 'noForest'),
      on(fisher.id, 'eff', 0),
      on(fisher.id, 'eff', 256000),
    ])
      expect(deserialize(tampered(v, ok)).ok).toBe(true);
  });
  it('AK-SAV-05 version 7 → Unbekannte Version; SAVE_VERSION 6', () => {
    expect(SAVE_VERSION).toBe(6);
    expect(deserialize(tampered(createWorld(3), (r) => (r.version = 7)))).toEqual({
      ok: false,
      reason: 'Unbekannte Version',
    });
  });
});
```

## Schritt 2: Rot-Beleg (vor jeder `src`-Änderung)

`npx vitest run tests/sim/defs.test.ts tests/sim/taxes.test.ts tests/sim/economy.test.ts tests/sim/balance-flow.test.ts
tests/sim/levels.test.ts tests/sim/imports.test.ts tests/sim/save.test.ts -t "M11"` und Meldungen ins Ledger.

| AK / Test     | Erwartete Meldung vor der Umsetzung                                                         |
| ------------- | ------------------------------------------------------------------------------------------- |
| AK-P1-01      | `expected [ undefined, 0.5, undefined ] to deeply equal [ 2, 0.5, 20000 ]`                  |
| AK-P1-02, -03 | `expected false to be true` (Übertrag `undefined`), danach `Set{0}` ≠ `Set{11, 12}`         |
| RF-1          | `expected false to be true` (Übertrag `undefined`)                                          |
| RF-2          | `expected NaN to be …` (`taxCarry` fehlt)                                                   |
| AK-P1-04      | `expected false to be true` (`upkeepCarry` fehlt)                                           |
| AK-P1-06      | `expected [ 0, 50 ] to deeply equal [ 1, 60 ]` (alter Takt bucht bei `tick` 0 nicht)        |
| AK-P1-07      | `expected 10 to be -13` (vor Tick 100 keine Buchung)                                        |
| AK-P1-05      | `Tick 100: expected 4.x to be less than or equal to 2` (Schub am 100er-Takt)                |
| AK-P1-13      | `Failed to resolve import "../../src/sim/levels"`                                           |
| PLAN-NAHT     | `src/sim/production.ts: expected true to be false`                                          |
| AK-SAV-01     | `expected [ 5, undefined, undefined ] to deeply equal [ 6, 0, 0 ]`                          |
| AK-SAV-02     | `Failed to resolve import "../../src/sim/levels"` (Import `utilization`), sonst `version 5` |
| AK-SAV-04     | `expected { ok: true, … } to deeply equal { ok: false, reason: 'Beschädigter Spielstand' }` |
| AK-SAV-05     | `expected 5 to be 6`                                                                        |

Der genaue Wortlaut darf abweichen; wichtig ist: jeder neue Test läuft und ist aus dem genannten Grund rot.

Weiter mit [T01c-fluss-save.md](T01c-fluss-save.md).
