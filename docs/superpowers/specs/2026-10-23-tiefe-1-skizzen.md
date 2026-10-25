# Skizzen TIEFE-1: drei Erweiterungen, zwei Modi

Stand 2026-10-23 · Autor: lead-design · Paket TIEFE-1 (Nutzerauftrag R862) · Prozessstufe leicht · **Skizze, keine Spec**: Alle
Zahlen sind Richtwerte zum Abwägen. Sie sind weder gerechnet noch gemessen. Grundlage: Recherche
[`docs/recherche/2026-10-23-tiefe-1.md`](../../recherche/2026-10-23-tiefe-1.md), Ideen I-186–I-196 in
[`docs/ideen.md`](../../ideen.md), Erweiterung 1 «Stände und Segel» (`design/erweiterung-1`, nur gelesen). Alle Mechaniken
sind Genre-Gemeingut; Namen und Inhalte sind eigen (ADR-006).

## 1 Einordnung

- **Begriff:** Eine Erweiterung ist ein Gross-Release mit einem Thema über mehrere Meilensteine, mit neuer Spielphase und
  eigenem Titel. Der Spieltitel «Inselreich» bleibt.
- **Bestand:** Erweiterung 1 «Stände und Segel» ist offen (Nutzer-Session, R519). Sie bringt Stufe Reeder,
  Arbeitskraft für die neuen Betriebe, «Stand halten», Inseldorf, Werft, Piraten mit Geleit und Ziel 4 «Seestadt».
  Variante B «Rivalen und Seekampf» ist als Erweiterung 2 vorgemerkt (O4, Nutzer).
- **Was hier neu ist:** drei Themen, die Erweiterung 1 ausdrücklich ausschliesst oder nicht berührt (E1 §10: neue Inseln,
  Erkundung, Nebel; kein Jahreszyklus; kein Wissen). Dazu zwei Modi, die keine Erweiterung brauchen.
- **Leitlinien aus der Recherche:**
  - Eine neue Region oder ein neuer Zyklus verlängert am stärksten (R3).
  - Neue Entscheidungen statt mehr Klickarbeit (R3).
  - Kein Pflicht-Umbau des Bestehenden; Neues kommt hinter einen Schalter oder an eine Spätphase (R3).
  - Der Lohn nach dem Denkmal darf kein Geld sein (R722).

## 2 Erweiterung «Neue Ufer» (I-194, mit I-189)

- **Thema:** Entdeckung jenseits des Archipels und eine Insel mit eigenem Klima.
- **Titelvorschläge:** **«Neue Ufer»** (Empfehlung, schlicht, Gattungswörter), «Hinter dem Nebel», «Nordwind».
- **Spielerfantasie:** «Mein Reich ist fertig, aber hinter dem Kartenrand liegt Nebel. Ich rüste Expeditionen aus, finde
  eine kalte Nordinsel und baue dort eine zweite, ganz andere Stadt, die mir Tran für die Lampen der Heimat liefert.»
- **Neue Spielphase, Level-Moment «Kartenrand»** (nach Ziel 3, oder nach Ziel 4, falls Erweiterung 1 vorher kommt): Die
  Seekarte bekommt einen Nebelgürtel mit drei Seegebieten.
  - **Neue Frage:** «Welches Schiff gebe ich für eine Expedition her, und was nehme ich mit?»
  - **Später:** «Wie versorge ich Siedler, die Wärme brauchen?»

### 2.1 Kernelemente

1. **Expedition** (I-189):
   - Ein Schiff fährt 3–5 min ausser Dienst. Die Ladung ist der Einsatz.
   - Unterwegs liegen 2 Wahl-Karten aus einem eigenen seeded Strom (ADR-010).
   - Lohn: ein Seegebiet wird aufgedeckt, dazu ein Fundstück. Kein Geldlohn.
   - Höchstens eine Expedition zugleich, damit keine Klickarbeit entsteht (R3).
2. **Fundstück-Sammlung:**
   - 8–10 Stücke mit kleiner Dauerwirkung, z. B. «Seekarte: Fahrzeit −10 %» oder «Glocke: Kapellen-Reichweite +1».
   - Gebunden an den riskanten Weg der Wahl-Karte, damit die sichere Wahl nicht dominiert.
3. **Nordinsel mit Klimaregel:**
   - Häuser brauchen **Wärme** (Brennholz, später Tran) als Grundbedürfnis.
   - Holz wächst dort langsam, Fischfang ist reich.
   - Die Insel wird erst bei der Entdeckung erzeugt, in einem eigenen Strom. So bleiben Weltgenerierung und Ziele 1–3 bitgleich.
