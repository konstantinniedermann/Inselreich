# I-102 «Auftragsvorschau» (Kurzdesign, Stufe leicht)

Stand 2026-10-16 · Paket design-I-102 · Quelle: I-102 (IDEEN-10 Scout A, R653), Handel 2 (R658) · Save: nein · neuer Spielwert: nein · Sim-Änderung: eine reine Lesefunktion

## Spielerzweck

Der Spieler liest «Nächster Auftrag in 0:20 · voraussichtlich Rum» und lässt das Rum-Lager liegen, statt es vorher zu verkaufen. Säule: Wirtschaft, Steuern und Handel (Aufträge planbar statt Überraschung). Kurze Schleife: Lager beim Lesen anpassen; Ziel-Belohnung: Auftrag trifft auf volles Lager.

## Regeln

1. **Quelle ohne neuen Zufall.** `orderForPeriod(seed, k, maxHouseTier)` ist zustandslos (neue RNG-Instanz je Periode, ADR-010); die Vorschau ruft es mit der Periode des nächsten Angebots auf. Es zieht keinen Zufall aus dem Weltzustand und verändert nichts: kein RNG-Vorziehen, kein neues Feld.
2. **Lesefunktion `previewOrder(world)` in `src/sim/orders.ts`** → `{ tick, good } | null`. `tick = nextOrderTick(world)` (springt über die Sperrperiode `farSkip`), `k = (tick − ORDER_FIRST_TICK) / ORDER_PERIOD`, `good = orderForPeriod(world.seed, k, maxHouseTier(world)).good`. Nur das Gut, nie die Menge (Menge und Prämie hängen am Ergebnis desselben Aufrufs, bleiben aber verborgen).
3. **Wann `null` (keine Vorschau).** Laufender Stammkunden-Vertrag (`world.contract !== null`, bei Lieferung wird in der Periode kein Zufallsauftrag angeboten) · offenes Vertragsangebot (`contractOffer !== null`) · Funktion «Aufträge» gesperrt (`functionLock(world,'orders')`, die Karte ist dann ohnehin unsichtbar).
4. **Anzeige (`orderCardText`, `src/ui/order.ts`).**
   - Zweig «kein Auftrag» (heute «Nächster Auftrag in m:ss»): «Nächster Auftrag in m:ss · voraussichtlich {Gut}».
   - Zweig «normaler Auftrag aktiv» (V2, Empfehlung): am Ende «· danach voraussichtlich {Gut}». Begründung: die Lücke zwischen Verfall und Folgeperiode ist nur 300 Ticks (`ORDER_PERIOD − ORDER_DURATION`); nur in der Lücke zu zeigen, lässt kaum Zeit zum Planen.
   - Fernauftrag aktiv, Vertrags- und Angebotszweig: keine Vorschau (V1 und V2).
   - Zeit wie bisher über `formatGameTime`.
5. **«voraussichtlich» ist ehrlich.** Das Gut hängt an `maxHouseTier` zum Angebotszeitpunkt; ein Stufenaufstieg (oder Abriss des höchsten Hauses) vor dem Angebot kann den Pool und damit das Gut ändern. Die Vorschau wird bei jedem `refresh()` neu berechnet und ändert sich dann sichtbar; kein Versprechen, keine Meldung bei Wechsel.
6. **Sperrperiode nach Fernangebot (Handel 2, R2/R11).** Nach `acceptFarOrder` ist `farSkip = period + 1`; `nextOrderTick` überspringt diese Periode, die Vorschau zeigt Zeit und Gut der übernächsten Periode. Wird die Fernlieferung früher geliefert (Karte «kein Auftrag»), gilt dasselbe.
7. **Fernangebot nicht in der Vorschau.** Die Insel des Fernangebots (Rotation `k % farEligible.length`) wird nicht angekündigt (Variante F: möglich, aber hängt an Kontoren und erhöht Textlänge; später).
8. **Speicherstand:** keiner; `src/sim/types.ts` und `defs/` ohne Diff. Baseline und Balancing-Test unberührt (nur Lesen). Keine Wertkonstante, Text ist UI.

## Abgrenzung

- **I-029** (Gefragte Ware, geparkt) ändert Preise; I-102 zeigt nur Vorhandenes.
- **I-109** und **UI-HAEPPCHEN-D** berühren `order.ts` nicht (R661: I-102 nicht gebündelt); I-102 bekommt ein eigenes Häppchen danach.
- Nicht dazugehörig: Menge/Prämie vorab, Tausch oder Ablehnung des angekündigten Guts, Ton/Meldung, Karte/Marke (I-101), Ankündigung der Fernangebot-Insel.

## Entartung und Wahl

