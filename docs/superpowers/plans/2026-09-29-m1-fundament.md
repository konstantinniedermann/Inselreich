# M1 Fundament — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein lauffähiges Grundgerüst: generierte Insel im Browser sichtbar, Kamera bedienbar, Wege und Gebäude nach Standortregeln platzierbar (noch ohne Kosten, Produktion, Bevölkerung).

**Architecture:** `src/sim/` ist reine, DOM-freie Logik auf einem JSON-fähigen `World`-Objekt (ADR-002). `src/render/` zeichnet den Zustand auf ein Canvas (Top-down, 32 px, ADR-003). `src/ui/` verbindet DOM-Eingaben mit Sim-Aktionen und treibt den Game-Loop mit festem 100-ms-Tick.

**Tech Stack:** TypeScript (strict), Vite, Vitest, ESLint (flat config, typescript-eslint), Prettier. Keine Laufzeit-Abhängigkeiten (ADR-001).

**Spec:** `docs/superpowers/specs/2026-09-29-inselreich-design.md` (Abschnitte 2.2, 2.4, 3, 5.1) · GitHub-Issue #1

## Global Constraints

- Keine Laufzeit-Abhängigkeiten; nur Dev-Deps: vite, typescript, vitest, eslint, @eslint/js, typescript-eslint, prettier, eslint-config-prettier. Keine weiteren Pakete ohne Freigabe.
- `src/sim/**` darf `window`, `document`, `localStorage`, `requestAnimationFrame` nicht referenzieren (ESLint `no-restricted-globals`).
- Welt-Zustand ist ein einfaches Objekt ohne Klassen, ohne Zyklen, ohne `Map`/`Set` (JSON-fähig).
- Sim-Aktionen werfen nicht, sie liefern `{ ok: true } | { ok: false; reason: string }`. Gründe auf Deutsch (CH-Schreibweise, kein ß).
- Karte 64×64, Kacheln 32 px, Terrain `water|sand|grass|forest|mountain`.
- Spielwerte exakt wie Spec 2.3, 2.4, 2.7 — sie werden in M1 als Daten angelegt, auch wenn erst später verwendet.
- UI-Sprache Deutsch (CH). Eigener Titel „Inselreich", keine fremden Assets (ADR-004).
- Commits mit Präfix `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`; Prettier/ESLint-sauber.

## Review Focus

1. **Klick am Kartenrand mit 2×2-Gebäude** (x = 63): Footprint ragt hinaus → `{ ok: false, reason: 'Ausserhalb der Karte' }`, kein Teil-Bau. (Test in Task 5)
2. **Wegkachel auf ein belegtes Gebäude / Gebäude auf eine Wegkachel**: beides abgelehnt mit „Bereits bebaut". (Test in Task 5)
3. **Seed, der die Nachbedingungen verfehlt**: Generator probiert Seed+1 usw. und terminiert; `seedUsed` wird gespeichert, damit Laden reproduzierbar ist. (Test in Task 4)
4. **Kontorposition**: Alle 4 Kontor-Kacheln sind Land, mindestens eine 4er-Nachbarkachel ist Wasser; kein Gebäude überlappt das Kontor. (Test in Task 4 und 5)
5. **Zoom und Pan ausserhalb der Karte**: Kamera wird auf Kartengrenzen geklemmt; kein NaN bei Zoom 0.5–2. (Test in Task 6)

---

### Task 1: Scaffold, Tooling, CI, Projekt-CLAUDE.md

**Files:**

- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `index.html`, `src/main.ts`, `src/style.css`, `Makefile`, `.github/workflows/ci.yml`, `CLAUDE.md`, `tests/smoke.test.ts`
- Modify: `README.md`

**Interfaces:**

- Produces: `npm run dev|build|test|lint|format`, `make help|install|dev|test|lint|format|build|check`.

- [ ] **Step 1: package.json anlegen und Dev-Deps installieren**

```json
{
  "name": "inselreich",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . && prettier --check .",
    "format": "prettier --write ."
  }
}
```

Run: `npm install -D vite typescript vitest eslint @eslint/js typescript-eslint prettier eslint-config-prettier`
(Der dep-guard-Hook prüft die Pakete gegen die Registry; alle sind etabliert.)

- [ ] **Step 2: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

- [ ] **Step 3: vite.config.ts (mit Vitest-Konfiguration)**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: { include: ['tests/**/*.test.ts'] },
});
```

- [ ] **Step 4: eslint.config.js und Prettier**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'localStorage',
        'requestAnimationFrame',
        'HTMLCanvasElement',
      ],
    },
  },
);
```

`.prettierrc`:

```json
{ "singleQuote": true, "printWidth": 100, "trailingComma": "all" }
```

`.prettierignore`:

```
dist
node_modules
package-lock.json
```

- [ ] **Step 5: index.html, style.css, main.ts (Platzhalter)**

`index.html` — Card-UI, CSS Grid, mobile-first:

```html
<!doctype html>
<html lang="de-CH">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Inselreich</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <div id="app">
      <header id="hud" class="card"></header>
      <main id="game"><canvas id="canvas"></canvas></main>
      <aside id="panel" class="card"></aside>
      <nav id="buildbar" class="card"></nav>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/style.css` — Grid-Layout; auf schmalen Screens alles untereinander, ab 900 px Panel rechts:

```css
:root {
  --bg: #1e2a38;
  --card: #2b3a4d;
  --text: #e8eef5;
  --accent: #e0a940;
  --danger: #d9534f;
}
* {
  box-sizing: border-box;
}
html,
body {
  margin: 0;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font:
    14px/1.4 system-ui,
    sans-serif;
}
#app {
  display: grid;
  height: 100%;
  gap: 8px;
  padding: 8px;
  grid-template-rows: auto 1fr auto auto;
  grid-template-areas: 'hud' 'game' 'panel' 'buildbar';
}
#hud {
  grid-area: hud;
}
#game {
  grid-area: game;
  position: relative;
  min-height: 300px;
}
#panel {
  grid-area: panel;
}
#buildbar {
  grid-area: buildbar;
}
#canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 8px;
  touch-action: none;
}
.card {
  background: var(--card);
  border-radius: 8px;
  padding: 8px;
}
@media (min-width: 900px) {
  #app {
    grid-template-columns: 1fr 280px;
    grid-template-rows: auto 1fr auto;
    grid-template-areas: 'hud hud' 'game panel' 'buildbar panel';
  }
}
```

