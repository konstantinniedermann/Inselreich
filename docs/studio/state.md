# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-04 (Session-Ende e13c3631, Teil 2; 5-h-Fenster 17 %, Woche 15 %)

## Release-Notizen

**REL-02 (live @ 9ff5502, R222)**

- **Neu:** Schiff, Figuren und Effekte im Licht des Stilrahmens, keine schwarzen Konturen (H-R14). „Hörbare
  Wirtschaft" (H-A2, **vom Studio vorgeschlagen**, I-009/I-005): tiefer Doppelton, wenn ein Bedürfnis-Gut ausgeht
  (je Gut höchstens einmal pro Minute), leise Arbeitsgeräusche der Betriebe nahe dem Bildausschnitt.
- **Bitte testen:** Ton an — hörst du Mangel rechtzeitig? Sind die Arbeitsgeräusche angenehm oder störend (Regler
  „Effekte")? Schiff und Figuren in der Nahansicht.

**REL-01 (live @ 6dc3dc1, R216)**

- **Neu:** Häuser und Bäume im Licht des Gebirges (H-R10), Unebenheiten in Wiese und Waldboden (H-R11), Klick auf
  Brandmeldung springt zum Gebäude (H-U2, vom Studio vorgeschlagen).
- **Bitte testen:** Passt das Gesamtbild zusammen? Wiese zu ruhig/unruhig?
- **Nicht drin (beide Releases):** Dünen neu (H-R12) — zwei Anläufe verfehlt, neuer Ansatz folgt (R215, R221).

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. Live auf main @ 9ff5502 (CI/Pages grün): M1–M8, M10, M11, M9-Häppchen H-R1…H-R11,
  H-R14, H-S1, H-U2, H-A2; Werkzeug H-T1, W-V3 (Leerlauf-Messung `metrics.py --efficiency --idle-prefix H-`). Programm Nutzerfeedback: `docs/superpowers/specs/2026-10-02-programm-nutzerfeedback.md`.
- **Arbeitsweise neu (Handbuch 1.17):** Release-Bündel E-028 (Häppchen → „release-reif", 2–4 je Release,
  ein Browser-Lauf, ein opus-Review, ein Gate, ein Nutzertest; gates.md „Gate Merge Release") und
  Discovery-Strang E-027 (Ideen-Runde `IDEEN-nn` durch lead-design + `design-idea-scout` nach jedem Release,
  Pool `docs/ideen.md`, ein Studio-Platz je Release). Stilrahmen für alle Grafik:
  `docs/superpowers/specs/2026-10-04-stilrahmen.md` (S1–S6, R211).
- **REL-03 (Kandidaten):** H-R12 Dünen **neue Kurz-Spec** durch lead-art (Malpfad durchgehend stetig, eigenes
  Perf-Budget; Branch `feat/h-r12-duenen` @ ca6a0e1 nur als Material, R221) · H-R13 Vorberge neu auf main (Budget
  +15 % buildMs; CI-Zeit AK-R1-06 ≈ 1,86 s von 2,25 s) · H-U1 „Anbinden auf Knopfdruck" (I-001, Studio-Platz) ·
  S1-Rest `DIM_FIRE`/Audio-Gut-Schlüssel (beobachtungen.md). REL-04: I-007 „Fest in der Kapelle" (Studio-Platz).
- Hotfix H-T2 live @ a26ee26 (R223, R224).
- **M9 Rest:** G7b Landtiere, K3 Silhouetten (R186), Typ-Erkennung kleiner Bauten (R195).
- **M12 „Weite Welt"** danach: Brainstorming mit lead-design; Baustein I-004 Lagerhaus (geparkt, R210).
- Dauerregeln: Desktop-first (R78); im Hauptcheckout nur `git pull --ff-only`; kein Rebase (§6.3, Guard sperrt
  jetzt auch `pull --rebase`, R212); Integrator mergt im Worktree `.worktrees/integrate`; L0 committet nie im
  Hauptcheckout, solange dort jemand arbeitet (R198); Persona-Start als `general-purpose` braucht `model`
  (Guard, R212); Löschen im Repo ohne Rückfrage, ausserhalb verboten (R207, N-94).
- Token-Effizienz: E-010 (Leads ein Auftrag je Instanz, Controller `sonnet`, Deckel 200k Kontext / 6
  Arbeiter-Starts, L0-Übergabe nach Gate-Block bzw. 25 % Kontext).

## Parallele Sessions

| Session  | Stand         | besitzt     | bis |
| -------- | ------------- | ----------- | --- |
| e13c3631 | abgeschlossen | nichts mehr | –   |

## Seit letzter Session erledigt

- Nutzerfeedback zum Studio (R207): Prozess-Retro mit Messdaten → Release-Bündel E-028, Discovery-Strang E-027,
  Bildziel vor Code (R208, Handbuch 1.16); Löschrechte im Repo; Guard N-92/N-93 (R212, Handbuch 1.17).
- Erste Ideen-Runde IDEEN-01 (R210): 5 Ideen, I-002 live, I-001 eingeplant, 3 geparkt.
- Stil-Diagnose ART-STIL-01 → Stilrahmen (R211) → REL-01 live (R216). H-R12 im Rückfall (R214, R215).
- Teil 2 („mach weiter", R218): Ideen-Runde IDEEN-02 (R219), Werkzeug-Merge H-T1/W-V3 (R220), H-R12 erneut
  verfehlt (R221), REL-02 live (R222), Hotfix H-T2 (R223).

## Pausierte Pakete

- H-R12 (Dünen) offen, neue Kurz-Spec nötig; Branch `feat/h-r12-duenen` @ ca6a0e1 (Material, nicht release-reif).
- Worktrees: `.worktrees/integrate` (bleibt) und `.worktrees/h-r12` (Material).
- Remote-Branches überholt, nicht gemergt: `rel/rel-01` (mit altem H-R12), `docs/rel-01-arc42`; `rel/rel-01b`
  und `rel/rel-02` sind in main. Löschen entfernter Branches ist verboten (§6.1) — bleiben stehen.
- Lokaler Branch `feat/m7-fx` @ 4489bdd, Remote `wip/r118a-render-aufraeumen`, `stash@{0}`: unverändert, bis Ruling.

## Budget

Keine offenen Freigaben.

## Offene Entscheide

- L0: Vorschläge der Session-Retro 2026-10-04-session-e13c3631 sichten (Deckel-Zwischenstand, Schätzung
  Optik-Häppchen, flaky Test).
- L0: Experiment-Plätze voll (E-022, E-027, E-028). Wartend: E-025, E-023, E-026, E-019, E-024, E-018, E-020,
  E-012, E-006.
- CI: `ubuntu-latest` wechselt ab 2026-10-19 auf Ubuntu 26 (beobachtungen.md).
- Nutzer: Test von REL-01 (Release-Notiz oben); Abnahme M10/M11 im Spiel und Tempo M11 (R185/R192).
- Warteschlange leer.

## Nächste Schritte

0. Dauerregel R127: Ablauffehler an die Retro; Prozess-Retro nach jedem Feature-Release.
1. Retro-Regeln aus R224 umsetzen lassen (studio-coach: E-028, lernen.md kürzen; lead-production: Integrator-Persona).
2. Nutzerurteil zu REL-01/REL-02 umsetzen (Ruling), dann Ideen-Runde IDEEN-03.
3. REL-03 schneiden: H-R12 neue Kurz-Spec, H-R13, H-U1, S1-Rest (Dateimatrix, parallel).
4. M12 „Weite Welt": Brainstorming mit lead-design parallel zu REL-03 (Bausteine I-004, I-006, I-008).
