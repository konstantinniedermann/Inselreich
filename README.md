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

Lass **50 Bürger** auf deiner Insel leben. Gezählt werden die Einwohner aller Wohnhäuser der Stufe Bürger und
höher. Ist das Ziel erreicht, erscheint eine Meldung und das Spiel läuft weiter. Der Chip «Ziel» in der
Kopfzeile («Ziel n / 50 Bürger») zeigt den Fortschritt; der Ausblick «Danach: Kaufleute — Handelsstadt 60» (danach «Gewürzstadt», siehe Seefahrt) steht
in der Inselchronik und im Tooltip des Ziel-Chips.

Mit dem Bürger-Ziel werden die vierte Stufe **Kaufleute**, das **Badehaus**, die **Glashütte** und die **Seefahrt**
frei (Meldung «Neu freigeschaltet: Badehaus (J), Glashütte (O) und Seefahrt (Inseln: 9) — deine Bürger wollen
Kaufleute werden; Kaufleute brauchen Gewürz von fernen Inseln»). Das zweite Ziel heisst **Handelsstadt**: 60
Kaufleute. Ist es erreicht, erscheint «Zweites Ziel erreicht: 60 Kaufleute! Das Spiel läuft weiter.».

Das dritte Ziel heisst **Gewürzstadt**: **80 Kaufleute**, die **600 Ticks (60 s)** lang voll versorgt sind, und das
Gewürz kommt per Schiff von deiner eigenen Plantage — es muss ein Schiff mit einer Route fahren, die Gewürz von einer
Fremdinsel mit Gewürzplantage in die Heimat holt. Der Chip «Ziel» zeigt «Ziel n / 80 Kaufleute mit Gewürz»; fehlt die
Schiffsroute, steht «Fehlt: Schiffsroute, die Gewürz von deiner Plantage heimholt» in der Inselchronik. Ist es
erreicht, erscheint «Drittes Ziel erreicht: Gewürzstadt mit 80 Kaufleuten! Das Spiel läuft weiter.»; danach spielst
du frei weiter («Gewürzstadt · n Kaufleute»).

### Denkmal (Wahlziel)

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

## Bedienung

### Start, Menü und Hilfe

- **Startkarte:** Beim Laden der Seite liegt über einer neuen, noch stehenden Insel («Pausiert») eine Karte
  mit dem Ziel und drei ersten Schritten: ein Wohnhaus nahe dem Kontor bauen, Fischerhütte am Wasser und
  Holzfäller am Wald bauen, die Betriebe mit einem Weg zum Kontor verbinden (oder im Info-Panel «Anbinden»; Wohnhäuser brauchen keinen Weg).
  Knöpfe: «Fortsetzen — Autosave (Spielzeit m:ss)», «Gespeichertes Spiel laden (Spielzeit m:ss)» und «Neue
  Insel» bzw. «Los geht's», wenn es nichts zu laden gibt. `Esc` oder ein Klick daneben löst den hervorgehobenen
  Knopf aus. Gibt es einen Stand, fragt «Neue Insel» zuerst nach («Ja, neue Insel» / «Abbrechen»). Ist ein
  Spielstand beschädigt, stammt er aus einer neueren Version oder ist der Browser-Speicher gesperrt, steht darunter ein Hinweis. Nach dem Laden ist das
  Spiel **pausiert** («Pausiert — P oder 1× setzt fort»).
- **Menü** (Knopf «Menü» rechts in der Kopfzeile; das Spiel läuft dahinter weiter): **Speichern**, **Laden**
  (Liste der Stände mit Spielzeit, darüber der Hinweis «Ungespeicherter Fortschritt geht verloren»),
  **Neue Insel** (mit «Krisen: aus · mild · normal» für die neue Insel und Rückfrage), die **Kartennummer**,
  **Ziel und erste Schritte** (die Startkarte als Hilfe) und die **Tastenkürzel**. `Esc`, «Schliessen» oder ein
  Klick daneben schliesst; der Fokus geht zurück an «Menü». Bei offener Karte ruhen Hotkeys, Tempo-Tasten und
  Kartenschwenken; mit `Tab` springt der Fokus nur zwischen den Elementen der Karte.
