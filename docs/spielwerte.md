# Spielwerte und Spielregeln im Detail

Auslagerung aus dem [README](../README.md) (Abschnitte unverändert): Denkmal, Freischaltung, Wirtschaft, Bevölkerung und Krisen mit allen Zahlen. Bei Änderungen an Spielwerten hier mitführen.

## Denkmal (Wahlziel)

Nach dem Kaufleute-Ziel (60 Kaufleute) schaltet die Bauleiste unter «Öffentlich» das **Denkmal** frei. Es ist ein
**Wahlziel** ohne Lohn: Du kannst es bauen, musst es aber nicht. Es gibt nur **eines**, nur auf der **Heimatinsel**, es
ist 3 × 3 Kacheln gross, und der Bauplatz kostet **500 Geld, 10 Holz und 10 Stein**. Gebaut wird es in drei Abschnitten;
jeden startest du im Panel des Denkmals selbst, dabei zahlst du das Geld des Abschnitts:

| Abschnitt | Name                   | Geld | Stein | Werkzeug | Glas | Gewürz |
| --------- | ---------------------- | ---: | ----: | -------: | ---: | -----: |
| 1         | Sockel                 | 4000 |   200 |       80 |   60 |     40 |
| 2         | Terrassen              | 6000 |   200 |       80 |  140 |    100 |
| 3         | Schaft und Feuerschale | 8000 |   200 |       80 |  160 |    100 |

- **Lieferung:** Das Denkmal holt sich **1 Stück je Gut und Sekunde** aus dem Lager der Heimat, aber nur, was **über der
  Reserve** liegt. Die Reserve ist je Gut «mindestens 20, sonst 8 × Hausverbrauch je 100 Ticks, beim Stein mindestens der Sperrbestand der Heimat (nur mit Kontor)», damit der Bau deine
  Häuser nicht leerzieht. Der Bau braucht eine Anbindung ans Kontor.
- **Zukaufen:** Der Schalter «zukaufen» je Gut kauft fehlende Stücke zum Kontorpreis (mit Edikt Handel 20 % günstiger),
  sobald das Lager nichts über der Reserve hergibt. Das gekaufte Stück geht direkt ins Denkmal.
- **Bau anhalten:** hält die Lieferung an, ohne etwas zu verlieren.
- **Abriss:** Wer das Denkmal abreisst, bekommt nur die Hälfte des Bauplatzes zurück, **nicht** das Geld des Abschnitts
  und nicht die gelieferte Ware. Ein Neubau beginnt wieder bei Abschnitt 1; ein bereits erreichtes Wahlziel bleibt erreicht.
- **Anzeige:** Ab dem dritten Ziel (Gewürz) zeigt der Chip «Ziel» «Denkmal 1/3 · n %», am Ende «Wahlziel erreicht»; die Inselchronik führt dazu
  eine Zeile «Wahlziel». Jeder fertige Abschnitt steht im Ereignis-Log, der letzte lässt die Feuerschale aufflammen und die Glocke «Denkmal fertig» läuten (Wahlziel erreicht).

Ohne zusätzliche Betriebe (Steinbruch, Werkzeugmacher, Glashütte, Plantage) wird schon der erste Abschnitt nicht fertig:
In der Messung (Lauf B: 6000 Ticks, kein Zukauf, keine zusätzlichen Betriebe) lieferte das Lager nichts, der Bestand
war am Ende 0 und die Kaufleute sanken von 60 auf 3. Plane Ausbau oder Zukauf ein. Voll zugekauft dauert der Bau 10
Minuten und kostet 64 200 Geld.

Alle Zeitangaben sind **Spielzeit bei 1×** (Minuten und Sekunden); bei 2× und 4× läuft sie entsprechend
schneller. Mengen pro Zeit stehen «pro Minute» (`/ min`).

## Freischaltung Schritt für Schritt

Ein neues Spiel zeigt nur, was du gerade brauchst. Weitere Gebäude, Güter und Funktionen schalten sich
frei, sobald der jeweilige Auslöser eintritt; eine Meldung nennt das Neue, und die Hilfe (`?`) listet, was
als Nächstes kommt. Gesperrte Werkzeuge nennen auf Tastendruck ihren Grund. Als Auslöser zählt ein volles Wohnhaus der aktuellen Stufe (es wünscht die nächste) oder das erste Wohnhaus
der nächsten Stufe.

| Schritt | Auslöser                     | Neu                                                                                                |
| ------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| U0      | Spielstart                   | Wohnhaus, Fischerhütte, Holzfäller; Holz, Werkzeug, Stein, Nahrung                                 |
| U1      | 20 Wohnhäuser                | Marktplatz                                                                                         |
| U2      | ein Wohnhaus wünscht Siedler | Jagdhütte, Steinbruch, Schäferei, Weberei, Kapelle, Feuerwache; Wolle, Stoff; Roden, Aufforsten    |
| U3      | die ersten Siedler           | Rinderfarm, Amtsstube; Handelsaufträge; Ausbau Stufe 2                                             |
| U4      | ein Wohnhaus wünscht Bürger  | Zuckerrohrplantage, Brennerei, Schule; Zuckerrohr, Rum                                             |
| U5      | die ersten Bürger            | Werkzeugmacher; Gütersperren in der Amtsstube; Ausbau Stufe 3                                      |
| U6      | Ziel erreicht (Bürger-Ziel)  | Badehaus, Glashütte, Kontor (Fremdinsel), Gewürzplantage; Glas, Gewürz; Seefahrt und Handelsschiff |

Die Feuerwache erscheint bei der Krisenstufe «aus» nicht in der Bauleiste (in der Sim bleibt sie baubar).
Im Menü «Neue Insel» schaltet **Alles frei** alle Schritte von Anfang an frei (Test- und Übungsmodus).

- **Amtsstube** (Taste `I`, 200 Geld · 15 Holz · 2 Werkzeug · 5 Stein, Unterhalt 120 / min, höchstens eine): In
  ihrem Panel stellst du die Steuer je Bevölkerungsstufe und die Ausgabesperre ein. Beides wirkt nur mit **angebundener**
  Amtsstube; ohne sie gilt die Steuerstufe «normal». Die Kopfzeile zeigt den Steuerknopf erst, wenn die Amtsstube wirkt.
- **Werkzeugmacher** arbeitet nur mit einer **Schule** in Reichweite.
- **Roden** (`C`, 10 Geld, kein Holz) macht aus Wald Weide, **Aufforsten** (`Q`, 20 Geld) aus Weide wieder
  Wald. Schäferei und Zuckerrohrplantage brauchen Weide im Umkreis. Beides lässt sich ziehen (mehrere
  Kacheln in einem Zug).
