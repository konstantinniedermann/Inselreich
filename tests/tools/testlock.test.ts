// R375 V1: studioweite Testsperre (tools/testlock/testlock.ts); Last per TESTLOCK_FAKE_LOAD simuliert.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findOrphans, orphanNotice, parseEtime } from '../../tools/testlock/orphans';

const nodeEnv = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
  .process.env;
const script = new URL('../../tools/testlock/testlock.ts', import.meta.url).pathname;

function setup() {
  const lock = join(mkdtempSync(join(tmpdir(), 'testlock-')), 'lock');
  const run = (extra: Record<string, string | undefined>, ...cmd: string[]) =>
    spawnSync('node', [script, ...cmd], {
      encoding: 'utf8',
      env: {
        ...nodeEnv,
        CI: undefined,
        GITHUB_ACTIONS: undefined,
        STUDIO_TESTLOCK_HELD: undefined,
        TESTLOCK_PATH: lock,
        TESTLOCK_FAKE_LOAD: '1',
        ...extra,
      },
    });
  return { lock, run };
}

const holder = (pid: number, cmd: string) =>
  JSON.stringify({ pid, cwd: '/x', cmd, since: 'jetzt' });

describe('testlock', () => {
  it('freie Sperre, niedrige Last: Befehl läuft, Exit-Code durchgereicht, Sperre danach frei', () => {
    const { lock, run } = setup();
    expect(run({}, 'node', '-e', 'process.exit(0)').status).toBe(0);
    expect(existsSync(lock)).toBe(false);
    expect(run({}, 'node', '-e', 'process.exit(5)').status).toBe(5);
    expect(existsSync(lock)).toBe(false);
  });

  it('Last > 8: Abbruch mit Grund, Exit 3, Befehl läuft nicht', () => {
    const { run } = setup();
    const p = run({ TESTLOCK_FAKE_LOAD: '9' }, 'node', '-e', 'console.log("GELAUFEN")');
    expect(p.status).toBe(3);
    expect(p.stderr).toContain('Load');
    expect(p.stdout).not.toContain('GELAUFEN');
  });

  it('Last genau 8 ist erlaubt', () => {
    const { run } = setup();
    expect(run({ TESTLOCK_FAKE_LOAD: '8' }, 'node', '-e', '0').status).toBe(0);
  });

  it('belegte Sperre (lebender Prozess): Abbruch Exit 3 mit Halter, Sperre bleibt', () => {
    const { lock, run } = setup();
    writeFileSync(lock, holder(1, 'make test'));
    const p = run({}, 'node', '-e', 'console.log("GELAUFEN")');
    expect(p.status).toBe(3);
    expect(p.stderr).toContain('läuft bereits');
    expect(p.stderr).toContain('make test');
    expect(p.stdout).not.toContain('GELAUFEN');
    expect(existsSync(lock)).toBe(true);
  });

  it('veraltete Sperre (Prozess tot) wird übernommen', () => {
    const { lock, run } = setup();
    writeFileSync(lock, holder(2147483646, 'alt'));
    const p = run({}, 'node', '-e', 'console.log("GELAUFEN")');
    expect(p.status).toBe(0);
    expect(p.stderr).toContain('veraltete Sperre');
    expect(p.stdout).toContain('GELAUFEN');
    expect(existsSync(lock)).toBe(false);
  });

  it('Sperre wird auch bei Fehlschlag des Befehls freigegeben', () => {
    const { lock, run } = setup();
    expect(run({}, 'node', '-e', 'process.exit(1)').status).toBe(1);
    expect(existsSync(lock)).toBe(false);
  });

  it('CI: weder Sperre noch Lastprüfung', () => {
    const { lock, run } = setup();
    writeFileSync(lock, holder(1, 'x'));
    const p = run(
      { CI: 'true', TESTLOCK_FAKE_LOAD: '99' },
      'node',
      '-e',
      'console.log("GELAUFEN")',
    );
    expect(p.status).toBe(0);
    expect(p.stdout).toContain('GELAUFEN');
  });

  it('verschachtelt (STUDIO_TESTLOCK_HELD): läuft ohne zweite Sperre', () => {
    const { lock, run } = setup();
    writeFileSync(lock, holder(1, 'x'));
    expect(run({ STUDIO_TESTLOCK_HELD: '1' }, 'node', '-e', '0').status).toBe(0);
  });
});

