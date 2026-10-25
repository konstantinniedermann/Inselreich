# T08 · Doku: README, arc42, ADR-016, Spec-Verweis

Umsetzer aus T05 per `SendMessage` (kein neuer Start) · ≈ 20 Tools · blocked-by: T07 (OK) · Strang A · E-017: das Briefing erlaubt diese Dateien ausdrücklich

## Dateien

- `README.md`: Absatz «Ehrenbuch» (9 Stücke mit Namen und Bedingung, «kein Spielvorteil, nur auf diesem Gerät», Menü «Neue Insel» → «Ehrenbuch»); Zeilen nur anfügen.
- `docs/arc42.md`: Kontext-Tabelle `localStorage` um `inselreich.ehrenbuch` und `.defekt` (nicht Teil des Spielstands); Bausteinsicht: `src/sim/honors.ts`, `src/sim/defs/honors.ts`, `src/ui/honorTracker.ts`, `honorBook.ts`, `honorView.ts`, `honorCard.ts`; Laufzeitsicht Spielschleife: `observe` je `step`, Eintrag nach der Schleife; Abschnitt Persistenz: Buch v1, Schreibschutz bei neuerer Fassung, Zusammenführen.
- `docs/adr/ADR-016-ehrenbuch.md` (Nummer vorher mit `ls docs/adr` prüfen): Kontext, Entscheid «Buch ausserhalb des Welt-Saves, Partie-Merker im Buch», Alternativen (Weltfeld `setup` mit v19; Tempo-Stücke in jedem Modus), Folgen (RL-1, zwei Fenster, kein Export), Andockstellen A1–A3. Höchstens eine Seite. Verweis in `docs/index.md`, falls dort ADRs gelistet sind.
- Spec-Kopfzeile: «Plan: offen (`lead-tech`)» → Verweis auf `docs/superpowers/plans/2026-10-23-i186-ehrenbuch.md`.
- `docs/beobachtungen.md`: nur Befunde ausserhalb des Scopes aus T01–T07, falls gemeldet.

## Prüfungen

- `make docs-check; echo EXIT=$?` · `make conflicts; echo EXIT=$?`

Commit: `docs: Ehrenbuch in README, arc42 und ADR-016 (I-186)`
