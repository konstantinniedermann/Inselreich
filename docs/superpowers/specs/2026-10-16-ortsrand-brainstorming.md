# Ortsrand — gewachsene Siedlung statt ausgestanzter Raster (Brainstorming und Release-Zuschnitt)

Stand: 2026-10-16 · Paket `design-ortsrand` · Autor: lead-art · Prozessstufe voll · Grundlage: Nutzerfeedback
`.studio/handoffs/nutzerfeedback-2026-10-16-ortsrand.md` (Hauptcheckout) mit drei verbindlichen Nutzerentscheiden.
Kein Spec-Text: Werte sind Startwerte. Die Spec mit Abnahmekriterien entsteht erst, wenn L0 das Release einplant.

**Nutzerentscheide (verbindlich):** (N1) Nur Optik: Umschwung und Hof-Deko liegen auf freien Nachbarfeldern und
weichen beim Bebauen. Kein Save-Wechsel, kein Balancing, kein Platzverlust. (N2) Gebäudevarianz «Kern + Anbauten»: Die
Regel «Silhouette = Identität» in `src/render/variants.ts` wird gelockert, nicht aufgehoben, und gehört ins selbe
Release. (N3) Priorität Pool. **Nachtrag Nutzer (2026-10-16):** Die Kanten des Gebauten (z. B. Wege) sind
schärfer als die der Welt. Das ist ein Stilbruch und wird als Querschnitt «Kantensprache» behandelt (2.5, KS).

## 1. Bildziel in einem Satz

Ein einzelnes Holzfällerhaus am Waldrand hat einen festgetretenen Vorplatz, einen Holzstoss an der Seitenwand, einen
Hackklotz und einen Trampelpfad zum Weg. Ein zweites Holzfällerhaus hat stattdessen einen Schuppen mit Vordach. Der Weg
durch die offene Wiese franst an den Rändern ins Gras aus, hat Fahrspuren und hie und da einen Pfosten. Sobald der
Spieler daneben baut, räumt der Hofkram ohne Spur das Feld.

**Art-Direction-Satz für das Release:** _Je freier die Umgebung, desto mehr Umschwung. Je dichter der Ort, desto
aufgeräumter. Der Kern bleibt die Identität, der Rand erzählt. Am Boden spricht das Gebaute die Kantensprache der
Natur._

## 2. Bestandsaufnahme: wo die harten Kanten entstehen

Belegbilder: `.studio/qa/design-ortsrand/` (Hauptcheckout, nicht versioniert; Bildserie des Playtesters, Motive 01–10,
siehe Abschnitt 2.3). Die Fundstellen gelten für `main` @ `f248534f`.

### 2.1 Die zwei Nutzerbeispiele

| #   | Stelle                       | Was man sieht                                                                                                                                                                                    | Ursache im Code                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1  | Einzelgebäude ohne Umschwung | Das Haus steht auf einer exakt rautenförmigen Hofplatte, rundherum ungestörte Wiese. Es gibt keinen Vorplatz, keinen Kram und keinen Pfad. Alle Häuser eines Typs sind gleich gebaut.            | Der Hof ist Teil des Gebäude-Sprites: `yard()`/`raggedYard()` in `src/render/sprites.ts:611–678`. Die Platte ist der Footprint, nur ein Erdrand wächst um `RIM_GROW = 0.08` Kachel nach aussen (`:52–55`). Der Sprite-Cache-Schlüssel kennt keine Nachbarn (`spriteCache.ts:49`), also kann der Hof nicht auf freie Nachbarfelder reagieren. Grasbüschel `tufts` nur an den Vorderecken (`:681`). |
| K2  | Wege durch freie Natur kahl  | Ein Erdband zwischen den Kachelmitten. Links und rechts davon liegt ein kahler, rautenförmiger Grasstreifen ohne Büschel und Blumen. Es gibt keine Pfosten, keine Fahrspuren und keinen Wegrain. | `drawRoads` (`sprites.ts:2496–2548`): zwei Striche (0,62/0,5 Kachel) und Steinchen bei `hash2 > 0.8`, sonst nichts. **Hauptursache für die «gemähte Schneise»:** `paintDecor` überspringt jede Wegkachel ganz (`terrain.ts:1528–1531` `isFreeGrass`, `occ` = Gebäude oder Weg). Die Wegkachel bekommt also weder Büschel noch Blumen, auch nicht in den rund 0,19 Kachel neben dem Band.          |

### 2.2 Weitere Stellen (eigene Funde)

| #   | Stelle                                    | Was man sieht                                                                                                                                                                                                | Ursache im Code                                                                                                                                                                                                                                                 |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K3  | Wald an Gebäuden und Wegen kachelgenau    | Neben Gebautem schrumpfen die Kronen in die eigene Kachel. Der Waldrand folgt der Rasterlinie («Keksform»), auch hinter dem Gebäude, wo nichts verdeckt würde.                                               | `tight`-Kacheln (`forest.ts:372`, `:388`, `:698–709` `TIGHT_R`): freie Wald-/Wiesenkachel mit `object` im 8er-Umfeld. Kronen ganz in der Kachel, keine Gruppen (`:566`). Die Regel unterscheidet nicht zwischen vorn (verdeckt) und hinten.                     |
| K4  | Vorplatz vorn bleibt ohne Vorwald         | Die drei Kacheln vor dem Gebäude (+x, +y, +x+y) sind exakt rautenförmig frei von Vorwald.                                                                                                                    | `quiet` in `iso.ts:278–293`. Die Regel ist richtig (Bäume vorn verdecken das Gebäude), aber die freie Fläche ist leer statt genutzt. Genau hier gehört flacher Hofkram hin.                                                                                     |
| K5  | Felder und Plantagen als Teppich          | Zucker- und Gewürzfeld sind exakte 2×2-Rauten mit Streifen. Die Furchen enden an der Kachelkante, daneben beginnt unberührte Wiese oder Wald. Es gibt keinen Feldrain und keine Feldsteine.                  | `plantationBody` (`sprites.ts:1313–1325`): Hof als Feld, Innenrand `I = 0.08`. Felder sind Gebäudekörper ohne Bezug zur Umgebung.                                                                                                                               |
| K6  | Weiden ohne Weide                         | Schäferei und Rinderhof brauchen freie Wiese im Umkreis (`buildings.ts:82`, Radius 3, 16 Kacheln), aber auf dieser Wiese sieht man nichts von der Nutzung: kein Zaun, keine Tränke, kein abgefressenes Gras. | Kein Render-Code liest `site`-Regeln für den Boden. `errands.ts` liest sie nur für Laufwege.                                                                                                                                                                    |
| K7  | Sackgassen und Wegenden                   | Das Wegende ist eine runde Kappe mit voller Breite und hört abrupt im Gras auf. Eine Einzelkachel ist ein Kreis.                                                                                             | `lineCap = 'round'`, `dots` (`sprites.ts:2514`, `:2528–2541`).                                                                                                                                                                                                  |
| K8  | Kontor und Fischer an der Küste           | Das Kontor sitzt mit Steinhof und Kaimauer am Wasser (`waterSides`, `renderer.ts:365`). Auf dem Strand daneben liegt nichts Hafentypisches: keine Fässer, Netze, Boote auf Sand, kein Sandpfad.              | Hafenkram fehlt im Katalog. `decor.ts` hält Mauerreste bewusst 8 Kacheln vom Kontor fern (`RUIN_KONTOR_GAP`, `:72`), Strand-Elemente kennen das Kontor nicht.                                                                                                   |
| K9  | Marktplatz-Pflaster endet an der Kante    | Das Pflaster bildet eine exakte Raute. Die anschliessenden Erdwege stossen stumpf daran.                                                                                                                     | `marketBody` (`sprites.ts:1166`): Pflaster nur im Footprint.                                                                                                                                                                                                    |
| K10 | Abriss-Lücke                              | Nach dem Abriss bleibt eine leere Wiesenraute, sauber wie vor dem Bau. Nachbardeko rückt nicht nach. Ausgeblendete Stempel kommen nicht zurück.                                                              | Kein Zustand kennt die Geschichte (D1, nur `buildingId`/`road`). Stempel rücken nicht nach (`decor.ts:590`). **Kein Fehler:** Abrissnarben bräuchten ein Save-Feld (verletzt N1). Die Lücke heilt aber, sobald der Umschwung der Nachbarn sie nutzt (siehe U1). |
| K11 | Stempel vor Gebäuden fallen ersatzlos weg | Solitärbäume und Obstbäume auf den drei Vorderkacheln eines Gebäudes verschwinden. Der Platz bleibt leer.                                                                                                    | `stampBlocked` (`decor.ts:539–544`), D2 (`:23–24`).                                                                                                                                                                                                             |
| K12 | Ortskern und Rand gleich behandelt        | Die Wiese zwischen zwei Häusern sieht genauso aus wie die freie Landschaft. Es gibt keinen Gradienten «Ortskern → Ortsrand → Feld → Wildnis».                                                                | Alle Boden-Deko hängt nur von Seed und Kachel ab, Belegung wirkt nur als Aus-Schalter (`paintDecor`, `terrain.ts:1565`). Ein Ortsnähe-Feld gibt es nicht.                                                                                                       |
| K13 | Gleiche Gebäude                           | Zwei Holzfäller unterscheiden sich nur im Farbton (`VARIANT_COUNT = 4`, `variants.ts:19`). Form und Anbau sind identisch.                                                                                    | Die Art-Direction-Regel «nie Dachform, Firstrichtung, Höhe oder Umriss» (`variants.ts:4–6`) ist durch Tests verriegelt (`tests/render/variants.test.ts` H-R7 AK3/AK4: Hülle und überdeckte Fläche in allen Varianten gleich).                                   |

