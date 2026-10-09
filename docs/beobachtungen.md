# Beobachtungen (Posteingang für Befunde ausserhalb des Scopes)

Aufbau je Eintrag: Datum · Fundort · Beobachtung · Ursprung · erste Einschätzung.
Auswertung mit dem Skill `beobachtungen-auswerten`. Ein Folgeissue entsteht nur auf
ausdrückliche Zustimmung des Nutzers; im Studio gehen Paket-Kandidaten an L0.

Letzte Auswertung: 2026-10-09

**Marke (R287, R288):** Die Zeile „Letzte Auswertung: JJJJ-MM-TT“ ist die Zählmarke des SessionStart-Hooks. Als
Eintrag zählt jede Überschrift der Ebene 2 oder 3 unter der Marke, ausser „Offen …“ und „Ausgewertet …“. Neue
Einträge kommen deshalb ans Dateiende (Abschnitt „Offen“), und in den ausgewerteten Abschnitten stehen keine
Überschriften der Ebene 2 oder 3 ausser „Ausgewertet …“. Bei der nächsten Auswertung wird das Datum
nachgeführt und der Inhalt zu einem neuen „Ausgewertet …“-Abschnitt eingedampft.

**Stand 2026-10-06** (`lead-production`, Paket BEOB-AUSW-01, gegen `a721cb9`): 134 Einträge gesichtet (93
Überschriften und 41 datierte Zeilen, zusammen rund 300 Teilbefunde). Jeder Eintrag endet als erledigt (gestrichen),
abgehakt (mit Trigger), eingeplant (Board, 14 Paket-Kandidaten) oder Idee (`docs/ideen.md`, I-020 und I-021). Der
frühere Abschnitt „Offen“ der Auswertung vom 2026-09-30 ist darin aufgegangen; der Rest jener Auswertung steht unverändert im
[Archiv](beobachtungen-archiv.md).

**Stand 2026-10-08** (`lead-production`, Paket BEOB-AUSW-02, gegen `c6e9b32`): 18 Einträge gesichtet. Bilanz und Paket-Kandidaten stehen in „Ausgewertet 2026-10-08“; die Auswertung vom 2026-10-06 steht unverändert im [Archiv](beobachtungen-archiv.md).

**Stand 2026-10-09** (`lead-production`, Paket BEOB-AUSW, gegen `283b8ce`): 23 Einträge gesichtet. Bilanz und Paket-Kandidaten stehen in „Ausgewertet 2026-10-09“; die Auswertung vom 2026-10-08 steht darunter unverändert.

**Stand 2026-10-09 (2)** (`lead-production`, Paket BEOB-AUSW-03, gegen `d7291aa`): 11 Einträge (27 Teilbefunde) gesichtet. Bilanz und Paket-Kandidaten stehen in „Ausgewertet 2026-10-09 (2)“. Die Abschnitte „Ausgewertet 2026-10-06“ und „Ausgewertet 2026-09-30“ sind unverändert nach [beobachtungen-archiv.md](beobachtungen-archiv.md) verschoben (R417); Verweise „siehe Ausgewertet 2026-10-06“ in den Abschnitten unten zeigen dorthin.

---

## Ausgewertet 2026-10-09 (2)

**Bilanz** (11 Überschriften-Einträge mit 27 Teilbefunden, `lead-production`, Paket BEOB-AUSW-03, gegen `d7291aa`):
5 erledigt/überholt, 8 abgehakt (mit Trigger), 3 Trivial-Fix-Kandidaten, 11 Teilbefunde in 6 Paket-Kandidaten,
0 verworfen, 0 Ideen, 0 ungesichtet. Gezählt sind Teilbefunde. Verifiziert per grep und `git worktree list` am Code;
Bildbefunde, Kontrastwerte und Testzeiten aus Agentenberichten sind nicht neu gemessen. Die Rohfassung der Einträge
steht unverändert im [Archiv](beobachtungen-archiv.md).

**Erledigt / überholt**

| Eintrag                                                                         | Beleg                                                                                                                                                                                          |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEE-F3: „10 px“ gelten für Wrack/Eiland, Schiff hat 16 px                       | im Eintrag selbst als erledigt vermerkt (Merge `fix/see-f3-schiffskontrast`, `cb760c0`)                                                                                                        |
| Blindprobe ohne Schaumring/Wassertönung, Sichtprobe im echten Spiel fehlt       | `tools/render-qa/blindprobe.mjs` zeichnet nur Stempel auf Flächenwasser (belegt); Sichtprobe im Spiel danach im Release-Check REL-11 nachgeholt (`E-fels-z0.25.png`, „keine Boot-Lesart mehr“) |
| README «hoch»: Kaufleute fehlen in der Belegung                                 | `README.md` Steuertabelle, Zeile «hoch»: „Pioniere 3, Siedler 6, Bürger 11, Kaufleute 15“ (I-028, `5174971`)                                                                                   |
| README: Steuerregler «in der Kopfzeile»                                         | `README.md` „Steuern und Steuerregler“: „stehen im Panel der **Amtsstube**“ (I-028, `5174971`)                                                                                                 |
| Doku-Commits ohne `make docs-check` (Push-Gate REL-11/12)                       | R417 V2: Werkzeug-Paket TOOL-PRETTIER-HOOK nächste Session, bis dahin Pflichtzeile `make docs-check` im Briefing                                                                               |
| Smoke-Etikett „Save v9“ (`tools/render-qa/smoke.mjs:466`, Release-Check REL-13) | erledigt durch TOOL-BUENDEL: `tools/render-qa/saveVersion.mjs` liest die Version aus der Quelle (Commit `39239ba`, R419); der Eintrag in „Offen“ ist ausgetragen                               |

