# Plan UI-SEEKARTE (Studio-Platz REL-12, Stufe voll)

Quelle: R405 (IDEEN-04, I-027 nur Karte), M12-Spec Anhang 03 Abschnitt G (E5) und Anhang 04 AK-E5-01. Nicht Teil: Gründungsfahrt (AK-E5-02, Kür im Pool).

## Ziel und Befund (am Code geprüft, main @ 496067a)

Der Knopf «Inseln» (`src/ui/hud.ts`, `bindIslandMenu`) öffnet heute nur eine Liste (`islandList`, `src/ui/islandJump.ts`); der Sprung läuft über `actions.jumpToIsland(i)` (`src/ui/app.ts`, nutzt `jumpTarget`, ohne Seefahrt stumm). Neu: ein Popover mit einer kleinen Seekarte (Canvas) über dieser Liste:

- Silhouetten aller Inseln (Land = `terrain !== 'water'` aus `Island.tiles`), je Insel einmal gerastert und gecacht.
- Fahrlinien je Route (`lanePoints`, `src/render/shipLane.ts`, bereits je Welt gecacht).
- Schiffspunkte aus `shipPose`: **Schiff ohne Route (`route === null`) erscheint nicht**; Schiff im Hafen (`to === null`) liegt als Punkt am Anker der Hafeninsel; fahrend auf der Linie.
- Klick auf eine Insel springt wie `9`/`0` (`jumpToIsland`); Esc schliesst; die Liste bleibt darunter als Tastatur- und Fallback-Weg.

Keine Sim-Änderung: kein Weltfeld, kein Save, `SAVE_VERSION` unberührt, Balancing-Test unberührt, keine Abhängigkeit. `src/render/` und `src/ui/` schreiben nie in die Welt. Karte hat nur UI-Zustand (offen/zu, Hover).

## Architektur (kurz)

- `src/render/seaMap.ts` (neu, DOM-frei ausser dem übergebenen Canvas-Kontext): `mapLayout(world, w, h, pad)` (Archipel-Kacheln nach Karten-Pixel, Massstab einmal je Weltform), `mapToTile`/`tileToMap`, `hitIsland(world, layout, px, py)` (Insel-Rechteck, Land bevorzugt), `silhouetteCache` (WeakMap je `Island`-Objekt und Pixelmassstab; Land-Maske ändert sich im Spiel nie, denn Roden und Bauen wandeln nur Land in Land), `mapDots(world)` (reine Liste der Schiffspunkte), `drawSeaMap(ctx, world, layout, cache, ui)`.
- `src/ui/seaMapView.ts` (neu, rein): Anzeige-Schlüssel `seaMapKey(world)` (Inselzahl, Kontor-Flags, Schiffspunkte auf ganze Karten-Pixel gerundet) für „nur neu zeichnen bei Änderung"; Hover-Auswahl und Tooltiptext (`islandName`, Kontor ja/nein); Zeichenzeit höchstens 1 × je Tick.
- `src/ui/hud.ts`: Popover-Verdrahtung (Canvas, Klick, Hover, Neuzeichnen bei geändertem Schlüssel, solange offen); `src/style.css`: feste Kartengrösse in CSS-Pixeln (Desktop-first, bei schmalem Fenster `max-width`, kein Mobil-Ausbau).
- Ausrichtung: die Karte ist nach `project()` (`src/render/iso.ts`) ausgerichtet wie die Hauptansicht (Entwurfsfrage 1); die Silhouette wird einmal in Draufsicht gerastert und mit einer 2×2-Matrix gezeichnet (kein erneutes Rastern).

## Tasks

Jeder Task: `npx tsc --noEmit` Exit 0 (R398), `make lint` und der betroffene Test grün; jeder Testfall zuerst rot (Befehl und Ausgabe im Bericht belegen).

| ID  | Titel                                      | Dateien                                                                                             | AK             | Strang   | blocked-by | Modell |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------------- | -------- | ---------- | ------ |
| T0  | Basismessung Testzeiten (R392)             | keine (nur Messung, Lead)                                                                           | AK-R0          | seekarte | -          | -      |
| T1  | Layout, Treffer, Punkte, Silhouetten-Cache | `src/render/seaMap.ts`, `tests/render/seaMap.test.ts`                                               | AK-S1..S6      | seekarte | T0         | sonnet |
| T2  | Zeichner gegen Fake-Kontext                | `src/render/seaMap.ts` (`drawSeaMap`), `tests/render/seaMapDraw.test.ts`                            | AK-S7..S9      | seekarte | T1         | sonnet |
| T3  | UI-Helfer (Schlüssel, Hover, Text)         | `src/ui/seaMapView.ts`, `tests/ui/seaMapView.test.ts`                                               | AK-S10..S12    | seekarte | T1         | sonnet |
| T4  | Popover im HUD, Stil                       | `src/ui/hud.ts`, `src/style.css`, `tests/ui/hud.test.ts` (nur Ergänzung)                            | AK-S13, AK-S14 | seekarte | T2, T3     | sonnet |
| T5  | Doku                                       | `README.md` (Bedienung «Inseln»), `docs/arc42.md` (Baustein Render/UI), `docs/index.md` falls nötig | AK-DOC         | seekarte | T4         | sonnet |
| T6  | Browser-Check (`qa-playtester`)            | `.studio/qa/UI-SEEKARTE/`                                                                           | AK-B1..B5      | -        | T4, T5     | sonnet |