**Fremdinseln:** Dort stehen nur Aussenkontore (`kontor2`) und, wenn der Spieler baut, Wege und Gebäude. Der
Terrain-Layer jeder Insel wird gepatcht (`terrain.ts:1703`, `:2166`). Stempel zeigt `iso.ts` aber nur auf der Heimat
(D4). Ortsrand muss deshalb ausdrücklich auch auf Aussenposten laufen (offener Punkt O5).

### 2.3 Bildbelege

Bildserie `qa-playtester`, Seed 1, `main` @ `f248534f`, 1920×1080, DPR 2, unter `.studio/qa/design-ortsrand/`
(Hauptcheckout). Das Szenen-Skript `ortsrand.mjs` liegt im selben Ordner. Die Bilder sind zugleich die
**Vorher-Galerie** der Release-Abnahme (A8).

| Bild                                  | Beleg für   | Befund (Playtester, von lead-art gesichtet)                                                                                        |
| ------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `01-wohnhaus1-z1/-z2`                 | K1, K2      | Haus allein auf Wiese, kein Garten, kein Kram; die einzelne Wegkachel ist eine aufgesetzte braune Scheibe.                         |
| `02-wohnhaus3-z2`                     | K1          | Stufe-3-Haus sitzt ohne Übergang auf der Sand-Gras-Grenze am Kontor.                                                               |
| `03-holzfaeller-z1/-z2`               | K1, K3, K4  | Hütte klein vor geschlossener Kronenwand; keine Rodung, kein Holzstoss; davor ein dunkler Streifen mit gerader Diagonalkante.      |
| `04-weg-z1/-z2`                       | K2, K7      | Gleich breites, glattes Erdband mit runden Enden; Wiese beidseits unberührt; die Sackgasse endet abrupt.                           |
| `05-plantage-schaeferei-z1`           | K5, K6      | Zuckerrohr als Raute mit scharfer Kante am Waldrand; die Schäferei steht als Zaunviereck mitten im Gras, die Weide ist unsichtbar. |
| `06-kontor-z1/-z1.5`, `09-fischer-z1` | K8          | Viel leerer Sand um Kontor und Fischer; der Fischer mit Steg fügt sich am besten ein.                                              |
| `07-siedlung-z1`                      | K12, K7, K3 | **Deutlichstes Bild:** Raster und Wegenden sichtbar, Ortsrand als scharfe Linie zur Wiese, Wald am Rand als Wand.                  |
| `08-siedlung-abriss-z1`               | K10         | Abriss-Lücke als kahle Grünfläche ohne Spur.                                                                                       |
| `09-steinbruch-z1`                    | K1          | Steinbruch frei am Gebirgsfuss, ohne Halde und Pfad.                                                                               |
| `10-markt-z1.5`                       | K9          | Plattenfläche mit scharfen Kanten zwischen schnurgeraden Wegen, härtester Kontrast zu den Kronen.                                  |

Grenze der Serie: Ein Wohnhaus lässt sich nur in Versorgungsreichweite eines Kontors bauen. «Allein auf der Wiese»
ist deshalb nur näherungsweise abgebildet (01 ≈ 8 Kacheln vom Kontor).

### 2.4 Was schon gut ist und bleiben muss

- Vorwald, Farnsaum und Waldrand-Büsche (`forest.ts:236–388`, `decor.ts:1480–1517`) machen den Übergang Wald ↔ Wiese
  weich. Gesucht ist dieselbe Qualität für Gebautes ↔ Natur.
- Der ausgefranste Erdrand (`raggedYard`) und der Kontaktschatten (`contact`) erden die Gebäude schon.
- Die Wege haben gerundete Enden und gejitterte Mitten. Ihr Rand ist aber geometrisch (K14), siehe 2.5.
- `quiet` (K4) und `tight` (K3) schützen die Lesbarkeit: Nichts Hohes darf vor einem Gebäude stehen. Diese Regel gilt
  auch für alles Neue.

### 2.5 Kantensprache: Stilbruch zwischen Natur und Gebautem (Nachtrag Nutzer)

Der Nutzer schreibt dazu wörtlich: «das design der welt hat auch keine so scharfen kanten wie das design der gebauten
strukturen (bsp wege).» Gemeint ist ein **Stilbruch**, nicht eine einzelne Stelle. Die Natur entsteht im
Terrain-Layer pixelweise aus Feldern, Rauschen und Tonstufen. Ihre Kanten sind organisch, unscharf und gebrochen.
Das Gebaute entsteht als Vektorpfad mit Volltonfüllung. Seine Kanten sind gerade Linien, Konturstriche,
gleichmässige Flächen und harte Kontrastränder. Beide Sprachen stossen ohne Übergang aneinander. Am deutlichsten
sieht man das in `04-weg-z2` (Ausschnitt um die Kreuzung): Neben der Wiese mit ihren weichen, verwischten
Aufhellflecken liegt ein orangebraunes Band mit dunkler Konturlinie, schnurgerade und überall gleich breit.

| #   | Element                                     | Zeichner und Linienstil (Fundort)                                                                                                                                                                                                                                                                                                                                                    | Bild                            | Muss scharf bleiben?                                                                                                             |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| K14 | Wegrand                                     | `drawRoads` (`sprites.ts:2496–2548`): zwei Volltonstriche übereinander (`earthEdge` 0,62, `earth` 0,5). Das ergibt eine dunkle **Konturlinie** von 0,06 Kachel auf beiden Seiten. Breite konstant, Segmente gerade zwischen den Kachelmitten, an Kreuzungen spitze Innenecken (V-Kerbe), Einzelkachel als perfekte Scheibe. Pro Frame als Vektor gezeichnet, nicht im Terrain-Layer. | `04-weg-z1/-z2`, `01`, `10`     | Nein. Der **Kern** muss als Weg lesbar bleiben (Anbindung ist Spielinformation); die Kante nicht.                                |
| K15 | Wegsteinchen                                | `ctx.fillRect` mit 0,06 Kachel in `rockLight` (`sprites.ts:2547`): achsparallele Quadrate. Die Kiesel der Wiese (`groundShapes`, `groundDecor.ts:264`) sind dagegen unregelmässig.                                                                                                                                                                                                   | `04-weg-z2`                     | Nein.                                                                                                                            |
| K16 | Pflaster, Marktplatz                        | `marketBody` (`sprites.ts:1166–1173`): Steinplatte als Footprint-Raute, dazu **durchgehende Fugenlinien** (`p.line`) bei 0,6/1,0/1,4 in beiden Achsen. Ergebnis: ein Schachbrett mit Linealkante.                                                                                                                                                                                    | `10-markt-z1.5`                 | Nein. Der Platz muss als Markt lesbar bleiben (Stände tragen das).                                                               |
| K17 | Hofplatte, Sockel, Fundament                | `yard`/`raggedYard` (`sprites.ts:611–678`): Platte als exakte Raute, Erdrand als **Sägezahn-Polygon** (Stützpunkte alle 0,12 Kachel, Ausschlag 0,05) in einer Volltonstufe. Kein Übergang ins Gras. Picking nutzt im Aufzeichnungsmodus die gerade Platte (`:618`).                                                                                                                  | `03-holzfaeller-z2`, `01`, `02` | Nein. Picking hängt nicht am Bildmodus-Rand.                                                                                     |
| K18 | Feld- und Plantagenflächen                  | `plantationBody` (`sprites.ts:1313–1325`): 8 Streifen, jeder zweite als Vollton-Quad über die ganze Breite. Die Furchenenden sind linealgerade an der Feldkante. Bei der Schäferei ist die Koppel ein exaktes Rechteck (`sheepfarmBody`, `p.quad` ab v = 1,05).                                                                                                                      | `05-plantage-schaeferei-z1`     | Nein. Das Feld muss als 2×2 erkennbar bleiben.                                                                                   |
| K19 | Zäune                                       | `sheepfarmBody` (`sprites.ts:1268–1276`): Pfosten in festen Abständen (0,15/0,65/1,15/1,65), durchgehende Planken (`leftPlane`/`rightPlane`) genau auf der Footprint-Kante.                                                                                                                                                                                                          | `05-plantage-schaeferei-z1`     | Körper: geometrisch erlaubt, aber gebrochen (Durchhang, Abstände).                                                               |
| K20 | Kontor- und Hafenkanten                     | `kontorBody` (`sprites.ts:898–960`): Steinplatte als Raute (wie K17). Die Kaimauer ist ein Quad mit geraden Kanten (Krone 0,14). Gemauerte Kai-Kanten sind glaubwürdig gerade; die Landseite der Platte nicht.                                                                                                                                                                       | `06-kontor-z1/-z1.5`            | Kaimauer ja (Mauerwerk); Landseite der Platte nein.                                                                              |
| K21 | Schlagschatten der Gebäude                  | `buildingShadow` (`sprites.ts:2396`), gezeichnet in Durchgang 5 (`renderer.ts:727`): konvexe Hülle als **Parallelogramm**, eine Füllung, harte Kante. Baumschatten sind Achteck-Ellipsen (`trees.ts:925`), der Waldboden blendet weich (`floorShare`).                                                                                                                               | `03-holzfaeller-z2`             | Nein. Die Form (Höhe) muss lesbar bleiben, die Kante darf weich werden.                                                          |
| K22 | Bau-Vorschau, Hover, Pfad-Vorschau, Auswahl | `drawHover` (`renderer.ts:321–357`, `footprintPath`, weisser Umriss `HOVER_LINE`), `drawGhost`, `drawPathPreview` (`pathPreview.ts`): Rauten mit Umriss, halbtransparent.                                                                                                                                                                                                            | (nicht im Bild)                 | **Ja, bewusst.** Das sind Signale der Ebene 12: Sie zeigen Raster, Bauplatz und Gültigkeit und müssen sich von der Welt abheben. |

