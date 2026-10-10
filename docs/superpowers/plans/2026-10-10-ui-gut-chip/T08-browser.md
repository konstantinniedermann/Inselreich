# T08 · Browser-Lauf am Kandidaten

Strang – · `qa-playtester` (sonnet, Controller startet; Headless-Chrome, Screenshots unter `.studio/qa/ui-gut-chip/`) · AK-GC-13, 14, 15 · blocked-by T07 (OK des Final-Reviews) · 1 Lauf (≈ 30 Tools)

**Dateien:** keine Code-Änderung; Ablage `.studio/qa/ui-gut-chip/` (Screenshots, `report.md`). Fund = Fix-Runde im Umsetzer-Baum durch den Controller, danach Teil-Wiederholung.

## Schritt 0: Stand prüfen (Pflicht)

Der Lauf geschieht am Kandidaten, also **nach** dem M13-E1-Merge: `git log --oneline -3` und `git status` im Worktree `.worktrees/ui-gut-chip` (Branch `feat/ui-gut-chip`) festhalten; Spielstände aus `tests/sim/scenarios.ts` über `SCENARIO_OUT` bzw. den Weg, den `.studio/qa/m13-e1/` benutzt hat (dort nachlesen), nicht neu erfinden.

## Prüfungen (Viewport 1280×720, Desktop)

1. **AK-GC-13:** Szenario mit mehreren Holzfällern und einem Holz-Verbraucher (Werkzeugmacher/Glashütte), roter Holz-Pfeil. Holz-Chip klicken → Kamera springt zum ersten Holzfäller, Info-Panel offen, Konturen sichtbar (Erzeuger durchgezogen, Verbraucher gestrichelt, Farbe Cyan, Auswahl-Gelb liegt darüber), Meldung „Holz 1 von n: … (Erzeuger) · …“. `.` und `,` laufen die Liste durch. Zweiter Klick auf denselben Chip → Konturen weg, Kamera bleibt, keine Meldung. Erneut klicken, `Esc` → Konturen weg (ein Druck). Erneut, `9` (Seekarte/Inselwechsel, falls Seefahrt frei) bzw. `0` → Konturen weg. „Neue Insel“/Laden → kein Fokus.
2. **AK-GC-14:** Tab erreicht die Lager-Chips der Reihe nach, verborgene (noch nicht freie Güter) werden übersprungen; `Enter` schaltet, `aria-pressed` wechselt zwischen `true`/`false` (per `document.activeElement.getAttribute`); sichtbarer Fokusring. Nach **Mausklick** auf den Chip `Leertaste` halten und die Maus zum Schwenken nutzen: Der Chip schaltet nicht erneut (Fokus liegt nicht auf dem Chip, `document.activeElement` ist `body`).
3. **AK-GC-15:** Kolonie (Fremdinsel): Kamera dorthin, Chip eines Guts ohne Erzeuger auf der Kolonie klicken → Meldung „Noch kein Erzeuger für … — Bauen: …“ (bzw. „Erzeuger noch nicht frei“), Heimatinsel zeigt keine Konturen mehr; bei vorhandenen Erzeugern markiert der Fokus nur dort.
4. **Randfälle:** Tooltip des Chips zeigt die zweite Zeile („Klick: … zeigen“); Abriss eines markierten Holzfällers während des Fokus → Kontur verschwindet sofort, `.` springt weiter; mehr als 40 sichtbare Erzeuger (falls erreichbar) → nicht mehr als 40 Konturen, Erzeuger zuerst; Bildrate subjektiv unauffällig; Konsole ohne Fehler.

**Bericht** (`report.md`, ≤ 1 Seite): je AK bestanden/nicht, Screenshot-Pfade, Konsolenfehler, Befunde mit Schweregrad. Befunde ausserhalb des Scopes → `docs/beobachtungen.md` (durch den Controller).