T1-T2 sind Paket UI-SEEKARTE-RENDER (`tech-ui-engineer`, Render-Scope), T3-T5 Paket UI-SEEKARTE-UI (`tech-ui-engineer`); Final-Review `opus` über die Branch an `lead-qa`.

### T0 Basismessung (R392, E-052)

Nur bei Maschinenlast ≤ 4 (`uptime`, Wert in den Bericht; zuletzt 3,28). Auf main: `npx vitest related --run src/render/shipLane.ts src/ui/hud.ts src/ui/islandJump.ts` plus `tests/render/shipLane.test.ts`, `tests/ui/hud.test.ts`, `tests/ui/islandJump.test.ts`; Tests > 200 ms mit Zeit notieren. Abnahme am Ende: dieselben Dateien auf main und Branch unmittelbar nacheinander, kein bestehender Test > 500 ms oder > +50 %. Bei Last > 4 verschieben, nicht erzwingen.

### T1 Layout, Treffer, Punkte, Cache (Vitest, rot zuerst)

- AK-S1: `mapLayout` bildet alle Inselrechtecke samt Rand vollständig in die Karte ab (Seeds 1-10, Karte 360 × 240 CSS-Pixel); Seitenverhältnis bleibt; Ergebnis hängt nur von Inselgeometrie ab (gleiche Welt, gleiches Layout).
- AK-S2: `tileToMap` und `mapToTile` sind zueinander invers (Toleranz 1e-6, 200 Punkte).
- AK-S3: `hitIsland`: Klick auf eine Landkachel jeder Insel liefert deren Index; Klick auf offenes Wasser liefert `null`; überlappen Rechtecke (Iso-Diamanten), gewinnt die Insel mit Land unter dem Punkt.
- AK-S4: `mapDots`: Schiff mit `route === null` fehlt; Schiff im Hafen mit Route liegt genau am Anker (`anchor + 0,5`, `ox/oy`); fahrendes Schiff liegt auf der Linie (`shipPose`); Reihenfolge nach `id`; keine Mutation (Welt vorher/nachher tief gleich, `structuredClone`-Vergleich).
- AK-S5: Silhouetten-Cache: zweiter Abruf derselben Insel und Skala rastert nicht neu (Zähler im Fake-Rasterer == 1 je Insel); neue Welt (Laden) oder neue Skala rastert neu; Roden/Aufforsten (Terrain `forest` → `grass`) ändert die Maske nicht.
- AK-S6: Maske: Kachel ist Land genau wenn `terrain !== 'water'`; Anzahl Landpunkte der Maske == Anzahl Nicht-Wasser-Kacheln (alle drei Inselarten, Seeds 1-10).

### T2 Zeichner (Fake-Kontext `tests/render/fakeCtx.ts`)

- AK-S7: Reihenfolge: Wasserfläche, Fahrlinien, Silhouetten, Punkte; je Insel genau ein `drawImage` der gecachten Silhouette (kein `fillRect` je Kachel im Zeichenlauf).
- AK-S8: Je Route mit Fahrlinie genau ein Linienzug (`moveTo` + `lineTo`) mit den Punkten von `lanePoints` im Karten-Raum; Strich zweimal gleicher Welt gleich (deterministisch); ohne Seefahrt/ohne Route keine Linie.
- AK-S9: Punkte: Anzahl `arc` == `mapDots(world).length`; Hover-Insel wird hervorgehoben (zusätzlicher Rahmen), Kontor-Inseln tragen eine Markierung; Zeichnen schreibt nie in die Welt (Tiefenvergleich).

### T3 UI-Helfer

