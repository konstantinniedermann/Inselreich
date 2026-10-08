# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-08 (Session 56d273bd / Entwurf lead-production: REL-08 live mit dem Session-End-Push)

## Release-Notizen

**REL-08 „Tasten-Komfort, flüssigere Insel, Gebäude-Panel" (live mit dem Session-End-Push, R339, R342, R343, R345)** —
TASTEN-KOMFORT + PERF-L57 + PANEL-UEBERSICHT + FIX-REL08-MENU. Save v9, Sim unverändert.

- **Neu:** Leertaste antippen = Pause (Halten+Ziehen verschiebt weiter); Strg/Cmd+Klick = Pipette („Gleiches bauen");
  `Umschalt+U` = Ausbau (`U` bleibt Schule); neues Gebäude-Panel (Zonen, Kennzahl-Kacheln, Ausbau-Karte, Gewinn
  Vorher→Nachher); schnelleres Laden eines neuen Spiels (Kaltstart Seed 7 22,8 → 8,3 s); Bauen im Wald ohne Ruckeln;
  Wasserfall-Gischt (neue Funken); Menü bei 1280×720 mit sichtbarem Speichern und Laden.
- **Bitte testen:** Leertaste antippen pausiert, Halten+Ziehen verschiebt die Karte; Strg/Cmd+Klick Pipette und
  `Umschalt+U` Ausbau; Info-Panel bei Betrieben und Wohnhäusern, auch bei 1280×720; Laden und Bauen im Wald flüssig;
  Wasserfall-Gischt; Menü unten erreichbar. Das REL-07-„Bitte testen" zu Ruckeln und Ladezeit ist durch PERF-L57 erledigt.

**REL-07 „Lebendige Insel" (live @ d7a65a3, R327; CI grün nach 81befc2, R328)**

- **Neu:** Küste mit Riffen, Schaum und Wrack (L5, Wrack und Felseiland erst ab Zoom 0,5); Entdecken im Gebirge: Bergsee,
  Wasserfall, Höhle, Steinmännchen, Farn auf Lichtungen (L6); Tiere in Wald, Gebirge, Küste und Meer, dazu Delfine (L7,
  Mouse-over zeigt Tiere); Wald-Feinschliff WALD-02 (Baumgruppen, Fichten und Pinien, Waldkern, lichte Ränder, Waldboden
  nur unter Bäumen). Bauen im Wald baut den Wald in kleinen Scheiben neu auf, der alte Wald bleibt dabei stehen.
- **Bitte testen:** Wirkt die Insel lebendiger? (Ruckeln und Ladezeit: erledigt durch PERF-L57.)

**REL-06 „Gewachsene Insel" (live @ 464d490, R301) — ART-STIL-02 Release A**

- **Neu:** Wald organischer (Lappenkronen, Nadel-Etagen, Bestände, Lichtungen, seltener Riesenbaum, Waldtyp je
  Spiel); Gebirgsfuss weich mit Kiesband, Schneegipfel, Krüppelkiefern, Alpenwiese, Findlinge; Gebäudekanten weich
  (Umrisskontur, Lichtkante, Kontaktschatten, Grasbüschel); Wiese mit Blumen, Büschen, Steinen, Einzelbäumen,
  Mauerresten. Zwischenstand Wald: Muster im Nadelwald und Rauten-Ränder in der Übersicht → WALD-02 (R300).
- **Bitte testen:** Gesamtbild in mehreren neuen Spielen; wirkt die Wiese belebt, aber ruhig? Gebäude gut erkennbar?

**REL-05 (live @ 30a9f50, R277) — M12 Seefahrt-Bündel + Saum Fernansicht**

- **Neu:** Kontor II auf Fremdinseln gründen, dort bauen, handeln und Aufträge liefern; Lager, Bilanz und Krisen je
  Insel; neues Gut **Gewürz** (Plantage nur auf Gewürzinseln), Kaufleute brauchen es; **Handelsschiffe** kaufen und
  Routen in 2 Klicks; **drittes Ziel «Gewürzstadt»** (vom Studio vorgeschlagen, I-010). Aktive Insel mit Taste `9`
  wechseln, `0` = Heimat, Menü „Inseln". Saum im Flachwasser in der Fernansicht ohne Streifen (H-R15). Save v9.
- **Bitte testen:** Ein Kontor II gründen und Gewürz heimholen — ist der Weg verständlich? Schiffsroute anlegen und
  auflösen; drittes Ziel erreichbar? Fällt auf, dass Schiffe am Heimatkontor über den Strand fahren (Folgepaket)?

**M12-E1 Archipel (live @ d2d08fb + H-T4, R266/R268)** — zwei Fremdinseln, Fernansicht bis Zoom 0,125, Save v8.
**Bitte testen:** Herauszoomen auf den Archipel — flüssig?

**REL-04 (live @ 50deea8, R244)** — Fest in der Kapelle. **Bitte testen:** Fest, Sperrgründe, Speichern im Fest.

**REL-01…REL-03 (live)** — Licht, Wiese, Dünen, Anbinden-Knopf, Vorberge, Licht für Schiff/Figuren, hörbare
Wirtschaft. **Bitte testen:** Gesamtbild, Dünen, Mangel-Ton.

## Fortsetzung beim nächsten Start

Keine Nutzer-Aufträge offen; Startstopp R305 ist seit R336 aufgehoben.

1. **Werkzeug-Paket (lead-tech, R344):** E-046 Ampelzeile „Actions-Minuten" in `metrics.py --efficiency` (Billing-API)
   und E-047 `log.py queue` formatiert selbst mit Prettier.
2. **E-048 (studio-coach, R344):** zwei Handbuch-Sätze: Gate liest das Ist-Budget aus der Zählung; UI-Pakete mit
   Browser-Abnahme 150 Tools.
3. **Messaufträge aus R344:** Messpakete in der Zeile Steuerungsanteil getrennt ausweisen; lead-art nennt im nächsten
   Perf-Paket die Zahl der Hintergrund-Läufe (E-037); nächste Retro bewertet den ersten CI-Lauf nach `zeitreserve-push`.
4. **Board-Kandidaten (alle `open`):** ART-WALD-RAUTEN, ART-L8-SELTEN; I-024 geparkt (Wirtschaftsentscheid,
   Dominanzrisiko). Folgepunkte aus Beobachtungen: Importzyklus `panelView.ts`↔`inspect.ts` (und Duplikat
   `TILE_LAYOUT`), Meeresfelsen wie Boote, Bauleisten-Höhe.
5. **Entscheid M12 E5/E6** offen (planen oder M12 abschliessen, Meilenstein-Retro); Reihenfolge der REL-05-Folgepakete
   (UX, Schiffskontrast, Fahrlinie mit eigenem Ruling).
6. **Beobachtungen:** neue Einträge seit 2026-10-08 in `docs/beobachtungen.md` (u. a. `perf.test.ts` AK-E0-15a
   lastabhängig, Zeitreserve-Runner doppelt auf CI, Kontrast `.needs`/`.reasons`, Info-Panel bei 800×600 und Glashütte
   im Brand bei 1280×720, Release-Check REL-08).

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. Live mit dem Session-End-Push: REL-01…REL-08, M1–M8, M10, M11, M9-Häppchen, M12-E0…E4 +
  drittes Ziel. Verfassung **1.2**, Handbuch **1.30**.
- Dauerregeln: Desktop-first (R78); kein Rebase; eine aktive L0-Session je Repo (R129, R324); studioweit ≤ 5 Arbeiter
  (R241); Messungen nur bei 1-min-Load ≤ 4 (R329); vor Paketstart `git worktree list`, `git status`, fremde Heartbeats
  prüfen (R329).
- **GitHub Actions mit Sparregeln (R334):** `CI` ignoriert Doku-Pushes (`paths-ignore`), `Pages` nur per
  `gh workflow run Pages --ref main` beim Release, `CI` mit `cancel-in-progress`.
- **Höchstens ein Push pro Session (R335)**, am Session-Ende durch den Integrator, vorher Pflicht
  `make zeitreserve-push` (Load ≤ 4, R338) sowie `make check`, `CI=true make check`. Merges nach Gate bleiben lokal.
- **Konflikt-Probe** `git merge-tree` vor jedem Integrator-Start (Handbuch 1.30).

## Parallele Sessions

Keine.

## Seit letzter Session erledigt

- Aufräumen: 23 Worktrees und 96 Branches entfernt (R331); BEOB-AUSW-02 (R332).
- Actions-Stopp und Sparregeln (R333–R335); TOOL-ACTIONS-SPAR, TOOL-RELEASE-CI (R336, R338); Handbuch 1.30.
- UI-INSELFILTER ohne Fehler, nur Regressionstest (R337); IDEEN-03 (R337).
- REL-08-Pakete TASTEN-KOMFORT, PERF-L57, PANEL-UEBERSICHT gemergt (R339, R342, R343); Retro (R344).

## Pausierte Pakete

- **FIX-REL08-MENU** (lead-tech): Worktree `.worktrees/fix-menu`, Branch `fix/rel08-menu`, läuft bis zum Merge (R345).
- Worktrees sonst nur Hauptcheckout und `.worktrees/integrate`.
- Branch `int/rel-07` (lokal; Guard sperrt `-D`, erledigt sich mit Löschen von `origin/int/rel-07` per Ruling),
  nicht gemergte Alt-Branches (u. a. `fix/rel07-a-wood`, `feat/m7-fx`), Remote `wip/r118a-render-aufraeumen` und
  `stash@{0}` bleiben bis Ruling.

## Budget

Kein freigegebenes Budget offen. Überschreitungen dieser Session (TASTEN-KOMFORT ≈ 22 %, PANEL-UEBERSICHT rund 136
von 120) sind in der Retro behandelt (R344). Neue Pakete brauchen eigene Freigabe.

## Offene Entscheide

- Nutzer: keine; Warteschlange leer (N-98 beantwortet, R334).
- L0: Werkzeug-Paket E-046/E-047 starten; E-048 an den studio-coach; M12 E5/E6; Reihenfolge REL-05-Folgepakete;
  Ruling zum Löschen von `origin/int/rel-07` und Alt-Branches.
- E-044 (Worktree-Guard) wartet auf freien Experiment-Platz. CI: `ubuntu-latest` wechselt ab 2026-10-19 auf Ubuntu 26.
