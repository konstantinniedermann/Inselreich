# T05 `drawRiseGlow` (Strang R, `art-rendering-engineer`)

AK: B2, B3, B5 (Zeichnerteil). Dateien: `src/render/fx.ts`, `tests/render/fx.test.ts`. blocked-by T04. Muster: `flareStrength`/`drawMonumentFlare` (`fx.ts` ~236–280); `spread(i, salt)` für deterministische Streuung wiederverwenden (Salt `id` einmischen, kein `Math.random`).

1. `riseStrength(elapsedMs)` exportiert: 0 bei < 0, `NaN`, ≥ 1500; Anstieg bis 200 ms (smoothstep wie `flareStrength`), danach sanft abfallend; Maximum ≈ 1 bei 200 ms.
2. `riseSparkCount(tier, reduce)`: Stufe 2 → 6, 3 → 7, ≥ 4 → 8, `min(…, cap('riseSparks', reduce))`; `reduce` → 0.
3. `drawRiseGlow(ctx, rect, elapsedMs, tier, id, reduce)`: Stärke `k = riseStrength`; `k <= 0` → return ohne Zeichenaufruf. Kranz: Ellipse in Hausbreite über dem Haus, Radialverlauf `PALETTE.window` → `PALETTE.lightEvening` → transparent (vorhandene Farben, kein neuer Wert); bei `reduce` statisch, ohne Pulsation, 1500 ms ausblenden. Funken (nur `!reduce`): Position aus `spread(i, id)`, steigen mit `elapsed`, ab Stufe 3 grösserer Radius. Aufrufer setzt `'lighter'`, hier keine Compositing-Änderung.
4. Tests zuerst (Fake-Kontext `tests/render/fakeCtx.ts`): B2 (Stärke bei 0/200/700/1500: 0 → Max → fallend → 0; bei 1500 und negativ/NaN 0 Pfade gezeichnet), B3 (Funkenzahl 6/7/8, `reduce` 0 Funken, Kranz bleibt; gleiche `id` → gleiche Positionen, andere `id` → andere), B5-Zeichnerteil.
5. Prüfen: `npx vitest run tests/render/fx.test.ts; echo EXIT=$?`, Lint. Commit `feat: Aufstiegs-Glanz Zeichner (I-118)`.
