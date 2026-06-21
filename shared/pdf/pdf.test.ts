import { describe, expect, it } from 'vitest'
import {
  buildAttackByDefenseStats,
  buildAttackDefenseSuperiorityStats,
  buildDefenseByTypeStats,
  calculateAreaStats,
  calculateEfficiency,
  calculateGoalkeeperRow,
  calculateGoalkeeperTotals,
  calculatePlayerRow,
  calculateShootingTargets,
  calculateTotalShootingDistribution,
  findDefenseAt,
  findSuperiorityAt,
  getAreaMapping,
  labelShootingArea,
  parseTimeToSeconds,
  processGoalkeeperStats,
  processPlayerStats,
  toSeconds
} from './pdf'
import { ShootingTarget } from '~/types/handball'
import type { PlayerStats } from '~/types/handball'
import { makeMatchEvent, makeShot } from '~/tests/helpers/factories'
import type { GoalkeeperRow } from '~/types/pdf'

type DbPlayer = Parameters<typeof calculatePlayerRow>[0]
const player = (id: number, name: string, position = 'CB'): DbPlayer =>
  ({ id, number: id, name, position } as DbPlayer)

describe('pure helpers', () => {
  it('calculateEfficiency rounds and guards divide-by-zero', () => {
    expect(calculateEfficiency(3, 4)).toBe(75)
    expect(calculateEfficiency(2, 3)).toBe(67)
    expect(calculateEfficiency(0, 0)).toBe(0)
  })

  it('labelShootingArea buckets areas', () => {
    expect(labelShootingArea('LW')).toBe('Wing')
    expect(labelShootingArea('RW')).toBe('Wing')
    expect(labelShootingArea('CB9')).toBe('9M')
    expect(labelShootingArea('LB6')).toBe('6M')
    expect(labelShootingArea('7M')).toBe('7M')
  })

  it('getAreaMapping maps to printable labels', () => {
    expect(getAreaMapping('LW')).toBe('Wing')
    expect(getAreaMapping('CB9')).toBe('Back (9M)')
    expect(getAreaMapping('RB6')).toBe('Line (6M)')
    expect(getAreaMapping('7M')).toBe('7M Penalties')
  })

  it('parseTimeToSeconds / toSeconds parse MM:SS', () => {
    expect(parseTimeToSeconds('01:30')).toBe(90)
    expect(parseTimeToSeconds('')).toBe(0)
    expect(toSeconds('02:05')).toBe(125)
  })
})

describe('calculatePlayerRow', () => {
  const shots = [
    makeShot({ playerid: 1, from: 'CB9', result: 'goal', to: ShootingTarget.GOAL_TOP_LEFT }),
    makeShot({ playerid: 1, from: 'CB9', result: 'miss', to: ShootingTarget.GOAL_MIDDLE_MIDDLE }),
    makeShot({ playerid: 1, from: 'LW', result: 'goal', fastbreak: true }),
    makeShot({ playerid: 1, from: 'LB6', result: 'goal', breakthrough: true }),
    makeShot({ playerid: 1, from: '7M', result: 'goal' })
  ]
  const stat: Partial<PlayerStats> = {
    value: 9,
    assistprimary: 2,
    assistsecondary: 1,
    provokePenalty: 1,
    provokeTwoMin: 1,
    provokeCard: 1,
    lostball: 3,
    steal: 2,
    block: 1,
    norebound: 1,
    penaltymade: 1,
    '1on1lost': 1,
    defense: 4,
    defensex2: 2,
    yellowcard: 1,
    twominutes: 2,
    redcard: 0,
    bluecard: 0
  }
  const row = calculatePlayerRow(player(1, 'Ana'), shots, stat)

  it('computes attempts, goals and efficiency', () => {
    expect(row.attempts).toBe(5)
    expect(row.goalsTotal).toBe(4)
    expect(row.efficiency).toBe(80)
  })

  it('counts shots by area', () => {
    expect(row.by9m).toEqual({ scored: 1, total: 2 })
    expect(row.by6m).toEqual({ scored: 1, total: 1 })
    expect(row.byWing).toEqual({ scored: 1, total: 1 })
    expect(row.by7m).toEqual({ scored: 1, total: 1 })
    expect(row.fastbreak).toEqual({ scored: 1, total: 1 })
    expect(row.breakthrough).toEqual({ scored: 1, total: 1 })
  })

  it('passes through the recorded stat columns', () => {
    expect(row).toMatchObject({
      value: 9,
      assistsPrimary: 2,
      assistsSecondary: 1,
      provoked7m: 1,
      provoked2m: 1,
      provokedCard: 1,
      lostballs: 3,
      steals: 2,
      blocks: 1,
      norebounds: 1,
      penaltiesMade: 1,
      oneOnOneLost: 1,
      defense: 4,
      defenseAndSteal: 2,
      yellow: 1,
      twoMinutes: 2
    })
  })

  it('defaults every field to 0 when no stat row exists', () => {
    const empty = calculatePlayerRow(player(2, 'Bea'), [], {})
    expect(empty).toMatchObject({ value: 0, attempts: 0, goalsTotal: 0, efficiency: 0, assistsPrimary: 0 })
  })
})

