# T07 · Doku README und arc42

Strang A (`.worktrees/i215`) · Persona `tech-ui-engineer` (Umsetzer B, Fortsetzung per `SendMessage`) · Modell sonnet · ≈ 12 Tools · blocked-by: T06 · AK: –

**Files (D1-Dateien ausdrücklich erlaubt, E-017):** Modify `README.md`, `docs/arc42.md`. Sonst nichts.

## Schritte

- [ ] `rg -n "Stilllegen|stilllegen" README.md`; `rg -n "Persistenz|SAVE_VERSION|tickProduction|feastAt|Bausteinsicht" docs/arc42.md` (Fundstellen ins Ledger).
- [ ] **README (Spielanleitung):** neben dem Absatz «Stilllegen» ein Absatz «Volllast»: Knopf am Betrieb, 3:00 schneller (Zyklus 75 %, Unterhalt 150 %), danach 2:00 Ruhe ohne Ausstoss (Unterhalt 50 %), nicht abbrechbar; gesperrt bei Stilllegen, Brand, ohne Strasse; verpufft bei fehlendem Eingang oder vollem Lager. Werte als Spielwerte der Defs benennen (Stand bei Merge).
- [ ] **arc42:** Bausteinsicht `src/sim/overtime.ts` (Blatt, Wirkorte `cycleOf` letzter Faktor, `buildingUpkeep(world, b)`, `advance`); Tick-Ablauf: Löschen abgelaufener `overtimeAt` in `tickProduction` vor `advance`, Zustand `'resting'`; Persistenz: Feld `overtimeAt`, Prüfung `isValidOvertime`, Versionsschritt ohne Datenänderung (Nummer per Merge-Reihenfolge, R909, keine Nummer in arc42 ausser im bestehenden Versionsverlauf, falls dort üblich).
- [ ] `make docs-check; echo EXIT=$?` → 0.
- [ ] Commit `docs: I-215 Volllast in README und arc42 (T07)`.
