# Wirtschaft im Spätspiel: Befund und Vorschläge

Paket WIRTSCHAFT-TIEFE · Nutzerauftrag R862 (Spieltiefe, länger am Ball) · 2026-10-23 · lead-design mit
`design-economy-designer` (Rechnung aus Defs und bestehenden Messungen, keine neuen Testläufe; (S) = Schätzung).

**Frage:** Warum ist Geld ab Minute ≈ 15 kein Engpass mehr (R722, R780), und welche Mechanik hält die Wirtschaft im
Spätspiel entscheidungsreich?

## 1. Befund

### 1.1 Geldkurve

Gemessene Basis: `docs/superpowers/specs/2026-10-17-i144-rechnung.md:77-91` (Seed 3, Krisen aus). 1 min = 600 Ticks;
Steuer und Unterhalt laufen je 100 Ticks (`src/sim/defs/timing.ts`, `UPKEEP_INTERVAL`).

| min | Einwohner Stufe 1/2/3/4 | Steuer/min | Unterhalt + Zukauf/min | Netto/min         | Kasse                        | Fundstelle                               |
| --- | ----------------------- | ---------- | ---------------------- | ----------------- | ---------------------------- | ---------------------------------------- |
| 0   | Startbau                | 0          | 0                      | –                 | 5000 → 2718 bei min 1        | `goods.ts:85`, i144:77                   |
| 5   | 0/32/0/0                | 1344       | ≈ 780 (S)              | ≈ +565            | ≈ 1600 (S)                   | i144:79-80                               |
| 10  | 0/16/30/0               | 3192       | ≈ 2400 (S)             | ≈ +800, verbaut   | 482                          | i144:84                                  |
| 15  | 0/0/60/0                | 5040       | 2640                   | +2538 (gemessen)  | 4427                         | i144:89-90                               |
| 20  | Bürger-Spieler B        | 5040       | 2640                   | +2538             | 17 116                       | i144:90                                  |
| 20  | Kaufleute-Spieler K     | 9180       | 4020 + 1980 Zukauf     | ≈ +3180 (S)       | Tiefpunkt 320, dann steigend | `tests/sim/balance-merchants.test.ts:81` |
| 30  | B / K / K mit Denkmal   | –          | –                      | +2538 / +3180     | 42 500 / ≈ 33 000 / ≈ 0      | i144:64, `balance-monument.test.ts:26`   |
| 45  | B / K / grosse Stadt    | –          | –                      | … / … / ≈ +10 100 | 80 600 / ≈ 80 000 / –        | Fortschreibung (S)                       |

Bis min 14 ist Geld der Engpass: Jeder Überschuss fliesst sofort in Bau und Aufstieg, die Kasse fällt mehrfach unter 500.
Ab dem Endausbau (min 14–15, Bürger) bzw. ab dem Kaufleute-Ziel (≈ min 19) gibt es nichts mehr, das Geld bindet; die Kasse
wächst linear mit +2500 bis +3200 je Minute, in einer grösseren Stadt mit ≈ +10 000 je Minute (S).

### 1.2 Bilanz je Einwohner (je 100 Ticks, Ketten voll ausgelastet)

| Stufe                         | Steuer | Ketten-Unterhalt anteilig | Dienste | Netto je Einwohner | Netto je Haus und min |
| ----------------------------- | ------ | ------------------------- | ------- | ------------------ | --------------------- |
| 1 Pioniere                    | 2      | 1,0                       | 0       | +1,0               | +24                   |
| 2 Siedler                     | 7      | 3,5                       | 0,47    | +3,0               | +146                  |
| 3 Bürger                      | 14     | 6,5                       | 0,67    | +6,8 (gem. 7,05)   | +615                  |
| 4 Kaufleute, eigene Ketten    | 22     | 9,25                      | 0,93    | +11,8              | +1416                 |
| 4 Kaufleute, Gewürz zugekauft | 22     | 13,4                      | 0,93    | +7,7               | +924                  |

