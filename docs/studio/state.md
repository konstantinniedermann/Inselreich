# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-09 (Session c64c0775, Ende: REL-13 live; REL-14 und Werkzeug-Bündel lokal auf main @ `4ee91a7`, Push offen)

## Release-Notizen

**REL-14 „Klarer Inspektor, Fest je Insel“ (lokal auf main @ `ed547b0`, Gate Merge Release OK R430, Push offen)** —
Haus-Inspektor in der Wortfamilie „Versorgung“; Fest wirkt nur auf Häuser der Kapellen-Insel. Save unverändert (v10),
Balancing-Test unverändert.

- **Neu:** Chip «Im Versorgungsradius» / «Ausserhalb der Versorgung»; Mangel nur «Mangel: … fehlt», Zeile «Fehlt:» entfällt;
  Hover und Cursor-Hinweis sagen dasselbe («Kapelle fehlt», «zufrieden»); Fest einer Kapelle wirkt nicht mehr auf Häuser
  einer Fremdinsel mit gleichen Koordinaten.
- **Bitte testen:** (1) Haus ausserhalb des Markt-/Kontorradius anklicken: Chip rot «Ausserhalb der Versorgung», kein
  «Versorgt»? (2) Haus im Radius ohne Nahrung: Chip grün «Im Versorgungsradius» und «Mangel: Nahrung fehlt», ohne
  Widerspruch? (3) Mit einer Kolonie: Fest daheim lässt Kolonie-Häuser unbeeinflusst?

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

Keine Nutzer-Aufträge offen.

0. **Push** main @ `4ee91a7` + Doku-Commits (REL-14, Werkzeug-Bündel) nach **Handbuch 1.37**: `tsc`, `lint`, `zeittests`,
   `conflicts`, `make check` (Load ≤ 4 beim Start, sonst später neu), warten bis Last ≤ 4, `make zeitreserve-push`,
   `make check-ci-perf`; Push per `git push origin <geprüfter Hash>:main`; CI, `gh workflow run Pages --ref main`
   (REL-14 ist ein Release), `ci.py`. Danach Prozess-Aussensicht REL-14 (`studio-process-coach`, R127/R316).
1. **TOOL-AKTIVIERUNG** (studio-coach, R428/R432): Kopfzeilen-Syntax `Modell: <alias> (<Einsatz>)` in
   `templates/briefing.md` und `STUDIO.md`, `make hooks` im Hauptcheckout (Prettier-Hook), Modell-Guard
   `tools/studio/modelguard.py` von `warn` auf `deny` (Rückweg ADR-014); Ampelzeile E-038 im Dashboard.
2. **Kurz-Retro c64c0775** auswerten (`docs/studio/retros/2026-10-09-session-c64c0775-ende.md`), Vorschläge per Ruling.
3. **Beobachtungen:** neue Einträge im Abschnitt „Offen“ (u. a. studio-lint 28 Ruff-Altfehler, Dienst-Mangel-Wortlaut in
   der Aufstiegsliste, Hover verdeckt Cursor-Hinweis, Hook-Wrapper ohne `python3`); bei Bedarf Auswertung BEOB-AUSW-04.
   REL-15-Kandidat: UI-SEEKARTE-NACHZUG (R422).
4. **Worktree `see-f3-schiffskontrast`:** Ruling, ob der Testcache `.vitest/` per `rm -r` gelöscht und der Worktree dann
   ohne `--force` entfernt wird (R431).

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M12 abgeschlossen** (R352). Live: REL-01…REL-13, M1–M8, M10, M11, M9-Häppchen, M12; REL-14
  und Werkzeug-Bündel (ADR-014) lokal auf main, Push offen. Verfassung **1.2**, Handbuch **1.37**.
- Dauerregeln: Desktop-first (R78); kein Rebase; eine aktive L0-Session je Repo (R129, R324); studioweit **≤ 8 Agenten,
  davon ≤ 2 Browser-Läufe** (R424, ersetzt R241); vor Paketstart `git worktree list`, `git status`, fremde Heartbeats
  prüfen (R329); Messungen nur bei 1-min-Load ≤ 4 (R329).
- **TOOL-TESTLOCK aktiv (R380):** `make check`, `make test`, `zeitreserve-push` brechen bei belegter Sperre oder
  1-min-Load > 8 ab (nicht warten); im Task nur gezielte Läufe; Messläufe haben Vorrang; meldet jetzt verwaiste
  Vitest-Worker. Fake-Schalter nur in Tests (R378).
- **GitHub Actions mit Sparregeln (R334):** `CI` ignoriert Doku-Pushes, `Pages` nur per `gh workflow run Pages --ref
main` beim Release, `CI` mit `cancel-in-progress`.
- **Höchstens ein Push pro Session (R335)**, nach Abschluss des zu pushenden Stands, immer per geprüftem Hash (Handbuch
  1.37, R429). Push-Gate ohne separates `make test` (Messdatei aus `make check`). Merges nach Gate bleiben lokal.
- **Rulings** mit Pflichtfeldern „Regelbezug“ und „Kosten bei Irrtum“; Abweichung vom Handbuch → Handbuch-Minor im selben
  Zug (R429). Ein-Paket-Release: Gate Merge und Release-Check in einem `lead-qa`-Start.
- **Modell-Guard** (`modelguard.py`, Modus `warn`) prüft Agent-Starts gegen die Modelltabelle in STUDIO.md; Modell nur
  nach dieser Tabelle (R420). `make docs-check` Exit 0 vor Doku-Commits, bis `make hooks` aktiv ist.

## Parallele Sessions

Keine aktive L0-Session ausser dieser. Prozess „anno-clone #3“ lief beim Start dieser Session nicht mehr.

## Seit letzter Session erledigt

- REL-13 live (R421, R425): Push `3417346..46153c6`, CI und Pages grün.
- REL-14 komplett (R422–R424, R427, R430, R431): Kurzdesign, Urteil lead-art (Meeresfels bleibt, R423), Plan, Umsetzung in
  zwei Strängen, Playtest, Kandidat, Final-Review opus, Merge lokal `ed547b0`.
- Werkzeug-Bündel komplett (R428, R432): Prettier-Pre-Commit-Hook, Modell-Guard (warn), Phantom-Vorfälle ausgeblendet,
  Testsperre meldet Waisen, Smoke-Etikett aus der Quelle, E-049-Zeile; ADR-014; Merge lokal `4ee91a7`.
- Release-Retro REL-13 (R429) → Handbuch 1.37. CLEANUP-WT-2: 7 von 8 Alt-Worktrees entfernt (R425, R426, R431).

## Pausierte Pakete

- Keine. Worktrees: Hauptcheckout, `.worktrees/integrate` (detached @ `4ee91a7`), `see-f3-schiffskontrast` (nur
  `?? .vitest/`, Fortsetzung 4).
- Branch `int/rel-07`, Alt-Branches (u. a. `fix/rel07-a-wood`, `feat/m7-fx`, gemergte `fix/…`, `feat/…`, `tool/buendel-*`),
  Remote `wip/r118a-render-aufraeumen` und `stash@{0}` bleiben bis Ruling.

## Budget

Offen: lead-tech TOOL-BUENDEL 4 Puffer-Starts (verfallen mit Session-Ende). Neue Pakete brauchen eigene Freigabe.

## Offene Entscheide

- Nutzer: keine; Warteschlange leer.
- L0: Ruling zu Fortsetzung 4 (see-f3); Vorschläge der Kurz-Retro c64c0775.
