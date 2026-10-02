# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-02 (Session-Ende 2042a460, Ampel rot)

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. M1–M7 und **M7-UX live** (main @ 03b34e1, R135). Nutzerauftrag R73 als
  Programm:
  - **M8 „Vierte Stufe und Veredelung"** — Meilenstein gestartet. Spec (79 AK) Gate bestanden
    (R141); Plan `docs/superpowers/plans/2026-10-02-m8-kaufleute.md` Gate bestanden **mit
    Auflagen** (R142, R143). Beide auf `origin/docs/m8-spec` @ 6691b6b (Worktree
    `.worktrees/m8-spec`), noch nicht auf main. **Umsetzung noch nicht gestartet.**
  - **Pages-Grössenwache** live (R130/R131): `make pages-limit` in `make check` und `pages.yml`,
    Schwelle 50 % (500 MB Seite, 50 MiB Datei); Ist 8,70 MB (0,87 %). Bei Schwelle →
    Warteschlange mit Alternativen (Nutzerauftrag). Bandbreite nicht messbar (arc42 Kap. 7).
- **M9 „Weite Welt"** vorgemerkt (R90). Kandidaten nach M8: Kurz-Spec „Spielerführung Wirtschaft"
  (nach M8-U2, R138), UI-Paket N2 Autosave (R138).
- Dauerregeln: Desktop-first (R78); im Hauptcheckout nur `git pull --ff-only`; Strang-Branches
  nach jedem abgenommenen Commit und nach grünen Integrations-Merges pushen (R107, R124, R143).
  Studio: Verfassung 1.1, Handbuch 1.11 (R136/R137: AK-Konsistenz im Spec-Gate per grep,
  Fix-Nachprüfung mit Gegenweg + grep, AK/Spec-Widerspruch melden statt still entscheiden).

## Parallele Sessions

| Session  | Stand         | besitzt     | bis |
| -------- | ------------- | ----------- | --- |
| 2042a460 | abgeschlossen | nichts mehr | –   |

## Seit letzter Session erledigt

- PAGES-LIMIT gebaut und live (R130, R131).
- M7-UX umgesetzt, AK-UX-16 nachgebessert (R132), Final-Review 2 Runden (R133–R135), live;
  Prozess-Retro und Meilenstein-Retro M7-UX, Handbuch 1.10/1.11, E-009 behalten, E-010 laufend
  (R136, R137).
- M8: Spec gegen Stand nach M7-UX nachgeführt, Gate Spec (R138–R141), Plan geschrieben, Gate Plan
  (R142, R143).

## Pausierte Pakete

- **M8-PLAN Auflagen** (eine Runde, Sichtung L0, keine Zweitprüfung):
  - Spec (lead-design, R142): AK-S3-01 auf 54; §20 W1/W2; AK-B1-02 `--silent=false`; §16.3
    Messpunkt 7300/1490.
  - Plan (lead-tech, R142/R143): B1-Controller investiert nur über fester Reserve; QA-Hinweise 1–3
    (Task 5 genau 9 tsc-Fehler; Teil B `roofOnly.bathhouse`/`glassworks`; bestätigte Abweichungen
    P1, W1, W3–W6); production B1–B5 (lead-art merged selbst; Session-/Agent-ID je
    E-010-Messpunkt, Session-Wechsel als Störgrösse; fehlende Kanten R1↔T7/T8, Worktree
    `m8-render` durch lead-art; Spec-SHA nachführen; Integrations-Merges pushen).
  - Danach Spec + Plan nach main (Integrator), lead-production legt Pakete und `blocked-by` an.
- Lokaler Branch `feat/m7-fx` @ 4489bdd (alte R5-Umsetzung, ungemergt, behalten §6.2).
- Remote `wip/r118a-render-aufraeumen` ändert Render-Tests: während M8-W5 nur per Ruling aufnehmen.
- Nutzer-Spielstand angefragt: `.studio/playtest/nutzer-save.json` → an lead-design (R81).

## Budget

keine Freigaben aktiv. Bei Start M8 neu loggen (R143): lead-tech 25 (Parallelität 4), lead-qa 3,
lead-art 4, +1 L0-Start für die frische lead-tech-Instanz (E-010). Für die Auflagen-Runde:
lead-design 1, lead-tech 1 (Fortsetzungen ggf. nicht möglich nach Session-Wechsel).

## Offene Entscheide

- L0: Paket lead-production `log.py result --package` (R75) + Folgeaufträge `metrics.py` (R89);
  Restbefunde Limit-Sensor (beobachtungen.md). Prüfauftrag Integrator im Vordergrund (R106 (2)):
  1/3 Starts gemessen. Werkzeug-Paket lead-production: Start-Hook warnt bei bereits aktiver
  L0-Session (R129 (1)).
- Aufräumen: Worktrees `.worktrees/m7-ux` und `.worktrees/pages-limit` sind gemergt und können weg
  (Branches gepusht).
- Retro-Punkt: Beobachtungen vor Übernahme in eine Spec auch gegen Rulings prüfen (Lehre R139).
- Nutzer: keine offenen Warteschlangen-Einträge.

## Nächste Schritte

0. Dauerregel R127: Ablauffehler an die Retro; Prozess-Retro nach jedem Feature-Release.
1. Auflagen-Runde M8-PLAN (oben), Sichtung L0, Spec + Plan nach main.
2. Budget M8 loggen, lead-tech (Controller 1) startet Task 1 (W1) im Worktree nach Plan.
3. Nach W4: QA-A, E-010-Übergabe an frische lead-tech-Instanz, Sim-Final-Review, Gate Merge Sim.
4. W5/W6, QA-B, D1, Final-Review M8, Gate Merge M8, Prozess-Retro.
