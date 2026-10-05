# H-U1 · Anbinden auf Knopfdruck — Kurz-Spec

Stand: 2026-10-05 · Autor: lead-tech · Stufe leicht · Quelle: `docs/ideen.md` I-001, Ruling R210 · Meilenstein M9 (Bündel REL-03)

## Ziel

Der Spieler klickt im Info-Panel eines nicht angebundenen Betriebs auf «Anbinden (n Wege · x Geld)» und
bekommt den kürzesten Weg zum Netz gebaut. Der dritte Startschritt («die Betriebe mit einem Weg zum Kontor
verbinden») wird ein Klick statt Suchen. Der Knopf wirkt nur auf Wunsch; Weg ziehen per Maus bleibt.

## Regeln

- **Anbindungspflichtig** ist ein Gebäude, für das `recomputeConnectivity` heute den Zustand
  «nicht angebunden» setzen kann (Betriebe, Dienste, Versorger ausser Kontor). Kontor und Wohnhaus nie.
- **Netz** = Wegkacheln, die `reachableRoads` liefert, plus jede Kachel, die 4er-angrenzend am
  Kontor-Grundriss liegt (ein Weg dort wird zur Wurzel).
- **Pfad:** Start sind die 4er-Nachbarn des Gebäude-Grundrisses (`adjacentOf`). Begehbar sind freie
  Kacheln (`canPlaceRoad` ok, Kosten 1) und vorhandene Wegkacheln (Kosten 0). Gesucht ist der Pfad mit
  der **kleinsten Zahl neuer Wegkacheln**; vorhandene, noch nicht angebundene Teilstücke werden mitbenutzt.
  Bei Gleichstand entscheidet die feste Reihenfolge (Startkacheln in `adjacentOf`-Reihenfolge, Nachbarn
  O, W, S, N); keine Zufallszahl.
- **Kosten:** n × `ROAD_COST` (kein neuer Spielwert). Bau nur ganz oder gar nicht.
- Kein neues Save-Feld; die Pfadsuche ist eine reine Abfrage, der Bau läuft über `placeRoad`.

## Abnahmekriterien

| ID    | Kriterium                                                                                                                                                                                                                                                                                                                                                                                                      | Prüfung                         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| AK-01 | `connectPath(world, id)` liefert für einen nicht angebundenen, anbindungspflichtigen Betrieb `{ ok: true, tiles }` mit der kleinsten Zahl neuer Wegkacheln (Testkarte mit bekannter Lösung); ein vorhandenes, nicht angebundenes Wegstück wird mitbenutzt (n sinkt).                                                                                                                                           | Vitest `tests/sim`              |
| AK-02 | Determinismus: zwei Aufrufe auf derselben Welt und auf einer JSON-Kopie liefern dieselben Kacheln in derselben Reihenfolge; die Welt ist danach JSON-gleich (reine Abfrage).                                                                                                                                                                                                                                   | Vitest `tests/sim`              |
| AK-03 | Kein Pfad (Betrieb von Wasser, Gebirge oder Bebauung eingeschlossen): `{ ok: false, reason: 'Kein Weg zum Kontor möglich' }`.                                                                                                                                                                                                                                                                                  | Vitest `tests/sim`              |
| AK-04 | Nicht zutreffend: unbekannte id → `'Kein Gebäude'`; Kontor, Wohnhaus, nicht anbindungspflichtige Gebäude → `'Braucht keinen Weg'`; schon angebunden → `'Schon angebunden'`.                                                                                                                                                                                                                                    | Vitest `tests/sim`              |
| AK-05 | `connectBuilding(world, id)` baut alle Kacheln, zieht genau n × `ROAD_COST` Geld ab, der Betrieb ist danach `connected`; Ergebnis `{ ok: true, built: n }`.                                                                                                                                                                                                                                                    | Vitest `tests/sim`              |
| AK-06 | Geld reicht nicht (Geld < n × `ROAD_COST`): Grund `'Zu wenig Geld'` (bzw. `'Kein Geld'` bei Minus), die Welt bleibt JSON-gleich — kein Teilbau.                                                                                                                                                                                                                                                                | Vitest `tests/sim`              |
| AK-07 | Kein neues Save-Feld, `SAVE_VERSION` unverändert; Controller-Baseline bitgleich; Balancing-Test grün.                                                                                                                                                                                                                                                                                                          | `make check`                    |
| AK-08 | Reiner UI-Helfer `connectView(world, b)`: `null`, wenn nicht zutreffend (AK-04); sonst `{ label, ok, reason, tiles }`. Label «Anbinden (n Wege · x Geld)», bei n = 1 «Anbinden (1 Weg · x Geld)»; kein Pfad: Label «Anbinden», `ok: false`, Grund «Kein Weg zum Kontor möglich», `tiles` leer; zu wenig Geld: `ok: false`, Grund aus `friendlyReason` («Zu wenig Geld: x nötig, y vorhanden»), `tiles` = Pfad. | Vitest `tests/ui`               |
| AK-09 | Info-Panel: Knopf in der Knopfleiste vor «Abreissen», nur wenn `connectView` nicht `null`. Bei `ok: false` blass (Klasse `unaffordable` wie «Ausbauen») mit Grundzeile darunter; ein Klick zeigt dann den Grund als Fehlermeldung und baut nichts. Label und Zustand folgen dem Refresh (Geld, Wege).                                                                                                          | Browser                         |
| AK-10 | Erfolg: ein Klick baut den Weg, Ton wie beim Wegbau, Meldung «<Name> ist jetzt mit dem Kontor verbunden», Knopf verschwindet, roter Punkt verschwindet.                                                                                                                                                                                                                                                        | Browser                         |
| AK-11 | Vorschau: Überfahren oder Fokus des Knopfs hebt die Pfadkacheln auf der Karte als Rauten hervor; Verlassen, Klick oder Panelwechsel löscht sie. Ohne Pfad keine Vorschau. Zeichner in eigener Datei `src/render/pathPreview.ts` (kein Eingriff in `renderer.ts`), Test gegen Fake-Kontext.                                                                                                                     | Vitest `tests/render` + Browser |
| AK-12 | README, Abschnitt Bedienung/Anbindung: Knopf, Kosten, Gründe und Vorschau beschrieben.                                                                                                                                                                                                                                                                                                                         | Review                          |

## Machbarkeit

Karte 64 × 64 = 4096 Kacheln; eine 0-1-Breitensuche mit Typed Arrays kostet deutlich unter 1 ms und läuft nur
beim Panel-Refresh (alle paar Frames) und beim Klick. Kein Cache nötig. Alternative (verworfen): A* mit
Manhattan-Heuristik — schneller bei grossen Karten, aber mehr Code und Gleichstandsregeln schwerer zu
fixieren; bei 4096 Kacheln ohne Nutzen.

## Nicht im Umfang

Vorschau beim Platzieren eines Gebäudes (Scout-Fassung M), Tastenkürzel, Mehrfach-Anbinden aller Betriebe.
