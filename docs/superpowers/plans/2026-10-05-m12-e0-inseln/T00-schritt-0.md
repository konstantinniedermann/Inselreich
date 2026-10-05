> **Task-ID:** T00 · **AK-IDs:** AK-E0-19 (Test entsteht hier); Vorbedingung für AK-E0-02, -03, -04, -05, -17
> **blocked-by:** Gate Plan · **Strang:** `feat/m12-e0`, Worktree `.worktrees/m12-e0` · `tech-sim-engineer` (sonnet)
> **Regeln:** [index.md](index.md) Global Constraints · Spec §4.3, §4.5, Anhang 01 C und E

## T00: Schritt 0 — Fixture `save-v6.json`, Pins, Zufallsfolge (vor jeder Änderung in `src/`)

**Ziel:** Auf dem unveränderten v6-Code einen echten v6-Spielstand und alle Vergleichswerte einchecken, gegen die E0
später bitgleich geprüft wird. **Dieser Task ändert keine Datei unter `src/`.**

**Code-Fakten (Basis 020850e, `src/` = 17cbafb, Probe des Plans):**

- `tests/sim/controller.ts`: `startColony(w)` → `{ layout, t }`; `runColony(w, layout, t, opts, stop?)` hält nach dem
  ersten Schritt mit `stop(w) === true`. `balance-crises.test.ts:71` `NORMAL = { fireStation: true }`; dort ist
  `fnv1a32` eine lokale Funktion (Zeile 17).
- Lauf `createWorld(3, { crisisLevel: 'normal' })` + `NORMAL`: erster Tick mit `state 'burning'` und `order !== null`
  = **3000** (Brand Periode 1, Ziel-Id 7; Auftrag Periode 2 Holz 32, fällig 3000). `unlocked` = U0, U2, U3, U4;
  Geld 927; `taxCarry` 5100, `upkeepCarry` 0. Sieg 7850.
- Probe-Aktionen bei Tick 3000: `buy(w,'stone',10)`, `buy(w,'tools',5)` ok; Amtsstube baubar (U3), aber an der ersten
  freien Stelle nicht angebunden → `setUpgradeStop` „Amtsstube wirkt nicht"; `setGoodLock` → „Erst mit den ersten
  Bürgern" (U5 fehlt); `upgradeBuilding(w, 6)` (Holzfäller) ok; Zuckerrohr/Rum kaufbar, Glas „Erst nach dem Ziel".
- Zufallsfolge des Laufs (zur Gegenprobe): `O0 stone 17/187 @600 · O1 food 19/114 @1500 · C0 storm @2400 · O2 wood
32/224 @2400 · C1 fire 7 burning @3000 · O3 wood 23/161 @3300 · C2 storm @3600 · C3 boom stone @4200 · O4 wool 12/108
@4200 · C4 fire 22 extinguished @4800 · …` bis `O8 food 10/60 @7800`.

**Dateien:** neu `tests/sim/fixtures/save-v6.json`, `tests/sim/fixtureV6.ts`, `tests/sim/e0Pins.ts`; ändern
`tests/sim/helpers.ts` (`fnv1a32`, `sortedJson`), `tests/sim/balance-crises.test.ts` (nur `fnv1a32` aus `helpers`
importieren statt lokal, plus neuer `describe` AK-E0-19), `tests/sim/save.test.ts` (neuer `describe` am Ende).
**Nicht anfassen:** `src/**`, `tests/sim/controller.ts`, alte Fixtures.

## Schritte

- [ ] **1 Basis prüfen:** `git -C .worktrees/m12-e0 diff --stat 17cbafb -- src tests` leer, sonst Meldung.
- [ ] **2 Helfer** in `tests/sim/helpers.ts`: `fnv1a32(s)` (aus `balance-crises.test.ts` verschoben, dort importiert,
      sonst unverändert) und `sortedJson(v)`: `JSON.stringify` mit rekursiv nach Schlüssel sortierten Objekten
      (Arrays in Reihenfolge).
