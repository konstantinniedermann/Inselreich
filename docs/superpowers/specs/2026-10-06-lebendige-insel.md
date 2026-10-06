# Stilrahmen-Nachtrag „Lebendige Insel" (ART-STIL-02)

- Status: Entwurf zum Gate (L0, Prüfung lead-tech und lead-qa) · Paket ART-STIL-02 · Ruling R280 Phase 1 · Autor:
  lead-art · 2026-10-06
- Ergänzt den Stilrahmen [2026-10-04-stilrahmen.md](2026-10-04-stilrahmen.md) (R211). S1–S6 und §5 gelten weiter;
  dieser Nachtrag legt nur fest, was neu ist oder strenger wird. Bei Widerspruch gilt dieser Nachtrag für die
  hier genannten Elemente.
- Grundlage: Ist-Galerie `.studio/qa/art-stil-02/` (main 25fb93f, Seeds 1/2/5/7, Tag, 1920×1080, DPR 2, lokal und
  nicht versioniert; Skript `skripte/gal.mjs`, Bildnamen `s<seed>-<motiv>-z<zoom>.png`), Code-Lektüre `src/render/`.
- Nutzerfeedback 2026-10-06 im Wortlaut der Zusammenfassung: R280; Referenz sind Meer, Küste, Strand, Wiese und
  Tierleben.

## 1 Diagnose

Warum gefällt der Referenzstil? Wasser, Saum, Strand und Wiese haben drei Eigenschaften gemeinsam. (a) Ihre Formen
folgen **stetigen Feldern** (Küstenabstand, Rauschen), nicht dem Kachelraster (`saum.ts`, `dunes.ts`). (b) Sie **variieren über alle Massstäbe**:
Tiefenverlauf, Schaumband, Wellenstriche, Korn. (c) Sie **bewegen sich** (Schaum, Wellen, Fische, Wal, Vögel). Wald,
Gebirgsfuss und Gebäude verletzen je mindestens eine dieser Eigenschaften.

### 1.1 Wald (Bilder `s*-wald-z1/z2`, `s2-gesamt-z0.5`)

- **W1 Kachelraster als Silhouette:** Je freier Waldkachel gibt es genau einen Stempel (`iso.ts` `sortedObjects`
  :152–159). Die Kronen sitzen auf 5 festen Plätzen (Ecken und Mitte der Raute) mit nur ±0,025 Kachel Streuung
  (`trees.ts` `SLOTS` :66–72, `crownsFor` :87–88). Der Waldrand ist deshalb eine Treppe aus Rautenkanten. In der
  Fernansicht wirken die Wälder wie Teppichstücke (`s2-gesamt-z0.5`).
- **W2 Zu wenig Vielfalt:** Es gibt nur 8 Stempel (`TREE_VARIANTS`, `iso.ts` :15) mit 3–5 Kronen. Der Radius streut nur
  0,08–0,15 (Faktor < 2). Bei 64 × 64 Kacheln wiederholt sich jeder Stempel hunderte Male, und das Auge findet das
  Muster.
- **W3 Gleichförmige Mischung:** Die Art wird je Krone gewürfelt (50 % Laub, 28 % Nadel, 22 % hell, `trees.ts`
  :89–90). Es gibt keine Bestände, keine Altersstufen, keinen Unterschied zwischen Rand und Kern und keine Lichtungen.
  Ein Wald sieht überall gleich dicht und gleich alt aus.
- **W4 Geometrische Einzelform:** Die Laubkrone besteht aus drei Ellipsen (Schattenmond, Mitte, Kappe, :176–198), der
  Nadelbaum aus zwei Dreiecken (:148–172). Unter jeder Krone steht ein sichtbarer Stamm von 3 px (:141–144). Das
  ergibt einen „Lutscher"-Look, und jeder Baum ist einzeln lesbar statt als Kronendach.
- **W5 Leblos:** Nichts bewegt sich im oder am Wald, und es gibt keinen Unterwuchs. Die Büsche am Waldrand sind flache
  Ellipsen auf der Graskachel (`groundDecor.ts` `shrubsFor`, `terrain.ts` `paintDecor` :1200–1225).

### 1.2 Gebirge (Bilder `s*-gebirgsfuss-z1/z2`, `s1-kueste-z1`)

Gelungen und zu behalten: das Höhenfeld, die Grate, die gestufte Tonleiter und die Staffelung (H-R9). Das „Schroffe"
entsteht an drei Stellen.

- **G1 Wand statt Fuss:** Der Körper erreicht schon nach `RIM` = 1,1 Kacheln Randabstand 24 % der Amplitude
  (`BODY_FLOOR`), und das Profil steigt früh an (`PROFILE` 0,9 < 1; `massif.ts` :44–48). Bei `AMP_CAP` 135 px steht
  damit innerhalb einer Kachel eine Wand von ≈ 30 px. Die Vorberge aus H-R13 liegen nur als Ton im Boden
  (`terrain.ts` :327–392) und können diesen Sprung nicht auffangen.
- **G2 Grauer Hof:** Das Schuttband (`DEBRIS`, rock/rockLight mit 15 % sandDry, `light.ts` :22–26, `debrisOf`
  `massif.ts` :698) und der Schutt im Boden (`SCREE_MAX` 0,75, `terrain.ts` :351) bilden einen breiten, kühlgrauen,
  fleckigen Saum. Er wirkt wie Nebel oder Schmutz (`s1-gebirgsfuss-z1`) und trennt das Massiv von der Wiese, statt
  zu verbinden. Bei Zoom 2 zerfällt er in Pixelrauschen, weil die Fläche mit `MASSIF_MAX_SCALE` 2 statt 4 gemalt und
  hochskaliert wird (`limits.ts` :35; `s1-wald-z2` rechts).
- **G3 Kontrast ohne Abstufung nach Höhe:** Die volle Tonleiter (5 Stufen, `ROCK_TONES`) gilt ab dem Fuss. Grosse,
  harte Tonflecken (`TONE_NOISE`, `toneLevel` :710–725) liegen bis an den Rand. Bewuchs gibt es nur als seltene
  Flecken in tiefen, flachen Lagen (`vegField` :729–733, `VEG_MIX` 0,75). Das Massiv bleibt bis unten Fels in
  kühlem Grau, während die Wiese warm-oliv ist. Es fehlen Gipfelschnee, Krüppelbäume und Grasbänder, also alles, was
  einen Berg mit der Landschaft verzahnt.

### 1.3 Gebäude (Bilder `s1-siedlung-z1/z2`)

- **B1 Jede Fläche hat eine Kontur:** `IsoPainter.poly` streicht jedes Polygon mit 1 px im dunklen Eigenton
  (`sprites.ts` :111–128, `OUTLINE_INK` 0,45). Damit werden auch die **Innenkanten** gezogen (Wand links/rechts,
  Dachflächen, First). S4 verlangt Innenkanten nur aus dem Facettenkontrast; das ist erst zur Hälfte umgesetzt.
  Die Linie ist bei jedem Zoom 1 CSS-px breit, also bei DPR 2 zwei Gerätepixel. Das ergibt den Vektor- bzw.
  Comic-Look.
