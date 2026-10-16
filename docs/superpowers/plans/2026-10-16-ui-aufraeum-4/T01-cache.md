# T01 · Erzeugungs-Cache `order.ts`

Umsetzer `tech-ui-engineer` · ≈ 35 Tools · AK-1 bis 4 · blocked-by: T00

## Dateien

- ändern: `src/ui/order.ts` (`producedPerMinute`, Kommentar; `export` nur falls der Test es braucht), `tests/ui/order.test.ts`
- nicht ändern: `src/sim/`, `defs/`

## Verhalten (D-1)

Schlüssel `tick|island|good|count|pausedIds|unconnectedIds`, beide Id-Listen aus einem Durchlauf über `Object.values(world.buildings)` als Komma-Liste (Reihenfolge der Iteration, stabil). Der alte Kommentar «Ausser Scope: `connected` …» entfällt, der Kommentar nennt, warum Listen statt Summen. Wert weiter `perMinute(goodProductionPer100(world, island, good), GOODS_BALANCE_TICKS)`.

## Test-first (Rot-Beleg)

1. Neue Fälle in `tests/ui/order.test.ts` (Weg über `orderCardText` mit `contractOffer`, Text `Erzeugung N / min`; Welten per vorhandene Testhelfer): AK-1 (Kollision {1,4} gegen {2,3}: erst Betriebe 1 und 4 stilllegen, Karte lesen, dann 1 und 4 wieder in Betrieb und 2 und 3 still, gleicher Tick), AK-2 (`b.connected = false` setzen, gleicher Tick), AK-3 (Abriss + Neubau mit gleicher Gebäudezahl), AK-4 (Gleichheit mit frischer Berechnung; `JSON.stringify(world)` vor und nach; `vi.spyOn` auf `goodProductionPer100` bzw. Zähler: zweiter Aufruf im selben Zustand rechnet nicht neu).
2. `npx vitest run tests/ui/order.test.ts; echo EXIT=$?`: AK-1 bis 3 müssen **rot** sein (Ausgabe im Ledger), AK-4 darf grün sein.
3. Umsetzen, erneut laufen lassen (Exit 0), `make check; echo EXIT=$?`.

## Prüfschritte

Rot-Beleg liegt im Ledger; `git diff --stat` zeigt nur `order.ts` und `order.test.ts`; Review `qa-code-reviewer` (Urteil OK).