**Was die Natur schon kann und sich wiederverwenden lässt:**

| Technik der Natur                                                                                                  | Fundort                                            | Wiederverwendung für das Gebaute                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Saumfeld: 0/1-Maske, 3×3-Binomialfilter, bilinear, 3 gedrehte Rauschoktaven, Höhenlinie, `floorShare` (Smoothstep) | `woodField.ts:21–70` (`woodBlur` nimmt jede Maske) | Saum von Weg, Hof und Feld im Terrain-Layer: Maske = Weg- bzw. Gebäudekacheln, eigene Salze; Wegsaum und Hofsaum (KS2, U1), Feldrand (KS6) |
| Abtastverwerfung `WARP` (Salze 9100/9101)                                                                          | `terrain.ts:1067–1069`                             | Rand der Trampelflächen und des Wegsaums verwerfen statt Rautenkante                                                                       |
| Weicher Typ-Übergang `TYPE_BLEND_POW`                                                                              | `terrain.ts:88–91`                                 | Mischung Erde ↔ Gras am Hof statt Volltonplatte                                                                                            |
| Mottling (±1 %, `rotNoise` 103/113)                                                                                | `terrain.ts:60`, `:447`, `:637`                    | Korn auf Trampelflächen und Wegsaum                                                                                                        |
| Tonstufen mit 1–2 px weicher Kante (`toneStep`, `TONE_EDGE_PX`, Stilrahmen S2)                                     | Stilrahmen S2                                      | Wegrand und Hofrand als 2 Tonstufen statt Konturstrich                                                                                     |
| Durchhang `sag` im Bildmodus                                                                                       | `sprites.ts:208–218`, `:344`                       | Zaunplanken, Fugen, Kaimauerkrone leicht gebrochen                                                                                         |
| Unregelmässige Kiesel und Findlinge (`groundShapes`)                                                               | `groundDecor.ts:264`                               | Ersatz für die quadratischen Wegsteinchen (K15)                                                                                            |
| Grasbüschel aus Halm-Dreiecken (`tufts`)                                                                           | `sprites.ts:681`                                   | Gras, das über den Wegrand wächst (KS3)                                                                                                    |

Leitsatz: **Flaches Gebautes am Boden spricht an der Kante die Sprache der Natur. Gebaute Körper (Wände, Dächer,
Zäune, Kaimauern) bleiben geometrisch, aber gebrochen. Signale bleiben scharf.**

## 3. Grundsatzentscheide (Architektur der Idee)

Die Ideen in Abschnitt 4 teilen sich drei Bausteine. Sie werden einmal gebaut und von allen genutzt.

**B1 Ortsrand-Analyse (rein, ohne DOM).** Eine neue Datei `src/render/ortsrand.ts` rechnet je Insel und `layoutKey`
aus der Belegung:

- **freie Seiten** je Gebäude (8 Nachbarn: frei Gras, frei Wald, Sand, Wasser, Weg, belegt);
- **Besitzer** jeder freien Kachel im Ring r ≤ 1 um Gebautes. Teilen sich zwei Gebäude eine Kachel, gewinnt der
  Betrieb vor dem öffentlichen Bau vor dem Wohnhaus, danach die kleinere Gebäude-Id;
- **Ortsnähe** `n(x, y)` = Zahl der Gebäudekacheln im Umkreis 3. Daraus folgen die Klassen Kern (n ≥ 6), Rand (1–5)
  und Land (0).

Gecacht wird wie `restObjects` (`iso.ts:458`) je Welt und `layoutKey`. Die Analyse ist lokal: Ein Bau an (x, y)
ändert Ergebnisse nur im Umkreis 3.

**B2 Zwei Schichten, je nach Höhe.**

- **Boden (gebacken):** Alles Flache (Trampelflächen, Pfade, Wegrain, Feldrain, Fahrspuren) malt `paintDecor` in den
  Terrain-Layer. Das kostet nichts je Frame. Die Invalidierung ist schon da (`updateTerrainLayer`, `terrain.ts:1860`).
  Dafür muss `occupancy` Codes statt 0/1 liefern (Gebäude, Weg, Betriebsart), und der Patch-Rand von `dirtyRect` wächst
  von 1 auf die Ortsrand-Reichweite (2, für Pfade 3).
- **Objekte (sortiert):** Alles mit Höhe (Fässer, Kisten, Heuballen, Karren, Holzstoss, Zaun, Pfosten, Anbauten) wird
  ein `decor`-Item im sortierten Durchgang (Ebene 6, `RANK decor = 1`, `iso.ts:147`). Gezeichnet wird es aus einem
  kleinen Stempel-Cache je Art, Variante und Zoomstufe, wie die bestehenden Stempel (`decorStamps.ts:1037–1060`).

**B3 Höhenregel (Lesbarkeit).** Auf den Vorderkacheln eines Gebäudes (+x, +y, +x+y, die `quiet`-Kacheln) liegt nur
Flaches bis 0,15 `ISO_H` (Bretter, liegender Holzstoss, Trampelpfad, Beet). Auf Seiten- und Rückkacheln ist Kram bis
0,5 Kerngebäude-Traufhöhe erlaubt. Signale (Ebene 12) liegen ohnehin über allem.

**Invariante D7 (neu, neben D1–D6 in `decor.ts`):** Ortsrand-Elemente hängen von der Belegung ab, aber nur lokal
(r ≤ 3). Sie sind eine reine Funktion von (Seed, Kachel, Belegungsmuster, Gebäudetyp und -stufe), haben eigene Salze
600–619 und verändern weder Ort noch Los bestehender D1-Elemente und Stempel. Liegt auf einer Kachel ein
S/E-Element oder ein Stempel, tritt der Ortsrand dort zurück.

## 4. Ideenkatalog

Bewertung: Nutzen (N) und Aufwand (A) je 1–3; Rang = Nutzen/Aufwand. Kosten: F = je Frame, P = Patch- und
Erstbild-Zeit, C = Cache. Tools sind grobe Schätzungen für Umsetzung plus Tests.

### U — Umschwung um Gebäude (Nutzerbeispiel 1)

**U1 Hofsaum über die Rasterkante (Boden).**

- _Was man sieht:_ Festgetretene Erde und abgewetztes Gras laufen vom Hof 0,3–0,5 Kachel auf freie Nachbarfelder
  hinaus, an der Eingangsseite am weitesten. Der Rand franst aus wie beim Waldboden: Rauschen statt Raute, 2 Tonstufen
  nach S2.
- _Regel:_ Je freie Nachbarseite des Besitzers (B1). Die Reichweite nimmt mit der Ortsnähe ab (Land 0,5, Rand 0,35,
  Kern 0,15). Der Saum weicht, sobald die Nachbarkachel belegt ist. Zwischen zwei Häusern verschmelzen die Säume zu
  einer gemeinsamen Gasse.
- _Kosten:_ F 0, P ca. +10–20 % `lastPatchMs` (Rauschen je Pixel nur im Saum), C 0. Aufwand mittel (≈ 60 Tools).
- _Risiko:_ niedrig. Die Gebäudekante muss gegen den hellen Saum lesbar bleiben (S4); Abhilfe: Saum eine Tonstufe
  dunkler als die Hofplatte.
- **N 3 · A 2 · Rang hoch.**

**U2 Hofkram je Gebäudetyp (Objekte).**

