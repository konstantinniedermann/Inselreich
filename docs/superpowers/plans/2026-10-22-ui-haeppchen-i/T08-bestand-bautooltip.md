# T08 · P2 Bestand im Bau-Tooltip (I-167)

Umsetzer `tech-ui-engineer` · ≈ 45 Tools · AK I10 bis I15 · blocked-by: keine (Testsperre R380) · Spec: Teil P2 (Regeln 1 bis 5) · Strang B

## Dateien

- neu: `src/ui/buildStand.ts`, `tests/ui/buildStand.test.ts`
- ändern: `src/ui/buildMenu.ts` (`attachTooltip` ≈ Z. 305: Zeile `tt-line tt-stand` nach `tt-balance`; `refreshShownBalance` ≈ Z. 250 und Aufrufer ≈ Z. 582), `tests/ui/buildMenu.test.ts` (Ergänzung)
- nicht ändern: `tooltipLines`, `src/ui/hud.ts`, `src/sim/`, `src/style.css` (Klasse `tt-line` genügt)

## Verhalten

1. `standLine(world, defId, island): string | null` nach Spec Regel 2 und 3: ein Durchlauf über `world.buildings`; `Steht: n` (+ « (k still)» bei `b.paused`), « · alle Inseln: m» nur bei `m > n`, `Steht: noch keins`; `null` für Kontor, Kontor II und `maxCount.n === 1`. Brennende und nicht angebundene Gebäude zählen als stehend.
2. Zeile wird lazy gefüllt wie die Bilanz-Zeile (`open`, Auffrischung), und nur für `.tooltip.show`; verborgene Tooltips rechnen nicht (I14). Kein Eintrag für Weg, Abriss, Aufforsten, Pflanzen.
3. Insel der Kamera wie `refreshShownBalance` sie bereits erhält (`island`-Parameter nutzen, nichts Neues erfinden).

## Testfälle (rot zuerst)

I10 bis I15 aus der Spec; I14 per Spy (ein Tooltip offen, 20 verborgen, genau ein Aufruf je Auffrischung). Keine `Contract`-Literale. Die Texte aus der Spec als Gold-Strings.

## Prüfungen

`npx vitest run tests/ui/buildStand.test.ts tests/ui/buildMenu.test.ts; echo EXIT=$?` (vorher rot), `npx tsc --noEmit; echo EXIT=$?`, eslint, prettier. Commit `feat: Bestand im Bau-Tooltip (I-167)`.
