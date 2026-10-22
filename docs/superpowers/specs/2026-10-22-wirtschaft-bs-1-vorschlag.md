# WIRTSCHAFT-BS-1 · Designvorschlag: Rückfracht, Handelstreue, Seerecht

Stand 2026-10-22 · Paket WIRTSCHAFT-BS-1 · `lead-design` (opus) · Anlass R797, R804 · Ideentexte I-151, I-153, I-154 auf
Branch `docs/ideen-14` (`docs/ideen.md`). Kein Spec mit AK, kein Code, keine Testläufe. Alle Zahlen sind Rechnung aus
`src/sim/defs/` (Stand `main` @ `000cc9ea`, Save v18); Schätzungen sind als **(Schätzung)** markiert.

## 0 Kurzurteil und Rangfolge

| Rang | Idee                           | Urteil                    | Kern der Dominanz-Rechnung                                                                                              | Grösse | Save                                | Baseline |
| ---- | ------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------- | -------- |
| 1    | I-153 Rat «Seerecht»           | **bauen, mit Änderungen** | spart 0 bis 1 Schiff je Route und hebt den Flottendeckel; Glasrecht 0 bis 3 Hütten; jede Karte hat Gewinn- und Nulllage | S–M    | kein neues Feld, Wertebereich `'C'` | nein     |
| 2    | I-154 Rückfracht auf der Route | **verwerfen (Doppelung)** | gibt es seit M12: Route trägt je Richtung bis 2 Güter, Routen-Bilanz zählt beide Richtungen                             | –      | –                                   | –        |
| 3    | I-151 Auflage «Handelstreue»   | **verwerfen**             | trivial: Bedarf 40 bis 280 Einheiten in 15 min, Lager 100, Zukauf zum Festpreis; Freikauf kostet ≤ 736 Geld             | –      | –                                   | –        |

Rangfolge nach Spielwert je Aufwand: Nur I-153 trägt eine echte Wahl. I-154 steht vor I-151, weil der Befund
(«schon da») dem Spieler über die Anzeige noch nützen kann (Abschnitt 3.4, optional, kein Paket).

## 1 Massstab der Dominanz-Rechnung

Eine Option bleibt eine Spielerwahl, wenn drei Bedingungen gelten (R670/N-101, I-112 Anhang 01 §4, I-132 Anhang 01 §0):

1. **Kein Pflichtzug:** Es gibt eine plausible Lage, in der eine andere Option mehr bringt.
2. **Nicht wirkungslos:** Es gibt eine plausible Lage, in der die Option einen Unterschied macht, gezählt in Gebäuden,
   Schiffen oder Fläche, nicht in Geld (ab Stufe 4 ist Geld Überschuss: Kasse im Referenzlauf 2454 → 48 675 in 9000
   Ticks, I-132 Anhang 01 §1).
3. **Tragender Engpass ist nicht Geld:** Lässt sich eine Bedingung mit Geld erfüllen, ist sie im Spätspiel trivial
   (I-132: «Genügsam» gestrichen, «Engpass wäre Geld»).

Für Auflagen kommt hinzu: Der Bedarf über die Laufzeit muss die Lagergrenze (`STORAGE_CAP` 100 je Gut und Insel)
deutlich übersteigen, sonst löst ein voller Vorrat die Auflage ohne Entscheidung.

## 2 I-153 Rat «Seerecht» als dritte Karte auf Stufe 4

### 2.1 Spielerwirkung und Einbettung

«Auf Stufe 4 wählt der Spieler zwischen Glasrecht (Kette), Hofrecht (Platz) und Seerecht (Flotte).» Der Rat hat heute
keinen Beschluss für den Fernhandel (README «Rat»); auf Stufe 4 ist der Fernhandel aber Pflicht (Gewürz nur per Schiff,
`needs.spice` 0,1). Seerecht ist die einzige Karte, die mit der Zahl der Inseln und der Länge der Seewege skaliert.

Regel (Vorschlag): Alle Schiffe brauchen 8 statt 10 Ticks je Seekachel (`SHIP_TICKS_PER_SEA_TILE` 10 → 8, als
Rats-Hebel, die Def bleibt). Beim Beschluss wird die Restfahrzeit aller fahrenden Schiffe mit `ceil(left × 8 / 10)`
umgerechnet, damit Sim, Darstellung und Save nie zwei Fahrzeiten kennen (Abschnitt 2.5).

