# I-119 «Bewohner reagieren auf Krisen» + I-121 «Wartende vor der Tür» (Kurzdesign, Stufe leicht)

Stand 2026-10-22 (Nachtrag I119-NACHTRAG: setzt auf LEBEN-STRASSE auf; Erstfassung 2026-10-16) · Paket design-I-119-I-121 · Quelle: R692, R714, R715, Spec `2026-10-22-leben-strasse-design.md` (Branch `design/leben-strasse`), I-119, I-121 (IDEEN-11 Scout C), Nutzerfeedback G9 «weniger Text, mehr Bilder» · Save: nein · neuer Spielwert: nein · Sim-Änderung: nein · Assets: keine (prozedural)

## Grundlage LEBEN-STRASSE (Nachtrag)

Dieses Design setzt auf LEBEN-STRASSE (R819, Strang `feat/leben-strasse*`) auf und gilt erst **nach dessen Merge**. Übernommen wird, was dort neu ist:

- `src/render/pace.ts`: `paceFactor(speed)` (0 / 1 / 1,6 / 2,4), Gehuhr `walkClock(world, timeMs, speed?)` → `walkMs`, Konstanten `SPEED_CARRY` 1,5, `SPEED_LOAD` 1,3, `STRIDE` 0,8. Ersetzt `WALK_SPEED`-Annahmen der Erstfassung: Alle Figurenbewegungen dieses Designs laufen in `walkMs` oder sind wie die Träger an einem Sim-Tick verankert, nie in rohem `timeMs`.
- `RenderFx.speed` (`0 | 1 | 2 | 4`, fehlt → 1) steht bereit.
- `WalkerPose` trägt `step` (kumulierte Weglänge in Kacheln) und `dir` (±1); die Schrittphase ist `2π·step/STRIDE`. Neue Figur: Höhe 0,70·`ISO_H` (22 px), Kopf, Rumpf in zwei Tonstufen, Beine, Blickrichtung; `drawWalker(ctx, cam, pose, look, opts)` mit `look = figureLook(seed, id, kind)` aus `src/render/walkerLook.ts` (`kind` `'walk' | 'work'`).
- Träger sind am Ziel verankert (`s = L − v·f·τ`); `ErrandPose` trägt ebenfalls `step`/`dir`.

Alte Bezüge der Erstfassung (`WALK_SPEED`, 0,6·`ISO_H`-Trapezfigur, `clothesOf`, Phasenfenster der Träger) entfallen.

## Spielerzweck

Krise und Mangel werden in der Stadt sichtbar, ohne Text und ohne Menü. Säule: Bevölkerung versorgen. Heute zeigen Krisen nur Banner, Feuer und Wetter, Mangel nur das Bedarfssymbol (`drawNeedSymbols`, `src/render/overlays.ts`, ab Zoom 0,75); die Figuren (`life.ts`, `errands.ts`) ignorieren beides. Hier ist `life.ts`/`errands.ts` immer als Stand nach LEBEN-STRASSE gemeint. Reine Darstellung: `src/render/` liest `world` (Krise, Häuser, Betriebe) und schreibt nie hinein.

**Ehrliche Wertung I-121.** Eine Wartefigur doppelt das Symbol («was fehlt»). Echten Zusatz liefert sie nur über die **Dauer**: 1 → 2 → 3 Figuren zeigen Ungeduld, ohne Zahl. Darauf ist das Design ausgelegt; ohne die Staffelung wäre I-121 reine Wiederholung.

## Gemeinsames Fundament (beide Teile)

