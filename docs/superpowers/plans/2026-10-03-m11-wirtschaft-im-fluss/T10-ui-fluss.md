> **Task-ID:** T10 (Paket M11-U1) — ein Teil
> **AK-IDs:** AK-UI-01 (Browser), AK-UI-02 (Vitest + Browser); Vorlauf AK-UI-10 (Vitest-Teil, siehe Abweichung)
> **blocked-by:** T03 (Review OK) — läuft parallel zu P2/P3 (orga-02 E3)
> **Strang:** `feat/m11-ui` · Worktree `.worktrees/m11-ui` (Controller legt ihn am T03-SHA an) · Implementierer `tech-ui-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-06](orga-06-schnittstellen.md) · [orga-07](orga-07-datei-ownership.md) · [orga-12](orga-12-geaenderte-tests.md)

## T10: Kontostand je Frame, Bilanz-Drossel, Zugriffsersatz `cycleOf`/`upkeepOf`

**Ziel:** Die Kasse zählt sichtbar je Frame hoch, die Bilanz „/ min" springt höchstens alle 500 ms (Spec 7); jede
Anzeige eines stehenden Betriebs liest Zyklus und Unterhalt über `cycleOf(b)`/`upkeepOf(b)` (mit leerem `LEVELS` bitgleich).

**Code-Fakten (Ist M10, `801c279`):**

- `src/ui/app.ts:123` `HUD_EVERY_FRAMES = 10`; `app.ts:924` ruft `refresh()` (→ `updateHud`) nur jeden zehnten Frame.
  **Abweichung Spec 7** („Ist: `updateHud` je Frame"): AK-UI-01 braucht deshalb einen eigenen Geld-Aufruf je Frame.
- `src/ui/hud.ts:104` `setChip` (privat); `:226–231` Bilanz-Chip (`title`, `negative`); `:240` Geld-Chip (`moneyView`).
- `src/ui/texts.ts:21` `producesText(def: { produces?; cycle? }, burning: boolean)` liest `def.cycle`.
- `src/ui/inspect.ts:454` und `:474` statische Unterhaltszeile aus `def.upkeep`; `:464`, `:500` `producesText(def, …)`;
  `:511–512` Balkenbreite aus `def.cycle`.
- `src/ui/hover.ts:126` `perMinute(1, def.cycle ?? 1)`.
- Ab T01: `cycleOf`, `upkeepOf` (`src/sim/levels.ts`), `Building.level?`; `LEVELS` (`defs/levels.ts`) leer bis T09.

**Erwartete Dateien:** `src/ui/hud.ts`, `src/ui/app.ts`, `src/ui/texts.ts`, `src/ui/inspect.ts`, `src/ui/hover.ts`,
`tests/ui/hud.test.ts`, `tests/ui/levelReads.test.ts` (neu). Doku-Zeilen (arc42 §5 `hud.ts`, §6 HUD-Takt) trägt D1 nach.
**Nicht anfassen:** `src/sim/**`, `src/render/**`, `src/ui/buildMenu.ts` (Bauleisten-Tooltip bleibt Stufe 1), `index.html`,
`src/style.css`, bestehende Tests (keine Umschreibung nötig).

- [ ] **Schritt 1: Tests schreiben.** `tests/ui/hud.test.ts`, neuer Block am Ende (Import `BALANCE_REFRESH_MS`, `balanceDue`
      aus `../../src/ui/hud`):

```ts
describe('M11 Kopfzeile im Fluss (Spec 7)', () => {
  it('AK-UI-02 balanceDue: 400 ms → false, 500 ms → true; erster Aufruf immer fällig', () => {
    expect(BALANCE_REFRESH_MS).toBe(500);
    expect(balanceDue(1000, 600)).toBe(false);
    expect(balanceDue(1100, 600)).toBe(true);
    expect(balanceDue(0, -Infinity)).toBe(true);
  });
});
```

`tests/ui/levelReads.test.ts` (neu; `LEVELS` gemockt, weil T10 vor T07/T09 läuft; Werte = Anhang 01 A.4):

```ts
import { describe, expect, it, vi } from 'vitest';
vi.mock('../../src/sim/defs/levels', async (orig) => {
  const real = await orig<typeof import('../../src/sim/defs/levels')>();
  const c = (money: number, wood: number, tools: number) => ({ money, wood, tools, stone: 0 });
  return {
    ...real,
    LEVELS: {
      ...real.LEVELS,
      fisher: [
        { cycle: 24, upkeep: 7, cost: c(50, 3, 1), fee: { good: 'cloth', amount: 2 } },
        { cycle: 16, upkeep: 9, cost: c(75, 4, 2), fee: { good: 'rum', amount: 2 } },
      ],
    },
  };
});
// Importe: BUILDING_DEFS, UPKEEP_INTERVAL, cycleOf, createWorld, idx, producesText, upkeepText, progressPct,
// hoverInfo, tooltipLines, perMinute, forceGrass (../sim/helpers); Typ Building.
const mk = (defId: Building['defId'], extra: Partial<Building> = {}): Building => ({
  id: 1,
  defId,
  x: 0,
  y: 0,
  connected: true,
  progress: 0,
  state: 'ok',
  ...extra,
});

describe('M11 Zugriffsersatz cycleOf/upkeepOf (Spec 7)', () => {
  it('AK-UI-10 Vorlauf: ohne level bitgleich zu den Defs (jedes Gebäude)', () => {
    for (const def of Object.values(BUILDING_DEFS)) {
      const b = mk(def.id);
      expect(upkeepText(b), def.id).toBe(
        `Unterhalt ${perMinute(def.upkeep, UPKEEP_INTERVAL)} / min`,
      );
      if (!def.produces || def.cycle === undefined) continue;
      expect(producesText(def, false, cycleOf(b)!)).toBe(producesText(def, false));
      b.progress = Math.floor(def.cycle / 2);
      expect(progressPct(b)).toBe(Math.min(100, Math.round((b.progress / def.cycle) * 100)));
    }
  });
  it('AK-UI-10 Vorlauf: Fischer Stufe 2 und 3 (alle 3 s / 2 s, 42 / 54 je min, Balken 50 %)', () => {
    const f2 = mk('fisher', { level: 2, progress: 12 });
    expect(producesText(BUILDING_DEFS.fisher, false, cycleOf(f2)!)).toBe(
      'Erzeugt Nahrung alle 3 s',
    );
    expect(upkeepText(f2)).toBe('Unterhalt 42 / min');
    expect(progressPct(f2)).toBe(50);
    const f3 = mk('fisher', { level: 3 });
    expect(producesText(BUILDING_DEFS.fisher, false, cycleOf(f3)!)).toBe(
      'Erzeugt Nahrung alle 2 s',
    );
    expect(upkeepText(f3)).toBe('Unterhalt 54 / min');
    expect(tooltipLines({ kind: 'build', defId: 'fisher' })).toContain('Erzeugt: Nahrung 15 / min');
  });
  it('AK-UI-10 Vorlauf: Mouse-over Fischer Stufe 2 „arbeitet — 25 Nahrung / min"', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    const b = mk('fisher', { id: w.nextBuildingId++, x: k.x + 4, y: k.y - 6, level: 2 });
    w.buildings[b.id] = b;
    forceGrass(w, b.x, b.y);
    w.tiles[idx(w, b.x, b.y)]!.buildingId = b.id;
    const none = { ship: false, animal: null };
    expect(hoverInfo(w, b, 0, none)!.lines[0]).toBe('arbeitet — 25 Nahrung / min');
  });
});
```

- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/ui/hud.test.ts tests/ui/levelReads.test.ts` → Tabelle unten; den roten
      Lauf (Testname + Meldung) in den Bericht.
- [ ] **Schritt 3: Umsetzung.**
  - `hud.ts`: `export const BALANCE_REFRESH_MS = 500;` (Darstellungskonstante) und `balanceDue(nowMs, lastMs)` =
    `nowMs - lastMs >= BALANCE_REFRESH_MS`. Modulweit `WeakMap<HTMLElement, number>` je Kopfzeile; der Bilanz-Block
    (`:226–231`, Text, `title`, `negative`) läuft nur bei `balanceDue(performance.now(), gemerkt ?? -Infinity)`.
  - `hud.ts`: `export function updateMoney(header, world)` = Zeile `:240`; `updateHud` ruft sie. `app.ts` `loop` ruft
    sie nach `render(…)` jeden Frame (vor der `HUD_EVERY_FRAMES`-Zeile). Kein Interpolieren (Spec 2.3).
  - `texts.ts`: `producesText(def, burning, cycle: number = def.cycle ?? 0)` — dritter Parameter optional, damit die
    bestehenden Aufrufe und Tests unverändert bleiben; Text nutzt `cycle`.
  - `inspect.ts`: `export function upkeepText(b)` = „Unterhalt {perMinute(upkeepOf(b), UPKEEP_INTERVAL)} / min";
    `export function progressPct(b)` = `Math.min(100, Math.round((b.progress / (cycleOf(b) ?? 1)) * 100))`. Die
    Unterhaltszeilen `:454`, `:474` werden `addLine(panel, '', 'upkeep')`, gesetzt in `updateInspect`;
    `producesText(def, burning, cycleOf(b))` an `:464`, `:500`; Balken über `progressPct(b)`. Die Bedingung
    `def.produces && def.cycle !== undefined` bleibt (Struktur, kein Wert).
  - `hover.ts:126`: `perMinute(1, cycleOf(b) ?? 1)`.
  - `grep -n "def\.cycle\|def\.upkeep" src/ui/*.ts` → nur `buildMenu.ts` und Struktur-Bedingungen in `inspect.ts`.
- [ ] **Schritt 4: Grün.** `npx vitest run tests/ui` · `npx tsc --noEmit` · `make check` · Testzählbefehl aus index.md
      (`tests/ui/hud.test.ts` 14 → 15; `levelReads.test.ts` neu 3).
- [ ] **Schritt 5: Doku.** Doku gehört D1 (Ownership, parallel laufender Strang, R190): dieser Task ändert weder `docs/arc42.md` noch `README.md`; die Zeilen für D1 stehen im Bericht. Für D1: §5 Zeile `hud.ts` „Geld je Frame (`updateMoney`), Bilanz höchstens alle `BALANCE_REFRESH_MS` = 500 ms (`balanceDue`)"; §6 Satz „das HUD wird jeden zehnten Frame aktualisiert" samt Sequenzdiagramm.
- [ ] **Schritt 6: Commit und Push.**

```bash
git add src/ui/hud.ts src/ui/app.ts src/ui/texts.ts src/ui/inspect.ts src/ui/hover.ts tests/ui/hud.test.ts tests/ui/levelReads.test.ts
git commit -m "feat: M11-U1 Kontostand je Frame, Bilanz-Drossel, Anzeige über cycleOf/upkeepOf (Spec 7)"
git -C .worktrees/m11-ui push -u origin feat/m11-ui
```

### Rot-Beleg

| AK                            | Erwartete Meldung vor der Umsetzung                                               |
| ----------------------------- | --------------------------------------------------------------------------------- |
| AK-UI-02                      | `TypeError: … balanceDue is not a function` (bzw. `BALANCE_REFRESH_MS` undefined) |
| AK-UI-10 Vorlauf (bitgleich)  | `TypeError: … upkeepText is not a function`                                       |
| AK-UI-10 Vorlauf (Stufe 2/3)  | `TypeError: … upkeepText is not a function`                                       |
| AK-UI-10 Vorlauf (Mouse-over) | `expected 'arbeitet — 15 Nahrung / min' to be 'arbeitet — 25 Nahrung / min'`      |
| AK-UI-01 (Browser)            | Ist: Geld ändert sich nur jeden zehnten Frame (≈ 6-mal je s bei 60 fps)           |

### Browser-Check (qa-playtester, nach Review OK)

**AK-UI-01/-02 gelten in T10 als „später belegt in W7" (QA-UI nach T12 an Szene `m11-fluss`);** T10 liefert hier nur den Rauchtest und die Vitest-Teile. Das Review-Urteil OK für T10 hängt nicht am Browser-Beleg der beiden AK.

Playtester-Briefing (Pflicht): eigener Vite-Port je Check (`npx vite --port <frei, z. B. 5200 + Task-Nr.> --strictPort`), Port im Bericht nennen; nach dem Check den Server beenden (Teardown: PID/Port schliessen, Chrome-Instanz beenden, `git worktree remove` des QA-Baums) und im Bericht bestätigen.

AK-UI-01/-02 an Szene `m11-fluss` (B1; ohne B1-Merge die Saves im B1-Worktree mit `SCENARIO_OUT` erzeugen — die Szene
hat weder `hunter` noch `level`). Fehlt B1 ganz: hier nur Rauchtest mit `m10-amtsstube`, AK-UI-01/-02 im QA-UI-Lauf
nach T12 (W7). Messung per `MutationObserver` auf `.chip-value` von `money` (2 s: ≥ 10 Änderungen, steigend) und
`balance` (10 s: je Fenster `[t, t + 1000)` ≤ 2 Änderungen), 1×, 1280 × 800.

### Risiken/Randfälle

- Abweichung zum Index: Der Vitest-Teil von AK-UI-10 entsteht hier (der Code dazu ist T10); T11 prüft AK-UI-10 im Browser.
- `vi.mock` gilt je Datei, deshalb eigene Datei; nach T09 gleichen Mock und echtes `LEVELS.fisher` sich.
- Drossel: bei genau 500 ms Abstand und geschlossenem 1-s-Fenster wären 3 Änderungen möglich (darum halboffen messen).
- `cycleOf` ohne Zyklus ggf. `undefined` (Vertrag T01): darum `?? 1` bzw. `!` nur hinter `def.produces`.
