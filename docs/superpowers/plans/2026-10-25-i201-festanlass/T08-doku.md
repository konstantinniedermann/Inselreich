# T08 Doku README und arc42

Persona `tech-ui-engineer` (Fortsetzung per `SendMessage`, E-017: diese Dateien sind ausdrücklich erlaubt) · Strang A (zusammengeführter Stand, Worktree `.worktrees/i201`) · Tools ≈ 12 · blocked-by T07.

**Files:** Modify `README.md` (Abschnitt «Fest feiern», `rg -n "Fest feiern" README.md`), `docs/arc42.md` (Modultabelle, Zeile `feast.ts`; abschnittsweise lesen, Datei gross).

- [ ] **README:** Abschnitt ersetzen durch die drei Arten mit Preis und Wirkung: Aufstiegsfest (10 Rum, schnellerer Aufstieg im Wirkkreis, Steuer «normal»), Erntefest (10 Rum, 15 Stoff; Betriebe im Wirkkreis arbeiten mit 75 % Zyklus; Panel-Zeile «Erntefest: Zyklus 75 %»), Markttag (10 Rum, 5 Glas; Verkaufserlös der Insel 125 %, kein Stapeln mit Boom oder Vorliebe; Marke im Handelsfenster). Dauer 1 min, Abklingzeit 3 min je Kapelle; Ernte und Markttag zusätzlich je Insel und Art. Sperrgründe stehen am Knopf. Werte aus `src/sim/defs/feast.ts`, nicht frei formulieren.
- [ ] **arc42:** Zeile `feast.ts` auf «Aktion und Sperren, Fassade» kürzen; neue Zeilen `feastEffect.ts` (Blattmodul: `feastState`, `chapelWorks`, `inChapelRadius`, `feastActive`, `harvestActive`, `harvestCycle`, `marketActive`; importiert nur `council`, `defs`, `types`, `world`; gelesen von `levels.cycleOf` und `trade.sellPrice`) und `defs/feast.ts` (`FEAST_KINDS`). Persistenz: `feastKind` optional an der Kapelle, ohne Save-Version. `noKontorTrade` jetzt in `islands.ts` (P-11), falls arc42 es nennt (`rg -n "noKontorTrade" docs/arc42.md`).
- [ ] **Prüfung:** `make docs-check; echo EXIT=$?` → 0.
- [ ] **Commit:** `git add README.md docs/arc42.md` · `docs: Festarten in README und arc42 (I-201 T08)`.
