> **Task-ID:** T03 (Paket M11-P1c) — Teil 2 von 2
> **AK-IDs / blocked-by / Strang:** siehe [T03a-neupin.md](T03a-neupin.md)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-11-bitgleich-neupin.md](orga-11-bitgleich-neupin.md)
> **Teile:** [T03a-neupin.md](T03a-neupin.md) · **T03b-neupin.md** (diese: neue Tests, Pins, Doku, Commit)

## Schritt 1: Neue Tests

- [ ] **`tests/sim/balance-crises.test.ts`** (Importe `step` aus `tick`, `WIN_TICK_LIMIT` aus `./controller`):

```ts
// M11 R185/R187, gemessen auf <T02-SHA> mit `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance --silent=false`
const M11_REF = {
  firstSettler: 350,
  firstCitizen: 4150,
  winTick: 6750,
  minMoney: 117,
  endMoney: 339,
}; // M-01…M-04

describe('M11 Baseline (Spec 6, 14)', () => {
  it('AK-BAS-01 Referenz off: Sieg 6750, minMoney 117, endMoney 339, Siedler/Bürger 350/4150; zwei Läufe gleich', () => {
    const [a, b] = [createWorld(3), createWorld(3)];
    expect(buildColony(a)).toMatchObject(M11_REF);
    buildColony(b);
    expect(serialize(a)).toBe(serialize(b));
  });
  it('AK-BAS-02 Schwellen: Sieg ≤ 7500 und Geld > 0; normal + Feuerwache 7850 ≤ 8000; mild 7850', () => {
    const r = createWorld(3);
    expect(buildColony(r).winTick!).toBeLessThanOrEqual(WIN_TICK_LIMIT);
    expect(r.money).toBeGreaterThan(0);
    const n = createWorld(3, { crisisLevel: 'normal' });
    const tn = buildColony(n, NORMAL);
    expect([tn.winTick, tn.winTick! <= CRISIS_WIN_STOP, n.money > 0]).toEqual([7850, true, true]);
    const m = createWorld(3, { crisisLevel: 'mild' });
    expect([buildColony(m).winTick, m.money > 0]).toEqual([7850, true]);
  });
  it('AK-BAS-04 normalized() entfernt taxCarry, upkeepCarry und je Gebäude eff, level', () => {
    const w = createWorld(3);
    Object.assign(w, { taxCarry: 5, upkeepCarry: 7 });
    Object.assign(w.buildings[w.kontorId]!, { eff: 1000, level: 2 });
    const raw = JSON.parse(normalized(serialize(w))) as Record<string, unknown>;
    expect('taxCarry' in raw || 'upkeepCarry' in raw).toBe(false);
    for (const b of Object.values(raw.buildings as Record<string, Record<string, unknown>>))
      expect('eff' in b || 'level' in b).toBe(false);
  });
  it('AK-BAS-07 Gebäudezahlen (M-05) und Fingerabdruck (M-06) neu gemessen und gepinnt', () => {
    const w = createWorld(3);
    expect(buildColony(w).buildings).toEqual(OFF_REFERENCE.buildings);
    expect(fnv1a32(normalized(serialize(w)))).toBe(OFF_FINGERPRINT);
  });
  it('AK-SAV-03 Zwilling mit taxCarry 12 345, upkeepCarry 67: Laden, 300 Schritte, serialize gleich', () => {
    const w = createWorld(3, { crisisLevel: 'normal' });
    const { layout, t } = startColony(w);
    expect(runColony(w, layout, t, NORMAL, (x) => x.tick >= 2601)).toBe(true);
    Object.assign(w, { taxCarry: 12345, upkeepCarry: 67 });
    const r = deserialize(serialize(w));
    if (!r.ok) throw new Error(r.reason);
    for (let i = 0; i < 300; i++) {
      step(w);
      step(r.world);
    }
    expect(serialize(r.world)).toBe(serialize(w));
  });
});
```

- [ ] **`tests/sim/balance-merchants.test.ts`** (Import `MERCHANT_TICK_LIMIT` ist da):

```ts
describe('M11 Baseline Kaufleute (Spec 14)', () => {
  it('AK-BAS-02 Kaufleute: Sieg 6750, Ziel 2 11 200 ≤ 12 000, minMoneyAfterWin 320, Geld > 0', () => {
    const { w, t } = run();
    expect([t.winTick, t.wonMerchantsTick, t.minMoneyAfterWin]).toEqual([6750, 11200, 320]); // M-01, M-08, M-10
    expect(t.wonMerchantsTick!).toBeLessThanOrEqual(MERCHANT_TICK_LIMIT);
    expect(w.money).toBeGreaterThan(0);
  });
});
```

- [ ] **`tests/sim/unlock-timeline.test.ts`:**

```ts
describe('M11 Freischalt-Ticks (M-11)', () => {
  it('AK-BAS-03 off 150/350/550/4150/6750; normal …/5150/7850; mild …/4250/7850', () => {
    const early = { U2: 150, U3: 350, U4: 550 };
    expect(timeline('off', false).unlock).toMatchObject({ ...early, U5: 4150, U6: 6750 });
    expect(timeline('normal', true).unlock).toMatchObject({ ...early, U5: 5150, U6: 7850 });
    expect(timeline('mild', false).unlock).toMatchObject({ ...early, U5: 4250, U6: 7850 });
  });
});
```

## Schritt 2: Rot-Beleg