describe('testlock (R378)', () => {
  it('zwei parallele Läufe auf toter Sperre: genau einer gewinnt', async () => {
    // R389: die 4 Runden laufen gleichzeitig (je eigene Sperre); die 1500-ms-Haltezeit (Startversatz der 12 Prozesse unter Last) je Runde
    // bleibt, sie sichert die Überlappung der 3 Läufe (R387). Wandzeit ≈ 1 Runde statt 4.
    const round = () =>
      new Promise<{ ran: number; lockLeft: boolean }>((resolve, reject) => {
        const { lock } = setup();
        writeFileSync(lock, holder(2147483646, 'alt'));
        const sh = spawn(
          'sh',
          [
            '-c',
            `for i in 1 2 3; do node "${script}" node -e 'console.log("RAN");setTimeout(()=>{},1500)' & done; wait`,
          ],
          {
            env: {
              ...nodeEnv,
              CI: undefined,
              GITHUB_ACTIONS: undefined,
              STUDIO_TESTLOCK_HELD: undefined,
              TESTLOCK_PATH: lock,
              TESTLOCK_FAKE_LOAD: '1',
            },
          },
        );
        let out = '';
        sh.stdout.on('data', (d) => (out += d.toString()));
        sh.on('error', reject);
        sh.on('close', () =>
          resolve({ ran: out.split('RAN').length - 1, lockLeft: existsSync(lock) }),
        );
      });
    const results = await Promise.all([round(), round(), round(), round()]);
    for (const r of results) {
      expect(r.ran).toBe(1);
      expect(r.lockLeft).toBe(false);
    }
  }, 30_000);

  it('CI=false, CI=0 und leeres CI gelten nicht als CI', () => {
    const { lock, run } = setup();
    writeFileSync(lock, holder(1, 'x'));
    for (const ci of ['false', '0', '']) {
      expect(run({ CI: ci }, 'node', '-e', '0').status).toBe(3);
    }
  });

  it('Signal-Ende des Befehls: Exit 128 + Signalnummer', () => {
    const { run } = setup();
    expect(run({}, 'node', '-e', 'process.kill(process.pid,"SIGTERM")').status).toBe(143);
  });
});

const PS = [
  '  4242     1 01:02:03 node (vitest 3)',
  '  4243     1    05:00 node (vitest 4)', // zu jung
  '  4244   900 2-00:00:00 node /x/node_modules/.bin/vitest run', // hat Eltern
  '  4245     1 1-00:00:00 /usr/sbin/syslogd', // kein vitest
  '  4246     1    45:10 node /x/node_modules/.bin/vitest run',
].join('\n');

describe('verwaiste Vitest-Prozesse (TOOL-STUDIO-HYGIENE)', () => {
  it('parseEtime: mm:ss, hh:mm:ss, d-hh:mm:ss, Müll', () => {
    expect(parseEtime('05:00')).toBe(300);
    expect(parseEtime('01:02:03')).toBe(3723);
    expect(parseEtime('2-00:00:00')).toBe(172800);
    expect(Number.isNaN(parseEtime('x'))).toBe(true);
  });
  it('findOrphans: nur PPID 1, vitest, >= 30 min, nicht der eigene PID', () => {
    expect(findOrphans(PS, 1).map((o) => o.pid)).toEqual([4242, 4246]);
    expect(findOrphans(PS, 4242).map((o) => o.pid)).toEqual([4246]);
  });
  it('orphanNotice: leer ohne Waisen, sonst PIDs und Hinweis kill <pid>', () => {
    expect(orphanNotice([])).toBe('');
    const text = orphanNotice(findOrphans(PS, 1));
    expect(text).toContain('PID 4242');
    expect(text).toContain('verwaist');
    expect(text).toContain('nicht beendet');
  });
  it('Testsperre meldet Waisen, Befehl läuft, Exit unverändert', () => {
    const { run } = setup();
    const ps = join(mkdtempSync(join(tmpdir(), 'ps-')), 'ps.txt');
    writeFileSync(ps, PS);
    const p = run({ TESTLOCK_PS_FIXTURE: ps }, 'node', '-e', 'process.exit(0)');
    expect(p.status).toBe(0);
    expect(p.stderr).toContain('PID 4242');
    expect(p.stderr).not.toContain('PID 4243');
  });
  it('Hinweis auch bei Lastabbruch, Exit bleibt 3', () => {
    const { run } = setup();
    const ps = join(mkdtempSync(join(tmpdir(), 'ps-')), 'ps.txt');
    writeFileSync(ps, PS);
    const p = run({ TESTLOCK_PS_FIXTURE: ps, TESTLOCK_FAKE_LOAD: '9' }, 'node', '-e', '0');
    expect(p.status).toBe(3);
    expect(p.stderr).toContain('PID 4242');
  });
  it('ohne Waisen kein Hinweis', () => {
    const { run } = setup();
    const ps = join(mkdtempSync(join(tmpdir(), 'ps-')), 'ps.txt');
    writeFileSync(ps, '  1 0 10-00:00:00 /sbin/launchd');
    expect(run({ TESTLOCK_PS_FIXTURE: ps }, 'node', '-e', '0').stderr).not.toContain('verwaist');
  });
});
