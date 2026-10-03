/* global process, Buffer, console */
// probenblatt.mjs — Probenblätter für den Blindtest (H-R7 AK3): je Typ (und Hausstufe) ein PNG mit allen Varianten
// nebeneinander. Dateinamen neutral (blatt-01.png …, Reihenfolge gemischt), Zuordnung und Spaltenreihenfolge
// stehen nur in key.json. Aufruf: node tools/render-qa/probenblatt.mjs [ausgabeverzeichnis] [zoom] [dpr]
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { repoRoot, withBrowser } from './lib.mjs';

const out = resolve(process.argv[2] ?? `${repoRoot}/.studio/qa/H-R7`);
const zoom = Number(process.argv[3] ?? 1.5);
const dpr = Number(process.argv[4] ?? 2);
mkdirSync(out, { recursive: true });

const PAGE = `(async () => {
  const { BUILDING_DEFS } = await import('/src/sim/defs/buildings.ts');
  const { drawBody } = await import('/src/render/sprites.ts');
  const { createSpriteCache } = await import('/src/render/spriteCache.ts');
  const { VARIANT_COUNT } = await import('/src/render/variants.ts');
  const { PALETTE } = await import('/src/render/palette.ts');
  const { hash2 } = await import('/src/sim/noise.ts');
  const zoom = ${zoom}, dpr = ${dpr};
  // Sortierung deterministisch gemischt (Dateinummer verrät den Typ nicht)
  const entries = [];
  for (const id of Object.keys(BUILDING_DEFS))
    for (const tier of id === 'house' ? [1, 2, 3, 4] : [undefined]) entries.push({ id, tier });
  entries.sort((a, b) => hash2(77, a.id.length * 31 + (a.tier ?? 0), a.id.charCodeAt(0)) - hash2(77, b.id.length * 31 + (b.tier ?? 0), b.id.charCodeAt(0)));
  const cellW = 150 * zoom, cellH = 210 * zoom;
  const sheets = [], key = [];
  const cache = createSpriteCache({ material: true });
  cache.beginFrame(zoom, dpr); cache.beginFrame(zoom, dpr);
  entries.forEach((e, n) => {
    const def = BUILDING_DEFS[e.id];
    const order = [...Array(VARIANT_COUNT).keys()].sort((a, b) => hash2(n + 5, a, 3) - hash2(n + 5, b, 3));
    const c = document.createElement('canvas');
    c.width = Math.round(cellW * VARIANT_COUNT * dpr); c.height = Math.round(cellH * dpr);
    const ctx = c.getContext('2d');
    ctx.fillStyle = PALETTE.grass; ctx.fillRect(0, 0, c.width, c.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    order.forEach((v, col) => {
      const b = { id: 1, defId: e.id, x: 4, y: 4, connected: true, progress: 0, state: 'ok' };
      if (e.tier) b.house = { tier: e.tier };
      // Gebäudemitte in die Zellenmitte
      const mx = (b.x - b.y) * 32 + ((def.w - def.h) * 32) / 2, my = (b.x + b.y + (def.w + def.h) / 2) * 16 - 12;
      const cam = { x: mx - (col * cellW + cellW / 2) / zoom, y: my - (0.65 * cellH) / zoom, zoom };
      if (!cache.draw(ctx, cam, def, b, undefined, v)) drawBody(ctx, cam, def, b, 0, undefined, v);
    });
    sheets.push(c.toDataURL('image/png'));
    key.push({ file: 'blatt-' + String(n + 1).padStart(2, '0') + '.png', defId: e.id, tier: e.tier ?? null, spaltenVarianten: order });
  });
  return JSON.stringify({ sheets, key });
})()`;

await withBrowser(
  { dpr, width: 1000, height: 700, vitePort: 5185, chromePort: 9285 },
  async (c) => {
    const r = JSON.parse(await c.ev(PAGE));
    r.sheets.forEach((s, i) =>
      writeFileSync(`${out}/${r.key[i].file}`, Buffer.from(s.split(',')[1], 'base64')),
    );
    writeFileSync(`${out}/key.json`, JSON.stringify({ zoom, dpr, blaetter: r.key }, null, 2));
    console.log(`${r.sheets.length} Blätter nach ${out}, Schlüssel in key.json`);
  },
);
