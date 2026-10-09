/* global process, console */
// blindprobe.mjs — Bildsatz für die Blindprobe Meeresfels/Boot (ART-MEERESFELS M1/M3, E-018): anonyme Bilder
// probe-01.png … (Fels und Schiff, gemischte Reihenfolge, Zoom 0,5 und 0,25, drei Wasserstufen), gezeichnet mit den echten
// Zeichnern (`drawDecorStamp`, `drawShip` mit `shipScale`) auf glattem Wasserton mit ein paar Wellenstrichen. Die Zuordnung
// `probe-nn -> fels|boot` (+ Seed, Zoom, Variante, Wasser) steht getrennt in ZUORDNUNG-NICHT-OEFFNEN.json; im Bild, im Dateinamen
// und in den PNG-Daten steht kein Hinweis auf die Art. Für den Vorher/Nachher-Vergleich: `--nur fels --root <main-Worktree>`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Buffer } from 'node:buffer';
import { pathToFileURL } from 'node:url';
import { cli, defaultRoot } from './sitzung.mjs';

const HELP = `blindprobe.mjs — anonyme Bildsatz fuer die Blindprobe Meeresfels/Boot.
Aufruf: node tools/render-qa/blindprobe.mjs [--root <wurzel>] [--out <ordner>] [--zuordnung <datei>] [--nur fels|boot] [--faktor 3] [--port 5293] [--help]
  --root       Arbeitsstand (Verzeichnis), dessen Zeichner benutzt werden. Standard: Repo-Stamm.
  --out        Ausgabeordner der Bilder (Standard <root>/.studio/qa/art-meeresfels/bilder).
  --zuordnung  Datei der Zuordnung (Standard <out>/../ZUORDNUNG-NICHT-OEFFNEN.json).
  --nur fels   nur die Fels-Konfigurationen (Vergleichsstand main, nicht fuer den Rater); Dateien fels-<nn>.png.
  --faktor     ganzzahlige Vergroesserung der Pixel (Standard 3, ohne Glaettung); 1 = Originalgroesse.
  --port       Vite-Port (Standard 5293); Chrome-Port = Port + 4000.
Bilder: 320 x 200 logische Pixel, Wasser tief/mittel/flach ungetoent. Lastregel (R329): Abbruch bei 1-min-Load > 4 (Exit 1).`;

const v = cli(
  {
    root: { type: 'string' },
    out: { type: 'string' },
    zuordnung: { type: 'string' },
    nur: { type: 'string' },
    faktor: { type: 'string', default: '3' },
    port: { type: 'string', default: '5293' },
  },
  HELP,
);
if (v.nur && v.nur !== 'fels' && v.nur !== 'boot') {
  console.error('--nur: fels oder boot');
  process.exit(2);
}
const root = resolve(v.root ?? defaultRoot());
const out = resolve(v.out ?? `${root}/.studio/qa/art-meeresfels/bilder`);
const zuordnungFile = resolve(v.zuordnung ?? `${out}/../ZUORDNUNG-NICHT-OEFFNEN.json`);
const faktor = Math.max(1, Math.floor(Number(v.faktor)));

// Konfigurationen: gleiche Zoomstufen, Wasserstufen und Seeds für beide Arten (Bildaufbau ohne Hinweis auf die Art).
const W = 320,
  H = 200;