`src/main.ts`:

```ts
const hud = document.getElementById('hud');
if (hud) hud.textContent = 'Inselreich — Grundgerüst';
```

- [ ] **Step 6: Smoke-Test, damit Vitest läuft**

`tests/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('toolchain', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: Makefile**

```make
.DEFAULT_GOAL := help
.PHONY: help install dev test lint format build check

help: ## Alle verfügbaren Befehle anzeigen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'

install: ## Dev-Abhängigkeiten installieren (npm ci)
	npm ci

dev: ## Vite-Dev-Server starten
	npm run dev

test: ## Tests ausführen (Vitest)
	npm test

lint: ## ESLint + Prettier-Check
	npm run lint

format: ## Code formatieren (Prettier)
	npm run format

build: ## Typprüfung + Produktions-Build
	npm run build

check: lint test build ## Gleich wie CI: lint, test, build
```

- [ ] **Step 8: CI-Workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: make check
```

- [ ] **Step 9: Projekt-CLAUDE.md (nur Dauerregeln, siehe Aufnahmeregel in ../CLAUDE.md)**

```markdown
# Inselreich — Claude Code Kontext

> Gemeinsame Arbeitsregeln in `../CLAUDE.md`. Für alle Aktionen → `make help`.

## Über das Projekt

Aufbau-Strategiespiel im Stil von Anno 1602 im Browser (TypeScript, Canvas 2D). Eigener Titel,
eigene Grafik, eigene Spielwerte (ADR-004).

## Architektur-Regeln

- `src/sim/` ist DOM-frei und deterministisch; Welt-Zustand ist ein JSON-fähiges Objekt (ADR-002).
- Sim-Aktionen werfen nicht; sie liefern `{ ok, reason }`.
- Spielwerte nur in `src/sim/defs/`, nirgends hart im Code.
- Keine Laufzeit-Abhängigkeiten (ADR-001).

## Test-Strategie

Vitest gegen `src/sim/`. Renderer und UI werden manuell im Browser geprüft.

## Context-Scopes

| Scope       | Pfade                                    | Wann verwenden                            |
| ----------- | ---------------------------------------- | ----------------------------------------- |
| Sim         | `src/sim/`, `tests/`                     | Spielregeln, Balancing, Bugs in der Logik |
| Render      | `src/render/`, `src/sim/types.ts`        | Darstellung, Kamera                       |
| UI          | `src/ui/`, `index.html`, `src/style.css` | Bedienung, Layout                         |
| Vollständig | alles                                    | Architektur, Querschnitt                  |

## Dokumentation

- Spec: `docs/superpowers/specs/`, Pläne: `docs/superpowers/plans/`, ADRs: `docs/adr/`
- Befunde ausserhalb des Scopes: `docs/beobachtungen.md`
```

- [ ] **Step 10: Prüfen und committen**

Run: `make check`
Expected: ESLint ohne Fehler, Prettier ohne Abweichung, 1 Test bestanden, Build in `dist/`.

```bash
git add -A && git commit -m "chore: Scaffold mit Vite, TypeScript, Vitest, ESLint, Prettier, Makefile und CI"
```

---

### Task 2: Sim-Typen und Def-Tabellen

**Files:**

- Create: `src/sim/types.ts`, `src/sim/defs/goods.ts`, `src/sim/defs/buildings.ts`, `src/sim/defs/tiers.ts`
- Test: `tests/sim/defs.test.ts`

**Interfaces:**

- Produces (types.ts):

```ts
export type GoodId = 'wood' | 'tools' | 'stone' | 'food' | 'wool' | 'cloth' | 'cane' | 'rum';
export type Terrain = 'water' | 'sand' | 'grass' | 'forest' | 'mountain';
export type BuildingDefId =
  | 'kontor'
  | 'market'
  | 'house'
  | 'fisher'
  | 'lumberjack'
  | 'quarry'
  | 'sheepfarm'
  | 'weaver'
  | 'canefarm'
  | 'distillery'
  | 'chapel'
  | 'school';
export type ServiceId = 'faith' | 'school';
export type Category = 'infrastructure' | 'housing' | 'production' | 'public';
export interface Cost {
  money: number;
  wood: number;
  tools: number;
  stone: number;
}
export type SiteRule =
  | { kind: 'coast' } // ≥1 Wasserkachel 4er-angrenzend
  | { kind: 'adjacent'; terrain: Terrain; min: number } // ≥min Kacheln des Terrains 4er-angrenzend
  | { kind: 'radius'; terrain: Terrain; radius: number; min: number } // ≥min Kacheln im Radius
  | { kind: 'supply' }; // im Radius von Kontor oder Markt
export interface BuildingDef {
  id: BuildingDefId;
  name: string;
  w: number;
  h: number;
  cost: Cost;
  upkeep: number;
  category: Category;
  produces?: GoodId;
  consumes?: GoodId;
  cycle?: number;
  service?: ServiceId;
  serviceRadius?: number;
  supplyRadius?: number;
  site: SiteRule[];
}
export interface GoodDef {
  id: GoodId;
  name: string;
  buy: number;
  sell: number;
}
export type Tier = 1 | 2 | 3;
export interface TierDef {
  tier: Tier;
  name: string;
  maxInhabitants: number;
  needs: Partial<Record<GoodId, number>>; // Verbrauch je Einwohner pro 100 Ticks
  services: ServiceId[];
  tax: number; // Steuer je Einwohner pro 100 Ticks
  upgradeCost: Cost | null; // Kosten für Aufstieg auf tier+1
}
export type BuildingState = 'ok' | 'waitingInput' | 'storageFull' | 'notConnected';
export interface HouseState {
  tier: Tier;
  inhabitants: number;
  demand: Partial<Record<GoodId, number>>;
  satisfied: Partial<Record<GoodId, boolean>>;
  satisfiedSince: number;
  supplied: boolean;
}
export interface Building {
  id: number;
  defId: BuildingDefId;
  x: number;
  y: number;
  connected: boolean;
  progress: number;
  state: BuildingState;
  house?: HouseState;
}
export interface Tile {
  terrain: Terrain;
  buildingId: number | null;
  road: boolean;
}
export interface World {
  version: 1;
  seed: number;
  width: number;
  height: number;
  tick: number;
  tiles: Tile[];
  buildings: Record<number, Building>;
  nextBuildingId: number;
  kontorId: number;
  stock: Record<GoodId, number>;
  money: number;
  stats: { taxes: number; upkeep: number };
  won: boolean;
}
export type Result = { ok: true } | { ok: false; reason: string };
export const ok: Result = { ok: true };
export const fail = (reason: string): Result => ({ ok: false, reason });
```

