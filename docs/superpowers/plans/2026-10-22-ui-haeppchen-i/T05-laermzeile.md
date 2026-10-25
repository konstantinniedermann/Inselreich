# T05 · P3 Lärm-Zeile (I-170 Regel 5)

Umsetzer `tech-ui-engineer` · ≈ 30 Tools · AK I23 · blocked-by: **Stadtplanung nach main gemergt** und T04 · Spec: Teil P3 Regel 5 · Strang A

## Start

Erst wenn `rg "NOISE_OCCUPANCY" src/sim` auf main trifft. Im Strang-A-Worktree `git merge main` (kein Rebase), Konflikte in `hud.ts` und README lösen (beide Seiten behalten), dann Tests rot schreiben. Geht Strang A vor dem Stadtplanung-Merge nach main, läuft T05 auf einem neuen Branch `feat/ui-haeppchen-i-a2` ab main (dann entfällt der Merge-Schritt).

## Dateien

- ändern: `src/ui/growthBrake.ts` (`noise` füllen, Zeile in `brakeLines`), `src/ui/hud.ts` (nur `parkShown` übergeben: `buildingShown(world, 'park')`), `tests/ui/growthBrake.test.ts`
- nicht ändern: `src/sim/` (`quiet.ts`, `caps.ts`), Problemliste, Haus-Panel

## Verhalten

Haus der Stufe «im Lärm», wenn `houseNoise(world, b, cov).noisy` und `k = houseCap(h, 1) − houseCap(h, NOISE_OCCUPANCY) > 0` (wie `noisePreview`); `shielded` zählt nicht. Zeile 3: `{n} im Lärm (−{Σk} Einwohner)`, mit « — ein Park schirmt ab» nur bei `parkShown`. Haus mit Mangel und Lärm steht in beiden Zeilen. Keine Lärm-Häuser: keine Zeile. Der `coverage`-Aufruf bleibt einer je Rechnung. Namen und Signaturen vor dem Schreiben mit `rg "export function (houseNoise|houseCap|noisePreview)" src/sim` prüfen.

## Testfälle (rot zuerst)

I23 vollständig (Lärm k > 0, abgeschirmt, hohe Steuer k = 0, Park-Hinweis nur bei Freischaltung, Mangel und Lärm in beiden Zeilen). Dazu: AK-I25 weiterhin grün (kein zweiter `buildCoverage`). Prüfungen wie T02, Commit `feat: Lärm-Zeile im Einwohner-Chip (I-170)`.
