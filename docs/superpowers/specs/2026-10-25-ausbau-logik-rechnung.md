# Rechnung Ausbau-Logik der Produktionsbetriebe (M14, Paket design-ausbau-logik)

design-economy-designer · Eingabe: Designvorschlag lead-design · für: design-spec-author. Alle Werte sind
**Vorschläge für `src/sim/defs/levels.ts`** (Standort/Konstanten: `defs/buildings.ts`), keine Code-Änderung.

## 0 Grundlagen und Einheiten

- 1 Tick = 100 ms (`TICK_MS`), 1 min = 6 × 100 Ticks; Unterhalt je 100 Ticks, «/ min» = × 6.
- Ausstoss eines Betriebs je 100 Ticks: `r = 100 ÷ Zyklus`. Bedarf je Einwohner je 100 Ticks aus `tiers.ts` `needs`:
  Nahrung 0,5 · Stoff 0,2 (ab Siedler) · Rum 0,2 (ab Bürger) · Glas 0,1 (Kaufleute).
- Steuer je erfülltem Einwohner je 100 Ticks = `tax` (2 / 7 / 14 / 22, `population.ts:247`).
- **Wert-Äquivalent W** einer Kostenzeile (Kaufpreise `goods.ts` `buy`):
  `W = Geld + 10·Holz + 40·Werkzeug + 15·Stein + 30·Stoff + 40·Rum + 50·Glas`.
- **Netto je Betrieb** je 100 Ticks: `N = r × p(Ausgang) − r × Σ p(Eingang) − Unterhalt`, einmal mit
  `p = sell` (Verkaufswert, Untergrenze) und mit `p = buy` (Ersatzwert = Zukauf am Kontor, Obergrenze).
- Stufenzahlen heute: Freischaltung Stufe 2 = U3 (erste Siedler), Stufe 3 = U5 (erste Bürger), `unlocks.ts`.
  Stufe 4 neu = erstes Haus der Stufe 4 (Kaufleute). Kaufleute sind `requiresWin` → **Stufe 4 ist Spielinhalt nach dem
  ersten Ziel** (50 Bürger). Annahme: Restpartie ≥ 20 min.

## (a) Werte je Typ, Stufe 2/3/4

**Regel der Umschichtung (eine Regel, aus dem Spielbild erklärbar):**

1. **Stufe 2 = Anbau aus Holz und Werkzeug.** Die Gebühr entfällt; ihr Wert (Stoff 2–3 × 30) geht **1 : 1 ins Geld**
   («Handwerkerlohn»), damit W gleich bleibt wie heute. Einzige fachliche Ware: **Stoff beim Fischer (Netz)**.
2. **Stufe 3 = Steinbau.** Die Rum-Gebühr entfällt ganz; jeder Betrieb braucht **Stein** (Mauerwerk, Ofen, Kai); der
   Rest des Gebührenwerts geht ins Geld, W bleibt wie heute. Fischer zusätzlich **Stoff 2 (Segel)**.
3. **Stufe 4 = Manufaktur.** Werkstätten (Weberei, Werkzeugmacher, Brennerei, Glashütte) brauchen **Glas (Fenster,
   Kolben)**, Rohstoffbetriebe mehr **Stein**; Fischer **Stoff 3 (grosses Segel)** + Stein. W ≈ 1,5–1,7 × W(Stufe 3).

Spalten: St = Stufe, c = Zyklus (Ticks), u = Unterhalt (je 100 Ticks), Wz = Werkzeug, Ware = fachliche Ware. c und u von Stufe 2/3 bleiben **unverändert** (I-201 AK-FE7 rechnet mit Stufe 3 c = 20, R711 anteilig).
Heutige Gebühr: Stufe 2 Stoff, Stufe 3 Rum, Menge 2 (Fischer, Jäger, Holzfäller, Steinbruch) bzw. 3 (übrige). W = Soll; «Ist» nur, wo es abweicht.

### Fischerhütte (`fisher`, Grund: Zyklus 40, Unterhalt 5, W 230)

| St  | c   | u   | Geld | Holz | Wz  | Stein | Ware    | W   |
| --- | --- | --- | ---- | ---- | --- | ----- | ------- | --- |
| 2   | 24  | 7   | 50   | 3    | 1   | 0     | Stoff 2 | 180 |
| 3   | 16  | 9   | 65   | 4    | 2   | 2     | Stoff 2 | 275 |
| 4   | 12  | 11  | 120  | 6    | 3   | 4     | Stoff 3 | 450 |

