# T02 · `startTrial`, `abortTrial`, Zukauf-Sperre, `tickTrial`, Baseline

`tech-sim-engineer` · ≈ 55 Tools · AK 2 (Aktion), 3–11, 14 · blocked-by: T01 · Test zuerst (rot vor Umsetzung)

Dateien: `src/sim/trial.ts`, `src/sim/trade.ts`, `src/sim/tick.ts`, `tests/sim/trial.test.ts`, `tests/sim/trial-run.test.ts` (neu),
`tests/sim/balance.test.ts` und `tests/sim/balance-monument.test.ts` (je eine Zusicherung, keine Zahl ändert sich).

## Schnittstellen

- Consumes (T01): `TrialState`, `TRIALS`, `TRIAL_*`, `TRIAL_REASONS`, `trialStartBlock`, `trialBuyBlock`, `trialPopulation`; Testhelfer `merchantWorld(n)` in `trial.test.ts`.
- Produces (für T04): in `src/sim/trial.ts`
  `startTrial(world: World, id: unknown): Result` · `abortTrial(world: World): Result` · `tickTrial(world: World): void`.

## Schritte

- [ ] 1. **Tests zuerst** (Fälle unten) in `trial.test.ts` und `trial-run.test.ts`; Lauf `npx vitest run tests/sim/trial.test.ts tests/sim/trial-run.test.ts; echo EXIT=$?`
      → rot; FAIL-Zeile ins Ledger.
- [ ] 2. `startTrial`: `const why = trialStartBlock(world, id)`; bei Grund `fail(why)` ohne Weltänderung; sonst `active = id`, `ticks = 0`,
      `e0 = trialPopulation(world)`, `ok`. Wirft nie (auch nicht bei `undefined`/Zahl/Prototyp-Namen).
- [ ] 3. `abortTrial`: ohne Auflage `fail(TRIAL_REASONS.notActive)`; sonst `active = null`, `ticks = 0`, kein Eintrag, `ok`.
- [ ] 4. `tickTrial`: `active === null` → sofort zurück (Baseline). Sonst: `trialPopulation(world) * 100 < e0 * TRIAL_FAIL_POP_PCT` → nicht bestanden
      (`active = null`, `ticks = 0`, `passed` unverändert). Sonst `ticks += 1`; bei `ticks === TRIAL_DURATION_TICKS`: `passed.push({ id: active, tick: world.tick })`,
      `active = null`, `ticks = 0`. Ganzzahlvergleich, keine Division.
- [ ] 5. `tick.ts` `step`: `tickTrial(world)` direkt nach `tickPopulation(world)`; Doc-Kommentar von `step` um «Auflage» ergänzen.
- [ ] 6. `trade.ts`: in `buy` direkt nach `if (isl === null) return fail('Unbekannte Insel');` die Zeile `const trial = trialBuyBlock(world); if (trial !== null) return fail(trial);`
      (Plan P-6: vor «Kein Kontor»). `monumentBuyBlock` = `trialBuyBlock(world) ?? noKontorTrade(world, HOME) ?? goodLock(world, good)`; `buyMonumentUnit` bleibt.
      Keine weitere Stelle sperren (Verkauf, Aufträge, Stammkunde, Fernangebot, `buyShip`, Routen, Bauen bleiben frei).
- [ ] 7. Baseline (AK 14): `balance.test.ts` am Ende des bestehenden Laufs `expect(w.trial).toEqual({ active: null, ticks: 0, e0: 0, passed: [] })`;
      `balance-monument.test.ts` dieselbe Zusicherung nach der Schleife, die `monumentDone` erreicht. Wächter in `trial.test.ts`: Text von
      `tests/sim/controller.ts` und `tests/sim/merchantsController.ts` enthält weder `startTrial` noch `sim/trial`.
- [ ] 8. Prüfschritte grün, `make check; echo EXIT=$?` (Strangende S), Commit `feat: Meisterprüfung Eigenversorgung in der Simulation (I-132)`.

