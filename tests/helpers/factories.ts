import { vi } from 'vitest'
import { ref, computed } from 'vue'
import type { ComputedRef } from 'vue'
import type { Match, Player, Position, Shot, ShootingResult, Team } from '~/types/handball'
import { ShootingTarget } from '~/types/handball'
import type { ActiveMatch } from '~/composables/useActiveMatch'
import type { ActiveMatchData } from '~/types/handball'
import type { LoadingState } from '~/composables/useLoading'

let nextId = 1
export const resetIds = () => {
  nextId = 1
}

export function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: overrides.id ?? nextId++,
    name: overrides.name ?? `Player ${nextId}`,
    number: overrides.number ?? nextId,
    position: (overrides.position ?? 'CB') as Position['key'],
    currentShots: overrides.currentShots ?? [],
    currentStats: overrides.currentStats,
    liveByMatch: overrides.liveByMatch ?? {},
    recentStats: overrides.recentStats ?? [],
    hasTwoMinutes: overrides.hasTwoMinutes ?? false,
    hasCard: overrides.hasCard ?? null
  }
}

export function makeTeam(players: Player[], overrides: Partial<Team> = {}): Team {
  return {
    id: overrides.id ?? 100,
    name: overrides.name ?? 'Home',
    players
  }
}

export function makeShot(overrides: Partial<Shot> = {}): Shot {
  return {
    assistPrimary: overrides.assistPrimary ?? null,
    assistSecondary: overrides.assistSecondary ?? null,
    mistakePlayer: overrides.mistakePlayer ?? null,
    fastbreak: overrides.fastbreak ?? false,
    breakthrough: overrides.breakthrough ?? false,
    from: overrides.from ?? 'CB9',
    matchid: overrides.matchid ?? 1,
    playerid: overrides.playerid ?? 1,
    result: (overrides.result ?? 'goal') as ShootingResult,
    time: overrides.time ?? '10:00',
    to: overrides.to ?? ShootingTarget.GOAL_MIDDLE_MIDDLE,
    noRecovery: overrides.noRecovery ?? null,
    noRecoveryPlayer: overrides.noRecoveryPlayer ?? null
  }
}

export type MatchEventRow = {
  created_at: string
  event: string
  id: number
  matchid: number
  metadata: string | null
  playerid: number | null
  time: string
}

export function makeMatchEvent(overrides: Partial<MatchEventRow> = {}): MatchEventRow {
  return {
    created_at: overrides.created_at ?? '2026-01-01T00:00:00Z',
    event: overrides.event ?? 'goal',
    id: overrides.id ?? nextId++,
    matchid: overrides.matchid ?? 1,
    metadata: overrides.metadata ?? null,
    playerid: overrides.playerid ?? null,
    time: overrides.time ?? '10:00'
  }
}

export function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: overrides.id ?? 1,
    opponent: overrides.opponent ?? 'Opponent',
    teamid: overrides.teamid ?? 100,
    result: overrides.result ?? null,
    score: overrides.score ?? 0,
    opponentScore: overrides.opponentScore ?? 0,
    timeoutsLeftHome: overrides.timeoutsLeftHome ?? 3,
    timeoutsLeftAway: overrides.timeoutsLeftAway ?? 3,
    shots: overrides.shots ?? []
  }
}

/**
 * Minimal stand-in for the `ActiveMatch` returned by `useActiveMatch`. Only the
 * bits read by usePlayer / StatsOptions are implemented.
 */
export function makeActiveMatch(overrides: Partial<ActiveMatchData> = {}) {
  const data = ref<ActiveMatchData>({
    ...makeMatch(),
    time: '10:00',
    playing: false,
    defenseSystem: '6:0',
    opponentDefenseSystem: '6:0',
    emptyGoalHome: false,
    emptyGoalAway: false,
    twoMinutesHome: [],
    twoMinutesAway: [],
    ...overrides
  })

  const increaseMatchScore = vi.fn((team: 'home' | 'away') => {
    if (team === 'home') data.value.score += 1
    else data.value.opponentScore += 1
  })
  const addTwoMinute = vi.fn()

  return {
    data,
    increaseMatchScore,
    addTwoMinute
  } as unknown as ActiveMatch & {
    data: typeof data
    increaseMatchScore: typeof increaseMatchScore
    addTwoMinute: typeof addTwoMinute
  }
}

export function makeLoadingState(): LoadingState {
  return {
    loading: ref(false),
    fetching: ref(false)
  } as unknown as LoadingState
}

/** Wires the args usePlayer() expects, exposing the refs for assertions. */
export function makePlayerDeps(players: Player[], activeMatch = makeActiveMatch()) {
  const team = makeTeam(players)
  const teamRef = computed(() => team) as ComputedRef<Team | undefined>
  const matchRef = computed(() => activeMatch) as unknown as ComputedRef<ActiveMatch | null>
  return {
    team,
    teamRef,
    activeMatch,
    matchRef,
    loadingState: makeLoadingState()
  }
}
