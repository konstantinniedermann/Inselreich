// tests/render/node-shim.d.ts — minimale Typen für node:fs in Render-Tests (ADR-001: keine @types/node)
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function readdirSync(path: string): string[];
}
