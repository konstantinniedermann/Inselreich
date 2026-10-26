# NU-1 «Kartenrand» — Anhang 02: Def-Werte (normativ)

Stand 2026-10-26 · Paket `design-NEUE-UFER` · `design-spec-author` für `lead-design` · Vorlage für `src/sim/defs/`.
Die Spec [NU-1](../2026-10-25-nu1-kartenrand-design.md) verweist auf die Nummern A01-01 … A01-12 (§1).

Herkunft: «A01 §x» = [Anhang 01](anhang-01-werte.md) Abschnitt x (gerechnet, nicht gemessen), «Bestand» = geprüft gegen
`src/sim/defs/` (Stand Worktree), **Annahme** = hier gesetzt, im Gate zu bestätigen, **Setzung Spec** = Text ohne
Rechenbezug. `src/` ist unverändert; nichts hier ist bereits Code.

## 1 Nr. → Wert → Def-Ort

| Nr.    | Wert                                                                               | Def-Ort                                       | Herkunft     |
| ------ | ---------------------------------------------------------------------------------- | --------------------------------------------- | ------------ |
| A01-01 | Kartenhaus-Kosten 1500 Geld, 30 Holz, 15 Werkzeug, 20 Stein                        | `buildings.ts` `maphouse.cost`                | A01 §1       |
| A01-02 | Kartenhaus-Unterhalt 20 je 100 T                                                   | `buildings.ts` `maphouse.upkeep`              | A01 §1       |
| A01-03 | Proviant: Nahrung, 3 je Abschnitt (zugleich Mindestmenge beim Start)               | `expedition.ts` `PROVISION`                   | A01 §2, E-13 |
| A01-04 | Dauer eines Abschnitts: 300 T (es gibt keine eigene Hinfahrt)                      | `expedition.ts` `SECTION_TICKS`               | A01 §2       |
| A01-05 | Heimfahrt: 600 T ohne Proviant; nach Umkehr `min(600, 300 × gefahrene Abschnitte)` | `expedition.ts` `HOME_TICKS`, `SECTION_TICKS` | A01 §2       |
| A01-06 | Umweg: +2 Abschnitte direkt nach der gewählten Karte                               | `expedition.ts` `DETOUR_SECTIONS`             | A01 §2       |
| A01-07 | Abschnitte und Kartenstellen je Gebiet (§3), Karten je Fahrt 2/3/3, Pool 4/5/5     | `expedition.ts` `SEA_AREAS`                   | A01 §2       |
| A01-08 | Hinweis-Waren und Stichworte je Gebiet (§3)                                        | `expedition.ts` `SEA_AREAS`                   | A01 §0, §2   |
| A01-09 | Kartenkatalog mit R, S und Regel U (§4)                                            | `expedition.ts` `EXPEDITION_CARDS`            | A01 §3       |
| A01-10 | 8 Fundstücke mit Gebietsliste (§5)                                                 | `expedition.ts` `FINDS`                       | A01 §4       |
| A01-11 | Satzbonus: nur Chronik-Meldung und Listenzeile, ohne Zahl (§5)                     | `expedition.ts` (Text), keine Wirkung         | A01 §9 E-11  |
| A01-12 | Prüfrechnung Dauer und Packlage (§7)                                               | nur Anhang (Wächter AK-NU1-30)                | A01 §0, §3   |

Weitere Konstanten ohne eigene Nummer: Tabelle §6.

## 2 Kartenhaus (`buildings.ts`, neu `maphouse` [Tech: Id])

| Feld           | Wert                                                                                                                                                                                                                  | Herkunft                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `name`         | «Kartenhaus»                                                                                                                                                                                                          | Setzung Spec (Gattungswort, ADR-006)     |
| `w`, `h`       | 2, 2                                                                                                                                                                                                                  | A01 §1                                   |
| `cost`         | `cost(1500, 30, 15, 20)` = Geld 1500, Holz 30, Werkzeug 15, Stein 20                                                                                                                                                  | A01 §1; Reihenfolge wie `buildings.ts:3` |
| `upkeep`       | 20                                                                                                                                                                                                                    | A01 §1                                   |
| `category`     | `infrastructure`                                                                                                                                                                                                      | Setzung Spec                             |
| `maxCount`     | `{ n: 1, reason: 'Es gibt schon ein Kartenhaus' }`                                                                                                                                                                    | A01 §1                                   |
| `site`         | `[{ kind: 'home' }, { kind: 'supply' }]`                                                                                                                                                                              | A01 §1; Muster Denkmal                   |
| `flammable`    | fehlt (nicht brennbar)                                                                                                                                                                                                | A01 §1                                   |
| Rückerstattung | nach Bestand (50 %)                                                                                                                                                                                                   | A01 §6, `economy.ts`                     |
| `unlocks.ts`   | neu `U7`: `trigger: { kind: 'wonSpice' }`, `buildings: ['maphouse']`, `goods: []`, `functions: ['expedition']`, `lockText: 'Erst nach der Gewürzstadt'`; `UNLOCK_IDS` bekommt `'U7'` am Ende, nicht in `UNLOCK_CHAIN` | A01 §1                                   |

