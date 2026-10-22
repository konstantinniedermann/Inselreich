/* global process, console, setTimeout, clearTimeout */
// messsperre.mjs — Messwerkzeuge setzen und lösen das Messfenster (TOOL-MESSFENSTER, P-6, Ruling-Entwurf R824-E5).
// Nutzt acquire/release aus tools/messfenster/lock.ts (Dekker-Muster: eigene Sperre, dann Testsperre prüfen).
//   import { withMessfenster, holdMessfenster } from './messsperre.mjs';
//   await withMessfenster(async () => { ...Messung... }, { owner: 'hitch', dauerMin: 20, zweck: 'Hitch' });
// CLI (Befehl unter Sperre): node tools/render-qa/messsperre.mjs [--dauer <min>] [--zweck <text>] -- <befehl ...>
// Belegt oder Testsperre lebt: Meldung auf stderr, Exit 3, kein Warten. Gelöst wird in finally, bei Exception, beim
// Prozessende und bei SIGTERM/SIGINT/SIGHUP. MESSFENSTER_HELD=<pid> (lebend): Kinder des Wrappers nehmen keine zweite Sperre.
import { spawn } from 'node:child_process';
import { constants } from 'node:os';
import { fileURLToPath } from 'node:url';
import { acquire, release } from '../messfenster/lock.ts';

export const EXIT_BELEGT = 3;
export const VORGABE_DAUER_MIN = 20;
const SIGNALE = ['SIGINT', 'SIGTERM', 'SIGHUP'];

function lebt(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

/** Gilt eine Sperre des Wrappers (MESSFENSTER_HELD mit lebendem PID)? */
export function gehalten(env = process.env) {
  const pid = Number(env.MESSFENSTER_HELD);
  return Number.isInteger(pid) && pid > 0 && lebt(pid);
}

/**
 * Nimmt die Sperre synchron oder beendet den Prozess mit Exit 3. Löst sie über `release()`, beim Prozessende und bei
 * Signalen (Exit 128+n). `onSignal(sig)` darf ein Promise liefern und wird abgewartet, bevor die Sperre fällt
 * (z. B. Kind beenden, `beendeKind`). `signale: false`: der Aufrufer behandelt Signale selbst (Sperre fällt beim Exit).
 */
export function holdMessfenster({
  owner,
  dauerMin = VORGABE_DAUER_MIN,
  zweck = '',
  onSignal,
  signale = true,
} = {}) {
  if (gehalten()) return { gehalten: false, release() {} };
  const pid = process.pid;
  const r = acquire({ owner, dauerMin, zweck, pid });
  if (!r.ok) {
    console.error(`messfenster: ABBRUCH, ${r.reason}`);
    process.exit(EXIT_BELEGT);
  }
  const vorher = process.env.MESSFENSTER_HELD;
  process.env.MESSFENSTER_HELD = String(pid);
  let beendet = false;
  const handlers = (signale ? SIGNALE : []).map((sig) => {
    const h = async () => {
      if (beendet) return;
      beendet = true;
      try {
        await onSignal?.(sig);
      } finally {
        lose();
        process.exit(128 + constants.signals[sig]);
      }
    };
    process.on(sig, h);
    return [sig, h];
  });
  const lose = () => release({ owner, pid });
  process.on('exit', lose);
  return {
    gehalten: true,
    release() {
      lose();
      process.off('exit', lose);
      for (const [sig, h] of handlers) process.off(sig, h);
      if (vorher === undefined) delete process.env.MESSFENSTER_HELD;
      else process.env.MESSFENSTER_HELD = vorher;
    },
  };
}

/** Führt `fn` unter dem Messfenster aus; die Sperre fällt in jedem Fall wieder. */
export async function withMessfenster(fn, opts) {
  const h = holdMessfenster(opts);
  try {
    return await fn();
  } finally {
    h.release();
  }
}

/** Beendet das Kind mit `sig`, wartet auf dessen Exit und schickt nach `timeoutMs` SIGKILL. */
export function beendeKind(child, sig = 'SIGTERM', timeoutMs = 5000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((fertig) => {
    const t = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.once('exit', () => {
      clearTimeout(t);
      fertig();
    });
    child.kill(sig);
  });
}

/** Startet `befehl` (Kind erbt MESSFENSTER_HELD) und liefert dessen Exit-Code; `onStart(child)` gibt das Kind frei. */
export function startKind(befehl, onStart = () => {}, kind = spawn) {
  return new Promise((fertig) => {
    const child = kind(befehl[0], befehl.slice(1), { stdio: 'inherit' });
    onStart(child);
    child.on('error', (e) => {
      console.error(`Start fehlgeschlagen: ${e.message}`);
      fertig(1);
    });
    child.on('exit', (code, sig) => fertig(code ?? (sig ? 128 + constants.signals[sig] : 1)));
  });
}

async function main(argv) {
  const i = argv.indexOf('--');
  const opt = (name) => {
    const k = argv.indexOf(`--${name}`);
    return k >= 0 && (i < 0 || k < i) ? argv[k + 1] : undefined;
  };
  if (i < 0 || i === argv.length - 1 || argv.includes('--help')) {
    console.error(
      'Aufruf: messsperre.mjs [--dauer <min>] [--zweck <text>] -- <befehl ...>  (Befehl unter Messfenster-Sperre)',
    );
    return argv.includes('--help') ? 0 : 2;
  }
  const dauerMin = Number(opt('dauer') ?? VORGABE_DAUER_MIN);
  if (!(dauerMin > 0)) {
    console.error('messsperre: --dauer muss eine positive Zahl (Minuten) sein.');
    return 2;
  }
  let kind = null;
  return withMessfenster(() => startKind(argv.slice(i + 1), (c) => (kind = c)), {
    owner: 'messsperre',
    dauerMin,
    zweck: opt('zweck') ?? argv[i + 1],
    onSignal: (sig) => beendeKind(kind, sig),
  });
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv.slice(2)));
}
