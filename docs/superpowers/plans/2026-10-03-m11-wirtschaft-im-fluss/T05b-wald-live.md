> **Task-ID:** T05 (Paket M11-P2B) — Teil 2 von 2
> **AK-IDs:** AK-P2S3-01 … -04; RF-6, RF-7
> **blocked-by:** T04 (Review OK)
> **Strang:** `feat/m11-sources` · Worktree `.worktrees/m11-sources`
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-11](orga-11-bitgleich-neupin.md) · [orga-12](orga-12-geaenderte-tests.md)
> **Teile:** [T05a-wald-live.md](T05a-wald-live.md) · **T05b-wald-live.md** (diese)

- [ ] **Schritt 1 (Fortsetzung): M10:AK-F1-05 umschreiben** (Anhang 02 D). Neuer Name: „AK-F1-05 Holzfäller ohne freien
      Wald steht in noForest, Unterhalt läuft; Schäferei verliert durch Aufforsten nichts (M11 S3)". `lumber(clear)` liefert
      zusätzlich die Geldänderung ab nach der Rodung; Erwartung:

```ts
expect(lumber(false)).toEqual({ wood: 10, state: 'ok', money: -15 });
expect(lumber(true)).toEqual({ wood: 0, state: 'noForest', money: -15 }); // 300 Schritte × 5 je 100, keine Häuser
// Schäferei-Teil (sheep(true) === sheep(false)) bleibt wörtlich
```

`money` = `w.money` nach 300 Schritten − `w.money` direkt nach der Rodung (Übertrag startet bei 0: keine Schritte vorher).

- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/sim/forest.test.ts`:

| AK / Test         | erwartet rot vor der Umsetzung                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| AK-P2S3-01        | `expected [ 'ok', 11, … ] to deeply equal [ 'noForest', 10, … ]`                                  |
| AK-P2S3-02        | `expected 'ok' to be 'noForest'`                                                                  |
| AK-P2S3-03        | letzte Zeile: `expected 'ok' to be 'noForest'` (Vorrang-Zeilen davor sind schon grün)             |
| AK-P2S3-04        | `expected { ok: true } to deeply equal { ok: false, reason: 'Zu wenig freier Wald in der Nähe' }` |
| RF-6              | `expected 'storageFull' to be 'noForest'`                                                         |
| RF-7              | Teil (a): `expected 'ok' to be 'noForest'`                                                        |
| AK-F1-05 (M11 S3) | `expected { wood: 10, state: 'ok', … } to deeply equal { wood: 0, state: 'noForest', … }`         |

- [ ] **Schritt 3: Umsetzung.**
  - `defs/buildings.ts:69`: `site: [{ kind: 'radius', terrain: 'forest', radius: 2, min: 1, free: true }]`.
  - `production.ts`: Helfer und Einhängepunkt (zwischen `noService` und Sturm-Aussetzer):

```ts
import { siteRuleOk } from './placement';
/** Spec 3.4: jede radius-Regel mit Wald muss live erfüllt sein (Holzfäller, Jagdhütte; Variante A, nur freie Kacheln). */
const forestOk = (world: World, b: Building): boolean =>
  BUILDING_DEFS[b.defId].site.every(
    (r) =>
      r.kind !== 'radius' || r.terrain !== 'forest' || siteRuleOk(world, b.defId, b.x, b.y, r).ok,
  );
