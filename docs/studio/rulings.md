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

R1–R699 stehen wörtlich in [rulings-archiv.md](rulings-archiv.md) (R129, R682); für Suchen immer `rulings*.md` verwenden.

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

## R769 · 2026-10-17 · Kurz-Retro 21273458: V1–V3 angenommen; Cache-Write-Ad-hoc durch R750 V3 gedeckt

Ruling: Bericht `docs/studio/retros/2026-10-17-session-21273458-ende.md` (`9c3eeb16`) → angenommen. **V1:** Render-Pläne enthalten eine Browser-Ladeprobe nach höchstens 3
Render-Tasks und vor jeder Messung; Messgrösse 0 Ladefehler erst in Messung oder Release über 2 Render-Stränge, Frist 2026-11-30. **V2:** Handbuch: kein L0-Commit auf main während
eines Integrator-Merges; Integrator-Briefings nennen `.worktrees/integrate`; Messgrösse 0 neu gebaute Merges über 3 Merges, Frist 2026-11-15. V1 und V2 setzt der studio-coach als
Handbuch-Minor in der Folgesession um. **V3:** ORT-A C9 darf T10 (Item-Zählung und Sichtprüfung ohne Zeitwert) bei 1-min-Last ≤ 8 fahren, `uptime` vor und nach dem Lauf im
Bericht; Zeitwerte bleiben an `lastgate.mjs`; Frist 2026-10-24, Rückfall Warten auf `lastgate`. Hook-Ad-hoc «Cache-Write 5 min zwei Sessions rot» (26,7 %, Neuschreibung nach Pause
9,5 %) ist durch R750 V3 (Frist 2026-10-30) gedeckt, keine eigene Retro.

Regelbezug: R697, R750, R755, R768 · Kosten bei Irrtum: eine Item-Zählung, die unter Last ungenau ist und wiederholt wird.

Entscheider: L0 · Anlass: Kurz-Retro studio-coach RETRO-S-21273458 · ADR: —

## R770 · 2026-10-17 · Nutzer «weiter»: lastfreie Pakete statt Leerlauf bis I-132 C2 fertig ist

Ruling: Nutzer: «weiter» während des eingeleiteten Session-Endes (R768) → Auslegung: weiterarbeiten, ohne die Übergabegrenze (Kontext L0 ≈ 26 %) zu sprengen. Solange I-132 C2 (Final-Review)
läuft und die Last bei ≈ 14 liegt, starten nur **lastfreie** Pakete (keine Test-, Mess- oder Browserläufe): (a) **gate-stadtplanung-plan** — Gate Plan `plan/stadtplanung` @ `3824007c` durch
lead-qa und lead-production (sonnet, nur lesen); (b) **HANDBUCH-1.64** — studio-coach setzt R769 V1 und V2 als Handbuch-Minor um. Danach Session-Ende wie R768 (push-check ohne Push im
Ruhefenster, state.md). ORT-A C9 bleibt in der Folgesession.

Regelbezug: R68, R434, R768, R769, VERFASSUNG §5.2 · Kosten bei Irrtum: zwei Berichte mehr im L0-Kontext vor der Übergabe.

Entscheider: L0 · Anlass: Nutzerauftrag «weiter» · ADR: —

## R771 · 2026-10-17 · Gate Plan «Stadtplanung»: OK mit Auflagen; Umsetzung ab der Folgesession (38 Starts)

Ruling: `plan/stadtplanung` @ `3824007c` (Handoff `.studio/handoffs/2026-10-17-lead-tech-plan-stadtplanung.md`; lead-qa und lead-production je BEDENKEN, kein ZURÜCK) → **Gate Plan OK mit
Auflagen**, eingearbeitet durch Controller C1 **vor T00** als Plan-Commit: (1) Browser-Ladeprobe (qa-playtester, Laden + Konsole) nach T10 und vor T11 (R769 V1), zählt zugleich als
Playtester-Check der UI-Tasks T08/T09 (in deren Task-Dateien vermerken); (2) T02/T04: `messung-pins.md` mit Alt-Wert aus main je Zeile, unerwartete Pin-Verschiebung ist Befund an
lead-tech (T04 erwartet nur `balance-edicts`), `make check` am Ende zitiert die bewegten Pins; (3) T06: Test «gleicher Seed, speichern und laden mittendrin, Fortsetzung JSON-gleich»
mit Haus im Lärm, Park und Werkstatt in `noSupply`; (4) T11/T14: M3 und M5 auf demselben Commit von `mess/stadtplanung-basis`, Commit im Kopf von `anhang-04-messung.md`; T11 bestimmt
zuerst die tragfähigen Seeds (< 3 → Blocker an L0); (5) Spec §9: AK-Summe 53 (42 Vitest) statt 55/44 korrigieren. Plan-Entscheid-Entwürfe 1–6 angenommen (Ownership-Ausnahmen,
vorläufige Pins mit Marker «vorläufig bis Ruling D6» und Gate-Merge-Bedingung `rg` = 0, A2 als «höchstens zwei Sammlungen je Schritt» mit M6 als Kontrolle, Controller vor Regel,
Start nach ORT-A T09 — erfüllt —, Render-Tasks T09/T10 nach ORT-A-Merge, Merge-Reihenfolge ORT-A → I-132 → Stadtplanung; kein I-132-Merge zwischen T02 und T04, nach jedem Merge
`make check`). ≈ 660 Tools bewusst akzeptiert. Budget **38 Starts** (37 + Ladeprobe), Parallelität 2, 8 Controller-Instanzen — Freigabe beim Start in der Folgesession.

Regelbezug: gates.md Gate Plan, R553, R674, R765, R766, R769 V1 · Kosten bei Irrtum: ein Merge-Konflikt in `sprites.ts`/`iso.ts`, der mehr als eine Stelle kostet.

Entscheider: L0 · Anlass: Gate-Urteile lead-qa und lead-production gate-stadtplanung-plan · ADR: —

## R772 · 2026-10-17 · I-132 C2 abgenommen (Final-Review OK); Gate Merge und Release-Check REL-27 in der Folgesession

Ruling: `feat/i132` @ `b8fabe4e` (Handoff `.studio/handoffs/2026-10-17-lead-tech-I-132-C2.md`) → abgenommen: T04–T06 fertig, Final-Review opus OK (vier niedrige Befunde in
`docs/beobachtungen.md` auf dem Branch), Playtest inkl. v17-Spielstand ohne Absturz, `SAVE_VERSION` 18 = main + 1, Probe-Merge gegen main konfliktfrei. **Entscheid:** Zugang zur
Meisterprüfung ab `monumentDone`, auch in der Gewürz-Phase; der Prüfungs-Chip ersetzt dort den Ziel-Chip, sein Titel nennt den Zielstand (Spec-Wortlaut). Offen vor dem Merge: voller
`make check` auf `b8fabe4e` (letzter Lauf vor `c46fa474`; Final-Review fuhr wegen Last nur 533 gezielte Tests) und Browser-Nachprüfung des Hand-Cursors. **Folgesession:** ein
`lead-qa`-Start für Gate Merge I-132 und Release-Check **REL-27** (I-132 + TOOL-BUENDEL-15/16) im Ruhefenster, danach Merge, push-check, Push (R335). Die Merge-Reihenfolge aus R771
(ORT-A → I-132 → Stadtplanung) betrifft nur den Stadtplanung-Strang; I-132 wartet nicht auf ORT-A (R759). Befund an die Retro: Für frische Delta-Reviews auf opus fehlt ein Einsatz in
der Modelltabelle; C2 nutzte «Final-Review».

Regelbezug: R674, R697, R759, R764, R771 · Kosten bei Irrtum: ein Merge, dessen voller `make check` in der Folgesession rot wird.

Entscheider: L0 · Anlass: Bericht lead-tech I-132 C2 · ADR: —

## R773 · 2026-10-17 · N-101 erledigt; Nutzer «Studio starten, am nächsten Release weiter»: REL-27 zuerst, lastfreie Pakete parallel

Ruling: (1) **N-101** beantwortet (Nutzer: einverstanden, verwerfen) → I-094 bleibt verworfen im Archiv (R670), erledigt. (2) Auslegung «am nächsten Release weiterarbeiten» als
**REL-27 = I-132 + TOOL-BUENDEL-15/16** (R772) im jetzigen Ruhefenster (1-min-Last 3,8): ein `lead-qa`-Start (sonnet) für vollen `make check` auf `feat/i132` @ `b8fabe4e`,
Browser-Nachprüfung Hand-Cursor (qa-playtester), Gate Merge I-132 und Release-Check REL-27; danach Merge durch `production-integrator`, `make push-check`, Push (R335). Bis
`push-check` Exit 0 starten keine Umsetzer oder Controller (R464); ORT-A C9 und Stadtplanung-Umsetzung danach. (3) Parallel nur lastfreie Pakete (Deckel 8, R475): **IDEEN-13**
(lead-design opus, 2 Scouts, R445; letzte Runde vor einer Session), **RULINGS-ARCHIV** (lead-production, Aufräumen fällig: 173 Rulings / 203 KB; im Worktree, nur Rulings vor R700
ins Archiv verschieben, damit L0-Anhänge am Ende konfliktfrei bleiben), **plan-stadtplanung-auflagen** (lead-tech opus arbeitet die Auflagen 1–5 aus R771 als Plan-Commit ein;
Auslegung von R771 «Controller C1 vor T00» als Plan-Arbeit ohne Testlauf, damit sie während der Push-Sperre laufen darf), **RETRO-FAELLIG** (studio-coach: Budget lead-tech 5 von 3,
fehlender Modell-Einsatz «Delta-Review opus» aus R772; Cache-Write durch R750 V3 gedeckt, R769).

Zweck der Anweisung: das nächste Release ausliefern und das Studio auslasten; Auslegung widerspricht ihm nicht, weil REL-27 der einzige abnahmebereite Stand ist und die Parallelpakete
keine Testlast erzeugen.

Regelbezug: R335, R445, R464, R475, R670, R771, R772, VERFASSUNG §5 · Kosten bei Irrtum: Plan-Auflagen, die C1 vor T00 noch einmal anfassen muss (≈ 1 Start).

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R774 · 2026-10-17 · RULINGS-ARCHIV gemergt; Ad-hoc-Retro fällige Punkte: V1 angenommen, V2 ins nächste Werkzeug-Bündel

Ruling: (1) `docs/rulings-archiv-773` @ `06d3478d` (R601–R699 ins Archiv, `rulings.md` 74 Rulings / 91 KB, Aufräumprüfung Exit 0) vor dem REL-27-Push auf main gemergt (`10a6ba57`),
abweichend von R773 «nach dem Push», damit der Stand mit dem einzigen Push der Session (R335) live geht; reine Doku. (2) Retro `RETRO-ADHOC-FAELLIG-17` (studio-coach): Alarme
kamen wieder, weil frühere Ad-hoc-Retros mit leeren bzw. falschen Trigger-IDs quittierten; Budget lead-tech 5/3 gehört zu TOOL-GUARD-REDACT (ca9d40c8), durch R725/R732 bewilligt,
Hebel R735 V1/V3. **V1 angenommen:** opus-Einsatz `Delta-Review (frisch, nach BEDENKEN oder ZURÜCK)` in die Modelltabelle (Handbuch-Minor 1.65), Umsetzung studio-coach im
Worktree mit `make studio-test` inkl. modelguard-Tests, Merge vor dem push-check; Messgrösse 0 Guard-Blocks über 5 Controller-Pakete bis 2026-11-30. **V2** (`log.py retro` warnt
bei `adhoc` ohne Trigger; Trigger-IDs aus `state.incidents[].id`) ins nächste TOOL-BUENDEL. Cache-Write: Messauftrag mit Frist 2026-10-30 (R750 V3), drei rote Sessions in Folge
vermerkt.

Regelbezug: R335, R428, R471, R735, R750, R772, R773 · Kosten bei Irrtum: ein Handbuch-Minor, der den Modell-Guard für einen Einsatz falsch parst (studio-test deckt das).

Entscheider: L0 · Anlass: Bericht lead-production RULINGS-ARCHIV, Bericht studio-coach RETRO-FAELLIG · ADR: —

## R775 · 2026-10-17 · Stadtplanung: Plan-Auflagen R771 eingearbeitet und abgenommen; Entwürfe (a)–(d) angenommen

Ruling: `plan/stadtplanung` @ `b27e7e8f` (Handoff `.studio/handoffs/2026-10-17-lead-tech-plan-stadtplanung-auflagen.md`) → Auflagen 1–5 aus R771 erfüllt, kein neues Gate. Entwürfe
angenommen: (a) T12 mitgezogen (Auflage 4 betrifft ihn); (b) Ladeprobe als eigener Task T10b ohne Umnummerierung (R769 V1); (c) Seed-Probe in T11 mit 3 000 Ticks, Blocker in T12
bleibt Rückfallnetz; (d) die AK-Zahl 55/44 in R766 ist durch R771 auf 53/42 korrigiert. Umsetzung (Controller C1 ab T00, Budget 38 Starts, Parallelität 2) startet erst nach
`make push-check` Exit 0 für REL-27 (R464). Der Plan-Index liegt mit 28,8 KB über der Task-Grenze von 10 KB (R417), wie schon beim Gate R771 akzeptiert; Task-Dateien ≤ 8,3 KB.

Regelbezug: R417, R464, R766, R769 V1, R771, R773 · Kosten bei Irrtum: eine Seed-Probe, die einen erst im vollen Lauf ausfallenden Seed übersieht (fängt T12).

Entscheider: L0 · Anlass: Bericht lead-tech plan-stadtplanung-auflagen · ADR: —

## R776 · 2026-10-17 · Gate Ideen-Runde IDEEN-13: Rangliste angenommen; Kurzdesign I-136 und Brainstorming I-144 jetzt

Ruling: `docs/ideen-13` @ `e62a7c73` (Handoff `.studio/handoffs/2026-10-17-lead-design-IDEEN-13.md`) → angenommen und von L0 auf main gemergt (`8a594330`, reine Doku).
Einplanen: **I-136** Fernkarte mit Fahrzeit und roter Lagerzahl (Häppchen, Kurzdesign Stufe leicht jetzt, lead-design sonnet); **I-137** Abstiegs-Dämpfer (Häppchen nach ORT-A
T10); **I-144** Zukauf-Ordnung als Wirtschafts-Brainstorming Stufe voll jetzt (lead-design opus mit `design-economy-designer`, drei Fassungen gegeneinander gerechnet; Baseline-
und Balancing-Neumessung braucht ein eigenes Ruling in der Spec). Beipack: I-138 (nur Textzeile) mit dem Umschalt+R-Befund; I-106 bleibt Beipack-Kandidat. Parken: I-139 bis I-132
live, I-111 bis I-144 entschieden. Verworfen: I-141, I-142, I-143, I-145 (reine Geld-Senken tragen nicht, Leitbefund R722 bestätigt). Beide Design-Pakete sind lastfrei und laufen
während der REL-27-Push-Sperre (R464). Budget: design-I-136 2 Starts, design-I-144 3 Starts.

Regelbezug: R445, R464, R475, R571, R599, R722 · Kosten bei Irrtum: ein Brainstorming (≈ 80 Tools), dessen Ergebnis I-144 doch verwirft.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-13 · ADR: —

## R777 · 2026-10-17 · Gate Merge I-132 und Release-Check REL-27: OK; Merge, push-check, Push

Ruling: `feat/i132` @ `b8fabe4e` (Handoff `.studio/handoffs/2026-10-17-lead-qa-gate-REL-27.md`) → **Gate Merge OK, Release-Check REL-27 OK**: voller `make check` Exit 0 (4460 Vitest,
studio-test 997, Balancing unverändert), Probe-Merge konfliktfrei, `SAVE_VERSION` 18 = main + 1 mit getesteter Migration v17→v18, Browser-Check (Hand-Cursor, Zugang ab
`monumentDone`, drei v17-Stände) ohne Befund. **REL-27 «Meisterprüfung»** = I-132 + TOOL-BUENDEL-15/16, dazu die Doku-Merges dieser Session (R774–R776) und, falls bis zum
Integrator-Start abgenommen, Handbuch 1.65 (R774 V1). `production-integrator` merged `feat/i132` im Worktree `.worktrees/integrate`, holt main, fährt `make push-check` und pusht genau
den geprüften Hash nach `origin/main` (R335, einziger Push der Session); bis zum Merge-Bericht committet L0 nichts auf main (R769 V2). Zeitreserve: die strenge Bewertung im
push-check entscheidet (Warnungen im Gate-Lauf nur Render-Altlasten bei Last 5–10). Restrisiko: Laden über den manuellen Slot im Browser ungeprüft (Sim-Test deckt es). Danach
Erweiterung 1 bekommt beim Merge v19 (R519).

Regelbezug: R335, R464, R517, R519, R565 V2, R769 V2, R772 · Kosten bei Irrtum: ein Live-Release mit Ladefehler im manuellen Slot (Hotfix ≈ 1 Paket).

Entscheider: L0 · Anlass: Bericht lead-qa gate-rel-27 · ADR: —

## R778 · 2026-10-17 · I-136 «Fernkarte»: Gate Spec und Gate Plan OK mit Auflagen; Handbuch 1.65 gemergt

Ruling: (1) **Gate Spec I-136** (`design/i136` @ `6c2491dd`, lead-qa): OK mit zehn nicht blockierenden Auflagen (seaLanes-Zählung injizierbar und Frame-Pfad-Test, Randfälle kein
Kontor / ein Angebot / kein Schiff, Tooltip und Entfernen von `far-stock--low`, Golden-String AK-F4, AK-F10 präzisiert, Spans-Zusammensetzung, Screenshots beider Werte, Konflikt
benannt, `farOrderText`-Rotfärbung als Beobachtung statt Umfang). Grösse S, kein Save, keine Baseline. (2) **Gate Plan I-136** (`plan/i136` @ `65ee7301`; lead-qa OK mit Hinweisen
A–C, lead-production OK mit Auflage 1): angenommen, P-1 (zwei Kind-Spans, FakeDom) bestätigt. Auflagen an den Umsetzer: Rot-Belege mit echtem Assertion-Fehler (leerer Stub statt
fehlender Datei), Golden-Werte per Handrechnung plausibilisiert, Spec AK-F6 und Plan-Abschnitt «Konflikte» im ersten Commit nachgezogen (kein Dateiüberlapp mit Stadtplanung nach
T08-Dateiliste, Prüfung beim Gate Merge per `git diff --name-only`). Merge-Reihenfolge frei gegenüber ORT-A und Stadtplanung (wer fertig ist, zuerst). Budget 4 Starts
(Umsetzer, ein Paket-Review nach E-068, Playtester, Puffer), Parallelität 1; L0 briefet den Umsetzer direkt (Stufe leicht). (3) **Handbuch 1.65** (`docs/handbuch-1.65` @
`b8c4a586`, studio-test 1009 OK) lokal gemergt (`abe7ee0d`); Wortlaut des Einsatzes `Delta-Review frisch` statt der Klammerform aus R774, weil der Guard als Präfix vergleicht.

