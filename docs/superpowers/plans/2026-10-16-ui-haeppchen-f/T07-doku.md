# T07 · Doku (D1, E-017), Zeitmessung nachher, Abschlussläufe

Umsetzer `tech-ui-engineer` (Doku, Zeitmessung) · ≈ 30 Tools · AK B10, I108 10 (Beleg) · blocked-by: T06 (und I-091-Merge oder `git merge main`, falls I-091 vorher fertig)

## Dateien (D1 ausdrücklich erlaubt, E-017)

- ändern: `README.md` (Spielanleitung: Kopfzeilen-Chip «+Einnahmen / −Unterhalt», Marke an der Fern-Insel, Routen-Zeile «nominal»), `docs/arc42.md` (Baustein `src/sim/routeBalance.ts` lesend; `src/ui/balanceFlow.ts`; `MapMark` in `src/render/seaMap.ts`; Tick-Ablauf und Persistenz unverändert, ausdrücklich vermerken), `docs/ideen.md` (Status I-101, I-103, I-108), `docs/beobachtungen.md` (Befunde aus T02 bis T06, Variante C nach Playtest)
- nicht ändern: `docs/studio/`, Specs, `docs/spielwerte.md` (kein neuer Spielwert), `src/`

## Schritte

1. Doku nachführen; Wortlaut der README nur aus den Specs (Kopfzeile, Marke, «nominal»).
2. Zeitmessung nachher: `npx vitest related --run src/ui/hud.ts src/ui/ships.ts src/ui/farOrder.ts src/ui/seaMapView.ts src/render/seaMap.ts src/sim/flow.ts src/sim/routeBalance.ts --reporter=json --outputFile=.studio/qa/ui-haeppchen-f/zeit-nach.json; echo EXIT=$?` (Load ≤ 4, Testlock) und Vergleichstabelle (Datei, Dauer vor/nach, Differenz) in den Bericht. Abnahme +25 % / 50 % des Timeouts (R593).
3. Abschlussläufe, je `; echo EXIT=$?`: `make check`, `make zeitreserve-gate`, `make docs-check`; `git diff main -- src/sim/types.ts src/sim/defs src/sim/save.ts tests/sim/balance.test.ts` leer; `git diff main -- src/sim` nur `src/sim/routeBalance.ts`; `git diff main --stat -- src/ui/app.ts` leer (P-6).
4. Hinweis «bereit fürs Final-Review» an den Controller; Final-Review startet der Controller als frischen `qa-code-reviewer` mit `model: opus` (R673).

## Prüfschritte / Task-Review

Reviewer: Doku stimmt mit Code (README-Bedienung, arc42-Bausteine); `docs-check` Exit 0; Exit-Codes aller Läufe im Bericht.
