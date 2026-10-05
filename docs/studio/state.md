# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-05 (Session-Ende 6a98e530; 5-h-Fenster ≈ 30 %, Woche 28 %)

## Release-Notizen

**REL-04 (live @ 50deea8, R244)**

- **Neu:** Fest in der Kapelle (H-I007, **vom Studio vorgeschlagen**, I-007): Knopf «Fest feiern (10 Rum)» im Panel
  einer angebundenen Kapelle; 1 min lang steigen Häuser im Umkreis so schnell auf wie bei Steuer «niedrig», danach
  3 min Abklingzeit; der Knopf nennt Sperrgründe. Zusätzlich live: M12-E0 (Inseln im Weltzustand, Save v7, @ 628d690,
  R247) — ohne sichtbare Änderung, alte Spielstände werden umgewandelt.
- **Bitte testen:** Fest starten, Countdown und Abklingzeit beobachten; Sperrgründe (zu wenig Rum, nicht angebunden,
  Steuer niedrig/hoch); Speichern und Laden mitten im Fest. Lohnt sich Rum fürs Fest statt für den Verkauf?

**REL-03 (live @ 1a24d25, R232)**

- **Neu:** Anbinden-Knopf (H-U1, vom Studio vorgeschlagen), Dünen neu (H-R12b), Schuttband am Gebirgsfuss (H-R13),
  Brände gedämpft (S1-Rest). **Bitte testen:** Dünen, Anbinden-Knopf, Vorberge (S6) ausreichend sichtbar?

**REL-02 (live @ 9ff5502, R222)** — Licht für Schiff/Figuren (H-R14), „Hörbare Wirtschaft" (H-A2). **Bitte testen:**
Mangel-Ton rechtzeitig, Arbeitsgeräusche angenehm?

**REL-01 (live @ 6dc3dc1, R216)** — Licht Häuser/Bäume, Wiesen-Unebenheiten, Brandmeldung springt. **Bitte testen:**
Gesamtbild, Wiese?

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. Live auf main @ 628d690 (CI/Pages grün): M1–M8, M10, M11, M9-Häppchen, REL-01…REL-04,
  Hotfix H-T3, **M12-E0**. Programm Nutzerfeedback: `docs/superpowers/specs/2026-10-02-programm-nutzerfeedback.md`.
- **Session-Fokus Spielinhalte (R237):** Prozessarbeit (Handbuch-Umsetzung R233/R236) und paintPixels-Performance
  ruhten; Nutzer-Auftrag gilt, bis er etwas anderes sagt.
- **Arbeitsweise (Handbuch 1.18):** Release-Bündel E-028, Discovery-Strang E-027, Stilrahmen S1–S6 (R211).
- **M12 „Weite Welt" (läuft, etappenweise Merges R247):** Spec `docs/m12-brainstorming` @ 619eea5 (+ Anhang 05
  „Drittes Ziel «Gewürzstadt»", R239). Save: v7 = E0 (live), v8 = E1, v9 = Seefahrt-Bündel, v10 = E6.
  - **E1** (Archipel, v8): `feat/m12-e1` @ 218b191 (Worktree `.worktrees/m12-e1`), C1 (T00–T02) und C2 (Merge E0,
    T03–T05) fertig (R246, R248). Weiter: **C3 = T06 UI (+ Baumstempel-Seed-Test) + T07 Browser-Messung (Malbänder
    15–51 ms Spitzen, ggf. `SLICE_ROWS` 16) + Playtests**, dann C4 = T08 + Final-Review lead-qa (Fix-Runden T03/T04
    ausdrücklich prüfen, R248). Übergabe `.studio/handoffs/2026-10-05-m12-e1-C2-an-C3.md`. `.worktrees/m12-e1-terrain`
    kann nach C3 weg.
  - **Seefahrt-Bündel E2+E3+E4 (+ Anhang 05):** Plan `feat/m12-see` @ 11d5da7 (Gate R241, Nachtrag eingearbeitet;
    D-142 islandTrait-Dämpfung, D-143 Heimat aktiv vor `seafaring`, D-144 Platzhalter + 3 Mindestregeln). **M0 erfüllt
    ab E1 766df67** → C1 (T00–T02 Integrationsbranch) kann starten. Budget 50 (lead-tech 49, lead-qa 1).
  - E6-Werte F-P7 prüft design-economy-designer vor dem E6-Plan.
- **Ideen:** IDEEN-03 entschieden (R238): I-010 eingeplant (in M12), I-011/012/014 geparkt, I-013 verworfen.
- **REL-05 (Kandidaten):** paintPixels-Performance (R236, technisch) · M9 Rest G7b Landtiere, K3 Silhouetten (R186),
  Typ-Erkennung kleiner Bauten (R195) · kosmetische REL-04-Befunde (beobachtungen.md).
