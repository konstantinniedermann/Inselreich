# T02 · Knopf «Zum Erzeuger» (AK-HC-06 bis AK-HC-12)

Umsetzer `tech-ui-engineer`. Dateien: `src/ui/contractJump.ts` (neu), `src/ui/order.ts`, `src/ui/app.ts`, ggf. `src/style.css`, `tests/ui/contractJump.test.ts` (neu), `tests/ui/order.test.ts`.

1. **Rot zuerst:** `tests/ui/contractJump.test.ts` (Welten über `tests/ui/worlds.ts`): `contractProducers` (nur Erzeuger, Reihenfolge, ohne Vertrag leer), Schrittfolge über `stepList` (1., 2., Umlauf, Erzeuger weg), kein Erzeuger → `noProducerMessage` bei unveränderten Deps (Mock), Kontrakt-Test AK-HC-12, Knopf nur bei Vertrag sichtbar (`order.test.ts`). Roten Lauf festhalten.
2. `contractJump.ts` (rein, DOM-frei): `contractProducers(world)` = `focusList(world, c.island, c.good)` gefiltert auf `role === 'producer'`; `runContractJump(deps, dir)` nach dem Muster von `land` in `goodFocus.ts` (Deps: `world`, `activeIsland`, `getCursor`/`setCursor`, `cancelPointerAction`, `centerOn`, `openPanel`, `refresh`, `message`). Meldung wie `focusMessage`. Keinen Gut-Fokus setzen.
3. `order.ts`: `OrderActions.toProducer()`, Knopf `data-field="order-producer"` («Zum Erzeuger») in `renderOrder`, in `updateOrder` nur bei `world.contract !== null` sichtbar; «Kündigen» bleibt der letzte Knopf.
4. `app.ts`: eigener `contractCursor` in der Closure (Reset bei Laden und Neuem Spiel wie `fullSince`, über `restart`), Deps analog `focusDeps`; `goodFocus`-Zustand unberührt.
5. Browser-Beleg 1280×720 und 1920×1080: Knopf, Fokusring, Kartenhöhe mit/ohne Knopf, 6 px zur Krisenkarte (R589), Sprung auf ferne Insel. Neue Tests × 3 (R593). `make check` Exit 0, `git diff src/sim/` leer.
