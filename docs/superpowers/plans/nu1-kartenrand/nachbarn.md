# NU-1 · Nachbarn und Save-Kette

Zurück zum [Index](index.md). Stand Plan: main `07cd8183` (`SAVE_VERSION` 19). Nach R987/R991 (Gate Plan, Auflage 2).

## Faltregel E-ZE-1 (R987)

Jüngster Schritt innen, wer später merged, zieht nach. NU-1 liefert `dropExpedition` / `foldBackKartenrand` und trägt es in **alle drei** Kettenköpfe `foldBackToV13/V12/V11` (`tests/sim/helpers.ts`) am Zeilenort von `dropTithe`/`dropPetitions` ein. `SAVE_VERSION` bleibt Zahlenliteral (`tools/render-qa/saveVersion.mjs`); `SAVE_V_KARTENRAND` nur Alias.

## Überschneidungen (per Pfad, in T00 prüfen, in T09 nachziehen)

| Paket (Branch)                                 | Pfade                                                                    | Art                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| I-223 Zehnt (`plan/i223-zehnt`, `feat/i223`)   | `helpers.ts` (`dropTithe`), `save.ts`, `tick.ts`, `types.ts`, `world.ts` | eigene Save-Stufe; Nummer per Merge, Faltschritt Zehnt innen        |
| Stadtplanung (`feat/stadtplanung`)             | `helpers.ts`, `save.ts`, `population.ts`, `tiers.ts`                     | eigene v19 mit `migrateV18ToV19`, `foldBackStadt` als Aussenschritt |
| Inselproben (`feat/inselproben`)               | `helpers.ts` (`dropChallenge`), `save.ts`, `tick.ts`                     | `foldBackChallenge`; Feldreihenfolge = Merge-Reihenfolge            |
| HAFEN, I-210, I-215, FLAECHE, GEBAEUDE-VARIANZ | siehe T09-Konflikttabelle                                                | wie bisher                                                          |

## Prüfung in T00 und T09

- `git merge-base --is-ancestor <branch> main; echo EXIT=$?` je Zeile; Ergebnis ins Ledger.
- Plan-Basis «Save 19» je Branch abgleichen (`git show <branch>:src/sim/save.ts | rg -n "SAVE_VERSION ="`); weicht sie ab, T09-Reihenfolge neu festlegen, kein Raten.
- Nach jedem fremden Save-Schritt: Literal +1, Alias unverändert, Faltketten neu ordnen, `renderqa.test.ts` und `save*.test.ts` grün.
