# T05 — Ampelzeile Produktivanteil (AK-TB6-11, AK-TB6-12)

**Dateien:** `tools/studio/efficiency.py` (`THRESHOLDS` Z. 38–49, `LIGHT_LABELS` Z. 52–62, `CLASSES`/`role_class` Z. 66–131, Kennzahlen ≈ Z. 505–560, Ampelzeilen ≈ Z. 740–800, `ampel` Z. 710), `tools/studio/effort.py` (`ampel_incidents` ≈ Z. 39–60, nur falls nötig), `tools/studio/tests/test_efficiency.py`, `tools/studio/tests/test_effort.py`. Grundlage: R488 V4, Retro REL-18 Abschnitt V4 (Session: Umsetzer 5,7 % roh, 33,7 % produktiv).

**AK-TB6-11:** Kennzahl `produktiv = class_share["Umsetzer"] + class_share["Design/Spec/Plan"]` (Klassen aus `role_class`, Kosten wie die übrigen Anteile; Leads zählen nicht, auch nicht mit Freigabephase `plan-`/`design-`). Schwelle `"produktiv": {"gelb": 0.25, "rot": 0.15, "op": "<"}`, Label `"Produktivanteil (Umsetzer + Design/Spec/Plan)"`. Die Zeile steht direkt unter „Umsetzeranteil“, Format wie die Nachbarzeilen (`gelb < 25 %, rot < 15 %`). Keine Instanzen → „nicht gemessen“ wie bei den anderen Anteilen.

**AK-TB6-12:** Der Umsetzeranteil bleibt als Zeile mit Rohwert und Rohfarbe stehen. Ist `produktiv` grün, trägt die Umsetzer-Zeile den Zusatz `— kein Befund: Produktivanteil grün (R488 V4)` und erzeugt keinen Ampel-Vorfall (`effort.ampel_incidents`) und zählt nicht als gelb/rot in Zusammenfassungen. Ist `produktiv` gelb/rot oder nicht gemessen, gilt die Umsetzer-Zeile wie heute.

## Schritte

- [ ] **Lesen:** wie `effort.ampel_incidents` die Farbe einer Ampelzeile ermittelt (aus dem Text der archivierten Session-Berichte `S-*.md` per Label, oder aus den Daten?). Den Mechanismus in einem Satz im Bericht nennen; danach entscheiden, wo AK-TB6-12 greift (bevorzugt: in der Zeile selbst, sodass archivierte Berichte ohne Sonderlogik richtig gelesen werden).
- [ ] **Test zuerst** (`test_efficiency.py`, Fixture mit Instanzen der Rollen `tech-sim-engineer`, `design-spec-author`, `tech-plan-architect`, `lead-tech`, `L0`):
  1. `produktiv` = Summe der beiden Klassenanteile (z. B. 5,7 % + 28,0 % = 33,7 %), Lead mit Phase `plan-…` zählt nicht.
  2. Grenzen 25 % und 15 % (`<`): 25,0 % grün, 24,9 % gelb, 14,9 % rot.
  3. Zeile erscheint unter „Umsetzeranteil“ mit Label und Schwellentext.
  4. Umsetzer 5,7 % (rot) bei `produktiv` 33,7 % → Zusatz „kein Befund“, kein Vorfall in `ampel_incidents` (`test_effort.py`); bei `produktiv` 20 % → Vorfall wie heute.
     4a. (B7, R503) Die Zusammenfassung der Ampel in `efficiency.py` (Zählung gelb/rot, `for color, name in …` ≈ Z. 714 bzw. deren Aufrufer) zählt die unterdrückte Umsetzer-Zeile nicht mit.
  5. Neuer Schlüssel bricht keine bestehenden Konsumenten von `LIGHT_LABELS` (`effort.py` Z. 410–444): bestehende Tests unverändert grün.
- [ ] **Rot-Beleg (R395):** `python3 -m unittest tools.studio.tests.test_efficiency tools.studio.tests.test_effort; echo EXIT=$?` → `EXIT=1`, im Bericht.
- [ ] **Umsetzung:** Kennzahl im Ergebnis-Dict (`"produktiv"`), Schwelle, Label, Zeile; Zusatz für die Umsetzer-Zeile; falls `ampel_incidents` die Farbe aus dem Zeilentext liest, die Unterdrückung dort über den Zusatz erkennen (eine Stelle, mit Test).
- [ ] **Echtlauf:** `python3 tools/studio/metrics.py --efficiency > <scratchpad>/eff.txt; echo EXIT=$?`, dann die Zeilen Umsetzeranteil und Produktivanteil aus der Datei zeigen; im Bericht.
- [ ] **Prüfen:** `test_efficiency`, `test_effort`, `test_metrics`, `test_ampel`; Ruff wie in T03.

**Commit:** `feat: Ampelzeile Produktivanteil, Umsetzeranteil nur mit Befund bei gelbem Produktivanteil (R488 V4)`

## Hinweise

- `efficiency.py` hat ≈ 1060 Zeilen: nur die genannten Abschnitte lesen.
- Keine Änderung an `role_class` (Klassengrenzen sind Messbasis früherer Sessions).
