// @vitest-environment happy-dom
//
// The Nuxt test environment (`@vitest-environment nuxt`) crashes on import for
// this project: @nuxt/test-utils' setupNuxt reads `nuxtApp._route.sync`, which
// is undefined under Nuxt 4.4 (incompatibility, both 3.23 and 4.0 affected).
// So we mount StatsOptions in plain happy-dom and mock the Nuxt composables it
// reaches for. store.players is a REAL usePlayer instance, so a click genuinely
// updates the player's value and fires $fetch.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { ShootingTarget } from '~/types/handball'
import { usePlayer } from '~/composables/usePlayer'
import {
  makeActiveMatch,
  makeLoadingState,
  makePlayer,
  makeTeam,
  resetIds
} from '~/tests/helpers/factories'

// Holder so the mocked useHandballStore returns the per-test store.
const hoisted = vi.hoisted(() => ({
  store: null as unknown,
  dialogAlert: vi.fn()
}))

// useState used by useStatsPanel/useShotBuilder/etc. + useNuxtApp for $dialog.
vi.mock('nuxt/app', () => ({
  useState: <T>(_key: string, init?: () => T) => ref(init ? init() : undefined),
  useNuxtApp: () => ({ $dialog: { alert: hoisted.dialogAlert } })
}))
vi.mock('#app/nuxt', () => ({
  useNuxtApp: () => ({ $dialog: { alert: hoisted.dialogAlert } }),
  useRuntimeConfig: () => ({ public: {} })
}))
vi.mock('~/composables/useHandballStore', () => ({
  useHandballStore: () => hoisted.store
}))
vi.mock('~/composables/usePlayerFlash', () => ({
  usePlayerFlash: () => ({ trigger: vi.fn(), isFlashing: () => false, flash: { value: {} } })
}))

import StatsOptions from './StatsOptions.vue'

const fetchMock = vi.fn()

function buildStore() {
  const player = makePlayer({ id: 7, position: 'CB' })
  const team = makeTeam([player])
  const activeMatch = makeActiveMatch()

  const players = usePlayer(
    makeLoadingState(),
    computed(() => team) as unknown as Parameters<typeof usePlayer>[1],
    computed(() => activeMatch) as unknown as Parameters<typeof usePlayer>[2]
  )
  vi.spyOn(players, 'increasePlayerStat')
  vi.spyOn(players, 'addShotToPlayer')

  const selection = {
    player: ref(player),
    primaryAssist: ref(null),
    secondaryAssist: ref(null),
    mistakePlayer: ref(null),
    noRecoveryPlayer: ref(null),
    oneOnOneLost: ref(false),
    noRecovery: ref(false),
    stats: ref({ goal: false, attack: false, defense: false, general: false }),
    clearSelection: vi.fn()
  }

  const store = { players, selection, matches: { match: shallowRef(activeMatch) } }
  hoisted.store = store
  return { store, player, activeMatch }
}

const mountWith = (props: Record<string, unknown>) =>
  mount(StatsOptions, { props, global: { stubs: { StatsOverview: true } } })

const clickText = async (wrapper: ReturnType<typeof mountWith>, text: string) => {
  const btn = wrapper.findAll('button').find((b) => b.text().includes(text))
  if (!btn) throw new Error(`button "${text}" not found`)
  await btn.trigger('click')
  await nextTick()
}

const shotOf = (store: ReturnType<typeof buildStore>['store']) =>
  (store.players.addShotToPlayer as unknown as { mock: { calls: unknown[][] } }).mock
    .calls[0]![1] as { result: string }

beforeEach(() => {
  resetIds()
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(undefined)
  vi.stubGlobal('$fetch', fetchMock)
})

