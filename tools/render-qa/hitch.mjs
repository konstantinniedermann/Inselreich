/* global process */
// hitch.mjs — Bau-Ruckel-Messung (REL-07, R313): baut nacheinander bis zu 6 Häuser rund ums Kontor und zählt je Bau
// die Frames > 25 ms im 900-ms-Fenster danach. Ersetzt die Varianten hitch/hitch0/hitchd/hitche/hitchn.
// Entscheidend nur bei 1-min-Load <= 4 (R329, Abbruch sonst; Exit 1).
import { ausgabe, cli, defaultRoot, numList, session, sleep } from './sitzung.mjs';

const HELP = `hitch.mjs — Bau-Ruckel-Messung (Frames > 25 ms je Hausbau).
Aufruf: node tools/render-qa/hitch.mjs [--a <wurzel>] [--b <wurzel>] [--seed 7,14] [--runs 1] [--out <ordner>]
          [--port 5321] [--ohne-bau] [--detail] [--swaps] [--help]
  --a, --b     Arbeitsstände (Verzeichnisse). Standard: Repo-Stamm; ohne --b ist B = A (Vergleichsart aa-).
               Mit --b laufen A und B je Lauf abwechselnd (A, B, A, B, ...); Ausgabe ab-<A>-vs-<B>-...
  --seed       Seed oder Liste (Standard 7,14); jeder Seed ist ein eigener Lauf mit eigenem Vite/Chrome.
  --runs       Wiederholungen je Seed und Seite (Standard 1).
  --out        Ausgabeordner (Standard <A>/.studio/qa/hitch); Datei hitch-s<seeds>[-ohne-bau].txt mit Kopfzeile
               (Vergleichsart, beide Commit-Hashes; E-039).
  --port       Vite-Port (Standard 5321); Chrome-Port = Port + 4000.
  --ohne-bau   Kontrolle: gleiche Fenster, aber ohne placeBuilding (Grundrauschen).
  --detail     je Bau zusätzlich 'late': Frames > 20 ms als [ms nach Bau, Dauer].
  --swaps      zusätzlich 'sw': window.__sw-Einträge (Cache-Tausch/merge) des Stands; schliesst --detail ein.
Ausgabe: je Lauf und Seite eine JSON-Zeile { baseMedian, res[{x,y,max,over25,n}] }.
Lastregel (R329): bricht bei 1-min-Load > 4 mit Exit 1 ab (Prüfung: node tools/render-qa/lastgate.mjs).`;

const v = cli(
  {
    a: { type: 'string' },
    b: { type: 'string' },
    seed: { type: 'string', default: '7,14' },
    runs: { type: 'string', default: '1' },
    out: { type: 'string' },
    port: { type: 'string', default: '5321' },
    'ohne-bau': { type: 'boolean' },
    detail: { type: 'boolean' },
    swaps: { type: 'boolean' },
  },
  HELP,
);
const rootA = v.a ?? defaultRoot();
const rootB = v.b ?? rootA;
const seeds = numList(v.seed);
const out = v.out ?? `${rootA}/.studio/qa/hitch`;
const detail = v.detail || v.swaps;
const o = ausgabe(
  out,
  rootA,
  rootB,
  `hitch-s${seeds.join('_')}${v['ohne-bau'] ? '-ohne-bau' : ''}.txt`,
);

const sides =
  o.d.kind === 'aa'
    ? [['A', rootA, o.d.labelA]]
    : [
        ['A', rootA, o.d.labelA],
        ['B', rootB, o.d.labelB],
      ];
for (let run = 1; run <= Number(v.runs); run++) {
  for (const seed of seeds) {
    for (const [side, root, label] of sides) {
      await session({ root, seed, dpr: 1, port: Number(v.port) }, async (a) => {
        await a.view(1, a.info.kontor[0], a.info.kontor[1], 4000);
        await sleep(3000);
        const r = await a.ev(`(async () => {
    const { placeBuilding } = await import('/src/sim/build.ts');
    const { canPlace } = await import('/src/sim/placement.ts');
    const w = window.__inselDev.world();
    w.money = 100000;
    const gaps = []; let last = performance.now(), run = true;
    const f = (t) => { gaps.push([t, t - last]); last = t; if (run) requestAnimationFrame(f); };
    requestAnimationFrame(f);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    await sleep(1500);
    const k = w.buildings[1]; const res = []; window.__sw = [];
    const spots = []; for (let dy = -6; dy <= 6; dy++) for (let dx = -8; dx <= 8; dx++) spots.push([k.x + dx, k.y + dy]);
    let n = 0;
    for (const [x, y] of spots) {
      if (n >= 6) break;
      if (!canPlace(w, 'house', x, y).ok) continue;
      const t0 = performance.now(); const idx = gaps.length;
      window.__sw = [];
      ${v['ohne-bau'] ? 'n++;' : `placeBuilding(w, 'house', x, y); n++;`}
      await sleep(900);
      const win = gaps.slice(idx).filter(g => g[0] >= t0 - 1).map(g => g[1]);
      const e = { x, y, max: Math.max(...win), over25: win.filter(v => v > 25).length, n: win.length };
      ${detail ? `e.late = gaps.slice(idx).filter(g => g[0] >= t0 - 1 && g[1] > 20).map(g => [Math.round(g[0] - t0), Math.round(g[1])]);` : ''}
      ${v.swaps ? `e.sw = window.__sw.filter(s => s[0] === 'merge' || s[1] + s[2] > 1.2).slice(0, 12);` : ''}
      res.push(e);
    }
    run = false;
    const base = gaps.slice(2, 80).map(g => g[1]).sort((a, b) => a - b);
    return JSON.stringify({ baseMedian: base[Math.floor(base.length / 2)], res });
  })()`);
        o.write(`${side} ${label} seed=${seed} lauf=${run} ${r}`);
      });
    }
  }
}
process.exit(0);
