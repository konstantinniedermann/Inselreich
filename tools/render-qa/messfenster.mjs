/* global process, console */
// messfenster.mjs — Mess-Wächter (R264 V1): prüft vor einer Leistungsmessung, ob das Messfenster frei ist.
// Belegt heisst: Load-Average (1 min) über der Schwelle oder fremde vitest-/vite-/Headless-Chrome-Prozesse laufen.
// Eigener Prozess, seine Vorfahren (make/node/Shell) und seine Kinder zählen nicht. Nur Entwicklungswerkzeug (macOS).
//
// Aufruf:  node tools/render-qa/messfenster.mjs [--load 4] [--run -- <befehl ...>] [--selftest] [--help]
//   make messfenster ARGS="--run -- node tools/render-qa/perf.mjs --a . --b . --seed 3,14 ..."
// Ausgabe: Kontextzeile (Load, Schwelle), eine JSON-Zeile (Protokoll je Serie), genau eine Ergebniszeile
//   `Messfenster frei` (Exit 0) oder `belegt: <Gründe>` (Exit 1). `--run` startet den Befehl nur im Frei-Fall unter
//   `caffeinate -i` und reicht dessen Exit-Code durch. Es wird nie ein fremder Prozess beendet.
// Schwelle: `--load N` oder Umgebungsvariable MESSFENSTER_LOAD (Vorgabe 4).
import { spawn, spawnSync } from 'node:child_process';
import { loadavg } from 'node:os';
import { basename, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_LOAD = 4;
const RUNNERS = new Set([
  'node',
  'npx',
  'npm',
  'pnpm',
  'yarn',
  'bun',
  'bunx',
  'tsx',
  'caffeinate',
  'env',
]);

/** Zerlegt `ps -axo pid=,ppid=,etime=,command=` in Einträge; Zeilen ohne passendes Format entfallen. */
export function parseProcs(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const m = /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.*\S)\s*$/.exec(line);
    if (m) out.push({ pid: Number(m[1]), ppid: Number(m[2]), etime: m[3], command: m[4] });
  }
  return out;
}

/** Art eines Prozesses anhand der Kommando-Tokens: 'vitest' | 'vite' | 'chrome' | null (kein Substring-Matching). */
export function classify(command) {
  const tokens = command.split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  if (/^node \(vitest \d+\)/.test(command)) return 'vitest';
  if (tokens.includes('--headless') || tokens.some((t) => t.startsWith('--headless='))) {
    if (/chrom/i.test(command.split(' --')[0])) return 'chrome';
  }
  // Programm = erstes Token; bei Startern (node, npx, ...) zusätzlich die nächsten Nicht-Options-Tokens.
  let cands = [tokens[0]];
  if (RUNNERS.has(basename(tokens[0])))
    cands = cands.concat(
      tokens
        .slice(1)
        .filter((t) => !t.startsWith('-'))
        .slice(0, 3),
    );
  for (const t of cands) {
    const b = basename(t).replace(/\.(m?js|cjs|ts)$/, '');
    if (b === 'vitest' || t.includes('/vitest/')) return 'vitest';
    if (b === 'vite' || t.includes('/vite/bin/')) return 'vite';
  }
  return null;
}

/** Gehört `cwd` nicht zum Repo-Stamm `root` (anderer Worktree oder anderes Verzeichnis)? */
export function isForeign(cwd, root) {
  if (!cwd || !root) return false;
  return !(cwd === root || cwd.startsWith(root.endsWith(sep) ? root : root + sep));
}

/** PIDs, die nicht zählen: `self`, seine Vorfahren und seine Nachfahren (nicht die Nachfahren der Vorfahren). */
export function ownPids(procs, self) {
  const byPid = new Map(procs.map((p) => [p.pid, p]));
  const own = new Set([self]);
  for (let p = byPid.get(self); p && !own.has(p.ppid) && p.ppid > 1; p = byPid.get(p.ppid))
    own.add(p.ppid);
  const down = new Set([self]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of procs)
      if (!down.has(p.pid) && down.has(p.ppid)) {
        down.add(p.pid);
        own.add(p.pid);
        grew = true;
      }
  }
  return own;
}

/** Fremde Treffer: [{ pid, kind, etime, command }]. */
export function findForeign(procs, self) {
  const own = ownPids(procs, self);
  return procs
    .filter((p) => !own.has(p.pid))
    .map((p) => ({ ...p, kind: classify(p.command) }))
    .filter((p) => p.kind);
}

function cwds(pids) {
  if (!pids.length) return new Map();
  const r = spawnSync('lsof', ['-a', '-d', 'cwd', '-Fpn', '-p', pids.join(',')], {
    encoding: 'utf8',
  });
  const map = new Map();
  let pid = null;
  for (const line of (r.stdout ?? '').split('\n')) {
    if (line.startsWith('p')) pid = Number(line.slice(1));
    else if (line.startsWith('n') && pid !== null) map.set(pid, line.slice(1));
  }
  return map;
}

const short = (c) => (c.length > 90 ? `${c.slice(0, 87)}...` : c);

