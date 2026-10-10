# Beobachtungen (Posteingang für Befunde ausserhalb des Scopes)

Aufbau je Eintrag: Datum · Fundort · Beobachtung · Ursprung · erste Einschätzung.
Auswertung mit dem Skill `beobachtungen-auswerten`. Ein Folgeissue entsteht nur auf
ausdrückliche Zustimmung des Nutzers; im Studio gehen Paket-Kandidaten an L0.

Letzte Auswertung: 2026-10-10

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

**Stand 2026-10-10** (`lead-production`, Paket BEOB-AUSW-04, gegen `c282def0`): 27 Einträge gesichtet. Bilanz und Paket-Kandidaten stehen in „Ausgewertet 2026-10-10“. Die Abschnitte „Ausgewertet 2026-10-09“ und „Ausgewertet 2026-10-08“ sind unverändert nach [beobachtungen-archiv.md](beobachtungen-archiv.md) verschoben; Verweise darauf zeigen dorthin.

---

## Ausgewertet 2026-10-10

**Bilanz** (27 Überschriften-Einträge, `lead-production`, Paket BEOB-AUSW-04, gegen `c282def0`): 11 erledigt/überholt,
9 abgehakt (mit Trigger), 7 belegt und offen (alle S; 2 ui, 5 tool), 0 verworfen, 0 Ideen, 0 ungesichtet. Verifiziert per
grep und Lesen am Code auf main (Aufrufstellen gelesen, nicht nur Definitionen). Bildbefunde (Playtest-Screenshots) sind
nicht neu gemessen. Die Rohfassung der 27 Einträge steht unverändert im [Archiv](beobachtungen-archiv.md).

**Erledigt / überholt**

| Eintrag                                                  | Beleg                                                                |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| Inspektor-Hilfszeile doppelt                             | REL-15 (R435), Commit `b1f26bc` (`src/ui/inspect.ts`)                |
| Hover-Karte verdeckt Cursor-Hinweis                      | REL-15, `e9dfa65` (`cursorHintVisible`)                              |
| Testtitel «ab 0,25»                                      | REL-15, `59025e9`                                                    |
| `make studio-lint` rot                                   | TOOL-BUENDEL-2, `177f12e9` (Ruff 0.17.0 gepinnt)                     |
| Testschalter in `paths.py`                               | `920539a1`                                                           |
| `metrics.py --session latest` schreibt ins Hauptcheckout | `aebfc1ee` (`paths.worktree_docs_dir`)                               |
| `zeitreserve-push` verwirft bei Last > 4                 | `aa7bbf3d`; Handbuch-Schritt strich Handbuch 1.40 (`de86dd92`)       |
| Git-Hook ohne `python3`                                  | `b91db729`; `tools/githooks/pre-commit:7` prüft `command -v python3` |
| Schein-Session «manual»                                  | `a57ca780` (`model.MANUAL_SESSION`)                                  |
| Testlücke `ps`-Fehler                                    | `82f00bc8`                                                           |
| haiku-Zeile per Kopfzeile nicht erfüllbar                | `9bd39b04` (`modelguard.py`)                                         |

**Abgehakt (mit Trigger)**

| Eintrag                                                   | Begründung · Trigger                                                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Meeresfels Ferngrösse (R423)                              | `lead-art` NEIN, massstabstreu · Fels bekommt Spielwirkung, Playtest vermisst Fels, Schiffsgrösse oder kleinster Zoom ändert sich |
| Dienst-Mangel «fehlt in Reichweite» (zwei Einträge, R435) | `lead-design`: trägt „zu weit weg“-Information · Playtest zeigt, dass Spieler «fehlt» und «fehlt in Reichweite» verwechseln       |
| Probe-Event `commit_rejected`                             | `.studio/events.jsonl` (1 Treffer), append-only · erledigt sich beim nächsten `make studio-archive`                               |
| Ampelzeile bereinigter Steuerungsanteil                   | E-049 laufend (`experimente.md`) · E-049 übernommen                                                                               |
| Ampelzeile «Persona-Starts» nur `general-purpose`         | `efficiency.py` (`persona_opus`); Definition braucht Ruling · nächste Retro (`studio-coach`)                                      |
| dpr-Wechsel bei offener Seekarte                          | `hud.ts`: `mapDpr` wird nur beim Öffnen gesetzt · Spieler meldet unscharfe/zu kleine Karte nach Bildschirmwechsel                 |
| Kontor-Marke 4 px bei 1280×720                            | `seaMap.ts` `MARK = 4` · Playtest übersieht die Marke (Urteil `lead-art`)                                                         |
| Hook-Zeile Python < 3.11                                  | Python-Seite getestet (`tools/studio/tests/test_precommit.py:136`), nur die Shell-Zeile `pre-commit:8` nicht · Hook-Änderung      |