- **Inselchronik:** Ist nichts ausgewählt, zeigt das Panel rechts die Chronik: Ziel mit Fortschritt und
  Stufenpfad, den **nächsten Schritt** («Baue ein Wohnhaus (H) nahe dem Kontor», «Verbinde … per Weg …»; bei leerem Lager vor neuen Gütern «Nahrung ist aufgebraucht: baue mehr Fischerhütte (F) oder kaufe Nahrung am Kontor», bei Kasse im Minus «Deine Kasse schrumpft: …»),
  die Zeile **Wahlziel** zum Denkmal (erst nach dem Kaufleute-Ziel: «Wahlziel: Denkmal bauen (Öffentlich)», «Denkmal: Abschnitt n/3 · x %», «Denkmal: n/3 fertig», am Ende «Wahlziel erreicht: Das Denkmal steht»), die Wirkung der Steuerstufe (bei unterschiedlichen Reglern «Steuer gemischt: P niedrig · S normal · …») und aufklappbar die **Kartenzeichen** (Bedeutung der Symbole auf der Karte).
- **Cursor-Hinweis:** Beim Bauen, Wegbauen, Abreissen und Auswählen hängt ein kleines Schild am Zeiger. Es
  sagt, ob der Standort passt («Baubar · wird an den Kontor angebunden», «Baubar · danach mit Weg (R) zum
  Kontor verbinden») oder warum nicht (über Wasser oder Gebirge nennt es das Gelände, «Kein Bauland: Gebirge», über einem Gebäude oder Weg, was dort steht, «Platz belegt: Wohnhaus»; dieselbe Meldung erscheint beim Klick), was ein Abriss zurückgibt und — bei der Auswahl — den Zustand des
  Gebäudes unter dem Zeiger. Bei der Auswahl ersetzt die Mouse-over-Karte das Schild, sobald sie erscheint; ein Kachelwechsel, Ziehen oder ein anderes Werkzeug bringen das Schild sofort zurück. Über leerem Boden und bei offener Karte erscheint kein Schild.
- **Esc-Reihenfolge:** Eine offene Karte schliesst zuerst (bei gestapelten Karten die oberste). Sonst
  legt `Esc` das Werkzeug ab, schliesst die Einträge-Leiste der Bauleiste und das Panel und führt zurück zur
  Auswahl. `Esc` wirkt auch, wenn gerade ein Knopf den Fokus hat.

### Kamera

Die Karte ist isometrisch: Jede Kachel ist eine Raute, die Kachel oben in der Ecke ist der Kartenursprung.
Gebäude, Bäume und Figuren haben Höhe; was weiter vorn steht, verdeckt, was dahinter steht.

- **Zoomen:** Mausrad (Stufen 1/8 bis 2); auf Touch mit zwei Fingern (Pinch). Bei 1/8 ist die ganze Inselwelt zu
  sehen. Ab Zoom 1/4 zeigt die Karte nur noch Gelände ohne Figuren, Tiere, Rauch und Wellen.
- **Ferne Inseln:** Neben deiner Insel liegen drei weitere: die Möweninsel, die Felsbucht und Weidenau. Fährst du mit dem
  Mauszeiger über eine von ihnen, nennt eine Karte Name, Grösse, Merkmale (samt Inselvorteil, siehe «Seefahrt und Gewürz») und Fahrzeit. Bauen kannst du dort noch nicht;
  du siehst sie nur.
- **Verschieben:** mittlere Maustaste ziehen, Leertaste halten und mit der linken Maustaste ziehen (die Leertaste nur kurz antippen pausiert dagegen), im
  Werkzeug «Auswahl» einfach mit der linken Maustaste ziehen (ab 4 Pixel Bewegung schwenkt die Karte, es wird
  nichts ausgewählt) — oder WASD/Pfeiltasten; diese wirken auch, wenn nach einem Klick ein Knopf den
  Fokus hat (nicht in Eingabefeldern und nicht bei offener Karte).
- **Verschieben auf Touch:** Zwei Finger verschieben die Karte in jedem Werkzeug, ein Finger im Werkzeug
  «Auswahl».

### Werkzeuge (Bauleiste unten)

