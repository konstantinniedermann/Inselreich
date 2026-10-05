> **Task-ID:** T02 · **AK-IDs:** AK-E1-01 (Kreuzprobe `canPlace`), AK-E1-03, AK-E1-05, AK-E1-06; AK-M12-B1 … B5; B6
> **blocked-by:** T01, **E0-T04** (Inselparameter `canPlace(…, island)`, `tests/sim/helpers.ts`) · **Strang:** sim,
> `.worktrees/m12-e1` · `tech-sim-engineer` (sonnet)
> **Regeln:** [index.md](index.md) Global Constraints, P-5, P-6 · Spec Anhang 02 C, Anhang 03 B (v8), Anhang 04

## T02: Weltzustand v8 — Fremdinseln in `createWorld`, Save v8, Migration, Ladeprüfung

**Code-Fakten (nach E0-T04 per Merge):** `types.ts` `Island { width, height, tiles, kontorId: number, stock }`,
`World.version: 7`; `world.ts` `createWorld` (Heimat aus `generateMap`), `home`, `islandOf`, `HOME`; `save.ts`
`SAVE_VERSION = 7`, Kette bis `migrateV6ToV7`, Ladeprüfung v7; `tests/sim/helpers.ts` `foldBackToV6`;
`balance-crises.test.ts` `normalized()` beginnt mit `foldBackToV6(JSON.parse(json))`. Tests mit `version 8` →
„Unbekannte Version" (E0 P-12). Seit T00: `save-v7.json`, `V7_FORMS`; seit T01: `islands.ts`, `sea.ts`.

**Dateien:** `src/sim/types.ts`, `world.ts`, `save.ts`; Null-Behandlung `kontorId` wo der Typprüfer meldet
(`supply.ts`, `roads.ts`, `queries.ts` u. a.); `tests/sim/helpers.ts` (`foldBackToV7`), `save.test.ts`,
`islands-gen.test.ts`, neu `tests/sim/islands-rng.test.ts`, `balance-crises.test.ts` (nur `normalized`).

## Form (verbindlich)

- `types.ts`: `Island { kind: 'home' | IslandKind; width; height; tiles; kontorId: number | null; stock; ox: number;
oy: number; anchor: { x: number; y: number } }` — **Schlüsselreihenfolge** `kind, width, height, tiles, kontorId,
stock, ox, oy, anchor`; `World.version: 8`. Liest Code `kontorId`, behandelt er `null` als „kein Kontor"
  (Heimat hat immer eine Zahl; Verhalten der Heimat unverändert). Kein `!`-Kompatibilitätsgriff ausser `home(w).kontorId!`
  an Stellen, die nur die Heimat meinen, mit Kommentar.
- `createWorld`: Heimat wie bisher plus `kind: 'home'` (erster Schlüssel), `ox: 0, oy: 0, anchor: homeAnchor(…)`;
  danach `generateForeignIslands(seedUsed, home)` → je Insel `{ kind, width, height, tiles: terrain.map(t => ({ terrain:
t, buildingId: null, road: false })), kontorId: null, stock: alle GOOD_IDS 0, ox, oy, anchor }`.
- `save.ts`: `SAVE_VERSION = 8`; `migrateV7ToV8(raw)` **wirft nie** (P-5): `islands[0]` Objekt, `tiles` Array mit
  `MAP_W · MAP_H` Objekten, Kontor-Gebäude vorhanden und `seed` endlich → Heimat neu aufbauen (`kind` vorn, `ox`,
  `oy`, `anchor` hinten) und A, B anhängen; sonst nur `version 8` (Ladeprüfung entscheidet). Heimatanker aus den
  aktuellen `tiles` (Forst ändert Land/Wasser nicht).
- **Ladeprüfung v8** (vor den älteren Prüfungen): `islands.length === 1 + ISLANDS.length`; `kind` `home`, dann
  `ISLANDS[i − 1].kind`; Fremdinsel `width`/`height` ganzzahlig ≤ `size`, `tiles.length = w · h`; Heimat `ox = oy = 0`,
  `kontorId` Zahl; Fremdinsel `kontorId === null` (P-6, E1); `ox`, `oy` Ganzzahlen; `anchor` innerhalb der Insel;
  `stock` mit allen `GOOD_IDS`; Gebäude-`island` in `[0, islands.length)`. Gebäude auf Fremdinsel ohne Kontor: erlaubt.
- `tests/sim/helpers.ts` `foldBackToV7(v8)`: `islands = [islands[0]]`, dort `kind`, `ox`, `oy`, `anchor` löschen,
  `version 7`; unbekannter Schlüssel → `throw` (nur Test). `normalized()`:
  `foldBackToV6(foldBackToV7(JSON.parse(json)))`, Rest unverändert (AK-M12-B2).

