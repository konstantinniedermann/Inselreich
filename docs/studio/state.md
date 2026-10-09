# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-09 (Session e90e097e, Ende: REL-10 live, REL-11 bereit, UI-SEEKARTE in main)

## Release-Notizen

**REL-12 „Seekarte“ (UI-SEEKARTE in main, Release-Check offen; R405, R406, R408, R409)** — Karte der Inseln mit
Silhouetten, Fahrlinien und Schiffspunkten; Klick springt zur Insel. Lokal in main (Teil des nächsten Pushes), Browser-
Check AK-B1–B5 OK (erstes Rastern 0,3–0,4 ms), Playtest T6 ohne Blocker. Kein Sim-Zustand, nicht im Save.

**REL-11 „Ruhiger Rand, lesbarer Seeweg, Meeresfels“ (bereit, Gate OK R407, Push offen)** — Kamerarand, Schiffssaum,
Meeresfels, Seeplan-Keepout, Kontrast. Lokal in main (61 Commits vor `origin/main`). Save v9, Sim-Regeln unverändert.

- **Neu:** Kamera bleibt über Land (konvexe Hülle um die Inseln, Zoom 0,25 an allen Ecken Land, Inselsprung mittig);
  Schiffe mit hellem Saum auf allen Wasserstufen; Meeresfels wirkt nicht mehr wie ein Boot; Seeplan-Neubau schneller;
  Kontrast in Bedarfs- und Gründe-Listen.
- **Bitte testen:** (1) Scrollen an die Ränder bei Zoom 0,25: Land bleibt sichtbar? (2) Schiff auf Tief-, Mittel-,
  Flachwasser gut zu sehen? (3) Meeresfels: eher Fels als Boot? (4) Fenster auf 1280×720 ändern: Karte springt nicht?
  (5) Seekarte öffnen: Inseln, Fahrlinien, Schiffspunkte; Klick springt zur Insel? (6) Hüllenecken bei Zoom 1 zeigen
  teils nur Wasser (bekannt, R401).

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

Keine Nutzer-Aufträge offen.

0. **Push-Gate nach Handbuch 1.33** für main mit REL-11 und UI-SEEKARTE (R335: ein Push). Variante A: REL-11 allein,
   UI-SEEKARTE „vorab in main“; Variante B: Release-Check REL-12 vor dem Push. Empfehlung: Der Release-Check
   UI-SEEKARTE ist mit T6 erledigt, also beide zusammen als REL-11 + REL-12 pushen. L0 entscheidet in der nächsten
   Session. Ablauf: `tsc` und `lint`, `make test`, warten bis Last ≤ 4, `make zeitreserve-push`, `make check`,
   `make check-ci-perf`; danach CI, `gh workflow run Pages --ref main`, `ci.py`.
1. **Retro-Vorschläge entscheiden:** V1 schnelle Make-Prüfungen in DoD und Vorlauf, V2 Rot-Beleg, V3 E-049 starten
   (`docs/studio/retros/2026-10-09-session-e90e097e-ende.md`). Umsetzung durch den studio-coach nach Ruling.
2. **Kandidaten aus `docs/beobachtungen.md`:** Inspektor „Versorgt ✓“ plus „Mangel“, Fels-Mindestgrösse bei Zoom 0,25
   (`FAR_MIN_CSS_PX`), TOOL-RENDERQA-NACHZUG-Rest.
3. **Wirtschafts-Brainstorming I-028** (Steuer je Stufe, R405; lead-design mit design-economy-designer).
4. **Experimente:** E-038 ab 2026-10-22, E-048 wartet auf Platz. Laufend: E-037, E-042, E-046.
5. **Aufräumen** (Ruling nötig, sofern der Guard es erlaubt): Scratch-Worktree unter dem Scratchpad, erledigte
   Worktrees und Branches.

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M12 abgeschlossen** (R352, E5/E6 als Ideen). Live: REL-01…REL-10, M1–M8, M10, M11, M9-Häppchen, M12; REL-11 und
  REL-12 in main, Push offen. Verfassung **1.2**, Handbuch **1.33**.
