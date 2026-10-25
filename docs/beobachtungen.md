# Beobachtungen (Posteingang für Befunde ausserhalb des Scopes)

Aufbau je Eintrag: Datum · Fundort · Beobachtung · Ursprung · erste Einschätzung.
Auswertung mit dem Skill `beobachtungen-auswerten`. Ein Folgeissue entsteht nur auf
ausdrückliche Zustimmung des Nutzers; im Studio gehen Paket-Kandidaten an L0.

Letzte Auswertung: 2026-10-22

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

**Stand 2026-10-22** (`lead-production`, Paket BEOB-18, gegen `9451237e`): 25 Überschriften und 1 Stichpunkt gesichtet. Bilanz und Paketvorschläge in „Ausgewertet 2026-10-22“; vier Zeilen bleiben offen (Salzregister, ORT-A, Stadtplanung). Die Abschnitte „Ausgewertet 2026-10-11 (2)“ bis „2026-10-14“ sind unverändert nach [beobachtungen-archiv.md](beobachtungen-archiv.md) verschoben (Dateigrösse: 84 KB auf unter 50 KB).

**Stand 2026-10-16 (2)** (`lead-production`, Paket BEOB-17, gegen `f2f8fb12`): 17 Einträge gesichtet (16 Überschriften, 1 Stichpunkt). Bilanz in „Ausgewertet 2026-10-16 (2)“; ein Eintrag (Salzregister) bleibt offen.

## Ausgewertet 2026-10-16 (2)

17 Einträge am Stand `f2f8fb12` geprüft (BEOB-17). Bilanz: 2 erledigt, 4 eingeplant (3 Paketvorschläge an L0), 10 abgehakt mit Trigger, 1 offen (Salzregister), 0 Ideen, 0 verworfen. Browser- und Bildbefunde nicht neu gemessen.

| Eintrag (Titel)                                                                                    | Ergebnis                                                                                      | Beleg · Trigger                                                                                                                                                |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-HAEPPCHEN-F: Bilanz-Chip ohne Verlustfarbe seit I-062                                           | erledigt                                                                                      | `src/style.css` `button.hud-balance.negative` setzt `color: var(--negative)`                                                                                   |
| Menü «Neue Insel»: Krisen und Freischaltung in einer Zeile                                         | erledigt (`27304033`)                                                                         | `src/ui/menu.ts` Klasse `menu-field`, `src/style.css` `.menu-field`; `make lint`, `make conflicts`, `make zeittests` Exit 0; reine CSS-Änderung, kein Rot-Test |
| TOOL-BUENDEL-14 H-2: alte `load_abort`-Ereignisse                                                  | abgehakt, Trigger: nächste HAUSHALT-Runde                                                     | nur Kennzahlen-Rauschen in der lokalen `.studio/events.jsonl`                                                                                                  |
| UI-HAEPPCHEN-F: `goodsBalance` ohne `cov` kostet viel                                              | eingeplant: PERF-BILANZ-COV                                                                   | `src/sim/flow.ts` `goodsBalance`; `hud.ts` gehört I-114 (unmerged), daher nicht jetzt                                                                          |
| UI-HAEPPCHEN-F: Routen-Bilanz nicht gedrosselt                                                     | eingeplant: PERF-BILANZ-COV (gleiches Paket)                                                  | `src/ui/ships.ts` `updateShipSection`, Memo je Tick; Playtest 4× unauffällig                                                                                   |
| TOOL-BUENDEL-13: `command` in `guard_block` ohne Schwärzung                                        | eingeplant: TOOL-GUARD-REDACT                                                                 | `tools/studio/guard.py` `_shown_command` kürzt nur auf `COMMAND_LIMIT`, schwärzt nichts; Datei lokal und ignoriert                                             |
| TOOL-BUENDEL-14 H-1: sieben Tests über 40 % Timeout                                                | eingeplant: ZEITRESERVE-PFLEGE (Pool)                                                         | Entscheid dort nach E-043; Nachmessung beim nächsten `push-check`                                                                                              |
| UI-HAEPPCHEN-F: Test-Doubles ohne `querySelectorAll`, `Option`, `fillText`                         | abgehakt, Trigger: ein dritter Test braucht sie                                               | lokale Hilfen in `routeBalanceText.test.ts`, `seaMapDraw.test.ts`                                                                                              |
| UI-HAEPPCHEN-F: Kopfzeile per `innerHTML`, Chip-Klasse `negative` ohne Unit-Test                   | abgehakt, Trigger: Kopfzeile wird auf DOM-Knoten umgebaut                                     | Browser-Prüfung deckt es ab                                                                                                                                    |
| UI-HAEPPCHEN-F: Fernmarke über Wasser ohne Hover/Klick                                             | abgehakt, Trigger: Playtest vermisst den Klick                                                | Marke laut Spec ohne Mausfang; `src/render/` gehört ORT-A                                                                                                      |
| UI-HAEPPCHEN-F: Bilanz-Chip länger als Plan-AK-3                                                   | abgehakt, kein Handlungsbedarf                                                                | 17 statt 15 Zeichen, einzeilig bei 1280 px; Variante C erst nach I-091 und nur bei zu ungenauem «nominal»                                                      |
| TOOL-E070: drei Testlücken Flake-Last-Anzeige                                                      | abgehakt, Trigger: nächste Berührung der Anzeige (`tools/studio/efficiency.py` `flake_loads`) | niedrig                                                                                                                                                        |
| TOOL-BUENDEL-13: `rule_of` ordnet per Stichwort                                                    | abgehakt, Trigger: neue Guard-Regel (`RULE_KEYWORDS` mitführen)                               | `tools/studio/guard.py` `rule_of` fällt auf «other»                                                                                                            |
| I-118: CAPS-Pin in `weather.test.ts`                                                               | abgehakt, Trigger: nächste Änderung an `src/render/limits.ts`                                 | `src/render/` gehört ORT-A                                                                                                                                     |
| I-120/I-118: vier niedrige Hinweise (`RISE_TOTAL_MS`, `<= 6`, `cap('riseGlow')`, viewStats 526 ms) | abgehakt, Trigger: nächste Berührung von `fx.ts`/`renderer.test.ts`                           | `fx.ts` `RISE_TOTAL_MS = 1500` dupliziert `aufstieg.ts` `RISE_MS = 1500` (belegt); Dateien gehören ORT-A                                                       |
| UI-AUFRAEUM-4: Rechtsklick `pointerdown` b2 im Strich                                              | abgehakt, Trigger: Browser-Befund (Firefox) oder README-Präzisierung «in Chrome»              | `src/ui/input.ts` `onPointerDown` b2: Staffelung nur für `drag?.line`                                                                                          |
| TOOL-BUENDEL-14 H-3: Wettlauf-Test mit schwacher Obergrenze                                        | abgehakt, Trigger: nächste Berührung des `testlock`-Tests                                     | 1..2 Ereignisse je Runde laut Gate-Handoff                                                                                                                     |
| Salzregister `groundDecor.ts` unvollständig                                                        | offen (ORT-1), nicht angefasst                                                                | `sprites.ts` `hash2(seed + 61…65)` belegt                                                                                                                      |

