# T02 · Rückfaltung `foldBackFarOrders`

Plan: [Index](../2026-10-14-handel-2.md) · R633 T1 und A4, Grundlage für AK-H2-24 (Golden-Hashes) · Modell sonnet · ≈ 30 Tools

**Files:**

- Modify: `tests/sim/helpers.ts` (neue Funktion, Einbindung in `foldBackToV13`, `foldBackToV12`, `foldBackToV11`)
- Modify: `tests/sim/helpers.test.ts` (eigener Test, A4)

**Interfaces:**

- Consumes: nichts aus T01.
- Produces: `export function foldBackFarOrders(x: Record<string, unknown>): Record<string, unknown>` — schlüsselbasiert,
  ohne Versionszahl im Namen (Plan-Entscheid P-C). T03 verlässt sich darauf, dass alle bestehenden Faltketten
  (`foldBackToV13` … `foldBackToV6`) einen Stand mit `farOffer: null`, `farSkip: null` annehmen.

**Warum:** Heute filtert `foldBackToV11` (und damit `foldBackToV10`/`V9`) unbekannte Weltschlüssel **still** weg; ein Stand mit
offenem Fernangebot liefe ungeprüft durch. `foldBackToV13`/`V12` werfen dagegen bei unbekanntem Schlüssel. Der neue Schritt
entfernt die Felder nur, wenn sie leer sind, und steht vor allen Ketten.

## Schritte

- [ ] **Step 1: Failing test** — in `tests/sim/helpers.test.ts` einen `describe('foldBackFarOrders (Handel 2, A4)')` ergänzen:

```ts
const plain = (): Record<string, unknown> =>
  JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
/** Stand «eine Version neuer» mit leeren Fernfeldern am Ende (Form nach T03). */
const withFar = (extra: Record<string, unknown> = {}): Record<string, unknown> => {
  const x = plain();
  return { ...x, farOffer: null, farSkip: null, ...extra, version: (x.version as number) + 1 };
};

it('ohne Fernschlüssel unverändert', () => {
  const x = plain();
  expect(foldBackFarOrders(x)).toBe(x);
});
it('leere Fernfelder: Schlüssel weg, version − 1, Reihenfolge wie vorher', () => {
  expect(JSON.stringify(foldBackFarOrders(withFar()))).toBe(JSON.stringify(plain()));
});
it.each([
  ['farOffer', { farOffer: { island: 2, good: 'rum', amount: 15, reward: 450 } }],
  ['farSkip', { farSkip: 3 }],
])('nicht leeres %s → Fehler', (_k, extra) => {
  expect(() => foldBackFarOrders(withFar(extra))).toThrow(
    'foldBackFarOrders: Fernzustand nicht rückfaltbar',
  );
});
it('Fernauftrag (order.island) → Fehler', () => {
  const order = { period: 0, good: 'rum', amount: 15, reward: 450, due: 2300, island: 2 };
  expect(() => foldBackFarOrders(withFar({ order }))).toThrow(
    'foldBackFarOrders: Fernauftrag nicht rückfaltbar',
  );
});
it('nur einer der beiden Schlüssel → Fehler', () => {
  const x = withFar();
  delete x.farSkip;
  expect(() => foldBackFarOrders(x)).toThrow('foldBackFarOrders: Fernzustand nicht rückfaltbar');
});
it('Ketten: leere Fernfelder falten wie der Stand ohne sie', () => {
  for (const fold of [foldBackToV13, foldBackToV12, foldBackToV11, foldBackToV10, foldBackToV9])
    expect(JSON.stringify(fold(withFar()))).toBe(JSON.stringify(fold(plain())));
});
it('Ketten: offenes Fernangebot wird nicht still weggefiltert', () => {
  const x = withFar({ farOffer: { island: 2, good: 'rum', amount: 15, reward: 450 } });
  for (const fold of [foldBackToV13, foldBackToV12, foldBackToV11, foldBackToV10, foldBackToV9])
    expect(() => fold(x)).toThrow('foldBackFarOrders');
});
```