- **B2 Mathematisch gerade:** Alle Kanten sind exakte `lineTo`-Geraden mit Miter-Ecken (Ausnahme Giebel, :258). Die
  Flächen sind einfarbig. Material (Fugen, Stroh) liegt nur als Strich innen (`material.ts`). Kein Dach hängt durch,
  keine Traufe ist gerundet, keine Kante hat Licht.
- **B3 Kein Bodenkontakt:** Die Körper stehen auf scharf begrenzten Hofplatten bzw. direkt auf der Wiese, ohne
  Kontaktschatten und ohne Übergang (Erde, Gras am Sockel). Stilrahmen §6 „Später" nennt das schon (AO, Hofplatten).

### 1.4 „Zu wenig los" (Bilder `s*-gesamt-z0.5`, `s*-wiese-z1`)

Die Deko kennt heute Büschel, Blumenpunkte (3 Töne, ein Rauschfeld) und Waldrand-Büsche (`groundDecor.ts`). Dazu
kommen Fische, Wal, Vogelschwärme und Möwen (`wildlife.ts`, `life.ts`). Alles ist **häufig und überall gleich**:
Es gibt keine Seltenheit, keine Seed-Variante und kein einmaliges Objekt. Das Meer jenseits des Flachwassers ist
leer, ebenso das Innere der Wiesen. Nach dem dritten Spiel gibt es nichts Neues mehr zu entdecken.

## 2 Bildziele

Jedes Häppchen liefert Vorher/Nachher mit der Galerie aus §6.0, bei Seeds 1/2/5/7 und gleicher Kamera. Die Kriterien
in Klammern sind in §7 messbar gemacht.

### 2.1 Wald — „gewachsen statt gestempelt"

1. **Silhouette aus einem Feld:** Der Waldrand folgt einer Höhenlinie des geglätteten Waldfelds
   (`fields.types.forest`) plus Rauschen, nicht den Rautenkanten. Kronen dürfen bis 0,35 Kachel über die eigene
   Kachel hinausragen, aber nur zu Wald- oder freien Graskacheln, nie über Gebäude oder Wege. Bei Zoom 0,5 ist keine
   Treppe aus Rautenkanten mehr erkennbar.
2. **Rand ≠ Kern:** Am Rand stehen ein Saum aus Jungbäumen und Gebüsch (kleinere Kronen, Büsche auf der Waldkachel)
   und sichtbare Stämme. Im Kern bilden grosse, überlappende Kronen ein geschlossenes Kronendach, und Stämme sind dort
   kaum zu sehen.
3. **Bestände:** Die Art folgt einem tieffrequenten Feld (Merkmal 4–8 Kacheln), so dass Laub-, Nadel- und
   Hellholz-Gruppen entstehen. Dazu kommt ein Grössenspektrum von Faktor ≥ 2,5 und einzelne Überhälter.
4. **Kronen als Wolken:** Eine Laubkrone ist ein Klumpen aus 3–6 Lappen mit gezackter Silhouette in 3 Tonstufen (S2,
   Licht aus `LIGHT`). Ein Nadelbaum hat 3–4 unregelmässige Etagen und leicht schiefe Spitzen. Keine Krone ist eine
   reine Ellipse oder ein reines Dreieck.
5. **Lichtungen und Leben:** Gelegentlich ist der Bestand ausgedünnt (Lichtung mit hellerem Boden und Farn). Die Kachel
   bleibt dabei als Wald lesbar (≥ 2 Kronen). Am Waldrand gibt es Tiere (§3, Gruppe B).
6. **Lesbarkeit bleibt:** Bei Zoom 1 ist Wald dunkler als die Wiese und als Holzquelle erkennbar. Eine einzelne
   Waldkachel hebt sich von einem Solitärbaum auf der Wiese ab (§4 R7).

### 2.2 Gebirgsübergang — „aus dem Land gewachsen"

1. **Kern unverändert:** Wo hn ≥ 0,35 (Höhe relativ zur Amplitude) und ausserhalb von Schnee und Bergbäumen gilt,
   bleibt der Pixeldiff ≈ 0 gegen main.
2. **Fuss statt Wand:** Ein konkaver Hangfuss: Der Körper steigt über ≈ 2 Kacheln statt 1,1 an (Schwemmkegel und
   Schutthalden an Rinnenausgängen). Die Amplitude des Kerns bleibt gleich.
3. **Warme Verzahnung statt grauem Hof:** Das Schuttband wird schmaler und wärmer (Ocker, Richtung `earth`/`sandDry`),
   und es ist nicht mehr fleckig. Grasbänder und Krüppelbäume laufen in Rinnen und auf Schultern bis hn ≈ 0,3 hinauf.
   Im untersten Viertel trägt der Fels die Lichtfarben der Wiese (bis 35 % Bewuchsanteil), der Kern bleibt Fels.
4. **Kontrast nach Höhe:** Am Fuss reicht der Tonumfang über höchstens 3 Stufen, ab hn 0,35 gilt die volle Leiter.
   Weicher heisst hier also weniger Kontrast unten, nicht weichgezeichnet; S2 und S3 gelten weiter.
5. **Gipfel:** Hohe Massive (Amplitude ≥ 90 px) tragen Schnee auf flachen Lagen über hn 0,8, in Rinnen tiefer
   hinab. Der Schnee ist warmweiss bis kühlblau gestuft und nie heller als `foam`.
6. **Zoom 2:** Der Sockel zeigt kein Pixelrauschen mehr. Gegenmittel sind ein scharfer Schuttrand mit Korn statt
   Alpha-Dither oder eine eigene Fussfläche in voller Auflösung. Die Wahl trifft das Häppchen L2 nach Messung.

### 2.3 Gebäudekanten — „von Hand gesetzt"

1. **Kontur nur an der Silhouette:** Eine Linie im dunklen Eigenton um den ganzen Körper. Innenkanten entstehen nur
   aus Facettenkontrast (S4 vollständig). Breite ≤ 0,75 CSS-px bei Zoom 1, Deckkraft ≤ 0,7, bei Zoom ≤ 0,5 keine
   Linie.
2. **Lichtkante:** An der Licht zugewandten Oberkante (First, Traufe links oben, Wandkante zum Licht) liegt eine
   0,5–1 px warme Kante in `LIGHT_TONE`, wie die Gratkante des Gebirges (`RIDGE_HI`).
3. **Hand-Linie:** Lange Kanten (First, Traufe, Wandoberkante ≥ 0,8 Kachel) hängen um 0,3–0,8 px durch oder wölben
   sich. Die Ecken sind gerundet (`lineJoin` round). Der Versatz ist deterministisch aus Variante und Kante. Er gilt
   nur im Bild; Picking-Polygone und `bodyHull` bleiben gerade.