**Vorschläge an L0 (Entscheid L0, R471), kein Issue:**

1. PERF-BILANZ-COV (S, `lead-tech`, Pool, erst nach I-114-Merge wegen `hud.ts`): `cov` aus dem Frame-Cache an `goodsBalance` in Kopfzeile und `routeBalance` durchreichen, optional Drosselung (`BALANCE_REFRESH_MS`); Messwerte im Eintrag (dicht 6,6 ms gegen 0,056 ms).
2. TOOL-GUARD-REDACT (S, über `lead-production`): `command` im Ereignis `guard_block` schwärzen (Token-Muster) und testen; Priorität mittel, vor dem Teilen der Ereignisdatei.
3. ZEITRESERVE-PFLEGE nimmt H-1 (sieben Tests über 40 %) in den Umfang.

**Ideen:** keine. **Gekippte Empfehlung:** Der Vorschlag «`menu.ts` Beschriftung ändern» aus BEOB-16 war schon umgesetzt (`Krisen (neue Insel): `); es blieb nur der Abstand.

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
| 10-14 · Erzeugungs-Cache ignoriert `connected` im pausierten Spiel     | erledigt: UI-AUFRAEUM-4                                                                 | `src/ui/order.ts` `producedPerMinute`: Schlüssel enthält nur Gebäudezahl, Stilllegung, Id-Summe; Kommentar nennt `connected` «ausser Scope»                                                                            |
| 10-14 · Erzeugungs-Cache: Ausbau in der Pause, Id-Summe                | erledigt: UI-AUFRAEUM-4                                                                 | wie oben (`pausedIds += b.id`); Kollision {1,4} gegen {2,3} belegt durch die Summenbildung                                                                                                                             |
| 10-14 · `order.ts` Cache-Schlüssel summiert Ids (Release-Check)        | erledigt: UI-AUFRAEUM-4 (Duplikat des Vorigen)                                          | wie oben                                                                                                                                                                                                               |
| 10-14 · Menü-Feld «Krisen» gilt für die nächste Insel                  | erledigt: UI-AUFRAEUM-4                                                                 | `src/ui/menu.ts`: Beschriftung «Krisen: », nur das `aria-label` sagt «für die neue Insel»; Vorschlag Trivial-Fix an L0 (s. u.)                                                                                         |
| 10-14 · Rechtsklick bei gehaltener linker Taste (Roden, Abriss)        | erledigt: UI-AUFRAEUM-4                                                                 | `src/ui/input.ts` `onContextMenu` bricht nur den Linienzug ab (`drag?.line`); Browser-Verhalten nicht neu gemessen                                                                                                     |
| 10-14 · `aria-label` «3 neue Ereignisse» ersetzt Knopfnamen            | erledigt: UI-AUFRAEUM-4                                                                 | `src/ui/eventLogView.ts` `toggle.setAttribute('aria-label', …)`                                                                                                                                                        |
| 10-16 · Tooltip «Leer in 0 s» bei Bestand 0                            | erledigt: UI-AUFRAEUM-4                                                                 | `src/ui/hud.ts` `reachLine`: `Leer in ${formatGameTime(r.ticks)}` ohne Sonderfall für Bestand 0                                                                                                                        |
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