### 2.2 Dominanz-Rechnung

Rechnung von `lead-design` und unabhängig nachgerechnet von `design-economy-designer` (gleiche Zahlen). Grundlagen:
Strecke `laneTicks` = 10 × d (`islands.ts:73`), das Schiff legt im Ankunfts-Tick wieder ab (`ships.ts`), Umlauf 20 × d,
mit Seerecht 16 × d. Kapazität 50 je Richtung; fährt Gewürz allein in seiner Richtung, kommen 50 je Umlauf heim.
Bedarf 0,1 Gewürz je Kaufmann und 100 Ticks (`tiers.ts`). Schiff als Geld 1200 + 25 × 10 + 10 × 40 = 1850, Unterhalt 15;
Glashütte 890, Unterhalt 25 (I-112 Anhang 01 §3).

**a) Durchsatz je Schiff (Gewürz je 100 Ticks) und Schiffe für eine Gewürzroute** (`ceil(N × 0,1 ÷ (5000 ÷ 20d))`):

| d   | Umlauf ohne/mit | je Schiff ohne/mit | N 60 | N 80 | N 100 | N 120 | N 150 |
| --- | --------------- | ------------------ | ---- | ---- | ----- | ----- | ----- |
| 25  | 500/400         | 10,0/12,5          | 1/1  | 1/1  | 1/1   | 2/1   | 2/2   |
| 30  | 600/480         | 8,33/10,42         | 1/1  | 1/1  | 2/1   | 2/2   | 2/2   |
| 35  | 700/560         | 7,14/8,93          | 1/1  | 2/1  | 2/2   | 2/2   | 3/2   |
| 40  | 800/640         | 6,25/7,81          | 1/1  | 2/2  | 2/2   | 2/2   | 3/2   |

Gesichert sind 2/3/6 Plantagenplätze auf Möweninsel/Felsbucht/Weidenau (`sea.ts`), bei Takt 50 also 4/6/12 Gewürz je
100 Ticks. Ab 80 Kaufleuten trägt sicher nur Weidenau (d 30 bis 35) allein: **80 Kaufleute bei d 35 ist die typische
Gewürzstadt-Lage, dort spart Seerecht ein Schiff.** Bei zwei Gewürzinseln mit je einer Route spart Seerecht bis N 120
nichts, bei N 150 mit d 35 oder 40 ein Schiff je Route.

**b) Die drei Karten nebeneinander** (eine Gewürzinsel, Glas selbst hergestellt):

| N   | Glasrecht: Hütten gespart | Hofrecht: Häuser gespart / Einwohner mehr | Seerecht: Schiffe gespart bei d 25/30/35/40 |
| --- | ------------------------- | ----------------------------------------- | ------------------------------------------- |
| 60  | 1                         | 0 / +6                                    | 0/0/0/0                                     |
| 80  | 1                         | 0 / +8                                    | 0/0/1/0                                     |
| 100 | 2                         | 0 / +10                                   | 0/1/0/0                                     |
| 120 | 2                         | 0 / +12                                   | 1/0/0/0                                     |
| 150 | 3                         | 1 / +14                                   | 0/0/1/1                                     |

**c) Weitere Wirkungsfelder von Seerecht**

- **Flottendeckel `SHIP_MAX` = 4:** Vier Schiffe bei d 30 schaffen 33,3 Einheiten je 100 Ticks, mit Seerecht 41,7, also
  5 Schiff-Äquivalente. Beispiel N 150, d 35: ohne Seerecht 3 Gewürzschiffe + 1 für Fernaufträge = Deckel voll; mit
  Seerecht 2 + 1, ein Schiff frei. Zwei Gewürzinseln (d 35/40) bei N 150: ohne 4 Schiffe (kein Fernauftrag mehr), mit 2.
  **Das ist die Ersparnis, die kein Geld nachkauft:** Eine Hütte baut man mit Überschuss nach, ein fünftes Schiff nicht.
- **Inselvorteil:** Steht die Glashütte auf der Felsbucht (Gebirge+, Takt halbiert, Reihenfolge Beschluss vor Vorteil,
  R711 R-3), spart Glasrecht bei N 80 keine Hütte (2/2) **(Schätzung, Rundung nicht geprüft)**; Seerecht spart dort bei
  d 35 eines.
