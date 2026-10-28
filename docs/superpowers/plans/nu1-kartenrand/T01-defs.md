# T01 · Defs, Kartenhaus, `U7`

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 50 Tools · blocked-by: T00 · AK-NU1-01, -02, -08, -30, -25b (Freischaltung)
Spec §3.1, §3.2, §3.6 Punkt 1–4, §3.9 Punkt 1, §3.12; Anhang 02 §2–§7 (verbindlich).

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

**Files:**

- Create: `src/sim/defs/expedition.ts`, `tests/sim/expedition-defs.test.ts`, `tests/sim/expedition.test.ts` (erster Block)
- Modify: `src/sim/types.ts` (nur Typen, keine `World`-Felder), `src/sim/defs/buildings.ts`, `src/sim/defs/unlocks.ts`, `src/sim/unlocks.ts`, `src/sim/world.ts` (nur `unlockAll`)
- Modify (Pins laut `pins.md`, Zeilen T01): `tests/sim/unlocks.test.ts`, `tests/sim/defs.test.ts`; Platzhalter laut Schritt 5

**Interfaces (Produces):**

```ts
// types.ts
export type SeaAreaId = 'wrecks' | 'skerries' | 'north';
export type ExpeditionPhase = 'boarding' | 'leg' | 'card' | 'back';
export type CardId = string; // Ids aus EXPEDITION_CARDS
export type FindId = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8';
export interface Expedition {
  ship;
  area;
  phase;
  leg;
  cardIndex;
  extra;
  left;
  wait;
  cargo;
  cards;
  finds;
  done;
} // Form Spec §4
export interface CardCondition {
  good: GoodId;
  n: number;
}
export interface CardOption {
  cond: readonly CardCondition[];
  find?: true;
}
export interface CardDef {
  id: CardId;
  area: SeaAreaId;
  title: string;
  text: string;
  r: CardOption;
  s?: CardOption;
}
export type FindLever =
  | { kind: 'travelPct' }
  | { kind: 'routeGoods'; value: number }
  | { kind: 'cyclePct'; defId: BuildingDefId }
  | { kind: 'serviceRadius'; defId: BuildingDefId; add: number }
  | { kind: 'supplyRadius'; defId: BuildingDefId; add: number }
  | { kind: 'storageCap'; goods: readonly GoodId[]; value: number };
export interface FindDef {
  id: FindId;
  area: SeaAreaId;
  name: string;
  text: string;
  icon: string;
  lever: FindLever;
}
export interface SeaAreaDef {
  id: SeaAreaId;
  name: string;
  sections: number;
  cardsAfter: readonly number[];
  hints: readonly [GoodId, GoodId];
  keywords: string;
  outlook: string;
  finds: readonly FindId[];
}
// UnlockTrigger += { kind: 'wonSpice' }; UnlockFunction += 'expedition'; BuildingDefId += 'maphouse'
```

```ts
// defs/expedition.ts — Werte aus Anhang 02 §3, §4, §5, §6
export const PROVISION = 3;
export const SECTION_TICKS = 300;
export const HOME_TICKS = 600;
export const DETOUR_SECTIONS = 2;
export const REMIND_TICKS = 3000;
export const WARN_BACK_TICKS = 300;
export const EXPEDITION_SALT = 0xc2b2ae35;
export const FIND_PCT = 90;
export const FOG_NAME = 'Unbekanntes Gewässer';
export const SET_COMPLETE_TEXT = 'Kartenrand vollständig';
export const SEA_AREAS: readonly SeaAreaDef[]; // Reihenfolge wrecks, skerries, north = Strom-Index
export const EXPEDITION_CARDS: readonly CardDef[]; // 4/5/5 Karten, Def-Reihenfolge = Kandidatenfolge
export const FINDS: readonly FindDef[]; // F1…F8, Reihenfolge = Fundstück-Liste §5.4
export const areaOf: (id: SeaAreaId) => SeaAreaDef;
export const cardOf: (id: CardId) => CardDef;
export const poolOf: (area: SeaAreaId) => readonly CardDef[];
```

`FIND_PCT` ist der einzige Prozentwert der drei Zyklus-Stücke und von F1; `FindLever` trägt ihn nicht doppelt. Kartentexte schreibst du (ein Satz, ≤ 120 Zeichen, eigen, ADR-006); Titel wörtlich aus Anhang 02 §4. Ausblick-Texte (`outlook`) wörtlich Spec §5.5, Stichworte (`keywords`) wörtlich Anhang 02 §3, Fundstück-Texte mit Zahl (z. B. «Fahrzeit aller Routen −10 %»).

## Schritte

