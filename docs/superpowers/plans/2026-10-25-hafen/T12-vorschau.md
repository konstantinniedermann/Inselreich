# T12 · Fahrzeit-Vorschau Kontor II (S7, R31)

Umsetzer `tech-ui-engineer` · ≈ 40 Tools · AK-HF-47, -48, -49 · blocked-by: L2 auf main · Worktree `.worktrees/hafen-vorschau` (`feat/hafen-vorschau` ab `feat/hafen-dwell`,
Strang ui, parallel zu T10/T11) · Spec §3.7 · Index P-12

## Dateien

- neu: `src/ui/kontorPreview.ts` (DOM-frei), `tests/ui/kontorPreview.test.ts`
- ändern: `src/ui/hints.ts` (**nur** der `kontor2`-Zweig in `placementHint`)
- nicht ändern: `src/sim/` (nur lesen: `dockFor`, `laneTicksOf`, `canPlace`), `src/ui/app.ts`

## Interfaces

```ts
export interface KontorPreview {
  ticks: number;
  siteTicks: number;
}
/** Fahrzeit Heimat ↔ Insel, wenn Kontor II bei (x, y) stünde, und am vorgesehenen Platz (kontorSite); null, wenn der Platz ungültig ist. */
export function kontorPreview(
  world: World,
  island: number,
  x: number,
  y: number,
): KontorPreview | null;
/** Testhook: zählt Routenrechnungen (AK-HF-49). */
export function createKontorPreview(onRoute?: () => void): typeof kontorPreview;
export function kontorPreviewText(p: KontorPreview): string; // «Fahrzeit zur Heimat m:ss (vorgesehener Platz m:ss)»
```

## Verhalten

- Anker am Platz: `dockFor(terrain, w, h, { x, y })`; Welt-Kopie nur der Inselliste: `islands' = world.islands.map((s, k) => k === island ? { ...s, anchor } : s)`;
  `ticks = laneTicksOf({ islands: islands', council: world.council }, HOME, island)`. `siteTicks` analog mit dem Anker von `kontorSite` (Generator-Anker, AK-HF-14).
- **Cache (P-12):** `WeakMap<readonly Island[], Map<string, number>>` mit Schlüssel = Insel + **Ziel-Anker** `x,y` (viele Plätze teilen einen Anker), dazu Seerecht-Wert.
  Ein neues `world.islands` (Bau, P-2) leert ihn von selbst.
- `placementHint`, Werkzeug `kontor2`, Platz gültig: `Baubar · Kosten aus der Heimat · ${kontorPreviewText(p)}`; ungültig: Grund aus `canPlace` wie heute («Kontor braucht
  Zugang zum Meer» aus T01). Zeitformat `formatGameTime` (wie Inselkarte).

## Steps

- [ ] **Tests rot** `tests/ui/kontorPreview.test.ts`:
  - AK-HF-47: Seed 1, Insel B, 5 gültige Plätze (erste 5 in Zeilenfolge, die `canPlace` erfüllen): `ticks` = `laneTicksOf` nach echtem `placeBuilding` an diesem Platz
    (Kopie der Welt, Geld im Test gesetzt); `siteTicks` = Fahrzeit nach Bau am `kontorSite`.
  - AK-HF-48: Binnenplatz Seed 1 Insel A (Suche wie T01) → `kontorPreview` `null`; `placementHint` Ton `bad`, Text «Kontor braucht Zugang zum Meer», keine «Fahrzeit».
  - AK-HF-49: zweite Abfrage derselben Kachel → Zähler unverändert; zwei Kacheln mit gleichem Anker → eine Rechnung.
  - Text: `kontorPreviewText({ ticks: 2420, siteTicks: 2330 })` enthält beide Zeiten in `formatGameTime`-Form und die Wörter «Fahrzeit zur Heimat», «vorgesehener Platz».
- [ ] **Lauf rot → Umsetzen → Lauf grün** `tests/ui/kontorPreview.test.ts tests/ui/hints.test.ts`.
- [ ] Teilbeleg laut Index.
- [ ] **Commit:** `feat: Bauvorschau Kontor II zeigt die Fahrzeit (HAFEN S7, AK-HF-47..49)`.

## Bericht

Exit-Codes; Rot-Ausgabe; Rechenzeit einer ungecachten Vorschau (ms, Last).