**Trivial-Fix-Kandidaten (L0 entscheidet; nicht umgesetzt)**

| Eintrag                                                  | Beleg (gegen `d7291aa`)                                                                                                   | Vorschlag                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `.vitest/` liegt untracked in Worktrees                  | `.gitignore` ohne `.vitest`; `git status` in `.worktrees/see-f3-schiffskontrast` zeigt `?? .vitest/`                      | Zeile `.vitest/` in `.gitignore`                                         |
| arc42 nennt „Steuersperre in Spielzeit“ in der Kopfzeile | `docs/arc42.md`, Zeile `hud.ts`; die Sperre zeigt `src/ui/taxView.ts` („wieder änderbar in …“), `hud.ts` hat keine Sperre | Halbsatz in der `hud.ts`-Zeile streichen, Sperre bei `taxView.ts` nennen |
| AK-Eindeutigkeits-Einzeiler erfasst `AK-T01` nicht       | `docs/studio/gates.md`, Gate Spec, lead-qa 4: Muster `AK-[A-Z0-9]*-[0-9]*` verlangt zwei Bindestriche                     | Muster `AK-[A-Z0-9-]*[0-9]` (studio-coach, nächster Handbuch-Minor)      |

**Paket-Kandidaten (L0 entscheidet, Auswahl REL-14)**

| Kandidat                                                                     | Grösse | Inhalt                                                                                                                                                                                                                      | Ursprung                                                | Beleg (gegen `d7291aa`)                                                                                                                                                                                                                   | Owner                                     |
| ---------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| UI-INSPEKTOR-KLARTEXT                                                        | S      | Haus-Inspektor zeigt „Versorgt ✓“ (Radius) neben „Mangel: Nahrung fehlt“ (Gut) und „Fehlt: Nahrung“; Begriffe trennen (z. B. „Im Marktradius“), Doppelzeile zusammenlegen; `TIER_LIST` durch `TIER_IDS` ersetzen            | Release-Check REL-11, Playtest REL-11 UI (a), I-028 T4  | `src/ui/panelView.ts` `supplyChip`; `src/ui/inspect.ts` `setFirstMissing`, `houseDiagnosis`-Liste, `TIER_LIST`; `src/sim/defs/tiers.ts` `TIER_IDS`                                                                                        | lead-tech                                 |
| SIM-FEST-INSEL                                                               | S      | `feastActive` prüft die Insel nicht: Hauskoordinaten sind inselbezogen, eine Kapelle wirkt auf Häuser einer Fremdinsel mit passenden Koordinaten; Test mit zwei Inseln, dann `b.island === house.island`                    | Plan I-028 (lead-tech)                                  | `src/sim/feast.ts` `feastActive`/`inChapelRadius` ohne Inselvergleich; `src/sim/types.ts` `Building.island`; `tileAt(islandOf(…), x, y)`                                                                                                  | lead-tech (bündelbar mit UI-INSELFILTER)  |
| ART-FELS-FERNGROESSE                                                         | S      | Meeresfels bei Zoom 0,25 nur ≈ 5 px; Mindestgrösse wie Wrack/Eiland prüfen (Designurteil lead-art)                                                                                                                          | Release-Check REL-11                                    | `src/render/decorStamps.ts` `minStampScale` gilt nur für `wreck`/`islet`                                                                                                                                                                  | lead-art                                  |
| UI-SEEKARTE-NACHZUG                                                          | S      | Layout und Silhouetten-Cache bleiben bei offenem Popover über einen Weltwechsel; Kontor-Marke unter dem Schiffspunkt und nicht an dpr gebunden; Zeittest `< 50 ms` auf Zähler; Szenen-Helfer Seekarte in `tools/render-qa/` | UI-SEEKARTE Reviews, Release-Check REL-12               | `src/ui/hud.ts` `layout` nur beim Öffnen gesetzt; `src/render/seaMap.ts` `fillRect(m.x - 2, …, 4, 4)`, `arc(…, 3, …)`; `tests/render/seaMap.test.ts` `performance.now`; kein Seekarten-Skript in `tools/render-qa/`                       | lead-tech (Helfer: lead-art)              |
| TOOL-STUDIO-HYGIENE (Erweiterung) — erledigt durch TOOL-BUENDEL (2026-10-09) | S      | Spawn ohne `agent_start` meldet „Agent unbekannt ist inaktiv“ (Frist, dann ausblenden); Testsperre meldet verwaiste Vitest-Worker (PPID 1, älter als 30 min), nur melden                                                    | Release-Retro REL-12 (B-b), Session fb37ceac (L0)       | `tools/studio/effort.py` Vorfall `inaktiv` aus `inactive_keys`; `tools/testlock/testlock.ts`; Worker am 2026-10-09 beendet, jetzt keiner aktiv (`ps`)                                                                                     | lead-production (`production-studio-ops`) |
| CLEANUP-WT-2                                                                 | S      | Scratch-Worktree unter dem Scratchpad (Session e90e097e), sieben gemergte Worktrees, Datei `.worktrees/check2.log`                                                                                                          | REL-11 Review (lead-art); Nebenbefund dieser Auswertung | `git worktree list`: `…/e90e097e-…/scratchpad/mainwt` (detached), `art-meeresfels`, `rel11-kamera`, `rel11-triv`, `render-seeplan-keepout`, `see-f3-schiffskontrast`, `steuer-je-stufe`, `ui-seekarte` alle in `git branch --merged main` | production-integrator (Ruling nötig, §6)  |

