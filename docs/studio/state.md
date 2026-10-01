# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-01 (Session-Ende 5e248230)

## Laufend (Session nach 5e248230, R107)

- Container neu: feat/m7-audio, feat/m7-fx, feat/m7-assets, docs/m8-spec und alle Worktrees verloren (nie gepusht). Neuumsetzung A1, A2, R5, X1a laeuft; M8-Spec nach M7 neu. Push-Pflicht fuer Strang-Branches.
- lead-art: R106 Punkt 3, dann Welle 2 Render R2/M6-R2, FX R5->R3, Audio A1->A3, Assets X1a (Budget 30).
- Abgenommen: R5 @ 90d07db (feat/m7-fx), A1 @ 1fe9791, A2 @ 8db7478 (feat/m7-audio; Fix-Runde offen: LOOKAHEAD/Drossel-Takt, requestFile-Callbacks, io-Fake in mk()), M7-U2 Teil B @ 0066ddc (Review+QA OK), M6-U1 @ 0d52030 (Review OK, QA laeuft) (feat/ui-m6m7). R3 @ 82f52af (Code OK, QA-R3 laeuft). M7-U1 d94e1f1: QA BEDENKEN (Fokus-Rueckgabe; AK-U1-05 erst nach Merge A2/A3 in UI pruefbar). Laufend: R2, M6-U2, Review A3, Review M7-U1. X1a blockiert (R109, Warteschlange N-90).
- lead-tech: UI M7-U2 Teil B, M6-U1 in feat/ui-m6m7 (Budget 12).

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. M1–M5 live. Nutzerauftrag nach M5-Playtest „mehr Tiefe, bessere
  Grafik, Ambiente, Musik — die Stimmung muss rüberkommen" (R73) läuft als Programm:
  - **M6 „Krisen und Stadtdienste"** — **M6-Sim auf main** (5e0135f, gepusht, R102/R103; Baseline
    off 6050, normal 7050, mild 6250). Frei: M6-R2, M6-U1, M7-R2-FW, M8-Sim. Worktrees `m6-sim`,
    `m6-sim-queries`, `m6-balance` erst per Ruling aufräumen (R87 5). Offen: M6-UI-Tasks im
    UI-Strang von M7 (M6-U1–U3, Tooltip Feuerwache).
  - **M7 „Stimmung" inkl. Isometrie** (R91–R106) — Budget 80 (lead-art 49/4, lead-tech 29/2,
    lead-qa 2/1), Freigabe je Welle. **Auf main und Pages spielbar (a6d6fb9):** R0-ISO, R1a, R1b
    (Boden, Küste, Wasser, Wald, erste Gebäude mit Höhe), M7-U2 Teil A (Holz-UI), U0-ISO (Bau-Anker,
    Picking). Slice-Urteil OK (R104), Bilder an Nutzer gesendet (`.studio/qa/M7-SLICE/`). In Branches,
    nicht gemergt: A1/A2 `feat/m7-audio` @ ad4a2ee, R5 `feat/m7-fx` @ 4489bdd, X1a `feat/m7-assets` @
    9ce9025 (Schriftdateien fehlen auf main bis X1a). **Nächste Session zuerst:** Nutzerreaktion auf
    die Slice-Bilder prüfen (R93/R96); dann R106 Punkt 3 (Spec-Auslegungen R104), dann Welle 2:
    R2 ∥ R3, M7-U2 Teil B, M6-R2, M6-U1 (alle frei, M6-Sim ist auf main).
  - **M8 „Vierte Stufe und Veredelung"** (vorgezogen, R81/R86) — **Spec fertig, Gate Spec offen**.
- **M9 „Weite Welt"** vorgemerkt (R90, Nutzeranweisung aus paralleler Session): grössere Welt,
  Grafik und Stimmung Richtung Anno 1602. Start erst nach M7 und nur, wenn keine andere L0-Session
  läuft; bis dahin kein Paket.
- Dauerregel **Desktop-first** (R78). Studio: Verfassung 1.1, Handbuch 1.8, Limit-Sensor in
  Betrieb (R80).

## Parallele Sessions

| Session  | Stand         | besitzt     | bis |
| -------- | ------------- | ----------- | --- |
| 664ac8d3 | abgeschlossen | nichts mehr | –   |
| 5e248230 | abgeschlossen | nichts mehr | –   |

## Seit letzter Session erledigt

- Session 5e248230: Nutzerauftrag „isometrische Grafiken" (R91) → ISO-Spec (21 AK), ADR-012
  akzeptiert, M7-Plan überarbeitet, Gate Spec/Plan bestanden, Welle 0/1/1b/1c, Slice OK, zwei
  Zwischen-Merges (R100, R105). M6-Sim umgesetzt und auf main (R99–R103). Personas
  `art-rendering-engineer`, `art-audio-engineer` angelegt. Rulings R91–R106. Retro
  `docs/studio/retros/2026-10-01-session-5e248230.md`.

## Pausierte Pakete (Branches, nichts gemergt)

- **M7 Audio/FX/Assets** — `feat/m7-audio` @ ad4a2ee (A1, A2), `feat/m7-fx` @ 4489bdd (R5),
  `feat/m7-assets` @ 9ce9025 (X1a, 8,5 MB). Merge erst mit M7-U1/X1b bzw. Meilensteinende.
- **M7 Render/UI** — Worktrees `m7-render`, `ui-m6m7` weiter nutzen (Stand = main nach a6d6fb9).
  Weitere Worktrees: `m7-vorher`, `m7-render-qa`, `m7-slice`, `ui-qa`, `m6-sim`, `m6-sim-queries`,
  `m6-balance`, `m6-spec`, `m7-spec`, `m8-spec`, `m5-int` — Aufräumen per Ruling (lead-production).
- **M8** — `docs/m8-spec` @ 2a46996: Gate Spec offen (lead-tech, lead-qa); M8-Sim jetzt frei (M6-Sim
  auf main).
- Nutzer-Spielstand angefragt: `.studio/playtest/nutzer-save.json` → an lead-design (R81).

## Budget

keine Freigaben (nach Session-Wechsel neu loggen; Welle 2 aus dem M7-Budget 80 freigeben)

## Offene Entscheide

- L0: Paket lead-production `log.py result --package` (R75) + Folgeaufträge `metrics.py` (R89);
  Restbefunde Limit-Sensor (beobachtungen.md); Worktree-Aufräumen per Ruling.
- Nutzer: keine Warteschlangen-Einträge. Reaktion auf Slice-Bilder offen (nicht blockierend).

## Nächste Schritte

1. Nutzerreaktion auf Slice-Bilder prüfen (R93/R96).
2. R106 Punkt 3 (lead-art: Spec-Auslegungen R104, Plan-Ausnahme `scenario-saves.test.ts`).
3. Welle 2 freigeben: R2 ∥ R3 (lead-art), M7-U2 Teil B, M6-R2, M6-U1 (lead-tech); Merge-Briefings
   mit Integrator im Vordergrund (R106 Punkt 2).
4. Parallel möglich: Gate Spec M8, danach M8-Sim.
