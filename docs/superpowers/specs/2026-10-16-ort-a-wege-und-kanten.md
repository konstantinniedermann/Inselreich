# ORT-A «Wege und Kanten» (Spec, Release-Teil 1 von «Gewachsene Siedlung»)

Stand 2026-10-16 · Paket design-ORT-A · Autor: design-spec-author · Prozessstufe voll · Grundlage:
[Ortsrand-Brainstorming](2026-10-16-ortsrand-brainstorming.md) (Abschnitte 2.5, 3, 4, 6, 7), Ruling R688 (Zuschnitt in
zwei Releases, Vorentscheide O1–O10 angenommen) · Save: nein · `src/sim/`: nein · Balancing: nein · Strang: `render`

## 1 Ziel

Siedlungen gehen weich in die Natur über, statt hart am Raster zu enden; Weg und Wiese gehören zum selben Bild. Um
jedes Gebäude franst ein Hofsaum über die Rasterkante aus. Wege haben statt einer Konturlinie einen abgetretenen Rand,
Wegrain, Fahrspuren, Kiesel und auslaufende Sackgassen. Hofplatte, Pflaster und Schatten verlieren die Linealkante.
Im offenen Land stehen hie und da Pfosten oder Randsteine.

**Nutzerentscheid N1 (verbindlich):** Nur Optik. Alles Neue liegt auf freien Nachbarfeldern oder auf der Wegkachel und
**weicht sofort** beim Bebauen, im ersten Frame nach der Aktion. Kein Save-Wechsel, kein Balancing, kein Platzverlust.
Der Welt-Zustand ändert sich nicht, deshalb gibt es **keine neue Save-Version** (`SAVE_VERSION` bleibt auf dem Stand
des Abzweigs von ORT-1) und keine Migration.

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
  der Segmente zwischen `roadCenter`-Punkten, Versatz halbe Breite plus Rauschen (Amplitude 0,02–0,04, Wellenlänge 0,6–1,0 Kachel, Salz 605),
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

**Regel Bildmodus:** KS4 und KS5 wirken **nur im Bildmodus-Zweig** (`p.hand && !p.recording`). Der Plain-Zweig
(`drawBodyPlain`: Picking über `bodyFaces`, Bau-Geist `drawGhost`, Referenztests in `variants.test.ts`) zeichnet
weiterhin die gerade Platte und beim Markt die durchgehenden Gitterfugen (`p.line`).

- **KS4:** Der Erdrand in `raggedYard` wird von Sägezahn zu einer weichen Rauschlinie (2 Oktaven, Kurven) mit einer
  inneren Tonstufe, Salz 611. Nur im Bildmodus-Zweig (`p.hand && !p.recording`). Eingaben bleiben die des
  Sprite-Schlüssels (keine Nachbarn).
- **KS5:** Pflaster von `marketBody` und `kontorBody` (`kontor`, `kontor2`): Fugen im Läuferverband versetzt und mit
  `sag` gebrochen, äussere Steinreihe als einzelne unregelmässige Steine, Kern des Platzes geschlossen. Nur im
  Bildmodus-Zweig; die heutigen Fugen in `marketBody` sind nicht hand-gesteuert, der Plain-Zweig behält sie
  unverändert. Die Kaimauer (Krone 0,14) bleibt gerade (Mauerwerk, S7).
- **KS8 (Technik festgelegt):** Durchgang 5 füllt zwei Pfade mit derselben Schattenfarbe. (1) **Halbschatten-Pfad**:
  Hüllen von Gebäuden und Bäumen um 0,06 Kachel erweitert, alle übrigen Schattenpolygone (Deko, Läufer, Schiffe,
  Möwen) unerweitert, eine Füllung mit Deckkraft `a/2` (nonzero, also Vereinigung). (2) **Kernschatten-Pfad**: alle
  Polygone wie auf A, eine Füllung mit `a' = (a/2) / (1 − a/2)`. Weil jede erweiterte Hülle ihren Kern enthält, liegt
  jeder Kernpixel genau einmal unter (1) und einmal unter (2): zusammen `1 − (1 − a/2)(1 − a') = a`, wie auf A.
  Halbschatten allein ergibt `a/2`. Überlappungen dunkeln nicht doppelt, weil beide Pfade Vereinigungen sind.
  Begründung: zwei Füllungen ohne Clip, ohne Offscreen-Fläche und ohne Polygon-Differenz; exakt bei gleicher Farbe.
  `buildingShadow` und `treeShadow` bleiben unverändert. Schatten dürfen gerade Kanten behalten (S7).

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
- `RoadShape` (`roadShape.ts`): je Wegkachel `{ core, rim, wear, ruts, pebbles }` als `Pt[][]` im Kachelraum, dazu
  `edges: Pt[][]` = zusammengesetzte Kantenzüge (linker und rechter Rand) je zusammenhängendem Wegzug, auch für die
  Kantenlage von ORT-3.
