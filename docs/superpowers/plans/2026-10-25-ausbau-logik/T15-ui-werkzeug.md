# T15 AL-5 UI: Bauwerkzeug mit Stufe, Pipette, Vorschau

Persona `tech-ui-engineer` · Strang C2 · Tools ≈ 55 · AK-AL-28, AK-AL-30 (Vitest-Teil) · blocked-by T13, T14 (A2 @ T14 in C2 gemergt).

Spec: R8 (Werkzeug, Anzeige «Fischerhütte · Stufe 3», Pipette mit gesperrter Stufe), AK-AL-28/30.

**Files:** Modify `src/render/renderer.ts` (nur Typ `Tool`: `{ kind: 'build'; defId: BuildingDefId; level?: 2 | 3 | 4 }`), `src/ui/pipette.ts`, `src/ui/inspect.ts` (`buildSame` übergibt die Stufe; `rg -n "buildSame|addBuildSame" src/ui/inspect.ts`), `src/ui/app.ts` (Bauklick ruft `placeBuilding(…, tool.level)`; Vorschau-Grund; `rg -n "pipette\(|kind === 'build'|placeBuilding" src/ui/app.ts`), `src/ui/goal.ts` (`lockedToolText` prüft die Stufe), Werkzeugname-Anzeige (Fundort per `rg -n "toolName|toolLabel" src/ui`), `tests/ui/pipette.test.ts`; neue Vitest-Fälle für Vorschau-Grund in der Datei, die die Vorschau heute testet (`rg -l "preview|Vorschau" tests/ui`).

Vorschau: grün/rot und Grund kommen aus einem Probelauf `placeBuilding` auf einer Kopie bzw. aus `canPlace` + `levelChecksAt` (T14) — eine Quelle, kein zweiter Prüfweg. Bauleiste und Tasten setzen immer Stufe 1 (`level` fehlt). Kontore bleiben ausgeschlossen (`PIPETTE_KONTOR_TEXT`). `Tool.level` ist UI-Zustand, nie im Save.

## Schritte

- [ ] **Tests zuerst:**
  - **AK-AL-28** in `pipette.test.ts`: Quelle Fischer g 3 → `{ kind: 'build', defId: 'fisher', level: 3 }`, Werkzeugname «Fischerhütte · Stufe 3»; Quelle Stufe 1 → ohne `level`; Kontor → `PIPETTE_KONTOR_TEXT`; Quelle g 4 bei gesperrtem `upgrade4` → `{ ok: false, reason: <lockText U7> }`. Bauleiste/Taste `f` → ohne `level`.
  - **AK-AL-30 (Vitest):** Szene S4 (`tests/ui/ausbauScenes.ts`): Werkzeug aus «Gleiches bauen» an `ids.source`; Vorschau-Funktion an Zielküste A → ok; an Zielküste B → rot mit Fischgrund-Text; Klick-Pfad an B ändert die Welt nicht (`serialize` gleich).
- [ ] **Rot-Lauf:** `npx vitest run tests/ui/pipette.test.ts <Vorschau-Testdatei>; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen.**
- [ ] **Grün:** gleicher Lauf → 0; `npx vitest related --run src/ui/pipette.ts src/ui/app.ts src/ui/goal.ts src/render/renderer.ts; echo EXIT=$?` → 0.
- [ ] **Sichtprüfung Dev-Server:** S4 laden, «Gleiches bauen», Vorschau rot neben zwei Fischern, Screenshot `.studio/qa/ausbau-logik/t15-vorschau.png`.
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `feat: Gleiches bauen und Pipette übernehmen die Stufe (AUSBAU-LOGIK T15)`.
