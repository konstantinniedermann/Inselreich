> **Task-ID:** T12 (Paket M11-U3) — Teil 1 von 2
> **AK-IDs:** AK-UI-05, AK-UI-06 (Browser; Tooltip-Teil Vitest), AK-UI-07, AK-UI-09; AK-R161-01, -02 (Browser), -03 (Review)
> **blocked-by:** T11 (Review OK), R1 (in `feat/m11-ui` gemergt, orga-09 W6)
> **Strang:** `feat/m11-ui` · `.worktrees/m11-ui` · Implementierer `tech-ui-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-06](orga-06-schnittstellen.md) · [orga-07](orga-07-datei-ownership.md) · [orga-12](orga-12-geaenderte-tests.md)
> **Teile:** **T12a-ui-haus-bau.md** (diese) · [T12b-ui-haus-bau.md](T12b-ui-haus-bau.md)

## T12: Haus-Defizit, R161-Hinweis, Bauleiste, Taste Y, Freischalt-Meldungen

**Ziel:** Das Haus-Panel nennt ein Defizit mit Restvorrat und den Stein-Hinweis (R161); die Jagdhütte liegt auf Y,
die Rinderfarm bleibt ohne Taste; Meldungen U2/U3/U5 nennen die neuen Einträge ohne „(null)"; der Bauleisten-Tooltip
nennt den Ausstoss je Stufe (Spec 7, 3.7, 4; Anhang 01 E).

**Code-Fakten** (Ist M10 `801c279`, plus T01–T11):

- `src/ui/hotkeys.ts:7–28` `TOOL_HOTKEYS`, 20 Tasten; frei ist nur `y` (Spec 13-10). Ziffern `1`/`2`/`3` sind Tempo
  (`:30`). **Entscheid Rinderfarm (13-10, orga-02 E6): ohne Taste.** `4` wäre zwar frei, liest sich neben `1`/`2`/`3`
  (= 1×/2×/4×) aber als Tempo-Taste; AK-UI-05 verlangt „keine Taste → `cattlefarm`".
- `src/ui/goal.ts:97–98` `withKey(id)` = `` `${name} (${hotkeyLabel(…)})` `` → ohne Taste „Rinderfarm (null)".
  `:117–124` `unlockNoticeText`; Funktionen kommen aus `FUNCTION_LABELS` (T01: `upgrade2` „Ausbau Stufe 2",
  `upgrade3` „Ausbau Stufe 3"), Gebäude in `BUILDING_IDS`-Reihenfolge (T04: `hunter`, `cattlefarm` nach `fisher`).
- `src/ui/buildMenu.ts:91–133` `tooltipLines`; `:121–123` „Erzeugt: {Gut} {n} / min" aus `def.cycle` (bleibt Stufe 1).
- `src/ui/inspect.ts:199–214` `renderHouse`, `:228–281` `updateHouse` (Aufstiegsgründe über `upgradeStatus`).
- `src/sim/population.ts:145–146` hängt den Grund aus `checkAfford` an, roh „Zu wenig Stein" (Bürger → Kaufleute kostet
  10 Stein, `defs/tiers.ts:33`).
- T02: `upgradeDeficit(world, b)` (`src/sim/flow.ts`) → `{ good, net } | null`, `net` je 100 Ticks (< 0).
- **Schritt 0 (Querprüfung, Bericht):** (a) Haben T01/T04 `tests/ui/goal.test.ts` AK-U1-08 schon auf die neuen
  Einträge umgeschrieben (U2 mit Jagdhütte, U3 mit Rinderfarm und „Ausbau Stufe 2", U5 mit „Ausbau Stufe 3")? Mit
  welchem Text für die Jagdhütte? (b) Deckt `REASON_TABLE` die P2-Gründe „Zu wenig freier Wald/freie Weide in der
  Nähe" ab (`tests/ui/hints.test.ts` AK-UX-03 Vollständigkeit grün)? Fehlt etwas: hier nachziehen und melden.

**Erwartete Dateien:** `src/ui/hotkeys.ts`, `src/ui/goal.ts`, `src/ui/buildMenu.ts`, `src/ui/texts.ts`,
`src/ui/inspect.ts`, `src/ui/hints.ts`, `tests/ui/hotkeys.test.ts`, `tests/ui/goal.test.ts`, `tests/ui/tooltip.test.ts`,
`tests/ui/inspect.test.ts`, `tests/ui/hints.test.ts`, `README.md` („Tastatur und Maus", „Aufstieg"), `docs/arc42.md`
(§5 Zeilen `inspect.ts`, `hotkeys.ts`/`goal.ts`, falls dort Tasten genannt).
**Nicht anfassen:** `src/sim/**` (AK-R161-03: keine Stein-Reserve in `production.ts`), `src/render/**`, `src/audio/**`.

- [ ] **Schritt 1: Tests schreiben.**

`tests/ui/hotkeys.test.ts` (Import `tooltipLines` ist da):

```ts
describe('M11 Taste Y (Spec 7, 13-10)', () => {
  it('AK-UI-05 Y wählt die Jagdhütte; Rinderfarm ohne Taste; Y erst nach U2 in hotkeyList', () => {
    expect(hotkeyAction('y', NONE, false)).toEqual({
      kind: 'tool',
      tool: { kind: 'build', defId: 'hunter' },
    });
    expect(hotkeyAction('Y', NONE, false)).not.toBeNull();
    expect(hotkeyLabel({ kind: 'build', defId: 'hunter' })).toBe('Y');
    expect(hotkeyLabel({ kind: 'build', defId: 'cattlefarm' })).toBeNull();
    const w = createWorld(3, { crisisLevel: 'normal' });
    expect(hotkeyList(w).some((e) => e.key === 'Y')).toBe(false);
    w.unlocked = ['U0', 'U2'];
    expect(hotkeyList(w)).toContainEqual({ key: 'Y', label: 'Jagdhütte' });
    expect(tooltipLines({ kind: 'build', defId: 'hunter' })[0]).toBe('Jagdhütte (Y)');
    expect(tooltipLines({ kind: 'build', defId: 'cattlefarm' })[0]).toBe('Rinderfarm');
  });
});
```

`tests/ui/goal.test.ts` (Reihenfolge der Funktionen gegen `defs/unlocks.ts` prüfen; bei anderer Reihenfolge den
Test an die Defs anpassen, nicht umgekehrt):

```ts
describe('M11 Freischalt-Meldungen (Spec 4)', () => {
  const at = (ids: UnlockId[]) =>
    Object.assign(createWorld(3, { crisisLevel: 'normal' }), { unlocked: ids });
  const tail = '. Mehr unter Hilfe (?)';
  it('AK-UI-09 U3 nennt Rinderfarm und Ausbau Stufe 2, U5 Ausbau Stufe 3; U2 mit Jagdhütte (Y); kein „null", kein „Tick"', () => {
    const u2 = unlockNoticeText(['U0'], at(['U0', 'U2']))!;
    const u3 = unlockNoticeText(['U0', 'U2'], at(['U0', 'U2', 'U3']))!;
    const u5 = unlockNoticeText(['U0', 'U2', 'U3', 'U4'], at(['U0', 'U2', 'U3', 'U4', 'U5']))!;
    expect(u2).toBe(
      `Neu: Jagdhütte (Y), Steinbruch (B), Schäferei (G), Weberei (V), Kapelle (K), Feuerwache (E), Roden (C), Aufforsten (Q) — deine Pioniere wollen Siedler werden${tail}`,
    );
    expect(u3).toBe(
      `Neu: Rinderfarm, Amtsstube (I), Handelsaufträge, Ausbau Stufe 2 — die ersten Siedler sind da${tail}`,
    );
    expect(u5).toBe(
      `Neu: Werkzeugmacher (T), Ausgabesperre, Ausbau Stufe 3 — die ersten Bürger sind da${tail}`,
    );
    for (const s of [u2, u3, u5]) expect(s).not.toMatch(/null|Tick/);
  });
});
```

`tests/ui/tooltip.test.ts`:

```ts
describe('M11 Bauleisten-Tooltip (Spec 7)', () => {
  it('AK-UI-06 Tooltip: „Erzeugt" bleibt Stufe 1, darunter Ausstoss je Stufe; Kapelle ohne', () => {
    const t = tooltipLines({ kind: 'build', defId: 'fisher' });
    const i = t.indexOf('Erzeugt: Nahrung 15 / min');
    expect(i).toBeGreaterThan(0);
    expect(t[i + 1]).toBe('Ausstoss je Stufe: 15 · 25 · 37.5 / min');
    expect(tooltipLines({ kind: 'build', defId: 'hunter' })).toContain(
      'Ausstoss je Stufe: 12 · 20 · 30 / min',
    );
    expect(
      tooltipLines({ kind: 'build', defId: 'chapel' }).some((l) => l.startsWith('Ausstoss')),
    ).toBe(false);
  });
});
```

Weiter mit Schritt 1 (Haus-Panel, R161) in [T12b](T12b-ui-haus-bau.md).
