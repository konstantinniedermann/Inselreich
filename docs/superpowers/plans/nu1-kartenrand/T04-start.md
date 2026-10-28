# T04 · Start, Abbruch, Schiff, Abriss, Ziehung

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 70 Tools · blocked-by: T03 · AK-NU1-03, -04, -05, -06, -11, -12, -13, -14 (Sperren), -17, -52, -53, -54
Spec §3.1 Punkt 5, §3.3, §3.4, §3.5 «Beginn eines Abschnitts», §3.6 Punkt 5, §3.10; Anhang 02 §8.6.

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

**Files:**

- Create: `src/sim/expeditionCore.ts`, `src/sim/expedition.ts`, `tests/sim/expedition-cards.test.ts`
- Modify: `src/sim/ships.ts` (`tickShips` zwei Zeilen, `retireShip`/`setRoute`/`updateRoute` je eine Sperre, `unloadAtHome` → `storeCargoHome`), `src/sim/build.ts` (`demolish`), `tests/sim/expedition.test.ts` (Blöcke Start, Schiff)

**Interfaces:**

- Consumes: Defs (T01), `World.expedition` (T02), `storageCap` (T03).
- Produces:

```ts
// expeditionCore.ts — Blatt (nur ./defs/*, ./types); von ships.ts importiert
export const isExpeditionShip: (world: Pick<World, 'expedition'>, shipId: number) => boolean;
export const expeditionShipAway: (world: Pick<World, 'expedition'>, shipId: number) => boolean; // Phase ≠ boarding
export const boardsNow: (world: Pick<World, 'expedition'>, ship: Ship) => boolean; // boarding, dieses Schiff, port 0, to null
export function backTicks(e: Expedition): number; // e.done ? HOME_TICKS : Math.min(HOME_TICKS, SECTION_TICKS * e.leg)
export function turnBack(world: World): void; // phase 'back', done false, left = backTicks, wait 0
export function beginSection(world: World): void; // Nahrung ≥ PROVISION: abziehen (Nulleintrag löschen), phase 'leg', left SECTION_TICKS; sonst turnBack
// ships.ts
export function storeCargoHome(
  world: World,
  shipId: number,
  cargo: Ship['cargo'],
  lost: ShipLoss[],
): void; // GOOD_IDS-Folge bis storageCap, Rest → lost
// expedition.ts
export type CancelResult =
  | { readonly ok: true; readonly lost: ShipLoss[] }
  | { readonly ok: false; readonly reason: string };
export function shipAvailable(world: World, ship: Ship): boolean; // Spec §3.4 Punkt 1
export function startReason(
  world: World,
  shipId: unknown,
  area: unknown,
  cargo: unknown,
): string | null; // reine Vorprüfung, Tabelle §3.3
export function startExpedition(
  world: World,
  shipId: unknown,
  area: unknown,
  cargo: unknown,
): Result;
export function cancelExpedition(world: World): CancelResult;
export function drawCards(seed: number, area: SeaAreaId): CardId[];
export function soleSpiceShip(world: World, shipId: number): boolean; // genau ein Schiff mit 'spice' in ab oder ba, und es ist dieses
export const areaDuration: (area: SeaAreaId) => number; // sections × SECTION_TICKS + HOME_TICKS
```

## Regeln (Kurzform; Wortlaut der Gründe: Spec §3.3 Tabelle, wörtlich)

- `startReason` prüft Nr. 1–11 in Tabellenreihenfolge; erster Treffer ist der Grund. Nr. 8 auch für `cargo` kein Objekt, `null`, Arrays, Nicht-Ganzzahlen, negative Mengen, unbekannte Gut-Ids. Nr. 10 nennt das erste Gut in `GOOD_IDS`-Reihenfolge mit `GOODS[g].name` und den Mengen. `startExpedition` ruft `startReason`; bei Grund `fail(grund)` ohne jede Änderung.
- Erfolg: Ladung vom Heimatlager abziehen; `cargo` kanonisch (P-8, Nullmengen entfallen); `cards = drawCards(world.seed, area)`; `expedition` in `boarding` mit Nullwerten; ist das Schiff frei (Fall a), sofort `beginSection`.
- `drawCards`: `r = createRng((seed ^ Math.imul(index + 1, EXPEDITION_SALT)) >>> 0)`, `index` = Position in `SEA_AREAS`; Kandidaten = `poolOf(area)` in Def-Reihenfolge; für i < k: `j = Math.floor(r() * kandidaten.length)`, nehmen und entfernen. Nur `src/sim/rng.ts`.
- `tickShips`: erste Zeile im Schleifenrumpf `if (expeditionShipAway(world, ship.id)) continue;`; vor `handleDocked`: `if (boardsNow(world, ship)) { unloadAtHome(world, ship, lost); beginSection(world); } else handleDocked(…)`. `unloadAtHome` entlädt **alles** (kein `keep`). Sonst keine Änderung an `tickShips` (HAFEN-Naht, T09).
- Sperren «Schiff ist auf Expedition»: `retireShip` in allen Phasen (nach «Unbekanntes Schiff»); `setRoute`/`updateRoute` bei `expeditionShipAway`; in `boarding` zusätzlich `setRoute` auf eine Route ohne Heimat-Ende (sonst legte das Schiff nie an und der Stand verletzte K11; Entwurf E-NU-6). `clearRoute` unverändert.
- `demolish`: `maphouse` bei `world.expedition !== null` → `fail('Erst Expedition beenden')`, vor jeder Änderung.
- `cancelExpedition`: ohne Expedition «Keine Expedition», Phase ≠ `boarding` «Expedition schon ausgelaufen»; sonst `storeCargoHome` und `expedition = null`, `{ ok: true, lost }`.

