/* global process, console, URL */
// aagate.mjs — A/A-Gate der Messgüte (TOOL-MESSFENSTER, P-7): wertet die A/A-Kontrolle eines Messblocks aus.
// Eingabe: Ausgabe von hitch.mjs (Zeilen mit JSON { baseMedian, res[] }) und/oder perf.mjs (JSON-Zeile mit deltaPct/deltaMs).
// Grenzen: tools/render-qa/aa-grenzen.json. Auf der Grenze gilt gültig. Exit 0 gültig, 1 ungültig.
import { readFileSync } from 'node:fs';

export const GUELTIG = 'gueltig';
export const UNGUELTIG = 'ungueltig (A/A ausserhalb)';

export function ladeGrenzen(pfad = new URL('./aa-grenzen.json', import.meta.url)) {
  return JSON.parse(readFileSync(pfad, 'utf8'));
}

/** JSON-Objekte aus allen Zeilen, die ab der ersten '{' parsbar sind (Kopf- und Textzeilen entfallen). */
function jsonZeilen(text) {
  const out = [];
  for (const zeile of String(text).split('\n')) {
    const i = zeile.indexOf('{');
    if (i < 0) continue;
    try {
      out.push({ zeile, obj: JSON.parse(zeile.slice(i)) });
    } catch {
      /* keine Messzeile */
    }
  }
  return out;
}

/** hitch-Ausgabe -> Fenster [{ seed, seite, baseMedian, over25, max }]. */
export function parseHitch(text) {
  const fenster = [];
  for (const { zeile, obj } of jsonZeilen(text)) {
    if (!Array.isArray(obj.res)) continue;
    const seed = Number(/seed=(\d+)/.exec(zeile)?.[1]);
    const seite = zeile.split(' ')[0];
    for (const r of obj.res) {
      fenster.push({ seed, seite, baseMedian: obj.baseMedian, over25: r.over25, max: r.max });
    }
  }
  return fenster;
}

/** perf-JSON-Zeilen -> Paare [{ profil, deltaMs, deltaPct }]. */
export function parsePerf(text) {
  return jsonZeilen(text)
    .filter(({ obj }) => typeof obj.deltaMs === 'number' && typeof obj.deltaPct === 'number')
    .map(({ obj }) => ({
      profil: `${obj.view} seed=${obj.seed} ${obj.focus ?? '-'}`,
      deltaMs: obj.deltaMs,
      deltaPct: obj.deltaPct,
    }));
}

export function bewerteHitch(fenster, grenzen) {
  const g = grenzen.hitch;
  const gruende = [];
  const summe = fenster.reduce((s, f) => s + f.over25, 0);
  if (summe > g.summeOver25Max) {
    gruende.push(`Hitch: Summe over25 = ${summe} (Grenze ${g.summeOver25Max})`);
  }
  const hoechst = fenster.reduce((m, f) => Math.max(m, f.max), 0);
  if (hoechst > g.fensterMaxMs) {
    gruende.push(`Hitch: Fenster mit max ${hoechst} ms (Grenze ${g.fensterMaxMs} ms)`);
  }
  return { ok: gruende.length === 0, gruende };
}

export function bewerteRender(paare, grenzen) {
  const g = grenzen.render;
  const gruende = [];
  for (const p of paare) {
    const imMs = Math.abs(p.deltaMs) <= g.deltaMsMax;
    const imPct = Math.abs(p.deltaPct) <= g.deltaPctMax;
    if (!imMs && !imPct) {
      gruende.push(
        `Render ${p.profil}: Δ ${p.deltaMs} ms / ${p.deltaPct} % (Grenze ${g.deltaMsMax} ms oder ${g.deltaPctMax} %)`,
      );
    }
  }
  return { ok: gruende.length === 0, gruende };
}

/** Gesamturteil; ohne jede Messzeile ist nichts belegt und der Block ungültig. */
export function urteil({ hitch = [], render = [] }, grenzen) {
  if (hitch.length === 0 && render.length === 0) {
    return { urteil: UNGUELTIG, gruende: ['Keine A/A-Daten gefunden (weder Hitch noch Render).'] };
  }
  const gruende = [
    ...(hitch.length ? bewerteHitch(hitch, grenzen).gruende : []),
    ...bewerteRender(render, grenzen).gruende,
  ];
  return { urteil: gruende.length ? UNGUELTIG : GUELTIG, gruende };
}

function main(argv) {
  if (argv.includes('--help')) {
    console.log(
      'aagate.mjs — A/A-Gate. Aufruf: node tools/render-qa/aagate.mjs [datei ...] (ohne Datei: stdin).\nExit 0 = gueltig, 1 = ungueltig (A/A ausserhalb).',
    );
    return 0;
  }
  const dateien = argv.filter((a) => !a.startsWith('--'));
  const text = (
    dateien.length ? dateien.map((f) => readFileSync(f, 'utf8')) : [readFileSync(0, 'utf8')]
  ).join('\n');
  const grenzen = ladeGrenzen();
  const r = urteil({ hitch: parseHitch(text), render: parsePerf(text) }, grenzen);
  console.log(`Messgüte (A/A): ${r.urteil}${grenzen.vorlaeufig ? ' [Grenzen vorläufig]' : ''}`);
  for (const g of r.gruende) console.log(`  - ${g}`);
  return r.urteil === GUELTIG ? 0 : 1;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exit(main(process.argv.slice(2)));
}
