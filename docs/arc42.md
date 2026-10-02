# Inselreich — Architekturdokumentation (arc42)

Diese Dokumentation beschreibt den Stand nach dem MVP (Meilensteine 1–4), M5 „Spielerlebnis", M6 „Krisen"
und M7 „Stimmung" (mit dem Nachtrag Isometrie). Sie ergänzt die
[Design-Spec](superpowers/specs/2026-09-29-inselreich-design.md), die
[M5-Spec](superpowers/specs/2026-09-30-m5-spielerlebnis-design.md), die
[M6-Spec](superpowers/specs/2026-09-30-m6-krisen-design.md), die
[M7-Spec](superpowers/specs/2026-09-30-m7-stimmung-design.md) und den
[Nachtrag M7-ISO](superpowers/specs/2026-10-01-m7-iso-design.md), die Spielregeln, Zahlen und Darstellung
festlegen, und die [ADRs](adr/), die die wichtigsten Entscheidungen begründen. Massgeblich für
Spielwerte ist immer der Code in `src/sim/defs/`.

## 1. Einführung und Ziele

### Aufgabenstellung

Inselreich ist ein Aufbau-Strategiespiel im Browser: Der Spieler besiedelt eine generierte Insel,
verbindet Betriebe per Weg mit dem Kontor, baut Produktionsketten auf, versorgt Wohnhäuser mit Waren
und Diensten und lässt die Bevölkerung von Pionieren über Siedler zu Bürgern aufsteigen. Geld kommt
aus Steuern und Handel, Unterhalt kostet laufend. Ziel sind 50 Bürger; der Spielstand lässt sich im
Browser speichern. Mechanik und Zahlen sind eigenständig, Grafik und Audio eigen oder offen lizenziert mit Nachweis (ADR-006).

M5 ergänzt Tiefe (globaler Steuerregler, Werkzeugmacher), Dynamik (Verkaufssättigung, Handelsaufträge),
Ambiente (gezeichnete Silhouetten, Animationen, synthetischer Ton, Tag-Nacht-Tönung) und Bedienkomfort
(Radiusanzeige, Bedarfssymbole, Warenbilanz, Tooltips, Hotkeys, Touch, Autosave).

M6 bringt Krisen (Brand, Sturm, Boom) in wählbarer Stufe, die Feuerwache, Save v3, Krisenkarte und
Ereignis-Log. M7 ersetzt die Draufsicht durch eine isometrische Darstellung (ADR-012) und bringt Tageslicht,
Wetter, Krisen-Effekte, Leben (Spaziergänger, Möwen, Herdrauch, Fensterlicht), einen Ton mit Bussen,
Umgebungsschichten und Musik sowie eine Einstellungs-Karte mit Credits. M7 ändert `src/sim/` nicht.

### Qualitätsziele

| Priorität | Qualitätsziel       | Bedeutung                                                                                      |
| --------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| 1         | Nachvollziehbarkeit | Jede Zeile Spiellogik ist ohne Framework-Wissen lesbar; Spielwerte stehen an einem Ort.        |
| 2         | Testbarkeit         | Die Simulation läuft ohne Browser und ist deterministisch; Tests sagen Buchungen exakt vorher. |
| 3         | Robustheit          | Ungültige Aktionen und kaputte Spielstände führen zu einer Meldung, nie zu einem Absturz.      |
| 4         | Spielbarkeit        | Ein Spieler erreicht das Ziel in einer Sitzung; der Balancing-Test sichert das ab.             |

### Stakeholder

| Rolle                  | Erwartung                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| Entwickler / Lernender | Versteht Aufbau und Code vollständig, lernt TypeScript und Architektur an einem echten Projekt (CAS AISE). |
| Spieler                | Spielt ohne Installation im Browser, versteht über Meldungen und Info-Panel, warum etwas nicht klappt.     |

## 2. Randbedingungen

| Randbedingung                 | Erläuterung                                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack                         | TypeScript (strict), Vite, HTML5 Canvas 2D für die Karte, DOM für das UI (ADR-001).                                                                |
| Keine Laufzeit-Abhängigkeiten | Nur Dev-Abhängigkeiten (Vite, TypeScript, Vitest, ESLint, Prettier samt Plugins). Ausnahmen nur per L0-Ruling mit eigenem ADR (ADR-001, Nachtrag). |
| Browser                       | Aktueller Browser mit Canvas 2D und Web Audio; Spielstände und Einstellungen in `localStorage`. Maus, Tastatur und Touch (Pinch, Zwei-Finger-Pan). |
| Desktop-first                 | Zielplattform Desktop mit Maus und Tastatur ab 1280 px (R78); schmalere Fenster müssen nur funktionieren, keine Mobil-Optimierung.                 |
| Fremde Assets                 | Nur offen lizenziert mit Nachweis (ADR-006), Ablage und Laden nach ADR-011. Stand: 14 Audiodateien und 2 Schriftschnitte unter `public/` (~8 MB).  |
| Eigene Inhalte                | Eigener Titel, eigene Zahlen; Grafik und Audio eigen oder offen lizenziert mit Nachweis (ADR-006).                                                 |
| Werkzeuge                     | Node ≥ 22; `make check` (Lint, Tests, Build) läuft identisch lokal und in der CI.                                                                  |
| Sprache                       | UI und Doku Deutsch (CH, kein ß); Code-Bezeichner Englisch.                                                                                        |

## 3. Kontextabgrenzung

```mermaid
flowchart LR
  Spieler([Spieler])
  App["Inselreich (Browser-App)"]
  LS[("localStorage")]
  Host["Statischer Webserver oder GitHub Pages"]
  Spieler -->|"Maus, Tastatur, Touch"| App
  App -->|"Karte (Canvas), HUD, Panels, Meldungen"| Spieler
  App -->|"Ton (Web Audio: Effekte, Umgebung, Musik)"| Spieler
  App -->|"Speichern, Autosave, Einstellungen als JSON"| LS
  LS -->|"Laden: JSON, geprüft"| App
  Host -->|"index.html, JS, CSS"| App
  Host -.->|"public/: Audio, Schrift, nach Bedarf"| App
```

| Nachbar      | Schnittstelle                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spieler      | Eingabe per Maus, Tastatur und Touch auf Canvas und Buttons; Ausgabe über Canvas, DOM und Web Audio (erst nach der ersten Nutzergeste).                                                                       |
| localStorage | Manueller Spielstand `inselreich.save.v1` und Autosave `inselreich.save.auto` (`src/ui/storage.ts`, beide Format v2); Einstellungen `inselreich.settings` (`src/ui/settings.ts`, nicht Teil des Spielstands). |
| Webserver    | Liefert die statischen Dateien aus `dist/`; es gibt kein Backend. Dateien aus `public/` (Audio, Schrift) lädt das Spiel erst nach Bedarf und still mit Rückfall (ADR-011).                                    |

## 4. Lösungsstrategie

- **Trennung Simulation / Darstellung / Bedienung** (ADR-002): `src/sim/` enthält die Spielregeln und
  kennt kein DOM (per ESLint-Regel `no-restricted-globals` abgesichert). `src/render/` zeichnet,
  `src/ui/` verbindet Eingabe, Loop und DOM.
- **Welt als Datenobjekt:** Der ganze Spielzustand ist ein JSON-fähiges `World`-Objekt ohne Klassen
  und Zyklen. Systeme sind Funktionen `(world) => void`, Aktionen `(world, …) => Result`. Speichern ist
  `JSON.stringify`.
- **Fester Tick:** Die Simulation läuft in Schritten von `TICK_MS` (100 ms bei 1×). Die Reihenfolge der
  Systeme und die Takte sind festgelegt (ADR-005); gleiche Eingaben ergeben gleiche Ergebnisse.
- **Spielwerte nur in `src/sim/defs/`:** Güter, Gebäude, Stufen und Takte sind Tabellen; die Logik liest
  sie, statt Zahlen hart zu codieren.
- **Isometrie mit Kachelraum als Wahrheit** (ADR-012, ersetzt ADR-003): Rauten 64 × 32 px bei Zoom 1, feste
  Blickrichtung. Sim, Footprints, Radien, Wege und Figurenpfade rechnen weiter im quadratischen Kachelraum; nur
  das Zeichnen projiziert (`src/render/iso.ts`). Der Boden wird im Kachelraum gerendert und je Frame über eine
  affine Matrix gezeichnet; Objekte mit Höhe werden nach einem Tiefenschlüssel sortiert.
- **Lesende Sim-Abfragen** (`src/sim/queries.ts`): UI und Renderer rechnen Bilanz, Diagnose,
  Abdeckung und Zonen nicht selbst nach, sondern fragen reine Funktionen der Simulation. Karte und
  Info-Panel nutzen dieselbe Quelle und widersprechen sich nie.
- **Ambiente ohne Sim-Änderung:** Animationen, Licht, Wetter und Leben hängen nur an Zeit und Welt-Zustand
  (`RenderFx`), Töne an Aktionsergebnissen und einem Vergleich zweier Frames in der UI. Die Welt trägt keine
  Ereignisliste. Krisen erreichen Render und Ton über eine Kette reiner Funktionen in der UI:
  `crisisView` (Sim) → `crisisFx` → `frameInputs` → `RenderFx` bzw. `sound.setAmbience`.
- **Assets nach Bedarf, nie Pflicht** (ADR-011): Dateien unter `public/` laden erst nach der ersten
  Interaktion und nur, wenn gebraucht; jeder Fehlschlag fällt still auf einen synthetischen Rückfall zurück.
  Das Spiel ist ohne eine einzige Datei vollständig spielbar.
- **Zufall aus dem Seed statt gespeichertem Strom** (ADR-010): Handelsaufträge leiten Gut und Menge je
  Periode aus Seed und Periodennummer ab; der Spielstand braucht keinen RNG-Zustand.

## 5. Bausteinsicht

### Ebene 1

```mermaid
flowchart TB
  Main["main.ts"]
  UI["src/ui: Bedienung, Game-Loop, DOM"]
  Render["src/render: Projektion, Kamera, Canvas-Zeichnung"]
  Sim["src/sim: Spielregeln, Welt-Zustand, DOM-frei"]
  Audio["src/audio: Busse, Effekte, Umgebung, Musik"]
  LS[("localStorage")]
  Pub[("public/: Audio, Schrift")]
  Main --> UI
  UI -->|"render, Kamera, targetTile, viewStats"| Render
  UI -->|"Aktionen, step, Abfragen"| Sim
  UI -->|"play, setBus, setAmbience, setPhase"| Audio
  Render -->|"liest Welt, Defs, Abfragen"| Sim
  UI -->|"storage.ts, settings.ts"| LS
  Audio -.->|"fetch bzw. Media-Element, nach Bedarf"| Pub
```

