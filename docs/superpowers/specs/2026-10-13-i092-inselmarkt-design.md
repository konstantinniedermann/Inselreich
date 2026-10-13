# I-092 Inselmarkt-Vorliebe — Designvorschlag und Spec

Stand: 2026-10-13 · Paket `design-I-092` · Autor: lead-design (Teil A), design-spec-author (Teil B), Werte:
design-economy-designer ([Anhang 01](2026-10-13-i092-inselmarkt-design/anhang-01-werte.md), «W.n» verweist dorthin) ·
Grundlage: `docs/ideen.md` I-092 (IDEEN-09), R606 · Prozessstufe voll.

## Teil A · Designvorschlag (Gate Brainstorming)

### A.1 Spielerzweck in einem Satz

Der Spieler liest an der Weidenau-Karte «Markt: Glas +30 %» und schickt seinen Glas-Überschuss per Schiff dorthin,
statt ihn daheim zu verkaufen.

### A.2 Ausgangslage

- Preise und Sättigung (`sellPct`) sind **global**: Ein Gut bringt an jedem Kontor denselben Erlös (`sellPrice`,
  `trade.ts`). Wohin ein Schiff Ware bringt, ist für den Verkauf gleichgültig.
- Fremdinseln unterscheiden sich heute nur in der **Erzeugung** (Traits, M14-E1: `TRAIT_BUILDINGS`, Zyklus ×2).
- Die Markterholung beträgt 60 Punkte je Minute (+1 je 10 Ticks, Anhang «Konventionen»). Zum Vollpreis lassen sich
  also höchstens 60 Stück je Gut und Minute verkaufen; alle Obergrenzen in Teil B rechnen damit (sichere Seite).

### A.3 Abgrenzung (vor der Option geprüft)

- **I-029** (Zeitnachfrage) und **I-006** (Kaufseite) bleiben geparkt und werden nicht berührt.
- **I-047 Stammkunde** liest weder `sell` noch `sellPct` (W.6 Punkt 5): keine Wechselwirkung.
- **I-095 Fernauftrag** ist geparkt (R606), nicht Teil.
- **M14-E1 Traits** bleiben unverändert; die Trait-Regel (A.5) liest sie nur.
- **Erweiterung 1** (Branch `design/erweiterung-1`, dort Spec §10: keine Änderung an bestehenden Preisen; neue Güter
  Porzellan, Konfekt): I-092 ändert **keine Preise in `GOODS`**, sondern setzt nur einen Faktor am Fremdkontor. Die
  Liste `prefers` bleibt für Erweiterung 1 offen; deren Güter sind nicht Teil dieser Spec.

### A.4 Optionen

**O1 · Scout-Tabelle (zwei Güter je Insel, ×1,30).** Spielerzweck: «Jede Insel kauft zwei Güter teurer.» Save nein,
Aufwand S. **Verworfen** (W.8): Werkzeug wird so spürbar wie Stoff, obwohl es kein Konsumgut ist; Holz und Nahrung sind
tote Einträge (Netto −45 … −86 je Fahrt); die Möweninsel mit Rum und Stoff auf dem kürzesten Weg dominiert.

**O2 · Ein Konsumgut je Insel, Zuordnung A, `PREFER_PCT` 130 (Empfehlung).** Möweninsel Stoff, Weidenau Glas,
Felsbucht Rum. Spielerzweck: «Wohin mein Überschuss fährt, hängt am Gut: Stoff nah, Glas mittel, Rum fern.» Save nein
(feste Tabelle in `defs`), Aufwand S–M (ein Paket).

**O3 · Gewürfelte Zuordnung je Karte.** Spielerzweck: «Jede Karte hat andere Märkte.» Save ja oder stille Ableitung
aus dem Seed, Aufwand M. **Verworfen** (W.8): Mit Trait-Regel sind nur A und B zulässig, also ein Münzwurf; in 50 % der
Karten ist Felsbucht tot (Zuordnung B, W.3). Braucht einen eigenen Zufallsstrom und eine Save-Entscheidung.

