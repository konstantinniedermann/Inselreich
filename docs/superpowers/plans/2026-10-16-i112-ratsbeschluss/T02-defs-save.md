# T02 · Defs, Weltfeld, Save

`tech-sim-engineer` · ≈ 40 Tools · AK 1 (Weltteil), 9, 10 · blocked-by: T01, Ruling R-4 · Test zuerst (rot vor Umsetzung)

Dateien: `src/sim/defs/council.ts` (neu), `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/save.ts`, `tests/sim/council.test.ts` (neu),
`tests/sim/council-save.test.ts` (neu); ggf. `tests/sim/scenarios.ts` nur falls ein Fixture-Erzeuger die Version fest erwartet.

## Umsetzung

1. Typen (`types.ts`): `CouncilTier = 2 | 3 | 4`, `CouncilSide = 'A' | 'B'`, `CouncilState = null | 'open' | CouncilSide`;
   `CouncilLever` als Union aus drei Formen: `{ kind: 'cycle'; defId; value }`, `{ kind: 'serviceRadius'; defId; value }`,
   `{ kind: 'maxInhabitants'; tier; value }`; `CouncilDef = { name: string; text: string; lever: CouncilLever }`;
   `World.council: Record<CouncilTier, CouncilState>`.
2. `defs/council.ts`: `COUNCIL_TIERS = [2, 3, 4] as const`, `COUNCIL: Readonly<Record<CouncilTier, Record<CouncilSide, CouncilDef>>>` mit den
   sechs Werten aus Spec §3.1 (Weberei 40, Kapelle 13, Brennerei 40, Stufe 3 → 16, Glashütte 30, Stufe 4 → 22) und den Kartentexten wörtlich;
   dazu `COUNCIL_NOTE = 'Gilt für die ganze Partie, der andere Beschluss verfällt.'` und `COUNCIL_OPEN_MESSAGE = 'Der Rat tagt: ein Beschluss steht an'`.
   Kopfkommentar wie `defs/edicts.ts` (Änderung nur per Ruling, R-2).
3. `world.ts` `createWorld`: `council: { 2: null, 3: null, 4: null }` (Schlüsselreihenfolge fest, Determinismus).
4. `save.ts`: `SAVE_VERSION = 17` (Arbeitsannahme, endgültig main + 1 beim Merge, R674; im Bericht nennen). Validierung `isValidCouncil(raw)`
   in `isWellFormed`: Objekt mit genau den Schlüsseln `'2'`, `'3'`, `'4'`, Werte aus `null | 'open' | 'A' | 'B'`; sonst «Beschädigter Spielstand».
5. Ältere Stände nach **R-4**:
   - **R-4 Variante M (Empfehlung):** `migrateV16ToV17(raw)`: `council[n] = 'open'`, wenn ein Haus mit `tier ≥ n` existiert, sonst `null`;
     wirft nie; Kette in `deserialize` um eine Zeile verlängern. Die bestehenden Migrationstests bleiben grün.
   - **R-4 Variante A (Abweisen):** keine Migration; die Kette endet bei v16 und liefert «Unbekannte Version». Dann alle Tests, die alte
     Stände auf `SAVE_VERSION` heben (`save-v11/-v12/-v13/-loyalty/-contract`, `save.test.ts`, `inselmarkt`, `scenario-saves`, `scenarios.ts`),
     auf «abgewiesen» umschreiben. Mehraufwand ≈ +40 Tools, eigener Task T02b mit Review (+2 Starts, Budgetmeldung vorab).

## Tests

`council.test.ts`: «AK-1 neue Welt» (Weltteil: alle drei `null`; der `decree`-Teil folgt in T03) · «AK-10 Tabelle»: 6 Einträge, je Stufe A und B,
`name`/`text`/`lever`/`value` vorhanden, Texte enthalten die Zahl (`/\d/`), Hebel zeigen auf Weberei/Kapelle/Brennerei/Stufe 3/Glashütte/Stufe 4.

`council-save.test.ts` (AK 9): Rundreise `serialize → deserialize → serialize` gleich für `council` mit je `null`, `'open'`, `'A'`, `'B'`;
`version: SAVE_VERSION + 1` → `{ ok: false, reason: 'Unbekannte Version' }`; `council` fehlt bzw. `council[3] = 'X'` → «Beschädigter
Spielstand», kein Wurf; Variante M: v16-Stand mit Stufe-3-Haus → `{2: 'open', 3: 'open', 4: null}`; Variante A: v16-Stand → abgewiesen.

## Prüfschritte

Allgemeine Prüfungen laut Plan-Index · `npx vitest run tests/sim/council.test.ts tests/sim/council-save.test.ts tests/sim/save*.test.ts tests/sim/scenario-saves.test.ts; echo EXIT=$?`
· `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?`. Commit `feat: Rat-Defs, Weltfeld council, SAVE_VERSION 17 (I-112)`.
