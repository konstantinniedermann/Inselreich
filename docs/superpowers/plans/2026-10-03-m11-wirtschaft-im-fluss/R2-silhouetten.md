> **Task-ID:** R2 (Paket M11-R2) — ein Teil
> **AK-IDs:** AK-RND-01, AK-RND-02 (Vitest); AK-RND-05 (Browser, Urteil lead-art mit lead-qa im QA-ART)
> **blocked-by:** T09 (Review OK), R1 (Review OK), **H-R7 (Varianz) auf `main` gemergt** (H-R6 ist es seit `4a5130e`) (orga-08); vorher in
> `feat/m11-render` `feat/m11-sim` @ T09 und `main` mergen (`git merge --no-edit`, orga-09 W6)
> **Strang:** `feat/m11-render` · `.worktrees/m11-render` · Implementierer `art-rendering-engineer` (sonnet), Controller lead-art
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-07](orga-07-datei-ownership.md) · [orga-08](orga-08-abhaengigkeiten-extern.md)

## R2: Silhouetten Jagdhütte und Rinderfarm, Stufen-Aufsatz `drawLevelTopper`

**Ziel:** Jagdhütte und Rinderfarm bekommen eigene Körper (ADR-006, Spec 8); jeder Betrieb mit `LEVELS`-Eintrag zeigt
Stufe 2 und 3 über einen gemeinsamen Aufsatz, der nur `b.level` liest und nie in die Welt schreibt.

- [ ] **Schritt 0: Code-Fakten nach H-R7 neu prüfen (H-R6: `src/render/spriteCache.ts`)** (Ergebnis in den Bericht): `git log --oneline main -3 --
src/render/sprites.ts`; `grep -rn -i "cache" src/render/sprites.ts src/render/*.ts | head`. Festhalten: Wo liegt der
      Cache, wie heisst die Schlüsselfunktion bzw. woraus wird der Schlüssel gebildet, ruft der Cache weiter
      `drawBody`/`SILHOUETTES` auf? **Pflichtpunkt:** Der Schlüssel enthält `b.level ?? 1` (Programm-Spec
      `2026-10-02-programm-nutzerfeedback.md:221`: „Sprite-Cache je Typ, Stufe, Variante, Zoom und DPR" — „Stufe" meint
      dort die Hausstufe; für Betriebe ist es `level`). Der Schlüssel enthält Variante, Material (H-R7: `variants.ts`, `material.ts`) **und** `level`; fehlt `level`, ergänzen und testen (Schritt 1 c). `git log --oneline main -5 -- src/render/variants.ts src/render/material.ts` belegt den H-R7-Merge.
      Ist H-R7 ausgefallen (orga-09), läuft R2 auf der Ist-`sprites.ts`; 1 c entfällt.

**Code-Fakten (Stand `4a5130e`, vor H-R7; nach Schritt 0 Zeilen nachführen):**

- `src/render/sprites.ts:53` `SilhouetteFn = (p: IsoPainter, b: Building) => void`; `:1453–1471` `SILHOUETTES`
  (`Partial<Record<BuildingDefId, …>>`; T04 hat dort ggf. Platzhalter für `hunter`/`cattlefarm` eingetragen — ersetzen);
  `:1705–1718` `drawBody` (`IsoPainter`, `p.height = bodyHeight(def, b)`, dann Silhouette); `:1727` `bodyPolygons`
  (Picking zeichnet `drawBody` nach: nur Pfade, keine Verläufe, keine Clips); `:1523` `WINDOWS`, `:1626` `fallbackWindows`;
  `:813–834` `fisherBody` als Muster (Hof, `shellAt`, `drawShell`, `pole`, `leftPlane`, `cuboid`).
- `src/render/iso.ts:61–80` `BODY_HEIGHTS` (Partial), `:9` `H_MAX = 2 · ISO_H`, `:95` `bodyHull`.
- Bestehende Schleifentests über alle `BUILDING_DEFS` laufen für die neuen Typen mit (`tests/render/sprites.test.ts`):
  AK-ISO-10 (Hülle, Hülle oben dicht: höchster Punkt = `bodyHeight`), ISO 7.1 (Grundriss ≥ 64 %, Wand links ≥ 1,1 ×
  rechts), AK-R1-09 (Hof ≥ 80 %), RF-6b (keine `AIR_COLORS`), AK-R2-03 (eigene Silhouette; Fensteranker = gezeichnete
  Fenster, beide Richtungen).

