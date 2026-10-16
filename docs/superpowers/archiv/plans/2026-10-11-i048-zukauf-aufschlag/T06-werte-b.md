# T06 — Schritt B: Werte, Inventar roter Tests, Klassen N/R/S, AK-ZK-15

**Persona:** `tech-sim-engineer` (sonnet, neuer Start) · Worktree `.worktrees/i048-b`, Branch `feat/i048-b` ab `main`, nachdem I048-SIM und I048-UI gemergt sind (R505 (5), zuletzt). **Voraussetzung:** R505 (Klasse S, Messbasis, AK-ZK-13); das Ledger enthält Commit A aus T05.

**Spec-Abschnitte:** §3 Z2–Z5 (Beispiele), §6 (Liste, Klassen, Grenzen), §9.1 AK-ZK-02…-06, -10, §9.2 AK-ZK-14, -15, -30, §9.3 AK-ZK-20, -22. Rulings R487 P-1, R490 B2 und R505 (Klasse S mit QA-B3/B4, AK-ZK-15 mit QA-B5).

**AK:** AK-ZK-02, -03, -04, -05, -06, -10, -14, -15, -20, -22, -30.

**Dateien:** `src/sim/defs/goods.ts` (`BUY_RISE`), `src/sim/defs/timing.ts` (`SELL_RECOVERY_INTERVAL`), `tests/sim/buyPct.test.ts` (Abschnitt B), `tests/sim/defs.test.ts` (AK-ZK-02), `tests/ui/trade.test.ts` (AK-ZK-20, -22), `tests/sim/controller.ts` (Messweg), neu `tests/sim/fixture-recipes.test.ts`; dazu jede Testdatei, die das Inventar einer Klasse zuordnet. Fixture-Dateien unter `tests/sim/fixtures/` bleiben **unverändert**.

## Schritte

- [ ] **B1, Test zuerst** (rot bei `BUY_RISE` 0):
  - `tests/sim/defs.test.ts`, AK-ZK-02: `BUY_RISE` ganzzahlig ≥ 0, `BUY_CAP` ganzzahlig > 100, beide Intervalle ganzzahlig ≥ 1; dazu die Werte 2 / 160 / 10 / 20.
  - `tests/sim/buyPct.test.ts`, `describe('Schritt B')`, Testwelt wie T02: AK-ZK-03 (40/436/1548/6028, Edikt 32/349/1239/4823), AK-ZK-04 (472, 640, 512, Nahrung-Edikt 70, Holz 25 = 310, `serialize` unverändert), AK-ZK-05 (−436 → 120, −516 → 140, 30 → 160, +1 → 160 und Preis 64), AK-ZK-06 (sechs Fehlschläge mit `serialize` vorher = nachher; `money` 435 bei n 10), AK-ZK-10 (`sellPct.wood` 80: 1380 → 99, 1400 → 100; bei Tick 1010 nur Kauf-Erholung, bei 1020 beide), AK-ZK-30 (`buy(w, 'tools', 30)` bei Tick 1000, 155 `step`, laden und 200 weiter = 355 am Stück, `serialize` JSON-gleich; dazu Zweilauf `buildColony(createWorld(3))` zweimal → `serialize` gleich).
  - `tests/ui/trade.test.ts`: AK-ZK-20 (`buyTitle` 10 Werkzeug = «10 Werkzeug kaufen für 436 Geld · im Mittel 109 %», 1 Stück = «… für 40 Geld» ohne Zusatz, mit Edikt «… 349 Geld · im Mittel 109 %», `buyUnitText` bei 120 → «48 Geld», mit Edikt «39 Geld»), AK-ZK-22 (`tradeReasonCtx(w, 'buy', 'tools', 10, HOME).cost.money` bei Anteil 120 = 516; `friendlyReason(w, 'Zu wenig Geld', ctx)` enthält «516»).
  - Lauf: `npx vitest run tests/sim/buyPct.test.ts tests/sim/defs.test.ts tests/ui/trade.test.ts; echo EXIT=$?` → **rot**. Commit `test: I-048 Schritt B Erwartungen (rot)`.
