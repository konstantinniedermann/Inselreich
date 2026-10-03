> **Task-ID:** B1 (Paket M11-B1) — Teil 1 von 2
> **AK-IDs:** AK-BAS-05; AK-M11B-01, -02, -03 (Review-Checkliste)
> **blocked-by:** T09 (Review OK)
> **Strang:** `feat/m11-scen` · Worktree `.worktrees/m11-scen` (ab `<T09-SHA>`) · Implementierer `tech-sim-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-11](orga-11-bitgleich-neupin.md) · [orga-12](orga-12-geaenderte-tests.md) · [orga-14](orga-14-qa-uebersicht.md)
> **Teile:** **B1a-balancing-szenarien.md** (diese) · [B1b-balancing-szenarien.md](B1b-balancing-szenarien.md)

## B1: Fischer-Ausbau-Variante, Referenz-Endwelt, Szenarien

**Ziel:** M-15 messen und pinnen (Controller-Variante „baut Fischer aus", Spec 11.4), die Referenz-Endwelt prüfen
(AK-BAS-05), fünf Szenario-Saves für die Browser-Checks bauen (Anhang 02 F) und die Belege für AK-M11B-03 sammeln.

**Code-Fakten (Stand T09):**

- `tests/sim/controller.ts:279` `startColony(w)`, `:296` `runColony(w, layout, t, opts, stop?)`: `stop` läuft **nach**
  jedem `step`, vor der nächsten Steuerung (`control` bei `tick % CONTROL_INTERVAL === 0`, `:304`); `:19`
  `CONTROL_INTERVAL` 100; `:21` `RESERVE` 300 (nicht exportiert); `Trajectory` (`:261`) mit `winTick`, `minMoney`,
  `endMoney`, `buildings`. Der Controller bleibt **unverändert** (Global Constraints).
- `upgradeBuilding`, `LEVELS` (T07/T09), `functionLock` (`src/sim/unlocks.ts`).
- Sollwerte Spec 14: M-01 Sieg 6750, M-02 `minMoney` 117; M-15 „bei B1 gemessen".

**Erwartete Dateien:** neu `tests/sim/balance-upgrade.test.ts`; `tests/sim/scenarios.ts` (fünf Szenarien, Prüfpunkte,
`KEEP_UNLOCKS`); `tests/sim/scenario-saves.test.ts` (AK-M11B-02, Umschreibung `writeProbes`-Zählung). Doku:
`docs/beobachtungen.md` (Spec-Lücken unten, falls L0 sie nicht vorher entscheidet). README und arc42 schreibt D1
(AK-M11B-04). **Nicht anfassen:** `src/`, `tests/sim/controller.ts`, `merchantsController.ts`, `balance*.test.ts`
ausser der neuen Datei.

- [ ] **Schritt 1: Tests** — `tests/sim/balance-upgrade.test.ts` (neu):

```ts
const UPGRADE_RESERVE = 300; // Geld nach dem Ausbau, wie RESERVE im Controller (dort nicht exportiert)
const FEE_RESERVE = 5; // Gebührenware, die nach dem Ausbau für die Häuser im Lager bleibt

/** Variante „baut Fischer aus" (Spec 11.4): zwischen zwei Schritten, nur bei tick % 100 === 50 (abseits der
 *  Controller-Takte), höchstens ein Ausbau je Takt, kleinste Id zuerst; Stufe 2 ab U3, Stufe 3 ab U5. */
function upgradeFishers(w: World): void {
  if (w.tick % CONTROL_INTERVAL !== 50) return;
  for (const b of Object.values(w.buildings)) {
    if (b.defId !== 'fisher' || b.level === 3) continue;
    const lv = b.level ?? 1;
    if (functionLock(w, lv === 1 ? 'upgrade2' : 'upgrade3') !== null) continue;
    const next = LEVELS.fisher![lv - 1]!;
    if (w.money - next.cost.money < UPGRADE_RESERVE) continue;
    if (w.stock[next.fee.good] - next.fee.amount < FEE_RESERVE) continue;
    if (upgradeBuilding(w, b.id).ok) return;
  }
}

