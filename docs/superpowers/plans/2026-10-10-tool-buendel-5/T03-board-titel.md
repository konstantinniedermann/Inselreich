# T03 — `log.py package`: Titel nur bei neuem Paket oder `--retitle` (AK-TB5-05, AK-TB5-06)

**Dateien:** `tools/studio/log.py` (`build_parser` ≈ Z. 95, `make_event` Zweig `package` ≈ Z. 208), `tools/studio/tests/test_log.py`.

**AK-TB5-05:** Existiert die `package_id` schon im Ereignislager, schreibt `log.py package` das Ereignis **ohne** `title` (Status, Owner, `blocked_by` wirken weiter) und meldet auf stderr «Titel unverändert (--retitle zum Ändern)». Neues Paket: Titel wie bisher.
**AK-TB5-06:** `--retitle` schreibt den Titel auch bei bestehendem Paket. `--title` bleibt für neue Pakete Pflicht (Handbuch-Befehle unverändert); bleibt es bei bestehendem Paket weg, ist das kein Fehler.

## Schritte

- [ ] **Test zuerst** (mit `STUDIO_HOME=<tmp>`, nur Tests): `test_existing_package_keeps_title`, `test_retitle_overrides`, `test_new_package_requires_title`, `test_existing_package_without_title_ok`.
- [ ] **Umsetzung:** `--title` nicht mehr `required=True` im Parser, Pflicht per Prüfung in `main` (Fehlertext wie argparse) nur wenn das Paket neu ist; `--retitle` als `store_true`. Existenzprüfung `_package_exists(id)`: Ereignisdatei zeilenweise, Vorfilter `f'"{id}"' in line`, dann `json.loads` und Feldvergleich (`package_id` oder `package`); Fehler beim Lesen = «neu» (Werkzeug wirft nie). Archivierte Lager (`archive()`) nur wenn die Datei im Standardpfad liegt: Verhalten im Bericht nennen.
- [ ] **Kosten:** Laufzeit des Aufrufs auf Echtdaten-Kopie (67k Zeilen) im Bericht; Ziel < 0,3 s.
- [ ] **Prüfen:** `test_log`, `make studio-lint`.

**Commit:** `fix: log.py package überschreibt den Titel eines bestehenden Pakets nicht mehr`
