> **Task-ID:** D1 (Paket M11-D1) — ein Teil
> **AK-IDs:** AK-M11B-04 (Review: README und arc42 nach Spec 12 nachgeführt)
> **blocked-by:** T12, R2, B1 (alle Review OK; QA-UI und QA-ART durch) — `feat/m11-ui` hat `feat/m11-scen` @ B1 und `feat/m11-render` @ R2 gemergt (orga-09 W7)
> **Strang:** `feat/m11-ui` · `.worktrees/m11-ui` · Implementierer `tech-sim-engineer` (sonnet; kein Lead-Eigenbau, R190)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-07](orga-07-datei-ownership.md) · [orga-14](orga-14-qa-uebersicht.md)

## D1: Doku-Schlussarbeit M11

**Ziel:** README, arc42, ADR-005 und die Spec-Verweise beschreiben den Stand nach M11 (Spec 12) und stimmen mit dem
Code überein; die Befunde des Laufs stehen in `docs/beobachtungen.md`. D1 ändert keinen Code und keinen Test.
Den Übertrag der Rulings aus dem Ledger nach `docs/studio/rulings.md` macht der Lead, nicht D1.

**Code-Fakten / Fundstellen** (Zeilen Stand `801c279`; die Tasks T01–R2 haben einzelne Stellen schon nachgeführt):

