# Inselreich — ein Aufbau-Strategiespiel im Stil von Anno 1602

Browser-Spiel (TypeScript + HTML5 Canvas, keine Laufzeit-Abhängigkeiten, siehe
[ADR-001](docs/adr/ADR-001-tech-stack.md)).
Eigene Grafik, eigene Spielwerte — inspiriert von der Mechanik des Klassikers, kein Nachbau von Originalmaterial.

Stand: MVP (Meilensteine 1–4), M5 „Spielerlebnis", M6 „Krisen" und M7 „Stimmung" — Insel generieren,
Wege und Betriebe bauen, Produktionsketten, Handel am Kontor mit Verkaufssättigung und Handelsaufträgen,
Bevölkerung mit drei Stufen und Steuerregler, Krisen (Brand, Sturm, Boom) mit Feuerwache, Siegziel,
Speichern, Laden und Autosave im Browser. Die Insel ist isometrisch gezeichnet, mit Tageslicht,
Fensterlicht in der Nacht, Wetter, Spaziergängern und Möwen; Ton mit getrennten Reglern für Musik,
Umgebung und Effekte. Dazu Tooltips, Hotkeys und Touch-Bedienung (Zielplattform ist Desktop ab 1280 px).

**Online spielen:** GitHub Pages: https://konstantinniedermann.github.io/anno-clone/.

## Ziel

Lass **50 Bürger** auf deiner Insel leben. Gezählt werden die Einwohner aller Wohnhäuser der höchsten
Stufe. Ist das Ziel erreicht, erscheint eine Meldung und das Spiel läuft weiter. Der Chip «Bürger-Ziel»
in der Kopfzeile zeigt den Fortschritt.

## Bedienung

### Kamera

Die Karte ist isometrisch: Jede Kachel ist eine Raute, die Kachel oben in der Ecke ist der Kartenursprung.
Gebäude, Bäume und Figuren haben Höhe; was weiter vorn steht, verdeckt, was dahinter steht.

- **Zoomen:** Mausrad (Stufen 0,5 bis 2); auf Touch mit zwei Fingern (Pinch).
- **Verschieben:** mittlere Maustaste ziehen, Leertaste halten und mit der linken Maustaste ziehen, im
  Werkzeug «Auswahl» einfach mit der linken Maustaste ziehen — oder WASD/Pfeiltasten. Auf Touch
  verschieben zwei Finger die Karte in jedem Werkzeug, ein Finger im Werkzeug «Auswahl».

### Werkzeuge (Bauleiste unten)

- **Auswahl:** Klick auf ein Gebäude öffnet das Info-Panel. Getroffen wird der sichtbare Gebäudekörper
  (Wände und Dach), nicht nur die Bodenkachel; steht ein Gebäude hinter einem höheren, wählt ein Klick auf
  seinen sichtbaren Teil trotzdem dieses Gebäude. Beim Überfahren zeigt ein Umriss, was getroffen wird.
- **Weg:** klicken oder mit gedrückter Maustaste über mehrere Kacheln ziehen; massgeblich ist die
  Bodenkachel unter dem Zeiger.
- **Gebäude:** in der Bauleiste wählen (nach Kategorien, mit Kosten), dann auf die Karte klicken. Der
  Zeiger liegt über der Mitte der Grundfläche; ein halbtransparenter Geist zeigt das Gebäude. Die
  Grundfläche ist grün, wenn der Standort passt, sonst rot; der Grund erscheint als Meldung. Nicht
  bezahlbare Gebäude sind blass dargestellt, ein Klick nennt den Grund.
- **Abriss:** Werkzeug wählen, dann auf einen Gebäudekörper oder einen Weg klicken — oder im Info-Panel
  «Abreissen».
- **Wann eine Aktion wirkt:** Mit der Maus sofort beim Drücken, auf dem Ziel unter dem Zeiger. Auf
  Touch beim Loslassen, aber auf der Kachel, auf die der Finger zuerst getippt hat — und nur, wenn
  kein zweiter Finger dazukam und nicht verschoben wurde.