1. **Neues reines Modul `src/render/reaktion.ts`** (DOM-frei, kein `Math.random`, Zufall nur `hash2(world.seed + N, …)` mit Salz im Block der Render-Salze, Plan wählt freien Wert und trägt ihn in die Salzliste ein).
2. **Obergrenze bleibt `CAPS.walkers`** (`limits.ts`, 40 / reduziert 12): Reihenfolge der Figuren je Frame: Laufwege (`errandsFrom`) → Reagierende (Krise vor Wartenden) → Spaziergänger bekommen den Rest. `walkersLeft(walkers, errands + reaktionen, reduce)` in `errands.ts` bleibt der einzige Abzug. **Kein Perf-Zuwachs über den heutigen Deckel**: Reagierende ersetzen Spaziergänger. Worst case normal 16 Laufwege + 12 Wartende + 8 Löscher = 36, Spaziergänger 4; reduziert 6 + 4 + 0, Spaziergänger 2.
3. **Eigene Teil-Deckel** in `CAPS` (`limits.ts`): `waiters: [12, 4]`, `firefighters: [8, 0]` (6 Spaziergänger + 2 Löscher), `wavers: [12, 0]`.
4. **Zeit:** Auslöser, Entprellen und Zeitstaffel zählen in Sim-Ticks (`world.tick`); Geschwindigkeit ändert die Dauer in Echtzeit, nie die Reihenfolge. Bewegung (Gehen, Laufen) ist **zurückgelegte Strecke** (`step`) bei Tempo `v·paceFactor(speed)`, entweder in `walkMs` (Heimgehen, Laufen) oder wie die Träger an einem Sim-Tick verankert (Brand-Läufer). Gesten (Winken, Eimerwippen) laufen auf `walkMs` (nicht mehr auf `fx.timeMs`): **Pause = vollständiger Stillstand**, auch der Gesten (LEBEN-STRASSE Regel 7).
5. **Gültig nur, wo Figuren heute gezeichnet werden** (`!lod`, Renderer); Zusatzbedingung Wartende: `cam.zoom ≥ 1,0` (Konstante `WAIT_MIN_ZOOM`, `reaktion.ts`, Darstellungswert).
6. **Pose-Erweiterung `drawWalker`** (`life.ts`, nach LEBEN-STRASSE T05): optionales Feld `gesture?: 'wait' | 'wave' | 'bucket'` in `WalkerPose` (neben `step`, `dir`, `alpha`); `wait` Figur steht (`step` fest, Beine parallel), Kopf 0,06·H tiefer (H = 0,70·`ISO_H`), Blick `dir` zur Haustür, Arme hängend; `wave` ein Arm als Strich, Winkel aus `walkMs` (reduziert: fest oben); `bucket` Eimer statt Bündel, Zeichner wie `drawErrandLoad`, Eimer auf der Gegenseite von `dir`, Wippen aus der Schrittphase. Zoomstufen wie LEBEN-STRASSE: Gesten nur ab Zoom ≥ 1 sichtbar, darunter schlichte Figur. Ohne `gesture` bleibt die Ausgabe **identisch zum Stand nach LEBEN-STRASSE** (Regressionstest gegen den Aufrufstrom des Fake-Kontexts).
7. **Look der Reagierenden:** Eigene Ids oberhalb `ERRAND_ID_BASE` (1000) in getrennten Blöcken (Plan legt Basis fest). Wartende: `figureLook(seed, id, 'walk')`, aber Rumpftöne aus der Symbolfarbe (A3); die Tonstufen entstehen mit demselben Helfer aus `walkerLook.ts` (neue reine Funktion `torsoTones(color)`, Mischung nur zu `waterDeep`/`rockDark` und `sandDry`, nie `#000000`/`#ffffff`, S1/S2). Läufer und Löscher: `kind 'work'`.

## Teil A (I-121, Wartende) plus Sturm und Boom

