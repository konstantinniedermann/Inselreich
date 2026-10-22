// Messfenster-Sperre (Plan TOOL-MESSFENSTER, P-1 bis P-4): Messungen und volle Testläufe schliessen sich aus.
// CLI:  node tools/messfenster/lock.ts set --owner X --dauer <min> --zweck "…" [--pid N]
//       node tools/messfenster/lock.ts clear --owner X [--pid N]
//       node tools/messfenster/lock.ts status
// Exit 0 = frei/gesetzt/gelöst, 3 = belegt/verweigert, 2 = Aufruffehler.
// Sperrdatei: <Hauptrepo>/.studio/messfenster (JSON), Überschreibung MESSFENSTER_PATH nur für Tests (R378).
// Testsperre: <git-common-dir>/studio-testlock (JSON mit pid), Überschreibung TESTLOCK_PATH nur für Tests.
//
// Stabile Schnittstelle (T02 testlock.ts, T04 messsperre.mjs importieren diese Funktionen):
//   type Lock = { owner, pid?, start, ende (ISO), zweck, cwd }
//   type Opts = { path?, testlockPath?, now? }            // Vorgaben: Standardpfade, Date.now()
//   readLock(path): Lock | null                           // fehlt/unlesbar => null
//   isOrphan(lock, now?): boolean                         // pid tot ODER now > ende + Karenz
//   acquire(Opts & { owner, dauerMin, zweck, pid?, cwd? }): { ok, reason?, lock? }
//   release(Opts & { owner, pid? }): { ok, reason? }      // nur die eigene (owner, und pid falls beides gesetzt)
//   status(Opts): { frei, lock?, text }                   // liest nur, löscht nichts
//   defaultLockPath(), defaultTestlockPath()
// Übernahme verwaister Sperren nur unter Wächterverzeichnis <datei>.takeover (mkdir atomar), Hinweis auf stderr.
// acquire folgt dem Dekker-Muster: erst eigene Sperre atomar setzen, dann die lebende Testsperre prüfen.
import { execFileSync } from 'node:child_process';
import {
  linkSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const KARENZ_MS = 5 * 60_000;
export const VORGABE_DAUER_MIN = 70;
const GUARD_STALE_MS = 10_000;
const MAX_ATTEMPTS = 5;
const EXIT_BLOCKED = 3;

export type Lock = {
  owner: string;
  pid?: number;
  start: string;
  ende: string;
  zweck: string;
  cwd: string;
};
export type Opts = { path?: string; testlockPath?: string; now?: number };
export type Result = { ok: boolean; reason?: string; lock?: Lock };

const env = process.env;

function commonDir(): string {
  return execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    encoding: 'utf8',
  }).trim();
}

export function defaultLockPath(): string {
  return env.MESSFENSTER_PATH ?? resolve(dirname(commonDir()), '.studio', 'messfenster');
}

export function defaultTestlockPath(): string {
  return env.TESTLOCK_PATH ?? resolve(commonDir(), 'studio-testlock');
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

export function readLock(path: string): Lock | null {
  try {
    const l = JSON.parse(readFileSync(path, 'utf8')) as Lock;
    return l && typeof l === 'object' ? l : null;
  } catch {
    return null;
  }
}

export function isOrphan(lock: Lock, now: number = Date.now()): boolean {
  if (typeof lock.pid === 'number' && !alive(lock.pid)) return true;
  const ende = Date.parse(lock.ende);
  return !Number.isFinite(ende) || now > ende + KARENZ_MS;
}

function describe(l: Lock): string {
  return `Messfenster belegt: Eigentümer ${l.owner}, Zweck ${l.zweck}, bis ${l.ende}`;
}

export function status(o: Opts = {}): { frei: boolean; lock?: Lock; text: string } {
  const lock = readLock(o.path ?? defaultLockPath());
  if (!lock) return { frei: true, text: 'Messfenster frei' };
  if (isOrphan(lock, o.now ?? Date.now()))
    return { frei: true, lock, text: `Messfenster frei (verwaiste Sperre von ${lock.owner})` };
  return { frei: false, lock, text: describe(lock) };
}

function testlockHolder(path: string): number | undefined {
  try {
    const pid = (JSON.parse(readFileSync(path, 'utf8')) as { pid?: number }).pid;
    return typeof pid === 'number' && alive(pid) ? pid : undefined;
  } catch {
    return undefined;
  }
}

// Übernahme einer verwaisten Sperre unter Wächter; true = Datei wurde entfernt.
function takeOver(path: string, now: number): boolean {
  const guard = `${path}.takeover`;
  try {
    mkdirSync(guard);
  } catch {
    try {
      if (Date.now() - statSync(guard).mtimeMs > GUARD_STALE_MS) rmdirSync(guard);
    } catch {
      /* Wächter schon weg */
    }
    return false;
  }
  try {
    const now_ = readLock(path);
    if (now_ && !isOrphan(now_, now)) return false; // inzwischen neu und lebend
    if (now_ === null) {
      try {
        statSync(path);
      } catch {
        return true; // weg: nichts zu löschen, nächster Versuch legt an
      }
    }
    console.error(
      `messfenster: verwaiste Sperre (Eigentümer ${now_?.owner ?? '?'}, bis ${now_?.ende ?? '?'}) übernommen.`,
    );
    try {
      unlinkSync(path);
    } catch {
      /* schon weg */
    }
    return true;
  } finally {
    try {
      rmdirSync(guard);
    } catch {
      /* schon weg */
    }
  }
}

function linkNew(path: string, lock: Lock): boolean {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(lock));
  try {
    linkSync(tmp, path);
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') return false;
    throw e;
  } finally {
    unlinkSync(tmp);
  }
}

