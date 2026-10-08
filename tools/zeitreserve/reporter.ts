// tools/zeitreserve/reporter.ts — Vitest-Reporter: schreibt Laufzeit und Timeout je Test nach
// .studio/zeitreserve.json; ausgewertet von check.ts (`make zeitreserve`).
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadavg } from 'node:os';
import { relative } from 'node:path';
import type { Measurement, TestTiming } from './rule.ts';

export const REPORT_PATH = '.studio/zeitreserve.json';

interface ReportedTest {
  fullName: string;
  options: { timeout?: number };
  diagnostic(): { duration: number } | undefined;
  result(): { state: string };
}
interface ReportedModule {
  moduleId: string;
  children: { allTests(): Iterable<ReportedTest> };
}

function headCommit(): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unbekannt';
  }
}

export default class ZeitreserveReporter {
  private loadStart = loadavg()[0] ?? 0;

  onTestRunEnd(modules: readonly ReportedModule[]): void {
    const timings: TestTiming[] = [];
    for (const m of modules) {
      for (const t of m.children.allTests()) {
        const state = t.result().state;
        const duration = t.diagnostic()?.duration;
        if (state === 'skipped' || duration === undefined) continue;
        timings.push({
          file: relative(process.cwd(), m.moduleId),
          name: t.fullName,
          durationMs: Math.round(duration),
          timeoutMs: t.options.timeout ?? 5000,
        });
      }
    }
    mkdirSync('.studio', { recursive: true });
    const loadEnd = loadavg()[0] ?? 0;
    const report: Measurement = {
      commit: headCommit(),
      loadStart: this.loadStart,
      loadEnd,
      loadMax: Math.max(this.loadStart, loadEnd),
      timings,
    };
    writeFileSync(REPORT_PATH, JSON.stringify(report));
  }
}
