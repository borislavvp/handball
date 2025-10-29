export type Orientation = 'vertical' | 'horizontal';

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
  currentShots?: Shot[];
  currentStats?: {[key in Stats]: number;} & { value: number; };
  recentStats:PlayerStats[]
}

export interface Team {
  id: number;
  name: string;
  players: Player[];
}

export interface Match {
  id: number;
  opponent: string;
  teamid: number;
  result: "WIN" | "LOST" | "FINISHED" | null;
  score: number;
  opponentScore: number;
  createdat?: string;
  shots: Shot[];
}
export type CurrentMatch  = Match & {
  time: string;
  playing: boolean;
  timeoutsLeft: number;
  defenseSystem: DefenseSystem;
  opponentDefenseSystem: DefenseSystem;
  emptyGoal: boolean;
}

export type DefenseSystem = "6:0" | "5:1" | "3:2:1" | "4:2" | "1:1"

export type ShootingArea = 'LW' | "LB9" | "LB6" | "CB9" | "CB6" | "RB6" | "RB9" | "RW" | "7M";

export enum ShootingTarget {
  OUT_TOP = 0,
  GOAL_TOP_LEFT = 1,
  GOAL_TOP_MIDDLE = 2,
  GOAL_TOP_RIGHT = 3,
  GOAL_MIDDLE_LEFT = 4,
  GOAL_MIDDLE_MIDDLE = 5,
  GOAL_MIDDLE_RIGHT = 6,
  GOAL_BOTTOM_LEFT = 7,
  GOAL_BOTTOM_MIDDLE = 8,
  GOAL_BOTTOM_RIGHT = 9,
  OUT_LEFT = 10,
  OUT_RIGHT = 11,
} 
export type Shot = {
  from: ShootingArea;
  to: ShootingTarget;
  result: ShootingResult;
  time: string;
}
export type ShootingResult = 'goal' | 'miss' | 'block' | 'gksave' | 'gkmiss';

export type MATCH_EVENTS = 'timeout' | 'defense_change' | "opponent_defense_change" | 'empty_goal' | 'playing' | Stats;

export type Stats = "goal" |
"assist"|
"1on1win"|
"unbalance"|
"provoke"|
"miss"|
"block"|
"1on1lost"|
"norebound"|
"lostball"|
"steal"|
"defense"|
"defensex2"|
"1on1lost"|
"penaltymade"|
"twominutes"|
"card"|
"gksave"|
"gkmiss"

export type PlayerStats = {
  [key in Stats]: number;
} & {
  // Field player: Goals - Misses + ((Assist + Unbalance + Provokes + 1-1 Win) - Lost balls) + Defense)
  // // Defense: (Steals + Blocks + Defense + Defenese x2) - 1-1 Lost - Penalty Made - No Rebound - Suspensions
  // Goalkeeper: (Saves/Total)*100 ,  Field Player Value
  value: number;
  match: {
    id: number;
    opponent: string;
    result: string | null;
    score: number;
    opponentScore: number;
    timeoutsLeft: number;
    createdAt?: string;
    shots: Shot[];
  };
};


