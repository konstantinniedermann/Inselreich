# T02 · Save: Version, Migration, Prüfung, v14-Fixture

Plan: [Index](../2026-10-16-i091-treue.md) · Spec §4 «Save», R663 · AK-TR-13a, 14, 15 · Umsetzer `tech-sim-engineer` ·
Modell sonnet · ≈ 40 Tools · blocked-by: T01

**Files:**

- Modify: `src/sim/save.ts` (`SAVE_VERSION`, neue Migration, Kette in `deserialize`, `isValidContractFields`),
  `src/sim/types.ts` und `src/sim/world.ts` (nur `version`-Literal)
- Modify: `tests/sim/helpers.ts` (`foldBackDeliveries`), `tests/sim/helpers.test.ts`, `tests/sim/farOrder-save.test.ts`
  (Mitzieh «Vorversion»)
- Create: `tests/sim/save-loyalty.test.ts`, `tests/sim/fixtures/save-v14-contract.json` (generiert, Schritt 4)
- **Nicht:** `orders.ts`, Faltketten `foldBackToV13/V12/V11` (siehe Hinweis), `src/ui/`

**Versionsnummer:** `S` = Wert aus T00 (`M + 1`, Arbeitsannahme 16). In diesem Task wird `S` eingesetzt; endgültig legt
sie T06 beim Merge fest. Kein Test nennt `S` oder `S − 1` als Zahl.

## Schritte

- [ ] **1 Test zuerst (`tests/sim/helpers.test.ts`):** `foldBackDeliveries`:
  - Vertrag mit `deliveries: 3` → Ergebnis-Vertrag ohne Schlüssel `deliveries`, übrige Schlüssel in gleicher Reihenfolge,
    `version` um 1 kleiner, Eingabe unverändert (keine Mutation).
  - `contract: null` → nur `version − 1`, sonst `JSON.stringify`-gleich.
- [ ] **2 Test zuerst (`tests/sim/save-loyalty.test.ts`):** Testwelt `withContract(n)`: `createWorld(3, { unlockAll: true })`,
      `w.order = null`, `w.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries: n }`; `json(w)`,
      `load(w)` wie `save-contract.test.ts`.
  - **AK-TR-13a:** `withContract(3)`, Lager Rum 10, Speichern/Laden → `deliveries === 3`; danach je ein Schritt auf den
    nächsten Periodenbeginn in geladener und Originalwelt → beide `deliveries === 4`, `serialize` gleich.
  - **AK-TR-14a (Funktion):** `raw = foldBackDeliveries(json(withContract(3)))`; `raw.version === SAVE_VERSION - 1`;
    `migrateV<S−1>ToV<S>(raw)` → `raw.contract.deliveries === 0`, `raw.version === SAVE_VERSION`, Vertragsschlüssel-Reihenfolge
    `['good','amount','price','island','deliveries']`; mit `contract: null` bleibt `null`. Zweimal aufrufen wirft nicht.
  - **AK-TR-14b (Kette):** `raw` **frisch** per `foldBackDeliveries(json(withContract(3)))` bauen (14a hat sein `raw`
    bereits in place migriert) und über `deserialize(JSON.stringify(raw))` → `ok`, `deliveries === 0`.
  - **AK-TR-14c (v14-Fixture):** `tests/sim/fixtures/save-v14-contract.json` laden (`readFileSync`) → `version === 14`
    im Rohtext (historisch, einzige erlaubte Zahl), `deserialize` → `ok`, `world.version === SAVE_VERSION`,
    `world.contract` `toEqual` `{ good: 'rum', amount: 5, price: 27, island: HOME, deliveries: 0 }`, `farOffer`/`farSkip`
    `null`.
  - **AK-TR-15:** aus `json(withContract(3))` je Fall `contract.deliveries` = fehlt (Schlüssel löschen), `null`, `-1`, `2.5`,
    `'3'` → `deserialize` wirft nicht (`expect(() => …).not.toThrow()`) und liefert `{ ok: false, reason: 'Beschädigter
Spielstand' }`. `version = SAVE_VERSION + 1` → `{ ok: false, reason: 'Unbekannte Version' }`. `deliveries = 99` →
    `ok`, Wert bleibt 99 (Kommentar im Test: «bewusst ohne Obergrenze, Spec §4»).
  - **Generator** (Muster `save-contract.test.ts` `SCENARIO_OUT`): `it.skipIf(!process.env.FIXTURE_OUT)('schreibt
save-v14-contract.json', …)`: `withContract(0)` mit Kontor auf HOME, `x = foldBackFarOrders(foldBackDeliveries(json(w)))`,
    prüft `x.version === 14`, schreibt `JSON.stringify(x)` nach `$FIXTURE_OUT/save-v14-contract.json`.
