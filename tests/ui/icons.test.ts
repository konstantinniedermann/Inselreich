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
  'spice',
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
  it('AK-A1-01 genau 25 Ids; Label eindeutig; Pfade nur SVG-Befehle; kein url(, href, http, Emoji', () => {
    expect([...ICON_IDS].sort()).toEqual([...EXPECTED].sort());
    expect(new Set(ICON_IDS.map((id) => ICONS[id].label)).size).toBe(25);
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