describe('processPlayerStats', () => {
  it('excludes goalkeepers and maps each field player', () => {
    const players = [player(1, 'Ana'), player(2, 'GK', 'GK'), player(3, 'Cy')]
    const statsMap = new Map<number, Partial<PlayerStats>>([[1, { goal: 1 } as Partial<PlayerStats>]])
    const shots = [makeShot({ playerid: 1, result: 'goal' })]
    const rows = processPlayerStats(players, statsMap, shots)
    expect(rows.map((r) => r.name)).toEqual(['Ana', 'Cy'])
    expect(rows[0]!.goalsTotal).toBe(1)
  })
})

describe('calculateGoalkeeperRow', () => {
  const shots = [
    makeShot({ playerid: 9, from: 'CB9', result: 'gksave', noRecovery: true }),
    makeShot({ playerid: 9, from: 'CB9', result: 'gkmiss' }),
    makeShot({ playerid: 9, from: 'LW', result: 'gksave' }),
    makeShot({ playerid: 9, from: '7M', result: 'gksave', fastbreak: true })
  ]
  const row = calculateGoalkeeperRow(player(9, 'Keeper', 'GK'), shots, { value: 5 })

  it('computes saves, attempts and efficiency', () => {
    expect(row.totalSaves).toBe(3)
    expect(row.attempts).toBe(4)
    expect(row.efficiency).toBe(75)
  })

  it('counts saves by area', () => {
    expect(row.by9m).toEqual({ saved: 1, total: 2 })
    expect(row.byWing).toEqual({ saved: 1, total: 1 })
    expect(row.by7m).toEqual({ saved: 1, total: 1 })
    expect(row.fastbreak).toEqual({ saved: 1, total: 1 })
  })

  it('tracks stops without recovery by area', () => {
    expect(row.stopsWithoutRecovery).toBe(1)
    expect(row.stopsWithoutRecoveryByArea.by9m).toBe(1)
  })
})

describe('processGoalkeeperStats + totals', () => {
  it('sums the per-area buckets across keepers', () => {
    const gks = [player(9, 'K1', 'GK'), player(10, 'K2', 'GK')]
    const shots = [
      makeShot({ playerid: 9, from: 'CB9', result: 'gksave' }),
      makeShot({ playerid: 10, from: 'LW', result: 'gksave' }),
      makeShot({ playerid: 10, from: 'LW', result: 'gkmiss' })
    ]
    const rows = processGoalkeeperStats(gks, new Map(), shots)
    const totals = calculateGoalkeeperTotals(rows)
    // sum fields are unambiguous
    expect(totals.totalSaves).toBe(2)
    expect(totals.attempts).toBe(3)
    expect(totals.by9m.total).toBe(1)
    expect(totals.byWing.total).toBe(2)
  })
})

describe('calculateShootingTargets', () => {
  it('maps targets to the 3x3 grid and out-zones for field players', () => {
    const shots = [
      makeShot({ playerid: 1, result: 'goal', to: ShootingTarget.GOAL_TOP_LEFT }), // index 0
      makeShot({ playerid: 1, result: 'miss', to: ShootingTarget.GOAL_MIDDLE_MIDDLE }), // index 4
      makeShot({ playerid: 1, result: 'miss', to: ShootingTarget.OUT_LEFT }),
      makeShot({ playerid: 1, result: 'miss', to: ShootingTarget.OUT_TOP }),
      makeShot({ playerid: 1, result: 'miss', to: ShootingTarget.OUT_RIGHT })
    ]
    const grids = calculateShootingTargets([player(1, 'Ana')], shots, false)
    const grid = grids.get('1 Ana')!
    expect(grid.squares[0]).toEqual({ scored: 1, total: 1 })
    expect(grid.squares[4]).toEqual({ scored: 0, total: 1 })
    expect(grid.missed).toEqual({ left: 1, top: 1, right: 1 })
  })

  it('only counts gk results for goalkeeper grids', () => {
    const shots = [
      makeShot({ playerid: 9, result: 'gksave', to: ShootingTarget.GOAL_TOP_LEFT }),
      makeShot({ playerid: 9, result: 'gkmiss', to: ShootingTarget.GOAL_TOP_LEFT }),
      makeShot({ playerid: 9, result: 'goal', to: ShootingTarget.GOAL_TOP_LEFT }) // ignored
    ]
    const grid = calculateShootingTargets([player(9, 'K', 'GK')], shots, true).get('9 K')!
    expect(grid.squares[0]).toEqual({ scored: 1, total: 2 })
    expect(grid.missed).toBeUndefined()
  })

  it('calculateTotalShootingDistribution sums every grid', () => {
    const shots = [
      makeShot({ playerid: 1, result: 'goal', to: ShootingTarget.GOAL_TOP_LEFT }),
      makeShot({ playerid: 2, result: 'goal', to: ShootingTarget.GOAL_TOP_LEFT })
    ]
    const grids = calculateShootingTargets([player(1, 'A'), player(2, 'B')], shots, false)
    const total = calculateTotalShootingDistribution(grids, false)
    expect(total.squares[0]).toEqual({ scored: 2, total: 2 })
  })
})