- **Fernauftrag** (Frist 1700): Hinfahrt 250 bis 400 Ticks, mit Seerecht 200 bis 320; schlimmster Fall mit Rückruf von
  einer Route etwa 1200 gegen 960 Ticks, beides unter der Frist. Wirkung klein.
- **Rückfracht:** Die Gegenrichtung wird mit schneller; nur Kleingeld (d 30, 50 Stoff zur Möweninsel: +32 je 100 Ticks).

**d) Wertprüfung:** 10 → 9 wäre wirkungslos (7,94 je Schiff bei d 35 reicht für N 80 nicht, Ersparnis nur bei 150/d 35).
10 → 6 (+67 % wie Glasrecht) spart in fast jeder Zelle ein Schiff und hebt den Deckel auf fast 7 Schiffe: verdrängt
Glasrecht und Hofrecht. **10 → 8 bleibt.**

### 2.3 Urteil

| Karte     | gewinnt in der Lage                                               | bringt 0 in der Lage                                |
| --------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| Glasrecht | Zielphase 60 bis 120 mit eigener Glashütte (1 bis 2 Hütten)       | Glas zugekauft, N ≤ 40, Glashütte auf der Felsbucht |
| Hofrecht  | Bauplatz knapp und Kettenware zugekauft                           | an den Zielen 60 und 80 (gleiche Hauszahl)          |
| Seerecht  | Flottendeckel (N ≥ 150 oder drei Routen), Gewürzstadt 80 bei d 35 | N ≤ 60, zwei nahe Gewürzinseln bis N 120            |

**Keine strikte Dominanz, kein Pflichtzug, nicht wirkungslos.** Anders als das Darlehen (früh Pflicht, später
wirkungslos) wird Seerecht mit wachsendem Reich wertvoller. **Schwäche, offen benannt:** In Gebäuden gezählt ist
Glasrecht in jeder Zelle der Tabelle b mindestens gleich gut; Seerecht gewinnt nur über den Deckel, den Inselvorteil und
die 80/d 35-Lage. Es ist eine Karte für Fernplaner, wie Hofrecht eine für Platzplaner ist. Hofrecht wird nicht toter: Seine
Lage «Platz knapp, Ware zugekauft» deckt keine andere Karte ab.

### 2.4 Empfehlung: bauen, mit drei Änderungen gegenüber dem Ideentext

1. **Laufende Fahrten umrechnen** statt «gilt ab der nächsten Abfahrt»: Das Schiff speichert nur `left`, die Darstellung
   rechnet `t = 1 − left / laneTicks` (`src/render/shipLane.ts:89`). Ohne Umrechnung springt ein fahrendes Schiff nach dem
   Beschluss auf der Linie.
2. **Ein Lese-Helfer für die Fahrzeit** mit Welt-Bezug (wie `councilCycle`), den alle Leser nutzen: `ships.ts:144`,
   `routeBalance.ts:60`, `render/shipLane.ts:28`, `ui/islandCard.ts:75`, `ui/homeTravel.ts:35` und die I-155-Marke
   («Zu spät», UI-HAEPPCHEN-G, Formel aus I-136). Die Save-Prüfung (`save.ts:714`) behält die volle Fahrzeit als Obergrenze.
3. **Kartentext mit Zahl** wie bei den anderen Beschlüssen (I-112 Randfall 2): «Schiffe 25 % schneller. Spart ab etwa
   80 Kaufleuten ein Schiff auf langen Gewürzrouten.»

### 2.5 Grösse und Risiken

- **Grösse S–M** (Ideentext: S): Sim (Hebel-Art `shipSpeed`, Helfer, Umrechnung beim Beschluss), Save-Prüfung, Rats-Karte
  mit drei Karten auf Stufe 4 und «die anderen Beschlüsse verfallen», fünf Lesestellen, README und `docs/spielwerte.md`.
  Etwa 1 Plan, 5 bis 6 Tasks, Stufe voll wegen neuem Spielwert **(Schätzung)**.
