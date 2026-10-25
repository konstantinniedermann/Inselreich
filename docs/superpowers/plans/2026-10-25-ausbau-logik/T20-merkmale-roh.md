# T20 AL-6a Stufenmerkmale der Rohstoffbetriebe

Persona `art-rendering-engineer` · Strang R · Tools ≈ 70 · AK-AL-31 (Vitest-Teil, sieben Typen) · blocked-by T01.

Spec: «Vorgabe an lead-art» (Punkte 1–6), Anhang 01 Spalte «Merkmal» für Fischerhütte, Jagdhütte, Holzfäller, Steinbruch, Schäferei, Zuckerrohrplantage, Rinderfarm; Plan P-11 (Anker-Parameter, Schnittstelle GEBAEUDE-VARIANZ).

**Worktree:** `.worktrees/ausbau-merkmale`, Branch `feat/ausbau-merkmale` von `feat/ausbau-logik` @ T01 (Hash vom Controller). `git worktree list` zuerst.

**Files:** Create `src/render/levelMarks.ts`, `tests/render/levelMarks.test.ts`. Modify `src/render/sprites.ts` **nur** den Rumpf von `drawLevelTopper` (96 KB, abschnittsweise: `rg -n "drawLevelTopper|function drawFlag" src/render/sprites.ts`). `src/render/spriteCache.ts` nur prüfen (Schlüssel enthält `level`; Stufe 4 = eigener Schlüssel).

**Interfaces (Produces):**

```ts
export interface Anchor {
  x: number;
  y: number;
} // Bildschirm-Offset relativ zum Gebäude-Ursprung, wie heute in drawLevelTopper
/** Zeichnet das Merkmal der Stufen 2…level übereinander (Präfix-Eigenschaft); level 1 zeichnet nichts. */
export function drawLevelMark(
  p: IsoPainter,
  defId: BuildingDefId,
  level: number,
  anchor: Anchor,
): void;
export function defaultAnchor(def: BuildingDef): Anchor; // heutiger Ankerpunkt; GV S5/S6 ersetzt ihn durch den Anker `stufe` der Gestalt
```

`drawLevelTopper(p, def, b)` bleibt mit gleicher Signatur und ruft `drawLevelMark(p, def.id, b.level ?? 1, defaultAnchor(def))`; Anbau, Steinsockel und Fahne entfallen. Liest `b.level` (gebaute Stufe g), nie k. Kein Schreiben in die Welt, keine neuen Assets (prozedural, Palette aus vorhandenen Farbkonstanten). Typen der Werkstätten zeichnen in T20 nichts (Dispatcher-Lücke, T21 füllt). Stufe 4 wird schon gezeichnet (Vitest setzt `b.level = 4` direkt; Laden folgt mit T12).

Gestaltungsregeln (Spec «Vorgabe», wörtlich umsetzen): je Stufe genau **ein** zusätzliches Element, das der Vorstufe bleibt; Stufe 3 zeigt Stein (Sockel, Kai, Schornstein); innerhalb der Gebäudehülle; auf Standardzoom unterscheidbar. Fischer: Stufe 2 grosses Netz am Trockengestell, 3 kleines Segelboot am Steinsteg, 4 grosses Segelboot am Kai + Räucherkate (Bootgrösse unterscheidet).

## Schritte

- [ ] **Tests zuerst** in `levelMarks.test.ts` mit `tests/render/fakeCtx.ts`, `it.each` über die sieben Typen und ihre Stufen (Jagdhütte bis 3):
  - **Präfix:** Befehlsliste von Stufe n beginnt mit der vollständigen Liste von Stufe n − 1 und ist länger.
  - Stufe 1 zeichnet nichts; kein Zeichenaufruf mit der Fahnenfarbe bzw. kein Aufruf von `drawFlag` aus `drawLevelTopper` (Fahne entfällt).
  - Anker wirkt: gleiche Stufe mit verschobenem Anker → alle Koordinaten um den Versatz verschoben (Schnittstelle GV).
  - Hülle: alle Koordinaten innerhalb der Hüllgrenzen des Typs (Muster der vorhandenen Hüllentests, `rg -l "Hülle|hull" tests/render`).
- [ ] **Rot-Lauf:** `npx vitest run tests/render/levelMarks.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen.** Bestehende Sprite-Tests, die den alten Aufsatz erwarten (`rg -n "drawLevelTopper|level: 3|Fahne" tests/render`), bewusst anpassen; Liste ins Ledger.
- [ ] **Grün:** gleicher Lauf → 0; `npx vitest related --run src/render/sprites.ts src/render/levelMarks.ts src/render/spriteCache.ts; echo EXIT=$?` → 0.
- [ ] **Sichtprüfung Dev-Server:** sieben Typen je Stufe 1–3 nebeneinander (Stufe 4 per Szene erst nach T12), Screenshot `.studio/qa/ausbau-logik/t20-roh.png`.
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `feat: Stufenmerkmale der Rohstoffbetriebe (AUSBAU-LOGIK T20)`.