- `README.md`: „Tastatur und Maus" `:109–132`, „Karte lesen" `:139–157`, „Freischaltung Schritt für Schritt"
  `:191–222` (Tabelle U0–U6), „Wirtschaft" `:224–237` (Info-Panel), „Produktionsketten" `:239–260` (Tabelle; Holzfäller
  „mind. 1 Waldkachel im Radius 2"), „Unterhalt und Geld" `:303–309` („Alle 10 Sekunden …"), „Aufstieg" `:346–361`.
- `docs/arc42.md`: §5 Sim-Tabelle (`population.ts` `:157`, `economy.ts` `:159`, `save.ts` `:167`); §6 Laufzeit-Tabelle
  `:326` („Buchung alle 100"); §8 Persistenz `:688–700` („Gespeichert wird immer Version 5", Kette bis v5); §12 Glossar
  `:879` („Bilanz … je Buchungstakt").
- `docs/adr/ADR-005-tick-reihenfolge-und-zustaende.md`: letzter Abschnitt „Nachtrag M10" (`:65`).
- `docs/superpowers/specs/2026-09-29-inselreich-design.md` §2.8 Wirtschaft `:142–150`.
- `docs/superpowers/specs/2026-10-03-m10-schritt-fuer-schritt-spec.md`: §6 `:333` („Holzfäller … arbeitet weiter"),
  11.1 `:494` (Zählung), AK-S1-01 `:847`, AK-F1-05 `:940`, Tabelle `:1243` („Roden um einen Holzfäller").
- Code-Quellen der Zahlen: `src/sim/defs/buildings.ts` (`hunter`, `cattlefarm`, `lumberjack.site`), `src/sim/defs/levels.ts`,
  `src/sim/defs/timing.ts` (`UPGRADE_DEFICIT_WAIT_FACTOR`), `src/sim/defs/tiers.ts` (`TAX_CARRY_DIVISOR`),
  `src/sim/defs/unlocks.ts`, `src/ui/hotkeys.ts`.

**Erwartete Dateien:** `README.md`, `docs/arc42.md`, `docs/adr/ADR-005-tick-reihenfolge-und-zustaende.md`,
`docs/superpowers/specs/2026-09-29-inselreich-design.md`, `docs/superpowers/specs/2026-10-03-m10-schritt-fuer-schritt-spec.md`,
`docs/beobachtungen.md`.
**Nicht anfassen:** `src/**`, `tests/**`, die M11-Spec und ihre Anhänge, `docs/studio/**`, `index.md` des Plans.

- [ ] **Schritt 0: Bestand.** `git log --oneline <BASIS>..HEAD -- README.md docs/arc42.md docs/adr/` — was T01–R2 schon
      nachgeführt haben, nicht doppeln; Lücken in der Reihenfolge unten schliessen.
- [ ] **Schritt 1: README.** „Unterhalt und Geld": Steuern und Unterhalt werden je Spielschritt mit Übertrag gebucht, die
      Kasse zählt stetig; Bilanz weiter „/ min"; der Münzton bleibt im 10-s-Takt. „Produktionsketten": Zeilen Jagdhütte
      (Nahrung, 5 s, 30 / min, mind. 10 freie Waldkacheln im Radius 3, sturmfest) und Rinderfarm (Nahrung, 2 s, 60 / min,
      mind. 16 freie Graskacheln im Radius 3); Holzfäller „mind. 1 freie Waldkachel im Radius 2"; Satz zu „frei" (ohne
      Gebäude und Weg, nicht unter dem eigenen Grundriss); Stillstand „Kein freier Wald in der Nähe" mit laufendem
      Unterhalt, Abhilfe Aufforsten. „Aufstieg": bei prospektivem Defizit doppelte Wartezeit (30 s → 60 s, «niedrig»
      15 s → 30 s), kein Verbot. Freischalt-Tabelle: U2 + Jagdhütte, U3 + Rinderfarm, Ausbau Stufe 2, U5 + Ausbau Stufe 3.
      Was T11/T12 eingetragen haben (Ausbau, Auslastung, Y) nur gegenlesen; **Ring, Marke, Aufsatz** (R1/R2) trägt D1 selbst ein (siehe Schritt 2 und „Karte lesen").
- [ ] **Schritt 2: arc42.** Aus T10/R1/R2 übernommen (Ownership D1): §5 Zeile `hud.ts` („Geld je Frame (`updateMoney`), Bilanz höchstens alle `BALANCE_REFRESH_MS` = 500 ms"), §6 HUD-Takt samt Sequenzdiagramm; §5 Render-Zeilen `ring.ts`, `statusMarks.ts`, `sprites.ts` (Jagdhütte, Rinderfarm, `drawLevelTopper`, Cache-Schlüssel mit `level`), §6 Ebene 12 „Statusmarken, Fortschrittsringe"; README „Karte lesen": Ring (grün mit dem Zyklus, grau bei Stillstand), Marke durchgestrichener Baum, Anbau/Sockel/Fahne je Stufe. Dazu §5 Zeilen `flow.ts` (`goodsBalance`, `upgradeDelta`, `deficitGood`, `upgradeDeficit`;
      importiert weder `population.ts` noch `queries.ts`), `levels.ts` (`cycleOf`, `upkeepOf`, `utilization`, einziger
      Leseort), `upgrade.ts` (`upgradeBuilding`, `paidCost`), `defs/levels.ts` (`LEVELS`); `population.ts`/`economy.ts`
      um Übertrag; `save.ts` Version 6, Kette bis v6 (`migrateV5ToV6`). §6 Tabelle `tickTaxes`, `tickEconomy`: „jeder
      Tick, Buchung mit Übertrag (`taxCarry`, `upkeepCarry`)"; `tickProduction` um `noForest` und `eff`; `tickPopulation`
      um Budget je Wachstumstakt. §8 Persistenz: Version 6, `migrateV5ToV6`, neue Prüfungen (Überträge, `eff`, `level`,
      `state`), Fixture `save-v5.json`. §12 Glossar „Bilanz": Rate je 100 Ticks, Buchung je Tick mit Übertrag; neu
      „Auslastung", „Stufe (Betrieb)".
- [ ] **Schritt 3: ADR-005**, Abschnitt „Nachtrag M11 (Datum): Buchung je Schritt, Dämpfung, `noForest`, `eff`" (nur
      falls noch nicht vorhanden): (1) `tickTaxes`/`tickEconomy` buchen je Schritt mit ganzzahligem Übertrag;
      Reihenfolge in `step` unverändert; `stats` bleiben Nominalwerte je 100 Ticks. (2) Budget `goodsBalance` einmal je
      Wachstumstakt vor der Häuserschleife; Δ-Abzug in Gebäudereihenfolge. (3) Prüfreihenfolge Ausfall → Anbindung →
      Dienst → Wald (`noForest`) → Sturm → Input. (4) `eff` wird in jedem Zweig nachgeführt; Geld und Waren hängen nicht daran.
- [ ] **Schritt 4: Spec-Verweise „Änderung M11"** (je ein Satz mit Link auf die M11-Spec, Abschnitt nennen): Hauptspec
      §2.8 (Buchung je Tick, Raten weiter „pro 100 Ticks"); M10-Spec §6 `:333` und Tabelle `:1243` (Holzfäller steht
      still: `noForest`), 11.1 und AK-S1-01 (neue Einträge `hunter`, `cattlefarm`, `upgrade2`, `upgrade3`), AK-F1-05
      (Holzfäller-Teil umgeschrieben „(M11 S3)").
- [ ] **Schritt 5: `docs/beobachtungen.md`.** Je Befund aus Ledger `.superpowers/sdd/m11/ledger.md` (Abschnitt Befunde)
      und den Schlussberichten der Tasks ein Eintrag unter „Offen": Datum · Fundort · Beobachtung · Ursprung (Task) ·
      erste Einschätzung. Keine Folgeissues.
- [ ] **Schritt 6: Prüfliste** (Belege mit Ausgabe in den Bericht):

```bash
grep -n "Buchung alle 100\|Alle 10 Sekunden wird\|immer Version 5" README.md docs/arc42.md   # leer
for m in flow.ts levels.ts upgrade.ts defs/levels.ts; do echo "$m $(grep -c "\`$m\`" docs/arc42.md)"; done   # je ≥ 1
for f in goodsBalance upgradeDelta deficitGood upgradeDeficit cycleOf upkeepOf utilization upgradeBuilding paidCost migrateV5ToV6; do
  grep -rq "function $f" src/sim || echo "Code fehlt: $f"; grep -q "$f" docs/arc42.md || echo "Doku fehlt: $f"; done   # leer
grep -n "SAVE_VERSION = 6" src/sim/save.ts; grep -c "Version 6" docs/arc42.md                 # Treffer; ≥ 1
grep -n -A10 "^  hunter: {\|^  cattlefarm: {" src/sim/defs/buildings.ts | grep -E "cycle|upkeep|min"   # Zahlen = README-Zeilen
grep -n "Jagdhütte\|Rinderfarm" README.md | head; grep -n "freie Waldkachel" README.md         # Treffer
grep -n "y: {" src/ui/hotkeys.ts; grep -n "| \`Y\`" README.md                                  # je 1
grep -n "Nachtrag M11" docs/adr/ADR-005-tick-reihenfolge-und-zustaende.md                    # 1
grep -c "Änderung M11" docs/superpowers/specs/2026-09-29-inselreich-design.md docs/superpowers/specs/2026-10-03-m10-schritt-fuer-schritt-spec.md   # ≥ 1 / ≥ 4
grep -n "UPGRADE_DEFICIT_WAIT_FACTOR = 2" src/sim/defs/timing.ts; grep -n "60 s\|doppelte Wartezeit" README.md  # Faktor = Text
make check
```

- [ ] **Schritt 7: Commit und Push.**

```bash
git add README.md docs/arc42.md docs/adr/ADR-005-tick-reihenfolge-und-zustaende.md docs/superpowers/specs/2026-09-29-inselreich-design.md docs/superpowers/specs/2026-10-03-m10-schritt-fuer-schritt-spec.md docs/beobachtungen.md
git commit -m "docs: M11-D1 README, arc42, ADR-005-Nachtrag, Spec-Verweise, Beobachtungen (Spec 12, AK-M11B-04)"
git -C .worktrees/m11-ui push -u origin feat/m11-ui
```

### Rot-Beleg

Kein Vitest. Vorher-Beleg ist die Prüfliste am Start (Schritt 0): `grep -n "Buchung alle 100" docs/arc42.md` trifft
`:326`, `grep -c "\`flow.ts\`" docs/arc42.md` ist 0, „Nachtrag M11" fehlt. Der Bericht zeigt Prüfliste vorher und nachher.

### Risiken/Randfälle

- Zahlen nie aus der Spec abschreiben, sondern aus `src/sim/defs/` (Abweichungen im Bericht melden, nicht in der Doku glätten).
- Mermaid-Labels ohne `\n`; „Tick" in der Spielanleitung nur in Erklärsätzen, nicht als Bedientext.
- Überschneidung mit T11/T12/R1/R2: nur gegenlesen und angleichen, nichts doppelt einfügen.
