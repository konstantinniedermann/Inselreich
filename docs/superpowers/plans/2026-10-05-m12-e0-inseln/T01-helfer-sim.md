> **Task-ID:** T01 · **AK-IDs:** keine neuen; AK-E0-16 bis -19 bleiben grün (bitgleich)
> **blocked-by:** T00 · **Strang:** `feat/m12-e0`, Worktree `.worktrees/m12-e0` · `tech-sim-engineer` (sonnet)
> **Regeln:** [index.md](index.md) Global Constraints, Entscheide P-1, P-2 · Spec §4.2 R-E0-3, §4.8

## T01: Zugriffshelfer und mechanische Umstellung in `src/sim` und `tests/sim` (Form bleibt v6)

**Ziel:** Jeder Zugriff auf Raster, Lager und Kontor läuft über eine `Island`, die ein Helfer liefert. Die Form des
Weltzustands bleibt v6: `home(w)` und `islandOf(w, b)` geben in diesem Task die Welt selbst zurück. Nach T01 ist der
Formwechsel in T03 eine Änderung an wenigen Stellen. **Kein Verhalten ändert sich, kein Pin, kein Save.**

**Code-Fakten (Basis):** `world.ts` `idx/inBounds/tileAt/adjacentOf/tilesInRadius(world, …)`; `economy.ts`
`addStock/takeStock(world, good, n)`, `checkAfford/pay/grantRefund(world, cost)`; direkte Zugriffe in `src/sim`
≈ 36 (`roads.ts` 9, `queries.ts` 9, `economy.ts` 9, `placement.ts` 5, `build.ts` 4, `forest.ts` 3, je 1–2 in
`production`, `orders`, `population`, `trade`, `upgrade`), dazu ≈ 56 Helferaufrufe; in `tests/sim` ≈ 754 Treffer
(meist `w.stock.x`, `w.tiles[idx(w, …)]`, `w.kontorId`).

**Dateien:** `src/sim/types.ts` (nur `Island`-Alias), `world.ts`, `economy.ts`, `build.ts`, `placement.ts`,
`roads.ts`, `forest.ts`, `production.ts`, `population.ts`, `queries.ts`, `trade.ts`, `orders.ts`, `upgrade.ts`,
`supply.ts`, `flow.ts`, `crises.ts` (nur falls Raster-Helfer), `connect.ts` (aus H-U1); `tests/sim/**` ausser `balance.test.ts`; neu
`tests/sim/islands.test.ts`. **Nicht:** `src/render`, `src/ui` (T02), `save.ts` (T03), `src/sim/defs/**`.

## API (verbindlich, Entscheid P-2)

```ts
// types.ts (T01; T03 ersetzt den Alias durch ein eigenes Interface)
export type Island = Pick<World, 'width' | 'height' | 'tiles' | 'kontorId' | 'stock'>;
// world.ts
export const HOME = 0; // Inselindex der Heimat (Struktur, kein Spielwert)
export const home = (w: World): Island => w; // T03: w.islands[HOME]!
export const islandOf = (w: World, _b: Building): Island => w; // T03: w.islands[b.island]!
export const idx = (isl: Island, x: number, y: number): number => y * isl.width + x;
// inBounds, tileAt, adjacentOf, tilesInRadius: erster Parameter `isl: Island` statt `world: World`
// economy.ts
export function addStock(isl: Island, good: GoodId, n: number): number;
export function takeStock(isl: Island, good: GoodId, n: number): boolean;
export function checkAfford(world: World, isl: Island, cost: Cost): Result; // Geld global, Waren der Insel
export function pay(world: World, isl: Island, cost: Cost): void;
export function grantRefund(world: World, isl: Island, cost: Cost): void;
```

Zuordnung (R-E0-3, mit einer Insel überall gleichwertig): Betrieb, Haus, Abriss, Ausbau → `islandOf(world, b)`;
Bauplatz, Weg, Platzierung, Handel, Auftrag, `goodsBalance`, `flammableRect`, `coverageMask`, `layoutKey`,
`kontorRoadRoots` → `home(world)` (T04 ersetzt Bauplatz/Handel durch den Insel-Parameter). Keine Getter oder Aliase
auf `World` (F-S2).

## Schritte

- [ ] **0 Basis (R229 prod-B1):** Der Controller hat nach T00 `feat/h-u1-anbinden` @ a852d4a per `git merge` geholt
      (Merge-Commit im Ledger); damit liegt `src/sim/connect.ts` (≈ 16 Zugriffe) im Baum und wird in Schritt 3 mit
      umgestellt, ebenso `tests/sim/connect.test.ts`. T01 wartet nicht auf REL-03. `make check` vor Beginn grün.
- [ ] **1 Test zuerst** `tests/sim/islands.test.ts`, `describe('M12 E0 Helfer')`:
      `PLAN-H1 home/islandOf liefern Raster, Lager und Kontor der Heimat` — `createWorld(3)`: `home(w).tiles.length`
      4096, `home(w).kontorId` 1, `home(w).stock` gleich `START_STOCK`, `islandOf(w, w.buildings[1]!)` ===
      `home(w)`; `tileAt(home(w), kx, ky)!.buildingId === 1` für die Kontorkachel.
      Rot-Beleg (Import fehlt) → Commit `test: M12 E0 Helfer (rot)`.
- [ ] **2 Helfer** nach API oben in `types.ts`, `world.ts`, `economy.ts`; `createWorld` bleibt unverändert.
- [ ] **3 `src/sim` umstellen**, Datei für Datei, bis `npx tsc --noEmit` für `src/sim` fehlerfrei ist. Keine Logik
      ändern, keine Zeile umsortieren; Reihenfolge der Abfragen und `Math.hypot`-Argumente bleibt.
- [ ] **4 `tests/sim` umstellen** mit einem Einmal-Skript im Scratchpad (nicht einchecken), z. B. Regex
      `\b(w|world|w2|loaded)\.(stock|tiles|kontorId)\b` → `home($1).$2`, `idx\((w|world)\b` → `idx(home($1)`,
      Import `home` ergänzen; Rest von Hand, Typprüfer als Leitfaden. **`controller.ts` und
      `merchantsController.ts` nur Zugriffstausch und Import** (Global Constraints).
- [ ] **5 Prüfen:** `make check` und `CI=true make check` grün; `git diff --stat T00-SHA -- tests/sim/balance.test.ts
src/sim/defs` leer; Abgleich: `grep -rnE "\b(world|w)\.(stock|tiles|kontorId)\b" src/sim` liefert nur
      `world.ts` (Helfer) und `save.ts`. Commit `refactor: M12 E0 Zugriffshelfer in src/sim und Sim-Tests`.
- [ ] **6 Ledger:** Anzahl umgestellter Stellen je Datei (für das Review), SHA.

**Review-Fokus:** reine Mechanik (kein geänderter Ausdruck ausser Zugriffstausch); `controller.ts` Zeile für Zeile;
Pins unverändert grün; Zuordnung Gebäude-Insel vs. Heimat nach der Tabelle oben; keine Aliase auf `World`.
