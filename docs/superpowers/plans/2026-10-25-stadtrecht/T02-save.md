# T02 · Weltfeld `charter`, Save-Version, Migration, Faltketten

Umsetzer `tech-sim-engineer` · ≈ 50 Tools · AK-ST-11, AK-ST-02 (Teil «neue Welt `[]`») · blocked-by: T00, T01, `git merge main` (Seerecht auf main) · Worktree `.worktrees/stadtrecht` · Spec §6, §8 · Plan P-3, P-4

## Dateien

- ändern: `src/sim/types.ts` (`World.charter`), `src/sim/world.ts` (`charter: []`, `version`), `src/sim/save.ts` (`SAVE_VERSION`, Migration, `isValidCharter`, Kette in `deserialize`), `tests/sim/helpers.ts` (`dropCharter`, `foldBackCharter`), Faltketten und Versions-Pins laut Step 0
- neu: `tests/sim/charter-save.test.ts`
- nicht ändern: `src/sim/council.ts`, `src/sim/charter.ts` (T03), `tests/sim/balance*.test.ts`

## Interfaces

- Consumes (T01): `CharterSide`, `CHARTER_SESSIONS`.
- Produces: `World.charter: CharterSide[]` (Kommentar: «Gekaufte Sitzungen des Stadtrechts, Index = Sitzung − 1; nur über `src/sim/council.ts` und `src/sim/charter.ts` gelesen (R870 R-1).»); `export function migrateV<n−1>ToV<n>(raw)`; `foldBackCharter(x)` in `tests/sim/helpers.ts`.

## Verhalten

1. **Nummer (P-3):** `n` = `SAVE_VERSION` auf main (Ledger T00) + 1, erwartet 22. `SAVE_VERSION = n`, `createWorld` `version: n`, Kommentar an `World.version` falls vorhanden.
2. **Migration** nach Muster `migrateV17ToV18` (`save.ts:940`): `raw.charter = []; raw.version = n;` Doc-Kommentar «v<n−1> → v<n> (Stadtrecht): `charter = []`. Wirft nie.» In `deserialize` als letzte Zeile der Kette vor `if (raw.version !== SAVE_VERSION)`.
3. **`isValidCharter(raw)`:** `Array.isArray(raw.charter) && raw.charter.length <= CHARTER_SESSIONS.length && raw.charter.every((s) => s === 'A' || s === 'B')`. In `isWellFormed` **direkt nach `isValidCouncil`**; liegt `isValidCouncil` (Seerecht SR-E3) vor `isValidV9Fields`, kommt `isValidCharter` mit davor (der Seerecht-Helfer `seaTileTicks(raw)` liest über `activeLever` ab T04 auch `raw.charter`). Abweisen = bestehender Pfad «Beschädigter Spielstand».
4. **`foldBackCharter`** nach Muster `dropTrial`/`foldBackTrial` (`tests/sim/helpers.ts:287-302`): entfernt `charter` ohne Umordnen, wirft bei nicht leerem `charter` («dropCharter: Stadtrecht nicht rückfaltbar»), `version − 1`.

## Steps

- [ ] **Step 0 (Inventar, vor jedem Test):** `rg -n "foldBack[A-Z][A-Za-z]+\(" tests` und `rg -n "SAVE_VERSION\)\.toBe\(|PRE_[A-Z_]+_VERSION" tests`. Liste ins Ledger: (a) jede Kette, deren äusserster Aufruf der bisher neueste Faltschritt ist (Stand Plan: `foldBackTrial` in `farOrder-save`, `save-loyalty` ×3, `helpers.test`; nach Stadtplanung/Inselproben deren Schritt) → bekommt `foldBackCharter(` aussen; (b) exakte Versions-Pins früherer Stränge (z. B. Seerecht `expect(SAVE_VERSION).toBe(PRE_SEERECHT_VERSION + 1)`) → `toBeGreaterThanOrEqual(...)`, nur diese Zeile, Kommentar «Stadtrecht +1 (P-4)». Weitere Treffer, die nicht in (a)/(b) passen: an den Controller, nicht raten.
- [ ] **Tests rot** in `tests/sim/charter-save.test.ts` (versionsneutral, kein Literal für die Version):
  - **AK-ST-02 (Feld):** `createWorld(3).charter` ist `[]`; ebenso `createWorld(7, { crisisLevel: 'off' })` («Neue Insel» baut über `createWorld`, `app.ts:522`).
  - **AK-ST-11 Roundtrip:** `serialize` → `deserialize` erhält `charter` für `[]`, `['A']`, `['B','A','B']` und volle Länge (`CHARTER_SESSIONS.map((_, i) => (i % 2 ? 'B' : 'A'))`); `r.world.version === SAVE_VERSION`.
  - **AK-ST-11 Migration:** `const old = foldBackCharter(JSON.parse(serialize(createWorld(3))))` hat `version === SAVE_VERSION − 1` und kein `charter`; `deserialize(JSON.stringify(old))` → `ok`, `charter` `[]`. Direkt: `migrateV<n−1>ToV<n>(raw)` setzt `[]` und `version` = `SAVE_VERSION`, wirft nie (auch bei `raw = {}`).
  - **AK-ST-11 Abweisen:** je ein Stand mit `charter` = Länge `CHARTER_SESSIONS.length + 1` (nur `'A'`), `['X']`, `['a']`, `'AB'` (Nicht-Array), `null`, `{}`, `[1]`, fehlendes Feld bei aktueller Version → `{ ok: false, reason: 'Beschädigter Spielstand' }`, kein Wurf (`expect(() => deserialize(j)).not.toThrow()`).
  - Älterer Fixture-Stand: `tests/sim/fixtures/save-v14-contract.json` (oder der jüngste vorhandene) läuft die Kette bis `SAVE_VERSION` mit `charter` `[]` (Muster `council-save.test.ts:80`).
- [ ] **Lauf rot:** `npx vitest run tests/sim/charter-save.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–4 und Step 0 (a)/(b).
- [ ] **Teilbeleg:** `npx vitest run tests/sim/charter-save.test.ts tests/sim/council-save.test.ts tests/sim/farOrder-save.test.ts tests/sim/save-loyalty.test.ts tests/sim/helpers.test.ts tests/sim/save-v11.test.ts tests/sim/save-v12.test.ts tests/sim/inselmarkt.test.ts tests/sim/charter.test.ts tests/sim/council.test.ts <alle Dateien aus Step 0>; echo EXIT=$?`, dazu `rg -l "deserialize\(" tests/sim` vollständig: `npx vitest run $(rg -l "deserialize\(" tests/sim); echo EXIT=$?`; `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?` → je 0. Laufzeit mit T00 vergleichen.
- [ ] **Commit:** `feat: Save-Feld charter mit Migration (AK-ST-11)`.

## Task-Review

Version = Ledger-Wert + 1, keine Nummer in Tests; `isValidCharter` vor `isValidV9Fields`; Migration wirft nie; Faltketten vollständig (Reviewer wiederholt Step-0-`rg`); nur die genannten Pin-Zeilen geändert, und je geänderter Pin-Zeile bleibt die Migration des Vorgängers über ihren Faltschritt in einer Kette getestet (Gate-Plan B5, ST-E4); `World.charter` ohne Optional-Markierung.
