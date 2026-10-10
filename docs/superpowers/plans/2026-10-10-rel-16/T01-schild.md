# T01 · Schild nennt Gelände und Belegung

Strang `ui` · Worktree `.worktrees/rel-16-ui` · Branch `fix/rel-16-ui` · Umsetzer `tech-ui-engineer` (sonnet) · AK-R16-01…04 · Grundlage R444 (1), Playtest T06 REL-15 (`.studio/qa/REL-15/ui/b6-bauen.png`) · Grösse S (≈ 25 Tools) · T02 folgt im selben Umsetzer-Start (eigener Commit, gemeinsames Review)

**Files:**

- Modify: `src/ui/hints.ts` (`ReasonCtx`, `REASON_TABLE`-Zeilen `Kein Bauland` Z. 56–60 und `Bereits bebaut` Z. 61–65, `placementHint` Z. ~227–260)
- Modify: `src/ui/app.ts` (Bau-Fehler Z. ~853, `showRoadFailure` Z. ~754 und Aufruf Z. ~861)
- Test: `tests/ui/hints.test.ts` (liegt in `ZEITTESTS`, läuft seriell; gezielt starten ist erlaubt)
- **Nicht ändern:** `src/sim/**`, `tests/sim/**` (AK-R16-04), `src/ui/target.ts` (Zielkachel bleibt die Bodenkachel, ISO D-13/D-14)

## Hintergrund (Befund im Index)

`canPlace`/`canPlaceRoad` (`src/sim/placement.ts`, `checkGround`) liefern bei Wasser/Gebirge im Grundriss `Kein Bauland` und bei Gebäude/Weg `Bereits bebaut`. Das Schild sagt dazu „Kein Bauland — nur auf Land bauen“ bzw. „Hier steht schon ein Gebäude oder Weg“. Am Bergfuss sieht eine Gebirgskachel wie Wiese aus; der Spieler versteht „nur auf Land“ dann nicht. Lösung: Die UI nennt, **was** dort liegt. Die Sim-Gründe bleiben Tabellenschlüssel.

## Regel (Entscheid E1)

`ReasonCtx` bekommt ein optionales Feld (mit Kommentar):

```ts
/** Grundriss der Aktion (Ursprung, Breite, Höhe) auf `island`; nennt Gelände bzw. Belegung (REL-16). */
at?: { x: number; y: number; w: number; h: number };
```

