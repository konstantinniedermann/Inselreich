# Art-Vorschlag Denkmal (M13-E2, I-039)

- Status: Vorschlag an L0 · Paket design-denkmal-sprite · Autor: lead-art · 2026-10-10
- Grundlage: I-039 in `docs/ideen.md` (3×3-Prestigebau nach der Gewürzstadt, wächst in Teillieferungen),
  Stilrahmen `2026-10-04-stilrahmen.md` (S1–S6), ADR-006, ADR-011, ADR-012; Code-Bestand `src/render/sprites.ts`,
  `iso.ts`, `spriteCache.ts`, `limits.ts`.
- Die Spec M13-E2 (lead-design) lag bei Abschluss noch nicht vor. Alle Annahmen zur Sim stehen in §5 und sind dort
  mit der Spec abzugleichen.
- Kein Einbau: Dieses Dokument legt keine Datei unter `public/` oder `src/` an.

## 1 Empfehlung: prozedural in `src/render/sprites.ts`

**Das Denkmal wird prozedural gezeichnet wie alle anderen Gebäude.** Ein lizenziertes Asset wird nicht eingebaut.

Begründung:

1. **Stil:** Jedes Gebäude ist heute eine Polygon-Silhouette in der Ton- und Lichtsprache des Stilrahmens. Es gibt
   ein Licht aus `light.ts`, Schatten werden kühl gemischt, die Kontur ist ein Ton (S1, S4), und Fugen kommen aus der
   Materialschicht (`material.ts`). Eine fremde Rastergrafik hätte eigenes Licht, eigene Kontur und eigene Palette.
   Gerade das Wahrzeichen der Insel wäre dann der eine Fremdkörper im Bild, also das Gegenteil von dem, was der
   Stilrahmen mit REL-01 behoben hat.
2. **Massstab und Zoom:** Der Sprite-Cache rastert jede Silhouette je Zoomstufe (7 Stufen) und je DPR scharf neu.
   Ein PNG müsste skaliert werden und wäre bei Zoom 2 entweder unscharf oder sehr gross.
3. **Bauphasen:** Kein gefundener Kandidat hat Bauphasen (§3). Die Phasen müssten wir ohnehin selbst zeichnen und
   hätten dann zwei Bildsprachen in einem Gebäude.
4. **Infrastruktur:** Unter `public/` liegt heute keine einzige Grafik. ADR-011 nennt `public/gfx/` nur als
   „künftig“. Für ein einziges Gebäude bräuchte es Lader, Manifest, Credits-Dialog-Eintrag, Prüfsumme und
   Budgetzeile. Das ist mehr Aufwand als die Zeichnung selbst.
5. **Lizenz und Herkunft:** Prozedural heisst null Fremdrechte und kein Nachweis. Eigene Form ohne Bezug zu fremden
   Spielen (ADR-006): Das Denkmal wird **kein** Triumphbogen, kein Schloss und keine Kathedrale, also keine
   Genre-Ikonen, die man mit bestimmten Titeln verbindet.

Asset-Grösse: **0 Byte** (Gesamtgrösse von `public/` unverändert).

## 2 Bildziel

**Motiv: die Feuersäule der Insel.** Ein gestufter Steinsockel mit drei Terrassen auf 3×3 Kacheln. Darauf steht
ein schlanker, sich verjüngender Schaft mit einem Kapitell aus Kupfer, und oben brennt eine Feuerschale. Am Tag
ist das ein Wahrzeichen, nachts ein Leuchtfeuer. Das Motiv passt zum Inselreich (Seefahrt, Küste) und zu
keinem fremden Spiel.

Lesbarkeit (Prüffrage 1):

- **Höchstes Gebäude des Spiels, aber unter der Culling-Grenze.** Die Spitze liegt bei ≈ 2,9 · ISO_H, also unter
  `H_TOWER` = 3 · ISO_H (`iso.ts:22`, Culling-Zuschlag in `camera.ts:155`). Zum Vergleich: Der Kapellenturm reicht
  bis 2,55 · ISO_H, die Amtsstube bis 2,0 · ISO_H. Eine höhere Spitze würde Culling und Archipel-Rahmen brechen.
  Das ist eine harte Grenze für den Engineer.
- **Einzige schlanke Senkrechte auf 3×3:** Alle anderen Grossbauten sind Hallen mit Dach. Die Silhouette
  „breiter Sockel, schmaler Schaft“ ist schon bei Zoom 0,5 eindeutig.
- **Palette nur aus `PALETTE`:** Sockel und Schaft in `wallStone` und `rockLight`, Terrassenkanten in `wallLime`,
  Kapitell in `roofCopper` (Grünspan, bisher nur am Kaufmannshaus), Feuer in `window`. Hof gepflastert aus
  `sandDry`/`rock` wie die Amtsstube. Es gibt keine neue Palettenfarbe und keine Signalfarbe (S5: Signale bleiben den
  Statusmarken vorbehalten).
