import { describe, expect, it } from 'vitest';
import { friendlyReason } from '../../src/ui/hints';
import { createWorld } from '../../src/sim/world';

describe('AK-ZK-18 Hinweis bei abgewiesenem Spielstand', () => {
  it('liefert für beide Gründe einen nicht leeren Text', () => {
    const w = createWorld(3);
    for (const reason of ['Beschädigter Spielstand', 'Unbekannte Version'])
      expect(friendlyReason(w, reason).length).toBeGreaterThan(0);
  });
});
