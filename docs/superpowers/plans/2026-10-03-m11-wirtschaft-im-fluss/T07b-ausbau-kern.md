> **Task-ID:** T07 (Paket M11-P3A) — Teil 2 von 2
> **AK-IDs:** AK-P3-02, -03, -04; AK-UNL-03
> **blocked-by:** T03 (Review OK)
> **Strang:** `feat/m11-upgrade` · Worktree `.worktrees/m11-upgrade`
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-07](orga-07-datei-ownership.md)
> **Teile:** [T07a-ausbau-kern.md](T07a-ausbau-kern.md) · **T07b-ausbau-kern.md** (diese)

- [ ] **Schritt 1 (Fortsetzung): Ausbau-Tests** in `describe('M11 Ausbau (Spec 3.6)')` (Helfer `fisherAt`, `world` aus T07a):

```ts
it('AK-P3-02 Fischer Stufe 1 → 2: Kosten und Gebühr gebucht, cycleOf 24, upkeepOf 7, Bilanz und Unterhalt folgen', () => {
  const w = world();
  const f = fisherAt(w);
  const s = { ...w.stock };
  const up = totalUpkeep(w);
  expect(upgradeBuilding(w, f.id)).toEqual({ ok: true });
  expect([
    w.money,
    s.wood - w.stock.wood,
    s.tools - w.stock.tools,
    s.cloth - w.stock.cloth,
  ]).toEqual([950, 3, 1, 2]);
  expect([f.level, cycleOf(f), upkeepOf(f)]).toEqual([2, 24, 7]);
  expect(goodsBalance(w).food.produced).toBeCloseTo(100 / 24, 9);
  expect(totalUpkeep(w) - up).toBe(2);
});
it('AK-P3-03 sieben Gründe in Reihenfolge; bei fail bleibt die Welt gleich', () => {
  const w = world();
  const f = fisherAt(w);
  const no = (id: number, reason: string) => {
    const before = serialize(w);
    expect(upgradeBuilding(w, id)).toEqual({ ok: false, reason });
    expect(serialize(w)).toBe(before);
  };
  // Ausgangslage: jede spätere Bedingung verletzt, dann Schritt für Schritt heilen
  w.unlocked = ['U0'];
  f.outageUntil = w.tick + 100;
  f.state = 'burning';
  w.money = 0;
  w.stock.cloth = 0;
  no(9999, 'Gebäude nicht gefunden'); // (1)
  no(w.kontorId, 'Kann nicht ausgebaut werden'); // (2) kein LEVELS-Eintrag
  f.level = 3;
  no(f.id, 'Höchste Stufe erreicht'); // (3)
  delete f.level;
  no(f.id, 'Erst mit den ersten Siedlern'); // (4) functionLock 'upgrade2' → U3-lockText
  w.unlocked = ['U0', 'U2', 'U3'];
  no(f.id, 'Gebäude brennt'); // (5)
  delete f.outageUntil;
  f.state = 'ok';
  no(f.id, 'Zu wenig Geld'); // (6) checkAfford
  w.money = 1000;
  no(f.id, 'Zu wenig Stoff'); // (7) Gebühr Stufe 2
  w.stock.cloth = 2;
  expect(upgradeBuilding(w, f.id).ok).toBe(true);
  w.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5'];
  no(f.id, 'Zu wenig Rum'); // (7) Gebühr Stufe 3
});
it('AK-P3-04 Ausbau bei progress 30: nächster Schritt +1 Nahrung, progress 0', () => {
  const w = world();
  const f = fisherAt(w);
  f.progress = 30;
  w.stock.food = 0;
  expect(upgradeBuilding(w, f.id).ok).toBe(true);
  expect(f.progress).toBe(30); // progress bleibt beim Ausbau
  step(w);
  expect([w.stock.food, f.progress]).toEqual([1, 0]);
});
it('AK-UNL-03 Ausbau vor U3 → U3-lockText; Stufe 2 → 3 vor U5 → U5-lockText', () => {
  const w = world();
  const f = fisherAt(w);
  w.unlocked = ['U0', 'U2'];
  expect(upgradeBuilding(w, f.id)).toEqual({
    ok: false,
    reason: unlockText(UNLOCKS[3]!, 'lockText'),
  });
  w.unlocked = ['U0', 'U2', 'U3'];
  f.level = 2;
  w.stock.rum = 5;
  expect(upgradeBuilding(w, f.id)).toEqual({
    ok: false,
    reason: unlockText(UNLOCKS[5]!, 'lockText'),
  });
});
```

