# T05 · `balanceFlow.ts`: Chip «+E / −U», Tooltip, aria-label (I-108)

Umsetzer `tech-ui-engineer` · ≈ 40 Tools · I108 AK 1 bis 10 · blocked-by: T04

## Dateien

- neu: `src/ui/balanceFlow.ts`, `tests/ui/balanceFlow.test.ts`
- ändern: `src/ui/hud.ts` (`balanceView`, `balanceTooltip`; `BALANCE_PREFIX` entfällt, falls unbenutzt), `src/style.css` (nur `.hud-balance`-Regeln), `tests/ui/hud.test.ts` (zwei Erwartungen, P-4)
- nicht ändern: `balanceText` (Vertrag für `balancePreview.ts`), `balanceDue`, `createBalanceButton`, `src/sim/`

## Verhalten

1. `flowText(stats): string` = `+${part(taxes)} / −${part(upkeep)}`; `part(x)`: `v = perMinute(x, UPKEEP_INTERVAL)`; `v >= 10000` → `Math.floor(v / 100) / 10` mit Dezimalkomma plus `k` (abgeschnitten, nie gerundet über die Grenze; `10000` → `10,0k`); sonst ganze Zahl; nie `NaN`, nie `-0`. Schwelle `10000` als benannte UI-Konstante `SHORT_FROM`.
2. `flowTitle(world)` / `flowLabel(stats)`: Klartext `Bilanz ${signedNum(net)} / min · Steuern +${E} / min · Unterhalt −${U} / min` (volle Zahlen aus `perMinute`).
3. `balanceView(world)`: `{ icon: 'balance', text: flowText(stats), label: flowLabel(stats) }` (aria-label mit Netto, Einnahmen, Unterhalt).
4. `balanceTooltip(world)`: beginnt mit `Bilanz ${signedNum(net)} / min`, danach Steuern und Unterhalt mit vollen Zahlen (`balanceText(stats).title` kann die Zeile liefern); Zeile «Steuer: … (keine Amtsstube)» bleibt wie bisher.
5. Klasse `negative` und Klick: unverändert (`refresh` in `hud.ts` rechnet `taxes − upkeep < 0`).
6. CSS: nur `white-space: nowrap` und bei Bedarf `min-width: 0` an `.hud-balance`; keine neue Farbe. Breite wird in T06 geprüft.

## Testfälle (rot zuerst; Beleg im Bericht)

- **AK-1** `flowText({taxes, upkeep})` mit Werten, die `+540 / −780` ergeben (`taxes = 540 / 6` je 100 Ticks usw.; Rechnung im Test über `perMinute`, nicht per Literal-Faktor), Minus ist U+2212.
- **AK-2** Unterhalt 0 → `+540 / −0`; Einnahmen 0 → `+0 / −780`; beide 0 → `+0 / −0`; `-0`/`NaN` kommen nie vor (`not.toMatch(/NaN|-0/)`).
- **AK-3** `9999` bleibt ganz; `10000` → `10,0k`; `12345` → `12,3k`; `12399` → `12,3k` (abgeschnitten); jeder Teil ≤ 6 Zeichen, Chip-Text ≤ 15 Zeichen bis 999 999.
- **AK-4** `balanceTooltip` beginnt mit `Bilanz −240 / min`-Muster (aus Stats berechnet), nennt volle Steuern/Unterhalt, enthält ohne Amtsstube «Steuer: normal (keine Amtsstube)» (Bestandstest bleibt grün).
- **AK-5** `balanceView(w).label` enthält Netto, Einnahmen, Unterhalt. `hud.test.ts` Z. ≈ 187–188: `toBe(balanceText(...).text)` wird mit genau dem neuen Wert ersetzt (`toBe(flowLabel(w.stats))` plus `toContain` je Teil), nicht gestrichen. Zusätzlich (R679-3) eine **unabhängig berechnete** Erwartung: Wert als Klartext aus festen `stats` (z. B. `taxes`/`upkeep` so gewählt, dass die Minutenwerte ganze Zahlen sind) von Hand im Test notiert und mit `toBe` gegen `label` geprüft, nicht nur gegen `flowLabel(w.stats)`.
- **AK-6** Netto < 0: nach `refresh` `negative` am Chip (bestehende DOM-Tests, ein Fall je Vorzeichen); Chip-Text unabhängig vom Vorzeichen gleich aufgebaut.
- **AK-7** gleicher `stats`-Eingang → gleicher Text (kein Parameter für Tempo/Pause im Helfer; Signatur beweist es, Test ruft zweimal auf).
- **AK-8, 9** `balanceDue`-Tests und Klick-Test in `hud.test.ts` unverändert grün (Lauf im Bericht).
- **AK-10** `git diff main -- src/sim src/sim/defs tests/sim/balance.test.ts` im Bericht leer (außer `routeBalance.ts` aus T03).

## Prüfschritte / Task-Review

Reviewer: `balanceText` byteweise unverändert; `balancePreview.test.ts` und `contracts-haeppchen.test.ts` grün; `tsc`, `make lint` Exit 0; Erwartungen mit genauem Wert (keine abgeschwächten `toMatchObject`).
