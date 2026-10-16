# Beobachtungen (Posteingang für Befunde ausserhalb des Scopes)

Aufbau je Eintrag: Datum · Fundort · Beobachtung · Ursprung · erste Einschätzung.
Auswertung mit dem Skill `beobachtungen-auswerten`. Ein Folgeissue entsteht nur auf
ausdrückliche Zustimmung des Nutzers; im Studio gehen Paket-Kandidaten an L0.

Letzte Auswertung: 2026-10-16

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

**Stand 2026-10-14** (`lead-production`, Paket BEOB-AUSWERTUNG-14, gegen `ea1e14fc`): 17 Einträge gesichtet. Bilanz in „Ausgewertet 2026-10-14“; fünf Einträge sind UI-AUFRAEUM-3 (R617) bzw. TOOL-BUENDEL zugeordnet, der Rest abgehakt mit Trigger.

**Stand 2026-10-16** (`lead-production`, Paket BEOB-16, gegen `e9626a27`): 35 Einträge gesichtet (20 Überschriften, 15 Stichpunkte). Bilanz in „Ausgewertet 2026-10-16“; ein Eintrag (Salzregister, Ortsrand) bleibt offen.

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

## Ausgewertet 2026-10-14

17 Einträge am Stand `ea1e14fc` geprüft (R620). Bilanz: 5 eingeplant (UI-AUFRAEUM-3 R617: 4, TOOL-BUENDEL: 1), 2 Doku-Beipack mit Trigger, 10 abgehakt mit Trigger, 0 neue Ideen. I-100 (R619) deckt keinen Eintrag ab (Neu-Zähler am Ereignis-Log, kein Bezug zu Karten oder Unterhalt). Nachtrag zu 2026-10-13: `buyPct` steht inzwischen in `docs/arc42.md` (Abschnitt Persistenz, `grep buyPct`), Board-Vorschlag 1 ist damit erledigt.