- `limits.ts`: `PROPS_CACHE_MAX_BYTES = 4 * 1024 * 1024`, `CAPS.ortsrand = [800, 400]` (Startwert, Plan misst),
  `ORTSRAND_PATCH_BORDER = 2`.
- Farbrezepte (U1-Stufen, Randstufe, Saum, Abnutzung, W2) als exportierte Konstanten der jeweiligen Datei.

## 6 Randfälle

- **Bau auf Saum- oder Item-Kachel:** Saum und Item verschwinden im ersten Frame mit dem neuen `layoutKey` (AK-06,
  AK-41). **Abriss:** Ausgabe wieder wie vor dem Bau; keine Narben (X2).
- **Wegkachel im Kern:** keine Deko, keine Gras-Einwüchse, runde Kappe.
- **Strand und Küste:** kein Saum auf Wasser; auf Sand kein U1, KS2 nur als Erdton ohne Grasanteil (AK-56).
- **Einzelkachel ohne Wegnachbarn:** rund mit Rauschrand, keine Gerade > 0,5 (AK-57).
- **Leeres Layout, Insel ohne Wege:** kein Absturz, Ausgabe wie A (AK-55).
- **Stufenaufstieg eines Hauses:** kein Patch, keine Änderung.
- **Stempel oder S/E-Element:** Ortsrand tritt zurück (D7). **Fremdinsel:** wie Heimat, nur S/E sperren.
- **Zoom und reduzierter Modus (eine Regel):** KS3 zeichnet nur ab Zoom 0,75, in beiden Modi gleich. Der reduzierte
  Modus halbiert nur `CAPS.ortsrand` (W2-Items).
- **Speichern und Laden, alter Spielstand:** kein Save-Feld; nach dem Laden entsteht alles gleich aus dem Layout
  (AK-54).

## 7 Liste der bewusst geänderten Variante-0-Hashes (O8)

**In ORT-A ändert sich kein H-R7-AK1-Hash; die Liste ist leer.** Beleg: `variants.test.ts` importiert
`drawBodyPlain as drawBody` und hasht den Plain-Zweig (`hand = false`). `yard()` geht nur bei `p.hand && !p.recording`
in `raggedYard`; KS4 und KS5 wirken nach 4.3 nur dort. KS8 ändert keinen (Durchgang 5 im Renderer). KS6/KS7 (Feld,
Zaun) gehören zu ORT-5. **Fehlerrichtung:** Jede Änderung eines AK1-Hashes in ORT-A ist ein Fehler, keine Ausnahme.
Schutz des Bildmodus: AK-01 (g), AK-35.

## 8 Abnahmekriterien

Messarten: **V** = Vitest (`tests/render/`), **F** = Fake-Kontext-Aufzeichnung (`tests/render/fakeCtx.ts`), **H** =
Referenzhash, **P** = automatische Messung (`tools/render-qa/`), **B** = Bildprüfung mit Rater-Anweisung.

**Basisstand A** = der Abzweig-Commit von ORT-1 (Hash steht im Kopf des AK-01-Tests und im Plan). Jedes «wie A» meint
diesen Commit, auch für spätere Pakete.

**Messprotokoll P (gilt für AK-17, -31, -32, -39, -43, -48):** `perf.mjs --a A --b B --runs 3`, abwechselnd A/B wie
AK-E1-14; Kennzahl ist, wie `perf.mjs` rechnet, Median(B) − Median(A) der `renderMedian`-Werte. Seeds 7 und 14 plus
Siedlungs-Fixture (`--save`), 1920×1080, DPR 2, Zoom 1, `--focus home`. Hitch: `hitch.mjs --a A --b B` mit denselben
Seeds und der Fixture; bestanden, wenn Σ`over25`(B) ≤ Σ`over25`(A) + Σ`over25` eines Kontrolllaufs `--ohne-bau` auf A.

