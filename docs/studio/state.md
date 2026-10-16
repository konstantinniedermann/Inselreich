# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-16 (Studio-Session ca9d40c8 läuft, R709–R726; lokal auf main seit Push `8fe744df`: I-120, I-118, UI-AUFRAEUM-4, TOOL-BUENDEL-14, I-114, BEOB-17, Handbuch 1.60; Save v16; REL-26-Push frühestens 2026-10-17, R712)

## Release-Notizen

**REL-24 + REL-25 „Ereignis-Log, Pause, Treue“ (live, R697)** — Save **v16** (Migration v15→v16). Push `2e7a269f..8fe744df`, CI-Lauf 38887719217,
Pages-Lauf 38888562306. Inhalt: UI-HAEPPCHEN-D/E/F, I-091, BEOB-15, TOOL-METRIK-ZEITRAUM. Quelle: `.studio/handoffs/2026-10-16-lead-qa-gate-REL-24-25.md`.

- **Neu:** Das Ereignis-Log zeigt alle Ereignisse (Verfall, Vertragslieferung und -bruch); Lagerchips nennen die Reichweite («↓ 2:00»); bei Pause
  erscheinen getönter Rand und Banner; die Auftragskarte zeigt das voraussichtlich nächste Gut (vom Studio vorgeschlagen); Stammkunden-Kulanz: nach
  5 Lieferungen verzeiht ein Vertrag einen Fehlbestand einmal (vom Studio vorgeschlagen); Fern-Inseln tragen eine Marke auf der Seekarte, das
  Schiff-Panel zeigt die Routen-Bilanz, der Bilanz-Chip Einnahmen und Unterhalt.
- **Bitte testen:** (1) Pause per Knopf, `P`, Leertaste: Banner sofort? (2) Stammkunde ohne Ware nach 5 Lieferungen: Toast «diesmal ohne Strafe», Kasse
  unverändert; (3) Spielstand v15 laden: Treue 0/5; (4) Log bei 20 Einträgen aufklappen; (5) Bilanz-Chip bei Verlust rot.

**REL-23 „Fernangebot“ (live, R667)** — Save **v15** (Migration v14→v15). Inhalt: Handel 2 (R658, gemergt `6faa189e`). Push `fb1e5e46..2e7a269f`
(R667, Zeitreserve-Ausnahme), CI-Lauf 38864279487, Pages-Lauf 38864281718. Quelle: `.studio/handoffs/2026-10-14-lead-qa-HANDEL-2-gate.md`.

- **Neu:** Mit Kontor auf einer fernen Insel erscheint neben dem Auftrag ein grosses Angebot für das Lieblingsgut der Insel (Möweninsel
  Stoff, Felsbucht Rum, Weidenau Glas); Annehmen ersetzt den Auftrag, Frist 2:50 ab Auftragsbeginn, geliefert wird am Kontor der Insel
  (Liefern nennt die Insel); Verpasst kostet nur diesen Auftrag, bei Annahme entfällt der nächste Auftrag; neue Log-Einträge bei Lieferung;
  ältere Spielstände laden verlustfrei.
- **Bitte testen:** (1) Kontor auf Möweninsel, Felsbucht, Weidenau: Fernangebot mit richtigem Gut; (2) annehmen, liefern, Frist ablaufen
  lassen: Belohnung, Meldung, Log-Zähler; (3) Spielstand v14 laden, speichern und mit offenem Fernangebot neu laden; (4) nach Lieferung
  erscheint zuerst das Stammkunde-Angebot (R9), nicht «Nächster Auftrag» wie im AK-Text.

**REL-22 „Aufgeräumt und nichts verpasst“ (live, R651)** — Push `ca46eb73..fb1e5e46`, CI 38571578702, Pages 38571610399. Kein Save-Wechsel
(v14). Inhalt: UI-AUFRAEUM-3 (R636), I-100 «Neu»-Zähler (R630), TOOL-ZEITRESERVE-21 (R631), TOOL-BUENDEL-12 (R618), BEOB-14 (R621),
REL22-FIX (R644).

