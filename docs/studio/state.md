# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-06 (Session-Ende e51712dd; 5-h-Fenster ≈ 31 %, Woche 42 %)

## Release-Notizen

**REL-05 (live @ 30a9f50, R277) — M12 Seefahrt-Bündel + Saum Fernansicht**

- **Neu:** Kontor II auf Fremdinseln gründen, dort bauen, handeln und Aufträge liefern; Lager, Bilanz und Krisen je
  Insel; neues Gut **Gewürz** (Plantage nur auf Gewürzinseln), Kaufleute brauchen es; **Handelsschiffe** kaufen und
  Routen in 2 Klicks; **drittes Ziel «Gewürzstadt»** (vom Studio vorgeschlagen, I-010). Aktive Insel mit Taste `9`
  wechseln, `0` = Heimat, Menü „Inseln". Saum im Flachwasser in der Fernansicht ohne Streifen (H-R15). Save v9.
- **Bitte testen:** Ein Kontor II gründen und Gewürz heimholen — ist der Weg verständlich? Schiffsroute anlegen und
  auflösen; drittes Ziel erreichbar? Fällt auf, dass Schiffe am Heimatkontor über den Strand fahren (Folgepaket)?

**M12-E1 Archipel (live @ d2d08fb + H-T4, R266/R268)** — zwei Fremdinseln, Fernansicht bis Zoom 0,125, Save v8.
**Bitte testen:** Herauszoomen auf den Archipel — flüssig?

**REL-04 (live @ 50deea8, R244)** — Fest in der Kapelle. **Bitte testen:** Fest, Sperrgründe, Speichern im Fest.

**REL-01…REL-03 (live)** — Licht, Wiese, Dünen, Anbinden-Knopf, Vorberge, Licht für Schiff/Figuren, hörbare
Wirtschaft. **Bitte testen:** Gesamtbild, Dünen, Mangel-Ton.

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. Live auf main @ 30a9f50 (CI 37468348957 / Pages 37468348971 grün): M1–M8, M10, M11,
  M9-Häppchen, REL-01…REL-05, **M12-E0, E1, Seefahrt-Bündel E2–E4 + drittes Ziel**. Verfassung **1.2** (R261:
  Spielstände müssen nicht rückwärtskompatibel sein — neue Formate ohne Migration, Abweisen mit Hinweis).
  Handbuch **1.21**.
- **Session-Fokus Spielinhalte (R237)** gilt weiter, bis der Nutzer etwas anderes sagt; Nutzer überlässt L0
  Technik-/Auslegungsentscheide (R260).
- **M12 „Weite Welt":** Muss-Teile E0–E4 + Anhang 05 live. Offen: **E5** (Seekarten-Übersicht, Gründungsfahrt) und
  **E6** (Händlerschiff I-006; Werte F-P7 entschieden R262, `OFFER_MIN_BUY` ≥ 30, Save v10 ohne Migration) —
  Kann-Teile, Entscheid über Planung durch L0 (R259/R262). Danach M12-Meilenstein-Retro.
- **Folgepakete aus REL-05 (R274b):** (1) Fahrlinie mit Wegpunkten im Wasser (ändert `d`/E1-Band, braucht Ruling);
  (2) UX: Heimatkontor-Klick → Schiffe direkt, Text „spiel frei weiter" bei offenem drittem Ziel, v99 „zu neu" statt
  „beschädigt"; (3) Art: Schiffskontrast (heller Rand/Kielwasser). Beobachtungen in `docs/beobachtungen.md`.
- **Werkzeuge neu:** `make messfenster` (Mess-Wächter, R269) vor jeder Messung; Zeittests seriell (E-030), Wächter
  `make zeittests`; Zeittests mit CI-Reserve ≤ 50 % des Timeouts (R270, Audit H-T5).
