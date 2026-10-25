# T01 Defs, Typen, Weltfeld, Blattmodul

Persona `tech-sim-engineer` · Strang A · Tools ≈ 45 · AK-BS-09, AK-BS-16 (Defs-Teil), AK-BS-01 (Form von `createWorld`) · blocked-by T00.

**Files:** Create `src/sim/defs/petitions.ts`, `src/sim/petitionEffect.ts`, `src/sim/petitionRng.ts`, `tests/sim/petitions.test.ts`. Modify `src/sim/types.ts` (Typen, `World.petitions`), `src/sim/world.ts` (`createWorld`-Option). In T01 keine Leseorte, kein `tick.ts`, kein `save.ts`. Bricht `tsc` an einem getypten Welt-Literal in `src/` oder `tests/`, ergänzt du dort `petitions` im Aus-Zustand (gehört zu T01, im Bericht nennen). Geladene Stände ohne Feld deckt erst die Migration in T05 ab.

## Interfaces

Produces (`src/sim/defs/petitions.ts`, Werte aus Spec §4 wörtlich):

```ts
export const DEFAULT_WORLD_PETITIONS_ON = false;
export const DEFAULT_NEW_GAME_PETITIONS_ON = true;
export const PETITION_FIRST = 600;
export const PETITION_PERIOD = 6000;
export const PETITION_ANSWER = 1200;
export const PETITION_MAX_OPEN = 2;
export const PETITION_SALT = 0xc2b2ae35;
export const OVERCROWD_PCT = 15;
export const FRUGAL_PCT = 10;
export const FRUGAL_TICKS = 1800;

export const PETITION_IDS = [
  'weavers',
  'tavern',
  'glaziers',
  'bell',
  'feastDrink',
  'spiceSeed',
  'woolMarket',
  'returnees',
  'granary',
] as const; // Reihenfolge B1 … B9 = Kandidatenreihenfolge
export type PetitionId = (typeof PETITION_IDS)[number];

export type PetitionCost =
  { good: GoodId; fixed: number } | { good: GoodId; div: number; min: number; max: number }; // clamp(⌈E / div⌉, min, max)
export type PetitionReward =
  | { kind: 'overcrowd'; pct: number; tiers: readonly Tier[] }
  | { kind: 'upgradeWait' }
  | { kind: 'feastVoucher' }
  | { kind: 'cycle'; pct: number; building: BuildingDefId; homeOnly: boolean }
  | { kind: 'storage'; plus: number; goods: readonly GoodId[] };
export type PetitionWhen =
  | { kind: 'houseTier'; tiers: readonly Tier[]; goalOpen: boolean } // ein Haus auf HOME mit Stufe in tiers
  | { kind: 'chapelBelowMax' } // B4: Kapelle auf HOME mit Haus im Radius unter Höchststufe
  | { kind: 'chapel' } // B5
  | { kind: 'spice'; min: number } // B6: HOME-Gewürz ≥ min und eine `spicefarm` (jede Insel)
  | { kind: 'building'; building: BuildingDefId } // B7: Weberei auf HOME
  | { kind: 'goalOpen' } // B8
  | { kind: 'stockAtLeast'; goods: readonly GoodId[]; min: number }; // B9: eine der Waren ≥ min
export interface PetitionDef {
  name: string;
  text: string;
  cost: readonly PetitionCost[]; // Prüf- und Abbuchreihenfolge
  reward: PetitionReward;
  delay: number;
  duration: number;
  when: PetitionWhen;
  anchor: 'chapel' | 'spicefarm' | 'weaver' | null;
  no: GoodId;
  noReason: string;
  thanks: string;
  lament: string;
}
export const PETITIONS: Readonly<Record<PetitionId, PetitionDef>>;
```

Werte je Eintrag aus der Tabelle in Spec §4.2. `E` ist der `div`-Kostenfall, B1/B2 `div` 5, `min` 10, `max` 40; B3 `div` 10, `min` 5, `max` 20. `overcrowd`: B1 `tiers` `[2, 3, 4]`, B2 `[3]`, B3 `[4]`, je `OVERCROWD_PCT`; B8 `[1, 2, 3, 4]` mit 10. `cycle`: B6 `spicefarm`, `homeOnly: false`; B7 `weaver`, `homeOnly: true`, je 80. B9: `plus` 20, `goods` `['cloth', 'rum', 'food']`, `when` `min` 90. B6: `when.min` 10. `no` nach der letzten Spalte der Tabelle. Texte: `text` aus §8 (Zitat je Bitte), `noReason` aus §8 (Nein-Teil plus «Fachlich»). Für B5, B7, B8 und B9 enthält er den Namen der erbetenen bzw. der Lohn-Ware (AK-BS-24). `thanks` und `lament` folgen Anhang 05 §2.

