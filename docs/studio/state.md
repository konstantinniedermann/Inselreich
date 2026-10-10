# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-10 (Studio-Session 5a00a316, R460–R470; Ende: REL-16, REL-17 live; M13-E1, UI-GUT-CHIP (I-043), TOOL-BUENDEL-4 lokal auf main @ `f22317df`, Push offen; CI auf main grün)

## Release-Notizen

**Release-Kandidat (lokal auf main, Push offen, nächste Session):** M13-E1 (R467), UI-GUT-CHIP (R470), TOOL-BUENDEL-4
(R469). Save **v11** (Migration v10→v11), Balancing-Baseline unverändert (nur `balance-upgrade.test.ts`, eine Zeile
`buyPrice`, R456). Opus-Reviews je Strang erfolgt (T15 M13-E1, T09 UI-GUT-CHIP, Final-Review TOOL-BUENDEL-4).

- **Neu M13-E1 „Edikte der Amtsstube, Betrieb stilllegen“:** Nach dem Bürger-Ziel erlässt der Spieler in der Amtsstube ein
  Edikt (Sparen, Handel, Wohlfahrt; 600 Geld, danach 5 min nicht änderbar). Jeder Betrieb lässt sich stilllegen: halber
  Unterhalt (je Betrieb auf der 100-Tick-Basis aufgerundet), keine Erzeugung, zählt nicht als Problem.
- **Neu I-043 „Gut-Chip zeigt Erzeuger und Verbraucher“:** Klick auf einen Lager-Chip springt zum ersten Erzeuger, hebt
  Erzeuger und Verbraucher hervor; `.`/`,` gehen sie durch; zweiter Klick, `Esc` oder Inselwechsel beendet den Fokus.
- **Bitte testen (nach dem Push):** (1) Amtsstube nach dem Bürger-Ziel: Edikt Sparen erlassen, Kopfzeile Unterhalt sinkt,
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

Keine Nutzer-Aufträge offen. Dauerauftrag R445: bei freier Kapazität eine breite Ideen-Runde (höchstens eine je Session).
**Neues Claude-Gespräch empfohlen** (R438 V4 b).

0. **Push** main (M13-E1, UI-GUT-CHIP, TOOL-BUENDEL-4, Doku; 72+ Commits) nach **Handbuch 1.44**: **keine Umsetzer starten,
   bis `make zeitreserve-push` Exit 0** (R464 V1); `tsc`, `lint`, `zeittests`, `conflicts`, Load ≤ 4, `make check` (zeigt
   `loadStart`), `make zeitreserve-push`, `make check-ci-perf`; `git push origin <geprüfter Hash>:main`; CI, `gh workflow run
Pages --ref main` (Release: Paket-ID **REL-18** vergeben, Release-Notizen oben), `ci.py`. Danach Prozess-Aussensicht
   REL-18 (`studio-process-coach`).
1. **M13-E2** (I-039 „Denkmal als Wahlziel“, R452): Brainstorming/Spec mit `lead-design` (opus); dabei die Seed-Randlage
   Sparen/Handel „arm“ = K′ − 600 (R466 (2)) und den AK-36-Wortlaut (R466 (1)) aufnehmen. Parallel möglich: Denkmal-Sprite
   (`lead-art`, R452 O2) — erst nach dem Push.
2. **Werkzeug-Kandidaten** in `docs/beobachtungen.md` (u. a. `model.py` schneller / Events kürzen — Dashboard bis 80 s alt,
   R469; `testrun` Ctrl-C; `start.sh` fremder Server; Fokus-Regel doppelt `focusList`/`drawFocusMarks`). Auswertung, wenn
   > 30 Einträge (Beobachtungs-Auswertung steht ohnehin an: Einträge seit 2026-10-10 zählen).
3. **Experimente:** E-054 hat 2 von 3 Datenpunkten (Retro 5a00a316); nächster Plan auf sonnet schliesst ab. Messaufträge M1
   (Frist 2026-10-23), M2 (Frist 2026-11-19).
4. **Aufräumen** (eigenes Ruling): gemergte Worktrees `.worktrees/b4`, `m13-e1-sim`, `m13-e1-ui`, `ui-gut-chip` erst nach dem
   Push entfernen (`git worktree remove`, Branches bleiben).
5. **Warteschlange N-99** (Kenntnis R434) offen; ohne Antwort gilt R434.

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

## Parallele Sessions

Keine aktive L0-Session ausser dieser.

## Seit letzter Session erledigt

- REL-16, REL-17, HOTFIX-CI-01, TOOL-BUENDEL-3 live (R463), CI wieder grün; Prozess-Aussensicht REL-16/17 (R464) →
  Handbuch 1.43 (kein Umsetzerstart während eines anstehenden Pushes).
- M13-E1: Gate Plan (R460), Umsetzung Sim T01–T08 und UI T09–T14 mit vier Controllern, Final-Review opus (R466, R467), lokal
  gemergt `b811aca2`.
- I-043 UI-GUT-CHIP: Kurzdesign (R461), Plan auf sonnet (E-054), Gate (R462), Umsetzung T01–T09, Merge `84196941` (R470).
- TOOL-BUENDEL-4: Plan auf sonnet, Gate (R465), Umsetzung, Merge `f8939b29` (R469); Dashboard-Server 100 % → 0 % CPU;
  Handbuch 1.44.
- Kurz-Retro 2026-10-10 (5a00a316).

## Pausierte Pakete

- Keine. Worktrees: Hauptcheckout, `.worktrees/integrate` (detached @ `84196941`), gemergt und aufräumbar nach dem Push:
  `.worktrees/b4` (`tool/b4`), `.worktrees/m13-e1-sim`, `.worktrees/m13-e1-ui`, `.worktrees/ui-gut-chip` (Symlink
  `node_modules`).
- Branch `int/rel-07`, Alt-Branches (u. a. `fix/rel07-a-wood`, `feat/m7-fx`, gemergte `fix/…`, `feat/…`, `tool/…`),
  Remote `wip/r118a-render-aufraeumen` und `stash@{0}` bleiben bis Ruling.

## Budget

Offen: keine Freigaben (Restbudgets M13-E1 ≈ 5, UI-GUT-CHIP 4, TOOL-BUENDEL-4 1 verfallen mit Session-Ende).

## Offene Entscheide

- Nutzer: N-99 (Kenntnis R434), ohne Antwort gilt R434.
- L0: Release-Paket-ID und Umfang des Pushes (Vorschlag REL-18 = M13-E1 + I-043 + TOOL-BUENDEL-4).
