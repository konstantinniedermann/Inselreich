# Anhang 04 — Abnahmekriterien E1 bis E6 (vollständig)

Zur [Spec M12](../2026-10-05-m12-weite-welt-spec.md). Die Hauptdatei nennt je Teil die wichtigsten AK; hier stehen
alle. Vitest in CI (`make test`), „neu" = neue Datei. Browser-Checks bei 1280 × 800 und 1920 × 1080, Tempo 1,
Seed 3 mit „Alles frei", wenn nicht anders genannt. Verweise auf Regeln: Anhang 02 (E1), Anhang 03 (E2–E6).

## Gemeinsam: Bitgleichheit E1, E2, E4 (je Teil nach dem Merge zu prüfen)

- **AK-M12-B1** `tests/sim/balance.test.ts` unverändert (Git-Diff leer) und grün in jedem Teil, auch nach E3.
- **AK-M12-B2** `balance-crises`: `OFF_REFERENCE` (6750, `minMoney` 117, `endMoney` 339, 350/4150, Gebäudezahlen),
  `OFF_FINGERPRINT 0x701c6da5`, „normal" + Feuerwache 7850, „mild" 7850, M6:AK-B2-05/06 unverändert. Erlaubt ist nur
  die Erweiterung von `normalized()`: Der Fold-back entfernt zusätzlich `islands[1…]`, je Insel `kind`, `ox`, `oy`,
  `anchor`, `ships`, `nextShipId`, `offer`, `crisis.tile.island`, `stock.spice`, `sellPct.spice`. Kein anderer
  Pin ändert sich.
- **AK-M12-B3** `balance-merchants` `[6750, 11200, 320]` unverändert nach E1, E2, E4, E5, E6 (Bruch nur durch E3,
  AK-E3-05).
- **AK-M12-B4** Krisen- und Auftragsfolge (AK-E0-19) unverändert in allen Teilen; Fremdinsel-Generator und E6
  ziehen nur aus ihren eigenen Strömen.

## E1 — Fremdinseln, Archipel, Render