Importe: `upgradeBuilding` aus `../../src/sim/upgrade`, `LEVELS`, `LevelDef` aus `../../src/sim/defs/levels`, `cycleOf`,
`upkeepOf` aus `../../src/sim/levels`, `goodsBalance` aus `../../src/sim/queries`, `totalUpkeep`, `serialize`, `step`,
`unlockText`, `UNLOCKS`, `createWorld`, `idx`.

- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/sim/upgrade.test.ts` → ganze Datei rot: `Failed to load url ../../src/sim/upgrade` (Modul fehlt). Nach dem Anlegen eines leeren `upgrade.ts` mit `export function upgradeBuilding(): Result { return ok; }`: AK-P3-02 `expected undefined to be 2` (Stufe), AK-P3-03 `expected { ok: true } to deeply equal { ok: false, reason: 'Gebäude nicht gefunden' }`, AK-P3-04 `expected [ 0, 31 ] …`
      (Zyklus 40), AK-UNL-03 analog; Vorstufe LEVELS `expected undefined to deeply equal [ … ]`.
- [ ] **Schritt 3: Umsetzung.**
  - `src/sim/defs/levels.ts`: `LEVELS` mit genau den neun Einträgen der Tabelle (Anhang 01 A.4), Kommentar „Index 0 = Stufe
    2, Index 1 = Stufe 3; `hunter`/`cattlefarm` setzt T09".
  - `src/sim/upgrade.ts` (neu; importiert nur `./defs/*`, `./economy`, `./unlocks`, `./types`; kein Import von `build.ts`):

```ts
/** Ausbau eines Betriebs um eine Stufe (Spec 3.6). Wirft nie; bei fail bleibt die Welt unverändert. */
export function upgradeBuilding(world: World, id: number): Result {
  const b = world.buildings[id];
  if (b === undefined) return fail('Gebäude nicht gefunden');
  const levels = LEVELS[b.defId];
  if (levels === undefined) return fail('Kann nicht ausgebaut werden');
  const level = b.level ?? 1;
  if (level === 3) return fail('Höchste Stufe erreicht');
  const lock = functionLock(world, level === 1 ? 'upgrade2' : 'upgrade3');
  if (lock !== null) return fail(lock);
  if (b.outageUntil !== undefined) return fail('Gebäude brennt');
  const next = levels[level - 1]!; // Stufe 1 → Index 0 (Stufe 2)
  const afford = checkAfford(world, next.cost);
  if (!afford.ok) return afford;
  if (world.stock[next.fee.good] < next.fee.amount)
    return fail(`Zu wenig ${GOODS[next.fee.good].name}`);
  pay(world, next.cost);
  takeStock(world, next.fee.good, next.fee.amount);
  b.level = level === 1 ? 2 : 3; // progress, eff, state bleiben (Spec 3.6)
  return ok;
}
```

- [ ] **Schritt 4: Grün.** `npx vitest run tests/sim/upgrade.test.ts tests/sim/imports.test.ts`; `npx vitest run`;
      `npx tsc --noEmit`; `make check`. Balancing unverändert (Controller baut nie aus): `git diff <T03-SHA> -- tests/sim/balance*.test.ts` leer und grün. Testzählbefehl aus index.md.
- [ ] **Schritt 5: Doku.** Keine Datei (siehe T07a); im Bericht die arc42-Zeilen für T09 vorschlagen (`upgrade.ts`,
      `defs/levels.ts`).
- [ ] **Schritt 6: Commit und Push.**

```bash
git add src/sim/defs/levels.ts src/sim/upgrade.ts tests/sim/upgrade.test.ts
git commit -m "feat: M11-P3A Ausbau-Kern, LEVELS für neun Betriebe, upgradeBuilding (Spec 3.6)"
git -C .worktrees/m11-upgrade push -u origin feat/m11-upgrade
```

**Rot-Beleg-Tabelle (kurz):** AK-P3-02, -03, -04, AK-UNL-03 → `Failed to load url ../../src/sim/upgrade`; danach die
Einzelmeldungen aus Schritt 2.

**Risiken/Randfälle:**

- Reihenfolge (6) vor (7): Geldmangel verdeckt fehlenden Stoff — so gewollt (Spec 3.6); der Test heilt schrittweise.
- „Kein Geld" bei `money < 0` kommt aus `checkAfford` (Grund (6)), kein eigener Fall.
- Anbindung ist keine Bedingung (Setzung Spec); ein nicht angebundener Betrieb darf ausgebaut werden.
- Fehlt nach T01 die Funktion `upgrade2`/`upgrade3` in `FUNCTION_ENTRY`, liefert `functionLock` `undefined`-Zugriff:
  Stopp, Rückmeldung (T01-Schnittstelle).
