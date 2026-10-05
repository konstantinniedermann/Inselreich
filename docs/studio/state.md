# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-05 (Session-Ende ad51d3c5; 5-h-Fenster 64 %, Woche 24 %)

## Release-Notizen

**REL-03 (live @ 1a24d25, R232)**

- **Neu:** Knopf «Anbinden (n Wege · x Geld)» im Info-Panel eines nicht angebundenen Betriebs baut den kürzesten
  Weg zum Netz, Vorschau beim Überfahren (H-U1, **vom Studio vorgeschlagen**, I-001). Dünen neu ohne Streifen und
  Zacken (H-R12b, dritter Anlauf). Schuttband und weicher Übergang am Gebirgsfuss (H-R13). Brennende Gebäude
  gedämpft statt schwarz (S1-Rest).
- **Bitte testen:** Sehen die Dünen jetzt gut aus? Ist der Anbinden-Knopf hilfreich (Weg darf durch Wald führen)?
  Vorberge als Form nur schwach sichtbar (Stilregel S6) — reicht dir das?

**REL-02 (live @ 9ff5502, R222)**

- **Neu:** Schiff, Figuren und Effekte im Licht des Stilrahmens (H-R14). „Hörbare Wirtschaft" (H-A2, vom Studio
  vorgeschlagen): Doppelton bei Mangel, leise Arbeitsgeräusche.
