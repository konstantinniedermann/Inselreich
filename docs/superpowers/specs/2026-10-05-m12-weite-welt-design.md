# M12 „Weite Welt" — Designvorschlag (Brainstorming)

Stand: 2026-10-05 · Paket: M12-BRAIN · Autor: lead-design · Prozessstufe: voll · Status: **Vorschlag für das
Gate Brainstorming** (noch keine Spec; die Spec schreibt `design-spec-author` nach dem Gate)

Grundlage: Programm `2026-10-02-programm-nutzerfeedback.md` (Zeilen S6, S7, S8, G5, Abschnitt 3.6, Meilensteintabelle
M12), Ideen I-004, I-006, I-008 in `docs/ideen.md`, Rulings R90, R210, R219, R225, Weltzustand `src/sim/types.ts`
(Save v6). Werte und Bilanzen: [Anhang 01 — Wirtschaft](2026-10-05-m12-weite-welt-design/anhang-01-wirtschaft.md)
(`design-economy-designer`).

## 1. Spielerzweck

**Ein Satz:** „Ich sehe ferne Inseln, gründe auf einer davon ein zweites Kontor, baue dort an, was nur dort wächst,
und schicke ein Schiff, das die Ware zu meiner Stadt bringt."

Spielschleifen:

| Schleife                   | Was der Spieler tut                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Handgriff (Sekunden)       | Karte zur Fremdinsel schwenken, Kontor setzen, Route mit zwei Klicks anlegen, Schiff fahren sehen                    |
| Ziel-Belohnung (Minuten)   | Erste Ladung Gewürz kommt an; Kaufleute-Häuser werden voll; die Lagerleiste der Heimat zeigt das neue Gut            |
| Fortschritt (ganze Partie) | Welche Insel zuerst (nah und klein oder fern und fruchtbar)? Zweite Route, Fremdinsel selbst besiedeln, Handelsstadt |

## 2. Verständnis und Annahmen

**Gegeben** (Auftrag, Programm, Rulings): M12 bringt mehrere Inseln, ein zweites Kontor, Lager je Insel, Schiffe und
Handelsrouten (S6–S8); Fruchtbarkeit je Insel ist „der stärkste Grund zur Expansion" (Programm 3.6); die heutige
Karte bleibt Referenz für den Balancing-Lauf (Programm F13); Save wird v7; I-004, I-006, I-008 sind hier einzuordnen.

**Annahmen** (Rückfragen, die der Skill an den Nutzer stellen würde, von lead-design beantwortet; L0 kann jede
kippen):

