// tests/tools/node-shim.d.ts — minimale Typen für node:child_process in tests/tools/renderqa.test.ts (ADR-001: keine @types/node)
declare module 'node:child_process' {
  export function spawnSync(
    command: string,
    args: string[],
    options?: { env?: Record<string, string | undefined>; encoding?: 'utf8' },
  ): { status: number | null; stdout: string; stderr: string };
}
