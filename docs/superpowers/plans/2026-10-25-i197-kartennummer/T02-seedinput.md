# T02 `src/ui/seedInput.ts` (reine Funktionen)

Persona `tech-ui-engineer` · Tools ≈ 30 · AK-K1, AK-K5, AK-K12 · blocked-by T01.

Datei neu `src/ui/seedInput.ts` (DOM-frei, kein Import aus `src/sim/` ausser Typen nicht nötig), Test neu `tests/ui/seedInput.test.ts`. **Rot zuerst:** Test vor der Datei schreiben, Lauf `npx vitest run tests/ui/seedInput.test.ts; echo EXIT=$?` mit Exit ≠ 0 belegen.

```ts
export const SEED_MAX = 99_999_949; // 8 Stellen; seedUsed (+49) bleibt ≤ 99_999_998
export function parseSeedInput(
  raw: string,
): { ok: true; seed: number | null } | { ok: false; reason: string };
export function pickSeed(seed: number | undefined, now: number): number; // seed ?? now % 100000
export function seedNote(requested: number, used: number): string | null; // null wenn gleich
```

- **AK-K1** `parseSeedInput`: `''`, `'  '` → `{ok:true, seed:null}`; `'0'` → 0; `'00042'` → 42; `' 4711\n'` → 4711; `'99999949'` → 99999949. Ungültig mit nicht leerem `reason`, der `reason` ist genau «Kartennummer: ganze Zahl von 0 bis 99999949, oder leer für Zufall.»: `'99999950'`, `'100000000'`, `'-1'`, `'1.5'`, `'12a'`, `'1e3'`, `'１２'`, `'9'.repeat(30)`. Regex `/^\d{1,8}$/` mit ASCII-Ziffern (`[0-9]`, nicht `\d` mit Unicode-Flag), danach Grenze `<= SEED_MAX`.
- **AK-K5 (B3)** `pickSeed(0, 123456) === 0`; `pickSeed(undefined, 123456) === 23456`; `pickSeed(4711, 5) === 4711`. Nur diese Funktion ist der Ort der `??`-Regel; `||` ist verboten.
- **AK-K12 (neu, B3)** `seedNote(4711, 4712)` enthält `Karte 4711` und `genutzt: 4712` (Text «Karte 4711 nicht bebaubar, genutzt: 4712»); `seedNote(4711, 4711) === null`.

Keine Uhr im Test (`now` ist Parameter).