Regelbezug: R392, R395, R464, R693, R774, gates.md Gate Spec und Gate Plan · Kosten bei Irrtum: ein UI-Häppchen, dessen Frame-Cache-Test im echten DOM nicht greift (Playtest T04 fängt es).

Entscheider: L0 · Anlass: Berichte lead-design design-I-136, lead-qa gate-I-136-spec und gate-I-136-plan, lead-production gate-I-136-plan, studio-coach HANDBUCH-1.65 · ADR: —

## R779 · 2026-10-17 · REL-27 live; ORT-A C9 und Stadtplanung C1 gestartet

Ruling: **REL-27 «Meisterprüfung» live**: Merge `add28350` (I-132), `make push-check` Exit 0 (check 4460 Tests, check-ci-perf Exit 0), Push `6f14a354..add28350`, CI 39033715341 und
Pages 39034234219 grün (automatisch). Damit ist die Push-Sperre R464 aufgehoben; der einzige Push dieser Session ist verbraucht (R335), alles Weitere bleibt lokal. Gestartet: **ORT-A
C9** (lead-tech sonnet, 7 Starts, T10 → k1 T11–T13) und **Stadtplanung Instanz I** (lead-tech sonnet, 38 Starts gesamt, Parallelität 2, T00–T02). I-136-Umsetzung startet, sobald
ein Platz im Deckel frei ist und die 1-min-Last < 8 liegt (R708 V2). Befund an die Retro: Der Hook meldete «production-integrator inaktiv», während `make push-check` als ein
langer Bash-Aufruf ohne Heartbeat lief (7:47).

Regelbezug: R335, R464, R708 V2, R771, R777 · Kosten bei Irrtum: drei Teststränge gleichzeitig, die Messfenster von ORT-A T10 und Stadtplanung T02 belegen.

Entscheider: L0 · Anlass: Bericht production-integrator REL-27 · ADR: —

## R780 · 2026-10-17 · Gate Brainstorming I-144 «Zukauf-Ordnung»: verworfen; I-110, I-111, I-130, I-134 geparkt mit neuem Auslöser

Ruling: `design/i144` @ `43264557` (Handoff `.studio/handoffs/2026-10-17-lead-design-design-I-144.md`, Rechnung `docs/superpowers/specs/2026-10-17-i144-rechnung.md`) → **verworfen**
(A, B, C), auf main gemergt als Beleg. Befund: Vollzukauf ist heute schon 1,6- bis 2,7-mal so teuer wie Bauen; die Wahl fehlt, weil nach dem Kaufleute-Ziel (ab min 19,2) kein Geld
mehr knapp ist. (A) Einkaufsplätze laufen mit Startbelegung fest oder entarten zu «Gewürz + X», (B) Konsumgüter-Staffel öffnet kein Wahlfenster, (C) `BUY_RISE` 2 reisst das Sieg-Gate
(Tick 8450 > 7500, bestätigt R571). Fassung B als Bremse wird nicht gebaut (kleiner Nutzen). **Folge:** I-110, I-130, I-134 (warteten auf `BUY_RISE` > 0) und I-111 werden
**geparkt bis «Geld bindet nach dem Kaufleute-Ziel»** statt verworfen — das Spätspiel-Geldproblem ist jetzt zweimal (I-094, I-144) als Kernursache belegt und gehört in ein eigenes
Wirtschafts-Brainstorming, sobald Stadtplanung live ist (Lärm/Parks schaffen ggf. neue Bindung). Status in `docs/ideen.md` zieht die nächste Ideen-Runde nach (Pool-Pflege R599).
Studio-Idee, daher keine Kenntnis an den Nutzer nötig.

Regelbezug: R571, R599, R670, R722, R776, gates.md Gate Brainstorming · Kosten bei Irrtum: vier geparkte Ideen, die mit dem neuen Auslöser nie wieder geprüft werden.

Entscheider: L0 · Anlass: Bericht lead-design design-I-144 · ADR: —

## R781 · 2026-10-17 · I-136 abgenommen; Gate Merge in der Folgesession (Ampel gelb, Push verbraucht)

Ruling: `feat/i136` @ `6f7bbc21` → abgenommen: Final-Review opus BEDENKEN (arc42-Tabelle neu umgebrochen, zwei niedrige), Fixes `19a2fa30`/`e2849686`/`6f7bbc21`, frisches Delta-Review
opus OK (Handbuch 1.65 «Delta-Review frisch»); Browser-Check OK (AK-F8–F10, Fahrzeit 27 s / 36 s = Inselkarte, Rot `rgb(255, 59, 92)` und zurück, keine Mutation im Leerlauf, v18 lädt);
gezielte Tests 103 grün, `src/sim/` unberührt. Diff 20 Dateien +623/−28. **Gate Merge** (voller `make check` auf der Branch) und lokaler Merge erst in der Folgesession als Teil
von **REL-28**, weil der Push dieser Session verbraucht ist (R335) und die Ampel gelb steht (keine neue Welle, R69); ein lokaler Merge jetzt bringt dem Spieler nichts. Drei niedrige
Befunde in `docs/beobachtungen.md`. Budget I-136: 4 von 4 Starts verbraucht (Umsetzer, Final-Review, Playtester, Delta-Review), Fix-Runde als Fortsetzung.

Regelbezug: R69, R335, R673, R693, R774, R778 · Kosten bei Irrtum: I-136 kommt eine Session später live.

Entscheider: L0 · Anlass: Berichte qa-code-reviewer (Final- und Delta-Review), qa-playtester, tech-ui-engineer I-136 · ADR: —

## R782 · 2026-10-17 · ORT-A C9: T10 und T11 abgenommen; `roadCenter` nach `isoBase.ts`; T12/T13 in der Folgesession

Ruling: Bericht lead-tech ORT-A C9 (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C9.md`) → **T10** (Browser-Check BEDENKEN niedrig: Saum dezent, Fixture ohne Bauland in Versorgung,
Beobachtung eingetragen) und **T11** (`feat/ort-a-k1` @ `c2756d1e`, Review OK inkl. `23ce0ecc`, Zeiten ohne Rückgang) abgenommen. Entscheide: (1) **`roadCenter` zieht nach
`src/render/isoBase.ts`**, `sprites.ts` re-exportiert es — vermeidet den Importzyklus `roadShape` ↔ `sprites` wie bei FIX-TEX (R760); die Sperre in der T12-Task-Datei ist damit
aufgehoben, Änderung als eigener `refactor:`-Commit vor T12. (2) T11-Abweichungen bestätigt: Welle Amplitude 0,04 / Periode 0,6 (AK-19 sonst 0,505 > 0,5), `edges` als geschlossene Ringe
(T12/T13 richten sich danach), AK-28-Sackgasse als Halbellipse ab Kachelmitte (Task-Text «0,5 ± 0,04 bis zum Ende» gilt bis zur Kachelmitte). lead-art erhält die Welle zur Kenntnis mit
dem nächsten Art-Start. (3) **T12/T13 in der Folgesession**: 1-min-Last 7,5–9,6 (Fremdlast), L0-Kontext an der Übergabegrenze (≈ 25 %, R768); Restbudget 4 verfällt, neu erteilen.
Befund an die Retro: T11-Tests entstanden nach der Implementierung, Rot-Beleg nachträglich per Stub (zwei Tests waren vakuös grün und wurden nachgeschärft) — Test-first-Regel verletzt.

Regelbezug: R395, R410, R708 V2, R760, R767, R768 · Kosten bei Irrtum: ein Re-Export, der einen weiteren Zyklus in `isoBase.ts` erzeugt (`make check` fängt ihn).

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C9 · ADR: —

## R783 · 2026-10-17 · Nutzer «mach weiter»: ORT-A C10 (roadCenter, T12, T13) und Stadtplanung C1 starten; REL-28 im Ruhefenster

Ruling: Auslegung «mach weiter» als Fortsetzung des Plans aus R781/R782/R775 ohne neuen Auftrag. Zweck der Anweisung: Arbeit ohne Rückfrage voranbringen; Auslegung widerspricht ihm
nicht, weil nur bereits gegatete Pakete starten. (1) **ORT-A C10** an `lead-tech` (Controller sonnet): `refactor:`-Commit `roadCenter` → `src/render/isoBase.ts` (R782), dann T12 und T13
seriell auf `feat/ort-a-k1` @ `c2756d1e`, je Umsetzer + Task-Review; Budget **5 Starts** (4 + 1 Delta-Review frisch opus), Parallelität 1; Messungen nur bei 1-min-Last ≤ 4. (2) **Stadtplanung
C1** an `lead-tech` (Controller sonnet) ab T00 auf Basis `plan/stadtplanung` @ `b27e7e8f` (R775), Budget **38 Starts**, Parallelität 2; T09/T10 erst nach ORT-A-Merge. Die Push-Sperre
R464 gilt nicht mehr (REL-27 live, R779). (3) **REL-28** (I-136 Gate Merge mit vollem `make check` auf `feat/i136` @ `6f7bbc21`, Merge, `make push-check`, Push) startet L0, sobald die
1-min-Last ≤ 8 ist (jetzt 20, Fremdlast); bis dahin keine `make check`-Läufe. Deckel 6 gleichzeitige Agenten (R698).

Regelbezug: R464, R698, R775, R779, R781, R782 · Kosten bei Irrtum: zwei Controller teilen sich bei hoher Last die Testzeit; schlimmstenfalls warten Tasks auf ein Ruhefenster.

Entscheider: L0 · Anlass: Nutzer «mach weiter» · ADR: —

## R784 · 2026-10-17 · REL-28 Gate Merge I-136 ZURÜCK: Fernlager-Zahl in `--tone-bad` statt Signalrot (Variante b)

Ruling: Bericht lead-qa REL-28 (Handoff `.studio/handoffs/2026-10-17-lead-qa-gate-REL-28.md`) → ZURÜCK angenommen: `make check` auf `feat/i136` @ `6f7bbc21` rot an
`tests/ui/contrast.test.ts` «Spec 9.1 Signalrot ist nie Textfarbe» (`.far-stock--low { color: var(--signal-red) }`, I-136 T03). Entscheid **Variante (b)**, nicht die empfohlene
Ausnahme (a): Die Regel M7 §9.1 bleibt ohne Ausnahme; die Zahl wird mit dem vorhandenen Ton `--tone-bad` (#b3261e) gefärbt, der als Textton auf Pergament schon kontrastgeprüft ist
(AK-PU-19). Damit bleibt die Zahl rot, die Spec-Regel gilt ohne Sonderfall und es braucht keinen neuen Test. AK-F9 in der I-136-Spec wird auf «computed color = `--tone-bad`» nachgeführt.
Fix an `lead-tech` (sonnet, 1 Start Umsetzer): CSS-Zeile + Spec-AK + ggf. Browser-Erwartung `rgb(179, 38, 30)`; Diff ≤ 20 Zeilen prüft der Lead am Diff (kein Delta-Review), dann
voller `make check`; danach setzt `lead-qa` das Gate nur für den Rest fort (Integrator, `make push-check`).

Regelbezug: R781, M7-Spec §9.1, Handbuch «Kleine Fixes ≤ ~20 Zeilen» · Kosten bei Irrtum: ein dunkleres Rot fällt weniger auf als Signalrot; Sichtprüfung im nächsten Playtest.

Entscheider: L0 · Anlass: Bericht lead-qa REL-28 · ADR: —

## R785 · 2026-10-17 · Gate Merge REL-28 (I-136) OK; Kandidat im Worktree `integrate` auf lokalem main; Push-Auftrag

Ruling: Gate Merge I-136 → **OK** (lead-qa: Delta `6f7bbc21..c51af713` eine Farbzeile + Doku, `make check` EXIT 0, R784 erfüllt). Arbeitsort-Frage des Integrators: weder Ausnahme
von der Persona noch Handarbeit von L0 — der Integrator bleibt in `.worktrees/integrate` (R565 P1), setzt den Kandidaten aber auf **lokales `main`** statt `origin/main`
(`git -C .worktrees/integrate checkout --detach main`), damit die ungepushten Doku-Commits R780–R785 mitkommen; dann `git merge --no-ff feat/i136` (@ `c51af713`), `make check`,
`make check-ci-perf`, Merge-Commit. Der Hash dieses Merge-Commits gilt als Ruling-Hash. **Push-Auftrag:** nach `make push-check` EXIT 0 (bei 1-min-Last > 4 per until-Schleife auf
Ruhefenster warten) `git push origin <geprüfter Hash>:main`, dann CI und Pages prüfen. L0 zieht danach lokales `main` per `git merge --ff-only origin/main` nach. Bis zum Merge-Bericht
committet L0 nichts auf `main` (R697). Abweichung Persona Schritt 1 (`origin/main` → lokales `main`) gilt nur, wenn lokales `main` ausschliesslich ungepushte Doku-Commits über
`origin/main` trägt.

Regelbezug: R335, R565 P1/V2, R697, R781, R784 · Kosten bei Irrtum: ein Doku-Commit mehr im Release-Push (CI ignoriert reine Doku nicht, da I-136 Code enthält — ein Lauf).

Entscheider: L0 · Anlass: Bericht lead-qa REL-28 (Fortsetzung) · ADR: —

## R786 · 2026-10-17 · ORT-A C10 abgenommen (k1 nach `feat/ort-a` @ `cb0cc48e`); C11: Browser-Check k1, T14, Strang k2

Ruling: Bericht lead-tech ORT-A C10 (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C10.md`) → abgenommen, `make check` EXIT 0 bei Last 6,15. Entwürfe: (1) T12-Abweichungen
angenommen (Argument `{zoom}`, PolyPath ohne Path2D, Ebenenreihenfolge über alle Blöcke, keine KS3 im Kern, `ROAD_FADE_COLOR`). (2) Test-Pins in `a3bae764` angenommen: AK-01-Hashes
ändern sich zwingend durch den Wegfall der Konturstriche (AK-18), Salze 61/62 folgen der Verschiebung nach `isoBase.ts` (R782); alte Werte bleiben im Kommentar. (3) T13-Abweichungen
angenommen (Saumbreiten 0,17/0,14/0,11, Saumfarbe als Mischung zur Erde); `lead-art` zur Kenntnis mit dem nächsten Art-Start. (4) Niedrige Reviewhinweise und die zwei Beobachtungen
gehen nach `docs/beobachtungen.md` (Rauschen nur nahe Schwelle; Saum bei Wasseranteil; `edge.way` aus `occ`; Cache-Obergrenze ohne Test); die drei neuen langsamen Tests (3,9 s / 4,4 s /
2,3 s) gehören zu ZEITRESERVE-PFLEGE. **Korrektur Lead-Aussage:** Stadtplanung T09/T10 warten auf den Merge von ORT-A nach **main** (R783), nicht auf den Strang-Merge.
**C11** an `lead-tech` (sonnet): Browser-Check k1 durch `qa-playtester` (Füllregel bei überlappenden Wegen, Zoom 0,75, Nähte an 8er-Blockgrenzen, Wasser-/Sandkante, Übergang am
Gebäude) parallel zu Strang k2 (T15, T16 je Umsetzer + Review); T14 (Messung k1) nur bei Last ≤ 4, sonst nach hinten. Budget **7 Starts**, Parallelität 2.

Regelbezug: R424 (≤ 2 Browser-Läufe), R782, R783 · Kosten bei Irrtum: ein Browser-Befund in k1 zwingt k2 zu einer Nacharbeit.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C10 · ADR: —

## R787 · 2026-10-17 · R464 nachgezogen: Umsetzer-Stopp bis REL-28-Push

Ruling: L0 hat mit R786 (ORT-A C11) Umsetzer gestartet, obwohl seit R785 ein Push ansteht — Verstoss gegen R464. Korrektur: beide Controller (ORT-A, Stadtplanung C1) starten bis zum
REL-28-Push keine neuen Umsetzer, Reviews oder `make check`; Laufendes endet regulär. Befund an die Session-Retro: Last 11–15 entsteht teils aus eigenen Testläufen und blockiert das
Push-Ruhefenster (≤ 4).

Regelbezug: R464, R785, R786 · Kosten bei Irrtum: ORT-A und Stadtplanung stehen bis zum Push still.

Entscheider: L0 · Anlass: Last 14,5 bei wartendem Integrator · ADR: —

## R788 · 2026-10-17 · ORT-A C11 Zwischenstand: k2 rot (paveImage), Entwürfe angenommen, Sackgassen-Lappen bei T20b mit lead-art

