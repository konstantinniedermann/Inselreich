/* global process, Buffer, console */
// sichtvergleich.mjs — Sichtvergleich Sprite-Cache gegen ungecachtes Zeichnen (H-R7 AK6, R191).
// Aufruf: node tools/render-qa/sichtvergleich.mjs [ausgabeverzeichnis]   (Standard: .studio/qa/H-R7)
// Zeichnet dieselbe Szene (alle Typen und Stufen, alle Varianten) bei DPR 1 und 2 sowie Zoom 0,75 und 1,5 auf zwei
// Leinwände, vergleicht Pixel für Pixel und gibt Zahlen aus; PNGs: <dpr>x-z<zoom>-{ungecacht,cache,diff}.png.
// Kamera absichtlich auf Bruchteil-Position (Worst Case für den Ganzpixel-Stempel); Material aus (nur Kanten).
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { repoRoot, withBrowser } from './lib.mjs';

const out = resolve(process.argv[2] ?? `${repoRoot}/.studio/qa/H-R7`);
mkdirSync(out, { recursive: true });

const PAGE = (dpr, zoom, camFrac) => `(async () => {
  const { BUILDING_DEFS } = await import('/src/sim/defs/buildings.ts');
  const { drawBody } = await import('/src/render/sprites.ts');
  const { createSpriteCache } = await import('/src/render/spriteCache.ts');
  const { VARIANT_COUNT } = await import('/src/render/variants.ts');
  const dpr = ${dpr}, zoom = ${zoom}, W = 900, H = 640;
  const mkCanvas = () => { const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr; return c; };
  const items = [];
  let n = 0;
  for (const id of Object.keys(BUILDING_DEFS)) {
    const tiers = id === 'house' ? [1, 2, 3, 4] : [undefined];
    for (const tier of tiers) {
      const b = { id: ++n, defId: id, x: 8 + (n % 7) * 3, y: 8 + Math.floor(n / 7) * 3, connected: true, progress: 0, state: 'ok' };
      if (tier) b.house = { tier };
      items.push([BUILDING_DEFS[id], b, n % VARIANT_COUNT]);
    }
  }
  items.sort((p, q) => (p[1].x + p[1].y) - (q[1].x + q[1].y));
  const cam = { x: ${camFrac.x} + 60, y: ${camFrac.y} + 80, zoom };
  const bg = (ctx) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W * dpr, H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const a = mkCanvas(), b2 = mkCanvas();
  const ca = a.getContext('2d'), cb = b2.getContext('2d');
  bg(ca); bg(cb);
  for (const [d, b, v] of items) drawBody(ca, cam, d, b, 0, undefined, v);
  const cache = createSpriteCache({ material: false });
  cache.beginFrame(zoom, dpr); cache.beginFrame(zoom, dpr);
  let hits = 0, shift = [];
  const origDraw = cb.drawImage.bind(cb);
  cb.drawImage = (img, dx, dy, w, h) => { origDraw(img, dx, dy, w, h); };
  for (const [d, b, v] of items) { if (!cache.draw(cb, cam, d, b, undefined, v)) drawBody(cb, cam, d, b, 0, undefined, v); else hits++; }
  // Geometrischer Versatz des Stempels in Geräte-Pixeln (Soll: Ursprung ohne Rundung)
  const { spriteBounds } = await import('/src/render/iso.ts');
  for (const [d, b] of items) {
    const sb = spriteBounds(d, b);
    const ex = (sb.x - cache.margin - cam.x) * zoom * dpr, ey = (sb.y - cache.margin - cam.y) * zoom * dpr;
    shift.push(Math.hypot(Math.round(ex) - ex, Math.round(ey) - ey), Math.abs(Math.round(ex) - ex), Math.abs(Math.round(ey) - ey));
  }
  const A = ca.getImageData(0, 0, W * dpr, H * dpr).data, B = cb.getImageData(0, 0, W * dpr, H * dpr).data;
  const diff = document.createElement('canvas'); diff.width = W * dpr; diff.height = H * dpr;
  const dctx = diff.getContext('2d'); const D = dctx.createImageData(W * dpr, H * dpr);
  let max = 0, sum = 0, inked = 0, over32 = 0, over96 = 0, over200 = 0;
  const shiftErr = (dx, dy) => { let s = 0, c = 0; for (let y = 2; y < H * dpr - 2; y++) for (let x = 2; x < W * dpr - 2; x++) { const i = (y * W * dpr + x) * 4, j = ((y + dy) * W * dpr + x + dx) * 4; s += Math.abs(A[i] - B[j]) + Math.abs(A[i + 1] - B[j + 1]) + Math.abs(A[i + 2] - B[j + 2]); c++; } return s / c / 3; };
  for (let i = 0; i < A.length; i += 4) {
    const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2]));
    if (A[i] !== 255 || A[i + 1] !== 255 || A[i + 2] !== 255 || B[i] !== 255 || B[i + 1] !== 255 || B[i + 2] !== 255) inked++;
    max = Math.max(max, d); sum += d; if (d > 32) over32++; if (d > 96) over96++; if (d > 200) over200++;
    D.data[i] = 255 - d; D.data[i + 1] = 255 - d; D.data[i + 2] = 255 - d; D.data[i + 3] = 255;
  }
  dctx.putImageData(D, 0, 0);
  const px = W * H * dpr * dpr;
  const best = {}; for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) best[dx + ',' + dy] = +shiftErr(dx, dy).toFixed(3);
  const res = {
    dpr, zoom, items: items.length, hits,
    stampOffsetMaxDevPx: +Math.max(...shift.filter((_, i) => i % 3 === 1 || i % 3 === 2)).toFixed(3),
    stampOffsetMeanDevPx: +(shift.filter((_, i) => i % 3 === 0).reduce((s, v) => s + v, 0) / items.length).toFixed(3),
    maxDiff255: max, meanDiff255: +(sum / (A.length / 4)).toFixed(4),
    inkedPx: inked, share32: +(over32 / inked).toFixed(4), share96: +(over96 / inked).toFixed(4), share200: +(over200 / inked).toFixed(4),
    meanErrByIntegerShift: best,
    png: { ungecacht: a.toDataURL('image/png'), cache: b2.toDataURL('image/png'), diff: diff.toDataURL('image/png') },
  };
  return JSON.stringify(res);
})()`;

const rows = [];
for (const dpr of [1, 2]) {
  await withBrowser(
    { dpr, width: 1000, height: 700, vitePort: 5190 + dpr, chromePort: 9290 + dpr },
    async (c) => {
      for (const zoom of [0.75, 1.5]) {
        const r = JSON.parse(await c.ev(PAGE(dpr, zoom, { x: 0.37, y: 0.81 })));
        for (const [k, v] of Object.entries(r.png)) {
          writeFileSync(`${out}/${dpr}x-z${zoom}-${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
        }
        delete r.png;
        rows.push(r);
        console.log(JSON.stringify(r));
      }
    },
  );
}
writeFileSync(`${out}/sichtvergleich.json`, JSON.stringify(rows, null, 2));
