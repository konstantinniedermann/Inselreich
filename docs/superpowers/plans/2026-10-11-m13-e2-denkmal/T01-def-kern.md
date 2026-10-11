# T01 · Def-Kern, Freischaltung, Platzhalter (TDD)

Strang sim · Worktree `.worktrees/m13-e2-sim` · Branch `feat/m13-e2-sim` · Umsetzer `tech-sim-engineer` (sonnet) ·
AK-M13E2-02, -03 (Spec §3 R1.1, R1.2, R2, §4, §10.1) · blocked-by T00 · Grösse M (≈ 28 Tools) · tech B2

**Zweck:** Die neue Id `monument` steht mit allen Defs auf einem Commit, von dem die Stränge ART und UI abzweigen.
Alle Tests über alle Gebäude-Ids bleiben grün, nur über **erlaubte Platzhalter**.

**Files:**

- Create: `src/sim/defs/monument.ts`, `tests/sim/monument.test.ts`, `tests/sim/monumentHelpers.ts`
- Modify: `src/sim/types.ts` (Typen unten; **keine** Weltfelder, die kommen in T02), `src/sim/defs/buildings.ts`
  (`monument` als **letzter** Schlüssel), `src/sim/placement.ts` (`siteRuleOk`: `case 'home'`), `src/sim/unlocks.ts`
  (`buildLock`), `src/ui/buildMenu.ts` (`buildEntries`: Denkmal nur auf `HOME`), `tests/sim/defs.test.ts`
- **Platzhalter (nur falls ein Test über alle Ids rot wird):** `src/render/sprites.ts` (`SILHOUETTES.monument` =
  schlichter Block, Kommentar `// Platzhalter M13-E2 T01, ersetzt in T09`), `src/render/iso.ts` (`BODY_HEIGHTS`
  nur falls nötig), `tests/render/sprites-referenz.test.ts` (Hash des Platzhalters), `src/audio/buildSounds.ts`
  (`monument: 'stone'`, endgültig, R1.6), `src/ui/messages.ts` (Icon wie `townhall`). Jede **weitere** Datei nur mit
  Ledger-Eintrag (Datei, Test, Grund) und Zustimmung des Controllers.
- Lesen: Spec §3 R1–R2, §4; `BUILDING_DEFS.townhall` (Muster), `kontor2` in `buildMenu.ts` (Muster Inselfilter).

## Schnittstelle

```ts
// src/sim/types.ts
export type BuildingDefId = … | 'monument';
export type SiteRule = … | { kind: 'home' };
export type MonumentGood = 'stone' | 'tools' | 'glass' | 'spice';
export interface MonumentStageDef {
  name: string;
  money: number;
  goods: Readonly<Record<MonumentGood, number>>;
}
export interface Monument {
  buildingId: number;
  stage: number; // 0 … 3 = fertige Abschnitte
  running: boolean;
  delivered: Record<MonumentGood, number>;
  paused: boolean;
  buy: Record<MonumentGood, boolean>;
}

// src/sim/defs/monument.ts — Werte exakt Spec §4; Kopfkommentar: Spielwerte, Änderung nur per Ruling (P-5)
export const MONUMENT_GOODS: readonly MonumentGood[]; // ['stone', 'tools', 'glass', 'spice']
export const MONUMENT_STAGES: readonly MonumentStageDef[]; // Sockel 4000 · Terrassen 6000 · Schaft und Feuerschale 8000
export const MONUMENT_PULL_TICKS = 10;
export const MONUMENT_RESERVE_MIN = 20;
export const MONUMENT_RESERVE_TICKS = 800;
export const MONUMENT_UNLOCK = 'wonMerchants' as const;
```

`BUILDING_DEFS.monument` nach R1.1: Name «Denkmal», `w 3`, `h 3`, `cost(500, 10, 0, 10)`, `upkeep 0`, `category
'public'`, kein `flammable`, `maxCount { n: 1, reason: 'Es gibt schon ein Denkmal' }`, `site [{ kind: 'home' },
{ kind: 'supply' }]`. Kein `UNLOCKS`-Eintrag, `UNLOCK_IDS` und `world.unlocked` unverändert.

`siteRuleOk` `case 'home'`: ok nur bei `island === HOME`, sonst `fail('Nur auf der Heimatinsel')`.
`buildLock(w, 'monument')`: `w[MONUMENT_UNLOCK] === true ? null : 'Erst nach dem Kaufleute-Ziel'` (Sonderfall vor
`entryOfBuilding`; `buildingShown` folgt daraus). `canPlace` bleibt in der Reihenfolge R1.3 (Kontor der Fremdinsel →
Freischaltung → `maxCount` → Boden → `home` → `supply`); prüfen, nicht umbauen.

## Testwelt (`tests/sim/monumentHelpers.ts`)

