// T04 TOOL-MESSFENSTER: Messwerkzeuge setzen/lösen das Messfenster (tools/render-qa/messsperre.mjs).
// Läuft über kleine Treiber-Skripte in Temp-Verzeichnissen, alles gegen MESSFENSTER_PATH/TESTLOCK_PATH.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const nodeEnv = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
  .process.env;
const PID = (globalThis as unknown as { process: { pid: number } }).process.pid;
const DEAD_PID = 2_000_000_000;
const messsperre = new URL('../../tools/render-qa/messsperre.mjs', import.meta.url).href;
const sitzung = new URL('../../tools/render-qa/sitzung.mjs', import.meta.url).href;

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'messsperre-'));
  const lockPath = join(dir, 'messfenster');
  const testlockPath = join(dir, 'studio-testlock');
  const driver = (name: string, body: string) => {
    const f = join(dir, name);
    writeFileSync(f, body);
    return f;
  };
  const run = (file: string, args: string[] = [], env: Record<string, string> = {}) =>
    spawnSync('node', [file, ...args], {
      encoding: 'utf8',
      env: {
        ...nodeEnv,
        MESSFENSTER_HELD: undefined,
        LASTGATE_FAKE_LOAD: '1',
        MESSFENSTER_PATH: lockPath,
        TESTLOCK_PATH: testlockPath,
        ...env,
      },
    });
  return { dir, lockPath, testlockPath, driver, run };
}

const withDriver = (modus: string) => `
import { existsSync } from 'node:fs';
import { withMessfenster } from '${messsperre}';
const lock = process.env.MESSFENSTER_PATH;
const modus = '${modus}';
const r = await withMessfenster(async () => {
  console.log('drin lock=' + existsSync(lock) + ' held=' + process.env.MESSFENSTER_HELD + ' pid=' + process.pid);
  if (modus === 'throw') throw new Error('kaputt');
  if (modus === 'sigterm') process.kill(process.pid, 'SIGTERM');
  if (modus === 'sigterm') await (await import('node:timers/promises')).scheduler.wait(5000);
  return 42;
}, { owner: 'testmessung', dauerMin: 5, zweck: 'Probe' });
console.log('ergebnis=' + r);
`;

describe('T04 withMessfenster', () => {
  it('setzt die Sperre mit pid, gibt das Ergebnis zurück und löst sie danach', () => {
    const s = setup();
    const r = s.run(s.driver('ok.mjs', withDriver('ok')));
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('drin lock=true');
    expect(r.stdout).toMatch(/held=(\d+) pid=\1/);
    expect(r.stdout).toContain('ergebnis=42');
    expect(existsSync(s.lockPath)).toBe(false);
  });

  it('löst die Sperre auch bei Exception', () => {
    const s = setup();
    const r = s.run(s.driver('throw.mjs', withDriver('throw')));
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('kaputt');
    expect(existsSync(s.lockPath)).toBe(false);
  });

  it('löst die Sperre bei SIGTERM und beendet mit 143', () => {
    const s = setup();
    const r = s.run(s.driver('term.mjs', withDriver('sigterm')));
    expect(r.status).toBe(143);
    expect(existsSync(s.lockPath)).toBe(false);
  });

  it('MESSFENSTER_HELD mit lebendem PID: keine zweite Sperre, fremde bleibt unberührt', () => {
    const s = setup();
    const lock = {
      owner: 'wrapper',
      pid: PID,
      start: '2026-10-22T12:00:00.000Z',
      ende: '2099-01-01T00:00:00.000Z',
      zweck: 'Block',
      cwd: '/x',
    };
    writeFileSync(s.lockPath, JSON.stringify(lock));
    const r = s.run(s.driver('held.mjs', withDriver('ok')), [], {
      MESSFENSTER_HELD: String(PID),
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('ergebnis=42');
    expect(existsSync(s.lockPath)).toBe(true);
  });

  it('MESSFENSTER_HELD mit totem PID zählt nicht: Sperre wird genommen', () => {
    const s = setup();
    const r = s.run(s.driver('dead.mjs', withDriver('ok')), [], {
      MESSFENSTER_HELD: String(DEAD_PID),
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('drin lock=true');
  });

  it('belegtes Messfenster: Exit 3, Meldung, Funktion läuft nicht', () => {
    const s = setup();
    writeFileSync(
      s.lockPath,
      JSON.stringify({
        owner: 'andere',
        pid: PID,
        start: '2026-10-22T12:00:00.000Z',
        ende: '2099-01-01T00:00:00.000Z',
        zweck: 'Fremd',
        cwd: '/x',
      }),
    );
    const r = s.run(s.driver('belegt.mjs', withDriver('ok')));
    expect(r.status).toBe(3);
    expect(r.stderr).toContain('Messfenster belegt');
    expect(r.stdout).not.toContain('drin');
  });

  it('lebende Testsperre: Exit 3 «Testsperre belegt», keine Sperre bleibt', () => {
    const s = setup();
    writeFileSync(s.testlockPath, JSON.stringify({ pid: PID }));
    const r = s.run(s.driver('tl.mjs', withDriver('ok')));
    expect(r.status).toBe(3);
    expect(r.stderr).toContain('Testsperre belegt');
    expect(r.stdout).not.toContain('drin');
    expect(existsSync(s.lockPath)).toBe(false);
  });
});

describe('T04 messsperre CLI (Befehl unter Sperre)', () => {
  it('führt den Befehl mit MESSFENSTER_HELD unter Sperre aus und reicht den Exit-Code durch', () => {
    const s = setup();
    const cmd = [
      '--zweck',
      'Block',
      '--',
      'node',
      '-e',
      "console.log('held=' + process.env.MESSFENSTER_HELD + ' lock=' + require('fs').existsSync(process.env.MESSFENSTER_PATH)); process.exit(7)",
    ];
    const r = s.run(new URL(messsperre).pathname, cmd);
    expect(r.status).toBe(7);
    expect(r.stdout).toMatch(/held=\d+ lock=true/);
    expect(existsSync(s.lockPath)).toBe(false);
  });
});

describe('T04 sitzung.cli nimmt das Messfenster', () => {
  const cliDriver = `
import { existsSync } from 'node:fs';
import { cli } from '${sitzung}';
cli({}, 'HILFE');
console.log('lock=' + existsSync(process.env.MESSFENSTER_PATH));
`;
  it('nach dem Lastgate gesetzt, beim Prozessende gelöst', () => {
    const s = setup();
    const r = s.run(s.driver('cli.mjs', cliDriver));
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('lock=true');
    expect(existsSync(s.lockPath)).toBe(false);
  });
  it('Last über der Schwelle: Exit 1, keine Sperre', () => {
    const s = setup();
    const r = s.run(s.driver('cli.mjs', cliDriver), [], { LASTGATE_FAKE_LOAD: '9' });
    expect(r.status).toBe(1);
    expect(existsSync(s.lockPath)).toBe(false);
  });
  it('--help setzt keine Sperre', () => {
    const s = setup();
    const r = s.run(s.driver('cli.mjs', cliDriver), ['--help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('HILFE');
    expect(existsSync(s.lockPath)).toBe(false);
  });
  it('belegtes Messfenster: Exit 3', () => {
    const s = setup();
    writeFileSync(s.testlockPath, JSON.stringify({ pid: PID }));
    const r = s.run(s.driver('cli.mjs', cliDriver));
    expect(r.status).toBe(3);
    expect(r.stderr).toContain('Testsperre belegt');
  });
});