- _Was man sieht:_ 1–4 Requisiten je Gebäude auf freien Nachbarfeldern und am Hofrand. Der Katalog stammt aus dem
  Gewerbe. Ab Zoom 0,75 sichtbar.
- _Regel:_ Platz nach B1 (Besitzer, freie Seite), Höhe nach B3, Zahl nach Ortsnähe (Land bis 4, Rand bis 3, Kern 0–1).
  Das Los kommt aus `hash2(seed + 60x, x, y)`. Der Kram weicht beim Bebauen der Kachel. Während der Bau-Vorschau wird er
  unter dem Geist ausgeblendet (zeigt: «das darf weg»).
- _Katalog (Startvorschlag):_

  | Gebäude                     | Requisiten (flach = vorn erlaubt)                                                  |
  | --------------------------- | ---------------------------------------------------------------------------------- |
  | Wohnhaus Stufe 1–2          | Gemüsebeet (flach), Holzstoss, Bank, Wäscheleine (hinten), Flechtzaunstück         |
  | Wohnhaus Stufe 3+           | Blumenkübel, Fass, niedrige Steinmauer, Bank                                       |
  | Holzfäller                  | Holzstoss, Hackklotz mit Beil, Sägebock, Rindenhaufen (flach), Baumstümpfe am Wald |
  | Steinbruch                  | Steinblöcke, Schutthaufen (flach), Schubkarre                                      |
  | Fischer                     | Netzgestell, Fischkörbe, umgedrehtes Boot auf Sand, Reusen                         |
  | Jagdhütte                   | Fellrahmen, Geweih am Pfosten, Holzstoss                                           |
  | Schäferei, Rinderhof        | Heuballen, Tränke, Weidezaun-Stücke (siehe F2), Futterkrippe                       |
  | Weber                       | Wollballen, Garnkörbe, Bleichwiese mit Tuchbahnen (flach)                          |
  | Zuckerrohr, Gewürz          | Karren mit Garben, Körbe, Feldsteinhaufen (siehe F1)                               |
  | Brennerei                   | Fässer (gestapelt), Karren                                                         |
  | Werkzeugmacher, Glashütte   | Kisten, Kohlehaufen, Sandhaufen (Glas), Holzscheite                                |
  | Kapelle, Schule, Rathaus    | Bank, Linde (kleiner Baum, hinten), Brunnen (nur Rathaus, hinten)                  |
  | Badehaus, Feuerwache        | Holzstoss, Wassertrog, Eimer, Leiter an der Wand                                   |
  | Kontor, Aussenkontor, Markt | Fässer, Kisten, Seilrollen, Säcke, Handkarren (siehe K8/H1)                        |
  | Denkmal                     | kein Kram (Würde), nur Blumen (U1-Saum mit Blüten)                                 |

  Fehlt ein Typ (neue Gebäude, z. B. aus Erweiterung 1), gilt der Rückfall je Kategorie, wie bei `SILHOUETTES`.

- _Kosten:_ F je sichtbarem Item ein `drawImage`. Schätzung bei Zoom 1 Siedlung ≈ 80–150 Items, ≈ +0,1–0,2 ms
  `renderMedian`. C: eigener Requisiten-Cache. Bei ≈ 30 Arten × 2 Varianten × Zoomstufen sind es bei Zoom 2 / DPR 2
  ≈ 3–4 MiB; eigene Grenze `PROPS_CACHE_MAX_BYTES = 4 MiB` mit LRU, getrennt vom `DECOR_CACHE_MAX_BYTES`. Aufwand gross
  (≈ 120 Tools, die Zeichner sind der Hauptteil).
- _Risiko:_ mittel. Unruhe im Bild (S5: Kram ist Boden-nah, gedämpft, keine Signalfarben, ΔE2000 ≥ 20 zu `signal*`).
  Verwechslung «Ware liegt herum» mit Lager- oder Stillstandsanzeige: Kram ist statisch und hängt nicht am
  Betriebszustand.
- **N 3 · A 3 · Rang hoch** (Kern des Nutzerwunschs).

**U3 Trampelpfade (Boden).**

- _Was man sieht:_ Ein schmaler, ausgetretener Grasspfad (0,15 Kachel) von der Gebäudetür zum nächsten Weg. Bei
  Sammelbetrieben (Holzfäller, Jäger, Steinbruch, Fischer) läuft ein zweiter Pfad in Richtung des Arbeitsfelds.
- _Regel:_ Nur über freie Kacheln, höchstens 3 Kacheln lang, Ziel ist die nächste Wegkachel bzw. der Schwerpunkt der
  `site`-Kacheln (statisch aus dem Layout, nicht aus der Laufweg-Phase von `errands.ts`). Er weicht beim Bebauen
  (Pfad endet am Hindernis) und entfällt im Kern.
- _Kosten:_ F 0, P klein, Patch-Rand 3. Aufwand mittel (≈ 40 Tools).
- _Risiko:_ niedrig. Ein Trampelpfad darf nicht wie ein gebauter Weg aussehen (Anbindung ist Spielinformation!):
  höchstens ein Drittel der Wegbreite, Grasfarbe statt Erdton, unterbrochen.
- **N 2 · A 2 · Rang mittel.**

### W — Wege durch die Natur (Nutzerbeispiel 2)

**W1 Wegrain (Boden).**

- _Was man sieht:_ Büschel und Blumen wachsen auf der Wegkachel bis an das Erdband heran. Am Bandrand stehen dichtere,
  höhere Grasbüschel, die den Rand ausfransen. Die gemähte Schneise (K2) verschwindet.
- _Regel:_ `paintDecor` behandelt Wegkacheln als «halbfrei»: Deko ausserhalb eines Korridors von 0,36 Kachel um die
  Bandachse (`roadCenter`-Segmente). Die Randbüschel folgen der Bandkante. Im Kern entfällt der Wegrain (gepflegter
  Ort).
- _Kosten:_ F 0, P klein. Aufwand klein bis mittel (≈ 30 Tools). Bestehende Büschel- und Blumen-Lose bleiben gleich,
  sie werden nur im Korridor gefiltert.
- _Risiko:_ niedrig. Weg- und Band-Lesbarkeit unverändert, da die Bandfarbe gleich bleibt.
- **N 3 · A 1 · Rang sehr hoch** (billig, wirkt überall).

**W2 Weg-Details nur bei freier Seite (Objekte und Boden).**

- _Was man sieht:_ Auf Wegen durch offenes Land, je 4–8 Wegkacheln ein Detail: Holzpfosten, Randstein, Steinhaufen,
  selten ein Wegkreuz oder Bildstock an Abzweigungen oder Kurven, ein Meilenstein. Auf geraden Abschnitten liegen zwei
  dunklere Fahrspuren im Band (gebacken).
- _Regel:_ Nur Seiten, deren Nachbar frei (Gras, Wald) ist, und nur bei Ortsnähe Land oder Rand. Abstand ≥ 3 Kacheln
  zwischen Details (Los wie `STAMP_SPACING`). Ein Detail weicht, wenn die Seitenkachel bebaut wird.
- _Kosten:_ F wenige Items (≤ 1 je 4 Wegkacheln), C klein (≈ 6 Arten). Fahrspuren als Boden. Aufwand mittel
  (≈ 50 Tools).
- _Risiko:_ niedrig. Wegkreuz und Bildstock dürfen nicht wie ein Gebäude lesen: kleiner als 0,3 Kachel, kein Dach in
  Gebäudefarbe.
- **N 3 · A 2 · Rang hoch.**

**W3 Wegenden verlaufen sich (Boden).**

- _Was man sieht:_ Eine Sackgasse im offenen Land wird zum Ende hin schmaler und geht in einen Trampelpfad über
  (0,5 Kachel). Im Ort bleibt die runde Kappe.
- _Regel:_ Wegkachel mit genau einem Nachbarn und Ortsnähe Land/Rand.
- _Kosten:_ F 0 (zusätzliche Kurzstriche in `drawRoads`, ≤ 1 je Sackgasse), Aufwand klein (≈ 15 Tools).
- _Risiko:_ Die Sackgasse muss als Wegende lesbar bleiben (Bauen am Ende). Der Auslauf ist Gras, nicht Erde.
- **N 2 · A 1 · Rang hoch.**

### F — Felder, Weiden, Wald

**F1 Feldrain und Furchen-Auslauf (Boden).** Furchen laufen 0,2–0,3 Kachel über die Plantagenkante auf freie Wiese
aus und blassen ab. Ein Rain mit Blüten und Feldsteinen säumt die Kante. Weicht beim Bebauen. F 0, P klein, Aufwand
mittel (≈ 40 Tools). Risiko: Das Feld muss als 2×2 ablesbar bleiben (Auslauf nur 1 Tonstufe). **N 2 · A 2 · mittel.**

