# ADR-017: Festindex je Tick (Kapellenliste ausserhalb des Saves)

Status: angenommen · Paket: I-201 · Grundlage: Ruling R921, Plan P-7 · Betrifft: `src/sim/feastEffect.ts`, `src/sim/feast.ts`, `src/sim/build.ts`

## Kontext

`cycleOf` fragt seit den Festarten (I-201) `harvestActive`, `marketActive` und `feastActive` ab. Jede Abfrage durchsuchte linear alle Gebäude. Im Stress-Test stieg die Tick-Zeit dadurch um etwa 580 %.

## Entscheid

`feastEffect.ts` hält eine `WeakMap<World, { tick, chapels }>`. `chapels` sind alle Gebäude mit `service === 'faith'` in Id-Reihenfolge, einmal je Tick bei der ersten Abfrage gebaut. Die drei Abfragen iterieren nur diese Liste und prüfen jeden Treffer live (Festart, `feastAt`, Anbindung, Brand, Phase und `world.buildings[c.id] === c`). Die Semantik bleibt unverändert (AK-FE7). Der Index steht weder im Save noch im `World`-Typ; `SAVE_VERSION` bleibt.

## Invalidierung

Der Schlüssel enthält `world.tick` und die Identität von `world.buildings`: Die Inselansicht (`render/archipel.ts`) ersetzt `buildings` je Frame durch frische Kopien, dann baut sich die Liste neu auf. `invalidateFeastIndex(world)` läuft in `holdFeast`, beim Platzieren und beim Abriss, damit Änderungen im selben Tick sichtbar werden. Brand und direkt gesetztes `feastAt` wirken ohne Invalidierung, weil die Treffer live geprüft werden.

## Alternativen

- **Erntefaktor je Betrieb in `production.ts`:** verletzt AK-FE7 (Wirkung am Radius der Kapelle, nicht am Betrieb). Verworfen.
- **`for…in` oder `Object.values`-Schleife statt `some`:** brachte keinen Gewinn. Verworfen.

## Folgen

- Ersetzt Code `world.buildings` im selben Tick, erkennt der Index das an der Identität des Objekts; Änderungen innerhalb desselben Objekts brauchen `invalidateFeastIndex`.
- Gebäude, die ein Test oder Code direkt in `world.buildings` einfügt, sieht der Index erst nach `invalidateFeastIndex` oder im nächsten Tick.
- Neue Wege, Gebäude zu erzeugen oder zu entfernen, müssen `invalidateFeastIndex` aufrufen.
