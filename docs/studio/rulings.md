# Rulings

Dauerhafter Ledger aller Studio-Entscheide (R3). Der superpowers-Ledger unter `.superpowers/sdd/`
ist gitignored und wird nach jedem Plan gelöscht; was dort entschieden wurde, überträgt der
Tech-Lead beim Abschluss hierher.

**Format** (Vorlage [templates/ruling.md](templates/ruling.md)):

```text
Ruling: <Entscheid in 1–3 Sätzen> — <warum> — <Kosten bei Irrtum> — <Pfad zu Bericht, Plan oder Retro>
```

Richtwert **≤ 60 Wörter**; Listen aus Gate-Berichten, Planpflege, Messwerte und Zeitabläufe stehen
im verwiesenen Dokument, nicht im Ruling. Abnahmen ohne Alternative nur per `log.py result`, kein
Ruling (R129). Darunter Datum, Entscheider, Anlass und ggf. ADR-Link. Neueste Einträge **unten**.
Einträge werden nicht gelöscht; ein überholter Entscheid bekommt ein neues Ruling, das ihn ablöst
(„löst R… ab").

---

R1–R600 stehen wörtlich in [rulings-archiv.md](rulings-archiv.md) (R129, R682); für Suchen immer `rulings*.md` verwenden.

## R601 · 2026-10-13 · Gate Merge DOC-ARCHIV: OK

Ruling: Bericht lead-production, `docs/archiv` @ `2f9f9450` (main bis `0a19ad53` gemergt, Konflikte README/`ideen.md` durch den
Eigentümer gelöst, Änderungen von A/B/I-047 übernommen), `make docs-check` Exit 0. README 59,5 → 28,3 KB, `docs/ideen.md` 80,0 →
27,9 KB, Archiv 52,9 KB, `docs/spielwerte.md` 35,3 KB (Denkmal-Abschnitt zusätzlich wortgleich verschoben), 88 Ideen erhalten.
Entscheid **Gate Merge OK**; `production-integrator` merged lokal (nur Doku: `make docs-check`, `make conflicts`, `make studio-test`
Exit 0), kein Push. Fährt mit REL-21; der Release-Check (R600) nimmt die README-Verlagerung per Delta mit.

Regelbezug: gates.md Gate Merge, R599, R600, E-057 · Kosten bei Irrtum: ein toter Verweis.

Entscheider: L0 · Anlass: Bericht lead-production DOC-ARCHIV · ADR: —

## R602 · 2026-10-13 · Gate Merge TOOL-BUENDEL-11: OK mit Prozess-Vermerk

Ruling: Bericht lead-tech, `tool/b11` @ `940707d3`, Final-Review sonnet OK, `make check` Exit 0, `studio-test`/`studio-lint`/`tsc`/
`lint`/`zeittests`/`conflicts`/`docs-check` Exit 0. T01 Lastprotokoll (`loadsnap.py`, Event `load_abort`), T02 `test_hook`-Isolation,
T03 Szenarien (a) Holz 10, (c) Lager-Startwerte, (d) `m13e2-zukunftsstand`, T04 arc42 `buyPct`, T05 `make zeitreserve-gate`.
Entscheid **Gate Merge OK**, lokaler Merge durch `production-integrator` nach DOC-ARCHIV, kein Push. Entwürfe: (1) Einzeiler
gates.md → `studio-coach` (Ende-Routine, zusammen mit R598 V1); (2) Spec AK-M14E1-36 «Holz 20» → «Holz 10» als Beipack beim
nächsten Design-Durchgang (Beobachtung); (3) alte Fundstellen `m13e2-v13` in Plänen bleiben (historisch). **Prozess-Vermerk an die
Ende-Retro:** Controller machte T02/T04 selbst und ersetzte die Task-Reviews durch ein gemeinsames Review — gegen Briefing («Prüfschritte
nicht streichen», L1 macht keine Inhaltsarbeit). `/tmp/x` ist kein leeres Verzeichnis, sondern eine Agenten-Ausgabedatei (52 KB, 17:45) — bleibt liegen, harmlos.

Regelbezug: gates.md Gate Merge, R581, R588, R595, R598 · Kosten bei Irrtum: ein Fehler in Werkzeug-Code fällt erst im nächsten push-check auf.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-11 · ADR: —

## R603 · 2026-10-13 · Release-Check REL-21: OK mit Doku-Auflage

Ruling: Bericht lead-qa REL-21 am Kandidaten `0a19ad53`: Playtest OK (85 Screenshots unter `.studio/qa/REL-21/`, 0 Konsolenfehler,
v13 → v14 lädt, v999/kaputtes JSON abgewiesen), Opus-Review BEDENKEN nur Doku (arc42 fünf Modulzeilen veraltet, README Z. 314
Zifferntasten-Satz falsch platziert, Z. 164 Esc/Rechtsklick), strenge Zeitreserve-Nachmessung (Startlast 2,7) 0 ohne Reserve.
Entscheid **Release-Check OK mit Auflage**: Doku-Fix (arc42-Modulzeilen, README-Stellen) als `docs:`-Commit durch lead-tech **nach**
dem Merge von DOC-ARCHIV (README neu gegliedert), Delta-Review sonnet zusammen mit TOOL-BUENDEL-11 und DOC-ARCHIV vor dem Push in der
nächsten Session. Esc/Rechtsklick und Kleinbefunde → `docs/beobachtungen.md`. Reihenfolge jetzt: Integrator merged DOC-ARCHIV (R601)
und TOOL-BUENDEL-11 (R602) lokal.

Regelbezug: gates.md Gate Merge Release, R600, R601, R602 · Kosten bei Irrtum: veraltete Modulzeilen bis zum Doku-Fix.

Entscheider: L0 · Anlass: Bericht lead-qa REL-21 · ADR: —

## R604 · 2026-10-13 · TOOL-BUENDEL-11 Konflikt arc42; Doku-Fix REL-21 auf derselben Branch; IDEEN-09

Ruling: Bericht production-integrator: DOC-ARCHIV gemergt (`323fd29a`, docs-check/conflicts/studio-test Exit 0); `tool/b11` Konflikt
in `docs/arc42.md` (Absätze «Save v14 (I-047)» und «`buyPct` ab v12» an derselben Stelle), Merge abgebrochen, main sauber.
Entscheide: (1) lead-tech (TOOL-BUENDEL-11, 2 freie Starts) merged main in `tool/b11` (kein Rebase), behält beide Absätze in
Versionsreihenfolge (v12 `buyPct` vor v13/v14) und erledigt auf derselben Branch die **Doku-Auflage R603** (arc42-Modulzeilen
`problems.ts` fünf Klassen, `hotkeys.ts`, `input.ts`, `hud.ts`, `upkeepRank.ts`; README Zifferntasten-Satz und Esc/Rechtsklick-Zeile im
neu gegliederten README); Delta-Review sonnet; `make check` Exit 0; neuer Kopf-Hash an L0 (Nachtrag zu R602, R565 V2). (2) Kein
neuer Vorfall für die Ad-hoc-Retro: Doku-Konflikt ist der Normalfall der Dateimatrix (gates.md), gemeldet statt gelöst — korrekt.
(3) **Ideen-Runde IDEEN-09** startet (R580, R597: nach DOC-ARCHIV): lead-design mit 3 Scouts, Budget 4 Starts / P3, Pool `docs/ideen.md`
mit Archivregel R599.

Regelbezug: gates.md Konflikte, R445, R580, R599, R602, R603 · Kosten bei Irrtum: ein weiterer Merge-Anlauf.

Entscheider: L0 · Anlass: Bericht production-integrator REL-21 (failed) · ADR: —

## R605 · 2026-10-13 · Nachtrag R602/R603: TOOL-BUENDEL-11 @ `fe4eb787` OK

Ruling: Bericht lead-tech: main `2917d77c` per Merge `907b8f34` in `tool/b11`, arc42-Konflikt gelöst (v12 `buyPct` vor v14 I-047),
Doku-Auflage R603 durch Arbeiter (`fe4eb787`: arc42-Modulzeilen, README Zifferntasten und Esc/Rechtsklick, README 28,5 KB),
Delta-Review sonnet OK, `make docs-check`/`make check` Exit 0. Neuer geprüfter Hash **`fe4eb787`** ersetzt `940707d3` aus R602
(R565 V2). Entscheid: Merge lokal durch `production-integrator`, `make check` Exit 0; danach ist REL-21 vollständig (A, B, I-047,
DOC-ARCHIV, TOOL-BUENDEL-11, Doku-Fix R603). Push in der nächsten Session per `make push-check`. Die Esc/Rechtsklick-Beobachtung bleibt
als Designfrage offen (README beschreibt jetzt den Ist-Zustand).

Regelbezug: R565 V2, R602, R603, R604 · Kosten bei Irrtum: —

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-11 · ADR: —

## R606 · 2026-10-13 · Runden-Ruling IDEEN-09

Ruling: Bericht lead-design IDEEN-09, `docs/ideen-09` @ `91e65e2f`: 13 neue Ideen I-088…I-100, Pool 15/40, `docs/ideen.md` 28,6 KB,
keine §5.3-Frage. Entscheide wie empfohlen: (1) **einplanen** I-092 Inselmarkt-Vorliebe (zuerst Kurzdesign mit Werterechnung durch
lead-design, Budget 2 Starts; Rechnung muss zeigen, dass sich nur Konsumgüter spürbar lohnen), **UI-HAEPPCHEN-C** = I-088
Marktvergleich auf der Stammkunden-Angebotskarte + I-090 Sprung Vertragskarte → Erzeuger (Plan durch lead-tech, Stufe leicht,
Kombiniertes Gate), danach I-100 «Neu»-Zähler am Ereignis-Log (ersetzt I-058). (2) Beipack zum nächsten UI-Aufräum-Sammelpaket:
I-089, I-098, I-099 sowie die Kleinbefunde aus REL-21. (3) **I-098 entschieden:** Rechtsklick im Linienzug beendet zuerst nur den
Zug, der zweite Rechtsklick legt das Werkzeug ab — wie Esc; README wird mit dem Paket angeglichen. (4) parken I-091, I-093, I-094,
I-095, I-097; verwerfen I-096. (5) Bereinigung nach R599 bestätigt (IDEEN-08-Rangliste und zehn geparkte Ideen ins Archiv). Merge
`docs/ideen-09` lokal durch den Integrator. UI-HAEPPCHEN-C plant gegen main mit I-047 (lokal), Umsetzung nach dem Push REL-21
oder gestapelt.

Regelbezug: docs/ideen.md Ablauf, R445, R566, R599, R603, Verfassung §5.3 · Kosten bei Irrtum: eine geparkte Idee später neu bewerten.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-09 · ADR: —

## R607 · 2026-10-13 · Kombiniertes Gate UI-HAEPPCHEN-C: OK mit Auflagen

Ruling: Kurzplan `plan/ui-haeppchen-c` @ `7d95b792` (lead-tech), Urteil lead-qa BEDENKEN (1 mittel, 5 niedrig). L0: Ownership
(`src/ui/order.ts`, neue `src/ui/contractJump.ts`, Tests), keine Save-/Wertänderung, Abhängigkeit I-047 (lokal auf main) — erfüllt.
Entscheid **OK**, Budget 10 Starts / P1, AK-Präfix **AK-HC-** bestätigt. Entscheide aus dem Plan: (1) Wortlaut-Delta zu I-047 B.4
bewusst (Spec-Vermerk, `order.test.ts` mit T01 nachziehen); (2) «Markt ≈» = Preis der ersten Einheit; (3) Auftragsprämie entfällt
(I-047 B.3). Auflagen vor T01 durch den Controller ohne Zweitprüfung: QA (1) Messwelt Spätspiel ≥ 1000 Gebäude, Grenze 1 ms je
Frame, Rückfall Cache je `world.tick`/Insel/Gut; (2) Wortlaut für N = 0 in AK-HC-01 mit Test; (3) Cursor-Reset bei Vertragsende/
-wechsel, Inselwechsel-Verhalten als Test; (4) stillgelegte Erzeuger werden angesprungen (Test), `runContractJump` bei
`contract === null` tut nichts; (5) «kein Rot möglich, Beleg = …» markieren, Signatur konkret; (6) `noProducerMessage` mit «auf
<Insel>». Branch `feat/ui-haeppchen-c` ab `plan/ui-haeppchen-c`, main (`67661df1`+) per Merge holen.

Regelbezug: gates.md Kombiniertes Gate, R589, R606 · Kosten bei Irrtum: eine Fix-Runde für die Rechenzeit.

Entscheider: L0 · Anlass: Berichte lead-tech plan-UI-HAEPPCHEN-C, lead-qa gate-UI-HAEPPCHEN-C · ADR: —

## R608 · 2026-10-13 · Gate Brainstorming I-092 Inselmarkt-Vorliebe: OK Option 2; Gate Spec starten

Ruling: Bericht lead-design design-I-092, `design/i092` @ `44e439fb` (Spec 21 KB + Anhang Werte), Selbstprüfung OK. L0-Prüfung: stärkt
die Säule Handel (Ortswahl beim Verkauf), Spielerzweck in einem Satz («Weidenau zahlt Glas +30 %»), Scope ein Paket, nur Mechanik,
O2 einfacher als O1/O3. Entscheide: (1) **Option 2** — je Fremdinsel genau ein Konsumgut mit `PREFER_PCT` 130 (Möweninsel Stoff,
Weidenau Glas, Felsbucht Rum), kein Save-Wechsel, Baseline bitgleich. (2) **O-1: Boom und Inselvorliebe stapeln nicht, das Höhere
gilt** (sonst Kauf-Verkauf-Schleife beim Rum). (3) **O-2:** Obergrenze 17–24 % von (b) nur bei extremem Spiel hingenommen, keine
strengere Sättigung. Drei Rechenbefunde (Markterholung 60/min, Schiffsunterhalt 90/min, Spielwerte-Wortlaut) → `docs/beobachtungen.md`.
Gate Spec: lead-tech und lead-qa (opus) parallel.

Regelbezug: gates.md Gate Brainstorming, Gate Spec, R606 · Kosten bei Irrtum: ein Faktor im Erlös, kein Save.

Entscheider: L0 · Anlass: Bericht lead-design design-I-092 · ADR: —

## R609 · 2026-10-13 · Gate Spec I-092 Inselmarkt-Vorliebe: OK mit Auflagen; Plan Stufe leicht

Ruling: Urteile lead-tech BEDENKEN (1 mittel, 3 niedrig) und lead-qa BEDENKEN (1 hoch, 1 mittel, 5 niedrig) zu `design/i092` @
`44e439fb`. Entscheid **Gate Spec OK mit Auflagen**; AK-Präfix **AK-IM-01…14** bestätigt (R417). Spec-Nachtrag durch lead-design
ohne neues Gate (Fortsetzung des Starts, kein neues Budget): QA (1) AK-IM-14 im pausierten Spiel, plus zwei Schritte (Boom auf Glas
«statt Vorliebe», Wechsel nach Felsbucht); QA (2) B.5 «analytisch, Rückfall `PREFER_PCT` per Ruling senken, ein Def-Wert, kein
Save»; QA (4) AK-IM-03 per Schiff entladenem Glas; QA (5) Kontor/Glas erst nach dem Laden der Fixture; Tech (1) AK-IM-10 auf
`save-v12-felsbucht.json` mit 1 Rum ins Felsbucht-Lager (+23 Geld). Auflagen an den Plan: QA (3) `buyFactorPct` aus den Defs statt
80, Gegenprobe Edikt Handel + Boom; Tech (2) `sellTexts` exportieren; Tech (3) `prefersGood` in `sim/trade.ts` mit Absicherung
unbekannter Insel; Tech (4) Kettenrekursion mit besuchter Menge. **Prozessstufe leicht** (S–M, kein Save, kein ADR): Kurzplan durch
lead-tech (sonnet), Kombiniertes Gate. **Merge-Risiko Erweiterung 1:** neues Pflichtfeld `prefers` in `IslandDef` — der Plan nennt
es; wer später merged, ergänzt neue Inseln (Hinweis an die Nutzer-Session beim Merge jener Branch).

Regelbezug: gates.md Gate Spec, Kombiniertes Gate, R417, R553, R608 · Kosten bei Irrtum: ein Test mehr in der Umsetzung.

Entscheider: L0 · Anlass: Urteile lead-tech und lead-qa gate-I-092 · ADR: —

## R610 · 2026-10-13 · Kombiniertes Gate I092: OK mit Auflagen

Ruling: Kurzplan `plan/i092` @ `39859bbc`, Urteil lead-qa BEDENKEN (3 mittel, 3 niedrig), AK-Abdeckung vollständig. L0: Ownership
disjunkt zu UI-HAEPPCHEN-C, kein Save, Abhängigkeiten erfüllt. Entscheid **OK**, Budget **7 Starts / P1** (Review T02 auf opus über die
ganze Branch ersetzt den Final-Review, QA (6)). Auflagen vor T01 durch den Controller ohne Zweitprüfung: (1) AK-IM-03 nur per Route
über `tickShips` entladen, «oder direkt gesetzt» streichen; (2) **Weltkarten-Hover zeigt die Markt-Zeile auch** (Entscheid), T02
erhält `tests/ui/islandCard.test.ts` mit begründet angepassten Erwartungen; (3) Branch `feat/i092` ab `plan/i092`, vorher
`design/i092` @ `f5dec181` und main per Merge holen, Rückfall-Satz streichen; (4) `tests/ui/trade.test.ts` in den Grün-Lauf T02;
(5) Beleg AK-IM-10 = leerer Diff `save.ts`/`types.ts`.

Regelbezug: gates.md Kombiniertes Gate, R609 · Kosten bei Irrtum: eine Textzeile im Hover.

Entscheider: L0 · Anlass: Berichte lead-tech plan-I092, lead-qa gate-plan-I092 · ADR: —

## R611 · 2026-10-13 · UI-HAEPPCHEN-C: Nacharbeit Rechenzeit vor Gate Merge

Ruling: Bericht lead-tech, `feat/ui-haeppchen-c` @ `1378c764`, Reviews/Playtests OK, Final-Review opus BEDENKEN → Fix → Delta OK,
`make check` Exit 0. **Auflage R607 (1) nicht erfüllt:** der erste Aufruf je Tick kostet bei 1200 Gebäuden ≈ 15–18 ms (Ziel ≤ 1 ms),
weil `goodsBalance` die ganze Bilanz inkl. Versorgung rechnet — bei offenem Angebot ein Ruckler je Tick im Spätspiel. Entscheid
**Nacharbeit vor dem Gate Merge** (2 freie Starts): «Erzeugung x / min» nur aus den Erzeugern des einen Vertragsguts berechnen
(Betriebe mit diesem Output × Rate, Zustand/Trait berücksichtigt wie in `goodsBalance`, ohne Verbrauch/Versorgung), Gleichheit mit
dem Produktionsanteil von `goodsBalance` per Test auf ≥ 3 Welten; Messung erster Aufruf bei ≥ 1000 Gebäuden ≤ 1 ms (Median); Cache je
Tick darf bleiben. Zusätzlich in Ownership: Spec I-047 Z. 237 Angebots-Wortlaut nachführen, `docs/ideen.md` I-088/I-090 auf `live`
(beim Merge, R599: dann ins Archiv). Delta-Review opus, `make check` Exit 0.

Regelbezug: R593, R607, gates.md Gate Merge · Kosten bei Irrtum: ein Ruckler je Tick bei offenem Angebot im Spätspiel.

Entscheider: L0 · Anlass: Schlussbericht lead-tech UI-HAEPPCHEN-C · ADR: —

## R612 · 2026-10-13 · Gate Merge UI-HAEPPCHEN-C: OK

Ruling: Bericht lead-tech Nacharbeit R611, `feat/ui-haeppchen-c` @ `116139a4`: Erzeugung aus `goodProductionPer100` (nur Erzeuger des
Vertragsguts, gleiche Zählregel), erster Aufruf je Tick bei 1200 Gebäuden 15,05 → 0,026 ms (Median), Gleichheitstest gegen
`goodsBalance().produced` auf drei Welten, Delta-Review opus OK, `make check` Exit 0, `src/sim/` unverändert, Spec-Wortlaut I-047 und
Ideen-Status (live, Archiv) nachgeführt. Entscheid **Gate Merge OK**; lokaler Merge durch `production-integrator`, `make check`
Exit 0, kein Push (REL-22). Restpunkte (Haus-Zweig im Test, doppelte Zählregel `flow.ts`/`production.ts` → gemeinsame Funktion,
Archiv-Trenner, Lücken in der Rangliste) → UI-Aufräum-Sammelpaket (R606).

Regelbezug: gates.md Gate Merge, R607, R611 · Kosten bei Irrtum: zwei Zählregeln laufen auseinander (Gleichheitstest fängt das).

Entscheider: L0 · Anlass: Bericht lead-tech UI-HAEPPCHEN-C (Nacharbeit) · ADR: —

## R613 · 2026-10-13 · Gate Merge I092 Inselmarkt-Vorliebe: OK

Ruling: Bericht lead-tech I092, `feat/i092` @ `cb1c2436` (enthält `design/i092` @ `f5dec181` und main), T01/T02 mit Rot-Belegen,
Review T01 BEDENKEN → behoben, Review opus über die Branch ZURÜCK (`seaMapView.test.ts` rot) → behoben → Delta OK, Playtest AK-IM-14
pausiert OK, `make check` Exit 0, `make zeitreserve-gate` Exit 0, Diff `save.ts`/`types.ts`/`balance.test.ts`/`controller.ts` leer.
Entscheide: (1) **Gate Merge OK**; lokaler Merge durch `production-integrator`, `make check` Exit 0, kein Push (REL-22).
(2) Ownership-Erweiterung nachträglich bestätigt (`tests/ui/seaMapView.test.ts` + Doc-Kommentar `src/ui/seaMapView.ts` wegen R610 (2),
`tests/sim/islandTraits.test.ts` wegen Pflichtfeld `prefers`) — künftig vor der Änderung melden. (3) Zeit-Abnahme Basis vs. Branch
fehlt; ersetzt durch grünen `zeitreserve-gate` — als Vermerk an die Ende-Retro. (4) Badge-Verwechslung `prefer-*`/`badge--boom` und
toter README-Verweis «Seefahrt und Gewürz» → UI-Aufräum-Sammelpaket.

Regelbezug: gates.md Gate Merge, R609, R610 · Kosten bei Irrtum: ein Hotfix im Inselmarkt vor REL-22.

Entscheider: L0 · Anlass: Schlussbericht lead-tech I092 · ADR: —

## R614 · 2026-10-13 · Handbuch 1.54 angenommen; E-060 behalten, E-064 laufend

Ruling: Bericht studio-coach HANDBUCH-1.54 (`7c73247d`): gates.md (Release-Fenster ≤ 2 Test-Arbeiter, `make zeitreserve-gate`,
Lastartefakt nur nach Messung, push-bereit = `LOAD_WAIT`), STUDIO.md 1.54 (Integrator Exit-1-Regel, Stash-Sperre, Stand-Warnung),
briefing.md (Integrator-Pflichtzeile), Personas lead-design 1.12 / design-idea-scout 1.1 (Archivregel), lernen.md (40 Zeilen),
CHANGELOG; `make studio-test` 847 grün, `make docs-check` Exit 0. Entscheide: (1) **Handbuch 1.54 angenommen**. (2) **E-060
behalten** (Budget-Hook `deny`; 0 Fehlblocks, korrekte Blocks ohne Freigabe; Rückfall `BUDGET_MODE = "warn"`). (3) **E-064 laufend**
ab 2026-10-13 (R579); E-065 bleibt vorgeschlagen bis ein Platz frei ist (die Warnung ist als Werkzeug schon aktiv). (4) Die
Experiment-Kopfzeile «R588, Vorschlag Coach» gilt als R614.

Regelbezug: R429, R579, R588, R598, R599 · Kosten bei Irrtum: eine Handbuchzeile zurücknehmen.

Entscheider: L0 · Anlass: Bericht studio-coach HANDBUCH-1.54 · ADR: —

## R615 · 2026-10-13 · Kurz-Retro Session 6584aaa4: V2 TOOL-BUENDEL-12, V1/V3 als wartende Experimente

Ruling: Retro `retros/2026-10-13-session-6584aaa4-ende.md` (`84b75292`). Entscheide: **V2** Cache-Write-Aufteilung in `metrics.py`
(Neuschreibung nach Pause vs. übriges Wachstum, Info-Zeile) → **TOOL-BUENDEL-12** (Messauftrag, Frist: Retro der nächsten Session).
**V1** «Folgeinstanz statt Fortsetzung bei lead-tech» (Pflicht-Hebel Cache-Write) und **V3** «drei Pflichtzeilen im lead-tech-Bericht»
(Selbstarbeit, Ownership-Erweiterung mit Meldezeitpunkt, Soll/Ist der Gate-Auflage) als **E-066/E-067 vorgeschlagen**, Reihenfolge
E-066 vor E-065 vor E-067; Start, sobald E-062 oder E-063 bewertet ist (nächste Ende-Retro). V3 gilt bis dahin als Briefing-Satz für
Controller-Briefings von L0 (ohne Experiment-Messung).

Regelbezug: R316, R429, R614 · Kosten bei Irrtum: ein ungenutzter Experimentplatz eine Session länger.

Entscheider: L0 · Anlass: Bericht studio-coach RETRO-SESSION-6584aaa4 · ADR: —

## R616 · 2026-10-14 · Session-Start: REL-21 = main mit Delta-Release-Check; Plätze füllen

Ruling: (1) **REL-21 umfasst den ganzen lokalen main** (I-047, UI-HAEPPCHEN-A/B/C, I092, DOC-ARCHIV, TOOL-BUENDEL-11, IDEEN-09):
fünf Spiel-Häppchen in einem Push als Ausnahme vom Häppchen-Deckel 4 (gates.md), weil C und I092 Final-Review und Playtest OK
haben und ein zweiter Release-Zyklus mehr kostet als der Delta-Check. Weg: `lead-qa` (sonnet, Gate-Urteil) baut den Delta-Check:
Integrator aktualisiert `.worktrees/integrate` auf main (Merge, kein Reset), `make check`; Playtest C + I092 am Kandidaten;
Opus-Review `67661df1..main`; `make zeitreserve-gate`; Bericht an L0 zum Gate. Push erst nach L0-Gate-Ruling (R335, ein Push).
(2) N-100 gilt als erledigt für REL-20 (Push lief); für REL-21 kein Dropbox-Vorbehalt, Integrator meldet Sync-Störungen.
(3) Plätze nach R475 füllen, im Release-Fenster ≤ 2 weitere Test-Arbeiter (R588 V1): **UI-AUFRAEUM-3** Plan (Sammelpaket aus
state.md Punkt 2, Stufe leicht, lead-tech sonnet), **I-100** Kurzdesign + Kurzplan (Stufe leicht, lead-design sonnet),
**TOOL-BUENDEL-12** Cache-Write-Aufteilung (R615 V2, lead-tech sonnet, Werkzeug). Umsetzung von UI-AUFRAEUM-3 und I-100 erst
nach dem Push REL-21 (Release-Fenster, Konfliktrisiko in `src/ui/`).

Regelbezug: gates.md Release-Check, R335, R475, R588 V1, R615 · Kosten bei Irrtum: ein Hotfix-Release, falls das Delta-Review
einen Fehler übersieht.

Entscheider: L0 · Anlass: Session-Start, state.md «Fortsetzung» Punkte 1–4 · ADR: —

## R617 · 2026-10-14 · Gate UI-AUFRAEUM-3 (kombiniert, leicht): BEDENKEN → Nacharbeit, dann frei

Ruling: Urteil lead-qa BEDENKEN zum Plan `plan/ui-aufraeum-3` @ `be1be84f`. Nacharbeit durch eine Folgeinstanz lead-tech
(Restbudget plan-ui-aufraeum-3, ohne Zweitprüfung): (1) T05 Determinismus-Test gleicher Seed, N Ticks, Save/Load-Roundtrip
als JSON-Vergleich; Snapshot-Welt mit stillgelegten und nicht angebundenen Betrieben; (2) Playtest-Schrittliste T01–T04
(Rechtsklick im Zug, Badge neben Boom, Rangliste zwei Inseln bei 1280×720 ohne Überlauf, Kartenstapel inkl. Krise aus→an);
(3) R392-Abnahme mit `zeit-vor.json` und `zeit-nach.json` im Bericht; (4) Zugmenge für Rechtsklick (Abriss, Weide) als
Testfall in T01 festlegen. L0-Prüffragen: ein Owner je Datei, ein Worktree, ein Strang seriell (style.css) — OK; Auftrag bleibt
leicht (T05 reine Umformung in `src/sim/flow.ts` ohne Save/Spielwert, bitgleich belegt). **Budget 21 Starts / Parallelität 1**
wie beantragt. Wortlaut-Änderungen «Krisen: aus» ohne Karte und gestaffelter Rechtsklick gelten nach R606 (3) als angenommen.
Umsetzung erst nach Push REL-21 (Release-Fenster R588 V1).

Regelbezug: gates.md Kombiniertes Gate, R392, R606, R616 · Kosten bei Irrtum: ein Fix-Task in der Umsetzung.

Entscheider: L0 · Anlass: Bericht lead-qa gate-ui-aufraeum-3 · ADR: —

## R618 · 2026-10-14 · Gate Merge TOOL-BUENDEL-12: OK, Merge nach Push REL-21

Ruling: `tool/b12` @ `eab93fc9` (Cache-Write-Aufteilung in `tools/studio/efficiency.py`, 5 neue Tests mit Rot-Beleg,
`make studio-test` 852 grün, Task-Review sonnet OK, Echtlauf: Cache-Write 5 min 28,2 %, davon nach Pause 13,3 %, übriges
Wachstum 15,0 %) → **OK**. Merge durch lead-production/Integrator erst nach dem Push REL-21, damit main während des
Delta-Checks stabil bleibt. R615 V2 (Messauftrag) gilt mit der Info-Zeile als erfüllt; die Ende-Retro bewertet V1 (E-066) gegen
den Pausenanteil von lead-tech. Prozessbefund an die Retro: lead-tech startete einen Warte-Agenten (haiku) und drei
`sleep`-Hintergrundbefehle ohne Nutzen (Verstoss gegen «kein Polling», Handbuch 1.39).

Regelbezug: gates.md Gate Merge (Werkzeug), R615 V2, R616 · Kosten bei Irrtum: eine Info-Zeile zurücknehmen.

Entscheider: L0 · Anlass: Bericht lead-tech tool-buendel-12 · ADR: —

## R619 · 2026-10-14 · Gate I-100 (kombiniert, leicht): BEDENKEN, Auflagen ins Umsetzungs-Briefing

Ruling: Kurzdesign + Plan `design/i100` @ `d05e67d1` → BEDENKEN angenommen, keine Plan-Nacharbeit: die Auflagen gehen als
Pflichtzeilen ins Controller-Briefing (billiger als eine eigene Plan-Instanz): (1) T02 klärt vorab die DOM-Fähigkeit der
Vitest-Umgebung; ohne DOM-Test prüft T03 ausdrücklich den Key-Cache-Fall (Brand erhöht den Zähler bei geschlossener Box ohne
Klick); (2) T03 belegt Reset bei Laden und bei «Neue Insel» getrennt, jeweils mit Zähler ≥ 1 vorher; (3) R392-Zeitmessung vor
T01 (vorher/nachher im Bericht); (4) Merge nach UI-AUFRAEUM-3, `git merge main` vor T04, Konfliktprüfung `style.css`, README,
arc42. Kurzdesign gilt als angenommen (Zähler nur für Meldungs-Einträge, nur eingeklappt, Reset beim Aufklappen/Laden/Neue
Insel, kein Save). Budget 10 Starts / Parallelität 1 bei Umsetzungsstart nach Push REL-21.

Regelbezug: gates.md Kombiniertes Gate, R392, R606, R617 · Kosten bei Irrtum: ein Fix-Task bei T02/T03.

Entscheider: L0 · Anlass: Bericht lead-qa gate-i-100 · ADR: —

## R620 · 2026-10-14 · Freier Platz: BEOB-AUSWERTUNG-14

Ruling: 5 Beobachtungen seit 2026-10-13 (Start-Hinweis). Freier Platz nach R475 an `lead-production` (Skill
`beobachtungen-auswerten`), Budget 1 Start/P1, Worktree `.worktrees/beob-14`; Einträge, die UI-AUFRAEUM-3 (R617) oder I-100
(R619) schon abdecken, werden dorthin verwiesen statt neu eingeplant. Nur Doku, kein Push (geht mit dem nächsten Release).

Regelbezug: R475, R580, R287 · Kosten bei Irrtum: ein Eintrag wird später erneut geöffnet.

Entscheider: L0 · Anlass: freie Kapazität im Release-Fenster (keine Test-Arbeiter) · ADR: —

## R621 · 2026-10-14 · Gate Merge BEOB-AUSWERTUNG-14 OK; Auslegungen UI-AUFRAEUM-3

Ruling: (1) `docs/beob-14` @ `402ac5db` (17 Einträge: 5 eingeplant, 2 Doku-Beipack, 10 abgehakt mit Trigger, Marke 2026-10-14,
`make docs-check` Exit 0) → **Gate Merge OK** (nur Doku), Merge nach Push REL-21. Der Risiko-Hinweis «Task-Dateien veraltet» trifft
nicht zu: `plan/ui-aufraeum-3` @ `0ba2bb21` hat T01–T07 aktuell (L0 geprüft). Die zwei Doku-Beipacks («Preise global» in
`docs/spielwerte.md`, toter README-Verweis Zeile 74) gehen in UI-AUFRAEUM-3 T07. (2) **Rechtsklick-Staffelung nur im
Linienzug** (Plan-Nacharbeit `0ba2bb21`): angenommen; Abriss- und Weide-/Strassen-Strich bleiben bei `cancel`, weil das
Verhalten nach bereits gebauten Kacheln nicht abgesichert ist. Präzisiert R617 (4). (3) **Rangliste I-089 enthält die
Heimatinsel** mit ihrem vollen Unterhalt (alle Betriebe der Insel, nicht nur das Kontor); geht als Pflichtzeile ins T03-Briefing.

Regelbezug: gates.md Gate Merge, R606, R617, R620 · Kosten bei Irrtum: eine Zeile der Rangliste mehr oder weniger, Folgeänderung in T03.

Entscheider: L0 · Anlass: Berichte lead-production BEOB-14, lead-tech Nacharbeit plan-ui-aufraeum-3 · ADR: —

## R622 · 2026-10-14 · Release-Check REL-21: BEDENKEN → Hotfix Marktpreis Fremdinsel vor dem Push

Ruling: Bericht lead-qa gate-rel-21 (Kandidat `c3a93534`, `make check` Exit 0 mit 3904 Tests, `check-ci-perf` Exit 0, Playtest A–F
bestanden, Opus-Review BEDENKEN). Entscheide: (1) **Befund 1 (hoch) wird vor dem Push behoben**: HOTFIX-REL21-PREIS durch lead-tech
(Controller, Umsetzer tech-ui-engineer, Branch `hotfix/rel21-preis` von main): `src/ui/order.ts:81` übergibt die Vertragsinsel an
`sellPrice`, Test «Glas auf Weidenau → 26» mit Rot-Beleg, Spec-Korrektur AK-HC-01 und I092-Spec Z. 25; Beipack Befund 3
(`docs/arc42.md` für I092 nachführen: `sellPrice(…, island)`, `prefersGood`, `PREFER_PCT`, Marke `prefer-*`). Task-Review sonnet,
danach Delta-Check (Integrator: Merge in `.worktrees/integrate`, `make check`, `make zeitreserve-gate`) und Gate L0. Kein neuer
Playtest-Vollauf: ein Browser-Punkt (Karte Weidenau zeigt 26) im Delta-Check. Budget 4 Starts/P1. (2) **Zeitreserve-Gate Exit 2
bei ruhiger Last** («Hauptmessung fehlt?») wird als TOOL-HOTFIX-ZR untersucht (lead-tech, systematisches Debugging, Budget 3/P1);
bis zur Klärung gilt ein Exit 2 bei Last ≤ 4 nicht als Push-Freigabe. (3) Befunde 2 (Cache im pausierten Spiel) und 4 (Testname
`save-v13.test.ts:253`, Meldung «Noch kein Erzeuger für Glas auf Heimat») gehen als Beipack in UI-AUFRAEUM-3 (T06). Release-
Fenster: zwei Test-Arbeiter (Hotfix, Werkzeug) gemäss R588 V1.

Regelbezug: gates.md Release-Check, R588 V1, R598, R616 · Kosten bei Irrtum: Push REL-21 verschiebt sich um den Hotfix.

Entscheider: L0 · Anlass: Bericht lead-qa gate-rel-21 · ADR: —

## R623 · 2026-10-14 · Gate Merge HOTFIX-REL21-PREIS und TOOL-HOTFIX-ZR OK; Delta-Check REL-21

Ruling: (1) `hotfix/rel21-preis` @ `6260d347` (Rot-Beleg 20 → 26, Task-Review OK, tsc/lint/zeittests/conflicts/docs-check Exit 0,
Testzeit 2,5 → 1,9 s) → **OK**. (2) `tool/zr-hotfix` @ `91992546` (Ursache belegt: `pushcheck.Gate.gate()` las eine veraltete
`zeitreserve-marked.json`; Fix berechnet sie per `check.ts --push --marked` neu; zwei Tests mit Rot-Beleg, `make studio-test` 849
grün) → **OK**; der Echtlauf im eigenen Worktree läuft noch, der Lauf im Delta-Check gilt zugleich als Echtlauf. (3) Delta-Check
durch lead-qa (Restbudget gate-rel-21 + 2 Starts): Integrator merged beide Branches `--no-ff` nach main, bringt
`.worktrees/integrate` auf den neuen main, `make check`, `make check-ci-perf`, `make zeitreserve-gate`; ein Browser-Punkt
(Stammkunde-Karte Glas Weidenau zeigt 26). Danach Push-Gate L0. TOOL-BUENDEL-12 und BEOB-14 folgen erst nach dem Push.

Regelbezug: gates.md Gate Merge und Release-Check, R598, R622 · Kosten bei Irrtum: ein weiterer Delta-Check.

Entscheider: L0 · Anlass: Berichte lead-tech hotfix-rel21-preis und tool-hotfix-zr · ADR: —

## R624 · 2026-10-14 · Zeitreserve-Substanz vor REL-21 → TOOL-ZEITRESERVE-21

Ruling: Echtlauf `make zeitreserve-gate` mit Fix `91992546` (Hauptmessung Last 3,2, Nachmessung 2,4, 12 Dateien aus der aktuellen
Messung) meldet **Substanz** bei drei Bestandstests: `tests/render/trees-farn.test.ts` («L6 B2 Farn», 3699 ms × 4 > 50 % von
25000 ms), `tests/render/decorSea.test.ts` («L5-T1 Fernansicht», 5076 ms × 4 > 50 % von 40000 ms), `tests/sim/scenario-saves.test.ts`
(«Szenario-Saves», ≈ 2694 ms bei 5000 ms). Kein Lastartefakt (R585). Entscheid wie R593: Paket **TOOL-ZEITRESERVE-21** (lead-tech,
sonnet, 4 Starts/P1, Branch `tool/zeitreserve-21` ab main): je Test bevorzugt beschleunigen ohne Aussageverlust, sonst begründeter
Timeout nach E-043 (≥ 2 × lokale Zeit × 4); Zeiten vorher/nachher; kein `src/`; Task-Review. Danach Merge und `make zeitreserve-gate`
Exit 0 als Push-Bedingung REL-21. Der Werkzeug-Fix (R623 (2)) gilt mit diesem Echtlauf als belegt.

Regelbezug: R270, R585, R593, R598, E-043 · Kosten bei Irrtum: ein weiteres Werkzeug-Paket vor dem Push.

Entscheider: L0 · Anlass: Bericht lead-tech tool-hotfix-zr (Echtlauf) · ADR: —

## R625 · 2026-10-14 · Push-Gate REL-21: OK, Push `ca46eb73`

Ruling: Delta-Check lead-qa OK: Kandidat `ca46eb73` (main mit HOTFIX-REL21-PREIS und TOOL-HOTFIX-ZR), `make check` Exit 0,
`make check-ci-perf` Exit 0, `make zeitreserve-gate` **Exit 0** (Last 2,9, 3905 Tests), Browser: Stammkunde-Karte Weidenau Glas 26 =
Handel 26 (`.studio/qa/REL-21/delta2-*`). Die Substanz aus dem Werkzeug-Echtlauf (R624) trat im Gate nicht auf: die drei Tests liegen
an der Schwelle und schwanken; massgeblich ist das Gate (R598). Entscheide: (1) **Push REL-21** durch `production-integrator` aus
`.worktrees/integrate`: `git push origin ca46eb73:main` (geprüfter Hash, R429; die Doku-Commits danach gehen mit dem nächsten Push),
danach CI beobachten und `gh workflow run Pages --ref main` (der Remote-Kopf ist dann `ca46eb73`). (2) TOOL-ZEITRESERVE-21 läuft
weiter (Reserve-Abstand), Merge mit REL-22. (3) Release-Notiz REL-21 in state.md ergänzt um den Hotfix.

Regelbezug: gates.md Release-Check, R335, R429, R598, R622–R624 · Kosten bei Irrtum: CI rot durch einen Schwellen-Test → Rerun bzw.
Hotfix mit TOOL-ZEITRESERVE-21.

Entscheider: L0 · Anlass: Bericht lead-qa gate-rel-21-delta · ADR: —

## R626 · 2026-10-14 · Umsetzung UI-AUFRAEUM-3 und I-100 startet

Ruling: Release-Fenster REL-21 endet mit dem Push-Gate R625. Start der Umsetzung: **UI-AUFRAEUM-3** (lead-tech Controller, sonnet,
21 Starts/P1 nach R617, Branch `feat/ui-aufraeum-3` ab main mit Merge von `plan/ui-aufraeum-3` @ `0ba2bb21`; Pflichtzeilen R617,
R621 (2)(3), Beipacks R621 (1) und R622 (3)) und **I-100** (lead-tech Controller, sonnet, 10 Starts/P1 nach R619, Branch `feat/i100`
ab main mit Merge von `design/i100` @ `d05e67d1`; Auflagen R619). Beide parallel in eigenen Worktrees; Dateiüberschneidung nur
`src/style.css`, README, arc42 (andere Regeln/Abschnitte). Merge-Reihenfolge: UI-AUFRAEUM-3 zuerst, I-100 holt main per Merge vor
seinem Doku-Task. Browser-Läufe: höchstens 2 gleichzeitig (R424).

Regelbezug: R424, R475, R617, R619, R621, R622 · Kosten bei Irrtum: ein Merge-Konflikt in `style.css`.

Entscheider: L0 · Anlass: Push-Gate R625 · ADR: —

## R627 · 2026-10-14 · REL-21 live; Merges TOOL-BUENDEL-12 und BEOB-14

Ruling: REL-21 live: Push `0d1db8f3..ca46eb73`, CI 38553292584 grün, Pages 38553994549 grün. Merges nach R618/R621 jetzt durch
`production-integrator` im Hauptcheckout, seriell `--no-ff`: `tool/b12` @ `eab93fc9`, dann `docs/beob-14` @ `402ac5db`; danach
`make studio-test` und `make docs-check` je mit Exit-Code. Kein Push (der nächste Push gehört REL-22, R335).

Regelbezug: R335, R618, R621, R625 · Kosten bei Irrtum: ein Merge-Konflikt in docs/beobachtungen.md.

Entscheider: L0 · Anlass: Bericht production-integrator push-rel-21 · ADR: —

## R628 · 2026-10-14 · Freier Platz: Handels-Brainstorming (I-095, I-093)

Ruling: Nach REL-21 (I092 live) ist laut Rangliste IDEEN-09 das Handels-Brainstorming der nächste Designschritt (I-095 Fernauftrag
an einem Fremdkontor, I-093 Auftrag umtauschen; I-091 Treuebonus bleibt geparkt bis zum Nutzer-Playtest I-047). Freier Platz nach
R475 an `lead-design` (opus, Design-Lead), Budget 3 Starts/P1, Worktree `.worktrees/design-handel-2`: Brainstorming mit
Designvorschlag (2–3 Varianten, Empfehlung, Save/Baseline-Folgen, Abgrenzung zu Erweiterung 1 «Stände und Segel» der Nutzer-Session
— deren Worktree nur lesen). Ergebnis zum Gate Brainstorming an L0; keine Spec vor dem Gate.

Regelbezug: R445, R475, IDEEN-09 · Kosten bei Irrtum: ein Designvorschlag, der mit Erweiterung 1 zusammengelegt werden muss.

Entscheider: L0 · Anlass: freie Kapazität nach Push REL-21 · ADR: —

## R629 · 2026-10-14 · Gate Brainstorming Handel 2: OK für V1 «Fernangebot»; Spec jetzt

Ruling: Designvorschlag `design/handel-2` @ `faec2763` (Selbstprüfung lead-design BEDENKEN: kein Effekt in den ersten 15 min). L0 prüft
dieselben Fragen: stärkt Säule Wirtschaft/Handel (zweiter Zweck bestehender Routen), Entartung begrenzt (Stückprämie < 0,8 × Kaufpreis
wegen Edikt Handel, Kaufen-und-Liefern ohne Gewinn), kein §5.3-Vorbehalt; der 15-min-Punkt gilt gleich für I-047/I092 (Spätspiel-
Inhalt) und ist kein Hindernis. Entscheide: (1) **V1 angenommen**, I-093 geht darin auf (Fassung mit 60 Geld Gebühr verworfen); V2/V3
verworfen. (2) Handel 2 ist ein eigenes Handels-Paket ausserhalb Erweiterung 1; Auflage K4: Frist gegen Sturm/Piraten prüfen.
(3) Save-Version vergibt die Merge-Reihenfolge (R583-Muster). (4) **Spec jetzt** durch design-spec-author (Restbudget design-handel-2,
lead-design steuert); Gate Spec mit Pflichtpunkten: Baseline bitgleich (lead-tech bestätigt), Frist 2:30 gegen Seed-3-Karte, Rückfall
nur über `src/sim/defs/`. (5) Die Umsetzung wartet nicht auf den Nutzer, sondern auf einen **Studio-Playtest I-047** (qa-playtester,
lange Partie: verdrängen Fernaufträge den Stammkunden?) — als eigenes Paket PLAYTEST-I047 vor dem Plan.

Regelbezug: gates.md Gate Brainstorming, R445, R475, R583 · Kosten bei Irrtum: eine Spec, die nach dem Playtest nachgeschärft wird.

Entscheider: L0 · Anlass: Bericht lead-design design-handel-2 · ADR: —

## R630 · 2026-10-14 · Gate Merge I-100: OK, Merge nach UI-AUFRAEUM-3; PLAYTEST-I047 startet

Ruling: (1) `feat/i100` @ `b4541b7f`: Final-Review opus OK, Task-Reviews OK, `make check` Exit 0, Playtest AK-5/AK-6 belegt, Zeiten
2,10 → 2,07 s → **Gate Merge OK**. Merge durch den Integrator erst nach UI-AUFRAEUM-3 (R626), dann `make check` erneut auf main
(Konfliktprüfung style.css/README/arc42). Auflage R619 (1) gilt mit Review-Beleg des Code-Pfads als erfüllt (kein DOM in Vitest);
R619 (2) erfüllt über `restart()` ohne Reset-Code. Prozessbefund an die Retro: `make check` lief bei Last 10,8 trotz Briefing-Grenze 8.
(2) Browser-Platz frei: **PLAYTEST-I047** (lead-qa, 2 Starts/P1) nach R629 (5): lange Partie auf `main` (live-Stand REL-21) bis
Seefahrt und Stammkunde; Fragen: Wie oft kommt ein Stammkunden-Angebot, wie viel Aufmerksamkeit bindet es, bleibt Platz für einen
zweiten Auftragsstrom (Fernangebot)? Ergebnis als Playtest-Report an L0 und den Design-Lead (Gate Spec Handel 2).

Regelbezug: gates.md Gate Merge, R424, R619, R626, R629 · Kosten bei Irrtum: Konfliktnacharbeit beim Merge nach UI-AUFRAEUM-3.

Entscheider: L0 · Anlass: Bericht lead-tech i-100 · ADR: —

## R631 · 2026-10-14 · Gate Merge TOOL-ZEITRESERVE-21: OK mit Vorbehalt; gebündelter Merge

Ruling: `tool/zeitreserve-21` @ `69698908` (nur drei Testdateien, Welten in `beforeAll`, `decorSea` 5076 → 1 ms, `trees-farn`
3699 → 788 ms, `scenario-saves` AK-B2-02 855 → 62 ms, AK-S5-02 Timeout 15 s mit Kommentar; tsc/lint/zeittests/conflicts/`make test`
Exit 0; Task-Review OK) → **Gate Merge OK**, Vorbehalt: `make zeitreserve-gate` Exit 0 im Release-Check REL-22 (zweimal Exit 2 wegen
Last durch das parallele UI-AUFRAEUM-3, kein Substanz-Befund). Merge gebündelt durch den Integrator nach dem Final-Review von
UI-AUFRAEUM-3: `tool/zeitreserve-21`, `feat/ui-aufraeum-3`, `feat/i100` seriell, ein `make check` am Ende. Beobachtung: `forest`
RF-L1-5, `buyPct` AK-ZK-07, `wildlife` RF-10, `fauna` CAPS und `decor` L4-T3 R5 lagen unter Last ~10 nahe der Schwelle; reissen sie
das Gate bei ruhiger Last, folgt TOOL-ZEITRESERVE-22 vor dem Push REL-22.

Regelbezug: gates.md Gate Merge, R598, R624, R626 · Kosten bei Irrtum: ein weiteres Zeitreserve-Paket vor REL-22.

Entscheider: L0 · Anlass: Bericht lead-tech tool-zeitreserve-21 · ADR: —

## R632 · 2026-10-14 · Spec Handel 2: offene Punkte O-1/O-2/O-4; Gate Spec startet

Ruling: Spec `design/handel-2` @ `8d1b9af1` (R1–R15, AK-H2-01…30, Anhänge Werte/UI-Texte). Entscheide: **O-1** Frist 1700 Ticks (2:50)
statt 1500 — angenommen (≥ 30 s Reserve Felsbucht). **O-2** Save-Feld `farSkip` (Sperre der nächsten Periode auch bei Sofortlieferung)
— angenommen; das Save-Format steigt ohnehin (R629 (3)). **O-4** Felsbucht bei spätem Annehmen ohne Fristgarantie — hingenommen (keine
Strafe, frühes Annehmen reicht). Gate Spec jetzt parallel: lead-tech (Machbarkeit, Save-Format, Baseline bitgleich AK-H2-24) und
lead-qa (Testbarkeit), je sonnet nach Modelltabelle, je 1 Start. Ergebnis von PLAYTEST-I047 fliesst als Nachtrag ein, falls es den
Zuschnitt berührt; Umsetzung bleibt bis dahin gesperrt (R629 (5)).

Regelbezug: gates.md Gate Spec, R583, R629 · Kosten bei Irrtum: ein Spec-Nachtrag nach dem Playtest.

Entscheider: L0 · Anlass: Bericht lead-design design-handel-2 (Spec) · ADR: —

## R633 · 2026-10-14 · Gate Spec Handel 2: angenommen mit Auflagen; Plan nach PLAYTEST-I047

Ruling: lead-tech OK, lead-qa BEDENKEN (keine Blocker) zur Spec `design/handel-2` @ `8d1b9af1` → **Spec angenommen**. Auflagen für den
Plan (Tech-Lead beim Plan, opus): (T1) Rückfaltung als eigener Task: neuer Fold-Schritt entfernt `farOffer`/`farSkip` nur bei `null`,
vorgeschaltet in `foldBackToV13`/`foldBackToV9` (`tests/sim/helpers.ts`, ≈ 15 Testdateien), Merge-Reihenfolge zu Erweiterung 1 im Plan
benennen; (T2) Controller-Test: über alle Ticks `farOffer === null`, `farSkip === null`, keine `order.island` (Baseline-Beleg AK-H2-24);
(T3) `orderForPeriod` vor/nach der Änderung identisch (RNG-Beleg R13); (T4) Guard `order === null → fail` in `acceptFarOrder` mit AK;
(T5) Versionsnummer als letzter Schritt, Tests nur gegen `SAVE_VERSION`; ADR-010-Nachtrag und arc42 (`orders.ts`, Save). QA:
(A1) `laneTicks` Seed 3 in H2-SIM Task 1 messen und in AK-27 pinnen; (A2) Ersatzlage und Route Fremdinsel↔Fremdinsel als AK-H2-31
oder Ausschluss in §1 (Spec-Nachtrag durch lead-design vor dem Plan); (A3) AK-19 mit Roundtrip mitten in der gesperrten Periode inkl.
Vertrag; (A4) Fold-Schritt mit eigenem Test; (A5) AK-30 messbar `scrollWidth <= clientWidth` bei 1280 px; (A6) Task-Dateien ≤ 10 KB.
Ablauf: PLAYTEST-I047 abwarten (R629 (5)); dann Spec-Nachtrag A2 + Playtest-Folgen (lead-design, sonnet, Spec-Nachtrag), dann Plan.

Regelbezug: gates.md Gate Spec, R583, R629, R632 · Kosten bei Irrtum: ein Plan-Task mehr für die Rückfaltung.

Entscheider: L0 · Anlass: Berichte lead-tech und lead-qa gate-handel-2 · ADR: —

## R634 · 2026-10-14 · PLAYTEST-I047: Raum für Handel 2; Spec-Nachtrag vor dem Plan

Ruling: Playtest-Report lead-qa (BEDENKEN, nur niedrige Befunde; `.studio/qa/playtest-i047/report.md`, Seed 3, 20 min, abgekürzter Aufbau
per Dev-Sonde): ≤ 2 Entscheidungen je 90-s-Periode, Vertragslieferung ohne Klick, Fahrzeiten hin/zurück 52/62/78 s (worst ≈ 117 s) <
Frist 2:50 (R632 O-1), Konsole leer. Entscheide: (1) **Handel 2 hat Raum** — R629 (5) erfüllt. (2) **Spec-Nachtrag** (lead-design,
sonnet, «Spec-Nachtrag», Restbudget design-handel-2) auf `design/handel-2`: (a) A2 aus R633 (Ersatzlage, Route Fremdinsel↔Fremdinsel:
AK oder Ausschluss); (b) Fernangebot mit eigener Karte statt des gemeinsamen Slots oben rechts — Empfehlung mit Layout bei 1280×720
und Sturm-Dichte; (c) Fernangebot-Verfall und Fernlieferung als Einträge im Ereignis-Log (zählen für I-100 «Neu» nur, wenn sie eine
Meldung tragen — festlegen); (d) ausdrücklich: während eines Stammkunden-Vertrags kein Zufallsauftrag und damit kein Fernangebot;
(e) K4: es gibt keine Piraten (`ships.ts`), die Auflage ist mit dem Sturm-Beleg erfüllt. (3) Die drei niedrigen Befunde (verfallenes
Angebot ohne Meldung/Log, enger Slot oben rechts bei Sturm, keine Auftragsereignisse im Log) trägt lead-design im selben Zug in
`docs/beobachtungen.md` ein, mit Verweis, soweit Handel 2 sie abdeckt. (4) Danach Plan durch lead-tech (opus, Tech-Lead beim Plan).
(5) Worktree `.worktrees/playtest-i047` (detached, sauber) wird ohne `--force` entfernt.

Regelbezug: R629, R632, R633, R424 · Kosten bei Irrtum: ein UI-Task mehr in Handel 2.

Entscheider: L0 · Anlass: Bericht lead-qa playtest-i047 · ADR: —

## R635 · 2026-10-14 · Spec-Nachtrag Handel 2 angenommen; Plan startet

Ruling: Nachtrag `design/handel-2` @ `1ed91737` (AK-H2-31…33, eigene Fernkarte, Log-Einträge mit Meldung nur für angenommene
Fernaufträge, kein Fernangebot während eines Vertrags, K4 erfüllt) → angenommen. **O-5** (Ereignis-Log nur bei Krisen «an» sichtbar):
nicht in Handel 2, als Beobachtung für ein späteres UI-Paket. **O-6** Verfall ohne Klang: angenommen. Plan jetzt: lead-tech, opus
(Tech-Lead beim Plan), Budget 2 Starts/P1, Format E-010, Auflagen T1–T5 und A1–A6 aus R633; Datei-Ownership und Merge-Reihenfolge
gegen Erweiterung 1 (`tests/sim/helpers.ts`, Save-Version) ausdrücklich. Prozessbefund an die Retro: lead-design startete Arbeiter
zweimal im Hintergrund (ADR-007-Regel Vordergrund).

Regelbezug: gates.md Gate Spec, R633, R634 · Kosten bei Irrtum: ein Nachtrag im Plan.

Entscheider: L0 · Anlass: Bericht lead-design (Spec-Nachtrag) · ADR: —

## R636 · 2026-10-14 · Gate Merge UI-AUFRAEUM-3: OK; gebündelter Merge mit TOOL-ZEITRESERVE-21 und I-100

Ruling: `feat/ui-aufraeum-3` @ `7f2f282a`: 7 Tasks, Task-Reviews OK, Playtest OK (T01-Fix `fc670e11` über `contextmenu`), Final-Review opus
OK, Diff auf `src/sim/defs`, `save.ts`, `types.ts`, `balance.test.ts` leer, `make zeitreserve-gate` grün; `make check` ohne Exit 0 nur wegen
Last 10–22 (System-Prozesse) und `trees-farn` (wird durch `tool/zeitreserve-21` behoben) → **Gate Merge OK**. Bestätigt: Ownership-
Erweiterung `src/ui/contractJump.ts` (Meldetext), Spec-Delta M6 «Krisen: aus» ohne Karte (R606 (3)). Merge durch den Integrator im
Hauptcheckout seriell `--no-ff`: `tool/zeitreserve-21` @ `69698908`, `feat/ui-aufraeum-3` @ `7f2f282a`, `feat/i100` @ `b4541b7f`; Konflikt →
`git merge --abort`, melden. Danach ein `make check` (Exit-Code; bei Testlock-/Lastabbruch melden, nicht warten) und `make docs-check`.
Die beim Merge verworfenen Abhak-Einträge in `docs/beobachtungen.md` holt die nächste Auswertung nach; I-100-Status in `docs/ideen.md`
pflegt die Ende-Routine.

Regelbezug: gates.md Gate Merge, R617, R621, R626, R630, R631 · Kosten bei Irrtum: ein roter `make check` auf main → Fix vor REL-22.

Entscheider: L0 · Anlass: Bericht lead-tech ui-aufraeum-3 · ADR: —

## R637 · 2026-10-14 · Release-Check REL-22 jetzt, Push in der Folgesession

Ruling: main enthält nach R636 (`8e3e53c2`) UI-AUFRAEUM-3, I-100, TOOL-ZEITRESERVE-21, TOOL-BUENDEL-12, BEOB-14 (zwei Spiel-Häppchen).
Der Push dieser Session war REL-21 (R335) — **REL-22 wird in der Folgesession gepusht**. Der Release-Check läuft jetzt, damit die
Folgesession nur noch Gate und Push braucht: lead-qa (sonnet, Gate-Urteil), Budget 4 Starts/P2: Integrator `.worktrees/integrate`
auf main (`git checkout --detach main`), `make check`, `make check-ci-perf`, `make zeitreserve-gate` (Testlock: bei Last abbrechen und
später erneut, höchstens 3 Versuche); ein qa-playtester-Lauf am Kandidaten (Zusammenspiel UI-AUFRAEUM-3 + I-100: Kartenstapel mit
«Neu»-Zähler, Rangliste, Rechtsklick im Linienzug); Opus-Review über `ca46eb73..<Kandidat>` (nur Spiel-Code und Tests). Kein Push.

Regelbezug: gates.md Release-Check, R335, R636 · Kosten bei Irrtum: ein erneuter Delta-Check, falls main bis zum Push wächst.

Entscheider: L0 · Anlass: Merge-Bericht merge-rel22-a · ADR: —

## R638 · 2026-10-14 · Plan Handel 2: Entwürfe P-A…P-E angenommen; Gate Plan startet

Ruling: Plan `plan/handel-2` @ `f5d38fcf` (T01–T09, H2-SIM T01–T06, H2-UI T07–T08, T09 Version/Doku; Auflagen R633 vollständig).
Entscheide: **P-A** ein Branch `feat/handel-2` (H2-UI hängt an H2-SIM; ein Merge); **P-B** Fehlertext `'Kein Auftrag'` als fünfte Prüfung;
**P-C** Rückfaltung über Schlüssel statt Versionsnummer; **P-D** Knopf «Liefern · <Insel>»; **P-E** vorläufig v15 ab T03, T09 legt fest
(wer zuerst nach main merged, bekommt die Version; Erweiterung 1 setzt später ihren Fold-Schritt davor). Gate Plan jetzt: lead-qa
(Testbarkeit, Review-/Playtest-Abdeckung) und lead-production (Budget 26 Starts/P1 + 3 Controller-Instanzen, Ownership, Abhängigkeiten),
je sonnet, je 1 Start. Umsetzung erst nach dem Push REL-22 (Folgesession), damit main bis dahin stabil bleibt. Befund
`tests/render/terrain.test.ts` H-R12b (60-s-Timeout unter Last 16) → Beobachtung für das nächste Zeitreserve-Paket.

Regelbezug: gates.md Gate Plan, R583, R633, R637 · Kosten bei Irrtum: ein Plan-Nachtrag.

Entscheider: L0 · Anlass: Bericht lead-tech plan-handel-2 · ADR: —

## R639 · 2026-10-14 · Gate Plan Handel 2: OK; Umsetzung nach Push REL-22

Ruling: lead-qa OK (drei Review-Hinweise), lead-production OK (zwei Auflagen) zum Plan `plan/handel-2` @ `f5d38fcf` → **Plan freigegeben**.
Budget **26 Starts / Parallelität 1** unter Phase `handel-2`, drei Controller-Instanzen (C1 T01–T03, C2 T04–T06, C3 T07–T09 + Final-Review)
als Folgeinstanzen. Auflagen ins Controller-Briefing: (1) T03-Review listet jede Anpassung an Alt-Tests (`save-contract`, `buyPct`), nichts
abgeschwächt; (2) AK-20 mit Grenzfällen (`due = P + 1500` lädt, ausserhalb `FAR_ORDER_DURATION` → «Beschädigter Spielstand»);
(3) Final-Review mit Grep-Wächter: kein Versions-Literal in Tests; (4) `git merge main` vor T07; (5) vor dem Merge `git diff --stat
main...design/erweiterung-1 -- src tests` prüfen, bei Code dort Hinweis an die Nutzer-Session; Worktree `erweiterung-1` nie anfassen.
State.md führt `plan-handel-2` und `handel-2`. **Start der Umsetzung in der Folgesession nach dem Push REL-22.**

Regelbezug: gates.md Gate Plan, R583, R633, R638 · Kosten bei Irrtum: ein Controller-Nachtrag.

Entscheider: L0 · Anlass: Berichte lead-qa und lead-production gate-plan-handel-2 · ADR: —

## R640 · 2026-10-14 · Freier Platz: Kurzdesign UI-HAEPPCHEN-D «Ereignis-Log vollständig»

Ruling: Drei verwandte Befunde (R634 (3), R635 O-5): Ereignis-Log nur bei Krisen «an» sichtbar; verfallenes Stammkunden-Angebot ohne
Meldung/Log; keine Auftragsereignisse im Log. Freier Platz nach R475 an `lead-design` (sonnet, Kurzdesign Stufe leicht), Budget
2 Starts/P1, Worktree `.worktrees/design-ui-d`, Branch `design/ui-haeppchen-d`: Kurzdesign mit AK; Abgrenzung zu Handel 2 (dessen
Fernauftrags-Log-Einträge, R635) und I-100 (Zähler). Umsetzung erst nach dem Merge von Handel 2 (gleiche Dateien `crisisLog.ts`,
`eventLogView.ts`).

Regelbezug: R475, R634, R635, E-061 · Kosten bei Irrtum: ein Kurzdesign, das nach Handel 2 nachgeschärft wird.

Entscheider: L0 · Anlass: freie Kapazität nach R639 · ADR: —

## R641 · 2026-10-14 · Kurzdesign UI-HAEPPCHEN-D angenommen

Ruling: `design/ui-haeppchen-d` @ `ce2f3689` (9 AK, Selbstprüfung OK) → **angenommen**. Regel: ins Log kommt, was ohne Spielerhandlung
eintritt; Meldung nur für Krisen, automatische Vertragslieferung/-bruch und angenommene Fernaufträge; Verfall unangenommener Angebote
und Zufallsaufträge still (zählt nicht für I-100); Log-Box sichtbar bei Krisen «an» oder ≥ 1 Eintrag (`eventLogVisible`); `LOG_MAX` 10 → 20
(UI-Konstante, kein Spielwert); kein `src/sim/`, kein Save. AK-H2-33 (Handel 2) bleibt im Handel-2-Strang gültig und wird von UI-HAEPPCHEN-D
für den Verfall danach ersetzt — keine Änderung am laufenden Handel-2-Plan. Plan (lead-tech, Stufe leicht) und kombiniertes Gate erst
nach dem Merge von Handel 2.

Regelbezug: R634, R635, R640, E-061 · Kosten bei Irrtum: ein UI-Nachtrag.

Entscheider: L0 · Anlass: Bericht lead-design design-ui-haeppchen-d · ADR: —

## R642 · 2026-10-14 · Release-Check REL-22: ZURÜCK → REL22-FIX (Zeitreserve + Kontrast)

Ruling: Kandidat `1b6af811`: `make check` Exit 0 (3935), `check-ci-perf` Exit 0, Playtest OK (Screenshots `.studio/qa/REL-22/`), Opus-Review
BEDENKEN (niedrig); `make zeitreserve-gate` **Substanz** bei ruhiger Nachmessung: `tests/tools/zeitreserve.test.ts` Z. 170 und Z. 417
(≈ 2,08 s × 4 > 50 % von 5000 ms). Kein Lastartefakt (R585). Kontrast `.btn--unread` 2,42:1 (`src/style.css:1392`). Entscheid **ZURÜCK**
und Paket **REL22-FIX** (lead-tech Controller, sonnet, Budget 4 Starts/P1, Branch `fix/rel22` ab main): (1) die zwei Zeitreserve-Tests
beschleunigen oder begründeter Timeout nach E-043; (2) `.btn--unread` Kontrast ≥ 4,5:1 (Text) bzw. Hervorhebung über Rand/Hintergrund,
Screenshot vorher/nachher; (3) Trivial-Fix `tests/ui/upkeepRank.test.ts:160` (`+ 5` → `buildingUpkeep`); (4) Beobachtungen aus dem
Release-Check in `docs/beobachtungen.md` eintragen (Cache-Schlüssel `order.ts:57-65`, `merge:`-Präfix, Log-Position unten links,
Log erst ab Tick 2400 — teils durch UI-HAEPPCHEN-D abgedeckt, Zeilenumbruch Boom+Vorliebe). Task-Review, `make zeitreserve-gate`
Exit 0 im eigenen Worktree. Danach Gate Merge, Delta-Check und Push REL-22 in der Folgesession (R335).

Regelbezug: gates.md Release-Check, R585, R598, R631, R637 · Kosten bei Irrtum: ein weiterer Delta-Check.

Entscheider: L0 · Anlass: Bericht lead-qa gate-rel-22 · ADR: —

## R643 · 2026-10-14 · Nutzerauftrag: Dashboard-Karte «Versionen und Releases» — zuerst Muster

Ruling: Nutzerauftrag 2026-10-14: neue Dashboard-Karte zuoberst im Studio-Dashboard: Live-Stand, kurze Vergangenheit (zusammengefasst),
vor allem aktueller Entwicklungsstand: welche Stränge laufen in dieser Session, was kommt mit welchem Release, was ist geplant, welche
künftigen Pakete/Themen. **Zuerst ein Muster zur Freigabe durch den Nutzer**, kein Einbau vorher. Auftrag an lead-tech (sonnet,
Werkzeug), Budget 2 Starts/P1: statisches HTML-Muster im Stil von `tools/studio/dashboard/style.css` mit echten Daten (state.md,
rulings R616–R642, docs/ideen.md Rangliste) unter `.studio/mockups/versionen/`, plus Screenshot bei 1440 px; dazu ein Vorschlag zur
Datenquelle für den späteren Einbau (bevorzugt aus vorhandenen Dateien abgeleitet, keine Doppelpflege).

Regelbezug: Nutzerauftrag, R475 · Kosten bei Irrtum: ein verworfenes Muster.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R644 · 2026-10-14 · Gate Merge REL22-FIX: OK; Merge jetzt, Delta-Check und Push REL-22 in der Folgesession

Ruling: `fix/rel22` @ `a8416ca9`: Zeitreserve-Tests mit 20-s-Timeout für die drei Spawn-Blöcke (`describeSpawn`, Kommentar nach E-043;
Ursache: sporadische `spawnSync`-Startstocker ≈ 2 s, Testzeit sonst 74 ms), `.btn--unread` 7,16:1 (vorher 2,42:1), `upkeepRank` aus
`buildingUpkeep` abgeleitet, 6 Beobachtungen; tsc/lint/zeittests/conflicts/docs-check Exit 0, `make test` 3935 grün, `make zeitreserve-gate`
**Exit 0** (Last 1,9/2,4), Task-Review OK → **Gate Merge OK**. Merge durch den Integrator im Hauptcheckout `--no-ff`, danach `make docs-check`.
Folgesession: Delta-Check REL-22 (`make check`, `check-ci-perf`, `zeitreserve-gate`, Browser-Punkt Kontrast im Spiel) und Push. Offen als
Beobachtung: Spawn-Latenz unter Last (Messauftrag bei erneutem Auftreten).

Regelbezug: gates.md Gate Merge, R585, R598, R642, E-043 · Kosten bei Irrtum: ein Timeout verdeckt einen echten Hänger bis 20 s.

Entscheider: L0 · Anlass: Bericht lead-tech rel22-fix · ADR: —

## R645 · 2026-10-14 · Nutzerfreigabe Muster v3: Einbau TOOL-DASH-VERSIONEN; Session-Ende vorbereiten

Ruling: Nutzer 2026-10-14: «passt so. umsetzen.» Muster `.studio/mockups/versionen/v3.html` ist die Vorlage. Paket **TOOL-DASH-VERSIONEN**
(lead-tech Controller, sonnet, Werkzeug-Paket, Budget 4 Starts/P1, Branch `tool/dash-versionen`): Karte «Versionen und Releases» als
erste Karte im Studio-Dashboard; Zeitstrahl mit 5 Stufen, Gruppen je Release, Schranken/Pfeile/Chips für Abhängigkeiten, Kettenzeile
«Kritischer Pfad», Hover-Kette, S-Kennzeichen für Pakete der laufenden Session, Filter «nur heute» (Standard: alles), «Früher»
eingeklappt. Datenquelle `docs/studio/releases.json` (Zuordnung Paket → Release, Stufe, Status, Abhängigkeiten, Pool), gepflegt von
lead-production mit state.md; Hash/CI/Pages aus git bzw. `ci.py`; Session-Kennzeichen aus den Events. Abnahme: `make studio-test` grün,
Echtlauf gegen den laufenden Dashboard-Server mit Screenshot, Task-Review. Parallel: Session-Ende (Metriken, Kurz-Retro, state.md).

Regelbezug: Nutzerauftrag, R643 · Kosten bei Irrtum: eine Dashboard-Karte, die nachgebessert wird.

Entscheider: L0 · Anlass: Nutzerfreigabe · ADR: —

## R646 · 2026-10-14 · Kurz-Retro b54ed3bd: E-062 zurückgenommen, E-066 startet, E-063 angepasst; Ad-hoc-Signal abgedeckt

Ruling: Retro `retros/2026-10-14-session-b54ed3bd-ende.md` (`2e45a88b`). Entscheide: (1) **E-062 zurückgenommen** (nie angewendet, keine
Briefing-Zeile; Messwerte nicht zuschreibbar). (2) **V1 angenommen: E-066 startet** (Folgeinstanz statt Fortsetzung bei lead-tech;
Pflicht-Hebel Cache-Write/Steuerung) — studio-coach setzt die Zeile in `lead-tech.md` und experimente.md um. (3) **V2 angenommen:** E-063
Messgrösse «Integrator-Briefings mit Hauptcheckout ohne Ruling-Nummer, Soll 0». (4) **V3 angenommen:** Messauftrag Cache-Write-Wachstum
nach Rolle, Frist nächste Session-Retro. (5) Ad-hoc-Retro-Signal (Cache-Write rot und Flake rot in zwei Sessions): Cache-Write ist mit V1/V3
belegt adressiert; Flake ist ein Zählartefakt der Historienliste (0 seit 2026-10-14, Beobachtung eingetragen) — **keine eigene Ad-hoc-Retro
jetzt**; ist eine der beiden Ampeln in der nächsten Session wieder rot, folgt sie dort. (6) Messauftrag (a)(b)(c) aus der Retro (Briefing-
Verbote Warte-Agenten, Hintergrund-Arbeiter, Lastgrenze): Guard erst bei dreifacher Verletzung einer Klasse in einer Session.

Regelbezug: R316, R429, R615 · Kosten bei Irrtum: eine Session mit falschem Experiment-Platz.

Entscheider: L0 · Anlass: Bericht studio-coach retro-session-b54ed3bd, Hook-Hinweis Ad-hoc-Retro · ADR: —

## R647 · 2026-10-14 · Gate Merge TOOL-DASH-VERSIONEN: OK; Guard gegen Warte-Agenten fällig

Ruling: `tool/dash-versionen` @ `45046433`: Karte «Versionen und Releases» als erste Karte im Live-Tab (Muster v3), `docs/studio/releases.json`
(Schema im Handoff), `/api/state` liefert `releases`, `releases_error`, `live`; `make studio-test` 869 grün, `studio-lint`/`docs-check` Exit 0,
Task-Review OK, Echtlauf Port 8791 mit Screenshots (`.studio/qa/tool-dash-versionen/`); Schranken-Ursache geklärt (`.bar { overflow: hidden }`,
Präfix `rv-`). Lücke: kein Rot-Beleg für `test_releases.py` (Implementierung vor Test) — hingenommen für ein Werkzeug-Paket, Befund an die Retro.
→ **Gate Merge OK**. lead-production merged `--no-ff` im Hauptcheckout, setzt TOOL-DASH-VERSIONEN in `releases.json` auf `done`, ergänzt die
Pflegeregel in state.md (Fortsetzung 3) und prüft `make studio-test`, `make docs-check`. Die Pflegeregel geht als Handbuch-Vorschlag an den
Coach in der Folgesession. (2) Dritter unnötiger Warte-Agent dieser Session (tool-buendel-12, tool-hotfix-zr, tool-dash-versionen) → nach
R646 (6) **TOOL-GUARD-WARTEAGENT** in der Folgesession: Hook verweigert Agent-Starts ohne Auftrag (z. B. reines Warten/`ok`) bzw. `sleep`
im Hintergrund durch Leads; Entwurf und Test durch lead-tech.

Regelbezug: gates.md Gate Merge, R645, R646 · Kosten bei Irrtum: eine Karte mit kleinen Hover-Mängeln; ein Guard mit Fehlblocks (Rückfall warn).

Entscheider: L0 · Anlass: Bericht lead-tech tool-dash-versionen · ADR: —

## R648 · 2026-10-14 · Nutzerauftrag «mach weiter, zeig im Dashboard, was läuft und wo das Session-Ziel je Task liegt»; Session-Plan

Ruling: Auslegung „zeig mir im Dashboard, was du gerade umsetzt und wo das geplante Ziel der heutigen Session bzgl. der einzelnen Tasks ist“
als (a) **sofort**: `releases.json` bildet den heutigen Plan ab (jedes Paket der Session mit aktueller Stufe und Ziel-Text «Ziel heute: …»
in `note`), gepflegt durch lead-production; (b) **Paket TOOL-DASH-SESSIONZIEL**: die Karte «Versionen und Releases» zeigt je Paket ein
Feld `goalStage` als gestrichelte Zielmarke hinter dem Balken (Abstand Ist → Ziel sichtbar) und oben eine Zeile «Jetzt in Arbeit» aus
den aktiven Agenten/Paketen (`session_packages` + Status `active`). Plan sofort (ohne Testläufe, R464), Umsetzung erst nach `make push-check`
Exit 0 für REL-22. Session-Plan: (1) Delta-Check + Push REL-22, (2) Handel 2 (REL-23) nach dem Push, (3) TOOL-DASH-SESSIONZIEL,
(4) TOOL-GUARD-WARTEAGENT (R647 (2)), (5) freie Plätze → Ideen-Runde nach dem Push (R445/R475). N-100 erledigt (REL-20 live seit R594/R595).
Zweck der Anweisung: Der Nutzer will den Fortschritt der Session gegen ein Ziel verfolgen. Die Auslegung widerspricht dem nicht, weil
die Daten sofort sichtbar sind und die Zielmarke den Abstand Ist → Ziel grafisch zeigt, ohne die Push-Regel R464 zu brechen.

Regelbezug: Verfassung §5, STUDIO.md Autonomie, R464, R645, R647 · Kosten bei Irrtum: eine Darstellung, die der Nutzer anders wollte (eine Karte nachbessern).

Entscheider: L0 · Anlass: Nutzerprompt Session-Start · ADR: —

## R649 · 2026-10-14 · Gate Plan TOOL-DASH-SESSIONZIEL und TOOL-GUARD-WARTEAGENT: OK mit Auflagen; Start nach push-check REL-22

Ruling: (1) **TOOL-DASH-SESSIONZIEL** Plan `tool/dash-sessionziel` @ `dd928fb4` (T01–T04, Logik in Python testbar, JS zeichnet) → OK,
Budget 6 Starts, Parallelität 1. Auflage: S-Kennzeichen und «Jetzt in Arbeit» zählen zusätzlich Pakete, die in der laufenden Session per
`log.py package` mit Status active/review/blocked angemeldet sind (Lücke aus dem Bericht lead-production, `session_packages` nur aus dem
Agent-Baum). Rot-Beleg je Task im Bericht. (2) **TOOL-GUARD-WARTEAGENT** Plan `tool/guard-warteagent` @ `0ac5d308` (`waitguard.py`, Modus
deny, Rückfall warn, nur `agent_type` lead-*) → OK, Budget 3 Starts. Auflage: zuerst die PreToolUse-Payload im Lead-Kontext belegen
(`agent_type` vorhanden?); fehlt sie, Bericht an L0 vor der Umsetzung. Der neue Eintrag in `.claude/settings.json` ist freigegeben; blockt
der Guard die Datei, setzt L0 ihn. (3) Umsetzung beider Pakete erst nach `make push-check` Exit 0 für REL-22 (R464).

Regelbezug: gates.md Gate Plan, R464, R647, R648 · Kosten bei Irrtum: ein Guard mit Fehlblocks (Rückfall warn), eine Karte mit Zusatzzeile.

Entscheider: L0 · Anlass: Berichte lead-tech Phase A · ADR: —

## R650 · 2026-10-14 · Delta-Check REL-22 ZURÜCK (Lint); Push-Blocker-Fix TOOL-LINT-DASH

Ruling: `make push-check` @ `c7da39d7` Exit 1: ESLint `no-undef` für `CSS` und `ResizeObserver` in `tools/studio/dashboard/releases.js`
(aus TOOL-DASH-VERSIONEN, R647; das Gate prüfte `studio-lint`, nicht `make lint`). Kontrast `.btn--unread` 7,16:1 → OK. Nach R514 V1 läuft
der benannte Push-Blocker-Fix vor dem Push: Paket **TOOL-LINT-DASH**, Fix in `eslint.config.js` (Browser-Globals `CSS`, `ResizeObserver` im
Dashboard-Block), Test: `make lint` Exit 0 und `make studio-test` gezielt; danach neuer Delta-Lauf (`make push-check`, `make zeitreserve-gate`)
durch eine neue lead-qa-Instanz. Befund an die Retro: Gate Merge für Dashboard-JS muss `make lint` enthalten.

Regelbezug: R464, R514 V1, R647 · Kosten bei Irrtum: ein weiterer Delta-Lauf (≈ 10 min).

Entscheider: L0 · Anlass: Bericht lead-qa REL22-PUSH · ADR: —

## R651 · 2026-10-14 · Push REL-22 «Aufgeräumt und nichts verpasst»; Freigabe Umsetzung Handel 2 und Werkzeug-Pakete

Ruling: Delta-Check 2. Lauf OK (`make push-check` EXIT=0 und `make zeitreserve-gate` EXIT=0 @ `fb1e5e46`, Handoff
`.studio/handoffs/2026-10-14-lead-qa-REL22-PUSH.md`) → Gate Push OK, gepusht `ca46eb73..fb1e5e46` per geprüftem Hash, Pages per
`gh workflow run Pages --ref main`. Damit entfällt die Sperre aus R464: (1) TOOL-DASH-SESSIONZIEL Phase B (R649) startet, Zusatzauflage:
`server.py` liefert die Dashboard-Dateien mit `Cache-Control: no-store` (Nutzer sah die Karte nicht, weil der Browser ein altes `app.js`
aus dem Cache nutzte); (2) TOOL-GUARD-WARTEAGENT Phase B (R649); (3) HANDEL-2 Umsetzung nach Plan `f5d38fcf`, Auflagen R639, Budget 26
Starts, E-066. Pflege `releases.json` (REL-22 live) durch lead-production.

Regelbezug: STUDIO.md Push-Abschnitt, R335, R464, R639, R649 · Kosten bei Irrtum: ein Release mit Lastrauschen in zwei Render-Tests (Reserve in der Nachmessung grün).

Entscheider: L0 · Anlass: Bericht lead-qa REL22-PUSH, Nutzerfrage Dashboard · ADR: —

## R652 · 2026-10-14 · Gate Merge TOOL-GUARD-WARTEAGENT: OK, Modus deny

Ruling: `tool/guard-warteagent` @ `cb7dd1ac`: `tools/studio/waitguard.py` (Regel A Warte-Agent, Regel B `sleep` im Hintergrund, nur `lead-*`),
21 Tests mit Rot-Beleg, PreToolUse-Eintrag `Bash|Agent|Task` in `.claude/settings.json` (fail-safe `|| true`, Timeout 5 s), Doku arc42 und
STUDIO.md; `make studio-test` (888), `studio-lint`, `lint`, `docs-check` Exit 0; Review BEDENKEN → Fix → Delta-Review OK. Payload-Beleg
`agent_type` indirekt über Events (kein direkter Hook-Mitschnitt) — hingenommen; der erste echte Block oder Fehlblock wird als
Ereignis `wait_guard` sichtbar. → **Gate Merge OK, Modus deny**; Rückfall `MODE = "warn"` bei erstem Fehlblock ohne neues Ruling.
lead-production merged `--no-ff`, Paket done, Handbuch-Minor 1.55 (Zeile STUDIO.md) im selben Zug; Fehlnegative (`(sleep 60)`,
`bash -c 'sleep …'`, `sleep infinity`, `FOO=1 sleep 5`) als Eintrag in `docs/beobachtungen.md`.

Regelbezug: gates.md Gate Merge, R429, R647 (2), R649 · Kosten bei Irrtum: Fehlblock eines Leads (Rückfall warn, eine Zeile).

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-GUARD-WARTEAGENT · ADR: —

## R653 · 2026-10-14 · Gate Ideen-Runde IDEEN-10: Priorisierung

Ruling: `docs/ideen-10` @ `cc3072de` (I-101–I-109, Rangliste in docs/ideen.md) → angenommen, Merge durch lead-production. Priorisierung
L0 nach Nutzen/Aufwand: (1) **I-109 «Reichweite am Gut-Chip»** (S–M, ohne Save, unabhängig von Handel 2) → Kurzdesign jetzt (freie
Kapazität, R475), Stufe leicht, `design/i109`; (2) **I-102 Auftragsvorschau** → eingeplant als Häppchen nach dem Merge von Handel 2;
(3) **I-101** → Beipack-Prüfung im Final-Review Handel 2 nur als Hinweis, kein Scope-Zuwachs; I-108, I-103 → Pool; I-104, I-105, I-107
geparkt; I-106 vor Einplanung gegen UI-HAEPPCHEN-D prüfen. Keine Säulenfrage, nichts in die Warteschlange.

Regelbezug: gates.md Gate Ideen-Runde, R445, R475 · Kosten bei Irrtum: ein Kurzdesign, das später zurückgestellt wird.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-10 · ADR: —

## R654 · 2026-10-14 · Kurzdesign I-109 «Reichweite am Gut-Chip»: angenommen; Plan nach Merge Handel 2

Ruling: `design/i109` @ `7e25d7cf` (reine UI-Funktion `reachView` aus `goodsBalance`, kein Sim-/Save-Diff, 9 AK) → angenommen. O-1: Schwellen
3:00 / 1:00 / voll 1:00 als UI-Konstanten übernommen, Justierung nach Playtest ohne neues Ruling; Fallback «Suffix streichen» erlaubt.
Plan + kombiniertes Gate erst nach dem Merge von Handel 2 (mögliche Überschneidung `src/ui/hud.ts`), Reihenfolge danach: UI-HAEPPCHEN-D,
I-109, I-102 (lead-tech prüft Bündelung). Tagesziel I-109 (Kurzdesign) erreicht.

Regelbezug: gates.md Gate Brainstorming/Kurzdesign, E-061, R641, R653 · Kosten bei Irrtum: Schwellen nach Playtest anpassen.

Entscheider: L0 · Anlass: Bericht lead-design I-109 · ADR: —

## R655 · 2026-10-14 · Gate Merge TOOL-DASH-SESSIONZIEL: OK

Ruling: `tool/dash-sessionziel` @ `b8e92453` (T01–T04 + Fix-Runde): `goalStage`-Zielmarke «Ziel heute» mit «✓ Ziel erreicht», Kopfzeile
«Jetzt in Arbeit» mit «n von m am Tagesziel», S-Kennzeichen auch für per `log.py package` angemeldete Pakete, `Cache-Control: no-store`
für Dashboard-Dateien; Rot-Belege je Task; `make lint`, `studio-test` (884), `studio-lint`, `docs-check` Exit 0; Final-Review opus ZURÜCK
→ Fix → Delta OK; Echtlauf 1440/1280 OK. Lücke: Hinweiszeile nach dem JS-Fix nicht erneut im Browser gesehen → L0 prüft nach dem Merge
per Headless-Screenshot am laufenden Dashboard. → **Gate Merge OK**. lead-production merged `--no-ff`, Paket done in releases.json, startet
den Dashboard-Server neu (neuer Python-Code), damit der Nutzer die Karte sieht. Befunde favicon 404, Warnzeile im leeren Zustand → beobachtungen.md.

Regelbezug: gates.md Gate Merge, R648, R649, R651 · Kosten bei Irrtum: eine falsch versetzte Hinweiszeile im Dashboard.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-DASH-SESSIONZIEL · ADR: —

## R656 · 2026-10-14 · Nachbesserung Zielmarke: «erreicht» erst bei abgeschlossener Zielstufe

Ruling: L0-Sichtprüfung nach R655 (Headless-Screenshot 1440 px): HANDEL-2 (stage 4 = goalStage 4, state active) zeigt «✓ Ziel erreicht»,
Zähler «4 von 4». Auslegung `goalStage`: Ziel ist das **Abschliessen** der Zielstufe. «Erreicht» gilt nur bei `stage > goalStage` oder
`stage == goalStage` und `state == done` (Python `goal_progress` und JS identisch, Test zuerst rot). Paket **TOOL-DASH-ZIEL-FIX** (lead-tech,
1 Start + Review). Daten: REL-22-Titel in releases.json «Kandidat lokal auf main» → «Aufgeräumt und nichts verpasst» (lead-production);
Pflegeregel in state.md um die Semantik ergänzen.

Regelbezug: R648, R655 · Kosten bei Irrtum: falscher Tagesstand im Dashboard bis zum Fix.

Entscheider: L0 · Anlass: Sichtprüfung L0 · ADR: —

## R657 · 2026-10-14 · Gate Merge TOOL-DASH-ZIEL-FIX: OK

Ruling: `tool/dash-ziel-fix` @ `ed0ccc32` (`goal_reached`/`goalDone` identisch, Rot-Beleg 2 Fälle, `make lint`/`studio-test`/`studio-lint`/
`docs-check` Exit 0, Review OK) → **Gate Merge OK**. lead-production merged `--no-ff`, setzt das Paket done, startet den Dashboard-Server
neu; L0 prüft per Screenshot. Folge der Semantik: Items nach dem Merge immer auf `state: done` setzen (Pflegeregel).

Regelbezug: gates.md Gate Merge, R656 · Kosten bei Irrtum: falscher Zähler im Dashboard.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-DASH-ZIEL-FIX · ADR: —

## R658 · 2026-10-14 · Gate Merge HANDEL-2 «Fernangebot»: OK; Push REL-23 in der Folgesession

Ruling: `feat/handel-2` @ `d5778c60` (T01–T09, Final-Review opus BEDENKEN niedrig → Fix, zwei Restbefunde hingenommen → beobachtungen.md;
`make check` EXIT=0 mit 4034 Tests, `zeittests`, `lint` Exit 0; Save v15 mit `migrateV14ToV15` und Ladetest; README/arc42 nachgeführt;
Erweiterung-1-Diff leer → Save v15 gehört Handel 2, R638) → **Gate Merge OK**. lead-production merged `--no-ff` nach main (lokal),
releases.json HANDEL-2 done, REL-23 Gate «Release-Check offen», Release-Notiz-Entwurf aus `.studio/handoffs/2026-10-14-lead-qa-HANDEL-2-gate.md`
in state.md. Kein zweiter Push in dieser Studio-Session (R335): Release-Check + Push REL-23 in der Folgesession. Limit-Ampel gelb → keine
neue Welle: UI-HAEPPCHEN-D-Plan (Tagesziel «Plan») verschoben, danach Session-Ende-Routine.

Regelbezug: gates.md Gate Merge, R335, R638, R639 · Kosten bei Irrtum: ein lokaler Merge mit zwei niedrigen Restbefunden.

Entscheider: L0 · Anlass: Bericht lead-qa HANDEL-2 · ADR: —

## R659 · 2026-10-14 · Kurz-Retro dbac5fc4: V1 (E-068) und V2 (E-069) angenommen; Ad-hoc-Signal abgedeckt

Ruling: Retro `retros/2026-10-14-session-dbac5fc4-ende.md` (`6f492120`). (1) **V2 angenommen, zuerst**: Paket TOOL-METRIK-ZEITRAUM (E-069)
in der Folgesession — Session-Zeitraum an Flake- und Steuerungsanteil durchreichen, Cache-Write nach Erstladung/Wachstum aufteilen
(Flake 8 → 0 und Steuerung 51,8 → 46,4 % mit `--since` = Messartefakt). (2) **V1 angenommen**: E-068 «ein Reviewer je Paket bei Stufe
leicht (≥ 2 Tasks, ≤ 300 Diff-Zeilen)» startet, sobald E-063 oder E-064 einen Platz freigibt. (3) Das Ad-hoc-Signal (Cache-Write und Flake
zwei Sessions rot) ist durch diese Retro abgedeckt: Cache-Write mit Hebel V1 und Messung V2, Flake als Messartefakt mit Werkzeug-Hebel V2.
(4) Messauftrag nächste Retro: Briefing-Verbot (b) im Archiv prüfen, Guard-Blocks `wait_guard` seit R652 zählen.

Regelbezug: STUDIO.md Verbesserungsschleife, R316, R646 · Kosten bei Irrtum: ein Experiment mit zu wenig Review-Tiefe (Rückfall Review je Task).

Entscheider: L0 · Anlass: Bericht studio-coach Kurz-Retro · ADR: —

## R660 · 2026-10-16 · Session-Plan: Release-Check und Push REL-23, Plan UI-HAEPPCHEN-D, TOOL-METRIK-ZEITRAUM

Ruling: Nutzerprompt «mach weiter» = Plan aus state.md fortsetzen. (1) **REL-23 «Fernangebot»**: lead-qa Release-Check am aktuellen
main (`244792f4`, Ein-Paket-Release HANDEL-2, Gate Merge R658 bereits OK) mit `make push-check` und `make zeitreserve-gate` per geprüftem
Hash; Push durch L0 nach Exit 0 (R335: der einzige Push dieser Session). (2) **UI-HAEPPCHEN-D** «Ereignis-Log vollständig»: lead-tech Plan
aus Kurzdesign `ce2f3689` (Branch `design/ui-d`), Stufe leicht, Plan-Instanz sonnet (E-054); lead-tech prüft dabei die Bündelung mit I-109
(`design/i109` @ `7e25d7cf`) und I-102. Plan ohne Testläufe, Umsetzung erst nach `make push-check` Exit 0 für REL-23 (R464). (3)
**TOOL-METRIK-ZEITRAUM** (E-069, R659 (1)): lead-tech Plan und Umsetzung als Werkzeug-Paket in `tools/studio/`, kein `src/`; startet sofort,
da es weder Spiel noch Push-Stand berührt (Doku-/Werkzeug-Commit nach main erst nach Gate Merge). Belegung 3 Leads; restliche Plätze
nach R475 erst nach dem Push (Last und Testlock schonen).

Regelbezug: Verfassung §5, STUDIO.md Autonomie, R335, R464, R475, R654, R659 · Kosten bei Irrtum: ein Plan, der wegen Bündelung neu zugeschnitten wird.

Entscheider: L0 · Anlass: Nutzerprompt Session-Start · ADR: —

## R661 · 2026-10-16 · Plan UI-HAEPPCHEN-D: Bündelung mit I-109 ja, I-102 nein; Zeitformat aus formatGameTime

Ruling: Plan `plan/ui-haeppchen-d` @ `b1a17826` (T00–T04, T06–T09; Teil A Ereignis-Log, Teil B I-109). (1) **I-109 wird gebündelt**
(getrennte Dateien, je 9 AK, kein Save, kein `src/sim/`; ein Gate, ein Browser-Check, ein Final-Review; Reihenfolge A vor B nach R654;
Teil B ist bei Durchfallen abspaltbar). (2) **I-102 nicht gebündelt**: nur Ideen-Eintrag ohne AK; Kurzdesign bei freiem Platz, danach eigenes
Häppchen. (3) **Zeitformat**: einzige Quelle ist `formatGameTime` («40 s» statt «0:40» aus dem Kurzdesign I-109); T07/T08 prüfen bei 1280 px,
dass die Leiste nicht umbricht. (4) Gate Plan durch lead-qa; Budgetantrag 21 Starts wird mit dem Gate entschieden.

Regelbezug: gates.md Gate Plan, R464, R654 · Kosten bei Irrtum: ein Suffix mit anderem Zeitformat (eine Zeile nachbessern).

Entscheider: L0 · Anlass: Bericht lead-tech plan-UI-HAEPPCHEN-D · ADR: —

## R662 · 2026-10-16 · Gate Plan UI-HAEPPCHEN-D + I-109: OK mit 4 Auflagen; Budget 21 Starts nach Push REL-23

Ruling: Urteil lead-qa (`.studio/handoffs/2026-10-16-lead-qa-gate-plan-UI-HAEPPCHEN-D.md`) übernommen: **OK mit Auflagen** — (1) `npx tsc
--noEmit` und `make lint` in jedem Task mit `.ts`-Änderung, `make zeittests` und `make conflicts` vor «bereit»; (2) Testfall «0 ↓ leer» in T07
(AK-UR-04: Text, `label`, Klasse bei Bestand 0 und net < 0); (3) Test-Erwartungen zum Zeitformat über `formatGameTime(...)`, keine Literale;
(4) T08 ergänzt um Angebot ablehnen, Fernauftrag annehmen, Laden mitten im Auftrag/Angebot ohne Fehl-Eintrag. Die Plan-Instanz setzt die
Auflagen auf `plan/ui-haeppchen-d` um. Umsetzung mit Budget 21 Starts, Parallelität 1, startet nach `make push-check` Exit 0 für REL-23 (R464).

Regelbezug: gates.md Gate Plan, R464, R661 · Kosten bei Irrtum: ein später entdeckter Verdrahtungsfehler (Fix-Runde).

Entscheider: L0 · Anlass: Bericht lead-qa gate-plan-UI-HAEPPCHEN-D · ADR: —

## R663 · 2026-10-16 · Nutzerauftrag: I-091, I-094, I-097 anstossen (Parken aufgehoben)

Ruling: Nutzer: «kannst du auch 94, 91, 97 anstossen? oder teile davon?» — ausgelegt als Ideen I-091 Treuebonus, I-094 Darlehen, I-097 Pause
sichtbar; das Parken aus IDEEN-09 ist für diese drei aufgehoben. (1) **I-097** (S, kein Save): Kurzdesign Stufe leicht durch lead-design
(sonnet); Umsetzung nach UI-HAEPPCHEN-D, weil beide `src/ui/app.ts` und `src/style.css` berühren. (2) **I-091 + I-094** (Save ja, Wirtschaft):
ein gemeinsames kleines Wirtschafts-Brainstorming durch lead-design (opus) mit Rechnung durch `design-economy-designer`, je eine Kurz-Spec mit
AK; Pflichtfragen: I-094 Entartung (Darlehen immer richtig ab Ausbau > 40/min) und Geldüberschuss; I-091 Bonus bleibt unter `buy`. Save-Nummer
wird erst im Gate Plan vergeben (nächste freie beim Merge; Erweiterung 1 der Nutzer-Session ist ebenfalls auf eine neue Version angewiesen, R638
— wer zuerst merged, nimmt die nächste). Ergibt die Rechnung, dass I-094 entartet und kein Hebel hilft, darf lead-design «verwerfen» empfehlen.

Regelbezug: Verfassung §5, STUDIO.md Autonomie, R445, R475, R638 · Kosten bei Irrtum: zwei Specs für Funktionen, die nach dem Playtest anders aussehen.

Entscheider: L0 · Anlass: Nutzerprompt · ADR: —

## R664 · 2026-10-16 · Kurzdesign I-102 «Auftragsvorschau»: angenommen mit V2; Plan nach UI-HAEPPCHEN-D

Ruling: `design/i102` @ `9afebb5b` (9 AK, kein Save, kein neuer Spielwert; `previewOrder(world)` als reine Lesefunktion in `src/sim/orders.ts`
über `orderForPeriod`, ohne RNG-Vorziehen) → **angenommen**. (1) **V2**: Vorschau auch bei aktivem Normalauftrag als «danach voraussichtlich X»
(Lücke Verfall → Folgeperiode nur 300 Ticks). (2) Fernangebot-Insel wird nicht angekündigt (später nachrüstbar). (3) I-093 (verworfen) und
I-095 (erledigt, R658) wandern auf demselben Branch nach `docs/ideen-archiv.md` (lead-design). (4) Plan durch lead-tech nach dem Merge von
UI-HAEPPCHEN-D; I-102 berührt `order.ts`, nicht die Dateien von UI-D, aber `src/ui/app.ts` ist beim Plan gegen UI-D abzugleichen.

Regelbezug: gates.md Gate Spec (Stufe leicht), R653, R658 · Kosten bei Irrtum: eine Vorschau, die der Spieler als Zusage missversteht (Text «voraussichtlich»).

Entscheider: L0 · Anlass: Bericht lead-design design-I-102 · ADR: —

## R665 · 2026-10-16 · Kurzdesign I-097 angenommen; Plan I-097 + I-102 als UI-HAEPPCHEN-E jetzt

Ruling: `design/i097` @ `70efccc5` (11 AK, `pauseOverlayView(speed, modalOpen)` in `src/ui/pauseOverlay.ts`, kein Save, kein `src/sim/`) →
**angenommen**; O-1 (Farbe/Breite des Rands) und O-2 (Ort von `syncPauseOverlay()`) entscheidet der Plan. Freie Plätze (R475): lead-tech plant
**UI-HAEPPCHEN-E** = I-097 + I-102 (R664) jetzt, als Plan auf main-Stand mit Abgleich gegen den Plan UI-HAEPPCHEN-D (`3eb97a31`, Einhängepunkte in
`src/ui/app.ts`, Block in `src/style.css`). Umsetzung erst nach Merge von UI-HAEPPCHEN-D. Plan ohne Testläufe (R464).

Regelbezug: gates.md Gate Spec (Stufe leicht), R464, R475, R663, R664 · Kosten bei Irrtum: ein Plan mit Nacharbeit bei den Einhängepunkten nach dem UI-D-Merge.

Entscheider: L0 · Anlass: Bericht lead-design design-I-097 · ADR: —

## R666 · 2026-10-16 · Gate Merge TOOL-METRIK-ZEITRAUM: OK, Merge nach dem Push REL-23; Inaktiv-Signal lead-qa ohne Retro

Ruling: (1) `tool/metrik-zeitraum` @ `fa6d7c48` (T1 Session-Beginn als Zeitraum für Flake und Steuerungsanteil, T2 Cache-Write 5 min in
Erstladung/Wachstum/Pause, T3 arc42; `make studio-test` 913 grün, `studio-lint`, `docs-check` Exit 0; Rot-Beleg vorhanden; Echtlauf dbac5fc4:
Datei = `--since`, Summe 6,2 + 15,0 + 5,8 = 27,0 % = bestehende Zeile) → **Gate Merge OK**. Review-BEDENKEN angenommen: der Session-Beginn gilt
auch für die Transkript-Auswertung (gewollt, Datei und `--since` stimmen überein). Restabweichung Steuerungsanteil Datei 52,2 % gegen
`--efficiency` 47,2 % (verschiedene Transkriptmengen) → Messauftrag an die nächste Retro. Merge durch lead-production erst nach dem Push
REL-23, damit der geprüfte Push-Hash nicht wandert. E-069 gilt mit dem Merge als umgesetzt; Bewertung in der nächsten Session-Retro.
(2) Signal «lead-qa inaktiv» (Hook) beim Release-Check: der Lead wartet in einem langen `make zeitreserve-gate` (Prozess läuft, Heartbeat
06:50Z) — kein Vorfall, keine Ad-hoc-Retro; Befund an die Retro, ob lange Make-Läufe als Heartbeat zählen sollen.

Regelbezug: gates.md Gate Merge, R335, R659, STUDIO.md Verbesserungsschleife · Kosten bei Irrtum: eine Ampelzahl, die sich gegenüber Altsessions leicht verschiebt.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-METRIK-ZEITRAUM, Hook-Signal · ADR: —

## R667 · 2026-10-16 · Push REL-23 «Fernangebot» mit Zeitreserve-Ausnahme; Gate Plan UI-HAEPPCHEN-E mit O-1/O-2

Ruling: (1) Release-Check REL-23 @ `2e7a269f` (Handoff `.studio/handoffs/2026-10-16-lead-qa-REL23-PUSH.md`): `make push-check` Exit 1 allein
durch die strenge Zeitreserve zweier Tests ausserhalb des Handel-2-Diffs (`tests/render/wildlife.test.ts` RF-10, `tests/sim/unlock-timeline.test.ts`
AK-BAS-03); alles andere grün (4034 Tests inkl. Balancing, `studio-test` 907, Lint, Build, `pages-limit`). Die vorgeschriebene Nachmessung
`make zeitreserve-gate` Exit 0 (Reserve 0) → **Lastartefakt** nach gates.md R598 V1/R585; Release-Notiz stimmt mit dem Code. → **Gate Push OK mit
bewusster Ausnahme**, Push `fb1e5e46..2e7a269f` per geprüftem Hash; CI entscheidet; danach `gh workflow run Pages --ref main`. Die beiden Tests
und die zwei Restbefunde aus HANDEL-2 (`tests/ui/farOrder.test.ts:198` tautologisch, tote Klausel `src/sim/save.ts` ≈ 882) → `docs/beobachtungen.md`
durch lead-production mit releases.json (REL-23 live). (2) Danach Freigaben aus R662 (UI-HAEPPCHEN-D Umsetzung, 21 Starts) und R666 (Merge
TOOL-METRIK-ZEITRAUM). (3) Plan UI-HAEPPCHEN-E `plan/ui-haeppchen-e` @ `ac14dcb5`: O-1 Rand `box-shadow: inset 0 0 0 4px var(--gold)` + Innenschatten
aus `--bg`, Banner `--wood/--parchment/--gold`, kein neuer Farbwert; O-2 `applyPauseOverlay(...)` als erste Zeile in `refresh()` — beide
angenommen; Gate Plan durch lead-qa; Budgetantrag 16 Starts mit dem Gate.

Regelbezug: gates.md Gate Push und R598 V1, R335, R585, R662, R666 · Kosten bei Irrtum: ein roter CI-Lauf wegen Timeout eines Fremdtests (Rerun oder Timeout-Fix nach E-043).

Entscheider: L0 · Anlass: Berichte lead-qa REL23-PUSH, lead-tech plan-UI-HAEPPCHEN-E · ADR: —

## R668 · 2026-10-16 · Gate Plan UI-HAEPPCHEN-E: OK mit 3 Auflagen; Umsetzung nach Merge UI-HAEPPCHEN-D, Budget 16 Starts

Ruling: Urteil lead-qa (`.studio/handoffs/2026-10-16-lead-qa-gate-plan-UI-HAEPPCHEN-E.md`) übernommen: **OK mit Auflagen** in T05 — (1) Messweg
der Overlay-Verzögerung: Tastendruck bis `hidden`-Wechsel, 5 Wiederholungen, Schwelle 200 ms, Ein-/Ausblenden getrennt; (2) alle Pausewege im
Browser: Knopf, P, Leertaste, Tempo-Taste, Neustart und Laden aus dem Menü, jeweils ohne weitere Eingabe; (3) Auftragskarte nach angenommenem
Fernauftrag und nach Fernlieferung (Sperrperiode) im Browser. Die Plan-Instanz setzt die Auflagen auf `plan/ui-haeppchen-e` um. Umsetzung
Budget 16 Starts, Parallelität 1, startet nach Gate Merge und Merge von UI-HAEPPCHEN-D.

Regelbezug: gates.md Gate Plan, R664, R665, R667 · Kosten bei Irrtum: ein Pauseweg ohne Overlay (Fix-Runde).

Entscheider: L0 · Anlass: Bericht lead-qa gate-plan-UI-HAEPPCHEN-E · ADR: —

## R669 · 2026-10-16 · REL-23 live; freier Platz → Paket BEOB-15 (Zeitreserve und HANDEL-2-Restbefunde)

Ruling: (1) REL-23 «Fernangebot» **live**: CI 38864279487 grün, Pages 38864281718 grün; releases.json, state.md und drei Beobachtungen nachgeführt;
TOOL-METRIK-ZEITRAUM gemergt `3e5bc5bd` (lokal). Zuordnung UI-HAEPPCHEN-D → REL-24 (Vorschlag lead-production) angenommen. (2) Freier Platz (R475):
Paket **BEOB-15** (Stufe leicht, lead-tech sonnet, Budget 4): die drei Einträge vom 2026-10-16 in `docs/beobachtungen.md` (Zeilen ≈ 296–298) —
Timeouts der zwei lastabhängigen Tests nach E-043 anheben bzw. Ursache beheben, tautologischen Test in `tests/ui/farOrder.test.ts:198` mit
unabhängigem Erwartungswert, tote Klausel in `src/sim/save.ts` ≈ 882 entfernen (kein Save-Wechsel). Dateien disjunkt zu UI-HAEPPCHEN-D.

Regelbezug: R475, R667, E-043, CLAUDE.md «Trivial-Fixes» · Kosten bei Irrtum: ein Timeout, der einen echten Leistungsrückgang verdeckt (Zeitmessung vorher/nachher im Bericht).

Entscheider: L0 · Anlass: Bericht lead-production REL-23-NACH · ADR: —

## R670 · 2026-10-16 · Design I-091/I-094: I-094 verworfen (Kenntnis an Nutzer), I-091 als V-A «Kulanz»; Gate Spec

Ruling: `design/i091-i094` @ `9e72f923` (Rechnung `design-economy-designer`). (1) **I-094 Darlehen verworfen** in dieser Form: kein Fenster
echter Wahl (vor U6 Pflichtzug, Schwelle r = 0,04 gegen 0,42 beim Bürger-Aufstieg; Aufschlag 20 % → +3277, 30 % → −27 761, nicht vorhersehbar;
ab U6 wirkungslos; Geldüberschuss im Spätspiel unverändert). Da der Nutzer I-094 ausdrücklich anstossen liess (R663), geht der Entscheid als
Kenntnis N-101 in die Warteschlange; ohne Antwort gilt das Verwerfen, Archiv nach `docs/ideen-archiv.md` mit dem nächsten I-091-Schritt.
(2) **I-091 als V-A «Kulanz»**: nach 5 pünktlichen Lieferungen verzeiht der Kunde einen Fehlbestand einmal, ohne Geldfluss (19 AK); V-B
(Wertbonus 108 %) verworfen, weil er die I-047-Grenze L6 (b) reisst (3,17 % > 3 %). Spielerwirkung nach E-3 berichtigt. Save-Feld
`contract.deliveries`, Nummer im Gate Plan (R663). (3) Gate Spec durch lead-qa jetzt; Plan danach durch lead-tech (opus, Save-Änderung =
Prozessstufe voll), Umsetzung seriell **nach UI-HAEPPCHEN-E**, weil beide `src/ui/order.ts` berühren. (4) Befunde Controller-Ensemble und
`runColony`-Abbruch beim Sieg stehen in `docs/beobachtungen.md`.

Regelbezug: Verfassung §5, gates.md Gate Spec, R663, I-047 L6 · Kosten bei Irrtum: eine verworfene Idee, die der Nutzer doch will (Spec liegt vor, Wiederaufnahme ohne Neuarbeit).

Entscheider: L0 · Anlass: Bericht lead-design design-I-091-I-094 · ADR: —

## R671 · 2026-10-16 · Gate Spec I-091 V-A «Kulanz»: OK mit Auflagen A1–A4; Plan Stufe voll danach

Ruling: Urteil lead-qa (`.studio/handoffs/2026-10-16-lead-qa-gate-spec-I-091.md`) übernommen: **OK mit Auflagen** — A1 Widerspruch AK-TR-02/AK-TR-18
auflösen (Feld `becameLoyal` oder `loyal` nur beim Übergang; L0-Vorgabe: `becameLoyal`, weil der Dauerzustand `loyal` für die Anzeige gebraucht wird);
A2 AK-TR-05 präzisieren (`money` vor und nach Periodenbeginn identisch); A3 Randfälle Lager nach Kulanz aufgefüllt, Kulanz in Periode mit `farSkip`,
Kündigen direkt nach Kulanz; A4 Spec an R670 angleichen (V-B, O-1/E-2, «Stufe leicht» als verworfen/gestrichen), Helfertexte aus
`CONTRACT_LOYAL_AFTER`. lead-design setzt A1–A4 auf `design/i091-i094` um und verschiebt I-094 nach `docs/ideen-archiv.md` (R670). Danach Plan
durch lead-tech (opus, Stufe voll) mit den Plan-Hinweisen des Gates (Zeitraffer/präparierter Spielstand für AK-19, Kulanz-Zweig in `tickOrders`
wie `delivered`, vollständige Switches über `ContractEvent`, Fixture über `SAVE_VERSION - 1` plus v14-Kette, Mitzieh-Schritt, `deliveries: null`).

Regelbezug: gates.md Gate Spec, R663, R670 · Kosten bei Irrtum: eine doppelte «jetzt treu»-Meldung (Fix-Runde).

Entscheider: L0 · Anlass: Bericht lead-qa gate-spec-I-091 · ADR: —

## R672 · 2026-10-16 · Gate Merge BEOB-15: OK

Ruling: `fix/beob-15` @ `c10b6d09` (Timeout 10000 ms für RF-10 und AK-BAS-03 nach E-043, Aussage unverändert; `farOrder.test.ts` mit unabhängigem
Snapshot und Mutations-Rot-Beleg; tote Klausel in `isValidFarFields` entfernt, `SAVE_VERSION` 15; Zeiten vorher/nachher ohne Rückgang; `tsc`,
`lint`, `zeittests`, `conflicts`, `docs-check`, `make check` inkl. Balancing, `make zeitreserve-gate` Exit 0; Review OK) → **Gate Merge OK**.
lead-production merged `--no-ff` (lokal) und trägt den Restbefund RF-4 und «E5 nie im R4-Sperrbereich» (`wildlife.test.ts`, > 500 ms) in
`docs/beobachtungen.md` ein. Die `make check`-Warnung «state.md nur bis R658» erledigt die Session-Ende-Routine.

Regelbezug: gates.md Gate Merge, R669, E-043 · Kosten bei Irrtum: ein Timeout, der einen Leistungsrückgang verdeckt (Messwerte zeigen keinen).

Entscheider: L0 · Anlass: Bericht lead-tech BEOB-15 · ADR: —

## R673 · 2026-10-16 · Gate Merge UI-HAEPPCHEN-D + I-109: OK; Final-Review nie als Fortsetzung

Ruling: `feat/ui-haeppchen-d` @ `dd8bc84e` (Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-UI-HAEPPCHEN-D.md`): frischer Final-Review opus OK,
`make zeitreserve-gate` Exit 0 (2. Lauf nach Testsperre), Prüfliste vollständig (53 Screenshots), `src/sim`-Diff leer, `SAVE_VERSION` 15, README/arc42
nachgeführt → **Gate Merge OK**. lead-production merged `--no-ff` (lokal), releases.json REL-24 Stufe Merge. Vier niedrige Reviewer-Hinweise (Log-
Reihenfolge bei gleichem Tick, Tooltip «Leer in 0 s» bei Bestand 0, doppelte `goodsBalance`-Rechnung `hud.ts:368`, DOM-Test `updateHud`) →
`docs/beobachtungen.md` (letzter schon eingetragen). Danach startet UI-HAEPPCHEN-E (R668, Budget 16).
**Prozessbefund (belegt in `.studio/events.jsonl`):** Der Controller liess den Final-Review als `SendMessage`-Fortsetzung des sonnet-Reviewers laufen;
eine Fortsetzung behält das Modell der Ursprungsinstanz. Ab sofort steht in jedem Umsetzungs-Briefing: «Final-Review immer als frischer
`qa-code-reviewer`-Start mit `model: opus`, nie als Fortsetzung». Handbuch-/lernen.md-Eintrag durch studio-coach in der Session-Retro.

Regelbezug: gates.md Gate Merge, STUDIO.md Modellwahl (Final-Review opus), R662 · Kosten bei Irrtum: ein Merge mit vier niedrigen Hinweisen.

Entscheider: L0 · Anlass: Bericht lead-qa gate-UI-HAEPPCHEN-D · ADR: —

## R674 · 2026-10-16 · Plan I-091: Save-Nummer = main + 1 beim Merge; Ownership-Ausnahme `types.ts`; Gate Plan

Ruling: Plan `plan/i091` @ `f743b17e` (T00–T06, 22 AK, Plan-Review BEDENKEN → 6 Befunde eingearbeitet). (1) **Save-Version** von I-091 =
`SAVE_VERSION` auf main + 1 zum Zeitpunkt des Merges (Arbeitsannahme v16); T06 setzt sie, das Gate Merge prüft sie gegen main und gegen
Erweiterung 1 (Nutzer-Session). Landet Erweiterung 1 vorher, renummeriert T06 (Fix-Runde vor dem Gate). (2) **Ownership-Ausnahme**: die
Typänderung `excused` in `src/sim/types.ts` liegt in T03 beim `tech-ui-engineer`, damit `tsc` zwischen den Tasks grün bleibt. (3) Gate Plan durch
lead-qa jetzt; Umsetzung Budget-Antrag 16 Starts wird mit dem Gate entschieden, Start erst nach Merge UI-HAEPPCHEN-E (`order.ts`).

Regelbezug: gates.md Gate Plan, R638, R663, R670, R671 · Kosten bei Irrtum: eine Renummerierung an 7 Stellen.

Entscheider: L0 · Anlass: Bericht lead-tech plan-I-091 · ADR: —

## R675 · 2026-10-16 · Gate Plan I-091: OK mit Auflagen P1–P3; Budget 18 Starts nach Merge UI-HAEPPCHEN-E

Ruling: Urteil lead-qa (`.studio/handoffs/2026-10-16-lead-qa-gate-plan-I-091.md`) übernommen: **OK mit Auflagen** — P1 `tests/ui/autoLog.test.ts`
(Contract-Literal Z. 21, `contractNotice`) in T01-Mitzieh-Liste, Dateimatrix und Laufschritte T01/T03; P2 «Final-Review immer als frischer
opus-Start, nie als Fortsetzung» (R673) in Index und Umsetzer-Briefing; P3 T06 Schritt 7 ganze Dateien statt `-t`-Filter (oder Trefferzahl
verlangen), Nummerierung Schritt 3 bereinigen. Die Plan-Instanz setzt P1–P3 auf `plan/i091` um. Budget der Umsetzung **18 Starts** (Controller-
Instanzen eingerechnet), Parallelität 1; Start nach Merge UI-HAEPPCHEN-E.

Regelbezug: gates.md Gate Plan, R673, R674 · Kosten bei Irrtum: ein rot werdender UI-Test im Mitzieh-Schritt (Fix-Runde).

Entscheider: L0 · Anlass: Bericht lead-qa gate-plan-I-091 · ADR: —

## R676 · 2026-10-16 · Freie Plätze: Kurzdesigns I-108, I-101 + I-103 (Pool IDEEN-10)

Ruling: Plan I-091 mit Auflagen `plan/i091` @ `d2b4f6c8` (R675 erfüllt). Freie Plätze (R475, R445) während UI-HAEPPCHEN-E läuft: Kurzdesigns
Stufe leicht (lead-design, sonnet) für die nächsten Ränge aus IDEEN-10, die Handel 2 voraussetzen bzw. kein Save brauchen: (1) **I-108**
«Einnahmen und Unterhalt getrennt» (S); (2) **I-101** «Fernauftrag-Marke Seekarte» + **I-103** «Routen-Bilanz» gemeinsam (beide Seekarte/
Routen, Empfehlung «mit I-101»). Umsetzung erst nach I-091 bzw. nach Bündelungsprüfung durch lead-tech. I-104 und I-105 bleiben geparkt.

Regelbezug: R445, R475, R653 · Kosten bei Irrtum: zwei Kurzdesigns, die vor der Umsetzung nachgeschärft werden.

Entscheider: L0 · Anlass: freie Kapazität · ADR: —

## R677 · 2026-10-16 · Kurzdesigns I-108 und I-101/I-103 angenommen; Plan UI-HAEPPCHEN-F

Ruling: (1) **I-108** `design/i108` @ `059b87f9` (14 AK, Chip «+Einnahmen / −Unterhalt» je Minute, Netto im Tooltip/aria-label, Kurzform ab 10 000,
Helfer `src/ui/balanceFlow.ts`) → **angenommen**. (2) **I-101 + I-103** `design/i101-i103` @ `09cbe002` (18 AK) → **angenommen** mit: ein Strang,
I-101 zuerst; I-103 **Variante B** (Potenzial mit Deckel durch den nominalen Überschuss der Quellinsel, kein Save, als «nominal» beschriftet;
Variante C erst nach Playtest); Marke hohl für offenes Fernangebot, gefüllt für angenommenen Fernauftrag. (3) Plan **UI-HAEPPCHEN-F** =
I-108 + I-101 + I-103 durch lead-tech (sonnet, Stufe leicht: kein Save, neue Sim-Datei `src/sim/routeBalance.ts` nur lesend), abgeglichen
gegen Plan UI-HAEPPCHEN-E (`ca6d8ee6`) und Plan I-091 (`d2b4f6c8`); lead-tech bestätigt die Kosten von `goodsBalance` je Quellinsel. Umsetzung
nach Merge UI-HAEPPCHEN-E; parallel zu I-091 nur bei disjunkten Dateien (Dateimatrix im Plan).

Regelbezug: gates.md Gate Spec (Stufe leicht), R445, R475, R676 · Kosten bei Irrtum: eine Routen-Bilanz, die als Untergrenze zu vorsichtig wirkt (Beschriftung «nominal»).

Entscheider: L0 · Anlass: Berichte lead-design design-I-108, design-I-101-I-103 · ADR: —

## R678 · 2026-10-16 · Plan UI-HAEPPCHEN-F: Abweichungen 1–4 angenommen; parallel zu I-091; Gate Plan

Ruling: Plan `plan/ui-haeppchen-f` @ `5b842134` (T00–T07, 32 AK, Reihenfolge I-101 → I-103 → I-108). Abweichungen vom Kurzdesign **angenommen**:
(1) `routeBalance` je 100 Ticks, UI rechnet mit `perMinute` um (Sim ohne `TICK_MS`); (2) `shipsKey` strukturell, Bilanzzeile per `setText` nur bei
neuem Tick (AK-B8 sinngemäss); (3) `drawSeaMap`-Aufruf in `hud.ts`, `app.ts` ohne Diff; (4) `balanceText` unverändert, zwei Erwartungen in
`hud.test.ts` mit exaktem neuem Wert mitgezogen. **F läuft nach Merge UI-HAEPPCHEN-E parallel zu I-091** (Code und Tests disjunkt; Doku-Konflikte
README/arc42/beobachtungen löst der spätere Branch per Merge von main) — studioweit damit 2 Umsetzungsstränge, je höchstens 1 Browser-Lauf gleichzeitig
koordiniert über R424 (≤ 2 Browser-Läufe). Gate Plan durch lead-qa; Budgetantrag 21 Starts mit dem Gate.

Regelbezug: gates.md Gate Plan, R424, R677 · Kosten bei Irrtum: ein Doku-Merge-Konflikt zwischen zwei Strängen.

Entscheider: L0 · Anlass: Bericht lead-tech plan-UI-HAEPPCHEN-F · ADR: —

## R679 · 2026-10-16 · Gate Plan UI-HAEPPCHEN-F: OK mit 3 Auflagen; Budget 21 Starts, zwei Stränge mit I-091

Ruling: Urteil lead-qa (`.studio/handoffs/2026-10-16-lead-qa-gate-plan-UI-HAEPPCHEN-F.md`) übernommen: **OK mit Auflagen** — (1) hoch, T04: `build()`
setzt `balTick` zurück, Testfall «Routenwechsel bei gleichem Tick» (Pause); (2) T02: `farMark.test.ts`/`seaMapView.test.ts` bauen Fernaufträge
über Sim-Funktionen/Helfer, keine `Contract`-Literale (I-091 macht neue Felder zur Pflicht); (3) T05: AK-5 zusätzlich mit unabhängig berechnetem
Wert. Plan-Instanz setzt sie auf `plan/ui-haeppchen-f` um. Budget **21 Starts** für F (Parallelität 1 im Strang); studioweit laufen F und I-091
(18 Starts) nach Merge UI-HAEPPCHEN-E als **zwei Stränge**, je ein Controller, Testlock R380, ≤ 2 Browser-Läufe (R424). Merge-Reihenfolge: I-091
vor F (F T07 Doku wartet auf I-091; F holt main per Merge vor seinem Gate).

Regelbezug: gates.md Gate Plan, R380, R424, R675, R678 · Kosten bei Irrtum: eine leere Bilanzzeile nach Routenwechsel in der Pause.

Entscheider: L0 · Anlass: Bericht lead-qa gate-plan-UI-HAEPPCHEN-F · ADR: —

## R680 · 2026-10-16 · Gate Merge UI-HAEPPCHEN-E (I-097 + I-102): OK; danach I-091 und UI-HAEPPCHEN-F

Ruling: `feat/ui-haeppchen-e` @ `af4815b3` (Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-UI-HAEPPCHEN-E.md`): Final-Review opus als frischer Start
belegt (R673), Auflagen R668 (1)–(3) belegt, `src/sim`-Diff nur `previewOrder` (lesend), `SAVE_VERSION` 15, `make check` und `make zeitreserve-gate`
Exit 0, Merge konfliktfrei, Ideen-Konfliktauflösung ohne Verlust → **Gate Merge OK**. Zusatzaufruf `applyPauseOverlay` in `setSpeed` (Abweichung von
O-2) angenommen. lead-production merged `--no-ff` (lokal), releases.json REL-24 (UI-HAEPPCHEN-E gemergt). Danach starten I-091 (R675, 18 Starts) und
UI-HAEPPCHEN-F (R679, 21 Starts) als zwei Stränge.

Regelbezug: gates.md Gate Merge, R668, R673, R675, R679 · Kosten bei Irrtum: ein Overlay, das bei Modal-Wechsel bis 170 ms später erscheint.

Entscheider: L0 · Anlass: Bericht lead-qa gate-UI-HAEPPCHEN-E · ADR: —

## R681 · 2026-10-16 · REL-24 release-bereit (lokal); REL-25 mit I-091 und UI-HAEPPCHEN-F; zwei Umsetzungsstränge gestartet

Ruling: UI-HAEPPCHEN-E gemergt `e854e59a`, releases.json `600cd4b8`. **REL-24** (UI-HAEPPCHEN-D + I-109, UI-HAEPPCHEN-E mit I-097 + I-102, BEOB-15,
TOOL-METRIK-ZEITRAUM; kein Save-Wechsel) ist release-bereit; Release-Check und Push in der Folgesession (R335, Push REL-23 war der Push dieser
Session). **REL-25** «Treue und Übersicht» (Vorschlag lead-production angenommen): I-091 (Save v16 nach R674) und UI-HAEPPCHEN-F. Beide Stränge laufen
jetzt parallel (R679), Merge-Reihenfolge I-091 vor F.

Regelbezug: R335, R674, R679, R680 · Kosten bei Irrtum: ein Release-Zuschnitt, der vor dem Push neu sortiert wird.

Entscheider: L0 · Anlass: Bericht lead-production merge-UI-HAEPPCHEN-E · ADR: —

## R682 · 2026-10-16 · Nutzerauftrag Altlasten: Paket CTX-ALTLAST (Kontext schlank halten)

Ruling: Nutzerauftrag «Altlasten wie Screenshots füllen den Kontext neuer Sessions, löse das Problem». Auslegung: Messung zuerst (was lädt eine neue
Session, was lesen Leads und Arbeiter tatsächlich), dann drei Hebel: (1) **Screenshots** `.studio/qa/` (7,3 GB, 7643 Dateien, git-ignoriert, liegt
in Dropbox): Bilder von Paketen, die in einem **live** Release stecken (`releases.json`), werden gelöscht, Text-Berichte bleiben; Löschen innerhalb
des Repos ist nach Verfassung §6.4 erlaubt, aber nur nach Trockenlauf-Liste. Dazu ein wiederholbares Werkzeug `make studio-aufraeumen`
(Trockenlauf als Standard, `--apply` zum Löschen) und ein Schritt in der Ende-Routine. (2) **Erledigte Specs und Pläne** (502 Dateien,
6,9 MB) von live Releases per `git mv` nach `docs/superpowers/archiv/`; eine `.ignore`-Datei im Repo-Root blendet Archive für Grep/Glob
(ripgrep) standardmässig aus, explizite Pfade bleiben lesbar. (3) **rulings.md** (7874 Zeilen) auf die jüngsten Rulings kürzen, Älteres nach
`rulings-archiv.md`; Verweise «rulings per grep» im Handbuch auf beide Dateien. Nichts aus REL-24/REL-25 und laufenden Strängen wird archiviert.
Wirkung wird per Probe belegt (Grep-Treffer und Session-Start-Kontext vorher/nachher). Paket an lead-production, Branch im Worktree, Gate Merge L0.

Regelbezug: Verfassung §6.4, R597 (DOC-ARCHIV), E-010 · Kosten bei Irrtum: ein archivierter Plan, der per expliziten Pfad nachgelesen werden muss;
gelöschte Screenshots alter Playtests (Berichte bleiben).

Entscheider: L0 · Anlass: Nutzerauftrag 2026-10-16 · ADR: —

## R683 · 2026-10-16 · UI-HAEPPCHEN-F bereit bis auf Prüfläufe; AK-3 auf 17 Zeichen; parallele L0-Session vermerkt

Ruling: (1) `feat/ui-haeppchen-f` @ `fd3379e4` (T00–T07, Final-Review opus frisch BEDENKEN → Fix → Delta OK, Auflagen R679 erfüllt, `src/sim`-Diff nur
`routeBalance.ts`; `goodsBalance` 6,62 ms in `denseScene` ohne `cov`, 0,056 ms mit, Neuberechnung nur bei neuem Tick) ist bereit bis auf `make check`,
`make zeitreserve-gate` (Abbruch durch Last > 8, Testlock R380) und den main-Merge nach I-091. **AK-3** wird auf höchstens 17 Zeichen korrigiert
(`+999,9k / −999,9k`, einzeilig bei 1280 px belegt). Nach Merge I-091: Controller F holt main, fährt `make check` und `make zeitreserve-gate` bei
ruhiger Last, dann Gate Merge durch lead-qa. Die Abweichung «Zeiten main/Branch nicht unmittelbar nacheinander» wird mit diesem Lauf nachgeholt.
(2) Bugfix Verlustfarbe Bilanz-Chip (`color: inherit` überschrieb `negative`, seit I-062) ist Teil von F. (3) **Parallele L0-Session**
(`session_01MawUE3FwF6Hg8n5WwNxwyB`, R682 CTX-ALTLAST, Nutzerauftrag) arbeitet im selben Repo: abweichend von R129/R324 vom Nutzer gestartet,
geduldet; Rulings-Nummern werden vor jedem Eintrag neu gelesen, R682 berührt REL-24/REL-25 und laufende Stränge nicht.

Regelbezug: gates.md Gate Merge, R129, R324, R380, R679, R682 · Kosten bei Irrtum: eine doppelt vergebene Ruling-Nummer (Umbenennung).

Entscheider: L0 · Anlass: Bericht lead-tech UI-HAEPPCHEN-F, R682 im Log · ADR: —

## R683b · 2026-10-16 · Gate Merge CTX-ALTLAST: OK mit zwei Nachträgen; Handbuch 1.56 angenommen

Ruling: `chore/ctx-altlast` @ `76ceb732` (Handoff `.studio/handoffs/2026-10-16-lead-production-CTX-ALTLAST.md`): kein `src/`-Diff, `make check`,
`studio-test`, `docs-check` grün, Rulings wörtlich verschoben (Überschriften vor/nach gleich), Probe belegt: Grep-Werkzeug 238 → 129 Treffer ohne
Archivpfade, `rulings.md` 617 → 97 KB, `.studio/qa` 7,27 → 4,84 GB → **Gate Merge OK**. Handbuch 1.56 (Ende-Schritt 2b, Archivregel) angenommen.
Vor dem Merge auf demselben Branch: (1) Suchhinweis in alle Personas `.claude/agents/*.md` und Briefing-Vorlage: Volltextsuche mit dem
Grep-Werkzeug oder `rg <muster> .`, nicht `grep -r` (Beleg: 24361 `grep` gegen 5 `rg` in den Transkripten; `.ignore` wirkt nur auf rg/Grep);
`grep <muster> <datei>` auf eine genannte Datei bleibt erlaubt. (2) Alias-Feld in `releases.json` für Paketordner ohne Zuordnung (z. B.
`ui-haeppchen-a/b/c`, `m14-e1`, `h-r*`), soweit ihr Paket belegbar in einem live Release steckt; danach Trockenlauf und `ARGS=--apply`.
Danach Merge `--no-ff` nach main (lokal, kein Push).

Regelbezug: R682, R680 (Merge durch lead-production), R233 (1) Persona-Änderung · Kosten bei Irrtum: ein Persona-Hinweis, der eine Suche um einen
Archivtreffer verkürzt.

Entscheider: L0 · Anlass: Bericht lead-production CTX-ALTLAST · ADR: —

## R684 · 2026-10-16 · Doppelte Nummer R683; I-091 bereit → Gate Merge mit Delta-Review

Ruling: (1) R683 ist doppelt vergeben (parallele L0-Session, R682): der Eintrag «Gate Merge CTX-ALTLAST» gilt als **R683b**; Absprache an die andere
Session per Nachricht, beide lesen die letzte Nummer direkt vor dem Eintrag. (2) `feat/i091` @ `7268f800` (T00–T06, Save **v16** mit `migrateV15ToV16`,
`contract.deliveries = 0`; `make check` und `make zeitreserve-gate` Exit 0; Final-Review opus frisch BEDENKEN → zwei Fixes ohne Delta-Review) → Gate
Merge durch lead-qa mit **Delta-Review** der Fixes (frischer `qa-code-reviewer` opus) und Prüfung, dass main weiterhin `SAVE_VERSION` 15 hat
(Erweiterung 1 nicht vorher gelandet). Mitzieh `tests/sim/orders.test.ts` (ein Literal) angenommen. Konfliktauflösung `docs/ideen.md`/`ideen-archiv.md`
(I-094 im Archiv, I-091 Status) prüft lead-qa stichprobenartig; I-091-Status beim Merge auf «gemergt» nachziehen.

Regelbezug: gates.md Gate Merge, R129, R673, R674, R682 · Kosten bei Irrtum: ein Fix ohne unabhängige Prüfung im Release.

Entscheider: L0 · Anlass: Bericht lead-tech I-091, Doppelnummer im Log · ADR: —

## R685 · 2026-10-16 · Aufräumen wird Daueraufgabe von lead-production, ausgelöst durch Schwellen im Start-Kontext

Ruling: Nutzerauftrag «das Studio soll Altlasten künftig selbst erkennen, darauf hinweisen und aufräumen, nicht immer, aber wenn es sich lohnt».
Auslegung: (1) **Erkennen** übernimmt ein Werkzeug, nicht ein Agent: `aufraeumen.py --check` misst Schwellen (Startwerte: `.studio/qa` > 2 GB;
`rulings.md` > 150 Rulings oder > 200 KB; > 20 Specs/Pläne von live Releases ausserhalb des Archivs; `.studio/events.jsonl` > 50 MB;
`.studio/archiv` > 500 MB) und schreibt bei Überschreitung eine Zeile «Aufräumen fällig: <Grund, Grösse>» in den SessionStart-Kontext (wie «Fällige
Retros»). Schwellen stehen in einer Konfigurationsdatei unter `tools/studio/`, nicht im Code. (2) **Hinweisen**: L0 nennt die fällige Zeile im
Start-Bericht. (3) **Durchführen**: Eigentümerin ist **lead-production** (Persona-Abschnitt «Haushalt»); L0 startet sie bei fälliger Zeile als Paket
`HAUSHALT-nn` ohne Nutzerfrage, sobald ein Agentenplatz frei ist (vor neuen Ideen-Runden, nach laufenden Gates). Sie führt Trockenlauf, `--apply`,
Archiv-`git mv` und Rulings-Verschieben nach R682/R683b aus, misst vorher/nachher und meldet Ergebnis im Bericht; Gate Merge L0 wie üblich. Ohne
fällige Zeile wird nicht aufgeräumt. Umsetzung im laufenden Paket CTX-ALTLAST als Nachtrag (3).

Regelbezug: R682, R683b, Verfassung §5 (keine Rückfrage), §6.4 · Kosten bei Irrtum: eine Aufräumrunde zu früh oder zu spät; Schwellen sind per
Konfiguration nachstellbar.

Entscheider: L0 · Anlass: Nutzerauftrag 2026-10-16 · ADR: —

## R686 · 2026-10-16 · Gate Merge I-091 «Kulanz»: OK, Save v16; danach UI-HAEPPCHEN-F holt main

Ruling: `feat/i091` @ `7268f800` (Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-I-091.md`): Delta-Review opus frisch OK, main `SAVE_VERSION` 15 →
Branch 16 mit `migrateV15ToV16`, v14-Kette und Abweisen (`deliveries` fehlt/`null`/negativ/2.5/String), Balancing und Controller ohne Diff, `make check`
und `make zeitreserve-gate` Exit 0, Merge konfliktfrei, Ideen vollständig → **Gate Merge OK**. **Save v16 gehört I-091**; Erweiterung 1 (Nutzer-Session)
nimmt die nächste freie Nummer. lead-production merged `--no-ff` (lokal), setzt I-091 in `docs/ideen.md` auf «gemergt (R686)», releases.json REL-25.
Danach holt UI-HAEPPCHEN-F main per Merge und fährt `make check` und `make zeitreserve-gate` (R683). Hinweis Vertragskarte zweizeilig bei 1280 px
bleibt Beobachtung (schon eingetragen).

Regelbezug: gates.md Gate Merge, R673, R674, R684 · Kosten bei Irrtum: eine Spielstand-Migration, die ein Sonderfall übersieht (Abweisen statt Absturz).

Entscheider: L0 · Anlass: Bericht lead-qa gate-I-091 · ADR: —

## R687 · 2026-10-16 · Gate CTX-ALTLAST abgeschlossen; Fälligkeit `.studio/qa` nach löschbarer Menge statt Gesamtgrösse

Ruling: CTX-ALTLAST lokal gemergt `a567ba45` (`.studio/qa` 7,27 → 4,51 GB, Aliase `qaAliases`, `--check` 0,1 s, Hook-Abschnitt «Aufräumen fällig»
per Echtlauf belegt, Personas mit Suchhinweis, Handbuch 1.57) → angenommen. Entwurf lead-production «`qaMaxGB` auf 5» abgelehnt: die Gesamtgrösse misst
nicht, ob sich Aufräumen lohnt. Stattdessen gilt `.studio/qa` als fällig, wenn der **Trockenlauf mindestens 500 MB löschbare Bilder** findet
(`qaMinFreeMB: 500` ersetzt `qaMaxGB`; der Trockenlauf läuft in 0,1 s). So erscheint keine wirkungslose `HAUSHALT`-Runde; ab dem Ablauf der
14-Tage-Regel (≈ 2026-10-30) meldet der Check sich von selbst. Umsetzung als Fortsetzung lead-production (kein neuer Start).

Regelbezug: R682, R683b, R685 · Kosten bei Irrtum: eine Aufräumrunde, die bei 400 MB löschbar noch nicht anläuft.

Entscheider: L0 · Anlass: Bericht lead-production CTX-ALTLAST (Nachtrag 4) · ADR: —

## R688 · 2026-10-16 · Session-Plan: F prüfen und mergen, Push REL-24+REL-25 gemeinsam; Ortsrand in zwei Releases, Spec Teil 1 jetzt

Ruling: (1) **UI-HAEPPCHEN-F** (`feat/ui-haeppchen-f` @ `f4da449e`, main mit I-091 schon eingemergt): Last jetzt ≈ 3 → lead-tech fährt `make check`,
`make zeitreserve-gate` und den Zeitvergleich main/Branch (R683 (1)); danach Gate Merge lead-qa, Merge lead-production. (2) **Push**: main enthält
I-091 schon; REL-24 und REL-25 gehen daher **in einem Push** nach dem F-Merge (R335, ein Push je Session), Release-Check lead-qa über beide; ohne
F-Merge bis zur Zeitreserve geht REL-24 + I-091 allein. (3) **Ortsrand**: Vorentscheide der Nebensession (O1–O10, Handoff
`.studio/handoffs/2026-10-16-lead-art-ortsrand.md`) übernommen, ADR-015 «Kern und Anbauten» angenommen (Nummer beim Merge prüfen). Zuschnitt in
**zwei Releases**: «Wege und Kanten» (ORT-1, ORT-K1, ORT-K2, ORT-3) zuerst, «Hof und Anbauten» (ORT-2, ORT-4) danach; ORT-5 bleibt Kann im Pool.
`design/ortsrand` @ `21fe2599` per Merge nach main (nur Doku), Pool-Einträge in `releases.json`. Spec für Teil 1 jetzt (freie Plätze, R475), nur
`src/render/`, kein Save. (4) Beobachtungen (20 Einträge, unter der Pflichtschwelle 30): Auswertung BEOB-AUSW durch lead-production, da Plätze frei.
(5) Fällige Retros (Cache-Write 5 min, Flake-Verdacht zwei Sessions rot): eine Ad-hoc-Retro studio-coach mit Hebel-Pflicht (R316).

Regelbezug: R335, R475, R519, R683, R686, R316 · Kosten bei Irrtum: ein Release-Zuschnitt, der vor der Einplanung von Teil 2 neu sortiert wird.

Entscheider: L0 · Anlass: Session-Start 66d37b15 · ADR: ADR-015 (angenommen)

## R689 · 2026-10-16 · Ad-hoc-Retro Ampeln: V1–V3 angenommen; E-064 bewerten, E-068 rückt nach; E-070 als Werkzeug-Paket

Ruling: Bericht `.studio/handoffs/2026-10-16-studio-coach-retro-ampel.md`. (1) Flake-Ampel ist Historienartefakt (0 Flakes seit 2026-10-14) → kein
Hebel nötig; Lastbezug wird mit **E-070** messbar: angenommen, Werkzeug-Paket TOOL-E070 (lead-tech sonnet, `tools/studio/efficiency.py` + Test),
ohne Experimentplatz wie E-043. (2) Cache-Write 5 min (dritte rote Retro, R316): Hebel ist **E-068** (ein Reviewer je Paket Stufe leicht). Platz
schaffen: studio-coach bewertet **E-064** jetzt (Zeitraum 10 Umsetzer-Pakete; seit R579 sind deutlich mehr gelaufen); ist sie bewertbar, schliesst sie
und E-068 startet sofort. Ist sie es nicht, startet E-068 trotzdem an E-064s Stelle nicht, sondern bleibt wartend und E-064 erhält eine Frist im Bericht.
(3) Messauftrag V3 (Wachstum nach Tool-Ergebnisgrösse für lead-tech, qa-code-reviewer, lead-design) an studio-coach, Frist 2026-10-23. Offene
Messaufträge R659 (4) bleiben bei der Session-Ende-Retro.

Regelbezug: R316, R659, E-043 · Kosten bei Irrtum: ein Experiment, das eine Session früher startet als sein Vorgänger sauber bewertet ist.

Entscheider: L0 · Anlass: Bericht studio-coach adhoc-2026-10-16-ampel · ADR: —

## R690 · 2026-10-16 · F Prüfläufe grün → Gate Merge lead-qa; BEOB-16 Gate Merge OK; UI-AUFRAEUM-4 Plan jetzt

Ruling: (1) `feat/ui-haeppchen-f` @ `f4da449e`: `make check` Exit 0, `make zeitreserve-gate` Exit 0 (loadStart 2,9), Zeitvergleich ohne Verstoss →
**Gate Merge durch lead-qa** (sonnet). (2) `docs/beob-16` @ `1a668f85` (nur Doku, 35 Einträge, Marke 2026-10-16) → **Gate Merge OK**; Merge durch
lead-production **nach** dem F-Merge in einem Start (beide berühren `releases.json`). (3) Pool-Paket **UI-AUFRAEUM-4** (Erzeugungs-Cache `order.ts`,
Menü «Krisen (neue Insel)», Rechtsklick bei gehaltener linker Taste, `aria-label` Ereignis-Knopf, Tooltip «Leer in 0 s») → Plan jetzt, Stufe leicht
(freier Platz, R475); der vorgeschlagene Einzel-Trivialfix «Krisen» geht darin auf. Einplanung in REL-26 nach Gate Plan. (4) Befund
`.worktrees/integrate` auf altem Hash: der Integrator holt vor dem Push main (Briefing).

Regelbezug: gates.md Gate Merge, R475, R683, R688 · Kosten bei Irrtum: ein Aufräum-Paket, das eine Session früher geplant wird als nötig.

Entscheider: L0 · Anlass: Berichte lead-tech UI-HAEPPCHEN-F, lead-production BEOB-16 · ADR: —

## R691 · 2026-10-16 · Gate Merge UI-HAEPPCHEN-F: OK; Merge F, dann BEOB-16; Ampel gelb → keine neue Welle

Ruling: `feat/ui-haeppchen-f` @ `f4da449e` (Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-UI-HAEPPCHEN-F.md`): Auflagen R679 belegt, Final-Review opus

- Delta OK (R673, Beleg im Handoff lead-tech), `src/sim` nur `routeBalance.ts` lesend, `SAVE_VERSION` 16, Balancing ohne Diff, Prüfläufe Exit 0, Merge-Probe
  konfliktfrei → **Gate Merge OK**. lead-production merged `--no-ff` F, danach `docs/beob-16` (R690 (2)), setzt I-101/I-103/I-108 auf «gemergt (R691)»,
  releases.json REL-25 (F gemergt), fährt `make check` auf main (Makefile geändert). Danach Release-Check REL-24+REL-25 durch lead-qa und Push nach
  Gate Push L0 (R688 (2)). Limit-Ampel gelb: keine neue Welle; laufende Pakete (ORT-A-Spec, IDEEN-11, Plan UI-AUFRAEUM-4, TOOL-E070, E-064) werden
  abgeschlossen, ihre Gates können in die Folgesession gehen.

Regelbezug: gates.md Gate Merge, R673, R679, R688, R690, R69 · Kosten bei Irrtum: ein Release mit einer Kopfzeilen-Anzeige, die nachgebessert wird.

Entscheider: L0 · Anlass: Bericht lead-qa gate-UI-HAEPPCHEN-F · ADR: —

## R692 · 2026-10-16 · Gate Ideen-Runde IDEEN-11: Priorisierung; Kurzdesigns erst in der Folgesession

Ruling: `docs/ideen-11` @ `cd76401e` (I-110–I-121, Handoff `.studio/handoffs/2026-10-16-lead-design-IDEEN-11.md`) → angenommen, Merge durch lead-production
nach dem F-/BEOB-16-Merge. Priorisierung L0 nach Nutzen/Aufwand: (1) **I-114 Fernangebot zur Wahl** (S, baut direkt auf Handel 2 auf) und (2) **I-120 +
I-118** «Wohlstandsklang und Aufstiegs-Funkeln» (S, ohne Risiko, Audio/Render) → Kurzdesign Stufe leicht in der Folgesession; (3) **I-112 Ratsbeschluss je
Stufe** (M, Save, neue Werte) → Kurzdesign Stufe voll danach. Pool: I-110 (Werte neu rechnen), I-119 + I-121 als ein Paket; I-111 als Baustein fürs nächste
Meilenstein-Brainstorming. Geparkt: I-115 (Erweiterung 1), I-117 (bis K3 geklärt), I-116 (bis I-114 live). Verworfen: I-113 (Geldsenke ohne Wahl).
Pool-Pflege (I-092 live, I-101/I-104/I-105/I-107 Status, Ranglisten IDEEN-09/-10 ins Archiv, I-094 «verworfen» angleichen) macht lead-production beim Merge
(R599). Limit-Ampel gelb: keine Kurzdesigns jetzt (R691).

Regelbezug: gates.md Gate Ideen-Runde, R445, R599, R691 · Kosten bei Irrtum: ein Kurzdesign in anderer Reihenfolge.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-11 · ADR: —

## R693 · 2026-10-16 · E-064 bestätigt; E-068 laufend mit Briefing-Zeile; Guard-Abweisungen als Ereignis in den Pool

Ruling: Bericht studio-coach (Nachtrag `.studio/handoffs/2026-10-16-studio-coach-retro-ampel.md`): (1) **E-064** «Guard sperrt `git stash`» → **behalten**
(15 Umsetzer-Pakete seit 2026-10-13, 0 Stash-Anwendungen, keine Rückmeldung «Guard im Weg»; Regel steht schon in Handbuch und Guard). Messlücke: Guard-Abweisungen
erzeugen kein Ereignis. (2) **E-068** laufend; Briefing-Zeile in `templates/briefing.md` übernommen (Pflichtzeilen, Stufe leicht ≥ 2 Tasks, Diff ≤ 300 Zeilen →
ein Reviewer am Ende); Messung ab dem ersten Briefing mit der Zeile. (3) Paket **TOOL-GUARD-EVENT** (Guard-Abweisungen als Ereignis `guard_block`) in den Pool,
Werkzeug ohne Experimentplatz, Einplanung in der Folgesession (Ampel gelb, R691).

Regelbezug: R316, R579, R689, R691 · Kosten bei Irrtum: ein Paket-Review, das einen Task-Befund erst am Ende findet.

Entscheider: L0 · Anlass: Bericht studio-coach EXP-E064-E068 · ADR: —

## R694 · 2026-10-16 · Gate Plan UI-AUFRAEUM-4: OK mit D-2; Umsetzung in der Folgesession, Reviewer nach E-068

Ruling: `plan/ui-aufraeum-4` @ `0880b39a` (Handoff `.studio/handoffs/2026-10-16-lead-tech-plan-UI-AUFRAEUM-4.md`, T00–T04, 12 AKs mit Rot-Beleg oder
Browser-Beleg, kein Save, kein `src/sim`) → **Gate Plan OK**. **D-2** angenommen: bei gehaltener linker Taste beendet der erste Rechtsklick nur den Zug, der
zweite legt das Werkzeug ab (wie Esc und Linienzug). Cache in `order.ts` entfällt, wenn T00 einen Faktor < 2 misst (Controller entscheidet nach Messung,
meldet im Bericht, kein Warten auf L0). Reviewer nach **E-068** (R693): bleibt der Paket-Diff ≤ 300 Zeilen, ein einziger Task-Reviewer am Ende statt zwei;
Final-Review opus und Playtest bleiben. Budget **8 Starts**, Parallelität 1; Umsetzung in der Folgesession (Ampel gelb, R691), Branch ab main nach F-Merge
(`5d8d4242`). Release-Zuordnung REL-26.

Regelbezug: gates.md Gate Plan, R690, R691, R693 · Kosten bei Irrtum: ein Rechtsklick, der einmal mehr gedrückt werden muss.

Entscheider: L0 · Anlass: Bericht lead-tech plan-UI-AUFRAEUM-4 · ADR: —

## R695 · 2026-10-16 · Gate Merge TOOL-E070: OK; Merge nach dem Push zusammen mit IDEEN-11

Ruling: `tool/e070` @ `66a7fed6` (Handoff `.studio/handoffs/2026-10-16-lead-tech-TOOL-E070.md`): `make studio-test` 934 grün, `make studio-lint` Exit 0,
Rot-Beleg vorhanden, Echtlauf zeigt je Flake die Last und «davon Last ≥ 8: 5 von 8», Review BEDENKEN nur niedrig → **Gate Merge OK**. Ownership-Abweichung
(eine Zeile `metrics.py`) angenommen. Merge durch lead-production **nach dem Push REL-24+REL-25** (geprüfter Hash bleibt stabil), im selben Start wie
`docs/ideen-11` @ `cd76401e` (R692). Nachträge: Handbuch-Zeile zur Flake-Anzeige (STUDIO.md ≈ Z. 467) setzt studio-coach in der Session-Ende-Retro;
die drei Testlücken (`load=0`, Kürzung auf 10 Namen, «Last ?» ohne Schlüssel) gehen als Beobachtung ein.

Regelbezug: gates.md Gate Merge, R689, R692 · Kosten bei Irrtum: eine Ampelzeile, die bei Last 0 falsch formatiert.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-E070 · ADR: —

## R696 · 2026-10-16 · Gate Spec ORT-A «Wege und Kanten»: OK mit E1–E5, E7; E6 erst messen; Plan in der Folgesession

Ruling: `design/ortsrand` @ `ad315b3d`, Spec `docs/superpowers/specs/2026-10-16-ort-a-wege-und-kanten.md` (AK-01–AK-57, V1–V8; Handoff
`.studio/handoffs/2026-10-16-lead-art-ORT-A-spec.md`; Testbarkeit lead-qa «testbar mit Auflagen», alle Blocker eingearbeitet) → **Gate Spec OK**. Angenommen:
**E1** keine Variante-0-Hash-Änderung in ORT-A, eigener Bildmodus-Referenzhash als Schutz (ersetzt die Hash-Liste aus O8 für ORT-A); **E2** Bodenverlauf mit
Dichte im Radius 1; **E3** Wegzeichnung ≤ +0,15 ms je Frame im Mittel gegen den Abzweigstand; **E4** Salze 600–619, 615–619 Reserve ORT-B; **E5** zwei
getrennte Playtester-Läufe als Rater; **E7** weicher Schatten mit zwei Füllungen statt Clip. **E6** (Ausweichregel Patch-Zeit): erst messen — ORT-1 meldet ab
+20 % Patch-Zeit eine Frühwarnung an L0, die Ausweichregel wird erst mit Messwert entschieden. Merge der Spec nach main durch lead-production im Sammelmerge nach
dem Push (R695). Plan durch lead-tech (opus, Tech-Lead beim Plan) in der Folgesession (Ampel gelb, R691).

Regelbezug: gates.md Gate Spec, R688, R691, H-R7 · Kosten bei Irrtum: eine Patch-Zeit, die erst im Plan eine Ausweichregel braucht.

Entscheider: L0 · Anlass: Bericht lead-art design-ORT-A · ADR: ADR-015

## R697 · 2026-10-16 · Gate Push REL-24 + REL-25 mit Zeitreserve-Ausnahme; Push per geprüftem Hash `8fe744df`

Ruling: Release-Check REL-24+REL-25 @ `8fe744df` (Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-REL-24-25.md`): alle Pakete mit Final-Review opus,
Screenshots (I-091 nach `.studio/qa/REL-24-25/i091/` gesichert), Save-Kette v14→v15→v16 mit Abweisen belegt, README/arc42 nachgeführt; `make push-check` Exit 1
allein durch 7 Zeitreserve-Rügen ausserhalb des Diffs, alles andere grün (4175 Tests inkl. Balancing, studio 925, Lint, Build, pages-limit);
Nachmessung `make zeitreserve-gate` Exit 0 → **Lastartefakt** (R598 V1, wie R667) → **Gate Push OK mit bewusster Ausnahme**. production-integrator pusht
**genau `8fe744df`** (`git push origin 8fe744df:main`, im Worktree `.worktrees/integrate`, vorher dorthin auschecken), CI entscheidet; danach
`gh workflow run Pages --ref main` — Pages baut den Stand von origin/main, also `8fe744df`. Spätere L0-Doku-Commits auf main gehen mit dem nächsten Push.
Danach: lead-production setzt REL-24/REL-25 live in `releases.json`, Release-Notiz in state.md, Sammelmerge `tool/e070` (R695), `docs/ideen-11` (R692),
`design/ortsrand` @ `ad315b3d` (R696). Paket **TOOL-TIMEOUT-7** (7 Timeouts nach E-043 auf 10000 ms) in den Pool, zweiter Fall in Folge → Folgesession.
Lehre zu push-check: L0 committet während eines push-check nicht auf main (Lauf 1 Exit 2 durch HEAD-Wechsel) → Kandidat in lernen.md.

Regelbezug: gates.md Gate Push, R335, R598 V1, R667, R688 (2) · Kosten bei Irrtum: ein roter CI-Lauf wegen Timeout eines Fremdtests (Rerun oder Fix nach E-043).

Entscheider: L0 · Anlass: Bericht lead-qa gate-REL-24-25 · ADR: —

## R698 · 2026-10-16 · Nutzerauftrag «weiter spawnen, solange Kapazität da ist»: neue Welle trotz Ampel gelb, Deckel 6

Ruling: Nutzerauftrag 12:31 «mach weiter. spawne andere agenten solange wir die kapazität haben dafür». Auslegung: der Auftrag geht der Ampel-Regel «gelb → keine
neue Welle» (R691) vor; Kapazität = 5-h-Limit (66 %, Reset 13:40) und Wochenlimit (23 %). Deckel **6 gleichzeitige Agenten** statt 8, damit Reserve für
Gates und Session-Ende bleibt; bei Ampel **rot** startet nichts Neues mehr, Laufendes wird abgeschlossen. Welle: (1) **UI-AUFRAEUM-4** Umsetzung (R694,
8 Starts); (2) **Plan ORT-A** (R696, lead-tech opus, 3 Starts, Worktree ab `design/ortsrand` @ `ad315b3d`); (3) **TOOL-BUENDEL-13** = TOOL-TIMEOUT-7 (R697,
7 Timeouts nach E-043) + TOOL-GUARD-EVENT (R693), lead-tech sonnet, 4 Starts; (4) Kurzdesign **I-114** Stufe leicht (lead-design sonnet, R692); (5) Kurzdesign
**I-120 + I-118** Stufe leicht (lead-art, R692). Dateien: (1) `src/ui/`, `src/sim/order.ts`; (3) nur `tests/` ausserhalb der von (1) berührten Dateien und
`tools/studio/`; (2), (4), (5) nur Doku → disjunkt.

Regelbezug: Verfassung §5, R69, R475, R691 · Kosten bei Irrtum: ein Limit, das vor dem Reset rot wird und laufende Pakete in die Folgesession schiebt.

Entscheider: L0 · Anlass: Nutzerauftrag 2026-10-16 · ADR: —

## R699 · 2026-10-16 · Kurzdesign I-114 «Fernangebot zur Wahl»: Variante A angenommen, kein Save; Plan jetzt

Ruling: `design/i114` @ `0d6474ec` (Handoff `.studio/handoffs/2026-10-16-lead-design-design-I-114.md`) → **Variante A** angenommen: zweites Fernangebot
abgeleitet (`farAlternative(world)`, Insel `e[(k+1) mod n]`, reine Lesefunktion ohne Zufall), `acceptFarOrder(world, pick = 0)` rückwärtsgleich, **kein
Save-Wechsel**, `types.ts`/`defs/` ohne Diff, Stufe leicht, 11 AKs. Drift bei Kontor-Gründung/-Verlust im Angebotsfenster wird hingenommen (Erstkarte bleibt,
keine Strafe). Mehrverdienst ≈ 10 % einer Fernprämie ist Abschätzung → AK-9 belegt Baseline und Balancing-Test. Plan jetzt (freier Platz, R698), lead-tech
sonnet Stufe leicht; Umsetzung nach Merge UI-AUFRAEUM-4 (gemeinsame Datei `hud.ts`). Release-Zuordnung REL-26.

Regelbezug: gates.md Gate Spec (Kurzdesign Stufe leicht), R692, R698 · Kosten bei Irrtum: eine Zweitkarte, die bei Kontorwechsel springt.

Entscheider: L0 · Anlass: Bericht lead-design design-I-114 · ADR: —

## R700 · 2026-10-16 · Kurzdesign I-120 + I-118 «Wohlstandsklang und Aufstiegs-Funkeln»: angenommen, Kurve B; Plan jetzt

Ruling: `design/i120-i118` @ `e90a8887` (Handoff `.studio/handoffs/2026-10-16-lead-art-design-I-120-I-118.md`) → angenommen: Teil A Klang über die bestehende
Brücke `viewStats` → `setAmbience` (`src/audio/` importiert weiter nichts aus `sim/`/`ui/`), Mix-Kurve **B** stetig, 10-s-Glättung; Teil B Funkeln (`aufstieg.ts`,
`drawRiseGlow`, Deckel 6, reduzierte Bewegung nur Kranz), Funkel-Uhr nur bei `speed > 0`. Die Zahlen (10 s, 1500 ms, Deckel 6, Wind +0,15) sind
Darstellungskonstanten in `src/render/`/`src/audio/`, keine Spielwerte. Kein Save, keine Sim-Regel; «voll versorgt» kommt aus vorhandenem Sim-Code (lesend).
Keine Assets. Plan jetzt (lead-tech sonnet, Stufe leicht, zwei Pakete Audio/Render); Merge-Reihenfolge `renderer.ts` gegen ORT-A im Plan festlegen. REL-26/27
nach Kapazität.

Regelbezug: gates.md Gate Spec (Kurzdesign Stufe leicht), R692, R698, ADR-011 · Kosten bei Irrtum: ein Stadtklang, der nachgestimmt wird.

Entscheider: L0 · Anlass: Bericht lead-art design-I-120-I-118 · ADR: —

## R701 · 2026-10-16 · Gate Plan I-114: OK; T01 (Sim) startet jetzt, T02 ff. nach Merge UI-AUFRAEUM-4

Ruling: `plan/i114` @ `bb0dee6b` (Handoff `.studio/handoffs/2026-10-16-lead-tech-plan-I-114.md`, T00–T04, Stufe leicht, kein Save) → **Gate Plan OK**. Ruling-
Entwürfe angenommen: `acceptFarOrder(world, 1)` rechnet die Zweitkarte im Klickmoment neu (Drift-Hinnahme R699); `farAlternative` liefert `null` ohne laufenden
Auftrag. Budget **7 Starts**, Parallelität 1, ein Reviewer am Ende (E-068) plus Final-Review opus. Weil T01 nur `src/sim/farOrder.ts` und Tests berührt
(disjunkt zu UI-AUFRAEUM-4), startet die Umsetzung **jetzt mit T00/T01**; T02–T04 erst nach dem Merge von UI-AUFRAEUM-4 (Controller holt main per Merge).
Bis dahin meldet der Controller «wartet» und endet, Fortsetzung per Nachricht.

Regelbezug: gates.md Gate Plan, R698, R699 · Kosten bei Irrtum: ein Sim-Task, der nach dem UI-Merge einen kleinen Merge braucht.

Entscheider: L0 · Anlass: Bericht lead-tech plan-I-114 · ADR: —

## R702 · 2026-10-16 · REL-24 + REL-25 live; Gate Plan I-120 + I-118: OK, Umsetzung jetzt

Ruling: (1) **REL-24 + REL-25 live**: Push `2e7a269f..8fe744df` (Fast-forward), CI 38887719217 grün, Pages 38888562306 grün; lead-production setzt
`releases.json`/state.md nach (Paket REL-24-25-NACH). (2) `plan/i120-i118` @ `a234b215` (Handoff `.studio/handoffs/2026-10-16-lead-tech-plan-I-120-I-118.md`,
T00–T08; «voll versorgt» = `allNeedsMet` lesend; keine neue Audio-Importkante) → **Gate Plan OK**. Budget **7 Starts**, Parallelität 2 (Stränge `feat/i120`
Audio und `feat/i118` Render ohne gemeinsame Datei); je Strang ein Reviewer am Ende (E-068: Render opus wegen Diff > 300, Audio sonnet) plus Browser-Check.
Merge-Reihenfolge: I-120 frei; I-118 nach ORT-A, wenn ORT-A vorher landet, sonst ORT-A holt I-118 (kleine Textkonflikte `limits.ts`/`renderer.ts`); vor
jedem Merge-Gate main einmergen.

Regelbezug: gates.md Gate Plan, R698, R700 · Kosten bei Irrtum: ein Funkeln, das im Browser-Check nachjustiert wird.

Entscheider: L0 · Anlass: Berichte production-integrator REL-24-25-PUSH, lead-tech plan-I-120-I-118 · ADR: —

## R703 · 2026-10-16 · I-114 T01 abgenommen; `farAlternative` null bei Vertrag/Sperre; Platz bleibt frei wegen Last

Ruling: (1) `feat/i114` @ `5cef8359` (T01, 17 neue Tests mit Rot-Beleg, `tests/sim` 1535 grün, Balancing ohne Diff, kein Save/`defs`-Diff): Ergänzung
«`farAlternative` liefert auch bei laufendem Vertrag oder aktiver Sperre `null`» bestätigt (deckt AK-2); AK-6 «Kein zweites Angebot» statt Kontor-Fehler
angenommen (Zweitkarte wählt nur Inseln mit Kontor). T02 ff. nach Merge UI-AUFRAEUM-4 (R701). (2) Last 6–22 während der Messung: der sechste Platz bleibt
vorerst leer (R698-Deckel nicht ausgeschöpft), damit Testlauf und Testlock der laufenden Umsetzungen nicht abbrechen; neue Starts erst bei Last < 8.

Regelbezug: R375, R380, R698, R701 · Kosten bei Irrtum: ein Agentenplatz, der eine halbe Stunde leer bleibt.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech I-114 · ADR: —

## R704 · 2026-10-16 · Gate Merge TOOL-BUENDEL-13: OK

Ruling: `tool/buendel-13` (Commits `cb2f6521` Timeouts, `12890a82` Guard-Ereignis; Handoff `.studio/handoffs/2026-10-16-lead-tech-TOOL-BUENDEL-13.md`): 7 Timeouts nur
als Argument auf 10000 ms (E-043), `guard_block` je Abweisung mit Echtlauf belegt, Deny bleibt bei Schreibfehler, `make check` 4175, `studio-test` 931,
`zeitreserve-gate` Exit 0, Review OK (E-068, ein Reviewer bei 166 Zeilen) → **Gate Merge OK**; Merge `--no-ff` durch lead-production. Nachträge: Handbuch-Zeile
`guard_block` (STUDIO.md ≈ Z. 428) und Flake-Zeile (R695) setzt studio-coach in der Session-Ende-Retro; Beobachtungen: `rule_of` ordnet per Stichwort zu
(neue Guard-Texte → «other»), `command` im Ereignis kann Tokens enthalten (Datei lokal und ignoriert; Schwärzung prüfen). E-064-Messlücke damit geschlossen.

Regelbezug: gates.md Gate Merge, R693, R697, R698 · Kosten bei Irrtum: ein Guard-Ereignis mit unklarer Regel-Zuordnung.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-13 · ADR: —

## R705 · 2026-10-16 · Gate Plan ORT-A: OK mit RE-1–RE-3; Budget 57 Starts; Umsetzung in der Folgesession; N-102 Fremdprozesse

Ruling: `plan/ort-a` @ `39d3cdd1` (Index + T00–T26, T05b, T20b; Handoff `.studio/handoffs/2026-10-16-lead-tech-plan-ORT-A.md`; Testbarkeit lead-qa «testbar mit
Auflagen», 16 Befunde eingearbeitet; Rechenprüfung R565 P3 belegt) → **Gate Plan OK**. Angenommen: **RE-1** Patch-Zeit je Bau über
`renderStats.terrainPatchMs`; **RE-2** Fremdinsel-Vergleich mit dem Seed der Fremdinsel-Ansicht; **RE-3** additive Messhaken in `src/ui/devProbes.ts`
und Übergabe in `src/ui/app.ts`, nur Entwicklungsbuild (Ownership-Ausnahme). Wegkante als feste Sinuswelle (Amplitude 0,03, Wellenlänge 0,7) statt
Spec-Amplitude 0,02 angenommen (AK-19 sonst nicht sicher). Budget **57 Starts** (49 Arbeiter + 8 Controller), Parallelität 2. ORT-1 liegt mit ≈ 480 Tools
weit über der Spec-Schätzung: der Controller meldet nach T09 (Patch-Zeit-Frühmessung, E6) Stand und Restschätzung an L0, bevor K1/K2 starten.
Umsetzung in der Folgesession (Limit 79 %, Ampel gelb; Last bis 56). Die Headless-Chrome-Prozesse eines fremden Projekts (0,1 % CPU) liegen ausserhalb der
Studio-Befugnis → Warteschlange **N-102**; bis zur Antwort tragen ORT-A-Leistungsmessungen den Vermerk «Messfenster belegt».

Regelbezug: gates.md Gate Plan, R565 P3, R696, R698 · Kosten bei Irrtum: ein grosses Paket, das nach T09 neu zugeschnitten wird.

Entscheider: L0 · Anlass: Bericht lead-tech plan-ORT-A · ADR: ADR-015

## R706 · 2026-10-16 · Kurzdesign I-112 «Ratsbeschluss»: V3 angenommen mit R-1/R-2; Testbarkeit im Plan-Gate; Plan in der Folgesession

Ruling: `design/i112` @ `37bfbe29` (Handoff `.studio/handoffs/2026-10-16-lead-design-design-I-112.md`, Rechnung im Anhang) → **V3** angenommen: Seite A
schnellerer Takt des Kettenendes (Weberei 50→40, Brennerei 50→40, Glashütte 50→30), Seite B Form der Stadt (Kapellen-Reichweite 10→13, Bürgerhaus 16 statt 15,
Kaufmannshaus 22 statt 20); einmalig, kostenlos, partieweit, Wahl über Kopfzeilen-Marke «Rat» ohne Modal. **R-1**: der Balancing-Controller beschliesst nie,
Baseline bitgleich, je Beschluss ein Szenariotest. **R-2**: die sechs Werte als Vorgabe für `src/sim/defs/`; Glockenrecht +4 erst per Werte-Ruling nach dem
Playtest, wenn Stufe 2 fast immer A ergibt. Save: neues Feld `council`, `SAVE_VERSION` = main + 1 beim Merge (R674), ältere Stände abgewiesen mit Test. Auflage:
lead-qa prüft die Testbarkeit der 17 AKs im Gate Plan; lead-tech prüft, dass alle Leser von `maxInhabitants` und `serviceRadius` über Lese-Helfer laufen.
Rückfall V4 (nur Stufe 3) bleibt Option, falls der Plan zu gross wird. Plan in der Folgesession.

Regelbezug: gates.md Gate Spec, R674, R692, R698 · Kosten bei Irrtum: ein Beschluss, der nach dem Playtest per Werte-Ruling nachgestimmt wird.

Entscheider: L0 · Anlass: Bericht lead-design design-I-112 · ADR: —

## R707 · 2026-10-16 · Gate Merge I-120 + I-118: OK; Ampel rot → Session-Ende

Ruling: `feat/i120` @ `13dc9bfd` und `feat/i118` @ `f69d8b49` (Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-I-120-I-118.md`): frisches Delta-Review opus
OK (R673 nachgeholt), Importgrenzen eingehalten, kein `src/sim`-Diff, `SAVE_VERSION` 16, Prüfläufe Exit 0, Merge-Proben sauber, README/arc42 nachgeführt →
**Gate Merge OK**; Abweichung `sound.ts` statt `ambience.ts` genehmigt. lead-production merged I-120, dann I-118 (`--no-ff`, lokal), trägt die vier niedrigen
Hinweise in `docs/beobachtungen.md` ein und nimmt beide in REL-26 auf. Limit-Ampel rot (86 %): keine neuen Pakete; UI-AUFRAEUM-4 läuft bis zum nächsten
Haltepunkt und setzt in der Folgesession fort; Session-Ende-Routine jetzt (Metriken, Kurz-Retro mit den Handbuch-Nachträgen R695/R704, state.md).

Regelbezug: gates.md Gate Merge, R69, R673, R698, R702 · Kosten bei Irrtum: ein Stadtklang, der nach dem Hörtest nachgestimmt wird.

Entscheider: L0 · Anlass: Bericht lead-qa gate-I-120-I-118, Ampel rot · ADR: —

## R708 · 2026-10-16 · Kurz-Retro 66d37b15: V1 und V2 angenommen; Handbuch 1.59 angenommen

Ruling: Bericht `docs/studio/retros/2026-10-16-session-66d37b15-ende.md` (Commit `89b10f2d`, Handbuch 1.59 mit Flake-Zeile und `guard_block`) → angenommen.
**V1**: Pflichtzeile in `templates/briefing.md` (Controller-Briefing): Delta-Review nach ZURÜCK/BEDENKEN immer frischer Start (opus), nie Fortsetzung (R673);
Messgrösse 0 Fortsetzungs-Delta-Reviews in den nächsten 5 Controller-Paketen. **V2**: bei 1-min-Last ≥ 8 startet L0 keine dritte gleichzeitige Umsetzung
mit Testlauf (ergänzt R703); Messgrösse `davon Last ≥ 8` ≤ 50 % über 3 Sessions. E-064 bleibt «behalten» (R693). Messaufträge: V3 (Frist 2026-10-23),
«grösste gelesene Datei 66,7 KB» identifizieren (studio-coach, Frist 2026-10-23), L0-Zwischenstand in state.md ab 250k Kontext (nächste Session).

Regelbezug: R316, R673, R693, R703 · Kosten bei Irrtum: eine Umsetzung, die eine halbe Stunde später startet.

Entscheider: L0 · Anlass: Kurz-Retro 66d37b15 · ADR: —

## R709 · 2026-10-16 · Session-Start ca9d40c8: UI-AUFRAEUM-4 per Fortsetzung; Plan I-112 jetzt; ORT-A ab Last < 8

Ruling: (1) Der Controller `lead-tech` UI-AUFRAEUM-4 (Agent `a7b1c43c`, Session 66d37b15) lebt nach `/clear` weiter und wartet auf seinen eigenen `make check`
(`feat/ui-aufraeum-4` @ `150f98f8`); kein Neustart, L0 setzt ihn nach Ende des Laufs per `SendMessage` fort (Stand, Restbudget aus R694, Ziel Gate Merge).
(2) **Plan I-112** (`lead-tech`, opus, Paket `plan-I-112`) startet jetzt: ohne Testlauf, daher auch bei Last > 8 zulässig (R464, R703, R708 V2);
Budget 1 Start. (3) **ORT-A** startet erst bei 1-min-Last < 8 als zweite Umsetzung mit Testlauf (R703, R708 V2); I-114 T02 ff. weiter nach Merge
UI-AUFRAEUM-4 (R701). (4) Beobachtungen 12 < 30: keine Pflicht-Auswertung.

Regelbezug: R464, R694, R701, R703, R705, R706, R708 · Kosten bei Irrtum: ein Controller, der doppelt läuft, oder ein Plan, der eine halbe Stunde später startet.

Entscheider: L0 · Anlass: Session-Start ca9d40c8 · ADR: —

## R710 · 2026-10-16 · Gate Merge UI-AUFRAEUM-4: OK nach arc42-Satz (B-1); D-1 und D-2 bestätigt; Prozess-Retro REL-21–REL-25

Ruling: (1) `feat/ui-aufraeum-4` @ `150f98f8` (Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-UI-AUFRAEUM-4.md`): **Gate Merge OK unter Auflage B-1** — lead-tech
korrigiert in `docs/arc42.md` (Zeile zu `input.ts`) den Rechtsklick auf die Staffelung D-2 (erster Rechtsklick beendet den Zug, zweiter legt das Werkzeug ab),
Trivial-Fix mit `make docs-check` Exit 0, kein erneutes Gate; danach merged lead-production lokal (`--no-ff`) und nimmt das Paket in REL-26 auf. **D-1**
(Cache-Schlüssel mit `nextBuildingId` und Stufensumme, reiner UI-Zustand) und **D-2** bestätigt. Beobachtungen: Rechtsklick über `pointerdown` Button 2 erst
bei Bericht aus einem Nicht-Chrome-Browser; Schwenk-Test und Menü-Abstand bei der nächsten Menü-Arbeit. Danach I-114 T02 ff. (R701). (2) Seit REL-20 fehlt
die Prozess-Aussensicht (R127) für REL-21 bis REL-25 → `studio-process-coach` (opus) jetzt, ein Bericht über alle fünf Releases.

Regelbezug: gates.md Gate Merge, R127, R694, R701, R707 · Kosten bei Irrtum: ein Doku-Satz, der eine Stunde länger veraltet ist.

Entscheider: L0 · Anlass: Bericht lead-qa gate-UI-AUFRAEUM-4 · ADR: —

## R711 · 2026-10-16 · Plan I-112: R-3 anteiliger Stufentakt, R-4 Migration v16→v17, R-5 UI-Leser in T01; Testbarkeits-Check jetzt

Ruling: Plan `plan/i112` @ `cb41264e` (10 Tasks T00–T09, Handoff `.studio/handoffs/2026-10-16-lead-tech-plan-I-112.md`). **R-3:** Der neue Takt gilt anteilig für
Ausbaustufen: `floor(Stufentakt × neuer Grundtakt ÷ 50)` (Weberei Stufe 30 → 24); kein Gegenzeichnen durch lead-design nötig, weil es die naheliegende Lesart von
R706 R-2 ist und die Baseline bitgleich bleibt (Controller beschliesst nie). **R-4:** Statt Abweisen eine Migration v16→v17 (offene Stufen aus vorhandenen Häusern
abgeleitet), wie die bestehende Kette v1→v16; Verfassung §3 erlaubt Laden, verlangt es nicht; Test für die Migration statt für das Abweisen; `SAVE_VERSION` = main + 1
beim Merge (R674) bleibt. Budget daher 25 Arbeiter-Starts + 4 Controller. **R-5:** T01 darf die Leser-Zeilen in den 7 Dateien unter `src/ui/` ändern (wie R674 (2)).
Taste `Umschalt+R` angenommen. Gate Plan: Testbarkeits-Check der 17 AKs durch lead-qa (Auflage R706) jetzt; Budgetfreigabe mit dem Gate-Urteil.

Regelbezug: VERFASSUNG §3, R674, R706 · Kosten bei Irrtum: ein Stufentakt, der nach dem Playtest per Werte-Ruling nachgestimmt wird.

Entscheider: L0 · Anlass: Bericht lead-tech plan-I-112 · ADR: —

## R712 · 2026-10-16 · Prozess-Retro REL-21–REL-25: V1–V4 angenommen; Actions rot → REL-26 frühestens 2026-10-17

Ruling: Bericht `docs/studio/retros/2026-10-16-prozess-rel21-25.md` (`e64df507`) → angenommen. **V1** `push-check` misst bei Exit 1 immer nach (Bedingung
`start > RETRY_LOAD` in `pushcheck.py` entfällt; R598 V3 zurückgenommen); Messgrösse 0 Ausnahme-Rulings über 3 Pushes. **V2** Release-Check nur in der Session, die
pusht; Vorab- und Delta-Check entfallen; Messgrösse ≤ 2 lead-qa- und ≤ 1 Integrator-Start je Release. **V3** TOOL-TIMEOUT-7 auf alle Tests mit lokaler Zeit × 4

> 40 % des Timeouts ausweiten, CI-Laufzeit festhalten; Messgrösse ≤ 1 Zeitreserve-Paket über 3 Releases. **V4** Pre-Commit-Hook formatiert vollständig gestagte
> Dateien selbst mit Prettier und stagt sie neu (teilweise gestagte Dateien weiter abweisen, nie fremde Änderungen mitstagen); Messgrösse ≤ 1 Abweisung je Session.
> Umsetzung: V1, V3, V4 und die Ein-Ereignis-je-Lauf-Zählung von `load_abort` als **TOOL-BUENDEL-14** (lead-tech, Werkzeug-Paket, Plan-Instanz sonnet, Budget 6);
> V2 als Handbuch-Minor durch studio-coach. Messauftrag R708 «grösste Datei» erledigt (`docs/beobachtungen.md` 57,5 KB, zweiter Fall in Folge → Auswertungen lesen
> die Datei abschnittsweise; studio-coach nimmt das in lernen.md auf). **Actions-Prognose rot (2575/2000):** R488 V2 gilt — höchstens ein Push je Tag; heute
> gepusht (`8fe744df`), daher **REL-26 frühestens 2026-10-17**; bis dahin sammeln sich gemergte Pakete lokal.

Regelbezug: R127, R316, R335, R488 V2, R598 V3, R708 · Kosten bei Irrtum: ein Werkzeug-Paket, das eine Regel lockert, die wieder verschärft werden muss.

Entscheider: L0 · Anlass: Prozess-Retro REL-21–REL-25 · ADR: —

## R713 · 2026-10-16 · Gate Plan I-112: OK mit Auflagen B-1–B-5; Budget 25 + 4; Umsetzung jetzt

Ruling: `plan/i112` @ `cb41264e` (Gate-Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-plan-I-112.md`) → **Gate Plan OK mit Auflagen**: B-1 R711 in Index, T02, T04
nachziehen (Varianten und Blocker R-3/R-4 streichen, Satz «Spec §4/AK 9 durch R711 R-4 ersetzt»); B-2 Stufentakt-Test je Kette (Weberei, Brennerei, Glashütte),
Reihenfolge Beschluss vor Inselvorteil, Untergrenze 1; B-3 Migrationstest v16→v17 mit Fällen ohne Haus, Stufe 4 und älteren Fixtures durch die Kette, Save-Tests
`buyPct`, `farOrder`, `reserve`, `inselmarkt`, `toolmaker` mitlaufen; B-5 Sollwert `council` in T05 aus der höchsten Hausstufe am Laufende. B-6–B-9 als Hinweise.
Budget **25 Arbeiter-Starts + 4 Controller, Parallelität 2**. Erste Controller-Instanz arbeitet B-1–B-5 in den Plan ein (auf `feat/i112`), dann T00, T01.
Last 6 < 8: dritte Umsetzung mit Testlauf zulässig (R708 V2).

Regelbezug: gates.md Gate Plan, R706, R708 V2, R711 · Kosten bei Irrtum: eine Plan-Korrektur.

Entscheider: L0 · Anlass: Bericht lead-qa gate-plan-I-112 · ADR: —

## R714 · 2026-10-16 · Freier Platz → Kurzdesign I-119 + I-121 «Bewohner reagieren» (Stufe leicht)

Ruling: Ein Agentenplatz ist frei (Deckel 6, R698); aus dem Pool R692 startet **I-119 + I-121** als ein Paket «Bewohner reagieren» (Eimerkette bei Brand,
Heimgehen bei Sturmwarnung, Wartende vor Häusern mit Mangel). Kurzdesign Stufe leicht durch lead-design (sonnet, E-061), Branch `design/i119-i121`; kein Save,
nur `src/render/` (Leben/Figuren). Auflage: Abgleich mit ORT-A (Wege- und Kantenänderungen in `src/render/`), Figurenobergrenze und «Bewegung reduzieren»;
Plan erst nach Gate Spec und nicht vor ORT-A T20 (Zusammenführung), um Merge-Fläche in `src/render/` klein zu halten. Handbuch 1.60 (`612fe2bb`) mit
CHANGELOG-Eintrag angenommen.

Regelbezug: R445, R692, R698, E-061 · Kosten bei Irrtum: ein Kurzdesign, das bis nach ORT-A liegen bleibt.

Entscheider: L0 · Anlass: freier Platz · ADR: —

## R715 · 2026-10-16 · Gate Spec I-119 + I-121: Variante 3 (gestaffelt); Kurzdesign I-110 «Startpaket zur Wahl» jetzt

Ruling: (1) `design/i119-i121` @ `da85c492` (Handoff `.studio/handoffs/2026-10-16-lead-design-design-I-119-I-121.md`) → **Gate Spec OK, Variante 3**: Paket A
(Wartende vor der Tür mit Zeitstaffel, Sturm-Heimgehen, Boom-Winken, ohne Pfadlogik) vor Paket B (Brand-Eimerkette mit Breitensuche, streichbar). Konstanten
(30/150/600 Ticks, Läufertempo 1,8 Kacheln/s, `waiters` [12, 4], `firefighters` [8, 0], `wavers` [12, 0]) sind Darstellungswerte in `src/render/reaktion.ts` bzw.
`CAPS` in `limits.ts`, nicht in `src/sim/defs/` — Balancing unberührt. Reagierende zählen gegen `CAPS.walkers` und ersetzen Spaziergänger. Kürzung «voll versorgte
Häuser schicken öfter Spaziergänger» angenommen. Plan erst nach ORT-A T20, ab dem dann aktuellen `main` (R714). (2) Freier Platz → **Kurzdesign I-110
«Startpaket zur Wahl»** (Pool R692), Stufe voll (neue Spielwerte): lead-design (opus) mit design-economy-designer für die Rechnung (Vorteile je Paket in einem
Engpass der ersten 15 min, keine Dominanz); «Standard» bleibt Vorgabe, Balancing-Baseline startet mit Standard.

Regelbezug: gates.md Gate Spec, R445, R692, R698, R714 · Kosten bei Irrtum: ein Paket B, das nach dem Playtest von A gestrichen wird.

Entscheider: L0 · Anlass: Bericht lead-design design-I-119-I-121 · ADR: —

## R716 · 2026-10-16 · I-112 C1 abgenommen (T01 `07de72c4`); `imports.test.ts`-Lockerung angenommen; C2 erst nach I-114 oder bei Last < 8

Ruling: `feat/i112` @ `07de72c4` in `.worktrees/i112` (Plan-Nachtrag `3e7b3a1a` mit B-1–B-9; Handoff `.studio/handoffs/2026-10-16-lead-tech-I-112.md`): T01 Leser-Umbau
abgenommen (Wächter-Rot-Beleg 26 Treffer, Baseline bitgleich, Diff `defs`/`save.ts`/`types.ts` leer). Die Lockerung in `tests/sim/imports.test.ts` (`levels.ts` darf
aus `./council` importieren, `council` bleibt Blatt) angenommen, nachträglich in die Dateimatrix. T00-Messung (R392) ersatzweise auf `07de72c4` nachholen, sobald
Last ≤ 4 (T01 verhaltensneutral). Merge-Reihenfolge I-114 vor I-112, danach `git merge main` in `feat/i112`. **Instanz C2 (T02–T05) startet erst, wenn I-114
übergeben ist oder die 1-min-Last < 8 liegt** — derzeit laufen drei Umsetzungen mit Testlauf (ORT-A, I-114, TOOL-BUENDEL-14), Last 7–13 (R708 V2).

Regelbezug: R392, R708 V2, R711, R713 · Kosten bei Irrtum: eine Umsetzung, die eine halbe Stunde später weiterläuft.

Entscheider: L0 · Anlass: Bericht lead-tech I-112 C1 · ADR: —

## R717 · 2026-10-16 · ORT-A C2: T07 abgenommen; +3 Starts aus dem Planpuffer für T08; `buildMsNachLaden` angenommen

Ruling: `feat/ort-a-mess` @ `e8a3bdfd` (Basis A `72ee9610`, Messbasis `mess/ort-a-basis` @ `660f3160`; Handoff `.studio/handoffs/2026-10-16-lead-tech-ORT-A-C2.md`):
T07 nach drei Review-Runden abgenommen; DEV-Haken nicht im Produktionsbuild. Budgetantrag D-ORT-A-C2-1 **+3 Starts für T08 aus dem Puffer (12) des Gesamtbudgets 57**
(R705) freigegeben, Puffer danach 9; C2 setzt per Fortsetzung fort. Planabweichung: `hitch.mjs` `buildMs` → `buildMsNachLaden` (meist `null`), vollen Aufbau liefert
`perf.mjs` (`buildMsA/B`), `patchMs` je Bau bleibt — angenommen. T08 pausiert die Sim beim Einfrieren (⏸ wie `perf.mjs`). Browser-Probeläufe und A/A-Kontrolle mit
Vermerk «Messfenster belegt», solange N-102 offen ist; gewertete A/B-Messungen (T09) erst bei freiem Messfenster.

Regelbezug: R553, R705, N-102 · Kosten bei Irrtum: drei Starts aus dem Puffer.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C2 · ADR: —

## R718 · 2026-10-16 · Gate Merge TOOL-BUENDEL-14: OK ohne Auflagen; Merge jetzt

Ruling: `tool/buendel-14` @ `69230eb9` (Gate-Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-TOOL-BUENDEL-14.md`) → **Gate Merge OK**. V1, V3, V4 (R712) und die
Isolation des `testlock`-Tests (Ursache der vervielfachten `load_abort`-Ereignisse) belegt; merge-tree konfliktfrei gegen Handbuch 1.60. lead-production merged lokal
(`--no-ff`) und trägt H-1 (Nachmessung beim nächsten `push-check`), H-2 (alte `load_abort`-Test-Ereignisse, Bereinigung bei der nächsten Aufräum-Runde) und H-3
in `docs/beobachtungen.md` ein. 7 Tests mit bestehendem Timeout bleiben unverändert.

Regelbezug: gates.md Gate Merge, R712 · Kosten bei Irrtum: ein Pre-Commit-Hook, der eine Datei formatiert, die der Autor anders wollte.

Entscheider: L0 · Anlass: Bericht lead-qa gate-TOOL-BUENDEL-14 · ADR: —

## R719 · 2026-10-16 · Freier Platz → Beobachtungen-Auswertung BEOB-17

Ruling: Ein Platz frei (Deckel 6, R698); Kurzdesigns/Pläne aus dem Pool sind belegt oder warten auf ORT-A T20 (R714). Daher **BEOB-17**: lead-production wertet die
Einträge unter der Marke «Letzte Auswertung: 2026-10-16» aus (Skill `beobachtungen-auswerten`), Datei nur ab der Marke lesen (57 KB, R712). Jeder Eintrag endet als
erledigt, abgehakt, eingeplant oder Idee; Trivial-Fixes ≤ 15 min im selben Branch `docs/beob-17`; kein `src/sim/defs`-Diff.

Regelbezug: R287, R445, R698, R712 · Kosten bei Irrtum: eine Auswertung, die eine Woche früher als nötig läuft.

Entscheider: L0 · Anlass: freier Platz · ADR: —

## R720 · 2026-10-16 · Gate Merge I-114: OK; Merge jetzt, dann I-112 holt main

Ruling: `feat/i114` @ `f26e64af` (Gate-Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-I-114.md`) → **Gate Merge OK**. R703 bestätigt; Lagerzahl der Fernkarte
ohne Rotfärbung wie vorher (Beobachtung eingetragen). lead-production merged lokal (`--no-ff`), pflegt Rangliste und Entscheid-Status von I-114 in `docs/ideen.md`
und nimmt I-114 in REL-26 auf. Danach holt der I-112-Controller `main` per Merge in `feat/i112` (Reihenfolge I-114 vor I-112, R716).

Regelbezug: gates.md Gate Merge, R701, R703, R716 · Kosten bei Irrtum: eine Fernkarte, die nach dem Playtest nachgebessert wird.

Entscheider: L0 · Anlass: Bericht lead-qa gate-I-114 · ADR: —

## R721 · 2026-10-16 · BEOB-17: Merge OK (L0-Gate, Trivial-Fix); PERF-BILANZ-COV jetzt; TOOL-GUARD-REDACT und ZEITRESERVE-PFLEGE in den Pool

Ruling: `docs/beob-17` (`27304033`, `1d23b6e9`; Handoff `.studio/handoffs/2026-10-16-lead-production-BEOB-17.md`): 17 Einträge ausgewertet (2 erledigt, 4 eingeplant,
10 abgehakt, 1 offen bis ORT-1). Diff ausserhalb der Doku nur Klasse `menu-field` (2 Zeilen `menu.ts`, 5 Zeilen CSS), Prüfungen Exit 0 → **Merge OK durch L0**
(Trivial-Fix, kein lead-qa-Gate nötig); lead-production merged lokal und nimmt den Menü-Abstand in REL-26 auf. Paketvorschläge: (1) **PERF-BILANZ-COV** (S) jetzt —
I-114 ist gemergt (R720), Last 5,7 < 8, dritte Umsetzung zulässig (R708 V2); lead-tech, Stufe leicht, Budget 4. (2) **TOOL-GUARD-REDACT** (S) und (3)
**ZEITRESERVE-PFLEGE** mit H-1 in den Pool; Start beim nächsten freien Platz bzw. nächsten Werkzeug-Bündel.

Regelbezug: R287, R445, R698, R708 V2, R719 · Kosten bei Irrtum: ein Menü-Abstand, der nachjustiert wird.

Entscheider: L0 · Anlass: Bericht lead-production BEOB-17 · ADR: —

## R722 · 2026-10-16 · Kurzdesign I-110: geparkt bis `BUY_RISE` > 0; TOOL-GUARD-REDACT jetzt

Ruling: `design/i110` @ `2473b2da` (Handoff `.studio/handoffs/2026-10-16-lead-design-design-I-110.md`): Die Messung zeigt, dass bei festen, unbegrenzten Kaufpreisen
Geld der einzige Engpass der ersten 15 min ist; alle Pakete erreichen U1–U3 gleich schnell, sie unterscheiden sich nur im Restgeld. Eine Wahl ohne strategische
Wirkung erfüllt das Ziel von I-110 nicht → **E1: geparkt**, bis der Zukauf mit der Menge teurer wird (`BUY_RISE` > 0, Mechanik aus I-048 Schritt A, derzeit
inaktiv). Spec und Rechnung bleiben auf dem Branch als Ausgangspunkt (Kassenwart 5800, Kalibrierregel E3 als Vorlage). lead-production setzt I-110 in `docs/ideen.md`
beim nächsten Merge auf «geparkt (R722)». Freier Platz → **TOOL-GUARD-REDACT** (Pool R721): `command` im Ereignis `guard_block` schwärzen (Token-Muster), lead-tech,
Werkzeug-Paket, Budget 3.

Regelbezug: R445, R692, R721 · Kosten bei Irrtum: ein Startpaket, das später als Stil-Wahl doch gebaut wird (≈ 60 Tools).

Entscheider: L0 · Anlass: Bericht lead-design design-I-110 · ADR: —

## R723 · 2026-10-16 · ORT-A C2: +1 Start für frisches Delta-Review T08; AK-50 einseitiges Kernfenster prüft der Reviewer

Ruling: Budgetantrag D-ORT-A-C2-2 (`feat/ort-a-mess` @ `aafbc36e`, dritte Fix-Runde T08 nur `tools/render-qa/`) → **+1 Start aus dem Puffer** (danach 8) für ein frisches
Delta-Review opus (R673, R708). Die Abweichung AK-50 (Kernfenster einseitig statt ±0,1 Kachel) bewertet der Delta-Reviewer ausdrücklich; ohne Begründung im Review
gilt der Plan. Erwartete Unterschreitung «< 20 Querschnitte je Art» auf der Fixture: C2 vermerkt sie im Handoff als Risiko für T09, keine Fixture-Erweiterung in T08.
`ortsrand.mjs` als Parallelquelle → Eintrag in `docs/beobachtungen.md` auf dem Strang. Danach Stopp C2; T09 (Messung ORT-1) startet erst bei freiem Messfenster.

Regelbezug: R673, R705, R708, R717 · Kosten bei Irrtum: ein Start aus dem Puffer.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C2 · ADR: —

## R724 · 2026-10-16 · I-112 C2: T02–T04 abgenommen; drei Planabweichungen bestätigt; C3 (T05–T07) mit 6 Starts

Ruling: `feat/i112` (T02 `90f209d2`, T03 `3361223d`, T04 `93c95f94`, main-Merge `4e244cc8`, Lockerung `967d8f9a`; Handoff `.studio/handoffs/2026-10-16-lead-tech-I-112-C2.md`)
→ abgenommen; Baseline unverändert. Ownership-Erweiterung auf `tests/sim/helpers.ts`, `helpers.test.ts`, `farOrder-save`, `save-loyalty` und die Lockerung des
I-114-Tests auf `SAVE_VERSION >= 16` angenommen. Planabweichungen bestätigt: (a) Reihenfolge-Test «Beschluss vor Inselvorteil» mit der Glashütte auf Insel B
(18 → 9), weil die Weberei keinen Inselvorteil hat; (b) Stufe 4 ohne `tierWish`, Wohnordnung wirkt nur über `maxInhabitantsOf`, Test «`unlocks.ts` Stufe 4 verlangt
16» entfällt; (c) Abstände 12,5/13,5 im Glockenrecht-Test. Merge-Auflage: Literal 17 in `tests/sim/council-save.test.ts:84` beim Merge auf main + 1 ziehen (R674),
besser jetzt auf `SAVE_VERSION`-Bezug umstellen. Konsistenztest «jeder `cycle`-Hebel zeigt auf ein Gebäude mit Takt» in T05 aufnehmen. **Instanz C3: T05–T07, 6 Starts**
aus dem Restbudget (8 von 25 verbraucht), Parallelität 2; T00-Ersatzmessung weiter bei Last ≤ 4.

Regelbezug: R674, R711, R713, R716 · Kosten bei Irrtum: ein Szenariotest, der im Final-Review nachgeschärft wird.

Entscheider: L0 · Anlass: Bericht lead-tech I-112 C2 · ADR: —

## R725 · 2026-10-16 · TOOL-GUARD-REDACT: Unter-Schwärzungen vor dem Gate schliessen; +1 Start

Ruling: `tool/guard-redact` @ `de380351` (Handoff `.studio/handoffs/2026-10-16-lead-tech-TOOL-GUARD-REDACT.md`): Vor Gate Merge schliesst lead-tech die gemeldeten
Unter-Schwärzungen (`curl -u`, `Authorization`-Header, `token=`/`api_key=`/`secret=`/`password=`, `*_TOKEN=`/`*_KEY=`/`*_SECRET=`/`*_PASSWORD=`, Werte in
Anführungszeichen) und setzt eine Wortgrenze vor `sk-`/`gh*_`. Über-Schwärzung (`-pattern`) ist hinnehmbar, Unter-Schwärzung nicht (OWASP). +1 Start für ein
frisches Review. Verbleibende bewusste Lücken trägt L0 nach dem Bericht in `docs/beobachtungen.md` ein.

Regelbezug: R721, OWASP (../CLAUDE.md Review-Besonderheit) · Kosten bei Irrtum: ein Start mehr für ein lokales Werkzeug.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-GUARD-REDACT · ADR: —

## R726 · 2026-10-16 · ORT-A C1: T00–T03 abgenommen; C3 (T04–T06) startet; P-9 mit Vermerk

Ruling: `feat/ort-a` (T01 `8ee15e72`, T02 `052d2a04`, T03 `050a4b60`; Basis A `72ee9610`; Handoff `.studio/handoffs/2026-10-16-lead-tech-ORT-A-C1.md`) → abgenommen.
Neutralitätsbeweis T02 auf nachgebautem A (17/17) angenommen. **C3: T04, T05, (T05b), T06, 6 (+2) Starts** aus R705. P-9-Frühmessung der Patch-Zeit nach T05:
solange N-102 offen ist, als Richtwert mit Vermerk «Messfenster belegt»; liegt schon der Richtwert ≥ +20 % über A, Frühwarnung an L0 vor T06 (E6), sonst T06 weiter
und gewertete Messung in T09. C3 trägt die `inPoly`-Beobachtung (abweichende Argumentreihenfolge in sechs Testdateien) in `docs/beobachtungen.md` auf `feat/ort-a` ein.

Regelbezug: R705, R717, N-102 · Kosten bei Irrtum: eine Patch-Zeit-Warnung, die erst in T09 auffällt.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C1 · ADR: —

## R727 · 2026-10-16 · Gate Merge PERF-BILANZ-COV: OK; Merge jetzt

Ruling: `perf/bilanz-cov` @ `ad57e259` (Gate-Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-PERF-BILANZ-COV.md`) → **Gate Merge OK**, Auflage: voller Lauf im
`push-check` vor REL-26 (R712 V2). lead-production merged lokal (`--no-ff`), nimmt das Paket in REL-26 auf und trägt drei niedrige Beobachtungen ein (Routen-Bilanz bei
Pause-/Ausfall-Wechsel im selben Tick bis zum nächsten Tick alt; `|island` im Memo-Schlüssel überflüssig; `focusLine`/`focusList`/`houseConsumers` je Chip ungemessen).

Regelbezug: gates.md Gate Merge, R712 V2, R721 · Kosten bei Irrtum: eine Bilanz, die einen Tick zu spät aktualisiert.

Entscheider: L0 · Anlass: Bericht lead-qa gate-PERF-BILANZ-COV · ADR: —

## R728 · 2026-10-16 · ORT-A C2 +1 Delta-Review; Hof-Fixture für T09; I-112 C3 abgenommen, `Umschalt+R` = Rat, C4 mit 6 Starts

Ruling: (1) ORT-A C2 (`feat/ort-a-mess` @ `1d1324d4`, Fix-Runde 3 T08): **+1 Start** aus dem Puffer (danach 7) für ein frisches Delta-Review opus (R673, R708). Hof
liefert auf `ort-a-siedlung.json` 0 Querschnitte (nur Rückseiten frei) → eine Fixture mit freien Vorderseiten ist Teil der T09-Vorbereitung durch C4 (aus dem Puffer),
nicht von T08. (2) I-112 C3 (`feat/i112` @ `1d201bf1`; T05 `bb60938e`, T06 `b48b181e`, T07 `a841388b`) → abgenommen. **`Umschalt+R` öffnet den Rat** (statt Weg)
bestätigt; `r` bleibt Weg, `tests/ui/hotkeys.test.ts` AK-TK-16 nimmt `r` aus; README/Tastenkürzel-Menü nennen es (T09). BEDENKEN T05 (`importsDecree` ohne
`require`/`import()`, Import-Reihenfolge `council.test.ts:26`) behebt C4 vor dem Final-Review; das Final-Review (opus, frisch, ganzer Branch) deckt R673 für T05 ab.
**C4: T08 Browser, T09 Doku, T05-Kleinfix, Final-Review; 6 Starts** (14 von 25 verbraucht). C4 holt zuerst `main` (PERF-BILANZ-COV berührt `hud.ts`, R727).

Regelbezug: R673, R705, R708, R713, R724, R727 · Kosten bei Irrtum: eine Tastenbelegung, die nach dem Playtest getauscht wird.

Entscheider: L0 · Anlass: Berichte lead-tech ORT-A C2 und I-112 C3 · ADR: —

## R729 · 2026-10-16 · ORT-A C2: Fix-Runde 4 T08 (Schatten-Versatz ½ Kachel) und +1 Delta-Review; Retro-Vormerkung

Ruling: Delta-Review 3 (opus) ZURÜCK mit einem blockierenden Befund (Schatten-Querschnitt in `kantenprofil.mjs` um ½ Kachel versetzt: `buildingShadow` Rohkoordinaten
vs. `tileCenter`), sonst alles bestätigt → **Fix-Runde 4 per Fortsetzung** (−0,5 in `liesSchattenMasse` plus Selbsttest ab Rohmassen) und **+1 Start** Delta-Review opus
(Puffer danach 6). Bei erneutem ZURÜCK: Stopp, L0 entscheidet über Zuschnitt (T08 ohne Schatten-Teil, Schatten nach T16). Retro-Vormerkung: T08 hat 5 Starts über Plan
verbraucht, weil Messwerkzeug-Code ohne Browser-Läufe (N-102) nur per Review geprüft werden konnte — für die ORT-A-Retro.

Regelbezug: R673, R705, R708, R723, R728, N-102 · Kosten bei Irrtum: ein weiterer Start aus dem Puffer.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C2 · ADR: —

## R730 · 2026-10-16 · ORT-A T08 mit BEDENKEN angenommen; Fixture und zwei Schwellen an C4 vor T09; C2 beendet

Ruling: `feat/ort-a-mess` @ `96fbd674` (Delta-Review 4 opus BEDENKEN, Koordinaten bestätigt) → **T08 angenommen**. Vor T09 erledigt C4 im Strang `mess`: (a) Fixture
mit freien Vorderseiten (Hof) und freiem Gras östlich der Häuser (Schatten, AK-37), (b) die zwei niedrigen Punkte in `kantenprofil.mjs` (Z. 200 Schwelle `x1 > xe + 0,05`
zu klein für das 0,2-Kernfenster; Z. 205 Prüfstart erst ab `x1 + 0,5`), weil die neue Fixture diese Gebäudetypen enthalten kann; je ein Selbsttest. Kein weiterer
Start für C2. Puffer jetzt 6. Browser-Läufe und A/A-Kontrolle weiter offen (N-102).

Regelbezug: R705, R729, N-102 · Kosten bei Irrtum: eine Messlinie, die in T09 noch einmal angepasst wird.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C2 · ADR: —

## R731 · 2026-10-16 · Freie Plätze → Ideen-Runde IDEEN-12 (3 Scouts, Parallelität 2)

Ruling: Drei Plätze frei, Pool bis auf I-111 abgearbeitet (I-110 geparkt R722, I-119/I-121 warten auf ORT-A T20) → **IDEEN-12** nach R445: lead-design (opus) mit 3
`design-idea-scout` (sonnet), Parallelität 2 (Deckel 6 inkl. laufender ORT-A C3, I-112 C4, TOOL-GUARD-REDACT). Schwerpunkte: Scout A Spieler-Rückmeldungen und
Playtest-Befunde seit REL-20; Scout B Genre-Mechaniken, die im Spiel noch fehlen; Scout C Spätspiel und Langzeitmotivation nach dem Denkmal. Ausgeschlossen:
Themen der Erweiterung 1 «Stände und Segel» (Nutzer-Session, R519) und Doppelungen mit Pool/Archiv. Je Scout höchstens 5 Ideen; lead-design bewertet nach Raster und
schlägt eine Rangliste vor; Gate Ideen-Runde durch L0. Pool-Pflege aus dem IDEEN-11-Handoff (Fragen 3, 4) nimmt lead-design mit, sofern noch offen.

Regelbezug: R445, R475, R519, R692, R698 · Kosten bei Irrtum: eine Ideen-Runde, deren Ergebnis eine Woche im Pool liegt.

Entscheider: L0 · Anlass: freie Kapazität · ADR: —

## R732 · 2026-10-16 · TOOL-GUARD-REDACT: +1 frisches Review auf `74c3d966`; Allowlist statt Muster-Jagd ins nächste Werkzeug-Bündel

Ruling: `tool/guard-redact` @ `74c3d966` (vier Commits, Rot-Belege, `studio-test` 974 grün; Handoff `.studio/handoffs/2026-10-16-lead-tech-TOOL-GUARD-REDACT.md`) → **+1 Start**
für ein frisches Review opus auf diesem Stand (R673), dann Gate Merge durch lead-qa. Die gemeldeten Restlücken zeigen, dass Muster-Schwärzung nie vollständig wird:
Folgepaket im nächsten Werkzeug-Bündel (KISS): `guard_block` speichert statt des Befehls nur Programmname + Unterbefehl (nur `[a-z0-9-]+`), Regel und einen
Hash des Befehls (Allowlist); die Schwärzung bleibt als zweite Linie. Restlücken und Über-Schwärzungen trägt lead-production beim Merge in `docs/beobachtungen.md` ein.

Regelbezug: R673, R721, R725, OWASP · Kosten bei Irrtum: ein Werkzeug-Paket mehr für eine lokale Datei.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-GUARD-REDACT · ADR: —

## R733 · 2026-10-16 · TOOL-GUARD-REDACT: Muster-Jagd beendet → TOOL-GUARD-ALLOWLIST jetzt; Ad-hoc-Retro Budgetüberschreitungen

Ruling: Das frische Review auf `tool/guard-redact` @ `74c3d966` ergab ZURÜCK (neue Unter-Schwärzung bei angehängten Namen wie `PGPASSWORD=`, `accessToken=`; `passphrase`
fehlt). Vier Runden Muster-Schwärzung haben je neue Lücken erzeugt → **kein Merge von `tool/guard-redact` als Endstand**. Stattdessen **TOOL-GUARD-ALLOWLIST** (lead-tech,
sonnet, Budget 3) auf diesem Branch: `guard_block` speichert im Feld `command` nur Programmname + Unterbefehl (je Token nur `[a-z0-9._-]+`, sonst `?`), dazu Regel
und SHA-256-Präfix (12 Zeichen) des vollen Befehls; nie Argumente. Die Schwärzung bleibt für andere Ausgaben als zweite Linie mit den Vorschlägen des Reviews
(`token`/`secret`/`password`/`passwd`/`credential`/`passphrase` ohne Zeichensperre, CamelCase). Tests: kein Secret aus der bisherigen Testsammlung erscheint im Ereignis.
**Ad-hoc-Retro** (studio-coach, sonnet, Hook-Pflicht): Budgetüberschreitung lead-tech 5 von 3 (TOOL-GUARD-REDACT, R725/R732) und ORT-A T08 +5 Starts (R717–R730) —
Ursache, Hebel, Messgrösse.

Regelbezug: R673, R725, R732, OWASP, Handbuch Verbesserungsschleife · Kosten bei Irrtum: ein Diagnosefeld mit weniger Inhalt (Hash statt Klartext).

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-GUARD-REDACT, Hook «Ad-hoc-Retro fällig» · ADR: —

## R734 · 2026-10-16 · I-112 Final-Review BEDENKEN: Befunde 1–4 vor dem Merge; +2 Starts (im Gesamtbudget 25)

Ruling: `feat/i112` @ `b7e65e55` (Handoff `.studio/handoffs/2026-10-16-lead-tech-I-112.md`; T05-Kleinfix `3ba35318`, Tooltip-Fix `867d1f0d`, T09 `5eb22120`): Final-Review opus
BEDENKEN → vor dem Merge beheben: **(1, hoch)** Rats-Karte wird bei Laden/«Neue Insel» entfernt (`dispose` in `src/ui/app.ts`), Test belegt, dass kein `decree` auf der
verworfenen Welt möglich ist; (2) Tooltip-Zeilen «Erzeugt»/«Ausstoss je Stufe»/«Braucht» mit beschlossenem Takt; (3) `council` im Cache-Schlüssel des Glauben-Umrisses;
(4) Rats-Karte über den Auftragskarten (`z-index`). `Umschalt+R` ohne Marke und das Sortieren je Tick: Beobachtung. Fehlender Reichweitenkreis bei stehender Kapelle
(schon auf main): Beobachtung. Naht-Wächter nimmt `council` wie `levels` als erlaubten `cycle`-Leser aus — angenommen. **+2 Starts** (UI-Umsetzer sonnet, Delta-Review
opus frisch), Verbrauch dann 22 von 25. Danach voller `make check` bei Last ≤ 8 und Zeitmessung bei Last ≤ 4 (sonst Vermerk), dann Gate Merge.

Regelbezug: R673, R708, R713, R728 · Kosten bei Irrtum: zwei Starts für Befunde, die auch nach dem Merge behebbar wären.

Entscheider: L0 · Anlass: Bericht lead-tech I-112 C4 · ADR: —

## R735 · 2026-10-16 · Ad-hoc-Retro Budget: V1, V2 angenommen (Handbuch 1.61), V3 sofort für L0

Ruling: Bericht `docs/studio/retros/2026-10-16-adhoc-budget.md` (`1e053c13`) → angenommen. Ursache: L0 bewilligte Zusatzstarts einzeln, ohne die Befundklasse der Vorrunde
zu vergleichen; Umschnitt kam je eine Runde zu spät (R725 statt R733; R728 statt R729). **V1:** Ein Budgetantrag nach dem zweiten ZURÜCK/BEDENKEN derselben Befundklasse
nennt die Klasse je Runde und eine Ansatz-Alternative; L0 bewilligt dann keinen weiteren Fix-Start ohne Ansatzprüfung (Messgrösse ≤ 1 Start über Budget je Paket über
5 Pakete, Frist 2026-11-30). **V2:** Messwerkzeug-Tasks bei belegtem Messfenster höchstens 2 Review-Runden, Rest ins Paket mit freiem Fenster (≤ 2 Starts über Plan über
3 Tasks, Frist 2026-12-15). Umsetzung V1/V2 als Handbuch 1.61 und Vorlage `templates/budgetantrag.md` durch studio-coach. **V3** gilt ab sofort für L0: jedes
Budget-Ruling nennt den kumulierten Stand («n von m»); Messgrösse 10/10 bis 2026-11-15. Stand heute: TOOL-GUARD-REDACT/ALLOWLIST 5 von 3 + 3; ORT-A Puffer 6 von 12;
I-112 22 von 25.

Regelbezug: R316, R673, R708, Handbuch Verbesserungsschleife · Kosten bei Irrtum: ein Umschnitt, der eine Runde zu früh kommt.

Entscheider: L0 · Anlass: Ad-hoc-Retro Budget · ADR: —

## R736 · 2026-10-16 · ORT-A E6: T05b Zwei-Zonen-Patch vor T06; Budget C3 «8 von 8», ORT-A-Puffer «8 von 12» verbraucht

Ruling: ORT-A C3 (`feat/ort-a`; T04 `d83f40a7`, T05 `c12563f0`, Beobachtungen `ebcc15ad`; Handoff `.studio/handoffs/2026-10-16-lead-tech-ORT-A-C3.md`) → T04, T05 abgenommen;
T04-BEDENKEN durch T05-Review gedeckt. P-9-Frühwarnung (Richtwert unter Last, CPU-Mikromessung `paintPixels`): B/A = 2,50–2,54 (≈ +150 %), überwiegend Fläche von
Rand 2; ≈ 37 ms liegt an der Ruckelgrenze 25 ms (R313). **E6 → Option 1: T05b Zwei-Zonen-Patch** (Ring rechnet nur den Saum, mischt auf gespeicherten Grundpuffer),
danach T06; Abbruchkriterium: liegt der Richtwert nach T05b noch > +50 % über A, Stopp und L0 entscheidet zwischen Rand 1 und Zuschnitt (V1 R735). Budget (V3):
C3 4 von 6 verbraucht + 2 aus dem Puffer für T05b → **C3 8 von 8**; ORT-A-Puffer **8 von 12** verbraucht (T08 +5, T05b +2, R723 +1). Gewertete Messung bleibt T09.

Regelbezug: R313, R705, R726, R735 · Kosten bei Irrtum: zwei Starts für einen Patch, der in T09 doch nicht reicht.

Entscheider: L0 · Anlass: Frühwarnung lead-tech ORT-A C3 (E6) · ADR: —

## R737 · 2026-10-16 · Gate Ideen-Runde IDEEN-12: Rangliste angenommen; Kurzdesign I-122 + I-123 jetzt, I-132 + I-133 danach

Ruling: `docs/ideen-12` @ `8dae3333` (I-122–I-135, Pool-Pflege; Handoff `.studio/handoffs/2026-10-16-lead-design-IDEEN-12.md`) → angenommen, Merge durch lead-production.
Leitbefund «Geld ist nur in den ersten 15 min knapp» (R722) als Bewertungsmassstab bestätigt. Priorität: (1) **I-122 Vorwarnung vor der Stammkunden-Lieferung + I-123
Reichweite mit Vertrag** → Kurzdesign Stufe leicht jetzt (lead-design sonnet; `CONTRACT_WARN_S` in `src/sim/defs/`, Audio nur Signal, kein Save); (2) **I-132 Meisterprüfung

- I-133 «Sturmjahr»** → Kurzdesign Stufe voll mit Rechnung beim nächsten freien Platz; (3) I-128 Lärm und Rauch → Baustein Stadtplanungs-Brainstorming. Geparkt: I-124
  (bis Playtest-Trigger und ORT-A-Merge), I-130, I-134 (bis `BUY_RISE` > 0), I-131 (bis I-112 live). Verworfen: I-125, I-126, I-127, I-129, I-135. Budget (V3): IDEEN-12
  3 von 3.

Regelbezug: R445, R692, R722, R731 · Kosten bei Irrtum: ein Häppchen, das nach dem Playtest leiser gestellt wird.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-12 · ADR: —

## R738 · 2026-10-16 · Gate Spec I-122 + I-123: OK; Warnfenster 300 Ticks; Plan jetzt, Umsetzung nach I-112-Merge

Ruling: `design/i122-i123` @ `50698d85` (Handoff `.studio/handoffs/2026-10-16-lead-design-design-I-122-I-123.md`) → **Gate Spec OK**. Warnung als UI-Ableitung auf der
Sim-Lesefunktion `contractWarning` (kein Save, Baseline unberührt), Audio-Signal `'contractWarn'` ohne Import aus `src/sim/`/`src/ui/`. **`CONTRACT_WARN_TICKS = 300`**
(30 s Spielzeit) statt 20 s; nach dem Laden still bis zur nächsten Periode. Einmaliges Aufleuchten im Fenster statt der heutigen Dauerfärbung. Der Verdacht
«`nextOrderTick` mit `farSkip` zeigt nach Fernauftrag + Vertrag eine Periode zu spät» prüft lead-tech im Plan per Test (bestätigt → Beipack-Task, sonst Beobachtung).
Plan Stufe leicht jetzt (lead-tech, sonnet, Budget 1); Umsetzung erst nach dem Merge von I-112 (Konfliktfläche `app.ts`, `hud.ts`).

Regelbezug: gates.md Gate Spec, R737, E-061 · Kosten bei Irrtum: ein Warnfenster, das nach dem Playtest gekürzt wird.

Entscheider: L0 · Anlass: Bericht lead-design design-I-122-I-123 · ADR: —

## R739 · 2026-10-16 · ORT-A nach T05b: U1-Zuschnitt (Vorrechnung je Kachel) einmal, dann T06; keine weitere Perf-Runde vor T09

Ruling: T05b `ee319849` (Ausgabe bytegleich, Ring malt nur geänderte Läufe) → Mikromessung unter Last 24–44 B/A ≈ 1,9 (Spanne 1,65–2,63; vorher 2,5), Restkosten in U1 je Pixel
(`hofsaumAt`) und `buildGroundEdge`. **Option 1 einmal:** `hofsaumAt` rechnet Abstände je Kachel vor und steigt früh aus (Umsetzer); **ein gemeinsamer Review für T05b + U1**
(statt zweier); danach T06 (Umsetzer + Review). Nach V1 (R735, zweite Runde derselben Befundklasse «Patch-Zeit zu hoch») gibt es **keine weitere Perf-Runde vor T09**: die
gewertete Messung im freien Messfenster entscheidet; liegt sie dort > +20 %, entscheidet L0 zwischen Rand 1 und Zuschnitt (E6). Budget (V3): C3 5 von 8 verbraucht + 4
geplant = **9 von 8, +1 aus dem Puffer**; ORT-A-Puffer **9 von 12**.

Regelbezug: R313, R705, R735, R736 · Kosten bei Irrtum: ein Start für eine Optimierung, die die Messung im ruhigen Fenster nicht gebraucht hätte.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C3 nach T05b · ADR: —

## R740 · 2026-10-16 · I-112 Delta-Review BEDENKEN (Perf-Regression aus Befund-2-Fix): +2 Starts, Ansatz «nur sichtbarer Tooltip»

Ruling: `feat/i112` @ `fbc4cf78` (`make check` Exit 0; Befunde 1–4 aus R734 behoben, Naht-Ausnahme bestätigt) → Delta-Review opus BEDENKEN mit neuer hoher Regression:
das Live-Update der Takt-Zeilen (`src/ui/buildMenu.ts:558`) rechnet je Tick für jedes produzierende Gebäude eine Bilanz-Probe und bricht I-078 AK-14 (verzögertes Rechnen).
Befundklasse neu (Leistung statt Anzeige), daher kein V1-Umschnitt. **Ansatz vorgegeben (KISS):** `.tt-cycle` nur im sichtbaren Tooltip füllen wie `fillBalance`; Lazy-Test
«I-078» um `.tt-cycle` erweitern (Rot-Beleg); dazu `.messages` z-index 11 und doppelter Radius-Text `buildMenu.ts:548`. Regel: Live-Updates von Tooltip-Zeilen lösen nie eine
Bilanz-Probe ausserhalb des sichtbaren Tooltips aus. **+2 Starts** (UI-Umsetzer sonnet, frisches Delta-Review opus); Budget (V3) I-112 **24 von 25**. Danach `make check`
bei Last ≤ 8, dann Gate Merge. Bei erneutem BEDENKEN derselben Klasse: V1 (Ansatzprüfung vor jedem weiteren Start).

Regelbezug: R673, R708, R734, R735 · Kosten bei Irrtum: zwei Starts für eine Regression, die sonst erst im Playtest auffiele.

Entscheider: L0 · Anlass: Bericht lead-tech I-112 C4 · ADR: —

## R741 · 2026-10-16 · Gate Plan I-122 + I-123: OK; Budget 12 + 1, Parallelität 2; Start nach I-112-Merge

Ruling: `plan/i122-i123` @ `70486f0b` (T00–T07, Handoff `.studio/handoffs/2026-10-16-lead-tech-plan-I-122-I-123.md`) → **Gate Plan OK** (Stufe leicht, L0). Probe R738 per
Codelesung bestätigt (`settleContract` trotz `farSkip`, `nextOrderTick` eine Periode zu weit) → T01 belegt per Test, T02 Beipack (`orderCardText` nutzt `nextSettleTick`).
Reichweite in neuer Datei `src/ui/contractDrain.ts` angenommen; Ablagen `contractWarning` (`orders.ts`), `shouldWarnNow`/`flashOrderCard` (`order.ts`), `warnedPeriod` (`app.ts`)
angenommen. Review-Form: ein frisches Final-Review opus bei Diff ≤ 300 Zeilen Code (E-068), sonst zusätzlich Task-Review T01. Vertragskarten-Umbruch bei 1280 px prüft T06,
Fallback kleinere Schrift. Budget (V3) **12 Arbeiter-Starts + 1 Controller, Parallelität 2** (statt 3: Deckel 6 und Last). **Start nach dem Merge von I-112**, T00 holt main.

Regelbezug: gates.md Gate Plan, R738, E-068 · Kosten bei Irrtum: ein Strang, der eine halbe Stunde später läuft.

Entscheider: L0 · Anlass: Bericht lead-tech plan-I-122-I-123 · ADR: —

## R742 · 2026-10-16 · Gate Merge I-112: OK mit M-1/M-2; Merge jetzt (Save v17); danach I-122 + I-123

Ruling: `feat/i112` @ `3fbd13b4` (Gate-Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-I-112.md`; `make check` Exit 0, 4320 Tests; 17 AKs belegt; Baseline bitgleich) →
**Gate Merge OK**. **M-1:** `SAVE_VERSION` = main + 1 beim Merge = **17** (main ist 16; Erweiterung 1 hat nicht gemergt); die Nutzer-Session nimmt für Erweiterung 1 dann
main + 1 = 18 (R674). **M-2:** Playtest-Bilder bleiben lokal unter `.studio/qa/i112/` im Worktree (Arbeitsablage, nicht versioniert; Aufräumen nach R682). Regel aus R740
(Tooltip-Zeilen nur sichtbar) gilt dauerhaft. lead-production merged lokal (`--no-ff`), nimmt I-112 in REL-26 auf (Save v16 → v17 mit Migration) und setzt in
`docs/ideen.md` I-112 auf «gemergt (R742)». Danach startet I-122 + I-123 (R741). Budget (V3) I-112 abgeschlossen mit 24 von 25.

Regelbezug: gates.md Gate Merge, R674, R682, R706, R711, R740, R741 · Kosten bei Irrtum: eine Save-Nummer, die vor dem Push neu vergeben werden muss.

Entscheider: L0 · Anlass: Bericht lead-qa gate-I-112 · ADR: —

## R743 · 2026-10-16 · TOOL-GUARD-ALLOWLIST: V1-Umschnitt — Feld `command` entfällt; +1 Start (Delta-Review)

Ruling: `tool/guard-redact` @ `bad87718` (Handoff `.studio/handoffs/2026-10-16-lead-tech-TOOL-GUARD-ALLOWLIST.md`) → Delta-Review opus ZURÜCK: freie Tokens gelangen weiter ins
Feld `command` (erstes Argument bei Programmen ohne Unterbefehl; erstes Wort bei Nicht-Bash-Werkzeugen). Dritte Runde derselben Befundklasse «freier Text im Ereignis» →
**V1 (R735): Ansatz statt Fix.** `guard_block` speichert **kein** Feld `command` mehr, nur `rule`, `tool`, `summary` (fester Text je Regel) und `command_hash`
(SHA-256-Präfix, 12 Zeichen). Leser geprüft: kein Werkzeug in `tools/studio/` liest `command` aus `guard_block` (nur `hook.py`/`efficiency.py` aus `tool_input`).
Die Schwärzung `redact` bleibt für andere Ausgaben. Umsetzung per Fortsetzung des Umsetzers, **+1 Start** frisches Delta-Review opus; bei OK Gate Merge (lead-qa). Budget (V3):
TOOL-GUARD-REDACT 5 von 3 (abgeschlossen), TOOL-GUARD-ALLOWLIST **4 von 3**.

Regelbezug: R673, R725, R732, R733, R735, OWASP · Kosten bei Irrtum: ein Diagnosefeld weniger (Regel und Hash bleiben).

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-GUARD-ALLOWLIST · ADR: —

## R744 · 2026-10-16 · Gate Merge TOOL-GUARD-ALLOWLIST: OK; Ampel gelb → herunterfahren

Ruling: (1) `tool/guard-redact` @ `bea0179c` (Gate-Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-TOOL-GUARD-ALLOWLIST.md`) → **Gate Merge OK**; `guard_block` speichert nach
R743 weder Befehl noch Befehlsteile. lead-production merged lokal (`--no-ff`), nimmt es in REL-26 auf und trägt «`_shown_command`/`COMMAND_LIMIT` nur noch von Tests genutzt»
als Beobachtung ein. (2) **Limit-Ampel gelb (5h 60 %)**: keine neuen Pakete oder Wellen. Abschliessen: I-122 + I-123 bis Gate Merge und Merge; Kurzdesign I-132 bis Gate Spec
(Plan in der Folgesession); ORT-A C3 bis T06, danach Pause — C4 (Fixture, T09) in der Folgesession, T09 braucht ohnehin das freie Messfenster (N-102). Danach
Session-Ende-Routine. REL-26-Push frühestens 2026-10-17 (R712).

Regelbezug: gates.md Gate Merge, R69, R712, R743 · Kosten bei Irrtum: ORT-A C4 startet eine Session später.

Entscheider: L0 · Anlass: Bericht lead-qa gate-TOOL-GUARD-ALLOWLIST, Ampel gelb · ADR: —

## R745 · 2026-10-16 · Gate Spec I-132 «Meisterprüfung»: Variante S (nur «Eigenversorgung»); I-133 verworfen; Plan in der Folgesession

Ruling: `design/i132` (Spec `e1d1cf1c`, Anhang `42d32eb7`; Handoff `.studio/handoffs/2026-10-16-lead-design-design-I-132.md`) → **Gate Spec OK, Variante S**. **E1:** nur die Auflage
«Eigenversorgung» (Zukauf gesperrt; im Messlauf ohne Vorbereitung Scheitern bei Tick 150, Engpass Schiffstransport von Gewürz/Stein — erfüllt den Massstab R722);
«Genügsam» (Kasse nie < 2454) und «Sturmjahr» (3 Feuerwachen halten ≥ 93 %) sind gerechnet trivial → gestrichen, **I-133 verworfen**. **E2:** keine Abriss- oder Steuersperre; die
Abbruchschwelle deckelt das Verkleinern. **E3:** Startfenster 60–150 Kaufleute (Obergrenze geschätzt, Playtest-Trigger Spec §10). **E4:** Abbruch unter 70 % der Starteinwohner
(90 % reisst im Normalspiel in 11 von 16 Seeds). Save: Feld `trial`, `SAVE_VERSION` = main + 1 beim Merge (main jetzt v17), Migration wie R711 R-4; Baseline bitgleich. Plan in
der Folgesession ab main (I-112 ist gemergt). Drei Controller-Befunde (keine Nahrungsreserve, keine Feuerwache, Gewürzkauf nur 100 Ticks voraus) trägt lead-production in
`docs/beobachtungen.md` ein. Budget (V3) design-I-132 1 von 2.

Regelbezug: gates.md Gate Spec, R674, R711, R722, R737 · Kosten bei Irrtum: eine Obergrenze, die nach dem Playtest verschoben wird.

Entscheider: L0 · Anlass: Bericht lead-design design-I-132-I-133 · ADR: —

## R746 · 2026-10-16 · ORT-A C3 bis T06 abgenommen; T06-BEDENKEN zuerst in C4; ORT-A pausiert bis zur Folgesession

Ruling: `feat/ort-a` @ `310c6e00` (T04–T06, T05b, U1-Zuschnitt `548b8440`/`339f535b`, Fix `cf5a239b`; Handoff `.studio/handoffs/2026-10-16-lead-tech-ORT-A-C3.md`) → abgenommen mit
offenem T06-BEDENKEN (mittel). Richtwert nach T06 B/A ≈ 1,41 (Last 5–9, «Messfenster belegt»; vorher 2,5) — weiter über +20 %, Entscheid in T09 (R739). **C4 beginnt in der
Folgesession mit:** (a) Unit-Test des Ringpfads von `twoZonePieces` mit zwei `GroundEdge` (Ring schmutzig erzwingen) — schlägt er fehl oder zeigt er keinen Nutzen, wird auf
Rand 1 vereinfacht (Entscheid L0 nach Bericht); (b) Merge `feat/ort-a-mess` (P-1); (c) Fixture und Schwellen Z. 200/205 (R730); (d) T09 nur bei freiem Messfenster. AK-07
(≤ 2 s je Fall, unter Last 2,8–3,8 s) wird bei T21 verkleinert. Budget (V3): C3 **9 von 9**; ORT-A-Puffer **9 von 12**; Gesamt ORT-A ≈ 30 von 57 Starts.

Regelbezug: R705, R730, R735, R736, R739, R744 · Kosten bei Irrtum: ein Ringpfad, der als toter Code in den Merge geht.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C3 · ADR: —

## R747 · 2026-10-16 · Actions-Sparregeln (N-98) gelockert: Inselreich ist öffentlich, Minuten zählen nicht

Ruling: Nutzeranweisung „public repo, Actions-Minuten zählen nicht zum Limit, Limitation aufweichen“. Beleg: `gh repo view` → `PUBLIC`;
Billing-Usage Oktober: Inselreich 1074 min, `discountAmount` = `grossAmount`, netto 0. Die Ampel „Actions-Minuten (Monat)“ zählt diese
Minuten bisher gegen das Kontingent von 2000 min (Konto-Prognose ROT) — Fehlbewertung. Auslegung (Paket **TOOL-ACTIONS-FREI**):
**V1** `ci.yml`: `paths-ignore` entfällt (Push auf main und PR), damit auch Doku-/Studio-Pushes `make check` durchlaufen (prüft u. a.
`docs/studio/`); `cancel-in-progress` bleibt (überholte Läufe, kein Sparzweck). **V2** `pages.yml`: Deploy wieder automatisch, aber erst
nach grüner CI auf main (`workflow_run` von CI, `conclusion == success`, Checkout `head_sha`); `workflow_dispatch` bleibt für Reruns und
die R450-Ausnahme. Der manuelle Schritt `gh workflow run Pages` beim Release entfällt; der Integrator prüft den Deploy-Lauf weiterhin.
**V3** `tools/studio/actions.py`: Minuten öffentlicher Repos (Inselreich) zählen nicht zu Konto-Minuten und Konto-Prognose, sondern stehen
nur als Info; Session-Minuten nur Info, solange das Repo öffentlich ist. Damit entfällt die Grundlage für R488 V2 (Rot → ein Push je
Tag) für Inselreich und für „REL-26 frühestens 2026-10-17“ (R712). **Bleibt:** „höchstens ein Push je Session“ (R335), Merges lokal,
`make push-check` vor jedem Push — das sind keine reinen Minuten-Regeln. **V4** Doku nachführen: STUDIO.md (Push-Ablauf, Session-Ende),
`production-integrator.md` (Schritte 4/5), Workflow-Kommentare, arc42 (Deploy-Diagramm), lernen.md (Actions-Zeile). E-012 „Pages nur bei
Spieländerungen“ wird gegenstandslos (Status setzt der Coach in der nächsten Retro). Kein Nutzer-Vorbehalt nötig: N-98 ist durch die
Nutzeranweisung selbst gelockert.

Regelbezug: N-98, R334, R335, R450, R488 V2, R712 · Kosten bei Irrtum: zusätzliche CI-/Pages-Läufe ohne Kosten; falls das Repo wieder
privat wird, greift das Kontingent wieder (actions.py prüft die Sichtbarkeit).

Entscheider: L0 · Anlass: Nutzeranweisung 2026-10-16 · ADR: —

## R748 · 2026-10-16 · Gate Merge TOOL-ACTIONS-FREI: OK; Merge lokal, Push mit REL-26

Ruling: `feat/tool-actions-frei` @ `42e04202` (Handoff `.studio/handoffs/2026-10-16-lead-tech-TOOL-ACTIONS-FREI.md`) → OK. Review-BEDENKEN
(Fork-PR von Branch `main` löst `workflow_run` aus) ist in `42e04202` behoben (`workflow_run.event == 'push'`); L0 hat den Workflow-Diff
selbst geprüft, Delta-Review entfällt (Budget 2/2, Änderung eine Bedingung). `make check` lief nach `dd5bb89a` grün, der letzte Lauf brach an
der Testsperre ab (kein Testfehler) → der Integrator fährt `make check` beim Merge ohnehin. Merge lokal; die neuen Workflows wirken erst mit
dem nächsten Push (REL-26, Release-Check in der pushenden Session, R712 V2). Rest-Befund: Minuten anderer öffentlicher Repos des Kontos
zählen weiter (≈ 480 min) → Beobachtung.

Regelbezug: R747, R712 V2 · Kosten bei Irrtum: ein Pages-Lauf zu viel oder zu wenig; Rückfall per `workflow_dispatch`.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-ACTIONS-FREI · ADR: —

## R747 · 2026-10-16 · Gate Merge I-122 + I-123: OK; Merge jetzt; Cache-Write-Ad-hoc in die Kurz-Retro

Ruling: (1) `feat/i122-i123` @ `2af563fc` (Gate-Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-I-122-I-123.md`; `check.log` 4361 Tests grün nach dem Fix) → **Gate Merge OK**.
BEDENKEN 1–3 als Beobachtungen (Rot-Beleg im Ledger nicht nachvollziehbar; widersprüchliche Exit-Zeilen `final.txt`/`check.log`; lead-tech-Beobachtungen Umbruch «Strafe / 135»
bei 1280 px, verzögerter Klang bei Pause-Annahme, `querySelector` in `app.ts`, hängender Playtester-Lauf) — der volle Lauf im `push-check` vor REL-26 deckt Punkt 2 ab.
lead-production merged lokal (`--no-ff`), trägt die Beobachtungen ein, setzt I-122/I-123 in `docs/ideen.md` auf «gemergt (R747)» und nimmt das Paket in REL-26 auf. Budget (V3)
I-122-I-123 10 von 12. (2) Hook «Ad-hoc-Retro fällig: Cache-Write 5 min zwei Sessions rot» → in die laufende Kurz-Retro ca9d40c8 aufgenommen (Ursache nach Rolle, Hebel Pflicht nach
R316), kein eigener Start.

Regelbezug: gates.md Gate Merge, R316, R712 V2, R741, R744 · Kosten bei Irrtum: ein Rot-Beleg, der im Push-Check nicht auffällt.

Entscheider: L0 · Anlass: Bericht lead-qa gate-I-122-I-123, Hook Ad-hoc-Retro · ADR: —

## R750 · 2026-10-16 · Kurz-Retro ca9d40c8: V1–V3 angenommen (Umsetzung Folgesession); Session-Ende ca9d40c8

Ruling: Bericht `docs/studio/retros/2026-10-16-session-ca9d40c8-ende.md` (`8d11ea5e`) → angenommen; deckt auch die Hook-Ad-hoc «Cache-Write 5 min zwei Sessions rot» (R747 dieser
Session, umnummeriert auf R749). **V1:** `test_passed`/`test_failed` tragen 1-min-Last und Vitest-Worker-Zahl; bei Last ≥ 8 begrenzt `make` die Worker (Wert prüft lead-tech) —
im nächsten Werkzeug-Bündel zusammen mit dem Aufräumen von `_shown_command`/`COMMAND_LIMIT` (R744); Messgrösse Last ≥ 8 an ≤ 25 % der Läufe, max. Last ≤ 20, Bewertung 2026-10-30.
**V2:** Briefings schätzen nur in Tools, Minuten = Tools ÷ 6 durch das Werkzeug (Handbuch-Minor); Messgrösse |Minuten-Abweichung| ≤ 30 % in 2 Session-Retros. **V3:** je
Controller-Instanz höchstens eine Wartepause > 5 min, danach Handoff und Folgeinstanz (Handbuch-Minor); Messgrösse Pause-Anteil lead-tech ≤ 20 % (heute 40 %), Cache-Write ≤ 25 %,
Frist 2026-10-30. Messauftrag «L0-Zwischenstand in state.md ab 250k»: erfüllt (`1c41da14` bei R726). Ruling-Kollision mit der parallelen L0-Session anno-clone #2: dort R747/R748,
meine R747 wird R749 (Absprache per Nachricht); diese Session schreibt danach keine Rulings mehr. Session-Ende ca9d40c8: alle gestarteten Pakete abgeschlossen oder pausiert
(ORT-A nach T06, R746); REL-26-Push und Push-Gate gehören der nächsten Session bzw. anno-clone #2 (R335).

Regelbezug: R129, R316, R335, R708, R735 · Kosten bei Irrtum: zwei Handbuch-Minors, die nach der Bewertung zurückgenommen werden.

Entscheider: L0 · Anlass: Kurz-Retro ca9d40c8, Session-Ende · ADR: —

## R751 · 2026-10-16 · Nutzerauftrag «push»: neue Studio-Session, REL-26 jetzt inkl. TOOL-ACTIONS-FREI

Ruling: Nutzer: «push.» nach dem Session-Ende ca9d40c8 → neue Studio-Session (R434), ihr einziger Push ist REL-26 (R335). Ablauf: (1) lead-production merged
`feat/tool-actions-frei` @ `42e04202` lokal (Gate OK R748 der Parallel-Session, «Push mit REL-26»); (2) lead-qa Release-Check REL-26 mit Release-Notizen (Handbuch 1.60:
nur in der Push-Session); (3) `production-integrator` in `.worktrees/integrate`: `make push-check`, Push per geprüftem Hash, CI- und Pages-Lauf prüfen. R488 V2 «ein Push
je Tag» entfällt durch R747 der Parallel-Session (öffentliches Repo); der Nutzerauftrag geht ohnehin vor. Ruling-Nummern: R749 bleibt für die Umnummerierung durch
anno-clone #2 reserviert (offline); diese Session nutzt R751 ff. und prüft vor jedem Ruling `main`.

Regelbezug: R335, R434, R712 V2, R747/R748 (anno-clone #2), VERFASSUNG §5 · Kosten bei Irrtum: ein Release, das einen Paket-Merge der Parallel-Session vorwegnimmt.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R752 · 2026-10-16 · Release-Check REL-26: OK; push-check und Push jetzt

Ruling: `main` (Release-Handoff `.studio/handoffs/2026-10-16-lead-qa-release-REL-26.md`, geprüft auf `9d02e700` gegen `origin/main` `8fe744df`) → **Release REL-26 OK**. Inhalt:
I-120, I-118, UI-AUFRAEUM-4, TOOL-BUENDEL-14, I-114, BEOB-17, PERF-BILANZ-COV, I-112 (Save v16 → v17 mit Migration), TOOL-GUARD-ALLOWLIST, IDEEN-12, I-122 + I-123,
TOOL-ACTIONS-FREI. Auflagen an den `production-integrator`: (1) `make push-check` mit vollem Lauf, Exit-Code im Bericht (deckt R727 und die Exit-Lücke aus I-122 BEDENKEN 2);
(2) Push nur des geprüften Hashes (`git push origin <Hash>:main`); (3) danach CI-Lauf und — da TOOL-ACTIONS-FREI die Workflows ändert — Pages-Lauf prüfen, Rückfall
`gh workflow run Pages --ref main` (R748). L0 committet bis zum Ende des push-checks nicht auf main (R697).

Regelbezug: gates.md Release, R335, R697, R712 V2, R748, R751 · Kosten bei Irrtum: ein roter CI-Lauf auf main, der per Hotfix behoben wird.

Entscheider: L0 · Anlass: Release-Check lead-qa REL-26 · ADR: —

## R753 · 2026-10-16 · REL-26 live; Push-Session beendet

Ruling: `make push-check` EXIT=0 auf `6f14a354` (4361 Tests, `check-ci-perf` grün), Push `8fe744df..6f14a354`, CI 38914539819 grün, Pages 38915602338 grün — automatisch per `workflow_run`,
der erste Lauf mit den Workflows aus TOOL-ACTIONS-FREI. **REL-26 «Rat, Vorwarnung, Klang» live**, Save v17. Release-Notiz in `state.md`. Die push-check-Hinweise «Ereignis nicht
geschrieben» und «Lastprotokoll fehlgeschlagen» gehen ins Werkzeug-Bündel 15 (R750). Die Push-Session (R751–R753) bestand nur aus Merge, Release-Check und Push; ihre Kurz-Retro
deckt die Retro ca9d40c8 ab (keine eigene, Abweichung von der Ende-Routine wegen Umfang). Nächste Session: neues Claude-Gespräch, Plan aus `state.md`.

Regelbezug: R335, R434, R751, R752 · Kosten bei Irrtum: eine fehlende Mini-Retro für eine Push-Session.

Entscheider: L0 · Anlass: Bericht production-integrator REL-26 · ADR: —

## R754 · 2026-10-17 · Session 21273458: «mach weiter» = Plan aus state.md; vier Pakete parallel

Ruling: Nutzer: «mach weiter» → Plan aus `state.md` fortsetzen (R434, Autonomie §5). Parallel-Session anno-clone #2 ohne frische Heartbeats (letzte Ereignisse 2026-10-16) → diese
Session ist die aktive L0-Session (R129); Ruling-Nummern weiter gegen `origin/main` prüfen. Start, Deckel 6 (R698): **(A) RETRO-ADHOC-17** `studio-coach` (sonnet, Kurz-Retro):
Hook-Ad-hoc (Budget lead-tech 5 von 3, Cache-Write zwei Sessions rot, studio-director inaktiv) gegen R735/R750 abgleichen, nur Neues bewerten; im selben Start Handbuch-Minor
R750 V2 (Schätzung nur in Tools) und V3 (eine Wartepause je Controller-Instanz). **(B) TOOL-BUENDEL-15** `lead-tech` (sonnet, Werkzeug-Paket): R750 V1, R744
(`_shown_command`/`COMMAND_LIMIT`), push-check-Hinweise aus R753; Budget 5 Starts, Parallelität 1. **(C) plan-i132** `lead-tech` (opus, Tech-Lead beim Plan): Plan nach R745,
Save main + 1 = v18; Budget 1 Start (eine Plan-Prüfung). **(D) ORT-A C4** `lead-tech` (sonnet, Controller): Schritte (a)–(c) aus R746, T09 nur bei freiem Messfenster;
Budget 3 Starts aus dem ORT-A-Puffer (dann 12 von 12), Parallelität 1. Last beim Start 8,4: Testläufe halten TOOL-TESTLOCK ein (R380); Mehrbedarf vor dem Überschreiten melden.

Regelbezug: R129, R380, R434, R698, R735, R744, R745, R746, R750, R753 · Kosten bei Irrtum: ein Werkzeug-Bündel, das bei hoher Last länger braucht als geschätzt.

Entscheider: L0 · Anlass: Session-Start 21273458 · ADR: —

## R755 · 2026-10-17 · Ad-hoc-Retro RETRO-ADHOC-17: abgedeckt bis auf «inaktiv»-Fehlalarm; V1 angenommen für Werkzeug-Bündel 16; Handbuch 1.63

Ruling: Bericht `docs/studio/retros/2026-10-17-adhoc-hook.md` (`5a3c27e9`) → angenommen. Budget «lead-tech 5 von 3» ist durch R735, Cache-Write durch R750 V3 und E-068 abgedeckt
(Messauftrag Tool-Ergebnisgrösse bis 2026-10-23 abwarten). **V1 angenommen:** `studio-director` und `lead-qa` gelten nicht als inaktiv, solange Kind-Agenten Heartbeats senden
oder ein langer Make-Lauf läuft; Umsetzung im **Werkzeug-Bündel 16** (nicht nachträglich in das laufende TOOL-BUENDEL-15, um dessen Zuschnitt nicht zu ändern), Messgrösse 0 Signale
über 3 Sessions, Frist 2026-10-30, Rückfall: Regel entfernen. Handbuch 1.63 (R750 V2 und V3) umgesetzt; die Reibung von V3 mit R438 V2 bewertet die Retro am 2026-10-30.

Regelbezug: R735, R750, R754, E-068 · Kosten bei Irrtum: ein Fehlalarm, der zwei Wochen weiter erscheint.

Entscheider: L0 · Anlass: Bericht studio-coach RETRO-ADHOC-17 · ADR: —

## R756 · 2026-10-17 · ORT-A C4 abgenommen (Ringpfad bleibt); C5 startet T09, bei OK T10

Ruling: `feat/ort-a` (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C4.md`) → abgenommen. (a) Ringtest `twoZonePieces` grün, Mutation `dirty = false` färbt 3 von 4 Fällen rot,
Nutzen belegt (> 20 % weniger Ringkacheln, pixelgleich) → **kein Rückbau auf Rand 1**, T06-BEDENKEN aus R746 erledigt. (b) `feat/ort-a-mess` gemergt (`560dbdde`, P-1). (c) Fixture
`tools/render-qa/fixtures/ort-a-siedlung.json` (Ablage unter `tools/render-qa/` statt `fixtures/` akzeptiert) und Schwellen `kantenprofil.mjs` mit Rot-Beleg. Offener niedriger
Review-Punkt (`a.w !== b.w` in `hofsaumTileChanged` ungetestet) geht in T21. **C5:** T09 (`make messfenster`, gewertete Messung, Frühwarnung E6); Messfenster belegt → höchstens
eine Wartepause ≤ 5 min (R750 V3), sonst Handoff ohne T09. Ergibt T09 keinen E6-Entscheidungsbedarf, darf C5 im selben Start T10 (Browser-Check, `qa-playtester`, 1 Browser-Lauf)
anschliessen. Budget: verbleibend 2 von 3 Starts (R754).

Regelbezug: R730, R739, R746, R750 V3, R754 · Kosten bei Irrtum: ein selten durchlaufener Ringpfad bleibt im Code.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C4 · ADR: —

## R757 · 2026-10-17 · Gate Merge TOOL-BUENDEL-15: OK, Merge lokal; Werkzeug-Bündel 16 startet

Ruling: `tool/buendel-15` @ `ef0988d2` (Handoff `.studio/handoffs/2026-10-17-lead-tech-TOOL-BUENDEL-15.md`, Review OK in einer Runde, `make studio-test` 997 grün, ruff und docs-check
Exit 0) → **Gate Merge OK**; `production-integrator` merged lokal nach main, kein Push (R335). R750 V1 erfüllt (`load`/`workers` in Testereignissen, Deckel 4 Worker bei Last ≥ 8);
R744 erledigt; R753-Hinweise sind Testrauschen aus absichtlichen `OSError`-Tests, jetzt abgefangen. Diff 326 Zeilen knapp über E-068 (300) — ein Reviewer genügt hier, weil reiner
Werkzeugcode ohne Spieleinfluss. **Befund:** Der Worker-Deckel greift nur bei Last genau 8, weil TOOL-TESTLOCK über 8 abbricht → **TOOL-BUENDEL-16** (`lead-tech`, sonnet,
Werkzeug-Paket; Budget 3 Starts, Parallelität 1): (1) R755 V1 «inaktiv»-Fehlalarm für studio-director/lead-qa, (2) Deckel-Schwelle mit TOOL-TESTLOCK abstimmen (Vorschlag
lead-tech mit Begründung, z. B. Deckel ab Last 6), (3) stdout-Rauschen `test_aufraeumen`.

Regelbezug: R335, R744, R750, R753, R755, E-068 · Kosten bei Irrtum: ein Worker-Deckel, der in der Praxis selten wirkt, bis Bündel 16 gemergt ist.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-15 · ADR: —

## R758 · 2026-10-17 · ORT-A: Importzyklus TEX blockiert T09; Fix-Task FIX-TEX in C6, dann T09/T10; Puffer +2

Ruling: Bericht C5 (`.studio/qa/ort-a/messung-ort1.md`, Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C5.md`): `feat/ort-a` lädt im Browser nicht — `ReferenceError: Cannot access
'TEX' before initialization` (`src/render/limits.ts:74`), Zyklus `iso.ts` → `ortsrand.ts` → `limits.ts` → `iso.ts`; Vitest und tsc sehen ihn nicht. T09 ungewertet (A-Werte nur Referenz).
→ Empfehlung angenommen: **FIX-TEX** in C6 — `TEX` nach `src/render/isoBase.ts`, Re-Export in `iso.ts`, `limits.ts` importiert aus `isoBase`; Test, der `iso.ts` zuerst in frischem
Modulgraphen lädt, mit Rot-Beleg; Task-Review. Danach T09 und (ohne E6-Bedarf) T10. Zusätzlich in C6: ein Browser-Smoke (Spiel lädt, keine Konsolenfehler) vor T09 als
Vorbedingung. Budget: 2 verbleibende Starts aus R756 + **2 zusätzliche** (ORT-A-Puffer überschritten: 14 von 12, bewusst, weil ein Ladefehler sonst erst im Release auffiele).
Lernpunkt an die Session-Retro: Render-Stränge laufen mehrere Tasks ohne Browser-Ladeprobe.

Regelbezug: R746, R750 V3, R756 · Kosten bei Irrtum: zwei Starts über Puffer.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C5 · ADR: —

## R759 · 2026-10-17 · Gate Plan I-132: OK mit lead-qa-Auflagen; Umsetzung startet jetzt (17 + 1 Starts)

Ruling: `plan/i132` @ `7b7c3312` (Handoff `.studio/handoffs/2026-10-17-lead-tech-plan-I-132.md`) → **Gate Plan OK mit Auflagen**. lead-production: OK, Ownership eindeutig, ORT-A berührt
nur getrennte Hunks in `src/ui/app.ts`, Erweiterung 1 ohne Code (wer später merged, zieht die Save-Version nach; I-132 voraussichtlich v18). lead-qa: BEDENKEN ohne Blocker → Auflagen
verbindlich, eingearbeitet durch Controller C1 **vor T00** als Plan-Commit: (1) Index-Risiken: Obergrenze 150 und Schwelle 70 % mit Rückfall (Obergrenze senken oder «A1 sperrt nur
Gewürz und Stein») und Playtest-Trigger aus Spec §10; AK 6 emuliert den Sollfluss und belegt den Ausbaupfad nicht (so im Bericht). (2) T02: `trial-run` auf mindestens einem zweiten
Seed (mindestens «ohne Zufuhr scheitert», Ende-Tick und Abstand zur Schwelle), notfalls als einmalige Messung im Ledger; Minimum Einwohner/`e0` mitloggen. (3) T02: Test «speichern
mitten in der Auflage, laden, N Schritte» gegen ununterbrochenen Lauf. (4) T02: Laufzeit `trial-run.test.ts` messen, Timeouts aus dem Messwert. (5) T02: AK-11 (a) Zusicherung
behalten, `startTrial` nach Abbruch wieder `ok`. (6) T01: `isValidTrial` fordert bei `active !== null` `e0 > 0`. (7) T05: v17-Spielstand im Browser laden. Plan-Entscheide P-1 bis P-8
bestätigt. Budget: **18 Arbeiter-Starts** (17 laut Antrag + 1 für Auflage 2), 3 Controller-Instanzen, Parallelität 2 nur bei freiem Deckel 6 und Last < 8 (R708 V2).
Worktree `.worktrees/i132`, Branch `feat/i132` ab main mit Merge von `plan/i132`.

Regelbezug: gates.md Gate Plan, R553, R674, R698, R708, R745 · Kosten bei Irrtum: eine Obergrenze, die nach dem Playtest verschoben wird.

Entscheider: L0 · Anlass: Gate-Urteile lead-qa und lead-production gate-i132 · ADR: —

## R760 · 2026-10-17 · ORT-A C6 abgenommen (FIX-TEX, Smoke grün); T09 wartet auf ein Ruhefenster des Studios

Ruling: `feat/ort-a` @ `67cd0498` (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C6.md`) → abgenommen: `TEX` in `src/render/isoBase.ts`, Zyklus aufgelöst, `importZyklus.test.ts`
(3 von 4 rot vor dem Fix), Review OK, `npx vitest run` 4318 grün, Browser-Smoke Seed 7 ohne Konsolenmeldung. T09 nicht gelaufen (Last 6,2–9,5 nach einer Pause, R750 V3 korrekt).
Die Last stammt zum Teil aus dem Studio selbst (I-132, Werkzeug-Bündel). **Messfenster-Regel für diese Session:** L0 startet **C7** (T09, bei OK T10) erst, wenn kein anderer
Agent Testläufe fährt (I-132 zwischen zwei Tasks oder pausiert, Bündel 16 gemergt) und `lastgate.mjs` frei meldet; C7 läuft die Messung am Stück. C7 nimmt die zwei Kleinbefunde
mit (Trivial-Fix-Regel): `massif.ts` importiert `ISO_H` aus `isoBase` (Bestandszyklus `massif` ↔ `iso` weg), Pfad in `importZyklus.test.ts` unabhängig vom Arbeitsverzeichnis.
Budget: 2 verbleibende Starts aus R758.

Regelbezug: R329, R750 V3, R758 · Kosten bei Irrtum: T09 verschiebt sich in die Folgesession.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C6 · ADR: —

## R761 · 2026-10-17 · Gate Merge TOOL-BUENDEL-16: OK, Merge lokal

Ruling: `tool/buendel-16` @ `bbc94841` (Handoff `.studio/handoffs/2026-10-17-lead-tech-TOOL-BUENDEL-16.md`; Paket-Review opus BEDENKEN → Fix `bbc94841`, frischer Delta-Review opus OK;
`make studio-test` 1008 grün, `studio-lint` Exit 0) → **Gate Merge OK**, `production-integrator` merged lokal in `.worktrees/integrate`, kein Push. Inhalt: R755 V1 (Ausnahme vom
«inaktiv»-Signal für studio-director/lead-qa bei lebenden Nachfahren oder Bash-Heartbeat ≤ 1800 s), R757 (`LOAD_CAP` 6,0 < `LOAD_MAX`, per Test gekoppelt), Rauschen
`test_aufraeumen`. Der Satz zur Ausnahme in `docs/studio/verbesserung.md` (Abschnitt inaktiv) trägt der studio-coach in der Session-Ende-Retro nach. Bis zum Merge-Bericht
committet L0 nicht auf main (Lernpunkt aus R757-Merge).

Regelbezug: R755, R757, E-068, R673 · Kosten bei Irrtum: ein hängender Bash-Aufruf bleibt bis zu 30 min ohne Inaktiv-Signal.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-16 · ADR: —

## R762 · 2026-10-17 · TOOL-BUENDEL-16 gemergt; freie Plätze → Brainstorming «Stadtplanung» ohne Testläufe

Ruling: Merge `7c7e3188` (TOOL-BUENDEL-16, `make studio-test` 1008 grün, R761) bestätigt. Freie Plätze im Deckel 6 (R475, R698): **design-stadtplanung** an `lead-design` (opus,
Design-Lead; Budget 2 Starts, Parallelität 1): Designvorschlag mit 2–3 Varianten aus I-128, I-061, I-051, I-045 (Baustein laut R529/R737), Branch `design/stadtplanung`;
**keine Test- oder Sim-Messläufe**, damit das Ruhefenster für ORT-A T09 (R760) erreichbar bleibt. I-131 bleibt geparkt: I-112 ist live, die zweite Bedingung (Edikt-Überarbeitung mit
I-064) fehlt noch.

Regelbezug: R475, R529, R698, R737, R760 · Kosten bei Irrtum: ein Designvorschlag, der vor dem nächsten Meilenstein-Brainstorming veraltet.

Entscheider: L0 · Anlass: Merge-Bericht production-integrator, freie Kapazität · ADR: —

## R763 · 2026-10-17 · Gate Brainstorming «Stadtplanung»: Variante B «Wohnen und Werkstatt» als Meilenstein-Kandidat; D1–D8 angenommen

Ruling: `design/stadtplanung` @ `c8396fa6` (Handoff `.studio/handoffs/2026-10-17-lead-design-design-stadtplanung.md`) → **angenommen mit BEDENKEN der Selbstprüfung** (offene
Messungen M1, M2, M4). Kernbefund bestätigt: Nähe bringt heute nichts; Lärm allein ergibt eine Pflicht, keine Wahl. **D1** Variante B (Lärm senkt Belegung im Radius 3, vier
Werkstätten nur im Versorgungsradius, Park als Lärmschutz, Ebene aus I-045; 5 Pakete, ein Release); C erst nach Playtest von B. **D2** Strafe Belegung 75 % statt +15 s. **D3** alle vier
Werkstätten inkl. Weberei. **D4** Lärm nur bei stehendem, angebundenem, nicht stillgelegtem, nicht brennendem Betrieb. **D5** Park ohne Weg, brennt nicht, Radius 2, ab U2. **D6**
Balancing-Änderung erwartet, Ruling beim Gate Spec auf Basis M5. **D7** M1/M2 jetzt (lesend, ohne Sim-Lauf), dann Spec; M3–M5 erst nach ORT-A T09. **D8** Ideen-Status pflegt
lead-production beim Merge des Vorschlags. Kein Nutzer-Vorbehalt (§5.3: keine Kernsäule berührt). Fortsetzung: dieselbe lead-design-Instanz mit den 2 freien Starts
(design-economy-designer für M1/M2 auf Papier, design-spec-author für den Spec-Entwurf mit Platzhaltern für M3–M5).

Regelbezug: R529, R722, R737, R762, VERFASSUNG §5.3 · Kosten bei Irrtum: eine Spec, die nach M4 (Park als Reflexbau) nachgeschärft wird.

Entscheider: L0 · Anlass: Bericht lead-design design-stadtplanung · ADR: —

## R764 · 2026-10-17 · I-132 C1 abgenommen (T00–T03); C2 (T04) startet nach ORT-A T09

Ruling: `feat/i132` @ `cabbd8c8` (Handoff `.studio/handoffs/2026-10-17-lead-tech-I-132-C1.md`) → abgenommen: Auflagen R759 eingearbeitet (`075cba4d`); T01–T03 Review OK; Save v18 mit
Migration und Abweise-Test, Balancing grün. Auflage 2 erfüllt: ohne Zufuhr scheitert die Prüfung auf Seed 3 und Seed 1 gleich (Tick 400, Minimum 51 von `e0` 75); `trial-run.test.ts`
1,3 s. Abweichungen (zweiter Seed 1 statt 5, AK-11 mit 100 Kaufleuten, `recomputeConnectivity` vor dem Speichern-Test) als vertretbar übernommen. Fehlender Rundungstest
`perMin → 0` geht in T04. **C2 (T04, tech-ui-engineer) startet erst, wenn ORT-A C7 die Messung T09 abgeschlossen oder abgegeben hat** (R760: kein Testlauf neben der Messung; T00
trieb die Last auf 17). Budget: 6 von 18 Starts, Instanz 1 von 3. `SAVE_VERSION` 18 vor dem Merge gegen main + 1 prüfen (R674).

Regelbezug: R674, R759, R760, R750 V3 · Kosten bei Irrtum: I-132 verliert eine Stunde Wanduhr.

Entscheider: L0 · Anlass: Bericht lead-tech I-132 C1 · ADR: —

## R765 · 2026-10-17 · Gate Spec «Stadtplanung» (Variante B): OK mit Auflagen; Spec-Nachtrag ohne neues Gate; D6 erst nach M5

Ruling: `design/stadtplanung` @ `1f1b2c89` (Urteile lead-tech und lead-qa: je BEDENKEN, kein ZURÜCK) → **Gate Spec OK mit Auflagen**, Nachtrag durch `lead-design` (sonnet, Spec-Nachtrag)
ohne neues Gate, Prüfung der Auflagen im Gate Plan. **Technik:** A1 Save = `SAVE_VERSION` auf main + 1 beim Merge (R674; heute 19, falls I-132 vorher landet), Migration und AK-S1
parametrisiert («Vorversion = SAVE_VERSION − 1»); A2 alle Lesestellen der Belegungsgrenze in §4 (`unlocks.ts:61`, `population.ts:141`, `flow.ts:68`), Lärmquellen einmal je Schritt
sammeln; A3 neuer AK: Ladehinweis «n Werkstätten ausserhalb der Versorgung» (reiner Lesehelfer), Weiterlärmen stillstehender Werkstätten als bewusst benennen; A4 Park-Kategorie,
Ebenen-Taste, Cache bleiben Plan-Entscheide; Reihenfolge «stilllegen → ruhig» im selben Schritt als Plan-Prüfpunkt. **QA:** Messwert für AK-B5, Feldliste für AK-P3; AK-L9 als
`placeBuilding`-Test kennzeichnen; Playtest-Schritt «neues Spiel bis Minute 15: Steinbruch, Belegung fällt, Park hilft»; wertabhängige AKs (Radien, Kosten) lesen aus den Defs oder
tragen «wertabhängig, Anpassung per Ruling»; AK für alte Stände mit Häusern im Lärm; Randfälle Rundreise mit `noSupply`, Steuer «niedrig» im Lärm, Park bei negativem Geld, Pause;
M3/M4 mit mindestens 3 Seeds und beiden Controllern; Rückfall für den 75-%-Faktor; SP-5 erst nach M3–M6. **AK-Eindeutigkeit (R136/R417):** alle AKs der Spec tragen das Präfix
`AK-STADT-` (z. B. `AK-STADT-L1`); der Befehl aus gates.md muss danach 0 Kollisionen liefern. **D6 wird nicht jetzt entschieden**, sondern nach M5 mit Tabelle alt/neu/Differenz und
Begründung bei > 10 % (Schutz AK-W7 bleibt). **D9/D10** (Controller-Layouts als Testcode) angenommen, Risiko «keine Reserve» benannt; parametrisiertes Layout mit klarer
Fehlermeldung als Plan-Option.

Regelbezug: gates.md Gate Spec, R136, R417, R553, R674, R763 · Kosten bei Irrtum: ein Spec-Nachtrag mehr vor dem Plan.

Entscheider: L0 · Anlass: Gate-Urteile lead-tech und lead-qa gate-stadtplanung · ADR: —

## R766 · 2026-10-17 · Spec-Nachtrag «Stadtplanung» abgenommen; Plan jetzt (lead-tech opus)

Ruling: `design/stadtplanung` @ `75965223` → Nachtrag R765 vollständig (55 AKs mit Präfix `AK-STADT-`, 0 Kollisionen, Spec 39,3 KB, Messaufträge M3–M6 in Anhang 03). Rückfallreihenfolge
für den Lärmfaktor (0,85, dann `noiseRadius` 2, dann Controller-Layout) übernommen. **plan-stadtplanung** an `lead-tech` (opus, Tech-Lead beim Plan; Budget 1 Start für eine
Plan-Prüfung): Plan nach E-010 ab main mit Merge von `design/stadtplanung`; Zeilenverweise der Belegungsgrenze gegen den Code prüfen; SP-5 erst nach M3–M6; keine Testläufe während
der ORT-A-Messung.

Regelbezug: R674, R765, E-010 · Kosten bei Irrtum: ein Plan, der nach M3–M6 nachgeschärft wird.

Entscheider: L0 · Anlass: Bericht lead-design Spec-Nachtrag · ADR: —

## R767 · 2026-10-17 · ORT-A E6: Grenze relativ gerissen, absolut unkritisch → keine dritte Perf-Runde; absolute Release-Grenze; T10 und Strang k1 starten; I-132 C2 startet

Ruling: T09 (`.studio/qa/ort-a/messung-ort1.md`, Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C7.md`): `patchMs` B/A 1,74–1,96 (Grenze 1,20), absolut 4,0–8,6 ms je Patch; Hitch
Σover25 = 0 in A und B; Render ±1 ms (Last). → **Option 3** statt T05b-Zusatzarbeit oder Saumreichweite: Die Spielerwirkung (kein Frame > 25 ms) ist erfüllt, eine dritte
Perf-Runde derselben Befundklasse widerspräche R735 V1/R739. Die relative Frühwarnung E6 (AK-17) wird für ORT-A ersetzt durch eine **absolute Release-Grenze in T23**:
`patchMs` ≤ 10 ms je Patch (Seeds 7, 14, Siedlung) und Σover25 = 0; reisst T23 sie, entscheidet L0 dann zwischen Zwei-Zonen-Ausbau und Saumreichweite. Spec-Abweichung AK-17
mit diesem Ruling; die Galerie-Werte gelten. Trivial-Fixes `23ce0ecc` gehen in den nächsten Task-Review. **ORT-A C8:** T10 (qa-playtester, Item-Zählung Siedlung), dann Strang k1
T11–T13 seriell; Budget **7 Starts** neu (ORT-A gesamt ≈ 39 von 57 laut Plan), Parallelität 1. **I-132 C2:** T04 jetzt (R764, Messung beendet), Parallelität 1 bis der Deckel frei ist.

Regelbezug: R705, R735 V1, R739, R746, R764 · Kosten bei Irrtum: ein Release, das in T23 an der absoluten Grenze scheitert und dann die verschobene Perf-Runde braucht.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C7 (D-ORT1-E6) · ADR: —

## R768 · 2026-10-17 · ORT-A C8 durch Fremdlast blockiert; C9 in der Folgesession; Session-Ende eingeleitet (Kontext L0 25 %)

Ruling: Bericht C8 (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C8.md`): `lastgate.mjs` Exit 1 über ≈ 25 min (Last 11,4 → 6,6, Fremdprozesse apfsd, Dropbox, WebKit), eine Wartepause
verbraucht, nichts umgesetzt, 0 von 7 Starts. `D-ORT1-E6` gelöst (R767). → **C9 startet in der Folgesession**, sobald `node tools/render-qa/lastgate.mjs` Exit 0 meldet; Budget-Rest
7 Starts verfällt mit der Session und wird neu erteilt. Frage an die Retro: Braucht T10 (Browser-Sichtprüfung) dieselbe Lastgrenze wie eine Messung? Kontext L0 erreicht 25 %
(STUDIO.md «Sessiongrösse») → **Session-Ende eingeleitet**: keine neuen Pakete; laufende I-132 C2 und plan-stadtplanung schliessen ab oder pausieren mit Handoff; danach push-check
ohne Push (R514 V3, Werkzeug-Merges `43afeb6f`, `7c7e3188`), Kurz-Retro, state.md.

Regelbezug: R68, R329, R514 V3, R750 V3, R767 · Kosten bei Irrtum: ORT-A verliert eine Session Wanduhr.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C8, Kontextgrenze · ADR: —
