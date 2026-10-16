# T02 · Auftragskarte zeigt die Vorschau (I-102)

Umsetzer `tech-ui-engineer` · ≈ 30 Tools · I102 AK-6, 7b · blocked-by: T01

## Dateien

- ändern: `src/ui/order.ts` (`orderCardText`, Import `previewOrder` aus `../sim/orders`), `tests/ui/order.test.ts`
- `renderOrder`/`updateOrder` unverändert (`setField` schreibt nur bei Änderung)

## Verhalten (`orderCardText`)

- Zweig «kein Auftrag» (`o === null`): `Nächster Auftrag in ${formatGameTime(…)}` + (wenn `previewOrder(world)` nicht `null`) ` · voraussichtlich ${GOODS[good].name}`.
- Zweig Normalauftrag (`o.island === undefined`): bestehender Text (Auftrag … `· Lager x/y`) + ` · danach voraussichtlich ${Gut}`, wenn Vorschau nicht `null`.
- Zweige Fernauftrag, Vertrag, Angebot: unverändert, keine Vorschau. Die Helferfunktion `rest()` bleibt.
- Breite: Karte umbricht bei 1280 px nicht (T05); Text bleibt eine Zeile wie bisher.

## Testfälle (rot zuerst)

Zeit nur über `formatGameTime(...)` erwarten, nie Literale («0:20», «40 s»).

- **AK-6** (a) kein Auftrag: Text `=== \`Nächster Auftrag in ${formatGameTime(nextOrderTick(w) - w.tick)} · voraussichtlich ${GOODS[g].name}\``mit`g`aus`orderForPeriod`/`previewOrder`; (b) aktiver Normalauftrag enthält `danach voraussichtlich ${Name}` am Ende; (c) Fernauftrag (`island`gesetzt), Stammkunden-Vertrag und -Angebot enthalten kein «voraussichtlich»; (d) vor`ORDER_FIRST_TICK` ebenfalls mit Vorschau.
- **AK-7b** gleiche Welt (Seed, Tick, Stufe) → gleicher Text bei zwei Aufrufen; Welt unverändert (`JSON.stringify`).
- Bestehende `order.test.ts`-Erwartungen für «Nächster Auftrag in …» ohne «voraussichtlich» werden angepasst; jede Anpassung im Bericht nennen (Spec-Änderung, kein Fehler).

## Prüfschritte / Task-Review

Reviewer: kein Gutname hart im Code (`GOODS[...]`), Pause-Verhalten (Text hängt nur am Weltzustand); `tsc`, `make lint` Exit 0.
