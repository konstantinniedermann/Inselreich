> **Task-ID:** Task 2 (Paket M10-S1B) — Teil 2 von 2
> **AK-IDs:** AK-S1-06, -07, -08, -09, -16 (BG-1), -17, -18, -19
> **blocked-by:** Task 1 (Review OK)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md) · [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
> **Teile:** [T02a-sperren.md](T02a-sperren.md) · **T02b-sperren.md** (diese)

- [ ] **Schritt 3: Umsetzung.**
  - `src/sim/placement.ts`: lokale `buildLock` und Import `tierLock` entfernen;
    `import { buildLock } from './unlocks'; export { buildLock } from './unlocks';` `canPlace` bleibt sonst gleich
    (Sperre zuerst).
  - `src/sim/types.ts`: Feld `unlockTier` entfernen; `src/sim/defs/buildings.ts`: `unlockTier: 4` bei `bathhouse`
    und `glassworks` entfernen (sonst keine Änderung; Balancing-Test bleibt grün).
  - `src/sim/trade.ts` `buy`: als **erste** Zeile `const lock = goodLock(world, good); if (lock !== null) return fail(lock);`.
    `sell` unverändert (Spec 4.4).
  - `src/sim/orders.ts` `deliverOrder`: als **erste** Prüfung `const lock = functionLock(world, 'orders'); if (lock !== null) return fail(lock);`.
    `tickOrders` unverändert.
  - `src/ui/guide.ts`: Helfer und Einsatz in jedem Satz von `nextStep`, der ein Gebäude zum Bauen nennt
    (`goodSentence`, Versorgungssatz Marktplatz, `serviceSentence`):

```ts
/** Spec 12.3: Nennt ein Satz ein gesperrtes Gebäude, lautet er „{Name} kommt, {whenText}". */
function lockedSentence(w: World, ids: readonly (BuildingDefId | undefined)[]): string | null {
  for (const id of ids) {
    if (id === undefined) continue;
    const e = entryOfBuilding(id);
    if (e !== null && buildLock(w, id) !== null)
      return `${nm(id)} kommt, ${unlockText(e, 'whenText')}`;
  }
  return null;
}
```

Einsatz: Versorgungssatz `return lockedSentence(w, ['market']) ?? \`Ein Wohnhaus liegt … ${nk('market')}\``;
  in `goodSentence`vor dem`base`-Satz `const locked = lockedSentence(w, [p, q]); if (locked) return locked;`  (ebenso im Zweig „{p} braucht {Gut}: baue {q}" mit`[q]`); in `serviceSentence`mit`[id]`. Der M8-Filter
  (`canRise`mit`tierLock`) bleibt.

- **Tests mit gesperrten Bauten (T-4, T-5, T-6):** `npx vitest run` → rote bestehende Tests; je Datei
  `createWorld(…)` → `createWorld(…, { unlockAll: true })` (bzw. `{ crisisLevel, unlockAll: true }`); M8-Tests mit
  `won = true` von Hand: `w.unlocked = deriveUnlocks(w)` danach. `tests/sim/helpers.ts` `placeService`: der `won`-
  Trick entfällt (Gebäude kommen aus `unlockAll`-Welten). `tests/sim/scenarios.ts`: `withUnlock` entfällt; neuer
  exportierter Helfer `finishUnlocks(w: World): void { w.unlocked = deriveUnlocks(w); }`; jedes Szenario baut in
  `createWorld(…, { …, unlockAll: true })` und ruft am Ende `finishUnlocks` (Spec 10); `galerie` unverändert in den
  Gebäuden. Erwartete Dateien (Grep `tests/`): `tests/render/{iso,renderer}.test.ts`,
  `tests/sim/{crises,economy,fire,merchants,placement,population,production,queries,storm,taxes,tick,toolmaker,glassworks}.test.ts`,
  `tests/sim/{helpers,scenarios}.ts`, `tests/ui/{format,hints,hotkeys,target,tooltip,goal,hud,inspect}.test.ts`, `tests/ui/worlds.ts`.
- [ ] **Schritt 4: Grün prüfen.** `npx vitest run` grün; `npx tsc --noEmit`; `make check`.
      `grep -rn "unlockTier\|withUnlock" src tests` → keine Treffer.
- [ ] **Schritt 5: BG-1** vollständig (mit AK-S1-17); Testzählbefehl; Liste der geänderten bestehenden Testzeilen mit T-n.
- [ ] **Schritt 6: Commit.**

```bash
git add src tests
git commit -m "feat: M10-S1B Sperren in Bau, Kauf und Lieferung, unlockAll in Tests, nextStep-Filter (Spec 4.4, 10, 12.3)"
```

### Nach Task 2: Doku durch lead-tech (kein Start)

- [ ] `docs/adr/ADR-005-tick-reihenfolge-und-zustaende.md`, Abschnitt „Nachtrag M10": (1) `tickUnlocks` ist der
      letzte Aufruf in `step`, nach `checkWin` — Begründung: Der Controller liest vor Schritt t+1 genau den Zustand,
      den `tickUnlocks` am Ende von Schritt t gesehen hat; nur so ist der Referenzlauf bitgleich (Spec 9.1). (2)
      Freischaltung ist gespeichert und monoton (`world.unlocked`), Bedingungen (Amtsstube aktiv, Schule in
      Reichweite, Krisenstufe) sind live und nicht gespeichert. (3) Neuer Zustand `noService` (ab Task 4) mit
      Prüfreihenfolge Ausfall → Anbindung → Dienst → Sturm → Input.
- [ ] `docs/arc42.md` §6 „Ein Simulationsschritt (`step`)": Liste endet mit `tickUnlocks` plus Satz zur
      Bitgleichheit; §8 „Persistenz": Save v5, Kette v4 → v5 (`migrateV4ToV5`, danach `deriveUnlocks` nach
      `isWellFormed`), neue Prüfungen (`unlocked`, `goodLocks`, `upgradeStops`), Fixture `save-v4.json`.
- [ ] `make check`; Commit `docs: ADR-005-Nachtrag und arc42 §6/§8 für M10-S1 (AK-S1-05, AK-S1-20)`; push.

---
