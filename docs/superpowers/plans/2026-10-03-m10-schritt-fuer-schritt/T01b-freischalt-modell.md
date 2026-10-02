> **Task-ID:** Task 1 (Paket M10-S1A) — Teil 2 von 5
> **AK-IDs:** AK-S1-01, -02, -03, -04, -05 (a, b, Strukturteil c), -10, -11, -12, -13, -14 (a, b, c1, d–g), -15, -16 (BG-1), -20 (Fixture), `RF-1`
> **blocked-by:** Gate Plan, Gate Merge M8
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md) · [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
> **Teile:** [T01a-freischalt-modell.md](T01a-freischalt-modell.md) · **T01b-freischalt-modell.md** (diese) · [T01c-freischalt-modell.md](T01c-freischalt-modell.md) · [T01d-freischalt-modell.md](T01d-freischalt-modell.md) · [T01e-freischalt-modell.md](T01e-freischalt-modell.md)

- [ ] **Schritt 2: Failing tests — Defs, Welt, Auslöser, Reihenfolge, `nextUnlocks`** (`tests/sim/unlocks.test.ts`, neu):

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { demolish, placeBuilding } from '../../src/sim/build';
import { BUILDING_IDS } from '../../src/sim/defs/buildings';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { WIN_CITIZENS } from '../../src/sim/defs/tiers';
import {
  FUNCTION_ENTRY,
  FUNCTION_LABELS,
  ONLY_WITH_CRISES,
  UNLOCK_CHAIN,
  UNLOCK_IDS,
  UNLOCKS,
} from '../../src/sim/defs/unlocks';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, CrisisLevel, Tier, UnlockId, World } from '../../src/sim/types';
import { nextUnlocks, tickUnlocks, unlockText } from '../../src/sim/unlocks';
import { createWorld } from '../../src/sim/world';
import { setHouse, village } from './helpers';

