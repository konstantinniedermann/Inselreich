# I-119 «Bewohner reagieren auf Krisen» + I-121 «Wartende vor der Tür» (Kurzdesign, Stufe leicht)

Stand 2026-10-16 · Paket design-I-119-I-121 · Quelle: R692, R714, I-119, I-121 (IDEEN-11 Scout C), Nutzerfeedback G9 «weniger Text, mehr Bilder» · Save: nein · neuer Spielwert: nein · Sim-Änderung: nein · Assets: keine (prozedural)

## Spielerzweck

Krise und Mangel werden in der Stadt sichtbar, ohne Text und ohne Menü. Säule: Bevölkerung versorgen. Heute zeigen Krisen nur Banner, Feuer und Wetter, Mangel nur das Bedarfssymbol (`drawNeedSymbols`, `src/render/overlays.ts`, ab Zoom 0,75); die Figuren (`life.ts`, `errands.ts`) ignorieren beides. Reine Darstellung: `src/render/` liest `world` (Krise, Häuser, Betriebe) und schreibt nie hinein.

**Ehrliche Wertung I-121.** Eine Wartefigur doppelt das Symbol («was fehlt»). Echten Zusatz liefert sie nur über die **Dauer**: 1 → 2 → 3 Figuren zeigen Ungeduld, ohne Zahl. Darauf ist das Design ausgelegt; ohne die Staffelung wäre I-121 reine Wiederholung.

## Gemeinsames Fundament (beide Teile)

1. **Neues reines Modul `src/render/reaktion.ts`** (DOM-frei, kein `Math.random`, Zufall nur `hash2(world.seed + N, …)` mit Salz im Block der Render-Salze, Plan wählt freien Wert und trägt ihn in die Salzliste ein).
2. **Obergrenze bleibt `CAPS.walkers`** (`limits.ts`, 40 / reduziert 12): Reihenfolge der Figuren je Frame: Laufwege (`errandsFrom`) → Reagierende (Krise vor Wartenden) → Spaziergänger bekommen den Rest. `walkersLeft(walkers, errands + reaktionen, reduce)` in `errands.ts` bleibt der einzige Abzug. **Kein Perf-Zuwachs über den heutigen Deckel**: Reagierende ersetzen Spaziergänger. Worst case normal 16 Laufwege + 12 Wartende + 8 Löscher = 36, Spaziergänger 4; reduziert 6 + 4 + 0, Spaziergänger 2.
3. **Eigene Teil-Deckel** in `CAPS` (`limits.ts`): `waiters: [12, 4]`, `firefighters: [8, 0]` (6 Spaziergänger + 2 Löscher), `wavers: [12, 0]`.
4. **Zeit in Sim-Ticks, nicht Wanduhr** (`world.tick` plus Tickbruchteil `tickClock`, `errands.ts`): Pause = Stillstand von selbst; Geschwindigkeit ändert die Dauer in Echtzeit, nie die Reihenfolge. Ausnahme: kleine Gesten (Winken, Eimerwippen) laufen auf `fx.timeMs` wie die Möwen.
5. **Gültig nur, wo Figuren heute gezeichnet werden** (`!lod`, Renderer); Zusatzbedingung Wartende: `cam.zoom ≥ 1,0` (Konstante `WAIT_MIN_ZOOM`, `reaktion.ts`, Darstellungswert).
6. **Pose-Erweiterung `drawWalker`** (`life.ts`): optionales Feld `gesture?: 'wait' | 'wave' | 'bucket'` in `WalkerPose`; `wait` Kopf 0,06·h tiefer, Arme hängend; `wave` ein Arm als Strich, Winkel aus `timeMs` (reduziert: fest oben); `bucket` Eimerpunkt wie `drawErrandLoad`. Ohne `gesture` bleibt die Ausgabe byte-gleich zu heute (Regressionstest).

## Teil A (I-121, Wartende) plus Sturm und Boom