| Eintrag (Datum · Titel)                                                  | Ergebnis                                                                                                                                                                                                                                                                                          | Beleg                                                                                                                                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-13 · Stash-Sperre in `guard.py` umgehbar                         | abgehakt, Trigger: Sperre wird als Sicherheitsmerkmal gebraucht oder ein Stash-Verlust-Vorfall                                                                                                                                                                                                    | schützt gegen Versehen, nicht gegen Absicht (E-064)                                                                                                   |
| 2026-10-13 · `test_malicious_session_id_skips` nicht isoliert            | eingeplant: nächstes TOOL-BUENDEL (Trivial-Fix, eigener temporärer Ordner)                                                                                                                                                                                                                        | `tools/studio/tests/test_hook.py` Test unverändert seit der Meldung; Ursache liegt im geteilten Systemtemp-Ordner                                     |
| 2026-10-13 · `isValidContractFields` prüft Betrag/Preis nur grob         | abgehakt, Trigger: Cheat-/Missbrauchsmeldung oder Wertänderung der Mengen                                                                                                                                                                                                                         | `src/sim/save.ts` `isValidContractFields`; `docs/arc42.md` Save v14 beschreibt dieselbe Prüfung                                                       |
| 2026-10-13 · Magic-Number-Indizes in `save.test.ts`                      | abgehakt, Trigger: nächster neuer Weltschlüssel; Titel «uses version 5» siehe REL-21-Kleinbefunde                                                                                                                                                                                                 | `tests/sim/save.test.ts` `slice(-17, -15)` (zwei Stellen) besteht                                                                                     |
| 2026-10-13 · Unterhalt-Karte bei Pause: Fusszeile verschoben             | eingeplant: UI-AUFRAEUM-3 T03 (Unterhalt je Insel + Fusszeile, I-089)                                                                                                                                                                                                                             | Plan-Index UI-AUFRAEUM-3, Task T03; im Browser-Check der Fusszeile mitprüfen                                                                          |
| 2026-10-13 · Heimat-Kontor fehlt in der Unterhalt-Rangliste              | eingeplant: UI-AUFRAEUM-3 T03/T07 (Ranglisten); abgehakt, falls T03 es als gewollt belässt                                                                                                                                                                                                        | Plan-Index UI-AUFRAEUM-3, T03 und T07; Verhalten nicht neu gemessen                                                                                   |
| 2026-10-13 · Bilanz-Vorschau ohne Haus-Aufstieg/Stilllegen               | abgehakt, Trigger: Spielerfrage nach dem Aufstieg in der Vorschau                                                                                                                                                                                                                                 | `src/ui/balancePreview.ts` besteht, nicht im Plan UI-AUFRAEUM-3                                                                                       |
| 2026-10-13 · Stammkunde: Karte ohne Kündigen, ungesicherter Inselzugriff | abgehakt, Trigger: nächstes Paket an `src/ui/order.ts` (dann `islandAt`, Karte bei `contract !== null`)                                                                                                                                                                                           | nur über manipulierten Stand erreichbar; weder UI-AUFRAEUM-3 noch I-100 fassen `order.ts` an                                                          |
| 2026-10-13 · Spec M14-E1 AK-M14E1-36 «Holz 20»                           | abgehakt, Trigger: nächster Design-Durchgang an der M14-E1-Spec (R602)                                                                                                                                                                                                                            | Szenario `m14e1-felsbucht` nutzt Holz 10                                                                                                              |
| 2026-10-13 · Linienzug: Esc und Rechtsklick verschieden                  | eingeplant: UI-AUFRAEUM-3 T01 (Rechtsklick staffelt wie Esc, I-098); README-Zeile in T07                                                                                                                                                                                                          | Plan-Index UI-AUFRAEUM-3, T01 und T07                                                                                                                 |
| 2026-10-13 · Kleinbefunde REL-21                                         | Testname `'uses version 5'` (`tests/sim/save.test.ts:136`) und Präfix `g:` (`storageFull.ts:20`): eingeplant UI-AUFRAEUM-3 T06; 6 px Vertragskarte: T04 (I-099); `balanceAfterUpgrade` ohne Cache: bleibt offen im Plan, abgehakt, Trigger: Messung, dass das Panel-Refresh spürbar kostet (R392) | Plan-Index UI-AUFRAEUM-3, «Herausgenommen»; Testname per grep noch vorhanden                                                                          |
| 2026-10-13 · UI-HAEPPCHEN-C Kleinbefunde (a)–(d)                         | (a) `goodsBalance` mehrfach je `refresh()`: abgehakt, Trigger: Messung auf grosser Insel (R392) oder nächstes UI-Perf-Paket; (b), (c): abgehakt, Trigger: Designrunde zur Karten-Bedienung; (d) abgehakt, kein Handlungsbedarf                                                                    | Plan UI-AUFRAEUM-3 «Herausgenommen» nennt (a)–(c) ausdrücklich als Beobachtung; `goodsBalance` in `src/ui/hud.ts` (drei Aufrufe) besteht              |
| 2026-10-13 · Markterholung 60 Punkte/min                                 | abgehakt, Trigger: nächstes Wirtschafts-Design (Anhänge I-047 W.2/W.4, Spätspiel B.5 korrigieren)                                                                                                                                                                                                 | Wert aus dem Eintrag nicht neu gemessen (sichere Seite)                                                                                               |
| 2026-10-13 · Schiffsunterhalt 90 Geld/min                                | abgehakt, Trigger: wie oben                                                                                                                                                                                                                                                                       | wie oben                                                                                                                                              |
| 2026-10-13 · `docs/spielwerte.md` «Preise global» bei Kontor II          | Doku-Beipack: beim nächsten Doku-Audit vor dem Release                                                                                                                                                                                                                                            | `grep "Preise global" docs/spielwerte.md`: 0 Treffer                                                                                                  |
| 2026-10-13 · I092: Marke `prefer-<good>` mit `badge--boom`               | eingeplant: UI-AUFRAEUM-3 T02 (Badge eigene Klasse)                                                                                                                                                                                                                                               | `grep badge--prefer src/style.css src/ui/trade.ts`: 0 Treffer                                                                                         |
| 2026-10-13 · README verweist auf «Seefahrt und Gewürz»                   | Doku-Beipack: beim nächsten Doku-Audit vor dem Release                                                                                                                                                                                                                                            | `README.md` Zeile 74: Verweis besteht, keine Überschrift dieses Namens (`grep -n "^#.*Seefahrt" README.md`: 0 Treffer); Werte in `docs/spielwerte.md` |

**Hinweis an L0:** UI-AUFRAEUM-3 deckt T03 (Heimat-Kontor) nur dem Titel nach; ob das Heimat-Kontor in die Rangliste kommt, entscheidet der Task (Beobachtung bleibt sonst abgehakt).

## Ausgewertet 2026-10-16

