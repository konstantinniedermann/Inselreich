# Anhang 03 — E2 bis E6: Werte, Save v8 bis v10, Regeln im Detail

Zur [Spec M12](../2026-10-05-m12-weite-welt-spec.md), Abschnitte 6–9. Werte aus dem
[Vorschlag, Anhang 01](../2026-10-05-m12-weite-welt-design/anhang-01-wirtschaft.md) §1; **neu** markiert, was dort
fehlt (Vorschlag Spec). Einheiten: Unterhalt und Steuer je 100 Ticks, Takt in Ticks. **[Tech]** = lead-tech im Plan.

## A. Werte je Eintrag in `src/sim/defs/`

| Datei          | Eintrag                                                                                                       | Wert                                                                                                                                             | Teil  |
| -------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| `goods.ts`     | `GOODS.spice`                                                                                                 | Name „Gewürz", Kauf 40, Verkauf 12, **kein** `order`                                                                                             | E3    |
| `goods.ts`     | `GOOD_IDS`                                                                                                    | `spice` **am Ende** (Reihenfolge der übrigen 9 stabil)                                                                                           | E3    |
| `goods.ts`     | `START_STOCK.spice`                                                                                           | 0                                                                                                                                                | E3    |
| `tiers.ts`     | `TIERS[4].needs.spice`                                                                                        | 0,1                                                                                                                                              | E3    |
| `tiers.ts`     | `TIERS[4].tax`                                                                                                | 22 (vorher 20); Eskalation 24 nur per Ruling                                                                                                     | E3    |
| `buildings.ts` | `spicefarm`                                                                                                   | „Gewürzplantage", 2 × 2, Kosten 200 / 12 / 3 / 0, Takt 50, Unterhalt 15, `produces spice`, `flammable`, `stormAffected` (wie Zuckerrohrplantage) | E3    |
| `buildings.ts` | `spicefarm.site`                                                                                              | `radius grass r2 min4` + **neu** `{ kind: 'islandTrait', trait: 'spice' }`                                                                       | E3    |
| `buildings.ts` | `kontor2`                                                                                                     | Anzeige „Kontor", 2 × 2, Kosten 800 / 20 / 8 / 10 **aus dem Heimatlager**, Unterhalt 10, `supplyRadius 8`                                        | E2    |
| `buildings.ts` | `kontor2.site`                                                                                                | `coast` + **neu** `{ kind: 'foreignNoKontor' }` (Fremdinsel ohne Kontor)                                                                         | E2    |
| `unlocks.ts`   | `U6`                                                                                                          | `buildings` + `kontor2`, `spicefarm`; `goods` + `spice`; `functions` + `seafaring`                                                               | E2/E3 |
| `unlocks.ts`   | `FUNCTION_LABELS.seafaring`                                                                                   | `['Seefahrt', 'Handelsschiff']`                                                                                                                  | E2    |
| `unlocks.ts`   | `U6.tip`                                                                                                      | Zusatz „Kaufleute brauchen Gewürz von einer fernen Insel: gründe dort ein Kontor."                                                               | E2    |
| `sea.ts` (neu) | `SHIP`                                                                                                        | Kosten 1200 / 25 / 10 / 0 (Heimatlager), Unterhalt 15, Ladung 50                                                                                 | E4    |
| `sea.ts`       | `SHIP_MAX`                                                                                                    | 4                                                                                                                                                | E4    |
| `sea.ts`       | `SHIP_TICKS_PER_SEA_TILE`                                                                                     | 10                                                                                                                                               | E1/E4 |
| `sea.ts`       | `ROUTE_GOODS_PER_DIRECTION`                                                                                   | 2                                                                                                                                                | E4    |
| `sea.ts`       | `ROUTE_RESERVE`                                                                                               | Standard 10, Schritt 10, 0 … 90                                                                                                                  | E4    |
| `sea.ts`       | `ISLANDS` (A, B), `HOME_NAME`, `ISLANDS_SALT`, `ISLAND_TRIES` 50, `ISLAND_GAP_MIN` 8, `ARCHIPEL_SPAN_MAX` 300 | Anhang 02 A/B                                                                                                                                    | E1    |
| `goods.ts`     | `SPICE_GRACE_PER_HOUSE`                                                                                       | 10 (Übergangsbestand je Haus der Stufe 4 bei Migration v8 → v9, höchstens 100; R228 (6) A3)                                                      | E3    |
| `sea.ts`       | `OFFER_*` (nur E6)                                                                                            | Abschnitt G, **neu**                                                                                                                             | E6    |

