# T4 Panel, Tooltips, README — AK-TK-28, 30, 33, 34

- `inspect.ts`: `InspectActions.buildSame(defId)`, Knopf «Gleiches bauen» (`data-field="build-same"`, title «Diesen Gebäudetyp als Bauwerkzeug wählen (Strg/Cmd+Klick auf ein Gebäude)») vor «Abreissen», nur wenn `toolForBuilding(defId) !== null`; `app.ts` verdrahtet auf denselben Weg wie die Pipette. Test in `tests/ui/inspect.test.ts`.
- Knopf «Ausbauen» title «Ausbauen (Umschalt+U)». `hud.ts`: Pause-Knopf title «Pause / weiter (P oder Leertaste antippen)» (hud-Test ergänzen).
- README gemäss Spec §12 (Z. 77, 124–144, 267 inkl. Hinweis unter der Tabelle, Cmd+Klick als Hauptweg auf macOS). arc42 prüfen (UI-Bausteinliste neue Dateien?).
  Fertig: `make check` grün; Commit `docs:`/`feat:`.
