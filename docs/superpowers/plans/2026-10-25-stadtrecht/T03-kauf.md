# T03 · Sim-Aktion `buyCharter` / `buyCharterReason`, Fixtures

Umsetzer `tech-sim-engineer` · ≈ 45 Tools · AK-ST-02 (Kauf vor `won`), AK-ST-03, 04, 05, 08, 09 · blocked-by: T02 · Worktree `.worktrees/stadtrecht` · Spec §3.2, §9 · Plan P-9, Review Focus 1, 5

## Dateien

- neu: `src/sim/charter.ts`, `tests/sim/charterFixtures.ts`
- ändern: `tests/sim/charter.test.ts` (neue `describe`-Blöcke am Ende)
- nicht ändern: `src/sim/council.ts`, `src/sim/edicts.ts` (T04), `src/sim/monument.ts`, `src/sim/reserve.ts`

## Interfaces

- Consumes: `CHARTER_SESSIONS`, `CHARTER_UNLOCK` (T01), `World.charter` (T02), `HOME` aus `./world`, `fail`/`ok` aus `./types`.
- Produces (`src/sim/charter.ts`, Kopfkommentar «Stadtrecht (Spec §3.2): Kauf der nächsten Sitzung. Kein Zufall, wirft nie. Importiert nur `./defs/*`, `./types`, `./world`.»):
  - `charterUnlocked(w: World): boolean` → `w[CHARTER_UNLOCK] === true`
  - `charterRank(w: World): number` → `w.charter.length`
  - `nextCharter(w: World): CharterSessionDef | null` → `CHARTER_SESSIONS[w.charter.length] ?? null`
  - `buyCharterReason(w: World, side: unknown): string | null`
  - `buyCharter(w: World, side: unknown): Result`
- Produces (`tests/sim/charterFixtures.ts`): `charterFixture(name: 'glas0' | 'alles' | 'rang6'): World` (P-9).

## Verhalten

1. `buyCharterReason`, der erste zutreffende Grund gilt (Spec §3.2.2): `!charterUnlocked` → «Erst nach dem ersten Ziel»; `side !== 'A' && side !== 'B'` → «Ungültige Seite»; `nextCharter === null` → «Stadtrecht vollständig»; `w.money < money` → «Zu wenig Geld»; `stock.stone < stone` → «Zu wenig Stein»; `stock.glass < glass` → «Zu wenig Glas»; sonst `null`. `stock` = `w.islands[HOME]!.stock` (wie `monument.ts:113`). **Kein** Sperrbestand (`reserve`), keine Pause-Prüfung.
2. `buyCharter`: Grund ≠ `null` → `fail(reason)`, Welt unverändert. Sonst erst alle drei Posten abziehen, dann `w.charter.push(side)`, `ok`. Kein Rückgängig.
3. Fixtures (P-9), alle aus `createWorld(3)` mit `won = true`, `council = { 2: 'A', 3: 'B', 4: null }` (Karte hat Ratszeilen wie im echten Spiel), Sitzungskosten aus den Defs gelesen:
   - `glas0`: `charter = []`, Geld = Summe Geld der Sitzungen 1+2 + 1000, Stein 100, **Glas 0** → Sitzung 1 leistbar, nach dem Kauf Sitzung 2 gesperrt «Zu wenig Glas».
   - `alles`: Geld = Summe aller sechs + 1000, Stein und Glas = Summen + 10 → sechs Käufe nacheinander möglich.
   - `rang6`: `charter` volle Länge im Wechsel A/B, Geld 1000.

## Steps

- [ ] **Tests rot** in `tests/sim/charter.test.ts`, Hilfsfunktion `rich(w)` setzt Geld, Stein und Glas auf die Summen der Defs; tiefer Vergleich über `structuredClone` vorher/nachher:
  - **AK-ST-02 (Kauf):** `createWorld(3)`: `buyCharter(w, 'A')` → `{ ok: false, reason: 'Erst nach dem ersten Ziel' }`, `w` gleich dem Klon.
  - **AK-ST-03:** `won = true`, `rich(w)`: `buyCharter(w, 'A')` → `ok`; Geld, `islands[HOME].stock.stone` und `.glass` sinken genau um `CHARTER_SESSIONS[0]` (Werte aus den Defs); `charter` `['A']`.
  - **AK-ST-04:** für Sitzung 2 (nach einem ersten Kauf) je Posten Geld, Stein, Glas genau 1 zu wenig → `ok: false` mit «Zu wenig Geld» / «Zu wenig Stein» / «Zu wenig Glas», Welt gleich dem Klon. `buyCharter(w, 'C')` und `buyCharter(w, undefined)` → «Ungültige Seite», kein Wurf. Reihenfolge: (a) Geld und Glas fehlen → «Zu wenig Geld»; (b) `won = false` und `'C'` → «Erst nach dem ersten Ziel»; (c) Rang 6 und `'C'` → «Ungültige Seite».
  - **AK-ST-05:** `charterFixture('alles')`: sechs Käufe `ok`, siebter → «Stadtrecht vollständig», `charter.length === CHARTER_SESSIONS.length`.
  - **AK-ST-08:** `islands[HOME].reserve.stone = 60` (Sperrbestand I-049, Stufe aus `defs/reserve.ts` lesen), Stein genau = Kosten → `ok`, Stein danach 0.
  - **AK-ST-09:** zweite Insel (Index 1) reich an Stein/Glas, Heimatinsel arm → «Zu wenig Stein»; umgekehrt `ok`, `islands[1].stock` gleich dem Klon. Zusatz: Kauf zieht aus demselben Objekt wie das Denkmal (`w.islands[HOME]!.stock`, Vergleich per Identität mit `home(w).stock`).
  - **Review Focus 5:** `charterFixture('rang6')` → `serialize`/`deserialize` → `ok`, `charter` gleich.
  - Fixtures: `glas0` → erster Kauf `ok`, zweiter «Zu wenig Glas»; `rang6` → `nextCharter === null`.
- [ ] **Lauf rot:** `npx vitest run tests/sim/charter.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–3.
- [ ] **Teilbeleg:** `npx vitest run tests/sim/charter.test.ts tests/sim/charter-save.test.ts tests/sim/monument.test.ts tests/sim/reserve.test.ts; echo EXIT=$?` (Monument-Datei per `ls tests/sim | rg monument` bestätigen), `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?` → je 0.
- [ ] **Vorabprobe Fixture-Auslieferung (Gate-Plan B6):** Dev-Server im Worktree starten (`make help` → Start-Befehl, Hintergrund-Bash), `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:<port>/tests/sim/charterFixtures.ts; echo EXIT=$?` → `200`; Server beenden. Anderer Code: Befund an den Controller (dann entscheidet er vor T07 über den Weg, kein Handbau).
- [ ] **Commit:** `feat: Stadtrecht-Kauf buyCharter (AK-ST-02 bis 05, 08, 09)`.

## Task-Review

Gründe wörtlich und in Spec-Reihenfolge; Abzug erst nach vollständiger Prüfung (Review Focus 1); keine Zahl im Code ausser über `CHARTER_SESSIONS`; kein Import aus `council.ts`/`edicts.ts`/`monument.ts` (kein Zyklus); Fixtures lesen Kosten aus den Defs.