- Produces (defs): `GOODS: Record<GoodId, GoodDef>`, `GOOD_IDS: GoodId[]`, `BUILDING_DEFS: Record<BuildingDefId, BuildingDef>`, `BUILDING_IDS: BuildingDefId[]`, `ROAD_COST = 5`, `TIERS: Record<Tier, TierDef>`, `STORAGE_CAP = 100`, `START_MONEY = 5000`, `START_STOCK: Record<GoodId, number>`, `WIN_CITIZENS = 50`.

- [ ] **Step 1: Failing test schreiben**

`tests/sim/defs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS, BUILDING_IDS, ROAD_COST } from '../../src/sim/defs/buildings';
import { GOODS, GOOD_IDS } from '../../src/sim/defs/goods';
import { TIERS } from '../../src/sim/defs/tiers';

describe('defs', () => {
  it('has 8 goods with buy > sell', () => {
    expect(GOOD_IDS).toHaveLength(8);
    for (const id of GOOD_IDS) expect(GOODS[id].buy).toBeGreaterThan(GOODS[id].sell);
  });
  it('has 12 building defs whose goods exist', () => {
    expect(BUILDING_IDS).toHaveLength(12);
    for (const id of BUILDING_IDS) {
      const d = BUILDING_DEFS[id];
      expect(d.id).toBe(id);
      if (d.produces) expect(GOODS[d.produces]).toBeDefined();
      if (d.consumes) expect(GOODS[d.consumes]).toBeDefined();
      if (d.produces) expect(d.cycle).toBeGreaterThan(0);
    }
    expect(ROAD_COST).toBe(5);
  });
  it('matches the spec values for a few buildings', () => {
    expect(BUILDING_DEFS.fisher).toMatchObject({
      w: 1,
      h: 1,
      cycle: 40,
      produces: 'food',
      upkeep: 5,
    });
    expect(BUILDING_DEFS.distillery).toMatchObject({
      consumes: 'cane',
      produces: 'rum',
      cost: { money: 250, wood: 15, tools: 4, stone: 5 },
    });
    expect(BUILDING_DEFS.chapel).toMatchObject({ service: 'faith', serviceRadius: 10 });
    expect(BUILDING_DEFS.market.supplyRadius).toBe(8);
    expect(BUILDING_DEFS.kontor.supplyRadius).toBe(8);
  });
  it('tiers escalate', () => {
    expect(TIERS[1]).toMatchObject({
      maxInhabitants: 4,
      tax: 2,
      needs: { food: 0.5 },
      services: [],
    });
    expect(TIERS[2]).toMatchObject({ maxInhabitants: 8, tax: 3, services: ['faith'] });
    expect(TIERS[3]).toMatchObject({
      maxInhabitants: 15,
      tax: 5,
      services: ['faith', 'school'],
      upgradeCost: null,
    });
    expect(TIERS[2].upgradeCost).toEqual({ money: 300, wood: 10, tools: 5, stone: 5 });
  });
});
```

- [ ] **Step 2: Test laufen lassen** — Run: `npx vitest run tests/sim/defs.test.ts` — Expected: FAIL (Module fehlen).

- [ ] **Step 3: types.ts wie oben, dann die Tabellen exakt nach Spec 2.3/2.4/2.7**

`src/sim/defs/goods.ts`:

```ts
import type { GoodDef, GoodId } from '../types';
export const GOODS: Record<GoodId, GoodDef> = {
  wood: { id: 'wood', name: 'Holz', buy: 10, sell: 4 },
  tools: { id: 'tools', name: 'Werkzeug', buy: 40, sell: 15 },
  stone: { id: 'stone', name: 'Stein', buy: 15, sell: 6 },
  food: { id: 'food', name: 'Nahrung', buy: 8, sell: 3 },
  wool: { id: 'wool', name: 'Wolle', buy: 12, sell: 5 },
  cloth: { id: 'cloth', name: 'Stoff', buy: 30, sell: 12 },
  cane: { id: 'cane', name: 'Zuckerrohr', buy: 12, sell: 5 },
  rum: { id: 'rum', name: 'Rum', buy: 40, sell: 18 },
};
export const GOOD_IDS = Object.keys(GOODS) as GoodId[];
export const STORAGE_CAP = 100;
export const START_MONEY = 5000;
export const START_STOCK: Record<GoodId, number> = {
  wood: 40,
  tools: 20,
  stone: 10,
  food: 20,
  wool: 0,
  cloth: 0,
  cane: 0,
  rum: 0,
};
```

`src/sim/defs/buildings.ts` — Hilfsfunktion `cost(money, wood, tools, stone)`; alle 12 Einträge aus Spec-Tabelle 2.4; Standortregeln:

```ts
kontor: site: [{ kind: 'coast' }]                  (w 2, h 2, cost 0, supplyRadius 8, category 'infrastructure')
market: site: []                                    (supplyRadius 8)
house:  site: [{ kind: 'supply' }]                  (category 'housing')
fisher: site: [{ kind: 'coast' }]
lumberjack: site: [{ kind: 'radius', terrain: 'forest', radius: 2, min: 1 }]
quarry: site: [{ kind: 'adjacent', terrain: 'mountain', min: 1 }]
sheepfarm, canefarm: site: [{ kind: 'radius', terrain: 'grass', radius: 2, min: 4 }]
weaver, distillery, chapel, school: site: []
chapel: service 'faith', serviceRadius 10 · school: service 'school', serviceRadius 10 (category 'public')
export const BUILDING_IDS = Object.keys(BUILDING_DEFS) as BuildingDefId[];
export const ROAD_COST = 5;
```