| Nr.  | Annahme                                                                                                                                                                | Begründung                                                                                                                                                                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01 | Die Heimatinsel bleibt der heutige Generator (64×64, gleicher Seed → gleiche Insel). Die Welt wächst durch **weitere Inseln**, nicht durch eine grössere Heimatinsel.  | Balancing-Referenz bitgleich; Safari-Canvas-Grenze; R90 „grössere Karte und mehr Inseln" erfüllt als grössere _Welt_                                                                                                                                |
| A-02 | Drei Fremdinseln je Spiel (zwei Pflicht, die dritte zuerst streichbar), aus dem Spiel-Seed abgeleitet, in festen Abstandsbändern um die Heimat (nah, mittel, fern).    | Echte Wahl ohne Erkundungs-Mechanik; drei reichen für „welche zuerst?"                                                                                                                                                                              |
| A-03 | Kein Gegner, kein Krieg, keine Piraten, kein Nebel des Unerforschten.                                                                                                  | Säulen sind Aufbau und Wirtschaft; Kampf ist ein anderes Spiel                                                                                                                                                                                      |
| A-04 | **Das erste Ziel (50 Bürger) bleibt ohne Expansion erreichbar**; das zweite Ziel (60 Kaufleute) verlangt sie.                                                          | Erstes Spiel von 15 Minuten unverändert lernbar; Expansion ist die Antwort auf „und jetzt?"                                                                                                                                                         |
| A-05 | Seefahrt schaltet sich mit Stufe 4 frei (bestehender Schritt U6 „Kaufleute offen", direkt nach dem Sieg), zusammen mit Gewürz. Die Fremdinseln sind ab Start zu sehen. | Vor U6 gäbe es keinen Grund zu expandieren (Anhang 01: Erz lohnt nie, Gewürz braucht erst Stufe 4); Sieg im Referenzlauf bei 6750 Ticks ≈ 11 min → Expansion im ersten Spiel von 15 Minuten erreichbar; Programm: „Kaufleute finanzieren Expansion" |
| A-06 | Geld, Steuerstufe, Freischaltungen, Aufträge, Krisen und Verkaufssättigung bleiben **global**; Lager, Versorgung, Wege und Anbindung sind **je Insel**.                | Ein Spieler, eine Kasse; Waren dagegen liegen dort, wo sie erzeugt werden — sonst braucht es kein Schiff                                                                                                                                            |
| A-07 | Routen verbinden genau zwei Kontore; Schiffe fahren ohne Zufall in fester Fahrzeit.                                                                                    | Einfach lesbar; deterministisch                                                                                                                                                                                                                     |
| A-08 | Arbeitsname des neuen Guts: **Gewürz** (allgemeines Wort, keine fremde Marke); endgültiger Name in der Spec.                                                           | ADR-006                                                                                                                                                                                                                                             |

## 3. Säulen-Passung

| Säule                             | Wirkung                                                                                   | Leidet bei Misslingen                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Insel besiedeln                   | **stark**: neue Inseln, zweites Kontor, Standortwahl auf Inselebene                       | ja — wenn die Fremdinsel nur ein Lagerposten ist, fehlt „besiedeln"  |
| Produktionsketten                 | mittel: erste Kette über zwei Inseln (Plantage fern, Verbrauch daheim)                    | ja — wenn Routen zu fummelig sind, bricht die Kette an der Bedienung |
| Bevölkerung versorgen, aufsteigen | mittel: Kaufleute brauchen Gewürz; Häuser auf der Fremdinsel brauchen deren eigenes Lager | ja — wenn Gewürz-Mangel Kaufleute zu schnell schrumpfen lässt        |
| Wirtschaft (Steuern, Handel)      | stark: Schiffe kosten Unterhalt, Route gegen Zukauf am Kontor ist eine echte Rechnung     | ja — Endlos-Überschuss oder Pflicht-Bankrott (Anhang 01: keins)      |

## 4. Ansätze

### A — Eine grosse Kachelkarte (Programm-Plan E1)

Neuer Generator „gross" (z. B. 128×128) mit mehreren Inseln in **einem** Kachelraster; Schiffe suchen ihren Weg über
Wasserkacheln. „Klein" bleibt der heutige Generator ohne Expansion.

- **Für:** echtes Segeln im Hauptbild, eine Welt ohne Sonderfälle in Kamera und Picking, deckt „grössere Karte"
  wörtlich.
- **Gegen:** braucht Terrain-Chunking (Safari-Grenze 4096², Programm S6), `serviceAvailable` skaliert ×4
  (Beobachtung 2026-10-02), Wegsuche auf Wasser, Save ×4 grösser; zwei Spielmodi (klein ohne, gross mit Expansion)
  heissen doppelte Tests; „klein" bekäme M12 nie.

### B — Getrennte Inseln mit Seekarte

Jede Insel ist ein eigenes Kachelraster; das Hauptbild zeigt immer **eine** Insel, eine Seekarte (Karte im UI) zeigt
Inseln als Silhouetten und Schiffe als Symbole auf Strecken. Inselwechsel per Klick.

- **Für:** kein Chunking, Render je Insel unverändert, Heimatinsel bitgleich, Sim und Render klar getrennt.
- **Gegen:** „in die Ferne segeln" findet nur auf einer UI-Karte statt; das Meer wird nie gesehen; das ist das
  schwächste Anno-Gefühl der drei.

### C — Archipel: Inselraster in einem gemeinsamen Meer (Empfehlung)

Sim wie B (jede Insel ein eigenes Raster ≤ 64×64 mit eigenem Lager), aber jede Insel hat einen **festen Platz im
Meer** (Versatz in Kachelkoordinaten). Das Hauptbild ist **eine** durchgehende Ansicht: Die Kamera schwenkt über das
offene Meer von Insel zu Insel, Schiffe fahren sichtbar zwischen den Kontoren. Das offene Meer ist kein Kachelraster,
sondern eine gezeichnete Fläche; Schiffe folgen einer bei der Erzeugung festgelegten Linie mit Wegpunkten. Die Sim
kennt nur die Fahrzeit; die Position auf der Linie berechnet der Renderer aus dem Fortschritt.

- **Für:** sichtbares Segeln wie A, Kosten nahe B: Jede Insel ist ihr eigener Terrain-Cache (natürliches Chunking),
  keine Wegsuche auf Wasser, Heimatinsel bitgleich, ein Spielmodus. Der Inselwechsel ist nur ein Kamerasprung
  (Seekarten-Knopf oder Taste).
- **Gegen:** Kamera, Picking und Culling müssen mehrere Raster mit Versatz kennen; Zeichenlast beim Herauszoomen über
  mehrere Inseln (Zoomgrenze, Culling je Insel).

**Empfehlung C.** Gleiches Spielerlebnis wie A (Meer sehen, Schiffe fahren sehen, Inseln nebeneinander) bei
Render-Risiko nahe B. **Streichvariante:** Wird C im Render zu teuer, fällt die Darstellung auf B zurück (Kamera
springt, Meer zwischen den Inseln entfällt); Sim, Save und UI bleiben gleich. Damit ist die teure Entscheidung
umkehrbar.

## 5. Design der Empfehlung

### 5.1 Welt und Inseln

- **Heimatinsel** = heutiger Generator, Platz (0, 0). Unverändert in Terrain, Kontor und Zufallsstrom.
- **Drei Fremdinseln** aus einem **eigenen**, vom Spiel-Seed abgeleiteten Zufallsstrom (der Strom der Heimat und der
  Aufträge/Krisen darf sich nicht verschieben). Abstandsbänder, Lage im Band per Seed:

  | Insel    | Seeabstand d | Fahrzeit (Ticks, `10 × d`) | Grösse  | Merkmale                         | Rolle                                        |
  | -------- | ------------ | -------------------------- | ------- | -------------------------------- | -------------------------------------------- |
  | A nah    | 25–30        | 250–300                    | ≤ 24×24 | Gewürz (Platz für 2 Plantagen)   | billiger Einstieg, reicht für ≈ 40 Kaufleute |
  | B mittel | 35–40        | 350–400                    | ≤ 36×36 | Gewürz, Gebirge (Stein)          | teurer, trägt alle 60 Kaufleute              |
  | C fern   | 55–65        | 550–650                    | ≤ 48×48 | Gras, Wald, Gebirge, kein Gewürz | Platz-Pfad; erste Streichung bei Engpass     |

- **Fruchtbarkeit je Fremdinsel** ist ein Inselmerkmal (im Generator garantiert): Die Gewürzplantage braucht das
  Merkmal „Gewürz" der Insel. Die Heimat trägt nie Gewürz. **Erz entfällt** (Anhang 01 §4: Werkzeug über Erz 26 je
  Stück gegen 21,5 über Holz, Holz fehlt nie → nie die bessere Wahl).