Wer das angekündigte Gut nie verkauft, hält Lagerplatz (Bestand bis `STORAGE_CAP`) und verliert Verkaufserlös; der Gewinn ist Prämie `0,75 × buy` gegen Marktpreis, also kein Dauergewinn, nur Planbarkeit. Die Entscheidung bleibt echt: Halten oder Verkaufen; Menge unbekannt (`def.min..max`), Prämie unter Marktpreis.

## Abnahmekriterien

| ID   | Prüfung                                                                                                                                                                                           | Art                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| AK-1 | `previewOrder` liefert `tick === nextOrderTick(world)` und `good === orderForPeriod(seed, k, maxHouseTier).good` für Ticks vor `ORDER_FIRST_TICK`, mitten in der Lücke und mitten im Auftrag      | Vitest `tests/sim/orders.test.ts`    |
| AK-2 | Zustandsfrei: Aufruf verändert `JSON.stringify(world)` nicht; zwei Aufrufe gleich; der später angebotene Auftrag (`tickOrders` bis zum Angebot) hat dasselbe Gut, solange die Stufe gleich bleibt | Vitest                               |
| AK-3 | Stufenaufstieg: Welt mit `maxHouseTier` 1, danach Haus Stufe 2 → Vorschau entspricht dem Pool der neuen Stufe; Abriss senkt zurück; Angebot nutzt die Stufe zum Angebotszeitpunkt                 | Vitest                               |
| AK-4 | Laufender Vertrag → `null`; offenes Vertragsangebot → `null`; Funktion gesperrt → `null`; nach `cancelContract`/Bruch wieder Wert                                                                 | Vitest                               |
| AK-5 | Sperrperiode: nach `acceptFarOrder` zeigt die Vorschau Tick und Gut der Periode `period + 2`; nach Lieferung (Karte «kein Auftrag») ebenfalls nicht die gesperrte Periode                         | Vitest                               |
| AK-6 | `orderCardText`: Zweig «kein Auftrag» endet auf «· voraussichtlich {Gutname}»; aktiver Auftrag enthält «danach voraussichtlich {Gutname}» (V2); Fernauftrag, Vertrag, Angebot ohne Vorschau       | Vitest `tests/ui/order.test.ts`      |
| AK-7 | Determinismus: gleiche Welt (Seed, Tick, Stufe) → gleicher Text; Spiel mit/ohne Aufruf der Vorschau gibt bitgleichen Weltzustand und Balancing-Test grün                                          | Vitest / `tests/sim/balance.test.ts` |
| AK-8 | Browser (1280 px): Karte zeigt Gut und Countdown; nach Angebot erscheint genau dieses Gut (gleiche Stufe); Karte umbricht nicht                                                                   | Browser-Check                        |
| AK-9 | `src/sim/types.ts`, `src/sim/defs/`, Save-Version ohne Diff; `make check` grün                                                                                                                    | Diff / `make check`                  |

## Randfälle

- Vor `ORDER_FIRST_TICK`: Periode 0, Anzeige schon zu Spielbeginn (frühester Planungsnutzen).
- Pool kleiner als erwartet (nur Stufe-1-Güter): Gut aus kleinem Pool, kein Sonderfall.
- Auftrag verfällt ohne Lieferung: Folgeperiode bleibt gleich, Vorschau bleibt gültig (Periodenindex ändert sich nicht).
- Pause: Anzeige friert ein; Tempo ohne Wirkung (Spielzeit wie `formatGameTime`).
- Archipel: Auftrag gilt der Heimat (`HOME`); Vorschau nennt das Gut, nicht die Insel; Fernauftrag-Zweig bleibt unberührt.

## Varianten und Empfehlung

- **V1** nur Zweig «kein Auftrag» (kleinster Diff, Fenster 300 Ticks).
- **V2** zusätzlich Hinweis bei aktivem Normalauftrag (Empfehlung; gleiche Funktion, ein Zusatzstück Text).
- Save-Variante nicht nötig: Ableitung aus Seed, Periode und Stufe geht ohne RNG-Vorziehen.

## Selbstprüfung (Gate Brainstorming)

1. Säule Handel/Aufträge; ohne Vorschau ist der Auftrag Glück, mit ihr Planung.
2. Echte Wahl: Halten gegen Verkaufen bleibt; Menge unbekannt, Stufenaufstieg kann kippen.
3. Rückkopplung: keine in der Sim; Spielerverhalten verschiebt Verkäufe.
4. Randfälle oben (Aufstieg, Vertrag, Sperrperiode, Pause).
5. Einfacher geht nicht: eine Lesefunktion, ein Textteil.

Urteil: OK.