**A1 Wartende.** Je Haus im Bild (Culling wie `drawNeedSymbols`) mit `houseDiagnosis(world, b)[0]` (Mangel): Zähler `sinceTick` je Haus in einem Cache `WeakMap<World, Map<id, tick>>`. Es zählt nur, was im Bild und im Mangel steht; ein Haus ohne Mangel (oder ausserhalb des Bildes) fällt aus der Map. Anzahl `waitersOf(sinceTick, tick)`: < 30 Ticks (3 s) → 0 (Entprellen gegen Flackern bei hohem Tempo); ab 30 → 1; ab 150 (15 s) → 2; ab 600 (60 s) → 3. Konstanten `WAIT_AFTER`, `WAIT_2`, `WAIT_3` in `reaktion.ts`.
**A2 Ort.** Stehkachel = erste Wegkachel neben dem Haus (`adjacentOf`, kleinster Index); kein Weg angrenzend → keine Wartenden (Haus ist dann ohnehin «nicht angebunden»). Figuren 0,25 Kachel versetzt zum Haus, Abstand 0,3 untereinander.
**A3 Farbe.** Kleidung = `symbolFor(first).color` (wichtigster Mangel = erster Eintrag der Diagnose, derselbe wie das Symbol, nie eine eigene Rangfolge).
**A4 Auswahl über dem Deckel.** Erst je Haus die erste Figur, dann zweite, dann dritte (Durchgang über den festen Schlüssel `hash2(seed + N, id)`); höchstens `CAPS.waiters` (12), reduziert 4. Feste Mischung, kein Springen zwischen Frames.
**A5 Abgang.** Wird der Mangel behoben, blenden die Figuren über 10 Ticks aus (`alpha`), dann weg.
**A6 Sturm.** Solange `world.crisis.kind === 'storm'` und `tick < until` (Warnung und Wirkung): Spaziergänger `i` bekommt aus `hash2(seed + N, i)` einen Heimgeh-Tick `Ti` im ersten Viertel der Restwarnzeit (`from - STORM_WARNING … + 0,25`); danach läuft die Pose 20 Ticks linear zur Mitte des nächsten Hauses (Suche im Bildausschnitt, `b.house`) und blendet bei Ankunft aus. Bis `until` bleiben sie weg und kehren mit 20-Tick-Einblenden zurück. Wartende gehen im Sturm ebenfalls hinein (A5-Ausblendung). Ohne Haus im Umkreis 8: Figur blendet am Ort aus. Zustandslos (Quelle: aktuelle Spaziergänger-Pose, die weiterläuft); Plan darf stattdessen eine eingefrorene Pose im Cache (≤ 40 Einträge) wählen, Wahl im Plan festhalten.
**A7 Boom.** Während `kind === 'boom'` und `tick ∈ [from, until]`: bis `CAPS.wavers` (12) Spaziergänger (feste Teilmenge nach Hash, 50 %) mit `gesture 'wave'`; nur ab `WAIT_MIN_ZOOM`. «Bewegung reduzieren»: keine Winker (Deckel 0).

### Abnahmekriterien Teil A (Vitest, `tests/render/`, reine Funktionen, Fake-Kontext `fakeCtx.ts`)

- AK-A1 `waitersOf`: 0 bei Tick 29, 1 bei 30, 2 bei 150, 3 bei 600; kein Mangel → 0; negative/`NaN`-Eingabe → 0, kein Wurf.
- AK-A2 Entprellen: Mangel von Tick 100 bis 120 und wieder weg → nie eine Figur (Map leert sich); Mangel springt ein-aus-ein im Takt 10 → Zähler startet jedes Mal neu.
- AK-A3 Farbe: Figur trägt `symbolFor(erster Eintrag).color`; Mangel `supply` und `good` liefern die Farben der Symbole (kein eigener Farbwert in `reaktion.ts`).
- AK-A4 Deckel: 20 Häuser mit Mangel → genau 12 Wartende, je Haus zuerst 1 Figur; reduziert 4; Summe aus Laufwegen, Reagierenden und Spaziergängern ≤ `CAP walkers` (40 / 12), Test mit allen drei Quellen gleichzeitig.
- AK-A5 Zoom: bei Zoom 0,99 → keine Wartenden, bei 1,0 → ja; Spaziergänger und Laufwege unverändert zu heute.
- AK-A6 Pause: Tick und Zeit bleiben stehen → Anzahl und Pose gleich über zwei Frames (Pose hängt nur von `world.tick`, Hash, Weg, nie von `fx.timeMs`).
- AK-A7 Determinismus: gleiche Welt und Tick → gleiche Wartende (Ids, Posen); `Object.freeze` auf Welt und Gebäude wirft nicht (Darstellung schreibt nie).
- AK-A8 Sturm: `stormPose` bei Tick vor `Ti` = normale Pose; ab `Ti + 20` alpha 0; nach `until` Einblenden 20 Ticks; ohne `world.crisis` identisch zu heute (Regression).
- AK-A9 Boom: Winker = feste Teilmenge, ≤ 12; reduziert 0; ausserhalb `[from, until]` keine; `drawWalker` ohne `gesture` zeichnet identische Aufrufe wie heute.
- Browser-Check (Playtester): Haus ohne Marktzugang, 1× belassen: nach ≈ 3 s erste Figur, nach 15 s zweite, nach 60 s dritte; Versorgung herstellen → Figuren gehen weg; Sturm auslösen → Strassen leeren sich; keine Verdeckung der Bedarfssymbole (Symbol in der Signalebene bleibt oben).