Empfehlung für REL-14: UI-INSPEKTOR-KLARTEXT und SIM-FEST-INSEL (spielwirksam, mittel), dazu ART-FELS-FERNGROESSE als
kleiner Render-Strang; die übrigen bei Gelegenheit. Dateien disjunkt: `src/ui/inspect.ts`/`panelView.ts`,
`src/sim/feast.ts`, `src/render/decorStamps.ts`.

**Abgehakt (bewusst nichts tun, mit Reevaluations-Trigger)**

| Eintrag                                                           | Begründung / Beleg                                                                                      | Trigger zurück                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Schiffsmast ohne Saum, kleinster Saumkontrast 2,21 knapp über 2,2 | `src/render/ship.ts` Mast nur `stroke()`, `strokeSaum` nur an Rumpf und Segel; Werte nicht neu gemessen | RENDER-LOOK-01 oder Playtest meldet unsichtbaren Mast      |
| `seaPlanKeepOutIndex.test.ts` ≈ 2,3 s                             | neuer Test, nicht unter der 500-ms-Regel; Zeit nicht neu gemessen                                       | Suite-Laufzeitdruck oder Zeitreserve-Push ohne Reserve     |
| Hüllenecken bei Zoom 1 zeigen nur Wasser                          | von R401 akzeptiert                                                                                     | Spielerbefund                                              |
| Seekarten-Popover verdeckt Lager-Chips, Hover zeigt Iso-Rechteck  | gewollt (Eintrag selbst)                                                                                | Playtest-Verwirrung                                        |
| Claude-Session „anno-clone #3“ lebt weiter                        | ungeklärt (R324), keine Wirkung im Repo festgestellt                                                    | Ereignisse dieser Session im Log oder Konflikt im Worktree |
| Kopfzeile bei 800 × 600 teilweise abgeschnitten                   | Desktop-first ab 1280 px, nur „stürzt nicht ab“                                                         | Nutzer meldet schmale Fenster                              |
| I-028 T1a: Rot-Belege teils nur formal                            | Prozess; Messgrösse R410 V2                                                                             | Session-Retro wertet R410 V2 aus                           |
| AK-T17 prüft die Versorgung der vier Häuser nicht ausdrücklich    | `tests/sim/save.test.ts` AK-T17 (Rundreise, Weiterlauf); Testtiefe                                      | nächstes Sim-Paket an Steuern                              |

**Falsche Prämissen:** Der Inaktiv-Vorfall entsteht nicht in `tools/studio/model.py` `pending_incidents`, sondern dort
nur gesammelt; den Text „Agent … ist inaktiv“ baut `tools/studio/effort.py`.

**Ideen:** keine.

---

## Ausgewertet 2026-10-09

**Bilanz** (11 Überschriften-Einträge und 12 datierte Zeilen, `lead-production`, Paket BEOB-AUSW, gegen `283b8ce`):
7 erledigt/überholt, 10 abgehakt (mit Trigger), 3 Trivial-Fix-Kandidaten, 5 REL-11-/Paket-Kandidaten, 0 verworfen,
0 Ideen, 0 ungesichtet. Einträge mit mehreren Teilbefunden sind nach dem Hauptausgang gezählt. Verifiziert per grep am
Code (Fundstellen unten); Bildbefunde, Messwerte und CI-Zeiten aus Agentenberichten sind nicht neu gemessen.

**Erledigt / überholt**

| Eintrag                                                                                   | Beleg                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Importzyklus `inspect.ts` ↔ `panelView.ts`; UI-PANEL-AUFRAEUMEN (Bauleiste, Etiketten)    | `src/ui/panelView.ts` importiert nichts mehr aus `./inspect`; Punkt (a) mit UI-KAMERA-KLEMMUNG geschlossen                                                              |
| `willReadFrequently`-Warnung (REL-08, SEE-F2-UX (d))                                      | `READBACK_CTX` in `src/render/terrain.ts`, Test `tests/render/terrainReadback.test.ts` (AK-T03a)                                                                        |
| `zeitreserve-push` liest veraltete Messdatei                                              | `tools/zeitreserve/reporter.ts` stempelt `commit`, `tools/zeitreserve/rule.ts` verweigert fremden Commit; Rest (Last während des Laufs) → TOOL-GATES-2 (R392)           |
| Geräte-DPR nur über `ResizeObserver` (PERF-L57) und `matchMedia`-Listener (SEE-F2-UX (c)) | `src/ui/app.ts` `watchDpr`/`onDprChange` mit `matchMedia('(resolution: …dppx)')`; nur der manuelle Browser-Zoom-Test fehlt (siehe Abgehakt)                             |
| Totholz ohne Waldnachbar wechselt beim Roden die Art (ART-L8-SELTEN)                      | `src/render/decor.ts` `groundElementAt`: `G_KINDS[g - 1] !== 'deadwood' \|\| edge4`, Kommentar „B7 braucht jetzt Wald als Nachbarn“                                     |
| Gischt am Wasserfall angeschlossen (Teil von ART-WALD-RAUTEN-Rest)                        | `drawFallSparks` wird in `src/render/renderer.ts` gerufen; nur die Bildprüfung fehlt (siehe Abgehakt)                                                                   |
| Messskripte nach `tools/render-qa/` (Teil von TOOL-RENDERQA-NACHZUG)                      | `hitch.mjs`, `altwald.mjs`, `proben.mjs`, `perf-lauf.sh`, `kalt.mjs`, `korridor.mjs` liegen dort; Rest `trace.mjs`/`calls.mjs`/`incl.mjs` fehlt noch (siehe Kandidaten) |