- [ ] **3 Rezept als Helfer** `tests/sim/fixtureV6.ts`, eingecheckt (T03 nutzt es für AK-E0-05):
  - `normalRunTo(tick, opts?)`: `createWorld(3, { crisisLevel: 'normal' })`, `startColony`,
    `runColony(…, NORMAL, (x) => x.tick >= tick)`; wirft `Error`, wenn der Tick verfehlt wird. Liefert `{ w, layout, t }`.
  - `fixtureV6Run()`: `normalRunTo(3000)`, prüft `burning` und `order !== null`, dann **zwischen zwei Schritten**:
    1. `buy(w,'stone',10)`, `buy(w,'tools',5)` (beide `ok`, sonst `Error`).
    2. Amtsstube: erste Position in Zeilenfolge (y, dann x), an der `canPlace(w,'townhall',x,y).ok` und eine Kachel
       aus `adjacentOf` des Fussabdrucks in `reachableRoads(w)` liegt; `placeBuilding` → `ok`; danach
       `setUpgradeStop(w, 1, true)` muss `ok` sein. Findet sich keine Stelle: `Error` und Meldung an den Controller.
    3. `upgradeBuilding` auf den ersten Holzfäller in Id-Reihenfolge → `ok`.
    4. Je Gut mit Bestand 0 ausser `glass`: `buy(w, g, 3)` → `ok`.
  - Abweichung von Anhang 01 C (Entscheid P-14): keine Ausgabesperre, Glas 0, `upkeepCarry` 0. Im Kopfkommentar
    nennen.
- [ ] **4 Test zuerst** (`save.test.ts`, `describe('M12 E0 Schritt 0 (Anhang 01 C)')`):
  - `T00 save-v6.json roh`: `version 6`, `tick 3000`, ein Gebäude `burning` mit `outageUntil`, `crisis.kind 'fire'`,
    `order.period 2`, `upgradeStops` `[1]`, ein Gebäude `level 2`, `stock` mit allen 9 Gütern, 8 davon > 0,
    `taxCarry > 0`; `deserialize(json).ok` true.
  - `T00 Rezept = Fixture`: `serialize(fixtureV6Run().w) === readFileSync(fixture)` (zeichengleich).
  - `T00 v6-Formen` (AK-E0-02/17-Vorbedingung): für `createWorld(3)`, `{ unlockAll: true }`, `{ crisisLevel: 'mild' }`,
    `{ crisisLevel: 'normal' }`: `fnv1a32(serialize(w))` und `.length` gleich `V6_FORMS` aus `e0Pins.ts` (P-9).
  - `T00 Kette` (AK-E0-04-Vorbedingung): je `save-v1` … `save-v5`: `fnv1a32(sortedJson(deserialize(json).world))`
    gleich `CHAIN_HASHES[n]`.
  - In `balance-crises.test.ts`, `describe('M12 E0 Zufallsfolge')`: **AK-E0-19** sammelt im Lauf „normal" + `NORMAL`
    bis zum Sieg je neuer Periode Krise `C<k>:<kind>:<target>:<outcome>:<good>@<tick>` und Auftrag
    `O<k>:<good>:<amount>:<reward>@<tick>` (Muster der Probe) und vergleicht mit `RANDOM_SEQUENCE`.
- [ ] **5 Rot-Beleg:** `npx vitest run tests/sim/save.test.ts tests/sim/balance-crises.test.ts -t "T00|AK-E0-19"` → rot
      (ENOENT Fixture; Platzhalter-Pins `0`/`[]`). Commit `test: M12 E0 Schritt 0 Tests (rot)` mit Ausgabe-Auszug.
- [ ] **6 Erzeugen:** temporärer Erzeuger `tests/sim/gen-e0.test.ts` (**nicht einchecken**),
      `it.runIf(import.meta.env.VITE_GEN_E0)`: schreibt `save-v6.json` per `writeFileSync` (Shim `node-shim.d.ts` deklariert es)
      und gibt `V6_FORMS`, `CHAIN_HASHES` (hex) und `RANDOM_SEQUENCE` als TS-Literal aus. Befehl:
      `VITE_GEN_E0=1 npx vitest run tests/sim/gen-e0.test.ts --silent=false`. Werte nach `tests/sim/e0Pins.ts` mit
      Kopfkommentar: Commit-SHA (Basis), Befehl, Datum. Erzeuger löschen.
- [ ] **7 Grün:** dieselben Tests grün; `make check` und `CI=true make check` grün; `git diff 17cbafb -- src` leer.
      `.prettierignore` deckt `tests/sim/fixtures/` (prüfen). Commit
      `test: M12 E0 Schritt 0 Fixture, Pins, Zufallsfolge` mit Befehl und SHA im Text.

**Review-Fokus (qa-code-reviewer):** keine Datei in `src/`; Fixture über Sim-Aktionen entstanden (Rezept = Fixture
zeichengleich); Pins mit Beleg; `fnv1a32`-Verschiebung ändert `OFF_FINGERPRINT`-Test nicht; Zufallsfolge vollständig
bis zum Sieg; Abweichung P-14 im Kommentar.