### 8.0 Vorarbeiten (Plan-Pflichten, eigene Test-Tasks in ORT-1, sofern nicht anders genannt)

- **V1 FakeCtx mit `Path2D`:** `fakeCtx.ts` stellt ein aufzeichnendes `Path2D` bereit und zeichnet `fill(path)` und
  `stroke(path)` mit Punktlisten und Farbe je Füllung auf. AK-18, -27, -37, -38 stützen sich darauf.
- **V2 Messpunkt `drawRoads`:** Umhüllung von `drawRoads` im Seitenkontext (`roadStats`, Summe der Zeichenzeit) als
  eigener Commit, der auf A **und** B angewendet wird (A per Cherry-Pick in einen Messzweig, kein Rebase).
- **V3 `hitch.mjs`:** `--save` (Fixture), Wegmodus `--wege` (12 Wegkacheln schrittweise) und Ausgabe von
  `terrainStats.lastPatchMs` je Bau.
- **V4 Galerie:** Szenen von `ortsrand.mjs` nach `tools/render-qa/` versionieren; Tageszeit, Läufer, Wolken und Wetter
  für A/B-Bilder und AK-50 einfrieren; Kamera und Seed je Bild in einer Begleitdatei.
- **V5 `kantenprofil.mjs`:** misst in der Seite über `getImageData` (keine Dependency) die Profile von AK-50.
- **V6 Testhelfer:** `maxCollinearRun(poly, tol)`, Punkt-in-Polygon (aus `variants.test.ts` herausgelöst),
  Spy/Marker auf `raggedYard` und Pflaster für die Trennstelle von AK-33/35 (im AK-01-Commit).
- **V7 Registrierungs-Haken** in `ortsrand.ts` (`registerProp`), über den Tests eine Test-Art eintragen.
- **V8 Fixture Fremdinsel** über `__inselDev` (Aussenkontor, 6 Wegkacheln, ein Gebäude), Bildschirm→Kachel-Abbildung
  für AK-52.

### 8.1 ORT-1 Fundament und U1

- **AK-01 Referenzen vorab (H).** Erster Commit von ORT-1, vor jeder Änderung, auf A festgehalten: (a) `drawHover`,
  `drawGhost` (alle Typen), `drawPathPreview`, Auswahl-Hervorhebung; (b) `drawBodyPlain` aller Typen und Stufen;
  (c) `groundElements` und `stampPlacements`, Seeds 1–50; (d) `spriteKey` für eine feste Eingabeliste;
  (e) `paintPixels` eines festen Rechtecks fern jeder Belegung (Seed 1); (f) Kontrastwert nach AK-24;
  (g) `drawBody` im Bildmodus (`hand = true`) aller Typen und Stufen, Zoom 1; (h) `roadCenter`, Seeds 1–50;
  (i) `buildingShadow`- und `treeShadow`-Polygone einer festen Szene; (j) Kaimauer-Ereignisse von `kontorBody` in
  Plain und Bildmodus; (k) Basisliste aller Salz-Literale `seed + N` in `src/render/` als Datei unter
  `tests/render/fixtures/`. Der Test ist auf A grün. Fehlende Exporte (z. B. `drawHover`) legt der Plan als reine
  Test-Exporte an.
- **AK-02 Salzregister (V).** Der Kopf von `groundDecor.ts` nennt Block 600–619 nach 3.4 und die Salze 61–65 in
  `sprites.ts` und `wildlife.ts`. Ein Test vergleicht alle Literale `seed + N` in `src/render/` mit AK-01 (k): Jedes
  **neue** Literal liegt in 600–619 und steht im Register. Bestehende Salze bleiben, sofern KS4 sie nicht ersetzt.
- **AK-03 D7 dokumentiert (V).** Der Kopf von `decor.ts` enthält D7 im Wortlaut von 3.3 (Text-Test).
- **AK-04 Analyse (V).** Feste Layouts: Besitzer-Vorrang (production vor public/infrastructure vor housing, dann
  kleinere Id), Ortsnähe an n = 0, 1, 5, 6, Nahdichte an d = 2, 3, 4, 5.