**Trivial-Fix-Kandidaten (L0 entscheidet; nicht umgesetzt)**

| Eintrag                                         | Beleg                                                                                                                            | Vorschlag                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `noLoadableReason()` toter Code (SEE-F2-UX (b)) | `grep noLoadableReason src tests` → nur die Definition in `src/ui/storage.ts`                                                    | Funktion löschen (Minuten, kein Testaufwand)                     |
| `favicon.ico` liefert 404 (REL-08)              | `index.html` ohne `<link rel="icon">`, `public/` enthält nur `audio`, `fonts`                                                    | `<link rel="icon" href="data:,">` oder kleines Icon in `public/` |
| Kontrast `.needs`/`.reasons` Rand 2,3–2,7 : 1   | `src/style.css` `.needs .ok` `border-left: 4px solid var(--ok)`, `.bad` `var(--signal-red)`; `--tone-*` existieren (ab Zeile 31) | Randfarben auf `--tone-ok`/`--tone-bad`; Kontrast neu messen     |

**Umgesetzt in REL-11 UI (2026-10-09, R400):** UI-KAMERA-RAND (konvexe Hülle, `fix/rel11-kamera`), Kontrast `.needs`/`.reasons` (`--tone-*`, Test in `contrast.test.ts`) und `noLoadableReason` gelöscht (`fix/rel11-triv`). `favicon` war schon seit `a7e2192` erledigt (Data-URI in `index.html`); der Eintrag oben war veraltet.

**Playtest REL-11 UI (2026-10-09, `.studio/qa/REL11-UI/`):** Hülle nie schlechter als das Rechteck (Seed 7, SW, Zoom 0,25: 78 gegen 0 Landkacheln im Bild, Abstand 366 gegen 878 px). Ein Rest bleibt: an einzelnen Hüllenecken zeigt das Bild bei Zoom 0,5/1 nur Wasser (Land-Box mit Rand 6 ≠ Land; Seed 7 SW Zoom 1: 1382 px Abstand statt 3472). Von R400 akzeptiert; Korridore oder engere Hülle nur bei Spielerbefund. Weitere Befunde: (a) Im Inspektor-Panel erscheint neben einer `.needs`-Zeile nur mit „✗“ zusätzlich „Fehlt: Nahrung“ (wirkt doppelt, UX niedrig). (b) Resize hält die Seitenposition einer Kachel, zentriert nicht nach (im Rahmeninnern gewollt, am Rand nicht gemessen).

**Final-Review REL-11 UI (opus, OK):** `src/render/sprites.ts` hat eine eigene private `convexHull`, fast gleich der neuen in `src/render/camera.ts` (DRY, niedrig); zusammenlegen erst nach dem Merge des Render-Strangs. Trigger: nächster Eingriff in `sprites.ts` oder `camera.ts`.

**Kandidaten für REL-11 / Pakete (L0 entscheidet)**

| Paket-ID (Vorschlag)         | Inhalt                                                                                                                                                                | Beleg                                                                                   | Prio    | Owner     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------- | --------- |
| ART-MEERESFELS               | Meeresfelsen bei Zoom ≤ 0,5 wirken wie Boote (Blindprobe, zweite Bildrunde L8)                                                                                        | R390 (Blindprobe), Eintrag Bildrunde 2026-10-09                                         | mittel  | lead-art  |
| UI-KAMERA-RAND               | Rahmenecken zeigen nur Wasser (Rechteck um verstreute Inseln); Mittenklemmung schiebt bei Resize um halbe Änderung zurück                                             | `src/ui/input.ts` `clamp` → `clampToRect(…, cameraBounds(islands), …)`; R390            | niedrig | lead-tech |
| SEE-F3-SCHIFFSKONTRAST       | schon in state.md Punkt 2 (aus Auswertung 2026-10-06, Urteil lead-art offen)                                                                                          | siehe „Ausgewertet 2026-10-06“                                                          | mittel  | lead-art  |
| RENDER-SEEPLAN-KEEPOUT       | `seaPlanKeepOut` prüft alle ≈ 630 Routenpunkte je Element (≈ 9 ms statt 2,3 ms beim Neubau nach Kontor-Wechsel); Bounding-Box vorschalten                             | `src/render/decor.ts` `seaPlanKeepOut`: `for (const r of ctx.routes) for (…) distToSeg` | niedrig | lead-art  |
| TOOL-RENDERQA-NACHZUG (Rest) | `trace.mjs`, `calls.mjs`, `incl.mjs` (Frame-Budget, Zeichenaufrufe) aus dem Scratchpad nach `tools/render-qa/`; Hinweis zur Frame-Reserve (~0,2–1 ms) für neue Ebenen | `ls tools/render-qa/` ohne die drei Skripte                                             | niedrig | lead-art  |

