# T05 AL-2b Ausbau verlangt Bedingungen (eine Prüfreihenfolge)

Persona `tech-sim-engineer` · Strang A · Tools ≈ 55 · AK-AL-04 (ohne Teil 4), 18, 21, 24 (Vergleich, Plan P-7), 37 (Sim-Teil) · blocked-by T04.

Spec: R7, Anhang 02 N3 (Baustofftexte «Zu wenig Stein (0 / 2)»), AK-AL-04/18/21/24/37.

**Files:** Modify `src/sim/upgrade.ts`, `src/sim/levelChecks.ts` (nur falls nötig), `tests/sim/upgrade.test.ts`, `tests/sim/levelChecks.test.ts`; Bestandstests mit alten Texten nach Bedarf: `tests/ui/panelView.test.ts`, `tests/ui/inspect.test.ts`, `tests/ui/hints.test.ts`, `tests/ui/balancePreview.test.ts` (nur erwartete Texte, keine Logik).

**Interfaces:**

```ts
export function upgradeBuilding(world: World, id: number): Result;
// 1 «Gebäude nicht gefunden» · 2 «Kann nicht ausgebaut werden» · 3 «Höchste Stufe erreicht» (g = 1 + LEVELS.length)
// ab 4: erste ✗-Zeile von levelChecks(world, b, g + 1) → fail(text); sonst pay + takeStock(extra), b.level = g + 1
```

`checkAfford` bleibt für Neubauten unverändert; im Ausbau ersetzt die Baustoffzeile von `levelChecks` dessen Text. Kein zweiter Prüfweg: `upgradeBuilding` prüft ab Schritt 4 nichts selbst. `b.level`-Typ bleibt `2 | 3` bis T11; die Höchststufe kommt aus `LEVELS[defId].length`.

## Schritte

- [ ] **Tests zuerst** in `upgrade.test.ts`:
  - **AK-AL-04 (ohne Teil 4):** je Schritt 1–9 von R7 eine Welt, in der genau dieser Schritt als erster scheitert → erwarteter Text, `JSON.stringify(world)` vor/nach gleich (Ware-Text «Zu wenig Stoff (1 / 2)», Baustoff «Zu wenig Stein (0 / 2)»). Zweiter Satz von AK-04 (Plan P-14): Wegen Monotonie und N = 1 gibt es keine Welt mit k < g und erfüllter Zielstufe. Geprüft wird die Absicht «ein gedrosselter Betrieb wartet nicht auf eine Neuberechnung»: Fischer g 2, k 1 (zweiter Nachbar in d ≤ 2), Nachbar abreissen → im selben Tick `runningLevel` 2 und `upgradeBuilding` 2 → 3 `ok` (Stufe-3-Bedingungen erfüllt); dazu ein Strukturtest: `upgrade.ts` ruft `runningLevel` nicht auf.
  - **AK-AL-18** brennender Betrieb → «Gebäude brennt», Welt unverändert.
  - **AK-AL-21** Steinbruch auf Kolonie ohne Wohnhaus (`twoIslandWorld`) → «Keine Handwerker im Umkreis 8 (kein Siedlerhaus auf dieser Insel)»; Kontor auf der Insel ändert nichts.
  - **AK-AL-37 (Sim):** vier Welten mit je ≥ 2 verletzten Bedingungen (Fachkräfte + Geld, Standort + Ware, Brand + Fachkräfte, Wissen + Stein) → `levelChecks(...).find(c => !c.ok)!.text === upgradeBuilding(...).reason`; Zeilenordnung N3. Tooltip-Teil: T07.
  - **AK-AL-24 (Vergleich)** in `levelChecks.test.ts`: je Zeile der R9-Welt: Welt so ändern, dass nur diese Zeile ✗ ist → `upgradeBuilding` scheitert mit genau diesem Text; alle ✓ → `ok`.
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/upgrade.test.ts tests/sim/levelChecks.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen** in `upgrade.ts`; Bestandstests mit alten Texten (`Zu wenig Stein` ohne Zahlen, `Zu wenig Stoff`) anpassen — nur Text, Ledger-Liste der geänderten Erwartungen.
- [ ] **Grün:** gleicher Lauf → 0; `npx vitest related --run src/sim/upgrade.ts src/sim/levelChecks.ts; echo EXIT=$?` → 0 bis auf `balance-upgrade.test.ts` (P-9, Ledger).
- [ ] **Balancing:** `npx vitest run tests/sim/balance.test.ts <Baseline-Liste T00>; echo EXIT=$?` → 0.
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `feat: Ausbau prüft Fachkräfte, Standort und Baustoff in einer Reihenfolge (AUSBAU-LOGIK T05)`. Hash an den Controller (Abzweig B und C).