- **AK-05 Determinismus (V).** Gleiche Welt zweimal: gleiche Analyse, Itemliste und `paintPixels`-Puffer, unabhängig
  von Kamera, Zoom, Frame und `timeMs`. Kein `Math.random` in den neuen Dateien (Text-Test wie L1-T7).
- **AK-06 Sofortiges Weichen und Rückkehr (V).** «Saumpixel» = Pixel, dessen Kanalwert vom Puffer bei leerer Analyse
  um mehr als 2 (von 255) abweicht. Welt mit Gebäude und Saum auf Kachel K: nach `placeRoad` bzw. `placeBuilding` auf
  K keine Saumpixel aus U1 auf K; der erste `render`-Aufruf mit neuem `layoutKey` liefert die neue Itemliste. Nach
  `demolish` sind Itemliste und Puffer bytegleich zum Zustand vor dem Bau.
- **AK-07 Lokalität (V).** Seeds 1–10, je 20 Änderungen, **jede einzeln gegen den Ausgangsstand**: Analyse und Items
  ändern sich nur im Chebyshev-Radius ≤ 3, Bodenpixel nur im Radius ≤ `ORTSRAND_PATCH_BORDER` (2); `dirtyRect` wird
  mit diesem Rand aufgerufen.
- **AK-08 Bestand unberührt (H, V).** AK-01 (c), (e), (h) grün. Büschel- und Blumen-Lose auf freien Graskacheln
  gleich wie bei leerer Analyse. Bestehende Terrain-Tests (u. a. AK-R1-06 mit angepasstem Rand-Argument) grün.
- **AK-09 D7-Zurücktreten (V).** Auf Kacheln mit sichtbarem Stempel oder S/E-Element: keine Saumpixel, kein Item.
- **AK-10 U1-Geometrie (V).** Saumpixel (Definition AK-06) je Klasse höchstens Reichweite + 0,06 ab Footprint-Kante
  (Land 0,56, Rand 0,41, Kern 0,21 Kachel), Rückseite ≤ 0,7 × Reichweite + 0,06; mittlere Ausdehnung Land > Rand >
  Kern. Keine Saumpixel auf Wasser, Wald, belegten Kacheln.
- **AK-11 Item-Pipeline (V).** Eine über V7 registrierte Test-Art erscheint als `decor`-Item mit `RANK decor` im
  sortierten Durchgang; Ortsrand-Items nie in `buildingHulls`; `h` > 0,15 auf einer `quiet`-Kachel wird verworfen.
- **AK-12 Requisiten-Cache (V).** `PROPS_CACHE_MAX_BYTES` = 4 MiB; LRU verdrängt bei Überschreitung (synthetisch);
  `DECOR_CACHE_MAX_BYTES`, `SPRITE_CACHE_MAX_BYTES`, `VARIANT_COUNT` wie A.
- **AK-13 Caps (V).** `CAPS.ortsrand` je Insel eingehalten, `cap('ortsrand', true) = cap('ortsrand') / 2`.
- **AK-14 Fremdinsel (V).** Dasselbe Layout auf Insel ≠ Heimat (mit `kontor2`) und auf der Heimat: gleiche Analyse
  und gleiche Saumpixel relativ zum Layout (ohne Stempel).
- **AK-15 Farben (V).** Test auf die exportierten Farbrezepte von U1: ΔE2000 ≥ 20 zu jeder Farbe in `SIGNAL_NAMES`
  (`deltaE.ts`); Quelltext-Test: keine Mischung mit `#000000`/`#ffffff` (S1).
- **AK-16 Galerie (P).** `galerie.mjs --motive ortsrand` erzeugt mit den versionierten Szenen (V4) die Motive 01–10
  bei Zoom 1 und 2, DPR 2, auf A und B mit gleicher Kamera und eingefrorener Zeit; alle Dateien vorhanden.
- **AK-17 Leistung ORT-1 (P).** Protokoll P: `renderMedian` B − A ≤ +0,2 ms; Hitch bestanden. `lastPatchMs` und
  `buildMs` werden berichtet; **Frühwarnung** bei `lastPatchMs` > +20 % (Abbruch erst nach AK-48 bzw. E6).
- **AK-54 Speichern und Laden (V).** Welt speichern, laden: Analyse, Items, `RoadShape` und `paintPixels`-Puffer
  bytegleich zur Welt vor dem Speichern.
