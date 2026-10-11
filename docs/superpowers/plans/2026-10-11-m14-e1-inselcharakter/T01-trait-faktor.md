# T01 · Trait-Faktor, Felsbucht Gebirge+, A/B-Fixture (TDD)

Strang SIM · Worktree `.worktrees/m14-e1` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M14E1-01 (Teil), -02, -03
(Teil), -04 (Teil), -05 … -10, -12, -17, -26 (Teil) · Auflagen Tech-B1, Tech-B3 (Fixture), QA-B10 · blocked-by T00 ·
≈ 50 Tools · Spec R1, R2, R5.2, §4, Anhang 01 C, Anhang 03 A · Entscheidung E1

## Files

- Create: `tests/sim/islandTraits.test.ts`, `tests/sim/islands-seeds-a.test.ts` (Seeds 1…500),
  `tests/sim/islands-seeds-b.test.ts` (Seeds 501…1000, 963, Pins), `tests/sim/fixtures/m14e1-ab-hashes.json`
  (Schritt 1, **vor** jeder Änderung an `src/`). Die Seed-Dateien erweitert T05 im selben Seed-Durchlauf.
- Modify: `src/sim/defs/sea.ts` (`IslandTrait` + `mountainRich`, `fertile`; `TRAIT_CYCLE_PCT`; `TRAIT_BUILDINGS`;
  `TRAIT_LABELS` vier Texte; `ISLANDS[1]` `quarries 3`, Traits `spice, mountain, mountainRich`); `src/sim/levels.ts`
  (`cycleOf(world, b)`, `traitOf`, `islandCycle`, E1).
- Modify **mechanisch** (Ownership-Ausnahme Tech-B1, nur Signatur `cycleOf(world, b)` bzw. `islandCycle` für die
  Ausbau-Vorschau): `src/sim/production.ts`, `src/sim/flow.ts`, `src/ui/hover.ts`, `src/ui/panelView.ts`,
  `src/render/ring.ts`, `src/render/errands.ts`. Fehlt dort `world`, reicht der Aufrufer es durch; keine neue UI-Logik.
- Modify (Ownership-Ausnahme, weil die Def-Änderung den Text bricht): `src/ui/islandCard.ts` (`formatIslandCard` mit
  Trait-Abschnitten nach Anhang 03 A; Helfer `traitEffectTexts(def)` exportiert), `tests/ui/islandCard.test.ts`
  (Felsbucht- und Möweninsel-Text nach Anhang 03 A).
- **Nicht** in T01: `ISLANDS[2]` (Insel C) → T03.

## Schritte

- [ ] 0. `grep -n "cycleOf(" src -r`; `grep -n "formatIslandCard\|TRAIT_LABELS" src tests -r`.
- [ ] 1. **Fixture auf der Basis (Tech-B3, AK-12):** Die Seed-Dateien schreiben mit Umgebungsvariable
      `M14E1_WRITE_AB=1` die Datei `m14e1-ab-hashes.json`: je Seed in 1…1000 sowie 963 und den Pins 1, 3, 7, 13, 42 der
      FNV-1a-Hash von `JSON.stringify(createWorld(seed).islands[1])` und `[2]`. Lauf auf der unveränderten Basis, Datei
      committen (`test: A/B-Referenz vor M14-E1`). Ohne Variable vergleichen dieselben Tests gegen die Datei (`it.each`
      in Blöcken je 100 Seeds, **ein** `createWorld` je Seed, an dem T05 später AK-13/-14/-16 mitprüft).
