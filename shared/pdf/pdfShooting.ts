
/* ----------------------------------------
   TYPES
---------------------------------------- */

import type { ShootingArea, Shot } from "~/types/handball"
import type { ShootingGrid } from "~/types/pdf"
import type { ShootingHeatmapCell } from "~/types/stats"

export interface PositionShotStats {
  scored: number
  total: number
}

export type ShootingStatsByPosition = Record<
  ShootingArea,
  PositionShotStats
>

export interface AttackDefenseStats {
  attack: ShootingStatsByPosition
  defense: ShootingStatsByPosition
}

/* ----------------------------------------
   FIELD RELATIVE POSITIONS (FULL FIELD)
---------------------------------------- */

export const ATTACK_FIELD_POSITIONS: Partial<Record<
  ShootingArea,
  { x: number; y: number }
>> = {
  LW:   { x: 0.15, y: 0.10 },
  LB9:  { x: 0.50, y: 0.15 },
  LB6:  { x: 0.27, y: 0.18 },
  CB9:  { x: 0.60, y: 0.42 },
  CB6:  { x: 0.36, y: 0.47 },
  RB6:  { x: 0.30, y: 0.62 },
  RB9:  { x: 0.50, y: 0.65 },
  RW:   { x: 0.15, y: 0.72 },
  // '7M': { x: 0.36, y: 0.35 }
}
export const DEFENSE_FIELD_POSITIONS: Partial<Record<
  ShootingArea,
  { x: number; y: number }
>> = {
  LW:   { x: 0.75, y: 0.10 },
  LB9:  { x: 0.35, y: 0.15 },
  LB6:  { x: 0.60, y: 0.18 },
  CB9:  { x: 0.25, y: 0.45 },
  CB6:  { x: 0.53, y: 0.47 },
  RB6:  { x: 0.60, y: 0.62 },
  RB9:  { x: 0.35, y: 0.65 },
  RW:   { x: 0.75, y: 0.72 },
  // '7M': { x: 0.53, y: 0.35 }
}

export const ALL_POSITIONS: ShootingArea[] = [
  'LW',
  'LB9',
  'LB6',
  'CB9',
  'CB6',
  'RB6',
  'RB9',
  'RW',
  '7M'
]

/* ----------------------------------------
   STATS HELPERS
---------------------------------------- */

export function emptyStats(): ShootingStatsByPosition {
  return ALL_POSITIONS.reduce((acc, pos) => {
    acc[pos] = { scored: 0, total: 0 }
    return acc
  }, {} as ShootingStatsByPosition)
}

/* ----------------------------------------
   COMPUTATION
---------------------------------------- */
/**
 * Converts 3×3 ShootingGrid (PDF logic)
 * → UI heatmap cells (court-normalized)
 */
export function shootingGridToHeatmapCells(
  grid: ShootingGrid
): ShootingHeatmapCell[] {
  return grid.squares.map((square, index) => {
    const col = index % 3
    const row = Math.floor(index / 3)

    return {
      x: col * 33 + 16.5,     // center of square
      y: row * 33 + 16.5,
      attempts: square.total,
      goals: square.scored,
    }
  })
}

export function computeAttackDefenseStatsByPosition(
  shots: Shot[]
): AttackDefenseStats {
  const attack = emptyStats()
  const defense = emptyStats()

  for (const shot of shots) {
    const position = shot.from as ShootingArea
    if (!ALL_POSITIONS.includes(position)) continue

    // ATTACK
    if (shot.result === 'goal' || shot.result === 'miss') {
      attack[position].total++
      if (shot.result === 'goal') {
        attack[position].scored++
      }
    }

    // DEFENSE (goalkeeper saves)
    if (shot.result === 'gksave' || shot.result === 'gkmiss') {
      defense[position].total++
      if (shot.result === 'gksave') {
        defense[position].scored++
      }
    }
  }

  return { attack, defense }
}
