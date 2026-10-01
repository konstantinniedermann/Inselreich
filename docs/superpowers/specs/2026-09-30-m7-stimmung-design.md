# M7 „Stimmung" — Design-Spec (Grafik, Licht und Wetter, Umgebungsklang, Musik, UI-Anmutung)

Datum: 2026-09-30 · Paket M7-SPEC · Status: **Gate Spec bestanden unter Auflage (R83), Nachtrag eingearbeitet** (Nachprüfung `lead-qa` der geänderten
Stellen, Liste in Abschnitt 17) · Prozessstufe voll · Autor `lead-art`

> **Nachtrag M7-ISO (R91, 2026-10-01):** Die Darstellung wechselt auf Isometrie. Wo diese Spec und
> [`2026-10-01-m7-iso-design.md`](2026-10-01-m7-iso-design.md) abweichen, gilt der Nachtrag; die überlagerten Stellen
> listet dessen Abschnitt 13. Der Nachtrag ist im Entwurf für das Gate Spec.

Grundlage:

- Designvorschlag `lead-art`: `.studio/handoffs/2026-09-30-lead-art-l0-m7-vorschlag.md`
- Gate Brainstorming bestanden mit Auflagen: Ruling **R77**
- Programm-Ruling **R73**
- M6-Schnittstelle **R74**, abgestimmt über `.studio/handoffs/2026-09-30-lead-art-lead-design.md`
- **Desktop-first: Ruling R78**
- Scouting: `.studio/handoffs/2026-09-30-m7-scouting-musik.md`, `…-m7-scouting-klang.md`
- Lizenzprüfung: `.studio/handoffs/2026-09-30-m7-lizenzpruefung.md`
- Ist-Screenshots: `.studio/qa/M7-SPEC/ist/`

Kennzeichnung wie in der M5-Spec: **„Setzung Spec"** markiert eine Zahl oder Regel, die weder im Vorschlag noch in
einem Ruling stand und hier begründet gesetzt wird. **„Änderung"** markiert eine bewusste Abweichung von Hauptspec,
arc42 oder ADR (Übersicht in Abschnitt 15).

## 1. Ziel

Nach dem M5-Playtest sagt der Nutzer: „mach es besser in jeglicher hinsicht … bessere grafik, ambiente, musik. die
stimmung muss rüberkommen." M7 macht die Insel sichtbar und hörbar lebendig. Spielregeln, Spielwerte und
`src/sim/` ändern sich nicht.

**Spielerzweck:** Ich schaue auf eine warme, lebendige Insel, die ich gebaut habe. Ich höre das Meer und die Stadt,
über den Tag wandert das Licht, abends leuchten die Fenster. Dabei erkenne ich weiter auf einen Blick, was
fehlt, was arbeitet und was stillsteht.

**15-Minuten-Kriterium** (9000 Ticks bei 1×, anderthalb Spieltage). Ein Spieler erlebt in dieser Zeit:

- ab dem Start eine Insel mit weicher Küste, Flachwasser, Schaum und Wald aus einzelnen Bäumen;
- nach der ersten Interaktion Meeresrauschen und Vögel, nach 5–15 s das erste Musikstück, danach Pausen;
- ab dem ersten Weg und den ersten Häusern Spaziergänger;
- ab Tick 1980 den goldenen Abend, ab Tick 2700 die Nacht mit Fensterlicht und Grillen, ab Tick 4500
  den Morgen (Abschnitt 6.1);
- beim Heranzoomen an die Stadt Stadtgeräusche, beim Herauszoomen mehr Wind und Meer.

Prüfbar über die Browser-Checks der Pakete R1, R3, R4 und U1 sowie den Nutzer-Playtest P-01 bis P-06 (14.2).

## 2. Scope

### 2.1 Muss und Kann je Säule

| Säule           | Muss                                                                                                                                                                                                                                 | Kann                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Terrain, Wasser | weiche Küste; Flachwasser-Verlauf; animierter Schaumsaum; Farbvariation bei Gras und Sand; Wald aus Einzelkronen mit Schatten; Felsmassiv; natürlicher Weg (5.1–5.4)                                                                 | Glitzern auf dem Wasser (5.2)                                                                      |
| Gebäude         | alle 13 Typen neu in der Palette; Footprint zu ≥ 80 % gefüllt; Schlagschatten; Dachfamilie je Kategorie; Feuerwache-Silhouette für M6 (5.5)                                                                                          | —                                                                                                  |
| Leben           | Spaziergänger auf Wegen, Anzahl nach Bevölkerung; Möwen an der Küste; Herdrauch aus Wohnhäusern am Morgen und Abend (5.6)                                                                                                            | Schafe an der Schäferei, Fischerboot am Fischer (5.6)                                              |
| Licht, Wetter   | Tageslicht-Farbkurve; Fensterlicht nachts; Wetter-Schnittstelle mit Regen und Sturm und Wettervorrang; Krisen-Effekte Feuer (mit Rauch-Nachlauf), Warnring und Boom für M6 (Abschnitt 6)                                             | Stimmungswetter mit Wolkenschatten; Schattenlänge nach Tageszeit; Gelöscht-Effekt für M6 (6.3–6.5) |
| Umgebungsklang  | drei Busse mit Ducking; Schichten Meer, Wind, Vögel, Möwen, Grillen und Stadt nach Blick; Regen, Sturm und Feuer für M6; Signaltöne `alarm`, `stormWarning`, `boom` (Abschnitt 7)                                                    | einzelne Arbeitsgeräusche aus Betrieben im Blick                                                   |
| Musik           | mindestens 3 Stücke (2 Tag, 1 Abend/Nacht) mit Pausen und Überblendung; Streaming; Start erst nach der ersten Interaktion (7.4)                                                                                                      | viertes Stück; Stimmungswechsel in der Krise                                                       |
| UI-Anmutung     | Holz- und Pergament-Stil für Desktop; Serifenschrift; Einstellungs-Karte mit getrennten Reglern; Credits-Dialog; „Bewegung reduzieren"; Ruhe-Ansicht im leeren Panel; Klassen für Krisenkarte und Ereignis-Log (M6 D7) (Abschnitt 9) | Waren-Symbole statt Textchips                                                                      |

### 2.2 Streichreihenfolge der Kann-Posten

Werden Budget oder Zeit knapp, wird in dieser Reihenfolge gestrichen: **1. einzelne Arbeitsgeräusche → 2.
Schattenlänge → 3. Glitzern → 4. Stimmungswetter mit Wolkenschatten → 5. Schafe und Fischerboot → 6. viertes Stück
→ 7. Waren-Symbole → 8. Gelöscht-Effekt → 9. Stimmungswechsel in der Krise.** Das Baum-Wiegen aus dem Vorschlag ist gestrichen: Bäume
liegen in der gecachten Terrain-Ebene, die Auflage R77 (2) hat Vorrang. Ein gestrichener Kann-Posten hinterlässt
keinen toten Code. Seine Teile entfallen vollständig, auch in anderen Paketen (in Abschnitt 13 als „Kann"
markiert).

### 2.3 Tür für fremde Grafik (Auflage R77 1)

Die Grafik bleibt prozedural. Der **Vertical Slice (Paket R1)** wird vor allen übrigen Render-Paketen gebaut und
auf denselben Ausschnitten wie die Ist-Screenshots verglichen (AK-R1-08). L0, `lead-art` und `lead-design`
urteilen, der Nutzer bekommt die Bilder im Bericht.

Überzeugt der Slice bei einem Posten (Terrain, Wasser, Gebäude) nicht, öffnet ein **Ruling** für genau diesen
Posten fremde **CC0**-Terrain- bzw. -Gebäudegrafik. Dann gilt:

- Scouting und Lizenzprüfung laufen wie für Audio.
- Palette, Rautenmassstab 64 × 32 (Nachtrag M7-ISO, D-21) und die Lesbarkeitsregeln aus 4.3 gelten unverändert.
- R2 wird dann neu geschnitten.

Ohne ein solches Ruling kommt keine fremde Grafik ins Spiel.

## 3. Ausdrücklich nicht in M7

- Keine Änderung an `src/sim/`: keine neuen Spielregeln, keine Spielwerte, kein neues Save-Format. Render und Audio
  lesen nur (ADR-002).
- ~~Keine Isometrie (ADR-003 bleibt).~~ Ersetzt durch den Nachtrag M7-ISO: Isometrie nach ADR-012, ADR-003 ist ersetzt.
- Keine fremde Terrain- oder Gebäudegrafik ohne Ruling nach 2.3.
- Kein kosmetischer Regen ohne Sturm: Regen ist dem Sturm vorbehalten und dadurch ein eindeutiges Signal.
- Keine Mobil-Optimierung (R78). Schmale Fenster müssen nur „stürzt nicht ab, nichts Wesentliches unerreichbar"
  erfüllen.
- Keine Verdrahtung mit `crisisView`. Die macht M6 (Abschnitt 11.3), M7 liefert die Darstellung, Töne und die
  Dev-Vorschau.
- Keine neue Laufzeit-Abhängigkeit (ADR-001). Canvas 2D, Web Audio und `HTMLMediaElement` sind Browser-APIs.
  `ffmpeg` dient nur lokal zum Schneiden und Kodieren der Assets und läuft nicht in CI.

## 4. Art Direction

### 4.1 Leitbild

**„Ein warmer Spätsommernachmittag auf einer Insel im Südmeer."**

- Türkises Flachwasser geht in tiefes Blau über, der Strand ist hell und hat einen Schaumsaum.
- Das Grün ist satt und fleckig, der Wald besteht aus dunklen Inseln einzelner Kronen.
- Die Dächer sind aus Stroh und Terrakotta, die Wände aus Kalk, aus den Kaminen steigt Rauch.
- Menschen gehen auf den Wegen, Möwen ziehen über der Küste.
- Abends wird das Licht golden, nachts leuchten die Fenster.
- Zu hören sind das Meer, der Wind, die Vögel und leise, getragene Musik mit Pausen.

Das Vorbild gibt nur das Gefühl vor. Grafik, Musik, Namen und Formen werden nicht übernommen (ADR-006).

### 4.2 Palette

Alle Farben stehen als Konstanten in `src/render/palette.ts`. Andere Render-Module haben keine eigenen Hex-Werte,
ausser für Zwischentöne, die sie aus der Palette ableiten. Die UI-Farben stehen als CSS-Variablen in
`src/style.css`.

| Gruppe  | Name → Wert                                                                                                                                                                                                                         |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wasser  | `waterDeep` `#1f5a7a` · `waterMid` `#2f7f9a` · `waterShallow` `#4fb3b0` · `foam` `#f4f1e6`                                                                                                                                          |
| Sand    | `sandDry` `#e3cf98` · `sandWet` `#c9b27a`                                                                                                                                                                                           |
| Gras    | `grassLight` `#8cbf5a` · `grass` `#6fa84a` · `grassDark` `#557f3a`                                                                                                                                                                  |
| Wald    | `crown` `#2f6b35` · `crownLight` `#4a8a44` · `shadow` `rgba(20,35,20,0.35)`                                                                                                                                                         |
| Fels    | `rock` `#8f8676` · `rockLight` `#b8ad98` · `rockDark` `#5f584d`                                                                                                                                                                     |
| Weg     | `earth` `#a07a4f` · `earthEdge` `#7d5d3a`                                                                                                                                                                                           |
| Dächer  | `roofThatch` `#c9a24f` (Pionier) · `roofTerracotta` `#a65b3f` (Siedler) · `roofTerracottaDark` `#8a4a3a` (Bürger) · `roofWood` `#8a6a3f` (Produktion) · `roofSlate` `#4f6478` (Öffentlich) · `roofTimber` `#6b4a2b` (Kontor, Markt) |
| Wände   | `wallLime` `#efe6d2` · `wallTimber` `#5a3d25` · `wallStone` `#b9ad97`                                                                                                                                                               |
| Licht   | `lightMorning` `#ffd9a0` · `lightEvening` `#ff9f5a` · `lightNight` `#2a3a6a` · `window` `#ffb65c`                                                                                                                                   |
| Signale | `signalRed` `#ff3b5c` · `signalYellow` `#ffe000` · `signalWarn` `#ff6726` · `signalOk` `#2ee6a8` · Umriss Weiss                                                                                                                     |

**Änderung gegenüber dem Vorschlag** (Farbabstandscheck aus Auflage R77 3; Rechnung CIEDE2000 über alle Flächen, mit
und ohne Tönung aus 6.1):

- Terrakotta `#b5553a` → `#a65b3f`.
- Signalrot `#d9463b` → `#ff3b5c`.
- Warnorange `#f0a030` → `#ff6726`.
- Nachtrag R83 (QA 5): Signalgrün `#6aa84f` → `#2ee6a8` (vorher ΔE 1,4 zum Gras), Fensterlicht `#ffcf6a` → `#ffb65c`
  (vorher ΔE 11,0 zu `signalYellow`, jetzt 19,3). Die UI-Variable `--ok` bleibt unverändert, sie steht nur auf
  Pergament.

Die alten Werte lagen bei ΔE 7,9 (Dach gegen Rot) bzw. 8,2 (Warnorange gegen getönten Sand), also zu nah. Mit den
neuen Werten liegt jedes Signal bei ΔE ≥ 15 zu jeder Fläche (AK-R1-03). Die engsten Paare sind Rot gegen Terrakotta
(20,5), Warnorange gegen Terrakotta (18,7), Grün gegen Gras (17,9) und Gelb gegen Sand am Morgen (15,9).

### 4.3 Lesbarkeitsregeln

1. **Ebenenreihenfolge:** Stimmung liegt immer unter den Signalen. Signale werden **nach** dem Licht gezeichnet und
   sind ungetönt. Reihenfolge je Frame:
   1. Terrain-Ebene (gecacht, 5.1)
   2. Wasser dynamisch: Wellen, Schaum, Kann Glitzern (5.2)
   3. Wege (5.4)
   4. Schatten und Gebäude, nach Unterkante sortiert, mit Arbeitsrauch (5.5)
   5. Leben und Effekte: Figuren, Möwen, Schiff, Herdrauch, Feuer und Rauch, Dampf (5.6, 6.5)
   6. Kann: Wolkenschatten (6.4)
   7. Tönung: genau ein Multiply-Durchgang aus `gradeAt` (6.1, 6.4)
   8. Additiver Durchgang: Fensterlicht, Laternen, Feuerglühen (6.2, 6.5)
   9. Regen und Sturmschlieren (6.4)
   10. Signale, ungetönt: Platzierungsanzeige, Radius, Bedarfssymbole, Punkt „nicht angebunden", Warnring,
       Boom-Münze, Gelöscht-Haken, Auswahl, Hover
