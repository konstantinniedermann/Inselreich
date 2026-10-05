/* global process, console */
// perf.mjs — renderMedian im Headless-Chrome, A/B zweier Arbeitsstände (H-R7 AK7, H-R9 A8). Gleicher Messweg wie
// H-R2/H-R6 (`?perf=1`, `__inselPerf`, pausiert, 15 s Einlaufen). Software-Rendering misst nicht belastbar; beide
// Seiten laufen unter gleichen Bedingungen und abwechselnd (A, B, A, B, …), verglichen wird der Median der Mediane.
//
// Aufruf (benannte Argumente, alle optional ausser den Wurzeln):
//   node tools/render-qa/perf.mjs --a <wurzelA> --b <wurzelB> [--seed 14 | --save <spielstand.json>]
//        [--runs 3] [--dpr 2] [--w 1920] [--h 1080] [--focus mountain|none]
// Spielstand: `--seed N` erzeugt die Welt im Seitenkontext reproduzierbar mit `createWorld(N, { unlockAll: true })`
// der jeweiligen Wurzel und legt sie als Autosave ab; `--save` nimmt eine Datei (z. B. `leistung-50`). `--focus
// mountain` zentriert die Kamera (Zoom 1, Startwert) über die Dev-Sonde auf die grösste Gebirgskomponente.
// H-R9-Messung: `--seed 14 --dpr 2 --w 1920 --h 1080 --focus mountain` (Seed 14: grösstes Gebirge, 528 Kacheln).
// Altes Format (Positionsargumente `<savejson> <wurzelA> <wurzelB> [läufe] [dpr]`) bleibt gültig.
import { readFileSync } from 'node:fs';
import { sleep, withBrowser } from './lib.mjs';

const argv = process.argv.slice(2);
const opt = {};
if (argv[0] && !argv[0].startsWith('--')) {
  [opt.save, opt.a, opt.b, opt.runs, opt.dpr] = argv;
} else for (let i = 0; i < argv.length; i += 2) opt[argv[i].replace(/^--/, '')] = argv[i + 1];
const runs = Number(opt.runs ?? 3),
  dpr = Number(opt.dpr ?? 1),
  width = Number(opt.w ?? 1280),
  height = Number(opt.h ?? 800);
const focus = opt.focus ?? (opt.seed ? 'mountain' : 'none');
if (!opt.a || !opt.b || (!opt.seed && !opt.save)) {
  console.error(
    'Aufruf: perf.mjs --a <wurzelA> --b <wurzelB> (--seed N | --save datei) [--runs] [--dpr] [--w] [--h]',
  );
  process.exit(2);
}
const json = opt.save ? readFileSync(opt.save, 'utf8') : null;
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

/** Seitenskript: Spielstand ablegen (Datei oder Seed). */
const STORE = (seed) =>
  json !== null
    ? `localStorage.removeItem('inselreich.save.v1'); localStorage.setItem('inselreich.save.auto', ${JSON.stringify(json)}); 1`
    : `(async () => {
        const { createWorld } = await import('/src/sim/world.ts');
        const { serialize } = await import('/src/sim/save.ts');
        localStorage.removeItem('inselreich.save.v1');
        localStorage.setItem('inselreich.save.auto', serialize(createWorld(${Number(seed)}, { unlockAll: true })));
        return 1;
      })()`;
/** Seitenskript: Mitte der grössten Gebirgskomponente (4er-Nachbarschaft) als Kachel, sonst null. */
const MOUNTAIN = `(async () => {
  const { home } = await import('/src/sim/world.ts');
  const world = window.__inselDev?.world(); if (!world) return null;
  const w = home(world);
  const seen = new Int32Array(w.width * w.height).fill(-1); let best = null;
  for (let i = 0; i < seen.length; i++) {
    if (w.tiles[i].terrain !== 'mountain' || seen[i] >= 0) continue;
    const st = [i], tiles = []; seen[i] = i;
    while (st.length) { const j = st.pop(); tiles.push(j); const x = j % w.width, y = (j / w.width) | 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w.width || ny >= w.height) continue; const k = ny * w.width + nx;
        if (seen[k] < 0 && w.tiles[k].terrain === 'mountain') { seen[k] = i; st.push(k); } } }
    if (!best || tiles.length > best.length) best = tiles;
  }
  if (!best) return null;
  const cx = best.reduce((s, j) => s + (j % w.width), 0) / best.length;
  const cy = best.reduce((s, j) => s + ((j / w.width) | 0), 0) / best.length;
  window.__inselDev.centerOn(Math.round(cx), Math.round(cy));
  return { x: Math.round(cx), y: Math.round(cy), n: best.length };
})()`;

async function once(root, n) {
  const port = 5170 + n;
  return withBrowser(
    { dpr, width, height, root, path: '/?perf=1', vitePort: port, chromePort: 9270 + n },
    async (c) => {
      await c.ev(STORE(opt.seed));
      await c.send('Page.navigate', { url: `http://127.0.0.1:${port}/?perf=1` });
      await sleep(3000);
      const click = (t) =>
        c.ev(
          `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(t)})); if(!b) return false; b.click(); return true;})()`,
        );
      await click('Fortsetzen');
      await sleep(1500);
      await click('⏸');
      const at = focus === 'mountain' ? await c.ev(MOUNTAIN) : null;
      await sleep(15000);
      const p = JSON.parse(await c.ev('JSON.stringify(window.__inselPerf)'));
      const r = await c.ev('JSON.stringify(globalThis.__inselRender ?? null)');
      return { ...p, at, render: r && JSON.parse(r) };
    },
  );
}
const res = { A: [], B: [] };
for (let i = 0; i < runs; i++) {
  for (const [k, root] of [
    ['A', opt.a],
    ['B', opt.b],
  ]) {
    const r = await once(root, i * 2 + (k === 'A' ? 0 : 1));
    res[k].push(r);
    console.log(
      k,
      JSON.stringify({
        renderMedian: r.renderMedian,
        renderP95: r.renderP95,
        frameMedian: r.frameMedian,
        n: r.n,
        focus: r.at,
        sprite: r.render && {
          h: r.render.spriteHits,
          m: r.render.spriteMisses,
          b: r.render.spriteBytes,
        },
        massif: r.render && {
          draws: r.render.massifDraws,
          misses: r.render.massifMisses,
          bytes: r.render.massifBytes,
        },
      }),
    );
  }
}
const mA = med(res.A.map((r) => r.renderMedian)),
  mB = med(res.B.map((r) => r.renderMedian));
console.log(
  JSON.stringify({
    dpr,
    view: `${width}x${height}`,
    seed: opt.seed ?? null,
    medianA: mA,
    medianB: mB,
    deltaPct: +(((mB - mA) / mA) * 100).toFixed(1),
  }),
);