| Baustein      | Verantwortung                                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/sim/`    | Welt-Zustand, Spielregeln, Spielwerte, Speicherformat mit Migration, lesende Abfragen. Keine Abhängigkeit nach aussen.                                                                                           |
| `src/render/` | Isometrische Projektion, Kamera, Tiefensortierung und Picking-Geometrie; zeichnet Boden, Wasser, Wege, Gebäudekörper, Bäume, Leben, Wetter, Krisen-Effekte, Licht, Overlays und Vorschau. Liest nur.             |
| `src/ui/`     | Start und Neustart, Game-Loop, Eingabe (Maus, Tastatur, Touch, Hotkeys), HUD, Bauleiste, Panels, Einstellungs-Karte, Krisenkarte, Ereignis-Log, Meldungen, Ton-Anbindung, `localStorage`-Adapter, Dev-Werkzeuge. |
| `src/audio/`  | Ton über Web Audio: Busse und Ducking, Effekte und Signale, Umgebungsschichten, gestreamte Musik, Manifest der Dateien. Importiert nichts aus `src/sim/`, `src/render/` oder `src/ui/`.                          |

### Ebene 2: `src/sim/`

| Modul                                                    | Verantwortung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defs/goods.ts`, `buildings.ts`, `tiers.ts`, `timing.ts` | Spielwerte: Güter und Preise, Verkaufssättigung (`SELL_DROP`, `SELL_FLOOR`), Auftragsgüter und `ORDER_PREMIUM`, Lagerkapazität, Startkapital; Gebäude mit Kosten, Unterhalt, Zyklus, Standortregeln und Krisen-Flags (`flammable`, `stormAffected`, `fireProtection`); Stufen mit Bedürfnissen, Diensten, Steuern, Aufstiegskosten, Siegziel, Steuerstufen (`TAX_LEVELS`); Takte (Buchung, Wachstum, Steuersperre, Markt-Erholung, Aufträge, Krisen: `CRISIS_FIRST_TICK`, `STORM_*`, `FIRE_OUTAGE`, `BOOM_DURATION`). |
| `defs/crises.ts`                                         | Krisenwerte: Stufen `CRISIS_LEVELS` (`off`, `mild`, `normal` mit Periode), Standardstufen für Welt und neues Spiel, Gewichte `CRISIS_WEIGHTS`, `FIRE_HIT_RADIUS`, `BOOM_PCT`, `STORM_TICK_DIVISOR`, `CRISIS_SALT` (ADR-010).                                                                                                                                                                                                                                                                                          |
| `types.ts`                                               | Datentypen (`World`, `Tile`, `Building`, `HouseState`, `Order`, `TaxLevel`, `CrisisLevel`, `Crisis`, `Result`) und die Helfer `ok`/`fail`.                                                                                                                                                                                                                                                                                                                                                                            |
| `noise.ts`, `rng.ts`                                     | Seed-basiertes Value-Noise für die Karte; `rng.ts` (mulberry32) liefert je Auftrags- und je Krisenperiode eine neue Zufallsfolge (ADR-010).                                                                                                                                                                                                                                                                                                                                                                           |
| `mapgen.ts`                                              | Erzeugt die Insel aus einem Seed, prüft die Nachbedingungen, sucht den Kontor-Standort an der Küste.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `world.ts`                                               | `createWorld(seed, { crisisLevel? })` (Standard `off`) und Zugriffshelfer (Kachel, Footprint, Nachbarn, Radius, Mittelpunkt).                                                                                                                                                                                                                                                                                                                                                                                         |
| `placement.ts`                                           | `canPlace`/`canPlaceRoad`: Kartenrand, Bauland, Belegung und Standortregeln, mit deutschem Grund.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `build.ts`                                               | `placeBuilding`, `placeRoad`, `demolish`, `removeRoad`: prüfen, bezahlen, Kacheln belegen, Rückerstattung.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `roads.ts`                                               | `recomputeConnectivity`: Breitensuche über Wege ab dem Kontor, setzt `connected` und `notConnected`; `burning` hat Vorrang.                                                                                                                                                                                                                                                                                                                                                                                           |
| `supply.ts`                                              | Versorgungsradius von Kontor und angebundenen Marktplätzen (für Bauregel und Häuser).                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `production.ts`                                          | `tickProduction`: Fortschritt, Input-Entnahme, Ausstoss ins Lager, Zustände der Betriebe; Ausfall bei Brand, halber Takt bei Sturm.                                                                                                                                                                                                                                                                                                                                                                                   |
| `population.ts`                                          | `tickPopulation` (Versorgung, Dienste, Verbrauch, Wachstum mit Zielbelegung, Aufstieg mit Wartezeit der Steuerstufe; Dienste fallen bei Brand aus) und `tickTaxes` (Steuern × `pct` der Steuerstufe).                                                                                                                                                                                                                                                                                                                 |
| `tax.ts`                                                 | `setTaxLevel`: schaltet die globale Steuerstufe, mit Sperrzeit `TAX_SWITCH_LOCK`.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `economy.ts`                                             | Lager (`addStock`/`takeStock`), `checkAfford`/`pay`, Rückerstattung, `tickEconomy` (Unterhalt).                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `trade.ts`                                               | `buy` zu Fixpreisen; `sell` mit Verkaufssättigung (`sellPrice(world, good, n)` über `sellPct`, Aufschlag `BOOM_PCT` für das Boom-Gut); `tickMarket` (Erholung des Verkaufsanteils).                                                                                                                                                                                                                                                                                                                                   |
| `orders.ts`                                              | Handelsaufträge: `orderForPeriod` (rein, seed-abgeleitet), `tickOrders` (Angebot, Verfall), `deliverOrder`, `nextOrderTick`; `maxHouseTier`, `orderPool` (auch für den Boom).                                                                                                                                                                                                                                                                                                                                         |
| `crises.ts`                                              | Krisen (ADR-005/ADR-010, Nachtrag M6): `rollCrisis` (rein, seed-abgeleitet je Periode), `beginCrisis`, `tickCrises` (Ausfälle und Krise beenden, Periodenstart), `nextCrisisTick`, `crisisWindow`; Brand mit `fireTarget`, `isProtected`, Gebühr und Ausfall.                                                                                                                                                                                                                                                         |
| `queries.ts`                                             | Reine Abfragen für UI und Renderer: `goodsBalance`, `houseDiagnosis`, `coverageMask`, `placementZone`, `effectiveRefund`, `layoutKey` (Cache-Schlüssel als Positions-Hash, 8), `crisisView`, `unprotectedFlammables`, Abdeckung `'fire'`.                                                                                                                                                                                                                                                                             |
| `save.ts`                                                | `serialize`/`deserialize` (Version 3) mit Migrationskette v1 → v2 → v3 und Strukturprüfung; leitet die Anbindung nach dem Laden neu ab.                                                                                                                                                                                                                                                                                                                                                                               |
| `tick.ts`                                                | `step(world)`: Tick-Zähler, dann alle Systeme in fester Reihenfolge; `checkWin`.                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### Ebene 2: `src/render/`

Modulschnitt nach ISO §4: `iso.ts` kennt keine Kamera und importiert `sprites.ts` nicht; `camera.ts` importiert aus
`iso.ts`, nie umgekehrt. Alle Module lesen die Welt nur.

| Modul             | Verantwortung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `iso.ts`          | Kern der Isometrie, rein und ohne Kamera: `ISO_W`/`ISO_H` (64 × 32), Höhengrenzen `H_MAX`/`H_TOWER`, `ZOOM_STEPS`; `project`/`unproject`, `depthKey` (`2x + w + 2y + h`), `footprintOrigin` (Bau-Anker über der Footprint-Mitte), `radiusEllipse`; `sortedObjects` (Gebäude und Baumstempel gecacht je Welt und `layoutKey`, bewegte Objekte je Frame eingemischt); `spriteBounds`, `bodyHull`; Picking `buildingHulls`/`pickBuilding` mit Registrierung `setBodyShapes` (8, Projektion und Picking). |
| `camera.ts`       | Kamera (Position in Weltpixeln, Zoom), `screenToWorld`/`worldToScreen`, `screenToTile`/`screenToTileF`/`tileToScreen`, `tileCorners`, `clampToMap`, `zoomAt`, `centerOn`, Culling `visibleTileRange` (unten um `H_TOWER` erweitert), `groundMatrix` für den Boden.                                                                                                                                                                                                                                    |
| `palette.ts`      | Alle Farben (Spec 4.2) und Mischhelfer; andere Module leiten Zwischentöne daraus ab.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `terrainField.ts` | Reine Felder im Kachelraum: Küstenabstand, Terrainanteile, Verwerfung (`warp`), Tiefe; Grundlage für Boden, Schaum, Möwen und Klang.                                                                                                                                                                                                                                                                                                                                                                  |
| `terrain.ts`      | Bodentextur im Kachelraum in einer Offscreen-Ebene (`TEX` = 32 px je Kachel × Faktor 1, ab DPR 1,5 Faktor 2; halbe Kopie für Zoom ≤ 0,5); Teil-Neuzeichnung nach Bauaktionen über `layoutKey`. Ohne Baumkronen.                                                                                                                                                                                                                                                                                       |
| `trees.ts`        | Baumstempel je Variante (8), gecacht als kleine Canvas; Schatten und Bildbox je Baum.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `water.ts`        | Schaumsaum und Wellen unter der Bodenmatrix; Sturm über die Wetterstärke `w` (Amplitude, Breite, Periode, Feinschliff R111).                                                                                                                                                                                                                                                                                                                                                                          |
| `sprites.ts`      | Gebäudekörper je Typ (`SILHOUETTES` in Dachfamilien, Fallback je Kategorie), Wohnhaus je Stufe, Arbeitszeichen, Wege, Fensteranker; meldet beim Laden `bodyPolygons` über `setBodyShapes` an `iso.ts`.                                                                                                                                                                                                                                                                                                |
| `ship.ts`         | Händlerschiff an der ersten Wasserkachel neben dem Kontor, solange ein Auftrag läuft; Schatten und Höhe.                                                                                                                                                                                                                                                                                                                                                                                              |
| `life.ts`         | Leben (Spec 5.6): Weggraph (gecacht je `layoutKey`), Spaziergänger als reine Pose aus Zeit und Graph, Möwen je festem Zellraster über der Küste, Herdrauch am Morgen und Abend, Fensteranker und weicher Schein (`drawWindowLight`).                                                                                                                                                                                                                                                                  |
| `daynight.ts`     | Tageslicht: `lightAt(tick)` liefert Multiply-Faktoren, Phase (Tag, Abend, Nacht, Morgen) und Fensterstärke `windows` aus einer Farbkurve über `DAY_TICKS` = 6000; `isLit` (bewohnt bzw. Zustand `ok`).                                                                                                                                                                                                                                                                                                |
| `weather.ts`      | Wetter rein: `weatherMul`, `gradeAt(tick, weather)` (Licht mal Wetter, Luma ≥ 0,60), Vorrang `pickWeather(crisis, mood)`.                                                                                                                                                                                                                                                                                                                                                                             |
| `fx.ts`           | Krisen-Effekte im Bildraum: `drawFire` (Flammen, Rauch), `drawFireGlow` (Glühen und Bodenschein), `drawWarnRing`, `drawBoomCoin`, `drawRain`, `drawStormEdge`. Ohne Weltzugriff.                                                                                                                                                                                                                                                                                                                      |
| `limits.ts`       | Obergrenzen der Darstellung `CAPS` (normal und reduziert, Spec 12.2): Figuren, Möwen, Rauch, Regen, Flammen.                                                                                                                                                                                                                                                                                                                                                                                          |
| `overlays.ts`     | Radiusanzeige (Ellipse) und Abdeckungs-Umriss beim Platzieren, auch für die Feuerwache; Bedarfssymbole (ab Zoom 0.75) und roter Punkt; Cache der Abdeckungsmasken je Art, Schlüssel Welt-Identität und `layoutKey`.                                                                                                                                                                                                                                                                                   |
| `viewStats.ts`    | Sichtbezug für den Umgebungsklang: Anteile Wasser, Grün, Wald, Fels, Küste und Einwohner im Bild (nur Kacheln mit Mitte im Bild), Zoom.                                                                                                                                                                                                                                                                                                                                                               |
| `renderer.ts`     | Setzt einen Frame in 12 Ebenen zusammen (6, Ebenen je Frame). `render(…, fx: RenderFx)` mit `{ timeMs, dayNight, weather, reduceMotion, fire, boom, raster }`; Dev-Zähler `renderStats`.                                                                                                                                                                                                                                                                                                              |

