# T01 — `src/ui/panelView.ts` (rein, TDD)

Spec §4, Anhang 01 (A.1, A.2, A.4, A.5). AK-PU-01..17 in `tests/ui/panelView.test.ts`, Test zuerst rot. Testwelten wie `tests/ui/inspect.test.ts`.
Exporte laut Spec §4 (Typen, `TONE_SYMBOL`, `UPGRADE_KEY_LABEL`, `stateTone`, `stateChip`, `supplyChip`, `levelPips`, `tierPips`, `statTiles`, `houseTiles`, `statKeys`, `upgradeGain`, `upgradeCard`, `riseCard`, `progressView`).
`stateTone`: erschöpfender `switch` mit `never`-Prüfung. Keine Zahl aus defs kopieren; Erwartungen in Tests über `perMinute`/`TIERS`. Bestehende Exporte in inspect.ts unverändert. Commit `test:`/`feat:`.
