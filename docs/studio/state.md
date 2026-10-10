# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-10 (Studio-Session 2cfa57e0, R444–R458; Ende: REL-15 live; REL-16, REL-17, HOTFIX-CI-01, TOOL-BUENDEL-3 lokal auf main @ `f9ac34e4`, Push offen; CI auf main rot bis zum Push)

## Release-Notizen

**REL-17 „Probleme finden, Wege abziehen“ (lokal auf main @ `f9ac34e4`, Gate Merge Release OK R458, Push offen)** — Save
unverändert (v10), Balancing-Test unverändert. Ideen I-041/I-042 vom Studio vorgeschlagen (IDEEN-05).

- **Neu:** `.` und `,` springen zum nächsten bzw. vorigen Problem (nicht angebunden, Betrieb steht, Haus ohne Dienst,
  fehlende Ware), auch auf anderen Inseln, öffnen das Info-Panel und melden «Problem 2 von 5: …»; ohne Problem «Alles
  versorgt, kein Problem offen». Das Abriss-Werkzeug reisst beim Ziehen mehrere Wege auf einmal ab (Gebäude bleiben
  stehen); trennt ein Abriss Gebäude vom Kontor, warnt das Spiel.
- **Bitte testen:** (1) `.` mehrmals drücken: Kamera und Panel wechseln, Werkzeug bleibt, Meldung ersetzt die vorige?
  (2) Mit dem Abriss-Werkzeug über einen Weg nahe Häusern ziehen: nur Wege verschwinden? (3) Den einzigen Weg zu einem
  Betrieb abreissen: Warnung «Abriss trennt 1 Gebäude vom Kontor»?

**REL-16 „Ruhiges Bauschild, sauberer Neustart“ (lokal auf main @ `915d87c5`, Gate Merge Release OK R454, Push offen)** —
Save unverändert (v10), Balancing-Test unverändert.

- **Neu:** Das Bauschild nennt den Grund genau: «Kein Bauland: Wasser» / «Kein Bauland: Gebirge», «Platz belegt: Wohnhaus»
  / «Platz belegt: Weg»; dieselbe Meldung beim Klick. «Neue Insel» und Laden räumen das Inselmenü des alten Spiels ab.
- **Bitte testen:** Wohnhaus- und Weg-Werkzeug am Bergfuss, an der Küste und über bestehenden Häusern und Wegen — passt
  das Schild zur Kachel unter dem Zeiger? Nach «Neue Insel» das Inselmenü öffnen und mit Esc schliessen.

**REL-15 „Klare Abhilfe, ruhiges Schild, saubere Seekarte“ (live, R446)** — Push `9eb99e77..c282def0`, CI 38038270428
**rot** (Sekunden-Flake im Studio-Test, Fix HOTFIX-CI-01 lokal), Pages 38038481954 grün. Bitte testen: «Mangel: Kapelle
fehlt» genau einmal mit Abhilfe darunter; Hover-Schild weicht der Karte; Kontor-Marke auf der Seekarte.

**REL-14 „Klarer Inspektor, Fest je Insel“ (live, R436)** — Push `46153c6..9eb99e7`, CI 38031718801, Pages 38031921572.
Bitte testen: Chip «Ausserhalb der Versorgung» / «Im Versorgungsradius» ohne Widerspruch; Fest daheim lässt Kolonie-Häuser
unbeeinflusst.

**REL-13 „Steuer je Stufe“ (live, R425)** — Steuer in der Amtsstube je Stufe, Save v10. Push `3417346..46153c6`, CI
37984641871, Pages 37985195805. Bitte testen: Pioniere «niedrig» / Kaufleute «hoch», Kopfzeile «gemischt», alter
Spielstand (v9) lädt mit bisherigem Wert, Kaufleute-«niedrig» ausgegraut.

**REL-12 „Seekarte“ (live, R413)** — Karte der Inseln mit Silhouetten, Fahrlinien und Schiffspunkten; Klick springt zur
Insel. Push `5d14854..3417346`, CI 37949164666, Pages 37949941925.

**REL-11 „Ruhiger Rand, lesbarer Seeweg, Meeresfels“ (live, R407)** — Kamera bleibt über Land, Schiffe mit hellem Saum,
Meeresfels wie Fels, Seeplan-Neubau schneller, Kontrast in Listen. Save v9.

**REL-10 „Kiefernküste, ruhige Kamera, freie Fahrrinnen“ (live, R398)** — Strandkiefern, Kamera-Klemmung,
Fahrrinnen frei von Wracks, Felsen und Eilanden. Save v9.