| AK       | Prüfung                                                                                                                                                                                  | Datei                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| AK-E1-01 | Seeds 1 … 200: je Fremdinsel Grösse ≤ Höchstgrösse, `traits` nach Tabelle, alle Garantien (Plätze per `canPlace`), Heimat nie `spice`                                                    | `tests/sim/islands-gen.test.ts` neu |
| AK-E1-02 | Seeds 1 … 200: Rechtecke ohne Überlappung, Abstand ≥ 8; `d(0, i)` im Band; keine Fahrlinie schneidet ein fremdes Inselrechteck; Rahmen `W + H ≤ 440`                                     | `islands-gen.test.ts`               |
| AK-E1-03 | Gleicher Seed → gleiche Fremdinseln (zwei `createWorld`); Heimat-Kacheln gleich `generateMap(seed)`; Auftrags- und Krisenziehungen gleich ohne/mit Generator (Spy auf `createRng`-Seeds) | `islands-gen.test.ts`               |
| AK-E1-04 | Ersatzform: Generator mit erzwungenem Fehlschlag (Testnaht) liefert nach 50 Versuchen die Ersatzform mit allen Garantien                                                                 | `islands-gen.test.ts`               |
| AK-E1-05 | Save v8: `createWorld(3)` hat `1 + ISLANDS.length` Inseln, Fremdinseln `kontorId null`, Lager 0; `save-v7.json` lädt, Fremdinseln gleich `createWorld(seed)`; Round-trip zeichengleich   | `tests/sim/save.test.ts`            |
| AK-E1-06 | Ladeprüfung v8 einzeln „Beschädigter Spielstand" (Liste Anhang 03 B, mindestens 12 Fälle); `version 9` → „Unbekannte Version"                                                            | `save.test.ts`                      |
| AK-E1-07 | Culling: Kamera über der Heimat bei Zoom 1 → `visibleIslands` = [0]; Kamera auf offenem Meer zwischen Inseln → []; Zoom 0,125, Rahmenmitte → alle; Inselrand halb im Bild → enthalten    | `tests/render/archipel.test.ts` neu |
| AK-E1-08 | `visibleTileRange` je Insel in Inselkoordinaten; Heimat bei Versatz 0 gleich heutigem Ergebnis für 20 Kamerastellungen                                                                   | `archipel.test.ts`                  |
| AK-E1-09 | Picking: Mitte einer Landkachel jeder Insel → `(insel, x, y)`; Punkt im offenen Meer → `null`; Heimat-Picking gleich heute (Gitter 50 Punkte)                                            | `archipel.test.ts`                  |
| AK-E1-10 | Zeichnen gegen `fakeCtx`: nur Heimat sichtbar → Aufrufliste der Heimat gleich `main` (gleiche Kamera); unsichtbare Insel erzeugt keinen Aufruf                                           | `tests/render/archipel.test.ts`     |
| AK-E1-11 | Cache-Plan: Erstbild rastert nur die Heimat; Leerlauf-Aufrufe rastern A, B, C je einmal in dieser Reihenfolge; sichtbare Insel ohne Cache wird im selben Frame gerastert (Fake-Uhr)      | `tests/render/terrain.test.ts`      |
| AK-E1-12 | Streichvariante B: `ARCHIPEL_VIEW 'jump'` → `visibleIslands` nur aktive Insel, kein Meer-Aufruf; `git diff` des Rückfalls berührt nur `src/render/`                                      | `archipel.test.ts`, Review          |
| AK-E1-13 | Zoom: `ZOOM_STEPS` = 0,125 … 2; Mausrad erreicht 0,125; Kamera-Grenze = Rahmen + 8                                                                                                       | `tests/render/camera.test.ts`       |
| AK-E1-14 | **Render R1:** `perf.mjs` A = main, B = E1, Zoom 1, `--focus home`, Seeds 14 und 3: `renderMedian` B − A ≤ +0,2 ms                                                                       | Browser-Messung, Ergebnis im PR     |
| AK-E1-15 | **Render R2:** Heimat-`buildMs` B ≤ 1,3 × A                                                                                                                                              | Browser-Messung                     |
| AK-E1-16 | **Render R3:** B bei Zoom 0,125, `--focus archipel` ≤ 2 × B bei Zoom 1 `--focus home` (Vorschlag, lead-art bestätigt im Gate Spec)                                                       | Browser-Messung                     |
| AK-E1-17 | Sichtprüfung: Meer ohne Kante zum Inselrand bei Zoom 1; alle Inseln bei 0,125 in 1920 × 1080 sichtbar; Mouse-over Insel zeigt Name, Grösse, Merkmale, Fahrzeit                           | Browser-Check                       |

## E2 — Kontor II, Bauen auf Fremdinseln, Seefahrt