**Erwartete Dateien:** `src/render/sprites.ts`, `src/render/iso.ts` (`BODY_HEIGHTS`), Cache-Modul (H-R6/H-R7) (nur der
Schlüssel, falls Schritt 0 es verlangt), `tests/render/sprites.test.ts`, `docs/CREDITS.md` nur falls fremde Vorlage (nicht vorgesehen: eigene Formen). Doku-Zeilen (arc42 §5 `sprites.ts`, README „Karte lesen") trägt D1 nach.
**Nicht anfassen:** `src/sim/**`, `src/ui/**`, `src/render/renderer.ts`, `src/render/ring.ts`, `src/render/statusMarks.ts`.

- [ ] **Schritt 1: Tests schreiben** in `tests/render/sprites.test.ts` (Helfer `mk`, `CAM`, `inHull`, `fakeCtx` sind da;
      Importe `LEVELS` aus `../../src/sim/defs/levels`, `BODY_HEIGHTS` aus `../../src/render/iso`, `type FakeCtx`, `serialize`, `createWorld`):

```ts
describe('M11 Silhouetten und Stufen-Aufsatz (Spec 8)', () => {
  const draw = (id: BuildingDefId, extra: Partial<Building> = {}) => {
    const { ctx, log } = fakeCtx();
    drawBody(ctx, CAM, BUILDING_DEFS[id], mk(id, 10, 10, extra), 0);
    return log;
  };
  it('AK-RND-01 hunter, cattlefarm: eigene Höhe, in bodyHull (± 0,5 px), ≤ H_MAX, Pfad ≠ Fischer bzw. Schäferei', () => {
    for (const [id, other] of [
      ['hunter', 'fisher'],
      ['cattlefarm', 'sheepfarm'],
    ] as const) {
      expect(BODY_HEIGHTS[id], id).toBeDefined();
      const log = draw(id);
      const hull = bodyHull(BUILDING_DEFS[id], mk(id));
      for (const p of log.allPoints) expect(inHull(hull, p.x, p.y, 0.5), id).toBe(true);
      expect(bodyHeight(BUILDING_DEFS[id], mk(id))).toBeLessThanOrEqual(H_MAX);
      expect(JSON.stringify(log.events)).not.toBe(JSON.stringify(draw(other).events));
    }
  });
  it('AK-RND-02 je LEVELS-Typ: Stufe 1, 2, 3 verschieden, alles in bodyHull, keine Fensterfarben im Aufsatz; Welt unverändert', () => {
    const glass = new Set([
      mixHex(PALETTE.roofSlate, '#000000', 0.4),
      mixHex(PALETTE.window, '#000000', 0.5),
    ]);
    const glassFills = (l: FakeCtx) =>
      l.events.filter((e) => e.op === 'fill' && glass.has(e.style)).length;
    const ids = Object.keys(LEVELS) as BuildingDefId[];
    expect(ids).toHaveLength(11);
    for (const id of ids) {
      const logs = ([undefined, 2, 3] as const).map((level) => draw(id, level ? { level } : {}));
      expect(new Set(logs.map((l) => JSON.stringify(l.events))).size, id).toBe(3);
      for (const [i, l] of logs.entries()) {
        const hull = bodyHull(
          BUILDING_DEFS[id],
          mk(id, 10, 10, i ? { level: (i + 1) as 2 | 3 } : {}),
        );
        for (const p of l.allPoints)
          expect(inHull(hull, p.x, p.y, 0.5), `${id} ${i + 1}`).toBe(true);
        expect(glassFills(l), `${id} ${i + 1}`).toBe(glassFills(logs[0]!));
      }
    }
    const w = createWorld(3, { unlockAll: true });
    const b = mk('fisher', 10, 10, { id: w.nextBuildingId++, level: 3 });
    w.buildings[b.id] = b;
    const before = serialize(w);
    drawBody(fakeCtx().ctx, CAM, BUILDING_DEFS.fisher, b, 0);
    expect(serialize(w)).toBe(before);
  });
});
```

(c) **Nur mit H-R6:** ein Test im Cache-Testfile von H-R6: gleicher Typ, gleiche Lage, `level` 1/2/3 → drei
verschiedene Schlüssel bzw. drei Einträge (Schlüsselfunktion oder Eintragszähler, wie H-R6 sie anbietet). Name
„AK-RND-02 Cache-Schlüssel enthält level".

- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/render/sprites.test.ts` (und das Cache-Testfile).
- [ ] **Schritt 3: Umsetzung.**
  - `iso.ts` `BODY_HEIGHTS`: `hunter: () => 1.0 * ISO_H`, `cattlefarm: () => 1.1 * ISO_H` (Kommentar wie die anderen).
  - `sprites.ts` `hunterBody` (1 × 1): Hof `earth`/`grass`; Blockhütte (`shellAt` Satteldach, `woodWall`, `roofTimber`);
    Fellgestell vorn links (zwei `pole`, dazwischen gespanntes Fell als `leftPlane` in Erdton, anders als das
    Fischernetz); Holzstapel (`cuboid`, `roofWood`). Ein Fenster rechts mit Eintrag `WINDOWS.hunter`.
  - `cattlefarmBody` (2 × 2): Weide-Hof `grass`; langer, niedriger Stall entlang `u` (`roofWood`, Wand `wallLime`),
    Gatter aus `pole` und zwei Latten-`line` um die vordere Koppel; Fenster mit Eintrag `WINDOWS.cattlefarm`.
    Beide Silhouetten erreichen mit dem Firstpunkt genau `bodyHeight` (Test „Hülle oben dicht").
  - `export function drawLevelTopper(p: IsoPainter, def: BuildingDef, b: Building): void` (gemeinsam für alle
    Typen; liest nur `b.level`): Stufe 2 → Anbau vorn links (`cuboid` `[I, def.h − I − 0.3, I + 0.3, def.h − I]`, Höhe
    `0.35 · ISO_H`, `wallColors(PALETTE.wallStone)`, Dach `roofTerracotta`); Stufe 3 → zusätzlich Steinsockel (Band
    `wallStone` auf beiden Aussenwänden, z 0 … `0.12 · ISO_H`) und Fahne (`pole` an der hinteren rechten Ecke bis
    `0.95 · p.height`, Wimpel `roofTerracotta`, nach innen). Keine Signal- und keine Fensterfarben, keine Verläufe.
  - `drawBody`: nach der Silhouette `if (b.level !== undefined && LEVELS[def.id]) drawLevelTopper(p, def, b);` — damit
    erfassen Cache (H-R6) und `bodyPolygons` den Aufsatz ohne Sonderweg. `SILHOUETTES.hunter`/`.cattlefarm` eintragen.
- [ ] **Schritt 4: Grün.** `npx vitest run tests/render` · `npx tsc --noEmit` · `make check` · Testzählbefehl
      (`sprites.test.ts` +2, Cache-Test +1).
- [ ] **Schritt 5: Doku.** Doku gehört D1 (Ownership, parallel laufender Strang, R190): dieser Task ändert weder `docs/arc42.md` noch `README.md`; die Zeilen für D1 stehen im Bericht. Für D1: §5 Zeile `sprites.ts`: Jagdhütte, Rinderfarm, `drawLevelTopper` (Stufe 2 Anbau, Stufe 3 Sockel und Fahne), Cache-Schlüssel mit `level`; README „Karte lesen": ausgebaute Betriebe tragen einen Anbau (Stufe 2) bzw. Anbau, Steinsockel und Fahne (Stufe 3).
- [ ] **Schritt 6: Commit und Push.**

```bash
git add src/render tests/render
git commit -m "feat: M11-R2 Silhouetten Jagdhütte und Rinderfarm, Stufen-Aufsatz (Spec 8)"
git -C .worktrees/m11-render push -u origin feat/m11-render
```

### Rot-Beleg

| AK                        | Erwartete Meldung vor der Umsetzung                                           |
| ------------------------- | ----------------------------------------------------------------------------- |
| AK-RND-01                 | `hunter: expected undefined not to be undefined` (`BODY_HEIGHTS.hunter`)      |
| AK-RND-02                 | `fisher: expected 1 to be 3` (Stufen zeichnen gleich)                         |
| AK-RND-02 Cache-Schlüssel | gleiche Schlüssel für `level` 1/2/3 (nur falls H-R6 `level` noch nicht kennt) |

### QA-ART (lead-art mit lead-qa, nach R2 und B1)

Szenen `m11-wald`, `m11-ausbau`, `m11-fluss`, 1280 × 800 und 1920 × 1080: Ring läuft; Jagdhütte, Rinderfarm,
Stufen 1/2/3 im Blindtest unterscheidbar (Screenshots `.studio/qa/M11-QA-ART/`).

### Geänderte bestehende Tests

`tests/render/sprites.test.ts` :: AK-R2-03 „jede heutige BuildingDefId hat eine eigene Silhouette" (`:478`): den von T04
gesetzten Filter ohne `hunter`/`cattlefarm` samt Kommentar entfernen (Stand vor T04 wiederhergestellt).

### Risiken/Randfälle

- Fehlt `level` im Cache-Schlüssel, zeigt ein Ausbau bis zum Cache-Verfall das alte Bild (Pflichtpunkt Schritt 0).
- Der Aufsatz liegt im Hof vorn links; bei 1 × 1 kann er die Tür verdecken (Blindtest).
