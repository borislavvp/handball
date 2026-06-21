import { describe, expect, it } from 'vitest'
import {
  computeAttackDefenseStatsByPosition,
  emptyStats,
  shootingGridToHeatmapCells
} from './pdfShooting'
import type { ShootingGrid } from '~/types/pdf'
import { makeShot } from '~/tests/helpers/factories'

describe('shootingGridToHeatmapCells', () => {
  it('places each of the 9 squares at its court-normalized centre', () => {
    const grid: ShootingGrid = {
      squares: Array.from({ length: 9 }, (_, i) => ({ scored: i, total: i + 1 }))
    }
    const cells = shootingGridToHeatmapCells(grid)
    expect(cells).toHaveLength(9)
    expect(cells[0]).toEqual({ x: 16.5, y: 16.5, attempts: 1, goals: 0 })
    expect(cells[4]).toEqual({ x: 49.5, y: 49.5, attempts: 5, goals: 4 }) // row 1, col 1
    expect(cells[8]).toEqual({ x: 82.5, y: 82.5, attempts: 9, goals: 8 }) // row 2, col 2
  })
})

describe('computeAttackDefenseStatsByPosition', () => {
  it('splits attack (goal/miss) and defense (gksave/gkmiss) per position', () => {
    const shots = [
      makeShot({ from: 'CB9', result: 'goal' }),
      makeShot({ from: 'CB9', result: 'miss' }),
      makeShot({ from: 'LW', result: 'gksave' }),
      makeShot({ from: 'LW', result: 'gkmiss' }),
      makeShot({ from: 'CB9', result: 'block' }) // counts toward neither
    ]
    const { attack, defense } = computeAttackDefenseStatsByPosition(shots)
    expect(attack.CB9).toEqual({ scored: 1, total: 2 })
    expect(defense.LW).toEqual({ scored: 1, total: 2 })
    expect(attack.LW).toEqual({ scored: 0, total: 0 })
  })

  it('emptyStats seeds every position at zero', () => {
    const stats = emptyStats()
    expect(stats.CB9).toEqual({ scored: 0, total: 0 })
    expect(Object.keys(stats)).toContain('7M')
  })
})
