# Beobachtungen (Posteingang für Befunde ausserhalb des Scopes)

Aufbau je Eintrag: Datum · Fundort · Beobachtung · Ursprung · erste Einschätzung.
Auswertung mit dem Skill `beobachtungen-auswerten`. Ein Folgeissue entsteht nur auf
ausdrückliche Zustimmung des Nutzers; im Studio gehen Paket-Kandidaten an L0.

Letzte Auswertung: 2026-10-11

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

**Stand 2026-10-11** (`lead-production`, Paket BEOB-AUSW-1011, gegen `22dcf081`): 29 Einträge gesichtet. Bilanz und Paket-Kandidaten stehen in „Ausgewertet 2026-10-11“. Der Abschnitt „Ausgewertet 2026-10-09 (2)“ ist unverändert nach [beobachtungen-archiv.md](beobachtungen-archiv.md) verschoben; Verweise darauf zeigen dorthin.

**Stand 2026-10-11 (2)** (`lead-production`, Paket BEOB-2026-10-11b, gegen `60144cdb`): 12 Einträge gesichtet. Bilanz in „Ausgewertet 2026-10-11 (2)“; vier Einträge bleiben offen und sind I-048 (R555) bzw. TOOL-GATE-ENSEMBLE (R556) zugeordnet.

---

## Ausgewertet 2026-10-11 (2)

**Bilanz** (12 Einträge, `lead-production`, Paket BEOB-2026-10-11b, gegen `60144cdb`): 2 erledigt, 6 abgehakt (mit Trigger), 1 eingeplant
(Board: UI-AUFRAEUM-2), 3 offen und laufenden Paketen zugeordnet (I-048 R555 dreimal), 0 Ideen, 0 verworfen.
Die drei offenen Einträge (dazu der neue Eintrag zur Controller-Phase, probe-CONTROLLER-PHASE R558) stehen unten unter „Offen“ mit Zuordnung.

| Eintrag                                          | Ausgang                 | Begründung · Trigger / Beleg                                                                                                                                      |
| ------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verkaufssättigung erholt sich schnell            | zugeordnet I-048 (R555) | Abwägung, läuft in Schritt B; kein eigenes Paket                                                                                                                  |
| Zahlen in I-031 weichen vom README ab            | abgehakt                | `docs/ideen.md` I-031 nennt −5 %/−10 %, README Edikt-Tabelle −7/−5 Punkte (belegt); Historie eines gelieferten Eintrags · wenn I-031 neu bewertet wird            |
| Formatvorlage in `ideen.md` zählt im grep mit    | abgehakt                | Zeile `### I-001 · neu · <Kurzname>` im Codeblock belegt; Zählung mit `grep -v '<Kurz'` · nächste Ideen-Runde führt die Zählung so oder ohne `###` in der Vorlage |
| `buyPct` fehlt in arc42                          | zugeordnet I-048 (R555) | 0 Treffer in `docs/arc42.md`; T08 deckt es                                                                                                                        |
| Doppelter Test `edicts.test.ts:252-264`          | abgehakt                | belegt (`AK-ZK-09` in `buyPct.test.ts:113`, gleiche Erwartungen 7/30/37); niedrig, `tests/` nicht in diesem Scope · nächster Eingriff in `edicts.test.ts`         |
| Budget-Hook `warning()` / `tablecheck` Randfälle | erledigt                | im Eintrag bereits entschieden (TOOL-BUENDEL-8 T04), kein Code offen                                                                                              |
| Last-Flake `terrain.test.ts`                     | abgehakt                | Diagnose im Eintrag, kein Fix auf Verdacht · nächster roter Lauf mit Fehlermeldung (`test_failed.messages`): «timed out» → Timeout anheben                        |
| `stateText` ohne Aufrufer                        | eingeplant (Board)      | belegt: `src/ui/texts.ts:112` Definition, `src/ui/inspect.ts:82` nur Re-Export, sonst 0 Treffer; gehört in UI-AUFRAEUM-2                                          |
| Budget-Zuordnung Namenstreffer vs. Lead-Freigabe | abgehakt                | nur Altdaten mit Präfix-Phasen (R543 vergibt reine IDs) · zweiter E-060-Echtlauf zeigt Fehlzuordnung                                                              |
| Sieg-Tick im Balancing sprunghaft                | zugeordnet I-048 (R555) | Robustheitsachse kommt aus TOOL-GATE-ENSEMBLE (R556)                                                                                                              |
| Balancing-Controller: Seed wirkt nicht           | erledigt                | durch TOOL-GATE-ENSEMBLE (R558/R559): `make gate-ensemble` liefert die Robustheitsachse                                                                           |
| Gesperrte Edikt-Knöpfe: Kontrast                 | abgehakt                | niedrig, ungemessen · nächste Kontrast-Runde in `tests/ui/contrast.test.ts` misst das Paar                                                                        |

