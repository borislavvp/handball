# PRD: Unit Tests for Statistics Functions

## Problem

`composables/usePlayer.ts` and `composables/useStats.ts` are the only places where a
handball stat is recorded and where the percentages on the stats overview are derived.
They mutate player state, call `$fetch` to persist to the server, and recompute the
value the UI shows.

There are no tests. A small refactor — renaming a stat key, swapping `POST` for `PUT`,
or changing the assist-credit branch — can silently break the on-screen numbers
without breaking the build. Coaches only find out at the next match.

## Goal

Add a unit-test layer that pins down the contract of every statistics function in
`usePlayer.ts` and `useStats.ts`, specifically:

- Local state is updated correctly (`currentStats`, `currentShots`, `liveByMatch`,
  `player.value`, `hasTwoMinutes`).
- A request is sent to the server with the right method, path, and body.

A passing test = "this stat is marked properly".

## In Scope

- `composables/usePlayer.ts`
  - `increasePlayerStat`
  - `addShotToPlayer`
  - `computePlayerValue` (pure helper, exported)
- `composables/useStats.ts`
  - `attackValue`
  - `defenseValue`
  - `gkSavesValue`

## Out of Scope (follow-up tickets)

- **Server endpoints**: `server/api/stats.post.ts`, `stats.put.ts`, `shots.post.ts`
  hit Supabase. They silently swallow errors and deserve integration tests against
  a real or test Supabase. Separate PRD.
- **Network error handling in `usePlayer.ts`**: `$fetch` failures are not surfaced
  to the user and there is no rollback. This is a real bug; see
  "Known Issues" below.
- **Component / E2E tests**: not needed for this PRD. Add `@nuxt/test-utils` later
  if we start testing the stats panel UI.
- **Coverage thresholds** and **GitHub Actions CI**: see "Follow-up Tickets".

## Decisions (from grilling session)

| # | Decision | Choice |
|---|---|---|
| 1 | Scope | Both `usePlayer.ts` and `useStats.ts` |
| 2 | Test runner | Vitest alone (no `@nuxt/test-utils`) |
| 3 | What to assert | Local state + network call (not flash trigger, not animation) |
| 4 | Nuxt auto-import mocking | Global stubs in `tests/setup.ts`, registered as `setupFiles` |
| 5 | `$fetch` mocking | `vi.mocked($fetch).mockResolvedValue` / `vi.spyOn` |
| 6 | File layout | Co-located: `composables/usePlayer.test.ts`, `composables/useStats.test.ts` |
| 7 | Fixture strategy | `@total-typescript/shoehorn` (typed partial inputs) |
| 8 | Test runner config | `vitest.config.ts` at repo root; npm scripts `test`, `test:watch`, `test:ui`, `test:coverage` |
| 9 | Error paths | Test happy paths + `no match → return` bail only. Do NOT lock in the current silent-failure behavior. |
| 10 | CI / coverage | Defer to follow-up ticket |

## Test Matrix

### `composables/usePlayer.test.ts` — `increasePlayerStat`

1. `increments the stat in currentStats by 1`
2. `recomputes stats.value via computePlayerValue after increment`
3. `POSTs /api/stats when no liveByMatch state exists for the match`
4. `PUTs /api/stats when liveByMatch state already exists for the match`
5. `sends { matchId, playerId, statType, time } in the request body`
6. `returns early without mutating state or making a request when there is no active match`
7. `flips player.hasTwoMinutes to true when stat is 'twominutes'`

### `composables/usePlayer.test.ts` — `addShotToPlayer`

8. `appends the shot to currentMatch.data.value.shots`
9. `increments playerState.stats[shot.result] by 1`
10. `credits assistprimary to the assist player when shot.assistPrimary is set`
11. `credits assistsecondary to the assist player when shot.assistSecondary is set`
12. `flashes the mistakePlayer when shot.mistakePlayer is set`
13. `flashes the noRecoveryPlayer when shot.noRecoveryPlayer is set`
14. `POSTs /api/shots with { matchId, playerId, shot }`
15. `returns early without mutating state or making a request when there is no active match`

