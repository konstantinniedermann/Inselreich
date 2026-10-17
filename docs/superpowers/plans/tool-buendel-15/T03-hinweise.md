# T03 Hinweise aus der Testausgabe (R753)

Datei: `tools/studio/tests/test_pushcheck.py` (Tests `test_lastprotokoll_fehler_aendern_exit_nicht`, `test_ereignis_schlusszeile_und_schreibfehler`, Zeilen ~323 und ~347).
Ursache: die Tests lösen absichtlich `OSError("voll")` aus; die stderr-Zeilen `push-check: Lastprotokoll fehlgeschlagen (voll)` und `push-check: Ereignis nicht geschrieben (voll)` landen im Log von `make studio-test` und wirken wie echte Fehler.

- Beide Tests fangen stderr mit `contextlib.redirect_stderr(io.StringIO())` ab und prüfen den Hinweistext (assertIn) - die Produktionsmeldung bleibt unverändert.
- Danach `python3 -m unittest discover -s tools/studio/tests -t tools/studio 2>&1 | rg "nicht geschrieben|fehlgeschlagen"` muss leer sein; prüfe auch die anderen stderr-Meldungen der Studio-Suite (`testrun:`, `loadsnap:`, `zeitreserve-gate:`) und kapsle gleichartige absichtliche Fehlertests ebenso.
- Rot-Beleg: Test zuerst um `assertIn(..., err.getvalue())` erweitern ohne redirect = stderr nicht abgefangen -> sichtbarer Rauschbeleg vorher/nachher mit dem rg-Befehl.
