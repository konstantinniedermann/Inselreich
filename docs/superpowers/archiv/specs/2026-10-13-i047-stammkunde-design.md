# I-047 Stammkunde (Liefervertrag) — Designvorschlag und Spec

Stand: 2026-10-13 · Paket `design-I-047` · Autor: lead-design (Teil A), design-spec-author (Teil B), Werte:
design-economy-designer ([Anhang 01](2026-10-13-i047-stammkunde-design/anhang-01-werte.md)) · Grundlage: `docs/ideen.md`
I-047, R486 O3, R555, R571 (4), M14-Anhang 01 C.1/C.2 · Prozessstufe voll · Gate Spec OK mit Auflagen (R584), Nachtrag QA
(1)–(8) eingearbeitet.

## Teil A · Designvorschlag (Gate Brainstorming)

### A.1 Spielerzweck in einem Satz

Wer eine Ware im Überschuss herstellt, kann sie einem Stammkunden fest zusagen und tauscht damit die höhere, aber
zufällige Auftragsprämie gegen eine sichere, selbsttätige Abnahme, die ihn zum Vorrat zwingt.

### A.2 Ausgangslage

- Der Handel kennt zwei Wege: freier Verkauf mit Sättigung (`SELL_DROP` 1 Punkt je Stück, Erholung 1 Punkt je
  10 Ticks, Boden 30 %) und den Zufallsauftrag (ein Platz, alle 900 Ticks, Prämie `floor(buy × 0,75)`, Gut nach Seed
  und Höchststufe). Wer mehr als ≈ 6 Stück je Minute eines Guts frei verkauft, landet am Boden.
- M14-Anhang 01 C.1 zeigt: Ein Vertrag als **zusätzlicher** Einnahmeweg zu 120–130 % des Verkaufspreises dominiert ab
  4 Stück Überschuss je Minute und bringt nur +34 bis +158 / min (0,7–3 % der Bilanz in Phase c). Ohne Gegengewicht ist
  er ein Klick, keine Entscheidung.
- Geld ist im Spätspiel ohnehin reichlich (Phase c 5040 / min, Erweiterung 1 Befund B2). I-047 soll deshalb **keine
  Geldquelle** sein, sondern eine **Wahl im Handel** im Mittelspiel (Bürger, Kaufleute).

### A.3 Abgrenzung (vor der Option geprüft)

- **Erweiterung 1 «Stände und Segel»** (Branch `design/erweiterung-1`, gelesen per `git show`): K1–K5 enthalten keinen
  Vertrag. I-047 steht nur in Variante B «Wettstreit im Archipel» (Rivalen bieten Verträge an), die als Erweiterung 2
  vorgemerkt ist. Die K2-Spec schliesst «Aufträge für die neuen Güter» aus. Damit gibt es **keine wesentliche
  Überschneidung**. I-047 ist ein eigenständiges Paket. Der Vertrag gilt nur für Güter mit `order`-Eintrag, also nie
  für Ton, Porzellan oder Konfekt. Variante B könnte ihn später als Baustein übernehmen (ein Kunde → mehrere Kunden).
- **I-048 Zukauf-Aufschlag:** inaktiv (`BUY_RISE` 0, R571). I-047 betrifft nur die Verkaufsseite und liest weder
  `buyPct` noch `BUY_RISE`. Würde I-048 später scharf geschaltet, bleibt der Vertragspreis unberührt. Das Verbot
  «kein Kauf-und-Liefern-Gewinn» wird gegen den Listenpreis mit Edikt Handel geprüft (Anhang 01).
- **I-029 / I-006** bleiben geparkt (R486 O3). **K5 Stiftungen** (Geldsenke) wird von I-047 nicht berührt.

### A.4 Optionen

**Option 1 · Zusätzlicher Dauervertrag (Fassung R486 O3).** Ein eigener Vertragsplatz neben den Aufträgen: ≈ 25 % der
Erzeugung zu 120 % des Verkaufspreises, alle 3 min, unbefristet, Bruch kostet 100.

- Für: genau die Ideenfassung, kleine Rechnung schon vorhanden (C.1).
- Gegen: Er dominiert ab Überschuss (C.1), es gibt keinen Preis für das Annehmen, also **keine echte Wahl**. «Anteil an
  der gemessenen Erzeugung» braucht eine neue Messgrösse im Zustand. Es ist zusätzliches Geld im falschen Moment.

**Option 2 · Laufzeitvertrag mit Schlussprämie.** Am Kontor liegen zwei Angebote zur Wahl (Gut, Menge, 5 Lieferungen
im Abstand von 3 min). Erst nach der letzten Lieferung gibt es eine Schlussprämie. Fehlt eine Lieferung, verfällt sie.

- Für: starke Spannung durch Krisen (Brand, Sturm) und eine Belohnung am Ende als Ziel in Minuten.
- Gegen: neue Angebotslogik mit Zufallszug, zweite Karte, mehr Zustand und mehr Bedienung (Grösse L statt M). Die
  Schlussprämie ist wieder vor allem Geld.

**Option 3 · Stammkunde im Auftragsplatz (Empfehlung).** Liefert der Spieler einen Auftrag ab, bietet der Händler an,
dasselbe Gut fest abzunehmen. Nimmt der Spieler an, **belegt der Stammkunde den Auftragsplatz**: Zu jedem
Periodenbeginn (alle 1:30) wird eine feste Menge automatisch aus dem Lager der Lieferinsel abgebucht und zu einem festen
Stückpreis bezahlt, der unter der Auftragsprämie liegt. Zufallsaufträge gibt es so lange keine. Kündigen ist kostenlos.
Fehlt Ware, springt der Kunde ab und es fällt eine Strafe an.

