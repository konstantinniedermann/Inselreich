# T04 `aufstieg.ts` (Strang R, `art-rendering-engineer`)

AK: B1, B4, B7, B8. Neu: `src/render/aufstieg.ts`, `tests/render/aufstieg.test.ts`; ändern: `src/render/limits.ts` (+ `tests/render/limits.test.ts` falls CAPS gepinnt). blocked-by T00. Kein `Math.random`, kein DOM, keine Welt-Schreibzugriffe.

1. `limits.ts`: in `CAPS` `riseGlow: [6, 6]`, `riseSparks: [8, 0]` (Darstellungswerte, Kommentar «Funkeln I-118»). Zeilen ans Ende des Objekts, um Konflikte mit ORT-A (`ortsrand`) klein zu halten.
2. `aufstieg.ts` exportiert:
   - `interface Rise { id: number; startMs: number; tier: number }`, `RISE_MS = 1500`.
   - `detectRises(prev: ReadonlyMap<number, number>, buildings: readonly Building[], nowMs: number): { next: Map<number, number>; started: Rise[] }`: Aufstieg = `b.house.tier` (Zahl der Stufe, ggf. `TIER_IDS`-Index) strikt grösser als `prev.get(b.id)`; neue Id, gleiche Stufe, Abstieg → kein Eintrag; `prev.size === 0` → leere `started` (nur Stand merken); `next` enthält genau die aktuellen Haus-Ids. Die Gebäudeliste wird nur gelesen.
   - `pickRises(active: readonly Rise[], nowMs: number, cap: number): Rise[]`: verwirft abgelaufene (`nowMs - startMs >= RISE_MS` oder < 0), behält die `cap` jüngsten (älteste fallen zuerst); verworfene rücken nie nach.
3. Tests zuerst (rot): B1 (1→2 genau ein Eintrag; gleich, 3→2, neue Id nichts; leere Map nichts; abgerissene fehlen in `next`), B4 (9 gleichzeitige → 6 jüngste, die 3 ältesten fehlen; nach Ablauf eines Effekts kein Nachrücken), B7 (leere Map mit Welt höherer Stufen → keine Effekte), B8 (`Object.freeze` tief auf Gebäudeliste, kein Wurf). Tier-Typ vorher mit `rg -n "type Tier" src/sim/types.ts` klären.
4. Prüfen: `npx vitest run tests/render; echo EXIT=$?`, Lint. Commit `feat: Aufstiegs-Erkennung (I-118)`.
