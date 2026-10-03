import type { BuildingDefId, UnlockDef, UnlockFunction, UnlockId } from '../types';

export const UNLOCK_IDS: readonly UnlockId[] = ['U0', 'U1', 'U2', 'U3', 'U4', 'U5', 'U6'];

/** Freischaltbaum (Spec 4.2, Texte 4.5). Reihenfolge = UNLOCK_IDS = gespeicherte Reihenfolge in world.unlocked. */
export const UNLOCKS: readonly UnlockDef[] = [
  {
    id: 'U0',
    trigger: { kind: 'start' },
    buildings: ['house', 'fisher', 'lumberjack'],
    goods: ['wood', 'tools', 'stone', 'food'],
    functions: [],
    lockText: '',
    whenText: '',
    notice: '',
    tip: 'Fischerleute gehen an Land, ohne Bildung und ohne Besitz: Dach, Holz und Fisch müssen reichen. Wohnhäuser brauchen keinen Weg, Betriebe schon: verbinde sie mit dem Kontor.',
  },
  {
    id: 'U1',
    trigger: { kind: 'houses', min: 20 },
    buildings: ['market'],
    goods: [],
    functions: [],
    lockText: 'Erst ab {min} Wohnhäusern',
    whenText: 'sobald {min} Wohnhäuser stehen',
    notice: 'deine Siedlung wächst über das Kontor hinaus',
    tip: 'Aus dem Lager am Strand wird ein Dorf. Ein Marktplatz versorgt Wohnhäuser wie das Kontor und braucht einen Weg.',
  },
  {
    id: 'U2',
    trigger: { kind: 'tierWish', tier: 2 },
    buildings: ['quarry', 'sheepfarm', 'weaver', 'chapel', 'firestation'],
    goods: ['wool', 'cloth'],
    functions: ['forest'],
    lockText: 'Erst wenn ein Wohnhaus {max} Pioniere hat',
    whenText: 'sobald ein Wohnhaus {max} Pioniere hat',
    notice: 'deine Pioniere wollen Siedler werden',
    tip: 'Die Fischer wollen mehr als Fisch: Kleidung, Glauben, feste Mauern. Die Schäferei braucht Weide im Umkreis: rode Wald (C), wenn es eng wird.',
  },
  {
    id: 'U3',
    trigger: { kind: 'tierReached', tier: 2 },
    buildings: ['townhall'],
    goods: [],
    functions: ['orders', 'upgrade2'],
    lockText: 'Erst mit den ersten Siedlern',
    whenText: 'sobald die ersten Siedler einziehen',
    notice: 'die ersten Siedler sind da',
    tip: 'Aus Siedlern wird eine Gemeinde, und Händler laufen deinen Hafen an. In der Amtsstube stellst du die Steuer ein; Aufträge am Kontor bringen eine Prämie. Betriebe lassen sich jetzt gegen Stoff ausbauen.',
  },
  {
    id: 'U4',
    trigger: { kind: 'tierWish', tier: 3 },
    buildings: ['canefarm', 'distillery', 'school'],
    goods: ['cane', 'rum'],
    functions: [],
    lockText: 'Erst wenn ein Wohnhaus {max} Siedler hat',
    whenText: 'sobald ein Wohnhaus {max} Siedler hat',
    notice: 'deine Siedler wollen Bürger werden',
    tip: 'Wer Kleidung und Glauben hat, will lesen und feiern: Schule und Rum. Zuckerrohr wächst wie Schafe nur mit Weide im Umkreis.',
  },
  {
    id: 'U5',
    trigger: { kind: 'tierReached', tier: 3 },
    buildings: ['toolmaker'],
    goods: [],
    functions: ['goodLocks', 'upgrade3'],
    lockText: 'Erst mit den ersten Bürgern',
    whenText: 'sobald die ersten Bürger einziehen',
    notice: 'die ersten Bürger sind da',
    tip: 'Gelernte Hände fertigen Werkzeug: Der Werkzeugmacher arbeitet nur mit einer Schule in Reichweite. In der Amtsstube sperrst du Güter je Stufe. Ausbau Stufe 3 kostet Rum.',
  },
  {
    id: 'U6',
    trigger: { kind: 'tierOpen', tier: 4 },
    buildings: ['bathhouse', 'glassworks'],
    goods: ['glass'],
    functions: [],
    lockText: 'Erst nach dem Ziel',
    whenText: 'nach dem Ziel ({WIN_CITIZENS} Bürger)',
    notice: 'deine Bürger wollen Kaufleute werden',
    tip: 'Bürger wollen Hygiene und helle Fenster. Kaufleute brauchen Glas und ein Badehaus.',
  },
];

/** Kette (Spec 4.2): ein Eintrag, der über seinen Auslöser frei wird, schaltet alle früheren mit frei. */
export const UNLOCK_CHAIN: readonly UnlockId[] = ['U2', 'U3', 'U4', 'U5', 'U6'];
/** Anzeige-Bedingung (Spec 4.4): bei Krisen „aus" nicht angezeigt, in der Sim baubar. */
export const ONLY_WITH_CRISES: Readonly<Partial<Record<BuildingDefId, true>>> = {
  firestation: true,
};
/** Namen der Funktionen in Meldung, Hilfe und nextUnlocks (Spec 11.6). */
export const FUNCTION_LABELS: Readonly<Record<UnlockFunction, readonly string[]>> = {
  forest: ['Roden', 'Aufforsten'],
  orders: ['Handelsaufträge'],
  goodLocks: ['Ausgabesperre'],
  upgrade2: ['Ausbau Stufe 2'],
  upgrade3: ['Ausbau Stufe 3'],
};
/** Eintrag je Funktion, aus UNLOCKS abgeleitet (für das Blatt-Modul townhall.ts, Entscheid B9). */
export const FUNCTION_ENTRY = Object.fromEntries(
  UNLOCKS.flatMap((u) => u.functions.map((f) => [f, u.id])),
) as Readonly<Record<UnlockFunction, UnlockId>>;