Ware: Netz (2), Segel des grösseren Boots (3), Steinkai und grosses Segel (4) — Tuch ist hier fachlich.

### Jagdhütte (`hunter`, Grund 50 / 5, W 110; Höchststufe 3)

| St  | c   | u   | Geld | Holz | Wz  | Stein | Ware  | W   |
| --- | --- | --- | ---- | ---- | --- | ----- | ----- | --- |
| 2   | 30  | 7   | 85   | 1    | 1   | 0     | keine | 135 |
| 3   | 20  | 9   | 88   | 2    | 1   | 2     | keine | 178 |

Ware: Hochsitze aus Holz (2), Räucherkammer aus Stein (3) — kein Tuch nötig.

### Rinderfarm (`cattlefarm`, Grund 20 / 10, W 520)

| St  | c   | u   | Geld | Holz | Wz  | Stein | Ware  | W   |
| --- | --- | --- | ---- | ---- | --- | ----- | ----- | --- |
| 2   | 12  | 13  | 215  | 8    | 2   | 0     | keine | 375 |
| 3   | 8   | 17  | 248  | 12   | 3   | 4     | keine | 548 |
| 4   | 6   | 22  | 400  | 16   | 4   | 8     | keine | 840 |

Ware: Zäune (2), Steinstall (3), Stallhof mit Tränke (4).

### Holzfäller (`lumberjack`, Grund 30 / 5, W 90)

| St  | c   | u   | Geld | Holz | Wz  | Stein | Ware  | W   |
| --- | --- | --- | ---- | ---- | --- | ----- | ----- | --- |
| 2   | 18  | 7   | 85   | 0    | 1   | 0     | keine | 125 |
| 3   | 12  | 9   | 88   | 0    | 1   | 2     | keine | 158 |
| 4   | 9   | 11  | 120  | 0    | 2   | 3     | keine | 245 |

Ware: Sägen (2), Sägegrube mit Steinfundament (3), Sägewerk (4). Holz als Baukosten bleibt 0 wie heute.

### Steinbruch (`quarry`, Grund 60 / 10, W 370)

| St  | c   | u   | Geld | Holz | Wz  | Stein | Ware  | W   |
| --- | --- | --- | ---- | ---- | --- | ----- | ----- | --- |
| 2   | 36  | 13  | 135  | 5    | 2   | 0     | keine | 265 |
| 3   | 24  | 17  | 148  | 8    | 3   | 3     | keine | 393 |
| 4   | 18  | 22  | 250  | 12   | 4   | 4     | keine | 590 |

Ware: Gerüst und Keile (2), gemauerte Rampe (3), Kran mit Steinsockel (4). Stein zum Ausbau ist aus eigenem Ausstoss
bezahlbar (1,67 / 100 Ticks → 3 Stein in 180 Ticks), kein Henne-Ei-Problem.

### Schäferei (`sheepfarm`) und Zuckerrohrplantage (`canefarm`, je Grund 50 / 10, W 330)

| St  | c   | u   | Geld | Holz | Wz  | Stein | Ware  | W   |
| --- | --- | --- | ---- | ---- | --- | ----- | ----- | --- |
| 2   | 30  | 13  | 165  | 5    | 1   | 0     | keine | 255 |
| 3   | 20  | 17  | 188  | 8    | 2   | 3     | keine | 393 |
| 4   | 15  | 22  | 250  | 12   | 3   | 6     | keine | 580 |

Ware: Pferch bzw. Bewässerungsgraben (2), Steinscheune bzw. Steinspeicher (3), Hof (4). Gleiche Werte für beide, weil
Grundwerte und heutige Stufen gleich sind (Inselvorteil `fertile` wirkt auf beide gleich).

### Weberei (`weaver`) und Werkzeugmacher (`toolmaker`, Grund 50 / 15 bzw. 80 / 25, W je 470)

| St  | c (We / Wz) | u (We / Wz) | Geld | Holz | Wz  | Stein | Ware   | W   |
| --- | ----------- | ----------- | ---- | ---- | --- | ----- | ------ | --- |
| 2   | 30 / 48     | 20 / 33     | 190  | 8    | 2   | 0     | keine  | 350 |
| 3   | 20 / 32     | 26 / 43     | 210  | 12   | 3   | 4     | keine  | 510 |
| 4   | 15 / 24     | 33 / 55     | 300  | 16   | 4   | 6     | Glas 3 | 860 |