- **Hilfe** (`?` oder Knopf «Hilfe»): Legende der Kartenzeichen, Bedeutung der Symbole und die nächsten Freischaltungen.
- **Mouse-over:** Mit dem Auswahl-Werkzeug zeigt eine kleine Karte nach 400 ms Ruhe, was unter dem Zeiger liegt
  (Gebäude mit Zustand und Versorgung, Gelände, Schiff, Tiere).
- **Symbole:** Kopfzeile, Bauleiste, Haus-Panel und Meldungen tragen kleine Symbole auf dunklen Chips; der
  bisherige Text bleibt als `aria-label` erhalten.

#### Edikte

Im Panel der Amtsstube erlässt du **ein** Edikt zur Zeit. Es wirkt nur, solange die Amtsstube wirkt (steht, angebunden, kein Brand).

| Edikt     | Wirkung                                                             | Preis    |
| --------- | ------------------------------------------------------------------- | -------- |
| Sparen    | Unterhalt −20 % · Steuer −7 Punkte                                  | 600 Geld |
| Handel    | Kaufpreise am Kontor −20 %                                          | 600 Geld |
| Wohlfahrt | Wachstum alle 4 s statt 5 s · Aufstieg nach 20 s · Steuer −5 Punkte | 600 Geld |

- **Freischaltung:** Die Karten sind gesperrt («Erst nach dem Bürger-Ziel»), bis du das Bürger-Ziel erreicht hast.
- **Sperre:** Nach jedem Erlass, Wechsel oder Aufheben ist die Edikt-Wahl 5 Minuten gesperrt («Edikt-Sperrzeit»).
- **Aufheben** kostet nichts, sperrt aber ebenfalls.
- **Ruhen:** Ohne wirkende Amtsstube (Brand, kein Weg zur Amtsstube) ruht das Edikt; es bleibt gewählt und wirkt wieder, sobald die Amtsstube wirkt.
- **Abriss:** Wer die Amtsstube abreisst, beendet das Edikt ohne Erstattung der 600 Geld; die Sperre bleibt.
- **Stapelregel:** Fest, niedrige Steuer und Wohlfahrt verkürzen die Aufstiegs-Wartezeit nicht unter die der niedrigen Steuer (15 s); sie addieren sich nicht. Bei Mangel an einem Gut verdoppelt sich die Wartezeit weiter.
- Im späten Spiel sind Edikte eine Feinsteuerung von wenigen Prozent; spürbar werden sie beim Zukauf und bei vielen neuen Häusern.

## Wirtschaft

- **Start:** 5000 Geld, 40 Holz, 20 Werkzeug, 10 Stein, 20 Nahrung.
- **Lager:** Alle Waren liegen im Kontor-Lager, höchstens 100 je Gut. Ist das Lager voll, verfällt
  neu erzeugte Ware (Zustand «Lager voll»).
- **Betriebsrangliste:** Ein Klick (oder `Enter`) auf die **Bilanz** in der Kopfzeile öffnet eine Karte mit den Betrieben nach Unterhalt (höchster zuerst, bei Gleichstand geringere Auslastung zuerst; Stillgelegte mit ihrem halben Unterhalt und der Marke «stillgelegt»; Schiffe als eine Zeile; bei einem Sparedikt eine Zeile «Edikt»; mit mindestens zwei Inseln mit Betrieben darüber je Insel eine Zeile «Insel · n Gebäude · Unterhalt / min», höchster Unterhalt zuerst). Die Fusszeile nennt den Unterhalt je Minute wie die Bilanz. Ein Klick auf eine Zeile springt zum Gebäude, `Esc` schliesst; gezeigt werden 20 Zeilen, danach «und n weitere». Die Tasten `4`–`8` ohne Funktion nennen die Tempo-Tasten («Tempo: 1, 2, 3»).
- **Lagerleiste und Warenbilanz:** Die Lagerleiste in der Kopfzeile (zweite Zeile) zeigt je Gut den Bestand und die
  Bilanz mit Trendpfeil (↑ / → / ↓, negative Bilanz hervorgehoben). Die Chips «Glas» und «Kaufleute» erscheinen erst nach der Freischaltung der Stufe 4 oder sobald es Glas bzw. Kaufleute gibt. Der Tooltip nennt Bilanz, Erzeugung und
  Verbrauch je Minute. Gerechnet wird nominal aus den angebundenen Betrieben und dem Bedarf der
  versorgten Häuser; Handel, Aufträge und Aufstiege zählen nicht mit.
- **Gut markieren (Lager-Chip):** Ein Klick auf einen Chip der Lagerleiste (oder `Enter` / Leertaste, wenn der Chip den
  Tastaturfokus hat) markiert auf der aktiven Insel die Erzeuger des Guts mit einer durchgezogenen und die
  Verbraucher-Betriebe mit einer gestrichelten Kontur (höchstens 40 Gebäude gleichzeitig). Die Karte springt zum
  ersten Erzeuger, das Info-Panel ist offen, und die Meldung nennt ihn, z. B. «Holz 1 von 4: Holzfäller (Erzeuger) · …».
  Solange die Markierung aktiv ist, gehen `.` / `,` die Gebäude des Guts durch (sonst die Problemliste). Ein zweiter
  Klick auf denselben Chip, `Esc`, Rechtsklick oder ein Wechsel der aktiven Insel löscht die Markierung. Häuser werden
  nicht markiert; der Tooltip des Chips nennt ihre Zahl («… Häuser verbrauchen Nahrung»). Gibt es noch keinen Erzeuger, sagt
  die Meldung es und nennt die baubaren Typen («Noch kein Erzeuger für Holz — Bauen: …»). Die Markierung ist reiner
  Anzeigezustand und steht nicht im Spielstand.
- **Baukosten:** Geld und teils Holz, Werkzeug oder Stein; sie stehen in der Bauleiste.
- **Anbindung:** Betriebe, Marktplatz, Kapelle, Schule und Feuerwache arbeiten nur, wenn ein Weg an sie grenzt,
  der über Wege mit dem Kontor verbunden ist. Nicht angebundene Gebäude tragen einen roten Punkt.
  Im Info-Panel eines nicht angebundenen Betriebs baut der Knopf «Anbinden (n Wege · x Geld)» den kürzesten
  Weg zum Kontor über freie Kacheln; vorhandene Wegstücke werden mitbenutzt. Die Kosten sind n × 5 Geld, es
  wird nie nur ein Teil gebaut. Fehlt der Pfad oder das Geld, ist der Knopf blass und eine Zeile nennt den
  Grund. Beim Überfahren (oder Fokussieren) zeigt die Karte den geplanten Weg als helle Rauten.
