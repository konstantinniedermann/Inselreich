# T04 · Waisen-Hinweis der Testsperre und Smoke-Etikett (TOOL-STUDIO-HYGIENE Teil 2, R419)

Strang `ts` · Worktree `.worktrees/buendel-ts` · Branch `tool/buendel-ts` · Umsetzer `tech-ui-engineer` (sonnet) · AK-TB07, AK-TB15

**Files:**

- Create: `tools/testlock/orphans.ts` (rein, keine `node:`-Importe), `tools/render-qa/saveVersion.mjs`
- Modify: `tools/testlock/testlock.ts` (Hinweis vor der Lastprüfung), `tools/render-qa/smoke.mjs:466` (Etikett)
- Test: `tests/tools/testlock.test.ts`, `tests/tools/renderqa.test.ts`

**Regel Waisen:** Aus `ps -A -o pid=,ppid=,etime=,command=` gelten Zeilen mit PPID 1, Kommando mit `vitest` (Hauptprozess oder Worker-Titel `node (vitest N)`), Alter ≥ 30 min und PID ≠ eigener als verwaist. Die Testsperre schreibt **nur einen Hinweis** auf stderr (vor Last- und Sperrprüfung, also auch bei Abbruch), beendet nichts und ändert keinen Exit-Code. `ps`-Fehler → kein Hinweis. Nicht auf CI und nicht in verschachtelten Läufen (bestehender Zweig). Schalter `TESTLOCK_PS_FIXTURE` (Pfad zu einer ps-Ausgabe) nur für Tests (R378).

**Interfaces:**

- Produces: `ORPHAN_MIN_S = 1800`, `parseEtime(text: string): number`, `findOrphans(ps: string, selfPid: number, minAgeS?: number): Orphan[]`, `orphanNotice(list: Orphan[]): string`, `interface Orphan { pid: number; ageS: number; command: string }`; `parseSaveVersion(source: string): number | null`, `saveVersionLabel(file?: URL): string`.

## Schritt 1 · Tests zuerst (rot)

`tests/tools/testlock.test.ts` ergänzen (Import wie `zeitreserve.test.ts` ohne Endung; `setup()`/`run()` existieren):

```ts
import { findOrphans, orphanNotice, parseEtime } from '../../tools/testlock/orphans';

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
```

`tests/tools/renderqa.test.ts` ergänzen (Ladeweise der `.mjs` wie dort mit `load`):

```ts
import saveSource from '../../src/sim/save.ts?raw';
import { SAVE_VERSION } from '../../src/sim/save';

const sv = await load('saveVersion.mjs');
describe('R419 Smoke-Etikett Save-Version', () => {
  it('liest SAVE_VERSION aus der Quelle', () => {
    expect(sv.parseSaveVersion(saveSource)).toBe(SAVE_VERSION);
  });
  it('Etikett nennt die aktuelle Version', () => {
    expect(sv.saveVersionLabel()).toBe(`Save v${SAVE_VERSION}`);
  });
  it('ohne Treffer: null bzw. v?', () => {
    expect(sv.parseSaveVersion('const x = 1;')).toBeNull();
    expect(sv.saveVersionLabel(new URL('file:///gibt/es/nicht.ts'))).toBe('Save v?');
  });
});
```

Lauf: `npx vitest run tests/tools/testlock.test.ts tests/tools/renderqa.test.ts; echo EXIT=$?` → rot (Modul fehlt). Rote Ausgabe in den Bericht (R395). Akzeptiert `tsc` den `?raw`-Import nicht, stattdessen `readFileSync` in `tests/tools/node-shim.d.ts` deklarieren und die Datei lesen.

## Schritt 2 · `tools/testlock/orphans.ts`

