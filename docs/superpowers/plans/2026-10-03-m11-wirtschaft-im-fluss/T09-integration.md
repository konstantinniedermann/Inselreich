> **Task-ID:** T09 (Paket M11-INT)
> **AK-IDs:** AK-P3-01; AK-P3-07 (aus T08 verschoben); Prüfung AK-BAS-05 (Test schreibt B1)
> **blocked-by:** T06 (Review OK), T08 (Review OK)
> **Strang:** `feat/m11-sim` · Worktree `.worktrees/m11-sim` · Implementierer `tech-sim-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-09](orga-09-wellen-merges.md) · [orga-11](orga-11-bitgleich-neupin.md)

## T09: Integration P2 + P3, `LEVELS` für `hunter`/`cattlefarm`

**Ziel:** Beide Stränge per Merge (kein Rebase) nach `feat/m11-sim` holen, die letzten zwei `LEVELS`-Einträge setzen
(Spec 9 „zuletzt gemergtes Paket", Plan-Entscheid E2), AK-P3-01 und AK-P3-07 schliessen, Pins bitgleich zu T03 belegen,
arc42 für den Ausbau nachführen.

**Code-Fakten:** `feat/m11-sim` steht auf `<T03-SHA>`; `feat/m11-sources` @ `<T06-SHA>` ändert `types.ts`
(`BuildingDefId`), `defs/buildings.ts`, `placement.ts`, `production.ts`, `defs/unlocks.ts`, `src/ui/goal.ts`,
`src/ui/hints.ts`, `docs/arc42.md`, ADR-005 und Tests; `feat/m11-upgrade` @ `<T08-SHA>` ändert `defs/levels.ts`,
`upgrade.ts`, `build.ts`, `src/sim/unlocks.ts`, `tests/sim/upgrade.test.ts`. Die Dateilisten sind disjunkt (T04–T08
„Erwartete Dateien") → Merge ohne Konflikt erwartet. `LEVELS` (`src/sim/defs/levels.ts`) hat danach 9 Einträge;
`BUILDING_IDS` hat 11 Betriebe mit `produces`.

**Erwartete Dateien:** `src/sim/defs/levels.ts` (+ `hunter`, `cattlefarm`), `tests/sim/defs.test.ts` (AK-P3-01),
`tests/sim/upgrade.test.ts` (AK-P3-07), Doku `docs/arc42.md` (Bausteine), `docs/beobachtungen.md` (Befunde aus den
Berichten T07/T08, falls vorhanden). **Nicht anfassen:** alle übrigen `src/`-Dateien, `tests/sim/balance*.test.ts`,
`tests/sim/controller.ts`.

- [ ] **Schritt 0: Merge.** Konflikt → nicht selbst auflösen, Stopp und Meldung an den Controller.

```bash
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/m11-sim
git merge --no-edit <T06-SHA>      # feat/m11-sources, geprüft
git merge --no-edit <T08-SHA>      # feat/m11-upgrade, geprüft
npx tsc --noEmit && npx vitest run # Zwischenstand grün erwartet (AK-P3-01 gibt es noch nicht)
```

- [ ] **Schritt 1: Tests.** `tests/sim/defs.test.ts`, `describe('M11 Ausbau-Werte (Spec 3.6)')`:

```ts
it('AK-P3-01 LEVELS hat genau die 11 Betriebe mit produces, Werte Anhang 01 A.4, ganzzahlig, Stufe 3 schneller', () => {
  const producers = BUILDING_IDS.filter((id) => BUILDING_DEFS[id].produces !== undefined).sort();
  expect(producers).toHaveLength(11);
  expect(Object.keys(LEVELS).sort()).toEqual(producers);
  const T = (
    c: number,
    u: number,
    m: number,
    h: number,
    w: number,
    s: number,
    g: GoodId,
    a: number,
  ) => ({
    cycle: c,
    upkeep: u,
    cost: { money: m, wood: h, tools: w, stone: s },
    fee: { good: g, amount: a },
  });
  expect(LEVELS.hunter).toEqual([
    T(30, 7, 25, 1, 1, 0, 'cloth', 2),
    T(20, 9, 38, 2, 1, 0, 'rum', 2),
  ]);
  expect(LEVELS.cattlefarm).toEqual([
    T(12, 13, 125, 8, 2, 0, 'cloth', 3),
    T(8, 17, 188, 12, 3, 0, 'rum', 3),
  ]);
  for (const id of producers) {
    const [s2, s3] = LEVELS[id]!;
    for (const n of [
      s2.cycle,
      s2.upkeep,
      s3.cycle,
      s3.upkeep,
      ...Object.values(s2.cost),
      ...Object.values(s3.cost),
    ])
      expect(Number.isInteger(n), id).toBe(true);
    expect(s3.cycle, id).toBeLessThan(s2.cycle);
    expect([s2.fee.good, s3.fee.good], id).toEqual(['cloth', 'rum']);
  }
});
```

Die übrigen neun Werte prüft der T07-Test (Vorstufe) wörtlich; AK-P3-01 verweist im Kommentar darauf.

`tests/sim/upgrade.test.ts`, `describe('M11 Kette und Auslastung (Spec 10)')`:

```ts
it('AK-P3-07 Weberei Stufe 2, Schäferei Stufe 1, Wolle 0: in 600 Schritten mindestens einmal waitingInput, utilization < 1000', () => {
  // createWorld(3, { unlockAll: true }); Weg vom Kontor; Schäferei (Gras-Radius ok) und Weberei mit placeBuilding,
  // beide angebunden; weaver.level = 2 (von Hand oder upgradeBuilding mit Stoff 3); w.stock.wool = 0
  let waited = false;
  for (let i = 0; i < 600; i++) {
    step(w);
    if (weaver.state === 'waitingInput') waited = true;
  }
  expect(waited).toBe(true);
  expect(utilization(weaver)).toBeLessThan(1000);
});
```

- [ ] **Schritt 2: Rot-Beleg.** AK-P3-01: `expected [ 'canefarm', … (9) ] to deeply equal [ 'canefarm', 'cattlefarm', …
    (11) ]`. AK-P3-07: auf dem Merge-Stand sofort grün (kein neuer Code); **Rot-Beleg auf `<T08-SHA>`**: Datei-Kopie im
      Worktree `git worktree add --detach .worktrees/m11-qa <T08-SHA>` (node_modules verlinken), Test dort einfügen →
      `expected 1000 to be less than 1000` (ohne `eff`); Worktree danach entfernen. Lauf im Bericht.
- [ ] **Schritt 3: Umsetzung.** `defs/levels.ts`: `hunter: [L(30, 7, 25, 1, 1, 0, 'cloth', 2), L(20, 9, 38, 2, 1, 0,
    'rum', 2)]`, `cattlefarm: [L(12, 13, 125, 8, 2, 0, 'cloth', 3), L(8, 17, 188, 12, 3, 0, 'rum', 3)]` (Anhang 01 A.4;
      Schreibweise wie die übrigen Einträge; Reihenfolge der Schlüssel wie `BUILDING_DEFS`).
- [ ] **Schritt 4: Grün und Bitgleichheit.**
  - `npx vitest run`; `npx tsc --noEmit`; `make check`.
  - Pins: `git diff <T03-SHA> -- tests/sim/balance.test.ts tests/sim/balance-crises.test.ts tests/sim/balance-merchants.test.ts
