# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-13 (Studio-Session 6584aaa4, R578–R599, laufend: REL-20 live `0d1db8f3`; UI-HAEPPCHEN-A/B + I-047 (Save v14) lokal auf main @ `0a19ad53`, REL-21 offen; TOOL-BUENDEL-11 und DOC-ARCHIV in Arbeit)

## Release-Notizen

**REL-20 „Inselcharakter“ (live, R594/R595)** — Push `19683ddf..0d1db8f3`, CI 38429087293, Pages 38429091182 grün. Dazu TOOL-ZEITRESERVE-M14. Save **v13** (Migration v12→v13). Inhalt: M14-E1
(Felsbucht «Gebirge+», dritte Fremdinsel Weidenau «Fruchtbar», Trait-Anzeige), UI-AUFRAEUM-2 (Refactor ohne Spieländerung),
TOOL-CONTROLLER-HAERTUNG, TOOL-BUENDEL-9 (nur Werkzeug/Tests). Opus-Final-Reviews je Strang OK.

- **Neu:** Felsbucht ist «Gebirge+» (Steinbruch und Glashütte ×2); neue Fremdinsel «Weidenau», «Fruchtbar» (Zuckerrohr und
  Schäferei ×2); Seekarte, Tooltip, Inspektor und Bauleiste nennen die Inselstärke.
- **Bitte testen:** (1) Seekarte: drei Fremdinseln, Tooltip nennt Stärke; (2) Steinbruch auf der Felsbucht erzeugt doppelt;
  (3) Zuckerrohr auf Weidenau doppelt; (4) alter Spielstand (v12) lädt, Felsbucht/Weidenau vorhanden; (5) Denkmal-Banner
  und Pause wie bisher.

**M13 „Spätspiel mit Richtung“ (REL-M13, live, R564)** — Push `801bee89..19683ddf`, CI 38212898470, Pages 38213478460 grün. Save v12. Inhalt: M13-E2 Denkmal, I-049
Sperrbestand, I-048 Schritt A (Mechanik eingebaut, **inaktiv**: Anzeige «Kauf 100 %», kein Aufschlag), UI-TEXTE-1,
UI-NAECHSTER-SCHRITT, TOOL-Bündel 6–8, E-060 (Budget-Hook `deny`). Actions-Prognose rot: Push-Takt nach Live-Ampel (R565 P4).

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

Zwischenstand Session 6584aaa4 (R578–R609; Nutzerauftrag: Wochenlimit ignorieren, R578). Daueraufträge: R445, R475.
**Neues Claude-Gespräch empfohlen** (R438 V4 b). Ein Push je Session (R335); «push-bereit» = `make push-check`-Schwelle (R598 V2).

1. **Push REL-21** (Release-Check OK R603/R605): main lokal ab `67661df1`+ enthält UI-HAEPPCHEN-A, -B, I-047 (Save **v14**),
   DOC-ARCHIV, TOOL-BUENDEL-11, IDEEN-09. Integrator: `make push-check` im Worktree `.worktrees/integrate` (Exit 1 bei ruhiger Last =
   Substanz, nicht wiederholen, R598 V3), Push per geprüftem Hash, Pages, `backup/main-lokal`. N-100 (Dropbox pausieren) offen.
2. **UI-HAEPPCHEN-C** (I-088 + I-090, Gate R607): Umsetzung läuft/lief in `.worktrees/ui-haeppchen-c` (`feat/ui-haeppchen-c`);
   Schlussbericht → Gate Merge → lokaler Merge.
3. **I092 Inselmarkt-Vorliebe** (Gate Spec R609, Spec `design/i092` @ `f5dec181`, Plan `plan/i092` @ `39859bbc`): Kombiniertes
   Gate (lead-qa) offen; danach Controller (8 Starts beantragt), vorher `design/i092` in `plan/i092` mergen.
4. Danach I-100 «Neu»-Zähler (R606), UI-Aufräum-Sammelpaket (I-089, I-098 Rechtsklick wie Esc, I-099, Kleinbefunde REL-21).
5. Ende-Routine offen: `studio-coach` setzt R588 V1, R598 V1–V3, R599 (4), R602-Vermerk, Einzeiler `make zeitreserve-gate` in
   gates.md/Handbuch um; E-060 bewerten → E-064/E-065 nachrücken; Cache-Write-Hebel lead-tech (Pflicht).
6. Erweiterung 1 «Stände und Segel» bleibt in der Nutzer-Session; beim Merge jener Branch: Save-Nummer (v14 belegt durch I-047, R583),
   Pflichtfeld `prefers` in `IslandDef` (I-092, R609).

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M13 abgeschlossen** (live, R564). Live: REL-01…REL-19, M1–M8, M10, M11, M9-Häppchen, M12, M13. **M14 „Archipel mit Wert“**: E1 Inselcharakter
  lokal auf main (R574, Save v13), Release REL-20 offen. Verfassung **1.2**, Handbuch **1.53**.
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

- Nichts (Session-Ende 1a73e6c1).

## Parallele Sessions

- Nutzer-Session `c6709a04` (seit 2026-10-11 ≈ 08:30Z): Konzept „Erweiterung“ (`lead-design`), Worktree
  `.worktrees/erweiterung-1`, Branch `design/erweiterung-1` — geduldet, Deckel geteilt (R519). Nicht anfassen.

## Seit letzter Session erledigt

- **Live:** Release M13 (R564, CI 38212898470, Pages 38213478460).
- **Lokal gemergt (Gate OK):** TOOL-CONTROLLER-HAERTUNG (R568, `1a00eb61`), M14-E1 Inselcharakter (R574, `9b5fc2b7`, Save v13),
  TOOL-BUENDEL-9 (R575, `d7f68071`), UI-AUFRAEUM-2 (R576, `bdeb04c1`).
- **Entschieden:** Retro M13 + Prozess-Aussensicht (R565 → Handbuch 1.52, 1.53 «Live-Ampel»); IDEEN-08 (R566, Pool 36/40);
  I-048 Schritt B Verzicht (R571); Gates Pläne UI-HAEPPCHEN-A (R573) und -B (R577).
- Die Vorsession 5500c465 (R553–R563) hatte state.md nicht nachgeführt; ihre Pakete sind hier eingearbeitet.

## Pausierte Pakete

- `.worktrees/i048-b` (`feat/i048-b` @ `bc57f8ba`): verworfen, nicht mergen (R571); Aufräumen nur per Worktree-Ruling.
- Gemergte, aufräumbare Worktrees (nur per Ruling, `git worktree remove` ohne `--force`): `i048-sim`, `i048-ui`, `i049-sim`,
  `i049-ui`, `tool-b7`, `tool-b8`, `tool-e060`, `ui-texte-1`, `tool-gate-ensemble`,
  `tool-controller-haertung`, `m14-e1`, `m14-e1-ui`, `tool-b9`, `ui-aufraeum-2`. `.worktrees/integrate` bleibt.
  `.worktrees/erweiterung-1` gehört der Nutzer-Session (R519) — nicht anfassen.
- Branch `int/rel-07`, Alt-Branches, Remote `wip/r118a-render-aufraeumen`, `stash@{0}` (950f61d5) und `stash@{1}` (e20340a9) bleiben bis Ruling.

## Budget

Offen: keine Freigaben (Restbudgets verfallen mit Session-Ende).

## Offene Entscheide

- Nutzer: N-99 (Kenntnis R434), ohne Antwort gilt R434.
- L0: Retro-Vorschläge Session 1a73e6c1 (Fortsetzung Punkt 4).
