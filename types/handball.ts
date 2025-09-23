export const AttackPosValues = [
  'LW',
  'LB',
  'CB',
  'RB',
  'RW',
  'PV',
  'PV2',
] as const;

export const DefensePosValues = [
  'D1' , 'D2' , 'D3' , 'D4' , 'D5' , 'D6' , 'GK'
] as const;

export type AttackPosKey = typeof AttackPosValues[number]

export type DefensePosKey = typeof DefensePosValues[number]



export type Position = {
  key:AttackPosKey|DefensePosKey;
  label: string; 
  x: number; 
  y: number
}

export interface Player {
  id: number;
  name: string;
  number: number;
  position: Position["key"];
  stats:PlayerStats[]
}

export interface Team {
  id: number;
  name: string;
  players: Player[];
  // Default players for each position (by player id)
  lineups: MatchLineup[]
}
export type MatchLineup = {
  id:number,
  D1?: number
  D2?: number
  D3?: number
  D4?: number
  D5?: number
  D6?: number
  GK?: number
  CB?: number
  LB?: number
  LW?: number
  PV?: number
  PV2?: number
  RB?: number
  RW?: number
}

export interface Match {
  id: number;
  opponent: string;
  teamid: number;
  result: "WIN" | "LOST" | null;
  lineup: MatchLineup;
  createdat?: string;
}

export type Orientation = 'vertical' | 'horizontal';

export type Stats = "goal"|
  "miss"|
  "goodpass"|
  "badpass"|
  "safe"|
  "gooddefense"|
  "baddefense"|
  "penaltymade"|
  "penaltyscored"|
  "intercept"|
  "twominutes"|
  "yellowcard" |
  "redcard" |
  "lostball"

export type PlayerStats = {
  goal:number,
  miss:number,
  goodpass:number,
  badpass:number,
  safe:number
  gooddefense:number,
  baddefense:number,
  penaltymade:number,
  penaltyscored:number,
  intercept:number,
  lostball:number,
  twominutes:number,
  yellowcard:number,
  redcard:number,
  match:{
    id: number,
    opponent: string,
    result: string | null,
    createdat?: string 
  }
}