- **AK-55 Leer (V).** Layout ohne Gebäude und Wege sowie eine Insel ohne Wege: kein Wurf, leere Analyse und Items,
  `paintPixels` bytegleich zu A.

### 8.2 ORT-K1 Wegkante

- **AK-18 Kein Konturstrich (F).** Mit V1: `drawRoads` zeichnet keinen Strich (weder `stroke()` noch `stroke(path)`)
  und setzt nie `strokeStyle` = `earthEdge`; kein `fillRect` (Kiesel sind Polygone).
- **AK-19 Keine langen Geraden (V).** Seeds 1–50: In allen Kantenzügen `edges` (je zusammenhängendem Wegzug) gibt es
  keine kollineare Strecke > 0,5 Kachel bei Toleranz 0,01. Konstruktionsregel: Randrauschen mit Amplitude 0,02–0,04
  und Wellenlänge 0,6–1,0 Kachel, damit keine Gerade entstehen kann.
- **AK-20 Breite (V).** Gerader Abschnitt = Wegkachel mit genau 2 gegenüberliegenden Wegnachbarn. Dort (Seeds 1–5 und
  Fixture) mittlere Gesamtbreite 0,5 ± 0,03 Kachel; Kantenabweichung von der Sollkante ≤ 0,05.
- **AK-21 Kern-Deckung (V).** Im Streifen ±0,2 Kachel um die Achse liegen ≥ 85 % der Abtastpunkte (Raster 0,02) im
  Weg. Fahrspuren und Kiesel zählen zum Weg, Gras-Einwüchse und Mittelstreifen nicht.
- **AK-22 Innenecken (V).** Seeds 1–50, Kantenzüge `edges`: Im Umkreis 0,3 Kachel um jede Kreuzungsmitte ändert sich
  die Richtung zwischen zwei aufeinanderfolgenden Kanten um höchstens 45°.
- **AK-23 Weggeometrie deterministisch und lokal (V).** `RoadShape` für dieselbe Welt bytegleich. Eine neue Wegkachel
  ändert nur Teilstücke von Wegkacheln im Chebyshev-Radius ≤ 1; ein Gebäude ändert KS3/W3-Teile nur im Radius ≤ 3.
  AK-01 (h) grün.
- **AK-24 Kontrast (V).** Gerade Abschnitte ohne Gebäude im Radius 2, Seed 1: ΔE2000 zwischen Kernfarbe und Median
  der `paintPixels`-Pixel 0,5–0,7 Kachel von der Achse ≥ 90 % von AK-01 (f). Saumfenster 0,30–0,45 Kachel:
  ΔE(Saum, Kern) > ΔE(Saum, Wiese).
- **AK-25 W1 Wegrain (V).** Auf Wegkacheln mit Nahdichte Land/Rand liegen alle Büschel und Blumen ≥ 0,36 Kachel von
  der Achse, und jedes entspricht einem Los von `tuftsFor` usw. derselben Kachel. Nahdichte Kern: keine.
- **AK-26 KS2 weicht (V).** Isolierter Weg (kein Gebäude im Radius 3): Weg entfernen → Patch-Puffer bytegleich zum
  Zustand ohne Weg.
- **AK-27 KS3 (F, V).** Mit V1: unter Zoom 0,75 keine Abnutzungs-Füllungen; bei Ortsnähe Kern keine Gras-Einwüchse;
  Aufzeichnung unabhängig von `timeMs` und Wetter (zwei Aufrufe gleich); Mittelstreifen ≤ 0,04 Kachel breit.
- **AK-28 W3 (V).** Sackgasse im Land: Breite am Kachelrand ≤ 0,15, Weg reicht bis mindestens zur Kachelmitte, nichts
  ausserhalb der eigenen Kachel. Im Kern runde Kappe (Breite 0,5 ± 0,04 bis zum Ende).
- **AK-29 Farben (V).** Rezepttest wie AK-15 für Randstufe, Saum und Abnutzung.
- **AK-30 Zeichenzeit `drawRoads` (P).** Mit V2: Summe der `drawRoads`-Zeit über 600 Frames, Fixture, Zoom 1, je
  Seite 3 Läufe abwechselnd; bestanden, wenn das Frame-Mittel B ≤ A + 0,15 ms.