Die Pakete passen als ein Render-Strang (ART-MEERESFELS, RENDER-SEEPLAN-KEEPOUT, SEE-F3-SCHIFFSKONTRAST, alle in
`src/render/`) und ein UI-Strang (UI-KAMERA-RAND, `src/ui/input.ts`/`app.ts`); die drei Trivial-Fixes können in den UI-Strang.

**Abgehakt (bewusst nichts tun, mit Reevaluations-Trigger)**

| Eintrag                                                                                                                                       | Begründung / Beleg                                                                                                     | Trigger zurück                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `perf.test.ts` AK-E0-15a und `terrain.test.ts` AK-R1-06 rot unter Last (Load 7 bis 19)                                                        | Messartefakt, `tests/sim/perf.test.ts` `PERF_PIN = 2.5`, beide in ZEITTESTS (`vite.config.ts`); Wiederholung grün      | rot auf ruhiger Maschine (Load ≤ 3) oder nach TOOL-GATES-2 weiter rot               |
| Zeitreserve-Runner-Prüfung läuft auf CI zusätzlich                                                                                            | `tools/zeitreserve/check.ts` ruft `checkRunnerEstimate` immer; kostet Sekunden                                         | nächste Arbeit an `tools/zeitreserve/` (mit TOOL-GATES-2 prüfen)                    |
| Panel bei 800×600 unter dem Canvas; Glashütte im Brand läuft bei 1280×720 über die Panelhöhe                                                  | Desktop-first, schmale Fenster nur „stürzt nicht ab“; Glashütte per Scrollen erreichbar; nicht neu im Browser gemessen | Nutzer meldet schmale Fenster oder abgeschnittene Panelteile                        |
| `fauna.ts` `massifHeightAt`/`sightFree` doppelt zu `massif.ts` (`heightAtF`, `sightFree`)                                                     | beide Stellen vorhanden (`fauna.ts` exportiert und getestet, `massif.ts` privat); Hygiene                              | nächster Eingriff in `massif.ts` oder `fauna.ts`                                    |
| Fuchs: `alive` prüft nur die Ankerkachel, nicht den Laufweg                                                                                   | `fauna.ts` `alive: notBuilt(…)` je Anker; Optik-Detail                                                                 | Playtest meldet Fuchs über Wegen                                                    |
| ART-WALD-RAUTEN-Rest (Fussring, Schaum ohne Objekt, Strand-Warp 3 px, Patch-Test ohne Aussenrand); Gischt-Bild bei Tag und Nacht ungesehen    | Galerie zeigt keine Rauten mehr; Bildprüfung nicht neu gemacht                                                         | nächster Galerie-Lauf (`tools/render-qa/galerie.mjs`) oder Nutzer sieht Rauten      |
| Frame-Budget im Headless-Chrome (Reserve 0,2–1 ms, `DoUpdateLayers` ≈ 13 ms)                                                                  | Hinweis für künftige Render-Pakete, Bodencache `groundCache.ts` senkt auf ≈ 8 ms; Messung nicht wiederholt             | neue Ebene mit Zusatz-Zeichenaufrufen je Frame                                      |
| Manueller Browser-Zoom-Test des DPR-Listeners                                                                                                 | Listener vorhanden (siehe Erledigt), CDP löst keine matchMedia-Events aus                                              | Nutzer zieht Fenster zwischen Monitoren und das Bild bleibt unscharf                |
| SEE-F2-UX (a) Hinweistext «Nicht genug Holz auf <Insel>»; (e) I-019 bleibt eigenes Paket nach SEE-F1                                          | UX niedrig; (e) liegt in `docs/ideen.md` (I-019)                                                                       | Playtest-Verwirrung bei Kontor II oder Ideen-Runde zu I-019                         |
| UI-PANEL-AUFRAEUMEN (b) Overlay deckt Ereignis-Log, (c) Klick auf Hauptleiste schliesst Overlay; REL-08 „Einwohner sinken ohne Weg“           | (b) vertretbar, (c) nicht gegen `main` verglichen, Einwohner vermutlich Sim-Absicht                                    | Playtest meldet Log-Verdeckung oder unerwartetes Schliessen                         |
| CI-Laufzeit `make check` 276 s statt ≈ 81 s (Vitest 225 s)                                                                                    | Läufe vom 8.10. erneut ≈ 6 min (`gh run list`); R389 kürzte `trees-licht`; keine neue Zerlegung                        | Laufzeit über 8 min oder Actions-Minuten knapp: `--reporter=verbose` auf dem Runner |
| SEE-F1-KORRIDOR Mehrzeit `waterSea`, `wildlife`, `decor` (je < 1 s)                                                                           | `seaRoute` kalt ≈ 14 ms und Durchgang B ≈ 9 ms je Welt, im Spiel einmalig; `decor`-Tests auf Seeds 1–40 gekürzt        | `waterSea`/`wildlife` im Zeitreserve-Push ohne Reserve: auf Seeds 1–40 kürzen       |
| `rareBudget` zählt Lose statt sichtbarer Elemente; Band 3–6 nur auf Losen (3 von 200 Seeds < 3 Elemente); Strandkiefern und `STAMP_MAX` (300) | gewollt (AK5); `STAMP_MAX = 300` praktisch nicht erreichbar                                                            | Bildbefund „zu leere Insel“ oder Stempelzahl nahe 300                               |