- **Auswahl:** Ein Klick (Drücken und Loslassen auf derselben Stelle) auf ein Gebäude öffnet das Info-Panel. Getroffen wird der sichtbare Gebäudekörper
  (Wände und Dach), nicht nur die Bodenkachel; steht ein Gebäude hinter einem höheren, wählt ein Klick auf
  seinen sichtbaren Teil trotzdem dieses Gebäude. Beim Überfahren zeigt ein Umriss, was getroffen wird.
- **Weg:** klicken oder mit gedrückter Maustaste über mehrere Kacheln ziehen; massgeblich ist die
  Bodenkachel unter dem Zeiger.
- **Gebäude:** In der Bauleiste eine **Kategorie** wählen (Infrastruktur, Wohnen, Produktion, Öffentlich); darüber
  öffnet sich eine Leiste mit den Einträgen samt Kosten. Sie bleibt offen, solange ein Werkzeug dieser Kategorie
  aktiv ist, und schliesst mit `Esc`, «Auswahl» oder erneutem Klick auf die Kategorie; ein Bau-Hotkey öffnet sie
  mit. Per `Tab` erreichst du nach dem letzten Kategorie-Knopf die Einträge der offenen Kategorie (`Shift+Tab` läuft zurück), `Enter` wählt. Dann auf die Karte klicken. Der
  Zeiger liegt über der Mitte der Grundfläche; ein halbtransparenter Geist zeigt das Gebäude. Die
  Grundfläche ist grün, wenn der Standort passt, sonst rot; der Grund erscheint als Meldung. Nicht
  bezahlbare Gebäude sind gedämpft mit gestrichelter Kante dargestellt, ein Klick nennt den Grund.
- **Abriss:** Werkzeug wählen, dann auf einen Gebäudekörper klicken (reisst dieses Gebäude ab) oder über Wege
  ziehen (reisst nur Wege ab, Gebäude bleiben stehen) — oder im Info-Panel «Abreissen» (Knopf oder Taste `Entf` / `Rücktaste` für das markierte Gebäude). Beim **Denkmal** mit begonnenem Fortschritt fragt der Knopf erst «Wirklich abreissen? Fortschritt geht verloren»; erst der zweite Klick (oder zweite Druck von `Entf` / `Rücktaste`) reisst ab. Das Abriss-Werkzeug auf der Karte überspringt es («Denkmal nur im Panel abreissen»).
- **Wann eine Aktion wirkt:** Mit der Maus wirken Bauen, Weg und Abriss sofort beim Drücken, auf dem Ziel
  unter dem Zeiger (der Abriss-Zug über Wege wirkt wie der Weg-Zug sofort je Kachel); die **Auswahl** erst beim Loslassen und nur, wenn der Zeiger nie weiter als 4 Pixel vom
  Druckpunkt wegwanderte (sonst war es ein Schwenken). Auf Touch beim Loslassen, aber auf der Kachel, auf die der Finger zuerst getippt hat — und nur, wenn
  kein zweiter Finger dazukam und nicht verschoben wurde.
- **Tooltips:** Ein Eintrag der Bauleiste zeigt beim Überfahren, bei Tastaturfokus oder bei langem
  Drücken auf Touch (0,5 s) Name und Taste, Kosten, Unterhalt, was er erzeugt und braucht, die
  Standortregel, den Radius und — falls gesperrt — den Grund.
- **Radiusanzeige beim Platzieren:** Wohnhaus zeigt den Umriss der versorgten Fläche; Marktplatz,
  Kapelle, Schule und Feuerwache zeigen ihren Wirkkreis (in der Isometrie eine Ellipse) um die Vorschau
  und den Umriss der schon abgedeckten Fläche; Holzfäller, Jagdhütte, Rinderfarm, Schäferei und Zuckerrohrplantage
  zeigen den Standortkreis (Radius 2, bei Jagdhütte und Rinderfarm 3) mit den passenden Wald- bzw. Graskacheln.
