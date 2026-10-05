/* global process, console, fetch */
// perf.mjs — renderMedian im Headless-Chrome, A/B zweier Arbeitsstände (H-R7 AK7, H-R9 A8; M12 E1 T07). Gleicher
// Messweg wie H-R2/H-R6 (`?perf=1`, `__inselPerf`, pausiert). Software-Rendering misst nicht belastbar; beide
// Seiten laufen unter gleichen Bedingungen und abwechselnd (A, B, A, B, …), verglichen wird der Median der Mediane.
//
// Aufruf (benannte Argumente, alle optional ausser den Wurzeln):
//   node tools/render-qa/perf.mjs --a <wurzelA> --b <wurzelB> [--seed 14 | --save <spielstand.json>]
//        [--runs 3] [--dpr 2] [--w 1920] [--h 1080] [--zoom 1] [--focus home|archipel|mountain|none]
//        [--warm 5000] [--idle] [--help]
// Spielstand: `--seed N` erzeugt die Welt im Seitenkontext reproduzierbar mit `createWorld(N, { unlockAll: true })`
// der jeweiligen Wurzel und legt sie als Autosave ab; `--save` nimmt eine Datei (z. B. `leistung-50`).
// Schalter:
//   --zoom <z>      Kamerazoom (Standard 1) über `__inselDev.setZoom`.
//   --focus <f>     `home`/`archipel` über `__inselDev.focus`; `mountain` zentriert auf die grösste Gebirgskomponente
//                   (Standard bei --seed), `none` lässt die Startkamera. Fehlen `setZoom`/`focus` (Wurzel = main),
//                   sind nur `--zoom 1 --focus home` (und mountain/none bei Zoom 1) zulässig, sonst Abbruch.
//   --warm <ms>     (Standard 5000) Warten auf `cachesReady()` (Limit 60 s, sonst Fehler), dann Zoom/Fokus setzen,
//                   `--warm` ms warten, dann Messfenster 15 s. Ohne `cachesReady` (main) entfällt nur das Warten darauf.
//   --idle          Messfenster ab erstem Frame nach dem Laden (Fortsetzen) bis `cachesReady()`; ausgegeben werden
//                   `frameMax` (ohne Notfall-Frames), `emergencyFrames` getrennt sowie Median/p95/Maximum von
//                   `slices()` (Leerlauf-Scheiben, ms) und `emergency()`. Die Probe hält ein Fenster von 600 Frames.
// Ausgabe: Kopfzeile (CPU, OS, Node, Chrome, DPR, Fenster, Seed, Zoom, Fokus), je Lauf eine Ergebniszeile je Seite
// mit `buildMs` (Konsole `[terrain] Aufbau <ms> ms`), am Ende die Zusammenfassung. Je Seed ein eigener Aufruf, kein
// Mittel über Seeds.
// Messprotokoll (P-9, T07): Entwickler-Mac, Headless, DPR 2, 1920x1080, `--runs 3`, abwechselnd A/B, Seeds 14 und 3.
//   AK-E1-14/15: --a A --b B --seed s --zoom 1 --focus home          (renderMedian B-A <= +0,2 ms; buildMs <= 1,3x)
//   AK-E1-16:    B allein: --zoom 0.125 --focus archipel --warm 5000 gegen --zoom 1 --focus home (Verhältnis <= 2,0)
//   AK-E1-18/19: B allein: --zoom 1 --focus home --idle              (frameMax <= 50 ms; max(slices()) <= 8 ms)
// Altes Format (Positionsargumente `<savejson> <wurzelA> <wurzelB> [läufe] [dpr]`) bleibt gültig.
import { readFileSync } from 'node:fs';
import { cpus, release } from 'node:os';
import { sleep, withBrowser } from './lib.mjs';

const argv = process.argv.slice(2);
const opt = {};
const FLAGS = new Set(['idle', 'help']);
if (argv[0] && !argv[0].startsWith('--')) {
  [opt.save, opt.a, opt.b, opt.runs, opt.dpr] = argv;
} else {
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i].replace(/^--/, '');
    if (FLAGS.has(k)) opt[k] = true;
    else opt[k] = argv[++i];
  }
}
const USAGE =
  'Aufruf: perf.mjs --a <wurzelA> --b <wurzelB> (--seed N | --save datei) [--runs 3] [--dpr 1] [--w 1280] [--h 800]\n' +
  '        [--zoom 1] [--focus home|archipel|mountain|none] [--warm 5000] [--idle] [--help]';
if (opt.help) {
  console.log(USAGE);
  process.exit(0);
}
const runs = Number(opt.runs ?? 3),
  dpr = Number(opt.dpr ?? 1),
  width = Number(opt.w ?? 1280),
  height = Number(opt.h ?? 800),
  zoom = Number(opt.zoom ?? 1),
  warm = Number(opt.warm ?? 5000),
  idle = opt.idle === true;
const focus = opt.focus ?? (opt.seed ? 'mountain' : 'none');
if (!opt.a || !opt.b || (!opt.seed && !opt.save)) {
  console.error(USAGE);
  process.exit(2);
}
if (!['home', 'archipel', 'mountain', 'none'].includes(focus) || !(zoom > 0) || !(warm >= 0)) {
  console.error(
    `Ungültige Werte (--focus ${focus}, --zoom ${opt.zoom}, --warm ${opt.warm}).\n${USAGE}`,
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

const READY_LIMIT_MS = 60000;
const BUILD_RE = /\[terrain\] Aufbau\s+([\d.,]+)\s*ms/;
const stats = (v) => {
  const s = [...v].sort((x, y) => x - y);
  const at = (p) => s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))] ?? 0;
  return { n: s.length, median: at(0.5), p95: at(0.95), max: s.at(-1) ?? 0 };
};