**A1 Wartende.** Je Haus im Bild (Culling wie `drawNeedSymbols`) mit `houseDiagnosis(world, b)[0]` (Mangel): Zähler `sinceTick` je Haus in einem Cache `WeakMap<World, Map<id, tick>>`. Es zählt nur, was im Bild und im Mangel steht; ein Haus ohne Mangel (oder ausserhalb des Bildes) fällt aus der Map. Anzahl `waitersOf(sinceTick, tick)`: < 30 Ticks (3 s) → 0 (Entprellen gegen Flackern bei hohem Tempo); ab 30 → 1; ab 150 (15 s) → 2; ab 600 (60 s) → 3. Konstanten `WAIT_AFTER`, `WAIT_2`, `WAIT_3` in `reaktion.ts`.
**A2 Ort.** Stehkachel = erste Wegkachel neben dem Haus (`adjacentOf`, kleinster Index); kein Weg angrenzend → keine Wartenden (Haus ist dann ohnehin «nicht angebunden»). Figuren 0,25 Kachel versetzt zum Haus, Abstand 0,3 untereinander (Figurbreite jetzt 6,4 px, Abstand reicht).
**A3 Farbe.** Kleidung = `symbolFor(first).color` (wichtigster Mangel = erster Eintrag der Diagnose, derselbe wie das Symbol, nie eine eigene Rangfolge).
**A4 Auswahl über dem Deckel.** Erst je Haus die erste Figur, dann zweite, dann dritte (Durchgang über den festen Schlüssel `hash2(seed + N, id)`); höchstens `CAPS.waiters` (12), reduziert 4. Feste Mischung, kein Springen zwischen Frames.
**A5 Abgang.** Wird der Mangel behoben, blenden die Figuren über 10 Ticks aus (`alpha`), dann weg.
**A6 Sturm.** Solange `world.crisis.kind === 'storm'` und `tick < until` (Warnung und Wirkung): Spaziergänger `i` bekommt aus `hash2(seed + N, i)` einen Heimgeh-Tick `Ti` im ersten Viertel der Restwarnzeit (`from - STORM_WARNING … + 0,25`); danach läuft die Pose geradlinig zur Mitte des nächsten Hauses (Suche im Bildausschnitt, `b.house`) mit dem **Gehtempo der Spaziergänger** `1,2·paceFactor(speed)` (`step` und `dir` wachsen mit, die Beine gehen im Schritt; keine feste Dauer von 20 Ticks mehr) und blendet bei Ankunft über 0,3 Kacheln aus. Die Dauer ergibt sich aus der Strecke (Umkreis 8 Kacheln, höchstens ≈ 7 s bei 1×); sie wird wie bei den Trägern an der Ankunft verankert (Ankunftstick `Ti + homeTicks(d)`, `homeTicks` rein aus Strecke, Tempofaktor und nominalem Tickabstand `TICK_MS/speed`). Bis `until` bleiben sie weg und kehren mit 20-Tick-Einblenden zurück (Rückkehr: wieder die normale Spaziergängerpose der Gehuhr). Wartende gehen im Sturm ebenfalls hinein (A5-Ausblendung). Ohne Haus im Umkreis 8: Figur blendet am Ort aus. Zustandslos (Quelle: aktuelle Spaziergänger-Pose, die weiterläuft); Plan darf stattdessen eine eingefrorene Pose im Cache (≤ 40 Einträge) wählen, Wahl im Plan festhalten.
**A7 Boom.** Während `kind === 'boom'` und `tick ∈ [from, until]`: bis `CAPS.wavers` (12) Spaziergänger (feste Teilmenge nach Hash, 50 %) mit `gesture 'wave'` (Zeichen: ein Arm als Strich, Winkel aus `walkMs`, die Figur geht dabei im Schritt weiter); nur ab `WAIT_MIN_ZOOM`. «Bewegung reduzieren»: keine Winker (Deckel 0).

### Abnahmekriterien Teil A (Vitest, `tests/render/`, reine Funktionen, Fake-Kontext `fakeCtx.ts`)

- AK-A1 `waitersOf`: 0 bei Tick 29, 1 bei 30, 2 bei 150, 3 bei 600; kein Mangel → 0; negative/`NaN`-Eingabe → 0, kein Wurf.
- AK-A2 Entprellen: Mangel von Tick 100 bis 120 und wieder weg → nie eine Figur (Map leert sich); Mangel springt ein-aus-ein im Takt 10 → Zähler startet jedes Mal neu.
- AK-A3 Farbe: Figur trägt `symbolFor(erster Eintrag).color`; Mangel `supply` und `good` liefern die Farben der Symbole (kein eigener Farbwert in `reaktion.ts`).
- AK-A4 Deckel: 20 Häuser mit Mangel → genau 12 Wartende, je Haus zuerst 1 Figur; reduziert 4; Summe aus Laufwegen, Reagierenden und Spaziergängern ≤ `CAP walkers` (40 / 12), Test mit allen drei Quellen gleichzeitig.
- AK-A5 Zoom: bei Zoom 0,99 → keine Wartenden, bei 1,0 → ja; Spaziergänger und Laufwege unverändert zu heute.
- AK-A6 Pause: `speed 0` mit verschiedenem `timeMs` → Anzahl, Pose und Geste (Wartende, Winker, Heimgänger) identisch über zwei Frames (Posen hängen nur von `world.tick`, Hash, Weg und `walkMs`, nie von rohem `fx.timeMs`).
- AK-A7 Determinismus: gleiche Welt und Tick → gleiche Wartende (Ids, Posen); `Object.freeze` auf Welt und Gebäude wirft nicht (Darstellung schreibt nie).
- AK-A8 Sturm: `stormPose` bei Tick vor `Ti` = normale Pose; Heimgänger bewegen sich mit `1,2·f` Kacheln/s (± 1 % für f = 1, 1,6, 2,4; keine feste 20-Tick-Dauer), `step` wächst 1 je Kachel, `dir` zeigt zum Haus; bei Ankunft alpha 0; nach `until` Einblenden 20 Ticks; ohne `world.crisis` identisch zum Stand nach LEBEN-STRASSE (Regression).
- AK-A9 Boom: Winker = feste Teilmenge, ≤ 12; reduziert 0; ausserhalb `[from, until]` keine; `drawWalker` ohne `gesture` zeichnet identische Aufrufe wie nach LEBEN-STRASSE.
- AK-A10 Look: Wartende tragen Rumpftöne aus `torsoTones(symbolFor(first).color)`; keine Komponente `#000000`/`#ffffff` (Palettentest wie AK-V8); Kontrast gegen die Wegfarbe ≥ `MIN_TORSO_CONTRAST` aus `walkerLook.ts`, sonst Tonstufe angepasst (nicht der Mindestwert gesenkt); `wait`-Figur hat `step` konstant und beide Beine gleich.
- Browser-Check (Playtester): Haus ohne Marktzugang, 1× belassen: nach ≈ 3 s erste Figur, nach 15 s zweite, nach 60 s dritte; Versorgung herstellen → Figuren gehen weg; Sturm auslösen → Strassen leeren sich; keine Verdeckung der Bedarfssymbole (Symbol in der Signalebene bleibt oben).

