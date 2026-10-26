# I-223 Zehnt — Rechnung Kurs und Dominanz

Rechnung `design-economy-designer`, Paket design-IDEEN20-FOLGEN. Werte sind Vorschläge, `src/sim/defs/` bleibt unverändert.

## Frage

Welchen Kurs `TITHE_UNITS_PER_100` braucht der Zehnt? Dabei soll Zehnt-Ware mehr wert sein als ihr Verkaufspreis und
weniger als ihr Zukaufpreis. Wie verhält sich der Zehnt zu Holzfäller, Steinbruch und Zukauf? Wann wird die Kasse
negativ? Dominiert der Zehnt, ist er nutzlos, ergibt er eine Verkaufs-Pumpe oder ersetzt er den Holzfäller?

## Annahmen

1. Zehnt-Regel der Idee: Ist der Schalter einer Stufe an, kommt ein Anteil `TITHE_PCT` ihrer Steuer als Ware statt
   als Geld. Ideenform: Anteil 100 %, Stufe 1 in Holz, Stufe 2 in Stein. Die Steuer ist die heutige Nennsteuer der Stufe
   (Steuerstufe, Edikt und Stadtrecht eingerechnet).
2. Kurs = Einheiten Ware je 100 Geld Nennsteuer; Warenwert je Einheit k = 100 ÷ Kurs.
3. Versorgung je Einwohner (Bilanz nach Balancing-Spec): Fischer für Nahrung; ein Marktplatz je 40 Einwohner; eine
   Kapelle je 80 Siedler; Weber und Schäferei mit 1 Wolle je Stoff.
4. **Stadt F** (Frühspiel, ≈ min 6): 12 Häuser Pioniere à 4 = 48 Pioniere, 2 Holzfäller.
   **Stadt M** (Mittelspiel, ≈ min 15): 40 Pioniere, 15 Häuser Siedler à 8 = 120 Siedler, Bauketten 2 Holzfäller,
   1 Steinbruch, 1 Werkzeugmacher (Unterhalt 45 je 100 Ticks).
5. Bedarf an Baustoff in Wellen: Aufstieg 2 → 3 von 15 Häusern plus Schule und Brennerei ≈ 185 Stein in 5–10 min
   (20–35/min). Früher Ausbau ≈ 40–60 Werkzeug in den ersten 15 min.
6. Stilllegen halbiert den Unterhalt eines Betriebs, der nicht gebraucht wird (Info `src/sim/levels.ts:48`).

## Zahlen aus `src/sim/defs/` und Regeln

| Wert                             | Zahl                                               | Fundstelle                                           |
| -------------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| Steuer Stufe 1 / 2 je Einwohner  | 2 / 7 je 100 Ticks (erfüllt) = 12 / 42 /min        | `src/sim/defs/tiers.ts:18,27`, `population.ts:247`   |
| Steuersatz niedrig/normal/hoch   | 70 / 100 / 130 %                                   | `src/sim/defs/tiers.ts:61-63`                        |
| Steuer bucht nur Geld            | `world.money += n`                                 | `src/sim/population.ts:270-277`                      |
| Holz Zukauf / Verkauf            | 10 / 4                                             | `src/sim/defs/goods.ts:7-8`                          |
| Stein Zukauf / Verkauf           | 15 / 6                                             | `src/sim/defs/goods.ts:15-16`                        |
| Werkzeug Zukauf / Verkauf        | 40 / 15                                            | `src/sim/defs/goods.ts:11`                           |
| Lagergrenze je Gut und Insel     | 100, Überschuss wird nicht eingelagert             | `src/sim/defs/goods.ts:84`, `economy.ts:12-16`       |
| Startbestand Holz/Werkzeug/Stein | 40 / 20 / 10, Startgeld 5000                       | `src/sim/defs/goods.ts:85-89`                        |
| Holzfäller                       | 50 Geld, 1 Werkzeug; Unterhalt 5; Takt 30          | `src/sim/defs/buildings.ts:90-95`                    |
| Steinbruch                       | 150, 10 Holz, 3 Werkzeug; 10; Takt 60; Berg        | `src/sim/defs/buildings.ts:103-109`                  |
| Werkzeugmacher                   | 200, 15 Holz, 3 Wz.; 25; Takt 80; frisst Holz      | `src/sim/defs/buildings.ts:172-178`                  |
| Fischer / Weber / Schäferei      | Unterhalt 5 / 15 / 10; Takt 40 / 50 / 50           | `src/sim/defs/buildings.ts:50,54,118,122,131,136`    |
| Markt / Kapelle                  | Unterhalt 10 / 15                                  | `src/sim/defs/buildings.ts:28,188`                   |
| Bedarf Nahrung / Stoff           | 0,5 / 0,2 je Einwohner und 100 Ticks               | `src/sim/defs/tiers.ts:16,25`, `population.ts:100`   |
| Aufstieg 1→2 / 2→3               | 300 Geld, 10 Holz, 5 Wz., 5 Stein / 600, 15, 8, 10 | `src/sim/defs/tiers.ts:28,37`                        |
| Sperre Steuerstufe               | 300 Ticks                                          | `src/sim/defs/timing.ts:8`                           |
| Edikt Handel                     | Zukauf 80 %, ab `won`                              | `src/sim/defs/edicts.ts:20,38`                       |
| Auftragsprämie; Boom; Vorliebe   | ⌊0,75 × Zukauf⌋; 150 %; 130 %                      | `goods.ts:73`, `defs/crises.ts:18`, `defs/sea.ts:35` |
| Kasse < 0 lässt Probe scheitern  | `money < 0`                                        | `src/sim/trial.ts:36`                                |

