# T06 Lagen-Helfer und Dominanz B1–B3

Persona `tech-sim-engineer` · Strang B · Tools ≈ 70 · AK-BS-04 (B1–B3) · blocked-by T03. **Last ≤ 4 nötig** (Dateidauer).

**Worktree:** `.worktrees/i210-mess`, Branch `feat/i210-mess` vom T03-Hash auf `feat/i210` (zuerst `git worktree list`). Nur neue Testdateien, kein `src/`-Diff. **Werte in `src/sim/defs/petitions.ts` nicht ändern.** Kippt eine Lage trotz korrekt gebauter Welt, ist das ein Befund an den Controller (Rückfall Anhang 03 §4 nur per L0-Ruling).

**Files:** Create `tests/sim/petitionWorlds.ts` (P-10), `tests/sim/petitionsDominance-b1b3.test.ts`.

## Interfaces

- Consumes: `answerPetition`, `tickPetitions` über `step` (T02), `PETITIONS`, `PETITION_IDS`, `GOODS[g].sell`, `goodsBalance`, `putBuilding`, `placeService`, `setHouse`, `forceRect`, `prepareEast` (`./helpers`), Seed-Entscheid aus dem T00-Ledger.
- Produces (für T07, T08, T12):

```ts
export const PETITION_SEEDS: readonly number[]; // [3, 7] oder [3] nach T00-Messregel; Ersatz nur als feste Konstante
export type Lage = 'yes' | 'no';
export interface PetitionScene {
  w: World;
  mark: PetitionMark;
  note: string;
  feed?: (w: World) => void; // Testzufuhr, in beiden Zweigen nach jedem step (Gewürz, B6-Ersatz T07)
  answerAt?: number; // Tick der Antwort, Standard w.tick; Krisen/Sturm setzt T07 relativ dazu
}
export type SceneBuilder = (seed: number) => PetitionScene;
// baut eine Welt aus createWorld(seed, { unlockAll: true, crisisLevel: 'off', petitionsOn: true }), Marke direkt gesetzt
export function chainsAt(w: World, homeOver: Partial<Record<GoodId, number>>): void; // Betriebe je Kette auf (1 + ü) × Bedarf, liest goodsBalance
export function measuredOver(w: World): Partial<Record<GoodId, number>>; // tatsächliches ü je Ware
export interface DuelRun {
  ok: boolean;
  value: number;
  shortage: GoodId[];
  incident: boolean;
}
export function duel(scene: PetitionScene): { yes: DuelRun; no: DuelRun };
// zwei Läufe aus demselben serialize; Fenster [Antwort, Antwort + delay + duration + 300];
// value = ΔGeld + Σ_g ΔLager_g × GOODS[g].sell (Mass wie I-201); shortage: von Häusern verbrauchte Waren, die im Fenster 0 erreichen
export const SCENES: Partial<Record<PetitionId, Record<Lage, SceneBuilder>>>;
```

`chainsAt` setzt Betriebe nur auf HOME und nutzt ganze Raten. Mit gemischten Ausbaustufen (`level`) wird ü möglichst genau getroffen; das tatsächliche ü liest `measuredOver`. Alle Gebäude stehen nach dem Aufbau `connected`. Danach kein `placeBuilding` oder `demolish` mehr.

## Lagen (Anhang 01, Zeilen B1–B3)

- **B1 Ja:** 6 Kaufmannshäuser (Stufe 4, 20 Bewohner), ü = 20 % in allen fünf Ketten, Lager je 60. **Nein:** P1: 4 Bürgerhäuser (Stufe 3), ü = 0, Stoff 31, Rum 5, Nahrung 38.
- **B2 Ja:** 4 Bürgerhäuser, Rum, Nahrung und Stoff je ü = 20 %, Rum 40. **Nein:** P1 mit Rum 10, Rum-Produktion 6 gegen Bedarf 10.
- **B3 Ja:** 3 Kaufmannshäuser, alle Ketten ü = 20 %, Glas 40. **Nein:** P3a: Glas 26, Glas-Produktion 6 gegen Bedarf 6, Gewürz ü = 0.
- Gewürz für Kaufmannshäuser: Testzufuhr je 100 T auf HOME in Höhe der Bedarfsrate × (1 + ü) (Anhang 03 §1 erlaubt es). Die Zufuhr läuft in beiden Zweigen gleich und steht in `note`.

## Erwartungen (`describe.each(PETITION_SEEDS)`, je Bitte)

- **Vorbedingungen** (eigene `expect`, vor der Rangfolge): `yes.ok` und `no.ok`; `incident === false` in beiden Läufen; in der Ja-Lage sind die überbelegten Häuser beim Nachspiel versorgt (kein `shortage` im Ja-Lauf bis Nachspiel + 150). In der Nein-Lage tritt im Ja-Lauf ein `shortage` auf (Anhang 01, Hinweise; sonst ist die Lage falsch gebaut).
- **Rangfolge:** Ja-Lage `yes.value > no.value`; Nein-Lage `no.value > yes.value`. Keine Beträge.
- **Bericht (Pflicht):** Tabelle je Bitte, Lage und Seed mit beiden Werten, dem Abstand und `measuredOver` (R553, Drift-Beleg). Die Werte gehören nicht in `console`.

## Schritte

- [ ] **Rot per Stub (nie committen):** zuerst den Test gegen eine Welt schreiben, in der `answerPetition` wirkt. Rot heisst: `OVERCROWD_PCT` vorübergehend auf 0 und `FRUGAL_PCT` auf 0 → die Ja-Lagen verlieren (Lauf Exit ≠ 0). Werte zurück, `git diff --quiet src/; echo EXIT=$?` = 0.
- [ ] Helfer und Lagen bauen, kalibriert werden nur Aufbaugrössen (Hauszahl, Bewohner, Startlager innerhalb der Anhang-Vorgaben), nie Erwartungen.
- [ ] Lauf: `make messfenster; echo EXIT=$?`, dann `npx vitest run tests/sim/petitionsDominance-b1b3.test.ts; echo EXIT=$?` mit Wandzeit (`/usr/bin/time -p` vor `npx`). **Soll < 30 s.** Darüber gilt die Messregel aus T00 neu an der echten Dauer, zuerst ein Seed, dann je Bitte eine Datei. Die R553-Begründung kommt in den Dateikopf: welche Lage, warum Seed 3 reicht (Gebäude relativ zum Kontor, Seed prüft nur Gelände) und dass Seed 3 fest ist.
- [ ] Teilbeleg: `npx tsc --noEmit`, `make lint`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] Commit `test: I-210 Dominanz B1 bis B3 und Lagen-Helfer`.
