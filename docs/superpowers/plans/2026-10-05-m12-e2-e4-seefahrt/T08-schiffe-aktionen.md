> **Task-ID:** T08 · **AK-IDs:** AK-E4-01, AK-E4-02, AK-E4-07, AK-E4-16
> **blocked-by:** T02 · **Strang:** e4, `feat/m12-see-e4`, Worktree `.worktrees/m12-see-e4` · `tech-sim-engineer`
> (sonnet)
> **Regeln:** Spec §8, Anhang 03 E (Kauf, Unterhalt, Ausmustern, Route anlegen/ändern/auflösen), F-P6

## T08: Schiffe — Kauf, Unterhalt, Ausmustern, Routen-Aktionen

**Ziel:** Der Spieler kauft am Heimatkontor bis zu 4 Handelsschiffe, legt Routen an, ändert und löst sie auf,
mustert leere Schiffe aus. Bewegung und Umschlag folgen in T09.

**Code-Fakten:** `types.ts` `Ship`, `Route`, `RouteGood`, `World.ships`, `nextShipId` (T01); `defs/sea.ts` `SHIP`,
`SHIP_MAX`, `ROUTE_GOODS_PER_DIRECTION`, `ROUTE_RESERVE` (T02); `world.ts` `home`; `economy.ts` `checkAfford`, `pay` (unverändert nutzen, `where` nicht nötig); `unlocks.ts`
`functionLock(w, 'seafaring')`; `economy.ts` `totalUpkeep(world)` (Summe über Gebäude), `tickEconomy`
(`upkeepCarry`); `goodUnlocked`. Testwelt `seaHelpers.ts` (`seaWorld`, `foundKontor2Literal`, `shipLiteral`).

**Dateien:** neu `src/sim/ships.ts`; `src/sim/economy.ts` (`totalUpkeep`); neu `tests/sim/ships.test.ts`.

## Schnittstellen (Produces)

```ts
// src/sim/ships.ts — importiert nur ./types, ./defs/*, ./world, ./islands, ./unlocks
export function buyShip(world: World): Result; // neues Schiff port 0, to null, leer, ohne Route
export function retireShip(world: World, shipId: number): Result;
export function setRoute(world: World, shipId: number, route: Route): Result;
export function updateRoute(world: World, shipId: number, route: Route): Result; // Güter/Reserve, a/b gleich
export function clearRoute(world: World, shipId: number): Result; // route null, homing true
export function validRoute(world: World, route: Route): Result; // gemeinsame Prüfung (auch UI)
export function freeShipAtHome(world: World): Ship | null; // kleinste id: port 0, to null, route null, !homing
export function tickShips(world: World): ShipLoss[]; // T09; hier nur Gerüst, liefert []
export interface ShipLoss {
  ship: number;
  good: GoodId;
  n: number;
}
```

## Regeln (verbindlich, Gründe wörtlich)

