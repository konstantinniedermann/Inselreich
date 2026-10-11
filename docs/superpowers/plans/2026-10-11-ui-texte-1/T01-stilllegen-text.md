# T01 — Stilllegen-Text und Raten-Anzeige (AK-UT-01, -02, -03, -14)

Wortlaut nach R533. Dateien: `src/ui/texts.ts`, `src/ui/panelView.ts`, `tests/ui/texts.test.ts`, `tests/ui/panelView.test.ts`, `tests/ui/hover.test.ts`.

## Tests zuerst (Rot-Beleg)

- [ ] `texts.test.ts`: beide Pfade (`b.paused === true` und `state 'paused'`, `texts.ts:64`, `:79`) liefern exakt `Stillgelegt — Unterhalt auf ${PAUSED_UPKEEP_PCT} % (aufgerundet)` (Import aus `src/sim/defs/buildings`, AK-UT-02), `ok: false`. Die Zahl steht nicht als Literal im Test.
- [ ] Grep-Test: gelesener Quelltext aller `src/ui/*.ts` (`readdirSync`) enthält nicht «halber» (AK-UT-01; `tests/` und README ausgenommen).
- [ ] `hover.test.ts`: stillgelegter Betrieb → `troubleLine` ergibt genau «Stillgelegt» (AK-UT-03, bleibt grün, Regressionsschutz).
- [ ] `panelView.test.ts` (AK-UT-14): `statTiles` eines stillgelegten Erzeugers mit `produces` **und** `consumes`, z. B. Weberei (`buildings.ts:135`; `statTiles` ist in `panelView.test.ts` ab Zeile 169 schon im Test), damit auch die Kachel `input` geprüft ist: Kachel `output` und `input` ohne `/ min`, Wert «Stillgelegt»; Kachel `upkeep` zeigt `buildingUpkeep` (aufgerundet). Nicht stillgelegt: unverändert `x / min`.
- [ ] `npx vitest run tests/ui/texts.test.ts tests/ui/panelView.test.ts tests/ui/hover.test.ts; echo EXIT=$?` → `EXIT=1`, Beleg in den Bericht.

## Umsetzung

- [ ] `texts.ts`: einen Helfer `pausedText()` mit `${PAUSED_UPKEEP_PCT} % (aufgerundet)` (Import aus der Def), beide Stellen rufen ihn.
- [ ] `panelView.ts` `statTiles` (Zeile ~153): bei `b.paused === true` `value: 'Stillgelegt'`, `sub: null` für `output` und `input`; kein neues Layout.
- [ ] Grün, `EXIT=0`; `npx tsc --noEmit; echo EXIT=$?`.
- [ ] Commit `feat: Stilllegen-Text aus Def und keine Rate bei stillgelegt (AK-UT-01/02/14)`.
