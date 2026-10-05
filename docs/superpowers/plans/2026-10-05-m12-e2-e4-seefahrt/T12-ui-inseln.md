> **Task-ID:** T12 · **AK-IDs:** AK-E2-10, AK-E2-11; Anhang 03 C.1, C.10, C.11; Auflage lead-qa Teil B (Browser-Check
> Gewürz-Chip und Hilfe-Schritt)
> **blocked-by:** T04, Merge-Punkt **M1** (E1 fertig), Entscheid **D-143** · **Strang:** e2, `.worktrees/m12-see-e2` ·
> `tech-ui-engineer` (sonnet), danach `qa-playtester`
> **Regeln:** Spec §6 „Bedienung", Anhang 03 C.1, C.10, C.11, D (Chip „Gewürz"); desktop-first ab 1280 px

## T12: UI — aktive Insel, Lagerleiste je Insel, Tasten `0`/`9`, Knopf „Inseln", Hilfe

**Ziel:** Was der Spieler ansieht, bestimmt, welches Lager er sieht; mit der Seefahrt springt er per Taste oder mit
2 Klicks zwischen den Inseln.

**Code-Fakten (nach M1, T04):** `ui/app.ts` (Spielzustand, Kamera, rAF), `input.ts` (`zoomAt`, Klemmung), `hud.ts`
(`chipView(world, good)`, `stockChipHidden`, `stockTooltip`, `balanceView`, `updateHud`), `hotkeys.ts`
(`hotkeyAction`, `ISLAND_HOME_KEY`, `ISLAND_CYCLE_KEY` aus T02), `hover.ts` (`hoverInfo`, Inselkarte E1),
`islandCard.ts` (E1), `guide.ts` `nextStep(w)`; `render/archipel.ts` `pickArchipel`, Inselrechtecke; `render/camera.ts`
`screenToTileF`; Sim: `goodsBalance(world, island)` (T04), `islandName`, `functionLock(w, 'seafaring')`, `isKontor`.

**Dateien:** neu `src/ui/activeIsland.ts`, `src/ui/islandJump.ts`; `src/ui/app.ts`, `hud.ts`, `hotkeys.ts`, `hover.ts`,
`guide.ts`, `index.html`/`src/style.css` (Knopf, Liste); neu `tests/ui/activeIsland.test.ts`,
`tests/ui/islandJump.test.ts`; `tests/ui/hud.test.ts`, `hotkeys.test.ts`, `guide.test.ts` (falls vorhanden).

## Schnittstellen (Produces, rein)

```ts
// src/ui/activeIsland.ts
export interface IslandRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
} // Archipel-Kacheln, x1/y1 exklusiv
export function activeIsland(
  rects: readonly IslandRect[],
  center: { x: number; y: number },
): number;
// center im Rechteck → dieses; sonst nächste Mitte (Math.sqrt), Gleichstand kleinerer Index
export function islandRects(world: World): IslandRect[]; // ox, oy, width, height je Insel
// src/ui/islandJump.ts
export function nextIsland(current: number, count: number): number; // (current + 1) % count
export function jumpTarget(world: World, i: number): { x: number; y: number }; // Kontor-Mitte, sonst Rechteckmitte
export function islandList(world: World): { index: number; label: string }[]; // „Heimat", „Möweninsel · Kontor" …
```

## Regeln (verbindlich)

- **Aktive Insel** (UI-Zustand, nicht im Save) aus der Bildmitte je Frame (`screenToTileF` der Canvas-Mitte).
  **D-143:** ohne Ruling Spec-Wortlaut (gilt immer); mit Ruling-Empfehlung: vor `seafaring` immer `0`. Wählt E1
  `ARCHIPEL_VIEW 'jump'`, ist die aktive Insel die gesprungene.
