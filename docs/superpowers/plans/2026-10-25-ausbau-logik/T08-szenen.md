# T08 Szenen S1–S4 für die Browser-Checks

Persona `tech-sim-engineer` · Strang A · Tools ≈ 35 · Anhang 02 N7, Plan P-10 · blocked-by T05 (läuft parallel zu T06/T07; Dateien disjunkt).

**Files:** Create `tests/ui/ausbauScenes.ts`, `tests/ui/ausbauScenes.test.ts`. Keine Änderung unter `src/`.

**Interfaces (Produces):**

```ts
export type SceneId = 'S1' | 'S2' | 'S3' | 'S4';
export interface Scene {
  world: World;
  focus: { island: number; x: number; y: number };
  ids: Record<string, number>;
} // ids: benannte Gebäude für den Tester
export function scene(id: SceneId): Scene;
```

Inhalt (N7), alle mit `createWorld(seed, { unlockAll: true, crisisLevel: … })`, festem Seed, Gebäude per `putBuilding` relativ zum Heimatkontor, Kasse und Lager für zwei Ausbauten aufgefüllt, Wege angeschlossen:

- **S1:** Fischer `ids.fisher` g 2 an gerader Küste; andere Fischer `ids.n2` (Abstand 2) und `ids.n3` (Abstand 3); Bürgerhaus `ids.citizen` im Abstand 6 (kein weiteres Haus mit tier ≥ 2 im Umkreis 8). `crisisLevel 'off'`.
- **S2:** Brennerei `ids.distillery` g 3, `crisisLevel 'normal'`, Feuerwache `ids.fire` abdeckend und abreissbar, Bürgerhaus im Arbeitsweg; Zuckerrohr-Zulieferung, damit der Betrieb läuft.
- **S3:** Kolonie (Insel 1) mit Kontor und Steinbruch `ids.quarry` g 1 an Gebirge, ohne Wohnhaus; Stein, Holz, Werkzeug, Geld reichen.
- **S4:** Fischer `ids.source` g 3 mit Bürgerhaus im Arbeitsweg; freie gerade Küste in Sichtweite mit Bürgerhaus im Umkreis 8 (Ziel grün); Küstenstück neben zwei Fischern `ids.f1`, `ids.f2` (Ziel rot, Fischgrund). Stoff 4, Stein ≥ 4 im Lager.

## Schritte

- [ ] **Tests zuerst** in `ausbauScenes.test.ts`: je Szene die Eigenschaft prüfen, auf die der Browser-Check baut — S1: `levelChecks` des Fischers zur Stufe 3 hat ✗ Fischgrund, ✓ Fachkräfte, `ceil(distance)` zum Bürgerhaus = 6; S2: `runningLevel` 3 mit Wache, nach `demolish(ids.fire)` 2; S3: `upgradeBuilding` scheitert mit «… (kein Siedlerhaus auf dieser Insel)»; S4: Quelle `level` 3, Zielküste A ohne ✗ für Stufe 3 (Fachkräfte und Fischgrund am Zielort), Zielküste B mit Fischgrund-✗ (bis T14 über `siteAt`/`workforceAt` an einem Probe-Gebäude im Test prüfen). `deserialize(serialize(world))` je Szene `ok`.
- [ ] **Ausgabe nur auf Wunsch:** ist `process.env.AUSBAU_SCENES_OUT` gesetzt, schreibt der Test je Szene `<dir>/<id>.json` (`serialize`) und `<dir>/<id>.focus.json`; ohne Variable keine Dateizugriffe (Test bleibt rein).
- [ ] **Rot-Lauf:** `npx vitest run tests/ui/ausbauScenes.test.ts; echo EXIT=$?` → Exit ≠ 0 (vor dem Bau der Szenen).
- [ ] **Umsetzen** `ausbauScenes.ts`; **Grün** gleicher Lauf → 0; Probe: `AUSBAU_SCENES_OUT=.studio/qa/ausbau-logik/szenen npx vitest run tests/ui/ausbauScenes.test.ts; echo EXIT=$?` → 0, vier JSON vorhanden.
- [ ] **Anleitung für den Playtester** im Commit-Text und im Bericht: JSON per CDP `localStorage.setItem('inselreich.save.v1', <json>)`, Seite neu laden, «Laden», Kamera über `__inselDev.centerOn(x, y)` aus `focus`.
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `test: Szenen S1–S4 für Ausbau-Browser-Checks (AUSBAU-LOGIK T08)`.
