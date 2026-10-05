> **Task-ID:** T00 · **AK-IDs:** Vorbedingung AK-M12-B4, AK-M12-B5, AK-E2-07, AK-E3-04, AK-E3-07, AK-E4-03
> **blocked-by:** Gate Plan, Merge-Punkt M0 (E1-T02 Review OK) · **Strang:** int, `feat/m12-see`, Worktree
> `.worktrees/m12-see` · `tech-sim-engineer` (sonnet)
> **Regeln:** Spec Anhang 03 B (Fixture der Vorgängerversion als erster Commit), Anhang 04 „lead-qa Teil B" und
> „Nachtrag R230" (Rezept `save-v8.json`, feste Testwelt mit bekanntem `d`)

## T00: Schritt 0 — Fixture `save-v8.json` und Pins auf unverändertem v8-Code

**Ziel:** Bevor das Bündel eine Zeile `src/` ändert, liegen ein echter v8-Spielstand mit Kaufleuten und die Pins
der Auftrags- und Brandziehungen im Repo. Sie beweisen später: v8 lädt in v9, Übergangsbestand stimmt, Auftrags- und
Brandziel bleiben bitgleich.

**Code-Fakten (nach M0):** `SAVE_VERSION = 8`; `createWorld` mit Heimat + A + B; `tests/sim/fixtureV7.ts`,
`fixtures/save-v7.json`, `e1Pins.ts` (Muster für Pin-Dateien); `tests/sim/merchantsController.ts` mit
`runMerchants` (Schleife „control, dann step" bis `wonMerchants`); `orders.ts` `orderForPeriod(seed, k, maxTier)`;
`crises.ts` `rollCrisis(seed, k, maxTier, rect)`, `flammableRect(world)`; `islands.ts` `seaLanes`, `generateForeignIslands`.

**Dateien:** neu `tests/sim/fixtureV8.ts`, `tests/sim/fixtures/save-v8.json`, `tests/sim/seePins.ts`;
`tests/sim/save.test.ts` (neuer `describe`). **Kein** `src/`. Ausnahme: reiner `export` einer bestehenden
Funktion in `merchantsController.ts`, falls die Schrittfunktion nicht exportiert ist (mechanischer Diff, R227).

## Schritte

- [ ] **0 Basis (M0):** `git merge docs/m12-brainstorming` (619eea5, nur `docs/`), dann `git merge feat/m12-e1`
      am SHA „E1-T02 OK" aus `.superpowers/sdd/m12-e1/ledger.md`. `grep -n "SAVE_VERSION = 8" src/sim/save.ts`
      trifft; `make check` grün. SHAs ins Ledger `.superpowers/sdd/m12-see/ledger.md`.
- [ ] **1 Rezept** `tests/sim/fixtureV8.ts`:

```ts
// Rezept für save-v8.json (M12 Seefahrt T00, Anhang 03 B): Kaufleute-Controller bis genau 3 Häuser der Stufe 4.
import type { World } from '../../src/sim/types';
// Schleife wie runMerchants (control, dann step), Abbruch statt bei wonMerchants bei 3 Häusern der Stufe 4.
export function fixtureV8Run(): World {
  /* createWorld(MERCHANT_SEED, …) wie in runMerchants; while (tier4Houses(w) < 3 && w.tick < MERCHANT_TICK_LIMIT)
     { control(w, t); step(w); } — Werte und Seed aus merchantsController.ts, nichts neu setzen */
}
export const tier4Houses = (w: World): number =>
  Object.values(w.buildings).filter((b) => b.house?.tier === 4).length;
```

      Der Implementierer ersetzt den Kommentar durch die echte Schleife aus `runMerchants` (gleiche Aufrufe,
      gleiche Reihenfolge). Ergebnis muss **genau 3** Häuser der Stufe 4 haben und mindestens 11 Häuser insgesamt
      (für AK-E3-07 „11 Häuser → 100"); sonst Meldung an den Controller.

- [ ] **2 Fixture schreiben** (einmalig per Scratch-Test im Scratchpad, nicht eingecheckt):
      `writeFileSync('tests/sim/fixtures/save-v8.json', serialize(fixtureV8Run()))`. Prüfen: `"version":8`,
      `islands` mit 3 Einträgen, `"kind":"A"`, kein `"spice"`.
- [ ] **3 Pins** `tests/sim/seePins.ts` (Werte aus dem Lauf, Nullwerte nur als Format, nie im Commit):

```ts
// Pins M12 Seefahrt T00 auf v8-Code: Auftrags- und Brandziehung vor E2/E3, Testwelt mit bekanntem d.
export const SEE_SEEDS = [1, 3, 42] as const;
/** orderForPeriod(seed, k, 4) für k = 0 … 19, je Seed: [good, amount] (AK-E3-04). */
export const ORDER_PINS: Record<number, [string, number][]> = { 1: [], 3: [], 42: [] };
/** Brand: rollCrisis(seed, k, 4, flammableRect(w)).tile für k = 0 … 29 in fireWorld(seed) (AK-E2-07). */
export const FIRE_PINS: Record<number, ({ x: number; y: number } | null)[]> = {
  1: [],
  3: [],
  42: [],
};
/** Kleinster Seed 1 … 500 mit d(0, 2) = 37 (Felsbucht, AK-E4-03), und d(0, 1) dieses Seeds. */
export const SEED_D37 = 0;
export const D_HOME_A_AT_SEED_D37 = 0;
```

      `fireWorld(seed)` = `fixtureV8Run`-unabhängige, kleine Testwelt: `createWorld(seed, { unlockAll: true })` mit
      den brennbaren Gebäuden aus dem bestehenden `fire.test.ts`-Helfer (vorhandenen Helfer nutzen und im Kommentar
      nennen). `amount` und Felder von `orderForPeriod` so pinnen, wie die Funktion sie heute liefert (Typ anpassen).
      `SEED_D37`: Suche über `seaLanes(createWorld(s).islands)`, Lane `a = 0, b = 2`, `d === 37`.

- [ ] **4 Tests** in `save.test.ts`, `describe('M12 Seefahrt Schritt 0 (Anhang 03 B)')`:
  - `T00 save-v8.json roh`: Datei parst, `version 8`, drei Inseln, `tier4Houses = 3`, Häuser ≥ 11.
  - `T00 save-v8.json lädt (v8)`: `deserialize` → `ok`, `serialize(world) === Datei` (zeichengleich).
  - `T00 Pins`: `orderForPeriod` und `rollCrisis` je Seed/k gleich `ORDER_PINS`/`FIRE_PINS`; `SEED_D37` liefert
    `d(0, 2) === 37` und `d(0, 1) === D_HOME_A_AT_SEED_D37`.
    Rot-Beleg (Pins leer) → Werte eintragen → grün.
- [ ] **5 Prüfen:** `make check`, `CI=true make check` grün; `git diff --stat HEAD~1 -- src/` leer (ausser
      erlaubtem `export`).
- [ ] **6 Commit:** `test: M12 Seefahrt Schritt 0, Fixture save-v8.json und Pins` (Rot-Beleg der Pins im Text).
      Das ist der **erste Code-Commit** der Integrationsbranch (Anhang 03 B).

**Review-Fokus:** Rezept nutzt nur bestehende Sim-Aktionen und Controller-Code; Fixture zeichengleich ladbar; Pins
gemessen, nicht geschätzt; keine Änderung in `src/`.