- **Info-Panel:** Das Info-Panel eines Betriebs hat drei Teile. Oben stehen Name, Stufe («Stufe 1» bis «Stufe 3» mit Punkten) und der Zustand als farbig umrandeter Chip (✓ läuft, ! wartet, ✗ steht, z. B. «In Betrieb», «Wartet auf Wolle», «Lager voll», «Nicht an Kontor angebunden») samt Abhilfe. Darunter zeigen Kacheln Ausstoss und Verbrauch je Minute, Auslastung und Unterhalt, dazu der Fortschritt. Unten steht die Ausbau-Karte mit dem Gewinn des nächsten Ausbaus (Ausstoss und Unterhalt, vorher → nachher), Kosten und dem Knopf «Ausbauen» (Tastenkürzel `Umschalt` + `U`). Darüber steht eine Checkliste der Bedingungen (Wissen, Baustoffe, Fachkräfte im Arbeitsweg von 8 Kacheln, Standort je Betriebstyp), jede Zeile mit ✓ oder ✗; am gesperrten Knopf nennt der Tooltip die erste unerfüllte Bedingung. Sind Fachkräfte oder Standort später nicht mehr erfüllt, zeigt der Betrieb den Chip «Läuft wie Stufe k» (Tooltip: die verletzten Bedingungen) und zahlt weniger als den vollen Unterhalt der gebauten Stufe, verliert die Stufe aber nicht. Vor der Freischaltung nennt die Karte, wann der Ausbau möglich wird. Das Wohnhaus zeigt Stufe, Versorgung, Einwohner, Bedarfe und die Aufstiegs-Karte im gleichen Aufbau. Der Knopf «Gleiches bauen» wählt den Gebäudetyp als Bauwerkzeug (wie `Cmd`/`Strg` + Klick; nicht beim Kontor). Das Mouse-over nennt Stufe
  und Auslastung.

### Produktionsketten

| Gebäude            | Erzeugt    | Braucht     | Zyklus | Unterhalt (/ min) | Standort                                           |
| ------------------ | ---------- | ----------- | ------ | ----------------- | -------------------------------------------------- |
| Fischerhütte       | Nahrung    | —           | 4 s    | 30                | an Wasser angrenzend                               |
| Holzfäller         | Holz       | —           | 3 s    | 30                | mind. 1 freie Waldkachel im Radius 2               |
| Jagdhütte          | Nahrung    | —           | 5 s    | 30                | mind. 10 freie Waldkacheln im Radius 3 (sturmfest) |
| Rinderfarm         | Nahrung    | —           | 2 s    | 60                | mind. 16 freie Graskacheln im Radius 3             |
| Steinbruch         | Stein      | —           | 6 s    | 60                | an Gebirge angrenzend                              |
| Schäferei          | Wolle      | —           | 5 s    | 60                | mind. 4 Graskacheln im Radius 2                    |
| Weberei            | Stoff      | Wolle       | 5 s    | 90                | beliebiges Bauland                                 |
| Zuckerrohrplantage | Zuckerrohr | —           | 5 s    | 60                | mind. 4 Graskacheln im Radius 2                    |
| Brennerei          | Rum        | Zuckerrohr  | 5 s    | 120               | beliebiges Bauland                                 |
| Werkzeugmacher     | Werkzeug   | Holz        | 8 s    | 150               | beliebiges Bauland                                 |
| Glashütte          | Glas       | Stein, Holz | 5 s    | 150               | beliebiges Bauland                                 |
| Gewürzplantage     | Gewürz     | —           | 5 s    | 90                | nur Gewürzinsel; mind. 4 Graskacheln im Radius 2   |

Werkzeug gibt es am Kontor zu kaufen oder vom **Werkzeugmacher** (2×2, Baukosten 200 Geld, 15 Holz,
3 Werkzeug). Er lohnt sich erst, wenn du viel Werkzeug brauchst: Sein Unterhalt läuft auch im
Leerlauf, und Werkzeug zu verkaufen bringt weniger, als es kostet. Bauland sind Sand, Gras und Wald
ohne Gebäude oder Weg; Gebirge und Wasser sind unbebaubar.

**Ausbau:** Die meisten Betriebe lassen sich ausbauen (Werte in `src/sim/defs/levels.ts`). Stufe 2 gibt es ab
Freischaltung U3, Stufe 3 ab U5. Ein Ausbau braucht vier Arten von Bedingungen, die die Ausbau-Karte als
Checkliste zeigt:

1. **Wissen:** die Stufe ist freigeschaltet.
2. **Baustoffe:** Geld, Holz, Werkzeug und Stein (Brennerei und Glashütte brauchen Stein schon für Stufe 2:
   3 bzw. 5; Stufe 3: 6 bzw. 10). Nur die Fischerhütte verlangt zusätzlich eine fachliche Ware: 2 Stoff für das
   Netz (Stufe 2 und 3), nicht erstattet.
3. **Fachkräfte:** ein Haus der passenden Stufe (Stufe 2: Siedler, Stufe 3: Bürger) im Arbeitsweg von 8 Kacheln.
4. **Standort** (je Typ, Stufe 2 / Stufe 3):

| Betrieb                              | Standortregel                      | Stufe 2 | Stufe 3 |
| ------------------------------------ | ---------------------------------- | ------- | ------- |
| Fischerhütte                         | höchstens 1 andere Hütte im Radius | 2       | 3       |
| Jäger                                | freie Waldkacheln im Radius 3      | 14      | 18      |
| Holzfäller                           | freie Waldkacheln im Radius 2      | 4       | 6       |
| Rinderfarm                           | freie Grasland-Kacheln im Radius 3 | 18      | 20      |
| Schaf- und Zuckerrohrfarm            | freie Grasland-Kacheln im Radius 3 | 8       | 12      |
| Steinbruch                           | Gebirgskacheln im Radius 2         | 3       | 4       |
| Weberei                              | keine                              | -       | -       |
| Werkzeugmacher, Brennerei, Glashütte | Feuerwache in Reichweite           | -       | ja      |

**Läuft wie Stufe k:** Die Bedingungen Fachkräfte und Standort gelten dauernd. Sind sie verletzt, ist die
Stufe nicht verloren; der Betrieb läuft wie die höchste Stufe k, deren Bedingungen erfüllt sind (Chip «Läuft
wie Stufe k», der Tooltip nennt die verletzten Bedingungen). Der Unterhalt ist dann der Unterhalt von Stufe k
plus 50 % der Differenz zur gebauten Stufe, aufgerundet (`THROTTLED_UPKEEP_PCT`). Eine Änderung wirkt
spätestens nach 10 Ticks. Am gesperrten Knopf «Ausbauen» nennt der Tooltip die erste unerfüllte Bedingung.

Der Zyklus sinkt auf etwa × 0,6 bzw. × 0,4, der Unterhalt steigt (Fischerhütte: 30 → 42 → 54 / min). Baue die
Kette gemeinsam aus, sonst wartet der nächste Betrieb auf Ware. Ein Abriss erstattet die Hälfte von Bau- und
Stufenkosten, die fachliche Ware nicht.