Produces (`src/sim/types.ts`):

```ts
export interface PetitionMark {
  id: PetitionId;
  drawnAt: number;
  amount: number;
  anchor?: number;
  answer?: 'yes' | 'no';
  dueTick?: number;
}
export interface PetitionEffectEntry {
  id: PetitionId;
  answer: 'yes' | 'no';
  until: number;
  anchor?: number;
}
export interface PetitionsState {
  on: boolean;
  next: number | null;
  open: PetitionMark[];
  effects: PetitionEffectEntry[];
}
// World: petitions: PetitionsState
```

`amount` gilt für die erste `div`-Kostenware; `fixed`-Kosten liest der Code aus den Defs. Gibt es keine `div`-Ware, ist `amount` die Summe der festen Kosten (nur Anzeige, B8 hat 0).

Produces (`src/sim/petitionRng.ts`): `export function petitionRng(seed: number, tick: number): () => number` = `createRng((seed ^ Math.imul(tick + 1, PETITION_SALT)) >>> 0)` (Spec §3.2.4).

Produces (`src/sim/petitionEffect.ts`, Blatt: importiert nur `./defs/*`, `./types`, `./world`):

```ts
export function overcrowdCap(world: World, island: number, tier: Tier, cap: number): number; // cap + ⌊(cap × pct + 50) / 100⌋, pct = Maximum
export function needRate(world: World, island: number, good: GoodId, rate: number): number; // × (100 − FRUGAL_PCT) / 100 bei «Nein»-Wirkung auf `good`, einmal
export function petitionCycle(
  world: World,
  island: number,
  defId: BuildingDefId,
  cycle: number,
): number; // max(1, ⌊c × pct / 100⌋), kleinster pct
export function storageCap(world: World, island: number, good: GoodId): number; // STORAGE_CAP + plus
```

Regeln: Wirksam ist ein Eintrag mit `until > world.tick`. «Ja»-Einträge wirken nach `reward`, «Nein»-Einträge nur als `frugal` auf `PETITIONS[id].no`. Nur `island === HOME`, ausser `cycle` mit `homeOnly: false`. **Jede Funktion gibt bei `world.petitions.effects.length === 0` sofort den Eingabewert zurück**, ohne Schleife und ohne Allokation (bitgleich und billig, T03 misst).

`createWorld(seed, opts: { crisisLevel?; unlockAll?; petitionsOn?: boolean })` setzt `petitions = { on: opts.petitionsOn ?? DEFAULT_WORLD_PETITIONS_ON, next: null, open: [], effects: [] }`.

## Schritte

- [ ] **Test zuerst** in `tests/sim/petitions.test.ts`:
  - `AK-BS-09 Wächter`: `max(delay) + PETITION_ANSWER ≤ PETITION_PERIOD`; `PETITION_FIRST + 6750 ≤ 9000`; jede `duration > 0`; jede `cost[].good` und jedes `no` in `GOOD_IDS`; `PETITION_IDS.length === 9`, kein `'guild'`.
  - `AK-BS-16 Defs gegen Tabelle`: je Id die erwarteten `delay`, `duration`, `reward`, `cost` und `no` als Literal-Objekt im Test (Tabelle §4.2), dazu die Konstanten aus §4.1; `noReason` ist nicht leer.
  - `AK-BS-01 createWorld`: `createWorld(3).petitions` `toEqual({ on: false, next: null, open: [], effects: [] })`; mit `{ petitionsOn: true }` gilt `on === true`.
  - `Blatt`: Die Importzeilen von `src/sim/petitionEffect.ts` erfüllen `/^\.\/(defs\/|types|world)/`; bestehende Kreisprüfung in `tests/sim/imports.test.ts` grün.
  - `Leseorte leer`: Ohne `effects` liefern alle vier Funktionen den Eingabewert (Stichproben je Stufe, Ware, Gebäude).
  - `overcrowdCap`: mit einer B1-Wirkung (`until` = tick + 10) bei HOME gilt Stufe 2 → 8 + 1, Stufe 3 → 15 + 2, Stufe 4 → 20 + 3, Stufe 1 → 4 (Filter); dazu B8: Stufe 1 → 4 + 0, Stufe 4 → 20 + 2; Insel 1 → unverändert.
- [ ] Rot: `npx vitest run tests/sim/petitions.test.ts; echo EXIT=$?` (≠ 0).
- [ ] Umsetzen (Defs, Typen, `createWorld`, Blatt, Strom).
- [ ] Grün plus Teilbeleg: `npx vitest run tests/sim/petitions.test.ts tests/sim/imports.test.ts tests/sim/world.test.ts; echo EXIT=$?` (Datei `world.test.ts` nur, wenn vorhanden), `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: I-210 Defs, Weltfeld und Blattmodul petitionEffect` (gezielt stagen).
