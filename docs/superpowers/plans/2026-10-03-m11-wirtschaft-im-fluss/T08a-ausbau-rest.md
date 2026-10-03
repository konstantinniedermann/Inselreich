> **Task-ID:** T08 (Paket M11-P3B)
> **AK-IDs:** AK-P3-05, -06; AK-UNL-04; RF-5 — **AK-P3-07 nach T09 verschoben** (braucht `eff` aus P2, Begründung unten)
> **blocked-by:** T07 (Review OK)
> **Strang:** `feat/m11-upgrade` · Worktree `.worktrees/m11-upgrade` · Implementierer `tech-sim-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-06](orga-06-schnittstellen.md) · [orga-07](orga-07-datei-ownership.md)

## T08: Abriss-Erstattung, `deriveUnlocks`, Brand

**Ziel:** Abriss erstattet 50 % von Bau- plus bezahlten Stufenkosten (`paidCost`, ohne Gebühr); `deriveUnlocks` leitet
U3/U5 aus ausgebauten Betrieben ab; Brand lässt die Stufe stehen (Spec 3.6, Anhang 01 A.5 und C).

**Entscheid AK-P3-07:** „Weberei Stufe 2 / Schäferei 1 → `waitingInput`, `utilization` < 1000" ist ohne `eff` (T06,
anderer Strang) nicht prüfbar: `utilization` liefert hier immer 1000 (`b.eff` fehlt). Eine eff-freie Fassung prüfte nur
die halbe AK. Darum schreibt **T09** den Test nach dem Merge (Rot-Beleg dort: derselbe Test auf dem T08-SHA).

**Code-Fakten (Stand nach T07):**

- `src/sim/build.ts:52-64` `demolish`: `:61` `grantRefund(world, refundCost(BUILDING_DEFS[b.defId].cost))`.
- `src/sim/economy.ts:40-54` `refundCost` (je Feld `floor(/2)`), `grantRefund` (Güter auf Lagerplatz gekappt).
- `src/sim/unlocks.ts:117-124` `deriveUnlocks`: Auslöser plus Eintrag je stehendem Gebäude; `FUNCTION_ENTRY` aus
  `defs/unlocks.ts` (`upgrade2 → U3`, `upgrade3 → U5`, T01).
- `src/sim/crises.ts:130-143` `ignite`: Gebühr `cost.money`, `progress = 0`, `state 'burning'`, `outageUntil`; `level`
  wird nicht berührt. `:149` `beginCrisis(world, k, roll)` exportiert. `:163-167` Ausfall-Ende in `tickCrises`.
- `upgradeBuilding` prüft den Brand schon als Grund (5) (T07).

**Erwartete Dateien:** `src/sim/upgrade.ts` (+ `paidCost`), `src/sim/build.ts` (nur `demolish`), `src/sim/unlocks.ts` (nur
`deriveUnlocks`), `tests/sim/upgrade.test.ts` (neuer `describe`). Doku: keine Datei in diesem Strang (T09 trägt arc42
nach; Befunde in den Bericht). **Nicht anfassen:** wie T07a; zusätzlich `src/sim/crises.ts`, `src/ui/` (die Abriss-Vorschau
in `inspect.ts`/`hints.ts`/`app.ts` rechnet weiter mit `def.cost`: UI-Welle, siehe Risiken).

- [ ] **Schritt 1: Tests** — `tests/sim/upgrade.test.ts`, `describe('M11 Ausbau: Abriss, Freischaltung, Brand (Spec 3.6, 4)')`:

```ts
it('AK-P3-05 Abriss Fischer Stufe 3: +112 Geld, +6 Holz, +2 Werkzeug; Stoff und Rum unverändert', () => {
  const w = world();
  const f = fisherAt(w);
  w.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5'];
  w.stock.rum = 2;
  expect(upgradeBuilding(w, f.id).ok).toBe(true);
  expect(upgradeBuilding(w, f.id).ok).toBe(true);
  expect(paidCost(f)).toEqual({ money: 225, wood: 12, tools: 5, stone: 0 });
  const m = w.money,
    s = { ...w.stock };
  expect(demolish(w, f.id).ok).toBe(true);
  expect([w.money - m, w.stock.wood - s.wood, w.stock.tools - s.tools]).toEqual([112, 6, 2]);
  expect([w.stock.cloth, w.stock.rum]).toEqual([s.cloth, s.rum]);
});
it('AK-P3-06 Brand: Stufe bleibt; Ausbau während des Ausfalls → „Gebäude brennt"; nach dem Ausfall Stufe 2', () => {
  const w = world();
  const f = fisherAt(w);
  expect(upgradeBuilding(w, f.id).ok).toBe(true);
  beginCrisis(w, 0, { kind: 'fire', tile: { x: f.x, y: f.y } }); // keine Feuerwache: brennt
  expect([f.state, f.level]).toEqual(['burning', 2]);
  w.stock.cloth = 2;
  w.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5'];
  expect(upgradeBuilding(w, f.id)).toEqual({ ok: false, reason: 'Gebäude brennt' });
  for (let i = 0; i <= FIRE_OUTAGE; i++) step(w);
  expect([f.outageUntil, f.level]).toEqual([undefined, 2]);
});
it('AK-UNL-04 deriveUnlocks: Fischer Stufe 2 ohne Häuser → U3, nicht U2; Stufe 3 → U5', () => {
  const w = createWorld(3);
  const f = fisherAt(w);
  f.level = 2;
  expect(deriveUnlocks(w)).toEqual(['U0', 'U3']);
  f.level = 3;
  expect(deriveUnlocks(w)).toEqual(['U0', 'U3', 'U5']);
});
it('RF-5 Ausbau im Sturm und bei noForest: Kosten und Gebühr gebucht, eff und state unberührt', () => {
  const w = world();
  const f = fisherAt(w);
  w.crisis = { period: 0, kind: 'storm', from: w.tick, until: w.tick + 300 };
  f.eff = 123456; // Feld seit T01, Akkumulator kommt erst mit T06
  expect(upgradeBuilding(w, f.id).ok).toBe(true);
  expect([f.level, f.eff, f.state, w.money]).toEqual([2, 123456, 'ok', 950]);
  const l: Building = {
    id: w.nextBuildingId++,
    defId: 'lumberjack',
    x: 1,
    y: 0,
    connected: true,
    progress: 7,
    state: 'noForest',
    eff: 1000,
  };
  w.buildings[l.id] = l;
  w.stock.cloth = 2;
  expect(upgradeBuilding(w, l.id).ok).toBe(true);
  expect([l.level, l.state, l.eff, l.progress, w.stock.cloth]).toEqual([2, 'noForest', 1000, 7, 0]);
});
```

- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/sim/upgrade.test.ts -t "Abriss, Freischaltung"`:

