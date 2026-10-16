# T02 · UI-Text, `shouldWarnNow`, `flashOrderCard`, Beipack farSkip

`tech-ui-engineer` · ≈ 30 Tools · AK-W7, AK-W8 · blocked-by: T01 · Test zuerst (Rot-Beleg)

Dateien: `src/ui/order.ts`, `tests/ui/contractWarn.test.ts` (neu). Bestehende Tests (`order.test.ts`, `loyalty.test.ts`, `hud.test.ts`) bleiben unverändert grün.

## Umsetzung

1. `orderCardText`, Vertragszweig: Rest bis zur Abrechnung mit `nextSettleTick` statt `nextOrderTick` (**Beipack farSkip**, nur wenn die Probe in T01 bestätigt hat; sonst weglassen und Beobachtung melden). Danach `const w = contractWarning(world)`; bei `w !== null` an die Zeile anhängen:
   - `reason 'stock'`: ` · Fehlt: ${w.missing} ${GOODS[c.good].name}`; `'kontor'`: ` · kein Kontor${islandSuffix}` (Text «kein Kontor auf {Insel}»).
   - `outcome 'excuse'`: ` · Kulanz wird verbraucht`; `'break'`: ` · sonst Strafe ${w.penalty}`.
2. `export function warnPeriod(world: World): number` = `(nextSettleTick(world) - ORDER_FIRST_TICK) / ORDER_PERIOD`.
3. `export function shouldWarnNow(prev: number | null, w: ContractWarning | null, period: number): boolean` = `w !== null && prev !== period`.
4. `export function flashOrderCard(el: HTMLElement): void`: setzt `order-card--soon`, entfernt sie nach 2500 ms (`setTimeout`; vorherigen Timer löschen, Klasse neu starten per `classList.remove` + `offsetWidth`-freier Variante: erst entfernen, dann setzen reicht, weil Aufruf nur einmal je Periode). Beim Aufräumen (`dispose`) kein offener Timer: Rückgabe `() => void` zum Abbrechen, `app.ts` ruft es in T04.
5. `updateOrder` bleibt unverändert (Orange bleibt `contractWarn`).

## Tests (`contractWarn.test.ts`)

AK-W7 Warnzustand: Text enthält «Fehlt: 5 Rum» und «Kulanz wird verbraucht» (`deliveries` 5) bzw. «sonst Strafe N» (`deliveries` 4), «kein Kontor auf …» bei fehlendem Kontor; ausserhalb des Fensters Text bitgleich zum Bestand (Vergleich mit Welt ohne Warnzustand) · Beipack: Karte nach Fernauftrag und Vertrag zeigt `formatGameTime(nextSettleTick - tick)` (rot vor Umsetzung, falls bestätigt) · AK-W8 `shouldWarnNow`: erste Meldung je Periode `true`; zweite derselben `false`; nächste Periode `true`; `null`-Warnung `false`; Priming (`prev = period`) `false` · `flashOrderCard`: Klasse da, nach 2500 ms (Fake-Timer, `vi.useFakeTimers`) weg; Abbruch-Funktion entfernt den Timer.

## Prüfschritte

`npx vitest run tests/ui/contractWarn.test.ts tests/ui/order.test.ts tests/ui/loyalty.test.ts tests/ui/hud.test.ts; echo EXIT=$?` · `npx tsc --noEmit; echo EXIT=$?` · `make lint; echo EXIT=$?` · `make conflicts; echo EXIT=$?`. Commit `feat: Warnzusatz der Vertragskarte (I-122)`.
