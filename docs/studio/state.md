# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-09-30 (Session-Ende 2bf010b4)

## Aktuelles Projekt und Phase

- Projekt: **Inselreich** (Aufbau-Strategiespiel im Browser).
- M1–M5 fertig; **M5 Spielerlebnis gemergt und live** (main 3c292d5, Gate Merge R70, Retro
  `retros/2026-09-30-meilenstein-m5.md`).
- Studio: Verfassung 1.1 (vom Nutzer bestätigt, N-001), Handbuch 1.6.
- Laufender Meilenstein: **M6 Krisen und Stadtdienste** (R72) — Phase Spec.

## Parallele Sessions

| Session                 | Stand         | besitzt     | bis |
| ----------------------- | ------------- | ----------- | --- |
| M5 Abschluss (2bf010b4) | abgeschlossen | nichts mehr | –   |

## Seit letzter Session erledigt

- M5 Welle 6: D1 Doku-Pass, Final-Review OK (opus), Merge und Push, CI und Pages grün (R66, R70).
- Verfassung 1.1: Abhängigkeiten per L0-Ruling + ADR (§5.7), Parallelisieren als oberstes Prinzip
  (§5.8) (R67).
- Nutzungslimit: Modellwahl nach Aufgabe, nie Downgrade wegen Limit, stattdessen herunterfahren;
  Sessiongrösse ≈ ein Abschnitt, Übergabe spätestens bei 50 % Kontext (R68, R69, R71, Handbuch 1.6).
- M6 gewählt (R72), Spec-Entwurf begonnen.

## Laufende Pakete

keine (alle Agenten beendet)

## Pausierte Pakete

- **M6-SPEC** — Entwurf auf `docs/m6-spec` @ 7fed9ed (Worktree `.worktrees/m6-spec`, Basis vor dem
  M5-Merge). Übergabe `.studio/handoffs/m6-spec.md`, Werte `.studio/handoffs/m6-werte.md` (lokal).
  Nächster Schritt: main hineinmergen, `design-spec-author` baut die volle Spec, lead-design nimmt
  ab, dann Gate Spec (lead-tech, lead-qa).
- **STUDIO-LIMIT** — Limit-Sensor fertig auf `feat/studio-limit` @ 092f171 (Worktree
  `.worktrees/studio-limit`), make check grün; Review BEDENKEN (niedrig) behoben, aber nicht
  nachgeprüft; Dashboard nicht im Browser angesehen. Nächster Schritt: Nachprüfung am Diff und
  Browser-Blick, dann Gate Merge; wirkt erst in der Session nach dem Merge.
- **M5-NACHLESE** — Sammel-Commit auf main laut R70: Kann-Befunde A-1…A-5, B-F2…B-F9, D-1…D-5 aus
  `.studio/qa/M5-FR/report.md` (nur Labels, Namen, Doku) und Übertrag nach `docs/beobachtungen.md`
  inkl. B-F1 (Autosave nach Reload) und der zwei Design-Befunde aus M6-PREP (Steuer „hoch" nach
  Sieg dominiert; `citizens()` zählt nur Stufe 3 — Falle für eine vierte Stufe).

## Budget

keine Freigaben (nach Session-Wechsel neu loggen)

## Offene Entscheide

- L0:
  - M6-Spec, fünf Entscheide aus `.studio/handoffs/m6-spec.md` (Controller nach
    `tests/sim/controller.ts`, Krisen-Lauf Grenze 9000, Brand an Diensten, Sturm auf alle
    Rohstoffbetriebe, v2-Saves mit Krisen „aus") — Empfehlungen des Design-Leads jeweils „ja/so".
  - Retro M5: E-001 „angepasst" (Werkzeugaufrufe als Hauptgrösse), E-003 Zweck-Gegenprobe bei
    Auslegungen, drei Handbuch-Korrekturen (kein Report-Dateipfad für Subagenten, `log.py result`
    mit `--package`, Edit/Write-Regel für Text-Massenänderungen).
  - Aufräumen der gemergten M5-Worktrees und -Branches (nur gemergte, §6).
- Nutzer: keine offenen Einträge. Nutzer-Playtest von M5 läuft (390 px und Ton auf Touch,
  Frame-Zeit, Tag-Nacht über einen Tag, Autosave nach Reload). Meldet er „nach dem Sieg passiert
  nichts", M6 und M7 tauschen (R72).

## Nächste Schritte

1. Playtest-Rückmeldung des Nutzers aufnehmen (ggf. Tausch K-B/K-C).
2. Parallel: M6-SPEC fortsetzen · STUDIO-LIMIT prüfen und mergen · M5-NACHLESE auf main.
3. L0-Entscheide oben per Ruling.
