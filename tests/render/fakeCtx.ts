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
/** Ein `clip`-Aufruf: Pfadpunkte in Bildpunkten und Füllregel (`nonzero`, wenn nicht angegeben). */
export interface ClipRec {
  points: P[];
  rule: string;
}
export interface Ev {
  op:
    | 'fill'
    | 'stroke'
    | 'fillRect'
    | 'strokeRect'
    | 'clearRect'
    | 'drawImage'
    | 'transform'
    | 'clip';
  style: string;
  matrix: Mat;
  composite: string;
  /** `globalAlpha` zum Zeitpunkt des Aufrufs. */
  alpha: number;
  /** `lineWidth` zum Zeitpunkt des Aufrufs. */
  lineWidth: number;
  /** `lineJoin` zum Zeitpunkt des Aufrufs; nur gesetzt, wenn nicht der Standard `miter` (H-R8, R195). */
  lineJoin?: string;
  points: P[];
  /** Zum Zeitpunkt des Aufrufs aktive Clips (ältester zuerst); `restore` nimmt sie zurück. */
  clips: readonly ClipRec[];
  /** Füllregel bei `op === 'clip'`. */
  rule?: string;
}

export class FakeCtx {
  events: Ev[] = [];
  /** Alle Pfadpunkte seit Erzeugung (nicht durch `beginPath` zurückgesetzt), in Bildpunkten. */
  allPoints: P[] = [];
  /** Jede Zuweisung an `fillStyle` bzw. `strokeStyle` bzw. `globalCompositeOperation`. */
  fillSet: string[] = [];
  strokeSet: string[] = [];
  compositeSet: string[] = [];
  /** Quellen aller `drawImage`-Aufrufe in Reihenfolge (M12 E1). */
  images: unknown[] = [];
  saves = 0;
  restores = 0;
  underflow = 0;
  matrix: Mat = [1, 0, 0, 1, 0, 0];
  lineWidth = 1;
  lineCap = 'butt';
  lineJoin = 'miter';
  /** Jede Zuweisung an `globalAlpha`. */
  alphaSet: number[] = [];
  private stack: { m: Mat; f: string; s: string; c: string; a: number; k: readonly ClipRec[] }[] =
    [];
  private clips: readonly ClipRec[] = [];
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
      lineWidth: this.lineWidth,
      ...(this.lineJoin !== 'miter' ? { lineJoin: this.lineJoin } : {}),
      points,
      clips: this.clips,
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
      k: this.clips,
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
    this.clips = s.k;
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
  /** Schneidet mit dem aktuellen Pfad; der Clip gilt bis zum passenden `restore`. */
  clip(rule: string = 'nonzero'): void {
    this.clips = [...this.clips, { points: [...this.path], rule }];
    this.ev('clip', '', [...this.path]);
    this.events[this.events.length - 1]!.rule = rule;
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
  /** Protokolliert das Zielrechteck (obere linke und untere rechte Ecke in Bildpunkten), falls angegeben (H-R9). */
  drawImage(img?: unknown, ...a: number[]): void {
    this.images.push(img);
    const d = a.length >= 8 ? a.slice(4, 8) : a.length >= 4 ? a.slice(0, 4) : null;
    this.ev(
      'drawImage',
      '',
      d ? [this.apply(d[0]!, d[1]!), this.apply(d[0]! + d[2]!, d[1]! + d[3]!)] : [],
    );
  }
  setLineDash(): void {}
  /** Verlauf als Objekt, dessen Textform die Farbstopps nennt (`gradient(a|b)`), damit Tests Füllungen erkennen. */
  createLinearGradient(): FakeGradient {
    return new FakeGradient();
  }
  createRadialGradient(): FakeGradient {
    return new FakeGradient();
  }
}

export class FakeGradient {
  stops: string[] = [];
  addColorStop(_o: number, c: string): void {
    this.stops.push(c);
  }
  toString(): string {
    return `gradient(${this.stops.join('|')})`;
  }
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