Der neue Auslösertyp `wonSpice` ist wahr, sobald `world.wonSpice` gesetzt ist. Weil `world.unlocked` der Reihenfolge von
`UNLOCK_IDS` folgt, wächst es um einen Eintrag (Spec §4, Migration).

## 3 Konstanten und Gebiete (`expedition.ts`, neu)

Reihenfolge der Gebiete in der Def = Index für den Zufallsstrom: 0 `wrecks`, 1 `skerries`, 2 `north`.

| Feld                            | Wrackfeld (`wrecks`)                        | Holzschären (`skerries`)          | Nordgebiet (`north`)           |
| ------------------------------- | ------------------------------------------- | --------------------------------- | ------------------------------ |
| Abschnitte `sections`           | 4                                           | 5                                 | 7                              |
| `cardsAfter` (nach Abschnitt)   | [2, 4]                                      | [2, 4, 5]                         | [3, 5, 7]                      |
| Karten je Fahrt                 | 2                                           | 3                                 | 3                              |
| Pool                            | 4 Karten                                    | 5 Karten                          | 5 Karten                       |
| Hinweis-Waren                   | Holz, Werkzeug                              | Rum, Glas                         | Werkzeug, Stoff                |
| Stichworte (Setzung Spec)       | «Wracks: Holz · Riff: Werkzeug»             | «Lotsen: Rum · Leuchtfeuer: Glas» | «Eis: Werkzeug · Kälte: Stoff» |
| Proviant für alle Abschnitte    | 12                                          | 15                                | 21                             |
| Dauer ohne Umweg                | 1800 T = 3,0 min                            | 2100 T = 3,5 min                  | 2700 T = 4,5 min               |
| Dauer mit Umweg bei jeder Karte | 2400/3000/4500 T → 4,0/5,0/7,5 min (A01 §2) |                                   |                                |
| Fundstücke (Liste, §5)          | F1, F2                                      | F3, F4, F5                        | F6, F7, F8                     |

Die letzte Kartenstelle liegt immer nach dem letzten Abschnitt. Jede Zahl stammt aus A01 §0 und §2.

## 4 Kartenkatalog

**Regel U (für jede Karte, keine Def-Option):** «Umweg» ist immer wählbar, ohne Bedingung. Er fügt `DETOUR_SECTIONS` (2)
Abschnitte direkt nach der Karte ein.

**Def-Regeln:** Jede Karte hat genau eine R-Option, sie trägt eine Bedingung und `find: true`. Jede Karte hat höchstens
eine S-Option (sicher), ohne `find`. Eine Bedingung ist eine Liste von höchstens zwei Waren `{ good, n }`. Kartentexte
(ein Satz, höchstens 120 Zeichen) schreibt die Umsetzung, sie sind nicht Teil der Spec; die Beschriftung der Option
folgt aus der Bedingung.

**Wrackfeld** (Holz, Werkzeug; R 10–20, S 4–5)

| Karte                     | R (mit Fundstück)    | S          |
| ------------------------- | -------------------- | ---------- |
| Gekentertes Handelsschiff | 15 Holz + 5 Werkzeug | 5 Holz     |
| Treibende Masten          | 10 Werkzeug          | 5 Holz     |
| Riff unter Wrackteilen    | 12 Holz + 4 Werkzeug | 4 Werkzeug |
| Versunkene Glocke         | 8 Holz + 8 Werkzeug  | –          |

**Holzschären** (Rum, Glas; R 6–12, S 3–4)

| Karte                    | R (mit Fundstück) | S         |
| ------------------------ | ----------------- | --------- |
| Lotsen der Schären       | 10 Rum            | 4 Rum     |
| Nebel in der Enge        | 6 Glas            | –         |
| Holzfäller am Ufer       | 8 Rum + 4 Glas    | 4 Rum     |
| Zerbrochenes Leuchtfeuer | 8 Glas            | 3 Glas    |
| Fest am Strand           | 12 Rum            | 4 Nahrung |

**Nordgebiet** (Werkzeug, Stoff; R 8–10, S 4)

