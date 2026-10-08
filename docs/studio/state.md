# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-08 (Session 29c3791b / Entwurf lead-production: REL-09 live mit dem Session-End-Push)

## Release-Notizen

**REL-09 „Sichere Seewege, klarere Küsten, ruhigere Bauleiste" (live mit dem Session-End-Push, R374)** —
SEE-F2-UX + SEE-F1-FAHRLINIE + ART-WALD-RAUTEN + UI-PANEL-AUFRAEUMEN. Save v9, Sim-Regeln unverändert.

- **Neu:** Klick auf das Heimatkontor zeigt die Schiffe; Meldung „Spielstand aus neuerer Version"; Hinweis auf das dritte
  Ziel; Schiffe fahren nur noch über Wasser (Route um Inseln); Wald-, Sand- und Küstenkanten ohne Rautenmuster;
  Meeresfelsen ohne Bootform; Bauleiste als Overlay, die Karte bleibt gleich hoch.
- **Bitte testen:** (1) Schiffsroute zur Fremdinsel anlegen: fährt das Schiff um Inseln statt über Land? (2) Klick auf
  das Heimatkontor: Schiffe erscheinen? (3) Bauleiste bei 1280×720: Kategorie öffnen, Karte springt nicht, südlichste
  Kachel bleibt bebaubar, Klicks gehen nicht durchs Overlay. (4) Küsten- und Waldbild in mehreren neuen Spielen: keine
  Rauten, Meeresfelsen sehen nicht wie Boote aus? (5) Schiffe nahe an Meeresfelsen: wirken Abstände in Ordnung (Korridor
  folgt in REL-10)?

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

1. **ART-L8-SELTEN fortsetzen** (Worktree `.worktrees/l8-selten`, Branch `feat/l8-selten`) über das Handoff
   `.studio/handoffs/2026-10-08-lead-art-lead-art.md`: Kaltstart-A/B, Quotenlauf (Werkzeug unter `tools/render-qa/`),
   Playtest, Final-Review auf `opus`, dann Merge-Gate. Gehört zu **REL-10**.
2. **SEE-F1-KORRIDOR** (R369) und **UI-KAMERA-KLEMMUNG** (R374, mit Kamerarahmen-Befund, `seaRoute`-Arrays, arc42 zu
   `visibleViewHeight`) planen (lead-tech).
3. **SEE-F3-SCHIFFSKONTRAST** (Board-Vorlage, R352) planen.
4. **Retro-Vorschläge** der Session-Retro entscheiden:
   `docs/studio/retros/2026-10-08-session-29c3791b-ende.md` (per Ruling).
5. **E-048, dann E-049, dann E-044** warten auf einen freien Experiment-Platz (R356).
6. **Beobachtungen:** viele neue Einträge seit 2026-10-08 in `docs/beobachtungen.md`: BEOB-AUSW fällig.

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M12 abgeschlossen** (R352, E5/E6 als Ideen). Live: REL-01…REL-09, M1–M8, M10, M11,
  M9-Häppchen, M12. Verfassung **1.2**, Handbuch **1.30**.
- Dauerregeln: Desktop-first (R78); kein Rebase; eine aktive L0-Session je Repo (R129, R324); studioweit ≤ 5 Arbeiter
  (R241); vor Paketstart `git worktree list`, `git status`, fremde Heartbeats prüfen (R329); Messungen nur bei 1-min-Load
  ≤ 4 (R329).
- **Lastbremse (R357):** studioweit ein voller Testlauf zugleich (`make check`, `make test`, `zeitreserve-push`) nur bei
  1-min-Load ≤ 8, vorher `pgrep -fl 'vitest run'`; im Task nur gezielte Läufe; Messläufe haben Vorrang.
- **GitHub Actions mit Sparregeln (R334):** `CI` ignoriert Doku-Pushes, `Pages` nur per
  `gh workflow run Pages --ref main` beim Release, `CI` mit `cancel-in-progress`.
- **Höchstens ein Push pro Session (R335)**, am Session-Ende durch den Integrator. **Push-Gate mit Messdatei (R362,
  ersetzt R348):** `make test` bei Load ≤ 3, `make zeitreserve-push` (Commit = HEAD, Load ≤ 4), `make check`,
  `make check-ci-perf` (statt `CI=true make check`). Merges nach Gate bleiben lokal.
- **Release-Check mit Smoke-Skript (R368)** vor dem Browser-Lauf. **Konflikt-Probe** `git merge-tree` vor jedem
  Integrator-Start (Handbuch 1.30).

## Parallele Sessions

Keine.

## Seit letzter Session erledigt

- M12 abgeschlossen (R352), Retro M12 (R356), Prozess-Retro REL-08 (R353).
- Werkzeug: TOOL-E046-E047, TOOL-E046-SESSION, TOOL-ZEITRESERVE-META, TOOL-SMOKE; Handbuch-Paket HB-E048 (R351).
- REL-09 gemergt und freigegeben (R374): SEE-F2-UX, ART-WALD-RAUTEN + FIX-RAUTEN-ZEIT, SEE-F1-FAHRLINIE +
  FIX-SEE-F1-ZEIT, UI-PANEL-AUFRAEUMEN.

## Pausierte Pakete

- **ART-L8-SELTEN:** Worktree `.worktrees/l8-selten` (`feat/l8-selten` @ 9d85a1f), pausiert wegen Messläufen vor dem Push;
  nächster Schritt siehe Fortsetzung 1. Daneben Hauptcheckout und `.worktrees/integrate` (detached @ a578d72).
- Branch `int/rel-07` (lokal; Guard sperrt `-D`, erledigt sich mit Löschen von `origin/int/rel-07` per Ruling),
  nicht gemergte Alt-Branches (u. a. `fix/rel07-a-wood`, `feat/m7-fx`), Remote `wip/r118a-render-aufraeumen` und
  `stash@{0}` bleiben bis Ruling.

## Budget

Kein freigegebenes Budget offen ausser ART-L8-SELTEN (170 Tools, R366; Ist laut Handoff). Überzüge dieser Session
(u. a. SEE-F1 ≈ 320 gegen 120 + 60 + 30, R369) gehen an die Session-Retro. Neue Pakete brauchen eigene Freigabe.

## Offene Entscheide

- Nutzer: keine; Warteschlange leer.
- L0: Retro-Vorschläge der Session-Retro; Planung SEE-F1-KORRIDOR, UI-KAMERA-KLEMMUNG, SEE-F3-SCHIFFSKONTRAST;
  Ruling zum Löschen von `origin/int/rel-07` und Alt-Branches.
- Info: Actions-Minuten-Hochrechnung des Kontos steht in den Retros (R356); E-044 wartet auf freien Experiment-Platz.
