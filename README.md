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
  Stufenpfad, den **nächsten Schritt** («Baue ein Wohnhaus (H) nahe dem Kontor», «Verbinde … per Weg …»),
  die Wirkung der Steuerstufe (bei unterschiedlichen Reglern «Steuer gemischt: P niedrig · S normal · …») und aufklappbar die **Kartenzeichen** (Bedeutung der Symbole auf der Karte).
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
- **Ferne Inseln:** Neben deiner Insel liegen zwei weitere, die Möweninsel und die Felsbucht. Fährst du mit dem
  Mauszeiger über eine von ihnen, nennt eine Karte Name, Grösse, Merkmale und Fahrzeit. Bauen kannst du dort noch nicht;
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
  ziehen (reisst nur Wege ab, Gebäude bleiben stehen) — oder im Info-Panel «Abreissen».
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

| Eingabe                | Wirkung                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| WASD / Pfeiltasten     | Karte verschieben                                                                |
| Leertaste antippen     | Pause an/aus (wie `P`)                                                           |
| Leertaste halten       | Mit gedrückter linker Maustaste die Karte verschieben                            |
| `Esc` oder Rechtsklick | Zurück zum Werkzeug «Auswahl», Panel zu (`Esc` auch bei Knopffokus)              |
| Mausrad                | Zoomen                                                                           |
| `P`                    | Pause an/aus (setzt danach das letzte Tempo fort)                                |
| `Umschalt` + `U`       | Markiertes Gebäude ausbauen (wie «Ausbauen», erst nach der Freischaltung)        |
| `Cmd`/`Strg` + Klick   | Gebäudetyp unter dem Zeiger als Bauwerkzeug wählen (Pipette)                     |
| `1` / `2` / `3`        | Tempo 1× / 2× / 4× (hebt die Pause auf)                                          |
| `R` / `X`              | Weg / Abriss                                                                     |
| `H` / `M` / `K` / `U`  | Wohnhaus / Marktplatz / Kapelle / Schule                                         |
| `F` / `L` / `B` / `G`  | Fischerhütte / Holzfäller / Steinbruch / Schäferei                               |
| `V` / `Z` / `N` / `T`  | Weberei / Zuckerrohrplantage / Brennerei / Werkzeugmacher                        |
| `E`                    | Feuerwache                                                                       |
| `I`                    | Amtsstube (erst ab U3, höchstens eine)                                           |
| `C` / `Q`              | Roden / Aufforsten (erst ab U2)                                                  |
| `Y`                    | Jagdhütte (erst ab U2); die Rinderfarm hat keine Taste                           |
| `?`                    | Hilfe (Karte mit Legende und Freischaltungen)                                    |
| `.` / `,`              | Zum nächsten / vorigen Problem springen (öffnet das Info-Panel, Werkzeug bleibt) |
| `J` / `O`              | Badehaus / Glashütte (erst nach dem Bürger-Ziel)                                 |
| `0` / `9`              | Kamera zur Heimat / zur nächsten Insel (erst mit der Seefahrt)                   |

Die Werkzeugtasten wirken nur ohne Strg, Cmd oder Alt; Gross- und Kleinschreibung ist egal. Ausnahmen sind `Umschalt` + `U` (Ausbau; `U` allein bleibt die Schule) und `Cmd`/`Strg` + Linksklick auf ein Gebäude (Pipette; auf dem Mac ist `Cmd` + Klick der Hauptweg, `Strg` + Klick geht auch). Die Pipette wirkt in jedem Werkzeug, beim Kontor meldet sie, dass es sich nicht nachbauen lässt. Leertaste halten und Ziehen hat Vorrang vor der Pipette. Dieselbe
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
  und Fanfare (Boom). Wichtige Signale senken Musik und Umgebung kurz ab.
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
- **Lagerleiste und Warenbilanz:** Die Lagerleiste in der Kopfzeile (zweite Zeile) zeigt je Gut den Bestand und die
  Bilanz mit Trendpfeil (↑ / → / ↓, negative Bilanz hervorgehoben). Die Chips «Glas» und «Kaufleute» erscheinen erst nach der Freischaltung der Stufe 4 oder sobald es Glas bzw. Kaufleute gibt. Der Tooltip nennt Bilanz, Erzeugung und
  Verbrauch je Minute. Gerechnet wird nominal aus den angebundenen Betrieben und dem Bedarf der
  versorgten Häuser; Handel, Aufträge und Aufstiege zählen nicht mit.