| Karte                   | R (mit Fundstück)    | S          |
| ----------------------- | -------------------- | ---------- |
| Packeis                 | 8 Werkzeug           | 4 Werkzeug |
| Frost an Deck           | 8 Stoff              | 4 Stoff    |
| Robbenbank              | 4 Werkzeug + 4 Stoff | –          |
| Eingeschlossenes Schiff | 4 Werkzeug + 6 Stoff | 4 Nahrung  |
| Gletscherküste          | 10 Werkzeug          | 4 Werkzeug |

Hierarchie je Karte: R (Fundstück, viel Ware) > S (wenig Ware, keine Zeit) > U (6 Ladeplätze Nahrung + 600 T). Herkunft
A01 §3; die Kartennamen sind Gattungswörter (entschieden R970 E3).

## 5 Fundstücke und Satzbonus

Die k-te R-Wahl einer **geschafften** Fahrt bringt das k-te Stück der Gebietsliste (§3). Das Stück wirkt als letzter
Faktor, `ceil(z × 90 / 100)`, mindestens 1, wo ein Zyklus oder eine Fahrzeit betroffen ist (A01 §4, E-14). Die Def-Werte
(Basis) bleiben unverändert; jedes Stück ist ein Eintrag in `FINDS` mit Hebel, Ziel und Wert [Tech: Typ-Union].

| Nr  | Gebiet / Platz | Name        | Wirkung                                                                      | Feld, Rundung                                    | Leseort (Zusatz «(Fundstück «Name»)»)       | Prüfwert                           |
| --- | -------------- | ----------- | ---------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------- | ---------------------------------- |
| F1  | Wrackfeld 1    | Kompassrose | Fahrzeit aller Routen −10 % (10 → 9 T je Kachel)                             | `laneTicks`-Ergebnis, `ceil(z × 90 / 100)`       | Routen-Dialog, Fahrzeit in der Schiffsliste | Seeweg 30 Kacheln: 300 → 270 T     |
| F2  | Wrackfeld 2    | Ladebaum    | Güter je Richtung 2 → 3 (`ROUTE_GOODS_PER_DIRECTION`)                        | Konstante, Hebel ersetzt den Wert                | Routen-Dialog, Zeile «Güter je Richtung»    | 2 → 3                              |
| F3  | Holzschären 1  | Schärenaxt  | Zyklus Holzfäller −10 % (Basis 30)                                           | `ceil(z × 90 / 100)`, ≥ 1, letzter Faktor        | Gebäudekarte Holzfäller, Zyklusanzeige      | Basis 30 → 27; Stufe 3: 12 → 11    |
| F4  | Holzschären 2  | Leuchtlinse | Reichweite Badehaus 10 → 11 (`serviceRadius`)                                | +1                                               | Reichweitenkreis Badehaus                   | 10 → 11                            |
| F5  | Holzschären 3  | Lotsenbuch  | Reichweite Fremdkontor 8 → 9 (`supplyRadius` `kontor2`); NU-2 auch neue Ufer | +1                                               | Kreis des Kontors auf der Fremdinsel        | 8 → 9                              |
| F6  | Nordgebiet 1   | Eispickel   | Zyklus Werkzeugmacher −10 % (Basis 80)                                       | `ceil(z × 90 / 100)`, ≥ 1, letzter Faktor        | Gebäudekarte Werkzeugmacher, Zyklusanzeige  | 80 → 72                            |
| F7  | Nordgebiet 2   | Eiskiste    | Lagergrenze Gewürz und Nahrung 100 → 120 je Kontorlager                      | Grenze je Gut (Helfer, `STORAGE_CAP` bleibt 100) | Lageranzeige im Kontor                      | Gewürz und Nahrung 120, übrige 100 |
| F8  | Nordgebiet 3   | Robbenfell  | Zyklus Schäferei −10 % (Basis 50); NU-2: Wärme-Reichweite +1 (Wert in NU-2)  | `ceil(z × 90 / 100)`, ≥ 1, letzter Faktor        | Gebäudekarte Schäferei, Zyklusanzeige       | 50 → 45                            |

Alle Wirkungen sind ohne Fundstück neutral (Prozent 100, Zusatz 0). Kein Hebel zielt auf Steuer, `WIN_*` oder
`GOODS.buy/sell`. F5 und F8 sind die letzten Stücke ihrer Liste; NU-2 muss ohne sie aufgehen (A01 §4).