### Ebene 2: `src/ui/`

| Modul              | Verantwortung                                                                                                                                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.ts`           | `startGame`: baut ein Spiel auf, Game-Loop, `onAction`, Werkzeugwahl (`selectTool`), Tempo (`setSpeed`), Autosave, Ton-Anbindung (Entsperren, Sichtbarkeit, `setAmbience` alle 250 ms), Krisen-Verdrahtung (`crisisFx`, `FireMemo`, Log), Panel-Wechsel, Speichern/Laden/Neu, `dispose`. |
| `input.ts`         | Maus, Tastatur und Touch: Kamera (Zoom, Pinch, Pan mit `applyKeys(dtMs)`), Hover-Prüfung, Kachel-Aktionen auf dem Ziel von `targetTile` beim Drücken, Weg-Ziehen, `cancelPointerAction`.                                                                                                 |
| `target.ts`        | `targetTile(world, cam, tool, sx, sy)`, rein: Auswählen und Abreissen über den Gebäudekörper (`pickBuilding`), Bauen über die Footprint-Mitte (`footprintOrigin`), Weg über die Bodenkachel.                                                                                             |
| `hotkeys.ts`       | Tastenbelegung (`TOOL_HOTKEYS`, inklusive `E` Feuerwache), `hotkeyAction`, Tempo-Helfer `withSpeed`/`afterPause`, Tastenname für Tooltips. Rein, ohne DOM.                                                                                                                               |
| `hud.ts`           | Kopfzeile: Geld, Steuern, Unterhalt und Bilanz, Tick, Geschwindigkeit, **Stumm** und **Einstellungen**, Spielstand-Buttons mit Laden-Auswahl und Krisenstufe für „Neu", Einwohner, Lager mit Warenbilanz (Dauerleistung, R115), Steuerregler, Auftrags- und Krisenkarte.                 |
| `settingsPanel.ts` | Einstellungs-Karte (Spec 9.2): Regler Gesamt, Musik, Umgebung, Effekte; Tag-Nacht; Bewegung reduzieren (Auto/An/Aus); Credits-Dialog; schliesst mit `Esc`, Hintergrund und Button, gibt den Fokus an den Öffner zurück. Keine Regeln: Werte gehen an `actions`.                          |
| `credits.ts`       | Credits-Liste aus Manifest und Schriften (`FONT_CREDITS`), Lizenzlinks; nur `createElement`/`textContent`.                                                                                                                                                                               |
| `crisis.ts`        | Krisenkarte (M6 13.3): reine Textfunktion über `crisisView` und Welt.                                                                                                                                                                                                                    |
| `crisisLog.ts`     | Ereignis-Log (M6 13.4): Einträge aus dem Vergleich zweier `crisisView`-Stände, höchstens 10, Meldungsart je Eintrag. Rein.                                                                                                                                                               |
| `eventLogView.ts`  | DOM des Logs als schwebende Box unten links (R112), Standard eingeklappt, verborgen ohne Einträge.                                                                                                                                                                                       |
| `crisisFx.ts`      | Abbildung der Krisensicht auf Effekte und Umgebung: `crisisFx` (Feuer, Boom, Krisenwetter, Feuerpegel), `nextFireMemo` (Rauch-Nachlauf 80 Ticks ohne Sim-Gedächtnis), `frameInputs` (ein Wetter für Render und Ton über `pickWeather`). Rein.                                            |
| `order.ts`         | Auftragskarte (Text, „Liefern") und Erkennung neuer bzw. verfallener Aufträge je Frame.                                                                                                                                                                                                  |
| `buildMenu.ts`     | Bauleiste nach Kategorien mit Kosten; markiert nicht bezahlbare Einträge; Tooltips mit Werten aus `src/sim/defs/`, dazu „Brennbar", „sturmanfällig" und bei der Feuerwache die ungeschützten Gebäude.                                                                                    |
| `inspect.ts`       | Info-Panel: Zustand, Produktion („Erzeugt X nicht — Betrieb brennt" bei Brand), Unterhalt, Brandschutz, bei der Feuerwache „Schützt N", Wohnhaus-Details aus `houseDiagnosis`, Abriss mit `effectiveRefund`, Handel.                                                                     |
| `trade.ts`         | Handelsdialog am Kontor mit Preisanteil je Gut, Boom-Marke und genauem Erlös je Verkaufsbutton; Buttons bleiben klickbar.                                                                                                                                                                |
| `soundEvents.ts`   | Frame-Vergleich für zeitbasierte Töne (Buchung, Auftrag, Aufstieg, Sieg, Krisensignale `alarm`, `stormWarning`, `boom`), Ton je Aktionsergebnis, Ereignisse zum Entsperren.                                                                                                              |
| `settings.ts`      | Einstellungen lesen und schreiben (gemeinsames Format M6/M7, Migration `volume` → `master`, fremde Felder in `extra`), `resolveReduceMotion`.                                                                                                                                            |
| `devParams.ts`     | Dev-Vorschau aus der Adresszeile (`?wetter=`, `w=`, `feuer=<id>,<id>`, `boom=1`, `signal=`, `perf=1`, `raster=1`); im Produktions-Build immer leer.                                                                                                                                      |
| `devProbes.ts`     | Dev-Sonden: `window.__inselAudio` aus `sound.debugState()` alle 250 ms, `window.__inselPerf` (Frame-Intervall und Render-Dauer, Median und p95 über 600 Frames).                                                                                                                         |
| `messages.ts`      | Meldungen (Toasts), begrenzt und entdoppelt; Warn-Toast; sticky Meldungen für Sieg und Fehler.                                                                                                                                                                                           |
| `storage.ts`       | Adapter zu `localStorage` für manuellen Platz und Autosave; listet ladbare Stände; fängt Speicherfehler ab und liefert `Result`.                                                                                                                                                         |
| `dom.ts`           | Kleine DOM-Helfer (`setField`, `costLine`).                                                                                                                                                                                                                                              |

### Ebene 2: `src/audio/`

| Modul         | Verantwortung                                                                                                                                                                                                                                                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sound.ts`    | Fassade `createSound(options, ctxFactory?, io?)`: Busse (Master, Musik, Umgebung, Effekte), Figuren je `SoundEvent` mit Drossel über `ctx.currentTime`, Signal-Samples mit synthetischem Rückfall, Ducking; `unlock`, `setMuted`, `setBus`, `setAmbience`, `setPhase`, `setCrisis`, `setHidden`, `debugState`, `dispose`. Ohne Web Audio eine stille Implementierung. |
| `mix.ts`      | Reine Mix-Regeln: Bus-Standards, `DUCK` und `duckGain` (Hüllkurve aus Signalen), Typen `AmbienceInput`, `ViewStats`, `Layer`, `Phase` (eigene Kopien, damit `src/audio/` nichts importiert).                                                                                                                                                                          |
| `ambience.ts` | Umgebung: reine `ambienceMix(input)` je Schicht (Meer, Wind, Vögel, Möwen, Nacht, Stadt, Regen, Sturm, Feuer), nahtlose Schleifen über zwei Quellen mit Überblendung, Sample-Lader nach Bedarf, Schichten-Motor mit Gleiten (1,5 s), Stopp nach 10 s Stille und synthetischen Rückfällen; Drossel 250 ms.                                                             |
| `music.ts`    | Musik: reine Auswahl `nextTrack` (Phase, nicht unter den letzten 2), Streaming-Player über ein Media-Element, Erstverzögerung 5–15 s, Pausen 30–90 s, Blende 3 s, Ende nach 2 Fehlschlägen in Folge.                                                                                                                                                                  |
| `manifest.ts` | Einzige Quelle der Dateinamen und Attribution (`MANIFEST`, `LAYER_FILES`, `SFX_FILES`), `assetUrl(BASE_URL, file)`.                                                                                                                                                                                                                                                   |

## 6. Laufzeitsicht

### Ein Frame mit Simulationsschritten

Der Loop in `app.ts` läuft per `requestAnimationFrame`. Er sammelt die verstrichene Zeit mal
Geschwindigkeit in einem Akkumulator und führt pro `TICK_MS` einen Schritt aus, höchstens 20 pro Frame.
Danach verschiebt er die Kamera per Tastatur (`applyKeys(dt)`), vergleicht den Frame mit dem vorigen
für Töne, Krisen-Log und Auftragsmeldungen, zählt die Autosave-Zeit, leitet aus der Krisensicht die
Eingänge für Render und Ton ab (`frameInputs`) und zeichnet. Der Umgebungsklang bekommt seine Eingänge
höchstens alle 250 ms (`AMBIENCE_EVERY_MS`), das HUD wird jeden zehnten Frame aktualisiert.

