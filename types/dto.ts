import type { MATCH_EVENTS, Position, ShootingArea, ShootingResult, ShootingTarget, Shot, Stats } from "./handball"

// Request bodies
export interface CreateTeamBody {
    name: string
}

export interface CreatePlayerBody {
    name: string
    number: number
    teamId: number
    position: Position["key"] 
}
  
export interface UpdateMatchBody {
    result: "WIN" | "LOST"
}
export interface CreateMatchBody {
    opponent: string
    teamId: number
}

export interface CreateStatsBody {
    matchId: number,
    playerId: number,
    statType: Stats,
    time: string;
}

export interface IncreaseStatBody {
    matchId: number;
    playerId: number;
    statType: Stats;
    time: string;
}
  
export type LineupChangeBody = {
    lineupId: number;
    teamId: number;
    position: Position["key"] | "PV2";
    playerId: number
}

export type MatchEventBody = {
    matchId: number;
    eventType: MATCH_EVENTS;
    playerId?: number;
    time: string;
    metadata?: any;
}

export type GeneralMatchBody = {
    matchId: number;
}

export type ShotsBody = {
    matchId: number;
    playerId: number;
    shot: Shot;
}