# T1 Helfer Leertaste (A) und Umschalt+U (C) — AK-TK-01..09, 15..18

Test zuerst (rot), dann Code. Spec §4.2, §4.3 (nur reine Funktion), §6.

- `src/ui/spaceTap.ts`: `SPACE_TAP_MAX_MS = 300`, Automat laut Tabelle 4.2 (`keyDown(t, repeat)`, `pointerDown()`, `keyUp(t)`→`'toggle'|'none'`, `blur()`); keine Uhr. Test `tests/ui/spaceTap.test.ts`.
- `input.ts` exportiert `spaceKeyRole(target, modalOpen, mods)` → `'button'|'ignore'|'map'`. Test `tests/ui/input.test.ts`.
- `hotkeys.ts`: `hotkeyAction` mit optionalem `shift` (abwärtskompatibel), `U`+shift (ohne ctrl/meta/alt, nicht im Formularfeld) → `{ kind: 'upgrade' }`; sonst unverändert (C-2/C-3). `upgradeTarget(panel, world)` + `NO_SELECTION_TEXT`. `NAV_KEYS` «Leertaste (antippen)» = «Pause / weiter»; `hotkeyList` «Umschalt + U» = «Markiertes Gebäude ausbauen» erst wenn `functionLock(world,'upgrade2') === null`. Tests `tests/ui/hotkeys.test.ts`.
  Fertig: `make check` grün; Commit `feat:`/`test:`.
