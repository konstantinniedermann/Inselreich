# T01 · P1 Autosave-Plätze in `storage.ts` (I-147)

Umsetzer `tech-ui-engineer` · ≈ 45 Tools · AK H1 bis H3, H5, H6, H8, H10 · blocked-by: UI-G gemergt (`git merge main` vor Start) · Spec: Teil P1 (Regeln 1 bis 4, 8, 10)

## Dateien

- ändern: `src/ui/storage.ts`, `tests/ui/storage.test.ts`
- nicht ändern: `src/sim/` (`serialize`, `SAVE_VERSION`), `menu.ts`/`startCard.ts`/`app.ts` (T02)

## Verhalten

1. `AUTO2_KEY = 'inselreich.save.auto2'`, `AUTO_LAST_KEY = 'inselreich.save.auto.last'`; `Slot = 'manual' | 'auto' | 'auto2'`; `SLOT_KEYS` und `SLOTS` um `auto2` ergänzen (damit `listSavesFrom`, `storageProblem`, `loadSlot` ihn mitnehmen, AK-H8).
2. Reine Helfer über `StorageLike` (exportiert): `newestAuto(storage): 'auto' | 'auto2' | null` (Zeiger, sonst grössere Spielzeit, Gleichstand `auto`, kein gültiger Platz `null`) und `otherAuto(storage): 'auto' | 'auto2'` (Platz ausser Zeiger; ohne gültigen Zeiger: fehlender/beschädigter Platz, sonst kleinere Spielzeit, Gleichstand `auto2`). «Gültig» heisst: Eintrag lesbar wie in `listSavesFrom`; die Spielzeit kommt aus dem schon vorhandenen Lesepfad (Tick), nicht neu parsen, wenn `listSavesFrom` sie liefert.
3. `saveAuto(world)` (periodisch): Ziel = `otherAuto`, schreibt über `write(key, world, 'Autosave fehlgeschlagen')`; **nur bei Erfolg** Zeiger auf das Ziel setzen (Zeiger-`setItem` in eigenem `try`, Fehler stumm). Bei Fehler: anderer Platz und Zeiger unberührt (AK-H6), nie `removeItem` auf einen Autosave-Platz.
4. Neu `saveAutoNewest(world)`: Ziel = `newestAuto ?? 'auto'`, Zeiger unverändert. `autosaveOnHide(world, write = saveAutoNewest)`; Tick ≤ 0 schreibt nichts; Wurf bleibt folgenlos (wie heute).
5. Format: `serialize` unverändert (AK-H10): Test schreibt dieselbe Welt in beide Plätze und vergleicht die Strings gegen `serialize(world)` bzw. den bisherigen `AUTO_KEY`-Inhalt.

## Testfälle (rot zuerst; Fake-`StorageLike`, Welt-Tick über vorhandene Testwelt, Zeiten nie als Literal-Annahme)

- **H1** Zeiger `auto` → `saveAuto` schreibt `auto2`, Zeiger `auto2`; drei Aufrufe: `auto2, auto, auto2`.
- **H2** Nur `auto` vorhanden → `auto2`; `auto` Tick 500, `auto2` Tick 300 ohne Zeiger → `auto2`; Gleichstand → `auto2`; beschädigter Platz zuerst.
- **H3** `newestAuto` folgt dem Zeiger; ohne Zeiger grösserer Tick; ein Platz: `otherAuto` ist der leere, kein «Davor».
- **H5** `autosaveOnHide`: neuester Platz, Zeiger gleich, anderer Platz bitgleich; Tick 0 nichts; ohne Autosave `auto`; `write` wirft → kein Wurf.
- **H6** `setItem` wirft für das Ziel: `{ ok: false, reason: 'Autosave fehlgeschlagen' }`, anderer Platz und Zeiger bitgleich; wirft nur der Zeiger-Schlüssel: `ok`, Stand gültig.
- **H8** `storageProblem`/`listSavesFrom`: kaputter `auto2` → `damaged`, neuerer `auto2` → `newer`, `getItem` wirft → `unavailable`.
- **H10** siehe Verhalten 5; Abschluss: Sim-Diff leer.

## Prüfschritte / Task-Review

Gezielte Tests (Exit 0), `tsc`, eslint/prettier. Reviewer: kein `removeItem` auf Autosave-Plätze; Zeiger nur nach erfolgreichem Schreiben; `SAVE_VERSION`/`serialize` ohne Diff; bestehende Tests nur ergänzt, nie aufgeweicht.