Ware: zweiter Webstuhl bzw. Werkbank (2), Steinhalle bzw. gemauerte Esse (3), Fenster für die Manufaktur (4). Die
Weberei braucht keinen Stoff zum Ausbau (Kreis-Selbstbezug wäre sachfremd).

### Brennerei (`distillery`, Grund 50 / 20, W 635)

| St  | c   | u   | Geld              | Holz | Wz  | Stein     | Ware   | W             |
| --- | --- | --- | ----------------- | ---- | --- | --------- | ------ | ------------- |
| 2   | 30  | 26  | 265 (neutral 215) | 8    | 2   | 3         | keine  | 470 (Ist 420) |
| 3   | 20  | 34  | 278               | 12   | 3   | 6 (Ist 4) | keine  | 608           |
| 4   | 15  | 44  | 350               | 16   | 5   | 8         | Glas 4 | 1030          |

Ware: Kupferkessel (2), gemauerter Brennofen (3), Glaskolben und Fenster (4). Stufe 2 bewusst +50 Geld, siehe (e).

### Glashütte (`glassworks`, Grund 50 / 25, W 890)

| St  | c   | u   | Geld              | Holz | Wz  | Stein      | Ware   | W             |
| --- | --- | --- | ----------------- | ---- | --- | ---------- | ------ | ------------- |
| 2   | 30  | 33  | 340 (neutral 240) | 10   | 3   | 5          | keine  | 635 (Ist 535) |
| 3   | 20  | 43  | 315               | 15   | 5   | 10 (Ist 8) | keine  | 815           |
| 4   | 15  | 55  | 450               | 20   | 6   | 12         | Glas 4 | 1270          |

Ware: zweiter Schmelztiegel (2), grösserer Steinofen (3), eigenes Fensterglas (4). Stufe 2 bewusst +100 Geld.

**Datenform (Vorschlag):** `LevelDef.fee` wird zu `extra?: { good: GoodId; amount: number }` (fachliche Ware, nicht
erstattet wie heute die Gebühr); `LEVELS` wird `readonly LevelDef[]` (Länge 2 bei Jagdhütte, 3 sonst). Stein ist
normale `cost.stone` (halbe Erstattung beim Abriss wie heute).

## (b) Stufe 4: Herleitung, Lohnt es sich, Überschuss?

- **Zyklus** `c4 = round(0,3 × c1)`: Fischer 12, Rind 6, Holz 9, Stein 18, Schaf/Rohr 15, Weberei 15, Werkzeug 24,
  Brennerei 15, Glas 15. Ausstoss in Grund-Einheiten: Stufe 1 / 2 / 3 / 4 = 1 / 1,67 / 2,5 / 3,33 — Zuwachs je Stufe
  0,67 / 0,83 / 0,83, also kein Sprung grösser als der von 2 auf 3.
- **Unterhalt** `u4 ≈ 2,2 × u1` (heute u2 ≈ 1,3–1,4 × u1, u3 ≈ 1,7–1,8 × u1): 11 / 22 / 11 / 22 / 22 / 33 / 55 / 44 / 55.
  Ausstoss je Unterhalt (Grund = 1): Stufe 2 1,19 · Stufe 3 1,39 · Stufe 4 1,52 → Stufe 4 ist effizienter, aber nur
  um 9 % gegenüber Stufe 3.
- **Rat anteilig (R711):** `floor(c4 × neuer Grundtakt ÷ 50)`: Weberei 12, Brennerei 12, Glashütte 9. Mit Inselvorteil
  (×0,5, `TRAIT_CYCLE_PCT`) Glashütte 4, Steinbruch 9. Untergrenze `max(1, …)` greift nirgends.
- **Lohnt es sich?** Amortisation gegen Neubau (Tabelle e2): Stufe 4 braucht 5 300–12 200 Ticks (9–20 min). Das ist
  gewollt: Stufe 4 ist der **Platzsparer der Spätphase**, keine Geldmaschine.
