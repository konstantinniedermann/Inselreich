# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-09 (Session fb37ceac, Ende: REL-11 + REL-12 live, REL-13 „Steuer je Stufe“ in main, Gate OK, Push offen)

## Release-Notizen

**REL-13 „Steuer je Stufe“ (I-028 in main @ `d7291aa`, Gate Merge Release OK R419, Push offen)** — Steuer in der
Amtsstube getrennt für Pioniere, Siedler, Bürger und Kaufleute; Save **v10** (Migration aus v9: alle vier = bisheriger
Wert, «niedrig» → Kaufleute «normal»). Wertänderung Kaufleute «hoch» 115 % statt 130 % (R412). Balancing-Test unverändert.

- **Neu:** Raster in der Amtsstube (vier Stufen × niedrig/normal/hoch plus Zeile «alle Stufen»); Sperre nach dem
  Umschalten je Regler; Kaufleute «niedrig» gesperrt (Tooltip); Kopfzeilen-Knopf zeigt «gemischt»; Hinweise nennen die Stufe.
- **Bitte testen:** (1) Pioniere auf «niedrig», Kaufleute auf «hoch»: Steigen Pioniere schneller auf, Einnahmen plausibel?
  (2) Kopfzeile zeigt «gemischt» und im Tooltip die vier Stufen? (3) Alten Spielstand (v9) laden: Regler stehen auf dem
  bisherigen Wert? (4) Kaufleute-«niedrig» ist ausgegraut und erklärt?

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

Keine Nutzer-Aufträge offen.

0. **Push REL-13** (plus Doku-Commits dieser Session) nach Handbuch 1.35: `tsc`, `lint`, `zeittests`, `conflicts`,
   `make test`, warten bis Last ≤ 4, `make zeitreserve-push`, `make check`, `make check-ci-perf`; CI, `gh workflow run
Pages --ref main`, `ci.py`. Vorher prüfen: keine verwaisten Vitest-Worker (`ps`, PPID 1), Session „anno-clone #3“.
1. **Werkzeug-Bündel** (R417 V2, R420): **TOOL-PRETTIER-HOOK** Prettier-Check geänderter Dateien beim `git commit`, < 3 s, Ablehnung ins Event-Log;
   Werkzeug-Pflichtzeilen R375; dabei Smoke-Etikett „Save v9“ (`tools/render-qa/smoke.mjs:466`) mitnehmen;
   **TOOL-MODELL-GUARD** (Guard prüft typisierte Starts gegen die Modelltabelle, E-038); **TOOL-STUDIO-HYGIENE**
   (Phantom-Inaktiv-Vorfälle ausblenden, verwaiste Vitest-Worker melden); `efficiency.py` auf E-049 umstellen.
2. **REL-14-Kandidaten** (BEOB-AUSW-03, `docs/beobachtungen.md` „Ausgewertet 2026-10-09 (2)“): UI-INSPEKTOR-KLARTEXT (S),
   SIM-FEST-INSEL (S, mit UI-INSELFILTER bündelbar), ART-FELS-FERNGROESSE (S, Urteil lead-art); Trivial-Fixes `.vitest/`
   in `.gitignore`, arc42 `hud.ts`-Zeile „Steuersperre“.
3. **Aufräumen CLEANUP-WT-2** (Ruling nötig): gemergte Worktrees inkl. `steuer-je-stufe`, Scratch-Worktree aus e90e097e,
   `.worktrees/check2.log`.
4. **Experimente (R420):** laufend E-038, E-049, E-050; E-048 wartet. **Modell nur nach der Modelltabelle** in STUDIO.md
   (Leads als Controller, Gate-Urteile lead-qa/lead-production, Kurz-Retro: `sonnet`).

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M12 abgeschlossen** (R352, E5/E6 als Ideen). Live: REL-01…REL-12, M1–M8, M10, M11, M9-Häppchen, M12; REL-13 (I-028)
  in main, Push offen. Verfassung **1.2**, Handbuch **1.36**.
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
- **Handbuch 1.35 (R417):** Plan-Briefings mit Formatzeile E-010; neue AK-Nummern vergibt L0 im Gate-Spec-Ruling;
  Leistungs-AK mit deterministischem Test ohne Browser-Messung; `make docs-check` Exit 0 vor jedem Doku-Commit (bis
  TOOL-PRETTIER-HOOK).

## Parallele Sessions

Keine aktive L0-Session ausser dieser. Prozess „claude --name anno-clone #3“ (seit 2026-10-08) lebt noch; beim Start
prüfen, ob er arbeitet (R324), nicht beenden.

## Seit letzter Session erledigt

- REL-11 + REL-12 live (R413, R416): Push `5d14854..3417346` nach einem Lint-Abbruch (Prettier, Trivial-Fix `4806006`).
- I-028 „Steuer je Stufe“ komplett: Brainstorming (R412), Spec mit 42 AK (R414), Plan nach E-010 (R415, R416), Umsetzung
  T1a/T1b/T2 mit Reviews, Playtest, Final-Review opus, Merge lokal `d7291aa` (R418), Release-Check REL-13 OK (R419).
- Release-Retro REL-12 (R417) → Handbuch 1.35; Session-Retro fb37ceac (R420) → Handbuch 1.36. Beobachtungen ausgewertet und archiviert (BEOB-AUSW-03,
  `docs/beobachtungen-archiv.md`). Verwaister Vitest-Worker beendet (Beobachtung).

## Pausierte Pakete

- Keine. Worktrees: Hauptcheckout, `.worktrees/integrate` (detached), erledigt und löschbar: `art-meeresfels`,
  `rel11-kamera`, `rel11-triv`, `render-seeplan-keepout`, `see-f3-schiffskontrast`, `ui-seekarte`, `steuer-je-stufe`,
  Scratch-Worktree aus e90e097e. Aufräumen nur per Ruling (CLEANUP-WT-2).
- Branch `int/rel-07`, Alt-Branches (u. a. `fix/rel07-a-wood`, `feat/m7-fx`), Remote `wip/r118a-render-aufraeumen` und
  `stash@{0}` bleiben bis Ruling.

## Budget

Offen: lead-tech I-028 3 Puffer-Starts (verfallen mit Session-Ende), lead-qa REL-13 1 Start (verfällt). Neue Pakete
brauchen eigene Freigabe.

## Offene Entscheide

- Nutzer: keine; Warteschlange leer.
- L0: Auswahl REL-14 (Fortsetzung 2); Ruling CLEANUP-WT-2.
