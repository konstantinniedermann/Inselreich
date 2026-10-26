# NU-1 «Kartenrand» — Anhang 01: Werte und Bilanz

Stand: unfertig, offen: Rechenweg A.1–A.3 nur knapp, Zeilenangaben der Herkunft nicht alle gegengeprüft, Satzbonus
und NU-2-Teil von «Robbenfell» nur als Vorschlag.

Stand 2026-10-25 · Paket `design-NEUE-UFER` · `design-economy-designer` für `lead-design` · Regeln aus R962 (nicht neu
verhandelt). **Alle Zahlen sind gerechnet, nicht gemessen.** Herkunft: Def-Datei:Zeile (Stand `b945b279`), «I-144»
(`2026-10-17-i144-rechnung.md` Teil f) oder «Annahme». `src/` und `tests/` sind unverändert.

## 0 Kurzfassung und Urteil

**Urteil: trägt.** Es gibt eine Bedingung: Die Expedition ist eine **Senke für Ware und Schiffszeit, keine Geldsenke**.
Das ist gewollt, aber man soll es nicht anders verkaufen.

1. **Geld bindet nach Ziel 3 nicht.** Der Überschuss von ≈ 4400/min (I-144) gilt für den Endzustand von Ziel 2 (60 K +
   15 B). Bei Ziel 3 (80 K + 15 B) liegt er bei ≈ 5650/min, wenn alles gebaut ist, und bei ≈ 1450/min, wenn Rum und
   Gewürz zugekauft werden. Das Kartenhaus (2700 zu Listenpreis) kostet 0,5–1,9 min Überschuss. Ganz NU-1 kostet über
   30 min 8600–10600, das sind 1,5–2,4 min Überschuss bei 4400/min.
2. **Die echte Knappheit ist die Ladung von 50.** Proviant und Bedingungsware passen nie für jeden Kartenzug zugleich.
   Wer für alle Fälle packen will, braucht 57 (Wrackfeld), 63 (Holzschären) oder 61 (Nordgebiet). Der sichere Weg
   passt dagegen immer: 32/36/43.
3. **Drei Optionsarten je Karte:** riskant **R** (8–20 Ware, bringt ein Fundstück), sicher **S** (3–5 Ware), Umweg
   **U** (immer offen, +2 Abschnitte = 6 Nahrung + 60 s). Damit gibt es keine Sackgasse, und U ist der Weg, über den
   eine Umkehr entsteht.
4. **Fundstücke bringen typisch ≈ 90–100/min Warenwert und höchstens ≈ 375/min.** Keins wirkt auf Steuer, Zielschwellen
   oder Einwohnerzahl. Keins teilt sich ein Feld mit einem anderen Stück oder mit einem Ratsbeschluss. Jedes zeigt in NU-1
   sichtbar Wirkung. NU-1 bleibt über 30 min geldneutral bis leicht negativ, es entsteht keine Machtspirale.
5. **Falle: das einzige Gewürzschiff.** Bei einem Gewürz-Seeweg ≤ 31 reicht ein Schiff. Schickt man genau dieses auf
   Expedition, ist das Lager nach 2,1 min leer. Die Kaufleute fallen dann auf ≈ 4 Einwohner, der Steuerverlust beträgt
   22 000–37 000. Gegenmittel ist eine Warnung mit Zahlen (E-06). Ausweg: viertes Schiff (1850) oder Zukauf (40/Stück).
6. **Balancing-Test:** nicht berührt. Der Controller erreicht Ziel 3 nie (`tests/sim/balance-merchants.test.ts:89`).
   Alle Fundstück-Modifikatoren sind ohne Fund neutral, also bitgleich (gerechnet). Ein Ruling zum Test ist nicht nötig.

| Kernwert                      | Wrackfeld        | Holzschären      | Nordgebiet       |
| ----------------------------- | ---------------- | ---------------- | ---------------- |
| Abschnitte × 300 T            | 4                | 5                | 7                |
| Dauer ohne Umweg (+600 T)     | 1800 T = 3,0 min | 2100 T = 3,5 min | 2700 T = 4,5 min |
| Proviant (3 Nahrung je A)     | 12               | 15               | 21               |
| Karten je Fahrt / Pool        | 2 / 4            | 3 / 5            | 3 / 5            |
| Hinweis-Waren                 | Holz, Werkzeug   | Rum, Glas        | Werkzeug, Stoff  |
| Fundstücke (Liste)            | 2                | 3                | 3                |
| alle R passen (bestes Packen) | 4 von 6 Zügen    | 6 von 10         | 4 von 10         |

