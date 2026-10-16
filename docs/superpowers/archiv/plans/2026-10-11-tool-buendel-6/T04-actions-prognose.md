# T04 — Actions: Konto-Prognose zum Monatsende (AK-TB6-09, AK-TB6-10)

**Dateien:** `tools/studio/actions.py` (`usage` Z. 40–68, `render` Z. 115–141, Konstanten Z. 17–23), `tools/studio/tests/test_actions.py`. Konsument: `metrics.py` Z. 503 (`actions.render(since=…)`), unverändert. Grundlage: R488 V2, Retro REL-18 Abschnitt V2 (Konto 1251/2000, Prognose ≈ 1990).

**AK-TB6-09 (Prognose):** Neue Zeile `- <FARBE>: Konto-Prognose Monatsende: <p> von 2000 (verbraucht <a> + <r>/Tag × <t> Resttage; gelb > 1600, rot > 1900; bei Rot höchstens ein Push je Tag, R488 V2)`.

- `a` = Konto-Minuten des laufenden Monats (wie heute).
- `r` = Konto-Minuten der letzten **3 vollen Tage** vor heute ÷ 3 (Tage innerhalb des Monats; am 2. oder 3. des Monats entsprechend 1 bzw. 2 Tage).
- `t` = Tage des Monats ab heute einschliesslich (`calendar.monthrange`), heute zählt voll.
- `p = a + r × t`, auf ganze Minuten gerundet. Farbe nach `PROGNOSIS_LIMITS = (1600, 1900)` mit `_light`.
- Am 1. des Monats (kein voller Tag) und bei fehlenden Tagesdaten: `- nicht erfasst: Konto-Prognose Monatsende`, nie 0.

**AK-TB6-10 (übrige Zeilen):** Die Inselreich-Zeile wird Info ohne Farbe: `- Info: Inselreich-Minuten: <n>` (Schwellen entfallen, `REPO_LIMITS` löschen). Konto-Minuten und Session-Minuten bleiben unverändert. Fehlt `gh` oder schlägt ein Aufruf fehl, stehen alle Zeilen auf „nicht erfasst“ wie heute; ein Fehler nur bei den Tagesdaten betrifft nur die Prognosezeile.

## Datenquelle (Echtlauf zuerst)

- [ ] **Echtlauf (Werkzeug-Paket-Pflicht), vor dem Test:** `gh api "/users/$(gh api user --jq .login)/settings/billing/usage?year=2026&month=10" --jq '.usageItems[0]'; echo EXIT=$?` — Ausgabe (ohne Beträge in Franken/Dollar, nur Feldnamen und ein Beispiel-Eintrag) im Bericht. Prüfen, ob Einträge ein Feld `date` tragen.
  - **Mit `date`:** Tagesminuten aus derselben Antwort gruppieren (kein zusätzlicher Aufruf). `usage` liefert dafür intern die Einträge; die öffentliche Signatur `usage(now, runner) -> tuple | None` bleibt für bestehende Tests.
  - **Ohne `date`:** je Tag ein Aufruf mit `&day=<d>` (höchstens 3 zusätzliche `gh`-Aufrufe). Ergebnis im Bericht; Variante im Code-Kommentar begründen.
- Netz nur über `run_gh` (bleibt die einzige Stelle mit Netz, in Tests ersetzbar).

## Schritte

- [ ] **Test zuerst** (`test_actions.py`, Fake-Runner wie `fake()`, Einträge mit `date` bzw. Tagesabfragen je nach Echtlauf):
  1. 10. Oktober, verbraucht 1251, Tage 7.–9. je 50 → `t` = 22, `p` = 1251 + 50 × 22 = 2351 → `ROT`, Zeile enthält „höchstens ein Push je Tag“.
  2. Grenzen: `p` = 1600 → `GRÜN`, 1601 → `GELB`, 1900 → `GELB`, 1901 → `ROT`.
  3. 1. des Monats → „nicht erfasst: Konto-Prognose“; 2. des Monats → Rate aus genau einem Tag.
  4. Fremde Produkte/Einheiten (`copilot`, nicht `Minutes`) zählen nicht in die Tagesrate.
  5. Inselreich-Zeile ohne Farbe (`Info:`); bestehende Tests, die `GELB`/`ROT` für die Repo-Zeile erwarten, werden bewusst angepasst (im Bericht nennen).
  6. Tagesdaten-Fehler (Fake wirft nur bei Tagesabfrage bzw. `date` fehlt) → nur Prognose „nicht erfasst“, Konto-Zeile normal.
- [ ] **Rot-Beleg (R395):** `python3 -m unittest tools.studio.tests.test_actions; echo EXIT=$?` → `EXIT=1`, im Bericht.
- [ ] **Umsetzung** in `actions.py`: reine Funktion `forecast(spent, daily, now) -> int | None` (testbar ohne Netz), Tagesdaten-Beschaffung getrennt, `render` ergänzt die Zeile nach „Konto-Minuten“. Uhr nur über `clock.now()` (R450 V2).
- [ ] **Echtlauf nach der Umsetzung:** `python3 tools/studio/metrics.py --efficiency 2>&1 | sed -n '/Actions-Minuten/,/^$/p'` — Achtung Pipe: Exit-Code getrennt mit `python3 tools/studio/metrics.py --efficiency > /tmp/…; echo EXIT=$?` im Scratchpad, dann Abschnitt zeigen. Ausgabe im Bericht.
- [ ] **Prüfen:** `test_actions`, `test_metrics`, Ruff wie in T03.

**Commit:** `feat: Actions-Ampel zeigt Konto-Prognose zum Monatsende (R488 V2)`

## Hinweise

- Die Regel „bei Rot höchstens ein Push je Tag“ erzwingt das Werkzeug **nicht** (kein Netzaufruf in `push-check`); sie steht im Handbuch (studio-coach) und in der Zeile. Entscheid D3 im Controller-Bericht.
- Keine Beträge oder Kontodaten in Doku oder Commits; im Bericht nur Minuten.
- **B8 (R503):** Heute steckt teilweise in `a` und zählt zusätzlich voll in `t` (bewusste Doppelzählung, vorsichtige Prognose); dazu ein Kommentar an `forecast`. Rate bei 0 vollen Tagen = „nicht erfasst“, nie 0 (Test 3).
