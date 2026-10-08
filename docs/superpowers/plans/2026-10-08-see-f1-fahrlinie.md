# Plan SEE-F1-FAHRLINIE (REL-09, Stufe leicht, Fehlerbehebung)

Branch `fix/see-f1-fahrlinie`, Worktree `.worktrees/see-f1`. Quelle: `docs/beobachtungen.md` Z. 95 (R274b (1), Nutzerwunsch).

## Befund (Ist)
`seaLanes` (`src/sim/islands.ts:348`) = Gerade Anker→Anker. Sie kreuzt Land (Heimat: Anker liegt an der Kontor-Seite, die Gerade läuft über den Strand) und Fremdinsel-Rechtecke. `d` = `ceil(seaLength)`, also nur Länge ausserhalb der Insel-*Rechtecke*. `shipPose` (`src/render/shipLane.ts`) läuft `pointAt` auf dieser Geraden und ruft `seaLanes` je Aufruf neu (je Schiff und Frame). Kein Tiefenbegriff im Terrain (nur `water`); "Tiefwasser" = Abstand zum Land.

## Entscheidung (Umkehrbarkeit: gering, kein ADR)
Neue, rein lesende Routenschicht **neben** `seaLanes`; `seaLanes`, `d`, `laneTicks`, `travelTicks` bleiben **unverändert**.
- Grund: `d` steuert Reisezeit (Sim-Ergebnisse, `ships.test` 370 Ticks, Balancing) UND Inselplatzierung (`layoutValid`, `dMin..dMax`) → eine Änderung verschöbe Weltgenerierung bestehender Seeds und Savegames. Die Route ist nur Darstellung; Fortschritt `t = 1 − left/laneTicks` wird proportional auf die Routenlänge abgebildet.
- Alternative B (`d` aus Route): verworfen, Save v10 + Migration + Balancing-Neuabnahme für rein optischen Gewinn.
- Auswirkung: **Save v9 unverändert, Sim-Ergebnisse unverändert, Balancing unberührt.** Schiff fährt visuell leicht länger/kürzer als `d` (Tempo variiert minimal), akzeptiert.

## Algorithmus (`src/sim/seaRoute.ts`, DOM-frei, kein Rng, deterministisch)
1. Raster = Archipel-Bounding-Box +2 Rand (Span ≤ 300 → ≤ ~150×150 = 22k Zellen typisch, ≤ 90k Worst Case). Blockiert = Landkachel (`island.tiles[].terrain !== 'water'`) in Inselrechteck; ausserhalb = Wasser. Auch Binnenseen blockiert (nur Meer erreichbar).
2. Abstandsfeld zu Land (Multi-Source-BFS, 8er). Zellkosten = 1 + `ROUTE_SHORE_PENALTY * max(0, ROUTE_DEEP − dist)` (Tiefwasser bevorzugen, Hindernisse mit Abstand).
3. Dijkstra, 8er-Nachbarn, Diagonale √2, kein Eckenschneiden über Land; Binär-Heap, feste Tiebreaks (Zeile, Spalte) → deterministisch. Start/Ziel = Ankerkachel.
4. Ausdünnen per Sichtlinie (nur wenn Linie ≥ `ROUTE_CLEAR` Kacheln Abstand hält), dann Ecken mit Radius runden (Rundung nur im Freiraum; abgetastete Polylinie, Schrittweite ~0,5) → flüssige Pose, keine Knicke.
5. Fallback: findet Dijkstra nichts (nie erwartet), alte Gerade. Limit: Knotenzahl-Deckel `ROUTE_MAX_NODES` (Perf), Cache `WeakMap<readonly Island[], Map<"a-b", Pt[]>>`, je Welt einmal beim ersten Zugriff (Insel ab Weltbau fest). Zielzeit < 30 ms je Welt; Absicherung deterministisch über `ROUTE_MAX_NODES`, Wanduhr-Test nur grosszügig (2 s).
Konstanten (`ROUTE_*`) in `src/sim/defs/sea.ts`.