**Ideen:** keine.

---

## Ausgewertet 2026-10-08

**Bilanz** (18 Einträge, `lead-production`, Paket BEOB-AUSW-02, gegen `c6e9b32`): 5 erledigt, 7 abgehakt (mit
Trigger), 6 eingeplant (Paket-Kandidaten), 0 verworfen, 0 Ideen, 0 ungesichtet. Einige Einträge zerfallen
in Teilbefunde mit verschiedenen Ausgängen; gezählt ist der Hauptausgang. Verifiziert am Code (Fundstellen unten);
Teilbefunde aus Agentenberichten (Bildbefunde, Messwerte) sind nicht neu gemessen.

**Erledigt**

| Eintrag                                              | Beleg                                                                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Runner `ubuntu-24.04` festgenagelt (R293)            | `.github/workflows/ci.yml`, `pages.yml` (`runs-on: ubuntu-24.04`, Actions `@v7`), `b0efc2e`; CI-ACTIONS-NODE damit erledigt           |
| Zeitreserve-Altlast (26 Bestandstests)               | `tools/zeitreserve/baseline.json` ist eine leere Liste (R318, `4695986`)                                                              |
| Pin `renderer.test.ts` Heimat-Aufrufliste (L4/L6)    | im Eintrag selbst als in REL-07 Lauf B erledigt vermerkt (R327)                                                                       |
| Alte Worktrees unter `.worktrees/`                   | wird durch Paket CLEANUP-WT erledigt (R331, Integrator räumt auf)                                                                     |
| `tools/render-qa/galerie.mjs` / Tier-4-Falle / Nacht | `galerie.mjs` liegt jetzt in `tools/render-qa/`; Rest siehe Abgehakt                                                                  |
| ART-L8-SELTEN (Seltenheitsband L8)                   | Branch `feat/l8-selten`: Quotenlauf Seeds 1–500, Kaltstart −0,2 % (AK11), Bilder `.studio/qa/ART-L8-SELTEN/`, Review BEDENKEN niedrig |

**Eingeplant (Paket-Kandidaten, L0 entscheidet; Empfehlung im Bericht)**

| Paket-ID (Vorschlag)            | Inhalt                                                                                                                                                                                                            | Beleg (geprüft 2026-10-08 gegen `c6e9b32`)                                                                                                                 | Prio    | Owner                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------- |
| UI-INSELFILTER                  | Iteratoren über alle Inseln: `protectedCount` zählt Fremdinsel-Gebäude mit (sicher falsch); `inhabitantsOf`, Rathaus-Suche, Panel-Einwohner, `guide`, `hints`, `soundEvents`, `startCard`, `app` je Stelle prüfen | `src/ui/inspect.ts` `protectedCount` (`Object.values(world.buildings)`), `:72`, `:432`, `:818`; `src/render/homeBuildings.ts` `homeBuildings` liegt bereit | mittel  | lead-tech                                 |
| ART-WALD-RAUTEN                 | Rautenkanten: Waldmaske, Wiesen-Tonflecken, Gras/Sand-Treppe, Sand-Stufen, Gebirgs-Fussring, Schaum ohne Objekt (wirkt rasterartig) → Rasterstufe der Welterzeugung/`terrain.ts`                                  | Einträge ART-STIL-02, L1r2, REL-07 B10–B13, Nachprüfung; `terrain.ts` ungeändert seit Eintrag                                                              | mittel  | lead-art                                  |
| ART-C7-ANSCHLUSS                | Gischt-Glitzern: `fallSparks`/`drawFallSparks` nie vom Renderer gerufen (toter Code, B6); anschliessen oder löschen; Meeresfelsen als Boot; Fauna-Anker nach Weg/Laden; Tag-Pin AK-E1-10; Aufräumen `fauna.ts`    | `grep drawFallSparks src/render` → nur Definition in `fauna.ts`; `tests/render/renderer.test.ts` AK-E1-10 setzt `tick = 3000` (Nacht)                      | niedrig | lead-art (mit PERF-L57)                   |
| TOOL-RENDERQA-NACHZUG           | Messskripte (`hitch*.mjs`, `altwald.mjs`, `proben.mjs`, `perf-lauf.sh`) aus `.studio/qa/` nach `tools/render-qa/` (R315), vor PERF-L57; `cachesReady`-Abbruch Seed 14; Dev-Hook Tageszeit                         | `ls tools/render-qa/` enthält sie nicht                                                                                                                    | mittel  | lead-art                                  |
| TOOL-STUDIO-HYGIENE (erweitert) | Ampelklasse „Leads" mischt Plan-Leads (`role_class`); Paketfeld nicht normalisiert (`ART-STIL-02-umsetzung` gegen `ART-STIL-02`)                                                                                  | `tools/studio/efficiency.py` `role_class` (`lead-` → „Leads"); `package_family`; beide Punkte dort anhängen                                                | mittel  | lead-production (`production-studio-ops`) |