Fundstellen: Steuer `src/sim/defs/tiers.ts:18/27/36/45` (halb bei Mangel, `src/sim/population.ts:247`), Bedarf
`tiers.ts:16/25/34/43`, Unterhalt der Ketten `src/sim/defs/buildings.ts` (Fischer 5 für 2,5 Nahrung `:50/54`, Weberei 15 +
Schäferei 10 für 2 Stoff `:118/132`, Brennerei 20 + Plantage 10 für 2 Rum `:146/159`, Glashütte 25 `:239`, Gewürzplantage
15 `:265`), Dienste Kapelle 15, Schule 25, Badehaus 30 (`:188/201/226`), Zukauf Gewürz 40 (`src/sim/defs/goods.ts:61`).

### 1.3 Ursache

1. **Konstante positive Marge je Einwohner**, die mit der Stufe steigt (+1 → +11,8). Kein Posten wächst überlinear mit
   der Stadt; der Unterhalt frisst gleichbleibend 45–55 % der Steuer.
2. **Keine laufende Senke ausser Unterhalt.** Alle grossen Ausgaben sind einmalig (Bau, Aufstieg, Denkmal).
3. **Feste Zukaufpreise** machen jeden Mangel zu einem kleinen Geldposten (Vollzukauf 1,6–2,7 × Bauen, R780).
4. **Ziele mit kleiner Stadt erfüllt:** Ziel 1 und 2 brauchen 4 Häuser (`tests/sim/controller.ts:132-137`); danach
   fehlt jeder Investitionszweck.

Das Startgeld 5000 (`goods.ts:85`) ist **nicht** die Ursache: Es ist bei min 2 verbraucht (Kasse 391, i144:78).

## 2. Vorschläge

Referenz: Netto min 20 = +3180 (Kaufleute), min 45 = +10 100 (grosse Stadt, S). «Bitgleich» heisst: die
Controller-Läufe der Balancing-Tests ändern sich nicht.

| Nr. | Mechanik                                               | Startwerte (künftig `src/sim/defs/`)                                                      | Netto min 20 / 45 danach      | Echte Wahl                                              | Entartung                                        | Balancing-Test / Save                                                  | Aufwand |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- | ------- |
| V1  | Zukauf-Staffel nur für Konsumgüter (`BUY_RISE` je Gut) | Stoff, Rum, Glas, Gewürz 2, sonst 0; `BUY_CAP` 160 (`goods.ts:69-71`)                     | ≈ +2420 / ≈ +7850             | nein (R780 Fassung B)                                   | Vorratskauf bis 30/min zum Listenpreis           | `balance` bitgleich; Neupin `balance-edicts`; kein Save-Feld           | S       |
| V2a | Nahrung 0,6 für Bürger und Kaufleute                   | `tiers.ts:34/43` food 0,6                                                                 | ≈ +3090 / ≈ +9850             | nein                                                    | –                                                | **rot**: 15 Fischer nötig, Layout hat 14 (`controller.ts:124-125`)     | XS      |
| V2b | Bedarf wächst mit der Stadtgrösse                      | Faktor 1 + max(0, P − 100) / 600 auf alle Bedarfe                                         | +3180 / ≈ +7070               | schwach                                                 | Wachstum über ≈ 220 Einwohner wird bestraft      | bitgleich (Läufe ≤ 100 Einw.); kein Save                               | S       |
| V3  | Verwaltungsaufschlag (vgl. I-143)                      | +3 % Unterhalt je Haus über 4                                                             | +3180 / ≈ +7540               | nein, Strafsteuer                                       | kleine Städte dominieren                         | bitgleich; kein Save                                                   | S       |
| V4  | **Stadtrecht:** kaufbare Stufen mit Rendite            | 6 Stufen, Kosten 5000 × 1,6^k (+20 Stein, ab k = 2 + 10·k Glas), je Stufe +4 Steuerpunkte | +3180 / ≈ +4280 (K, 3 Stufen) | **ja**: Amortisation 13,6 / 21,8 / 34,9 / 55,8 min      | nach der letzten Stufe kehrt die Schwemme zurück | bitgleich (kein Controller kauft); Save-Feld, v18 → v19                | M       |
| V5  | Verderb von Nahrung über 80 % Lager                    | −1 je 50 Ticks über 80 von `STORAGE_CAP` 100 (`goods.ts:84`)                              | ≈ +3040 / ≈ +9980             | kaum                                                    | –                                                | wohl bitgleich (S); kein Save                                          | S       |
| E1  | **Wartung:** Betriebe brauchen Werkzeug ab Ziel 1      | 1 Werkzeug je Betrieb und 1200 Ticks; ohne Werkzeug Takt × 2                              | ≈ +2140 / ≈ +7260 (Zukauf)    | **ja**: Werkzeug bauen oder kaufen, Ausbau statt Breite | ohne Geldbindung wird nur gekauft                | `balance` bitgleich; Neupin merchants, monument, edicts; Save-Feld v19 | M–L     |

