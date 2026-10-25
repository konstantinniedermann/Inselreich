# T14 · Nachzug Stadtplanung: `git merge main`, Save-Nummer, Abschlusslauf

Umsetzer `tech-sim-engineer` · ≈ 35 Tools · AK-IP-11 (Nummer), AK-IP-13 (Lauf), AK-IP-01 (Pin-Prüfung) · blocked-by: **Stadtplanung auf main**, T13 ·
Worktree `.worktrees/inselproben` (`feat/inselproben`) · Plan P-1, R874 E-A

## Zweck

Die Save-Nummer steht erst beim Merge fest («main beim Merge + 1»). Nach dem Stadtplanung-Merge (v19) wird Inselproben v20. Steht beim Start von T14 ein
weiteres Save-Paket auf main, gilt dieselbe Regel mit dessen Nummer.

## Dateien

- ändern: `src/sim/save.ts` (`SAVE_V_CHALLENGE`, Kette), `src/sim/types.ts` und `src/sim/world.ts` (Literal `version`), `tests/sim/helpers.ts` (Faltschritte),
  `tests/sim/challengePins.ts` (nur falls Prüfung unten es verlangt), Merge-Konflikte in Dateien von T01–T11
- nicht ändern: `tests/sim/balance*.test.ts`

## Steps

- [ ] `git worktree list`; im Worktree `git merge main` (kein Rebase). Konflikte lösen: Kette in `deserialize` = alle Migrationen von main, danach
      `if (raw.version === SAVE_V_CHALLENGE - 1) migrateToChallenge(raw);` als letzte Zeile; `SAVE_V_CHALLENGE` = SAVE_VERSION von main + 1;
      `SAVE_VERSION = SAVE_V_CHALLENGE`; Literal `version` in `types.ts`/`world.ts` gleich. Faltschritte: `foldBackChallenge` bleibt äusserster Schritt, die
      Helfer von main (z. B. `foldBackStadt`) folgen innen; `foldBackToV13` ruft weiter `dropChallenge`.
- [ ] **Pin-Prüfung AK-IP-01:** Im temporären Worktree von main (nicht im Hauptcheckout) die Step-0-Rechnung aus T01 wiederholen. Gleich den Pins → nichts
      ändern. Verschieden → Ursache ist main (Stadtplanung), nicht Inselproben: Pins auf den main-Wert setzen, Kommentar «Messwert main {hash} nach Stadtplanung»,
      im Bericht beide Werte.
- [ ] **Lauf:** `npx vitest run tests/sim/challenge.test.ts tests/sim/challenge-mirror.test.ts tests/sim/save.test.ts tests/sim/trial-save.test.ts tests/sim/helpers.test.ts tests/sim/farOrder-save.test.ts tests/sim/save-loyalty.test.ts; echo EXIT=$?` → 0
      (AK-IP-11 b/d laufen gegen die neue Nummer, ohne Zahl im Test).
- [ ] **Abschluss (Index):** `make check; echo EXIT=$?` bei freier Sperre → 0; `git diff main -- tests/sim/balance*.test.ts` leer (AK-IP-13); A/B gegen T00.
- [ ] **Commit:** `fix: Inselproben-Save nach Stadtplanung als main + 1 (Inselproben T14)` (Merge-Commit separat).

## Task-Review

Prüfen: genau eine Migration auf `SAVE_V_CHALLENGE`, Kette lückenlos; keine Zahl in Tests; Pins nur mit Beleg geändert; `make check` Exit 0 im Bericht.
Danach Final-Review (`lead-qa`, opus) über `git diff main...feat/inselproben`.
