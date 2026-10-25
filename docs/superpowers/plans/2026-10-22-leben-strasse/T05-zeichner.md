# T05 · Zeichner: `drawWalker` neu, Last-Zeichner (P2)

Umsetzer `art-rendering-engineer` (derselbe wie T01, `SendMessage`) · ≈ 50 Tools · AK-V1 bis V4, V6, V7, V10 · blocked-by T02, T03, T04 (Strang 2 vorher mit `git merge feat/leben-strasse-look` holen, kein Rebase) · Spec: `docs/superpowers/specs/2026-10-22-leben-strasse-design.md`, P2 „Gestaltung“

## Dateien

- ändern: `src/render/life.ts` (`drawWalker`, `WALKER_H`, `WALKER_W`, alte `CLOTHES`/`clothesOf` entfernen), `src/render/errands.ts` (`drawErrandLoad`), `tests/render/life.test.ts`, `tests/render/errands.test.ts`
- nicht ändern: `walkerShadow`, Tiefensortierung, `pace.ts` (nur lesen: `STRIDE`), `renderer.ts` (T06)

## Verhalten (Spec P2)

1. Mass: `WALKER_H = 0.70 · ISO_H` (22 px), Breite `0.20 · ISO_W/2`; Fusspunkt = unterster Beinpunkt auf `worldToScreen(project(x,y))`.
2. `drawWalker(ctx, cam, pose, look, opts)`: Pose trägt `step`, `dir`, `alpha`; `look` aus `figureLook`. Schrittphase `φ = 2π·step/STRIDE`, Wippen `±0,04 H·|sin φ|`, Beinschwung `±0,18` Kacheln des Rumpfs (Beine gespiegelt bei `φ` und `φ+π`). `reduceMotion`: neutrale Haltung (Beine parallel, kein Wippen).
3. Zoomstufen: ≥ 1 volle Figur (Kopf Kreis r = 0,16 H, Haar/Hut, Rumpf zwei Tonstufen, Beine, Kontur `OUTLINE` ab Zoom 0,75); 0,5/0,75 Kopf + Rumpf, ohne Beine/Wippen; ≤ 0,25 ein Strich `2 × max(3,H)` px in Kleiderfarbe, ohne Kontur.
4. Träger: Rumpf `0,06 H` nach vorn geneigt (in Blickrichtung), Tuch/Hut dunkel; Last (`drawErrandLoad`) als Bündel/Korb auf dem Rücken, **Gegenseite von `dir`**, Farbe `LOAD_COLOR[good]` mit Kontur, Breite ≥ 40 % der Rumpfbreite; Hinweg (ohne Last) kein Lastkörper; bei Zoom ≤ 0,25 nur 1 px Lastpunkt.
5. Pfade je Figur bündeln (ein Rumpf-Pfad je Tonstufe, ein Pfad für beide Beine); keine Allokation je Figur ausser der Pose.

## Testfälle (rot zuerst, `fakeCtx`)

- **V1** Zoom 1: Bildhöhe 18 bis 24 px, Breite ≤ 9 px, Fusspunkt auf dem Bildpunkt. **V2** Aufbau je Zoomstufe (Kreis, zwei Füllfarben Rumpf, Beinstrich; Zoom 0,5 ohne Beine; Zoom 0,25 genau ein Fill, keine Kontur). **V3** Aufrufzahl Fill/Stroke ≤ 12 / ≤ 6 / ≤ 2. **V4** Beine bei `φ=0`/`π` gespiegelt, `step` und `step+STRIDE` gleiche Pose, Kopfhöhe ≤ 0,04 H Schwankung, `reduceMotion` konstant und beinegleich. **V6** Last auf Gegenseite von `dir` (x-Versatz). **V7** Lastkörper ≥ 40 % Rumpfbreite, Hinweg ohne Last, Träger-Rumpf nach vorn versetzt gegenüber Spaziergänger. **V10** Bestandstests Schatten/Tiefensortierung grün, `walkerShadow` ohne Diff.
- Bestandstests von `drawWalker`/`drawErrandLoad` (alte Masse 0,6/0,18, Punktlast): auf neue exakte Werte nachziehen, nicht lockern.

## Prüfschritte / Task-Review

Gezielte Tests `life errands walkerLook pace`, `tsc`, eslint/prettier. Reviewer: nur S1/S2-konforme Farben, kein `Date`, Aufrufzahlen eingehalten, Fusspunkt und Verdeckung unberührt.