Herleitungen V4: Steuerpunkte wie bei den Edikten (`src/sim/defs/edicts.ts`, `taxPoints`), +4 Punkte auf 9180 Steuer/min =
+367/min je Stufe, also 5000 / 367 = 13,6 min Amortisation für Stufe 1. E1: Kaufleute-Endausbau hat 52 Betriebe, also
26 Werkzeug/min; zugekauft à 40 (`goods.ts:12`) kostet das ≈ 1040/min. Ausbaustufen (`src/sim/defs/levels.ts:25-35`) senken
die Zahl der Betriebe je Ausstoss und bekommen damit einen Zweck.

**Rangfolge nach Wirkung je Aufwand:** V4 › E1 › V1 › V2b › V3 › V5 › V2a.

## 3. Bewertung lead-design

Keiner der Vorschläge macht Geld wieder knapp, ohne zugleich das Sieg-Gate oder die Pins zu verschieben. Die Bremsen
(V1, V2, V3, V5) senken die Rate um 3–30 %, schaffen aber keine Entscheidung: Bei +7000/min ist auch die gebremste Kasse
voll. Eine Entscheidung entsteht nur dort, wo Geld **gegen etwas** eingetauscht wird, das sich unterschiedlich lohnt (V4),
oder wo eine Kette dauerhaft Nachschub braucht (E1).

**Favorit fürs Brainstorming: V4 «Stadtrecht», in der einfacheren Variante als Ausbau des Rats.**

- Spielerzweck in einem Satz: «Nach dem Kaufleute-Ziel kaufe ich meiner Stadt Rechte, die sich erst nach 15 bis 55 Minuten
  bezahlt machen, und entscheide, ob ich lieber ausbaue, das Denkmal setze oder ins Stadtrecht investiere.»
- Säule: Wirtschaft über Steuern und Handel; die Kosten in Stein und Glas binden zusätzlich die Produktionsketten.
- Echte Wahl: Amortisation steigt je Stufe (13,6 → 55,8 min). In einer 45-Minuten-Partie lohnen 2–3 Stufen, in einer grossen
  Stadt 4–5. Wer die nächste Stufe kauft und wann, hängt von der Spieldauer und den Alternativen ab.
- Einfachere Variante (Prüffrage 5): Der Rat (`src/sim/defs/council.ts`) bietet heute je Stufe 2–4 eine einmalige
  A/B-Wahl ohne Kosten. Stadtrecht-Stufen als **kaufbare weitere Rats-Sitzungen** (Geld + Glas, je Sitzung eine A/B-Wahl
  aus einem Steuer- oder einem Ketten-Hebel) nutzen Lesepfad, UI-Karte und Hebel-Arten, die es schon gibt. Damit wird die
  Rendite selbst zur Wahl (Steuer jetzt oder Effizienz der Kette).
- Rückkopplung: V4 ist ein Wachstumsmotor mit fallendem Grenzertrag. Er bindet Geld 8–20 Minuten länger, beseitigt die
  Schwemme danach aber nicht. Gewollt als erster Schritt; die Rate senkt erst E1.