35 Einträge am Stand `e9626a27` gegen den Code auf main geprüft (BEOB-16). Bilanz: 7 erledigt (dazu 3 schon in BEOB-15 erledigte, durchgestrichene Zeilen), 8 eingeplant (UI-AUFRAEUM-4 bzw. ZEITRESERVE-PFLEGE im Pool), 19 abgehakt mit Trigger, 1 offen (Ortsrand, nicht angefasst), 0 Ideen, 0 verworfen. Browser- und Bildbefunde sind nicht neu gemessen.

| Eintrag (Datum · Titel)                                                | Ergebnis                                                                                | Beleg · Trigger                                                                                                                                                                                                        |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10-14 · Verfallenes Stammkunden-Angebot ohne Log-Eintrag               | erledigt                                                                                | `src/ui/autoLog.ts` `Stammkunden-Angebot verfallen: …` (Log-Eintrag, kein Toast)                                                                                                                                       |
| 10-14 · Auftragsereignisse fehlen im Log, Log nur bei Krisen           | erledigt (Rest abgehakt)                                                                | `autoLog.ts` (Zufall, Stammkunde), `farLogEntries` (Fern); `crisisLog.ts` `eventLogVisible` zeigt die Box auch bei Einträgen. Log wird weiter nicht gespeichert · Trigger: Spieler vermisst den Verlauf nach dem Laden |
| 10-14 · Log erscheint erst ab Tick 2400, «Krisen: aus» blendet aus     | erledigt                                                                                | `crisisLog.ts` `eventLogVisible` (Krisen-Bedingung oder mindestens ein Eintrag)                                                                                                                                        |
| 10-14 · Flake-Zeile ignoriert Session-Zeitraum                         | erledigt                                                                                | `65e87dda` (Session-Datei misst Flake-Verdacht ab Session-Beginn), `metrics.py` `_with_flakes`                                                                                                                         |
| 10-14 · HANDEL-2: tautologischer Test, tote Klausel `save.ts`          | erledigt                                                                                | BEOB-15 (`27a529c6`, `065c4940`), siehe durchgestrichene Zeilen vom 10-16                                                                                                                                              |
| 10-16 · wildlife/unlock-timeline Zeitreserve-Tests (3 Zeilen)          | erledigt                                                                                | BEOB-15 (`92691abf`, R672)                                                                                                                                                                                             |
| 10-16 · CTX-ALTLAST: Agenten suchen mit `grep`, nicht `rg`             | erledigt                                                                                | R683: Suche-Regel «`rg <muster> .`» in den Personen (`rg -n 'rg <muster>' .claude/agents`: 18 Dateien)                                                                                                                 |
| 10-16 · CTX-ALTLAST: `make studio-aufraeumen --apply`                  | erledigt                                                                                | `STUDIO.md` Schritt 2b nennt `ARGS=--apply`; Makefile-Hilfe ebenso                                                                                                                                                     |
| 10-16 · `wildlife.test.ts` RF-4 / «E5 nie im R4-Sperrbereich» > 500 ms | eingeplant: ZEITRESERVE-PFLEGE (Pool `releases.json`)                                   | Entscheid dort nach E-043 (eigenes Timeout), nicht neu gemessen                                                                                                                                                        |
| 10-14 · Erzeugungs-Cache ignoriert `connected` im pausierten Spiel     | eingeplant: UI-AUFRAEUM-4                                                               | `src/ui/order.ts` `producedPerMinute`: Schlüssel enthält nur Gebäudezahl, Stilllegung, Id-Summe; Kommentar nennt `connected` «ausser Scope»                                                                            |
| 10-14 · Erzeugungs-Cache: Ausbau in der Pause, Id-Summe                | eingeplant: UI-AUFRAEUM-4                                                               | wie oben (`pausedIds += b.id`); Kollision {1,4} gegen {2,3} belegt durch die Summenbildung                                                                                                                             |
| 10-14 · `order.ts` Cache-Schlüssel summiert Ids (Release-Check)        | eingeplant: UI-AUFRAEUM-4 (Duplikat des Vorigen)                                        | wie oben                                                                                                                                                                                                               |
| 10-14 · Menü-Feld «Krisen» gilt für die nächste Insel                  | eingeplant: UI-AUFRAEUM-4                                                               | `src/ui/menu.ts`: Beschriftung «Krisen: », nur das `aria-label` sagt «für die neue Insel»; Vorschlag Trivial-Fix an L0 (s. u.)                                                                                         |
| 10-14 · Rechtsklick bei gehaltener linker Taste (Roden, Abriss)        | eingeplant: UI-AUFRAEUM-4                                                               | `src/ui/input.ts` `onContextMenu` bricht nur den Linienzug ab (`drag?.line`); Browser-Verhalten nicht neu gemessen                                                                                                     |
| 10-14 · `aria-label` «3 neue Ereignisse» ersetzt Knopfnamen            | eingeplant: UI-AUFRAEUM-4                                                               | `src/ui/eventLogView.ts` `toggle.setAttribute('aria-label', …)`                                                                                                                                                        |
| 10-16 · Tooltip «Leer in 0 s» bei Bestand 0                            | eingeplant: UI-AUFRAEUM-4                                                               | `src/ui/hud.ts` `reachLine`: `Leer in ${formatGameTime(r.ticks)}` ohne Sonderfall für Bestand 0                                                                                                                        |
| 10-14 · Enger Kartenslot oben rechts                                   | abgehakt, Trigger: eine weitere Karte soll in den Slot                                  | Fernkarte mit Höchststapel ist in Handel 2 geliefert; Krisenkarte unverändert                                                                                                                                          |
| 10-14 · `pushLog` Denkmal-Zähler bei `crisisLogVisible` false          | abgehakt, Trigger: Spieler sieht einen alten Zähler                                     | nur theoretisch; `eventLogVisible` blendet die Box ohnehin erst bei Einträgen ein                                                                                                                                      |
| 10-14 · Commit-Präfix `merge:` fehlt in `../CLAUDE.md`                 | abgehakt, Trigger: Commit-Lint oder Konventionsprüfung wird eingeführt                  | Merge-Commits sind Git-Merge-Texte; STUDIO.md kennt `merge:` (kein Treffer als Verbot)                                                                                                                                 |
| 10-14 · Ereignis-Log sitzt unten links statt im Kartenstapel           | abgehakt, Trigger: Playtest meldet Überdeckung durch die Box                            | `src/style.css` `.log-box`; UI-HAEPPCHEN-D hat die Box angefasst, Bild nicht neu gemessen                                                                                                                              |
| 10-14 · Beschriftungszeile mit Boom und Vorliebe bricht um             | abgehakt, Trigger: Playtest meldet unleserliche Zeile                                   | nur Screenshot-Befund, nicht neu gemessen                                                                                                                                                                              |
| 10-14 · `eventLogView.ts` ohne Unit-Test                               | abgehakt, Trigger: Logik im View wächst über Zähler und Beschriftung                    | `ls tests/ui`: kein `eventLogView`-Test; getestete Teile liegen in `crisisLog.ts`                                                                                                                                      |
| 10-14 · `waitguard.py` Fehlnegative                                    | abgehakt, Trigger: ein Wartebefehl umgeht den Guard im Echtlauf                         | Muster nicht neu gemessen                                                                                                                                                                                              |
| 10-14 · Dashboard: favicon 404, Warnzeile leer                         | abgehakt, Trigger: nächste Dashboard-Änderung                                           | `rg favicon tools/studio`: 0 Treffer in Server und Dashboard                                                                                                                                                           |
| 10-16 · Controller als Messgerät nur im Ensemble                       | abgehakt, Trigger: nächste Balancing-Rechnung mit Geld-Hebel                            | `tests/sim/controller.ts` `runColony`; Ensemble ist seit R558 vorhanden                                                                                                                                                |
| 10-16 · Log-Box aufgeklappt verdeckt Karte                             | abgehakt, Trigger: Playtest meldet Überdeckung                                          | `.log-box` begrenzt nur die Breite; Bild nicht neu gemessen                                                                                                                                                            |
| 10-16 · Reichweite mit Hex-Werten `#ffd27a`/`#b9c49a`                  | abgehakt, Trigger: nächste Farbpflege in `style.css`                                    | `src/style.css` `.chip.reach-warn`, `.chip.reach-full` (belegt)                                                                                                                                                        |
| 10-16 · `updateHud`-Klassen ohne DOM-Test                              | abgehakt, Trigger: Zuordnung `reach` wächst                                             | nur `stockChipView` getestet                                                                                                                                                                                           |
| 10-16 · Reichweite ignoriert Handel und Aufträge                       | abgehakt, Trigger: Spieler liest die Zeile als falsch                                   | `reachLine` nennt «(ohne Handel und Aufträge)»; bekannte Grenze I-109                                                                                                                                                  |
| 10-16 · Log-Reihenfolge Fern vor Stammkunde/Zufall                     | abgehakt, Trigger: Spieler verwechselt die Reihenfolge                                  | nur Anzeige bei gleichem Tick                                                                                                                                                                                          |
| 10-16 · doppelte `goodsBalance`-Rechnung in `hud.ts`                   | abgehakt, Trigger: nächster Eingriff in `hud.ts` (nach Merge UI-HAEPPCHEN-F neu prüfen) | `updateHud` rechnet `goodsBalance`, `chipView` rechnet es je Gut erneut; `hud.ts` wird von F angefasst, daher nicht jetzt                                                                                              |
| 10-16 · Toast «Pausiert» deckt Banner «Pause» nach dem Laden           | abgehakt, Trigger: Playtest meldet den Effekt                                           | `src/ui/app.ts` `showMessage('Pausiert — …')` besteht; ca. 3 s, niedrig                                                                                                                                                |
| 10-16 · Vorschau erst nach «Ablehnen» des Angebots                     | abgehakt, kein Handlungsbedarf                                                          | beabsichtigt (`previewOrder` liefert bei offenem Angebot `null`), laut Eintrag kein Fehler                                                                                                                             |
| 10-16 · Auftragskarte zu Spielbeginn verborgen                         | abgehakt, kein Handlungsbedarf                                                          | beabsichtigt durch U3 (stufenweise Freischaltung)                                                                                                                                                                      |
| 10-16 · I-091 Vertragskarte könnte dreizeilig werden                   | abgehakt, Trigger: nächster Karten-Eingriff in `orderCardText`                          | im Browser nicht geprüft; R686 vermerkt zweizeilig bei 1280 px                                                                                                                                                         |
| 10-16 · Salzregister `groundDecor.ts` unvollständig                    | offen (Ortsrand ORT-A/ORT-1), nicht angefasst                                           | Beleg im Eintrag; `sprites.ts` und `wildlife.ts` nutzen `hash2(seed + 61…65)` (nachgesehen, Treffer stimmen)                                                                                                           |