- **Anzeige:** Tooltip und Mouse-over über einer Fremdinsel nennen Name, Grösse, Merkmale und Fahrzeit zur Heimat.

### 5.2 Zweites Kontor gründen

- Ab Freischaltung „Seefahrt" steht in der Bauleiste **Kontor** für Fremdinseln; je Insel höchstens eines.
- Standortregel wie heute (Küste, Meerwasser). Kosten **800 Geld, 20 Holz, 8 Werkzeug, 10 Stein** aus dem
  Heimatlager, Unterhalt 60/min, Versorgungsradius 8 (wie Marktplatz). Bauwaren auf der Fremdinsel kommen aus deren
  Lager: per Schiff oder durch **Zukauf am neuen Kontor** (Handel geht an jedem Kontor) — die erste Plantage steht
  also auch ohne Schiff. Eine eigene Startladung entfällt (einfacher, gleiche Wirkung).
- Danach gelten auf der Fremdinsel alle heutigen Regeln: Wege zum eigenen Kontor, Betriebe, Märkte, Häuser.
- **Kein Expeditionsschiff** als eigener Zustand: Das Gründen ist ein Bauakt; die Fahrt wird nur gezeigt (Kann).

### 5.3 Lager je Insel

- Jedes Kontor hat ein eigenes Lager, höchstens 100 je Gut (heutige Regel). Betriebe liefern an, Häuser und Märkte
  entnehmen **nur auf ihrer Insel**.
