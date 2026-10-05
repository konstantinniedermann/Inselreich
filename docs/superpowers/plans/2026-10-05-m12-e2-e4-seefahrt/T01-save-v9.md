> **Task-ID:** T01 · **AK-IDs:** AK-E3-06, AK-E3-07, AK-Z3-09, AK-M12-B2 (Fold-back), AK-M12-B5; Auflage B4;
> lead-qa R230 (Übergangsbestand über die Kette ab v7)
> **blocked-by:** T00 · **Strang:** int, `.worktrees/m12-see` · `tech-sim-engineer` (sonnet)
> **Regeln:** Spec Anhang 03 A (`spice`, `SPICE_GRACE_PER_HOUSE`), B (v9, Ladeprüfung v9), D (Übergang alte Stände);
> Anhang 05 E (`wonSpice`)

## T01: Save v9 — neue Felder, Gut „Gewürz", Migration v8 → v9, Ladeprüfung, Lade-Meldung

**Ziel:** Der Weltzustand hat alle v9-Felder; alte Stände laden mit Übergangsbestand und einmaliger Meldung. Noch
keine Regel nutzt Schiffe oder Gewürz. Baseline bitgleich.

**Code-Fakten:** `types.ts` `GoodId`, `World`, `Island`, `Crisis` (`tile: { x, y }`); `defs/goods.ts` `GOODS`,
`GOOD_IDS` (9, letztes `glass`), `START_STOCK`; `save.ts` `SAVE_VERSION = 8`, Kette `migrateV1ToV2` … `migrateV7ToV8`,
`isWellFormed`, `LoadResult`; `tests/sim/helpers.ts` `foldBackToV6`, `foldBackToV7`; `balance-crises.test.ts`
`normalized()`. `islands.ts` `seaLanes`, `travelTicks` (E1). `render/errands.ts` `LOAD_COLOR: Record<GoodId, string>`.

**Dateien:** `src/sim/types.ts`, `defs/goods.ts`, `world.ts`, `islands.ts`, `save.ts`, `crises.ts` (nur Literal
`island: HOME` in `beginCrisis`); erschöpfende Tabellen (`render/errands.ts`, ggf. `ui/icons.ts`, `render/overlays.ts`)
nur um `spice` ergänzt; `tests/sim/helpers.ts` (`foldBackToV8`), `save.test.ts`, `defs.test.ts`, `balance-crises.test.ts`
(nur `normalized`).

## Form (verbindlich)

```ts
// types.ts
export type GoodId = /* bisherige 9 */ 'spice';
export interface RouteGood {
  good: GoodId;
  reserve: number;
}
export interface Route {
  a: number;
  b: number;
  ab: RouteGood[];
  ba: RouteGood[];
}
export interface Ship {
  id: number;
  port: number;
  to: number | null;
  left: number;
  cargo: Partial<Record<GoodId, number>>; // nur Einträge ≥ 1, Summe ≤ SHIP.capacity
  route: Route | null;
  homing: boolean;
}
// World: …, upkeepCarry, ships: Ship[], nextShipId: number, wonSpice: boolean  (P-2, Reihenfolge verbindlich)
// Crisis.tile: { x: number; y: number; island: number }
export type LoadResult =
  { ok: true; world: World; notice?: string } | { ok: false; reason: string };
```

- `defs/goods.ts`: `GOODS.spice = { name: 'Gewürz', buy: 40, sell: 12 }` (Feldnamen wie bestehende Einträge,
  **kein** `order`); `GOOD_IDS` + `'spice'` **am Ende**; `START_STOCK.spice = 0`; `SPICE_GRACE_PER_HOUSE = 10`;
  `SPICE_GRACE_MAX = 100`.
- `islands.ts`: `laneTicks(islands: readonly LaneIsland[], a: number, b: number): number` =
  `travelTicks(lane.d)` der Lane `{min(a,b), max(a,b)}`; `a === b` → 0.