- **Tooltips:** Ein Eintrag der Bauleiste zeigt beim Überfahren, bei Tastaturfokus oder bei langem
  Drücken auf Touch (0,5 s) Name und Taste, Kosten, Unterhalt, was er erzeugt und braucht, die
  Standortregel, den Radius und — falls gesperrt — den Grund.
- **Radiusanzeige beim Platzieren:** Wohnhaus zeigt den Umriss der versorgten Fläche; Marktplatz,
  Kapelle, Schule und Feuerwache zeigen ihren Wirkkreis (in der Isometrie eine Ellipse) um die Vorschau
  und den Umriss der schon abgedeckten Fläche; Holzfäller, Schäferei und Zuckerrohrplantage zeigen den
  Standortkreis (Radius 2) mit den passenden Wald- bzw. Graskacheln.
- **Feuerwache** (Kategorie «Öffentlich», Taste `E`): 1×1, Baukosten 150 Geld, 10 Holz, 2 Werkzeug,
  Unterhalt 10. Angebunden löscht sie Brände an brennbaren Gebäuden, deren Mitte höchstens 8 Kacheln von
  ihr entfernt ist (Abschnitt «Krisen»). Bei Krisenstufe «aus» kostet sie nur Unterhalt. Ihr Tooltip nennt,
  wie viele brennbare Gebäude noch ungeschützt sind; das Info-Panel zeigt «Schützt N brennbare Gebäude».

### Tastatur und Maus

| Eingabe                | Wirkung                                                   |
| ---------------------- | --------------------------------------------------------- |
| WASD / Pfeiltasten     | Karte verschieben                                         |
| Leertaste (halten)     | Linke Maustaste verschiebt die Karte                      |
| `Esc` oder Rechtsklick | Zurück zum Werkzeug «Auswahl», Panel zu                   |
| Mausrad                | Zoomen                                                    |
| `P`                    | Pause an/aus (setzt danach das letzte Tempo fort)         |
| `1` / `2` / `3`        | Tempo 1× / 2× / 4× (hebt die Pause auf)                   |
| `R` / `X`              | Weg / Abriss                                              |
| `H` / `M` / `K` / `U`  | Wohnhaus / Marktplatz / Kapelle / Schule                  |
| `F` / `L` / `B` / `G`  | Fischerhütte / Holzfäller / Steinbruch / Schäferei        |
| `V` / `Z` / `N` / `T`  | Weberei / Zuckerrohrplantage / Brennerei / Werkzeugmacher |
| `E`                    | Feuerwache                                                |

Hotkeys wirken nur ohne Strg, Cmd oder Alt; Gross- und Kleinschreibung ist egal. Dieselbe
Werkzeugtaste bei schon aktivem Werkzeug schaltet zurück zur Auswahl. Der Tooltip in der Bauleiste
nennt die Taste.

### Geschwindigkeit

⏸ / 1× / 2× / 4× in der Kopfzeile oder per Taste. Ein Tick dauert bei 1× 100 ms; alle Raten unten
gelten pro 100 Ticks.

### Karte lesen

- **Gebäude** sind gezeichnete Körper mit Wänden und Dach; Dachfarbe und Form zeigen die Art. Wohnhäuser
  wachsen mit ihrer Stufe. Ein roter Punkt heisst «nicht angebunden».
- **Arbeitsanzeige:** Betriebe, die gerade produzieren, zeigen Rauch bzw. ein Arbeitszeichen; wartende,
  volle, brennende oder nicht angebundene Betriebe stehen still.
- **Bedarfssymbole:** Über einem Wohnhaus, dem etwas fehlt, steht ein Symbol für den wichtigsten
  Mangel (Versorgung vor Ware vor Dienst), bei mehreren Mängeln mit einem Zusatzpunkt. Die Symbole
  erscheinen ab Zoom 0.75. Signale (Symbole, roter Punkt, Auswahl, Umriss beim Überfahren) liegen immer
  über allen Gebäuden, auch über verdeckenden.
- **Leben:** Auf den Wegen gehen Spaziergänger (etwa einer je 4 Einwohner, höchstens 40); über der Küste
  kreisen Möwen (nicht nachts); am Morgen und am Abend steigt aus bewohnten Häusern Herdrauch.