4. **Nordleute in zwei Stufen** (Seitenlinie, **keine** Stufe über den Reedern): eigene Bedürfnisse, eigene Kette
   Robbenfang → Tranküche → Lampenöl.
5. **Ziel «Zwei Reiche»:** 40 Nordleute der Stufe 2 und 60 Heimathäuser mit Licht, d. h. Lampenöl als neues Bedürfnis
   der Oberschicht, 10 min gehalten.

### 2.2 Meilensteine (grob)

| Meilenstein    | Inhalt                                                         | Grösse (Richtwert)   | Save |
| -------------- | -------------------------------------------------------------- | -------------------- | ---- |
| N1 Kartenrand  | Nebel, Kartografenhaus am Kontor, Expedition, Fundstücke       | SIM 1 · UI 1 · ART 1 | +1   |
| N2 Nordinsel   | Erzeugung bei Entdeckung, Klimaregel Wärme, Nordleute, Tran    | SIM 2 · UI 1 · ART 2 | +1   |
| N3 Zwei Reiche | Lampenöl als Heimat-Bedürfnis, Ziel, Chronik, Ehrenbuch-Stücke | SIM 1 · UI 1         | +1   |
| (N4 optional)  | Ereignisse der Seegebiete (Eisberg, Treibgut) über Wahl-Karten | Kurzdesign + 1 Paket | ggf. |

Summe ≈ 12–16 Pakete. Grösse und Takt etwa wie Erweiterung 1 K2–K4.

### 2.3 Abgrenzung zu Erweiterung 1

- Keine Überschneidung im Inhalt. Erweiterung 1 schliesst neue Inseln, Erkundung und Nebel aus (§10).
- **Abhängigkeit:** Expeditionen brauchen ein freies Schiff.
  - Mit der Werft aus Erweiterung 1 (Flottengrenze 6) ist das eine echte Wahl.
  - Ohne Werft kostet jede Expedition eine Route. Bei Flottengrenze 4 kann das die Gewürzstadt kippen.
  - Empfehlung: «Neue Ufer» **nach** Erweiterung 1.
- Nordleute sind eine Seitenlinie und keine sechste Stufe. Die Frage «welche Häuser bleiben unten» (E1) bleibt unberührt.

### 2.4 Risiken

- **Perf:** eine zweite Stadt, Nebel auf der Seekarte.
- **Art:** Schnee- und Eis-Tönung, 5–7 neue Sprites (ADR-011/012).
- **Klickarbeit:** Expeditionen als Pflichtschleife. Gegenmittel: höchstens eine zugleich, Ende nach dem dritten Seegebiet.
- **Zufallslohn ohne Gestaltung (R3):** Die Fundstücke hängen an der Wahl, nicht am Würfel.

## 3 Erweiterung «Ernte und Frost» (I-195)

- **Thema:** Jahreszeiten mit vorhersehbarem Winter. Vorrat und Inselklima werden Werkzeuge.
- **Titelvorschläge:** **«Ernte und Frost»** (Empfehlung), «Das lange Jahr», «Vier Zeiten».
- **Spielerfantasie:** «Im Herbst fülle ich die Speicher, im Winter ruhen die Felder daheim, und die Route nach Weidenau,
  wo es mild bleibt, hält meine Stadt satt.»
- **Neue Spielphase:** Ein Rhythmus statt eines Gleichgewichts. Das Plateau aus R1 1.8 entsteht nicht mehr, weil jedes Jahr
  die Lage kippt.
  - **Neue Frage:** «Reicht mein Vorrat durch den Winter, und welche Insel ernährt mich dann?»
- **Schalter:** «Jahreszeiten an/aus» bei Neuer Insel, wie die Krisenstufe. Standard «aus» im ersten Release.
  «An» als Standard wäre ein Umbau der Kernschleife ab Minute 1 und damit Nutzerentscheid.

### 3.1 Kernelemente

1. **Jahreskreis:**
   - Vier Zeiten zu je 6 min Spielzeit (Jahr = 24 min, eine Partie von 90 min hat knapp vier Jahre).
   - Anzeige in der Kopfzeile mit Restzeit bis zum Winter. Zustand aus dem Tick abgeleitet, also kein RNG.