### `composables/usePlayer.test.ts` — `computePlayerValue` (pure)

16. `computes attack + defense as documented in the source comment`
17. `returns 0 when stats is undefined`

### `composables/useStats.test.ts` — team-level aggregation

18. `attackValue aggregates across all players with currentStats when no player is selected`
19. `defenseValue aggregates across all players with currentStats when no player is selected`
20. `gkSavesValue returns 0 when no GK has any saves`
21. `attackValue returns the selected player's own percentage when a player is selected`

(Initial scope estimate was 18; expanded to 21 after splitting team-level
aggregation into its own assertions for the three percentages.)

## File Layout

```
handball/
├── vitest.config.ts                    # NEW
├── tests/
│   ├── setup.ts                        # NEW — global stubs for useState, useNuxtApp, usePlayerFlash
│   └── fixtures.ts                     # NEW — shoehorn-based makePlayer / makeMatch / makeTeam helpers
├── composables/
│   ├── usePlayer.ts
│   ├── usePlayer.test.ts               # NEW (co-located)
│   ├── useStats.ts
│   └── useStats.test.ts                # NEW (co-located)
├── package.json                        # add scripts + @total-typescript/shoehorn dev dep
```

## Implementation Sketch

### `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    clearMocks: true,
    include: ['composables/**/*.test.ts', 'tests/**/*.test.ts'],
  },
})
```

### `tests/setup.ts`

Installs no-op stubs for Nuxt auto-imports so the composables can run in plain Node.

- `globalThis.useState = (key, init) => ref(init())`
- `globalThis.useNuxtApp = () => ({ $fetch: vi.fn(), $dialog: { alert: vi.fn() } })`
- `globalThis.usePlayerFlash = () => ({ trigger: vi.fn() })`
- `globalThis.computed = computed` (re-export from `vue` to keep the import surface identical)
- `globalThis.ref = ref` (same)

`clearMocks: true` in the config resets `vi.fn()`s between tests.

### `tests/fixtures.ts`

Uses `@total-typescript/shoehorn` to build partially-typed fixtures. Example:

```ts
import { make } from '@total-typescript/shoehorn'
import type { Player, Match, Team } from '~/types/handball'

export const makePlayer = (overrides: Partial<Player> = {}) =>
  make<Player>({
    id: 1,
    name: 'Test Player',
    number: 7,
    position: 'CB',
    recentStats: [],
    hasTwoMinutes: false,
    hasCard: null,
    liveByMatch: {},
    ...overrides,
  })