### A.5 Empfehlung und Leitplanken

O2 mit Zuordnung A und `PREFER_PCT` 130 (W.1: einziger Kandidat mit K1 «spürbar» und K2 «Rohgut trägt nicht»).
Leitplanken für Werte und Tests:

1. **Trait-Regel:** kein Vorliebe-Gut, dessen Kette der Trait derselben Insel verkürzt (`TRAIT_BUILDINGS`). Daraus
   folgt Weidenau = Glas (W.3).
2. **Gewürz nie** (alle drei Inseln tragen `spice`).
3. **Kein Rohgut:** Verkaufspreis `s > 6` (W.1 K2, W.2).
4. **Boom und Vorliebe stapeln nicht, das Höhere gilt** (W.5): sonst Kauf-und-Verkauf-Gewinn bei Rum (35,1 > 32).
5. **Kein Kauf-und-Verkauf:** `max(BOOM_PCT, PREFER_PCT) · s < 80 · b` für jedes Vorliebe-Gut (W.5).

### A.6 Annahmen (Rückfragen an L0, selbst beantwortet)

| ID   | Frage                                                | Annahme (Empfehlung)                                                                                                |
| ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| AN-1 | Stapeln Boom und Vorliebe?                           | Nein, das Höhere gilt (A.5 Punkt 4). Neue Regel → Ruling-Entwurf (B.8 O-1)                                          |
| AN-2 | Obergrenze R3/R4 (≤ 17–24 % von (b)) bremsen?        | Hinnehmen (W.4); strengere Sättigung **abgelehnt** (unten)                                                          |
| AN-3 | Glas von Felsbucht (Trait) nach Weidenau (Vorliebe)? | Hinnehmen; die Trait-Regel gilt nur je Insel, der Vorteil bleibt in der Obergrenze `(f − 1) · s · 60` (W.6 Punkt 2) |
| AN-4 | Wo sieht der Spieler die Vorliebe?                   | An der Inselkarte und im Handelsdialog des Fremdkontors; keine eigene Seekarten-Ebene                               |

Begründung AN-2: Die Obergrenze braucht ≈ 30 Zusatzbetriebe und einen Verkaufsklick je Gut alle 10 s (W.4). Die
strengere Variante «Vorliebe-Verkauf senkt `sellPct` um 2» wird abgelehnt: Mit doppeltem Abfall fiele der
Ladungsverkauf (50 Stück, ein Klick) im Mittel auf ≈ 55 % statt 75,5 %; 1,3 · 0,55 = 0,715 < 0,755 läge **unter** dem
Heimpreis. Der Spielerzweck (A.1) wäre gebrochen.

### A.7 Selbstprüfung Gate Brainstorming — Urteil OK

1. **Säulen:** stärkt Handel (Ortswahl beim Verkauf) und Besiedeln mit (eine Fremdinsel bekommt eine Absatzrolle,
   nicht nur eine Erzeugerrolle). Misslingt die Idee, leidet nur der Handel; die Heimat bleibt bitgleich.
2. **Spielerzweck und erste 15 min:** in einem Satz sagbar (A.1). Echte Wahl: Zuordnung A gleicht Wert gegen Weg aus,
   45–136 Geld je Schiff und Minute, keine Insel dominiert (W.3). Rückkopplung klein: realistisch +72/min = 2,3 % von
   (b), zusammen mit I-047 +165 = 5,2 % (W.4). **Hinweis nahe BEDENKEN:** Das Spielgewicht entsteht erst mit der
   Seefahrt (nach dem Bürger-Ziel); in den ersten 15 min ist I-092 unsichtbar. Wie bei I-047 hingenommen.
3. **Scope:** klar begrenzt (B.1), ein Paket, Stufe voll oder leicht nach L0.
4. **Fremde Inhalte:** nur die Genre-Mechanik «regionale Nachfrage» (ADR-006), keine Namen oder Inhalte.
5. **Einfachste Variante:** eine Konstante, ein Feld je Insel, kein Save. Einfacher geht es nicht, ohne die Ortswahl zu
   verlieren.