- **Fest feiern** (ab U4, Rum freigeschaltet): Im Panel einer Kapelle kostet «Fest feiern (10 Rum)» 10 Rum aus dem
  Lager. Während des Fests (1 Minute Spielzeit) steigen Wohnhäuser im Wirkkreis der Kapelle auf derselben Insel schneller auf; im
  Haus-Panel steht dann «Fest: schnellerer Aufstieg». Danach sperrt eine Abklingzeit (3 Minuten ab Festbeginn), der Knopf zeigt «Nächstes
  Fest in m:ss». Ohne Wirkung, wenn im Umkreis auf der Insel der Kapelle kein Haus mit Steuer «normal» wohnt; eine abgelehnte Aktion nennt den Grund.
- **Badehaus** (Kategorie «Öffentlich», Taste `J`): 2×2, Baukosten 500 Geld, 30 Holz, 10 Werkzeug, 20 Stein,
  Unterhalt 180 / min, Dienst «Hygiene» im Radius 10 (für Kaufleute). **Glashütte** (Kategorie «Produktion», Taste
  `O`): siehe «Produktionsketten». Beide sind erst nach dem Bürger-Ziel baubar; vorher fehlen sie in der Bauleiste,
  und ihre Taste nennt nur den Grund («Badehaus: Erst nach dem Ziel (50 Bürger)»).
- **Feuerwache** (Kategorie «Öffentlich», Taste `E`): 1×1, Baukosten 150 Geld, 10 Holz, 2 Werkzeug,
  Unterhalt 60 / min. Angebunden löscht sie Brände an brennbaren Gebäuden, deren Mitte höchstens 8 Kacheln von
  ihr entfernt ist (Abschnitt «Krisen»). Bei Krisenstufe «aus» kostet sie nur Unterhalt. Ihr Tooltip nennt,
  wie viele brennbare Gebäude noch ungeschützt sind; das Info-Panel zeigt «Schützt N brennbare Gebäude».

### Tastatur und Maus

| Eingabe                | Wirkung                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| WASD / Pfeiltasten     | Karte verschieben                                                                                                                         |
| Leertaste antippen     | Pause an/aus (wie `P`)                                                                                                                    |
| Leertaste halten       | Mit gedrückter linker Maustaste die Karte verschieben                                                                                     |
| `Esc` oder Rechtsklick | Zurück zum Werkzeug «Auswahl», Panel zu, löscht auch die Lager-Markierung (`Esc` auch bei Knopffokus)                                     |
| Mausrad                | Zoomen                                                                                                                                    |
| `P`                    | Pause an/aus (setzt danach das letzte Tempo fort)                                                                                         |
| `Umschalt` + `U`       | Markiertes Gebäude ausbauen (wie «Ausbauen», erst nach der Freischaltung)                                                                 |
| `Entf` / `Rücktaste`   | Markiertes Gebäude abreissen (wie «Abreissen» im Info-Panel)                                                                              |
| `Strg`/`Cmd` + `S`     | Spiel speichern (wie Menü → «Speichern»)                                                                                                  |
| `Cmd`/`Strg` + Klick   | Gebäudetyp unter dem Zeiger als Bauwerkzeug wählen (Pipette)                                                                              |
| `1` / `2` / `3`        | Tempo 1× / 2× / 4× (hebt die Pause auf)                                                                                                   |
| `R` / `X`              | Weg / Abriss                                                                                                                              |
| `H` / `M` / `K` / `U`  | Wohnhaus / Marktplatz / Kapelle / Schule                                                                                                  |
| `F` / `L` / `B` / `G`  | Fischerhütte / Holzfäller / Steinbruch / Schäferei                                                                                        |
| `V` / `Z` / `N` / `T`  | Weberei / Zuckerrohrplantage / Brennerei / Werkzeugmacher                                                                                 |
| `E`                    | Feuerwache                                                                                                                                |
| `I`                    | Amtsstube (erst ab U3, höchstens eine)                                                                                                    |
| `C` / `Q`              | Roden / Aufforsten (erst ab U2)                                                                                                           |
| `Y`                    | Jagdhütte (erst ab U2); die Rinderfarm hat keine Taste                                                                                    |
| `?`                    | Hilfe (Karte mit Legende und Freischaltungen)                                                                                             |
| `.` / `,`              | Zum nächsten / vorigen Problem springen (öffnet das Info-Panel, Werkzeug bleibt); bei aktiver Lager-Markierung durch die Gebäude des Guts |
| `J` / `O`              | Badehaus / Glashütte (erst nach dem Bürger-Ziel)                                                                                          |
| `0` / `9`              | Kamera zur Heimat / zur nächsten Insel (erst mit der Seefahrt)                                                                            |

