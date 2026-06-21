import { describe, expect, it } from 'vitest'
import {
  aggregatePlayerSeason,
  attackPercent,
  computeTeamSeason,
  defensePercent,
  gkSavesPercent
} from './seasonStats'
import type { PlayerStats, Shot, Stats } from '~/types/handball'
import { makePlayer, makeShot } from '~/tests/helpers/factories'

// All numeric stat keys, mirroring the DB row shape.
const STAT_KEYS: Stats[] = [
  'goal', 'goal_empty', 'gkmiss_empty', 'assistprimary', 'assistsecondary',
  '1on1win', 'provokePenalty', 'provokeTwoMin', 'provokeCard', 'miss', 'block',
  '1on1lost', 'norebound', 'lostball', 'steal', 'defense', 'defensex2',
  'penaltymade', 'twominutes', 'yellowcard', 'redcard', 'bluecard', 'gksave',
  'gkmiss'
]

type Overrides = Partial<Record<Stats, number>>

// Builds one PlayerStats row: all stats zeroed, overrides applied, with a
// match snapshot. `value` and `matchId` are passed explicitly so each test can
// control trend ordering and the value series independently of stat content.
function makeStatRow(opts: {
  matchId: number
  value?: number
  stats?: Overrides
  shots?: Shot[]
  opponent?: string
  result?: string | null
  score?: number
  opponentScore?: number
}): PlayerStats {
  const row = {} as PlayerStats
  for (const k of STAT_KEYS) row[k] = 0
  if (opts.stats) {
    for (const [k, v] of Object.entries(opts.stats)) row[k as Stats] = v as number
  }
  row.value = opts.value ?? 0
  row.playerid = 1
  row.match = {
    id: opts.matchId,
    opponent: opts.opponent ?? `Opp ${opts.matchId}`,
    result: opts.result ?? 'FINISHED',
    score: opts.score ?? 0,
    opponentScore: opts.opponentScore ?? 0,
    timeoutsLeftHome: 3,
    timeoutsLeftAway: 3,
    shots: opts.shots ?? []
  }
  return row
}

describe('percentage formulas', () => {
  const base = (): Record<Stats, number> => {
    const o = {} as Record<Stats, number>
    for (const k of STAT_KEYS) o[k] = 0
    return o
  }

  it('attackPercent: positives over positives+negatives', () => {
    const s = base()
    s.goal = 6
    s.assistprimary = 2
    s.miss = 2 // positives = 8, negatives = 2 -> 80%
    expect(attackPercent(s)).toBe(80)
  })

  it('attackPercent: returns 0 on an empty line (no divide-by-zero)', () => {
    expect(attackPercent(base())).toBe(0)
  })

  it('defensePercent: counts steals/blocks/defense vs penalties', () => {
    const s = base()
    s.steal = 3
    s.block = 1 // positives = 4
    s['1on1lost'] = 1 // negatives = 1 -> 80%
    expect(defensePercent(s)).toBe(80)
  })

  it('gkSavesPercent: saves over saves+misses', () => {
    const s = base()
    s.gksave = 7
    s.gkmiss = 3 // 70%
    expect(gkSavesPercent(s)).toBe(70)
  })

  it('gkSavesPercent: 0 when the GK faced no shots', () => {
    expect(gkSavesPercent(base())).toBe(0)
  })
})

describe('aggregatePlayerSeason', () => {
  it('returns an empty-but-safe season for no matches', () => {
    const s = aggregatePlayerSeason([], 1)
    expect(s.matches).toBe(0)
    expect(s.goalsPerGame).toBe(0)
    expect(s.efficiency).toBe(0)
    expect(s.avgValue).toBe(0)
    expect(s.form).toBeNull()
    expect(s.bestZone).toBeNull()
    expect(s.trend).toEqual([])
  })

  it('sums totals and averages across matches', () => {
    const stats = [
      makeStatRow({ matchId: 1, value: 4, stats: { goal: 5, miss: 1 } }),
      makeStatRow({ matchId: 2, value: 2, stats: { goal: 3, miss: 3 } })
    ]
    const s = aggregatePlayerSeason(stats, 1)
    expect(s.matches).toBe(2)
    expect(s.totals.goal).toBe(8)
    expect(s.totals.miss).toBe(4)
    expect(s.goalsPerGame).toBe(4) // 8 / 2
    expect(s.efficiency).toBe(67) // 8 / 12 -> 66.6 -> 67
    expect(s.totalValue).toBe(6)
    expect(s.avgValue).toBe(3) // 6 / 2
  })

  it('orders the trend chronologically by match id regardless of input order', () => {
    const stats = [
      makeStatRow({ matchId: 3, value: 9, opponent: 'C' }),
      makeStatRow({ matchId: 1, value: 1, opponent: 'A' }),
      makeStatRow({ matchId: 2, value: 5, opponent: 'B' })
    ]
    const s = aggregatePlayerSeason(stats, 1)
    expect(s.trend.map(p => p.matchId)).toEqual([1, 2, 3])
    expect(s.trend.map(p => p.label)).toEqual(['A', 'B', 'C'])
    expect(s.trend.map(p => p.value)).toEqual([1, 5, 9])
  })

  it('computes per-match efficiency in the trend', () => {
    const stats = [makeStatRow({ matchId: 1, stats: { goal: 3, miss: 1 } })]
    const s = aggregatePlayerSeason(stats, 1)
    expect(s.trend[0]!.efficiency).toBe(75) // 3 / 4
  })

  it('picks the best scoring zone from the player\'s own shots (>=2 attempts)', () => {
    const wingGoals: Shot[] = [
      makeShot({ playerid: 1, from: 'LW', result: 'goal' }),
      makeShot({ playerid: 1, from: 'LW', result: 'goal' })
    ]
    const backMixed: Shot[] = [
      makeShot({ playerid: 1, from: 'CB9', result: 'goal' }),
      makeShot({ playerid: 1, from: 'CB9', result: 'miss' })
    ]
    const stats = [makeStatRow({ matchId: 1, shots: [...wingGoals, ...backMixed] })]
    const s = aggregatePlayerSeason(stats, 1)
    expect(s.bestZone).toEqual({ area: 'LW', goalRate: 100, attempts: 2 })
  })

  it('ignores other players\' shots and single-attempt zones when picking best zone', () => {
    const shots: Shot[] = [
      makeShot({ playerid: 2, from: 'LW', result: 'goal' }), // other player
      makeShot({ playerid: 2, from: 'LW', result: 'goal' }),
      makeShot({ playerid: 1, from: 'RW', result: 'goal' }) // only 1 attempt -> too small
    ]
    const stats = [makeStatRow({ matchId: 1, shots })]
    const s = aggregatePlayerSeason(stats, 1)
    expect(s.bestZone).toBeNull()
  })
})

