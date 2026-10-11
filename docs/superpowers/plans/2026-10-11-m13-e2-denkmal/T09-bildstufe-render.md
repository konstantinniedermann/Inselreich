# T09 · Bildstufe in der Render-Geometrie, Einhängen, Cache, Effekt (TDD)

Strang art · Worktree `.worktrees/m13-e2-art` · Umsetzer `art-rendering-engineer` (sonnet) · Controller `lead-art` ·
AK-M13E2-36, -37, -38, -39 (Spec §7.3 U-12, §7.4 U-13, §8; Anhang 06 A–C) · blocked-by T08 und Sim-Hash T02 (Schritt 0) · Grösse M (≈ 45 Tools) · Auflage A2, qa B7

**Files:**

- Modify: `src/render/iso.ts` (`bodyHeight`, `bodyHull`, `spriteBounds`, `BODY_HEIGHTS`, Shape-Provider,
  `buildingHulls`, `sortedObjects`), `src/render/sprites.ts` (`SilhouetteFn` mit `stage`, `SILHOUETTES.monument` statt
  Platzhalter, `drawBody`, `drawGhost`), `src/render/spriteCache.ts` (`spriteKey`, Schlüsselaudit im Kopf),
  `src/render/renderer.ts` (`RenderFx.monumentFlareStart?: number`, Aufruf `drawMonumentFlare`), `src/render/ring.ts`,
  `src/render/overlays.ts`, `src/render/statusMarks.ts` (nur Durchreichen der Stufe), neu `src/render/monumentStage.ts`
- Tests: `tests/render/monumentSprite.test.ts`, `picking.test.ts`, `iso.test.ts`, `spriteCache.test.ts`,
  `renderer.test.ts`, `sprites-referenz.test.ts` (nur Hash `monument`), weitere nur **ergänzen**
- Lesen: Anhang 06 A–C; `grep -rn "bodyHeight(\|bodyHull(\|spriteKey(\|spriteBounds(" src` (≈ 46 Stellen).

## Schnittstelle

```ts
// src/render/monumentStage.ts (rein)
export function monumentImageStage(m: Pick<Monument, 'stage' | 'running'>): MonumentImageStage; // Anhang 06 A
/** Bildstufe eines Gebäudes: 0 für alles ausser dem Denkmal; Denkmal aus world.monument (null → 0). */
export function imageStageOf(world: World, b: Building): MonumentImageStage;

// iso.ts / sprites.ts / spriteCache.ts: jeweils letzter, optionaler Parameter `stage = 0`
bodyHeight(def, b, stage = 0); bodyHull(def, b, stage = 0); spriteBounds(def, b, stage = 0);
spriteKey(…, stage = 0); drawBody(…, stage = 0); drawBodyCached(…, stage = 0); type SilhouetteFn = (p, b, stage?) => void;
```

- `monumentImageStage`: (0, nein) → 0; (0, ja) → 1; (1, ·) → 2; (2, ·) → 3; (3, nein) → 4. Keine Anteils-Schwellen.
- **Jede Aufrufstelle mit Weltzugriff** reicht `imageStageOf(world, b)` durch (A2); Stellen ohne Welt bleiben bei 0
  und bekommen einen Kommentar, warum. Liste der Stellen mit Entscheid in den Bericht.
- `BODY_HEIGHTS.monument = (b, stage) => MONUMENT_HEIGHTS[stage] × ISO_H`; für alle übrigen Ids ist das Ergebnis mit
  und ohne `stage` gleich (qa B7d).
- `spriteKey` enthält die Bildstufe als Feld; fehlt = 0; Schlüssel aller übrigen Gebäude unverändert. Kopfkommentar
  «Schlüsselaudit» nennt die Bildstufe.
- `drawGhost('monument')` zeichnet Stufe 4 (Ziel).
- `RenderFx.monumentFlareStart` (ms, `performance.now()`-Basis der UI) → `drawMonumentFlare` über der Feuerschale,
  nur wenn das Denkmal sichtbar ist (Culling wie Gebäude) und `elapsed < 3000`; bei `reduceMotion` nichts. Render
  schreibt nie in die Welt.

## Schritte