`monumentWorld(): World` nach Spec §10: `createWorld(3, { unlockAll: true })`, `wonMerchants = true`, keine Häuser,
Lager Stein, Werkzeug, Glas, Gewürz je 20, `money = 100 000`, `tick = 1000`. Konstante `MONUMENT_AT = { x, y }`:
fester, freier 3×3-Platz im Kontorradius (Anhang 01 F: `kx + 7` ok), einmal bestimmen (Boden mit `forceRect` auf
Gras setzen), mit Weg an einer Randkachel (`placeRoad`); Helfer `placeMonument(w)` setzt Bauplatz-Kosten vorher gut
und liefert die Id (ab T03 auch `world.monument`). In T01 nur `monumentWorld` und `MONUMENT_AT`.

## Schritte

- [ ] **Schritt 0:** `grep -n "townhall\|kontor2" src/sim/defs/buildings.ts src/ui/buildMenu.ts src/sim/unlocks.ts`;
      Fächerliste ermitteln: `grep -rln "BUILDING_IDS\|Object.keys(BUILDING_DEFS)\|Object.entries(BUILDING_DEFS)" tests src`.
- [ ] **Schritt 1: Test zuerst (rot).**
  1. `tests/sim/defs.test.ts`, `describe('M13-E2 Denkmal (AK-M13E2-02)')`: `MONUMENT_STAGES` exakt (Namen, Geld,
     Mengen); Summen Geld 18 000, Stein 600, Werkzeug 240, Glas 360, Gewürz 240; `MONUMENT_GOODS` gleich den
     Schlüsseln jedes `goods` in dieser Reihenfolge; Mengen ganzzahlig > 0; die vier Konstanten ganzzahlig > 0 bzw.
     `'wonMerchants'`; `BUILDING_DEFS.monument` nach R1.1 und `Object.keys(BUILDING_DEFS).at(-1) === 'monument'`.
  2. `tests/sim/monument.test.ts`, `describe('AK-M13E2-03 Freischaltung')`: `wonMerchants false` → `canPlace` nennt
     `'Erst nach dem Kaufleute-Ziel'`, auch auf Wasser und auf belegtem Boden; `buildEntries(w, 'public', HOME)` ohne
     `monument`; danach `canPlace` an `MONUMENT_AT` ok, `buildEntries(w, 'public', HOME)` mit, `buildEntries(w,
'public', 1)` ohne; `world.unlocked` vorher/nachher gleich (`toEqual`). Zusätzlich Hilfstest R1.2 (kein eigenes AK, Abnahme
     über `canPlace` in AK-04/T03): `siteRuleOk(w, 'monument', x, y, { kind: 'home' }, 1)` → `'Nur auf der
Heimatinsel'`, auf `HOME` ok.

```bash
npx vitest run tests/sim/defs.test.ts tests/sim/monument.test.ts; echo EXIT=$?   # rot: Modul fehlt
```

- [ ] **Schritt 2: Umsetzen** (Typen, Defs, `siteRuleOk`, `buildLock`, `buildEntries`). Danach die Fächerliste aus
      Schritt 0 gezielt laufen lassen und **nur** rote Tests mit Platzhaltern aus der Liste oben grün machen:

```bash
npx vitest run tests/sim/defs.test.ts tests/sim/monument.test.ts tests/sim/unlocks.test.ts tests/sim/placement.test.ts \
  tests/sim/unlock-timeline.test.ts tests/sim/queries.test.ts tests/sim/fire.test.ts tests/sim/storm.test.ts \
  tests/render/sprites.test.ts tests/render/sprites-referenz.test.ts tests/render/spriteCache.test.ts \
  tests/render/variants.test.ts tests/render/sprites-kanten.test.ts tests/render/sprites-licht.test.ts \
  tests/render/sprites-signale.test.ts tests/render/renderer.test.ts tests/audio/buildSounds.test.ts \
  tests/audio/economySounds.test.ts tests/ui/tooltip.test.ts tests/ui/pipette.test.ts tests/ui/panelView.test.ts \
  tests/ui/crisis.test.ts tests/ui/levelReads.test.ts tests/ui/goodFocus.test.ts tests/ui/hints.test.ts \
  tests/ui/islandTools.test.ts tests/sim/imports.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Baseline-Stichprobe.** `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` → grün ohne
      Änderung (der neue letzte Schlüssel darf keine Iteration verschieben). Rot = Stopp, Meldung an den Controller.
- [ ] **Schritt 4: Commit.** `feat: Def-Kern Denkmal, Freischaltung nach Ziel 2 (M13-E2 T01)`; Trailer der Session.

## Bericht

Testnamen je Prüfpunkt, eine Zeile Rot-Ausgabe, Exit-Codes, `git diff --stat main...HEAD`, Liste der Platzhalter
(Datei, Grund, welcher Test). Bestätigen: `git diff main -- 'tests/sim/balance*' tests/sim/e0Pins.ts
tests/sim/e1Pins.ts tests/sim/seePins.ts` leer. Der Controller notiert den abgenommenen Commit-Hash im Ledger.