- Dauerregeln: Desktop-first (R78); kein Rebase (§6.3); Integrator mergt nur in `.worktrees/integrate` (R264) und
  führt vor jedem Push `make check` + `CI=true make check` mit Exit-Code aus (R270); L0 committet nie im Hauptcheckout,
  solange dort jemand arbeitet (R198); `pkill`/`killall` auf allgemeine Namen verboten (R263); Controller
  (`lead-tech`) auf **sonnet**, Plan/Meilenstein-Retro ausdrücklich opus (R264); Studioweit ≤ 5 Arbeiter (R241).
- Token-Effizienz: E-010 (Leads ein Auftrag je Instanz, Deckel 200k Kontext / 6 Arbeiter-Starts, L0-Übergabe nach
  Gate-Block bzw. 25 % Kontext).

## Parallele Sessions

| Session       | Stand         | besitzt               | bis |
| ------------- | ------------- | --------------------- | --- |
| e51712dd      | abgeschlossen | nichts mehr           | –   |
| anno-clone #3 | abgeschlossen | Hex-Demo (Scratchpad) | –   |

## Seit letzter Session erledigt

- Handbuch 1.19–1.21 (R251, R264, R270), E-028 abgeschlossen „behalten", E-026 übernommen, E-030 läuft.
- Verfassung 1.2 durch den Nutzer (R261). N-95, N-96 erledigt (R260, R261).
- Werkzeuge: E-030 Zeittests seriell (R252), Mess-Wächter (R269). Hotfixes H-T4, H-T5 (CI-Timeouts, R267, R271).
- **M12-E1 live** (C3/C3b/C4, F1, R263–R268); **Seefahrt-Bündel C1–C5 + F2 → REL-05 live** mit H-R15 (R254–R277).
- F-P7 Werte E6 entschieden (R262). Ad-hoc-Retros E1 C3 und CI H-T4 (R264, R270).

## Pausierte Pakete

- Worktrees: nur `.worktrees/integrate` (bleibt). Alle M12-Worktrees entfernt; Ledger unter `.superpowers/sdd/`.
- Remote-Branches überholt, nicht gemergt: `rel/rel-01`, `docs/rel-01-arc42` — bleiben (§6.1). Lokale Branches der
  Session (`feat/m12-*`, `fix/h-t4…`, `fix/h-t5…`, `tool/*`, `feat/h-r15-saum`, `rel/rel-05`) gemergt, bleiben.
- Lokaler Branch `feat/m7-fx` @ 4489bdd, Remote `wip/r118a-render-aufraeumen`, `stash@{0}`: unverändert, bis Ruling.

## Budget

- Seefahrt-Bündel (R241, 50): verbraucht ≈ 41 (C1 6, C2 8, C3 6, C4 10, C5 7, F2 4) → Rest verfällt mit dem Merge.
- Neue Pakete brauchen eigene Freigabe.

## Offene Entscheide

- Nutzer: Test REL-01…REL-05 und E1 (oben). Warteschlange leer.
- L0: E5/E6 planen oder M12 abschliessen; Reihenfolge der drei Folgepakete. Retro-Vorschläge entschieden (R278).
- Experiment-Plätze: E-022, E-027, E-030 belegt. Wartend: E-029 (erster Nachrücker), E-025, E-023, E-019, E-024,
  E-018, E-020, E-012, E-006.
- CI: Node-20-Abkündigung der Actions und `ubuntu-latest` → Ubuntu 26 ab 2026-10-19 (beobachtungen.md).

## Nächste Schritte

0. Dauerregel R127: Ablauffehler an die Retro; Prozess-Retro nach jedem Feature-Release.
1. R278 umsetzen: studio-coach (Integrator-Prettier nach Union-Merge, Startpunkt Folgestränge, Messkriterien +
   Zeitbox im Plan, Release-Playtest auf Delta) und Werkzeug-Paket „doppelte R-Nummer" im Studio-Test.
2. Folgepakete REL-05: zuerst (2) UX und (3) Schiffskontrast als Häppchen (parallel, disjunkte Dateien), (1)
   Fahrlinie mit eigenem Ruling (Wirkung auf `d`).
3. Entscheid E5/E6: Brainstorming lead-design → Plan (lead-tech opus) oder M12-Abschluss mit Meilenstein-Retro.