**Freie Kacheln:** «Frei» heisst ohne Gebäude und ohne Weg; die Kacheln unter dem eigenen Grundriss zählen nicht.
Holzfäller und Jagdhütte prüfen das laufend: Ist der Wald im Umkreis abgeholzt oder zugebaut, steht der Betrieb still
(«Kein freier Wald in der Nähe»), ohne Fortschritt und ohne Verbrauch; sein Unterhalt läuft weiter. Abhilfe:
aufforsten (`Q`) oder weiter weg neu bauen.

**Auslastung:** gleitender Anteil der Zeit, in der der Betrieb arbeitet statt zu warten (100 % = nie ausgebremst). Der Wert ist ein Mittel über etwa 256 Spielschritte und sinkt darum erst nach einigen
hundert Schritten, wenn ein Betrieb still steht.

Die **Glashütte** (2×2, Baukosten 300 Geld, 20 Holz, 6 Werkzeug, 10 Stein; erst nach dem Bürger-Ziel) braucht
Stein **und** Holz: Sie entnimmt je Zyklus beides zugleich und nur, wenn beides im Lager liegt; sonst «Wartet auf
…» mit dem fehlenden Gut.

### Handel

Kontor anklicken, dann «Handeln»: Waren in Mengen von 1 oder 10 kaufen und verkaufen. Ist die Seefahrt frei und
gibt es ein Schiff oder lässt sich eines kaufen, öffnet der Klick auf das Heimatkontor das Kontor-Panel mit dem
Schiffsabschnitt («Handeln» bleibt dort ein Knopf); sonst öffnet er direkt den Handel.

| Gut             | Holz | Werkzeug | Stein | Nahrung | Wolle | Stoff | Zuckerrohr | Rum | Glas | Gewürz |
| --------------- | ---- | -------- | ----- | ------- | ----- | ----- | ---------- | --- | ---- | ------ |
| Kauf            | 10   | 40       | 15    | 8       | 12    | 30    | 12         | 40  | 50   | 40     |
| Verkauf (100 %) | 4    | 15       | 6     | 3       | 5     | 12    | 5          | 18  | 20   | 12     |

- **Preise sind global, nicht je Insel:** Kauf- und Verkaufspreise (und die Sättigung unten) gelten für jedes Kontor gleich; nur das Vorliebe-Gut einer Fremdinsel zahlt dort ×1,30 (siehe «Seefahrt und Gewürz»).
- **Kaufpreise sind fest.** Mit dem Edikt Handel (Amtsstube) sinken sie um 20 % (über die ganze Menge aufgerundet).
- **Verkaufssättigung:** Jede verkaufte Einheit senkt den Verkaufspreis dieses Guts um 1 Prozentpunkt,
  höchstens bis 30 %. Jede Sekunde erholt sich der Preis jedes Guts um 1 Prozentpunkt, bis 100 %.
  Rund 10 Einheiten je Gut und 10 Sekunden lassen sich also fast zum vollen Preis verkaufen; wer das
  ganze Lager auf einmal verkauft, drückt den Preis stark (100 Holz bringen 219 statt 400). Der
  Handelsdialog zeigt je Gut «Preis … %», und jeder Verkaufsbutton nennt den genauen Erlös für seine
  Menge.
- **Reserve (Sperrbestand):** Im Handel stellst du je Insel für **Holz und Stein** eine Reserve von 0, 20, 40 oder 60
  ein (nur mit Kontor auf der Insel). Betriebe, die das Gut verbrauchen, nehmen nichts mehr aus dem Lager, solange der
  Bestand die Reserve nicht übersteigt; sie zeigen «Wartet auf Holz (Reserve)». Beim Stein gilt die Reserve der Heimat
  auch für das Denkmal (nur mit Kontor). Bauen, Ausbau, Aufstieg, Handel, Fest und Schiffsladung bleiben frei; die
  Schiffsladung hat ihre eigene Routenreserve.
- Buttons, die sicher scheitern, sind blass, bleiben aber klickbar; ein Klick nennt den Grund («Kein
  Geld», «Zu wenig Geld», «Lager voll», «Nicht genug Ware»).

### Handelsaufträge

Nach 1:00 und dann alle 1:30 bestellt ein Händler eine Ware (10 Aufträge in den ersten 15
Minuten). Der Auftrag gilt sofort, läuft 1:00 und steht als Karte oben rechts im Spielfeld: «Auftrag:
Menge Gut · Prämie · noch m:ss · Lager x/Menge». **Liefern** gibt die ganze Menge auf einmal ab
und bringt die Prämie — auch bei negativem Geld. Teillieferungen gibt es nicht, ein verpasster
Auftrag verfällt ohne Strafe. Ohne Auftrag zeigt die Karte «Nächster Auftrag in m:ss».

| Gut        | ab Stufe  | Menge | Prämie je Einheit |
| ---------- | --------- | ----- | ----------------- |
| Holz       | Pioniere  | 20–40 | 7                 |
| Nahrung    | Pioniere  | 10–20 | 6                 |
| Stein      | Siedler   | 10–20 | 11                |
| Wolle      | Siedler   | 10–20 | 9                 |
| Stoff      | Siedler   | 6–12  | 22                |
| Zuckerrohr | Bürger    | 10–20 | 9                 |
| Rum        | Bürger    | 6–12  | 30                |
| Glas       | Kaufleute | 4–8   | 37                |

Welche Waren bestellt werden, richtet sich nach der höchsten Stufe deiner Häuser. Ein Auftrag bringt
mehr als der Verkauf, aber Waren dafür zuzukaufen lohnt sich nie. Werkzeug wird nicht bestellt.

#### Stammkunde

Hast du einen Auftrag geliefert und steht ein Haus der Stufe 3 (Bürger), bietet der Händler einen
**Stammkunden** an: dasselbe Gut, immer wieder. Das Angebot steht als Karte («Stammkunde: Menge Gut alle
1:30 zu Preis je Stück · Angebot noch m:ss») bis zum nächsten Auftragstakt; **Annehmen** oder **Ablehnen**.
Menge und Stückpreis sind je Gut fest und gelten ab dem Annehmen unverändert:

| Gut        | Menge | Stückpreis | Wert je Lieferung |
| ---------- | ----- | ---------- | ----------------- |
| Holz       | 23    | 6          | 138               |
| Nahrung    | 28    | 5          | 140               |
| Stein      | 14    | 10         | 140               |
| Wolle      | 17    | 8          | 136               |
| Stoff      | 7     | 20         | 140               |
| Zuckerrohr | 17    | 8          | 136               |
| Rum        | 5     | 27         | 135               |
| Glas       | 4     | 34         | 136               |

Alle 1:30 bucht der Vertrag die Menge vom Lager der Lieferinsel ab und zahlt den Wert; die Karte zeigt
«nächste Lieferung m:ss · Lager x/Menge» und färbt sich warm, wenn das Lager zu klein ist oder das
Kontor fehlt. Solange der Vertrag läuft, gibt es keine Zufallsaufträge. **Kündigen** ist jederzeit
kostenlos. Fehlen bei der Lieferung Ware oder Kontor, springt der Kunde ab und es kostet eine Strafe in
Höhe einer Lieferung (Wert je Lieferung), danach geht es mit Zufallsaufträgen weiter.

