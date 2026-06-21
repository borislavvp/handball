import type { PlayerStats, Player, ShootingArea, Stats } from "~/types/handball";

// Season-level aggregation over already-hydrated `player.recentStats`.
//
// These are PURE functions (no reactive state, no fetching). They intentionally
// duplicate the small attack/defense/gk percentage formulas from
// `composables/useStats.ts` rather than import them, so the live stat-recording
// path stays untouched. `PlayerStats` and `PlayerCurrentStats` share the same
// `{ [key in Stats]: number }` shape, so the formulas apply directly.

// A numeric view of a stat row — both PlayerStats and PlayerCurrentStats satisfy this.
type StatLike = { [key in Stats]: number };

export function attackPercent(s: StatLike): number {
  const positive =
    s.goal + s.assistprimary + s.assistsecondary + s.provokeCard +
    s.provokePenalty + s.provokeTwoMin + s["1on1win"];
  const negative = s.miss + s.lostball;
  if (positive + negative === 0) return 0;
  return Math.round((positive / (positive + negative)) * 100);
}

export function defensePercent(s: StatLike): number {
  const positive = s.steal + s.block + s.defense + s.defensex2;
  const negative =
    s["1on1lost"] + s.penaltymade + s.norebound + s.twominutes + s.redcard + s.bluecard;
  if (positive + negative === 0) return 0;
  return Math.round((positive / (positive + negative)) * 100);
}

export function gkSavesPercent(s: StatLike): number {
  const total = s.gksave + s.gkmiss;
  if (total === 0) return 0;
  return Math.round((s.gksave / total) * 100);
}

// All numeric stat keys, used to sum rows together.
const STAT_KEYS: Stats[] = [
  "goal", "goal_empty", "gkmiss_empty", "assistprimary", "assistsecondary",
  "1on1win", "provokePenalty", "provokeTwoMin", "provokeCard", "miss", "block",
  "1on1lost", "norebound", "lostball", "steal", "defense", "defensex2",
  "penaltymade", "twominutes", "yellowcard", "redcard", "bluecard", "gksave",
  "gkmiss"
];

function emptyTotals(): StatLike {
  const out = {} as StatLike;
  for (const k of STAT_KEYS) out[k] = 0;
  return out;
}

function addInto(target: StatLike, row: PlayerStats) {
  for (const k of STAT_KEYS) target[k] += row[k] ?? 0;
}

export type SeasonTrendPoint = {
  matchId: number;
  label: string; // opponent name (short)
  value: number;
  efficiency: number; // shooting goal % for that match
};

export type FormDirection = "up" | "down" | "flat";

export type PlayerForm = {
  window: number; // how many recent matches were averaged
  recentAvgValue: number; // avg value over the last `window` matches, 1 decimal
  delta: number; // recentAvgValue - seasonAvgValue, 1 decimal
  direction: FormDirection;
};

export type PlayerSeason = {
  matches: number;
  totals: StatLike;
  totalValue: number;
  avgValue: number; // value per match, 1 decimal
  goalsPerGame: number; // 1 decimal
  efficiency: number; // season goal / (goal + miss) %
  attack: number; // season attack %
  defense: number; // season defense %
  gkSaves: number; // season save %
  bestZone: { area: ShootingArea; goalRate: number; attempts: number } | null;
  form: PlayerForm | null; // recent-form vs season, null when too few matches
  trend: SeasonTrendPoint[]; // ordered by match id (chronological)
};

const FORM_WINDOW = 3;
// Below this absolute delta, form is treated as flat (avoids noisy arrows).
const FORM_FLAT_THRESHOLD = 0.5;

// Recent form: average value over the last N matches compared to the season
// average. Returns null when there aren't enough matches for a meaningful
// recent window to differ from the season.
function computeForm(trend: SeasonTrendPoint[], seasonAvgValue: number): PlayerForm | null {
  if (trend.length <= FORM_WINDOW) return null;
  const window = Math.min(FORM_WINDOW, trend.length);
  const recent = trend.slice(-window);
  const recentTotal = recent.reduce((sum, p) => sum + p.value, 0);
  const recentAvgValue = Math.round((recentTotal / window) * 10) / 10;
  const delta = Math.round((recentAvgValue - seasonAvgValue) * 10) / 10;
  let direction: FormDirection = "flat";
  if (delta >= FORM_FLAT_THRESHOLD) direction = "up";
  else if (delta <= -FORM_FLAT_THRESHOLD) direction = "down";
  return { window, recentAvgValue, delta, direction };
}

const SHOT_AREAS: ShootingArea[] = [
  "LW", "LB9", "LB6", "CB9", "CB6", "RB6", "RB9", "RW", "7M"
];

