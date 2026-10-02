> **Task-ID:** Task 5 (Paket M10-B1) — Teil 2 von 3
> **AK-IDs:** AK-B1-01, -02 (BG-2), -03, -04 (Messwerte im Bericht)
> **blocked-by:** Task 4
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md)
> **Teile:** [T05a-messung-szenarien.md](T05a-messung-szenarien.md) · **T05b-messung-szenarien.md** (diese) · [T05c-messung-szenarien.md](T05c-messung-szenarien.md)

- [ ] **Schritt 1: Failing tests** — `tests/sim/unlock-timeline.test.ts` (neu):

```ts
import { describe, expect, it } from 'vitest';
import { BUILDING_IDS } from '../../src/sim/defs/buildings';
import type { BuildingDefId, CrisisLevel, UnlockId, World } from '../../src/sim/types';
import { entryOfBuilding } from '../../src/sim/unlocks';
import { createWorld } from '../../src/sim/world';
import { runColony, startColony } from './controller';

interface Timeline {
  unlock: Partial<Record<UnlockId, number>>;
  build: Partial<Record<BuildingDefId, number>>;
  winTick: number | null;
}

/** Controller-Lauf ohne Eingriff; protokolliert über den stop-Rückruf (immer false) nach jedem Schritt. */
function timeline(level: CrisisLevel, fireStation: boolean): Timeline {
  const w = createWorld(3, { crisisLevel: level });
  const tl: Timeline = { unlock: {}, build: {}, winTick: null };
  const record = (x: World, placedAt: number): boolean => {
    for (const id of x.unlocked) tl.unlock[id] ??= x.tick;
    for (const b of Object.values(x.buildings)) tl.build[b.defId] ??= placedAt;
    return false;
  };
  const { layout, t } = startColony(w);
  record(w, 0);
  // Gebäude aus control() bei Tick T sieht der Rückruf nach dem Schritt T+1: Bautick = tick − 1 (Spec 9.3)
  runColony(w, layout, t, { fireStation }, (x) => record(x, x.tick - 1));
  tl.winTick = t.winTick;
  if (import.meta.env.VITE_BALANCE_LOG) console.log(level, JSON.stringify(tl));
  return tl;
}

describe('M10 Freischalt-Ticks Seed 3 (Spec 9.3)', () => {
  const cases = [
    { level: 'off' as const, fire: false, u5: 3850, u6: 6050, school: 3700 },
    { level: 'normal' as const, fire: true, u5: 4750, u6: 7050, school: 4600 },
  ];
  for (const c of cases)
    it(`AK-B1-01 Krisen ${c.level}: Freischalt- und Bauticks exakt, kein Bau vor seiner Freischaltung`, () => {
      const tl = timeline(c.level, c.fire);
      expect(tl.unlock).toMatchObject({ U0: 0, U2: 150, U3: 350, U4: 550, U5: c.u5, U6: c.u6 });
      expect(tl.unlock.U1).toBeUndefined();
      expect(tl.winTick).toBe(c.u6);
      for (const id of ['chapel', 'sheepfarm', 'weaver'] as const) expect(tl.build[id]).toBe(200);
      for (const id of ['school', 'canefarm', 'distillery'] as const)
        expect(tl.build[id]).toBe(c.school);
      for (const id of BUILDING_IDS) {
        const e = entryOfBuilding(id);
        if (e === null || tl.build[id] === undefined) continue;
        expect(tl.build[id]!, id).toBeGreaterThanOrEqual(tl.unlock[e.id]!);
      }
    });
});
```

`tests/sim/scenario-saves.test.ts`, neuer `describe('M10 Szenarien (Spec 18.1)')`:

