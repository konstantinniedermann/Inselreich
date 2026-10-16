# Plan UI-HAEPPCHEN-F · I-101 «Fernauftrag-Marke» + I-103 «Routen-Bilanz» + I-108 «Einnahmen/Unterhalt getrennt» (Stufe leicht)

Owner `lead-tech` · Quellen: Kurzdesign I-108 `design/i108` @ `059b87f9` (14 AK), Kurzdesign I-101/I-103 `design/i101-i103` @ `09cbe002` (18 AK); beide per Merge auf diesem Branch. Entscheide R677. Plan gegen main `d19f87fb`, ohne Testläufe (R464). Task-Dateien in [`2026-10-16-ui-haeppchen-f/`](2026-10-16-ui-haeppchen-f/).
Spielerwirkung: Wirtschaftslage («+540 / −780»), Fernauftrag-Ziel («15 Rum · 1:20» an der Insel) und Schiffsnutzen («Warenwert +310 / min · Unterhalt 90 → +220, nominal») auf einen Blick.
**Kein Save** (`SAVE_VERSION`, `types.ts` ohne Diff), **kein Spielwert** (`defs/` und `balance.test.ts` ohne Diff; nur UI-Konstanten: Kartenfarben in `COLORS`, Kurzform-Grenze 10 000), keine Abhängigkeit (ADR-001), kein ADR. Einzige Sim-Änderung: neue Datei `src/sim/routeBalance.ts`, nur lesend. **Umsetzung erst nach Merge UI-HAEPPCHEN-E** (R677).

## Entscheide des Plans

- **P-1 Reihenfolge I-101 → I-103 → I-108** (R677). I-108 zuletzt: kleinster Gewinn je Aufwand der drei ist hier nicht massgebend, sondern `hud.ts` (I-101 berührt dort 2 Zeilen, I-108 einen Block) und der Browser-Check der Kopfzeile, der mit dem fertigen Stand (späte Partie) am meisten aussagt. Ein Strang, seriell (R677 «ein Strang»).
- **P-2 Einheit der Sim-Funktion:** `routeBalance` liefert Werte je `UPKEEP_INTERVAL`/`GOODS_BALANCE_TICKS` (100 Ticks, wie `goodsBalance`), nicht «je min»: die Sim kennt `TICK_MS`-Umrechnung nicht (UI-Sache, `perMinute`). Die UI rechnet `perMinute(x, 100)`; `SHIP.upkeep = 15` je 100 Ticks ergibt `perMinute(15, 100) = 90`, also dieselben Zahlen wie im Kurzdesign («Unterhalt 90»). AK-B1/B5 prüfen deshalb in der Sim die 100-Tick-Werte und in der UI die Minutenzahl.
- **P-3 `shipsKey` bleibt strukturell (Abweichung von AK-B8-Wortlaut):** Die Bilanzzeile wird wie `ship-route-<id>` per `setText` aktualisiert, nicht über einen Schlüssel, der `goodsBalance` je Aufruf bräuchte (`shipsKey` läuft bei jedem Panel-Update). AK-B8 wird so geprüft: `shipsKey` ändert sich bei Routenwechsel (bestehendes Verhalten, neue Assertion); die Zeile ändert sich bei geänderter Bilanz (`shipBalanceLines`). Beobachtbares Ergebnis gleich.
- **P-4 `balanceText` bleibt unverändert** (Vertrag für `balancePreview.ts`, `hud.test.ts`, `contracts-haeppchen.test.ts`, `balancePreview.test.ts`). I-108 baut daneben `balanceFlow.ts`; `balanceView` und `balanceTooltip` ändern ihren Text, die zwei Erwartungen in `hud.test.ts` (Z. ≈ 187–188) werden mit dem genauen neuen Wert mitgezogen (nie `toContain` statt `toBe`).
- **P-5 `MapMark` lebt in `src/render/seaMap.ts`** (Render importiert nichts aus `ui`); `farMark` in `src/ui/farOrder.ts` importiert den Typ von dort (`ui → render` ist erlaubt, `seaMapView.ts` tut es schon). `MapUi.mark` ist optional: bestehende Aufrufer und Tests bleiben unverändert.
- **P-6 `drawSeaMap` wird in `hud.ts` (`bindIslandMenu`, Z. ≈ 452) aufgerufen, nicht in `app.ts`.** Das Kurzdesign nannte `app.ts`; `app.ts` bleibt ohne Diff. Damit gibt es keine Überschneidung mit UI-E in `app.ts`.
- **P-7 Angebotsfrist teilen:** `farOfferText` rechnet `due` inline; T02 zieht daraus `farOfferDue(world)` (reiner Helfer, Text von `farOfferText` bitgleich, Bestandstests grün), damit Marke und Text dieselbe Frist nutzen. Neue Tests in neuer Datei `tests/ui/farMark.test.ts` (UI-E ändert `tests/ui/farOrder.test.ts`).