`src/sim/defs/tiers.ts`:

```ts
export const TIERS: Record<Tier, TierDef> = {
  1: {
    tier: 1,
    name: 'Pioniere',
    maxInhabitants: 4,
    needs: { food: 0.5 },
    services: [],
    tax: 2,
    upgradeCost: { money: 100, wood: 5, tools: 2, stone: 0 },
  },
  2: {
    tier: 2,
    name: 'Siedler',
    maxInhabitants: 8,
    needs: { food: 0.5, cloth: 0.25 },
    services: ['faith'],
    tax: 3,
    upgradeCost: { money: 300, wood: 10, tools: 5, stone: 5 },
  },
  3: {
    tier: 3,
    name: 'Bürger',
    maxInhabitants: 15,
    needs: { food: 0.5, cloth: 0.25, rum: 0.25 },
    services: ['faith', 'school'],
    tax: 5,
    upgradeCost: null,
  },
};
export const WIN_CITIZENS = 50;
```

- [ ] **Step 4: Test grün** — Run: `npx vitest run tests/sim/defs.test.ts` — Expected: 4 passed.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: Sim-Typen und Def-Tabellen für Güter, Gebäude und Stufen"`

---

### Task 3: Seeded RNG und Value-Noise

**Files:**

- Create: `src/sim/rng.ts`, `src/sim/noise.ts`
- Test: `tests/sim/rng.test.ts`

**Interfaces:**

- Produces: `createRng(seed: number): () => number` (mulberry32, liefert [0,1)); `hash2(seed: number, x: number, y: number): number` ([0,1), deterministisch pro Koordinate); `valueNoise(seed: number, x: number, y: number): number` (bilinear interpoliert, [0,1]).

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/sim/rng';
import { hash2, valueNoise } from '../../src/sim/noise';

