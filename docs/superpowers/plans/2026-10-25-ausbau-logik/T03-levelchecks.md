# T03 AL-2a `levelChecks` und Chiptexte (eine Textquelle)

Persona `tech-sim-engineer` · Strang A · Tools ≈ 50 · AK-AL-24 (Zeilen, Reihenfolge, Zahlen; Vergleich mit `upgradeBuilding` in T05, Plan P-7), Review Focus 4 · blocked-by T02.

Spec: R7, R9, Anhang 02 N3 und N5 (alle Texte wörtlich), Plan P-5.

**Files:** Create `src/sim/levelChecks.ts`, `tests/sim/levelChecks.test.ts`.

**Interfaces (Produces):**

```ts
export type LevelCheckId =
  'knowledge' | 'burning' | 'workforce' | 'site' | 'money' | 'wood' | 'tools' | 'stone' | 'extra';
export interface LevelCheck {
  id: LevelCheckId;
  ok: boolean;
  have: number;
  need: number;
  text: string;
}
/** Zeilen für den Ausbau auf `level` (= g + 1) in R7-Ordnung (N3). [] ohne LEVELS-Eintrag oder bei level > Höchststufe. */
export function levelChecks(world: World, b: Building, level: number): LevelCheck[];
/** Chip bei k < g: «Läuft wie Stufe k: <✗-Text der ersten verletzten Dauerzeile der Stufe k + 1>»; null bei k = g, paused oder brennend. */
export function levelChipText(world: World, b: Building): string | null;
/** Tooltip des Chips: alle verletzten Dauerzeilen der Stufen k + 1 … g. Unterhaltszeile ergänzt T04. */
export function levelChipDetail(world: World, b: Building): string[];
```

Importe: `./levelRules`, `./unlocks` (`functionLock`), `./economy` (Kasse/Lager lesen), `./defs/*`, `./types`, `./world`, `./coverage`. `levelChecks.ts` wird von `levels.ts` **nicht** importiert.

Zeilen (N3): `knowledge` (✓ «Wissen: Ausbau Stufe n bekannt (…)» bzw. ✗ = `functionLock`-Text der Stufe), `burning` (nur wenn `outageUntil` gesetzt: ✗ «Gebäude brennt»), `workforce`, `site` (nur wenn die Stufe `site` hat; Feuerwache bei Krisen aus ✓ «Feuerwache: nicht nötig (Krisen aus)»), `money` (✓ «Geld 65 (Kasse 812)», ✗ «Zu wenig Geld (40 / 65)»), `wood`, `tools`, `stone` (je nur bei Bedarf > 0; ✗ «Zu wenig Stein (0 / 2)»), `extra` (✓ «Stoff 2 (Lager 14)»; ✗ «Zu wenig Stoff (1 / 2)»). Funktion der Stufe 2/3: `upgrade2`/`upgrade3`; Stufe 4 ergänzt T11. Texte der Fachkräfte-, Standort- und Feuerwachen-Zeilen exakt nach N5 (Haus nötig: Siedlerhaus/Bürgerhaus/Kaufmannshaus; Wortwahl Handwerker/Meister/Verleger; «kein Siedlerhaus auf dieser Insel», «Siedlerhaus nur auf anderer Insel»; Ofen-Wort je Typ: Brennerei «Brennofen», Werkzeugmacher «Esse», Glashütte «Schmelzofen» — als Text-Tabelle in `levelChecks.ts`, kein Spielwert, P-5). Anzeigezahlen: `ceil(distance)`, gezählte Kacheln, Zahl anderer Hütten.

## Schritte

- [ ] **Tests zuerst** in `levelChecks.test.ts`:
  - **AK-AL-24 (Zeilen):** Fischer-Beispiel aus R9 (g 2 → Stufe 3, Bürgerhaus Abstand 6, zwei andere Hütten in r 3, Stein 0, sonst genug): Zeilen-IDs in N3-Ordnung, `ok`/`have`/`need` wie R9-Bild, Fachkräfte-Text nennt `ceil(distance)`; erster ✗-Text = Fischgrund-Text N5.
  - Je Zeilenart ein ✓- und ein ✗-Text wörtlich nach N5 (Fachkräfte S2/S3 mit Abstand 6 und 11, ohne Haus, andere Insel; Wald, Gras, Gebirge, Fischgrund, Feuerwache inkl. Krisen aus, Brand); Zahl im Text = in der Testwelt gezählte Zahl.
  - Baustoffzeilen fehlen, wenn die Stufe den Baustoff nicht braucht (Holzfäller Stufe 2: keine Holzzeile).
  - **Review Focus 4:** Betrieb ohne `LEVELS` (Wohnhaus) und Jagdhütte mit `level` 3 → `levelChecks(…, g + 1)` liefert `[]`.
  - `levelChipText`: Fischer g 3 mit Siedlerhaus statt Bürgerhaus → «Läuft wie Stufe 2: Keine Meister im Umkreis 8 (Bürgerhaus nötig, nächstes …)»; k = g → `null`; `paused` → `null`; brennend → `null`. `levelChipDetail` listet bei g 3, k 1 die verletzten Zeilen der Stufen 2 und 3.
  - Reine Abfrage: `JSON.stringify(world)` vor/nach gleich.
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/levelChecks.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen** `levelChecks.ts` (Texte nur hier; Zahlen aus Defs/Welt).
- [ ] **Grün:** gleicher Lauf → 0; `npx vitest run tests/sim/levelRules.test.ts tests/sim/imports.test.ts; echo EXIT=$?` → 0.
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `feat: Ausbau-Checkliste aus der Sim (AUSBAU-LOGIK T03)`.