2. **Winterregeln:**
   - Zuckerrohrfelder ruhen, die Schäferei liefert halb, der Fang sinkt um 50 %.
   - **Brennholz** wird Winterbedarf aller Häuser. Holz bekommt damit einen Rhythmus statt eines Dauerüberschusses.
   - Der Zukauf am Kontor kostet im Winter ×1,3. Geld soll den Winter nicht trivial lösen (R722).
3. **Herbst:** Ernte ×1,5 auf Feldern. **Speicher** als neuer Bau, Lagergrenze +50 auf der Insel. Der Sperrbestand
   (I-049) wird zum Wintervorrat.
4. **Inselklima:** Weidenau bleibt mild (Felder ruhen nicht), die Möweninsel friert stark. Fremdinseln werden zur
   Winterversicherung, die Routen ändern ihren Zweck je Zeit.
5. **Erntefest:** Das Fest in der Kapelle (REL-04) ist im Herbst stärker. Es gibt ein kleines Wachstumsfenster, wenn der
   Vorrat reicht.

### 3.2 Meilensteine (grob)

| Meilenstein          | Inhalt                                                       | Grösse (Richtwert)     | Save |
| -------------------- | ------------------------------------------------------------ | ---------------------- | ---- |
| F1 Jahreskreis       | Zeiten, Anzeige, Tönung und Schnee (Render), Schalter        | SIM 1 · UI 1 · ART 1–2 | +1   |
| F2 Winter und Vorrat | Feldruhe, Fang, Brennholz-Bedarf, Speicher, Zukauf-Aufschlag | SIM 2 · UI 1 · ART 1   | +1   |
| F3 Inselklima        | Klima je Insel, Erntefest, Chronik «überstandene Winter»     | SIM 1 · UI 1           | ggf. |

Summe ≈ 10–14 Pakete.

### 3.3 Abgrenzung zu Erweiterung 1

- Keine Überschneidung. Erweiterung 1 kennt keinen Zyklus.
- **Wechselwirkung:** Sturm auf See (E1 K4) könnte im Winter häufiger sein. Erst klären, wenn beide gebaut sind.
- Die Arbeiter-Regel (E1 K2) bleibt unberührt.

### 3.4 Risiken

- **Pflicht-Umbau** (R3): nur mit Schalter, Baseline mit «aus» bitgleich. Mit «an» sind alle Pins neu.
- **Dauerwinter wirkt eng** (R3, Cities): Der Winter dauert nur 6 von 24 min und ist vorhersehbar.
- **Abstieg im Winter frustriert:** Der Abstiegs-Dämpfer (I-137) muss vorher live sein.
- Die Missernte (I-076, verworfen) scheiterte an «Krise ohne Wahl». Hier ist der Mangel planbar, darum mit Wahl.

## 4 Erweiterung «Gelehrte und Gilden» (I-196)

- **Thema:** Wissen als dritte Grösse neben Geld und Ruf. Erfindungen ändern Regeln.
- **Titelvorschläge:** **«Gelehrte und Gilden»** (Empfehlung), «Feder und Zirkel», «Das Erfindungsbuch».
- **Spielerfantasie:** «Meine Akademie sammelt Wissen, und ich entscheide, ob meine Insel die Glasmacher-Gilde oder die
  Seefahrer-Gilde bekommt. Beide geht nicht.»
- **Neue Spielphase, Level-Moment «Akademie»** (mit Ziel 2): Die Schule lässt sich zur Akademie ausbauen.
  - **Neue Frage:** «Welchen Ast meines Erfindungsbuchs gehe ich, und welche Gilde schliesse ich damit aus?»

### 4.1 Kernelemente

1. **Akademie:** Ausbau der Schule. Sie erzeugt Wissen je versorgtem Bürger- und Kaufmannshaus im Radius. Wissen lässt
   sich nicht kaufen.
2. **Erfindungsbuch:**
   - Drei Äste (Seefahrt, Handwerk, Landbau) zu je 4 Erfindungen, Kosten steigend in Wissen.
   - Jede Erfindung ändert eine Regel, z. B. «Glashütte braucht kein Holz» oder «Schiff +1 Ladeplatz».
3. **Gilden:**
   - Die dritte Erfindung eines Astes stiftet dessen Gilde mit einer starken Regel.
   - Wer eine Gilde wählt, sperrt die beiden anderen für die Partie. Damit ist es eine echte Wahl wie beim Rat, aber teuer
     und geplant.
4. **Gelehrtenhaus:** Seitenstand ohne Steuer. Er braucht Bücher (Kette Holz → Papiermühle → Druckerei) und verdoppelt
   das Wissen der Akademie im Radius.