```mermaid
sequenceDiagram
  participant GL as app.loop
  participant Tick as tick.step
  participant SE as soundEvents
  participant Q as sim.queries
  participant CF as crisisFx / crisisLog
  participant Snd as audio.sound
  participant St as storage
  participant Ren as renderer
  GL->>GL: Akkumulator erhöhen (dt × Geschwindigkeit)
  loop solange Akkumulator ≥ TICK_MS, höchstens 20 pro Frame
    GL->>Tick: step(world)
  end
  GL->>GL: input.applyKeys(dt)
  GL->>SE: soundSnapshot(world), diffSoundEvents(vorher, jetzt)
  SE-->>GL: coin, order, upgrade, win, alarm, stormWarning, boom
  GL->>Snd: play(ereignis)
  GL->>Q: crisisView(world)
  GL->>CF: nextFireMemo(memo, vorher, jetzt), crisisLogEntries(vorher, jetzt)
  CF-->>GL: Rauch-Nachlauf, Log-Einträge (Toast je Eintrag)
  GL->>GL: orderChange: Meldung „Neuer Auftrag" bzw. „Auftrag verfallen"
  opt Spiel läuft und 120 s Laufzeit seit dem letzten Autosave, tick > 0
    GL->>St: saveAuto(world)
  end
  GL->>CF: frameInputs(crisisFx(view, tick, memo), null)
  CF-->>GL: render: fire, boom, weather · ambience: weather, fire
  opt höchstens alle 250 ms
    GL->>Snd: setAmbience(viewStats, phase, weather, reduced, fire), setPhase(phase)
  end
  GL->>Ren: render(ctx, world, cam, …, fx: timeMs, dayNight, weather, reduceMotion, fire, boom)
  GL->>GL: jeden zehnten Frame refresh() für HUD, Bauleiste, Panel, Log
```

Das Wetter eines Frames ist eines für Bild und Ton: `pickWeather` nimmt das Krisenwetter (Sturmwarnung als
`cloudy` mit steigendem `w`, Sturm als `storm` mit `w = 1`) vor dem Stimmungswetter; das Stimmungswetter ist
nicht umgesetzt (Kann K3, Parameter `null`), ohne Krise gilt `clear`. Im Dev-Build überschreibt die Vorschau
(`?wetter=`, `feuer=`, `boom=`) diese Eingänge.

### Ebenen je Frame (`renderer.ts`, ISO §5)

```mermaid
flowchart TB
  L1["1 Hintergrund waterDeep (Bildraum)"] --> L2["2 Boden: Ausschnitt der Terrain-Ebene unter der Bodenmatrix"]
  L2 --> L3["3 Wasser: Schaumsaum, Wellen (Bodenmatrix)"] --> L4["4 Wege (Bodenmatrix)"]
  L4 --> L5["5 Schatten: alle Polygone in einem Pfad, eine Füllung"]
  L5 --> L6["6 Sortierter Objektdurchgang nach depthKey: Bäume, Gebäude (mit Brand-Abdunklung), Schiff, Figuren"]
  L6 --> L7["7 Luft: Feuer und Rauch, Betriebsrauch, Herdrauch, Möwen (Rauch-Budget)"]
  L7 --> L8["8 Sturm-Randschatten"]
  L8 --> L9["9 Tönung: genau ein Multiply-Durchgang (Licht × Wetter)"]
  L9 --> L10["10 Additiver Durchgang: Fensterlicht, Laternen, Feuerglühen"]
  L10 --> L11["11 Regen und Sturmschlieren"]
  L11 --> L12["12 Signale ungetönt: Platzierung, Warnring, Boom-Münze, Bedarfssymbole, roter Punkt, Auswahl, Hover"]
```

Die Ebenen 2–4 liegen unter der Bodenmatrix (`withGround`, 1 Einheit = 1 Kachel); ab Ebene 5 wird im Bildraum
gezeichnet. Die Signale liegen über allen Objekten, damit ein verdecktes Gebäude an Symbol und Umriss erkennbar
bleibt (AK-ISO-15). Entfällt die Tönung (neutrales Licht, `clear`), entfällt Ebene 9; Ebene 10 läuft nur, wenn
Fenster, Laternen oder Feuer leuchten.

### Ein Simulationsschritt (`step`)

```mermaid
flowchart LR
  T["tick += 1"] --> P["Produktion"] --> B["Bevölkerung"] --> S["Steuern"] --> W["Wirtschaft (Unterhalt)"]
  W --> M["Markt-Erholung"] --> O["Aufträge"] --> K["Krisen"] --> V["Sieg"]
```

| System                     | Takt                                                                                    | Wirkung                                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tickProduction`           | jeder Tick                                                                              | Fortschritt, Input-Entnahme, Ausstoss, Zustände der Betriebe                                                                                                  |
| `tickPopulation`           | Verbrauch jeder Tick, Wachstum alle 50                                                  | Versorgung, Dienste, Verbrauch; Wachstum mit Zielbelegung und Aufstieg mit Wartezeit der Steuerstufe                                                          |
| `tickTaxes`, `tickEconomy` | Buchung alle 100 (`UPKEEP_INTERVAL`)                                                    | Steuern × `pct` der Steuerstufe, Unterhalt; dazwischen nur `stats`                                                                                            |
| `tickMarket`               | alle 10 (`SELL_RECOVERY_INTERVAL`)                                                      | jeder Verkaufsanteil +1 Prozentpunkt, höchstens 100; kein Geld, kein Lager                                                                                    |
| `tickOrders`               | ab 600 alle 900 (`ORDER_FIRST_TICK`, `ORDER_PERIOD`)                                    | zuerst Verfall (`tick > due`), dann Angebot aus `orderForPeriod`; kein Geld, kein Lager                                                                       |
| `tickCrises`               | jeder Tick; Periodenstart ab 2400 alle 600 (`normal`) bzw. 1200 (`mild`), nie bei `off` | Ausfälle bei `outageUntil` beenden, Krise nach `until` entfernen, bei Periodenstart Krise ziehen (`rollCrisis`) und beginnen; Brandgebühr wird sofort gebucht |
| `checkWin`                 | jeder Tick                                                                              | setzt `won` einmalig bei 50 Bürgern                                                                                                                           |

M7 ändert den Simulationsschritt nicht. Alle Takte ausser Aufträgen und Krisen folgen der Konvention `tick > 0 && tick % INTERVAL === 0` (ADR-005); der
Auftragstakt hat einen Versatz von 600 (Nachtrag in ADR-005). Die Höchststufe für den Güterpool eines
Auftrags stammt aus dem Zustand nach `tickPopulation` desselben Ticks. Krisen beginnen bei `tick ≥ 2400 && (tick − 2400) % P === 0` (Nachtrag M6 in ADR-005); der Krisenschritt läuft
nach Bevölkerung und Buchung (Boom-Pool aus der Höchststufe desselben Ticks) und vor dem Sieg, auch nach dem Sieg weiter.

### Eine Bauaktion

```mermaid
sequenceDiagram
  actor S as Spieler
  participant In as input
  participant Tg as target.targetTile
  participant App as app.onAction
  participant B as build.placeBuilding
  participant Pl as placement
  participant Ec as economy
  participant R as roads
  participant M as messages
  participant Snd as audio.sound
  participant Ren as renderer
  S->>In: Maustaste drücken (Bildpunkt sx, sy)
  In->>Tg: targetTile(world, cam, tool, sx, sy)
  Tg-->>In: Ursprung (x, y) oder null
  In->>App: Aktion tile (x, y)
  App->>B: placeBuilding(world, defId, x, y)
  B->>Pl: canPlace(world, defId, x, y)
  Pl-->>B: Result
  B->>Ec: checkAfford(world, cost)
  Ec-->>B: Result
  B->>Ec: pay(world, cost)
  B->>B: Gebäude anlegen, Kacheln belegen
  B->>R: recomputeConnectivity(world)
  B-->>App: ok oder reason
  alt ok
    App->>Snd: play(build)
  else nicht ok
    App->>M: showMessage(reason, error)
    App->>Snd: play(error)
  end
  App->>App: refresh() für HUD, Bauleiste, Panel
  Ren->>Ren: nächster Frame zeichnet den neuen Zustand
```

`targetTile` übersetzt den Bildpunkt je Werkzeug in eine Kachel des Kachelraums (8, Projektion und
Picking): Bauen nimmt den Ursprung, bei dem der Zeiger über der Footprint-Mitte liegt; ausserhalb der Karte
liegende Teile lehnt `canPlace` ab. Scheitert `canPlace` oder `checkAfford`, kehrt `placeBuilding` sofort mit
dem Grund zurück; die Welt bleibt unverändert. Wege entstehen schon beim Drücken und beim Ziehen (`placeRoad` je Kachel), Abriss
über `demolish` bzw. `removeRoad` mit demselben Ablauf. Auf Touch wirkt die Aktion erst beim Loslassen,
aber auf der Kachel des ersten Tippens, und entfällt, wenn ein zweiter Finger dazukam oder geschwenkt
wurde. Jeder Werkzeugwechsel (Bauleiste oder Hotkey) läuft über `selectTool` und bricht zuerst eine
laufende Zeiger-Aktion ab (`cancelPointerAction`).

## 7. Verteilungssicht

```mermaid
flowchart LR
  Dev["Entwickler-Rechner"]
  Vite["Vite-Dev-Server (make dev)"]
  Build["npm run build: Typprüfung und Vite-Build"]
  Dist["dist/: index.html, JS, CSS, Kopie von public/"]
  CI["GitHub Actions ci.yml: make check"]
  Pages["GitHub Actions pages.yml"]
  GHP["GitHub Pages"]
  Browser["Browser des Spielers"]
  Dev --> Vite
  Dev --> Build --> Dist
  Dev -->|"Push, Pull Request"| CI
  Dev -->|"Push auf main"| Pages
  Pages -->|"Build, upload-pages-artifact, deploy-pages"| GHP
  GHP -->|"statische Dateien"| Browser
  Vite --> Browser
