> **Task-ID:** T03 · **AK-IDs:** AK-E0-01, -02, -03, -04, -05, -06, -07, -08, -09 (Test `version 8`), -17
> **blocked-by:** T02 · **Strang:** `feat/m12-e0`, Worktree `.worktrees/m12-e0` · `tech-sim-engineer` (sonnet)
> **Regeln:** [index.md](index.md) Global Constraints, Entscheide P-3, P-4, P-5, P-9, P-11, P-12, P-14 · Spec §4.3,
> §4.5, §4.6, Anhang 01 A, B, C, E

## T03: Formwechsel auf v7 — Typen, `createWorld`, Save v7, Fold-back

**Ziel:** Der Weltzustand hat `islands` (genau ein Eintrag) und jedes Gebäude `island`. Alte Stände wandern über
`migrateV6ToV7`; der Fold-back hält Fingerabdruck und Pins bitgleich.

**Code-Fakten:** `save.ts` `SAVE_VERSION` Zeile 23, `isWellFormed` ab 289, `deserialize` ab 314 (Kette bis 327 `migrateV5ToV6`); v3→v4 schreibt
`raw.stock.glass` (oben, bleibt so). `balance-crises.test.ts` `normalized()` (Zeile 32) löscht auf `raw.stock`.
Bestehende Tests mit `r.version = 7` → „Unbekannte Version": `save.test.ts` 102, 408, 534, 793. Seit T01:
`home`, `islandOf`, `Island`-Alias; seit T00: `e0Pins.ts`, `fixtureV6.ts`, `sortedJson`, `fnv1a32`.

**Dateien:** `src/sim/types.ts`, `world.ts`, `save.ts`, `build.ts` (nur Literal `island: HOME`);
`tests/sim/helpers.ts` (`foldBackToV6`), `tests/sim/save.test.ts`, `tests/sim/balance-crises.test.ts` (nur
`normalized`), Gebäude-Literale in allen Tests (`island: 0`, vom Typprüfer gemeldet).

## Form (verbindlich)

- `types.ts`: `interface Island { width; height; tiles: Tile[]; kontorId: number; stock: Record<GoodId, number> }`;
  `World.version: 7`, `islands: Island[]`, die fünf Felder entfallen; `Building.island: number` (Pflicht, F-S2).
- `world.ts`: `home = (w) => w.islands[HOME]!`, `islandOf = (w, b) => w.islands[b.island]!`. `createWorld`
  Schlüssel (P-3): `version, seed, islands, tick, buildings, nextBuildingId, money, stats, won, wonMerchants,
taxLevel, taxLockedUntil, sellPct, order, crisisLevel, crisis, unlocked, goodLocks, upgradeStops, taxCarry,
upkeepCarry`; Insel `{ width, height, tiles, kontorId: 1, stock }`; Kontor-Literal endet `state: 'ok', island: HOME`.
  `placeBuilding`-Literal ebenso (`…, state: 'ok', island: HOME`).
- `save.ts`: `SAVE_VERSION = 7`; `migrateV6ToV7(raw)` **reihenfolgetreu und wurffrei** (P-3, P-4): Schlüssel in
  Originalreihenfolge neu einsetzen, dabei `width` durch `islands: [{ width, height, tiles, kontorId, stock }]`
  ersetzen und `height`, `tiles`, `kontorId`, `stock` weglassen; je Gebäude, das ein Objekt ist, `island: 0` direkt
  nach `state` einsetzen (fehlt `state`: ans Ende); `buildings` kein Objekt → Gebäude überspringen; `version 7`.
  Kette: `if (raw.version === 6) migrateV6ToV7(raw)` nach v5→v6.
- Ladeprüfung v7 (vor den v2–v6-Prüfungen, die jetzt `islands[0].stock` lesen): `islands` Array Länge 1; Insel 0
  Objekt mit `width === MAP_W`, `height === MAP_H`, `tiles` Array mit 4096 Objekten, `stock` mit allen `GOOD_IDS` als
  Zahl, `kontorId` → Gebäude mit `defId 'kontor'` und `island 0`; jedes Gebäude `island` Ganzzahl in
  `[0, islands.length)`; keiner der fünf v6-Schlüssel oben (P-5). `isValidTile` für `crisis.tile` bleibt gegen
  `MAP_W`/`MAP_H`.
