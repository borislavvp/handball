import { vi } from 'vitest'
import * as vue from 'vue'

/**
 * Global stubs for Nuxt auto-imports, used by the plain-`node` environment
 * tests (value math, client recording, server, PDF). Every stub is guarded by
 * a `typeof … === 'undefined'` check so it is a no-op inside the real Nuxt test
 * environment (component tests with `// @vitest-environment nuxt`), where these
 * symbols already exist.
 */

const g = globalThis as Record<string, unknown>

// --- Vue reactivity primitives (Nuxt auto-imports these from 'vue') ---
const vueGlobals = [
  'ref',
  'computed',
  'reactive',
  'readonly',
  'watch',
  'watchEffect',
  'nextTick',
  'toRef',
  'toRefs',
  'toRaw',
  'isRef',
  'unref',
  'shallowRef',
  'shallowReactive'
] as const

for (const name of vueGlobals) {
  if (typeof g[name] === 'undefined') {
    g[name] = (vue as Record<string, unknown>)[name]
  }
}

// --- Nuxt app helpers ---
if (typeof g.$fetch === 'undefined') {
  g.$fetch = vi.fn(async () => undefined)
}

if (typeof g.useNuxtApp === 'undefined') {
  g.useNuxtApp = vi.fn(() => ({
    $supabase: undefined,
    $dialog: { alert: vi.fn() }
  }))
}

if (typeof g.createError === 'undefined') {
  g.createError = (input: { statusCode?: number; statusMessage?: string } | string) => {
    const message = typeof input === 'string' ? input : input.statusMessage ?? 'error'
    const err = new Error(message) as Error & { statusCode?: number; statusMessage?: string }
    if (typeof input === 'object') {
      err.statusCode = input.statusCode
      err.statusMessage = input.statusMessage
    }
    return err
  }
}

// Minimal `useState` for composables that read it as a global auto-import.
if (typeof g.useState === 'undefined') {
  const stateStore = new Map<string, ReturnType<typeof vue.ref>>()
  g.useState = <T>(key: string, init?: () => T) => {
    if (!stateStore.has(key)) {
      stateStore.set(key, vue.ref(init ? init() : undefined))
    }
    return stateStore.get(key)
  }
}

// `usePlayerFlash` is auto-imported inside usePlayer.ts. Tests that assert on
// the flash override this with their own spy via `vi.stubGlobal`.
if (typeof g.usePlayerFlash === 'undefined') {
  g.usePlayerFlash = () => ({
    flash: vue.ref({ playerId: null, stat: null, kind: 'neutral', target: 'none', timestamp: 0 }),
    trigger: vi.fn(),
    isFlashing: vi.fn(() => false)
  })
}

// --- Nitro/h3 server auto-imports (for server/api endpoint tests) ---
if (typeof g.defineEventHandler === 'undefined') {
  g.defineEventHandler = <T>(handler: T) => handler
}

if (typeof g.readBody === 'undefined') {
  g.readBody = async (event: { body?: unknown }) => event?.body
}

if (typeof g.getRouterParam === 'undefined') {
  g.getRouterParam = (
    event: { context?: { params?: Record<string, string> } },
    name: string
  ) => event?.context?.params?.[name]
}

