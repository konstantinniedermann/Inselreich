// Dev-Sonden (Spec 9.5): nur im Dev-Build verdrahtet (app.ts). Lesen, nie schreiben.
import type { AudioDebugState } from '../audio/sound';
import type { World } from '../sim/types';

declare global {
  interface Window {
    __inselAudio?: AudioDebugState;
    __inselDev?: DevProbe;
    __inselPerf?: {
      frameMedian: number;
      frameP95: number;
      renderMedian: number;
      renderP95: number;
      n: number;
    };
  }
}

/** Dev-Sonde für Browser-Prüfungen (M10): Welt lesen, Kachelmitte in CSS-Pixeln, Kamera zentrieren. */
export interface DevProbe {
  world(): World;
  tileCenter(x: number, y: number): { x: number; y: number };
  centerOn(x: number, y: number): void;
}

/** Hängt die Sonde nur im Dev-Build an `window.__inselDev` ; sonst nichts. */
export function exposeDevProbe(probe: DevProbe): void {
  if (import.meta.env.DEV) window.__inselDev = probe;
}

/** Median und 95. Perzentil (Nearest-Rank); leere Liste ergibt 0. */
export function summarize(values: number[]): { median: number; p95: number } {
  if (values.length === 0) return { median: 0, p95: 0 };
  const s = [...values].sort((a, b) => a - b);
  const at = (p: number): number =>
    s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))] ?? 0;
  return { median: at(0.5), p95: at(0.95) };
}

/** Spiegelt `sound.debugState()` alle 250 ms nach `window.__inselAudio`; gibt die Stopp-Funktion zurück. */
export function startAudioProbe(sound: { debugState(): AudioDebugState }): () => void {
  const tick = (): void => {
    window.__inselAudio = sound.debugState();
  };
  tick();
  const id = setInterval(tick, 250);
  return () => clearInterval(id);
}

const WINDOW = 600;
const LOG_MS = 5000;

export interface PerfProbe {
  /** Am Anfang jedes Frames mit der rAF-Zeit. */
  frame(now: number): void;
  /** Um `render()`. */
  renderDone(ms: number): void;
}

export function createPerfProbe(): PerfProbe {
  const frames: number[] = [];
  const renders: number[] = [];
  let prev: number | null = null;
  let lastLog = 0;
  const push = (a: number[], v: number): void => {
    a.push(v);
    if (a.length > WINDOW) a.shift();
  };
  const publish = (): void => {
    const f = summarize(frames);
    const r = summarize(renders);
    window.__inselPerf = {
      frameMedian: f.median,
      frameP95: f.p95,
      renderMedian: r.median,
      renderP95: r.p95,
      n: frames.length,
    };
  };
  return {
    frame(now) {
      if (prev !== null) push(frames, now - prev);
      prev = now;
      if (now - lastLog >= LOG_MS) {
        lastLog = now;
        publish();
        const p = window.__inselPerf;
        if (p)
          console.info(
            `perf n=${p.n} frame ${p.frameMedian.toFixed(1)}/${p.frameP95.toFixed(1)} ms render ${p.renderMedian.toFixed(1)}/${p.renderP95.toFixed(1)} ms`,
          );
      }
    },
    renderDone(ms) {
      push(renders, ms);
      publish();
    },
  };
}