**Belegt und offen: Paket-Kandidaten** (Fundstellen am heutigen Stand belegt)

| Kandidat                                                                                      | Gr. | Bereich | Ursprung · Beleg                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------- | --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REL-16 (1)** Schild «Kein Bauland» über belegter Kachel präzisieren (z. B. «Kachel belegt») | S   | ui      | Playtest T06 REL-15 · `src/ui/hints.ts:58-59`, `src/sim/placement.ts:34` (Grund `Kein Bauland` auch bei Belegung gemeldet, Wortlaut irreführend)                                                                       |
| **REL-16 (2)** `dispose` bricht Inselmenü-Listener ab (Leck der alten Welt nach Startfehler)  | S   | ui      | Final-Review REL-15 · `src/ui/app.ts` `dispose` (ab Zeile 1294) ruft nichts davon auf; `islandMenuAbort` ist modul-privat in `src/ui/hud.ts:336`, braucht Export oder Abbruch-Hook; Test analog `tests/ui/hud.test.ts` |
| `ZEITTESTS` bereinigen: `seaMap.test.ts`                                                      | S   | tool    | REL-15 R437 B4 · `vite.config.ts:11`; die Datei enthält weder `performance.now(` noch `Date.now(` (0 Treffer)                                                                                                          |
| `seekarte.mjs`: `12 * d` durch `SEA_MAP_PAD` ersetzen                                         | S   | tool    | Final-Review REL-15 · `tools/render-qa/seekarte.mjs:136`; `SEA_MAP_PAD` wird in `hud.ts:25` importiert                                                                                                                 |
| QA-Namensschema und `willReadFrequently`                                                      | S   | tool    | Release-Check REL-15 · `b6-*.png` ohne Grösse (`a4-*` hat sie), `willReadFrequently` fehlt in `seekarte.mjs:140`                                                                                                       |
| `efficiency.scan`: `tool_result` nach `since` zu `tool_use` davor                             | S   | tool    | TOOL-BUENDEL-2 T03 · `tools/studio/efficiency.py` `scan`: `_before(entry, since)` überspringt vor `_collect_tools`                                                                                                     |
| `test_metrics.py`: `paths.repo_root` abschotten                                               | S   | tool    | TOOL-BUENDEL-2 T07 · `tools/studio/tests/test_metrics.py:183` entfernt `STUDIO_DOCS` ohne `repo_root` umzulenken                                                                                                       |

**Empfehlung REL-16 (spürbar für den Spieler):** Kandidat (1) wirkt unmittelbar (Verwirrung beim Bauen über Häusern), (2) ist
unsichtbar bis zum Startfehler, aber klein und gehört derselben UI-Schicht; beide zusammen sind ein S-Paket. Mehr
Spielerthemen liefert der Posteingang nicht; Ausbau von REL-16 braucht Ideen (`docs/ideen.md`) oder Playtest-Befunde.
**Werkzeug-Kandidaten** (nicht für REL-16): die fünf `tool`-Zeilen als ein Bündel TOOL-BUENDEL-3 (`studio-coach` bzw. Tech), alle S.

**Ideen:** keine.

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

## Offen (neue Einträge unten anhängen)

### 2026-10-10 · Plan REL-16: Gebirgskachel am Bergfuss wirkt wie Wiese; Playtest misst nach Schwenk mit alten Pixeln