`UnlockFunction` + `'seafaring'`; `SiteRule` + `islandTrait`, `foreignNoKontor`; `BuildingDefId` + `'kontor2'`,
`'spicefarm'`; `GoodId` + `'spice'`. Der Merchant-Controller (`tests/sim/merchantsController.ts`) erhält
`feedSpice`; das ist Testhelfer, kein Spielwert.

## B. Save v8, v9, v10 (R228 (3))

Jede Zustandsänderung bekommt je Merge eine eigene `SAVE_VERSION` (F-S1); die Kette v1 → … → aktuelle Version läuft
für jeden alten Stand. Fixture der Vorgängerversion je Version als erster Commit der jeweiligen Branch.

| Version | Merge                                                                | Neue Felder                                                                                                                 | Fixture (erster Commit)             |
| ------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| v8      | E1                                                                   | `islands[i]` + `kind`, `ox`, `oy`, `anchor`; `kontorId` `number \| null`; Fremdinseln A, B                                  | `save-v7.json` (E1-Branch)          |
| v9      | Seefahrt-Bündel E2 + E3 + E4, ein Merge über eine Integrationsbranch | `crisis.tile.island`; `spice` in jedem `islands[i].stock` und in `sellPct`; `ships`, `nextShipId`; `wonSpice` (Anhang 05 E) | `save-v8.json` (Integrationsbranch) |
| v10     | E6 (nur bei Aufnahme)                                                | `offer: Offer \| null`                                                                                                      | `save-v9.json` (E6-Branch)          |

`Ship = { id, port, to, left, cargo, route, homing }`: `port` Inselindex des letzten Hafens; `to` Zielinsel oder
`null` (liegt im Hafen); `left` Restticks ≥ 0; `cargo` Gut → Menge (Ganzzahl ≥ 1, Summe ≤ 50); `route`
`{ a, b, ab: RouteGood[], ba: RouteGood[] } | null`; `RouteGood = { good, reserve }`; `homing` boolean.

**Migration v7 → v8:** Fremdinseln A, B aus `world.seed` (Anhang 02 B, `kontorId null`, Lager mit allen Gütern 0);
Heimat `kind 'home'`, `ox = oy = 0`, `anchor` nach Regel; `version 8`.

**Migration v8 → v9:** `spice` 0 in jedem Insellager, `sellPct.spice` 100; `crisis.tile.island = 0`; `ships []`,
`nextShipId 1`; **Übergangsbestand Gewürz** (Abschnitt D): Heimatlager Gewürz = Minimum aus 100 und `SPICE_GRACE_PER_HOUSE`
× Zahl der Häuser der Stufe 4; `version 9`. Die Ladefunktion meldet dazu einmalig einen Hinweis (D).

**Migration v9 → v10:** `offer null`; `version 10`.

