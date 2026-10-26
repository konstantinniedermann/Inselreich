// petition.ts — DOM-freie Karte der Bittschrift (I-210, Spec §5.1). Liest nur `petitionPreview`; keine Regel.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, STORAGE_CAP } from '../sim/defs/goods';
import { TICK_MS } from '../sim/defs/timing';
import { TAX_LEVELS, TIERS } from '../sim/defs/tiers';
import {
  FRUGAL_PCT,
  FRUGAL_TICKS,
  PETITIONS,
  PETITION_ANSWER,
  type PetitionDef,
} from '../sim/defs/petitions';
import { petitionPreview, type PetitionPreview, type PetitionReserveLine } from '../sim/petitions';
import type { GoodId, Tier, World } from '../sim/types';
import { GOODS_BALANCE_TICKS, formatClock } from './time';

export interface PetitionCardModel {
  title: string;
  text: string;
  deadline: string;
  yes: { cost: string; blocked: string | null; reward: string; lines: string[] };
  no: { effect: string; nearFull: string | null; why: string; tail: 'Keine weitere Folge' };
}

/** Zahl mit Komma, höchstens eine Nachkommastelle («1,6», «0»). */
function num(n: number): string {
  const r = Math.round(n * 10) / 10;
  return String(Object.is(r, -0) ? 0 : r).replace('.', ',');
}

function signed(n: number): string {
  const r = Math.round(n * 10) / 10;
  if (r === 0) return '±0';
  return r > 0 ? `+${num(r)}` : `−${num(-r)}`;
}

function minutes(ticks: number): string {
  return `${num((ticks * TICK_MS) / 60000)} min`;
}

const name = (g: GoodId): string => GOODS[g].name;

function costText(cost: PetitionPreview['cost']): string {
  const parts = (Object.entries(cost) as [GoodId, number][]).map(([g, n]) => `−${n} ${name(g)}`);
  return parts.length === 0 ? 'jetzt nichts' : `jetzt ${parts.join(', ')}`;
}

function tiersText(tiers: readonly Tier[]): string {
  if (tiers.length === 1) return `nur Stufe ${tiers[0]}`;
  const all = Object.keys(TIERS).map(Number);
  const min = Math.min(...tiers);
  if (tiers.length >= all.length) return 'alle Häuser';
  return `Häuser ab Stufe ${min}`;
}

function plural(n: string): string {
  return n.endsWith('ei') ? `${n}en` : `${n}n`;
}

function rewardText(def: PetitionDef, pv: PetitionPreview): string {
  const r = def.reward;
  const when = `in ${minutes(pv.delay)}`;
  const span = `${when} für ${minutes(pv.duration)}`;
  switch (r.kind) {
    case 'overcrowd':
      return `${span}: bis +${pv.extraPlaces} Einwohner (${tiersText(r.tiers)})`;
    case 'cycle': {
      const b = plural(BUILDING_DEFS[r.building].name);
      return `${span}: Zyklus ${r.pct} % für alle ${b}${r.homeOnly ? ' der Heimatinsel' : ''}`;
    }
    case 'storage':
      return `${span}: Lager ${STORAGE_CAP + r.plus} für ${r.goods.map(name).join(', ')}`;
    case 'upgradeWait':
      return `${span}: Aufstiegsuhr ${TAX_LEVELS.low.upgradeWait} T im Kapellenkreis (wie Aufstiegsfest)`;
    case 'feastVoucher':
      return `${when}, höchstens ${minutes(def.duration)}: nächstes Fest an der Kapelle ohne Rum und ohne Abklingzeit`;
  }
}

function reserveLine(l: PetitionReserveLine): string {
  const base = `${name(l.good)} · Lager ${Math.floor(l.stock)} · heute netto ${signed(l.net)} je ${GOODS_BALANCE_TICKS} T · Mehrbedarf ${num(l.extra)}`;
  if (l.reach === null) return `${base} · kein Engpass`;
  const reach = (l.reach * TICK_MS) / 60000;
  return `${base} → Lücke ${num(l.gap)} · Lager reicht ≈ ${reach < 0.5 ? '< 1' : Math.round(reach)} min`;
}

function yesLines(pv: PetitionPreview): string[] {
  const out: string[] = pv.reserve.map(reserveLine);
  if (pv.reserve.length > 0)
    out.push('Schätzung: alle Wohnhäuser der Heimatinsel sind mitgezählt.');
  if (pv.producers !== null) {
    const i = pv.producers.input;
    const inp =
      i === null
        ? ''
        : ` · Eingang ${name(i.good)}: Lager ${Math.floor(i.stock)}, netto ${signed(i.net)} je ${GOODS_BALANCE_TICKS} T`;
    out.push(`Betriebe: ${pv.producers.count}${inp}`);
  }
  if (pv.stocks !== null)
    out.push(
      `Lager jetzt: ${(Object.entries(pv.stocks) as [GoodId, number][])
        .map(([g, n]) => `${name(g)} ${Math.floor(n)}`)
        .join(', ')}`,
    );
  if (pv.spiceRoute !== null) {
    const s = pv.spiceRoute.ships;
    out.push(
      `Wirkung hängt am Schiffsraum: ${name('spice')} im Fremdlager ${Math.floor(pv.spiceRoute.foreignStock)} · ${s} ${s === 1 ? 'Schiff' : 'Schiffe'} mit Gewürzroute`,
    );
  }
  return out;
}

/** Karte einer offenen, unbeantworteten Marke; `null`, wenn es sie nicht (mehr) gibt. */
/** Begründung ohne das Vorwort «Genügsam bei Ware: » (die Zeile heisst schon «Warum Ware»), Satz gross. */
export function reasonText(raw: string): string {
  const t = raw.replace(/^Genügsam bei [^:]+: /, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function petitionCardModel(world: World, drawnAt: number): PetitionCardModel | null {
  const mark = world.petitions.open.find((m) => m.drawnAt === drawnAt);
  if (mark === undefined || mark.answer !== undefined) return null;
  const pv = petitionPreview(world, drawnAt);
  if (pv === null) return null;
  const def = PETITIONS[pv.id];
  const g = name(pv.noGood);
  return {
    title: def.name,
    text: def.text,
    deadline: `Antwort bis ${formatClock(pv.left)}`,
    yes: {
      cost: costText(pv.cost),
      blocked: pv.yesBlock,
      reward: rewardText(def, pv),
      lines: yesLines(pv),
    },
    no: {
      effect: `für ${minutes(FRUGAL_TICKS)} −${FRUGAL_PCT} % ${g}bedarf (spart ≈ ${Math.round(pv.noSaving)} ${g})`,
      nearFull: pv.nearFull ? 'Lager fast voll: Ersparnis verfällt teilweise' : null,
      why: `Warum ${g}: ${reasonText(def.noReason)}`,
      tail: 'Keine weitere Folge',
    },
  };
}

/** Kopf-Chip: unbeantwortete Marke mit der frühesten Frist; «(+1)» bei weiteren offenen. */
export function petitionChip(world: World): { label: string; drawnAt: number } | null {
  const open = world.petitions.open
    .filter((x) => x.answer === undefined)
    .sort((a, b) => a.drawnAt - b.drawnAt);
  const m = open[0];
  if (m === undefined) return null;
  const left = m.drawnAt + PETITION_ANSWER - world.tick;
  const more = open.length > 1 ? ` (+${open.length - 1})` : '';
  return { label: `Bittschrift ${formatClock(left)}${more}`, drawnAt: m.drawnAt };
}