const row = (id: UnlockId) => UNLOCKS.find((u) => u.id === id)!;
```

`tests/sim/helpers.ts` (Task 1 legt die zwei Helfer an; Tasks 2 und 4 nutzen sie):

```ts
/** Seed 3; n Wohnhäuser östlich des Kontors (x = kx+2 … kx+6, ab y = ky−2, je 5 pro Zeile), alle im Kontor-Radius. */
export function village(
  n: number,
  opts: { crisisLevel?: CrisisLevel; unlockAll?: boolean } = {},
): { w: World; houses: Building[] } {
  const w = createWorld(3, { crisisLevel: opts.crisisLevel ?? 'off', unlockAll: opts.unlockAll });
  w.money = 100_000;
  w.stock.wood = 200;
  const k = w.buildings[w.kontorId]!;
  const houses: Building[] = [];
  for (let i = 0; i < n; i++) {
    const x = k.x + 2 + (i % 5);
    const y = k.y - 2 + Math.floor(i / 5);
    forceGrass(w, x, y);
    const r = placeBuilding(w, 'house', x, y);
    if (!r.ok || r.id === undefined) throw new Error(`Haus ${i}: ${r.ok ? 'ohne Id' : r.reason}`);
    houses.push(w.buildings[r.id]!);
  }
  w.money = 5000;
  return { w, houses };
}
export const setHouse = (b: Building, tier: Tier, n: number): void => {
  b.house!.tier = tier;
  b.house!.inhabitants = n;
};
```

Weiter in `tests/sim/unlocks.test.ts`:

```ts
describe('M10 Freischaltbaum: Defs und Welt', () => {
  it('AK-S1-01 UNLOCKS: sieben Einträge wie 4.2, Texte 4.5, jede Id genau einmal', () => {
    expect(UNLOCKS.map((u) => u.id)).toEqual(['U0', 'U1', 'U2', 'U3', 'U4', 'U5', 'U6']);
    expect(UNLOCK_IDS).toEqual(UNLOCKS.map((u) => u.id));
    expect(row('U0')).toMatchObject({
      trigger: { kind: 'start' },
      buildings: ['house', 'fisher', 'lumberjack'],
      goods: ['wood', 'tools', 'stone', 'food'],
      functions: [],
    });
    expect(row('U1')).toMatchObject({
      trigger: { kind: 'houses', min: 20 },
      buildings: ['market'],
      goods: [],
      functions: [],
    });
    expect(row('U2')).toMatchObject({
      trigger: { kind: 'tierWish', tier: 2 },
      buildings: ['quarry', 'sheepfarm', 'weaver', 'chapel', 'firestation'],
      goods: ['wool', 'cloth'],
      functions: ['forest'],
    });
    expect(row('U3')).toMatchObject({
      trigger: { kind: 'tierReached', tier: 2 },
      buildings: [],
      goods: [],
      functions: ['orders'],
    });
    expect(row('U4')).toMatchObject({
      trigger: { kind: 'tierWish', tier: 3 },
      buildings: ['canefarm', 'distillery', 'school'],
      goods: ['cane', 'rum'],
      functions: [],
    });
    expect(row('U5')).toMatchObject({
      trigger: { kind: 'tierReached', tier: 3 },
      buildings: ['toolmaker'],
      goods: [],
      functions: ['goodLocks'],
    });
    expect(row('U6')).toMatchObject({
      trigger: { kind: 'tierOpen', tier: 4 },
      buildings: ['bathhouse', 'glassworks'],
      goods: ['glass'],
      functions: [],
    });
    const all = UNLOCKS.flatMap((u) => u.buildings);
    for (const id of BUILDING_IDS.filter((b) => b !== 'kontor'))
      expect(all.filter((b) => b === id)).toHaveLength(1);
    expect(all).not.toContain('kontor');
    for (const g of GOOD_IDS)
      expect(UNLOCKS.flatMap((u) => u.goods).filter((x) => x === g)).toHaveLength(1);
    for (const f of ['forest', 'orders', 'goodLocks'] as const)
      expect(UNLOCKS.flatMap((u) => u.functions).filter((x) => x === f)).toHaveLength(1);
    expect(ONLY_WITH_CRISES).toEqual({ firestation: true });
    expect(UNLOCK_CHAIN).toEqual(['U2', 'U3', 'U4', 'U5', 'U6']);
    expect(FUNCTION_ENTRY).toEqual({ forest: 'U2', orders: 'U3', goodLocks: 'U5' });
    expect(FUNCTION_LABELS).toEqual({
      forest: ['Roden', 'Aufforsten'],
      orders: ['Handelsaufträge'],
      goodLocks: ['Ausgabesperre'],
    });
    for (const u of UNLOCKS) {
      expect(u.tip.length).toBeGreaterThan(0);
      if (u.id !== 'U0')
        for (const k of ['lockText', 'whenText', 'notice'] as const)
          expect(u[k].length).toBeGreaterThan(0);
      for (const k of ['lockText', 'whenText', 'notice', 'tip'] as const)
        expect(u[k]).not.toMatch(/Tick/);
    }
    expect(unlockText(row('U1'), 'lockText')).toBe('Erst ab 20 Wohnhäusern');
    expect(unlockText(row('U2'), 'lockText')).toBe('Erst wenn ein Wohnhaus 4 Pioniere hat');
    expect(unlockText(row('U4'), 'lockText')).toBe('Erst wenn ein Wohnhaus 8 Siedler hat');
    expect(unlockText(row('U6'), 'whenText')).toBe(`nach dem Ziel (${WIN_CITIZENS} Bürger)`);
  });

  it('AK-S1-02 createWorld: version 5, v5-Felder; unlockAll ändert nur unlocked', () => {
    const w = createWorld(3);
    expect(w.version).toBe(5);
    expect(w.unlocked).toEqual(['U0']);
    expect(w.goodLocks).toEqual([]);
    expect(w.upgradeStops).toEqual([]);
    expect('terrainRev' in w).toBe(false);
    const a = createWorld(3, { unlockAll: true });
    expect(a.unlocked).toEqual(['U0', 'U1', 'U2', 'U3', 'U4', 'U5', 'U6']);
    const strip = (x: World): string =>
      JSON.stringify({ ...JSON.parse(serialize(x)), unlocked: null });
    expect(strip(a)).toBe(strip(w));
  });
});

