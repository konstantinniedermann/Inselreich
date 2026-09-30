// tests/sim/node-shim.d.ts — minimale Typen für node:fs in Tests (Vitest läuft in Node; ADR-001: keine @types/node)
declare module 'node:fs' {
  export function writeFileSync(path: string, data: string): void;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
}
