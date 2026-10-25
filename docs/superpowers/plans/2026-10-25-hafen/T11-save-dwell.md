# T11 · Save `SAVE_V_DWELL` (S4, Spec §5)

Umsetzer `tech-sim-engineer` · ≈ 40 Tools · AK-HF-32, -34, -35 (S4-Version) · blocked-by: T10 · Worktree `.worktrees/hafen-dwell` · Spec §5 · Index P-1

## Dateien

- ändern: `src/sim/save.ts`, `src/sim/world.ts` (Literal `version`)
- Tests: `tests/sim/save.test.ts` (`describe('HAFEN S4 Save')`), `tests/sim/helpers.ts` (Rückfalten `dropDwell`)

## Interfaces

```ts
export const SAVE_V_DWELL = /* SAVE_VERSION(main) + 1 beim L3-Merge (R925: eigene Version, nicht mit S3 zusammengelegt) */;
export const SAVE_VERSION = SAVE_V_DWELL;
/** SAVE_V_DWELL − 1 → SAVE_V_DWELL: dwell = 0 für jedes Schiff (alte Stände liegen nie mit Route). Wirft nie. */
export function migrateToDwell(raw: Record<string, unknown>): void;
```

`isValidShip` zusätzlich: `dwell` ganzzahlig in `0 … SHIP_DOCK_TICKS`; `dwell > 0` nur bei `to === null` **und** `route !== null`; sonst «Beschädigter Spielstand».
Kette in `deserialize`: `… migrateToRoute …; if (raw.version === SAVE_V_DWELL − 1) migrateToDwell(raw);`.

## Steps

- [ ] **Tests rot** `tests/sim/save.test.ts`, `describe('HAFEN S4 Save')`:
  - AK-HF-32: Welt mit einem Schiff mitten in Fahrt und einem mitten in der Liegezeit (`dwell` 17) speichern, laden; danach 500 Ticks `step` → JSON-gleich zur
    ungeladenen Welt nach denselben 500 Ticks.
  - AK-HF-34: Stand `SAVE_V_DWELL − 1` (Helfer `dropDwell`) lädt mit `dwell = 0` je Schiff; `dwell` 31, −1, 1,5 und `dwell > 0` mit `to ≠ null` sowie `dwell > 0` ohne
    Route → «Beschädigter Spielstand», kein Wurf.
  - AK-HF-35: `SAVE_VERSION + 1` → «Unbekannte Version»; Kette `SAVE_V_ROUTE − 1` → aktuell lädt (beide Migrationen nacheinander).
- [ ] **Lauf rot → Umsetzen → Lauf grün** `tests/sim/save*.test.ts tests/sim/helpers.test.ts tests/sim/council-save.test.ts`.
- [ ] Kandidatenliste und Teilbeleg laut Index.
- [ ] **Commit:** `feat: Save SAVE_V_DWELL mit Liegezeit (HAFEN S4, AK-HF-32, -34, -35)`.

## Bericht

Exit-Codes; Rot-Ausgabe; gewählte Nummer auf dem Branch. Danach D3 per `SendMessage`.
