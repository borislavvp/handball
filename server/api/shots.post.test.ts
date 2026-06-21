import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock, type Responder, type SupabaseOp } from '~/tests/helpers/supabaseMock'
import { makeShot } from '~/tests/helpers/factories'

const h = vi.hoisted(() => ({ current: null as ReturnType<typeof createSupabaseMock> | null }))
vi.mock('../utils/databaseClient', () => ({
  get supabase() {
    return h.current!.supabase
  }
}))

import handler from './shots.post'

const hasSingle = (ops: SupabaseOp[]) => ops.some((o) => o.method === 'single')

// shot insert returns a row with an id; player_stats lookups report "no row yet".
const defaultResponder: Responder = ({ table, ops }) => {
  if (table === 'shots' && hasSingle(ops)) return { data: { id: 55 }, error: null }
  if (table === 'player_stats' && hasSingle(ops)) return { data: null, error: null }
  return { data: null, error: null }
}

const run = (body: unknown, responder: Responder = defaultResponder) => {
  h.current = createSupabaseMock(responder)
  return { mock: h.current, result: (handler as (e: unknown) => Promise<void>)({ body }) }
}

describe('POST /api/shots', () => {
  beforeEach(() => {
    h.current = createSupabaseMock(defaultResponder)
  })

  it('inserts the shot with all fields mapped', async () => {
    const shot = makeShot({
      result: 'goal',
      from: 'LB9',
      to: 4,
      assistPrimary: 2,
      fastbreak: true,
      time: '15:00'
    })
    const { mock, result } = run({ matchId: 1, playerId: 7, shot })
    await result
    expect(mock.insertArgs('shots')).toMatchObject({
      matchid: 1,
      playerid: 7,
      from: 'LB9',
      to: 4,
      result: 'goal',
      time: '15:00',
      assistPrimary: 2,
      fastbreak: true
    })
  })

  it('increments the home score for a goal', async () => {
    const { mock, result } = run({ matchId: 1, playerId: 7, shot: makeShot({ result: 'goal' }) })
    await result
    expect(mock.rpcCalls).toContainEqual({
      name: 'increment_match_score',
      params: { column_name: 'score', matchid: 1 }
    })
  })

  it('increments the opponent score for a conceded goal (gkmiss)', async () => {
    const { mock, result } = run({ matchId: 1, playerId: 9, shot: makeShot({ result: 'gkmiss' }) })
    await result
    expect(mock.rpcCalls).toContainEqual({
      name: 'increment_match_score',
      params: { column_name: 'opponentScore', matchid: 1 }
    })
  })

  it('does not touch the score for a miss', async () => {
    const { mock, result } = run({ matchId: 1, playerId: 7, shot: makeShot({ result: 'miss' }) })
    await result
    expect(mock.rpcCalls.filter((c) => c.name === 'increment_match_score')).toHaveLength(0)
  })

  it('logs a match_event referencing the inserted shot id', async () => {
    const { mock, result } = run({ matchId: 1, playerId: 7, shot: makeShot({ result: 'goal', time: '15:00' }) })
    await result
    expect(mock.insertArgs('match_event')).toMatchObject({
      matchid: 1,
      playerid: 7,
      event: 'goal',
      time: '15:00',
      metadata: '55'
    })
  })

  it('returns the created match_event id (for undo)', async () => {
    const responder: Responder = ({ table, ops }) => {
      if (table === 'shots' && hasSingle(ops)) return { data: { id: 55 }, error: null }
      if (table === 'match_event' && hasSingle(ops)) return { data: { id: 88 }, error: null }
      return { data: null, error: null }
    }
    const { result } = run(
      { matchId: 1, playerId: 7, shot: makeShot({ result: 'goal' }) },
      responder
    )
    await expect(result).resolves.toEqual({ eventId: 88 })
  })

  it('rejects when the shot is missing', async () => {
    await expect(run({ matchId: 1, playerId: 7 }).result).rejects.toThrow()
  })

  it('rejects when the shot insert fails', async () => {
    const responder: Responder = ({ table, ops }) =>
      table === 'shots' && hasSingle(ops)
        ? { data: null, error: { message: 'insert failed' } }
        : { data: null, error: null }
    await expect(
      run({ matchId: 1, playerId: 7, shot: makeShot({ result: 'goal' }) }, responder).result
    ).rejects.toThrow()
  })
})
