# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-08 (Session 191cc1e4 / Entwurf lead-production: REL-07 live, CI grün nach 81befc2)

## Release-Notizen

**REL-07 „Lebendige Insel" (live @ d7a65a3, R327; CI grün nach 81befc2, R328)**

- **Neu:** Küste mit Riffen, Schaum und Wrack (L5, Wrack und Felseiland erst ab Zoom 0,5); Entdecken im Gebirge: Bergsee,
  Wasserfall, Höhle, Steinmännchen, Farn auf Lichtungen (L6); Tiere in Wald, Gebirge, Küste und Meer, dazu Delfine (L7,
  Mouse-over zeigt Tiere); Wald-Feinschliff WALD-02 (Baumgruppen, Fichten und Pinien, Waldkern, lichte Ränder, Waldboden
  nur unter Bäumen). Bauen im Wald baut den Wald in kleinen Scheiben neu auf, der alte Wald bleibt dabei stehen.
- **Bitte testen:** Wirkt die Insel lebendiger? Stockt das Bauen im Wald (bekannt: Seed 7, bis 6 Frames à 33 ms)?
  Lädt ein neues Spiel zu lange (bekannt: Seed 14 Kaltstart 22–24 s gegen 11–15 s)?

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

Nutzer-Auftrag „Lebendige Insel" (R280–R305): REL-07 ist live; FIX-REL07, Integrator, Gate und Push sind erledigt.
Keine neuen Pakete ohne Nutzer-Auftrag (R305).

1. **PERF-L57 „Zeichenkosten L5–L7 senken"** (Board `open`, lead-art): Bau Seed 7 main ± 1 Ruckel-Frame, Kaltstart
   Seed 14 nahe main. Belege `.studio/qa/fix-rel07/`, `.studio/qa/rel-07c/`. Start nach R305 mit Nutzer-Auftrag oder als
   Abschluss des Auftrags „Lebendige Insel". Vorher Messskripte nach `tools/render-qa/` (R315, beobachtungen.md).
2. Nutzerwünsche **I-022…I-026** (Leertaste Pause, Pipette, Direkt Stufe 2 bauen, Taste `U`, Gebäude-Panel) liegen im
   Ideen-Pool (R323) und warten auf die nächste Ideen-Runde. Achtung Tastenkonflikte Leertaste und `U` mit der
   bestehenden Belegung.
3. studio-coach: E-039 und E-041 als Handbuch-Sätze (R315), falls noch offen; E-040 wartet (R305).
4. Retro erledigt, R329.
5. Befunde offen in `docs/beobachtungen.md` (Abschnitte 2026-10-08), u. a. Zeitreserve `groundBeach.test.ts`, alte Worktrees.

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. Live: main @ d7a65a3 + 81befc2 (CI 37764488641 grün). M1–M8, M10, M11, M9-Häppchen,
  REL-01…REL-07, M12-E0…E4 + drittes Ziel. Verfassung **1.2**, Handbuch **1.29**.
- Startstopp für neue Pakete (R305) gilt; PERF-L57 ist als Abschluss des Auftrags „Lebendige Insel" vorgesehen (R327).
- Dauerregeln: Desktop-first (R78); kein Rebase; Integrator mergt in `.worktrees/integrate` und führt vor jedem Push
  `make check`, `CI=true make check` und `make zeitreserve` aus (R270, R329); Messungen nur bei 1-min-Load ≤ 4 (R329);
  vor Paketstart `git worktree list`, `git status`, fremde Heartbeats prüfen (R329); eine aktive L0-Session je Repo
  (R129, R324); studioweit ≤ 5 Arbeiter (R241).

## Parallele Sessions

Keine. anno-clone #2 ist zurückgezogen und besitzt nichts (R324).

## Seit letzter Session erledigt

- REL-07 live (R327), CI-Fix `decorSea` (R328), Retro 191cc1e4 mit drei Handbuch-Sätzen (R329).
- TOOL-AMPEL, TOOL-AMPEL-M1, TOOL-TIMEOUTS gemergt (R317, R320, R322); Nutzerwünsche I-022…I-026 im Ideen-Pool (R323).

## Pausierte Pakete

- Worktrees: `git worktree list` (aktuell rund 25, meist gemergt). Aufräumen nach R329 (3): siehe Nächste Schritte.
- Branches `fix/rel07-a-wood` @ c94e99a, `feat/m7-fx`, Remote `wip/r118a-render-aufraeumen`, `stash@{0}`: bleiben bis Ruling.

## Budget

Kein freigegebenes Budget offen; FIX-REL07 lag rund 40 Tools über der Schätzung (R326, Retro erledigt).
Neue Pakete brauchen eigene Freigabe.

## Offene Entscheide

- Nutzer: keine; Warteschlange leer.
- L0: PERF-L57 starten (Auftrag oder Abschluss „Lebendige Insel"); TOOL-ZEITRESERVE-RUNNER starten (E-043, R329);
  Ideen-Runde für I-022…I-026 (Tastenbelegung Leertaste und `U` prüfen); M12 E5/E6 planen oder M12 abschliessen
  (Meilenstein-Retro); Reihenfolge der REL-05-Folgepakete (UX, Schiffskontrast, Fahrlinie mit eigenem Ruling).
- E-044 (Worktree-Guard) wartet auf freien Experiment-Platz. CI: `ubuntu-latest` wechselt ab 2026-10-19 auf Ubuntu 26.

## Nächste Schritte

1. Worktrees aufräumen (R329 (3)): gemergte, saubere ohne `--force` entfernen.
2. Prozess-Retro nach REL-07 (studio-process-coach, R127/R329).
3. PERF-L57 (lead-art) und TOOL-ZEITRESERVE-RUNNER (lead-tech) starten, sobald L0 freigibt.
4. Ideen-Runde I-022…I-026; Entscheid M12 E5/E6.
5. Befunde in `docs/beobachtungen.md` auswerten (Zeitreserve `groundBeach.test.ts`, alte Worktrees).
