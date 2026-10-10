import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { setEdict } from '../../src/sim/edicts';
import { EDICT_IDS } from '../../src/sim/defs/edicts';
import { EDICT_LOCK } from '../../src/sim/defs/timing';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import {
  edictCardState,
  edictEffectText,
  edictLockText,
  edictStatusLine,
  edictWhenText,
} from '../../src/ui/edictView';
import { friendlyReason, REASON_TABLE } from '../../src/ui/hints';
import { placeTownhall } from '../sim/helpers';

function edictWorld(): { w: World; th: ReturnType<typeof placeTownhall> } {
  const w = createWorld(3, { unlockAll: true });
  w.won = true;
  const th = placeTownhall(w);
  w.money = 1000;
  w.tick = 1000;
  return { w, th };
}

describe('M13-E1 edictView (AK-M13E1-27…30)', () => {
  it('AK-M13E1-27 Wirkungs- und Wann-Texte', () => {
    expect(edictEffectText('saving')).toBe('Unterhalt −20 % · Steuer −7 Punkte');
    expect(edictEffectText('trade')).toBe('Kaufpreise am Kontor −20 %');
    expect(edictEffectText('welfare')).toBe(
      'Wachstum alle 4 s statt 5 s · Aufstieg nach 20 s · Steuer −5 Punkte',
    );
    for (const id of EDICT_IDS) {
      expect(edictWhenText(id)).toMatch(/^lohnt, wenn /);
    }
  });

  it('AK-M13E1-28 Kartenzustand', () => {
    const { w } = edictWorld();
    w.won = false;
    for (const id of EDICT_IDS) {
      const c = edictCardState(w, id);
      expect(c.disabled).toBe(true);
      expect(c.reason).toBe('Erst nach dem Bürger-Ziel');
    }
    w.won = true;
    const free = edictCardState(w, 'trade');
    expect(free.reason).toBeNull();
    expect(free.disabled).toBe(false);
    expect(free.buttonText).toBe('Erlassen (600)');

    expect(setEdict(w, 'saving').ok).toBe(true);
    const act = edictCardState(w, 'saving');
    expect(act.active).toBe(true);
    expect(act.buttonText).toBe('Aufheben');
    const locked = edictCardState(w, 'trade');
    expect(locked.disabled).toBe(true);
    expect(locked.reason).toBe('Edikt-Sperrzeit');

    w.tick += EDICT_LOCK;
    w.money = 100;
    const poor = edictCardState(w, 'trade');
    expect(poor.disabled).toBe(false);
    expect(poor.reason).toBe('Zu wenig Geld');
  });

  it('AK-M13E1-29 Sperrtext und Grund', () => {
    const { w } = edictWorld();
    w.edictLockedUntil = w.tick + 3000;
    expect(edictLockText(w)).toBe('wieder änderbar in 5:00');
    w.edictLockedUntil = w.tick + 450;
    expect(edictLockText(w)).toBe('wieder änderbar in 45 s');
    w.edictLockedUntil = w.tick;
    expect(edictLockText(w)).toBe('');
  });

  it('AK-M13E1-30 Statuszeile', () => {
    const { w, th } = edictWorld();
    expect(edictStatusLine(w)).toBe('Kein Edikt');
    expect(setEdict(w, 'trade').ok).toBe(true);
    expect(edictStatusLine(w)).toBe('Edikt: Handel');
    th.outageUntil = w.tick + 1000;
    expect(edictStatusLine(w)).toBe('Edikt Handel ruht: Amtsstube wirkt nicht');
  });

  it('AK-UX-03 Vollständigkeit der Edikt-Gründe', () => {
    const { w } = edictWorld();
    const covered = (r: string): boolean => REASON_TABLE.some((row) => row.pattern.test(r));
    const reasons: string[] = [];
    const grab = (id: unknown): void => {
      const r = setEdict(w, id);
      if (!r.ok) reasons.push(r.reason);
    };
    w.won = false;
    grab('saving');
    w.won = true;
    grab('gibts-nicht');
    grab(null);
    grab('saving');
    grab('saving');
    grab('trade');
    w.tick += EDICT_LOCK;
    w.money = 0;
    grab('trade');
    expect(reasons).toEqual([
      'Erst nach dem Bürger-Ziel',
      'Ungültiges Edikt',
      'Kein Edikt aktiv',
      'Edikt bereits aktiv',
      'Edikt-Sperrzeit',
      'Zu wenig Geld',
    ]);
    for (const r of reasons) expect(covered(r), r).toBe(true);
    for (const r of [
      'Erst nach dem Bürger-Ziel',
      'Edikt bereits aktiv',
      'Kein Edikt aktiv',
      'Ungültiges Edikt',
    ])
      expect(friendlyReason(w, r)).toBe(r);
    expect(friendlyReason(w, 'Unbekannte Version')).not.toBe('');
    expect(friendlyReason(w, 'Ungültiges Format')).not.toBe('');
  });

  it('AK-M13E1-29 friendlyReason Edikt-Sperrzeit', () => {
    const { w } = edictWorld();
    w.edictLockedUntil = w.tick + 450;
    expect(friendlyReason(w, 'Edikt-Sperrzeit')).toBe('Edikt erst in 45 s wieder änderbar');
  });

  it('Reinheit: Helfer ändern die Welt nicht, kein DOM', () => {
    const { w } = edictWorld();
    setEdict(w, 'saving');
    const before = JSON.stringify(w);
    for (const id of EDICT_IDS) {
      edictEffectText(id);
      edictWhenText(id);
      edictCardState(w, id);
    }
    edictLockText(w);
    edictStatusLine(w);
    expect(JSON.stringify(w)).toBe(before);
    const src = readFileSync('src/ui/edictView.ts', 'utf8');
    expect(src).not.toMatch(/\bdocument\b|\bwindow\b/);
  });
});
