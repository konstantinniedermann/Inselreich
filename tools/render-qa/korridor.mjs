/* global process, console, URL */
// korridor.mjs — Meer-Korridor (SEE-F1-KORRIDOR): reine Platzierung ohne Canvas und Browser.
// Lädt `decor.ts` über Vite (SSR-Modul) und prüft je Seed (1) kein Meer-Element (auch Flächen) < 3 Kacheln von einer Lane und
// (2) Wrack, Eiland und Felsen <= 2 Kacheln von einer Route (alle Paare a<b, Heimat-Kachelraum, Anteil <= 5 %).
// Läuft nicht in `make check` (Dauer); die Suite `tests/render/decor.test.ts` und `seaKorridor.test.ts` prüft Seeds 1–40.
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';

const HELP = `korridor.mjs — Lane-Abstand aller Meer-Elemente und Routen-Korridor von Wrack, Eiland und Felsen.
Aufruf: node tools/render-qa/korridor.mjs [--root <wurzel>] [--von 1] [--bis 200] [--max 0.05] [--help]
  --root     Arbeitsstand (Standard: Repo-Stamm des Skripts).
  --von/--bis  Seed-Bereich (Standard 1–200).   --max  Höchstanteil Elemente <= 2 Kacheln von einer Route (Standard 0,05).
Ausgabe: Zahl Lane-Verletzungen, Elemente nahe einer Route / Elemente, Dauer.
Exit 0 bestanden, 1 Verletzung oder Anteil zu hoch, 2 Aufruffehler.`;

let v;
try {
  ({ values: v } = parseArgs({
    options: {
      root: { type: 'string' },
      von: { type: 'string', default: '1' },
      bis: { type: 'string', default: '200' },
      max: { type: 'string', default: '0.05' },
      help: { type: 'boolean', default: false },
    },
  }));
} catch (e) {
  console.error(String(e.message ?? e));
  process.exit(2);
}
if (v.help) {
  console.log(HELP);
  process.exit(0);
}
const root = resolve(v.root ?? new URL('../..', import.meta.url).pathname);
const { createServer } = await import('vite'); // löst auch im Worktree über die Elternverzeichnisse auf
const srv = await createServer({
  root,
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true, watch: null },
  appType: 'custom',
});
const dist = (p, pts) => {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1],
      b = pts[i];
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    d = Math.min(d, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
  }
  return d;
};
try {
  const t0 = Date.now();
  const d = await srv.ssrLoadModule('/src/render/decor.ts');
  const wm = await srv.ssrLoadModule('/src/sim/world.ts');
  let laneBad = 0,
    near = 0,
    total = 0,
    worlds = 0;
  for (let s = Number(v.von); s <= Number(v.bis); s++) {
    const w = wm.createWorld(s);
    const ctx = d.seaContext(w);
    const plan = d.seaPlan(s, wm.home(w), ctx);
    worlds++;
    for (const e of d.seaElementTiles(plan)) {
      const c = { x: e.x + 0.5, y: e.y + 0.5 };
      if (ctx.lanes.some((l) => dist(c, l) < 3)) laneBad++;
      if (e.kind === 'sandbank' || e.kind === 'reef' || e.kind === 'kelp') continue;
      total++;
      if (ctx.routes.some((r) => dist(c, r) <= 2)) near++;
    }
  }
  const anteil = total ? near / total : 0;
  console.log(
    `korridor: Welten ${worlds}, Lane-Verletzungen ${laneBad}, Elemente nahe Route ${near}/${total} (${(anteil * 100).toFixed(1)} %), ${Date.now() - t0} ms`,
  );
  process.exitCode = laneBad > 0 || anteil > Number(v.max) ? 1 : 0;
} finally {
  await srv.close();
}
