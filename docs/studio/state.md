# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-10 (Studio-Session ab R434, Ende: REL-14 live; REL-15 und Werkzeug-Bündel 2 lokal auf main, Push offen)

## Release-Notizen

**REL-15 „Klare Abhilfe, ruhiges Schild, saubere Seekarte“ (lokal auf main @ `0cb9bc2`, Gate Merge Release OK R440, Push
offen)** — Save unverändert (v10), Balancing-Test unverändert.

- **Neu:** Haus-Panel nennt einen Mangel nur einmal, darunter direkt die Abhilfe («Baue Kapelle (K) in Reichweite»);
  Cursor-Schild weicht der Mouse-over-Karte und kommt beim Kachelwechsel sofort zurück; Kontor-Marke auf der Seekarte über
  dem Hafenpunkt und an die Pixeldichte gebunden; Speicherleck beim Neustart (Listener) behoben.
- **Bitte testen:** (1) Haus mit fehlender Kapelle: «Mangel: Kapelle fehlt» genau einmal, darunter «Baue Kapelle (K) in
  Reichweite»? (2) Mit dem Auswahlwerkzeug über ein Haus fahren: erst Schild, nach kurzer Zeit nur die Karte, beim Weiterfahren
  wieder das Schild? (3) Seekarte öffnen: Kontor-Marke sichtbar über dem Hafen?

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

Keine Nutzer-Aufträge offen. **Neues Claude-Gespräch empfohlen** (R438 V4 b; Messauftrag L0-Start-Kontext ≤ 60k, R443).

0. **Push** main (REL-15 `0cb9bc2`, Werkzeug-Bündel 2 `9ea9c9e`, Doku) nach **Handbuch 1.40**: `tsc`, `lint`, `zeittests`,
   `conflicts`, `make check` (Load ≤ 4 beim Start), `make zeitreserve-push` (bewertet nur `loadStart`), `make check-ci-perf`;
   `git push origin <geprüfter Hash>:main`; CI, `gh workflow run Pages --ref main` (REL-15 ist ein Release), `ci.py`. Danach
   Prozess-Aussensicht REL-15 (`studio-process-coach`).
1. **TOOL-BUDGET-WARN** (R443 V1/E-055, lead-tech ≈ 20 Tools): Spawn-Hook warnt bei „Budget: n“ ohne `budget`-Zeile.
2. **Beobachtungen auswerten** (BEOB-AUSW-04): seit 2026-10-09 viele neue Einträge (REL-14, REL-15, Werkzeug-Bündel 1/2);
   daraus REL-16-Kandidaten.
3. **Experimente:** E-054 (Pläne auf sonnet) als erster Kandidat für den nächsten freien Platz; laufend E-038, E-049 (nach
   Freigabephase), E-050; E-055 als Werkzeug.
4. **Warteschlange N-99** (Kenntnis R434) offen; ohne Antwort gilt R434.

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M12 abgeschlossen** (R352). Live: REL-01…REL-14, M1–M8, M10, M11, M9-Häppchen, M12; REL-15 und
  Werkzeug-Bündel 2 lokal auf main, Push offen. Verfassung **1.2**, Handbuch **1.40**.
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

- REL-14 + Werkzeug-Bündel live (R434, R436); Prozess-Retro REL-14 (R438) → Handbuch 1.39.
- REL-15 komplett (R435, R437, R440): Kurzdesign, Plan, zwei Stränge, Kandidat, Final-Review opus, Merge lokal `0cb9bc2`.
- Werkzeug-Bündel 2 komplett (R439, R441, R442): Ruff gepinnt und studio-lint grün, E-049 nach Freigabephase,
  `metrics.py --since`, `zeitreserve-push` nur `loadStart`, Hook-Fixes; Merge lokal `9ea9c9e`.
- TOOL-AKTIVIERUNG: Modell-Guard `deny`, `make hooks`, Handbuch 1.38; Handbuch 1.40 (R442 E6). Alle Alt-Worktrees entfernt.
- Kurz-Retro 2026-10-10 (R443).

## Pausierte Pakete

- Keine. Worktrees: Hauptcheckout, `.worktrees/integrate` (detached @ `9ea9c9e`).
- Branch `int/rel-07`, Alt-Branches (u. a. `fix/rel07-a-wood`, `feat/m7-fx`, gemergte `fix/…`, `feat/…`, `tool/…`),
  Remote `wip/r118a-render-aufraeumen` und `stash@{0}` bleiben bis Ruling.

## Budget

Offen: lead-tech REL-15 und TOOL-BUENDEL-2 Restpuffer (verfallen mit Session-Ende). Neue Pakete brauchen eigene Freigabe.

## Offene Entscheide

- Nutzer: N-99 (Kenntnis R434), ohne Antwort gilt R434.
- L0: Auswahl REL-16 nach BEOB-AUSW-04; Experiment-Platz für E-054.
