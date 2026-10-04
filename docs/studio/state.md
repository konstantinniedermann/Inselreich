# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-04 (Session-Ende e13c3631; 5-h-Fenster 38 %, Woche 13 %)

## Release-Notiz REL-01 „Aus einem Guss" (live @ 6dc3dc1, R216)

- **Neu:** Häuser und Bäume im Licht des Gebirges (keine schwarzen Konturen, kühle Schatten; H-R10). Wiese
  und Waldboden mit Unebenheiten in Tonstufen, ruhigere Wiese (H-R11). Klick auf eine Brandmeldung im
  Ereignis-Log springt zum Gebäude, auch per Tastatur (H-U2, **vom Studio vorgeschlagen**, I-002).
- **Bitte testen:** Passen Häuser, Bäume, Wiese und Gebirge jetzt zusammen? Wiese bei Zoom 1 zu ruhig oder zu
  unruhig? Hebt sich jedes Gebäude ab? Brandmeldung anklicken (auch nach Abriss).
- **Nicht drin:** Dünen neu (H-R12) — Stufenkanten auf manchen Karten, kommt in REL-02 (R215).

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. Live auf main @ 6dc3dc1 (CI/Pages grün): M1–M8, M10, M11, M9-Häppchen H-R1…H-R11,
  H-S1, H-U2. Programm Nutzerfeedback: `docs/superpowers/specs/2026-10-02-programm-nutzerfeedback.md`.
- **Arbeitsweise neu (Handbuch 1.17):** Release-Bündel E-028 (Häppchen → „release-reif", 2–4 je Release,
  ein Browser-Lauf, ein opus-Review, ein Gate, ein Nutzertest; gates.md „Gate Merge Release") und
  Discovery-Strang E-027 (Ideen-Runde `IDEEN-nn` durch lead-design + `design-idea-scout` nach jedem Release,
  Pool `docs/ideen.md`, ein Studio-Platz je Release). Stilrahmen für alle Grafik:
  `docs/superpowers/specs/2026-10-04-stilrahmen.md` (S1–S6, R211).
- **REL-02 (Kandidaten):** H-R12 Dünen auf `feat/h-r12-duenen` @ 14fd4cf weiterführen (stetige Strandbreite
  und Maske, ≈ 60 Tools, Zwischenstand bei halbem Deckel; R215) · H-R13 Vorberge (vorher Patch-Pfad messen,
  `lastPatchMs` fast ausgeschöpft, R213) · H-T1 flaky Zeit-Test AK-R1-06 (`tests/render/terrain.test.ts`,
  ≤ 1500 ms, CI-Runner 1517 ms bei 5f75b26) robust machen · S4-Rest Schiff/Figuren (`ship.ts:17`, `life.ts:166`)
  · Sammelbefund REL-01-Review (beobachtungen.md). Studio-Platz: H-U1 „Anbinden auf Knopfdruck" (I-001) erst
  im übernächsten Release.
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

## Pausierte Pakete

- H-R12 (Dünen) offen für REL-02, Branch `feat/h-r12-duenen` @ 14fd4cf (ohne Delta-Review).
- Worktrees: `.worktrees/integrate` (bleibt) und `.worktrees/h-r12` (für REL-02); h-u2, h-r10, h-r11 entfernt.
- Remote-Branches überholt, nicht gemergt: `rel/rel-01` (mit altem H-R12), `docs/rel-01-arc42`; `rel/rel-01b`
  ist in main. Löschen entfernter Branches ist verboten (§6.1) — bleiben stehen.
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
1. Nutzerurteil zu REL-01 umsetzen (Ruling), dann Ideen-Runde IDEEN-02 (E-027: nach jedem Release).
2. REL-02 schneiden: H-R12, H-T1, H-R13, S4-Rest (lead-art/lead-tech parallel nach Dateimatrix).
3. M12 „Weite Welt": Brainstorming mit lead-design parallel zu REL-02.