- **Neu:** «Ereignisse ▸ (3 neu)» zählt verpasste Meldungen, solange das Log eingeklappt ist (vom Studio vorgeschlagen, I-100); Rangliste
  Unterhalt je Insel inkl. Heimatinsel (I-089); Rechtsklick im Linienzug beendet erst den Zug, dann das Werkzeug (I-098); Kartenstapel
  oben rechts geordnet (I-099); Vorliebe-Badge neben Boom.
- **Bitte testen:** (1) Log einklappen, Brand abwarten → «(1 neu)», aufklappen → weg; (2) Rangliste mit zwei Inseln; (3) Wege ziehen,
  Rechtsklick zweimal; (4) Krisen «aus» → keine Krisenkarte; (5) Spielstand v14 lädt.

**REL-21 „Stammkunde und Inselmarkt“ (live, R625)** — Push `0d1db8f3..ca46eb73`, CI 38553292584, Pages 38553994549 grün. Save **v14**
(Migration v13→v14). Inhalt: UI-HAEPPCHEN-A, -B, I-047 Stammkunde, UI-HAEPPCHEN-C, I092 Inselmarkt-Vorliebe, HOTFIX-REL21-PREIS
(Karte nennt den Inselpreis); dazu DOC-ARCHIV, TOOL-BUENDEL-11, TOOL-HOTFIX-ZR (nur Doku/Werkzeug).

- **Neu:** Stammkunde im Auftragsplatz (Liefervertrag, Kündigen, Abspringen mit Strafe; vom Studio vorgeschlagen, I-047) mit
  Marktvergleich und Knopf «Zum Erzeuger»; jede Fremdinsel zahlt für ein Konsumgut +30 % (Möweninsel Stoff, Weidenau Glas, Felsbucht
  Rum); «Lager voll» als Problem mit Sprung; «Bilanz danach» beim Bauen; Unterhalt-Fusszeile; Linienbau mit Umschalt.
- **Bitte testen:** (1) Stammkunden-Angebot annehmen, Lieferung nach 1:30, Kündigen; (2) Glas in Weidenau verkaufen (+30 %, Marke);
  (3) Lager voll → `.` springt hin; (4) Umschalt gedrückt Wege ziehen, Esc beendet; (5) alter Spielstand (v13) lädt.

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

Keine Nutzer-Aufträge offen. Daueraufträge: R445, R475, R698 (Deckel 6, bei Last > 8 keine dritte Umsetzung mit Testlauf, R708 V2).
Actions-Prognose rot: höchstens ein Push je Tag (R488 V2, R712). Ein Push je Session (R335).

1. **REL-26** (ab 2026-10-17): Inhalt I-120, I-118, UI-AUFRAEUM-4, TOOL-BUENDEL-14, I-114, BEOB-17-Menüabstand, dazu PERF-BILANZ-COV und
   TOOL-GUARD-REDACT nach Gate. Release-Check nur in der Push-Session (Handbuch 1.60, R712 V2), dann `make push-check`, Push per geprüftem Hash.
2. **I-112 «Ratsbeschluss»** (`feat/i112`, `.worktrees/i112`): C3 T05–T07 laufend (R724), danach C4 T08 Browser, T09 Doku, Final-Review, Gate Merge;
   `SAVE_VERSION` = main + 1 beim Merge (R674). T00-Ersatzmessung auf `07de72c4` bei Last ≤ 4 offen.