// makeMatch, makeTeam, makeActiveMatch follow the same pattern
```

### Test example

```ts
it('PUTs /api/stats when liveByMatch state already exists', () => {
  const player = makePlayer({ liveByMatch: { 99: { stats: makePlayerStats(), shots: [] } } })
  const match = makeActiveMatch({ id: 99 })
  // ... wire stubs so usePlayer({ ..., currentMatch: match }) returns the player

  increasePlayerStat(player, 'defense')

  expect($fetch).toHaveBeenCalledWith('/api/stats', {
    method: 'PUT',
    body: { matchId: 99, playerId: 1, statType: 'defense', time: expect.any(String) },
  })
  expect(player.currentStats?.defense).toBe(1)
})
```

## Acceptance Criteria

- `pnpm test` runs all 21 tests in <2s.
- All tests pass on the `main` branch after the change is merged.
- No new file in `composables/` or `server/` is added without a co-located test (process change, not enforced by tooling).
- A refactor of any of the 4 functions in scope that breaks local-state or
  `$fetch` behavior fails at least one of these tests.

## Known Issues (called out, not fixed in this PRD)

- `increasePlayerStat` and `addShotToPlayer` call `$fetch` with no `.catch` and no
  rollback. If the network is down, the local stat is incremented, the UI shows
  the increment, but the database never receives it. A user retrying the action
  will create a duplicate.
- `server/api/stats.post.ts` and `stats.put.ts` both fire a `match_event` insert
  without `await` and ignore the result. If that insert fails, the event log
  silently diverges from `player_stats`.
- Both of the above are testable in this layer once we decide on a contract for
  error UX. Tracked as separate follow-up tickets.

## Follow-up Tickets (out of scope for this PRD)

1. **Server-side integration tests** for `server/api/stats.*` and `server/api/shots.post.ts` against a Supabase test instance.
2. **Surface `$fetch` failures to the user** with a toast and a "retry" / "rollback" affordance, then add tests that assert the new error contract.
3. **Add `vitest --coverage` with thresholds** (e.g. `lines: 80, functions: 80` on `composables/usePlayer.ts`) once we have a stable baseline.
4. **Add a GitHub Actions workflow** at `.github/workflows/test.yml` that runs `pnpm test` on push and PR.

## Codebase Bug Audit (added after grilling)

Findings from a read-only pass over `composables/usePlayer.ts`, `composables/useStats.ts`,
`server/api/stats.*`, `server/api/shots.post.ts`, `server/api/match/events/[id].put.ts`,
`server/utils/matchEventStats.ts`, and `pages/matches/active.vue`. Bugs are grouped by
severity and listed with the smallest reproducible scenario. None are fixed in this PRD —
they are tickets.

### Critical (data loss / data corruption)

**B1 — Duplicate assist credit on a fast-break 1-1 Win shot.**
- `pages/matches/active.vue:337-347` calls `increasePlayerStat(player, '1on1win')` for
  the shooter, and the server in `server/api/shots.post.ts:64-69` then also
  `increment_match_score('score')` for the goal. But the server doesn't increment
  `1on1win` from the shot — that's only done by `incrementOrCreateStat` for the shooter's
  `result`, and the result is `goal` (or `goal_empty`), not `1on1win`. So the `1on1win`
  counter is incremented **client-side only** via `increasePlayerStat` and
  `$fetch('/api/stats', { method: 'PUT' or 'POST', body: { statType: '1on1win' } })`.
  The shot body itself never carries a `1on1win` flag. The server then doesn't know
  that the goal was a 1-1 win.
  Consequence: in the post-match editor, the "breakthrough" / "1-1 won" toggle on a
  shot is purely cosmetic. The stat counter is correct only because the client also
  calls `increasePlayerStat` directly, so we have a working but fragile duplicate code
  path.
- Repro: pick a field player, mark `Ctrl+I` (1-1 WON), `Ctrl+G`. `currentStats.1on1win`
  goes up by 1 in the UI. Reload the page — the persisted value is whatever the
  server stored for the player, which does NOT include the breakthrough flag, so
  `PlayerPerformanceChart` may show a 1-1 won goal without the breakthrough label.

**B2 — `incrementPlayerStat` always fires `match_event` insert with the wrong shape.**
- `server/api/stats.post.ts:20-27` inserts a `match_event` row with `event: statType`
  and no `metadata` and no `playerid`-on-event-link. The
  `server/utils/matchEventStats.ts` `incrementPlayerStat` path used by
  `events/[id].put.ts` (which IS the only path used by the editor) does NOT insert a
  match event. So the same logical "increase stat" creates a `match_event` row from
  the live match client but NOT from the post-match editor — and the live path
  inserts it without `await` and without error handling, so a failure is invisible
  while a successful insert still creates an event row that the editor doesn't know
  how to read (`metadata` is missing).
- Repro: trigger a `Shift+D` (defense) live, then open the post-match editor. The
  editor lists `match_event` rows. The live-defense row will appear with
  `event = 'defense'` but no `metadata` and no shot id, so the editor's "is this a
  shot?" check (`isShotResult` in `matchEventStats.ts:61`) returns `false`, but the
  "this is a stat" code path (decrement stat on save) will still try to
  `decrementPlayerStat` because it uses `existing.event` directly. The `decrement`
  then either succeeds against a stat the editor already-incremented (double
  bookkeeping) or fails silently.

**B3 — `shots.post.ts` `incrementOrCreateStat` ignores the response of the SELECT and
the insert.**
- `server/api/shots.post.ts:5-25`: the SELECT at line 6 doesn't `await` error
  handling — it checks `if (data)` and the `error` is never checked, then the inner
  insert/RPC also doesn't check errors. If the SELECT returns `data: null` AND
  `error` is set, we go to the `else` branch and insert a new row, creating a
  duplicate `player_stats` row on retry.
- Repro: kill the Supabase connection for one tick, fire a shot, retry. The first
  call returns an error, the second call inserts a brand-new `player_stats` row
  instead of incrementing — same shot counted twice on the player.

### High (silent data divergence)

**B4 — `currentShots` may include the in-flight shot during the POST.**
- `composables/usePlayer.ts:154` pushes the shot to `playerState.shots` BEFORE the
  `match_event` insert and the `$fetch('/api/shots', ...)` resolve. If the POST
  fails, the in-memory state has the shot but the DB doesn't, and there is no
  rollback. The same pattern is true for `currentMatch.data.value.shots.push(shot)`
  on line 190.
- Repro: take a shot on a player when offline. The shot is visible in the UI, the
  goal counter ticks, the assist tile flashes — but `shots` table in Supabase has
  no row. On refresh the shot is gone from the player's shot list.

**B5 — `shots.post.ts` `gkmiss`/`goal` increments `match_score` but
`active.vue:fireShot` ALSO calls `activeMatch.increaseMatchScore` client-side.**
- `pages/matches/active.vue:358-362` calls `activeMatch.increaseMatchScore("home")`
  for a goal. Then `addShotToPlayer` POSTs to `/api/shots`, which in
  `server/api/shots.post.ts:64-69` calls `increment_match_score('score')`. That's a
  double increment on the server. The client `increaseMatchScore` updates the
  in-memory match score; the server-side RPC also bumps the DB row. On a refresh,
  the score jumps to +2 for one goal.
- Repro: score a goal, refresh the page. The score is 2 higher than expected.

**B6 — `assistPrimary` on a `gksave` / `gkmiss` is silently credited to the
defending team.**
- `composables/usePlayer.ts:159-178` doesn't gate assist crediting on
  `shot.result === 'goal'`. The shot type `Shot` has `assistPrimary` as a
  `number | null`, and the server (`server/utils/matchEventStats.ts:128`) will
  increment `assistprimary` for whatever id is in the field, regardless of whether
  the shot was a save / miss / goal_empty. In the UI, the assist tile flashes for
  the wrong reason, and a defender can rack up `assistprimary` by being assigned to
  a goal-against event.
- Repro: GK is selected, user accidentally still has `primaryAssist` set from a
  previous play, fires a `gksave`. The previous-assist player gets an `assistprimary`
  credited in `currentStats` AND in the DB.

**B7 — `decrementShotStats` decrements the SAME players as the new shot, not the
previous shot's players, in the put-events path.**
- `server/api/match/events/[id].put.ts:139-149` correctly pulls `previousShot` and
  passes its `assistPrimary`/`assistSecondary` to `decrementShotStats`. But on
  line 122-137 it updates the `match_event` row's `playerid` to the NEW body, and
  THEN decrements the previous shot's stats (against the previous shot's playerid
  — but `decrementPlayerStat(existing.matchid, existing.playerid, existing.event)`
  on line 148 uses `existing.playerid`, not the body's playerId). So the
  `match_event` row's `playerid` is updated to the new player, but the stat
  decrement runs against the OLD player. On an edit that changes the playerid,
  this leaves a dangling stat on the new player (incrementShotStats increments
  them) without the corresponding decrement against the old player.
- Repro: in the post-match editor, change the player on a `goal` event from
  player A to player B. Save. Player A's `goal` stays incremented. Player B
  gains a goal. The stat never moved; it duplicated.

**B8 — `assistPrimary` and `assistSecondary` from `previousShot` are read with
wrong column casing in the put endpoint.**
- `server/api/match/events/[id].put.ts:142-143` reads `previousShot.assistPrimary`
  and `previousShot.assistSecondary` (camelCase). Supabase returns column names
  as stored in the database. The shot insert on `server/api/shots.post.ts:48-49`
  uses camelCase keys in the payload: `assistPrimary: ...`. So this works BY
  ACCIDENT because Supabase preserves the column name in the response. But the
  `shots` table migration (see `supabase/migrations/20250328100000_init_schema.sql`
  search for `assistPrimary`) — needs verification. If the DB columns are
  snake_case (`assist_primary`) the camelCase access returns `undefined`, and
  `incrementOrCreateStat`/`decrementShotStats` will be called with `undefined` for
  the assist ids, which it handles by no-op (the `if (!playerId || !stat)` early
  return on line 88 of `matchEventStats.ts`). Net effect: assists are silently
  lost on every edit.

**B9 — `useStats` team-level `attackValue` is a percentage, not a raw attack count,
so adding it to the `StatsOverview` header bars shows "%" without any visual cue.
- The fix in this same session made `computeTeamAttackValue` return `Math.round((positive / (positive + negative)) * 100)`. That's a percentage 0-100. The
  individual-player `computeAttackValue` in `useStats.ts:100-110` does the same.
  But the per-player `computePlayerValue` in `usePlayer.ts:239-244` returns a
  raw NET score (goals minus misses etc.) — a number that can be 5, -3, 12. So
  the team-level "attack" stat bar is on a different scale than the per-player
  value badge on the tile. A coach comparing "Attack" of the team (0-100%) to a
  player's badge (raw points) gets nonsense.
- Repro: open the stats panel with no player selected. The Attack bar shows e.g.
  67%. Open the same panel with player #7 selected. The Attack bar shows 67%
  too, but the player's value badge on the tile might be +5. The "value" badge
  on the tile and the "Attack" bar in the panel measure different things but
  look the same to a coach.

### Medium (subtle data flow / UX bugs)

**B10 — `currentShots` is set to `state.shots` (a reference), not a copy.**
- `composables/usePlayer.ts:64` does `player.currentShots = state.shots` — same
  array reference. Any consumer that mutates `currentShots` (e.g. `.sort()`,
  `.filter()` is fine but `.push`/`.splice` is not) mutates the live state.
  This is a footgun for any future code.
- Repro: a developer writes `player.currentShots?.sort()` somewhere — `liveByMatch`
  is corrupted in place.

**B11 — `getActiveMatchId` returns `number | undefined` but the function signature
says it returns `number`.**
- `composables/usePlayer.ts:14-16` signature is implicit; the return type is
  `number | undefined` because of the optional chain. Callers do `if (!matchId)
  return;` so it works, but TypeScript can't enforce the contract.

**B12 — `active.vue:fireShot` doesn't check `shotBuilder.shootingArea`/`Target`
separately from the `confirmShot` wrapper.**
- `fireShot` (line 331) is also called by the keyboard shortcuts `Ctrl+G`,
  `Ctrl+M`, `Ctrl+S`, `Ctrl+H` (registered in `registerKeymap` at line 581-583)
  which call `confirmShot` first — fine. But `fireShot` itself doesn't validate
  the inputs; if anyone calls it directly in the future with a null area, the
  shot is created with `from: undefined` and `to: null` (because of
  `shotBuilder.shootingArea.value!` non-null assertions on lines 364-365). The
  non-null assertion masks the type error at runtime.
- Repro: call `fireShot('goal')` from a code path that doesn't go through
  `confirmShot`. The shot is sent to the server with `from: undefined` and `to:
  null`. The `shots` table accepts them as NULLs; the post-match editor later
  shows the shot as "(no area)" with a "pick area" prompt.

**B13 — The 1-1 WIN client-side increment and the goal-side `breakthrough` flag are
out of sync on a goal-against.**
- `pages/matches/active.vue:370-372` sets `breakthrough` for a goal based on
  `oneOnOneLost` (when GK is selected). For a field player,
  `breakthrough: shotBuilder.oneOnOneWin.value`. But on a `gkmiss` (line 358-359)
  the score is incremented for the opponent; the `breakthrough` flag is set when
  the OPPONENT broke through 1-on-1, not when OUR GK did. So `breakthrough` on a
  `gkmiss` reads as "our team broke through" in any downstream UI that interprets
  the flag semantically.

**B14 — `usePlayer` does not invalidate the `usePlayerFlash` state when a stat
is decremented (post-match editor).**
- The post-match editor can decrement a stat (via the put endpoint). The
  composable never receives a "this stat was decremented" message, so the
  flash animation only fires on increments. A coach who corrects a wrong stat
  sees the count change but no feedback that the change took effect.

**B15 — `StatsOptions.vue` watcher at lines 473-480 resets `noRecovery.value`
whenever the selected player changes. The reset is correct, but it does NOT
clear `noRecoveryPlayer`. So if the user is in the middle of selecting a
no-rebound player and clicks a different player, the `noRecoveryPlayer` from
the previous flow stays set in the store. The `mistakePlayer` and assists are
cleared by `clearSelection` (called after a shot is added), but the
no-recovery path doesn't call `clearSelection` until a shot is fired.
- Repro: GK is selected. Click "NO RCV" checkbox. Click player X (becomes
  `noRecoveryPlayer`). Click player Y (becomes selected `player`). The
  `noRecovery` flag is now `false` (watcher reset) but `noRecoveryPlayer`
  still references player X. Now fire a shot — the shot is sent with
  `noRecovery: false` but `noRecoveryPlayer: playerX.id`. The server-side
  `incrementShotStats` doesn't gate on `shot.noRecovery`, so player X's
  `norebound` stat is incremented anyway (see B6 for the same issue on
  assists). Net: a player is "marked" with norebound even though the toggle
  is off.

**B16 — `incrementOrCreateStat` in `shots.post.ts` is called without `await` in
`server/api/shots.post.ts:80-86`. The handler returns after kicking off the
increments, and the client gets a successful response before the stats are
written. A retry from the client creates a duplicate shot row but
`incrementOrCreateStat` will correctly increment on the second call (since
the SELECT finds the existing row), so the shot is counted twice.
- Repro: client gets a 5xx response (timeout) and retries. The DB now has 2
  `shots` rows but only 1 stat increment for the result. The 2nd stat
  increment is queued by the retry but the client thinks the first call
  failed, so the UI is in a weird state.

### Low (style / minor)

**B17 — `composables/usePlayer.ts:130` uses `alert(...)` instead of the Nuxt UI
dialog (`$dialog.alert`). Inconsistent with the rest of the app.**

**B18 — `removePlayer` (line 138) doesn't remove the player from any active
match's `twoMinutesHome`/`twoMinutesAway` arrays. If a player is removed while
a 2-min is active, the 2-min countdown still references a deleted player.**

**B19 — `useStats.ts:80-87` `computeAttackValue` divides by zero implicitly
when `positive + negative === 0` — returns 0 correctly, but the per-player
case passes `selection.player.value.currentStats!` (non-null assertion). If
the player has `currentStats === undefined` (initial state), the function
returns `-1` which is then displayed as `-1%` on the stat bar. The component
in `StatsOverview.vue:5` doesn't guard against this.
- Repro: select a player who has never had a stat, then open the stats panel.
  The Attack bar shows `-1%`.

**B20 — `composables/usePlayer.ts:155` does
`playerState.stats[shot.result] += 1`. The `shot.result` is typed as
`ShootingResult`, but `playerState.stats` is keyed by `Stats`. `ShootingResult`
is a subset of `Stats` (see `types/handball.ts:114-121` vs `133-159`), so
this is sound — but TypeScript won't catch a future change that adds a
`ShootingResult` value not present in `Stats`. No runtime guard.

