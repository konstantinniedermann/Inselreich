// Messfenster-Sperre (tools/messfenster/lock.ts): Zustände, Verwaisterkennung, Atomarität, Wächter, Testsperre.
// Alles gegen Temp-Verzeichnisse (MESSFENSTER_PATH/TESTLOCK_PATH), nie gegen echte Sperren.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type Lock = {
  owner: string;
  pid?: number;
  start: string;
  ende: string;
  zweck: string;
  cwd: string;
};
type Opts = { path?: string; testlockPath?: string; now?: number };
type Result = { ok: boolean; reason?: string };
type LockApi = {
  readLock(path: string): Lock | null;
  isOrphan(lock: Lock, now?: number): boolean;
  acquire(o: Opts & { owner: string; dauerMin: number; zweck: string; pid?: number }): Result;
  release(o: Opts & { owner: string; pid?: number }): Result;
  status(o: Opts): { frei: boolean; text: string };
};
// dynamisch geladen: tsc soll die Node-Werkzeugdatei nicht mitprüfen (keine @types/node, ADR-001)
const libPath = '../../tools/messfenster/lock.ts';
const { acquire, isOrphan, readLock, release, status } = (await import(
  /* @vite-ignore */ libPath
)) as LockApi;
const PID = (globalThis as unknown as { process: { pid: number } }).process.pid;

const nodeEnv = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
  .process.env;
const script = new URL('../../tools/messfenster/lock.ts', import.meta.url).pathname;
const MIN = 60_000;
const NOW = Date.parse('2026-10-22T12:00:00Z');
const DEAD_PID = 2_000_000_000; // über jedem echten pid_max

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'messfenster-'));
  const path = join(dir, 'messfenster');
  const testlockPath = join(dir, 'studio-testlock');
  const cli = (...args: string[]) =>
    spawnSync('node', [script, ...args], {
      encoding: 'utf8',
      env: { ...nodeEnv, MESSFENSTER_PATH: path, TESTLOCK_PATH: testlockPath },
    });
  const write = (o: Record<string, unknown>) => writeFileSync(path, JSON.stringify(o));
  const base = { owner: 'a', start: new Date(NOW).toISOString(), zweck: 'z', cwd: '/x' };
  const ende = (offsetMin: number) => new Date(NOW + offsetMin * MIN).toISOString();
  return { path, testlockPath, cli, write, base, ende };
}

