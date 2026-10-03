> **Task-ID:** T06 (Paket M11-P2C)
> **AK-IDs:** AK-P2S4-01, -02, -03, -04, -05, -06; RF-4
> **blocked-by:** T05 (Review OK)
> **Strang:** `feat/m11-sources` · Worktree `.worktrees/m11-sources` · Implementierer `tech-sim-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-11](orga-11-bitgleich-neupin.md)

## T06: Auslastung `eff`

**Ziel:** Jeder Betrieb mit `produces` führt den Ganzzahl-Akkumulator `eff` (0 … 256 000), in **jedem** Zweig von
`tickProduction` (Spec 3.5, Abweichung 13-3); Anzeige über `utilization(b)` aus T01. Geld und Waren hängen nicht an `eff`.

**Code-Fakten (Stand nach T05):** `src/sim/production.ts` `tickProduction` mit sieben `continue`-Zweigen (`burning`,
`notConnected`, `noService`, `noForest`, Sturm-Aussetzer, `waitingInput`) und dem Fortschrittszweig. `utilization(b)` =
`Math.floor((b.eff ?? 256000) / EFF_WINDOW)` in `src/sim/levels.ts` (T01); `EFF_WINDOW` 256, `EFF_MAX` 1000 in
`src/sim/defs/timing.ts` (T01, AK-P1-01). `Building.eff?` und Save-Prüfung (0 … 256 000, nur an Betrieben) seit T01.

**Nachgerechnet** (Skript, Formel `eff ← eff − floor(eff / 256) + Ziel`): ab 256 000 mit Ziel 0 nach 256 Schritten
`eff` 94 072 → **367 ‰**; `utilization` 0 erstmals nach **1913** Schritten (`eff` bleibt dann bei **255** stehen, Fixpunkt,
nicht 0); ab 0 mit Ziel 1000 nach 1913 Schritten genau 256 000 (**1000 ‰**, nach 1912: 999); Beharrung `ok` bleibt
256 000; Dauersturm (Ziel 1000 nur bei geradem Tick) nach 2000 Schritten **499 oder 501 ‰** je nach Startparität;
300-Tick-Sturm ab ungeradem Tick 1000 → **655 ‰**, ab geradem **654 ‰**. Obergrenze 256 000 wird nie überschritten.

**Erwartete Dateien:** `src/sim/production.ts`; neu `tests/sim/utilization.test.ts`; Doku `docs/arc42.md` (§8 Zustände:
Satz Auslastung). **Nicht anfassen:** `types.ts`, `save.ts`, `levels.ts`, `defs/`, `src/ui/`, `src/render/`,
`tests/sim/balance*.test.ts` (`normalized()` entfernt `eff` seit T03).

- [ ] **Schritt 1: Tests** — `tests/sim/utilization.test.ts`, `describe('M11 Auslastung (Spec 3.5)')`. Lokale Helfer:
      `prod(w, defId, x, y)` fügt einen Betrieb direkt ein (`connected: true`, `progress: 0`, `state: 'ok'`, ohne Kacheln,
      Muster `production.test.ts:15`); `run(w, n)` macht `n`-mal `w.tick += 1; tickProduction(w);` (Tick muss laufen, sonst steht die Sturm-Parität). Fischer liegt auf Wasser-freiem Fleck,
      `tickProduction` prüft keinen Standort (Fischer hat keine Wald-Regel); Nahrung vorher 0.

```ts
it('AK-P2S4-01 Fischer ohne eff, 500 Schritte ok: eff 256 000, utilization 1000', () => {
  const w = createWorld(3);
  w.stock.food = 0;
  const f = prod(w, 'fisher', 0, 0);
  run(w, 500);
  expect([f.state, f.eff, utilization(f)]).toEqual(['ok', 256000, 1000]);
});
it('AK-P2S4-02 Weberei ohne Wolle: nach 256 Schritten 367, nach 2000 genau 0', () => {
  const w = createWorld(3);
  w.stock.wool = 0;
  const v = prod(w, 'weaver', 0, 0);
  run(w, 256);
  expect([v.state, v.eff, utilization(v)]).toEqual(['waitingInput', 94072, 367]);
  run(w, 2000 - 256);
  expect([v.eff, utilization(v)]).toEqual([255, 0]);
});
it('AK-P2S4-03 ab eff 0 mit ok: nach 2000 Schritten genau 1000', () => {
  const w = createWorld(3);
  w.stock.food = 0;
  const f = prod(w, 'fisher', 0, 0);
  f.eff = 0;
  run(w, 1912);
  expect(utilization(f)).toBe(999);
  run(w, 88);
  expect([f.eff, utilization(f)]).toEqual([256000, 1000]);
});
it('AK-P2S4-04 Dauersturm: Fischer 450 … 550 (gemessen 499 oder 501), Jagdhütte 1000', () => {
  const w = createWorld(3, { unlockAll: true });
  w.stock.food = 0;
  const h = hunterAt(w); // hunterSite aus T04 lokal kopiert, placeBuilding mit Weg: 10 freie Waldkacheln, sonst noForest
  w.crisis = { period: 0, kind: 'storm', from: w.tick + 1, until: w.tick + 3000 };
  const f = prod(w, 'fisher', 0, 0);
  run(w, 2000);
  expect(utilization(f)).toBeGreaterThanOrEqual(450);
  expect(utilization(f)).toBeLessThanOrEqual(550);
  expect([499, 501]).toContain(utilization(f));
  expect(utilization(h)).toBe(1000);
});
it('AK-P2S4-05 Speichern nach 777 Schritten, Laden, je 500 weitere: serialize gleich; eff steht im Spielstand', () => {
  // Welt mit Fischer (ok) und Weberei ohne Wolle, beide über placeBuilding mit Weg angebunden; 777 × step(w)
  // const v = …weaver; expect(JSON.parse(serialize(w)).buildings[v.id].eff).toBeLessThan(256000);
  // r = deserialize(serialize(w)); 500 × step auf beiden; expect(serialize(r.world)).toBe(serialize(w))
});
it('AK-P2S4-06 Häuser, Kapelle, Markt nie mit eff; Zwilling mit eff 0 hat nach 1000 Schritten gleiches Geld und Lager', () => {
  // village(4, { unlockAll: true }) + placeService(chapel) + Markt + angebundener Fischer; 1000 × step
  // alle Gebäude ohne produces: b.eff === undefined; Fischer: eff !== undefined
  // Zwilling (deserialize(serialize)) mit fisher.eff = 0 vor dem Lauf: money und stock gleich, eff verschieden
});
it('RF-4 Abriss und Neubau am selben Platz: eff und level weg, Neubau Stufe 1 mit 100 %', () => {
  // angebundene Weberei ohne Wolle, 300 × step → eff < 256 000; b.level = 2 (von Hand, Typ seit T01)
  // demolish, placeBuilding am selben Platz → neues Gebäude: eff undefined, level undefined, utilization 1000
});
```

Start bei Tick 0: erster Sturmtick 1 (ungerade), gemessen 501 ‰; Nahrung nach 2000 Schritten 25 + 40 < 100 (kein
`storageFull`).

- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/sim/utilization.test.ts`: -01 `expected [ 'ok', undefined, 1000 ]
    to deeply equal [ 'ok', 256000, 1000 ]`; -02 `… [ 'waitingInput', undefined, 1000 ] …`; -03 `expected 0 to be 999`; -04
      `expected 1000 to be less than or equal to 550`; -05 `expected undefined to be less than 256000`; -06 Fischer
      `expected undefined not to be undefined`; RF-4 `expected undefined to be less than 256000`.