- [ ] **B2, Werte setzen:** `BUY_RISE = 2`, `SELL_RECOVERY_INTERVAL = 20`; die Kommentare werden nachgeführt («1 Punkt je 2 s», I-048 Z5). Gezielter Lauf wie oben → grün. Commit `feat: I-048 Schritt B BUY_RISE 2, Verkaufserholung 20 Ticks`.
- [ ] **B3, Inventar:** Meldung an den Controller (SendMessage-Rückfrage). **Der Controller** fährt `make test` über die Testsperre und gibt die Liste der roten Tests zurück (Datei, Testname). Ins Ledger kommt die Tabelle «Test → Klasse → vorher (Commit A) → nachher». Erwartete Kandidaten:
  - **N (neu messen):** `balance.test`, `balance-merchants`, `balance-crises`, `balance-edicts`, `balance-upgrade`, `balance-monument`, `unlock-timeline`, `balance-flow` (voraussichtlich grün), `population.test`, `unlocks.test`, `goal3.test`, `RANDOM_SEQUENCE` in `e0Pins.ts`, `scenario-saves.test.ts` und `scenarios.ts` (≈ Z. 474, 639), `fire.test.ts`/`fire-rng.test.ts` (über `fixtureV8`; hängen sie an der historischen Fixture, dann R), Läufe über `merchantsController.ts`. Bei `population.test.ts` ≈ Z. 392 (`buy(w, 'wood', 40)`) prüfen, ob das Geld reicht; das ist kein Festwert.
  - **R (alte Werte per `vi.mock`):** in `save.test.ts` die Rezept-Tests gegen `save-v6.json` (`fixtureV6Run`, ≈ Z. 950), `save-v6-locks.json` (`locksV6Run`, ≈ Z. 969), «AK-E0-05a Weiterlauf wie fixtureV6Run» (≈ Z. 1078, 1091), das v7-Rezept (≈ Z. 1228, `fixtureV7Run`) und das v8-Rezept (≈ Z. 1433, `fixtureV8Run`); dazu Hash-Pins, die nur über die Rückfaltung mit Anteil 100 gelten.
  - **S (Regel-Test, dessen Erwartung I-048 ausdrücklich ändert; nur mit Ruling):** `trade.test.ts:88` (400 → 436), «AK-S2-03» in `trade.test.ts` und `tick.test.ts` (Erholung 10 → 20 Ticks, Kauf Nahrung 5: −40 → −42), `edicts.test.ts` ≈ Z. 194–216 und 395–396 (Edikt-Preise für n > 1), `tests/ui/trade.test.ts` ≈ Z. 57–65 (Knopftitel 80/64).
  - Die Liste oben ist eine Kandidatenliste. Was B3 tatsächlich rot meldet, zählt; eine Abweichung ist **kein** Stopp, solange sie in N/R/S fällt. Rückfaltungs-Fehler «Kaufanteil nicht rückfaltbar» in Vergleichshelfern wie `normalized()` (`balance-crises.test.ts:24`) sind Klasse S, wenn beide Seiten aus der neuen Ökonomie stammen. Dann gilt QA-B4: zuerst `expect(a.buyPct).toEqual(b.buyPct)` über beide verglichenen Welten, **danach** `buyPct` vor der Rückfaltung entfernen. Hashes gegen historische Stände sind R. Passt ein roter Test in **keine** Klasse: **Stopp**, Status `blocked`, Meldung an L0 über den Controller.
- [ ] **B4, Klasse R:** Die Rezept-Tests ziehen **wörtlich** aus `save.test.ts` nach `tests/sim/fixture-recipes.test.ts`, mit den nötigen Importen. Kopf der Datei (Muster `tests/ui/levelReads.test.ts`):
  ```ts
  vi.mock('../../src/sim/defs/goods', async (orig) => ({
    ...(await orig<typeof import('../../src/sim/defs/goods')>()),
    BUY_RISE: 0,
  }));
  vi.mock('../../src/sim/defs/timing', async (orig) => ({
    ...(await orig<typeof import('../../src/sim/defs/timing')>()),
    SELL_RECOVERY_INTERVAL: 10,
  }));
  ```
  In der Datei stehen nur Klasse-R-Tests (das Mock gilt für die ganze Datei). Ein Kommentar verweist auf R490 B2. Lauf: `npx vitest run tests/sim/fixture-recipes.test.ts tests/sim/save.test.ts; echo EXIT=$?` → 0. Prüfung `git diff --stat main -- tests/sim/fixtures/` → leer, die Fixtures bleiben unverändert. Eine Fixture wird nie neu erzeugt.
