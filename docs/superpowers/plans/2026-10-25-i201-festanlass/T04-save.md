# T04 Save `feastKind` und Determinismus

Persona `tech-sim-engineer` · Strang A · Tools ≈ 35 · AK-FE13, FE14, Review Focus 1 · blocked-by T03.

**Files:** Modify `src/sim/save.ts` (nur `isValidFeast`; Datei 41 KB, nur abschnittsweise lesen: `rg -n "isValidFeast" src/sim/save.ts`), `tests/sim/feastKinds.test.ts`.

**Interfaces:**

- Consumes (T01): `isFeastKind(k: unknown): k is FeastKind` aus `./feastEffect`; (T02/T03) `holdFeast`, `cycleOf`, `sellPrice`; `serialize`, `deserialize` aus `./save`; `step` aus `./tick`.
- Produces: `isValidFeast(b, tick)` erweitert; keine neue Funktion, **keine `SAVE_VERSION`, keine Migration** (R-B).

```ts
// isValidFeast: bestehende feastAt-Prüfung bleibt; zusätzlich
if (b.feastKind !== undefined)
  return b.feastAt !== undefined && b.defId === 'chapel' && isFeastKind(b.feastKind) && <bestehende feastAt-Prüfung>;
```

Ausdrückliches `feastKind: 'ascension'` ist gültig; `deserialize` übernimmt es unverändert (kein Normalisieren), alle Abfragen lesen über `feastKindOf`.

## Schritte

- [ ] **Tests zuerst** in `tests/sim/feastKinds.test.ts`. Rohstand: `const raw = JSON.parse(serialize(w))`, Gebäude ändern, `deserialize(JSON.stringify(raw))` (Muster `tests/sim/feast.test.ts`, «AK-I007-10 Save-Prüfung»).
  - **AK-FE13:** Rundlauf mit laufendem `harvest` bzw. `market` erhält `feastAt` und `feastKind`. Alter Stand (`feastAt` gesetzt, `feastKind` fehlt) lädt `ok`, `feastActive` für ein Haus im Radius wahr, `cycleOf` eines Betriebs im Radius ungekürzt. Abgewiesen, je `{ ok: false }` mit dem bestehenden Hinweis für ungültige Stände und ohne Wurf (`expect(() => deserialize(…)).not.toThrow()`): `feastKind: 'harvest'` ohne `feastAt`; `feastKind: 'harvest'` an einem Haus mit `feastAt`; `feastKind: 'harbor'`; `feastKind: 5`.
  - **Review Focus 1:** Stand mit ausdrücklichem `feastKind: 'ascension'` lädt `ok`; `feastActive` wahr; an einer zweiten Kapelle derselben Insel ist `harvest` nicht inselgesperrt; `cycleOf` ungekürzt.
  - **AK-FE14:** je Art `kind` ∈ `FEAST_KIND_IDS` (`it.each`): Szene `scene(kind)` = `createWorld(3, { unlockAll: true, crisisLevel: 'off' })`, Haus, Kapelle, zwei Werkstätten mit Eingängen im Radius, Lager aufgefüllt; `holdFeast(w, chapel.id, kind)` ok.
    - Zweimal `scene(kind)` + 1800 × `step` → gleiches `serialize`.
    - Lauf L1: Fest, 1200 × `step`. Lauf L2: Fest, 300 × `step`, `deserialize(serialize(w))`, 900 × `step`. `serialize(L1) === serialize(L2)`.
    - Direkt nach dem Laden in L2 (vor dem ersten weiteren `step`): bei `harvest` `cycleOf` der Werkstatt = 15; bei `market` `sellPrice(w2, 'rum', 1, HOME) === ref(…, 125)` (Referenz aus T03).
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/feastKinds.test.ts; echo EXIT=$?` → Exit ≠ 0 (Ablehnungen und ggf. Rundlauf rot). Sind einzelne FE14-Fälle sofort grün, als Charakterisierung im Ledger benennen.
- [ ] **Umsetzen** in `isValidFeast`.
- [ ] **Grün:** `npx vitest run tests/sim/feastKinds.test.ts tests/sim/feast.test.ts; echo EXIT=$?` → 0; `npx vitest related --run src/sim/save.ts; echo EXIT=$?` → 0.
- [ ] **P-9 Lauf-Beleg:** `git diff --quiet -G SAVE_VERSION $(git merge-base main HEAD) -- src/sim/save.ts; echo EXIT=$?` → Exit 0 (keine Änderung an `SAVE_VERSION`).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `git add src/sim/save.ts tests/sim/feastKinds.test.ts` · `feat: feastKind im Spielstand ohne Save-Sprung (I-201 T04)`.