- [ ] **Schritt 3: Umsetzung** (`production.ts`): Zweig-Logik in eine Funktion ziehen, die meldet, ob `progress` stieg;
      die Schleife bucht danach `eff` für **jeden** Betrieb. Reihenfolge, Zustände und Lagerwirkungen bleiben bitgleich.

```ts
import { EFF_MAX, EFF_WINDOW } from './defs/timing';
/** Ein Schritt eines Betriebs (Prüfreihenfolge Anhang 01 D); true, wenn progress in diesem Schritt gestiegen ist. */
function advance(world: World, b: Building): boolean {
  // Inhalt der bisherigen Schleife; jedes `continue` wird `return false`; nach `b.progress += 1` und dem
  // Abschlussblock (cycleOf(b), addStock, progress = 0) `return true`.
}
export function tickProduction(world: World): void {
  for (const b of Object.values(world.buildings)) {
    if (!BUILDING_DEFS[b.defId].produces) continue; // Häuser, Dienste, Markt: nie eff (AK-P2S4-06)
    const advanced = advance(world, b);
    const target = advanced && b.state === 'ok' ? EFF_MAX : 0; // storageFull zählt 0 (Spec 3.5)
    const eff = b.eff ?? EFF_WINDOW * EFF_MAX;
    b.eff = eff - Math.floor(eff / EFF_WINDOW) + target;
  }
}
```

Der Abschluss eines Zyklus (`progress` 39 → 40 → 0) zählt als „gestiegen" (Flag, kein Vorher/Nachher-Vergleich).

- [ ] **Schritt 4: Grün.** `npx vitest run tests/sim`; `npx tsc --noEmit`; `make check`. Probe (M10-Code plus T04–T06,
      `normalized()` ohne `eff`): alle Balancing-Pins bitgleich. `git diff <T03-SHA> -- tests/sim/balance*.test.ts` leer;
      wackelt ein Pin: Stopp, Meldung an L0 (R74). Testzählbefehl aus index.md.
- [ ] **Schritt 5: Doku.** `docs/arc42.md` §8 Zustände: „M11: Jeder Betrieb führt `eff` (Ganzzahl 0 … 256 000, je Schritt
      `eff − floor(eff / 256) + Ziel`, Ziel 1000 nur bei Fortschritt mit Zustand `ok`); Anzeige `utilization` in Promille;
      Geld und Waren hängen nicht daran; gespeichert."
- [ ] **Schritt 6: Commit und Push.** `git add src/sim/production.ts tests/sim/utilization.test.ts docs/arc42.md`;
      `git commit -m "feat: M11-P2C Auslastung eff in jedem Zweig von tickProduction (Spec 3.5)"`;
      `git -C .worktrees/m11-sources push origin feat/m11-sources`.

**Risiken/Randfälle:** `eff` wird ab dem ersten Schritt an jedem Betrieb geschrieben (auch 256 000); das ändert
`serialize`, nicht den Fingerabdruck (`normalized()` löscht `eff`). Twin-Vergleiche über `serialize` bleiben gleich, weil
beide Seiten `eff` tragen. „Nach 2000 genau 0" heisst `utilization` 0 bei `eff` 255 (Spec meint die Anzeige).
