import type { Position, Stats } from "./handball"

// Request bodies
export interface CreateTeamBody {
    name: string
}

export interface CreatePlayerBody {
    name: string
    number: number
    teamId: number
    position?: Position["key"] 
}
  
export interface UpdateMatchBody {
    matchId: number
    result: "WIN" | "LOST"
}
export interface CreateMatchBody {
    opponent: string
    teamId: number
}

export interface CreateStatsBody {
    matchId: number
    playerId: number
}

export interface IncreaseStatBody {
    matchId: number
    playerId: number
    statType: Stats
}
  
export type LineupChangeBody = {
    lineupId: number;
    teamId: number;
    position: Position["key"] | "PV2";
    playerId: number
}