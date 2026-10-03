> **Task-ID:** T04 (Paket M11-P2A) — Teil 1 von 2
> **AK-IDs:** AK-P2S2-01, -02, -03, -04, -05; AK-UNL-01, -02, -05
> **blocked-by:** T03 (Review OK)
> **Strang:** `feat/m11-sources` · Worktree `.worktrees/m11-sources` (ab `<T03-SHA>`) · Implementierer `tech-sim-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-06](orga-06-schnittstellen.md) · [orga-07](orga-07-datei-ownership.md) · [orga-12](orga-12-geaenderte-tests.md)
> **Teile:** **T04a-quellen.md** (diese) · [T04b-quellen.md](T04b-quellen.md)

## T04: Jagdhütte, Rinderfarm, Regelfeld `free`

**Ziel:** Zwei neue Nahrungsquellen (Spec 3.3, Anhang 01 A.3) mit dem Regelfeld `free` an `SiteRule` `radius`; die
Standortprüfung heisst `siteRuleOk` und ist exportiert (Anhang 01 C), damit T05 sie live nutzt. U2/U3 schalten die
Gebäude frei (Spec 4, Anhang 01 A.5). Der Holzfäller bleibt in T04 **ohne** `free` (das ist T05).

**Code-Fakten (Ist M10, nach T01–T03 unverändert an diesen Stellen):**

- `src/sim/types.ts:4-21` `BuildingDefId` (endet mit `'townhall'`); `SiteRule.radius` hat nach T01 schon `free?: true`.
- `src/sim/defs/buildings.ts:10` `BUILDING_DEFS` (einziger `Record<BuildingDefId, …>` im Repo, per grep geprüft; alle
  anderen Tabellen sind `Partial` oder abgeleitet: `SILHOUETTES`, `BODY_HEIGHTS`, `CHIMNEY_SPOTS`, `WINDOWS`,
  `ONLY_WITH_CRISES`, `BUILD_SOUND_OF` als `Record<string, …>` mit Rückfall). `tsc` bleibt grün (Probe gemessen).
- `src/sim/placement.ts:27-29` `radiusReason(terrain)`; `:31-59` `checkRule(world, rule, defId, x, y)` (privat);
  `:20-21` `countTerrain`; Aufruf `:80`. `footprint` aus `src/sim/world.ts:29`.
- `src/sim/defs/unlocks.ts:32` U2 `buildings: ['quarry', 'sheepfarm', 'weaver', 'chapel', 'firestation']`, `:43` U3
  `buildings: ['townhall']`; `tip` je Eintrag (T01 hat an U3/U5 schon die P1-Sätze angehängt).
- `src/ui/goal.ts:97-98` `withKey(id)` schreibt `(${hotkeyLabel(…)})` auch bei `null` → „Jagdhütte (null)" in der
  Freischalt-Meldung (Probe). Rinderfarm bleibt ohne Taste (Spec 13-10), die Jagdhütte bis T12.

**Erwartete Dateien:**

- `src/sim/types.ts` (nur `BuildingDefId` + `'hunter' | 'cattlefarm'` am Ende), `src/sim/defs/buildings.ts`,
  `src/sim/placement.ts`, `src/sim/defs/unlocks.ts`
- **Minimal-Eingriff UI (benannt):** `src/ui/goal.ts` `withKey`: ohne Taste nur der Name (eine Zeile, siehe T04b).
- Neu: `tests/sim/sources.test.ts`. Geändert: `tests/sim/defs.test.ts`, `tests/sim/placement.test.ts`,
  `tests/sim/unlocks.test.ts`, `tests/sim/fire.test.ts`, `tests/sim/glassworks.test.ts`, `tests/sim/storm.test.ts`,
  `tests/sim/townhall.test.ts`, `tests/sim/scenarios.ts` (`galerie`), `tests/audio/buildSounds.test.ts`,
  `tests/render/sprites.test.ts`, `tests/ui/goal.test.ts`, `tests/ui/startCard.test.ts`, `tests/ui/tooltip.test.ts`
- Doku: `docs/arc42.md` (Zeile Baustein `placement.ts`: „`siteRuleOk` exportiert; Regelfeld `free`").

**Nicht anfassen:** `src/sim/production.ts`, `save.ts`, `levels.ts`, `upgrade.ts`, `build.ts`, `src/sim/unlocks.ts`,
`src/render/`, `src/audio/`, `src/ui/` ausser `goal.ts`, `tests/sim/controller.ts`, `tests/sim/helpers.ts`,
`tests/sim/upgrade.test.ts` (Strang P3). `defs/levels.ts` bekommt **keine** Einträge (T09).

- [ ] **Schritt 1: Tests schreiben** (je AK ein `it`, Namen beginnen mit der AK-ID).

`tests/sim/defs.test.ts`, neuer Block `describe('M11 Jagdhütte und Rinderfarm (Spec 3.3)')`:

```ts
it('AK-P2S2-01 Felder wie Spec 3.3, Reihenfolge nach fisher, Geld je Einwohner, Nahrungspreis', () => {
  expect(BUILDING_DEFS.hunter).toEqual({
    id: 'hunter',
    name: 'Jagdhütte',
    w: 1,
    h: 1,
    cost: { money: 50, wood: 2, tools: 1, stone: 0 },
    upkeep: 5,
    category: 'production',
    flammable: true,
    produces: 'food',
    cycle: 50,
    site: [{ kind: 'radius', terrain: 'forest', radius: 3, min: 10, free: true }],
  });
  expect(BUILDING_DEFS.cattlefarm).toEqual({
    id: 'cattlefarm',
    name: 'Rinderfarm',
    w: 2,
    h: 2,
    cost: { money: 250, wood: 15, tools: 3, stone: 0 },
    upkeep: 10,
    category: 'production',
    flammable: true,
    stormAffected: true,
    produces: 'food',
    cycle: 20,
    site: [{ kind: 'radius', terrain: 'grass', radius: 3, min: 16, free: true }],
  });
  expect(BUILDING_IDS.slice(3, 6)).toEqual(['fisher', 'hunter', 'cattlefarm']);
  const perEw = (id: 'fisher' | 'hunter' | 'cattlefarm') => {
    const d = BUILDING_DEFS[id];
    const ew = 100 / d.cycle! / 0.5; // Einwohner je Bau (Anhang 01 A.3)
    return d.cost.money / ew + (d.upkeep * 60) / ew;
  };
  const v = [perEw('fisher'), perEw('hunter'), perEw('cattlefarm')];
  expect(v).toEqual([80, 87.5, 85]);
  expect(Math.max(...v)).toBeLessThanOrEqual(1.1 * Math.min(...v));
  // Unterhalt je Nahrung: 2,0 / 2,5 / 2,0 (Spec-Widerspruch zu „sell <", siehe Risiken T04b): Werte pinnen
  const per = (id: 'fisher' | 'hunter' | 'cattlefarm') =>
    BUILDING_DEFS[id].upkeep / (100 / BUILDING_DEFS[id].cycle!);
  expect([per('fisher'), per('hunter'), per('cattlefarm')]).toEqual([2, 2.5, 2]);
  expect(GOODS.food.sell).toBe(3);
});
```

`tests/sim/placement.test.ts`, neuer Block `describe('M11 Regelfeld free (Spec 3.3)')` mit lokalem Helfer
`hunterSite(w)`: Kontor `k`; `forceRect(w, k.x + 3, k.y - 4, 7, 7, 'grass')`, dann Wald `forceRect(w, k.x + 4, k.y - 3, 5, 2, 'forest')` (= genau 10 Kacheln im Radius 3 um die Mitte von `(k.x + 6, k.y - 1)`; Rechnung: Reihen dy −1 und −2 je dx −2…+2);
Wege `(k.x + 2 … k.x + 6, k.y)`; liefert `{ x: k.x + 6, y: k.y - 1 }`. Welt `createWorld(3, { unlockAll: true })`, Geld 10 000.
Der Test zählt die Vorbedingung selbst (`freeForest(w, x, y) === 10` über `tilesInRadius`, Gelände, `buildingId`, `road`).

```ts
it('AK-P2S2-02 Jagdhütte: genau 10 freie Waldkacheln ok; Weg, Gebäude oder eigener Grundriss zählen nicht', () => {
  const reason = { ok: false, reason: 'Zu wenig freier Wald in der Nähe' };
  const a = hunterSite(w0()); // je Fall eine frische Welt
  expect(canPlace(a.w, 'hunter', a.x, a.y)).toEqual(ok);
  const b = hunterSite(w0());
  expect(placeRoad(b.w, b.x - 2, b.y - 1).ok).toBe(true);
  expect(canPlace(b.w, 'hunter', b.x, b.y)).toEqual(reason);
  const c = hunterSite(w0());
  expect(placeBuilding(c.w, 'house', c.x - 2, c.y - 1).ok).toBe(true);
  expect(canPlace(c.w, 'hunter', c.x, c.y)).toEqual(reason);
  const d = hunterSite(w0());
  d.w.tiles[idx(d.w, d.x - 2, d.y - 1)]!.terrain = 'grass'; // 9 frei …
  d.w.tiles[idx(d.w, d.x, d.y)]!.terrain = 'forest'; // … plus Wald unter dem eigenen Grundriss
  expect(canPlace(d.w, 'hunter', d.x, d.y)).toEqual(reason);
});
```

`tests/sim/sources.test.ts` (neu), `describe('M11 Jagdhütte und Rinderfarm (Spec 3.3)')`. Rinderfarm-Platz (lokaler Helfer
`farmSite(w)`): Gebiet `forceRect(w, k.x + 3, k.y - 8, 8, 8, 'forest')`; Weg `(k.x+2,k.y) (k.x+3,k.y) (k.x+4,k.y)` und Spalte
`(k.x+4, k.y-1 … k.y-4)`; Grundriss `(k.x+5, k.y-5)` 2×2 auf Gras; dann genau 16 freie Scheibenkacheln (Radius 3 um
`(k.x+6, k.y-4)`, ohne Grundriss, ohne Weg) auf Gras setzen: zuerst den Schäferei-Grundriss `(k.x+7 … k.x+8, k.y-4 … k.y-3)`,
dann die ersten 12 übrigen in `tilesInRadius`-Reihenfolge. Vorbedingung im Test zählen (`=== 16`).

```ts
it('AK-P2S2-03 Rinderfarm mit 16 freien Graskacheln; spätere Schäferei auf 4 davon sperrt eine zweite Farm, die stehende läuft', () => {
  const { w, x, y } = farmSite(createWorld(3, { unlockAll: true }));
  const farm = placeBuilding(w, 'cattlefarm', x, y);
  expect(farm.ok).toBe(true);
  expect(placeBuilding(w, 'sheepfarm', x + 2, y + 1).ok).toBe(true); // Grundriss (k.x+7, k.y-4)
  const twin = deserialize(serialize(w));
  if (!twin.ok) throw new Error(twin.reason);
  expect(demolish(twin.world, farm.id!).ok).toBe(true);
  expect(canPlace(twin.world, 'cattlefarm', x, y)).toEqual({
    ok: false,
    reason: 'Zu wenig freie Weide in der Nähe',
  });
  const food = w.stock.food;
  for (let i = 0; i < 20; i++) step(w);
  expect([w.stock.food - food, w.buildings[farm.id!]!.state]).toEqual([1, 'ok']);
});
it('AK-P2S2-04 Ausstoss: Jagdhütte 1 je 50, Rinderfarm 1 je 20; Sturm: Rinderfarm 1 je 40, Jagdhütte 1 je 50', () => {
  // beide auf ihren Plätzen gebaut und angebunden (je eine Welt), Nahrung 0, keine Häuser
  // 100 Schritte: hunter +2, cattlefarm +5; danach w.crisis = { period: 0, kind: 'storm', from: w.tick + 1,
  // until: w.tick + 1000 }: 200 Schritte hunter +4, cattlefarm +5
});
it('AK-P2S2-05 Regeln ohne free zählen wie heute: Schäferei mit Weg auf einer ihrer 4 Weidekacheln bleibt baubar', () => {
  // Wald-Gebiet, genau 4 Gras im Radius 2 der Schäferei-Mitte, eine davon trägt einen Weg → canPlace ok;
  // eine Graskachel weniger → 'Zu wenig Weide in der Nähe' (alter Text ohne „freie")
});
```

AK-UNL-01, -02, -05: siehe [T04b-quellen.md](T04b-quellen.md), Schritt 1 (Fortsetzung).

Helfer `farmSite`/`hunterSite` bleiben lokal in der jeweiligen Testdatei (kein Eintrag in `helpers.ts`, P3 ∥).
Weiter: [T04b-quellen.md](T04b-quellen.md).
