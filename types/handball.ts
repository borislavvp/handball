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
  id: string;
  name: string;
  number: number;
  position: Position["key"];
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  // Default players for each position (by player id)
  defaults?: Partial<Record<Position["key"], string | null>>;
}
export type MatchLineup = {
  [key in Position["key"]] : Player["id"] | null
}

export interface Match {
  id: string;
  name: string;
  teamId: string;
  lineup: MatchLineup;
  createdAt: number;
}

export type Orientation = 'vertical' | 'horizontal';


