# T02 Motor: Glättung, Wind, Fake-Context (Strang A, `art-audio-engineer`)

AK: A5. Dateien: `src/audio/ambience.ts`, `tests/audio/ambience.test.ts`. blocked-by T01.

1. Im Schichtenmotor (`setAmbience`, `ambience.ts` ~525) Zustand `smoothedShare?: number` und `lastAmbienceT?: number` (Audio-Uhr `ctx.currentTime`, nicht Spielzeit). Beim Aufruf: `dtS = now - lastAmbienceT`; `smoothedShare = smoothShare(smoothedShare, view.suppliedShare, dtS)` nur wenn `suppliedShare` endlich, sonst Zustand löschen (Ansicht ohne Häuser = heute). Gemittelter Wert ersetzt `view.suppliedShare` vor `ambienceMix`.
2. Pause und Spielgeschwindigkeit ändern nichts: der 250-ms-Takt der UI läuft weiter, die Mittelung hängt nur an der Audio-Uhr.
3. Gleiten bleibt wie bestehend (`setTargetAtTime(..., GLIDE_S / 3)`), keine neue harte Stufe. Hammerschläge (`HAMMER_TOWN_MIN`) bleiben am `town`-Ziel `z`.
4. Test A5 mit Fake-`AudioContext` (Bestand der Datei nutzen): Share 1 dann 0,2 → `town`-Gain-Ziel per `setTargetAtTime` mit Zeitkonstante `GLIDE_S / 3`, nie `value =`-Sprung; kaputte Eingabe (`suppliedShare: NaN`, `houses: undefined`) wirft nicht; Ton aus/Bus 0 ohne Sonderpfad.
5. Prüfen: `npx vitest run tests/audio; echo EXIT=$?`, Lint, `rg` auf neue Importe aus `sim/`/`ui/` (kein Treffer). Commit `feat: Wohlstandsklang Motor (I-120)`.
