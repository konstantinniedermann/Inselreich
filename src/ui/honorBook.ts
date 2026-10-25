// Ehrenbuch-Ablage (I-186, Spec §2.4): lesen, zusammenführen, schreiben.
// Kein DOM, kein globales localStorage; der Speicher wird injiziert.
import type { CrisisLevel } from '../sim/types';

export const HONOR_BOOK_KEY = 'inselreich.ehrenbuch';
export const HONOR_BOOK_DEFECT_KEY = 'inselreich.ehrenbuch.defekt';

export interface HonorEntry {
  at: string;
  seed: number;
  tick: number;
  crisis: CrisisLevel;
}
export interface RunMark {
  seed: number;
  unlockMode: 'stepwise' | 'all';
}
export interface BookData {
  earned: Map<string, HonorEntry>;
  run: RunMark | null;
}
export type BookStatus = 'ok' | 'damaged' | 'newer' | 'unavailable';
export interface BookStorage {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}
export interface HonorHit {
  id: string;
  seed: number;
  tick: number;
  crisis: CrisisLevel;
}
export interface HonorBook {
  data(): BookData;
  status(): BookStatus;
  session(): ReadonlySet<string>;
  record(hits: HonorHit[], at: string): string[];
  setRun(run: RunMark): void;
}

const KEY_PATTERN = /^[a-z][A-Za-z]*(:[a-z][A-Za-z]*)?$/;
const VERSION = 1;

export function isHonorKey(k: string): boolean {
  return KEY_PATTERN.test(k) && k !== 'constructor' && k !== 'prototype';
}

const isNat = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0;
const isCrisis = (c: unknown): c is CrisisLevel => c === 'off' || c === 'mild' || c === 'normal';
const isPlain = (o: unknown): o is Record<string, unknown> =>
  typeof o === 'object' && o !== null && !Array.isArray(o);

function parseEntry(o: unknown): HonorEntry | null {
  if (!isPlain(o)) return null;
  const { at, seed, tick, crisis } = o;
  if (typeof at !== 'string' || Number.isNaN(Date.parse(at))) return null;
  if (!isNat(seed) || !isNat(tick) || !isCrisis(crisis)) return null;
  return { at, seed, tick, crisis };
}

function parseRun(o: unknown): RunMark | null {
  if (!isPlain(o)) return null;
  if (!isNat(o.seed)) return null;
  if (o.unlockMode !== 'stepwise' && o.unlockMode !== 'all') return null;
  return { seed: o.seed, unlockMode: o.unlockMode };
}

const empty = (): BookData => ({ earned: new Map(), run: null });

export function parseBook(raw: string | null): {
  data: BookData;
  status: 'ok' | 'damaged' | 'newer';
} {
  if (raw === null) return { data: empty(), status: 'ok' };
  let j: unknown;
  try {
    j = JSON.parse(raw);
  } catch {
    return { data: empty(), status: 'damaged' };
  }
  if (!isPlain(j) || typeof j.v !== 'number' || !Number.isFinite(j.v) || !isPlain(j.earned)) {
    return { data: empty(), status: 'damaged' };
  }
  const data = empty();
  for (const k of Object.keys(j.earned)) {
    if (!isHonorKey(k)) continue;
    const entry = parseEntry(j.earned[k]);
    if (entry) data.earned.set(k, entry);
  }
  data.run = parseRun(j.run);
  return { data, status: j.v > VERSION ? 'newer' : 'ok' };
}

export function mergeBooks(stored: BookData, mine: BookData, newIsland: boolean): BookData {
  const earned = new Map<string, HonorEntry>(stored.earned);
  for (const [k, m] of mine.earned) {
    const s = earned.get(k);
    if (!s || Date.parse(m.at) < Date.parse(s.at)) earned.set(k, m);
  }
  return { earned, run: newIsland ? mine.run : stored.run };
}

export function serializeBook(d: BookData): string {
  const earned: Record<string, HonorEntry> = Object.create(null) as Record<string, HonorEntry>;
  for (const [k, e] of d.earned) {
    earned[k] = { at: e.at, seed: e.seed, tick: e.tick, crisis: e.crisis };
  }
  return JSON.stringify({ v: VERSION, earned, run: d.run });
}

function copy(d: BookData): BookData {
  return { earned: new Map(d.earned), run: d.run ? { ...d.run } : null };
}

export function openHonorBook(storage: () => BookStorage | null): HonorBook {
  let mem: BookData = empty();
  let stat: BookStatus = 'ok';
  const session = new Set<string>();

  function store(): BookStorage | null {
    try {
      return storage();
    } catch {
      return null;
    }
  }

  // Liest frisch aus dem Speicher; null = gesperrt.
  function read(
    s: BookStorage,
  ): { data: BookData; status: 'ok' | 'damaged' | 'newer'; raw: string | null } | null {
    try {
      const raw = s.getItem(HONOR_BOOK_KEY);
      return { ...parseBook(raw), raw };
    } catch {
      return null;
    }
  }

  // Gemeinsamer Schreibweg: neu lesen, zusammenführen, schreiben (ausser bei newer/gesperrt).
  function write(mine: BookData, newIsland: boolean): boolean {
    const s = store();
    const cur = s ? read(s) : null;
    if (!s || !cur) {
      stat = 'unavailable';
      mem = mine;
      return false;
    }
    const merged = mergeBooks(cur.data, mine, newIsland);
    if (cur.status === 'newer') {
      stat = 'newer';
      mem = merged;
      return false;
    }
    try {
      if (cur.status === 'damaged' && cur.raw !== null) s.setItem(HONOR_BOOK_DEFECT_KEY, cur.raw);
      s.setItem(HONOR_BOOK_KEY, serializeBook(merged));
    } catch {
      stat = 'unavailable';
      mem = mine;
      return false;
    }
    stat = 'ok';
    mem = merged;
    return true;
  }

  const first = (() => {
    const s = store();
    return s ? read(s) : null;
  })();
  if (!first) stat = 'unavailable';
  else {
    stat = first.status;
    mem = first.data;
  }

  return {
    data: () => mem,
    status: () => stat,
    session: () => session,
    record(hits, at) {
      const s = store();
      const cur = s ? read(s) : null;
      const known =
        cur && cur.status !== 'damaged' ? cur.data.earned : new Map<string, HonorEntry>();
      const mine = copy(mem);
      const added: string[] = [];
      for (const h of hits) {
        if (!isHonorKey(h.id) || known.has(h.id) || mine.earned.has(h.id)) continue;
        mine.earned.set(h.id, { at, seed: h.seed, tick: h.tick, crisis: h.crisis });
        added.push(h.id);
      }
      if (added.length === 0) return added;
      if (!write(mine, false)) for (const id of added) session.add(id);
      return added;
    },
    setRun(run) {
      const mine = copy(mem);
      mine.run = { ...run };
      write(mine, true);
    },
  };
}
