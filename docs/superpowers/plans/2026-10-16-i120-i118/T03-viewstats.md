# T03 `viewStats`: `suppliedShare`, `houses` (Strang R, `art-rendering-engineer`)

AK: A6. Dateien: `src/render/viewStats.ts`, `tests/render/viewStats.test.ts`. blocked-by T00.

1. `ViewStats` (Render) um `suppliedShare?: number; houses?: number;` erweitern (Namen identisch zu `src/audio/mix.ts`).
2. In der bestehenden Schleife über `homeBuildings(world)`, in der Einwohner gezählt werden (`inView(c.cx, c.cy)`): `houses++`, und `allNeedsMet(b.house, TIERS[b.house.tier])` → `full++`. Import `allNeedsMet` aus `../sim/population`, `TIERS` aus `../sim/defs/tiers` (lesend; Render importiert bereits aus `../sim/`). Nur Häuser mit `b.house`, wie die Einwohnerzählung; im Bau befindliche Häuser besitzen kein `house` und zählen nicht.
3. Am Ende nur bei `houses > 0`: `out.houses = houses; out.suppliedShare = full / houses`. Fehlen beide Felder bei 0 Häusern. Der Frühausstieg `n === 0` (offenes Meer) bleibt, ohne Felder.
4. Test-first (Bestandsfixture der Datei, Z. ~36): 4 Häuser im Bild, 3 mit `supplied` und erfüllten `satisfied`/`services`, 1 mit offenem Bedarf → `suppliedShare` 0,75, `houses` 4; Haus ausserhalb des Bildes zählt nicht; keine Häuser → Felder fehlen (`'suppliedShare' in out` false). `viewStats` schreibt nicht in die Welt (eingefrorene Welt, kein Wurf).
5. Prüfen: `npx vitest run tests/render/viewStats.test.ts; echo EXIT=$?`, Lint. Commit `feat: viewStats suppliedShare (I-120)`.