- Für: **echte Wahl mit eingebautem Preis.** Der Spieler gibt die höhere, zufällige Prämie auf und erhält dafür eine
  sichere Abnahme seines Überschussguts, die nicht sättigt und keinen Klick braucht. Wer viele Auftragsgüter liefern
  kann, behält die Zufallsaufträge; wer ein Gut im Überschuss hat und andere nicht, nimmt den Kunden. Die Bindung von
  Ware steht gegen Feste (`FEAST_RUM`), Versorgung und Schiffsfracht. Die Option nutzt Takt, Karte, Güterpool und
  Funktionssperre der Aufträge (kein neuer Zufallsstrom, ADR-010).
- Gegen: Das Gewicht ist klein, denn der Auftragsplatz bringt im Spätspiel nur ≈ 2–4 % des Einkommens. Gewollt: Der
  Vertrag ist Mittelspiel-Komfort mit Risiko und kein Wachstumsmotor.

### A.5 Empfehlung und Leitplanken für die Werte

Option 3. Leitplanken für `design-economy-designer` (Anhang 01):

1. **Wert je Periode ist für alle Güter ähnlich.** Die Menge je Gut wird so gewählt, dass Menge × Stückpreis über die
   Güter ungefähr gleich ist. Sonst dominiert der Vertrag mit dem teuersten Gut (Rum, Glas).
2. **Wahl gegen den Zufallsauftrag:** Der erwartete Mehrwert des Vertrags über dem freien Verkauf liegt bei
   ≈ 70–90 % des erwarteten Mehrwerts eines Spielers, der **jeden** Zufallsauftrag seiner Stufe liefert. Damit lohnt
   der Vertrag nur, wenn man einen Teil der Aufträge nicht bedienen kann oder Klicks sparen will.
3. **Kein Kauf-und-Liefern-Gewinn:** Stückpreis < `ceil(0,8 × buy)` (Edikt Handel) für jedes Gut.
4. **Kein Pflichtbau:** Menge je Minute ≤ 40 % der Leistung der zugehörigen Kette in der Phase, in der das Gut bestellt
   wird. Sie ist aber ≥ 20 % der Leistung eines Betriebs, damit die Zusage bindet (geändert nach Anhang 01
   W.4: «≥ 1 Betrieb» ist für Stoff, Rum und Glas nicht mit Leitplanke 2 vereinbar).
5. **Strafe** so, dass Annehmen und dann Verfallenlassen nie besser ist als Ablehnen.
6. **Gesamtwirkung** auf die Bilanz in Phase b und c je ≤ 3 % (keine Geldquelle).

### A.6 Annahmen (Rückfragen an L0, selbst beantwortet)

| ID   | Frage                               | Annahme (Empfehlung)                                                                   |
| ---- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| AN-1 | Ab wann gibt es Angebote?           | ab Höchststufe 3 (Bürger), Wert in `src/sim/defs/`; das Frühspiel bleibt unverändert   |
| AN-2 | Von welcher Insel wird geliefert?   | von der Insel, auf der der auslösende Auftrag geliefert wurde (im Vertrag gespeichert) |
| AN-3 | Liefern per Klick oder selbsttätig? | selbsttätig am Periodenbeginn (Takt der Aufträge), kein Klick                          |
| AN-4 | Teillieferung?                      | nein (wie Aufträge); Fehlmenge = Bruch                                                 |
| AN-5 | Mehrere Verträge?                   | höchstens einer (der Auftragsplatz ist einer)                                          |
| AN-6 | Kontor weg oder Funktion gesperrt?  | zählt als Fehlmenge (Bruch mit Strafe), wenn der Abriss vom Spieler kommt              |
| AN-7 | Boom auf das Vertragsgut?           | wirkt nicht auf den Vertragspreis (C.2: 1,3 × 1,5 > Grenze)                            |
| AN-8 | Save-Nummer                         | nächste freie beim Merge (heute v14); Abstimmung mit K2 (plant v14) nach R487 P-4      |

### A.7 Selbstprüfung Gate Brainstorming — Urteil BEDENKEN

1. **Säule:** Sie stärkt Wirtschaft/Handel (Planbarkeit, Überschuss verwerten) und berührt die Versorgung, weil
   gebundene Ware fehlen kann. Misslingt sie, leidet nur der Handel, die Kernschleife bleibt unberührt.
2. **Echte Wahl:** ja, durch den Verzicht auf Zufallsaufträge (Leitplanke 2) und das Bruchrisiko. Bedingung: Die Werte
   halten Leitplanke 1. Sonst dominiert der Rum-Vertrag.
3. **Rückkopplung:** schwacher Motor (sichere Einnahme) und gewollte Bremse (Vorrat binden, Strafe). Es gibt keinen
   endlosen Überschuss, weil Menge und Platz gedeckelt sind.
4. **Randfälle:** leeres Lager → Bruch. Abriss der Kette → Bruch, sofern nicht vorher gekündigt. Kündigen am
   Fälligkeitstick ist vor der Abbuchung definiert (Teil B). Kaufen und Liefern lohnt nie (Leitplanke 3).
   Der Controller nimmt nie an → Baseline bitgleich.