Die Werkzeugtasten wirken nur ohne Strg, Cmd oder Alt; Gross- und Kleinschreibung ist egal. Ausnahmen sind `Strg`/`Cmd` + `S` (Speichern; der Browser-Dialog «Seite speichern» wird im Spiel unterdrückt, Varianten mit `Umschalt` oder `Alt` bleiben dem Browser), `Umschalt` + `U` (Ausbau; `U` allein bleibt die Schule) und `Cmd`/`Strg` + Linksklick auf ein Gebäude (Pipette; auf dem Mac ist `Cmd` + Klick der Hauptweg, `Strg` + Klick geht auch). Die Pipette wirkt in jedem Werkzeug, beim Kontor meldet sie, dass es sich nicht nachbauen lässt. Leertaste halten und Ziehen hat Vorrang vor der Pipette. Dieselbe
Werkzeugtaste bei schon aktivem Werkzeug schaltet zurück zur Auswahl. Der Tooltip in der Bauleiste
nennt die Taste; alle Kürzel stehen auch im Menü unter «Tastenkürzel». Bei offener Karte (Start, Menü,
Einstellungen) sind alle Kürzel stumm. Auf einem fokussierten Knopf aktiviert die Leertaste den Knopf.

Probleme sind, nach Dringlichkeit: nicht angebundene Gebäude und Häuser ausserhalb der Versorgung, stehende Betriebe (wartet auf Ware, kein Wald, kein Dienst), Häuser ohne Dienst, fehlende Waren (ein Eintrag je Gut und Insel). Innerhalb einer Klasse kommt zuerst die Insel, auf der du gerade bist, dann die übrigen Inseln, dann der nähere Eintrag. Die Meldung zählt mit («Problem 2 von 5: …»); ohne Problem: «Alles versorgt, kein Problem offen». «Lager voll» und Brände zählen nicht.

### Geschwindigkeit

⏸ / 1× / 2× / 4× in der Kopfzeile oder per Taste. Die Zeitangaben in dieser Anleitung gelten bei 1×; die
Tooltips von 2× und 4× sagen, wie viel schneller die Spielzeit läuft.

### Karte lesen

- **Gebäude** sind gezeichnete Körper mit Wänden und Dach; Dachfarbe und Form zeigen die Art. Wohnhäuser
  wachsen mit ihrer Stufe. Ein roter Punkt heisst «nicht angebunden». Jagdhütte und Rinderfarm haben eigene
  Formen. Ausgebaute Betriebe tragen einen Anbau vorn links (Stufe 2) bzw. Anbau, Steinsockel und Fahne
  (Stufe 3).
- **Arbeitsanzeige:** Betriebe, die gerade produzieren, zeigen Rauch bzw. ein Arbeitszeichen; wartende,
  volle, brennende oder nicht angebundene Betriebe stehen still.
- **Fortschrittsring und Marken:** Über jedem Betrieb zeigt ein Ring den Zyklus (grün, solange er läuft; grau
  bei Stillstand). Ein durchgestrichener Baum heisst «kein freier Wald in der Nähe».
- **Bedarfssymbole:** Über einem Wohnhaus, dem etwas fehlt, steht ein Symbol für den wichtigsten
  Mangel (ausserhalb der Versorgung vor Ware vor Dienst), bei mehreren Mängeln mit einem Zusatzpunkt. Die Symbole
  erscheinen ab Zoom 0.75. Signale (Symbole, roter Punkt, Auswahl, Umriss beim Überfahren) liegen immer
  über allen Gebäuden, auch über verdeckenden.
- **Leben:** Auf den Wegen gehen Spaziergänger (etwa einer je 4 Einwohner, höchstens 40); über der Küste
  kreisen Möwen (nicht nachts); am Morgen und am Abend steigt aus bewohnten Häusern Herdrauch.