- **Tageslicht:** Ein Tag dauert 6000 Ticks (10 Minuten bei 1×) mit Tag, Abend, Nacht und Morgen. Die
  Karte wird am Abend warm und in der Nacht kühl-dunkel getönt; nachts leuchten die Fenster bewohnter
  Häuser und arbeitender Betriebe sowie die Laternen an Kontor und Marktplatz. Unbewohnte Häuser und
  stillstehende Betriebe bleiben dunkel, Stillstand ist also auch nachts zu sehen. Die Tönung steht bei
  Pause still und lässt sich in den Einstellungen abschalten.
- **Händlerschiff:** Solange ein Handelsauftrag läuft, liegt ein Schiff am Kontor.
- **Wasser** bewegt sich; an der Küste läuft ein Schaumsaum.

### Einstellungen, Ton und Anzeige

In der Kopfzeile stehen nur **Stumm** und **Einstellungen**. «Einstellungen» öffnet eine Karte mit:

- vier Reglern **Gesamt**, **Musik**, **Umgebung**, **Effekte** (Standard 40 %, 50 %, 70 %, 100 %);
- **Tag-Nacht** an/aus (Tönung und Fensterlicht);
- **Bewegung reduzieren:** «Auto» folgt der Systemeinstellung, «An» zeigt weniger Figuren, Möwen, Rauch,
  Regen und Flammen und halbiert die Wellen, «Aus» zeigt alles;
- **Credits** (Herkunft und Lizenz fremder Musik, Klänge und Schrift) und **Schliessen**.

Die Karte schliesst auch mit `Esc` oder einem Klick daneben. Alle Einstellungen und die Krisenstufe für
das nächste Spiel bleiben im Browser gespeichert und überstehen «Neu» und «Laden». Eine ältere Einstellung
«Lautstärke» wird zum Regler «Gesamt».

**Ton:** Er startet nach dem ersten Klick oder Tastendruck (Regel der Browser) und pausiert, solange der
Tab verborgen ist.

- **Effekte:** Klicks beim Bauen und Abreissen, Münzen bei Steuern und Verkauf, Signale für neue und
  gelieferte Aufträge, Aufstieg, Fehler und Sieg; bei Krisen Glocke (Brand), Nebelhorn (Sturmwarnung)
  und Fanfare (Boom). Wichtige Signale senken Musik und Umgebung kurz ab.
- **Umgebung:** folgt dem Bildausschnitt — Meer, Wind, Vögel am Tag, Grillen in der Nacht, Möwen an der
  Küste, Stadtgeräusch bei vielen Einwohnern im Blick; Regen, Sturm und Feuer bei Krisen. Nah gezoomt
  wird die Stadt lauter, weit gezoomt der Wind.
- **Musik:** einige Sekunden nach dem ersten Klick ein Stück passend zur Tageszeit, danach Pausen von
  30–90 s.

**Hinweis zum Stand:** Musik-, Klang- und Schriftdateien sind noch nicht eingebunden (Ruling R109: die
Quellen sind aus der Arbeitsumgebung gesperrt). Bis dahin klingt alles synthetisch (Web Audio), die Musik
fehlt, und die Schrift fällt auf eine Ersatzschrift zurück; die Credits melden «Fremde Assets sind derzeit
nicht eingebunden».

## Wirtschaft

- **Start:** 5000 Geld, 40 Holz, 20 Werkzeug, 10 Stein, 20 Nahrung.
- **Lager:** Alle Waren liegen im Kontor-Lager, höchstens 100 je Gut. Ist das Lager voll, verfällt
  neu erzeugte Ware (Zustand «Lager voll»).
- **Lagerleiste und Warenbilanz:** Die Lagerleiste in der Kopfzeile zeigt je Gut den Bestand und die
  Bilanz je 100 Ticks mit Trendpfeil (↑ / → / ↓, negative Bilanz hervorgehoben). Der Tooltip nennt
  Erzeugung und Verbrauch. Gerechnet wird nominal aus den angebundenen Betrieben und dem Bedarf der
  versorgten Häuser; Handel, Aufträge und Aufstiege zählen nicht mit.
