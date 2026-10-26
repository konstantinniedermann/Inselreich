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

Das Denkmal als Wahlziel steht in [`docs/spielwerte.md`](docs/spielwerte.md#denkmal-wahlziel).

## Bedienung

### Start, Menü und Hilfe

- **Startkarte:** Beim Laden der Seite liegt über einer neuen, noch stehenden Insel («Pausiert») eine Karte
  mit dem Ziel und drei ersten Schritten: ein Wohnhaus nahe dem Kontor bauen, Fischerhütte am Wasser und
  Holzfäller am Wald bauen, die Betriebe mit einem Weg zum Kontor verbinden (oder im Info-Panel «Anbinden»; Wohnhäuser brauchen keinen Weg).
  Knöpfe: «Fortsetzen — Autosave (Spielzeit m:ss)», bei zwei Autosave-Ständen «Davor laden — Autosave (Spielzeit m:ss)», «Gespeichertes Spiel laden (Spielzeit m:ss)» und «Neue
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
  Mauszeiger über eine von ihnen, nennt eine Karte Name, Grösse, Merkmale (samt Inselvorteil, siehe «Seefahrt und Gewürz» in [`docs/spielwerte.md`](docs/spielwerte.md#seefahrt-und-gewürz)) und Fahrzeit. Bauen kannst du dort noch nicht;
  du siehst sie nur.
- **Inselmarkt:** Jede Fremdinsel zahlt für ein Konsumgut 30 % mehr (Möweninsel Stoff, Felsbucht Rum, Weidenau Glas), aber nur am Kontor dort; die Karte
  zeigt «Markt: Glas +30 %», der Handelsdialog die Marke «Vorliebe +30 %». Ein Boom auf demselben Gut gilt statt der Vorliebe, nie beide zusammen.
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
  Bodenkachel unter dem Zeiger. Mit **`Umschalt` beim Aufsetzen** zieht man eine gerade oder L-förmige Strecke
  (längerer Schenkel zuerst): Die Vorschau zeigt neue Kacheln, Gesamtkosten und blockierte Kacheln; gebaut wird
  beim Loslassen. Reicht das Geld nicht, wird bis zur letzten bezahlbaren Kachel gebaut (mit Grund). `Esc`
  beendet nur den Zug, ohne etwas zu bauen; das Werkzeug «Weg» bleibt gewählt. Ein Rechtsklick beendet nur den Zug;
  erst ein zweiter Rechtsklick legt das Werkzeug ab.
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
- **Bilanz in der Kopfzeile:** Der Chip zeigt Einnahmen und Unterhalt getrennt, z. B. «+540 / −780» je Minute (ab 10 000 gekürzt, z. B. «12,3k»). Die Netto-Bilanz («Bilanz −240 / min») steht an erster Stelle im Tooltip, darunter Steuern und Unterhalt mit vollen Zahlen. Ist der Unterhalt höher als die Einnahmen, färbt sich der Chip rot; ein Klick öffnet weiter die Unterhaltskarte.
- **Kasse leer:** Sinkt das Geld bei negativer Bilanz (Steuern kleiner als Unterhalt), nennt der Tooltip des Geld-Chips «Kasse leer in ≈ 4:10 bei −12 / min (ohne Handel und Aufträge)»; die Zeit ist Spielzeit, auf 10 Sekunden gerundet, Handel, Aufträge und Bauvorhaben sind nicht eingerechnet. Ab 3:00 färbt sich der Chip gelb, ab 1:00 rot (mit fetter Schrift); bei Geld 0 oder weniger steht «Kasse ist leer …». Die Zahl im Chip bleibt «Geld n».
- **Bilanz danach:** Der Tooltip eines Betriebs oder Dienstes in der Bauleiste nennt «Bilanz danach: +120 → +95 / min» (Bilanz heute gegen Bilanz nach dem Bau, inselübergreifend wie die Kopfzeile); beim Wohnhaus «→ bis zu … (Steuer bei voller Belegung)». Die Ausbau-Karte im Info-Panel zeigt dieselbe Zeile für die nächste Stufe. Der Aufstieg eines Hauses ist darin noch nicht eingerechnet.
- **Bestand im Bau-Tooltip:** Der Tooltip eines Bauleisten-Eintrags nennt unter der Bilanz, wie viele Gebäude der Art auf der Insel der Kamera stehen: «Steht: 4 (1 still)» (still = stillgelegt), «Steht: noch keins», bei Gebäuden auf anderen Inseln zusätzlich «· alle Inseln: 5». Für Kontor, Amtsstube und Denkmal sowie für Weg, Abriss, Aufforsten und Pflanzen gibt es die Zeile nicht.
- **Stammkunde (Vertragskarte):** Die Angebotskarte nennt neben Gut und Preis «Markt jetzt ≈ N» (Preis der ersten Einheit wie im Handelsdialog) und «Erzeugung x / min» der Lieferinsel, oder «keine Erzeugung». Auf der Vertragskarte springt «Zum Erzeuger» zu einem Erzeuger des Vertragsguts; jeder weitere Klick wechselt reihum zum nächsten. Nach 5 pünktlichen Lieferungen ist der Stammkunde treu und verzeiht einen Fehlbestand einmal ohne Strafe; danach zählt die Treue neu. Kündigen setzt sie zurück. **Vorwarnung (I-122):** In den letzten 30 s Spielzeit vor der Lieferung prüft die Karte, ob das Lager reicht. Fehlt Ware, leuchtet die Vertragskarte einmal je Lieferperiode kurz auf, ein leiser Doppelton erklingt (kein Meldungsfenster, kein Log-Eintrag), und die Karte nennt «Fehlt N Gut» samt Folge («Kulanz wird verbraucht» oder «sonst Strafe N»); fehlt das Kontor auf der Lieferinsel, steht «kein Kontor». Kaufst du rechtzeitig nach, endet die Warnung ohne Wiederholung.
- **Fernangebot:** Hast du ein Kontor auf einer fernen Insel, steht neben dem Auftrag oft ein **Fernangebot**: eine grosse Menge des Guts, das diese Insel mag (Möweninsel Stoff, Felsbucht Rum, Weidenau Glas). **Annehmen** ersetzt den Auftrag. Du hast dann 2:50 ab Auftragsbeginn Zeit und lieferst nur am Kontor dieser Insel (**Liefern** nennt die Insel); der nächste Auftrag entfällt. Ein verpasster Fernauftrag kostet nichts ausser diesem Auftrag. Die Auftragskarte eines Fernauftrags färbt die Lagerzahl rot, solange das Lager der Fern-Insel die Menge nicht deckt, und trägt «· zu spät», wenn Ware aus der Heimat nicht mehr rechtzeitig käme. Mit Kontoren auf zwei Fremdinseln zeigt der Händler **zwei Fernkarten** zur Wahl (etwa nach Fahrzeit oder vollem Lager). Jede Karte nennt die Fahrzeit einer Einzelfahrt von der Heimat («≈ 39 s Fahrt») und färbt die Lagerzahl rot, wenn die Fern-Insel weniger hat als verlangt (Tooltip «Fehlt n Gut»); nur eine ist annehmbar, mit dem Annehmen verschwindet die andere, und die Folgeperiode bleibt wie bisher gesperrt.
- **Marke an der Fern-Insel:** Läuft ein Fernangebot oder ein Fernauftrag, trägt die Insel auf der Seekarte eine Marke «15 Rum · 1:20» (Menge, Gut, Restzeit): hohl beim noch nicht angenommenen Angebot, gefüllt beim angenommenen Auftrag, in Warnfarbe, wenn dort kein Kontor mehr steht. Der Hover-Text der Insel nennt «Fernauftrag: …» bzw. «Fernangebot: …». Lieferung oder Verfall nehmen die Marke weg. **Zu spät:** Würde Ware aus der Heimat nicht mehr rechtzeitig ankommen (Fahrzeit länger als die Restzeit, und Lager der Fern-Insel samt rechtzeitig eintreffender Fracht decken die Menge nicht), trägt die Marke «· zu spät» und wird orange; der Hover-Text nennt Fahrzeit und Restzeit.
- **Routen-Bilanz:** Im Schiff-Panel zeigt die Zeile unter einer Route «Warenwert +310 / min · Unterhalt 90 → +220 · nominal». «Nominal» heisst: Überschuss der Quellinsel, ohne Lager, Reserve und Handel, also eine Untergrenze; weitere Schiffe auf derselben Route teilen den Überschuss (Tooltip). Ein Verlust steht mit Minus in Warnfarbe.
- **Aufstieg:** Steigt ein Haus eine Stufe auf, leuchtet es kurz mit einem Lichtkranz und Funken auf; bei «Bewegung reduzieren» nur als ruhiger Schein ohne Funken. In der Pause steht das Funkeln still.
- **Auftragsvorschau:** Die Auftragskarte zeigt das voraussichtliche Gut des nächsten Auftrags; ein Stufenaufstieg kann es ändern.
- **Wachstumsbremse im Einwohner-Chip:** Der Tooltip eines Stufen-Chips nennt unter dem Bedarf der Stufe, was den Häusern dieser Stufe auf der Insel der Kamera fehlt, z. B. «14 Häuser: 5 ausserhalb der Versorgung · 4 ohne Holz · 3 ohne Kapelle · 2 ohne Mangel». Jedes Haus zählt mit genau einer Ursache (zuerst Versorgung, dann das erste fehlende Gut, dann der erste fehlende Dienst); «ohne Mangel» heisst nur, dass nichts fehlt, nicht dass das Haus sofort aufsteigt. Brennende Häuser zählen nicht; die Zahl wird einmal pro Sekunde aufgefrischt.
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

| Eingabe                 | Wirkung                                                                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WASD / Pfeiltasten      | Karte verschieben                                                                                                                                                                                                                         |
| Leertaste antippen      | Pause an/aus (wie `P`)                                                                                                                                                                                                                    |
| Leertaste halten        | Mit gedrückter linker Maustaste die Karte verschieben                                                                                                                                                                                     |
| `Esc` oder Rechtsklick  | Zurück zum Werkzeug «Auswahl», Panel zu, löscht auch die Lager-Markierung (`Esc` auch bei Knopffokus); in einem laufenden Zug (Linie, Weg- oder Abriss-Strich) beendet der erste Rechtsklick nur den Zug, der zweite legt das Werkzeug ab |
| Mausrad                 | Zoomen                                                                                                                                                                                                                                    |
| `P`                     | Pause an/aus (setzt danach das letzte Tempo fort)                                                                                                                                                                                         |
| `Umschalt` + `U`        | Markiertes Gebäude ausbauen (wie «Ausbauen», erst nach der Freischaltung)                                                                                                                                                                 |
| `Entf` / `Rücktaste`    | Markiertes Gebäude abreissen (wie «Abreissen» im Info-Panel)                                                                                                                                                                              |
| `Strg`/`Cmd` + `S`      | Spiel speichern (wie Menü → «Speichern»)                                                                                                                                                                                                  |
| `Cmd`/`Strg` + Klick    | Gebäudetyp unter dem Zeiger als Bauwerkzeug wählen (Pipette)                                                                                                                                                                              |
| `1` / `2` / `3`         | Tempo 1× / 2× / 4× (hebt die Pause auf)                                                                                                                                                                                                   |
| `Umschalt` + Weg ziehen | Gerade oder L-förmige Wegstrecke (Vorschau, Bau beim Loslassen)                                                                                                                                                                           |
| `Umschalt` + `R`        | Rat öffnen oder schliessen (nur wenn die Marke «Rat» da ist)                                                                                                                                                                              |
| `R` / `X`               | Weg / Abriss                                                                                                                                                                                                                              |
| `H` / `M` / `K` / `U`   | Wohnhaus / Marktplatz / Kapelle / Schule                                                                                                                                                                                                  |
| `F` / `L` / `B` / `G`   | Fischerhütte / Holzfäller / Steinbruch / Schäferei                                                                                                                                                                                        |
| `V` / `Z` / `N` / `T`   | Weberei / Zuckerrohrplantage / Brennerei / Werkzeugmacher                                                                                                                                                                                 |
| `E`                     | Feuerwache                                                                                                                                                                                                                                |
| `I`                     | Amtsstube (erst ab U3, höchstens eine)                                                                                                                                                                                                    |
| `C` / `Q`               | Roden / Aufforsten (erst ab U2)                                                                                                                                                                                                           |
| `Y`                     | Jagdhütte (erst ab U2); die Rinderfarm hat keine Taste                                                                                                                                                                                    |
| `?`                     | Hilfe (Karte mit Legende und Freischaltungen)                                                                                                                                                                                             |
| `.` / `,`               | Zum nächsten / vorigen Problem springen (öffnet das Info-Panel, Werkzeug bleibt); bei aktiver Lager-Markierung durch die Gebäude des Guts                                                                                                 |
| `J` / `O`               | Badehaus / Glashütte (erst nach dem Bürger-Ziel)                                                                                                                                                                                          |
| `0` / `9`               | Kamera zur Heimat / zur nächsten Insel (erst mit der Seefahrt)                                                                                                                                                                            |

Die Werkzeugtasten wirken nur ohne Strg, Cmd oder Alt; Gross- und Kleinschreibung ist egal. Ausnahmen sind `Strg`/`Cmd` + `S` (Speichern; der Browser-Dialog «Seite speichern» wird im Spiel unterdrückt, Varianten mit `Umschalt` oder `Alt` bleiben dem Browser), `Umschalt` + `U` (Ausbau; `U` allein bleibt die Schule) und `Cmd`/`Strg` + Linksklick auf ein Gebäude (Pipette; auf dem Mac ist `Cmd` + Klick der Hauptweg, `Strg` + Klick geht auch). Die Pipette wirkt in jedem Werkzeug, beim Kontor meldet sie, dass es sich nicht nachbauen lässt. Leertaste halten und Ziehen hat Vorrang vor der Pipette. Dieselbe
Werkzeugtaste bei schon aktivem Werkzeug schaltet zurück zur Auswahl. Der Tooltip in der Bauleiste
nennt die Taste; alle Kürzel stehen auch im Menü unter «Tastenkürzel». Bei offener Karte (Start, Menü,
Einstellungen) sind alle Kürzel stumm. Die Ziffern `4` bis `8` sind unbelegt und melden «Tempo: 1, 2, 3»; `9` und `0` bleiben ohne Seefahrt stumm. Auf einem fokussierten Knopf aktiviert die Leertaste den Knopf.

Probleme sind, nach Dringlichkeit: nicht angebundene Gebäude und Häuser ausserhalb der Versorgung, stehende Betriebe (wartet auf Ware, kein Wald, kein Dienst), Häuser ohne Dienst, fehlende Waren (ein Eintrag je Gut und Insel) und zuletzt **«Lager voll»**: Ist das Lager eines Guts bei 100 und steht seit mindestens 30 Sekunden Spielzeit ein Erzeuger deswegen still (die Ware verfällt), erscheint ein Eintrag je Gut und Insel («Holz-Lager voll (100): Ware verfällt — stilllegen oder verkaufen»); `.` springt zum nächsten Erzeuger des Guts. Nach dem Laden oder einem neuen Spiel läuft die Frist neu. Innerhalb einer Klasse kommt zuerst die Insel, auf der du gerade bist, dann die übrigen Inseln, dann der nähere Eintrag. Die Meldung zählt mit («Problem 2 von 5: …»); ohne Problem: «Alles versorgt, kein Problem offen». Brände zählen nicht.

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
- **Seehandel, Kontor II:** Ein Kontor auf einer fernen Insel braucht Zugang zum Meer (Binnenseen zählen nicht); sonst meldet der Bau «Kontor braucht Zugang zum Meer». Das Schiff legt am gebauten Kontor an: Mit dem Bau rückt der Anlegeplatz der Insel an das Kontor.
- **Pause-Anzeige:** Bei Pause erscheinen ein getönter Kartenrand und das Banner «Pause»; `P` oder `1×` setzt fort.
- **Wasser** bewegt sich; an der Küste läuft ein Schaumsaum.

### Rat

Sobald ein Haus zum ersten Mal die Stufe 2 (Siedler), 3 (Bürger) oder 4 (Kaufleute) erreicht, tagt der Rat: In der Kopfzeile erscheint die Marke **«Rat · n»** (n = offene Beschlüsse), dazu die Meldung «Der Rat tagt: ein Beschluss steht an». Das Spiel läuft weiter, nichts pausiert.

- **Bedienung:** Klick auf die Marke oder `Umschalt` + `R` öffnet die Rats-Karte, `Esc` schliesst sie ohne Wahl. Je offene Stufe stehen die Karten nebeneinander (Stufe 2 und 3 zwei, Stufe 4 drei). Eine Karte anklicken markiert sie; erst **«Beschluss fassen»** gilt (Schutz vor Fehlklick).
- **Wirkung:** Der Beschluss gilt für die ganze Partie und alle Inseln, kostet nichts, lässt sich nicht ändern; die übrigen Beschlüsse der Stufe verfallen. Gefasste Beschlüsse stehen als Liste in derselben Karte («Stufe 2: Webordnung»), die Marke bleibt als neutrales «Rat» sichtbar. Ein offener Beschluss kann beliebig lange warten.
- **Vorschau und Nachlesen:** Jede Karte nennt unter ihrem Text die Wirkung auf den heutigen Bestand: «Betrifft jetzt: 3 × Weberei» (alle Inseln), beim Seerecht «Betrifft jetzt: n Schiffe» (ohne Schiff «Wirkt noch nicht: kein Schiff»), bei den Haus-Beschlüssen «Betrifft jetzt: n Häuser (+m Plätze)», ohne passendes Gebäude «Wirkt noch nicht: … fehlt». Die Chronik der Ruhe-Ansicht führt eine Zeile «Rat: …» («Rat: 1 Beschluss offen», «Rat: Webordnung · Wohnordnung», «Rat: Webordnung — 1 offen»), und im Ereignis-Log steht jeder gefasste Beschluss als «Rat beschliesst: Glockenrecht».
- **Die sieben Beschlüsse:** Stufe 2 Webordnung (Webereien +25 % schneller) oder Glockenrecht (Kapellen reichen 3 Felder weiter); Stufe 3 Brennrecht (Brennereien +25 % schneller) oder Wohnordnung (Bürgerhäuser fassen 16 statt 15); Stufe 4 Glasrecht (Glashütten +67 % schneller), Hofrecht (Kaufmannshäuser fassen 22 statt 20) oder Seerecht (Schiffe fahren 25 % schneller. Spart ab etwa 80 Kaufleuten ein Schiff auf langen Gewürzrouten). Gilt für die ganze Partie, die übrigen Beschlüsse der Stufe verfallen. Alle Zahlen: [`docs/spielwerte.md`](docs/spielwerte.md#rat-ratsbeschluss).

### Meisterprüfung

Ist das Denkmal fertig, wird der Ziel-Chip in der Kopfzeile zum Knopf «Meisterprüfung» (auch in der Gewürz-Phase). Ein Klick öffnet die Auflagen-Karte; `Esc` oder «Schliessen» schliesst sie. Das Spiel läuft weiter.

- **Auflage «Eigenversorgung»:** Sie sperrt den Zukauf an allen Kontoren und für das Denkmal. Verkauf, Aufträge, Schiffe und Bauen bleiben frei. Du hältst 15 Minuten durch, die Einwohner dürfen nicht unter 70 % des Starts fallen.
- **Start:** mit 60 bis 150 Kaufleuten und ohne Schulden. Die Karte zeigt, welche Güter ohne Zukauf fehlen; ist der Start gesperrt, steht der Grund im Knopf.
- **Abbruch:** jederzeit über «Abbrechen» (zweiter Klick bestätigt), ohne Folgen.
- **Lohn:** Bei Erfolg trägt die Inselchronik «Meisterprüfung: Eigenversorgung bestanden». Wer scheitert, kann es später neu versuchen.

### Ehrenbuch

Das Ehrenbuch hält Meisterstücke über Partien hinweg fest. Es gibt keinen Spielvorteil und gilt nur auf diesem Gerät (Browser-Speicher, kein Export). Das Menü zeigt die Zeile «Ehrenbuch: n von 9 Meisterstücken»; der Knopf «Ehrenbuch» öffnet die Karte mit erreichten und offenen Stücken samt Bedingung. Ein neues Stück trägt sich mit einer Meldung ein; der erste Eintrag bleibt. «Neue Insel» setzt das Buch nicht zurück.

- **Bürgerstadt:** Erstes Ziel erreichen
- **Flinke Gründung:** Erstes Ziel bis Spielzeit 15:00
- **Kaufmannseile:** Handelsstadt bis Spielzeit 30:00
- **Sturmfest:** Handelsstadt mit Krisen «normal»
- **Gewürzstadt:** Drittes Ziel erreichen
- **Inselreich:** Auf jeder Fremdinsel ein Kontor
- **Denkmal:** Das Denkmal vollenden
- **Meister im Sturm:** Eine Meisterprüfung mit Krisen «normal» bestehen
- **Meisterprüfung «Eigenversorgung»:** Die Auflage «Eigenversorgung» bestehen

Die beiden Tempo-Stücke zählen nur in einer Partie mit stufenweiser Freischaltung, die über «Neue Insel» begonnen wurde.

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
Tab verborgen ist. Ein leiser Anlegeton meldet jede Ankunft eines Schiffs, auch ausserhalb des Bildes.

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
  Die Stadt klingt voller, wenn die Häuser im Bild versorgt sind.
- **Musik:** einige Sekunden nach dem ersten Klick ein Stück passend zur Tageszeit, danach Pausen von
  30–90 s.

**Herkunft von Musik, Klang und Schrift:** Die Musikstücke, Umgebungsklänge, Signaltöne und die Schrift
EB Garamond sind offen lizenzierte Dateien unter `public/` (Nachweis je Datei in `docs/CREDITS.md`,
Lizenztexte in `docs/licenses/`). Die Credits stehen im Spiel unter **Einstellungen → Credits**. Fehlt eine
Datei oder lädt sie nicht, klingt die Schicht synthetisch weiter, und die Schrift fällt auf eine
Ersatzschrift zurück.

## Freischaltung, Wirtschaft, Bevölkerung und Krisen

Die Regeln mit allen Zahlen stehen in [`docs/spielwerte.md`](docs/spielwerte.md):

- Denkmal (Wahlziel)
- Freischaltung Schritt für Schritt (inkl. Edikte)
- Wirtschaft: Produktionsketten, Handel, Handelsaufträge, Seefahrt und Gewürz, Unterhalt, Stilllegen, Abriss
- Bevölkerung: Stufen, Versorgung, Bedürfnisse, Aufstieg, Steuern
- Krisen: Krisenstufe, Brand und Feuerwache, Sturm, Boom, Krisenkarte
- Rat (Ratsbeschluss): die sieben Beschlüsse mit allen Werten

Ereignisse zeigt ungelesene Meldungen als (n neu), ab 10 (9+ neu); Aufklappen setzt den Zähler zurück.

- **Ereignis-Log:** Die Box unten links erscheint, sobald ein Eintrag da ist, auch bei «Krisen: aus». Sie hält die letzten 20 Einträge. Neben Krisen und Monument stehen darin ein verfallener Zufallsauftrag («Auftrag verfallen: …»), ein verfallenes Stammkunden-Angebot («Stammkunden-Angebot verfallen: …») sowie jede Vertragslieferung und jeder Vertragsbruch. Diese Einträge zählen nur bei Lieferung und Bruch als «neu»; die Meldung oben rechts erscheint wie bisher nur einmal.
- **Warnmeldungen:** Meldungen oben rechts verschwinden nach 3 s, Warnungen bleiben 7 s stehen, damit sie nicht überlesen werden. Klebende Meldungen bleiben, bis du sie schliesst.
- **Reichweite am Lager-Chip:** Fällt oder steigt ein Gut so, dass das Lager bald leer oder voll ist, trägt der Chip eine Zeit, z. B. «↓ 2:00» oder «↓ 40 s» (Zeit in Spielzeit bei 1×). Leer wird bei höchstens 3 Minuten gelb, bei höchstens 1 Minute rot, ein leeres Lager mit Verbrauch zeigt «0 ↓ leer». Voll wird bei höchstens 1 Minute gedämpft markiert, nie rot. Der Tooltip nennt die Zeit und die Rate je Minute immer, auch ausserhalb der Schwelle. Die Reichweite rechnet mit der Erzeugung und dem Verbrauch der Insel; läuft ein Stammkunde für dieses Gut auf dieser Insel, zieht sie seine Lieferung je Periode ab (Tooltip: «mit Stammkunde, ohne Handel und Aufträge»). Handel und Zufallsaufträge bleiben draussen.

## Speichern, Laden, Neue Insel

- **Speichern:** Menü → «Speichern» legt den Spielstand im Browser ab (ein Speicherplatz, nur in diesem
  Browser). `Strg`/`Cmd` + `S` speichert auf demselben Weg in denselben Platz.
- **Autosave:** Alle 2 Minuten laufenden Spiels (Pause zählt nicht) speichert das Spiel zusätzlich in
  zwei eigene Autosave-Plätze im Wechsel: Der neueste Stand ersetzt jeweils den älteren, der vorige bleibt
  als «Autosave davor» erhalten (so lässt sich nach einem Fehlklick ein Stand von vor etwa zwei bis vier
  Minuten laden). Beim Verlassen oder Schliessen der Seite überschreibt ein weiteres Speichern (still, nur
  wenn das Spiel schon begonnen hat) nur den neuesten Platz; «Davor» bleibt unberührt. Welcher Stand «Autosave» und welcher «Autosave davor» heisst, richtet sich nach dem Zeitpunkt des letzten Schreibens, nicht nach der Spielzeit. Lädst du einen
  Autosave-Stand, schreibt das nächste Speichern in diesen Platz: Das Verlassen der Seite überschreibt ihn, der andere Stand
  (auch ein neuerer) bleibt bis zum nächsten Autosave erhalten. Scheitert das periodische Speichern, erscheint einmal eine Meldung;
  das Spiel läuft weiter.
- **Laden:** Menü → «Laden» zeigt die vorhandenen Stände («Autosave — Spielzeit m:ss», «Autosave davor — Spielzeit m:ss», «Gespeichert —
  Spielzeit m:ss»); ein Klick lädt. Ist ein Stand beschädigt oder fehlt er, erscheint eine Meldung und das
  laufende Spiel bleibt unverändert. Ungespeicherter Fortschritt geht verloren (Hinweis über der Liste).
  Ein geladenes Spiel **pausiert**; `P` oder `1×` setzt es fort. Die Kamera bleibt, wenn der Stand dieselbe
  Karte hat, sonst springt sie zum Kontor.
  Gibt es offene Fristen (Auftrag, Fernauftrag, Fernangebot, Stammkunde, Auflage) oder Probleme, öffnet sich beim Laden die Karte «Wo war ich?» mit Spielzeit, den Fristen nach Restzeit und der Problemzahl; `Esc` oder «Weiter» schliesst sie, das Spiel bleibt pausiert. Ohne Fristen und Probleme erscheint sie nicht.
- **Beim Start:** Die Startkarte bietet den neuesten Autosave («Fortsetzen»), bei zwei Ständen auch «Davor laden», und den gespeicherten Stand an.
- **Neue Insel:** Menü → «Neue Insel» fragt zuerst «Neue Insel beginnen?» (Ja / Abbrechen), dann entsteht
  eine neue Insel mit Tempo 1× und der gewählten Krisenstufe. Der Autosave bleibt, bis der nächste ihn
  überschreibt. Die Kartennummer steht im Menü («Karte …»).
- **Spielstand-Version 19:** Ältere Stände laden weiter und werden über die Migrationskette ergänzt (ab Version 13 kommt dabei die dritte Fremdinsel «Weidenau» ohne Kontor dazu). Ein Stand aus einer neueren Version wird mit Hinweis («Unbekannte Version») abgewiesen; das laufende Spiel bleibt unverändert.
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
