# T01 · Modell und Save: Defs, Felder, Kette, Faltung

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 60 Tools · blocked-by: T00 · AK-ZE-01 (Hash-Teil), -08, -14 (Werte), -16 (Kette), -27 · Regeln R909, R981 L3, R982 Auflage 1, R983

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

**Files:**

- Modify: `src/sim/defs/tiers.ts`, `src/sim/defs/timing.ts`, `src/sim/types.ts`, `src/sim/world.ts` (neben `taxCarry`, Z. ≈ 144), `src/sim/save.ts` (42 KB: nur abschnittsweise; `SAVE_VERSION` Z. 57, `isValidV6Fields` Z. ≈ 590, Kette Z. ≈ 1043)
- Modify: `tests/sim/helpers.ts` (nur Faltung, Z. ≈ 285–455), `tests/sim/helpers.test.ts`, `tests/sim/farOrder-save.test.ts`, `tests/sim/save-loyalty.test.ts` (nur Aussenkette)
- Create: `tests/sim/tithe-save.test.ts`, `tests/sim/tithe.test.ts` (nur Block «Defs»)

## Interfaces

- Produces (Defs, `tiers.ts`): `TITHE_GOOD = { 1: 'tools', 2: 'stone' } as const`, `TITHE_PCT: Record<TitheTier, number> = { 1: 100, 2: 10 }`, `TITHE_UNITS_PER_100: Record<TitheGood, number> = { tools: 3, stone: 8 }`, `TITHE_CARRY_DIVISOR = TAX_CARRY_DIVISOR * 100`, `TITHE_TIERS: readonly TitheTier[] = [1, 2]`, `TITHE_GOODS: readonly TitheGood[] = ['tools', 'stone']`. `timing.ts`: `TITHE_SWITCH_LOCK = 1800`.
- Produces (`types.ts`): `type TitheTier = 1 | 2`, `type TitheGood = 'tools' | 'stone'`, `type TitheLoss = Partial<Record<TitheGood, number>>`; `World.titheOn: Record<TitheTier, boolean>`, `World.titheLockedUntil: Record<TitheTier, number>`, `World.titheCarry: Record<TitheGood, number>`. Kein Import von `defs` in `types.ts` (Typen literal, `TITHE_GOOD` per `satisfies Record<TitheTier, TitheGood>` abgesichert).
- Produces (`save.ts`): `migrateV<N>ToV<N+1>(raw: Record<string, unknown>): void` (N = main-Wert); `SAVE_VERSION` = N + 1.
- Produces (`helpers.ts`): `dropTithe(x)`, `foldBackTithe(x)` (export), Fehlertext `'dropTithe: Zehnt nicht rückfaltbar'`.

## Inhalt

1. **Defs und Typen** wie Interfaces; Doc-Kommentar je Wert mit Einheit (Spec-Tabelle «Werte»).
2. **Welt-Start** in `createWorld`: `titheOn { 1: false, 2: false }`, `titheLockedUntil { 1: 0, 2: 0 }`, `titheCarry { tools: 0, stone: 0 }`, aus `TITHE_TIERS`/`TITHE_GOODS` gebaut (kein Literal-Schlüssel).
3. **Migration** im Stil von `migrateV17ToV18`: setzt die drei Felder auf Startwerte, `raw.version = N + 1`; Doc «I-223 Zehnt: drei Felder mit Startwerten (Zehnt aus). Wirft nie.» Aufruf als letzte Zeile vor `if (raw.version !== SAVE_VERSION)`.
4. **Strukturprüfung** `isValidTithe(raw): boolean` neben `isValidV6Fields`, Aufruf im Strukturcheck: `titheOn` und `titheLockedUntil` Objekte mit **genau** den Schlüsseln `'1','2'` (aus `TITHE_TIERS`), `titheOn[t]` Boolean, `titheLockedUntil[t]` ganze Zahl ≥ 0 (`isInt` + `≥ 0`); `titheCarry` genau `tools`, `stone` (aus `TITHE_GOODS`), je `isIntBetween(v, 0, TITHE_CARRY_DIVISOR − 1)`. Fehlt ein Feld → ungültig. Ungültig → bestehender Pfad `{ ok: false, reason: 'Beschädigter Spielstand' }`.
5. **Faltung (P-2):** `dropTithe` nach Muster `dropTrial` (Z. 288): ohne Schlüssel `titheOn` → unverändert zurück; nur bei Startwerten (beide `false`, Sperren 0, Überträge 0) alle drei Schlüssel ohne Umordnen entfernen, sonst `throw new Error('dropTithe: Zehnt nicht rückfaltbar')`. `foldBackTithe(x) = { ...dropTithe(x), version: x.version − 1 }`, Doc «äusserster Faltschritt v<N+1> → v<N>». In **allen drei** Köpfen `foldBackToV13`, `foldBackToV12`, `foldBackToV11`: `dropTrial(dropTithe(input))`. Doc von `foldBackSeerecht` bleibt; neuer Schritt steht im Quelltext davor.
6. **Aussenketten:** `foldBackSeerecht(X)` → `foldBackSeerecht(foldBackTithe(X))` in `farOrder-save.test.ts:58`, `save-loyalty.test.ts:57,69,138`, `helpers.test.ts:47` (Imports ergänzen).