## Teil B · Spec

Grundlage: Teil A (O2, Leitplanken A.5, Annahmen AN-1…AN-4) und Anhang 01 (Werte W.1–W.8). Code-Stellen beziehen sich
auf `main` zum Datum dieser Spec.

### B.1 Ziel und Nicht-im-Umfang

**Ziel.** Jede Fremdinsel zahlt für genau ein Konsumgut 30 % mehr. Der Faktor wirkt beim Verkauf am Kontor dieser
Insel; die Sättigung bleibt global. Die Heimat hat keine Vorliebe. Inselkarte und Handelsdialog zeigen die Vorliebe
an.

**Ausdrücklich nicht im Umfang:**

- keine Wirkung auf die Kaufseite (`buy`, `buyPct`, `BUY_RISE`, Edikte); I-006 bleibt geparkt;
- keine wechselnde, zeitabhängige oder gewürfelte Vorliebe (O3, I-029);
- keine Vorliebe der Heimat;
- keine eigene Sättigung je Insel (`sellPct` bleibt ein globaler Wert je Gut);
- kein automatischer Verkauf durch Schiffsrouten (Routen entladen weiter nur ins Insellager, W.6 Punkt 4);
- keine Güter aus Erweiterung 1 (Porzellan, Konfekt) und keine Änderung an Preisen in `GOODS`;
- keine Änderung an Aufträgen und Stammkunde (`orders.ts`), an Booms und an Traits;
- keine eigene Seekarten-Ebene oder Legende (AN-4);
- keine Controller-Strategie für Fremdverkauf (B.5).

### B.2 Regeln

**Werte** in `src/sim/defs/sea.ts` (W.1, W.3, W.8 «Def-Form»):

| Ort                  | Feld / Konstante             | Wert                                  |
| -------------------- | ---------------------------- | ------------------------------------- |
| `IslandDef`          | `prefers: readonly GoodId[]` | Pflichtfeld, Liste der Vorliebe-Güter |
| `ISLANDS` Möweninsel | `prefers`                    | `['cloth']`                           |
| `ISLANDS` Weidenau   | `prefers`                    | `['glass']`                           |
| `ISLANDS` Felsbucht  | `prefers`                    | `['rum']`                             |
| Modul `sea.ts`       | `PREFER_PCT`                 | `130` (Prozent, Ganzzahl)             |

- **R1 Vorliebe einer Insel.** Ein Gut `g` ist auf Insel `i` Vorliebe-Gut, wenn `world.islands[i].kind` nicht `home`
  ist und der `IslandDef` mit diesem `kind` `g` in `prefers` führt (Nachschlagen wie `traitOf`, `levels.ts`). Die
  Heimat hat nie eine Vorliebe. Ein reiner Helfer (Vorschlag `prefersGood(world, island, good)`) liegt in `src/sim/`,
  damit Sim und UI dieselbe Abfrage nutzen.
- **R2 Faktor.** `sellPrice(world, good, n, island = HOME)` rechnet mit
  `m = max(boom ? BOOM_PCT : 100, prefersGood(world, island, good) ? PREFER_PCT : 100)`, wobei `boom` wie heute
  «laufende Krise `boom` auf diesem Gut» bedeutet. Boom und Vorliebe stapeln nicht (A.5 Punkt 4, W.5).
- **R3 Ganzzahl und Sättigung unverändert.** Je Stück `acc += s · pct · m`, danach `pct = max(SELL_FLOOR,
pct − SELL_DROP)`; Erlös `floor(acc ÷ 10 000)`. Der Abfall bleibt 1 Punkt je Stück, global, Boden 30 (W.5,
  AN-2). Ohne Inselargument oder mit `HOME` ist das Ergebnis bitgleich zu heute.
- **R4 Verkauf.** `sell(world, good, n, island)` gibt `island` an `sellPrice` weiter. Prüfreihenfolge und Fehlgründe
  bleiben: «Unbekannte Insel», «Kein Kontor auf <Name>» (`noKontorTrade`), «Ungültige Menge», «Nicht genug Ware».
  Danach `sellPct` wie heute um `n · SELL_DROP` gesenkt (Boden 30).
