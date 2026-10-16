# ORT-A «Wege und Kanten» (Spec, Release-Teil 1 von «Gewachsene Siedlung»)

Stand 2026-10-16 · Paket design-ORT-A · Autor: design-spec-author · Prozessstufe voll · Grundlage:
[Ortsrand-Brainstorming](2026-10-16-ortsrand-brainstorming.md) (Abschnitte 2.5, 3, 4, 6, 7), Ruling R688 (Zuschnitt in
zwei Releases, Vorentscheide O1–O10 angenommen) · Save: nein · `src/sim/`: nein · Balancing: nein · Strang: `render`

## 1 Ziel

Siedlungen gehen weich in die Natur über, statt hart am Raster zu enden. Weg und Wiese gehören zum selben Bild. Der
Spieler sieht um jedes Gebäude einen festgetretenen Hofsaum, der über die Rasterkante ausfranst. Wege haben keine
dunkle Konturlinie mehr, sondern einen abgetretenen Rand, Gras am Wegrain, Fahrspuren, Kiesel und auslaufende
Sackgassen. Hofplatte, Pflaster und Schlagschatten verlieren die Linealkante. Im offenen Land stehen hie und da ein
Pfosten oder ein Randstein am Weg.

**Nutzerentscheid N1 (verbindlich):** Nur Optik. Alles Neue liegt auf freien Nachbarfeldern oder auf der Wegkachel und
**weicht sofort** beim Bebauen, im ersten Frame nach der Aktion. Kein Save-Wechsel, kein Balancing, kein Platzverlust.
Der Welt-Zustand ändert sich nicht, deshalb gibt es **keine neue Save-Version** (`SAVE_VERSION` bleibt 16) und keine
Migration.

**Bezug R688:** Release-Teil 1 «Wege und Kanten» = ORT-1, ORT-K1, ORT-K2, ORT-3. Teil 2 «Hof und Anbauten» (ORT-B) =
ORT-2, ORT-4. ORT-5 bleibt Kann im Pool.

## 2 Umfang, Reihenfolge, Datei-Ownership

**Reihenfolge:** ORT-1 → ORT-K1 ∥ ORT-K2 → ORT-3 (nach ORT-K1). ORT-K1 und ORT-K2 schreiben in `sprites.ts` getrennte
Funktionen; bei Konflikt merged ORT-K1 zuerst.

- **ORT-1 Fundament, L (≈ 100 Tools):** B1-Analyse (freie Seiten, Besitzer, Ortsnähe, Nahdichte), Item-Pipeline
  (`decor`-Items mit Unterart, Zeichen-Registry, Requisiten-Cache mit Limit), D7, Salzblock, Referenzen; U1 Hofsaum.
  Schreibt `src/render/ortsrand.ts` (neu), `terrain.ts` (`occupancy`-Codes, Saum in `paintPixels`, Patch-Rand),
  `iso.ts` (`buildRest` holt Ortsrand-Items), `limits.ts`, Kopf `groundDecor.ts`/`decor.ts`,
  `tools/render-qa/galerie.mjs` (Motiv `ortsrand`). Läuft allein.
- **ORT-K1 Wegkante, L (≈ 140):** KS1 Weg ohne Konturstrich, KS2 Wegsaum mit W1 Wegrain, KS3 Abnutzung, W3 Wegenden.
  Schreibt `src/render/roadShape.ts` (neu), in `sprites.ts` nur `drawRoads`, in `terrain.ts` nur den Wegsaum-Aufruf in
  `paintPixels`/`paintDecor`, `tools/render-qa/hitch.mjs` (Wegmodus).
- **ORT-K2 Flächenkante, M (≈ 70):** KS4 Hofplatte organisch, KS5 Pflaster unregelmässig, KS8 weicher Schatten; KS0
  als Test. Schreibt in `sprites.ts` nur `raggedYard`, das Pflaster in `marketBody`/`kontorBody` und das Umfeld von
  `buildingShadow`; in `renderer.ts` nur Durchgang 5; in `trees.ts` nur das Umfeld von `treeShadow`.
- **ORT-3 Weg-Objekte, S (≈ 40):** W2 (Pfosten, Randstein, Steinhaufen, Wegkreuz, Bildstock, Meilenstein). Schreibt
  `src/render/roadside.ts` (neu) und den Registry-Eintrag in `ortsrand.ts`; liest `roadShape.ts` (Kantenlage).

Release-Abschluss (lead-qa, nach ORT-3): Release-AKs in Abschnitt 8.5, Stilrahmen-Nachführung S7.

### 2.1 Abgrenzung zu ORT-B und ORT-5

- **ORT-B «Hof und Anbauten»** (eigenes Release, eigene Spec): ORT-2 U2 Hofkram je Typ inklusive H1 Hafenkram und
  Ausblenden unter dem Bau-Geist; ORT-4 G1 Anbauten nach ADR-015 (Kern = Identität); Blindtest Typ-Erkennbarkeit A8b
  und A8c. ORT-A ändert weder `variants.ts` noch den Kern einer Silhouette noch den Katalog je Gebäudetyp. ADR-015
  betrifft ORT-A nicht.
- **Pipeline für ORT-B:** ORT-1 baut Item-Pipeline, Zeichen-Registry und Requisiten-Cache (`PROPS_CACHE_MAX_BYTES`
  = 4 MiB, O6) so, dass ORT-B sie nur befüllt (neue Datei plus Registry-Eintrag, kein Umbau der Pipeline). In ORT-A
  nutzt nur ORT-3 sie. ORT-1 prüft die Pipeline mit einer Test-Art, die nur in `tests/` registriert ist.
- **ORT-5 (Kann, nicht in ORT-A):** KS6 Feldkanten, KS7 Zäune, F1–F4, U3 Trampelpfade, H2 Pflaster franst aus.
  `plantationBody`, `sheepfarmBody`, `forest.ts` und die `tight`-Regel in `iso.ts` bleiben unberührt.

