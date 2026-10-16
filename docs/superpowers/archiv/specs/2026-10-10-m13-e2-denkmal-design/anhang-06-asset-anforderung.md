# Anhang 06 · Asset-Anforderung an lead-art (Spec M13-E2)

Gehört zu [Spec M13-E2 Denkmal als Wahlziel](../2026-10-10-m13-e2-denkmal-design.md), §7.4, §8. Paket **M13-E2-ART**:
Der Maler (reine Zeichenfunktion je Bildstufe mit Fake-Kontext-Tests) läuft ab Gate Spec parallel (R452 O2, R67);
das Einhängen in `SILHOUETTES`/`BODY_HEIGHTS`, die Referenz-Hashes und die Tests über alle Ids folgen erst nach dem
Def-Kern (R489, tech B2). Motiv, Bildziel und Bauphasen stehen im
[Art-Vorschlag Denkmal](../2026-10-10-denkmal-art-vorschlag.md) (§1 Empfehlung prozedural, §2 Bildziel, §4
Bauphasen, §5 Schnittstellen) und werden hier nicht wiederholt. Dieser Anhang legt nur fest, was die Spec davon
übernimmt und wie es geprüft wird. Keine fremden Assets nötig (ADR-006); nichts suchen.

## A. Übernommen als Setzung Spec

- **Id und Ort:** `monument`, prozedural in `src/render/sprites.ts` (Eintrag in `SILHOUETTES`, `BODY_HEIGHTS`,
  ggf. `WINDOWS`), Stilrahmen ART-STIL-01, Isometrie nach ADR-012, Höhenhülle ISO D-12.
- **Bildstufen 0–4** (Art-Vorschlag §4: Baugrund, Sockel, Terrassen, Schaft, Fertig), **ohne Anteils-Schwellen**.
  Reine Funktion `monumentImageStage(m)` in `src/render/` [Tech: Datei] aus dem ganzzahligen Sim-Zustand:

  | Sim-Zustand                    | Bildstufe | Bild           |
  | ------------------------------ | --------- | -------------- |
  | `stage 0`, `running false`     | 0         | Baugrund       |
  | `stage 0`, `running true`      | 1         | Sockel, Gerüst |
  | `stage 1` (laufend oder nicht) | 2         | Terrassen      |
  | `stage 2` (laufend oder nicht) | 3         | Schaft         |
  | `stage 3`                      | 4         | Fertig         |

  AK-M13E2-36 prüft alle **sieben** erreichbaren Paare (`stage`, `running`): (0, nein) → 0, (0, ja) → 1, (1, nein)
  und (1, ja) → 2, (2, nein) und (2, ja) → 3, (3, nein) → 4; (3, ja) schliesst die Ladeprüfung aus (qa B7a).

  Jeder Abschluss und der Start von Abschnitt 1 ändern das Bild sichtbar. Abschnitts-Namen im Panel (Sockel,
  Terrassen, Schaft und Feuerschale) passen dazu (§4).

- **Höhe:** Stufe 4 ≈ 2,9 · `ISO_H` (Prüfspanne [2,8; 3,0], ≤ `H_TOWER`), Stufen 0–3 streng kleiner; Stufe 0 ≤ 0,3 ·
  `ISO_H`. Seitlich innerhalb der 3×3-Rautenbreite.
- **Cache:** Bildstufe als Feld in `spriteKey` (fehlt = 0); Schlüsselaudit im Kopf von `spriteCache.ts` nachführen.
  Speicher je Eintrag bei Zoom 2, DPR 2 ≈ 2,8 MB < `SPRITE_MAX_BYTES` (Art-Vorschlag §5).
- **Bauvorschau:** `drawGhost` zeichnet Stufe 4 (das Ziel).
- **Abschluss-Moment** (Spec U-12): einmaliges Aufflammen der Feuerschale über `src/render/fx.ts` beim Übergang
  `monumentDone` false → true, ausgelöst von der UI; ≤ 3 s, unter `CAPS`, aus bei reduzierter Bewegung. Klang: die
  bestehende `public/audio/sfx/bell.mp3`, kein neues Audio-Asset; `src/audio/` importiert nichts aus `src/sim/`.
- **Tag, Nacht, Wetter:** lesbar über die bestehende Licht- und Wetterkette; Stufe 4 nachts mit Leuchtfeuer
  (Art-Vorschlag §4).

## B. Schnittstelle

- Render liest nur `world.monument` (über `monumentImageStage`) und das Gebäude (`x`, `y`, `id`), schreibt nie in die
  Welt. Weil `bodyHeight(def, b)` heute nur das Gebäude kennt, bekommt die Höhen-, Hüllen- und Schlüsselberechnung die
  Bildstufe als Parameter oder über eine reine Abfrage [Tech].
- Picking (`buildingHulls`, `pickBuilding`) und Tiefensortierung (`sortedObjects`) folgen der Hülle der aktuellen
  Bildstufe; das erste 3×3-Gebäude muss dort ohne Sonderfall laufen (AK-M13E2-37, -38).

## C. Prüfung

- **Höhenmass H(s)** (**Setzung Nachtrag**, qa B7b), Muster AK-ISO-10 in `tests/render/sprites.test.ts`: Kamera `CAM`
  wie dort, `drawBody` mit Bildstufe s in den Fake-Kontext, `top = project(b.x, b.y)` (hintere Ecke der Raute),
  H(s) = (`top.y` − min y über `log.allPoints`) / `ISO_H`. Forderungen: H streng steigend über s = 0 … 4;
  H(4) ∈ [2,8; 3,0]; H(0) ≤ 0,3; alle Punkte in `bodyHull(def, b, s)` (Toleranz 0,5 px); `bodyHeight(def, b, s)`
  streng steigend. «Höher als die Amtsstube» (qa B7c): H(4) > H der Amtsstube im selben Mass und
  `bodyHeight(monument, b, 4)` > `bodyHeight(townhall, …)` = 2,0 · `ISO_H`.
- Vitest mit Fake-Kontext (`tests/render/fakeCtx.ts`): AK-M13E2-36 (Bildstufen-Funktion, fünf verschiedene
  Aufzeichnungen, Höhenmass, Rautenbreite, `drawGhost`), -37 (Picking), -38 (Sortierung), -39 (Cache-Schlüssel, Bytes,
  Effekt unter `CAPS`, keine Welt-Schreibung).
- Browser: AK-M13E2-46 (Screenshot je Bildstufe 0–4 bei Tag, Nacht, Regen, 1280×720 und 1920×1080 unter
  `.studio/qa/m13-e2/`), -44 (Abschluss-Moment einmal, nicht nach Laden).
- Asset-Prüfsummen (`tests/assets/`): unverändert, weil kein neues Asset.
