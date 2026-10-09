# T02 · Fest wirkt nur auf Häuser der Kapellen-Insel (TDD)

Strang B · Worktree `.worktrees/rel-14-fest` · Branch `fix/rel-14-fest` · Umsetzer `tech-sim-engineer` (sonnet) · AK-Entwürfe B1–B4 (`ak-entwuerfe.md`) · blocked-by –

**Ziel:** Hauskoordinaten sind inselbezogen. `inChapelRadius` prüft heute nur den Abstand; eine Kapelle wirkt deshalb auf Häuser einer Fremdinsel mit passenden Koordinaten (Wirkung über `feastActive`, Steuerprüfung über `taxBlock` → `feastBlockReason`/`holdFeast`). Fix: zuerst die Insel vergleichen, wie es `serviceAvailable`/`coverageSources` schon tun.

**Files (nur diese):**

- Modify: `src/sim/feast.ts` (`inChapelRadius`, Z. ~95–101)
- Test: `tests/sim/feast.test.ts` (neuer `describe`-Block am Dateiende)

**Interfaces:** Consumes `twoIslandWorld()`, `putBuilding(world, island, defId, x, y)`, `houseNearKontor`, `placeService`, `placeTownhall` aus `tests/sim/helpers.ts` (bestehen). Produces: keine neuen Exporte; `feastActive(world, house)`, `feastBlockReason(world, chapel)`, `holdFeast(world, id)` behalten ihre Signaturen.

**Nicht tun:** keine Änderung an `src/sim/save.ts`, `src/sim/types.ts`, `src/sim/defs/`, `tests/sim/balance.test.ts`; keine neue `SAVE_VERSION` (kein Weltfeld, `festive` wird je Tick abgeleitet).

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot)**

In `tests/sim/feast.test.ts` die Importe ergänzen (`twoIslandWorld`, `putBuilding` aus `./helpers`) und am Dateiende anfügen:

```ts
describe('SIM-FEST-INSEL: Fest wirkt nur auf der Kapellen-Insel', () => {
  let tw: World;
  let homeHouse: Building;
  let colonyHouse: Building;
  let homeChapel: Building;

  beforeEach(() => {
    tw = twoIslandWorld();
    homeHouse = houseNearKontor(tw);
    homeChapel = placeService(tw, 'chapel', homeHouse.x + 5, homeHouse.y);
    // Insel 1 liegt im Kachelraster deckungsgleich zur Heimat: gleiche Koordinaten, andere Insel
    colonyHouse = putBuilding(tw, 1, 'house', homeHouse.x, homeHouse.y);
    tw.tick = 1000;
    home(tw).stock.rum = 30;
  });

  it('B1 feastActive: Heimathaus wahr, Kolonie-Haus mit gleichen Koordinaten falsch', () => {
    expect([colonyHouse.island, colonyHouse.x, colonyHouse.y]).toEqual([
      1,
      homeHouse.x,
      homeHouse.y,
    ]);
    expect(holdFeast(tw, homeChapel.id)).toEqual({ ok: true });
    expect(feastActive(tw, homeHouse)).toBe(true);
    expect(feastActive(tw, colonyHouse)).toBe(false);
  });

  it('B3 Kolonie-Kapelle wirkt auf das Kolonie-Haus, nicht auf die Heimat; Rum aus der Kolonie', () => {
    const colonyChapel = putBuilding(tw, 1, 'chapel', homeHouse.x + 5, homeHouse.y);
    tw.islands[1]!.stock.rum = 30;
    expect(holdFeast(tw, colonyChapel.id)).toEqual({ ok: true });
    expect(tw.islands[1]!.stock.rum).toBe(30 - FEAST_RUM);
    expect(home(tw).stock.rum).toBe(30);
    expect(feastActive(tw, colonyHouse)).toBe(true);
    expect(feastActive(tw, homeHouse)).toBe(false);
  });

  it('B2 Steuerprüfung zählt nur Häuser der Kapellen-Insel', () => {
    placeTownhall(tw);
    homeChapel.connected = true; // placeTownhall berechnet die Anbindung neu
    colonyHouse.house!.tier = 2;
    tw.taxLevels = { 1: 'high', 2: 'normal', 3: 'high', 4: 'high' };
    expect(feastBlockReason(tw, homeChapel)).toBe('Steuer «hoch»: kein Aufstieg');
    const r = holdFeast(tw, homeChapel.id);
    expect(reasonOf(r)).toBe('Steuer «hoch»: kein Aufstieg');
    expect(homeChapel.feastAt).toBeUndefined();
    expect(home(tw).stock.rum).toBe(30);
  });

  it('B2 Gegenprobe: daheim «normal», Kolonie «hoch» → kein Sperrgrund', () => {
    placeTownhall(tw);
    homeChapel.connected = true;
    colonyHouse.house!.tier = 2;
    tw.taxLevels = { 1: 'normal', 2: 'high', 3: 'normal', 4: 'normal' };
    expect(feastBlockReason(tw, homeChapel)).toBeNull();
  });
});
```