- [ ] **Schritt 0: Sim-Stand holen.** `git merge --no-ff <Hash T02 OK aus Sim-Ledger>`; `npx tsc --noEmit; echo
EXIT=$?` (Platzhalter aus T01 sind jetzt da). Danach Aufrufstellen-Liste erstellen.
- [ ] **Schritt 1: Test zuerst (rot):**
  - **AK-36** (`monumentSprite.test.ts` ergänzen): `monumentImageStage` für alle **sieben** Paare (Anhang 06 A);
    Höhenmass jetzt über `drawBody(…, stage)` mit echter Def `BUILDING_DEFS.monument`; alle Punkte in
    `bodyHull(def, b, s)` (Toleranz 0,5 px); `bodyHeight(def, b, s)` streng steigend; `bodyHeight(monument, b, 4)` >
    `bodyHeight(townhall, …)` = 2,0 · `ISO_H`; `drawGhost` zeichnet dieselbe Aufzeichnung wie Stufe 4.
  - **AK-37** (`picking.test.ts`): jede der neun Kacheln und die Spitze der Stufe 4 liefern die Id; ein Punkt knapp
    neben der Hülle nicht; die Hülle wächst mit der Bildstufe (Stufe 1 trifft die Höhe der Stufe 4 nicht).
  - **AK-38** (`iso.test.ts`): Haus davor (grössere `x + y`) und Baum dahinter → Denkmal dazwischen in
    `sortedObjects`; Nachbar an der unteren Ecke richtig sortiert.
  - **AK-39** (`spriteCache.test.ts`, `renderer.test.ts`): `spriteKey` ändert sich mit der Bildstufe, fehlende Stufe =
    0; Audit-Kommentar nennt sie (Quelltext-Prüfung wie bestehende Audit-Tests); Eintrag bei Zoom 2, DPR 2 ≤
    `SPRITE_MAX_BYTES`; Effekt hält `CAPS`, endet nach ≤ 3 s, entfällt bei reduzierter Bewegung; ein Render-Durchlauf
    lässt `serialize(world)` gleich; alle übrigen Gebäude: `bodyHeight`, `bodyHull`, `spriteKey` ohne Bildstufe gleich
    mit Bildstufe 0.
  - **A2 Bildrand:** Renderer-Test «Denkmal Stufe 4 knapp unter dem Bildrand wird gezeichnet» (Kamera so, dass die
    Grundraute knapp unterhalb des sichtbaren Bereichs liegt, die Spitze aber hineinragt → Zeichenbefehle vorhanden).

```bash
npx vitest run tests/render/monumentSprite.test.ts tests/render/picking.test.ts tests/render/iso.test.ts \
  tests/render/spriteCache.test.ts tests/render/renderer.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen.** Platzhalter in `SILHOUETTES` durch `drawMonument` ersetzen; Referenz-Hash `monument`
      in `sprites-referenz.test.ts` neu setzen (einzige erlaubte Hash-Änderung, Ledger-Eintrag); kein anderer Hash
      ändert sich.

```bash
npx vitest run tests/render/monumentSprite.test.ts tests/render/picking.test.ts tests/render/iso.test.ts \
  tests/render/spriteCache.test.ts tests/render/sprites.test.ts tests/render/sprites-referenz.test.ts \
  tests/render/variants.test.ts tests/render/sprites-kanten.test.ts tests/render/sprites-licht.test.ts \
  tests/render/sprites-signale.test.ts tests/render/statusMarks.test.ts tests/render/overlays.test.ts; echo EXIT=$?
npx vitest run tests/render/renderer.test.ts; echo EXIT=$?   # Zeittest (ZEITTESTS): nur bei freier Testsperre, R380
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

Ein geänderter Referenz-Hash eines **anderen** Gebäudes ist Stopp und Meldung.

- [ ] **Schritt 3: Commit.** `feat: Denkmal-Bildstufe in Höhe, Hülle, Cache, Picking; Aufflammen (M13-E2 T09)`.

## Bericht

Testnamen je AK, Rot-Zeile, Exit-Codes, Liste der Aufrufstellen (Datei:Zeile, Stufe durchgereicht ja/nein, Grund),
Sprite-Bytes bei Zoom 2/DPR 2, `git diff --stat main...HEAD -- src/render`. Der Controller (`lead-art`) meldet den
abgenommenen Hash an den UI-Controller (Merge vor T12).
