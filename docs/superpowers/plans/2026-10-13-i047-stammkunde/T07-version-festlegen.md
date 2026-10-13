# T07 — Merge-Schritt «Version festlegen» (AK-SK-21, -22; R583 (2), R584 Tech 3)

Controller (kein Arbeiter-Start). Zeitpunkt: nach dem Final-Review, vor dem Bericht an L0, und erneut direkt vor dem
Merge-Gate, falls `main` sich bewegt hat. Hintergrund: Erweiterung 1 K2 plant ebenfalls v14; wer zuerst nach `main`
merged, nimmt v14, der andere zieht nach (R487 P-4).

## Prüfen

- [ ] `git show main:src/sim/save.ts | grep -n "SAVE_VERSION ="` (nicht in eine Pipe für Exit-Codes; nur Lesen).
- [ ] Steht auf `main` noch `13`: nichts ändern, I-047 bleibt v14. Vermerk im Bericht.

## Nachziehen (nur wenn `main` schon `M ≥ 14` hat)

`main` per Merge holen (`git merge main`, kein Rebase). I-047 nimmt `N = M + 1`. **Genau diese sechs Stellen**, sonst
nichts:

1. `SAVE_VERSION = N` (`src/sim/save.ts`).
2. Literal `version: N` in `World` (`src/sim/types.ts`).
3. `version: N` in `createWorld` (`src/sim/world.ts`).
4. Migrationsname `migrateV13ToV14` → `migrateV(N−1)ToVN`, Aufruf als **letztes** Glied der Kette in `deserialize`
   (hinter der Migration des anderen Pakets; `raw.version === N − 1`).
5. Rückfalt-Kette `tests/sim/helpers.ts`: `foldBackToV13` → `foldBackToV(N−1)`; sie entfernt nur `contract` und
   `contractOffer` und setzt `version = N − 1`; die Dispatcher (`foldBackToV(N−2)` des anderen Pakets, `foldBackToV12`,
   `foldBackToV11`) rufen zuerst sie für `version ≥ N`. Schlüsselliste `V(N−1)_WORLD_KEYS` aus der Liste des anderen
   Pakets ableiten.
6. `docs/arc42.md` Abschnitt «Persistenz»: Versionsnummer und Kette.

Konflikte in `save.ts`, `helpers.ts`, `types.ts`, `world.ts` beim Merge: beide Seiten behalten, I-047-Schlüssel stehen
**hinter** denen des anderen Pakets (neue Schlüssel am Ende, R584 Tech 1). `createWorld`-Reihenfolge und Migration
müssen dieselbe Schlüsselfolge ergeben (AK-SK-22b prüft `serialize` gleich).

## Abnahme

- [ ] `grep -rn "toBe(14)\|version: 14\|V13ToV14\|foldBackToV13" src tests docs/arc42.md` zeigt nur die sechs Stellen
      (bzw. nach Umbenennung keine Reste).
- [ ] Alle Tests prüfen gegen `SAVE_VERSION`; nur Testtitel mit Zahl nachziehen.
- [ ] `make conflicts; echo EXIT=$?`, `make check; echo EXIT=$?` → beide `EXIT=0`.
- [ ] Commit `fix: Save-Version I-047 auf v<N> nach Merge von main` (nur bei Änderung).
- [ ] Bei Änderung: Delta-Review desselben opus-Reviewers per SendMessage (zählt nicht als Start).
