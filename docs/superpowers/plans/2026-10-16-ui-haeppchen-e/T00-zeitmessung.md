# T00 · Zeitmessung berührter Tests vorher (R392)

Controller selbst, kein Umsetzer · ≈ 8 Tools · blocked-by: UI-HAEPPCHEN-D auf main gemergt

## Schritte

1. Worktree `.worktrees/ui-haeppchen-e-impl` von `plan/ui-haeppchen-e` anlegen (`git worktree add … -b feat/ui-haeppchen-e`), `main` per Merge holen (kein Rebase), `node_modules` prüfen.
2. Einhängepunkte neu suchen, da UI-D Zeilen verschoben hat: `grep -n "const refresh" src/ui/app.ts`, `grep -n "need<HTMLElement>(root, '#game')" src/ui/app.ts`, `tail -20 src/style.css`; Befund (Zeilen) im Ledger, an T04 weitergeben.
3. `uptime`: 1-min-Load ≤ 4 (Testlock R380), sonst `waiting` melden, nicht messen.
4. `npx vitest related --run src/sim/orders.ts src/ui/order.ts src/ui/app.ts --reporter=json --outputFile=.studio/qa/ui-haeppchen-e/zeit-vor.json; echo EXIT=$?`
5. Ergebnis (Exit, Dauer je Datei) im Ledger. Kein Code, kein Commit ausser Ledger.

## Prüfschritte

`zeit-vor.json` existiert und enthält `tests/sim/orders.test.ts` und `tests/ui/order.test.ts`; sonst wiederholen.

## Ergebnis T00 (2026-10-16, main `eb8569e9`, Load 3,4 bis 3,9)

- Einhängepunkte neu (nach UI-D): `app.ts` `const gameEl = need<HTMLElement>(root, '#game')` Z. 279, `const refresh` Z. 907, `isModalOpen` Import Z. 170; `style.css` endet mit `.btn--unread` (Dateiende). `.studio/` ist im Worktree gitignored; Belege liegen im Hauptrepo `.studio/qa/UI-HAEPPCHEN-E/`.
- `vitest related` über `app.ts` zieht 202 Dateien / 3583 Tests (ganze Welt über Importe), EXIT=0. Berührte Testdateien: `tests/sim/orders.test.ts` 291 ms (längster Fall 66 ms), `tests/ui/order.test.ts` 248 ms (55 ms), `tests/sim/balance.test.ts` 272 ms, `tests/ui/hotkeys.test.ts` 138 ms.
- 256 Fälle > 200 ms in 74 Dateien (Liste `zeit-vor-ueber200ms.tsv`), alle bereits auf main, davon 122 > 500 ms (render/sim-Grosstests, z. B. `massif-l6` 10,9 s); keine in orders/order. Abnahme-Auslegung: kein Fall wird gegenüber main neu > 500 ms oder > +50 %; Grossfälle auf main zählen nicht als Verstoss, Vergleich Fall für Fall auf Main und Branch unmittelbar nacheinander (T06).

## Ergebnis T06 (2026-10-16, Branch `feat/ui-haeppchen-e`, Load 2,3 vor dem Branch-Lauf, 5,1 beim Main-Lauf)

- `vitest related` mit `pauseOverlay.ts`: 203 Dateien, EXIT=0; main-nach (ohne `pauseOverlay.ts`) 202 Dateien, EXIT=0. Belege: `.studio/qa/UI-HAEPPCHEN-E/zeit-nach.json`, `zeit-main-nach.json`.
- Dauer je Datei (Summe der Fälle, ms; vorher = `zeit-vor`, main-nach, Branch):

| Datei                           | vorher | main-nach | Branch |
| ------------------------------- | ------ | --------- | ------ |
| `tests/sim/orders.test.ts`      | 290    | 306       | 396    |
| `tests/ui/order.test.ts`        | 247    | 210       | 249    |
| `tests/ui/pauseOverlay.test.ts` | -      | -         | 3      |
| `tests/ui/farOrder.test.ts`     | 217    | 164       | 168    |
| `tests/sim/balance.test.ts`     | 272    | 300       | 310    |

- `farOrder.test.ts` liegt unter `tests/ui/`, nicht unter `tests/sim/`. Der Mehrwert bei `orders.test.ts` (+90 ms) sind die neuen `previewOrder`-Fälle (längster 42 ms).
- Kein Bestandsfall weicht im Branch gegenüber main-nach um mehr als 50 % und mehr als 100 ms ab; kein neuer Fall über 500 ms (längster neuer Fall 42 ms). Keine Wiederholung nötig. Der Main-Lauf lief bei Load 5,1 (über 4); er ist damit eher langsamer als sauber, der Vergleich also nicht zu Ungunsten des Branches verzerrt.