**Treue (I-091):** Jede pünktliche Lieferung zählt einen Treuepunkt (`CONTRACT_LOYAL_AFTER = 5`); die Karte zeigt
«Treue n/5». Ist der Stammkunde treu und fehlen bei der Lieferung Ware (`stock`) oder Kontor (`kontor`), verzeiht
er das einmal: keine Strafe, der Vertrag läuft weiter, der Zähler beginnt bei 0. Der Deckel liegt bei einer Kulanz je
5 Lieferungen; einen Geldbonus für Treue gibt es nicht (R670). Kündigen und ein neuer Vertrag beginnen bei 0.

**Vorwarnung (I-122):** `CONTRACT_WARN_TICKS = 300` (30 s Spielzeit, Wert in `src/sim/defs/goods.ts`) ist das Fenster vor der Vertragsabrechnung, in dem die Karte einen behebbaren Fehlbestand (`stock`, `kontor`) ankündigt. Der Wert wirkt nur auf Anzeige und Klang, nie auf den Spielverlauf (kein Spieleffekt, Balancing unberührt). **Reichweite (I-123):** Die Lager-Reichweite des Vertragsguts auf der Lieferinsel zieht `Menge × 100 / ORDER_PERIOD` je Bilanzfenster ab; reine Anzeige.

#### Fernangebot

Mit einem Kontor auf einer Fremdinsel und einem Haus mindestens der Stufe des Guts bietet der Händler zu
Beginn eines Auftragstakts ein **Fernangebot** an (nicht bei laufendem Stammkunden). Es steht als eigene
Karte unter der Auftragskarte. **Annehmen** ersetzt den Auftrag der Periode; geliefert wird nur aus dem
Lager der Fern-Insel. Die Frist beträgt 2:50 ab Auftragsbeginn. Bei mehreren Inseln wechselt das Angebot
reihum (nach Periode, ohne Zufall). Mit Kontoren auf zwei Fremdinseln kommt ein zweites Angebot hinzu: die nächste wählbare Insel in der Rotation, mit gleicher Menge und Prämie je Gut wie in der Tabelle. Nur eines ist annehmbar; ein Mehrverdienst pro Periode entsteht nicht. Nach einem angenommenen Fernauftrag entfällt der nächste Auftrag.
Wert = Menge × Prämie je Einheit der Tabelle oben.

| Insel      | Gut   | ab Stufe | Menge | Wert |
| ---------- | ----- | -------- | ----- | ---- |
| Möweninsel | Stoff | 2        | 20    | 440  |
| Felsbucht  | Rum   | 3        | 15    | 450  |
| Weidenau   | Glas  | 4        | 12    | 444  |

### Seefahrt und Gewürz

Die Seefahrt wird mit dem Bürger-Ziel frei (U6). Danach liegen drei weitere Inseln im Archipel: die **Möweninsel**
(24 × 24 Kacheln, Gewürz), die **Felsbucht** (36 × 36, Gewürz und Gebirge) und **Weidenau** (24 × 24, Gewürz und Fruchtbar). Kaufleute brauchen **Gewürz** (0,1 je
Einwohner und 10 s); es wächst nur auf Gewürzinseln und lässt sich am Kontor zu 40 Geld kaufen (Verkauf 12).

- **Inselvorteil:** Zwei Inseln haben eine Stärke, die bestimmte Betriebe doppelt so schnell arbeiten lässt (Zyklus
  halbiert, ×2): die Felsbucht mit **Gebirge+** beim **Steinbruch** und bei der **Glashütte**, Weidenau mit **Fruchtbar**
  bei der **Zuckerrohrplantage** und der **Schäferei**. Die Möweninsel hat keinen Vorteil; die Heimat nie. Du siehst ihn
  an vier Stellen: in der Karte beim Überfahren einer Insel und in der Seekarte als Zusatzzeile, im Gebäude-Info als
  «Inselvorteil ×2 (…)» und in der Bauleiste als Zeile «Auf <Insel>: <Stärke> ×2 — … / min» für die aktive Insel.
- **Inselmarkt:** Jede Fremdinsel hat ein Vorliebe-Gut (`PREFER_PCT` = 130 %, `IslandDef.prefers` in `src/sim/defs/sea.ts`):

  | Insel      | Vorliebe-Gut | Erlös am Kontor dort |
  | ---------- | ------------ | -------------------- |
  | Möweninsel | Stoff        | +30 %                |
  | Felsbucht  | Rum          | +30 %                |
  | Weidenau   | Glas         | +30 %                |

  Die Sättigung (`sellPct`) bleibt global. Boom und Vorliebe stapeln nicht; es gilt der höhere Faktor, ein Boom auf dem Vorliebe-Gut gilt also «statt Vorliebe». Die Heimat hat keine Vorliebe. Anzeige: Karte (Hover) und Seekarten-Zusatzzeile «Markt: Glas +30 %», Handelsdialog Marke «Vorliebe +30 %» (bei Boom «statt Vorliebe +30 %»).

- **Inseln wechseln:** Taste `0` springt zur Heimat, Taste `9` läuft der Reihe nach über alle vier Inseln; der Knopf «Inseln» in der Kopfzeile
  öffnet ein Fenster mit einer kleinen **Seekarte** über der Liste: Silhouetten aller Inseln, die Fahrlinien der Routen und
  je ein Punkt für jedes Schiff mit Route (ein Schiff ohne Route fehlt; im Hafen liegt der Punkt am Anker der Insel; Inseln mit Kontor tragen eine helle Marke knapp über dem Anker).
  Ein Klick auf das Land einer Insel springt dorthin wie die Tasten `0`/`9` und schliesst das Fenster; ein Klick ins
  Wasser tut nichts, `Esc` oder ein Klick daneben schliesst. Die Liste darunter bleibt als Tastaturweg. Die Kamera zeigt die Insel, die in der Bildmitte liegt; die Lagerleiste in der Kopfzeile zeigt das
  Lager **dieser** Insel, mit dem Inselnamen davor. Jede Insel hat ihr eigenes Lager.
- **Kontor II:** Ein zweites **Kontor** (2×2, Küste, 800 Geld, 20 Holz, 8 Werkzeug, 10 Stein, Unterhalt 60 / min, Versorgungsradius 8) gründest du an der Küste einer Fremdinsel. Seine Baukosten zahlst du aus dem **Heimatlager**.
  Auf jeder Fremdinsel ist ein Kontor erlaubt; ohne Kontor lässt sich dort nichts bauen, und Handel, Aufträge und
  Versorgung laufen über das Kontor der jeweiligen Insel.
  Preise am Fremdkontor gelten global, ausser beim Vorliebe-Gut der Insel: dort Verkauf ×1,30 (nicht mit dem Boom gestapelt, siehe «Inselmarkt»).