## Tests (`tests/sim/expedition.test.ts`, Testwelt mit `wonSpice`, `U7`, Kartenhaus über Bestand-Helfer; Routen-Helfer per `rg -n "export function" tests/sim/helpers.ts`)

- **AK-03** (`it.each` über Nr. 1–11): je Fall Grund wörtlich, `JSON.stringify(w)` vor = nach, `not.toThrow()`; Nr. 8 zusätzlich mit `cargo` `null`, `{ wood: -1 }`, `{ wood: 1.5 }`, `{ gold: 1 }`, `'x'`; Nr. 9 mit 50 erlaubt und 51 «Ladung über 50»; Nr. 10 «Ware nicht im Lager: Werkzeug (12, da 4)».
- **AK-04:** freies Schiff, Wrackfeld, Ladung `{ food: 12, wood: 20, tools: 10 }` → Lager um die Ladung kleiner, `phase 'leg'`, `left 300`, `cargo.food 9`, `cards` Länge 2/3/3 je Gebiet, ohne Doppelte, ⊆ `poolOf`.
- **AK-05:** Routenschiff Heimat ⇄ Insel → `boarding`; `step` bis Ankunft Heimat: im Ankunftstick gesamte Routenladung entladen (bis Grenze), `phase 'leg'`, Route am Schiff unverändert; Homing-Schiff ebenso; Route zwischen zwei Fremdinseln → Nr. 7.
- **AK-06:** `cancelExpedition` in `boarding` → Ladung zurück, `expedition null`; neuer Start → gleiche `cards`; in `leg` «Expedition schon ausgelaufen»; ohne «Keine Expedition».
- **AK-11:** 2 Nahrung → Nr. 11, Welt JSON-gleich; 3 → `ok`.
- **AK-12:** zweiter Start → Nr. 3; `seaRevealed` alle drei → Nr. 1, auch nach Abriss und Neubau des Kartenhauses.
- **AK-13:** Abriss in `boarding`, `leg`, `card`, `back` (Phase per gültigem Zustand gesetzt) → «Erst Expedition beenden», Welt JSON-gleich; ohne Expedition `ok`, danach Start «Kein Kartenhaus».
- **AK-14 (Sperren):** in `leg` liefern `retireShip`, `setRoute`, `updateRoute` «Schiff ist auf Expedition»; in `boarding` `retireShip` ebenso, `setRoute` mit Heimat-Ende wie Bestand.
- **Review Focus 1 (E-NU-6):** in `boarding` `setRoute` auf Route zwischen zwei Fremdinseln → «Schiff ist auf Expedition», Welt JSON-gleich; danach `serialize`/`deserialize` `ok`.
- **Review Focus 5:** Abriss des Kartenhauses ohne Expedition bei `finds ['F1']` → `world.finds` unverändert, `laneTicksOf` weiter verkürzt, Start «Kein Kartenhaus».
- **AK-52:** Abbruch bei Heimatlager 95 Holz und Ladung 20 Holz → Lager 100, `lost` `[{ ship, good: 'wood', n: 15 }]`.
- **AK-53:** `boarding`, Heimatlager voll, Routenladung trifft ein → Überlauf in `step(w).lost`, `phase 'leg'` im selben Tick.
- **AK-54:** Homing-Schiff und Routenschiff mit nur Gewürz an Bord (Gewürz in der Ladeliste der Heimatseite) → entladen alles, `phase 'leg'`.
- `tests/sim/expedition-cards.test.ts`, **AK-17:** gleiche Folge für gleichen Seed und Gebiet, auch nach Abbruch und erneutem Start; je Seed 1–3 unterscheidet sich mindestens ein Gebiet von einem anderen Seed; Folgen Seeds 1–3 × 3 Gebiete als Literal gepinnt **und** gegen eine im Test nachgerechnete Ziehung (eigene Schleife mit `createRng`) geprüft; `orderForPeriod`, `rollCrisis` und `createWorld(s).islands` vor und nach 10 Ziehungen gleich.

## Schritte

- [ ] Tests schreiben; **Rot:** `npx vitest run tests/sim/expedition.test.ts tests/sim/expedition-cards.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Umsetzen. `imports.test.ts` (kein Importkreis) muss grün bleiben: `ships.ts` importiert nur `expeditionCore.ts`.
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/sim/ships.test.ts tests/sim/imports.test.ts tests/sim/build*.test.ts tests/sim/routeBalance*.test.ts; echo EXIT=$?` → 0.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: NU-1 Expedition starten, abbrechen, Schiff im Wartezustand, Ziehung (T04)`.
