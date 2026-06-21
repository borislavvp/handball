import { beforeEach, describe, expect, it, vi } from 'vitest'

// useTeam auto-imports useState from #app/composables/state (the real Nuxt one
// needs a runtime); provide a plain ref-backed stand-in keyed by name.
vi.mock('#app/composables/state', async () => {
  const { ref } = await import('vue')
  const store = new Map<string, ReturnType<typeof ref>>()
  return {
    useState: <T>(key: string, init?: () => T) => {
      if (!store.has(key)) store.set(key, ref(init ? init() : undefined))
      return store.get(key)
    }
  }
})

import { useTeam } from './useTeam'
import { makeLoadingState, makePlayer, makeTeam } from '~/tests/helpers/factories'

const setup = () => {
  const t = useTeam(makeLoadingState())
  t.teams.value = [
    makeTeam([makePlayer()], { id: 1, name: 'Home' }),
    makeTeam([makePlayer()], { id: 2, name: 'Away' })
  ]
  return t
}

beforeEach(() => {
  // `teams` is shared useState; each setup overwrites it.
})

describe('useTeam active team override', () => {
  it('activeTeam mirrors the selected team by default', () => {
    const t = setup()
    t.selectTeam(1)
    expect(t.activeTeam.value?.id).toBe(1)
  })

  it('setActiveTeam overrides the active team, null restores selected', () => {
    const t = setup()
    t.selectTeam(1)

    t.setActiveTeam(2)
    expect(t.activeTeam.value?.id).toBe(2)
    expect(t.selectedTeam.value?.id).toBe(1) // selection is untouched

    t.setActiveTeam(null)
    expect(t.activeTeam.value?.id).toBe(1)
  })

  it('falls back to the selected team when the override id is unknown', () => {
    const t = setup()
    t.selectTeam(1)
    t.setActiveTeam(999)
    expect(t.activeTeam.value?.id).toBe(1)
  })
})