- AK-S10: `seaMapKey` ändert sich bei Schiffsbewegung um ≥ 1 Karten-Pixel, Kontorgründung und Inselzahl, bleibt gleich bei Tick ohne sichtbare Änderung (Redraw-Sparen belegt durch Zähler).
- AK-S11: Hover-Text: «Heimat», «Möweninsel · Kontor», «Felsbucht» wie `islandList` (Wiederverwendung, kein zweiter Text).
- AK-S12: Ohne Seefahrt gibt der Helfer „Karte nicht verfügbar" zurück (Knopf bleibt wie heute verborgen).

### T4 Popover im HUD

- AK-S13 (Vitest, soweit DOM-frei möglich, sonst Browser): Öffnen baut Canvas einmal; Klick auf Insel ruft `actions.jumpToIsland(i)` und schliesst; Klick ins Wasser tut nichts; Esc und Klick daneben schliessen (vorhandene Handler bleiben); die Liste bleibt bedienbar.
- AK-S14: Neuzeichnen nur bei geändertem `seaMapKey` und nur solange offen; Fenster 1280 px: Karte vollständig sichtbar; unter 1280 px stürzt nichts ab (`max-width`, kein Layoutanspruch). Canvas skaliert mit `devicePixelRatio`, Silhouetten-Cache ist an Pixelmassstab gebunden.

### T5 Doku

- AK-DOC: `README.md` Abschnitt „Seefahrt und Gewürz", Punkt «Inseln wechseln»: Karte beschreiben (Silhouetten, Linien, Schiffspunkte, Klick springt, Schiff ohne Route fehlt); `docs/arc42.md`: Render-Baustein `seaMap.ts` und UI-Baustein `seaMapView.ts`, Hinweis „kein Sim-Zustand, nicht im Save"; kein ADR nötig (keine Umkehrkosten, keine Abhängigkeit).

### T6 Browser-Check (`qa-playtester`)

- AK-B1: Seefahrt frei, drei Inseln: «Inseln» zeigt Karte mit drei Silhouetten, Linien bei vorhandener Route, Schiffspunkte; Screenshot 1280 × 720 und 1920 × 1080.
- AK-B2: Klick auf jede Insel springt (Bildmitte == `__inselDev.tileCenter` an `jumpTarget`); Ergebnis gleich wie Taste `9`/`0`.
- AK-B3: Schiff ohne Route fehlt, Schiff im Hafen als Punkt am Anker, fahrendes Schiff bewegt sich bei Tempo 4 sichtbar.
- AK-B4: Esc und Klick daneben schliessen; ohne Seefahrt kein Knopf; Fenster 1000 px breit: keine Konsolenfehler.
- AK-B5: Messung Zeichenzeit der Karte (`performance.now`, 100 Aufrufe) und Erstöffnen (Rastern): Werte im Bericht; Konsole leer. Screenshots in `.studio/qa/UI-SEEKARTE/`.

## Datei-Ownership und Worktree

| Strang   | Worktree / Branch                            | Eigentümer von                                                                                                                                                                                                       |
| -------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| seekarte | `.worktrees/ui-seekarte`, `feat/ui-seekarte` | `src/render/seaMap.ts`, `src/ui/seaMapView.ts`, `src/ui/hud.ts` (nur Inseln-Knopf), `src/style.css` (nur Karten-Regeln), `tests/render/seaMap*.test.ts`, `tests/ui/seaMapView.test.ts`, `README.md`, `docs/arc42.md` |

Ein Strang, **Parallelität 1**, Begründung: T2 und T3 hängen beide an den Typen aus T1 und sind je unter einer halben Stunde; ein zweiter Worktree kostet mehr (Merge, Typabstimmung) als er spart, und nie zwei Implementierer im selben Baum. Nicht ändern: `src/sim/`, `src/render/shipLane.ts`, `src/render/archipel.ts`, `src/ui/app.ts` (der Sprung läuft über das vorhandene `jumpToIsland`), `docs/studio/`. Konfliktrisiko: `hud.ts` und `style.css` können parallel vom Render-/Art-Strang angefasst werden; Merge von main in den Branch (kein Rebase) vor T4.

## Budgetantrag (nach `docs/studio/templates/budgetantrag.md`)

```text
Lead: lead-tech
Phase: ui-seekarte-umsetzung
Pakete:
- UI-SEEKARTE-RENDER Layout, Cache, Zeichner, T1+T2 (nein, Render-Mathematik; Zeichner gegen Fake-Kontext)
- UI-SEEKARTE-UI Helfer, Popover, Doku, T3+T4+T5 (ja)
Formel: 2 × 2 + 2 + 1 = 7 → × 1,3 = 9,1 → aufgerundet 10
  (QA-Checks: qa-playtester T6 einmal plus eine Wiederholung nach Fix; Final-Review `opus` über die Branch an lead-qa)
Parallelität: 1 (ein Strang, ein Worktree, Begründung oben)
Bisher frei/verbraucht: — (Planung: 25 Tools genehmigt, keine Starts)
Begründung Mehrbedarf: —
Beantragt: 10 Starts, Parallelität 1 (davon 1 Final-Review an lead-qa); Tool-Richtwert ca. 70
```

