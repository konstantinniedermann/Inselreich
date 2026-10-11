# T03 · Bauplatz, drei Aktionen, Abriss (TDD)

Strang sim · Worktree `.worktrees/m13-e2-sim` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M13E2-04, -05, -06, -07,
-15 (Spec R1.3–R1.6, R3, R4, R9; Anhang 01 F) · blocked-by T02 · Grösse M (≈ 28 Tools)

**Files:**

- Create: `src/sim/monument.ts`
- Modify: `src/sim/build.ts` (`placeBuilding` setzt `world.monument`, `demolish` setzt `null`),
  `tests/sim/monument.test.ts`, `tests/sim/monumentHelpers.ts` (`placeMonument` liefert jetzt auch `world.monument`)
- Lesen: Spec §3 R1, R3, R4, R9, §5; `src/sim/edicts.ts` (`edictReason`/`setEdict` als Muster «reine Prüfung +
  Aktion»), `demolish` (`townhall → edict = null` als Muster), `src/sim/rng.ts` (Zustand für den Vergleich).

## Schnittstelle (`src/sim/monument.ts`)

```ts
export function newMonument(buildingId: number): Monument; // stage 0, running false, delivered/buy alle 0/false, paused false
/** Reine Prüfung in der Reihenfolge von R4.1 (1)–(4); null = Start möglich. Auch für die UI (T10). */
export function monumentStartReason(w: World): string | null;
export function startMonumentStage(w: World): Result;
export function setMonumentPaused(w: World, paused: unknown): Result;
export function setMonumentBuy(w: World, good: unknown, on: unknown): Result;
export function isMonumentGood(g: unknown): g is MonumentGood;
```

- `startMonumentStage` (R4.1): `monumentStartReason` → bei Grund `{ ok: false, reason }`, sonst `money −=
MONUMENT_STAGES[stage].money`, `running = true`, `delivered` alle 0. Gründe wörtlich: `'Kein Denkmal'`, `'Denkmal
fertig'` (`stage >= 3`), `'Abschnitt läuft'`, `'Zu wenig Geld'` (auch bei negativem Geld). Anbindung und Pause sind
  **keine** Bedingung.
- `setMonumentPaused` (R4.2): `'Kein Denkmal'` → kein Boolean `'Ungültiger Wert'` → setzen, `ok` (auch gleicher Wert).
- `setMonumentBuy` (R4.3): `'Kein Denkmal'` → kein `MonumentGood` `'Ungültiges Gut'` → `on` kein Boolean `'Ungültiger
Wert'` → setzen, `ok`.
- Kein Zugriff auf `rng.ts`, kein Wurf. Bei `ok: false` keine Änderung an der Welt.
- **Importregel:** `monument.ts` importiert `types`, `defs/*`, `world.ts`-Helfer (`home`), später `trade.ts`; **nie**
  `build.ts` oder `placement.ts`. `build.ts` importiert `newMonument` (Richtung build → monument). Nach Änderung
  `tests/sim/imports.test.ts` laufen lassen.
- `placeBuilding` (R1.4): bei `defId === 'monument'` im selben Aufruf `world.monument = newMonument(id)`;
  `monumentDone` bleibt. `demolish` (R9.1): `if (b.defId === 'monument') world.monument = null`; Erstattung wie jedes
  Gebäude (`refundCost(paidCost(b))`), sonst nichts.

## Schritte

- [ ] **Schritt 0:** `grep -n "export function placeBuilding\|export function demolish\|townhall" src/sim/build.ts`;
      `grep -n "export" src/sim/rng.ts`.
- [ ] **Schritt 1: Test zuerst (rot)** in `tests/sim/monument.test.ts` (Testwelt `monumentWorld`, `MONUMENT_AT`):
  - **AK-04 Bauplatz:** ok; Geld −500, Holz −10, Stein −10; die neun Kacheln tragen die Id; `w.monument` =
    `newMonument(id)` (`toEqual`, Schlüsselfolge `buildingId, stage, running, delivered, paused, buy`); zweites Denkmal
    → `'Es gibt schon ein Denkmal'` (auch nach `monumentDone = true`); Fremdinsel mit Kontor → `'Nur auf der
Heimatinsel'`, ohne Kontor → `'Erst ein Kontor auf dieser Insel'`; Anhang 01 F: `x = kx + 8` → `'Ausserhalb der
Versorgung'`, `kx + 7` ok.
  - **AK-05 3×3:** je eine belegte Kachel in Zeile 3 bzw. Spalte 3 → Bodengrund (wörtlich wie `checkGround`); Weg an
    jeder der zwölf Randkacheln (Schleife, je frische Welt) → `connected true`; Weg nur diagonal an einer Ecke →
    `false`; `needsConnection('monument') === false`, Zustand nie `'notConnected'`.
  - **AK-06 Start:** Stufe 0, `money 4000` → ok, `money 0`, `running`; erneut → `'Abschnitt läuft'`; `money 3999` und
    `−50` → `'Zu wenig Geld'`, `serialize` unverändert; ohne Denkmal `'Kein Denkmal'`; `stage 3` → `'Denkmal fertig'`;
    ohne Anbindung und bei `paused` → ok.
  - **AK-07 Werfen nie:** drei Aktionen × `good` ∈ {`'stone'`, `'wood'`, `''`, 0, `null`, `undefined`, `{}`} × Wert ∈
    {`true`, `false`, `'ja'`, 1, `undefined`}, je mit und ohne Denkmal → `expect(() => …).not.toThrow()`, Ergebnis
    `{ ok, reason? }` mit den Gründen aus R4; bei `ok: false` sind `serialize(w)` und der RNG-Zustand gleich vorher.
  - **AK-15 Abriss:** laufender Abschnitt 2 (`stage 1`, `running`, `delivered` > 0) → `demolish` ok, `w.monument
null`, Geld +250, Holz +5, Stein +5, Lager sonst gleich; `monumentDone` bleibt (Fälle `true` und `false`); Neubau →
    `stage 0`, `running false`.

```bash
npx vitest run tests/sim/monument.test.ts; echo EXIT=$?   # rot: monument.ts fehlt
```

- [ ] **Schritt 2: Umsetzen.**

```bash
npx vitest run tests/sim/monument.test.ts tests/sim/save-v12.test.ts tests/sim/build.test.ts tests/sim/imports.test.ts \
  tests/sim/edicts.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

(`tests/sim/build.test.ts` nur falls vorhanden; sonst die Tests, die `demolish` aufrufen: `grep -rln "demolish("
  tests/sim`.)

- [ ] **Schritt 3: Commit.** `feat: Denkmal bauen, Abschnitt starten, Pause, Zukauf-Schalter, Abriss (M13-E2 T03)`.

## Bericht

Testnamen je AK, Rot-Zeile, Exit-Codes, Importgraph `monument.ts` (eine Zeile), `git diff --stat`.