- **R5 Verkaufsort zählt, nicht Herkunft.** Ware hat keine Herkunft; der Faktor hängt allein an der Insel des Kontors,
  an dem verkauft wird (AN-3, W.6 Punkt 2).
- **R6 Keine weitere Wirkung.** `buy`, `buyPrice`, `tickMarket`, Aufträge, Stammkunde, Krisen und Routen lesen die
  Vorliebe nicht. `sell` prüft `goodLock` weiterhin nicht (W.6 Punkt 7).

**Rechenbeispiele** (Formel R2/R3, Preise aus `GOODS`: Stoff s 12, Rum s 18, Glas s 20; `sellPct` 100):

| Fall                                   | Rechnung                     | Erlös |
| -------------------------------------- | ---------------------------- | ----- |
| 1 Glas, Weidenau                       | floor(20 · 100 · 130 ÷ 10⁴)  | 26    |
| 1 Glas, Heimat oder Felsbucht          | floor(20 · 100 · 100 ÷ 10⁴)  | 20    |
| 1 Stoff, Möweninsel                    | floor(12 · 100 · 130 ÷ 10⁴)  | 15    |
| 1 Rum, Felsbucht                       | floor(18 · 100 · 130 ÷ 10⁴)  | 23    |
| 1 Rum, Felsbucht, Boom Rum             | floor(18 · 100 · 150 ÷ 10⁴)  | 27    |
| 10 Glas, Weidenau (pct 100 … 91)       | floor(20 · 955 · 130 ÷ 10⁴)  | 248   |
| 10 Glas, Heimat                        | floor(20 · 955 · 100 ÷ 10⁴)  | 191   |
| 50 Glas, Weidenau (Ladung, Σ pct 3775) | floor(20 · 3775 · 130 ÷ 10⁴) | 981   |
| 50 Glas, Heimat                        | floor(20 · 3775 · 100 ÷ 10⁴) | 755   |
| 1 Glas, Weidenau, `sellPct` 30         | floor(20 · 30 · 130 ÷ 10⁴)   | 7     |

Die Differenz 981 − 755 = 226 ist der Bonus je Fahrt `Bf` für Glas aus W.2.

### B.3 Zustand und Save

- Kein neues Feld im Weltzustand, keine neue Aktion, kein Zufallsstrom. `prefers` und `PREFER_PCT` sind feste Defs.
- **Save: nein.** `SAVE_VERSION` bleibt, keine Migration, `src/sim/save.ts` und der Typ `World` bleiben unverändert.
  Alte Spielstände laden wie bisher und verkaufen ab dem Laden mit Vorliebe.
- Determinismus unverändert: `sellPrice` bleibt rein, `sell` verändert nur `money`, Lager und `sellPct`.

### B.4 Bedienung und UI

Desktop-first ab 1280 px (CLAUDE.md «UI-Regel»). Alle Texte bilden Prozent aus `PREFER_PCT` bzw. `BOOM_PCT` und Namen
aus `GOODS`; kein Wert steht hart in `src/ui/`.

- **U1 Inselkarte** (`src/ui/islandCard.ts`): Für jede Fremdinsel mit nicht leerem `prefers` folgt nach den
  Trait-Zeilen von `traitEffectTexts` je Gut eine Zeile `Markt: <GOODS[g].name> +<PREFER_PCT − 100> %`, z. B.
  «Markt: Glas +30 %». Vorschlag: reiner Helfer `marketTexts(def)`, von `islandEffectTexts` angehängt. Heimat: keine
  Zeile. Die Seekarte (`seaMapView.ts`) zeigt die Zeile über `islandEffectTexts` ohne eigene Änderung.
