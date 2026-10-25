# T06 · Messlauf Proben 2 und 3 (Lösbarkeit, Tickgrenzen)

Umsetzer `tech-sim-engineer` · ≈ 40 Tools · AK-IP-24 (Probe 2, 3), AK-IP-03 bei Seed-Wechsel · blocked-by: T05 · Worktree `.worktrees/inselproben-mess`
(`feat/inselproben-mess`) · Spec §5.2; Anhang 02 D · **Mess-Task (P-2)**

## Dateien

- ändern: `tests/sim/challengeControllers.ts`, `tests/sim/challenge-solvable.test.ts`; `src/sim/defs/challenges.ts` **nur** Fallback Karten-Nummer (Zeile der Probe)
- Nachzug bei Seed-Wechsel oder Probe-Entfernung (H3 b, Besitzer dieser Task): `tests/sim/challenge.test.ts` **nur** die Erwartungen AK-IP-12 a (Seeds,
  Zeilenzahl) und AK-IP-03 (`Set.size`); `it.each(PROBES)` (T02) und die UI-Tests (T09, aus `PROBES` abgeleitet) brauchen keinen Nachzug. Lauf danach
  `npx vitest run tests/sim/challenge.test.ts tests/ui/challenge.test.ts; echo EXIT=$?` → 0 (UI-Datei nur, wenn T09 schon integriert ist).
- nicht ändern: `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, übriges `src/`

## Interfaces

- Consumes: `startChallenge`, `PROBES`; `startColony`, `runColony`, `MAX_TICKS` (`controller.ts`); `runMerchants`, `newMerchantTrajectory`,
  `MERCHANT_TICK_LIMIT` (`merchantsController.ts`); `generateMap`.
- Produces (`tests/sim/challengeControllers.ts`):

```ts
export interface ProbeRun {
  id: string;
  seed: number;
  outcome: 'passed' | 'failed' | null;
  tick: number;
}
export function runProbe(id: string): ProbeRun; // Probe 2: runColony; Probe 3: runMerchants (Anhang 02 D)
export function nextPlayableSeed(from: number): number; // kleinste Zahl > from mit generateMap(n).seedUsed === n
export function probeLimit(measured: number): number; // ceil(measured × 1,25 / 250) × 250
```

## Verhalten

- `runProbe('p2')`: `startChallenge({ kind: 'probe', id })`, `startColony`, `runColony(w, layout, t, { fireStation: true }, w => w.challenge!.result !== null)`
  (Krisen normal wie die Controller-Tests mit Krisen); Obergrenze `MAX_TICKS` 9000.
- `runProbe('p3')`: wie oben, dann `runMerchants(w, layout, newMerchantTrajectory(), stop)` bis `result` oder `MERCHANT_TICK_LIMIT` 12 000.
- Fehlschlag von `startColony` (Gelände ausserhalb der Karte, `expect` in `startColony`) zählt als «nicht erreicht».
- **Fallback (Anhang 02 D, Auflage 1):** Erreicht ein Lauf das Ziel nicht: Karten-Nummer auf `nextPlayableSeed(seed)` setzen (höchstens 10 Versuche), dann
  erneut; im Bericht alle versuchten Nummern mit Ergebnis. Bleibt es rot: **Krisenstufe tiefer nur per Ruling** → `blocked` mit Messwerten an den Controller.

## Steps

- [ ] **Erkundung:** `runProbe` für p2, p3 mit Log; Tick des Bestehens notieren.
- [ ] **Tests rot** in `tests/sim/challenge-solvable.test.ts`, `describe('AK-IP-24 Proben 2–3')`, je Probe eigener `it` (Timeout 30 000 ms):
  - `runProbe(id).outcome === 'passed'` über `startChallenge` (kein anderer Start).
  - `tick ≤ PROBE_LIMIT[id]` mit `PROBE_LIMIT = probeLimit(Messwert)`; Messwert und Grenze als Konstanten mit «Messwert, Änderung nur per Ruling (P-2)».
  - `probeLimit`: 7850 → 10 000; 11 500 → 14 500; 8000 → 10 000 (Rechenregel).
  - Bei Seed-Wechsel: AK-IP-03 (T02) bleibt grün, `PROBES`-Zeile im Diff.
- [ ] **Lauf rot:** `npx vitest run tests/sim/challenge-solvable.test.ts -t "AK-IP-24"; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten.
- [ ] **Lauf grün:** `npx vitest run tests/sim/challenge-solvable.test.ts tests/sim/challenge.test.ts; echo EXIT=$?` → 0; Laufzeit im Bericht.
- [ ] **Teilbeleg** (Index).
- [ ] **Commit:** `test: Lösbarkeit Proben 2 und 3 mit Tickgrenzen (Inselproben T06)`.

## Meldung an L0 (Controller)

Entwurf: «AK-IP-24 Probe 2 {Seed} {Tick} → Grenze {G}; Probe 3 {Seed} {Tick} → Grenze {G}; Seed-Wechsel {ja/nein, Liste}. Empfehlung: Karten-Nummern und
Tickgrenzen als Ruling (gleiches Ruling wie T07).»

## Task-Review

Prüfen: Läufe starten über `startChallenge`; nur Sim-Aktionen und `startColony` (P-5); Grenze nach Rechenregel; Seed-Wechsel mit `seedUsed === seed`
belegt; keine Krisenstufe still gesenkt.
