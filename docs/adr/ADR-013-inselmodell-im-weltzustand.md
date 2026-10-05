# ADR-013: Inselmodell im Weltzustand

Status: angenommen · Datum: 2026-10-05 · Bezug: R226 F-06, R227 F-S1 … F-S3, [ADR-002](ADR-002-sim-render-trennung.md),
[ADR-005](ADR-005-tick-reihenfolge-und-zustaende.md) · Meilenstein M12, Paket E0

## Kontext

Bis M11 hatte die Welt genau eine Insel: Kartenraster (`width`, `height`, `tiles`), Kontor-Id und Lager lagen
flach im Weltzustand. M12 bringt ab E1 mehrere Inseln. E0 bereitet das Datenmodell vor und ändert sichtbar nichts:
Spielwerte, Tick-Ergebnis des Referenzlaufs und Bedienung bleiben gleich, `src/sim/defs/` und der Balancing-Test
bleiben unberührt.

Die Entscheidung betrifft die Form des Welt-Zustands und damit das Speicherformat. ADR-002 (Sim als JSON-fähiges
Datenmodell) bleibt gültig; ein Nachtrag dort würde die Entscheidung verstecken (R227 F-S3), daher ein eigenes ADR.

## Entscheidung

1. **Je Insel** liegen Raster, Kontor und Lager: `world.islands[i]` mit `width`, `height`, `tiles`, `kontorId`,
   `stock` (Typ `Island` in `src/sim/types.ts`). E0 erzeugt und lädt genau eine Insel (Index `HOME = 0`).
2. **Global** bleiben die Gebäudeliste `world.buildings` und die Id-Vergabe (`nextBuildingId`) sowie Geld, Steuer,
   Statistik, Freischaltungen, Auftrag, Krise und Tick. Ein Gebäude gehört über das Pflichtfeld `island` (Index) zu
   seiner Insel.
3. **Abarbeitung in Id-Reihenfolge:** Die Systeme iterieren weiter über `Object.values(world.buildings)`
   (aufsteigende Id) und lesen je Gebäude `b.island`. Damit bleibt die Reihenfolge, die der Referenzlauf kennt.
4. **`island` ist Pflichtfeld, ohne Kompatibilitäts-Zugriffe (R227 F-S1, F-S2):** Es gibt keine Aliase auf `World`
   (kein `world.tiles`, `world.stock` o. ä.). Zugriffe gehen über Helfer in `src/sim/world.ts` (`home`, `islandOf`,
   `idx`, `inBounds`, `tileAt`, `adjacentOf`, `tilesInRadius`, die die Insel als Parameter nehmen). Aktionen mit
   Bauplatz nehmen den Inselindex als letzten Parameter mit Vorgabe `HOME`; ein ungültiger Index liefert
   `{ ok: false, reason }` statt eines Wurfs (`islandAt` in `src/sim/placement.ts`, gibt `null` zurück).
5. **Abgeleitete Abdeckung steht nie im Save:** `buildCoverage(world)` in `src/sim/coverage.ts` sammelt je Insel die
   Versorgungs- und Dienstquellen in einem Durchlauf. Das Ergebnis lebt nur innerhalb eines `tickPopulation`-Aufrufs
   und wird als `cov` weitergereicht. Aufrufer ohne `cov` (UI, Abfragen) filtern je Aufruf frisch
   (`serviceBuildings`). Wie `connected` wird auch die Anbindung nach dem Laden neu abgeleitet.
6. **Jede Formänderung bekommt je Merge eine eigene `SAVE_VERSION` (R227 F-S3):** E0 hebt auf **7**. Migration
   `migrateV6ToV7` in `src/sim/save.ts` wirft nie und setzt die Schlüssel reihenfolgetreu neu ein
   (`islands = [{ width, height, tiles, kontorId, stock }]` an der Stelle von `width`, je Gebäude `island: 0` nach
   `state`). **v7 ist damit eingefroren**: Spätere Formänderungen (E1 ff.) bekommen v8 und eine eigene Migration,
   v7 wird nicht nachträglich geändert. Ein Fixture-Stand v6 (`tests/sim/fixtures/save-v6.json`) belegt die
   Migration.
7. **Ladeprüfung:** `deserialize` prüft in E0 genau eine Insel (Kartengrösse, Kachelanzahl, alle Güter im Lager,
   `kontorId` verweist auf ein Kontor mit `island 0`, keine v6-Schlüssel auf oberster Ebene) und für jedes Gebäude
   `island` als ganze Zahl im Indexbereich.

## Verworfene Alternativen

- **Je Insel eine eigene Welt mit eigener Gebäudeliste.** Dann hätten Geld, Id-Vergabe, Steuer, Krisen und Auftrag
  mehrere Besitzer, und Schiffe zwischen Inseln bräuchten eine Klammer darüber. Die globale Liste mit `island` am
  Gebäude hält Ids eindeutig und die Reihenfolge deterministisch.
- **Inselkennung an der Kachel.** Sie würde jede Kachel vergrössern und den Save aufblähen; die Zugehörigkeit steht
  schon im Raster, das einer Insel gehört. Das Gebäude trägt ohnehin `island`.
- **Abdeckungsraster mit Invalidierung.** Ein gespeichertes oder zwischengespeichertes Raster für Versorgung und
  Dienste bräuchte bei jedem Bau, Abriss, Ausfall und jeder Anbindungsänderung eine Invalidierung und wäre eine
  zweite Wahrheit neben den Gebäuden. Die Sammlung je Tick ist ein Durchlauf über die Gebäude und bleibt ohne
  Zustand.

## Folgen

- Alle Zugriffe auf Raster, Kontor und Lager in Sim, Render und UI gehen über Insel und Helfer. Der Compiler meldet
  jeden vergessenen Zugriff (`npx tsc --noEmit`), weil es keine Aliase gibt. Neu in dieser Form: `Coverage` nur
  innerhalb von `tickPopulation`.
- Der Renderer rechnet in E0 weiter mit der Heimat. Eine flache Kopie der Heimatinsel samt Seed (`fieldWorld(world)`
  in `src/render/terrainField.ts`) dient als Eingabe der Geländefelder und ist je Welt zwischengespeichert; für
  mehrere Inseln muss E1 die Felder je Insel bilden.
- Regeln nach Inseln: Versorgung, Dienste, Wege und Feuerschutz gelten je Insel; Auftrag, Bilanz und Brandziel gelten
  nur für die Heimat; Zählungen (Bürger, Kaufleute, Ziele, Unterhalt) bleiben global. `isSupplySource` in
  `coverage.ts` fragt dafür das Kontor der eigenen Insel ab.
- **Kosten der Umkehr:** v7-Stände liegen ab jetzt in den Autosaves der Spieler. Wer E0 zurücknimmt, lässt Stände
  zurück, die ältere Builds mit `Unbekannte Version` abweisen. Die Probe AK-E0-09 prüft genau das. Es gibt keinen
  Weg zurück von v7 nach v6.
- E1 lockert die Ladeprüfung von genau einer Insel auf n Inseln (Kartengrösse je Insel, `kontorId` je Insel) und
  hebt `SAVE_VERSION` auf 8, falls sich die Form ändert.
