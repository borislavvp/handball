import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock, type Responder } from '~/tests/helpers/supabaseMock'

const h = vi.hoisted(() => ({ current: null as ReturnType<typeof createSupabaseMock> | null }))
vi.mock('../utils/databaseClient', () => ({
  get supabase() {
    return h.current!.supabase
  }
}))

import handler from './matches.post'

// Insert into `match` resolves with the new row.
const defaultResponder: Responder = ({ table, ops }) =>
  table === 'match' && ops.some((o) => o.method === 'single')
    ? { data: { id: 5, createdat: '2026-01-01' }, error: null }
    : { data: null, error: null }

const run = (body: unknown, responder: Responder = defaultResponder) => {
  h.current = createSupabaseMock(responder)
  return { mock: h.current, result: (handler as (e: unknown) => Promise<unknown>)({ body }) }
}

describe('POST /api/matches', () => {
  beforeEach(() => {
    h.current = createSupabaseMock(defaultResponder)
  })

  it('inserts a match against a free-text opponent with no opponent team', async () => {
    const { mock, result } = run({ opponent: 'Rivals', teamId: 1 })
    await result
    expect(mock.insertArgs('match')).toMatchObject({
      opponent: 'Rivals',
      teamid: 1,
      opponentTeamId: null
    })
  })

  it('persists opponentTeamId when playing an existing team', async () => {
    const { mock, result } = run({ opponent: 'B Team', teamId: 1, opponentTeamId: 2 })
    await result
    expect(mock.insertArgs('match')).toMatchObject({
      opponent: 'B Team',
      teamid: 1,
      opponentTeamId: 2
    })
  })

  it('returns the created match id', async () => {
    const { result } = run({ opponent: 'Rivals', teamId: 1 })
    await expect(result).resolves.toMatchObject({ id: 5 })
  })

  it('rejects when opponent or teamId is missing', async () => {
    await expect(run({ teamId: 1 }).result).rejects.toThrow()
    await expect(run({ opponent: 'X' }).result).rejects.toThrow()
  })
})