```ts
// tools/testlock/orphans.ts — verwaiste Vitest-Prozesse erkennen (TOOL-STUDIO-HYGIENE, R420); reine Logik.
export const ORPHAN_MIN_S = 30 * 60;

export interface Orphan {
  pid: number;
  ageS: number;
  command: string;
}

/** ps-Feld etime `[[d-]hh:]mm:ss` in Sekunden; unlesbar: NaN. */
export function parseEtime(text: string): number {
  const m = /^(?:(\d+)-)?(?:(\d+):)?(\d+):(\d+)$/.exec(text.trim());
  if (!m) return NaN;
  const [, d = '0', h = '0', min = '0', s = '0'] = m;
  return Number(d) * 86400 + Number(h) * 3600 + Number(min) * 60 + Number(s);
}

/** Zeilen aus `ps -A -o pid=,ppid=,etime=,command=`: PPID 1, vitest, Alter >= minAgeS. */
export function findOrphans(ps: string, selfPid: number, minAgeS = ORPHAN_MIN_S): Orphan[] {
  const out: Orphan[] = [];
  for (const line of ps.split('\n')) {
    const m = /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/.exec(line);
    if (!m) continue;
    const [, pid = '', ppid = '', etime = '', command = ''] = m;
    const ageS = parseEtime(etime);
    if (Number(ppid) !== 1 || Number(pid) === selfPid || !/vitest/.test(command)) continue;
    if (!(ageS >= minAgeS)) continue;
    out.push({ pid: Number(pid), ageS, command: command.trim() });
  }
  return out;
}

export function orphanNotice(list: Orphan[]): string {
  if (list.length === 0) return '';
  const items = list
    .map((o) => `PID ${o.pid} (${Math.floor(o.ageS / 60)} min): ${o.command.slice(0, 80)}`)
    .join('; ');
  return (
    `testlock: HINWEIS, ${list.length} verwaiste Vitest-Prozesse (PPID 1, älter als ` +
    `${ORPHAN_MIN_S / 60} min), nicht beendet: ${items}. Beenden nur per PID: kill <pid> (R263).`
  );
}
```

## Schritt 3 · Einbau in `tools/testlock/testlock.ts`

Import `readFileSync` ist schon da; ergänze `import { findOrphans, orphanNotice } from './orphans.ts';` und die Funktion:

```ts
function reportOrphans(): void {
  try {
    const ps =
      env.TESTLOCK_PS_FIXTURE !== undefined // nur für Tests (R378)
        ? readFileSync(env.TESTLOCK_PS_FIXTURE, 'utf8')
        : execFileSync('ps', ['-A', '-o', 'pid=,ppid=,etime=,command='], {
            encoding: 'utf8',
            maxBuffer: 8 * 1024 * 1024,
          });
    const note = orphanNotice(findOrphans(ps, process.pid));
    if (note) console.error(note);
  } catch {
    /* ps fehlt oder scheitert: kein Hinweis */
  }
}
```

Aufruf als erste Zeile im `else`-Zweig (vor `const load = …`). Kopfkommentar um eine Zeile zum Hinweis und zum Testschalter ergänzen.

## Schritt 4 · Smoke-Etikett

`tools/render-qa/saveVersion.mjs`:

```js
// tools/render-qa/saveVersion.mjs — Save-Version aus src/sim/save.ts für das Smoke-Etikett (R419).
import { readFileSync } from 'node:fs';

export function parseSaveVersion(source) {
  const m = /export const SAVE_VERSION\s*=\s*(\d+)\s*;/.exec(source);
  return m ? Number(m[1]) : null;
}

export function saveVersionLabel(file = new URL('../../src/sim/save.ts', import.meta.url)) {
  let version = null;
  try {
    version = parseSaveVersion(readFileSync(file, 'utf8'));
  } catch {
    /* Datei fehlt: Etikett ohne Nummer */
  }
  return `Save v${version ?? '?'}`;
}
```

`tools/render-qa/smoke.mjs`: `import { saveVersionLabel } from './saveVersion.mjs';` zu den Importen; Zeile 466 wird ``await step('e', `Speichern und Laden (${saveVersionLabel()})`, async (rec) => {``. `grep -n "v9" tools/render-qa/smoke.mjs` danach leer.

## Schritt 5 · Grün, Echtlauf, Prüfungen, Commits

```bash
npx vitest run tests/tools/testlock.test.ts tests/tools/renderqa.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
make zeittests; echo EXIT=$?
make conflicts; echo EXIT=$?
make check; echo EXIT=$?
```

**Echtlauf** (R375): `node tools/testlock/testlock.ts node -e 0; echo EXIT=$?` mit echtem `ps` (Exit 0, Hinweis nur bei echten Waisen; stderr in den Bericht) und `node -e "import('./tools/render-qa/saveVersion.mjs').then(m => console.log(m.saveVersionLabel()))"` → `Save v10`. Keinen Prozess beenden.

```bash
git add tools/testlock/orphans.ts tools/testlock/testlock.ts tests/tools/testlock.test.ts
git commit -m "feat: Testsperre meldet verwaiste Vitest-Prozesse (TOOL-STUDIO-HYGIENE)"
git add tools/render-qa/saveVersion.mjs tools/render-qa/smoke.mjs tests/tools/renderqa.test.ts
git commit -m "fix: Smoke-Etikett liest die Save-Version aus der Quelle (R419)"
```

DoD: AK-TB07, AK-TB15 belegt; Rot-Beleg je neuem Testfall; schnelle Make-Prüfungen Exit 0 (R398, R410).