**Vorschläge an L0 (Entscheid L0, R471):**

1. Pool-Paket UI-AUFRAEUM-4 (S, Owner `lead-tech`, nur bei freier Kapazität, kein Issue): Cache `order.ts`, Tooltip bei Bestand 0, Menü-Beschriftung «Krisen», `aria-label`, Rechtsklick bei gehaltener linker Taste. Eintrag steht im Pool von `releases.json`.
2. Trivial-Fix (Minuten, aber `tests/` betroffen, daher nicht selbst umgesetzt): `menu.ts` Beschriftung «Krisen (neue Insel): » statt «Krisen: ».
3. Reihenfolge: UI-HAEPPCHEN-F und Ortsrand zuerst; der Salzregister-Eintrag gehört in ORT-1.

**Ideen:** keine.

## Offen (neue Einträge unten anhängen)

## 2026-10-16 · UI-HAEPPCHEN-F: `goodsBalance` ohne `cov` kostet viel

- Fundort: `src/sim/flow.ts` `goodsBalance`; Aufrufer Kopfzeile (`src/ui/hud.ts`) und `routeBalance`
- Beobachtung: Ohne `cov` (Abdeckungs-Cache): denseScene H=484 / B=549 6,62 ms (mit `cov` 0,056 ms), Balancing-Welt H=4 / B=35 0,015 ms; Hochrechnung H≈150 / B≈400 ≈ 2 ms. Die Kopfzeile ruft sie ohne `cov` etwa 10× je Refresh.
- Ursprung: UI-HAEPPCHEN-F (Zeitmessung)
- Erste Einschätzung: niedrig bis mittel; Idee: `cov` aus dem Frame-Cache durchreichen.

