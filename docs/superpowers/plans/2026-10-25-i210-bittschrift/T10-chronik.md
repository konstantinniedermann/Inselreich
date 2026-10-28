# T10 Chronik und Panels

Persona `tech-ui-engineer` (Fortsetzung per `SendMessage`) · Strang C · Tools ≈ 45 · Vitest-Teil von AK-BS-20 und AK-BS-21 · blocked-by T09.

**Files:** Create `src/ui/petitionLog.ts` (DOM-frei, Muster `src/ui/crisisLog.ts`), `tests/ui/petitionLog.test.ts`. Modify `src/ui/inspect.ts` (Panelzeilen, 45 KB, nur per `rg` und abschnittsweise), `src/ui/app.ts` (Berichte → Log), `src/ui/hud.ts` (Chip der laufenden Wirkungen), `src/style.css`.

## Interfaces

- Consumes: `StepReport.petitions: PetitionEvent[]` (T02), `LogEntry`, `pushLog` (`crisisLog.ts`), `overcrowdCap`, `houseCap`, `storageCap`, `petitionCycle` (Panelwerte nur über diese Abfragen, nie selbst rechnen), `PETITIONS`, `formatGameTime`.
- Produces:

```ts
export function petitionLogEntries(events: readonly PetitionEvent[], world: World): LogEntry[]; // Reihenfolge wie events
export function effectLines(world: World, b: Building): string[]; // Panelzeilen eines Gebäudes, [] ohne Wirkung
export function effectsChip(world: World): { label: string; title: string } | null; // laufende Wirkungen, kürzeste Restzeit
```

Texte (Anhang 05):

- `drawn`: «Bittschrift: Weberfamilien bitten um 10 Stoff» (B8: «… bitten um Aufnahme»).
- `thanks`: `PETITIONS[id].thanks` plus Wirkung, z. B. «Die Weberfamilien ziehen ein und danken: Häuser ab Stufe 2 nehmen bis 31:40 mehr Bewohner auf».
- `lament`: nur der `lament`-Text, z. B. «Die Weberfamilien ziehen weiter. In der Stadt wird sparsamer mit Stoff umgegangen.»
- `timeout`: «Keine Antwort: abgelehnt» vor dem Klage-Text des späteren `lament`.
- `lapsed`: «Die Kapelle steht nicht mehr: die Glockenweihe fällt aus, die Gabe ist verloren» (Gebäudename aus dem Anker-Typ).
- `ended`: «Die Weberfamilien ziehen weiter» bzw. «Der Speicher ist abgebaut, 12 Stoff verdorben» (aus `spoiled`).
- Panel Haus: «23 / 20 (Weberfamilien bis 31:40)», wenn `overcrowdCap > houseCap`; «Genügsam: Stoffbedarf −10 % bis 14:20» je Nein-Wirkung (nur HOME-Häuser mit der Ware im Bedarf).
- Panel Betrieb: «Bittschrift: Zyklus 80 % bis …». Lagerzeile HOME: «Lager 120 (Speicher bis …)».
- Kopfleiste: Chip mit der Zahl der laufenden Wirkungen und der kürzesten Restzeit, `title` mit allen Einträgen.
- Glocke und Gutschein (Anhang 05, Zeilen 3 und 4) folgen in T14.

## Schritte

- [ ] **Tests zuerst** `tests/ui/petitionLog.test.ts`:
  - `AK-BS-20-Log`: Ereignisfolge `drawn`, `thanks`, `ended` für B1 → drei Einträge mit den Texten oben (Zeit aus `until`).
  - `AK-BS-21-Log`: `lament` liefert genau einen Eintrag ohne Wirkungsteil; `timeout` liefert «Keine Antwort: abgelehnt».
  - `Panel`: Haus Stufe 4 mit B1-Wirkung und 23 Bewohnern → `effectLines` enthält «23 / 20 (Weberfamilien bis …)»; Haus auf Insel 1 → keine Zeile; Nein-Wirkung Stoff → «Genügsam: Stoffbedarf −10 % bis …»; ohne Wirkung → `[]`.
  - `B9-Ende`: `spoiled.cloth = 12` → «Der Speicher ist abgebaut, 12 Stoff verdorben».
  - `Chip`: zwei Wirkungen → Label nennt 2 und die kürzere Restzeit; keine → `null`.
- [ ] Rot: `npx vitest run tests/ui/petitionLog.test.ts; echo EXIT=$?`.
- [ ] Umsetzen.
- [ ] Grün plus Teilbeleg: `npx vitest run tests/ui/petitionLog.test.ts tests/ui/petition.test.ts tests/ui/crisisLog.test.ts; echo EXIT=$?`, `npx vitest related --run src/ui/inspect.ts; echo EXIT=$?`, `npx tsc --noEmit`, `make lint`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] Commit `feat: I-210 Chronik und Panelzeilen der Bittschrift`.
