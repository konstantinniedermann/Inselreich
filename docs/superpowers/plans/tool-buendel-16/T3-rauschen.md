# T3 stdout-Rauschen test_aufraeumen

`tools/studio/tests/test_aufraeumen.py`: Aufrufe von `aufraeumen.main(...)` (Z. ~156, ~158, ~204, ~207) und `hook.start_context` geben «Aufräumen fällig», «Trockenlauf» auf stdout aus. Mit `contextlib.redirect_stdout(io.StringIO())` abfangen, wo möglich Ausgabe prüfen (mind. ein Test behauptet Inhalt).
Beleg: `python3 -m unittest discover -s tools/studio/tests -t tools/studio 2>&1 | rg "Aufräumen fällig|Trockenlauf"` vorher Treffer, nachher keine (Exit-Code von rg 1).
