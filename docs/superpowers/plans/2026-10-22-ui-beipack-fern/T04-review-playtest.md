# T04 · Task-Review (opus) und Browser-Check

Persona `qa-code-reviewer` (Modell **opus**, gilt bei Grösse S als Final-Review, Start 2) dann `qa-playtester` (Start 3) · ≈ 30 Tools · AK BF12 bis BF17 · blocked-by: T03 · Ändert keine Datei

## Review (Briefing: nur diese Datei, index.md und AK-IDs)

Ganze Branch gegen main: Spec-Konformität BF1 bis BF11, Qualität, `src/sim`-Diff nur Kommentar, `SAVE_VERSION` unberührt, ein Selektor in CSS, kein toter Code (`clock`, Anhang in `resumeCard`). Urteil OK/BEDENKEN/ZURÜCK; bei ZURÜCK Fix per `SendMessage` an den Umsetzer, Delta-Review per `SendMessage` an denselben Reviewer (R553).

## Browser-Check (Headless, Screenshots `.studio/qa/ui-beipack-fern/`)

- **BF13** Fernauftrag, Lager unter Menge: Lagerzahl rot; nach Beliefern nicht mehr rot.
- **BF14** Fernauftrag mit zu kurzer Restzeit: «· zu spät» auf der Karte; Wo-war-ich-Karte nur einmal.
- **BF15** Inselkarte per Hover: Format «Fahrzeit 27 s».
- **BF16** Neue Partie: `Umschalt+R` ohne Wirkung; nach Marke «Rat» öffnet sie die Karte.
- **BF17** Vor dem Monument überspringt Tab den Ziel-Chip.

Schlussbericht als Playtest-Report (Status je AK).