## 3 Grundregeln

### 3.1 Analyse B1 (`ortsrand.ts`, rein, ohne DOM)

Je Insel und `layoutKey` gecacht wie `restObjects` (`iso.ts:459`), im selben Aufruf fertig (nicht über mehrere Frames
verteilt wie der Wald).

1. **Freie Seiten** je Gebäude über die 8 Nachbarn jeder Randkachel: Gras, Wald, Sand, Wasser, Weg, belegt.
2. **Besitzer** jeder freien Kachel im Ring r = 1 (8er-Umfeld) um Gebäudekacheln. Bei mehreren Kandidaten gewinnt
   Kategorie `production` vor `public` und `infrastructure` vor `housing`, danach die kleinere Gebäude-Id.
3. **Ortsnähe** `n(x, y)` = Zahl der Gebäudekacheln im 7×7-Fenster (Chebyshev-Radius 3). Klassen: Kern n ≥ 6, Rand
   1–5, Land 0. Wege zählen nicht. Gilt für Items (W2) und den Weg-Pfad (KS3, W3); beides hängt am `layoutKey`, nicht
   am Terrain-Patch.
4. **Nahdichte** `d(x, y)` = Zahl belegter Kacheln (Gebäude oder Weg) im 8er-Umfeld. Klassen für alles **Gebackene**
   (U1, KS2, W1): Land d ≤ 2, Rand 3–4, Kern ≥ 5. Abweichung vom Brainstorming (dort Ortsnähe für alles), damit der
   Patch-Rand bei 2 bleibt (Ruling-Entwurf E2).
5. Alle Werte dieser Spec sind Render-Konstanten (keine Spielwerte): `ortsrand.ts`, `roadShape.ts`, `roadside.ts`
   bzw. `limits.ts`, nie `src/sim/defs/`. Der Balancing-Test ist nicht betroffen.

### 3.2 Zwei Schichten (B2) und Höhenregel (B3)

- **Boden, gebacken:** U1-Hofsaum und KS2-Wegsaum mischt `paintPixels` je Pixel (prüfbar über den
  `Uint8ClampedArray`-Puffer), Büschel und Blumen (W1) malt `paintDecor`. `occupancy` liefert Codes statt 0/1:
  0 frei, 1 Weg, 2 `housing`, 3 `public`/`infrastructure`, 4 `production`. Die Stufe eines Hauses ist nicht im Code,
  ein Stufenaufstieg löst also keinen Patch aus. `occ !== 0` bleibt «belegt».
- **Patch-Rand:** `dirtyRect(..., border)` mit `ORTSRAND_PATCH_BORDER = 2` (heute 1). Die gebackene Wirkung einer
  Belegungsänderung reicht höchstens 2 Kacheln weit.
- **Objekte:** W2 als `decor`-Item im sortierten Durchgang (`RANK decor`), gezeichnet aus dem Requisiten-Cache je Art,
  Variante und Zoomstufe. Jedes Item trägt Kachel, Art, Variante und Höhe `h` (Einheit `ISO_H`).
- **B3:** Auf den Vorderkacheln eines Gebäudes (+x, +y, +x+y, die `quiet`-Kacheln, `iso.ts:278–293`) liegt nur
  Flaches bis 0,15 `ISO_H`. Seiten- und Rückkacheln erlauben bis 0,5 Kerngebäude-Traufhöhe. Die Pipeline verwirft
  Verstösse, nicht der Zeichner.

### 3.3 Invariante D7 (wörtlich, Kopf `decor.ts` neben D1–D6)

> D7 Ortsrand: Ortsrand-Elemente hängen von der Belegung ab, aber nur lokal (r ≤ 3). Sie sind eine reine Funktion von
> (Seed, Kachel, Belegungsmuster, Gebäudetyp und -stufe), haben eigene Salze 600–619 und verändern weder Ort noch Los
> bestehender D1-Elemente und Stempel. Liegt auf einer Kachel ein S/E-Element oder ein Stempel, tritt der Ortsrand
> dort zurück.

Auslegung für ORT-A: Massgebend ist die **sichtbare** Menge nach D2 (ein vor einem Gebäude ausgeblendeter Stempel
sperrt nicht). Auf Fremdinseln gibt es keine Stempel (D4), dort sperren nur S/E-Elemente. «Zurücktreten» heisst: kein
W2-Item auf der Kachel, kein U1- und kein KS2-Saum auf der Kachel.

### 3.4 Salzblock 600–619 (Vorschlag, Ruling-Entwurf E4)

- **ORT-1:** 600–602 U1-Randrauschen (3 gedrehte Oktaven wie `woodField.ts`), 603 U1-Korn, 604 Reserve.
- **ORT-K1:** 605 KS1-Umrissrauschen, 606–607 KS2-Saumrauschen, 608 KS3-Gras-Einwüchse und Mittelstreifen, 609 KS3
  Fahrspuren, Kiesel und feuchte Senken (Argument unterscheidet), 610 W3-Auslauf.
- **ORT-K2:** 611 KS4-Hofrand, 612 KS5-Fugenversatz und Randsteine.
- **ORT-3:** 613 W2-Los je Kandidat, 614 W2-Art und -Variante.
- **ORT-B-Reserve:** 615–619 (Vorschlag: 615–616 ORT-2 Hofkram, 617–618 ORT-4 Anbauten, 619 frei).

Pflicht in ORT-1: Block samt Zuteilung im Salzregister im Kopf von `groundDecor.ts` eintragen. **Vorbedingung (O4):**
den Register-Befund aus `docs/beobachtungen.md` (2026-10-16) mitnehmen: `sprites.ts` `roadCenter`/Wegsteinchen nutzen
`hash2(seed + 61…65)`, `wildlife.ts` (Wal) `hash2(seed + 61…64)`; das Register nennt nur «61/62 in terrain.ts». Nach
ORT-1 nennt das Register alle drei Verwendungen. `roadCenter` (Salze 61/62) bleibt unverändert, die Wegachse wandert
nicht.