## Tests

**`tests/sim/tithe-save.test.ts`** (kein Versionsliteral; `N = SAVE_VERSION − 1`):

- **AK-ZE-08 Rundlauf:** Welt mit `titheOn {1: true, 2: false}`, `titheLockedUntil {1: 2400, 2: 0}`, `titheCarry {tools: 1_760_000, stone: 3}`, `tick` 700 → `deserialize(serialize(w))` `ok`, alle drei Felder gleich (`toEqual`).
- **AK-ZE-08/27 Migration:** `raw = JSON.parse(serialize(createWorld(3)))`, die drei Schlüssel löschen, `raw.version = SAVE_VERSION − 1` → `ok`, `version === SAVE_VERSION`, Felder = Startwerte; `serialize` gleich dem der nativen Welt.
- **AK-ZE-08 Abweisen** (`it.each`, je `{ ok: false, reason: 'Beschädigter Spielstand' }` und `expect(() => deserialize(j)).not.toThrow()`): `titheOn[1] = 'ja'`; `titheOn['3'] = false` zusätzlich; `titheOn` fehlt (Version `SAVE_VERSION`); `titheLockedUntil[2] = -1`; `= 1.5`; `titheCarry.tools = TITHE_CARRY_DIVISOR` (2 000 000); `titheCarry.stone` fehlt. Grenze: `titheCarry.tools = TITHE_CARRY_DIVISOR − 1` → `ok`.
- **AK-ZE-08 Version:** `version = SAVE_VERSION + 1` → `{ ok: false, reason: 'Unbekannte Version' }`.
- **AK-ZE-27 Quellscan:** Quelltext dieser Datei (`readFileSync(import.meta.url …)`) ohne Treffer für `/version:\s*\d/` und `/toBe\(\d+\)/` in Zeilen mit `version`.

**`tests/sim/tithe.test.ts`, Block «AK-ZE-14 Defs»:** `TITHE_GOOD` `toEqual({1:'tools',2:'stone'})`, `TITHE_PCT` `{1:100,2:10}`, `TITHE_UNITS_PER_100` `{tools:3,stone:8}`, `TITHE_CARRY_DIVISOR` `toBe(TAX_CARRY_DIVISOR * 100)` und `toBe(2_000_000)`, `TITHE_SWITCH_LOCK` `toBe(1800)`.

**`tests/sim/helpers.test.ts`, neuer Block «dropTithe»:** Startwerte → Schlüssel weg, übrige Reihenfolge gleich (`Object.keys`); `titheOn[1] = true` → wirft `'dropTithe: Zehnt nicht rückfaltbar'`; ebenso `titheCarry.stone = 1`; ohne Schlüssel → dasselbe Objekt (`toBe`). Jede der drei Ketten `foldBackToV13/V12/V11` wirft bei `titheOn[1] = true` mit diesem Text.

## Schritte

- [ ] Tests schreiben; **Rot:** `npx vitest run tests/sim/tithe-save.test.ts tests/sim/tithe.test.ts tests/sim/helpers.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Umsetzen (Inhalt 1–6).
- [ ] **Grün:** derselbe Befehl → 0.
- [ ] **17 Verbraucher einzeln (R983, Auflage 1)**, je ein Lauf mit Exit ins Ledger (eine Zeile je Datei):
      `for f in seaGolden balance-crises save save-contract save-v11 scenario-saves reserve-bitgleich buyPct save-v12 save-v13 save-loyalty farOrder-save reserve-save goal3 edicts helpers; do npx vitest run tests/sim/$f.test.ts; echo "$f EXIT=$?"; done` (16 Testdateien). Der 17. Verbraucher ist die Hilfsdatei `tests/sim/scenarios.ts` (`foldBackToV12` in `m14e1Altstand`, Z. ≈ 1121): Beleg über ihre Sim-Nutzer `npx vitest run tests/sim/scenario-saves.test.ts tests/sim/m5-session.test.ts; echo "scenarios EXIT=$?"`. Alle 0.
- [ ] `git diff main -- tests/sim/seaGolden.test.ts tests/sim/balance.test.ts` leer (AK-ZE-01 Hash-Teil; Neupinnen verboten).
- [ ] Weitere Save-Tests: `npx vitest run tests/sim/trial-save.test.ts tests/sim/council-save.test.ts; echo EXIT=$?` → 0.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: I-223 Zehnt-Felder, Save-Schritt und Faltung (T01)`.