- **Baukosten:** Geld und teils Holz, Werkzeug oder Stein; sie stehen in der Bauleiste.
- **Anbindung:** Betriebe, Marktplatz, Kapelle, Schule und Feuerwache arbeiten nur, wenn ein Weg an sie grenzt,
  der über Wege mit dem Kontor verbunden ist. Nicht angebundene Gebäude tragen einen roten Punkt.
- **Info-Panel:** zeigt Zustand (z. B. «In Betrieb», «Wartet auf Wolle», «Lager voll», «Nicht an Kontor
  angebunden»), Produktion, Fortschritt und Unterhalt.

### Produktionsketten

| Gebäude            | Erzeugt    | Braucht    | Zyklus (Ticks) | Unterhalt | Standort                        |
| ------------------ | ---------- | ---------- | -------------- | --------- | ------------------------------- |
| Fischerhütte       | Nahrung    | —          | 40             | 5         | an Wasser angrenzend            |
| Holzfäller         | Holz       | —          | 30             | 5         | mind. 1 Waldkachel im Radius 2  |
| Steinbruch         | Stein      | —          | 60             | 10        | an Gebirge angrenzend           |
| Schäferei          | Wolle      | —          | 50             | 10        | mind. 4 Graskacheln im Radius 2 |
| Weberei            | Stoff      | Wolle      | 50             | 15        | beliebiges Bauland              |
| Zuckerrohrplantage | Zuckerrohr | —          | 50             | 10        | mind. 4 Graskacheln im Radius 2 |
| Brennerei          | Rum        | Zuckerrohr | 50             | 20        | beliebiges Bauland              |
| Werkzeugmacher     | Werkzeug   | Holz       | 80             | 25        | beliebiges Bauland              |

Werkzeug gibt es am Kontor zu kaufen oder vom **Werkzeugmacher** (2×2, Baukosten 200 Geld, 15 Holz,
3 Werkzeug). Er lohnt sich erst, wenn du viel Werkzeug brauchst: Sein Unterhalt läuft auch im
Leerlauf, und Werkzeug zu verkaufen bringt weniger, als es kostet. Bauland sind Sand, Gras und Wald
ohne Gebäude oder Weg; Gebirge und Wasser sind unbebaubar.

### Handel

Kontor anklicken, dann «Handeln»: Waren in Mengen von 1 oder 10 kaufen und verkaufen.

| Gut             | Holz | Werkzeug | Stein | Nahrung | Wolle | Stoff | Zuckerrohr | Rum |
| --------------- | ---- | -------- | ----- | ------- | ----- | ----- | ---------- | --- |
| Kauf            | 10   | 40       | 15    | 8       | 12    | 30    | 12         | 40  |
| Verkauf (100 %) | 4    | 15       | 6     | 3       | 5     | 12    | 5          | 18  |

- **Kaufpreise sind fest.**
- **Verkaufssättigung:** Jede verkaufte Einheit senkt den Verkaufspreis dieses Guts um 1 Prozentpunkt,
  höchstens bis 30 %. Alle 10 Ticks erholt sich der Preis jedes Guts um 1 Prozentpunkt, bis 100 %.
  Rund 10 Einheiten je Gut und 100 Ticks lassen sich also fast zum vollen Preis verkaufen; wer das
  ganze Lager auf einmal verkauft, drückt den Preis stark (100 Holz bringen 219 statt 400). Der
  Handelsdialog zeigt je Gut «Preis … %», und jeder Verkaufsbutton nennt den genauen Erlös für seine
  Menge.
- Buttons, die sicher scheitern, sind blass, bleiben aber klickbar; ein Klick nennt den Grund («Kein
  Geld», «Zu wenig Geld», «Lager voll», «Nicht genug Ware»).

### Handelsaufträge

Ab Tick 600 und dann alle 900 Ticks bestellt ein Händler eine Ware (10 Aufträge in den ersten 15
Minuten bei 1×). Der Auftrag gilt sofort, läuft 600 Ticks und steht in der Kopfzeile: «Auftrag:
Menge, Gut · Prämie · noch N Ticks · Lager x/Menge». **Liefern** gibt die ganze Menge auf einmal ab
und bringt die Prämie — auch bei negativem Geld. Teillieferungen gibt es nicht, ein verpasster
Auftrag verfällt ohne Strafe. Ohne Auftrag zeigt die Karte «Nächster Auftrag in N Ticks».

