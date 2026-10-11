import { GOODS } from '../sim/defs/goods';
import { MONUMENT_GOODS, MONUMENT_PULL_TICKS, MONUMENT_STAGES } from '../sim/defs/monument';
import { monumentProgress, monumentReserve, monumentStartReason } from '../sim/monument';
import { buyPrice, monumentBuyBlock } from '../sim/trade';
import type { Monument, MonumentGood, World } from '../sim/types';
import { home } from '../sim/world';
import { formatGameTime } from './time';

// Reine, DOM-freie Helfer für Denkmal-Panel, Inselchronik und Ziel-Chip (M13-E2, Spec §7, Anhang 07).
// Nur Lesen der Welt; Zahlen und Namen stammen aus Defs und Sim-Abfragen.

const STAGE_COUNT = MONUMENT_STAGES.length;

export interface MonumentRow {
  good: MonumentGood;
  label: string;
  pct: number;
  reserveText: string;
  buyText: string;
  buyOn: boolean;
}

/** Soll des angezeigten Abschnitts je Gut; `null` ohne Denkmal oder nach dem letzten Abschnitt. */
function shownGoal(m: Monument | null): Readonly<Record<MonumentGood, number>> | null {
  if (m === null || m.stage >= STAGE_COUNT) return null;
  return MONUMENT_STAGES[m.stage]!.goods;
}

export function monumentRows(w: World): MonumentRow[] {
  const m = w.monument;
  const goal = shownGoal(m);
  if (m === null || goal === null) return [];
  return MONUMENT_GOODS.map((good) => {
    const got = m.running ? m.delivered[good] : 0;
    const need = goal[good];
    return {
      good,
      label: `${GOODS[good].name} ${got} / ${need}`,
      pct: need === 0 ? 0 : Math.floor((100 * got) / need),
      reserveText: `Reserve ${monumentReserve(w, good)}`,
      buyText: `zukaufen (${buyPrice(w, good, 1)} / Stück)`,
      buyOn: m.buy[good],
    };
  });
}

export interface MonumentStart {
  visible: boolean;
  disabled: boolean;
  reason: string | null;
  buttonText: string;
}

export function monumentStartState(w: World): MonumentStart {
  const m = w.monument;
  const reason = monumentStartReason(w);
  if (m === null || m.running || m.stage >= STAGE_COUNT) {
    return { visible: false, disabled: true, reason, buttonText: '' };
  }
  return {
    visible: true,
    disabled: reason !== null && reason !== 'Zu wenig Geld',
    reason,
    buttonText: `Abschnitt ${m.stage + 1} beginnen (${MONUMENT_STAGES[m.stage]!.money})`,
  };
}

/** Güter des Abschnitts mit Rest > 0 samt Rest. */
function openGoods(m: Monument): { good: MonumentGood; rest: number }[] {
  const goal = shownGoal(m);
  if (goal === null) return [];
  return MONUMENT_GOODS.map((good) => ({ good, rest: goal[good] - m.delivered[good] })).filter(
    (e) => e.rest > 0,
  );
}

export function monumentEtaText(w: World): string {
  const m = w.monument;
  if (m === null || !m.running) return '';
  const maxRest = Math.max(0, ...openGoods(m).map((e) => e.rest));
  return `frühestens fertig in ${formatGameTime(maxRest * MONUMENT_PULL_TICKS)}`;
}

export function monumentStallReason(w: World): string | null {
  const m = w.monument;
  if (m === null || !m.running) return null;
  if (m.paused) return 'Bau pausiert';
  if (!w.buildings[m.buildingId]?.connected) return 'Nicht angebunden';
  const stock = home(w).stock;
  const open = openGoods(m).map((e) => e.good);
  // Güter, die nur über Zukauf weitergehen könnten (Lager auf oder unter Reserve, Zukauf an).
  const buying = open.filter((g) => stock[g] <= monumentReserve(w, g) && m.buy[g]);
  if (buying.some((g) => monumentBuyBlock(w, g) !== null)) return 'Kein Kontor';
  const deliverable = open.some((g) =>
    stock[g] > monumentReserve(w, g)
      ? true
      : m.buy[g] && monumentBuyBlock(w, g) === null && w.money >= buyPrice(w, g, 1),
  );
  if (deliverable) return null;
  if (buying.length > 0) return 'Zu wenig Geld für den Zukauf';
  return open.length > 0 ? 'Lager auf Reserve' : null;
}

export function monumentStageLine(w: World): string | null {
  const m = w.monument;
  if (m === null) return null;
  if (m.stage >= STAGE_COUNT) return 'Denkmal fertig';
  const name = MONUMENT_STAGES[m.stage]!.name;
  if (m.running) return `Abschnitt ${m.stage + 1} / ${STAGE_COUNT} · ${name}`;
  if (m.stage === 0) return `Bauplatz · nächster: ${name}`;
  return `${m.stage} / ${STAGE_COUNT} fertig · nächster: ${name}`;
}

export function monumentChronicleLine(w: World): string | null {
  if (!w.wonMerchants) return null;
  if (w.monumentDone) return 'Wahlziel erreicht: Das Denkmal steht';
  const m = w.monument;
  if (m === null) return 'Wahlziel: Denkmal bauen (Öffentlich)';
  if (m.running) {
    return `Denkmal: Abschnitt ${m.stage + 1}/${STAGE_COUNT} · ${monumentProgress(w)} %`;
  }
  return `Denkmal: ${m.stage}/${STAGE_COUNT} fertig`;
}

/** Für den Ziel-Chip: Text, Titel, Balken; null vor Phase 'done'. */
export interface MonumentChip {
  chip: string;
  title: string;
  fillPct: number;
}

export function monumentChip(w: World): MonumentChip | null {
  if (!w.wonSpice) return null;
  if (w.monumentDone) {
    return {
      chip: 'Wahlziel erreicht',
      title: 'Wahlziel Denkmal erreicht — freies Spiel',
      fillPct: 100,
    };
  }
  const m = w.monument;
  if (m === null) {
    return {
      chip: 'Wahlziel: Denkmal bauen',
      title: 'Denkmal in der Bauleiste unter Öffentlich',
      fillPct: 0,
    };
  }
  const title = `Wahlziel Denkmal: ${monumentStageLine(w)}`;
  if (m.running) {
    const x = monumentProgress(w);
    return { chip: `Denkmal ${m.stage + 1}/${STAGE_COUNT} · ${x} %`, title, fillPct: x };
  }
  return {
    chip: `Denkmal ${m.stage}/${STAGE_COUNT}`,
    title,
    fillPct: Math.floor((100 * m.stage) / STAGE_COUNT),
  };
}

/** U-14: Das Denkmal mit Fortschritt (läuft oder Abschnitt ≥ 1) verlangt beim Abriss einen zweiten Klick. */
export function monumentNeedsConfirm(w: World, id: number): boolean {
  const m = w.monument;
  return m !== null && id === m.buildingId && (m.running || m.stage >= 1);
}
