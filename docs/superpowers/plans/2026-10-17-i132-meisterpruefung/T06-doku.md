# T06 · Doku (D1, E-017)

`tech-ui-engineer` mit ausdrücklicher D1-Erlaubnis · ≈ 15 Tools · Spec §9 (T4 Doku) · blocked-by: T04 · parallel zu T05 · ohne Task-Review (Final-Review prüft)

Dateien: `docs/spielwerte.md`, `README.md`, `docs/arc42.md`, Kopf der Spec `docs/superpowers/specs/2026-10-16-i132-meisterpruefung.md` (nur Plan-Verweis).

## Schritte

- [ ] 1. `docs/spielwerte.md`: neuer Abschnitt «Meisterprüfung» mit Tabelle der fünf Werte aus `src/sim/defs/trials.ts` (Dauer 9000 Ticks = 15 min,
      Startfenster 60–150 Kaufleute, Abbruch unter 70 % der Starteinwohner) und den Rulings R745 (E1–E4); Zahlen aus der Defs-Datei abschreiben, nicht aus der Spec.
- [ ] 2. `README.md`, Spielanleitung: Kurzabsatz «Meisterprüfung» (nach dem Denkmal Klick auf den Ziel-Chip; Auflage «Eigenversorgung» sperrt den Zukauf
      an allen Kontoren und für das Denkmal; 15 min halten, Einwohner nicht unter 70 %; Abbruch jederzeit; Lohn ist der Chronik-Eintrag).
- [ ] 3. `docs/arc42.md`: Baustein `src/sim/trial.ts` und `src/sim/defs/trials.ts` (Bausteinsicht); Laufzeitsicht: `tickTrial` direkt nach `tickPopulation`
      in `step`; Persistenz: `SAVE_VERSION` 18 mit Feld `trial`, Migration v17 → v18 (Startwerte, R711 R-4); UI: `src/ui/trial.ts`, `src/ui/trialCard.ts`.
      Mermaid-Labels ohne `\n`.
- [ ] 4. Spec-Kopf: Zeile «Plan: `docs/superpowers/plans/2026-10-17-i132-meisterpruefung.md`».
- [ ] 5. `make docs-check; echo EXIT=$?` = 0, dann Commit `docs: Meisterprüfung in README, arc42 und Spielwerten (I-132)`.