- **Bitte testen:** Hörst du Mangel rechtzeitig? Arbeitsgeräusche angenehm (Regler „Effekte")?

**REL-01 (live @ 6dc3dc1, R216)**

- **Neu:** Häuser und Bäume im Licht des Gebirges (H-R10), Unebenheiten in Wiese und Waldboden (H-R11), Klick auf
  Brandmeldung springt zum Gebäude (H-U2). **Bitte testen:** Gesamtbild, Wiese zu ruhig/unruhig?

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. Live auf main @ 1ee86f7 (CI/Pages grün): M1–M8, M10, M11, M9-Häppchen H-R1…H-R14,
  H-R12b, H-S1, H-U1, H-U2, H-A2, S1-Rest; Werkzeug H-T1, H-T2, W-V3; Hotfix H-T3 (Cache Vorberge, CI-Grenze H-R9 B4 20 ms, R234–R236). Programm Nutzerfeedback:
  `docs/superpowers/specs/2026-10-02-programm-nutzerfeedback.md`.
- **Arbeitsweise (Handbuch 1.18):** Release-Bündel E-028, Discovery-Strang E-027, Stilrahmen
  `docs/superpowers/specs/2026-10-04-stilrahmen.md` (S1–S6, R211).
- **M12 „Weite Welt" (läuft):** Archipel aus Heimatinsel + **zwei** Fremdinseln (R226, R228), Gewürz,
  zweites Kontor, Schiffe. Spec `docs/superpowers/specs/2026-10-05-m12-weite-welt-spec.md` (+ 4 Anhänge) auf
  `docs/m12-brainstorming` @ fbeebca (Gates R227, R228, R230, D-139 in R231). Save-Versionen: v7 = E0, v8 = E1,
  v9 = Seefahrt-Bündel E2+E3+E4, v10 = E6.
  - **E0** (Inseln im Weltzustand, Save v7, ADR-013): Plan R229, `feat/m12-e0` @ b296c0d (Worktree
    `.worktrees/m12-e0`), **T00–T02 fertig** (C1), H-U1 eingemergt. Weiter: **C2 = T03–T05** ab Übergabe
    `.studio/handoffs/2026-10-05-m12-e0-C1-an-C2.md`, dann C3 = T06 + Final-Review lead-qa. Vor T03: main
    (REL-03) per Merge holen (Fluss main → E0 → E1).
  - **E1** (Archipel zeichnen, v8): Plan R231, `feat/m12-e1` @ acd3dab (Worktree `.worktrees/m12-e1`), 4
    Controller 6/6/6/3. Sim T00–T02 nach E0-T03 (T02 nach E0-T05); Render T03–T08 jetzt frei (REL-03 auf main),
    aber über E0 holen.
  - Seefahrt-Bündel E2+E3+E4: Plan fehlt (Auflagen Anhang 04 Teil B, R228 (7)). E6-Werte F-P7 prüft
    design-economy-designer vor dem E6-Plan.
- **REL-04 (Kandidaten):** **paintPixels-Performance mit Vorrang (R236)** · I-007 „Fest in der Kapelle" (Studio-Platz); M9 Rest: G7b Landtiere, K3 Silhouetten
  (R186), Typ-Erkennung kleiner Bauten (R195). Ideen-Runde IDEEN-03 nach REL-03 fällig.
- Dauerregeln: Desktop-first (R78); im Hauptcheckout nur `git pull --ff-only`; kein Rebase (§6.3, R212); Integrator
  mergt im Worktree `.worktrees/integrate`; L0 committet nie im Hauptcheckout, solange dort jemand arbeitet (R198);
  Persona-Start als `general-purpose` braucht `model` (R212); Löschen im Repo ohne Rückfrage, ausserhalb verboten
  (R207). Leads treffen keine Rulings (R232).
- Token-Effizienz: E-010 (Leads ein Auftrag je Instanz, Controller `sonnet`, Deckel 200k Kontext / 6
  Arbeiter-Starts, L0-Übergabe nach Gate-Block bzw. 25 % Kontext).

## Parallele Sessions

| Session  | Stand         | besitzt     | bis |
| -------- | ------------- | ----------- | --- |
| ad51d3c5 | abgeschlossen | nichts mehr | –   |

## Seit letzter Session erledigt

- „mach weiter" (R225): R224-Regeln umgesetzt (Handbuch 1.18, Integrator-Persona 1.6).
- M12: Brainstorming (R226) → Spec mit Gates (R227, R228, R230) → Plan E0 (R229) → Plan E1 (R231); E0 T00–T02.
- REL-03 live (R232): H-U1, S1-Rest, H-R13, H-R12b. Danach CI rot → Hotfix H-T3 live (R234–R236).
- Retros: Kurz-Retro, Prozess-Retro REL-03, Ad-hoc-Retro CI → R233, R236.

## Pausierte Pakete

- Worktrees: `.worktrees/integrate` (bleibt), `.worktrees/m12-design`, `.worktrees/m12-e0`, `.worktrees/m12-e1`
  (laufend); `.worktrees/h-u1`, `.worktrees/h-t3`, `.worktrees/rel03-*` und `.worktrees/h-r12` (gemergt bzw. Material) können weg.
- Remote-Branches überholt, nicht gemergt: `rel/rel-01`, `docs/rel-01-arc42`. Löschen entfernter Branches ist
  verboten (§6.1) — bleiben stehen.
- Lokaler Branch `feat/m7-fx` @ 4489bdd, Remote `wip/r118a-render-aufraeumen`, `stash@{0}`: unverändert, bis Ruling.
- Fremder Chrome-Prozess (PID 67882, `--remote-debugging-port=9272`) aus einem H-U1-Lauf lief noch.

## Budget

- M12-E0: lead-tech 20 Starts (C1 verbrauchte 6 → 14 frei), lead-qa 1 (Final-Review).
- M12-E1: lead-tech 27 Starts, lead-qa 1 — unverbraucht.

## Offene Entscheide

- Retro-Vorschläge 2026-10-05 entschieden (R233); V4 zurückgestellt bis Messung.
- L0: Experiment-Plätze voll (E-022, E-027, E-028). Wartend: E-025, E-023, E-026, E-019, E-024, E-018, E-020,
  E-012, E-006.
- lead-design: Wald-Gleichstand beim Anbinden (beobachtungen.md, H-U1).
- CI: `ubuntu-latest` wechselt ab 2026-10-19 auf Ubuntu 26; CI-Zeitreserve AK-R1-06 ≈ 2,0 s von 2,25 s.
- Nutzer: Test von REL-01, REL-02, REL-03 (Release-Notizen oben); Auslegung R90 „grössere Karte" = grössere Welt,
  Heimatinsel bleibt 64×64 (R226 F-02) — kippbar; Abnahme M10/M11 im Spiel und Tempo M11 (R185/R192).
- Warteschlange leer.

## Nächste Schritte

0. Dauerregel R127: Ablauffehler an die Retro; Prozess-Retro nach jedem Feature-Release.
1. studio-coach setzt R233 und R236 (b)/(c) ins Handbuch um (V1–V3, Briefing-/Berichtsvorlage).
2. M12-E0 fortsetzen: main per Merge in `feat/m12-e0`, C2 (T03–T05) starten, dann C3 (T06) und Final-Review.
3. Parallel IDEEN-03 (lead-design) und E1-Render T03 ff. sobald E0 main enthält; E1-Sim nach E0-T03.
4. Plan Seefahrt-Bündel E2+E3+E4 (lead-tech, opus), sobald E0 gemergt oder kurz davor.
5. Nutzerurteil zu REL-01–03 umsetzen, sobald es vorliegt.