4. **Fläche mit Pinselkorn:** Leichte Tonvariation innerhalb einer Fläche (2 Stufen, Korn ≤ 1 px, nur im Sprite-Cache),
   Dachflächen mit Reihen-Unregelmässigkeit. Signale und Typ-Erkennung haben Vorrang.
5. **Bodenkontakt:** Ein Kontaktschatten (2 Tonstufen, kühl) am Fuss. Hofplatten mit ausgefranstem Erdrand statt
   gerader Kante, dazu einzelne Grasbüschel am Sockel.
6. **Lesbarkeit:** Der Blindtest (Probenblatt 15) ist nicht schlechter als der H-R10-Endstand. Bei Zoom 1 hebt sich
   jedes Gebäude von Wiese, Sand und Wald ab.

## 3 Katalog der Entdeckungs-Elemente

**Seltenheit:** **H** häufig (jeder Seed, Dichtefeld); **G** gelegentlich (jeder Seed, 2–12 Stück je Insel); **S**
selten (in 30–60 % der Seeds, je 1–3); **E** einmalig (≤ 1 je Karte, in 10–35 % der Seeds); **V** Seed-Variante (je
Insel ein Charakter, §3.7). **Ebene:** **Boden** = ins Bodenbild gerastert (`terrain.ts`-Pfad, keine Kosten je
Frame); **Stempel** = aufrechtes Objekt im sortierten Durchgang mit Stempel-Cache (wie `trees.ts`); **Massiv** = in
die Massivfläche gerastert (`rocks.ts`); **Wasser** = Wasserebene bzw. `water.ts`; **Tier** = animiert je Frame aus
`timeMs` (wie `wildlife.ts`). **Zoom** = ab welcher Zoomstufe sichtbar. Dateien mit „neu" legt das Häppchen an.
(U) markiert die Nutzerliste. Zeilenaufbau: Nr Element — Ort · Seltenheit · Animation (– = statisch) · Ebene ·
ab Zoom · Datei.

### 3.1 Gruppe A — Wiese und offenes Land

- **A1** (U) Blumenwiesen (Flecken, Blütenfarbe je Insel) — freie Wiese · H + V · – · Boden · ≥ 1 · `groundDecor.ts`
- **A2** (U) Wiesenarten: hohes Gras, Klee, Trockenrasen — Wiese nach `meadowWarmth` · H · – · Boden · ≥ 0,5 · `groundDecor.ts`
- **A3** (U) Büsche frei auf der Wiese (Gruppen 1–3) — Wiese, ≥ 2 Kacheln vom Weg · H · – · Boden · ≥ 0,75 · `groundDecor.ts`
- **A4** (U) Steine auf der Wiese (Kiesel, kleine Findlinge ≤ 0,3 Kachel) — Wiese, häufiger am Gebirge · H · – · Boden · ≥ 1 · `groundDecor.ts`
- **A5** Solitärbaum (Eiche/Linde, breit, mit Schattenfleck) — Wiese, ≥ 2 Kacheln vom Wald · G · – · Stempel · ≥ 0,5 · neu `decorStamps.ts`
- **A6** Blühender Obstbaum (weiss/rosa) — Wiese, Südhang (Lichtseite) · S · – · Stempel · ≥ 0,5 · `decorStamps.ts`
- **A7** Lesesteinhaufen — Wiese · G · – · Boden · ≥ 1 · `groundDecor.ts`
- **A8** Steinkreis (7–9 kleine Steine im Ring) — flache Wiese · E 25 % · – · Boden · ≥ 0,75 · `groundDecor.ts`
- **A9** Menhir (einzelner aufrechter Stein) — Wiese, Kuppe · S · – · Stempel · ≥ 0,75 · `decorStamps.ts`
- **A10** Pilzring (Hexenring) im Gras — feuchte Wiese · S · – · Boden · ≥ 1,5 · `groundDecor.ts`
- **A11** Maulwurfshügel — Wiese · G · – · Boden · ≥ 1,5 · `groundDecor.ts`
- **A12** Feuchtwiese mit Binsen — Wiese nahe Küste (s klein) · G · – · Boden · ≥ 0,75 · `groundDecor.ts`
- **A13** Grosser Blütenteppich in einer Farbe (Mohn, Lavendel …) — grösste freie Wiese · E 30 % · – · Boden · ≥ 0,5 · `groundDecor.ts`
- **A14** Mauerreste einer Ruine — Wiese, abseits vom Kontor · E 20 % · – · Stempel · ≥ 0,75 · `decorStamps.ts`
- **A15** Schmetterlinge über Blumenwiesen (Tag) — über A1/A13 · G · animiert · Tier · ≥ 1 · neu `fauna.ts`
- **A16** Hasen am Wiesenrand, scheu (≥ 3 Kacheln von Wegen/Gebäuden) — Wiese · G · animiert · Tier · ≥ 1 · `fauna.ts`
- **A17** Glühwürmchen (Nacht) — Wiese am Waldrand · G · animiert · Tier · ≥ 0,75 · `fauna.ts`

### 3.2 Gruppe B — Wald

- **B1** Waldsaum: Jungbäume und Gebüsch am Rand — Waldrand · H · – · Stempel · ≥ 0,5 · `trees.ts`
- **B2** Lichtung mit hellem Boden und Farn — Waldkern, ≥ 9 Waldkacheln · G · – · Boden + Stempel · ≥ 0,5 · `trees.ts`, `terrain.ts` (Waldzweig)
- **B3** Uralter Riesenbaum (Krone ×1,8) — Waldkern · E 50 % · – · Stempel · ≥ 0,5 · `trees.ts`
- **B4** Birkenhain (weisse Stämme) — Waldrand, Bestand · S · – · Stempel · ≥ 0,75 · `trees.ts`
- **B5** Ahorngruppe mit rotem Laub — Bestand im Laubwald · S · – · Stempel · ≥ 0,5 · `trees.ts`
- **B6** Pilze am Waldboden (Terrakotta-Punkte, keine Signalfarbe) — Waldrand, Lichtung · H · – · Boden · ≥ 1,5 · `groundDecor.ts`
- **B7** Umgestürzter Stamm, Totholz — Waldrand, Lichtung · G · – · Boden · ≥ 1 · `groundDecor.ts`
- **B8** Farnsaum — Waldrand (Grasseite) · H · – · Boden · ≥ 1 · `groundDecor.ts`
- **B9** Reh oder Hirsch am Waldrand (Morgen, Abend) — Waldrand ↔ Wiese · S · animiert · Tier · ≥ 0,75 · `fauna.ts`
- **B10** Fuchs, der über die Lichtung huscht — Lichtung (B2) · S · animiert · Tier · ≥ 1 · `fauna.ts`
- **B11** Vögel, die in Abständen aus dem Kronendach auffliegen — Waldkern · G · animiert · Tier · ≥ 0,75 · `fauna.ts`

