// tools/render-qa/saveVersion.mjs — Save-Version aus src/sim/save.ts für das Smoke-Etikett (R419).
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

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
