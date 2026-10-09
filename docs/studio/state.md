# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-09 (Session 29c3791b / Entwurf lead-production: REL-10 in main, Push in der nächsten Session)

## Release-Notizen

**REL-10 „Kiefernküste, ruhige Kamera, freie Fahrrinnen" (bereit, Push in der nächsten Session; R389–R391)** —
ART-L8-SELTEN + UI-KAMERA-KLEMMUNG + SEE-F1-KORRIDOR (+ Werkzeug TOOL-TESTLOCK). Lokal in main (80 Commits vor
`origin/main`), nicht gepusht: der Push dieser Session ist verbraucht (R335). Save v9, Sim-Regeln unverändert.

- **Neu:** Strandkiefern an der Kiefernküste, weniger Lichtungen, Bodendeko wechselt neben Neubau nicht mehr die Art;
  Kamera springt bei Fenstergrösse und Bauleiste nicht, Kamerarahmen enger um das Land, Inselsprung zentriert über der
  Bauleiste; Wracks, Felsen und Eilande liegen nicht mehr auf Schiffsrouten.
- **Bitte testen:** (1) Neues Spiel mit Kiefernküste: Strandkiefern sichtbar, Wald mit weniger Lichtungen? (2) Neben
  Neubau wechselt die Bodendeko nicht die Art? (3) Fenster auf 1280×720 ändern, Bauleiste öffnen: Karte springt nicht?
  (4) Scrollen an die Ränder: Land bleibt sichtbar (Rahmenecken bei verstreuten Inseln zeigen noch Wasser, REL-11)?
  (5) Inselsprung `9`/`0`: Insel mittig über der Bauleiste? (6) Schiffsroute anlegen: Wracks, Felsen, Eilande
  nicht auf der Fahrlinie?

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

0. **TOOL-GATES-2** (R392, lead-tech, ≈ 25 Tools) vor dem Push: `zeitreserve` wertet nur die Last vor dem Lauf
   (Vorbedingung: Herkunft der E-043-Faktoren belegen), `make check` bricht bei Konfliktmarkern ab.
1. **Session-End-Push REL-10** gleich danach (neue Session, ein Push, R335): Push-Gate `make test` +
   `make zeitreserve-push` bei Load ≤ 3. Bekannte Kandidaten ohne Reserve: `tests/render/decorSea.test.ts` „L5-T1 Zoom ≤ 0,25
   … Seeds 1–50" (3978 ms / 25 s) und `tests/render/decorStamps.test.ts` „L4-T3 R5 Solitär … Seeds 1–50" (5266 ms / 40 s);
   melden sie bei Load ≤ 4, Trivial-Fix vor dem Push (R391). Danach CI, `gh workflow run Pages --ref main`, `ci.py`.
2. **REL-11-Kandidaten:** ART-MEERESFELS (Blindprobe, R390), UI-KAMERA-RAND (R390), SEE-F3-SCHIFFSKONTRAST,
   Beobachtung Seeplan-Neubau 9 ms.
3. **Retro-Vorschläge** der Session-Retro (inkl. Nachtrag) per Ruling entscheiden:
   `docs/studio/retros/2026-10-08-session-29c3791b-ende.md`.
4. **Experimente** in der Reihenfolge E-038 (ab 2026-10-22), E-048, E-050, E-049, E-044.
5. **Beobachtungen:** BEOB-AUSW fällig (`docs/beobachtungen.md`).

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M12 abgeschlossen** (R352, E5/E6 als Ideen). Live: REL-01…REL-09 (REL-10 in main, Push offen), M1–M8, M10, M11,
  M9-Häppchen, M12. Verfassung **1.2**, Handbuch **1.32**.
- Dauerregeln: Desktop-first (R78); kein Rebase; eine aktive L0-Session je Repo (R129, R324); studioweit ≤ 5 Arbeiter
  (R241); vor Paketstart `git worktree list`, `git status`, fremde Heartbeats prüfen (R329); Messungen nur bei 1-min-Load
  ≤ 4 (R329).
- **TOOL-TESTLOCK aktiv (R380, ersetzt die Lastbremse R357):** `make check`, `make test`, `zeitreserve-push` brechen bei
  belegter Sperre oder 1-min-Load > 8 ab (nicht warten); im Task nur gezielte Läufe; Messläufe haben Vorrang.
  Fake-Schalter (`TESTLOCK_FAKE_LOAD`, `ZEITRESERVE_FAKE_*`) nur in Tests, nie zum Umgehen einer Prüfung (R378).
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

- REL-10 komplett in main und freigegeben (R390): ART-L8-SELTEN (R381), UI-KAMERA-KLEMMUNG (R382), SEE-F1-KORRIDOR
  (R383–R388), TOOL-TESTLOCK (R380), FIX-TESTLOCK-RACE (R387), FIX-ZEITRESERVE-REL10 (R391). Release-Check REL-10 mit
  Blindprobe Meeresfels: Fels wirkt als Boot (R390).
- Davor: REL-09 live (R374), M12 abgeschlossen (R352), Retro M12 (R356), Prozess-Retro REL-08 (R353).

## Pausierte Pakete

- Keine. Worktrees: nur Hauptcheckout und `.worktrees/integrate` (detached @ 246b491).
- Branch `int/rel-07` (lokal; Guard sperrt `-D`, erledigt sich mit Löschen von `origin/int/rel-07` per Ruling),
  nicht gemergte Alt-Branches (u. a. `fix/rel07-a-wood`, `feat/m7-fx`), Remote `wip/r118a-render-aufraeumen` und
  `stash@{0}` bleiben bis Ruling.

## Budget

Kein freigegebenes Budget offen. Überzüge dieser Session gehen an die Session-Retro: ART-L8-SELTEN ≈ 240 gegen 170
(R381), SEE-F1-KORRIDOR bis 220 freigegeben (R388), TOOL-TESTLOCK ≈ 56 von 55 (R380). Neue Pakete brauchen eigene
Freigabe.

## Offene Entscheide

- Nutzer: keine; Warteschlange leer.
- L0: Retro-Vorschläge der Session-Retro; Planung ART-MEERESFELS, UI-KAMERA-RAND, SEE-F3-SCHIFFSKONTRAST (REL-11);
  Ruling zum Löschen von `origin/int/rel-07` und Alt-Branches.
- Info: Actions-Minuten-Hochrechnung des Kontos steht in den Retros (R356); E-044 wartet auf freien Experiment-Platz.
