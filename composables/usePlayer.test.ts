import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { computePlayerValue, usePlayer } from './usePlayer'
import type { UndoEntry } from './useUndo'
import type { PlayerCurrentStats, Stats, Team } from '~/types/handball'
import {
  makeActiveMatch,
  makeLoadingState,
  makePlayer,
  makePlayerDeps,
  makeShot,
  makeTeam,
  resetIds
} from '~/tests/helpers/factories'

// usePlayer.ts auto-imports usePlayerFlash, which needs a live Nuxt runtime.
// Mock the module so the recording functions run in plain node.
const { triggerSpy } = vi.hoisted(() => ({ triggerSpy: vi.fn() }))
vi.mock('~/composables/usePlayerFlash', () => ({
  usePlayerFlash: () => ({
    trigger: triggerSpy,
    isFlashing: () => false,
    flash: { value: {} }
  })
}))

const freshStats = (): PlayerCurrentStats => {
  const deps = makePlayerDeps([makePlayer()])
  return usePlayer(deps.loadingState, deps.teamRef, deps.matchRef).initPlayerStats()
}

describe('computePlayerValue', () => {
  // The single source of truth for "one button press changes value by N".
  const deltas: Array<[Stats, number]> = [
    // attack positives
    ['goal', 1],
    ['goal_empty', 1],
    ['assistprimary', 1],
    ['assistsecondary', 1],
    ['provokeCard', 1],
    ['provokePenalty', 1],
    ['provokeTwoMin', 1],
    ['1on1win', 1],
    // attack negatives
    ['miss', -1],
    ['lostball', -1],
    // defense positives
    ['steal', 1],
    ['block', 1],
    ['defense', 1],
    ['defensex2', 1],
    // defense negatives
    ['1on1lost', -1],
    ['penaltymade', -1],
    ['norebound', -1],
    ['twominutes', -1],
    ['redcard', -1],
    ['bluecard', -1],
    // intentionally NOT part of player value
    ['yellowcard', 0], // a yellow card is a warning, not a disqualification
    ['gksave', 0], // feeds save %, not field value
    ['gkmiss', 0],
    ['gkmiss_empty', 0]
  ]

  it.each(deltas)('a single %s changes value by %d', (stat, delta) => {
    const stats = freshStats()
    stats[stat] += 1
    expect(computePlayerValue(makePlayer(), stats)).toBe(delta)
  })

  it('writes the computed value back onto the stats object', () => {
    const stats = freshStats()
    stats.goal += 1
    stats.steal += 1
    computePlayerValue(makePlayer(), stats)
    expect(stats.value).toBe(2)
  })

  it('sums a realistic mixed line: 3 goals, 1 miss, 2 assists, 1 lost ball, 2 defense, 1 two-min', () => {
    const stats = freshStats()
    stats.goal = 3
    stats.miss = 1
    stats.assistprimary = 2
    stats.lostball = 1
    stats.defense = 2
    stats.twominutes = 1
    // attack = (3 + 0 + 0 - 1) + ((2) - 1) = 2 + 1 = 3
    // defense = (0 + 0 + 2 + 0) - 0 - 0 - 0 - 1 - 0 - 0 = 1
    expect(computePlayerValue(makePlayer(), stats)).toBe(4)
  })

  it('returns 0 for an all-zero line', () => {
    expect(computePlayerValue(makePlayer(), freshStats())).toBe(0)
  })

  it('guards against a missing stats object', () => {
    expect(computePlayerValue(makePlayer(), undefined as unknown as PlayerCurrentStats)).toBe(0)
  })
})

describe('usePlayer.initPlayerStats', () => {
  it('initialises every stat used by computePlayerValue to 0 (no NaN leakage)', () => {
    const stats = freshStats()
    const value = computePlayerValue(makePlayer(), stats)
    expect(Number.isNaN(value)).toBe(false)
  })
})

// --- Layer 2: each recording call fires the right API call + updates value ---

const fetchMock = vi.fn()

beforeEach(() => {
  resetIds()
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(undefined)
  vi.stubGlobal('$fetch', fetchMock)
  triggerSpy.mockReset()
})

const setup = () => {
  const player = makePlayer({ id: 7 })
  const deps = makePlayerDeps([player])
  const api = usePlayer(deps.loadingState, deps.teamRef, deps.matchRef)
  return { player, deps, api }
}