| AK       | Prüfung                                                                                                                                                                                                                                                | Datei                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| AK-E2-01 | Vor `seafaring`: `kontor2` auf Fremdinsel → „Seefahrt mit den Kaufleuten"; danach `ok`, zahlt 800 / 20 / 8 / 10 aus Heimatlager; zweites Kontor gleiche Insel → Grund; auf der Heimat → Grund                                                          | `tests/sim/kontor2.test.ts` neu           |
| AK-E2-02 | Fremdinsel ohne Kontor: jedes andere Gebäude → „Erst ein Kontor auf dieser Insel"; mit Kontor: Bau zahlt Waren aus dem Insellager, Anbindung über Wege zum eigenen Kontor                                                                              | `kontor2.test.ts`                         |
| AK-E2-03 | Abriss `kontor2` mit Route oder Schiff `to` → „Erst Route auflösen"; ohne: Erstattung ins Heimatlager, Insellager bleibt, Gebäude `notConnected`; neues Kontor übernimmt das Lager                                                                     | `kontor2.test.ts`                         |
| AK-E2-04 | Handel am Kontor einer Fremdinsel: Kauf bucht dort (Grenze 100); Verkauf von 10 an Heimat und 10 an Insel senkt `sellPct` um 20 Punkte (global)                                                                                                        | `tests/sim/trade.test.ts`                 |
| AK-E2-05 | Auftrag an Fremdkontor geliefert aus dessen Lager, Prämie global; zu wenig dort → „Nicht genug Ware auf <Name>", obwohl die Heimat genug hat                                                                                                           | `tests/sim/orders.test.ts`                |
| AK-E2-06 | `goodsBalance(world, insel)` zählt nur die Insel; Defizit auf Insel 1 verzögert keinen Aufstieg auf Insel 0 und umgekehrt                                                                                                                              | `tests/sim/flow.test.ts`                  |
| AK-E2-07 | Brand: nur Heimat brennbar → Ziel gleich heute für 30 Perioden (Seeds 1, 3, 42); Heimat und Insel brennbar → Gesamtrechteck untereinander, Ziel auf Insel 1 möglich, je Periode genau 2 Ziehungen nach der Art; `crisis.tile.island` gesetzt           | `tests/sim/fire.test.ts`                  |
| AK-E2-08 | Sturm halbiert Produktion auf Fremdinseln; Feuerwache schützt nur ihre Insel                                                                                                                                                                           | `tests/sim/storm.test.ts`, `fire.test.ts` |
| AK-E2-09 | U6 bringt `kontor2`, `seafaring` (und mit E3 `spicefarm`, `spice`); `unlocked` nach U6 gleich wie vor M12; `deriveUnlocks` auf `save-v7.json` gleich                                                                                                   | `tests/sim/unlocks.test.ts`               |
| AK-E2-10 | Aktive Insel: Bildmitte in Rechteck → diese Insel; auf Meer → nächste; Gleichstand → kleinerer Index (reiner Helfer)                                                                                                                                   | `tests/ui/activeIsland.test.ts` neu       |
| AK-E2-11 | Browser: Kamera auf Felsbucht → Lagerleiste „Felsbucht · …" mit deren Lager; Taste `0` springt zur Heimat, `9` reihum; Knopf „Inseln" mit 1 Klick zum Ziel; vor U6 Taste stumm, Knopf verborgen; Mouse-over vor U6 nennt „Seefahrt mit den Kaufleuten" | Browser-Check                             |

## E3 — Gewürz

| AK       | Prüfung                                                                                                                                                                                                        | Datei                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| AK-E3-01 | Werte aus Anhang 03 A: `GOODS.spice` 40 / 12 ohne `order`; `GOOD_IDS` endet auf `spice`, die ersten 9 unverändert; `TIERS[4]` `needs.spice` 0,1, `tax` 22; `spicefarm` Kosten, Takt, Unterhalt                 | `tests/sim/defs.test.ts`              |
| AK-E3-02 | Plantage auf Insel ohne `spice` und auf der Heimat → „Hier wächst kein Gewürz"; auf A/B mit 4 Gras im Radius 2 → `ok`; liefert 1 je 50 Ticks ins Insellager                                                    | `tests/sim/spice.test.ts` neu         |
| AK-E3-03 | Kaufmannshaus 20 EW verbraucht 2 Gewürz je 100 Ticks; ohne Gewürz unerfüllt, halbe Steuer; mit allem Steuer 22 je EW                                                                                           | `spice.test.ts`, `taxes.test.ts`      |
| AK-E3-04 | Auftragspool und Boom-Pool enthalten nie `spice` (alle Stufen); `orderForPeriod` für Seeds 1, 3, 42 × k 0 … 19 gleich vor E3                                                                                   | `tests/sim/orders.test.ts`            |
| AK-E3-05 | **Bewusster Bruch (R226 F-03):** Controller mit `feedSpice`; `winTick` 6750; `wonMerchantsTick` ≤ 12 000 und `minMoneyAfterWin` > 0 neu gepinnt mit Befehl und Commit; Eskalation nur per Ruling (Anhang 03 D) | `tests/sim/balance-merchants.test.ts` |
| AK-E3-06 | Save: v7 → v8 setzt `spice` 0 in jedem Insellager und `sellPct.spice` 100                                                                                                                                      | `save.test.ts`                        |

## E4 — Schiffe und Routen

