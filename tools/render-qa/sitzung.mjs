/* global process, console, setTimeout, URL, Buffer */
// sitzung.mjs — gemeinsamer Sitzungshelfer der Mess- und Probenskripte (hitch, altwald, proben): Spielstand per
// `createWorld(seed, { unlockAll: true })` im Seitenkontext erzeugen, als Autosave ablegen, „Fortsetzen" klicken,
// Dev-Hooks (`window.__inselDev`: setZoom, focus, centerOn, cachesReady, tileCenter, world) nutzen. Nur Entwicklungswerkzeug.
// Nutzt `lib.mjs` der angegebenen Wurzel (`<root>/tools/render-qa/lib.mjs`), damit Stand A und B je ihren eigenen
// Vite-Server und ihre eigene Lib verwenden.
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { gateOrExit } from './lastgate.mjs';
import { describeStands, headerLine, outName } from './vergleich.mjs';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wurzel des Repos, in dem dieses Skript liegt (Standard für --root/--a/--b). */
export const defaultRoot = () =>
  execFileSync(
    'git',
    ['-C', new URL('.', import.meta.url).pathname, 'rev-parse', '--show-toplevel'],
    {
      encoding: 'utf8',
    },
  ).trim();

/**
 * Liest benannte Argumente. `opts` im Format von util.parseArgs; `--help` gibt `help` aus (Exit 0), unbekannte
 * Optionen brechen mit Exit 2 ab. Der Lastabbruch (R329) läuft erst danach (also nicht bei --help).
 */
export function cli(opts, help, { gate = true } = {}) {
  let values;
  try {
    ({ values } = parseArgs({ options: { help: { type: 'boolean' }, ...opts }, strict: true }));
  } catch (e) {
    console.error(`${e.message}\n\n${help}`);
    process.exit(2);
  }
  if (values.help) {
    console.log(help);
    process.exit(0);
  }
  if (gate) gateOrExit();
  return values;
}

/** Kommagetrennte Zahlenliste, z. B. "7,14" -> [7, 14]. */
export const numList = (s) => String(s).split(',').map(Number);

/**
 * Ausgabe nach E-039: Datei `<out>/<aa-|ab->…-<rest>` mit Kopfzeile (Vergleichsart, beide Hashes) als erste Zeile.
 * Gibt `{ file, d, write(text), image(name) }` zurück; `write` hängt an und spiegelt nach stdout.
 */
export function ausgabe(out, rootA, rootB, rest) {
  mkdirSync(out, { recursive: true });
  const d = describeStands(rootA, rootB);
  const kopf = headerLine(d);
  const file = `${out}/${outName(d.kind, d.labelA, d.labelB, rest)}`;
  writeFileSync(file, `${kopf}\n`);
  console.log(kopf);
  return {
    file,
    d,
    kopf,
    write(text) {
      appendFileSync(file, `${text}\n`);
      console.log(text);
    },
    /** Dateiname für Bilder/Nebendateien gleicher Art. */
    name: (r) => `${out}/${outName(d.kind, d.labelA, d.labelB, r)}`,
  };
}

/** Startet Vite+Chrome der Wurzel, erzeugt den Spielstand und ruft `fn(api)`. */
export async function session(
  {
    root = defaultRoot(),
    seed,
    port = 5291,
    cport = port + 4000,
    dpr = 2,
    w = 1920,
    h = 1080,
    prep = '',
  },
  fn,
) {
  root = resolve(root);
  const { withBrowser } = await import(pathToFileURL(`${root}/tools/render-qa/lib.mjs`).href);
  return withBrowser(
    { root, width: w, height: h, dpr, vitePort: port, chromePort: cport },
    async (c) => {
      const msgs = [];
      c.on('Runtime.consoleAPICalled', (p) => {
        if (['error', 'warning', 'assert'].includes(p.type))
          msgs.push(
            `[console.${p.type}] ` + p.args.map((a) => a.value ?? a.description ?? '').join(' '),
          );
      });
      c.on('Runtime.exceptionThrown', (p) =>
        msgs.push(
          '[exception] ' + (p.exceptionDetails.exception?.description ?? p.exceptionDetails.text),
        ),
      );
      c.on('Log.entryAdded', (p) => {
        if (['error', 'warning'].includes(p.entry.level))
          msgs.push(`[log.${p.entry.level}] ${p.entry.text} ${p.entry.url ?? ''}`);
      });
      await c.send('Log.enable');
      await c.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `(()=>{const o=performance.now.bind(performance);window.__fz=null;performance.now=()=>window.__fz??o();})()`,
      });
      const info = JSON.parse(
        await c.ev(`(async () => {
      const { createWorld, home } = await import('/src/sim/world.ts');
      const { serialize } = await import('/src/sim/save.ts');
      const w = createWorld(${seed}, { unlockAll: true });
      ${prep}
      localStorage.removeItem('inselreich.save.v1');
      localStorage.setItem('inselreich.save.auto', serialize(w));
      const isl = home(w);
      return JSON.stringify({ seed: w.seed, kontor: [w.buildings[1].x, w.buildings[1].y], W: isl.width, H: isl.height });
    })()`),
      );
      await c.send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
      await sleep(3500);
      const click = (t) =>
        c.ev(
          `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(t)})); if(!b) return false; b.click(); return true;})()`,
        );
      const ok = await click('Fortsetzen');
      await sleep(2500);
      const api = {
        ...c,
        info,
        msgs,
        click,
        async view(zoom, x, y, wait = 3000) {
          await c.ev(
            `window.__inselDev.setZoom(${zoom}); ${x == null ? `window.__inselDev.focus('archipel')` : `window.__inselDev.centerOn(${x}, ${y})`}; 1`,
          );
          await sleep(wait);
          for (let i = 0; i < 60 && !(await c.ev(`window.__inselDev.cachesReady()`)); i++)
            await sleep(500);
        },
        async shot(file) {
          const s = await c.send('Page.captureScreenshot', { format: 'png' });
          writeFileSync(file, Buffer.from(s.data, 'base64'));
        },
        px: async (x, y) =>
          JSON.parse(await c.ev(`JSON.stringify(window.__inselDev.tileCenter(${x},${y}))`)),
      };
      api.fortsetzen = ok;
      return fn(api);
    },
  );
}
