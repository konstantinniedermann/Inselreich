# T17 · Final-Review `opus` M13-E2-SIM (Gate Merge SIM)

Rolle `qa-code-reviewer` · Modell **opus** (Kopfzeile `Modell: opus (Final-Review M13-E2-SIM)`) · gestartet von
`lead-qa` (Budget lead-qa 1) · AK-M13E2-01 … -26, -49 · blocked-by T07 und «bereit fürs Final-Review SIM» von
Controller B

**Gegenstand:** `feat/m13-e2-sim` gegen `main`. Diff **je Datei** lesen (`git diff main...feat/m13-e2-sim --stat`,
dann je Datei). Erwartete Dateien: Ownership T01–T07 im [Index](../2026-10-11-m13-e2-denkmal.md) plus die
Platzhalter aus dem T01-Ledger; jede weitere Datei ist ein Befund. Grund: SIM mergt vor ART/UI, damit I-049 starten
kann (R481); danach darf I-048 frühestens mergen (R489).

## Prüfpunkte

1. **AK-Abdeckung:** je AK der Test aus [ak.md](ak.md) mit Rot-Beleg im Ledger `.superpowers/sdd/m13-e2-sim/ledger.md`;
   AK-25k `it.todo` eingelöst; fehlt ein Beleg → BEDENKEN.
2. **Baseline (AK-21), wörtlich (qa B9a):** Befehle B1 und B2 unten. B1 nennt nur `tests/sim/balance-monument.test.ts`
   (ggf. geteilte neue Dateien), B2 ist leer. `git diff -U0 main...feat/m13-e2-sim -- tests/sim/save.test.ts
tests/sim/save-v11.test.ts` zeigt nur die im Ledger gelisteten mechanischen Zeilen (Versionszahl, `slice(-4, -2)`,
   `SAVE_VERSION + 1`); `CHAIN_HASHES`, `V6_FORMS` unberührt; `git diff main...feat/m13-e2-sim -- src/sim/defs` nur
   Zusätze.
3. **Bitgleich ohne Denkmal:** `tickMonument` kehrt bei `null`/`!running` sofort zurück; kein RNG-Import in
   `monument.ts`, kein RNG-Aufruf in `buyMonumentUnit`; `monument` letzter Schlüssel in `BUILDING_DEFS`; `fireTarget`
   unverändert.
4. **Regeln:** Reserve ganzzahlig (A3), `monumentLock` liefert 0 mit Signatur für I-049; ein Zukaufweg in `trade.ts`,
   `buy()` unverändert; Tick-Platz direkt nach `tickEconomy`, letzte zwei Aufrufe `checkWin`, `tickUnlocks`; Aktionen
   werfen nie, ändern bei `ok: false` nichts.
5. **Save v12:** Migration wirft nie, lässt Werte stehen; V1–V9 vollständig, V4 nur bei `stage < 3` (A6);
   `foldBackToV11` ohne Umordnen, Kette `foldBackToV10`/`V9`; Abweisen `version 13` und abgeschnittener Text mit Grund.
6. **Module:** kein Importkreis (`monument.ts` ↛ `build.ts`/`placement.ts`; `trade.ts` ↛ `monument.ts`);
   `src/sim/` DOM-frei; Platzhalter in Render/Audio/UI nur die gelisteten.
7. **Seed-Läufe:** Festwerte gesetzt (kein `NaN`), Grenzen gegen Anhang 03 unverändert, Krisen aus in A und C,
   Laufzeiten unter `CI=true` ≤ 50 % des Timeouts; kein Eintrag in `ZEITTESTS`.
8. **Zeitvergleich (T00):** Controller-Messung main/Branch für die Sim-Dateien liegt vor; Ausreisser begründet.
9. **Prüfläufe** (selbst, gezielt, Befehl B3): `make check` Exit 0 laut Controller. Nie in eine Pipe; kein Lauf
   während eines Pushs.

```bash
# B1
git diff --stat main...feat/m13-e2-sim -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/seePins.ts; echo EXIT=$?
# B2
git diff --diff-filter=MDR --stat main...feat/m13-e2-sim -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/seePins.ts tests/sim/controller.ts tests/sim/merchantsController.ts; echo EXIT=$?
# B3
npx vitest run tests/sim/monument.test.ts tests/sim/save-v12.test.ts tests/sim/defs.test.ts tests/sim/balance.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
git merge-tree --write-tree main feat/m13-e2-sim; echo EXIT=$?
```

## Ausgabe

Urteil **OK / BEDENKEN / ZURÜCK**, Befunde mit Datei:Zeile, Schweregrad, Empfehlung; Befunde ausserhalb Scope als
Vorschlag für `docs/beobachtungen.md`. Der Schlussbericht ist der Report. Keinen Code ändern.
