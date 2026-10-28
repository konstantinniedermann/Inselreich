# T19 Nachzug I-201: Erntefest auf den Zyklus der laufenden Stufe (bedingt)

Persona `tech-sim-engineer` · Strang A bzw. A2 (offene Etappe zum Zeitpunkt) · Tools ≈ 25 · AK-AL-02 (Teil I-201 AK-FE7), AK-AL-11 (Erntefest-Teil) · blocked-by **I-201 auf main** (R921: pausiert).

**Regel:** Wer zuletzt merged, trägt den Test. Merged I-201 **vor** dem Merge-Gate einer offenen AUSBAU-Etappe, läuft T19 in dieser Etappe (nach `git merge --no-edit main`). Merged I-201 erst danach, geht T19 als Plan-Hinweis an den I-201-Controller (Bericht an L0), damit I-201 den Test beim eigenen Merge trägt; dann entfällt T19 hier.

**Files:** Modify `tests/sim/levelRules.test.ts`; `src/sim/levels.ts` nur beim Konfliktlösen (Merge).

## Schritte

- [ ] `git merge --no-edit main`; Konflikt in `cycleOf` nach Symbol lösen: Reihenfolge **Stufenzyklus von k → `effectiveCycle` (Rat, Inselvorteil) → Erntefest auf das Ergebnis** (Spec R5, «Abgrenzung I-201»); I-210-Taktlohn, falls schon auf main, an der von I-210 festgelegten Stelle hinter `effectiveCycle`.
- [ ] **Tests zuerst** (rot vor dem Merge-Ergebnis nicht herstellbar → als Charakterisierung benennen, wenn sofort grün):
  - **AK-AL-11 (Erntefest):** Glashütte g 3, k 2 auf Glas-Vorteilsinsel im Radius einer Erntefest-Kapelle (Muster `tests/sim/feastKinds.test.ts`) → `cycleOf` = Erntefest-Regel 6 angewendet auf `effectiveCycle(…, 30)`; ab Etappe 2 zusätzlich g 4, k 2.
  - **AK-AL-02 (FE7):** `npx vitest run tests/sim/feastKinds.test.ts; echo EXIT=$?` → 0 (I-201 AK-FE7: Stufe-3-Zyklus c = 20 → 15 bleibt).
- [ ] **Grün:** `npx vitest run tests/sim/levelRules.test.ts tests/sim/feastKinds.test.ts; echo EXIT=$?` → 0; `npx vitest related --run src/sim/levels.ts; echo EXIT=$?` → 0; Balancing `npx vitest run tests/sim/balance.test.ts <Baseline-Liste>; echo EXIT=$?` → 0.
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `test: Erntefest wirkt auf den Zyklus der laufenden Stufe (AUSBAU-LOGIK T19)`.
