# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-01 (Session-Ende 5e248230, Teil 2)

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. M1–M7 live. Nutzerauftrag R73 („mehr Tiefe, bessere Grafik, Ambiente,
  Musik") als Programm:
  - **M6 „Krisen und Stadtdienste"** — Sim und UI (M6-U1–U3) auf main.
  - **M7 „Stimmung" inkl. Isometrie** — **abgeschlossen und live** (origin/main ab 183ae81, R124):
    Isometrie, Gebäude, Wetter, Leben, Musik und Umgebungsklang (Assets X1a/X1b), Einstellungs-Karte,
    Credits, Holz-UI. Historie auf main linear (Rebase-Vorfall R124; geprüfter Stand ce5b13a ≙
    183ae81).
  - **M7-UX „Intuitivere Bedienung"** (Nutzerauftrag R118/R119) — Spec
    `docs/superpowers/specs/2026-10-01-m7-ux-design.md` (31 AK) und Plan
    `docs/superpowers/plans/2026-10-01-m7-ux.md` (10 Tasks, @ 925aee0) **freigegeben (R124/R125)**.
    Budget 36 (lead-tech 34, lead-qa 2), Parallelität 1, im Fenster Task 6 ∥ 7 zwei.
    **Umsetzung noch nicht gestartet.**
  - **M8 „Vierte Stufe und Veredelung"** — Spec auf `origin/docs/m8-spec` @ 2a46996 (gesichert,
    R125; Worktree `.worktrees/m8-spec`). Nach M7-UX gegen den Stand nach M6/M7 prüfen (Gate Spec),
    nicht neu schreiben. M8-Sim frei; Kollision in `tests/sim/scenarios.ts` mit M7-UX beachten.
- **M9 „Weite Welt"** vorgemerkt (R90): Start erst nach M7 und ohne parallele L0-Session.
- Dauerregeln: Desktop-first (R78); **im Hauptcheckout nur `git pull --ff-only`, nie `--rebase`;
  Strang-Branches nach jedem abgenommenen Commit pushen** (R107, R124). Studio: Verfassung 1.1,
  Handbuch 1.8.

## Parallele Sessions

| Session                           | Stand                  | besitzt     | bis |
| --------------------------------- | ---------------------- | ----------- | --- |
| 5e248230                          | abgeschlossen          | nichts mehr | –   |
| Cloud „Thema abschliessen" 32e7c1 | übergeben (R119, R120) | nichts mehr | –   |

## Seit letzter Session erledigt

- Session 5e248230 (Teil 2): Slice bestätigt; Übernahme des M7-Abschlusses von der Cloud-Session
  (R119); X1b mit lokal erhaltenen Assets (N-90 ohne Nutzer gelöst); INT-Check auf Mac (N-91: 120
  fps); Final-Review mit Doku-Auflage (R123); M7 live (R124). M7-UX: Erstspieler-Playtest,
  Kurz-Spec, Gate Spec und Gate Plan bestanden (R121–R125). Worktrees aufgeräumt (R125).
  Rulings R118–R125.

## Pausierte Pakete

- **M7-UX Umsetzung** — Strang `feat/m7-ux` (Worktree `.worktrees/m7-ux`, ab 183ae81 bzw. aktuellem
  main nach Plan), Controller lead-tech, Tasks 1–10 seriell, Task 6 ∥ 7 in
  `.worktrees/m7-ux-guide`. Merge am Ende nach R124 (2).
- Lokaler Branch `feat/m7-fx` @ 4489bdd (alte R5-Umsetzung, ungemergt, behalten §6.2).
- Nutzer-Spielstand angefragt: `.studio/playtest/nutzer-save.json` → an lead-design (R81).

## Budget

keine Freigaben (nach Session-Wechsel neu loggen: M7-UX 36 = lead-tech 34, lead-qa 2)

## Offene Entscheide

- L0: Paket lead-production `log.py result --package` (R75) + Folgeaufträge `metrics.py` (R89);
  Restbefunde Limit-Sensor (beobachtungen.md). Handbuch-Vorschläge aus der M7-Retro (studio-coach).
  Prüfauftrag Integrator im Vordergrund (R106 (2)): 1/3 Starts gemessen.
- Nutzer: keine offenen Warteschlangen-Einträge (N-90, N-91 ohne Nutzer beantwortet).

## Nächste Schritte

0. **R127 zuerst:** Persona `studio-process-coach` (neutrale Prozess-Aussensicht, Scrum-Master/RTE)
   per Onboarding anlegen (lead-production), erste Prozess-Retro zu M7; Handbuch-Änderung (Rolle,
   Takt „nach jedem Feature-Release + ad hoc") per Ruling. Dauerregel: entdeckte Ablauffehler immer
   an die Retro.
1. Budget M7-UX loggen, lead-tech startet Umsetzung Task 1 (Plan @ 925aee0).
2. Nach Task 3/4/6/8/10 QA-UX1–5, am Ende Erstspieler-Playtest QA-UX, Final-Review lead-qa,
   Gate Merge, Merge nach R124 (2). Vorher/Nachher-Bilder an den Nutzer.
3. Danach Gate Spec M8 (Spec von `origin/docs/m8-spec`), dann M8-Sim.