### 3.3 Gruppe C — Gebirge

- **C1** (U) Steinbock auf Felsbändern — Massiv, Schultern, hn 0,3–0,7 · G (Massiv ≥ 24 Kacheln) · animiert · Tier · ≥ 1 · `fauna.ts` (Höhe aus `massif.ts`)
- **C2** (U) Schneegipfel — hn ≥ 0,8, flach; Rinnen tiefer · V (Amplitude ≥ 90 px) · – · Massiv · alle · `massif.ts`, `rocks.ts`
- **C3** (U) Einzelne Bäume im Gebirge (Krüppelkiefern) — Rinnen, Bänder, hn < 0,5 · H je Massiv · – · Massiv · ≥ 0,5 · `massif.ts`, `rocks.ts`
- **C4** Schutthalde und Schwemmkegel an Rinnenausgängen — Massivfuss · H · – · Massiv · alle · `massif.ts`
- **C5** Alpenwiese mit Blütenpunkten — Schultern, hn 0,3–0,6, flach · G · – · Massiv · ≥ 0,75 · `massif.ts`, `rocks.ts`
- **C6** Bergsee in einer Hochmulde — flachste Mulde, hn 0,4–0,7 · E 25 % · – · Massiv · ≥ 0,5 · `massif.ts`, `rocks.ts`
- **C7** Wasserfall in einer Rinne (Glitzern) — steile Rinne, endet im Schutt · E 20 % · animiert · Massiv + Tier · ≥ 0,75 · `rocks.ts`, `fauna.ts`
- **C8** Höhle bzw. Felstor — Flanke zur Kamera (Schattenseite) · E 20 % · – · Massiv · ≥ 1 · `rocks.ts`
- **C9** Steinmännchen auf einem Gipfel — höchster Gipfel · S · – · Massiv · ≥ 1,5 · `rocks.ts`
- **C10** Adler, der über dem Gipfel kreist — über hn ≥ 0,6 · G · animiert · Tier · ≥ 0,5 · `fauna.ts`
- **C11** Einzelne Felsbrocken am Fuss (aus dem Massiv gerollt) — Wiese ≤ 2 Kacheln vom Fuss · H · – · Boden · ≥ 0,75 · `groundDecor.ts`

### 3.4 Gruppe D — Strand und Küste

- **D1** (U) Palmen am Strand (einzeln, Gruppen 2–3, schief zur See) — trockener Sand ≥ 1 Kachel vom Saum · V (H/G/–) · – · Stempel · ≥ 0,5 · `decorStamps.ts`
- **D2** (U) Steine am Strand — Sand, nasser Saum · H · – · Boden · ≥ 1 · `groundDecor.ts`
- **D3** Treibholz am Spülsaum — nasser Sand · H · – · Boden · ≥ 1 · `groundDecor.ts`
- **D4** Muscheln und Seesterne — nasser Sand · H · – · Boden · ≥ 1,5 · `groundDecor.ts`
- **D5** Strandhafer auf den Dünen — Dünenkämme (`dunes.ts`) · H · – · Boden · ≥ 0,75 · `groundDecor.ts`
- **D6** Gezeitentümpel zwischen Strandsteinen — nasser Sand an Felsküste · G · – · Boden · ≥ 1 · `groundDecor.ts`
- **D7** Krabben, die seitwärts huschen — nasser Sand · G · animiert · Tier · ≥ 1,5 · `fauna.ts`
- **D8** Schildkröte mit Spur im Sand — ruhiger Strand, abseits Kontor · S · animiert · Tier · ≥ 1 · `fauna.ts`
- **D9** Angeschwemmte Kiste bzw. Flaschenpost — Spülsaum · E 15 % · – · Boden · ≥ 1,5 · `groundDecor.ts`
- **D10** Robben auf einer Sandbank oder einem Felsen — D11 oder E3 · S · animiert · Tier · ≥ 0,75 · `fauna.ts`
- **D11** Sandbank (helle Untiefe vor der Küste) — Flachwasser · G · – · Wasser · alle · `terrain.ts` (Wasserzweig)

### 3.5 Gruppe E — Meer

- **E1** (U) Wrack (Rumpf schräg auf Grund, Mastrest, ohne Segel) — Flach- oder Mittelwasser · E 40 % · statisch (Schaum ja) · Stempel + Wasser · ≥ 0,25 · `decorStamps.ts`, `water.ts`
- **E2** (U) Riff (helle Untiefe mit Brandungsschaum) — Mittelwasser, parallel zur Küste · G · animiert (Schaum) · Wasser · ≥ 0,25 · `terrain.ts`, `water.ts`
- **E3** (U) Felsen im Meer (Brandungsfels; selten als Felsnadel) — Flach- und Mittelwasser · G / S · animiert (Schaum) · Stempel · ≥ 0,25 · `decorStamps.ts`, `water.ts`
- **E4** Kormorane auf einem Felsen (E3), die Flügel trocknen — E3 · S · animiert · Tier · ≥ 1 · `fauna.ts`
- **E5** Delfine springen in Bögen — Tiefwasser, abseits der Lanes · S · animiert · Tier · ≥ 0,5 · `wildlife.ts`
- **E6** Seetangfelder — Flachwasser vor Felsküste · G · – · Wasser · ≥ 0,5 · `terrain.ts` (Wasserzweig)
- **E7** Meeresleuchten in der Brandung (Nacht) — Schaumsaum · V 20 % · animiert · Wasser · ≥ 0,5 · `water.ts`
- **E8** Winziges Felseiland mit einer Palme — Mittelwasser, ≥ 4 Kacheln zur Küste · E 15 % · – · Stempel · ≥ 0,25 · `decorStamps.ts`

**Zählung:** Nutzerliste 12 Einträge (U: A1, A2, A3, A4, C1, C2, C3, D1, D2, E1, E2, E3). Eigene Elemente: A5–A17
(13), B1–B11 (11), C4–C11 (8), D3–D11 (9), E4–E8 (5) = **46**, gefordert sind ≥ 30. Die Fauna (A15–A17, B9–B11, C1,
C10, D7, D8, D10, E4, E5) ergänzt Fische, Wal, Vogelschwärme und Möwen und dupliziert sie nicht.

### 3.6 Seltenheit über Seeds

- **Seltenheitsbudget je Insel:** Aus dem Pool S und E zieht jede Insel deterministisch (`hash2(seed + 5xx, i, 0)`)
  3–6 Elemente. Dazu kommen alle H und G, die das Gelände zulässt. Folge: Jede Karte hat etwas Besonderes, aber
  keine hat alles. Über 5 Spiele sieht man im Mittel ≥ 70 % des Katalogs (prüfbar, §7 L8).
- **Gelände entscheidet mit:** Ein Element erscheint nur, wenn sein Ort existiert (Bergsee nur bei einer Mulde,
  Robben nur bei Sandbank oder Felsen). Gezogen wird erst nach der Eignungsprüfung, so geht kein Losglück an
  ungeeignetes Gelände verloren.
