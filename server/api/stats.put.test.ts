import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock, type Responder } from '~/tests/helpers/supabaseMock'

const h = vi.hoisted(() => ({ current: null as ReturnType<typeof createSupabaseMock> | null }))
vi.mock('../utils/databaseClient', () => ({
  get supabase() {
    return h.current!.supabase
  }
}))

import handler from './stats.put'

const run = (body: unknown, responder?: Responder) => {
  h.current = createSupabaseMock(responder)
  return { mock: h.current, result: (handler as (e: unknown) => Promise<void>)({ body }) }
}

describe('PUT /api/stats', () => {
  beforeEach(() => {
    h.current = createSupabaseMock()
  })

  it('calls the increment_stat RPC with the column, match and player', async () => {
    const { mock, result } = run({ matchId: 2, playerId: 5, statType: 'defense', time: '20:00' })
    await result
    expect(mock.rpcCalls).toContainEqual({
      name: 'increment_stat',
      params: { column_name: 'defense', matchid: 2, playerid: 5 }
    })
  })

  it('logs a match_event for the increment', async () => {
    const { mock, result } = run({ matchId: 2, playerId: 5, statType: 'steal', time: '21:15' })
    await result
    expect(mock.insertArgs('match_event')).toMatchObject({
      matchid: 2,
      playerid: 5,
      event: 'steal',
      time: '21:15'
    })
  })

  it('rejects when statType is missing', async () => {
    await expect(run({ matchId: 2, playerId: 5 }).result).rejects.toThrow()
  })

  it('returns the created match_event id (for undo)', async () => {
    const responder: Responder = ({ table, ops }) =>
      table === 'match_event' && ops.some((o) => o.method === 'single')
        ? { data: { id: 77 }, error: null }
        : { data: null, error: null }
    const { result } = run({ matchId: 2, playerId: 5, statType: 'defense', time: '0' }, responder)
    await expect(result).resolves.toEqual({ eventId: 77 })
  })

  it('throws when the RPC returns an error', async () => {
    const responder: Responder = ({ rpc }) =>
      rpc === 'increment_stat'
        ? { data: null, error: { message: 'no row' } }
        : { data: null, error: null }
    await expect(
      run({ matchId: 2, playerId: 5, statType: 'goal', time: '00:00' }, responder).result
    ).rejects.toThrow('no row')
  })
})
