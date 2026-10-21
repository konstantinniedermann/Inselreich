// resumeCard.ts — Karte «Wo war ich?» beim Laden (I-148). Nur Darstellung: liest die Welt, ändert sie nie.
import { GOODS } from '../sim/defs/goods';
import { TRIALS, TRIAL_DURATION_TICKS } from '../sim/defs/trials';
import { islandName } from '../sim/islands';
import { nextSettleTick } from '../sim/orders';
import type { World } from '../sim/types';
import { HOME } from '../sim/world';
import { farLate, farOfferDue, farOrderText } from './farOrder';
import { closeAllModals, openModal, type ModalHandle } from './modal';
import { NO_PROBLEM_TEXT, problemList } from './problems';
import { formatClock, formatGameTime } from './time';

export interface ResumeCardView {
  title: string;
  clock: string;
  deadlines: string[];
  problems: string;
}

export interface ResumeLine {
  rest: number;
  /** Feste Folge bei gleicher Restzeit: Auftrag 0, Fernauftrag 1, Fernangebot 2, Stammkunde 3, Auflage 4. */
  order: number;
  text: string;
}

/** Aufsteigend nach Restzeit, bei Gleichstand nach fester Folge. */
export function sortLines(lines: readonly ResumeLine[]): ResumeLine[] {
  return [...lines].sort((a, b) => a.rest - b.rest || a.order - b.order);
}

function deadlineLines(world: World): ResumeLine[] {
  const out: ResumeLine[] = [];
  const o = world.order;
  if (o !== null) {
    const rest = o.due - world.tick;
    if (o.island === undefined) {
      out.push({
        rest,
        order: 0,
        text: `Auftrag ${o.amount} ${GOODS[o.good].name} · ${o.reward} · noch ${formatGameTime(rest)}`,
      });
    } else {
      const late = farLate(world, { island: o.island, amount: o.amount, good: o.good }, rest);
      out.push({
        rest,
        order: 1,
        text: farOrderText(world, o) + (late ? ' · zu spät' : ''),
      });
    }
  }
  const f = world.farOffer;
  if (f !== null && !(o !== null && o.island !== undefined)) {
    const rest = farOfferDue(world)! - world.tick;
    out.push({
      rest,
      order: 2,
      text: `Fernangebot ${islandName(world, f.island)}: ${f.amount} ${GOODS[f.good].name} · Frist ${formatGameTime(rest)}`,
    });
  }
  const c = world.contract;
  if (c !== null) {
    const rest = nextSettleTick(world) - world.tick;
    const short = world.islands[c.island]!.stock[c.good] < c.amount;
    out.push({
      rest,
      order: 3,
      text:
        `Stammkunde ${GOODS[c.good].name}: nächste Lieferung in ${formatGameTime(rest)}` +
        (short ? ' · Lager reicht nicht' : ''),
    });
  }
  const t = world.trial;
  if (t.active !== null) {
    const rest = TRIAL_DURATION_TICKS - t.ticks;
    out.push({
      rest,
      order: 4,
      text: `Auflage ${TRIALS[t.active].name}: noch ${formatGameTime(rest)}`,
    });
  }
  return out;
}

/** Inhalt der Karte; `null`, wenn es weder Fristen noch Probleme gibt (stumm). Liest nur die Welt. */
export function resumeCardView(world: World): ResumeCardView | null {
  const deadlines = sortLines(deadlineLines(world)).map((l) => l.text);
  const n = problemList(world, HOME).length;
  if (deadlines.length === 0 && n === 0) return null;
  const problems =
    n === 0 ? NO_PROBLEM_TEXT : `${n === 1 ? '1 Problem' : `${n} Probleme`} offen — . springt hin`;
  return {
    title: 'Wo war ich?',
    clock: `Spielzeit ${formatClock(world.tick)} · pausiert`,
    deadlines,
    problems,
  };
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== '') e.textContent = text;
  return e;
}

/** Öffnet die Karte; ohne Inhalt geschieht nichts. «Weiter» schliesst, das Tempo bleibt unberührt. */
export function openResumeCard(host: HTMLElement, world: World): ModalHandle | null {
  const view = resumeCardView(world);
  if (view === null) return null;
  closeAllModals();
  const handle = openModal({
    host,
    className: 'card--resume',
    label: view.title,
    restoreFocus: 'body',
  });
  const list = el('ul', 'resume-list');
  for (const d of view.deadlines) list.appendChild(el('li', 'resume-line', d));
  const next = el('button', 'btn', 'Weiter');
  next.type = 'button';
  next.addEventListener('click', () => handle.close());
  handle.card.append(
    el('h2', '', view.title),
    el('p', 'note', view.clock),
    list,
    el('p', 'resume-problems', view.problems),
    next,
  );
  next.focus();
  return handle;
}