5. **Einfachere Variante:** Option 3 ist schon die einfachste Fassung mit Wahl. Noch einfacher wäre eine
   «Auftragswiederholung per Klick», aber ohne Bindung fehlt die Entscheidung.

**Bedenken:** Das Gewicht ist klein und erst im Mittelspiel sichtbar (Spass 2 wie in der Ideenbewertung). Das ist
vertretbar, weil der Aufwand M bleibt und Erweiterung 2 darauf aufbauen kann.

Quellen: nur Genre-Mechanik «Dauerabnahme gegen Festpreis» (ADR-006), keine Recherche nötig.

## Teil B · Spec

Grundlage: Teil A (Option 3, Leitplanken A.5, Annahmen AN-1…AN-8) und
[Anhang 01](2026-10-13-i047-stammkunde-design/anhang-01-werte.md) mit den Entscheiden von lead-design zu dessen
«Offene Punkte»: (1) L4-Untergrenze «≥ 20 % eines Betriebs» (A.5), (2) Rum-Menge 5, (3) Strafe als Anteil
`CONTRACT_PENALTY_PCT` 100, (4) Menge als Pflichtfeld `order.contract` plus Invarianten-Test, (5) Phase (a) bis 4,0 %
(Basis 0) hingenommen. Code-Stellen beziehen sich auf den Stand von `main` zum Datum dieser Spec.

### B.1 Ziel und Nicht-im-Umfang

**Ziel.** Nach einer Auftragslieferung bietet der Händler an, dasselbe Gut fest abzunehmen. Nimmt der Spieler an,
belegt der **Stammkunde** den Auftragsplatz: An jedem Periodenbeginn wird eine feste Menge selbsttätig aus dem Lager der
Lieferinsel abgebucht und zu einem festen Stückpreis unter der Auftragsprämie bezahlt. Zufallsaufträge gibt es so
lange nicht. Kündigen ist kostenlos; fehlt Ware, springt der Kunde ab und es fällt eine Strafe an.

**Ausdrücklich nicht im Umfang:**

- kein zweiter Vertrag und kein eigener Vertragsplatz neben dem Auftrag (AN-5);
- keine Teillieferung, kein Liefern per Klick (AN-3, AN-4);
- keine Verträge für Güter ohne `order`-Eintrag, also nie Werkzeug und nie die Güter aus Erweiterung 1 (Ton, Porzellan,
  Konfekt);
- keine Änderung an Zufallsaufträgen (Gut, Menge, Prämie, Takt, Dauer, `orderForPeriod`), an Kauf- und Verkaufspreisen,
  an der Sättigung (`sellPct`, `SELL_DROP`, Erholung), an Booms und an Edikten;
- I-029 und I-006 bleiben geparkt (R486 O3); kein Bezug zu Rivalen (Variante B / Erweiterung 2);
- keine Controller-Strategie für Verträge (der Controller nimmt nie an, B.5);
- keine neue Messgrösse «Erzeugung je Gut» im Zustand (Option 1 verworfen).

### B.2 Regeln

Begriffe: Periodenbeginn = Tick `t ≥ ORDER_FIRST_TICK` mit `(t − ORDER_FIRST_TICK) % ORDER_PERIOD = 0` (600 bzw. 900,
`defs/timing.ts`), also derselbe Takt wie der Zufallsauftrag (`orders.ts:55–59`). Für ein Gut `g` mit `order`:
Vertragsmenge `m(g) = GOODS[g].order.contract`, Stückpreis `p(g) = floor(GOODS[g].buy × CONTRACT_PREMIUM)`, Wert je
Lieferung `V = m × p`, Strafe `P = ceil(V × CONTRACT_PENALTY_PCT ÷ 100)`. Werte: Anhang 01 W.1 (z. B. Rum m 5, p 27,
V 135, P 135).

- **R1 Angebot.** Ein erfolgreiches `deliverOrder(world, island)` setzt zusätzlich das Angebot
  `world.contractOffer = { good, island }` (Gut des gelieferten Auftrags, Insel der Lieferung, AN-2), wenn `maxHouseTier(world) ≥ CONTRACT_MIN_TIER`
  (3, AN-1) und `world.contract === null`. Ein fehlgeschlagenes `deliverOrder` ändert nichts (auch kein Angebot).
  Rückgabe bleibt `ok`.
- **R2 Laufzeit des Angebots.** Das Angebot gilt bis zum nächsten Periodenbeginn (`nextOrderTick` zum Zeitpunkt der
  Lieferung). In `tickOrders` wird es an jedem Periodenbeginn als **erster** Schritt gelöscht (vor R6/R7). Ein offenes
  Angebot sperrt nichts: Es blockiert weder den nächsten Zufallsauftrag noch andere Aktionen.
- **R3 Annehmen.** Neue Sim-Aktion `acceptContract(world): Result`. Prüfreihenfolge, jeweils `fail(<Grund>)` ohne
  Änderung: `functionLock(world, 'orders')` → Sperrgrund; kein Angebot → `'Kein Angebot'`; kein Kontor auf der Angebotsinsel
  (`noKontorTrade`) → `'Kein Kontor auf <Insel>'`. Bei Erfolg wird der Vertrag gesetzt,
  `world.contract = { good, amount: m(good), price: p(good), island }`, und `world.contractOffer = null`. Menge und Preis werden **beim Annehmen** festgeschrieben; sie
  ändern sich danach nicht (auch nicht bei Boom, Edikt, Stufenwechsel). Die Stufe wird beim Annehmen nicht erneut
  geprüft.