## Schritte

- [ ] **0 Basis:** `git merge feat/m12-e0` (bis E0-T04), `make check` grün.
- [ ] **1 Tests zuerst**, `describe('M12 E1 Save v8')` in `save.test.ts`, Rot-Beleg vor der Umsetzung:
  - **AK-E1-05** `createWorld(3)`: `islands.length === 3`, Kinds `home, A, B`, Fremdinseln `kontorId null`, Lager 0; Heimat `kind 'home'` ohne `ISLANDS`-Eintrag (nie `spice`);
    `save-v7.json` lädt (`ok`), `version 8`, `islands[1..2]` tief gleich `createWorld(world.seed)`-Fremdinseln;
    Round-trip `serialize(deserialize(serialize(w)).world) === serialize(w)` für `createWorld(3)` und geladenes v7.
  - **Bitgleich Heimat:** `foldBackToV7` von `createWorld(3)` je Variante → `fnv1a32`/Länge = `V7_FORMS` (T00);
    `foldBackToV7(deserialize(save-v7).world)` serialisiert = Datei `save-v7.json` (zeichengleich).
  - **AK-E1-06** Tabelle L01–L14, je „Beschädigter Spielstand", `not.toThrow()`: L01 Länge 2; L02 Kinds B, A; L03 Kind
    `'C'`; L04 Heimat-Kind `'A'`; L05 A `width 25`; L06 B `height 37`; L07 `tiles` zu kurz; L08 Heimat `kontorId null`;
    L09 A `kontorId 1`; L10 `ox 1.5`; L11 `anchor` fehlt; L12 Heimat `oy 3`; L13 Gebäude `island 3`; L14 A ohne
    `stock.food`. Dazu: Gebäude auf Insel 1 (Kachel `buildingId` gesetzt), `kontorId null` → lädt. **Garbage:**
    `{version:7}`, `{version:7, islands:null}`, `{version:7, seed:'x', islands:[{}]}` → kein Wurf.
    `version 9` → „Unbekannte Version"; die Alt-Tests mit `version 8` auf `9` umstellen (nicht löschen).
  - **AK-M12-B5** Kette `save-v1.json` … `save-v7.json` → `version 8`, `ok`; Kettenhashes über
    `sortedJson(foldBackToV6(foldBackToV7(…)))` = `CHAIN_HASHES`.
  - **AK-E1-01 Kreuzprobe** (`islands-gen.test.ts`): Seeds 1…200, `createWorld(s, { unlockAll: true })`: für B jeder
    `quarrySites`-Platz (aus `generateForeignIslands(w.seed, home)`) → `canPlace(w, 'quarry', x, y, 2).ok`.
  - **AK-E1-03** `tests/sim/islands-rng.test.ts` (eigene Datei wegen `vi.mock`): `createRng` per `vi.mock` mitschneiden;
    `createWorld(3)` ruft ihn genau einmal mit `(w.seed ^ ISLANDS_SALT) >>> 0`; 6000 `step` „normal" ziehen diesen Wert
    nie; zweimal `createWorld(3)` tief gleich; Heimat-`tiles` = `generateMap(3).terrain`.
  - **B6** `createWorld(s)` Mittel über Seeds 1…50 ≤ `perfBudget(5)` ms (`tests/helpers/perfBudget`).
- [ ] **2 Rot-Beleg** `npx vitest run tests/sim/save.test.ts tests/sim/islands-gen.test.ts tests/sim/islands-rng.test.ts
-t "M12 E1"` → Commit `test: M12 E1 Save v8 (rot)`.
- [ ] **3 Umsetzung** nach „Form"; `npx tsc --noEmit` meldet jede `kontorId`-Stelle → Null-Fall behandeln.
- [ ] **4 `normalized()`** umstellen; `OFF_FINGERPRINT` grün **ohne** Pin-Änderung, sonst anhalten (R74).
- [ ] **5 Prüfen:** `make check`, `CI=true make check` grün; `git diff main -- tests/sim/balance.test.ts` leer;
      `balance-merchants` `[6750, 11200, 320]`; Zufallsfolge AK-E0-19 grün. Commit `feat: M12 E1 Fremdinseln im Weltzustand, Save v8`.

**Review-Fokus:** Migration wirft nie, Reihenfolge; Heimat bitgleich (V7_FORMS); L01–L14 vollständig; `null`-Fälle
ohne Verhaltensänderung der Heimat; nur ein neuer `createRng`.
