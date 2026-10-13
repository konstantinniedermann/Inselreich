# Beobachtungen (Posteingang für Befunde ausserhalb des Scopes)

Aufbau je Eintrag: Datum · Fundort · Beobachtung · Ursprung · erste Einschätzung.
Auswertung mit dem Skill `beobachtungen-auswerten`. Ein Folgeissue entsteht nur auf
ausdrückliche Zustimmung des Nutzers; im Studio gehen Paket-Kandidaten an L0.

Letzte Auswertung: 2026-10-13

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

**Stand 2026-10-13** (`lead-production`, Paket BEOB-AUSWERTUNG-13, gegen `ee83d2e6`): 12 Einträge und 2 Stichpunkt-Zeilen gesichtet. Bilanz und Board-Vorschläge stehen in „Ausgewertet 2026-10-13“.

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
| `stateText` ohne Aufrufer                        | erledigt                | entfernt in UI-AUFRAEUM-2 (T03 b), `grep stateText src tests` = 0                                                                                                 |
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

| Kandidat                                                                                                          | Gr. | Bereich | Owner (Vorschlag)                 | Inhalt · Beleg                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------- | --- | ------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI-TEXTE-1** «Stillgelegt», Kontrast, Wortlaut (spürbar für Spieler)                                            | S–M | ui      | `lead-tech` (Texte `lead-design`) | «halber Unterhalt» (README) gegen 60 % Aufrundung (R467) und Ausstoss weiter 15/min; blasse «lohnt, wenn …»-Zeilen und Edikt-Knöpfe (`--parchment-muted`); Kontor-Spaltenkopf ohne Trenner («KAUFENEDIKT»); `guide.ts:130` «Handelsstadt erreicht — spiel frei weiter» ohne Denkmal-Hinweis; `buildMenu.ts:152` «Höchstens eine Denkmal»; «Bau pausieren» im Bauplatz-Stand; Tooltip «Entf» ohne Rücktaste (`inspect.ts:822`, Mac); Laden-Liste nach «Speichern» (`menu.ts`). Quellen: M13-E1 T14, REL-18, M13-E2 Browser-Lauf 1/Final-Review, UI-TASTEN. |
| **UI-AUFRAEUM-2 (erledigt, Branch `refactor/ui-aufraeum-2`)** Kopplung über Anzeigetexte, doppelte Kostenstruktur | S–M | ui      | `lead-tech`                       | Abschluss-Banner am Text erkannt (`app.ts`), Pausenzustand aus Knopftext (`monumentSection.ts`), Kosten doppelt (`monumentView.ts`/`app.ts`), `stage`-Sprung ergibt einen Chronik-Eintrag, kein DOM-Test `rest-monument`; `RESERVE_TICKS = 1000` neben Sim-800 (`balance-monument.test.ts:48`); `isSaveChord` in `modal.ts` zieht `sim/defs` mit; «Abreissen» sechsmal als Literal (`inspect.ts` 4, `app.ts` 2). Nach M13.                                                                                                                                |
| **TOOL-BUENDEL-7** `testrun`/`log`/`model`-Restpunkte                                                             | S–M | tool    | `lead-tech` (Regel vorher L0)     | `testrun.py` `parse_names` bei Sammelfehlern leer; zweites Ctrl-C vor `_ignore_interrupts()` (kein `pthread_sigmask`); `log.py` `_package_exists` sucht ID als Rohtext (nicht-ASCII); `model.py` `lead_phases`/`budget_key` hängen an der Reihenfolge in `result` (`claim_budgets()` nur in `result`-Pfad, Zeile 1214); Lead mit Paket `X-T01` bindet Freigabe `X` nicht (Präfix-Regel vorher L0); `make docs-check` erkennt zerrissene Markdown-Tabellen nicht (unmaskiertes `\|` im Code-Span).                                                         |
| **Entscheid `lead-design`** Layout unter 900 px (AK-M13E2-48)                                                     | —   | ui      | `lead-design`                     | Bei 800×600 überlappen `#panel` und `#game` um 161 px, HUD 931 px breit. Empfehlung: AK-M13E2-48 auf «stürzt nicht ab» zurücknehmen (Desktop-first ab 1280 px, `CLAUDE.md`), kein Layout-Umbau. Dazu Spec-Nachträge: AK-M13E1-14 (Geld ≥ 600), AK-M13E1-36 gegen U-4, Rechtsklick in UI-GUT-CHIP-Spec.                                                                                                                                                                                                                                                    |
| **Entscheid L0** `make push-check` D1/Lastwarten                                                                  | —   | tool    | L0 (R514 V2-Daten)                | Bei leerer Markierungsliste Exit 0 ohne Nachmessung (D1), `check-ci-perf` wartet nicht auf ruhige Last (`tools/studio/pushcheck.py`); falsches Rot möglich, kein falsches Grün. Empfehlung: nach den Load-Daten aus R514 V2 entscheiden, kein Paket vorher.                                                                                                                                                                                                                                                                                               |

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

