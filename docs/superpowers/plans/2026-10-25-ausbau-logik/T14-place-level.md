# T14 AL-5 `placeBuilding` mit Zielstufe (Gleiches bauen, Sim)

Persona `tech-sim-engineer` · Strang A2 · Tools ≈ 50 · AK-AL-25, 26, 27 · blocked-by T12.

Spec: R8 (Prüfreihenfolge, atomar, kein Rückfall), E6, Randfälle «Gleiches bauen …», AK-AL-25–27.

**Files:** Modify `src/sim/build.ts` (`placeBuilding`), `src/sim/levelChecks.ts` (Prüfung am Zielort ohne stehendes Gebäude, siehe unten); Create `tests/sim/placeLevel.test.ts`; Modify `tests/ui/ausbauScenes.ts`, `tests/ui/ausbauScenes.test.ts` (S4 um `ids.max` ergänzen: Fischer mit `level` 4 allein an der Küste, Kaufmannshaus in seinem Arbeitsweg, aber mehr als 8 Felder von `ids.source` entfernt (T16 Schritt 2 braucht dort «keine Verleger»); Test: `levelChecks(…, 5)` ist `[]`, Rundlauf `serialize`/`deserialize` `ok`) und um die Galerie `G` für T22 erweitern (`SceneId` + `'G'`: elf Typen × Stufen 1 … 4, Jagdhütte bis 3, je an gültigem Standort; Test: jede Stufe vorhanden, `deserialize(serialize(…))` `ok`).

**Interfaces:**

```ts
export function placeBuilding(
  world: World,
  defId: BuildingDefId,
  x: number,
  y: number,
  island?: number,
  level?: 2 | 3 | 4,
): Result & { id?: number };
// level fehlt = heutiges Verhalten, bitgleich.
// Reihenfolge: canPlace → functionLock je Stufe 2…level → Dauerbedingungen der Stufe level am Zielort → Summe Geld/Holz/Wz/Stein (Neubau + Stufen 2…level) → Summe Waren → Erfolg (alles abbuchen, b.level = level)
export function levelChecksAt(
  world: World,
  defId: BuildingDefId,
  x: number,
  y: number,
  island: number,
  level: number,
): LevelCheck[]; // in levelChecks.ts: Fachkräfte- und Standortzeilen für ein gedachtes Gebäude; zählt sich nicht als anderer Fischer
```

Umsetzungshinweis: `levelRules.ts` bekommt dafür keine neue Datenquelle; `workforceAt`/`siteAt` werden auf eine Position (Def + x, y, Insel) verallgemeinert (`…At(world, probe, level)` mit `probe = { defId, x, y, island, id: -1 }`), die Gebäude-Variante ruft sie auf. Blatt-Regel und Importliste bleiben (Strukturtest T02). Kosten-Summe als Hilfsfunktion `levelCostSum(defId, level)` in `src/sim/upgrade.ts` neben `paidCost` (eine Quelle für Abriss-Erstattung und Gleiches bauen).

## Schritte

- [ ] **Tests zuerst** in `placeLevel.test.ts`:
  - **AK-AL-25:** `placeBuilding(w, 'fisher', x, y, HOME, 3)` an geeigneter Küste mit Bürgerhaus im Arbeitsweg bucht Neubau + Stufe 2 + Stufe 3 (Geld, Holz, Wz, Stein) und Stoff 4; `level` 3; Kasse, Lager und `paidCost` gleich wie in einer zweiten Welt nach Bau + zwei Ausbauten. Abriss erstattet die Hälfte von `paidCost`, keinen Stoff.
  - **AK-AL-26:** Ziel ohne Bürgerhaus im Arbeitsweg → `fail` mit Fachkräfte-Text, `JSON.stringify(w)` unverändert, kein Gebäude entsteht (auch nicht Stufe 1/2). Ziel neben zwei Fischern → Fischgrund-Text. Ungültige Bauregel → Text von `canPlace`.
  - **AK-AL-27:** Weberei Stufe 4: Geld und Baustoffe reichen, Glas 2 von 3 → «Zu wenig Glas (2 / 3)», nichts abgebucht.
  - Gesperrte Stufe (`upgrade4` ohne U7) → lockText U7. `level` fehlt → Ergebnis bitgleich zum heutigen Aufruf (zwei Welten, `serialize` gleich).
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/placeLevel.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen.**
- [ ] **Grün:** gleicher Lauf → 0; `npx vitest related --run src/sim/build.ts src/sim/levelRules.ts src/sim/levelChecks.ts src/sim/upgrade.ts; echo EXIT=$?` → 0; `npx vitest run tests/sim/imports.test.ts tests/sim/levelDefsMock.test.ts; echo EXIT=$?` → 0.
- [ ] **Balancing:** `npx vitest run tests/sim/balance.test.ts <Baseline-Liste>; echo EXIT=$?` → 0.
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `feat: Gleiches bauen mit Stufe in der Sim (AUSBAU-LOGIK T14)`.