5. **Ziel «Stadt des Wissens»:** eine Gilde gestiftet und alle vier Erfindungen ihres Astes.

### 4.2 Meilensteine (grob)

| Meilenstein  | Inhalt                                        | Grösse (Richtwert)   | Save |
| ------------ | --------------------------------------------- | -------------------- | ---- |
| G1 Akademie  | Ausbau, Wissen, Erfindungsbuch (Ast Handwerk) | SIM 1 · UI 2 · ART 1 | +1   |
| G2 Drei Äste | Seefahrt und Landbau, Gilden mit Sperre       | SIM 2 · UI 1         | +1   |
| G3 Gelehrte  | Papier-Kette, Gelehrtenhaus, Ziel             | SIM 1 · UI 1 · ART 1 | +1   |

Summe ≈ 10–12 Pakete.

### 4.3 Abgrenzung zu Erweiterung 1 und Risiken

- **Abgrenzung:**
  - Der Ast «Seefahrt» berührt Werft und Geleit (E1 K3/K4) und muss nach Erweiterung 1 kommen.
  - Wissen konkurriert mit dem Inselruf (I-187). Kommen beide, braucht jede Grösse eigene Quellen und eigene Senken.
    Sonst reicht eine.
- **Risiken:**
  - Nähe zum Rat (einmalige Wahl je Stufe, I-112) und zu den Edikten.
  - Der Eigenwert ist kleiner als bei §2 und §3.
  - Regeländerungen treffen das Balancing breit. Jede Erfindung braucht eine Dominanz-Rechnung.

## 5 Vergleich der Erweiterungs-Skizzen

| Kriterium           | «Neue Ufer»                         | «Ernte und Frost»                     | «Gelehrte und Gilden»          | Ref.: E2 «Rivalen» (vorgemerkt) |
| ------------------- | ----------------------------------- | ------------------------------------- | ------------------------------ | ------------------------------- |
| Neue Frage          | was riskiere ich, wie anderes Klima | reicht der Vorrat, welche Insel nährt | welcher Ast, welche Gilde      | wo zuvorkommen, wann Streit     |
| Säulen              | Besiedeln, Ketten, Bevölkerung      | Ketten, Handel, Besiedeln             | Bevölkerung, Ketten            | neue Säule Konkurrenz           |
| Lohn ausser Geld    | ja (Fundstücke, Gebiet, Ziel)       | ja (Überleben, Wachstum)              | ja (Regeln)                    | Inselbesitz                     |
| Ziele 1–3 bitgleich | ja                                  | ja mit Schalter «aus»                 | ja (nach Ziel 2 eigener Strom) | nein                            |
| Ton                 | ruhiger Aufbau                      | ruhiger Aufbau mit Rhythmus           | ruhiger Aufbau                 | Wettkampf                       |
| Recherche-Beleg     | stärkstes Lob (R3)                  | Zyklus statt Plateau (R1 1.8)         | Richtlinien «eh» (R3)          | KI-Güte umstritten (R2)         |
| Grösse (Richtwert)  | ≈ 12–16 Pakete                      | ≈ 10–14 Pakete                        | ≈ 10–12 Pakete                 | ≈ 25–35 Pakete (E1 §3)          |
| Empfehlung          | **nach E1, vor den Rivalen**        | zweiter Kandidat, Schalter            | dritter Kandidat               | nach den anderen                |

## 6 Modus «Inselproben» (I-190, mit I-191)

**Zweck in einem Satz:** Der Spieler spielt eine feste Karte mit festem Ziel auf Zeit und schlägt seine eigene Bestzeit.
Weil die Sim deterministisch ist, ist der Vergleich mit Freunden fair.

### 6.1 Regeln

- **Einstieg:** Menü «Neue Insel» mit dritter Auswahl «Probe». Dort stehen 5–6 Proben und die «Tagesinsel».
- **Probe als Def** (`src/sim/defs/probes.ts`): Kartennummer, Krisenstufe, Freischaltung, Ziel (Ziel 1, 2 oder 3, Denkmal
  oder Meisterprüfung), Text. Beispiel: «Probe 3 · Felsige Küste · Handelsstadt · Krisen hoch».
- **Tagesinsel** (I-191):
  - Kartennummer = Datum `JJJJMMTT` (Ortszeit); Ziel und Krisenstufe je Wochentag aus einer Def-Liste.
  - Startet der Spieler kurz vor Mitternacht, behält die Partie die Karte des Starts.