**F2 Weide sichtbar (Objekte und Boden).** Für Schäferei und Rinderhof stehen Zaunstücke und eine Tränke auf freien
Wiesenkacheln im Radius, dazu leicht abgegrastes Gras (eine Tonstufe heller). Die Zaunstücke sind Fragmente, kein
geschlossener Zaun (der läse sich als Grenze oder Bauregel). F wenige Items, Aufwand mittel (≈ 40 Tools). Risiko: Der
Spieler könnte Zäune für eine Bausperre halten. Deshalb nur Fragmente, flach und weichend. **N 2 · A 2 · mittel.**

**F3 Waldkante hinter Gebäuden lockern (Wald).** `tight` gilt nur noch für Kacheln vor und seitlich des Gebäudes. Auf
den Rückkacheln (−x, −y, −x−y) wachsen normale Kronen, die hinter dem Dach hervorschauen dürfen (die Tiefensortierung
zeichnet sie vor dem Gebäude). Das ergibt das Bild «Haus vor Waldkulisse» statt der Keksform. F 0, aber
Wald-Neuaufbau und neue Referenz-Hashes in den Waldtests. Aufwand mittel (≈ 40 Tools). Risiko: Hohe Kronen hinter
kleinen Häusern könnten das Dach optisch verschlucken. Abhilfe: Rückkacheln nur mit Kronenhöhe ≤ 1,5 × Gebäudehöhe.
**N 2 · A 2 · mittel.**

**F4 Stümpfe am Holzfäller (Wald).** Auf den Waldkacheln im Radius 1 eines Holzfällers ersetzen 1–2 Baumstümpfe und
Jungwuchs einzelne Kronen. Rein optisch, die Sim zählt den Wald weiter. Aufwand klein bis mittel (≈ 25 Tools). Risiko:
Der Spieler hält den Wald für erschöpft. Deshalb höchstens 25 % der Kronen und nur Radius 1. **N 2 · A 1 · hoch.**

### H — Küste, Markt, Plätze

**H1 Hafenkram an Kontor und Fischer.** Auf freiem Sand neben dem Kontor liegen Fässer, Kisten und Taurollen, ein
umgedrehtes Boot und ein Sandpfad zum Wasser. Teil des U2-Katalogs; zusätzlich Sand als zulässiger Boden. Aufwand
klein (≈ 15 Tools zusätzlich zu U2). **N 2 · A 1 · hoch.**

**H2 Pflaster franst in die Wege aus.** Vom Marktplatz und vom Kontorhof laufen auf den angrenzenden Wegkacheln
0,5 Kachel lang einzelne Pflastersteine aus (gebacken unter dem Weg-Band oder als Band-Variante). Aufwand klein
(≈ 20 Tools). Risiko: Pflaster könnte als «Strasse» gelesen werden, die es im Spiel nicht gibt. Deshalb nur
Fragmente. **N 1 · A 1 · mittel.**

**H3 Dorfplatz an Kreuzungen im Kern.** Wo sich im Kern drei oder vier Wege treffen, entsteht ein kleiner
Pflasterfleck. Ein Brunnen wurde verworfen, er läse sich wie ein Gebäude. **N 1 · A 2 · niedrig**, nicht im Release.

### G — Gebäudevarianz «Kern + Anbauten» (Nutzerentscheid N2)

**G1 Anbauten als eigene Elemente neben dem Kern (empfohlen).**

- _Was man sieht:_ Der Kern (heutiges Sprite inkl. Farbvariante) bleibt unverändert. Je Gebäude kommen 0–2 Anbauten an
  eine Seite mit freier Nachbarkachel: Pultdach-Schuppen, Vordach auf Pfosten, Holzstoss unter Dach, Zaungarten,
  Backofen, Taubenschlag (nur hinten), Laube. Zwei Holzfäller unterscheiden sich so deutlich in der Gestalt, ohne
  dass einer aussieht wie ein anderer Typ.
- _Regel:_ Wahl aus `hash2(seed + 61x, x, y)` und den freien Seiten (B1). Die «Ausrichtung» ist die Seite des Anbaus
  (links, rechts, hinten). Höhe ≤ 0,6 × Traufhöhe des Kerns, nie über den First. Auf Vorderkacheln nur flache Anbauten
  (Zaungarten, Beet), keine, die Tür oder Fenster verdecken. Ein Anbau weicht, wenn seine Kachel bebaut wird. Das
  Gebäude zeigt dann nur den Kern («Platz wurde knapp»).
- _Technik:_ Sortiertes `decor`-Item am Gebäude (eigener Fussabdruck auf der Nachbarkachel, `depthKey` nach
  `iso.ts:43`). Anbauten liegen **nicht** im Gebäude-Sprite-Cache: `VARIANT_COUNT`, `spriteKey` und
  `SPRITE_CACHE_MAX_BYTES` bleiben unverändert. Die volle Matrix liegt bei Zoom 2 / DPR 2 schon bei 1,357 × Limit
  (Testschranke 1,4, `variants.test.ts` AK7), mehr Kernvarianten passen nicht. Anbauten sind nicht pickbar; Picking
  bleibt am Kern (AK3/AK4 unverändert grün).
- _Kosten:_ F wie U2 (≈ 1 Item je Gebäude), C im Requisiten-Cache (≈ 10 Arten × 2 Licht-Ausrichtungen). Aufwand gross
  (≈ 100 Tools inkl. ADR-Umsetzung und Blindtest).
- _Risiko:_ mittel. (a) Typ-Erkennbarkeit: Ein Schuppen darf ein Wohnhaus nicht wie eine Jagdhütte aussehen lassen.
  Deshalb sind Anbauten in Dachfamilie und Wandton an den Kern gebunden und kleiner. Abnahme per Blindtest (AK-A1-01 aus
  M5 wiederholen). (b) Ein Klick auf den Schuppen trifft die Bodenkachel und nicht das Gebäude. Das ist bewusst so
  (der Platz ist frei bebaubar). Die Bau-Vorschau blendet den Anbau aus (wie U2).
- **N 3 · A 3 · Rang hoch** (Nutzerentscheid, Pflicht).

**G2 Anbauten im Kern-Sprite (verworfen).** Mehr Varianten im Cache mit veränderter Hülle bräuchten ein neues
Cache-Budget (×1,5–2), würden AK3/AK4 brechen und Picking je Variante verlangen. Ausserdem könnten sie nicht auf
Nachbarn reagieren. **Verworfen.**

**G3 Kern spiegeln (Firstrichtung, verschoben).** Die Firstrichtung je Gebäude zu wechseln wäre die stärkste
Varianz. Sie verdoppelt aber den Sprite-Cache, verlangt gespiegelte Geometrie bei unverändertem Licht (S1) in allen
22 Silhouetten-Zeichnern und ändert die Silhouette, also die Identität. **Nicht in diesem Release**, als Option im
ADR-Entwurf vermerkt.

**G4 Kleinvarianz im Kern (ergänzend, klein).** Innerhalb der Hülle, wie schon erlaubt: Kaminlage, Gaube ja/nein,
Fensterladenfarbe. Das passt in die bestehenden 4 Varianten. **N 1 · A 2**, nur wenn Budget übrig bleibt.

### X — Querschnitt

**X1 Ortsnähe-Gradient.** Er ist kein eigenes Bild, sondern der Regler für U1, U2, U3, W1–W3 (B1). Ohne ihn wird der
Ortskern zur Rumpelkammer. Pflicht, Teil des Fundaments.

**X2 Abriss-Lücke.** Keine Narben (bräuchte ein Save-Feld, N1). Die Lücke heilt über U1 und U2 der Nachbarn von
selbst. **Kein eigenes Paket.**

### KS — Kantensprache (Querschnitt, Nachtrag Nutzer)

Gilt für K14–K22. Grenze für alle KS-Ideen: Der Wegkern bleibt als Weg lesbar, die mittlere Breite bleibt 0,5
Kachel. Bauflächen bleiben als Footprint erkennbar. Picking hängt am Kachelraster (Wege) bzw. an den Kern-Polygonen
im Aufzeichnungsmodus (Gebäude) und ändert sich nicht. Signale (K22) bleiben scharf.

**KS0 Regel «Eine Kantensprache» (Stilrahmen-Ergänzung S7).** Flache Bodenflächen haben keinen Konturstrich und keine
Gerade länger als 0,5 Kachel. Ihre Kante entsteht aus einem Feld mit Rauschen und 2 Tonstufen. Körper bleiben
geometrisch (S4), Signale scharf. Die Regel ist kein eigenes Bild, sondern Prüfmassstab für alle Pakete.
**Pflicht, ohne eigenen Aufwand** (Spec-Text, Tests in KS1–KS5).

**KS1 Weg ohne Konturstrich, Rand per Rauschen.**

- _Was man sieht:_ Das Band hat keine dunkle Linie mehr. Seine Kante schwingt leicht (±0,04 Kachel,
  niederfrequent), der Rand ist eine helle, abgetretene Tonstufe statt Kontur. Kreuzungen haben ausgerundete
  Innenecken statt V-Kerbe.