- **Überschuss:** Ein Betrieb Stufe 4 versorgt (Nahrung 0,5, Stoff 0,2, Rum 0,2, Glas 0,1 je Einwohner):
  Fischer 16,7 Einwohner, Rinderfarm 33, Weberei 33, Brennerei 33, Glashütte 67 Kaufleute (WIN_MERCHANTS 60 → **eine
  Glashütte Stufe 4 deckt das Handelsziel**; heute 1 × Stufe 3 + 1 × Stufe 1). Nicht endlos: `STORAGE_CAP = 100` je Gut; der Verkaufsanteil
  erholt sich um 10 Punkte je 100 Ticks (`SELL_RECOVERY_INTERVAL 10`, `SELL_DROP 1`), also hält nur **≤ 10 Stück je
  100 Ticks** den vollen Preis (Export-Deckel `10 × sell`: Glas 200, Rum 180, Holz 40). Glas mit
  Glasrecht + Inselvorteil (c = 4, 25 / 100 Ticks) liegt über dieser Grenze — das gibt es heute schon mit Stufe 3
  (c = floor(floor(20 × 30 ÷ 50) × 0,5) = 6, 16,7 / 100 Ticks), Stufe 4 ändert die Art des Risikos nicht.

## (c) Standortregeln je Typ und Stufe

**Messgrösse (eindeutig, wie bestehende `radius`-Regel):** Kacheln, deren Mittelpunkt im euklidischen Abstand ≤ r vom
Mittelpunkt des Grundrisses liegt (`tilesInRadius`, `world.ts:61`); `free` = ohne Gebäude und ohne Weg, Grundriss
zählt nicht (`countFreeTerrain`). Gebäude-zu-Gebäude: Mittelpunkt-Abstand `distance()` (`coverage.ts:9`), wie
Dienst-Reichweiten. Kachelzahl im Radius (ohne eigenen Grundriss), nachgezählt:

| Grundriss | r = 2 | r = 3 | r = 4 |
| --------- | ----- | ----- | ----- |
| 1 × 1     | 12    | 28    | 48    |
| 2 × 2     | 8     | 28    | 48    |

Stufe 1 bleibt in allen Fällen wie heute; jede Stufe prüft ihre eigene Regel (nicht kumulativ zusätzlich zu Stufe 1).

Legende: «W r k ≥ n» = freie Waldkacheln, «G» = Gebirge (nicht `free`), «Gr» = freies Gras, «F d ≤ r: n» = höchstens
n andere Fischerhütten (jeder Stufe, gleiche Insel) mit `distance ≤ r`, «FW» = Feuerwache mit `distance ≤ 8`.

| Typ                                  | Stufe 1 (Ist)             | Stufe 2     | Stufe 3     | Stufe 4     |
| ------------------------------------ | ------------------------- | ----------- | ----------- | ----------- |
| Fischerhütte                         | Küste                     | F d ≤ 2: 1  | F d ≤ 3: 1  | F d ≤ 3: 0  |
| Holzfäller                           | W r 2 ≥ 1 (von 12)        | W r 2 ≥ 4   | W r 2 ≥ 6   | W r 2 ≥ 8   |
| Jagdhütte                            | W r 3 ≥ 10 (von 28)       | W r 3 ≥ 14  | W r 3 ≥ 18  | —           |
| Steinbruch                           | G angrenzend ≥ 1 (von 4)  | G r 2 ≥ 3   | G r 2 ≥ 4   | G r 2 ≥ 6   |
| Schäferei, Zuckerrohr                | Gras r 2 ≥ 4 (nicht frei) | Gr r 3 ≥ 8  | Gr r 3 ≥ 12 | Gr r 3 ≥ 16 |
| Rinderfarm                           | Gr r 3 ≥ 16 (von 28)      | Gr r 3 ≥ 18 | Gr r 3 ≥ 20 | Gr r 3 ≥ 22 |
| Brennerei, Glashütte, Werkzeugmacher | —                         | —           | FW          | FW          |
| Weberei                              | —                         | —           | —           | —           |

Fischer zusätzlich ab Stufe 2 weiter Küste (Stufe-1-Regel gilt immer mit).

**Erreichbarkeit (grob, Lagebilder):**

- **Fischer:** Die Regel zählt alle Fischerhütten derselben Insel, jeder Stufe. Gerade Küste: Stufe 2 erlaubt Paare
  im Abstand 4 (F F · · F F, 2 Hütten je 4 Küstenkacheln), Stufe 3 Paare im Abstand 5 (2 je 5), Stufe 4 Einzelhöfe im
  Abstand 4 (1 je 4). Immer erreichbar, kostet nur Küstenlänge (Schrägküste: (2,1) = 2,24 → etwas leichter, hinnehmbar).
