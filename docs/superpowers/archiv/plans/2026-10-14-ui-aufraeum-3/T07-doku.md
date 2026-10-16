# T07 · Doku und Ranglisten (D1 erlaubt, E-017)

Umsetzer `tech-ui-engineer` (Doku-Briefing) · Schätzung 35 Tools · AK-UA3-20 bis 22 · blocked-by: T06

## Dateien

- ändern: `README.md`, `docs/arc42.md`, `docs/ideen.md`, `docs/ideen-archiv.md`, `docs/beobachtungen.md`

## Prüfungen (statt Rot-Test: `make docs-check` und grep-Belege)

- **AK-UA3-20** README: Wegzug (ca. Z. 93–95) und Tabelle Z. 138/164 nennen die Staffelung «erster Rechtsklick beendet den Zug, zweiter legt das Werkzeug ab»; Z. 74 «siehe «Seefahrt und Gewürz»» verweist auf `docs/spielwerte.md` (Beleg: `grep -n "Seefahrt und Gewürz" README.md` ohne toten Verweis); Unterhalt-Karte mit Inselzeilen, «Krisen: aus» zeigt keine Karte.
- **AK-UA3-21** `docs/ideen.md`: I-089, I-098, I-099 Status live und nach Archivregel ins Archiv; Rangliste IDEEN-09 ohne Rang-Lücken (Ränge 2 und 7 waren I-088/I-090, bereits im Archiv: Rangspalte durchnummerieren oder Hinweiszeile); `docs/ideen-archiv.md`: Trenner (Überschrift/Zeile) zwischen «Ältere Ranglisten» und «Rangliste IDEEN-09, live gegangene Zeilen» prüfen und mit den drei Zeilen ergänzen.
- **AK-UA3-22** `docs/arc42.md`: Zählregel `producedRate` (Bausteinsicht Sim/UI) nachgeführt; `docs/beobachtungen.md`: die erledigten Einträge (Esc/Rechtsklick, REL-21-Kleinbefunde ohne `balanceAfterUpgrade`, Badge, README-Verweis, Heimat-Kontor, Fusszeile Pause) abhaken oder ins Archiv nach dem dortigen Muster. `make docs-check; echo EXIT=$?` = 0.

## Task-Review

Reviewer prüft Doku gegen die tatsächliche Umsetzung (Texte wortgleich zu den Meldungen) und dass `docs/studio/` unberührt ist.
