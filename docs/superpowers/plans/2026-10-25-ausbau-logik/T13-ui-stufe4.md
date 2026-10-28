# T13 AL-4 UI Teil 4: Checkliste und Panel für Stufe 4

Persona `tech-ui-engineer` · Strang C2 · Tools ≈ 35 · AK-AL-41 (Teil 4), AK-AL-43 (Teil 4) · blocked-by T11.

Spec: R9, Anhang 02 N5 (Fachkräfte S4), AK-AL-41/43; Gegenlese-Notiz 3.

**Worktree:** `.worktrees/ausbau-ui-2`, Branch `feat/ausbau-ui-2` von `feat/ausbau-logik-2` @ T11 (Hash vom Controller).

**Files:** Modify `src/ui/panelView.ts` (`upgradeGain(world, b, to: 2 | 3 | 4)`, Stufenpunkte «Stufe 1» bis «Stufe 4», `rg -n "2 \| 3|Stufe 3|level === 3" src/ui`), `src/ui/levelChecklist.ts` (nur falls Stufe 4 eigene Behandlung braucht), `tests/ui/levelChecklist.test.ts`, `tests/ui/panelView.test.ts`. `src/ui/inspect.ts` nur, wenn die Punkte-Anzeige dort fest auf 3 steht.

## Schritte

- [ ] **Tests zuerst:**
  - **AK-AL-41 Teil 4:** Fischer g 3 → Stufe 4: Kaufmannshaus im Abstand 6 ✓ «Verleger im Umkreis 8: Kaufmannshaus, nächstes 6 Felder»; Abstand 11 ✗ «Keine Verleger im Umkreis 8 (Kaufmannshaus nötig, nächstes 11 Felder)».
  - **AK-AL-43 Teil 4:** Fischer g 4 → `checklistView` `{ kind: 'max', text: 'Höchste Stufe erreicht' }`.
  - `upgradeGain(w, b, 4)` an Glashütte g 3: Ausstoss- und Unterhaltszeile nach Stufe-4-Werten; Panel-Punkte zeigen 4 von 4 bei g 4 (bzw. 3 von 3 bei der Jagdhütte).
  - Glas-Zeile der Weberei Stufe 4: ✓ «Glas 3 (Lager …)», ✗ «Zu wenig Glas (2 / 3)».
- [ ] **Rot-Lauf:** `npx vitest run tests/ui/levelChecklist.test.ts tests/ui/panelView.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen.**
- [ ] **Grün:** gleicher Lauf → 0; `npx vitest related --run src/ui/panelView.ts src/ui/levelChecklist.ts; echo EXIT=$?` → 0.
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `feat: Ausbau-Karte und Panel für Stufe 4 (AUSBAU-LOGIK T13)`.
