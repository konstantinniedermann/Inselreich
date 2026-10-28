# T21 AL-6b Stufenmerkmale der Werkstätten

Persona `art-rendering-engineer` (Fortsetzung Strang R per `SendMessage`) · Strang R · Tools ≈ 50 · AK-AL-31 (Vitest-Teil, vier Typen) · blocked-by T20.

Spec: «Vorgabe an lead-art», Anhang 01 Spalte «Merkmal» für Weberei, Werkzeugmacher, Brennerei, Glashütte; Stufe 4 zeigt Glasfenster (Glas verbaut).

**Files:** Create `src/render/levelMarksWork.ts`; Modify `src/render/levelMarks.ts` (nur Dispatcher-Eintrag der vier Typen), `tests/render/levelMarks.test.ts`.

**Interfaces:** `drawWorkshopMark(p, defId, level, anchor)` in `levelMarksWork.ts`, aufgerufen vom Dispatcher in `drawLevelMark`; gleiche Regeln wie T20 (Präfix, ein Element je Stufe, Stufe 3 Stein, Stufe 4 Glasfenster, Hülle, Anker-Parameter).

## Schritte

- [ ] **Tests zuerst:** `it.each` in `levelMarks.test.ts` um die vier Typen erweitern (Stufen 1–4): Präfix, Stufe 1 leer, Anker-Versatz, Hülle; Stufe 4 enthält mindestens einen Zeichenaufruf mit der Glasfarbe (Konstante aus der Palette, im Test benannt).
- [ ] **Rot-Lauf:** `npx vitest run tests/render/levelMarks.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen.**
- [ ] **Grün:** gleicher Lauf → 0; `npx vitest related --run src/render/levelMarks.ts src/render/levelMarksWork.ts src/render/sprites.ts; echo EXIT=$?` → 0.
- [ ] **Sichtprüfung Dev-Server:** vier Typen Stufe 1–3, Screenshot `.studio/qa/ausbau-logik/t21-werk.png`.
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `feat: Stufenmerkmale der Werkstätten (AUSBAU-LOGIK T21)`. Danach führt der Controller R per Merge in A2 zurück (nach T12), Teilbeleg.
