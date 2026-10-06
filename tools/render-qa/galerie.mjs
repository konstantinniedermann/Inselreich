/* global process, Buffer, console, URL */
// galerie.mjs — Galerie für Vorher/Nachher (ART-STIL-02): feste Motive je Seed als PNG, 1920x1080, DPR 2.
// Aufruf: node tools/render-qa/galerie.mjs --out <ordner> [--root <worktree>] [--seeds 1,2,5,7]
//   [--motive wald,gebirgsfuss,gebirge,kueste,wiese,siedlung,gesamt] [--zoom-extra] [--vite-port 5271]
//   [--chrome-port 9371] [--help]
// Bildnamen `s<seed>-<motiv>-z<zoom>.png` (Gesamt bei Zoom 0.5, Zoom 1.5 als `1.5`). `--zoom-extra` rendert je Motiv
// zusätzlich Zoom 1.5 und 2. Siedlung gibt es nur bei Seed 1 (Häuser nur bis Stufe 3: Stufe 4 ergibt einen unladbaren
// Stand). Nachtbild entfällt: `__inselDev` hat keinen Tageszeit-Hook. Nur Entwicklungswerkzeug.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ALL = ['wald', 'gebirgsfuss', 'gebirge', 'kueste', 'wiese', 'siedlung', 'gesamt'];
const USAGE =
  'Aufruf: galerie.mjs --out <ordner> [--root <wurzel>] [--seeds 1,2,5,7] [--motive ' +
  ALL.join(',') +
  ']\n        [--zoom-extra] [--vite-port 5271] [--chrome-port 9371] [--help]';