## Ausgewertet 2026-10-22

26 Einträge (31 Teilbefunde, je eine Tabellenzeile) am Stand `9451237e` geprüft (BEOB-18; die Marke zählte 23, gezählt sind 25 Überschriften und 1 Stichpunkt). Bilanz nach Zeilen: 4 erledigt, 1 verworfen, 14 abgehakt mit Trigger, 8 eingeplant als Paketvorschlag an L0 (P1 sechs Zeilen, P2, P3), 4 eingeplant bei laufenden Strängen und offen (Salzregister, ORT-A-Fixture, zwei Stadtplanung), 0 Ideen. Browser- und Bildbefunde nicht neu gemessen. ORT-A und Stadtplanung sind nicht gemergt, ihre Einträge bleiben bis zum Merge stehen.

| Eintrag (Titel)                                                      | Ergebnis      | Beleg · Trigger                                                                                                                                                                                                              |
| -------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-114: Lagerzahl der Fernkarte ohne Rotfärbung                       | erledigt      | `c51af713` «I-136 Fernlager-Zahl in tone-bad»; `farOfferParts.short` steuert die Färbung. Der Fernauftrag ist separat eingeplant (P1)                                                                                        |
| PERF-BILANZ-COV: Pause-/Ausfall-Wechsel im selben Tick               | abgehakt      | `routeBalance.ts`: Memo ist ein vom Aufrufer gereichtes `Map`, kein Zustand über Ticks · Trigger: ein Spieler meldet eine veraltete Bilanz                                                                                   |
| PERF-BILANZ-COV: `\|island` im Memo-Schlüssel                        | verworfen     | `routeBalance.ts` `balanceOf`: Schlüssel ist die Inselnummer im `Map`; `rg '\|island' src/sim/routeBalance.ts` = 0 Treffer                                                                                                   |
| PERF-BILANZ-COV: `focusLine`/`focusList`/`houseConsumers` ungemessen | abgehakt      | Funktionen in `src/ui/hud.ts` vorhanden, ungemessen · Trigger: Kopfzeile ruckelt auf grossen Inseln                                                                                                                          |
| I-112: Umschalt+R ohne Marke öffnet leere Rats-Karte                 | eingeplant P1 | `hotkeys.ts` `k === 'r' && shift` → `app.ts` `toggle` ohne Marken-Prüfung; `councilCard.ts` «Kein Beschluss offen.»; README «nur wenn die Marke da ist»                                                                      |
| I-112: `council.ts` sortiert jeden Tick alle Ids                     | abgehakt      | `council.ts:53` `.sort((a, b) => a - b)` belegt · Trigger: nächste Berührung von `council.ts` oder Tick-Profil zeigt es                                                                                                      |
| I-112: kein Reichweitenkreis bei stehender Kapelle                   | abgehakt      | `overlays.ts` nur im Bau-Modus (nicht neu gemessen) · Trigger: Überarbeitung der Auswahl-Anzeige                                                                                                                             |
| TOOL-GUARD: `_shown_command`/`COMMAND_LIMIT`                         | erledigt      | `rg 'COMMAND_LIMIT\|_shown_command' tools/` = 0 Treffer                                                                                                                                                                      |
| TOOL-GUARD: Restlücken von `redact`                                  | abgehakt      | `redact` wird nur in `guard.py` für den Hash genutzt (`guard.py:676`) · Trigger: Wiederverwendung für andere Ausgaben                                                                                                        |
| I-132: Controller ohne Nahrungsreserve                               | abgehakt      | Baseline, nur per Werte-Ruling · Trigger: Werte-Ruling zur Controller-Baseline                                                                                                                                               |
| I-132: Controller baut keine Feuerwache                              | abgehakt      | `controller.ts` kennt `opts.fireStation`, der Standardlauf nutzt sie nicht · Trigger: Werte-Ruling oder Krisen-Balancing                                                                                                     |
| I-132: Gewürzkauf nur für 100 Ticks                                  | abgehakt      | Baseline, nur per Werte-Ruling · Trigger: wie oben                                                                                                                                                                           |
| I-122/I-123: Rot-vor-Beleg fehlt im Ledger                           | abgehakt      | Prozessthema, Plan und Merge sind durch · Trigger: die nächste Prozess-Retro nennt es                                                                                                                                        |
| I-122/I-123: widersprüchliche Exit-Zeilen                            | erledigt      | der volle Lauf im `push-check` je Release (R810) deckt den Exit-Code ab; Artefakte unter `.studio/qa` sind Aufräumgut                                                                                                        |
| I-122/I-123: Beobachtungen aus lead-tech (a bis d)                   | abgehakt      | nicht im Browser neu gemessen · Trigger: Playtest meldet Umbruch «Strafe / 135» oder verzögerten Klang                                                                                                                       |
| Spec Stadtplanung: 55 statt 53 AK                                    | eingeplant    | Stadtplanung (Spec liegt nur auf `plan/stadtplanung`); bleibt offen                                                                                                                                                          |
| Balancing-Controller nur auf Seed 3 tragfähig, Seed-5-Referenzaufbau | eingeplant    | Stadtplanung T11/T12; die beiden Einträge sind zusammengelegt (I-132 ist gemergt); bleibt offen                                                                                                                              |
| Testhelfer `putBuilding`: `connected` ohne Weg                       | abgehakt      | `tests/sim/helpers.ts` `putBuilding` · Trigger: ein Lauf mit und ohne Speichern weicht ab                                                                                                                                    |
| I-132 Final-Review: Chronik-Text, Tab-Fokus, Kopfkommentar           | eingeplant P1 | `trial.ts` (UI) zeigt `formatClock(p.tick)` unter «bestanden»; `hud.ts` Ziel-Chip ist `<button>` ohne `tabIndex`; `sim/trial.ts` Kopf «ändert die Welt nicht» trotz `startTrial`                                             |
| I-132 Final-Review: Merge-Reihenfolge `feat/ort-a`/`feat/i132`       | erledigt      | `feat/i132` ist in main; der Konflikt bleibt für `feat/ort-a` (Merge-Hinweis an den Integrator)                                                                                                                              |
| ORT-A T10: Fixture ohne Bauland in Versorgung                        | eingeplant    | ORT-A (`tools/render-qa/fixtures/` liegt nicht auf main); bleibt offen                                                                                                                                                       |
| I-136: Fahrzeit in zwei Zeitformaten                                 | eingeplant P1 | `hud.ts` `formatGameTime` («27 s») gegen `islandCard.ts` `clock` («0:27»)                                                                                                                                                    |
| I-136: `stash@{0}` verschiebt die Alt-Stashes                        | abgehakt      | `git stash list`: drei Einträge, `{0}` WIP auf `feat/i136` · Trigger: Stash-Aufräumen per Ruling                                                                                                                             |
| I-136: `FAR_TRAVEL_TIP` ungesichert                                  | eingeplant P1 | `tests/ui/hud.test.ts` prüft `toBe(FAR_TRAVEL_TIP)` gegen die importierte Konstante                                                                                                                                          |
| I-136: Fernauftrag-Karte ohne Rotfärbung                             | eingeplant P1 | `farOrder.ts` `farOrderText` liefert nur Text, kein `short`                                                                                                                                                                  |
| TOOL-DASH-SCHLANK: tote Reste im Dashboard                           | eingeplant P2 | belegt: `data-agents` ohne Leser, `classify().level`, `views.js` Zweig `answer ? 'beantwortet'`, `effort.py` «Reiter Aufwand», `roster.md` «Organigramm». Erledigt: `.graph-body`-Höhe, Höhendeckel `#releases` (`5fecacfa`) |
| UI-HAEPPCHEN-G: HUD-Text ohne «zu spät»                              | eingeplant P1 | `farOrderText` ohne `farLate`; nur `resumeCard.ts` hängt «zu spät» an                                                                                                                                                        |
| UI-HAEPPCHEN-G: `farLate` zählt volle Schiffsfracht                  | abgehakt      | Näherung bewusst einfach · Trigger: Playtest meldet falsches «zu spät»                                                                                                                                                       |
| WIRTSCHAFT-BS-1: Scout-Idee mit falscher Code-Annahme (I-154)        | eingeplant P3 | `docs/ideen.md` I-154 «nur Hinfracht»; Code: `Route.ab/ba`, `routeBalance.ts` summiert beide Richtungen                                                                                                                      |
| Salzregister `groundDecor.ts` unvollständig                          | eingeplant    | ORT-A (`src/render/`); bleibt offen mit Verifiziert-Feld                                                                                                                                                                     |