## Tests `trial.test.ts` (schnell, Basiswelt `merchantWorld(n)` aus T01, `crisisLevel` `'off'`)

- «AK-2 (Aktion)»: für jeden Grundfall aus T01 liefert `startTrial` `{ ok: false, reason }` mit demselben Text wie `trialStartBlock`, `serialize` vorher = nachher,
  `expect(() => startTrial(w, x)).not.toThrow()` für `undefined`, `42`, `'__proto__'`.
- «AK-3 Start 60 und 150»: `ok: true`, `trial` = `{ active: 'selfSupply', ticks: 0, e0: trialPopulation(w), passed: [] }`; `e0` zählt auch Häuser auf Insel 1
  (`twoIslandWorld()` mit Haus auf der Fremdinsel).
- «AK-4 Sperre»: `twoIslandWorld()` + Häuser + `monumentDone`, Auflage gestartet. `buy(w, 'spice', 1)` und `buy(w, 'spice', 1, 1)` →
  `{ ok: false, reason: 'Auflage Eigenversorgung: kein Zukauf' }`, `money` und beide Lager unverändert; `buyMonumentUnit(w, 'stone')` → 0, `money` gleich;
  `monumentBuyBlock(w, 'stone')` = derselbe Text. `sell` und `buyShip` liefern dasselbe Ergebnis und dieselbe Geld-/Lageränderung wie auf einer
  Kopie ohne Auflage (`structuredClone` vor dem Start). Review Focus 5: Insel ohne Kontor (`kontorId = null` auf Insel 1) → Grund der Auflage.
- «AK-5 Abbruch»: nach `abortTrial` → `ok`, `trial` = `{ active: null, ticks: 0, e0, passed: [] }`, `buy(w, 'spice', 1)` wieder `ok`; zweites `abortTrial` →
  `{ ok: false, reason: 'Keine Auflage aktiv' }`.
- «AK-6 Zählen»: gestartet, Schleife `w.tick += 1; tickTrial(w)` (Einwohner bleiben): nach 8999 Durchläufen `active === 'selfSupply'`, `ticks === 8999`;
  nach dem 9000. `active === null`, `ticks === 0`, `passed` = `[{ id: 'selfSupply', tick: <w.tick beim 9000.> }]`.
- «AK-7 Grenzfall 70 %»: `e0 = 100` gesetzt, Einwohner genau 70 → nach `tickTrial` aktiv, `ticks === 1`; Einwohner 69 → `active === null`, `passed` leer.
- «AK-8 Zähler = step-Aufrufe»: gestartet, 37 × `step(w)` → `ticks === 37`; Quell-Scan `src/sim/trial.ts` ohne `/Date|performance|setTimeout|Math\.random/`.
- «AK-9 Neustart»: nach Bestehen (AK-6-Schleife) `startTrial` → `'Bereits bestanden'`; nach «nicht bestanden» (AK-7) und nach Abbruch → `ok`, `ticks === 0`.
  (R759 Auflage 5) Nach Abbruch ist `startTrial` wieder `ok` (eigener Fall, nicht nur über AK-11).
- «Speichern mitten in der Auflage» (R759 Auflage 3): `merchantWorld(60)`, Auflage gestartet, N = 50 Schritte; Lauf A ununterbrochen weitere 200 Schritte;
  Lauf B: `serialize` → `deserialize` → 200 Schritte; `serialize` beider Läufe gleich, `trial` gleich.
- «Randfall Wachstum und Kasse»: aktive Auflage, Kaufleute auf 160 und Einwohner über `e0` gesetzt → `tickTrial` zählt weiter, kein Abbruch; ebenso
  bei `money = -500` (Spec §7: Kasse kein Abbruchkriterium). Schiffsladung braucht keinen Test (die Auflage liest weder Schiffe noch Lager).
