# T02 · `farMark`, Anzeige-Schlüssel, Tooltip, Einhängen (I-101)

Umsetzer `tech-ui-engineer` · ≈ 40 Tools · AK M1, M2, M3, M4, M5 · blocked-by: T01

## Dateien

- ändern: `src/ui/farOrder.ts`, `src/ui/seaMapView.ts`, `src/ui/hud.ts` (nur der Aufruf `drawSeaMap(…, { hover, dpr: mapDpr })` in `bindIslandMenu`), `tests/ui/seaMapView.test.ts`
- neu: `tests/ui/farMark.test.ts` (nicht `farOrder.test.ts`: UI-E ändert die Datei)
- nicht ändern: `src/ui/app.ts`, `src/sim/`, `src/render/` (nur Typ importieren)

## Verhalten

1. **P-7:** In `farOrder.ts` `farOfferDue(world): number | null` (`ORDER_FIRST_TICK + period * ORDER_PERIOD + FAR_ORDER_DURATION`, `null` ohne Angebot); `farOfferText` nutzt sie, Text bitgleich.
2. `farMark(world): MapMark | null` (Typ aus `../render/seaMap`):
   - `world.order?.island !== undefined` → `kind 'order'`, `island = order.island`, Zeit `order.due − tick`.
   - sonst `world.farOffer !== null` → `kind 'offer'`, `island = farOffer.island`, Zeit `farOfferDue − tick`.
   - sonst `null` (Normalauftrag ohne `island`: `null`).
   - Text `${amount} ${GOODS[good].name} · ${formatGameTime(ticks)}`; **Menge/Gut** aus `order` bzw. `farOffer`.
   - `warn = world.islands[island]!.kontorId === null` (beim Auftrag identisch zu `farOrderWarn(world)`).
3. `seaMapKey(world, l)` bekommt die Markenzeile angehängt: `|m:${island}:${kind}:${text}:${warn ? 1 : 0}` (Text enthält Sekunden aus `formatGameTime`, damit höchstens ein Neuzeichnen je Sekunde); ohne Marke `|m:-`. Ausdrücklich: der bestehende Schlüssel-Präfix bleibt, Pause ändert nichts (Text hängt nur an `world.tick`).
4. `seaMapTip`: für die Fern-Insel `· Fernauftrag: <Menge> <Gut> · <m:ss>` bzw. `· Fernangebot: …` als **letzter** Abschnitt (gleicher Trenner `·`); jede andere Insel bitgleich zu heute.
5. `hud.ts`: `drawSeaMap(ctx, state.world, layout, cache, { hover, dpr: mapDpr, mark: farMark(state.world) })`; sonst nichts in `hud.ts` anfassen.

## Testfälle (rot zuerst; Beleg im Bericht)

Zeit-Erwartungen nie als Literal, immer `formatGameTime(…)` (R662 Auflage 3). Aufbau Fernangebot/Fernauftrag wie in `tests/ui/farOrder.test.ts` bzw. den Fern-Sim-Tests (Hilfen dort suchen, nicht neu erfinden).

- **AK-M1** kein Angebot, kein Auftrag → `null`; Normalauftrag (`island` fehlt) → `null`.
- **AK-M2** Angebot → `offer`, Text mit Frist aus `farOfferDue`; angenommener Fernauftrag → `order`, Text mit `due − tick`; beide Texte stimmen mit `farOfferText`/`farOrderText` in Menge, Gut und Frist überein (Teilstring-Vergleich).
- **AK-M3** `warn` true bei `kontorId === null`, sonst false; beim Auftrag gleich `farOrderWarn(world)`.
- **AK-M4** `seaMapKey` ändert sich: Marke erscheint, verschwindet, Sekundenwechsel, Warnflag; gleicher Stand (auch nach `tick`-Erhöhung innerhalb derselben Sekunde) gleich.
- **AK-M5** `seaMapTip` auf Fern-Insel `endsWith` Fern-Abschnitt; andere Insel und Welt ohne Fernauftrag `toBe` dem bisherigen String.
- **Z2** `farOfferText` bitgleich vor/nach der Extraktion (Bestandstests in `farOrder.test.ts` bleiben unverändert grün).

## Prüfschritte / Task-Review

Reviewer: `farMark` liest nur `world`; `hud.ts`-Diff höchstens die eine Aufruf-Zeile; `tsc`, `make lint` Exit 0.