**Paketvorschläge an L0 (Entscheid L0, R471):**

1. **P1 UI-BEIPACK-FERN** (S, ≈ 50 Tools, Owner `lead-tech`, Pool, kein Issue): `farOrderText` mit Teilung wie `farOfferParts` (Lagerzahl `tone-bad`) und «zu spät» im HUD-Text; Fahrzeit-Format von Fern- und Inselkarte angleichen; `FAR_TRAVEL_TIP` mit festem Text in `toBe`; `Umschalt+R` vor dem ersten Beschluss ignorieren (oder README anpassen); `ui/trial.ts` Text «Zeitpunkt», Ziel-Chip `tabIndex = -1` solange `trialChip` null, Kopfkommentar `sim/trial.ts`. Reihenfolge nach UI-HAEPPCHEN-H (gleiche Dateien `farOrder.ts`, `hud.ts`).
2. **P2 TOOL-DASH-REST** (XS, ≈ 20 Tools, Owner `production-studio-ops` über `lead-production`): die oben genannten toten Reste im Dashboard, Kommentar in `effort.py`, Wort in `roster.md`; `refactor:`-Commit, kein Test nötig.
3. **P3 PERSONA-SCOUT-PFLEGE** (XS, ≈ 15 Tools, Owner `lead-design`): `design-idea-scout` prüft «fehlt»-Annahmen mit einer `rg`-Suche und nennt die Fundstelle; I-154 in `docs/ideen.md` an den Stand anpassen (Rückfracht gibt es seit M12, offen ist höchstens ein drittes Gut oder die Anzeige).
4. **ZEITRESERVE-PFLEGE (R815):** Der Pin `tests/sim/perf.test.ts` AK-E0-15a (`PERF_PIN = 2.5`, rot unter Last, Eintrag im Archiv) gehört auf die Liste des Pool-Pakets.