## 1 Kartenhaus (a)

| Feld (`buildings.ts`, neu `maphouse`) | Wert                                                 | Begründung                                                                 |
| ------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `w`, `h`                              | 2, 2                                                 | wie Kapelle/Badehaus                                                       |
| `cost`                                | `cost(1500, 30, 15, 20)`                             | Listenwert 1500 + 300 + 600 + 300 = **2700**, über einem Schiff (1850)     |
| `upkeep`                              | **20** je 100 T = 120/min                            | wie Amtsstube; 2,1 % (5650) / 2,7 % (4400) / 8,3 % (1450) des Überschusses |
| `maxCount`                            | `{ n: 1, reason: 'Es gibt schon ein Kartenhaus' }`   | R962 «einmal»                                                              |
| `site`                                | `[{ kind: 'home' }, { kind: 'supply' }]`             | wie Denkmal `buildings.ts:296`                                             |
| `flammable`                           | fehlt (= nein)                                       | kein Brand-Ausfall während einer Fahrt                                     |
| Freischaltung `unlocks.ts`            | neu `U7`, Auslöser `wonSpice`, Funktion `expedition` | baseline-fern; neuer Auslösertyp; `UNLOCK_IDS` wächst (Save +1)            |

Als Geldsenke wirkt das Kartenhaus nur symbolisch. Jeder Preis, der nach Ziel 3 bindet, müsste ≥ 5 min Überschuss
betragen, also ≥ 22 000, und wäre dann eine Wand. Gebäudezahl: +1.

## 2 Expedition (b)

- **Ablauf:** Am Anfang jedes Abschnitts werden **3 Nahrung** verbraucht. Ein Abschnitt dauert **300 T**. Nach den
  Abschnitten in `cardsAfter` erscheint eine Karte, und die Fahrt hält an. Nach dem letzten Abschnitt und der letzten
  Karte wird das Gebiet aufgedeckt und die Fundstücke werden gutgeschrieben. Danach folgt die **Heimfahrt mit 600 T**
  ohne Proviant. Am Ende wird entladen.
- `cardsAfter`: Wrackfeld [2, 4], Holzschären [2, 4, 5], Nordgebiet [3, 5, 7]. Die Karten zieht der Strom ohne
  Wiederholung aus dem Gebietspool.
- **Umweg U:** fügt 2 Abschnitte ein (6 Nahrung, 600 T). Wählt der Spieler überall U, dauert die Fahrt 4,0/5,0/7,5 min.
- **Umkehr:** Sie tritt ein, wenn zu Beginn eines Abschnitts weniger als 3 Nahrung an Bord sind. Die Heimfahrt dauert
  dann `min(600, 300 × gefahrene Abschnitte)` T. Es gibt weder Gebiet noch Fundstück (E-02). Die Restladung kommt
  zurück. Hat das Schiff nach dem letzten Abschnitt genau 0 Nahrung, gilt die Fahrt als geschafft.
- **Start:** nur mit einem freien Schiff im Heimathafen (wie `freeShipAtHome`, `ships.ts:126`) und mit mindestens 3
  Nahrung. Sonst kommt `fail('Kein Proviant an Bord')`. Unter `k × 3` Nahrung erscheint eine Warnung «reicht für s von k
  Abschnitten».
- **Proviant ist nur Nahrung** (E-13): Listenpreis 8 (`goods.ts:22`), eigen ≈ 2 (I-144).
- **Warten auf die Wahl:** Die Fahrt hält ohne Frist an, und Proviant wird dabei nicht verbraucht. Nach 3000 T kommt
  eine Erinnerung, eine Auto-Wahl gibt es nicht (E-05). Eine Entartung ist das nicht, denn das Warten bringt nichts
  ausser Parken (§7). Kosten: Schiffsunterhalt 90/min (`sea.ts:7`).
