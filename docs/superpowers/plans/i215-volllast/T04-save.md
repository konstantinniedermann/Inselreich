# T04 · Save: Feld, Zustand, Version, Kette

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 40 Tools · blocked-by: T03 · AK-VL-15, -16, -17 (Regeln R952, R909)

**Files:** Modify `src/sim/save.ts` (41 KB: nur abschnittsweise lesen, nach Symbolen arbeiten); Create `tests/sim/overtime-save.test.ts`. Andere `tests/sim/save*.test.ts` nur, wenn ein Test den **aktuellen** Wert von `SAVE_VERSION` als Literal prüft (Stand Plan: keiner, siehe unten).

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

## Inhalt

1. **`'resting'`** in `BUILDING_STATES`.
2. **`isValidOvertime(b, tick)`** neben `isValidFeast`: Feld fehlt → `true`; sonst `BUILDING_DEFS[b.defId].produces !== undefined`, `isInt(tick)` und `isIntBetween(b.overtimeAt, 0, tick)`. Abgelaufene Felder sind gültig (Löschen im nächsten Schritt, T03). Aufruf in `isValidV6Fields` neben `isValidFeast`. Ungültig → bestehender Pfad `{ ok: false, reason: 'Beschädigter Spielstand' }`, nie ein Wurf.
3. **Version (R909, Plan P-8):** `SAVE_VERSION` = Wert auf main **zum T04-Zeitpunkt** + 1 (`git show main:src/sim/save.ts | rg -n "SAVE_VERSION ="`). Neue Funktion `migrateV<alt>ToV<neu>(raw)` im Stil von `migrateV17ToV18`: setzt nur `raw.version` auf den neuen Wert, Doc-Kommentar «I-215 Volllast: `overtimeAt` optional, Fehlen = Normalbetrieb; keine Datenänderung (R952). Wirft nie.» Aufruf als letzte Zeile der Kette vor `if (raw.version !== SAVE_VERSION)`.
4. **Versionsliterale:** `rg -n "version\)\.toBe\([0-9]+\)|SAVE_VERSION\)\.toBe\(" tests; echo EXIT=$?`. Stand Plan (main `1de17074`) prüfen alle Treffer historische Einzelschritte (z. B. `trial-save.test.ts:51` `migrateV17ToV18` → 18, `save-loyalty.test.ts:76` «historisch») und bleiben unverändert. Ein Treffer, der den aktuellen Wert meint, wird auf `SAVE_VERSION` umgestellt und im Bericht genannt.

## Tests (`tests/sim/overtime-save.test.ts`, Grundwelt Spec Anhang 02 A, zwei Seeds per `describe.each`)

- **AK-VL-15:** Weberei in Volllast (`overtimeAt = tick − 500`) bzw. in der Ruhe (`tick − 2000`, einen `step` gelaufen, Zustand `'resting'`) → `serialize`/`deserialize` → `ok`, `overtimeAt` gleich, `'resting'` erhalten; danach je 3000 `step` geladene und ungeladene Welt: `serialize` gleich.
- **AK-VL-16** (`it.each`): `overtimeAt` −1, `tick + 1`, 1,5, `'5'`, `null`, an einem Haus, am Markt → `{ ok: false, reason: 'Beschädigter Spielstand' }`, `expect(() => deserialize(...)).not.toThrow()`. Abgelaufen (`d` = 5000) → `ok`, `overtimeState` `normal`, nach einem `step` Feld gelöscht. Zustand `'resting'` ohne Feld → `ok`, nach einem `step` anderer Zustand als `'resting'`.
- **AK-VL-17:** `serialize` schreibt `version: SAVE_VERSION`. (a) Stand aus `createWorld` mit `version: SAVE_VERSION − 1`, ohne `overtimeAt` und ohne `'resting'` → `ok`, `version === SAVE_VERSION`, `serialize` der geladenen Welt gleich der nativ erzeugten; nach N = 3000 `step` beider Welten `serialize` gleich. (b) Stand `SAVE_VERSION − 2` lädt `ok` über die Kette: ist der Vorgängerschritt ein reiner Versionsschritt, genügt `createWorld` mit ersetzter Version; ändert er Daten (z. B. Seerecht v18 → v19), zuerst die vorhandene Faltungshilfe des Vorgängers verwenden (`rg -n "export function foldBack" tests/sim`); fehlt eine, Befund an den Controller statt eigener Faltung in `helpers.ts`. (c) `SAVE_VERSION + 1` → `{ ok: false, reason: 'Unbekannte Version' }`, kein Wurf. **Kein Literal einer Versionsnummer** in der Datei (Quellscan im selben Test: Regex `version:\s*\d` und `toBe\(\d+\)` neben `version` ohne Treffer).

## Schritte

- [ ] `git show main:src/sim/save.ts | rg -n "SAVE_VERSION ="` und `rg -n "SAVE_VERSION =" src/sim/save.ts` (Branch) ins Ledger.
- [ ] Tests schreiben; **Rot:** `npx vitest run tests/sim/overtime-save.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Umsetzen (Inhalt 1–4).
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/sim/save*.test.ts tests/sim/scenario-saves.test.ts tests/sim/trial-save.test.ts tests/sim/council-save.test.ts tests/sim/helpers.test.ts; echo EXIT=$?` → 0 (bestehende Ladefälle unverändert `ok`).
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: I-215 Save overtimeAt, Zustand resting, Versionsschritt (T04)`.
