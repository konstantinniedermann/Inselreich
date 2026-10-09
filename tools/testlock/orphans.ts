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