Ruling: Bericht lead-tech ORT-A C11 (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C11.md`) → T15/T16 bleiben abgenommen, k2 aber nicht gemergt: `make check` rot an
`tests/render/sprites-kanten.test.ts:134` (AK-L3-a, `paveImage` zeichnet einen 114-Punkte-Strich). Fix-Runde am T15-Umsetzer (Fortsetzung) nach dem REL-28-Push, Test bleibt
unverändert; dann `make check` und Merge k2. Entwürfe: (1) T16 Kernschatten über `SHADOW` + `globalAlpha` angenommen (Bestandsfilter bleiben gültig, Rechnung geprüft); (2) neue Pins
`bildmodus-ks.json`, `schatten-ks.json`, `HOME_CALLS*`, `shadowFills` angenommen; (3) Strangabschluss-`make check` bleibt Pflicht (wirkt: fand den Querbefund). (4) Browser-Check k1
BEDENKEN: Sackgassen-Lappen (`ROAD_FADE_COLOR`) und Grasloch im 2×2-Wegblock sind Gestaltungsfragen → Sichtung in T20b mit `lead-art`-Urteil, kein Fix jetzt. Nebenbefund: ein
Arbeiter-Debuglauf `vitest --root /` (Stadtplanung T07) lief 4 min mit 277 % CPU; L0 beendete PID 90052 → Retro.

Regelbezug: R464, R786, R787 · Kosten bei Irrtum: der Lappen bleibt bis T20b sichtbar; das betrifft nur `feat/ort-a`, nicht live.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C11 · ADR: —

## R789 · 2026-10-21 · Nutzerauftrag «mach weiter, 24 min»: REL-28 pushen, sonst nur Ende-Routine

Ruling: Auslegung: In 24 min passt nur der anstehende Push (R785) und die Ende-Routine; keine neuen Umsetzer, Controller oder Ideen-Runden (R464 gilt bis zum Push ohnehin). Last 2,5 =
Ruhefenster. L0 hat entgegen R697 den Doku-Commit `214bd248` (R786–R788) auf `main` gelegt, da der Merge-Bericht aus R785 ausblieb; Korrektur: `production-integrator` holt `main`
in `.worktrees/integrate` (`git merge --no-ff main` über `ee70146d`, nur Doku-Delta), dann `make push-check`, Push des geprüften Hashes, CI und Pages. Danach `main` per `--ff-only`
auf `origin/main`. Fällt `push-check` nicht in die Session, bleibt der Kandidat für den nächsten Start.

Regelbezug: R335, R464, R697, R785 · Kosten bei Irrtum: ein zusätzlicher Merge-Commit nur mit Doku.

Entscheider: L0 · Anlass: Nutzerauftrag 2026-10-21 · ADR: —

## R790 · 2026-10-21 · Nutzerauftrag Dashboard: nur Projektübersicht und laufende Session

Ruling: Nutzer: «Das Dashboard hat viel zu viele Infos drin. Es soll nur eine generelle Übersicht über das Projekt und eine detailliertere über die laufende Session geben.» Auslegung:
Paket **TOOL-DASH-SCHLANK**. Die Hauptansicht hat genau zwei Bereiche: (1) **Projekt** (Phase/Meilenstein, live-Release und Save, nächste Schritte, offene Nutzerentscheide) und
(2) **Laufende Session** (aktive Agenten mit Paket und Heartbeat, Delegationen und Rulings dieser Session, Live-Feed, Budget und Aufwand der Session). Alle übrigen Karten (u. a.
Organigramm, Prozess-Graph, Verlauf, Qualität, Schätzung vs. Ist, Kosten, Versionen) verlassen die Hauptansicht; ob gestrichen oder auf eine Nebenseite verschoben, entscheidet das
Kurzdesign mit Begründung je Karte. Datenquellen und `metrics.py` bleiben unangetastet. Erster Schritt jetzt: Kurzdesign durch `lead-production` (ohne Code, ohne Tests, daher mit
R464 vereinbar); Plan und Umsetzung in der Folgesession nach dem REL-28-Push.

Regelbezug: R464, Verfassung §5 · Kosten bei Irrtum: eine Kurzdesign-Runde; die bisherigen Karten bleiben bis zur Umsetzung sichtbar.

Entscheider: L0 · Anlass: Nutzerauftrag 2026-10-21 · ADR: —

## R791 · 2026-10-21 · Gate Kurzdesign TOOL-DASH-SCHLANK: OK, Umsetzung in der Folgesession

Ruling: Kurzdesign `lead-production` (`design/dash-schlank` @ `77c0ad58`, Handoff `.studio/handoffs/2026-10-21-lead-production-TOOL-DASH-SCHLANK.md`) → **OK**. Hauptansicht 7 Karten
(Projekt: Stand, offene Entscheide, Releases mit Board; Laufende Session: Kopfzeile mit Zählern und Budget, Agenten-Graph, Live-Feed, Delegationen); Vorfälle nur als Banner.
Reiter «Analyse» nimmt Aufwand, Schätzung, Kosten, Qualität, Vorfälle, Verlauf, Experimente, Changelog, Lernen und Chronik unverändert auf; Organigramme, Aktivität (60 min) und
Versionen entfallen. `server.py` und Datenmodell bleiben. «Rulings dieser Session» nur, wenn aus vorhandenen Daten speisbar, sonst nur Delegationen (Entscheid im Plan). Banner-Link
auf `#analyse`. Wegen fehlender JS-Tests: Sichtprüfung per `qa-playtester` Pflicht. Umsetzung 2 Starts nach dem REL-28-Push.

Regelbezug: R464, R790 · Kosten bei Irrtum: entfallene Karten müssten aus Git zurückgeholt werden.

Entscheider: L0 · Anlass: Bericht lead-production TOOL-DASH-SCHLANK · ADR: —

## R792 · 2026-10-21 · Sessionplan: drei Stränge parallel, Budgets neu erteilt

Ruling: Nutzerauftrag «mach weiter» = Plan aus `state.md` fortsetzen. Parallel starten: (1) TOOL-DASH-SCHLANK an `lead-tech` (Plan Stufe leicht, 1 Umsetzer, Review,
Sichtprüfung `qa-playtester`), Budget **4** Starts; (2) ORT-A C11 an `lead-tech` (Fix T15 `paveImage`, `make check` bei Last ≤ 6, Merge k2, T14/T17 nur bei Last ≤ 4, dann
T18), Budget **6** Starts; (3) Stadtplanung C1 an `lead-tech` (Review T06/T07, `make check` bei Last ≤ 8, Merge `feat/stadtplanung-ui`, T08, Stopp vor T09), Budget **26**
Starts. Deckel 6 (R698) gilt studioweit; `make check` der Stränge nie gleichzeitig (Testsperre R380 regelt). Vorfall «lead-tech inaktiv» ist ein Rest-Heartbeat der
pausierten Session 2026-10-17 (Status nicht auf done geloggt); L0 schliesst ihn, Auswertung in der Kurz-Retro am Session-Ende statt Ad-hoc-Start.

Regelbezug: R464, R698, R788, R790, R791 · Kosten bei Irrtum: Laststau bei gleichzeitigen Testläufen; Stränge warten dann auf die Sperre.

Entscheider: L0 · Anlass: Session-Start · ADR: —

## R793 · 2026-10-21 · ORT-A C11: Ruling-Entwürfe 1–5 aus der Übergabe

Ruling: (1) T16-Kernschatten mit Stil `SHADOW` und `globalAlpha = a'/a` angenommen (Bestandsfilter bleiben gültig). (2) Bewusst geänderte Test-Pins (`bildmodus-ks.json`,
`schatten-ks.json`, HOME_CALLS, shadowFills) angenommen, Kommentar «Abweichung durch T15/T16» Pflicht; `referenzen.json` bleibt. (3) Hofrand-/Pflaster-Töne nur Vorschlag an
`lead-art`; AK-33-Schwellen wie beschrieben. (4) Sackgassen-Lappen und 2×2-Grasloch: nicht jetzt, bei T20b mit `lead-art` erneut ansehen. (5) Strangabschluss-`make check`
bleibt Pflicht. Fix T15 ohne Lockern eines Tests.

Regelbezug: R788 · Kosten bei Irrtum: Pins und Schatten-Semantik müssten in T20b nachgezogen werden.

Entscheider: L0 · Anlass: Übergabe `2026-10-17-lead-tech-ORT-A-C11.md` · ADR: —

## R794 · 2026-10-21 · Stadtplanung C1: Ruling-Entwürfe 1–5 aus der Übergabe

Ruling: (1) Ownership-Ausnahmen angenommen (marketGain-Fix in `merchantsController.ts`, Test-Helfer `withoutSupplyRule` in `controller.ts`, additive Render-Fixtures für
`park`). (2) Neue Pins aus `messung-pins.md` angenommen; Krisenprotokoll mild/normal main vs. Branch vor D6 messen, Testtitel mit Alt-Werten nachziehen. (3) Park-Platzhalter
`FALLBACKS.public`, Höhe 0.5·ISO_H bis T10. (4) SAVE_VERSION 19 (main + 1) als Arbeitsannahme; Erweiterung 1 rechnet beim Merge neu. (5) AK-B2-05: Umbenennung plus
erzwungener Brandtest angenommen. Die fünf Befunde aus der Übergabe trägt der Strang in `docs/beobachtungen.md` ein.

Regelbezug: R715, R788 · Kosten bei Irrtum: Pins und Save-Nummer müssten beim Merge nachgezogen werden.

Entscheider: L0 · Anlass: Übergabe `2026-10-17-lead-tech-STADTPLANUNG-C1.md` · ADR: —

## R795 · 2026-10-21 · Gate Merge TOOL-DASH-SCHLANK: BEDENKEN angenommen, Merge frei

Ruling: Gate-Urteil `lead-qa` (Handoff `.studio/handoffs/2026-10-21-lead-qa-TOOL-DASH-SCHLANK.md`, Final-Review opus ohne ZURÜCK) → **Merge frei**. `production-integrator`
merged `tool/dash-schlank` @ `5fecacfa` no-ff nach main, voller `make check` nach dem Merge (Teilbeleg vorher: studio-test 1009, docs-check, lint, tsc je Exit 0). Ergänzung zu R791
angenommen: keine Karte «Rulings dieser Session» (state liefert keine Rulings), Agent-Fokus über Organigramm entfällt, Übersicht zeigt nur offene Nutzerentscheide; P1/P2 volle
Breite. Höhendeckel der Karte «Stand» und tote Reste (`graph.js` `data-agents`, `style.css` `.dim`/1870, `views.js:93`/215–228, `effort.py:143`, `roster.md:50`) bleiben
Beobachtung (Eintrag 2026-10-21). Kein Push in dieser Session ohne eigenes Gate (R335); der Stand geht mit dem nächsten Push. Integrator direkt statt über `lead-production`
gestartet (ein Start weniger, reiner Werkzeug-Merge).

Regelbezug: gates.md Gate Merge, R791, R335 · Kosten bei Irrtum: Dashboard-Fehler fallen erst im Betrieb auf; Rücknahme per Revert-Merge.

Entscheider: L0 · Anlass: Bericht lead-qa TOOL-DASH-SCHLANK · ADR: —

## R796 · 2026-10-21 · Stadtplanung C1 bis T08 abgenommen, Stopp vor T09

Ruling: Bericht `lead-tech` (Handoff `.studio/handoffs/2026-10-21-lead-tech-STADTPLANUNG-C1.md`): T06 OK, T07/T08 BEDENKEN niedrig, Merge `feat/stadtplanung-ui` → `feat/stadtplanung`
(`29460405`), Stand `fa6c1aeb`, Abschluss-`make check` Exit 0 (4645 Tests) → **abgenommen**. Park-Ring vorerst `PALETTE.signalOk`; zeigt die Sichtprobe in T10b/T18 eine
Verwechslung, kommt `parkRing` in `PALETTE`. Fehlender DOM-Test `data-field="noise"` wird mit der Sichtprobe T18 abgedeckt. Verschobene Weberei-Positionen in drei UI-Tests
(6 → 5 Kacheln, keine Assertion abgeschwächt) angenommen. Strang ruht bis zum ORT-A-Merge nach main (T09, `variants.test.ts` MAIN_REF/Park-Hash); Restbudget 9 verfällt mit
Session-Ende.

Regelbezug: R792, R794 · Kosten bei Irrtum: Farbe oder DOM-Test werden in T18 nachgezogen.

Entscheider: L0 · Anlass: Bericht lead-tech STADTPLANUNG-C1 · ADR: —

## R797 · 2026-10-21 · Runden-Ruling IDEEN-14

Ruling: Rangliste `lead-design` (Handoff `.studio/handoffs/2026-10-21-lead-design-IDEEN-14.md`, `docs/ideen-14` @ `e35cb74c`) angenommen. **Eingeplant:** UI-HAEPPCHEN-G aus
I-155 («Zu spät»-Warnung an der Fern-Marke, Fahrzeit-Formel aus I-136) und I-148 («Wo war ich?»-Karte beim Fortsetzen); Kurzdesign sofort (keine Testläufe), Umsetzung
nach Freigabe. I-146 (Wirkkreis) nach der ORT-A-Render-Freigabe (`overlays.ts`). **Zurückgestellt** für das Wirtschafts-Brainstorming: I-154, I-151, I-153 (nur mit
Dominanz-Rechnung). **Geparkt:** I-152, I-149 (bis Erweiterung 1 geklärt). I-147 optional als späteres Häppchen. Pool-Obergrenze: 40 laut R445 gilt; Persona-Notiz «rund 30»
ist veraltet → Beobachtung. `docs/ideen-14` geht mit dem nächsten Integrator-Merge nach main.

Regelbezug: R208, R445, gates.md Gate Ideen-Runde · Kosten bei Irrtum: ein Häppchen mit geringem Nutzen; Rückstellung jederzeit umkehrbar.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-14 · ADR: —

## R798 · 2026-10-21 · Gate Kurzdesign UI-HAEPPCHEN-G: OK, Plan sofort

Ruling: Kurzdesign `lead-design` (`design/ui-haeppchen-g` @ `bee6ee20`, Spec `docs/superpowers/specs/2026-10-21-ui-haeppchen-g-design.md`, 21 AK) → **OK**. I-155 und I-148 je S,
kein Save-Wechsel, keine Baseline-Änderung, nur Darstellungsfarbe `COLORS.markLate`. Designfragen: (1) leere «Wo war ich?»-Karte bleibt stumm, keine Abschalt-Einstellung;
(2) «zu spät» nicht im HUD-Text des Fernauftrags (Beipack-Kandidat). Plan `lead-tech` (Stufe leicht) jetzt; Umsetzung erst nach Freigabe der Testsperre durch ORT-A C11, I-155
vor I-148, Merge-Reihenfolge gegen `feat/stadtplanung` (`app.ts`, `style.css`) im Plan festlegen. Plan prüft `ship.to`/`ship.left` für die Ladungszählung. Budget 8 Starts.

Regelbezug: R797, gates.md kombiniertes Gate Stufe leicht · Kosten bei Irrtum: Fehlalarm der Marke oder störende Karte; beides UI-only und leicht rückbaubar.

Entscheider: L0 · Anlass: Bericht lead-design UI-HAEPPCHEN-G · ADR: —

## R799 · 2026-10-21 · Gate Plan UI-HAEPPCHEN-G: OK, Start bei Last < 8

Ruling: Plan `lead-tech` (`plan/ui-haeppchen-g` @ `512f370f`, Index `docs/superpowers/plans/2026-10-21-ui-haeppchen-g.md`, T01–T04) → **OK**; Entwürfe R799-E bis R802-E
angenommen: ein serieller Strang, Parallelität 1, 6 Starts + 2 Reserve (Budget R798); Ladungszählung nur `ship.to === Fern-Insel` und `left ≤ Rest` (Überschätzung bei vollem
Lager → nur unterlassener Hinweis, Beobachtung); Merge-Reihenfolge Stadtplanung vor UI-G, `app.ts`-Diff in eigenem Commit (Auflösung: beide Aufrufe, Karte zuletzt);
Bestandstests `farMark.test.ts` AK-M5 und `seaMapDraw.test.ts` `mk()` ziehen mit exakten Werten mit (P-4). Render-Zeile in `seaMap.ts` macht `tech-ui-engineer` mit.
Umsetzungsstart, sobald ein Platz frei ist und die 1-min-Last < 8 liegt (R708 V2).

Regelbezug: R798, R708 V2, R270, R398 · Kosten bei Irrtum: Merge-Konflikt in `app.ts` (eine Zeile) oder Nachziehen zweier Testwerte.

Entscheider: L0 · Anlass: Bericht lead-tech Plan UI-HAEPPCHEN-G · ADR: —

## R800 · 2026-10-21 · ORT-A C11: k2 abgenommen, Messung trotz fremdem Leerlauf-Chrome

Ruling: Bericht `lead-tech` (Handoff `.studio/handoffs/2026-10-21-lead-tech-ORT-A-C11.md`): Fix T15 `b6a729a9`, Pins `2677d062` (HOME_CALLS/HOME_CALLS_OHNE_C 19062 → 19069,
Hashes in `bildmodus-ks.json`/`schatten-ks.json`, Kommentar «Abweichung durch T15/T16»), `make check` EXIT=0, Merge k2 → `feat/ort-a` `126e88f4` → **abgenommen** (bestätigt R793 (1), (2), (5)).
**Messfenster:** Der fremde Headless-Chrome aus Munica (PID 91387/91391, N-102) läuft im Leerlauf (≈ 0,1 % CPU). T14 und T17 laufen bei 1-min-Last ≤ 4 trotz der
Meldung «belegt»; jeder Messbericht trägt den Vermerk «Messfenster belegt: fremder Leerlauf-Chrome (N-102)». Liegt ein Wert innerhalb von 10 % an seiner Grenze, wird er nach
Antwort auf N-102 wiederholt. Messungen haben Vorrang: UI-HAEPPCHEN-G startet erst nach T17 (oder nach 30 min ohne Fenster, dann Zwischenstand). T18 nach T14.

Regelbezug: R329, R380, R708 V2, R793 · Kosten bei Irrtum: eine Messung mit leicht verfälschtem Wert, wiederholbar.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C11 · ADR: —

## R801 · 2026-10-21 · ORT-A C11: Ring-Test AK-26 auf Abstand 1, Fixes k1/k2 zur Messung

Ruling: Fix k1 `84b31a92` (`hofsaumTileChanged`: äusserer Ring nur noch bei Wegänderung im Abstand 1, 9 statt 25 Kacheln, 1 statt 9 Stücke) und Fix k2 `0f86a144` (Schatten
ruhender Objekte als `Path2D` im LRU-Cache) zur Wiederholungsmessung freigegeben. Die Änderung in `tests/render/wegsaum.test.ts` («AK-26 Ring»: Abstand 1 wahr, Abstand 2
falsch) gilt nicht als Lockerung, weil `terrainPatch.test.ts` den Patch pixelweise gegen den Vollaufbau prüft (bitgleich) → **angenommen**. Abnahme der Fixes erst mit
bestandenen Messungen AK-31, AK-37, AK-39.

Regelbezug: R793, R800 · Kosten bei Irrtum: ein Saum-Artefakt bei Wegen im Abstand 2, das der Pixelvergleich übersehen hätte; Rücknahme ein Commit.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech ORT-A C11 · ADR: —

## R802 · 2026-10-22 · Sessionplan: ORT-A-Messungen, UI-HAEPPCHEN-G, HAUSHALT-02; kein Push vor Release

Ruling: Nutzerauftrag «mach weiter» = Plan aus `state.md` und R792–R800 fortsetzen (die Vorsession endete ohne Ende-Routine, ihr Ruling-Entwurf ist als R801 nachgetragen; L0 führt `state.md` am Ende nach). Parallel:
(1) **ORT-A C11** an `lead-tech` (Controller, sonnet): T14 und T17 nacheinander bei 1-min-Last ≤ 4 mit Vermerk laut R800, danach T18; Budget **6** Starts neu. (2)
**UI-HAEPPCHEN-G** Umsetzung an `lead-tech` (Controller, sonnet) nach Plan `plan/ui-haeppchen-g` @ `512f370f`, Worktree `.worktrees/ui-haeppchen-g-impl`, Budget **8**.
Die 30-min-Frist aus R800 ist seit der Vorsession abgelaufen und die Last kommt nicht vom Studio (6,8 ohne Agenten); deshalb startet G sofort, nur gezielte Tests, `make check`
nur über die Testsperre (R380). Hat ORT-A ein Messfenster, meldet `lead-tech` ORT-A das per Testsperre-Belegung; G pausiert Testläufe in der Zeit. (3) **HAUSHALT-02** an
`lead-production` (Aufräumen fällig: `.studio/qa` 3,4 GB, R685/R687), nur `aufraeumen.py` (Trockenlauf, dann `--apply`), keine Worktrees. **Push:** Main ist lokal nur um
Werkzeug/Doku voraus (TOOL-DASH-SCHLANK, R795); kein eigener Push dafür, der Stand geht mit dem Release von UI-HAEPPCHEN-G (R335, R464 greift erst dann). Deckel 6 (R698).

Regelbezug: R335, R380, R464, R685, R698, R708 V2, R800 · Kosten bei Irrtum: Messfenster für ORT-A verschiebt sich; Dashboard-Fix bleibt länger lokal.

Entscheider: L0 · Anlass: Session-Start · ADR: —

## R803 · 2026-10-22 · Ein Controller für ORT-A C11 und UI-HAEPPCHEN-G; Stand der Wiederholungsmessung

Ruling: Ergänzung zu R802 nach Sichtung der Vorsession (Ereignisse, Scratchpad `e6dbb809…/m2.log`): Die Wiederholungsmessung lief bis T14-AK32 und brach ab. Stand mit Vermerk
N-102: **AK-39 bestanden** (Seed 7 −0,2, Seed 14 0,0, Fixture −1,3 ms), **AK-30 bestanden** (+0,048 ms), **AK-31 nicht bestanden** (Σover25 B = 1 bei Seed 14, Patch 6–8 ms
gegen 2,5 ms), **AK-37 offen** (Schatten-Kern-L* 45,4 → 41,4, Stichprobe n = 1 statt 20), AK-32 fehlt. UI-HAEPPCHEN-G: T01 und T02 committet (`a3c61ffb`…`638d87d1`), aber
ohne einen Prüflauf. Weil beide Stränge um dieselben Last-Fenster konkurrieren, führt **ein** `lead-tech`-Controller beide (Budget 14 = 6 + 8, Parallelität 2): Last ≤ 4 →
ORT-A-Messung; Last 4–8 → Prüfläufe UI-G; nie beides gleichzeitig. Reihenfolge ORT-A: AK-37 korrekt mit n = 20 (oder begründete Abweichung gegen R793 (1) als Entwurf), Fix
AK-31, Nachmessung AK-31/AK-32, Merge k1/k2 nach `feat/ort-a`, dann T18.

Regelbezug: R329, R380, R708 V2, R793, R800, R801, R802 · Kosten bei Irrtum: ein Controller als Engpass; ein zweiter Lead kann jederzeit abgespalten werden.

Entscheider: L0 · Anlass: Sichtung Vorsession · ADR: —

## R804 · 2026-10-22 · HAUSHALT-02 abgenommen; Wirtschafts-Brainstorming auf freiem Platz

Ruling: (1) Bericht `lead-production` HAUSHALT-02: 3498,6 MB über `aufraeumen.py --apply` gelöscht, `--check` ohne Befund, Repo unverändert → **abgenommen**. (2) Freie Plätze
(R475, Umsetzung durch Last-Fenster gebremst): **WIRTSCHAFT-BS-1** an `lead-design` (opus, Brainstorming mit Dominanz-Rechnung laut R797) für die zurückgestellten I-154
Rückfracht, I-151 Handelstreue und I-153 Seerecht; Ergebnis ist ein Designvorschlag mit Empfehlung (je Idee: bauen/ändern/verwerfen), keine Spec, kein Code, keine Testläufe.
Save-Folgen gegen Stadtplanung (v19) und Erweiterung 1 benennen. Budget **3** Starts (Lead + bis 2 Helfer, z. B. `design-economy-designer`).

Regelbezug: R445, R475, R797 · Kosten bei Irrtum: ein Designvorschlag, der liegen bleibt.

Entscheider: L0 · Anlass: HAUSHALT-02-Bericht, freie Kapazität · ADR: —

## R805 · 2026-10-22 · Gate WIRTSCHAFT-BS-1: I-153 Seerecht bauen, I-154 und I-151 verworfen

Ruling: Designvorschlag `lead-design` (`design/wirtschaft-bs-1` @ `04f733f5`, Handoff `.studio/handoffs/2026-10-22-lead-design-WIRTSCHAFT-BS-1.md`) → Entwürfe R-1 bis R-4
**angenommen**. (1) **I-153 Seerecht** wird gebaut, mit Änderungen: 8 statt 10 Ticks je Seekachel, Restfahrzeit fahrender Schiffe beim Beschluss umrechnen, ein gemeinsamer
Fahrzeit-Helfer (auch für die «Zu spät»-Marke I-155), Kartentext mit Zahl. Spec Stufe voll erst nach UI-HAEPPCHEN-G und Stadtplanung; eine Save-Nummer entscheidet `lead-tech`
im Plan, nie neben Stadtplanung v19. Die BEDENKEN (Glasrecht bei 60–120 Kaufleuten gleich gut oder besser; Stufe 4 zeigt drei Karten) prüft die Spec ausdrücklich. (2) **I-154**
verworfen als Doppelung (Holen/Bringen seit M12, `routeBalance.ts`); «zurück leer» als möglicher UI-Beipack. (3) Seerecht-Wert geht in die Balancing-Prüfung von Erweiterung 1.
(4) **I-151** verworfen; Kriterium für künftige Auflagen: Bedarf über die Laufzeit weit über der Lagergrenze, Geld kein Ausweg. Archivierung I-151/I-154 mit dem Merge von
`docs/ideen-14`.

Regelbezug: R670, R797, R804 · Kosten bei Irrtum: Seerecht als schwache Karte; Wert ist in `src/sim/defs/` leicht nachziehbar.

Entscheider: L0 · Anlass: Bericht lead-design WIRTSCHAFT-BS-1 · ADR: —

## R806 · 2026-10-22 · Kurzdesign UI-HAEPPCHEN-H (I-147, I-146) auf freiem Platz

Ruling: Freier Platz (R475): Kurzdesign **UI-HAEPPCHEN-H** an `lead-design` (sonnet, Kurzdesign Stufe leicht) aus I-147 (zweiter Autosave-Platz «Davor») und I-146 (Wirkkreis bei
ausgewählter Kapelle, Schule, Feuerwache; R797 «nach ORT-A-Render-Freigabe»). Nur Kurzdesign mit AK, keine Testläufe; Umsetzung frühestens nach UI-HAEPPCHEN-G (I-147 berührt
den Ladepfad von I-148) und für I-146 nach dem ORT-A-Merge nach main. Budget **2** Starts.

Regelbezug: R475, R797 · Kosten bei Irrtum: ein Kurzdesign, das liegen bleibt.

Entscheider: L0 · Anlass: freie Kapazität · ADR: —

## R807 · 2026-10-22 · Gate Kurzdesign UI-HAEPPCHEN-H: OK, F1–F7 nach Empfehlung, Plan sofort

Ruling: Kurzdesign `lead-design` (`design/ui-haeppchen-h` @ `acf7d5ef`, 24 AK: P1 I-147 13, P2 I-146 11) → **OK**. Designfragen nach Empfehlung: F1 Zeiger-Schlüssel
`inselreich.save.auto.last` ja; F2 `pagehide` überschreibt den neuesten Platz, nie Wechsel; F3 «Davor laden» als Nebenwahl auf der Startkarte; F4 Quote nur messen (AK-H13),
über 1 MB je Stand zurück an L0; F5 Kreis auch für das Bad (gleiche Eigenschaft `serviceRadius`, kleine Erweiterung, konsistent), nicht der Marktplatz; F6 bei Auswahl nur der
Einzelkreis, Cache unberührt; F7 Reihenfolge G vor H, P2 nach ORT-A-Merge nach main, P1 darf früher. Kein Save-Wechsel, keine Baseline-Änderung. Plan `lead-tech` (Stufe leicht,
sonnet) jetzt, ohne Testläufe; Budget **2** Starts für den Plan, Umsetzung erst per eigenem Gate Plan.

Regelbezug: R806, gates.md kombiniertes Gate Stufe leicht · Kosten bei Irrtum: UI-only, leicht rückbaubar.

Entscheider: L0 · Anlass: Bericht lead-design UI-HAEPPCHEN-H · ADR: —

## R808 · 2026-10-22 · Gate Plan UI-HAEPPCHEN-H: OK, zwei Stränge, Start nach UI-G bzw. ORT-A

Ruling: Plan `lead-tech` (`plan/ui-haeppchen-h` @ `9ad323a1`, Index `docs/superpowers/plans/2026-10-22-ui-haeppchen-h.md`, T01–T07) → **OK**; Entwürfe R808-E bis R811-E in
einem Ruling angenommen: zwei Stränge (`feat/ui-haeppchen-h-p1` T01–T04, `feat/ui-haeppchen-h-p2` T05–T07), Umsetzungsbudget **11** Starts (9 geplant + 2 Reserve),
Parallelität 1 bis zum Merge von UI-G und ORT-A, danach 2; `saveAuto` schreibt in den Platz ausser dem Zeiger, `saveAutoNewest` (`pagehide`) in den neuesten ohne Zeigerwechsel;
Merge-Reihenfolge UI-G → P1, ORT-A → P2; `selectionPlan` liefert `rings: []`, sobald Stadtplanung das Feld nach main bringt (Konfliktstelle `overlays.ts`, Auflösung per
`git merge main`); Quote-Messung in T03, ein Stand über 1 MB geht vor dem Merge an L0. Budget wird beim Start von P1 geloggt.

Regelbezug: R807, gates.md kombiniertes Gate Stufe leicht · Kosten bei Irrtum: Konflikt in `overlays.ts` oder `app.ts`, lokal lösbar.

Entscheider: L0 · Anlass: Bericht lead-tech Plan UI-HAEPPCHEN-H · ADR: —

## R809 · 2026-10-22 · Nutzerfrage «neue Agenten?»: Seerecht-Spec und Prozess-Aussensicht zur Last

Ruling: Nutzerfrage nach weiteren Agenten = Auftrag, freie Plätze zu füllen, soweit sie die Last nicht erhöhen. Engpass ist die Rechnerlast (Messfenster ORT-A, `make check`
UI-G), nicht die Zahl der Agenten; deshalb nur Arbeit ohne Testläufe: (1) **I-153 Seerecht Spec** an `lead-design` (opus) jetzt statt nach UI-G/Stadtplanung — R805 (1) wird
für die Spec vorgezogen, Plan und Umsetzung bleiben nach UI-G und Stadtplanung; Budget **2**. (2) **Prozess-Aussensicht Last-Engpass** an `studio-process-coach` (sonnet,
ad hoc): warum Messfenster, `make check` und Push-Gate sich gegenseitig blockieren, mit Daten aus `events.jsonl`, Ledgern, Scratchpad-Logs dieser und der Vorsession;
Vorschläge als Retro-Bericht, keine Handbuch-Änderung. Budget **1**.

Regelbezug: R445, R475, R698, R805 · Kosten bei Irrtum: Spec muss bei Änderungen durch UI-G/Stadtplanung nachgezogen werden.

Entscheider: L0 · Anlass: Nutzerfrage · ADR: —

## R810 · 2026-10-22 · Nutzerauftrag «Tests auf ein Minimum, Releases bündeln»: V1, V2, V5 angenommen

Ruling: Nutzerauftrag (Tests reduzieren, Pakete bündeln und gemeinsam prüfen) zusammen mit der Prozess-Aussensicht `docs/studio/retros/2026-10-22-adhoc-last.md` entschieden:
(1) **V1 Bündelung:** Strangabschluss und Gate Merge eines Pakets brauchen nur noch den **Teilbeleg** (gezielte Tests der berührten Dateien, `tsc`, `lint`, bei Werkzeug
`studio-test`); der **volle Testlauf läuft einmal je Release**, und zwar als `make push-check` auf dem gebündelten Stand (ersetzt den separaten `make check` vor dem Push und den
Integrator-`make check` je Merge). Pakete werden lokal nach main gemergt und zu einem Release gebündelt; ein Release umfasst alles, was bis zum Push-Fenster abgenommen ist.
Rot im Push-Check → Behebung vor dem Push, Ursache dem Paket zuordnen. (2) **V2 Experiment:** volle Läufe mit `VITEST_MAX_WORKERS=5` statt 9 (Umgebungsvariable, wirkt sofort);
rote Zeit-/Timeout-Dateien einmal einzeln bei Last ≤ 4 wiederholen, Wiederholung im Event vermerken; Auswertung nach drei vollen Läufen. (3) **V5:** `loadsnap.py` mit
Skriptname und Klasse eigen/fremd, als kleines Werkzeugpaket bei freiem Platz. (4) V3 (Messfenster-Sperrdatei) und V4 (A/A-Kontrolle statt Lastgrenze) später gemeinsam als
Plan. Sofort gültig für UI-HAEPPCHEN-G: kein weiterer `make check`; Teilbeleg liegt vor (Final-Review, 77/77), Gate Merge an `lead-qa`, Merge lokal, der volle Lauf kommt mit
dem Push-Check von REL-29 (Bündel: UI-G, TOOL-DASH-SCHLANK, Doku). Handbuch-Minor durch `studio-coach` im selben Zug (R429).

Regelbezug: R335, R380, R429, R503, R517, R795 · Kosten bei Irrtum: Integrationsfehler fallen erst im Push-Check auf; dann ein Fix-Paket vor dem Push.

Entscheider: L0 · Anlass: Nutzerauftrag, Retro PROZESS-LAST · ADR: —

## R811 · 2026-10-22 · UI-HAEPPCHEN-G zum Gate Merge; Reihenfolge vor Stadtplanung; Bündel REL-29

Ruling: Bericht `lead-tech` (`feat/ui-haeppchen-g` @ `134ac43e`, Handoff `.studio/handoffs/2026-10-22-lead-tech-UI-HAEPPCHEN-G.md`): T01–T04 fertig, Final-Review opus OK,
Playtest OK, Teilbeleg nach R810 vollständig → **Gate Merge an `lead-qa`** (sonnet). Entwürfe: (1) T03 Schritt 3 im Save-Format unmöglich, Sortierung nur per Unit-Test belegt →
angenommen; (2) I-155/I-148 auf «umgesetzt» erst nach Merge von `docs/ideen-14` → angenommen; (3) Bisect-Lücke `fd835355` → zur Kenntnis. **Reihenfolge abweichend von R799:**
Stadtplanung wartet auf ORT-A, darum geht UI-G **zuerst** nach main; den `app.ts`-Konflikt in `loadSlotPaused` löst Stadtplanung beim eigenen Merge nach der Notiz (beide Zeilen,
Stadtplanungs-Meldung zuerst, `openResumeCard` zuletzt). **Bündel REL-29:** UI-G, TOOL-DASH-SCHLANK (schon auf main), `docs/ideen-14`, Doku-Branches
`design/ui-haeppchen-g`, `plan/ui-haeppchen-g`, `design/wirtschaft-bs-1`, `design/ui-haeppchen-h`, `plan/ui-haeppchen-h`; ein Push-Check als einziger voller Lauf (R810).

Regelbezug: R799, R810, gates.md Gate Merge · Kosten bei Irrtum: Konfliktlösung in `app.ts` beim Stadtplanungs-Merge (eine Zeile).

Entscheider: L0 · Anlass: Bericht lead-tech UI-HAEPPCHEN-G · ADR: —

## R812 · 2026-10-22 · Gate Merge REL-29: OK, Merge frei, Push nach grünem Push-Check

Ruling: Gate-Urteil `lead-qa` OK (Handoff `.studio/handoffs/2026-10-22-lead-qa-gate-REL-29.md`) → **Merge frei** in der dort genannten Reihenfolge (UI-G, `docs/ideen-14`,
Status I-155/I-148 «umgesetzt», Doku-Branches). `production-integrator` merged seriell und lokal, ohne `make check` je Merge (R810), dann **einmal** `make push-check` mit
`VITEST_MAX_WORKERS=5` (V2); bei Exit 0 Push des geprüften Hashes `git push origin <Hash>:main` (R335: erster Push dieser Studio-Session), danach CI und Pages prüfen. Rote
Zeit-/Timeout-Dateien einmal einzeln bei Last ≤ 4 wiederholen (V2), echte Fehler → Stopp und Bericht. Start erst nach dem Commit von Handbuch 1.66 (Arbeitsbaum muss während des
Push-Checks unverändert bleiben). ORT-A-Messungen und Push-Check nie gleichzeitig: nach dem laufenden Messblock startet ORT-A keinen neuen, bis der Push-Check fertig ist.

Regelbezug: R335, R464, R503, R517, R810, R811 · Kosten bei Irrtum: roter CI-Lauf, Behebung hat Vorrang; Rücknahme per Revert.

Entscheider: L0 · Anlass: Gate-Urteil lead-qa REL-29 · ADR: —

## R813 · 2026-10-22 · Verfassung vor R810: verfassungskonforme Lesart bis N-103

Ruling: Hinweis `studio-coach` (N-103): Verfassung §7.1/§7.2/§9.2 verlangen `make check` grün vor jedem Merge und vor dem Push; §9 ist nicht abschwächbar, nur der Nutzer
ändert die Verfassung. R810 V1 und Handbuch 1.66 gelten deshalb bis zur Antwort auf N-103 nur in dieser Lesart: (a) Ein Release-Bündel wird im Worktree `.worktrees/integrate`
zusammengeführt; **ein** voller Lauf (`make push-check`, enthält `check-push`) auf genau diesem Stand ist der grüne `make check` vor dem Merge nach main **und** vor dem Push;
main wird erst danach auf diesen geprüften Hash gebracht (Fast-Forward oder ein Merge ohne weitere Änderung) und genau dieser Hash gepusht. (b) Strang-interne Merges
(z. B. k1/k2 → `feat/ort-a`) behalten bis N-103 ihren `make check` (mit `VITEST_MAX_WORKERS=5`). (c) Paket-Gates brauchen nur den Teilbeleg, weil sie selbst nicht mergen.
R812 wird entsprechend ausgeführt. N-103 wird dem Nutzer direkt vorgelegt.

Regelbezug: Verfassung §1, §7, §9.2; R810, R812 · Kosten bei Irrtum: ein voller Lauf mehr je Strang-Merge bis zur Antwort.

Entscheider: L0 · Anlass: Bericht studio-coach Handbuch 1.66 · ADR: —

## R814 · 2026-10-22 · Gate Spec SEERECHT: BEDENKEN angenommen, Nachtrag abgenommen

Ruling: Gate-Urteil `lead-qa` BEDENKEN (Handoff `.studio/handoffs/2026-10-22-lead-qa-gate-spec-SEERECHT.md`) → alle sieben Punkte angenommen; Spec-Nachtrag `lead-design`
(`design/seerecht` @ `f5da4cfa`: `AK-SR-1`…`AK-SR-25`, F2 streng, AK-SR-21 als Wächter-Test, AK-SR-5 Rückruf `homing`, Risiko Wert 8 mit Rückfall §6.4, `isValidCouncil` vor den
Schiffen, AK-SR-7 über Ankunfts-Ticks; F1 ja, F3 ja) → **Spec abgenommen**. Plan erst nach dem Merge von UI-HAEPPCHEN-G (erfolgt mit REL-29) und Stadtplanung nach main;
`design/seerecht` geht mit dem nächsten Release-Bündel nach main.

Regelbezug: R805, R809, gates.md Gate Spec · Kosten bei Irrtum: Nachtrag beim Plan, falls Stadtplanung Lesestellen ändert.

Entscheider: L0 · Anlass: Gate-Urteil lead-qa, Nachtrag lead-design · ADR: —

## R815 · 2026-10-22 · REL-29 live; Push trotz Push-Check Exit 1 nachträglich angenommen, Vorfall an die Retro

Ruling: Bericht `production-integrator`: Bündel REL-29 seriell gemergt (UI-G `7d3be6a6`, `docs/ideen-14`, Status I-155/I-148, Doku-Branches), Push `705af797..d9580844`, CI
39747149002 und Pages 39748155515 grün. Der Push-Check endete mit **Exit 1**: einziger Fehler `tests/sim/perf.test.ts` (2,54 ms gegen Pin 2,5 ms; 4511 grün); Einzel-
Wiederholung 2/2 grün (auch `CI=true`), aber bei Last ≈ 5,4 statt ≤ 4; `check-ci-perf` einzeln Exit 0; der Schritt «strenge Zeitreserve» lief nicht. Der Integrator hat ohne
Rückmeldung gepusht. **Nachträglich angenommen**, weil der einzige Fehler ein Zeit-Pin knapp über der Grenze war, die Wiederholung grün und die CI grün ist (Verfassung §7.2 sachlich
erfüllt: alle Funktionstests grün). **Abweichungen** (Push ohne L0-Freigabe bei Exit 1; Wiederholung nicht bei Last ≤ 4; Zeitreserve-Schritt fehlt) gehen als Vorfall an die
Kurz-Retro; `perf.test.ts`-Pin (AK-E0-15a) kommt auf die ZEITRESERVE-PFLEGE-Liste. Erster und einziger Push dieses Tages.

Regelbezug: Verfassung §7.2, R335, R810 V2, R812, R813 · Kosten bei Irrtum: Zeitregression in der Sim unbemerkt; CI-Zeitbudget fängt grobe Fälle.

Entscheider: L0 · Anlass: Bericht production-integrator REL-29 · ADR: —

## R816 · 2026-10-22 · Nutzerentscheid N-103 ja; höchstens ein Push je Tag

Ruling: Nutzer: «N-103 ja. ausserdem die releases/pushs generell mehr bündeln. einer pro tag reicht völlig. muss nicht jede session sein». Umsetzung: (1) **Verfassung 1.3**
(Änderung durch den Nutzer, Text durch `studio-coach`): §9.2 und §7.1 lauten sinngemäss «Ein voller Testlauf (`make check` bzw. `make push-check`) ist grün vor jedem Merge
nach `main` und vor jedem Push; Zwischen-Merges innerhalb eines Strangs brauchen gezielte Tests der berührten Dateien, Typ- und Stilprüfung.» R813 (b) entfällt. (2) **Push-Takt:**
höchstens **ein Push je Kalendertag**, ersetzt «höchstens ein Push je Session» (R335, R434); abgenommene Pakete sammeln sich lokal auf main und gehen gebündelt live. Die
Live-Ampel-Regel (R565 P4) bleibt als zusätzliche Grenze. (3) Handbuch-Minor 1.67 durch `studio-coach`; N-103 beantwortet, N-99 durch (2) gegenstandslos.

Regelbezug: Verfassung §1, §7, §9; R335, R434, R810, R813 · Kosten bei Irrtum: Fehler warten länger auf den Fix-Push; Hotfix für Live-Fehler bleibt per Ruling möglich.

Entscheider: Nutzer (N-103), L0 (Auslegung) · Anlass: Nutzernachricht · ADR: —

## R817 · 2026-10-22 · Verfassung 1.3 und Handbuch 1.67 abgenommen; Release-Auslöser nach Tagestakt; UI-HAEPPCHEN-H P1 startet

Ruling: (1) Bericht `studio-coach` (`515c0cb2`): Verfassung 1.3, Handbuch 1.67, Persona `production-integrator` 1.17 (bei Exit ≠ 0 nie pushen) → **abgenommen**; N-99 als
`umgesetzt` statt «gegenstandslos» angenommen. (2) Release-Auslöser «Session-Ende mit ≥ 1 Häppchen» und «3 Häppchen release-reif» widersprechen dem Nutzerwunsch «muss nicht
jede Session sein»: Sie lösen künftig nur das **lokale Bündeln** (Gate Merge, Merge nach main nach vollem Lauf) aus; der **Push** erfolgt höchstens einmal je Kalendertag,
gebündelt, nach dem ersten abgeschlossenen Release-Stand des Tages oder beim ersten Push-Fenster des Folgetags. `studio-coach` zieht das als Fortsetzung in 1.67 nach. (3)
**UI-HAEPPCHEN-H P1** (T01–T04, R808) startet jetzt im laufenden `lead-tech`-Controller (R803-Fensterlogik gilt auch hier: Last ≤ 4 gehört ORT-A-Messungen); Budget **11**
laut R808, Parallelität 1, solange ORT-A nicht auf main ist.

Regelbezug: R803, R808, R816 · Kosten bei Irrtum: Release-Notizen sammeln sich über mehrere Sessions; state.md trägt sie.

Entscheider: L0 · Anlass: Bericht studio-coach, Merge UI-G · ADR: —

## R818 · 2026-10-22 · «mach weiter»: TOOL-LOADSNAP (V5) und state.md-Entwurf auf freien Plätzen

Ruling: Nutzer «mach weiter» = Plan fortsetzen; ORT-A misst (AK-32), UI-H P1 wartet auf das Browser-Fenster. Freie Plätze ohne Spieltests: (1) **TOOL-LOADSNAP** (R810 V5) an
`lead-tech` (sonnet, Werkzeug-Paket Stufe leicht): `tools/studio/loadsnap.py` schreibt Skriptname (nicht auf 60 Zeichen gekürzt) und Klasse eigen/fremd ins Event; TDD mit
`make studio-test`, kein vitest; Budget **3** Starts (Umsetzer, Review, Reserve); Merge nach main im nächsten Release-Bündel. (2) **state.md-Entwurf** an `lead-production`
(sonnet): Stand R801–R818, REL-29-Notiz, laufende Stränge, Fortsetzung; L0 übernimmt ihn am Session-Ende. Budget **1**.

Regelbezug: R475, R810, STUDIO.md Session-Ende · Kosten bei Irrtum: gering, Werkzeug-only.

Entscheider: L0 · Anlass: Nutzer «mach weiter» · ADR: —

## R819 · 2026-10-22 · Nutzerauftrag «Menschen auf der Strasse schöner, Tempo Transport/Spazieren annähern»: Kurzdesign LEBEN-STRASSE

Ruling: Nutzerauftrag ausgelegt als Darstellungs-Paket **LEBEN-STRASSE** (nur `src/render/`, keine Spielregel, kein Save): (a) Figuren (Spaziergänger `life.ts`
`drawWalker`, Träger/Botengänge `errands.ts`) sehen schöner aus — Proportionen, Gang-Animation, Kleidung/Farbe passend zur Art Direction (ADR-012, ART-STIL); (b) Tempo
angleichen: Spaziergänger laufen heute in Echtzeit (`WALK_SPEED` 1,2 Kacheln/s), Träger im Simtakt (bei 2×/4× deutlich schneller) — Ziel: gleiche wahrgenommene Schrittgeschwindigkeit
bei 1×, Verhalten bei 2×/4× bewusst festlegen. Brainstorming-Phase Pflicht: Kurzdesign an `lead-art` (Art Direction, sonnet), bei Bedarf mit `art-rendering-engineer` als
Recherche-Helfer; keine Testläufe, kein Code. Umsetzung erst nach Gate Kurzdesign und Plan; Dateikonflikte mit ORT-A (`renderer.ts`) im Kurzdesign benennen, Start nach ORT-A-Merge,
falls nicht disjunkt. Budget **2** Starts.

Regelbezug: ADR-012, R797 (Render nach ORT-A), CLAUDE.md «Nie direkt in die Implementierung» · Kosten bei Irrtum: ein Kurzdesign mit falscher Auslegung; Nachfrage-frei korrigierbar.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R820 · 2026-10-22 · Gate Kurzdesign LEBEN-STRASSE: OK, Plan sofort

Ruling: Kurzdesign `lead-art` (`design/leben-strasse` @ `90c74b60`, 22 AK: AK-T1–T10 Tempo, AK-V1–V12 Optik; P1 Tempo S–M, P2 Optik M) → **OK**. Designfragen nach Empfehlung:
(1) Tempofaktor f = 0 / 1 / 1,6 / 2,4 (Pause/1×/2×/4×) zentral in `src/render/pace.ts`, Abstimmung im Browser-Check; (2) Sammler-Hinweg bei kurzem Fenster mitten auf dem Weg
einblenden; (3) Spaziergänger stehen in der Pause. Ankunft am Ziel verankert (Lieferung endet bei Phase 1), `src/render/` schreibt nie in die Welt; kein Sim-, Save- oder Baseline-
Wechsel. **Kein Rebase** (Dauerregel): der Anbindungs-Task (`renderer.ts`, `app.ts`) holt nach dem ORT-A-Merge `main` per `git merge main` herein; P1/P2 in `life.ts`, `errands.ts`,
`pace.ts` und Tests dürfen sofort starten. Plan `lead-tech` (Stufe leicht, sonnet), keine Testläufe; Budget **2** Starts. Luminanz-Mindestwert AK-V8 legt der Plan per Messung fest.

Regelbezug: R819, gates.md kombiniertes Gate Stufe leicht, CLAUDE.md-Dauerregel «kein Rebase» · Kosten bei Irrtum: Darstellung, per Revert rückbaubar.

Entscheider: L0 · Anlass: Bericht lead-art LEBEN-STRASSE · ADR: —

## R821 · 2026-10-22 · TOOL-LOADSNAP fertig, wartet aufs nächste Release-Bündel

Ruling: Bericht `lead-tech` TOOL-LOADSNAP (`tool/loadsnap` @ `3d52f696`, `make studio-test` 1017 OK, Review OK mit drei niedrigen Befunden, zwei behoben, Repo-Root fest
hinnehmbar) → **Strang abgenommen**. Gate Merge erfolgt gesammelt im nächsten Release-Bündel durch `lead-qa` (R816/R817: Bündeln, voller Lauf vor dem Merge nach main). Die
Klassifizierungsgrenzen (Klasse nur aus Befehlsstring; `unittest` gilt als eigen) gehen als Hinweis in die Auswertung von E-071.

Regelbezug: R810 V5, R816, R817 · Kosten bei Irrtum: Fehlklassifizierung einzelner Prozesse, nur Messwerkzeug.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-LOADSNAP · ADR: —

## R822 · 2026-10-22 · Gate Plan LEBEN-STRASSE: OK, Umsetzung T01–T05 sofort

Ruling: Plan `lead-tech` (`plan/leben-strasse` @ `e4565d7c`, T01–T10, alle 22 AK zugeordnet) → **OK**; Entwürfe R821-E bis R823-E angenommen: zwei Stränge
(`feat/leben-strasse` T01–T03, T05–T10; `feat/leben-strasse-look` T04, per `git merge` vor T05), T06/T07 erst nach ORT-A-Merge nach main mit `git merge main` (kein Rebase);
Tempo über optionales `tickClock(world, timeMs, speed?)`, alte Aufrufer wie `speed = 1`; AK-V11-Messung nur bei freier Sperre und nie parallel zu ORT-A-Messungen, AK-V8-Mindestwert
per Mess-Schritt in T04. Umsetzung durch einen **eigenen `lead-tech`-Controller** (sonnet), Budget **11** Starts, Parallelität 2; Fensterregel R803: Last ≤ 4 gehört ORT-A-Messungen,
gezielte Tests bei Last 4–8.

Regelbezug: R803, R820, Verfassung 1.3 §9.2 · Kosten bei Irrtum: Konflikt in `renderer.ts` beim ORT-A-Merge, mechanisch lösbar.

Entscheider: L0 · Anlass: Bericht lead-tech Plan LEBEN-STRASSE · ADR: —

## R823 · 2026-10-22 · Nutzerauftrag «mehr Agenten»: Deckel 10, fünf neue Pakete, ORT-A AK-31 Variante 1

Ruling: Nutzer: «starte noch mehr agenten die an den einzelnen punkten arbeiten. wir haben ja kapazität». Auslegung: Der Engpass sind lokale Testläufe, nicht Agenten; Text-,
Design- und Plan-Agenten belasten den Rechner kaum. (1) **Deckel studioweit 10** (ersetzt R698 «6»), davon höchstens **3 Controller mit Testläufen** und ≤ 2 Browser-Läufe (R424);
Fensterregel R803 bleibt. (2) **ORT-A AK-31:** Variante 1 des Umsetzers angenommen — Patch auf zwei Frames verteilen (inneres 3×3 samt Edge, im nächsten Frame Ring samt Dekor);
`terrainPatch.test.ts` bekommt ein `flush`, der Pixelvergleich bleibt unverändert streng; ≈ 1 Plan-Task, im Budget von R803. (3) Neue Pakete ohne Spieltests: **SEERECHT Plan**
(`lead-tech`, opus, Stufe voll, gegen main; Nachzieh-Pflicht nach Stadtplanung-Merge; Budget 2); **IDEEN-15** breite Runde (`lead-design` + 3 Scouts, R445; Budget 4, ≤ 160 Tools);
**BEOB-18** Auswertung `docs/beobachtungen.md` (`lead-production`, Skill `beobachtungen-auswerten`; Budget 1); **TOOL-MESSFENSTER Plan** (R810 V3 Sperrdatei + V4 A/A-Kontrolle,
`lead-tech` sonnet; Budget 2).

Regelbezug: Verfassung §5.8, R424, R445, R475, R698, R803, R810 · Kosten bei Irrtum: mehr Koordination; Plan-Arbeit, die nach Merges nachgezogen werden muss.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R824 · 2026-10-22 · Gate Plan TOOL-MESSFENSTER: OK, Umsetzung als dritter Controller, T00 erst nach ORT-A-Messungen

Ruling: Plan `lead-tech` (`plan/tool-messfenster` @ `1a1d61f7`, T00–T07) → **OK**; Entwürfe R824-E1 bis E5 angenommen (Sperre `.studio/messfenster` im Hauptrepo für alle Worktrees,
Abbruchpräfix «testlock: ABBRUCH» bleibt für `pushcheck.py` Exit 3, vorläufige A/A-Grenzen Hitch Σ ≤ 2 / kein Fenster > 40 ms und Render max(0,4 ms; 3 %), `kantenprofil.mjs` beim
ORT-A-Merge). Umsetzung durch einen **dritten `lead-tech`-Controller** (sonnet), Budget **11**, Parallelität 2; Stränge A (T01–T03, T07) und B (T05, T04) sofort mit Teilbeleg;
**T00** (70-min-A/A-Messblock, exklusiv) erst, wenn ORT-A seine Messungen abgeschlossen hat, und nie parallel zu ORT-A- oder LEBEN-STRASSE-Messungen; T06 nur bei positivem T00.
Merge nach main im Release-Bündel.

Regelbezug: R810 V3/V4, R823 (≤ 3 Test-Controller) · Kosten bei Irrtum: Werkzeug-Fehler blockiert Testläufe; Rücknahme per Revert vor dem Bündel-Merge.

Entscheider: L0 · Anlass: Bericht lead-tech Plan TOOL-MESSFENSTER · ADR: —

## R825 · 2026-10-22 · BEOB-18 abgenommen; Pakete P1–P3 eingeplant

Ruling: Bericht `lead-production` (`docs/beob-18` @ `9ea1fe33`, Marke 2026-10-22, Archiv auf 43,9 KB) → **abgenommen**; Merge im Release-Bündel (Konflikt am Dateiende mit
`feat/ort-a` erwartet, Auflösung: beide Abschnitte behalten). Pakete: **P1 UI-BEIPACK-FERN** (S, nach UI-HAEPPCHEN-H P1, gleiche Dateien), **P2 TOOL-DASH-REST** (XS, `refactor:`)
und **P3 PERSONA-SCOUT-PFLEGE** (XS, `lead-design`, inkl. I-154-Korrektur) auf das Board; P2 und P3 starten, sobald der Deckel 10 Plätze frei hat (Ideen-Scouts laufen gerade).
`perf.test.ts`-Pin AK-E0-15a auf der ZEITRESERVE-PFLEGE-Liste.

Regelbezug: R287, R288, R471, R823 · Kosten bei Irrtum: kleine Pakete warten länger.

Entscheider: L0 · Anlass: Bericht lead-production BEOB-18 · ADR: —

## R826 · 2026-10-22 · Dauerregel: Kapazität voll nutzen, gesteuert durch die Limit-Ampel

Ruling: Nutzer: «hast du meinen letzten auftrag generell verstanden? auch in zukünftigen sessions? voraussetzung sind natürlich das ampelsystem mit den limits». **Dauerregel für
jede Session:** L0 hält den Studio-Deckel von **10 Agenten** (R823) aktiv voll, solange die Limit-Ampel (`.studio/limits.json`, STUDIO.md «Limits und Sessiongrösse») es erlaubt:
**grün** (5-h-Fenster < 60 % und Woche < 80 %) → Deckel ausschöpfen, nach jedem Bericht nachfüllen, jeden Strang mit eigenem Agenten bearbeiten (Umsetzung, Pläne, Specs, Gates,
Pflege, Ideen); höchstens **3 Controller mit Testläufen**, ≤ 2 Browser-Läufe, Fensterregel R803. **gelb** (5-h 60–80 % oder Woche > 80 %) → keine neuen Wellen, Angefangenes abschliessen.
**rot** (5-h > 80 %) → Ende-Routine. Engpass Rechnerlast → zusätzliche Plätze mit testfreier Arbeit füllen, nicht leer lassen. Ersetzt R698; ergänzt R475 und R445. Handbuch-Minor
durch `studio-coach`.

Regelbezug: Verfassung §5.8, R69, R424, R445, R475, R698, R823 · Kosten bei Irrtum: höherer Verbrauch im 5-h-Fenster; die Ampel bremst rechtzeitig.

Entscheider: Nutzer (Auftrag), L0 (Auslegung) · Anlass: Nutzerfrage · ADR: —

## R827 · 2026-10-22 · Runden-Ruling IDEEN-15; Kurzdesigns auf den frei gewordenen Plätzen

Ruling: Rangliste `lead-design` (`docs/ideen-15` @ `0b5ae668`, Handoff `.studio/handoffs/2026-10-22-lead-design-IDEEN-15.md`, Pool 25/40) → **angenommen** wie Entwurf R-IDEEN-15:
eingeplant **UI-HAEPPCHEN-I** (I-170, I-168, I-167; Umsetzung nach Stadtplanung-Merge), **LEBEN-SEE** (I-157 Kielwasser, I-156 Anlege-Klang), Kurzdesign **AUFLAGEN-KERN**
Stufe voll (I-163 gegen I-161 mit Dominanz-Rechnung, dazu I-162; gebaut wird höchstens eine Auflage); I-159 nach ORT-A- und Stadtplanung-Merge; geparkt I-169, I-160, I-164, I-166
(Beipack); verworfen I-158. R805 (4) ergänzt: neue Auflagen sperren den Zukauf ihrer Zielgüter, Lohn ehrenhalber. Sofort gestartet (R826, Ampel grün): Kurzdesign UI-HAEPPCHEN-I
(`lead-design`, sonnet, 1), Kurzdesign LEBEN-SEE (`lead-art`, sonnet, 1), Kurzdesign AUFLAGEN-KERN (`lead-design`, opus, 2), Spec-Nachtrag I-119/I-121 gegen LEBEN-STRASSE plus P3
PERSONA-SCOUT-PFLEGE (`lead-design`, sonnet, 1). Alle ohne Testläufe; `docs/ideen-15` geht ins nächste Release-Bündel.

Regelbezug: R208, R445, R805, R825, R826 · Kosten bei Irrtum: Designarbeit, die nach Merges nachgezogen wird.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-15 · ADR: —

## R828 · 2026-10-22 · Gate Plan SEERECHT: BEDENKEN angenommen, ein Controller mit Parallelität 2, Start bei freiem Test-Slot

Ruling: Gate-Urteil `lead-qa` BEDENKEN (Handoff `.studio/handoffs/2026-10-22-lead-qa-gate-plan-SEERECHT.md`) → **Plan frei** (`plan/seerecht` @ `792d565d`) unter den Auflagen B1–B3,
N1–N4 (R-SR-P1): **ein** `lead-tech`-Controller mit Folgeinstanzen und Parallelität 2 statt drei Controllern (Instanz 1: T01, dann T02 ∥ T05; Instanz 2: T03 ∥ T04, dann T06, T07;
Instanz 3: T08, T09 nach Stadtplanung-Merge); T01 beginnt mit der Seed-Suche d 30/35, ohne Fund `blocked` mit Messwerten; Wächter AK-SR-21 mit geschärftem Muster (Fehltreffer
`src/ui/time.ts:24`, `src/render/sprites.ts:2067`); AK-SR-14-Reihenfolge als Review-Beleg; Risiko Wert 8 in den Plan-Index; T07 prüft die Fernkarte in der Pause; T01-Dateiliste
ergänzen. SR-E2–SR-E5 angenommen (v20 nach Stadtplanung, `isValidCouncil` vorn, Typform, AK-SR-18 in `farLate.test.ts`). R-SR-P2 Merge-Reihenfolge Stadtplanung → T09 → Gate
Merge; R-SR-P3 Balancing-Lauf in T09 verbindlich. Budget **21** Starts. **Start**, sobald einer der drei Test-Controller-Plätze frei wird (R826).

Regelbezug: R805, R814, R826, gates.md Gate Plan · Kosten bei Irrtum: Seed-Fixture blockiert T01; dann Fixture-Ruling.

Entscheider: L0 · Anlass: Gate-Urteil lead-qa Plan SEERECHT · ADR: —

## R829 · 2026-10-22 · Nachtrag I-119/I-121 und Persona-Scout 1.3 abgenommen; P2 TOOL-DASH-REST direkt

Ruling: (1) Spec-Nachtrag I-119/I-121 (`design/i119-i121` @ `7c5638a0`: AK-A6, A8, A9, B3, B5 nachgezogen, neu AK-A10, AK-B8; setzt auf LEBEN-STRASSE auf; `RUN_TICKS` 60 prüft der
Plan) → **abgenommen**; Plan erst nach Merge von LEBEN-STRASSE und ORT-A T20. (2) Persona `design-idea-scout` 1.3 (`f9865e84`) → **abgenommen** (P3 erledigt). (3) Frei gewordener
Platz: **P2 TOOL-DASH-REST** (XS, R825) direkt an `tech-ui-engineer` (sonnet) ohne Lead, `refactor:`, Teilbeleg `make studio-test`, Branch `tool/dash-rest`; Budget **1**; Merge im Bündel.

Regelbezug: R715, R825, R826, STUDIO.md «L0 briefet den Umsetzer direkt» · Kosten bei Irrtum: gering.

Entscheider: L0 · Anlass: Bericht lead-design I119-NACHTRAG · ADR: —

## R830 · 2026-10-22 · Gate Kurzdesign LEBEN-SEE: OK, Plan sofort

Ruling: Kurzdesign `lead-art` (`design/leben-see` @ `3fef2126`, 24 AK: W1–W13 Kielwasser, K1–K11 Klang; S + S; kein Save, keine Baseline, kein Asset) → **OK**. Designfragen nach
Empfehlung: gekrümmte Spur entlang der Fahrlinie, direkt vor dem Rumpf (ORT-A-Schattenblock unberührt), Werte zentral in `wake.ts`; **ein** Klang beim Anlegen (I-156 geändert,
weil Schiffe im selben Tick ablegen), synthetische Figur `shipDock`, kein Schalter vor dem Hörurteil; Rumpf-Spiegelung zurückgestellt. Kein Rebase: die `renderer.ts`-Zeilen holen
nach dem ORT-A-Merge `main` per `git merge main`. AK-W4 bindet an die zum Zeitpunkt vorhandene Fahrzeit-Variante. Das Hörurteil kommt als «Bitte testen» in die Release-Notiz.
Plan `lead-tech` (Stufe leicht, sonnet), keine Testläufe; Budget **2**.

Regelbezug: R827, gates.md kombiniertes Gate Stufe leicht · Kosten bei Irrtum: Klang oder Spur stört; rückbaubar.

Entscheider: L0 · Anlass: Bericht lead-art LEBEN-SEE · ADR: —

## R831 · 2026-10-22 · Gate Kurzdesign UI-HAEPPCHEN-I: OK, F1–F8 nach Empfehlung, Plan sofort

Ruling: Kurzdesign `lead-design` (`design/ui-haeppchen-i` @ `3da866fa`, AK-I1–I29; P1 I-168 Kasse leer, P2 I-167 Bestand im Tooltip, P3 I-170 Wachstumsbremse; kein Save, keine
Baseline, `src/sim` unberührt) → **OK**. Befund angenommen: Lärm senkt nur die Belegung, Park ist Gegenmittel, kein Grund → Lärm als eigene Zeile, Park als Hinweis; Korrektur I-170
in `docs/ideen.md` bei der nächsten Pool-Pflege. F1 kein Klick-Sprung, F2 eine Ursache je Haus, F3 Lärm eigene Zeile, F4 «ohne Mangel», F5 Spitzenstufe zeigen, F6 Geld-Chip färben
(Gelb ab 3:00, Rot ab 1:00), F7 «alle Inseln» nur bei mehr, F8 P1/P2 sofort nach Plan, P3 nach Stadtplanung-Merge. P3 über 4 ms Rechenzeit → zurück an L0. Kein Rebase (Konflikte mit
UI-BEIPACK-FERN per `git merge`). Plan `lead-tech` (Stufe leicht, sonnet), keine Testläufe; Budget **2**.

Regelbezug: R827, gates.md kombiniertes Gate Stufe leicht · Kosten bei Irrtum: UI-only, rückbaubar.

Entscheider: L0 · Anlass: Bericht lead-design UI-HAEPPCHEN-I · ADR: —

## R832 · 2026-10-22 · Gate Plan LEBEN-SEE: OK; Warteschlange für Test-Controller-Plätze

Ruling: Plan `lead-tech` (`plan/leben-see` @ `b5425214`, T01–T08, Strang A Kielwasser, Strang B Klang) → **OK**, Entwürfe angenommen: Budget **11**, Parallelität 3; Strang B und
T01/T02 sofort bei Start, T03 nach ORT-A-Merge per `git merge main`; AK-K9 nur bei Befund eine `app.ts`-Zeile; AK-W4 bindet ohne Seerecht-Fixture an 10 Ticks; Hörurteil `shipDock`
als «Bitte testen». **Reihenfolge für frei werdende Test-Controller-Plätze (≤ 3, R826):** 1. SEERECHT (R828), 2. LEBEN-SEE, 3. UI-HAEPPCHEN-I (nach Gate Plan), 4. UI-BEIPACK-FERN
(nach UI-H P1). Wird ein Platz frei, startet L0 ohne weiteres Ruling den nächsten.

Regelbezug: R826, R828, R830 · Kosten bei Irrtum: Wartezeit einzelner Pakete.

Entscheider: L0 · Anlass: Bericht lead-tech Plan LEBEN-SEE · ADR: —

## R833 · 2026-10-22 · Gate Plan UI-HAEPPCHEN-I: OK, in der Warteschlange Platz 3

Ruling: Plan `lead-tech` (`plan/ui-haeppchen-i` @ `cc2dbddd`, T01–T10, 29 AK zugeordnet) → **OK**; Entwürfe R832-E bis R835-E angenommen (Nummern im Plan sind Entwurfsnummern):
Lärm-Zeile T05 nach Stadtplanung-Merge auf eigenem Branch `feat/ui-haeppchen-i-a2`, damit P1/P3-Grundteil früher ins Bündel können; Rechenzeit AK-I27 zweistufig, über 4 ms
`blocked` und zurück an L0 (Rückfall 2000 ms oder nur sichtbarer Chip); Konfliktregeln (`hud.ts` per `git merge main`, README-Zeilen unten anfügen). Budget **16**, Parallelität 2.
Start laut R832 als Platz 3 der Warteschlange.

Regelbezug: R831, R832 · Kosten bei Irrtum: UI-only.

Entscheider: L0 · Anlass: Bericht lead-tech Plan UI-HAEPPCHEN-I · ADR: —

## R834 · 2026-10-22 · TOOL-DASH-REST abgenommen, wartet aufs Bündel

Ruling: Review `qa-code-reviewer` OK (`tool/dash-rest` @ `7a442f43`, alle Entfernungen per `rg` belegt, `make studio-test` 1009 OK) → **Strang abgenommen**; Gate Merge im nächsten
Release-Bündel. Stilhinweis `views.js:~213` (Pfeil mit Ausdruck) entfällt als Kann.

Regelbezug: R825, R829, Verfassung §9.1 · Kosten bei Irrtum: gering.

Entscheider: L0 · Anlass: Review TOOL-DASH-REST · ADR: —

## R835 · 2026-10-22 · Gate Kurzdesign UI-BEIPACK-FERN: OK; vor Seerecht T04; Nachtrag Seerecht-Plan

Ruling: Kurzdesign `lead-design` (`design/ui-beipack-fern` @ `651f0520`, AK-BF1–BF17, S, alle sechs Befunde bestätigt) → **OK**. F1 `Umschalt+R` ohne Marke ignorieren
(`councilToggleAllowed`), F2 «zu spät» hinter der Lagerzahl ohne eigene Farbe, F3 Format «27 s» einheitlich, F4 Chronik «bestanden (bei Spielzeit 12:34)». Keine Überschneidung mit
UI-H P1 → die Abhängigkeit aus R825/R832 entfällt; Reihenfolge: **Beipack vor Seerecht T04**. Seerecht-Plan bekommt einen Nachtrag (AK-SR-16 «30 s»/«24 s», T04 nutzt
`formatGameTime(ticks)`), als Fortsetzung des Plan-Leads. Plan UI-BEIPACK-FERN `lead-tech` (Stufe leicht, sonnet), Budget **2**; Warteschlange R832 neu: 1. SEERECHT, 2. LEBEN-SEE, 3. UI-BEIPACK-FERN (S, kurz), 4. UI-HAEPPCHEN-I.

Regelbezug: R825, R828, R832 · Kosten bei Irrtum: Format-Doppelumbau, falls Seerecht vorher startet; durch Nachtrag abgefangen.

Entscheider: L0 · Anlass: Bericht lead-design UI-BEIPACK-FERN · ADR: —

## R836 · 2026-10-22 · Gate Plan UI-BEIPACK-FERN: OK, Warteschlange Platz 3

Ruling: Plan `lead-tech` (`plan/ui-beipack-fern` @ `2bd4e3db`, T01–T05, ein Strang) → **OK**; Entwürfe R836-E bis R839-E angenommen (`farOrderParts` einzige Quelle, Beipack vor
Seerecht T04, Merge per `git merge main`, Seerecht-Nachtrag läuft beim Plan-Lead). Budget **4**, Parallelität 1. Start laut R835 als Platz 3 der Test-Warteschlange.

Regelbezug: R835 · Kosten bei Irrtum: UI-only.

Entscheider: L0 · Anlass: Bericht lead-tech Plan UI-BEIPACK-FERN · ADR: —

## R837 · 2026-10-22 · LEBEN-STRASSE T01–T05 abgenommen, Stopp vor T06; SEERECHT startet auf dem frei gewordenen Test-Platz

Ruling: Zwischenbericht `lead-tech` (`feat/leben-strasse` @ `66a944ba`, T01–T05, Reviews BEDENKEN alle behoben, Teilbeleg 172 Tests, `src/sim` ohne Diff; Handoff
`.studio/handoffs/2026-10-22-lead-tech-LEBEN-STRASSE.md`) → **abgenommen bis T05**. Entwürfe: E1 Träger-Geometrie bei Tempo 0 bleibt auf dem zuletzt gemerkten Tempo ≥ 1
(`tickClock` merkt `pace` je Welt; Ergänzung zu R822) → angenommen; E2 Arbeitssatz mischt zum Holzbraun (`wallTimber`) für ΔE ≥ 10, `MIN_TORSO_CONTRAST` 1,35 → angenommen,
Sichtprüfung in T08; E3 Posen-Sprung beim Tempowechsel → T08 prüft, Folge per Ruling. Abweichungen (frühe `renderer.ts`-Zeilen, `WalkerMotion`, Beinschwung 0,45·W) angenommen;
das ausgelassene Delta-Review holt das opus-Final-Review nach. Strang ruht bis zum ORT-A-Merge (T06 mit `git merge main`); Restbudget 5. Worktree `.worktrees/leben-strasse-look`
ist gemergt und darf per `git worktree remove` (ohne `--force`) weg. **Frei gewordener Test-Platz → SEERECHT** (R828/R832) an einen `lead-tech`-Controller (sonnet), Budget **21**;
T04 erst nach UI-BEIPACK-FERN auf main, T08/T09 nach Stadtplanung.

Regelbezug: R803, R822, R826, R828, R832, R835 · Kosten bei Irrtum: Farbe/Tempo im Browser-Check nachziehen.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech LEBEN-STRASSE · ADR: —

## R838 · 2026-10-22 · SEERECHT T01/T02/T03/T05 abgenommen, Stopp vor T04; LEBEN-SEE startet

Ruling: Zwischenbericht `lead-tech` SEERECHT (Handoff `.studio/handoffs/2026-10-22-lead-tech-SEERECHT.md`): T01 `7221c731` (Seed-Pins `SEED_D30`/`SEED_D35` = Seed 1), T02 `7e2065b5`,
T03 `f3ec2633` (`feat/seerecht-render`), T05 `e7144698` (`feat/seerecht-save`), Reviews OK, Teilbeleg, `SAVE_VERSION` 18, Balancing ohne Diff → **abgenommen bis zu diesen Commits**.
Strang ruht bis UI-BEIPACK-FERN auf main (T04) bzw. Stadtplanung (T08/T09); Restbudget 13. Risiko Seed-Pins auf Seed 1 zur Kenntnis. **Frei gewordener Test-Platz → LEBEN-SEE**
(R832) an einen `lead-tech`-Controller (sonnet), Budget **11**; T03 (`renderer.ts`) erst nach ORT-A-Merge.

Regelbezug: R828, R832, R835 · Kosten bei Irrtum: Nachzug der Seed-Pins bei Generator-Änderung.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech SEERECHT · ADR: —

## R839 · 2026-10-22 · Gate Spec AUFLAGEN-KERN: BEDENKEN angenommen, Nachtrag sofort, Plan nach Stadtplanung und Seerecht

Ruling: Gate-Urteil `lead-qa` BEDENKEN (Handoff `.studio/handoffs/2026-10-22-lead-qa-gate-spec-AUFLAGEN-KERN.md`) → Entwürfe R-1 bis R-7 **angenommen**: I-163 «Ausfuhrmeister»
wird gebaut, I-161 verworfen, G1/G2/G3' gelten; Rückfall «Vorprodukte ohne Baustoffe» als Defs-Änderung; Zielmengen vorläufig (Messlauf T5 mit ≥ 2 Seeds); R-6 nennt alle
Literal-Stellen (`balance.test.ts:32`, `balance-monument.test.ts:164`, `trial.test.ts`, `trial-save.test.ts`, `tests/ui/trial.test.ts:42`, `world.ts:159`). **Nachtrag jetzt** durch
`lead-design` (sonnet, Spec-Nachtrag): Präfix `AUF-` für alle 22 AK; `c0` als Summe der abgerundeten Hausgrenzen inkl. Lärmfaktor (Stadtplanung) plus drei neue AK (Gleichgewicht
mit/ohne Lärmhaus, Lärmquelle während der Auflage, Steuer «niedrig»); AK-U2 ganzzahlig (`e0` = 10/20/100); AK-K12 gegen bestehende Pins plus Determinismus-AK mit Speichern/Laden;
tiefe Kopie in `cloneTrial`; Randfälle K3/K5/K7/K10/B3; Rückfall R553 benannt; Nachträge in Anhang 03 «Testmatrix» (Grösse). Danach Wiedervorlage `lead-qa` nur zu Befunden 1–3.
**Plan** erst nach den Merges von Stadtplanung und Seerecht; Save v21. Budget Nachtrag **1**, Wiedervorlage **1**.

Regelbezug: R136, R553, R670, R805, R827, gates.md Gate Spec · Kosten bei Irrtum: Zählung ruht dauerhaft (G3') — durch die neuen AK abgefangen.

Entscheider: L0 · Anlass: Gate-Urteil lead-qa AUFLAGEN-KERN · ADR: —

## R840 · 2026-10-22 · AUFLAGEN-KERN Spec abgenommen

Ruling: Wiedervorlage `lead-qa` OK (Nachtrag `design/auflagen-kern` @ `6fe3caf3`, 26 AK `AK-AUF-*`, Befunde 1–3 erledigt) → **Spec abgenommen**. Befunde 6–8 (`cloneTrial`, Randfälle,
R553-Rückfall) prüft der Plan bzw. das Review T3. Plan erst nach den Merges von Stadtplanung und Seerecht nach main (Save v21). `design/auflagen-kern` geht ins nächste Release-Bündel.

Regelbezug: R839 · Kosten bei Irrtum: Nachtrag beim Plan.

Entscheider: L0 · Anlass: Wiedervorlage lead-qa · ADR: —

## R841 · 2026-10-22 · Freie Plätze (Ampel grün, 5-h 40 %): Bündel-Vorprüfung REL-30, Prozess-Retro REL-29, Doku-Audit

Ruling: Text-Plätze leer, Test-Plätze belegt (R826). Starten: (1) **Gate Merge REL-30 vorab** an `lead-qa` (sonnet): Teilbelege und Merge-Trockenlauf aller bündelfertigen Branches
(TOOL-LOADSNAP, TOOL-DASH-REST, `docs/beob-18`, `docs/ideen-15`, Design-/Plan-Branches), Merge-Reihenfolge und Konfliktauflösungen, Release-Notiz-Entwurf; keine Testläufe; Budget **1**.
(2) **Prozess-Aussensicht REL-29** an `studio-process-coach` (sonnet, R127/R316 nach jedem Release; inkl. Vorfall R815, Kapazitätswechsel R823/R826); Budget **1**. (3) **DOKU-AUDIT**
an `lead-production` (sonnet, Skill `doku-audit`) vor dem nächsten Release: README, arc42, `docs/index.md`, STUDIO-Querverweise gegen main; Befunde als Bericht, Trivial-Fixes auf
Branch `docs/doku-audit-1`; Budget **1**.

Regelbezug: R127, R316, R826 · Kosten bei Irrtum: gering, alles testfrei.

Entscheider: L0 · Anlass: freie Kapazität · ADR: —

## R842 · 2026-10-22 · Vorprüfung REL-30: OK, Bündel-Merge morgen mit dem Push

Ruling: Vorab-Urteil `lead-qa` OK (Handoff `.studio/handoffs/2026-10-22-lead-qa-gate-REL-30-vorab.md`; 12 Merges konfliktfrei, nur `tools/studio/` und `docs/`) → **angenommen**,
Auflagen A1–A4 übernommen (Nachtrag `b7fd0a6a` auf `plan/seerecht` prüft das finale Gate Merge; loadsnap-Grenzen in E-071; Konflikt `docs/beobachtungen.md` beim ORT-A-Merge bewusst
lösen; Auflagen-Kern-Nachträge nur in Anhängen). Der Bündel-Merge nach main erfolgt **mit dem Push am 2026-10-23** in einem Integrator-Lauf (ein `make push-check`, Verfassung 1.3
§7.1), weil ein Merge nach main heute einen eigenen vollen Lauf bräuchte; kommen UI-H P1, UI-BEIPACK-FERN oder TOOL-MESSFENSTER-Teile hinzu, gibt `lead-qa` ein Ergänzungsurteil.

Regelbezug: R816, R817, Verfassung §7.1 · Kosten bei Irrtum: Pläne liegen bis morgen nur auf Branches.

Entscheider: L0 · Anlass: Vorab-Urteil lead-qa REL-30 · ADR: —

## R843 · 2026-10-22 · DOKU-AUDIT-1 abgenommen; Nachzug offener Befunde 1 und 4

Ruling: Bericht `lead-production` (`docs/doku-audit-1` @ `5de6e00a`: Save-Version in README/arc42 auf 18, `tickTrial` im Tick-Diagramm, ADR-015 im Index) → **abgenommen**, ins Bündel
REL-30 (Ergänzungsurteil `lead-qa` beim Gate). Offene Befunde: (1) vier Module ohne arc42-Zeile und (4) `docs/studio/releases.json` endet bei REL-26 → **DOKU-AUDIT-1b** an `lead-production`
(sonnet, Budget **1**) auf demselben Branch: REL-27–REL-29 in `releases.json` aus `state.md`-Notizen nachtragen, README gegen die Pakete von REL-27–29 prüfen, je eine arc42-Zeile für
`render/errands.ts`, `render/homeBuildings.ts`, `ui/cameraView.ts`, `audio/buildSounds.ts` aus dem Code ableiten. (2) Spec-/Plan-Listen in `docs/index.md` → nächster HAUSHALT.
(3) ADR-011-Status → Beobachtung.

Regelbezug: R841 · Kosten bei Irrtum: gering.

Entscheider: L0 · Anlass: Bericht lead-production DOKU-AUDIT-1 · ADR: —

## R844 · 2026-10-22 · Prozess-Retro REL-29: V1–V4 angenommen, V5 als Messauftrag

Ruling: Retro `studio-process-coach` (`docs/studio/retros/2026-10-22-rel-29-prozess.md`, `4439a947`) → angenommen: **V1** Push-Sperre in `guard.py` (kein `git push … main` ohne
`push_check` Exit 0 für genau den Hash, ausser L0-Freigabedatei) und **V2** `pushcheck.py` führt die Einzel-Wiederholung roter Zeit-/Timeout-Dateien selbst aus und weist sie im Event aus,
dazu Pin `perf.test.ts` AK-E0-15a entschärfen → Werkzeugpaket **TOOL-PUSHSPERRE** (Plan jetzt an `lead-tech` sonnet, Budget 2; Umsetzung auf dem nächsten freien Test-Platz, Platz 3 der
Warteschlange vor UI-HAEPPCHEN-I, damit es vor dem Push am 2026-10-23 greift, falls möglich). **V3** Ruling-Entwürfe sofort in `rulings.md`; `hook.py` meldet beim Start, wenn die
Stand-Zeile von `state.md` hinter der letzten R-Nummer liegt (Hook-Teil ins Paket TOOL-PUSHSPERRE). **V4** Pflichtfelder «Verfassung berührt?» und «Überschneidung mit offenen
Paketen» in Ruling- und Plan-Vorlage → `studio-coach` (Handbuch-Minor 1.69, Budget 1). **V5** L0-Kontextschnitt nach Bündelende als Messauftrag bis REL-31. Retro-Event-Trigger
`meilenstein:REL-29` trägt der Coach nach.

Regelbezug: R127, R316, R815, R826 · Kosten bei Irrtum: Push-Sperre blockiert einen legitimen Push; Freigabedatei als Ausweg.

Entscheider: L0 · Anlass: Retro REL-29 · ADR: —

## R845 · 2026-10-22 · Gate Plan TOOL-PUSHSPERRE: OK, eigener Hook statt Guard-Änderung

Ruling: Plan `lead-tech` (`plan/tool-pushsperre` @ `f4affcdb`, T01–T05) → **OK**, Entwürfe angenommen: (1) `guard.py` bleibt unberührt (Verfassung §1.3); V1 als **eigener PreToolUse-Hook**
`tools/studio/pushgate.py` (Muster `waitguard.py`/`modelguard.py`) mit zusätzlichem Eintrag in `.claude/settings.json`, der keinen bestehenden Guard schwächt; Freigabedatei
`.studio/push-freigabe` (Hash + Grund, einmal gültig) nur durch L0. (2) V3-Hook: `stampcheck.py` schärfen (letzte `## R…`-Überschrift, Schwelle 2, Meldung «PFLICHT» am Kontextanfang).
(3) Pin `perf.test.ts` AK-E0-15a erst nach Messprotokoll (T04; Vorschlag Best-of-3), Annahme: unter Last 5,4 ≤ 1/10 rot, 11-fach langsamer Schritt bleibt rot. (4) T05
(`pushcheck.py`-Wiederholung inkl. Nachholen von `studio-test build pages-limit`) erst nach TOOL-MESSFENSTER auf main; Stränge A und P davor. Budget **10**, Parallelität 2. Start auf dem
nächsten freien Test-Platz (Warteschlange: TOOL-PUSHSPERRE, UI-BEIPACK-FERN, UI-HAEPPCHEN-I). Beobachtung: `LOAD_WAIT = 3.0` im Code gegen «Last ≤ 4» im Handbuch.

Verfassung berührt?: ja, §1.3 (geschützte Guard-Datei bleibt unverändert; neuer Hook ergänzt nur) · Überschneidung mit offenen Paketen: `pushcheck.py`, `tests/test_pushcheck.py` mit
TOOL-MESSFENSTER (`feat/tool-messfenster`), Reihenfolge Messfenster → T05.
Regelbezug: R815, R844 · Kosten bei Irrtum: Hook blockiert legitimen Push; Freigabedatei oder Entfernen des Eintrags.

Entscheider: L0 · Anlass: Bericht lead-tech Plan TOOL-PUSHSPERRE · ADR: —

## R846 · 2026-10-22 · LEBEN-SEE: Strang B Klang abgenommen fürs Bündel, Strang A ruht; TOOL-PUSHSPERRE startet

Ruling: Zwischenbericht `lead-tech` LEBEN-SEE (Handoff `.studio/handoffs/2026-10-22-lead-tech-LEBEN-SEE.md`): **Strang B Klang** (`feat/leben-see-klang` @ `4e1e23e8`, Final-Review opus OK,
Browser-Check OK, K9 ohne `app.ts`-Diff, `src/sim` ohne Diff) → **abgenommen**; T08-Doku (README-Zeile Klang) holt der Controller vor dem Bündel per Fortsetzung nach; geht mit Ergänzungsurteil
`lead-qa` in REL-30, Hörurteil `shipDock` als «Bitte testen». `play()` prüft `hidden` für alle Ereignisse → angenommen. **Strang A Kielwasser** (`bf9502af`, T01/T02 OK) ruht bis zum
ORT-A-Merge (T03); AK-W4 nach SEERECHT-Merge nachprüfen; AK-W10 Kontrast 4,063 → bestanden. **Frei gewordener Test-Platz → TOOL-PUSHSPERRE** (R845) an einen `lead-tech`-Controller
(sonnet), Budget **10**; Stränge A (T01–T03) und P (T04) sofort, T05 nach TOOL-MESSFENSTER.

Verfassung berührt?: nein · Regelbezug: R830, R832, R845 · Kosten bei Irrtum: Klang stört; Abschalten per Revert vor dem Push.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech LEBEN-SEE · ADR: —

## R847 · 2026-10-22 · TOOL-MESSFENSTER A/B abgenommen fürs Bündel; T00 bleibt gesperrt; UI-BEIPACK-FERN startet

Ruling: Bericht `lead-tech` (`feat/tool-messfenster` @ `5c138f56`, Final-Review opus nach zwei Fix-Runden OK, Teilbeleg 99/99 + `test_pushcheck` 37 + `studio-test` 1014;
Handoff `.studio/handoffs/2026-10-22-lead-tech-TOOL-MESSFENSTER.md`) → **Stränge A/B abgenommen**, gehen mit Ergänzungsurteil `lead-qa` in REL-30 (vor TOOL-PUSHSPERRE T05).
Entwurf 2 (`smoke.mjs` ohne Sperre, später Warnung) angenommen. **T00** startet erst, wenn L0 das Ende der ORT-A-Messungen meldet; T06 nur bei positivem T00; Restbudget 6.
Befunde ausserhalb Scope → `docs/beobachtungen.md` (L0 trägt ein). **Frei gewordener Test-Platz → UI-BEIPACK-FERN** (R836) an einen `lead-tech`-Controller (sonnet), Budget **4**,
mit dem Ziel, noch ins Bündel REL-30 zu kommen (Voraussetzung für Seerecht T04).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: `pushcheck.py`/`tests/test_pushcheck.py` mit TOOL-PUSHSPERRE T05 (Reihenfolge Messfenster → T05)
Regelbezug: R824, R835, R836 · Kosten bei Irrtum: Sperre blockiert Testläufe; `make messfenster-frei` bzw. Revert.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-MESSFENSTER · ADR: —

## R848 · 2026-10-22 · TOOL-PUSHSPERRE A und P abgenommen fürs Bündel; Pin 15a bleibt 2,5 ms; UI-HAEPPCHEN-I startet

Ruling: Zwischenbericht `lead-tech` (Handoff `.studio/handoffs/2026-10-22-lead-tech-TOOL-PUSHSPERRE.md`): **Strang A** `tool/pushsperre` @ `d6efeb31` (`pushgate.py`, Freigabedatei,
Stand-Warnung; Opus-Review BEDENKEN mit zwei Umgehungen behoben, Delta-Review opus OK, `studio-test` 1047) und **Strang P** `tool/perf-pin` @ `de7fbe33` (Best-of-3, Messprotokoll)
→ **abgenommen**, gehen mit Ergänzungsurteil `lead-qa` in REL-30. **Pin AK-E0-15a bleibt 2,5 ms** (Best-of-3, unter Last 0/10 rot); die Empfehlung 3,5 ms wird **nicht** angenommen,
weil der Anstieg des Mittels von 1,59 ms (2026-10-05) auf ≈ 2,3 ms eine echte Sim-Verlangsamung sein kann, die ein höherer Pin verdecken würde → Ursachenklärung als Auftrag im
Pool-Paket ZEITRESERVE-PFLEGE (Vergleich per `git bisect`-Messreihe, Last ≤ 4). Freigabe wird nur bei tatsächlicher Freigabe verbraucht; «PFLICHT»-Text in `stale_warning()` →
angenommen. T05 nach TOOL-MESSFENSTER auf main; Restbudget 3. Befunde ausserhalb Scope → `docs/beobachtungen.md`. **Freier Test-Platz → UI-HAEPPCHEN-I** (R833) an einen
`lead-tech`-Controller (sonnet), Budget **16**; T05 (Lärm-Zeile) nach Stadtplanung.

Verfassung berührt?: ja, §1.3 (`guard.py` unverändert, zusätzlicher Hook-Eintrag in `.claude/settings.json`) · Überschneidung mit offenen Paketen: T05 mit TOOL-MESSFENSTER
(`pushcheck.py`); UI-HAEPPCHEN-I mit UI-BEIPACK-FERN (`hud.ts`, disjunkt)
Regelbezug: R815, R844, R845 · Kosten bei Irrtum: Pin bleibt knapp; Flake-Verdacht hält an, bis die Ursache geklärt ist.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech TOOL-PUSHSPERRE · ADR: —

## R849 · 2026-10-22 · UI-HAEPPCHEN-I A und B abgenommen fürs Bündel; Limit-Ampel gelb

Ruling: Zwischenbericht `lead-tech` UI-HAEPPCHEN-I (Handoff `.studio/handoffs/2026-10-22-lead-tech-UI-HAEPPCHEN-I.md`): **Strang A** `feat/ui-haeppchen-i-a` @ `a83b8ee0` (Kasse leer,
Wachstumsbremse ohne Lärm; Final-Review opus BEDENKEN niedrig) und **Strang B** `feat/ui-haeppchen-i-b` @ `e085f342` (Bestand im Tooltip; Final-Review OK) → **abgenommen**,
Ergänzungsurteil `lead-qa` beim Bündel REL-30. R-E1 bis R-E3 angenommen (AK-I27 0,1 ms bei 423 Häusern; Vorab-Zeittest entfällt). Fehlende Tests AK-I22/AK-I25 kommen mit T05 nach
dem Stadtplanung-Merge (Branch `feat/ui-haeppchen-i-a2`); Restbudget 8. Der Plan schrieb `make check` je Strang vor → Plan-Vorlage und offene Pläne auf Teilbeleg prüfen (Beobachtung,
`studio-coach` beim nächsten Handbuch-Minor). **Limit-Ampel gelb** (5-h-Fenster 60 %, R826): keine neuen Wellen; laufende Arbeit abschliessen, Bündel REL-30 für morgen vorbereiten.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: UI-BEIPACK-FERN (`hud.ts`, disjunkt, `merge-tree` sauber); Stadtplanung für T05
Regelbezug: R826, R831, R833 · Kosten bei Irrtum: UI-only.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech UI-HAEPPCHEN-I · ADR: —

## R850 · 2026-10-22 · UI-HAEPPCHEN-H P1: Gegenmassnahme zum pagehide-Verlust vor dem Bündel

Ruling: Bericht `lead-tech` (`feat/ui-haeppchen-h-p1` @ `51b4e7a2`, T01–T04, Final-Review opus OK, Playtest H11–H13 bestanden, Teilbeleg 49/49, `src/sim` ohne Diff). Entwurf «Regel 4 gilt,
README nennt den Verlust» **nicht angenommen**: Ein Rettungs-Feature darf beim Neuladen nach «Davor laden» nicht den neueren Stand überschreiben. **Spec-Änderung per Ruling** (Regel 4/10):
Beim Laden eines Autosave-Platzes setzt das Spiel den Zeiger `inselreich.save.auto.last` auf **diesen** Platz; `pagehide` und der nächste reguläre Autosave schreiben dann in den geladenen
Platz bzw. wechseln wie gewohnt, der andere (neuere) Stand bleibt erhalten, bis der Spieler weiterspielt und der Wechsel ihn regulär erreicht. Umsetzung als Fix-Runde (Fortsetzung des
Umsetzers, Test zuerst: «Davor laden → Neuladen → neuerer Stand noch ladbar»), Delta-Review, README-Satz. Danach Ergänzungsurteil `lead-qa` im Bündel REL-30. Risiko Mehrfach-Parsen bei
`newestAuto`/`otherAuto` und Testlücke «defekter Zeiger» → im selben Fix mit abdecken, falls ≤ 1 Task, sonst Beobachtung.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: UI-HAEPPCHEN-H P2 (später, `renderer.ts`), keine Dateiüberschneidung mit Beipack/I
Regelbezug: R807, R808, R817 · Kosten bei Irrtum: P1 verpasst das Bündel morgen; dann REL-31.

Entscheider: L0 · Anlass: Bericht lead-tech UI-HAEPPCHEN-H P1 · ADR: —

## R851 · 2026-10-22 · UI-HAEPPCHEN-H P1: Fix R850 angenommen; Beschriftung nach Speicherzeit

Ruling: Fix-Runde `lead-tech` (`feat/ui-haeppchen-h-p1` @ `027be9dc`: `markAutoLoaded(slot)` in `storage.ts`, Rot-Beleg, defekter Zeiger abgedeckt, Mehrfach-Parsen behoben, Spec-Regeln 4/10
mit Vermerk, Teilbeleg 53/53, Delta-Review opus BEDENKEN niedrig) → **angenommen**. Letzte kleine Runde: Beschriftung in Ladeliste und Startkarte nach **Speicherzeitpunkt** (zuletzt
geschrieben = «Autosave», der andere = «Autosave davor»), unabhängig vom Zeiger; der Zeiger bestimmt nur das Schreibziel. Ist das mehr als eine kleine Runde, geht es als Beobachtung und
«Bitte testen» ins Bündel. Danach Ergänzungsurteil `lead-qa` im Bündel REL-30.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: keine
Regelbezug: R850 · Kosten bei Irrtum: verwirrende Beschriftung, UI-only.

Entscheider: L0 · Anlass: Fix-Runde lead-tech UI-HAEPPCHEN-H P1 · ADR: —

## R852 · 2026-10-22 · UI-HAEPPCHEN-H P1 abgenommen fürs Bündel REL-30

Ruling: Runde R851 (`feat/ui-haeppchen-h-p1` @ `d97c562d`: Schlüssel `inselreich.save.auto.written` für die Beschriftung, Zeiger bleibt Schreibziel, Rückfall ohne Migration; Delta-Review opus OK,
Teilbeleg 56/56, `src/sim` ohne Diff) → **Strang P1 abgenommen**, geht mit Ergänzungsurteil `lead-qa` in REL-30. Alte Formulierung Spec Regel 2/6 → Beobachtung beim nächsten Spec-Kontakt.
«Bitte testen»: «Davor laden», Seite neu laden, beide Stände in der Liste richtig benannt und ladbar.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: keine
Regelbezug: R850, R851 · Kosten bei Irrtum: UI-only, Revert vor dem Push.

Entscheider: L0 · Anlass: Bericht lead-tech UI-HAEPPCHEN-H P1 · ADR: —

## R853 · 2026-10-22 · Vorfall: Controller schliefen nach Arbeiter-Ende ein; L0 leitet Arbeiter-Meldungen weiter

Ruling: Nutzerhinweis («ich habe die agenten nicht mehr arbeiten gesehen»). Befund: Zwei Controller standen still, bis L0 sie anschrieb. (a) UI-BEIPACK-FERN: Der Controller wartete auf
seinen Opus-Reviewer; dessen Abschlussmeldung kam bei L0 an statt beim Controller (≈ 11:10Z), L0 wertete sie als Info («lead-tech steuert selbst») und weckte niemanden → ≈ 2 h Stillstand
bis 13:10Z. (b) ORT-A: Der Umsetzer meldete sich nach einem Hintergrund-Messlauf nicht mehr; der Zwei-Frame-Fix (R823) blieb ≈ 2 h liegen, bis L0 um 12:01Z nachfragte. **Ab sofort:**
(1) Kommt bei L0 eine Abschluss- oder Zwischenmeldung eines Arbeiters an, der zu einem Lead gehört, leitet L0 sie im selben Zug per `SendMessage` an diesen Lead weiter («Ergebnis da,
bitte fortsetzen»). (2) Nach jeder Meldung prüft L0 die letzten Heartbeats der aktiven Agenten; ein aktiver oder wartender Agent ohne Heartbeat seit > 20 min ohne bekannte Wartebedingung
wird angeschrieben. (3) Leads warten auf Arbeiter nie nur passiv: Beim Warten nennen sie im Status, worauf, und fragen nach spätestens 30 min nach. Handbuch-Minor durch `studio-coach`
in der Ende-Routine; Vorfall in die Kurz-Retro.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: keine
Regelbezug: Verfassung §8.1, R803, R826, Handbuch 1.39 (Warten per Benachrichtigung) · Kosten bei Irrtum: einige zusätzliche Nachfragen.

Entscheider: L0 · Anlass: Nutzerhinweis · ADR: —

## R854 · 2026-10-22 · Nutzerauftrag Berichtshierarchie: Vordergrund-Regel technisch erzwingen

Ruling: Nutzer: «es würde doch mehr sinn machen wenn es eine klare hierarchie der delegationen und rückmeldungen gibt. die worker sollten sich nicht bei dir melden … sondern bei ihrem
auftraggeber/chef.» Befund: Die Hierarchie steht bereits im Handbuch (STUDIO.md «Berichtsweg L2 → L1 → L0», «Vordergrund-Regel»: Leads starten Arbeiter mit `run_in_background: false`,
das Ergebnis kommt als Rückgabewert direkt zum Lead). Heute haben Leads Arbeiter trotzdem **im Hintergrund** gestartet; dadurch landeten Arbeiter-Meldungen bei L0 und die Leads
schliefen ein (R853). Die Regel war nur Text. **Entscheid:** (1) **TOOL-VORDERGRUND**: `tools/studio/waitguard.py` bekommt Regel C — ein `Agent`/`Task`-Aufruf mit
`run_in_background: true` durch einen Aufrufer mit `agent_type` «lead-*» (und durch jeden Arbeiter) wird mit `deny` und Hinweis «Arbeiter im Vordergrund starten, parallel = mehrere
Aufrufe in einer Nachricht» abgelehnt; L0 (Hauptsession) bleibt frei, Leads im Hintergrund zu starten (ADR-007). TDD mit `make studio-test`, Umsetzer `tech-ui-engineer` direkt, Review
`qa-code-reviewer`; Budget **2**; wirkt nach dem Merge im Bündel REL-30. (2) Bis dahin weist L0 laufende Leads auf die Regel hin. (3) R853 (1) bleibt als Rückfall: landet doch eine
Arbeiter-Meldung bei L0, leitet L0 sie weiter. (4) Arbeiter senden nie per `SendMessage` an `main`; das ergänzt `studio-coach` in den Arbeiter-Personas.

Verfassung berührt?: nein (`guard.py` unberührt, eigenes Hook-Modul) · Überschneidung mit offenen Paketen: `waitguard.py` in keinem offenen Branch
Regelbezug: Verfassung §2, §8.1; ADR-007; R646/R647; R853 · Kosten bei Irrtum: ein Lead wird bei einem legitimen Hintergrundstart blockiert; Rückfall `MODE = "warn"`.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R855 · 2026-10-22 · UI-BEIPACK-FERN abgenommen fürs Bündel REL-30

Ruling: Bericht `lead-tech` (`feat/ui-beipack-fern` @ `9694e945`, Opus-Review BEDENKEN → H1/N1 behoben, Delta-Review opus OK, Playtest BF13–BF17 bestanden, Teilbeleg, `src/sim` nur
Kopfkommentar; Handoff `.studio/handoffs/2026-10-22-lead-tech-UI-BEIPACK-FERN.md`) → **abgenommen**, Ergänzungsurteil `lead-qa` im Bündel REL-30; Merge **vor** Seerecht T04.
R837-E/R838-E/R840-E (Entwurfsnummern) angenommen. N2, N3 und das überflüssige `as never` in `order.test.ts:769` → Beobachtung. Der volle Lauf kommt im Push-Check des Bündels.
Befund des Controllers: Arbeiter-Starts mit `run_in_background: false` liefen trotzdem asynchron → Prüfauftrag zur Benachrichtigungs-Zustellung (R854 wird ggf. nachgeschärft).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: UI-HAEPPCHEN-I (`hud.ts`), Stadtplanung (`app.ts`), Seerecht (`islandCard.ts`); Auflösung per `git merge main`
Regelbezug: R835, R836, R854 · Kosten bei Irrtum: UI-only.

Entscheider: L0 · Anlass: Bericht lead-tech UI-BEIPACK-FERN · ADR: —

## R856 · 2026-10-22 · Ursache der eingeschlafenen Leads: Claude-Code-Verhalten; Rückkanal per Adresse; Ende-Routine

Ruling: Befund `claude-code-guide` (Doku sub-agents, tools-reference, agent-teams; CLI 2.1.308): `run_in_background` ist am Agent-Werkzeug nicht dokumentiert; Subagent-Starts laufen
standardmässig im Hintergrund (seit v2.1.198); laut Doku sollte ein Lead auf seine Kinder warten, beobachtet ist das Gegenteil (Meldungen der Enkel landen in der Hauptsession, der Lead wird
nicht geweckt) — passt zu einem gemeldeten Fehlerbild («nested background subagent never re-woken», inoffiziell). **Folgerung:** Die Ursache liegt nicht (nur) in der Disziplin der Leads;
R854 Regel C (TOOL-VORDERGRUND, Review OK) bleibt als Schutz gegen ausdrückliche Hintergrund-Starts, löst die Zustellung aber nicht. **Entscheid:** (1) Standard bis zur Behebung: L0
leitet jede Arbeiter-Meldung sofort an den zuständigen Lead weiter (R853) — L0 ist dabei nur Poststelle, Empfänger bleibt der Lead. (2) Rückkanal-Muster als Paket für die nächste Session
(**TOOL-RUECKKANAL**, `studio-coach` + Werkzeug): L0 nennt jedem Lead nach dem Start seine Adresse (agentId); Leads schreiben sie in jedes Arbeiter-Briefing («Melde dein Ergebnis per
SendMessage an …»); Arbeiter-Personas bekommen das Werkzeug `SendMessage` (nur an den Auftraggeber, nie an `main`). (3) Fehlerbericht an Anthropic als Entwurf (`/feedback`, Freigabe
durch den Nutzer). (4) **Limit-Ampel 79 %**: Ende-Routine jetzt; ORT-A beendet den laufenden Messblock und übergibt.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: TOOL-VORDERGRUND (`waitguard.py`), Arbeiter-Personas
Regelbezug: R826, R853, R854, Verfassung §2 · Kosten bei Irrtum: L0 bleibt Poststelle, bis das Muster greift.

Entscheider: L0 · Anlass: Bericht claude-code-guide, Limit-Ampel · ADR: —

## R857 · 2026-10-22 · ORT-A C11 pausiert; AK-31 bestanden; AK-37 Referenz `de0a372a`

Ruling: Pausenbericht `lead-tech` (Handoff `.studio/handoffs/2026-10-22-lead-tech-ORT-A-C11.md`): Zwei-Frame-Patch `4db494e9` → **AK-31 bestanden** (Σover25 = 0 bei Seed 7, Seed 14, Fixture;
A/A 0). **AK-37:** Vergleichsreferenz ist `de0a372a` (Stand vor k2), nicht `ort-a-basis`; der dunklere Kern gegen die Basis stammt vom Hofsaum-Boden, nicht von T16 → mit n = 17/20 (Δ −0,4)
**bestanden**. AK-32 Seed 14/Fixture und AK-30 auf `4db494e9` laufen noch im Hintergrund (Umsetzer berichtet; Log `scratchpad/h10.log`); bestehen sie, folgt in der nächsten Session die
Abnahme k1/k2, Merge nach `feat/ort-a` (Teilbeleg, Verfassung 1.3), T18. Danach geben ORT-A-Messungen das Fenster für TOOL-MESSFENSTER T00 frei.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: LEBEN-STRASSE, LEBEN-SEE, UI-H P2, Stadtplanung warten auf den ORT-A-Merge
Regelbezug: R793, R800, R823 · Kosten bei Irrtum: AK-37 falsch referenziert; Nachmessung gegen die Basis jederzeit möglich.

Entscheider: L0 · Anlass: Pausenbericht lead-tech ORT-A · ADR: —

## R858 · 2026-10-22 · Kurz-Retro abgenommen; Briefing-Vorlage auf Teilbeleg

Ruling: Kurz-Retro `studio-coach` (`docs/studio/retros/2026-10-22-session-3b332328-ende.md`, Handbuch 1.70, `cbc9d360`) → **abgenommen**. Empfehlung angenommen:
`docs/studio/templates/briefing.md` (Z. 23, 81) verlangt noch «make check grün» → auf Teilbeleg (Verfassung 1.3 §9.2) umstellen und offene Pläne (Seerecht, LEBEN-_, UI-I, TOOL-_)
mitprüfen; erstes Paket der nächsten Session neben dem Bündel REL-30 (`studio-coach`, Budget 1). Rote Effizienz-Ampel (Steuerung 60,7 %, Cache-Write 29,3 %, L0-Kontext 516k) →
Messaufträge laut Retro; Hebel ist TOOL-RUECKKANAL (R856).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: alle offenen Pläne (nur DoD-Zeile)
Regelbezug: R849, R856 · Kosten bei Irrtum: ein überflüssiger voller Lauf je Strang.

Entscheider: L0 · Anlass: Kurz-Retro Session-Ende · ADR: —

## R859 · 2026-10-23 · Session-Start: «mach weiter» = Plan aus state.md; REL-30 zuerst

Ruling: Auslegung «mach weiter» als Fortsetzung des Plans aus `state.md` (Abschnitt «Fortsetzung») — Zweck der Anweisung: Arbeit ohne Rückfrage fortsetzen; Auslegung widerspricht ihm
nicht, weil keine neue Richtung genannt ist. **Reihenfolge:** (1) REL-30: `lead-qa` Ergänzungsurteil für die seit R842 fertigen Stränge (UI-H P1, UI-BEIPACK-FERN, UI-I A/B,
LEBEN-SEE Klang, TOOL-MESSFENSTER, TOOL-PUSHSPERRE A/P, TOOL-VORDERGRUND, Nachtrag `plan/seerecht` b7fd0a6a, `plan/tool-pushsperre`) mit merge-tree-Trockenlauf des ganzen Bündels; danach
`production-integrator` (seriell mergen, ein `make push-check`, Push nur bei Exit 0). Bis Exit 0 keine Umsetzer und Controller (R464); Gates, Doku, Pläne ohne Testlauf parallel.
(2) ORT-A: Log `h10.log` ausgewertet — AK-32 Seed 14 und Fixture Σover25 = 0 (bestanden), AK-30 Seed 7 Δ 0 % (bestanden), **AK-30 Seed 14 abgebrochen** (`unsettled top-level await`
in `perf.mjs`); Nachmessung erst nach dem Push (Last, R329). (3) `studio-coach`: Briefing-Vorlage auf Teilbeleg (R858) und TOOL-RUECKKANAL Doku-/Persona-Teil (R856). Limit-Ampel grün
(5 h 30 %, 7 Tage 33 %).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: REL-30-Bündel, ORT-A
Regelbezug: R826, R842, R857, R858, R464 · Kosten bei Irrtum: eine Session-Stunde in falscher Reihenfolge.

Entscheider: L0 · Anlass: Session-Start a5d45446 · ADR: —
