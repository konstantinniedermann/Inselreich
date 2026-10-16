# T01 Sim: Vorliebe in Defs und Erlös (AK-IM-01…11)

Persona `tech-sim-engineer`, Modell sonnet, Worktree `.worktrees/i092-impl`. Dateien (nur diese): `src/sim/defs/sea.ts`,
`src/sim/trade.ts`, neu `tests/sim/inselmarkt.test.ts`. Spec Teil B.2/B.7, R608, R609. Nicht anfassen: `save.ts`, `types.ts`,
`balance.test.ts`, `tests/sim/controller.ts`, `trade.test.ts`, UI.

## Schritte

- [ ] **1. Test zuerst** `tests/sim/inselmarkt.test.ts` (Testwelten wie `trade.test.ts`/`seaHelpers.ts`: `seaWorld`,
      `foundKontor2Literal`; Insel mit `kind` C/B/A über `world.islands`). Roter Lauf belegen (`EXIT=1`).
  - AK-IM-01 `PREFER_PCT === 130`; `prefers` A `['cloth']`, C `['glass']`, B `['rum']`.
  - AK-IM-02 Invarianten über `ISLANDS`: höchstens ein `prefers`; `GOODS[g].sell > 6`; nicht `spice`; **Kette von `g`**
    (Erzeuger von `g`, rekursiv Erzeuger der Eingänge aus `BUILDING_DEFS`, **mit besuchter Menge** gegen Zyklen) enthält keinen
    Betrieb aus `TRAIT_BUILDINGS[t]` der Traits derselben Insel; Kaufgrenze
    `max(BOOM_PCT, PREFER_PCT) · sell < minBuyFactor · buy`, wobei `minBuyFactor = Math.min(...Object.values(EDICTS).map(e => e.buyFactorPct))`
    aus `defs/edicts.ts` (**nicht 80 hartkodiert**). Gegenproben: Stoff auf Weidenau, Glas auf Felsbucht verletzen die
    Kettenregel; Gegenprobe **Edikt Handel + Boom** (`buyFactorPct` 80, Faktor 150): Rum 27 < 32, Glas 30 < 40, Stoff 18 < 24.
  - AK-IM-03 `sellPrice(w,'glass',1,weidenau)` 26; 10 → 248; 50 → 981; Stoff Möweninsel 1 → 15; Rum Felsbucht 1 → 23;
    `sell(w,'glass',10,weidenau)` erhöht `money` um 248; per Route über `tickShips` entladenes Glas (Lager Felsbucht → Schiff → Lager
    Weidenau; Ware hat keine Herkunft) erlöst in Weidenau 248 für 10.
  - AK-IM-04 Heimat bitgleich: je Gut, `n ∈ {1,10,50}`, `sellPct ∈ {100,30}`, mit/ohne Boom:
    `sellPrice(w,g,n) === sellPrice(w,g,n,HOME)` === im Test ausgeschriebene Referenz der alten Formel (1 Glas 20, 10 → 191, 50 → 755).
  - AK-IM-05 Kein Vorliebe-Gut: 1 Glas Felsbucht 20, Möweninsel 20; 10 Stoff Weidenau = 10 Stoff Heimat.
  - AK-IM-06 Boom Rum: Rum Felsbucht 27 (nicht 35), Heimat 27; Glas Weidenau 26; Boom Glas: Glas Weidenau 30.
  - AK-IM-07 Sättigung global: `sell` 10 Glas Weidenau → `sellPct.glass` 90; 1 Glas Heimat danach `money` +18; Boden 30 → 7, bleibt 30.
  - AK-IM-08 `serialize(w)` vor/nach `sellPrice` mit Inselargument gleich.
  - AK-IM-09 Weidenau ohne Kontor `fail('Kein Kontor auf Weidenau')`; leeres Lager `fail('Nicht genug Ware')`; Insel 99
    `fail('Unbekannte Insel')`; `serialize` unverändert, keine Ausnahme.
  - AK-IM-10 `SAVE_VERSION` gegen die **Konstante** (nie Zahl) vor dem Paket; Fixture `tests/sim/fixtures/save-v12-felsbucht.json` lädt
    ok; **danach** im Test Kontor Felsbucht (falls keins), 1 Rum ins Felsbucht-Lager, `sellPct.rum` 100 → `sell(..., felsbucht)` +23.
  - `prefersGood` unbekannte Insel (`island` 99, `kind` undefined) → `false`, wirft nicht.
- [ ] **2. Umsetzung** `defs/sea.ts`: `IslandDef.prefers` (Pflichtfeld, `GoodId`-Import prüfen, kein Importzyklus),
      `PREFER_PCT = 130` exportiert, `prefers` je `ISLANDS`-Eintrag. `trade.ts`: `prefersGood` exportieren (nutzt
      `world.islands[island]?.kind`, kein Indexzugriff ohne `?.`); `sellPrice` ab Zeile 74 mit `island = HOME` und
      `Math.max(boom, prefer)` (O-1); `sell` (Zeile ~146) ruft `sellPrice(world, good, n, island)`. Kommentar: Boom und Vorliebe
      stapeln nicht.
- [ ] **3. Grün:** `npx vitest run tests/sim/inselmarkt.test.ts tests/sim/trade.test.ts tests/sim/defs.test.ts tests/sim/buyPct.test.ts tests/sim/edicts.test.ts tests/sim/scenario-saves.test.ts; echo EXIT=$?`
      und `npx tsc --noEmit; echo EXIT=$?`. Neue Datei einzeln ×3 mit Dauer melden.
- [ ] **4. Commit** `feat: Inselmarkt-Vorliebe in Defs und Erlös (I-092)`; Diff-Prüfung `git diff plan/i092 --stat` zeigt nur die drei Dateien.

Beleg AK-IM-10 (R610 5): `git diff main -- src/sim/save.ts src/sim/types.ts` leer.

Fertig, wenn: AK-IM-01…10 grün, AK-IM-11 (`balance.test.ts` grün, kein Diff an Controller) vom Controller geprüft.