- **Holzfäller:** Gerade Waldkante mit Weg auf der anderen Seite ≈ 6 freie Waldkacheln in r 2 → Stufe 3 am Waldrand,
  Stufe 4 nur im Wald (Weg hinein). Zählung nicht exklusiv: Holzfäller verdrängen sich nicht.
- **Jagdhütte:** halber Kreis Wald (≈ 14) für Stufe 2, zwei Drittel (18) für Stufe 3.
- **Steinbruch:** gerade Gebirgskante ergibt in r 2 genau 4 Kacheln (Reihe davor 3, dahinter 1) → Stufe 3 an jeder
  vollen Kante, Stufe 4 nur in einer Bucht/Ecke (Ecke = 7).
- **Schäferei/Zuckerrohr/Rinderfarm:** **Schnittstelle FLAECHE** Annahme: Ring r 3 auf Grasinseln zu ≥ 60 % frei
  erreichbar; Rinderfarm Stufe 4 (22 von 28) lässt 6 Kacheln für Weg/Bau. Zeichnet FLAECHE anders, gelten die Anteile
  (Schaf/Rohr 29 / 43 / 57 %, Rind 64 / 71 / 79 %).
- **Feuerwache:** Reichweite 8 wie `firestation.serviceRadius`; eine Wache deckt eine Werkstattgruppe, Kosten 150 Geld
  und 10 Unterhalt (60 / min) — gegen den Mehrertrag einer Brennerei Stufe 3 (+82 / min Verkaufswert gegenüber Stufe 2)
  sofort tragbar.

## (d) Arbeitsweg und «läuft wie Stufe k»

**Arbeitsweg 8:** Bedingung «ein Wohnhaus derselben Insel mit Stufe ≥ n und `distance(Haus, Betrieb) ≤ 8`».
Reichweiten zum Vergleich: Versorgung Kontor/Markt 8, Feuerwache 8, Kapelle/Schule/Badehaus 10 (Glockenrecht 13),
Lärm I-128 3. Kreis r 8 um einen 1 × 1-Betrieb = 178 Kacheln, davon liegen 150 im Ring 3 < d ≤ 8 — also Platz für
ein ruhiges Wohnviertel, das Fachkräfte stellt, ohne Lärmmalus. Weil Häuser selbst im Versorgungsradius 8 eines
Marktes stehen müssen, darf ein Betrieb höchstens 16 Felder vom Markt entfernt sein, um ausgebaut zu laufen. Gewollt: Betriebe
weit draussen bleiben Stufe 1 oder bekommen eine Randsiedlung. **Empfehlung: 8** (gleich wie Versorgung). Radius 6 (112 Kacheln)
wäre spürbar strenger und kollidiert mit Lärm 3 (nur Ring 4–6).

Fachkräfte-Folge auf **fernen Inseln:** Eine Kolonie ohne Wohnhäuser (Plantage auf Fruchtbarinsel, Steinbruch auf
Bergreichinsel) kann **nicht mehr ausbauen**. Inselvorteil ×2 wirkt dort weiter auf Stufe 1. Das ist fachlich stimmig
(«keine Meister vor Ort»), ändert aber Gewohnheiten → Entscheidungsbedarf E3.

**Unterhalt bei «läuft wie k»** — Zahlenbeispiele je 100 Ticks:

| Fall                                 | Ausstoss       | Unterhalt Option A (gebaute Stufe) | Option B (k + halber Aufpreis) |
| ------------------------------------ | -------------- | ---------------------------------- | ------------------------------ |
| Fischer 3 läuft wie 1                | 6,25 → 2,5     | 9 (Verlust 4 gegen Stufe 1)        | 5 + ceil(4 × 0,5) = 7          |
| Brennerei 3 läuft wie 2              | 5 → 3,33       | 34                                 | 26 + 4 = 30                    |
| Glashütte 4 läuft wie 2              | 6,67 → 3,33    | 55 (330 / min)                     | 33 + 11 = 44                   |
| Stadt mit 10 Betrieben Stufe 3 → k 2 | −33 % Ausstoss | +≈ 60 / 100 Ticks gegen Stufe 2    | +≈ 30                          |

