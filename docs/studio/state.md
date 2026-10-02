# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-03 (Session-Ende ca427887; Wochenfenster 83 %, Reset 2026-10-07 12:00)

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. M1–M7-UX und **M8 „Kaufleute" live** (main @ 2bf964e, R165).
  Programm Nutzerfeedback G1–G9/S1–S11 (R144, R147, R148, Dokument
  `docs/superpowers/specs/2026-10-02-programm-nutzerfeedback.md`): M8 → M10 → M11 → M12, dazu
  M9 „Lebendige Insel" (nur Render) parallel.
- **M9 „Lebendige Insel"** — gestartet. Auf main: BUG-LICHT (R153), H-R1 Bodenbild (R154), H-R2
  Wasser-/Luftleben mit `wildlifeAt` (R160). Welle 1b (R164): **H-R3** Statusmarken (S4, darf
  jetzt starten; Briefing: Standardfall für unbekannte Gebäudezustände wegen M10 `noService`),
  **H-R4** Laufwege (G6) in neuer Datei `errands.ts` parallel, Anschluss `renderer.ts` erst nach
  H-R3. Welle 2 (Sprite-Cache, G1 Varianz, G8 Material, G3 Felsmassive, G7b Landtiere) erst nach
  Gate Merge M10 (`sprites.ts`, R164); Kurz-Spec Welle 2 darf vorher laufen.
- **M10 „Schritt für Schritt"** — Design (R155), Spec 98 AK (R163), Plan @ c936fd6 (R164) auf main
  (3329346), seit R167 geteilt: `docs/superpowers/plans/2026-10-03-m10-schritt-fuer-schritt/index.md`
  - Task-Dateien (Briefings nennen nur Task-Datei + AK-IDs); Board vollständig. Umsetzung darf jetzt starten (M8-MERGE done). Budget gestuft (R164
    B2): Stufe 1 lead-tech 11 (T1–T4, Parallelität 2 solange Woche > 80 %) und lead-art 3 (A1);
    Rest nach Wochen-Reset. Ein Gate Merge am Ende über `feat/m10-ui` (B11).
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
| ca427887 | abgeschlossen | nichts mehr | –   |

## Seit letzter Session erledigt

- Token-Analyse aller 15 Sessions (`.studio/handoffs/EFF-analyse.md`): Steuerung 64 %, Umsetzer 5,5 %.
- Paket EFF (R167, R168): Effizienz-Ampel in `metrics.py` (`--efficiency`), Handbuch 1.13,
  Ad-hoc-Retro `retros/2026-10-02-adhoc-token-effizienz.md`, Plan M10 in Task-Dateien, lead-qa und
  lead-production auf `sonnet`. Erstmals ohne Lead (L0 → Arbeiter direkt).

## Pausierte Pakete

| Paket      | Worktree / Branch          | nächster Schritt                                        |
| ---------- | -------------------------- | ------------------------------------------------------- |
| M10-S1A    | `.worktrees/m10-sim` (neu) | Budget loggen, Controller lead-tech `sonnet`, T01a–T04c |
| M10-A1     | `feat/m10-icons` (neu)     | lead-art, Budget 3                                      |
| H-R3, H-R4 | neu                        | lead-art Kurzdesign → kombiniertes Gate (Stufe leicht)  |

- Lokaler Branch `feat/m7-fx` @ 4489bdd (alte R5-Umsetzung, ungemergt, behalten §6.2).
- Remote `wip/r118a-render-aufraeumen` ändert Render-Tests: nur per Ruling aufnehmen.
- Nutzer-Spielstand angefragt: `.studio/playtest/nutzer-save.json` → an lead-design (R81).

## Budget

Keine offenen Freigaben. M8 abgeschlossen (lead-tech 25/18, lead-qa 3/2, lead-art 4/3). Dashboard
zeigt lead-art M9-H-R2 6/4 (Zählabweichung, Retro). Für M10 Stufe 1 und M9 Welle 1b neu loggen.

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
- Nutzer: N-92 und N-93 (Guard: `pull --rebase` und Persona-Starts ohne `model`; Diff N-93 liegt
  im Scratchpad der Session ca427887 `gp/`, bei Freigabe neu erzeugen lassen falls weg). Optional angeboten: echtes Arbeitskräfte-System
  statt Freischaltung (R148 F3, Backlog).

## Nächste Schritte

0. Dauerregel R127: Ablauffehler an die Retro; Prozess-Retro nach jedem Feature-Release.
1. Wochenfenster prüfen (> 80 %: Parallelität 2). M10 Stufe 1 loggen; Controller lead-tech auf
   `sonnet` (≤ 4 Tasks je Instanz, E-010) startet T01 nach Task-Datei; parallel lead-art M10-A1.
2. lead-art H-R3 (Statusmarken) Kurzdesign, danach H-R4 (Laufwege) — beide vor M10-U2 auf main.
3. Nach Wochen-Reset: M10-Budget Rest; W4, QA-U1, E-010-Übergabe; Kurz-Spec M9 Welle 2.