Zeitreserve `groundBeach.test.ts` D9/D5 und Zeittest B6 `save.test.ts` gehören zu TOOL-ZEITRESERVE-RUNNER (R329/R330,
Board); `fauna.test.ts` Eignung Seeds 1–20 desgleichen. PERF-L57 (Kaltstart L5–L7, Waldaufbau nach Bau, `massif.ts`
Raster) ist bereits benannt (R327).

**Abgehakt (bewusst nichts tun, mit Reevaluations-Trigger)**

| Cluster                                                                                                                                                                                                                             | Begründung                                      | Trigger zurück                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Umstieg `ubuntu-latest` → Ubuntu 26                                                                                                                                                                                                 | Runner ist auf `ubuntu-24.04` festgelegt (R293) | Ubuntu 24.04 wird abgekündigt oder jemand arbeitet ohnehin an `.github/workflows/`  |
| Culling-Zuschlag Bäume/Deko (Kronenüberhang), Hinweis zu grösseren Kronen in `trees.ts`                                                                                                                                             | niedrig, nur am Bildrand beim Scrollen          | Riesenbaum (L6) oder Kronen über 1 Kachel; sonst nächster Eingriff in `renderer.ts` |
| Code-Hygiene Render: `trees.ts` Salz `513`, `decorHill` doppelt zu `meadowHill`, `terrain.ts`-Kommentar „a > 0", `seaFoamVisible` je Frame, `minStampScale` toter Pfad, `stampBlocked`-Hinweis, `iso.ts` Gleichstand nach `fp.x`    | niedrig, gemessen unkritisch                    | nächster Eingriff in die jeweilige Datei                                            |
| Doppeltes Runden `worldToScreen`/Stempel, Hofkram, Material erst bei warmem Cache (aus Auswertung 2026-10-06 weitergeführt)                                                                                                         | siehe dort                                      | wie dort                                                                            |
| Tools: `perf.mjs` Standardgrösse 1280 × 800, Tier-4-Falle in QA-Skripten, `__inselDev` ohne Tageszeit-Hook (in TOOL-RENDERQA-NACHZUG), `perf:`-Commitpräfix (3 Commits, nicht änderbar), Blindtest ohne Marken, A/A-Läufe `rel-07b` | Werkzeug- und Prozesshinweise                   | Perf-Messung nach Spec §5; nächster Blindtest (Vorlage um Marken ergänzen)          |
| `massif.ts` Raster (330 MB) mit `toEqual` hängt                                                                                                                                                                                     | Tests vergleichen nur Kennung und Kacheln       | PERF-L57 oder neuer Test auf `massif`                                               |

**Ideen:** keine. (Die Meeres-/Schaum-Optik gehört zu ART-WALD-RAUTEN und ART-C7-ANSCHLUSS.)

---

## Offen (neue Einträge unten anhängen)

### 2026-10-09 · ART-FELS-FERNGROESSE abgehakt (R423)

- **Fundort:** `src/render/decorStamps.ts` (Meeresfels, Zoom 0,25 ≈ 5–6 px). Urteil `lead-art` NEIN: Der Meeresfels bleibt massstabstreu (reine Deko ohne Sim-Bezug; Bildrangfolge Schiff 16 px vor Fels; Blindprobe bestanden). Ursprung: Release-Check REL-11, BEOB-AUSW-03. Einschätzung: abgehakt; der tote Fern-Code (`minStampScale`) ist in REL-14 entfernt.
- **Trigger für eine Neubewertung:** (1) Felsen bekommen eine Spielwirkung; (2) ein Playtest vermisst Felsen in der Fernansicht; (3) die Schiffs-Mindestgrösse oder der kleinste Zoom ändert sich.

### 2026-10-09 · UI-INSPEKTOR-HILFSZEILE Mangel doppelt (REL-14 Playtest)

- **Fundort:** Haus-Panel (`src/ui/inspect.ts`), Playtest `.studio/qa/REL-14/z2-ware-fehlt.png`, `z2b-dienst.png`. Unter „Mangel: Nahrung fehlt“ steht die Hilfszeile „Nahrung fehlt: baue Fischerhütte (F)“ (bei Dienst: „Kapelle fehlt: baue Kapelle (K) in Reichweite“). Besteht schon vor REL-14; keine „Fehlt:“-Zeile, widerspricht dem Chip nicht.
- **Einschätzung:** Mangel wird zweimal genannt (Liste und Hilfszeile). Nur bei Bedarf kürzen; Entscheid `lead-design`.

### 2026-10-09 · TOOL-BUENDEL: `make studio-lint` auf main rot

- **Fundort:** `make studio-lint` (`uvx ruff`, ungepinnt) meldet auf `main` 28 Ruff-Altfehler, z. B. UP017 (`timezone.utc`). Worker prüfen nur ihre eigenen Dateien. Ursprung: TOOL-BUENDEL T01–T05. Einschätzung: niedrig bis mittel; Ruff-Version pinnen und Altfehler in einem Werkzeug-Paket beheben.

### 2026-10-09 · TOOL-BUENDEL: Testschalter in `paths.py` ohne Kommentar

- **Fundort:** `tools/studio/paths.py` (Zeilen ca. 36 und 45): `STUDIO_HOME` und `STUDIO_DOCS` sind Testschalter ohne Kommentar «nur für Tests» (R378). Ursprung: TOOL-BUENDEL. Einschätzung: niedrig, Trivial-Fix (ein Kommentar je Schalter; studio-coach, da `tools/studio/`).

