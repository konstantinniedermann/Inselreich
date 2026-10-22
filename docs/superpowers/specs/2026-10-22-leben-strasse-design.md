# LEBEN-STRASSE: schönere Figuren auf der Strasse, angeglichenes Lauftempo (Kurzdesign, Stufe leicht)

Stand 2026-10-22 · Paket LEBEN-STRASSE · Quelle: R819 (Nutzerauftrag: «menschen auf der strasse schöner machen. geschwindigkeit der menschen für transport/spazieren annähern»), Autor lead-art · Vorlage `docs/superpowers/specs/2026-10-21-ui-haeppchen-g-design.md` · Grösse M (zwei Pakete: P1 Tempo S, P2 Optik M) · Save: nein (`SAVE_VERSION` unverändert) · Baseline/Balancing: unberührt · Spielwerte in `src/sim/defs/`: keine · Assets: keine (prozedural, kein Lizenzweg nach ADR-011) · Stilgrundlage: ADR-012, `2026-10-04-stilrahmen.md` (S1 ein Licht, S2 Tonstufen, keine Mischung mit Schwarz/Weiss)

## Bestand (geprüft im Code, main b19d0552)

- **Spaziergänger** (`life.ts`): `walkerAt(graph, i, timeMs, seed)` läuft in Echtzeit mit `WALK_SPEED = 1,2` Kacheln/s, Pause und Tempo ändern nichts (die Figuren gehen in der Pause weiter). Zeichnung `drawWalker`: Trapez plus Kopfkreis, 0,6 · `ISO_H` hoch (19 px bei Zoom 1), 4 Kleiderfarben, eine Hautfarbe, keine Beine, keine Blickrichtung.
- **Träger / Botengänge** (`errands.ts`): `errandPose(world, b, p)` mit `p = (progress + frac) / cycle`. Die Strecke wird auf ein Phasenfenster gestreckt (Hin 0–0,30, Arbeit bis 0,40, zurück bis 0,70, Träger ab 0,70/0,75 bis 1). Die Bildgeschwindigkeit ist also **Weglänge ÷ Fensterzeit**: bei Zyklus 40 Ticks, Tempo 1× und 8 Kacheln Weg rund 6,7 Kacheln/s (Spaziergänger: 1,2), bei 4× rund 27 Kacheln/s. Der Träger rennt, je nach Weglänge unterschiedlich schnell; die Last ist ein fester Punkt rechts am Körper.
- **Takt:** `tickClock` leitet Tickbruchteil und «schnell» aus gemessenen Tickabständen ab (`tickMs`, geglättet); in der Pause steht der Bruchteil bei 1, Träger stehen, Spaziergänger gehen weiter. Der Renderer kennt das Spieltempo nicht (`RenderFx` hat kein Tempo-Feld).
- **Zeichenstellen:** `renderer.ts` Z. 631 (`errandsFrom`), Z. 648 (`walkerAt`), Z. 812/816 (`drawWalker`, `drawErrandLoad`). Obergrenze `CAPS.walkers = [40, 12]` gilt für Spaziergänger und Träger zusammen (`walkersLeft`), Träger höchstens 16/`MAX_ERRANDS_REDUCED`.

## Teil P1: Tempo

### Spielerzweck

Die Strasse wirkt wie ein Ort, an dem Menschen gehen, nicht wie ein Ameisenband mit zwei Geschwindigkeiten. Wer das Tempo erhöht, sieht schnelleres, aber noch lesbares Gehen; wer pausiert, sieht eine stehende Welt. Säule: Lesbarkeit (Stillstand und Arbeit auf einen Blick).

Nicht dazu: keine Sim-Änderung, kein Eingriff in `b.progress`, Zykluslängen oder Produktion, kein neues Spielstandfeld, keine Wegfindung, kein neues Verhalten der Figuren (Ziele bleiben).

### Entscheid (lead-art, Gate selbst entschieden)

Bewertete Optionen:

| Option                                                                                                                                                                                                         | Urteil                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. Nur Träger auf festes Echtzeit-Tempo                                                                                                                                                                        | Löst 1×, aber bei 2×/4× laufen Spaziergänger gegen ein beschleunigtes Bild unverändert weiter. Nicht gewählt.                                                            |
| B. Nur Spaziergänger mit Spieltempo skalieren                                                                                                                                                                  | Träger bleiben bei Weglänge ÷ Fensterzeit, Tempo nach Weg beliebig. Nicht gewählt.                                                                                       |
| **C. Ein gemeinsamer Tempo-Helfer** `pace.ts` mit Tempofaktor `f(Spieltempo)`; beide Figurenarten laufen mit `v · f`; Träger sind an der **Ankunft** verankert und zeigen bei hohem Tempo eine kürzere Strecke | **Gewählt.** Gleiches Schritttempo bei 1× (Spaziergänger 1,2, Träger 1,5, mit Last 1,3 Kacheln/s), bewusstes, begrenztes Verhalten bei 2× und 4×, Ankunft passt zur Sim. |

Tempofaktor (Darstellung, Darstellungswert in `pace.ts`): `f(0) = 0`, `f(1) = 1`, `f(2) = 1,6`, `f(4) = 2,4`. Absichtlich **unter** linear: bei 4× liefen Figuren sonst mit 4,8 bis 6 Kacheln/s, die Schrittphase würde zu Flimmern. Die Sim läuft bei 4× viermal so schnell, die Figuren «arbeiten» also weniger sichtbare Strecke ab, das ist gewollt (siehe Träger).

### Regeln

1. **Tempo-Helfer** `src/render/pace.ts` (rein, DOM-frei): `paceFactor(speed)` wie oben; `Gehuhr`: je Welt eine Laufzeit `walkMs`, die je Frame um `min(dt, 100 ms) · f` wächst (`dt` aus `timeMs`; springt `timeMs` zurück, beginnt die Uhr neu). Quelle des Tempos: neues optionales Feld `RenderFx.speed` (`0 | 1 | 2 | 4`), gesetzt in `src/ui/app.ts` aus `state.speed` an der Stelle, die `timeMs` setzt. Fehlt `speed` (Tests, Galerie, Dev), gilt `1`.
2. **Spaziergänger:** `walkerAt` bekommt statt `timeMs` die `walkMs` (Aufrufer im Renderer). `WALK_SPEED` bleibt 1,2. Das Ausblenden an den Episodengrenzen (`FADE_MS`) läuft in `walkMs`. In der Pause steht die Uhr: Figuren stehen, keine Animation.
3. **Träger, Geschwindigkeit:** `SPEED_CARRY = 1,5` Kacheln/s ohne Last, `SPEED_LOAD = 1,3` mit Last (Hinweg ohne Last, Rückweg und Lieferweg mit Last). Wirksam `v · f`.
4. **Träger, Verankerung:** Jede Wegstrecke (Hinweg, Rückweg, Lieferweg) der Länge `L` ist an ihrem **Ziel** verankert: Mit `τ(k)` = verbleibende Echtzeit bis zur Zielphase `k_end` (`τ = (k_end − k) · cycle · tickMs / 1000`, `tickMs` nominal `TICK_MS / speed`, ohne `speed` der gemessene Wert aus `tickClock`) liegt die Figur bei Weg `s = L − v · f · τ`. Sie erscheint, sobald `s ≥ 0` und das Zyklusfenster offen ist (Fenster dehnbar: Lieferweg ab Phase 0,40 bzw. 0,70 beim Sammler, Rückweg ab 0,40, Hinweg ab 0); bei kurzem Weg tritt sie spät auf, bei langem Weg erscheint sie mitten auf dem Weg und zeigt nur die letzten `v · f · T_Fenster` Kacheln. Das Zyklusfenster ist nur noch eine **Obergrenze der Laufzeit**, nicht mehr der Takt der Beine.
5. **Ankunft passt zur Sim:** Die Figur erreicht das Ende des Lieferwegs genau bei Phase 1, dem Zyklusende, an dem die Sim die Ware bucht; der Rückweg endet am Betrieb bei Phase 0,70, der Hinweg am Sammelpunkt bei Phase 0,30. `src/render/` liest nur `b.progress`, `cycleOf` und `tickClock`, schreibt nie in die Welt. Ist das Tempo so hoch, dass die sichtbare Strecke unter 0,5 Kacheln fällt, wird die Figur nicht gezeichnet (kein Aufblitzen), die Sim bucht unverändert.
6. **Ein- und Ausblenden** nach zurückgelegter Strecke statt nach Zyklusphase: Einblenden über die ersten 0,5 Kacheln der sichtbaren Strecke, Ausblenden über die letzten 0,3 (ersetzt `FADE_PHASE`).
7. **Pause:** `speed = 0` oder `tickClock.frac` im Stillstand: alle Posen bleiben unverändert, kein Wippen, kein Beinschwung. Pause-Aufhebung setzt ohne Sprung fort (Gehuhr stetig).
8. **Ausdünnung** bleibt: bei Tempo 4× zeigt `errandsFrom` nur die feste Teilmenge (`THIN_SHARE`); die Schwelle folgt künftig `speed === 4` (mit `speed` fehlend: bisherige Messung `FAST_TICK_MS`). Obergrenzen `CAPS.walkers`, `MAX_ERRANDS`, `walkersLeft` unverändert.