Prüfschritte (Task-Reviews durch `qa-code-reviewer` je Paket, Playtest T6) bleiben; kein Streichen zur Budgetersparnis, Mehrbedarf wird vor dem Überschreiten gemeldet.

## Pflichtzeilen für die Umsetzer-Briefings (briefing.md Punkt 5)

- Mehrbedarf vor dem Überschreiten melden (`templates/budgetantrag.md`), nie nachträglich.
- Vor Task 1 die Zeiten der berührten bestehenden Tests auf main messen (`npx vitest related --run <geplante src-Dateien>`), nur bei Load ≤ 4; Tests > 200 ms mit Zeit in den Bericht. Abnahme: dieselben Dateien auf main und Branch unmittelbar nacheinander, kein bestehender Test > 500 ms oder > +50 %, Zeiten vorher/nachher im Bericht.
- Jedes Paket mit `.ts`-Änderung: `npx tsc --noEmit` Exit 0 (R398), dazu `make lint`; Exit-Codes im Bericht (`…; echo EXIT=$?`, nie in eine Pipe).
- Rot vor grün je Testfall belegt: Test zuerst laufen lassen und die rote Ausgabe (Testname, Fehlermeldung) im Bericht nennen, dann grün.
- Entfällt eine Vorbedingung (z. B. keine Route, keine Seefahrt), nennt die Abnahme die Fehlerrichtung: die Karte zeigt dann weniger, nie Fehler, und der Inselsprung per Taste und Liste bleibt erfüllbar (R395).
- Prüfschritte des Plans (z. B. Task-Reviews) nicht zur Budgetersparnis streichen, Mehrbedarf melden.
- `src/sim/` und Balancing-Test unberührt; kein Save-Eingriff; keine neue Abhängigkeit; `src/render/` und `src/ui/` schreiben nie in die Welt; `src/audio/` unberührt.

## Offene Entwurfsfragen (L0 entscheidet, Empfehlung jeweils vorn)

1. **Ausrichtung:** Iso wie die Hauptansicht (Empfehlung; gleiche Himmelsrichtungen wie im Bild, Mehrkosten eine 2×2-Matrix und inverse im Treffertest) oder Draufsicht (einfacher, aber „links oben" stimmt nicht mit dem Bild überein).
2. **Karte und Liste:** Liste bleibt unter der Karte (Empfehlung; Tastatur und Fallback) oder die Karte ersetzt die Liste.
3. **Sichtfeld:** Rahmen der aktuellen Kameraansicht in der Karte (nicht im Umfang; Empfehlung: später, YAGNI).
4. **Schiffspunkt anklicken:** nicht im Umfang (Klick auf Punkt zählt als Klick auf die darunterliegende Insel oder Wasser); Empfehlung: so lassen.

## Risiken

1. **Perf beim Rastern:** je Insel einmal, höchstens Grösse² Kacheln (Fremdinseln 24² = 576 und 36² = 1296, Heimat laut `world.ts`, T0 misst) als `fillRect` auf ein Offscreen-Canvas im Karten-Massstab; Schätzung unter 5 ms gesamt beim ersten Öffnen, danach `drawImage`. Alternative bei Überschreitung (Messung AK-B5): `ImageData` statt `fillRect` oder Rastern in Häppchen im Leerlauf. Zeichnen je Tick: 3 `drawImage`, höchstens 3 Linienzüge, wenige `arc`; nur bei geändertem Schlüssel und nur offen.
2. **Cache-Schlüssel:** Die Maske hängt am `Island`-Objekt; ersetzt ein Pfad (Laden, neues Spiel) die Welt, entsteht ein neues Objekt, daher neu rastern (AK-S5). Ändert sich später die Insel-Form im Spiel (z. B. Landgewinnung), muss der Schlüssel erweitert werden (Beobachtung, kein heutiger Fall).
3. **`hud.ts`/`style.css` Merge-Konflikte** mit parallel laufenden Strängen: textuell lösbar; Merge von main vor T4.
4. **Treffer bei überlappenden Iso-Rechtecken:** Bevorzugung der Insel mit Land unter dem Punkt (AK-S3); bei Wasserklick nahe einer Insel springt nichts.
5. **Testzeiten-Messung** hängt an der Maschinenlast (zuletzt 3,28); bei Last > 4 wird T0 verschoben.