**REL-09 „Sichere Seewege, klarere Küsten, ruhigere Bauleiste" (live, R374)** — Schiffe fahren um Inseln, Küsten ohne
Rautenmuster, Bauleiste als Overlay, Klick aufs Kontor zeigt Schiffe. Save v9.

**REL-08 „Tasten-Komfort, flüssigere Insel, Gebäude-Panel" (live, R339–R346)** — Leertaste = Pause, Strg/Cmd+Klick =
Pipette, `Umschalt+U` = Ausbau, neues Gebäude-Panel, schnelleres Laden (Kaltstart Seed 7 22,8 → 8,3 s), Bauen im Wald
ohne Ruckeln, Wasserfall-Gischt, Menü bei 1280×720.

**REL-07 „Lebendige Insel" (live, R327)** — Küste mit Riffen, Schaum, Wrack; Entdecken im Gebirge (Bergsee, Wasserfall,
Höhle); Tiere und Delfine; Wald-Feinschliff WALD-02.

**REL-06 „Gewachsene Insel" (live, R301)** — organischerer Wald, weicher Gebirgsfuss, weiche Gebäudekanten, belebte Wiese.

**REL-05 (live, R277) — M12 Seefahrt-Bündel** — Kontor II auf Fremdinseln, Gewürz, Handelsschiffe mit Routen in 2 Klicks,
drittes Ziel «Gewürzstadt» (vom Studio vorgeschlagen, I-010), Inselwechsel `9`/`0`, Save v9.

**M12-E1 Archipel (R266/R268), REL-04 Fest in der Kapelle (R244), REL-01…REL-03 (Licht, Wiese, Dünen, Wirtschaftston)** — live.

## Fortsetzung beim nächsten Start

Keine Nutzer-Aufträge offen. Dauerauftrag R445: bei freier Kapazität eine breite Ideen-Runde (höchstens eine je Session).
**Neues Claude-Gespräch empfohlen** (R438 V4 b; L0-Kontext dieser Session bis 774k).

0. **Push** main (HOTFIX-CI-01 `e158a3a1`, REL-16 `915d87c5`, TOOL-BUENDEL-3 `f0b0a701`, REL-17 `f9ac34e4`, Doku) nach
   **Handbuch 1.42**: `tsc`, `lint`, `zeittests`, `conflicts`, Load ≤ 4 abwarten, `make check`, `make zeitreserve-push`,
   `make check-ci-perf` (im Integrator-Briefing ausdrücklich nennen); `git push origin <geprüfter Hash>:main`; CI (muss
   wieder grün sein), `gh workflow run Pages --ref main` (REL-16 + REL-17 sind Releases), `ci.py`. Danach
   Prozess-Aussensicht REL-16/REL-17 (`studio-process-coach`, ein Start für beide).
1. **Gate Plan M13-E1** (`docs/superpowers/plans/2026-10-10-m13-e1/`, `0b40d7f1`; Entscheide E1–E9, Budgetantrag 37
   Starts, Parallelität 2): `lead-qa` + `lead-production` (neue Branch-/Merge-Struktur, vier Controller-Instanzen), dann
   Umsetzung (≈ 860 Tools, ≈ 95 min Wandzeit). Sim-Strang zuerst, UI-Strang nach Sim-T03. Handoff
   `.studio/handoffs/2026-10-10-lead-tech-M13-E1.md`.
2. **Nach REL-17:** I-043 „Gut-Chip zeigt Erzeuger und Verbraucher“ (R448 (3), nutzt `src/ui/problems.ts`) als nächstes
   S-Bedien-Häppchen; Kurzdesign `lead-design`. Parallel möglich: Denkmal-Sprite für M13-E2 (lead-art, R452 O2).
3. **Werkzeug-Kandidaten** in `docs/beobachtungen.md` (Abschnitte REL-16 R454, TOOL-BUENDEL-3 R457, REL-17 R458) für das
   nächste Bündel sammeln; Auswertung, wenn > 30 Einträge.
4. **Experimente (R459):** E-050 behalten, **E-054 (Pläne auf sonnet) startet** mit dem nächsten Plan; E-038 „angepasst“
   (Coach passt an); V2/E-058 Integrator-Briefing mit `make check-ci-perf` als Vorlagenzeile (studio-coach); E-056, E-057
   eingereiht; Messaufträge M1 (Frist 2026-10-23), M2 (Frist 2026-11-19), L0-Kontext Start ≤ 65k / Max ≤ 350k.