- **AK-31 Wegziehen (P).** Mit V3 `--wege`, Hitch-Regel aus Protokoll P.
- **AK-32 Leistung ORT-K1 (P).** Protokoll P: `renderMedian` B − A ≤ +0,2 ms.
- **AK-56 Strand und Küste (V).** Weg an Sand und Wasser: keine Saumpixel auf Wasser; auf Sand kein U1 und KS2 ohne
  Grasanteil.
- **AK-57 Einzelkachel (V).** Weg ohne Nachbarn: Umriss geschlossen, Abstand zur Mitte 0,25 ± 0,05, keine kollineare
  Strecke > 0,5 (Toleranz 0,01).

### 8.3 ORT-K2 Flächenkante und KS0

- **AK-33 KS4 Kurven statt Zacken (V).** Hofrand-Polygon aus `raggedYard` im Bildmodus (Trennstelle wie AK-35):
  Richtungswechsel zwischen aufeinanderfolgenden Kanten ≤ 30° (Sägezahn heute rund 80°); keine kollineare Strecke >
  0,5 (Toleranz 0,01); zwei Füllungen (Rand, innere Stufe), kein Strich im Hofteil.
- **AK-34 Plain unverändert (H).** `drawBodyPlain` aller Typen und Stufen bytegleich zu AK-01 (b); damit Picking
  (`bodyFaces`), `drawGhost` und alle H-R7-AK1-Hashes unverändert.
- **AK-35 Bildmodus-Änderung begrenzt (H).** Im Bildmodus ändern sich nur Hof- und Pflaster-Abschnitte (Trennstelle
  über den V6-Marker, vorab im AK-01-Commit gesetzt). Alles andere (Körper, Dach, Kaimauer) ist bytegleich zu AK-01
  (g); Kaimauer zusätzlich zu (j). Neue Bildmodus-Referenzen setzt ORT-K2 in einem eigenen Commit, nur für Typen mit
  Hof bzw. Pflaster.
- **AK-36 KS5 Pflaster (V, F).** Im Bildmodus keine Fugenlinie und kein Pflasterrand mit kollinearer Strecke > 0,5
  (Toleranz 0,01); Fugen benachbarter Reihen um ≥ 0,25 Steinlänge versetzt; Kaimauer bytegleich zu AK-01 (j).
- **AK-37 KS8 Schatten (V, F, P).** AK-01 (i) grün (RF-6b, AK-ISO-10). Mit V1: Durchgang 5 füllt genau zwei Pfade in
  der Reihenfolge Halbschatten (`a/2`, Hüllen +0,06 für Gebäude und Bäume, übrige Polygone unerweitert), Kernschatten
  (`a'` nach 4.3, Polygone wie A); `renderStats.shadowFills` zählt 2. Rechnerisch `1 − (1 − a/2)(1 − a') = a` ± 1/255.
  Pixel über V5: L* in der Schattenmitte = A ± 1.
- **AK-38 Regel KS0 als Test (V, F).** Sammeltest mit V1 über die flachen Bodenzeichner **im Bildmodus-Zweig**
  (`drawRoads`, `raggedYard`, Pflaster in `marketBody`/`kontorBody`): kein Strich in `earthEdge`, keine kollineare
  Strecke > 0,5. Ausgenommen: Plain-Zweig (AK-34), Kaimauer, Gebäudekörper, Schatten.
- **AK-39 Leistung ORT-K2 (P).** Protokoll P: `renderMedian` B − A ≤ +0,2 ms; H-R7 AK7 grün.

### 8.4 ORT-3 Weg-Objekte

- **AK-40 Platz und Dichte (V).** Seeds 1–20 und Fixture: Items nur auf Wegkacheln mit Ortsnähe Land/Rand und freier
  Seite, Abstand zur Achse ≥ 0,3, paarweiser Chebyshev-Abstand ≥ 3, je Insel ≤ ⌊Wegkacheln / 4⌋. Wegkreuz und
  Bildstock nur an Kacheln mit ≥ 3 Wegnachbarn oder an Kurven (genau 2 nicht gegenüberliegende Nachbarn).
- **AK-41 Weichen und Rückkehr (V).** Seitenkachel bebauen → Item weg im ersten Frame mit neuem `layoutKey`; nach
  `demolish` Itemliste wie vorher. Lokalität r ≤ 3 wie AK-07.
