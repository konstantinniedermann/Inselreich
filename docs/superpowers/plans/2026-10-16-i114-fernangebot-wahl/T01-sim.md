# T01 · Sim: `farAlternative` und `acceptFarOrder(world, pick)`

`tech-sim-engineer` · ≈ 40 Tools · AK-1 bis AK-9 · blocked-by: T00 · Test zuerst (rot vor Umsetzung)

Dateien: `src/sim/orders.ts`, `tests/sim/farOrder-alternative.test.ts` (neu), `tests/sim/orders.test.ts` (nur falls Export-Test nötig). Kein `types.ts`, kein `save.ts`, kein `defs/`.

## Umsetzung

1. Interne Funktion `farOfferFor(world, island): FarOffer` aus dem Rumpf von `offerFarOrder` herausziehen (`good = farGood`, `amount = GOODS[good].order!.far!`, `reward = amount * orderUnitReward(good)`); `offerFarOrder` ruft sie auf, Verhalten bitgleich.
2. `export function farAlternative(world: World): FarOffer | null` (reine Lesefunktion, kein RNG, keine Mutation): `null` wenn `world.farOffer === null` oder `world.order === null`; `e = farEligible(world)`; `null` wenn `e.length < 2`; `island = e[(world.order.period + 1) % e.length]`; `null` wenn `island === world.farOffer.island`; sonst `farOfferFor(world, island)`.
3. `acceptFarOrder(world, pick: 0 | 1 = 0)`: Sperre, Angebot, Vertrag wie bisher; `offer = pick === 1 ? farAlternative(world) : world.farOffer`; `pick === 1` und `null` → `fail('Kein zweites Angebot')` (vor jeder Mutation); danach Kontor-Prüfung, Auftrag-Prüfung und Folgen unverändert, aber mit `offer`. Prüfreihenfolge bleibt: Sperre, Angebot, Vertrag, (Zweitangebot), Kontor, Auftrag.
4. Doc-Kommentare (deutsch, wie Bestand) ergänzen.

## Tests (`farOrder-alternative.test.ts`, Hilfen aus `tests/sim/helpers.ts` und `farOrder-sea.test.ts` wiederverwenden)

AK-1 Zweitkarte = `e[(k+1) mod n]`, Gut/Menge/Prämie nach Formel, Insel ≠ `farOffer.island` · AK-2 `null` bei einem Kontor, ohne Angebot, Vertrag, Sperre, Fernauftrag · AK-3 `JSON.stringify(world)` vor/nach gleich · AK-4 `acceptFarOrder(w)` = `acceptFarOrder(w, 0)` bitgleich (Weltzustand nach Aufruf gleich) · AK-5 `pick = 1` setzt Auftrag der Zweitkarte, `due`, `farOffer === null`, `farSkip === period + 1` · AK-6 `pick = 1` ohne Zweitangebot: `{ ok: false, reason: 'Kein zweites Angebot' }`, Welt unverändert; Zweitkarte ohne Kontor (Abriss): Kontor-Fehler, Welt unverändert · AK-7 Kontor nach Angebot gegründet: Erstangebot gleich, Zweitkarte folgt `e`, nie gleich Erstinsel · AK-8 gleicher Seed und Eingaben, `pick` 0 und 1 reproduzierbar; `rng`-Zustand vor/nach `farAlternative` gleich · AK-9 `SAVE_VERSION` unverändert (Vergleich mit Konstante im Test), Spielstand mit offenem Fernangebot: `serialize → load → serialize` gleich.

## Prüfschritte

`npx vitest run tests/sim; echo EXIT=$?` · `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` (AK-9, bitgleich ohne Diff an `defs/`) · `make check; echo EXIT=$?` · `git diff --stat main -- src/sim/types.ts src/sim/save.ts src/sim/defs` leer. Commit `feat: farAlternative und acceptFarOrder pick (I-114)`.