- **U2 Erlös im Handelsdialog** (`src/ui/trade.ts`): `sellTexts(world, good, n, island)` bekommt die Insel und ruft
  `sellPrice(world, good, n, island)`. Beide Aufrufer (Aufbau der Knöpfe, `updateTrade`) reichen die Insel des Dialogs
  weiter. Knopf und Tooltip nennen damit den Erlös inklusive Faktor, z. B. «−1 · 26 Geld», Tooltip
  «1 Glas verkaufen für 26 Geld».
- **U3 Kennzeichnung** in der Zeile des Vorliebe-Guts (neues Feld `prefer-<good>` neben `boom-<good>`), Text aus
  einem reinen Helfer (Vorschlag `preferTag(world, island, good)`):
  - Vorliebe-Gut, kein Boom auf dem Gut: «Vorliebe +30 %»;
  - Vorliebe-Gut mit Boom auf dem Gut: «statt Vorliebe +30 %», neben der bestehenden Marke «Boom +50 %» (wirksam ist
    das Höhere);
  - sonst leer, Feld verborgen (auch in der Heimat).
- **U4 Heimat:** Dialog «Handel am Kontor» unverändert (gleiche Erlöse, keine neue Marke).

### B.5 Balancing-Auswirkung

- **Baseline bitgleich** (W.7): Der Controller verkauft nur in `sellSurplus` (`tests/sim/controller.ts`, Z. 264–268)
  mit `sell(w, g, …)` **ohne Inselargument**, also `HOME`; dort ist `m` wie heute. `tests/sim/balance.test.ts` und der
  Controller bleiben unverändert und grün. Kein Balancing-Ruling nötig.
- **Wirkung im Spiel** (W.4, f 1,30, Zuordnung A): Phase (a) keine (Seefahrt erst nach dem Bürger-Ziel). Realistisch
  R1 (Glas-Überschuss 12/min über die hin leere Gewürzroute) **+72/min = 2,3 % von (b)**, 1,4 % von (c); zusammen mit
  I-047 +165/min = 5,2 % von (b). Eigenes Schiff nur für 12/min lohnt nicht (R2: 72 − 90 < 0).
- **Bekannte Obergrenze** (AN-2): R3 (eigene Ketten daheim, Schiff, 60/min je Gut, Stückelverkauf) +492 … +546/min
  ≤ 17 % von (b); R4 (Ketten auf der Fremdinsel) +570 … +750/min ≤ 24 % von (b); mit Ladungsverkauf nur +160/min
  (5,0 %). Voraussetzung ≈ 30 Zusatzbetriebe und ein Verkaufsklick je Gut alle 10 s. Keine neue Art Geldquelle: Ohne
  I-092 bringt Felsbucht-Glas schon 555/min (W.4).
- **Keine dominante Strategie** (W.4): Rendite auf Unterhalt Rum-Paar Felsbucht 36 % gegen Holzfäller daheim 167 %;
  Wohnen bleibt Pfad 1.
- **Kauf-und-Verkauf ausgeschlossen** (W.5): wirksamer Faktor höchstens 150; Stoff 18 < 24, Rum 27 < 32, Glas 30 < 40.

### B.6 Abgrenzung und Doku-Folgen

- **Randfälle** (W.6) und ihre Behandlung:

| Nr. | Randfall                                    | Behandlung                                                 |
| --- | ------------------------------------------- | ---------------------------------------------------------- |
| 1   | Produktion und Verkauf auf der Fremdinsel   | hingenommen, in der Obergrenze R4 (B.5)                    |
| 2   | Trait der einen, Vorliebe der anderen Insel | hingenommen (AN-3, R5); AK-IM-03                           |
| 3   | alles an eine Insel                         | ein Gut je Insel, `sellPct` global; AK-IM-02, AK-IM-07     |
| 4   | Schiff nur fürs Verkaufen, Pendel           | nicht im Umfang (kein Routenverkauf), B.1                  |
| 5   | Aufträge, Stammkunde                        | keine Wechselwirkung (R6); Review: `orders.ts` unverändert |
| 6   | Fremdkontor fehlt oder abgerissen           | Fehlgrund unverändert; AK-IM-09                            |
| 7   | Krisen (Boom, Brand, Sturm)                 | Boom per R2; Verkauf ohne `goodLock` wie heute; AK-IM-06   |
| 8   | Rückweg in die Heimat                       | keine Vorliebe; AK-IM-04                                   |
| 9   | leeres Lager am Fremdkontor                 | «Nicht genug Ware» wie heute; AK-IM-09                     |
| 10  | alter Spielstand                            | lädt unverändert, Vorliebe wirkt sofort (B.3); AK-IM-10    |