Bewertung: Option A ist **zu hart**, weil die häufigste Ursache (Bürger steigen bei Rum-Mangel ab) eine Krise ist und A
sie verstärkt — **Rückkopplung Rum:** Brennerei Stufe 3 versorgt 25 Bürger; fällt ihr letztes Bürgerhaus im Umkreis,
läuft sie wie 2 (16,7 Bürger), der Mangel wächst, weitere Häuser steigen ab. Gebremst wird die Spirale, weil **ein**
Haus im Umkreis genügt; ganz verschwinden muss das Bürgerviertel. **Empfehlung Option B:** Unterhalt =
`upkeep(k) + ceil((upkeep(gebaut) − upkeep(k)) × 50 %)`, analog `PAUSED_UPKEEP_PCT` (neue Konstante z. B.
`THROTTLED_UPKEEP_PCT = 50` in `defs/buildings.ts`). Bild: «Das grosse Boot liegt im Hafen und kostet halb.» Option C (Nachlauffrist, bis k sinkt)
bräuchte einen gespeicherten Zähler je Betrieb und widerspricht «k abgeleitet» — nicht empfohlen.

## (e) Wahl-Prüfung: Ausbau gegen zweiten Betrieb Stufe 1

**e1 Netto je Stufe, je Minute** (Verkaufswert / Ersatzwert; Eingänge mit demselben Preis bewertet; Werte Soll):

| Typ            | Stufe 1   | Stufe 2   | Stufe 3   | Stufe 4   |
| -------------- | --------- | --------- | --------- | --------- |
| Fischerhütte   | 15 / 90   | 33 / 158  | 58 / 246  | 84 / 334  |
| Jagdhütte      | 6 / 66    | 18 / 118  | 36 / 186  | —         |
| Rinderfarm     | 30 / 180  | 72 / 322  | 123 / 498 | 168 / 668 |
| Holzfäller     | 50 / 170  | 91 / 291  | 146 / 446 | 201 / 601 |
| Steinbruch     | 0 / 90    | 22 / 172  | 48 / 273  | 68 / 368  |
| Schäferei      | 0 / 84    | 22 / 162  | 48 / 258  | 68 / 348  |
| Zuckerrohr     | 0 / 84    | 22 / 162  | 48 / 258  | 68 / 348  |
| Weberei        | −6 / 126  | 20 / 240  | 54 / 384  | 82 / 522  |
| Werkzeugmacher | −68 / 75  | −60 / 177 | −52 / 304 | −55 / 420 |
| Brennerei      | 36 / 216  | 104 / 404 | 186 / 636 | 256 / 856 |
| Glashütte      | −30 / 150 | 2 / 302   | 42 / 492  | 70 / 670  |

Beispiel Fischer Stufe 3: r = 6,25; 6,25 × 3 − 9 = 9,75 → 58 / min; 6,25 × 8 − 9 = 41 → 246 / min. Werkzeugmacher
bleibt beim Verkauf negativ (wie heute: «lohnt erst bei Eigenbedarf»).

**e2 Ausbau gegen Neubau, gleiche Mehrmenge.** Ein Ausbau um eine Stufe bringt Δr = n × r1 (n = 0,67 bzw. 0,83).
Dieselbe Menge per Neubau kostet `n × W(Stufe 1)` und `n × u1` Unterhalt. Mehrkosten des Ausbaus
`M = W(Stufe) − n × W1` (W aus a), Unterhaltsersparnis `S = n × u1 − Δu`, **Amortisation `A = M ÷ S × 100` Ticks**:

| Typ            | W1  | Stufe 2: M / A | Stufe 3: M / A | Stufe 4: M / A |
| -------------- | --- | -------------- | -------------- | -------------- |
| Fischerhütte   | 230 | +27 / 2000     | +83 / 3846     | +258 / 11923   |
| Jagdhütte      | 110 | +62 / 4625     | +86 / 3985     | —              |
| Rinderfarm     | 520 | +28 / 773      | +115 / 2646    | +407 / 12200   |
| Holzfäller     | 90  | +65 / 4875     | +83 / 3831     | +170 / 7846    |
| Steinbruch     | 370 | +18 / 500      | +85 / 1954     | +282 / 8450    |
| Schäf./Rohr    | 330 | +35 / 955      | +118 / 2723    | +305 / 9150    |
| Weberei        | 470 | +37 / 733      | +118 / 1821    | +468 / 8515    |
| Werkzeugmacher | 470 | +37 / 423      | +118 / 1092    | +468 / 5302    |
| Brennerei      | 635 | +47 / 636      | +79 / 910      | +501 / 7512    |
| Glashütte      | 890 | +42 / 481      | +73 / 677      | +528 / 5981    |