**Ruling-Entwurf (R471, nur Entwurf, schreibt L0):** UI-AUFRAEUM-2 um «`stateText` samt Re-Export in `inspect.ts` streichen» ergänzen
(Owner `lead-tech`, Gr. S–M, blocked-by M13-Final-Review). Kein neues Paket, kein Issue.

**Ideen:** keine.

---

## Ausgewertet 2026-10-11

**Bilanz** (29 Überschriften-Einträge, `lead-production`, Paket BEOB-AUSW-1011, gegen `22dcf081`): 1 erledigt, 15 abgehakt
(mit Trigger), 12 belegt und offen als Paket-Kandidaten (4 Bündel/Entscheide, siehe unten), 1 Abwägung offen (Verkaufssättigung,
läuft in I-048), 0 verworfen, 0 Ideen, 0 ungesichtet. Teilbefunde sind einzeln per grep am Code auf main geprüft (Fundstellen
unten); Bildbefunde (Playtest-Screenshots) und Browser-Messungen sind nicht neu gemessen. Aus den Einträgen wurden die
Teilpunkte als **erledigt** gestrichen, die nicht mehr zutreffen. Die Rohfassung der 29 Einträge steht unverändert im
[Archiv](beobachtungen-archiv.md); der Abschnitt „Ausgewertet 2026-10-09 (2)“ ist dorthin verschoben.

**Erledigt / überholt (ganze Einträge oder Teilpunkte)**

| Eintrag                                                  | Beleg                                                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Board-Titel durch `log.py package` überschrieben         | `tools/studio/log.py`: Titel nur bei neuem Paket oder `--retitle` (Zeile 98, 220)              |
| Schild «Kein Bauland» über Gebirge wirkt falsch (Teil)   | REL-16 live (R463): `src/ui/hints.ts` `groundText` nennt das Gelände («Kein Bauland: Gebirge») |
| `toggleStartsJump` toter Export (I-043 Branch-Review)    | 0 Treffer in `src/` und `tests/`                                                               |
| `monumentNightLight` nicht eingehängt (M13-E2-ART)       | `src/render/renderer.ts:724` ruft es auf                                                       |
| Handlerzustand nach Doppel-Ctrl-C ungetestet (`testrun`) | `tools/studio/tests/test_testrun.py:256-260` (`signal.getsignal` vorher/nachher)               |
| `HOUSE_TITLES` Abhängigkeit (REL-17 (8))                 | in I-043 erledigt (`texts.ts`)                                                                 |
| Playtest REL-18 (7) «Nächster Schritt» übersieht Mangel  | UI-NAECHSTER-SCHRITT gemergt (R518); Wortlaut nicht neu gemessen                               |

**Abgehakt (mit Trigger)**