## Teil B (I-119, Brand-Eimerkette)

**B1 Auslöser.** `world.crisis.kind === 'fire'`, `outcome` ∈ {`burning`, `extinguished`}, `tile` und `target` vorhanden (`miss` und fehlendes Ziel → nichts), `tick ∈ [from, until]`. **Brand unter 5 s Restzeit** (`until - tick < 50`): keine neuen Läufer; bereits laufende bleiben bis `until` und blenden dann in 10 Ticks aus.
**B2 Läufer.** Bis 6 Spaziergänger-Figuren (`CAPS.firefighters`, normal 8 inklusive Löscher), Startkacheln = Wegknoten im Umkreis 6 um `tile` (feste Auswahl nach Hash, Index ≥ 0). Pfad: kürzester Weg über den vorhandenen Weggraph (`roadGraph`, `life.ts`) zum Wegknoten, der dem brennenden Haus am nächsten liegt; Breitensuche, Suchtiefe ≤ 12 Knoten, Ergebnis gecacht je (Weggraph, `crisis.from`, Start). Läufer starten bei `from`, Tempo `SPEED_RUN = 1,8` Kacheln/s (Darstellungswert in `reaktion.ts`, über `paceFactor(speed)` skaliert wie die Träger), **am Ziel verankert** (Muster LEBEN-STRASSE Regel 4: `s = L − v·f·τ`, Ankunft an einem Sim-Tick `from + RUN_TICKS`, `RUN_TICKS` 60, Plan prüft gegen die Brandlänge), enden eine Kachel vor dem Ziel entlang des eigenen Pfads, gestaffelt um `k` Kacheln rückwärts (Reihe = «Kette»); `step`/`dir` aus der Pfadlänge, `gesture 'bucket'` mit Eimer, Wippen aus der Schrittphase (steht in der Pause). Bei kurzem Weg erscheint der Läufer spät, bei langem mitten auf dem Weg; unter 0,5 Kacheln sichtbarer Strecke wird er nicht gezeichnet (wie die Träger).
**B3 Löscher.** Steht eine Feuerwache (Betrieb `firestation`, Zustand `ok`, angebunden, deckt die Brandkachel nach demselben Prädikat wie die Abdeckungsanzeige `CoverageKind 'fire'`, `src/sim/queries.ts`) in Reichweite, kommen 2 Löscher von deren Anbindekachel; Kleidung wie bei Spaziergängern (`clothesOf`), dazu Eimer. Ohne Wache nur die bis 6 Spaziergänger.
**B4 Ende.** `outcome === 'extinguished'`: Läufer bleiben bis `until`, dann ausblenden. Zielgebäude abgerissen oder nicht mehr brennend: alle blenden in 10 Ticks aus.
**B5 «Bewegung reduzieren» und Pause.** Reduziert: keine Läufer (`firefighters` [x, 0]). Pause: alles steht, auch das Eimerwippen (die Geste folgt der Schrittphase, nicht `fx.timeMs`).
**B6 Zoom und Culling.** Nur Figuren im Bildausschnitt, nur wo Figuren sonst gezeichnet werden; Pfadberechnung nur, wenn der Brandtile im Bild oder ≤ 6 Kacheln daneben liegt.

### Abnahmekriterien Teil B

