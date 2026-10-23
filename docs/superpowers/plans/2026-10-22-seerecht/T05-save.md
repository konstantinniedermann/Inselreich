# T05 · Save: `'C'` nur auf Stufe 4, `council` vor den Schiffen, Schiffsprüfung streng (F2)

Umsetzer `tech-sim-engineer` · ≈ 40 Tools · AK-SR-11, AK-SR-13, AK-SR-14 · blocked-by: T01 · Worktree `.worktrees/seerecht-save` (`feat/seerecht-save` ab `feat/seerecht` nach T01) · Spec §5, §8 «Manipulierter Stand», Gate Q6

## Dateien

- ändern: `src/sim/save.ts` (`isValidShip`, `isValidV9Fields`, `isValidCouncil`, Reihenfolge in `isWellFormed`, Import), `tests/sim/council-save.test.ts`
- nicht ändern: `SAVE_VERSION`, Migrationskette, `types.ts` `World.version`, `world.ts` (alles T09, Plan P-3) — **Ausnahme:** steht Stadtplanung (v19) beim Start von T05 schon auf main, führt T05 zusätzlich die Steps aus `T09-nachzug-stadtplanung.md` aus.

## Interfaces

- Consumes (T01): `isCouncilSide(tier, side)`, `seaTileTicks(world: Pick<World, 'council'>)`, `laneTicks(islands, a, b, perTile)`; `laneWorld(d)`, `shipLiteral` aus `tests/sim/seaHelpers.ts`.
- Produces: `isValidShip(s: unknown, islands: Record<string, unknown>[], tileTicks: number): boolean`, `isValidV9Fields(raw, tileTicks: number): boolean` (modul-intern).

## Verhalten

1. `isValidCouncil`: Schlüssel-Prüfung wie heute (Objekt, genau `'2,3,4'`); Wert `null`, `'open'` oder `isCouncilSide(Number(k) as CouncilTier, v)`.
2. `isWellFormed`: `if (!isValidCouncil(raw)) return false;` steht **unmittelbar vor** `isValidV9Fields`; danach `const tileTicks = seaTileTicks(raw as unknown as Pick<World, 'council'>)` und `isValidV9Fields(raw, tileTicks)`. Der spätere `isValidCouncil`-Aufruf entfällt.
3. `isValidShip`: `maxLeft = s.to === null ? 0 : laneTicks(islands as unknown as LaneIsland[], port, s.to as number, tileTicks)`; sonst unverändert. Damit ist Save die einzige direkte `laneTicks`-Leserin ausser dem Helfer (Wächter AK-SR-21 in T06).

## Steps

- [ ] **Tests rot** in `tests/sim/council-save.test.ts`, `describe('I-153 Seerecht Save')`, Welt `laneWorld(d)` mit einem Schiff:
  - `AK-SR-11` Runde: `council[4] = 'open'`, Schiff fährt mit `left = 10 * d`, `decree(w, 4, 'C')` (left jetzt `8 * d`), `deserialize(serialize(w))` ok, `sortedJson` gleich (inkl. `left`). Review Focus 5: zweites Schiff mit `left = 10 * d − 1` vor dem Beschluss → nach Umrechnung ≤ `8 * d`, lädt.
  - `AK-SR-13`: Stand mit `council[2] = 'C'` bzw. `council[3] = 'C'` → `{ ok: false, reason: 'Beschädigter Spielstand' }`, `expect(() => deserialize(…)).not.toThrow()`; `council[4] = 'C'` ohne Schiffe → ok.
  - `AK-SR-14` streng: mit `council[4] = 'C'` Schiff `left = 10 * d` → abgewiesen, `left = 8 * d` → ok, `left = 8 * d + 1` (zwischen 8d und 10d, alter Stand ohne Umrechnung) → abgewiesen; ohne `'C'` `left = 10 * d` → ok.
  - `AK-SR-14` Reihenfolge (eigener `it`): Stand mit fahrendem Schiff (`left = 10 * d`) und manipuliertem `council`: `null`, `[]`, `'C'`, `{ 2: null, 3: null }`, `{ 2: null, 3: null, 4: null, 5: null }`, `{ 2: 'C', 3: null, 4: 'C' }` → je «Beschädigter Spielstand», kein Wurf. Dieser `it` ist Verhaltensschutz, **kein** Reihenfolge-Beleg (kein Rot möglich, `isWellFormedSafe` fängt Würfe); die Reihenfolge belegt das Task-Review (R828 N1).
  - Bestand `AK-9 (R-4) Abweisen` («council[3] = "X"») bleibt unverändert grün.
- [ ] **Lauf rot:** `npx vitest run tests/sim/council-save.test.ts; echo EXIT=$?` → ≠ 0 (`'C'` heute ungültig, `10 * d` mit `'C'` heute gültig).
- [ ] **Umsetzen** nach Verhalten 1–3.
- [ ] **Lauf grün:** `npx vitest run tests/sim/council-save.test.ts tests/sim/save.test.ts tests/sim/trial-save.test.ts tests/sim/scenario-saves.test.ts; echo EXIT=$?` → 0; `tsc`, eslint/prettier → 0.
- [ ] **Commit:** `feat: Save prüft Seerecht und Schiffe mit wirksamer Fahrzeit (I-153 T05)`.

## Task-Review

**Review-Beleg (R828 N1, kein Test-Beleg):** Der Diff zeigt `isValidCouncil` unmittelbar vor `isValidV9Fields` in `isWellFormed`, `seaTileTicks(raw…)` erst danach, kein weiterer Zugriff auf `raw.council[4]` vor der Formprüfung; der Reviewer zitiert die Zeilen im Urteil, der Controller-Bericht weist AK-SR-14-Reihenfolge als Review-Beleg aus. Weiter: `isValidCouncil` steht vor `isValidV9Fields`, Zugriff auf `raw.council[4]` nur nach geprüfter Form; kein Literal 8/10; `SAVE_VERSION` unverändert (ausser Ausnahme oben); alte Stände ohne `'C'` laden (bestehende Save-Tests grün).