- **R4 Ablehnen.** Neue Sim-Aktion `declineContract(world): Result`: ohne Angebot `fail('Kein Angebot')`, sonst
  `contractOffer = null`. Sonst keine Wirkung; Nicht-Annehmen bis Periodenbeginn wirkt gleich (R2).
- **R5 Kündigen.** Neue Sim-Aktion `cancelContract(world): Result`: ohne Vertrag `fail('Kein Vertrag')`, sonst
  `contract = null`, kostenlos, wirkt sofort. `world.order` bleibt `null`; der nächste Zufallsauftrag kommt am nächsten
  Periodenbeginn (`nextOrderTick`), nie sofort (W.8 Punkt 1). Kündigen ist auch bei gesperrter Funktion möglich.
- **R6 Periodenbeginn mit Vertrag.** In `tickOrders` am Periodenbeginn, nach R2 und **vor** dem Anbieten eines
  Zufallsauftrags, Prüfung in dieser Reihenfolge; die erste zutreffende Bedingung ist der Bruchgrund:
  1. `functionLock(world, 'orders') !== null` → Bruch, Grund `lock`;
  2. `islandAt(world, island) === null` → Bruch, Grund `island` (nur über manipulierte Stände erreichbar);
  3. `noKontorTrade(world, island) !== null` → Bruch, Grund `kontor` (AN-6; ein Kontor verschwindet nur durch
     Spieler-Abriss, `build.ts:88–93`);
  4. `stock[good] < amount` → Bruch, Grund `stock` (AN-4, der Bestand bleibt unverändert, keine Teilabbuchung);
  5. sonst **Lieferung**: `stock[good] −= amount`, `money += amount × price` (auch bei negativem Geld, wie
     `deliverOrder`), Vertrag bleibt, **kein Zufallsauftrag** in dieser Periode (`world.order` bleibt `null`).
- **R7 Bruch.** `money −= P`, `contract = null`. Danach läuft `tickOrders` im selben Tick unverändert weiter und bietet
  den Zufallsauftrag der Periode an (`orderForPeriod(seed, k, maxHouseTier)`). Begründung: Ein Bruch ist so genau
  «Kündigen vor dem Periodenbeginn minus P» (Anhang 01 W.5 Punkt 1); L5 hält, und der Auftragsplatz bleibt nie leer.
  Ein Bruch erzeugt kein Angebot.
- **R8 Geld darf negativ werden.** Die Strafe wird immer voll abgezogen, auch wenn `money` dadurch oder schon vorher
  negativ ist. Begründung: Der Unterhalt kann `money` bereits negativ machen (`economy.ts`), negatives Geld sperrt Bau
  und Kauf («Kein Geld»), eine Schonregel liesse die Strafe durch Pleite umgehen, und P ≤ 140 ist klein (W.5 Punkt 2).
- **R9 Unabhängigkeiten.** Der Vertragspreis liest nie `sell`, `sellPct`, `buyPct`, `BUY_RISE`, Edikte oder den Boom
  (AN-7, W.3). Die Lieferung ändert `sellPct` nicht. Ausgabesperren (`goodLocks`) gelten wie bei `deliverOrder` nicht.
  Ein Stufenabstieg unter `CONTRACT_MIN_TIER` beendet einen laufenden Vertrag nicht.
- **R10 Reihenfolge im Tick.** `tickOrders` bleibt an seiner Stelle in `step` (`tick.ts`: nach `tickMarket`, vor
  `tickCrises`). Spieleraktionen (Annehmen, Ablehnen, Kündigen) laufen immer zwischen zwei Schritten: Kündigen bei
  `world.tick = T − 1` (T = Periodenbeginn) wirkt vor dem Schritt T, also keine Abbuchung und Zufallsauftrag bei T.
  Kündigen bei `world.tick = T` wirkt nach der Abbuchung von T; der nächste Zufallsauftrag kommt bei `T + ORDER_PERIOD`.
- **R11 Determinismus.** Kein neuer Zufallsstrom, kein gespeicherter RNG-Zustand. `orderForPeriod` bleibt zustandslos
  (ADR-010): Der Zufallsauftrag einer Periode k ist mit und ohne vorherigen Vertrag derselbe
  (`orderForPeriod(seed, k, maxHouseTier)`). Zwei Läufe mit gleichem Seed und gleichen Aktionen sind bitgleich.
- **R12 Bericht an die UI.** `step` meldet das Vertragsereignis des Schritts im `StepReport` (wie `lost`), ohne
  Weltzustand, als Feld `contract` mit einem von drei Werten: `null` (kein Ereignis),
  `{ kind: 'delivered', good, amount, pay }` oder `{ kind: 'broken', good, reason, penalty }` mit `reason` aus
  `'lock'`, `'island'`, `'kontor'`, `'stock'`. Die UI leitet daraus Meldung und Klang ab (B.4).

### B.3 Zustand und Save

**Weltzustand (`src/sim/types.ts`, `World`):**

| Feld            | Typ                                                                       | Start (`createWorld`) |
| --------------- | ------------------------------------------------------------------------- | --------------------- |
| `contract`      | `{ good: GoodId; amount: number; price: number; island: number } \| null` | `null`                |
| `contractOffer` | `{ good: GoodId; island: number } \| null`                                | `null`                |

`OrderDef` erhält das Pflichtfeld `contract: number` (Menge je Lieferung); damit hat jedes Auftragsgut eine Menge.

