# T01 — Stilllegen-Text und Raten-Anzeige (AK-UT-01, -02, -03, -14)

Voraussetzung: Entscheid zum Blocker im Index (Wert 50 gegen 60). Dateien: `src/ui/texts.ts`, `src/ui/panelView.ts`, `tests/ui/texts.test.ts`, `tests/ui/panelView.test.ts`, `tests/ui/hover.test.ts`.

## Tests zuerst (Rot-Beleg)

- [ ] `texts.test.ts`: beide Pfade (`b.paused === true` und `state 'paused'`, `texts.ts:64`, `:79`) liefern exakt `Stillgelegt — Unterhalt auf ${PAUSED_UPKEEP_PCT} %` (Import aus `src/sim/defs/buildings`, AK-UT-02), `ok: false`. Nach Entscheid A/B steht die Zahl nicht im Test als Literal.
- [ ] Grep-Test: gelesener Quelltext aller `src/ui/*.ts` (`readdirSync`) enthält nicht «halber» (AK-UT-01; `tests/` und README ausgenommen).
- [ ] `hover.test.ts`: stillgelegter Betrieb → `troubleLine` ergibt genau «Stillgelegt» (AK-UT-03, bleibt grün, Regressionsschutz).
- [ ] `panelView.test.ts` (AK-UT-14): `statTiles` eines stillgelegten Erzeugers (z. B. Farm mit `paused: true`): Kachel `output` und `input` ohne `/ min`, Wert «Stillgelegt»; Kachel `upkeep` zeigt `buildingUpkeep` (aufgerundet). Nicht stillgelegt: unverändert `x / min`.
- [ ] `npx vitest run tests/ui/texts.test.ts tests/ui/panelView.test.ts tests/ui/hover.test.ts; echo EXIT=$?` → `EXIT=1`, Beleg in den Bericht.

## Umsetzung

- [ ] `texts.ts`: einen Helfer `pausedText()` mit `${PAUSED_UPKEEP_PCT}` (Import aus der Def), beide Stellen rufen ihn.
- [ ] `panelView.ts` `statTiles` (Zeile ~153): bei `b.paused === true` `value: 'Stillgelegt'`, `sub: null` für `output` und `input`; kein neues Layout.
- [ ] Grün, `EXIT=0`; `npx tsc --noEmit; echo EXIT=$?`.
- [ ] Commit `feat: Stilllegen-Text aus Def und keine Rate bei stillgelegt (AK-UT-01/02/14)`.
