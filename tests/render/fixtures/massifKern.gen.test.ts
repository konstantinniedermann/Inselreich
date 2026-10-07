import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { KERN_SEEDS, bandNoise, kernNodes } from './massifKern';

// Erzeuger der Fixture `massif-kern-main.json` (einmalig auf dem Stand vor L2):
//   VITE_GEN_KERN=1 npx vitest run tests/render/fixtures/massifKern.gen.test.ts
// Ohne die Variable tut dieser Test nichts.
describe.skipIf(!import.meta.env.VITE_GEN_KERN)('Fixture Gebirgskern erzeugen', () => {
  it('schreibt massif-kern-main.json', () => {
    const out: Record<string, unknown> = {};
    for (const seed of KERN_SEEDS) {
      out[String(seed)] = {
        // je Knoten: [comp, I, J, h (1 Dezimale), r, g, b]
        nodes: kernNodes(seed).map((n) => [n.comp, n.I, n.J, Math.round(n.h * 10) / 10, ...n.rgb]),
        sockelRauschen: bandNoise(seed, 0.8),
      };
    }
    writeFileSync('tests/render/fixtures/massif-kern-main.json', JSON.stringify(out));
  });
});