| Gut        | ab Stufe | Menge | Prämie je Einheit |
| ---------- | -------- | ----- | ----------------- |
| Holz       | Pioniere | 20–40 | 7                 |
| Nahrung    | Pioniere | 10–20 | 6                 |
| Stein      | Siedler  | 10–20 | 11                |
| Wolle      | Siedler  | 10–20 | 9                 |
| Stoff      | Siedler  | 6–12  | 22                |
| Zuckerrohr | Bürger   | 10–20 | 9                 |
| Rum        | Bürger   | 6–12  | 30                |

Welche Waren bestellt werden, richtet sich nach der höchsten Stufe deiner Häuser. Ein Auftrag bringt
mehr als der Verkauf, aber Waren dafür zuzukaufen lohnt sich nie. Werkzeug wird nicht bestellt.

### Unterhalt und Geld

- Alle 100 Ticks wird der Unterhalt aller Gebäude abgezogen — auch nicht angebundener. Im selben Takt
  kommen die Steuern herein. Die Kopfzeile zeigt Steuern, Unterhalt und die Bilanz (Steuern minus
  Unterhalt) je 100 Ticks; eine negative Bilanz ist hervorgehoben.
- Geld darf negativ werden. Solange es negativ ist, sind Bauen, Kaufen und Aufstieg gesperrt, bis
  wieder Geld hereinkommt (Verkauf, Auftrag oder Steuern).

### Abriss

Die Hälfte der Baukosten (abgerundet) wird zurückerstattet; Waren nur, soweit im Lager Platz ist. Der
Button «Abreissen» zeigt den tatsächlichen Betrag und was am Lagerlimit verfällt (z. B. «Holz 1
(4 verfallen – Lager voll)»). Das Kontor kann nicht abgerissen werden.

## Bevölkerung

### Stufen

| Stufe    | max. Einwohner | Bedürfnisse (je Einwohner pro 100 Ticks) | Dienste         | Steuer je Einwohner pro 100 Ticks | Aufstieg kostet (Geld/Holz/Werkzeug/Stein) |
| -------- | -------------- | ---------------------------------------- | --------------- | --------------------------------- | ------------------------------------------ |
| Pioniere | 4              | Nahrung 0.5                              | —               | 2                                 | zu Siedlern: 100 / 5 / 2 / 0               |
| Siedler  | 8              | Nahrung 0.5, Stoff 0.2                   | Kapelle         | 7                                 | zu Bürgern: 300 / 10 / 5 / 5               |
| Bürger   | 15             | Nahrung 0.5, Stoff 0.2, Rum 0.2          | Kapelle, Schule | 14                                | —                                          |

Ein neues Wohnhaus startet mit einem Pionier. Die Kopfzeile zeigt die Einwohner je Stufe. Die
Steuer und die Wartezeit vor dem Aufstieg hängen zusätzlich vom Steuerregler ab (unten).

### Versorgung

Ein Wohnhaus lässt sich nur im Versorgungsradius (8) des Kontors oder eines angebundenen Marktplatzes
bauen und erhält nur dort Waren aus dem Lager. Liegt es ausserhalb, gelten alle Warenbedürfnisse als
unerfüllt.

### Bedürfnisse und Dienste

- Jedes Haus verbraucht die Waren seiner Stufe aus dem Lager. Fehlt eine Ware, ist das Bedürfnis
  unerfüllt, bis wieder eine Einheit entnommen werden kann.
- **Dienste:** Kapelle und Schule wirken im Radius 10 und nur, wenn sie per Weg angebunden sind.
- **Wachstum:** Alle 50 Ticks wächst ein Haus um einen Einwohner, wenn alle Bedürfnisse und Dienste
  seiner Stufe erfüllt sind; sonst schrumpft es um einen (mindestens einer bleibt). Liegt es über der
  Belegung der Steuerstufe (nur bei «hoch»), zieht je Takt ein Einwohner aus.

### Aufstieg

Ein Haus steigt beim nächsten Wachstumstakt auf, wenn

- es voll belegt ist,
- seine Bedürfnisse seit mindestens 300 Ticks ununterbrochen erfüllt sind (Steuerstufe «niedrig»:
  150 Ticks; «hoch»: kein Aufstieg),
