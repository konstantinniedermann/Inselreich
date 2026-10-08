/* global process, console */
// lastgate.mjs — Lastabbruch für Perf- und Ruckel-Messungen (R329, R330): Ist der 1-min-Load über der Schwelle,
// brechen die Messskripte sofort ab (Exit 1, deutsche Meldung). Es wird nicht gewartet und nicht geschlafen.
//
// Aufruf (CLI):  node tools/render-qa/lastgate.mjs [--help]      Exit 0 = frei, Exit 1 = Abbruch
// Aus Skripten:  import { gateOrExit } from './lastgate.mjs'; gateOrExit();
// Test/Probe:    Umgebungsvariable LASTGATE_FAKE_LOAD=9 ersetzt den gelesenen Load (nur für Test und Probe).
import { loadavg } from 'node:os';
import { pathToFileURL } from 'node:url';

// Schwelle für den 1-min-Load (R329): darüber gilt eine Messung nicht; eine Quelle mit tools/zeitreserve.
import { LOAD_MAX } from '../zeitreserve/rule.ts';
export { LOAD_MAX };

/** Reine Prüfung: `{ ok, message }`; Load genau auf der Schwelle ist noch ok. */
export function checkLoad(load, max = LOAD_MAX) {
  const l = Number(load);
  if (Number.isFinite(l) && l <= max) {
    return { ok: true, message: `Load ${l} (1 min) <= ${max}: Messfenster frei.` };
  }
  return {
    ok: false,
    message: `Abbruch: 1-min-Load ${load} liegt über der Schwelle ${max} (R329). Keine Messung bei belastetem Rechner; später erneut starten.`,
  };
}

/** Liest den 1-min-Load; `LASTGATE_FAKE_LOAD` (Test/Probe) hat Vorrang. */
export function currentLoad(env = process.env) {
  const fake = env.LASTGATE_FAKE_LOAD;
  if (fake !== undefined && fake !== '' && Number.isFinite(Number(fake))) return Number(fake);
  return loadavg()[0];
}

/** Prüft die aktuelle Last; bei Überschreitung Meldung auf stderr und Exit 1. Gibt sonst die Load-Zahl zurück. */
export function gateOrExit(max = LOAD_MAX) {
  const load = currentLoad();
  const r = checkLoad(load, max);
  if (!r.ok) {
    console.error(r.message);
    process.exit(1);
  }
  return load;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--help')) {
    console.log(
      `lastgate.mjs — Lastabbruch (R329): Exit 1, wenn der 1-min-Load über ${LOAD_MAX} liegt, sonst Exit 0.\n` +
        'Aufruf: node tools/render-qa/lastgate.mjs\n' +
        'Test/Probe: LASTGATE_FAKE_LOAD=9 node tools/render-qa/lastgate.mjs   (simulierte Last)',
    );
    process.exit(0);
  }
  const load = gateOrExit();
  console.log(checkLoad(load).message);
}
