# T01 · P1 Kassen-Reichweite (I-168)

Umsetzer `tech-ui-engineer` · ≈ 40 Tools · AK I1 bis I8 · blocked-by: keine (Testsperre R380) · Spec: Teil P1 (Regeln 1 bis 8) · Strang A

## Dateien

- neu: `src/ui/cashReach.ts`, `tests/ui/cashReach.test.ts`
- ändern: `src/ui/hud.ts` (nur `moneyView`/`updateMoney`, Zeilen ≈ 147 bis 185), `src/style.css` (`.hud-money.reach-warn`, `.hud-money.reach-alarm` zu den vorhandenen `.chip.reach-*`), `tests/ui/hud.test.ts` (kleine Ergänzung am Ende, keine Bestandstests ändern)
- nicht ändern: `src/sim/`, Ziel-Chip und Fern-Text in `hud.ts` (Beipack-Stelle), Stufen-Chips (T02)

## Verhalten

1. `cashReach(money, taxes, upkeep): CashReach | null` rein; `net = taxes − upkeep`; Zeile nur bei `money > 0` und `net ≤ −TREND_EPS`, oder `money ≤ 0` und `net ≤ −TREND_EPS` (Text «Kasse ist leer …»). Stufe über `reachView(money, net, Infinity)` aus `reach.ts` (`warn` ≤ 180 s, `alarm` ≤ 60 s).
2. Sekunden Spielzeit, auf 10 s gerundet (Halbwerte nach oben), mindestens 10 s, Format `formatGameTime`. Text und Rate (`signedNum(perMinute(net, UPKEEP_INTERVAL))`) wörtlich nach Spec Regel 5.
3. `updateMoney`: `title` am Chip `data-field="money"` setzen bzw. Attribut entfernen; Klassen `reach-warn`/`reach-alarm` toggeln; `aria-label` um den Satz ergänzen. Alles nur bei Änderung schreiben (Vergleich mit zuletzt Geschriebenem, `balanceShownAt`-Muster). Chip-Text `Geld n` und Klasse `negative` unverändert.

## Testfälle (rot zuerst)

I1 bis I7 aus der Spec; I2 mit `formatGameTime`/`secToTicks`, nie Literal geraten (R270). Zusätzlich ein Test `GOODS_BALANCE_TICKS === UPKEEP_INTERVAL`. I7 Spy auf `setAttribute` und `title`-Setter (1000 Aufrufe, höchstens je ein Schreibzugriff). Keine `Contract`-Literale (R679-2). I8 nur Lauf.

## Prüfungen

`npx vitest run tests/ui/cashReach.test.ts tests/ui/hud.test.ts; echo EXIT=$?` (rot vorher, grün nachher), `npx tsc --noEmit; echo EXIT=$?`, `npx eslint <Dateien> && npx prettier --check <Dateien>; echo EXIT=$?`. Eigener Commit `feat: Kasse-leer-Hinweis im Geld-Chip (I-168)`.
