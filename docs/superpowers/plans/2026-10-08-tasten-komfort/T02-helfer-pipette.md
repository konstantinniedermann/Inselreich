# T2 Helfer Pipette (B) — AK-TK-10..14, 19
Spec §5.1, §5.3. Test zuerst.
- `src/ui/pipette.ts`: `PIPETTE_KONTOR_TEXT`, `toolForBuilding` (null für kontor, kontor2), `pipetteResult(world, defId)` (Reason = Kontor-Text oder `lockedToolText`), `buildingDefAt(world, island, x, y)` über `tile.buildingId`. Test `tests/ui/pipette.test.ts`.
- `input.ts`: `isPipetteClick(button, {ctrl,meta}, spaceDown, touch)`. Test `tests/ui/input.test.ts`.
- `NAV_KEYS`: «Strg/Cmd + Klick auf Gebäude» = «Gebäudetyp als Bauwerkzeug (Pipette)». Test `tests/ui/hotkeys.test.ts`.
Fertig: `make check` grün; Commit.
