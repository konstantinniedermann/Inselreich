# T02 · Save v11: Weltfelder, Migration, Ladeprüfung C1–C7, `foldBackToV10` (TDD)

Strang sim · Worktree `.worktrees/m13-e1-sim` · Umsetzer `tech-sim-engineer` (sonnet, Fortsetzung) · AK-M13E1-01, 22, 23, 24, 25a–h, 26 (Sim-Teil) · Spec §9, Anhang 02 (ganz lesen) · blocked-by T01 · Grösse M (≈ 35 Tools)

**Warum ein Task:** Weltfelder, `version 11`, `SAVE_VERSION`, Prüfung und Rückfaltung müssen in **einem** Commit landen; sonst sind Rundlauf und Hash-Pins rot.

**Files:**

- Modify: `src/sim/types.ts` (`World.version: 11`, am Ende `edict: EdictId | null`, `edictLockedUntil: number`; `Building.paused?: true`; `BuildingState` + `'paused'`), `src/sim/world.ts` (`createWorld`: `version: 11`, nach `wonSpice` `edict: null`, `edictLockedUntil: 0`), `src/sim/save.ts`, `tests/sim/helpers.ts`
- Create: `tests/sim/save-v11.test.ts`
- Modify (nur Version/Index, Liste unten): `tests/sim/save.test.ts`
- **Typ-Brücke (Entscheid E3, einzige UI-Zeilen dieses Tasks):** `src/ui/texts.ts` `stateInfo`: `case 'paused': return { text: 'Stillgelegt — halber Unterhalt', ok: false };` · `src/ui/panelView.ts` `stateTone`: `case 'paused': return 'warn';` (neben `storageFull`). Sonst nichts in `src/ui/`; Verhalten und Tests dazu kommen in T12.

## Regeln (Anhang 02)

- **Migration** `export function migrateV10ToV11(raw)`: fehlt `edict` → `null`, fehlt `edictLockedUntil` → `0`; vorhandene Werte bleiben (gehen in die Prüfung); Gebäude unverändert; `raw.version = 11`; wirft nie. In `deserialize` nach `migrateV9ToV10`: `if (raw.version === 10) migrateV10ToV11(raw);`.
- **Prüfung** `isValidV11Fields(raw)` in `isWellFormed` nach `isValidV9Fields`: C1 `edict` `null` oder `Object.hasOwn(EDICTS, edict)`; C2 `isInt(edictLockedUntil) && ≥ 0`; C3 `edict !== null ⇒ won === true`; C4 `edict !== null ⇒` ein Gebäude `defId === 'townhall'`; C5 je Gebäude `paused` fehlt oder `=== true`; C6 `paused === true ⇒ BUILDING_DEFS[defId].produces !== undefined`; C7 `state === 'paused' ⇒ paused === true`. `'paused'` in `BUILDING_STATES`. Keine Obergrenze für die Sperre.
- **Rückfaltung** (`tests/sim/helpers.ts`): `V10_WORLD_KEYS` = heutige `createWorld`-Schlüssel (`V9_WORLD_KEYS` mit `taxLevel` → `taxLevels`); `export function foldBackToV10(v11)`: unbekannter Schlüssel → `Error('foldBackToV10: unbekannter Schlüssel <k>')`; `edict !== null || edictLockedUntil !== 0` → `'foldBackToV10: Edikt nicht rückfaltbar'`; Gebäude mit Schlüssel `paused` oder `state === 'paused'` → `'foldBackToV10: Stilllegung nicht rückfaltbar'`; Ausgabe v10-Schlüssel in v10-Reihenfolge, `version: 10`. `foldBackToV9(x)` ruft bei `x.version === 11` zuerst `foldBackToV10(x)` (Anhang 02 D); kein Aufrufer ändert sich.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot).** `tests/sim/save-v11.test.ts`, `describe('M13-E1 Save v11')`, Erwartungen aus Anhang 02 F:
  1. `AK-M13E1-01`: `createWorld(3)` → `edict null`, `edictLockedUntil 0`, `Object.keys(w).slice(-2)` = `['edict', 'edictLockedUntil']`, `version 11`, `SAVE_VERSION === 11`.
  2. `AK-M13E1-22 foldBackToV10`: v11 ohne Edikt → Schlüssel ohne die zwei Felder, `version 10`, `JSON.stringify` gleich einem v10-Stand (Referenz von Hand aus `V10_WORLD_KEYS`); mit `edict 'trade'`, mit Sperre 1, mit Gebäude `paused` → wirft (Meldungstext prüfen); `foldBackToV9` auf v11 = `foldBackToV9(foldBackToV10(x))`.
  3. `AK-M13E1-23 Rundlauf`: `createWorld(3, { unlockAll: true })` (Amtsstube braucht U3), `won = true`, `placeTownhall(w)`, `edict 'trade'`, `edictLockedUntil 4000`, ein **angebundener** Fischer mit `paused: true`, `state: 'paused'` → `deserialize(serialize(w))` ok, `toEqual(w)`, Fischer-`state` gleich. (`recomputeConnectivity` lässt `'paused'` bei angebundenem Gebäude stehen; den Fall ohne Anbindung regelt T07.)
  4. `AK-M13E1-24 Migration`: v10-Stand mit `won true` (Entscheid E5: `foldBackToV10(JSON.parse(serialize(w)))` aus einer Welt mit `won` und Amtsstube) → ok, `version 11`, `edict null`, Sperre 0; alle Fixtures `save-v1.json` … `save-v8.json`, `see-route-start-v9.json`, `z3-scenario-v9.json` → ok, `version 11`, `edict null`, Sperre 0. Direkt: `migrateV10ToV11` lässt vorhandene `edict: 'x'` stehen.
  5. `AK-M13E1-25a…h`: je Fall ein `it` mit dem Ergebnis aus Anhang 02 F (Hilfsfunktion `tampered(w, fn)` wie in `save.test.ts`); 25b vier Werte (−1, 1.5, `'300'`, Schlüssel gelöscht bei `version 11`); 25e fünf Fälle (`paused: false`, `paused: 1`, `paused: true` an Wohnhaus, Kapelle, Kontor); 25g `paused: true`, `state: 'burning'`, gültiges `outageUntil` (Muster `isValidOutage`) → ok. Jeder Fall: `deserialize` wirft nicht.
  6. `AK-M13E1-26`: `version: 12` → `'Unbekannte Version'`; Text `{"version": 11` → `'Ungültiges Format'`.

