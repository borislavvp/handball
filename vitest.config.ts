import { defineVitestConfig } from '@nuxt/test-utils/config'
import { fileURLToPath } from 'node:url'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// `defineVitestConfig` auto-creates a second Vitest project that runs every
// file in the Nuxt runtime environment. That environment crashes on import for
// this app (Nuxt 4.4 + @nuxt/test-utils: `nuxtApp._route.sync` is undefined),
// and we don't use it — component tests mount in happy-dom with the Nuxt
// composables mocked. So we keep the Nuxt Vite plugins (auto-imports, .vue
// compilation, aliases) but strip the generated `nuxt` project, leaving a
// single node-based project where per-file `// @vitest-environment happy-dom`
// directives still apply.
const base = defineVitestConfig({
  resolve: {
    alias: {
      '~~': r('./'),
      '@@': r('./'),
      '~': r('./'),
      '@': r('./')
    }
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'composables/**/*.test.ts',
      'server/**/*.test.ts',
      'shared/**/*.test.ts',
      'components/**/*.test.ts',
      'tests/**/*.test.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'composables/usePlayer.ts',
        'composables/useStats.ts',
        'composables/useKeymap.ts',
        'composables/useMatchKeymap.ts',
        'composables/useUndo.ts',
        'server/api/**/*.ts',
        'server/utils/matchEventStats.ts',
        'shared/pdf/**/*.ts'
      ]
    }
  }
})

export default async (env: unknown) => {
  const resolved = await (typeof base === 'function' ? (base as (e: unknown) => unknown)(env) : base)
  const test = (resolved as { test?: Record<string, unknown> }).test
  if (test) {
    // Drop the auto-generated nuxt-environment project; keep the node one.
    for (const key of ['projects', 'workspace'] as const) {
      const arr = test[key]
      if (Array.isArray(arr)) {
        test[key] = arr.filter(
          (p: { test?: { name?: string } }) => p?.test?.name !== 'nuxt'
        )
      }
    }
  }
  return resolved
}
