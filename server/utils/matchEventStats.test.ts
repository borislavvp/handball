import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock, type Responder } from '~/tests/helpers/supabaseMock'

const h = vi.hoisted(() => ({ current: null as ReturnType<typeof createSupabaseMock> | null }))
vi.mock('./databaseClient', () => ({
  get supabase() {
    return h.current!.supabase
  }
}))

import {
  decrementPlayerStat,
  incrementPlayerStat,
  incrementShotStats,
  isShotResult,
  isStatColumn,
  parseShotId
} from './matchEventStats'

const useMock = (responder?: Responder) => {
  h.current = createSupabaseMock(responder)
  return h.current
}

const inserts = (table: string) =>
  h.current!.fromCalls
    .filter((c) => c.table === table)
    .map((c) => c.ops.find((o) => o.method === 'insert')?.args[0])
    .filter(Boolean)

const updateArgs = (table: string) =>
  h.current!.fromCalls
    .filter((c) => c.table === table)
    .map((c) => c.ops.find((o) => o.method === 'update')?.args[0])
    .filter(Boolean)

describe('guards', () => {
  it('isShotResult recognises only shot results', () => {
    expect(isShotResult('goal')).toBe(true)
    expect(isShotResult('gksave')).toBe(true)
    expect(isShotResult('defense')).toBe(false)
  })

  it('isStatColumn recognises stat columns', () => {
    expect(isStatColumn('defense')).toBe(true)
    expect(isStatColumn('goal_empty')).toBe(true)
    expect(isStatColumn('not_a_stat')).toBe(false)
  })

  it('parseShotId parses positive integers only', () => {
    expect(parseShotId('55')).toBe(55)
    expect(parseShotId(null)).toBeNull()
    expect(parseShotId('0')).toBeNull()
    expect(parseShotId('abc')).toBeNull()
  })
})

describe('incrementPlayerStat', () => {
  beforeEach(() => useMock())

  it('inserts a fresh row with the stat at 1 and the rest zeroed', async () => {
    useMock(() => ({ data: null, error: null })) // no existing row
    await incrementPlayerStat(1, 7, 'defense')
    const inserted = inserts('player_stats')[0] as Record<string, number>
    expect(inserted).toMatchObject({ matchid: 1, playerid: 7, defense: 1 })
    expect(inserted.goal).toBe(0) // emptyStats seeds every column
  })

  it('updates an existing row by +1', async () => {
    useMock(({ ops }) =>
      ops.some((o) => o.method === 'maybeSingle')
        ? { data: { defense: 2 }, error: null }
        : { data: null, error: null }
    )
    await incrementPlayerStat(1, 7, 'defense')
    expect(updateArgs('player_stats')[0]).toEqual({ defense: 3 })
  })

  it('ignores non-stat columns and unknown players', async () => {
    useMock()
    await incrementPlayerStat(1, 7, 'not_a_stat')
    await incrementPlayerStat(1, null, 'defense')
    expect(h.current!.fromCalls).toHaveLength(0)
  })
})

describe('decrementPlayerStat', () => {
  it('floors the value at 0', async () => {
    useMock(({ ops }) =>
      ops.some((o) => o.method === 'maybeSingle')
        ? { data: { norebound: 0 }, error: null }
        : { data: null, error: null }
    )
    await decrementPlayerStat(1, 7, 'norebound')
    expect(updateArgs('player_stats')[0]).toEqual({ norebound: 0 })
  })

  it('no-ops when there is no existing row', async () => {
    useMock(() => ({ data: null, error: null }))
    await decrementPlayerStat(1, 7, 'norebound')
    expect(updateArgs('player_stats')).toHaveLength(0)
  })
})

describe('incrementShotStats', () => {
  it('credits the shooter, both assists, mistake (1on1lost) and no-recovery (norebound)', async () => {
    useMock(() => ({ data: null, error: null }))
    await incrementShotStats(1, 7, {
      result: 'goal',
      assistPrimary: 2,
      assistSecondary: 3,
      mistakePlayer: 4,
      noRecoveryPlayer: 5
    })
    const rows = inserts('player_stats') as Array<Record<string, number>>
    const byPlayer = Object.fromEntries(rows.map((r) => [r.playerid, r]))
    expect(byPlayer[7]!.goal).toBe(1)
    expect(byPlayer[2]!.assistprimary).toBe(1)
    expect(byPlayer[3]!.assistsecondary).toBe(1)
    expect(byPlayer[4]!['1on1lost']).toBe(1)
    expect(byPlayer[5]!.norebound).toBe(1)
  })
})