- **Tageslicht:** Ein Tag dauert 10 Minuten mit Tag, Abend, Nacht und Morgen. Die
  Karte wird am Abend warm und in der Nacht kühl-dunkel getönt; nachts leuchten die Fenster bewohnter
  Häuser und arbeitender Betriebe sowie die Laternen an Kontor und Marktplatz. Unbewohnte Häuser und
  stillstehende Betriebe bleiben dunkel, Stillstand ist also auch nachts zu sehen. Die Tönung steht bei
  Pause still und lässt sich in den Einstellungen abschalten.
- **Händlerschiff:** Solange ein Handelsauftrag läuft, liegt ein Schiff am Kontor.
- **Wasser** bewegt sich; an der Küste läuft ein Schaumsaum.

### Einstellungen, Ton und Anzeige

In der Kopfzeile stehen rechts **Steuer**, Tempo, **Stumm**, **Einstellungen** und **Menü**. «Einstellungen» öffnet eine Karte mit:

- vier Reglern **Gesamt**, **Musik**, **Umgebung**, **Effekte** (Standard 40 %, 50 %, 70 %, 100 %);
- **Tag-Nacht** an/aus (Tönung und Fensterlicht);
- **Bewegung reduzieren:** «Auto» folgt der Systemeinstellung, «An» zeigt weniger Figuren, Möwen, Rauch,
  Regen und Flammen und halbiert die Wellen, «Aus» zeigt alles;
- **Credits** (Herkunft und Lizenz fremder Musik, Klänge und Schrift) und **Schliessen**.

Die Karte schliesst auch mit `Esc` oder einem Klick daneben. Alle Einstellungen und die Krisenstufe für
die nächste Insel bleiben im Browser gespeichert und überstehen «Neue Insel» und «Laden». Eine ältere Einstellung
«Lautstärke» wird zum Regler «Gesamt».

**Ton:** Er startet nach dem ersten Klick oder Tastendruck (Regel der Browser) und pausiert, solange der
Tab verborgen ist.

- **Effekte:** Klicks beim Bauen und Abreissen, Münzen bei Steuern und Verkauf, Signale für neue und
  gelieferte Aufträge, Aufstieg, Fehler und Sieg; bei Krisen Glocke (Brand), Nebelhorn (Sturmwarnung)
  und Fanfare (Boom); beim Erreichen des Wahlziels Denkmal läutet die Glocke. Wichtige Signale senken Musik und Umgebung kurz ab.
  Geht ein Gut aus, das deine Häuser brauchen, ertönt ein tiefer Doppelton (je Gut höchstens einmal pro
  Minute; Krisensignale haben Vorrang). Betriebe in Kameranähe geben beim Fertigstellen einer Lieferung ein
  leises Arbeitsgeräusch von sich (Klopfen, Tick, Plätschern), nie dichter als etwa einmal pro Sekunde.
  Beides hängt am Effekte-Regler.
- **Umgebung:** folgt dem Bildausschnitt — Meer, Wind, Vögel am Tag, Grillen in der Nacht, Möwen an der
  Küste, Stadtgeräusch bei vielen Einwohnern im Blick; Regen, Sturm und Feuer bei Krisen. Nah gezoomt
  wird die Stadt lauter, weit gezoomt der Wind.
- **Musik:** einige Sekunden nach dem ersten Klick ein Stück passend zur Tageszeit, danach Pausen von
  30–90 s.

**Herkunft von Musik, Klang und Schrift:** Die Musikstücke, Umgebungsklänge, Signaltöne und die Schrift
EB Garamond sind offen lizenzierte Dateien unter `public/` (Nachweis je Datei in `docs/CREDITS.md`,
Lizenztexte in `docs/licenses/`). Die Credits stehen im Spiel unter **Einstellungen → Credits**. Fehlt eine
Datei oder lädt sie nicht, klingt die Schicht synthetisch weiter, und die Schrift fällt auf eine
Ersatzschrift zurück.

## Freischaltung, Wirtschaft, Bevölkerung und Krisen

Die Regeln mit allen Zahlen stehen in [`docs/spielwerte.md`](docs/spielwerte.md):

- Freischaltung Schritt für Schritt (inkl. Edikte)
- Wirtschaft: Produktionsketten, Handel, Handelsaufträge, Seefahrt und Gewürz, Unterhalt, Stilllegen, Abriss
- Bevölkerung: Stufen, Versorgung, Bedürfnisse, Aufstieg, Steuern
- Krisen: Krisenstufe, Brand und Feuerwache, Sturm, Boom, Krisenkarte