- **Fundort:** `.studio/qa/REL-15/ui/b6-bauen.png` (Seed 7, Kachel (38, 35) = `mountain`, Probe beim Planen), Skript `.studio/qa/REL-15/ui/t06.mjs` Schritt 2.4 (Ziehen um +40/+20 px, danach weiter mit `p0`). Beobachtung: Der Geisterbau stand auf einer Gebirgskachel, die im Bild grün wie Wiese aussieht; das Schild „Kein Bauland“ war richtig, wirkte aber falsch. Zweitens zielte der Playtest nach dem Schwenk nicht mehr auf das Haus. Ursprung: Planung REL-16 (lead-tech). Einschätzung: niedrig; Darstellung des Bergfusses an `lead-art` (Sichtprüfung, ob Gebirgskacheln am Rand als Gebirge lesbar sind); REL-16 nennt das Gelände im Schild, der Release-Check T04 misst Pixel nach jeder Kamerabewegung neu.

### 2026-10-10 · REL-16 (R454): Bauschild-Randfälle und Testlücken

- **Fundort:** `src/ui/hints.ts:66-71`, `src/ui/hints.ts:69`, `src/ui/app.ts:878`, `tests/ui/hints.test.ts`. Beobachtung: (1) Mischfall Grundriss mit Weg und Gebäude zeigt immer das Gebäude („Gebäude vor Weg“ per R454 entschieden), kein Test dafür; (2) AK-R16-03 (Klick-Meldung mit Ortsangabe) hat keinen Unit-Test — entfernt man `at` beim Weg-Klick, bleiben alle Tests grün; der Test „AK-R16-03“ prüft eigentlich AK-R16-04; (3) `world.buildings[id]!.defId` bricht bei einer ID ohne Gebäude (in gültiger Welt nicht erreichbar), Vorschlag `?.` mit altem Text als Rückfall; (4) `GROUND_NAMES[t]!` liesse sich als Paar-Array ohne Non-null-Assertion schreiben. Ursprung: Final-Review/Release-Check REL-16 (lead-qa). Einschätzung: niedrig, Trivial-Fix-Kandidat beim nächsten Eingriff in `hints.ts` (REL-17 berührt `app.ts`).

### 2026-10-10 · REL-16 (R454): render-qa-Werkzeug, Konsolenfilter und Kamera-Ruhe

- **Fundort:** `tools/render-qa/sitzung.mjs` (Konsolenfilter), Playtest REL-16. Beobachtung: (1) Headless-Warnung „AudioContext was not allowed to start“ erscheint je Grösse 15-mal aus `src/audio/` und sollte vom Konsolenfilter ausgenommen werden; (2) `tileCenter` nach `centerOn` schwankt zwischen Läufen (Y 349,8 oder 370,8) — nach 1,5 s ist die Kamera evtl. noch nicht ruhig; das Schild traf trotzdem die richtige Kachel. Ursprung: Release-Check REL-16 (qa-playtester). Einschätzung: niedrig, Werkzeug-Kandidat.

### 2026-10-10 · REL-17: Randfälle von Problem-Sprung und Abriss-Zug

- **Fundort:** `src/ui/app.ts` (Log-Klick über `resolveLogClick`, `onAction`), `src/ui/problems.ts`, `src/ui/hints.ts`, `src/ui/input.ts`. Beobachtung: (a) Log-Klick auf Fremdinseln zentriert auf Inselkacheln ohne `ox`/`oy`, der Problem-Sprung rechnet mit Archipel-Kacheln; prüfen, ob Krisen auf Fremdinseln vorkommen. (b) `unconnectedIds` (`hints.ts`) zählt die Amtsstube mit, `cutOffIds` (`problems.ts`) nicht (`needsConnection`); bei I-043 vereinheitlichen. (c) Weg-Zug und Tasten `0`/`9`: ein Inselsprung mitten im Zug bricht den Zug nicht ab (nur `.`/`,` tun das); prüfen. (d) Touch-Schwelle ungeprüft: AK-R17-16 verlangt „Touch-Schwelle wie Weg“ für den Abriss-Zug; es gibt keinen Touch-Beleg (Desktop-first, kein Touch-Lauf in T05). (e) `Esc` und Rechtsklick beenden einen laufenden Weg- oder Abriss-Zug nicht, solange ein schliessbarer Toast offen ist (`closeClosableToast` → `return` in `app.ts`); seit dem Weg-Zug so, kein Regress. (f) `onBlur` beendet jetzt auch Weg-, Roden- und Aufforsten-Züge (Absicht, harmlos: setzt nur `dragMoneyToastShown` zurück). (g) Die Abriss-Zug-Vorschau (`updateHover`) hat keinen Vitest-Beleg, nur den Browser. Ursprung: Planung und Reviews REL-17. Einschätzung: niedrig; (a), (b) und (c) bei I-043 bzw. dem nächsten Eingriff prüfen.

