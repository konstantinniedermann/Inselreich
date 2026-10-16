# T01 `townFactor`, `smoothShare`, `ambienceMix` (Strang A, `art-audio-engineer`)

AK: A1, A2, A3 (Mix-Teil), A4, A7. Dateien: `src/audio/mix.ts`, `src/audio/ambience.ts`, `tests/audio/ambience.test.ts`, `tests/audio/mix.test.ts`. Test-first: jeden Test vor der Umsetzung rot sehen.

1. `mix.ts`: `ViewStats` bekommt `suppliedShare?: number; houses?: number;` (Kommentar: Spiegel von `src/render/viewStats.ts`). **Kein** Import aus `sim/` oder `ui/`.
2. `ambience.ts`, neben `ambienceMix` (exportiert):
   - `townFactor(share: number | undefined): number` Kurve B: Stützpunkte 0,2→0, 0,4→0,5, 0,8→1, dazwischen linear, ausserhalb geklemmt; `undefined`, `NaN`, nicht endlich oder < 0 → 1 (kein Eingriff, wie heute).
   - `smoothShare(prev: number | undefined, next: number, dtS: number, tauS = 10): number` exponentiell `prev + (next-prev)*(1-exp(-dtS/tauS))`; `prev` undefiniert → `next`; `dtS <= 0` oder nicht endlich → `prev ?? next`. Keine Zufallsquelle.
3. `ambienceMix`: `townBase` mal `townFactor(view.suppliedShare)`; wenn `view.suppliedShare` endlich und `view.houses > 0`: `wind = clamp01(wind + 0.15 * (1 - townFactor))`. Ohne Feld oder bei `houses` 0 bleibt alles wie heute.
4. Tests (vor Code schreiben): A1 (Kurve: 1 bei 0,8/0,9; 0,5 bei 0,4; 0 bei 0,2/0; monoton; `NaN`/`undefined`/-1 → 1), A2 (gleiche Ansicht, Share 1,0 vs 0,3 → `town` ≥ Faktor 2; ohne Feld identisch zum Bestandswert), A3 (Share 0,1, `houses` 3 → `town` 0, `wind` grösser als bei Share 1; `houses` 0 → `wind` unverändert), A4 (1→0 nach 10 s ≈ 0,37, nach 30 s < 0,06; gleiche Folge, gleiche Ausgabe; `dtS` ≤ 0 ändert nichts).
5. A7: `rg -n "from '\.\./(sim|ui)" src/audio; echo` im Bericht (kein Treffer); gibt es einen Grenz-Test in `tests/audio/`, bleibt er grün.
6. Prüfen: `npx vitest run tests/audio; echo EXIT=$?`, `npm run lint` (bzw. `make lint`), alle Exit-Codes nennen. Ein Commit `feat: Wohlstandsklang Kurve (I-120)`.
