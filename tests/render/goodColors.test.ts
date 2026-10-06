import { describe, expect, it } from 'vitest';
import { GOOD_COLORS } from '../../src/render/overlays';
import { LOAD_COLOR } from '../../src/render/errands';
import { ICONS } from '../../src/ui/icons';
import { PALETTE } from '../../src/render/palette';
import { GOOD_IDS } from '../../src/sim/defs/goods';

// D-144 Regel (2): Gewürz hat einen eigenen Farbton, verschieden von jedem anderen Gut.
describe('D-144 Gewürz-Farbe', () => {
  const others = GOOD_IDS.filter((g) => g !== 'spice');

  it('GOOD_COLORS: spice gesetzt und ≠ jede andere Warenfarbe', () => {
    expect(GOOD_COLORS.spice).toBeDefined();
    for (const g of others) expect(GOOD_COLORS.spice, g).not.toBe(GOOD_COLORS[g]);
  });
  it('LOAD_COLOR: spice ≠ jede andere Lastfarbe', () => {
    for (const g of others) expect(LOAD_COLOR.spice, g).not.toBe(LOAD_COLOR[g]);
  });
  it('Chip (Symbol): spice-Farbe ≠ jede andere Gut-Farbe', () => {
    const color = (g: (typeof GOOD_IDS)[number]): string => PALETTE[ICONS[g].color];
    for (const g of others) expect(color('spice'), g).not.toBe(color(g));
  });
});