**Ideen:** keine.

**Befund zum Verfahren:** Die Hook-Marke zählte 23 Einträge, die Datei enthielt 25 Überschriften und 1 Stichpunkt (Überschriften der Ebene 3 unter «Offen» zählen mit). Gekippt in der Prüfung: Der Memo-Eintrag `|island` war zunächst als «erledigt» vorgemerkt; am Code gibt es den Schlüssel nicht, daher «verworfen».

## Offen (neue Einträge unten anhängen)

- 2026-10-16 · Salzregister im Kopf von `src/render/groundDecor.ts` unvollständig: `sprites.ts` (`roadCenter`, Wegsteinchen) nutzt `hash2(seed + 61…65)`, `wildlife.ts` (Wal) `hash2(seed + 61…64)`; das Register nennt nur «61/62 in terrain.ts» (dort `rotNoise`). Keine sichtbare Kollision, aber das Register taugt so nicht zur Salzwahl. Ursprung: design-ortsrand (lead-art). Einschätzung: niedrig; beim Reservieren des Ortsrand-Blocks 600–619 (ORT-1) mit nachführen. **Verifiziert:** 22.10.2026 gegen `9451237e` — belegt (`src/render/sprites.ts` `hash2(seed + 61…65)`, `src/render/groundDecor.ts` Registerkopf Zeile «61/62 in terrain.ts»). Offen bis ORT-1 (`src/render/` gehört ORT-A).

## 2026-10-17 · ORT-A T10: Fixture ohne Bauland in Versorgung