function variant(): Trajectory & { levels: Record<1 | 2 | 3, number> } {
  const w = createWorld(3); // Krisen aus, Seed 3
  const { layout, t } = startColony(w);
  runColony(w, layout, t, {}, (x) => {
    upgradeFishers(x);
    return false;
  });
  const levels = { 1: 0, 2: 0, 3: 0 };
  for (const b of Object.values(w.buildings)) if (b.defId === 'fisher') levels[b.level ?? 1] += 1;
  return { ...t, levels };
}

/** M-15, gemessen auf <SHA> mit `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-upgrade.test.ts` (Spec 14). */
const M15 = { winTick: 0, minMoney: 0, levels: { 1: 0, 2: 0, 3: 0 } }; // Platzhalter → Messwerte (Schritt 3)

describe('M11 Balancing Ausbau (Spec 11.4)', () => {
  it('AK-M11B-01 Variante „baut Fischer aus": Sieg ≤ 6750 (M-01), minMoney ≥ 0; M-15 gepinnt', () => {
    const r = variant();
    if (import.meta.env.VITE_BALANCE_LOG) console.log('M-15', JSON.stringify(r));
    expect(r.levels[2] + r.levels[3]).toBeGreaterThan(0); // die Variante greift
    expect(r.winTick).not.toBeNull();
    expect(r.winTick!).toBeLessThanOrEqual(6750);
    expect(r.minMoney).toBeGreaterThanOrEqual(0);
    expect({ winTick: r.winTick, minMoney: r.minMoney, levels: r.levels }).toEqual(M15);
  });
  it('AK-BAS-05 Referenz-Endwelt: 0 Jagdhütten, 0 Rinderfarmen, kein level; nie ein Betrieb in noForest', () => {
    const w = createWorld(3);
    const { layout, t } = startColony(w);
    let noForest = 0;
    runColony(w, layout, t, {}, (x) => {
      noForest += Object.values(x.buildings).filter((b) => b.state === 'noForest').length;
      return false;
    });
    expect(t.winTick).toBe(6750); // M-01 als Kontrolle, dass es der Referenzlauf ist
    expect([t.buildings.hunter ?? 0, t.buildings.cattlefarm ?? 0]).toEqual([0, 0]);
    expect(Object.values(w.buildings).filter((b) => b.level !== undefined)).toEqual([]);
    expect(noForest).toBe(0);
  });
});
```

- [ ] **Schritt 2: Rot-Beleg (Teil 1).** `npx vitest run tests/sim/balance-upgrade.test.ts`: AK-M11B-01 rot mit
      `expected { winTick: …, minMoney: …, levels: {…} } to deeply equal { winTick: 0, minMoney: 0, … }` (Platzhalter).
      AK-BAS-05: **vor der Umsetzung grün erlaubt** (Regressionsschutz über den unveränderten Controller, Muster M10
      AK-B1-01); Rot per Mutation: im `stop`-Rückruf kurz `x.buildings[x.kontorId]!.state = 'noForest'` setzen → `expected <n> to be 0`;
      zurücksetzen, Lauf im Bericht.
- [ ] **Schritt 3: Messen und pinnen.** `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-upgrade.test.ts` → `M15`
      mit den gemessenen Werten füllen, Kommentar mit Commit-SHA und Befehl. **Schwellen sind hart:** Sieg > 6750 oder
      `minMoney` < 0 → **nicht** an `UPGRADE_RESERVE`/`FEE_RESERVE` drehen, Stopp, Meldung an L0 (R74-Muster) mit den
      Laufdaten; der Test bleibt rot bis zum Ruling.

Fortsetzung (Szenarien, AK-M11B-02, -03, Schritte 4–6): [B1b-balancing-szenarien.md](B1b-balancing-szenarien.md).
