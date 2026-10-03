# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-03 (Session-Ende 08e7b5f1; Wochenfenster 85 %, Reset 2026-10-07 12:00)

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. M1–M7-UX und **M8 „Kaufleute" live** (main @ 2bf964e, R165).
  Programm Nutzerfeedback G1–G9/S1–S11 (R144, R147, R148, Dokument
  `docs/superpowers/specs/2026-10-02-programm-nutzerfeedback.md`): M8 → M10 → M11 → M12, dazu
  M9 „Lebendige Insel" (nur Render) parallel.
- **M9 „Lebendige Insel"** — Auf main: BUG-LICHT, H-R1, H-R2, **H-R5 Terrain** (Berg, Raster; R172),
  **H-A1 Bausound** (R174), **H-R3 Statusmarken** (R176), **H-R4 Laufwege** (R178), main @ e99ca15.
  `renderer.ts` ist frei für M10-U2 (R159). Welle 2 (Sprite-Cache, G1, G8, G3 Felsmassive, G7b) erst
  nach Gate Merge M10 (`sprites.ts`, R164); Folgehäppchen in beobachtungen.md (Markenversatz 2×2,
  Laufwege um Hindernisse + Bürger Haus → Markt).
- **M10 „Schritt für Schritt"** — Plan `docs/superpowers/plans/2026-10-03-m10-schritt-fuer-schritt/`,
  Spec mit Thema-Delta §24 („Fischerleute ohne Bildung gehen an Land", nur `tip`-Texte, R171).
  **Stufe 1 fertig** (R177): `feat/m10-sim` @ 14870ae (T01a–d, T02a–b, T03a–c, T04a–c; BG-1 winTick
  6050, minMoney 57), `feat/m10-icons` @ 02078dc (A1, AK-A1-03 offen in QA-ART). Ledger
  `.superpowers/sdd/m10/ledger.md`. Stufe 2 (T01e, T05 ff., UI) erst nach Wochen-Reset (R164 B2);
  lead-tech hat 1 Start Rest. Ein Gate Merge am Ende über `feat/m10-ui` (B11).
- **S12 „Ausbau"** (Nutzerwunsch: Produktionsgebäude ausbaubar, Freischaltung je Stufe) — Designvorschlag
  `docs/superpowers/specs/2026-10-03-s12-ausbau-design.md`, Gate Brainstorming bestanden (R171,
  Variante C, A1–A7): Umsetzung in M11 nach S10, parallel S2.
- **M11 „Wirtschaft im Fluss"** (S10, S2, Stein-Konkurrenz Glashütte↔Aufstieg R161) und **M12
  „Weite Welt"** (R90-Rest) vorgemerkt; Backlog: Erlasse, Stufe 5, Arbeitskräfte-System (R148 F3).
- Dauerregeln: Desktop-first (R78); im Hauptcheckout nur `git pull --ff-only`; **kein Rebase
  (Verfassung §6.3), Branches holen main per Merge**; Strang-Branches nach jedem abgenommenen
  Commit und nach grünen Integrations-Merges pushen (R107, R124, R143); `renderer.ts` seriell
  H-R2 → H-R3/H-R4 → M10-U2 (R159). Studio: Verfassung 1.1, Handbuch 1.13.
- **Token-Effizienz (R167, R168):** E-010 „Schlanke Steuerung“ gilt ab M10: Leads ein Auftrag je
  Instanz, Controller `sonnet` ≤ 4 Tasks, L0-Übergabe nach Gate-Block bzw. 25 % Kontext, keine Bilder
  in L0, Persona-Starts immer mit `model`. M10 ist Messlauf: `metrics.py --efficiency` (Ampel) in
  jeder Retro Pflicht. Plan-Orga `orga-13` (Controller-Wechsel nach Hälfte) ist durch 1.13 überholt.

## Parallele Sessions

| Session  | Stand         | besitzt     | bis |
| -------- | ------------- | ----------- | --- |
| 08e7b5f1 | abgeschlossen | nichts mehr | –   |

## Seit letzter Session erledigt

- Nutzerauftrag 5 Punkte (R170): Terrain Berg/Raster (H-R5), Bausound je Gebäude (H-A1), Ausbau als
  S12-Design für M11, Freischaltung = M10 mit Thema-Delta. Dazu H-R3 Statusmarken, H-R4 Laufwege
  (alle auf main, CI/Pages grün) und M10 Stufe 1 (Sim T01–T04, A1 Symbolsatz) auf Feature-Branches.
- E-010 im Einsatz: drei lead-tech-Instanzen (`sonnet`, ≤ 4 Tasks), jede Review-Runde 1; Session-Ampel
  Steuerung 40 %, Umsetzer 44 %, opus 33 % (Retro `retros/2026-10-03-session-08e7b5f1.md`).
- Vorfall CI rot @ 592df06 (L0-Doku-FF ohne prettier, R173) — behoben.

## Pausierte Pakete

| Paket  | Worktree / Branch                                   | nächster Schritt                                 |
| ------ | --------------------------------------------------- | ------------------------------------------------ |
| M10-S2 | `.worktrees/m10-sim` · `feat/m10-sim` @ 14870ae     | nach Reset: Budget Stufe 2, lead-tech T01e + T05 |
| M10-A1 | `.worktrees/m10-icons` · `feat/m10-icons` @ 02078dc | AK-A1-03 in QA-ART (W7); Einbau mit Task 9       |

- Lokaler Branch `feat/m7-fx` @ 4489bdd (alte R5-Umsetzung, ungemergt, behalten §6.2).
- Remote `wip/r118a-render-aufraeumen` ändert Render-Tests: nur per Ruling aufnehmen.
- Nutzer-Spielstand angefragt: `.studio/playtest/nutzer-save.json` → an lead-design (R81).

## Budget

Keine offenen Freigaben. M10 Stufe 1: lead-tech 10/11 (1 Rest), lead-art A1 2/3. M9-Häppchen
H-R5 3/3, H-A1 2/3, H-R3 3/3, H-R4 3/3; S12-D lead-design 1/3. Stufe 2 M10 nach Reset neu loggen.

## Offene Entscheide

- L0: Handbuch-Vorschläge aus den Retros dieser Session sichten (Rebase-Verbot in Vorlagen und
  Guard, Pages `paths-ignore` für `docs/studio/**`, Budget-Log je Integrator-Start, metrics.py
  „Tokens je Agent"); E-010-Urteil des Coaches übernehmen.
- L0: Paket lead-production `log.py result --package` (R75) + Folgeaufträge `metrics.py` (R89);
  Restbefunde Limit-Sensor (beobachtungen.md); Start-Hook warnt bei aktiver L0-Session (R129 (1)).
- Aufräumen: Worktrees `m7-ux`, `pages-limit`, `m8-sim`, `m8-sim-ui`, `m8-balance`, `m8-scen`,
  `m8-ui`, `m8-spec`, `programm-feedback`, `m10-design` sind gemergt und können weg (ohne
  `--force`, Branches bleiben).
- STUDIO.md hat 410 Zeilen (E-009-Grenze 400): Grenze bleibt, studio-coach kürzt in der nächsten
  Session (Ruling L0).
- Budget-Alarme zählen Heartbeat-Knoten ohne Rolle mit (beobachtungen.md 2026-10-03); Fehlalarme
  „Retro fällig“ wegen Budget bis zum Fix ignorieren.
- Board-Altlast: Studio-Graph-Ereignis ohne `package_id` erscheint als Paket `None`.
- CI: `ubuntu-latest` wechselt ab 2026-10-19 auf Ubuntu 26 (in beobachtungen.md).
- Nutzer: Abnahme im Spiel von Terrain (Fels nah verwaschen? weiche Kachel-Treppe), Bausound
  (Hörcheck), S12-Annahmen A1–A7 (bei Einwand Ruling anpassen).
- Aufräumen zusätzlich: Worktrees `h-r5`, `h-a1`, `h-r3`, `h-r4`, `s12-design` sind gemergt.
- Nutzer: N-92 und N-93 (Guard: `pull --rebase` und Persona-Starts ohne `model`; Diff N-93 liegt
  im Scratchpad der Session ca427887 `gp/`, bei Freigabe neu erzeugen lassen falls weg). Optional angeboten: echtes Arbeitskräfte-System
  statt Freischaltung (R148 F3, Backlog).

## Nächste Schritte

0. Dauerregel R127: Ablauffehler an die Retro; Prozess-Retro nach jedem Feature-Release. L0 prüft
   auch Doku-Merges mit `npx prettier --check` (R173). E-015 (Rot-Beleg/Nachprüfung im Lead-Bericht)
   ist angenommen (R179).
1. Bis Reset 2026-10-07 (Woche > 80 %): nur kleine Häppchen; Worktrees aufräumen; Werkzeug-Vorschlag
   `metrics.py --efficiency` je Session/Meilenstein an lead-production.
2. Nach Reset: M10 Stufe 2 loggen; lead-tech T01e + T05 (eine Instanz), dann UI-Tasks T06–T09
   (`renderer.ts` frei, R159), QA-ART für A1.
3. Danach Gate Merge M10; dann M9 Welle 2 (Sprite-Cache, G1/G8, G3 Felsmassive) und M11 (S10, S12, S2).