## Ausgewertet 2026-10-13

12 Einträge und 2 Stichpunkt-Zeilen am Stand `ee83d2e6` geprüft (R580). Bilanz: 8 erledigt, 3 eingeplant bzw. als Board-Vorschlag, 3 abgehakt mit Trigger; 0 neue Ideen (Pool ≫ 40, `docs/ideen.md` nur per grep gelesen).

| Eintrag (Datum · Titel)                                            | Ergebnis                                                                                              | Beleg                                                                                                                                                                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-10 · Verkaufssättigung / Dauerverkauf Holz                 | abgehakt, Trigger: nächstes Handels-/Wirtschafts-Brainstorming (I-047 Stammkunde, Paket design-I-047) | I-048 Schritt B entschieden: Verzicht (R571), `BUY_RISE = 0` in `src/sim/defs/goods.ts`; `SELL_RECOVERY_INTERVAL = 10` in `src/sim/defs/timing.ts`; Dauerverkauf-Zahlen nicht neu gemessen                                         |
| 2026-10-11 · `buyPct` fehlt in arc42                               | eingeplant (Trivial-Fix-Vorschlag an L0)                                                              | `grep buyPct docs/arc42.md`: 0 Treffer; `buyPct` lebt in `src/sim/{types,world,save,trade}.ts`; T08 von `feat/i048-b` wird nie gemergt (R571), also deckt es niemand                                                               |
| 2026-10-11 · Sieg-Tick im Balancing sprunghaft                     | erledigt                                                                                              | `BUY_RISE = 0` (R571); Robustheit über Ensemble: `ENSEMBLE_WIN_TICK_LIMIT` in `tests/sim/ensemble.test.ts:9`, R558, R572                                                                                                           |
| 2026-10-11 · Controller kippt bei verschobenen Zeitpunkten         | erledigt                                                                                              | Härtung TOOL-CONTROLLER-HAERTUNG (R568), Gate-Ensemble (R558)                                                                                                                                                                      |
| 2026-10-11 · Controller-Stillstand Phase 50/70/90                  | erledigt                                                                                              | R568 (Stillstand), R572 (Streuung, `ENSEMBLE_WIN_TICK_LIMIT` 8250)                                                                                                                                                                 |
| 2026-10-11 · L0-Commit fängt offenen Integrator-Merge ein          | erledigt                                                                                              | Integrator mergt nur in `.worktrees/integrate` (R565 P1, `docs/studio/STUDIO.md` Abschnitt Gate Merge), E-063                                                                                                                      |
| 2026-10-12 · `README.md` und `docs/ideen.md` werden ganz gelesen   | eingeplant (Board-Vorschlag)                                                                          | `wc -c`: README 59461 B, ideen 79954 B (gewachsen); E-057 greift nur beim Teillesen. Vorschlag: Paket DOC-ARCHIV (S, `lead-production`): umgesetzte/verworfene Ideen und README-Spielwerte in Archivdateien                        |
| 2026-10-12 · README nennt Spielstand-Version 11                    | erledigt                                                                                              | `README.md:629` «Spielstand-Version 13», `src/sim/save.ts:54` `SAVE_VERSION = 13`                                                                                                                                                  |
| 2026-10-12 · Insel C verschiebt Meer-Deko                          | abgehakt, Trigger: Spieler- oder Playtest-Meldung über verschobene Sandbänke/Riffe                    | R574: Browser-Check T08 «Meer-Deko-Verschiebung nicht sichtbar»                                                                                                                                                                    |
| 2026-10-12 · `make studio-lint` Exit 2                             | erledigt                                                                                              | `make studio-lint` in `main` am `ee83d2e6`: Exit 0; Fix `d3841a34`                                                                                                                                                                 |
| 2026-10-12 · Befunde Browser-Check M14-E1 (a)–(e)                  | (b), (e) abgehakt; (a), (c), (d) eingeplant (Werkzeug-Bündel Szenarien)                               | (b) Desktop-first-Regel, Trigger: Mindestbreite wird angehoben; (e) natives `title`, Trigger: Tooltip-Überarbeitung. (d) belegt: `tests/sim/scenarios.ts:1115-1125` `m13e2-v13` trägt `SAVE_VERSION + 1` (= v14), Name irreführend |
| 2026-10-12 · nacktes `git stash` / `stash pop`                     | eingeplant: TOOL-BUENDEL-10 (T02, E-064)                                                              | R579 V1 (Guard sperrt `git stash` ausser `list`/`show`); bisher `tools/studio/guard.py:318` sperrt nur `drop`/`clear`                                                                                                              |
| Stichpunkt · `buildMenu.ts` Tooltip-Zeile am Text erkannt          | abgehakt, Trigger: nächstes UI-Aufräumpaket                                                           | `src/ui/buildMenu.ts:221` `startsWith('Erzeugt:')` besteht; `tests/ui/input.test.ts:385` unverändert; UI-HAEPPCHEN-A fasst `buildMenu.ts` nicht an (Plan Z. 61)                                                                    |
| Stichpunkt · `make check` rot an `islands-c.test.ts` (Zeitreserve) | eingeplant: TOOL-BUENDEL-10 (T01)                                                                     | R579; Test ohne eigenen Timeout (`tests/sim/islands-c.test.ts:115`, Standard 5000 ms)                                                                                                                                              |