### 3.5 Fremdinseln (O5)

Ortsrand läuft auf jeder Insel mit Gebautem, auch auf Aussenposten mit `kontor2` (anders als Stempel, D4). Der Plan
prüft, wie `paintDecor` (heute `home(world)`) für die Ansicht einer Fremdinsel aufgerufen wird, und führt U1, KS2 und
W1 über denselben Weg.

### 3.6 Stilregel S7 «Eine Kantensprache» (Ergänzung zum Stilrahmen, KS0, O7)

Wortlaut zum Anhängen an Abschnitt 2 von `2026-10-04-stilrahmen.md` nach S6:

> **S7 Eine Kantensprache:** Flache Bodenflächen (Weg, Hofplatte, Pflaster, Saum, Feld) haben keinen Konturstrich und
> keine Gerade länger als 0,5 Kachel. Ihre Kante entsteht aus einem Feld mit Rauschen und 2 Tonstufen (S2). Körper
> (Wände, Dächer, Zäune, Kaimauern) bleiben geometrisch (S4), aber gebrochen. Signale (Hover, Bau-Vorschau,
> Pfad-Vorschau, Auswahl) bleiben scharf. Schlagschatten behalten ihre Form; ihre Kante ist weich. Prüfung: kein
> Strich in `earthEdge` in Bodenzeichnern, keine kollineare Strecke über 0,5 Kachel (Toleranz 0,01) in Boden-Umrissen,
> Helligkeitsprofil quer zur Kante ohne dunkles Minimum.

Den Stilrahmen selbst führt der Umsetzungsplan nach (AK-44), nicht diese Spec.

## 4 Regeln je Paket

### 4.1 ORT-1 U1 Hofsaum (Boden)

- Festgetretene Erde und abgewetztes Gras laufen vom Hof auf **freie** Nachbarkacheln des Besitzers hinaus.
  Reichweite ab Footprint-Kante nach Nahdichte: Land 0,5, Rand 0,35, Kern 0,15 Kachel; auf den Rückseiten (−x, −y)
  × 0,7. Randverwerfung ±0,06 Kachel aus 600–602.
- 2 Tonstufen nach S2 aus `earth` und `grass`; die innere Stufe ist eine Stufe dunkler als die Hofplatte (S4,
  Gebäudekante bleibt lesbar). Korn aus 603.
- Nie auf Wasser, Sand-Strand, Wald-Kacheln oder belegten Kacheln; zwischen zwei Gebäuden verschmelzen die Säume (ein
  Feld, keine Doppelkante). Büschel- und Blumen-Lose auf freien Kacheln bleiben gleich (U1 malt darunter).
- Weicht mit dem Patch, sobald die Kachel belegt wird; nach Abriss entsteht er aus dem Layout neu.

### 4.2 ORT-K1 Wegkante

- **KS1 Umriss:** `roadShape.ts` erzeugt je Insel und `layoutKey` die Weggeometrie als reine Punktlisten im Kachelraum
  (testbar ohne `Path2D`), gruppiert je Wegkachel. `drawRoads` baut daraus gecachte `Path2D` und füllt nur: erst Kern
  (`earth`), dann Randstufe (eine helle, abgetretene Tonstufe). **Kein Strich.** Abtastung alle 0,1 Kachel entlang
  der Segmente zwischen `roadCenter`-Punkten, Versatz halbe Breite plus Rauschen (Amplitude ≤ 0,04, Salz 605),
  Innenecken an Kreuzungen verrundet. Mittlere Gesamtbreite (Kern + Randstufe) 0,5 Kachel.
- **KS2 Wegsaum mit W1:** Saumfeld über die Wegmaske (`woodBlur` + Rauschen 606–607 + Höhenlinie) in `paintPixels`,
  0,1–0,2 Kachel über die Bandkante, Breite nach Nahdichte (Land 0,2, Rand 0,15, Kern 0,1). Der Saum liegt farblich
  näher am Gras als am Kern. **W1:** `paintDecor` behandelt Wegkacheln als halbfrei: Büschel und Blumen aus den
  bestehenden Losen (`tuftsFor` usw.) erscheinen nur mit Abstand ≥ 0,36 Kachel zur Bandachse; im Kern (Nahdichte)
  keine Deko auf Wegkacheln (wie heute).
- **KS3 Abnutzung** (ab Zoom 0,75, Dichte nach Ortsnähe, Kern 0): einzelne Grasbüschel über die Wegkante, ein
  unterbrochener Grasstreifen in der Mitte (Breite ≤ 0,04 Kachel), auf geraden Abschnitten zwei unterbrochene
  Fahrspuren, unregelmässige Kiesel (5–7 Ecken) statt Quadraten, statische feuchte Senken. Alles Teil des gecachten
  Pfads (je Farbe ein `Path2D`). Keine Abhängigkeit von Zeit oder Wetter.
- **W3 Wegenden:** Wegkachel mit genau einem Wegnachbarn und Ortsnähe Land/Rand: Vom Kachelmittelpunkt zur freien
  Kante verjüngt sich das Band von 0,5 auf ≤ 0,15 Kachel und läuft in Gras-Ton aus, innerhalb der eigenen Kachel. Im
  Kern bleibt die runde Kappe. Eine Einzelkachel ohne Nachbarn bleibt rund (mit Rauschrand).
- **Abhängigkeiten:** Der Umriss einer Wegkachel hängt nur von Wegkacheln im Umkreis 1 ab; KS3 und W3 zusätzlich von
  der Ortsnähe (r ≤ 3).

### 4.3 ORT-K2 Flächenkante