**Ladeprüfung** (sonst „Beschädigter Spielstand"), je Version zusätzlich zu allen früheren:

- **v8:** `islands.length = 1 + ISLANDS.length` (= 3), `kind` in `ISLANDS`-Reihenfolge; Grösse je Insel ≤
  Höchstgrösse; `kontorId` der Heimat ist eine Zahl; `kontorId` einer Fremdinsel ist `null` oder verweist auf ein
  `kontor2` dieser Insel. Gebäude auf einer Insel ohne Kontor sind **erlaubt** (nach Abriss von `kontor2`; R228 (1)).
- **v9:** `ships.length ≤ SHIP_MAX`; je Schiff `port` ein **gültiger Inselindex** (ohne Bedingung an ein Kontor,
  R228 (1)); `to` `null` oder eine Insel mit Kontor; `left` ≤ Fahrzeit `port → to`; `cargo` ganzzahlig, Summe ≤ 50;
  Route `a ≠ b`, beide mit Kontor, je Richtung ≤ 2 Güter, kein Gut doppelt oder in beiden Richtungen, `reserve` ∈
  {0, 10, …, 90}; `homing` ⇒ `route null`; `nextShipId` > jede `id`.
- **v10:** `offer` `null` oder Kontor-Insel mit Kontor, Gut freigeschaltet, Menge 1 … 20, `due` ≥ `tick`.

## C. E2: Kontor II, Bauen, Handel, Aufträge, Bilanz, Krisen, Bedienung

1. **Aktive Insel** (UI-Zustand, nicht im Save): die Insel, deren Rechteck die Bildmitte enthält; sonst die nächste
   (Mitte zu Mitte, bei Gleichstand kleinerer Index). Lagerleiste, Warenbilanz, Auftragskarte „Liefern" und
   Bauleiste beziehen sich auf sie; die Lagerleiste zeigt den Namen davor („Felsbucht · …").
2. **Bauen auf einer Fremdinsel:** ohne Kontor ist nur `kontor2` baubar, jedes andere Werkzeug nennt „Erst ein Kontor
   auf dieser Insel". `kontor2` braucht `seafaring`; Grund vorher: „Seefahrt mit den Kaufleuten". Kosten aus dem
   **Heimatlager** (Ausnahme zu R-E0-3), Geld global; fehlt dort Ware: „Nicht genug <Gut> in der Heimat". Danach
   zahlt jeder Bau auf der Insel Waren aus deren Lager; fehlt dort Ware: „Nicht genug <Gut> auf <Name>".
   Anbindung: Wege zum Kontor der eigenen Insel.
3. **Abriss `kontor2`:** gesperrt, solange eine Route die Insel als `a` oder `b` nutzt oder ein Schiff sie als `to`
   hat: „Erst Route auflösen". Sonst wie heutiger Abriss, Erstattung ins Heimatlager; das Insellager bleibt erhalten
   (unerreichbar), ein neues Kontor übernimmt es. Gebäude der Insel bleiben stehen und werden `notConnected`. Ein
   Schiff, dessen letzter Hafen (`port`) diese Insel war, bleibt gültig.
4. **Handel** an jedem Kontor: Kauf bucht ins Lager dieser Insel (Grenze 100), Verkauf entnimmt dort; `sellPct` ist
   global je Gut (Verkauf an zwei Kontoren senkt denselben Preis).
5. **Aufträge:** `deliverOrder(world, insel)` liefert aus dem Lager dieser Insel, Prämie global; ohne genug Ware dort:
   „Nicht genug Ware auf <Name>"; Insel ohne Kontor: „Kein Kontor auf <Name>". Auftragsziehung unverändert.
6. **Bilanz und Dämpfung je Insel:** `goodsBalance(world, insel)` zählt nur Betriebe und Häuser dieser Insel; der
   Defizit-Check beim Hausaufstieg nimmt die Bilanz der Insel des Hauses.
7. **Brandziel über alle Inseln ohne zusätzliche Ziehung:** Die Rechtecke der brennbaren Gebäude je Insel (nur
   Inseln mit solchen) werden in Inselreihenfolge **untereinander** gelegt: Breite = grösste Breite, Höhe = Summe.
   `rollCrisis` zieht wie heute `x` und `y` in diesem Gesamtrechteck; die Kachel wird auf (Insel, x, y) zurückgerechnet;
   liegt sie rechts ausserhalb des Inselrechtecks, ist es ein Fehlschlag (`miss`, wie heute ohne Gebäude). Nur Heimat
   brennbar → Gesamtrechteck = heutiges Rechteck, Ziehung bitgleich. Feuerwache schützt nur auf der eigenen Insel.
8. **Sturm** wirkt auf alle Inseln, **Boom** global (Preis). Boom-Gut aus dem Auftragspool → nie Gewürz.
9. **Freischaltung:** U6 bringt die Inhalte aus A; `unlocked` bleibt `['U0', …, 'U6']` wie heute, `deriveUnlocks`
   unverändert.
10. **Kamerasprung** ab `seafaring`: Taste `0` → Heimat; Taste `9` → nächste Insel reihum (Heimat, Möweninsel, Felsbucht, Heimat);
    Knopf „Inseln" in der Kopfzeile: Klick 1 öffnet die Inselliste, Klick 2 auf einen Eintrag springt (2 Klicks je
    Ziel, gezählt wie AK-E4-13). Ziel: Kontor der Insel, sonst
    Rechteckmitte; Zoom bleibt. Vor U6 sind Taste stumm und Knopf verborgen. Bei offener Karte stumm wie alle Kürzel.
11. **Hilfe/Chronik:** nächster Schritt nach U6 „Gründe ein Kontor auf einer Insel mit Gewürz", bis ein `kontor2`
    steht.
12. **Unversorgte Häuser auf Fremdinseln:** heutige Regel unverändert (zahlen unversorgt halb, kein Wachstum); der
    Fall ist als Beobachtung eingetragen (Vorschlag §7, Anhang 01 „Ausserhalb Scope"), keine Änderung in M12.

## D. E3: Gewürz und Kaufleute

- Gewürzplantage nur auf Inseln mit `spice`; Grund sonst „Hier wächst kein Gewürz". Liefert ins Lager ihrer Insel.
- Kaufleute verbrauchen 0,1 Gewürz je Einwohner und 100 Ticks; fehlt es, gilt die heutige Regel (unerfüllt: halbe
  Steuer, Schrumpfen um eins je Wachstumstakt bis 1). Chip „Gewürz" in der Lagerleiste ab U6 oder sobald Gewürz > 0 (wie Glas).
- **Controller `feedSpice`** (Testhelfer): kauft am Heimatkontor 1 Gewürz vor dem ersten Aufstieg 3 → 4 und hält
  danach den Bestand ≥ Bedarf der nächsten 100 Ticks (aufgerundet), nach dem Muster `feedGlassworks`. Er baut keine
  Insel, kein Kontor, kein Schiff.
- **Neumessung (bewusster Bruch, R226 F-03):** `balance-merchants` Pins `wonMerchantsTick` und `minMoneyAfterWin` neu
  messen und mit Befehl und Commit pinnen; `winTick` 6750 bleibt. Erwartet ≈ 11 200 → ≤ 12 000 (Vorschlag §10).
- **Eskalation:** `wonMerchantsTick > MERCHANT_TICK_LIMIT` (12 000) oder `minMoneyAfterWin ≤ 0` → Stufe 1: Steuer
  Kaufleute 24, Neumessung; noch immer über 12 000 → Stufe 2: `MERCHANT_TICK_LIMIT` 13 000, Neumessung. Jede Stufe
  nur mit Ruling L0, kein stilles Nachstellen.
- **Alte Pins, die E3 bewusst ändert** (R226 F-03, R228 (6) A2; Neupin mit Befehl und Commit, kein Test gelöscht):

  | Pin                   | Datei                                          | Grund                                                                  |
  | --------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
  | M8:AK-S1-01           | `defs.test.ts`                                 | `TIERS[4]` mit `needs.spice` und Steuer 22                             |
  | M8 defs „8 Güter"     | `defs.test.ts` (`GOOD_IDS` 9, letztes `glass`) | 10 Güter, letztes `spice`                                              |
  | M8:AK-S1-05           | `merchants.test.ts`                            | Steuer nach Aufstieg (300) mit Satz 22                                 |
  | M8:AK-S1-07, -08, -10 | `merchants.test.ts`                            | Wachstum braucht Gewürz; halbe Steuer mit Satz 22 (Plan prüft je Test) |
  | M8:AK-B2-01           | `scenario-saves.test.ts` (Kaufleute-Szenarien) | Gewürz im Szenario oder neuer Erwartungswert                           |
  | M8:AK-B1-01, -02, -04 | `balance-merchants.test.ts`                    | grün mit `feedSpice`, Werte neu                                        |
  | M11:AK-BAS-02         | `balance-merchants.test.ts`                    | `[6750, 11200, 320]` → neu gemessen                                    |
  | M12:AK-E0-18          | `balance-merchants.test.ts`                    | dito; gilt bis zum v9-Merge                                            |

- **Alte Pins, die E2 bewusst ändert** (R226 F-03, R230 B1; Neupin im Seefahrt-Bündel v9 mit Befehl und Commit):

  | Pin          | Datei                                     | Grund                                                                     |
  | ------------ | ----------------------------------------- | ------------------------------------------------------------------------- |
  | M8:AK-S1-01  | `unlocks.test.ts` (U6-Zeile)              | U6 bringt zusätzlich `kontor2`, `spicefarm`, `spice` und `seafaring`      |
  | M11:AK-U1-08 | `tests/ui/goal.test.ts` (`UNLOCK_NOTICE`) | „nur U6 = M8-Text" gilt nicht mehr; neuer U6-Text unten, wörtlich gepinnt |

- **U6-Meldungstext** (Entscheid lead-design, R230 B1): `UNLOCK_NOTICE` in `src/ui/goal.ts` wird zu
  „Neu freigeschaltet: Badehaus (J), Glashütte (O) und Seefahrt (Inseln: 9) — deine Bürger wollen Kaufleute werden;
  Kaufleute brauchen Gewürz von fernen Inseln". Namen, Tasten und Stufen kommen wie heute aus den Defs
  (`withKey`, `TIERS`, `GOODS.spice.name`, Label `seafaring` aus `FUNCTION_LABELS`, Taste aus `hotkeyLabel`); der
  Text oben ist der erwartete Wortlaut mit den heutigen Tasten. README (Abschnitt Ziel) zitiert ihn mit dem v9-Merge.

- **Alte Spielstände mit Kaufleuten** (Spielurteil lead-design, R228 (6) A3): Die Migration v8 → v9 legt einmalig
  `min(100, SPICE_GRACE_PER_HOUSE × Häuser der Stufe 4)` Gewürz ins Heimatlager. Beim Laden erscheint einmalig die
  Meldung „Deine Kaufleute wünschen jetzt Gewürz — kaufe es am Kontor oder gründe ein Kontor auf einer
  Gewürzinsel." **[Tech]** als Ergebnis der Ladefunktion (z. B. Feld `notice` im `LoadResult`), nicht im Save.
  Sonst gilt die heutige Regel; U6 ist in solchen Ständen schon erreicht, Seefahrt und Plantage sind sofort
  verfügbar, `wonMerchants` bleibt. Begründung: weicher Übergang statt plötzlicher Verlust; Zukauf zu 40 hält
  Kaufleute über Bürger-Niveau (+9,5 je Einwohner und 100 Ticks), kein Bankrott. Stand ohne Kaufleute: Bestand 0,
  keine Meldung.

## E. E4: Schiffe und Routen (Ablauf, ganzzahlig, ohne Zufall)

**Kauf:** am Heimatkontor, braucht `seafaring`, `ships.length < 4`, Kosten aus Heimatlager und Geld; neues Schiff
`port 0`, `to null`, `route null`, leer. Gründe: „Höchstens 4 Schiffe", „Zu wenig Geld", „Nicht genug Holz" usw.
**Unterhalt:** 15 je Schiff und 100 Ticks über die heutige Unterhaltsbuchung (`upkeepCarry`), auch bei Geld < 0.
**Ausmustern** (Setzung Spec, damit Unterhalt endet): nur liegend in der Heimat, ohne Route und leer; keine
Erstattung.

**Route anlegen** `setRoute(world, shipId, route)`: Schiff liegt (`to null`) und hat keine Route; `a ≠ b`, beide
mit Kontor; je Richtung ≤ 2 Güter, mindestens 1 Gut insgesamt; kein Gut in beiden Richtungen; Reserve gültig. Danach
gilt das Schiff als „Umschlag fällig" im Hafen `port`.

**Schritt `tickShips`** in `step` nach `tickProduction`, vor `tickPopulation` (also vor Verbrauch und Steuer);
Schiffe in `id`-Reihenfolge:

1. Fährt das Schiff (`to ≠ null`): `left −= 1`; bei `left = 0` → `port = to`, `to = null`, Ankunft.
2. Ankunft/fällig im Hafen `P` mit Route: Liegt `P` nicht auf der Route (Anfahrt), keine Umladung, Abfahrt nach `a`.
   Sonst `Q` = andere Seite;
   - **Entladen:** jedes Gut an Bord, das nicht in der Liste `P → Q` steht, in `GOOD_IDS`-Reihenfolge
     `n = min(cargo[g], 100 − stock_P[g])`. Rest bleibt an Bord und wird bei der nächsten Ankunft in `P` zuerst
     entladen (auch Güter, die aus der Route genommen wurden).
   - **Laden** Richtung `P → Q` (Liste `L`, `k = |L|`): `frei = 50 − Σ cargo`; verfügbar `v_g` = Bestand in `P` minus Reserve, mindestens 0. Durchgang 1: je Gut in Listenreihenfolge `min(v_g, ⌊frei / k⌋)`; Durchgang 2: je Gut in
     Listenreihenfolge, was noch geht, bis `frei` erschöpft.
   - **Abfahrt** im selben Tick: `to = Q`, `left = 10 × d(P, Q)`. **Nie warten**, auch leer.
3. **Route auflösen** `clearRoute(world, shipId)`: `route = null`, `homing = true`. Das Schiff beendet die laufende
   Fahrt ohne Umladung; liegt das Ziel nicht in der Heimat, fährt es weiter zur Heimat. In der Heimat: jedes Gut in
   `GOOD_IDS`-Reihenfolge bis 100 entladen, Rest verfällt mit Meldung „<n> <Gut> verloren"; `homing = false`. Liegt
   das Schiff beim Auflösen, gilt dasselbe ab sofort (in der Heimat: entladen im nächsten `tickShips`).
4. Route ändern (Güter, Reserve) während der Fahrt: wirkt ab der nächsten Umladung.

## F. E4: Bedienung im Kontor-Panel

- Neuer Abschnitt **„Schiffe"** im Kontor-Panel (jedes Kontor): je Schiff mit Bezug zu diesem Kontor eine Zeile
  (Ladung, Ziel, Restzeit m:ss, Route „Heimat ⇄ Felsbucht: Gewürz →, ← Werkzeug"); am Heimatkontor „Handelsschiff
  kaufen (1200 · 25 Holz · 10 Werkzeug)".
- **Route in 2 Klicks:** Knöpfe „Route nach <Name>" je anderem Kontor (nur wenn ein Schiff in der Heimat liegt und
  frei ist, sonst blass mit Grund „Kein freies Schiff"). **Klick 1** auf „Route nach Felsbucht" öffnet im Panel eine
  Güterauswahl mit zwei Gruppen „Holen (Felsbucht → hier)" und „Bringen (hier → Felsbucht)" mit allen
  freigeschalteten Gütern; Güter mit Bestand > Reserve auf der Quellseite stehen zuerst. **Klick 2** auf ein Gut legt
  die Route an (Schiff = freies Schiff mit kleinster `id`, Reserve 10) und schliesst die Auswahl; das Schiff ist im
  nächsten Tick unterwegs.
- Weitere Güter, Reserve (Schritte 10) und „Route auflösen" stehen in der Schiffszeile (beliebig viele Klicks).
  Ein Gut, das in der Gegenrichtung schon fährt, ist blass („Fährt schon in Gegenrichtung").
- Schiffe auf See: Mouse-over „Handelsschiff · Ladung · nach <Name> · m:ss"; Klick öffnet die Schiffszeile im Panel
  des Heimatkontors.

## G. Kann-Teile

**E5 Seekarte und Gründungsfahrt** (UI/Render, kein Sim-Zustand): Kleine Karte im Knopf „Inseln" mit Silhouetten aller
Inseln (aus `tiles`, je Insel einmal gerastert), Fahrlinien und Schiffspunkten; Klick auf eine Insel springt. Nach
dem Bau eines `kontor2` fährt einmalig ein Schiff-Sprite von der Heimat zum Anker der Insel (Dauer `10 × d` Ticks,
nur Darstellung, UI-Zustand, nicht im Save; nach Laden entfällt sie).

**E6 Händlerschiff mit Angebot** (I-006): eigener Strom `createRng((seed ^ Math.imul(k + 1, OFFER_SALT)) >>> 0)` je
Periode `k` (Muster ADR-010), keine Ziehung in Auftrags- oder Krisenstrom. **neu, Vorschlag Spec,
design-economy-designer bestätigt im Gate Spec:** Periode `k` beginnt bei `OFFER_FIRST_TICK` (3600) +
`k × OFFER_PERIOD` (3000); angeboten nur mit `seafaring`, sonst entfällt die Periode ohne Ziehung; `OFFER_DURATION` 600, `OFFER_MAX` 20,
`OFFER_DISCOUNT_PCT` 20 (Preis `⌊Kauf × 0,8⌋`). Ziehung: Kontor (unter allen Kontoren), Gut (freigeschaltete Güter
mit Kaufpreis), Menge 10–20. `offer = { kontor, good, amount, price, due }`; Kauf ganz oder teilweise am genannten
Kontor ins dortige Lager; verfällt bei `tick > due`. Darstellung: Händlerschiff liegt sichtbar am Kontor. Controller
kauft nie → Baselines unberührt.
