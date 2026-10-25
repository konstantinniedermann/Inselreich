# T05 Doku

Persona `tech-ui-engineer` (per `SendMessage`, E-017) · Tools ≈ 8 · blocked-by T04.

- `README.md` Spielanleitung: ein Satz zum Feld «Karte (Nummer, leer = Zufall)»: gültig 0 bis 99999949, leer = Zufall; die Nummer steht im Menü (`Karte N`) und lässt sich weitergeben; Eingabe wird nie gespeichert.
- `docs/arc42.md` nur, wenn eine Modulliste `src/ui/` einzeln aufführt (`rg -n "menu.ts" docs/arc42.md`): dann `seedInput.ts` mit einer Zeile ergänzen.
- `make docs-check; echo EXIT=$?` vor dem Commit. Nicht anfassen: `docs/studio/rulings.md`.