- **Baukosten:** Geld und teils Holz, Werkzeug oder Stein; sie stehen in der Bauleiste.
- **Anbindung:** Betriebe, Marktplatz, Kapelle, Schule und Feuerwache arbeiten nur, wenn ein Weg an sie grenzt,
  der über Wege mit dem Kontor verbunden ist. Nicht angebundene Gebäude tragen einen roten Punkt.
  Im Info-Panel eines nicht angebundenen Betriebs baut der Knopf «Anbinden (n Wege · x Geld)» den kürzesten
  Weg zum Kontor über freie Kacheln; vorhandene Wegstücke werden mitbenutzt. Die Kosten sind n × 5 Geld, es
  wird nie nur ein Teil gebaut. Fehlt der Pfad oder das Geld, ist der Knopf blass und eine Zeile nennt den
  Grund. Beim Überfahren (oder Fokussieren) zeigt die Karte den geplanten Weg als helle Rauten.
- **Info-Panel:** Das Info-Panel eines Betriebs hat drei Teile. Oben stehen Name, Stufe («Stufe 1» bis «Stufe 3» mit Punkten) und der Zustand als farbig umrandeter Chip (✓ läuft, ! wartet, ✗ steht, z. B. «In Betrieb», «Wartet auf Wolle», «Lager voll», «Nicht an Kontor angebunden») samt Abhilfe. Darunter zeigen Kacheln Ausstoss und Verbrauch je Minute, Auslastung und Unterhalt, dazu der Fortschritt. Unten steht die Ausbau-Karte mit dem Gewinn des nächsten Ausbaus (Ausstoss und Unterhalt, vorher → nachher), Kosten, Gebühr und dem Knopf «Ausbauen» (Tastenkürzel `Umschalt` + `U`); falls es nicht geht, nennt sie den Grund. Vor der Freischaltung nennt die Karte, wann der Ausbau möglich wird. Das Wohnhaus zeigt Stufe, Versorgung, Einwohner, Bedarfe und die Aufstiegs-Karte im gleichen Aufbau. Der Knopf «Gleiches bauen» wählt den Gebäudetyp als Bauwerkzeug (wie `Cmd`/`Strg` + Klick; nicht beim Kontor). Das Mouse-over nennt Stufe
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

**Ausbau:** Die meisten Betriebe lassen sich ausbauen. Stufe 2 (ab Freischaltung U3) kostet Geld, Holz und
Werkzeug sowie 2–3 Stoff als Gebühr, Stufe 3 (ab U5) kostet mehr und 2–3 Rum als Gebühr. Brennerei und Glashütte brauchen dafür auch Stein (Stufe 2: 3 bzw. 5, Stufe 3: 4 bzw. 8). Der Zyklus sinkt auf etwa
× 0,6 bzw. × 0,4, der Unterhalt steigt (Fischerhütte: 30 → 42 → 54 / min). Baue die Kette gemeinsam aus, sonst
wartet der nächste Betrieb auf Ware. Ein Abriss erstattet die Hälfte von Bau- und Stufenkosten, die Gebühr nicht.

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

- **Kaufpreise sind fest.** Mit dem Edikt Handel (Amtsstube) sinken sie um 20 % (über die ganze Menge aufgerundet).
- **Verkaufssättigung:** Jede verkaufte Einheit senkt den Verkaufspreis dieses Guts um 1 Prozentpunkt,
  höchstens bis 30 %. Jede Sekunde erholt sich der Preis jedes Guts um 1 Prozentpunkt, bis 100 %.
  Rund 10 Einheiten je Gut und 10 Sekunden lassen sich also fast zum vollen Preis verkaufen; wer das
  ganze Lager auf einmal verkauft, drückt den Preis stark (100 Holz bringen 219 statt 400). Der
  Handelsdialog zeigt je Gut «Preis … %», und jeder Verkaufsbutton nennt den genauen Erlös für seine
  Menge.
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

### Seefahrt und Gewürz

Die Seefahrt wird mit dem Bürger-Ziel frei (U6). Danach liegen zwei weitere Inseln im Archipel: die **Möweninsel**
(24 × 24 Kacheln, Gewürz) und die **Felsbucht** (36 × 36, Gewürz und Gebirge). Kaufleute brauchen **Gewürz** (0,1 je
Einwohner und 10 s); es wächst nur auf Gewürzinseln und lässt sich am Kontor zu 40 Geld kaufen (Verkauf 12).

