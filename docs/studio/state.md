# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-11 (Studio-Session f2a404fd, R537–R552; Ende: M13-Inhalt vollständig; lokal auf main @ `24ba6d03` (nicht gepusht; Sicherung `origin/backup/main-lokal` @ `24ba6d03`); Release M13 frühestens 2026-10-12)

## Release-Notizen

**M13 „Spätspiel mit Richtung“ (bereit, nicht gepusht, R549/R552)** — Entwurf. Save v12. Inhalt: M13-E2 Denkmal, I-049
Sperrbestand, I-048 Schritt A (Mechanik eingebaut, **inaktiv**: Anzeige «Kauf 100 %», kein Aufschlag), UI-TEXTE-1,
UI-NAECHSTER-SCHRITT, TOOL-Bündel 6–8, E-060 (Budget-Hook `deny`). Actions-Prognose rot: ein Push je Tag.

- **Neu:** Denkmal als Spätspiel-Ziel; Sperrbestand je Gut (I-049); Zukauf-Anzeige «Kauf 100 %» (noch ohne Preiswirkung);
  einheitliche UI-Texte (u. a. «Nur einmal je Insel»); Hinweis zum nächsten Schritt.
- **Bitte testen:** (1) Denkmal bauen und Sieg-/Ziel-Anzeige; (2) Sperrbestand setzen, Lager-Chip; (3) Handelsfenster
  zeigt «Kauf 100 %»; (4) alter Spielstand (v11) lädt; (5) Tooltip Amtsstube: «Nur einmal je Insel».

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

Keine Nutzer-Aufträge offen. Daueraufträge: R445, R475. **Actions-Prognose ROT:** höchstens ein Push je Tag (REL-19 am
2026-10-11). Release-Sperre endet mit UI-TEXTE-1 (R549/R552); M13-Inhalt ist vollständig.

1. **Release M13** am 2026-10-12: `make push-check`, dann `git push origin <Hash>:main` (geprüfter Hash), Pages per
   `gh workflow run Pages --ref main`; Release-Notiz aus dem Entwurf oben. Danach `origin/backup/main-lokal` nachführen
   (Löschen remote ist Guard-verboten).
2. Meilenstein-Retro M13 (`studio-coach` opus) und Prozess-Aussensicht nach dem Release (R127, R316).
3. Ideen-Runde nach dem Release (R445, 3 Scouts).
4. **I-048 Schritt B** als Designfrage (R551, `lead-design` mit M14-Vorlauf) und robustere Gate-Messung (Beobachtung
   „Seed wirkt nicht“; Controller-Phasen oder Startvarianten, Median).
5. Plan **M14-E1** nach M13 (R486, Auflagen R500/R501).
6. Retro-Vorschläge f2a404fd: V1 Gate-Frage Robustheit, V2 Delta-Review nach Final-Review ZURÜCK (Handbuch-Minor),
   V3 beobachten — L0-Ruling ausstehend ([Retro](retros/2026-10-11-session-f2a404fd-ende.md)).
7. Experimente: E-057, E-060 (`deny`, Messung ab 2026-10-11), E-061 laufend; E-059 passiv; E-062 wartet auf Platz
   (Messauftrag Plan-Instanzen > 60 Turns geht auf die nächste Plan-Session).

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M12 abgeschlossen** (R352). Live: REL-01…REL-19, M1–M8, M10, M11, M9-Häppchen, M12. **M13 „Spätspiel mit Richtung“**: E1 (Edikte, Stilllegen)
  lokal auf main (R467), E2 (Denkmal) lokal gemergt, Inhalt vollständig (R552). Verfassung **1.2**, Handbuch **1.50**.
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

- Nichts (Session-Ende f2a404fd).

## Parallele Sessions

- Nutzer-Session `c6709a04` (seit 2026-10-11 ≈ 08:30Z): Konzept „Erweiterung“ (`lead-design`), Worktree
  `.worktrees/erweiterung-1`, Branch `design/erweiterung-1` — geduldet, Deckel geteilt (R519). Nicht anfassen.

## Seit letzter Session erledigt

- Lokal gemergt (Gate OK): M13-E2 (ART, UI, Denkmal), I-049 (Sim, UI R544), I-048 Sim/UI (R537, R545), TOOL-BUENDEL-7/8
  (R540/R541), TOOL-E060-FIX (R546), UI-TEXTE-1 (R552). Budget-Hook `deny` (E-060, R546).
- I-048 Schritt B angehalten (R549), Probe Totzone ohne Formel (R551); `feat/i048-b` geparkt.
- Retro: [session-f2a404fd-ende](retros/2026-10-11-session-f2a404fd-ende.md) (V1–V3 offen).

## Pausierte Pakete

- `.worktrees/i048-b` (`feat/i048-b` @ `bc57f8ba`): geparkt (R549), kein Merge; Messweg `trackedBuy` wiederverwendbar.
- Gemergte, aufräumbare Worktrees (nur per Ruling, `git worktree remove` ohne `--force`): `i048-sim`, `i048-ui`, `i049-sim`,
  `i049-ui`, `tool-b7`, `tool-b8`, `tool-e060`, `ui-texte-1`. `.worktrees/integrate` bleibt.
  `.worktrees/erweiterung-1` gehört der Nutzer-Session (R519) — nicht anfassen.
- Branch `int/rel-07`, Alt-Branches, Remote `wip/r118a-render-aufraeumen` und `stash@{0}` bleiben bis Ruling.

## Budget

Offen: keine Freigaben (Restbudgets verfallen mit Session-Ende).

## Offene Entscheide

- Nutzer: N-99 (Kenntnis R434), ohne Antwort gilt R434.
- L0: Retro-Vorschläge V1–V3 (siehe Fortsetzung Punkt 6).