| Eintrag                                                     | Begründung · Trigger                                                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bergfuss-Optik der Gebirgskachel (REL-16 Planung)           | Schild gelöst; Darstellung `lead-art` · Playtest oder Spieler meldet Gebirge am Rand nicht lesbar                                                                                           |
| `hints.ts:73` `buildingId!`                                 | Typ-Nit, sachlich sicher (belegt) · nächster Eingriff in `hints.ts`                                                                                                                         |
| REL-17 Randfälle (a)–(g)                                    | (b) `unconnectedIds` (`hints.ts:397`) gegen `needsConnection` (`problems.ts:36`), (e) `closeClosableToast` (`app.ts:992`) belegt · nächster Eingriff in `problems.ts`/`hints.ts`/`input.ts` |
| REL-17 niedrige Befunde (1)–(7)                             | (3) `hints.ts:361` Text, (4) `renderer.ts` `HOVER_BAD` belegt · Nacharbeit der Abriss-Vorschau                                                                                              |
| M13-E1 T13 Restpunkte                                       | alle niedrig; (3), (9) Spec/Balance-Hinweise an `lead-design` · nächster Eingriff Edikt-Abschnitt oder Spec M13-E1                                                                          |
| Worktree-`start.sh` ohne `STUDIO_HOME`                      | so gewollt für Echtdaten · Test-Dashboard im Worktree immer mit `STUDIO_HOME=<tmp>`                                                                                                         |
| I-043 Rechtsklick löscht Fokus                              | README nennt es; Spec ohne AK · nächste Spec-Änderung UI-GUT-CHIP                                                                                                                           |
| I-043 Browser-Lauf T08                                      | vorbestehend (Tab-Reihenfolge), Rest nur im Vitest prüfbar · Tastatur-/Fokus-Paket oder U6 (Glas, Seefahrt) frei                                                                            |
| I-043 Branch-Review (2), (3)                                | doppelte Fokus-Regel `focusList`/`drawFocusMarks` · nächster Eingriff `goodFocus.ts` oder `focusMarks.ts`                                                                                   |
| CI-Dauer 7 statt 4 min                                      | Ursache ungemessen; `make push-check` (TOOL-BUENDEL-6) gemergt · CI dauert > 8 min oder Actions-Prognose rot (R488 V2)                                                                      |
| AK-GC-08 Verdrahtung `app.ts` ungetestet                    | niedrig · nächster Eingriff in `app.ts` (Fokus/Problem-Cursor)                                                                                                                              |
| `build_state` weiter beschleunigen                          | 1,3 s akzeptiert (R482) · Dashboard spürbar träge                                                                                                                                           |
| Inspektor-Abhilfe «baue mehr» bei vollem Lager              | nur im pausierten Test gesehen, `guide.ts` `remedyText` nicht neu gemessen · Playtest sieht es im laufenden Spiel                                                                           |
| M13-E2-ART Frame-Ereigniszahl schwankt (`renderer.test.ts`) | Flake-Kandidat · tritt im `make push-check`/CI auf                                                                                                                                          |
| «Kein Kontor» beim Gut-Sperr-Fall (M13-E2-UI)               | Text ungenau, spec-konform · I-049-UI (Sperrbestand-Anzeige) prüft es mit                                                                                                                   |

**Belegt und offen: Paket-Kandidaten** (Fundstellen am heutigen Stand geprüft)