**Satzbonus (A01-11, E-11):** Sind alle 8 Stücke in `world.finds`, erscheint einmal die Chronik-Meldung «Kartenrand
vollständig» und die Fundstück-Liste (Spec §5.4) zeigt eine Zeile «Kartenrand vollständig». Keine Zahl, kein Ehrenbuch,
kein Schaukasten.

## 6 Wertetabelle (Konstanten)

| Def-Datei            | Feld                                       | Wert                                                                    | Herkunft                             |
| -------------------- | ------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------ |
| `expedition.ts`      | `REMIND_TICKS`                             | 3000                                                                    | **Annahme** (= `EDICT_LOCK`, A01 §2) |
| `expedition.ts`      | `WARN_BACK_TICKS`                          | 300 (Vorwarnung vor Rückkehr)                                           | A01 §9 E-08                          |
| `expedition.ts`      | `EXPEDITION_SALT`                          | `0xc2b2ae35`                                                            | **Annahme** (frei laut `rg`, A01 §2) |
| `expedition.ts`      | Strom                                      | `createRng((seed ^ Math.imul(gebietIndex + 1, EXPEDITION_SALT)) >>> 0)` | A01 §2, E-03                         |
| `expedition.ts`      | Rundung Fundstück                          | `FIND_PCT = 90`, Wirkung `ceil(z × 90 / 100)`, ≥ 1                      | A01 §4, E-14                         |
| Bestand, unverändert | `SHIP.capacity`, `SHIP_MAX`, `SHIP.upkeep` | 50, 4, 15                                                               | Bestand (`sea.ts:4–8`)               |
| Bestand, unverändert | `STORAGE_CAP`                              | 100                                                                     | Bestand (`goods.ts:84`)              |

Bestand, den AK und Fundstück-Prüfwerte benutzen, wurde gegen `src/sim/defs/` gegengeprüft; **keine Abweichung**:
Zyklen Holzfäller 30, Werkzeugmacher 80, Schäferei 50; Reichweiten Badehaus 10, Fremdkontor 8; `ROUTE_GOODS_PER_DIRECTION`
2; `SHIP_TICKS_PER_SEA_TILE` 10; `STORAGE_CAP` 100; `SHIP.capacity` 50; `cost()` nimmt Geld, Holz, Werkzeug, Stein.
(«zu prüfen»: keine Zeile.) Auswirkung auf `balance.test.ts`: keine, alle Stücke sind ohne Fund neutral.

## 7 Prüfrechnung (A01-12, Wächter AK-NU1-30)

**Dauer ohne Umweg** = Abschnitte × 300 + 600: 1800/2100/2700 T = 3,0/3,5/4,5 min (alle in 3–5 min).

**Bedarf für alle Fälle** (Proviant plus je Gut der grösste Wert über alle möglichen Ziehungen):

| Gebiet      | Proviant | Wahl-Ware, R           | Summe | sicherer Weg: Proviant + S + Umweg-Puffer 6 | Summe |
| ----------- | -------- | ---------------------- | ----- | ------------------------------------------- | ----- |
| Wrackfeld   | 12       | 27 Holz + 18 Werkzeug  | 57    | 12 + (10 Holz + 4 Werkzeug) + 6             | 32    |
| Holzschären | 15       | 30 Rum + 18 Glas       | 63    | 15 + (8 Rum + 3 Glas + 4 Nahrung) + 6       | 36    |
| Nordgebiet  | 21       | 22 Werkzeug + 18 Stoff | 61    | 21 + (8 Werkzeug + 4 Stoff + 4 Nahrung) + 6 | 43    |

Wächterbedingung je Gebiet: «alle für alle Fälle» > 50 und sicherer Weg ≤ 50.

**Jede einzelne Ziehung geht auf** (alle R zugleich plus voller Proviant in 50 Plätzen): grösste Summe der R-Waren der
gezogenen Karten plus Proviant. Wrackfeld: R-Summen 20/10/16/16; beste Paare 20 + 16 = 36; 36 + 12 = **48**.
Holzschären: R-Summen 10/6/12/8/12; beste Dreier 12 + 12 + 10 = 34; 34 + 15 = **49**. Nordgebiet: 8/8/8/10/10; beste
Dreier 10 + 10 + 8 = 28; 28 + 21 = **49**. Alle ≤ 50. Wächter: Für jede Teilmenge der Pool-Karten in Fahrtgrösse ist
die Summe aus R-Waren und Proviant ≤ `SHIP.capacity`. Die Wahl liegt damit in der Zusammensetzung, nicht in einer
unmöglichen Ladung. Die Folge wird erst beim Start gezogen; die Packansicht zeigt davor nur die Hinweis-Waren (Spec §5.2).