- «AK-10 Denkmal abgerissen»: `monumentDone = true`, kein Denkmal-Gebäude in `buildings` (`monument = null`) → `startTrial` `ok`.
- «AK-11 Determinismus»: (a) zwei Läufe `merchantWorld(60)`, `crisisLevel = 'normal'`, Folge: 10 Schritte, `startTrial`, 100 Schritte, `abortTrial`
  (Zusicherung `ok: true` für alle drei Aktionen bleibt, R759 Auflage 5; die unversorgten Häuser fallen erst nach rund 300 Schritten unter 70 %), 100 Schritte, `startTrial`, 300 Schritte → `serialize` beider Läufe gleich. (b) dieselbe Welt einmal mit, einmal ohne Auflagen-Aktionen:
  JSON-Vergleich `const raw = JSON.parse(serialize(w)); delete raw.trial;` beider Läufe gleich (die Auflage verbraucht keinen Zufall und ändert ohne
  Kauf nichts ausser `trial`).
- «AK-14 Wächter» (Schritt 7).

## Tests `trial-run.test.ts` (Referenzstand K'-arm, Anhang §2.1/§2.2)

`beforeAll` wie `balance-monument.test.ts` Phase 1/2 (Seed 3, `startColony`, `runMerchants` bis `won`, `placeTownhall`, `runMerchants`, auf Vielfaches
von 200 steppen), `serialize` als `kSave`; Timeouts `beforeAll` und je Test zunächst grosszügig, dann aus dem gemessenen Laufzeitwert ableiten (Messwert mal Sicherheitsfaktor, Auflage 4; Messwert ins Ledger). Je Test `deserialize(kSave)`, `monumentDone = true`,
`crisisLevel = 'off'`, `startTrial(w, 'selfSupply')` → `ok` (Erwartung: 60 Kaufleute, Kasse ≥ 0; sonst Befund an den Controller, nicht anpassen).

- «AK-7 K'-arm ohne Zufuhr scheitert»: steppen, bis `active === null` (höchstens 1200 Schritte): danach `trialPopulation × 100 < e0 × 70`, im
  Schritt davor nicht; `passed` leer; Ende-Tick relativ zum Start ins Log (Anhang erwartet ≈ 375, kein Pin).
- «AK-7 zweiter Seed» (R759 Auflage 2, ein 18. Start ist dafür freigegeben): derselbe Aufbau auf mindestens einem zweiten Seed (Wahl des Umsetzers,
  Referenzaufbau muss dort `won` erreichen), mindestens «ohne Zufuhr scheitert»; Ende-Tick und Abstand zur Schwelle ins Log. Trägt der Aufbau auf
  dem zweiten Seed nicht, einmalige Messung ins Ledger statt Dauertest (Befund an den Controller).
- Mitloggen in beiden Läufen (Auflage 2): Minimum `trialPopulation` und `e0`, je Seed.
- «AK-6 K'-arm mit Sollzufuhr besteht»: vor jedem `step`, wenn `w.tick % 100 === 0`, Heimat-Lager `spice` und `stone` je `+6`, gedeckelt auf
  `STORAGE_CAP` (Sollfluss Anhang §2.2). Nach 8999 Schritten aktiv; nach 9000 `passed[0]` = `{ id: 'selfSupply', tick: start + 9000 }`.
  Scheitert der Lauf, ist das ein Befund an den Controller (kein Nachstellen der Zufuhr ohne Rückmeldung). Bewusste Abweichung, im Bericht nennen:
  die Zufuhr emuliert den Sollfluss eigener Ketten (Anhang §2.2), gebaut wird nichts; AK 6 prüft damit Zählen und Bestehen, nicht den Ausbaupfad.

## Prüfschritte

Allgemeine Prüfungen laut Plan-Index · `npx vitest run tests/sim/trial.test.ts tests/sim/trial-run.test.ts tests/sim/trade.test.ts tests/sim/monument.test.ts tests/sim/tick.test.ts tests/sim/balance.test.ts tests/sim/balance-monument.test.ts; echo EXIT=$?`
· Laufzeit von `trial-run.test.ts` (gesamt, `beforeAll`, je Test) messen und ins Ledger (Auflage 4) · am Ende `make check; echo EXIT=$?` und `make zeitreserve; echo EXIT=$?`.
