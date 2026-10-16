# T08 · Maler der fünf Bildstufen und Aufflammen der Feuerschale (TDD)

Strang art · Worktree `.worktrees/m13-e2-art` · Branch `feat/m13-e2-art` (Abzweig `main` nach Gate Plan) · Umsetzer
`art-rendering-engineer` (sonnet) · Controller `lead-art` · Vorarbeit für AK-M13E2-36 und -39 (Abnahme in T09) ·
blocked-by T00 · Grösse M (≈ 25 Tools)

**Zweck:** Die Zeichnung läuft unabhängig vom Sim-Kern (Spec §15, Anhang 06 Kopf, tech B2): reine Zeichenfunktion
je Bildstufe in einer **neuen Datei**, damit sie nicht mit den Platzhaltern aus T01 in `sprites.ts` kollidiert.

**Files:**

- Create: `src/render/monumentSprite.ts`, `tests/render/monumentSprite.test.ts`
- Modify: `src/render/fx.ts` (nur neue Funktionen, nichts Bestehendes ändern), `src/render/limits.ts` (nur ein neuer
  `CAPS`-Eintrag, z. B. `flareSparks: [n, 0]`)
- Lesen: [Art-Vorschlag Denkmal](../../specs/2026-10-10-denkmal-art-vorschlag.md) §2 (Bildziel), §4 (Bauphasen), §5
  (Schnittstellen); Spec §7.4, §8, Anhang 06 A, C; `IsoPainter`, `townhallBody` in `src/render/sprites.ts` (Muster),
  `drawFire`/`drawFireGlow` in `fx.ts`, `CAPS`/`cap` in `limits.ts`; ART-STIL-01, ADR-012.

## Schnittstelle

```ts
// src/render/monumentSprite.ts — Laufzeit-Importe nur aus './isoBase' (ISO_H, project), './palette', './limits';
// `import type { IsoPainter } from './sprites'`; NIE aus './iso' oder './sprites' zur Laufzeit (iso.ts importiert diese Datei in T09)
export type MonumentImageStage = 0 | 1 | 2 | 3 | 4;
/** Höhe des Körpers in ISO_H-Einheiten je Bildstufe; streng steigend; [4] in [2,8; 3,0], [0] ≤ 0,3. */
export const MONUMENT_HEIGHTS: readonly [number, number, number, number, number];
/** Zeichnet das 3×3-Denkmal der Bildstufe s (0 Baugrund, 1 Sockel mit Gerüst, 2 Terrassen, 3 Schaft, 4 Fertig). */
export function drawMonument(p: IsoPainter, b: Building, s: MonumentImageStage): void;
/** Leuchtfeuer der Stufe 4 bei Nacht (Muster Fenster-/Signallicht); ohne Wirkung bei s < 4. */
export function monumentNightLight(s: MonumentImageStage): boolean;

// src/render/fx.ts
/** Aufflammen der Feuerschale: Stärke 0…1 über die Zeit seit Start; 0 ab 3000 ms und bei reduce. */
export function flareStrength(elapsedMs: number, reduce: boolean): number;
export function drawMonumentFlare(
  ctx: CanvasRenderingContext2D,
  top: Pt,
  elapsedMs: number,
  reduce: boolean,
): void;
```

- Stilrahmen: Palette aus `palette.ts`, Kanten und Licht wie die übrigen Silhouetten (ART-STIL-01); Höhe nur über
  `MONUMENT_HEIGHTS[s] × ISO_H`, seitlich innerhalb der 3×3-Raute (`w = h = 3`).
- Kein Zugriff auf Welt oder Zufall; deterministisch je `(b.x, b.y, s)`.
- Funken/Partikel des Aufflammens höchstens `cap('flareSparks', reduce)`; bei `reduce` zeichnet `drawMonumentFlare`
  nichts.

## Schritte

- [ ] **Schritt 0:** `grep -n "export class IsoPainter\|function townhallBody\|H_TOWER\|ISO_H" src/render/sprites.ts
src/render/iso.ts`; `grep -n "CAPS = {" -A25 src/render/limits.ts`.
- [ ] **Schritt 1: Test zuerst (rot)** in `tests/render/monumentSprite.test.ts` (Fake-Kontext `tests/render/fakeCtx.ts`,
      Kamera `CAM` wie AK-ISO-10 in `tests/render/sprites.test.ts`, Gebäude-Attrappe mit `x`, `y`, `id` und
      `defId: 'townhall'` per Typ-Cast — die Id `monument` gibt es auf dieser Basis noch nicht, der Maler liest nur
      `x`, `y`, `id`; w/h 3 als Testkonstante):
  1. fünf Stufen ergeben fünf paarweise verschiedene Aufzeichnungen;
  2. Höhenmass H(s) = (`top.y` − min y über `log.allPoints`) / `ISO_H` mit `top = project(b.x, b.y)`: streng steigend,
     H(4) ∈ [2,8; 3,0], H(0) ≤ 0,3; H(4) > 2,0 (Amtsstube);
  3. alle Punkte seitlich innerhalb der 3×3-Rautenbreite (Toleranz 0,5 px);
  4. gleiche Eingabe → gleiche Aufzeichnung (zweimal zeichnen);
  5. `flareStrength`: 0 bei −1 und ≥ 3000 ms, > 0 dazwischen, 0 bei `reduce`; `drawMonumentFlare` mit `reduce` →
     leere Aufzeichnung, sonst ≤ `cap('flareSparks')` Partikel; `monumentNightLight` nur für 4.

```bash
npx vitest run tests/render/monumentSprite.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen.** Bildziel nach Art-Vorschlag §2/§4; Stufe 1 mit Gerüst, Stufe 4 mit Feuerschale.

```bash
npx vitest run tests/render/monumentSprite.test.ts tests/render/fx.test.ts tests/render/limits.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

(`fx.test.ts`, `limits.test.ts` nur falls vorhanden: `ls tests/render | grep -E "fx|limits"`.)

- [ ] **Schritt 3: Sichtprobe** (kein Browser-AK): fünf Stufen in ein Offscreen-PNG unter `.studio/qa/m13-e2/maler/`
      nur, wenn ein bestehendes Werkzeug dafür existiert (`grep -rn "toPng\|writePng" tools tests`); sonst entfällt
      der Schritt, die Sichtprüfung macht T15.
- [ ] **Schritt 4: Commit.** `feat: Denkmal-Maler fünf Bildstufen, Aufflammen der Feuerschale (M13-E2 T08)`.

## Bericht

Testnamen, Rot-Zeile, Exit-Codes, Messwerte H(0…4), Zahl der Zeichenbefehle je Stufe; ob ein Laufzeit-Import auf
`sprites.ts` oder `iso.ts` besteht (muss «nein» sein).
