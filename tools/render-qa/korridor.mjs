/* global process, console, URL */
// korridor.mjs — Meer-Korridor (SEE-F1-KORRIDOR): reine Platzierung ohne Canvas und Browser.
// Lädt `decor.ts` über Vite (SSR-Modul) und prüft je Seed (1) kein Meer-Element (auch Flächen) < 3 Kacheln von einer Lane und R4 (Anker, Kontor, Kegel, `seaKeepOut`) und
// (2) Wrack, Eiland und Felsen <= 2 Kacheln von einer Route (alle Paare a<b, Heimat-Kachelraum, Anteil <= 5 %) und (3) die Quoten von Wrack, Eiland und Felsnadel (Seeds 1–200).
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
  const kueste = {
    palm: { palms: 0, suit: 0 },
    pine: { palms: 0, suit: 0 },
    dune: { palms: 0, suit: 0 },
  };
  let wreck = 0,
    islet = 0,
    needle = 0,
    laneBad = 0,
    r4Bad = 0,
    near = 0,
    total = 0,
    worlds = 0;
  for (let s = Number(v.von); s <= Number(v.bis); s++) {
    const w = wm.createWorld(s);
    const ctx = d.seaContext(w);
    const plan = d.seaPlan(s, wm.home(w), ctx);
    worlds++;
    {
      const isl = wm.home(w);
      const cls = d.staticClasses(isl);
      let suit = 0;
      for (let y = 0; y < isl.height; y++)
        for (let x = 0; x < isl.width; x++) {
          if (cls[y * isl.width + x] !== 1) continue;
          let nah = false;
          for (let dy = -1; dy <= 1 && !nah; dy++)
            for (let dx = -1; dx <= 1; dx++)
              if (cls[(y + dy) * isl.width + x + dx] === 0) nah = true;
          if (!nah) suit++;
        }
      const palms = d
        .stampPlacements(s, isl, d.kontorPos(isl, w.buildings), ctx)
        .filter((q) => q.kind === 'palm').length;
      const a = kueste[d.coastKind(s)];
      a.palms += palms;
      a.suit += suit;
    }
    if (plan.wreck) wreck++;
    if (plan.islet) islet++;
    if (plan.rocks.some((r) => r.needle)) needle++;
    for (const e of d.seaElementTiles(plan)) {
      const c = { x: e.x + 0.5, y: e.y + 0.5 };
      if (ctx.lanes.some((l) => dist(c, l) < 3)) laneBad++;
      // R4 gesamt (Lane, Anker, Kontor, Anfahrtskegel) mit dem Zuschlag der Art
      const pad = e.kind === 'wreck' ? d.SEA_PAD.wreck : e.kind === 'islet' ? d.SEA_PAD.islet : 0;
      if (d.seaKeepOut(ctx, e.x, e.y, e.kind === 'wreck' || e.kind === 'islet' ? pad : 0)) r4Bad++;
      if (e.kind === 'sandbank' || e.kind === 'reef' || e.kind === 'kelp') continue;
      total++;
      if (ctx.routes.some((r) => dist(c, r) <= 2)) near++;
    }
  }
  const q = (n) => n / worlds;
  const quoteOk =
    q(wreck) >= 0.25 &&
    q(wreck) <= 0.55 &&
    q(islet) <= 0.3 &&
    islet > 0 &&
    q(needle) <= 0.5 &&
    needle > 0;
  const rate = (k) => kueste[k].palms / Math.max(1, kueste[k].suit);
  const palmOk = rate('palm') >= 0.2 && rate('pine') < 0.05 && kueste.dune.palms === 0;
  const anteil = total ? near / total : 0;
  console.log(
    `korridor: Welten ${worlds}, Lane-Verletzungen ${laneBad}, R4-Verletzungen ${r4Bad}, Elemente nahe Route ${near}/${total} (${(anteil * 100).toFixed(1)} %), ${Date.now() - t0} ms`,
  );
  console.log(
    `korridor: Quoten Wrack ${wreck}/${worlds} (Soll 25–55 %), Eiland ${islet}/${worlds} (≤ 30 %, kommt vor), Felsnadel ${needle}/${worlds} (≤ 50 %, kommt vor): ${quoteOk ? 'ok' : 'VERFEHLT'}`,
  );
  console.log(
    `korridor: Palmen je geeignete Strandkachel: Palmenküste ${rate('palm').toFixed(3)} (>= 0,2), Kiefernküste ${rate('pine').toFixed(3)} (< 0,05), Dünenküste ${kueste.dune.palms} Palmen (= 0): ${palmOk ? 'ok' : 'VERFEHLT'}`,
  );
  process.exitCode =
    !quoteOk || !palmOk || laneBad > 0 || r4Bad > 0 || anteil > Number(v.max) ? 1 : 0;
} finally {
  await srv.close();
}
