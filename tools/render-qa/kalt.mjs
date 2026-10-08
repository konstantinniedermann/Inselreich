/* global process */
// kalt.mjs — Kaltstart-Messung (PERF-L57): Zeit von der Seitennavigation bis `cachesReady()` (alle Inselcaches fertig).
// Je Lauf ein frischer Vite/Chrome; A und B wechseln sich ab. Entscheidend nur bei 1-min-Load <= 4 (R329, Abbruch sonst).
import { ausgabe, cli, defaultRoot, numList, session, sleep } from './sitzung.mjs';

const HELP = `kalt.mjs — Kaltstart bis cachesReady() (ms seit Navigation, 1920x1080, DPR 1).
Aufruf: node tools/render-qa/kalt.mjs [--a <wurzel>] [--b <wurzel>] [--seed 14] [--runs 1] [--out <ordner>] [--port 5341] [--help]
  --a, --b   Arbeitsstände (Verzeichnisse); ohne --b ist B = A (Vergleichsart aa-).
  --seed     Seed oder Liste (Standard 14).  --runs  Wiederholungen je Seed und Seite (Standard 1).
  --out      Ausgabeordner (Standard <A>/.studio/qa/kalt); Datei kalt-s<seeds>.txt mit Kopfzeile (E-039).
Ausgabe: je Lauf eine Zeile "<A|B> <stand> seed=<s> lauf=<n> readyMs=<ms> ready=<bool>".
Lastregel (R329): bricht bei 1-min-Load > 4 mit Exit 1 ab.`;

const v = cli(
  {
    a: { type: 'string' },
    b: { type: 'string' },
    seed: { type: 'string', default: '14' },
    runs: { type: 'string', default: '1' },
    out: { type: 'string' },
    port: { type: 'string', default: '5341' },
  },
  HELP,
);
const rootA = v.a ?? defaultRoot();
const rootB = v.b ?? rootA;
const seeds = numList(v.seed);
const o = ausgabe(v.out ?? `${rootA}/.studio/qa/kalt`, rootA, rootB, `kalt-s${seeds.join('_')}.txt`);
const sides =
  o.d.kind === 'aa'
    ? [['A', rootA, o.d.labelA]]
    : [
        ['A', rootA, o.d.labelA],
        ['B', rootB, o.d.labelB],
      ];
for (let run = 1; run <= Number(v.runs); run++)
  for (const seed of seeds)
    for (const [side, root, label] of sides)
      await session({ root, seed, dpr: 1, port: Number(v.port) }, async (a) => {
        let ready = false;
        let ms = 0;
        for (let i = 0; i < 480 && !ready; i++) {
          ready = await a.ev('window.__inselDev.cachesReady()');
          ms = await a.ev('Math.round(performance.now())');
          if (!ready) await sleep(250);
        }
        o.write(`${side} ${label} seed=${seed} lauf=${run} readyMs=${ms} ready=${ready}`);
      });
process.exit(0);
