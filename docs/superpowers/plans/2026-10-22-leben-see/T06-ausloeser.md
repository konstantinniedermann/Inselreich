# T06 · Klang: Auslöser in `soundEvents.ts` und K9-Prüfauftrag

Umsetzer `tech-ui-engineer` · ≈ 30 Tools · AK K1 bis K4, K9 · blocked-by: T05 (neuer `SoundEvent`-Wert) · Spec: Teil P2 «Auslöser»

## Dateien

- ändern: `src/ui/soundEvents.ts`, `tests/ui/soundEvents.test.ts`
- `src/ui/app.ts` **nur** nach Befund aus Punkt 3, eigener Commit
- nicht ändern: `src/sim/`, `src/audio/`

## Verhalten

1. `SoundSnapshot.ships: Record<number, number>` (Schiffs-id → `port`), gefüllt in `soundSnapshot(world)`, nur lesend.
2. `diffSoundEvents(prev, next)`: `shipDock` **höchstens einmal je Frame**, wenn mindestens eine id in beiden Snapshots vorkommt und ihr `port` sich geändert hat. Neue ids (Kauf) und fehlende (Verkauf) lösen nichts aus; Heimkehr ohne Route (`port` → 0) zählt als Wechsel.
3. **Prüfauftrag AK-K9:** `rg -n "prevSnap" src/ui/app.ts` und alle Ladepfade (`startGame`, `restart`, `launch`, `loadSlotPaused`) lesen: wird `prevSnap` nach Laden/Neustart immer neu aus `soundSnapshot(world)` gebildet? Erwartung: ja (`launch` ≈ Z. 1583), dann **kein** `app.ts`-Diff. Befund im Bericht mit Zeilennummern. Test: Snapshot einer geladenen Welt gegen sich selbst liefert keine Ereignisse (Priming). Gibt es einen Pfad, der `prevSnap` nicht neu bildet: genau eine Zeile in `app.ts`, eigener Commit, Test dazu.

## Testfälle (rot zuerst)

- **K1** gleiche id, anderer `port` → genau einmal `shipDock`; zwei Schiffe im selben Frame → einmal. **K2** gleicher `port`; neue id; fehlende id; `to` ändert sich ohne `port` → keiner. **K3** echter Ablauf: Welt mit Route, `tickShips` (aus `src/sim/ships.ts`, nur im Test) bis zur Ankunft: Vergleich vor/nach dem ankommenden Tick liefert `shipDock`, Ablegen im selben Tick ändert nichts; Heimkehr ohne Route ebenfalls. **K4** `soundSnapshot` verändert die Welt nicht (`serialize` gleich); ESLint-Importregel grün; `git diff main -- src/sim` leer. **K9** siehe Punkt 3.

## Prüfschritte / Task-Review

Gezielte Tests (Exit 0), `tsc`, eslint/prettier. Danach Final-Review `qa-code-reviewer` **opus** über den Strang-B-Branch.
