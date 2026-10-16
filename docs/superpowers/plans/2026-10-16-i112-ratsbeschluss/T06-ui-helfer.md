# T06 · UI-Helfer, Taste, Hilfe

`tech-ui-engineer` · ≈ 30 Tools · AK 12, 13 · blocked-by: T03 · Strang U (`.worktrees/i112-ui`) · Test zuerst (rot vor Umsetzung)

Dateien: `src/ui/council.ts` (neu, DOM-frei), `tests/ui/council.test.ts` (neu), `src/ui/hotkeys.ts`. Liest nur `src/sim/council.ts` und `src/sim/defs/council.ts`.

## Umsetzung

1. `councilBadge(world): string | null`: `null`, solange alle Einträge `null` sind; bei n offenen `` `Rat · ${n}` ``; bei 0 offenen und ≥ 1
   gefasstem `'Rat'`. Dazu `councilBadgeActive(world): boolean` (n > 0, für die Hervorhebung).
2. `councilCards(world)`: `{ open: { tier, cards: [{ side, name, text }, { … }] }[]; decided: string[] }`; `open` aufsteigend nach Stufe,
   Texte aus `COUNCIL` (keine Zahl im UI-Code), `decided` als `'Stufe 2: Webordnung'`; dazu `note: COUNCIL_NOTE`.
3. `councilOpened(prev: World['council'] | null, next: World['council']): CouncilTier[]`: Stufen, die von `null` auf `'open'` wechselten
   (für den einmaligen Hinweis; `prev === null` beim Laden → `[]`, kein Hinweis für alte Beschlüsse).
4. Taste: `COUNCIL_KEY = 'Umschalt + R'` (alle Buchstaben sind belegt, `r` = Weg; Muster wie `Umschalt + U`). In `hotkeyList(world)` ab
   `councilBadge(world) !== null` der Eintrag `{ key: 'Umschalt + R', label: 'Rat öffnen' }`. Kollisionsprüfung im Test gegen die bestehende Liste.

## Tests (`tests/ui/council.test.ts`, Testnamen mit AK-Nummer)

- «AK-12»: neue Welt → `null`; `council[2] = 'open'` → «Rat · 1»; zwei offen → «Rat · 2»; nach `decree` → «Rat», `councilBadgeActive` falsch.
- «AK-13»: zwei offene Stufen → zwei Gruppen in Stufenreihenfolge, je zwei Karten, Texte gleich `COUNCIL[n].A/B.text`; gefasste Liste.
- `councilOpened`: `null → 'open'` meldet, `'open' → 'A'` nicht, `prev === null` leer.
- Hilfe: `hotkeyList` enthält «Umschalt + R» erst nach dem ersten offenen Beschluss; keine doppelte Taste.

## Prüfschritte

Allgemeine Prüfungen laut Plan-Index · `npx vitest run tests/ui/council.test.ts tests/ui/hotkeys.test.ts; echo EXIT=$?`.
Commit `feat: UI-Helfer Rat und Taste (I-112)`.
