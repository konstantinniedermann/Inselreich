# T03 · Unterhalt je Insel und Fusszeile (I-089)

Umsetzer `tech-ui-engineer` · Schätzung 60 Tools · AK-UA3-06 bis 10 · blocked-by: T02

## Dateien

- ändern: `src/ui/upkeepRank.ts` (`UpkeepSummary.islands`, `upkeepSummary`; Fusszeile aus `totalUpkeep` aus `src/sim/economy.ts`, nur gelesen)
- ändern: `src/ui/upkeepCard.ts` (Inselzeilen über der Betriebsliste), `src/style.css` (nur falls nötig, Klasse `upkeep-island`)
- ändern: `tests/ui/upkeepRank.test.ts`, ggf. `tests/ui/hud.test.ts`

## Testfälle (rot zuerst)

- **AK-UA3-06** Zwei Inseln mit Betrieben: `islands` enthält je Insel `{island,count,upkeep}`, absteigend nach Unterhalt, dann Insel-ID; Zahlen aus `buildingUpkeep` (keine zweite Rechnung).
- **AK-UA3-07** Stillgelegte zählen mit Wert nach Stilllegung; Häuser und Unterhalt-0-Gebäude (Kontor) zählen nicht; Insel ohne Betrieb fehlt, damit auch das Heimat-Kontor allein.
- **AK-UA3-08** Summe `islands` + Schiffe + Edikt = Fusszeile `total` (Test mit Sparedikt und mit Schiffen).
- **AK-UA3-09** Fusszeile in der Pause: nach Bau ohne Tick bleiben Zeilen und Fusszeile gleich (`total === totalUpkeep(world)`, Rot gegen `stats.upkeep`).
- **AK-UA3-10** Ohne Seefahrt oder mit nur einer Insel keine Inselzeilen; Zeilentext «Felsbucht · 3 Gebäude · 140 / min» (`pm`, `islandName`), Aria-Text vollständig; `renderUpkeepList` ändert die Welt nicht (`structuredClone`-Vergleich).

## Schritte

1. Tests (Rot), 2. `upkeepSummary` erweitern, 3. Karte rendern, 4. grün; Kopfkommentar von `upkeepRank.ts` («Fusszeile ist `world.stats.upkeep`») nachführen.

## Prüfschritte / Task-Review

Reviewer: `src/ui/` schreibt nicht in die Welt; keine Umbenennung bestehender Felder (Rückwärts für `upkeepRank.test.ts`); Zeilenanzahl der Karte bei 1280×720 ohne Überlauf (Browser-Check).
