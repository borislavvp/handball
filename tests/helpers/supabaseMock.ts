import { vi } from 'vitest'

export type SupabaseOp = { method: string; args: unknown[] }
export type SupabaseResult = { data?: unknown; error?: unknown }

export type Responder = (ctx: {
  table?: string
  rpc?: string
  ops: SupabaseOp[]
  params?: unknown
}) => SupabaseResult

const defaultResponder: Responder = () => ({ data: null, error: null })

/**
 * Chainable Supabase client stub. Records every `from()` chain and `rpc()` call
 * so tests can assert on the persisted writes, and lets a test supply a
 * `responder` to control what terminal awaits resolve to.
 *
 * The builder is thenable: `await supabase.from('x').insert({...})` and
 * `await supabase.from('x').select().eq().single()` both resolve via responder.
 */
export function createSupabaseMock(responder: Responder = defaultResponder) {
  const fromCalls: Array<{ table: string; ops: SupabaseOp[] }> = []
  const rpcCalls: Array<{ name: string; params: unknown }> = []

  const makeBuilder = (table: string) => {
    const ops: SupabaseOp[] = []
    fromCalls.push({ table, ops })

    const result = () => responder({ table, ops })

    const builder: Record<string, unknown> = {
      then: (resolve: (v: SupabaseResult) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(result()).then(resolve, reject)
    }

    const chain = (method: string) =>
      vi.fn((...args: unknown[]) => {
        ops.push({ method, args })
        return builder
      })

    for (const m of [
      'select',
      'insert',
      'update',
      'delete',
      'upsert',
      'eq',
      'neq',
      'order',
      'limit'
    ]) {
      builder[m] = chain(m)
    }
    for (const m of ['single', 'maybeSingle']) {
      builder[m] = vi.fn((...args: unknown[]) => {
        ops.push({ method: m, args })
        return Promise.resolve(responder({ table, ops }))
      })
    }

    return builder
  }

  const supabase = {
    from: vi.fn((table: string) => makeBuilder(table)),
    rpc: vi.fn((name: string, params?: unknown) => {
      rpcCalls.push({ name, params })
      return Promise.resolve(responder({ rpc: name, ops: [], params }))
    })
  }

  return {
    supabase,
    fromCalls,
    rpcCalls,
    /** All ops recorded for a given table across every from() chain. */
    opsFor: (table: string) => fromCalls.filter((c) => c.table === table).flatMap((c) => c.ops),
    /** The args passed to the first insert() into `table`. */
    insertArgs: (table: string) => {
      for (const c of fromCalls) {
        if (c.table !== table) continue
        const ins = c.ops.find((o) => o.method === 'insert')
        if (ins) return ins.args[0]
      }
      return undefined
    }
  }
}