- **Entdecken lohnt Zoomen:** Ein Teil der Elemente zeigt sich erst ab Zoom 1,5 (Pilzring, Muscheln, Kiste,
  Steinmännchen, Krabben). Ein Teil gehört zu einer Tageszeit (Rehe morgens und abends, Glühwürmchen und
  Meeresleuchten nachts).
- **Fremdinseln** erhalten ihren Charakter aus dem Ansicht-Seed (`islandView`, `archipel.ts` :125). Eine fremde Insel
  kann also andere Seltenheiten zeigen als die Heimat. Auf ihr ist nur die Bodenebene Pflicht; Tiere erst, wenn die
  Kamera dort ist (Culling).

### 3.7 Seed-Varianten (Inselcharakter)

Je Insel einmal aus dem Seed gewählt (`hash2(seed + 500, 0, k)`), rein farblich bzw. Bestand, nie Spielwert:

- **Waldtyp:** Mischwald (Standard) · Nadelwald (kühl, spitz) · Birken- und Hellholzwald · Pinienwald (schirmförmig, warm)
- **Blütenpalette:** Kalk und Stroh (heute) · Mohn und Kornblume · Lavendel und Weiss · Butterblumengelb und Weiss — alle ΔE2000 ≥ 20 zu den Signalfarben
- **Küste:** Palmenküste (D1 häufig) · Kiefernküste (D1 selten, Nadelbäume bis an den Sand) · kahle Dünenküste
- **Gebirge:** mit Schnee (nur Amplitude ≥ 90 px) · ohne Schnee; Bewuchsanteil am Fuss 20–35 %
- **Nachtmeer:** E7 Meeresleuchten ja oder nein

Paletten bleiben in `palette.ts`-Mischungen (keine neuen Grundfarben ohne Gate; neue Mischtöne sind erlaubt). Der
Fels (`ROCK_TONES`) bleibt in allen Varianten gleich, er ist die Referenz.

## 4 Regeln

- **R1 Deterministisch:** Jede Platzierung ist eine reine Funktion von (Ansicht-Seed, Insel, Kachel bzw. Zelle, Salz).
  Nur `hash2`, `valueNoise` und `rotNoise`, nie `Math.random`. Neue Salze kommen ausschliesslich aus dem Block
  **500–599** (heute in `src/render/` frei; belegte Salze siehe Kopf von `groundDecor.ts`). Jedes Häppchen trägt
  seine Salze dort ein. Bewegung nur aus `timeMs` und Phase, wie in `wildlife.ts`.
- **R2 Rein darstellend:** keine Änderung an `src/sim/`, an `World`, am Save-Format oder an Spielwerten. Gelesen
  werden nur Terrain, Gebäude, Wege, `island.anchor`, `seaLanes` (`src/sim/islands.ts`), Phase und Wetter. Keine
  Deko ändert Picking, Bauregeln, Holzertrag oder Pfade.
- **R3 Unter Gebäuden und Wegen:** Boden-Deko meidet die belegte Kachel (heutige `occ`-Maske, `paintDecor`). Ein
  Stempel entfällt auf belegten Kacheln und auf den Kacheln direkt vor einem Gebäude (+x, +y, +x+y), damit nichts ein
  Gebäude verdeckt. Die Liste der Stempel hängt am `layoutKey` wie die Bäume (`iso.ts` :135). Bauen, Abreissen,
  Roden und Aufforsten erneuern sie im selben Patch-Rechteck wie `updateTerrainLayer`. Nach einem Abriss kommt die
  Deko deterministisch zurück.
- **R4 Meer und Schifffahrt:** Meer-Elemente (E1–E3, E6, E8, D10, D11) halten **≥ 3 Kacheln** Abstand zur Polylinie
  jeder `seaLane` (in Archipel-Koordinaten) und **≥ 4 Kacheln** zu `island.anchor` und zu jedem Kontor. Sie liegen nie
  zwischen Anker und offener See im Anfahrtskegel (±30° um die Richtung Anker → nächster Lane-Punkt). Das Wrack hat
  keine Segel, steht ≥ 20° geneigt und ist entsättigt, damit es nie wie ein Handelsschiff gelesen wird. `shipAt`
  trifft es nie.
- **R5 Lesbarkeit vor Schmuck:** Keine Deko in Signalfarben (ΔE2000 ≥ 20 zu `signal*`, Prüfung mit
  `tests/render/deltaE.ts`). Stehende Deko ist höchstens `TREE_H` hoch. Deko darf weder wie ein Gebäude noch wie eine
  Ressource aussehen: Ein Solitärbaum steht ≥ 2 Kacheln vom Wald und höchstens einer je 3 × 3, Findlinge sind
  ≤ 0,3 Kachel gross, und auf bebaubaren Kacheln gibt es keinen Wasser-Look (Ausnahme Feuchtwiese A12 nur als
  Binsen, ohne blaue Fläche). E8 (Felseiland) liegt nur im Wasser und ist nie grösser als eine Kachel.