**Def-Einträge** (`src/sim/defs/goods.ts`, neben `ORDER_PREMIUM`): `CONTRACT_PREMIUM = 0.68`,
`CONTRACT_PENALTY_PCT = 100`, `CONTRACT_MIN_TIER = 3`; je Auftragsgut `order.contract`: Holz 23, Nahrung 28, Stein 14,
Wolle 17, Stoff 7, Zuckerrohr 17, Rum 5, Glas 4 (Anhang 01 W.1). Kein neuer Takt.

**Save:** neue Version, **nächste freie Nummer beim Merge** (heute `SAVE_VERSION` 13 in `save.ts:54`, also v14).

- Migration v13 → v14 als nächstes Glied der bestehenden Kette (`save.ts`, `migrateV12ToV13`):
  `contract = null`, `contractOffer = null`, `version = 14`. Ein migrierter Stand verhält sich wie vorher. Begründung:
  Die Kette v1 → v13 besteht, die Migration ist verlustfrei; Abweisen träfe jeden laufenden Spielstand ohne Not.
- Abweisen mit Hinweis bleibt der Weg für alles ausserhalb der Kette (höhere oder unbekannte Version):
  `{ ok: false, reason: 'Unbekannte Version' }` (`save.ts:871`), nie eine Ausnahme; Test dafür (AK-SK-22).
- Validierung in `isWellFormed` analog `isValidOrder` (nur strukturell, nicht gegen aktuelle Spielwerte):
  `contract` ist `null` oder ein Objekt mit Gut aus `GOODS` mit `order`, `amount` ganzzahlig ≥ 1, `price` ganzzahlig
  ≥ 0, `island` ganzzahliger Index einer vorhandenen Insel; `contractOffer` ist `null` oder Gut mit `order` und gültige
  Insel. Zusätzlich die Invarianten **«`contract ≠ null` ⇒ `order = null` und `contractOffer = null`»** und
  **«`contractOffer ≠ null` ⇒ `order = null`»**. Verstoss → `'Beschädigter Spielstand'`.
- Koordination: Erweiterung 1 K2 plant ebenfalls v14 (R487 P-4) → offener Punkt O-1 (B.8).

### B.4 Bedienung und UI (desktop-first)

Die bestehende Auftragskarte oben rechts (`src/ui/order.ts`, `orderCardText`) bekommt zwei weitere Zustände. Die Texte
werden in reinen, DOM-freien Helfern gebildet (testbar unter `tests/ui/`). Zeiten im Format `m:ss` wie bisher
(`formatGameTime`), Insel-Zusatz «auf <Insel>» nur, wenn die Lieferinsel nicht die Heimatinsel ist.

| Zustand / Ereignis            | Text (Wortlaut)                                                                                                                                                                                                                                             | Bedienung / Darstellung                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Angebot offen                 | «Stammkunde: 5 Rum alle 1:30 zu 27 je Stück · Markt jetzt ≈ M (= `sellPrice(w, Gut, 1, Vertragsinsel)`, Preis der Vertragsinsel inkl. Vorliebe; R622) · Erzeugung X / min (oder keine Erzeugung) · Angebot noch m:ss» (geändert durch UI-HAEPPCHEN-C, R607) | Knöpfe **Annehmen**, **Ablehnen**                                  |
| Vertrag aktiv                 | «Stammkunde: 5 Rum · nächste Lieferung m:ss · Lager x/5»                                                                                                                                                                                                    | Knopf **Kündigen**                                                 |
| Vertrag aktiv, knapp          | wie aktiv                                                                                                                                                                                                                                                   | Warnfarbe, wenn Lager < Menge oder kein Kontor auf der Lieferinsel |
| Meldung Annehmen              | «Stammkunde: 5 Rum alle 1:30 vereinbart»                                                                                                                                                                                                                    | Info                                                               |
| Meldung Lieferung             | «Stammkunde: 5 Rum geliefert, +135»                                                                                                                                                                                                                         | Info, Klang `orderDone`                                            |
| Meldung Bruch `stock`         | «Stammkunde abgesprungen: zu wenig Rum. Strafe 135»                                                                                                                                                                                                         | Warnung, Klang `error`                                             |
| Meldung Bruch `kontor`        | «Stammkunde abgesprungen: kein Kontor auf <Insel>. Strafe 135»                                                                                                                                                                                              | Warnung, Klang `error`                                             |
| Meldung Bruch `lock`/`island` | «Stammkunde abgesprungen. Strafe 135»                                                                                                                                                                                                                       | Warnung, Klang `error`                                             |
| Meldung Kündigen              | «Stammkunde gekündigt»                                                                                                                                                                                                                                      | Info                                                               |

- Ohne Vertrag und ohne Angebot zeigt die Karte wie bisher den Auftrag oder «Nächster Auftrag in m:ss». Während eines
  Angebots ist kein Auftrag aktiv (Invariante B.3); der Countdown des Angebots ist zugleich die Zeit bis zum nächsten
  Auftrag.
- «Lager x/5» liest das Lager der **Lieferinsel**, unabhängig von der aktiven Insel.
- Fehlgeschlagene Aktionen zeigen den Grund aus `Result` (wie die anderen Aktionen) mit Klang `error`.
- Klänge: `orderDone` und `error` sind vorhanden (`src/audio/sound.ts:44–47`), kein neuer Klang, kein neues Asset.
  Meldungen und Klänge kommen aus dem `StepReport` (R12), analog `lossMessages` in `src/ui/app.ts`.
