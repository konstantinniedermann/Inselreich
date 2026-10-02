> **Task-ID:** Task 8 (Paket M10-U3) — Teil 1 von 2
> **AK-IDs:** AK-U3-01, -02, -03, -06 (Vitest); AK-U3-04, -05 in QA-U3
> **blocked-by:** Task 7 (Review OK)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md)
> **Teile:** **T08a-mouse-over.md** (diese) · [T08b-mouse-over.md](T08b-mouse-over.md)

## Task 8: U3 — Mouse-over

**Paket** M10-U3 · **Implementierer** `tech-ui-engineer` (sonnet) · **Worktree/Branch** `.worktrees/m10-ui` ·
`feat/m10-ui` · **blocked-by** Task 7 (Review OK) · **AK** AK-U3-01, -02, -03, -06 (Vitest); AK-U3-04, -05 in QA-U3

**Files:**

- Create: `src/ui/hover.ts`, `tests/ui/hover.test.ts`
- Modify: `src/ui/input.ts`, `src/ui/app.ts`, `src/style.css`, `src/render/renderer.ts` (nur Export `wildlifeEnvOf`
  und dessen Nutzung im Renderer, P4), `src/render/life.ts` (nur ein Kommentar am Küstenfeld-Cache `coastFor`: „gültig,
  solange Geländewechsel nur Wald ↔ Weide betreffen (Spec M10 7); andere Geländeänderungen müssen diesen Cache neu
  bewerten" — AK-R1-05, R164 B5; Task 8 läuft nach H-R4 auf `main`)
- Test: `tests/ui/hover.test.ts`, `tests/render/renderer.test.ts` (nur neues `it`)

**Interfaces:**

- Consumes: `upgradeStatus`, `houseDiagnosis`, `missingInputs`, `serviceAvailable`, `protectedCount`
  (`inspect.ts`), `effectiveTaxLevel`, `functionLock`, `buildingShown`, `isSupplied`/`inSupplyRange`,
  `CLEAR_FOREST_COST`, `PLANT_FOREST_COST`, `wildlifeAt`, `friendlyReason`, `orderCardText`-Format.
- Produces:

```ts
export interface HoverInfo {
  title: string;
  lines: string[];
} // lines.length ≤ 3
export function hoverInfo(
  world: World,
  tile: { x: number; y: number },
  timeMs: number,
  extra: { ship: boolean; animal: string | null },
): HoverInfo | null;
export interface HoverState {
  restMs: number;
  sameTile: boolean;
  dragging: boolean;
  modalOpen: boolean;
  tool: Tool;
}
export function hoverVisible(s: HoverState): boolean; // restMs ≥ 400 && sameTile && !dragging && !modalOpen && tool.kind === 'select'
export function hoverPosition(
  pointer: { x: number; y: number },
  card: { w: number; h: number },
  view: { w: number; h: number },
): { x: number; y: number }; // bleibt im Fenster
// src/render/renderer.ts
export function wildlifeEnvOf(world: World, fx: RenderFx): WildlifeEnv; // { phase: lightAt(world.tick).phase, weather: pickWeather(fx.weather, null).kind, reduce: fx.reduceMotion === true }
```

- [ ] **Schritt 1: Failing tests** (`tests/ui/hover.test.ts`, neu; Welten aus `tests/sim/helpers.ts`):

```ts
describe('M10 Mouse-over (Spec 13)', () => {
  const none = { ship: false, animal: null };
  it('AK-U3-01 Wohnhaus: Titel je Stufe, Einwohner, erste Diagnose oder zufrieden, Aufstieg', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const h = houses[0]!;
    setHouse(h, 2, 6);
    h.house!.supplied = true;
    h.house!.satisfied = { food: true, cloth: false };
    const a = hoverInfo(w, h, 0, none)!;
    expect(a.title).toBe('Siedlerhaus');
    expect(a.lines).toEqual([
      'Einwohner 6 / 8',
      'Stoff fehlt',
      `Aufstieg: ${friendlyReason(w, 'Haus nicht voll belegt')}`,
    ]);
    const { w: w2, houses: h2 } = village(1, { unlockAll: true });
    readyPioneer(w2, h2[0]!); // volles, versorgtes, bereites Pionierhaus (Helfer wie AK-S2-09)
    const b = hoverInfo(w2, h2[0]!, 0, none)!;
    expect(b.lines[1]).toBe('zufrieden');
    expect(b.lines[2]).toBe('Aufstieg bereit');
  });
  /** Gebäude roh einsetzen (ohne Standortregel): Mouse-over liest nur Zustand und Welt. */
  function raw(
    w: World,
    defId: BuildingDefId,
    x: number,
    y: number,
    state: BuildingState = 'ok',
  ): Building {
    const id = w.nextBuildingId++;
    const d = BUILDING_DEFS[defId];
    const b: Building = { id, defId, x, y, connected: true, progress: 0, state };
    w.buildings[id] = b;
    for (let dy = 0; dy < d.h; dy++)
      for (let dx = 0; dx < d.w; dx++) {
        forceGrass(w, x + dx, y + dy);
        w.tiles[idx(w, x + dx, y + dy)]!.buildingId = id;
      }
    return b;
  }
  it('AK-U3-02 Betrieb, Dienst, Amtsstube: Zustandszeilen wörtlich (10 Fälle)', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    const p = (dx: number, dy: number): [number, number] => [k.x + dx, k.y + dy];
    const first = (b: Building): string => hoverInfo(w, b, 0, none)!.lines[0]!;
    forceRect(w, k.x + 2, k.y + 4, 6, 5, 'grass'); // Holzfäller ohne Wald im Radius 2
    const lj = raw(w, 'lumberjack', ...p(4, 6));
    expect(first(raw(w, 'fisher', ...p(4, -6)))).toBe('arbeitet — 15 Nahrung / min');
    expect(first(raw(w, 'weaver', ...p(6, -6), 'waitingInput'))).toBe('wartet auf Wolle'); // Wolle 0 im Startlager
    expect(first(raw(w, 'weaver', ...p(8, -6), 'storageFull'))).toBe('Lager voll');
    expect(first(raw(w, 'toolmaker', ...p(10, -6), 'noService'))).toBe(
      'braucht eine Schule in Reichweite',
    );
    const burning = raw(w, 'weaver', ...p(12, -6), 'burning');
    burning.outageUntil = 500;
    expect(first(burning)).toBe('brennt');
    const unc = raw(w, 'weaver', ...p(14, -6), 'notConnected');
    unc.connected = false;
    expect(first(unc)).toBe('nicht angebunden');
    expect(hoverInfo(w, lj, 0, none)!.lines).toContain('kein Wald mehr in der Nähe');
    const chapel = raw(w, 'chapel', ...p(4, 10));
    for (const dx of [6, 7, 8]) raw(w, 'house', ...p(dx, 10)).house = newHouseState(w);
    expect(first(chapel)).toBe('versorgt 3 Häuser');
    const fs = raw(w, 'firestation', ...p(10, 10));
    expect(first(fs)).toBe(`schützt ${protectedCount(w, fs)} Gebäude`);
    expect(hoverInfo(w, raw(w, 'townhall', ...p(14, 10)), 0, none)!.lines).toEqual([
      'Steuer: normal',
      'Sperren: 0',
      'Klicken zum Einstellen',
    ]);
  });
});
```

(Importe: `BUILDING_DEFS`, `newHouseState` aus `src/sim/population`, `protectedCount` aus `src/ui/inspect`, `idx`,
`forceGrass`, `forceRect`. Weicht eine Rate ab — z. B. Fischer-Zyklus nicht 40 —, gilt der Text aus `defs`, die
Abweichung wird gemeldet.)

```ts
  it('AK-U3-03 Gelände, Schiff, Tier', () => {
    const w = createWorld(3);
    const k = w.buildings[w.kontorId]!;
    forceRect(w, k.x + 6, k.y + 2, 1, 1, 'forest');
    forceRect(w, k.x + 7, k.y + 2, 1, 1, 'grass');
    const wald = { x: k.x + 6, y: k.y + 2 };
    const weide = { x: k.x + 7, y: k.y + 2 };
    expect(hoverInfo(w, wald, 0, none)).toEqual({ title: 'Wald', lines: ['Gut für Holzfäller'] });
    expect(hoverInfo(w, weide, 0, none)).toEqual({ title: 'Weide', lines: ['Gut für Wohnhaus'] });
    w.unlocked = ['U0', 'U2'];
    expect(hoverInfo(w, wald, 0, none)!.lines).toEqual(['Gut für Holzfäller', 'Roden: 10 Geld']);
    expect(hoverInfo(w, weide, 0, none)!.lines).toEqual(['Gut für Wohnhaus, Schäferei', 'Aufforsten: 20 Geld']);
    const far = { x: k.x + 20, y: k.y };
    forceRect(w, far.x, far.y, 1, 1, 'grass');
    expect(hoverInfo(w, far, 0, none)!.lines.at(-1)).toBe('Ausserhalb der Versorgung');
    const m = mountainTile(w); // erste Gebirgskachel der Karte
    expect(hoverInfo(w, m, 0, none)!.lines[0]).toBe('Gut für Steinbruch daneben');
    expect(hoverInfo(w, { x: 0, y: 0 }, 0, { ship: true, animal: null })).toEqual({ title: 'Händlerschiff', lines: ['Kauft und verkauft am Kontor'] });
    w.unlocked = ['U0', 'U2', 'U3'];
    w.order = orderFixture(w);
    expect(hoverInfo(w, { x: 0, y: 0 }, 0, { ship: true, animal: null })!.lines[1]).toMatch(/^Auftrag: \d+ .+, noch /);
    expect(hoverInfo(w, k, 0, { ship: false, animal: 'Wal' })).toEqual({ title: 'Wal', lines: [] });
    for (const t of [wald, weide, far, m, k]) {
      const i = hoverInfo(w, t, 0, none);
      expect(i === null || i.lines.length <= 3).toBe(true);
      expect(JSON.stringify(i)).not.toMatch(/Tick/);
    }
  });
  it('AK-U3-06 Tiere: ohne Abfrage-Treffer bricht nichts; gleiche env wie der Renderer (Regen, reduziert)', () => {
    const w = createWorld(3);
    const range = { x0: 0, y0: 0, x1: w.width - 1, y1: w.height - 1 };
    for (const fx of [{ timeMs: 5000 }, { timeMs: 5000, weather: rainWeather(), reduceMotion: true }] as RenderFx[]) {
      const env = wildlifeEnvOf(w, fx);
      expect(env).toEqual({ phase: lightAt(w.tick).phase, weather: pickWeather(fx.weather, null).kind, reduce: fx.reduceMotion === true });
      expect(wildlifeAt(w, range, fx.timeMs, env)).toEqual(wildlifeAt(w, range, fx.timeMs, wildlifeEnvOf(w, fx)));
    }
    expect(hoverInfo(w, { x: 0, y: 0 }, 0, { ship: false, animal: null })).not.toBeNull();
  });
  it('AK-U3-04 (Vitest-Teil) hoverVisible und hoverPosition', () => {
    const base: HoverState = { restMs: 400, sameTile: true, dragging: false, modalOpen: false, tool: { kind: 'select' } };
    expect(hoverVisible(base)).toBe(true);
    expect(hoverVisible({ ...base, restMs: 399 })).toBe(false);
    for (const k of [{ sameTile: false }, { dragging: true }, { modalOpen: true }, { tool: { kind: 'road' } as Tool }])
      expect(hoverVisible({ ...base, ...k })).toBe(false);
    const p = hoverPosition({ x: 1270, y: 790 }, { w: 220, h: 90 }, { w: 1280, h: 800 });
    expect(p.x + 220).toBeLessThanOrEqual(1280);
    expect(p.y + 90).toBeLessThanOrEqual(800);
  });
});
```

(`rainWeather()` baut ein `Weather` mit Regen wie in `tests/render/weather.test.ts`; `mountainTile`, `orderFixture`,
`readyPioneer` sind lokale Helfer. Die Gelände-Zeile „Gut für …" nennt nur **angezeigte** Gebäude
(`buildingShown`), Spec 13.2.)
