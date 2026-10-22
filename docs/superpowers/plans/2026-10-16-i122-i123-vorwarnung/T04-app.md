# T04 · `app.ts`-Verdrahtung, CSS, Dev-Sonde

`tech-ui-engineer` · ≈ 30 Tools · AK-W9 · blocked-by: T02, T03 (beide in `feat/i122-i123` gemergt) · Test zuerst (Rot-Beleg)

Dateien: `src/ui/app.ts`, `src/style.css`, `tests/ui/contractWarnApp.test.ts` (neu). Einhängepunkte aus dem T00-Ledger (nach I-112 verschoben).

## Umsetzung

1. `app.ts`: `let warnedPeriod: number | null = null;` neben `prevOrderVisible`. In `launch()` (Laden, «Neue Insel»): `warnedPeriod = contractWarning(world) !== null ? warnPeriod(world) : null` (Priming, kein Klang).
2. In der Tick-Schleife **nach** `announceContract(...)` und nur wenn `ticks > 0` oder `world.tick !== prevEconTick`:

```ts
const warn = contractWarning(world);
const period = warnPeriod(world);
if (shouldWarnNow(warnedPeriod, warn, period)) {
  warnedPeriod = period;
  recordContractSound('contractWarn');
  sound.play('contractWarn');
  cancelFlash();
  cancelFlash = flashOrderCard(orderCardEl);
}
```

Fällt die Periode weiter (`warn === null`), bleibt `warnedPeriod` stehen; neue Periode hat anderen Index. `orderCardEl` aus `renderNoticeStack`/`noticeStack` (`rg -n "order-card" src/ui/hud.ts` für die Zuordnung); `cancelFlash` beim Dispose aufrufen. 3. `style.css` nach `.notice-stack .order-card.order-card--warn`: `.order-card--soon { animation: order-soon 2.5s ease-out 1; }` und `@keyframes order-soon` (Rand/Schatten kurz heller, Endzustand = normale Warnfarbe); unter `prefers-reduced-motion: reduce` keine Animation (nur Klasse bleibt, Orange bleibt). Kein Dauerblinken. 4. Dev-Sonde `contractSounds` bleibt, nimmt `'contractWarn'` über `recordContractSound` auf (keine Typänderung in `devProbes.ts`: `string[]`).

## Tests (`contractWarnApp.test.ts`, reine Schrittfunktion statt DOM)

Die Schleifenlogik als kleine reine Funktion `warnStep(prev, world): { fire: boolean; warnedPeriod: number | null }` in `order.ts`/`app`-nahem Helfer testen (T02-Datei gehört T02; falls nötig hier eigene Datei `src/ui/warnStep.ts` neu, Ownership T04). AK-W9: Fake-Klang, Welt mit Vertrag, Lager 0, durch `step` bis `settle - 300`: `contractSounds` enthält `'contractWarn'` genau einmal; weitere Ticks im Fenster: weiter einmal; Lager fällt im Fenster erneut: weiter einmal; nächste Periode: zweiter Eintrag; ×4 (4 Ticks je Frame über die Fenstergrenze): einmal; Laden im Fenster (Priming): kein Eintrag; Pause (kein Tick): kein neuer Eintrag.

## Prüfschritte

`npx vitest run tests/ui/contractWarnApp.test.ts tests/ui; echo EXIT=$?` (nur UI-Ordner) · `npx tsc --noEmit; echo EXIT=$?` · `make lint; echo EXIT=$?` · `make zeittests; echo EXIT=$?` · `make conflicts; echo EXIT=$?`. Commit `feat: Vorwarnung verdrahtet (I-122)`.