- [ ] **3 Rot-Beleg:** `npx vitest run tests/sim/helpers.test.ts tests/sim/save-loyalty.test.ts; echo EXIT=$?` → `EXIT=1`.
      Hinweis: Der Import von `migrateV<S−1>ToV<S>` lässt die Datei vor Schritt 5 als Ganzes scheitern; im Bericht die
      Fehlschläge je `it` aus einem zweiten Lauf nach Anlegen eines leeren Funktionsrumpfs (wirft nicht, tut nichts) belegen.
- [ ] **4 `foldBackDeliveries`** in `tests/sim/helpers.ts`, direkt **vor** `foldBackFarOrders`:

```ts
/**
 * I-091: entfernt `contract.deliveries` (ohne Umordnen) und setzt `version − 1`. Nur für Stände der aktuellen Version;
 * äusserster Faltschritt. Die Ketten `foldBackToV13/V12/V11` brauchen ihn nicht: Sie verlangen `contract === null` und
 * setzen die Version selbst.
 */
export function foldBackDeliveries(x: Record<string, unknown>): Record<string, unknown>;
```

      Danach Fixture erzeugen: `FIXTURE_OUT=tests/sim/fixtures npx vitest run tests/sim/save-loyalty.test.ts -t
      "schreibt"; echo EXIT=$?` → Datei committen (≈ 300 KB wie `save-v11.json`).

- [ ] **5 Umsetzen (`save.ts`):**
  - `SAVE_VERSION = S`; `types.ts` `version: S`; `world.ts` `version: S`.
  - Nach `migrateV14ToV15`:

```ts
/** v<S−1> → v<S> (I-091): Treue-Zähler `contract.deliveries = 0` bei laufendem Vertrag; `null` bleibt. Wirft nie. */
export function migrateV15ToV16(raw: Record<string, unknown>): void {
  const c = raw.contract;
  if (typeof c === 'object' && c !== null && !Array.isArray(c) && !('deliveries' in c))
    (c as Record<string, unknown>).deliveries = 0;
  raw.version = 16;
}
```

    (Zahlen = `S − 1`/`S`.) Kettenglied `if (raw.version === 15) migrateV15ToV16(raw);` direkt nach dem v14-Glied.

- `isValidContractFields`, im Block `contract !== null`: `!isInt(contract.deliveries) || contract.deliveries < 0` →
  `false`. Keine Obergrenze. JSDoc «(v14)» → «(v14, `deliveries` ab v<S>)».
- [ ] **6 Mitzieh `farOrder-save.test.ts` «Vorversion ohne Felder»:** heute `raw.version = SAVE_VERSION - 1` nach
      Löschen von `farOffer`/`farSkip`; nach dem Bump ist das nicht mehr die Fern-Vorversion. Ersetzen durch
      `const raw = foldBackDeliveries(JSON.parse(serialize(w)))`, dann beide Schlüssel löschen und
      `raw.version = (raw.version as number) - 1`. Alle Erwartungen des Falls bleiben wörtlich.
      Zusätzlich Fall «beschädigte Angebote» (Z. ≈ 109–113): das Literal `w.contract = { … } as never` erhält `deliveries: 0`
      (`as never` bleibt), damit der Stand weiter wegen der Fern-Kombination abgewiesen wird und nicht wegen des fehlenden
      Felds (sonst grün aus falschem Grund). Im Bericht nennen.
- [ ] **7 Grün:** `npx vitest run tests/sim/save-loyalty.test.ts tests/sim/helpers.test.ts tests/sim/farOrder-save.test.ts
tests/sim/save-contract.test.ts tests/sim/save.test.ts tests/sim/scenario-saves.test.ts tests/sim/seaGolden.test.ts
tests/sim/save-v13.test.ts tests/sim/save-v12.test.ts tests/sim/save-v11.test.ts; echo EXIT=$?` → 0. Weitere rote Dateien
      mit Versionsbezug: Ursache nennen, nur nach Mitzieh-Regel (Index) anpassen.
- [ ] **8 Wächter:** `git diff main -- tests | grep -nE "^\+.*(version\W{1,4}1[4-9]|SAVE_VERSION\s*[-+]\s*[2-9])";
echo EXIT=$?` → Treffer **nur** im Generator (`x.version === 14`) und in AK-14c (`14`); jeder andere Treffer ist ein Fehler. Liste
      im Bericht.
- [ ] **9 Pflichtläufe:** `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?` → 0.
- [ ] **10 Commits:** `test: Save-Treue rot (I-091 T02)`, `feat: Save v<S> mit Treue-Zähler (I-091 T02)`,
      `test: v14-Fixture mit Vertrag (I-091 T02)`.

## Prüfschritte / Task-Review

Reviewer prüft: Migration wirft nie (auch `contract` kaputt → Prüfung meldet, nicht Migration), `deliveries` nur bei
`contract ≠ null` geprüft, `null` abgewiesen, `99` lädt, Fixture wirklich v14 (`head -c 200`), Faltketten ohne Diff,
`farOrder-save.test.ts` Erwartungen wörtlich gleich; `tsc`, `make lint` Exit 0.