- **Bauen auf Fremdinseln:** Alle anderen Gebäude zahlen aus dem Lager der Insel, auf der sie stehen; fehlt dort eine
  Ware, steht im Grund «Nicht genug … auf <Insel>». Ware kommt per Handel am dortigen Kontor oder per Schiff dorthin.
- **Gewürzplantage** (2×2, 200 Geld, 12 Holz, 3 Werkzeug, Unterhalt 90 / min, Zyklus 5 s): nur auf einer Insel mit
  Gewürz und mit mindestens 4 Graskacheln im Radius 2; ihr Gewürz landet im Lager der Insel und muss per Schiff in die
  Heimat.
- **Handelsschiff** (kaufen im Kontor-Panel der Heimat: 1200 Geld, 25 Holz, 10 Werkzeug; Unterhalt 90 / min je Schiff;
  höchstens 4 Schiffe; Ladung höchstens 50 Stück). Ein neues Schiff liegt im Heimathafen.
- **Route in zwei Klicks:** Im Kontor-Panel «Route nach <Insel>» wählen (Klick 1), dann das Gut bei «Holen» oder
  «Bringen» (Klick 2); das freie Schiff im Heimathafen bekommt die Route und pendelt zwischen den beiden Kontoren. Je
  Richtung höchstens 2 Güter, ein Gut fährt nur in eine Richtung. Das Schiff fährt eine Sekunde je Seekachel. Beim
  Anlegen entlädt es, was nicht auf der Route steht, und lädt neu.
- **Reserve:** Je Gut stellst du eine Reserve in Stück ein (Standard 10, Schritt 10, höchstens 90); das Schiff nimmt nur
  den Bestand über der Reserve mit, so bleibt Vorrat im Lager. Bei mehreren Gütern teilt es die Ladung zuerst gleich auf.
- **Route auflösen:** Das Schiff fährt heim, entlädt bis zur Lagergrenze (100); was nicht mehr ins Heimatlager passt,
  verfällt («n Gewürz verloren»). **Ausmustern** geht nur im Heimathafen ohne Route und ohne Ladung.
- **Bedienung:** Ein Klick aufs Heimatkontor öffnet den Handel; die Schiffe erreichst du über «Zurück» oder mit einem
  Klick direkt auf das Schiff. Mouse-over über einem Schiff zeigt Ladung, Ziel und Restzeit.

### Unterhalt und Geld

- Unterhalt und Steuern werden je Spielschritt gebucht, Bruchteile werden mitgeführt (die Kasse zählt stetig); die Angaben «/ min» sind Raten. Der Münzton kommt weiter im 10-Sekunden-Takt. Die Kopfzeile zeigt die Bilanz («Bilanz ±n / min», Steuern minus Unterhalt);
  der Tooltip nennt Steuern und Unterhalt je Minute; eine negative Bilanz ist hervorgehoben.
- Geld darf negativ werden. Solange es negativ ist, sind Bauen, Kaufen und Aufstieg gesperrt, bis
  wieder Geld hereinkommt (Verkauf, Auftrag oder Steuern).

### Stilllegen

Im Betriebs-Panel legt der Knopf «Stilllegen» einen Betrieb still, der etwas erzeugt (Farmen, Werkstätten und so weiter; Wohnhäuser und Dienste nicht).

- Ein stillgelegter Betrieb zahlt **50 % des Unterhalts** (je Betrieb aufgerundet), erzeugt nichts und verbraucht nichts. Die Kette dahinter läuft leer.
- «Wieder anfahren» (derselbe Knopf) startet ihn mit einem Klick, ohne Kosten.
- Stillgelegte Betriebe stehen nicht in der Problemliste: Die Pause ist gewollt.

### Abriss

Die Hälfte der Baukosten (abgerundet) wird zurückerstattet; Waren nur, soweit im Lager Platz ist. Der
Button «Abreissen» zeigt den tatsächlichen Betrag und was am Lagerlimit verfällt (z. B. «Holz 1
(4 verfallen – Lager voll)»). Das Kontor kann nicht abgerissen werden. Das Denkmal fragt bei begonnenem Fortschritt nach und erstattet nur den halben Bauplatz (siehe Ziel, Denkmal). Ein Weg erstattet wie jeder Abriss die Hälfte (2 Geld). Trennt ein Abriss Gebäude vom Kontor, meldet das Spiel am Ende des Zugs «Abriss trennt n Gebäude vom Kontor»; `.` springt zu ihnen.

## Bevölkerung

### Stufen

| Stufe     | max. Einwohner | Bedürfnisse (je Einwohner pro 10 s)                   | Dienste                   | Steuer je Einwohner pro 10 s | Aufstieg kostet (Geld/Holz/Werkzeug/Stein)                 |
| --------- | -------------- | ----------------------------------------------------- | ------------------------- | ---------------------------- | ---------------------------------------------------------- |
| Pioniere  | 4              | Nahrung 0.5                                           | —                         | 2                            | zu Siedlern: 100 / 5 / 2 / 0                               |
| Siedler   | 8              | Nahrung 0.5, Stoff 0.2                                | Kapelle                   | 7                            | zu Bürgern: 300 / 10 / 5 / 5                               |
| Bürger    | 15             | Nahrung 0.5, Stoff 0.2, Rum 0.2                       | Kapelle, Schule           | 14                           | zu Kaufleuten: 600 / 15 / 8 / 10, nur nach dem Bürger-Ziel |
| Kaufleute | 20             | Nahrung 0.5, Stoff 0.2, Rum 0.2, Glas 0.1, Gewürz 0.1 | Kapelle, Schule, Badehaus | 22                           | —                                                          |

Ein neues Wohnhaus startet mit einem Pionier. Die Kopfzeile zeigt die Einwohner je Stufe. Die
Steuer und die Wartezeit vor dem Aufstieg hängen zusätzlich vom Regler der Stufe ab (unten).

### Versorgung

Ein Wohnhaus lässt sich nur im Versorgungsradius (8) des Kontors oder eines angebundenen Marktplatzes
bauen und erhält nur dort Waren aus dem Lager. Liegt es ausserhalb, gelten alle Warenbedürfnisse als
unerfüllt.

### Bedürfnisse und Dienste

- Jedes Haus verbraucht die Waren seiner Stufe aus dem Lager. Fehlt eine Ware, ist das Bedürfnis
  unerfüllt, bis wieder eine Einheit entnommen werden kann.
- **Dienste:** Kapelle, Schule und Badehaus wirken im Radius 10 und nur, wenn sie per Weg angebunden sind.
- **Wachstum:** Alle 5 Sekunden wächst ein Haus um einen Einwohner, wenn alle Bedürfnisse und Dienste
  seiner Stufe erfüllt sind; sonst schrumpft es um einen (mindestens einer bleibt). Liegt es über der
  Belegung der Steuerstufe ihrer Stufe (nur bei «hoch»), zieht je Takt ein Einwohner aus.