## Kosten `goodsBalance` je Quellinsel (Beleg, Schätzung)

`goodsBalance(world, island)` ohne `cov` durchläuft alle Gebäude (B) und ruft je Haus (H) `supplyBuildings(world, island)` (Default-Argument, O(B)): ≈ H·B + B Schritte. Bei H = 150, B = 400: ≈ 6·10⁴ Schritte, geschätzt 0,2–0,5 ms. Die Kopfzeile ruft es bereits je Refresh für jeden Gut-Chip (≈ 10×, `chipView`); die Routen-Bilanz braucht höchstens eine Rechnung je **verschiedener** Quellinsel (Route hat 2 Seiten, bis 4 Schiffe: höchstens 8, mit Insel-Dedupe meist 2–4), nur bei offenem Kontor-Panel. Massnahmen: (1) Memo `Map<Insel, Bilanz>` je Anzeige-Schritt (Parameter `balances` von `routeBalance`), (2) Neuberechnung in `updateShipSection` nur wenn sich `world.tick` geändert hat (Pause: nie), also höchstens im Takt von `refresh()` (`HUD_EVERY_FRAMES = 10`). Worst case: 8 × 0,5 ms = 4 ms je ≈ 170 ms ≈ 2,4 % einer CPU-Sekunde, unter dem Posten der Kopfzeile. **Beleg:** T03 misst in einem Mikro-Lauf (Konsole `performance.now()`, kein Testfall, keine Schwelle) die Rechnung auf der grössten Welt der Balancing-Tests und trägt den Wert in den Task-Bericht ein; liegt er über 2 ms je Aufruf, Alternative: `cov` aus dem Frame-Cache der UI durchreichen (Parameter ist vorhanden) und Beobachtung eintragen. Alternative zu (1): Rechnung gedrosselt über `balanceDue` (500 ms); verworfen, weil `world.tick` genauer und einfacher ist.

## Dateimatrix (Ownership, ein Strang)

| Datei                                                                     | T01 | T02 | T03 | T04 | T05 | T07 |
| ------------------------------------------------------------------------- | --- | --- | --- | --- | --- | --- |
| `src/render/seaMap.ts`, `tests/render/seaMapDraw.test.ts`                 | ja  |     |     |     |     |     |
| `src/ui/farOrder.ts`, `src/ui/seaMapView.ts`                              |     | ja  |     |     |     |     |
| `src/ui/hud.ts` (Aufruf `drawSeaMap`, ≈ Z. 452)                           |     | ja  |     |     |     |     |
| `tests/ui/farMark.test.ts` (neu), `tests/ui/seaMapView.test.ts`           |     | ja  |     |     |     |     |
| `src/sim/routeBalance.ts` (neu), `tests/sim/routeBalance.test.ts` (neu)   |     |     | ja  |     |     |     |
| `src/ui/ships.ts`, `tests/ui/routeBalanceText.test.ts` (neu)              |     |     |     | ja  |     |     |
| `src/ui/balanceFlow.ts` (neu), `tests/ui/balanceFlow.test.ts` (neu)       |     |     |     |     | ja  |     |
| `src/ui/hud.ts` (`balanceView`, `balanceTooltip`), `tests/ui/hud.test.ts` |     |     |     |     | ja  |     |
| `src/style.css` (nur `.hud-balance`-Regeln, Z. ≈ 1101, 1328ff.)           |     |     |     |     | ja  |     |
| `README.md`, `docs/arc42.md`, `docs/ideen.md`, `docs/beobachtungen.md`    |     |     |     |     |     | ja  |

T06 (Browser-Check) ändert keine Datei. Nicht angefasst: `src/sim/types.ts`, `src/sim/defs/`, `src/sim/save.ts`, `src/sim/flow.ts` (nur gelesen), `src/ui/app.ts`, `src/audio/`, `docs/studio/`, Specs. Worktree `.worktrees/ui-haeppchen-f-impl` ab `plan/ui-haeppchen-f` (`git worktree add … -b feat/ui-haeppchen-f`), dann `git merge main` (mit UI-E).

### Abgleich mit UI-HAEPPCHEN-E (`ca6d8ee6`) und I-091 (`d2b4f6c8`)