| AK / Test           | Beleg                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AK-BAS-04           | natürlich rot vor Schritt 3: `expected true to be false` (`taxCarry` im normalisierten Stand)                                                          |
| AK-BAS-07           | natürlich rot vor Schritt 3: Fingerabdruck `0x…` ≠ `0xbfeac8c6` (alter Pin)                                                                            |
| AK-BAS-01, -02, -03 | Mutationsprobe: `UPGRADE_DEFICIT_WAIT_FACTOR = 1` (`defs/timing.ts`) → Ref 7250, mild 7750, Kaufleute 7250/11 300/250, U5 4050: alle rot; zurücknehmen |
| AK-SAV-03           | Mutationsprobe: in `save.ts` `deserialize` vor `return` `world.taxCarry = 0;` → `serialize` ungleich; zurücknehmen                                     |

Beide Mutationen nie committen; `git diff -- src` ist danach leer (Ledger: Befehl, rote Meldung, Rücknahme).

## Schritt 3: Pins (P-D) und Umschreibungen

- [ ] `normalized()` (`balance-crises.test.ts:29-45`): zusätzlich `delete raw.taxCarry; delete raw.upkeepCarry;` und je
      Gebäude `delete b.eff; delete b.level;`; Doc-Kommentar „M11 (Anhang 02 B)".
- [ ] `OFF_REFERENCE` (`:47-67`): `firstCitizen 4150`, `winTick 6750`, `minMoney 117`, `endMoney 339`; `buildings` aus
      der Messung (Prototyp: unverändert). `OFF_FINGERPRINT` = gemessener Wert (Richtwert `0x701c6da5`). Kommentar:
      „M11 R185/R187, gemessen auf <T02-SHA> mit `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-crises.test.ts
--silent=false`; vorher 3850/6050/57/212, `0xbfeac8c6`; Richtwert Anhang 03: `0x701c6da5`".
- [ ] M6:AK-B1-02 (`:101`): Name „… normalisierten Endwelt (M11 S10)". M8:AK-S1-15 (`:161`): 6750/117, Name „Sieg 6750,
      minMoney 117 … (M11 S10)".
- [ ] `balance-merchants.test.ts:15` `WIN_TICK = 6750` (Kommentar wie oben); `:32` Name „Sieg 6750 … (M11 S10)".
- [ ] `unlock-timeline.test.ts:34-35`: `off` U5 4150, U6 6750, Schule 4000; `normal` 5150, 7850, 5000 (Schul-Bautick:
      Neupin mit Beleg, Kommentar mit Befehl); Name „… (M11 S10)".
- [ ] Alle Tests der Rotliste nach P-A, P-B, P-C, P-E (T03a) umschreiben.

## Schritt 4: Grün

```bash
npx vitest run && npx tsc --noEmit && make check
npx vitest run --reporter=verbose 2>&1 | grep -oE "M11[^>]*> (AK-[A-Z0-9]+-[0-9]+|RF-[0-9])" | sed -E 's/.*> //' | sort -u
```

Abdeckungs-Grep zeigt mindestens AK-P1-01 … -13, AK-SAV-01 … -05, AK-BAS-01 … -04, -07, RF-1 … -3. Testzählbefehl
(index.md) gegen `<BASIS>`: jede Datei `nachher ≥ vorher`. Rotliste aus T03a Schritt 0 Zeile für Zeile abhaken.

## Schritt 5: Doku

- [ ] `README.md` „Unterhalt und Geld": erster Punkt → „Unterhalt und Steuern werden laufend verbucht (die Kasse zählt
      stetig); die Angaben «/ min» sind Raten. Die Kopfzeile zeigt die Bilanz …" (Rest bleibt). „Aufstieg": neuer Punkt
      nach der Wartezeit: „Würde eine Ware der nächsten Stufe durch den Aufstieg ins Minus rutschen (Erzeugung minus
      Verbrauch, Lagerbestand zählt nicht), dauert die Wartezeit doppelt so lange (60 statt 30 Sekunden, «niedrig» 30
      statt 15)." Kein „Tick" im Text.

## Schritt 6: Commit und Push

```bash
git add tests README.md
git commit -m "test: M11-T03 Neupin Baseline (R185/R187, Spec 14) und Umschreibung roter Tests (M11 S10)"
git -C .worktrees/m11-sim push -u origin feat/m11-sim
```

Bericht an den Controller: Rotliste vorher (Zahl, Datei), Messlog, gepinnte Werte, M-05/M-06 mit Commit, Liste der
umgeschriebenen Tests mit Muster (für AK-BAS-06 und orga-12).

## Geänderte bestehende Tests

Alle Zeilen der Rotliste (T03a, 34 Kandidaten) und `normalized()`/`OFF_REFERENCE`/`OFF_FINGERPRINT`/`WIN_TICK`/
Timeline-Fälle; Namen mit „(M11 S10)". M6:AK-B2-06 bleibt unverändert und muss grün sein (AK-SAV-03).

## Risiken/Randfälle

- R74: Abweichung eines Haupt-Pins → Stopp; die Mutationsproben dürfen nicht im Commit landen (`git diff -- src`).
- P-C kann Tests auf Ticks nach 600 schieben (Aufträge ab 600, Krisen ab 2400): lieber `satisfiedSince` früher setzen.
- Die Schul-Bauticks (4000/5000) stehen nicht in Spec 14; Neupin mit Beleg, im Bericht nennen.