- **Doku-Folgen** (im Umsetzungspaket): `README.md` Spielanleitung, Abschnitt «Seefahrt und Gewürz»: Inselmärkte mit
  Tabelle der drei Inseln (Gut, +30 %, Boom gilt statt Vorliebe). `docs/spielwerte.md` Abschnitt «Kontor II»: Preise
  global, ausser Vorliebe-Gut am Fremdkontor ×1,30, nicht mit Boom gestapelt. `docs/arc42.md`: keine Änderung (Tick
  und Persistenz unberührt).

### B.7 Abnahmekriterien

Vitest unter `tests/sim/` (Sim) und `tests/ui/` (reine Helfer); Browser-Check durch qa-playtester. Testwelten setzen
Inseln mit Kontor, Lager, `sellPct` und Krise direkt. Weidenau, Felsbucht, Möweninsel meinen die Insel mit dem
jeweiligen `kind` (C, B, A). Alle Erlöse aus B.2.

**Werte**

- **AK-IM-01** `PREFER_PCT === 130`; `prefers` von Möweninsel `['cloth']`, Weidenau `['glass']`, Felsbucht
  `['rum']`.
- **AK-IM-02** Invarianten-Test über `ISLANDS`: je Insel höchstens ein Gut in `prefers`; jedes Vorliebe-Gut hat
  `GOODS[g].sell > 6`, ist nicht `spice`, kein Betrieb aus `TRAIT_BUILDINGS` der Traits derselben Insel gehört zur
  Kette von `g` (Erzeuger von `g` und rekursiv die Erzeuger seiner Eingänge, aus `BUILDING_DEFS`; z. B. Weidenau
  `fertile` → Schäferei in der Stoff-Kette), und `max(BOOM_PCT, PREFER_PCT) · sell < 80 · buy`. Gegenprobe im Test:
  Stoff auf Weidenau oder Glas auf Felsbucht verletzt die Regel.

**Erlös**

- **AK-IM-03** Faktor: `sellPrice` mit Inselargument liefert 1 Glas Weidenau 26, 10 Glas Weidenau 248, 50 Glas
  Weidenau 981, 1 Stoff Möweninsel 15, 1 Rum Felsbucht 23. `sell(w, 'glass', 10, weidenau)` erhöht `money` um genau 248. Glas, das vorher per Schiff von Felsbucht kam, erzielt in Weidenau denselben Erlös (R5).
- **AK-IM-04** Heimat bitgleich: Für jedes Gut, `n ∈ {1, 10, 50}` und `sellPct ∈ {100, 30}` gilt
  `sellPrice(w, g, n) === sellPrice(w, g, n, HOME)` und gleich einer im Test ausgeschriebenen Referenz der heutigen
  Formel (mit und ohne Boom auf dem Gut). Beispiel: 1 Glas 20, 10 Glas 191, 50 Glas 755.
- **AK-IM-05** Kein Vorliebe-Gut: 1 Glas Felsbucht 20, 1 Glas Möweninsel 20, 10 Stoff Weidenau gleich 10 Stoff Heimat.
- **AK-IM-06** Boom: Boom auf Rum → 1 Rum Felsbucht 27 (nicht 35), 1 Rum Heimat 27. Boom auf Rum → 1 Glas Weidenau
  weiterhin 26. Boom auf Glas → 1 Glas Weidenau 30.
- **AK-IM-07** Sättigung global: `sellPct.glass` 100, `sell` 10 Glas in Weidenau → `sellPct.glass` 90; danach 1 Glas
  in der Heimat → `money` +18 (floor(20 · 90 · 100 ÷ 10⁴)). Boden: `sellPct.glass` 30 → 1 Glas Weidenau 7,
  `sellPct` danach 30.

