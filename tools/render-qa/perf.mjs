/* global process, console */
// perf.mjs — renderMedian im Headless-Chrome (H-R7 AK7), gleicher Messweg wie H-R2/H-R6 (`?perf=1`, `__inselPerf`,
// Spielstand `leistung-50`, 1280x800, pausiert, 15 s Einlaufen). Software-Rendering misst nicht belastbar; beide Seiten
// laufen gleich und abwechselnd. Aufruf: node tools/render-qa/perf.mjs <savejson> <wurzelA> <wurzelB> [läufe] [dpr]
import { readFileSync } from 'node:fs';
import { sleep, withBrowser } from './lib.mjs';

const [save, rootA, rootB, runs = '3', dprArg = '1'] = process.argv.slice(2);
const dpr = Number(dprArg);
const json = readFileSync(save, 'utf8');
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

async function once(root, n) {
  return withBrowser(
    { dpr, root, path: '/?perf=1', vitePort: 5170 + n, chromePort: 9270 + n },
    async (c) => {
      await c.ev(
        `localStorage.removeItem('inselreich.save.v1'); localStorage.setItem('inselreich.save.auto', ${JSON.stringify(json)}); 1`,
      );
      await c.send('Page.navigate', { url: `http://127.0.0.1:${5170 + n}/?perf=1` });
      await sleep(3000);
      const click = (t) =>
        c.ev(
          `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(t)})); if(!b) return false; b.click(); return true;})()`,
        );
      await click('Fortsetzen');
      await sleep(1500);
      await click('⏸');
      await sleep(15000);
      const p = JSON.parse(await c.ev('JSON.stringify(window.__inselPerf)'));
      const r = await c.ev('JSON.stringify(globalThis.__inselRender ?? null)');
      return { ...p, render: r && JSON.parse(r) };
    },
  );
}
const res = { A: [], B: [] };
for (let i = 0; i < Number(runs); i++) {
  for (const [k, root] of [
    ['A', rootA],
    ['B', rootB],
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
        sprite: r.render && {
          h: r.render.spriteHits,
          m: r.render.spriteMisses,
          b: r.render.spriteBytes,
        },
      }),
    );
  }
}
const mA = med(res.A.map((r) => r.renderMedian)),
  mB = med(res.B.map((r) => r.renderMedian));
console.log(
  JSON.stringify({ dpr, medianA: mA, medianB: mB, deltaPct: +(((mB - mA) / mA) * 100).toFixed(1) }),
);