- _Regel:_ Die Weggeometrie wird je Insel und `layoutKey` als `Path2D` im Kachelraum gecacht: Umriss aus Abtastpunkten
  alle 0,1 Kachel entlang der Segmente, versetzt um die halbe Breite plus Rauschen (eigene Salze), Ecken verrundet. Pro
  Frame wird der Pfad nur gefüllt (Kern, dann Randstufe). Der Wegkern behält die Farbe `earth`.
- _Kosten:_ F ≤ 0 (heute baut `drawRoads` die Segmente jeden Frame neu), P 0, C ein `Path2D` je Insel. Aufwand mittel
  (≈ 45 Tools).
- _Risiko:_ niedrig. Den Kontrast Kern ↔ Gras misst A12.
- **N 3 · A 2 · Rang hoch.**

**KS2 Wegsaum gebacken (schliesst W1 Wegrain ein).**

- _Was man sieht:_ Unter der Wegkante liegt ein 0,1–0,2 Kachel breiter Saum aus abgetretenem Gras und Erde. Sein Rand
  ist unscharf und verworfen wie die Aufhellflecken der Wiese. Ausserhalb des Saums wachsen Büschel und Blumen bis an den
  Weg (W1).
- _Regel:_ Saumfeld aus `woodField.ts` über die Wegmaske (`woodBlur` + Rauschen + Höhenlinie, eigene Salze), gemalt in
  `paintPixels`/`paintDecor` des Terrain-Layers. Breite nach Ortsnähe (Land breit, Kern schmal). Weicht automatisch mit
  dem Patch, wenn sich die Wegmaske ändert.
- _Kosten:_ F 0, P ≈ +10–20 % `lastPatchMs` (Feld nur um Wegkacheln). Aufwand mittel (≈ 40 Tools inkl. W1).
- _Risiko:_ niedrig. Der Saum darf den Weg nicht optisch verbreitern. Deshalb liegt er eine Tonstufe näher am Gras als
  am Weg.
- **N 3 · A 2 · Rang hoch.**

**KS3 Abnutzung und Gras im Weg.**

- _Was man sieht:_ Auf Feldwegen im Land wachsen einzelne Grasbüschel über die Wegkante, in der Mitte läuft ein
  unterbrochener Grasstreifen. Gerade Abschnitte zeigen zwei unterbrochene Fahrspuren. Die Steinchen sind kleine
  unregelmässige Kiesel statt Quadrate (K15). Im Ort ist der Weg sauberer.
- _Regel:_ Teil des gecachten Weg-Pfads (je Farbe ein `Path2D`), Lose aus `hash2` je Wegkachel, Dichte nach Ortsnähe.
  Ab Zoom 0,75. Pfützen nur als statische, feuchte Senken (dunklere Flecken). Wassergefüllte Pfützen nach Regen
  hingen am Wetter, das zeitabhängig ist: nicht in diesem Release.
- _Kosten:_ F klein (≈ 3 zusätzliche Füllungen je Frame, gecacht). Aufwand mittel (≈ 40 Tools).
- _Risiko:_ mittel. Zu viel Gras lässt den Weg wie «verfallen» oder unterbrochen wirken. Die Anbindung muss eindeutig
  bleiben. Deshalb ist der Kern nie ganz zugewachsen (Kern-Deckung ≥ 85 %), und über den Kern laufen keine Büschel.
- **N 3 · A 2 · Rang hoch.**

**KS4 Hofplatte und Sockel organisch.** Der Erdrand von `raggedYard` wird vom Sägezahn zu einer weichen Rauschlinie
(2 Oktaven, Kurven statt Zacken) mit einer inneren Tonstufe. Den Übergang ins Gras liefert U1 im Terrain-Layer.
Betrifft nur den Bildmodus-Zweig (`p.hand && !p.recording`): Picking unverändert. Ob sich die Variante-0-Referenzhashes
(H-R7 AK1) ändern, prüft der Plan. F 0, Aufwand klein (≈ 25 Tools). **N 2 · A 1 · Rang hoch.**

**KS5 Pflaster unregelmässig.** Am Markt und am Kontorhof werden die Fugen versetzt (Läuferverband) und mit `sag`
gebrochen statt durchgehender Gitterlinien. Die äussere Reihe löst sich in einzelne, unregelmässige Steine auf, die in
Erde und Gras auslaufen (zusammen mit H2). Der Kern des Platzes bleibt geschlossen. Ändert Referenzhashes (bewusst,
O8). F 0 (Sprite-Cache), Aufwand mittel (≈ 30 Tools). Risiko: Der Markt muss als Platz lesbar bleiben; die Stände
tragen die Erkennung. **N 2 · A 2 · Rang mittel.**

**KS6 Feldkanten weich.** Die Furchenenden springen je Furche um ±0,06 Kachel, die Halmreihe am Rand ist lückig, die
Koppel der Schäferei ist ein Rauschfleck statt Rechteck. Zusammen mit F1 (Feldrain im Terrain-Layer). Das Muster ist
je Typ fest und nicht je Variante, sonst bräche H-R7 AK3. Aufwand mittel (≈ 30 Tools). **N 2 · A 2 · Rang mittel.**

**KS7 Zäune gebrochen.** Pfostenabstand und -höhe streuen leicht, die Planken hängen durch (`sag`), selten fehlt eine
Planke. Das Muster ist je Typ fest (AK3). Aufwand klein (≈ 15 Tools). **N 1 · A 1 · Rang mittel.**

**KS8 Weicher Gebäudeschatten.** Ein Halbschattenband (Hülle um 0,06 Kachel erweitert, halbe Deckkraft) als zweite
Füllung in Durchgang 5, für Gebäude und Bäume gleich. Die Form bleibt, die Kante wird weich. F ≈ +0,02 ms (ein Pfad
mehr), Aufwand klein (≈ 15 Tools). Risiko: Überlappende Halbschatten dunkeln nicht doppelt, solange je Band ein Pfad
gefüllt wird. **N 2 · A 1 · Rang hoch.**

**KS9 Signale bleiben scharf.** Keine Änderung an `drawHover`, `drawGhost`, `drawPathPreview` und Auswahl. Der Kontrast
«weiche Welt, scharfe Signale» stärkt die Lesbarkeit sogar. Nur Abnahme (A13), kein Aufwand.

### Rangliste

| Rang | Idee                          | N   | A   | Entscheid                    |
| ---- | ----------------------------- | --- | --- | ---------------------------- |
| 1    | W1 Wegrain (in KS2)           | 3   | 1   | Pflicht                      |
| 2    | KS1 Weg ohne Konturstrich     | 3   | 2   | Pflicht                      |
| 3    | KS2 Wegsaum gebacken          | 3   | 2   | Pflicht                      |
| 4    | KS3 Abnutzung, Gras im Weg    | 3   | 2   | Pflicht                      |
| 5    | U1 Hofsaum                    | 3   | 2   | Pflicht                      |
| 6    | U2 Hofkram je Typ (+ H1)      | 3   | 3   | Pflicht                      |
| 7    | G1 Anbauten                   | 3   | 3   | Pflicht (N2)                 |
| 8    | W2 Weg-Details                | 3   | 2   | Pflicht                      |
| 9    | KS4 Hofplatte organisch       | 2   | 1   | Pflicht                      |
| 10   | KS8 Weicher Gebäudeschatten   | 2   | 1   | Pflicht                      |
| 11   | W3 Wegenden                   | 2   | 1   | Pflicht (klein)              |
| 12   | KS5 Pflaster unregelmässig    | 2   | 2   | Pflicht                      |
| 13   | F4 Stümpfe am Holzfäller      | 2   | 1   | Kann                         |
| 14   | KS6 Feldkanten weich (+ F1)   | 2   | 2   | Kann                         |
| 15   | U3 Trampelpfade               | 2   | 2   | Kann                         |
| 16   | F3 Waldkante hinten           | 2   | 2   | Kann                         |
| 17   | F2 Weide sichtbar             | 2   | 2   | Kann                         |
| 18   | KS7 Zäune gebrochen           | 1   | 1   | Kann                         |
| 19   | H2 Pflaster franst aus        | 1   | 1   | Kann                         |
| —    | KS0 Regel, KS9 Signale scharf | —   | —   | Pflicht ohne Aufwand         |
| —    | H3 Dorfplatz, G4, G3, G2      | —   | —   | nicht im Release / verworfen |

## 5. Auswahl und Begründung

- **Pflicht** sind die Ideen, die die zwei Nutzerbeispiele direkt lösen (U1, U2, W1, W2, W3) und der Nutzerentscheid
  N2 (G1). Dazu kommt das Fundament B1 mit Ortsnähe X1. Ohne den Gradienten kippt der Ortskern ins Überladene.
- **Kantensprache (Nachtrag Nutzer):** Pflicht sind KS1–KS5 und KS8 sowie die Regel KS0. Sie heben den Stilbruch an
  den häufigsten und grössten Bodenflächen auf: Weg, Hof, Platz und Schatten. Ohne sie bliebe Hofkram auf einer
  Vektorplatte neben einem konturierten Band: mehr Inhalt, aber derselbe Bruch. KS6 und KS7 (Feld, Zaun) sind Kann und
  gehen mit F1 und F2 ins Kann-Paket.