## Teil B (I-119, Brand-Eimerkette)

**B1 Auslöser.** `world.crisis.kind === 'fire'`, `outcome` ∈ {`burning`, `extinguished`}, `tile` und `target` vorhanden (`miss` und fehlendes Ziel → nichts), `tick ∈ [from, until]`. **Brand unter 5 s Restzeit** (`until - tick < 50`): keine neuen Läufer; bereits laufende bleiben bis `until` und blenden dann in 10 Ticks aus.
**B2 Läufer.** Bis 6 Spaziergänger-Figuren (`CAPS.firefighters`, normal 8 inklusive Löscher), Startkacheln = Wegknoten im Umkreis 6 um `tile` (feste Auswahl nach Hash, Index ≥ 0). Pfad: kürzester Weg über den vorhandenen Weggraph (`roadGraph`, `life.ts`) zum Wegknoten, der dem brennenden Haus am nächsten liegt; Breitensuche, Suchtiefe ≤ 12 Knoten, Ergebnis gecacht je (Weggraph, `crisis.from`, Start). Läufer starten bei `from`, Tempo 1,8 Kacheln/s Spielzeit (Darstellung), enden eine Kachel vor dem Ziel entlang des eigenen Pfads, gestaffelt um `k` Kacheln rückwärts (Reihe = «Kette»), Eimerpunkt (`gesture 'bucket'`) mit Wippen aus `timeMs`.
**B3 Löscher.** Steht eine Feuerwache (Betrieb `firestation`, Zustand `ok`, angebunden, deckt die Brandkachel nach demselben Prädikat wie die Abdeckungsanzeige `CoverageKind 'fire'`, `src/sim/queries.ts`) in Reichweite, kommen 2 Löscher von deren Anbindekachel; Kleidung wie bei Spaziergängern (`clothesOf`), dazu Eimer. Ohne Wache nur die bis 6 Spaziergänger.
**B4 Ende.** `outcome === 'extinguished'`: Läufer bleiben bis `until`, dann ausblenden. Zielgebäude abgerissen oder nicht mehr brennend: alle blenden in 10 Ticks aus.
**B5 «Bewegung reduzieren» und Pause.** Reduziert: keine Läufer (`firefighters` [x, 0]). Pause: Zeit = Tick plus Tickbruchteil, steht still; Eimerwippen friert mit `fx.timeMs` nicht ein (Geste, bewusst).
**B6 Zoom und Culling.** Nur Figuren im Bildausschnitt, nur wo Figuren sonst gezeichnet werden; Pfadberechnung nur, wenn der Brandtile im Bild oder ≤ 6 Kacheln daneben liegt.

### Abnahmekriterien Teil B

- AK-B1 `fireRunners`: Brand mit Ziel, Ticks 0…200 → ≤ 6 Läufer plus 2 Löscher bei Wache in Reichweite; ohne Wache 0 Löscher; `outcome 'miss'` oder `target` fehlt → 0.
- AK-B2 Brand unter 5 s: bei `until - tick < 50` keine neuen Läufer; bereits gestartete bleiben, Ausblenden in 10 Ticks.
- AK-B3 Pfad: Läuferposition bei Fortschritt 1 liegt höchstens 1,5 Kacheln vom Zielhaus; Läufer verlassen nie den Weggraph (alle Zwischenpunkte auf Wegknoten oder Kanten); Breitensuche bricht nach 12 Knoten ab (kein Absturz, Läufer fällt weg).
- AK-B4 Deckel: Summe Laufwege, Läufer, Wartende, Spaziergänger ≤ `CAP walkers`; reduziert 0 Läufer und 0 Löscher; Pfad-Cache ≤ 64 Einträge, danach geleert wie `PLAN_CACHE_MAX`.
- AK-B5 Pause: gleicher Tick und gleiche Zeit → gleiche Läuferposition; `fx.timeMs` verändert nur die Geste (Eimerhöhe), nie x/y.
- AK-B6 Determinismus: gleiche Welt, gleicher Tick → gleiche Ids und Positionen; keine `Math.random` in `reaktion.ts` (Text-Test wie bei `errands.ts`).
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