- AK-B1 `fireRunners`: Brand mit Ziel, Ticks 0…200 → ≤ 6 Läufer plus 2 Löscher bei Wache in Reichweite; ohne Wache 0 Löscher; `outcome 'miss'` oder `target` fehlt → 0.
- AK-B2 Brand unter 5 s: bei `until - tick < 50` keine neuen Läufer; bereits gestartete bleiben, Ausblenden in 10 Ticks.
- AK-B3 Pfad: Läuferposition bei Ankunft (`from + RUN_TICKS`) liegt höchstens 1,5 Kacheln vom Zielhaus, Bildgeschwindigkeit `SPEED_RUN·f` (± 1 % für f = 1, 1,6, 2,4), Δ`step` 1 je Kachel; Läufer verlassen nie den Weggraph (alle Zwischenpunkte auf Wegknoten oder Kanten); Breitensuche bricht nach 12 Knoten ab (kein Absturz, Läufer fällt weg).
- AK-B4 Deckel: Summe Laufwege, Läufer, Wartende, Spaziergänger ≤ `CAP walkers`; reduziert 0 Läufer und 0 Löscher; Pfad-Cache ≤ 64 Einträge, danach geleert wie `PLAN_CACHE_MAX`.
- AK-B5 Pause: `speed 0` mit verschiedenem `timeMs` → gleiche Position und gleiche Geste (Eimerhöhe); Aufhebung der Pause ohne Sprung.
- AK-B6 Determinismus: gleiche Welt, gleicher Tick → gleiche Ids und Positionen; keine `Math.random` in `reaktion.ts` (Text-Test wie bei `errands.ts`).
- AK-B8 Look: Läufer und Löscher mit `figureLook(…, 'work')` (Arbeitstöne, disjunkt zu `CLOTHES_WALK`), Eimer mit Kontur auf der Gegenseite von `dir`.
- AK-B7 Welt unverändert: eingefrorene Welt, kein Wurf; Abriss des Zielhauses mitten im Lauf → Läufer verschwinden ohne Ausnahme.
- Browser-Check: Feuer mit und ohne Feuerwache; Läufer erscheinen erkennbar, sammeln sich am Haus, verschwinden nach dem Brand; Schnellvorlauf 4×: keine Flut; «Bewegung reduzieren» an: keine Läufer.

## Perf-Deckel

- Keine zusätzlichen gezeichneten Figuren über `CAPS.walkers`; zusätzliche Rechnung je Frame nur: Mangel-Diagnose der Häuser im Bild (bereits in `drawNeedSymbols`; Plan teilt die Liste einmal je Frame, kein zweiter `houseDiagnosis`-Lauf) und im Krisenfall eine Breitensuche von ≤ 12 Knoten je Läufer (gecacht).
- Frame-Budget: Messung mit `tools/render-qa/hitch.mjs`: Mehrzeit der Reaktionen ≤ 0,3 ms je Frame bei 300 Häusern im Bild (Plan-Messpunkt vor und nach).
- Nur Häuser im Bild; Cache `sinceTick` höchstens so gross wie die Häuser im Bild, jedes Frame bereinigt.

## Varianten und Empfehlung

| Variante | Inhalt                                                                                            | Grösse               | Urteil                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1        | nur I-121 (Wartende)                                                                              | S–M, ≈ 60 Tools      | geringes Risiko; doppelt Symbole, bringt aber die Zeitstaffelung; ohne Krisen-Teil bleibt der G9-Gewinn klein                     |
| 2        | beide in einem Zug                                                                                | M+M, ≈ 140 Tools     | ein Strang, aber ein langer Weg bis zum ersten Sichtbaren; Pfadsuche und Gesten erhöhen das Risiko                                |
| 3        | gestaffelt: Paket A = Fundament + Wartende + Sturm + Boom (kein Pfad), Paket B = Brand-Eimerkette | A ≈ 70, B ≈ 70 Tools | **empfohlen**: A liefert den grössten sichtbaren Gewinn ohne Pfadlogik, B trägt das einzige Pfad-Risiko separat; B ist streichbar |

**Gekürzt (YAGNI):** «voll versorgte Häuser schicken öfter Spaziergänger los» (I-121) entfällt: Spaziergänger haben heute keinen Hausbezug (`walkerAt` läuft über den Weggraph); ein Hausbezug wäre ein eigener Umbau ohne Spielerwirkung.

## Abgleich ORT-A und LEBEN-STRASSE (R714, Nachtrag)