## Speichern, Laden, Neue Insel

- **Speichern:** Menü → «Speichern» legt den Spielstand im Browser ab (ein Speicherplatz, nur in diesem
  Browser). `Strg`/`Cmd` + `S` speichert auf demselben Weg in denselben Platz.
- **Autosave:** Alle 2 Minuten laufenden Spiels (Pause zählt nicht) speichert das Spiel zusätzlich in
  einen eigenen Autosave-Platz, und beim Verlassen oder Schliessen der Seite ein weiteres Mal (still, nur
  wenn das Spiel schon begonnen hat). Scheitert das periodische Speichern, erscheint einmal eine Meldung;
  das Spiel läuft weiter.
- **Laden:** Menü → «Laden» zeigt die vorhandenen Stände («Autosave — Spielzeit m:ss», «Gespeichert —
  Spielzeit m:ss»); ein Klick lädt. Ist ein Stand beschädigt oder fehlt er, erscheint eine Meldung und das
  laufende Spiel bleibt unverändert. Ungespeicherter Fortschritt geht verloren (Hinweis über der Liste).
  Ein geladenes Spiel **pausiert**; `P` oder `1×` setzt es fort. Die Kamera bleibt, wenn der Stand dieselbe
  Karte hat, sonst springt sie zum Kontor.
- **Beim Start:** Die Startkarte bietet den Autosave («Fortsetzen») und den gespeicherten Stand an.
- **Neue Insel:** Menü → «Neue Insel» fragt zuerst «Neue Insel beginnen?» (Ja / Abbrechen), dann entsteht
  eine neue Insel mit Tempo 1× und der gewählten Krisenstufe. Der Autosave bleibt, bis der nächste ihn
  überschreibt. Die Kartennummer steht im Menü («Karte …»).
- **Spielstand-Version 13** (dritte Fremdinsel Weidenau): Ältere Stände laden weiter und werden über die Migrationskette ergänzt; die Fremdinsel «Weidenau» kommt beim Laden dazu (ohne Kontor). Ein Stand aus einer neueren Version wird mit Hinweis («Unbekannte Version») abgewiesen; das laufende Spiel bleibt unverändert.
- Spielstände vom Stand vor der Seefahrt (Version 8) lassen sich laden: Sie bekommen je Kaufmannshaus 10 Gewürz
  (höchstens 100) im Heimatlager als Übergang und eine einmalige Meldung.
- Spielstände älterer Versionen (vor M5 bzw. vor M6) lassen sich laden und werden danach im neuen Format
  gespeichert; Stände von vor M6 spielen mit Krisenstufe «aus».

## Entwicklung

Voraussetzung: Node ≥ 22.

```bash
make help      # Alle Befehle anzeigen
make install   # Abhängigkeiten installieren
make hooks     # Git-Hook aktivieren: Prettier-Check der gestagten Dateien beim Commit
make dev       # Dev-Server starten
make check     # Lint, Tests und Build wie in der CI (lokal mit Testsperre: Abbruch `testlock: ABBRUCH`, Exit 3, bei belegter Sperre oder Load > 8; auf CI aus)
```

Der Testlauf (`make test`, `make check`) hat zwei Gruppen: erst alle Tests parallel, danach die
Zeittests (Tests, die Wandzeit messen) allein und seriell, damit sie unter Last nicht flackern.
`make zeittests` findet Tests mit `performance.now(` oder `Date.now(`, die in der Liste `ZEITTESTS`
in `vite.config.ts` fehlen, und lässt `make check` dann scheitern. Neuer Zeittest: Schwelle über
`perfBudget` ableiten und die Datei in `ZEITTESTS` eintragen.

`make messfenster` prüft vor einer Leistungsmessung die Last und fremde vitest-, vite- und Headless-Chrome-Prozesse
(Ausgabe `Messfenster frei` oder `belegt: …`). Eine Messserie startet man mit
`make messfenster ARGS="--run -- node tools/render-qa/perf.mjs ..."`; sie läuft nur bei freiem Fenster und unter `caffeinate -i`.

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