```ts
const M10 = [
  'm10-start',
  'm10-pionier-fast-voll',
  'm10-siedler-fast',
  'm10-wald',
  'm10-amtsstube',
  'm10-amtsstube-aus',
  'm10-krise-bald',
] as const;
const PROBE_SPEC: Record<string, Record<string, [number, number]>> = {
  'm10-start': { kontor: [0, 0] },
  'm10-pionier-fast-voll': { kontor: [0, 0], haus3: [3, -2] },
  'm10-siedler-fast': { kontor: [0, 0], 'haus-voll': [3, -2], kapelle: [6, -2] },
  'm10-wald': { kontor: [0, 0], wald: [20, -7], weide: [12, -3], holzfaeller: [19, -5] },
  'm10-amtsstube': {
    kontor: [0, 0],
    amtsstube: [11, -7],
    schule: [6, 1],
    'werkzeug-mit': [11, 1],
    'werkzeug-ohne': [17, 6],
  },
  'm10-amtsstube-aus': {
    kontor: [0, 0],
    amtsstube: [3, -6],
    schule: [6, 1],
    'werkzeug-mit': [11, 1],
    'werkzeug-ohne': [17, 6],
  },
  'm10-krise-bald': { kontor: [0, 0] },
};

describe('M10 Szenarien (Spec 18.1)', () => {
  it('AK-B1-03 alle Szenarien laden als v5, unlocked = deriveUnlocks (ausser m10-start), galerie mit townhall, kein „Tick"', () => {
    for (const name of [...M10, 'galerie']) {
      const w = SCENARIOS[name]!();
      const r = deserialize(serialize(w));
      expect(r.ok, name).toBe(true);
      if (!r.ok) continue;
      expect(r.world.version).toBe(5);
      expect(r.world.unlocked, name).toEqual(
        name === 'm10-start' ? ['U0'] : deriveUnlocks(r.world),
      );
      expect(JSON.stringify(PROBES[name]!(r.world))).not.toMatch(/Tick/);
    }
    const g = SCENARIOS.galerie!();
    for (const id of BUILDING_IDS)
      expect(
        Object.values(g.buildings).some((b) => b.defId === id),
        id,
      ).toBe(true);
  });
  it('AK-B1-03 Prüfpunkte: vorhanden, auf der Karte, tragen Gebäude bzw. Gelände; Abstände; amtsstube-aus nicht angebunden', () => {
    for (const name of M10) {
      const w = SCENARIOS[name]!();
      const k = w.buildings[w.kontorId]!;
      const probes = PROBES[name]!(w);
      for (const [p, [dx, dy]] of Object.entries(PROBE_SPEC[name]!)) {
        expect(probes[p], `${name}/${p}`).toEqual({ x: k.x + dx, y: k.y + dy });
        expect(inBounds(w, k.x + dx, k.y + dy)).toBe(true);
      }
    }
    const at = (w: World, p: { x: number; y: number }) => w.tiles[idx(w, p.x, p.y)]!;
    const wald = SCENARIOS['m10-wald']!();
    const pw = PROBES['m10-wald']!(wald);
    expect([
      at(wald, pw.wald!).terrain,
      at(wald, pw.wald!).buildingId,
      at(wald, pw.wald!).road,
    ]).toEqual(['forest', null, false]);
    expect([
      at(wald, pw.weide!).terrain,
      at(wald, pw.weide!).buildingId,
      at(wald, pw.weide!).road,
    ]).toEqual(['grass', null, false]);
    const hf = wald.buildings[at(wald, pw.holzfaeller!).buildingId!]!;
    expect([hf.defId, hf.connected]).toEqual(['lumberjack', true]);
    for (const name of ['m10-amtsstube', 'm10-amtsstube-aus'] as const) {
      const w = SCENARIOS[name]!();
      const p = PROBES[name]!(w);
      const b = (n: string) => w.buildings[at(w, p[n]!).buildingId!]!;
      const mid = (x: Building) => center(BUILDING_DEFS[x.defId], x.x, x.y);
      const dist = (a: Building, c: Building) =>
        Math.hypot(mid(a).cx - mid(c).cx, mid(a).cy - mid(c).cy);
      expect([b('amtsstube').defId, b('amtsstube').connected]).toEqual([
        'townhall',
        name === 'm10-amtsstube',
      ]);
      expect(dist(b('werkzeug-mit'), b('schule'))).toBeLessThanOrEqual(10);
      expect(dist(b('werkzeug-ohne'), b('schule'))).toBeGreaterThan(10);
    }
  });
  it('AK-B1-03 writeProbes schreibt je Szenario aus 18.1 genau <name>.probes.json mit den Prüfpunkten', () => {
    const written: [string, string][] = [];
    const fake = (path: string, text: string): void => void written.push([path, text]);
    expect(writeProbes(undefined, fake)).toBe(0);
    expect(writeProbes('out', fake)).toBe(8);
    expect(written.map(([p]) => p).sort()).toEqual(
      [...M10, 'galerie'].map((n) => `out/${n}.probes.json`).sort(),
    );
    for (const [p, text] of written) {
      const name = p.slice('out/'.length, -'.probes.json'.length);
      expect(JSON.parse(text)).toEqual(PROBES[name]!(SCENARIOS[name]!()));
    }
  });
});
```