### Abnahmekriterien Tempo

Vitest (`tests/render/pace.test.ts`, ergänzt `errands.test.ts`, `life.test.ts`; reine Mathematik, keine Zeichnung):

- AK-T1 `paceFactor`: 0 → 0, 1 → 1, 2 → 1,6, 4 → 2,4; `NaN`/unbekannt → 1.
- AK-T2 Gehuhr: wächst um `min(dt, 100) · f`; bleibt bei `f = 0` stehen; Tempowechsel erzeugt keinen Sprung (Uhrwert stetig, monoton); rückwärts laufendes `timeMs` setzt neu ohne Wurf.
- AK-T3 Spaziergänger-Tempo: Weg zwischen zwei Frames von `walkerAt` entlang einer Episode ist `1,2 · f · dt` (± 1 %) für f = 1, 1,6, 2,4; bei Pause identische Pose.
- AK-T4 Träger-Tempo 1×: für drei Betriebe (Zyklus 20, 40, 60 Ticks, Weglängen 3, 8, 14) ist die Bildgeschwindigkeit der Figur auf dem sichtbaren Weg `SPEED_CARRY` bzw. `SPEED_LOAD` (± 1 %), unabhängig von Zyklus und Weglänge (heute je nach Weg 2 bis 8 Kacheln/s). Verhältnis Träger/Spaziergänger bei 1× im Bereich 1,0 bis 1,3.
- AK-T5 Träger-Tempo 2× und 4×: Geschwindigkeit `v · f` (± 1 %); sichtbare Strecke = `min(L, v · f · T_Fenster)`, bei 4× kürzer als bei 1× für denselben Betrieb.
- AK-T6 Ankunft: bei `p → 1` liegt die Figur am Ende des Lieferwegs (Abstand < 0,05 Kachel) bei jedem Tempo; Rückweg bei `p = 0,70` am Betrieb; Hinweg bei `p = 0,30` am Sammelpunkt.
- AK-T7 Pause: zwei Aufrufe von `errandsFrom` mit verschiedenem `timeMs` bei `speed 0` liefern identische Posen; dasselbe für Spaziergänger über die Gehuhr.
- AK-T8 Lesezugriff: `JSON.stringify(world)` vor und nach `errandsFrom`, `walkerAt`, Gehuhr ist gleich (Render schreibt nie in die Welt).
- AK-T9 Obergrenzen: `walkersLeft`, `errandCap`, `CAPS.walkers` und die Ausdünnung bei 4× verhalten sich wie vor der Änderung (bestehende Tests grün, Ausdünnung zusätzlich über `speed = 4` ausgelöst).
- AK-T10 Sim unberührt: Replay-Hash/Baseline bitgleich, `tests/sim/balance.test.ts` unverändert, `SAVE_VERSION` unverändert (kein eigener Test, nur der Lauf).

## Teil P2: Optik

### Spielerzweck