- **KS4:** Der Erdrand in `raggedYard` wird von Sägezahn zu einer weichen Rauschlinie (2 Oktaven, Kurven) mit einer
  inneren Tonstufe, Salz 611. Nur im Bildmodus-Zweig (`p.hand && !p.recording`). Eingaben bleiben die des
  Sprite-Schlüssels (keine Nachbarn).
- **KS5:** Pflaster von `marketBody` und `kontorBody` (`kontor`, `kontor2`): Fugen im Läuferverband versetzt und mit
  `sag` gebrochen, äussere Steinreihe als einzelne unregelmässige Steine, Kern des Platzes geschlossen. Nur im
  Bildmodus-Zweig. Die Kaimauer (Krone 0,14) bleibt gerade (Mauerwerk, S7).
- **KS8:** Halbschatten als zweite Füllung in Durchgang 5: Hülle um 0,06 Kachel erweitert, halbe Deckkraft, für
  Gebäude und Bäume gleich, alle Halbschatten in **einem** Pfad. Die Kernschatten-Polygone (`buildingShadow`,
  `treeShadow`) bleiben unverändert. Der Kernschatten wird im Bild nicht dunkler als auf `main` (Technik wählt der
  Plan, z. B. Clip auf das Komplement des Kerns). Schatten dürfen gerade Kanten behalten (S7).

### 4.4 ORT-3 W2 Weg-Objekte

- Kandidaten: Wegkacheln mit Ortsnähe Land oder Rand und mindestens einer Seitenkachel frei (Gras oder Wald). Lage am
  Rand der Randstufe auf der freien Seite (Kantenlage aus `roadShape.ts`), Abstand zur Bandachse ≥ 0,3 Kachel.
- Abstand ≥ `STAMP_SPACING` (3) Kacheln zwischen Details; höchstens 1 Detail je 4 Wegkacheln einer Insel. Los 613, Art
  und Variante 614. Arten: Holzpfosten, Randstein, Steinhaufen, Meilenstein; Wegkreuz und Bildstock nur an Abzweigungen
  oder Kurven.
- Grösse < 0,3 Kachel, kein Dach in Gebäudefarbe. Ein Detail weicht, wenn seine Seitenkachel belegt wird.

## 5 Datenmodell

Kein neues Welt- oder Save-Feld. Neue Render-Daten (nicht persistent, je `layoutKey` gecacht):

- `OrtsrandAnalysis` (`ortsrand.ts`): `owner: Int32Array`, `freeSides`, `naehe: Uint8Array` (n), `nahdichte:
Uint8Array` (d), `items: OrtsrandItem[]`.
- `OrtsrandItem`: `{ kind: 'decor', sub: string, x, y, variant, h }`; `h` in `ISO_H`.
- `RoadShape` (`roadShape.ts`): je Wegkachel `{ core: Pt[][], rim: Pt[][], wear: Pt[][], ruts: Pt[][], pebbles: Pt[][] }`
  im Kachelraum, dazu die Kantenlage für ORT-3.
- `limits.ts`: `PROPS_CACHE_MAX_BYTES = 4 * 1024 * 1024`, `CAPS.ortsrand = [800, 400]` (Startwert, Plan misst),
  `ORTSRAND_PATCH_BORDER = 2`.

## 6 Randfälle

- **Bau auf Saum- oder Item-Kachel:** Saum und Item verschwinden im ersten Frame mit dem neuen `layoutKey`.
- **Abriss:** Ausgabe ist wieder gleich wie vor dem Bau (reine Funktion des Layouts); keine Narben (X2).
- **Wegkachel neben Gebäude im Kern:** keine Deko, kein Gras im Weg, runde Kappe.
- **Kreuzung mit vier Ästen, Einzelkachel, Weg am Strand oder an der Küste:** Saum nie auf Wasser; Umriss verrundet.
- **Stufenaufstieg eines Hauses:** kein Patch, keine Änderung in ORT-A.
- **Stempel oder S/E-Element auf Saumkachel:** Ortsrand tritt zurück (D7).
- **Fremdinsel ohne Heimat-Stempel:** wie Heimat, nur S/E sperren.
- **Reduzierter Modus:** `cap('ortsrand', true)` halbiert; KS3 erst ab Zoom 0,75.
- **Alter Spielstand:** lädt unverändert (kein Save-Feld); Ortsrand entsteht beim Laden aus dem Layout.

## 7 Liste der bewusst geänderten Variante-0-Hashes (O8)

Befund (Spec-Prüfung): `variants.test.ts` H-R7 AK1 hasht `drawBody` (`hand = true`, Zoom 1). `raggedYard` läuft dort,
weil die Hauptaufzeichnung nicht im Aufzeichnungsmodus ist. Jede Silhouette ausser `monument` ruft `yard()` auf.

- **KS4 (ORT-K2):** alle 22 Typen ausser `monument`: kontor, kontor2, market, house1–house4, fisher, lumberjack,
  quarry, sheepfarm, weaver, canefarm, spicefarm, distillery, toolmaker, chapel, school, firestation, bathhouse,
  glassworks, townhall.
- **KS5 (ORT-K2):** kontor, kontor2, market (zusätzlich zu KS4).
- **KS8:** keine; Schatten zeichnet Durchgang 5 im Renderer, nicht `drawBody`.
- **KS6/KS7:** nicht in ORT-A (ORT-5).

Der Brainstorming-Vorbehalt «ob KS4 die Hashes berührt» ist damit entschieden: **ja, für alle 22**. Das braucht ein
Ruling (Entwurf E1). Fehlerrichtung, falls der Plan anders misst: Ändert sich ein Hash eines Typs, der nicht in
dieser Tabelle steht, ist das ein Fehler, nicht eine neue Ausnahme. `monument`, `hunter` und `cattlefarm` (letztere
nur Zweimal-Test) bleiben bytegleich.

## 8 Abnahmekriterien