### Aufstieg

Ein Haus steigt beim nächsten Wachstumstakt auf, wenn

- es voll belegt ist,
- seine Bedürfnisse seit mindestens 30 Sekunden ununterbrochen erfüllt sind (Regler der Stufe «niedrig»:
  15 Sekunden; «hoch»: kein Aufstieg),
- die Dienste der nächsten Stufe in Reichweite sind,
- von jeder neuen Ware der nächsten Stufe mindestens eine Einheit im Lager liegt und
- die Aufstiegskosten bezahlbar sind (sie werden dann abgezogen).

Würde eine Ware der nächsten Stufe durch den Aufstieg ins Minus rutschen (Erzeugung minus Verbrauch, Lagerbestand
zählt nicht), dauert die Wartezeit doppelt so lange (60 statt 30 Sekunden, «niedrig» 30 statt 15). Das ist ein
Zögern, kein Verbot: Der Aufstieg bleibt möglich.
Das Haus-Panel zeigt bei einem solchen Defizit eine Zeile mit dem Restvorrat («Vorrat reicht noch 2 Minuten»); fehlt beim Aufstieg Stein und steht eine Glashütte, nennt es sie als zweiten Steinverbraucher.

Beim Aufstieg wird von jeder neuen Ware eine Einheit aus dem Lager entnommen und direkt ans Haus geliefert.

Die Einwohnerzahl bleibt beim Aufstieg erhalten. Das Info-Panel eines Wohnhauses zeigt Einwohner, die Versorgung
(«Im Versorgungsradius», wenn ein Kontor oder angebundener Marktplatz in Reichweite liegt, sonst «Ausserhalb der
Versorgung»), Bedürfnisse mit ✓/✗, die Mängel («Mangel: Nahrung fehlt», «Mangel: Kapelle fehlt», in derselben
Reihenfolge wie das Kartensymbol), jede noch fehlende Aufstiegsbedingung und die Kosten.

### Steuern und Steuerregler

Jedes Haus zahlt Einwohner × Steuersatz seiner Stufe, gerechnet als Rate je 10 Sekunden und laufend verbucht. Sind nicht alle Bedürfnisse und
Dienste erfüllt, zahlt es nur die Hälfte. Die Summe aller Häuser wird mit dem Prozentsatz der
Steuerstufe ihrer Bevölkerungsstufe verrechnet; Bruchteile eines Geldstücks bleiben als Übertrag stehen und gehen nicht verloren.

Die **Steuerregler** stehen im Panel der **Amtsstube** (Klick auf die Amtsstube); die Kopfzeile zeigt nur den Stand («Steuer
gemischt», wenn die Regler verschieden stehen). Es gibt je Bevölkerungsstufe einen Regler (Pioniere, Siedler, Bürger,
Kaufleute) und eine Zeile «alle Stufen», die alle Regler auf einmal setzt. Jeder Knopf nennt im Tooltip Steuersatz,
Aufstiegszeit und Belegung; rechts steht die Steuer der Gruppe je Minute.

| Stufe   | Steuer                 | Aufstieg nach | Belegung der Häuser                                   |
| ------- | ---------------------- | ------------- | ----------------------------------------------------- |
| niedrig | 70 % (nicht Kaufleute) | 15 s          | voll                                                  |
| normal  | 100 %                  | 30 s          | voll                                                  |
| hoch    | 130 %, Kaufleute 115 % | kein Aufstieg | 75 % (Pioniere 3, Siedler 6, Bürger 11, Kaufleute 15) |

Kaufleute steigen nicht auf; für sie gibt es kein ‹niedrig›. ‹hoch› lohnt bei Kaufleuten nur, wenn ihre Waren knapp sind.

- Start ist «normal». Nach jedem Umschalten ist der geänderte Regler 30 Sekunden gesperrt (Anzeige: «wieder änderbar in
  m:ss» bei der Gruppe); die anderen Regler bleiben frei. «Alle Stufen» scheitert, solange einer der zu ändernden Regler
  gesperrt ist, und nennt die Gruppe. Umschalten kostet nichts und geht auch bei negativem Geld; die neue Stufe wirkt sofort
  für die nächste Auszahlung.
- «Hoch» bringt kurzfristig Geld, verfehlt auf Dauer aber das Ziel (weniger Einwohner, kein
  Aufstieg). «Niedrig» kostet Geld, lässt Häuser aber schneller aufsteigen.

## Rat (Ratsbeschluss)

Ab dem ersten Haus der Stufe 2, 3 und 4 (auf irgendeiner Insel) wird je ein Beschluss «offen» und bleibt es dauerhaft, auch nach Abriss oder Abstieg. Der Spieler wählt
einmal pro Stufe eine der Seiten (A: schnellere Kette, B: Form der Stadt; auf Stufe 4 zusätzlich C: Seerecht); der Beschluss gilt reichsweit bis Partie-Ende, kostet nichts und lässt sich nicht
rückgängig machen. Ein offener Beschluss wirkt nicht und läuft nicht ab. Die Zahlen stehen nur in `src/sim/defs/council.ts` (Änderung nur per Ruling, der Balancing-Test
bleibt Regressionsschutz); die Lese-Helfer in `src/sim/council.ts` liefern ohne Beschluss genau den Wert aus den Defs.

| Stufe (Auslöser) | Seite | Name         | Wirkung                                                | alt → neu |
| ---------------- | ----- | ------------ | ------------------------------------------------------ | --------- |
| 2                | A     | Webordnung   | Webereien +25 % schneller (Takt `weaver`)              | 50 → 40   |
| 2                | B     | Glockenrecht | Kapellen reichen 3 Felder weiter (`chapel`-Reichweite) | 10 → 13   |
| 3                | A     | Brennrecht   | Brennereien +25 % schneller (Takt `distillery`)        | 50 → 40   |
| 3                | B     | Wohnordnung  | Bürgerhäuser fassen 16 statt 15 Bürger                 | 15 → 16   |
| 4                | A     | Glasrecht    | Glashütten +67 % schneller (Takt `glassworks`)         | 50 → 30   |
| 4                | B     | Hofrecht     | Kaufmannshäuser fassen 22 statt 20 Kaufleute           | 20 → 22   |
| 4                | C     | Seerecht     | Schiffe fahren 25 % schneller (Hebel `seaTileTicks`)   | 10 → 8    |

**Seerecht (Stufe 4, Seite C):** Der Hebel `seaTileTicks` steht in `src/sim/defs/council.ts` (Wert 8), der Ausgangswert `SHIP_TICKS_PER_SEA_TILE` (10) in `src/sim/defs/sea.ts`. Er ersetzt die Ticks je Seefeld in jeder Fahrzeit (Anzeige, Rechnung, Schiffe unterwegs). Prüfwert Erweiterung 1 (R805): `tests/sim/seerecht.test.ts` (AK-SR-8) hält die Gewinnlage. Fällt der Wächter oder die Balancing-Prüfung, gibt es ein Werte-Ruling; Wert 9 ist verworfen, Wert 7 wird dann geprüft.