- **Inseln wechseln:** Taste `0` springt zur Heimat, Taste `9` zur nächsten Insel; der Knopf «Inseln» in der Kopfzeile
  öffnet ein Fenster mit einer kleinen **Seekarte** über der Liste: Silhouetten aller Inseln, die Fahrlinien der Routen und
  je ein Punkt für jedes Schiff mit Route (ein Schiff ohne Route fehlt; im Hafen liegt der Punkt am Anker der Insel; Inseln mit Kontor tragen eine helle Marke knapp über dem Anker).
  Ein Klick auf das Land einer Insel springt dorthin wie die Tasten `0`/`9` und schliesst das Fenster; ein Klick ins
  Wasser tut nichts, `Esc` oder ein Klick daneben schliesst. Die Liste darunter bleibt als Tastaturweg. Die Kamera zeigt die Insel, die in der Bildmitte liegt; die Lagerleiste in der Kopfzeile zeigt das
  Lager **dieser** Insel, mit dem Inselnamen davor. Jede Insel hat ihr eigenes Lager.
- **Kontor II:** Ein zweites **Kontor** (2×2, Küste, 800 Geld, 20 Holz, 8 Werkzeug, 10 Stein, Unterhalt 60 / min, Versorgungsradius 8) gründest du an der Küste einer Fremdinsel. Seine Baukosten zahlst du aus dem **Heimatlager**.
  Auf jeder Fremdinsel ist ein Kontor erlaubt; ohne Kontor lässt sich dort nichts bauen, und Handel, Aufträge und
  Versorgung laufen über das Kontor der jeweiligen Insel.
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

- Ein stillgelegter Betrieb zahlt den **halben Unterhalt** (aufgerundet), erzeugt nichts und verbraucht nichts. Die Kette dahinter läuft leer.
- «Wieder anfahren» (derselbe Knopf) startet ihn mit einem Klick, ohne Kosten.
- Stillgelegte Betriebe stehen nicht in der Problemliste: Die Pause ist gewollt.

### Abriss

Die Hälfte der Baukosten (abgerundet) wird zurückerstattet; Waren nur, soweit im Lager Platz ist. Der
Button «Abreissen» zeigt den tatsächlichen Betrag und was am Lagerlimit verfällt (z. B. «Holz 1
(4 verfallen – Lager voll)»). Das Kontor kann nicht abgerissen werden. Ein Weg erstattet wie jeder Abriss die Hälfte (2 Geld). Trennt ein Abriss Gebäude vom Kontor, meldet das Spiel am Ende des Zugs «Abriss trennt n Gebäude vom Kontor»; `.` springt zu ihnen.

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

- Die **Krisenkarte** steht oben rechts im Spielfeld, unter der Auftragskarte, und zeigt «Krisen: aus»,
  «Krisen: normal · nächste Krise in m:ss» oder die laufende Krise mit Restzeit (z. B. «Brand: Weberei ·
  Ausfall noch 20 s · …», «Sturmwarnung: Sturm in 20 s, dauert 30 s …», «Boom: Rum +50 % Verkaufspreis ·
  noch 30 s»).
- Das **Ereignis-Log** schwebt unten links über der Karte, sobald es Einträge gibt. Eingeklappt zeigt es
  nur den neuesten Eintrag; «Ereignisse ▸» klappt die letzten 10 auf («m:ss · …», Spielzeit seit Beginn). Es gehört nicht zum
  Spielstand und ist nach «Neue Insel» und «Laden» leer. Wichtige Ereignisse erscheinen zusätzlich als Meldung.
  Ein Klick auf eine Brandmeldung zentriert die Karte auf das Gebäude.

## Speichern, Laden, Neue Insel

- **Speichern:** Menü → «Speichern» legt den Spielstand im Browser ab (ein Speicherplatz, nur in diesem
  Browser).
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
- **Spielstand-Version 11** (Edikte und Stilllegen): Ältere Stände laden weiter und werden über die Migrationskette ergänzt (kein Edikt, nichts stillgelegt). Ein Stand aus einer neueren Version wird mit Hinweis («Unbekannte Version») abgewiesen; das laufende Spiel bleibt unverändert.
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