Messarten: **V** = Vitest (`tests/render/`), **F** = Fake-Kontext-Aufzeichnung (`tests/render/fakeCtx.ts`), **H** =
Referenzhash, **P** = Leistungsmessung (`tools/render-qa/`), **B** = Browser-/Galerie-Prüfung mit Rater-Anweisung.
`main` heisst: Stand beim Abzweigen von ORT-1, festgehalten über AK-01.

### 8.1 ORT-1 Fundament und U1

- **AK-01 Referenzen vorab (H).** Erster Commit von ORT-1, vor jeder Änderung: Referenzhashes auf `main` festhalten
  für (a) `drawHover`, `drawGhost` (alle Typen), `drawPathPreview` und die Auswahl-Hervorhebung, (b) `drawBodyPlain`
  aller Typen und Stufen, (c) `groundElements` und `stampPlacements` für Seeds 1–50, (d) `spriteKey` für eine feste
  Eingabeliste, (e) `paintPixels` eines festen Rechtecks fern jeder Belegung (Seed 1), (f) den Kontrastwert Kern ↔
  Wiese nach der Messvorschrift von AK-24. Der Test ist auf `main` grün.
  Fehlende Exporte (z. B. `drawHover` ist privat) legt der Plan als reine Test-Exporte an.
- **AK-02 Salzregister (V).** Der Kopf von `groundDecor.ts` nennt den Block 600–619 mit der Zuteilung aus 3.4 und die
  Salze 61–65 in `sprites.ts` und `wildlife.ts`. Ein Test liest alle Literale `seed + N` in `ortsrand.ts`,
  `roadShape.ts`, `roadside.ts` und `raggedYard`/Pflaster und prüft: N liegt in 600–619 und steht im Register.
- **AK-03 D7 dokumentiert (V).** Der Kopf von `decor.ts` enthält D7 im Wortlaut von 3.3 (Text-Test).
- **AK-04 Analyse (V).** Tabellenfälle mit festen Layouts: Besitzer-Vorrang (production vor public/infrastructure vor
  housing, dann kleinere Id), Ortsnähe-Klassen an den Grenzen n = 0, 1, 5, 6, Nahdichte-Klassen an d = 2, 3, 4, 5.
- **AK-05 Determinismus (V).** Gleiche Welt zweimal aufgebaut: gleiche Analyse, Itemliste und `paintPixels`-Puffer.
  Unabhängig von Kamera, Zoom, Frame und `timeMs`. Kein `Math.random` in `ortsrand.ts` (Text-Test wie L1-T7).
- **AK-06 Sofortiges Weichen und Rückkehr (V).** Welt mit Gebäude und U1-Saum auf Kachel K: nach `placeRoad` bzw.
  `placeBuilding` auf K enthält der Puffer des Patch-Rechtecks auf K keinen Saumanteil, und der erste `render`-Aufruf
  mit neuem `layoutKey` liefert die neue Itemliste (keine mehrstufige Berechnung). Nach `demolish` sind Itemliste und
  Puffer bytegleich zum Zustand vor dem Bau.
- **AK-07 Lokalität (V).** Zufällige Layouts (Seeds 1–10, je 20 Änderungen): Analyse und Items ändern sich nur im
  Chebyshev-Radius ≤ 3 um die geänderten Kacheln; Bodenpixel nur im Radius ≤ `ORTSRAND_PATCH_BORDER` (2); `dirtyRect`
  wird mit diesem Rand aufgerufen.
- **AK-08 Bestand unberührt (H, V).** AK-01 (c) und (e) bleiben grün. Büschel- und Blumen-Lose auf freien
  Graskacheln sind gleich wie ohne Ortsrand (Vergleich mit leerer Analyse). Bestehende Terrain-Tests (u. a.
  `terrain.test.ts` AK-R1-06 mit angepasstem Rand-Argument) grün.
- **AK-09 D7-Zurücktreten (V).** Auf Kacheln mit sichtbarem Stempel oder S/E-Element: kein Saumanteil, kein Item.
- **AK-10 U1-Geometrie (V).** Gemessen im Puffer: Saumausdehnung ab Footprint-Kante je Klasse ≤ Reichweite + 0,06
  (Land 0,56, Rand 0,41, Kern 0,21 Kachel), Rückseite ≤ 0,7 × Reichweite + 0,06; Land > Rand > Kern im Mittel. Kein
  Saum auf Wasser, Wald, belegten Kacheln.
- **AK-11 Item-Pipeline (V).** Eine Test-Art (nur in `tests/` registriert) erscheint als `decor`-Item im sortierten
  Durchgang mit `RANK decor`; Ortsrand-Items sind nie in `buildingHulls`; ein Item mit `h` > 0,15 auf einer
  `quiet`-Kachel wird verworfen (B3).
- **AK-12 Requisiten-Cache (V).** `PROPS_CACHE_MAX_BYTES` = 4 MiB in `limits.ts`; LRU verdrängt bei Überschreitung
  (synthetischer Test); `DECOR_CACHE_MAX_BYTES`, `SPRITE_CACHE_MAX_BYTES`, `VARIANT_COUNT` unverändert.
- **AK-13 Caps (V).** `CAPS.ortsrand` existiert, ist je Insel eingehalten und im reduzierten Modus halbiert
  (`cap('ortsrand', true) = cap('ortsrand') / 2`).
- **AK-14 Fremdinsel (V).** Ein Layout auf einer Insel ≠ Heimat mit `kontor2` liefert Analyse und U1-Saum wie dasselbe
  Layout auf der Heimat (ohne Stempel).
- **AK-15 Farben (V).** Alle neuen Töne von U1: ΔE2000 ≥ 20 zu jeder Signalfarbe (`SIGNAL_NAMES`, `deltaE.ts`); keine
  Mischung mit `#000000`/`#ffffff` (S1).