Die Figuren sind als Menschen lesbar (Kopf, Rumpf, Beine, Blickrichtung), gehen mit sichtbarem Schritt, und man erkennt auf einen Blick, wer **trägt** (Arbeit, Warenfluss) und wer **spaziert** (Leben). Sie passen zu Palette, Licht und Kachelmassstab der übrigen Grafik. Säule: Lesbarkeit, Stimmung.

Nicht dazu: keine Bilddateien, kein Sprite-Cache, keine Kinder/Berufe/Geschlechter-Varianten, keine Gruppen, keine Gespräche, kein Ton, keine Änderung an Wegen, Schatten-Geometrie oder Verdeckung (Fusspunkt bleibt `project(x, y)`).

### Gestaltung

Massstab: Höhe 0,70 · `ISO_H` = 22 px bei Zoom 1 (heute 19), Breite 0,20 · `ISO_W/2` = 6,4 px; die Figur bleibt unter der Türhöhe der kleinsten Häuser. Skizze (Zoom 1, Blick nach rechts, Träger mit Last):

```
      ()        Kopf: Kreis r = 0,16 H, Haar-Kappe oben (Trägerin/Träger: Tuch oder Hut in Arbeitston)
     /##\ [=]   Rumpf: zwei Tonstufen (Licht links oben nach LIGHT: hell links, kühl dunkel rechts)
     |##|       Last: Bündel/Korb auf dem Rücken (Gegenseite der Blickrichtung), Farbe LOAD_COLOR, Kontur
     /  \       Beine: zwei Striche, im Wechsel vor/zurück; Rumpf des Trägers nach vorn geneigt
```

- **Schritt aus der Strecke, nicht aus der Zeit:** Schrittphase `φ = 2π · s / STRIDE` mit `STRIDE = 0,8` Kacheln pro Doppelschritt, `s` die zurückgelegte Weglänge der Figur. Dadurch rutschen die Füsse nie, bei jedem Tempo, und die Pause friert die Haltung ein. Wippen: Körperhöhe `± 0,04 H · |sin φ|`, Beinschwung `± 0,18` Kacheln des Rumpfs.
- **Blickrichtung:** `dir ∈ {−1, +1}` aus der Bildrichtung der aktuellen Wegstrecke (`dx` der projizierten Bewegung); Stehen behält die letzte Richtung. Das Bündel sitzt auf der Seite gegen die Blickrichtung.
- **Spaziergänger:** 6 Kleidertöne (Mischungen aus `PALETTE`: `roofSlate`, `roofTerracotta`, `grassDark`, `roofThatch`, `roofCopper`, `wallStone`), helle Kopfbedeckung selten; gerade Haltung. **Träger:** 3 Arbeitstöne (`roofWood`, `earth`, `roofSlate`), dunkles Tuch oder Hut, Rumpf 0,06 H nach vorn geneigt, Last mit Warenfarbe. Die beiden Tonsätze haben keine Farbe gemeinsam.
- **Variation:** 3 Hauttöne und 2 Haarfarben, deterministisch aus `hash2(seed, id)`; dieselbe Figur sieht immer gleich aus.
- **Licht:** Tonstufen nur durch Mischung zum kühlen Schattenton (`waterDeep`/`rockDark`) und warmen Lichtton (`sandDry`), nie `#000000`/`#ffffff` (S1); Kontur wie bisher `OUTLINE` (1 px, nur ab Zoom 0,75).
- **Zoomstufen** (`ZOOM_STEPS` 0,125 bis 2): Zoom ≥ 1 volle Figur (Kopf, Haar, Rumpf mit zwei Tönen, Beine, Last); 0,5 und 0,75 Kopf plus Rumpf, Last als Fleck, keine Beine, kein Wippen; ≤ 0,25 ein Strich von 2 × max(3, H) px in der Kleiderfarbe, Träger mit 1 px Lastpunkt, keine Kontur.
- **Bewegung reduziert** (`reduceMotion`): neutrale Haltung (Beine parallel, kein Wippen); Ort und Tempo ändern sich nicht.
- **Kosten:** kein Cache, keine Allokation je Figur ausser den heutigen Posen. Pfade werden je Figur gebündelt (ein Rumpf-Pfad je Tonstufe, ein Pfad für beide Beine). Die Rechnung gilt höchstens für `CAPS.walkers` = 40 (reduziert 12) Figuren, dazu die Last der Träger.

