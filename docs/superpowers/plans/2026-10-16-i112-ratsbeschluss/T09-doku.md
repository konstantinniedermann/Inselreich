# T09 · Doku (D1, E-017)

`tech-ui-engineer` mit ausdrücklicher D1-Erlaubnis · ≈ 15 Tools · Spec §10 · blocked-by: T08

Dateien: `README.md` (Spielanleitung: Abschnitt «Rat» mit Auslöser, sechs Beschlüssen, Bedienung, Taste `Umschalt + R`), `docs/arc42.md`
(Baustein `src/sim/council.ts` mit Lese-Helfern, Tick-Ablauf `tickCouncil` nach `tickPopulation`, Persistenz `council` und `SAVE_VERSION`),
`docs/spielwerte.md` (Tabelle der sechs Werte, Verweis auf `defs/council.ts` und R706/R-2), Plan-Index: Status «umgesetzt» mit Branch-Hash.

## Regeln

Keine Werte erfinden: Zahlen nur aus `src/sim/defs/council.ts`. Mermaid ohne `\n` in Labels. Kein `docs/studio/`, keine Spec-Änderung.

## Prüfschritte

`make docs-check; echo EXIT=$?` · Commit `docs: Rat in README, arc42 und Spielwerten (I-112)`.