| AK       | Prüfung                                                                                                                                                                    | Datei                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| AK-E4-01 | Kauf: zahlt 1200 / 25 / 10 aus Heimat; fünftes Schiff → „Höchstens 4 Schiffe"; ohne `seafaring` → Grund; Geld < 1200 → Grund                                               | `tests/sim/ships.test.ts` neu       |
| AK-E4-02 | Unterhalt: 4 Schiffe, sonst nichts → nach 100 Schritten genau −60 (über `upkeepCarry`); läuft bei Geld < 0                                                                 | `ships.test.ts`                     |
| AK-E4-03 | Fahrzeit: Route Heimat ⇄ B mit `d` 37 → Ankunft genau 370 Schritte nach Abfahrt; Rundreise 740                                                                             | `ships.test.ts`                     |
| AK-E4-04 | Erst entladen, dann laden: an Bord 30 Gewürz für die Heimat, Heimat-Lager Gewürz 80 → entlädt 20, 10 bleiben; danach Laden Werkzeug nach B füllt höchstens `50 − 10` = 40  | `ships.test.ts`                     |
| AK-E4-05 | Halbe Ladung je Gut: zwei Güter, je 100 im Quelllager, Reserve 10 → 25 / 25; erstes Gut 12 verfügbar → 12 / 38; beide 0 → fährt leer im selben Tick                        | `ships.test.ts`                     |
| AK-E4-06 | Reserve: Quelllager 15, Reserve 10 → lädt 5; Quelllager 8 → lädt 0 und fährt; Reserve 0 → lädt alles                                                                       | `ships.test.ts`                     |
| AK-E4-07 | Validierung: Gut in beiden Richtungen, 3 Güter je Richtung, `a = b`, Ziel ohne Kontor, Schiff unterwegs, keine Güter → je eigener Grund, Welt unverändert                  | `ships.test.ts`                     |
| AK-E4-08 | Auflösen auf See Richtung B mit 40 Gewürz an Bord: fährt nach B ohne Umladung, dann heim, entlädt bis 100, Rest verfällt mit Meldung; danach frei                          | `ships.test.ts`                     |
| AK-E4-09 | Reihenfolge: `tickShips` nach Produktion, vor Verbrauch — Ladung, die im selben Schritt ankommt, deckt den Bedarf dieses Schritts; zwei Schiffe in `id`-Reihenfolge        | `ships.test.ts`, `tick.test.ts`     |
| AK-E4-10 | Determinismus: zwei Läufe 5000 Schritte mit 3 Schiffen → `serialize` gleich; kein Aufruf von `createRng` in `ships.ts` (Spy)                                               | `ships.test.ts`                     |
| AK-E4-11 | Laden mitten auf der Fahrt (v8): Weiterlauf 1000 Schritte gleich dem Lauf ohne Laden                                                                                       | `save.test.ts`                      |
| AK-E4-12 | Schiffsposition auf der Fahrlinie: Fortschritt 0 → Anker Start, 1 → Anker Ziel, ½ → halbe Polylinienlänge; Wegpunkte exakt getroffen                                       | `tests/render/shipLane.test.ts` neu |
| AK-E4-13 | **Routen-Bedienung (Browser-Check):** Startzustand und Zählung wie Spec 8; höchstens **2 Klicks** bis „unterwegs nach <Name>" im Panel steht und das Schiff im Bild ablegt | Browser-Check                       |
| AK-E4-14 | Panel zeigt je Schiff Ladung, Ziel, Restzeit (m:ss, Tempo 1); Mouse-over Schiff auf See gleiche Angaben; „Route auflösen" mit 1 Klick                                      | Browser-Check                       |

## E5, E6 — Kann (AK gelten nur bei Aufnahme in den Plan)

- **AK-E5-01** (Browser) Knopf „Inseln" zeigt Silhouetten, Linien, Schiffspunkte; Klick springt zur Insel.
- **AK-E5-02** (`tests/render/archipel.test.ts`) Gründungsfahrt: nach `kontor2` ein Sprite auf der Linie, Dauer
  `10 × d`; nach Laden keine Fahrt; kein Feld im Save.
- **AK-E6-01** (`tests/sim/offer.test.ts` neu) Periode `k` bei 3600 + 3000 k nur mit `seafaring`; Preis
  `⌊Kauf × 0,8⌋`, Menge 10–20; verfällt bei `tick > due`; Kauf bucht ins Lager des genannten Kontors.
- **AK-E6-02** (`offer.test.ts`) Ziehung nur aus eigenem Strom (Spy auf Seeds); Auftrags- und Krisenfolge gleich mit
  und ohne E6; AK-M12-B2/B3 unverändert.
- **AK-E6-03** (Browser) Händlerschiff liegt sichtbar am Kontor, Karte mit Restzeit.