- **Save:** kein neues Feld. `CouncilSide` bekommt `'C'`, `isValidCouncil` (`save.ts:937`) und `isSide`
  (`council.ts:69`) erlauben es. Alte Stände laden unverändert, keine Migration. Ob der erweiterte Wertebereich eine
  Versionsnummer braucht, entscheidet `lead-tech` im Plan; wenn ja, nie eine eigene Nummer neben Stadtplanung (v19 =
  main + 1): I-153 kommt nach Stadtplanung und nimmt die nächste freie Nummer, oder fährt bei Erweiterung 1 mit (deren
  Save = main + 1 beim Merge, state.md Punkt 7).
- **Baseline:** keine Änderung. Der Controller beschliesst nie (`balance.test.ts`, `expectNoDecree`), `council[4]` bleibt
  `'open'`. Seerecht bekommt wie die anderen Beschlüsse einen eigenen Szenariotest (I-112 Ruling-Muster).
- **Risiko Asymmetrie:** Stufe 2 und 3 zeigen zwei Karten, Stufe 4 drei. Die Karte muss eine dritte Spalte tragen
  (`src/ui/council.ts:34` fest `['A', 'B']`). Gewollt: Stufe 4 ist die Stufe mit Fernhandel.
- **Risiko Hofrecht:** Die schwächste Karte (I-112 §9: «nur Kleingeld, Platz-Wahl») bekommt einen weiteren Konkurrenten.
  Abschnitt 2.3 nennt ihre verbleibende Gewinnlage.
- **Risiko Erweiterung 1:** Mehr Inseln oder längere Seewege machen Seerecht stärker. Der Wert gehört in die
  Balancing-Prüfung von Erweiterung 1 (Ruling-Entwurf R-3).
- **Reihenfolge:** nach UI-HAEPPCHEN-G (I-155 nutzt die Fahrzeit-Formel) und nach Stadtplanung (Save).

## 3 I-154 Rückfracht auf der Route

### 3.1 Befund: Die Mechanik gibt es schon

Der Ideentext nimmt an, die Route fahre nur Hinfracht und die Routen-Bilanz zähle nur sie. Beides stimmt nicht:

- `Route` hat `ab` und `ba`, je bis `ROUTE_GOODS_PER_DIRECTION` = 2 Güter (`src/sim/types.ts:280`, `defs/sea.ts`);
  `handleDocked` entlädt und lädt an beiden Enden (`src/sim/ships.ts`, `load`, `unload`).
- Die Routen-Bilanz summiert beide Richtungen: `directionValue(route.ab, …) + directionValue(route.ba, …)`
  (`src/sim/routeBalance.ts:61-63`).
- Das Schiff-Panel bietet nach dem ersten Klick «Holen (Insel → hier)» und «Bringen (hier → Insel)» an
  (`src/ui/ships.ts:355-356`), die Routenzeile zeigt beide Richtungen mit Pfeilen («Gewürz →, ← Werkzeug»).

### 3.2 Routenmodell: verträgt es ein zweites Gut?

Ja, schon heute: bis 2 Güter je Richtung, 4 je Route, kein Gut in beiden Richtungen (`validRoute`). Ein drittes Gut je
Richtung würde die Kapazität 50 weiter teilen (`load` gibt jedem Gut `⌊frei/k⌋`) und bringt keine neue Entscheidung.

### 3.3 Dominanz-Rechnung

Entfällt als Wahl: Die Rückfracht kostet nichts (gleicher Umlauf, gleicher Unterhalt 15), sie ist eine reine
Ladungsoption. Ihr Wert steht schon in der Bilanz. Beispiel Heimat ⇄ Felsbucht (d 35, Umlauf 700 Ticks): Gewürz heim
und 25 Werkzeug hin; Werkzeug zählt mit `min(25, Überschuss) × 15` je Umlauf, also bis +54 je 100 Ticks
(`25 × 15 × 100 ÷ 700`).

### 3.4 Empfehlung: verwerfen (Doppelung), optional ein Anzeige-Häppchen

Verwerfen und ins Archiv mit Verweis auf M12. Die Fehlannahme des Scouts zeigt eine Entdeckbarkeitslücke: Wer eine Route
mit nur einer Richtung anlegt, sieht nicht, dass das Schiff leer zurückfährt. Optional für ein späteres UI-Häppchen
(kein Save, kein Spielwert): Die Routenzeile nennt «zurück leer», wenn eine Richtung keine Güter hat. Kein eigenes Paket.

