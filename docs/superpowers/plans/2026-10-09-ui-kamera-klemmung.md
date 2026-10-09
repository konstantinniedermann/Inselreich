# Plan UI-KAMERA-KLEMMUNG (REL-10, Stufe leicht, Fehlerbehebung)

Quelle: R374, `docs/beobachtungen.md` (Kamerarahmen reicht weit über die Insel hinaus; UI-PANEL-AUFRAEUMEN Punkt a). Branch `fix/ui-kamera`, Worktree `.worktrees/ui-kamera`. Noch nicht umgesetzt.

## Ziel

(1) `app.ts` klemmt und zentriert mit der sichtbaren Kartenhöhe (`visibleViewHeight`), nicht der vollen Höhe. (2) Der Kamerarahmen liegt enger an den Inselgrenzen plus Rand.

## Befund

- `src/ui/input.ts`: `clamp()` (Z. 205) nutzt `viewH()` = `visibleViewHeight(canvas.clientHeight, lastOverlayH)`; `lastOverlayH` ist privat (Z. 182, gesetzt Z. 601).
- `src/ui/app.ts`: `resize` (Z. 1080, `clampToRect(state.cam, bounds, w, h)`), `centerOn` (Z. 416, 673, 1103, 1130-1143) übergeben `view` mit voller Höhe. Folge: bei offener Kategorie Sprung/Versatz, Ziel unter dem Overlay; `resize` klemmt mit Höhe, die `input.ts` gleich wieder anders klemmt.
- `cameraBounds` (`src/render/archipel.ts` Z. 92-105) = `archipelRect(islands)` +- `CAMERA_MARGIN` (8). Playtest: Rahmenecke 72,121, südlichste Inselkachel 35,106 = 15 Kacheln Abstand; `archipelRect` rechnet offenbar mit dem Platzrahmen (`Placed`), nicht mit Land. Task U3 misst es vor dem Ändern.

## Entwurf

- `bindInput`-Handle bekommt `visibleHeight(): number` (liest `viewH()`); keine zweite Kopie von `lastOverlayH`.
- `app.ts` bildet `const clampView = () => ({ w: view.w, h: input.visibleHeight() })` und nutzt es in `resize` und allen `centerOn`-Aufrufen. `view` (volle Höhe) bleibt für Rendern und Zoom-Ankerpunkt. `resize` läuft bei Overlay-Änderung nicht neu, daher ruft der Overlay-Callback ebenfalls klemmen (kein Sprung: nur klemmen, nicht zentrieren).
- Rahmen: `cameraBounds` auf die Landausdehnung je Insel (Tile-Box der Klasse > 0, bereits in Render-Feldern verfügbar, sonst Platzrahmen minus Wasserrand) plus `CAMERA_MARGIN`; Wert des Randes wird in U3 festgelegt (Ziel höchstens 8 Kacheln). Keine Sim-/Save-Änderung. Alternative: nur `CAMERA_MARGIN` senken (einfach, aber Rahmen bleibt zu weit bei grossen Platzrahmen).

## Tasks

| ID  | Titel                                              | AK (testbar)                                                                                                                                                                                                                      | blocked-by |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| U1  | `visibleHeight()` im Input-Handle                  | AK-U1: Vitest `tests/ui/`: Handle liefert `visibleViewHeight(canvasH, overlayH)` nach Overlay-Änderung; vorher rot                                                                                                                | -          |
| U2  | `app.ts`: Klemmung/Zentrierung mit sichtbarer Höhe | AK-U2: Vitest (reine Helferfunktion `clampView`/Zentrierung, DOM-frei): bei overlayH > 0 liegt das `centerOn`-Ziel in der sichtbaren Mitte und `resize` verschiebt die Kamera nicht (gleiche Kamera vor/nach, auch DPR-Wechsel)   | U1         |
| U3  | Engerer Kamerarahmen                               | AK-U3: Vitest `tests/render/archipel.test.ts`: `cameraBounds.y1 <= südlichste Landkachel + Rand` und `x0/x1/y0` analog, für Seeds 1-10; mit dem Playtest-Fall (vorher 121 gegen 106) rot                                          | -          |
| U4  | Browser-Abnahme                                    | AK-U4: 1280x720 und 1920x1080: Kategorie offen + Resize = kein Sprung (Kamera-Soll gleich); maximal südliche Kamera zeigt noch Insel; Screenshots `.studio/qa/UI-KAMERA/`; Konsole leer                                           | U2, U3     |
| U5  | Doku                                               | AK-U5: `docs/arc42.md` nennt Overlay und `visibleViewHeight` (die zwei Sätze aus dem REL-09-Review) und den neuen Kamerarahmen; Beobachtungen (Rahmen, Punkt a) geschlossen; README nur falls Bedienung betroffen (nein erwartet) | U4         |

U1/U2 (`src/ui/`) und U3 (`src/render/archipel.ts`) haben getrennte Dateien und könnten parallel laufen; wegen `bounds` in `app.ts` (U2) seriell U1, U2, dann U3 empfohlen (ein Umsetzer `tech-ui-engineer`).

## Datei-Ownership

- `src/ui/input.ts` (Handle, Z. ~126-135, 182, 204), `src/ui/app.ts` (Z. ~331, 416, 673, 1080, 1103, 1130-1143), `src/render/archipel.ts` (`cameraBounds`, `CAMERA_MARGIN`), `tests/ui/…` (neue Datei `cameraClamp.test.ts`), `tests/render/archipel.test.ts`
- `docs/arc42.md`, `docs/beobachtungen.md`, Abnahme-Screenshots `.studio/qa/UI-KAMERA/`

## Überschneidungen

- **Mit SEE-F1-KORRIDOR: keine** (dort `decor.ts`, `renderer.test.ts`, Tests unter `tests/render/`; nur `docs/arc42.md` gemeinsam, unterschiedliche Abschnitte, beim Merge seriell lösbar).
- **Mit ART-L8-SELTEN: keine** (`decor.ts`, `forest.ts`, `decorStamps.ts`). `tests/render/archipel.test.ts` fasst L8 nicht an (L8 ändert dort laut Diffstat nichts).
- Hinweis: `tests/render/renderer.test.ts` AK-E1-12 (Rahmenmitte, jump) liest `cameraBounds`; U3 prüft, dass der jump-Modus unverändert bleibt.

## Budgetantrag

Pakete 5 (U1-U5; U1+U2 zusammen 4) x 2 = 8 Starts + Playtester 2 (je Grösse zusammen in einem Lauf, plus Wiederholung nach Fix) + 1 Final-Review `opus` = 11, + 30 % = 15 Starts. Parallelität 1-2. Tools: Richtwert 150 (UI mit Browser-Abnahme).

## Review

Je Task `qa-code-reviewer` (sonnet); U4 durch `qa-playtester`; Final-Review `opus` über die Branch.