2. **Signalfarben sind reserviert:** `signalRed`, `signalYellow`, `signalWarn` und `signalOk` sowie der weisse Umriss kommen in
   Terrain, Gebäuden, Leben und Wetter nicht vor. Die Flammen des Feuers sind ein Effekt und kein Signal. Das Signal
   „Brand" ist der Warnring.
3. **Arbeit und Stillstand bleiben unterscheidbar:**
   - Dichter Betriebsrauch bzw. das Arbeitszeichen aus M5 ist das einzige Dauer-Bewegungssignal an Betrieben.
   - Herdrauch der Wohnhäuser ist dünn und hell und erscheint nur in den Phasen Morgen und Abend.
   - Spaziergänger und Möwen tragen keine Zustandsinformation.
4. **Helligkeit** (Nachtrag R83, QA 1): Das **Tageslicht allein** lässt nie weniger als 75 % Luma übrig, gemessen
   an den Pixelwerten wie in M5 (AK-R1-04). **Mit Wetter** (Tageslicht mal Wetterfaktor, jede Art, jede Stärke) liegt
   die Grenze bei 60 % (AK-R3-01, **Setzung Spec**). Begründung: Wetter über `cloudy` mit `w > 0,4` gibt es nur als
   Krisensignal (Vorwarnung, Sturm), dort ist die Dunkelheit die Botschaft; die Signale bleiben ungetönt. Die
   ungünstigsten Werte (Nacht mal Wetter bei `w = 1`) sind: `cloudy` 0,702, `rain` 0,656, `storm` 0,619.
5. **Kachelgenauigkeit:** Weiche Übergänge verschieben die sichtbare Grenze eines Terrain-Typs höchstens um
   ¼ Kachel in die Nachbarkachel. Jede Kachel zeigt ihren eigenen Typ auf ≥ 75 % ihrer Fläche (AK-R1-02). Beim
   Bauen zeigen die Platzierungsanzeige und der Hover weiter die exakten Kacheln.

### 4.4 Ist-Mängel und Prüfmerkmale (Nachtrag R83, QA 8)

Die Mängel stammen aus dem Designvorschlag (Screenshots `.studio/qa/M7-SPEC/ist/`). Die Prüfmerkmale sind Pixelproben
auf den Nachher-Screenshots von AK-R1-08 bzw. den genannten AK. Farbnähe heisst ΔE2000 ≤ 10 zum Palettenwert,
gemessen am Mittel eines 3 × 3-Pixel-Felds.

| Nr. | Befund (Ist)                                                  | Prüfmerkmal (Nachher)                                                                                                                                                                                                                      | Paket / AK                   |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| I1  | Terrain aus harten Quadraten, Küste als Pixeltreppe           | Auf 10 zufällig gewählten Küstenkacheln liegt der Sand/Wasser-Übergang an ≥ 8 nicht auf der Kachelgrenze (Abstand ≥ 2 Pixel bei Zoom 1). Eine 4 × 4-Kachel-Grasfläche zeigt ≥ 3 Farbwerte mit ΔE ≥ 3 untereinander.                        | R1a / AK-R1-08               |
| I2  | Wasser überall gleich blau, kein Flachwasser, kein Schaum     | Wasser mit Landkontakt ist farbnah zu `waterShallow`, Wasser mit `−s ≥ 6` farbnah zu `waterDeep`. An ≥ 8 von 10 Küstenkacheln gibt es Pixel farbnah zu `foam` im Streifen `−s < 0,15`.                                                     | R1a / AK-R1-08               |
| I3  | Gebäude füllen nur die Hälfte, ohne Schatten                  | Füllgrad ≥ 80 % (AK-R1-09). Rechts unterhalb jedes der 3 Slice-Typen liegt ein Streifen, dessen Luma ≥ 15 % unter dem Gras daneben liegt (Schatten).                                                                                       | R1b / AK-R1-09               |
| I4  | Kategorie-Vollfarben wirken wie UI-Symbole                    | Blindtest AK-R2-01 und AK-R2-02                                                                                                                                                                                                            | R2                           |
| I5  | Wald aus Kreisen auf dunklen Quadraten, Fels als Kachelmuster | Die Ecke einer Waldkachel am Waldrand ist nicht farbnah zum alten Waldgrund `#3d7a3a`. Eine Waldkachel zeigt ≥ 3 Kronen (getrennte Flecken farbnah zu `crownLight`). Felskacheln enthalten Pixel farbnah zu `rockLight` und zu `rockDark`. | R1a / AK-R1-08               |
| I6  | Kein Leben                                                    | AK-R4-04                                                                                                                                                                                                                                   | R4                           |
| I7  | Nacht kaum erkennbar, kein Abend                              | Auf derselben Graskachel gilt für das Verhältnis Blau/Rot der Pixelwerte: bei Tick 2300 ≤ 0,9 × Tick 0 (warm), bei Tick 3000 ≥ 1,05 × Tick 0 (kühl). Fensterlicht: AK-R4-05.                                                               | R1b, R4 / AK-R1-08, AK-R4-05 |
| I8  | Weg wie ein Schieberegler                                     | AK-R2-04                                                                                                                                                                                                                                   | R2                           |
| I9  | Generisches Dashboard, leeres Panel                           | AK-U2-01, AK-U2-03                                                                                                                                                                                                                         | U2                           |
| I10 | HUD belegt bei 390 px 40 % der Höhe                           | entfällt (R78, Desktop-first); nur AK-U2-04                                                                                                                                                                                                | —                            |
| I11 | Nur Rauschen und Pieptöne, keine Musik                        | AK-A1-01 bis AK-A3-05; Nutzer-Playtest P-02, P-03                                                                                                                                                                                          | A1–A3, X1                    |