- [ ] 2. Rote Tests in `islandTraits.test.ts` (Testwelt Spec §10: `createWorld(3, { unlockAll: true })`, Kontor II
      per `foundKontor2Literal` aus `seaHelpers.ts`, `money 100 000`, Lager Holz 50, Stein 50, Werkzeug 20):
  - AK-01 (ohne `ISLANDS.length` und `ISLANDS[2]`), AK-02 (Basiszyklus und beide `LEVELS`-Zyklen je Trait-Betrieb),
  - AK-03 Steinbruch und Glashütte Felsbucht 30/18/12 und 25/15/10, Heimat 60/36/24 und 50/30/20, Gewürzplantage
    Felsbucht 50, Holzfäller Felsbucht wie Heimat, Zuckerrohrplantage Felsbucht und Möweninsel 50,
  - AK-04 (Felsbucht 20, Heimat 10 im selben Lauf), AK-05, AK-06 (`upgradeBuilding` zweimal, Gebühr Stoff und Rum
    im Lager der Felsbucht), AK-07 (alle `BUILDING_DEFS` mit Zyklus, Insel 0, alle Stufen), AK-08, AK-09
    (`goodsBalance(world, 1).stone.produced === 20`, Muster `tests/sim/flow.test.ts`), AK-10.
  - AK-17 in `islands-seeds-a.test.ts` (Seeds 1…300, im selben Seed-Durchlauf): nach `foundKontor2Literal(w, 2)` ≥ 3
    Kacheln mit `canPlace(w, 'quarry', x, y, 2)` gültig.
  - **QA-B10:** (a) Abriss eines Steinbruchs auf der Felsbucht mit `progress 17` → Erstattung wie in der Heimat
    (Vergleich mit Heimat-Abriss), kein Stein; (b) Neubau an derselben Stelle → `progress 0`, `cycleOf` 30, nach 30
    angebundenen Ticks Stein +1; (c) Ausbau auf Stufe 2 auf der Felsbucht → Gebühr und Kosten gleich dem Ausbau in der
    Heimat (Differenz der Lager und `money`), `cycleOf` 18.
  - `islandCard.test.ts`: Felsbucht `Felsbucht · 36 × 36 · Gewürz, Gebirge · Gebirge+: Steinbruch, Glashütte ×2 ·
Fahrzeit m:ss`, Möweninsel unverändert (AK-26 Teil). Faktor aus `100 / TRAIT_CYCLE_PCT`.
- [ ] 3. `npx vitest run tests/sim/islandTraits.test.ts tests/ui/islandCard.test.ts; echo EXIT=$?` → rot.
- [ ] 4. Umsetzen nach E1; Defs nach Spec §4. `npx tsc --noEmit` zeigt alle Aufrufer; mechanisch nachziehen.
- [ ] 5. Grün: obige Dateien plus beide Seed-Dateien, `tests/sim/production*.test.ts`, `tests/sim/flow.test.ts`,
      `tests/ui/hover.test.ts`, `tests/ui/panelView*.test.ts`, `tests/render/ring*.test.ts`, `tests/render/errands*.test.ts`,
      `tests/sim/islands-gen.test.ts` (A2: `quarries 3` bitgleich), `tests/sim/balance.test.ts` (unverändert grün).
- [ ] 6. `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`. Commit `feat: Trait-Faktor und Gebirge+ (M14-E1 T01)`.

## Hinweise

- Testzeit: `islandTraits.test.ts` je Test < 200 ms. Seed-Dateien: Budget **3 s je Block** à 100 Seeds, ≤ 16 s je
  Datei (zwei Dateien, damit Vitest sie parallel fährt). Grundlage: `islands-gen.test.ts` AK-E1-01 auf der Basis
  ≈ 640 ms je 25 Seeds (≈ 26 ms je `createWorld` mit Prüfungen), siehe [testzeiten.md](testzeiten.md).
- `levels.ts` importiert nur Defs und Typen (kein Kreis über `world.ts`); die Inselart liest es aus
  `world.islands[island].kind`.
- Die Ausbau-Vorschau im Panel zeigt auf der Felsbucht künftig `perMinute(islandCycle(…, next.cycle))`; das ist
  mechanisch und fachlich nötig, sonst zeigt die Vorschau den halben Wert.