ORT-A schreibt in `src/render/`: `terrain.ts`, `iso.ts`, `sprites.ts`, `trees.ts`, `limits.ts`, `renderer.ts` (Verzweigung `decor`-Items, Durchgang 5 «Schatten», `drawHover`-Export), `decor.ts`/`groundDecor.ts`, neu `ortsrand.ts`, `roadShape.ts`, `roadside.ts`, `shadowEdge.ts`.
**LEBEN-STRASSE** besitzt `life.ts`, `errands.ts`, `pace.ts`, `walkerLook.ts` und die Tests `tests/render/{pace,walkerLook,life,errands}.test.ts`; im `renderer.ts` verdrahtet es Gehuhr, `RenderFx.speed`, `figureLook` und die neuen `drawWalker`-/`drawErrandLoad`-Aufrufe, in `src/ui/app.ts` eine Zeile (`speed`).
Dieses Design schreibt: neu `src/render/reaktion.ts` (und Test); in `walkerLook.ts` nur die Ergänzung `torsoTones`; `life.ts` (`WalkerPose.gesture`, Gesten in `drawWalker`), `errands.ts` (nur `walkersLeft`-Aufruf-Signatur falls nötig), `limits.ts` (3 Zeilen in `CAPS`), `renderer.ts` (Figurenblock, Zeichen-Zweig `kind === 'walker'`), `overlays.ts` (nur gemeinsame Diagnoseliste, optional), Tests. **Gemeinsame Dateien mit LEBEN-STRASSE: `life.ts`, `errands.ts`, `renderer.ts` (Figurenblock), `walkerLook.ts`, Tests `life`/`errands`**; mit ORT-A `renderer.ts`, `limits.ts`. I-120/I-118 (R707, gemergt) berührt `renderer.ts`, `fx.ts`, `limits.ts` (`riseGlow`): beim Plan `main`-Stand lesen.
**Startbedingung (R714, Nachtrag R715):** Gate Spec darf jederzeit laufen. **Plan und Umsetzung erst nach dem Merge von LEBEN-STRASSE und von ORT-A T20** (`k1` → `k2`); der Plan liest dann `pace.ts`, `walkerLook.ts`, `life.ts`, `errands.ts` und `renderer.ts` vom neuen `main` (Namen oben sind der Stand der LEBEN-STRASSE-Spec und im Plan zu bestätigen). Reihenfolge danach: Paket A vor B.

## Randfälle (Übersicht)

Pause (vollständiger Stillstand: Posen, Gesten, Heimgänger), Tempo ×4 (3-s-Entprellen in Ticks, Läufer bei hohem Tempo mit kürzerer sichtbarer Strecke und ohne Flut dank Deckel, Ausdünnung wie LEBEN-STRASSE), «Bewegung reduzieren» (Wartende ≤ 4, keine Läufer, keine Winker), Zoom < 1,0 (keine Wartenden), `lod` (keine Figuren), Laden eines Spielstands (Zähler fängt neu an: Wartende erscheinen erst nach erneutem Entprellen), Haus abgerissen oder Mangel behoben (Ausblenden 10 Ticks), Brand < 5 s, kein Weg angrenzend (keine Wartenden), Sturm ohne Häuser im Umkreis (Ausblenden am Ort), Krise mit `miss`, Krise auf anderer Insel (nur Figuren der angezeigten Insel; `tile.island` wie sonst).

## Nicht-Ziele

Kein Save, keine neuen Spielwerte in `src/sim/defs/`, kein Ton (Klang ist I-120), keine Hausbezug-Spaziergänger, keine Interaktion (Klick auf Wartende), keine Änderung an Tempo, Optik oder Verankerung der Träger und Spaziergänger (LEBEN-STRASSE), keine Seuche (I-034), keine Pause bei Krise (I-058).

## Ruling-Entwürfe (an L0)

1. **Variante 3 (gestaffelt A dann B)** und Plan erst nach dem Merge von LEBEN-STRASSE und ORT-A T20.
2. **Darstellungskonstanten** (`WAIT_AFTER` 30 / `WAIT_2` 150 / `WAIT_3` 600 Ticks, Läufertempo 1,8, `CAPS.waiters` [12, 4], `firefighters` [8, 0], `wavers` [12, 0]) liegen in `reaktion.ts` und `limits.ts` (dazu `SPEED_RUN` 1,8, `RUN_TICKS` 60), keine Spielwerte, kein Balancing-Test betroffen.
3. **Obergrenze:** Reagierende zählen gegen `CAPS.walkers` (ersetzen Spaziergänger), kein neuer Gesamtdeckel.