## 4 I-151 Auflage «Handelstreue» (zweite Meisterprüfung)

### 4.1 Spielerwirkung und Einbettung

«Der Spieler hält einen Stammkunden-Vertrag 8 Lieferungen in Folge ohne verbrauchte Kulanz.» Lohn ehrenhalber (R670),
also nie Pflichtzug. Die Frage ist allein, ob die Auflage eine Entscheidung verlangt oder trivial ist.

### 4.2 Dominanz-Rechnung

Vertrag rechnet je `ORDER_PERIOD` = 900 Ticks ab; 8 Lieferungen = 7200 Ticks, die Auflagen-Laufzeit 9000 Ticks hätte
10 Abrechnungen. Vertragsmengen und Freikauf (Zukauf zum Festpreis, `BUY_RISE` 0; Vertragspreis `floor(buy × 0,68)`):

| Gut     | Menge je Periode | 8 Lieferungen | Lager 100 deckt | Freikauf je Periode `(buy − Preis) × Menge` | Freikauf 8 Perioden |
| ------- | ---------------- | ------------- | --------------- | ------------------------------------------- | ------------------- |
| Glas    | 4                | 32            | ja              | (50 − 34) × 4 = 64                          | 512                 |
| Rum     | 5                | 40            | ja              | (40 − 27) × 5 = 65                          | 520                 |
| Stoff   | 7                | 56            | ja              | (30 − 20) × 7 = 70                          | 560                 |
| Stein   | 14               | 112           | knapp           | (15 − 10) × 14 = 70                         | 560                 |
| Wolle   | 17               | 136           | nein            | (12 − 8) × 17 = 68                          | 544                 |
| Holz    | 23               | 184           | nein            | (10 − 6) × 23 = 92                          | 736                 |
| Nahrung | 28               | 224           | nein            | (8 − 5) × 28 = 84                           | 672                 |

Zuckerrohr wie Wolle. Der teuerste Freikauf (Holz, 736) ist weniger als zwei Prozent der Kasseneinnahmen über dieselbe
Zeit (Referenz +46 000 in 9000 Ticks). Für die Konsumgüter der Stufen 2 bis 4 reicht ein voller Vorrat vor dem Start.

### 4.3 Urteil

Schaffbar ja, trivial **ja**, tragender Engpass **Geld oder Vorrat**: dieselbe Lage wie «Genügsam» (I-132, gestrichen).
Geprüfte Änderungen helfen nicht:

- **Mit Zukauf-Sperre fürs Vertragsgut:** Glas, Rum, Stoff bleiben per Vorrat trivial (40 bis 70 < 100); Holz und Nahrung
  verlangen 1 zusätzlichen Betrieb (Takt 50 = 2 je 100 Ticks, Fehlmenge `(280 − 100) ÷ 90` ≈ 2 je 100 Ticks).
- **Mit Vertragsmenge ×3:** wird ein Bauauftrag «eine Hütte mehr», keine Entscheidung.
- **Als «Fernhandel» (3 Fernaufträge in 15 min):** Fernmengen 12 bis 20, höchstens 5 Fernaufträge in 10 Perioden
  (`farSkip`); 60 Stoff auf der Möweninsel deckt drei Lieferungen aus dem Vorrat, Zukauf am Fremdkontor ebenfalls.

### 4.4 Empfehlung: verwerfen

Ins Archiv mit diesem Urteil. Eine zweite Meisterprüfung braucht einen Bedarf weit über der Lagergrenze und einen
gesperrten Geld-Ausweg; Handel liefert beides nicht, weil Handelsmengen klein und kaufbar sind. Als Kriterium für künftige
Auflagen-Ideen festhalten (Ruling-Entwurf R-4).

## 5 Save und Baseline im Überblick

| Idee  | Save gegen Stadtplanung (v19 = main + 1)                       | Save gegen Erweiterung 1 (main + 1 beim Merge) | Baseline (`balance.test.ts`) |
| ----- | -------------------------------------------------------------- | ---------------------------------------------- | ---------------------------- |
| I-153 | kein Feld; falls Nummer nötig: nach Stadtplanung, nie parallel | Wert in deren Balancing prüfen                 | unverändert                  |
| I-154 | –                                                              | –                                              | –                            |
| I-151 | –                                                              | –                                              | –                            |