const WATERS = ['waterDeep', 'waterMid', 'waterShallow'];
const FELS = [
  { variant: 0, seed: 11, zoom: 0.5, water: 0 },
  { variant: 2, seed: 12, zoom: 0.25, water: 2 },
  { variant: 6, seed: 13, zoom: 0.5, water: 1 },
  { variant: 4, seed: 14, zoom: 0.25, water: 0 },
  { variant: 7, seed: 15, zoom: 0.5, water: 2 },
];
const BOOT = [
  { variant: 0, seed: 21, zoom: 0.25, water: 1 },
  { variant: 0, seed: 22, zoom: 0.5, water: 0 },
  { variant: 0, seed: 23, zoom: 0.5, water: 2 },
  { variant: 0, seed: 24, zoom: 0.25, water: 2 },
  { variant: 0, seed: 25, zoom: 0.5, water: 1 },
];
const all = [
  ...(v.nur === 'boot' ? [] : FELS.map((c) => ({ art: 'fels', ...c }))),
  ...(v.nur === 'fels' ? [] : BOOT.map((c) => ({ art: 'boot', ...c }))),
];
// deterministische Mischung (LCG, fester Startwert); beim Nur-Fels-Vergleich bleibt die Reihenfolge
let st = 20261009;
const rnd = () => (st = (st * 1664525 + 1013904223) % 4294967296) / 4294967296;
const order = v.nur
  ? all
  : all
      .map((c) => ({ c, k: rnd() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.c);

mkdirSync(out, { recursive: true });
const { withBrowser } = await import(pathToFileURL(`${root}/tools/render-qa/lib.mjs`).href);
const zuordnung = {};
await withBrowser(
  {
    root,
    width: W * faktor,
    height: H * faktor,
    dpr: 1,
    vitePort: Number(v.port),
    chromePort: Number(v.port) + 4000,
  },
  async (c) => {
    await c.ev(`(async () => {
      const [d, s, sl, pal, cam] = await Promise.all([
        import('/src/render/decorStamps.ts'), import('/src/render/ship.ts'),
        import('/src/render/shipLane.ts'), import('/src/render/palette.ts'), import('/src/render/camera.ts')]);
      window.__bp = { d, s, sl, pal, cam };
      document.body.style.cssText = 'margin:0;background:#000;overflow:hidden';
      document.body.innerHTML = '<canvas id="bp" width="${W}" height="${H}" style="display:block;width:${W * faktor}px;height:${H * faktor}px;image-rendering:pixelated"></canvas>';
      return 1; })()`);
    let n = 0;
    for (const cfg of order) {
      n++;
      const name = v.nur
        ? `${cfg.art}-${String(n).padStart(2, '0')}.png`
        : `probe-${String(n).padStart(2, '0')}.png`;
      await c.ev(`(() => {
        const { d, s, sl, pal } = window.__bp;
        const cv = document.getElementById('bp'), ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, ${W}, ${H});
        ctx.fillStyle = pal.PALETTE[${JSON.stringify(WATERS[cfg.water])}];
        ctx.fillRect(0, 0, ${W}, ${H});
        // Wellenstriche: je Seed gleiche Art Streuung, in beiden Arten gleich verteilt
        let st = ${cfg.seed} * 7919 + 13; const r = () => (st = (st * 1103515245 + 12345) % 2147483648) / 2147483648;
        ctx.strokeStyle = pal.mixHex(pal.PALETTE[${JSON.stringify(WATERS[cfg.water])}], pal.PALETTE.foam, 0.3); ctx.lineWidth = 1;
        for (let i = 0; i < 26; i++) { const x = r() * ${W}, y = r() * ${H}, l = 5 + r() * 9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y + r() * 1.5 - 0.7); ctx.stroke(); }
        const z = ${cfg.zoom}, tile = { x: 10, y: 10 };
        const cam = { x: -${W / 2} / z, y: 336 - ${H * 0.62} / z, zoom: z };
        if (${JSON.stringify(cfg.art)} === 'fels')
          d.drawDecorStamp(ctx, cam, { kind: 'decor', id: 1, fp: { x: 10, y: 10, w: 1, h: 1 }, key: 1, stamp: 'seaRock', variant: ${cfg.variant} }, ${cfg.seed});
        else s.drawShip(ctx, cam, tile, ${cfg.seed} * 377, sl.shipScale(z));
        return 1; })()`);
      const shot = await c.send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(`${out}/${name}`, Buffer.from(shot.data, 'base64'));
      zuordnung[name.replace('.png', '')] = {
        art: cfg.art,
        seed: cfg.seed,
        zoom: cfg.zoom,
        variante: cfg.art === 'fels' ? cfg.variant : 'schiff',
        wasser: WATERS[cfg.water],
      };
    }
  },
);
if (!v.nur) writeFileSync(zuordnungFile, JSON.stringify(zuordnung, null, 2) + '\n');
else writeFileSync(`${out}/zuordnung-vergleich.json`, JSON.stringify(zuordnung, null, 2) + '\n');
console.log(`${order.length} Bilder in ${out}`);
process.exit(0);
