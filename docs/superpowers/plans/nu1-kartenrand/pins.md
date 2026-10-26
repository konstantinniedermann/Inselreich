# NU-1 · Pin-Liste AK-NU1-25b (Gate-Auflage 2, R978/R979)

Stand main `07cd8183`. Regel: Nur hier gelistete Erwartungen dürfen sich ändern, und nur in der Art der Spalte «Änderung»;
jede Änderung trägt den Kommentar `// NU-1 25b (E-NU-4)`. Alles andere, das rot wird, ist ein Befund an den Controller, nie
still angepasst. T00 führt die Suchbefehle erneut aus und meldet Abweichungen; T06 und T09 gleichen nach `git merge main` ab.

## Nicht berührt (AK-25a, bitgleich)

`tests/sim/balance*.test.ts` (inkl. `balance-crises.test.ts` Fingerabdruck über `foldBackToV6…V9`), `tests/sim/seaGolden.test.ts`,
Auftrags-, Krisen- und Inselpins Seeds 1–3 (`orders*.test.ts`, `crises*.test.ts`, `islands*.test.ts`), `tests/sim/controller.ts`.
Bedingung dafür: `dropExpedition` in den drei Faltketten von `helpers.ts` (T02) und P-2 (`unlockAll` ohne `U7`).

## Suchbefehle (T00, T06, T09)

```bash
rg -n "'U6'\]|UNLOCK_IDS\)|toHaveLength\(7\)" tests                       # Freischalt-Literale
rg -n 'wonSpice\s*=\s*true|wonSpice: true' tests                         # Welten mit Ziel 3
rg -n 'parseSaveVersion' tests tools                                      # Literal-Regex (SAVE_VERSION bleibt Zahl)
rg -n 'foldBackSeerecht\(' tests                                         # äusserster Faltschritt
rg -n 'SAVE_VERSION\)\.toBe\(|PRE_SEERECHT_VERSION' tests                 # Versionspins
rg -n 'BUILDING_IDS\)\.toHaveLength|Object\.keys\(BUILDING_DEFS\)\.at' tests  # Gebäudeliste
rg -n 'Object\.keys\(JSON\.parse\(serialize' tests                       # Weltschlüssel
rg -n 'contract: null \}' tests src/ui                                   # StepReport-Literale (P-9)
```

## Liste (Stand Plan)

| Datei:Zeile                                                                                                                                                                                                | Pin heute                                    | Änderung                                                                        | Task |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- | ---- |
| `tests/sim/unlocks.test.ts:39`                                                                                                                                                                             | `UNLOCKS` ids = U0…U6                        | `[…, 'U6', 'U7']`                                                               | T01  |
| `tests/sim/unlocks.test.ts:141`                                                                                                                                                                            | `a.unlocked` = U0…U6 (Lauf nach U6)          | bleibt U0…U6 (ohne `wonSpice`); nur prüfen                                      | T01  |
| `tests/sim/unlocks.test.ts:433`                                                                                                                                                                            | «nach U6 ist `unlocked` gleich `UNLOCK_IDS`» | gleich `UNLOCK_IDS` ohne `U7` (Name des Tests anpassen)                         | T01  |
| `tests/sim/save.test.ts:971`                                                                                                                                                                               | `r.unlocked` Länge 7                         | prüfen: Welt mit `unlockAll` → bleibt 7 (P-2)                                   | T01  |
| `tests/sim/defs.test.ts:53`                                                                                                                                                                                | `BUILDING_IDS` Länge 22                      | 23, Kommentar «NU-1: maphouse»                                                  | T01  |
| `tests/sim/defs.test.ts:486`                                                                                                                                                                               | letzter Eintrag `monument`                   | bleibt: `maphouse` vor `monument` einfügen                                      | T01  |
| Render-/Audio-Tests über alle Gebäude (`tests/render/sprites*.test.ts`, `spriteCache.test.ts`, `variants.test.ts`, `tests/audio/buildSounds.test.ts`, `tests/ui/tooltip.test.ts`, `tests/ui/time.test.ts`) | je Gebäude Sprite/Klang/Tooltip              | Platzhalter nach T01 Schritt 5; keine Erwartung ändern                          | T01  |
| `tests/sim/scenarios.ts:876,882` (m13e2 mit `wonSpice`)                                                                                                                                                    | `unlocked` ohne `U7`                         | Szenario hängt `'U7'` an `w.unlocked` an (nur dort, wo `wonSpice` gesetzt wird) | T02  |
| `tests/sim/scenario-saves.test.ts:567`                                                                                                                                                                     | `unlocked = deriveUnlocks`                   | unverändert; muss nach T02 mit `U7` für m13e2 grün sein                         | T02  |
| `tests/sim/council-save.test.ts:193`                                                                                                                                                                       | `SAVE_VERSION === PRE_SEERECHT_VERSION + 1`  | `toBeGreaterThan(PRE_SEERECHT_VERSION)`                                         | T02  |
| `tests/sim/farOrder-save.test.ts:58`                                                                                                                                                                       | `foldBackSeerecht(json)` aussen              | `foldBackSeerecht(foldBackKartenrand(json))`                                    | T02  |
| `tests/sim/save-loyalty.test.ts:57,69,138`                                                                                                                                                                 | dito                                         | dito                                                                            | T02  |
| `tests/sim/helpers.test.ts:46`                                                                                                                                                                             | dito                                         | dito                                                                            | T02  |
| `tests/sim/buyPct.test.ts:50`                                                                                                                                                                              | Schlüssel von `serialize`                    | um `expedition`, `seaRevealed`, `finds` am Ende ergänzen, falls gepinnt         | T02  |
| `tests/sim/queries.test.ts:498,517`, `tests/sim/honors.test.ts:65,163`, `tests/ui/guide.test.ts`, `hud.test.ts`, `goal.test.ts`, `honorTracker.test.ts`, `monumentView.test.ts` (`wonSpice = true`)        | Welt ohne Rundreise                          | nur prüfen; keine Änderung erwartet (kein `deserialize`)                        | T02  |
| `tests/sim/scenario-saves.test.ts` (Szenario-Listen, `out/`-Dateiliste)                                                                                                                                    | Liste der Szenarien                          | um `nu1-kartenrand` ergänzen                                                    | T06  |
| StepReport-Literale (`rg` oben)                                                                                                                                                                            | `{ lost, contract }`                         | `expedition: []` ergänzen                                                       | T05  |

**Neue Pins (keine 25b-Änderung, sondern AK):** Kartenfolgen Seeds 1–3 je Gebiet (AK-17), gegen eine im Test nachgerechnete
Ziehung aus `createRng` geprüft; Erstwerte im Ledger.

## Ruling-Notiz (Entwurf E-NU-4 an L0)

«NU-1: Pins der Liste `docs/superpowers/plans/nu1-kartenrand/pins.md` werden mechanisch neu gepinnt (wachsendes `UNLOCK_IDS`,
neue Weltfelder, Versionsschritt, neues Gebäude); Balancing- und Seeds-1–3-Pins bleiben bitgleich (AK-25a). Schwester von R909
und AK-HF-22.»