## 6 Ruling-Entwürfe für L0 (nicht in `rulings.md` geschrieben)

- **R-1:** I-153 «Seerecht» als dritte Karte auf Stufe 4 angenommen (Schiffe 8 statt 10 Ticks je Seekachel, laufende
  Fahrten umgerechnet, ein Fahrzeit-Helfer für alle Leser). Neue Spec Stufe voll durch `lead-design` (opus), Werte nach
  Abschnitt 2.2; Umsetzung nach UI-HAEPPCHEN-G und Stadtplanung. Kosten bei Irrtum: eine Ratskarte, die zurückgebaut
  werden muss (Save-Wert `'C'` dann migrieren).
- **R-2:** I-154 verworfen als Doppelung (Rückfracht seit M12: `Route.ab/ba`, `routeBalance` beide Richtungen); ins
  Archiv. Optional «zurück leer» in der Routenzeile als Beipack-Kandidat für ein UI-Häppchen. Kosten bei Irrtum: keine.
- **R-3:** Seerecht-Wert (8 Ticks je Kachel) wird in der Balancing-Prüfung von Erweiterung 1 mitgeprüft, weil mehr
  Inseln die Karte stärken. Kosten bei Irrtum: eine dominante Karte in Erweiterung 1.
- **R-4:** I-151 verworfen (trivial: Vorrat oder Freikauf ≤ 736 Geld). Kriterium für Auflagen-Ideen: Bedarf über die
  Laufzeit weit über `STORAGE_CAP` und kein Geld-Ausweg, sonst «trivial» (I-132 Anhang 01 §0). Kosten bei Irrtum: eine
  verworfene Ehren-Auflage, Wiederaufnahme ohne Neuarbeit.

## 7 Selbstprüfung Gate Brainstorming

1. **Säulen:** Seerecht stärkt «Wirtschaft über Handel» und gibt dem Rat erstmals eine Flotten-Weiche; misslingt sie, leidet
   die Wahl auf Stufe 4 (Glasrecht oder Hofrecht verlieren an Gewicht). I-154/I-151: kein Bau, keine Säule berührt.
2. **Spielerzweck in einem Satz:** «Auf Stufe 4 entscheidest du, ob dein Reich über die Kette, den Platz oder die Flotte
   wächst.» Spürbar erst ab Stufe 4, also nach den ersten 15 Minuten; wie die übrigen Stufe-4-Karten.
3. **Scope:** nur ein Rats-Hebel; nicht dazu gehören Schiffskapazität, Schiffszahl, Fahrlinien, Handelspreise und eine
   dritte Karte auf Stufe 2 oder 3.
4. **Fremde Inhalte:** nur die Mechanik «Handelsprivileg», eigene Namen und Werte.
5. **Einfachere Variante:** Seerecht statt Hofrecht (zwei Karten bleiben) wäre in der UI kleiner, ändert aber die Bedeutung
   von `council[4] = 'B'` in laufenden Ständen und nimmt dem Spieler die Platz-Wahl. Verworfen.

Urteil: **BEDENKEN** für I-153 (bauen mit den Änderungen aus 2.4; Bedenken: in der Zielphase 60 bis 120 meist schwächer als Glasrecht, trägt vor allem in grossen Reichen und Erweiterung 1, R-3); I-154 und I-151 **ZURÜCK** (verwerfen).

## 8 Quellen

Nur Code und Studio-Dokumente: `src/sim/defs/{sea,council,goods,tiers,timing,trials,buildings}.ts`, `src/sim/ships.ts`,
`src/sim/routeBalance.ts`, `src/sim/orders.ts`, `src/sim/trial.ts`, `src/sim/save.ts`, `src/ui/ships.ts`,
`src/ui/council.ts`, `docs/superpowers/specs/2026-10-16-i112-ratsbeschluss/anhang-01-rechnung.md`,
`docs/superpowers/specs/2026-10-16-i132-meisterpruefung/anhang-01-rechnung.md`, README «Rat», «Meisterprüfung»,
«Routen-Bilanz». Keine Web-Recherche nötig.