describe('rng', () => {
  it('is deterministic and in [0,1)', () => {
    const a = createRng(42),
      b = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('differs by seed', () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });
});
describe('noise', () => {
  it('hash2 is deterministic per coordinate', () => {
    expect(hash2(7, 3, 4)).toBe(hash2(7, 3, 4));
    expect(hash2(7, 3, 4)).not.toBe(hash2(7, 4, 3));
  });
  it('valueNoise is continuous-ish and bounded', () => {
    for (let i = 0; i < 200; i++) {
      const v = valueNoise(3, i * 0.37, i * 0.11);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(Math.abs(valueNoise(3, 5.0, 5.0) - valueNoise(3, 5.01, 5.0))).toBeLessThan(0.05);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implementieren**

`src/sim/rng.ts`:

```ts
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

`src/sim/noise.ts`:

```ts
export function hash2(seed: number, x: number, y: number): number {
  let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const smooth = (t: number) => t * t * (3 - 2 * t);
export function valueNoise(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x),
    y0 = Math.floor(y);
  const tx = smooth(x - x0),
    ty = smooth(y - y0);
  const a = hash2(seed, x0, y0),
    b = hash2(seed, x0 + 1, y0);
  const c = hash2(seed, x0, y0 + 1),
    d = hash2(seed, x0 + 1, y0 + 1);
  return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
}
```

- [ ] **Step 4: Run, expect PASS.** — [ ] **Step 5: Commit** `feat: seeded RNG und Value-Noise`

---

### Task 4: Mapgen und World

**Files:**

- Create: `src/sim/mapgen.ts`, `src/sim/world.ts`
- Test: `tests/sim/mapgen.test.ts`

**Interfaces:**

- Produces (mapgen.ts): `MAP_W = 64`, `MAP_H = 64`; `generateTerrain(seed: number, w: number, h: number): Terrain[]`; `findKontorSite(terrain: Terrain[], w: number, h: number): { x: number; y: number } | null`; `generateMap(seed: number): { terrain: Terrain[]; kontor: { x: number; y: number }; seedUsed: number }` (probiert seed, seed+1, … bis Nachbedingungen aus Spec 2.2 erfüllt; max. 50 Versuche, danach wirft es — das ist der einzige erlaubte `throw`, weil er einen Programmierfehler anzeigt).
- Produces (world.ts): `createWorld(seed: number): World` (setzt `seed = seedUsed`, Kontor als Building mit `connected: true`, `stock = START_STOCK`, `money = START_MONEY`); `idx(world, x, y): number`; `inBounds(world, x, y): boolean`; `tileAt(world, x, y): Tile | undefined`; `footprint(def: BuildingDef, x: number, y: number): { x: number; y: number }[]`; `adjacentOf(world, x, y, w, h): { x: number; y: number }[]` (4er-Rand um den Footprint, nur in-bounds); `tilesInRadius(world, cx, cy, r): { x: number; y: number }[]` (euklidisch ≤ r vom Mittelpunkt); `center(def, x, y): { cx: number; cy: number }` (= x + w/2, y + h/2); `isLand(t: Terrain): boolean` (sand|grass|forest); `buildingsOfType(world, defId): Building[]`.

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from 'vitest';
import { generateMap, MAP_H, MAP_W } from '../../src/sim/mapgen';
import { createWorld, tileAt, adjacentOf, isLand } from '../../src/sim/world';

const count = (t: string[], k: string) => t.filter((x) => x === k).length;

describe('generateMap', () => {
  it('is deterministic', () => {
    expect(generateMap(1)).toEqual(generateMap(1));
  });
  it('fulfils the postconditions for many seeds', () => {
    for (let s = 1; s <= 20; s++) {
      const m = generateMap(s);
      expect(m.terrain).toHaveLength(MAP_W * MAP_H);
      const land = m.terrain.filter(isLand).length;
      expect(land).toBeGreaterThanOrEqual(800);
      expect(count(m.terrain, 'forest')).toBeGreaterThanOrEqual(40);
      expect(count(m.terrain, 'mountain')).toBeGreaterThanOrEqual(10);
      expect(m.seedUsed).toBeGreaterThanOrEqual(s);
    }
  });
  it('keeps the border water', () => {
    const m = generateMap(5);
    for (let x = 0; x < MAP_W; x++) {
      expect(m.terrain[x]).toBe('water');
      expect(m.terrain[(MAP_H - 1) * MAP_W + x]).toBe('water');
    }
  });
});

describe('createWorld', () => {
  it('places the kontor on land next to water', () => {
    const w = createWorld(3);
    const k = w.buildings[w.kontorId]!;
    expect(k.defId).toBe('kontor');
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++) {
        const t = tileAt(w, k.x + dx, k.y + dy)!;
        expect(isLand(t.terrain)).toBe(true);
        expect(t.buildingId).toBe(k.id);
      }
    const waterAdj = adjacentOf(w, k.x, k.y, 2, 2).some(
      (p) => tileAt(w, p.x, p.y)!.terrain === 'water',
    );
    expect(waterAdj).toBe(true);
    expect(w.money).toBe(5000);
    expect(w.stock.wood).toBe(40);
    expect(w.seed).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: mapgen.ts implementieren**

Algorithmus (Werte sind Startwerte; falls die Nachbedingungen für die 20 Test-Seeds nicht durchgehend ohne Retry erreichbar sind, Schwellen anpassen — der Retry deckt den Rest):

```ts
export function generateTerrain(seed: number, w: number, h: number): Terrain[] {
  const out: Terrain[] = new Array(w * h);
  const cx = (w - 1) / 2,
    cy = (h - 1) / 2,
    R = Math.min(w, h) / 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const e =
        0.6 * valueNoise(seed, x / 14, y / 14) +
        0.3 * valueNoise(seed + 1, x / 6, y / 6) +
        0.1 * valueNoise(seed + 2, x / 3, y / 3);
      const d = Math.hypot(x - cx, y - cy) / R; // 0 Mitte … ~1.4 Ecke
      const height = e * (1.15 - d * d); // Inselmaske
      const isBorder = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      let t: Terrain;
      if (isBorder || height < 0.3) t = 'water';
      else if (height < 0.36) t = 'sand';
      else if (height > 0.75) t = 'mountain';
      else if (valueNoise(seed + 3, x / 5, y / 5) > 0.62) t = 'forest';
      else t = 'grass';
      out[y * w + x] = t;
    }
  return out;
}
```

`findKontorSite`: alle (x,y) mit 2×2-Footprint komplett Land, ≥1 Wasserkachel im 4er-Rand; wähle den Kandidaten mit kleinstem Abstand zur Kartenmitte; `null` falls keiner.
`generateMap`: Schleife über `seed + i` (i < 50): terrain erzeugen, Nachbedingungen prüfen (Land ≥ 800, Wald ≥ 40, Gebirge ≥ 10, Kontor-Site vorhanden) → zurückgeben.

- [ ] **Step 4: world.ts implementieren** (Helfer wie in Interfaces; `createWorld` legt `tiles` aus `terrain` an, `buildings = { 1: kontor }`, `nextBuildingId = 2`, `kontorId = 1`, markiert die 4 Kontor-Kacheln mit `buildingId: 1`, `stats: { taxes: 0, upkeep: 0 }`, `won: false`, `tick: 0`, `version: 1`).
- [ ] **Step 5: Run, expect PASS** (auch `make lint`).
- [ ] **Step 6: Commit** `feat: Inselgenerator mit Nachbedingungen und Welt-Initialisierung`

---

### Task 5: Placement und Build

**Files:**

- Create: `src/sim/placement.ts`, `src/sim/build.ts`
- Test: `tests/sim/placement.test.ts`

**Interfaces:**

- Produces (placement.ts): `canPlaceRoad(world, x, y): Result`; `canPlace(world, defId, x, y): Result`. Gründe: `'Ausserhalb der Karte'`, `'Kein Bauland'`, `'Bereits bebaut'`, `'Braucht Wasser angrenzend'`, `'Braucht Gebirge angrenzend'`, `'Zu wenig Wald in der Nähe'`, `'Zu wenig Weide in der Nähe'`, `'Ausserhalb der Versorgung'`. Reihenfolge der Prüfung: Karte → Bauland/bebaut → Standortregeln. `supply` prüft Abstand zu Mittelpunkt von Kontor **oder irgendeinem Markt** (angebunden oder nicht — Versorgung selbst prüft M3 mit Anbindung).
- Produces (build.ts): `placeRoad(world, x, y): Result`; `removeRoad(world, x, y): Result` (`'Kein Weg'`); `placeBuilding(world, defId, x, y): Result & { id?: number }` (legt Building an; bei `house` mit `house: { tier: 1, inhabitants: 1, demand: {}, satisfied: {}, satisfiedSince: 0, supplied: false }`; `connected: false` ausser kontor); `demolish(world, id): Result` (`'Kontor kann nicht abgerissen werden'`, `'Gebäude nicht gefunden'`; gibt Kacheln frei). **Keine Kosten in M1** — M2 ergänzt Bezahlen und Refund.

- [ ] **Step 1: Failing tests** (Testwelt: `createWorld(3)`; für Terrainregeln Kacheln direkt setzen, z. B. `w.tiles[idx(w,x,y)].terrain = 'forest'` — die Tests bauen sich eine bekannte 10×10-Landfläche ohne Gebäude, indem sie eine freie Landregion suchen: Helfer `findLandRect(w, size)` im Test)

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { createWorld, idx, tileAt } from '../../src/sim/world';
import { canPlace, canPlaceRoad } from '../../src/sim/placement';
import { placeBuilding, placeRoad, removeRoad, demolish } from '../../src/sim/build';
import type { World } from '../../src/sim/types';

function landRect(w: World, size: number): { x: number; y: number } {
  for (let y = 1; y < w.height - size; y++)
    for (let x = 1; x < w.width - size; x++) {
      let ok = true;
      for (let dy = 0; dy < size && ok; dy++)
        for (let dx = 0; dx < size; dx++) {
          const t = tileAt(w, x + dx, y + dy)!;
          if (t.terrain !== 'grass' || t.buildingId !== null) {
            ok = false;
            break;
          }
        }
      if (ok) return { x, y };
    }
  throw new Error('no land rect');
}

let w: World;
let o: { x: number; y: number };
beforeEach(() => {
  w = createWorld(3);
  o = landRect(w, 8);
});

describe('placement basics', () => {
  it('rejects out of map incl. footprint overhang', () => {
    expect(canPlace(w, 'market', 63, 10)).toEqual({ ok: false, reason: 'Ausserhalb der Karte' });
    expect(canPlaceRoad(w, -1, 0).ok).toBe(false);
  });
  it('rejects water and mountain', () => {
    expect(canPlaceRoad(w, 0, 0)).toEqual({ ok: false, reason: 'Kein Bauland' });
    w.tiles[idx(w, o.x, o.y)]!.terrain = 'mountain';
    expect(canPlace(w, 'weaver', o.x, o.y)).toEqual({ ok: false, reason: 'Kein Bauland' });
  });
  it('rejects overlap with buildings and roads both ways', () => {
    expect(placeBuilding(w, 'weaver', o.x, o.y).ok).toBe(true);
    expect(canPlaceRoad(w, o.x + 1, o.y + 1)).toEqual({ ok: false, reason: 'Bereits bebaut' });
    expect(placeRoad(w, o.x + 3, o.y).ok).toBe(true);
    expect(canPlace(w, 'weaver', o.x + 3, o.y)).toEqual({ ok: false, reason: 'Bereits bebaut' });
    const k = w.buildings[w.kontorId]!;
    expect(canPlace(w, 'weaver', k.x, k.y)).toEqual({ ok: false, reason: 'Bereits bebaut' });
  });
});

describe('site rules', () => {
  it('fisher needs water adjacent', () => {
    expect(canPlace(w, 'fisher', o.x + 2, o.y + 2)).toEqual({
      ok: false,
      reason: 'Braucht Wasser angrenzend',
    });
    w.tiles[idx(w, o.x + 3, o.y + 2)]!.terrain = 'water';
    expect(canPlace(w, 'fisher', o.x + 2, o.y + 2).ok).toBe(true);
  });
  it('lumberjack needs forest within radius 2', () => {
    expect(canPlace(w, 'lumberjack', o.x + 4, o.y + 4)).toEqual({
      ok: false,
      reason: 'Zu wenig Wald in der Nähe',
    });
    w.tiles[idx(w, o.x + 6, o.y + 4)]!.terrain = 'forest';
    expect(canPlace(w, 'lumberjack', o.x + 4, o.y + 4).ok).toBe(true);
  });
  it('quarry needs mountain adjacent', () => {
    expect(canPlace(w, 'quarry', o.x + 4, o.y + 4)).toEqual({
      ok: false,
      reason: 'Braucht Gebirge angrenzend',
    });
    w.tiles[idx(w, o.x + 5, o.y + 4)]!.terrain = 'mountain';
    expect(canPlace(w, 'quarry', o.x + 4, o.y + 4).ok).toBe(true);
  });
  it('sheepfarm needs 4 grass within radius 2 of its centre', () => {
    expect(canPlace(w, 'sheepfarm', o.x + 2, o.y + 2).ok).toBe(true);
    for (let dy = -2; dy < 5; dy++)
      for (let dx = -2; dx < 5; dx++) w.tiles[idx(w, o.x + 2 + dx, o.y + 2 + dy)]!.terrain = 'sand';
    expect(canPlace(w, 'sheepfarm', o.x + 2, o.y + 2)).toEqual({
      ok: false,
      reason: 'Zu wenig Weide in der Nähe',
    });
  });
  it('house needs kontor or market within radius 8', () => {
    const k = w.buildings[w.kontorId]!;
    // o liegt möglicherweise nahe am Kontor; wähle eine Kachel garantiert weit weg
    const far = { x: k.x > 32 ? o.x : o.x + 6, y: o.y + 6 };
    const dist = Math.hypot(far.x + 0.5 - (k.x + 1), far.y + 0.5 - (k.y + 1));
    const res = canPlace(w, 'house', far.x, far.y);
    if (dist > 8) expect(res).toEqual({ ok: false, reason: 'Ausserhalb der Versorgung' });
    else expect(res.ok).toBe(true);
    expect(placeBuilding(w, 'market', o.x, o.y).ok).toBe(true);
    expect(canPlace(w, 'house', o.x + 3, o.y + 3).ok).toBe(true);
  });
});

describe('build/demolish', () => {
  it('marks tiles and frees them again', () => {
    const r = placeBuilding(w, 'chapel', o.x, o.y);
    expect(r.ok).toBe(true);
    const id = (r as { id: number }).id;
    expect(tileAt(w, o.x + 1, o.y + 1)!.buildingId).toBe(id);
    expect(w.buildings[id]!.connected).toBe(false);
    expect(demolish(w, id).ok).toBe(true);
    expect(tileAt(w, o.x + 1, o.y + 1)!.buildingId).toBeNull();
    expect(w.buildings[id]).toBeUndefined();
    expect(demolish(w, w.kontorId)).toEqual({
      ok: false,
      reason: 'Kontor kann nicht abgerissen werden',
    });
    expect(demolish(w, 999)).toEqual({ ok: false, reason: 'Gebäude nicht gefunden' });
  });
  it('creates house state', () => {
    const r = placeBuilding(w, 'house', w.buildings[w.kontorId]!.x + 3, w.buildings[w.kontorId]!.y);
    if (r.ok)
      expect(w.buildings[(r as { id: number }).id]!.house).toMatchObject({
        tier: 1,
        inhabitants: 1,
      });
  });
  it('roads add and remove', () => {
    expect(placeRoad(w, o.x, o.y).ok).toBe(true);
    expect(tileAt(w, o.x, o.y)!.road).toBe(true);
    expect(removeRoad(w, o.x, o.y).ok).toBe(true);
    expect(removeRoad(w, o.x, o.y)).toEqual({ ok: false, reason: 'Kein Weg' });
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: placement.ts** — `checkGround(world, x, y, w, h): Result` (Karte, Land, frei), dann je `SiteRule`:
  - `coast`: `adjacentOf(...)` enthält Wasser.
  - `adjacent`: Zähle Terrain im `adjacentOf` ≥ min.
  - `radius`: Zähle Terrain in `tilesInRadius(world, cx, cy, r)` ≥ min (cx, cy = `center(def, x, y)`).
  - `supply`: existiert Kontor/Markt `b` mit `hypot(cx - bcx, cy - bcy) <= supplyRadius`.
- [ ] **Step 4: build.ts** wie in Interfaces; `placeBuilding` ruft `canPlace` und lehnt ab, wenn nicht ok.
- [ ] **Step 5: Run, expect PASS.** — [ ] **Step 6: Commit** `feat: Standortregeln, Platzieren und Abreissen von Wegen und Gebäuden`

---

### Task 6: Kamera, Terrain-Layer, Sprites, Renderer

**Files:**

- Create: `src/render/camera.ts`, `src/render/terrain.ts`, `src/render/sprites.ts`, `src/render/renderer.ts`
- Test: `tests/render/camera.test.ts` (Kamera ist reine Mathematik, ohne DOM)

**Interfaces:**

- Produces (camera.ts): `TILE = 32`; `interface Camera { x: number; y: number; zoom: number }` (x/y = Welt-Pixel links oben); `createCamera(): Camera` (`zoom: 1`); `clampCamera(cam, worldW, worldH, viewW, viewH): void`; `zoomAt(cam, factor, screenX, screenY, viewW, viewH, worldW, worldH): void` (Zoom 0.5–2, Punkt unter Cursor bleibt fix); `screenToTile(cam, sx, sy): { x: number; y: number }` (floor); `tileToScreen(cam, tx, ty): { x: number; y: number }`.
- Produces (terrain.ts): `buildTerrainLayer(world: World): HTMLCanvasElement` (Offscreen-Canvas `width*TILE × height*TILE`; Farben: water `#2f6f9f`, sand `#d8c78a`, grass `#6aa84f`, forest `#3d7a3a` mit 2–3 dunkleren Kreisen, mountain `#8b8b8b` mit hellem Dreieck; Details deterministisch via `hash2(seed, x, y)`).
- Produces (sprites.ts): `BUILDING_COLORS: Record<Category, string>` (infrastructure `#c9a227`, housing `#b5651d`, production `#4a7fb5`, public `#8e5ab8`); `BUILDING_ABBR: Record<BuildingDefId, string>` (z. B. kontor `K`, market `M`, house `H`, fisher `Fi`, lumberjack `Ho`, quarry `St`, sheepfarm `Sc`, weaver `We`, canefarm `Zu`, distillery `Br`, chapel `Ka`, school `Su`); `drawBuilding(ctx, def, b, px, py, s)` (Rechteck mit Rand, Abkürzung zentriert; wenn `!b.connected && def.id !== 'house' && def.id !== 'kontor'` roter Punkt oben rechts); `drawRoad(ctx, px, py, s, n: { n: boolean; e: boolean; s: boolean; w: boolean })` (brauner Kachelgrund `#a0865a` mit hellerer Linie zu den Nachbarn).
- Produces (renderer.ts): `interface Hover { x: number; y: number; tool: Tool | null; ok: boolean }`; `type Tool = { kind: 'select' } | { kind: 'build'; defId: BuildingDefId } | { kind: 'road' } | { kind: 'demolish' }`; `render(ctx, world, cam, terrainLayer, hover: Hover | null, selectedId: number | null): void` — zeichnet Terrain-Ausschnitt (`drawImage` mit Quell-Rechteck), Wege, Gebäude, Auswahlrahmen (gelb), Hover-Vorschau (grün `rgba(0,255,0,.35)` / rot `rgba(255,0,0,.35)` über dem Footprint).

- [ ] **Step 1: Failing test (Kamera)**

```ts
import { describe, expect, it } from 'vitest';
import {
  createCamera,
  clampCamera,
  zoomAt,
  screenToTile,
  tileToScreen,
  TILE,
} from '../../src/render/camera';

describe('camera', () => {
  it('round-trips tile <-> screen', () => {
    const c = createCamera();
    c.x = 100;
    c.y = 50;
    c.zoom = 1.5;
    const s = tileToScreen(c, 10, 7);
    expect(screenToTile(c, s.x + 1, s.y + 1)).toEqual({ x: 10, y: 7 });
  });
  it('clamps to world bounds', () => {
    const c = createCamera();
    c.x = -500;
    c.y = 99999;
    clampCamera(c, 64 * TILE, 64 * TILE, 800, 600);
    expect(c.x).toBe(0);
    expect(c.y).toBe(64 * TILE - 600);
  });
  it('zoom stays within 0.5..2 and never NaN', () => {
    const c = createCamera();
    for (let i = 0; i < 20; i++) zoomAt(c, 1.25, 400, 300, 800, 600, 64 * TILE, 64 * TILE);
    expect(c.zoom).toBe(2);
    for (let i = 0; i < 40; i++) zoomAt(c, 0.8, 400, 300, 800, 600, 64 * TILE, 64 * TILE);
    expect(c.zoom).toBe(0.5);
    expect(Number.isNaN(c.x)).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.** — [ ] **Step 3: camera.ts implementieren**

```ts
export const TILE = 32;
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}
export const createCamera = (): Camera => ({ x: 0, y: 0, zoom: 1 });
export function clampCamera(
  c: Camera,
  worldW: number,
  worldH: number,
  viewW: number,
  viewH: number,
): void {
  const maxX = Math.max(0, worldW - viewW / c.zoom),
    maxY = Math.max(0, worldH - viewH / c.zoom);
  c.x = Math.min(Math.max(0, c.x), maxX);
  c.y = Math.min(Math.max(0, c.y), maxY);
}
export function zoomAt(
  c: Camera,
  f: number,
  sx: number,
  sy: number,
  vw: number,
  vh: number,
  ww: number,
  wh: number,
): void {
  const nz = Math.min(2, Math.max(0.5, c.zoom * f));
  const wx = c.x + sx / c.zoom,
    wy = c.y + sy / c.zoom; // Weltpunkt unter Cursor
  c.zoom = nz;
  c.x = wx - sx / nz;
  c.y = wy - sy / nz;
  clampCamera(c, ww, wh, vw, vh);
}
export const screenToTile = (c: Camera, sx: number, sy: number) => ({
  x: Math.floor((c.x + sx / c.zoom) / TILE),
  y: Math.floor((c.y + sy / c.zoom) / TILE),
});
export const tileToScreen = (c: Camera, tx: number, ty: number) => ({
  x: (tx * TILE - c.x) * c.zoom,
  y: (ty * TILE - c.y) * c.zoom,
});
```

- [ ] **Step 4: terrain.ts, sprites.ts, renderer.ts** nach Interfaces. Renderer-Ablauf pro Frame: `ctx.clearRect`; `drawImage(layer, cam.x, cam.y, vw/zoom, vh/zoom, 0, 0, vw, vh)`; für jede sichtbare Kachel mit `road` → `drawRoad`; für jedes Building (Map über `Object.values(world.buildings)`) → `drawBuilding` an `tileToScreen`; Auswahl; Hover.
- [ ] **Step 5: Run alle Tests + `make lint build`, expect PASS.** — [ ] **Step 6: Commit** `feat: Kamera, Terrain-Layer, prozedurale Sprites und Renderer`

---

### Task 7: UI-Bootstrap, Game-Loop, Eingabe, Bauleiste

**Files:**

- Create: `src/ui/app.ts`, `src/ui/input.ts`, `src/ui/buildMenu.ts`, `src/ui/hud.ts`, `src/ui/messages.ts`
- Modify: `src/main.ts`, `src/style.css` (Buttons), `README.md` (Start-Anleitung)
- Create: `src/sim/tick.ts` (M1: nur `world.tick++`; M2/M3 füllen die Systeme ein)

**Interfaces:**

- Produces (tick.ts): `step(world: World): void`.
- Produces (app.ts): `interface GameState { world: World; cam: Camera; tool: Tool; speed: 0 | 1 | 2 | 4; hover: Hover | null; selectedId: number | null; terrainLayer: HTMLCanvasElement }`; `startGame(root: HTMLElement, seed?: number): GameState` — erstellt Welt (`seed ?? Date.now() % 100000`), zentriert Kamera auf das Kontor, startet `requestAnimationFrame`-Loop mit Akkumulator (`TICK_MS = 100`, max 20 Ticks/Frame), Canvas-Grösse an `#game` anpassen (`ResizeObserver`, `devicePixelRatio` beachten), ruft `render` jeden Frame, `updateHud` alle 10 Frames. Laufzeitfehler im Loop → `showMessage(err.message, 'error')`, Loop stoppt.
- Produces (input.ts): `bindInput(canvas, state, onAction)`: linke Maustaste — bei `tool.kind === 'select'` Klick wählt Gebäude (`selectedId`), Drag pannt; bei `build`/`road`/`demolish` Klick führt Aktion aus (bei `road` auch Ziehen: jede neu überstrichene Kachel); rechte Maustaste oder Esc → `select`; mittlere Maustaste / Leertaste+Drag → pan; Rad → `zoomAt`; WASD/Pfeile → pan 16 px/Frame bei gedrückter Taste. `pointermove` setzt `state.hover` inkl. `ok` via `canPlace`/`canPlaceRoad`.
- Produces (buildMenu.ts): `renderBuildMenu(nav, state, onSelect)` — Buttons: „Auswahl", „Weg (5)", „Abriss", dann alle `BUILDING_IDS` ausser `kontor` gruppiert nach `category` mit Name und Kosten (`G 100 · H 5 · W 2`); aktiver Button `.active`.
- Produces (hud.ts): `updateHud(header, state)` — zeigt Geld, Tick, Geschwindigkeit; Buttons ⏸ 1× 2× 4× (setzen `state.speed`).
- Produces (messages.ts): `showMessage(text: string, kind: 'info' | 'error' = 'info')` — Toast oben im `#game`, verschwindet nach 3 s; `bindMessages(container)`.
- Aktionen: `onAction` in app.ts: `build` → `placeBuilding`, bei `!ok` `showMessage(reason, 'error')`; `road` → `placeRoad`; `demolish` → Gebäude unter Kachel `demolish`, sonst `removeRoad`.

- [ ] **Step 1: tick.ts + app.ts + input.ts + buildMenu.ts + hud.ts + messages.ts implementieren**, `main.ts`:

```ts
import { startGame } from './ui/app';
const root = document.getElementById('app');
if (!root) throw new Error('#app fehlt');
startGame(root);
```

- [ ] **Step 2: `make check` grün.**
- [ ] **Step 3: Manuelle Prüfung** — `make dev`, im Browser: Insel sichtbar, Kontor „K" an der Küste; Zoom/Pan; Weg ziehen; Fischerhütte nur an Wasser (Fehlermeldung sonst); Holzfäller nur am Wald; Haus nur nahe Kontor; Abriss funktioniert; Kein Fehler in der Konsole.
- [ ] **Step 4: README ergänzen** (Voraussetzungen Node ≥ 22, `make install`, `make dev`, `make check`; Kurzbeschreibung der Bedienung).
- [ ] **Step 5: Commit** `feat: UI-Bootstrap mit Game-Loop, Eingabe, Bauleiste und HUD`

---

## Self-Review (durchgeführt)

- Spec-Abdeckung M1: 2.2 (Task 4), 2.4 Standortregeln (Task 5), 3.2 Modulstruktur (Task 2–7), 3.4 Loop (Task 7), 3.5 Fehlerbehandlung im Loop und Result-Typ (Task 5, 7), 3.6 Darstellung (Task 6), Scaffold/CI (Task 1). Kosten, Produktion, Bevölkerung, Persistenz bewusst M2–M4.
- Typkonsistenz: `Result`, `Tool`, `Hover`, `Camera`, `World` einmal definiert; Helfernamen `idx`, `tileAt`, `adjacentOf`, `tilesInRadius`, `center`, `footprint`, `isLand` in Task 4 definiert und in 5–7 verwendet.
- Review Focus 1–5 sind in Task 4, 5, 6 durch Tests abgedeckt.
