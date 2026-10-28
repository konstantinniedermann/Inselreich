# T09 · Save `SAVE_V_ROUTE`: Migration Anker und `left` (S3, Spec §5)

Umsetzer `tech-sim-engineer` · ≈ 50 Tools · AK-HF-33, AK-HF-35 (S3-Version); Gate-Randfall «Laden mit `left = 0`» · blocked-by: T07 · Worktree `.worktrees/hafen-route` ·
Spec §5, Anhang 01 G · Index P-1, P-9

## Dateien

- ändern: `src/sim/save.ts`, `src/sim/world.ts` (Literal `version`), ggf. `src/sim/types.ts` (Kommentar `version`)
- Tests: `tests/sim/save.test.ts` (neuer `describe('HAFEN S3 Save')`), `tests/sim/helpers.ts` (Rückfalt-Helfer, falls Fixtures alter Stände gebaut werden)
- nicht ändern: Spielregeln; vorhandene Migrationen v1…v(n)

## Interfaces

```ts
export const SAVE_V_ROUTE = /* SAVE_VERSION(main) + 1 beim Merge, P-1 */;
export const SAVE_VERSION = SAVE_V_ROUTE;
/** Vorgänger → SAVE_V_ROUTE. Prüft left gegen T_alt, setzt Anker der Inseln mit Kontor II := dockFor, rechnet left um. false = beschädigt. Wirft nie. */
export function migrateToRoute(raw: Record<string, unknown>): boolean;
```

## Verhalten (Reihenfolge Spec §5, Anhang 01 G)

1. Wache: `isValidIslands(raw)` und `Array.isArray(raw.ships)`; sonst `false`. Alles in `try`; Ausnahme → `false`.
2. `T_alt(port, to)` = `LEGACY_SEA_TILE_TICKS.base · d` bzw. `.seerecht · d`, wenn `raw.council[4] === 'C'`; `d` aus `seaLanes` mit den **gespeicherten** Ankern.
   Jedes Schiff mit `to ≠ null`: `left` ganzzahlig in `[1, T_alt]`, sonst `false`. Schiffe mit `to === null` brauchen `left === 0`.
3. Jede Fremdinsel mit `kontorId ≠ null`: Kontor-Gebäude suchen (`raw.buildings[kontorId]`, `defId === 'kontor2'`, sonst `false`), `anchor := dockFor(...)`.
   Danach `raw.islands` durch eine Kopie ersetzen (P-2).
4. `left_neu = clamp(ceil(left_alt · T_neu / T_alt), 1, T_neu)`, `T_neu = laneTicks(raw.islands, port, to, seaTileTicks(raw))` (neue Anker, ≤ ≈ 75 ms je Stand).
5. `raw.version = SAVE_V_ROUTE`; `true`.

In `deserialize`: `if (raw.version === SAVE_V_ROUTE - 1 && !migrateToRoute(raw)) return { ok: false, reason: 'Beschädigter Spielstand' };` vor der Versionsprüfung.
`isValidShip` prüft danach gegen `T_neu` (unverändert über `laneTicks`). Unbekannte Version (≥ `SAVE_VERSION + 1`) bleibt «Unbekannte Version».

## Steps

- [ ] **Tests rot** `tests/sim/save.test.ts`, `describe('HAFEN S3 Save')` (Vorgänger-Stand = aktuelle Welt, per Helfer auf `SAVE_V_ROUTE − 1` zurückgefaltet:
      `version` setzen, Anker der Kontor-II-Inseln auf den alten Wert, `left` aus `T_alt` — Helfer `foldBackToRouteV(w)` in `tests/sim/helpers.ts`, nie Zahlenliterale):
  - AK-HF-33: Kontor II abseits `kontorSite`, Schiff fahrend: nach Laden Anker = `dockFor`, `left` nach Formel; `left = T_alt` → `T_neu`; `left = 1` → 1; `left > T_alt`
    → `{ ok: false, reason: 'Beschädigter Spielstand' }`; dasselbe mit Seerecht (`T_alt` mit 8).
  - Randfall `left = 0` (Gate 5): Schiff mit `to ≠ null`, `left = 0` → abgewiesen mit Hinweis; Schiff mit `to === null`, `left = 0` lädt (liegt).
  - AK-HF-35: `SAVE_VERSION + 1` und `+ 2` → «Unbekannte Version»; Stand `SAVE_V_ROUTE − 1` ohne Schiffe lädt und hat danach `version === SAVE_VERSION`.
  - Kein Absturz: kaputte Inseln (Anker fehlt, `kontorId` zeigt ins Leere) → `ok: false`, kein Wurf (`expect(() => deserialize(…)).not.toThrow()`).
  - Runde: `deserialize(serialize(w))` JSON-gleich für eine Welt mit fahrendem Schiff.
- [ ] **Lauf rot → Umsetzen → Lauf grün** `tests/sim/save*.test.ts tests/sim/council-save.test.ts tests/sim/farOrder-save.test.ts tests/sim/helpers.test.ts`.
- [ ] Versionstests im Bestand, die eine feste Nummer nennen, auf `SAVE_VERSION` bzw. `SAVE_V_ROUTE − 1` umstellen (Name je Test im Commit).
- [ ] Kandidatenliste und Teilbeleg laut Index.
- [ ] **Commit:** `feat: Save SAVE_V_ROUTE mit Migration von Anker und Restfahrzeit (HAFEN S3, AK-HF-33, -35)`.

## Bericht

Exit-Codes; Rot-Ausgabe; gewählte Nummer auf dem Branch (main + 1 zum Zeitpunkt); Ladezeit eines Stands mit 4 Schiffen (ms, **Last ≤ 4 nötig**, sonst «offen, Last x»; Richtwert ≤ 300 ms, da `migrateToRoute` je Schiff ≤ ≈ 75 ms rechnet). Danach D2 per `SendMessage`.
