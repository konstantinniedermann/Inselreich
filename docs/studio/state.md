# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-03 (Session-Ende 9b13950a; Wochenfenster nach Reset 0 %)

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. Live auf main @ 63ed1a9 (CI/Pages grün): M1–M8, **M10 „Schritt für
  Schritt"** (R188), **M11 „Wirtschaft im Fluss"** (R200; Save v6, Fluss je Tick, Dämpfung, Jagdhütte,
  Rinderfarm, Wald `free`, Auslastung, Ausbau Stufen 1–3) und M9-Häppchen H-R1…H-R8 (Welle 2: Sprite-Cache
  H-R6, Varianz/Material H-R7, Felsmassive + `lineJoin` H-R8).
  Programm Nutzerfeedback: `docs/superpowers/specs/2026-10-02-programm-nutzerfeedback.md`.
- **M9 „Lebendige Insel" Rest:** G7b Landtiere (`iso.ts`, `wildlife.ts`), K3 aus M10 (Silhouetten statt
  Kategorie-Symbol, R186), Bergoptik-Feinschliff (H-R8 Blindtest Note 3), Typ-Erkennung kleiner Bauten
  (R195). Häppchen-Format wie H-R6…H-R8 (Kurz-Spec im Briefing, lead-art).
- **M12 „Weite Welt"** ist der nächste Meilenstein (G5 Fluss, S6 grössere/mehrere Inseln, S7 Expansion,
  S8 Handelsrouten; Programm Zeilen 53–65, 128 ff.): zuerst Brainstorming mit lead-design.
- Balancing-Signale für M12/Backlog (beobachtungen.md): Ausbau lohnt im Referenzpfad nicht (M-15, R196);
  Holzfäller-Auslastung sinkt bei „Kein freier Wald" nur langsam; Render-Basis nach M11 bei 1920×1080/DPR 2
  ~4,0 ms → Messung für M12 unter gleichen Bedingungen neu aufsetzen (R202).
- Dauerregeln: Desktop-first (R78); im Hauptcheckout nur `git pull --ff-only`; kein Rebase (§6.3), Branches
  holen main per Merge; Strang-Branches nach jedem abgenommenen Commit pushen; **Integrator mergt im eigenen
  Worktree** `.worktrees/integrate` (detached auf origin/main, `push origin HEAD:main`; E-022, Handbuch 1.15);
  **L0 committet nie im Hauptcheckout, solange dort jemand anderes arbeitet** (R198); L0-Prüfzeile ohne Pipe
  (`make studio-test >/dev/null && …`, R202).
- Token-Effizienz: E-010 behalten (R201): Leads ein Auftrag je Instanz, Controller `sonnet`, Deckel 200k
  Kontext / 6 Arbeiter-Starts, Spec ≤ 40 KB, L0-Übergabe nach Gate-Block bzw. 25 % Kontext.

## Parallele Sessions

| Session  | Stand         | besitzt     | bis |
| -------- | ------------- | ----------- | --- |
| 9b13950a | abgeschlossen | nichts mehr | –   |

## Seit letzter Session erledigt

- Nutzeranweisung „Wochenlimit ignorieren" (R180): M10 Stufe 2, UI, QA, Gate Merge → live (R188); M11 von
  Design bis Merge in einer Session (R185–R200, 7 Controller-Instanzen); M9 Welle 2 H-R6, H-R7, H-R8 live.
- CI-Vorfall Experiment-Grenze behoben (R180); Studio-Werkzeug Budget-Alarm je Phase (R198).
- Retros: Meilenstein M10/M11, Prozess M10/M11, Session 9b13950a; Handbuch 1.14 (R190) und 1.15 (R201).

## Pausierte Pakete

- Keine. Worktrees: nur `.worktrees/integrate` (Integrator, bleibt).
- Lokaler Branch `feat/m7-fx` @ 4489bdd (alte R5-Umsetzung, ungemergt, behalten §6.2).
- Remote `wip/r118a-render-aufraeumen` ändert Render-Tests: nur per Ruling aufnehmen.
- `stash@{0}` (alter WIP T02 aus m11-sim, inhaltlich im Branch): bleibt bis Ruling.

## Budget

Keine offenen Freigaben. Alle Pakete dieser Session abgeschlossen.

## Offene Entscheide

- L0: Experiment-Plätze voll (E-015, E-017, E-022, alle bis M12). Wartend, Reihenfolge laut Session-Retro:
  E-025 (feste L0-Prüfzeile ohne Pipe/`;`), E-023, E-026 (Integrator-Persona präzisieren); dazu E-019 (Parallelität aus
  Dateimatrix + Abhängigkeits-Prüfung im Gate Plan), E-023 (letzten roten Testlauf sichern — flakiger Test
  viermal gesehen, nie benannt), E-024, E-018, E-020. Vorschläge der Session-Retro 9b13950a sichten.
- Budget-Alarme nach Werkzeug-Fix teils noch falsch (lead-production 4/1, lead-tech 6/2): Ursache offen.
- STUDIO.md hat 401 Zeilen (E-009-Grenze 400): studio-coach kürzt bei der nächsten Handbuch-Änderung.
- CI: `ubuntu-latest` wechselt ab 2026-10-19 auf Ubuntu 26 (beobachtungen.md).
- Nutzer: Abnahme im Spiel von M10, M11 und den neuen Grafiken; Tempo M11 (Referenzsieg 6750 statt 6050
  Ticks, R185/R192) — bei Einwand Ruling Balancing. S12-Annahmen A1–A7 (bei Einwand Ruling anpassen).
- Nutzer: N-92 und N-93 (Guard: `pull --rebase` und Persona-Starts ohne `model`). Optional: echtes
  Arbeitskräfte-System statt Freischaltung (R148 F3, Backlog).

## Nächste Schritte

0. Dauerregel R127: Ablauffehler an die Retro; Prozess-Retro nach jedem Feature-Release.
1. M12 „Weite Welt": Brainstorming mit lead-design (Designvorschlag, Gate Brainstorming), dann Spec, Plan.
2. Parallel M9-Rest als Häppchen (lead-art): G7b Landtiere, K3, Bergoptik, kleine Bauten.
3. Werkzeug (lead-production): E-023-Vorbereitung, Budget-Alarm-Rest, Integrator-Persona.
