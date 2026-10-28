# T02 Ziehen, Antwort, Frist, Nachspiel, Tick-Platz

Persona `tech-sim-engineer` · Strang A · Tools ≈ 70 · AK-BS-01 (Strom), -02, -03 (ohne Save), -06, -07, -08, -11 (Anker), -12, -16 (`petitions.ts`), -23 (P-12) · blocked-by T01.

**Files:** Create `src/sim/petitions.ts`, `tests/sim/petitionsRuns.test.ts`. Modify `src/sim/tick.ts`, `tests/sim/petitions.test.ts`.

## Interfaces

- Consumes (T01): `PETITIONS`, `PETITION_IDS`, Konstanten, `PetitionsState`, `PetitionMark`, `petitionRng`, `HOME`.
- Produces (`src/sim/petitions.ts`):

```ts
export type PetitionEventKind = 'drawn' | 'thanks' | 'lament' | 'lapsed' | 'ended' | 'timeout';
export interface PetitionEvent {
  kind: PetitionEventKind;
  id: PetitionId;
  drawnAt: number;
  amount?: number; // 'drawn'
  spoiled?: Partial<Record<GoodId, number>>; // 'ended' bei B9 (Kappung), T03
}
export const PETITION_REASONS: {
  off: 'Bittschriften aus';
  none: 'Keine offene Bitte';
  answered: 'Schon beantwortet';
  unknown: 'Unbekannte Antwort';
  anchorGone: (name: string) => string; // «Kapelle steht nicht mehr»
  lack: (good: GoodId, have: number, need: number) => string; // «Zu wenig Rum (0 / 10)», ⌊Bestand⌋
};
export function petitionCost(world: World, mark: PetitionMark): Partial<Record<GoodId, number>>; // Kosten in Def-Reihenfolge
export function petitionCandidates(world: World): PetitionId[]; // §3.2.3, Tabellenreihenfolge; liest nur
export function answerPetition(world: World, drawnAt: number, answer: string): Result; // §3.3, wirft nie
export function tickPetitions(world: World): PetitionEvent[]; // §3.4 (a) Ablauf (b) Frist (c) Nachspiel (d) Ziehen
// tick.ts: StepReport { …; petitions: PetitionEvent[] }
```

- `on === false` → `tickPetitions` gibt `[]` zurück, **vor** jedem Zugriff auf Strom oder Felder (AK-BS-01, Spec §3.1.3).
- `next === null && world.won` → `next = world.tick + PETITION_FIRST`, im selben Aufruf kein Zug (P-6).
- Ziehen bei `tick === next`, danach immer `next += PETITION_PERIOD`; Sperre bei `open.length ≥ PETITION_MAX_OPEN`; Kandidat: `when` gilt, nicht offen, Kosten jetzt gedeckt. `r1` wählt `⌊r1 × n⌋`, bei Anker `r2` unter passenden Gebäuden nach Id aufsteigend (B4: Kapellen auf HOME mit Haus im Radius unter Höchststufe; Radius über die bestehende Kapellen-Radius-Abfrage in `feast.ts`, in Phase 2 über `feastEffect`; B5 Kapellen auf HOME; B6 `spicefarm` jeder Insel; B7 `weaver` auf HOME).
- `E` = Σ `inhabitants` aller Häuser ab Stufe 2 auf HOME beim Ziehen.
- (a) entfernt `until ≤ tick` mit Ereignis `ended` (die Kappung für B9 ergänzt T03); (b) Frist bei `tick === drawnAt + PETITION_ANSWER` ohne `answer` → wie «Nein», Ereignis `timeout`; (c) `tick === dueTick`: «Ja» mit Anker steht (oder ohne Anker) → Wirkung `{ id, answer: 'yes', until: tick + duration, anchor }`, `thanks`. Anker fehlt → `lapsed`. «Nein» → `lament`. Die Marke wird entfernt.
- «Nein» (Antwort oder Frist) legt sofort `{ id, answer: 'no', until: tick + FRUGAL_TICKS }` an. **Hinweis:** Die Frist (b) setzt `dueTick = tick + delay` wie Schritt 8.
- Tick-Platz: in `step` nach `tickCrises`, vor `checkWin`; `tickUnlocks` bleibt letzter Aufruf. `StepReport.petitions` wird immer gesetzt (`[]` bei aus).

## Schritte