- **Strom:** `EXPEDITION_SALT = 0xc2b2ae35`, im Code bisher nicht belegt. Die Kartenfolge je Gebiet ist
  `createRng((seed ^ Math.imul(gebiet + 1, SALT)) >>> 0)`. Sie hängt **nicht vom Versuch ab** (E-03): Ein zweiter
  Versuch zeigt dieselben Karten, ein Neu-Würfeln ist also nicht möglich.

## 3 Kartenkatalog (c)

Bedingungen nennen Waren-Mengen, die verbraucht werden. Jede Karte bietet U (+2 Abschnitte). Die Kartennamen sind eigene
Gattungswörter.

**Wrackfeld** (Holz, Werkzeug; R 10–20, S 4–5)

| Karte                     | R → Fundstück        | S          | U   |
| ------------------------- | -------------------- | ---------- | --- |
| Gekentertes Handelsschiff | 15 Holz + 5 Werkzeug | 5 Holz     | ja  |
| Treibende Masten          | 10 Werkzeug          | 5 Holz     | ja  |
| Riff unter Wrackteilen    | 12 Holz + 4 Werkzeug | 4 Werkzeug | ja  |
| Versunkene Glocke         | 8 Holz + 8 Werkzeug  | –          | ja  |

**Holzschären** (Rum, Glas; R 6–12, S 3–4)

| Karte                    | R → Fundstück  | S         | U   |
| ------------------------ | -------------- | --------- | --- |
| Lotsen der Schären       | 10 Rum         | 4 Rum     | ja  |
| Nebel in der Enge        | 6 Glas         | –         | ja  |
| Holzfäller am Ufer       | 8 Rum + 4 Glas | 4 Rum     | ja  |
| Zerbrochenes Leuchtfeuer | 8 Glas         | 3 Glas    | ja  |
| Fest am Strand           | 12 Rum         | 4 Nahrung | ja  |

**Nordgebiet** (Werkzeug, Stoff; R 8–10, S 4)

| Karte                   | R → Fundstück        | S          | U   |
| ----------------------- | -------------------- | ---------- | --- |
| Packeis                 | 8 Werkzeug           | 4 Werkzeug | ja  |
| Frost an Deck           | 8 Stoff              | 4 Stoff    | ja  |
| Robbenbank              | 4 Werkzeug + 4 Stoff | –          | ja  |
| Eingeschlossenes Schiff | 4 Werkzeug + 6 Stoff | 4 Nahrung  | ja  |
| Gletscherküste          | 10 Werkzeug          | 4 Werkzeug | ja  |

**Packliste als echte Wahl:** Für alle Fälle bräuchte man Wrackfeld 12 + 27 Holz + 18 Werkzeug = 57, Holzschären 15

- 30 Rum + 18 Glas = 63 und Nordgebiet 21 + 22 Werkzeug + 18 Stoff = 61, jeweils ohne Umweg-Puffer. Das liegt immer
  über 50. Das beste Packen ohne Puffer, etwa Wrackfeld 23 Holz + 15 Werkzeug, Holzschären 22 Rum + 13 Glas oder
  Nordgebiet 15 Werkzeug + 14 Stoff, deckt alle R-Optionen in 4/6, 6/10 bzw. 4/10 der Züge. Wer für sicheres Spiel packt,
  deckt alle Züge mit 32/36/43. Jeder freie Platz ist entweder Puffer für einen Umweg (6) oder Ware für eine weitere
  R-Option. Das ist die Wahl.

**Hierarchie je Karte:** R (Fundstück, viel Ware) > S (wenig Ware, keine Zeit) > U (6 Ladeplätze + 60 s). Weil U mehr
Platz kostet als jedes S, bleibt S nicht hinter U zurück (E-01).

## 4 Fundstücke (d)

Vergabe: Die n-te R-Wahl in einem Gebiet bringt das n-te noch fehlende Stück aus der Liste dieses Gebiets (E-04). Damit
ist die Reihenfolge planbar, und kein Stück hängt an einer Karte, die vielleicht nie gezogen wird. Ist ein Gebiet
aufgedeckt, sind seine übrigen Stücke verloren. Das ist der Preis des sicheren Wegs. Jedes Stück gibt es nur einmal,
also höchstens 8.