**Vorschläge fürs Board (Entscheid L0):**

1. `buyPct` in `docs/arc42.md` (Persistenz/`save.ts`) nachführen: Trivial-Fix, eine Zeile, am besten im nächsten Doku-Audit vor dem Release.
2. Paket DOC-ARCHIV (Grösse S, Owner `lead-production`): `docs/ideen.md` (79,9 KB) und README-Spielwerte-Anhang auslagern, damit E-057 nicht mehr greifen muss.
3. In das Werkzeug-Bündel Szenarien (nächstes TOOL-BUENDEL): Szenario `m13-vor-ziel` erreicht das Ziel nicht von selbst (c), AK-36-Szenario `m14e1-felsbucht` (a), Umbenennung `m13e2-v13` (d).

## Offen (neue Einträge unten anhängen)

- **2026-10-13 · `tools/studio/guard.py` Stash-Sperre (E-064) umgehbar.** Sie lässt sich über Git-Alias (`git -c alias.s=stash s`), Befehlssubstitution (`git $(echo stash)`) und `xargs git stash` umgehen; war schon bei der bestehenden Sperre so. Sie schützt gegen Versehen, kein Sicherheitsmerkmal. Ursprung: Final-Review TOOL-BUENDEL-10. Einschätzung: hinnehmen.
- **2026-10-13 · `tools/studio/tests/test_hook.py` `test_malicious_session_id_skips` nicht isoliert.** Prüft, dass `<Systemtemp>/x` nicht existiert; ein Verzeichnis `x` eines parallelen Arbeiters (I047) liess `make push-check` Lauf 1 rot werden, Lauf 2 mit eigenem `TMPDIR` grün. Ursprung: Push-Gate REL-20 (Integrator). Einschätzung: Trivial-Fix im nächsten TOOL-BUENDEL (eigenes `tmp_path`).