Ein Betrieb liefert 1 Stück je Takt (`src/sim/production.ts:68`), der Unterhalt gilt je 100 Ticks. Daraus folgt:
Holzfäller 20 Holz/min für 30 Geld/min, Steinbruch 10 Stein/min für 60, Werkzeugmacher 7,5/min für 150 plus 7,5 Holz.

## Rechnung

### 1 Kursband und Stückkosten

| Gut      | Band (Kurs) = 100 ÷ Zukauf … 100 ÷ Verkauf | Vorschlag Kurs | k (Geld/Stück) | Zukauf / mit Handel | eigene Herstellung bei Auslastung 100 / 50 / 32 % |
| -------- | ------------------------------------------ | -------------- | -------------- | ------------------- | ------------------------------------------------- |
| Holz     | 10 … 25                                    | 12             | 8,33           | 10 / 8              | 1,50 / 2,25 / 3,09                                |
| Stein    | 6,7 … 16,7                                 | 8              | 12,5           | 15 / 12             | 6,0 / 9,0 / **12,4**                              |
| Werkzeug | 2,5 … 6,7                                  | 3              | 33,3           | 40 / 32             | 21,5 / 31,5 / 42,8                                |

Herstellkosten je Stück = Unterhalt × (u + (1 − u) ÷ 2) ÷ (Ausstoss × u), dazu beim Werkzeug 1 Holz zu 1,5.
Der Kurs liegt bei 83 % des Zukaufs, so nah am Edikt Handel (80 %) wie es ganze Zahlen erlauben.

- **Gleichstand Zehnt = Herstellung:** Holzfäller bei u = 10 %, Steinbruch bei u = 32 %, Werkzeugmacher bei u = 46 %.
- **Holz ist das falsche Gut.** Ein Holzfäller ist selbst bei 10 % Auslastung billiger (8,3 Geld/Stück) und kostet nur
  50 Geld und 1 Werkzeug. Holz-Zehnt ersetzt höchstens den Holz-Zukauf, nie den Holzfäller.
- **Stein und Werkzeug** sind die echten Kandidaten: Der Steinbruch braucht einen Bergplatz, der Werkzeugmacher Holz,
  200 Geld und 150 Unterhalt/min. Beide laufen im Frühspiel oft unter 50 %.

### 2 Ertrag je Einwohner (je min, Satz normal)

| Stufe     | Geldsteuer | Ideenform (100 %) | Vorschlag                                 |
| --------- | ---------- | ----------------- | ----------------------------------------- |
| 1 Pionier | 12         | 1,44 Holz         | 100 % in Werkzeug: 0,36 Werkzeug (≙ 12)   |
| 2 Siedler | 42         | 3,36 Stein        | 10 % in Stein: 0,34 Stein, dazu 37,8 Geld |

### 3 Bilanz je Einwohner (je 100 Ticks; Steuer minus anteiliger Unterhalt)

| Stufe   | Steuer | Unterhalt anteilig                                                                | Netto mit Geld | Netto Kasse mit Zehnt (Vorschlag) | Ware je 100 Ticks |
| ------- | ------ | --------------------------------------------------------------------------------- | -------------- | --------------------------------- | ----------------- |
| Pionier | 2      | Fischer 0,5 × 2 = 1,00 · Markt 10/40 = 0,25 → 1,25                                | **+0,75**      | **−1,25**                         | 0,06 Werkzeug     |
| Siedler | 7      | Nahrung 1,00 · Stoff 0,2 × 12,5 = 2,50 · Kapelle 15/80 = 0,19 · Markt 0,25 → 3,94 | **+3,06**      | **+2,36**                         | 0,056 Stein       |