- **`buyShip`:** `functionLock(world, 'seafaring')` → **„Seefahrt mit den Kaufleuten"**; `ships.length ≥ SHIP_MAX`
  → **„Höchstens 4 Schiffe"** (Zahl aus `SHIP_MAX`); Geld → heutiger Geld-Grund („Zu wenig Geld" bzw. der Text aus
  `checkAfford`); Waren aus dem **Heimatlager** über `checkAfford(world, home(world), SHIP.cost)` (heutiger Text
  „Nicht genug Holz"). Dann `pay`, `ships.push({ id: nextShipId++, port: 0, to: null, left: 0, cargo: {}, route:
null, homing: false })` (Schlüsselreihenfolge P-2).
- **Unterhalt:** `totalUpkeep` + `ships.length × SHIP.upkeep`; Buchung wie heute über `upkeepCarry`, auch bei Geld < 0.
- **`retireShip`:** unbekannt → „Unbekanntes Schiff"; `to !== null` → **„Erst im Heimathafen"**; `port !== 0` →
  gleich; `route !== null` oder `homing` → **„Erst Route auflösen"**; Ladung > 0 → **„Erst entladen"**. Sonst
  entfernen, keine Erstattung.
- **`validRoute`** (Reihenfolge der Gründe): `a === b` → **„Zwei verschiedene Kontore wählen"**; `a` oder `b` ohne
  Kontor → **„Kein Kontor auf <Name>"**; `ab.length` oder `ba.length` > `ROUTE_GOODS_PER_DIRECTION` →
  **„Höchstens 2 Güter je Richtung"**; `ab.length + ba.length === 0` → **„Mindestens ein Gut wählen"**; Gut doppelt
  in einer Liste oder in beiden → **„Gut fährt schon in Gegenrichtung"**; Gut nicht freigeschaltet → `goodLock`-Text;
  `reserve` nicht in `{0, 10, …, 90}` → **„Reserve in Zehnern 0 bis 90"**.
- **`setRoute`:** Schiff unbekannt → „Unbekanntes Schiff"; `to !== null` → **„Schiff ist unterwegs"**; `route !==
null` oder `homing` → **„Schiff hat schon eine Route"**; `validRoute`; dann `route` als Kopie setzen. Das Schiff ist
  damit „Umschlag fällig" im Hafen `port` (T09 handelt im nächsten `tickShips`).
- **`updateRoute`:** Schiff hat Route, `a`/`b` gleich (sonst **„Route auflösen und neu anlegen"**), `validRoute`;
  ersetzt `ab`, `ba`; Ladung und Fahrt unverändert (wirkt ab der nächsten Umladung).
- **`clearRoute`:** ohne Route → **„Keine Route"**; sonst `route = null`, `homing = true`. Bewegung in T09.
- Alle Aktionen: Welt bei Fehlschlag unverändert (`serialize` vorher = nachher).

## Schritte

- [ ] **1 Tests zuerst** `tests/sim/ships.test.ts`, `describe('M12 E4 Schiffe Aktionen')`:
  - **AK-E4-01** `seaWorld()` (`unlockAll`), Geld/Holz/Werkzeug reichlich: `buyShip` → Geld −1200, Heimat Holz −25,
    Werkzeug −10, Schiff `{ id 1, port 0, to null, left 0, cargo {}, route null, homing false }`; 4 Käufe ok, fünfter
    → „Höchstens 4 Schiffe"; Welt ohne U6 → „Seefahrt mit den Kaufleuten"; Geld 1199 → Geld-Grund; Welt unverändert.
  - **AK-E4-02** zwei Welten gleich, eine mit 4 Schiffen (Literal): nach 100 `step` Geld-Differenz genau −60;
    gleich bei Startgeld −500 (läuft bei Geld < 0).
  - **AK-E4-07** je eigener Grund, `serialize` unverändert: Gut in `ab` und `ba`; 3 Güter in `ab`; `a = b`; Ziel A ohne
    Kontor; Schiff `to 2` (unterwegs); `ab = ba = []`; Reserve 15.
  - **AK-E4-16** liegend in Heimat, leer, ohne Route → entfernt, kein Geld zurück, `totalUpkeep` −15; unterwegs →
    „Erst im Heimathafen"; mit Route → „Erst Route auflösen"; mit `cargo { spice: 5 }` → „Erst entladen".
  - `setRoute`/`updateRoute`/`clearRoute` Grundfälle: Route gesetzt (Kopie, nicht dieselbe Referenz); `updateRoute`
    ändert Reserve auf 30, `cargo` unverändert; `clearRoute` → `homing true`, `route null`; `freeShipAtHome` wählt
    kleinste `id`.
- [ ] **2 Rot-Beleg** → Commit `test: M12 E4 Schiffe Aktionen (rot)`.
- [ ] **3 Umsetzung**; `tickShips` liefert `[]` (Gerüst, noch nicht in `step`).
- [ ] **4 Prüfen:** Bitgleich (ohne Schiffe ändert `totalUpkeep` nichts); `make check`, `CI=true make check` →
      Commit `feat: M12 E4 Schiffe kaufen, ausmustern, Routen`.

**Review-Fokus:** Gründe wörtlich und in Reihenfolge; Welt bei Fehlschlag unverändert; Kosten nur aus dem
Heimatlager; Route als Kopie; kein `createRng`-Import in `ships.ts`.