- Lagerleiste und Warenbilanz zeigen die Insel, auf der die Kamera steht (Inselname davor); ein Schalter „alle"
  ist Kann.
- Handel am Kontor (Kauf/Verkauf) geht an **jedem** Kontor; Kaufpreise fest, Verkaufssättigung **global je Gut**
  (sonst wäre Verkauf über zwei Kontore eine Verdopplung).
- Aufträge werden an jedem Kontor geliefert, aus dessen Lager.

### 5.4 Schiffe und Handelsrouten

- **Handelsschiff** wird am Heimatkontor gekauft: **1200 Geld, 25 Holz, 10 Werkzeug**, Unterhalt 90/min,
  Ladung 50 Einheiten, **höchstens 4 Schiffe** (Deckel gegen „Schiff als Endlos-Lager").
- **Route** = zwei Kontore + je Richtung bis zu zwei Güter. Regel: bei Ankunft erst entladen (bis Ziellager 100,
  Rest bleibt an Bord), dann laden bis Ladung voll, dabei bleibt die **Reserve R** im Quelllager (0–90 in Zehnern,
  Standard 10); bei zwei Gütern bekommt jedes zuerst die halbe Ladung. Ein Gut darf nur in einer Richtung fahren.
  Bedienung im Kontor-Panel: „Route zu …", Güter und Reserve wählen, fertig.
- Ablauf: Laden und Entladen ohne Aufenthalt, Fahrzeit `10 × d` Ticks, **nie warten** (fährt mit dem, was da ist,
  auch leer). Routenschritt nach Produktion, vor Verbrauch und Steuer, ohne Zufallsziehung.
- Durchsatz eines Schiffs auf Route B ≈ 6–7 Gewürz je 100 Ticks → versorgt etwa 60 Kaufleute (Anhang 01 §1b).
- Darstellung: Schiff fährt sichtbar auf der Linie; am Kontor liegt es beim Umschlag. Panel zeigt Ladung, Ziel,
  Restzeit.

### 5.5 Neues Gut und Bedarf

- **Gewürz** (Arbeitsname): Kauf 40, Verkauf 12; Plantage (200 Geld, 12 Holz, 3 Werkzeug; Takt 5 s, Unterhalt
  90/min; Gras im Radius 2 wie Zuckerrohr) nur auf Inseln mit dem Merkmal; keine Verarbeitung (ein zweiter Betrieb
  brächte nur Fläche, keine Entscheidung).
- Kaufleute brauchen **0,1 Gewürz je Einwohner und 100 Ticks**; die Steuer der Kaufleute steigt **20 → 22**, damit
  auch der reine Zukauf über den Bürgern bleibt.
- **Bilanz je Kaufmann und 100 Ticks:** heute +11,5 · Zukauf +9,5 · Route über B +12,3 · Insel A plus Zukauf +11,3.
  Route lohnt laufend ab ≈ 8 Kaufleuten; Amortisation bei 60 Kaufleuten ≈ 4,6 min, bei 20 ≈ 16 min. Endzustand 60
  Kaufleute: +500 (Zukauf) bis +670 (Route) je 100 Ticks — **kein Pfad negativ, keiner dominant** (Anhang 01 §2).
- Gewürz ist in M12 **kein Auftragsgut** (Auftragsziehung bleibt bitgleich).

### 5.6 Freischaltung und Hilfe

- Schritt **U6** (Stufe 4 offen, direkt nach dem Sieg) erhält die Funktion „Seefahrt" sowie Gewürz und Plantage:
  Meldung, Kontor für Fremdinseln und Handelsschiff in der Bauleiste, Taste/Knopf „Seekarte" (Kamerasprung zu einer
  Insel). Vorher sind die Fremdinseln zu sehen, aber nicht bebaubar (Mouse-over: „Seefahrt mit den Kaufleuten").
  Die Liste `unlocked` ändert sich dadurch nicht (bestehender Schritt, nur neue Inhalte).
- Der **nächste Schritt** der Inselchronik nennt nach U6 (Kaufleute offen) „Gründe ein Kontor auf einer Insel mit
  Gewürz".

### 5.7 Krisen

- Brand wählt sein Ziel unter allen brennbaren Gebäuden aller Inseln; Sturm wirkt überall; Boom wirkt global.
- **Bitgleichheit:** Mit nur der Heimatinsel ist die Kandidatenliste identisch zu heute; der Zufallsstrom zieht
  nicht öfter.

## 6. Einordnung der Bausteine

| Baustein                        | Empfehlung                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **I-004 Lagerhaus**             | **Nicht in M12.** „Lager je Insel" gibt jeder neuen Insel ihre eigenen 100, und Schiffe puffern Ware. Das Wahl-Bedenken aus R210 (Grenz-Plus wird Pflicht) bleibt. Status bleibt **geparkt**; wieder vorlegen, falls der M12-Playtest „Heimatlager voll durch Routen" zeigt.                           |
| **I-006 Händler-Sonderangebot** | **Kann-Häppchen am Ende von M12** (E6), streichbar: Ein fremdes Händlerschiff legt sichtbar an einem Kontor an, Angebot ≤ 20 % unter Kaufpreis, höchstens 20 Einheiten, Restzeit — nutzt das Schiff aus E4. Eigene Ziehung in eigenem Zufallsstrom, damit Aufträge und Krisen nicht verschoben werden. |
| **I-008 Standortgüte**          | **Nicht in M12.** Fruchtbarkeit je Insel ersetzt die Standortwahl auf grober Ebene („welche Insel"); ein Ertragsbonus je Kachel kommt mit Baseline-Neumessung und gehört in ein späteres Wirtschafts-Paket. Status bleibt **geparkt**.                                                                 |
| G5 Fluss                        | **Nicht in M12** (keine Spielentscheidung hängt daran; der Grund „nur Karte gross" entfällt mit C). Backlog.                                                                                                                                                                                           |
| Minen (Erz)                     | **Gestrichen** (Anhang 01 §4: nie die bessere Wahl). Gebirge auf Fremdinseln trägt Steinbrüche; Stein ist das natürliche zweite Gut einer Gewürzroute (Glas).                                                                                                                                          |

## 7. Randfälle und entartete Strategien

| Fall                                                | Regel                                                                                                                                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quelllager leer / unter Reserve                     | Schiff wartet nie, fährt mit dem, was da ist (auch leer); Panel nennt den Grund                                                                                                                 |
| Ziellager voll                                      | Schiff entlädt bis 100, Rest bleibt an Bord und wird bei der nächsten Ankunft zuerst geliefert; kein Verfall auf See                                                                            |
| Kontor II abgerissen, Schiff unterwegs oder beladen | Abriss des Kontors ist gesperrt, solange eine Route es nutzt („Erst Route auflösen"); kein verwaistes Schiff                                                                                    |
| Route aufgelöst, Ladung an Bord                     | Schiff fährt heim, entlädt bis 100, Rest verfällt mit Meldung                                                                                                                                   |
| Gleiches Gut in beiden Richtungen                   | Nicht wählbar (Validierung), sonst Kreisverkehr ohne Nutzen                                                                                                                                     |
| Gewürz als Exportfarm                               | +4,5 je Einheit, durch globale Sättigung bei ≈ 45 je 100 Ticks gedeckelt (Rum heute ≈ 30); Plantage erst ab U6                                                                                  |
| Häuser auf Fremdinseln ohne Ware als Steuerquelle   | Wie auf der Heimat: Häuser brauchen Kontor- oder Marktradius, zahlen unversorgt halb; als Beobachtung eingetragen                                                                               |
| Schiff als Endlos-Lager                             | Höchstens 4 × 50 = 200 Einheiten, Unterhalt laufend, Ladung nicht verkaufbar                                                                                                                    |
| Kauf an Kontor A, Verkauf an Kontor B               | Gleiche Preise überall, Sättigung global → kein Gewinn                                                                                                                                          |
| Geld negativ                                        | Schiffe fahren weiter (Unterhalt läuft wie bei Betrieben); Gründen und Kauf gesperrt wie andere Bauten; Fixkosten M12 (≈ 25 + 15 je Plantage je 100 Ticks) ≪ Steuer eines Kaufmannshauses (440) |
| Spiel ohne Expansion                                | Erstes Ziel unberührt; Kaufleute bleiben ohne Gewürz unvollständig versorgt (halbe Steuer, kein Wachstum, heutige Regel)                                                                        |
| Alter Spielstand (v6)                               | Migration: heutiges Lager wird Lager der Heimat; Fremdinseln werden aus dem Seed erzeugt und sind leer                                                                                          |
| Gewürz am Kontor kaufen statt Route                 | Erlaubt (+9,5 je Kaufmann); Route besser ab ≈ 8 Kaufleuten, Amortisation 5–16 min                                                                                                               |

## 8. Nicht im Scope

Kampf, Piraten, Gegenspieler, Erkundung oder Nebel, Kartengrösse als Spieloption, grössere Heimatinsel, Fluss (G5),
Lagerhaus (I-004), Standortgüte (I-008), Routen mit mehr als zwei Häfen, freie Wegpunkte, Werft und Schiffstypen,
Bevölkerungswanderung zwischen Inseln, Inselchronik je Insel, Politik/Erlasse, Stufe 5.

## 9. Zuschnitt in Teilmeilensteine

Reihenfolge nach Abhängigkeit; Dateibereiche grob, Plan und Task-Schnitt durch lead-tech.

| Teil   | Inhalt                                                                                                                                                                 | Strang (Owner)                                 | Baseline                                                    | Abhängig von | Release                         |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- | ------------ | ------------------------------- |
| **E0** | Inselbezug im Weltzustand (Lager, Kacheln, Kontor je Insel; Heimat = Insel 0), Save v7 mit Migration; Dienst-Abdeckung als Index statt O(Häuser × Gebäude)             | Sim (lead-tech)                                | **bitgleich**                                               | —            | Werkzeug-Merge vorab (wie H-T1) |
| **E1** | Fremdinsel-Generator (eigener Strom, Fruchtbarkeit), Archipel-Plätze; Render mehrerer Raster mit Versatz, offenes Meer, Kamera/Picking/Culling                         | Sim + Render (lead-tech, lead-art)             | bitgleich                                                   | E0           | M12-Release                     |
| **E2** | Kontor II gründen, Bauen und Versorgung auf Fremdinseln, Handel an jedem Kontor (Sättigung global), Lagerleiste je Insel, Freischaltung U6 „Seefahrt", Seekarten-Knopf | Sim + UI (lead-tech)                           | bitgleich (Controller nutzt es nicht; Fingerabdruck prüfen) | E1           | M12-Release                     |
| **E3** | Gewürz: Gut (am Ende von `GOODS`), Plantage, Bedarf Kaufleute, Steuer 22, Preise; Merchant-Controller `feedSpice`                                                      | Sim + Balancing (lead-tech, Werte lead-design) | **Bruch `balance-merchants`** (Ruling)                      | E1           | M12-Release                     |
| **E4** | Schiffe und Routen: Sim (Ablauf, Ladung), Panel-Bedienung, Schiff auf der Linie und am Kontor                                                                          | Sim + UI + Render                              | bitgleich                                                   | E2           | M12-Release                     |
| E5     | Seekarten-Übersicht als kleine Karte (Kann), Fahrt der Gründung zeigen (Kann)                                                                                          | UI/Render                                      | —                                                           | E4           | streichbar                      |
| E6     | I-006 Händlerschiff mit Angebot (Kann, ≤ 20 %)                                                                                                                         | Sim + UI                                       | eigener Strom, prüfen                                       | E4           | streichbar                      |

Parallelität: E3 neben E2/E4 (Dateien `defs/` gegen `ships.ts`/UI weitgehend getrennt); E1-Render neben E1-Sim nach
gemeinsamer Schnittstelle (Inselliste mit Versatz). E2 und E4 nur zusammen releasen: Ein Kontor ohne Schiff hat
keinen Spielwert. Ein Release „M12" am Ende, E0 vorab.

## 10. Risiken

| Risiko              | Wirkung                                                                                                                                           | Gegenmittel                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Save-Format (v7)    | Jeder `stock`-Zugriff bekommt Inselbezug; alte Saves müssen laden                                                                                 | E0 allein und bitgleich; Fixture `save-v6.json`; Migrationstest; Gate Spec durch lead-tech                                             |
| Perf Sim            | Tick über mehrere Inseln; `serviceAvailable` skaliert schlecht                                                                                    | Index in E0; Messung mit vorhandenem Perf-Budget-Helfer (`tests/helpers/perfBudget.ts`)                                                |
| Perf Render         | Herauszoomen zeigt mehrere Inseln                                                                                                                 | Terrain-Cache je Insel, Culling je Insel, Mindestzoom; Stilrahmen §5 Performance-Budget                                                |
| Baseline            | Fremdinseln, neuer Zufallsstrom, neues Gut könnten Fingerabdruck und Sieg (6750 Ticks) ändern                                                     | eigener Strom; `spice` am Ende von `GOODS`; kein Gewürz-Auftrag; Controller-Lauf vor und nach E0–E2 vergleichen; nur E3 bricht bewusst |
| Balancing Kaufleute | `balance-merchants` hoch gefährdet: Zukauf zählt als Defizit (Aufstieg 3 → 4 wartet 600 statt 300 Ticks), Abstand zur Grenze 12 000 nur 800 Ticks | Controller `feedSpice`, Neumessung 11 200 / 320; Eskalation Steuer 24, dann Grenze 13 000 (F-03)                                       |
| UI-Aufwand Routen   | Routen-Bedienung kann fummelig werden                                                                                                             | Regel „zwei Häfen, zwei Güter je Richtung"; Bedienung im vorhandenen Kontor-Panel, keine eigene Ansicht                                |
| Lesbarkeit          | Spieler verliert die Heimat aus dem Blick                                                                                                         | Seekarten-Knopf/Taste springt zur Heimat; Meldungen nennen die Insel                                                                   |

## 11. Grober Aufwand (nach `metriken/richtwerte.md`)

Grundlage: tech-sim-engineer 13 Tools/Task, Task-Review 6, Final-Review opus 53, Playtest 27, Spec 38 + Werte 28,
Plan je Teil ≈ 33 (lead-tech kleines Paket), Fix-Runde jeder vierte Task; Render-Teile mit Optik-Faktor ×2 (R217).

| Teil             | Tasks | Tools (≈)                                 |
| ---------------- | ----- | ----------------------------------------- |
| Spec (+ Anhänge) | —     | 130                                       |
| E0               | 7     | 220                                       |
| E1               | 9     | 330                                       |
| E2               | 7     | 230                                       |
| E3               | 4     | 140                                       |
| E4               | 9     | 300                                       |
| E5/E6 (Kann)     | 5     | 160                                       |
| **Summe Kern**   |       | **≈ 1 350** (ohne Kann), mit Kann ≈ 1 500 |

Minuten ≈ Tools ÷ 4 → **≈ 340 min** Arbeitszeit im Kern; bei zwei parallelen Strängen ab E1 deutlich weniger
Laufzeit. Werte mit n < 3 sind Anhaltspunkte.

## 12. Offene Punkte

| Nr.  | Frage                                                                                                                                                                                                                                               | Empfehlung                                                                                                                           | Wer entscheidet     |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| F-01 | Ansatz C (Archipel im gemeinsamen Meer) statt A (eine grosse Karte, Programm-Plan)?                                                                                                                                                                 | C, mit B als Streichvariante                                                                                                         | L0                  |
| F-02 | Heimatinsel bleibt 64×64; „grössere Karte" (R90) als grössere _Welt_ aus mehreren Inseln ausgelegt?                                                                                                                                                 | Ja. Kein Richtungswechsel (Titel, Genre, Säulen bleiben); als Auslegung festhalten und dem Nutzer im Release-Bericht nennen          | L0 (Auslegung §5.2) |
| F-03 | Zweites Ziel braucht Gewürz (Zukauf oder Route)? Ruling-Vorschlag: Kaufleute brauchen Gewürz 0,1, Steuer 20 → 22, Merchant-Controller kauft Gewürz zu, Ziel-2-Baseline und `minMoneyAfterWin` neu gemessen; bei Irrtum Steuer 24 bzw. Grenze 13 000 | Ja (bewusster Bruch `balance-merchants`; `balance.test.ts` bleibt bitgleich)                                                         | L0 (Ruling)         |
| F-04 | Seefahrt mit U6 (nach dem Sieg) statt mit U5 (erste Bürger)?                                                                                                                                                                                        | U6: vor Stufe 4 gibt es keinen Expansionsgrund (Erz gestrichen, Gewürz erst für Kaufleute); Sieg ≈ 11 min, also noch im ersten Spiel | L0                  |
| F-07 | Zwei oder drei Fremdinseln?                                                                                                                                                                                                                         | Drei; Insel C (Platz-Pfad) ist die erste Streichung                                                                                  | L0                  |
| F-05 | I-004 und I-008 bleiben geparkt, I-006 wird Kann-Häppchen E6?                                                                                                                                                                                       | Ja                                                                                                                                   | L0                  |
| F-06 | E0 vorab als bitgleicher Werkzeug-Merge ausserhalb des Release?                                                                                                                                                                                     | Ja (senkt das Risiko der grössten Umstellung, main bleibt spielbar)                                                                  | L0                  |

**Nutzer-Vorbehalte (Verfassung §5.3):** keiner im engen Sinn — Titel, Genre und Kernsäulen bleiben. F-02 berührt
eine frühere Nutzeranweisung (R90 „grössere Karte"); die Auslegung entscheidet L0, sie gehört aber in den
Nutzerbericht, damit der Nutzer sie kippen kann.

## 13. Selbstprüfung Gate Brainstorming

1. **Säulen:** stärkt „Insel besiedeln" und „Wirtschaft" deutlich, „Produktionsketten" und „Bevölkerung" mittel;
   leiden würden Wirtschaft (Überschuss/Bankrott) und Lesbarkeit — beides mit Anhang 01 und Randfällen adressiert.
2. **Ein Satz / 15 Minuten:** Satz steht (§1). Die Fremdinseln sind ab Start im Meer zu sehen; Seefahrt kommt mit
   dem Sieg (Referenzlauf ≈ 11 min), das erste Kontor auf einer Fremdinsel ist im ersten Spiel von 15 Minuten
   erreichbar. Die volle Schleife (Gewürz für 60 Kaufleute) liegt im zweiten Teil der Partie — gewollt, das erste
   Ziel bleibt lernbar wie heute.
3. **Scope:** begrenzt (§8), Teilmeilensteine E0–E4 Kern, E5/E6 streichbar; passt in Stufe voll mit Teil-Plänen.
4. **ADR-006:** nur Mechaniken (Inselgruppe, Fruchtbarkeit, Route zwischen zwei Häfen); eigene Namen; „Gewürz" ist
   ein allgemeines Wort.
5. **Einfacher?** B wäre einfacher, verliert aber das sichtbare Segeln; C ist so geschnitten, dass es auf B
   zurückfallen kann. Weiter vereinfacht: keine Expedition, keine Werft, zwei Häfen je Route.

**Urteil: OK** — mit Bedenken zu Render-Last (C) und UI-Aufwand der Routen, beide im Spec-Gate durch lead-tech und
lead-art zu prüfen.
