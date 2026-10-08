# T3 Verdrahtung — AK-TK-20..27, 29..32 (Browser-Check danach)
Spec §4.3, §5.1 B-1..B-9, §6 C-4..C-7, §8.
- `input.ts`: Leertaste keydown/keyup/pointerdown(Capture, Fenster)/blur an `spaceTap` (A-5..A-10; laufende `isDragging()` = pointerDown), Toggle → `onAction({type:'hotkey', action:{kind:'pause'}})`. keyup immer `spaceDown=false`.
- Pipetten-Zweig in `onPointerDown` VOR dem Drag-Aufbau (nach Mittelmaus/Leertaste-Pan, die Vorrang haben): neue `InputAction {type:'pipette', island, x, y}` via `pickTarget` mit `{kind:'select'}`; erzeugt keinen Drag-Zustand (B-6). Nichts getroffen/kein Gebäude → still.
- `app.ts`: Pipette über `buildingDefAt`+`pipetteResult`; ok → `selectTool` (gleicher Typ aktiv → bleibt, B-7), Fehler → `showError`. `onHotkey` `upgrade`: `upgradeTarget` → gemeinsame Funktion `upgradeSelected(id)` (aus bisherigem `upgrade`-Callback, Z. ~551, gleicher Ton/Meldung); sonst `showError(NO_SELECTION_TEXT)`.
- Tests für Verdrahtbares soweit DOM-frei möglich; sonst Browser. Fertig: `make check` grün; Commit.
