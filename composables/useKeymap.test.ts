import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildCombo,
  clearPendingPrefix,
  createKeymap,
  shouldIgnoreKeyEvent,
  useKeymap
} from './useKeymap'

type KeyEventLike = Partial<{
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
  code: string
  repeat: boolean
  target: unknown
}>

const ev = (o: KeyEventLike) =>
  ({
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    repeat: false,
    target: null,
    ...o
  }) as unknown as KeyboardEvent

afterEach(() => clearPendingPrefix())

describe('useKeymap registry', () => {
  it('registers, looks up and fires an action', () => {
    const km = useKeymap()
    const action = vi.fn()
    km.register('Shift+D', action)
    expect(km.has('Shift+D')).toBe(true)
    expect(km.press('Shift+D')).toBe(true)
    expect(action).toHaveBeenCalledOnce()
  })

  it('press returns false for an unknown combo', () => {
    const km = useKeymap()
    expect(km.press('Ctrl+Z')).toBe(false)
  })

  it('press returns false when the action explicitly returns false', () => {
    const km = useKeymap()
    km.register('Esc', () => false)
    expect(km.press('Esc')).toBe(false)
  })

  it('press swallows a throwing action and returns false', () => {
    const km = useKeymap()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    km.register('Ctrl+G', () => {
      throw new Error('boom')
    })
    expect(km.press('Ctrl+G')).toBe(false)
    spy.mockRestore()
  })

  it('unregister and clear remove combos', () => {
    const km = useKeymap()
    km.register('Shift+D', vi.fn())
    km.unregister('Shift+D')
    expect(km.has('Shift+D')).toBe(false)
    km.register('Shift+E', vi.fn())
    km.clear()
    expect(km.has('Shift+E')).toBe(false)
  })

  it('createKeymap returns an empty Map', () => {
    expect(createKeymap().size).toBe(0)
  })
})

describe('buildCombo', () => {
  it('builds a bare key from the event code', () => {
    expect(buildCombo(ev({ code: 'KeyD' }))).toMatchObject({ combo: 'D', fired: true })
  })

  it('prefixes modifiers in Ctrl, Shift, Alt order', () => {
    expect(buildCombo(ev({ ctrlKey: true, code: 'KeyG' })).combo).toBe('Ctrl+G')
    expect(buildCombo(ev({ shiftKey: true, code: 'Digit2' })).combo).toBe('Shift+2')
    expect(buildCombo(ev({ altKey: true, code: 'KeyX' })).combo).toBe('Alt+X')
  })

  it('maps special codes to readable names', () => {
    expect(buildCombo(ev({ ctrlKey: true, code: 'Minus' })).combo).toBe('Ctrl+-')
    expect(buildCombo(ev({ ctrlKey: true, code: 'Equal' })).combo).toBe('Ctrl+=')
    expect(buildCombo(ev({ code: 'Escape' })).combo).toBe('Escape')
    expect(buildCombo(ev({ code: 'Space' })).combo).toBe('Space')
  })

  it('treats the meta key per platform (Ctrl on mac, ignored elsewhere)', () => {
    const onMac = /Mac|iPod|iPhone|iPad/.test(globalThis.navigator?.platform ?? '')
    const res = buildCombo(ev({ metaKey: true, code: 'KeyA' }))
    if (onMac) {
      expect(res).toMatchObject({ combo: 'Ctrl+A', fired: true })
    } else {
      expect(res).toMatchObject({ combo: null, fired: false })
    }
  })

  it('builds single-key combos (no two-step prefix)', () => {
    // Ctrl+L now fires immediately (it used to arm a prefix and wait).
    expect(buildCombo(ev({ ctrlKey: true, code: 'KeyL' }))).toMatchObject({
      combo: 'Ctrl+L',
      consumed: true,
      fired: true
    })
    expect(buildCombo(ev({ ctrlKey: true, code: 'KeyB' }))).toMatchObject({
      combo: 'Ctrl+B',
      fired: true
    })
  })
})

describe('shouldIgnoreKeyEvent', () => {
  it('ignores auto-repeat events', () => {
    expect(shouldIgnoreKeyEvent(ev({ code: 'KeyD', repeat: true }))).toBe(true)
  })

  it('does not ignore a normal event', () => {
    expect(shouldIgnoreKeyEvent(ev({ code: 'KeyD' }))).toBe(false)
  })
})
