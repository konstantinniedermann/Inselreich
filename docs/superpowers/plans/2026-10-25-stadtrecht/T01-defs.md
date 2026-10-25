# T01 · Defs und Typen Stadtrecht

Umsetzer `tech-sim-engineer` · ≈ 30 Tools · AK-ST-01 · blocked-by: T00 · Worktree `.worktrees/stadtrecht` (`feat/stadtrecht`) · Spec §3.1, §5, §8

## Dateien

- neu: `src/sim/defs/charter.ts`, `tests/sim/charter.test.ts`
- ändern: `src/sim/types.ts` (nur neue Typen direkt unter dem Rats-Block `CouncilDef`; `World` noch **nicht**, das macht T02)
- nicht ändern: `src/sim/defs/council.ts`, `src/sim/defs/buildings.ts`, `src/sim/council.ts`

## Interfaces

- Consumes: `COUNCIL`, `COUNCIL_TIERS` (`defs/council.ts`, Stand nach Seerecht: `CouncilSides` mit A, B und optional C), `BUILDING_DEFS`, `CouncilLever`.
- Produces (in `types.ts`):
  - `export type CharterSide = 'A' | 'B';` (eigener Typ, nie `CouncilSide`, R874 5)
  - `export type CharterLever = Extract<CouncilLever, { kind: 'cycle' }>;`
  - `export interface CharterSessionDef { name: string; money: number; stone: number; glass: number; a: { taxPoints: number; name: string; text: string }; b: { lever: CharterLever; name: string; text: string } }`
- Produces (in `defs/charter.ts`): `CHARTER_SESSIONS: readonly CharterSessionDef[]`, `CHARTER_UNLOCK = 'won' as const` (Muster `EDICT_UNLOCK`, `defs/edicts.ts:38`), `CHARTER_NOTE = 'Gilt für die ganze Partie.'`, `CHARTER_AFFORDABLE_MESSAGE = 'Der Rat kann tagen: Stadtrecht leistbar'`.

## Werte (Spec §3.1, R870 R-2; Texte P-5)

| k   | name          | money | stone | glass | a.taxPoints | b.lever (`kind: 'cycle'`) | b.name                        | b.text                               |
| --- | ------------- | ----- | ----- | ----- | ----------- | ------------------------- | ----------------------------- | ------------------------------------ |
| 1   | Marktrecht    | 5000  | 20    | 0     | 2           | `quarry` 40               | Steinbrüche schneller         | Steinbrüche +50 % schneller.         |
| 2   | Zollrecht     | 8500  | 20    | 20    | 2           | `toolmaker` 40            | Werkzeugmacher schneller      | Werkzeugmacher doppelt so schnell.   |
| 3   | Münzrecht     | 14500 | 20    | 30    | 2           | `spicefarm` 40            | Gewürzplantagen schneller     | Gewürzplantagen +25 % schneller.     |
| 4   | Stapelrecht   | 24600 | 20    | 40    | 2           | `fisher` 28               | Fischerhütten schneller       | Fischerhütten +43 % schneller.       |
| 5   | Gerichtsrecht | 41800 | 20    | 50    | 2           | `sheepfarm` 35            | Schäfereien schneller         | Schäfereien +43 % schneller.         |
| 6   | Freie Stadt   | 71000 | 20    | 60    | 2           | `canefarm` 35             | Zuckerrohrplantagen schneller | Zuckerrohrplantagen +43 % schneller. |

A je Sitzung: `name: 'Steuer +2 %'`, `text: '+2 % Steuer in allen Stufen.'`. Die `defId` jeder Zeile vor dem Schreiben mit `rg -n "cycle:" src/sim/defs/buildings.ts` gegen die Spec-Zeilen (`:108`, `:178`, `:269`, `:54`, `:122`, `:150`) prüfen; weicht ein Def-Takt von der Spec ab (60/80/50/40/50/50), `blocked` an den Controller, nicht still anpassen. Kopfkommentar wie `defs/council.ts`: «Spielwerte des Stadtrechts (Spec §3.1). Änderung nur per Ruling (R-2); der Balancing-Test muss grün bleiben.»

## Steps

- [ ] **Test rot** in `tests/sim/charter.test.ts`, Block `describe('Stadtrecht Defs (AK-ST-01)')`:
  - 6 Einträge; jeder hat `name` (nicht leer), `money`, `stone`, `glass` als ganze Zahl ≥ 0, `a.taxPoints > 0`, `a.name`/`a.text` enthalten `${a.taxPoints} %`, `b.lever.kind === 'cycle'`, `b.text` nicht leer.
  - `money` streng steigend über k.
  - `b.lever.value < BUILDING_DEFS[defId].cycle` und `≥ 1` (Hebel beschleunigt, `max(1, …)` greift nie, Spec §4.2).
  - **Disjunktheit über alle Seiten von `COUNCIL`:** Menge der `defId` aus `Object.values(COUNCIL[t])` für alle `t` aus `COUNCIL_TIERS` (A, B und C, falls vorhanden; nur Hebel mit `'defId' in lever`) schneidet die Menge der B-`defId` nicht. Die Iteration darf keine Seitennamen fest auflisten.
  - B-`defId` paarweise verschieden (`new Set(...).size === 6`).
  - Typ-Probe: `const s: CharterSide = 'A'` kompiliert; `// @ts-expect-error` auf `const c: CharterSide = 'C'`.
- [ ] **Lauf rot:** `npx vitest run tests/sim/charter.test.ts; echo EXIT=$?` → ≠ 0 (Modul fehlt).
- [ ] **Umsetzen:** Typen in `types.ts`, Werte in `defs/charter.ts`.
- [ ] **Teilbeleg:** `npx vitest run tests/sim/charter.test.ts tests/sim/council.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?` → je 0. Balancing-Diff leer (Index, Prüfpflichten).
- [ ] **Commit:** `feat: Stadtrecht-Defs und Typen (AK-ST-01)`.

## Task-Review

Werte exakt laut Tabelle; keine Zahl ausserhalb `defs/charter.ts`; `CharterSide` nicht aus `CouncilSide` abgeleitet; Disjunktheitstest läuft generisch über alle Ratsseiten. Texte P-5: der Reviewer meldet Formulierungsfragen als BEDENKEN an den Controller (Weitergabe an `lead-design`), kein Blocker.