- **AK-16 Galerie (B).** `galerie.mjs --motive ortsrand` erzeugt die Motive 01–10 der Bestandsaufnahme (Szenen aus
  `ortsrand.mjs`) bei Zoom 1 und 2, DPR 2. Prüfung: alle Dateien vorhanden, auf `main` und Branch mit derselben
  Kamera.
- **AK-17 Leistung ORT-1 (P).** `perf.mjs` A/B, Seed 7 und Siedlungs-Spielstand Seed 1 (Plan legt ihn als Fixture
  ab), 1920×1080, DPR 2, Zoom 1, 3 Läufe: `renderMedian` B − A ≤ +0,2 ms. `lastPatchMs` und `buildMs` werden
  berichtet (Grenzen in AK-48). `hitch.mjs` Hausbau: keine zusätzlichen Frames > 25 ms gegenüber A.

### 8.2 ORT-K1 Wegkante

- **AK-18 Kein Konturstrich (F).** `drawRoads` ruft kein `stroke` auf und setzt nie `strokeStyle` = `earthEdge`
  (A10). Kein `fillRect` (Kiesel sind Polygone, K15).
- **AK-19 Keine langen Geraden (V).** In allen Umriss-Polygonen von `RoadShape` (Kern, Randstufe) gibt es keine
  kollineare Strecke > 0,5 Kachel bei Toleranz 0,01 Kachel (A11). Testhelfer fehlt heute; Plan-Pflicht:
  `maxCollinearRun(poly, tol)` in einem Testhelfer unter `tests/render/`.
- **AK-20 Breite (V).** Auf geraden Abschnitten (Seeds 1–5, alle Wege der Siedlungs-Fixture) liegt die mittlere
  Gesamtbreite quer zur Achse bei 0,5 ± 0,03 Kachel; die Abweichung der Kante von der Sollkante ist ≤ 0,04 + 0,01.
- **AK-21 Kern-Deckung (V).** Im Streifen ±0,2 Kachel um die Achse liegen ≥ 85 % der Abtastpunkte (Raster 0,02) in
  Kern oder Randstufe und nicht in Gras-Einwuchs oder Mittelstreifen (A12). Plan-Pflicht: Punkt-in-Polygon-Helfer
  (wie `inPolyT` in `variants.test.ts`) gemeinsam nutzbar machen.
- **AK-22 Innenecken (V).** Im Umkreis 0,3 Kachel um jede Kreuzungsmitte ändert sich die Richtung zwischen zwei
  aufeinanderfolgenden Umrisskanten um höchstens 45° (keine V-Kerbe).
- **AK-23 Weggeometrie deterministisch und lokal (V).** Gleiche Welt: `RoadShape` bytegleich (A14). Eine neu gesetzte
  Wegkachel ändert die Teilstücke nur von Wegkacheln im Chebyshev-Radius ≤ 1; ein Gebäude ändert KS3/W3-Teile nur im
  Radius ≤ 3. `roadCenter` liefert für Seeds 1–50 dieselben Punkte wie `main`.
- **AK-24 Kontrast (V).** ΔE2000 zwischen Kernfarbe und dem Median der `paintPixels`-Pixel im Abstand 0,5–0,7 Kachel
  von der Achse (gerade Abschnitte, Seed 1) ist ≥ 90 % des Werts auf `main` (Wert in AK-01 mit festhalten). Der Saum
  (0,25–0,45 Kachel) liegt näher am Gras: ΔE(Saum, Kern) > ΔE(Saum, Wiese).
- **AK-25 W1 Wegrain (V).** Auf Wegkacheln mit Nahdichte Land/Rand malt `paintDecor` Büschel und Blumen, alle mit
  Abstand ≥ 0,36 Kachel zur Achse, und jedes Element entspricht einem Los von `tuftsFor` usw. derselben Kachel
  (gefiltert, nicht neu gewürfelt). Bei Nahdichte Kern: keine.
- **AK-26 KS2 weicht (V).** Saum hängt nur an der Wegmaske: Weg entfernen → Puffer im Patch-Rechteck bytegleich zum
  Zustand ohne Weg.
- **AK-27 KS3 (F, V).** Unter Zoom 0,75 keine Abnutzungs-Füllungen; bei Ortsnähe Kern keine Gras-Einwüchse; Ausgabe
  von `drawRoads` unabhängig von `timeMs` und Wetter (zwei Aufrufe mit verschiedenen Werten gleich aufgezeichnet).
  Mittelstreifen ≤ 0,04 Kachel breit.
- **AK-28 W3 (V).** Sackgasse im Land: Breite am Kachelrand ≤ 0,15, Kern reicht bis mindestens zur Kachelmitte, kein
  Teil ausserhalb der eigenen Kachel. Im Kern: runde Kappe wie heute (Breite 0,5 bis zum Ende ± 0,04).
- **AK-29 Farben (V).** Randstufe, Saum, Abnutzung: ΔE2000 ≥ 20 zu Signalfarben, keine Schwarz-/Weissmischung.
- **AK-30 Zeichenzeit `drawRoads` (P).** Messpunkt `roadStats.lastMs` (Plan-Pflicht, Dev-Statistik wie
  `terrainStats`): Median über 600 Frames, Seed 1 Siedlung, Zoom 1: B ≤ 1,05 × A (5 % Messrauschen, Ruling-Entwurf E3).
- **AK-31 Wegziehen (P).** `hitch.mjs` erhält einen Wegmodus (Plan-Pflicht, z. B. `--wege`: 12 Wegkacheln in
  Schritten ziehen). B zeigt keine zusätzlichen Frames > 25 ms gegenüber A (Seeds 7, 14).
- **AK-32 Leistung ORT-K1 (P).** wie AK-17, `renderMedian` B − A ≤ +0,2 ms.

### 8.3 ORT-K2 Flächenkante und KS0