export function acquire(
  o: Opts & { owner: string; dauerMin: number; zweck: string; pid?: number; cwd?: string },
): Result {
  const path = o.path ?? defaultLockPath();
  const now = o.now ?? Date.now();
  const lock: Lock = {
    owner: o.owner,
    ...(o.pid !== undefined ? { pid: o.pid } : {}),
    start: new Date(now).toISOString(),
    ende: new Date(now + o.dauerMin * 60_000).toISOString(),
    zweck: o.zweck,
    cwd: o.cwd ?? process.cwd(),
  };
  let set = false;
  for (let i = 0; i < MAX_ATTEMPTS && !set; i++) {
    if (linkNew(path, lock)) {
      set = true;
      break;
    }
    const holder = readLock(path);
    if (holder && !isOrphan(holder, now))
      return { ok: false, reason: describe(holder), lock: holder };
    if (!takeOver(path, now)) {
      const again = readLock(path);
      if (again && !isOrphan(again, now))
        return { ok: false, reason: describe(again), lock: again };
      if (i === MAX_ATTEMPTS - 1) break;
    }
  }
  if (!set) return { ok: false, reason: 'Messfenster nicht erhältlich (Wächter belegt)' };
  const tl = testlockHolder(o.testlockPath ?? defaultTestlockPath());
  if (tl !== undefined) {
    release({ path, owner: o.owner, pid: o.pid });
    return { ok: false, reason: `Testsperre belegt (PID ${tl}), Messfenster nicht gesetzt` };
  }
  return { ok: true, lock };
}

export function release(o: Opts & { owner: string; pid?: number }): Result {
  const path = o.path ?? defaultLockPath();
  const lock = readLock(path);
  if (!lock) return { ok: true };
  if (
    lock.owner !== o.owner ||
    (lock.pid !== undefined && o.pid !== undefined && lock.pid !== o.pid)
  )
    return { ok: false, reason: `Sperre gehört ${lock.owner}, nicht ${o.owner}`, lock };
  try {
    unlinkSync(path);
  } catch {
    /* schon weg */
  }
  return { ok: true };
}

function cli(args: string[]): number {
  const [cmd, ...rest] = args;
  const opt = (name: string): string | undefined => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  const num = (v: string | undefined): number | undefined =>
    v === undefined ? undefined : Number(v);
  if (cmd === 'status') {
    const s = status();
    console.log(s.text);
    return s.frei ? 0 : EXIT_BLOCKED;
  }
  const owner = opt('owner');
  if (!owner || (cmd !== 'set' && cmd !== 'clear')) {
    console.error(
      'Aufruf: lock.ts set --owner X --dauer <min> --zweck "…" [--pid N] | clear --owner X | status',
    );
    return 2;
  }
  const pid = num(opt('pid'));
  if (cmd === 'clear') {
    const r = release({ owner, pid });
    if (!r.ok) console.error(`messfenster: ${r.reason}`);
    return r.ok ? 0 : EXIT_BLOCKED;
  }
  const dauerMin = num(opt('dauer') ?? String(VORGABE_DAUER_MIN));
  if (!Number.isFinite(dauerMin) || (dauerMin as number) <= 0) {
    console.error('messfenster: --dauer muss eine positive Zahl (Minuten) sein.');
    return 2;
  }
  const r = acquire({ owner, dauerMin: dauerMin as number, zweck: opt('zweck') ?? '', pid });
  if (!r.ok) {
    console.error(`messfenster: ABBRUCH, ${r.reason}`);
    return EXIT_BLOCKED;
  }
  console.log(`Messfenster gesetzt: ${r.lock?.owner} bis ${r.lock?.ende}`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(cli(process.argv.slice(2)));
}