- **R6 Dichte:** Stehende Deko (Stempel ohne Bäume) ≤ 1 je 6 Landkacheln und ≤ 300 je Insel. Boden-Deko ändert den
  mittleren Ton einer Wiesenkachel um ≤ 1 Tonstufe (S6, ein Haus steht nie sichtbar „in" der Deko). Fauna siehe §5.
- **R7 Stil:** Alles folgt S1–S6: Licht aus `LIGHT`, Formen in 2–3 Tonstufen, Kontur als dunkler Eigenton, keine
  Linien in Schwarz oder Weiss. Tiere sind Silhouetten aus 2 Tönen wie Fische und Vögel heute.
- **R8 Bewegung zurücknehmen:** `reduceMotion` folgt den Obergrenzen [normal, reduziert] (§5). Bei Zoom ≤
  `LOD_ZOOM` gibt es keine Fauna und keine animierten Wasser-Elemente. Ein Element darf nie blinken.

## 5 Performance-Budget (nach Stilrahmen §5)

- **Messweg:** A/B mit `tools/render-qa/perf.mjs` (Seed 7 und 14, 1920 × 1080, Zoom 1, DPR 2; zusätzlich Zoom 2).
  Gezählt wird das Delta, nicht der Absolutwert.
- **Je Frame:** je Häppchen höchstens +0,2 ms `renderMedian`, je Release höchstens +0,5 ms. Boden-, Massiv- und
  Kanten-Häppchen (L1–L3, Bodenteile von L4/L5) erwarten ≈ 0, weil alles gecacht ist.
- **Erstbild und Patch:** `buildMs` höchstens +30 % je Häppchen und +50 % je Release, `lastPatchMs` höchstens +30 %.
  Vor L4 wird der Patch-Pfad gemessen (R213: kaum Luft). Boden-Deko wird nur im Patch-Rechteck neu gemalt.
- **Caches, bewusste Abweichung von §5 („keine neuen Schlüssel"):** (1) Baumstempel: `TREE_VARIANTS` 8 → höchstens
  24 (Waldtyp × Rand/Kern × Form), weiter ein Eintrag je Variante und Zoomstufe (≈ 24 × 7 kleine Flächen, < 6 MiB bei
  Zoom 2). (2) Neuer Deko-Stempel-Cache (`decorStamps.ts`) mit LRU und **`DECOR_CACHE_MAX_BYTES` = 8 MiB** in
  `limits.ts`; gefüllt wird nur, was im Bild ist. (3) Gebäude-Sprites: Grösse und Zahl der Einträge unverändert,
  nur der Inhalt ändert sich. (4) Massiv: Schnee, Bergbäume und die übrigen C-Elemente werden in die bestehende Fläche
  gerastert, `MASSIF_CACHE_MAX_BYTES` bleibt.
- **Culling:** Stempel und Fauna nur im sichtbaren Kachelbereich (`range` wie bei Bäumen bzw. `fishAnchors`). Die
  feste Stempelliste wird je `layoutKey` sortiert und je Frame nur gemischt (wie die Bäume).
- **Fernansicht:** Bei Zoom ≤ 0,25 nur, was ins Bodenbild bzw. in die Viertel-Kopie gerastert ist, plus Wrack und
  Meeresfelsen als Stempel (Orientierung). Kleinstempel (A9, A14) erst ab 0,75.
- **Fauna-Obergrenzen** (neu in `CAPS`, [normal, reduziert]): butterflies [12, 0], hares [4, 1], fireflies [24, 0],
  deer [2, 1], fox [1, 0], forestBirds [6, 2], ibex [3, 1], eagle [1, 1], crabs [6, 0], turtle [1, 0], seals [3, 1],
  cormorants [3, 1], dolphins [3, 0]. Summe ≤ 69 Figuren normal bzw. ≤ 9 reduziert. Alle werden gemeinsam nur im
  Bild gezählt.

## 6 Zuschnitt in Häppchen

### 6.0 Gemeinsam

- Prozessstufe leicht, je Häppchen ein Worktree, höchstens 2 Bild-Fix-Runden (R211), Umsetzung durch
  `art-rendering-engineer` unter lead-art.
- **Galerie:** L1 versioniert das Galerie-Skript nach `tools/render-qa/galerie.mjs` (Basis
  `.studio/qa/art-stil-02/skripte/gal.mjs`: Seeds als Argument, Motive Wald, Gebirgsfuss, Gebirge, Küste, Wiese,
  Siedlung, Gesamt; dazu Zoom 1,5/2 und Nacht als Option). Alle Häppchen nutzen es für Vorher/Nachher. Hinweis:
  Wohnhäuser nur bis Stufe 3 direkt setzen, Stufe 4 erzeugt einen unladbaren Stand.
- Die Schätzungen in Tools enthalten Engineer, Review und Playtest und sind nach H-R11/H-R12 bewusst hoch.
- **Ohne Nutzer-Zwischenstände (R281):** Es gibt keine „Bitte testen"-Pausen. Die Bildurteile fällt lead-art an der
  Galerie, dazu kommen Review je Task, Browser-Check (qa-playtester) und das opus-Review je Release. Release B
  startet ohne Wartezeit, sobald seine Abhängigkeiten auf main gemergt sind.
- **Fallback statt Rückfrage:** Reisst ein Häppchen nach 2 Bild-Fix-Runden die Kriterien, fliegt es aus dem
  Kandidaten (R211-Muster) und kommt mit Befund ins nächste Release. Das Release wartet nicht darauf.

### 6.1 Release A „Gewachsene Insel" (4 Häppchen)

**L1 Wald organisch** — Bildziel 2.1 (1)–(6), Katalog B1, B3, B4, B5 und Waldtyp (§3.7). Dateien: W `trees.ts`
(Kronenform, Feld-Platzierung, Bestände, Rand/Kern), W `terrain.ts` nur Waldzweig (Waldboden-Hof folgt den Kronen,
Lichtungs-Boden B2), W `tools/render-qa/galerie.mjs` (neu), Tests `tests/render/trees*.test.ts`. L `iso.ts`
(`treeVariant`, `TREE_VARIANTS` darf L1 ändern; die Sammlung in `sortedObjects` bleibt ein Stempel je Kachel).
Risiko: Lesbarkeit Wald gegen Wiese; Überhang an Gebäuden (R3). Schätzung **170 Tools**.

**L2 Gebirgsfuss weich, Schnee und Bergbäume** — Bildziel 2.2 (1)–(6), Katalog C2, C3, C4, C5, C11 (C11 nur als
Bodenton am Fuss). Dateien: W `massif.ts` (Profil am Fuss, Kontrast nach Höhe, Bewuchs, Schnee), W `rocks.ts`
(Rasterung Schnee und Krüppelbäume, Sockel ohne Pixelrauschen), W `light.ts` (nur `DEBRIS` wärmer), W `terrain.ts`
nur Schuttzweig (`SCREE_*`), Tests `massif`, `light`, `terrainFoothills`. Risiko: Die Referenz leidet; der Pixeldiff
im Kern ist Pflicht. `buildMs` am Massiv messen. Schätzung **170 Tools**.

**L3 Weiche Gebäudekanten** — Bildziel 2.3 (1)–(6). Dateien: W `sprites.ts` (`poly` mit Silhouette statt Strich je
Fläche, Lichtkante, Hand-Linie, Kontaktschatten, Hofplatten-Rand), W `material.ts` (Pinselkorn), Tests `sprites*`,
`spriteCache`, `picking`, `verdeckung`. Blindtest mit Rater (Probenblatt 15). Risiko: Typ-Erkennung und
Signal-Lesbarkeit; Mehrkosten beim Cache-Aufbau. Schätzung **150 Tools**.

**L4 Deko-Fundament und Wiese** — Platzierungskern für alle Gruppen: Eignung, Seltenheitsbudget, Salze 500–599,
R3/R4/R5/R6 als reine Funktionen; Deko-Stempel-Cache. Dazu die Boden-Elemente der Gruppe A (A1–A4, A7, A8, A10–A13)
und B6–B8 sowie die Stempel A5, A6, A9, A14. Dateien: neu `src/render/decor.ts` (reine Platzierung), neu
`src/render/decorStamps.ts` (Zeichner und Cache), W `groundDecor.ts`, W `terrain.ts` nur `paintDecor`, W `iso.ts`
(Stempel-Art `decor` in `sortedObjects`), W `renderer.ts` (Zeichnen im sortierten Durchgang), W `limits.ts`
(`DECOR_CACHE_MAX_BYTES`), Tests neu `tests/render/decor.test.ts`, `decorStamps.test.ts`. Risiko: `lastPatchMs`
(vorher messen), Sortierkosten. Schätzung **190 Tools**.

**Reihenfolge und Parallelität:** L1, L2 und L3 laufen parallel, ihre Dateien sind disjunkt bis auf `terrain.ts`.
Dort hat L1 den Waldzweig, L2 den Schuttzweig; beide erst nach dem Review von L1 andocken (Konfliktregel 2, E-028).
L4 startet nach dem Merge von L1, weil es `iso.ts`/`terrain.ts` mitbenutzt; der reine Kern `decor.ts` mit Tests
darf vorher parallel beginnen. Release-Gate: Galerie vorher/nachher, A/B-Perf, Blindtest Häuser (L3).
Sobald L1 gemergt ist, beginnen L4 und danach L5 (Kern `decor.ts`) ohne Pause, auch wenn Release A noch läuft.

### 6.2 Release B „Etwas zu entdecken" (4 Häppchen)

**L5 Küste und Meer** — D1–D6, D9, D11, E1, E2, E3, E6, E8; Palmen- und Küstenvariante. Dateien: W `decorStamps.ts`
(Palmen, Wrack, Felsen, Eiland), W `groundDecor.ts` (Strand), W `terrain.ts` nur Wasser- und Sandzweig (Sandbank,
Riff, Tang), W `water.ts` (Schaum an Riff, Wrack und Felsen), W `decor.ts` (Meerregeln R4), Tests `decor`, `water`.
Risiko: Lesbarkeit der Schifffahrt (R4), Fernansicht. Schätzung **170 Tools**.

**L6 Gebirge und Wald entdecken** — B2 (Stempelteil), C6, C7 (statischer Teil), C8, C9. Dateien: W `massif.ts`,
`rocks.ts` (Bergsee, Höhle, Steinmännchen, Wasserfall-Rinne), W `trees.ts` (Lichtung), Tests `massif`, `trees`.
Abhängigkeit: nach dem Merge von L1 und L2. Schätzung **130 Tools**.

**L7 Tierleben an Land und auf See** — A15–A17, B9–B11, C1, C7 (Glitzern), C10, D7, D8, D10, E4, E5. Dateien: neu
`src/render/fauna.ts` (Posen rein, Zeichner dünn, Muster `wildlife.ts`), W `wildlife.ts` (nur Delfine E5), W
`limits.ts` (`CAPS`), W `renderer.ts` (Aufrufe), Tests neu `tests/render/fauna.test.ts`. Abhängigkeit: nach L4
(Eignung aus `decor.ts`), L5 (Felsen und Sandbank für E4/D10) und L2 (Massivhöhe für C1). Schätzung **180 Tools**.

**L8 Seltenheit und Inselcharakter** — Seltenheitsbudget §3.6 über alle Gruppen scharf stellen, Varianten §3.7
vollständig (Blütenpalette, Nachtmeer E7), Galerie über 10 Seeds mit Kontaktbogen. Optional, nur nach Gate-Entscheid:
Mouse-over-Namen für E- und S-Elemente über denselben Weg wie `wildlifeAt` (die UI liest nur). Dateien: W `decor.ts`,
`groundDecor.ts`, `water.ts` (E7), Tests `decor`. Schätzung **110 Tools**.

**Reihenfolge:** L5 und L6 parallel (disjunkte Dateien bis auf `decor.ts`, dort nur L5). Danach L7 und L8 parallel
(L8 fasst `renderer.ts` und `limits.ts` nicht an). L5 und L6 dürfen schon während des Release-Laufs A beginnen, wenn
L1, L2 und L4 auf ihrer Release-Branch reviewt sind; sie holen main nach dem Merge von A per Merge (Verfassung
§6.3).

**Warum nicht ein Release?** E-028 erlaubt höchstens 4 Häppchen je Release. Die 8 Häppchen lassen sich nicht auf
4 Sitzungen verdichten, ohne dass ein Häppchen über eine Session hinauswächst (L1 bis L4 liegen schon bei 150–190
Tools). Zwei Releases direkt hintereinander sind deshalb das Minimum.

### 6.3 Dateimatrix (wer schreibt, wer liest)

- `trees.ts`: schreibt L1, L6; liest L4, L7, L8
- `massif.ts` / `rocks.ts`: schreibt L2, L6; liest L4, L7
- `light.ts`: schreibt L2; liest L1, L3, L4, L5, L6, L7
- `sprites.ts` / `material.ts`: schreibt L3
- `terrain.ts`: schreibt L1 (Wald), L2 (Schutt), L4 (`paintDecor`), L5 (Wasser/Sand)
- `groundDecor.ts`: schreibt L4, L5, L8
- `decor.ts` (neu): schreibt L4, L5, L8; liest L6, L7
- `decorStamps.ts` (neu): schreibt L4, L5
- `fauna.ts` (neu): schreibt L7
- `iso.ts`: schreibt L1 (Varianten), L4
- `renderer.ts`: schreibt L4, L7
- `limits.ts`: schreibt L4, L7
- `water.ts` / `wildlife.ts`: schreibt L5 (water), L7 (wildlife), L8 (water)
- `tools/render-qa/galerie.mjs`: schreibt L1, L8; liest L2, L3, L4, L5, L6, L7

Summe der Schätzungen: Release A ≈ 680, Release B ≈ 590 Tools plus Lead-Steuerung.

## 7 Abnahmekriterien je Häppchen

Für alle gilt: Galerie vorher/nachher (Seeds 1/2/5/7, Motive aus §6.0) unter `.studio/qa/<häppchen>/`, A/B-Perf
nach §5, `make check` grün, keine Datei unter `src/sim/` oder `tests/sim/` geändert (Diff-Prüfung), Balancing-Test
unberührt grün.

**L1 Wald**

- Vitest: Kronenlage aus einem Feld. Entlang eines geraden Waldrands von 10 Kacheln streut der Abstand der äussersten
  Krone zur Kachelkante mit Standardabweichung ≥ 0,12 Kachel (heute ≈ 0,02). Benachbarte Waldkacheln haben in
  ≥ 90 % der Paare verschiedene Stempel.
- Vitest: Radien je Insel mit max/min ≥ 2,5; mittlerer Radius am Rand ≤ 0,8 × Kern. Bestände: Anteil der Nachbarpaare
  mit gleicher dominanter Art ≥ 0,65 (heute ≈ 0,4 bei Zufallsmischung).
- Vitest: Keine Krone ragt über eine Gebäude- oder Wegkachel (Fixture mit Gebäude am Waldrand).
- Vitest: gleicher Seed → identische Stempel; Waldtyp aus §3.7 je Seed stabil.
- Fake-Kontext: Keine Krone besteht nur aus einer `ellipse` bzw. nur aus einem Dreieckspfad (≥ 3 Lappen bzw. ≥ 3 Etagen).
- Bild: `s*-gesamt-z0.5` ohne Rautentreppe am Waldrand (Urteil lead-art; R281: kein Nutzer-Zwischenstand); Wald bei Zoom 1 dunkler als
  Wiese (mittlere Luminanz im festen Ausschnitt).
- Perf: `renderMedian` ≤ +0,2 ms; Baum-Cache ≤ 24 × 7 Einträge.

**L2 Gebirgsfuss**

- Pixeldiff gegen main im Kern (hn ≥ 0,35, ohne Schnee- und Baummaske): mittleres ΔE < 1 (Test in `massif.test.ts`
  über `shadeColor`, dazu Bild).
- Vitest: Randabstand, bei dem der Körper 24 % der Amplitude erreicht, ≥ 1,8 Kacheln (heute 1,1). Tonumfang für
  hn < 0,2 ≤ 3 Stufen.
- Vitest: Schnee nur bei Amplitude ≥ 90 px; Anteil 2–8 % der Massivknoten; Schneeton nie heller als `foam`.
  Krüppelbäume 3–20 je grossem Massiv, nur in Bewuchs- bzw. Rinnenlage.
- Bild: In `s*-gebirgsfuss-z1` kein grauer Hof; Farbabstand Fussband ↔ Wiese 1 Kachel davor ΔE2000 ≤ 15. In
  `-z2` kein Pixelrauschen am Sockel.
- Perf: `buildMs` am Massiv ≤ +30 %; `MASSIF_CACHE_MAX_BYTES` unverändert.

**L3 Gebäudekanten**

- Fake-Kontext: Je Körper gibt es höchstens einen Kontur-Strich (Silhouette), keine Striche auf Innenkanten. Bei
  Zoom ≤ 0,5 gar keinen Strich. Linienbreite ≤ 0,75 bei Zoom 1.
- Vitest: Lichtkante vorhanden und wärmer als die Fläche (Blauanteil kleiner). Hand-Linie ≤ 0,8 px, deterministisch
  je Variante.
- Vitest: Picking-Polygone und `bodyHull` bytegleich zu main (`picking`, `verdeckung`).
- Sprite-Cache: gleiche Flächengrössen und Eintragszahl (`spriteCache.test.ts`); Sichtvergleich gecacht und
  ungecacht weiter innerhalb der H-R7-Schranken (`sichtvergleich.mjs`).
- Blindtest Probenblatt 15 nicht schlechter als der H-R10-Endstand; Status-Signale unverändert lesbar.

**L4 Deko-Fundament und Wiese**

- Vitest: `decor.ts` deterministisch (gleicher Seed → gleiche Liste); Seeds 1–50 → mindestens 2 verschiedene
  Ausprägungen je Variante.
- Vitest: Keine Deko auf Gebäude- oder Wegkacheln; kein Stempel auf (+x, +y, +x+y) vor Gebäuden; nach Abriss
  identische Rückkehr.
- Vitest: Salze nur 500–599; alle Farben ΔE2000 ≥ 20 zu den Signalfarben.
- Vitest: Dichte R6 (≤ 1 Stempel je 6 Landkacheln, ≤ 300 je Insel); Boden-Deko ändert die Tonstufe einer Kachel um
  ≤ 1.
- Perf: `lastPatchMs` ≤ +30 % (Bau und Abriss auf Seed 7), `buildMs` ≤ +30 %, Deko-Cache ≤ 8 MiB.

**L5 Küste und Meer**

- Vitest über Seeds 1–200: Kein Meer-Element < 3 Kacheln von einer Lane, < 4 Kacheln von Anker oder Kontor, keines im
  Anfahrtskegel. Wrack in 25–55 % der Seeds, nie zweimal.
- Vitest: `shipAt` liefert über Wrack und Felsen nie einen Treffer.
- Bild: Fernansicht `z0.25` zeigt Wrack und Felsen, ohne dass sie als Schiff oder Insel gelesen werden (Urteil
  lead-art; Playtest-Frage „Was ist das?").
- Perf: wie §5.

**L6 Gebirge und Wald entdecken**

- Vitest: Bergsee nur in einer Mulde (Steilheit < 0,2, hn 0,4–0,7); Höhle und Steinmännchen höchstens je 1 je Karte.
- Pixeldiff im Kern ausserhalb der Elementmasken wie bei L2.
- Bild: die E-Elemente über 20 Seeds als Kontaktbogen.

**L7 Tierleben**

- Vitest: Posen deterministisch aus `timeMs` und Seed; Obergrenzen `CAPS` eingehalten, reduziert eingehalten; bei
  `LOD_ZOOM` keine Fauna; Hasen nie < 3 Kacheln von Weg oder Gebäude; Tiere an Phasen gebunden (Rehe nur morgens und
  abends, Glühwürmchen nur nachts).
- Fake-Kontext: keine Signalfarben, keine Linie in Schwarz.
- Perf: `renderMedian` ≤ +0,2 ms bei voller Fauna im Bild (Szene mit allen Arten).

**L8 Seltenheit**

- Vitest über Seeds 1–500: Jede Insel hat 3–6 S/E-Elemente. Keine Insel hat alle. Jedes E-Element liegt im
  Band seiner Quote ±10 Prozentpunkte. Ein Spieler mit 5 zufälligen Seeds sieht im Mittel ≥ 70 % des Katalogs
  (Simulation im Test).
- Bild: Kontaktbogen von 10 Seeds bei Zoom 0,5; zwei Inseln sehen erkennbar verschieden aus (Waldtyp, Blüten,
  Küste).

## 8 Nicht-Ziele

Keine Höhen oder Deko in Sim oder Save. Keine Änderung an Picking, Bauregeln, Holzertrag oder Schiffsrouten. Keine
fremden Assets: alles prozedural, ADR-006 unberührt. Kein Umbau des Massiv-Inneren über die Masken aus L2/L6 hinaus.
Keine Jahreszeiten, kein Ton (Tierlaute wären ein eigener Audio-Auftrag).

## 9 Entscheidungsbedarf am Gate

1. **Neue Caches** (§5): Baum-Varianten bis 24 und Deko-Stempel-Cache mit 8 MiB als bewusste Abweichung von Stilrahmen
   §5 „keine neuen Schlüssel". Empfehlung: annehmen, die Grenzen stehen in `limits.ts` und werden getestet.
2. **Mouse-over-Namen** für seltene Elemente (L8, optional). Empfehlung: zurückstellen, bis L5 bis L7 im Spiel sind;
   dann als kleines UI-Häppchen mit lead-tech.
3. **Felseiland E8**: Lesbarkeitsrisiko (wirkt wie Land). Empfehlung: im Katalog lassen, aber nur mit Playtest-Frage
   in L5; fällt es durch, wird es gestrichen.
4. **Zwei Releases à 4 Häppchen, direkt hintereinander** (E-028, R281). Empfehlung: Gate und Umsetzung beider
   Releases mit einer Budgetfreigabe. Release A startet sofort, Release B ohne Pause nach seinen Abhängigkeiten. Die
   Wald- und Gebirgssprache sichert das lead-art-Bildurteil an L1 und L2, bevor L5 bis L8 sie übernehmen; ein
   Nutzerurteil dazwischen ist nicht vorgesehen.
