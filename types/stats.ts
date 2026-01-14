// types/stats.ts

export type TeamSide = "home" | "away"
export type Phase = "attack" | "defense"

export type ShotZone =
  | "LW"
  | "LB"
  | "CB"
  | "RB"
  | "RW"
  | "PIVOT"
  | "FAST_BREAK"
  | "7M"

export interface ShootingTabStats {
  totalPlayerGrid: ShootingHeatmapCell[]
  totalGoalkeeperGrid: ShootingHeatmapCell[]
}

export interface Shot {
  playerId: string
  zone: ShotZone
  x: number        // 0–100 (court normalized)
  y: number        // 0–100
  scored: boolean
  isFastBreak: boolean
  is7m: boolean
}

export interface GoalkeeperStat {
  goalkeeperId: string
  saves: number
  shotsAgainst: number
  savePercentage: number
  saves7m: number
}

export interface DefenseStat {
  blocks: number
  steals: number
  fouls: number
}

export interface SuperiorityStat {
  situation: "7v6" | "6v6" | "6v5" | "5v6"
  goalsFor: number
  goalsAgainst: number
}

export interface MiniStat {
  label: string
  value: number | string
}

export interface ShootingHeatmapCell {
  x: number
  y: number
  attempts: number
  goals: number
}
