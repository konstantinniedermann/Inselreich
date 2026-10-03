> **Task-ID:** T05 (Paket M11-P2B) — Teil 1 von 2
> **AK-IDs:** AK-P2S3-01, -02, -03, -04; RF-6, RF-7; Umschreibung M10:AK-F1-05 „(M11 S3)"
> **blocked-by:** T04 (Review OK)
> **Strang:** `feat/m11-sources` · Worktree `.worktrees/m11-sources` · Implementierer `tech-sim-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-07](orga-07-datei-ownership.md) · [orga-11](orga-11-bitgleich-neupin.md) · [orga-12](orga-12-geaenderte-tests.md)
> **Teile:** **T05a-wald-live.md** (diese) · [T05b-wald-live.md](T05b-wald-live.md)

## T05: Holzfäller braucht Wald (`noForest` live)

**Ziel:** Holzfäller (Variante A, `free`) und Jagdhütte prüfen ihre Wald-Regel in jedem Schritt; fehlt freier Wald, steht
der Betrieb in `noForest` (kein Fortschritt, keine Entnahme, `progress` bleibt, Unterhalt läuft). Spec 3.4, Anhang 01 D.

**Code-Fakten (Stand nach T01–T04):**

- `src/sim/production.ts:17-51` `tickProduction`; Reihenfolge Ist: `outageUntil` → `burning` (`:21`), `!connected` →
  `notConnected` (`:25`), `requiresService` → `noService` (`:29-33`), Sturm-Aussetzer (`:34-35`), Input → `waitingInput`
  (`:36-42`), Fortschritt (`:43`), Abschluss (`:45`, nach T01 mit `cycleOf(b)`). Neue Prüfung **zwischen `:33` und `:34`**.
- `siteRuleOk(world, defId, x, y, rule)` aus `placement.ts` (T04). Import `production.ts` → `placement.ts` ist kreisfrei
  (Probe: `tests/sim/imports.test.ts` grün).
- `src/sim/defs/buildings.ts:69` `lumberjack.site` = `[{ kind: 'radius', terrain: 'forest', radius: 2, min: 1 }]`.
- `src/sim/forest.ts:33-39` `clearForest`/`plantForest` (Sperre `forest`, Kosten 10 / 20, Kachel muss frei sein).
- `BuildingState` enthält `'noForest'` seit T01; `isWellFormed` nimmt ihn an (AK-SAV-04). `src/ui/texts.ts:48` `stateInfo`
  ist ein erschöpfender `switch`: T01 muss dort `noForest` schon behandeln (sonst `tsc`-Fehler, Probe); T05 ändert
  `texts.ts` nicht.
- `tests/sim/forest.test.ts:222-261` M10:AK-F1-05 (Holzfäller-Teil erwartet `{ wood: 10, state: 'ok' }` nach Rodung).

**Erwartete Dateien:**

- `src/sim/defs/buildings.ts` (nur `lumberjack.site` + `free: true`), `src/sim/production.ts`
- **Minimal-Eingriff UI (benannt):** `src/ui/hints.ts` Zeile `REASON_TABLE` „Zu wenig (Wald|Weide)": Muster
  `/^Zu wenig (freier |freie )?(Wald|Weide) in der Nähe$/`, Index `m[2]` für das Gelände, Anzeige
  `` `Zu wenig ${m[1] ?? ''}${m[2]} in der Nähe: mindestens …` `` (Rest wörtlich gleich). Grund: M7:AK-UX-03 provoziert den
  Holzfäller-Grund und wird sonst rot (Probe); alte Texte bleiben bitgleich.
- Tests: `tests/sim/forest.test.ts` (neue AK + AK-F1-05), `tests/sim/placement.test.ts`, `tests/sim/production.test.ts`,
  `tests/sim/glassworks.test.ts` (Testwelt-Ergänzung), neu keine.
- Doku: `docs/arc42.md` (§6 Laufzeit `tickProduction`, §8 Zustände, Baustein `production.ts`),
  `docs/adr/ADR-005-tick-reihenfolge-und-zustaende.md` (Nachtrag M11, Prüfreihenfolge).

**Nicht anfassen:** `src/sim/types.ts`, `save.ts`, `forest.ts`, `placement.ts` (fertig aus T04), `src/render/`,
`src/ui/` ausser `hints.ts`, `tests/sim/controller.ts`, `tests/sim/upgrade.test.ts`.

- [ ] **Schritt 1: Tests schreiben** — `tests/sim/forest.test.ts`, neuer Block `describe('M11 Wald live (Spec 3.4)')`.
      Lokaler Helfer `lumberSite()`: `createWorld(3, { unlockAll: true })`, Geld 10 000, `forceRect(w, k.x + 2, k.y - 3, 7, 7, 'grass')` (deckt die ganze Radius-2-Scheibe ausser den Kontorkacheln), genau **eine** Waldkachel `(k.x + 4, k.y - 1)`, Weg `(k.x + 2, k.y)`, `placeBuilding(w, 'lumberjack', k.x + 3, k.y)`; liefert `{ w, b, forest: { x, y } }`. Für die Jagdhütte `hunterSite` wie in T04 (lokal kopieren).

```ts
it('AK-P2S3-01 Holzfäller: Rodung → noForest, progress bleibt, kein Holz, Unterhalt gebucht; Aufforsten → weiter', () => {
  const { w, b, forest } = lumberSite();
  for (let i = 0; i < 10; i++) step(w);
  expect([b.state, b.progress]).toEqual(['ok', 10]);
  expect(clearForest(w, forest.x, forest.y).ok).toBe(true);
  const wood = w.stock.wood,
    carry = w.upkeepCarry,
    money = w.money,
    up = totalUpkeep(w);
  step(w);
  expect([b.state, b.progress, w.stock.wood]).toEqual(['noForest', 10, wood]);
  expect(w.upkeepCarry).toBe((carry + up) % 100);
  expect(w.money).toBe(money - Math.floor((carry + up) / 100)); // keine Häuser: keine Steuer
  expect(plantForest(w, forest.x, forest.y).ok).toBe(true);
  step(w);
  expect([b.state, b.progress]).toEqual(['ok', 11]);
});
it('AK-P2S3-02 Jagdhütte mit 10 freien Waldkacheln: eine roden → noForest, aufforsten → ok', () => {
  /* hunterSite, roden (x-2, y-1) */
});
it('AK-P2S3-03 Vorrang vor noForest: burning, notConnected, noService; ohne sie noForest', () => {
  const { w, b, forest } = lumberSite();
  expect(clearForest(w, forest.x, forest.y).ok).toBe(true);
  b.outageUntil = w.tick + 50;
  tickProduction(w);
  expect(b.state).toBe('burning');
  delete b.outageUntil;
  b.connected = false;
  tickProduction(w);
  expect(b.state).toBe('notConnected');
  b.connected = true;
  const def = BUILDING_DEFS.lumberjack;
  def.requiresService = 'school'; // M10-Bedingung ohne Schule in Reichweite
  try {
    tickProduction(w);
    expect(b.state).toBe('noService');
  } finally {
    delete def.requiresService;
  }
  tickProduction(w);
  expect(b.state).toBe('noForest');
});
it('AK-P2S3-04 Holzfäller, dessen einziger Wald unter dem eigenen Grundriss liegt: „Zu wenig freier Wald in der Nähe"', () => {
  // forceRect grass um (k.x+3, k.y), nur (k.x+3, k.y) selbst Wald, Weg (k.x+2, k.y)
  // canPlace(w, 'lumberjack', k.x + 3, k.y) → { ok: false, reason: 'Zu wenig freier Wald in der Nähe' }
});
it('RF-6 noForest füllt kein Lager (kein storageFull), Unterhalt läuft; nach Aufforsten läuft progress weiter', () => {
  // lumberSite, 5 Schritte (progress 5), Holz = STORAGE_CAP, roden; 100 Schritte: state 'noForest' (nie 'storageFull'),
  // progress 5, Holz unverändert, Geld − floor((carry + 100 × up) / 100); aufforsten, step → progress 6
});
it('RF-7 v6-Stand mit state noForest lädt ok und wird im nächsten Schritt neu bewertet', () => {
  // (a) Wald fehlt: b.state = 'noForest', serialize → deserialize ok; step → weiter 'noForest', progress gleich
  // (b) Wald da, gespeicherter state 'noForest': deserialize ok; step → 'ok', progress + 1
});
```

Import-Ergänzungen: `step`, `tickProduction`, `totalUpkeep`, `STORAGE_CAP`, `BUILDING_DEFS`, `deserialize`. Der Fall
`requiresService` mutiert die Def nur im `try/finally` (Muster `tooltip.test.ts` mit `TIERS[4].unlockCitizens`).

Weiter: [T05b-wald-live.md](T05b-wald-live.md) (Umschreibung AK-F1-05, Rot-Beleg, Umsetzung, Doku).
