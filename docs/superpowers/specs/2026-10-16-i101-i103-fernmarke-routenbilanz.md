# I-101 «Fernauftrag-Marke» und I-103 «Routen-Bilanz» (Kurzdesign, Stufe leicht)

Stand 2026-10-16 · Paket design-I-101-I-103 · Quelle: `docs/ideen.md` I-101, I-103, R676 · Save: nein (empfohlene Variante) · neuer Spielwert: nein · Vorbild: `2026-10-14-i100-neu-zaehler.md`

## Spielerzweck

- **I-101:** Der Spieler sieht auf der Seekarte an der Insel des Fernangebots oder Fernauftrags eine Marke «15 Rum · 1:20» und lenkt das Schiff dorthin, statt in der Auftragskarte nach dem Ziel zu suchen. Säule: Wirtschaft, Steuern und Handel.
- **I-103:** Im Schiff-Panel steht je Route «Warenwert +310 / min · Unterhalt 90 → +220»; der Spieler streicht die Route, die nur 40 trägt, nach Zahlen statt Bauchgefühl. Säule: dieselbe.

Beide lesen nur den vorhandenen Sim-Zustand (`world.farOffer`, `world.order.island`, `ship.route`, `goodsBalance`, `laneTicks`). Nichts im Save, kein neuer Spielwert, Baseline unberührt.

## Bündelung

**Empfehlung: zwei Teilpakete in einem Release-Strang, I-101 zuerst.** Gemeinsam ist nur die Seekarte als Ort; Dateien, Tests und Risiko sind getrennt. I-101 (reine Anzeige, ≈ 50 Tools) liefert allein Spielerwert und kann sofort laufen; I-103 braucht eine Sim-Rechnung und Entscheid zu Variante A/B/C unten. Ein Paket wäre nur dann besser, wenn derselbe Umsetzer beide in einer Session macht (dann `seaMapView.ts`/`app.ts` einmal anfassen). L0/lead-tech entscheiden den Schnitt.

## Teil 1 · I-101 Fernauftrag-Marke

### Regeln

1. **Wann:** `world.order.island` gesetzt (angenommener Fernauftrag) ergibt eine **gefüllte** Münzmarke; `world.farOffer !== null` (noch nicht angenommen) eine **hohle** (Ring). Beide schliessen sich aus (Handel-2-Spec §3 R15). Sonst keine Marke.
2. **Wo:** über dem Anker der Fern-Insel, über der Kontor-Marke (diese bleibt; Marke liegt eine Markenhöhe höher). Gezeichnet in `drawSeaMap` nach den Silhouetten, vor den Schiffspunkten.
3. **Text:** `<Menge> <Gut> · <m:ss>` («15 Rum · 1:20»). Zeit beim Auftrag `due − tick`, beim Angebot bis zum Angebotsverfall (gleiche Frist wie `farOfferText`, T-02). Wiederverwendet werden die Formatierer `formatGameTime`, `GOODS[..].name`; kein neuer Wortlaut ausser der Kurzform.
4. **Warnfarbe:** Fernauftrag, dessen Insel kein Kontor mehr hat (`farOrderWarn`, T-05), zeichnet die Marke in Warnfarbe. Beim Angebot ohne Kontor ebenso (Annehmen schlüge fehl, Handel-2-Spec R5).
5. **Ohne Mausfang:** Die Marke hat keine eigene Trefferfläche; `seaMapPick` und `hitIsland` bleiben unverändert. Der Hover-Text der Insel (`seaMapTip`) bekommt als letzten Abschnitt «Fernauftrag: <Menge> <Gut> · <m:ss>» bzw. «Fernangebot: …».
6. **Weg:** Lieferung, Verfall, Ersatz durch neues Angebot und Laden eines Stands ändern `world`; die Marke verschwindet im nächsten Anzeige-Schritt. Kein eigener Zustand.
7. **Neuzeichnen:** `seaMapKey` enthält die Markenzeile (Insel, Art, Text in ganzen Sekunden, Warnflag); die Karte zeichnet damit höchstens einmal je Sekunde neu. Bei Pause (Spielstand steht) bleibt der Schlüssel gleich, die Marke steht still.
8. **Abgrenzung:** kein Klick-Sprung auf die Marke, kein Schiffsbefehl, keine Marke für Verträge oder Stammkunde; kein Ton.

### Umsetzungsrahmen (Richtung, kein Plan)