- **Lagerleiste, Warenbilanz, Tooltips** lesen `islands[aktiv].stock` und `goodsBalance(world, aktiv)`; vor den Chips
  steht der Name: „Felsbucht · …" (Element `data-field="island-name"`). Chip „Gewürz" sichtbar ab U6 oder sobald
  Gewürz > 0 auf der aktiven Insel (Regel wie Glas, `stockChipHidden`). Geld bleibt global.
- **Tasten** (nur mit `seafaring`, sonst stumm; bei offener Karte/Modal stumm wie alle Kürzel): `ISLAND_HOME_KEY` →
  Kamera auf `jumpTarget(0)`; `ISLAND_CYCLE_KEY` → `jumpTarget(nextIsland(aktiv, 3))` (Heimat → Möweninsel →
  Felsbucht → Heimat). Zoom bleibt. Tastenliste (`hotkeyList`) nennt beide ab `seafaring`.
- **Knopf „Inseln"** in der Kopfzeile, verborgen vor `seafaring`: Klick 1 öffnet die Liste (`islandList`), Klick 2 auf
  einen Eintrag springt und schliesst sie (2 Klicks je Ziel). Liste nicht je Tick neu bauen (Aufbau beim Öffnen).
- **Mouse-over Fremdinsel vor `seafaring`:** Inselkarte (E1) + „ · Seefahrt mit den Kaufleuten".
- **Hilfe/Chronik (C.11):** `nextStep(w)` nach U6, solange kein `kontor2` steht: „Gründe ein Kontor auf einer Insel mit
  Gewürz" (vor den bisherigen späten Schritten; Reihenfolge im Test).

## Schritte

- [ ] **1 Tests zuerst** (`describe('M12 E2 UI Inseln')`):
  - `activeIsland.test.ts` **AK-E2-10**: Mitte in Rechteck 2 → 2; auf Meer näher an 1 → 1; genau gleich weit von 0 und
    1 → 0; Rechtecke aus `islandRects(createWorld(3))` (Heimat 0,0).
  - `islandJump.test.ts`: `nextIsland` 0→1→2→0; `jumpTarget` mit `kontor2` auf 2 = Kontor-Mitte in Archipel-Koordinaten,
    ohne = Rechteckmitte; `islandList` Labels.
  - `hud.test.ts`: `chipView(world, good, island)` liest Lager 2; Name-Präfix „Felsbucht"; Gewürz-Chip-Regel.
  - `hotkeys.test.ts`: ohne `seafaring` liefern `0`/`9` keine Aktion; mit → `{ kind: 'islandHome' }` /
    `{ kind: 'islandCycle' }`.
  - `guide.test.ts`: U6 erreicht, kein `kontor2` → Text C.11; mit `kontor2` → nicht mehr.
- [ ] **2 Rot-Beleg** → Commit `test: M12 E2 UI aktive Insel und Sprünge (rot)`.
- [ ] **3 Umsetzung**; Prettier, `make check`, `CI=true make check` → Commit `feat: M12 E2 aktive Insel, Inselsprung,
Lagerleiste je Insel`.
- [ ] **4 Browser-Check `qa-playtester`** (1280 × 800 und 1920 × 1080, Seed 3, „Alles frei", Tempo 1; Screenshots
      `.studio/qa/M12-SEE/T12/`): **AK-E2-11** Kamera auf Felsbucht → „Felsbucht · …" mit deren Lager; `0` springt
      heim, `9` reihum; „Inseln": Klick 1 Liste, Klick 2 Sprung — **2 primäre Mausklicks** ab geschlossener Liste;
      neues Spiel ohne „Alles frei": `0`/`9` stumm, Knopf verborgen, Mouse-over Fremdinsel nennt „Seefahrt mit den
      Kaufleuten"; **Gewürz-Chip** sichtbar ab U6; **Hilfe-Schritt** C.11 sichtbar bis zum ersten `kontor2`.

**Review-Fokus:** reine Helfer getestet; Tasten/Knopf vor `seafaring` stumm/verborgen; keine Spielwerte in `src/ui/`;
kein Neuaufbau der Liste je Tick; D-143 nach Ruling.