- Fundort: tools/render-qa/fixtures/ort-a-siedlung.json (T10-Playtest, .studio/qa/ort-a/browser-ort1/)
- Beobachtung: Einzelhof (breiter Saum) und Bau am Patch-Rand nicht prüfbar, jeder Bauplatz liegt ausserhalb der Versorgung; Saum in der Siedlung sehr dezent; Item-Zählung über home(world) liefert für die Fremdinsel 0.
- Ursprung: ORT-A T10 · Einschätzung: Fixture mit Freiland im Versorgungsradius ergänzen (erzeuge.mjs), Saumstärke ggf. Design-Frage.
- Verifiziert: 22.10.2026 gegen `9451237e` — `tools/render-qa/fixtures/` liegt nicht auf main (`ls`: kein Verzeichnis); der Strang ORT-A ist nicht gemergt. Offen bis dessen Merge.

## 2026-10-17 · Stadtplanung: 55 statt 53 Abnahmekriterien

- Fundort: `docs/superpowers/specs/2026-10-17-stadtplanung-design.md` §9, R766 (Branch `plan/stadtplanung`)
- Beobachtung: Spec und R766 nennen 55 AK (44 Vitest); gezählt sind 53 (42 Vitest). Die AK-Zuordnung im Plan deckt alle 53.
- Ursprung: lead-tech, Plan Stadtplanung, Gate Plan lead-production
- Erste Einschätzung: niedrig; Zahl in der Spec durch lead-design korrigieren (T19 darf nur den Spec-Kopf ändern).
- Verifiziert: 22.10.2026 gegen `9451237e` — die Spec liegt nicht auf main (`ls docs/superpowers/specs/2026-10-17-stadtplanung-design.md` fehlt), der Strang Stadtplanung ist nicht gemergt. Offen bis dessen Merge.

## 2026-10-17 · Stadtplanung: Balancing-Controller nur auf Seed 3 tragfähig

- Fundort: `tests/sim/controller.ts`, `forceTerrain` (Seed 3, Westküste), Referenzaufbau aus `balance-monument.test.ts`; `tests/sim/trial-run.test.ts`
- Beobachtung: Die Controller sind auf Seed 3 gebaut; die Seeds 5, 6, 9, 12 tragen den Referenzaufbau nicht («kein freier Erweiterungsplatz für fisher»); Seeds 1, 2, 4, 7, 8, 11, 13 tragen ihn. Stadtplanung T11/T12 braucht ≥ 3 Seeds für M3/M4 und meldet sonst einen Blocker an L0.
- Ursprung: lead-tech, I-132 T02 und Plan Stadtplanung (zusammengelegt mit dem Eintrag «Referenzaufbau Seed 5»)
- Erste Einschätzung: mittel für Stadtplanung (Messbarkeit), sonst niedrig; Seeds mit tragfähigem Aufbau früh in T11 bestimmen.
- Verifiziert: 22.10.2026 gegen `9451237e` — Fehlertext `kein freier Erweiterungsplatz` in `tests/sim/merchantsController.ts:123` belegt; Strang Stadtplanung nicht gemergt. Offen bis dessen Merge.

- 2026-10-22 · `tools/studio/pushcheck.py` `LOAD_WAIT = 3.0` gegen Handbuch «Warten auf 1-min-Load ≤ 4» (STUDIO.md Push-Takt). Ursprung: Plan TOOL-PUSHSPERRE (lead-tech, R845). Einschätzung: niedrig; Code und Handbuch angleichen, wenn TOOL-PUSHSPERRE T05 `pushcheck.py` ohnehin berührt.

- 2026-10-22 · `make studio-test`, `make zeittests` und gezielte `npx vitest run` laufen ohne Bezug zum Messfenster (`.studio/messfenster`) und stören Messungen genauso wie `make check`. Ursprung: TOOL-MESSFENSTER (lead-tech, R847). Einschätzung: mittel; nach dem Merge prüfen, ob diese Ziele die Sperre ebenfalls respektieren sollen.
- 2026-10-22 · `tools/render-qa/perf.mjs` hatte kein R329-Lastgate; in `tests/tools` braucht das Typ-Stripping dynamische Importe, weil `@types/node` fehlt. Ursprung: TOOL-MESSFENSTER (lead-tech, R847). Einschätzung: niedrig.

