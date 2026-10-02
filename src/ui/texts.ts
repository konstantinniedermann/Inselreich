import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS } from '../sim/defs/goods';
import { SERVICE_BUILDING } from '../sim/population';
import type { Diagnosis } from '../sim/queries';
import type { Building, Cost, GoodId } from '../sim/types';

/** Text zu einer Diagnose (dieselbe Quelle wie das Kartensymbol). */
export function diagnosisText(d: Diagnosis): string {
  switch (d.kind) {
    case 'supply':
      return 'nicht versorgt';
    case 'good':
      return `${GOODS[d.good].name} fehlt`;
    case 'service':
      return `${BUILDING_DEFS[SERVICE_BUILDING[d.service]].name} fehlt`;
  }
}

/** Erzeugungszeile des Panels; während des Brandausfalls steht dort, dass nichts erzeugt wird. */
export function producesText(def: { produces?: GoodId; cycle?: number }, burning: boolean): string {
  const name = def.produces ? GOODS[def.produces].name : '';
  return burning
    ? `Erzeugt ${name} nicht — Betrieb brennt`
    : `Erzeugt ${name} alle ${def.cycle} Ticks`;
}

/** Text für ein brennendes Gebäude (Betrieb oder Dienst): Restdauer bis `outageUntil`. */
export function burningText(b: Building, tick: number): string {
  const left = Math.max(0, (b.outageUntil ?? tick) - tick);
  return `Brennt — wieder in Betrieb in ${left} Ticks`;
}

export function stateInfo(b: Building, tick: number): { text: string; ok: boolean } {
  const def = BUILDING_DEFS[b.defId];
  if (b.outageUntil !== undefined) return { text: burningText(b, tick), ok: false };
  // Anbindung zuerst: `state` wird erst im nächsten Tick nachgeführt (z. B. bei Pause)
  if (!b.connected) return { text: 'Nicht an Kontor angebunden', ok: false };
  if (!def.produces) return { text: 'Angebunden', ok: true };
  switch (b.state) {
    case 'ok':
    case 'notConnected': // wieder angebunden, `state` folgt erst im nächsten Tick
      return { text: 'In Betrieb', ok: true };
    case 'waitingInput':
      return {
        text: `Wartet auf ${def.consumes ? GOODS[def.consumes].name : 'Rohstoff'}`,
        ok: false,
      };
    case 'storageFull':
      return { text: 'Lager voll', ok: false };
    case 'burning':
      return { text: burningText(b, tick), ok: false };
  }
}

export const stateText = (b: Building, tick: number): string => stateInfo(b, tick).text;

/** Rückerstattungstext: tatsächlicher Betrag, je Gut mit Verfall-Hinweis (nur wenn etwas verfällt). */
export function refundText(nominal: Cost, effective: Cost): string {
  const parts = [`${effective.money} Geld`];
  for (const g of ['wood', 'tools', 'stone'] as const) {
    if (!nominal[g]) continue;
    const lost = nominal[g] - effective[g];
    const base = `${effective[g]} ${GOODS[g].name}`;
    parts.push(lost > 0 ? `${base} (${lost} verfallen – Lager voll)` : base);
  }
  return parts.join(' · ');
}