describe('M10 Freischaltung: Auslöser und Kette (Spec 4.2, 4.3)', () => {
  it('AK-S1-03 Pionierhaus mit 4 EW → U2, mit 3 EW nicht', () => {
    const { w, houses } = village(4);
    setHouse(houses[0]!, 1, 3);
    step(w);
    expect(w.unlocked).toEqual(['U0']);
    setHouse(houses[0]!, 1, 4);
    step(w);
    expect(w.unlocked).toEqual(['U0', 'U2']);
  });
  it('AK-S1-03 Siedlerhaus → U2, U3; volles Siedlerhaus → U4; Bürgerhaus → U2 … U5', () => {
    const a = village(1);
    setHouse(a.houses[0]!, 2, 1);
    step(a.w);
    expect(a.w.unlocked).toEqual(['U0', 'U2', 'U3']);
    const b = village(1);
    setHouse(b.houses[0]!, 2, 8);
    step(b.w);
    expect(b.w.unlocked).toEqual(['U0', 'U2', 'U3', 'U4']);
    const c = village(1);
    setHouse(c.houses[0]!, 3, 1);
    step(c.w);
    expect(c.w.unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5']);
  });
  it('AK-S1-03 20 Wohnhäuser → U1, 19 nicht', () => {
    const a = village(20);
    step(a.w);
    expect(a.w.unlocked).toEqual(['U0', 'U1']);
    const b = village(19);
    step(b.w);
    expect(b.w.unlocked).toEqual(['U0']);
  });
  it('AK-S1-03 won true → U6 mit U2 … U5; Reihenfolge UNLOCK_IDS, keine Doppelten', () => {
    const { w } = village(1);
    w.won = true;
    step(w);
    expect(w.unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5', 'U6']);
    tickUnlocks(w);
    expect(w.unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5', 'U6']);
  });
  it('AK-S1-04 monoton: Schrumpfen und Abriss aller Häuser nehmen U2 nicht zurück', () => {
    const { w, houses } = village(4);
    setHouse(houses[0]!, 1, 4);
    step(w);
    expect(w.unlocked).toContain('U2');
    setHouse(houses[0]!, 1, 1);
    for (const h of houses) expect(demolish(w, h.id).ok).toBe(true);
    for (let i = 0; i < 200; i++) step(w);
    expect(w.unlocked).toContain('U2');
  });
  it('AK-S1-05 (a) U2 direkt nach dem Schritt, in dem das Haus 4 EW erreicht', () => {
    const { w, houses } = village(1);
    w.stock.food = 100;
    setHouse(houses[0]!, 1, 3);
    for (let i = 0; i < 400 && houses[0]!.house!.inhabitants < 4; i++) {
      expect(w.unlocked).not.toContain('U2');
      step(w);
    }
    expect(houses[0]!.house!.inhabitants).toBe(4);
    expect(w.unlocked).toContain('U2');
  });
  it('AK-S1-05 (b) Bürgerzahl erreicht WIN_CITIZENS: won und U6 nach demselben Schritt', () => {
    const { w, houses } = village(4);
    [15, 15, 15, 5].forEach((n, i) => setHouse(houses[i]!, 3, n));
    expect(w.won).toBe(false);
    expect(w.unlocked).not.toContain('U6');
    step(w);
    expect(w.won).toBe(true);
    expect(w.unlocked).toContain('U6');
  });
  it('AK-S1-05 (c) tickUnlocks ist der letzte Aufruf in step, direkt nach checkWin', () => {
    const src = readFileSync('src/sim/tick.ts', 'utf8');
    const body = src.slice(src.indexOf('export function step'));
    const calls = [...body.slice(0, body.indexOf('\n}')).matchAll(/^\s+(\w+)\(world\);/gm)].map(
      (m) => m[1],
    );
    expect(calls.slice(-2)).toEqual(['checkWin', 'tickUnlocks']);
  });
});

describe('M10 nextUnlocks (Spec 12.2)', () => {
  it('AK-S1-10 neue Welt mit 3/2/1/1 EW: U1 und U2 mit Fortschritt; Kette; U6; unlockAll leer', () => {
    const { w, houses } = village(4, { crisisLevel: 'normal' });
    [3, 2, 1, 1].forEach((n, i) => setHouse(houses[i]!, 1, n));
    const n = nextUnlocks(w);
    expect(n.map((e) => e.id)).toEqual(['U1', 'U2']);
    expect(n[0]).toMatchObject({
      names: ['Marktplatz'],
      when: 'sobald 20 Wohnhäuser stehen',
      now: 4,
      need: 20,
      taxBlocks: false,
    });
    expect(n[1]).toMatchObject({
      names: ['Steinbruch', 'Schäferei', 'Weberei', 'Kapelle', 'Feuerwache', 'Roden', 'Aufforsten'],
      when: 'sobald ein Wohnhaus 4 Pioniere hat',
      now: 3,
      need: 4,
      taxBlocks: false,
    });
    const off = village(4);
    [3, 2, 1, 1].forEach((m, i) => setHouse(off.houses[i]!, 1, m));
    expect(nextUnlocks(off.w)[1]!.names).toEqual([
      'Steinbruch',
      'Schäferei',
      'Weberei',
      'Kapelle',
      'Roden',
      'Aufforsten',
    ]);
    w.unlocked = ['U0', 'U2'];
    expect(nextUnlocks(w).find((e) => e.id === 'U3')).toMatchObject({ now: null, need: null });
    w.unlocked = ['U0', 'U1', 'U2', 'U3', 'U4', 'U5'];
    setHouse(houses[0]!, 3, 12);
    expect(nextUnlocks(w)).toEqual([expect.objectContaining({ id: 'U6', now: 12, need: 50 })]);
    expect(nextUnlocks(createWorld(3, { unlockAll: true }))).toEqual([]);
  });
});
```

`tests/sim/save.test.ts` — Importe ergänzen (`readFileSync` aus `node:fs`, falls nicht da; `buildLock`,
`deriveUnlocks` aus `../../src/sim/unlocks`; `placeBuilding`, `placeRoad` aus `../../src/sim/build`;
`prepareEast`, `forceRect`, `village`, `setHouse` aus `./helpers`), am Dateiende:

```ts
/** Synthetischer v4-Stand: v5-Felder entfernt, version 4 (Spec 8.2). */
function asV4(w: World): string {
  const raw = JSON.parse(serialize(w)) as Record<string, unknown>;
  delete raw.unlocked;
  delete raw.goodLocks;
  delete raw.upgradeStops;
  raw.version = 4;
  return JSON.stringify(raw);
}
const loadOk = (json: string): World => {
  const r = deserialize(json);
  if (!r.ok) throw new Error(r.reason);
  return r.world;
};
/** Angebundener Werkzeugmacher östlich des Kontors (wie tests/sim/toolmaker.test.ts). */
function connectedToolmaker(w: World): Building {
  const k = w.buildings[w.kontorId]!;
  prepareEast(w, k);
  expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
  forceRect(w, k.x + 3, k.y, 2, 2, 'grass');
  const r = placeBuilding(w, 'toolmaker', k.x + 3, k.y);
  if (!r.ok || r.id === undefined) throw new Error(r.ok ? 'ohne Id' : r.reason);
  return w.buildings[r.id]!;
}

describe('M10 Save v5 (Spec 8.2)', () => {
  it('AK-S1-11 Round-trip v5 mit unlocked, goodLocks, upgradeStops', () => {
    const w = createWorld(3);
    w.unlocked = ['U0', 'U2', 'U3'];
    w.goodLocks = [{ tier: 2, good: 'cloth' }];
    w.upgradeStops = [1];
    expect(loadOk(serialize(w))).toEqual(w);
  });
  // Fixture erzeugt auf <BASIS> (= <SHA eintragen>) mit dem temporären Test gen-save-v4 (Plan M10 Task 1 Schritt 1):
  // Controller Seed 3, Krisen normal mit Feuerwache, angehalten bei Tick 4800, dann setTaxLevel(w, 'high').
  it('AK-S1-12 save-v4.json lädt als v5 mit abgeleiteter Freischaltung; alles andere unverändert', () => {
    const json = readFileSync('tests/sim/fixtures/save-v4.json', 'utf8');
    const raw = JSON.parse(json) as Record<string, unknown>;
    const w = loadOk(json);
    expect(w.version).toBe(5);
    expect(w.unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5']);
    expect(w.goodLocks).toEqual([]);
    expect(w.upgradeStops).toEqual([]);
    expect(w.taxLevel).toBe('high');
    for (const k of [
      'buildings',
      'stock',
      'money',
      'tick',
      'taxLockedUntil',
      'sellPct',
      'order',
      'crisisLevel',
      'crisis',
      'won',
      'wonMerchants',
    ] as const)
      expect(w[k]).toEqual(raw[k]);
  });
  it('AK-S1-13 Kette: save-v3 → U0, U2 … U5; save-v1, save-v2 → v5 mit deriveUnlocks', () => {
    const v3 = loadOk(readFileSync('tests/sim/fixtures/save-v3.json', 'utf8'));
    expect(v3.version).toBe(5);
    expect(v3.unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5']);
    for (const f of ['save-v1.json', 'save-v2.json']) {
      const w = loadOk(readFileSync(`tests/sim/fixtures/${f}`, 'utf8'));
      expect(w.version).toBe(5);
      expect(w.unlocked).toEqual(deriveUnlocks(w));
      expect(w.goodLocks).toEqual([]);
      expect(w.upgradeStops).toEqual([]);
    }
  });
  it('AK-S1-14 Migration je Fall (a, b, c1, d–g)', () => {
    const a = village(4, { unlockAll: true });
    expect(loadOk(asV4(a.w)).unlocked).toEqual(['U0']);
    const b = village(4, { unlockAll: true });
    setHouse(b.houses[0]!, 1, 4);
    expect(loadOk(asV4(b.w)).unlocked).toEqual(['U0', 'U2']);
    const c = createWorld(3, { unlockAll: true });
    const tm = connectedToolmaker(c);
    c.stock.wood = 10;
    tm.progress = 20;
    expect(loadOk(asV4(c)).unlocked).toEqual(['U0', 'U5']); // c1: ohne Kette (c2 in Task 4)
    const d = createWorld(3, { unlockAll: true });
    const k = d.buildings[d.kontorId]!;
    forceRect(d, k.x + 3, k.y + 3, 2, 2, 'grass');
    expect(placeBuilding(d, 'market', k.x + 3, k.y + 3).ok).toBe(true);
    expect(loadOk(asV4(d)).unlocked).toContain('U1');
    expect(loadOk(asV4(village(20, { unlockAll: true }).w)).unlocked).toContain('U1');
    const f = village(1, { unlockAll: true });
    f.w.won = true;
    expect(loadOk(asV4(f.w)).unlocked).toEqual(['U0', 'U2', 'U3', 'U4', 'U5', 'U6']);
    const g = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const gk = g.buildings[g.kontorId]!;
    forceRect(g, gk.x + 3, gk.y + 3, 2, 2, 'grass');
    expect(placeBuilding(g, 'firestation', gk.x + 3, gk.y + 3).ok).toBe(true);
    expect(loadOk(asV4(g)).unlocked).toEqual(['U0', 'U2']);
  });
  it('AK-S1-15 Negativfälle → Beschädigter Spielstand bzw. Unbekannte Version, ohne Ausnahme', () => {
    const bad = (mut: (r: Record<string, unknown>) => void) => {
      const r = JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
      mut(r);
      return deserialize(JSON.stringify(r));
    };
    const damaged = { ok: false, reason: 'Beschädigter Spielstand' };
    const cases: ((r: Record<string, unknown>) => void)[] = [
      (r) => delete r.unlocked,
      (r) => (r.unlocked = 'U0'),
      (r) => (r.unlocked = ['U0', 'U9']),
      (r) => (r.unlocked = ['U0', 2]),
      (r) => (r.unlocked = ['U0', 'U2', 'U2']),
      (r) => (r.unlocked = ['U2']),
      (r) => (r.unlocked = ['U2', 'U0']),
      (r) => delete r.goodLocks,
      (r) => (r.goodLocks = [{ tier: 5, good: 'food' }]),
      (r) => (r.goodLocks = [{ tier: 2, good: 'gold' }]),
      (r) => (r.goodLocks = [{ tier: 1, good: 'cloth' }]),
      (r) =>
        (r.goodLocks = [
          { tier: 2, good: 'cloth' },
          { tier: 2, good: 'cloth' },
        ]),
      (r) =>
        (r.goodLocks = [
          { tier: 3, good: 'rum' },
          { tier: 2, good: 'cloth' },
        ]),
      (r) => delete r.upgradeStops,
      (r) => (r.upgradeStops = [0]),
      (r) => (r.upgradeStops = [4]),
      (r) => (r.upgradeStops = [1, 1]),
      (r) => (r.upgradeStops = [2, 1]),
    ];
    for (const m of cases) expect(() => bad(m)).not.toThrow();
    for (const m of cases) expect(bad(m)).toEqual(damaged);
    const v = village(1, { unlockAll: true });
    const r4 = JSON.parse(asV4(v.w)) as Record<string, unknown>;
    expect(deserialize(JSON.stringify({ ...r4, buildings: 5 }))).toEqual(damaged);
    const noHouse = JSON.parse(asV4(v.w)) as { buildings: Record<string, Record<string, unknown>> };
    delete noHouse.buildings[String(v.houses[0]!.id)]!.house;
    expect(() => deserialize(JSON.stringify(noHouse))).not.toThrow();
    expect(deserialize(JSON.stringify(noHouse))).toEqual(damaged);
    expect(bad((r) => (r.version = 6))).toEqual({ ok: false, reason: 'Unbekannte Version' });
  });
  it('RF-1 gespeicherte Freischaltung gilt: U6 ohne won bleibt, U2 … U5 werden nicht nachgezogen', () => {
    const w = createWorld(3);
    w.unlocked = ['U0', 'U6'];
    const l = loadOk(serialize(w));
    expect(buildLock(l, 'bathhouse')).toBeNull();
    step(l);
    expect(l.unlocked).toEqual(['U0', 'U6']);
  });
});
```

Hinweis: `village`/`setHouse` stehen in `tests/sim/helpers.ts` (nie aus einer `.test.ts`-Datei importieren — Vitest
würde deren Tests doppelt registrieren). `helpers.ts` ist damit in Task 1 mit-owned (Ownership-Zeile Task 1).