| AK        | erwartet rot vor der Umsetzung                                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AK-P3-05  | `paidCost is not a function` (Import); nach Stub: `expected [ 50, 2, 1 ] to deeply equal [ 112, 6, 2 ]`                                                                                                                           |
| AK-UNL-04 | `expected [ 'U0' ] to deeply equal [ 'U0', 'U3' ]`                                                                                                                                                                                |
| AK-P3-06  | **Rot per Mutation:** Verhalten liefern T07 (Grund 5) und `crises.ts`; Implementierer entfernt kurz Grund (5) in `upgrade.ts` → `expected { ok: false, reason: 'Zu wenig …' }` bzw. `{ ok: true }`; zurücksetzen, Lauf im Bericht |
| RF-5      | **Rot per Mutation:** kurz `b.state = 'ok'` vor `return ok` in `upgradeBuilding` → `expected [ 2, 'ok', … ] to deeply equal [ 2, 'noForest', … ]`; zurücksetzen                                                                   |

- [ ] **Schritt 3: Umsetzung.**
  - `upgrade.ts`: `export function paidCost(b: Building): Cost` = `BUILDING_DEFS[b.defId].cost` plus `LEVELS[b.defId][i].cost`
    für `i < (b.level ?? 1) − 1` (je Feld addiert; Gebühr nie). Fischer 3: 100+50+75 / 5+3+4 / 2+1+2 / 0.
  - `build.ts:61`: `grantRefund(world, refundCost(paidCost(b)));` (Import aus `./upgrade`; `upgrade.ts` importiert
    `build.ts` nicht → kreisfrei, `imports.test.ts`).
  - `unlocks.ts` `deriveUnlocks`, in der Gebäudeschleife: `if ((b.level ?? 1) >= 2) out.add(FUNCTION_ENTRY.upgrade2);
if (b.level === 3) out.add(FUNCTION_ENTRY.upgrade3);` (ohne Kette; keine hart codierten Ids).
- [ ] **Schritt 4: Grün.** `npx vitest run`; `npx tsc --noEmit`; `make check`; Balancing unverändert gegen `<T03-SHA>`;
      Testzählbefehl.
- [ ] **Schritt 5: Doku.** Keine Datei; im Bericht für T09: arc42 `build.ts` (Erstattung über `paidCost`), `unlocks.ts`
      (`deriveUnlocks` mit Stufen-Regel).
- [ ] **Schritt 6: Commit und Push.** `git add src/sim/upgrade.ts src/sim/build.ts src/sim/unlocks.ts
    tests/sim/upgrade.test.ts`; `git commit -m "feat: M11-P3B Abriss-Erstattung mit Stufenkosten, deriveUnlocks, Brand
    (Spec 3.6, 4)"`; `git -C .worktrees/m11-upgrade push origin feat/m11-upgrade`.

**Risiken/Randfälle:** `beginCrisis` braucht keine Krisenstufe; die Krise endet in `tickCrises` bei `until`. Der Brand
kostet `def.cost.money` (100) auch bei Stufe 2 (Spec sagt nichts anderes). Die UI-Abriss-Vorschau zeigt bis zur UI-Welle
die Stufe-1-Erstattung (Befund an T11/T12).
