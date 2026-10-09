import { configDefaults, defineConfig } from 'vitest/config';

/**
 * Zeittests messen Wandzeit (`performance.now(` / `Date.now(`). Sie laufen erst nach dem
 * parallelen Testlauf, allein und seriell, damit sie unter Mehrfachlast nicht flackern.
 * Neue Zeittests hier eintragen; `make zeittests` (Teil von `make check`) schlägt sonst fehl.
 */
export const ZEITTESTS = [
  'tests/render/bauRuckeln.test.ts',
  'tests/render/renderer.test.ts',
  'tests/render/seaMap.test.ts',
  'tests/render/terrain.test.ts',
  'tests/sim/perf.test.ts',
  'tests/sim/save.test.ts',
  'tests/sim/seaRoute.test.ts',
  'tests/ui/hints.test.ts',
];

export default defineConfig({
  base: './',
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'parallel',
          include: ['tests/**/*.test.ts'],
          exclude: [...configDefaults.exclude, ...ZEITTESTS],
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: 'zeit',
          include: ZEITTESTS,
          fileParallelism: false,
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
});