- **Kann** sind die Ideen, die weitere Kanten (K3, K5, K6, K9) lösen, aber für das Kernbild «gewachsen statt
  platziert» nicht nötig sind. Sie bilden ein eigenes Paket am Ende und sind Streichkandidaten bei knappem Budget.
- **Verworfen bzw. verschoben:** G2 (Cache und Picking), G3 (Identität, Cache), H3 (Lesbarkeit), Abrissnarben
  (Save-Feld).
- **Leitplanken:** Alles prozedural (ADR-006 unberührt, keine fremden Assets, kein Lizenzvorgang). Keine Sim-, Save-
  oder Balancing-Änderung. Kein neuer Schlüssel im Gebäude-Sprite-Cache.

## 6. Release-Zuschnitt

**Arbeitstitel: «Gewachsene Siedlung»** (Paketpräfix `ORT-`). Ein Strang `render`, eine Datei-Matrix wie im
Stilrahmen. Grösse insgesamt ≈ 735 Tools Umsetzung (Pflicht ≈ 580, Kann ≈ 155) plus Plan, Reviews und Abnahme.

**Entscheid Kantensprache: eigene Pakete, nicht in ORT-1.** ORT-1 ist das Fundament, auf das drei Pakete warten. Es
bleibt schlank, damit es schnell durchläuft. Die Kantensprache ist ein eigener Bildstrang mit eigenen Dateien
(Wegzeichnung, Hof- und Pflasterzeichner) und eigenem Risiko (Lesbarkeit der Wege, Referenzhashes). Sie wird in zwei
Pakete geteilt, die parallel zu ORT-2 und ORT-4 laufen: **ORT-K1 Wegkante** (KS1, KS2 mit W1, KS3, W3) und **ORT-K2
Flächenkante** (KS4, KS5, KS8). W1 und W3 wandern dafür aus ORT-1 bzw. ORT-3 nach ORT-K1, weil sie denselben Rand
anfassen. ORT-3 behält nur die Weg-Objekte (W2).

| Paket  | Ziel                                                                                                                                                       | Dateien / Scope (W = schreibt)                                                                                                                                                                                                            | Grösse    | Abhängig von              | Parallel                                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------- | ----------------------------------------- |
| ORT-1  | Fundament: B1-Analyse, Ortsnähe, Item-Pipeline (`decor`-Items mit Unterart, Zeichen-Registry, Cache mit Limit), D7, Salze 600–619; dazu U1 Hofsaum (Boden) | W `src/render/ortsrand.ts` (neu), `terrain.ts` (`occupancy`-Codes, `paintDecor`, Patch-Rand), `iso.ts` (`buildRest` holt Ortsrand-Items), `limits.ts`, Kopf `groundDecor.ts`/`decor.ts`; `tools/render-qa/galerie.mjs` (Motiv `ortsrand`) | L (≈ 100) | ADR-015 vorgeschlagen     | allein (berührt die gemeinsamen Dateien)  |
| ORT-K1 | Wegkante: KS1 Weg ohne Konturstrich (gecachter `Path2D`), KS2 Wegsaum gebacken mit W1 Wegrain, KS3 Abnutzung und Gras im Weg, W3 Wegenden                  | W `src/render/roadShape.ts` (neu: Umriss, Saummaske, Abnutzung), `sprites.ts` nur `drawRoads` (wird dünner Aufrufer), `terrain.ts` nur Wegsaum-Aufruf in `paintPixels`/`paintDecor`                                                       | L (≈ 140) | ORT-1                     | ∥ ORT-K2, ORT-2, ORT-4                    |
| ORT-K2 | Flächenkante: KS4 Hofplatte organisch, KS5 Pflaster unregelmässig, KS8 weicher Schatten; Regel KS0 als Test                                                | W `sprites.ts` nur `raggedYard`, `marketBody`/`kontorBody` (Pflaster), `buildingShadow`; `renderer.ts` nur Durchgang 5; `trees.ts` nur `treeShadow`                                                                                       | M (≈ 70)  | ORT-1                     | ∥ ORT-K1, ORT-2, ORT-4                    |
| ORT-2  | U2 Hofkram je Typ inkl. H1 Hafenkram, Bau-Vorschau blendet aus                                                                                             | W `src/render/props.ts` (neu: Zeichner, Katalog je Typ), `ortsrand.ts` nur Katalog-Eintrag; L `renderer.ts`                                                                                                                               | L (≈ 130) | ORT-1                     | ∥ ORT-K1, ORT-K2, ORT-4                   |
| ORT-3  | W2 Weg-Objekte (Pfosten, Randsteine, Wegkreuz, Meilenstein)                                                                                                | W `src/render/roadside.ts` (neu); L `roadShape.ts` (Kantenlage)                                                                                                                                                                           | S (≈ 40)  | ORT-1, ORT-K1             | nach ORT-K1, ∥ ORT-2, ORT-4               |
| ORT-4  | G1 Anbauten (Kern + Anbau), Blindtest Typ-Erkennbarkeit                                                                                                    | W `src/render/annex.ts` (neu), `sprites.ts` nur Lese-Export Traufhöhe/Wandton (kein Zeichnercode), `variants.ts` Kopfkommentar nach ADR-015                                                                                               | L (≈ 100) | ORT-1, ADR-015 angenommen | ∥ ORT-K1, ORT-K2, ORT-2                   |
| ORT-5  | Kann: F4 Stümpfe, F3 Waldkante hinten, F1 Feldrain + KS6 Feldkanten, F2 Weide, KS7 Zäune, U3 Trampelpfade, H2 Pflaster                                     | W `forest.ts`, `iso.ts` (`tight`-Regel), `ortsrand.ts` (Boden), `props.ts` (Zaun, Tränke), `sprites.ts` nur `plantationBody`/`sheepfarmBody`                                                                                              | L (≈ 155) | ORT-2, ORT-K1, ORT-K2     | seriell am Ende (berührt ORT-1/2-Dateien) |

**Reihenfolge:** ADR-015 (L0-Ruling) → ORT-1 → ORT-K1 ∥ ORT-K2 ∥ ORT-2 ∥ ORT-4 → ORT-3 (nach ORT-K1) → ORT-5 (Kann)
→ Release-Abnahme. Das Fundament legt die Pipeline so an, dass ORT-2/3/4 nur eigene neue Dateien schreiben. Die
Registry in `ortsrand.ts` nimmt die Zeichner per Import-Tabelle auf; ein Eintrag je Paket ist ein trivialer Merge.
ORT-K1 und ORT-K2 schreiben in `sprites.ts` getrennte Funktionen (`drawRoads` bzw. Hof, Pflaster, Schatten). Das ist
ein bekannter, kleiner Merge-Punkt; bei Konflikt merged ORT-K1 zuerst.

**Parallelität zu anderen Strängen:** Kein `src/sim/`, kein Save, kein Balancing, also kein Rennen um die
Save-Version (Erweiterung 1 / HANDEL-2 unberührt). Konfliktfläche nur mit anderen Render-Paketen in `terrain.ts`,
`iso.ts`, `sprites.ts` (`drawRoads`). Neue Gebäudetypen aus Erweiterung 1 laufen über den Kategorie-Rückfall in U2/G1
und brauchen keine Abstimmung, nur später eigene Katalogzeilen.

### Abnahme-Ideen (prüfbar; die Spec macht daraus AKs)

- **A1 Determinismus:** Gleiche Welt, zweimal aufgebaut → gleiche Ortsrand-Itemliste und gleiche Aufzeichnung im
  `fakeCtx` (Vitest). Unabhängig von Kamera, Zoom und Frame. Kein `Math.random` in den neuen Dateien (grep-Test).
- **A2 Weichen beim Bebauen:** Welt mit Haus und Requisite/Anbau auf Kachel K; `placeRoad`/`placeBuilding` auf K →
  kein Ortsrand-Item mehr mit Fussabdruck auf K. Nach `demolish` ist die Liste wieder gleich wie vorher (reine Funktion
  des Layouts). Dasselbe für den gebackenen Saum (Pixelvergleich des Patch-Rechtecks).
- **A3 Lokalität:** Ein Bau an (x, y) ändert Ortsrand-Items und Bodenpixel nur im Umkreis ≤ 3. Der Patch-Rand von
  `updateTerrainLayer` deckt das ab (Test über Itemlisten-Diff und `dirtyRect`).
- **A4 Bestand unberührt:** D1-Elemente und Stempel (`groundElements`, `stampPlacements`) sind vor und nach dem Release
  für Seeds 1–50 identisch. Variante 0 der Gebäude ist bytegleich (`variants.test.ts` AK1), ausser bei den Typen, deren
  Hof, Pflaster oder Feld KS4/KS5/KS6 bewusst ändern (Liste und neue Hashes per Ruling, O8). Salzregister im Kopf von
  `groundDecor.ts` mit Block 600–619 nachgeführt.