| Nr  | Gebiet / Platz | Name        | Wirkung (Zahl)                                                                      | Feld / Rundung                                           | NU-1 sichtbar                  | klein, nicht dominant (gerechnet)                                                              |
| --- | -------------- | ----------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| F1  | Wrackfeld 1    | Kompassrose | Fahrzeit aller Routen −10 % (10 → 9 T je Kachel)                                    | auf `laneTicks` bzw. HAFEN-Ergebnis, ×90/100 aufgerundet | Schiffe schneller              | +11 % Fracht; 1 Gewürzschiff reicht bis d 34,7 statt 31,25 → spart höchstens 1 Schiff (90/min) |
| F2  | Wrackfeld 2    | Ladebaum    | Güter je Richtung 2 → 3 (`sea.ts:11`)                                               | Konstante                                                | dritter Platz im Routen-Dialog | kein Fluss-Gewinn (Ladung bleibt 50), nur Planfreiheit                                         |
| F3  | Holzschären 1  | Schärenaxt  | Holzfäller-Zyklus −10 % (30 → 27)                                                   | `ceil(z × 90/100)`, ≥ 1                                  | Zyklusanzeige                  | 6 Holzfäller: +13 Holz/min ≈ 53/min zum Verkaufspreis                                          |
| F4  | Holzschären 2  | Leuchtlinse | Badehaus-Reichweite 10 → 11 (`buildings.ts:230`)                                    | +1                                                       | Reichweitenkreis               | Fläche +20 %; spart höchstens 1 Badehaus (180/min) nach Umbau                                  |
| F5  | Holzschären 3  | Lotsenbuch  | Reichweite Fremdkontor 8 → 9 (`buildings.ts:255`); gilt in NU-2 auch an neuen Ufern | +1                                                       | Kreis auf Fremdinseln          | kein Geld; Platz auf der Fremdinsel                                                            |
| F6  | Nordgebiet 1   | Eispickel   | Werkzeugmacher-Zyklus −10 % (80 → 72)                                               | `ceil`, ≥ 1                                              | Zyklusanzeige                  | 2 Werkzeugmacher: +1,7/min ≈ 25/min                                                            |
| F7  | Nordgebiet 2   | Eiskiste    | Lagergrenze Gewürz und Nahrung 100 → 120 je Kontorlager (`goods.ts:84`)             | Grenze je Gut (Aufwand M, E-12)                          | Lageranzeige                   | Gewürzpuffer 2,1 → 2,5 min; kein Geld                                                          |
| F8  | Nordgebiet 3   | Robbenfell  | Schäferei-Zyklus −10 % (50 → 45); NU-2: Wärme-Reichweite +1 (Wert in NU-2-Spec)     | `ceil`, ≥ 1                                              | Zyklusanzeige                  | 4 Schäfereien: +5,3 Wolle/min ≈ 27/min                                                         |

- **Keine Überschneidung mit dem Rat:** Der Rat stellt an Weberei, Brennerei, Glashütte, Kapelle und Hausgrösse
  (`council.ts`), die Fundstücke nicht. Wo Ausbaustufe, Rat, Inselvorteil und Fundstück zusammenkommen, wirken sie
  multiplikativ. Das Fundstück wird aufgerundet, damit seine Wirkung höchstens 10 % beträgt. Beispiel: Holzfäller
  Stufe 3: 12 → 11 (E-14).
- **NU-2-Bezug:** nur F5 (trägt sich von selbst fort) und F8 (zweite Wirkung). Beide sind die letzten Stücke ihrer
  Gebietsliste und damit die schwersten. Die Spec NU-2 muss also **ohne** sie aufgehen. Das trägt.
- **Satzbonus (alle 8):** nur kosmetisch: Eintrag im Ehrenbuch «Kartenrand vollständig» und Schaukasten im Kartenhaus,
  ohne Zahl (E-11).