- `world.ts` `createWorld`: `ships: [], nextShipId: 1, wonSpice: false` am Ende; Lager/`sellPct` aus `GOOD_IDS`.
- `crises.ts` `beginCrisis`: gespeichertes `tile` = `{ x, y, island: HOME }` (T04 setzt echte Insel).
- `save.ts`: `SAVE_VERSION = 9`; `SPICE_GRACE_NOTICE = 'Deine Kaufleute wünschen jetzt Gewürz — kaufe es am Kontor
oder gründe ein Kontor auf einer Gewürzinsel.'`; `migrateV8ToV9(raw): number` (gibt den gelegten Bestand zurück,
  **wirft nie**): je Insel `stock.spice ??= 0`, `sellPct.spice ??= 100`, `crisis?.tile` → `island = 0`, `ships = []`,
  `nextShipId = 1`, `wonSpice = false` (auch mit `wonMerchants`), Heimat `stock.spice = min(SPICE_GRACE_MAX,
SPICE_GRACE_PER_HOUSE × Häuser mit house.tier === 4)` (gesetzt, nicht addiert), `version 9`. `deserialize`
  setzt `notice = SPICE_GRACE_NOTICE`, wenn `migrateV8ToV9` lief und > 0 lieferte.
- **B4:** `migrateV1ToV2` und `isWellFormed` ergänzen bzw. prüfen gegen das **aktuelle** `GOOD_IDS` (inkl. `spice`);
  zweimal anwenden ändert nichts (idempotent).
- **Ladeprüfung v9** (zusätzlich zu v8; sonst „Beschädigter Spielstand"): `ships` Array, Länge ≤ `SHIP_MAX` (Import
  aus `defs/sea.ts`, Wert dort ab T02 — bis dahin in T01 `SHIP_MAX = 4` und `SHIP.capacity = 50` als erste Einträge
  in `sea.ts` anlegen); je Schiff `id` Ganzzahl ≥ 1 und eindeutig, `port` gültiger Inselindex (ohne Kontor-Bedingung),
  `to` `null` oder Insel mit Kontor und `≠ port`, `left` Ganzzahl `0 … laneTicks(port, to)` (`to null` ⇒ `left 0`),
  `cargo` nur `GOOD_IDS`-Schlüssel, Ganzzahlen ≥ 1, Summe ≤ 50; `route` `null` oder `a ≠ b`, beide Inseln mit Kontor,
  `ab`/`ba` je ≤ 2, kein Gut doppelt oder in beiden Listen, `reserve ∈ {0, 10, …, 90}`; `homing` boolean,
  `homing ⇒ route null`; `nextShipId` > jede `id`; `wonSpice` boolean, `wonSpice ⇒ wonMerchants`;
  `crisis.tile.island` gültiger Index. Fremdinsel-`kontorId`: `null` oder Id eines `kontor2` mit `island` = dieser
  Insel (erweitert E1 P-6; `kontor2` existiert ab T02 — bis dahin ist nur `null` erreichbar).
- `tests/sim/helpers.ts` `foldBackToV8(v9)`: entfernt `ships`, `nextShipId`, `wonSpice`, `crisis.tile.island`,
  `stock.spice` je Insel, `sellPct.spice`; `version 8`; unbekannter Schlüssel → `throw` (nur Test).
  `normalized()`: `foldBackToV6(foldBackToV7(foldBackToV8(JSON.parse(json))))`, sonst unverändert.

## Schritte