`SCENARIOS`, `PROBES` und `writeProbes(dir, write = writeFileSync)` sind Exporte aus `scenarios.ts`. `writeProbes`
ist eine **eigene** Funktion neben `writeScenarios` (der bestehende Test AK-S5-02 „genau eine Datei je Szenario"
bleibt so unverändert); der bestehende `SCENARIO_OUT`-Lauf in `scenario-saves.test.ts` ruft beide auf.

- [ ] **Schritt 2: Rot prüfen.** `npx vitest run tests/sim/unlock-timeline.test.ts tests/sim/scenario-saves.test.ts -t "M10"`
      → `AK-B1-01` grün erlaubt (Messung des Bestands, **Vor der Umsetzung grün erlaubt**: AK-B1-01); `AK-B1-03` FAIL
      (`SCENARIOS['m10-start'] is not a function`).
- [ ] **Schritt 3: Szenarien** in `tests/sim/scenarios.ts`: Basis `m10Base(level)` = `createWorld(3, { crisisLevel:
level, unlockAll: true })`, `prepareLayout(w)` und alle `layout.roads` als Wege (wie `startColony`, ohne Häuser);
      danach je Szenario (Inhalte wörtlich Spec 18.1, Prüfpunkte Tabelle oben), am Ende `finishUnlocks(w)` — Ausnahme
      `m10-start`, `m10-pionier-fast-voll` und `m10-krise-bald`: `w.unlocked = ['U0']` (Spec 18.1). Hinweise:
      `m10-pionier-fast-voll` Tick **99** (1 vor dem Wachstumstakt 100), Häuser auf `layout.houses`, `haus3` mit 3 EW, Nahrung 30;
      `m10-siedler-fast` Tick **1549**, `w.order` = Auftrag der Periode 1 von Hand (`offered 1500`, `due 2100`, Gut
      und Menge aus `orderForPeriod(seed, 1, maxTier)`, Feldnamen wie `Order`), `unlocked ['U0', 'U2']`;
      `m10-wald` `unlocked ['U0', 'U2']`, Geld 500; `m10-amtsstube` Amtsstube per `put` auf (43, 24), Häuser auf den
      vier `layout.houses` (Pionier, Siedler, Bürger bewohnt), Stoff 2; `m10-amtsstube-aus` gleiche Bauten, Amtsstube
      auf (35, 25) ohne angrenzenden Weg, `taxLevel 'high'`; `m10-krise-bald` Krisen „normal", Tick **2399**, nur
      Kontor. `galerie`: + Amtsstube (angebunden). `PROBES` liefert je Szenario die absoluten Koordinaten;
      `writeScenarios` schreibt zusätzlich `<name>.probes.json`. Liegt ein Prüfpunkt im gebauten Stand nicht wie in
      der Tabelle: **nicht verschieben**, melden (R137).
- [ ] **Schritt 4: Grün prüfen.** `npx vitest run tests/sim`; `make check`.
