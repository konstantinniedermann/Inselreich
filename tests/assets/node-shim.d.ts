// tests/assets/node-shim.d.ts — minimale Typen für node:fs, node:crypto und process in den Asset-Tests
// (Vitest läuft in Node; ADR-001: keine @types/node)
declare module 'node:fs' {
  export function readdirSync(path: string): string[];
  export function statSync(path: string): { size: number; isDirectory(): boolean };
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string): Uint8Array;
  export function readFileSync(path: string, encoding: 'utf8'): string;
}
declare module 'node:crypto' {
  export function createHash(algorithm: 'sha256'): {
    update(data: Uint8Array): { digest(encoding: 'hex'): string };
  };
}
declare const process: { cwd(): string };