```bash
npx vitest run tests/sim/save-v11.test.ts; echo EXIT=$?   # rot: Felder, Migration, Helfer fehlen
```

- [ ] **Schritt 2: Umsetzen** (Typen, `createWorld`, `save.ts`, Helfer, Typ-Brücke). Danach bestehende Tests nachführen, **nur** wo Version oder Schlüssel-Index gepinnt sind: `save.test.ts` Z. 137 (`toBe(11)`), Z. 400 und Z. 558 (`slice(-10, -8)` → `slice(-12, -10)`). Weitere rote Stellen: nur Version/Index anpassen und im Bericht einzeln nennen; **jede** rote Hash-, Form- oder Fingerabdruck-Prüfung (`CHAIN_HASHES`, `V6_FORMS`, `e0Pins`, `e1Pins`, `seePins`, `fnv1a32`) ist ein Stopp: nicht anpassen, Controller melden.

```bash
npx vitest run tests/sim/save-v11.test.ts tests/sim/save.test.ts tests/sim/scenario-saves.test.ts tests/sim/balance-crises.test.ts tests/sim/goal3.test.ts tests/sim/seaGolden.test.ts tests/sim/kontor2.test.ts tests/sim/defs.test.ts tests/ui/storage.test.ts tests/ui/hints.test.ts tests/ui/panelView.test.ts tests/tools/renderqa.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
git diff main -- tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/seePins.ts 'tests/sim/balance*.test.ts'; echo EXIT=$?   # leer
```

- [ ] **Schritt 3: Commit.** `feat: Save v11 mit Edikt- und Stilllegungsfeldern (M13-E1 T02)`.

**Controller nach T02 (Entscheid E8):** einmal `make test; echo EXIT=$?` im Sim-Worktree (Testsperre, Load ≤ 8); rote Dateien gehen als Fix-Runde an denselben Umsetzer.

## Bericht

Je AK Testname und Rot-Zeile, Liste aller nachgeführten Altstellen (Datei:Zeile, alt → neu), Exit-Codes, `git diff --stat main...HEAD`. Bestätigen: `git diff main -- src/ui` zeigt genau die zwei `case 'paused'`.