- 2026-10-13 · `src/sim/save.ts` `isValidContractFields` · Das Laden prüft `contract.amount`/`price` nur als ganze Zahlen (≥ 1 bzw. ≥ 0), nicht gegen `GOODS[g].order.contract` und `contractUnitPrice`; ein manipulierter Spielstand kann eine beliebige Strafe oder Zahlung festschreiben. · Ursprung: Zwischen-Review I047-SIM · Einschätzung: Single-Player, kein Sicherheitsproblem; bei Bedarf strengere Prüfung, Trigger: Cheat-/Missbrauchsmeldung oder spätere Wertänderung der Mengen (alte Saves tragen festgeschriebene Werte absichtlich).
- 2026-10-13 · `tests/sim/save.test.ts` (`slice(-17, -15)` u. ä.) · Magic-Number-Indizes auf Weltschlüssel verschieben sich bei jedem neuen Schlüssel; Titel «uses version 5» (Z. 137) ist veraltet. · Ursprung: Zwischen-Review I047-SIM · Einschätzung: nach Schlüsselnamen indexieren; Trigger: nächster neuer Weltschlüssel.

### 2026-10-13 · Unterhalt-Karte bei Pause: Fusszeile gegen Zeilen leicht verschoben

- Fundort: `src/ui/upkeepRank.ts` (UI-HAEPPCHEN-A, Final-Review). Beobachtung: Die Fusszeile nimmt `stats.upkeep`, das nur je Tick nachgeführt wird. Baut man in der Pause oder wechselt das Edikt und öffnet dann die Karte, weichen Zeilen und Fusszeile bis zum nächsten Tick ab (mit Sparedikt landet die Abweichung in der Edikt-Zeile). Ursprung: Final-Review. Einschätzung: niedrig; Abhilfe `totalUpkeep(world)` beim Öffnen, falls es im Spiel auffällt.

### 2026-10-13 · Heimat-Kontor fehlt in der Unterhalt-Rangliste

- Fundort: Playtest UI-HAEPPCHEN-A. Beobachtung: Das Heimat-Kontor (Unterhalt 0) steht nicht in der Rangliste, ein Kontor auf einer fernen Insel schon (60 / min). Passt zum Code, kann irritieren. Ursprung: Playtest. Einschätzung: niedrig, ggf. Hinweistext oder Konsistenz prüfen.

### 2026-10-13 · Bilanz-Vorschau ohne Haus-Aufstieg und ohne Stilllegen

- Fundort: `src/ui/balancePreview.ts` (UI-HAEPPCHEN-B, R577). Beobachtung: Die Vorschau «Bilanz danach» rechnet Bau und Ausbau von Betrieben, beim Wohnhaus nur die Steuer-Obergrenze. Der Aufstieg Haus → nächste Stufe (Steuer steigt) und das Stilllegen (halber Unterhalt, I-078 nennt es) sind ausgeklammert. Ursprung: Plan UI-HAEPPCHEN-B, Punkt 3. Einschätzung: Folgehäppchen, klein; erst bei Spielerfragen nach dem Aufstieg lohnend.

### 2026-10-13 · Stammkunde: Karte ohne Kündigen bei gesperrter Funktion, ungesicherter Inselzugriff

