# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-10 (Studio-Session f52039fc, R472–R496; Ende: REL-18 live; UI-TASTEN, AUFRAEUM-01, TOOL-BUENDEL-5 lokal auf main @ `4b3a3aac` = Release-Kandidat REL-19, Push offen; CI auf main grün)

## Release-Notizen

**REL-19 „Tasten, Aufräumen, Werkzeug“ (live, R512)** — Push `801bee89` (inkl. TOOL-BUENDEL-6 T01), CI 38123931614, Pages 38124390332 grün. UI-TASTEN
(R476/R479/R496), AUFRAEUM-01 (R485/R491), TOOL-BUENDEL-5 (R478/R482/R484/R494). Kein Save-Wechsel (v11), Baseline
unverändert. Opus-Final-Reviews je Strang erfolgt.

- **Neu:** `Entf` oder `Rücktaste` reisst das Gebäude im offenen Info-Panel ab (wie «Abreissen»); `Strg`/`Cmd`+`S`
  speichert in den manuellen Platz und unterdrückt den Browser-Dialog. Beide im Menü «Tastenkürzel». (vom Studio
  vorgeschlagen, I-056/I-057)
- **Bitte testen:** (1) echtes `Cmd+S` auf macOS in Chrome und Safari; (2) `Entf` auf Kontor
  (Heimatkontor bleibt, Fern-Kontor mit Route nennt den Grund); (3) gehaltene `Entf` reisst höchstens ein Gebäude ab;
  (4) `Strg+S` bei offener Startkarte/Menü schreibt nichts.

**REL-18 „Edikte, Stilllegen, Gut-Chip“ (live, R480)** — Push `a9f5336e..bfb6af44`, CI 38063457678, Pages 38063909955. M13-E1 (R467), UI-GUT-CHIP (R470), TOOL-BUENDEL-4
(R469). Save **v11** (Migration v10→v11), Balancing-Baseline unverändert (nur `balance-upgrade.test.ts`, eine Zeile
`buyPrice`, R456). Opus-Reviews je Strang erfolgt (T15 M13-E1, T09 UI-GUT-CHIP, Final-Review TOOL-BUENDEL-4).

- **Neu M13-E1 „Edikte der Amtsstube, Betrieb stilllegen“:** Nach dem Bürger-Ziel erlässt der Spieler in der Amtsstube ein
  Edikt (Sparen, Handel, Wohlfahrt; 600 Geld, danach 5 min nicht änderbar). Jeder Betrieb lässt sich stilllegen: halber
  Unterhalt (je Betrieb auf der 100-Tick-Basis aufgerundet), keine Erzeugung, zählt nicht als Problem.
- **Neu I-043 „Gut-Chip zeigt Erzeuger und Verbraucher“:** Klick auf einen Lager-Chip springt zum ersten Erzeuger, hebt
  Erzeuger und Verbraucher hervor; `.`/`,` gehen sie durch; zweiter Klick, `Esc` oder Inselwechsel beendet den Fokus.
- **Bitte testen:** (1) Amtsstube nach dem Bürger-Ziel: Edikt Sparen erlassen, Kopfzeile Unterhalt sinkt,
  Handel ist 5 min gesperrt (Sperrzeile, Tooltip). (2) Fischerhütte stilllegen: Zustand «Stillgelegt — halber Unterhalt»,
  sie verschwindet aus der Problemliste (`.`). (3) Holz-Chip klicken, `.` mehrmals: Kamera springt zu Holzfällern und
  Verbrauchern, `Esc` beendet. (4) Alter Spielstand (v10) lädt.

**REL-17 „Probleme finden, Wege abziehen“ (live, R463)** — Push `c282def0..a9f5336e`, CI 38055866019 grün, Pages 38056273377. Bitte testen: `.`/`,` springen zu Problemen; Abriss-Zug entfernt nur Wege, Warnung bei abgetrenntem Betrieb.

**REL-16 „Ruhiges Bauschild, sauberer Neustart“ (live, R463)** — Bitte testen: Bauschild «Kein Bauland: Gebirge» /
«Platz belegt: Weg»; «Neue Insel» räumt das Inselmenü ab.

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

Keine Nutzer-Aufträge offen. Daueraufträge: R445 (Ideen-Runde bei freier Kapazität, max. eine je Session), **R475 (Deckel
≤ 8 voll halten; blockierte Umsetzung → Specs/Pläne/Gates/Scouting)**. Neues Claude-Gespräch empfohlen (R438 V4 b).

0. **Push REL-19** (main @ `4b3a3aac` + Doku) nach Handbuch 1.45 als erstes, allein (R488: Push zuerst, dann Deckel
   füllen); Integrator wartet auf CI mit `timeout 240 gh run watch` in Schleife (R488 V3); Pages-Deploy, `ci.py`.
   Danach Prozess-Aussensicht REL-19.
1. **Plan M13-E2** (`lead-tech`, opus) aus Spec `a39a1ccb` (gegatet R483/R489/R493; Plan-Punkte Anhang 08 E: Task
   „Def-Kern“ zuerst, Szenario-Stände, A1–A6, Nachtrag Plan I-049 Fall K1). Dann Gate Plan, Umsetzung SIM/ART/UI.
