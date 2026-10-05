// Zeit-Schwellen in Tests: lokal streng, im CI (GitHub-Runner, langsamer) mit Faktor 1,5 (R217 V4).
const CI_FACTOR = 1.5;

type Env = Record<string, string | undefined>;

// Die Typ-Shims der Tests kennen process.env nicht (kein @types/node), daher der Zugriff über globalThis.
const processEnv = (): Env =>
  (globalThis as unknown as { process?: { env?: Env } }).process?.env ?? {};

// R235: optionaler Faktor je Test (Default CI_FACTOR); lokal gilt immer `ms`.
export function perfBudget(
  ms: number,
  env: Env = processEnv(),
  ciFactor: number = CI_FACTOR,
): number {
  const ci = env.CI === 'true' || env.CI === '1';
  return ci ? ms * ciFactor : ms;
}