### Abnahmekriterien Optik

Vitest gegen `tests/render/fakeCtx.ts` (`tests/render/life.test.ts`, `tests/render/errands.test.ts`, neu `tests/render/walkerLook.test.ts`):

- AK-V1 Mass: Zoom 1 → Bildhöhe der Figur im Fake-Kontext 18 bis 24 px, Breite ≤ 9 px; Fusspunkt (unterster Punkt der Beine) liegt auf `worldToScreen(project(x, y))`.
- AK-V2 Aufbau: Zoom 1 zeichnet Kopf (Kreis), Rumpf in zwei Tonstufen (zwei verschiedene Füllfarben), Beine (Strich); Zoom 0,5 Kopf und Rumpf ohne Beine; Zoom 0,25 genau ein `fillRect`/Fill ohne Kontur.
- AK-V3 Aufrufzahl je Figur (Fill/Stroke-Ereignisse): Zoom ≥ 1 ≤ 12, 0,5/0,75 ≤ 6, ≤ 0,25 ≤ 2.
- AK-V4 Gang: Beinendpunkte bei `φ = 0` und `φ = π` sind gespiegelt (vertauschte Beine); `s` und `s + STRIDE` liefern dieselbe Pose; Kopfhöhe schwankt höchstens `0,04 H`; bei `reduceMotion` und bei gleichem `s` sind beide Beine gleich und die Kopfhöhe konstant.
- AK-V5 Schritt aus Strecke: für `walkerAt` und `errandPose` liefert die Pose eine kumulierte Strecke `step`; Δ`step` je Kachel Weg ist 1 (± 1 %), unabhängig von Tempo; Pause: `step` bleibt.
- AK-V6 Blickrichtung: `dir` folgt dem Vorzeichen der projizierten Bewegung; beim Stehen bleibt die letzte; die Last des Trägers liegt auf der Gegenseite von `dir` (x-Versatz im Fake-Kontext).
- AK-V7 Träger vs. Spaziergänger: Tonsätze `CLOTHES_WALK` und `CLOTHES_WORK` sind disjunkt; Träger mit Last zeichnet zusätzlich einen Lastkörper ≥ 40 % der Rumpfbreite in `LOAD_COLOR[good]`; Träger ohne Last (Hinweg) hat keinen Lastkörper; Träger-Rumpf ist gegen den Spaziergänger-Rumpf nach vorn versetzt.
- AK-V8 Palette: alle Figurenfarben entstehen aus `PALETTE` ohne Mischung mit `#000000`/`#ffffff` (Test wie die S1-Prüfung des Stilrahmens); Rumpfhelligkeit gegen die Wegfarbe unterscheidet sich um mindestens einen festen Mindestwert (Luminanz, vom Plan gemessen und im Test festgeschrieben).
- AK-V9 Variation: gleiche `(seed, id)` → gleiche Figur (Farben bitgleich); über 40 Ids kommen alle 3 Hauttöne, 2 Haarfarben und mindestens 5 der 6 Kleidertöne vor.
- AK-V10 Verdeckung/Picking unberührt: Tiefensortierung und Schatten (`walkerShadow`) unverändert (bestehende Tests grün).
- AK-V11 Leistung: Browser-Messung `tools/render-qa/perf.mjs` mit 40 Figuren bei Zoom 1: Median der Frame-Mehrkosten gegenüber main ≤ 0,3 ms; keine neue Obergrenze in `limits.ts`.

Browser-Check (`qa-playtester`, Headless, Galerie `tools/render-qa/galerie.mjs`):

- AK-V12 Zoom 0,5 / 1 / 2 an einer belebten Strasse mit Sammler und Träger mit Last: Träger mit Last und Spaziergänger sind bei Zoom 1 unterscheidbar; Figur-Schritte rutschen nicht; bei 1×, 2×, 4× und Pause: gleich flüssiges Gehen, bei 4× kürzere Trägerstrecke, in der Pause Stillstand; ein Screenshotsatz je Stufe unter `.studio/qa/LEBEN-STRASSE/`.

