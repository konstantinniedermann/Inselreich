# T08 · Doku README und arc42

Strang A · Persona `tech-ui-engineer` (Fortsetzung per `SendMessage`) · Modell sonnet · ≈ 12 Tools · blocked-by: T07 (Urteil OK) · Gate-Auflage 8, Spec Tech 6 (E-017: D1-Dateien ausdrücklich erlaubt)

**Files:** Modify `README.md`, `docs/arc42.md`; im Plan-Ordner `docs/superpowers/plans/i223-zehnt/zeiten.md` (nur Spalte «Branch» aus dem T06-Ledger).

## Inhalt

1. **README, Spielanleitung** (Abschnitt Amtsstube/Steuern, `rg -n "Amtsstube" README.md`): Absatz «Zehnt» mit den vier Spielertexten der Spec (wörtlich), Hinweis «ab der Amtsstube (erste Siedler)», Kurs in Worten («etwa 17 % billiger als der Zukauf»), Sperre 3 Minuten je Stufe, Warnung vor leerer Kasse. Keine Formeln.
2. **arc42** (`rg -n "save.ts|migrateV|StepReport|tickTaxes" docs/arc42.md`):
   - Persistenz: Zeile der neuen Migration (`migrateV<M>ToV<M+1>`, drei Felder mit Startwerten, Strukturprüfung `isValidTithe`), Save-Nummer per Merge-Reihenfolge (R909).
   - Tick-Ablauf: `tickTaxes` bucht Geldanteil und Zehnt-Ware (`titheSplit`), `StepReport.titheLost` (kein Welt-Feld); UI summiert je `UPKEEP_INTERVAL` (`collectTitheLoss`).
   - Bausteinsicht: `src/ui/titheView.ts` (DOM-frei), `src/ui/titheDialog.ts`.
3. `zeiten.md`: Spalte «Branch» füllen (Werte aus T06), Zeile «Messung nachher» mit Commit und Last.

## Schritte

- [ ] Umsetzen (Inhalt 1–3).
- [ ] `make docs-check; echo EXIT=$?` → 0.
- [ ] Commit `docs: I-223 Zehnt in README und arc42 (T08)`.