3. **ORT-A** (R705): C3 T04–T06 laufend (R726), C2 T08 im Delta-Review (R723); T09 (gewertete Messung) erst bei freiem Messfenster (N-102). Puffer 8 Starts.
4. **PERF-BILANZ-COV** (`perf/bilanz-cov` @ `ad57e259`): Gate Merge läuft. **TOOL-GUARD-REDACT** (`tool/guard-redact`): Nacharbeit Unter-Schwärzung (R725), dann Gate.
5. **I-119 + I-121 «Bewohner reagieren»** (Gate Spec R715, Variante 3): Plan erst nach ORT-A T20.
6. Pool: ZEITRESERVE-PFLEGE (mit H-1, Messung bei Last ≤ 4). Geparkt: I-110 bis `BUY_RISE` > 0 (R722).
7. Erweiterung 1 bleibt in der Nutzer-Session (R519).

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M13 abgeschlossen** (live, R564). Live: REL-01…REL-19, M1–M8, M10, M11, M9-Häppchen, M12, M13. **M14 „Archipel mit Wert“**: E1 Inselcharakter
  lokal auf main (R574, Save v13), Release REL-20 offen. Verfassung **1.2**, Handbuch **1.55**.
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

- I-112 C3 (lead-tech), ORT-A C2 und C3 (lead-tech), TOOL-GUARD-REDACT (lead-tech), Gate Merge PERF-BILANZ-COV (lead-qa).

## Parallele Sessions

- Nutzer-Session `c6709a04` (seit 2026-10-11 ≈ 08:30Z): Konzept „Erweiterung“ (`lead-design`), Worktree
  `.worktrees/erweiterung-1`, Branch `design/erweiterung-1` — geduldet, Deckel geteilt (R519). Nicht anfassen.

## Seit letzter Session erledigt

- **Lokal gemergt (ca9d40c8):** UI-AUFRAEUM-4 (`00787f29`, R710), TOOL-BUENDEL-14 (`7545fa67`, R718), I-114 (`e14ef6be`, R720), BEOB-17 (`b455d2b1`, R721).
- **Gates:** Plan I-112 (R711/R713), Spec I-119+I-121 (R715), I-110 geparkt (R722). Prozess-Retro REL-21–25 (R712), Handbuch 1.60 (`612fe2bb`).

## Pausierte Pakete

- `.worktrees/i048-b` (`feat/i048-b` @ `bc57f8ba`): verworfen, nicht mergen (R571); Aufräumen nur per Worktree-Ruling.
- Gemergte, aufräumbare Worktrees (nur per Ruling, `git worktree remove` ohne `--force`): `i048-sim`, `i048-ui`, `i049-sim`,
  `i049-ui`, `tool-b7`, `tool-b8`, `tool-e060`, `ui-texte-1`, `tool-gate-ensemble`,
  `tool-controller-haertung`, `m14-e1`, `m14-e1-ui`, `tool-b9`, `ui-aufraeum-2`, dazu aus b54ed3bd: `hotfix-rel21`, `tool-zr-hotfix`,
  `tool-b12`, `beob-14`, `tool-zr21`, `ui-aufraeum-3`, `i100`, `rel22-fix`, `plan-ui-aufraeum-3`, `design-i100`.
  Dazu gemergt bzw. erledigt: `tool-dash-sessionziel`, `tool-guard-warteagent`, `tool-dash-ziel-fix`, `ideen-10`, `handel-2`, `plan-handel-2`, `design-handel-2`.
  Aktiv behalten: `design-ui-d` (UI-HAEPPCHEN-D), `design-i109`. `.worktrees/integrate` bleibt.
  `.worktrees/erweiterung-1` gehört der Nutzer-Session (R519) — nicht anfassen.
- Branch `int/rel-07`, Alt-Branches, Remote `wip/r118a-render-aufraeumen`, `stash@{0}` (950f61d5) und `stash@{1}` (e20340a9) bleiben bis Ruling.

## Budget

Offen: keine Freigaben (Restbudgets verfallen mit Session-Ende).

## Offene Entscheide

- Nutzer: N-99 (Kenntnis R434), N-102 (Headless-Chrome des Projekts reflexionsinstrument beenden?).
- L0: keine offenen.
