# T04 · Verdrahtung in `app.ts`

Umsetzer `tech-ui-engineer` · ≈ 40 Tools · AK-UD-07, 08, 09 · blocked-by: T03

## Dateien

- ändern: `src/ui/app.ts` (Vergleichsstand `autoPrev`, Aufrufe im Frame nach dem Tick, Rücksetzen)
- `app.ts` hat keinen Unit-Test: die Logik liegt in `autoLog.ts` (T02/T03), hier nur Verdrahtung nach dem Muster `farPrev`/`prevOrder`

## Verdrahtung

1. `let autoPrev = autoSnap(world)` neben `farPrev` (Z. ≈ 693).
2. Im Frame nach `farLogged`-Block (Z. ≈ 1622): `const expired = expiryLogEntries(autoPrev, world)`, `const contracted = contractLogEntries(reports, world, world.tick)` (die `reports` stehen im Rahmen von `if (state.speed > 0)`; Liste in eine Variable ausserhalb ziehen, bei Pause leer). Beide per `pushLog` (Reihenfolge: Verfall, Vertrag), `state.logUnread = nextUnread(...)`; **kein** `showMessage` für diese Einträge (Toast kommt schon aus `orderMessage` bzw. `announceContract`). Danach `autoPrev = autoSnap(world)`.
3. Rücksetzen auf den aktuellen Stand `autoPrev = autoSnap(world)` in den Handlern **Annehmen** (`accept`), **Ablehnen** (`declineContract`-Zweig, Z. ≈ 413), **Liefern** (nach `prevOrder = null`) und **Fern annehmen**, sowie nach Laden (Z. ≈ 394, wo `logUnread = 0`). Neue Insel (`restart(root)`) baut `app` neu auf, Puffer ist leer, Box verborgen.
4. Reihenfolge-Randfall: Mehrere Verfälle im selben Frame → älteste zuerst (Stammkunde, Zufall, Fern); Fern-Einträge kommen aus dem bestehenden `farLogEntries`-Block davor, die Reihenfolge der drei Blöcke ist im Code festgelegt und im Task-Bericht genannt.

## Testfälle

Vitest nur für die Helfer (T02/T03). Für die Verdrahtung: ein Quelltext-Test in `tests/ui/autoLog.test.ts` ist **nicht** vorgesehen (Verdrahtungs-Tests per grep wären brüchig); Abnahme über Browser-Check T08.

- **AK-UD-07, 08** (Browser, T08): siehe `T08-playtest.md`.
- **AK-UD-09** `git diff main -- src/sim tests/sim` leer; Spielstand enthält kein Log-Feld (`grep -n eventLog src/sim` leer); `make check` grün, `tests/sim/balance.test.ts` unberührt.

## Prüfschritte / Task-Review

Reviewer: jeder Handler, der `world.order`/`contractOffer` ändert, setzt `autoPrev` zurück (grep `acceptContract|declineContract|deliverOrder|acceptFarOrder|loadSlot` in `app.ts`); Kein Eintrag nach Laden mitten im Auftrag (Basis ist der geladene Stand).