| Datei                                                                  | UI-E                                   | I-091                                        | F                          | Konflikt                                                          |
| ---------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------- | -------------------------- | ----------------------------------------------------------------- |
| `src/ui/app.ts`                                                        | `refresh()`, Overlay-Handle            | ohne Diff                                    | ohne Diff                  | keiner                                                            |
| `src/ui/hud.ts`                                                        | ohne Diff                              | ohne Diff                                    | T02, T05                   | keiner                                                            |
| `src/style.css`                                                        | Block am Dateiende                     | ohne Diff                                    | `.hud-balance` (Mitte)     | keiner (verschiedene Stellen)                                     |
| `src/ui/order.ts`, `src/sim/orders.ts`                                 | beide                                  | beide                                        | ohne Diff                  | keiner                                                            |
| `src/ui/farOrder.ts`                                                   | ohne Diff (Test `farOrder.test.ts` ja) | ohne Diff                                    | T02 (Tests in neuer Datei) | keiner                                                            |
| `src/sim/types.ts`, `save.ts`, `world.ts`                              | ohne Diff                              | ja (`Contract`, Version)                     | ohne Diff                  | keiner                                                            |
| `tests/ui/*` (Literale `Contract`)                                     | `order.test.ts`, `farOrder.test.ts`    | `order`, `contractJump`, `autoLog`           | `hud`, `seaMapView`, neue  | keiner (`hud.test.ts`, `seaMapView.test.ts` nur F)                |
| `README.md`, `docs/arc42.md`, `docs/ideen.md`, `docs/beobachtungen.md` | T06 von E                              | T06 von I-091 (README, arc42, beobachtungen) | T07                        | **Textkonflikt möglich**, trivial (Merge, Abschnitte verschieden) |

**Aussage:** F kann **parallel zu I-091** laufen, weil Code und Tests disjunkt sind (F liest `World` nur, I-091 ändert `Contract` und `SAVE_VERSION`; F-Tests bauen keine `Contract`-Literale; `makeWorld`-Helfer bleiben, I-091 ergänzt `helpers.ts` nur additiv). Voraussetzung: Parallelität 2 im Budget und `testlock` (R380) für `make check`/`zeittests`; Dokumentkonflikte löst der später Mergende per Merge. Empfehlung: zuerst I-091 mergen (Save-Nummer, R663), danach F; läuft I-091 noch, startet F trotzdem, T07 (Doku) wartet auf I-091-Merge oder holt ihn per `git merge main`.

## Tasks

| Task | Titel                                               | Datei                 | AK-IDs                  | Strang | blocked-by   | Modell | Tools |
| ---- | --------------------------------------------------- | --------------------- | ----------------------- | ------ | ------------ | ------ | ----- |
| T00  | Zeitmessung vorher (Controller, R392)               | `T00-zeitmessung.md`  | –                       | 1      | UI-E gemergt | sonnet | 8     |
| T01  | Render: `MapMark`, Münze in `drawSeaMap` (I-101)    | `T01-render-marke.md` | M6, M7                  | 1      | T00          | sonnet | 35    |
| T02  | `farMark`, Schlüssel, Tooltip, Einhängen (I-101)    | `T02-farmark.md`      | M1, M2, M3, M4, M5      | 1      | T01          | sonnet | 40    |
| T03  | `routeBalance` (Sim, lesend, I-103)                 | `T03-routebalance.md` | B1, B2, B3, B4, B5a, B6 | 1      | T02          | sonnet | 40    |
| T04  | Schiff-Panel: Bilanzzeile, Tooltip (I-103)          | `T04-schiffzeile.md`  | B5b, B7, B8             | 1      | T03          | sonnet | 35    |
| T05  | `balanceFlow.ts`, Chip, Tooltip, CSS (I-108)        | `T05-balanceflow.md`  | I108 1 bis 10           | 1      | T04          | sonnet | 40    |
| T06  | Browser-Check aller drei (`qa-playtester`)          | `T06-playtest.md`     | M8, B9, I108 11 bis 14  | 1      | T05          | sonnet | 30    |
| T07  | Doku (D1, E-017), Zeitmessung nachher, `make check` | `T07-doku.md`         | B10, I108 10 (Beleg)    | 1      | T06          | sonnet | 30    |