- **Nutzen:** Ohne Umbau sind es typisch ≈ 105/min (F3 + F6 + F8 zum Verkaufspreis, Annahme zur Gebäudezahl), mit Umbau
  (F1 spart ein Schiff, F4 ein Badehaus) höchstens ≈ 375/min. Über 30 min ergibt das 3150 typisch und ≤ 11 250 oben.
  Später gefundene Stücke bringen anteilig weniger.

## 5 Bilanz (e)

**Kosten je Fahrt** zu Listenpreisen (`goods.ts`: Holz 10, Werkzeug 40, Stoff 30, Rum 40, Glas 50, Nahrung 8). Es
zählt der Mittelwert der Pool-Karten. Schiffsunterhalt 15 je 100 T.

| Gebiet      | R-Weg Ware + Proviant | S-Weg Ware + Proviant (+ Umweg-Zeit Ø) | Schiff R / S |
| ----------- | --------------------- | -------------------------------------- | ------------ |
| Wrackfeld   | 715 + 96 = **811**    | 154 + 96 = **250** (+300 T)            | 270 / 315    |
| Holzschären | 1260 + 120 = **1380** | 330 + 120 = **450** (+360 T)           | 315 / 369    |
| Nordgebiet  | 948 + 168 = **1116**  | 312 + 168 = **480** (+360 T)           | 405 / 459    |
| **Summe 3** | 3307 + 990 = **4297** | 1180 + 1143 = **2323**                 |              |

Zu Eigenkosten (Werkzeug 21,5, Glas 29, Rum 15, Stoff 12,5, Holz 1,5, Nahrung 2; I-144, Rückfracht §3) kostet der
R-Weg ≈ 1465 Ware. Ein Fundstück kostet also ≈ 200–300 Ware mehr als die sichere Wahl.

**Entgangene Routenfahrt (Flotte 4):** `K = T_e × 0,15 + Lücke × q × (buy − c)`, mit `Lücke = T_e + 20·d − B/q`,
Lager B, Verbrauch q je T.

- Freies oder viertes Schiff: nur Unterhalt (270–405), beim Neukauf + 1850 (`sea.ts:6`).
- Handelsroute mit 48/min (q 0,08), B 100, d 35, Ersatz Glas 50 − 29: Wrackfeld Lücke 1250 T → 2100, Nordgebiet 2150 T
  → 3600.
- Einziges Gewürzschiff: §6.
- In NU-1 ist ausser Gewürz keine Route Pflicht. Mit Flotte 4 bleiben 2–3 Plätze, also ist das freie Schiff der Normalfall.

**30 min NU-1:** Kartenhaus 2700 + Unterhalt 3600 + Fahrten 2323–4297 = **8620–10 600**, Nutzen 0 (sicher) bzw. ≈ 2600
(riskant, Ø 6,7 Stücke). Netto −8600 bis −8000: kein Geldlohn, keine Spirale, keine Pleite. Auf dem Zukaufpfad
(1450/min) sind das 20–24 % des Überschusses.

**Alle 3 Gebiete aufdecken:**

- **Sicher:** immer 3 Fahrten, 0 Stücke, ≈ 12,7 min Schiffszeit.
- **Riskant:** 3 Fahrten ergeben im Erwartungswert ≈ 6,7 von 8 Stücken (1,67 + 2,6 + 2,4).
- **Alle 8:** 4–6 Fahrten. Weil die Kartenfolge fest ist, lässt sich ein Gebiet vorab erkunden. Das kostet z. B. im
  Nordgebiet 2400 T + 18 Nahrung je Fehlversuch.

**Bilanz je Einwohner und 100 T** (Endzustand 80 K + 15 B = 95 E; Kartenhaus 20 ÷ 95 = 0,21; Fahrten über 30 min =
180 Intervalle: R 4297 ÷ 180 ÷ 95 = 0,25, S 0,14; Funde R +0,15):

| Stufe / Pfad (I-144)        | ohne NU-1 | NU-1 sicher | NU-1 riskant |
| --------------------------- | --------- | ----------- | ------------ |
| Kaufmann, alles gebaut      | 10,5      | **10,15**   | **10,19**    |
| Kaufmann, Rum + Gewürz fest | 2,7       | **2,35**    | **2,39**     |
| Bürger, alles gebaut        | 6,8       | **6,45**    | **6,49**     |
| Bürger, Rum fest            | 1,8       | **1,45**    | **1,49**     |
| Pioniere/Siedler (falls da) | –         | −0,35       | −0,31        |

