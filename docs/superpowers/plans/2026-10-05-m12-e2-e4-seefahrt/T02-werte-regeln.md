> **Task-ID:** T02 · **AK-IDs:** AK-E2-09, AK-E3-01 (Teil `spicefarm`), AK-E3-02 (Platzregel), AK-Z3-01;
> Pin M8:AK-S1-01 (U6-Zeile `unlocks.test.ts`, R230 B1)
> **blocked-by:** T01 · **Strang:** int, `.worktrees/m12-see` · `tech-sim-engineer` (sonnet)
> **Regeln:** Spec Anhang 03 A (alle Zeilen ausser `TIERS[4]`), C.2, C.9; Anhang 05 C; Index P-6, P-10

## T02: Werte, neue Bauregeln, gemeinsame Testwelt

**Ziel:** Alle neuen Spielwerte stehen in `src/sim/defs/`, die zwei neuen Platzregeln wirken in `canPlace`, und
alle Stränge haben dieselbe Testwelt. `TIERS[4]` bleibt unverändert (Bruch nur in T05). Baseline bitgleich.

**Code-Fakten:** `defs/buildings.ts` `BUILDING_DEFS` (Muster `sugarfarm`/Zuckerrohr und `kontor`); `types.ts`
`BuildingDefId`, `SiteRule`, `UnlockFunction`; `placement.ts` `siteRuleOk(…, island)`, `canPlace(…, island = HOME)`;
`defs/unlocks.ts` `UNLOCKS` (U6), `FUNCTION_LABELS`; `defs/sea.ts` (E1: `ISLANDS`, `traits`, `HOME_NAME`);
`render/sprites.ts` `SILHOUETTES` (Partial), `ui/hotkeys.ts` `categoryOf`.

**Dateien:** `src/sim/types.ts`, `defs/buildings.ts`, `defs/unlocks.ts`, `defs/sea.ts`, `defs/tiers.ts` (nur
`WIN_SPICE_*`), `world.ts` (`isKontor`), `islands.ts` (`islandName`), `placement.ts` (nur zwei Regel-Fälle);
neu `tests/sim/seaHelpers.ts`; `tests/sim/defs.test.ts`, `unlocks.test.ts`, `placement.test.ts`; Platzhalter-Einträge
in erschöpfenden UI-/Render-Tabellen, falls `tsc` sie verlangt (keine Logik).

## Werte (verbindlich, Anhang 03 A / 05 C)

```ts
// defs/buildings.ts — Felder wie bestehende Einträge
kontor2: { name: 'Kontor', w: 2, h: 2, cost: { money: 800, wood: 20, tools: 8, stone: 10 }, upkeep: 10,
  supplyRadius: 8, site: [{ kind: 'coast' /* wie kontor */ }, { kind: 'foreignNoKontor' }] },
spicefarm: { name: 'Gewürzplantage', w: 2, h: 2, cost: { money: 200, wood: 12, tools: 3, stone: 0 }, cycle: 50,
  upkeep: 15, produces: 'spice', flammable: true, stormAffected: true,
  site: [{ kind: 'radius', terrain: 'grass', radius: 2, min: 4 /* wie sugarfarm */ },
         { kind: 'islandTrait', trait: 'spice' }] },
// defs/sea.ts — T01 hat SHIP_MAX = 4 und SHIP = { capacity: 50 } angelegt; T02 ergänzt SHIP zu:
export const SHIP = { cost: { money: 1200, wood: 25, tools: 10, stone: 0 }, upkeep: 15, capacity: 50 } as const;
export const ROUTE_GOODS_PER_DIRECTION = 2;
export const ROUTE_RESERVE = { default: 10, step: 10, max: 90 } as const;
// defs/tiers.ts
export const WIN_SPICE_MERCHANTS = 80;
export const WIN_SPICE_HOLD = 600;
// defs/unlocks.ts — U6: buildings + 'kontor2', 'spicefarm'; goods + 'spice'; functions + 'seafaring';
// tip + ' Kaufleute brauchen Gewürz von einer fernen Insel: gründe dort ein Kontor.'
// FUNCTION_LABELS.seafaring = ['Seefahrt', 'Handelsschiff']
```

Feldnamen (`cost`-Schlüssel, `site`-Form, `cycle`) exakt wie in den bestehenden Einträgen übernehmen; die Werte oben
sind verbindlich. `kontor2.site` übernimmt die Küstenregel von `kontor` wörtlich.

## Regeln

- `types.ts`: `BuildingDefId` + `'kontor2' | 'spicefarm'`; `SiteRule` + `{ kind: 'islandTrait'; trait: IslandTrait }`
  und `{ kind: 'foreignNoKontor' }`; `UnlockFunction` + `'seafaring'`.