- `src/ui/farOrder.ts`: reiner Helfer `farMark(world): FarMark | null` mit `{ island, kind: 'offer' | 'order', text, warn }`, baut auf `farOfferText`-Daten, `farOrderWarn` auf.
- `src/render/seaMap.ts`: `MapUi` bekommt `mark: FarMark | null` (Render importiert nichts aus `ui`: Typ als eigene Schnittstelle in `seaMap.ts`, `farMark` liefert strukturgleich); `drawSeaMap` zeichnet Münze und Text.
- `src/ui/seaMapView.ts`: `seaMapKey` und `seaMapTip` erweitern. `app.ts`: Marke beim Aufruf von `drawSeaMap` übergeben (eine Zeile; **Überschneidung UI-HAEPPCHEN-E**, siehe unten).

### Abnahmekriterien I-101

| ID    | Prüfung                                                                                                                                                                                                                                    | Art                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| AK-M1 | `farMark` ohne `farOffer` und ohne `order.island`: `null`; mit gewöhnlichem Auftrag (ohne `island`): `null`                                                                                                                                | Vitest `tests/ui/farOrder.test.ts`                 |
| AK-M2 | Mit `farOffer` liefert `farMark` `kind 'offer'`, mit `order.island` `kind 'order'`; Text `«<Menge> <Gut> · m:ss»` mit Zeit aus `due − tick` bzw. Angebotsfrist                                                                             | Vitest                                             |
| AK-M3 | `warn` ist true, wenn `islands[island].kontorId === null`, sonst false; entspricht `farOrderWarn` für den Auftrag                                                                                                                          | Vitest                                             |
| AK-M4 | `seaMapKey` ändert sich, wenn Marke erscheint, verschwindet, ihre Sekundenzahl oder ihr Warnflag wechselt; bleibt gleich bei gleichem Stand (Pause)                                                                                        | Vitest `tests/ui/seaMapView.test.ts`               |
| AK-M5 | `seaMapTip` der Fern-Insel endet auf den Fern-Abschnitt; jede andere Insel und der Stand ohne Fernauftrag sind bitgleich zu heute                                                                                                          | Vitest                                             |
| AK-M6 | `drawSeaMap` mit Marke zeichnet genau eine Marke (Fake-Kontext: ein Kreis/Ring plus ein `fillText`), Ring bei `offer`, gefüllt bei `order`, Warnfarbe bei `warn`; ohne Marke identische Aufrufliste wie heute                              | Vitest `tests/render/seaMap.test.ts` mit `fakeCtx` |
| AK-M7 | `seaMapPick` auf der Markenfläche liefert dasselbe wie ohne Marke (kein Mausfang)                                                                                                                                                          | Vitest                                             |
| AK-M8 | Browser-Check: Fernangebot erscheint, Marke hohl an der Fern-Insel; Annehmen: gefüllt; Liefern/Verfall: weg; Kontor abreissen: Warnfarbe; bei 1280×720 ist der Text nicht abgeschnitten (Marke nahe Kartenrand wird in die Karte geklemmt) | Browser (`qa-playtester`)                          |

### Randfälle I-101

Kein Kontor auf der Fern-Insel (AK-M3, M8); Angebot abgelaufen oder angenommen (Wechsel hohl → gefüllt → weg, AK-M2/M4); Fernauftrag und Seekarte nicht freigeschaltet (`seaMapUnavailable`, dann gibt es auch kein Fernangebot, kein Zeichnen); Marke am Kartenrand (Klemmen, AK-M8); mehrere Inseln eng beieinander (Text überdeckt Nachbarmarke: nur eine Marke gleichzeitig, kein Konflikt); Pause (AK-M4).

## Teil 2 · I-103 Routen-Bilanz

### Befund: kein Zähler vorhanden

`Ship` führt keine Fahrten- oder Erlöszähler (`types.ts`: `id, port, to, left, cargo, route, homing`); `world.stats` hat nur `taxes`, `upkeep`. Eine **gemessene** Bilanz bräuchte neuen Zustand und damit einen Save-Sprung.

### Varianten

| Var.  | Was                                                                                                                                                                           | Save                                                                                                     | Ehrlichkeit                                                                                                  | Empfehlung                                                                                                      |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| A     | **Potenzial voll beladen:** je Richtung Ladung `⌊50 ÷ Gutzahl⌋` je Gut, mal `sell`, über Umlaufzeit                                                                           | nein                                                                                                     | zu optimistisch bei Routen, deren Quellinsel nichts übrig hat                                                | nur Rückfall                                                                                                    |
| **B** | **Potenzial mit Flussdeckel:** wie A, aber je Gut höchstens der nominale Nettoüberschuss der Quellinsel über die Umlaufzeit (`goodsBalance(...).net`); Beschriftung «nominal» | **nein**                                                                                                 | trifft genau den Fall «Route trägt nur 40»; Untergrenze, Lagerbestand und Zweitverteilung nicht eingerechnet | **empfohlen**                                                                                                   |
| C     | **Gemessen:** Schiff zählt Warenwert geladen und Startzeit (`earned`, `since`)                                                                                                | **ja** (Version +1, Migration, Rückfaltschritt für Golden-Hashes, Validierung, Abweisungstest, Baseline) | exakt, aber erste Minuten leer; Umleitung/Neuroute setzt zurück; Spieler lernt später                        | nicht jetzt; erst wenn B im Playtest zu ungenau ist (dann hinter I-091, nächste freie Save-Nummer, R583-Muster) |