**Anteiliger Stufentakt (R711 R-3):** Ausgebaute Betriebe nehmen den neuen Takt anteilig: `floor(Stufentakt × neuer Grundtakt ÷ 50)`, mindestens 1 (Weberei Stufe 30 → 24).
Die Reihenfolge ist Beschluss, dann Inselvorteil, beide abgerundet. Das Glockenrecht gilt auch für die Festreichweite der Kapelle.

## Meisterprüfung (Auflage)

Nach dem fertigen Denkmal (`monumentDone`) wählt der Spieler freiwillig die Auflage «Eigenversorgung»: 15 Minuten kein Zukauf an den Kontoren und für das Denkmal. Die Zahlen stehen nur in
`src/sim/defs/trials.ts` (Änderung nur per Ruling, der Balancing-Test bleibt Regressionsschutz). Entscheide E1 bis E4: Ruling R745.

| Wert                | Konstante              | Wert                             |
| ------------------- | ---------------------- | -------------------------------- |
| Dauer               | `TRIAL_DURATION_TICKS` | 9000 Ticks (15 min)              |
| Startfenster, unten | `TRIAL_MIN_MERCHANTS`  | 60 Kaufleute (`WIN_MERCHANTS`)   |
| Startfenster, oben  | `TRIAL_MAX_MERCHANTS`  | 150 Kaufleute                    |
| Abbruchschwelle     | `TRIAL_FAIL_POP_PCT`   | 70 % der Starteinwohner          |
| Auflagen            | `TRIAL_IDS`            | `selfSupply` («Eigenversorgung») |

- **E1:** nur «Eigenversorgung»; Zukauf gesperrt, Verkauf, Aufträge, Stammkunde, Fernangebot, Schiffe und Bauen bleiben frei.
- **E2:** keine Abriss- oder Steuersperre; die Abbruchschwelle deckelt das Verkleinern.
- **E3:** Startfenster 60 bis 150 Kaufleute (Obergrenze geschätzt, Playtest-Trigger Spec §10).
- **E4:** nicht bestanden, sobald die Einwohner unter 70 % der Starteinwohner fallen (90 % risse im Normalspiel in 11 von 16 Seeds).

## Krisen

### Krisenstufe

Im Menü unter «Neue Insel» wählst du «Krisen: aus · mild · normal» (Standard «normal»). Die Wahl gilt
für die nächste Insel; das laufende Spiel behält seine Stufe, ein geladener Stand die seines Spielstands.

| Stufe  | erste Krise | danach         |
| ------ | ----------- | -------------- |
| aus    | —           | keine Krisen   |
| mild   | nach 4:00   | alle 2:00 eine |
| normal | nach 4:00   | alle 1:00 eine |

Bei jeder Krise wird zufällig, aber aus der Kartennummer vorherbestimmt, eine von drei Arten gezogen:
Brand (50 %), Sturm (25 %) oder Boom (25 %). Es läuft nie mehr als eine Krise zugleich.

### Brand und Feuerwache

- **Brennbar** sind alle Produktionsbetriebe, die Kapelle und die Schule; Kontor, Marktplatz, Wohnhäuser,
  Wege und die Feuerwache brennen nicht. Der Tooltip der Bauleiste zeigt «Brennbar».
- Der Brand trifft das brennbare Gebäude nahe einer zufälligen Stelle zwischen deinen brennbaren Gebäuden.
- **Geschützt** ist ein Gebäude, wenn eine angebundene Feuerwache höchstens 8 Kacheln (Mitte zu Mitte)
  entfernt steht. Dann wird der Brand gelöscht: kein Schaden, nur eine Meldung. Das Info-Panel brennbarer
  Gebäude zeigt «Brandschutz: ja/nein».
- **Ungeschützt** zahlst du sofort die Instandsetzung (die Geldkosten des Gebäudes, auch ins Minus), der
  Fortschritt geht verloren, und das Gebäude fällt 20 Sekunden aus: Ein Betrieb produziert nicht, eine Kapelle
  oder Schule liefert keinen Dienst. Der Unterhalt läuft weiter. Das Info-Panel zeigt «Brennt — wieder in
  Betrieb in m:ss» und «Erzeugt X nicht — Betrieb brennt». Die Warenbilanz in der Kopfzeile bleibt bei
  der Dauerleistung, sie zeigt keine kurzen Ausfälle.
- Auf der Karte brennt das Gebäude mit Flammen, Rauch und Glut; ein pulsierender Warnring markiert es. Nach
  dem Löschen zieht noch kurz Rauch ab.

### Sturm

Ein Sturm wird 20 Sekunden vorher angekündigt (Himmel verdunkelt sich, Wind im Ton, Nebelhorn) und dauert
dann 30 Sekunden. Fischerhütte, Holzfäller, Schäferei und Zuckerrohrplantage arbeiten im Sturm mit halber
Leistung. Auf der Karte: dunklere Tönung, Regen, höhere Wellen und dunkle Bildränder.

### Boom

Ein Händler zahlt 30 Sekunden lang **+50 %** auf den Verkaufspreis eines Guts (aus dem Auftragspool deiner
höchsten Stufe). Der Handelsdialog markiert das Gut mit «Boom +50 %», die Verkaufsbuttons zeigen den
Erlös inklusive Boom; die Sättigung wirkt weiter. Über dem Kontor dreht sich eine Münze. Zukaufen und im
Boom verkaufen lohnt sich nie, und ein Auftrag bringt je Einheit immer mehr als der Boom.

### Krisenkarte und Ereignis-Log

- Die **Krisenkarte** steht oben rechts im Spielfeld, unter der Auftragskarte, und zeigt
  «Krisen: normal · nächste Krise in m:ss» oder die laufende Krise mit Restzeit (z. B. «Brand: Weberei ·
  Ausfall noch 20 s · …», «Sturmwarnung: Sturm in 20 s, dauert 30 s …», «Boom: Rum +50 % Verkaufspreis ·
  noch 30 s»). Bei Krisenstufe «aus» erscheint keine Karte; die Stufe bleibt im Menü und in den Einstellungen sichtbar.
- Das **Ereignis-Log** schwebt unten links über der Karte, sobald es Einträge gibt. Eingeklappt zeigt es
  nur den neuesten Eintrag; «Ereignisse ▸» klappt die letzten 10 auf («m:ss · …», Spielzeit seit Beginn). Es gehört nicht zum
  Spielstand und ist nach «Neue Insel» und «Laden» leer. Wichtige Ereignisse erscheinen zusätzlich als Meldung.
  Ein Klick auf eine Brandmeldung zentriert die Karte auf das Gebäude.