## 2026-10-16 · UI-HAEPPCHEN-F: Test-Doubles ohne `querySelectorAll`, `Option`, `fillText`

- Fundort: `tests/ui/fakeDom.ts`, `tests/render/fakeCtx.ts`
- Beobachtung: `fakeDom` kennt weder `querySelectorAll` noch `Option` (Test in `routeBalanceText.test.ts` ergänzt lokal); `fakeCtx` loggt weder `fillText` noch `measureText` (Proxy in `seaMapDraw.test.ts`).
- Ursprung: UI-HAEPPCHEN-F
- Erste Einschätzung: niedrig; die Doubles zentral erweitern, sobald ein dritter Test sie braucht.

## 2026-10-16 · UI-HAEPPCHEN-F: Kopfzeile per `innerHTML`, kein Unit-Test der Chip-Klasse `negative`

- Fundort: `updateHud` (`src/ui/hud.ts`)
- Beobachtung: `updateHud` baut die Kopfzeile per `innerHTML`, `fakeDom` parst kein HTML. Die Chip-Klasse `negative` ist daher nicht per Unit-Test prüfbar (nur im Browser).
- Ursprung: UI-HAEPPCHEN-F
- Erste Einschätzung: niedrig; Browser-Prüfung deckt es ab.

## 2026-10-16 · UI-HAEPPCHEN-F: Bilanz-Chip ohne wirksame Verlustfarbe seit I-062