// Best scoring zone for a player across the season, derived from their own
// shots in each match's `shots` array (a shot belongs to the player when
// `shot.playerid === playerId`).
function computeBestZone(stats: PlayerStats[], playerId: number) {
  const byArea = new Map<ShootingArea, { attempts: number; goals: number }>();
  for (const row of stats) {
    for (const shot of row.match?.shots ?? []) {
      if (shot.playerid !== playerId) continue;
      // Only count genuine field attempts (exclude GK-perspective rows).
      if (!SHOT_AREAS.includes(shot.from)) continue;
      const isGoal = shot.result === "goal" || shot.result === "goal_empty";
      const isAttempt = isGoal || shot.result === "miss" || shot.result === "block" || shot.result === "gksave";
      if (!isAttempt) continue;
      const cur = byArea.get(shot.from) ?? { attempts: 0, goals: 0 };
      cur.attempts += 1;
      if (isGoal) cur.goals += 1;
      byArea.set(shot.from, cur);
    }
  }
  let best: { area: ShootingArea; goalRate: number; attempts: number } | null = null;
  for (const [area, agg] of byArea) {
    if (agg.attempts < 2) continue; // need a minimal sample to be meaningful
    const goalRate = Math.round((agg.goals / agg.attempts) * 100);
    if (!best || goalRate > best.goalRate) {
      best = { area, goalRate, attempts: agg.attempts };
    }
  }
  return best;
}

export function aggregatePlayerSeason(stats: PlayerStats[], playerId: number): PlayerSeason {
  const ordered = [...stats].sort((a, b) => a.match.id - b.match.id);
  const totals = emptyTotals();
  let totalValue = 0;
  const trend: SeasonTrendPoint[] = [];

  for (const row of ordered) {
    addInto(totals, row);
    totalValue += row.value ?? 0;
    const attempts = (row.goal ?? 0) + (row.miss ?? 0);
    const efficiency = attempts === 0 ? 0 : Math.round((row.goal / attempts) * 100);
    trend.push({
      matchId: row.match.id,
      label: row.match.opponent,
      value: row.value ?? 0,
      efficiency
    });
  }

  const matches = ordered.length;
  const seasonAttempts = totals.goal + totals.miss;
  const avgValue = matches ? Math.round((totalValue / matches) * 10) / 10 : 0;

  return {
    matches,
    totals,
    totalValue,
    avgValue,
    goalsPerGame: matches ? Math.round((totals.goal / matches) * 10) / 10 : 0,
    efficiency: seasonAttempts ? Math.round((totals.goal / seasonAttempts) * 100) : 0,
    attack: attackPercent(totals),
    defense: defensePercent(totals),
    gkSaves: gkSavesPercent(totals),
    bestZone: computeBestZone(ordered, playerId),
    form: computeForm(trend, avgValue),
    trend
  };
}

export type TeamSeason = {
  matchesPlayed: number; // finished matches only
  wins: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  attack: number;
  defense: number;
  gkSaves: number;
};

// Team-level season summary. Per-match scores are read once per unique match
// (every player carries the same `match` snapshot in their recentStats), so we
// dedupe by match id for record/goals while summing stat rows across all players.
export function computeTeamSeason(players: Player[]): TeamSeason {
  const totals = emptyTotals();
  const matchSeen = new Map<number, { result: string | null; score: number; opponentScore: number }>();

  for (const player of players) {
    for (const row of player.recentStats ?? []) {
      addInto(totals, row);
      if (!matchSeen.has(row.match.id)) {
        matchSeen.set(row.match.id, {
          result: row.match.result,
          score: row.match.score ?? 0,
          opponentScore: row.match.opponentScore ?? 0
        });
      }
    }
  }

  let wins = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let matchesPlayed = 0;
  for (const m of matchSeen.values()) {
    goalsFor += m.score;
    goalsAgainst += m.opponentScore;
    if (m.result === "WIN") {
      wins += 1;
      matchesPlayed += 1;
    } else if (m.result === "LOST") {
      losses += 1;
      matchesPlayed += 1;
    } else if (m.result === "FINISHED") {
      matchesPlayed += 1;
    }
  }

  return {
    matchesPlayed,
    wins,
    losses,
    goalsFor,
    goalsAgainst,
    attack: attackPercent(totals),
    defense: defensePercent(totals),
    gkSaves: gkSavesPercent(totals)
  };
}

// Human-friendly area labels for display.
export const AREA_LABELS: Record<ShootingArea, string> = {
  LW: "Left Wing",
  LB9: "Left Back 9m",
  LB6: "Left Back 6m",
  CB9: "Center 9m",
  CB6: "Center 6m",
  RB6: "Right Back 6m",
  RB9: "Right Back 9m",
  RW: "Right Wing",
  "7M": "7m"
};