- Kein Tastenkürzel, keine weitere Karte, kein neues Panel.

### B.5 Balancing-Auswirkung

- **Controller:** `deliverOrder` wird nur aus `src/ui/app.ts` aufgerufen, nie vom Controller (Anhang 01 W.7, grep).
  Er bekommt kein Angebot, `contract` und `contractOffer` bleiben `null`, `tickOrders` verhält sich wie bisher. Die
  Kennzahlen von `tests/sim/balance.test.ts` bleiben **unverändert**; kein Ruling nötig. Die neuen Def-Werte verändern
  keine bestehende Zahl.
- **Erwartete Wirkung im Spiel:** Phase (b) ≤ 2,9 %, (c) ≤ 1,9 % der Bilanz (W.7); Phase (a) bis 4,0 % unter Basis 0,
  von lead-design hingenommen (gegen «liefert alle Aufträge» negativ). Vertrag erreicht 74–81 % des Mehrwerts «jeder
  Auftrag geliefert» (W.2), dominiert also nie.
- **Invarianten-Test der Defs** (neu, z. B. `tests/sim/contract.test.ts`), für jedes Gut mit `order`:
  `p < orderUnitReward(g)`; `p < 0,8 × buy` (strenger als `ceil(0,8 × buy)`, W.3); `135 ≤ V ≤ 140`;
  `1 ≤ m ≤ STORAGE_CAP` (100) und ganzzahlig; `CONTRACT_PENALTY_PCT ≥ 1`; `CONTRACT_MIN_TIER` ist eine gültige Stufe.
  Wer die Werte später nachstellt, muss diesen Test grün halten oder per Ruling ändern.
- **Risiko weiche Wertgrenzen (Nachtrag R584):** Die Bänder 74–81 % (L2) und ≤ 2,9 % / 1,9 % (L6) stammen aus einer
  Rechnung (Anhang 01), nicht aus einer Simulation; der Balancing-Test prüft sie nicht. Prüfung im ersten Playtest nach
  I047-UI: Hält der Spieler den Vertrag dauerhaft, obwohl er die meisten Aufträge liefern könnte, oder dominiert ein Gut,
  gilt der Rückfall per Ruling, in dieser Reihenfolge: (1) `CONTRACT_PREMIUM` 0,68 → 0,62 (Mengen nach L1 nachziehen,
  Invarianten-Test anpassen), (2) `CONTRACT_MIN_TIER` 3 → 4. Beides ändert nur `src/sim/defs/`, keine Save-Folge.

### B.6 Abgrenzung und Doku-Folgen

- **I-048 Zukauf-Aufschlag:** inaktiv (`BUY_RISE` 0, R571). I-047 betrifft nur die Verkaufsseite; `buyPct` und
  `BUY_RISE` werden nicht gelesen (R9). Wird I-048 scharf geschaltet, steigt nur der Zukaufpreis; der Vertrag bleibt
  unberührt, Kaufen-und-Liefern wird noch unattraktiver.
- **Erweiterung 1 «Stände und Segel»:** K1–K5 enthalten keinen Vertrag; Ton, Porzellan, Konfekt haben kein `order`
  und damit keinen Vertrag. Einzige Berührung ist die Save-Nummer (O-1). Variante B / Erweiterung 2 kann den
  Stammkunden als Baustein übernehmen (ein Kunde → mehrere Kunden); dafür ist hier nichts vorbereitet (YAGNI).
- **Doku-Folgen (Hinweis an lead-tech, im Sim- bzw. UI-Paket):** README Abschnitt «Handelsaufträge» um den
  Stammkunden (Angebot, Menge und Preis je Gut, Strafe, Kündigen) erweitern; `docs/arc42.md` Persistenz (Save v14,
  neue Felder) und Tick-Ablauf (`tickOrders` mit Vertrag, `StepReport.contract`) nachführen.

### B.7 Abnahmekriterien

Vitest unter `tests/sim/` (Sim, Save), `tests/ui/` (reine Helfer); Browser-Check durch qa-playtester. Testwelten
setzen Stufe, Lager, Kontor und Tick direkt; `unlockAll` bzw. freigeschaltete Funktion `orders`, sofern nicht anders
genannt. Beispielgut Rum (m 5, p 27, V 135, P 135), sofern nicht anders genannt.

**Angebot**

- **AK-SK-01** Höchststufe 3, Auftrag Rum aktiv, Lager ≥ Menge: `deliverOrder` → `ok`, Angebot
  `{ good: 'rum', island: HOME }`; mit Lieferung auf Insel 1 → `island: 1`.
- **AK-SK-02** Höchststufe 2: erfolgreiches `deliverOrder` → `contractOffer` bleibt `null`.
- **AK-SK-03** Fehlgeschlagenes `deliverOrder` (zu wenig Ware) → `contractOffer` bleibt `null`, `serialize` unverändert.
- **AK-SK-04** Angebot verfällt: Lieferung bei Tick `T − 300` (T Periodenbeginn); nach `step` bis `T − 1` besteht das
  Angebot, nach dem Schritt T ist es `null` und der Zufallsauftrag der Periode ist aktiv.
- **AK-SK-05** Bei aktivem Vertrag erzeugt nichts ein zweites Angebot: Welt mit `contract` gesetzt und (konstruiert)
  Auftrag geliefert → `contractOffer` bleibt `null`; `acceptContract` ohne Angebot → `fail('Kein Angebot')`.
