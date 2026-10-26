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

## 8 Nachtrag Gate Spec (R978)

Ergänzt Spec §7 (und §3.9, §4); neue Kriterien ab AK-NU1-37, Format wie Spec §7. Auflage 7 (Wertgrenzen) und die
Pin-Liste zu `U7` liegen bei `lead-tech`. Zeilenangaben: Stand `eb01f632`, [Tech] prüft. Korrektur Auflage 9: AK-13 und
AK-30 sind in der Spec berichtigt (kein Umbruch im Code-Text, «Obergrenzen» benannt).

### 8.1 Auflage 1: Hebel F2 und F7 (Setzung `lead-design`)

- **F2** wirkt über einen Helfer «Güter je Richtung» mit Weltbezug [Tech: Name]: 2 ohne F2, 3 mit F2. Jede Stelle, die
  heute `ROUTE_GOODS_PER_DIRECTION` liest (`save.ts:690`, `ships.ts:81–82`), nutzt den Helfer. Die Ladeprüfung prüft
  `finds` **vor** den Routen, sonst wäre ein gültiger Stand mit 3 Gütern «Beschädigter Spielstand».
- **F7** wirkt über einen Helfer «Lagergrenze je Insel und Gut» [Tech: Name]: 120 für Gewürz und Nahrung mit F7, sonst 100.
  Alle Kappungen nutzen ihn (`economy.ts:13`, `trade.ts:127`, `ships.ts:153`, `queries.ts:209`).
- Ausserhalb von `src/sim/defs/` und den zwei Helfern liest kein Modul in `src/sim` `STORAGE_CAP` oder
  `ROUTE_GOODS_PER_DIRECTION` direkt.

37. **AK-NU1-37 (V, `tests/sim/finds-save.test.ts`)** Round-Trip mit F2 und einer Route mit 3 Gütern je Richtung: tief
    gleich, kein Abweisen; ohne F2 wird dieselbe Route mit «Höchstens 2 Güter je Richtung» abgelehnt.
38. **AK-NU1-38 (V, `tests/sim/finds-save.test.ts`)** Round-Trip mit F7 und 120 Gewürz und Nahrung im Lager: tief gleich;
    ohne F7 ist ein Lager über 100 ein beschädigter Stand.
39. **AK-NU1-39 (V, `tests/sim/finds-storage.test.ts`)** Kappung, Entladen am Kontor und Rückkehr der Expedition
    (`unloadAtHome`) mit Grenze 120 für Gewürz und Nahrung (mit F7) bzw. 100 (ohne, und für alle anderen Güter), je Gut.
40. **AK-NU1-40 (V, Wächter, Quelltext-Prüfung)** Ausser `src/sim/defs/` und den zwei Helfern kommt in keiner Datei
    unter `src/sim` der Name `STORAGE_CAP` oder `ROUTE_GOODS_PER_DIRECTION` vor (Trefferliste bei Stand `eb01f632`:
    `save.ts`, `ships.ts`, `economy.ts`, `trade.ts`, `queries.ts`).

### 8.2 Auflage 2: Baseline (ersetzt AK-25)

- **AK-NU1-25a (V)** `balance*.test.ts`, `seaGolden.test.ts` und die Auftrags-, Krisen- und Inselpins (Seeds 1–3) laufen
  ohne Änderung an Erwartungen grün und bitgleich; der Controller ruft keine Expeditions-Aktion (Quelltext-Prüfung
  `tests/sim/controller.ts`).
- **AK-NU1-25b (V)** Pins, die mechanisch mit `UNLOCK_IDS` und neuen Weltfeldern wachsen (u. a. Literallisten in
  `unlocks.test.ts`, `e0Pins`/`e1Pins`, `scenario-saves`, `save-contract`, Versionspin in `trial-save.test.ts`, Welten mit
  `wonSpice` wie `goal3`, `honors`, `monument`), listet der Plan per `rg` und pinnt sie mit Ruling-Notiz neu; Welten mit
  `wonSpice` werden mit `U7` erwartet.

### 8.3 Auflage 3: Migration (ergänzt AK-23)

41. **AK-NU1-41 (V, `tests/sim/expedition-save.test.ts`)** Das Fixture «`SAVE_VERSION − 1`» entsteht aus einer frischen
    Serialisierung (neue Felder entfernen, Version senken), nie als gespeichertes Literal. Zwei Fälle: alter Stand mit
    `wonSpice true` lädt mit `U7`, mit `wonSpice false` ohne; beide mit `expedition null`, leerem `seaRevealed` und `finds`.