Beide Wege liegen in Geld fast gleich. Die Wahl fällt also über Ladung, Zeit und Fundstück, nicht über Geld. Es gibt
zwei lohnende Pfade, dazu die Reihenfolge: Wer mit dem Wrackfeld beginnt, bekommt die Kompassrose früh und kann damit
ein Gewürzschiff freispielen.

## 6 Randfälle (f)

| Fall                           | Zahl                                                                                                                                                                                                                       | Regel / Gegenmittel                                                                                                                                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Heimatlager leer beim Packen   | Geladen wird höchstens der Bestand. Unter 3 Nahrung: kein Start. 10 Nahrung reichen für 3 von 4 Abschnitten im Wrackfeld, dann Umkehr nach 900 + 600 T                                                                     | Warnung «reicht für s von k». Packen entzieht 21 Nahrung ≈ 4 s Verbrauch (285/min), 30 Rum ≈ 16 s, 18 Glas ≈ 22 s: harmlos                                                                                                                         |
| Rückkehr, Route ist weg        | Für den Start muss das Schiff frei sein, die Route ist also vorher aufgelöst                                                                                                                                               | Route merken und nach der Rückkehr mit `validRoute` wieder setzen, sonst Meldung (E-07)                                                                                                                                                            |
| Überlauf bei Heimkehr          | z. B. 18 Holz an Bord, Lager 95/100 → 13 verfallen                                                                                                                                                                         | wie `unloadAtHome` (`ships.ts:189`) mit Meldung; Vorwarnung 300 T vorher (E-08)                                                                                                                                                                    |
| Speichern unterwegs            | Zustand: Schiff, Gebiet, Abschnitt, Rest-Ticks, Zusatzabschnitte, offene Karte (Index), Funde der Fahrt; Kartenfolge aus Seed ableitbar                                                                                    | Save +1; Migration mit Vorgabe «keine Expedition, Nebel, 0 Funde»; ungültiger Stand → Abweisung mit Hinweis, Test                                                                                                                                  |
| Krise (Sturm, Brand) unterwegs | feste Ticks, eigener Strom; Kartenhaus brennt nicht                                                                                                                                                                        | keine Wirkung; die Krisenfolge bleibt bitgleich (`CRISIS_SALT` getrennt)                                                                                                                                                                           |
| Kartenhaus abgerissen          | während der Fahrt                                                                                                                                                                                                          | gesperrt: `fail('Erst Expedition beenden')`, analog Fremdkontor (`build.ts:83`). Danach erlaubt: Erstattung 50 % (750/15/7/10, `economy.ts:45`), Funde bleiben                                                                                     |
| Gewürzstadt kippt              | 1 Gewürzschiff (d ≤ 31): Lager 100 ÷ 8 je 100 T = 1250 T. Lücke = T_e − 750 → 1050/1350/1950 T. Pro Haus −1 E je 50 T → 80 K → 4 K. Steuerverlust ≈ 22 000 (Wrackfeld) bis 37 400 (Nord). `wonSpice` bleibt (`tick.ts:17`) | Warnung beim Start: «einzige Gewürzroute: Lager reicht 2,1 min, Fahrt 3,0 min». Auswege: viertes Schiff (1850) oder Zukauf 40/Stück (Nord: 156 Stück = 6240). Mit 2 Gewürzschiffen (d ≥ 32) gefahrlos: Defizit ≤ 5/min, Lager hält ≥ 19 min (E-06) |
| Wahl nie getroffen             | Schiff wartet; 90/min Unterhalt (10 min = 900); keine weitere Expedition                                                                                                                                                   | Erinnerung nach 3000 T, keine Auto-Wahl (E-05)                                                                                                                                                                                                     |

## 7 Entartete Strategien (g)