- Dauerregeln: Desktop-first (R78); im Hauptcheckout nur `git pull --ff-only`; kein Rebase (§6.3, R212); Integrator
  mergt im Worktree `.worktrees/integrate`; L0 committet nie im Hauptcheckout, solange dort jemand arbeitet (R198);
  Persona-Start als `general-purpose` braucht `model` (R212); Löschen im Repo ohne Rückfrage, ausserhalb verboten
  (R207). Leads treffen keine Rulings (R232). Studioweit ≤ 5 Arbeiter gleichzeitig (R241).
- Token-Effizienz: E-010 (Leads ein Auftrag je Instanz, Controller `sonnet`, Deckel 200k Kontext / 6
  Arbeiter-Starts, L0-Übergabe nach Gate-Block bzw. 25 % Kontext).

## Parallele Sessions

| Session  | Stand         | besitzt     | bis |
| -------- | ------------- | ----------- | --- |
| 6a98e530 | abgeschlossen | nichts mehr | –   |

## Seit letzter Session erledigt

- R237 Fokus Spielinhalte. IDEEN-03 (R238) → Spec-Nachtrag I-010 „Gewürzstadt" (R239).
- Plan Seefahrt-Bündel + Gate (R241). H-I007 Fest in der Kapelle: Kurzdesign → Plan → Gate (R240) → Umsetzung →
  REL-04 live (R243, R244).
- M12-E0 C2, C3, Final-Review, Delta-Merge REL-04 → **E0 live** (R242, R245, R247). E1 C1 + C2 (R246, R248).
- Kurz-Retro und Prozess-Retro REL-04/E0 (Berichte unter `docs/studio/retros/`, Vorschläge offen).

## Pausierte Pakete

- Worktrees: `.worktrees/integrate` (bleibt), `.worktrees/m12-design`, `.worktrees/m12-e1`, `.worktrees/m12-see`
  (laufend); `.worktrees/m12-e0`, `.worktrees/h-i007`, `.worktrees/ideen-03`, `.worktrees/h-u1`, `.worktrees/h-t3`,
  `.worktrees/rel03-*`, `.worktrees/h-r12` (gemergt) können weg; `.worktrees/m12-e1-terrain` nach E1 C3.
- Remote-Branches überholt, nicht gemergt: `rel/rel-01`, `docs/rel-01-arc42` — bleiben (§6.1).
- Lokaler Branch `feat/m7-fx` @ 4489bdd, Remote `wip/r118a-render-aufraeumen`, `stash@{0}`: unverändert, bis Ruling.

## Budget

- M12-E1: lead-tech 27 Starts, davon C1 6 + C2 6 verbraucht → **15 frei** (C3 6, C4 3, Reserve 6); lead-qa 1.
- Seefahrt-Bündel: 50 (lead-tech 49, lead-qa 1), unverbraucht, Freigabe ab M0 (erfüllt) — neu loggen je Controller.

## Offene Entscheide

- **Nutzer (Warteschlange N-95):** `feastAt` ohne neue Save-Version (R240 D-140) — Empfehlung ja; bei Nein
  Versionswechsel mit Identitäts-Migration.
- Nutzer: Test REL-01…REL-04 (oben); R90-Auslegung „grössere Karte" = grössere Welt (R226 F-02) — kippbar; Abnahme
  M10/M11 im Spiel und Tempo M11 (R185/R192).
- L0: Vorschläge aus Kurz-Retro und Prozess-Retro dieser Session; Handbuch-Umsetzung R233/R236 (b)/(c) ruht (R237).
- L0: Experiment-Plätze voll (E-022, E-027, E-028). Wartend: E-025, E-023, E-026, E-019, E-024, E-018, E-020,
  E-012, E-006.
- CI: Node-20-Abkündigung der Actions und `ubuntu-latest` → Ubuntu 26 ab 2026-10-19 (beobachtungen.md); Zeittests
  flackern unter paralleler Agenten-Last (AK-R1-06, AK-E0-15a, B6).

## Nächste Schritte

0. Dauerregel R127: Ablauffehler an die Retro; Prozess-Retro nach jedem Feature-Release.
1. Retro-Vorschläge dieser Session entscheiden (Ruling).
2. Parallel: **E1 C3** (lead-tech sonnet, Übergabe C2→C3) ∥ **Seefahrt C1** (T00–T02 auf Integrationsbranch,
   `feat/m12-see` holt E1 @ 766df67 oder neuer per Merge), Obergrenze 5 Arbeiter.
3. Danach E1 C4 (T08 + Final-Review) → Gate Merge E1 (Etappe) → Seefahrt-Stränge e2/e3/e4/render ab M1.
4. Nutzerurteil zu REL-01…04 und N-95 umsetzen, sobald es vorliegt.
