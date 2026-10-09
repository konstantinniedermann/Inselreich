// Studioweite Sperre für volle Testläufe (R375 V1, R376).
// Aufruf: node tools/testlock/testlock.ts <befehl> [args...]
// Nimmt eine Lockdatei im gemeinsamen Git-Verzeichnis (alle Worktrees sehen sie),
// prüft den 1-min-Load und startet den Befehl. Belegt oder Load > LOAD_MAX: Exit 3, kein Warten.
// Auf CI (CI/GITHUB_ACTIONS) und in verschachtelten Läufen (STUDIO_TESTLOCK_HELD) läuft der Befehl direkt.
import { spawn, execFileSync } from 'node:child_process';
import { closeSync, openSync, readFileSync, unlinkSync, writeSync } from 'node:fs';
import { loadavg } from 'node:os';
import { resolve } from 'node:path';

export const LOAD_MAX = 8;
const EXIT_BLOCKED = 3;

const env = process.env;
const argv = process.argv.slice(2);
if (argv.length === 0) {
  console.error('Aufruf: node tools/testlock/testlock.ts <befehl> [args...]');
  process.exit(2);
}

function run(): void {
  const child = spawn(argv[0], argv.slice(1), {
    stdio: 'inherit',
    env: { ...env, STUDIO_TESTLOCK_HELD: '1' },
  });
  child.on('exit', (code, sig) => finish(code ?? (sig ? 128 : 1)));
  child.on('error', (e) => {
    console.error(`testlock: Start fehlgeschlagen: ${e.message}`);
    finish(127);
  });
  for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(s, () => child.kill(s));
}

let release = (): void => {};
function finish(code: number): never {
  release();
  process.exit(code);
}

if (env.CI || env.GITHUB_ACTIONS || env.STUDIO_TESTLOCK_HELD) {
  run();
} else {
  const load = env.TESTLOCK_FAKE_LOAD !== undefined ? Number(env.TESTLOCK_FAKE_LOAD) : loadavg()[0];
  if (!(load <= LOAD_MAX)) {
    console.error(
      `testlock: ABBRUCH, 1-min-Load ${load.toFixed(2)} > ${LOAD_MAX}. Voller Testlauf nicht belastbar; warten oder gezielt per "npx vitest run <datei>" testen.`,
    );
    process.exit(EXIT_BLOCKED);
  }
  const lockPath =
    env.TESTLOCK_PATH ??
    resolve(
      execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
        encoding: 'utf8',
      }).trim(),
      'studio-testlock',
    );
  const alive = (pid: number): boolean => {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return (e as NodeJS.ErrnoException).code === 'EPERM';
    }
  };
  let acquired = false;
  for (let attempt = 0; attempt < 3 && !acquired; attempt++) {
    try {
      const fd = openSync(lockPath, 'wx');
      writeSync(
        fd,
        JSON.stringify({
          pid: process.pid,
          cwd: process.cwd(),
          cmd: argv.join(' '),
          since: new Date().toISOString(),
        }),
      );
      closeSync(fd);
      acquired = true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      let holder: { pid?: number; cwd?: string; cmd?: string; since?: string } = {};
      try {
        holder = JSON.parse(readFileSync(lockPath, 'utf8'));
      } catch {
        /* halb geschrieben oder unlesbar: wie veraltet behandeln, wenn nach kurzer Zeit noch so */
      }
      if (holder.pid && alive(holder.pid)) {
        console.error(
          `testlock: ABBRUCH, voller Testlauf läuft bereits (PID ${holder.pid}, seit ${holder.since}, in ${holder.cwd}: ${holder.cmd}). Nicht warten; später erneut oder gezielt per "npx vitest run <datei>".`,
        );
        process.exit(EXIT_BLOCKED);
      }
      console.error(`testlock: veraltete Sperre (PID ${holder.pid ?? '?'} tot) übernommen.`);
      try {
        unlinkSync(lockPath);
      } catch {
        /* anderer Prozess war schneller; nächster Versuch entscheidet */
      }
    }
  }
  if (!acquired) {
    console.error('testlock: ABBRUCH, Sperre nicht erhältlich (Wettlauf).');
    process.exit(EXIT_BLOCKED);
  }
  release = () => {
    try {
      unlinkSync(lockPath);
    } catch {
      /* schon weg */
    }
  };
  process.on('exit', release);
  run();
}