- Fundort: `src/ui/order.ts` (`updateOrder` ca. Z. 216, `contractWarn`/Kartentext ca. Z. 47 und 78), Final-Review I-047. Beobachtung: (1) Bei gesperrter Funktion `orders` blendet `updateOrder` die ganze Karte aus, also auch «Kündigen», obwohl die Sim das Kündigen erlaubt (AK-SK-15); nur über einen manipulierten Stand erreichbar, da Freischaltungen nie zurückgenommen werden. (2) `world.islands[c.island]!` ohne Absicherung; die Sim behandelt eine ungültige Insel als Bruch `island`, die UI würde werfen; Ladeprüfung weist solche Stände ab. Ursprung: Final-Review opus. Einschätzung: niedrig, bei Gelegenheit `islandAt` nutzen und Karte zeigen, solange `contract !== null`.
- Ausserdem: Der Fehlerpfad-Test prüft `runContractAction`, nicht die `app.ts`-Verdrahtung (Task-Review T05, niedrig).
- **2026-10-13 · Spec M14-E1 AK-M14E1-36 nennt «Holz 20», Szenario `m14e1-felsbucht` nutzt seit TOOL-BUENDEL-11 Holz 10** (sonst verbraucht die Glashütte den Stein). Fundort `docs/superpowers/specs/2026-10-10-m14-e1-inselcharakter-design.md` Z. 371–373. Ursprung: TOOL-BUENDEL-11 T03. Einschätzung: Beipack beim nächsten Design-Durchgang (R602).
- **2026-10-13 · Linienzug mit Umschalt: Esc und Rechtsklick wirken verschieden**; README Z. 164 passt nur für Rechtsklick. Ursprung: Release-Check REL-21 (Opus-Review). Einschätzung: Designfrage an lead-design, README beim Doku-Fix angleichen.
- **2026-10-13 · Kleinbefunde Release-Check REL-21:** Testname `'uses version 5'` veraltet (`tests/sim/save.test.ts:136`); `balanceAfterUpgrade` ohne Cache je Panel-Refresh (`panelView.ts`); Präfix `g:` doppelt belegt (`storageFull.ts:20`); Vertragskarte liegt genau 6 px neben der Krisenkarte (Grenzwert R589). Ursprung: Release-Check REL-21. Einschätzung: Sammelpaket UI-Aufräumen.

### 2026-10-13 · UI-HAEPPCHEN-C: Kleinbefunde Vertragskarte

- a) `goodsBalance` wird in `refresh()` mehrfach je Aufruf berechnet (HUD, Chips) und neu für die Angebotskarte (ca. 18 ms Erstaufruf bei 1200 Gebäuden, Reichweitenprüfung der Häuser). Vorschlag: ein Ergebnis je `refresh` teilen. Ursprung: UI-HAEPPCHEN-C. Einschätzung: mittel, bei grossen Inseln spürbar.
- b) Ein Inselwechsel hebt den Gut-Fokus des Chips auf (`shouldClearFocus`); beim Vertragssprung auf eine ferne Insel sichtbar. Bestehende Regel. Ursprung: UI-HAEPPCHEN-C. Einschätzung: niedrig, ggf. Designfrage.
- c) `btn.blur()` greift nur bei Mausklick; nach `Enter` bleibt der Fokus auf «Zum Erzeuger» (vermutlich bei allen Karten-Knöpfen gleich). Ursprung: UI-HAEPPCHEN-C. Einschätzung: niedrig.
- d) Mit `--disable-gpu` headless bei 1920×1080 und Brand ca. 27 ms/Frame; nur Testumgebung. Ursprung: UI-HAEPPCHEN-C. Einschätzung: kein Handlungsbedarf.
- **2026-10-13 · Markterholung 60 Punkte/min, nicht ≈ 6** (`src/sim/defs/timing.ts:18`, `tick.ts:45`); die Anhänge I-047 W.2/W.4 und Spätspiel B.5 rechnen mit dem zehnfach kleineren Wert, ihre Grenzen für Basis F sind zu streng (sichere Seite). Ursprung: design-I-092 (Wirtschaftsdesigner). Einschätzung: Anhänge beim nächsten Wirtschafts-Design korrigieren.
- **2026-10-13 · Schiffsunterhalt 15 je 100 Ticks = 90 Geld/min**, nicht 15/min, in älteren Design-Rechnungen. Ursprung: design-I-092. Einschätzung: wie oben.
- **2026-10-13 · `docs/spielwerte.md` nennt «Preise global» bei Kontor II nicht wörtlich**, eine Idee verweist darauf. Ursprung: design-I-092. Einschätzung: Doku-Beipack.