- 2026-10-22 · `make studio-lint` auf main rot (`tools/studio/tests/test_modelguard.py:67`). Ursprung: TOOL-PUSHSPERRE (lead-tech, R848). Einschätzung: niedrig, Trivial-Fix im nächsten Werkzeug-Paket.
- 2026-10-22 · `docs/studio/STUDIO.md:457` nennt die alte Stand-Warnschwelle 5; nach Merge von TOOL-PUSHSPERRE (Schwelle 2) durch `studio-coach` nachziehen. Ursprung: R848.
- 2026-10-22 · `pushgate.py`-Selbstschutz sperrt Agenten schon, wenn `push-freigabe` nur im Befehl vorkommt (z. B. `rg`, Commit-Message); `cd` aus Subshell nicht nachgeführt; liest nur 4 MB von `events.jsonl` (≈ 6 Tage). Ursprung: TOOL-PUSHSPERRE (R848). Einschätzung: niedrig, Schutz gegen Versehen (Verfassung §1.3).
- 2026-10-22 · Mittel `tests/sim/perf.test.ts` AK-E0-15a von 1,59 ms (2026-10-05) auf ≈ 2,3 ms gestiegen; echte Sim-Verlangsamung möglich. Ursprung: TOOL-PUSHSPERRE T04 (R848). Einschätzung: mittel → ZEITRESERVE-PFLEGE (Messreihe über Commits, Last ≤ 4).

- 2026-10-22 · Beim schnellen Wechsel der Bau-Kategorien zeigt die Unterleiste kurz (≈ 600 ms) noch Einträge der vorigen Kategorie. Fundort: Playtest T09 (UI-HAEPPCHEN-I), nicht geprüft. Einschätzung: niedrig.
- 2026-10-22 · `src/ui/hud.ts` `updateMoney`/`moneyView`: `cashReach` wird je Frame zweimal berechnet (einmal fürs `aria-label`, einmal für Tooltip und Klassen). O(1), ohne Wirkung. Ursprung: UI-HAEPPCHEN-I T01. Einschätzung: niedrig; bei der nächsten Berührung einmal rechnen.
- 2026-10-22 · Nach dem Laden eines Spielstands sind `stats.taxes`/`stats.upkeep` bis zum ersten Unterhaltsintervall 0; der Geld-Chip zeigt dann keinen Kasse-leer-Hinweis. Ursprung: UI-HAEPPCHEN-I T03 (Browser-Check). Einschätzung: niedrig, höchstens 100 Ticks.
- 2026-10-22 · Bildrate headless bei ≈ 420 Häusern (Klone): Frame ≈ 33 ms, Render ≈ 24 ms; Ursache vermutlich Software-Renderer, nicht die Wachstumsbremse (`growthBrakes` Median ≈ 0,1 ms); kein A/B gemessen. Ursprung: UI-HAEPPCHEN-I T03. Einschätzung: niedrig.

- 2026-10-22 · Pläne (z. B. `docs/superpowers/plans/2026-10-22-ui-haeppchen-i.md`, Zeile «Abschluss je Strang») verlangen noch `make check` je Strang, obwohl Verfassung 1.3 §9.2 nur den Teilbeleg fordert. Ursprung: UI-HAEPPCHEN-I (R849). Einschätzung: mittel; Plan-Vorlage und offene Pläne (Seerecht, LEBEN-_, TOOL-_) nachziehen, `studio-coach`.

- 2026-10-22 · UI-BEIPACK-FERN Restpunkte: N2 doppelte Fall-Unterscheidung `setOrderText`/`orderCardText` (`src/ui/order.ts`), N3 Rats-Taste fällt in `app.ts` ≈ Z. 1123 bis `refresh()` durch, überflüssiges `as never` in `tests/ui/order.test.ts:769`. Ursprung: R855. Einschätzung: niedrig, nächstes UI-Paket in diesen Dateien.

## 2026-10-22 · DOKU-AUDIT-1b: ADR-011 steht noch auf «vorgeschlagen» (niedrig)

- Fundort: `docs/adr/` ADR-011 (Asset-Pipeline), Kopfzeile «Status: vorgeschlagen (angenommen mit dem Gate Plan M7)». Beobachtung: Die Pipeline ist seit M7 in Betrieb (Assets-Strang, `tests/assets/`, `docs/CREDITS.md`), der Status-Wortlaut ist aber ein Zwitter. Ursprung: DOKU-AUDIT-1. Einschätzung: Statuszeile auf «angenommen» setzen (Ruling-Bezug Gate Plan M7), reiner Doku-Fix; zusammen mit der Prüfung weiterer ADR-Statuszeilen in einer Doku-Runde erledigen.

## 2026-10-22 · UI-HAEPPCHEN-H P1: Autosave «Davor» (niedrig)

