import { TICK_MS } from '../sim/defs/timing';

/** Einheit von `goodsBalance` (Bilanz je 100 Ticks); Darstellungskonstante, kein Spielwert. */
export const GOODS_BALANCE_TICKS = 100;

function seconds(ticks: number, round: (x: number) => number): number {
  return round((Math.max(0, ticks) * TICK_MS) / 1000);
}

/** Dauer in Spielzeit bei 1×: „59 s" unter einer Minute, sonst „4:00" (aufgerundet, nie negativ). */
export function formatGameTime(ticks: number): string {
  const s = seconds(ticks, Math.ceil);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Zeitpunkt (Spielstand, Log): immer „m:ss", abgerundet (P-2). */
export function formatClock(ticks: number): string {
  const s = seconds(ticks, Math.floor);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Menge je `perTicks` umgerechnet auf eine Minute Spielzeit, höchstens eine Nachkommastelle. */
export function perMinute(amount: number, perTicks: number): number {
  return Math.round(((amount * 60000) / (perTicks * TICK_MS)) * 10) / 10;
}

/** Zahl mit ausdrücklichem Vorzeichen (typografisches Minus). */
export function signedNum(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${-n}`;
  return '±0';
}
