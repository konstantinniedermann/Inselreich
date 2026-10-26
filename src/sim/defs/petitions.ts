import type { BuildingDefId, GoodId, Tier } from '../types';

/** I-210 Bittschrift, Spec §4. Alle Werte der Bitten stehen hier und nirgends sonst. */
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
  | { kind: 'houseTier'; tiers: readonly Tier[]; goalOpen: boolean }
  | { kind: 'chapelBelowMax' }
  | { kind: 'chapel' }
  | { kind: 'spice'; min: number }
  | { kind: 'building'; building: BuildingDefId }
  | { kind: 'goalOpen' }
  | { kind: 'stockAtLeast'; goods: readonly GoodId[]; min: number };
export interface PetitionDef {
  name: string;
  text: string;
  cost: readonly PetitionCost[];
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

/** Ware, deren Anteil an den Festkosten der Festtrunk (B5) erlässt. */
export const FEAST_VOUCHER_GOOD: GoodId = 'rum';

export const PETITIONS: Readonly<Record<PetitionId, PetitionDef>> = {
  weavers: {
    name: 'Weberfamilien',
    text: 'Weberfamilien möchten zuziehen und bitten um Stoff als Hausrat.',
    cost: [{ good: 'cloth', div: 5, min: 10, max: 40 }],
    reward: { kind: 'overcrowd', pct: OVERCROWD_PCT, tiers: [2, 3, 4] },
    delay: 4800,
    duration: 6000,
    when: { kind: 'houseTier', tiers: [2, 3, 4], goalOpen: true },
    anchor: null,
    no: 'cloth',
    noReason:
      'Genügsam bei Stoff: Wer zuzieht, braucht Hausrat und danach wie alle Nahrung und Stoff; der Lohn bringt die Folgelast selbst mit.',
    thanks: 'Die Weberfamilien ziehen ein und danken: Häuser ab Stufe 2 nehmen mehr Bewohner auf.',
    lament: 'Die Weberfamilien ziehen weiter. In der Stadt wird sparsamer mit Stoff umgegangen.',
  },
  tavern: {
    name: 'Schankrecht',
    text: 'Wirtsleute wollen eine Schenke eröffnen und brauchen Rum für den Ausschank.',
    cost: [{ good: 'rum', div: 5, min: 10, max: 40 }],
    reward: { kind: 'overcrowd', pct: OVERCROWD_PCT, tiers: [3] },
    delay: 4800,
    duration: 6000,
    when: { kind: 'houseTier', tiers: [3], goalOpen: false },
    anchor: null,
    no: 'rum',
    noReason:
      'Genügsam bei Rum: ohne Schenke wird weniger getrunken. Schankleute leben, wo Rum getrunken wird, und trinken selbst mit.',
    thanks: 'Die Schenke öffnet und die Wirtsleute danken: Bürgerhäuser nehmen mehr Bewohner auf.',
    lament:
      'Die Wirtsleute eröffnen keine Schenke. In der Stadt wird sparsamer mit Rum umgegangen.',
  },
  glaziers: {
    name: 'Glaserbitte',
    text: 'Glasermeister bitten um Glas für ihre Werkstattfenster.',
    cost: [{ good: 'glass', div: 10, min: 5, max: 20 }],
    reward: { kind: 'overcrowd', pct: OVERCROWD_PCT, tiers: [4] },
    delay: 4800,
    duration: 6000,
    when: { kind: 'houseTier', tiers: [4], goalOpen: false },
    anchor: null,
    no: 'glass',
    noReason:
      'Genügsam bei Glas: Glaser sind Kaufleute; sie brauchen, was Kaufleute brauchen, und die Stadt spart am Glas.',
    thanks: 'Die Glasermeister danken: Kaufmannshäuser nehmen mehr Bewohner auf.',
    lament: 'Die Glasermeister ziehen weiter. In der Stadt wird sparsamer mit Glas umgegangen.',
  },
  bell: {
    name: 'Glockenweihe',
    text: 'Die Gemeinde will eine Glocke weihen: Stein für den Turm, Rum für die Feier.',
    cost: [
      { good: 'rum', fixed: 10 },
      { good: 'stone', fixed: 10 },
    ],
    reward: { kind: 'upgradeWait' },
    delay: 600,
    duration: 1800,
    when: { kind: 'chapelBelowMax' },
    anchor: 'chapel',
    no: 'rum',
    noReason:
      'Genügsam bei Rum: die Gemeinde feiert schlicht. Eine geweihte Glocke zieht wie ein Fest Leute an die Kapelle; ohne Feier wird weniger Rum getrunken.',
    thanks:
      'Die Glocke ist geweiht, die Gemeinde dankt: im Kapellenkreis läuft die Aufstiegsuhr kürzer.',
    lament: 'Die Gemeinde feiert schlicht. In der Stadt wird sparsamer mit Rum umgegangen.',
  },
  feastDrink: {
    name: 'Festtrunk',
    text: 'Die Kapelle bittet um Zuckerrohr und brennt den Festtrunk selbst.',
    cost: [{ good: 'cane', fixed: 20 }],
    reward: { kind: 'feastVoucher' },
    delay: 600,
    duration: 6000,
    when: { kind: 'chapel' },
    anchor: 'chapel',
    no: 'rum',
    noReason:
      'Genügsam bei Rum: Aus Rohr wird Rum; wer das Rohr gibt, spart den Rum des nächsten Fests, wer nicht gibt, spart den Rum selbst.',
    thanks: 'Der Festtrunk ist gebrannt, die Kapelle dankt: das nächste Fest braucht keinen Rum.',
    lament: 'Die Kapelle brennt keinen Festtrunk. In der Stadt wird sparsamer mit Rum umgegangen.',
  },
  spiceSeed: {
    name: 'Gewürzsaat',
    text: 'Die Pflanzer bitten um Gewürz als Saat.',
    cost: [{ good: 'spice', fixed: 10 }],
    reward: { kind: 'cycle', pct: 80, building: 'spicefarm', homeOnly: false },
    delay: 1200,
    duration: 6000,
    when: { kind: 'spice', min: 10 },
    anchor: 'spicefarm',
    no: 'spice',
    noReason:
      'Genügsam bei Gewürz: die Kaufleute würzen sparsamer. Saat bringt Ernte, aber nur, wenn die Ernte auch heimkommt.',
    thanks: 'Die Saat geht auf, die Pflanzer danken: die Gewürzplantagen arbeiten schneller.',
    lament: 'Die Pflanzer bleiben ohne Saat. In der Stadt wird sparsamer mit Gewürz umgegangen.',
  },
  woolMarket: {
    name: 'Wollmarkt',
    text: 'Die Weber bitten um Wolle für einen Wollmarkt.',
    cost: [{ good: 'wool', fixed: 20 }],
    reward: { kind: 'cycle', pct: 80, building: 'weaver', homeOnly: true },
    delay: 600,
    duration: 3000,
    when: { kind: 'building', building: 'weaver' },
    anchor: 'weaver',
    no: 'cloth',
    noReason:
      'Genügsam bei Stoff: ein Markt bringt den Webern Aufträge; ohne Wolle stehen auch schnelle Webstühle still, und der Stoff wird sparsamer zugeteilt.',
    thanks: 'Der Wollmarkt blüht, die Weber danken: die Webereien arbeiten schneller.',
    lament: 'Der Wollmarkt fällt aus. In der Stadt wird sparsamer mit Stoff umgegangen.',
  },
  returnees: {
    name: 'Heimkehrer',
    text: 'Ausgewanderte kehren heim und bitten um Aufnahme bei Verwandten.',
    cost: [],
    reward: { kind: 'overcrowd', pct: 10, tiers: [1, 2, 3, 4] },
    delay: 2400,
    duration: 6000,
    when: { kind: 'goalOpen' },
    anchor: null,
    no: 'food',
    noReason:
      'Genügsam bei Nahrung: Wir weisen sie ab, weil die Vorräte knapp sind, und teilen die Nahrung sparsamer zu. Heimkehrer essen mit, die ganze Last liegt in der Nahrungsreserve.',
    thanks: 'Die Heimkehrer sind aufgenommen und danken: alle Häuser nehmen mehr Bewohner auf.',
    lament: 'Die Heimkehrer ziehen weiter. In der Stadt wird sparsamer mit Nahrung umgegangen.',
  },
  granary: {
    name: 'Speicherbau',
    text: 'Die Händler wollen einen Speicher bauen: Holz und Stein.',
    cost: [
      { good: 'wood', fixed: 20 },
      { good: 'stone', fixed: 10 },
    ],
    reward: { kind: 'storage', plus: 20, goods: ['cloth', 'rum', 'food'] },
    delay: 600,
    duration: 6000,
    when: { kind: 'stockAtLeast', goods: ['cloth', 'rum', 'food'], min: 90 },
    anchor: null,
    no: 'food',
    noReason:
      'Genügsam bei Nahrung: Ohne neuen Speicher wird der Vorrat geschont; die Nahrung, der grösste Posten, wird sparsamer zugeteilt.',
    thanks: 'Der Speicher steht, die Händler danken: das Lager fasst mehr Stoff, Rum und Nahrung.',
    lament: 'Der Speicher wird nicht gebaut. In der Stadt wird sparsamer mit Nahrung umgegangen.',
  },
};