## Tasks (seriell, ein Umsetzer pro Strang)
| ID | Titel | AK (Vitest) | Agent |
| -- | ----- | ----------- | ----- |
| T0 | Goldwerte VOR T1: `tests/sim/seaGolden.test.ts`, erzeugt aus main-Code (kein Code-Diff): `seaLanes`, `d`, `laneTicks` und Hash des Welt-JSON nach 2000 Ticks mit Schiffsfahrt für 3 feste Seeds; `balance.test.ts` ohne Diff; erster Commit im Branch | tech-sim-engineer (sonnet) |
| T1 | `seaRoute.ts` + Konstanten, Tests rot→grün; zusätzlich AK13 Route vor/nach Speichern→Laden gleich (neue Welt = neuer WeakMap-Schlüssel), AK14 Goldtest T0 bleibt grün; Review-Grep: `seaRoute.ts` ohne DOM-/`src/render/`-Import, kein `Math.random` | AK1 alle Routenpunkte auf Wasserkacheln (Heimat 0↔Fremd, ≥ 20 Seeds); AK2 Heimat-Route verlässt den Anker nie über Land; AK3 gleiche Eingabe → identisches Ergebnis (zweimal, Seeds); AK4 Route länger als 1,0× Gerade, aber ≤ 1,6× (Plausibilität); AK5 mittlere Entfernung zu Land ≥ Gerade-Mittel (Tiefwasser); AK6 deterministischer Deckel `ROUTE_MAX_NODES` (Knotenzahl, nicht Zeit) hält; Wanduhr-Grenze nur grosszügig (< 2 s je Welt); AK7 `seaLanes`/`d`/`laneTicks` byte-gleich (Snapshot) | tech-sim-engineer (sonnet) |
| T2 | Pose: `lanePoints`/`shipPose` auf Route, Cache statt `seaLanes` je Frame | AK8 `shipPose` Start=Anker, Ende=Anker (bleibt), Pose nie auf Land (alle `left` in Schritten); AK9 Pose-Schritt je Tick ≤ 1,5 Kacheln, Richtungswechsel je Schritt ≤ 30° (flüssig); AK10 Rückrichtung = umgekehrte Route; Tests nur in `shipLane.test.ts` (Anpassung `decorSea.test.ts` gehört in T3) | tech-ui-engineer (sonnet), nach T1 |
| T3 | Deko/Wal: `seaContext.lanes` (`decor.ts`) auf Route; Wal/Delfin-Platzierung (`wildlife.ts`, `fauna.ts` Z. 1298) meidet Route-Korridor | AK11 kein Wal/Delfin innerhalb 3 Kacheln der Route; AK12 `decorSea.test` grün | tech-ui-engineer, nach T2 |
| T4 | Browserblick + Doku | `qa-playtester`: Screenshot Heimat-Ablegen (Schiff läuft nicht über Strand), Fahrt zu allen Inseln; arc42 Baustein "Seeweg" (Route ≠ `d`), `docs/beobachtungen.md` Eintrag SEE-F1 erledigt | qa-playtester; Doku durch Lead |
Review je Task: `qa-code-reviewer` (sonnet); letzter Review über die ganze Branch auf `opus` = Final-Review. `make check` und `tests/sim/balance.test.ts` grün (`; echo EXIT=$?`).

## Datei-Ownership
- T1: neu `src/sim/seaRoute.ts`, `tests/sim/seaRoute.test.ts`; ändert `src/sim/defs/sea.ts` (nur neue `ROUTE_*`-Konstanten). Nicht angefasst: `src/sim/islands.ts`, `save.ts`, `ships.ts`.
- T2: `src/render/shipLane.ts`, `tests/render/shipLane.test.ts`.
- T3: `src/render/decor.ts` (nur `seaContext`, Z. ~915), `src/render/wildlife.ts`, `src/render/fauna.ts` (nur Meeres-Teil), `tests/render/decorSea.test.ts`.
- T4: `docs/arc42.md`, `docs/beobachtungen.md`.

## Überschneidungen mit parallelen Strängen
- SEE-F2-UX (`src/ui/`): **disjunkt**. `src/ui/islandCard.ts` nutzt `seaLanes`/`travelTicks` nur für Zahlen – bleibt unberührt (Nebenvorteil des `d`-Erhalts). `src/ui/app.ts`/`input.ts` importieren nur `shipAt` (Signatur bleibt).
- ART-WALD-RAUTEN (`src/render/terrain.ts`): **disjunkt**.
- SEE-F3 Schiffskontrast: Schiffszeichner ist `src/render/ship.ts` – von SEE-F1 **nicht angefasst** (nur `shipLane.ts` wird geändert; `ship.ts` liefert nur Konstanten). SEE-F3 kann parallel/danach ohne Konflikt auf `ship.ts`; Berührung nur über `shipLane.ts` (`shipAt` nutzt `SHIP_*`-Konstanten) und `renderer.ts` (nicht in SEE-F1).
- `decor.ts`/`wildlife.ts`/`fauna.ts`: gross und von Kunst-Strängen gern berührt; T3 klein und zuletzt halten, vor Merge `git diff main` auf Konflikte prüfen.

## Ablauf (R355)
T0, T1, T2, T4 jetzt; T3 wartet bis ART-WALD-RAUTEN gemergt ist (Signal L0). Final-Review opus erst nach T3. Kein Merge, kein Push.

## Risiken
Routen in engen Buchten (Anker liegt in 1-Kachel-Bucht): ClearAbstand fällt auf 0 zurück (Sichtlinie mit Mindest-Clear nur für Mittelteil). Reihenfolge der Inseln im Archipel ändert nichts (Cache pro Paar).

## Budgetantrag
Pakete 3 (T1–T3) × 2 = 6 + Playtest 1 + Final-Review 1 = 8; +30 % → **11 Starts**, Parallelität 1 (Dateien seriell T1→T2→T3), ca. **110 Tools** gesamt (Lead eingerechnet).