const opt = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const k = argv[i].replace(/^--/, '');
  if (k === 'help' || k === 'zoom-extra') opt[k] = true;
  else opt[k] = argv[++i];
}
if (opt.help) {
  console.log(USAGE);
  process.exit(0);
}
const root = resolve(opt.root ?? new URL('../..', import.meta.url).pathname);
const out = resolve(opt.out ?? `${root}/.studio/qa/galerie`);
const seeds = (opt.seeds ?? '1,2,5,7').split(',').map(Number);
const motive = (opt.motive ?? ALL.join(',')).split(',').map((m) => m.trim());
const vitePort = Number(opt['vite-port'] ?? 5271);
const chromePort = Number(opt['chrome-port'] ?? 9371);
if (seeds.some((s) => !Number.isInteger(s)) || motive.some((m) => !ALL.includes(m))) {
  console.error(`Ungültige Argumente.\n${USAGE}`);
  process.exit(2);
}
mkdirSync(out, { recursive: true });
const { sleep, withBrowser } = await import(pathToFileURL(`${root}/tools/render-qa/lib.mjs`).href);
const SPOT = {
  wald: 'forest',
  gebirgsfuss: 'mtnFoot',
  gebirge: 'mtn',
  kueste: 'beach',
  wiese: 'meadow',
  siedlung: 'town',
  gesamt: 'kontor',
};
const zoomsFor = (m) => (m === 'gesamt' ? [0.5] : opt['zoom-extra'] ? [1, 1.5, 2] : [1]);
await withBrowser({ root, width: 1920, height: 1080, dpr: 2, vitePort, chromePort }, async (c) => {
  for (const seed of seeds) {
    const info = JSON.parse(
      await c.ev(`(async () => {
      const { createWorld } = await import('/src/sim/world.ts');
      const { serialize } = await import('/src/sim/save.ts');
      const { placeRoad, placeBuilding } = await import('/src/sim/build.ts');
      const { BUILDING_DEFS } = await import('/src/sim/defs/buildings.ts');
      const { canPlace } = await import('/src/sim/placement.ts');
      const w = createWorld(${seed}, { unlockAll: true });
      w.money = 200000; const isl = w.islands[0]; for (const k of Object.keys(isl.stock)) isl.stock[k] = 400;
      const W = isl.width, H = isl.height, T = (x, y) => isl.tiles[y * W + x];
      const log = []; let bad = null; const DS = (await import('/src/sim/save.ts')).deserialize;
      const count = (pred, cx, cy, r) => { let n = 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue; if (pred(T(x, y).terrain, x, y)) n++; } return n; };
      const best = (score) => { let b = null, bs = -1; for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) { const s = score(x, y); if (s > bs) { bs = s; b = [x, y]; } } return b; };
      const forest = best((x, y) => count((t) => t === 'forest', x, y, 3));
      const mtnFoot = best((x, y) => { const m = count((t) => t === 'mountain', x, y, 3), g = count((t) => t === 'grass', x, y, 3); return Math.min(m, g); });
      const beach = best((x, y) => { const s = count((t) => t === 'sand', x, y, 3), wa = count((t) => t === 'water', x, y, 3); return Math.min(s, wa); });
      const meadow = best((x, y) => count((t) => t === 'grass', x, y, 4));
      const mtn = best((x, y) => count((t) => t === 'mountain', x, y, 4));
      let town = null;
      if (${seed} === 1) {
        const k = w.buildings[1]; const tx = k.x + 6, ty = k.y + 2; town = [tx, ty];
        for (let x = tx - 8; x <= tx + 6; x++) placeRoad(w, x, ty);
        for (let y = ty - 5; y <= ty + 5; y++) placeRoad(w, tx, y);
        for (let x = tx - 6; x <= tx + 6; x++) placeRoad(w, x, ty + 4);
        const adj = (d, x, y) => { for (let dy = -1; dy <= d.h; dy++) for (let dx = -1; dx <= d.w; dx++) { if (dx >= 0 && dx < d.w && dy >= 0 && dy < d.h) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; if (T(xx, yy).road) return true; } return false; };
        const put = (id, tier) => { const d = BUILDING_DEFS[id]; let b = null, bd = 1e9; for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { if (!adj(d, x, y)) continue; const dd = Math.hypot(x - tx, y - ty); if (dd >= bd) continue; if (!canPlace(w, id, x, y).ok) continue; bd = dd; b = [x, y]; } if (!b) { log.push(id + ' FEHLT'); return; } const r = placeBuilding(w, id, b[0], b[1]); if (!r.ok) { log.push(id + ' ' + r.reason); return; } if (tier) w.buildings[r.id].house.tier = tier; const dz = DS(serialize(w)); if (!dz.ok && !bad) { bad = id + 't' + tier; log.push('BRICHT ' + bad); } };
        for (let i = 0; i < 14; i++) put('house', [1, 2, 3][i % 3]);
        for (const id of ['market', 'chapel', 'school', 'weaver', 'sheepfarm', 'distillery', 'toolmaker', 'tavern', 'bathhouse']) if (BUILDING_DEFS[id]) put(id, 0);
        const near = (id, cx, cy) => { let b = null, bd = 1e9; for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { if (!canPlace(w, id, x, y).ok) continue; const dd = Math.hypot(x - cx, y - cy); if (dd < bd) { bd = dd; b = [x, y]; } } if (b) placeBuilding(w, id, b[0], b[1]); else log.push(id + ' FEHLT'); };
        if (BUILDING_DEFS.lumberjack) near('lumberjack', forest[0], forest[1]);
        if (BUILDING_DEFS.quarry) near('quarry', mtnFoot[0], mtnFoot[1]);
        if (BUILDING_DEFS.fisher) near('fisher', beach[0], beach[1]);
      }
      const json = serialize(w);
      const chk = (await import('/src/sim/save.ts')).deserialize(json);
      log.push('load ' + (chk.ok ? 'ok' : chk.reason));
      localStorage.removeItem('inselreich.save.v1');
      localStorage.setItem('inselreich.save.auto', json);
      return JSON.stringify({ seed: w.seed, log, forest, mtnFoot, beach, meadow, mtn, town, kontor: [w.buildings[1].x, w.buildings[1].y] });
    })()`),
    );
    console.log(JSON.stringify(info));
    await c.send('Page.navigate', { url: `http://127.0.0.1:${vitePort}/` });
    await sleep(3500);
    const click = (t) =>
      c.ev(
        `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(t)})); if(!b) return false; b.click(); return true;})()`,
      );
    console.log('fortsetzen', await click('Fortsetzen'));
    await sleep(2500);
    for (const m of motive) {
      const p = info[SPOT[m]];
      if (!p) continue;
      for (const z of zoomsFor(m)) {
        await c.ev(
          `window.__inselDev.setZoom(${z}); window.__inselDev.centerOn(${p[0]}, ${p[1]}); 1`,
        );
        await sleep(3000);
        const shot = await c.send('Page.captureScreenshot', { format: 'png' });
        writeFileSync(`${out}/s${seed}-${m}-z${z}.png`, Buffer.from(shot.data, 'base64'));
        console.log('ok', seed, m, z, p);
      }
    }
  }
});
