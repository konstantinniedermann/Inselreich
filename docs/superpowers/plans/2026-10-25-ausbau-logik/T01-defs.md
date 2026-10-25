# T01 AL-1 Defs: `extra` statt `fee`, Kosten Stufe 2/3, Dominanz-Wächter

Persona `tech-sim-engineer` · Strang A · Tools ≈ 55 · AK-AL-01 (Stufe 2/3), 02 (ohne I-201 AK-FE7), 05, 32a, 49 (Stufe 2/3) · blocked-by T00.

Spec: R1 (Tipps U3/U5), R2, Datenmodell, Anhang 01 (alle 11 Tabellen, Spalte Bedingung), Rechnung «0 Grundlagen» und «(e2)», Plan P-6.

**Files:** Modify `src/sim/defs/levels.ts`, `src/sim/upgrade.ts`, `src/sim/defs/unlocks.ts` (nur `tip` von U3 und U5), `src/ui/panelView.ts` (nur die `fee`-Zeile → Ware aus `extra`, ohne Ware keine Zeile), `src/ui/inspect.ts` (nur Kommentar «ohne Gebühr» → «ohne fachliche Ware»). Tests: Create `tests/sim/levelRules.test.ts`, `tests/sim/levelDominance.test.ts`; Modify nach Bedarf `tests/sim/upgrade.test.ts`, `tests/sim/defs.test.ts`, `tests/sim/balance-upgrade.test.ts` (liest `extra`), `tests/ui/panelView.test.ts`, `tests/ui/levelReads.test.ts`, `tests/ui/inspect.test.ts`, `tests/render/ring.test.ts` (nur `fee`-Zugriffe).

**Interfaces (Produces):**

```ts
export type LevelSite =
  | { kind: 'fisherSpacing'; radius: number; maxOthers: number }
  | { kind: 'freeTerrain'; terrain: 'forest' | 'grass'; radius: number; min: number }
  | { kind: 'terrainNear'; terrain: 'mountain'; radius: number; min: number }
  | { kind: 'fireStation' };
export interface LevelDef {
  cycle: number;
  upkeep: number;
  cost: Cost;
  extra?: { good: GoodId; amount: number }; // fachliche Ware, nicht erstattet
  workforceTier: Tier;
  site?: LevelSite;
}
export const LEVELS: Readonly<Partial<Record<BuildingDefId, readonly LevelDef[]>>>; // in T01: je 2 Einträge
```

`LEVELS` bleibt in T01 bei zwei Einträgen je Typ (Stufe 4 = T11). Typ ist schon `readonly LevelDef[]`; alle Leser, die heute auf das Tupel bauen (`levels[level - 1]!`, `level === 3`), bleiben bis T11 inhaltlich gleich. `site` und `workforceTier` sind ab T01 Daten, gelesen erst ab T02.

## Schritte

- [ ] **Tests zuerst:**
  - **AK-AL-01 (2/3)** in `levelRules.test.ts`: Tabelle im Test mit c, u, cost, extra, workforceTier, site je Typ und Stufe 2/3, abgeschrieben aus Anhang 01 und R4 (Standort-Spalte; Feuerwache ab Stufe 3 bei Brennerei, Glashütte, Werkzeugmacher; Weberei ohne `site`). `LEVELS[x].length === 2` für alle elf in T01; kein `extra.good === 'rum'`; `extra` nur bei `fisher` (cloth 2/2); kein Schlüssel `fee` in irgendeinem Eintrag (`Object.keys`).
  - **AK-AL-02:** c und u der Stufen 2/3 gleich der Liste von heute (aus `src/sim/defs/levels.ts` auf main abschreiben, siehe T00); I-201 AK-FE7 nicht hier (T19).
  - **AK-AL-05** in `upgrade.test.ts`: Fischer 2 → 3 bucht genau 65 Geld, 4 Holz, 2 Wz, 2 Stein, 2 Stoff; `level` 3; `progress`, `eff`, `state` unverändert. Je Typ und Ausbau 1 → 2 und 2 → 3 (`it.each` über `LEVELS`): Rum-Bestand gleich vor und nach. Welt: `createWorld(seed, { unlockAll: true, crisisLevel: 'off' })`, Lager und Kasse aufgefüllt (Bedingungen R3/R4 wirken erst ab T05).
  - **AK-AL-49 (2/3)** in `levelDominance.test.ts`: `W(cost, extra)` = Geld + Σ Menge × `GOODS[g].buy` (Holz, Werkzeug, Stein, Ware); `W1` = Neubaukosten `BUILDING_DEFS[x].cost` gleich bewertet; `n = c1/c(Stufe) − c1/c(Vorstufe)` mit `c1 = BUILDING_DEFS[x].cycle`; je Typ und Stufe `M = W(Stufe) − n × W1 > 0`. Fehlermeldung nennt Typ, Stufe, M. Kontrolle gegen Rechnung (e2): Fischer Stufe 2 M ≈ +27, Glashütte Stufe 2 ≈ +42 (Toleranz ±1 wegen Rundung, im Test als Kommentar, nicht als Assertion).
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/levelRules.test.ts tests/sim/levelDominance.test.ts tests/sim/upgrade.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen:** Defs nach Anhang 01 (Stufe 2/3: Geld inkl. E2-Aufschläge Brennerei 265, Glashütte 340; Stein ab Stufe 3 bei allen; Fischer Stoff 2/2), Helfer `T(...)` ersetzen oder erweitern, Doku-Kommentar «Index 0 = Stufe 2 …» behalten. `upgrade.ts`: `next.fee` → `next.extra` (optional; ohne `extra` keine Warenprüfung, kein `takeStock`); Text bei fehlender Ware unverändert in T01 (Format «Zu wenig Stoff (1 / 2)» kommt in T05). `paidCost` unverändert (ohne Ware). Tipps U3/U5 nach R1 (wörtlich).
- [ ] **Grün:** `npx vitest run tests/sim/levelRules.test.ts tests/sim/levelDominance.test.ts tests/sim/upgrade.test.ts tests/sim/defs.test.ts; echo EXIT=$?` → 0; `npx vitest related --run src/sim/defs/levels.ts src/sim/upgrade.ts src/ui/panelView.ts; echo EXIT=$?` → 0.
- [ ] **AK-AL-32a:** `npx vitest run tests/sim/balance.test.ts tests/sim/balance-upgrade.test.ts <Baseline-Liste aus T00>; echo EXIT=$?` → 0, Pin M-15 unverändert (Fischer Stufe 2 hat dieselben Werte). Rot → Stopp, an den Controller.
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** gezielt stagen · `feat: Ausbau-Defs mit fachlicher Ware statt Gebühr (AUSBAU-LOGIK T01)`. Commit-Hash an den Controller (Abzweig Strang R).