**Empfehlung B**, weil der Spieler eine Entscheidung vor dem Bauen und beim Prüfen alter Routen braucht, nicht ein Messprotokoll, und weil I-091 die Save-Nummer gerade belegt. Aufwandsgrenze: bei Wechsel auf C wächst das Paket auf M mit Save und Baseline.

### Regeln (Variante B)

1. **Umlaufzeit** `T = laneTicks(a, b) + laneTicks(b, a)`; Umschlag kostet keine Ticks (`handleDocked` fährt im selben Tick ab). Pro Minute gilt 600 Ticks (Einheit «/ min» wie `docs/spielwerte.md`).
2. **Menge je Richtung und Gut:** `q = min(⌊SHIP.capacity ÷ k⌋, ⌊max(0, net_Quelle × T ÷ 100)⌋)`; `k` = Gutzahl der Richtung (≤ 2), `net_Quelle` = `goodsBalance(world, Quellinsel).net[gut]` je 100 Ticks. Die Zweitverteilung freier Kapazität (`load`) bleibt unberücksichtigt: Das Ergebnis ist eine Untergrenze und das Panel sagt es («nominal, ohne Lager und Handel»).
3. **Warenwert** = Σ q × `GOODS[gut].sell` beider Richtungen; Vorliebe, Handel, Aufträge, Edikte nicht eingerechnet. Gespartes Gewürz zum `buy`-Preis bleibt **aus** (Offene Frage 1).
4. **Bilanz je min** = `Warenwert × 600 ÷ T − SHIP.upkeep × 6`, auf ganze Zahlen abgerundet (erst summieren, dann einmal runden, wie `totalTaxes`). Der Unterhalt entspricht dem Handelsschiff-Eintrag «90 / min».
5. **Anzeige:** in der Schiffszeile bzw. dem Schiff-Panel unter `routeLine`: «Warenwert +310 / min · Unterhalt 90 → +220» (negatives Ergebnis mit Minus, Warnfarbe). Nur bei Schiffen mit Route; ohne Route nichts (Heimfahrt, frei).
6. **Mehrere Schiffe auf demselben Paar:** jede Zeile rechnet, als wäre das Schiff allein (Quellüberschuss wird nicht geteilt); Hinweis im Tooltip «Weitere Schiffe auf dieser Route teilen den Überschuss». Kein Gesamtwert über die Flotte (Abgrenzung).
7. **Schiff im Bau** gibt es nicht (Kauf ist sofort); **Schiff umgeleitet** (`updateRoute`/`clearRoute`): die Zeile folgt `ship.route` im nächsten Anzeige-Schritt, bei `homing` entfällt sie. **Pause:** Anzeige liest nur Zustand, ändert sich nicht. **Route ohne Fahrten** (gerade gesetzt): Potenzialwert wird trotzdem gezeigt (er ist nominal, keine Messung) und das Panel nennt ihn so.
8. **Kosten:** nur bei offenem Schiff-Panel gerechnet (nicht in `tick`); `goodsBalance` je Quellinsel einmal je Anzeige-Schritt (Muster `balancePreview`). Anzeige-Schlüssel `shipsKey` um die Bilanzzeile erweitern.
9. **Abgrenzung:** kein Sim-Zustand, kein Zähler, keine Verlaufskurve (I-067), keine Empfehlung «Route streichen», kein Eingriff in `tickShips`.

### Umsetzungsrahmen (Richtung, kein Plan)

- `src/sim/routeBalance.ts` (neu, DOM-frei, lesend): `routeBalance(world, route): { goodsPerMin: number; upkeepPerMin: number; net: number }` und `legCargo`; Spielwerte nur aus `defs`.
- `src/ui/ships.ts`: Text-Helfer `routeBalanceText(world, route)`, Einbau in `shipRows`/`renderShipSection`/`shipsKey`.

### Abnahmekriterien I-103

