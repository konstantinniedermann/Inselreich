/* global process, console, fetch, setTimeout, URL, WebSocket */
// lib.mjs — gemeinsame Helfer der Render-QA-Skripte (H-R7): Vite-Dev-Server und Headless-Chrome starten,
// minimaler CDP-Client (Node-WebSocket, keine Abhängigkeiten). Nur Entwicklungswerkzeug, nie im Build.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Eigene Kindprozesse (Vite, Chrome) laufen in je eigener Prozessgruppe (`detached`) und stehen in `registry`.
// Beendet wird nur über diese selbst gestarteten PIDs/Gruppen (`process.kill(-pid, …)`), nie über Namen. Aufräumen
// bei Normalende, Fehler, SIGINT/SIGTERM/SIGHUP, uncaughtException und `exit`.
const registry = new Set();
const profiles = new Set();
const killGroup = (pid, sig) => {
  if (!Number.isInteger(pid) || pid <= 1) return;
  try {
    process.kill(-pid, sig);
  } catch {
    /* Gruppe schon weg */
  }
};

/** Startet einen Kindprozess in eigener Prozessgruppe und trägt ihn in die Registry ein. */
export function spawnTracked(cmd, args, opts = {}) {
  const child = spawn(cmd, args, { stdio: 'ignore', ...opts, detached: true });
  child.exited = new Promise((r) => child.once('exit', r));
  registry.add(child);
  child.once('exit', () => registry.delete(child));
  return child;
}

/** SIGTERM an die Gruppe; SIGKILL nur, wenn das Kind nach kurzer Frist noch läuft (nie nach bestätigtem Exit). */
export async function stopTracked(child, graceMs = 1500) {
  const alive = () => child.exitCode === null && child.signalCode === null;
  if (child.pid && alive()) {
    killGroup(child.pid, 'SIGTERM');
    await Promise.race([child.exited, sleep(graceMs)]);
    if (alive()) killGroup(child.pid, 'SIGKILL');
  }
  registry.delete(child);
}

const removeProfile = (dir) => rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
const killAllSync = () => {
  for (const c of registry) if (c.pid) killGroup(c.pid, 'SIGKILL');
  registry.clear();
  for (const d of profiles) {
    try {
      removeProfile(d);
    } catch {
      /* best effort */
    }
  }
  profiles.clear();
};
let cleaning = false;
const die = (code) => {
  if (cleaning) return;
  cleaning = true;
  for (const c of registry) if (c.pid) killGroup(c.pid, 'SIGTERM');
  setTimeout(() => process.exit(code), 400).unref?.();
  // 'exit' (synchron) erledigt SIGKILL und Profilverzeichnis.
};
process.on('exit', killAllSync);
process.on('SIGINT', () => die(130));
process.on('SIGTERM', () => die(143));
process.on('SIGHUP', () => die(129));
process.on('uncaughtException', (e) => {
  console.error(e);
  die(1);
});

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
  profiles.add(profile);
  try {
    const vite = spawnTracked(
      'npx',
      ['vite', '--port', String(vitePort), '--strictPort', '--host', '127.0.0.1'],
      { cwd: root },
    );
    procs.push(vite);
    await waitFor(`http://127.0.0.1:${vitePort}/`);
    const chrome = spawnTracked(CHROME, [
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
    ]);
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
    await Promise.all(procs.map((p) => stopTracked(p)));
    removeProfile(profile);
    profiles.delete(profile);
  }
}

/** Headless-Chrome meldet je Grösse die Audio-Warnung aus `src/audio/`; sie ist erwartet und kein Befund. */
export function istErwarteteWarnung(text) {
  return /AudioContext was not allowed to start/.test(text);
}

/**
 * Liest `lies()` im Abstand, bis `gleich` aufeinanderfolgende Lesungen (per JSON) gleich sind.
 * Nach `maxMs` (also maxMs / abstandMs Lesungen) endet es mit der letzten Lesung und `ruhig: false`.
 */
export async function warteBisRuhig(
  lies,
  {
    gleich = 3,
    abstandMs = 100,
    maxMs = 3000,
    schlaf = (ms) => new Promise((r) => setTimeout(r, ms)),
  } = {},
) {
  const maxLesungen = Math.max(gleich, Math.floor(maxMs / abstandMs));
  let wert;
  let letzte = null;
  let serie = 0;
  for (let n = 0; n < maxLesungen; n++) {
    wert = await lies();
    const s = JSON.stringify(wert);
    serie = s === letzte ? serie + 1 : 1;
    letzte = s;
    if (serie >= gleich) return { wert, ruhig: true };
    if (n < maxLesungen - 1) await schlaf(abstandMs);
  }
  return { wert, ruhig: false };
}