**Fehler und Zustand**

- **AK-IM-08** `sellPrice` ist rein: `serialize(w)` vor und nach einem Aufruf mit Inselargument gleich.
- **AK-IM-09** Weidenau ohne Kontor: `sell(w, 'glass', 1, weidenau)` → `fail('Kein Kontor auf Weidenau')`; leeres
  Lager → `fail('Nicht genug Ware')`; unbekannte Insel → `fail('Unbekannte Insel')`; jeweils `serialize` unverändert,
  keine Ausnahme.
- **AK-IM-10** Kein Save-Wechsel: `SAVE_VERSION` gleich dem Wert vor dem Paket; die bestehenden Save-Tests laufen
  unverändert grün; ein vor dem Paket gespeicherter Stand (Fixture aus den Save-Tests) lädt ok und verkauft danach 1
  Glas in Weidenau für 26. Review: `src/sim/save.ts` und der Typ `World` ohne Diff.
- **AK-IM-11** Baseline: `tests/sim/balance.test.ts` und `tests/sim/controller.ts` ohne Diff und grün; `make check`
  Exit 0.

**UI (Vitest reine Helfer und Browser)**

- **AK-IM-12** Inselkarte: `islandEffectTexts` endet für Weidenau mit «Markt: Glas +30 %», für Felsbucht mit «Markt:
  Rum +30 %», für die Möweninsel ist es genau `['Markt: Stoff +30 %']`; Heimat `[]`. Trait-Zeilen davor unverändert.
- **AK-IM-13** Handelstexte: `sellTexts(w, 'glass', 1, weidenau)` → `price` «26 Geld», `title` «1 Glas verkaufen für
  26 Geld»; mit `HOME` «20 Geld». `preferTag`: Weidenau Glas «Vorliebe +30 %»; mit Boom auf Glas «statt Vorliebe
  +30 %»; Weidenau Stoff, Heimat Glas → leer.
- **AK-IM-14** Browser-Check bei 1280×720 und 1920×1080: präparierter Spielstand (Seefahrt frei, Kontor auf Weidenau,
  Glas im Weidenau-Lager, `sellPct.glass` 100), per «Laden» eingespielt. Mouse-over Weidenau auf der Seekarte → Karte
  zeigt «Markt: Glas +30 %». Handelsdialog «Handel · Weidenau» → Glas-Zeile mit Marke «Vorliebe +30 %», Knopf −1 zeigt
  26 Geld; nach Klick steigt das Geld um 26, «Verkauf 99 %». Handelsdialog Heimat → Glas −1 zeigt 19 Geld (pct 99),
  keine Marke. Texte überlappen nicht und brechen bei 1280 px nicht aus der Zeile.

### B.8 Paketschnitt-Vorschlag und offene Punkte

**Paketschnitt (für lead-tech):** ein Paket `I092` (Sim und UI, laut Ideen-Eintrag ≈ 1 Paket). Reihenfolge im Paket:
Sim zuerst (`defs/sea.ts`, Helfer R1, `trade.ts` R2–R4, AK-IM-01…11), danach UI (`islandCard.ts`, `trade.ts` U2/U3,
`tests/ui/`, README, `docs/spielwerte.md`, AK-IM-12…14). Prozessstufe (leicht oder voll) entscheidet L0.

**Offene Punkte für L0:**

- **O-1 Boom-Regel (AN-1), Ruling-Entwurf:** «Boom und Inselvorliebe stapeln nicht, das Höhere gilt — sonst
  Kauf-und-Verkauf-Gewinn bei Rum (1,5 · 1,3 · 18 = 35,1 > 32, +186/min in jedem Rum-Boom, W.5) — Kosten bei Irrtum:
  ein Faktor im Erlös, kein Save.» Empfehlung: so entscheiden.
- **O-2 Obergrenze R3/R4 (AN-2):** als bekannte Grösse hinnehmen (B.5); die strengere Sättigung ist abgelehnt.
