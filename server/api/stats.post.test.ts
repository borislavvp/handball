import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock, type Responder } from '~/tests/helpers/supabaseMock'

const h = vi.hoisted(() => ({ current: null as ReturnType<typeof createSupabaseMock> | null }))
vi.mock('../utils/databaseClient', () => ({
  get supabase() {
    return h.current!.supabase
  }
}))

import handler from './stats.post'

const run = (body: unknown, responder?: Responder) => {
  h.current = createSupabaseMock(responder)
  return { mock: h.current, result: (handler as (e: unknown) => Promise<void>)({ body }) }
}

describe('POST /api/stats', () => {
  beforeEach(() => {
    h.current = createSupabaseMock()
  })

  it('inserts a player_stats row with the stat set to 1', async () => {
    const { mock, result } = run({ matchId: 1, playerId: 7, statType: 'defense', time: '10:00' })
    await result
    expect(mock.insertArgs('player_stats')).toEqual({ matchid: 1, playerid: 7, defense: 1 })
  })

  it('also logs a match_event for the stat', async () => {
    const { mock, result } = run({ matchId: 1, playerId: 7, statType: 'steal', time: '12:30' })
    await result
    expect(mock.insertArgs('match_event')).toMatchObject({
      matchid: 1,
      playerid: 7,
      event: 'steal',
      time: '12:30'
    })
  })

  it('rejects when matchId is missing', async () => {
    await expect(run({ playerId: 7, statType: 'defense' }).result).rejects.toThrow()
  })

  it('rejects when playerId is missing', async () => {
    await expect(run({ matchId: 1, statType: 'defense' }).result).rejects.toThrow()
  })

  it('returns the created match_event id (for undo)', async () => {
    const responder: Responder = ({ table, ops }) =>
      table === 'match_event' && ops.some((o) => o.method === 'single')
        ? { data: { id: 99 }, error: null }
        : { data: null, error: null }
    const { result } = run({ matchId: 1, playerId: 7, statType: 'defense', time: '0' }, responder)
    await expect(result).resolves.toEqual({ eventId: 99 })
  })

  it('throws when the insert returns an error', async () => {
    const responder: Responder = ({ table }) =>
      table === 'player_stats'
        ? { data: null, error: { message: 'duplicate' } }
        : { data: null, error: null }
    await expect(
      run({ matchId: 1, playerId: 7, statType: 'goal', time: '00:00' }, responder).result
    ).rejects.toThrow('duplicate')
  })
})
