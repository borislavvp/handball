import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUndo } from './useUndo'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(undefined)
  vi.stubGlobal('$fetch', fetchMock)
  useUndo().clear()
})

describe('useUndo', () => {
  it('records entries and exposes canUndo', () => {
    const undo = useUndo()
    expect(undo.canUndo.value).toBe(false)
    undo.record({ revert: vi.fn(), eventId: Promise.resolve(1) })
    expect(undo.canUndo.value).toBe(true)
  })

  it('undoLast reverts the local state and deletes the server event', async () => {
    const undo = useUndo()
    const revert = vi.fn()
    undo.record({ revert, eventId: Promise.resolve(42) })

    const ok = await undo.undoLast()

    expect(ok).toBe(true)
    expect(revert).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith('/api/match/events/42', { method: 'DELETE' })
    expect(undo.canUndo.value).toBe(false)
  })

  it('undoes in LIFO order', async () => {
    const undo = useUndo()
    const order: string[] = []
    undo.record({ revert: () => order.push('first'), eventId: Promise.resolve(1) })
    undo.record({ revert: () => order.push('second'), eventId: Promise.resolve(2) })

    await undo.undoLast()
    await undo.undoLast()

    expect(order).toEqual(['second', 'first'])
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      '/api/match/events/2',
      '/api/match/events/1'
    ])
  })

  it('returns false and makes no request when there is nothing to undo', async () => {
    const undo = useUndo()
    const ok = await undo.undoLast()
    expect(ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skips the server delete when no event id was produced', async () => {
    const undo = useUndo()
    undo.record({ revert: vi.fn(), eventId: Promise.resolve(null) })
    await undo.undoLast()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('augmentLast adds rollback that runs after the base revert', async () => {
    const undo = useUndo()
    const order: string[] = []
    undo.record({ revert: () => order.push('base'), eventId: Promise.resolve(1) })
    undo.augmentLast(() => order.push('extra'))

    await undo.undoLast()

    expect(order).toEqual(['base', 'extra'])
  })

  it('still reverts locally even if the server delete fails', async () => {
    const undo = useUndo()
    const revert = vi.fn()
    fetchMock.mockRejectedValue(new Error('network'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    undo.record({ revert, eventId: Promise.resolve(7) })

    const ok = await undo.undoLast()

    expect(ok).toBe(true)
    expect(revert).toHaveBeenCalledOnce()
  })
})