- Fundort: `src/style.css` (`.hud-balance`, `.negative`)
- Beobachtung: Der Bilanz-Chip hatte seit I-062 keine wirksame Verlustfarbe: `color: inherit` schlug `.negative`. Mit UI-HAEPPCHEN-F behoben (Commit `ada345b7`).
- Ursprung: I-062, entdeckt bei I-108
- Erste Einschätzung: erledigt; nur zur Kenntnis.

## 2026-10-16 · UI-HAEPPCHEN-F: Fernmarke über Wasser ohne Hover und Klick

- Fundort: Seekarte, `hitIsland` (`src/render/seaMap.ts`)
- Beobachtung: Eine Marke, die über Wasser (nicht auf Land) liegt, hat keinen Hover-Text und keinen Klick, weil der Treffer am Insel-Landtreffer hängt. Playtest 2026-10-16, Screens `.studio/qa/UI-HAEPPCHEN-F/m8-5-*`.
- Ursprung: UI-HAEPPCHEN-F
- Erste Einschätzung: niedrig; Marke ist laut Spec ohnehin ohne Mausfang.

## 2026-10-16 · UI-HAEPPCHEN-F: Bilanz-Chip länger als Plan-AK-3

- Fundort: Kopfzeile, Plan AK-3 «Chip ≤ 15 Zeichen»
- Beobachtung: Real sind es 17 Zeichen (`+999,9k / −999,9k`), 137 px bei 1280 px, einzeilig; Playtest OK. Die Spec-Grenze von 15 Zeichen galt bis 999 999 (ohne «k»-Kürzung).
- Ursprung: UI-HAEPPCHEN-F
- Erste Einschätzung: niedrig; kein Handlungsbedarf. Variante C der Routen-Bilanz (gemessen, Save) erst nach I-091 und nur, wenn «nominal» im Playtest zu ungenau ist.

## 2026-10-16 · UI-HAEPPCHEN-F: Routen-Bilanz rechnet bei jedem neuen Tick (nicht gedrosselt)

- Fundort: `src/ui/ships.ts` (`updateShipSection`, Memo je Quellinsel, Neuberechnung bei geändertem `world.tick`)
- Beobachtung: Bei 4× und offenem Kontor-Panel rechnet die Bilanzzeile bis etwa einmal je Tick und Quellinsel (`goodsBalance` ohne `cov`, spät ca. 2 ms, dicht 6,6 ms). Playtest 4×: Frame-Zeit unauffällig (Median 16,7 ms). Mögliche Drosselung über `BALANCE_REFRESH_MS`.
- Ursprung: Final-Review UI-HAEPPCHEN-F (niedrig)
- Einschätzung: nur bei Frame-Zeit-Befunden angehen; Alternative `cov` aus dem Frame-Cache durchreichen.

- 2026-10-16 · Salzregister im Kopf von `src/render/groundDecor.ts` unvollständig: `sprites.ts:2486–2516` (`roadCenter`, Wegsteinchen) nutzt `hash2(seed + 61…65)`, `wildlife.ts:437–448` (Wal) `hash2(seed + 61…64)`; das Register nennt nur «61/62 in terrain.ts» (dort `rotNoise`). Keine sichtbare Kollision (andere Funktionen/Argumente), aber das Register taugt so nicht zur Salzwahl. Ursprung: design-ortsrand (lead-art). Einschätzung: niedrig; beim Reservieren des Ortsrand-Blocks 600–619 (ORT-1) mit nachführen.
