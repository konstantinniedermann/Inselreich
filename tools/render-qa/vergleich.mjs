/* global process, console */
// vergleich.mjs — Vergleichsart in Dateiname und Kopf jeder Messausgabe (E-039, R315): `aa-<Name>-…` (gleicher Stand
// gegen sich) bzw. `ab-<A>-vs-<B>-…`, im Kopf Vergleichsart und BEIDE Commit-Hashes. Reine Funktionen, Hash-Ermittlung
// injizierbar (Tests).
//
// CLI (für Shell-Skripte):
//   node tools/render-qa/vergleich.mjs kopf <wurzelA> <wurzelB>            gibt die Kopfzeile aus
//   node tools/render-qa/vergleich.mjs name <wurzelA> <wurzelB> <rest>     gibt den Dateinamen aus
import { execFileSync } from 'node:child_process';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** 'aa' wenn beide Wurzeln dasselbe Verzeichnis sind, sonst 'ab'. */
export const comparisonKind = (rootA, rootB) => (resolve(rootA) === resolve(rootB) ? 'aa' : 'ab');

/** Kurzname eines Stands = Verzeichnisname der Wurzel. */
export const labelOf = (root) => basename(resolve(root));

/** `aa-<A>-<rest>` bzw. `ab-<A>-vs-<B>-<rest>`. */
export const outName = (kind, labelA, labelB, rest) =>
  kind === 'aa' ? `aa-${labelA}-${rest}` : `ab-${labelA}-vs-${labelB}-${rest}`;

/** Kopfzeile mit Vergleichsart und beiden Hashes. */
export function headerLine({ kind, labelA, labelB, hashA, hashB }) {
  const art = kind === 'aa' ? 'A/A (gleicher Stand gegen sich)' : 'A/B (zwei Stände)';
  return `Vergleich: ${art} | A=${labelA}@${hashA} | B=${labelB}@${hashB}`;
}

/** Kurzer Commit-Hash (HEAD) einer Wurzel; 'unbekannt', wenn git nichts liefert. */
export function gitHash(root) {
  try {
    return execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unbekannt';
  }
}

/** Beschreibt beide Stände; `hash` ist injizierbar (Standard: git). */
export function describeStands(rootA, rootB, hash = gitHash) {
  return {
    kind: comparisonKind(rootA, rootB),
    labelA: labelOf(rootA),
    labelB: labelOf(rootB),
    hashA: hash(rootA),
    hashB: hash(rootB),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, a, b, rest] = process.argv.slice(2);
  if (!['kopf', 'name'].includes(cmd) || !a || !b || (cmd === 'name' && !rest)) {
    console.error(
      'Aufruf: vergleich.mjs kopf <wurzelA> <wurzelB> | vergleich.mjs name <wurzelA> <wurzelB> <rest>',
    );
    process.exit(cmd === '--help' ? 0 : 2);
  }
  const d = describeStands(a, b);
  console.log(cmd === 'kopf' ? headerLine(d) : outName(d.kind, d.labelA, d.labelB, rest));
}
