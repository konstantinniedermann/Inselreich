# HAFEN · Anhang 02: Optik Schiff und Steg (Vorgaben an lead-art)

Zur Spec [2026-10-25-hafen-design.md](../2026-10-25-hafen-design.md), Regel R32 und Designvorschlag D7. Prozedural
(Canvas-Pfade), keine Assets, kein Lizenzweg nach ADR-011. Stilgrundlage: ADR-012 und
[Stilrahmen](../2026-10-04-stilrahmen.md) (S1 ein Licht, S2 Tonstufen, S4 Kontur im Eigenton, nie Schwarz). Alle Masse
sind Darstellungswerte in `src/render/` (keine Spielwerte). Wo eine Zahl fehlt, wählt lead-art und hält sie als
benannte Konstante in `src/render/ship.ts` bzw. im Steg-Zeichner fest.

## A Bestand (`src/render/ship.ts`, main `70a32032`)

- `drawShip(ctx, cam, tile, timeMs, scale)`: Trapezrumpf (±0,38 · `SHIP_W`), ein Mast, ein Dreiecksegel, Schaukeln
  (`BOB_AMPLITUDE` 0,04) und Neigung (`TILT_MAX` 0,06 rad) aus `timeMs`. **Keine Fahrtrichtung**: der Rumpf zeigt immer
  gleich.
- Farben: `HULL` = Mischung `roofWood`/`wallTimber`, `SAIL` = `wallLime`, `OUTLINE` = dunkler Eigenton des Rumpfs.
- Fernsicht: Saum `SAUM` = `PALETTE.foam`, `SAUM_PX` 4, ab Zoom ≤ `SAUM_MAX_ZOOM` 0,5; Mindestgrösse `shipScale`
  (`MIN_SHIP_CSS_PX` 16, `SHIP_DRAWN_FRAC` 0,76); Trefferbox `shipAt` (`shipLane.ts:116`) aus `SHIP_W_PX` und
  `SHIP_ASPECT_H`.

## B Silhouette (D7 a)

- Gebogene Deckslinie (Sprung: Bug und Heck höher als Mittschiffs).
- Höheres Heck (Achterkastell angedeutet, eine Stufe), schlanker Bug mit **Bugspriet** über den Bug hinaus.
- Rumpf liest sich von der Seite als Schiff, nicht als Schale; in Iso-Ansicht bleibt der Rumpf eine geschlossene Form
  (ein Pfad, damit der Saum aus §G um die ganze Form läuft).

## C Takelage (D7 b)

- **Ein Mast** mit **Rahsegel** (Rechteck, leicht gebaucht: Unterkante und Seitenkanten als flache Kurve), dazu eine
  kleine **Fock** am Bugspriet.
- **Wimpel** an der Mastspitze, zeigt nach achtern (gegen die Fahrtrichtung).

## D Farben (D7 c)

- Rumpf **zweitönig**: dunkles Rumpfholz unten (Unterwasser-/Rumpfton aus `wallTimber`/`roofTimber`), heller
  **Bordstreifen** oben (aus `roofWood` bzw. heutigem `HULL`). Tonstufen nach S2, kein Verlauf.
- Segel der eigenen Flotte wie heute aus `wallLime`; Wimpel Vorschlag `roofCopper` (Wahl lead-art).
- Kontur im Eigenton (`toInk` des jeweiligen Flächentons), **nie Schwarz**. Keine Signalfarben (`signal*` bleiben
  Hinweisen vorbehalten).
- Tageslicht und Wetter tönen das Schiff über den globalen Multiply-Durchgang; keine eigene Lichtrechnung.

## E Fahrtrichtung (D7 d)

- Der Bug zeigt in Fahrtrichtung. Mindestens **4 Iso-Richtungen NO, NW, SO, SW**, gewählt aus `heading` der Pose (Spec
  R25: Tangente der Fahrlinie an der Pose).
- Erlaubt: 2 gezeichnete Formen (Bug nach links / rechts) und Spiegelung für die zweite Achse, solange Heck- und
  Bugspriet-Lage in allen 4 Richtungen eindeutig ist (Prüfung §J).
- Liegend: Richtung der Ankunft (R25); Schiff ohne vorherige Fahrt: feste Richtung, Vorschlag SW (Bug zum Betrachter
  links unten), Wahl lead-art.
- Kein weiches Drehen zwischen den Richtungen (Wechsel springt), Schaukeln und Neigung bleiben wie heute.

