// Studioweite Sperre für volle Testläufe (R375 V1, R376).
// Aufruf: node tools/testlock/testlock.ts <befehl> [args...]
// Nimmt eine Lockdatei im gemeinsamen Git-Verzeichnis (alle Worktrees sehen sie),
// prüft den 1-min-Load und startet den Befehl. Belegt oder Load > LOAD_MAX: Exit 3, kein Warten.
// Auf CI (CI/GITHUB_ACTIONS) und in verschachtelten Läufen (STUDIO_TESTLOCK_HELD) läuft der Befehl direkt.
// TESTLOCK_FAKE_LOAD und TESTLOCK_PATH gibt es nur für Tests, nie zum Umgehen echter Prüfungen (R378).
// Übernahme toter Sperren: nur unter einem Wächterverzeichnis (<lock>.takeover, mkdir ist atomar); die tote
// Sperrdatei kann nur ein Wächterhalter löschen, daher kein ABA-Fenster.
import { spawn, execFileSync } from 'node:child_process';
import {
  linkSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { constants, loadavg } from 'node:os';
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
  child.on('exit', (code, sig) => finish(code ?? (sig ? 128 + (constants.signals[sig] ?? 0) : 1)));
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

const isSet = (v: string | undefined): boolean => !!v && v !== 'false' && v !== '0';
if (isSet(env.CI) || isSet(env.GITHUB_ACTIONS) || env.STUDIO_TESTLOCK_HELD) {
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
  const guard = `${lockPath}.takeover`;
  const takeOver = (seen: { pid?: number }): void => {
    try {
      mkdirSync(guard);
    } catch {
      let age = 0;
      try {
        age = Date.now() - statSync(guard).mtimeMs;
      } catch {
        /* Wächter schon weg */
      }
      if (age > 10_000) {
        try {
          rmdirSync(guard); // verwaister Wächter eines abgestürzten Prozesses
        } catch {
          /* egal */
        }
      }
      return; // anderer übernimmt gerade; nächster Versuch prüft neu
    }
    try {
      let now: { pid?: number } = {};
      try {
        now = JSON.parse(readFileSync(lockPath, 'utf8'));
      } catch (e) {
        // Sperre weg: nicht löschen. Ein anderer Lauf kann sie jetzt (ohne Wächter) neu anlegen;
        // unlink würde dessen lebende Sperre treffen (ABA). Der nächste Versuch legt sie selbst an.
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return;
        /* unlesbarer Inhalt: als veraltet behandeln */
      }
      if (now.pid && alive(now.pid)) return; // lebt doch (oder neu): nicht anfassen
      console.error(`testlock: veraltete Sperre (PID ${seen.pid ?? '?'} tot) übernommen.`);
      try {
        unlinkSync(lockPath);
      } catch {
        /* schon weg */
      }
    } finally {
      try {
        rmdirSync(guard);
      } catch {
        /* Wächter schon weg */
      }
    }
  };
  let acquired = false;
  for (let attempt = 0; attempt < 5 && !acquired; attempt++) {
    try {
      // vollständig in Temp-Datei schreiben, dann atomar per link anlegen (nie eine leere Sperre sichtbar)
      const tmp = `${lockPath}.${process.pid}.tmp`;
      writeFileSync(
        tmp,
        JSON.stringify({
          pid: process.pid,
          cwd: process.cwd(),
          cmd: argv.join(' '),
          since: new Date().toISOString(),
        }),
      );
      try {
        linkSync(tmp, lockPath);
      } finally {
        unlinkSync(tmp);
      }
      acquired = true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      const read = (): { pid?: number; cwd?: string; cmd?: string; since?: string } => {
        try {
          return JSON.parse(readFileSync(lockPath, 'utf8'));
        } catch {
          return {};
        }
      };
      let holder = read();
      if (!holder.pid) {
        // Inhaber hat die Datei evtl. gerade erst angelegt: kurz warten, dann neu lesen
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
        holder = read();
      }
      if (holder.pid && alive(holder.pid)) {
        console.error(
          `testlock: ABBRUCH, voller Testlauf läuft bereits (PID ${holder.pid}, seit ${holder.since}, in ${holder.cwd}: ${holder.cmd}). Sperrdatei: ${lockPath}. Nicht warten; später erneut oder gezielt per "npx vitest run <datei>".`,
        );
        process.exit(EXIT_BLOCKED);
      }
      takeOver(holder);
    }
  }
  if (!acquired) {
    console.error('testlock: ABBRUCH, Sperre nicht erhältlich (Wettlauf).');
    process.exit(EXIT_BLOCKED);
  }
  release = () => {
    try {
      // nur die eigene Sperre löschen
      if (JSON.parse(readFileSync(lockPath, 'utf8')).pid === process.pid) unlinkSync(lockPath);
    } catch {
      /* schon weg */
    }
  };
  process.on('exit', release);
  run();
}
