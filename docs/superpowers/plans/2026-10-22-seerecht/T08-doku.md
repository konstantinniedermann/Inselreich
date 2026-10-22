# T08 · Doku (D1, E-017)

Umsetzer `tech-sim-engineer` (Fortsetzung der T06-Instanz per `SendMessage`) · ≈ 15 Tools · AK-SR-25 · blocked-by: T07 · Worktree `.worktrees/seerecht` · Das Briefing erlaubt die D1-Dateien ausdrücklich (E-017).

## Dateien

- `README.md` Abschnitt «Rat» (Z. ≈ 210 «Die sechs Beschlüsse», Z. ≈ 267 Verweis): «sieben Beschlüsse»; Stufe 4 drei Karten Glasrecht, Hofrecht oder **Seerecht** mit Kartentext «Schiffe fahren 25 % schneller. Spart ab etwa 80 Kaufleuten ein Schiff auf langen Gewürzrouten.»; Satz zur Notiz «… die übrigen Beschlüsse der Stufe verfallen.»
- `docs/spielwerte.md` «Rat (Ratsbeschluss)» (Z. ≈ 399–415): Zeile `| 4 | C | Seerecht | Schiffe fahren 25 % schneller … | 10 → 8 |` mit Hebel `seaTileTicks` (Def `SHIP_TICKS_PER_SEA_TILE`, `src/sim/defs/sea.ts`; Hebelwert in `src/sim/defs/council.ts`) und Vermerk «Prüfwert Erweiterung 1 (R805)»; Rückfall-Satz aus Spec §6.4 (Wert 7 prüfen, 9 verworfen).
- `docs/arc42.md`: Baustein `council.ts` (Z. ≈ 186): Fahrzeit-Helfer `seaTileTicks`, `travelTicksOf`, `laneTicksOf`, Umrechnung in `decree`; «Blatt: importiert nur `types`, `defs/*`» → «importiert `types`, `defs/*`, `islands`»; `islands.ts`: `travelTicks`/`laneTicks` mit `perTile`, direkte Leser nur Helfer und Save; `save.ts` (Z. ≈ 189): Prüfreihenfolge `council` vor Schiffen, Schiffsgrenze aus `seaTileTicks` (Version erst in T09).
- `docs/beobachtungen.md`: nur falls T01–T07 Befunde ausserhalb des Scopes meldeten (Controller liefert Liste).

## Steps

- [ ] Texte nach obiger Liste; Zahlen nur aus den Defs abschreiben.
- [ ] `make docs-check; echo EXIT=$?` → 0; `npx prettier --check README.md docs/spielwerte.md docs/arc42.md; echo EXIT=$?` → 0.
- [ ] **Commit:** `docs: Seerecht in README, Spielwerten und arc42 (I-153 T08)`.

## Review

Im Final-Review (`lead-qa`); AK-SR-25 wörtlich prüfen.