tests/sim/unlock-timeline.test.ts tests/sim/controller.ts tests/sim/merchantsController.ts` **leer**, alle grün.
    `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance` und die Laufdaten mit dem T03-Bericht vergleichen. Abweichung →
    Stopp, Meldung an L0 (R74), nichts nachstellen.
  - **Prüfung AK-BAS-05** (Test in B1): bitgleicher Fingerabdruck (`OFF_FINGERPRINT`, Gebäudezahlen `OFF_REFERENCE`) heisst
    kein `hunter`, keine `cattlefarm`; `grep -n "upgradeBuilding\|clearForest" tests/sim/controller.ts` leer (kein Ausbau, keine
    Rodung). Ergebnis in den Bericht.
  - `npx vitest run --reporter=verbose 2>&1 | grep -oE "M11[^>]*> (AK-P2S[0-9]-[0-9]+|AK-P3-[0-9]+|AK-UNL-[0-9]+|RF-[4-7])" | sort -u`
    → AK-P2S2-01…05, P2S3-01…04, P2S4-01…06, P3-01…07, UNL-01…05, RF-4…7.
- [ ] **Schritt 5: Doku.** `docs/arc42.md` Bausteintabelle `src/sim/`: neue Zeile `upgrade.ts` („`upgradeBuilding`
      (sieben Gründe, Kosten und Gebühr, `level` +1), `paidCost` für die Abriss-Erstattung"); Zeile `defs/` bzw. neue Zeile
      `defs/levels.ts` („`LEVELS` je Betrieb: Zyklus, Unterhalt, Kosten, Gebühr der Stufen 2 und 3"); Zeile `build.ts`
      (Erstattung 50 % aus `paidCost`); Zeile `unlocks.ts` („`deriveUnlocks`: Stufe ≥ 2 → U3, Stufe 3 → U5, ohne Kette").
      Befunde aus T07/T08 nach `docs/beobachtungen.md`.
- [ ] **Schritt 6: Commit und Push.**

```bash
git add src/sim/defs/levels.ts tests/sim/defs.test.ts tests/sim/upgrade.test.ts docs/arc42.md docs/beobachtungen.md
git commit -m "feat: M11-INT Integration Quellen und Ausbau, LEVELS für Jagdhütte und Rinderfarm (Spec 3.6, 9)"
git -C .worktrees/m11-sim push origin feat/m11-sim
```

SHA ins Ledger `.superpowers/sdd/m11/ledger.md`; danach entstehen `feat/m11-scen` (B1) und die Merges der UI-/Render-Stränge.

**Risiken/Randfälle:** Ein Merge-Konflikt heisst, ein Strang hat eine fremde Datei angefasst (Ownership-Verstoss) → zurück
an den Verursacher. `isWellFormed` (T01) prüft `level` gegen `LEVELS`: erst nach Schritt 3 lädt ein Stand mit ausgebauter
Jagdhütte. AK-P3-07 hängt am Wollnachschub: Schäferei 2,0 / Weberei 3,33 Wolle je 100 Ticks → Wartezeiten sicher.