- `tests/sim/helpers.ts` `foldBackToV6(v7: Record<string, unknown>)` nach Anhang 01 E (v6-Reihenfolge neu gebaut, je
  Gebäude `island` entfernt, unbekannter Schlüssel → `throw` im Test, mehr als eine Insel → `throw`).

## Schritte

- [ ] **1 Tests zuerst** (`save.test.ts`, `describe('M12 E0 Save v7')`), Rot-Beleg vor der Umsetzung:
  - **AK-E0-17 Eigentest zuerst** (Risiko R-2): `foldBackToV6(JSON.parse(serialize(createWorld(3))))` serialisiert →
    `fnv1a32`/Länge gleich `V6_FORMS['createWorld(3)']`.
  - **AK-E0-01** wie Spec. **AK-E0-02** die vier Varianten gegen `V6_FORMS`.
  - **AK-E0-03** `save-v6.json` lädt, `version 7`; `foldBackToV6` tief gleich dem rohen Fixture ohne `connected`;
    `islands[0].stock` = Fixture-`stock`.
  - **AK-E0-04** T00-Kettentest umstellen: Hash über `sortedJson(foldBackToV6(…))` = `CHAIN_HASHES`.
  - **AK-E0-05** je Stand ein `it`: (a) `save-v6.json` gegen `fixtureV6Run()`; (b) Fold-back-Stände aus
    `normalRunTo(1000)` (Auftrag offen), `normalRunTo(2650)` (`crisis.kind 'storm'`), `normalRunTo(4300)`
    (`'boom'`): Zustand erst prüfen, dann `foldBackToV6` → JSON → `deserialize`; beide Welten je 300 × `step`
    ohne Controller; `serialize` zeichengleich.
  - **AK-E0-06** v6 nur mit Kontor (aus `foldBackToV6` von `createWorld(3)`) lädt, Kontor `island 0`; Sperren:
    `createWorld(3, { unlockAll: true })`, Amtsstube angebunden bauen (Muster `fixtureV6.ts`), `setGoodLock`,
    `setUpgradeStop` → Fold-back → laden → `unlocked`, `goodLocks`, `upgradeStops` tief gleich (P-14).
  - **AK-E0-07** je Fall N01–N20 aus Anhang 01 B plus **N21** (`tiles` zusätzlich oben in v7) ein Eintrag in einer
    Tabelle, je → „Beschädigter Spielstand", `not.toThrow()`.
  - **Garbage (P-4, P-11):** bestehender Test „never throws on garbage input" zusätzlich mit `{version:6,
buildings:null}`, `{version:6, buildings:{1:5}}`, `{version:6, buildings:{1:null}}`, `{version:7}`,
    `{version:7, islands:null}`, `{version:7, islands:[null]}`, `{version:7, islands:[{}], buildings:null}`.
  - **AK-E0-08** Round-trip für `createWorld(3)`, Endwelt `off`-Lauf (`buildColony`), Welt im Brand (Muster M6-Test);
    geladener v6-Stand: zweiter Round-trip zeichengleich.
  - **AK-E0-09** `version 8` → „Unbekannte Version"; die vier Alt-Tests 7 → 8 umstellen (P-12, nicht löschen).
- [ ] **2 Rot-Beleg** `npx vitest run tests/sim/save.test.ts -t "M12 E0"` → Commit `test: M12 E0 Save v7 (rot)`.
- [ ] **3 Umsetzung** Form, `createWorld`, Migration, Ladeprüfung nach „Form". Dann `npx tsc --noEmit`: jede Meldung
      ist ein vergessener Zugriff (zurück zum Helfer) oder ein Gebäude-Literal in Tests (`island: 0` direkt nach
      `state`). **Kein** Kompatibilitäts-Getter.
- [ ] **4 `normalized()`** in `balance-crises.test.ts`: erste Zeile `const raw = foldBackToV6(JSON.parse(json))`,
      Rest unverändert. Danach `OFF_FINGERPRINT`-Test grün **ohne** Pin-Änderung; sonst anhalten (R74).
- [ ] **5 Prüfen:** `make check`, `CI=true make check` grün; AK-E0-16 … -19 grün; `git diff main --
tests/sim/balance.test.ts src/sim/defs` leer. Commit `feat: M12 E0 Weltzustand mit Inseln, Save v7`.

**Review-Fokus:** Migration wirft nie und erhält Reihenfolge; Ladeprüfung deckt N01–N21; keine Aliase; Pins
unverändert; Fold-back erzeugt v6-Reihenfolge; Gebäude-Literale nur um `island` ergänzt.
