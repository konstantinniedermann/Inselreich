# T04 · Schiff-Panel: Bilanzzeile und Tooltip (I-103)

Umsetzer `tech-ui-engineer` · ≈ 35 Tools · AK B5b, B7, B8 · blocked-by: T03

## Dateien

- ändern: `src/ui/ships.ts`
- neu: `tests/ui/routeBalanceText.test.ts` (Bestandstest `ships.test.ts` bleibt unverändert)
- nicht ändern: `shipRows`, `shipsKey`-Struktur (P-3), `src/sim/`, `src/style.css` (vorhandene Klassen `negative` und die der Routenzeile genügen)

## Verhalten

1. `routeBalanceText(world, route, balances?): { text: string; warn: boolean; tip: string } | null` (rein):
   - `routeBalance(...) === null` → `null`.
   - Minutenwerte: `goods = Math.floor(perMinute(goodsPer100, GOODS_BALANCE_TICKS))`, `upkeep = perMinute(upkeepPer100, UPKEEP_INTERVAL)` (= 90), `net = Math.floor(perMinute(net100, GOODS_BALANCE_TICKS))`; nie `-0` (`|| 0`).
   - Text: `Warenwert ${signedNum(goods)} / min · Unterhalt ${upkeep} → ${signedNum(net)} · nominal`; `warn = net < 0`.
   - `tip`: «Nominal: Überschuss der Quellinsel, ohne Lager, Reserve und Handel. Weitere Schiffe auf dieser Route teilen den Überschuss.» (Hinweissatz immer, Kurzdesign Regel 6; der zweite Satz steht auch ohne zweites Schiff, weil nur Text).
2. `shipBalanceLines(world, island, balances?): Map<number, {text, warn, tip}>` für die Schiffe mit Bezug zur Insel und `route !== null && !homing`; Schiffe ohne Route oder bei Heimfahrt fehlen (AK-B7).
3. Einbau: In `build()` je Schiff mit Route ein Feld `ship-balance-<id>` unter `ship-route-<id>` (gleiche Klassen wie die Routenzeile plus `negative` per Umschalter); `updateShipSection` setzt Text, `title` und `negative` per `setText`/`classList.toggle`.
4. **Kosten (Index «Kosten»):** `SectionState` bekommt `balTick: number` und das letzte Ergebnis; neu gerechnet wird nur, wenn `world.tick !== st.balTick` (Pause: nie); ein `balances`-Memo je Neurechnung.
5. `shipsKey` unverändert; das Feld existiert, weil `routeSig` (Route) im Schlüssel steckt.

## Testfälle (rot zuerst; Beleg im Bericht)

- **AK-B7** Schiff ohne Route: Zeile fehlt; Heimfahrt: fehlt; Route mit Gewinn: Text passt auf `Warenwert +N / min · Unterhalt 90 → +M · nominal` mit `N`, `M` aus der Rechnung (aus `routeBalance` und `perMinute` berechnet, nicht als Literal); Verlust: `−` und `warn === true`; Lane fehlt (`null`): keine Zeile.
- **AK-B5b** `Unterhalt 90` aus `perMinute(SHIP.upkeep, UPKEEP_INTERVAL)`; Netto abgerundet (Fall mit Bruchteil, z. B. 310,7 → 310 vor Abzug).
- **AK-B8** `shipsKey` ändert sich bei Routenwechsel (zwei Routen am selben Schiff); `shipBalanceLines` folgt der Bilanz (Betrieb auf Quellinsel dazu, Zeile ändert sich); gleiche Welt, zweimal aufgerufen, gleiche Zeile.
- **Z3** DOM-Test mit dem bestehenden Aufbau aus `ships.test.ts`: `updateShipSection` zweimal mit gleichem `tick` ruft `goodsBalance` nicht erneut (Zähler über `vi.spyOn` auf das Modul `flow` oder über ein Memo-Objekt, das der Test mitgibt) und setzt bei Tick-Wechsel neu.

## Prüfschritte / Task-Review

Reviewer: Zeile nur bei Route; keine Rechnung im Tick (`step`); `tsc`, `make lint` Exit 0; `shipsKey` ohne `goodsBalance`.
