# T02 · Save v12: Weltfelder, Migration, Ladeprüfung V1–V9, `foldBackToV11` (TDD)

Strang sim · Worktree `.worktrees/m13-e2-sim` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M13E2-01, -17, -22,
-23, -24, -25, -26 (Spec §9, Anhang 02 A–F) · blocked-by T01 · Grösse M (≈ 35 Tools) · Auflage A6, qa B9a

**Zweck:** Versionssprung **atomar in einem Commit** (Felder, Version, Migration, Prüfung, Rückfaltung); sonst sind
Rundlauf und Hash-Pins zwischen zwei Commits rot (Muster M13-E1 T02).

**Files:**

- Create: `tests/sim/save-v12.test.ts`
- Modify: `src/sim/types.ts` (`World.monument: Monument | null`, `World.monumentDone: boolean`, `World.version:
12`), `src/sim/world.ts` (`createWorld`: beide Felder **am Ende** nach `edictLockedUntil`), `src/sim/save.ts`
  (`SAVE_VERSION = 12`, `migrateV11ToV12`, `isValidV12Fields` in `isWellFormed` nach `isValidV11Fields`),
  `tests/sim/helpers.ts` (nur `foldBackToV11`, `V11_WORLD_KEYS`, `V11_ISLAND_KEYS`, Ketten in `foldBackToV10`/`V9`),
  `tests/sim/save.test.ts` und `tests/sim/save-v11.test.ts` (**nur mechanisch**, Schritt 5),
  `tests/ui/storage.test.ts` (nur falls dort eine Versionszahl 11 steht)
- Lesen: Anhang 02 vollständig (A–F), `migrateV10ToV11`, `isValidV11Fields`, `foldBackToV10`/`foldBackToV9`.

## Regeln (Anhang 02)

- **Gemeinsame v12 (R505):** I-049 und I-048 erweitern später genau diese `migrateV11ToV12` und `isValidV12Fields`
  um ihre Schlüssel; deshalb je Schlüssel eine eigene, klar benannte Teilprüfung (z. B. `isValidMonumentFields`), keine
  Sammelbedingung.

- **Migration B:** fehlt `monument` → `null`, fehlt `monumentDone` → `false`, `version = 12`; vorhandene Werte bleiben
  und gehen in die Prüfung. Läuft nach `migrateV10ToV11`, wirft nie. Kette v1 … v12.
- **Prüfung C, V1–V9** genau nach Tabelle; Verstoss → `{ ok: false, reason: 'Beschädigter Spielstand' }`.
  **A6:** V4 «`delivered[g] ≤ MONUMENT_STAGES[stage].goods[g]`» nur bei `running && stage < 3`; `stage === 3` wird
  vorher durch V3/V6 begrenzt (`MONUMENT_STAGES[3]` ist `undefined`, kein Zugriff). Bewusst **nicht** geprüft: laufend
  mit allen Resten 0; `monumentDone` mit `stage < 3`.
- `version > 12` → `'Unbekannte Version'`; kein JSON → `'Ungültiges Format'` (bestehender Pfad, nur Grenze anpassen).
- **Rückfaltung D:** `foldBackToV11(v12)`: (1) Weltschlüssel ausserhalb `V11_WORLD_KEYS` ∪ {`monument`,
  `monumentDone`} **entfernen, ohne Umordnen**; (2)/(3) `monument !== null`, `monumentDone !== false` oder ein
  Gebäude `defId === 'monument'` → `throw new Error('foldBackToV11: Denkmal nicht rückfaltbar')`; (4) Inselschlüssel
  ausserhalb `V11_ISLAND_KEYS` entfernen, ohne Umordnen; (5) Ausgabe ohne `monument`, `monumentDone`, mit `version:
11`, sonst unverändert. Einbindung: `foldBackToV10(x)` ruft bei `x.version === 12` zuerst `foldBackToV11`;
  `foldBackToV9` faltet bei `version >= 11` über `foldBackToV10`. Aufrufer (`balance-crises`, `save`, `goal3`,
  `seaGolden`, `edicts`) bleiben unverändert.
- `V11_WORLD_KEYS`/`V11_ISLAND_KEYS` aus dem heutigen Code ableiten (Schlüssel von `createWorld(3)` bzw. einer Insel
  vor T02), als Literal-Liste in `helpers.ts`, mit Kommentar «Stand v11, nicht erweitern».

## Schritte

- [ ] **Schritt 0:** `grep -n "SAVE_VERSION\|migrateV10ToV11\|isValidV11Fields\|isWellFormed" src/sim/save.ts`;
      `grep -rn "toBe(11)\|SAVE_VERSION + 1\|version: 12" tests/sim/save*.test.ts tests/ui/storage.test.ts`.