- `placement.ts` `siteRuleOk` (zwei neue Fälle, sonst nichts):
  - `islandTrait`: `island ≥ 1` und `ISLANDS[island − 1].traits` enthält `trait` (über `world.islands[island].kind`
    gesucht), sonst Grund **„Hier wächst kein Gewürz"** (für `spice`).
  - `foreignNoKontor`: `island === HOME` → **„Nur auf einer fernen Insel"**; `islands[island].kontorId !== null` →
    **„Auf dieser Insel steht schon ein Kontor"**.
- `world.ts`: `isKontor(defId) = defId === 'kontor' || defId === 'kontor2'` (P-6; Verwendung ab T03).
- `islands.ts`: `islandName(world, i)` = `HOME_NAME` für 0, sonst Name aus `ISLANDS` nach `kind`.
- `src/ui/hotkeys.ts` (nur zwei Konstanten, damit T07 und T12 dieselbe Quelle lesen):
  `export const ISLAND_HOME_KEY = '0'; export const ISLAND_CYCLE_KEY = '9';`
- **Testwelt** `tests/sim/seaHelpers.ts` (P-10, nur Tests):
  - `seaWorld(seed = SEED_D37)`: `createWorld(seed, { unlockAll: true })`.
  - `foundKontor2Literal(w, island)`: legt `kontor2` am `kontorSite` aus `generateForeignIslands(w.seed, home)` als
    Literal an (Kacheln belegt, `islands[island].kontorId`, `recomputeConnectivity`), ohne Kosten — bis T03 der
    einzige Weg; Schlüsselreihenfolge wie `placeBuilding`.
  - `shipLiteral(w, part: Partial<Ship>)`: hängt ein Schiff an (`id = nextShipId++`, Standard `port 0`, `to null`,
    `left 0`, `cargo {}`, `route null`, `homing false`).
  - `plantationSites(w, island)`: Plätze aus `generateForeignIslands` (für T05, T06).

## Schritte

- [ ] **1 Tests zuerst:**
  - `defs.test.ts` **AK-E3-01 (Teil)** `spicefarm` Kosten 200/12/3/0, Takt 50, Unterhalt 15, `produces spice`,
    `flammable`, `stormAffected`; `kontor2` 800/20/8/10, Unterhalt 10, `supplyRadius 8`; `SHIP`, `SHIP_MAX 4`,
    `ROUTE_*`. **AK-Z3-01** `WIN_SPICE_MERCHANTS 80`, `WIN_SPICE_HOLD 600`; `grep`-Test: in `src/sim/` ausser
    `defs/` und in `src/ui/` kein Literal `80` oder `600` in Dateien, die `wonSpice` oder `WIN_SPICE` erwähnen.
  - `unlocks.test.ts` **AK-E2-09** + Pin M8:AK-S1-01 (bewusst, R230 B1, Kommentar mit Ruling): U6 bringt `kontor2`,
    `spicefarm`, `spice`, `seafaring`; `unlocked` nach U6 gleich `UNLOCK_IDS`; `deriveUnlocks` auf `save-v7.json` und
    `save-v8.json` gleich wie vor T02 (Wert im Test aus `UNLOCK_IDS`-Präfix, nicht neu gemessen).
  - `placement.test.ts` **AK-E3-02 (Platz)**: `spicefarm` auf Heimat und auf einer Insel ohne `spice` (Testinsel:
    `kind` per Literal auf eine Kopie ohne Merkmal gestellt) → „Hier wächst kein Gewürz"; auf A und B an
    `plantationSites` → kein Grund aus `islandTrait` (Kontor per `foundKontor2Literal`). `kontor2` auf Heimat →
    „Nur auf einer fernen Insel"; zweites `kontor2` auf B → „Auf dieser Insel steht schon ein Kontor".
  - E1-Übergabe (P-3 E1): je Seed 1 … 50 `canPlace(w, 'kontor2', kontorSite, island)` auf A und B ohne Grund aus den
    Platzregeln (Kosten-/Freischalt-Gründe ausgeblendet: `unlockAll`, Geld/Waren per Literal gesetzt).
- [ ] **2 Rot-Beleg** → Commit `test: M12 Seefahrt Werte und Bauregeln (rot)`.
- [ ] **3 Umsetzung**; `tsc` zeigt erschöpfende Tabellen → Platzhalter (Silhouette `kontor2` = `kontor`,
      `spicefarm` = Zuckerrohr-Form; Kategorie wie Kontor bzw. Zuckerrohr; keine Taste).
- [ ] **4 Prüfen:** Bitgleich (AK-M12-B1…B4, `balance-merchants [6750, 11200, 320]`), `make check`,
      `CI=true make check` → Commit `feat: M12 Seefahrt Werte, Bauregeln, Testwelt`.

**Review-Fokus:** Werte exakt Anhang 03 A / 05 C; `TIERS[4]` unverändert; nur zwei neue `siteRuleOk`-Fälle; Pin
M8:AK-S1-01 mit Ruling-Bezug geändert, kein Test gelöscht; Helfer schreiben keine Saves.