### 2026-10-10 · TOOL-BUENDEL-3 (R457): Restpunkte Uhr, Flake-Matching, Testlauf-Wrapper

- **Fundort:** `tools/studio/hook.py:235`, `tools/studio/clock.py`, `tools/studio/tests/test_metrics.py:278`, `tools/studio/testrun.py`, `budgetwarn` (Import aus `modelguard`). Beobachtung: (1) `hook.py` nutzt `time.gmtime()` an der gemeinsamen Uhr vorbei, die Lint-Warnung erkennt `time.monotonic` nicht; (2) `TickingClock` im HOTFIX-Test zählt Sekunden hoch und wirft ab dem 60. `now()`-Aufruf `ValueError` — heute nicht erreicht, aber fragil (auf `clock.frozen` umstellen); (3) `testrun.py` zeigt bei Ctrl-C einen Traceback, Exit bei Signal 256−N statt 128+N; (4) `budgetwarn` importiert private Helfer `_header`/`_persona` aus `modelguard`; (5) Flake-Matching erfasst ungetrackte Dateien nicht, bei Sammelfehlern bleibt `names` leer; (6) ADR-014 „Konsequenzen“ nennt veralteten Modus `warn`; (7) `clock.py` 63 statt ≤ 50 Zeilen (Plan-Grenze widersprach der Spec). Ursprung: Controller 2 / Final-Review TOOL-BUENDEL-3. Einschätzung: niedrig, Kandidaten für das nächste Werkzeug-Bündel.

### 2026-10-10 · REL-17 (R458): niedrige Befunde aus Review und Playtest

- **Fundort:** `src/ui/problems.ts`, `src/ui/hints.ts`, `src/ui/app.ts`, `src/ui/input.ts`, Playtest REL-17. Beobachtung: (1) Review B2: `problems.ts:85` Klasse 4 ohne eindeutigen Sortierschlüssel. (2) Review B4: drei Randfälle ohne Test. (3) Playtest 1: Das Schild im Abriss-Zug zeigt über Gebäuden rot „Abreissen: Weberei …“ (`hints.ts` 327–336). (4) Playtest 2: AK-R17-16 sagt „grün“, die Vorschau malt `HOVER_BAD`. (5) Ausserhalb Scope: Ein Weg direkt hinter einer Gebäudehülle lässt sich nicht als Zug-Start drücken. (6) Das Weberei-Panel läuft bei 1280×720 unten aus dem Bild. (7) Toter `else`-Zweig `removeRoad`/`showRoadFailure` im Abriss-Zweig von `app.ts`. (8) `HOUSE_TITLES` zieht `problems.ts` über `hover` in unnötige Abhängigkeiten. Ursprung: REL-17. Erste Einschätzung: alle niedrig, nichts blockierend; (3)/(4) bei einer Nacharbeit der Abriss-Vorschau gemeinsam klären, (8) bei I-043 lösen.

### 2026-10-10 · Dashboard-Server läuft dauerhaft auf 100 % CPU; `make studio` meldet Fehlstart trotz Start

- **Fundort:** `tools/studio/server.py` (Prozess seit 2026-10-01 mit 334 CPU-Minuten), `make studio` / `make studio-stop`, `.studio/server.log` (`BrokenPipeError` in `socketserver.write`). Beobachtung: (1) Der Server belegt einen Kern voll, auch direkt nach einem Neustart (102 % nach 5 s, Dashboard-Tab offen) — vermutlich eine Schleife ohne Warten im Ereignis-Strom bzw. nach abgebrochener Verbindung; das hebt den 1-min-Load um rund 1 und verzögert Messläufe (Grenze Load ≤ 4, R329). (2) `make studio` meldete „startet nicht“, obwohl der Server lief (Prüfung zu früh); ein zweiter Aufruf scheitert dann mit `Address already in use`. Ursprung: L0, Session-Start nach 2cfa57e0. Einschätzung: mittel (wirkt auf jede Messung), Kandidat für das nächste Werkzeug-Bündel, vorgezogen.
