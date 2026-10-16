# T02 · `focusList` und Meldungen M1/M2/M3

Strang ui · Umsetzer `tech-ui-engineer` · AK-GC-01, 02, 03, 05 (Text) · blocked-by T01 · Grösse M (≈ 25 Tools)

**Dateien (exklusiv):** `src/ui/goodFocus.ts` (neu), `tests/ui/goodFocus.test.ts` (neu). Lesen: `ak.md`, `src/ui/problems.ts` (`ProblemSort`, `spot`-Logik), `src/ui/texts.ts` (`stateInfo`, `goodList`), `src/ui/islandJump.ts` (`jumpTarget`), `src/sim/queries.ts` (`missingInputs`), `src/sim/unlocks.ts` (`buildLock`), `tests/ui/worlds.ts`, `tests/ui/problems.test.ts` (Welt-Aufbau als Vorbild).

## Schritt 0: Zeilenstände nach M13-E1-Merge prüfen (Pflicht)

`texts.ts` `stateInfo` wurde von M13-E1 (T12) um „Stillgelegt“ erweitert, ggf. mit anderer Signatur. Vor dem Editieren:

```bash
git log --oneline 1b723334..HEAD -- src/ui/texts.ts src/ui/problems.ts src/sim/types.ts
grep -n "export function stateInfo" -A6 src/ui/texts.ts; grep -n "paused" src/sim/types.ts; echo EXIT=$?
```

Auf `1b723334`: `stateInfo(b, tick, missing?)` in `texts.ts:50`. Aufruf in M1 mit der dann gültigen Signatur; stillgelegte Erzeuger müssen M1 „Stillgelegt“ (Wortlaut aus `stateInfo`) zeigen (AK-GC-02, „nach M13-E1“).

## API (`goodFocus.ts`, DOM-frei, nur lesend)

```ts
export type FocusRole = 'producer' | 'consumer';
export interface FocusEntry {
  key: string; // `b:<id>`
  role: FocusRole;
  island: number;
  id: number;
  at: { x: number; y: number }; // Archipel-Kacheln, Footprint-Mitte
  sort: ProblemSort; // [Rolle 0|1, 0, Abstand zu jumpTarget, ID]
  building: Building;
}
export function focusList(world: World, island: number, good: GoodId): FocusEntry[];
export function focusMessage(
  world: World,
  good: GoodId,
  index: number,
  count: number,
  e: FocusEntry,
): string; // M1
export function noProducerMessage(world: World, good: GoodId): string; // M2
export function emptyFocusMessage(good: GoodId): string; // M3
```

Regeln: Gebäude mit `b.island === island`, `!b.house`, `defId !== 'kontor'`; Erzeuger `def.produces === good`, Verbraucher `def.consumes?.includes(good)` (ein Gebäude, das beides erfüllt, zählt als Erzeuger). Jeder Zustand (angebunden, brennend, stillgelegt, `outageUntil`). Sort `[role === 'producer' ? 0 : 1, 0, Math.hypot(at − jumpTarget(world, island)), id]`; Vergleich über denselben lexikographischen Vergleich wie `compareSort` (T01 exportiert ihn nicht? Dann in `problems.ts` `export` ergänzen — erlaubt, eine Zeile). `at` = `isl.ox + center(def, b.x, b.y).cx` (wie `spot` in `problems.ts`; `spot` exportieren statt kopieren, DRY).

**M1:** `${GOODS[good].name} ${i} von ${n}: ${def.name} (${Erzeuger|Verbraucher}) · ${stateInfo(b, world.tick, missingInputs(world, b)).text}`.
**M2:** `Noch kein Erzeuger für ${Gut} — Bauen: ${Namen}`; Namen = `BUILDING_DEFS`-Einträge mit `produces === good` und `buildLock(world, defId) === null`, in Reihenfolge der Defs, verbunden „A, B oder C“ (zwei: „A oder B“, einer: „A“); keiner frei → `Noch kein Erzeuger für ${Gut} — Erzeuger noch nicht frei`.
**M3:** `${Gut}: nichts mehr markiert`.

## Schritte

- [ ] **Schritt 1: Roter Test `tests/ui/goodFocus.test.ts`** (Welten aus `tests/ui/worlds.ts` bzw. wie `problems.test.ts` per `placeBuilding`; Fremdinsel per Szenario aus `tests/sim/scenarios.ts`):
  - AK-GC-01: zwei Holzfäller + Werkzeugmacher + Glashütte: Reihenfolge Erzeuger vor Verbrauchern; innerhalb der Rolle nach Abstand zu `jumpTarget`, bei gleichem Abstand nach ID; Häuser und Kontor fehlen; Gebäude einer anderen Insel fehlen.
  - AK-GC-02: nicht angebundener (`connected = false`), brennender (`outageUntil` gesetzt) und — falls im Baum vorhanden — stillgelegter Erzeuger sind in der Liste; `focusMessage` nennt den Zustand aus `stateInfo`.
  - AK-GC-03: M1 wörtlich: „Holz 1 von 4: Holzfäller (Erzeuger) · Kein freier Wald in der Nähe“ (Zustand `noForest`) und „Holz 4 von 4: Werkzeugmacher (Verbraucher) · Wartet auf Holz“ (`waitingInput`, `missingInputs` = Holz).
  - AK-GC-05 (Text): M2 mit drei freigeschalteten Erzeugern („Fischerhütte, Jagdhütte oder Rinderfarm“ für Nahrung — im Test gegen `BUILDING_DEFS`-Namen und den Freischaltstand der Welt prüfen, nicht gegen fest verdrahtete Namen), zwei („A oder B“), keiner frei („Erzeuger noch nicht frei“).
  - M3-Text.
    Lauf `npx vitest run tests/ui/goodFocus.test.ts; echo EXIT=$?` → **rot**.
- [ ] **Schritt 2: Umsetzung** `goodFocus.ts` wie oben; `spot`/`compareSort` aus `problems.ts` exportieren und nutzen. Kein Import aus `hover.ts`, `hud.ts`, `app.ts`.
- [ ] **Schritt 3: Prüfen.** `npx vitest run tests/ui/goodFocus.test.ts tests/ui/problems.test.ts tests/ui/imports.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?` → alle 0.
- [ ] **Schritt 4: Commit** `feat: focusList und Gut-Meldungen für den Gut-Chip (I-043)`.

## Nicht in dieser Task

Zustand, Sprungablauf, Tooltip, Render.