- **AK-SK-06** `declineContract` mit Angebot → `ok`, `contractOffer` `null`, sonst `serialize` gleich; ohne Angebot →
  `fail('Kein Angebot')`.

**Annehmen und Lieferung**

- **AK-SK-07** `acceptContract` mit Angebot Rum → `ok`, Vertrag
  `{ good: 'rum', amount: 5, price: 27, island: HOME }`, `contractOffer` `null`. Für jedes Auftragsgut gilt `amount = order.contract`, `price = floor(buy × 0,68)`.
- **AK-SK-08** `acceptContract` mit Angebot, aber ohne Kontor auf der Lieferinsel → `fail('Kein Kontor auf …')`, keine
  Änderung; bei gesperrter Funktion `orders` → Sperrgrund, keine Änderung.
- **AK-SK-09** Lieferung: Vertrag Rum, Lager 12, Geld 1000, Schritt auf Periodenbeginn → Lager 7, Geld genau
  135 über einem Vergleichslauf ohne Vertrag (gleiche übrige Tick-Wirkungen), `order` `null`, Vertrag
  besteht, `StepReport.contract` = `delivered` mit `pay` 135. Zwischen zwei Periodenbeginnen keine Abbuchung.
  Inselfall (Nachtrag R584): Vertrag auf Insel 1, Heimat-Lager Rum 0, Insel-1-Lager Rum 12 → Lieferung, Insel 1
  danach 7, Heimat bleibt 0.
- **AK-SK-10** Lager genau 5 → Lieferung, Lager 0, Vertrag besteht.
- **AK-SK-11** Boom auf Rum aktiv und Edikt Handel aktiv: Lieferung zahlt weiterhin 135; `sellPct.rum` vor und nach
  der Lieferung gleich. Ausgabesperre (`goodLocks`) auf Rum gesetzt → Lieferung findet trotzdem statt (R9).

**Bruch**

- **AK-SK-12** Leeres Lager: Vertrag Rum, Lager 0, → nach dem Periodenbeginn Geld genau 135 unter dem Vergleichslauf,
  `contract` `null`, Zufallsauftrag der Periode aktiv und gleich `orderForPeriod(seed, k, maxHouseTier)`,
  `StepReport.contract` = `broken`, `reason: 'stock'`, `penalty` 135. Weder Bruch noch Lieferung (AK-SK-09) setzen
  `contractOffer` (R7).
- **AK-SK-13** Teilbestand: Lager 4 → Bruch wie AK-SK-12, Lager bleibt 4 (keine Teilabbuchung).
- **AK-SK-14** Abriss Kontor: Vertrag auf Insel 1, Kontor dort abgerissen, Lager ausreichend → am Periodenbeginn Bruch
  mit `reason: 'kontor'`, Lager unverändert.
- **AK-SK-15** Funktionssperre (konstruierter Stand, `orders` nicht freigeschaltet): Bruch mit `reason: 'lock'`;
  Reihenfolge der Gründe: bei Sperre und leerem Lager zugleich lautet der Grund `lock`. `cancelContract` bei gesperrter
  Funktion → `ok`, `contract` `null`, kein Geldabzug (R5).
- **AK-SK-16** Geld negativ: Geld −50 vor dem Periodenbeginn, Bruch → Geld 135 unter dem Vergleichslauf (also
  negativ, kein Abschneiden bei 0); Lieferung bei Geld −50 zahlt voll 135.
- **AK-SK-17** Strafe skaliert: für jedes Auftragsgut gilt `penalty = ceil(m × p × CONTRACT_PENALTY_PCT ÷ 100)`.

**Kündigen und Reihenfolge**

- **AK-SK-18** `cancelContract` mitten in der Periode → `ok`, `contract` `null`, kein Geldabzug, `order` bleibt `null`
  bis zum nächsten Periodenbeginn, dort Zufallsauftrag; ohne Vertrag → `fail('Kein Vertrag')`. Bruchgrund `island`
  auf Sim-Ebene (R6.2): konstruierter Stand mit `contract.island` ausserhalb von `world.islands`, Schritt auf
  Periodenbeginn → `broken`, `reason: 'island'`, Strafe abgezogen, keine Ausnahme.
- **AK-SK-19** Kündigen am Fälligkeitstick: `world.tick = T − 1`, `cancelContract`, `step` → keine Abbuchung, kein
  Geldabzug, Zufallsauftrag der Periode aktiv. Gegenprobe: `step` auf T (Lieferung), dann `cancelContract` → Lager
  und Geld wie nach der Lieferung, nächster Auftrag erst bei `T + ORDER_PERIOD`.
- **AK-SK-20** Stufenabstieg unter 3 bei laufendem Vertrag → Vertrag besteht und liefert weiter.

**Save und Determinismus**

- **AK-SK-21** Save/Laden: Welt mit aktivem Vertrag (Insel 1) und Welt mit offenem Angebot →
  `deserialize(serialize(w))` ok und `serialize` gleich; danach gleicher Verlauf über 2 Perioden wie das Original.
- **AK-SK-22** Version: `createWorld().version === SAVE_VERSION` (gegen die Konstante). Migration (Nachtrag R584, keine
  feste Nummer): aus einer Welt der aktuellen Version ohne Vertrag und Angebot einen Stand `SAVE_VERSION − 1` bauen
  (`version` − 1, `contract` und `contractOffer` entfernt), laden und migrieren → `contract` und `contractOffer` `null`,
  `serialize` gleich dem Original, danach 10 Perioden bitgleich mit dem Original; ein
  Stand mit `version` `SAVE_VERSION + 1` → `{ ok: false, reason: 'Unbekannte Version' }`, keine Ausnahme.
