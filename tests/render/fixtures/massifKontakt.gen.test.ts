import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { createWorld } from '../../../src/sim/world';
import { ausschnitt, bogen, elementPunkt, pngRgba, type KontaktArt } from './massifKontakt';

// Erzeuger der Kontaktbögen (ART-STIL-02 L6, AK §7): je Element ein PNG mit Ausschnitten bei f = 2 über die Seeds
// 1–20 (Seeds ohne Element fehlen; die Reihenfolge steht in `<art>.txt`):
//   VITE_GEN_KONTAKT=/pfad/zum/ordner npx vitest run tests/render/fixtures/massifKontakt.gen.test.ts
// Ohne die Variable tut dieser Test nichts. VITE_GEN_KONTAKT_SEEDS="1-40" überschreibt den Seedbereich.
const dir = import.meta.env.VITE_GEN_KONTAKT as string | undefined;
describe.skipIf(!dir)('Kontaktbögen Entdecken erzeugen', () => {
  it('schreibt see, wasserfall, hoehle, steinmaennchen', { timeout: 120000 }, () => {
    const [a, b] = ((import.meta.env.VITE_GEN_KONTAKT_SEEDS as string | undefined) ?? '1-60')
      .split('-')
      .map(Number) as [number, number];
    mkdirSync(dir!, { recursive: true });
    // 20 verschiedene Karten: Seeds mit gleichem `world.seed` (seedUsed der Kartenerzeugung) zählen einmal
    const maps = new Set<number>();
    const seedsUsed: number[] = [];
    for (let seed = a; seed <= b && seedsUsed.length < 20; seed++) {
      const ws = createWorld(seed, { unlockAll: true }).seed;
      if (maps.has(ws)) continue;
      maps.add(ws);
      seedsUsed.push(seed);
    }
    for (const art of ['see', 'wasserfall', 'hoehle', 'steinmaennchen'] as KontaktArt[]) {
      const found = seedsUsed
        .map((seed) => ({ seed, p: elementPunkt(seed, art) }))
        .filter((e): e is { seed: number; p: NonNullable<typeof e.p> } => e.p !== null);
      if (!found.length) continue;
      // Ausschnittgrösse bei f = 2: gross genug für das grösste Element (Wasserfall: ganzer Lauf)
      const TW = Math.max(192, Math.ceil(Math.max(...found.map((e) => e.p.w)) * 2)),
        TH = Math.max(160, Math.ceil(Math.max(...found.map((e) => e.p.h)) * 2));
      const tiles = found.map((e) => ausschnitt(e.seed, e.p.x, e.p.y, TW, TH, 2));
      const cols = TW > 300 ? 3 : 5;
      const sheet = bogen(tiles, TW, TH, cols);
      writeFileSync(`${dir}/${art}.png`, pngRgba(sheet.w, sheet.h, sheet.data));
      writeFileSync(
        `${dir}/${art}.txt`,
        `Seeds (Reihenfolge links nach rechts, oben nach unten): ${found.map((e) => e.seed).join(', ')}\nKarten: die ersten 20 verschiedenen world.seed aus den Seeds ${a}-${b}\n`,
      );
    }
  });
});
