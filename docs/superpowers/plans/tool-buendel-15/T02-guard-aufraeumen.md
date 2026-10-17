# T02 `_shown_command` / `COMMAND_LIMIT` entfernen (R744)

Dateien: `tools/studio/guard.py` (Zeilen ~545 und ~676), `tools/studio/tests/test_guard.py` (Zeilen ~581, ~654).

- Beides aus guard.py löschen; Tests, die nur diese Funktion prüfen, löschen oder auf das tatsächliche Verhalten (`guard_block` speichert keinen Befehl, R743) umstellen. Kein Verhaltensverlust: `rg -n "_shown_command|COMMAND_LIMIT" tools` muss danach leer sein.
- Rot-Beleg: Vorher/nachher-Beleg ist hier das Entfernen; zeige, dass `make studio-test` danach grün ist und kein Test mehr fehlt, der echtes Verhalten schützt.
