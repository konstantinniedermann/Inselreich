# T06 — Doku und Entwurf an L0 (AK-TB5-12)

**Dateien:** `docs/beobachtungen.md`, `docs/arc42.md` (nur falls dort `start.sh`/Drosselung/`log.py package` beschrieben ist, Grep). Der Umsetzer-Auftrag erlaubt diese D1-Dateien ausdrücklich (E-017). **Nicht** `docs/studio/rulings.md`.

**AK-TB5-12:** Erledigte Abschnitte (build_state, testrun SIGTERM, start.sh fremder Server, Board-Titel; Flake-Matching nur der Teil «ungetrackte Dateien») sind aus `docs/beobachtungen.md` entfernt; der Rest (Sammelfehler-`names`, Worktree-`start.sh`) steht mit Begründung weiter dort. arc42 stimmt mit `/api/ping`, Drosselung und `log.py package --retitle`.

## Schritte

- [ ] Lesen: nur die genannten Beobachtungs-Abschnitte (Grep auf Überschriften), kein Volltext.
- [ ] Bearbeiten, `make docs-check` Exit 0 (Prettier), Exit-Code im Bericht.
- [ ] **Entwurf an L0** (Bericht, nicht in `rulings.md`): Wortlaut für ein Ruling «TOOL-BUENDEL-5 abgenommen»: Ergebnis je Task, Messwerte T01 (vorher/nachher), Zahl abweichender `lead_phases` (T02), Entscheid Prozessgruppe (T05), Befunde ausserhalb Scope. Regelbezug R475, R471/R473.

**Commit:** `docs: TOOL-BUENDEL-5 Beobachtungen bereinigt, arc42 nachgeführt`

## Nacharbeit Gate Plan (R478)

Entwurf zusätzlich: B4-Abweichungsliste (T02), CPU-Messwert und Entscheid Drosselung (T04, B6), Entscheid Prozessgruppe (T05, B1), Hinweis B10. Arc42/Doku nur, was tatsächlich umgesetzt wurde (z. B. Drosselung nur bei Absenken ändern).
