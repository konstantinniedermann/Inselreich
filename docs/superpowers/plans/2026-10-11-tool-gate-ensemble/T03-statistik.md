# T03 — Statistik und Tabelle (GE-4, GE-5)

**Dateien:** `tests/sim/ensemble.ts` (neu), `tests/sim/ensemble.test.ts`.

API (rein, ohne `expect`, ohne `vitest`-Import, damit auch ein Skript sie nutzen kann):

```ts
export const PHASES = [0, 20, 40, 60, 80] as const;
export interface Summary {
  median: number;
  min: number;
  max: number;
  spread: number;
  n: number;
}
export function summarize(values: readonly number[]): Summary; // gerade n: Mittel der zwei mittleren Werte
export interface Limit {
  name: string;
  lo?: number;
  hi?: number;
} // Grenze, beidseitig oder einseitig
export interface Row {
  limit: Limit;
  s: Summary;
  held: number;
  verdict: 'OK' | 'AUSREISSER' | 'GERISSEN';
}
export function judge(limit: Limit, values: readonly number[]): Row; // OK: alle innerhalb; AUSREISSER: Median innerhalb, mind. einer ausserhalb; GERISSEN: Median ausserhalb
export function formatTable(rows: readonly Row[]): string; // Spalten: Grenze | Median | Min | Max | Spannweite | gehalten k/n | Urteil
export function runEnsemble<T>(measure: (phase: number) => T, phases?: readonly number[]): T[]; // seriell, Reihenfolge = phases
```

- [ ] **Schritt 1: Tests zuerst** (je Fall ein Rot-Beleg): `summarize` ungerade und gerade Anzahl, ein Wert (Spannweite 0), unsortierte Eingabe bleibt unverändert; `judge` OK / AUSREISSER / GERISSEN mit einseitiger und beidseitiger Grenze; `formatTable` enthält `AUSREISSER` und `k/n`; `runEnsemble` ruft `measure` je Phase genau einmal in Reihenfolge; leere Eingabe wirft einen sprechenden Fehler (Werkzeug, keine Sim-Aktion).
- [ ] **Schritt 2: Rot-Beleg** je Fall: `npx vitest run tests/sim/ensemble.test.ts; echo EXIT=$?` → `EXIT=1`, Fehlermeldung nennt den fehlenden Export bzw. die falsche Zahl.
- [ ] **Schritt 3: Umsetzung** wie oben, kein Gleitkomma-Runden in `summarize` (Rundung nur in `formatTable`, 1 Nachkommastelle, Prozentwerte 2).
- [ ] **Schritt 4: Grün,** `EXIT=0`. Laufzeit des Unit-Teils < 50 ms (Teil von `make check`).
- [ ] **Schritt 5: Commit** `test: Ensemble-Statistik und Tabelle (TOOL-GATE-ENSEMBLE T03)`.