Zusammen 22 Abnahmekriterien (10 Tempo, 12 Optik).

## Konflikte und Startbedingung

Geprüft per `git diff main...feat/ort-a-k1` und `…k2` (ORT-A-Kandidaten, 50 bzw. 57 Dateien):

- `src/render/life.ts` und `src/render/errands.ts`: **nicht berührt**. Die neue Datei `pace.ts` und alle Tests in `tests/render/{pace,walkerLook,life,errands}.test.ts` liegen ausserhalb von ORT-A.
- `src/render/renderer.ts`: ORT-A ändert 9 Stellen (Import-Zeilen 59–113, `renderStats`, `drawHover`, Block 746–774, Block 802–810 mit der Deko-Zeichnung, Ende `render`). Meine Änderung dort sind rund 8 Zeilen: Import (Z. 83), Uhr und `errandsFrom`/`walkerAt`-Aufruf (Z. 631/648), `drawWalker`-Aufruf mit Richtung (Z. 812). Der Block 802–810 von ORT-A grenzt unmittelbar an Z. 811–816: **Textkonflikt wahrscheinlich**, aber klein und mechanisch lösbar.
- `src/render/limits.ts`: ORT-A ändert 9 Zeilen; LEBEN-STRASSE ändert diese Datei nicht (neue Werte stehen in `pace.ts`).
- `src/ui/app.ts` (16 Zeilen bei ORT-A): LEBEN-STRASSE setzt dort eine Zeile (`speed` neben `timeMs`, Z. ≈ 1789).

**Startbedingung:** P1 und P2 starten **sofort** in `life.ts`, `errands.ts`, `pace.ts` und den Tests (kein Konflikt). Die Anbindung in `renderer.ts` und `app.ts` (letzter Task) wird **nach dem ORT-A-Merge** auf die neue main rebasiert; steht der Merge noch aus, ist sie der einzige Task, der wartet. Datei-Ownership im Plan: LEBEN-STRASSE besitzt `life.ts`, `errands.ts`, `pace.ts` und die genannten Tests, teilt `renderer.ts` und `app.ts` mit ORT-A (nur die benannten Zeilen).

## Aufwand, Dokumentation

Grösse M gesamt. P1 (Tempo) S bis M: `pace.ts`, Verankerung in `errandPose`, Gehuhr, drei Aufrufstellen. P2 (Optik) M: `drawWalker` neu, Pose um `step`/`dir` erweitert, Farbsätze, Tests. Reihenfolge im Plan: P1 vor P2 (P2 braucht `step`/`dir` aus P1), Zeichner `drawWalker` und Lastzeichner danach. Mitzuführen: `docs/arc42.md` (Render, Figuren und Tempo), `README.md` «Leben» (Z. 193: «Figuren gehen bei höherem Tempo schneller, in der Pause stehen sie»), bestehende Tests in `tests/render/life.test.ts` und `errands.test.ts` (Phasenfenster-Erwartungen ändern sich). Kein neues ADR nötig (Darstellung, keine Architekturentscheidung; ADR-012 unverändert).

## Designfragen (Empfehlung lead-art)

1. **Tempofaktoren 1,6 / 2,4 statt linear 2 / 4?** Empfehlung: wie festgelegt (sublinear), per Browser-Check abstimmbar, die Werte stehen zentral in `pace.ts`.
2. **Hinweg des Sammlers mitten auf dem Weg einblenden (bei kurzem Fenster) oder am Betrieb starten und früher losgehen?** Empfehlung: wie festgelegt (an der Ankunft verankert); am Betrieb zu starten würde das Zyklusfenster sprengen und den Ankunftsbezug zur Sim verlieren.
3. **Spaziergänger stehen in der Pause?** Empfehlung ja (Pause = Stillstand der Welt, konsistent mit Trägern und Funkeln-Uhr); Ausnahme nur, wenn die Pause-Karte ein «lebendiges» Bild erwartet, was bisher nicht der Fall ist.