- **`Kein Bauland` mit `at`:** Über die Kacheln des Grundrisses (`dy` aussen, `dx` innen, nur `inBounds`) die Nicht-Land-Gelände sammeln. Nur Wasser → `Kein Bauland: Wasser`; nur Gebirge → `Kein Bauland: Gebirge`; beides → `Kein Bauland: Wasser und Gebirge` (feste Reihenfolge Wasser vor Gebirge). Die Namen stehen als kleine Konstante in `hints.ts` (`{ water: 'Wasser', mountain: 'Gebirge' }`), Typ aus `Terrain`. Findet die Funktion nichts (sollte nicht vorkommen), alter Text.
- **`Bereits bebaut` mit `at`:** erste Kachel des Grundrisses in derselben Reihenfolge mit `buildingId !== null` → `Platz belegt: ${BUILDING_DEFS[b.defId].name}`; sonst erste mit `road` → `Platz belegt: Weg`; nichts gefunden → alter Text.
- **Ohne `at`:** unverändert „Kein Bauland — nur auf Land bauen“ und „Hier steht schon ein Gebäude oder Weg“ (andere Aufrufer, Tabellen-Test).
- Insel: `ctx.island ?? HOME`, Tiles über `tileAt(world.islands[island], x, y)`; nur lesen, nie schreiben.
- `placementHint`: Bauen `friendlyReason(world, a.reason, { defId, island, at: { x, y, w: def.w, h: def.h } })`; Weg `{ cost: ROAD_COST_OBJ, island, at: { x, y, w: 1, h: 1 } }`. Achtung: `island` war bisher im Bau-Kontext nicht gesetzt; mit `at` ist es nötig (Fremdinsel).
- `app.ts`: Bau-Fehler (Z. ~853) bekommt `at` mit `BUILDING_DEFS[tool.defId].w/h`; `showRoadFailure(reason, dragging, island, at?)` reicht `at` an `friendlyReason`; nur der Aufruf nach `placeRoad` (Z. ~861) übergibt `{ x: a.x, y: a.y, w: 1, h: 1 }`, der nach `removeRoad` (Z. ~882) nicht.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot)** in `tests/ui/hints.test.ts`, neuer `describe('Schild nennt Gelände und Belegung (REL-16)')`, Welt aus `uxWorld()` (wie AK-UX-04):
  - `placementHint(w, { kind: 'build', defId: 'lumberjack' }, kx + 7, ky)` → `{ tone: 'bad', text: 'Kein Bauland: Wasser' }` (die Stelle ist Wasser laut AK-UX-03-Kommentar; vorher prüfen und im Test per `tileAt` absichern). **Der bestehende Erwartungswert in AK-UX-04 (Z. ~248–251) ändert sich damit auf `Kein Bauland: Wasser`** — anpassen, nicht löschen.
  - Gebirge: eine Kachel per `home(w).tiles[idx(...)].terrain = 'mountain'` setzen (Testgelände wie Z. ~177), Haus-Werkzeug darauf → `Kein Bauland: Gebirge`; Weg-Werkzeug (`{ kind: 'road' }`) darauf → derselbe Text.
  - Gemischt: direkt `friendlyReason(w, 'Kein Bauland', { island: HOME, at: { x, y, w: 2, h: 2 } })` über einem 2×2-Feld mit einer Wasser- und einer Gebirgskachel (Gelände im Test setzen) → `Kein Bauland: Wasser und Gebirge`. Direkt statt über `canPlace`, weil `buildLock` vor dem Gelände prüft (`placement.ts` Z. ~156) und gesperrte 2×2-Gebäude sonst einen Sperrgrund liefern.
  - Belegt: Haus-Werkzeug auf `fisher.x, fisher.y` → `Platz belegt: Fischerhütte`; Weg-Werkzeug auf einer Wegkachel (Weg per `placeRoad` legen) → `Platz belegt: Weg`.
  - Fallback: `friendlyReason(w, 'Kein Bauland')` und `friendlyReason(w, 'Bereits bebaut')` ohne `at` → alte Texte (die Zeilen in der Tabelle Z. ~84–85 bleiben unverändert).
  - Lauf: `npx vitest run tests/ui/hints.test.ts; echo EXIT=$?` → rot (neue Fälle und geänderter AK-UX-04-Wert), Ausgabe im Bericht zitieren.

- [ ] **Schritt 2: Umsetzung** in `hints.ts` nach der Regel oben. Die zwei Tabellenzeilen rufen kleine private Helfer `groundText(world, ctx)` und `occupantText(world, ctx)` (je ≤ 15 Zeilen, Rückgabe `string | null`; `null` → `show` liefert den alten Text). Kein neuer Export ausser dem erweiterten `ReasonCtx`.

- [ ] **Schritt 3: `app.ts`** nach der Regel oben (zwei Stellen, eine Signatur). Keine weitere Änderung in `app.ts` (T02 ändert `dispose`).

- [ ] **Schritt 4: grün und Gegenproben**

```bash
npx vitest run tests/ui/hints.test.ts tests/ui/cursorHint.test.ts tests/ui/islandTools.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
git diff main --stat -- src/sim/ tests/sim/; echo EXIT=$?   # leer
```

- [ ] **Schritt 5: Commit** `fix: Bauschild nennt Gelände und Belegung (REL-16)` mit Session-Trailer.

## Abnahme (Reviewer)

- AK-R16-01…04 je mit Testnamen belegt; Rot-Beleg aus Schritt 1 im Bericht.
- `hints.ts` schreibt nie in die Welt; keine Spielwerte im Code (Namen kommen aus `BUILDING_DEFS`, Geländenamen sind Anzeige-Text).
- Kein `src/sim/`-Diff; `REASON_TABLE`-Vollständigkeit (AK-UX-03) grün.
