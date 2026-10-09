// tools/conflicts/check.ts — CLI: node tools/conflicts/check.ts  (TOOL-GATES-2, R392 V8)
// Bricht mit Exit 1 ab, wenn eine versionierte Datei einen Git-Konfliktmarker enthält.
// Läuft im aktuellen Verzeichnis (Git-Repo); ungetrackte Dateien werden nicht geprüft.
import { spawnSync } from 'node:child_process';

// Nur Start- und Endmarker (R392 V8): ein einzelnes ======= träfe Markdown-Trenner (Fehlalarm). Eingerückte Zeilen zählen nicht.
const PATTERN = '^(<<<<<<< |>>>>>>> )';

const r = spawnSync('git', ['grep', '-nIE', PATTERN], { encoding: 'utf8' });
if (r.status === 1) {
  console.log('conflicts: keine Konfliktmarker in versionierten Dateien.');
  process.exit(0);
}
if (r.status !== 0) {
  console.error(`conflicts: git grep fehlgeschlagen (Exit ${r.status}): ${r.stderr.trim()}`);
  process.exit(2);
}
console.error(
  `conflicts: Git-Konfliktmarker in versionierten Dateien (Merge unvollständig aufgelöst?):\n${r.stdout.trim()}\n` +
    'Konflikt auflösen und Marker entfernen, dann make check erneut starten.',
);
process.exit(1);
