// tests/tools/node-shim.d.ts — minimale Typen für node:child_process, fs, os, path in tests/tools (ADR-001: keine @types/node)
declare module 'node:child_process' {
  export function spawnSync(
    command: string,
    args: string[],
    options?: { cwd?: string; env?: Record<string, string | undefined>; encoding?: 'utf8' },
  ): { status: number | null; stdout: string; stderr: string };
  export function spawn(
    command: string,
    args: string[],
    options?: { env?: Record<string, string | undefined> },
  ): {
    stdout: { on(ev: 'data', cb: (d: { toString(): string }) => void): void };
    on(ev: 'error', cb: (e: Error) => void): void;
    on(ev: 'close', cb: () => void): void;
  };
}

declare module 'node:fs' {
  export function mkdtempSync(prefix: string): string;
  export function writeFileSync(path: string, data: string): void;
  export function existsSync(path: string): boolean;
}
declare module 'node:os' {
  export function tmpdir(): string;
}
declare module 'node:path' {
  export function join(...parts: string[]): string;
}