- **AK-33 KS4 Kurven statt Zacken (V).** Im Hofrand-Polygon aus `raggedYard` (Bildmodus) ändert sich die Richtung
  zwischen aufeinanderfolgenden Kanten um höchstens 30° (der heutige Sägezahn liegt bei rund 80°); keine kollineare
  Strecke > 0,5 Kachel (Toleranz 0,01); zwei Füllungen (Rand, innere Stufe), kein `stroke` im Hofteil.
- **AK-34 Plain unverändert (H).** `drawBodyPlain` aller Typen und Stufen bytegleich zu AK-01 (b). Damit bleiben
  Picking-Geometrie (`bodyFaces`) und `drawGhost` unverändert.
- **AK-35 Hash-Änderung begrenzt (H).** H-R7 AK1 bekommt neue Referenzwerte nur für die Typen aus Abschnitt 7.
  Für alle Typen ausser kontor, kontor2, market ist die Aufzeichnung **nach** dem Hof-Abschnitt bytegleich zu `main`
  (Plan-Pflicht: Trennstelle über die Ereigniszahl einer Aufzeichnung von `yard` allein bestimmen).
- **AK-36 KS5 Pflaster (V, F).** Keine Fugenlinie und kein Pflasterrand mit kollinearer Strecke > 0,5 Kachel
  (Toleranz 0,01); Fugen benachbarter Reihen versetzt; Kaimauer-Quad von `kontorBody` unverändert (Ereignisse
  bytegleich, Plan bestimmt den Abschnitt).
- **AK-37 KS8 Schatten (V, F).** `buildingShadow` und `treeShadow` liefern dieselben Polygone wie `main` (RF-6b,
  AK-ISO-10 grün). Durchgang 5 zeichnet den Kernschatten wie `main` und genau eine zusätzliche Füllung für alle
  Halbschatten (ein Pfad, Deckkraft halb, Hülle +0,06 Kachel). Kernschatten wird nicht doppelt gedeckt (Plan wählt
  Technik, Test prüft sie in der Aufzeichnung).
- **AK-38 Regel KS0 als Test (V, F).** Ein Sammeltest über die flachen Bodenzeichner (`drawRoads`, `raggedYard`,
  Pflaster in `marketBody`/`kontorBody`): kein Strich in `earthEdge`, keine kollineare Strecke > 0,5 Kachel.
  Ausgenommen: Kaimauer, Gebäudekörper, Schatten (S7).
- **AK-39 Leistung ORT-K2 (P).** wie AK-17, `renderMedian` B − A ≤ +0,2 ms; AK7 (Sprite-Speicher) unverändert grün.

### 8.4 ORT-3 Weg-Objekte

- **AK-40 Platz und Dichte (V).** Seeds 1–20 plus Siedlungs-Fixture: Items nur auf Wegkacheln mit Ortsnähe Land/Rand
  und freier Seite, Abstand zur Achse ≥ 0,3, paarweiser Abstand ≥ 3 Kacheln, je Insel ≤ ⌊Wegkacheln / 4⌋. Wegkreuz
  und Bildstock nur an Kacheln mit ≥ 3 Wegnachbarn oder an Kurven.
- **AK-41 Weichen und Rückkehr (V).** Seitenkachel bebauen → Item weg im ersten Frame mit neuem `layoutKey`; nach
  `demolish` Itemliste gleich wie vorher. Lokalität r ≤ 3 (wie AK-07).
- **AK-42 Lesbarkeit (V).** Höhe ≤ 0,15 `ISO_H` auf `quiet`-Kacheln (B3); Bildgrösse jeder Art < 0,3 Kachel;
  Farben ΔE2000 ≥ 20 zu Signalfarben und ≥ 10 zu jeder Dachfarbe (`roof*`); Items nie in `buildingHulls`.
- **AK-43 Cache und Leistung (V, P).** Alle W2-Arten × Varianten × Zoomstufen bei Zoom 2 / DPR 2 ≤
  `PROPS_CACHE_MAX_BYTES` (Test wie AK7). `renderMedian` B − A ≤ +0,2 ms (wie AK-17).

### 8.5 Release (nach ORT-3)

- **AK-44 Stilrahmen (V).** `2026-10-04-stilrahmen.md` enthält S7 im Wortlaut von 3.6 (Text-Test oder Review-Check im
  Plan).
- **AK-45 Signale scharf, O10 (H, F).** `drawHover`, `drawGhost` (alle Typen), `drawPathPreview` und Auswahl sind
  bytegleich zu AK-01 (a) (A13).
- **AK-46 Picking (V).** `picking.test.ts`, `verdeckung.test.ts` AK-ISO-15, H-R7 AK3/AK4 grün; Wegpicking
  kachelbasiert unverändert.
- **AK-47 Cache-Schlüssel (V).** `spriteKey` bytegleich zu AK-01 (d); `VARIANT_COUNT`, `SPRITE_CACHE_MAX_BYTES`
  unverändert; H-R7 AK7 (Zoom 1 und Zoom 2 / DPR 2, Schranke 1,4) grün.
- **AK-48 Leistung Release (P).** `perf.mjs` main gegen Release-Stand wie AK-17: `renderMedian` ≤ +0,4 ms;
  `lastPatchMs` ≤ +30 %; `buildMs` ≤ +15 %.
- **AK-49 Kein Sim, kein Save (V).** Diff gegen `main` ohne Änderung in `src/sim/`; `SAVE_VERSION` = 16;
  `tests/sim/balance.test.ts` grün; `make check` grün.
- **AK-50 Helligkeitsprofil (B, A10).** Plan-Pflicht: Messskript `tools/render-qa/kantenprofil.mjs` (Name Vorschlag),
  Zoom 1, DPR 2, je 20 Querschnitte senkrecht zu Wegkante, Hofrand und Schattenrand in der Siedlungs-Fixture;
  Medianprofil in L*. Bestanden, wenn das Minimum ≥ min(L* Kern, L* Gras) − 2 ist (kein dunkles Konturminimum) und die
  Übergangsbreite 10 % → 90 % ≥ 3 Gerätepixel beträgt.