### 2026-10-09 · TOOL-BUENDEL: Probe-Event `commit_rejected` im Haupt-Log

- **Fundort:** `.studio/events.jsonl` im Hauptcheckout enthält ein Probe-Ereignis `commit_rejected` aus dem Echtlauf der Ablehnung. Ursprung: TOOL-BUENDEL T01. Einschätzung: niedrig; verfälscht höchstens die Zählung ablehnender Commits, beim nächsten `make studio-archive` erledigt.

### 2026-10-09 · TOOL-BUENDEL: Ampelzeile mit bereinigtem Steuerungsanteil im Dashboard

- **Fundort:** Dashboard (`tools/studio/dashboard/`); `tools/studio/efficiency.py` liefert `steuerung_bereinigt` bisher nur als Textzeile der Metriken (E-049). Ursprung: TOOL-BUENDEL T05 (Review R428 qa B3, E-038). Einschätzung: Nachfolgepunkt; Ampelzeile mit dem bereinigten Wert neben der Rohzeile, Paket-Kandidat für `lead-production`.

### 2026-10-09 · TOOL-BUENDEL: `metrics.py --session latest` schreibt ins Hauptcheckout

- **Fundort:** `tools/studio/metrics.py --session latest` schreibt nach `docs/studio/metriken/` des Hauptcheckouts, auch wenn es aus einem Worktree läuft. Ursprung: TOOL-BUENDEL T05. Einschätzung: niedrig bis mittel; Zielpfad aus dem Worktree ableiten (studio-coach, da `tools/studio/`).

### 2026-10-09 · REL-14 (R430): Dienst-Mangel «fehlt in Reichweite» in der Aufstiegsliste

- **Fundort:** `src/sim/population.ts:156`: die Aufstiegsliste nennt den Dienst-Mangel als «fehlt in Reichweite». Ursprung: REL-14 Merge (R430). Einschätzung: Urteil `lead-design`, ob der Wortlaut zum neuen Inspektor-Klartext passt.

### 2026-10-09 · REL-14 (R430): Testtitel «ab 0,25» veraltet

- **Fundort:** `tests/render/decorSea.test.ts:259`: der Testtitel nennt «ab 0,25», der Titel passt nicht mehr zum Verhalten nach REL-14 (Fern-Code entfernt). Ursprung: REL-14 (R430). Einschätzung: niedrig, Trivial-Fix (Titel anpassen, Test unverändert).

### 2026-10-09 · REL-14 (R430): Hover-Karte verdeckt Cursor-Hinweis

- **Fundort:** Playtest REL-14: die Hover-Karte verdeckt den Cursor-Hinweis. Ursprung: REL-14 Playtest. Einschätzung: niedrig bis mittel, Kosmetik der UI; Entscheid `lead-design`.

### 2026-10-09 · R429-Risiko: `zeitreserve-push` verwirft die Messung bei Last > 4

- **Fundort:** `make zeitreserve-push` / `make check`. Ist die Last beim Start von `make check` grösser als 4, verwirft `zeitreserve-push` die Messung (Exit 2 «nicht belastbar»); `make check` muss dann neu laufen. Ursprung: R429. Einschätzung: bekanntes Risiko, kein Fehler; vor dem Push `make messfenster` prüfen.

### 2026-10-09 · TOOL-BUENDEL: Git-Hook blockiert den Commit ohne `python3`

- **Fundort:** `tools/githooks/pre-commit:7`: fehlt `python3` im PATH, endet der Hook mit Exit 127 und blockiert den Commit, obwohl alle anderen Fehler den Commit zulassen. Ursprung: TOOL-BUENDEL T01 (Final-Review). Einschätzung: niedrig; vor dem `exec` mit `command -v python3` prüfen und sonst mit Hinweis `exit 0`.

### 2026-10-09 · TOOL-BUENDEL: Schein-Session «manual» im Dashboard

- **Fundort:** `tools/studio/precommit.py:68`: ohne `CLAUDE_CODE_SESSION_ID` setzt `record` die session_id «manual» und legt im Dashboard eine Schein-Session an. Ursprung: TOOL-BUENDEL T01 (Final-Review). Einschätzung: niedrig; Ereignis ohne Session führen oder Dashboard-Modell «manual» ausblenden (studio-coach).

### 2026-10-09 · TOOL-BUENDEL: Testlücke bei `ps`-Fehler in der Testsperre

- **Fundort:** `tests/tools/testlock.test.ts`: kein Test belegt, dass ein `ps`-Fehler (`TESTLOCK_PS_FIXTURE` zeigt auf eine fehlende Datei) nichts ändert. Ursprung: TOOL-BUENDEL T02 (Final-Review). Einschätzung: niedrig; ein Test ergänzt die Fehlerrichtung ab.

### 2026-10-09 · Retro c64c0775: Ampelzeile «Persona-Starts» zählt nur `general-purpose`

- **Fundort:** `tools/studio/efficiency.py` (Ampelzeile Persona-Starts auf opus): typisierte Persona-Starts fehlen in der Zählung. Ursprung: Kurz-Retro Session c64c0775 (ausserhalb Scope). Einschätzung: niedrig; mit der Ampelzeile E-038 in TOOL-AKTIVIERUNG oder TOOL-E049-PHASE mitnehmen.
