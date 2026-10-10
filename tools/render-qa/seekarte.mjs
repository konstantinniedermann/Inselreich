/* global process, console */
// seekarte.mjs — Szene Seekarte (REL-15, UI-SEEKARTE-NACHZUG): Kontor auf Insel 1, zwei Schiffe, Route 0<->1, ein Schiff
// im Hafen; öffnet die Karte je Fenstergrösse und dpr, prüft die Kontor-Marke per Pixel und zählt mit --leck die
// Inselmenü-Listener am document vor und nach zwei Neustarts. Nur Entwicklungswerkzeug.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cli, defaultRoot, numList, session, sleep } from './sitzung.mjs';

const HELP = `seekarte.mjs — Szene Seekarte: Kontor auf Insel 1, zwei Schiffe, Route 0<->1, ein Schiff im Hafen; Screenshots der offenen Karte.
Aufruf: node tools/render-qa/seekarte.mjs [--root <wurzel>] [--seed 7] [--size 1280x720,1920x1080] [--dpr 1,2] [--out <ordner>] [--port 5291] [--leck] [--help]
  --root   Arbeitsstand (Standard: Repo-Stamm des Skripts).
  --seed   Seed der Karte (Standard 7).
  --size   Fenstergrössen, kommagetrennt (Standard 1280x720,1920x1080).
  --dpr    Gerätepixel-Verhältnisse, kommagetrennt (Standard 1,2).
  --out    Ausgabeordner (Standard <root>/.studio/qa/seekarte).
  --port   Vite-Port (Standard 5291); Chrome-Port = Port + 4000. Zwei Läufe zugleich brauchen verschiedene Ports.
  --leck   zusätzlich: Inselmenü-Listener am document vor und nach zweimal „Neue Insel“ zählen (Soll: 1 und 1).
Ausgabe: seekarte-<B>x<H>-dpr<d>.png je Kombination, seekarte.txt (Zeilen BESTANDEN/NICHT BESTANDEN, Konsolenmeldungen).
Kein Messlauf: keine Lastsperre.`;

const v = cli(
  {
    root: { type: 'string' },
    seed: { type: 'string', default: '7' },
    size: { type: 'string', default: '1280x720,1920x1080' },
    dpr: { type: 'string', default: '1,2' },
    out: { type: 'string' },
    port: { type: 'string', default: '5291' },
    leck: { type: 'boolean' },
  },
  HELP,
  { gate: false },
);
const root = resolve(v.root ?? defaultRoot());
const out = resolve(v.out ?? `${root}/.studio/qa/seekarte`);
const seed = Number(v.seed);
const port = Number(v.port);
const sizes = v.size.split(',').map((s) => s.trim().split('x').map(Number));
const dprs = numList(v.dpr);
if (
  !Number.isInteger(seed) ||
  !Number.isInteger(port) ||
  sizes.some((s) => s.length !== 2 || s.some((n) => !Number.isInteger(n) || n < 320)) ||
  dprs.some((d) => !(d >= 1))
) {
  console.error(`Ungültige Argumente.\n${HELP}`);
  process.exit(2);
}
mkdirSync(out, { recursive: true });

const lines = [];
let fails = 0;
const rep = (ok, txt) => {
  if (!ok) fails++;
  const line = `${ok ? 'BESTANDEN' : 'NICHT BESTANDEN'}: ${txt}`;
  lines.push(line);
  console.log(line);
};

// Szene: Geld, Lager, Kontor auf Insel 1, zwei Schiffe, beide auf Route 0<->1
const PREP = `
  const { findKontorSite } = await import('/src/sim/mapgen.ts');
  const { placeBuilding } = await import('/src/sim/build.ts');
  const { buyShip, setRoute } = await import('/src/sim/ships.ts');
  w.money = 200000;
  for (const k of Object.keys(w.islands[0].stock)) w.islands[0].stock[k] = 500;
  const fi = w.islands[1];
  const site = findKontorSite(fi.tiles.map(t => t.terrain), fi.width, fi.height);
  const kontor = placeBuilding(w, 'kontor2', site.x, site.y, 1);
  const bought = [buyShip(w), buyShip(w)];
  const route = { a: 0, b: 1, ab: [{ good: 'wood', reserve: 0 }], ba: [] };
  const routes = w.ships.slice(0, 2).map((s) => setRoute(w, s.id, route));
  console.log('PREP', JSON.stringify({ islands: w.islands.length, kontor, bought, routes, ships: w.ships.length }));
  localStorage.setItem('seekarte.prepOk', String([kontor, ...bought, ...routes].every((r) => r.ok !== false)));
`;

async function mouse(a, type, x, y) {
  await a.send('Input.dispatchMouseEvent', {
    type,
    x,
    y,
    button: 'left',
    buttons: type === 'mouseReleased' ? 0 : 1,
    clickCount: 1,
  });
}
async function clickAt(a, x, y) {
  await a.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await mouse(a, 'mousePressed', x, y);
  await mouse(a, 'mouseReleased', x, y);
  await sleep(500);
}
async function key(a, k) {
  const code = k;
  const vk = k === 'Escape' ? 27 : k.charCodeAt(0);
  await a.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: k,
    code,
    windowsVirtualKeyCode: vk,
  });
  await a.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: k,
    code,
    windowsVirtualKeyCode: vk,
  });
  await sleep(500);
}
const popOpen = (a) =>
  a.ev(`(()=>{const p=document.querySelector('.island-pop');return !!p && !p.hidden;})()`);
