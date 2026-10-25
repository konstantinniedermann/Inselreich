# T01 Kartennummer-Tests der Sim (Charakterisierung)

Persona `tech-ui-engineer` (nur Test, kein `src/`) · Tools ≈ 20 · AK-K2, AK-K3 · blocked-by T00.

**Art: Charakterisierungstest.** `generateMap`/`createWorld` existieren; die Tests belegen bestehendes Verhalten und sind voraussichtlich sofort grün. Kein Rot-Beleg; im Bericht so benennen. Wird ein Test rot, ist das ein Befund: Obergrenze fällt auf 99 999 zurück (Spec Regel 2), Meldung an L0 vor T02.

Datei neu: `tests/sim/mapgenSeed.test.ts` (Vorbild Imports: `tests/sim/mapgen.test.ts`; `serialize` aus `src/sim/save.ts`, `isLand` aus dem Terrain-Modul wie dort).

- **AK-K3 (gehärtet, B1)** für `n` in 100000, 20261025, 99999949: `generateMap(n)` wirft nicht; `terrain` hat `MAP_W*MAP_H` Felder; `terrain[kontor.y*MAP_W+kontor.x]` ist Land; zweimal aufgerufen gleich (`JSON.stringify`); `createWorld(n)` zweimal: `serialize` gleich.
- **AK-K2 Fixpunkt (B2)** für `n` in 0, 1, 21, 345, 4711, 99999, 20261025, 99999949: `u = generateMap(n).seedUsed`; `generateMap(u).seedUsed === u` und gleiches `terrain`; `u >= n`; `u <= n + 49`; `/^\d{1,8}$/.test(String(u))` (die genutzte Nummer bleibt achtstellig und wieder eintippbar; für 99999949 ist `u <= 99999998`).
- **AK-K2 Optionen:** `createWorld(4711)` zweimal mit gleichen Optionen: `serialize` gleich; `crisisLevel: 'off'` gegen `'normal'`: gleiches Home-Terrain (`islands[0].tiles`), `serialize` verschieden.
- Karte 0: `createWorld(0)` wirft nicht (falsy-Falle auf Sim-Seite).

Laufzeit: Karten je ≤ wenige 100 ms; hält die Datei > 5 s, Nummernliste kürzen (Reihenfolge der Grenzfälle behalten) und melden. Keine Uhr im Test.

Belege: `npx vitest run tests/sim/mapgenSeed.test.ts; echo EXIT=$?`.
