import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { ausschnitt, bogen, elementPunkt, pngRgba, type KontaktArt } from './massifKontakt';

// Erzeuger der Kontaktbögen (ART-STIL-02 L6, AK §7): je Element ein PNG mit Ausschnitten bei f = 2 über die Seeds
// 1–20 (Seeds ohne Element fehlen; die Reihenfolge steht in `<art>.txt`):
//   VITE_GEN_KONTAKT=/pfad/zum/ordner npx vitest run tests/render/fixtures/massifKontakt.gen.test.ts
// Ohne die Variable tut dieser Test nichts. VITE_GEN_KONTAKT_SEEDS="1-40" überschreibt den Seedbereich.
const dir = import.meta.env.VITE_GEN_KONTAKT as string | undefined;
describe.skipIf(!dir)('Kontaktbögen Entdecken erzeugen', () => {
  it('schreibt see, wasserfall, hoehle, steinmaennchen', { timeout: 120000 }, () => {
    const [a, b] = ((import.meta.env.VITE_GEN_KONTAKT_SEEDS as string | undefined) ?? '1-20')
      .split('-')
      .map(Number) as [number, number];
    mkdirSync(dir!, { recursive: true });
    const TW = 192,
      TH = 160;
    for (const art of ['see', 'wasserfall', 'hoehle', 'steinmaennchen'] as KontaktArt[]) {
      const tiles: Uint8Array[] = [];
      const seeds: number[] = [];
      for (let seed = a; seed <= b; seed++) {
        const p = elementPunkt(seed, art);
        if (!p) continue;
        tiles.push(ausschnitt(seed, p.x, p.y, TW, TH, 2));
        seeds.push(seed);
      }
      if (!tiles.length) continue;
      const sheet = bogen(tiles, TW, TH, 5);
      writeFileSync(`${dir}/${art}.png`, pngRgba(sheet.w, sheet.h, sheet.data));
      writeFileSync(
        `${dir}/${art}.txt`,
        `Seeds (Reihenfolge links nach rechts, oben nach unten): ${seeds.join(', ')}\n`,
      );
    }
  });
});
