# T06 · Rundreise, Hash, Baseline

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 45 Tools · blocked-by: T05 · AK-NU1-22, -45, -55, -25a, -25b (Schlussliste)
Spec §4 «Determinismus», §7 AK-22; Anhang 02 §8.2, §8.4 (c), §8.6 (d). Läuft parallel zu T07/T08 (Strang B, getrennte Dateien).

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

**Files:**

- Modify: `tests/sim/expedition-save.test.ts` (Block Rundreise), Pins nur laut `pins.md`
- Create: `tests/sim/expedition-baseline.test.ts`
- Modify: `tests/sim/scenarios.ts` (41 KB, nur neuer Bauer am Ende der M14-Liste) und die Szenario-Listen in `tests/sim/scenario-saves.test.ts` (Pin-Zeile in `pins.md`)
- Kein `src/`-Code geplant; ein Rotfall in `src/` ist ein Befund an den Controller (Fix im Strang A nach Absprache, eigener Commit).

**Interfaces:** Consumes `startExpedition`, `chooseOption`, `cancelExpedition`, `tickExpedition` (T04/T05), `serialize`/`deserialize`, `fnv1a32` (`tests/sim/helpers.ts`), `step`.

## Tests

- **AK-22** (`it.each` über die Zustände `boarding`, `leg`, `card`, `back`, `leg` mit `extra 2` nach Umweg, `back` nach Umkehr): Welt mit Kartenhaus und Expedition (über Aktionen und `step` erreicht, nicht von Hand gebaut) → `deserialize(serialize(w))` `ok`, `toEqual(w)`; dann für beide Welten dieselbe Folge aus N = 1200 `step` mit festen Wahlen (`'s'` wenn möglich, sonst `'detour'`) bei jeder offenen Karte → `fnv1a32(serialize(a)) === fnv1a32(serialize(b))`. Laufzeit je Fall < 500 ms (sonst N senken, Ledger).
- **AK-45** (P-8): zwei Welten, Start mit `{ food: 12, wood: 20, tools: 10 }` bzw. `{ tools: 10, food: 12, wood: 20 }` → `serialize` gleicher Text und gleicher Hash; Schlüssel von `expedition.cargo` in `GOOD_IDS`-Reihenfolge, auch nach einer Wahl mit Abzug.
- **AK-55:** Routenschiff in `boarding`, dann `clearRoute` → Rundreise tief gleich, Schiff `homing true`; nach dem Laden bis zur Ankunft `step` → `phase 'leg'` bei Ankunft.
- **Offene Karte** (Spec §6 «Speichern bei offener Karte»): nach dem Laden gleiche `openCard`, gleiche `optionReason` je Option, `wait` gleich.
- `tests/sim/expedition-baseline.test.ts`, **AK-25a:** Quelltext `tests/sim/controller.ts` enthält keinen der Namen `startExpedition`, `chooseOption`, `cancelExpedition`, `maphouse`; dazu Lauf von `npx vitest run tests/sim/balance*.test.ts tests/sim/seaGolden.test.ts tests/sim/orders*.test.ts tests/sim/crises*.test.ts tests/sim/islands*.test.ts; echo EXIT=$?` → 0 und `git diff main -- tests/sim/balance*.test.ts tests/sim/seaGolden.test.ts tests/sim/controller.ts` leer (beides Ledger, kein Test-Code).
- **AK-25b:** Suchbefehle aus `pins.md` erneut; jede Änderung gegenüber main in Test-Erwartungen (`git diff main --stat -- tests`) ist entweder neue NU-1-Testdatei oder Zeile aus `pins.md` mit Kommentar `// NU-1 25b (E-NU-4)`. Liste der tatsächlich geänderten Pins ins Ledger (für das Ruling E-NU-4).

- **Szenario für T10:** `nu1-kartenrand` (Seed 3): `won`, `wonMerchants`, `wonSpice`, `U7`, Kartenhaus angebunden, ein freies Schiff, ein Routenschiff Heimat ⇄ Insel als **einziges** Gewürzschiff, Heimatlager mit 40 Holz, 30 Werkzeug, 40 Nahrung, 20 Rum, 20 Glas, 20 Stoff; lädt `ok` (`scenario-saves`-Lauf schreibt `out/nu1-kartenrand.json`).

## Schritte

- [ ] Tests schreiben; **Rot** (soweit neu): `npx vitest run tests/sim/expedition-save.test.ts tests/sim/expedition-baseline.test.ts; echo EXIT=$?`. AK-22/45/55 können ohne `src/`-Änderung grün sein (Verhalten aus T02–T05): dann Rotnachweis durch kurzzeitiges Auskommentieren der kanonischen Ordnung bzw. der Prüfung K11 im Arbeitsbaum, Lauf rot, zurücksetzen (`git diff --stat` leer) — Befehle und Exit-Codes ins Ledger.
- [ ] **Grün:** derselbe Befehl → 0.
- [ ] Baseline-Lauf und `git diff` (AK-25a), Pin-Abgleich (AK-25b).
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `test: NU-1 Rundreise je Phase, kanonische Ladung, Baseline (T06)`.
