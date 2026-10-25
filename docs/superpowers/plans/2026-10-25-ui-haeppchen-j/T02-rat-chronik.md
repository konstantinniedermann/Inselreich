# T02 · P2 Ratsbeschluss in Chronik und Log (I-139)

Umsetzer `tech-ui-engineer` · ≈ 40 Tools · AK J4 bis J7 · blocked-by: T01 · Spec: Teil P2 (Regeln 1 bis 5)

## Dateien

- ändern: `src/ui/council.ts` (neu: `councilChronicleLine`, `councilDecided`, `councilDecidedEntries` neben `councilOpened`), `src/ui/inspect.ts` (`buildRest`/`updateRest`: Zeile `rest-council` nach `rest-trial`, `hidden` bei `null`), `src/ui/app.ts` (bei `prevCouncil` ≈ Z. 1002: `pushLog` und `nextUnread` wie bei den anderen Log-Quellen), `tests/ui/council.test.ts` (Ergänzung)
- nicht ändern: `src/sim/`, `autoLog.ts` (Kulanz ist schon da), Ladepfad/Autosave

## Verhalten

1. `councilChronicleLine(world): string | null` nach Spec Regel 1. **Texte (Auflage 4):** nur offen: `Rat: 1 Beschluss offen` bzw. `Rat: n Beschlüsse offen` (n ≥ 2); gefasst: `Rat: Webordnung · Wohnordnung` (Stufenfolge); gefasst plus offen: `Rat: Webordnung — 1 offen` (`— n offen`); `null` ohne Marke (`councilBadge === null`).
2. `councilDecided(prev, next): CouncilTier[]`: Stufen von `'open'` auf `'A'`/`'B'`; `prev === null` ergibt `[]`.
3. `councilDecidedEntries(prev, next, tick): LogEntry[]`: Text `Rat beschliesst: <Name>`, `toast: null`, `tick` durchgereicht, kein `target`. `LogEntry`-Form aus `autoLog.ts`/`crisisLog.ts` übernehmen.
4. `app.ts`: dort, wo `councilOpened(prevCouncil, …)` steht, zusätzlich `councilDecidedEntries(prevCouncil, world.council, world.tick)` in den Ereignis-Log. `prevCouncil` wird dort schon auf den neuen Stand gesetzt; Laden und «Neue Insel» setzen es auf den geladenen Stand (nicht ändern, nur prüfen).

## Testfälle (rot zuerst)

- AK-J4: ohne Marke `null`; nur offen `Rat: 1 Beschluss offen`; zwei offen `Rat: 2 Beschlüsse offen`; 2A `Rat: Webordnung`; 2A und 3B `Rat: Webordnung · Wohnordnung`; gefasst plus eine offen `Rat: Webordnung — 1 offen`. Namen aus `COUNCIL` lesen, nicht raten.
- AK-J5: `open → A` meldet die Stufe; `null → open` und `A → A` nicht; `prev === null` ergibt `[]`; **Mehrstufensprung** (Stufen 2 und 3 gleichzeitig `open → A/B`) meldet beide.
- AK-J6: Text `Rat beschliesst: Glockenrecht`, `toast === null`, `tick` durchgereicht, kein Ziel; **Mehrstufensprung ergibt zwei Einträge** in Stufenfolge (Auflage 5).
- AK-J7: Welt vor/nach den drei Funktionen `serialize`-gleich. Sim-Teil als Lauf (siehe Index).
- Keine `Contract`-Literale; Welt über vorhandene Test-Helfer bauen.

## Prüfungen

`npx vitest run tests/ui/council.test.ts; echo EXIT=$?` (vorher rot), `npx tsc --noEmit; echo EXIT=$?`, eslint, prettier. Commit `feat: Ratsbeschluss in Chronik und Ereignis-Log (I-139)`.
