// cachePlan.ts — Cache-Aufbau in Scheiben (Spec M12 Anhang 02 D). Rein, ohne DOM; die Uhr wird eingespeist.
export const SLICE_MS = 8; // Darstellungswert (Spec M12 R228 (4) F-P3)

export interface CacheJob {
  island: number;
  steps: (() => void)[];
}
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
 * solange `(now() − t0) + teuersterBisherigerSchritt ≤ SLICE_MS`. Bei der Erzeugung läuft nichts.
 */
export function createCachePlan(jobs: readonly CacheJob[], now: () => number): CachePlan {
  const next = new Map<number, number>(jobs.map((j) => [j.island, 0]));
  const sliceMs: number[] = [];
  const emergencyMs: number[] = [];
  const finished = (j: CacheJob): boolean => (next.get(j.island) ?? 0) >= j.steps.length;
  const runStep = (j: CacheJob): number => {
    const i = next.get(j.island) ?? 0;
    next.set(j.island, i + 1);
    const s = now();
    j.steps[i]!();
    return now() - s;
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
      let worst = 0,
        ran = 0;
      for (const j of jobs) {
        while (!finished(j)) {
          if (ran > 0 && now() - t0 + worst > SLICE_MS) break;
          worst = Math.max(worst, runStep(j));
          ran++;
        }
        if (!finished(j)) break;
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