## Abgleich ORT-A (R714)

ORT-A schreibt in `src/render/`: `terrain.ts`, `iso.ts`, `sprites.ts` (`drawRoads`, `raggedYard`, `marketBody`, `kontorBody`, `buildingShadow`), `trees.ts` (Umfeld `treeShadow`), `limits.ts`, `renderer.ts` (Verzweigung `decor`-Items, Durchgang 5 «Schatten», `drawHover`-Export), `decor.ts`/`groundDecor.ts`, neu `ortsrand.ts`, `roadShape.ts`, `roadside.ts`, `shadowEdge.ts`.
Dieses Design schreibt: neu `src/render/reaktion.ts`; `life.ts` (`WalkerPose`, `drawWalker`), `errands.ts` (nur `walkersLeft`-Aufruf-Signatur falls nötig), `limits.ts` (3 Zeilen in `CAPS`), `renderer.ts` (Figurenblock Zeilen ≈ 620–660, Zeichen-Zweig `kind === 'walker'` ≈ 808), `overlays.ts` (nur gemeinsame Diagnoseliste, optional), Tests.
**Gemeinsame Dateien: `renderer.ts` und `limits.ts`** (verschiedene Abschnitte, konfliktarm). `life.ts`, `errands.ts`, `overlays.ts` fasst ORT-A nicht an. I-120/I-118 (R707, gemergt) berührt `renderer.ts` (Aufstiegs-Verdrahtung), `fx.ts`, `limits.ts` (`riseGlow`): beim Plan `main`-Stand lesen.
**Reihenfolge:** Plan und Umsetzung erst nach ORT-A T20 (Zusammenführung `k1` → `k2`, R714), damit `renderer.ts`/`limits.ts` nur einmal gemergt werden; Gate Spec darf davor laufen. Danach A vor B.

## Randfälle (Übersicht)

Pause (Stillstand über Tick), Tempo ×4 (3-s-Entprellen in Ticks, Läufer ohne Flut dank Deckel), «Bewegung reduzieren» (Wartende ≤ 4, keine Läufer, keine Winker), Zoom < 1,0 (keine Wartenden), `lod` (keine Figuren), Laden eines Spielstands (Zähler fängt neu an: Wartende erscheinen erst nach erneutem Entprellen), Haus abgerissen oder Mangel behoben (Ausblenden 10 Ticks), Brand < 5 s, kein Weg angrenzend (keine Wartenden), Sturm ohne Häuser im Umkreis (Ausblenden am Ort), Krise mit `miss`, Krise auf anderer Insel (nur Figuren der angezeigten Insel; `tile.island` wie sonst).

## Nicht-Ziele

Kein Save, keine neuen Spielwerte in `src/sim/defs/`, kein Ton (Klang ist I-120), keine Hausbezug-Spaziergänger, keine Interaktion (Klick auf Wartende), keine Seuche (I-034), keine Pause bei Krise (I-058).

## Ruling-Entwürfe (an L0)

1. **Variante 3 (gestaffelt A dann B)** und Plan erst nach ORT-A T20.
2. **Darstellungskonstanten** (`WAIT_AFTER` 30 / `WAIT_2` 150 / `WAIT_3` 600 Ticks, Läufertempo 1,8, `CAPS.waiters` [12, 4], `firefighters` [8, 0], `wavers` [12, 0]) liegen in `reaktion.ts` und `limits.ts`, keine Spielwerte, kein Balancing-Test betroffen.
3. **Obergrenze:** Reagierende zählen gegen `CAPS.walkers` (ersetzen Spaziergänger), kein neuer Gesamtdeckel.