Hinweise: `homeHouse` hat Stufe 1 (`newHouseState`), das Kolonie-Haus wird auf Stufe 2 gesetzt, damit die je Stufe gespeicherten Steuerregler beide Lagen abbilden. Kollidiert `putBuilding` auf Insel 1 mit dem Kolonie-Kontor (gleiche Lage wie das Heimat-Kontor), einen anderen gemeinsamen Ort im Kapellenradius wählen und das im Bericht nennen; die Aussage der Tests bleibt.

- [ ] **Schritt 2: Rot belegen**

Run: `npx vitest run tests/sim/feast.test.ts; echo EXIT=$?`
Expected: FAIL in B1 (`feastActive(colonyHouse)` ist `true`), B3 (`feastActive(homeHouse)` ist `true`) und B2 (Grund `null`, Fest startet); die Gegenprobe ist schon grün. Ausgabe-Ausschnitt in den Bericht. (Planprobe gegen `main` @ `2c73659`: B1 Kolonie-Haus `true`, B2 Grund `null`, B3 Heimathaus `true` — die Tests sind heute rot.)

- [ ] **Schritt 3: Minimal umsetzen** (`src/sim/feast.ts`)

```ts
/** Haus auf der Insel der Kapelle (Koordinaten sind inselbezogen) mit Mittelpunktabstand im Dienstradius. */
function inChapelRadius(chapel: Building, house: Building): boolean {
  if (chapel.island !== house.island) return false;
  const hc = center(BUILDING_DEFS[house.defId], house.x, house.y);
  const def = BUILDING_DEFS[chapel.defId];
  const c = center(def, chapel.x, chapel.y);
  return Math.hypot(hc.cx - c.cx, hc.cy - c.cy) <= (def.serviceRadius ?? 0);
}
```

Den JSDoc von `taxBlock` um „der Kapellen-Insel“ ergänzen („… ohne ein solches Haus der Kapellen-Insel im Radius …“). Sonst nichts ändern.

- [ ] **Schritt 4: Grün belegen**

Run: `npx vitest run tests/sim/feast.test.ts tests/ui/feast.test.ts tests/sim/population.test.ts tests/sim/upgrade.test.ts tests/sim/balance.test.ts; echo EXIT=$?`
Expected: PASS, EXIT=0 (bestehende Fest-Tests unverändert grün, B4).
Run: `npx tsc --noEmit; echo EXIT=$?` und `make lint; echo EXIT=$?` → je EXIT=0.
Run: `git diff main --stat -- src/sim/save.ts src/sim/types.ts src/sim/defs/ tests/sim/balance.test.ts` → leer.

- [ ] **Schritt 5: Commit**

```bash
git add src/sim/feast.ts tests/sim/feast.test.ts
git commit -m "fix: Fest wirkt nur auf Häuser der Kapellen-Insel (SIM-FEST-INSEL, REL-14)"
```

## Bericht an den Controller

Rot-/Grün-Ausschnitte, Exit-Codes (vitest, tsc, lint), Diff-Stat der geschützten Dateien (leer), Commit-Hash, Abweichungen. README und arc42 nicht anfassen (gehören T03 in Strang A).