```

- Das Spiel ist eine **statische Seite** ohne Backend. `vite.config.ts` setzt `base: './'`; alle Pfade
  im Build sind relativ, `dist/` läuft deshalb auch in einem Unterpfad (z. B. GitHub Pages eines Projekt-Repos).
- **Statische Assets** (ADR-011): Vite kopiert `public/` unverändert nach `dist/` (`audio/music`, `audio/amb`,
  `audio/sfx`, `fonts`); nichts davon liegt im JavaScript-Bundle. Das Spiel löst Pfade über
  `import.meta.env.BASE_URL` auf (`assetUrl`) und lädt sie erst nach der ersten Interaktion und nur bei Bedarf;
  Musik wird gestreamt. Budget `public/` ≤ 12 MB, Nachweis je Datei in `docs/CREDITS.md`, Prüfsummen und Budget
  prüfen Vitests unter `tests/assets/` (Assets-Strang). Stand: `public/` enthält 3 Musikstücke, 7 Umgebungsschleifen,
  4 Signal-Samples und 2 Schriftschnitte (~8 MB); die synthetischen Rückfälle greifen nur, wenn eine Datei
  fehlt oder nicht lädt.
- **Entwicklung:** `make dev` startet den Vite-Dev-Server; `make check` entspricht der CI. Dev-Vorschau und
  Sonden (`?wetter=`, `?perf=1`, `window.__inselAudio`, `window.__inselPerf`) gibt es nur im Dev-Build.
- **CI:** `.github/workflows/ci.yml` führt `make check` bei Push auf `main` und bei Pull Requests aus.
- **Deploy:** `.github/workflows/pages.yml` baut bei Push auf `main` (oder manuell) und veröffentlicht
  `dist/` auf GitHub Pages. Er greift erst, wenn Pages im Repo aktiviert ist (Quelle: GitHub Actions);
  auf dem Free-Plan braucht das ein öffentliches Repo (offene Entscheidung, Spec Abschnitt 6).

### Plattformgrenzen GitHub Pages (R130)

Quelle: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
und [About large files on GitHub](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github),
geprüft am 2026-10-02. Gemessen am selben Tag auf `main` (`make build`, `git count-objects -vH`).

| Grenze                | Wert laut GitHub                                    | Ist-Stand                                  | Anteil | Wache                          |
| --------------------- | --------------------------------------------------- | ------------------------------------------ | ------ | ------------------------------ |
| Veröffentlichte Seite | max. 1 GB (hart)                                    | `dist/` 8,68 MB, 20 Dateien                | 0,9 %  | `make pages-limit`, ab 500 MB  |
| Einzeldatei im Git    | 100 MiB blockiert, Warnung ab 50 MiB                | grösste Datei 2,47 MiB (Musikstück)        | 2,5 %  | `make pages-limit`, ab 50 MiB  |
| Quell-Repo            | empfohlen ≤ 1 GB, dringend ≤ 5 GB                   | Pack 11,2 MiB (GitHub `diskUsage` 11,8 MB) | 1,2 %  | keine, manuell                 |
| Bandbreite            | weich 100 GB/Monat                                  | nicht messbar (siehe unten)                | –      | keine                          |
| Deploy                | Abbruch nach 10 min                                 | Deploy-Job im Sekundenbereich              | –      | Workflow-Fehler                |
| Builds                | weich 10/h, gilt nicht für eigene Actions-Workflows | eigener Workflow `pages.yml`               | –      | entfällt                       |
| Ratenlimit            | HTTP 429 bei zu vielen Anfragen                     | –                                          | –      | keine                          |
| Nutzung               | kein kostenloses Hosting für Geschäft/E-Commerce    | nicht kommerziell                          | –      | bei Monetarisierung neu prüfen |

- **Wache:** `tools/pages/check.ts` (Grenzwerte als Konstanten mit Quelle in `tools/pages/limits.ts`, Test
  `tests/assets/pagesLimit.test.ts`) misst `dist/` nach dem Build. Sie läuft in `make check` (damit in der CI)
  und im Pages-Workflow vor dem Upload. Erreicht die Seite 50 % von 1 GB oder eine Datei 50 % von 100 MiB,
  schlägt sie fehl: Build bzw. Deploy stoppen, und es sind **Alternativen zu prüfen** (Eintrag in die
  Warteschlange mit Alternativen, R130).
- **Verhältnis zum Asset-Budget:** Das inhaltliche Budget `public/` ≤ 12 MB (AK-X1-03, `tests/assets/assets.test.ts`)
  ist enger und greift zuerst; die Pages-Wache ist die Plattformgrenze und erfasst zusätzlich das gebaute Bundle.
- **Bandbreite:** Für Pages gibt es keine Zugriffsstatistik; die Traffic-API (`repos/…/traffic/views`) zählt
  nur Aufrufe der Repo-Seite auf github.com. Abschätzung: Ein vollständiger Abruf aller Dateien kostet höchstens
  ~8,7 MB (Musik lädt nur bei Bedarf), 100 GB/Monat reichen also für rund 11 000 vollständige Abrufe; die
  50-%-Marke läge bei rund 5 700. Signal zum Handeln: E-Mail von GitHub oder HTTP 429 auf der Seite.
- **Repo-Grösse** wird nicht automatisch geprüft (CI klont flach); bei grösseren Asset-Lieferungen
  `git count-objects -vH` von Hand ansehen.
- **Merkliste Alternativen** (unbewertet, Bewertung erst bei Erreichen der Schwelle): Cloudflare Pages ·
  Netlify · itch.io (HTML5-Upload) · Codeberg Pages · eigener statischer Webserver.

## 8. Querschnittliche Konzepte

### Gebäudezustände (ADR-005)

Produktionsbetriebe tragen einen Zustand, der dem Spieler im Info-Panel erklärt, warum nichts
entsteht. Zustände bleiben stehen, bis ihre Ursache behoben ist.

```mermaid
stateDiagram-v2
  [*] --> ok
  ok --> waitingInput : Input fehlt bei Zyklusbeginn
  waitingInput --> ok : Input entnommen
  ok --> storageFull : Lager voll bei Zyklusende
  storageFull --> ok : nächste Einheit eingelagert
  ok --> notConnected : Anbindung verloren
  waitingInput --> notConnected : Anbindung verloren
  storageFull --> notConnected : Anbindung verloren
  notConnected --> ok : wieder angebunden
  ok --> burning : Brand ungeschützt
  waitingInput --> burning : Brand ungeschützt
  storageFull --> burning : Brand ungeschützt
  notConnected --> burning : Brand ungeschützt
  burning --> ok : Ausfall endet, angebunden
  burning --> notConnected : Ausfall endet, nicht angebunden
