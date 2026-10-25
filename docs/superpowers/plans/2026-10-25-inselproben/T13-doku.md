# T13 · Doku: README, arc42, Spielwerte, ADR-017, Spec-Verweis (D1, E-017)

Umsetzer `tech-sim-engineer` (Fortsetzung eines Sim-Umsetzers per `SendMessage`, sonst neuer Start) · ≈ 20 Tools · Spec §12 «Doku je Etappe» · blocked-by: T12 ·
Worktree `.worktrees/inselproben` (`feat/inselproben`) · Das Briefing erlaubt ausdrücklich die D1-Dateien unten (E-017).

## Dateien

- ändern: `README.md` (Spielanleitung, Abschnitt «Inselproben»), `docs/arc42.md` (Bausteine, Tick-Ablauf, Persistenz), `docs/spielwerte.md`,
  `docs/superpowers/specs/2026-10-23-modus-inselproben-design.md` (nur Kopfzeile «Plan: …»), `docs/beobachtungen.md` (Befunde ausserhalb Scope)
- neu: `docs/adr/ADR-017-inselproben.md` (Nummer vorher mit `ls docs/adr` prüfen; Ehrenbuch belegt ADR-016)
- nicht ändern: `src/`, `tests/`, `docs/studio/`

## Inhalt

1. **README «Inselproben»:** Einstieg (Startkarte, Menü), drei Arten (fünf Proben mit Ziel und Krisen, Tagesinsel mit Wochenplan und «erster bestandener Lauf ist
   der Tageswert», Schuldbrief mit Zins, Tilgen, Frist, keine Erstattung bei offener Schuld), Wertung in Spielzeit, Bestzeiten lokal, «Ergebnis kopieren».
2. **arc42:** Bausteine `src/sim/challenge.ts`, `src/sim/calendar.ts`, `src/sim/defs/challenges.ts`, `src/ui/challengeStore.ts`/`challengeView.ts`/Karten;
   Tick-Ablauf «… `checkWin` → `tickUnlocks` → `tickChallenge` (letzter Aufruf, ohne Probe sofortige Rückkehr)»; Persistenz: Weltfeld `challenge`,
   `SAVE_V_CHALLENGE` (versionsneutral), Rückfalt-Helfer `foldBackChallenge`, Ablage `inselreich.proben` mit `v`/`rev` neben dem Spielstand. Mermaid ohne `\n`.
3. **Spielwerte:** Tabelle Proben (Karte, Ziel, Krisen, Tickgrenze), Wochenplan, Schuldbrief-Werte mit Verweis auf das Ruling nach T05 (oder «Vorschlag»,
   solange es fehlt), `CHALLENGE_REV`.
4. **ADR-017 «Probe-Rahmen: Zustand im Welt-Save, Bestzeiten ausserhalb»:** Kontext (Wertung braucht Laden/Autosave), Entscheidung (Weltfeld `challenge` mit
   `result`; Bestzeiten in eigenem Schlüssel, Sim kennt die Ablage nicht; `tickChallenge` als letzter Schritt; Erstattung über `demolishRefund`), Alternativen
   (alles im Save; alles ausserhalb mit Partie-Merker wie ADR-016), Folgen (Save-Sprung, `rev` bei Wertänderung), Umkehrkosten.
5. **Spec-Kopfzeile:** «Plan: `docs/superpowers/plans/2026-10-25-inselproben.md`».

## Steps

- [ ] Texte nach Inhalt 1–5 schreiben; Werte aus `src/sim/defs/challenges.ts` abschreiben (nicht aus der Spec, falls ein Ruling sie änderte).
- [ ] `make docs-check; echo EXIT=$?` → 0.
- [ ] **Commit:** `docs: Inselproben in README, arc42, Spielwerte und ADR-017 (Inselproben T13)`.

## Task-Review

Prüfen: README deckt Bedienung aller drei Arten; arc42-Tick-Ablauf stimmt mit `tick.ts`; Werte gleich den Defs; ADR mit Alternativen und Umkehrkosten.