- [ ] **1 Tests zuerst**, `describe('M12 Seefahrt Save v9')` in `save.test.ts`:
  - **AK-E3-06** `save-v8.json` → `version 9`, jede Insel `stock.spice` definiert, `sellPct.spice === 100`, `ships []`,
    `nextShipId 1`, `wonSpice false`; Round-trip `serialize(deserialize(serialize(w)).world) === serialize(w)`.
  - **AK-E3-07** `save-v8.json` (3 Häuser Stufe 4) → Heimat `spice 30`, `notice === SPICE_GRACE_NOTICE`; speichern,
    laden → kein `notice`, `spice 30`; danach 1000 `step` ohne Ausnahme. Roh-JSON mit 11 Häusern `house.tier 4`
    (8 weitere umstellen, Ladeprüfung muss halten) → 100. `save-v7.json` (keine Kaufleute) → 0, kein `notice`.
    **R230:** `foldBackToV7(foldBackToV8(v9 aus save-v8))` als v7-Stand laden → `spice 30` genau einmal.
  - **AK-Z3-09** v8 mit `wonMerchants true` → `wonSpice false`; Round-trip v9 erhält `wonSpice true` (mit
    `wonMerchants true`); `wonSpice true` + `wonMerchants false` und `wonSpice 1` → „Beschädigter Spielstand".
  - **Ladeprüfung v9** Tabelle V01–V16, je „Beschädigter Spielstand", `not.toThrow()`: 5 Schiffe; `port 3`; `to` = Insel
    ohne Kontor; `to === port`; `left` > `laneTicks`; `cargo.spice 51`; `cargo.foo 1`; `cargo.wood 0`; Route `a = b`;
    3 Güter in `ab`; Gut in `ab` und `ba`; `reserve 15`; `homing` mit Route; `nextShipId` ≤ max `id`; doppelte `id`;
    `crisis.tile.island 5`. Positiv: Schiff `port 2`, `to 0`, Insel 2 ohne Kontor (Fall R228 (1)) → lädt.
  - **AK-M12-B5** Kette `save-v1` … `save-v8` → `version 9`, `ok`; `version 10` → „Unbekannte Version"; Alt-Tests
    mit `version 9` → „Unbekannte Version" auf `10` umstellen (nicht löschen). Kettenhashes über
    `sortedJson(foldBackToV6(foldBackToV7(foldBackToV8(…))))` = bestehende `CHAIN_HASHES`.
  - **B4** `migrateV1ToV2` zweimal auf `save-v1` → gleich; `isWellFormed` ohne `stock.spice` → false.
  - `defs.test.ts` (Pin M8 „8 Güter", bewusst, R226 F-03): `GOOD_IDS.length 10`, erste 9 unverändert (Liste),
    letztes `spice`; `GOODS.spice` 40/12 ohne `order` (AK-E3-01 Teil).
- [ ] **2 Rot-Beleg** `npx vitest run tests/sim/save.test.ts tests/sim/defs.test.ts -t "M12 Seefahrt|AK-E3"` →
      Commit `test: M12 Seefahrt Save v9 (rot)`.
- [ ] **3 Umsetzung** nach „Form"; `npx tsc --noEmit` zeigt jede erschöpfende Tabelle → `spice` ergänzen; **D-144
      Regel (2):** Gewürz bekommt einen **eigenen** Farbton (Chip, `GOOD_COLORS`, `LOAD_COLOR`), verschieden von allen
      anderen Gütern — Test in `tests/render/` bzw. `tests/ui/`: Farbe von `spice` ≠ Farbe jedes anderen Guts. Kein
      neuer Wert in `src/sim/`.
- [ ] **4 `normalized()`** umstellen; `OFF_FINGERPRINT 0x701c6da5` grün **ohne** Pin-Änderung; `balance-merchants`
      `[6750, 11200, 320]` grün; `balance.test.ts` unverändert. Weicht etwas ab → anhalten (R74).
- [ ] **5 Prüfen:** `make check`, `CI=true make check` → Commit `feat: M12 Seefahrt Save v9, Gut Gewürz`.

**Review-Fokus:** Migration wirft nie (Garbage `{version:8}`, `{version:8, islands:null}`); Bestand gesetzt, nicht
addiert; Schlüsselreihenfolge P-2; keine Regel nutzt `ships` schon; nur bewusster Pin „8 Güter" geändert.