- **AK-42 Lesbarkeit (V).** Höhe ≤ 0,15 `ISO_H` auf `quiet`-Kacheln; Bildgrösse < 0,3 Kachel; Rezepttest: ΔE2000 ≥ 20
  zu Signalfarben und ≥ 10 zu jeder `roof*`-Farbe; nie in `buildingHulls`.
- **AK-43 Cache und Leistung (V, P).** Alle W2-Arten × Varianten × Zoomstufen bei Zoom 2 / DPR 2 ≤
  `PROPS_CACHE_MAX_BYTES`; Protokoll P: `renderMedian` B − A ≤ +0,2 ms.

### 8.5 Release (nach ORT-3)

- **AK-44 Stilrahmen (V).** Text-Test: `2026-10-04-stilrahmen.md` enthält S7 im Wortlaut von 3.6.
- **AK-45 Signale scharf, O10 (H, F).** `drawHover`, `drawGhost` (alle Typen), `drawPathPreview`, Auswahl bytegleich zu
  AK-01 (a).
- **AK-46 Picking (V).** `picking.test.ts`, `verdeckung.test.ts` AK-ISO-15, H-R7 AK3/AK4 grün; Wegpicking
  kachelbasiert.
- **AK-47 Cache-Schlüssel (V).** `spriteKey` bytegleich zu AK-01 (d); `VARIANT_COUNT`, `SPRITE_CACHE_MAX_BYTES` wie A;
  H-R7 AK7 grün.
- **AK-48 Leistung Release (P).** Protokoll P mit A gegen Release-Stand: `renderMedian` ≤ +0,4 ms; `lastPatchMs`
  (über V3, Median je Bau) ≤ +30 %; `buildMs` ≤ +15 %.
- **AK-49 Kein Sim, kein Save (V).** Diff gegen A ohne Änderung in `src/sim/`; `SAVE_VERSION` gleich A;
  `tests/sim/balance.test.ts` und `make check` grün.
- **AK-50 Helligkeitsprofil (P, A10).** V5, Fixture, Zoom 1, DPR 2, eingefrorene Zeit: je 20 Querschnitte senkrecht zu
  Wegkante, Hofrand und Schattenrand, Medianprofil in L*. Kern-L* = Median im Band ±0,1 Kachel um die Achse ohne
  Fahrspuren. Bestanden: Minimum ≥ min(L* Kern, L* Gras) − 2 und Übergangsbreite 10 % → 90 % ≥ 3 Gerätepixel.
- **AK-51 Kanten-Galerie, Blindfrage (B, A15/A8a).** Bildpaare A/B (V4) von Kreuzung (`04-weg-z2`), Hof
  (`03-holzfaeller-z2`), Markt (`10-markt-z1.5`), Siedlung (`07-siedlung-z1`), Wohnhaus (`01-wohnhaus1-z2`). Zwei
  unabhängige Rater ohne Vorkenntnis sehen je Paar beide Bilder unbeschriftet in zufälliger Reihenfolge und beantworten:
  «Welches Bild wirkt natürlicher im Übergang zwischen Siedlung und Landschaft?» Reihenfolge und Seed werden
  protokolliert. Bestanden: Jeder Rater wählt in ≥ 4 von 5 Paaren B.
- **AK-52 Anbindung lesbar (B, A12).** Wahrheitsliste aus dem Layout: jede Wegkomponente mit Kontakt zu einem Kontor
  und jedes Wegende (Wegkachel mit genau einem Nachbarn). Die Rater setzen in den B-Bildern `07-siedlung-z1` und
  `04-weg-z1` je Verbindung und je Wegende einen Punkt (Pixelkoordinate); V8 bildet sie auf Kacheln ab. Treffer bei
  ±1 Kachel; W3-Enden gelten als erkannt, wenn innerhalb ±1 Kachel markiert. Bestanden: ≥ 90 % Treffer je Rater und
  höchstens 10 % Fehlmarkierungen.
- **AK-53 Fremdinsel (V, A9).** V8-Fixture: Saumpixel, `RoadShape` und W1-Deko auf der Fremdinsel gleich wie bei
  demselben Layout auf der Heimat (Puffer- und Geometrievergleich). Ein Bildpaar Heimat/Fremdinsel ergänzt nur.

## 9 Herkunft