describe('increasePlayerStat', () => {
  const valueDeltas: Array<[Stats, number]> = [
    ['goal', 1],
    ['goal_empty', 1],
    ['assistprimary', 1],
    ['assistsecondary', 1],
    ['provokeCard', 1],
    ['provokePenalty', 1],
    ['provokeTwoMin', 1],
    ['1on1win', 1],
    ['miss', -1],
    ['lostball', -1],
    ['steal', 1],
    ['block', 1],
    ['defense', 1],
    ['defensex2', 1],
    ['1on1lost', -1],
    ['penaltymade', -1],
    ['norebound', -1],
    ['twominutes', -1],
    ['redcard', -1],
    ['bluecard', -1],
    ['yellowcard', 0]
  ]

  it.each(valueDeltas)(
    '%s: POSTs /api/stats once and moves value by %d',
    (stat, delta) => {
      const { player, api } = setup()
      api.increasePlayerStat(player, stat)

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith('/api/stats', {
        method: 'POST',
        body: { matchId: 1, playerId: 7, statType: stat, time: '10:00' }
      })
      expect(player.currentStats?.[stat]).toBe(1)
      expect(player.currentStats?.value).toBe(delta)
    }
  )

  it('uses POST the first time and PUT once match state already exists', () => {
    const { player, api } = setup()

    api.increasePlayerStat(player, 'defense')
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ method: 'POST' })

    api.increasePlayerStat(player, 'steal')
    expect(fetchMock.mock.calls[1]![1]).toMatchObject({ method: 'PUT' })
    expect(fetchMock.mock.calls[1]![1]).toMatchObject({
      body: { matchId: 1, playerId: 7, statType: 'steal', time: '10:00' }
    })
  })

  it('sets hasTwoMinutes when recording a suspension', () => {
    const { player, api } = setup()
    api.increasePlayerStat(player, 'twominutes')
    expect(player.hasTwoMinutes).toBe(true)
  })

  it('triggers a value flash for the player', () => {
    const { player, api } = setup()
    api.increasePlayerStat(player, 'defense')
    expect(triggerSpy).toHaveBeenCalledWith(7, 'defense', { target: 'value' })
  })

  it('bails out without an API call when there is no active match', () => {
    const player = makePlayer()
    const team = makeTeam([player])
    const api = usePlayer(
      makeLoadingState(),
      computed(() => team) as unknown as Parameters<typeof usePlayer>[1],
      computed(() => null) as unknown as Parameters<typeof usePlayer>[2]
    )
    api.increasePlayerStat(player, 'goal')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(player.currentStats).toBeUndefined()
  })
})

