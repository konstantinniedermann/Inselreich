// tests/render/fixtures/node-shim.d.ts — Typen für den Kontaktbogen-Erzeuger (Vitest läuft in Node; ADR-001: keine @types/node).
// Ergänzt die Überladung von `writeFileSync` aus tests/sim/node-shim.d.ts um Binärdaten.
declare module 'node:fs' {
  export function writeFileSync(path: string, data: Uint8Array): void;
}
declare module 'node:zlib' {
  export function deflateSync(data: Uint8Array): Uint8Array;
  export function crc32(data: Uint8Array): number;
}
