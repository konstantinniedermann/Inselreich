> **Task-ID:** T07 (Paket M11-P3A) — Teil 1 von 2
> **AK-IDs:** AK-P3-02, -03, -04; AK-UNL-03 (AK-P3-01 nur Vorstufe, final in T09)
> **blocked-by:** T03 (Review OK)
> **Strang:** `feat/m11-upgrade` · Worktree `.worktrees/m11-upgrade` (ab `<T03-SHA>`) · Implementierer `tech-sim-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-06](orga-06-schnittstellen.md) · [orga-07](orga-07-datei-ownership.md)
> **Teile:** **T07a-ausbau-kern.md** (diese) · [T07b-ausbau-kern.md](T07b-ausbau-kern.md)

## T07: Ausbau-Kern — `LEVELS` (9 Betriebe), `upgradeBuilding`

**Ziel:** Die neun heutigen Betriebe lassen sich auf Stufe 2 und 3 ausbauen (Spec 3.6, Werte Anhang 01 A.4). Neu
`src/sim/upgrade.ts` mit `upgradeBuilding(world, id)` → `{ ok, reason }`, sieben Gründe in fester Reihenfolge.
`hunter`/`cattlefarm` gibt es in diesem Strang nicht (P2 ∥); ihre `LEVELS`-Einträge setzt T09.

**Code-Fakten (Stand nach T03):**

- `src/sim/defs/levels.ts` (T01): `LevelDef` und `LEVELS = {}` (leer, Typ
  `Readonly<Partial<Record<BuildingDefId, readonly [LevelDef, LevelDef]>>>`). Fehlt `LevelDef` dort, legt T07 es nach
  Anhang 01 A.4 an (Rückmeldung an den Controller).
- `src/sim/levels.ts` (T01): `cycleOf(b)`, `upkeepOf(b)` lesen `LEVELS[defId][level − 2]`; `goodsBalance` (`flow.ts`, T02)
  und `totalUpkeep` (`economy.ts`, T01) lesen darüber. T07 ändert diese Dateien nicht.
- `src/sim/economy.ts:23-38` `checkAfford(world, cost)` (Gründe „Kein Geld", „Zu wenig Geld", „Zu wenig Holz",
  „Zu wenig Werkzeug", „Zu wenig Stein"), `pay(world, cost)`; `:17` `takeStock(world, good, n)`.
- `src/sim/unlocks.ts:94-97` `functionLock(w, f)`; `FUNCTION_ENTRY` aus `defs/unlocks.ts:99` liefert nach T01
  `upgrade2 → 'U3'`, `upgrade3 → 'U5'`; Texte `lockText` U3 „Erst mit den ersten Siedlern", U5 „Erst mit den ersten Bürgern".
- `src/sim/defs/goods.ts:3` `GOODS.cloth.name` „Stoff", `GOODS.rum.name` „Rum" (Grund „Zu wenig {Name}").
- `src/sim/build.ts:52` `demolish` — nicht in T07 (T08).

**Erwartete Dateien:** `src/sim/defs/levels.ts` (Füllung, 9 Einträge), neu `src/sim/upgrade.ts`, neu
`tests/sim/upgrade.test.ts`. Doku: keine Datei in diesem Strang (arc42-Bausteine schreibt T09, damit P2 ∥ P3
konfliktfrei bleibt); Befunde in den Bericht, nicht nach `docs/beobachtungen.md` (T09 trägt ein).

**Nicht anfassen:** `src/sim/types.ts`, `save.ts`, `levels.ts`, `flow.ts`, `economy.ts`, `production.ts`, `placement.ts`,
`build.ts` (T08), `src/sim/unlocks.ts` (T08), `src/sim/defs/unlocks.ts`, `defs/buildings.ts`, `src/ui/`, `src/render/`,
`tests/sim/defs.test.ts`, `tests/sim/unlocks.test.ts`, `tests/sim/helpers.ts`, `tests/sim/scenarios.ts`, `docs/` (Strang P2
besitzt diese Testdateien und `docs/arc42.md` in Welle W4).

- [ ] **Schritt 1: Tests** — `tests/sim/upgrade.test.ts` (neu). Lokale Helfer (nicht in `helpers.ts`):

```ts
/** Angebundener Fischer, direkt eingefügt (Muster production.test.ts:15); Kachel trägt die Id für demolish. */
function fisherAt(w: World, x = 0, y = 0): Building {
  const b: Building = {
    id: w.nextBuildingId++,
    defId: 'fisher',
    x,
    y,
    connected: true,
    progress: 0,
    state: 'ok',
  };
  w.buildings[b.id] = b;
  w.tiles[idx(w, x, y)]!.buildingId = b.id;
  return b;
}
const world = (): World => {
  const w = createWorld(3);
  w.unlocked = ['U0', 'U2', 'U3']; // U3 frei, U5 nicht
  w.money = 1000;
  w.stock.cloth = 2;
  w.stock.rum = 0;
  return w;
};
```

`describe('M11 Ausbau-Werte (Anhang 01 A.4)')`:

```ts
it('LEVELS: neun heutige Betriebe, Werte Anhang 01 A.4, ganzzahlig, Stufe 3 schneller als 2 (Vorstufe AK-P3-01)', () => {
  const T = (
    cycle: number,
    upkeep: number,
    m: number,
    h: number,
    wz: number,
    s: number,
    good: GoodId,
    amount: number,
  ) => ({ cycle, upkeep, cost: { money: m, wood: h, tools: wz, stone: s }, fee: { good, amount } });
  const want: Record<string, [LevelDef, LevelDef]> = {
    fisher: [T(24, 7, 50, 3, 1, 0, 'cloth', 2), T(16, 9, 75, 4, 2, 0, 'rum', 2)],
    lumberjack: [T(18, 7, 25, 0, 1, 0, 'cloth', 2), T(12, 9, 38, 0, 1, 0, 'rum', 2)],
    quarry: [T(36, 13, 75, 5, 2, 0, 'cloth', 2), T(24, 17, 113, 8, 3, 0, 'rum', 2)],
    sheepfarm: [T(30, 13, 75, 5, 1, 0, 'cloth', 3), T(20, 17, 113, 8, 2, 0, 'rum', 3)],
    canefarm: [T(30, 13, 75, 5, 1, 0, 'cloth', 3), T(20, 17, 113, 8, 2, 0, 'rum', 3)],
    weaver: [T(30, 20, 100, 8, 2, 0, 'cloth', 3), T(20, 26, 150, 12, 3, 0, 'rum', 3)],
    toolmaker: [T(48, 33, 100, 8, 2, 0, 'cloth', 3), T(32, 43, 150, 12, 3, 0, 'rum', 3)],
    distillery: [T(30, 26, 125, 8, 2, 3, 'cloth', 3), T(20, 34, 188, 12, 3, 4, 'rum', 3)],
    glassworks: [T(30, 33, 150, 10, 3, 5, 'cloth', 3), T(20, 43, 225, 15, 5, 8, 'rum', 3)],
  };
  for (const [id, lv] of Object.entries(want)) expect(LEVELS[id as BuildingDefId], id).toEqual(lv);
  for (const lv of Object.values(LEVELS)) {
    expect(lv![1].cycle).toBeLessThan(lv![0].cycle);
    for (const n of [lv![0].cycle, lv![0].upkeep, lv![1].cycle, lv![1].upkeep])
      expect(Number.isInteger(n)).toBe(true);
  }
});
```

Der Name trägt bewusst **keine** AK-ID (Abdeckungs-Grep zählt AK-P3-01 erst mit T09).

`describe('M11 Ausbau (Spec 3.6)')` — Testfälle siehe [T07b-ausbau-kern.md](T07b-ausbau-kern.md), Schritt 1 (Fortsetzung).
