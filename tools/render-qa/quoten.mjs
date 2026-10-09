/* global process, console, URL */
// quoten.mjs — Seltenheitsquoten der Heimatinseln (ART-L8-SELTEN, Spec L8-T1): reine Platzierung ohne Canvas und Browser.
// Lädt `decor.ts` über Vite (SSR-Modul), baut je Seed die Welt und zählt S/E-Elemente (Land-Orte + bestandene Meer-Lose).
// Läuft nicht in `make check` (Dauer); die Suite `tests/render/rareBudget.test.ts` prüft dasselbe auf Seeds 1–40.
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';

const HELP = `quoten.mjs — Histogramm S/E je Insel, Quote je Element gegen Soll (±10 pp), Katalog-Sichtanteil.
Aufruf: node tools/render-qa/quoten.mjs [--root <wurzel>] [--von 1] [--bis 500] [--gruppen 2000] [--tol 0.10] [--help]
  --root     Arbeitsstand (Standard: Repo-Stamm des Skripts).
  --von/--bis  Seed-Bereich (Standard 1–500).   --gruppen  Zahl der zufälligen 5er-Seed-Gruppen (fester Strom).
  --tol      Toleranz der Quote (Standard 0,10).
Ausgabe: Histogramm der Summen (Soll: nur 3–6), Quote je Element mit Abweichung in pp, Mittel des Katalog-Sichtanteils.
Exit 0 bestanden, 1 Band, Quote oder Sichtanteil verfehlt, 2 Aufruffehler.`;

let v;
try {
  ({ values: v } = parseArgs({
    options: {
      root: { type: 'string' },
      von: { type: 'string', default: '1' },
      bis: { type: 'string', default: '500' },
      gruppen: { type: 'string', default: '2000' },
      tol: { type: 'string', default: '0.10' },
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
const { createServer } = await import(resolve(root, 'node_modules/vite/dist/node/index.js'));
const srv = await createServer({
  root,
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true, watch: null },
  appType: 'custom',
});
try {
  const d = await srv.ssrLoadModule('/src/render/decor.ts');
  const wm = await srv.ssrLoadModule('/src/sim/world.ts');
  const nz = await srv.ssrLoadModule('/src/sim/noise.ts');
  const von = Number(v.von),
    bis = Number(v.bis),
    tol = Number(v.tol);
  const soll = Object.fromEntries(d.RARE_POOL.map((r) => [r.id, r.p]));
  Object.assign(soll, { wreck: d.WRECK_P, needle: d.NEEDLE_P, islet: d.ISLET_P, crate: d.CRATE_P });
  const katalog = Object.keys(soll);
  const arten = [];
  const hist = {};
  for (let s = von; s <= bis; s++) {
    const w = wm.createWorld(s);
    const isl = wm.home(w);
    const sites = d.rareSites(w.seed, isl, d.kontorPos(isl, w.buildings));
    const a = new Set(sites.map((t) => t.id));
    const q = w.seed;
    if (nz.hash2(q + 566, 0, 0) < d.WRECK_P) a.add('wreck');
    if (nz.hash2(q + 567, -1, -1) < d.NEEDLE_P) a.add('needle');
    if (nz.hash2(q + 568, 0, 0) < d.ISLET_P) a.add('islet');
    if (nz.hash2(q + 565, 0, 0) < d.CRATE_P) a.add('crate');
    const sum = sites.length + d.rareBudget(q);
    hist[sum] = (hist[sum] ?? 0) + 1;
    arten.push(a);
  }
  const n = arten.length;
  let fail = false;
  console.log(`Seeds ${von}–${bis} (${n} Inseln), reine Platzierung`);
  console.log('Histogramm S/E je Insel (Summe Land-Orte + Meer-Lose):');
  for (const k of Object.keys(hist).sort((x, y) => x - y)) {
    const ok = k >= d.RARE_MIN && k <= d.RARE_CAP;
    if (!ok) fail = true;
    console.log(
      `  ${k}: ${String(hist[k]).padStart(4)}  ${((100 * hist[k]) / n).toFixed(1)} %${ok ? '' : '  AUSSERHALB 3–6'}`,
    );
  }
  console.log(`Quote je Element (Soll ±${(tol * 100).toFixed(0)} pp):`);
  for (const id of katalog) {
    const q = arten.filter((a) => a.has(id)).length / n;
    const dpp = (q - soll[id]) * 100;
    const ok = Math.abs(q - soll[id]) <= tol + 1e-9;
    if (!ok) fail = true;
    console.log(
      `  ${id.padEnd(15)} ${(q * 100).toFixed(1).padStart(5)} %  Soll ${(soll[id] * 100).toFixed(0).padStart(2)} %  ${dpp >= 0 ? '+' : ''}${dpp.toFixed(1)} pp  ${ok ? 'ok' : 'ABWEICHUNG'}`,
    );
  }
  // fester Strom: 5er-Gruppen aus dem Seed-Bereich über hash2
  const gruppen = Number(v.gruppen);
  let tot = 0;
  for (let g = 0; g < gruppen; g++) {
    const seen = new Set();
    for (let k = 0; k < 5; k++)
      for (const x of arten[Math.floor(nz.hash2(9000 + g, k, 17) * n)]) seen.add(x);
    tot += seen.size / katalog.length;
  }
  const mittel = tot / gruppen;
  if (mittel < 0.7) fail = true;
  console.log(
    `Katalog-Sichtanteil, Mittel über ${gruppen} zufällige 5er-Gruppen: ${(mittel * 100).toFixed(1)} % (Soll >= 70 %)`,
  );
  console.log(fail ? 'ERGEBNIS: nicht bestanden' : 'ERGEBNIS: bestanden');
  process.exitCode = fail ? 1 : 0;
} finally {
  await srv.close();
}