Umsetzer: T01, T02, T04, T05, T07 `tech-ui-engineer` (T01 darf `art-rendering-engineer` sein, falls L0 die Rolle bevorzugt; Datei liegt in `src/render/`), T03 `tech-sim-engineer`. Je Task `qa-code-reviewer` (sonnet, nur Task-Datei + AK-IDs); T06 `qa-playtester` (1280×720 und 1920×1080, Screenshots `.studio/qa/ui-haeppchen-f/`). **Final-Review immer als frischer `qa-code-reviewer`-Start mit `model: opus`, nie als SendMessage-Fortsetzung (R673)**, über die ganze Branch, Ergebnis an `lead-qa`; bei ZURÜCK Delta-Review per SendMessage nur an dieselbe opus-Instanz (R553). Fix-Runden der Umsetzer per SendMessage. Dieser Satz steht wörtlich im Umsetzer-Briefing des Controllers.
**Controller-Ablösung (R167, R190):** Instanz A T00–T03 (6 Arbeiter-Starts), Ledger + ein Satz Status, Instanz B T04–T07 und Final-Review.

## AK-Zuordnung (32 AK, je Testfall oder benannter Beleg)

I-101 (Kurzdesign `design/i101-i103`, 8 AK):

| AK  | Task | Beleg                                                                                                       |
| --- | ---- | ----------------------------------------------------------------------------------------------------------- |
| M1  | T02  | `farMark.test.ts` «null ohne Fernangebot und ohne Fernauftrag; Normalauftrag null»                          |
| M2  | T02  | `farMark.test.ts` kind offer/order, Text mit `formatGameTime` (nie Literal, R662 A3)                        |
| M3  | T02  | `farMark.test.ts` `warn` = `farOrderWarn` bzw. `kontorId === null`                                          |
| M4  | T02  | `seaMapView.test.ts` Schlüssel: Erscheinen, Verschwinden, Sekunde, Warnflag, gleicher Stand                 |
| M5  | T02  | `seaMapView.test.ts` Tooltip Fern-Insel endet auf Abschnitt; andere Inseln bitgleich                        |
| M6  | T01  | `seaMapDraw.test.ts` mit `fakeCtx`: ein Ring/eine Münze plus ein `fillText`; ohne Marke gleiche Aufrufliste |
| M7  | T01  | `seaMapDraw.test.ts` bzw. `seaMapView.test.ts` `seaMapPick` mit/ohne Marke gleich                           |
| M8  | T06  | Browser-Check                                                                                               |

I-103 (10 AK):

| AK  | Task      | Beleg                                                                                                |
| --- | --------- | ---------------------------------------------------------------------------------------------------- |
| B1  | T03       | `routeBalance.test.ts` Hand-Rechnung mit `defs`-Werten, Einheit je 100 Ticks (P-2)                   |
| B2  | T03       | zwei Güter teilen `⌊50 ÷ 2⌋ = 25`                                                                    |
| B3  | T03       | Überschuss ≤ 0: Menge 0; Route ohne Überschuss: Wert 0, Bilanz `−SHIP.upkeep` je 100 Ticks           |
| B4  | T03       | Flussdeckel `⌊net × T ÷ 100⌋`                                                                        |
| B5  | T03 + T04 | T03: `upkeepPer100 === SHIP.upkeep`; T04: UI-Minutenzahl `perMinute(15, 100) = 90`, Netto abgerundet |
| B6  | T03       | `JSON.stringify(world)` vor/nach gleich, zwei Aufrufe gleich (Determinismus)                         |
| B7  | T04       | `routeBalanceText`: kein Route/Heimfahrt `null`; Gewinn-Muster; Verlust mit Minus und `warn`         |
| B8  | T04       | `shipsKey` ändert sich bei Routenwechsel; Zeile folgt der Bilanz (P-3)                               |
| B9  | T06       | Browser-Check                                                                                        |
| B10 | T07       | `make check` Exit 0, `git diff main -- src/sim/defs tests/sim/balance.test.ts` leer                  |

I-108 (14 AK, Kurzdesign `design/i108`): 1 bis 9 → T05 (`balanceFlow.test.ts`, `hud.test.ts`: 1 `flowText`; 2 Nullfälle; 3 Kurzform; 4 Tooltip; 5 `aria-label`; 6 `negative`; 7 gleicher Eingang gleicher Text; 8 `balanceDue` unverändert; 9 Knopf-Test grün); 10 → T05 (`git diff`) und T07 (`make check`); 11 bis 14 → T06 (Browser).

## Zeitmessung berührter Tests (R392)

