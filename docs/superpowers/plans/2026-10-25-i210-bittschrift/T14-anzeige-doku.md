# T14 Anzeige B4/B5 und Doku

Persona `tech-ui-engineer` (Strang C, nach der Pause neu gestartet oder per `SendMessage` fortgesetzt) · Tools ≈ 35 · Anhang 05 §1 Zeilen 3 und 4 · blocked-by T10, T11. Das Briefing erlaubt die D1-Dateien `README.md`, `docs/arc42.md` und `docs/adr/` ausdrücklich (E-017).

**Vorlauf:** `feat/i210` (mit T11 und `main` samt I-201) per Merge in `feat/i210-ui`, kein Rebase.

**Files:** Modify `src/ui/petitionLog.ts` (`effectLines`), `src/ui/inspect.ts` (abschnittsweise), `src/ui/feast.ts` bzw. die Kapellen-Knöpfe aus I-201 (Text «Festtrunk: ohne Rum, ohne Abklingzeit»), `tests/ui/petitionLog.test.ts`, `README.md`, `docs/arc42.md`, ADR-005 (Nachtrag, Datei per `ls docs/adr | rg "005"`).

## Interfaces

- Consumes (T11): `bellActive(world, house)`, `voucherAt(world, chapelId)`; (I-201) Kapellen-Knopfmodell in `src/ui/feast.ts`.
- Produces: weitere Zeilen aus `effectLines`; Knopftext der Kapelle bei Gutschein.

## Schritte

- [ ] **Tests zuerst** (`tests/ui/petitionLog.test.ts`, bei Bedarf `tests/ui/feast.test.ts` per Zusatzfall):
  - Haus im Radius einer geweihten Glocke → Zeile «Glockenweihe bis …»; ausserhalb keine.
  - Kapelle mit Gutschein → Festknöpfe tragen «Festtrunk: ohne Rum, ohne Abklingzeit». Nach dem Fest ist der Text weg.
- [ ] Rot, Umsetzen, Grün: `npx vitest run tests/ui/petitionLog.test.ts tests/ui/feast.test.ts; echo EXIT=$?`.
- [ ] **Doku** (je Abschnitt per `rg -n` suchen, nicht ganze Dateien lesen):
  - `README.md` Spielanleitung: Abschnitt «Bittschriften»: wann sie kommen (1 min nach Ziel 1, dann alle 10 min), Ja und Nein mit Beispiel B1, Frist 2 min, Kästchen bei «Neue Insel», Proben ohne Bittschriften.
  - `docs/arc42.md`: Baustein `petitions` und Blatt `petitionEffect` (Leseorte-Liste), Tick-Ablauf (nach `tickCrises`, vor `checkWin`), Persistenz (Feld `petitions`, Version main + 1, Migration «aus»), `StepReport.petitions`.
  - ADR-005-Nachtrag (Tick-Reihenfolge): `tickPetitions` nach `tickCrises`, vor `checkWin`, `tickUnlocks` bleibt letzter Aufruf (Spec §3.4 «Tick-Platz»). Folge festhalten: Den Sieg aus Tick T sieht die Bittschrift erst in T + 1 (P-6).
  - `make docs-check; echo EXIT=$?` = 0 vor dem Commit.
- [ ] Teilbeleg: `npx tsc --noEmit`, `make lint`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] Commits `feat: I-210 Anzeige Glockenweihe und Festtrunk` und `docs: I-210 README, arc42 und ADR-005-Nachtrag`.
