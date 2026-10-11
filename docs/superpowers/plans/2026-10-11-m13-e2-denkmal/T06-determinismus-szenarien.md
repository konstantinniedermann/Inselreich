# T06 · Determinismus, Speichern/Laden mitten im Abschnitt, Szenario-Stände (TDD)

Strang sim · Worktree `.worktrees/m13-e2-sim` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M13E2-16, -49 (Spec
§10.1; Anhang 08 B.2, D) · blocked-by T05 · Grösse M (≈ 30 Tools) · qa B1, qa B5, R493

**Files:**

- Modify: `tests/sim/monument.test.ts`, `tests/sim/monumentHelpers.ts`, `tests/sim/scenarios.ts` (`RAW_SCENARIOS`,
  Zusatzdatei v13), `tests/sim/scenario-saves.test.ts`
- Lesen: Anhang 08 B.2 und D vollständig; `fireTarget` in `src/sim/crises.ts`; `RAW_SCENARIOS`, `writeScenarios`,
  `m13Ziel1` in `tests/sim/scenarios.ts` (Muster); `placeTownhall`, `village` in `tests/sim/helpers.ts`.

## Teil A · Determinismus (AK-16, AK-49)

Welt nach Anhang 08 B.2 als Helfer `monumentRunWorld()` in `monumentHelpers.ts`: Testwelt §10 mit **Krisen
Standard** (RNG-Pfad aktiv), Lager Stein 40, Werkzeug/Glas/Gewürz 20, `buy` an für Werkzeug, Glas, Gewürz, aus für
Stein, `money = 100 000`, `startMonumentStage` bei Tick 1000.

- **AK-16:** (a) `fireTarget` wählt nie das Denkmal: Welt mit Denkmal und brennbaren Nachbarn, alle Kandidaten über
  viele Ziehungen (oder direkt die Kandidatenliste, falls `fireTarget` sie offenlegt) enthalten die Denkmal-Id nie;
  (b) zwei Kopien `deserialize(serialize(w))` über 1000 Schritte → `serialize` gleich; (c) `tickMonument` allein
  ändert den RNG-Zustand nie (Zustand vor/nach einem Aufruf an einem Zug-Tick vergleichen).
- **AK-49:** Zwilling Z läuft ununterbrochen bis Tick 1500; Kopie K läuft bis s, dann `K′ =
deserialize(serialize(K))`, weiter bis 1500; `serialize(K′) === serialize(Z)` für s = **1007**, **1010**, **1013**,
  **1025 pausiert** (in Z und K bei Tick 1015 `setMonumentPaused(true)`, bei 1035 `false`, jeweils zwischen den
  Schritten). In jedem Fall bis 1500: `delivered.stone ≥ 1` (Lager) und `delivered.glass ≥ 1` (Zukauf); nach s laufen
  noch ≥ 40 Zug-Ticks (Assert).

## Teil B · Szenario-Stände (Anhang 08 D, für T15/T16)

Gemeinsame Basis `m13e2Base()` (in `scenarios.ts`, nicht exportiert ausser für den Test): `createWorld(3, {
unlockAll: true, crisisLevel: 'off' })`, `won = true`, `wonMerchants = true`, Amtsstube über `placeTownhall`, vier
Kaufleute-Häuser am Kontor (Muster B.1), Platz `MONUMENT_AT` frei mit Weg, `money = 30 000`, Lager der vier
Denkmal-Güter je 20, Holz 100.

| Name                    | Abweichung (Anhang 08 D, wörtlich umsetzen)                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `m13e2-vor-ziel2`       | `wonMerchants = false`                                                                              |
| `m13e2-ziel2`           | keine                                                                                               |
| `m13e2-bauplatz`        | Denkmal gebaut, `stage 0`, nicht laufend, angebunden; Stein auf Reserve (20)                        |
| `m13e2-abschnitt1`      | wie Bauplatz, Abschnitt 1 läuft, `delivered` je Gut ein Viertel des Solls                           |
| `m13e2-abschnitt1-rest` | Abschnitt 1 läuft, Rest 5 je Gut, alle `buy` an, `wonSpice = true`                                  |
| `m13e2-abschnitt3-rest` | `stage 2`, Abschnitt 3 läuft, Rest 1 je Gut, alle `buy` an, `wonSpice = true`, `monumentDone false` |
| `m13e2-bild-0` … `-4`   | Bildstufe 0 … 4 (Bild 1: Abschnitt 1 läuft; sonst nicht laufend), Amtsstube daneben                 |
| `m13e2-v13`             | `serialize(m13e2-ziel2)` mit `version: 13`; **nicht** in `RAW_SCENARIOS`                            |

- Zustände nur über Sim-Aktionen und erlaubte Testsetzungen (`delivered`, `stage`, `monumentDone` von Hand ist
  zulässig, solange V1–V9 gelten; `stage 3` heisst `monumentDone true`). `m13e2-bild-4`: `stage 3`, `monumentDone
true`.
- `m13e2-v13`: eigene Ausgabe in `writeScenarios` (eine Zusatzdatei `m13e2-v13.json` in `SCENARIO_OUT`), keine
  Aufnahme in `SCENARIOS`; ein Test prüft, dass `deserialize` sie mit `'Unbekannte Version'` abweist.
- `scenario-saves.test.ts`: jeder neue Stand lädt über `deserialize` (ok) und prüft die Felder der Tabelle
  (`wonMerchants`, `monument`-Zustand, Reste, `buy`, `wonSpice`, `monumentDone`).

## Schritte

- [ ] **Schritt 0:** `grep -n "RAW_SCENARIOS\|SCENARIO_OUT\|function writeScenarios\|m13Ziel1" tests/sim/scenarios.ts`;
      `grep -n "export function fireTarget" -A25 src/sim/crises.ts`.
- [ ] **Schritt 1: Test zuerst (rot):** AK-16, AK-49 in `monument.test.ts`; Szenario-Prüfungen in
      `scenario-saves.test.ts` (rot, weil die Namen fehlen).

```bash
npx vitest run tests/sim/monument.test.ts tests/sim/scenario-saves.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen** (Helfer, Szenarien). AK-16/49 dürfen ohne Codeänderung in `src/` grün werden; zeigt
      einer einen Unterschied, ist das ein Befund in `monument.ts` (Ursache im Bericht, Fix in dieser Task).

```bash
npx vitest run tests/sim/monument.test.ts tests/sim/scenario-saves.test.ts tests/sim/save-v12.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Szenarien schreiben** wie die übrigen Browser-Szenarien (Befehl aus dem Kopf von
      `scenarios.ts`, `SCENARIO_OUT` in den Scratch-Ordner des Controllers); Liste der Dateien im Bericht.
- [ ] **Schritt 4: Commit.** `test: Denkmal deterministisch über Speichern/Laden, Szenario-Stände m13e2 (M13-E2 T06)`.

## Bericht

Testnamen, Rot-Zeile, Exit-Codes, Liste der Szenario-Dateien mit Grösse, Laufzeit `monument.test.ts` (Ziel < 5 s).