- [ ] **Schritt 1: Test zuerst (rot)** in `tests/sim/save-v12.test.ts`, je AK ein `it` mit AK-ID im Namen:
  - **AK-01:** `createWorld(3)`: `monument null`, `monumentDone false`, `Object.keys(w).slice(-2)` =
    `['monument', 'monumentDone']`, `version 12`, `SAVE_VERSION 12`.
  - **AK-22 (Helfertest):** v12 ohne Denkmal → `foldBackToV11` ohne die zwei Schlüssel, `Object.keys` =
    `V11_WORLD_KEYS` in dieser Reihenfolge, `JSON.stringify` gleich der Eingabe ohne die zwei Schlüssel mit
    `version: 11` (der eigentliche Bitgleichheits-Beweis sind die unveränderten Hash-Pins, Schritt 4); Insel mit Zusatz `reserve: { wood: 0, stone:
0 }` und Welt mit `buyPct` (alle 100) **am Ende** → dieselbe Form; Insel mit abweichender Schlüsselfolge behält
    ihre Folge; `monument` gesetzt, `monumentDone true`, Gebäude `monument` → wirft. Dazu: alle bestehenden Hash-Pins
    grün ohne Pin-Änderung (Lauf in Schritt 4).
  - **AK-23:** Rundlauf Anhang 02 F (Denkmal `stage 1`, `running`, `delivered { stone 37, tools 0, glass 12, spice
5 }`, `paused true`, `buy.glass true`) → ok, `toEqual`. Denkmal per `placeBuilding(w, 'monument', …)` an
    `MONUMENT_AT` (Kosten gutschreiben), dann `w.monument` **im Test von Hand** setzen (R1.4 kommt in T03).
  - **AK-24:** v11-Stand mit `wonMerchants true` (über `foldBackToV11(JSON.parse(serialize(w)))`) und die v1 … v10-
    Fixtures → ok, `version 12`, `monument null`, `monumentDone false`.
  - **AK-17:** derselbe v11-Stand: nach `deserialize` ist `canPlace(w, 'monument', MONUMENT_AT…)` ok.
  - **AK-25a–k:** je Zeile der Tabelle F ein `it.each`-Fall, genau das genannte Ergebnis; 25k: `running`, alle Reste 0
    → ok, nach einem `step` … erst mit T05 erfüllbar: hier nur «lädt ok» prüfen, der `step`-Teil steht als
    `it.todo('AK-25k step → T05')` und wird in T05 eingelöst (Ledger).
  - **AK-25 A6 (eigenes `it`):** `stage 3` mit `running true` → `'Beschädigter Spielstand'`, kein Wurf (kein Zugriff
    auf `MONUMENT_STAGES[3]`); `stage 3`, `running false`, `monumentDone true`, `delivered` alle 0 → ok.
  - **AK-26:** `version: SAVE_VERSION + 1` (nie die feste Zahl 13, QA-B5; bleibt mit I-049/I-048 auf v12 richtig) →
    `'Unbekannte Version'`, Text `{"version": 12` → `'Ungültiges Format'`, kein Wurf;
    `friendlyReason` beider Gründe nicht leer.

```bash
npx vitest run tests/sim/save-v12.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen** (Typen, `createWorld`, `save.ts`, `helpers.ts`).
- [ ] **Schritt 3: Typ-Folgen.** `npx tsc --noEmit; echo EXIT=$?` — Stellen, die `World` literal bauen, bekommen die
      zwei Felder (nur Tests/Helfer; `src/ui/` sollte nicht betroffen sein, sonst Ledger-Eintrag).
- [ ] **Schritt 4: Pins und Kette.**

```bash
npx vitest run tests/sim/save-v12.test.ts tests/sim/save.test.ts tests/sim/save-v11.test.ts tests/sim/seaGolden.test.ts \
  tests/sim/goal3.test.ts tests/sim/balance-crises.test.ts tests/sim/edicts.test.ts tests/sim/scenario-saves.test.ts \
  tests/ui/storage.test.ts tests/ui/hints.test.ts; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 5: Mechanische Anpassungen (qa B9a), je Zeile ein Ledger-Eintrag** (Datei:Zeile, alt → neu,
      «kein Erwartungswert geändert»): Versionszeilen 11 → 12 in `save.test.ts` und `save-v11.test.ts`; AK-M13E1-01
      prüft die Folge vor den Denkmal-Schlüsseln (`slice(-4, -2)`); AK-M13E1-26 und -41 nutzen `SAVE_VERSION + 1` statt 12. Jede andere Änderung an bestehenden Tests ist verboten; ein roter Pin heisst Stopp und Meldung.
- [ ] **Schritt 6: Commit.** `feat: Save v12 mit Denkmal-Feldern, Prüfung V1–V9, foldBackToV11 (M13-E2 T02)`.
      Danach fährt der **Controller** einmal `make test` (Versionssprung, R380-Sperre).

## Bericht

Testnamen, Rot-Zeile, Exit-Codes, Ledger-Liste der mechanischen Zeilen, `git diff -U0 main -- tests/sim/save.test.ts
tests/sim/save-v11.test.ts` (nur die genannten Zeilen), Bestätigung `CHAIN_HASHES`/`V6_FORMS` unberührt.
