# CLAUDE.md

Handball Stats — a Nuxt 4 PWA for recording live handball match statistics (shots,
goals, defense actions, goalkeeper saves, 2-minute suspensions) and rendering
per-player / per-match analytics and PDF reports. Built for in-game use by coaches,
hence the landscape-locked PWA and keyboard-shortcut-driven stat entry.

## Commands

Package manager is **pnpm** (see `pnpm-workspace.yaml`, `pnpm-lock.yaml`).

```bash
pnpm install          # install deps (runs `nuxt prepare` via postinstall)
pnpm dev              # dev server on http://localhost:3000
pnpm build            # production build
pnpm generate         # static generation
pnpm preview          # preview production build
```

There is no test runner wired up yet. `prd.md` specifies adding **Vitest** with
co-located `*.test.ts` files and `tests/setup.ts` global stubs; the current branch is
`tests`. If you add tests, follow the decisions table in `prd.md` (Vitest alone, no
`@nuxt/test-utils`, assert local state + network call).

There is no separate lint/typecheck script. ESLint (`.eslintrc.js`,
`@nuxt/eslint-config` + Prettier) and Prettier (`.prettierrc.cjs`: no trailing comma,
avoid arrow parens) govern style.

## Architecture

**Stack:** Nuxt 4 + Vue 3 (`<script setup>`), TypeScript, Tailwind CSS v4
(`@tailwindcss/postcss`), `@nuxt/ui`, Supabase (Postgres) as the backend, PDFKit +
Puppeteer for report generation, ApexCharts for charts, `@vite-pwa/nuxt` for the PWA.

**State — composables, not a store library.** A single root store object is built by
`createHandballStore()` in `composables/useHandballStore.ts`, `provide`d once and
pulled anywhere via `useHandballStore()`. It composes feature composables:
`useTeam`, `useMatch`, `usePlayer`, `useStats`, `useSelection`, `useLoading`. Shared
reactive state uses Nuxt's `useState`. Prefer extending an existing composable over
adding global state elsewhere.

**Stat recording flow (the core of the app):** `composables/usePlayer.ts` and
`composables/useStats.ts` are where a stat is recorded. They (1) mutate local reactive
player state (`currentStats`, `currentShots`, `liveByMatch`, `hasTwoMinutes`) and
(2) `$fetch` a `server/api/*` endpoint to persist. The on-screen percentages are
derived from this same local state, so a key rename or method swap can silently break
the displayed numbers — treat these two files as the contract (this is exactly what
`prd.md` exists to pin down).

**Live match entry:** `pages/matches/active.vue` is the in-game screen.
`useShotBuilder`, `useStatsPanel`, `useKeymap` + `useKeyboardShortcuts`,
`useModifierState`, and `usePlayerOrder` drive keyboard-first stat entry (chips on
tiles, modifier keys, sub-menus). `components/game/` holds the court/goal/shooting
widgets; `components/match/` holds the analytics tabs (shooting heatmap, GK, defense,
summary).

**Server:** `server/api/**` are Nitro endpoints that talk to Supabase via
`server/utils/databaseClient.ts` (uses the service-role key). PDF generation lives in
`shared/pdf/` and `server/api/match/pdf.post.ts`.

**Database:** Supabase. Schema and seed data are versioned in
`supabase/migrations/`. Generated types live in `types/database.types.ts` (and a
duplicate at repo-root `database.types.ts`); domain types in `types/handball.ts`.

## Conventions

- Components are organized by area: `components/game/`, `components/match/`,
  `components/layout/`, `components/shared/`, plus `components/utils/` for small TS
  helpers. Match existing patterns within the relevant folder.
- Auto-imports: Nuxt auto-imports `composables/`, `components/`, and Vue/Nuxt APIs.
  Import `computed`, `ref`, etc. from `vue` (not `nuxt/app`) — see git history for a
  fix where this mattered.
- Domain vocabulary lives in `types/handball.ts`: attack positions (LW/LB/CB/RB/RW/PV),
  defense positions (D1–D6/GK), `DefenseSystem` (6:0, 5:1, 3:2:1, 4:2, 1:1),
  `ShootingArea`, `Shot`, `Player`, `Match`, `ActiveMatchData`.
- Config & secrets via `runtimeConfig` in `nuxt.config.ts`; `.env` holds
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BASE_URL`.

## Reference

- `prd.md` — current spec for the statistics-function unit-test layer.
- `docs/features/` — feature notes (keyboard shortcuts, GK save/no-rebound stat,
  marking efficiency).
