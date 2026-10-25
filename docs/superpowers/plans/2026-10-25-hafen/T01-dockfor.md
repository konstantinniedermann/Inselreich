# T01 · `dockFor` und Meerufer-Regel (S1, R1, R2)

Umsetzer `tech-sim-engineer` · ≈ 40 Tools · AK-HF-01, -02, -03 · blocked-by: Gate Plan · Worktree `.worktrees/hafen-s1` (`feat/hafen-s1` ab main) · Spec §3.1, §4

## Dateien

- ändern: `src/sim/islands.ts` (neu `dockFor`), `src/sim/types.ts` (`SiteRule` um `{ kind: 'seaCoast' }`), `src/sim/placement.ts` (Fall `seaCoast`),
  `src/sim/defs/buildings.ts` (**nur** `kontor2.site`), `src/ui/buildMenu.ts` (**nur** `siteText` Fall `seaCoast`)
- Tests: `tests/sim/dock.test.ts` (neu), `tests/sim/placement.test.ts` (ergänzen)
- nicht ändern: `homeAnchor`, `coast` der übrigen Gebäude, `src/render/errands.ts` (kennt `seaCoast` nicht; Kontor II hat keine Sammelziele), Generator

## Interfaces

```ts
// src/sim/islands.ts
/** Anlegestelle am 2×2-Kontor bei `kontor`: Meerkachel im 8er-Ring (12 Kacheln), kleinster quadr. Abstand zu (x+1, y+1); Gleichstand y, dann x; sonst homeAnchor. */
export function dockFor(terrain: Terrain[], w: number, h: number, kontor: Pt): Pt;
// src/sim/types.ts
export type SiteRule = BisherigeRegeln | { kind: 'seaCoast' }; // ≥1 Kantennachbar in seaMask (Meer, nicht Binnensee)
```

`BUILDING_DEFS.kontor2.site` = `[{ kind: 'seaCoast' }, { kind: 'foreignNoKontor' }]`. Grund bei Fehlschlag wörtlich **«Kontor braucht Zugang zum Meer»** (Konstante in
`placement.ts`, kein Spielwert). `siteText` für `seaCoast`: «Meerufer (Meer angrenzend)».

## Verhalten

- Ring: alle `(x, y)` mit `kontor.x − 1 ≤ x ≤ kontor.x + 2`, `kontor.y − 1 ≤ y ≤ kontor.y + 2`, ausserhalb des Fussabdrucks, innerhalb `w × h`, `seaMask[y·w + x]`.
  Iteration y aussen, x innen, strikt `<` → Gleichstand ergibt kleineres y, dann kleineres x (wie `homeAnchor`). Kein Treffer → `homeAnchor(terrain, w, h, kontor)`.
- `seaCoast`: `adjacentOf(isl, x, y, def.w, def.h)` ∩ `seaMask(isl.tiles.map(t => t.terrain), isl.width, isl.height)` ≥ 1. `seaMask` je Aufruf rechnen (≤ 36 × 36,
  kein Cache, KISS); Gelände ändert sich im Spiel nicht.
- Erfüllt ein Platz `seaCoast`, ist der Ring nicht leer (Kantennachbarn ⊂ Ring) → `dockFor` fällt dort nie auf `homeAnchor` zurück (Test).

## Steps

- [ ] **Tests rot** in `tests/sim/dock.test.ts`, `describe('HAFEN S1 dockFor')`:
  - AK-HF-01: synthetisches Terrain 8 × 8 (Rand Wasser, Land innen, ein Binnensee-Feld im Ring), Kontor (3, 3): Ergebnis = nächste Meer-Ringkachel; Variante mit zwei
    gleich nahen Ringkacheln → kleineres y, dann x; Binnenwasser nie.
  - AK-HF-02: Terrain ohne Meer im Ring → `toEqual(homeAnchor(...))`.
  - Wächter: für Seeds 1, 2, 3, 37, jede Fremdinsel, jeden `seaCoast`-gültigen 2×2-Platz liegt `dockFor` im Ring (kein Rückfall).
- [ ] **Tests rot** in `tests/sim/placement.test.ts`, `describe('AK-HF-03 Meerufer')`: Seed 1 Insel A, ein Platz nur an Binnenwasser (per Suche im Test über alle
      Plätze: `coast` ok, `seaCoast` nicht; Spec Anhang 01 E: 12 solche Plätze) → `canPlace(w, 'kontor2', …)` und `placeBuilding` `{ ok: false, reason: 'Kontor braucht Zugang zum Meer' }`;
      ein Meerplatz derselben Insel `ok`. Rot-Beleg: heute ist der Binnenplatz `ok`.
- [ ] **Lauf rot:** `npx vitest run tests/sim/dock.test.ts tests/sim/placement.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Interfaces/Verhalten. `types.ts`-Kommentar am Union-Fall.
- [ ] **Lauf grün:** dieselben Dateien, dazu `tests/sim/kontor2.test.ts tests/ui/buildMenu.test.ts tests/sim/defs.test.ts` und die Kandidatenliste (T00);
      neue Rotstellen per Testname melden (erwartet: keine — `kontorSite` liegt laut Generator immer am Meer; sonst ist das ein Befund an den Controller, kein stilles Umbauen).
- [ ] Teilbeleg laut Index (tsc, lint, zeittests, conflicts, `balance*`).
- [ ] **Commit:** `feat: dockFor und Meerufer-Regel für Kontor II (HAFEN S1, AK-HF-01..03)`.

## Bericht

Exit-Codes; Rot-Ausgabe; Anzahl Binnenplätze Seed 1 Insel A (erwartet 12); ob `kontorSite` je Insel `seaCoast` erfüllt (Seeds 1–40, Zahl).
