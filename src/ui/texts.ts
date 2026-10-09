import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS } from '../sim/defs/goods';
import { SERVICE_BUILDING } from '../sim/population';
import { refundCost } from '../sim/economy';
import { effectiveRefund, type Diagnosis } from '../sim/queries';
import type { Building, Cost, GoodId, World } from '../sim/types';
import { paidCost } from '../sim/upgrade';
import { formatGameTime } from './time';

/** Text zu einer Diagnose (dieselbe Quelle wie das Kartensymbol). */
export function diagnosisText(d: Diagnosis): string {
  switch (d.kind) {
    case 'supply':
      return 'ausserhalb der Versorgung';
    case 'good':
      return `${GOODS[d.good].name} fehlt`;
    case 'service':
      return `${BUILDING_DEFS[SERVICE_BUILDING[d.service]].name} fehlt`;
  }
}

/** Erzeugungszeile des Panels; während des Brandausfalls steht dort, dass nichts erzeugt wird. */
export function producesText(
  def: { produces?: GoodId; cycle?: number },
  burning: boolean,
  cycle: number = def.cycle ?? 0,
): string {
  const name = def.produces ? GOODS[def.produces].name : '';
  return burning
    ? `Erzeugt ${name} nicht — Betrieb brennt`
    : `Erzeugt ${name} alle ${formatGameTime(cycle)}`;
}

/** Text für ein brennendes Gebäude (Betrieb oder Dienst): Restdauer bis `outageUntil`. */
export function burningText(b: Building, tick: number): string {
  const left = Math.max(0, (b.outageUntil ?? tick) - tick);
  return `Brennt — wieder in Betrieb in ${formatGameTime(left)}`;
}

/** Güternamen mit „und“ verbunden: „Holz“, „Stein und Holz“ (Reihenfolge wie übergeben). */
export function goodList(goods: readonly GoodId[]): string {
  const names = goods.map((g) => GOODS[g].name);
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} und ${names.at(-1)}`;
}

/**
 * Zustandstext des Info-Panels. `missing` = fehlende Inputs (`missingInputs`); leer oder fehlend → alle Inputs
 * aus `consumes` (M8 14.4, Input seit dem letzten Schritt eingetroffen).
 */
export function stateInfo(
  b: Building,
  tick: number,
  missing?: readonly GoodId[],
): { text: string; ok: boolean } {
  const def = BUILDING_DEFS[b.defId];
  if (b.outageUntil !== undefined) return { text: burningText(b, tick), ok: false };
  // Anbindung zuerst: `state` wird erst im nächsten Tick nachgeführt (z. B. bei Pause)
  if (!b.connected) return { text: 'Nicht an Kontor angebunden', ok: false };
  if (!def.produces) return { text: 'Angebunden', ok: true };
  switch (b.state) {
    case 'ok':
    case 'notConnected': // wieder angebunden, `state` folgt erst im nächsten Tick
      return { text: 'In Betrieb', ok: true };
    case 'waitingInput': {
      const goods = missing && missing.length > 0 ? missing : (def.consumes ?? []);
      return { text: `Wartet auf ${goods.length > 0 ? goodList(goods) : 'Rohstoff'}`, ok: false };
    }
    case 'storageFull':
      return { text: 'Lager voll', ok: false };
    case 'burning':
      return { text: burningText(b, tick), ok: false };
    case 'noForest':
      return { text: 'Kein freier Wald in der Nähe', ok: false };
    case 'noService':
      return {
        text: `Braucht eine ${BUILDING_DEFS[SERVICE_BUILDING[def.requiresService!]].name} in Reichweite`,
        ok: false,
      };
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

/** Abriss-Meldung: Name und Rückerstattung auf Basis der tatsächlich bezahlten Kosten (Bau plus Stufen). */
export function demolishText(world: World, b: Building): string {
  const paid = paidCost(b);
  return `${BUILDING_DEFS[b.defId].name} abgerissen · zurück ${refundText(refundCost(paid), effectiveRefund(world, paid))}`;
}

/**
 * Defizit-Zeile des Haus-Panels (Spec 7): Gut, Lagerbestand und Netto je Bilanzabschnitt (< 0).
 * Restvorrat in Spielminuten: 6 Abschnitte je Minute.
 */
export function deficitText(good: GoodId, stock: number, net: number): string {
  const head = `${GOODS[good].name}-Bilanz negativ — Aufstieg verzögert; `;
  if (stock <= 0) return `${head}Vorrat leer`;
  const x = Math.floor(stock / -net / 6);
  if (x >= 60) return `${head}Vorrat reicht noch über 60 Minuten`;
  if (x === 0) return `${head}Vorrat reicht noch weniger als 1 Minute`;
  return `${head}Vorrat reicht noch ${x === 1 ? '1 Minute' : `${x} Minuten`}`;
}
