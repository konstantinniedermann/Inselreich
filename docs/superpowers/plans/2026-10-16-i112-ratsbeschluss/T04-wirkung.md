# T04 · Wirkung der sechs Beschlüsse

`tech-sim-engineer` · ≈ 45 Tools · AK 5, 6, 7, 17 (Sim-Teil) · blocked-by: T03, Ruling R-3 · Test zuerst (rot vor Umsetzung)

Dateien: `src/sim/council.ts` (nur Helfer-Rümpfe), `tests/sim/council.test.ts`. Keine Änderung an Lesern (seit T01 über die Helfer).

## Umsetzung

Gemeinsame interne Funktion `activeLever(world, kind, key)`: läuft über die drei Stufen, nimmt bei `council[n] ∈ {'A','B'}` den Hebel
`COUNCIL[n][side].lever` und liefert dessen `value`, wenn `kind` und `defId`/`tier` passen; sonst `undefined`. O(3), kein Speicher in der Welt.

- `serviceRadiusOf`: `activeLever(world, 'serviceRadius', defId) ?? BUILDING_DEFS[defId].serviceRadius`.
- `maxInhabitantsOf`: `activeLever(world, 'maxInhabitants', tier) ?? TIERS[tier].maxInhabitants`.
- `councilCycle(world, defId, cycle)`: ohne Hebel `cycle`; mit Hebel `v` nach **R-3**:
  - **Variante P (Empfehlung, proportional):** `Math.max(1, Math.floor((cycle * v) / BUILDING_DEFS[defId].cycle!))`.
    Grundstufe 50 → 40 bzw. 30; Ausbau 30 → 24 / 18, 20 → 16 / 12 (Weberei, Brennerei / Glashütte).
  - **Variante G (nur Grundstufe):** `cycle === BUILDING_DEFS[defId].cycle ? v : cycle` (Ausbau unberührt).
- Takt-Wechsel mitten im Zyklus: keine Sonderregel; `production.ts` vergleicht `progress` mit dem neuen Takt (Spec §7).

## Tests (`council.test.ts`, Testnamen mit AK-Nummer)

- «AK-5» je Beschluss ein Szenario; jeweils auch Gegenseite und unentschieden = Def-Wert:
  Webordnung `cycleOf(weaver)` 40 · Glockenrecht Haus in Mittenabstand 12 hat `faith`, 14 nicht (`serviceAvailable` nach `step`);
  Fest: `feastActive(w, haus)` in Abstand 12 wahr, 14 falsch (laufendes Fest per `holdFeast`) · Brennrecht 40 · Wohnordnung `maxInhabitantsOf(w, 3)` 16 ·
  Glasrecht 30 · Hofrecht `maxInhabitantsOf(w, 4)` 22. Ausbaustufe nach R-3 (Variante P: Weberei Stufe 2 → 24).
- «AK-6»: Weberei auf zweiter Insel (`islands`-Hilfe aus `tests/sim/helpers.ts`) und eine nach dem Beschluss gebaute → `cycleOf` 40; mit
  Inselvorteil gilt `floor(40 × TRAIT_CYCLE_PCT / 100)`.
- «AK-7»: volles Bürgerhaus (15), Bedürfnisse erfüllt, Wohnordnung → nach einem Wachstumstakt 16; dasselbe Haus mit unerfülltem Bedarf
  wächst nicht und verliert 1 (P-3, Regel `tickPopulation`); `upgradeStatus` meldet bei 15 «Haus nicht voll belegt», bei 16 nicht;
  `tierCap(w, 3, 'high')` = 12; `unlocks.ts` tierWish Stufe 4 verlangt 16.
- «AK-17 Sim»: `placementZone(w, 'chapel', x, y).radius` = 13 nach Glockenrecht, 10 ohne; `coverageMask` folgt.
- Bitgleich ohne Beschluss: `JSON.stringify` nach 200 `step` mit `council` `'open'` gleich dem Lauf mit `null`.

## Prüfschritte

Allgemeine Prüfungen laut Plan-Index · `npx vitest run tests/sim/council.test.ts tests/sim/population.test.ts tests/sim/feast.test.ts tests/sim/queries.test.ts; echo EXIT=$?` ·
`npx vitest run tests/sim/balance.test.ts; echo EXIT=$?`. Commit `feat: Wirkung der Ratsbeschlüsse über die Lese-Helfer (I-112)`.
