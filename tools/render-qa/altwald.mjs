/* global process, Buffer */
// altwald.mjs — Altwald während des Waldaufbaus (R326 7): Bau eines Hauses am Waldrand, je Frame ein Ausschnitt um
// den Bauplatz (nach dem Spiel-Render desselben Frames), woodPending je Frame, Differenz zum Bild vor dem Bau
// ausserhalb des Bauplatzes. Ausgabe: Kontaktbogen und Vollbilder (PNG) plus JSON-Zeile.
import { writeFileSync } from 'node:fs';
import { ausgabe, cli, defaultRoot, session } from './sitzung.mjs';

const HELP = `altwald.mjs — Waldaufbau-Probe: Hausbau am Waldrand, Kontaktbogen und Differenz je Frame.
Aufruf: node tools/render-qa/altwald.mjs [--root <wurzel>] [--seed 7] [--spot 0] [--out <ordner>] [--port 5291] [--help]
  --root   Arbeitsstand (Verzeichnis). Standard: Repo-Stamm. Einzelstand, daher Vergleichsart aa-.
  --seed   Seed (Standard 7).
  --spot   Index (0-4) der besten Bauplatz-Kandidaten am Waldrand (Standard 0).
  --out    Ausgabeordner (Standard <root>/.studio/qa/altwald).
  --port   Vite-Port (Standard 5291); Chrome-Port = Port + 4000.
Ausgabe: aa-<Stand>-altwald-s<seed>-<spot>-blatt.png und -f<n>.png (Vollbilder), aa-<Stand>-altwald-s<seed>-<spot>.txt
  (Kopf mit Commit-Hash, JSON-Zeile mit Differenzen je Frame).
Lastregel (R329): bricht bei 1-min-Load > 4 mit Exit 1 ab.`;

const v = cli(
  {
    root: { type: 'string' },
    seed: { type: 'string', default: '7' },
    spot: { type: 'string', default: '0' },
    out: { type: 'string' },
    port: { type: 'string', default: '5291' },
  },
  HELP,
);
const root = v.root ?? defaultRoot();
const seed = Number(v.seed);
const out = v.out ?? `${root}/.studio/qa/altwald`;
const o = ausgabe(out, root, root, `altwald-s${seed}-${v.spot}.txt`);
await session({ root, seed, dpr: 1, port: Number(v.port) }, async (a) => {
  const spot = JSON.parse(
    await a.ev(`(async () => {
    const { canPlace } = await import('/src/sim/placement.ts');
    const { home } = await import('/src/sim/world.ts');
    const w = window.__inselDev.world(); w.money = 100000;
    const isl = home(w), W = isl.width, H = isl.height;
    const t = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? isl.tiles[y * W + x].terrain : 'x';
    const k = w.buildings[1]; const c = [];
    for (let dy = -14; dy <= 14; dy++) for (let dx = -14; dx <= 14; dx++) {
      const x = k.x + dx, y = k.y + dy;
      if (!canPlace(w, 'house', x, y).ok) continue;
      let f = 0; for (let yy = y - 2; yy <= y + 3; yy++) for (let xx = x - 2; xx <= x + 3; xx++) if (t(xx, yy) === 'forest') f++;
      if (f >= 6) c.push({ x, y, f, d: Math.abs(dx) + Math.abs(dy) });
    }
    c.sort((p, q) => q.f - p.f || p.d - q.d);
    return JSON.stringify(c.slice(0, 5));
  })()`),
  );
  const pick = spot[Number(v.spot)];
  if (!pick) throw new Error(`kein Bauplatz Nr. ${v.spot} am Waldrand (Seed ${seed})`);
  await a.view(1, pick.x + 1, pick.y + 1, 4000);
  const r = await a.ev(`(async () => {
    const { placeBuilding } = await import('/src/sim/build.ts');
    const { woodPending } = await import('/src/render/iso.ts');
    const w = window.__inselDev.world();
    const cv = [...document.querySelectorAll('canvas')].sort((p, q) => q.width * q.height - p.width * p.height)[0];
    const c = window.__inselDev.tileCenter(${pick.x + 1}, ${pick.y + 1});
    const CW = 520, CH = 360, sx = Math.round(c.x - CW / 2), sy = Math.round(c.y - CH / 2 - 40);
    const frames = []; let i = 0; const BEFORE = 4, AFTER = 22;
    await new Promise((done) => {
      const f = () => {
        const k = document.createElement('canvas'); k.width = CW; k.height = CH;
        k.getContext('2d').drawImage(cv, sx, sy, CW, CH, 0, 0, CW, CH);
        frames.push({ k, i: i - BEFORE, pending: woodPending(w), b: w.buildings.length });
        if (i === BEFORE - 1) placeBuilding(w, 'house', ${pick.x}, ${pick.y});
        i++;
        if (i < BEFORE + AFTER) requestAnimationFrame(f); else done();
      };
      requestAnimationFrame(f);
    });
    const data = frames.map((fr) => fr.k.getContext('2d').getImageData(0, 0, CW, CH).data);
    const ref0 = data[BEFORE - 1], refN = data[data.length - 1];
    const core = (x, y) => Math.abs(x - CW / 2) < 90 && Math.abs(y - (CH / 2 + 40)) < 80;
    const diff = (p, q) => { let n = 0, s = 0; for (let y = 0; y < CH; y += 2) for (let x = 0; x < CW; x += 2) { if (core(x, y)) continue; const o = (y * CW + x) * 4; const dd = Math.abs(p[o] - q[o]) + Math.abs(p[o + 1] - q[o + 1]) + Math.abs(p[o + 2] - q[o + 2]); n++; if (dd > 60) s++; } return +(100 * s / n).toFixed(2); };
    const rows = frames.map((fr, j) => ({ f: fr.i, pending: fr.pending, b: fr.b, dVor: diff(data[j], ref0), dEnde: diff(data[j], refN) }));
    const cols = 4, tw = CW / 2, th = CH / 2, rowsN = Math.ceil(frames.length / cols);
    const sheet = document.createElement('canvas'); sheet.width = cols * tw; sheet.height = rowsN * (th + 16);
    const g = sheet.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '12px sans-serif';
    frames.forEach((fr, j) => { const X = (j % cols) * tw, Y = Math.floor(j / cols) * (th + 16); g.drawImage(fr.k, X, Y + 16, tw, th); g.fillStyle = fr.pending ? '#ff0' : '#fff'; g.fillText('f' + fr.i + (fr.pending ? ' Aufbau' : ''), X + 4, Y + 12); });
    const full = {}; for (const j of [BEFORE - 1, BEFORE, BEFORE + 3, frames.length - 1]) full['f' + frames[j].i] = frames[j].k.toDataURL('image/png');
    return JSON.stringify({ spot: ${JSON.stringify(pick)}, rows, sheet: sheet.toDataURL('image/png'), full });
  })()`);
  const res = JSON.parse(r);
  const base = `altwald-s${seed}-${v.spot}`;
  writeFileSync(o.name(`${base}-blatt.png`), Buffer.from(res.sheet.split(',')[1], 'base64'));
  for (const [k, val] of Object.entries(res.full))
    writeFileSync(o.name(`${base}-${k}.png`), Buffer.from(val.split(',')[1], 'base64'));
  o.write(
    JSON.stringify({
      stand: o.d.labelA,
      seed,
      spot: res.spot,
      rows: res.rows,
      msgs: a.msgs.filter((m) => !/favicon|willReadFrequently/.test(m)),
    }),
  );
});
process.exit(0);