- die Dienste der nächsten Stufe in Reichweite sind,
- von jeder neuen Ware der nächsten Stufe mindestens eine Einheit im Lager liegt und
- die Aufstiegskosten bezahlbar sind (sie werden dann abgezogen).

Beim Aufstieg wird von jeder neuen Ware eine Einheit aus dem Lager entnommen und direkt ans Haus geliefert.

Die Einwohnerzahl bleibt beim Aufstieg erhalten. Das Info-Panel eines Wohnhauses zeigt Einwohner,
Versorgung, Bedürfnisse mit ✓/✗, die Mängel («Mangel: …», in derselben Reihenfolge wie das
Kartensymbol), jede noch fehlende Aufstiegsbedingung und die Kosten.

### Steuern und Steuerregler

Alle 100 Ticks zahlt jedes Haus Einwohner × Steuersatz seiner Stufe. Sind nicht alle Bedürfnisse und
Dienste erfüllt, zahlt es nur die Hälfte. Die Summe aller Häuser wird mit dem Prozentsatz der
Steuerstufe verrechnet und einmal abgerundet.

Der **Steuerregler** in der Kopfzeile gilt für die ganze Insel:

| Stufe   | Steuer | Aufstieg nach | Belegung der Häuser                     |
| ------- | ------ | ------------- | --------------------------------------- |
| niedrig | 70 %   | 150 Ticks     | voll                                    |
| normal  | 100 %  | 300 Ticks     | voll                                    |
| hoch    | 130 %  | kein Aufstieg | 75 % (Pioniere 3, Siedler 6, Bürger 11) |

- Start ist «normal». Nach jedem Umschalten ist der Regler 300 Ticks gesperrt («Sperre noch N
  Ticks»); ein Klick in der Sperre nennt den Grund. Umschalten kostet nichts und geht auch bei
  negativem Geld; die neue Stufe wirkt ab dem nächsten Tick.
- «Hoch» bringt kurzfristig Geld, verfehlt auf Dauer aber das Ziel (weniger Einwohner, kein
  Aufstieg). «Niedrig» kostet Geld, lässt Häuser aber schneller aufsteigen.

## Krisen

### Krisenstufe

Neben «Neu» in der Kopfzeile wählst du «Krisen: aus · mild · normal» (Standard «normal»). Die Wahl gilt
ab dem nächsten «Neu»; das laufende Spiel behält seine Stufe, ein geladener Stand die seines Spielstands.

| Stufe  | erste Krise | danach               |
| ------ | ----------- | -------------------- |
| aus    | —           | keine Krisen         |
| mild   | Tick 2400   | alle 1200 Ticks eine |
| normal | Tick 2400   | alle 600 Ticks eine  |

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
  Fortschritt geht verloren, und das Gebäude fällt 200 Ticks aus: Ein Betrieb produziert nicht, eine Kapelle
  oder Schule liefert keinen Dienst. Der Unterhalt läuft weiter. Das Info-Panel zeigt «Brennt — wieder in
  Betrieb in N Ticks» und «Erzeugt X nicht — Betrieb brennt». Die Warenbilanz in der Kopfzeile bleibt bei
  der Dauerleistung, sie zeigt keine kurzen Ausfälle.
- Auf der Karte brennt das Gebäude mit Flammen, Rauch und Glut; ein pulsierender Warnring markiert es. Nach
  dem Löschen zieht noch kurz Rauch ab.

### Sturm

Ein Sturm wird 200 Ticks vorher angekündigt (Himmel verdunkelt sich, Wind im Ton, Nebelhorn) und dauert
dann 300 Ticks. Fischerhütte, Holzfäller, Schäferei und Zuckerrohrplantage arbeiten im Sturm mit halber
Leistung. Auf der Karte: dunklere Tönung, Regen, höhere Wellen und dunkle Bildränder.

### Boom

Ein Händler zahlt 300 Ticks lang **+50 %** auf den Verkaufspreis eines Guts (aus dem Auftragspool deiner
höchsten Stufe). Der Handelsdialog markiert das Gut mit «Boom +50 %», die Verkaufsbuttons zeigen den
Erlös inklusive Boom; die Sättigung wirkt weiter. Über dem Kontor dreht sich eine Münze. Zukaufen und im
Boom verkaufen lohnt sich nie, und ein Auftrag bringt je Einheit immer mehr als der Boom.