5. **Warteschlange N-99** (Kenntnis R434) offen; ohne Antwort gilt R434.

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M12 abgeschlossen** (R352). Live: REL-01…REL-15, M1–M8, M10, M11, M9-Häppchen, M12; REL-16, REL-17,
  HOTFIX-CI-01 und TOOL-BUENDEL-3 lokal auf main, Push offen. **M13 „Spätspiel mit Richtung“** in Planung (Spec E1
  `3acc7e2f`, Plan `0b40d7f1`, Gate Plan offen). Verfassung **1.2**, Handbuch **1.42**.
- Dauerregeln: Desktop-first (R78); kein Rebase; eine aktive L0-Session je Repo (R129, R324); studioweit **≤ 8 Agenten,
  davon ≤ 2 Browser-Läufe** (R424, ersetzt R241); vor Paketstart `git worktree list`, `git status`, fremde Heartbeats
  prüfen (R329); Messungen nur bei 1-min-Load ≤ 4 (R329).
- **TOOL-TESTLOCK aktiv (R380):** `make check`, `make test`, `zeitreserve-push` brechen bei belegter Sperre oder
  1-min-Load > 8 ab (nicht warten); im Task nur gezielte Läufe; Messläufe haben Vorrang; meldet jetzt verwaiste
  Vitest-Worker. Fake-Schalter nur in Tests (R378).
- **GitHub Actions mit Sparregeln (R334):** `CI` ignoriert Doku-Pushes, `Pages` nur per `gh workflow run Pages --ref
main` beim Release, `CI` mit `cancel-in-progress`.
- **Höchstens ein Push pro Session (R335)**, nach Abschluss des zu pushenden Stands, immer per geprüftem Hash (Handbuch
  1.37, R429). Push-Gate ohne separates `make test` und ohne Lastwarten nach `make check` (Handbuch 1.40). Merges nach Gate bleiben lokal.
- **Rulings** mit Pflichtfeldern „Regelbezug“ und „Kosten bei Irrtum“; Abweichung vom Handbuch → Handbuch-Minor im selben
  Zug (R429). Ein-Paket-Release: Gate Merge und Release-Check in einem `lead-qa`-Start.
- **Modell-Guard** (`modelguard.py`, Modus `deny`, Handbuch 1.38) prüft Agent-Starts gegen die Modelltabelle in STUDIO.md; Modell nur
  nach dieser Tabelle (R420). Kopfzeile `Modell: <alias> (<Einsatz>)` bei stärkerem Modell als die Persona. Prettier-Pre-Commit-Hook aktiv (`make hooks`).
- **Arbeiter** nur per Benachrichtigung abwarten, kein Polling; `run_in_background: false` als Boolean; Controller mit Blocker
  `waiting` und Fortsetzung per `SendMessage` (Handbuch 1.39).

## Parallele Sessions

Keine aktive L0-Session ausser dieser. Prozess „anno-clone #3“ lief beim Start dieser Session nicht mehr.

## Seit letzter Session erledigt

- REL-15 + Werkzeug-Bündel 2 live (R446); CI rot durch Sekunden-Flake → HOTFIX-CI-01 lokal (R447); Prozess-Retro REL-15
  (R450) → Handbuch 1.42, V1–V3 in TOOL-BUENDEL-3.
- BEOB-AUSW-04 (R444); breite Ideen-Runde IDEEN-05 nach Nutzerauftrag (R445, Handbuch 1.41), 15 Ideen priorisiert (R448).
- REL-16 (R451, R454) und REL-17 (R449, R453, R458) umgesetzt, abgenommen, lokal gemergt; TOOL-BUENDEL-3 (R451, R457)
  lokal gemergt (`test_failed`-Erfassung, gemeinsame Uhr, Budget-Warnung).
- M13: Brainstorming Ansatz A (R452), Spec E1 mit Nacharbeit (R455, R456), Plan fertig.
- Kurz-Retro 2026-10-10 (2cfa57e0).

## Pausierte Pakete

- Keine. Worktrees: Hauptcheckout, `.worktrees/integrate` (detached @ `f9ac34e4`). M13-E1 wartet auf Gate Plan (kein Worktree).
- Branch `int/rel-07`, Alt-Branches (u. a. `fix/rel07-a-wood`, `feat/m7-fx`, gemergte `fix/…`, `feat/…`, `tool/…`),
  Remote `wip/r118a-render-aufraeumen` und `stash@{0}` bleiben bis Ruling.

## Budget

Offen: keine Freigaben (Restbudgets REL-16/REL-17/TOOL-BUENDEL-3 verfallen mit Session-Ende). M13-E1 braucht die Freigabe im Gate Plan (Antrag 37 Starts).

## Offene Entscheide

- Nutzer: N-99 (Kenntnis R434), ohne Antwort gilt R434.
- L0: Gate Plan M13-E1 (E1–E9).
