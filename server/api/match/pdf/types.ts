import { MATCH_EVENTS, ShootingTarget } from "~/types/handball";

export interface PlayerRow {
  id: number;
  number: number;
  name: string;
  value: number;
  goalsTotal: number;
  attempts: number;
  efficiency: number;
  by9m: { scored: number; total: number };
  by6m: { scored: number; total: number };
  byWing: { scored: number; total: number };
  by7m: { scored: number; total: number };
  fastbreak: { scored: number; total: number };
  oneOnOne: { scored: number; total: number };
  assistsPrimary: number;
  assistsSecondary: number;
  provoked7m: number;
  provoked2m: number;
  lostballs: number;
  steals: number;
  blocks: number;
  norebounds: number;
  penaltiesMade: number;
  oneOnOneLost: number;
  defense: number;
  defenseAndSteal: number;
  yellow: number;
  twoMinutes: number;
  red: number;
  blue: number;
}

export interface GoalkeeperRow {
  id: number;
  number: number;
  name: string;
  value: number;
  totalSaves: number;
  attempts: number;
  efficiency: number;
  by9m: { saved: number; total: number };
  by6m: { saved: number; total: number };
  byWing: { saved: number; total: number };
  by7m: { saved: number; total: number };
  fastbreak: { saved: number; total: number };
}

export interface DefenseBucket {
  shots: { total: number; scored: number };
  by9m: { total: number; scored: number };
  by6m: { total: number; scored: number };
  by7m: { total: number; scored: number };
  byWing: { total: number; scored: number };
  provoked7m: number;
  provoked2m: number;
}

export interface DefenseTypeBucket {
  shots: { total: number; saved: number };
  by9m: { total: number; saved: number };
  by6m: { total: number; saved: number };
  byWing: { total: number; saved: number };
  steals: number;
  commitedSeven: number;
  twoMinutesCommitted: number;
}

export interface ShootingGrid {
  squares: Array<{ scored: number; total: number }>;
  missed?: { left: number; top: number; right: number };
}

export interface AreaStats {
  goals: number;
  saved: number;
  out: number;
  block: number;
  total: number;
  percent: number;
}

export type MatchEvents = {
    created_at: string;
    event: MATCH_EVENTS;
    id: number;
    matchid: number;
    metadata: string | null;
    playerid: number | null;
    time: string;
}[]

// ==================== CONSTANTS & CONFIG ====================

export const SHOOTING_AREAS = ["Back (9M)", "Line (6M)", "Wing", "7M Penalties", "Fastbreak"] as const;

export const PDF_CONFIG = {
  size: "A4" as const,
  margin: 18,
  fontSizes: {
    title: 14,
    header: 10,
    table: 7.5,
    small: 7,
  },
  colors: {
    text: '#000000',
    border: '#CCCCCC'
  }
} as const;

export interface DefenseBucket {
  shots: { total: number; scored: number };
  by9m: { total: number; scored: number };
  by6m: { total: number; scored: number };
  by7m: { total: number; scored: number };
  byWing: { total: number; scored: number };
  provoked7m: number;
  provoked2m: number;
}

export interface DefenseTypeBucket {
  shots: { total: number; saved: number };
  by9m: { total: number; saved: number };
  by6m: { total: number; saved: number };
  byWing: { total: number; saved: number };
  steals: number;
  commitedSeven: number;
  twoMinutesCommitted: number;
}

export interface ScoreEvent {
  time: string; // MM:SS format
  team: 'home' | 'away';
}

export interface ScoreAtMinute {
  minute: number;
  homeScore: number;
  awayScore: number;
  difference: number; // home - away
}