- **Licht und Kontur nach S1 und S4:** Schattenseiten über `wallColors`/`toInk`, keine schwarze Linie. Für den
  Schaft gibt es zwei Bauweisen, Drehkörper wie der Glasofen (`lathe`) oder vierkantig wie der Uhrturm (`cuboid`).
  Empfehlung: vierkantig, weil er die Fugen der Materialschicht trägt und zu den Terrassen passt.
- **Nacht:** Die Feuerschale ist ein `always`-Lichtanker (wie eine Laterne, `lightAnchors`). Sie leuchtet nur im
  fertigen Zustand und macht den Abschluss nachts sichtbar.

## 3 Lizenzierte Alternative (geprüft, nicht empfohlen)

Gescoutet wurden OpenGameArt und Kenney. Es gibt keinen Satz mit Bauphasen und kein Denkmal im Stil des Spiels.
`art-license-checker` hat zwei Kandidaten als Rückfall geprüft:

| Kandidat                                                                                          | Autor                                        | Lizenz                                                                                                                                                            | Urteil art-license-checker                                                                       | Eignung (lead-art)                                                                                                                     |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| K1 [Stone Statue – City Decoration](https://opengameart.org/content/stone-statue-city-decoration) | City Building Game Art (CityBuildingKit.com) | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) (Seite und README im ZIP)                                                                            | **OK**, 2026-10-10: keine Mischlizenz, kein Fremdspiel- oder Markenbezug, Attribution freiwillig | fotorealistische Einzelstatue (Bogenschütze) ohne Bauphasen; PNG 2048×2340 px mit 19,2 MB, nur stark verkleinert ins Budget; Stilbruch |
| K2 [Isometric Buildings #1](https://opengameart.org/content/isometric-buildings-1)                | Kenney Vleugels (Kenney.nl)                  | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) (Seite und `License.txt`; Gegenprobe über [itch.io](https://kenney.itch.io/kenney-isometric-assets)) | **OK**, 2026-10-10: eigene Arbeit, Attribution freiwillig                                        | 133 PNG-Teile in 128 px (1,7 MB), nur moderne Bauten mit Flachdach, kein Denkmal-Motiv; flacher Stil mit Kontur                        |

Vor einem Einbau bräuchte jeder Kandidat eine CREDITS-Zeile mit Änderungen. `docs/licenses/CC0-1.0.txt` liegt
schon vor.

Beide passen nicht in den Stilrahmen (§1). Nach einem OK dürften sie eingebaut werden, sind aber nur die Rückfall-
Option, falls die prozedurale Umsetzung scheitert. Das ist nicht zu erwarten: Amtsstube, Glashütte und Badehaus
zeigen, dass Bauten dieser Komplexität prozedural gelingen.

## 4 Bauphasen

Die Phasen sind **diskrete Stufen**, kein stufenloses Wachsen. Nur so bleibt das Bild cachebar: `spriteKey` liest
heute bewusst kein `progress` (`spriteCache.ts:18`). Die Stufe kommt als eigenes Feld in den Schlüssel, genau wie
`level`. Weil der Fortschritt nur steigt, flackert keine Stufe.

| Stufe       | Anteil geliefert | Bild                                                                                                                        | Lesbarkeit                                 |
| ----------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 0 Baugrund  | 0 %              | Erdhof (`earth`), vier Eckpflöcke mit Schnur, kleiner Steinstapel im Hof                                                    | Fläche ist belegt, aber noch nichts gebaut |
| 1 Sockel    | > 0 bis < 34 %   | unterste Terrasse in Stein, rundum ein niedriges Holzgerüst (`wallTimber`-Stangen wie `pole`), Stein- und Glasstapel im Hof | Baustelle durch die Gerüststangen          |
| 2 Terrassen | 34 bis < 67 %    | alle drei Terrassen, Schaft bis ≈ 1/3 Höhe, das Gerüst wächst mit                                                           | der Sockel ist als Treppe erkennbar        |
| 3 Schaft    | 67 bis < 100 %   | Schaft in voller Höhe, ohne Kapitell und Feuerschale, Gerüst bis oben, Kran-Ausleger (eine Stange und ein Seil)             | fast fertig, aber die Spitze fehlt         |
| 4 Fertig    | 100 %            | Gerüst und Stapel verschwinden, Kapitell in Kupfer, Feuerschale, gepflasterter Hof, zwei Wimpel an den Vorderecken          | Wahrzeichen, nachts Leuchtfeuer            |

- **Regeln:** Jede Stufe ist eine Obermenge der vorigen, ausser dem Gerüst, das in Stufe 4 verschwindet. Das
  Gerüst ist das Baustellensignal. Ab Stufe 1 ist es bei Zoom 1 sichtbar. Ob das Denkmal auf Ware wartet, zeigen
  die bestehenden Statusmarken und nicht das Sprite (Prüffrage 1).
- **Schwellen:** Die Schwellen beziehen sich auf den Gesamtanteil der Lieferung (gewichtet nach Menge oder je Ware
  gemittelt, das legt die Spec fest). Liefert die Spec feste Teillieferungen, zum Beispiel drei, dann bildet je
  Teillieferung eine Stufe ab. Das geht direkt mit Stufe 1–3 plus 4 und ist die bevorzugte Lösung, weil die Stufe
  dann aus einem ganzzahligen Sim-Feld kommt.
- **Bauvorschau (`drawGhost`):** zeigt Stufe 4, damit der Spieler sein Ziel sieht. `drawGhost` setzt die Stufe
  dafür ausdrücklich. Ein Gebäude ohne Feld gilt sonst als Stufe 0.
- **Abschluss-Moment:** einmaliger Effekt beim Wechsel auf Stufe 4, etwa ein kurzes Aufflammen der Feuerschale über
  `fx.ts`. Dazu die bestehende Glocke (`public/audio/sfx/bell.mp3`) als Signal „Wahlziel erreicht“. Es braucht kein
  neues Audio-Asset. Ob das umgesetzt wird, entscheidet die Spec.

## 5 Schnittstellen und Annahmen (mit Spec M13-E2 und lead-tech abzugleichen)

- **Render liest nur:** eine ganzzahlige Baustufe 0–4 bzw. die Anzahl der Teillieferungen oder den Anteil. Eine
  reine Funktion `monumentStage(b)` in `src/render/` bildet daraus die Stufe und wird getestet. Render schreibt nie
  in die Welt.
- **Cache:** `spriteKey` bekommt die Stufe als Feld. Fehlt sie, gilt 0. Der Schlüsselaudit im Kopf von
  `spriteCache.ts` wird nachgeführt.
- **Höhe:** `BODY_HEIGHTS.monument` liegt bei ≈ 2,9 · ISO_H für Stufe 4. Für Stufe 0–3 ist die Höhe kleiner, also
  ist auch die Bildbox kleiner (die Höhe darf von der Stufe abhängen, weil die Stufe im Schlüssel steht).
- **Speicher:** 3×3 bei Zoom 2 und DPR 2 ergibt ≈ (208 · 4)² · 4 B ≈ 2,8 MB je Eintrag, das liegt unter
  `SPRITE_MAX_BYTES` (4 MB). Es gibt höchstens ein Denkmal, also höchstens 5 Stufen × 7 Zoomstufen. Real gecacht sind
  1–2 Einträge, `SPRITE_CACHE_MAX_BYTES` (64 MB) bleibt unberührt.
- **Id:** Name und Id setzt die Spec. Der Vorschlag nimmt `monument` an.

## 6 Aufwand Einbau (Schätzung)

Ein Häppchen für `art-rendering-engineer` (sonnet), Prozessstufe leicht, nach der Sim-Umsetzung von M13-E2 oder
parallel dazu gegen ein vereinbartes Feld:

- `monumentBody` mit 5 Stufen in `sprites.ts`, Eintrag in `SILHOUETTES`, `BODY_HEIGHTS`, Fenster bzw. Lichtanker,
  `spriteKey` um die Stufe erweitert, `drawGhost` auf Stufe 4.
- Tests (`tests/render/`, Fake-Kontext): Je Stufe unterscheidet sich die Silhouette. Die Spitze liegt ≤ `H_TOWER`.
  Der Schlüssel enthält die Stufe. Die Bytes bei Zoom 2 und DPR 2 bleiben unter `SPRITE_MAX_BYTES`. Ein Lichtanker
  gibt es nur in Stufe 4. Die Stufen-Funktion ist an den Schwellen geprüft.
- Browser-Check (`qa-playtester`): Galerie Stufe 0–4 bei Zoom 0,5, 1 und 2 sowie Tag und Nacht. Abnahme: Der Blick
  erkennt das Denkmal gegen Wiese und Sand. Stufe 3 und Stufe 4 sind bei Zoom 1 unterscheidbar.
- **Schätzung ≈ 100 Tools** (Engineer ≈ 60, Review ≈ 15, Playtest ≈ 25), etwa wie ein M8-R1-Gebäude mit
  zusätzlicher Stufenlogik. Es gibt keine Assets und keinen Lizenzaufwand.
- Risiko: gering. Die Höhe stösst an `H_TOWER`, deshalb ist ein Test Pflicht. Die Stufe muss im Cache-Schlüssel
  stehen, sonst bleibt nach einer Lieferung das alte Bild stehen.