- Fundort: `src/ui/storage.ts` (`autosaveOnHide`, `saveAutoNewest`). Beobachtung: Lädt der Spieler «Davor» und lädt danach die Seite neu, schreibt `pagehide` den geladenen (älteren) Stand in den neuesten Platz; der neuere Stand geht verloren (Spec Regel 4, in der README vermerkt). Ursprung: Playtest T03 (Urteil BEDENKEN). Einschätzung: Designfrage. **Erledigt** durch R850: Laden eines Autosave-Platzes setzt den Zeiger auf ihn (`markAutoLoaded` in `loadSlot`), der neuere Stand im anderen Platz bleibt erhalten.
- Fundort: `docs/superpowers/plans/2026-10-22-ui-haeppchen-h/T03-*.md`. Beobachtung: Die Task-Datei nennt etwa 2 Spielminuten Abstand der Plätze; bei Tempo 3 sind es etwa 8 Spielminuten (2 Echtminuten, Takt 120 s Echtzeit). Ursprung: Playtest T03. Einschätzung: Text in der Task-Datei beim nächsten Anfassen angleichen.

## 2026-10-22 · LEBEN-SEE: `hidden`-Prüfung uneinheitlich in `sound.ts` (niedrig)

- Fundort: `src/audio/sound.ts` (`playBuild`, `playShortage`, `playWork`). Beobachtung: Seit LEBEN-SEE T05 prüft `play()` `hidden`; die drei Varianten prüfen es nicht und legen bei verborgenem Tab Knoten an. Ursprung: Final-Review Strang Klang. Einschätzung: hörbar folgenlos (Kontext suspendiert), nur uneinheitlich; Beipack-Kandidat.

## 2026-10-23 · WIRTSCHAFT-TIEFE: Werkzeug ohne Verbrauch nach Endausbau (niedrig)

- Fundort: `src/sim/defs/` (Werkzeug-Verbraucher). Beobachtung: Nach dem Endausbau wird Werkzeug nicht mehr verbraucht; die Kette läuft ins Leere. Ursprung: WIRTSCHAFT-TIEFE (R865). Einschätzung: Kandidat für «Wartung» (E1).
- Fundort: `tests/sim/merchantsController.ts:20-21`. Beobachtung: Kommentar nennt Unterhalt ≈ 415, gerechnet ≈ 670. Ursprung: WIRTSCHAFT-TIEFE. Einschätzung: Kommentar veraltet, Trivial-Fix beim nächsten Sim-Paket.

## 2026-10-23 · ORT-A: Messskript ohne WebSocket-Close-Handler (niedrig)

- Fundort: `tools/render-qa/lib.mjs`. Beobachtung: Kein `close`-Handler am WebSocket; stirbt Chrome mitten im Lauf, endet `perf.mjs` mit «unsettled top-level await» statt klarer Meldung (nachgestellt; Ursprung des Abbruchs vom 2026-10-22 nicht belegt). Ursprung: ORT-A (R871). Einschätzung: Handler mit Reject, Trivial-Fix beim nächsten render-qa-Paket.
- Fundort: `docs/adr/` ADR-007 und Studio-Specs 2026-09-30. Beobachtung: beschreiben noch die Vordergrund-Regel, die R868 (V2) ersetzt. Ursprung: RETRO-REL-30-UMSETZUNG. Einschätzung: ADR-Nachtrag mit Verweis auf R868.

## 2026-10-25 · REL-31: sed-Backups beim Konfliktlösen (mittel)

- Fundort: `.worktrees/integrate`, Merge-Kette REL-31. Beobachtung: BSD-`sed -i` ohne leeres Suffix legte `docs/ideen.md-e` mit Konfliktmarkern an, `git add -A` committete sie; `make push-check` brach bei `conflicts` ab. Ursprung: R877. Einschätzung: in Integrator-/Production-Persona «gezielt stagen, `make conflicts` vor jedem Merge-Commit» aufnehmen; `.gitignore` für `*-e` prüfen.

## 2026-10-25 · Rückkanal: Arbeiter-SendMessage an Rollennamen kommt nicht an (mittel)

- Fundort: Briefings von `lead-production`, `lead-design` (IDEEN-17). Beobachtung: Arbeiter schickten an «lead-production»/«lead-design» → «not reachable»; Berichte kamen nur als Benachrichtigung. Ursache: L0 hatte den Leads ihre agentId nicht genannt (R856). Ursprung: R879. Einschätzung: Start-Routine/Persona L0 um festen Schritt «Adresse senden» ergänzen.

## 2026-10-25 · HAUSHALT-03: über 150 Worktrees ungemessen (niedrig)

- Fundort: `.worktrees/`. Beobachtung: > 150 Worktrees, viele gemergt; `aufraeumen.json` misst sie nicht. Ursprung: HAUSHALT-03 (R876). Einschätzung: Schwelle und Trockenlauf «gemergte Worktrees» in `aufraeumen.py`, Entfernen nur ohne `--force` per Ruling.