Lesart: **Kein M ist ≤ 0** → keine Stufe ist zugleich billiger im Bau und im Betrieb (= dominiert nicht). Bei
kostenneutraler Umschichtung wären Brennerei Stufe 2 (M = −3) und Glashütte Stufe 2 (M = −58) dominant gewesen — das
ist **heute schon so** (W unverändert); deshalb +50 bzw. +100 Geld (Ruling-Entwurf E2). Zwei Pfade bleiben lohnend:

- **Breite (Neubau Stufe 1):** billig im Bau, schnell wirksam, keine Fachkräfte, keine Standortprüfung; lohnt bei
  billigen Grundbetrieben (Holzfäller, Jäger: A ≈ 4 000–4 900 Ticks) und wenn Platz da ist.
- **Tiefe (Ausbau):** weniger Unterhalt und Platz je Stück, kostet Baustoff, Fachkräfte und Standort; lohnt bei teuren
  Werkstätten (A 420–1 800 Ticks) und bei knapper Fläche.

**Fischer-Cluster** (dieselben 3 Küstenkacheln bzw. 1 Kachel + Abstand):

| Variante                    | W   | Nahrung / min | Unterhalt / min | Netto Verkauf / min | Netto Ersatz / min | versorgt   |
| --------------------------- | --- | ------------- | --------------- | ------------------- | ------------------ | ---------- |
| 3 × Stufe 1 nebeneinander   | 690 | 45            | 90              | 45                  | 270                | 15 Einw.   |
| 1 × Stufe 3 (allein in r 3) | 685 | 37,5          | 54              | 58                  | 246                | 12,5 Einw. |

Gleicher Baupreis. Cluster: mehr Nahrung; Stufe 3: mehr Geld, braucht Bürgerhaus. Der Cluster ist eine
**Festlegung** (je Hütte 2 andere in r 2 → nie ausbaubar). Je 20 Küstenkacheln und 100 Ticks: 20 × Stufe 1 = 50 Nahrung
/ Unterhalt 100; 8 × Stufe 3 = 50 / 72; 5 × Stufe 4 = 41,7 / 55. Keine Variante dominiert: Küste gegen Unterhalt.

## (f) Wegfall der Rum-/Stoff-Gebühr: Senken, Glas, Engpässe

**Annahme Partie bis Bürgerziel (≤ 9 000 Ticks, Balancing-Controller-Takt):** 12 Ausbauten auf Stufe 2, 8 auf Stufe 3,
davon 3 bzw. 2 Fischer; Ø Gebühr heute 2,6 Stück.

| Gut   | Gebühr heute          | neu                        | Δ / Partie | Dauerverbrauch bis Ziel            | Anteil   |
| ----- | --------------------- | -------------------------- | ---------- | ---------------------------------- | -------- |
| Stoff | 12 × 2,6 ≈ 31         | 10 (Fischer 3 × 2 + 2 × 2) | −21        | 0,2 × Ø 60 Einw. × 60 Int. ≈ 720   | −3 %     |
| Rum   | 8 × 2,6 ≈ 21          | 0                          | −21        | 0,2 × Ø 25 Bürger × 30 Int. ≈ 150  | −14 %    |
| Stein | ≈ 8 (Brennerei, Glas) | ≈ 32 (+ Ø 3 × 8 Stufe 3)   | +24        | Häuser 5/10, Schule 15 …           | neu      |
| Geld  | —                     | ≈ 1 540 (12 × 75 + 8 × 80) | −1 540     | Steuer 50 Bürger ≈ 700 / 100 Ticks | 2,2 Int. |

- **Rum:** Die Gebühr fiel genau in die Bürgerphase, in der Bürger Rum verlangen (U5 schaltet Stufe 3 frei). Ihr Wegfall
  **entschärft einen Engpass** (−14 %); kein Überschuss, Dauersenke 0,2 je Bürger bleibt.
- **Stoff:** −3 %, vernachlässigbar. Senke bleibt der Siedler-/Bürgerbedarf.
- **Stein:** +24 Stück je Partie = 1 440 Ticks eines Steinbruchs Stufe 1 (1,67 / 100 Ticks). Stein wird in der
  Bürgerphase knapper, ist aber am Kontor kaufbar (15) und der Steinbruch braucht für Stufe 2 keinen Stein — **kein
  unvermeidlicher Engpass**, aber eine spürbare Mehrnachfrage (Risiko R2).