async function clickInseln(a) {
  const r = JSON.parse(
    await a.ev(`(()=>{const b=document.querySelector('[data-field="islands"]').getBoundingClientRect();
      return JSON.stringify({x:b.left+b.width/2,y:b.top+b.height/2});})()`),
  );
  await clickAt(a, r.x, r.y);
}
const menuListeners = async (a) =>
  (
    await a.send('Runtime.evaluate', {
      expression:
        "getEventListeners(document).pointerdown.filter((l) => String(l.listener).includes('box.contains')).length",
      includeCommandLineAPI: true,
      returnByValue: true,
    })
  ).result.value;

// Pixel der Leinwand über dem Anker der Insel i: Farbe der Kontor-Marke?
const markPixel = (a, i, dpr) =>
  a.ev(`(async () => {
    const sm = await import('/src/render/seaMap.ts');
    const w = window.__inselDev.world();
    const cv = document.querySelector('canvas.sea-map');
    const d = ${dpr};
    const vm = await import('/src/ui/seaMapView.ts');
    const pad = (vm.SEA_MAP_PAD ?? 12) * d; // Rand aus der Quelle; ältere Stände ohne die Konstante
    const l = sm.mapLayout(w, cv.width, cv.height, pad);
    const isl = w.islands[${i}];
    const m = sm.tileToMap(l, isl.ox + isl.anchor.x + 0.5, isl.oy + isl.anchor.y + 0.5);
    const x = Math.round(m.x), y = Math.round(m.y - ((sm.DOT_R ?? 3) + 1) * d - (sm.MARK ?? 4) * d / 2); // ältere Stände ohne die Konstanten
    // Kopie mit willReadFrequently: der App-Kontext bleibt GPU-fähig, die Probe löst keine Chrome-Warnung aus.
    const k = document.createElement('canvas');
    k.width = cv.width;
    k.height = cv.height;
    const g = k.getContext('2d', { willReadFrequently: true });
    g.drawImage(cv, 0, 0);
    const p = g.getImageData(x, y, 1, 1).data;
    return JSON.stringify({ x, y, rgb: [p[0], p[1], p[2]], kontor: isl.kontorId !== null });
  })()`);

async function neueInsel(a) {
  await a.ev(`window.__w0 = window.__inselDev.world(); 1`);
  await a.click('Menü');
  await sleep(500);
  await a.ev(`(()=>{const s=document.querySelector('select[aria-label="Freischaltung für die neue Insel"]');
    s.value='all'; s.dispatchEvent(new Event('change',{bubbles:true})); return 1;})()`);
  await a.click('Neue Insel');
  await sleep(400);
  await a.click('Ja, neue Insel');
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const ready = await a.ev(
      `!!document.querySelector('.hud-row') && window.__inselDev.world() !== window.__w0`,
    );
    if (ready) break;
  }
  await sleep(1500);
}

async function lauf(w, h, dpr, mitLeck) {
  const S = `${w}x${h}-dpr${dpr}`;
  await session({ root, seed, w, h, dpr, port, prep: PREP }, async (a) => {
    console.log(`== ${S} ==`);
    await a.view(1, null, null, 1500);
    const prep = await a.ev("localStorage.getItem('seekarte.prepOk')");
    rep(prep === 'true', `${S} Szene aufgebaut (PREP ohne ok:false)`);
    await a.ev(
      `[...document.querySelectorAll('.hud-speed .btn')].find(b=>b.textContent.trim()==='⏸')?.click(); 1`,
    );
    await sleep(500);
    const port0 = await a.ev(
      `window.__inselDev.world().ships.some((s) => s.route !== null && s.to === null)`,
    );
    rep(port0 === true, `${S} Szene mit Hafenschiff${port0 ? '' : ': Szene ohne Hafenschiff'}`);
    await clickInseln(a);
    await sleep(800);
    rep((await popOpen(a)) === true, `${S} Karte offen`);
    await a.shot(`${out}/seekarte-${S}.png`);
    for (const i of [0, 1]) {
      const m = JSON.parse(await markPixel(a, i, dpr));
      const hell = m.kontor && m.rgb.every((c) => c >= 230);
      rep(hell, `${S} Marke sichtbar Insel ${i} (Pixel ${m.x},${m.y} = rgb ${m.rgb.join(',')})`);
    }
    if (mitLeck) {
      await key(a, 'Escape');
      const n0 = await menuListeners(a);
      if (n0 === 0) rep(false, `${S} Listener-Leck: Probe greift nicht (n0 = 0)`);
      else {
        await neueInsel(a);
        await neueInsel(a);
        const n2 = await menuListeners(a);
        rep(n2 === 1, `${S} ${n2 === 1 ? 'kein ' : ''}Listener-Leck (n0 = ${n0}, n2 = ${n2})`);
      }
      await clickInseln(a);
      await sleep(500);
      const o1 = await popOpen(a);
      await key(a, 'Escape');
      rep(
        o1 === true && (await popOpen(a)) === false,
        `${S} Neue Insel: Escape schliesst die Karte`,
      );
      await clickInseln(a);
      await sleep(500);
      const o2 = await popOpen(a);
      await clickAt(a, 80, h - 150);
      rep(o2 === true && (await popOpen(a)) === false, `${S} Neue Insel: Klick daneben schliesst`);
    }
    return a.msgs;
  }).then((msgs) => {
    for (const m of msgs ?? []) {
      lines.push(`Konsole ${S}: ${m}`);
      console.log(`Konsole ${S}: ${m}`);
      if (m.includes('src/')) rep(false, `${S} Konsolenmeldung aus src/: ${m}`);
    }
  });
}

let first = true;
for (const [w, h] of sizes)
  for (const dpr of dprs) {
    await lauf(w, h, dpr, v.leck === true && first);
    first = false;
  }
writeFileSync(`${out}/seekarte.txt`, `${lines.join('\n')}\n`);
process.exitCode = fails > 0 ? 1 : 0;