describe('recent form', () => {
  // helper: N matches with a given per-match value
  const seq = (values: number[]) =>
    values.map((v, i) => makeStatRow({ matchId: i + 1, value: v }))

  it('is null until there are more than 3 matches', () => {
    expect(aggregatePlayerSeason(seq([1, 2, 3]), 1).form).toBeNull()
    expect(aggregatePlayerSeason(seq([1, 2, 3, 4]), 1).form).not.toBeNull()
  })

  it('flags an upward trend when the last 3 beat the season average', () => {
    // season avg over [0,0,6,6,6] = 3.6; last 3 avg = 6 -> delta +2.4
    const s = aggregatePlayerSeason(seq([0, 0, 6, 6, 6]), 1)
    expect(s.form?.direction).toBe('up')
    expect(s.form?.window).toBe(3)
    expect(s.form?.recentAvgValue).toBe(6)
    expect(s.form!.delta).toBeGreaterThan(0)
  })

  it('flags a downward trend when recent form drops below the season average', () => {
    const s = aggregatePlayerSeason(seq([8, 8, 8, 0, 0]), 1)
    expect(s.form?.direction).toBe('down')
    expect(s.form!.delta).toBeLessThan(0)
  })

  it('reports flat form when recent matches match the season average', () => {
    const s = aggregatePlayerSeason(seq([4, 4, 4, 4, 4]), 1)
    expect(s.form?.direction).toBe('flat')
    expect(s.form?.delta).toBe(0)
  })
})

describe('computeTeamSeason', () => {
  it('dedupes the shared match snapshot for record and goals while summing stats across players', () => {
    // Two players, both carrying the same two matches in recentStats.
    const m1 = { matchId: 1, result: 'WIN', score: 30, opponentScore: 25 }
    const m2 = { matchId: 2, result: 'LOST', score: 22, opponentScore: 28 }

    const p1 = makePlayer({
      id: 1,
      recentStats: [
        makeStatRow({ ...m1, stats: { goal: 5, steal: 2 } }),
        makeStatRow({ ...m2, stats: { goal: 3, miss: 2 } })
      ]
    })
    const p2 = makePlayer({
      id: 2,
      recentStats: [
        makeStatRow({ ...m1, stats: { goal: 4 } }),
        makeStatRow({ ...m2, stats: { goal: 2, steal: 1 } })
      ]
    })

    const t = computeTeamSeason([p1, p2])
    expect(t.matchesPlayed).toBe(2)
    expect(t.wins).toBe(1)
    expect(t.losses).toBe(1)
    // goals counted once per match (30+22), not per player
    expect(t.goalsFor).toBe(52)
    expect(t.goalsAgainst).toBe(53)
  })

  it('counts a FINISHED match as played but not a win or loss', () => {
    const p = makePlayer({
      id: 1,
      recentStats: [makeStatRow({ matchId: 1, result: 'FINISHED', score: 20, opponentScore: 20 })]
    })
    const t = computeTeamSeason([p])
    expect(t.matchesPlayed).toBe(1)
    expect(t.wins).toBe(0)
    expect(t.losses).toBe(0)
  })

  it('handles a team with no recorded stats', () => {
    const p = makePlayer({ id: 1, recentStats: [] })
    const t = computeTeamSeason([p])
    expect(t).toMatchObject({ matchesPlayed: 0, wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 })
  })
})