- [ ] **Tests zuerst** in `tests/sim/petitions.test.ts` (Welten mit `createWorld(seed, { unlockAll: true, crisisLevel: 'off', petitionsOn: true })` plus Helfer aus `./helpers`; Marken direkt setzen, wo das AK es erlaubt):
  - `AK-BS-02`: vor Ziel 1 bleibt `next` null über 2000 Schritte. Danach `won = true` von Hand im Tick T: Nach einem `step` gilt `next === T + 1 + 600` (P-6). Bei `tick === next` entsteht die erste Marke, vorher keine; der zweite Termin liegt bei `next + 6000`. Fall «kein Kandidat»: `won` und `wonSpice` gesetzt, Rum, Glas, Wolle, Gewürz 0, keine Kapelle, kein Lager ≥ 90 → keine Marke, `next` + 6000. Vor dem zweiten Termin setzt der Test Glas 20 und ein Haus Stufe 4 (B3 ist ohne offenes Ziel ziehbar) → beim zweiten Termin entsteht die Marke `glaziers`.
  - `AK-BS-06`: Rum 0, Marke B2 gesetzt → «Zu wenig Rum (0 / 10)», `JSON.stringify(world)` gleich vorher. B4 mit Rum 30, Stein 4 → «Zu wenig Stein (4 / 10)», Rum 30; danach «Nein» `ok`. Lager fällt nach dem Ziehen unter `amount` → «Ja» gesperrt; nach 1200 Schritten ist die Marke beantwortet `'no'`.
  - `AK-BS-07`: Rum 0 → in 50 Seeds (Termin erreicht) nie `tavern`; ohne Kapelle nie `bell`/`feastDrink`; ohne `spicefarm` nie `spiceSeed`; nach `wonSpice` nie `weavers`/`returnees`; ohne Kandidaten keine Marke und `next` + 6000.
  - `AK-BS-08`: zwei Marken gesetzt, Termin erreicht → keine dritte, `next` + 6000; `answerPetition` auf beide getrennt `ok`.
  - `AK-BS-11 (Anker)`: Kapelle einer B4-Marke vor der Antwort abgerissen (`demolish`) → «Ja» liefert «Kapelle steht nicht mehr», «Nein» ok; nach «Ja» abgerissen → bei `dueTick` Ereignis `lapsed`, keine Wirkung, Rum und Stein nicht zurück.
  - `AK-BS-12`: offene Marke; ohne `step` bleibt die Welt gleich (kein Wanduhr-Bezug, `JSON` vorher/nachher). Nach 1199 Schritten ist sie offen, nach 1200 gilt `answer === 'no'`.
  - `Antwortgründe`: `on: false` → «Bittschriften aus»; falsches `drawnAt` → «Keine offene Bitte»; zweites «Ja» → «Schon beantwortet», Lager nur einmal belastet (Review Focus 5); `'maybe'` → «Unbekannte Antwort»; Antwort im Fristtick nach `step` → «Schon beantwortet» (Review Focus 3).
  - `AK-BS-16 petitions.ts`: Quelltext ohne Kommentare (Muster aus bestehenden Strukturtests, z. B. `rg -n "readFileSync" tests/sim`) enthält keine der Zahlen `6000`, `4800`, `3000`, `2400`, `1800`, `1200` als Wort, nicht `0xc2b2ae35` bzw. dessen Dezimalwert, keine Waren-Id als Stringliteral (`'cloth'` … `'spice'`); Importzeile aus `./defs/petitions` vorhanden (Anhang 02, B-9).
  - `AK-BS-23` (nur wenn `src/sim/challenge.ts` auf main, P-12): Für je eine Probe, ein Szenario und den Tagesstart gilt `world.petitions.on === false`.
- [ ] **Langläufe** in `tests/sim/petitionsRuns.test.ts`:
  - `AK-BS-01 Strom`: `vi.mock('../../src/sim/petitionRng', async (orig) => { const m = await orig<…>(); return { petitionRng: vi.fn(m.petitionRng) }; })`; Balancing-Controller (`buildColony` auf `createWorld(seed)`) über 20 000 T (bzw. bis Controller-Ende, dann `step` bis 20 000) → `petitionRng` 0 Aufrufe, `JSON.stringify(world.petitions)` in jedem Kontrolltakt gleich dem Startwert.
  - `AK-BS-03 Folge`: zwei Welten, gleicher Seed, `petitionsOn: true`, `won` bei T = 100 gesetzt, gleicher Aufbau, je Termin «Ja», wenn `ok`, sonst «Nein»; 30 000 T → gleiche Folge `(drawnAt, id, amount, anchor)` und gleiches `serialize`. Krisen: derselbe Lauf mit `crisisLevel: 'normal'`, Bittschriften an gegen aus, ohne Antworten → gleiche Folge `(Starttick, Art)` der Krisen (Ziele vergleichen wir nicht, die Wirtschaft unterscheidet sich).
- [ ] Rot: `npx vitest run tests/sim/petitions.test.ts tests/sim/petitionsRuns.test.ts; echo EXIT=$?`.
- [ ] Umsetzen; `tick.ts` ergänzen.
- [ ] Grün plus Teilbeleg: dieselben Dateien und `npx vitest related --run src/sim/tick.ts; echo EXIT=$?` (nur Exit, Dauer ins Ledger), `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`. **Dauer `petitionsRuns.test.ts` < 30 s** (Last ≤ 4), sonst Meldung an den Controller.
- [ ] Commit `feat: I-210 Ziehen, Antwort, Frist und Nachspiel`.