function selftest() {
  const cases = [
    ['node /r/node_modules/.bin/vite --port 5199 --strictPort', 'vite'],
    ['node /r/node_modules/vite/bin/vite.js --host', 'vite'],
    ['npm exec vite', 'vite'],
    ['npx vitest --watch=true', 'vitest'],
    ['node /r/node_modules/vitest/vitest.mjs run', 'vitest'],
    ['node (vitest 1)', 'vitest'],
    ['/r/node_modules/.bin/vitest', 'vitest'],
    [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless=new --remote-debugging-port=9270 about:blank',
      'chrome',
    ],
    [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=9222',
      null,
    ],
    ['node tools/render-qa/messfenster.mjs --run -- node x.mjs', null],
    ['make messfenster ARGS=--load 4', null],
    ['grep -E vitest|vite src', null],
    ['tail -f vite.log', null],
    ['/bin/zsh -c vite', null],
    ['node tools/render-qa/perf.mjs --a . --b . --seed 3,14', null],
  ];
  let bad = 0;
  for (const [cmd, want] of cases) {
    const got = classify(cmd);
    if (got !== want) {
      bad++;
      console.error(`FALSCH: ${short(cmd)} -> ${got}, erwartet ${want}`);
    }
  }
  const procs = parseProcs(
    '  100     1 01:00 /sbin/launchd\n  200   100 00:10 make messfenster\n  201   200 00:10 node messfenster.mjs\n  300     1 05:00 npx vitest --watch=true\n  301   300 05:00 node /r/node_modules/.bin/vitest --watch=true\n  202   201 00:01 caffeinate -i npx vitest run\n',
  );
  const f = findForeign(procs, 201).map((p) => p.pid);
  if (procs.length !== 6 || f.join() !== '300,301') {
    bad++;
    console.error(`FALSCH: findForeign -> ${f.join()} (erwartet 300,301), ${procs.length} Zeilen`);
  }
  // Geschwister: claude -> zsh -> make -> messfenster, daneben claude -> zsh -> vitest (gleiches Elternteil).
  const sib = parseProcs(
    '  10     1 09:00 claude\n  11    10 09:00 -zsh\n  12    11 00:10 make messfenster\n  13    12 00:10 node messfenster.mjs\n  14    11 05:00 node /r/node_modules/.bin/vitest --watch=true\n  15    10 05:00 -zsh\n  16    15 05:00 npx vite --port 5173\n',
  );
  const fs = findForeign(sib, 13).map((p) => p.pid);
  if (fs.join() !== '14,16') {
    bad++;
    console.error(`FALSCH: Geschwister -> ${fs.join()} (erwartet 14,16)`);
  }
  if (isForeign('/a/b/c', '/a/b') || !isForeign('/a/bc', '/a/b') || !isForeign('/x', '/a/b')) {
    bad++;
    console.error('FALSCH: isForeign');
  }
  console.log(bad ? `selftest: ${bad} Fehler` : `selftest: ok (${cases.length + 3} Prüfungen)`);
  return bad ? 1 : 0;
}

function main(argv) {
  let threshold = Number(process.env.MESSFENSTER_LOAD ?? DEFAULT_LOAD);
  let run = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--selftest') return selftest();
    if (a === '--help') {
      console.log(
        'Aufruf: messfenster.mjs [--load N] [--run -- <befehl ...>] [--selftest]\n' +
          'Prüft Last und fremde vitest/vite/Headless-Chrome-Prozesse; mit --run startet der Befehl unter caffeinate -i.',
      );
      return 0;
    } else if (a === '--load') threshold = Number(argv[++i]);
    else if (a === '--run') {
      if (argv[i + 1] !== '--' || argv.length <= i + 2) {
        console.error('--run braucht: --run -- <befehl ...>');
        return 2;
      }
      run = argv.slice(i + 2);
      break;
    } else {
      console.error(`Unbekannte Option: ${a}`);
      return 2;
    }
  }
  if (!(threshold > 0)) {
    console.error('Ungültige Schwelle (--load N / MESSFENSTER_LOAD).');
    return 2;
  }

  const load = loadavg()[0];
  const ps = spawnSync('ps', ['-axo', 'pid=,ppid=,etime=,command='], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const foreign = findForeign(parseProcs(ps.stdout ?? ''), process.pid);
  const dirs = cwds(foreign.map((p) => p.pid));
  const root = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  }).stdout.trim();
  const list = foreign.map((p) => ({
    pid: p.pid,
    kind: p.kind,
    etime: p.etime,
    cwd: dirs.get(p.pid) ?? null,
    anderer_worktree: isForeign(dirs.get(p.pid), root),
    command: short(p.command),
  }));
  const reasons = [];
  if (load > threshold) reasons.push(`Load ${load.toFixed(2)} > ${threshold}`);
  for (const p of list.slice(0, 3))
    reasons.push(
      `${p.kind} PID ${p.pid} (${p.etime}) "${p.command}" cwd ${p.cwd ?? '?'}${p.anderer_worktree ? ' [anderer Worktree]' : ''}`,
    );

  if (list.length > 3) reasons.push(`und ${list.length - 3} weitere Prozesse (siehe JSON-Zeile)`);

  console.log(`Last (1 min): ${load.toFixed(2)}, Schwelle: ${threshold}`);
  console.log(
    JSON.stringify({
      zeit: new Date().toISOString(),
      load: +load.toFixed(2),
      schwelle: threshold,
      frei: reasons.length === 0,
      prozesse: list,
    }),
  );
  if (reasons.length) {
    console.log(`belegt: ${reasons.join(' | ')}`);
    return 1;
  }
  console.log('Messfenster frei');
  if (!run) {
    console.log(
      'Serie starten mit: caffeinate -i node tools/render-qa/perf.mjs ... (oder make messfenster ARGS="--run -- node tools/render-qa/perf.mjs ...")',
    );
    return 0;
  }
  const child = spawn('caffeinate', ['-i', ...run], { stdio: 'inherit' });
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => child.kill(sig));
  child.on('error', (e) => {
    console.error(`Start fehlgeschlagen: ${e.message}`);
    process.exit(1);
  });
  child.on('exit', (code, sig) =>
    process.exit(code ?? (sig === 'SIGINT' ? 130 : sig === 'SIGTERM' ? 143 : 1)),
  );
  return null; // Exit-Code kommt vom Kind
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const code = main(process.argv.slice(2));
  if (code !== null) process.exit(code);
}