- [ ] **Step 1: Tests schreiben (rot).**
  - `tests/sim/expedition-defs.test.ts`, **AK-08** (Wächter): je Karte genau eine R-Option mit `find: true` und `cond.length` 1–2; S ohne `find`, `cond.length` 1–2; alle Güter ∈ `GOOD_IDS`; `poolOf(a).length` 4/5/5 ≥ `cardsAfter.length` 2/3/3; `SEA_AREAS.map(a => a.id)` = `['wrecks','skerries','north']`, je 2 `hints`; `FINDS` 8 Einträge, `areaOf(a).finds` = `['F1','F2']`/`['F3','F4','F5']`/`['F6','F7','F8']` und Länge = `cardsAfter.length`; letzte Kartenstelle = `sections`; Karten-Ids eindeutig.
  - Ebenda, **AK-30** (Wächter über die Defs, Anhang 02 §7): Dauer `sections × SECTION_TICKS + HOME_TICKS` = 1800/2100/2700, alle in 1800 … 3000; «alle für alle Fälle» (Proviant `sections × PROVISION` + je Gut das Maximum der R-Summen über alle Ziehungen) = 57/63/61 > `SHIP.capacity`; sicherer Weg ≤ 50 (32/36/43); für **jede** Teilmenge des Pools in Fahrtgrösse: Summe R-Waren + Proviant ≤ `SHIP.capacity`, Maximum 48/49/49. Die Zahlen 57/63/61, 32/36/43, 48/49/49 stehen als Erwartung; gerechnet wird aus den Defs.
  - `tests/sim/expedition.test.ts`, **AK-01**: `createWorld(1)` → `canPlace(w, 'maphouse', …)` Grund «Erst nach der Gewürzstadt», `'U7'` ∉ `w.unlocked`; nach `w.won = w.wonMerchants = w.wonSpice = true` und `tickUnlocks(w)` → `'U7'` ∈ `unlocked`, `canPlace` auf Heimat `ok` (freie Fläche über Test-Helfer), auf Fremdinsel «Nur auf der Heimatinsel», nach Bau ein zweites «Es gibt schon ein Kartenhaus»; `BUILDING_DEFS.maphouse.cost`/`.upkeep` = Anhang 02 §2 (1500/30/15/20, 20).
  - Ebenda, **AK-02**: `flammableRect(w)` vor und nach dem Bau gleich (`toEqual`); `BUILDING_DEFS.maphouse.flammable` undefiniert.
  - Ebenda (Zusatz P-2/P-3): `createWorld(1, { unlockAll: true }).unlocked` enthält `'U7'` nicht; `nextUnlocks(createWorld(1))` enthält keinen Eintrag `'U7'`; `isUnlocked` für `U7` folgt nur `wonSpice`.
- [ ] **Step 2: Rot:** `npx vitest run tests/sim/expedition-defs.test.ts tests/sim/expedition.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Step 3: Umsetzen.** Typen und Defs wie oben; `maphouse` laut Anhang 02 §2 **vor** `monument` einfügen; `U7` laut Anhang 02 §2 an `UNLOCKS`/`UNLOCK_IDS` anhängen, nicht in `UNLOCK_CHAIN`; `FUNCTION_LABELS.expedition = ['Expedition']`; `fulfilled` bekommt `case 'wonSpice': return w.wonSpice;`; `nextUnlocks` filtert `u.trigger.kind === 'wonSpice'` aus (P-3); `createWorld` mit `unlockAll` nimmt `UNLOCK_IDS.filter(id => UNLOCKS.find(u => u.id === id)!.trigger.kind !== 'wonSpice')` (P-2), als benannte Konstante in `defs/unlocks.ts` (`UNLOCK_ALL_IDS`).
- [ ] **Step 4: Grün:** derselbe Befehl → 0.
- [ ] **Step 5: Nebenläufe und Platzhalter.** `npx vitest related --run src/sim/defs/buildings.ts src/sim/defs/unlocks.ts src/sim/unlocks.ts --maxWorkers=2; echo EXIT=$?`. Rote Pins nur laut `pins.md` (T01-Zeilen) anpassen. Tests, die je Gebäude Sprite, Klang oder Tooltip verlangen: Platzhalter im Bestand-Muster (Sprite-Zuordnung eines vorhandenen 2×2-Gebäudes in `src/render/sprites.ts`, Klang-Fallback-Liste, Tooltip-Text aus der Def) mit Kommentar `// NU-1 Platzhalter bis NU1-ART`; keine Erwartung ändern. Jeder andere Rotfall → Controller.
- [ ] **Step 6: Teilbeleg:** `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`, `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?`.
- [ ] **Step 7: Commit** `feat: NU-1 Defs Expedition, Kartenhaus, Freischaltung U7 (T01)`.