async function once(root, n) {
  const port = 5170 + n;
  const chromePort = 9270 + n;
  return withBrowser(
    { dpr, width, height, root, path: '/?perf=1', vitePort: port, chromePort },
    async (c) => {
      const buildMs = [];
      c.on('Runtime.consoleAPICalled', (e) => {
        const text = (e.args ?? []).map((a) => a.value ?? a.description ?? '').join(' ');
        const m = BUILD_RE.exec(text);
        if (m) buildMs.push(Number(m[1].replace(',', '.')));
      });
      const chrome = (await (await fetch(`http://127.0.0.1:${chromePort}/json/version`)).json())
        .Browser;
      await c.ev(STORE(opt.seed));
      await c.send('Page.navigate', { url: `http://127.0.0.1:${port}/?perf=1` });
      await sleep(3000);
      const click = (t) =>
        c.ev(
          `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(t)})); if(!b) return false; b.click(); return true;})()`,
        );
      const caps = await c
        .ev(
          `JSON.stringify({ zoom: typeof window.__inselDev?.setZoom === 'function', focus: typeof window.__inselDev?.focus === 'function', ready: typeof window.__inselDev?.cachesReady === 'function' })`,
        )
        .then(JSON.parse);
      if ((!caps.zoom || !caps.focus) && (zoom !== 1 || focus === 'archipel'))
        throw new Error(
          `Wurzel ${root} hat keine Dev-Sonde setZoom/focus (Stand main): nur --zoom 1 --focus home zulässig, gefordert: --zoom ${zoom} --focus ${focus}.`,
        );
      const waitReady = async () => {
        if (!caps.ready) return;
        const t0 = Date.now();
        while (!(await c.ev('window.__inselDev.cachesReady()'))) {
          if (Date.now() - t0 > READY_LIMIT_MS)
            throw new Error(
              `cachesReady() nach ${READY_LIMIT_MS / 1000} s nicht erreicht (${root}).`,
            );
          await sleep(100);
        }
      };
      const aim = async () => {
        if (caps.zoom && zoom !== 1) await c.ev(`window.__inselDev.setZoom(${zoom})`);
        if (caps.focus && (focus === 'home' || focus === 'archipel'))
          await c.ev(`window.__inselDev.focus(${JSON.stringify(focus)})`);
      };
      await click('Fortsetzen');
      let at = null;
      let measured = {};
      if (idle) {
        if (!caps.ready)
          throw new Error(`--idle braucht cachesReady() (${root}); nur auf Stand mit T06.`);
        await click('⏸');
        await aim();
        await waitReady();
      } else {
        await sleep(1500);
        await click('⏸');
        await waitReady();
        await aim();
        at = focus === 'mountain' ? await c.ev(MOUNTAIN) : null;
        await sleep(warm);
        await sleep(15000);
      }
      const p = JSON.parse(await c.ev('JSON.stringify(window.__inselPerf)'));
      if (idle || caps.ready) {
        const list = async (fn) =>
          JSON.parse(await c.ev(`JSON.stringify(window.__inselDev.${fn}?.() ?? [])`));
        measured = { slices: stats(await list('slices')), emergency: await list('emergency') };
      }
      const r = await c.ev('JSON.stringify(globalThis.__inselRender ?? null)');
      return {
        ...p,
        at,
        render: r && JSON.parse(r),
        buildMs: buildMs[0] ?? null,
        buildAll: buildMs,
        chrome,
        ...measured,
      };
    },
  );
}
const res = { A: [], B: [] };
let headerDone = false;
const header = (chrome) => {
  headerDone = true;
  console.log(
    JSON.stringify({
      cpu: cpus()[0]?.model,
      os: release(),
      node: process.version,
      chrome,
      dpr,
      view: `${width}x${height}`,
      seed: opt.seed ?? null,
      save: opt.save ?? null,
      zoom,
      focus,
      warm,
      idle,
      runs,
    }),
  );
};
try {
  for (let i = 0; i < runs; i++) {
    for (const [k, root] of [
      ['A', opt.a],
      ['B', opt.b],
    ]) {
      const r = await once(root, i * 2 + (k === 'A' ? 0 : 1));
      if (!headerDone) header(r.chrome);
      res[k].push(r);
      console.log(
        k,
        JSON.stringify({
          seed: opt.seed ?? null,
          renderMedian: r.renderMedian,
          renderP95: r.renderP95,
          frameMedian: r.frameMedian,
          frameMax: r.frameMax,
          emergencyFrames: r.emergencyFrames,
          n: r.n,
          buildMs: r.buildMs,
          focus: r.at,
          slices: r.slices,
          emergencyMs: r.emergency,
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
} catch (e) {
  console.error(`Abbruch: ${e.message}`);
  process.exit(1);
}
const mA = med(res.A.map((r) => r.renderMedian)),
  mB = med(res.B.map((r) => r.renderMedian));
const buildOf = (rs) => {
  const v = rs.map((r) => r.buildMs).filter((x) => x !== null);
  return v.length ? med(v) : null;
};
console.log(
  JSON.stringify({
    dpr,
    view: `${width}x${height}`,
    seed: opt.seed ?? null,
    zoom,
    focus,
    medianA: mA,
    medianB: mB,
    deltaPct: +(((mB - mA) / mA) * 100).toFixed(1),
    deltaMs: +(mB - mA).toFixed(3),
    buildMsA: buildOf(res.A),
    buildMsB: buildOf(res.B),
    ...(idle && {
      frameMaxB: med(res.B.map((r) => r.frameMax ?? 0)),
      emergencyFramesB: res.B.map((r) => r.emergencyFrames ?? 0),
      slicesMaxB: Math.max(...res.B.map((r) => r.slices?.max ?? 0)),
    }),
  }),
);
