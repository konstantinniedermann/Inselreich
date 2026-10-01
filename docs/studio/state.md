# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-09-30 (Session-Ende 664ac8d3, 5-h-Fenster 73 %, Reset 00:50)

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. M1–M5 live. Nutzerauftrag nach M5-Playtest „mehr Tiefe, bessere
  Grafik, Ambiente, Musik — die Stimmung muss rüberkommen" (R73) läuft als Programm:
  - **M6 „Krisen und Stadtdienste"** — Spec fertig (R82, R85), **Plan M6-Sim freigegeben (R87)**,
    Umsetzung bereit.
  - **M7 „Stimmung"** — Spec fertig (R84), Plan fertig (R88). **Neu R91: Isometrie** — Nachtrag
    `2026-10-01-m7-iso-design.md` + ADR-012 fertig (`docs/m7-spec` @ 42f11a1, 20 AK-ISO; R92);
    **Gate Spec bestanden (R95, @ 65f4813, 21 AK-ISO)**; Plan auf Isometrie umgestellt
    (`docs/m7-spec` @ 6396d15; neu R0-ISO 2 Tasks, U0-ISO, QA-VORHER/QA-SLICE, Zwischen-Merge R0-ISO;
    Budgetantrag 76 = lead-art 49/4, lead-tech 26/1, lead-qa 1/1). Gate Plan: beide BEDENKEN →
    **Nacharbeit lead-tech läuft** (R96: Budget 78 = 49/4, 27/2, 2/1; Zwischen-Merge R0-ISO mit Push;
    Welle 0 = Revert 42f11a1 + Docs-Merge m6/m7-spec). Danach Zweitprüfung lead-qa, Welle 0,
    Welle 1. lead-production legt Personas art-rendering/art-audio auf main an. Danach Render-Tasks im Plan überarbeiten (neu R0-ISO,
    U0-ISO; ≈ +25 % Render), dann Gate Plan.
  - **M8 „Vierte Stufe und Veredelung"** (vorgezogen, R81/R86) — **Spec fertig, Gate Spec offen**.
- **M9 „Weite Welt"** vorgemerkt (R90, Nutzeranweisung aus paralleler Session): grössere Welt,
  Grafik und Stimmung Richtung Anno 1602. Start erst nach M7 und nur, wenn keine andere L0-Session
  läuft; bis dahin kein Paket.
- Dauerregel **Desktop-first** (R78). Studio: Verfassung 1.1, Handbuch 1.8, Limit-Sensor in
  Betrieb (R80).

## Parallele Sessions

| Session  | Stand         | besitzt                 | bis |
| -------- | ------------- | ----------------------- | --- |
| 664ac8d3 | abgeschlossen | nichts mehr             | –   |
| 5e248230 | aktiv         | M7-ISO (`docs/m7-spec`) | –   |

## Seit letzter Session erledigt

- Rulings R73–R88; M5-NACHLESE und STUDIO-LIMIT gemergt, CI/Pages grün; Worktrees aufgeräumt.
- Specs M6 (77 AK), M7 (inkl. 22 geprüfter Asset-Quellen, ≈ 11 MB), M8 (68 AK); Pläne M6-Sim
  und M7 (18 Tasks, ADR-011-Entwurf).
- Handbuch 1.7/1.8, Personas Desktop-first.

## Pausierte Pakete (Branches, nichts gemergt)

- **M6** — `docs/m6-spec` @ 1d28ba2 (`.worktrees/m6-spec`): Spec + Plan
  `docs/superpowers/plans/2026-09-30-m6-sim.md`. Übergabe `.studio/handoffs/m6-spec.md`.
  Nächster Schritt: Budget 17 Starts / Parallelität 2 (lead-tech 16, lead-qa 1) freigeben,
  Umsetzung M6-Sim (Task 1a/1b Baseline zuerst); Sim-Strang nach eigenem Final-Review und Gate
  Merge direkt auf main (R82a). Spec/Plan-Branch vorher nach main mergen.
- **M7** — `docs/m7-spec` @ 7c504e9 (`.worktrees/m7-spec`): Spec, Plan
  `docs/superpowers/plans/2026-09-30-m7-stimmung.md`, ADR-011. Übergabe
  `.studio/handoffs/m7-spec.md`, Lizenzurteil `.studio/handoffs/2026-09-30-m7-lizenzpruefung.md`
  (Dateien nur im Scratchpad — X1 lädt neu und prüft SHA-256). Nächster Schritt: Gate Plan
  (lead-qa, lead-production), Personas `art-rendering-engineer`/`art-audio-engineer` anlegen
  (R88), dann Welle 1: R1a → R1b → **Slice-Stopp mit Vorher/Nachher-Bildern an den Nutzer**;
  parallel R5, A1, X1a, M7-U2. Budgetantrag 64 (lead-art 41/4, lead-tech 23/1, lead-qa 1/1).
- **M8** — `docs/m8-spec` @ 2a46996 (`.worktrees/m8-spec`): Spec
  `2026-09-30-m8-kaufleute-design.md`, Übergabe `.studio/handoffs/m8-spec.md`, Werte
  `m8-werte.md`. Nächster Schritt: Gate Spec (lead-tech, lead-qa); offene Punkte Spec §21
  (M8-B1/B2 nach M6-B2; M7 AK-R2-03 feste Id-Liste; `buildMenu.ts`/`inspect.ts` nach M7-U2).
  M8-Sim blocked-by M6-Sim-Merge auf main (R87).
- Nutzer-Spielstand angefragt: `.studio/playtest/nutzer-save.json` → an lead-design (R81: Tick
  > 8000 → M8 Vorrang).

## Budget

Session 5e248230: lead-art 3/1, lead-tech 1/1, lead-qa 1/1 (Phase spec, M7-ISO); lead-tech 2/1 (Phase plan)

## Offene Entscheide

- L0: Paket lead-production `log.py result --package` (R75) + Folgeaufträge in `metrics.py` (R89); Ad-hoc-Retro „Agent unbekannt inaktiv“ prüfen (vermutlich Messartefakt);
  Restbefunde Limit-Sensor (beobachtungen.md).
- E-002-Episode für den Coach: parallele Session 01HkLmgZ schrieb R82 auf main, ohne sich in
  „Parallele Sessions" einzutragen → Nummernkollision, beim Merge als R90 umnummeriert.
- Nutzer: keine Warteschlangen-Einträge. Slice-Bilder kommen im Bericht (nicht blockierend).

## Nächste Schritte

1. Parallel: Umsetzung M6-Sim starten · Gate Plan M7 · Gate Spec M8.
2. Nach Gate Plan M7: Welle 1 (Vertical Slice) — Bilder an den Nutzer, Slice-Urteil.
3. Specs/Pläne nach main mergen, sobald die Umsetzung beginnt.