- **Glas (neu, nur Stufe 4):** typische Spätstadt 2 Webereien, 1 Werkzeugmacher, 2 Brennereien, 1 Glashütte →
  6 + 3 + 8 + 4 = 21 Glas einmalig. Dauerbedarf 60 Kaufleute × 0,1 = 6 / 100 Ticks → 21 Glas ≈ 350 Ticks
  Kaufleute-Verbrauch bzw. 1 050 Ticks einer Glashütte Stufe 1. Neue, kleine Senke für das Spätgut; Glashütte Stufe 4
  braucht 4 eigenes Glas (200 Ticks Stufe 1) — kein Henne-Ei-Problem.
- **Geld:** statt eigener Ware nun bar, ≈ 2,2 Steuerintervalle einer 50-Bürger-Stadt → keine Pleite-Gefahr.
- **Endloser Überschuss: nein.** Jede Ware behält Quelle und Dauersenke; Export ist durch die Preis-Erholung
  (10 Stück je 100 Ticks zum vollen Preis) und den Lager-Deckel begrenzt.

## (g) Balancing-Test und Spielstand

- **Balancing-Test muss nicht geändert werden.** Beleg: `rg -n "level|upgrade|LEVELS" tests/sim/balance.test.ts` →
  kein Treffer; `rg -n "upgradeBuilding|level" tests/sim/controller.ts` → kein Treffer. Der Controller (`buildColony`)
  baut nie aus; Stufe-1-Standortregeln und alle Grundwerte bleiben unverändert. Der Test bleibt grün, sofern die
  Umsetzung Stufe 1 nicht berührt (Fischer: Abstandsregel nur ab Stufe 2).
- **Korrektur lead-design:** `tests/sim/balance-upgrade.test.ts` (AK-M11B-01, Pin M-15) baut Fischer auf Stufe 2 aus und
  liest `fee`; ab AL-2 neu messen und per Ruling setzen (Spec E9).
- Sonst betroffen (Umsetzung, nicht Balancing): `upgrade.test.ts`, `unlock-timeline.test.ts` (`upgrade4`),
  `save.test.ts`, Tipp U3 «gegen Stoff ausbauen» (`unlocks.ts`), `docs/spielwerte.md` «Ausbau».
- **Spielstand:** `level ∈ {2,3}` → `{2,3,4}` (`save.ts:577`), Jagdhütte nur bis 3. Kein neues gespeichertes Feld (k
  ist abgeleitet). Wertewirkung auf alte Stände: ausgebaute Betriebe, die die neuen Dauerbedingungen nicht erfüllen
  (Fischer im Cluster, Holzfäller mit < 4 freiem Wald, ferne Insel ohne Häuser), laufen nach dem Laden «wie Stufe k».
  Empfehlung: `SAVE_VERSION` 18 → 19, v18 weiter laden (nur Erweiterung des Wertebereichs, Panel erklärt jede
  Drosselung) — Entscheidung bei L0 (E4).

## Entscheidungsbedarf (Ruling-Entwürfe für L0)

- **E1** Gebühr → fachliche Ware, Rest kostenneutral ins Geld (a) — W gleich hält die Wahl stabil — Irrtum: neue Zahl in `levels.ts`.
- **E2** Brennerei Stufe 2 Geld 265 (+50), Glashütte Stufe 2 Geld 340 (+100) — sonst dominant (M < 0) — Irrtum: 50–100 Geld zu teuer.
- **E3** Fachkräfte auch auf fernen Inseln Pflicht (Kolonie ohne Häuser baut nicht aus) — eine Regel für alle Inseln — Irrtum: Kolonien umständlicher; Rückweg: Kontor zählt als Stufe 2.
- **E4** `SAVE_VERSION` 19, v18 bleibt ladbar — kein neues Feld — Irrtum: alter Stand zeigt gedrosselte Betriebe mit Grund.
- **E5** Unterhalt bei «läuft wie k» = Option B (k + 50 % Aufpreis) statt voller gebauter Stufe — A verstärkt die Rum-Spirale — Irrtum: eine Konstante.

## Annahmen und Grenzen

- Ersatzwert = Kaufpreis am Kontor ohne `BUY_RISE` (0) und ohne Auftragsprämie; Verkaufswert ohne Preisverfall.
- Partie-Zahlen in (f) geschätzt, nicht gemessen. Weidezahlen (c) an FLAECHE nachjustieren.
- Erstattung beim Abriss: Stein halb (normale `cost`), Fachware (Stoff, Glas) wie heute die Gebühr nicht erstattet.