Die Kasse bleibt mit Pionier-Zehnt nur im Plus, solange es höchstens 3,06 ÷ 1,25 = 2,45 Pioniere je zahlenden Siedler
gibt (ohne Bauketten).

### 4 Durchgerechnete Städte (je min)

| Fall                                | Kasse Netto | Ware/min            | Lager 100 voll nach | Zehnt-Ware ≙ Betriebe |
| ----------------------------------- | ----------- | ------------------- | ------------------- | --------------------- |
| F, alles Geld                       | +156        | —                   | —                   | —                     |
| F, Ideenform Stufe 1 Holz 100 %     | −420        | 69 Holz             | 1,4 min (ab 0)      | 3,5 Holzfäller        |
| F, Vorschlag Stufe 1 Werkzeug 100 % | −420        | 17,3 Werkzeug       | 5,8 min             | 2,3 Werkzeugmacher    |
| M, alles Geld                       | +2115       | —                   | —                   | —                     |
| M, Ideenform Stufe 2 Stein 100 %    | **−2925**   | 403 Stein           | 15 s                | 40 Steinbrüche        |
| M, Vorschlag Stufe 2 Stein 10 %     | +1611       | 40 Stein            | 2,5 min             | 4 Steinbrüche         |
| M, beide Vorschläge                 | +1131       | 14,4 Wz. + 40 Stein | 6,9 / 2,5 min       | —                     |

- **Ideenform Stufe 2 ist unbrauchbar.** Die Siedler-Steuer ist rund 20-mal so viel wert wie der Steinbedarf
  (5040/min gegen 20–35 Stein × 12,5 ≈ 250–440/min). Nach 15 s ist das Lager voll, der Rest verfällt, und die Kasse fällt
  um 2925/min. Mit 10 % (wörtlich «Zehnt») trifft der Strom die Aufstiegswelle (40/min gegen 20–35/min).
- **Stufe 1 ganz:** F hat im Lauf der Sperre (3 min) −1260 Kasse statt +468 und bekommt 52 Werkzeug. Zugekauft kosten
  diese 2080, als Zehnt 1728 entgangene Steuer, gespart sind also 352 (17 %). Ab Kasse < 1260 wird die Kasse in der Sperre
  negativ.

### 5 Umschaltfrist

Bei der heutigen Sperre der Steuerstufe (300 Ticks) holt der Spieler genau seine Fehlmenge und schaltet zurück. Dann
ist der Zehnt ein Zukauf mit 17 % Rabatt ohne Risiko und dominiert den Zukauf. Mit **1800 Ticks (3 min)** legt er
sich auf 52 Werkzeug (F) bzw. 120 Stein (M) fest. Das ist eine Ausbauwelle, aber nicht beliebig fein. Den Überschuss
über 100 Stück verliert er.

## Prüfung auf dominante Wahl (R722) und Entartungen

- **E1 Zehnt immer:** Kasse F −420/min, Probe scheitert bei Kasse < 0; über 100 Stück verfällt; Betrieb ab u ≥ 32/46 % billiger → nein.
- **E2 Zehnt nie:** Ideenform Holz: ja (Holzfäller immer billiger); Stein 100 %: ja. Vorschlag: lohnt bei Wellen und ohne Bergplatz → Ideenform ja.
- **E3 Verkaufs-Pumpe:** Werkzeug k 33,3 gegen Verkauf 15, Boom 22,5; Stein 12,5 gegen 6 / 9; Auftrag Stein 11 < 12,5; Werkzeug ohne Auftrag → nein.
- **E4 Ersetzt den Holzfäller:** nie: 1,5–3,1 Geld/Holz gegen 8,33. Vorschlag nimmt Holz ganz heraus → nein.
- **E5 Ersetzt Steinbruch/Werkzeugmacher:** nur unter 32 % bzw. 46 % Auslastung oder ohne Bergplatz; Dauerbedarf bleibt Betrieb → gewollt.
- **E6 Ersetzt Zukauf:** 17 % billiger, aber langsam (3 min) und mit Verfall; Zukauf bleibt sofort und stückgenau → Wahl.
- **E7 Zehnt plus Edikt Handel:** Zukauf 32 / 12 unter Zehnt 33,3 / 12,5 → nach `won` mit Handel nutzlos, mit Sparen oder Wohlfahrt nicht → gewollt.
- **E8 Klick-Mikro:** durch Sperre 1800 Ticks verhindert → Regel.
- **E9 Zehnt auf Steuer «hoch»:** Ware steigt mit dem Satz (130 %), Belegung 75 % bleibt Gegenpreis; Kurs gleich → nein.
- **E10 Auflage «Eigenversorgung» (`docs/spielwerte.md`, nach Denkmal):** kein Zukauf 15 min → Zehnt ist dort der einzige Weg ausser Betrieb, stärkste Nische → gewollt.

