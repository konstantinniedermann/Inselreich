# T04 · Leser: Takt-Hebel, Steuerpunkte, Determinismus, Wächter

Umsetzer `tech-sim-engineer` · ≈ 50 Tools · AK-ST-06 (Sim-Teil), AK-ST-07, AK-ST-10, AK-ST-12 · blocked-by: T03 · Worktree `.worktrees/stadtrecht` · Spec §3.2.4–5, §4.2, §5, §7 · Plan P-2, P-10, Review Focus 2

## Dateien

- ändern: `src/sim/council.ts` (`activeLever`, `charterTaxPoints`, Kopfkommentar), `src/sim/edicts.ts` (nur `effectiveTaxPct` und Kopfkommentar «Importiert nur …» um `./council` ergänzen)
- neu: `tests/sim/charter-levers.test.ts`
- nicht ändern: `src/sim/population.ts` (liest schon `effectiveTaxPct`, `:260`), `src/sim/levels.ts`, `src/sim/defs/*`, `tests/sim/balance*.test.ts`, Controller

## Interfaces

- Consumes: `CHARTER_SESSIONS`, `CharterSide`, `buyCharter` (T03), `charterFixture` (T03), `fnv1a32`, `sortedJson`, `village`, `placeTownhall` (`tests/sim/helpers.ts`), `step` (`src/sim/tick.ts`), `cycleOf`, `islandCycle` (`levels.ts`).
- Produces:
  - `type LeverWorld = Pick<World, 'council'> & { readonly charter?: readonly CharterSide[] }`; `activeLever(world: LeverWorld, kind, key?)` (P-2): Rats-Schleife unverändert (Seerecht-Form), danach `for (const [i, side] of (world.charter ?? []).entries())`: nur `'B'`, `CHARTER_SESSIONS[i]?.b.lever`, gleiche Art- und Schlüssel-Prüfung wie oben.
  - `export const charterTaxPoints = (world: Pick<World, 'charter'>): number` = Summe `CHARTER_SESSIONS[i].a.taxPoints` über alle `'A'`.
  - `effectiveTaxPct(w, tier) = taxPct(effectiveTaxLevel(w, tier), tier) − edictTaxPoints(w) + charterTaxPoints(w)`; Doc-Kommentar «… plus Stadtrecht-Punkte (Stadtrecht §3.2.4)».
- Kopfkommentar `council.ts`: «Einziger Leseort (R706 a) für die Hebel aus Rat und Stadtrecht: Dienst-Reichweite, Hausgrösse, Takt, Fahrzeit, Steuerpunkte.»

## Steps