- **Während der Probe:** Die Uhr läuft in Ticks; Tempo und Pause ändern die Wertung nicht. Kopfzeile «Probe 3 · 12:40». Alle
  übrigen Regeln sind die des Grundspiels.
- **Ende:**
  - Mit dem Ziel-Ereignis erscheint die Karte «Probe bestanden · 38:12 · Bestzeit 41:50 → 38:12».
  - Knopf «Ergebnis kopieren» liefert den Text ohne Spoiler: «Inselreich · Probe 3 · Handelsstadt 38:12 · Krisen hoch».
  - Danach läuft das Spiel als freies Spiel weiter, ohne weitere Wertung.
- **Abbruch:** «Neue Insel» oder Laden eines anderen Stands. Kein Strafeintrag.

### 6.2 Wertung

- Wertung = Ticks bis zum Ziel. Kleinere Zahl ist besser.
- Lokale Bestenliste je Probe (beste 5) und eine Liste der letzten 14 Tagesinseln.
- Keine globale Liste, weil es keinen Server gibt (ADR-001). Nach R2 ist das sogar fairer, weil es keine Betrüger-Ranglisten gibt.

### 6.3 Save-Folgen

- **Welt:** neues Feld `probe: { id, kind: 'probe' | 'tag', date? } | null`, Save-Sprung v18 → v19. Migration setzt
  `null`. Test: v18 lädt als Grundspiel; eine neuere Version wird mit Hinweis abgewiesen.
- **Neben dem Spielstand:** Ablage `inselreich.proben` (Version, Bestzeiten, Tagesliste) wie `inselreich.settings`.
  Fremdformat oder kaputte Ablage wird verworfen, mit einmaligem Hinweis. Kein Absturz, Test für das Abweisen.
- **Baseline:** Das Grundspiel ist unverändert, der Controller spielt keine Probe. Proben bekommen keine Pins, nur Tests
  der Wertungsfunktion.

### 6.4 Randfälle und Prüfbarkeit

- **Kartennummer:** Wenn die Kartenerzeugung die Nummer ersetzt (`seedUsed`, `src/sim/world.ts:123`), speichert die Probe
  die genutzte Nummer. Test: gleiche Probe → gleiche Karte.
- **Neuladen:** Ein älterer Stand setzt die Uhr zurück, die Zeit bleibt ehrlich. Kein Schutz nötig.
- **Freischaltung:** «Alles frei» nur in eigens markierten Proben.
- **Vitest:** Wertung aus Ticks, Tagesnummer aus Datum, Lesen und Abweisen der Ablage, Migration v18 → v19.
- **Browser-Check:** Probe starten, Ziel erreichen, Karte und Kopiertext prüfen.

## 7 Modus «Knappe Zeiten» (I-192)

**Zweck in einem Satz:** Ein Szenario beginnt mit einer harten Startlage, in der jede Münze und jede Kette zählt. So erlebt
der Spieler die Wirtschaft wieder als Engpass, ohne dass das Grundspiel sich ändert (R722).

### 7.1 Regeln

- **Szenario** = Probe (§6) plus Startbedingung und Niederlage. Auswahl unter «Probe» → «Szenarien».
- **Drei Szenarien:**

| Szenario       | Startbedingung                                                          | Ziel und Frist                          | Niederlage                             |
| -------------- | ----------------------------------------------------------------------- | --------------------------------------- | -------------------------------------- |
| «Schuldbrief»  | Kasse −3000, Zins 2 % der Schuld je Minute                              | schuldenfrei vor 20:00                  | Frist verstrichen                      |
| «Karge Heimat» | Steinbruch daheim gesperrt; Stein nur von der Felsbucht oder per Zukauf | 50 Bürger vor 45:00                     | Frist verstrichen                      |
| «Sturmjahr»    | Krisen hoch, Sturm doppelt gewichtet, Feuerwache erst mit Siedlern      | 30 Bürger vor 30:00, kein Haus verloren | mehr als 5 Häuser durch Brand verloren |

- **Niederlage:** Karte «Szenario verloren», danach freies Spiel. Kein Abbruch der Partie.
- **Werte:** Jede Startbedingung ist ein Schalter in den Defs. Die Regeln des Grundspiels lesen den Schalter nur dort, wo
  das Szenario greift.

### 7.2 Wertung

- «Bestanden» oder «verloren», bei Bestanden die Zeit.
- Ehrenbuch-Stücke (I-186) je bestandenem Szenario.
- Ablage wie §6.2.

### 7.3 Save-Folgen