- **AK-SK-23** Validierung: je ein Fall `contract` mit Gut ohne `order` (Werkzeug), `amount` 0, unbekannte Insel,
  `contract` und `order` zugleich gesetzt, `contractOffer` und `order` zugleich gesetzt → `'Beschädigter Spielstand'`.
- **AK-SK-24** Determinismus: zwei Läufe mit gleichem Seed und gleicher Aktionsfolge (Liefern, Annehmen, 5 Perioden,
  Bruch, Kündigen) ergeben bitgleiches `serialize`.
- **AK-SK-25** Baseline: `tests/sim/balance.test.ts` bleibt unverändert (keine Änderung an der Datei) und grün. Die
  Controller-Prüfung steht in `tests/sim/contract.test.ts`: Lauf mit `buildColony` (Controller) bis zum Ende,
  `contract` und `contractOffer` bleiben in jedem Schritt `null` (Nachtrag R584).

**Werte**

- **AK-SK-26** Invarianten-Test der Defs nach B.5 grün; Werte `CONTRACT_PREMIUM` 0,68, `CONTRACT_PENALTY_PCT` 100,
  `CONTRACT_MIN_TIER` 3 und die acht Mengen aus B.3.
- **AK-SK-27** Kaufen und Liefern nie Gewinn: für jedes Auftragsgut mit Edikt Handel `buy(w, g, m)` und anschliessende
  Vertragslieferung → Geld danach < Geld davor (Verlust 24–46, W.3).

**UI (Vitest reine Helfer und Browser)**

- **AK-SK-28** Kartentext-Helfer (`tests/ui/`): Angebot, aktiv (mit und ohne Insel-Zusatz), Warnzustand bei Lager 4/5
  und ohne Kontor, Meldungstexte für `delivered` und jede Bruchart liefern genau den Wortlaut aus B.4. Ist die aktive
  Insel nicht die Lieferinsel, zeigt die Karte «Lager x/5» aus dem Lager der **Lieferinsel** (Nachtrag R584).
- **AK-SK-29** Browser-Check. Aufbau (Nachtrag R584): präparierter Spielstand (aktuelle `SAVE_VERSION`), erzeugt per
  Sim-Skript aus Seed 3 mit `buildColony` bis Höchststufe 3, dann Rum 12 ins Heimatlager und aktiver Rum-Auftrag
  (Menge ≤ 12) gesetzt; im Browser über «Laden» eingespielt, Ablage unter `.studio/qa/<paket>/`. Klang wird über einen
  Spy auf die Klang-Schnittstelle der UI geprüft (Aufruf mit `orderDone` bzw. `error`), nicht nach Gehör. Ablauf: Rum-Auftrag liefern → Karte zeigt das Angebot mit Countdown;
  **Annehmen** → aktiver Zustand mit Lager x/5; am nächsten Periodenbeginn Meldung «Stammkunde: 5 Rum geliefert,
  +135», Klang-Aufruf `orderDone`; Rum auf 0 verkaufen → Warnfarbe, beim nächsten Periodenbeginn Warnmeldung mit Strafe und
  danach Auftragskarte mit Zufallsauftrag; **Kündigen** → «Stammkunde gekündigt», Karte «Nächster Auftrag in m:ss».
  Bei 1280 px überlappt die Karte die Krisenkarte nicht.

### B.8 Paketschnitt-Vorschlag und offene Punkte

**Paketschnitt (für lead-tech):**

| Paket    | Inhalt                                                                                                                                   | AK    | Schätzung  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------- |
| I047-SIM | `types.ts` (Felder, `OrderDef.contract`), `defs/goods.ts`, `orders.ts` (R1–R11), `tick.ts` (`StepReport`), `save.ts` (v14), Tests, arc42 | 01–27 | ≈ 45 Tools |
| I047-UI  | `src/ui/order.ts` (Kartenzustände, Helfer), `app.ts` (Aktionen, Meldungen, Klang), `tests/ui/`, README, Browser-Check                    | 28–29 | ≈ 35 Tools |

I047-UI setzt I047-SIM voraus. Beide zusammen Grösse M wie in Teil A geschätzt.

**Offene Punkte für L0:**

- **O-1 Save-Nummer mit Erweiterung 1 K2** (R487 P-4): beide planen v14. Empfehlung: Wer zuerst nach `main` merged,
  nimmt v14; das zweite Paket nimmt beim Merge die nächste Nummer und hängt seine Migration an die Kette an. Im Plan
  als Merge-Schritt «Version festlegen» führen, die Tests prüfen gegen `SAVE_VERSION`, nicht gegen eine Zahl.
- **O-2 Migration statt Abweisen von v13:** Das Briefing nannte Abweisen älterer Stände; die Spec sieht wegen der
  bestehenden Kette eine verlustfreie Migration v13 → v14 vor und weist nur unbekannte Versionen ab (B.3).
  Empfehlung: Migration bestätigen.
- **O-3 Zufallsauftrag im Bruch-Tick** (R7): Empfehlung so lassen, weil der Bruch dann genau «Kündigen minus Strafe»
  ist und der Auftragsplatz nie eine Periode leer bleibt. Alternative «keine Ware, kein Auftrag in dieser Periode»
  wäre eine zusätzliche Strafe ohne Spielzweck.
