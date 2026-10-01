/**
 * Fake-Kontext für Renderer-Tests (kein DOM): protokolliert Pfadpunkte (in Bildpunkten, also mit der
 * aktuellen Matrix), gesetzte Füll-/Strichfarben, `globalCompositeOperation`, `save`/`restore` und die Matrix.
 * Unbekannte Methoden sind No-Ops.
 */
export interface P {
  x: number;
  y: number;
}
export type Mat = [number, number, number, number, number, number];
export interface Ev {
  op: 'fill' | 'stroke' | 'fillRect' | 'strokeRect' | 'clearRect' | 'drawImage' | 'transform';
  style: string;
  matrix: Mat;
  composite: string;
  /** `globalAlpha` zum Zeitpunkt des Aufrufs. */
  alpha: number;
  points: P[];
}

export class FakeCtx {
  events: Ev[] = [];
  /** Alle Pfadpunkte seit Erzeugung (nicht durch `beginPath` zurückgesetzt), in Bildpunkten. */
  allPoints: P[] = [];
  /** Jede Zuweisung an `fillStyle` bzw. `strokeStyle` bzw. `globalCompositeOperation`. */
  fillSet: string[] = [];
  strokeSet: string[] = [];
  compositeSet: string[] = [];
  saves = 0;
  restores = 0;
  underflow = 0;
  matrix: Mat = [1, 0, 0, 1, 0, 0];
  lineWidth = 1;
  lineCap = 'butt';
  /** Jede Zuweisung an `globalAlpha`. */
  alphaSet: number[] = [];
  private stack: { m: Mat; f: string; s: string; c: string; a: number }[] = [];
  private _alpha = 1;
  private path: P[] = [];
  private _fill = '#000000';
  private _stroke = '#000000';
  private _comp = 'source-over';

  get fillStyle(): string {
    return this._fill;
  }
  set fillStyle(v: string) {
    this._fill = String(v);
    this.fillSet.push(this._fill);
  }
  get globalAlpha(): number {
    return this._alpha;
  }
  set globalAlpha(v: number) {
    this._alpha = Number(v);
    this.alphaSet.push(this._alpha);
  }
  get strokeStyle(): string {
    return this._stroke;
  }
  set strokeStyle(v: string) {
    this._stroke = String(v);
    this.strokeSet.push(this._stroke);
  }
  get globalCompositeOperation(): string {
    return this._comp;
  }
  set globalCompositeOperation(v: string) {
    this._comp = String(v);
    this.compositeSet.push(this._comp);
  }

  /** Bildpunkt eines Punkts unter der aktuellen Matrix. */
  apply(x: number, y: number): P {
    const [a, b, c, d, e, f] = this.matrix;
    return { x: a * x + c * y + e, y: b * x + d * y + f };
  }
  private add(x: number, y: number): void {
    const p = this.apply(x, y);
    this.path.push(p);
    this.allPoints.push(p);
  }
  private ev(op: Ev['op'], style: string, points: P[]): void {
    this.events.push({
      op,
      style,
      matrix: [...this.matrix] as Mat,
      composite: this._comp,
      alpha: this._alpha,
      points,
    });
  }

  save(): void {
    this.saves++;
    this.stack.push({
      m: [...this.matrix] as Mat,
      f: this._fill,
      s: this._stroke,
      c: this._comp,
      a: this._alpha,
    });
  }
  restore(): void {
    this.restores++;
    const s = this.stack.pop();
    if (!s) {
      this.underflow++;
      return;
    }
    this.matrix = s.m;
    this._fill = s.f;
    this._stroke = s.s;
    this._comp = s.c;
    this._alpha = s.a;
  }
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    const [A, B, C, D, E, F] = this.matrix;
    this.matrix = [
      A * a + C * b,
      B * a + D * b,
      A * c + C * d,
      B * c + D * d,
      A * e + C * f + E,
      B * e + D * f + F,
    ];
    this.ev('transform', '', []);
  }
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.matrix = [a, b, c, d, e, f];
  }
  translate(x: number, y: number): void {
    this.transform(1, 0, 0, 1, x, y);
  }
  scale(x: number, y: number): void {
    this.transform(x, 0, 0, y, 0, 0);
  }
  rotate(r: number): void {
    const c = Math.cos(r),
      s = Math.sin(r);
    this.transform(c, s, -s, c, 0, 0);
  }
  beginPath(): void {
    this.path = [];
  }
  closePath(): void {}
  moveTo(x: number, y: number): void {
    this.add(x, y);
  }
  lineTo(x: number, y: number): void {
    this.add(x, y);
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void {
    this.add(cx, cy);
    this.add(x, y);
  }
  rect(x: number, y: number, w: number, h: number): void {
    this.add(x, y);
    this.add(x + w, y);
    this.add(x + w, y + h);
    this.add(x, y + h);
  }
  arc(x: number, y: number, r: number): void {
    this.ellipse(x, y, r, r);
  }
  ellipse(x: number, y: number, rx: number, ry: number): void {
    this.add(x - rx, y);
    this.add(x + rx, y);
    this.add(x, y - ry);
    this.add(x, y + ry);
  }
  fill(): void {
    this.ev('fill', this._fill, [...this.path]);
  }
  stroke(): void {
    this.ev('stroke', this._stroke, [...this.path]);
  }
  fillRect(x: number, y: number, w: number, h: number): void {
    this.ev('fillRect', this._fill, [
      this.apply(x, y),
      this.apply(x + w, y),
      this.apply(x + w, y + h),
      this.apply(x, y + h),
    ]);
  }
  strokeRect(x: number, y: number, w: number, h: number): void {
    this.ev('strokeRect', this._stroke, [this.apply(x, y), this.apply(x + w, y + h)]);
  }
  clearRect(): void {
    this.ev('clearRect', '', []);
  }
  drawImage(): void {
    this.ev('drawImage', '', []);
  }
  setLineDash(): void {}
}

/** Kontext als `CanvasRenderingContext2D` samt Protokoll; unbekannte Methoden werden zu No-Ops. */
export function fakeCtx(): { ctx: CanvasRenderingContext2D; log: FakeCtx } {
  const log = new FakeCtx();
  const ctx = new Proxy(log, {
    get(t, k) {
      const v: unknown = Reflect.get(t, k, t);
      if (typeof v === 'function') return (v as (...a: unknown[]) => unknown).bind(t);
      if (v === undefined && typeof k === 'string') return () => undefined;
      return v;
    },
    set(t, k, v) {
      return Reflect.set(t, k, v, t);
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, log };
}

/** Punkt in konvexem Polygon (Uhrzeigersinn, Bild-y nach unten) mit Toleranz `tol` in px. */
export function inHull(h: readonly P[], x: number, y: number, tol = 0): boolean {
  for (let i = 0; i < h.length; i++) {
    const a = h[i]!,
      b = h[(i + 1) % h.length]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    if (((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x)) / len < -tol) return false;
  }
  return true;
}