### Krisenkarte und Ereignis-Log

- Die **Krisenkarte** in der Kopfzeile neben dem Auftrag zeigt «Krisen: aus», «Krisen: normal · nächste Krise
  in N Ticks» oder die laufende Krise mit Restzeit (z. B. «Brand: Weberei · Ausfall noch N Ticks ·
  Instandsetzung 200», «Sturmwarnung: Sturm in N Ticks …», «Boom: Rum +50 % Verkaufspreis · noch N Ticks»).
- Das **Ereignis-Log** schwebt unten links über der Karte, sobald es Einträge gibt. Eingeklappt zeigt es
  nur den neuesten Eintrag; «Ereignisse ▸» klappt die letzten 10 auf («Tick t · …»). Es gehört nicht zum
  Spielstand und ist nach «Neu» und «Laden» leer. Wichtige Ereignisse erscheinen zusätzlich als Meldung.

## Speichern, Laden, Neu

- **Speichern:** legt den Spielstand im Browser ab (ein Speicherplatz, nur in diesem Browser).
- **Autosave:** Alle 2 Minuten laufenden Spiels (Pause zählt nicht) speichert das Spiel zusätzlich in
  einen eigenen Autosave-Platz. Scheitert das, erscheint einmal eine Meldung; das Spiel läuft weiter.
- **Laden:** Gibt es nur einen ladbaren Stand, lädt «Laden» ihn direkt; gibt es beide, erscheint eine
  Auswahl («Gespeichert — Tick …», «Autosave — Tick …», «Abbrechen»). Ist ein Stand beschädigt oder
  fehlt er, erscheint eine Meldung und das laufende Spiel bleibt unverändert. Hat das Spiel schon
  begonnen, fragt der Button zuerst «Wirklich laden?» (zweimal klicken). Laden behält das Tempo; die
  Kamera bleibt, wenn der Stand dieselbe Karte hat, sonst springt sie zum Kontor.
- **Hinweis beim Start:** liegt ein Spielstand vor, weist eine Meldung auf «Laden» hin.
- **Neu:** zweimal klicken — der Button fragt «Wirklich neu?» —, dann entsteht eine neue Insel mit
  Tempo 1× und der gewählten Krisenstufe. Der Autosave bleibt, bis der nächste ihn überschreibt. Die
  Nummer der Karte steht als kleine Zeile in der Kopfzeile unter der Lagerleiste («Karte: …»).
- Spielstände älterer Versionen (vor M5 bzw. vor M6) lassen sich laden und werden danach im neuen Format
  gespeichert; Stände von vor M6 spielen mit Krisenstufe «aus».

## Entwicklung

Voraussetzung: Node ≥ 22.

```bash
make help      # Alle Befehle anzeigen
make install   # Abhängigkeiten installieren
make dev       # Dev-Server starten
make check     # Lint, Tests und Build wie in der CI
```

Studio-Dashboard (lokal, nicht Teil des Spiels; Python 3, nur Standardbibliothek):

```bash
make studio          # Dashboard starten und URL ausgeben
make studio-stop     # Dashboard stoppen
make studio-archive  # Events archivieren, Dashboard startet leer
make studio-metrics  # Aufwand und Qualität der letzten Session nach docs/studio/metriken/ verdichten
make studio-test     # Tests der Studio-Werkzeuge
```

Der Browser öffnet das Dashboard automatisch beim ersten Subagenten-Start einer Session (Opt-out: `STUDIO_NO_BROWSER=1`).

Jede Session in diesem Repo ist der Projektleiter und arbeitet ohne Rückfragen nach der
[Verfassung](docs/studio/VERFASSUNG.md) (nur du änderst sie). Was nur du entscheiden kannst, steht
mit Empfehlung in der [Warteschlange](docs/studio/warteschlange.md) — antworte, wann du willst.

## Dokumentation

Einstieg: [`docs/index.md`](docs/index.md) — Architektur (arc42), Specs, Pläne, ADRs, Beobachtungen.
