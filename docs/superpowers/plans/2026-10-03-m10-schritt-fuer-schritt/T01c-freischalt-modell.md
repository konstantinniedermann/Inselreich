> **Task-ID:** Task 1 (Paket M10-S1A) — Teil 3 von 5
> **AK-IDs:** AK-S1-01, -02, -03, -04, -05 (a, b, Strukturteil c), -10, -11, -12, -13, -14 (a, b, c1, d–g), -15, -16 (BG-1), -20 (Fixture), `RF-1`
> **blocked-by:** Gate Plan, Gate Merge M8
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md) · [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
> **Teile:** [T01a-freischalt-modell.md](T01a-freischalt-modell.md) · [T01b-freischalt-modell.md](T01b-freischalt-modell.md) · **T01c-freischalt-modell.md** (diese) · [T01d-freischalt-modell.md](T01d-freischalt-modell.md) · [T01e-freischalt-modell.md](T01e-freischalt-modell.md)

- [ ] **Schritt 3: Rot prüfen.**

```bash
npx vitest run tests/sim/unlocks.test.ts tests/sim/save.test.ts -t "M10" 2>&1 | tail -30
# erwartet: FAIL — Cannot find module '../../src/sim/defs/unlocks' bzw. '../../src/sim/unlocks'
```

- [ ] **Schritt 4: Typen und Defs.** `src/sim/types.ts`: Typen aus „Gemeinsame Schnittstellen" (ohne Task-4-Teile),
      `World.version: 5`, Felder `unlocked`, `goodLocks`, `upgradeStops` **nach** `crisis`. `src/sim/defs/unlocks.ts`:

```ts
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
    tip: 'Wohnhäuser brauchen keinen Weg, Betriebe schon: verbinde sie mit dem Kontor.',
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
    tip: 'Ein Marktplatz versorgt Wohnhäuser wie das Kontor; er braucht einen Weg.',
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
    tip: 'Die Schäferei braucht Weide im Umkreis: rode Wald (C), wenn es eng wird.',
  },
  {
    id: 'U3',
    trigger: { kind: 'tierReached', tier: 2 },
    buildings: [],
    goods: [],
    functions: ['orders'],
    lockText: 'Erst mit den ersten Siedlern',
    whenText: 'sobald die ersten Siedler einziehen',
    notice: 'die ersten Siedler sind da',
    tip: 'In der Amtsstube stellst du die Steuer ein. Aufträge am Kontor bringen eine Prämie.',
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
    tip: 'Zuckerrohr wächst wie Schafe nur mit Weide im Umkreis.',
  },
  {
    id: 'U5',
    trigger: { kind: 'tierReached', tier: 3 },
    buildings: ['toolmaker'],
    goods: [],
    functions: ['goodLocks'],
    lockText: 'Erst mit den ersten Bürgern',
    whenText: 'sobald die ersten Bürger einziehen',
    notice: 'die ersten Bürger sind da',
    tip: 'Der Werkzeugmacher arbeitet nur mit einer Schule in Reichweite. In der Amtsstube sperrst du Güter je Stufe.',
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
    tip: 'Kaufleute brauchen Glas und ein Badehaus.',
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
};
/** Eintrag je Funktion, aus UNLOCKS abgeleitet (für das Blatt-Modul townhall.ts, Entscheid B9). */
export const FUNCTION_ENTRY = Object.fromEntries(
  UNLOCKS.flatMap((u) => u.functions.map((f) => [f, u.id])),
) as Readonly<Record<UnlockFunction, UnlockId>>;
```

(Prettier formatiert die Einträge mehrzeilig; Inhalt wörtlich.)