- Randfälle für die Spec: Kauf bei leerer Kasse (`{ ok: false, reason }`), Glas im Sperrbestand (I-049), Abriss der
  Amtsstube nach einem Kauf, Save mit gekauften Stufen, Edikt Sparen plus Stadtrecht (Punkte addieren, Deckel nötig).

**Zweiter Schritt: E1 «Wartung».** Sie ist die einzige Fassung, die das Netto dauerhaft senkt **und** eine Wahl schafft
(Werkzeug selbst herstellen oder kaufen, Betriebe ausbauen statt verbreitern). Sie zwingt aber zum Neupin dreier Szenarien
und braucht ein Save-Feld je Gebäude; deshalb erst nach V4 und nach dem Merge der Stadtplanung (R780: Lärm und Parks könnten
selbst Geld binden).

**Nicht empfohlen:** V2a (Balancing-Test rot bei 0,6; höchstens 0,55), V3 (Strafsteuer ohne Wahl, deckt sich mit I-143),
V5 (ohne Wirkung), V1 als Einzelmassnahme (in R780 bereits verworfen).

## 4. Abgrenzung zu Erweiterung 1

Erweiterung 1 (Branch `design/erweiterung-1`, Brainstorming `2026-10-11-erweiterung-1-brainstorming.md`) plant die fünfte
Stufe Reeder, die Arbeiter-Regel für neue Manufakturen und als Dauer-Senke nach Ziel 4 die Stiftungen (K5, offen unter O8,
Kosten × 1,5 je Stufe).

- V4 wirkt **ab Ziel 1 im heutigen Spiel** (Stufen 1–4), ist auf 6 Stufen gedeckelt und endet vor der Reeder-Phase.
  K5 ist eine reine Prestige-Senke **nach Ziel 4**.
- Beide Kostenleitern wirken ähnlich. Wird V4 gebaut, sollte O8 / K5 darauf aufsetzen (dieselbe Leiter weiterführen), statt
  eine zweite Leiter zu bauen. Diese Abstimmung gehört in die Nutzer-Session zu Erweiterung 1 (R519); dieses Papier ändert
  die Erweiterung nicht.
- E1 «Wartung» berührt die Arbeiter-Frage von Erweiterung 1 nicht (Werkzeug statt Arbeitskraft), wohl aber die Rolle der
  Ausbaustufen; im Brainstorming prüfen.

## 5. Geparkte Ideen, die davon abhängen

R722 und R780 haben I-110 (Startpaket), I-111, I-130, I-134 und I-183 (Notration, Handoff IDEEN-16) geparkt bis «Geld
bindet nach dem Kaufleute-Ziel» bzw. `BUY_RISE` > 0. V4 erfüllt diesen Auslöser nur bis zur letzten gekauften Stufe;
E1 erfüllt ihn dauerhaft. Die Wiedervorlage dieser Ideen gehört nach E1, nicht nach V4.

## 6. Befunde ausserhalb des Scopes

- Werkzeug hat nach dem Endausbau keine Dauer-Senke; Werkzeugmacher laufen im Spätspiel leer (Quelle ohne Senke).
- Kommentar `tests/sim/merchantsController.ts:20-21` nennt «≈ 415 je 100 Ticks Endausbau»; die Rechnung ergibt für den
  Kaufleute-Endausbau ≈ 670. Vermutlich veraltet, ungeprüft.

## Quellen

- `docs/superpowers/specs/2026-10-17-i144-rechnung.md` (gemessene Geldkurve, Pins)
- `src/sim/defs/tiers.ts`, `goods.ts`, `buildings.ts`, `levels.ts`, `edicts.ts`, `council.ts`, `timing.ts`
- `tests/sim/balance.test.ts`, `balance-merchants.test.ts`, `balance-monument.test.ts`, `tests/sim/controller.ts`
- Rulings R722, R780 (`docs/studio/rulings.md`); I-048, I-110 (`docs/ideen-archiv.md`); I-143 (`docs/ideen.md`)
