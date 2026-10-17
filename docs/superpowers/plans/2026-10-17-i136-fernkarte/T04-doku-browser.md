# T04 Doku, Spec-AK und Browser-Check (AK-F7, AK-F8, AK-F9, AK-F10 Browser)

Dateien: `README.md` (Zeile «Fernangebot»), `docs/arc42.md` (Zeilen `order.ts`/`farOrder.ts` und `islandCard.ts` der UI-Tabelle: `homeTravel.ts` nennen); Schreibort Screenshots `.studio/qa/I-136/`. Blockiert von T03.

## Schritte

- [ ] README: im Absatz «Fernangebot» ein Satz: Karte nennt die Fahrzeit einer Einzelfahrt von der Heimat («≈ 4:10 Fahrt») und färbt die Lagerzahl rot, wenn die Fern-Insel weniger hat. arc42: `homeTravel.ts` (Fahrzeit Heimat–Insel mit Lane-Cache je Welt, von Inselkarte und Fernkarte geteilt), `farOfferParts`. Kein ADR (Umkehrbarkeit billig).
- [ ] **AK-F7:** `npx vitest run tests/sim/balance.test.ts` unverändert grün; `git diff main --stat` zeigt nichts unter `src/sim/`; `SAVE_VERSION` unverändert.
- [ ] **Zeit-Abnahme (R392):** Testliste aus dem Index nacheinander auf main und Branch; Werte in `.studio/qa/I-136/zeiten.md`; kein Test > 500 ms, kein Test > +50 %.
- [ ] `make check; echo EXIT=$?` (Testsperre R375 beachten, lange Läufe im Hintergrund, E-037) und `make docs-check; echo EXIT=$?`.
- [ ] **Browser-Check (`qa-playtester`, Headless):** zwei Fernkarten (Kontore auf zwei Fremdinseln, Fernangebot offen) mit Screenshots unter `.studio/qa/I-136/`:
  - AK-F8: beide Karten zeigen «≈ … Fahrt»; Insel mit grösserem Seeweg zeigt die längere Zeit; **Wert der Fernkarte und «Fahrzeit» der Inselkarte (Mouse-over) sind beide als Screenshot belegt** und stimmen überein.
  - AK-F9: Fern-Lager unter der Menge: `getComputedStyle(far-stock).color` = `rgb(255, 59, 92)`; Ware liefern: Farbe wechselt ohne Neuladen auf Normalfarbe (zweiter Screenshot).
  - AK-F10: `MutationObserver` auf `far-stock` (Text und `class`) meldet über 10 s keine Mutation bei unverändertem Lager; die Fristzahl im `far-lead` ist ausgenommen.
- [ ] Playtest-Report in `.studio/qa/I-136/`, Exit-Codes aller Prüfungen im Bericht. Commit `docs: I-136 T04 README, arc42`.
