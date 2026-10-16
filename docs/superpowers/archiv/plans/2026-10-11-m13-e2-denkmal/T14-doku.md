# T14 · Doku: README, arc42, Beobachtungen, Verweise in der E1-Spec

Strang ui · Worktree `.worktrees/m13-e2-ui` · Umsetzer `tech-ui-engineer` (sonnet) · Spec §11, §12, Anhang 05,
Anhang 08 F · blocked-by T13 und T07 (Messwert Lauf B) · Grösse S (≈ 15 Tools) · E-017, Index E6

**D1-Dateien ausdrücklich erlaubt (E-017):** `README.md`, `docs/arc42.md`, `docs/beobachtungen.md` (nur anhängen),
`docs/superpowers/archiv/specs/2026-10-10-m13-e1-edikte-design.md` (**nur** zwei Verweiszeilen, unten). Keine andere Datei.

## Inhalt (Anhang 05)

- **README, Abschnitt «Denkmal» unter «Ziel»:** frei nach dem Kaufleute-Ziel, nur Heimatinsel, eines, 3×3, Bauplatz
  500 Geld, 10 Holz, 10 Stein; Tabelle der drei Abschnitte (Name, Geld, Stein, Werkzeug, Glas, Gewürz) **aus
  `MONUMENT_STAGES` abgeschrieben und gegengelesen**; Lieferung 1 Stück je Gut und Sekunde aus dem Lager über der
  Reserve («mindestens 20, sonst 8 × Hausverbrauch je 100 Ticks»); Schalter «zukaufen» je Gut zum Kontorpreis (mit
  Edikt Handel −20 %); «Bau pausieren»; Abriss ohne Erstattung von Abschnitts-Geld und Ware; Wahlziel ohne Lohn,
  Ziel-Chip und Inselchronik. Satz aus Lauf B nach dem **Messwert** im T07-Bericht (Vorlage Anhang 03 C); Satz «Voll
  zugekauft dauert der Bau 10 Minuten und kostet 64 200 Geld.»
- **README, Inselchronik:** Zeile «Wahlziel». **README, Bedienung:** Abriss-Bestätigung beim Denkmal mit Fortschritt
  (Knopf und `Entf`/`Backspace`), Abriss-Werkzeug überspringt es (R483).
- **`docs/arc42.md`:** Bausteine `src/sim/monument.ts`, `src/sim/defs/monument.ts`, `src/ui/monumentView.ts`,
  `src/ui/demolishConfirm.ts`, `src/ui/monumentSection.ts`, `src/render/monumentSprite.ts`,
  `src/render/monumentStage.ts`; Zukaufweg `buyMonumentUnit` in `trade.ts`; Tick-Ablauf (`tickMonument` direkt nach
  `tickEconomy`, vor `checkWin`); Persistenz (Version 12, `migrateV11ToV12`, Prüfung V1–V9, Kette v1 … v12,
  Rückfaltung `foldBackToV11` mit Positivliste ohne Umordnen); Obergrenzen (Aufflammen unter `CAPS`). Mermaid ohne
  `\n` in Labels.
- **`docs/CREDITS.md`:** keine Änderung. **ADR:** keiner.
- **E1-Spec (Index E6):** bei AK-M13E1-14 und AK-M13E1-36 je eine Zeile «Berichtigt durch Spec M13-E2, Anhang 08 F»
  mit Link; Wortlaut der AK selbst nicht ändern.
- **`docs/beobachtungen.md`:** Befunde aus den Ledgern, die ausserhalb des Scopes liegen (Datum, Fundort, Beobachtung,
  Ursprung, Einschätzung), nur anhängen.

## Schritte

- [ ] **Schritt 0:** `git merge --no-ff <letzter Sim-Hash OK (T07)>`; danach `git merge main` (Doku-Hot-Spot mit
      I-049/I-048, Zeile `save.ts` in arc42 abgleichen); `grep -n "Version 11\|save.ts" docs/arc42.md`.
- [ ] **Schritt 1:** Texte schreiben; Zahlen gegen `src/sim/defs/monument.ts` und `BUILDING_DEFS.monument` prüfen.
- [ ] **Schritt 2:**

```bash
make docs-check; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `docs: Denkmal in README und arc42, Verweise E1-Spec (M13-E2 T14)`.

## Bericht

Liste der geänderten Abschnitte, der Lauf-B-Satz im Wortlaut, Exit-Code `docs-check`.