- **AK-51 Kanten-Galerie und Blindfrage (B, A15/A8a).** Ausschnitte vorher/nachher von Kreuzung (`04-weg-z2`), Hof
  (`03-holzfaeller-z2`), Markt (`10-markt-z1.5`), Siedlung (`07-siedlung-z1`) und Wohnhaus (`01-wohnhaus1-z2`).
  Rater-Anweisung: Zwei unabhängige Rater ohne Vorkenntnis bekommen je Motiv beide Bilder in zufälliger Reihenfolge
  ohne Beschriftung und beantworten (1) «Gehören Weg und Wiese zum selben Bild? ja/nein» je Bild, (2) «Welches Bild
  wirkt gewachsen statt platziert?» je Paar. Bestanden: Jeder Rater wählt in ≥ 4 von 5 Paaren das Nachher-Bild und
  sagt bei ≥ 4 von 5 Nachher-Bildern «ja».
- **AK-52 Anbindung lesbar (B, A12).** Dieselben Rater markieren im Nachher-Bild `07-siedlung-z1` und `04-weg-z1`
  jede Wegverbindung zum Kontor bzw. jedes Wegende. Bestanden: 100 % richtig bei beiden.
- **AK-53 Fremdinsel (B, A9).** Ein Aussenkontor mit 6 Wegkacheln und einem Gebäude auf einer Fremdinsel zeigt bei
  Zoom 1 Hofsaum, weichen Weg und Wegrain wie auf der Heimat (Bildpaar Heimat/Fremdinsel, ein Rater bestätigt).

## 9 Herkunft

| AK                         | Abnahme-Idee (Brainstorming 6) |
| -------------------------- | ------------------------------ |
| AK-05, AK-23               | A1, A14                        |
| AK-06, AK-26, AK-41        | A2                             |
| AK-07, AK-23               | A3, A14                        |
| AK-01, AK-08, AK-34, AK-35 | A4                             |
| AK-13, AK-17, AK-32 ff.    | A5                             |
| AK-12, AK-43, AK-47        | A6                             |
| AK-11, AK-15, AK-42, AK-46 | A7                             |
| AK-16, AK-51               | A8 (nur a; b und c in ORT-B)   |
| AK-14, AK-53               | A9                             |
| AK-18, AK-50               | A10                            |
| AK-19, AK-33, AK-36, AK-38 | A11                            |
| AK-20, AK-21, AK-24, AK-52 | A12                            |
| AK-45                      | A13 (O10)                      |
| AK-30, AK-31               | A14                            |
| AK-51                      | A15                            |
| AK-02, AK-03, AK-09        | D7, O4                         |
| AK-44                      | O7 (S7)                        |

## 10 Nicht-Ziele

Kein Save-Feld, keine Änderung in `src/sim/`, kein Balancing, kein neuer Spielwert. Keine wassergefüllten Pfützen
(wetterabhängig), keine Abrissnarben (bräuchten ein Save-Feld). Kein Hofkram, keine Anbauten, keine Änderung an
`variants.ts` (ORT-B). Keine Feld-, Zaun- oder Waldkanten (ORT-5). Keine fremden Assets (ADR-006), keine
Laufzeit-Abhängigkeit, kein neuer Schlüssel im Gebäude-Sprite-Cache.

## 11 Risiken

- **Patch-Zeit (hoch):** Der Rand 2 statt 1 vergrössert das Patch-Rechteck eines 2×2-Baus von 16 auf 36 Kacheln.
  Bestimmt die Pixelarbeit `lastPatchMs`, reicht +30 % (AK-48) womöglich nicht. Gegenmittel im Plan: Grundpixel nur im
  Rand-1-Bereich neu rechnen und im äusseren Ring nur den Saum neu mischen; sonst Ruling-Entwurf E6.
- **Hash-Breite KS4:** 22 Referenzhashes ändern sich; ein echter Fehler im selben Commit fiele nicht auf. Gegenmittel
  AK-34 und AK-35.
- **Weg-Lesbarkeit:** Zu viel Gras im Weg wirkt wie «unterbrochen». Gegenmittel AK-21, AK-27, AK-52.
- **Merge-Punkt `sprites.ts`:** ORT-K1 und ORT-K2 in getrennten Funktionen; ORT-K1 merged zuerst.
- **Kernschatten-Doppeldeckung (KS8):** Technik offen, AK-37 prüft.

## 12 Offene Punkte (Ruling-Entwürfe an L0)

- **E1 O8 erweitern:** KS4 ändert die AK1-Hashes aller 22 Typen mit Hof, nicht nur der Pflaster-Typen. Empfehlung:
  annehmen, mit AK-34 und AK-35 als Schutz; neue Hashes setzt ORT-K2 in einem eigenen Commit.
- **E2 Boden-Gradient über Nahdichte (r = 1) statt Ortsnähe (r = 3):** hält den Patch-Rand bei 2. Empfehlung:
  annehmen; Ortsnähe bleibt für Items und Weg-Pfad.
- **E3 Toleranz 5 % für AK-30:** «nicht teurer als main» ist ohne Rauschgrenze nicht entscheidbar. Empfehlung: 5 %.
- **E4 Salzzuteilung 600–619** nach 3.4 mit Reserve 615–619 für ORT-B. ORT-5 bekommt bei Einplanung einen eigenen
  Block (Vorschlag 620–629). Empfehlung: annehmen.
- **E5 Rater:** zwei getrennte `qa-playtester`-Läufe ohne gemeinsamen Kontext. Empfehlung: annehmen.
- **E6 Fallback Patch-Budget:** Verfehlt ORT-1 trotz Gegenmittel `lastPatchMs` ≤ +30 %, entscheidet L0 zwischen
  Rand 1 mit Saumreichweite ≤ 0,35 Kachel und einer höheren Grenze. Empfehlung: erst messen (AK-17).
