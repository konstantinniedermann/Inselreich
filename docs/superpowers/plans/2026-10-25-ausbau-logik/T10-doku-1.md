# T10 Doku Etappe 1 (README, Spielwerte, arc42)

Persona `tech-ui-engineer` (Fortsetzung Strang C per `SendMessage`) · Strang C, arbeitet in A · Tools ≈ 20 · AK-AL-34 · blocked-by T09. Doku-Dateien ausdrücklich erlaubt (E-017). Kein eigener Task-Review; Prüfung im Final-Review Etappe 1 (Plan P-13).

**Files:** Modify `README.md`, `docs/spielwerte.md`, `docs/arc42.md`.

## Schritte

- [ ] **AK-AL-34 zuerst als Rot-Beleg:** `rg -n "gegen Stoff|kostet Rum" README.md docs/spielwerte.md src/sim/defs/unlocks.ts; echo EXIT=$?` → Treffer in den Doku-Dateien (Exit 0 = rot im Sinne des AK; `unlocks.ts` ist seit T01 sauber). Ohne Treffer zählt als Rot-Beleg `rg -n "Gebühr" docs/spielwerte.md` im Ausbau-Abschnitt (heute Z. ≈ 140–142).
- [ ] **`docs/spielwerte.md`, Abschnitt «Ausbau»** (heute Z. ≈ 136–142, `rg -n "Ausbau" docs/spielwerte.md`): vier Bedingungsarten (Wissen, Baustoff, Fachkräfte im Arbeitsweg 8, Standort je Typ), Tabelle der Standortregeln Stufe 2/3 (aus Spec R4, nur Werte, die in `src/sim/defs/levels.ts` stehen), «läuft wie Stufe k» mit Drossel-Unterhalt 50 %, fachliche Ware nur Fischer (Stoff), Abriss erstattet die Hälfte ohne Ware. Stufe 4 nennt der Abschnitt erst in T17 (AK-AL-34 ist nach T17 vollständig; hier gilt der `rg`-Teil).
- [ ] **`README.md`** Spielanleitung: Ausbau-Karte als Checkliste, Chip «Läuft wie Stufe k», Tooltip am gesperrten Knopf; Kosten ohne Gebühr.
- [ ] **`docs/arc42.md`**: Bausteinsicht `src/sim/levelRules.ts` (Blatt, laufende Stufe), `src/sim/levelChecks.ts` (Checkliste, eine Textquelle), `terrainCount.ts`, `fireCover.ts`; Laufzeitsicht: k beim Lesen in `cycleOf` und `buildingUpkeep(world, b)`, kein Save-Feld (P-3/P-4). Mermaid ohne `\n` in Labels.
- [ ] **Grün:** `rg -n "gegen Stoff|kostet Rum" README.md docs/spielwerte.md src/sim/defs/unlocks.ts; echo EXIT=$?` → Exit 1 (keine Treffer); `rg -n "Gebühr" docs/spielwerte.md` ohne Treffer im Ausbau-Abschnitt.
- [ ] `make docs-check; echo EXIT=$?` → 0.
- [ ] **Commit:** `docs: Ausbau-Logik Etappe 1 in README, Spielwerten und arc42 (AUSBAU-LOGIK T10)`.