42. **AK-NU1-42 (V)** Ladeprüfung: `wonSpice true` ⇒ `U7` in `unlocked`; fehlt es, «Beschädigter Spielstand».

### 8.4 Auflage 4: Ladeprüfung schärfen (ergänzt AK-24 und Spec §4)

Regeln: (a) `finds` ist je aufgedecktem Gebiet ein Präfix der Gebietsliste (auch leer); die Gesamtreihenfolge folgt der
Aufdeck-Reihenfolge von `seaRevealed`. (b) In Phase `leg` gilt `leg ≤ sections + extra`. (c) `cargo` wird in der Reihenfolge
von `GOOD_IDS` gespeichert, damit der Welt-Hash (AK-22) nicht von der Einfügereihenfolge abhängt. (d) `cards` gehören zum
Pool des Gebiets. Je Regel ein Fall in `tests/sim/expedition-save.test.ts`, Ergebnis jeweils abgewiesen oder (c) gleicher Hash:

43. **AK-NU1-43 (V)** (a) `finds` mit Lücke, falscher Gebietsliste oder vertauschter Gebietsreihenfolge: abgewiesen.
44. **AK-NU1-44 (V)** (b) `leg` über `sections + extra` in Phase `leg`: abgewiesen.
45. **AK-NU1-45 (V)** (c) Zwei Welten mit derselben Ladung in verschiedener Einfügereihenfolge ergeben nach dem Speichern
    denselben Text und Hash.
46. **AK-NU1-46 (V)** (d) `cards` mit Karte eines anderen Gebiets: abgewiesen.

### 8.5 Auflage 5: Browser (ergänzt AK-31)

Alle (B) bei 1280 px, Screenshots `.studio/qa/NU-1/`.

47. **AK-NU1-47 (B)** Speichern und Laden bei offener Karte (`storage.ts`): Karte wieder offen, gleiche Sperren.
48. **AK-NU1-48 (B)** Wartezustand: Knopf «Abbrechen» gibt die Ladung zurück; nach dem Auslaufen fehlt der Knopf.
49. **AK-NU1-49 (B)** Während einer Expedition zeigt der Abriss-Knopf des Kartenhauses «Erst Expedition beenden».
50. **AK-NU1-50 (B)** Spielpause: Wahl am Kartendialog ist erlaubt, es läuft nichts weiter (Tickzähler und Marke stehen).
51. **AK-NU1-51 (B)** `Esc` schliesst den Kartendialog ohne Wahl; Karte bleibt offen, HUD-Chip bleibt.

### 8.6 Auflage 6: Randfälle (ergänzt Spec §6)

52. **AK-NU1-52 (V, `tests/sim/expedition.test.ts`)** (a) `cancelExpedition` bei vollem Heimatlager: Ladung bis
    `STORAGE_CAP` bzw. der Grenze je Gut zurück, Rest verfällt, Meldung im Ergebnis.
53. **AK-NU1-53 (V)** (b) Entladen bei `boarding` mit Überlauf: Rest verfällt mit `ShipLoss`-Meldung, Phase `leg` im selben Tick.
54. **AK-NU1-54 (V)** (c) Ein `homing`-Schiff und ein Fall-(b)-Schiff mit nur Gewürz an Bord legen an und entladen alles
    (Liste `keep` entfällt), Phase `leg`.
55. **AK-NU1-55 (V)** (d) Speichern in `boarding` nach `clearRoute`: Round-Trip tief gleich, Schiff `homing`, Fahrt beginnt
    bei Ankunft.

### 8.7 Auflage 8: Erklärbarkeit (Setzung `lead-design`, ergänzt AK-28)

Der Kartendialog zeigt zusätzlich «Proviant reicht noch für n Abschnitte» (n = Nahrung ÷ 3, abgerundet) und bei der
R-Option den Hinweis «Fund nur, wenn die Fahrt zu Ende geht».

56. **AK-NU1-56 (V, `tests/ui/expeditionView.test.ts`)** Das Kartenmodell trägt beide Texte wörtlich; n folgt der Nahrung an
    Bord (z. B. 7 Nahrung → «2 Abschnitte»); der Hinweis steht nur an R-Optionen.
