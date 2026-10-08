/* global process */
// proben.mjs — K-Proben Fernansicht (REL-07 Nachprüfung): Wrack und Eiland je Seed bei Zoom 0.25 und 0.5, das Objekt
// in Bildmitte; je Bild ein Screenshot und eine Zeile in coords.jsonl. Bilder heissen aa-<Stand>-s<seed>-<art>-z<zoom>.png.
import { appendFileSync } from 'node:fs';
import { ausgabe, cli, defaultRoot, numList, session } from './sitzung.mjs';

const HELP = `proben.mjs — Fernansicht-Proben: Wrack/Eiland je Seed bei Zoom 0.25 und 0.5 (Screenshots).
Aufruf: node tools/render-qa/proben.mjs [--root <wurzel>] [--seed 7,14] [--out <ordner>] [--port 5291] [--help]
  --root   Arbeitsstand (Verzeichnis). Standard: Repo-Stamm. Einzelstand, daher Vergleichsart aa-.
  --seed   Seed oder Liste (Standard 7,14); je Seed ein eigener Lauf mit eigenem Vite/Chrome.
  --out    Ausgabeordner (Standard <root>/.studio/qa/proben).
  --port   Vite-Port (Standard 5291); Chrome-Port = Port + 4000.
Ausgabe: aa-<Stand>-s<seed>-<wreck|islet>-z<zoom>.png, aa-<Stand>-proben.txt (Kopf mit Commit-Hash, Pläne, Konsolenmeldungen).
Lastregel (R329): bricht bei 1-min-Load > 4 mit Exit 1 ab.`;

const v = cli(
  {
    root: { type: 'string' },
    seed: { type: 'string', default: '7,14' },
    out: { type: 'string' },
    port: { type: 'string', default: '5291' },
  },
  HELP,
);
const root = v.root ?? defaultRoot();
const out = v.out ?? `${root}/.studio/qa/proben`;
const o = ausgabe(out, root, root, 'proben.txt');
for (const seed of numList(v.seed)) {
  await session({ root, seed, dpr: 1, port: Number(v.port) }, async (a) => {
    const plan = JSON.parse(
      await a.ev(`(async () => {
    const { seaPlan, seaContext } = await import('/src/render/decor.ts');
    const { home } = await import('/src/sim/world.ts');
    const w = window.__inselDev.world();
    const p = seaPlan(w.seed, home(w), seaContext(w));
    return JSON.stringify({ wreck: p.wreck, islet: p.islet });
  })()`),
    );
    for (const kind of ['wreck', 'islet']) {
      const t = plan[kind];
      if (!t) continue;
      for (const z of [0.25, 0.5]) {
        await a.view(z, t.x, t.y, 4000);
        const px = await a.px(t.x, t.y);
        const f = o.name(`s${seed}-${kind}-z${z}.png`);
        await a.shot(f);
        appendFileSync(
          `${out}/coords.jsonl`,
          JSON.stringify({ f, seed, kind, z, tile: [t.x, t.y], px }) + '\n',
        );
      }
    }
    o.write(`seed=${seed} ${JSON.stringify(plan)} ${a.msgs.slice(0, 5).join(' | ')}`);
  });
}
process.exit(0);
