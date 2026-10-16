> **Task-ID:** Paket A1 (lead-art)
> **AK-IDs:** AK-A1-01 … -03 (siehe abdeckung.md)
> **blocked-by:** Gate Plan; Task 9 wartet auf A1 (Review OK)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md)

## Paket A1 (lead-art): Symbolsatz `icons.ts`

**Controller** `lead-art` · **Arbeiter** `art-rendering-engineer` · **Worktree/Branch** `.worktrees/m10-icons` ·
`feat/m10-icons` (ab `main` nach dem Gate Plan) · **AK** AK-A1-01, -02 (Vitest); AK-A1-03 in QA-ART

- [ ] **Schritt 1: Failing test** `tests/ui/icons.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PALETTE } from '../../src/render/palette';
import { ICON_IDS, ICONS, iconSvg } from '../../src/ui/icons';

const EXPECTED = [
  'wood',
  'tools',
  'stone',
  'food',
  'wool',
  'cloth',
  'cane',
  'rum',
  'glass',
  'tier-1',
  'tier-2',
  'tier-3',
  'tier-4',
  'money',
  'balance',
  'tax',
  'faith',
  'school',
  'bath',
  'help',
  'cat-infrastructure',
  'cat-housing',
  'cat-production',
  'cat-public',
];
const EMOJI = /\p{Extended_Pictographic}/u;

describe('M10 Symbolsatz (Spec 14)', () => {
  it('AK-A1-01 genau 24 Ids; Label eindeutig; Pfade nur SVG-Befehle; kein url(, href, http, Emoji', () => {
    expect([...ICON_IDS].sort()).toEqual([...EXPECTED].sort());
    expect(new Set(ICON_IDS.map((id) => ICONS[id].label)).size).toBe(24);
    for (const id of ICON_IDS) {
      const i = ICONS[id];
      expect(i.label.length).toBeGreaterThan(0);
      expect(i.paths.length).toBeGreaterThan(0);
      for (const p of i.paths) expect(p).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9 ,.-]+$/);
      const all = JSON.stringify(i) + iconSvg(id);
      for (const bad of ['url(', 'href', 'http']) expect(all).not.toContain(bad);
      expect(EMOJI.test(all)).toBe(false);
    }
  });
  it('AK-A1-02 Farben aus PALETTE; iconSvg mit viewBox 0 0 16 16, aria-hidden, focusable false', () => {
    for (const id of ICON_IDS) {
      expect(Object.keys(PALETTE)).toContain(ICONS[id].color);
      const svg = iconSvg(id);
      expect(svg).toContain('viewBox="0 0 16 16"');
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
    }
  });
});
```

- [ ] **Schritt 2:** rot (`Cannot find module '../../src/ui/icons'`). **Schritt 3:** `src/ui/icons.ts` (Typ `IconId`,
      `ICON_IDS`, `ICONS: Record<IconId, { label: string; paths: string[]; color: keyof typeof PALETTE }>`,
      `iconSvg(id)` mit `fill` aus `PALETTE[color]`), Gestaltung `lead-art` (Strichstärke, Silhouette „Figur mit 1–4
      Merkmalen" für Stufen). **Schritt 4:** `make check`, Commit `feat: M10-A1 Symbolsatz Schritt 1 (Spec 14)`, push.
- Review: `qa-code-reviewer` (Start aus dem lead-art-Budget). Nach dem Gate Merge M8 merged `lead-art` `main` in
  `feat/m10-icons` (nur falls `palette.ts` sich geändert hat), `make check`, push, SHA an den Controller (Task 9).
