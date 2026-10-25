# T07 · Messlauf Proben 4 und 5: Gewürz- und Denkmal-Phase ab Spielstart

Umsetzer `tech-sim-engineer` · ≈ 70 Tools (Zeitkasten) · AK-IP-24 (Probe 4, 5) · blocked-by: T06 · Worktree `.worktrees/inselproben-mess`
(`feat/inselproben-mess`) · Spec §5.2; Anhang 02 D · **Mess-Task (P-2), Risiko-Task (Index «Risiken», E-IP-1)**

## Ausgangslage

Kein bestehender Controller erreicht `wonSpice` oder `monumentDone` ab Spielstart: `goal3.test.ts` baut den Gewürz-Stand per Literal
(`spiceGoalScenario`, `scenariosSea.ts`), `balance-monument.test.ts` startet aus einem gesetzten Stand (`monumentWorld`, `K_ARM`). T07 baut zwei Phasen auf
`runMerchants` auf. P-5 gilt streng: nur Sim-Aktionen (`placeBuilding`, `placeRoad`, Schiff kaufen, Route setzen, Zukauf-Schalter, `startMonumentStage`,
Steuer/Edikt) und `startColony`/`prepareLayout`; keine Literale wie `foundKontor2Literal` oder `shipLiteral`, kein Setzen von Kasse, Lager, Einwohnern, Flaggen.

## Dateien

- ändern: `tests/sim/challengeControllers.ts`, `tests/sim/challenge-solvable.test.ts`; `src/sim/defs/challenges.ts` nur Fallback Karten-Nummer
- Nachzug bei Seed-Wechsel oder Probe-Entfernung (H3 b, Besitzer dieser Task): `tests/sim/challenge.test.ts` **nur** die Erwartungen AK-IP-12 a (Seeds,
  Zeilenzahl) und AK-IP-03 (`Set.size`); `it.each(PROBES)` (T02) und die UI-Tests (T09, aus `PROBES` abgeleitet) brauchen keinen Nachzug. Lauf danach
  `npx vitest run tests/sim/challenge.test.ts tests/ui/challenge.test.ts; echo EXIT=$?` → 0 (UI-Datei nur, wenn T09 schon integriert ist).
- nicht ändern: `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, `tests/sim/scenariosSea.ts`, `src/`

## Interfaces

- Consumes (T06): `ProbeRun`, `runProbe`, `nextPlayableSeed`, `probeLimit`; `runMerchants`; Sim-Aktionen aus `build.ts`, `ships.ts`, `trade.ts`, `monument.ts`.
- Produces (`tests/sim/challengeControllers.ts`): `runProbe('p4')` und `runProbe('p5')` (gleiche Signatur), intern `spicePhase(w, layout): void` und
  `monumentPhase(w, layout): void` je Takt nach `wonMerchants`; Obergrenze `PROBE_MAX_TICKS = 40_000` (Testkonstante, kein Spielwert).

## Verhalten

- **Probe 4 (`spice`, Seed 345, mild):** bis `wonMerchants` wie T06 (`runMerchants`); danach je Takt `spicePhase`: Fernkontor auf einer Fremdinsel mit
  Gewürzboden, Gewürzplantage dort, ein Schiff mit Route Gewürz → Heimat, weitere Kaufmannshäuser bis 80 voll versorgte Kaufleute; Halt 600 Ticks
  (`WIN_SPICE_HOLD`). Ende bei `result` oder `PROBE_MAX_TICKS`.
- **Probe 5 (`monument`, Seed 777, normal):** bis `wonMerchants`; danach `monumentPhase`: Denkmal und Weg platzieren (Bauplatz aus der Kontor-Lage wie
  `MONUMENT_AT` relativ), Abschnitte 1–3 per `startMonumentStage`, Zukauf-Schalter für fehlende Güter, Feuerwache wie T06. Ende bei `result` oder `PROBE_MAX_TICKS`.
- **Fallback:** wie T06 (Karten-Nummer, höchstens 10 Versuche; Krisenstufe nur per Ruling).
- **Zeitkasten:** Ist nach ≈ 60 Tools ein Ziel nicht erreicht, stoppt der Umsetzer und meldet `blocked` mit dem besten Stand (Tick `wonMerchants`, Kaufleute,
  `spiceLoop`, Denkmal-Abschnitt, Kasse) an den Controller; der Controller meldet E-IP-1 an L0 (Empfehlung Spec Anhang 02 D: Probe vorerst aus der Liste).

## Steps

- [ ] **Erkundung** (Worktree, nicht committet): Phase je Probe mit Log bis `PROBE_MAX_TICKS`.
- [ ] **Tests rot** in `tests/sim/challenge-solvable.test.ts`, `describe('AK-IP-24 Proben 4–5')`, je Probe ein `it` mit Timeout 30 000 ms:
      `runProbe(id).outcome === 'passed'`; `tick ≤ PROBE_LIMIT[id]` (`probeLimit(Messwert)`, Konstanten mit «Messwert, Änderung nur per Ruling (P-2)»).
- [ ] **Lauf rot:** `npx vitest run tests/sim/challenge-solvable.test.ts -t "Proben 4"; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten.
- [ ] **Lauf grün:** `npx vitest run tests/sim/challenge-solvable.test.ts; echo EXIT=$?` → 0; Laufzeit je `it` im Bericht (Messfenster, Index).
- [ ] **Teilbeleg** (Index); `rg -n "Literal\(|\.money\s*=|stock\.[a-z]+\s*=|won[A-Za-z]*\s*=|monumentDone\s*=" tests/sim/challengeControllers.ts` leer.
- [ ] **Commit:** `test: Lösbarkeit Proben 4 und 5 ab Spielstart (Inselproben T07)`.

**Schlägt eine Probe fehl** (nach Fallback): Commit nur mit der grünen Probe; für die rote ein `it.todo('AK-IP-24 Probe n: offen, E-IP-1')`, kein
`it.skip` mit Assert. Die Probe bleibt bis zum Ruling in `PROBES`; nach dem Ruling «aus der Liste» entfernt ein Fix-Schritt dieses Tasks die Def-Zeile
(Nachzug nach H3 b oben; AK-IP-12 a nennt dann vier Zeilen). Merge-Gate erst, wenn kein `it.todo` mehr offen ist.

## Meldung an L0 (Controller)

Entwurf: «AK-IP-24 Probe 4 {Seed} {Tick|offen}, Probe 5 {Seed} {Tick|offen}; Grenzen {G}. Empfehlung: Tickgrenzen und Karten-Nummern 2–5 als Ruling; für
offene Proben E-IP-1 (vorerst aus der Liste).»

## Task-Review

Prüfen: P-5 streng (Grep oben, Diff lesen); Läufe starten über `startChallenge`; Laufzeit je `it` ≤ 30 s; keine Änderung an bestehenden Controllern;
`it.todo` nur mit Meldung an L0.
