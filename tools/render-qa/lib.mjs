/* global process, fetch, setTimeout, URL, WebSocket */
// lib.mjs — gemeinsame Helfer der Render-QA-Skripte (H-R7): Vite-Dev-Server und Headless-Chrome starten,
// minimaler CDP-Client (Node-WebSocket, keine Abhängigkeiten). Nur Entwicklungswerkzeug, nie im Build.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(url, tries = 100) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
    } catch {
      /* Server noch nicht bereit */
    }
    await sleep(200);
  }
  throw new Error(`nicht erreichbar: ${url}`);
}

/** Startet Vite (Dev) und Chrome (headless, --disable-gpu, Geräteskalierung `dpr`), ruft `fn(client)`, räumt auf. */
export async function withBrowser(
  {
    dpr = 1,
    width = 1280,
    height = 800,
    vitePort = 5199,
    chromePort = 9299,
    root = repoRoot,
    path = '/',
  },
  fn,
) {
  const procs = [];
  const profile = mkdtempSync(join(tmpdir(), 'renderqa-'));
  try {
    const vite = spawn(
      'npx',
      ['vite', '--port', String(vitePort), '--strictPort', '--host', '127.0.0.1'],
      {
        cwd: root,
        stdio: 'ignore',
      },
    );
    procs.push(vite);
    await waitFor(`http://127.0.0.1:${vitePort}/`);
    const chrome = spawn(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        `--remote-debugging-port=${chromePort}`,
        `--user-data-dir=${profile}`,
        `--force-device-scale-factor=${dpr}`,
        `--window-size=${width},${height}`,
        '--mute-audio',
        '--no-first-run',
        '--no-default-browser-check',
        'about:blank',
      ],
      { stdio: 'ignore' },
    );
    procs.push(chrome);
    const list = await (await waitFor(`http://127.0.0.1:${chromePort}/json`)).json();
    const page = list.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0;
    const pend = new Map();
    const listeners = new Map();
    ws.addEventListener('message', (m) => {
      const d = JSON.parse(m.data);
      if (d.method) for (const l of listeners.get(d.method) ?? []) l(d.params);
      if (d.id && pend.has(d.id)) {
        const { res, rej } = pend.get(d.id);
        pend.delete(d.id);
        if (d.error) rej(new Error(JSON.stringify(d.error)));
        else res(d.result);
      }
    });
    const send = (method, params = {}) =>
      new Promise((res, rej) => {
        const i = ++id;
        pend.set(i, { res, rej });
        ws.send(JSON.stringify({ id: i, method, params }));
      });
    const ev = async (expr) => {
      const r = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
      });
      if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
      return r.result.value;
    };
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: `http://127.0.0.1:${vitePort}${path}` });
    await sleep(2500);
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile: false,
    });
    /** Hört auf CDP-Ereignisse, z. B. `Runtime.consoleAPICalled`. */
    const on = (method, l) => listeners.set(method, [...(listeners.get(method) ?? []), l]);
    return await fn({ ev, send, on, chromePort, close: () => ws.close() });
  } finally {
    for (const p of procs) p.kill('SIGTERM');
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }
}