- [ ] **Tests rot** in `tests/sim/charter-levers.test.ts`:
  - **AK-ST-12 Direkt:** `createWorld(3)`: `charterTaxPoints(w) === 0`; für jede B-`defId` aus den Defs `councilCycle(w, defId, BUILDING_DEFS[defId].cycle!) === BUILDING_DEFS[defId].cycle`; `effectiveTaxPct(w, t)` je Stufe gleich `taxPct(effectiveTaxLevel(w, t), t) − edictTaxPoints(w)`.
  - **AK-ST-06 Satz:** für k = 1 … 6 nur A gekauft (`charter = Array(k).fill('A')`): `effectiveTaxPct` jeder Stufe = Wert ohne Kauf + Summe `a.taxPoints` der ersten k Sitzungen. Mit Amtsstube (`placeTownhall`) und Edikt Sparen: `taxPct − EDICTS.saving.taxPoints + Summe` (7 aus den Defs lesen). Ohne Amtsstube mit `w.edict = 'saving'`: Edikt wirkt nicht (`edictTaxPoints` 0), Stadtrecht weiter.
  - **AK-ST-06 Ertrag im Tick:** Zwillinge aus `village(n)` mit gleicher Vorbereitung, einer mit `charter = ['A']`; beide bis einschliesslich zum ersten Steuer-Tick (Takt aus `defs/timing.ts`, nicht raten) per `step` laufen lassen; `stats.taxes` der Charter-Welt minus Zwilling = erwarteter Mehrbetrag aus `taxBaseByTier(w)` × Punkte nach der Formel in `population.ts` (Rundung und `taxCarry` dort nachlesen; falls der Übertrag die Gleichheit verwischt: über 3 Steuer-Takte summieren und `toBeCloseTo` auf ganze Einheiten). Mindestens: Differenz > 0 und gleich der Formel.
  - **AK-ST-07:** je Sitzung k mit `charter` = k−1 × `'A'` gefolgt von `'B'`: (a) bestehendes Gebäude der B-`defId` auf der Heimatinsel → `cycleOf(w, b)` = Zielwert (40/40/40/28/35/35, Literal aus Spec §3.1, Ausnahme laut §8); (b) dasselbe Gebäude **nach** dem Kauf auf einer zweiten Insel gebaut (Muster `tests/sim/islandTraits.test.ts:126-170`) → `cycleOf` = `islandCycle(w, insel, defId, Zielwert)` (Inselvorteil, z. B. Steinbruch auf der Felsbucht, wirkt auf den gehebelten Takt, Spec §9); (c) mit `'A'` an Stelle k bzw. ohne Kauf → Def-Takt. Erwartung zusätzlich gegen `Math.max(1, Math.floor((cycle * v) / def))` geprüft.
  - **Review Focus 2:** `council[4] = 'A'` (Glasrecht) und `charter = ['B']`: Glashütte und Steinbruch beide gehebelt.
  - **AK-ST-10 Determinismus:** Seeds 3, 7, 11: `charterFixture('alles')`-Vorbereitung auf `createWorld(seed)` übertragen (oder Fixture mit Seed-Parameter erweitern, nur in `charterFixtures.ts`, dann diese Datei in den Commit), feste Folge: 50 × `step`, `buyCharter('B')`, 100 × `step`, `buyCharter('A')`, 50 × `step`. Zwei Läufe je Seed → gleicher `fnv1a32(sortedJson(w))`; die drei Seeds liefern untereinander verschiedene Hashes (Probe, dass der Lauf etwas tut).
  - **Wächter (P-10, R870 R-1):** Datei-Scan wie `tests/sim/seerecht.test.ts` (Seerecht AK-SR-21): in `src/sim/**/*.ts` kommt `\.charter\b` nur in `council.ts`, `charter.ts`, `save.ts`, `world.ts`, `types.ts` vor; in `src/ui/**/*.ts` nur in `src/ui/charter.ts` bzw. gar nicht (T05 liest über Sim-Helfer). Der Test darf bis T05 grün sein; T05 hält ihn grün.
- [ ] **Lauf rot:** `npx vitest run tests/sim/charter-levers.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** laut Interfaces.
- [ ] **Teilbeleg:** `npx vitest run tests/sim/charter-levers.test.ts tests/sim/charter.test.ts tests/sim/council.test.ts tests/sim/seerecht.test.ts tests/sim/edicts.test.ts tests/sim/islandTraits.test.ts tests/sim/population.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?` → je 0. Balancing-Diff leer (Index, Prüfpflichten); `balance*` laufen im Release-`push-check` (AK-ST-12, R810). Laufzeit mit T00 vergleichen (Determinismus-Test < 2 s, sonst Tickzahl halbieren).
- [ ] **Commit:** `feat: Stadtrecht wirkt über Hebel-Leser und Steuersatz (AK-ST-06, 07, 10, 12)`.

## Task-Review

`activeLever` bleibt der einzige Leser (keine zweite Takt-Funktion); Seerecht-Signaturen (`seaTileTicks(world: Pick<World, 'council'>)`) unverändert; `edicts.ts` ohne weiteren Diff; Wächter-Muster eng genug (kein Treffer in Kommentaren nötig) und nicht über Dateinamen hinaus fest verdrahtet; keine Uhr im Test.