## F Zustand (D7 e)

- **Fahrend:** Rahsegel und Fock gesetzt (volle Fläche, gebaucht).
- **Liegend** (`furled` aus R25: `to === null`, mit oder ohne Liegezeit): Segel **gerefft**, als schmaler Wulst an der
  Rah; Fock eingeholt. Der Unterschied muss bei Zoom 1 auf einen Blick lesbar sein.

## G Massstab und Fernsicht (D7 f, g)

- Schiffslänge ≈ **1 Kachel** (Bug bis Heck, ohne Bugspriet).
- Masthöhe ≈ **1,2 × Firsthöhe des Kontors** (2×2), damit das Schiff am Steg neben dem Kontor glaubwürdig wirkt.
  Firsthöhe aus dem Kontor-Zeichner ablesen; Verhältnis als Konstante festhalten.
- `SAUM` (Fernsicht ≤ 0,5) umläuft die neue Rumpf- und Segelform; `SHIP_DRAWN_FRAC` und `SHIP_ASPECT_H` an die neue
  Silhouette anpassen, damit `shipScale` (Mindestgrösse 16 CSS-px) und `shipAt` (Trefferbox, AK-HF-52) stimmen.
- Liegeplatz-Versatz: Schiffe am selben Anker mit Mittelpunkten ≥ `BERTH_MIN_GAP` 0,5 Kachel (Spec R24); bei
  Schiffslänge ≈ 1 Kachel dürfen sich die Umrisse überlappen, die Tiefensortierung (Iso-Tiefe der Mittelpunkte) zeigt
  das vordere Schiff vorn.

## H Auftragsschiff (D7 h)

- Gleiche Silhouette, **fremde Segel- und Wimpelfarbe**: Vorschlag Segel aus `roofTerracotta`, Wimpel aus `roofSlate`
  (Wahl lead-art; Abstand zur eigenen Flotte bei Zoom 0,5 deutlich).
- Ein- und Ausblenden am Wegende (12 Kacheln vor dem Anker, Spec R26/R28): Dauer offen (Spec O-5), Vorschlag lead-art;
  ohne Ausblenden erscheint das Schiff weit draussen.
- Nicht anklickbar; Trefferbox gilt nicht (Spec R30).

## I Steg (D7 i)

- **Planken** in Holztönen (`roofWood`, Fugen in `wallTimber`), **3 Pfähle** (`roofTimber`), Breite ≈ **0,3 Kachel**.
- Verlauf vom **Kontorrand** bis zur **Mitte der Ankerkachel**. Liegt der Anker diagonal am Fussabdruck (Eckkachel des
  8er-Rings, Spec R1), läuft der Steg von der nächsten Kontorecke diagonal.
- **Tiefensortierung:** Steg unter dem Schiff (vor den Schiffen am selben Anker gezeichnet, AK-HF-39), über dem Wasser.
- Ohne Kontor kein Steg (Heimat hat immer einen; Fremdinsel nur mit `kontorId ≠ null`). Nach Abriss verschwindet der
  Steg, der Ankerplatz bleibt (Spec R4).
- Schatten des Stegs: wie Gebäudeschatten nach S1 (ein Licht), falls lead-art ihn vorsieht.

## J Browser-Check (AK-HF-51)

Galerie-Seite oder Testwelt mit Kamera auf freiem Wasser und am Steg (Seed 1, Insel B, Kontor II abseits
`kontorSite`):

1. Screenshot-Raster **4 Richtungen (NO, NW, SO, SW) × fahrend/liegend**, je bei **Zoom 0,5 / 1 / 2**, dazu das
   Auftragsschiff fahrend und liegend bei Zoom 1.
2. Erwartetes Bild: Bug und Bugspriet zeigen in die angegebene Richtung; Heck höher als Bug; fahrend Segel voll, liegend
   gerefft; Rumpf zweitönig mit hellem Bordstreifen; keine schwarze Kontur; bei Zoom 0,5 heller Saum rundum und
   Schiff ≥ 16 CSS-px.
3. Am Steg: Schiff ≈ 1 Kachel lang, Mast ≈ 1,2 × Kontorfirst, Steg vom Kontorrand zur Schiffsmitte, Steg unter dem
   Schiff.
4. Auftragsschiff: Segel- und Wimpelfarbe von der eigenen Flotte unterscheidbar bei Zoom 0,5.
5. Tag und Nacht je ein Bild (Tageslicht-Grading tönt Schiff und Steg mit).