```

`burning` (M6) setzt der Brandbeginn zusammen mit `outageUntil` (letzter Ausfall-Tick); er hat Vorrang vor
`notConnected` und endet am Ende des Schritts `outageUntil` mit `connected ? 'ok' : 'notConnected'`. Nach der Wiederanbindung setzt `recomputeConnectivity` den Zustand auf `ok`; `waitingInput` bzw.
`storageFull` leitet die Produktion im nächsten Tick neu ab. Für Wohnhäuser gilt dieselbe Konvention:
`supplied`, `services` und `satisfied` werden jeden Tick neu abgeleitet.

### Anbindung

Ein Gebäude ist angebunden, wenn eine Wegkachel an seinen Footprint grenzt und diese über Wege
(4er-Nachbarschaft) mit einer Wegkachel am Kontor verbunden ist. `roads.ts` bestimmt das per
Breitensuche. Neu berechnet wird nur bei Änderungen: nach jedem Bau und Abriss von Weg oder Gebäude
und nach dem Laden. Das Kontor ist immer angebunden; Wohnhäuser nie, sie hängen am Versorgungsradius.
Betriebe, Marktplätze, Kapelle und Schule wirken nur angebunden.

### Versorgung

Ein Wohnhaus ist versorgt, wenn sein Mittelpunkt im Versorgungsradius (euklidisch, Mitte zu Mitte)
des Kontors oder eines angebundenen Marktplatzes liegt (`supply.ts`). Dieselbe Prüfung ist die
Bauregel für Wohnhäuser. Ein nicht versorgtes Haus erhält keine Waren; alle Güterbedürfnisse gelten
dann als unerfüllt. Dienste (Kapelle, Schule) wirken im Dienstradius, wenn das Dienstgebäude
angebunden ist.

### Bedürfnis-Akkumulatoren

Jedes Haus führt je Bedarfsgut einen Akkumulator `demand`. Pro Tick wächst er um
Einwohner × Rate / 100. Erreicht er 1, wird eine Einheit aus dem Lager entnommen und der Rest bleibt
stehen. Gelingt die Entnahme, gilt das Bedürfnis als erfüllt, sonst als unerfüllt, jeweils bis zum
nächsten Entnahmeversuch. Ein neues Haus startet mit Bedarf 1, damit die erste Einheit sofort
entnommen wird. Beim Aufstieg entnimmt `tryUpgrade` je neuem Bedarfsgut sofort eine Einheit und
zählt sie als ausgeliefert (Bedarf 0, erfüllt); so können zwei Häuser nicht auf dieselbe Einheit
aufsteigen, und das Haus zahlt schon in einer Buchung im selben Tick den vollen Steuersatz. Der Zeitpunkt
`satisfiedSince` wird bei jedem Tick mit unerfüllten Bedürfnissen neu gesetzt und steuert die
Wartezeit vor dem Aufstieg.

### Steuerstufe, Markt und Aufträge

- **Steuerstufe:** `world.taxLevel` (`low`/`normal`/`high`) wirkt global auf Steuer (`pct`, erst summiert,
  dann einmal abgerundet; „normal" rechnet bitgleich wie vor M5), Zielbelegung und Aufstiegs-Wartezeit
  (`TAX_LEVELS`). `setTaxLevel` sperrt das Umschalten für `TAX_SWITCH_LOCK` Ticks (`taxLockedUntil`).
- **Verkaufssättigung:** Je Gut hält `world.sellPct` den Verkaufsanteil (ganzzahlig 30…100). `sellPrice`
  summiert den Erlös Einheit für Einheit mit sinkendem Anteil und rundet einmal ab; `sell` senkt den
  Anteil danach, `tickMarket` hebt ihn wieder an. Kaufpreise und Aufträge berühren `sellPct` nicht.
- **Aufträge:** Höchstens ein Auftrag (`world.order`) ist aktiv, weil die Laufzeit (600) kürzer ist als
  die Periode (900). Gut und Menge kommen aus `orderForPeriod(seed, k, maxTier)` (ADR-010). `deliverOrder`
  liefert nur vollständig und ist auch bei negativem Geld erlaubt; ein verfallener Auftrag hat keine Strafe.

### Krisen (M6)

- **Stufe:** `world.crisisLevel` (`off`/`mild`/`normal`) wird nur beim neuen Spiel gesetzt (`createWorld(seed,
{ crisisLevel })`); `createWorld` ohne Angabe setzt `off`, damit der Balancing-Lauf bitgleich bleibt. Die UI
  startet „Neu" mit der Stufe aus den Einstellungen (Standard `normal`), „Laden" übernimmt die Stufe des Stands.
- **Periode:** ab `CRISIS_FIRST_TICK` = 2400 alle 600 (`normal`) bzw. 1200 (`mild`) Ticks genau eine Krise;
  Art und Ziel zieht `rollCrisis(seed, k, maxTier, rect)` rein aus Seed und Periodennummer (ADR-010, Nachtrag M6).
  Die längste Krise ist kürzer als die kürzeste Periode, es laufen nie zwei zugleich.
- **Wirkungen:** Brand (ungeschützt: Gebühr, `progress = 0`, Zustand `burning` für 200 Ticks; geschützt durch eine
  angebundene Feuerwache im Radius 8: kein Schaden), Sturm (200 Ticks Warnung, dann 300 Ticks halbe Leistung der
  `stormAffected`-Betriebe), Boom (300 Ticks `BOOM_PCT` = 150 % Verkaufspreis eines Guts).
- **Eine Sicht für alle:** `crisisView(world)` ist die einzige Quelle für Krisenkarte, Log, `crisisFx` und Ton.
  Den Rauch-Nachlauf nach dem Brand hält die UI selbst (`FireMemo`, 80 Ticks), weil `world.crisis` und
  `outageUntil` am Ende des Schritts `until` gemeinsam verschwinden. Log und Merkstruktur gehören nicht zum
  Spielstand; nach „Laden" gilt der geladene Stand als Vergleichsbasis (kein Eintrag, kein Ton für eine laufende
  Krise).
- **Bilanz bleibt Dauerleistung** (M6-Spec 11, R115): `goodsBalance` ist nominal; ein Brand ändert die HUD-Bilanz
  nicht, nur das Info-Panel des Gebäudes zeigt den Ausfall.

### Sim-Abfragen und Caches im Renderer

`src/sim/queries.ts` liefert UI und Renderer abgeleitete Sichten ohne Seiteneffekt: Warenbilanz
(nominal aus angebundenen Betrieben und versorgten Häusern), Diagnose je Haus (dieselbe Liste für
Info-Panel und Kartensymbol), Abdeckungsmasken, Platzierungszonen, die tatsächliche Rückerstattung und die
Krisensicht.

`layoutKey(world)` ist der gemeinsame Cache-Schlüssel der Darstellung. Er ändert sich bei jedem Bau, Abriss,
Weg und jeder Änderung von Anbindung oder Ausfall, nicht durch `step()` allein. Seit R114 (Punkt 5, Branch
`fix/layoutkey`, Merge im Final-Gate) ist er ein **Positions-Hash**: zwei unabhängige FNV-1a-Bahnen (je 32 Bit)
über `nextBuildingId`, die Indizes aller Wegkacheln und je Gebäude Id, Lage, Typ und die Bits „angebunden" und
„Ausfall". Der frühere Schlüssel aus Summen (Summe der Wegindizes, Summe der Ids) konnte bei verschobenen Wegen
kollidieren und einen veralteten Cache liefern. Nutzer des Schlüssels:

| Cache                                  | Modul         | Inhalt                                                       |
| -------------------------------------- | ------------- | ------------------------------------------------------------ |
| Teil-Neuzeichnung der Terrain-Ebene    | `terrain.ts`  | belegte Kacheln (keine Grasbüschel unter Bebauung und Wegen) |
| feste Objekte für die Tiefensortierung | `iso.ts`      | Gebäude und Baumstempel, sortiert nach `depthKey`            |
| Weggraph der Spaziergänger             | `life.ts`     | Knoten und Kanten des Wegenetzes                             |
| Abdeckungsmasken und Umrisse           | `overlays.ts` | je Art (Versorgung, Dienst, Feuer), nicht je Frame           |

Bekannte Kosten: `layoutKey` läuft bis zu fünfmal je Frame (etwa 0,2–0,4 ms); ein Frame-Memo bzw. ein
eigener Weg-Schlüssel für `life.ts` ist möglich (`docs/beobachtungen.md`). Die Diagnose der Bedarfssymbole
läuft ungecacht je sichtbarem Haus und Frame; gemessen 2.5–3.1 ms Arbeit je Frame bei 57 Gebäuden (M5).

### Projektion und Picking (ADR-012, R113)

- **Kachelraum bleibt die Wahrheit:** Die Sim kennt nur Kacheln. `project(fx, fy)` bildet Kachelkoordinaten
  auf Weltpixel der Iso-Ebene ab (Raute 64 × 32 bei Zoom 1), `unproject` umgekehrt; `camera.ts` setzt Position
  und Zoom darauf. Die Trefferprüfung auf dem Boden ist exakt (`floor` der Umkehrung), ohne Tabelle.
- **Tiefensortierung:** Objekte mit Höhe werden nach `depthKey = 2x + w + 2y + h` sortiert, bei Gleichstand nach
  x, Art und Id. Der Schlüssel ist nur für quadratische Footprints (`w = h`) bewiesen; ein späteres Gebäude mit
  `w ≠ h` braucht einen paarweisen Vergleich (ADR-012).
- **Ziel je Werkzeug** (`src/ui/target.ts`): Weg auf die Bodenkachel; Bauen auf den Ursprung, bei dem der Zeiger
  über der Footprint-Mitte liegt (`footprintOrigin`, ISO D-13); Auswählen und Abreissen auf das vorderste
  Gebäude unter dem Zeiger, sonst die Bodenkachel.
- **Picking über die Silhouette (R113):** `buildingHulls(world)` liefert je Gebäude in Zeichenreihenfolge die
  konvexe Körperhülle (Sechseck aus Footprint-Raute und Höhe) und lazy die tatsächlich gezeichneten
  Körperpolygone. `pickBuilding` prüft von vorn nach hinten: Die Hülle ist nur Vorfilter, entscheidend ist,
  ob der Punkt in einem gezeichneten Polygon liegt. So fängt die leere Hüllenfläche neben einem Kirchturm keine
  Klicks für dahinterstehende Häuser ab (AK-ISO-15). ADR-012 Punkt 6 („exakte Körperhülle") ist als
  „gezeichneter Körper" ausgelegt.
- **Registrierung `setBodyShapes`:** Die Polygone kennt nur `sprites.ts`. Damit `iso.ts` rein bleibt und
  `sprites.ts` nicht importiert (kein Zyklus, ISO §4), meldet `sprites.ts` beim Laden `bodyPolygons` über
  `setBodyShapes(fn)` an. Ohne Registrierung (z. B. in Tests, die `sprites.ts` nicht laden) gilt die Hülle als
  Körper. Wer einen neuen Gebäudetyp zeichnet, muss seine Polygone in `bodyPolygons` mitliefern, sonst trifft
  das Picking nur die Hülle bzw. nichts.
- Das Bildrechteck (`spriteBounds`) dient nur Culling und Effekten, nie dem Picking.

### Licht, Wetter und Obergrenzen (M7)

- **Ein Multiply, ein Additiv:** Die Tönung eines Frames ist `gradeAt(tick, weather)` = `lightAt(tick).mul` ⊙
  `weatherMul(weather)` in genau einem Multiply-Durchgang; der Luma-Faktor bleibt ≥ 0,60 (ohne Wetter ≥ 0,75).
  Fensterlicht, Laternen und Feuerglühen liegen in höchstens einem additiven Durchgang (`'lighter'`). Fenster
  leuchten nur bei `windows > 0` und `isLit`; Laternen folgen `windows` unabhängig von `isLit` (R114).
- **Bewegung reduzieren:** `reduceMotion` (Auto folgt `prefers-reduced-motion`) senkt alle Obergrenzen aus
  `limits.ts` auf die reduzierten Werte und halbiert die Wellenamplitude. Die Obergrenzen gelten unabhängig
  davon immer (Figuren 40, Möwen 8, Rauch 150, Regen 350, Flammen 24 je Brand).
- **Deterministisch ohne Zustand:** Figuren, Möwen, Rauch und Wellen sind reine Funktionen von `timeMs`, Seed
  und Welt; es gibt keine Partikel-Listen über Frames hinweg. Die einzigen Zustände sind Caches (je Welt und
  `layoutKey`, Baumstempel je Variante und Zoom).

### Ton (M7)

- **Busse:** Quelle → Bus → Master → Ausgang. Busse `master` (0,4), `music` (0,5), `ambience` (0,7), `effects`
  (1,0); Stumm schaltet den Master. Signale (`error`, `alarm`, `stormWarning`, `order`, `win`) laufen über den
  Effekte-Bus, damit niemand sie getrennt stummschaltet; die übrigen Effekte liegen 6 dB darunter.
- **Ducking:** Ein Signal senkt Musik und Umgebung auf × 0,5 (Angriff 50 ms, Halten Figurdauer + 300 ms,
  Freigabe 600 ms); die Hüllkurve ist die reine Funktion `duckGain`.
- **Effekte:** synthetische Figuren je `SoundEvent` mit Drossel über `ctx.currentTime`; Signal-Samples (Glocke,
  Nebelhorn, Münzen) mit synthetischem Rückfall.
- **Umgebung:** Die UI liefert höchstens alle 250 ms `setAmbience({ view: viewStats, phase, weather, reduced,
fire })`; `src/audio/` erhält nur Zahlen und importiert nichts aus Sim, Render oder UI. `ambienceMix` bildet
  daraus neun Schichtpegel, die mit 1,5 s gleiten; Datei-Schichten laufen als nahtlose Schleife aus zwei
  Quellen mit Überblendung, eine Schicht mit Pegel 0 über 10 s wird gestoppt.
- **Musik:** nach `unlock()` 5–15 s Wartezeit, dann ein Stück der Phase (`nextTrack`), danach 30–90 s Pause;
  Streaming über ein Media-Element (`preload = 'none'`), nie ganz dekodiert; Phasenwechsel erst beim nächsten
  Stück.
- **Rückfälle:** Ohne Datei spielt jede Schicht ihren synthetischen Rückfall (Meer, Vögel, Nacht, Regen,
  Feuer) oder entfällt (Möwen); Musik endet nach 2 Fehlschlägen in Folge still für die Sitzung. Ohne Web Audio
  oder bei einer werfenden Fabrik liefert `createSound` eine stille Implementierung. Nichts davon meldet oder
  wirft.
- **Entsperren und Sichtbarkeit:** Der `AudioContext` läuft erst nach der ersten Nutzergeste (`pointerup`
  oder `keydown`); ist der Tab verborgen, hält `setHidden` Kontext und Musik an.
- **Tests ohne Browser:** Netz und Medien kommen per Injektion (`io = { fetchBuffer, mediaFactory, baseUrl }`),
  Vitest nutzt einen Fake-`AudioContext`.

### Assets und Laden (ADR-011)

- Statische Dateien liegen unter `public/<art>/<gruppe>/`, je Art genau ein Format (MP3, WOFF2). Einzige Quelle
  für Dateinamen und Attribution ist `src/audio/manifest.ts` (Schrift: `src/ui/credits.ts`); der
  Credits-Dialog liest beide.
- Beim Start lädt nichts aus dem Budget ausser der Schrift per CSS (`font-display: swap`, Fallback-Kette).
  Nach `unlock()` laden Umgebungsschichten, deren Zielpegel einmal > 0 war, als `AudioBuffer`; Musik streamt.
- Nachweis je Datei in `docs/CREDITS.md` und `docs/licenses/`, Prüfsummen in `tests/assets/sha256.json`, Budget
  per Vitest. **Stand:** Alle Dateien des Manifests liegen unter `public/` (Abgleich AK-X1-01 in `tests/assets/`);
  der Credits-Dialog listet Manifest und `FONT_CREDITS`. Nur bei leerer Liste zeigt er „Fremde Assets sind derzeit
  nicht eingebunden".

### Persistenz

- `serialize(world)` ist `JSON.stringify(world)`; die Welt enthält ein Versionsfeld (`version: 3`,
  `SAVE_VERSION`). Gespeichert wird immer Version 3.
- `deserialize(json)` wirft nie. Ältere Stände durchlaufen die Migrationskette v1 → v2 (`migrateV1ToV2`:
  `taxLevel = 'normal'`, `taxLockedUntil = 0`, `sellPct` überall 100, `order = null`) → v3 (`migrateV2ToV3`:
  `crisisLevel = 'off'`, `crisis = null`); danach prüft sie
  JSON, Version, Kartengrösse und Kachelanzahl, die Gebäude (bekannte `defId`, Koordinaten), das Kontor,
  alle Güter im Lager, `stats`, `won`, `tick`, `nextBuildingId` und die v2-Felder (`taxLevel`,
  `taxLockedUntil`, `sellPct` ganzzahlig 30…100, `order` passend zu Tick und Periode), die v3-Felder (`crisisLevel` bekannt; `crisis` passend zu Stufe,
  Periode und Tick; je Gebäude `outageUntil` nur mit `state 'burning'` und `tick < outageUntil ≤ tick + 200`). Fehler ergeben
  `Ungültiges Format`, `Unbekannte Version` oder `Beschädigter Spielstand`. Ein echter v1-Stand liegt als
  Fixture in `tests/sim/fixtures/save-v1.json`, ein v2-Stand in `tests/sim/fixtures/save-v2.json`.
- Menge und Prämie eines laufenden Auftrags werden nur strukturell geprüft (nicht gegen die aktuellen
  Spielwerte), damit geänderte Werte alte Stände nicht abweisen. Die Auftrags- und Krisentakte
  (`CRISIS_FIRST_TICK`, Periodenlängen, `STORM_*`, `FIRE_OUTAGE`, `BOOM_DURATION`) gehen dagegen in die
  Prüfung ein; ändern sie sich, braucht es eine Migration.
- Nach dem Laden wird `recomputeConnectivity` aufgerufen; ein gespeichertes `connected` wird nicht
  übernommen.
- `src/ui/storage.ts` kapselt `localStorage`: manueller Platz `inselreich.save.v1` (der Schlüssel benennt
  den Platz, nicht das Format) und Autosave `inselreich.save.auto`. Der Autosave schreibt alle 120 s
  Echtzeit laufenden Spiels (Pause zählt nicht), nie bei Tick 0; ein Schreibfehler erscheint je Spiel
  einmal. `listSaves` nennt nur Stände, die `deserialize` akzeptiert; gibt es zwei, zeigt „Laden" eine
  Auswahl. Laden prüft zuerst und ersetzt das laufende Spiel nur bei Erfolg; sonst bleibt es unverändert.
  Laden behält Tempo und — bei gleichem Seed — die Kamera.
- **Einstellungen** (`src/ui/settings.ts`, Schlüssel `inselreich.settings`), gemeinsames Format von M6 und M7
  (M7-Spec 9.4, M6-Spec 13.1):
  `{ muted, master, music, ambience, effects, dayNight, reduceMotion, crisisLevel }`, Standard
  `{ false, 0.4, 0.5, 0.7, 1, true, 'auto', 'normal' }`. `reduceMotion` ist `'auto' | 'on' | 'off'`,
  `crisisLevel` die Stufe für das nächste „Neu" (nicht die des laufenden Spiels).
  - **Migration `volume` → `master`:** Fehlt `master`, gilt ein gültiges M5-Feld `volume` als `master`. `volume`
    wird danach nie mehr geschrieben.
  - **Fremde Felder bleiben erhalten:** `parseSettings` legt unbekannte Schlüssel in `extra` ab,
    `serializeSettings` schreibt sie unverändert zurück (eigene Felder überschreiben gleichnamige fremde). So löscht
    keine Fassung ein Feld einer anderen.
  - Ungültige Einzelwerte fallen einzeln auf den Standard zurück (Lautstärken auf 0…1 geklemmt); kaputtes JSON
    oder ein gesperrter Speicher ergibt den Standard, ein Schreibfehler wird als `Result` gemeldet.
  - Die Einstellungen gehören nicht zum Spielstand und überleben „Neu" und „Laden". M7 ändert das
    Spielstand-Format nicht (weiter v3).
- Laden und «Neu» beenden das laufende Spiel über `dispose()` (Loop, ResizeObserver, Listener,
  Meldungsfläche, HUD-Timer, Einstellungs-Karte, Log-Box, Sonden, Ton) und starten ein neues. Ein gewonnener Stand zeigt das Siegbanner nicht erneut.

### Fehlerbehandlung

- Sim-Aktionen liefern `Result` = `{ ok: true }` oder `{ ok: false, reason }` mit deutschem Grund; sie
  werfen nicht. Die UI zeigt den Grund als Meldung und spielt den Fehlerton. Buttons, die sicher
  scheitern (Bauleiste, Handel, Steuerregler in der Sperre), sind nur gedämpft und bleiben klickbar,
  damit der Klick den Grund nennt.
- `startGame` fängt Fehler beim Aufbau (z. B. keine gültige Karte) ab und zeigt eine bleibende Meldung.
- Ein Laufzeitfehler im Loop hält das Spiel an und erscheint als bleibende Meldung, statt still
  weiterzulaufen.
- Meldungen sind auf drei sichtbare begrenzt; dieselbe Meldung innert einer Sekunde erscheint nur einmal.

### Determinismus und Seed

- Die Karte entsteht aus einem Seed (Value-Noise plus radiale Inselmaske). Erfüllt sie die
  Nachbedingungen nicht, versucht `mapgen` die folgenden Seeds; `world.seed` hält den tatsächlich
  verwendeten Seed fest, das HUD zeigt ihn als «Karte».
- Die Simulation nutzt keine Uhr und kein DOM (ESLint verbietet u. a. `Date`, `performance`,
  `setTimeout` in `src/sim/**`). Zufall gibt es nur seed-abgeleitet über `rng.ts`: Handelsaufträge ziehen je
  Periode eine neue RNG-Instanz aus `seed` und Periodennummer ([ADR-010](adr/ADR-010-zufall-je-periode.md)). Krisen ziehen je Periode eine eigene Instanz
  mit der zweiten Konstante `CRISIS_SALT` (ADR-010, Nachtrag M6); die Stufe `off` zieht keinen Zufall.
  `step()` zieht sonst keine Zufallszahlen, der Save trägt keinen RNG-Zustand. Gleiche Welt und gleiche
  Aktionen ergeben denselben Verlauf.
- Nur die UI wählt für ein neues Spiel einen Seed aus der aktuellen Zeit.
- Die Darstellung ist ebenfalls ohne Zufallsstrom: Baumvarianten, Figuren, Möwen und Rauch leiten sich über
  `hash2` aus Seed, Kachel und `timeMs` ab. Nur der Ton nutzt `Math.random` (Musikwahl, Abstände der
  Stadtgeräusche); in Tests wird `rand` eingespeist.

## 9. Architekturentscheidungen

| Entscheidung                                                                                     | Dokument                                                                |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| TypeScript, Vite, Canvas 2D, keine Laufzeit-Abhängigkeiten (Ausnahmen nur per ADR und L0-Ruling) | [ADR-001](adr/ADR-001-tech-stack.md)                                    |
| Simulation als reines Datenmodell, getrennt von Darstellung                                      | [ADR-002](adr/ADR-002-sim-render-trennung.md)                           |
| Top-down statt Isometrie im MVP (ersetzt durch ADR-012)                                          | [ADR-003](adr/ADR-003-topdown-statt-isometrie.md)                       |
| Eigener Titel, eigene Grafik, eigene Spielwerte (abgelöst)                                       | [ADR-004](adr/ADR-004-eigene-assets.md)                                 |
| Tick-Reihenfolge und Zustandssemantik der Gebäude                                                | [ADR-005](adr/ADR-005-tick-reihenfolge-und-zustaende.md)                |
| Eigene oder offen lizenzierte Inhalte mit Nachweis                                               | [ADR-006](adr/ADR-006-offene-lizenzen.md)                               |
| Studio-Hierarchie                                                                                | [ADR-007](adr/ADR-007-studio-hierarchie.md)                             |
| Studio-Telemetrie                                                                                | [ADR-008](adr/ADR-008-studio-telemetrie.md)                             |
| Studio-Autonomie und Lernen                                                                      | [ADR-009](adr/ADR-009-studio-autonomie-und-lernen.md)                   |
| Zufall je Auftragsperiode aus dem Seed statt RNG-Strom                                           | [ADR-010](adr/ADR-010-zufall-je-periode.md)                             |
| Balancing-Revision (Steuern, Luxusverbrauch)                                                     | [Kurz-Spec Balancing](superpowers/specs/2026-09-30-balancing-design.md) |
| M5: Steuerregler, Sättigung, Aufträge, Ambiente, Save v2                                         | [M5-Spec](superpowers/specs/2026-09-30-m5-spielerlebnis-design.md)      |
| Asset-Pipeline: Ablage `public/`, Formate, Budget, Laden nach Bedarf, Manifest, Nachweis         | [ADR-011](adr/ADR-011-asset-pipeline.md)                                |
| Isometrische Darstellung, Kachelraum bleibt die Wahrheit, Picking über den Körper                | [ADR-012](adr/ADR-012-isometrische-darstellung.md)                      |
| M6: Krisen, Feuerwache, Save v3                                                                  | [M6-Spec](superpowers/specs/2026-09-30-m6-krisen-design.md)             |
| M7: Licht, Wetter, Leben, Ton mit Bussen, Einstellungen                                          | [M7-Spec](superpowers/specs/2026-09-30-m7-stimmung-design.md)           |
| M7: Isometrie im Detail (Projektion, Ebenen, Picking, Tests)                                     | [Nachtrag M7-ISO](superpowers/specs/2026-10-01-m7-iso-design.md)        |
| Picking über die gezeichnete Silhouette (Auslegung ADR-012 Punkt 6)                              | Ruling R113 (`docs/studio/rulings.md`)                                  |

## 10. Qualitätsanforderungen

| Szenario                        | Stimulus                                                                   | Erwartete Reaktion                                                                     | Nachweis                                                                        |
| ------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Determinismus                   | Karte zweimal mit gleichem Seed erzeugen                                   | Identische Karte; `world.seed` erzeugt dieselbe Karte erneut                           | `tests/sim/mapgen.test.ts`                                                      |
| Save-Round-trip                 | Gespielte Welt speichern und laden                                         | Geladene Welt ist inhaltlich gleich, Sieg bleibt erhalten                              | `tests/sim/save.test.ts`                                                        |
| Kaputter Spielstand             | Müll, falsche Version oder fehlende Felder laden                           | Grund statt Exception, laufendes Spiel bleibt unverändert                              | `tests/sim/save.test.ts`, manuell (`app.ts`)                                    |
| Anbindung nach Laden            | Stand mit `connected: true` ohne Weg laden                                 | Gebäude ist nach dem Laden `notConnected`                                              | `tests/sim/save.test.ts`                                                        |
| Spielbarkeit                    | Skriptgesteuerte Kolonie mit Startkapital                                  | Sieg bis Tick 7500 (Lauf bis 9000), Geld am Ende > 0; gemessen Sieg bei Tick 6050      | `tests/sim/balance.test.ts`                                                     |
| Migration                       | Echten v1-Spielstand laden                                                 | Stand lädt als v2 mit Standardwerten für Steuer, Verkaufsanteil und Auftrag            | `tests/sim/save.test.ts` (Fixture `save-v1.json`)                               |
| Determinismus mit Aktionen      | Partie mit Steuer, Verkauf, Liefern, Speichern/Laden zweimal spielen       | Gleiche Ergebnisse der Aktionen und gleicher Endstand; genau 10 Aufträge in 9000 Ticks | `tests/sim/m5-session.test.ts`                                                  |
| Ton ohne Browser                | Fake-`AudioContext` statt Web Audio                                        | Drossel, Stumm, Lautstärke, Entsperren, Sichtbarkeit und stiller Rückfall prüfbar      | `tests/audio/sound.test.ts`                                                     |
| Overlay-Cache                   | Viele Frames ohne Änderung der Anordnung                                   | Abdeckungsmaske wird nur bei neuem `layoutKey`, neuer Welt oder anderer Art berechnet  | `tests/render/overlays.test.ts`                                                 |
| Takt-Vorhersage                 | 100 bzw. 300 Schritte ab Tick 0 ausführen                                  | Steuern und Unterhalt genau bei Tick 100, 200, 300 …: 300 Schritte = drei Buchungen    | `tests/sim/taxes.test.ts`, `tests/sim/production.test.ts`, ADR-005              |
| Kein DOM in der Simulation      | DOM- oder Zeit-Global in `src/sim/` verwenden                              | Lint-Fehler, `make check` schlägt fehl                                                 | `eslint.config.js`                                                              |
| Projektion                      | Kachel → Bild → Kachel, Kanten der Raute, Culling                          | Rundreise exakt, Kanten eindeutig, kein sichtbares Objekt fällt aus dem Culling        | `tests/render/iso.test.ts`, `tests/render/camera.test.ts`                       |
| Verdeckung und Picking          | Zeiger auf sichtbare Wand bzw. Dach eines Gebäudes hinter einem höheren    | Auswahl trifft das sichtbare Gebäude, nicht die leere Hülle davor (R113)               | `tests/render/verdeckung.test.ts`, `picking.test.ts`, `tests/ui/target.test.ts` |
| Lesbarkeit bei Licht und Wetter | Jede Wetterart und Stärke, jeder Tick eines Tages                          | Luma-Faktor der Tönung ≥ 0,60 (ohne Wetter ≥ 0,75)                                     | `tests/render/weather.test.ts`, `daynight.test.ts`                              |
| Obergrenzen                     | Sturm, Feuer, viele Einwohner, reduzierte Bewegung                         | Figuren, Möwen, Rauch, Regen, Flammen bleiben unter `CAPS`                             | `tests/render/fx.test.ts`, `life.test.ts`                                       |
| Frame-Budget                    | `leistung-50`, ganze Insel, Sturm und Feuer, sichtbares Chrome 1920 × 1080 | Median ≥ 30 fps (hart), Ziel ≥ 60 fps; Render p95 gemessen ≤ 2,4 ms (QA-R3)            | Browser-Check mit `?perf=1` (M7-Spec 12.1)                                      |
| Terrain-Aufbau                  | Neue Welt; Bauaktion                                                       | Aufbau ≤ 1500 ms, Teil-Neuzeichnung ≤ 8 ms                                             | `tests/render/terrain.test.ts`                                                  |
| Einstellungs-Migration          | M5-Einstellung `{ muted, volume, dayNight }` und fremde Felder laden       | `master = volume`, kein `volume` beim Schreiben, fremde Felder unverändert             | `tests/ui/settings.test.ts`                                                     |
| Ton ohne Dateien                | Lader und Media-Element schlagen fehl                                      | Synthetischer Rückfall je Schicht, Musik endet nach 2 Fehlschlägen, nichts wirft       | `tests/audio/ambience.test.ts`, `music.test.ts`                                 |
| Krisen-Lauf                     | Controller-Kolonie mit Krisenstufe `normal` und `mild`                     | Sieg bis Tick 8000, Geld am Ende > 0; `off` bitgleich zur Referenz                     | `tests/sim/balance-crises.test.ts`                                              |
| Plattformgrenze Pages           | Gebaute Seite ≥ 500 MB oder eine Datei ≥ 50 MiB                            | `make check` und Pages-Workflow schlagen fehl, Alternativen prüfen (R130)              | `tests/assets/pagesLimit.test.ts`, `tools/pages/check.ts`                       |

## 11. Risiken und technische Schulden

Offene Befunde werden in [`docs/beobachtungen.md`](beobachtungen.md) gesammelt. Die wichtigsten:

- **Kippkante im Balancing:** Der Controller-Lauf im Balancing-Test kippt sprunghaft. Mit
  Verkaufssättigung liegt der Sieg bei Tick 6050 (Grenze 7500, Marge 1450), minMoney bei 57. Schon ein
  Abschlag von 2 statt 1 Prozentpunkt je verkaufter Einheit schiebt den Sieg auf etwa 7550 (rot). Die
  scharfe Absicherung ist der Test „10 Holz aus 100 % bringen genau 38" (AK-S2-01). Die Eskalationsregel
  der Balancing-Kurz-Spec ist ausgeschöpft; fällt die Marge unter etwa 500 Ticks, braucht es eine neue
  Kurz-Spec.
- **Auftragstakte in der Save-Prüfung:** Ein laufender Auftrag wird gegen `ORDER_FIRST_TICK`,
  `ORDER_PERIOD` und `ORDER_DURATION` geprüft. Ändern sich diese Takte, werden Stände mit laufendem
  Auftrag abgewiesen; dann braucht es eine Migration oder eine gelockerte Prüfung.
- **Diagnose ungecacht:** `houseDiagnosis` läuft je sichtbarem Haus und Frame. Gemessen unkritisch
  (57 Gebäude, 2.5–3.1 ms je Frame, Headless ohne GPU); bei deutlich grösseren Städten ein Cache je Tick.
- **Nur headless geprüft:** Touch-Bedienung, Ton und das mobile Layout (HUD belegt bei 390 px etwa 46 %
  der Höhe) sind im Headless-Browser abgenommen, nicht auf einem echten Gerät (Nutzer-Playtest).
- **Frame-Budget:** Der Boden wird je Frame über eine affine Matrix aus der Terrain-Ebene kopiert (nur das
  Quell-Teilrechteck der sichtbaren Kacheln, bei Zoom ≤ 0,5 die halbe Kopie); Gebäude zeichnen ohne Sprite-Cache
  (etwa 300 Körper mit je 20–40 Pfadoperationen). Gemessen hält das Budget (Render p95 ≤ 2,4 ms, QA-R3). Wächst
  die Stadt deutlich, ist ein Cache je `(defId, Stufe, Zoomstufe)` mit Obergrenze 240 Einträge vorbereitet
  (Plan M7, ISO 7.1).
- **Verdeckung:** Hohe Gebäude (Kapelle, Turm bis `H_TOWER`) verdecken, was hinter ihnen steht. Dagegen helfen
  Picking über die Silhouette (R113), Signale und Umrisse in der obersten Ebene. Neue Gebäudetypen müssen ihre
  Polygone in `bodyPolygons` liefern; ein Test führt `bodyPolygons` für alle Typen aus.
- **Tiefenschlüssel nur für `w = h`:** Ein Gebäude mit rechteckigem Footprint braucht einen paarweisen Vergleich
  (ADR-012).
- **Asset-Grösse und Lizenz:** Bis zu 12 MB unter `public/`; Budget, Prüfsummen und Nachweise sichern Vitests
  und `art-license-checker`. Eingebaut sind ~8 MB (Musik, Umgebung, Signale, Schrift). Jede weitere Datei ist
  ein bewusster Eintrag in Manifest, `CREDITS.md` und `sha256.json`.
- **`layoutKey` je Frame:** bis zu fünf Aufrufe je Frame; bei grossen Karten ein Frame-Memo (siehe 8).

## 12. Glossar

| Begriff         | Bedeutung                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| Kontor          | Startgebäude an der Küste (2×2), zentrales Lager, Handelsplatz und Ausgangspunkt des Wegenetzes; nicht abreissbar. |
| Tick            | Ein Simulationsschritt; bei Geschwindigkeit 1× dauert er `TICK_MS`. Raten gelten pro 100 Ticks.                    |
| Anbindung       | Verbindung eines Gebäudes über Wege mit dem Kontor; Voraussetzung für Produktion, Markt und Dienste.               |
| Versorgung      | Lage eines Wohnhauses im Radius des Kontors oder eines angebundenen Marktplatzes; nur dann erhält es Waren.        |
| Stufe           | Bevölkerungsstufe eines Wohnhauses: Pioniere, Siedler, Bürger; bestimmt Bedürfnisse, Dienste, Steuer.              |
| Aufstieg        | Wechsel eines Wohnhauses auf die nächste Stufe, wenn alle Bedingungen erfüllt sind; kostet Geld und Baustoffe.     |
| Bilanz          | Steuern minus Unterhalt je Buchungstakt (`UPKEEP_INTERVAL`); das HUD zeigt sie hinter Steuern und Unterhalt.       |
| Dienst          | Leistung eines öffentlichen Gebäudes im Radius: Glaube (Kapelle), Bildung (Schule).                                |
| Zyklus          | Anzahl Ticks, bis ein Betrieb eine Einheit erzeugt.                                                                |
| Steuerstufe     | Globale Einstellung niedrig / normal / hoch; bestimmt Steuer in %, Aufstiegs-Wartezeit und Zielbelegung.           |
| Verkaufsanteil  | `sellPct` je Gut in %: sinkt mit jedem Verkauf (Sättigung), erholt sich mit der Zeit; bestimmt den Verkaufserlös.  |
| Auftrag         | Bestellung eines Händlers (Gut, Menge, Prämie, Frist); nur vollständig lieferbar, verfällt ohne Strafe.            |
| Autosave        | Zweiter Speicherplatz, den das Spiel alle 120 s laufender Zeit selbst schreibt.                                    |
| Krise           | Ereignis je Krisenperiode: Brand, Sturm oder Boom; Häufigkeit nach Krisenstufe (aus, mild, normal).                |
| Feuerwache      | Öffentliches Gebäude (Taste E); angebunden schützt es brennbare Gebäude im Radius 8 vor Brandschaden.              |
| Ausfall         | Zustand `burning` eines Gebäudes nach einem ungeschützten Brand (200 Ticks ohne Produktion bzw. Dienst).           |
| Kachelraum      | Quadratisches Raster der Sim; alle Regeln und Geometrie rechnen hier, nur das Zeichnen projiziert isometrisch.     |
| Tiefenschlüssel | `depthKey = 2x + w + 2y + h`; bestimmt die Zeichenreihenfolge der Objekte mit Höhe.                                |
| Körperhülle     | Konvexes Sechseck aus Footprint-Raute und Höhe; Vorfilter des Pickings vor den gezeichneten Polygonen.             |
| Bus             | Lautstärke-Gruppe im Ton: Master, Musik, Umgebung, Effekte; je ein Regler in den Einstellungen.                    |
| Ducking         | Kurzes Absenken von Musik und Umgebung, während ein Signal spielt.                                                 |
| Rückfall        | Synthetischer Ersatz für eine fehlende oder nicht ladbare Datei; das Spiel meldet und wirft nichts.                |