- Dauerregeln: Desktop-first (R78); kein Rebase; eine aktive L0-Session je Repo (R129, R324); studioweit ≤ 5 Arbeiter
  (R241); vor Paketstart `git worktree list`, `git status`, fremde Heartbeats prüfen (R329); Messungen nur bei 1-min-Load
  ≤ 4 (R329).
- **TOOL-TESTLOCK aktiv (R380, ersetzt die Lastbremse R357):** `make check`, `make test`, `zeitreserve-push` brechen bei
  belegter Sperre oder 1-min-Load > 8 ab (nicht warten); im Task nur gezielte Läufe; Messläufe haben Vorrang.
  Fake-Schalter (`TESTLOCK_FAKE_LOAD`, `ZEITRESERVE_FAKE_*`) nur in Tests, nie zum Umgehen einer Prüfung (R378).
- **GitHub Actions mit Sparregeln (R334):** `CI` ignoriert Doku-Pushes, `Pages` nur per
  `gh workflow run Pages --ref main` beim Release, `CI` mit `cancel-in-progress`.
- **Höchstens ein Push pro Session (R335)**, am Session-Ende durch den Integrator. **Push-Gate mit Messdatei (R362,
  ersetzt R348):** `tsc` und `lint`, `make test` bei Load ≤ 3, danach warten bis Last ≤ 4 (R396), `make zeitreserve-push` (Commit = HEAD, `loadStart` ≤ 4, R394), `make check`,
  `make check-ci-perf` (statt `CI=true make check`). Merges nach Gate bleiben lokal.
- **Release-Check mit Smoke-Skript (R368)** vor dem Browser-Lauf. **Konflikt-Probe** `git merge-tree` vor jedem
  Integrator-Start (Handbuch 1.30).

## Parallele Sessions

Keine.

## Seit letzter Session erledigt

- REL-10 live (R398): Push `7812eb0..5d14854` nach vier Anläufen (R394, R396, R397); TOOL-GATES-2 und 2b (R393–R395),
  FIX-TIMEOUT-REL10, FIX-CONFLICTS-TSC. Handbuch 1.33 (DoD-Zeile `tsc`, Integrator-Vorlauf).
- REL-11 komplett in main, Release-Check OK (R407): UI-Strang (R401), Render-Strang (R402, R403), Ideen-Runde IDEEN-04
  (R405).
- UI-SEEKARTE in main (R408, R409). Retro-Datei: `docs/studio/retros/2026-10-09-session-e90e097e-ende.md`.

## Pausierte Pakete

- Keine. Worktrees: Hauptcheckout, `.worktrees/integrate` (detached), erledigt und löschbar: `art-meeresfels`,
  `rel11-kamera`, `rel11-triv`, `render-seeplan-keepout`, `see-f3-schiffskontrast`, `ui-seekarte`, dazu ein
  Scratch-Worktree unter dem Scratchpad (Detached HEAD auf main). Aufräumen nur per Ruling.
- Branch `int/rel-07` (lokal; Guard sperrt `-D`, erledigt sich mit Löschen von `origin/int/rel-07` per Ruling),
  nicht gemergte Alt-Branches (u. a. `fix/rel07-a-wood`, `feat/m7-fx`), Remote `wip/r118a-render-aufraeumen` und
  `stash@{0}` bleiben bis Ruling.

## Budget

Kein freigegebenes Budget offen: alle Freigaben dieser Session sind verbraucht oder abgeschlossen (REL-11 Render
12 Starts, REL-11 UI 12 Starts, UI-SEEKARTE 10 Starts, IDEEN-04 1 von 2 Starts). Neue Pakete brauchen eigene Freigabe.

## Offene Entscheide

- Nutzer: keine; Warteschlange leer.
- L0: Push-Variante (Fortsetzung 0); Retro-Vorschläge V1–V3; Kandidaten REL-13 (Fortsetzung 2, 3); Ruling zum
  Aufräumen von Worktrees, `origin/int/rel-07` und Alt-Branches.
- Info: Actions-Minuten Monat 934, Konto 1201 von 2000 (Retro e90e097e); E-044 wartet auf freien Experiment-Platz.
