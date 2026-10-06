// cachePlan.ts — Cache-Aufbau in Scheiben (Spec M12 Anhang 02 D). Rein, ohne DOM; die Uhr wird eingespeist.
export const SLICE_MS = 8; // Darstellungswert (Spec M12 R228 (4) F-P3)

/** Schritt; `solo` = teuer beim ersten Gebrauch, läuft allein in einer Scheibe (AK-E1-19). */
export type CacheStep = (() => void) & { solo?: true };
export interface CacheJob {
  island: number;
  steps: CacheStep[];
}
/** Abklingen der Kostenschätzung je Schritt (Darstellungswert): ein teurer Schritt begrenzt die Folgescheiben. */
export const WORST_DECAY = 0.95;
export interface CachePlan {
  /** Ein Leerlauf-Slot; liefert die Dauer der Scheibe (0, wenn nichts mehr zu tun ist). */
  idle(): number;
  /** Notfall: restliche Schritte der Insel sofort; liefert die Dauer. */
  finish(island: number): number;
  done(island: number): boolean;
  /** Dauer je Scheibe (Dev-Sonde R5). */
  readonly sliceMs: number[];
  readonly emergencyMs: number[];
}

/**
 * `idle()` arbeitet die Jobs der Reihe nach ab. Der erste Schritt einer Scheibe läuft immer (Fortschritt), weitere nur,
 * solange `(now() − t0) + geschätzterTeuersterSchritt ≤ SLICE_MS`. Die Schätzung gilt über Scheiben hinweg und klingt je
 * Schritt um `WORST_DECAY` ab. Ein `solo`-Schritt beginnt eine Scheibe und beendet sie. Bei der Erzeugung läuft nichts.
 */
export function createCachePlan(jobs: readonly CacheJob[], now: () => number): CachePlan {
  const next = new Map<number, number>(jobs.map((j) => [j.island, 0]));
  const sliceMs: number[] = [];
  const emergencyMs: number[] = [];
  const finished = (j: CacheJob): boolean => (next.get(j.island) ?? 0) >= j.steps.length;
  let worst = 0; // geschätzte Kosten des teuersten Schritts, über Scheiben hinweg
  const runStep = (j: CacheJob): number => {
    const i = next.get(j.island) ?? 0;
    next.set(j.island, i + 1);
    const s = now();
    j.steps[i]!();
    const cost = now() - s;
    worst = Math.max(cost, worst * WORST_DECAY);
    return cost;
  };
  return {
    sliceMs,
    emergencyMs,
    done: (island) => {
      const j = jobs.find((x) => x.island === island);
      return !j || finished(j);
    },
    idle() {
      const t0 = now();
      let ran = 0;
      let ended = false;
      for (const j of jobs) {
        while (!finished(j)) {
          const solo = j.steps[next.get(j.island) ?? 0]?.solo === true;
          if (ran > 0 && (solo || now() - t0 + worst > SLICE_MS)) break;
          runStep(j);
          ran++;
          if (solo) {
            ended = true;
            break;
          }
        }
        if (ended || !finished(j)) break;
      }
      if (ran === 0) return 0;
      const ms = now() - t0;
      sliceMs.push(ms);
      return ms;
    },
    finish(island) {
      const j = jobs.find((x) => x.island === island);
      if (!j || finished(j)) return 0;
      const t0 = now();
      while (!finished(j)) runStep(j);
      const ms = now() - t0;
      emergencyMs.push(ms);
      return ms;
    },
  };
}
