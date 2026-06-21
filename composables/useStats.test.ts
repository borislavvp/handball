import { describe, expect, it } from 'vitest'
import { computed, ref } from 'vue'
import { useStats } from './useStats'
import { usePlayer } from './usePlayer'
import type { GameSelection } from './useSelection'
import type { Player, PlayerCurrentStats, Team } from '~/types/handball'
import { makePlayer, makePlayerDeps, makeTeam } from '~/tests/helpers/factories'

const baseStats = (overrides: Partial<PlayerCurrentStats> = {}): PlayerCurrentStats => {
  const deps = makePlayerDeps([makePlayer()])
  const stats = usePlayer(deps.loadingState, deps.teamRef, deps.matchRef).initPlayerStats()
  return Object.assign(stats, overrides)
}

const playerWith = (overrides: Partial<PlayerCurrentStats>): Player =>
  makePlayer({ currentStats: baseStats(overrides) })

// useStats only ever reads selection.player.value, so a minimal stub suffices.
const selectionFor = (player: Player | null) =>
  ({ player: ref(player) } as unknown as GameSelection)

const teamRef = (players: Player[]) =>
  computed(() => makeTeam(players)) as unknown as Parameters<typeof useStats>[1]

describe('useStats — selected player', () => {
  it('attackValue = goals / (goals + misses), rounded', () => {
    const player = playerWith({ goal: 2, miss: 2 })
    const { attackValue } = useStats(selectionFor(player), teamRef([player]))
    expect(attackValue.value).toBe(50)
  })

  it('attackValue rounds to the nearest percent', () => {
    const player = playerWith({ goal: 2, miss: 1 }) // 2/3 = 66.66 -> 67
    const { attackValue } = useStats(selectionFor(player), teamRef([player]))
    expect(attackValue.value).toBe(67)
  })

  it('attackValue is 0 when the player has taken no attacking actions', () => {
    const player = playerWith({})
    const { attackValue } = useStats(selectionFor(player), teamRef([player]))
    expect(attackValue.value).toBe(0)
  })

  it('defenseValue = positives / (positives + negatives)', () => {
    const player = playerWith({ steal: 2, block: 1, '1on1lost': 1 }) // 3 / 4 = 75
    const { defenseValue } = useStats(selectionFor(player), teamRef([player]))
    expect(defenseValue.value).toBe(75)
  })

  it('gkSavesValue = saves / (saves + conceded)', () => {
    const player = playerWith({ gksave: 3, gkmiss: 1 }) // 3/4 = 75
    const { gkSavesValue } = useStats(selectionFor(player), teamRef([player]))
    expect(gkSavesValue.value).toBe(75)
  })

  it('gkSavesValue is 0 with no goalkeeping actions (no divide-by-zero)', () => {
    const player = playerWith({})
    const { gkSavesValue } = useStats(selectionFor(player), teamRef([player]))
    expect(gkSavesValue.value).toBe(0)
  })

  it('returns the -1 sentinel when the selected player has no stats yet', () => {
    const player = makePlayer({ currentStats: undefined })
    const { attackValue } = useStats(selectionFor(player), teamRef([player]))
    expect(attackValue.value).toBe(-1)
  })
})

describe('useStats — whole team (no player selected)', () => {
  it('aggregates attack across the roster', () => {
    const players = [
      playerWith({ goal: 2 }),
      playerWith({ goal: 1, miss: 1 })
    ]
    const { attackValue } = useStats(selectionFor(null), teamRef(players)) // 3 / 4 = 75
    expect(attackValue.value).toBe(75)
  })

  it('aggregates defense across the roster and ignores statless players', () => {
    const players = [
      playerWith({ steal: 1, defense: 1 }),
      makePlayer({ currentStats: undefined }),
      playerWith({ penaltymade: 1 })
    ]
    const { defenseValue } = useStats(selectionFor(null), teamRef(players)) // 2 / 3 = 67
    expect(defenseValue.value).toBe(67)
  })

  it('aggregates goalkeeper saves, skipping keepers who faced nothing', () => {
    const players = [
      playerWith({ gksave: 4, gkmiss: 1 }),
      playerWith({}) // faced 0 shots -> excluded
    ]
    const { gkSavesValue } = useStats(selectionFor(null), teamRef(players)) // 4 / 5 = 80
    expect(gkSavesValue.value).toBe(80)
  })

  it('returns 0 for an empty team', () => {
    const { attackValue, defenseValue, gkSavesValue } = useStats(
      selectionFor(null),
      teamRef([])
    )
    expect(attackValue.value).toBe(0)
    expect(defenseValue.value).toBe(0)
    expect(gkSavesValue.value).toBe(0)
  })
})
