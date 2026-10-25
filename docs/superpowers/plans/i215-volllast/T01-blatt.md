# T01 · Defs, Typen, Blattmodul `overtime.ts`, Aktion

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 40 Tools · blocked-by: T00 · AK-VL-01, -10, -11, -21 (Blatt-Teil)

**Files:** Modify `src/sim/defs/buildings.ts`, `src/sim/defs/timing.ts`, `src/sim/types.ts`, `src/ui/panelView.ts` und `src/ui/texts.ts` (nur mechanisch, Plan P-3), `tests/sim/imports.test.ts` (nur Ausnahmeliste, P-5). Create `src/sim/overtime.ts`, `tests/sim/overtime.test.ts`, `tests/sim/overtime-source.test.ts`.

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

## Inhalt

1. **Defs:** `defs/buildings.ts` neben `PAUSED_UPKEEP_PCT`: `OVERTIME_CYCLE_PCT = 75` (Doc: Zyklus in Volllast, Prozent, aufgerundet), `OVERTIME_UPKEEP_PCT = 150` (Doc: muss > 133 bleiben, Spec Regel 1). `defs/timing.ts` im Block neben dem Fest: `OVERTIME_TICKS = 1800`, `OVERTIME_REST_TICKS = 1200`, Doc-Kommentar «Save-Prüfung liest `overtimeAt` nur gegen den Tick».
2. **Typen:** `Building.overtimeAt?: number` neben `feastAt` (Doc: Starttick der Volllast; fehlt = Normalbetrieb). `BuildingState` um `'resting'`. Die erschöpfenden `switch` in `src/ui/panelView.ts` (Zustandsfarbe: `'resting'` → `'warn'`) und `src/ui/texts.ts` (Platzhalter `{ text: 'Ruht', ok: false }`) ziehen mit; T05 verfeinert.
3. **`src/sim/overtime.ts`** (Kopfkommentar: Blatt, importiert nur `./defs/*` und `./types`; Muster `feastState`):
   - `type OvertimePhase = 'normal' | 'overtime' | 'rest'`; `overtimeState(world: Pick<World, 'tick'>, b: Building): { phase; remaining }` nach Spec Regel 3 (`d = world.tick − b.overtimeAt`); `Pick` erlaubt der UI den Aufruf mit nur `{ tick }` (T05).
   - `overtimeCycle(c) = Math.max(1, Math.ceil((c * OVERTIME_CYCLE_PCT) / 100))`.
   - `overtimeUpkeep(world, b, u): number` — Phase `overtime` → `ceil(u × OVERTIME_UPKEEP_PCT / 100)`, `rest` → `ceil(u × PAUSED_UPKEEP_PCT / 100)`, sonst `u`. Stilllegen prüft der Aufrufer (T02).
   - `clearExpiredOvertime(world, b): void` — löscht `overtimeAt` bei `d ≥ OVERTIME_TICKS + OVERTIME_REST_TICKS` (Aufruf in T03).
   - `overtimeBlockReason(world, b): string | null` — Reihenfolge Spec Regel 8 Punkte 2–7, Texte exakt: «Nur Betriebe kennen Volllast», «Volllast läuft», «Ruht», «Stillgelegt: erst anfahren», «Brennt», «Keine Strassenverbindung». «Hat Zyklus» = `BUILDING_DEFS[b.defId].produces !== undefined && BUILDING_DEFS[b.defId].cycle !== undefined` (P-5).
   - `startOvertime(world, id: unknown): Result` — Id-Suche wie `pause.ts` (`typeof id === 'number' && Number.isInteger(id)`, `Object.hasOwn`), sonst `fail('Gebäude nicht gefunden')`; dann `overtimeBlockReason`; Erfolg setzt nur `b.overtimeAt = world.tick`. Wirft nie, kein Geld, keine Ware, kein Zufall.
4. **`tests/sim/imports.test.ts`:** `overtime.ts` in die Ausnahmeliste des Tests «PLAN-NAHT … lesen cycle/upkeep nie direkt» (Kommentar: nur Existenzprüfung, P-5). Keine andere Änderung.

## Tests (`tests/sim/overtime.test.ts`, Welten nach Spec Anhang 02 A)

- **AK-VL-01:** `overtimeCycle` für 1, 2, 3, 4, 8, 20, 30, 50 → 1, 2, 3, 3, 6, 15, 23, 38; Schleife `c` 1 … 500: `3 * c <= 4 * overtimeCycle(c)` und `overtimeCycle(c) <= c`.
- **AK-VL-10** (`it.each`): unbekannte Id, Id `'1'`, Haus, Markt, in Volllast (`startOvertime` vorher), in der Ruhe (`overtimeAt = tick − OVERTIME_TICKS`), stillgelegt, brennend (`outageUntil`, `state = 'burning'`), ohne Strasse (`connected = false`) → `{ ok: false, reason }` exakt, `serialize(world)` vorher gleich nachher. Rangfolge: Ruhe + stillgelegt → «Ruht»; stillgelegt + brennend → «Stillgelegt: erst anfahren»; brennend + ohne Strasse → «Brennt». `overtimeBlockReason` liefert dieselben Texte (Punkte 2–7) und ändert `serialize` nicht. Review-Fokus 4: Id 1,5 und `NaN` → «Gebäude nicht gefunden».
- **AK-VL-11:** `startOvertime` → `ok` bei `state` = `waitingInput`, `waitingReserve`, `storageFull`, `noService`, `noForest` (Zustand direkt gesetzt, verbunden, nicht stillgelegt); danach `overtimeAt === world.tick`.
- **Phasen ohne Schritt** (Vorlauf zu AK-VL-06, ohne `step`): `overtimeAt = tick − d` für `d` = 0, 1799, 1800, 2999, 3000 → `overtime`/1800, `overtime`/1, `rest`/1200, `rest`/1, `normal`/0. Feld fehlt → `normal`/0. `overtimeUpkeep(w, b, 15)` je Phase 23 / 8 / 15.

## Quellscan (`tests/sim/overtime-source.test.ts`, AK-VL-21 Blatt-Teil)

Liest `src/sim/overtime.ts` als Text (`readFileSync`, Muster `tests/sim/imports.test.ts`): (a) Importe nur `./defs/…` und `./types`, insbesondere nicht `./levels`, `./production`, `./economy`; (b) die Namen `OVERTIME_CYCLE_PCT`, `OVERTIME_UPKEEP_PCT`, `OVERTIME_TICKS`, `OVERTIME_REST_TICKS`, `PAUSED_UPKEEP_PCT` werden importiert und verwendet; (c) keine Zahlenliterale ausser `0`, `1` und `100` in der Datei (Regex über den Quelltext ohne Kommentare). T02 und T03 erweitern die Datei um `levels.ts` und `production.ts`.

## Schritte

- [ ] Tests schreiben; **Rot:** `npx vitest run tests/sim/overtime.test.ts tests/sim/overtime-source.test.ts; echo EXIT=$?` → ≠ 0 (Modul fehlt). Ledger.
- [ ] Umsetzen (Inhalt 1–4).
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/sim/imports.test.ts tests/sim/defs.test.ts tests/ui/panelView.test.ts; echo EXIT=$?` → 0.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: I-215 Volllast Defs und Blattmodul overtime (T01)`, gezielt gestagt.