**Messauslegungen (R104):** I1, I2 (Schaum) und I5 werden nach den Auslegungen in M7-ISO-Spec AK-ISO-18
(„Messauslegungen") gemessen: I1 nach dem Ersatzmass D-M7-I1 (Eckenschnitt und Welligkeit, AK-R1-02 hat Vorrang),
der Schaum nach D-M7-FOAM (Kernlinie Deckkraft 0,85–1, Breite 0,07 Kachel), die Waldrand-Ecke in I5 ohne Kronenpixel.
Sie gehen dem Wortlaut der Tabelle vor.

## 5. Grafik

### 5.1 Terrain (R1)

Die Terrain-Ebene ist eine Offscreen-Canvas in Welt-Pixeln und wird einmal je Welt aufgebaut.

- **Auflösungsfaktor:** 2 bei `devicePixelRatio ≥ 1.5` (4096 × 4096), sonst 1 (2048 × 2048), **Setzung Spec**.
  Dauert der Aufbau auf der Referenzmaschine länger als 1500 ms (AK-R1-06), gilt Faktor 1. `buildTerrainLayer(world,
scale?)` nimmt den Faktor optional; ohne Angabe leitet der Renderer ihn aus `devicePixelRatio` ab (Nachtrag R83,
  Tech B3). `app.ts` bleibt für den Slice unverändert.
- **Rechenraster** (Nachtrag R83, Tech B2, Plan-Auflage): Felder, Rauschen und Relief werden auf einem gröberen Raster
  (4 Welt-Pixel, **Setzung Spec**) gerechnet und bilinear auf die Pixel interpoliert, nicht je Pixel neu. Für Zoom
  ≤ 0,5 hält der Renderer eine einmal vorskalierte Kopie der Terrain-Ebene (halbe Auflösung) und zeichnet diese,
  statt jeden Frame 4 : 1 zu verkleinern.
- **Vorzeichenbehaftetes Küstenfeld** (reine Mathematik in `src/render/terrainField.ts`):
  - Je Kachelmitte gilt `s = +d(Land zum nächsten Wasser)` bzw. `s = −d(Wasser zum nächsten Land)` in Kacheln,
    berechnet per Breitensuche mit 8er-Nachbarschaft.
  - Pro Pixel wird `s` bilinear interpoliert und um Rauschen mit ±0,12 Kacheln verschoben (`valueNoise` aus
    `src/sim/noise.ts`, nur lesend genutzt).
  - Die Küstenlinie ist `s = 0`. Die Verschiebung ist so begrenzt, dass Regel 4.3.5 hält.
- **Wasserfarbe nach Tiefe:**
  - `−s < 1` ergibt `waterShallow`, bei 3 `waterMid`, ab 6 `waterDeep`, dazwischen linear.
  - Ein statischer Grund-Schaumsaum liegt bei `−s < 0,12`.
- **Strand:** `sandWet` bei `0 ≤ s < 0,18`, danach `sandDry`.
- **Übergänge zwischen Land-Typen:**
  - Sand zu Gras, Gras zu Wald-Boden und Gras zu Fels laufen über dasselbe Verfahren mit je einem Feld pro Typ:
    interpoliert, mit Rauschen verschoben, Schwelle 0,5.
- **Gras:**
  - Die Fleckenvariation mischt `grassLight`, `grass` und `grassDark` per `valueNoise` in zwei Oktaven.
  - Dazu kommen vereinzelte Büschel, deterministisch aus `hash2`.
- **Relief:**
  - Eine Höhe `h = s + Fels-Bonus + Rauschen` ergibt eine Hangschattierung mit Licht von links oben, höchstens ±8 %
    Helligkeit.
  - Das Felsmassiv bekommt zusätzlich Kanten in `rockLight` und `rockDark`.
- **Wald:**
  - Jede Waldkachel trägt 3–5 Einzelkronen: Schlagschatten nach rechts unten (Versatz 0,12 Kachel), Krone `crown`
    und Lichtkappe `crownLight` links oben.
  - Am Waldrand ragen Kronen bis zu ¼ Kachel in die Nachbarkachel.
- **Bebauung:**
  - Liegt auf einer Kachel ein Gebäude oder Weg, zeichnet die Terrain-Ebene dort keine Bäume und Büschel.
  - Ändert sich die Belegung (Schlüssel `layoutKey(world)` aus `src/sim/queries.ts`, Muster Cache in `overlays.ts`),
    wird nur der betroffene Bereich neu gezeichnet: die geänderten Kacheln plus ein Rand von 1 Kachel. Das ganze
    Terrain wird dabei nicht neu gebaut.
  - Die Teil-Neuzeichnung stösst der **Renderer selbst** an: `render()` vergleicht je Frame den `layoutKey` mit dem
    zuletzt für diese Terrain-Ebene gesehenen (Cache je Ebene) und ruft bei Abweichung `updateTerrainLayer` auf. Die UI
    ruft nichts Neues auf (Nachtrag R83, Tech B3).

### 5.2 Wasser (R1)

Das Wasser ist eine dynamische Ebene über dem Terrain, nur im sichtbaren Bereich.

- **Schaumsaum:**
  - An Wasserkacheln mit Landkontakt läuft eine Schaumlinie entlang `s ≈ −0,1`, die mit einer Periode von 3,2 s
    zum Strand hin und zurück wandert (**Setzung Spec**).
  - Die Deckkraft schwankt zwischen 0,35 und 0,7.
- **Wellen:** Die bisherigen Wellenstriche bleiben, aber in `foam` mit Deckkraft 0,12 und nur auf Wasser mit
  `−s ≥ 1`. Die Schraffur-Wirkung (I2) verschwindet, weil das Flachwasser keine Striche mehr trägt.
- **Sturm:** Die Parameter hängen an der Wetterstärke `w` (6.4):
  - Amplitude der Wellen × (1 + w)
  - Schaumbreite × (1 + 1,5 w)
  - Periode × (1 − 0,4 w)
- **Kann: Glitzern.** Höchstens 30 helle Punkte in `foam` blitzen auf Wasser mit `−s ≥ 2` kurz auf, nur in den Phasen
  Tag und Abend.

### 5.3 Vegetation und Fels

Vegetation und Fels liegen in der Terrain-Ebene (5.1). Es gibt keine dynamischen Bäume.

### 5.4 Wege (R2)

- Der Weg ist ein Erdpfad statt eines Balkens (I8).
- Zwischen den Mittelpunkten angrenzender Wegkacheln liegt eine Linie mit runden Enden, zweischichtig:
  - aussen `earthEdge` mit Breite 0,62 Kachel
  - innen `earth` mit Breite 0,5 Kachel
- Dazu kommen vereinzelte Steinchen, deterministisch aus `hash2(x, y)`.
- Die Kanten sind durch Rauschen um höchstens ±0,04 Kachel unregelmässig.
- Die Weg-Nähte bleiben lückenlos (Q7 aus M5).

### 5.5 Gebäude (R1: drei Typen, R2: der Rest)

**Bildsprache:**

- Die Ansicht ist top-down mit angedeuteter Front.
- Das Dach ist von oben sichtbar und belegt die oberen ~70 % der Gebäudegrundfläche. Die Firstlinie trennt die Lichtseite
  (links oben) von der Schattenseite.
- Darunter zeigt ein Fassadenstreifen (~22 %) Tür und Fenster.
- Ein Schlagschatten fällt nach rechts unten (Versatz 0,12 Kachel, `shadow`).
- Gebäude samt Hof (Zaun, Feld, Stapel, Stand) füllen **≥ 80 %** ihres Footprints.
- Gezeichnet wird nach Unterkante sortiert, damit der Schatten eines Hauses nicht über das südlichere Haus fällt.

**Kategorie über Dachfamilie und Form** (statt Vollfarbe, I4):

| Kategorie     | Dachfamilie                                                     | Formmerkmal                                     |
| ------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| Wohnen        | `roofThatch` / `roofTerracotta` / `roofTerracottaDark` je Stufe | klein, 1×1, Kamin, Fenster                      |
| Produktion    | `roofWood`                                                      | 2×2 bzw. 1×1 mit Hof und Arbeitsgerät           |
| Öffentlich    | `roofSlate`                                                     | Turm bzw. Glockenstuhl                          |
| Infrastruktur | `roofTimber` mit Tuch in Palettenfarbe                          | Lagerhaus mit Kisten bzw. Stände mit Sonnendach |

**Silhouetten** (Tabelle als `Partial<Record<BuildingDefId, …>>` mit Fallback je Kategorie wie in M5; die
Feuerwache kompiliert also schon, bevor M6 ihre Id einführt):

| Typ             | Silhouette                                                                                                                               | Paket |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Wohnhaus        | Pionier: Strohhütte mit runder Dachkante · Siedler: Fachwerkhaus mit Terrakotta · Bürger: Steinhaus mit Gaube, zweigeschossig angedeutet | R1    |
| Kontor          | breites Lagerhaus mit Satteldach, Kistenstapel, Flagge, Kaimauer zur Wasserseite                                                         | R1    |
| Holzfäller      | Hütte mit Stammstapel und Hackklotz, Sägemehlfleck                                                                                       | R1    |
| Marktplatz      | Pflasterfläche mit 3 Ständen, gestreifte Sonnendächer in `roofTimber` und `wallLime`                                                     | R2    |
| Fischerhütte    | Hütte mit Netzgestell und kleinem Steg                                                                                                   | R2    |
| Steinbruch      | Felsanschnitt mit Blöcken und Kran-Balken                                                                                                | R2    |
| Schäferei       | Stall mit Zaunkoppel, helle Schafpunkte (Kann: laufen umher, 5.6)                                                                        | R2    |
| Weberei         | Haus mit Webrahmen unter Vordach, Stoffbahnen                                                                                            | R2    |
| Zuckerrohr      | Feld in Reihen (`grass`/`grassDark`-Streifen mit Halmen), kleine Hütte                                                                   | R2    |
| Brennerei       | Haus mit Fässern und gemauertem Schornstein                                                                                              | R2    |
| Werkzeugmacher  | Werkstatt mit Esse, Amboss und Schornstein                                                                                               | R2    |
| Kapelle         | Schieferdach mit Glockenturm                                                                                                             | R2    |
| Schule          | Schieferdach, Glocke über der Tür, Hof mit Bank                                                                                          | R2    |
| Feuerwache (M6) | Wachhaus mit Schiefer, Glockenstuhl, Eimerreihe (Fallback, solange die Id fehlt)                                                         | R2    |

**Unverändert aus M5:**

- Arbeitsanzeige: Rauch bzw. Arbeitszeichen nur bei `connected && state === 'ok'`.
- Roter Punkt „nicht angebunden", jetzt in `signalRed` und in der Signalebene.
- Bedarfssymbole, Radiusanzeige.

**Fensteranker:** Jede Silhouette meldet die Lage ihrer Fenster als Rechtecke relativ zum Footprint (für 6.2).

### 5.6 Leben (R4)

Das Leben ist rein kosmetisch und deterministisch aus `timeMs` und dem Welt-Zustand. Es hat keinen eigenen
Zustand, der gespeichert werden müsste.

- **Spaziergänger:**
  - Anzahl `n = min(CAP_WALKERS, floor(Einwohner / 4))`, Einwohner als Summe `house.inhabitants` (**Setzung
    Spec**).
  - Jede Figur `i` läuft auf dem Weggraph in Segmenten von Kachel zu Kachel mit 1,2 Kacheln/s.
  - Die Route wählt `hash2(seed + i, segmentIndex, 0)` unter den Nachbarn, so dass die Figur nicht sofort umkehrt,
    ausser in einer Sackgasse.
  - **Episoden** (Nachtrag R83, Tech B1): Die Zeit ist in Episoden zu je 32 Segmenten geteilt. Zu Beginn jeder
    Episode `e` setzt die Figur neu an einer per `hash2(seed + i, e, 1)` gewählten Wegkachel an; innerhalb der Episode
    rechnet `walkerAt` höchstens 32 Segmentschritte. Der Aufwand je Figur und Frame ist damit unabhängig von `timeMs`
    (AK-R4-07). Der Sprung zwischen zwei Episoden wird mit 0,3 s Ein- und Ausblenden der Figur verdeckt.
  - Die Position ist eine reine Funktion `walkerAt(graph, i, timeMs, seed)`.
  - Die Figur ist 0,18 Kachel gross: Kopfpunkt, Körper in einer von 4 Kleiderfarben aus der Palette (keine
    Signalfarbe), Schatten.
  - Ohne Weg gibt es keine Figuren.
- **Möwen:**
  - Bis zu `CAP_GULLS` Möwen kreisen über Wasser mit `−s < 2` im sichtbaren Bereich.
  - Die Bahn ist eine Ellipse aus `hash2`, der Flügelschlag eine Kurve aus 2 Segmenten, dazu ein Schatten auf dem
    Wasser.
  - Zu sehen sind sie nur in den Phasen Morgen, Tag und Abend.
- **Herdrauch:** Wohnhäuser mit `inhabitants > 0` zeigen in den Phasen Morgen und Abend dünne helle Rauchfäden
  aus dem Kamin (Regel 4.3.3).
- **Kann:** Schafe bewegen sich in der Koppel der Schäferei (nur bei Zustand `ok`). Ein Fischerboot kreuzt vor
  der Fischerhütte (nur bei `ok`). Bei Stillstand stehen sie still, wie die Arbeitsanzeige.

## 6. Licht und Wetter

### 6.1 Tageslicht (R1)

Die Tageszeit hängt weiter an `world.tick`: Ein Tag dauert 6000 Ticks, bei Pause steht das Licht. Die Tönung ist
eine **Farbkurve aus Multiplikationsfaktoren je Kanal**. Sie wird genau einmal je Frame als ein `fillRect` mit
`globalCompositeOperation = 'multiply'` über die Karte gelegt (Auflage R77 2). Ist der Faktor überall ≥ 0,999, wird
nicht gezeichnet.

`lightAt(tick) → { mul: [r, g, b], phase, windows }`, mit `t = (tick mod 6000) / 6000` (**Setzung Spec**, Stützpunkte
linear interpoliert):

| t    | Tick | Phase  | `mul` (r, g, b)       | Fenster |
| ---- | ---- | ------ | --------------------- | ------- |
| 0,00 | 0    | Tag    | 1,000 · 1,000 · 1,000 | 0       |
| 0,28 | 1680 | Tag    | 1,000 · 1,000 · 1,000 | 0       |
| 0,36 | 2160 | Abend  | 1,000 · 0,887 · 0,806 | 0       |
| 0,42 | 2520 | Abend  | 0,867 · 0,820 · 0,810 | 0,6     |
| 0,47 | 2820 | Nacht  | 0,733 · 0,753 · 0,813 | 1       |
| 0,72 | 4320 | Nacht  | 0,733 · 0,753 · 0,813 | 1       |
| 0,78 | 4680 | Morgen | 1,000 · 0,967 · 0,918 | 0,2     |
| 0,86 | 5160 | Tag    | 1,000 · 1,000 · 1,000 | 0       |

- Die Phasengrenzen gelten für Leben und Klang: Tag `[0, 0,33)` und `[0,84, 1)`, Abend `[0,33, 0,45)`, Nacht
  `[0,45, 0,75)`, Morgen `[0,75, 0,84)`.
- **Luma-Faktor** des Tageslichts `0,299 r + 0,587 g + 0,114 b ≥ 0,75` für jeden Tick (AK-R1-04). Nacht ergibt
  0,754. Mit Wetter gilt 4.3.4.
- Der M5-Schalter „Tag-Nacht" (`dayNight`) schaltet die Tageslicht-Tönung samt Fensterlicht ab. Die Wettertönung (6.4) bleibt, weil sie ein Krisensignal
  trägt. Die Phasen für Leben und
  Klang laufen trotzdem weiter.
- `dayNightAlpha` und `NIGHT_COLOR` aus M5 entfallen und werden durch `lightAt` ersetzt. Die Tests in
  `tests/render/daynight.test.ts` werden umgeschrieben.

### 6.2 Fensterlicht (R4)

- Hat `windows > 0`, zeichnet ein additiver Durchgang (`'lighter'`, ein Pfad je Frame) die Fensteranker (5.5) aller
  bewohnten Häuser und der Gebäude mit Zustand `ok` in `window`.
- Dazu kommt ein weicher Schein mit 0,6 Kachel Radius, Deckkraft 0,35 × `windows`.
- Die Laternen am Kontor und am Marktplatz leuchten immer.
- Unbewohnte Häuser und stillstehende Betriebe bleiben dunkel. Stillstand ist also auch nachts lesbar.

### 6.3 Schatten

- Der feste Schlagschatten fällt nach rechts unten (Versatz 0,12 Kachel), bei Gebäuden, Bäumen, Felsen, Figuren
  und dem Schiff.
- **Kann:** Die Schattenlänge folgt der Tageszeit, mit Faktor 1,6 am Abend und Morgen und 1,0 am Tag. Nachts
  gibt es keine Schatten.

### 6.4 Wetter (R3)

Neues optionales Feld `RenderFx.weather?: { kind: 'clear' | 'cloudy' | 'rain' | 'storm'; w: number }` mit Stärke
`w ∈ [0, 1]`. Standard ist `clear`.

| kind     | Tönung (zusätzlicher Faktor, im selben einen Multiply-Durchgang mit dem Licht) | Effekte                                                                                                                        |
| -------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `clear`  | 1                                                                              | —                                                                                                                              |
| `cloudy` | `mix(1, [0,92, 0,93, 0,96], w)`                                                | Kann: bis zu 6 weiche Wolkenschatten ziehen mit 0,3 Kacheln/s                                                                  |
| `rain`   | `mix(1, [0,85, 0,87, 0,92], w)`                                                | Regenschlieren: schräge Linien in `foam` mit Deckkraft 0,25, Anzahl `w × CAP_RAIN`, Fallgeschwindigkeit 14 Kacheln/s           |
| `storm`  | `mix(1, [0,80, 0,82, 0,88], w)`                                                | wie `rain` mit stärkerer Schräge, Wasser nach 5.2, schnellere Wolkenschatten (auch ohne Kann-Posten als dunkle Fläche am Rand) |

- Die Gesamttönung ist `mul = lightAt(tick).mul ⊙ weatherMul(weather)`, berechnet mit der reinen Funktion
  `gradeAt(tick, weather)`.
- Der Luma-Faktor von `gradeAt` bleibt für jede Wetterart, jede Stärke und jeden Tick ≥ 0,60 (4.3.4, AK-R3-01).
  Der Sturmfaktor ist gegenüber dem Entwurf leicht aufgehellt (0,78/0,80/0,86 → 0,80/0,82/0,88), damit die Grenze
  mit Abstand hält (0,619 statt 0,604).
- **Vorrang:** Die UI wählt je Frame das Wetter mit der reinen Funktion `pickWeather(crisis, mood)`. Ein Krisenwetter
  aus M6 (11.3) geht immer vor. Ohne Krise gilt das Stimmungswetter, ohne den Kann-Posten `clear`.
- **Kann: Stimmungswetter** (zusammen mit den Wolkenschatten): `moodWeather(tick, seed)` liefert deterministisch
  `clear` oder `cloudy` mit **`w ≤ 0,4`**, nie `rain` oder `storm` (**Setzung Spec**, Grenze auf Vorschlag von M6
  12.3). Die Sturm-Vorwarnung erreicht `w = 1` und bleibt dadurch vom Stimmungswetter unterscheidbar.
- Ohne M6 setzt M7 `rain` und `storm` nur über die Dev-Vorschau (9.5).

### 6.5 Krisen-Effekte für M6 (R3, R74)

| Effekt                 | Funktion (in `src/render/fx.ts`)                                 | Darstellung                                                                                                                                                                                                                                      | Ebene                                         |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Feuer                  | `drawFire(ctx, rect, timeMs, { flames, smoke })`                 | bis zu `CAP_FIRE` Flammenzungen (Gelb-Orange-Verlauf, **nicht** `signalWarn`), dunkler Rauch steigt mit Wind nach rechts, Gebäude darunter um 35 % abgedunkelt; `flames` und `smoke` je 0…1 erlauben den Rauch-Nachlauf (M6 D2) mit `flames = 0` | Leben (getönt); Glühen im additiven Durchgang |
| Warnring               | `drawWarnRing(ctx, rect, timeMs)`                                | Rahmen in `signalWarn` mit 2 px Breite und 1,5 px dunklem Umriss, pulsiert mit 1,2 s zwischen 60 % und 100 % Deckkraft                                                                                                                           | Signal (ungetönt)                             |
| Gelöscht (Kann, M6 D3) | `drawExtinguished(ctx, rect, timeMs, p)` mit Fortschritt `p` 0…1 | drei helle Dampfwolken in `foam` steigen auf; darüber ein Haken in `signalOk` mit dunklem Umriss, blendet ab `p = 0,7` aus; Dauer **60 Ticks** ab Brandbeginn (**Setzung Spec**: 6 s bei 1×, sichtbar auch bei 4×)                               | Dampf getönt; Haken Signal (ungetönt)         |
| Boom                   | `drawBoomCoin(ctx, rect, timeMs)`                                | Münze mit Glanzbewegung über dem Kontor, weisser Umriss                                                                                                                                                                                          | Signal (ungetönt)                             |
| Sturm                  | `RenderFx.weather = { kind: 'storm', w }`                        | 6.4                                                                                                                                                                                                                                              | Wetter                                        |
| Vorwarnung             | `RenderFx.weather = { kind: 'cloudy', w }`, `w` steigend         | Himmel verdunkelt sich schrittweise, dazu Wind im Ton (7.3)                                                                                                                                                                                      | Wetter                                        |
| Feuerwache             | Silhouette (5.5)                                                 | —                                                                                                                                                                                                                                                | Gebäude                                       |

Die Signaltöne dazu stehen in 7.5. Die Dauer der Vorwarnkurve übernimmt M7 aus der M6-Spec 12.3: `w` steigt linear
von 0 auf 1 über die Vorwarnung.

## 7. Klang und Musik

### 7.1 Busse und Lautstärke-Hierarchie (A1)

Der Signalweg ist `Quelle → Bus → Master → destination`.

| Bus / Ebene | Inhalt                                                      | Standard-Bus-Pegel | Rolle                                                    |
| ----------- | ----------------------------------------------------------- | ------------------ | -------------------------------------------------------- |
| Signale     | `error`, `alarm`, `stormWarning`, `order`, `win`            | Effekte-Bus        | immer hörbar; lösen das Ducking aus                      |
| Effekte     | `build`, `demolish`, `coin`, `upgrade`, `orderDone`, `boom` | 1,0                | leiser als Signale (Figurpegel −6 dB gegenüber Signalen) |
| Umgebung    | Schichten aus 7.3                                           | 0,7                | Summe aller Schichten ≤ −12 dB unter den Signalen        |
| Musik       | Stücke aus 7.4                                              | 0,5                | liegt unter der Umgebung, wenn beide spielen             |
| Master      | Stumm und Master-Regler                                     | 0,4                | wie M5 `volume`                                          |

- Die Signale laufen über den Effekte-Bus. Einen eigenen Signal-Regler gibt es nicht, damit ein Spieler Signale
  nicht versehentlich stummschaltet, ohne die Effekte stummzuschalten (**Setzung Spec**).
- **Ducking:**
  - Ein Signal senkt Musik- und Umgebungs-Bus auf × 0,5 (−6 dB).
  - Angriff 50 ms, Halten für die Figurdauer plus 300 ms, Freigabe 600 ms.
  - Die Hüllkurve ist die reine Funktion `duckGain(nowS, signals[]) → Faktor`.
- Die Pegel sind Darstellungswerte (Konstanten in `src/audio/mix.ts`), keine Spielwerte.

### 7.2 Sichtbezug: `viewStats` (R5)

Die UI berechnet je Frame, höchstens alle 250 ms, mit der reinen Funktion
`viewStats(world, cam, view) → ViewStats` aus `src/render/viewStats.ts`:
`{ water, green, forest, rock, coast, inhabitants, zoom }`. Die Anteile beziehen sich auf die sichtbaren Kacheln
(0…1), `inhabitants` zählt die Einwohner in sichtbaren Häusern. Das Ergebnis geht als reine Zahlen an
`sound.setAmbience(...)`. `src/audio/` importiert weiter nichts aus `src/sim/`, `src/render/` oder `src/ui/`.

### 7.3 Umgebung (A2)

`ambienceMix(input) → Record<Layer, number>` ist eine reine Funktion (**Setzung Spec** für alle Formeln):

- `input = { view: ViewStats, phase, weather: { kind, w }, reduced: boolean }`
- `zn = clamp((zoom − 0,5) / 1,5, 0, 1)` ist die Nähe (0 = weit, 1 = nah).

| Schicht | Quelle (7.6)                                                   | Pegel                                                               | Rückfall                              |
| ------- | -------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------- |
| `sea`   | AM1 Schleife                                                   | `0,35 + 0,65 × water`                                               | synthetisches Rauschen aus M5         |
| `wind`  | synthetisch (Bandrauschen, LFO)                                | `0,15 + 0,35 × (1 − zn)`, dazu `+ 0,5 × w` bei `cloudy` und `storm` | —                                     |
| `birds` | AM2 Schleife                                                   | Tag und Morgen: `0,6 × (green + forest)`, sonst 0                   | synthetische Zirp-Figuren             |
| `gulls` | AM3 Schleife                                                   | Morgen, Tag, Abend: `0,5 × coast`, sonst 0                          | entfällt                              |
| `night` | AM4 Schleife                                                   | Nacht: `0,5 × (green + forest)`, Abend × 0,5, sonst 0               | synthetische Zirp-Figuren             |
| `town`  | synthetisches Gemurmel plus FX2 Hammer in zufälligen Abständen | `min(1, inhabitants / 60) × (0,3 + 0,7 × zn)`, nachts × 0,3         | nur Gemurmel                          |
| `rain`  | AM5 Schleife                                                   | `rain`/`storm`: `0,7 × w`                                           | gefiltertes Rauschen                  |
| `storm` | AM6 Schleife                                                   | `storm`: `0,8 × w`                                                  | verstärkter Wind                      |
| `fire`  | AM7 Schleife                                                   | Eingang `fire: 0…1` (M6 setzt ihn, Dev-Vorschau 9.5)                | gefiltertes Knistern (Rausch-Impulse) |

- Alle Pegel sind auf 0…1 geklemmt.
- Jede Schicht gleitet mit einer Zeitkonstante von 1,5 s zum Zielpegel (`setTargetAtTime`), damit Zoomen nicht
  springt.
- **Schleifen ohne Naht:** Jede Datei-Schicht spielt über zwei `AudioBufferSourceNode`, die sich am Ende mit 1,5 s
  überblenden. Das ist unabhängig vom MP3-Encoder-Versatz.
- Eine Schicht mit Zielpegel 0 über mehr als 10 s wird gestoppt und bei Bedarf neu gestartet. So laufen nicht alle
  neun Schichten dauernd.
- **Kann:** Einzelne Arbeitsgeräusche, also Hammer oder Säge aus Betrieben im Blick mit Zustand `ok`, höchstens
  1 je 2 s.

### 7.4 Musik (A3)

- **Stücke:**
  - Tag: MU1 und MU2.
  - Abend/Nacht: MU3.
  - Kann (viertes Stück): MU5 für die Nacht. MU4 ist mit 0:55 zu kurz und bleibt Reserve.
  - Verbindlich ist die Asset-Liste 7.6.
- **Ablauf:**
  - Nach `unlock()` (erste Interaktion, Auflage R77 4) wartet der Spieler 5–15 s, dann beginnt das erste Stück
    der aktuellen Phase.
  - Nach jedem Stück folgt eine Pause von 30–90 s, in der die Umgebung allein trägt.
  - Die Auswahl übernimmt die reine Funktion `nextTrack(state, rand) → { id, pauseMs }`:
    - `state = { phase, lastIds: string[], crisis: boolean }`
    - Sie wählt ein Stück der Phase, das nicht unter den letzten 2 war.
    - Hat die Phase nur ein Stück, darf es sich wiederholen.
    - `rand` ist eine eingespeiste Zufallsfunktion (Tests: fest).
- **Phasenwechsel:** Ein Stück spielt zu Ende. Erst das nächste Stück folgt der neuen Phase. Harte Wechsel gibt es
  nicht.
- **Überblenden:** Ein- und Ausblenden dauert je 3 s. Beim Stummschalten und bei verborgenem Tab wird die Musik
  pausiert und danach fortgesetzt.
- **Streaming:**
  - Die Musik läuft über ein Media-Element (`mediaFactory(url)`, Standard `new Audio(url)`, im Test ein Fake) mit
    `MediaElementAudioSourceNode` in den Musik-Bus.
  - Ein Stück wird nie vollständig dekodiert: Das wären etwa 60 MB je 3 Minuten.
  - `preload = 'none'`, bis das Stück dran ist.
- **Fehler:** Scheitert Laden oder Abspielen (`error`-Ereignis, abgewiesenes `play()`), wird das Stück übersprungen.
  Nach 2 Fehlern in Folge endet die Musik für die Sitzung, still und ohne Meldung.
- **Kann:** Stimmungswechsel in der Krise. Ist `crisis` wahr, bleibt der Musik-Bus auf × 0,5, und nach dem
  laufenden Stück folgt das ruhigste Nachtstück.

### 7.5 Effekte und Signaltöne (A1)

- **Bestehende Figuren:** Sie bleiben synthetisch und werden auf die Tonart der Musik gestimmt (D-Dur/D-Dorisch,
  **Setzung Spec**). Die Klangfarbe wird weicher: Dreieck und Sinus mit kurzem Holz-Anschlag statt Rechteck.
  Drosseln und Auslöser bleiben wie in M5 9.3.
- **Neue `SoundEvent`s** (Auslösen durch M6; in M7 über die Dev-Vorschau prüfbar):

| Ereignis       | Figur                                                                                                         | Bus / Rolle     | Drossel |
| -------------- | ------------------------------------------------------------------------------------------------------------- | --------------- | ------- |
| `alarm`        | SG1 Glocke, 3 Schläge (Schnitt aus der Datei); Rückfall: synthetische Glocke (Sinus-Partialtöne 1, 2,76, 5,4) | Signal, Ducking | 2000 ms |
| `stormWarning` | SG2 Nebelhorn, 2 s; Rückfall: tiefer Sägezahn-Akkord durch einen Tiefpass                                     | Signal, Ducking | 5000 ms |
| `boom`         | FX1 Münzen zweimal versetzt plus synthetische Fanfare aus 3 Tönen                                             | Effekt          | 2000 ms |

### 7.6 Asset-Liste Audio und Schrift

Urteile von `art-license-checker` (Datei `.studio/handoffs/2026-09-30-m7-lizenzpruefung.md`). Nur Posten mit **OK**
werden eingebaut. Ziel-Pfade liegen unter `public/`, das Format ist MP3 (läuft in allen Zielbrowsern), kodiert mit
`tools/assets/m7-audio.sh` (Abschnitt 8).

**Ergebnis der Prüfung:** 22 Quellen geprüft, **22 OK**, 0 Veto, 0 Grenzfälle, kein Warteschlangen-Eintrag.
Die Belege stammen aus erster Hand (Roh-HTML der Quellseiten). Gemessen wurde mit `ffprobe`.

| ID  | Posten            | Quelle (Autor)                                                                                  | Lizenz    | Original                | Ziel unter `public/`                                         | Status                                       |
| --- | ----------------- | ----------------------------------------------------------------------------------------------- | --------- | ----------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| MU1 | Musik Tag         | „Medieval: The Bard's Tale", opengameart.org (RandomMind)                                       | CC0 1.0   | 2:38,6, MP3 192 kbit/s  | `audio/music/bards-tale.mp3`                                 | **Muss**                                     |
| MU2 | Musik Tag         | „Medieval: The Old Tower Inn", opengameart.org (RandomMind)                                     | CC0 1.0   | 1:45,5, MP3 192 kbit/s  | `audio/music/old-tower-inn.mp3`                              | **Muss**                                     |
| MU3 | Musik Abend/Nacht | „If my complaints could passions move" (John Dowland 1597; Einspielung Of Far Different Nature) | CC0 1.0   | 2:41,5, MP3 320 kbit/s  | `audio/music/dowland-complaints.mp3`                         | **Muss**                                     |
| MU5 | Musik Nacht       | „Little Lullaby", opengameart.org (Alex_089)                                                    | CC BY 4.0 | 2:07,5, MP3 256 kbit/s  | `audio/music/little-lullaby.mp3`                             | Kann (viertes Stück)                         |
| MU4 | Reserve Nacht     | „Soft Mysterious Harp Loop" (VWolfdog / Jordy Hake)                                             | CC BY 3.0 | **0:54,9**, unter 1:30  | `audio/music/harp-loop.mp3`                                  | Reserve, nur als zweifach gespielte Schleife |
| MU6 | Reserve Tag       | „Medieval: Market Day" (RandomMind)                                                             | CC0 1.0   | 2:19,6                  | `audio/music/market-day.mp3`                                 | Reserve (lebhaft)                            |
| AM1 | Meer              | freesound 852826 (kkenny101); Ersatz AM1b 376795 (amholma)                                      | CC0 1.0   | 0:21,8 Mono, Schleife   | `audio/amb/sea.mp3`                                          | Muss                                         |
| AM2 | Vögel             | freesound 855955 (Nordliecht)                                                                   | CC0 1.0   | 0:35,0                  | `audio/amb/birds.mp3`                                        | Muss                                         |
| AM3 | Möwen             | freesound 317676 (nikitralala)                                                                  | CC0 1.0   | 1:30,5 binaural         | `audio/amb/gulls.mp3`                                        | Muss; Mono-Mix am Ohr prüfen, sonst Stereo   |
| AM4 | Grillen           | freesound 857163 (Goldenboy76)                                                                  | CC0 1.0   | 8:55,8 Mono             | `audio/amb/crickets.mp3`                                     | Muss (30-s-Ausschnitt)                       |
| AM5 | Regen             | freesound 321885 (Talitha5)                                                                     | CC0 1.0   | 0:30,8 MP3              | `audio/amb/rain.mp3`                                         | Muss (für M6)                                |
| AM6 | Sturm             | freesound 341941 (Qwirkie); Ersatz AM6b 870414 (Borgory)                                        | CC0 1.0   | 0:49,1 MP3              | `audio/amb/storm.mp3`                                        | Muss (für M6); Donner herausschneiden        |
| AM7 | Feuer             | freesound 564621 (Nox_Sound)                                                                    | CC0 1.0   | 0:11,0, Schleife        | `audio/amb/fire.mp3`                                         | Muss (für M6)                                |
| SG1 | `alarm`           | freesound 582523 (gsparrysound), Schiffsglocke                                                  | CC0 1.0   | 0:13,4                  | `audio/sfx/bell.mp3`                                         | Muss (3 Schläge)                             |
| SG2 | `stormWarning`    | freesound 673668 (TomOstepop), Nebelhorn; Ersatz SG2b 539956 (adharca)                          | CC0 1.0   | 0:15,2                  | `audio/sfx/foghorn.mp3`                                      | Muss (2-s-Ausschnitt)                        |
| FX1 | `boom`            | freesound 847349 (ilyaShevelev), Münzen                                                         | CC0 1.0   | 0:00,23 MP3             | `audio/sfx/coins.mp3`                                        | Muss                                         |
| FX2 | Stadt: Hammer     | freesound 707864 (L.i.Z.e.L.l.E\_+), Kurzlink `https://freesound.org/s/707864/`                 | CC0 1.0   | 0:02,0                  | `audio/sfx/hammer.mp3`                                       | Muss                                         |
| FO1 | Schrift           | EB Garamond (The EB Garamond Project Authors; Georg Duffner, Octavio Pardo), google/fonts       | OFL 1.1   | woff2 Latin 400 und 700 | `fonts/eb-garamond-400.woff2`, `-700.woff2`, `fonts/OFL.txt` | Muss                                         |
| FO2 | Reserve Schrift   | Alegreya (The Alegreya Project Authors)                                                         | OFL 1.1   | woff2 Latin 400         | `fonts/alegreya-400.woff2`                                   | Reserve                                      |

**Pflichten aus dem Urteil** (verbindlich für X1 und U1):

- **Freesound:** Die HQ-Vorschaudateien dürfen statt der Originale verwendet werden (CC0 gilt für das Werk in jedem
  Format, Freesound-AGB „Outbound"). **Es braucht kein Konto und keinen Nutzervorbehalt.** Die Dateien werden selbst
  gehostet, ohne Hotlink auf `cdn.freesound.org`. Als Quelle gilt die Sound-Seite.
- **CC BY (MU5, ggf. MU4):** Genannt werden Urheber, Titel, Link, Lizenzname und Link. Kürzen, Mono und Schleifen-Schnitt
  sind Änderungen und werden vermerkt („Changes: trimmed, re-encoded"). Der Vermerk steht in NOTICE, CREDITS und im
  Credits-Dialog. Umkodieren allein ist keine Bearbeitung. Die Nennung darf keine Billigung durch den Urheber
  andeuten.
- **OFL:** Die Lizenz und die Copyright-Zeile liegen auch neben den Schriftdateien (`public/fonts/OFL.txt`), weil nur
  `public/` ausgeliefert wird. Subsetting ist erlaubt. Einen Reserved Font Name gibt es nicht.
- **Namen:** Der Werktitel „The Bard's Tale" gleicht dem Namen einer kommerziellen Spielreihe. Er steht nur als
  Werktitel in den Credits und nie als Name im Spiel (ADR-006). Auch der Schiffsname aus der Beschreibung von SG2
  wird nicht übernommen.
- **Nachweise:** Die Zeilen und Lizenztexte liegen fertig in `.studio/handoffs/m7-lizenzen/`. Die SHA-256 der
  geprüften Musikdateien stehen im Anhang des Urteils. X1 prüft sie beim erneuten Laden, weil das Scratchpad nicht
  dauerhaft ist.

**Grösse** (Musik 128 kbit/s Stereo CBR): MU1 ≈ 2,54 MB, MU2 ≈ 1,69 MB, MU3 ≈ 2,58 MB, MU5 ≈ 2,04 MB. Zusammen
≈ 8,85 MB (≤ 9 MB). Umgebung und Signale ≈ 1,6–2,1 MB nach Scouting-Schätzung (64 kbit/s Mono, Schleifen 20–30 s),
Schrift ≈ 49 KB. Gesamt ≈ 11 MB (≤ 12 MB).

## 8. Assets, Laden und Grössenbudget

- **Ablage:**
  - `public/audio/music/*.mp3`: Stereo, 128 kbit/s CBR, ≤ 2,6 MB je Stück (**Setzung Spec**: die Muss-Stücke messen
    2:38 bzw. 2:41); längere Stücke werden gekürzt, sonst gestrichen.
  - `public/audio/amb/*.mp3`: Mono, 64 kbit/s, 20–40 s.
  - `public/audio/sfx/*.mp3`: Mono, 96 kbit/s, ≤ 6 s.
  - `public/fonts/*.woff2`: Latin-Subset.
- **Grössenbudget** (**Setzung Spec** nach Vorschlag 9): `public/` gesamt ≤ 12 MB, davon Musik ≤ 9 MB, Umgebung und
  Signale ≤ 2,2 MB, Schrift ≤ 150 KB. Ein Vitest prüft es (AK-X1-03).
- **Manifest:** `src/audio/manifest.ts` ist die eine Quelle für Pfade und Attribution im Spiel. Je Eintrag gibt es
  `{ id, kind: 'music' | 'loop' | 'sfx', file, phase?, title, author, license, link }`. Die Schrift steht in einem
  eigenen Eintrag in `src/ui/credits.ts`. Pfade werden über `import.meta.env.BASE_URL` aufgelöst, das Deployment
  unter einem Unterpfad (Pages) funktioniert also.
- **Laden:**
  1. Beim Start lädt **nichts** aus dem Audio-Budget. Das Spiel ist sofort spielbar, die Schrift lädt per CSS mit
     `font-display: swap`.
  2. Nach `unlock()` lädt die Umgebung, und zwar nur Schichten eines Busses mit Pegel > 0 und nur Schichten, deren
     Zielpegel einmal > 0 war. Regen, Sturm und Feuer laden erst, wenn sie gebraucht werden.
  3. Die Musik streamt je Stück erst, wenn es dran ist (7.4).
  4. Schlägt ein Laden fehl, greift der Rückfall der Schicht (7.3) bzw. die Musik entfällt. Das Spiel meldet nichts
     und wirft nichts.
- **Schnitt und Kodierung:**
  - `tools/assets/m7-audio.sh` holt nichts aus dem Netz. Es liest Originale aus einem lokalen Ordner (Argument)
    und schreibt die Zieldateien.
  - Jede Zeile nennt Quelle, Schnittpunkte und Kodierparameter. Damit sind die Änderungen für CC-BY nachvollziehbar
    dokumentiert.
  - `ffmpeg` ist ein lokales Werkzeug wie Chrome für die Browser-Checks, keine Abhängigkeit des Projekts.
- **Nachweis:** Jede Datei unter `public/` hat eine Zeile in `docs/CREDITS.md` und einen Lizenztext in
  `docs/licenses/`. Die Nachweise liegen vorbereitet in `.studio/handoffs/m7-lizenzen/` und werden mit dem Einbau
  committet (Paket X1). Die Attribution im Spiel zeigt der Credits-Dialog (9.3).
- **Integrität** (Nachtrag R83, QA 4): `tests/assets/sha256.json` listet die SHA-256 jeder Datei unter `public/`. Ein
  Vitest vergleicht die Liste mit den Dateien (AK-X1-06). Eine neue oder geänderte Datei braucht damit immer einen
  bewussten Eintrag.
- **ADR-011 „Asset-Pipeline"** schreibt `lead-tech` als Plan-Deliverable **vor A2**, formatneutral (deckt auch die
  Grafik-Tür aus 2.3). Es legt Ablage, Formate, Budget, Laden und Streaming, das Manifest als Quelle der Credits,
  das Skript und die Tests aus X1 fest (R83).

## 9. UI-Anmutung (Desktop, R78)

### 9.1 Materialsprache (U2)

- **Ziel sind Desktop-Breiten ab 1280 px** mit Maus und Tastatur. Das Card-UI und CSS Grid bleiben.
- **Leisten und Rahmen** (HUD, Bauleiste): „dunkles Holz" `#3b2a1d` mit feiner Maserung aus CSS-Verläufen, ohne
  Bilddatei. Die Kante ist eine Goldlinie `#c8962e` mit 1 px.
- **Karten** (Info-Panel, Handel, Auftrag, Einstellungen, Credits): Pergament `#efe3c4` mit Rand `#d9c79c`, Text
  in Tinte `#2e2418`.
- **Buttons:** Holz mit Goldrand. Der aktive Zustand ist mit Gold gefüllt und hat Tintentext.
- **Kontrast:** mindestens WCAG AA (4,5 : 1) für allen Text (AK-U2-02).
- **Schrift:**
  - Überschriften, Beschriftungen und Buttons in **EB Garamond** (FO1, 400 und 600/700), Rückfall `Georgia, serif`.
  - Zahlen mit `font-variant-numeric: lining-nums tabular-nums`, damit Werte im HUD nicht springen.
  - Fliesstext der Karten ebenfalls in EB Garamond, 15 px.
- **Signalfarben** in der UI wie in 4.2. Das bisherige `--danger` wird zu `--signal-red: #ff3b5c`. Nachtrag R83
  (QA 2): Signalrot ist **nie Texthintergrund und nie Textfarbe**. Es erscheint nur als Kante, Symbol oder Fläche
  ohne Text (mit dunklem Umriss). Warnungen und Fehler zeigen Tinte auf Pergament (11,9 : 1) mit roter Kante oder
  rotem Symbol. Tinte auf Signalrot läge bei 4,37 : 1, Signalrot auf Pergament bei 2,73 : 1, beides unter 4,5 : 1.
- **Ruhe-Ansicht im Panel:** Ohne Auswahl zeigt das rechte Panel eine Pergamentkarte „Inselchronik" mit Tagesphase
  (Symbol und Wort), Einwohnerzahl und dem Hinweis „Gebäude anklicken für Details" (I9).
- **Krisenkarte und Ereignis-Log (M6 D7):** `.card--crisis` (Pergamentkarte mit farbiger linker Kante je
  `data-kind`, Titel in EB Garamond) und `.event-log` (Pergamentliste, einklappbar). Die Klassen stehen in
  `src/style.css`, die Inhalte liefert M6 (11.3).
- **Schmale Fenster** (< 900 px): Das bestehende einspaltige Grid bleibt. Geprüft wird nur „stürzt nicht ab,
  nichts Wesentliches unerreichbar" (R78).
- **Kann:** Waren-Symbole (kleine Canvas- oder SVG-Symbole je Gut) statt Textchips im HUD.

### 9.2 Einstellungen (U1)

- Das HUD behält einen Schnellschalter **Stumm** und bekommt einen Button **Einstellungen**. Dieser öffnet eine
  Pergamentkarte mit:
  - Reglern für **Master, Musik, Umgebung, Effekte** (0…1)
  - Schaltern **Tag-Nacht** und **Bewegung reduzieren** (`Auto` / `An` / `Aus`)
  - dem Button **Credits**
- Der bisherige Lautstärkeregler im HUD entfällt, sein Wert wird der Master.
- **Bewegung reduzieren:**
  - `Auto` folgt `prefers-reduced-motion`.
  - `An` senkt alle Obergrenzen auf die reduzierten Werte (12.2), stoppt Wolkendrift und Glitzern und halbiert
    die Wellenamplitude.
  - Signale pulsieren weiter, aber ohne Grössenänderung.
- Die Karte schliesst mit `Esc`, einem Klick ausserhalb und einem Schliessen-Button.

### 9.3 Credits-Dialog (U1)

- Eine Pergamentkarte listet alle Einträge aus `manifest.ts` und `credits.ts` mit Titel, Autor, Lizenz (Kennung
  als Link zum Lizenztext) und Quelle (Link).
- Darüber steht der Satz „Grafik und Spiel: eigene Arbeit (prozedural). Musik, Klänge und Schrift: offen
  lizenziert, siehe unten."
- Die Links öffnen in einem neuen Tab (`rel="noopener"`).
- Die Liste entsteht per `textContent` bzw. `createElement`, ohne `innerHTML` (OWASP).

### 9.4 Einstellungs-Migration (U1, Auflage R77 4)

- Der Schlüssel bleibt `inselreich.settings`. **Gemeinsames Format M6 und M7** (Nachtrag R83, QA 3 / Tech B4;
  abgestimmt mit `lead-design`):
  `{ muted, master, music, ambience, effects, dayNight, reduceMotion: 'auto' | 'on' | 'off', crisisLevel }`.
  `crisisLevel` gehört M6 (M6-Spec 13.1), alle übrigen Felder M7.
- **Fremde Felder bleiben erhalten:** Jede Fassung von `parseSettings` liest die eigenen Felder und reicht alle
  übrigen Schlüssel unverändert durch; `saveSettings` schreibt sie wieder mit. So löscht keine Fassung das Feld der
  anderen, egal ob M6 oder M7 zuerst gemergt wird.
- Standard: `{ muted: false, master: 0.4, music: 0.5, ambience: 0.7, effects: 1, dayNight: true,
reduceMotion: 'auto' }`.
- **Migration:** Fehlt `master`, ist aber `volume` gültig, gilt `master = volume`. `muted` und `dayNight` bleiben
  erhalten. Ungültige Einzelwerte fallen einzeln auf den Standard zurück (wie M5). `volume` ist ab M7 ein
  Altfeld: Es wird nur noch als Quelle für `master` gelesen und beim Schreiben weggelassen. Eine M6-Fassung, die vor
  M7 landet, darf `volume` weiter schreiben; sobald M7 landet, gilt `master`.

### 9.5 Dev-Vorschau und Perf-Sonde (U1)

Beide sind nur im Dev-Build aktiv (`import.meta.env.DEV`). Im Produktions-Build werden die Parameter ignoriert
(AK-U1-07).

- **Vorschau:** `?wetter=klar|wolkig|regen|sturm&w=<0..1>&feuer=<buildingId>&boom=1&signal=alarm|stormWarning|boom`.
  - Sie setzt `RenderFx.weather`, zeichnet Feuer und Warnring am genannten Gebäude bzw. die Boom-Münze und setzt den
    Umgebungseingang `fire`.
  - `signal=` spielt den Ton einmal nach der ersten Interaktion.
  - `geloescht=<buildingId>` zeigt den Gelöscht-Effekt in einer Schleife von 6 s (nur mit dem Kann-Posten).
  - Die Vorschau dient den Browser-Checks von R3 und A2, solange M6 fehlt.
- **Audio-Sonde** (Nachtrag R83, QA 6): Im Dev-Build spiegelt die UI je 250 ms `sound.debugState()` nach
  `window.__inselAudio = { unlocked, buses: { master, music, ambience, effects }, layers: Record<Layer, number>,
duck, music: { state: 'idle' | 'pause' | 'playing', id } }`. `debugState()` ist eine reine Abfrage des
  Audio-Moduls ohne DOM-Zugriff. AK-U1-02 und AK-U1-05 lesen diese Werte per CDP.
- **Perf-Sonde:** `?perf=1` misst das Frame-Intervall (Abstand der `requestAnimationFrame`-Aufrufe) und die
  Render-Dauer (`performance.now()` um `render()`) über rollende 600 Frames. Sie schreibt
  `window.__inselPerf = { frameMedian, frameP95, renderMedian, renderP95, n }` und alle 5 s eine Zeile per
  `console.info`.

## 10. Einstellungen, Zustände und Speicher

- Die Einstellungen gehören nicht zum Spielstand und überleben „Neu" und „Laden" (wie M5).
- Der Spielstand ändert sich nicht. Die Save-Version bleibt, eine Migration ist nicht nötig.

## 11. Schnittstellen

### 11.1 UI → Render

```ts
render(ctx, world, cam, terrainLayer, hover, selectedId, view, fx?: RenderFx)
interface RenderFx {
  timeMs: number;
  dayNight?: boolean; // wie M5
  weather?: { kind: 'clear' | 'cloudy' | 'rain' | 'storm'; w: number }; // Standard clear
  reduceMotion?: boolean; // Standard false
  fire?: { id: number; flames: number; smoke: number }[]; // Feuer, Rauch-Nachlauf, Warnring bei flames > 0
  extinguished?: { id: number; p: number }[]; // Kann: Gelöscht-Effekt (M6 D3)
  mood?: boolean; // Kann: Stimmungswetter erlaubt (sonst clear ohne Krise)
  boom?: boolean; // Münze über dem Kontor
}
```

`buildTerrainLayer(world, scale?)` bekommt den Auflösungsfaktor optional (Standard aus `devicePixelRatio`, 5.1), und
`updateTerrainLayer(layer, world)` zeichnet die geänderten Bereiche neu. Diesen Aufruf macht `render()` selbst über
den `layoutKey`-Cache (5.1); der Aufruf in `app.ts` bleibt unverändert. Die Signatur von `render` bleibt, alle neuen Felder sind optional. Der
Render-Strang kann deshalb vor dem UI-Strang liefern.

### 11.2 UI → Audio

`createSound(opts, ctxFactory?, io?)`:

- `opts = { muted, master, music, ambience, effects }`
- `io = { fetchBuffer(url): Promise<ArrayBuffer>, mediaFactory(url): MediaLike, baseUrl: string }`, im Test Fakes.

Neue Methoden:

- `setBus(bus: 'master' | 'music' | 'ambience' | 'effects', v)`
- `setAmbience(input: AmbienceInput)`: höchstens 4× je Sekunde wirksam, weitere Aufrufe werden verworfen.
- `setPhase(phase)`
- `setCrisis(b)`: nur mit dem Kann-Posten „Stimmungswechsel in der Krise"

`setVolume(v)` bleibt als Alias für `setBus('master', v)`. `SoundEvent` wird um `alarm`, `stormWarning` und `boom`
erweitert. `AmbienceInput`, `Phase` und `ViewStats` sind strukturgleich als eigene Typen in `src/audio/` definiert,
ohne Import aus `src/render/`.

### 11.3 M6 → M7 (R74, R82; abgestimmt mit `lead-design`, M6-Spec Abschnitt 12)

Die Paket-Kürzel gelten je Meilenstein; M6-Pakete heissen hier **M6-…**. Nach R82 **entfallen M6-AU1, M6-AU0 und
M6-R0**. M6-R1 schrumpft auf die reine Abbildung `crisisFx(view, memo)` → `RenderFx`-Felder plus Verdrahtung im
gemeinsamen UI-Strang. M6 zeichnet nichts und erzeugt keinen Klang.

- **Abbildung** (`crisisFx`, Quelle `crisisView(world)`):
  - Brennendes Gebäude (`b.state === 'burning'`): `fire: [{ id, flames: 1, smoke: 1 }]`.
  - Rauch-Nachlauf nach Ausfallende (M6 D2): `flames: 0`, `smoke` fällt linear von 1 auf 0. Weil `crisisView` beim
    Ausfallende schon keine Krise mehr meldet, **merkt sich die M6-UI** Gebäude-Id und Ende-Tick (`memo`) und gibt sie
    an `crisisFx` (Nachtrag R83, Tech B5). Der Renderer bleibt ohne Gedächtnis.
  - Brand gelöscht (`outcome 'extinguished'`, M6 D3, Kann): `extinguished: [{ id: target, p }]` mit
    `p = (tick − Brandbeginn) / 60`; den Brandbeginn hält ebenfalls `memo`.
  - Sturm-Vorwarnung: `weather = { kind: 'cloudy', w: 1 − remaining / (STORM_WARNING + 1) }`, linear wie von M6
    vorgeschlagen.
  - Sturm aktiv: `weather = { kind: 'storm', w: 1 }`.
  - Boom: `boom: true`.
- **Wettervorrang:** `pickWeather` (6.4). Krisenwetter geht immer vor. Stimmungswetter bleibt bei `w ≤ 0,4` und nie
  bei `rain` oder `storm`.
- **Klang:**
  - Die Töne `alarm`, `stormWarning` und `boom` liefert M7-A1 (sofort startbar, mit synthetischem Rückfall). Die
    M6-UI löst sie über den Frame-Vergleich in `soundEvents.ts` aus: `alarm` bei Brandbeginn (`outcome 'burning'`),
    `stormWarning` bei der Ankündigung, `boom` bei Boom-Beginn.
  - **Sturmklang (M6 K3):** Die M6-UI gibt dasselbe Wetter, das sie an den Renderer gibt, über
    `setAmbience({ …, weather })` an den Ton. Die Schichten `wind`, `rain` und `storm` (M7-A2, Muss) tragen Vorwarnung
    und Sturm.
  - Den Umgebungseingang `fire` (0…1) setzt die M6-UI (M6-U3) auf 1, solange ein Gebäude brennt.
  - Für „gelöscht" gibt es keinen eigenen Ton; die Rückmeldung ist der Haken und das Ereignis-Log.
- **Anmutung von Krisenkarte und Ereignis-Log (M6 D7):**
  - U2 liefert die CSS-Klassen `.card--crisis` mit `data-kind="fire" | "storm" | "boom"` (linke Kante in
    `signalRed`, `signalWarn` bzw. Gold, Text Tinte auf Pergament nach 9.1) und `.event-log` (Pergament, einklappbar
    über `.event-log--collapsed`).
  - M6-UI setzt nur diese Klassen und ändert `src/style.css` nicht.
- **Feuerwache:** Den Silhouetten-Eintrag `firestation` liefert R2. Er kompiliert erst, wenn M6-S2 die Id auf `main`
  gebracht hat; R2 ist deshalb für diesen einen Eintrag **blocked-by M6-S2** (R83, Tech B5). Bis dahin zeigt die
  Feuerwache den Kategorie-Fallback, und R2 liefert alle übrigen Einträge ohne Warten.
- **UI-Strang** (R82 b): ein gemeinsamer, serieller Strang M7-U2 → M6-U1 / M7-U1 → M6-U2 → M6-U3. `app.ts` und
  `hud.ts` sind damit seriell.
- Die mobilen Restbefunde sind in M6 gestrichen (R77, R78) und in M7 nicht enthalten.

## 12. Performance-Budget (Auflagen R77 2, R78)

### 12.1 Referenz und Grenzen

- **Referenz:**
  - Desktop-Fenster 1920 × 1080, aktueller Chrome, Referenzmaschine des Nutzers (DPR laut Maschine).
  - Szenario `leistung-50` (58 Gebäude, 14.1), **ganze Insel sichtbar** (Zoom 0,5).
  - Dev-Vorschau `?wetter=sturm&w=1&feuer=<Id eines Betriebs>&perf=1`, Ton an, alle Obergrenzen erreicht.
- **Messmethode** (R82 c, Nachtrag R83, QA 7): **sichtbares** Chrome (nicht headless), Fenster 1920 × 1080, nach 30 s
  Einlaufen die gerenderten Frames über 10 s per CDP zählen, 3 Läufe, Median der drei fps-Werte.
- **Grenzen:**
  - **Untergrenze (hart):** Median ≥ 30 fps (AK-R4-06).
  - **Ziel:** Median ≥ 60 fps. Ein Verfehlen ist BEDENKEN, kein ZURÜCK.
  - Die Perf-Sonde (9.5) liefert zusätzlich `frameP95` und `renderMedian` zur Diagnose; sie sind keine Grenze.
  - `renderMedian ≤ 8 ms` bei 1280 × 800 und Zoom 1 (Ziel, gemeldet).
- **Aufbau:** Die Terrain-Ebene braucht einmalig ≤ 1500 ms, die Teil-Neuzeichnung nach einer Bauaktion ≤ 8 ms
  (AK-R1-06).

### 12.2 Obergrenzen (Setzung Spec)

| Element                         | Obergrenze | reduziert (9.2) |
| ------------------------------- | ---------- | --------------- |
| Spaziergänger `CAP_WALKERS`     | 40         | 12              |
| Möwen `CAP_GULLS`               | 8          | 3               |
| Rauchpartikel gesamt            | 150        | 50              |
| Regenschlieren `CAP_RAIN`       | 350        | 100             |
| Feuerzungen je Brand `CAP_FIRE` | 24         | 8               |
| Wolkenschatten (Kann)           | 6          | 0 (keine Drift) |
| Glitzerpunkte (Kann)            | 30         | 0               |

**Weitere Regeln:**

- Die Tönung kommt aus genau einem Multiply-Durchgang je Frame, dazu höchstens ein additiver Durchgang für Licht und
  Glühen.
- Die Terrain-Ebene ist gecacht (5.1).
- Gebäude dürfen in einen Sprite-Cache je `(defId, Stufe, Zoomstufe)` gerendert werden. Die Entscheidung liegt
  beim Plan.

## 13. Pakete und Datei-Ownership

**Stränge und Owner:**

| Strang | Rolle                                          | Dateien                                                                                  |
| ------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Render | `art-rendering-engineer`                       | `src/render/**`, `tests/render/**`                                                       |
| Audio  | `art-audio-engineer`                           | `src/audio/**`, `tests/audio/**`                                                         |
| UI     | `tech-ui-engineer`                             | `src/ui/**`, `index.html`, `src/style.css`, `tests/ui/**`                                |
| Assets | `art-audio-engineer` mit `art-license-checker` | `public/**`, `tools/assets/**`, `docs/CREDITS.md`, `docs/licenses/**`, `tests/assets/**` |

- Jede Datei hat genau einen Owner-Strang. Pakete, die dieselbe Datei berühren, laufen innerhalb eines Strangs
  nacheinander.
- `src/sim/` berührt kein Paket.
- `src/render/renderer.ts` ändern nur R1, R3 und R4, in dieser Reihenfolge.
- `src/audio/sound.ts` ändern nur A1, A2 und A3, in dieser Reihenfolge.

| Paket | Inhalt                                                                                                                                                                                                                                                                                            | Strang                             | Dateien                                                                                                                                                                                                                                                                                                                   | hängt ab von                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| R1    | **Vertical Slice** in zwei Review-Tasks (Nachtrag R83, Kann umgesetzt): **R1a** Palette, Küstenfeld, Terrain mit Rechenraster und Teil-Neuzeichnung, Wasser mit Schaum; **R1b** Wohnhaus (3 Stufen), Kontor, Holzfäller mit Schatten, Tageslicht mit Abend, Ebenenordnung, Signale nach dem Licht | Render                             | R1a: `palette.ts` (neu), `terrainField.ts` (neu), `terrain.ts`, `water.ts`; `tests/render/palette.test.ts`, `terrainField.test.ts`. R1b: `sprites.ts` (nur die 3 Typen und Schatten), `daynight.ts`, `renderer.ts`, `overlays.ts` (nur `signalRed`), `ship.ts` (Schatten); `tests/render/daynight.test.ts`. Kein `app.ts` | Spec; R1b nach R1a (gleicher Worktree); **Urteil Slice** (AK-R1-08) nach R1b, vor R2, R3, R4            |
| R2    | Übrige 10 Gebäudetypen, Feuerwache-Fallback, Fensteranker, Wege                                                                                                                                                                                                                                   | Render                             | `sprites.ts`; `tests/render/sprites.test.ts` (neu)                                                                                                                                                                                                                                                                        | R1 und Slice-Urteil; Eintrag `firestation` blocked-by M6-S2 (11.3); bei Ruling nach 2.3 neu geschnitten |
| R3    | **Wetter und Krisen-Effekte** (für M6 vorgezogen): `gradeAt`, `pickWeather`, Regen, Sturm, Wasser im Sturm, Feuer, Warnring, Boom, Obergrenzen, `reduceMotion`; Kann: Gelöscht-Effekt, Stimmungswetter mit Wolkenschatten, Glitzern                                                               | Render                             | `weather.ts` (neu), `fx.ts` (neu), `water.ts`, `renderer.ts`; `tests/render/weather.test.ts`, `fx.test.ts` (neu)                                                                                                                                                                                                          | R1 und Slice-Urteil; parallel zu R2 (keine gemeinsame Datei); Browser-Check nach U1 (Dev-Vorschau)      |
| R4    | **Leben und Fensterlicht:** Spaziergänger, Möwen, Herdrauch, Fensterlicht, Performance-Abnahme; Kann: Schafe, Fischerboot, Schattenlänge                                                                                                                                                          | Render                             | `life.ts` (neu), `daynight.ts`, `renderer.ts`; `tests/render/life.test.ts` (neu), `daynight.test.ts`                                                                                                                                                                                                                      | R2 (Fensteranker), R3 (`renderer.ts`)                                                                   |
| R5    | `viewStats`                                                                                                                                                                                                                                                                                       | Render                             | `viewStats.ts` (neu); `tests/render/viewStats.test.ts` (neu)                                                                                                                                                                                                                                                              | Spec (sofort startbar)                                                                                  |
| A1    | Busse, Ducking, Signaltöne `alarm`/`stormWarning`/`boom` (synthetischer Rückfall), Effekte umgestimmt, `io`-Injektion                                                                                                                                                                             | Audio                              | `sound.ts`, `mix.ts` (neu); `tests/audio/sound.test.ts`, `mix.test.ts` (neu)                                                                                                                                                                                                                                              | Spec (sofort startbar)                                                                                  |
| A2    | Umgebung: `ambienceMix`, Schleifen-Player mit Überblendung, synthetischer Wind, Gemurmel und Rückfälle, Manifest der Schleifen                                                                                                                                                                    | Audio                              | `ambience.ts` (neu), `manifest.ts` (neu), `sound.ts`; `tests/audio/ambience.test.ts` (neu)                                                                                                                                                                                                                                | A1                                                                                                      |
| A3    | Musik: `nextTrack`, Streaming-Player, Pausen, Überblendung, Manifest der Musik; Kann: Krisen-Stimmung                                                                                                                                                                                             | Audio                              | `music.ts` (neu), `manifest.ts`, `sound.ts`; `tests/audio/music.test.ts` (neu)                                                                                                                                                                                                                                            | A2                                                                                                      |
| X1    | Assets schneiden, kodieren und ablegen; Nachweise nach `docs/`; Budget-, Nachweis- und Prüfsummen-Test                                                                                                                                                                                            | Assets                             | `public/audio/**`, `public/fonts/**`, `tools/assets/m7-audio.sh` (neu), `docs/CREDITS.md`, `docs/licenses/**`, `tests/assets/assets.test.ts` (neu), `tests/assets/sha256.json` (neu)                                                                                                                                      | Lizenzurteil (liegt vor, 7.6); Test grün erst nach A3 (Manifest)                                        |
| U1    | Einstellungen und Migration, Einstellungs-Karte, Credits-Dialog, Audio-Anbindung (`setAmbience`, `setPhase`, Busse), Dev-Vorschau, Perf-Sonde, `reduceMotion`                                                                                                                                     | UI                                 | `settings.ts`, `settingsPanel.ts` (neu), `credits.ts` (neu), `app.ts`, `hud.ts`; `tests/ui/settings.test.ts`, `tests/ui/credits.test.ts` (neu), `tests/ui/devParams.test.ts` (neu)                                                                                                                                        | A1 (API), R5 (`viewStats`); Browser-Check nach R1                                                       |
| U2    | UI-Anmutung Desktop: Holz und Pergament, Schrift, Buttons, Karten, Ruhe-Ansicht im Panel, Klassen `.card--crisis` und `.event-log` für M6; Kann: Waren-Symbole                                                                                                                                    | UI                                 | `src/style.css`, `index.html`, `buildMenu.ts`, `inspect.ts`, `trade.ts`, `order.ts`, `messages.ts`                                                                                                                                                                                                                        | Spec (sofort startbar, Schrift-Rückfall `Georgia`); Schrift nach X1                                     |
| D1    | Doku-Pass: arc42, README, Projekt-CLAUDE.md                                                                                                                                                                                                                                                       | Doku (`lead-tech` bzw. Doku-Rolle) | `docs/arc42.md`, `README.md`, `CLAUDE.md`                                                                                                                                                                                                                                                                                 | alle Muss-Pakete                                                                                        |

Pfade ohne Präfix liegen im Ordner des Strangs.

**Parallelität:**

- Sofort startbar: R1, R5, A1, U2, X1 (sobald das Lizenzurteil vorliegt).
- Nach dem Slice-Urteil: R2 und R3 parallel.
- Danach: R4.
- Nacheinander: A2 → A3.
- U1 nach A1 und R5.
- U1 und U2 teilen keine Datei: `hud.ts` und `app.ts` gehören nur U1, `style.css` nur U2. Neue CSS-Klassen für
  die Einstellungs-Karte liefert U2 nach Absprache (Klassen-Namen in der Plan-Task).

## 14. Abnahmekriterien

Vitest-Kriterien laufen in CI (`make test`). **Browser-Checks** prüft `lead-qa` im Dev-Server (`make help`) in
Chrome per CDP bei **1280 × 800 und 1920 × 1080** (R78). Screenshots gehen nach `.studio/qa/M7-<Paket>/`. Was nur
mit Ohren prüfbar ist, steht in 14.2 und zählt nicht als Abnahmekriterium.

### 14.1 Szenario-Saves

Die M7-Checks nutzen die Szenario-Saves aus M5 (`tests/sim/scenarios.ts`, erzeugt mit
`SCENARIO_OUT=<ordner> npx vitest run tests/sim/scenario-saves.test.ts`). Sie werden geladen wie in M5 14.1.

| Szenario      | genutzt für                                                             |
| ------------- | ----------------------------------------------------------------------- |
| `galerie`     | Gebäude bei Zoom 1 (Vergleich mit `ist-01`), AK-R1-08, AK-R2-01         |
| `leistung-50` | ganze Insel bei Zoom 0,5 (Vergleich mit `ist-02`), Performance AK-R4-06 |
| `tag-3000`    | Nacht (Vergleich mit `ist-03`), AK-R4-05                                |
| `bedarf`      | Signale über dem Licht, AK-R1-07                                        |

Tickgenaue Lagen (Abend, Morgen) entstehen über die bestehenden Szenarien mit verändertem `tick` in der JSON. Den Tick
setzt der Check per CDP vor dem Laden. Einen neuen Sim-Helfer braucht es nicht.

### 14.2 Nutzer-Playtest (keine Abnahmekriterien)

- **P-01** Stimmt der Eindruck „warmer Spätsommernachmittag"? Kommt die Stimmung rüber? Das ist die Kernfrage von
  R73.
- **P-02** Umgebung: Ist das Meer vorn, wenn man auf die Küste zoomt? Ist die Stadt hörbar, wenn man auf die Stadt
  zoomt? Singen tags Vögel, zirpen nachts Grillen? Keine hörbaren Nähte in den Schleifen?
- **P-03** Musik: Setzt das erste Stück nach 5–15 s ein? Wirken die Pausen natürlich? Ist die Musik unaufdringlich
  bei 0,5?
- **P-04** Signale: Sind `error`, `order`, `alarm` (Vorschau) und `stormWarning` (Vorschau) unter Musik und Sturm
  sicher hörbar? Ist das Ducking spürbar, aber nicht störend?
- **P-05** Firefox und Safari: Musik, Umgebung, Schrift und Credits laufen ohne Fehler.
- **P-06** 15 Minuten spielen: Spielerzweck (Abschnitt 1) erlebt? Ist etwas zu viel Bewegung?

### R1 — Vertical Slice

- **AK-R1-01** (Vitest) `coastField(world)` ist deterministisch (zweimal gleich) und liefert für jede Landkachel
  `s > 0`, für jede Wasserkachel `s < 0`. Für eine Landkachel neben Wasser gilt `0 < s ≤ 1`.
- **AK-R1-02** (Vitest) Kachelgenauigkeit (4.3.5): Die Klassifikationsfunktion `terrainAt(field, px, py)` ordnet in
  Karte 3 für jede Kachel ≥ 75 % der Abtastpunkte eines 8 × 8-Rasters dem eigenen Terrain-Typ zu. Keine
  Abweichung reicht weiter als ¼ Kachel über die Kachelgrenze.
- **AK-R1-03** (Vitest) Farbabstand: Für jede Signalfarbe (`signalRed`, `signalYellow`, `signalWarn`, `signalOk`) und jede
  Flächenfarbe der Palette (Wasser bis Wände) gilt ΔE2000 ≥ 15. Geprüft wird ungetönt und unter der maximalen
  Tönung von Abend, Nacht und Morgen (6.1). Ausserdem gilt ΔE2000 ≥ 15 für jedes Paar der Signalfarben untereinander und für `window` gegen jede Signalfarbe. Die ΔE-Funktion ist
  ein Test-Helfer, kein Produktcode.
- **AK-R1-04** (Vitest) `lightAt(t)` für alle Ticks 0…5999: jeder Faktor liegt in `[0, 1]`, der Luma-Faktor ist ≥ 0,75.
  Es gilt `lightAt(0).mul = [1, 1, 1]` und `lightAt(t) = lightAt(t + 6000)`. Die Phasen entsprechen den Grenzen
  aus 6.1 an den Ticks 0, 2000, 2700, 4500 und 5100.
- **AK-R1-05** (Browser, 1920) Die Tönung ist ein einziger Multiply-Durchgang: Ein CDP-Trace bzw. ein Zähler im
  Dev-Build zeigt je Frame genau einen `fillRect` mit `multiply`. Mit `dayNight: false` und klarem Wetter gibt es keinen.
- **AK-R1-06** (Browser, 1920) Der Aufbau der Terrain-Ebene dauert ≤ 1500 ms (Perf-Sonde bzw.
  `console.time` im Dev-Build). Nach dem Bau eines Wohnhauses auf einer Waldkachel ist der Baum dort weg, die
  Nachbarkacheln sind unverändert. Die Teil-Neuzeichnung dauert ≤ 8 ms und wird vom Renderer ohne Aufruf aus der UI
  angestossen. Bei Zoom 0,5 zeichnet der Renderer die vorskalierte Kopie (Zähler im Dev-Build).
- **AK-R1-07** (Browser, 1280, `bedarf` bei Tick 3000) Bedarfssymbole, der Punkt „nicht angebunden" und die
  Auswahl haben im Screenshot dieselben Pixelwerte wie bei Tick 0 (Signale ungetönt, Toleranz ±2 je Kanal).
- **AK-R1-08** (Browser, **Slice-Urteil**) Vorher/Nachher auf denselben Ausschnitten:
  - `galerie` bei Zoom 1 und 1280 × 800 (wie `ist-01`)
  - `leistung-50` bei Zoom 0,5 und 1400 × 1500 (wie `ist-02`)
  - `tag-3000` bei 1280 × 800 (wie `ist-03`)
  - `galerie` bei Tick 2300 (Abend, neu)

  Ablage `.studio/qa/M7-R1/`, Vorher-Bilder aus `.studio/qa/M7-SPEC/ist/`. Die Mängel I1, I2, I3 (für die 3 Typen),
  I5 und I7 sind nach den Prüfmerkmalen aus 4.4 behoben. Urteil L0, `lead-art` und `lead-design` (OK oder Tür nach 2.3). Die Bilder gehen
  im Bericht an den Nutzer.

- **AK-R1-09** (Browser, 1280) Wohnhaus (alle 3 Stufen), Kontor und Holzfäller füllen ≥ 80 % ihres Footprints,
  abgelesen am Screenshot mit Kachelraster. Die Arbeitsanzeige des Holzfällers unterscheidet `ok` von
  `waitingInput`, wie AK aus M5 A1.

### R2 — Gebäude und Wege

- **AK-R2-01** (Browser, 1280, `galerie`) Alle 13 Typen sind bei Zoom 1 unterscheidbar. Ein Blindtest mit
  Screenshot ohne Beschriftung durch `qa-playtester` ordnet alle 13 richtig zu, die Legende ist erlaubt. Die drei
  Wohnhaus-Stufen sind unterscheidbar.
- **AK-R2-02** (Browser, 1920, `leistung-50`, Zoom 0,5) Die Kategorien Wohnen, Produktion und Öffentlich sind im
  Blindtest unterscheidbar (Auflage R77 3).
- **AK-R2-03** (Vitest) Die Silhouettentabelle deckt alle heutigen `BuildingDefId` ab. Eine unbekannte Id zeichnet
  den Kategorie-Fallback ohne Fehler (Fake-Kontext). Alle Fensteranker liegen innerhalb des Footprints.
- **AK-R2-04** (Browser, 1280) Wege sind Erdpfade ohne Balken-Wirkung. Die Nähte bleiben lückenlos bei Zoom 1,1 und
  1,7, wie der Q7-Check aus M5.

### R3 — Wetter und Krisen-Effekte

- **AK-R3-01** (Vitest) `gradeAt(tick, weather)`: Für jede Wetterart, jedes `w` in Schritten von 0,1 und jeden Tick
  0…5999 ist der Luma-Faktor ≥ 0,60 (4.3.4). Für `clear` gleicht er `lightAt` (≥ 0,75, AK-R1-04). `w = 0` gleicht
  `clear` für jede Art.
- **AK-R3-02** (Vitest) Obergrenzen: Regenschlieren ≤ `w × CAP_RAIN`, Feuerzungen ≤ `CAP_FIRE`, bei `flames = 0`
  keine Feuerzungen. Mit `reduceMotion` gelten die reduzierten Werte aus 12.2.
- **AK-R3-03** (Browser, 1280, Dev-Vorschau `?wetter=sturm&w=1&feuer=<Id>&boom=1`) Screenshots zeigen:
  - Sturmtönung, Regen, stärkere Wellen und Schaum
  - Flammen und Rauch am Gebäude und den pulsierenden Warnring (Pixelwerte des Rings entsprechen `signalWarn` ±2,
    also ungetönt)
  - die Boom-Münze über dem Kontor
- **AK-R3-04** (Vitest) `pickWeather`: Ein Krisenwetter geht immer vor. Ohne Krise und ohne Kann-Posten ergibt sich
  `clear`. Nur mit dem Kann-Posten gilt: `moodWeather` liefert für alle Ticks eines Tages nur `clear` oder `cloudy`
  mit `w ≤ 0,4` und ist deterministisch.
- **AK-R3-05** (Kann, Vitest und Browser mit `?geloescht=<Id>`) `drawExtinguished` zeichnet für `p` ausserhalb
  von `[0, 1]` nichts. Der Haken erscheint in `signalOk` und ungetönt.

### R4 — Leben und Fensterlicht

- **AK-R4-01** (Vitest) `walkerAt` ist deterministisch. Jede Position liegt auf einer Wegkachel oder zwischen zwei
  benachbarten. Ohne Weg gibt es 0 Figuren, und nie mehr als `CAP_WALKERS` bzw. den reduzierten Wert.
- **AK-R4-02** (Vitest) Anzahl nach Bevölkerung: 0 Einwohner ergeben 0 Figuren, 40 Einwohner ergeben 10, 400
  Einwohner ergeben `CAP_WALKERS`.
- **AK-R4-03** (Vitest) Herdrauch gibt es nur in den Phasen Morgen und Abend und nur an Häusern mit
  `inhabitants > 0`. Möwen gibt es nur über Wasser mit `−s < 2` und nicht nachts.
- **AK-R4-04** (Browser, 1280, `galerie`) Screenshots zu zwei Zeitpunkten 1 s auseinander zeigen bewegte Figuren auf
  den Wegen und Möwen an der Küste. Betriebe in `waitingInput` bleiben ruhig.
- **AK-R4-05** (Browser, 1280, `tag-3000`) In der Nacht leuchten Fenster bewohnter Häuser und die Laternen an Kontor
  und Markt. Ein unbewohntes Haus und ein Betrieb in `waitingInput` bleiben dunkel. Die Nacht ist im Vergleich zu
  `ist-03` eindeutig als Nacht erkennbar (Urteil `lead-design`).
- **AK-R4-06** (Browser, **Performance**, Referenz und Messmethode 12.1 nach R82 c) Median der drei fps-Werte
  ≥ 30. Gemeldet werden die drei Einzelwerte, der Median (Ziel ≥ 60) sowie `frameP95` und `renderMedian` aus der
  Perf-Sonde. Es gibt keine ungefangenen Fehler in der Konsole.
- **AK-R4-07** (Vitest, Nachtrag R83, Tech B1) `walkerAt` rechnet für `timeMs` = 0, 3,6·10⁶ (1 h) und 3,6·10⁸ (100 h)
  jeweils höchstens 32 Segmentschritte (Schrittzähler als optionaler Ausgabeparameter). Innerhalb einer Episode ist
  die Bewegung stetig: zwei Zeitpunkte 16 ms auseinander liegen höchstens 0,05 Kachel auseinander.

### R5 — `viewStats`

- **AK-R5-01** (Vitest) Ein Ausschnitt nur über Wasser ergibt `water = 1`, `inhabitants = 0`. Ein Ausschnitt über
  einer Stadt aus dem Szenario-Helfer ergibt `inhabitants` gleich der Summe der sichtbaren Häuser. Die Anteile summieren
  sich zu 1 (±1e-9). Kachelbereiche ausserhalb der Karte werden nicht gezählt.

### A1 — Busse, Ducking, Signaltöne

- **AK-A1-01** (Vitest, Fake-Kontext) Graph: Jede Quelle hängt an genau einem Bus, jeder Bus am Master. `setBus`
  setzt den richtigen Gain, geklemmt auf 0…1. `setVolume` wirkt wie `setBus('master')`. Stumm setzt den Master auf 0.
- **AK-A1-02** (Vitest) `duckGain`: Nach einem Signal zur Zeit `t0` gilt Faktor 0,5 ab `t0 + 0,05 s` bis
  Figurende + 0,3 s, danach 1 spätestens nach weiteren 0,6 s. Zwei überlappende Signale verlängern das Halten und
  vertiefen es nicht.
- **AK-A1-03** (Vitest) `alarm`, `stormWarning` und `boom` sind `SoundEvent`s mit den Drosseln aus 7.5. Ohne
  geladenes Sample spielen sie den synthetischen Rückfall und werfen nicht.
- **AK-A1-04** (Vitest) Die M5-Tests aus `tests/audio/sound.test.ts` bleiben grün: Entsperren, Sichtbarkeit,
  stiller Rückfall. Anpassungen sind nur bei den Graph-Annahmen erlaubt (erster Gain = Master).

### A2 — Umgebung

- **AK-A2-01** (Vitest) `ambienceMix` für feste Eingaben entspricht den Formeln aus 7.3 (Tabelle mit
  mindestens 8 Fällen: Küste nah, Stadt nah, weit, Nacht, Morgen, Regen, Sturm, Feuer). Alle Werte liegen in 0…1.
- **AK-A2-02** (Vitest, Fake-Kontext) Der Schleifen-Player startet die zweite Quelle 1,5 s vor dem Ende der ersten
  und blendet linear über. Eine Schicht mit Zielpegel 0 über mehr als 10 s ist gestoppt.
- **AK-A2-03** (Vitest) Laden: Vor `unlock()` wird `fetchBuffer` nie aufgerufen. Danach wird er nur für Schichten mit
  Pegel > 0 aufgerufen. Wirft `fetchBuffer` oder lehnt ab, läuft der Rückfall der Schicht, und nichts wirft.
- **AK-A2-04** (Browser, 1280, Netzwerk-Panel per CDP) Beim Laden der Seite wird keine Datei unter `audio/`
  angefragt. Nach dem ersten Klick werden nur Umgebungsdateien angefragt, keine Musik.

### A3 — Musik

- **AK-A3-01** (Vitest) `nextTrack`: wählt nur Stücke der Phase; nie eines der letzten 2, wenn Alternativen da sind;
  `pauseMs` liegt in `[30000, 90000]`; mit festem `rand` deterministisch.
- **AK-A3-02** (Vitest, Fake-Media) Vor `unlock()` wird kein Media-Element erzeugt. Das erste Stück beginnt
  frühestens 5 s und spätestens 15 s nach `unlock()` (Fake-Zeit). Ein Phasenwechsel während eines Stücks wechselt
  erst beim nächsten Stück.
- **AK-A3-03** (Vitest) Ein Fehler (`error`-Ereignis oder abgewiesenes `play()`) überspringt das Stück. Nach 2
  Fehlern in Folge wird kein weiteres Media-Element erzeugt. Nichts wirft.
- **AK-A3-04** (Vitest) Stumm oder verborgen pausiert das Media-Element. Aufheben setzt fort.
- **AK-A3-05** (Browser, 1280) Nach dem ersten Klick wird genau eine Musikdatei angefragt, und zwar erst, wenn das
  Stück beginnt. Die Anfrage läuft als Streaming (Range-Requests bzw. `media`-Typ im Netzwerk-Panel).

### X1 — Assets

- **AK-X1-01** (Vitest) Jeder Manifest-Eintrag (`src/audio/manifest.ts`, `src/ui/credits.ts`) hat eine Datei unter
  `public/`. Jede Datei unter `public/audio` und `public/fonts` hat einen Manifest-Eintrag.
- **AK-X1-02** (Vitest) Jede Datei unter `public/` hat eine Zeile in `docs/CREDITS.md` mit allen Pflichtfeldern, und
  die dort genannte Lizenzdatei existiert in `docs/licenses/`.
- **AK-X1-03** (Vitest) Grössenbudget aus 8: Gesamt ≤ 12 MB, Musik ≤ 9 MB, Umgebung und Signale ≤ 2,2 MB,
  Schrift ≤ 150 KB, jedes Musikstück ≤ 2,6 MB.
- **AK-X1-04** (Prüfung `art-license-checker`) Die eingebauten Dateien stimmen mit den geprüften Quellen überein
  (Quelle, Schnitt laut `m7-audio.sh`). Es gibt keine Datei ohne OK-Urteil.
- **AK-X1-05** ADR-011 (von `lead-tech`, Plan-Deliverable vor A2) liegt vor; X1 hält sich daran.
- **AK-X1-06** (Vitest, Nachtrag R83, QA 4) Für jede Datei unter `public/` stimmt die SHA-256 mit
  `tests/assets/sha256.json` überein. Eine Datei ohne Eintrag und ein Eintrag ohne Datei lassen den Test scheitern.
  Die Musikdateien entsprechen zusätzlich den im Lizenzurteil festgehaltenen Quellen (Schnitt laut
  `m7-audio.sh`).

### U1 — Einstellungen, Credits, Anbindung, Dev-Werkzeuge

- **AK-U1-01** (Vitest) Migration:
  - `{"muted":true,"volume":0.2,"dayNight":false}` ergibt `muted: true`, `master: 0.2`, `dayNight: false`, die
    übrigen Werte auf Standard.
  - Ungültiges JSON ergibt den Standard.
  - Einzelne ungültige Werte fallen einzeln zurück.
  - Geschrieben wird kein `volume`.
- **AK-U1-01b** (Vitest, gemeinsam mit M6 AK-U1-01; wer zuerst liefert, legt den Fall an, der andere erweitert ihn)
  Round-trip über das gemeinsame Format: Ein JSON mit allen Feldern aus 9.4 samt `crisisLevel: 'mild'` und einem
  unbekannten Feld `zukunft: 1` ergibt nach `parseSettings` → `saveSettings` dieselben Werte für alle Felder,
  einschliesslich `crisisLevel` und `zukunft`. Ein JSON nur mit `crisisLevel` erhält `crisisLevel` und bekommt die
  M7-Standardwerte.
- **AK-U1-02** (Browser, 1280) Die Einstellungs-Karte öffnet und schliesst (Button, `Esc`, Klick ausserhalb). Jeder der vier
  Regler ändert den zugehörigen Wert in `window.__inselAudio.buses` (9.5). Nach dem Neuladen stehen alle Werte wie gesetzt.
- **AK-U1-03** (Browser, 1280) Der Credits-Dialog listet jeden Manifest-Eintrag mit Titel, Autor, Lizenz und Link. Die
  Links haben `target="_blank"` und `rel="noopener"`.
- **AK-U1-04** (Vitest) Die Credits-Liste entsteht ohne `innerHTML`. Ein Titel mit `<b>` erscheint als Text.
- **AK-U1-05** (Browser) Zoomen von der Küste (Zoom 2) zur Stadt (Zoom 2) ändert
  `window.__inselAudio.layers` in die Richtung aus 7.3: `sea` sinkt, `town` steigt; Herauszoomen auf 0,5 lässt `wind`
  steigen. `setAmbience` wird höchstens 4× je Sekunde wirksam.
- **AK-U1-06** (Browser) `Bewegung reduzieren = An` senkt die Figuren sichtbar auf ≤ 12. `Auto` folgt der
  CDP-Emulation von `prefers-reduced-motion`.
- **AK-U1-07** (Vitest, `tests/ui/devParams.test.ts`) Der Parser der Dev-Parameter liefert für gültige und
  ungültige Eingaben das Erwartete. Im Produktionsmodus (`dev = false`) liefert er immer „keine Vorschau".

### U2 — UI-Anmutung

- **AK-U2-01** (Browser, 1280 und 1920) HUD und Bauleiste zeigen Holz mit Goldkante, Karten Pergament. Die Schrift
  ist EB Garamond, nach X1 geprüft über `document.fonts.check`. Vorher greift der Rückfall `Georgia`.
- **AK-U2-02** (Browser) Der Kontrast aller Textfarben auf ihren Hintergründen ist ≥ 4,5 : 1 (CDP-Accessibility
  bzw. Rechnung aus den CSS-Variablen).
- **AK-U2-03** (Browser, 1280) Ohne Auswahl zeigt das Panel die Ruhe-Ansicht mit Tagesphase und Einwohnern.
- **AK-U2-04** (Browser, 800 × 900) „Stürzt nicht ab, nichts Wesentliches unerreichbar": Bauen, Handeln, Speichern
  und Einstellungen sind erreichbar (R78).
- **AK-U2-05** (Browser, 1280, statische Testseite oder Dev-Konsole) Eine `.card--crisis` je `data-kind` und ein
  `.event-log` mit 10 Einträgen, auf- und zugeklappt, werden lesbar dargestellt. Der Kontrast ist wie in AK-U2-02.

## 15. Änderungen gegenüber Hauptspec, arc42 und ADRs

| Dokument / Stelle                        | bisher                                                                                                      | mit M7                                                                                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| M5-Spec 3 („keine fremden Assets")       | nur prozedural und synthetisch                                                                              | fremde Musik, Umgebungsklänge und Schrift nach ADR-006 und Lizenzurteil; Grafik weiter prozedural (2.3)                                            |
| M5-Spec 9.5 Tag-Nacht                    | blaue Fläche, `dayNightAlpha`                                                                               | Farbkurve `lightAt`, Multiply, Fensterlicht (6.1, 6.2)                                                                                             |
| M5-Spec 9.3 Ton                          | ein Master, Meer synthetisch                                                                                | drei Busse und Master, Ducking, Umgebungsschichten, Musik (Abschnitt 7)                                                                            |
| M5-Spec 9.7 Einstellungen                | `{ muted, volume, dayNight }`                                                                               | neues Format mit Migration (9.4)                                                                                                                   |
| M5-Spec 9.1 Kategoriefarben              | Vollfarbe je Kategorie (`BUILDING_COLORS`)                                                                  | Dachfamilie und Form (5.5)                                                                                                                         |
| Palette Signale                          | Rot `#e02020`/`#d03030`, `--danger #d9534f`                                                                 | `signalRed #ff3b5c`, `signalWarn #ff6726` (4.2)                                                                                                    |
| arc42 5 Bausteine                        | Render: `terrain`, `water`, `sprites`, `ship`, `overlays`, `daynight`, `camera`, `renderer`; Audio: `sound` | zusätzlich `palette`, `terrainField`, `life`, `weather`, `fx`, `viewStats`; `mix`, `ambience`, `music`, `manifest`; UI: `settingsPanel`, `credits` |
| arc42 7 Verteilung                       | nur Bundle                                                                                                  | zusätzlich statische Assets unter `public/`, Laden nach Bedarf                                                                                     |
| arc42 8 Ton                              | synthetisch, ein Regler                                                                                     | Busse, Ducking, Laden, Rückfälle; neuer Abschnitt „Assets und Laden"                                                                               |
| arc42 10/11                              | —                                                                                                           | Frame-Budget (12), Risiko Asset-Grösse und Lizenz                                                                                                  |
| ADR-011 (neu)                            | —                                                                                                           | Asset-Pipeline (8), formatneutral; schreibt `lead-tech` vor A2 (R83)                                                                               |
| ADR-006                                  | Attribution im Spiel „spätere Projektarbeit"                                                                | umgesetzt durch den Credits-Dialog (9.3); kein Text-Change am ADR nötig                                                                            |
| Projekt-CLAUDE.md Test-Strategie, Scopes | Vitest für sim, Kamera, audio, overlays, ui-Helfer                                                          | zusätzlich reine Render-Mathematik (`terrainField`, `daynight`, `life`, `weather`, `viewStats`) und `tests/assets/`; Scope „Assets"                |

Keine Änderung an ADR-001 (keine Abhängigkeit), ADR-002 (Render und Audio lesen nur), ADR-003 (seit Nachtrag M7-ISO ersetzt durch ADR-012) und
am Save-Format.

## 16. Offene Punkte mit Empfehlung

1. **Freesound-Downloads** — aufgelöst: Die Vorschaudateien sind zulässig, ein Konto ist nicht nötig (7.6). Nur für den
   Mono-Mix der binauralen Möwen (AM3) wäre ein verlustfreies Original besser. _Empfehlung:_ erst am Ohr prüfen; bei
   Phasenproblemen Stereo verwenden (+0,24 MB), statt ein Konto anzulegen.
2. **Nacht-Musik ist dünn.** Mit MU3 und MU5 (Kann) hat die Nacht höchstens 2 Stücke; MU4 ist mit 0:55 zu kurz.
   _Empfehlung:_ reicht für M7, weil die Pausen und die Nachtgeräusche tragen. Ein viertes Stück ist Kann. Ein zweiter Scouting-Durchgang auf
   Wikimedia Commons und ccMixter lohnt sich erst nach P-03.
3. **Stadt-Klang synthetisch.** Es gibt keine saubere CC0-Aufnahme ohne verständliche Sprache. _Empfehlung:_ Gemurmel
   synthetisch plus Hammer-Sample. Klingt es im Playtest (P-02) künstlich, wird die Schicht leiser oder entfällt.
4. **Vogelstimmen alpin statt Insel.** _Empfehlung:_ akzeptieren. Im Spiel fällt die Art nicht auf, am Ohr prüft
   `lead-art` beim Schnitt.
5. **Auflösungsfaktor 2 der Terrain-Ebene** (64 MB Grafikspeicher). _Empfehlung:_ im Slice messen (AK-R1-06). Ist
   der Aufbau zu langsam, gilt Faktor 1, und bei Zoom 2 wird es leicht weich.
6. **Umfang.** 12 Pakete in 4 Strängen, voraussichtlich 2 Sessions. _Empfehlung:_ R1, R5, A1, U2 und X1 parallel
   starten. Kann-Posten erst, wenn alle Muss-Pakete abgenommen sind.

## 17. Nachtrag R83 — geänderte Stellen (für die Nachprüfung durch `lead-qa`)

| Auflage                        | Stelle in dieser Spec                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| QA 1 Luma mit Wetter           | 4.3.4, 6.1 (Luma-Satz), 6.4 (Sturmfaktor, Luma-Satz), AK-R3-01                      |
| QA 2 Kontrast Signalrot        | 9.1 (Signalfarben), 11.3 (Krisenkarte)                                              |
| QA 3 / Tech B4 Einstellungen   | 9.4, AK-U1-01b; Abstimmung in `.studio/handoffs/2026-09-30-lead-art-lead-design.md` |
| QA 4 Prüfsummen                | 8 (Integrität), 13 (X1), AK-X1-06                                                   |
| QA 5 Farbabstand               | 4.2 (Palette, Änderungsliste), 4.3.2, AK-R1-03                                      |
| QA 6 Audio-Sonde               | 9.5, AK-U1-02, AK-U1-05                                                             |
| QA 7 Frame-Messung             | 12.1, AK-R4-06                                                                      |
| QA 8 Mängel                    | 4.4 (neu), AK-R1-08                                                                 |
| Tech B1 Spaziergänger          | 5.6, AK-R4-07                                                                       |
| Tech B2 Terrain-Aufbau         | 5.1 (Rechenraster, vorskalierte Kopie), AK-R1-06                                    |
| Tech B3 Slice ohne `app.ts`    | 5.1 (Auflösungsfaktor, Bebauung), 11.1, 13 (R1), AK-R1-06                           |
| Tech B5 R82                    | 11.3 (neu gefasst), 12.1, 13 (R2 blocked-by M6-S2)                                  |
| R1a/R1b                        | 13 (R1), 4.4                                                                        |
| ADR-011 bei `lead-tech`        | 8, 13 (X1, Assets-Strang), 15, AK-X1-05                                             |
| Eigenbefund: Ebenenreihenfolge | 4.3.1 (bisher Verweis auf einen fehlenden Abschnitt, jetzt ausgeschrieben)          |
| Status                         | Kopfzeile                                                                           |
