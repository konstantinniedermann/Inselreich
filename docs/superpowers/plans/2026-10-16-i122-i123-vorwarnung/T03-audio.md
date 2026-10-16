# T03 · Klang `contractWarn`

`art-audio-engineer` · Worktree `.worktrees/i122-audio` · ≈ 20 Tools · AK-W10 · blocked-by: T00 · Test zuerst (Rot-Beleg)

Dateien: `src/audio/sound.ts`, `tests/audio/contractWarn.test.ts` (neu). `src/audio/` importiert nichts aus `src/sim/` oder `src/ui/`; kein Asset, kein `manifest.ts`-Eintrag, kein `FIGURE_S`-Eintrag (kein Ducking).

## Umsetzung

1. `SoundEvent` um `'contractWarn'` erweitern; `figures` (ist `Record<SoundEvent, …>`, `tsc` erzwingt den Eintrag) bekommt `contractWarn`: zwei kurze, leise Töne (z. B. `tone(A5, 0, 0.12, 0.18, 'sine')`, `tone(D5, 0.14, 0.2, 0.18, 'sine')`), Pegel unter `order` (0,35) und `error` (0,5), ruhig.
2. `THROTTLE_MS.contractWarn = 2000` (Mehrfachauslösung ausgeschlossen, Spiegel zu `alarm`).
3. Klangdesign innerhalb dieser Vorgaben frei; Änderung am Pegel gegenüber den Vorgaben nur mit Notiz im Bericht.

## Tests (`contractWarn.test.ts`, Fake-`AudioContext` wie `tests/audio/sound.test.ts`)

AK-W10 `play('contractWarn')` löst genau einen Ton-Satz aus (Zahl der Oszillatoren = 2), zweiter Aufruf innerhalb 2000 ms wird gedrosselt; stumm geschaltet wirft nicht und erzeugt nichts; `rg -n "from '\.\./(sim|ui)" src/audio/sound.ts` ohne Treffer (Importgrenzen-Test, falls `tests/audio/` einen hat, dort ergänzen statt neu).

## Prüfschritte

`npx vitest run tests/audio; echo EXIT=$?` · `npx tsc --noEmit; echo EXIT=$?` (zeigt fehlende `Record`-Einträge anderer Dateien, z. B. `devParams`) · `make lint; echo EXIT=$?` · `make conflicts; echo EXIT=$?`. Commit `feat: Klang contractWarn (I-122)`.