| Kandidat                                                               | Gr. | Bereich | Owner (Vorschlag)                 | Inhalt · Beleg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------- | --- | ------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI-TEXTE-1** «Stillgelegt», Kontrast, Wortlaut (spürbar für Spieler) | S–M | ui      | `lead-tech` (Texte `lead-design`) | «halber Unterhalt» (README) gegen 60 % Aufrundung (R467) und Ausstoss weiter 15/min; blasse «lohnt, wenn …»-Zeilen und Edikt-Knöpfe (`--parchment-muted`); Kontor-Spaltenkopf ohne Trenner («KAUFENEDIKT»); `guide.ts:130` «Handelsstadt erreicht — spiel frei weiter» ohne Denkmal-Hinweis; `buildMenu.ts:152` «Höchstens eine Denkmal»; «Bau pausieren» im Bauplatz-Stand; Tooltip «Entf» ohne Rücktaste (`inspect.ts:822`, Mac); Laden-Liste nach «Speichern» (`menu.ts`). Quellen: M13-E1 T14, REL-18, M13-E2 Browser-Lauf 1/Final-Review, UI-TASTEN. |
| **UI-AUFRAEUM-2** Kopplung über Anzeigetexte, doppelte Kostenstruktur  | S–M | ui      | `lead-tech`                       | Abschluss-Banner am Text erkannt (`app.ts`), Pausenzustand aus Knopftext (`monumentSection.ts`), Kosten doppelt (`monumentView.ts`/`app.ts`), `stage`-Sprung ergibt einen Chronik-Eintrag, kein DOM-Test `rest-monument`; `RESERVE_TICKS = 1000` neben Sim-800 (`balance-monument.test.ts:48`); `isSaveChord` in `modal.ts` zieht `sim/defs` mit; «Abreissen» sechsmal als Literal (`inspect.ts` 4, `app.ts` 2). Nach M13.                                                                                                                                |
| **TOOL-BUENDEL-7** `testrun`/`log`/`model`-Restpunkte                  | S–M | tool    | `lead-tech` (Regel vorher L0)     | `testrun.py` `parse_names` bei Sammelfehlern leer; zweites Ctrl-C vor `_ignore_interrupts()` (kein `pthread_sigmask`); `log.py` `_package_exists` sucht ID als Rohtext (nicht-ASCII); `model.py` `lead_phases`/`budget_key` hängen an der Reihenfolge in `result` (`claim_budgets()` nur in `result`-Pfad, Zeile 1214); Lead mit Paket `X-T01` bindet Freigabe `X` nicht (Präfix-Regel vorher L0); `make docs-check` erkennt zerrissene Markdown-Tabellen nicht (unmaskiertes `\|` im Code-Span).                                                         |
| **Entscheid `lead-design`** Layout unter 900 px (AK-M13E2-48)          | —   | ui      | `lead-design`                     | Bei 800×600 überlappen `#panel` und `#game` um 161 px, HUD 931 px breit. Empfehlung: AK-M13E2-48 auf «stürzt nicht ab» zurücknehmen (Desktop-first ab 1280 px, `CLAUDE.md`), kein Layout-Umbau. Dazu Spec-Nachträge: AK-M13E1-14 (Geld ≥ 600), AK-M13E1-36 gegen U-4, Rechtsklick in UI-GUT-CHIP-Spec.                                                                                                                                                                                                                                                    |
| **Entscheid L0** `make push-check` D1/Lastwarten                       | —   | tool    | L0 (R514 V2-Daten)                | Bei leerer Markierungsliste Exit 0 ohne Nachmessung (D1), `check-ci-perf` wartet nicht auf ruhige Last (`tools/studio/pushcheck.py`); falsches Rot möglich, kein falsches Grün. Empfehlung: nach den Load-Daten aus R514 V2 entscheiden, kein Paket vorher.                                                                                                                                                                                                                                                                                               |

**Empfehlung nach M13:** UI-TEXTE-1 zuerst (einziges Bündel mit Spielerwirkung, gehört vor Folge-UI-Arbeit wie I-049-UI/I-048-UI);
UI-AUFRAEUM-2 als Aufräum-Häppchen nach dem Final-Review; TOOL-BUENDEL-7 bei freier Werkzeug-Kapazität. Keine Issues angelegt
(keine Schwelle der Verfassung erfüllt: kein Kunde, kein Produktivbetrieb).

**Ideen:** keine. **Abwägung offen:** Verkaufssättigung (unten unter „Offen“), wird mit I-048 durch `design-economy-designer` nachgerechnet.

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

## Offen (neue Einträge unten anhängen)

### 2026-10-10 · Verkaufssättigung erholt sich schnell: Dauerverkauf Holz fast zum Vollpreis

- **Fundort:** `src/sim/defs/` (Sättigung, Erholung 60 Punkte/min), Ideen-Runde IDEEN-06. Beobachtung: Dauerverkauf von Holz
  bringt rund 240 Geld/min nahe am Vollpreis gegen 30 Unterhalt je Holzfäller — mögliche Geldquelle ohne Wahl. Ursprung:
  Scout-Befund IDEEN-06 (lead-design). Einschätzung: mittel; mit I-048 „Zukauf-Aufschlag“ durch `design-economy-designer`
  nachrechnen, kein eigenes Paket vorher.
- **Zuordnung:** I-048 Schritt B (R555, Brainstorming-Gate), Nachrechnung `design-economy-designer`; bleibt offen bis der Entscheid I-048 fällt.

### 2026-10-11 · `buyPct` fehlt in der arc42-Persistenz bis I-048 T08

- **Fundort:** `docs/arc42.md`, Persistenz/Zeile `save.ts`. Beobachtung: Das neue Weltfeld `buyPct` (I048-SIM) ist nicht
  beschrieben, bis Strang I048-B (T08) die Doku nachführt. Ursprung: Controller I048-SIM. Einschätzung: gering; T08 deckt es,
  vor dem Release M13 prüfen.