Imports nach dem Muster der Datei (`createWorld`, `serialize`, die `foldBackTo*`). Hinweis: `foldBackToV12` verlangt 4 Inseln mit
unberührter Insel C; `createWorld(3)` erfüllt das (bestehende Tests nutzen es genauso — sonst Kette im Test weglassen und im
Bericht begründen).

- [ ] **Step 2: Rot-Beleg** — `npx vitest run tests/sim/helpers.test.ts; echo EXIT=$?` → `EXIT=1`.

- [ ] **Step 3: Umsetzen** — in `tests/sim/helpers.ts` direkt vor `foldBackToV13`:

```ts
const FAR_STATE_ERROR = 'foldBackFarOrders: Fernzustand nicht rückfaltbar';

/**
 * Handel 2: entfernt `farOffer` und `farSkip` (nur wenn beide `null`) ohne Umordnen, `version − 1`. Schlüsselbasiert:
 * ohne beide Schlüssel unverändert zurück. Offenes Angebot, gesperrte Periode oder Fernauftrag (`order.island`) → Fehler.
 * Steht vor allen Faltketten; eine neuere Version setzt ihren Schritt davor (Plan Handel 2, Dateimatrix).
 */
export function foldBackFarOrders(x: Record<string, unknown>): Record<string, unknown> {
  if (!('farOffer' in x) && !('farSkip' in x)) return x;
  if (x.farOffer !== null || x.farSkip !== null) throw new Error(FAR_STATE_ERROR);
  const order = x.order as Record<string, unknown> | null;
  if (order !== null && 'island' in order)
    throw new Error('foldBackFarOrders: Fernauftrag nicht rückfaltbar');
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(x)) if (k !== 'farOffer' && k !== 'farSkip') out[k] = x[k];
  out.version = (x.version as number) - 1;
  return out;
}
```

Einbindung (je erste Zeile der Funktion):

```ts
export function foldBackToV13(input: Record<string, unknown>): Record<string, unknown> {
  const x = foldBackFarOrders(input);
  // … bisheriger Rumpf mit x
}
export function foldBackToV12(input: Record<string, unknown>): Record<string, unknown> {
  const f = foldBackFarOrders(input);
  const x = (f.version as number) >= 14 ? dropContractFields(f) : f;
  // … Rest unverändert
}
export function foldBackToV11(input: Record<string, unknown>): Record<string, unknown> {
  const f = foldBackFarOrders(input);
  const v13 = (f.version as number) >= 14 ? dropContractFields(f) : f;
  // … Rest unverändert
}
```

`foldBackToV10`/`V9` laufen über `foldBackToV11` und brauchen keine Änderung. Kommentar über `foldBackToV13` um «Fernfelder
vorher über `foldBackFarOrders`» ergänzen. Keine anderen Funktionen ändern.

- [ ] **Step 4: Grün, alle Aufrufer** — die ≈ 15 Dateien mit Rückfaltung laufen unverändert:

```bash
npx vitest run tests/sim/helpers.test.ts tests/sim/balance-crises.test.ts tests/sim/buyPct.test.ts tests/sim/edicts.test.ts \
  tests/sim/goal3.test.ts tests/sim/reserve-bitgleich.test.ts tests/sim/reserve-save.test.ts tests/sim/save-contract.test.ts \
  tests/sim/save-v11.test.ts tests/sim/save-v12.test.ts tests/sim/save-v13.test.ts tests/sim/save.test.ts \
  tests/sim/scenario-saves.test.ts tests/sim/seaGolden.test.ts; echo EXIT=$?
```

→ `EXIT=0`. (`tests/sim/scenarios.ts` ist Helfer, kein Testlauf.) `npx tsc --noEmit; echo EXIT=$?` → 0.

- [ ] **Step 5: Commit**

```bash
git add tests/sim/helpers.ts tests/sim/helpers.test.ts
git commit -m "test: Rückfaltung foldBackFarOrders vor allen Faltketten (Handel 2 T02)"
```

## Abnahme

- Neuer Test rot vor Step 3, grün danach; alle Faltketten-Aufrufer grün **ohne** eigene Änderung.
- Keine Versionszahl im neuen Code ausser `version − 1`.
- Bericht: Rot-Beleg, Exit-Codes, Laufzeit `helpers.test.ts` (Ziel < 1 s).