| Strategie                | Zahl                                                                                              | Gegenmittel / Urteil                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Immer sicher             | 2323 statt 4297, 0 Stücke                                                                         | gültig, nicht dominant: Die Stücke eines Gebiets sind nach dem Aufdecken verloren (8 Dauerwirkungen) |
| Immer alles einpacken    | Bedarf 57/63/61 > 50                                                                              | Überpacken ist gratis und gewollt; die Wahl liegt in der Zusammensetzung                             |
| Expedition als Parkplatz | ≤ 50 Einheiten ausserhalb `STORAGE_CAP` (`goods.ts:84`), einmalig; Überlauf verfällt bei Heimkehr | harmlos: kein Geld, 90/min Unterhalt, blockiert NU-1                                                 |
| Fundstück-Stapeln        | 8 Einzelstücke, 8 getrennte Felder, kein Ratsfeld                                                 | Ende nach dem dritten Gebiet; Satzbonus ohne Zahl                                                    |
| Umkehr-Farm              | Funde nur bei Ankunft (E-02)                                                                      | absichtliches Scheitern bringt nichts                                                                |
| Neu würfeln durch Umkehr | Kartenfolge je Gebiet fest (E-03)                                                                 | Erkunden ist erlaubt, kostet aber eine Fahrt                                                         |

## 8 Wertetabelle (h)

| Def-Datei             | Feld                                            | Wert                                                                  | Herkunft                                 |
| --------------------- | ----------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------- |
| `buildings.ts`        | `maphouse` (§1)                                 | 2×2, `cost(1500,30,15,20)`, upkeep 20                                 | gerechnet; Muster `buildings.ts:284–296` |
| `unlocks.ts`          | `U7` Auslöser `wonSpice`                        | `['maphouse']`, `['expedition']`                                      | R962 F1; Muster `unlocks.ts:74–83`       |
| `expedition.ts` (neu) | `SECTION_TICKS`                                 | 300                                                                   | gerechnet (Ziel 3–5 min)                 |
| `expedition.ts`       | `HOME_TICKS`                                    | 600                                                                   | gerechnet                                |
| `expedition.ts`       | `PROVISION`                                     | `{ good: 'food', perSection: 3 }`                                     | gerechnet; `goods.ts:22`                 |
| `expedition.ts`       | `DETOUR_SECTIONS`                               | 2                                                                     | gerechnet (§3 Hierarchie)                |
| `expedition.ts`       | `REMIND_TICKS`                                  | 3000                                                                  | Annahme (= `EDICT_LOCK`, `timing.ts:66`) |
| `expedition.ts`       | `EXPEDITION_SALT`                               | `0xc2b2ae35`                                                          | Annahme (frei laut `rg`)                 |
| `expedition.ts`       | `AREAS[]` sections / cardsAfter / hints         | 4/[2,4]/Holz,Werkzeug · 5/[2,4,5]/Rum,Glas · 7/[3,5,7]/Werkzeug,Stoff | gerechnet §2                             |
| `expedition.ts`       | `CARDS[]`                                       | Tabellen §3                                                           | gerechnet                                |
| `expedition.ts`       | `FINDS[]` Reihenfolge je Gebiet                 | F1–F2 · F3–F5 · F6–F8                                                 | gerechnet §4                             |
| `sea.ts`              | `FIND_LANE_PCT`                                 | 90                                                                    | `sea.ts:94` (10 T je Kachel)             |
| `sea.ts`              | `ROUTE_GOODS_PER_DIRECTION` mit F2              | 3                                                                     | `sea.ts:11` (2)                          |
| `buildings.ts`        | Fund-Zyklus Holzfäller/Werkzeugmacher/Schäferei | ×90 %, aufgerundet: 27 / 72 / 45                                      | `buildings.ts:95,178,122`                |
| `buildings.ts`        | Fund-Reichweite Badehaus / Fremdkontor          | 11 / 9                                                                | `buildings.ts:230,255`                   |
| `goods.ts`            | Fund-Lagergrenze Gewürz, Nahrung                | 120                                                                   | `goods.ts:84` (100)                      |
| unverändert           | `SHIP_MAX`, `SHIP.capacity`, `SHIP.upkeep`      | 4, 50, 15                                                             | `sea.ts:4,8,7`; R962                     |

## 9 Entwürfe an L0 und Sichtung `lead-design`