- **Zuordnung:** I-048 (R555), T08 führt arc42 nach. **Verifiziert:** 2026-10-11 gegen `60144cdb` — belegt (`grep buyPct docs/arc42.md`: 0 Treffer).

### 2026-10-11 · Sieg-Tick im Balancing reagiert sprunghaft auf Spielwerte

- **Fundort:** `tests/sim/balance.test.ts` (Seed 3, `WIN_TICK_LIMIT` 7500). Beobachtung: `BUY_RISE` 2 → Sieg 7150,
  `BUY_RISE` 1 → Sieg 7550 (milderer Aufschlag, späterer Sieg). Die Grenze 7500 ist damit ein brüchiges Gate (heute 350 Ticks
  Luft). Ursprung: Designurteil D-I048-B-GRENZE. Einschätzung: mittel; bei der nächsten Balancing-Runde mehrere Seeds oder
  ein Mittel statt eines Einzellaufs prüfen.
- **Nachtrag 2026-10-11 (D-I048-B-WERTE):** 27 Messungen (Scratchpad lead-design): Antwort auch ohne Zukauf-Aufschlag nicht
  monoton (`SELL_RECOVERY_INTERVAL` 15 → Sieg 6750, 16 → 7350, 18 → Krisen normal ohne Sieg). Schmalste Ränder: Edikt reich
  «Wohlfahrt echt früher» 60 Ticks, Krisen normal 150 Ticks. Einschätzung: hoch, Einzellauf-Gates blockieren jede Wirtschaftsänderung.
- **Zuordnung:** I-048 (R555); die Robustheitsachse liefert TOOL-GATE-ENSEMBLE (R556). Offen, bis I-048 Schritt B entschieden ist.

### 2026-10-11 · Balancing-Controller kippt bei verschobenen Entscheidungszeitpunkten

Fundort: `make gate-ensemble` (TOOL-GATE-ENSEMBLE, `tests/sim/ensemble.test.ts`), Seed 3, Phasen 0/20/40/60/80. Beobachtung: Nur Phase 0, 20 und 40 gewinnen (Sieg-Tick 6750 / 7250 / 6650); Phase 60 und 80 erreichen bis Tick 9000 keinen Sieg und fallen im Geld ins Minus (minMoney -91 / -51). Die Referenz-Baseline (Sieg 6750, minMoney 117) hängt also am Entscheidungsraster `tick % 100 === 0`. Ursprung: TOOL-GATE-ENSEMBLE T01/T04. Einschätzung: kein Spielfehler (der Controller ist ein Test-Spieler), aber Gates mit Wertgrenzen auf Basis eines Einzellaufs sind weniger belastbar als gedacht; Verdikt AUSREISSER für Sieg-Tick und minMoney. Für M14-Werte: Grenzen mit Ensemble prüfen, und ob der Controller bei Reserve/Aufstiegsmoment robuster werden soll, ist ein Design-/Tech-Entscheid an L0.

- **Zuordnung:** probe-CONTROLLER-PHASE (R558). Offen.

### 2026-10-11 · Controller-Stillstand auch bei Phase 50, 70 und 90 (Gegenprüfung)

Fundort: Gegenprüfung TOOL-CONTROLLER-HAERTUNG (Scratchpad-Messung, Seed 3, Phasen 10/30/50/70/90, vor der Härtung). Beobachtung: Phase 10/30 siegen (7950 / 7250), Phase 50/70/90 stehen bis Tick 9000 still (Schule bei Tick 551/571/591, minMoney 3 / -88 / 19); nach der Härtung siegen alle zehn Phasen (50: 7000, 60: 7900, 70: 7600, 80: 7500, 90: 6900; Phase 0-40 unverändert). Phase 60 (7900) und 70 (7600) liegen über `WIN_TICK_LIMIT` 7500, Verdikt im Ensemble: AUSREISSER. Ursprung: TOOL-CONTROLLER-HAERTUNG T03. Einschätzung: Ursache war nur die zu frühe Schule; die verbleibende Streuung 6650-7900 ist ein Befund für M14-Werte (Grenzen mit Ensemble prüfen). Die Härtung nutzt einen Lagervorrat-Ausweg (`stock.cloth` > Zielbedarf), sonst verschöbe sich Phase 0.