- **A5 Leistung:** `renderMedian` A/B mit `tools/render-qa/perf.mjs`, Seed 7 und Seed 1 Siedlung, 1920×1080, DPR 2,
  Zoom 1: je Paket ≤ +0,2 ms, Release ≤ +0,4 ms. `updateTerrainLayer` `lastPatchMs` ≤ +30 %, `buildTerrainLayer`
  `buildMs` ≤ +15 %. Caps: ≤ 4 Items je Gebäude, ≤ 1 Weg-Detail je 4 Wegkacheln, `ORTSRAND_MAX` je Insel, im
  reduzierten Modus halbiert.
- **A6 Cache-Budget:** `VARIANT_COUNT`, `spriteKey` und `SPRITE_CACHE_MAX_BYTES` unverändert (AK7 unverändert grün).
  Neuer Requisiten-Cache mit eigener Grenze; volle Matrix bei Zoom 2 / DPR 2 ≤ Grenze (Test wie AK7).
- **A7 Lesbarkeit:** Picking unverändert (`picking.test.ts`, H-R7 AK3/AK4 grün), Ortsrand-Items nie in
  `buildingHulls`. Höhenregel B3: Items auf Vorderkacheln haben Höhe ≤ 0,15 `ISO_H` (Test). Keine Signalfarben
  (ΔE2000 ≥ 20 zu `signal*`, `tests/render/deltaE.ts`). Bedarfssymbole und Statusmarken bleiben oben (Ebene 12).
- **A8 Screenshot-Vergleich:** Motive 01–10 dieser Bestandsaufnahme vorher/nachher (Galerie-Motiv `ortsrand`).
  Blindtest mit zwei Ratern: (a) «gewachsen oder platziert?» je Bildpaar, (b) Typ jedes Gebäudes ohne Text in allen
  Anbau-Varianten erkennbar (Wiederholung M5 AK-A1-01), (c) zwei Holzfäller nebeneinander als verschieden benannt.
- **A9 Fremdinseln:** Ein Aussenkontor mit Wegen auf einer Fremdinsel zeigt Ortsrand wie auf der Heimat (Browser).
- **A10 Kein Konturstrich (Kantensprache):** `drawRoads` zeichnet keinen Strich in `earthEdge` mehr (fakeCtx). Im
  Screenshot (Zoom 1, DPR 2) zeigt das Helligkeitsprofil quer zur Wegkante kein lokales Minimum, das dunkler ist als
  Kern und Gras (= Konturlinie), und eine Übergangsbreite (10 % → 90 %) von mindestens 3 Gerätepixeln. Dasselbe am
  Hofrand und am Schattenrand.
- **A11 Keine langen Geraden:** Im Umriss von Weg, Hofrand und Pflasterrand gibt es keine kollineare Strecke länger als
  0,5 Kachel (Test auf den erzeugten Polygonen, Toleranz 0,01 Kachel). Ausgenommen sind Kaimauer und Gebäudekörper
  (KS0).
- **A12 Weg bleibt lesbar:** Kern-Deckung des Wegs ≥ 85 % (Gras-Einwüchse nur am Rand), mittlere Bandbreite 0,5 ± 0,03
  Kachel, Kontrast Kern ↔ Wiese (ΔE2000, `tests/render/deltaE.ts`) höchstens 10 % unter dem Stand von `main`. Im
  Blindtest (A8) erkennen beide Rater jede Anbindung an die Kontore. Das Picking bleibt kachelbasiert (unverändert).
- **A13 Signale scharf:** Die Aufzeichnungen von `drawHover`, `drawGhost` und `drawPathPreview` sind bytegleich zu
  `main` (fakeCtx). Die Signale behalten Umriss und Vollton.
- **A14 Weggeometrie deterministisch und lokal:** Der gecachte Weg-Pfad ist für dieselbe Welt bytegleich. Eine neue
  Wegkachel ändert den Umriss nur im Umkreis ≤ 1 Kachel. Leistung: Zeichenzeit von `drawRoads` je Frame nicht höher
  als auf `main` (gecachter Pfad), `hitch.mjs` beim Wegziehen ohne neue Frames > 25 ms.
- **A15 Kanten-Galerie:** Ausschnitte vorher/nachher von Kreuzung (`04-weg-z2`), Hof (`03-holzfaeller-z2`), Markt
  (`10-markt-z1.5`) und Feld (`05`) bei Zoom 1 und 2 nebeneinander. Blindfrage an die Rater: «Gehören Weg und Wiese
  zum selben Bild?».

### Entwurf Pool-Eintrag für `docs/studio/releases.json`

Nur als Vorlage für L0; die Datei selbst ändert dieses Paket nicht. Format wie die bestehenden `pool`-Einträge
(`pkg`, `name`, `kind`, `startStage`, `stage`, `state`, `note`; Stufen 1 Idee, 2 Design, 3 Plan, 4 Umsetzung,
5 Release laut `tools/studio/dashboard/releases.js`). `<hash>` ist der Commit dieses Dokuments auf `design/ortsrand`.

```json
{
  "pkg": "ORTSRAND",
  "name": "Gewachsene Siedlung (Ortsrand + Anbauten)",
  "kind": "Nutzerfeedback",
  "startStage": 1,
  "stage": 2,
  "state": "idea",
  "note": "Brainstorming und Zuschnitt fertig (ORT-1, ORT-K1/K2 Kantensprache, ORT-2…5; ≈ 735 Tools, Pflicht ≈ 580) auf design/ortsrand @ <hash>, ADR-015 vorgeschlagen; Spec bei Einplanung; nur render, kein Save"
}
```

Beim Einplanen wird daraus ein Release-Eintrag `REL-nn` mit den Items `ORT-1`, `ORT-K1`, `ORT-K2`, `ORT-2` bis
`ORT-5` (ORT-5 als Kann).

## 7. Offene Punkte (Entscheidungsbedarf an L0)

- **O1 ADR-015 annehmen** (Lockerung «Silhouette = Identität» zu «Kern = Identität, Anbauten tragen die Gestalt»),
  Entwurf `docs/adr/ADR-015-kern-und-anbauten.md`. Empfehlung: annehmen wie entworfen. Vor ORT-4 nötig, vor ORT-1
  wenigstens als Richtung.
- **O2 Auslegung «Ausrichtung» in N2:** Empfehlung: Ausrichtung = Seite der Anbauten und Lage des Hofkrams, **keine**
  Spiegelung des Kerns (G3, Cache-Budget, Identität). Das ist eine Auslegungsfrage für ein L0-Ruling. Falls der Nutzer
  ausdrücklich gespiegelte Kerne will, wird das ein eigenes späteres Paket mit Cache-Budgetantrag.
- **O3 Zuschnitt Pflicht/Kann:** Empfehlung: ORT-1, ORT-K1, ORT-K2 und ORT-2 bis ORT-4 Pflicht, ORT-5 Kann (eigener
  Release-Punkt, streichbar).
- **O4 Salzblock 600–619 reservieren** (im Register von `groundDecor.ts`, Teil von ORT-1). Vorher den Register-Befund
  in `docs/beobachtungen.md` (Salze 61–65 doppelt belegt bzw. nicht eingetragen) bereinigen oder mitnehmen.
- **O5 Fremdinseln:** Empfehlung: Ortsrand auch auf Aussenposten (anders als Stempel, D4), weil dort Gebautes steht.
- **O6 Requisiten-Cache als eigenes Limit** (`PROPS_CACHE_MAX_BYTES` 4 MiB) statt Mitbenutzung von
  `DECOR_CACHE_MAX_BYTES`. Empfehlung: eigenes Limit. Gesamtspeicher steigt um höchstens 4 MiB, gemessen im Plan.
- **O7 Stilrahmen-Regel S7 «Eine Kantensprache»** (KS0): Flache Bodenflächen ohne Konturstrich und ohne Geraden über
  0,5 Kachel, Körper geometrisch, Signale scharf. Empfehlung: als Ergänzung zum Stilrahmen ART-STIL-01 in die Spec
  aufnehmen. Kein ADR nötig, weil es eine Stilregel und keine Architekturentscheidung ist.
- **O8 Bewusste Änderung der Variante-0-Referenzhashes** (H-R7 AK1) für die Typen mit Pflaster (KS5) und, im
  Kann-Paket, Feld/Zaun (KS6/KS7). Empfehlung: annehmen, mit Liste der Typen im Plan (Präzedenz R195). Ob KS4
  (Bildmodus-Zweig) die Hashes überhaupt berührt, prüft der Plan.
- **O9 Kantensprache als eigene Pakete ORT-K1/ORT-K2 statt in ORT-1**, W1 und W3 wandern nach ORT-K1. Empfehlung: ja
  (Fundament bleibt schlank, vier Pakete laufen danach parallel).
- **O10 Signale bleiben scharf** (Bau-Vorschau, Hover, Pfad-Vorschau, Auswahl, K22/KS9). Empfehlung: bestätigen.
