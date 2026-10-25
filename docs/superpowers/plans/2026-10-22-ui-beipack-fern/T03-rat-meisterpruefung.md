# T03 · Rats-Taste, Meisterprüfung-Texte, Ziel-Chip, Kopfkommentar (Befund 5, 6)

Umsetzer `tech-ui-engineer` (Fortsetzung T02) · ≈ 30 Tools · AK BF8 bis BF11 · blocked-by: T02 · Spec: Regeln 6, 7

## Dateien

- ändern: `src/ui/council.ts` (`councilToggleAllowed`), `src/ui/app.ts` (**eigener Commit**, eine Zeile im Zweig `council`, ≈ Z. 1118), `src/ui/trial.ts` (Z. ≈ 84 und 123), `src/ui/hud.ts` (nur `syncGoalChip`, ≈ Z. 316), `src/sim/trial.ts` (nur Kopfkommentar Z. 1), `tests/ui/council.test.ts`, `tests/ui/trial.test.ts`, `tests/ui/hud.test.ts` (tabIndex-Test)
- nicht ändern: `hotkeys.ts` (`hotkeyAction` bleibt rein), README, andere Stellen in `hud.ts` (UI-HAEPPCHEN-I)

## Verhalten

1. `councilToggleAllowed(world)` = `councilBadge(world) !== null`; `app.ts` kehrt im Zweig `council` sonst ohne Wirkung zurück (keine Meldung, `trialCard` unberührt).
2. Chronik «Meisterprüfung: <Name> bestanden (bei Spielzeit m:ss)», Karte «Bestanden (bei Spielzeit m:ss)», `formatClock` bleibt.
3. `syncGoalChip`: `goalEl.tabIndex = tc !== null ? 0 : -1`, nur bei Änderung.
4. Kopfkommentar `sim/trial.ts` laut Spec Regel 7c (enthält «Start» und «Tick»).

## Testfälle (rot zuerst)

- **BF8** Helfer false ohne Marke, true mit Marke; `hotkeyAction('R', {shift: true}, …)` liefert weiter `council`.
- **BF9** Chronik «Meisterprüfung: Eigenversorgung bestanden (bei Spielzeit 12:34)» und Karten-Status «Bestanden (bei Spielzeit 12:34)».
- **BF10** `tabIndex` -1, 0, -1; kein Schreibzugriff bei gleichem Wert.
- **BF11** `rg "Start.*Tick|Tick.*Start" src/sim/trial.ts` trifft Zeile 1; `git diff main -- src/sim` nur diese Zeile.

## Prüfschritte

Gezielte Tests laut index.md. Reviewer: `app.ts`-Diff eine Zeile, eigener Commit; `hud.ts`-Diff nur `syncGoalChip`.