describe('StatsOptions — field-player stat grid', () => {
  const fieldProps = (player: unknown) => ({
    goalkeeperSelected: false,
    shootingArea: null,
    shootingTarget: null,
    player
  })

  it('DEFENSE press records defense, raises value and POSTs to the API', async () => {
    const { store, player } = buildStore()
    const wrapper = mountWith(fieldProps(player))

    await clickText(wrapper, 'DEFENSE')

    expect(store.players.increasePlayerStat).toHaveBeenCalledWith(player, 'defense')
    expect(player.currentStats?.defense).toBe(1)
    expect(player.currentStats?.value).toBe(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/stats', expect.objectContaining({ method: 'POST' }))
  })

  it.each([
    ['LOST BALL', 'lostball', -1],
    ['1-1 LOST', '1on1lost', -1],
    ['PENALTY', 'penaltymade', -1],
    ['NO REB', 'norebound', -1]
  ])('%s press records %s and changes value by %d', async (label, stat, delta) => {
    const { store, player } = buildStore()
    const wrapper = mountWith(fieldProps(player))

    await clickText(wrapper, label)

    expect(store.players.increasePlayerStat).toHaveBeenCalledWith(player, stat)
    expect(player.currentStats?.[stat as 'defense']).toBe(1)
    expect(player.currentStats?.value).toBe(delta)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('GOAL LD press records an empty-net goal (goal_empty), scores home and raises value', async () => {
    const { store, player, activeMatch } = buildStore()
    const wrapper = mountWith(fieldProps(player))

    await clickText(wrapper, 'GOAL LD')

    expect(store.players.addShotToPlayer).toHaveBeenCalled()
    expect(shotOf(store).result).toBe('goal_empty')
    expect(activeMatch.increaseMatchScore).toHaveBeenCalledWith('home')
    expect(player.currentStats?.goal_empty).toBe(1)
    expect(player.currentStats?.value).toBe(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/shots', expect.objectContaining({ method: 'POST' }))
  })

  it('2 MIN press records twominutes and adds a home suspension slot', async () => {
    const { store, player, activeMatch } = buildStore()
    const wrapper = mountWith(fieldProps(player))

    await clickText(wrapper, '2 MIN')

    expect(store.players.increasePlayerStat).toHaveBeenCalledWith(player, 'twominutes')
    expect(player.hasTwoMinutes).toBe(true)
    expect(activeMatch.addTwoMinute).toHaveBeenCalledWith(7, 'home')
  })

  it('DEFENSE+ submenu records defensex2 / steal / block', async () => {
    const { store, player, activeMatch } = buildStore()
    const wrapper = mountWith(fieldProps(player))

    await clickText(wrapper, 'DEFENSE+')
    const menuButton = (i: number) => wrapper.find('.z-50').findAll('button')[i]!

    await menuButton(0).trigger('click') // EXTRA -> defensex2
    await nextTick()
    expect(store.players.increasePlayerStat).toHaveBeenCalledWith(player, 'defensex2')

    await menuButton(1).trigger('click') // STEAL
    await nextTick()
    expect(store.players.increasePlayerStat).toHaveBeenCalledWith(player, 'steal')

    await menuButton(2).trigger('click') // BLOCK -> opponent suspension
    await nextTick()
    expect(store.players.increasePlayerStat).toHaveBeenCalledWith(player, 'block')
    expect(activeMatch.addTwoMinute).toHaveBeenCalledWith(7, 'away')
  })

  it('PROVOKE submenu records provokePenalty and provokeTwoMin', async () => {
    const { store, player, activeMatch } = buildStore()
    const wrapper = mountWith(fieldProps(player))

    await clickText(wrapper, 'PROVOKE')
    await clickText(wrapper, 'Penalty')
    expect(store.players.increasePlayerStat).toHaveBeenCalledWith(player, 'provokePenalty')

    await clickText(wrapper, 'PROVOKE')
    await clickText(wrapper, '2 MIN')
    expect(store.players.increasePlayerStat).toHaveBeenCalledWith(player, 'provokeTwoMin')
    expect(activeMatch.addTwoMinute).toHaveBeenCalledWith(7, 'away')
  })

  it('the first CARD (yellow) press records yellowcard', async () => {
    const { store, player } = buildStore()
    const wrapper = mountWith(fieldProps(player))
    await clickText(wrapper, 'CARD')
    expect(store.players.increasePlayerStat).toHaveBeenCalledWith(player, 'yellowcard')
  })
})

describe('StatsOptions — shot card', () => {
  const shotProps = (player: unknown) => ({
    goalkeeperSelected: false,
    shootingArea: 'CB9',
    shootingTarget: ShootingTarget.GOAL_MIDDLE_MIDDLE,
    player
  })

  it('GOAL press records a goal shot, scores home and raises value', async () => {
    const { store, player, activeMatch } = buildStore()
    const wrapper = mountWith(shotProps(player))

    await clickText(wrapper, 'GOAL')

    expect(store.players.addShotToPlayer).toHaveBeenCalled()
    expect(shotOf(store).result).toBe('goal')
    expect(activeMatch.increaseMatchScore).toHaveBeenCalledWith('home')
    expect(player.currentStats?.goal).toBe(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/shots', expect.objectContaining({ method: 'POST' }))
  })

  it('MISS press records a miss shot without scoring', async () => {
    const { store, player, activeMatch } = buildStore()
    const wrapper = mountWith(shotProps(player))

    await clickText(wrapper, 'MISS')

    expect(shotOf(store).result).toBe('miss')
    expect(activeMatch.increaseMatchScore).not.toHaveBeenCalled()
    expect(player.currentStats?.miss).toBe(1)
  })
})

describe('StatsOptions — goalkeeper grid', () => {
  const gkProps = (player: unknown) => ({
    goalkeeperSelected: true,
    shootingArea: null,
    shootingTarget: null,
    player
  })

  it('GK GOAL records an empty-net goal shot', async () => {
    const { store, player } = buildStore()
    const wrapper = mountWith(gkProps(player))
    await clickText(wrapper, 'GOAL')
    expect(shotOf(store).result).toBe('goal_empty')
  })

  it('GK EMPTY GOAL records a conceded empty-net goal and scores the opponent', async () => {
    const { store, activeMatch } = buildStore()
    const wrapper = mountWith(gkProps(store.selection.player.value))
    await clickText(wrapper, 'EMPTY GOAL')
    expect(shotOf(store).result).toBe('gkmiss_empty')
    expect(activeMatch.increaseMatchScore).toHaveBeenCalledWith('away')
  })
})