- [ ] **B5, Klasse S** (R505, QA-B3): Die Erwartung wird mit `buyQuote(…, rise 2, …)` neu gerechnet und als Zahl eingetragen, mit dem Kommentar «I-048 Z2» bzw. «Z5». Die Rundung bei n > 1 bleibt geprüft (z. B. Edikt Nahrung 10: 64 → 70). Ein Wechsel auf n 1 ist nur mit Begründung in der Tabelle erlaubt. Jede Änderung kommt in die Tabelle.
- [ ] **B6, Messweg AK-ZK-15** in `tests/sim/controller.ts`, ohne Sim-Schalter:
  - Ein modulweites `const surcharge = new WeakMap<World, number>()` und ein exportiertes `buySurcharge(w)`, Vorgabe 0.
  - Jeder `buy`-Aufruf in `controller.ts` läuft über einen lokalen Helfer `trackedBuy(w, g, n)`. Der Helfer liest `before = w.money`, ruft `buy`, und bei `ok` gilt `paid = before − w.money` und `base = buyQuote(GOODS[g].buy, 100, n, 0, BUY_CAP, edictPct).price`. Das ist die Messbasis laut Gate-Ruling (Empfehlung Listenpreis mit Edikt). `edictPct` = `edictBuyPct(w)`, exportiert aus `src/sim/trade.ts` (T02, QA-B5). Danach `surcharge += paid − base`. Am Ablauf ändert sich nichts (gleiche Aufrufe, gleiche Reihenfolge).
  - **Rot-Beleg (QA-B5):** Messweg und die Asserts `expect(buySurcharge(w)).toBeGreaterThan(0)` sowie `toBeLessThanOrEqual(250)` in `balance.test.ts` entstehen schon in **B1**, also vor B2. Bei `BUY_RISE` 0 ist der Messwert 0, der Test also rot; die Ausgabe kommt ins Ledger. In B7 folgt der dritte, getrennte Assert `toBe(<Festwert>)` (Toleranz 0).
- [ ] **Rückfaltungsregeln aller Stränge (Prod-B4, I048-B mergt zuletzt):** Ein Test in `tests/sim/buyPct-save.test.ts` deckt drei Fälle ab: `foldBackToV11` mit `buyPct` 101 wirft, mit `reserve` ≠ 0 wirft (I-049), mit `monument` ≠ `null` wirft (E2); bei allen Neutralwerten entsteht die v11-Form mit unveränderter Schlüsselfolge.
- [ ] **B7, Klasse N neu messen:** Die Werte werden mit `VITE_BALANCE_LOG=1 npx vitest run <datei>; echo EXIT=$?` je Datei ausgegeben und als Festwerte in die Testdateien geschrieben, in einem Zug. Die Grenzen bleiben stehen: `WIN_TICK_LIMIT` 7500, `MAX_TICKS` 9000, Geld > 0 in jedem Szenario (AK-ZK-14). Die Tabelle vorher/nachher kommt ins Ledger und in den Bericht. Kommentare mit alten Festwerten bekommen den Zusatz «vor I-048: …».
- [ ] **Grenze gerissen?** Zuerst `BUY_RISE` 2 → 1 (R487 P-1) und B7 wiederholen. AK-ZK-02/-03/-04/-05/-20/-22 gelten dann nicht mehr wörtlich; das wird mit allen Messwerten an L0 gemeldet (Status `blocked`), nicht eigenmächtig umgeschrieben. Reisst die Grenze weiter: Stopp an L0.
- [ ] **Grün gezielt (nur Umsetzer-Läufe):** `tests/sim/buyPct*.test.ts`, `defs.test.ts`, `tests/ui/trade.test.ts`, `fixture-recipes.test.ts` und **je eine** gerade bearbeitete N/S-Datei einzeln, jeweils `; echo EXIT=$?`. Keine Sammelläufe aller `balance*`. Den vollen Lauf `make check` fährt danach der Controller (Exit 0 ist Pflicht).
- [ ] `npx eslint src tests && npx prettier --check src tests; echo EXIT=$?`.

**Commits:** einzeln je Schritt: `test:` für B1, `feat:` für B2, `test: I-048 Klasse R in fixture-recipes.test.ts (alte Werte per vi.mock)`, `test: I-048 Klasse S Erwartungen nach Z2/Z5`, `test: I-048 Messweg Mehrkosten Zukauf (AK-ZK-15)`, `test: I-048 Neumessung Klasse N`.

**Review-Fokus:** Jeder geänderte Test steht in der Tabelle mit Klasse. Es gibt keine Änderung ausserhalb von N/R/S. `vi.mock` steht nur in `fixture-recipes.test.ts`. Fixtures sind unverändert. Neue Festwerte halten die Grenzen. `trackedBuy` verändert den Controller-Ablauf nicht: Zum Beweis bleibt der Zweilauf in AK-ZK-30 grün, und mit `BUY_RISE` 0 ergäbe die Messung 0 (kurz im Bericht begründen, nicht testen).
