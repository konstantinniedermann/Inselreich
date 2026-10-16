# T19 · Klangereignis «Denkmal fertig» (Glocke) und Dev-Zähler (TDD)

Strang art · Worktree `.worktrees/m13-e2-art` · Umsetzer `art-audio-engineer` (sonnet) · Controller `lead-art`
(nimmt die Klangfigur ab) · Vorarbeit für AK-M13E2-33 (Glocken-Ereignis, Abnahme T13) und AK-M13E2-44 (Browser, T16)
· blocked-by T08 (ein Arbeiter je Baum; fachlich unabhängig vom Sim-Strang) · Grösse S (≈ 18 Tools) · R507 (E3/QA-B4,
QA-B1), Roster-Ownership `src/audio/`

**Zweck:** Spec U-12 verlangt die bestehende Glocke `public/audio/sfx/bell.mp3` als Klangereignis beim Übergang
`monumentDone` false → true. Dieselbe Datei spielt heute der Krisenalarm (`alarm`). Die neue Klangfigur muss sich
**hörbar vom Alarm unterscheiden**; kein neues Asset.

**Files:**

- Modify: `src/audio/sound.ts` (`SoundEvent` + `'monumentDone'`, Klangfigur, Drossel, Pegel, Ereigniszähler in
  `AudioDebugState`), `src/audio/manifest.ts` (`SFX_FILES.monumentDone = 'audio/sfx/bell.mp3'`),
  `tests/audio/sound.test.ts` (nur ergänzen)
- Lesen: `alarm` in `sound.ts` (Rezept, `THROTTLE_MS`, Pegel, Figurende), `SFX_FILES`, `AudioDebugState`,
  `startAudioProbe` in `src/ui/devProbes.ts` (spiegelt `debugState()` nach `window.__inselAudio`), Fake-`AudioContext`
  in `tests/audio/`.

## Schnittstelle

```ts
// src/audio/sound.ts
export type SoundEvent = … | 'monumentDone';
export interface AudioDebugState {
  …;
  /** Zahl der gespielten Ereignisse je Art seit Start (Dev-Zähler, QA-B1); nur gezählt, nie zurückgesetzt. */
  events: Partial<Record<SoundEvent, number>>;
}
```

- **Klangfigur `monumentDone`:** Sample `bell.mp3`, aber eine andere Figur als `alarm`, z. B. zwei bis drei feierliche
  Schläge mit tieferer Abspielrate und längerem Ausklang, ohne die Alarm-Wiederholung; Bus «Signale» wie `win`. Der
  synthetische Rückfall (ohne Datei) ist ebenfalls vom Alarm-Rückfall verschieden. Drossel so, dass ein zweites Ereignis
  innerhalb der Figur nicht doppelt spielt.
- **Unterscheidbarkeit prüfbar:** Rezept-Parameter (Rate, Zahl der Schläge, Abstand, Hüllkurve) unterscheiden sich in
  mindestens zwei Grössen von `alarm`; der Test vergleicht die aufgezeichneten Knoten-Aufrufe beider Ereignisse.
- **Dev-Zähler:** jedes tatsächlich gespielte Ereignis erhöht `events[e]`; `debugState()` liefert eine Kopie. Damit
  liest der Browser-Lauf T16 `window.__inselAudio.events.monumentDone` (genau 1 nach dem Wahlziel, nach Laden
  unverändert). Kein Import aus `src/sim/` oder `src/ui/`.

## Schritte

- [ ] **Schritt 0:** `grep -n "alarm\|THROTTLE_MS\|debugState\|AudioDebugState" src/audio/sound.ts`;
      `grep -n "SFX_FILES" -A6 src/audio/manifest.ts`.
- [ ] **Schritt 1: Test zuerst (rot)** in `tests/audio/sound.test.ts`: (1) `play('monumentDone')` erzeugt
      Knoten-Aufrufe, die sich von `play('alarm')` unterscheiden (mindestens zwei Rezept-Grössen); (2) mit Sample und
      ohne Sample (Rückfall) spielt etwas; (3) `debugState().events.monumentDone` ist nach einem Abspielen 1, nach einem
      gedrosselten zweiten Aufruf innerhalb der Figur weiter 1; `alarm` zählt getrennt; (4) `SFX_FILES.monumentDone`
      zeigt auf `audio/sfx/bell.mp3`.

```bash
npx vitest run tests/audio/sound.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen.**

```bash
npx vitest run tests/audio/sound.test.ts tests/audio/buildSounds.test.ts tests/audio/economySounds.test.ts \
  tests/assets/assets.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

Asset-Prüfsummen bleiben unverändert (kein neues Asset).

- [ ] **Schritt 3: Hörprobe für `lead-art`:** kurze Anleitung im Bericht, wie beide Figuren im Dev-Build ausgelöst
      werden (Konsolenaufruf über die bestehende Dev-Schnittstelle, falls vorhanden; sonst Rezept-Parameter als
      Tabelle). `lead-art` nimmt die Figur ab (Ledger-Eintrag «Klangfigur abgenommen»), bevor der Hash an den UI-Strang
      geht.
- [ ] **Schritt 4: Commit.** `feat: Klangereignis Denkmal fertig mit eigener Glockenfigur, Dev-Zähler (M13-E2 T19)`.

## Bericht

Testnamen, Rot-Zeile, Exit-Codes, Rezept-Vergleich `alarm` / `monumentDone` (Tabelle), Bestätigung `grep -rn "from
'../sim\|from '../ui" src/audio` leer.