2. **Plan I-048** (`lead-tech`) aus Spec `12c98fd3` (gegatet R487/R490/R492), Merge erst nach M13-E2-SIM.
3. **I-049** Plan gegatet (R481), Start nach Merge M13-E2-SIM.
4. **Gate Spec M14-E1** (`ff2c2fd8`, R495; lead-tech + lead-qa); Umsetzung erst nach Abschluss M13 (R486).
5. **Werkzeug-Bündel 6:** TOOL-PUSH-CHECK (R488 V1), Ampel Actions-Konto-Prognose (V2) und Produktivanteil (V4),
   Merge-Treiber `beobachtungen.md` (E-059), Budget-Hook blockt Start ohne Freigabe (E-060) (R497). `studio-coach`:
   V3-Persona-Zeile Integrator (R488), E-061 lead-design-Nachträge auf sonnet (R497).
6. **Kurzdesign-Kandidat** aus Playtest REL-18: «Nächster Schritt» übersieht akuten Nahrungsmangel (docs/beobachtungen.md).
7. **Aufräumen** (eigenes Ruling): Worktrees `.worktrees/b4`, `m13-e1-sim`, `m13-e1-ui`, `ui-gut-chip`, `b5`,
   `aufraeum-01`, `ui-tasten` sind gemergt — nach dem Push REL-19 entfernen (`git worktree remove`, Branches bleiben;
   vorher Screenshots `.worktrees/ui-tasten/.studio/qa/ui-tasten/` sichern).
8. Beobachtungs-Auswertung, sobald > 30 Einträge seit 2026-10-10.

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M12 abgeschlossen** (R352). Live: REL-01…REL-17, M1–M8, M10, M11, M9-Häppchen, M12. **M13 „Spätspiel mit Richtung“**: E1 (Edikte, Stilllegen)
  lokal auf main (R467), E2 (Denkmal) offen. Verfassung **1.2**, Handbuch **1.44**.
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

## Laufend

- Session 2026-10-11 (R498–R521). **REL-19 live** (Push `801bee89`). Lokal auf main (nicht gepusht, Release-Sperre R505,
  Actions-Prognose ROT 1991/2000 → höchstens ein Push je Tag): UI-NAECHSTER-SCHRITT (R515), TOOL-BUENDEL-6 A+B (R517,
  R520; `make push-check` ist der Push-Weg, Handbuch 1.49, Budget-Hook `warn`).
- **M13-E2:** SIM-Strang (Controller A) bei T03/T04 auf `feat/m13-e2-sim` (T01 `46d82e00`, T02 `051efcc8`);
  ART-Strang fertig `feat/m13-e2-art` @ `5295021d` (R521, inkl. Leuchtfeuer AK-46). Nächste: Controller B (T05–T07),
  UI-Strang Controller D nach T04 (ART-Hash vor T12; Hinweis: `src/ui/messages.ts` ohne Icon für `monument`), dann E.
- Danach: Gate Merge E2-SIM → I-049-Sim (Nachtrag `nachtrag-i049.md`, R511) → I-048-Sim (R506) usw. nach R505/R507.
- Spec M14-E1 gegatet (R501), Plan nach M13.

## Parallele Sessions

- Nutzer-Session `c6709a04` (seit 2026-10-11 ≈ 08:30Z): Konzept „Erweiterung“ (`lead-design`), Worktree
  `.worktrees/erweiterung-1`, Branch `design/erweiterung-1` — geduldet, Deckel geteilt (R519). Nicht anfassen.

## Seit letzter Session erledigt

- REL-18 live (R480): Push `a9f5336e..bfb6af44`, CI/Pages grün; Playtest REL-18 OK; Prozess-Aussensicht (R488).
- Handbuch 1.45 (R471/R473); fällige Retros quittiert.
- Ideen-Runde IDEEN-06 (R474), 15 Ideen, Pool 37/40.
- Gegatete Specs: M13-E2 Denkmal (R483/R489/R493), I-048 Zukauf-Aufschlag (R487/R490/R492); Art-Vorschlag Denkmal
  „Feuersäule“ prozedural; M14-Richtung B (R486); Spec M14-E1 eingereicht (R495).
- Umgesetzt und lokal gemergt: UI-TASTEN, AUFRAEUM-01, TOOL-BUENDEL-5 (REL-19-Kandidat). I-049 Plan gegatet (R481).

## Pausierte Pakete

- Keine. Worktrees: Hauptcheckout, `.worktrees/integrate` (detached auf main), gemergt und aufräumbar nach dem Push REL-19:
  `.worktrees/b4`, `m13-e1-sim`, `m13-e1-ui`, `ui-gut-chip`, `b5`, `aufraeum-01`, `ui-tasten` (Symlink `node_modules`).
- Branch `int/rel-07`, Alt-Branches (u. a. `fix/rel07-a-wood`, `feat/m7-fx`, gemergte `fix/…`, `feat/…`, `tool/…`),
  Remote `wip/r118a-render-aufraeumen` und `stash@{0}` bleiben bis Ruling.

## Budget

Offen: keine Freigaben (Restbudgets verfallen mit Session-Ende).

## Offene Entscheide

- Nutzer: N-99 (Kenntnis R434), ohne Antwort gilt R434.
- L0: keine offen (REL-19-Umfang entschieden, R496).