describe('addShotToPlayer', () => {
  const setupShot = () => {
    const shooter = makePlayer({ id: 1 })
    const primary = makePlayer({ id: 2 })
    const secondary = makePlayer({ id: 3 })
    const activeMatch = makeActiveMatch()
    const team = makeTeam([shooter, primary, secondary])
    const api = usePlayer(
      makeLoadingState(),
      computed(() => team) as unknown as Parameters<typeof usePlayer>[1],
      computed(() => activeMatch) as unknown as Parameters<typeof usePlayer>[2]
    )
    return { shooter, primary, secondary, activeMatch, api }
  }

  it('POSTs /api/shots once with the shot, and records goal + value', () => {
    const { shooter, api } = setupShot()
    const shot = makeShot({ result: 'goal', playerid: 1 })
    api.addShotToPlayer(shooter, shot)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/shots', {
      method: 'POST',
      body: { matchId: 1, playerId: 1, shot }
    })
    expect(shooter.currentStats?.goal).toBe(1)
    expect(shooter.currentStats?.value).toBe(1)
    expect(shooter.currentShots).toContain(shot)
  })

  it('pushes the shot onto the active match', () => {
    const { shooter, activeMatch, api } = setupShot()
    const shot = makeShot({ result: 'miss', playerid: 1 })
    api.addShotToPlayer(shooter, shot)
    expect(activeMatch.data.value.shots).toContainEqual(shot)
  })

  it('credits the primary and secondary assist players (value +1 each) without extra API calls', () => {
    const { shooter, primary, secondary, api } = setupShot()
    const shot = makeShot({ result: 'goal', playerid: 1, assistPrimary: 2, assistSecondary: 3 })
    api.addShotToPlayer(shooter, shot)

    expect(primary.currentStats?.assistprimary).toBe(1)
    expect(primary.currentStats?.value).toBe(1)
    expect(secondary.currentStats?.assistsecondary).toBe(1)
    expect(secondary.currentStats?.value).toBe(1)
    // only the shot itself is persisted; assist increments happen server-side
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('flashes the saves target (not value) for a goalkeeper save', () => {
    const { shooter, api } = setupShot()
    api.addShotToPlayer(shooter, makeShot({ result: 'gksave', playerid: 1 }))
    expect(triggerSpy).toHaveBeenCalledWith(1, 'gksave', { target: 'saves' })
  })

  it('bails out without an API call when there is no active match', () => {
    const shooter = makePlayer({ id: 1 })
    const team = makeTeam([shooter])
    const api = usePlayer(
      makeLoadingState(),
      computed(() => team) as unknown as Parameters<typeof usePlayer>[1],
      computed(() => null) as unknown as Parameters<typeof usePlayer>[2]
    )
    api.addShotToPlayer(shooter, makeShot({ result: 'goal' }))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('increments the scoreboard itself (goal -> home, gkmiss -> away)', () => {
    const { shooter, activeMatch, api } = setupShot()
    api.addShotToPlayer(shooter, makeShot({ result: 'goal', playerid: 1 }))
    expect(activeMatch.increaseMatchScore).toHaveBeenCalledWith('home')
    expect(activeMatch.data.value.score).toBe(1)

    api.addShotToPlayer(shooter, makeShot({ result: 'gkmiss', playerid: 1 }))
    expect(activeMatch.increaseMatchScore).toHaveBeenCalledWith('away')
    expect(activeMatch.data.value.opponentScore).toBe(1)
  })
})

describe('undo recording', () => {
  const collector = () => {
    const entries: UndoEntry[] = []
    return { entries, record: (e: UndoEntry) => entries.push(e) }
  }

  beforeEach(() => {
    resetIds()
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ eventId: 1 })
    vi.stubGlobal('$fetch', fetchMock)
    triggerSpy.mockReset()
  })

  it('records a stat entry whose revert decrements the stat and value', () => {
    const { entries, record } = collector()
    const player = makePlayer({ id: 7 })
    const deps = makePlayerDeps([player])
    const api = usePlayer(deps.loadingState, deps.teamRef, deps.matchRef, record)

    api.increasePlayerStat(player, 'defense')
    expect(player.currentStats?.value).toBe(1)
    expect(entries).toHaveLength(1)

    entries[0]!.revert()
    expect(player.currentStats?.defense).toBe(0)
    expect(player.currentStats?.value).toBe(0)
  })

  it('twominutes revert clears hasTwoMinutes', () => {
    const { entries, record } = collector()
    const player = makePlayer({ id: 7 })
    const deps = makePlayerDeps([player])
    const api = usePlayer(deps.loadingState, deps.teamRef, deps.matchRef, record)

    api.increasePlayerStat(player, 'twominutes')
    expect(player.hasTwoMinutes).toBe(true)
    entries[0]!.revert()
    expect(player.hasTwoMinutes).toBe(false)
  })

  it('reverts a shot: removes it, decrements the stat, rolls back the score and assist', () => {
    const { entries, record } = collector()
    const shooter = makePlayer({ id: 1 })
    const assist = makePlayer({ id: 2 })
    const activeMatch = makeActiveMatch()
    const team = makeTeam([shooter, assist])
    const api = usePlayer(
      makeLoadingState(),
      computed(() => team) as unknown as Parameters<typeof usePlayer>[1],
      computed(() => activeMatch) as unknown as Parameters<typeof usePlayer>[2],
      record
    )

    api.addShotToPlayer(shooter, makeShot({ result: 'goal', playerid: 1, assistPrimary: 2 }))
    expect(shooter.currentStats?.goal).toBe(1)
    expect(assist.currentStats?.assistprimary).toBe(1)
    expect(activeMatch.data.value.score).toBe(1)
    expect(activeMatch.data.value.shots).toHaveLength(1)

    entries[0]!.revert()
    expect(shooter.currentStats?.goal).toBe(0)
    expect(shooter.currentStats?.value).toBe(0)
    expect(assist.currentStats?.assistprimary).toBe(0)
    expect(assist.currentStats?.value).toBe(0)
    expect(activeMatch.data.value.score).toBe(0)
    expect(activeMatch.data.value.shots).toHaveLength(0)
  })

  it('exposes the server event id on the recorded entry', async () => {
    const { entries, record } = collector()
    const player = makePlayer({ id: 7 })
    const deps = makePlayerDeps([player])
    const api = usePlayer(deps.loadingState, deps.teamRef, deps.matchRef, record)

    api.increasePlayerStat(player, 'steal')
    await expect(entries[0]!.eventId).resolves.toBe(1)
  })
})
