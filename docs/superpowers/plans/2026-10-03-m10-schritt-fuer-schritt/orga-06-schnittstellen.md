> Teil des Plans M10, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Gemeinsame Schnittstellen (verbindlich für alle Tasks)

Jeder Implementierer sieht nur seinen Task; diese Namen und Typen gelten überall.

```ts
// src/sim/types.ts (Task 1; 'noService', requiresService, maxCount, 'townhall': Task 4)
export type UnlockId = 'U0' | 'U1' | 'U2' | 'U3' | 'U4' | 'U5' | 'U6';
export type UnlockFunction = 'forest' | 'orders' | 'goodLocks';
export type UnlockTrigger =
  | { kind: 'start' }
  | { kind: 'houses'; min: number }
  | { kind: 'tierWish'; tier: Tier }
  | { kind: 'tierReached'; tier: Tier }
  | { kind: 'tierOpen'; tier: Tier };
export interface UnlockDef {
  id: UnlockId;
  trigger: UnlockTrigger;
  buildings: readonly BuildingDefId[];
  goods: readonly GoodId[];
  functions: readonly UnlockFunction[];
  lockText: string; // Platzhalter {min}, {max}; '' nur bei U0
  whenText: string; // Platzhalter {min}, {max}, {WIN_CITIZENS}; '' nur bei U0
  notice: string; // '' nur bei U0
  tip: string;
}
export interface GoodLock {
  tier: Tier;
  good: GoodId;
}
export interface World {
  version: 5;
  /* alle bestehenden Felder unverändert, danach: */
  unlocked: UnlockId[]; // UNLOCK_IDS-Reihenfolge, monoton
  goodLocks: GoodLock[]; // sortiert nach tier, dann GOOD_IDS-Index, ohne Doppelte
  upgradeStops: Tier[]; // aufsteigend, nur Stufen mit upgradeCost !== null
}
// BuildingDef: `unlockTier` entfällt (Task 2); neu (Task 4): requiresService?: ServiceId; maxCount?: { n: number; reason: string }
// BuildingState (Task 4): + 'noService'; BuildingDefId (Task 4): + 'townhall' (am Ende)

// src/sim/defs/unlocks.ts (Task 1; U3.buildings ['townhall'] in Task 4)
export const UNLOCK_IDS: readonly UnlockId[]; // ['U0', …, 'U6']
export const UNLOCKS: readonly UnlockDef[]; // Spec 4.2 / 4.5, Reihenfolge = UNLOCK_IDS
export const UNLOCK_CHAIN: readonly UnlockId[]; // ['U2', 'U3', 'U4', 'U5', 'U6']
export const ONLY_WITH_CRISES: Readonly<Partial<Record<BuildingDefId, true>>>; // { firestation: true }
export const FUNCTION_LABELS: Readonly<Record<UnlockFunction, readonly string[]>>;
//   { forest: ['Roden', 'Aufforsten'], orders: ['Handelsaufträge'], goodLocks: ['Ausgabesperre'] }
export const FUNCTION_ENTRY: Readonly<Record<UnlockFunction, UnlockId>>; // aus UNLOCKS abgeleitet: forest U2, orders U3, goodLocks U5

// src/sim/unlocks.ts (Task 1; taxBlocks echt ab Task 4)
export function isUnlocked(w: World, id: UnlockId): boolean;
export function unlockText(def: UnlockDef, field: 'lockText' | 'whenText'): string; // Platzhalter gefüllt
export function entryOfBuilding(defId: BuildingDefId): UnlockDef | null; // null: kontor
export function lockReason(w: World, def: UnlockDef): string; // tierOpen: tierLock(w, t) ?? unlockText(def,'lockText') (W3)
export function buildLock(w: World, defId: BuildingDefId): string | null;
export function goodLock(w: World, g: GoodId): string | null; // Sperrgrund für buy
export function goodUnlocked(w: World, g: GoodId): boolean; // goodLock(w, g) === null
export function functionLock(w: World, f: UnlockFunction): string | null;
export function buildingShown(w: World, defId: BuildingDefId): boolean;
export function triggeredUnlocks(w: World): UnlockId[]; // + Kettenvorgänger + U0, UNLOCK_IDS-Reihenfolge
export function deriveUnlocks(w: World): UnlockId[]; // triggered ∪ Einträge mit stehendem Gebäude (ohne Kette)
export function tickUnlocks(w: World): void; // letzter Aufruf in step
export interface NextUnlock {
  id: UnlockId;
  names: string[]; // Gebäude (nur angezeigte) in BUILDING_IDS-Reihenfolge, dann FUNCTION_LABELS
  when: string; // unlockText(def, 'whenText')
  now: number | null;
  need: number | null;
  taxBlocks: boolean; // Task 1: immer false; Task 4: effectiveTaxLevel === 'high' && tierWish|tierReached
}
export function nextUnlocks(w: World): NextUnlock[];
// src/sim/placement.ts (Task 2): export { buildLock } from './unlocks'; canPlace prüft buildLock zuerst, dann maxCount (Task 4)

// src/sim/world.ts (Task 1)
export function createWorld(
  seed: number,
  opts?: { crisisLevel?: CrisisLevel; unlockAll?: boolean },
): World;

// src/sim/save.ts (Task 1)
export const SAVE_VERSION = 5;
export function migrateV4ToV5(raw: Record<string, unknown>): void; // Platzhalter ['U0'], [], [], version 5

// src/sim/townhall.ts (Task 4, Blatt)
export function townhallActive(w: World): boolean;
export function townhallReason(w: World): 'Braucht eine Amtsstube' | 'Amtsstube wirkt nicht';
export function effectiveTaxLevel(w: World): TaxLevel;
export function goodLockActive(w: World, tier: Tier, good: GoodId): boolean; // U5 frei && aktiv && Eintrag
export function upgradeStopActive(w: World, tier: Tier): boolean; // aktiv && Eintrag

// src/sim/tax.ts (Task 4)
export function setTaxLevel(w: World, level: string): Result; // Reihenfolge Spec 5.2
export function setGoodLock(w: World, tier: number, good: string, locked: boolean): Result; // Spec 5.3
export function setUpgradeStop(w: World, tier: number, stopped: boolean): Result; // Spec 5.4

// src/sim/defs/forest.ts, src/sim/forest.ts (Task 3)
export const CLEAR_FOREST_COST: Cost; // { money: 10, wood: 0, tools: 0, stone: 0 }
export const PLANT_FOREST_COST: Cost; // { money: 20, wood: 0, tools: 0, stone: 0 }
export function canClearForest(w: World, x: number, y: number): Result;
export function canPlantForest(w: World, x: number, y: number): Result;
export function clearForest(w: World, x: number, y: number): Result;
export function plantForest(w: World, x: number, y: number): Result;

// src/render/renderer.ts (Task 7): Tool + { kind: 'clearForest' } | { kind: 'plantForest' }
// src/render/renderer.ts (Task 8): export function wildlifeEnvOf(world: World, fx: RenderFx): WildlifeEnv;

// src/ui/goal.ts (Task 6)
export const UNLOCK_NOTICE: string; // M8-Text, unverändert (Meldung, wenn nur U6 neu ist)
export function unlockNoticeText(prev: readonly UnlockId[], world: World): string | null;
export function lockedToolText(world: World, tool: Tool): string | null; // ersetzt (world, defId)
// entfallen: initialUnlockShown, unlockNotice; app.ts: state.unlockShown → state.unlockedSeen: UnlockId[]

// src/ui/hotkeys.ts (I: Task 4; Signatur hotkeyList(world): Task 6; C, Q, '?': Task 7)
export function hotkeyList(world: World): { key: string; label: string }[];
export function toolShown(world: World, tool: Tool): boolean;
// HotkeyAction (Task 7): + { kind: 'help' }

// src/ui/buildMenu.ts (Task 6): buildEntries(world, category) über buildingShown; visibleCategories(world): Category[]
// src/ui/hud.ts (Task 6): stockChipHidden(world, g), popChipHidden(world, tier) verallgemeinert (Spec 11.3, 11.4)
// src/ui/trade.ts (Task 6): tradeRows(world): { good: GoodId; canBuy: boolean }[]
// src/ui/order.ts (Task 6): orderVisible(world): boolean; orderMessageFor(prevOrder: Order | null, prevVisible: boolean, cur: World): string | null
// src/ui/settings.ts (Task 6): Settings.unlockMode: 'stepwise' | 'all'
// src/ui/soundEvents.ts (Task 6): SoundSnapshot.unlocked: number; SoundEvent 'unlock' (src/audio/sound.ts)
// src/ui/devProbes.ts (Task 6): exposeDevProbe(p: { world(): World; tileCenter(x: number, y: number): { x: number; y: number }; centerOn(x: number, y: number): void }): void
//   nur unter import.meta.env.DEV → window.__inselDev (nur lesen bzw. Kamera; schreibt nie in die Welt)
// src/ui/startCard.ts (Task 7): helpSections(world): { field: HelpField; title: string; lines: string[] }[]
// src/ui/guide.ts (Task 7): mapSigns(world): readonly MapSign[] (K4)
// src/ui/inspect.ts (Task 7): lockMatrix(world): { tier: Tier; goods: { good: GoodId; locked: boolean }[] }[]
// src/ui/hover.ts (Task 8): hoverInfo(world, tile, timeMs, extra: { ship: boolean; animal: string | null }): { title: string; lines: string[] } | null
//                           hoverVisible(s: HoverState): boolean
// src/ui/icons.ts (A1): ICON_IDS (24), ICONS: Record<IconId, { label: string; paths: string[]; color: PaletteKey }>, iconSvg(id): string
```
