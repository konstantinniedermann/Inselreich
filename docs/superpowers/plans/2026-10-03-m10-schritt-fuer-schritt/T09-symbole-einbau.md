> **Task-ID:** Task 9 (Paket M10-U4)
> **AK-IDs:** Vitest-Teile AK-U4-01, -04; Browser AK-U4-01 … -05 in QA-U4
> **blocked-by:** Task 8 (Review OK), A1 (Review OK)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md)

## Task 9: U4 — Symbole im Einbau, Kann K2 und K3

**Paket** M10-U4 · **Implementierer** `tech-ui-engineer` (sonnet) · **Worktree/Branch** `.worktrees/m10-ui` ·
`feat/m10-ui` · **blocked-by** Task 8 (Review OK), A1 (Review OK) · **Vorher (Controller):**
`git -C .worktrees/m10-ui merge --no-edit <A1-SHA>`, `make check`, push · **AK** Vitest-Teile AK-U4-01, -04;
Browser AK-U4-01 … -05 in QA-U4

**Files:**

- Modify: `src/ui/hud.ts`, `src/ui/buildMenu.ts`, `src/ui/inspect.ts`, `src/ui/startCard.ts`, `src/ui/goal.ts`,
  `src/ui/messages.ts`, `src/ui/app.ts` (nur K2-Merkfeld), `src/style.css`
- Test: `tests/ui/{hud,tooltip,inspect,startCard}.test.ts`; `tests/ui/contrast.test.ts` **unverändert**

**Interfaces:**

- Consumes: `ICON_IDS`, `ICONS`, `iconSvg` (A1); Task 6/7-Helfer.
- Produces: `chipView(world, g): { icon: IconId; text: string; label: string }` (Lager), `popChipView(world, t)`,
  `needIcons(world, b): { icon: IconId; met: boolean; label: string }[]` (Haus-Panel), `newBuildEntries(prev:
readonly UnlockId[], world): Set<BuildingDefId>` (K2).

- [ ] **Schritt 1: Failing tests.**

```ts
describe('M10 Symbole im Einbau (Spec 14)', () => {
  it('AK-U4-01 Chips tragen Symbol; aria-label = bisheriger Text wörtlich', () => {
    const w = createWorld(3);
    expect(chipView(w, 'wood')).toEqual({
      icon: 'wood',
      text: `${w.stock.wood} →`,
      label: `Holz ${w.stock.wood} →`,
    });
    expect(popChipView(w, 1).label).toBe('Pioniere 0');
    expect(moneyView(w)).toMatchObject({ icon: 'money', label: `Geld ${w.money}` });
    expect(balanceView(w)).toMatchObject({ icon: 'balance' });
  });
  it('AK-U4-04 (K2) neue Einträge nach U2 tragen „neu" bis zur ersten Wahl; nach Laden keine', () => {
    const w = createWorld(3, { crisisLevel: 'normal' });
    const prev = [...w.unlocked];
    w.unlocked = ['U0', 'U2'];
    const fresh = newBuildEntries(prev, w);
    expect([...fresh]).toEqual(['quarry', 'sheepfarm', 'weaver', 'chapel', 'firestation']);
    fresh.delete('chapel'); // erste Wahl
    expect(fresh.has('chapel')).toBe(false);
    expect(newBuildEntries(w.unlocked, w).size).toBe(0); // Laden: Basis = geladener Stand
  });
});
```

(`moneyView`/`balanceView` analog `chipView`; Pfeil-Text wie heute aus `trendArrow`.)

- [ ] **Schritt 2: Rot prüfen** (`chipView is not a function`). Vor der Umsetzung grün erlaubt: keiner.
- [ ] **Schritt 3: Kopfzeile.** Lager-Chip: Symbol + Bestand + Pfeil, `aria-label` = bisheriger Text, `title`
      unverändert; Einwohner-Chip, Geld, Bilanz, Steuer-Knopf ebenso (Tabelle Spec 14). `#hud` ≤ 84 px bei 1280.
- [ ] **Schritt 4: Bauleiste, Haus-Panel, Meldung, Hilfe.** Kategorie-Reiter mit Kategorie-Symbol, `aria-label` und
      `title` = Kategoriename; Bau-Einträge Symbol der Kategorie + Kosten, `aria-label` „{Name} · {n} Geld" bleibt;
      Haus-Panel: Bedarfe als Symbole mit ✓ / ✗ (`needIcons`), darunter Zeile zum ersten fehlenden Gut; Meldung und
      Hilfe: Symbol (ohne Text) vor jedem Gebäude- bzw. Gutnamen, `textContent` unverändert (`aria-hidden` am Symbol).
      Tab und Enter wie M7-UX (R134).
- [ ] **Schritt 5 (Kann K2):** Zeichen „neu" (`aria-label` „neu") an Einträgen aus `newBuildEntries`, bis der Spieler
      sie einmal wählt; Merkfeld nur im UI-Zustand (`app.ts`), nicht gespeichert.
- [ ] **Schritt 6 (Kann K3):** Bau-Einträge zeigen die verkleinerte Silhouette aus `src/render/sprites.ts` (nur
      lesend importiert) statt des Kategorie-Symbols.
- [ ] **Schritt 7: Grün prüfen.** `npx vitest run` (inkl. `tests/ui/contrast.test.ts` unverändert grün); `make check`;
      Commit `git commit -m "feat: M10-U4 Symbole in Kopfzeile, Bauleiste, Haus-Panel und Meldung (Spec 14)"`.

---