**T00** (Controller, nach UI-E-Merge, 1-min-Load ≤ 4 per `uptime`, Testlock R380): `npx vitest related --run src/ui/hud.ts src/ui/ships.ts src/ui/farOrder.ts src/ui/seaMapView.ts src/render/seaMap.ts src/sim/flow.ts --reporter=json --outputFile=.studio/qa/ui-haeppchen-f/zeit-vor.json; echo EXIT=$?`. **T07:** derselbe Befehl nach `zeit-nach.json` plus Vergleichstabelle (Datei, Dauer vor/nach, Differenz). Abnahme: kein berührter Testfall über +25 % und kein Lauf über 50 % des Timeouts (R593), sonst Beobachtung oder Fix-Task.

**T00 erledigt (2026-10-16, main `600cd4b8` mit UI-E, Load 2.1):** `vitest related` ergab 3662 Fälle in 135 s, Exit 0; Rohdaten `.studio/qa/ui-haeppchen-f/zeit-vor.json` (ignoriert). Einhängepunkte unverändert: `drawSeaMap(` `hud.ts:452`, `balanceView` `hud.ts:135`, `balanceTooltip` `hud.ts:649`, `.hud-balance` `style.css:1101, 1328ff.`. Berührte Fälle > 200 ms (Baseline): `farOrder-baseline` Controller-Lauf 713 ms; `balance-flow` M11 Referenzlauf 571 ms; `farOrder-offer` R13 Stufe 1–4 je 513–545 ms; `farOrder-save` AK-H2-21 354 ms; `decor` L4 269 ms; `farOrder-period` AK-H2-23 259 ms; `ships` AK-E4-10 258 ms; `flow` AK-P1-09 231 ms; `flow-count` AK-UA3-17b 215 ms; `seaMap` AK-S1 201 ms. Keine der Dateien ist von F direkt geändert (nur gelesen); Abnahme am Ende nach R392.

## Pflichtläufe

**Je Task mit `.ts`-Änderung (T01–T05):** `npx tsc --noEmit; echo EXIT=$?` und `make lint; echo EXIT=$?`, Exit 0 im Task-Bericht. **Rot-Beleg (R395, R410):** je neuem Testfall der rote Lauf `npx vitest run <datei>; echo EXIT=$?` → `EXIT=1` vor der Umsetzung im Task-Bericht; neue Tests lokal × 3 grün. **Vor «bereit»** (Controller): `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`. **Am Ende (T07):** `make check`, `make zeitreserve-gate`, `make docs-check` (je `; echo EXIT=$?`), `git diff main -- src/sim/types.ts src/sim/defs src/sim/save.ts tests/sim/balance.test.ts` leer, `git diff main -- src/sim` nur `routeBalance.ts`. Umsetzer fahren nur gezielte Dateien (R380).

## Budgetantrag (Umsetzung)

Pakete: T01, T02, T03, T04, T05, T07 = 6 × 2 (Umsetzer + Review) = 12, + 1 Playtest (T06) + 1 Final-Review = 14; + 30 % Puffer = 18,2 → **19 Arbeiter-Starts**; dazu **2 Controller-Instanzen** (Ablösung R167/R190) = **21 Starts**, Parallelität 1 im Strang (Gate R679: festgelegt 21 Starts). F läuft **parallel zu I-091 als zweiter Strang** (Testlock R380, höchstens 2 Browser-Läufe R424); Merge-Reihenfolge I-091 vor F, F holt main per Merge vor seinem Gate. (Frühere Fassung: Parallelität 2 nur, wenn L0 F parallel zu I-091 fahren will, dann je Strang ein eigener Controller). T00 macht der Controller selbst. Schätzung Umsetzer ≈ 258 Tools.

## Risiken

- **Routen-Bilanz als Untergrenze:** Text trägt «nominal»; Reserve (`RouteGood.reserve`), Lager und Zweitverteilung sind nicht eingerechnet (R677 Kosten bei Irrtum). Variante C (gemessen, Save) erst nach Playtest, hinter I-091.
- **`lane` fehlt (`laneTicks = 0`):** `routeBalance` liefert `null`, die UI zeigt keine Zeile (Zusatzfall Z1 in T03); sonst Division durch 0.
- **Kopfzeile bei 1280 px:** Chip `+12,3k / −9,8k` plus alle Gut-Chips; AK 12 in T06, Fallback: `white-space: nowrap` und kleinere Schrift nur am Bilanz-Chip, Kurzform früher (Entscheid beim Befund).
- **Marke am Kartenrand / überdeckt Nachbarn:** Klemmen in die Karte (T01), nur eine Marke gleichzeitig.
- **`hud.ts` doppelt berührt (T02, T05):** disjunkte Stellen, seriell, kein Konflikt.