describe('calculateAreaStats', () => {
  it('aggregates goals/saved/out/block per area with percentages', () => {
    const shots = [
      makeShot({ result: 'goal', from: 'CB9' }), // Back (9M)
      makeShot({ result: 'miss', from: 'CB9', to: ShootingTarget.GOAL_MIDDLE_MIDDLE }), // saved
      makeShot({ result: 'miss', from: 'CB9', to: ShootingTarget.OUT_TOP }), // out
      makeShot({ result: 'block', from: 'LW' }), // Wing block
      makeShot({ result: 'goal', from: 'LW', fastbreak: true }), // Fastbreak
      makeShot({ result: 'gksave', from: 'CB9' }) // excluded
    ]
    const stats = calculateAreaStats(shots)
    expect(stats.get('Back (9M)')).toMatchObject({ goals: 1, saved: 1, out: 1, total: 3, percent: 60 })
    expect(stats.get('Wing')).toMatchObject({ block: 1, total: 1, percent: 20 })
    expect(stats.get('Fastbreak')).toMatchObject({ goals: 1, total: 1, percent: 20 })
  })
})

describe('findSuperiorityAt', () => {
  it('defaults to 6 on 6 with no events', () => {
    expect(findSuperiorityAt('05:00', [], 'attack')).toBe('6 on 6')
    expect(findSuperiorityAt('05:00', [], 'defense')).toBe('6 on 6')
  })

  it('detects GK-out superiority on attack', () => {
    const events = [makeMatchEvent({ event: 'empty_goal_home', metadata: 'true', time: '04:00' })]
    expect(findSuperiorityAt('05:00', events, 'attack')).toBe('7 on 6 (GK out)')
  })
})

describe('buildAttackDefenseSuperiorityStats', () => {
  it('buckets attacks and computes efficiency for 6 on 6', () => {
    const shots = [
      makeShot({ result: 'goal', time: '01:00' }),
      makeShot({ result: 'miss', time: '02:00' }),
      makeShot({ result: 'goal_empty', time: '03:00' })
    ]
    const { attackSuperiority } = buildAttackDefenseSuperiorityStats(shots, [])
    expect(attackSuperiority.get('6 on 6')).toMatchObject({
      attacks: 3,
      scored: 2,
      missed: 1,
      eff: 66.7
    })
  })
})

describe('findDefenseAt', () => {
  it('returns the most recent opponent defense change before the shot', () => {
    const events = [
      makeMatchEvent({ event: 'opponent_defense_change', metadata: '5-1', time: '03:00' })
    ]
    expect(findDefenseAt('05:00', events, true)).toBe('5-1')
    expect(findDefenseAt('02:00', events, true)).toBe('6-0') // before the change
  })
})

describe('buildAttackByDefenseStats', () => {
  it('counts shots and provoked penalties under the active defense', () => {
    const shots = [
      makeShot({ result: 'goal', from: 'CB9', time: '01:00' }),
      makeShot({ result: 'miss', from: 'LW', time: '02:00' })
    ]
    const events = [makeMatchEvent({ event: 'provokePenalty', time: '01:30' })]
    const { attackByOppDefense, fastBreaks } = buildAttackByDefenseStats(shots, events)
    const sixOh = attackByOppDefense.get('6-0')!
    expect(sixOh.shots).toEqual({ total: 2, scored: 1 })
    expect(sixOh.by9m).toEqual({ total: 1, scored: 1 })
    expect(sixOh.byWing).toEqual({ total: 1, scored: 0 })
    expect(sixOh.provoked7m).toBe(1)
    expect(fastBreaks.total).toBe(0)
  })
})

describe('buildDefenseByTypeStats', () => {
  it('counts saves, steals, penalties and suspensions by defense type', () => {
    const shots = [
      makeShot({ result: 'gksave', from: 'CB9', time: '01:00' }),
      makeShot({ result: 'gkmiss', from: 'LW', time: '02:00' })
    ]
    const events = [
      makeMatchEvent({ event: 'steal', time: '01:10' }),
      makeMatchEvent({ event: 'penaltymade', time: '01:20' }),
      makeMatchEvent({ event: 'twominutes', time: '01:30' })
    ]
    const { defenseByType } = buildDefenseByTypeStats(shots, events)
    const sixOh = defenseByType.get('6-0')!
    expect(sixOh.shots).toEqual({ total: 2, saved: 1 })
    expect(sixOh.steals).toBe(1)
    expect(sixOh.commitedSeven).toBe(1)
    expect(sixOh.twoMinutesCommitted).toBe(1)
  })
})