// in tickProduction, nach dem noService-Zweig:
if (!forestOk(world, b)) {
  b.state = 'noForest'; // kein Fortschritt, keine Entnahme, progress bleibt; Unterhalt läuft (tickEconomy)
  continue;
}
```

- `src/ui/hints.ts`: Minimal-Eingriff wie in T05a „Erwartete Dateien" (drei Zeilen).

**Geänderte bestehende Tests** (Name + „(M11 S3)"; nur Testwelt bzw. Erwartung; Probe auf M10-Code gemessen):

| Datei :: Test (Zeile Ist)                                                                                                                  | Änderung                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `forest.test.ts` :: AK-F1-05 (`:222`)                                                                                                      | Holzfäller-Teil wie Schritt 1                                                                                                                    |
| `placement.test.ts` :: lumberjack needs forest within radius 2 (`:64`)                                                                     | Grund → „Zu wenig freier Wald in der Nähe"                                                                                                       |
| `production.test.ts` :: lumberjack produces… (`:38`), does nothing when not connected… (`:49`), drops output when storage is full… (`:91`) | nach `connectedBuilding(w, 'lumberjack')`: `w.tiles[idx(w, 1, 0)]!.terrain = 'forest';` (Holzfäller liegt ohne Kacheln auf (0, 0)); Import `idx` |
| `glassworks.test.ts` :: AK-S2-09 Sturm… (`:155`)                                                                                           | nach `direct(w, 'lumberjack', 13)`: `w.tiles[idx(w, 14, 5)]!.terrain = 'forest';`; Import `idx`                                                  |

Probe: mit diesen Ergänzungen sind alle übrigen Tests grün; `hints.test.ts` M7:AK-UX-03 wird über `hints.ts` grün
(Test unverändert). Szenarien (`galerie`, `m10-wald`, Controller-Layout) bleiben baubar.

- [ ] **Schritt 4: Grün.** `npx vitest run tests/sim tests/ui`; `npx tsc --noEmit`; `make check`. **Bitgleichheit (A9,
      M-09):** `npx vitest run tests/sim/balance tests/sim/unlock-timeline.test.ts` grün und `git diff <T03-SHA> --
    tests/sim/balance*.test.ts tests/sim/unlock-timeline.test.ts` leer. Wackelt ein Pin: Stopp, Meldung an L0 (R74;
      Rückfall Variante C nur per Ruling). Testzählbefehl aus index.md.
- [ ] **Schritt 5: Doku.**
  - `docs/arc42.md` Baustein `production.ts`: „… Zustand `noForest` (Wald-Regel live über `siteRuleOk`)"; §6 Laufzeit-Zeile
    `tickProduction`: Prüfreihenfolge Ausfall → Anbindung → Dienst → Wald → Sturm → Input; §8 Zustände (Absatz M10
    `noService`): Satz „M11 ergänzt `noForest`: Holzfäller und Jagdhütte ohne freien Wald im Radius (Wald ohne Gebäude und
    Weg, ausserhalb des eigenen Grundrisses); kein Fortschritt, keine Entnahme, `progress` bleibt, Unterhalt läuft; jeder
    Schritt bewertet neu."
  - `docs/adr/ADR-005-…`: Abschnitt „Nachtrag M11" (anlegen, falls T01 ihn nicht angelegt hat) um den Punkt „Zustand
    `noForest` nach `noService`, vor dem Sturm-Aussetzer; nicht gespeichert bewertet, sondern je Schritt neu" ergänzen.
- [ ] **Schritt 6: Commit und Push.**

```bash
git add src/sim/defs/buildings.ts src/sim/production.ts src/ui/hints.ts tests docs/arc42.md docs/adr/ADR-005-tick-reihenfolge-und-zustaende.md
git commit -m "feat: M11-P2B Holzfäller und Jagdhütte brauchen freien Wald, Zustand noForest live (Spec 3.4)"
git -C .worktrees/m11-sources push origin feat/m11-sources
```

**Risiken/Randfälle:**

- Tests, die Holzfäller ohne Kacheln direkt einfügen, werden `noForest`; die Probe fand genau die vier oben. Weitere
  Treffer im roten Lauf: gleiche Testwelt-Ergänzung, in den Bericht.
- `texts.ts` braucht den `noForest`-Fall schon ab T01 (erschöpfender `switch`, `tsc`); fehlt er, Stopp und Meldung an
  den Controller (T01-Mangel), nicht hier nachziehen ohne Ruling.
- Der Text „Kein freier Wald in der Nähe" im Panel und die Mouse-over-Umschreibung M10:AK-U3-02 kommen erst in der UI-Welle.
- Leistung: je Holzfäller/Jagdhütte und Schritt eine Radius-Zählung (≤ 29 Kacheln); vernachlässigbar.