| ID     | Prüfung                                                                                                                                                                                         | Art                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| AK-B1  | `routeBalance` einer Route mit einem Gut je Richtung bei grossem Überschuss: Menge je Richtung 50 (`SHIP.capacity ÷ 1`), Warenwert aus Hand-Rechnung `Σ q·sell × 600 ÷ T` mit Werten aus `defs` | Vitest `tests/sim/routeBalance.test.ts` |
| AK-B2  | Zwei Güter in einer Richtung teilen `⌊50 ÷ 2⌋ = 25` je Gut                                                                                                                                      | Vitest                                  |
| AK-B3  | Quellinsel mit Nettoüberschuss 0 oder negativ: Menge 0 für das Gut; Route ohne jeden Überschuss: Warenwert 0, Bilanz `−SHIP.upkeep × 6`                                                         | Vitest                                  |
| AK-B4  | Flussdeckel: Überschuss `net` je 100 Ticks begrenzt die Menge auf `⌊net × T ÷ 100⌋`, wenn kleiner als der Anteil                                                                                | Vitest                                  |
| AK-B5  | Unterhalt = `SHIP.upkeep × 6` (90); Ergebnis `net = goodsPerMin − 90` ganzzahlig abgerundet                                                                                                     | Vitest                                  |
| AK-B6  | Reine Funktion: `JSON.stringify(world)` vor und nach dem Aufruf gleich; `world.ships` und Stände unverändert (kein Save, keine Baseline)                                                        | Vitest                                  |
| AK-B7  | `routeBalanceText`: Schiff ohne Route, Heimfahrt: `null`; Route mit Gewinn: «Warenwert +310 / min · Unterhalt 90 → +220»-Muster; Verlust mit Minus und Warnflag                                 | Vitest `tests/ui/ships.test.ts`         |
| AK-B8  | `shipsKey` ändert sich bei Routenwechsel und bei geänderter Bilanzzeile, sonst nicht                                                                                                            | Vitest                                  |
| AK-B9  | Browser-Check: Route Heimat ⇄ Fremdinsel setzen, Panel zeigt Zeile mit Zusatz «nominal»; Route löschen: Zeile weg; zweites Schiff auf demselben Paar: Tooltip-Hinweis                           | Browser (`qa-playtester`)               |
| AK-B10 | `make check` und Balancing-Test unverändert grün (kein Wert in `defs` geändert)                                                                                                                 | `make check`                            |

### Randfälle I-103

Route ohne Fahrten (Regel 7); Schiff umgeleitet oder aufgelöst (AK-B7/B8); Pause (Anzeige statisch); Quellinsel ohne Betriebe (AK-B3); Gut ohne Preis ist nicht möglich (alle `GOODS` haben `sell`); sehr kurze Lane (T klein → hoher Wert je min, durch Deckel `⌊net·T÷100⌋` begrenzt, kein Überlauf); Entartung «Anzeige als Ziel»: Bilanz ist Untergrenze und rät nie zu Überschuss, Spieler bleibt Wahl zwischen Schiff und Verkauf (Lager mit `sell` gleicher Preis, kein dominanter Pfad).

## Überschneidungen

- **UI-HAEPPCHEN-E (`order.ts`, `app.ts`):** I-101 berührt `app.ts` nur im Aufruf von `drawSeaMap` (eine Zeile, `MapUi` füllen); `order.ts` bleibt unberührt. I-103 berührt `app.ts` gar nicht (`ships.ts` ist eigener Scope). Konfliktrisiko gering, Reihenfolge: nach UI-HAEPPCHEN-E mergen oder `main` per Merge holen.
- **I-091 (Save-Nummer):** Variante B/I-101 berühren Save nicht; kein Konflikt. Nur bei Wechsel auf C: Migration hinter I-091, nächste freie Nummer (R583-Muster).
- **Handel 2 (live, REL-23):** `farMark` baut auf `farOfferText`/`farOrderWarn`; keine Änderung an `farOrder.ts`-Bestand ausser dem neuen Helfer.
- **I-102 (Auftragsvorschau, offen):** teilt `farOfferText`-Daten; keine Doppelung.

## Offene Fragen (Empfehlung je Frage)

1. Gespartes Gewürz zum `buy`-Preis einrechnen? **Nein**, `sell` einheitlich (Untergrenze, einfach). Sonst wirbt die Zeile für Gewürzrouten über den Verkaufswert hinaus.
2. Marke auch für das noch nicht angenommene Fernangebot? **Ja** (hohl): gerade vor dem Annehmen entscheidet der Spieler, ob ein Schiff dorthin kann.
3. Variante B vs. A: **B**; Tech bestätigt, dass `goodsBalance` je Quellinsel pro Anzeige-Schritt bei vier Schiffen billig genug ist (≤ 4 Aufrufe).

## Selbstprüfung (Gate Kurzdesign)

Säule Handel/Bedienung gestärkt; echte Wahl (Schiff halten oder streichen, Angebot annehmen oder nicht); keine neue Rückkopplung, nichts im Zustand; Randfälle genannt; einfachere Variante (A) benannt und verworfen, C zurückgestellt. Urteil: OK.