describe('messfenster lock', () => {
  it('frei: keine Datei, status meldet frei', () => {
    const { path, testlockPath } = setup();
    expect(readLock(path)).toBeNull();
    const s = status({ path, testlockPath, now: NOW });
    expect(s.frei).toBe(true);
  });

  it('belegt: lebende PID, Zeit nicht abgelaufen; status nennt Eigentümer, Zweck, bis-Zeit', () => {
    const { path, testlockPath, write, base, ende } = setup();
    write({ ...base, pid: PID, ende: ende(30) });
    expect(isOrphan(readLock(path)!, NOW)).toBe(false);
    const s = status({ path, testlockPath, now: NOW });
    expect(s.frei).toBe(false);
    expect(s.text).toContain('a');
    expect(s.text).toContain('z');
    expect(s.text).toContain(ende(30));
  });

  it('verwaist: tote PID', () => {
    const { path, write, base, ende } = setup();
    write({ ...base, pid: DEAD_PID, ende: ende(30) });
    expect(isOrphan(readLock(path)!, NOW)).toBe(true);
  });

  it('verwaist: Zeit über ende + 5 min Karenz; innerhalb der Karenz nicht', () => {
    const { path, write, base, ende } = setup();
    write({ ...base, pid: PID, ende: ende(-4) });
    expect(isOrphan(readLock(path)!, NOW)).toBe(false);
    write({ ...base, pid: PID, ende: ende(-6) });
    expect(isOrphan(readLock(path)!, NOW)).toBe(true);
  });

  it('ohne PID zählt nur die Zeit', () => {
    const { path, write, base, ende } = setup();
    write({ ...base, ende: ende(10) });
    expect(isOrphan(readLock(path)!, NOW)).toBe(false);
    write({ ...base, ende: ende(-10) });
    expect(isOrphan(readLock(path)!, NOW)).toBe(true);
  });

  it('atomares Setzen: zweiter set => Exit 3, erste Sperre bleibt', () => {
    const { path, cli } = setup();
    expect(cli('set', '--owner', 'a', '--dauer', '30', '--zweck', 'eins').status).toBe(0);
    const second = cli('set', '--owner', 'b', '--dauer', '30', '--zweck', 'zwei');
    expect(second.status).toBe(3);
    expect(JSON.parse(readFileSync(path, 'utf8')).owner).toBe('a');
  });

  it('clear löscht nur die eigene Sperre (Owner)', () => {
    const { path, cli } = setup();
    cli('set', '--owner', 'a', '--dauer', '30', '--zweck', 'z');
    expect(cli('clear', '--owner', 'b').status).toBe(3);
    expect(existsSync(path)).toBe(true);
    expect(cli('clear', '--owner', 'a').status).toBe(0);
    expect(existsSync(path)).toBe(false);
  });

  it('release prüft PID, wenn die Sperre eine hat', () => {
    const { path, write, base, ende } = setup();
    write({ ...base, pid: PID, ende: ende(30) });
    expect(release({ path, owner: 'a', pid: PID + 1 }).ok).toBe(false);
    expect(release({ path, owner: 'a', pid: PID }).ok).toBe(true);
    expect(existsSync(path)).toBe(false);
  });

  it('verwaiste Sperre wird übernommen (Hinweis auf stderr) und der Wächter danach entfernt', () => {
    const { path, cli, write, base } = setup();
    write({ ...base, ende: '2000-01-01T00:00:00.000Z' });
    const p = cli('set', '--owner', 'b', '--dauer', '30', '--zweck', 'neu');
    expect(p.status).toBe(0);
    expect(p.stderr).toContain('verwaist');
    expect(JSON.parse(readFileSync(path, 'utf8')).owner).toBe('b');
    expect(existsSync(`${path}.takeover`)).toBe(false);
  });

  it('Wächter belegt: verwaiste Sperre wird nicht übernommen', () => {
    const { path, cli, write, base } = setup();
    write({ ...base, ende: '2000-01-01T00:00:00.000Z' });
    mkdirSync(`${path}.takeover`);
    const p = cli('set', '--owner', 'b', '--dauer', '30', '--zweck', 'neu');
    expect(p.status).toBe(3);
    expect(JSON.parse(readFileSync(path, 'utf8')).owner).toBe('a');
  });

  it('Testsperre lebt => acquire verweigert und löst die eigene Sperre wieder', () => {
    const { path, testlockPath, cli } = setup();
    writeFileSync(testlockPath, JSON.stringify({ pid: PID }));
    const r = acquire({ path, testlockPath, owner: 'a', dauerMin: 30, zweck: 'z', now: NOW });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('Testsperre');
    expect(existsSync(path)).toBe(false);
    expect(cli('set', '--owner', 'a', '--dauer', '30', '--zweck', 'z').status).toBe(3);
  });

  it('tote Testsperre blockiert nicht', () => {
    const { path, testlockPath } = setup();
    writeFileSync(testlockPath, JSON.stringify({ pid: DEAD_PID }));
    const r = acquire({ path, testlockPath, owner: 'a', dauerMin: 30, zweck: 'z', now: NOW });
    expect(r.ok).toBe(true);
    expect(readLock(path)?.owner).toBe('a');
  });

  it('CLI status: frei Exit 0, belegt Exit 3 mit deutscher Zeile', () => {
    const { cli } = setup();
    expect(cli('status').status).toBe(0);
    cli('set', '--owner', 'a', '--dauer', '30', '--zweck', 'Perf');
    const s = cli('status');
    expect(s.status).toBe(3);
    expect(s.stdout).toContain('Messfenster belegt');
    expect(s.stdout).toContain('Perf');
  });
});