Sichtung 2026-10-26 (`lead-design`, Vorschlag an L0, Bestätigung im Gate Spec). Die Spec setzt die Spalte «Sichtung» um;
Zahlen in [Anhang 02](anhang-02-def-werte.md).

| Nr.  | Entwurf (Kurzform)                                         | Sichtung   | Begründung bzw. Anpassung                                                                                                                        |
| ---- | ---------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| E-01 | Umweg U immer offen, +2 Abschnitte (6 Nahrung, 600 T)      | übernehmen | Keine Sackgasse; U ist eine Regel für jede Karte, keine Def-Option.                                                                              |
| E-02 | Fundstücke erst bei geschaffter Fahrt, Umkehr bringt keins | übernehmen | Deckt R962 F4 «Umkehr ohne Lohn» und schliesst die Umkehr-Farm; ersetzt die alte Spec-Regel «gewonnene Stücke bleiben».                          |
| E-03 | Kartenfolge fest je Seed und Gebiet                        | anpassen   | Folge beim Start gezogen und als Ergebnis in `expedition.cards` gespeichert; der Zähler `expeditionCount` entfällt (ohne Leser, YAGNI).          |
| E-04 | Fundstück nach Gebietsliste statt je Karte                 | übernehmen | Eine geschaffte Fahrt mit k R-Wahlen bringt die ersten k Stücke der Gebietsliste; Kartenausschluss und Sperre «Schon in der Sammlung» entfallen. |
| E-05 | Warten unbegrenzt, keine Zehrung, Erinnerung nach 3000 T   | übernehmen | Erinnerung einmal je offener Karte als Meldung; keine Auto-Wahl.                                                                                 |
| E-06 | Einziges Gewürzschiff: Warnung statt Sperre                | anpassen   | Warnung mit Zahlen (Lager reicht m:ss, Fahrt m:ss) nur, wenn kein anderes Schiff eine Route mit Gewürz fährt; Auslaufen bleibt möglich.          |
| E-07 | Route merken und nach Rückkehr fortsetzen                  | anpassen   | Aufgegangen in R970 E1 (Wartezustand `boarding`, Route bleibt am Schiff); «Start nur mit freiem Schiff» aus §2 entfällt.                         |
| E-08 | Überlauf bei Heimkehr verfällt, Vorwarnung 300 T vorher    | übernehmen | Wie R970 E4; Vorwarnung nur, wenn Restladung und Lager zusammen über der Grenze liegen.                                                          |
| E-09 | Kartenhaus-Abriss während der Expedition sperren           | übernehmen | In jeder Phase «Erst Expedition beenden» (wie Fremdkontor); ersetzt die alte Spec-Regel «Fahrt läuft zu Ende».                                   |
| E-10 | Knopf «Umkehren» (freiwillig, ohne Lohn)                   | anpassen   | Nur bei offener Karte als zusätzliche Wahl; wirkt wie die Proviant-Umkehr (Heimfahrt nach §2, keine Funde, Gebiet bleibt Nebel).                 |
| E-11 | Satzbonus nur kosmetisch                                   | anpassen   | Nur Chronik-Meldung «Kartenrand vollständig» und Zeile in der Fundstück-Liste; kein Ehrenbuch, kein Schaukasten (Spec §2, kein Art-Zusatz).      |
| E-12 | «Eiskiste» braucht Lagergrenze je Gut (Aufwand M)          | übernehmen | Bleibt (einziges Lager-Stück, Abwechslung); hält der Plan den Aufwand für zu gross, folgt ein Spec-Nachtrag mit Ersatz, kein stiller Tausch.     |
| E-13 | Proviant nur Nahrung                                       | übernehmen | Ein Proviant-Gut, eine Prüfung; 3 je Abschnitt.                                                                                                  |
| E-14 | Fundstück-Zyklen aufrunden (Wirkung ≤ 10 %)                | übernehmen | `ceil(z × 90 / 100)`, mindestens 1, Fundstück als letzter Faktor; Prüfwert Holzfäller Stufe 3: 12 → 11.                                          |

Landnahme-Leiter 1,0/1,6 gilt erst in NU-2 und ist hier nicht gerechnet.
