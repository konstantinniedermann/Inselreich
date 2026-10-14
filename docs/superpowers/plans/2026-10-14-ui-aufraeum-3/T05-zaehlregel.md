# T05 · Gemeinsame Zählregel `flow.ts` / `production.ts`

Umsetzer `tech-sim-engineer` · Schätzung 30 Tools · AK-UA3-15 bis 17 · blocked-by: T04

## Dateien

- ändern: `src/sim/flow.ts` (neu `export function producedRate(world: World, b: Building): number`; `goodsBalance` ruft sie), `src/ui/production.ts` (`goodProductionPer100` ruft sie)
- ändern: `tests/sim/flow-count.test.ts`, `tests/ui/production.test.ts`

## Testfälle (rot zuerst)

- **AK-UA3-15** `producedRate`: 0 für Haus, nicht angebundene, stillgelegte und zyklusfreie Gebäude; sonst `100 / cycleOf(world, b)` (Rot: Funktion fehlt).
- **AK-UA3-16** Gleichheit `goodProductionPer100(w,i,g) === goodsBalance(w,i)[g].produced` per `toBe` (bitgleich) auf mindestens drei Welten (bestehender Test in `production.test.ts` bleibt, nun streng).
- **AK-UA3-17** `goodsBalance` unverändert: Snapshot aller Güter einer Messwelt vor und nach (Wert vor dem Umbau als Konstante festhalten); `tests/sim/balance.test.ts` unberührt grün.

## Schritte

1. Konstante der Messwelt vor dem Umbau erheben, Tests (Rot), 2. Funktion extrahieren, Reihenfolge der Addition unverändert (`out[g].produced += rate`), 3. `production.ts` umstellen, 4. grün. Zeit: Median `goodProductionPer100` bei 1200 Gebäuden weiter ≈ 0,03 ms (R612), kein Rückfall.

## Prüfschritte / Task-Review

Reviewer (sim-bewusst): kein `Math.random`/DOM, `src/sim/save.ts` und `defs/` diff leer, Fähigkeit `Coverage` nicht berührt; Final-Review prüft arc42-Nachtrag (T07).
