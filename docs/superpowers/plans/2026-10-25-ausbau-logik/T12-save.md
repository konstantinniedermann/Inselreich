# T12 AL-4 Save: Stufe 4 gültig, Versionsschritt (Variante A)

Persona `tech-sim-engineer` · Strang A2 · Tools ≈ 45 · AK-AL-35, AK-AL-36 · blocked-by T11.

Spec: «Save-Wirkung und Migration», Anhang 02 N1, AK-AL-35/36; Plan P-1 (Variante A). Verfassung §3: ein inkompatibler Stand wird mit Hinweis abgewiesen, nie ein Absturz.

**Files:** Modify `src/sim/save.ts` (42 KB, nur abschnittsweise: `rg -n "SAVE_VERSION|migrateV|level !== 2|isUnlockList|deserialize" src/sim/save.ts`); Create `tests/sim/save-ausbau.test.ts` (nicht `save.test.ts` vergrössern, 86 KB).

**Interfaces:**

```ts
export const SAVE_VERSION = <main-Wert + 1>;      // Zahl in T12 = Wert auf main zu Taskbeginn + 1; Nachzug T18
export function migrateV<n>ToV<n+1>(raw: Record<string, unknown>): void; // nur raw.version = <n+1>; Kommentar «AUSBAU-LOGIK: Inhalt unverändert (Plan P-1)»
// Ladeprüfung: b.level undefined oder 2 ≤ level ≤ 1 + LEVELS[defId].length (nur bei LEVELS-Eintrag); 'U7' über UNLOCK_IDS gültig
```

Eintrag in `deserialize`: `if (raw.version === <n>) migrateV<n>ToV<n+1>(raw);` direkt vor der Versionsprüfung, hinter allen vorhandenen Schritten.

## Schritte

- [ ] `rg -n "SAVE_VERSION =" src/sim/save.ts` und `git log -1 --format=%h main -- src/sim/save.ts` ins Ledger (Ausgangsnummer n).
- [ ] **Tests zuerst** in `save-ausbau.test.ts`, nur über `SAVE_VERSION`, `SAVE_VERSION - 1`, `SAVE_VERSION + 1` (R909):
  - **AK-AL-35 (Variante A):** Welt mit drei Fischerhütten g 3 im Abstand 1 an gerader Küste, Bürgerhaus im Arbeitsweg; `raw = JSON.parse(serialize(w))`, `raw.version = SAVE_VERSION - 1`; `deserialize(JSON.stringify(raw))` → `ok`, `world.version === SAVE_VERSION`, Inhalt sonst gleich (Vergleich beider JSON ohne `version`), je Hütte `level` 3, `runningLevel` 1, erste ✗-Zeile von `levelChecks(…, 3)` = Fischgrund. Kein Wurf (`expect(() => …).not.toThrow()`).
  - **AK-AL-36:** Rundlauf mit Fischer `level` 4 und `world.unlocked` mit `'U7'` erhält beides. Abgewiesen mit `ok: false` und ohne Wurf: `version: SAVE_VERSION + 1` → «Unbekannte Version»; `hunter` mit `level` 4, Fischer mit `level` 5, Wohnhaus mit `level` 4, `unlocked` mit `'U8'` → «Beschädigter Spielstand».
  - Bestehender Stand mit Kaufmannshaus ohne U7 (aus `SAVE_VERSION - 1` erzeugt): nach dem Laden und einem `step` ist U7 frei, Meldung genau einmal (Spec «Save-Wirkung», letzter Punkt).
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/save-ausbau.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen:** `SAVE_VERSION` + 1, Migrationsschritt, Ladeprüfung `level` über `LEVELS[defId].length`.
- [ ] **Grün:** `npx vitest run tests/sim/save-ausbau.test.ts; echo EXIT=$?` → 0; `npx vitest related --run src/sim/save.ts; echo EXIT=$?` → 0 (alte Versionstests, die `SAVE_VERSION` als Zahl erwarten, melden; nicht stillschweigend ändern — nur relativ formulieren, Ledger).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `feat: Spielstand mit Ausbau Stufe 4, Versionsschritt ohne Inhaltsänderung (AUSBAU-LOGIK T12)`.
