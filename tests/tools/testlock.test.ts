// R375 V1: studioweite Testsperre (tools/testlock/testlock.ts); Last per TESTLOCK_FAKE_LOAD simuliert.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

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
  it('zwei parallele Läufe auf toter Sperre: genau einer gewinnt', () => {
    for (let round = 0; round < 4; round++) {
      const { lock } = setup();
      writeFileSync(lock, holder(2147483646, 'alt'));

      const sh = spawnSync(
        'sh',
        [
          '-c',
          `for i in 1 2 3; do node "${script}" node -e 'console.log("RAN");setTimeout(()=>{},800)' & done; wait`,
        ],
        {
          encoding: 'utf8',
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
      expect(sh.stdout.split('RAN').length - 1).toBe(1);
      expect(existsSync(lock)).toBe(false);
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