| AK                                | Abnahme-Idee (Brainstorming 6) |
| --------------------------------- | ------------------------------ |
| AK-05, AK-23, AK-54               | A1, A14                        |
| AK-06, AK-26, AK-41               | A2                             |
| AK-07, AK-23                      | A3, A14                        |
| AK-01, AK-08, AK-34, AK-35, AK-55 | A4                             |
| AK-13, AK-17, AK-32 ff.           | A5                             |
| AK-12, AK-43, AK-47               | A6                             |
| AK-11, AK-15, AK-42, AK-46        | A7                             |
| AK-16, AK-51                      | A8 (nur a; b und c in ORT-B)   |
| AK-14, AK-53                      | A9                             |
| AK-18, AK-37, AK-50               | A10                            |
| AK-19, AK-33, AK-36, AK-38, AK-57 | A11                            |
| AK-20, AK-21, AK-24, AK-52        | A12                            |
| AK-45                             | A13 (O10)                      |
| AK-22, AK-30, AK-31               | A14                            |
| AK-51                             | A15                            |
| AK-02, AK-03, AK-09, AK-56        | D7, O4, Randfälle              |
| AK-44                             | O7 (S7)                        |

## 10 Nicht-Ziele

Kein Save-Feld, nichts in `src/sim/`, kein Balancing, kein Spielwert. Keine wassergefüllten Pfützen, keine
Abrissnarben. Kein Hofkram, keine Anbauten, nichts an `variants.ts` (ORT-B). Keine Feld-, Zaun- oder Waldkanten
(ORT-5). Keine fremden Assets (ADR-006), keine Laufzeit-Abhängigkeit, kein neuer Sprite-Cache-Schlüssel.

## 11 Risiken

- **Patch-Zeit (hoch):** Rand 2 statt 1 vergrössert das Patch-Rechteck eines 2×2-Baus von 16 auf 36 Kacheln; +30 %
  `lastPatchMs` ist gefährdet. Gegenmittel: Grundpixel nur im Rand-1-Bereich neu rechnen, im äusseren Ring nur den
  Saum mischen; Frühwarnung AK-17; sonst E6.
- **Bildmodus ohne Hash-Schutz:** heute ungeschützt; KS4/KS5 setzen dort neue Referenzen. Gegenmittel AK-01 (g),
  AK-34, AK-35.
- **Weg-Lesbarkeit:** zu viel Gras wirkt «unterbrochen». Gegenmittel AK-21, AK-27, AK-52.
- **Messaufwand:** V1–V8 sind zusätzliche Test-Tasks (Schätzung +25 Tools in ORT-1, +10 in ORT-K1).
- **Merge-Punkt `sprites.ts`:** getrennte Funktionen; ORT-K1 merged zuerst.

## 12 Offene Punkte (Ruling-Entwürfe an L0)

- **E1 O8 in ORT-A leer:** KS4/KS5 nur im Bildmodus, AK1 und Plain bytegleich; Bildmodus-Referenzhash als Schutz
  (AK-01 (g), AK-35). Empfehlung: annehmen.
- **E2 Boden-Gradient über Nahdichte (r = 1) statt Ortsnähe (r = 3):** hält den Patch-Rand bei 2. Empfehlung:
  annehmen; Ortsnähe bleibt für Items und Weg-Pfad.
- **E3 Zeitgrenze `drawRoads` (AK-30):** «nicht teurer als A» als Frame-Mittel B ≤ A + 0,15 ms mit gemeinsamem
  Messpunkt-Commit V2 auf beiden Seiten. Empfehlung: annehmen.
- **E4 Salzzuteilung 600–619** nach 3.4, Reserve 615–619 für ORT-B, ORT-5 später 620–629. Empfehlung: annehmen.
- **E5 Rater:** zwei getrennte `qa-playtester`-Läufe ohne gemeinsamen Kontext. Empfehlung: annehmen.
- **E6 Fallback Patch-Budget:** Verfehlt das Release `lastPatchMs` ≤ +30 %, entscheidet L0 zwischen Rand 1 mit
  Saumreichweite ≤ 0,35 Kachel und einer höheren Grenze. Empfehlung: erst messen (AK-17, AK-48).
- **E7 KS8-Technik:** zwei Vereinigungs-Füllungen mit `a/2` und `a'` statt Clip (4.3). Empfehlung: annehmen.