- Das Feld `probe` aus §6.3 bekommt `scenario: id`. Kein eigener Sprung, wenn §6 und §7 im selben Release kommen; sonst ein
  weiterer Sprung.
- **Baseline:** Grundspiel bitgleich. Jedes Szenario bekommt einen Controller-Lauf als Nachweis der Lösbarkeit; dieser Lauf
  ist nicht Teil des Balancing-Tests.

### 7.4 Randfälle

- **«Schuldbrief»:** Wie verhält sich die bestehende Regel bei negativer Kasse (Bauen gesperrt?)? Die Rechnung muss zeigen,
  dass 20 min mit Abstand reichen. Zins nie auf positive Kasse.
- **«Karge Heimat»:** Ohne Kontor auf der Felsbucht bleibt nur Zukauf. Die Rechnung prüft, ob 45 min mit Zukauf allein
  reichen; sonst ist das Szenario eine Falle.
- **«Sturmjahr»:** Eine Brand-Kette vor der ersten Feuerwache darf nicht zwingend zur Niederlage führen. Die Rechnung nutzt
  den Krisen-Strom des Seeds.
- **Entartung:** Szenario mit «Alles frei» umgehen. Darum hat jedes Szenario eine feste Freischaltung.

## 8 Offene Entscheide (Entwurf, Entscheider in Klammern)

| Nr. | Frage                                                               | Empfehlung                                                            | Entscheider |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------- |
| T1  | Reihenfolge der Erweiterungen nach «Stände und Segel»               | «Neue Ufer» vor «Ernte und Frost», beide vor den Rivalen (E2)         | **Nutzer**  |
| T2  | Titel der nächsten Erweiterung                                      | «Neue Ufer»                                                           | **Nutzer**  |
| T3  | Jahreszeiten als Standard «an» (Umbau der Kernschleife ab Minute 1) | nein, Schalter mit Standard «aus»; Entscheid erst nach Playtest       | **Nutzer**  |
| T4  | Modus «Inselproben» (§6) mit Tagesinsel als nächstes Brainstorming  | ja, Stufe voll, Save v19                                              | L0          |
| T5  | Szenarien (§7) im selben Brainstorming wie §6                       | ja; Rahmen einmal bauen, ein Szenario als Prüfling                    | L0          |
| T6  | Meta-Boni über Partien (Prestige, Vermächtnis) ausschliessen        | ja (R722: Startboni ändern nur Restgeld; Vergleichbarkeit der Proben) | L0          |
| T7  | Inselruf (I-187) als Antwort auf O8/K5 der Erweiterung 1 prüfen     | ja, Rechnung durch `design-economy-designer` vor dem Brainstorming    | L0          |

## 9 Selbstprüfung (Prüffragen lead-design)

1. **Säulen:**
   - «Neue Ufer» stärkt Besiedeln.
   - «Ernte und Frost» stärkt Ketten und Handel.
   - «Gelehrte und Gilden» stärkt Bevölkerung.
   - Die Modi stärken alle Säulen, ohne eine zu ändern.
   - Wenn eine Erweiterung misslingt, leidet nur ihre Spätphase. Das Grundspiel ist geschützt durch den Schalter bzw. die
     Bindung an Ziel 3.
2. **Echte Wahl:**
   - Expedition (Einsatz gegen Risiko).
   - Winter (Vorrat, Route oder Zukauf mit Aufschlag).
   - Gilde (exklusiv).
   - Probe (Weg zur Bestzeit).
   - Szenario (Knappheit).
   - Dominanzgefahr: Fundstücke der sicheren Karte, Zukauf im Winter. Beides ist oben adressiert.
3. **Rückkopplung:**
   - Jahreszeiten wirken als gewollte Bremse mit Rhythmus.
   - Die Fundstücke sind ein kleiner Motor. Weil die Sammlung endlich ist, wächst er nicht ohne Grenze.
4. **Randfälle:** In §6.4 und §7.4 genannt. Für die Erweiterungen in §2.4, §3.4 und §4.3, im Detail erst in der Spec.
5. **Einfachere Variante:** Ehrenbuch (I-186) und Inselproben (§6) liefern einen grossen Teil der Langzeitmotivation für
   ≈ 5–6 Pakete, ohne Erweiterung. Darum gehen sie in der Rangliste vor.

**Urteil der Selbstprüfung:** OK für die Modi (§6, §7) als Grundlage eines Brainstormings. BEDENKEN für die Erweiterungen:
Die Zahlen sind ungerechnet, und die Reihenfolge entscheidet der Nutzer.
