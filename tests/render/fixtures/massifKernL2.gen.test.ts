import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { KERN_SEEDS, kernNodes } from './massifKern';

// Erzeuger der Fixture `massif-kern-l2.json` (ART-STIL-02 L6-T0, einmalig auf der unveränderten Basis c88f4b6,
// also nach L2): VITE_GEN_KERN_L2=1 npx vitest run tests/render/fixtures/massifKernL2.gen.test.ts
// Ohne die Variable tut dieser Test nichts. `massif-kern-main.json` (Stand vor L2) bleibt unverändert.
describe.skipIf(!import.meta.env.VITE_GEN_KERN_L2)('Fixture Gebirgskern nach L2 erzeugen', () => {
  it('schreibt massif-kern-l2.json', () => {
    const out: Record<string, unknown> = {};
    for (const seed of KERN_SEEDS) {
      // je Knoten: [comp, I, J, h (1 Dezimale), r, g, b]
      out[String(seed)] = {
        nodes: kernNodes(seed).map((n) => [n.comp, n.I, n.J, Math.round(n.h * 10) / 10, ...n.rgb]),
      };
    }
    writeFileSync('tests/render/fixtures/massif-kern-l2.json', JSON.stringify(out));
  });
});