**Drei Pfade für Baustoff bleiben lohnend:** Betrieb (billig je Stück, braucht Platz, Kapital und Auslastung), Zehnt
(17 % unter Zukauf, kostet Kassenreichweite und Festlegung) und Zukauf (sofort, stückgenau, teuer).

## Vorschlag Def-Werte (`src/sim/defs/tiers.ts`, neben `TAX_LEVELS`)

| Name                  | Zahl                         | Einheit                                             |
| --------------------- | ---------------------------- | --------------------------------------------------- |
| `TITHE_GOOD`          | `{ 1: 'tools', 2: 'stone' }` | Gut je Stufe (Ideenform `1: 'wood'` verworfen)      |
| `TITHE_PCT`           | `{ 1: 100, 2: 10 }`          | % der Steuer der Stufe, der als Ware kommt          |
| `TITHE_UNITS_PER_100` | `{ tools: 3, stone: 8 }`     | Stück je 100 Geld Nennsteuer (Holz, falls doch: 12) |
| `TITHE_SWITCH_LOCK`   | 1800 (in `timing.ts`)        | Ticks Sperre nach jedem Umschalten                  |

Buchung wie die Steuer mit ganzzahligem Übertrag je Gut (`titheCarry`). Eingelagert wird über `addStock` auf der
Heimatinsel; der Rest verfällt mit Anzeige «Lager voll: n Stein verfallen». Standard «Geld» bucht exakt wie heute,
also bitgleich, und der Balancing-Test bleibt grün. Save-Version +1 (Schalter, Sperre, Übertrag); ein älterer Stand
wird mit Hinweis abgewiesen, Test.

Spielertexte (R896):

- «Zehnt der Pioniere: Ihre ganze Steuer kommt als Werkzeug ins Lager, nicht als Geld.»
- «Zehnt der Siedler: Ein Zehntel ihrer Steuer kommt als Stein ins Lager.»
- «Nach dem Umschalten bleibt der Zehnt 3 Minuten, wie er ist.»
- «Ist das Lager voll, verfällt der Rest.»

## Ergebnis: **anpassen**

In der Ideenform trägt der Zehnt nicht. Holz-Zehnt verliert immer gegen den Holzfäller. Der Stein-Zehnt zu 100 % ist
rund 20-mal zu gross für den Bedarf und reisst die Kasse um 2925/min ins Minus. Mit Werkzeug für Stufe 1 (ganze Steuer),
Stein zu 10 % für Stufe 2, Kurs 83 % des Zukaufs und 3 Minuten Sperre wird er ein echter Engpass-Hebel: 17 % billiger
als Zukauf, keine Pumpe, und ein Betrieb ist ab 32–46 % Auslastung billiger.

## Offene Fragen an L0

1. **Gut der Stufe 1:** Werkzeug statt Holz. Empfehlung: annehmen. Holz bleibt sonst eine Scheinoption. Thematisch
   «Frondienst in der Schmiede».
2. **Ungleiche Anteile** 100 % und 10 % je Stufe. Empfehlung: annehmen. Ein gleicher Anteil passt nicht, weil die
   Siedler-Steuer je Kopf 3,5-mal so hoch ist und ihr Stein billiger.
3. **Ruling-Entwurf:** «Zehnt-Kurs 83 % des Zukaufs (Werkzeug 3, Stein 8 je 100 Geld) — zwischen Verkauf und Zukauf, knapp
   über Edikt Handel, damit keine Pumpe und kein reiner Zukauf-Ersatz entsteht — Kosten bei Irrtum: ein Kurs ≤ 80 %
   macht den Zehnt nach `won` zum besseren Edikt, ≥ 95 % nutzt ihn niemand; Korrektur nur in `defs`.»
4. **Ruling-Entwurf:** «Zehnt-Sperre 1800 Ticks statt 300 — mit 300 ist der Zehnt risikofreier Rabatt-Zukauf und
   dominiert — Kosten bei Irrtum: zu lange Sperre macht den Pionier-Zehnt zur Bankrottfalle (F: −1260 in 3 min).»
5. Warnung mit Kassen-Reichweite (I-168) beim Einschalten, Pflicht für Proben (`trial.ts:36`). Empfehlung: ins
   Kurzdesign aufnehmen.