- **Zuordnung:** probe-CONTROLLER-PHASE (R558). Stillstand behoben (R568), Streuung offen.

### 2026-10-11 · L0-Commit im Hauptcheckout fängt offenen Integrator-Merge ein

- **Fundort:** `main` @ `6ffa7f81` (Eltern `49f66078`, `a8d9dcac`). Beobachtung: Der Integrator bereitete `git merge --no-ff
--no-commit tool/gate-ensemble` im Hauptcheckout vor und lief `make check`; L0 committete in dieser Zeit ein Ruling
  (`git add docs/studio/rulings.md && git commit`) — Git schloss dabei den offenen Merge mit ab. Merge-Commit trägt die
  Ruling-Nachricht statt „feat: Merge …“, Inhalt geprüft (`make check` Exit 0). Ursprung: MERGE-TOOL-GATE-ENSEMBLE.
  Einschätzung: mittel; Abhilfe Werkzeug-Kandidat: Integrator mergt im Worktree `.worktrees/integrate` oder L0/Leads prüfen
  vor jedem Commit auf `main` `.git/MERGE_HEAD` (Guard-Hook möglich).
- **Zuordnung:** Retro M13 (`docs/studio/retros/2026-10-12-m13.md` B1, V2) und Prozess-Retro M13 P1; Abhilfe als E-063 vorgeschlagen.

### 2026-10-12 · `README.md` und `docs/ideen.md` werden ganz gelesen und wachsen

- **Fundort:** Ampelzeile „Grösste gelesene Datei“ M13 (`docs/studio/metriken/M13.md`): `README.md` 48,2 KB und `docs/ideen.md`
  42,9 KB als volle Lese-Ergebnisse; auf der Platte 58,7 KB bzw. 79,3 KB. Beobachtung: Die Briefingzeile E-057 (Teillesen ab
  30 KB) greift bei diesen beiden Dateien nicht immer; beide wachsen mit jedem Release bzw. jeder Ideen-Runde. Ursprung: Retro
  M13 (Ampel). Einschätzung: niedrig; Kandidat für eine Auswertung durch `lead-production` (z. B. Archiv-Abschnitt für
  umgesetzte Ideen, README-Anhang für Spielwerte), keine Regel.
- **Zuordnung:** offen.

### 2026-10-12 · `README.md` nennt Spielstand-Version 11, Code hat 12

- **Fundort:** `README.md` Z. 624 «Spielstand-Version 11»; `src/sim/save.ts:47` `SAVE_VERSION = 12` (seit Release M13).
  Ursprung: lead-design IDEEN-08 (ausserhalb Scope). Einschätzung: niedrig; wird mit M14-E1 T07 (README, Save v13) ohnehin
  nachgeführt — dort mitprüfen, sonst Doku-Audit vor dem nächsten Release.
- **Zuordnung:** M14-E1 T07 (R566).

### 2026-10-12 · Insel C verschiebt Meer-Deko auch fern der neuen Fahrlinie

- **Fundort:** M14-E1 T03 (`feat/m14-e1` @ `00db07fe`), Meer-Plan: Sand, Riff und Tang ziehen über Rang und Belegung nach; Seeds
  1–40: 303 von 405 Flächen kachelgleich. Ursprung: Controller M14-E1-SIM, Auflage R557 (1b). Einschätzung: niedrig, rein
  darstellend; migrierte Spielstände zeigen verschobene Sandbänke/Riffe. Kandidat für den Browser-Check T08 (sichtbar störend?).
- **Zuordnung:** R567.

### 2026-10-12 · Gate-Ensemble: Sieg-Tick-Grenze 7500 meldet Phasen 60/70 als AUSREISSER

- **Fundort:** `make gate-ensemble` auf `main` `c20c4f3a` und `feat/m14-e1` `d6f37233`: Sieg-Tick Median 7250, Spanne 6650–7900,
  4/5 ≤ 7500 (Phasen 60/70 darüber, seit TOOL-CONTROLLER-HAERTUNG siegen sie überhaupt). Ursprung: Nachmessung R557 (3).
  Einschätzung: niedrig; Werte-Frage (`WIN_TICK_LIMIT` aus Ensemble ableiten oder Controller-Pfad) — Kandidat nächstes
  Werkzeug-Bündel.
- **Zuordnung:** R570.
