import type { DefenseTypeBucket, GoalkeeperRow, MatchEvents, PlayerRow, AreaStats, DefenseBucket, ShootingGrid } from "~/types/pdf";
import { SHOOTING_AREAS} from "~/types/pdf";
import type { Database } from "~/types/database.types";
import { ShootingTarget, type PlayerStats, type ShootingArea, type Shot } from "~/types/handball";

export function calculateEfficiency(scored: number, total: number): number {
  return total ? Math.round((scored / total) * 100) : 0;
}

export function labelShootingArea(area: ShootingArea): string {
  if (!area) return "other";
  if (area === "7M") return "7M";
  if (area === "LW" || area === "RW") return "Wing";
  if (area.endsWith("9")) return "9M";
  if (area.endsWith("6")) return "6M";
  return "other";
}

export function getAreaMapping(area: ShootingArea): string {
  switch (area) {
    case "LW":
    case "RW":
      return "Wing";
    case "LB9":
    case "CB9":
    case "RB9":
      return "Back (9M)";
    case "LB6":
    case "CB6":
    case "RB6":
      return "Line (6M)";
    case "7M":
      return "7M Penalties";
    default:
      return "other";
  }
}

export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  
  // Handle MM:SS format
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]!, 10) || 0;
    const seconds = parseInt(parts[1]!, 10) || 0;
    return minutes * 60 + seconds;
  }
  
  return 0;
}

export async  function fetchMatchData(matchId: number) {
  
  const { $supabase } = useNuxtApp()
  const { data: matchData, error: matchError } = await $supabase
    .from("match")
    .select("*, team(name)")
    .eq("id", matchId)
    .single();
  
  if (!matchData || matchError) {
    throw createError({ 
      statusCode: 404, 
      statusMessage: "Match not found" 
    });
  }
  
  const teamId = matchData.teamid;
  
  const [players, playerStats, shotsRaw, events] = await Promise.all([
    $supabase.from("player").select("*").eq("teamid", teamId),
    $supabase.from("player_stats").select("*").eq("matchid", matchId),
    $supabase.from("shots").select("*").eq("matchid", matchId),
    $supabase.from("match_event").select("*").eq("matchid", matchId),
  ]);
  
  return {
    match: matchData,
    players: players.data || [],
    playerStats: playerStats.data || [],
    shots: shotsRaw.data || [],
    events: events.data || [],
  };
}

export function processPlayerStats(
  players: Database["public"]['Tables']['player']['Row'][],
  playerStatsMap: Map<number, Partial<PlayerStats>>,
  shots: Shot[]
): PlayerRow[] {
  return players
    .filter(p => p.position !== 'GK')
    .map(player => {
      const playerShots = shots.filter(s => s.playerid === player.id);
      const playerStat = playerStatsMap.get(player.id) || {};
      
      return calculatePlayerRow(player, playerShots, playerStat);
    });
}

export function calculatePlayerRow(
  player: Database["public"]['Tables']['player']['Row'],
  playerShots: Shot[],
  playerStat: Partial<PlayerStats>
): PlayerRow {
  const attempts = playerShots.length;
  const goalsTotal = playerShots.filter(s => s.result === 'goal').length;
  const efficiency = calculateEfficiency(goalsTotal, attempts);
  
  // Initialize position counters
  const counters = {
    by9m: { scored: 0, total: 0 },
    by6m: { scored: 0, total: 0 },
    byWing: { scored: 0, total: 0 },
    by7m: { scored: 0, total: 0 },
    fastbreak: { scored: 0, total: 0 },
    breakthrough: { scored: 0, total: 0 },
  };
  
  // Count shots by position
  playerShots.forEach(shot => {
    const area = labelShootingArea(shot.from);
    const scored = shot.result === 'goal';
    
    switch (area) {
      case "9M":
        counters.by9m.total++;
        if (scored) counters.by9m.scored++;
        break;
      case "6M":
        counters.by6m.total++;
        if (scored) counters.by6m.scored++;
        break;
      case "Wing":
        counters.byWing.total++;
        if (scored) counters.byWing.scored++;
        break;
      case "7M":
        counters.by7m.total++;
        if (scored) counters.by7m.scored++;
        break;
    }
    
    if (shot.fastbreak) {
      counters.fastbreak.total++;
      if (scored) counters.fastbreak.scored++;
    }

    if (shot.breakthrough) {  
      counters.breakthrough.total++;
      if (scored) counters.breakthrough.scored++;
    }
  });
  
  return {
    id: player.id,
    number: player.number,
    name: player.name,
    value: playerStat.value ?? 0,
    goalsTotal,
    attempts,
    efficiency,
    ...counters,
    assistsPrimary: playerStat.assistprimary ?? 0,
    assistsSecondary: playerStat.assistsecondary ?? 0,
    provoked7m: playerStat.provokePenalty ?? 0,
    provoked2m: playerStat.provokeTwoMin ?? 0,
    provokedCard: playerStat.provokeCard ?? 0,
    lostballs: playerStat.lostball ?? 0,
    steals: playerStat.steal ?? 0,
    blocks: playerStat.block ?? 0,
    norebounds: playerStat.norebound ?? 0,
    penaltiesMade: playerStat.penaltymade ?? 0,
    oneOnOneLost: playerStat["1on1lost"] ?? 0,
    defense: playerStat.defense ?? 0,
    defenseAndSteal: playerStat.defensex2 ?? 0,
    yellow: playerStat.yellowcard ?? 0,
    twoMinutes: playerStat.twominutes ?? 0,
    red: playerStat.redcard ?? 0,
    blue: playerStat.bluecard ?? 0,
  };
}

export function processGoalkeeperStats(
  goalkeepers: Database["public"]['Tables']['player']['Row'][],
  playerStatsMap: Map<number, Partial<PlayerStats>>,
  shots: Shot[]
): GoalkeeperRow[] {
  return goalkeepers.map(gk => {
    const gkShots = shots.filter(s => s.playerid === gk.id);
    const gkStat = playerStatsMap.get(gk.id) || {};
    
    return calculateGoalkeeperRow(gk, gkShots, gkStat);
  });
}
export function calculateGoalkeeperTotals(goalkeepers: GoalkeeperRow[]): GoalkeeperRow {
  return goalkeepers.reduce((acc, gk) => ({
    id: 0,
    name: "Total",
    number: 0,
    value: Math.floor((acc.value + gk.value) / 2),
    assistsPrimary: acc.assistsPrimary + gk.assistsPrimary,
    assistsSecondary: acc.assistsSecondary + gk.assistsSecondary,
    lostball: acc.lostball + gk.lostball,
    totalSaves: acc.totalSaves + gk.totalSaves,
    attempts: acc.attempts + gk.attempts,
    efficiency: Math.floor((acc.efficiency + gk.efficiency) / 2),
    by9m: { saved: acc.by9m.saved + gk.by9m.saved, total: acc.by9m.total + gk.by9m.total },
    by6m: { saved: acc.by6m.saved + gk.by6m.saved, total: acc.by6m.total + gk.by6m.total },
    by7m: { saved: acc.by7m.saved + gk.by7m.saved, total: acc.by7m.total + gk.by7m.total },
    byWing: { saved: acc.byWing.saved + gk.byWing.saved, total: acc.byWing.total + gk.byWing.total },
    fastbreak: { saved: acc.fastbreak.saved + gk.fastbreak.saved, total: acc.fastbreak.total + gk.fastbreak.total },
    breakthrough: { saved: acc.breakthrough.saved + gk.breakthrough.saved, total: acc.breakthrough.total + gk.breakthrough.total },
  }), {
    id: 0,
    name: "",
    number: 0,
    value: 0,assistsPrimary: 0, assistsSecondary:0, lostball:0,
    totalSaves: 0,
    attempts: 0,
    efficiency: 0,
    by9m: { saved: 0, total: 0 },
    by6m: { saved: 0, total: 0 },
    by7m: { saved: 0, total: 0 },
    byWing: { saved: 0, total: 0 },
    fastbreak: { saved: 0, total: 0 },
    breakthrough: { saved: 0, total: 0 },
  });
}

export function calculateTotalShootingDistribution(
  shootingTargets: Map<string, ShootingGrid>,
  isGoalkeeper: boolean
): ShootingGrid {
  const result: ShootingGrid = {
    squares: Array.from({ length: 9 }, () => ({ scored: 0, total: 0 })),
    missed: isGoalkeeper ? undefined : { left: 0, top: 0, right: 0 }
  };
  
  for (const grid of shootingTargets.values()) {
    grid.squares.forEach((square, i) => {
      result.squares[i]!.scored += square.scored;
      result.squares[i]!.total += square.total;
    });
    
    if (!isGoalkeeper && grid.missed) {
      result.missed!.left += grid.missed.left;
      result.missed!.top += grid.missed.top;
      result.missed!.right += grid.missed.right;
    }
  }
  
  return result;
}

export function calculateGoalkeeperRow(
  goalkeeper: Database["public"]['Tables']['player']['Row'],
  goalkeeperShots:Shot[],
  goalkeeperStat: Partial<PlayerStats>
): GoalkeeperRow {
  const attempts = goalkeeperShots.length;
  const totalSaves = goalkeeperShots.filter(s => s.result === 'gksave').length;
  const efficiency = calculateEfficiency(totalSaves, attempts);
  
  const counters = {
    by9m: { saved: 0, total: 0 },
    by6m: { saved: 0, total: 0 },
    byWing: { saved: 0, total: 0 },
    by7m: { saved: 0, total: 0 },
    fastbreak: { saved: 0, total: 0 },
    breakthrough: { saved: 0, total: 0 },
  };
  
  goalkeeperShots.forEach(shot => {
    const area = labelShootingArea(shot.from);
    const saved = shot.result === 'gksave';
    
    switch (area) {
      case "9M":
        counters.by9m.total++;
        if (saved) counters.by9m.saved++;
        break;
      case "6M":
        counters.by6m.total++;
        if (saved) counters.by6m.saved++;
        break;
      case "Wing":
        counters.byWing.total++;
        if (saved) counters.byWing.saved++;
        break;
      case "7M":
        counters.by7m.total++;
        if (saved) counters.by7m.saved++;
        break;
    }
    
    if (shot.fastbreak) {
      counters.fastbreak.total++;
      if (saved) counters.fastbreak.saved++;
    }
    if (shot.breakthrough) {
      counters.breakthrough.total++;
      if (saved) counters.breakthrough.saved++;
    }

  });
  
  return {
    id: goalkeeper.id,
    number: goalkeeper.number,
    name: goalkeeper.name,
    value: goalkeeperStat.value ?? 0,
    assistsPrimary: goalkeeperStat.assistprimary ?? 0,
    assistsSecondary: goalkeeperStat.assistsecondary ?? 0,
    lostball: goalkeeperStat.lostball ?? 0,
    totalSaves,
    attempts,
    efficiency,
    ...counters,
  };
}

export function calculateShootingTargets(
  players: Database["public"]['Tables']['player']['Row'][],
  shots: Shot[],
  isGoalkeeper = false
): Map<string, ShootingGrid> {
  const result = new Map<string, ShootingGrid>();
  
  players.forEach(player => {
    const playerShots = shots.filter(s => s.playerid === player.id);
    const name = `${player.number} ${player.name}`.trim();
    
    const grid: ShootingGrid = {
      squares: Array.from({ length: 9 }, () => ({ scored: 0, total: 0 })),
      missed: isGoalkeeper ? undefined : { left: 0, top: 0, right: 0 }
    };
    
    playerShots.forEach(shot => {
      if (!isGoalkeeper) {
        if (shot.to === ShootingTarget.OUT_LEFT) {
          grid.missed!.left++;
          return;
        }
        if (shot.to === ShootingTarget.OUT_TOP) {
          grid.missed!.top++;
          return;
        }
        if (shot.to === ShootingTarget.OUT_RIGHT) {
          grid.missed!.right++;
          return;
        }
      }
      
      const targetIndex = shot.to - 1;
      if (targetIndex >= 0 && targetIndex < 9) {
        grid.squares[targetIndex]!.total++;
        if (shot.result === 'goal') {
          grid.squares[targetIndex]!.scored++;
        }
      }
    });
    
    result.set(name, grid);
  });
  
  return result;
}

export function calculateAreaStats(shots: Shot[]): Map<string, AreaStats> {
  const stats = new Map<string, AreaStats>();
  
  SHOOTING_AREAS.forEach(area => {
    stats.set(area, { goals: 0, saved: 0, out: 0, block: 0, total: 0, percent: 0 });
  });
  
  shots.forEach(shot => {
    if (shot.result === 'gkmiss' || shot.result === 'gksave') return;
    
    const area = shot.fastbreak ? 'Fastbreak' : getAreaMapping(shot.from);
    const stat = stats.get(area) || { goals: 0, saved: 0, out: 0, block: 0, total: 0, percent: 0 };
    
    if (shot.result === 'goal') stat.goals++;
    else if (shot.result === 'miss') {
      if ([ShootingTarget.OUT_TOP, ShootingTarget.OUT_LEFT, ShootingTarget.OUT_RIGHT].includes(shot.to)) {
        stat.out++;
      } else {
        stat.saved++;
      }
    } else if (shot.result === 'block') stat.block++;
    
    stat.total++;
    stats.set(area, stat);
  });
  
  // Calculate percentages
  const totalShots = shots.filter(s => s.result !== 'gkmiss' && s.result !== 'gksave').length || 1;
  stats.forEach(stat => {
    stat.percent = Math.round((stat.total / totalShots) * 1000) / 10;
  });
  
  return stats;
}

export function toSeconds(time: string): number {
  if (!time) return 0;
  const [min, sec] = time.split(':').map(Number);
  return min! * 60 + sec!;
}

export function findSuperiorityAt(
  shotTime: string,
  events: MatchEvents,
  context: 'attack' | 'defense'
): string {
  const shotSec = toSeconds(shotTime);


  // =========================
  // GK OUT STATE
  // =========================
  const gkOutEvent =
    context === 'attack'
      ? 'empty_goal_home'
      : 'empty_goal_away';

  let gkOutActive = false;

  for (const ev of events) {
    const evSec = toSeconds(ev.time);
    if (evSec > shotSec) break;

    if (ev.event === gkOutEvent) {
      gkOutActive = ev.metadata === 'True';
    }
  }

  // =========================
  // TWO-MINUTE STATE
  // =========================
  let twoMinActive = false;

  for (const ev of events) {
    const evSec = toSeconds(ev.time);
    if (evSec > shotSec) break;

    if (context === 'attack' && ev.event === 'provokeTwoMin') {
      twoMinActive = true;
    }

    if (context === 'defense' && ev.event === 'twominutes') {
      twoMinActive = true;
    }
  }

  // =========================
  // FINAL RESOLUTION
  // =========================
  if (context === 'attack') {
    if (gkOutActive && twoMinActive) return "6 on 6 (GK out)";
    if (gkOutActive) return "7 on 6 (GK out)";
    // if (twoMinActive) return "6 on 5";
    return "6 on 6";
  }

  // DEFENSE
  if (gkOutActive) return "7 on 6 (GK out)";
  // if (twoMinActive) return "6 on 5";
  return "6 on 6";
}

export type SuperiortyResult = { attacks:number, eff:number, scored: number, missed: number, reactions: {fb:number, ld: number, total: number}};

export const findNextShotAfter = (shots: Shot[], shot:Shot) => {
  let nextShot = null;
  for(let i = 0; i < shots.length; i++){
    const s = shots[i];
    if(s!.time > shot.time){
      nextShot = s;
      break;
    }
  }
  return nextShot;
};

export function buildAttackDefenseSuperiorityStats(
  shots: Shot[],
  events: MatchEvents
): {
  attackSuperiority: Map<string, SuperiortyResult>;
  defenseSuperiority: Map<string, SuperiortyResult >;
} {
  const attackSuperiority = new Map<string, SuperiortyResult>();
  const defenseSuperiority = new Map<string, SuperiortyResult>();
  
  for (const dt of Array.from(['7 on 6 (GK out)','6 on 6 (GK out)','6 on 6'])) {
    attackSuperiority.set(dt, {
      attacks: 0,
      eff: 0,
      scored: 0,
      missed: 0,
      reactions: {fb:0, ld:0, total:0}
    });
  }
  for (const dt of Array.from(['7 on 6 (GK out)','6 on 6 (GK out)','6 on 6'])) {
    defenseSuperiority.set(dt, {
      attacks: 0,
      eff: 0,
      scored: 0, // here scored means goals scored from other team
      missed: 0, // here missed means gals saved from our team
      reactions: {fb:0, ld:0, total:0}
    });
  }
  const attackShots = shots.filter(s => s.result === 'goal' || s.result === 'miss');
  for (const shot of attackShots) {
    const attackType = findSuperiorityAt(shot.time, events, 'attack');
    const bucket = attackSuperiority.get(attackType)!;
    bucket.attacks++;
    if(shot.result === 'goal'){ 
      bucket.scored++;
    }else{
      bucket.missed++;
    }
    bucket.eff = Math.round((bucket.scored / bucket.attacks) * 1000) /10;
    const nextShot = findNextShotAfter(shots, shot);
    if(nextShot && (nextShot.result === 'gkmiss' || nextShot.result === 'gkmiss_empty')){
      if(nextShot.fastbreak){
        bucket.reactions.fb++;
        bucket.reactions.total++;
      }else if(nextShot.result === 'gkmiss_empty'){
        bucket.reactions.ld++;
        bucket.reactions.total++;
      }
    } 
  }
  const defenseShots = shots.filter(s => s.result === 'gksave' || s.result === 'gkmiss');
  for (const shot of defenseShots) {
    const defenseType = findSuperiorityAt(shot.time, events, 'defense');
    const bucket = defenseSuperiority.get(defenseType)!;
    bucket.attacks++;
    if(shot.result === 'gkmiss'){ 
      bucket.scored++;
    }else{
      bucket.missed++;
    }
    bucket.eff = Math.round((bucket.scored / bucket.attacks) * 1000) /10;
    const nextShot = findNextShotAfter(shots, shot);
    if(nextShot && (nextShot.result === 'goal' || nextShot.result === 'goal_empty')){
      if(nextShot.fastbreak){
        bucket.reactions.fb++;
        bucket.reactions.total++;
      }else if(nextShot.result === 'goal_empty'){
        bucket.reactions.ld++;
        bucket.reactions.total++;
      }
    } 
  }
  return {
    attackSuperiority,
    defenseSuperiority
  }
}

export function findDefenseAt(
  shotTime: string, 
  events: MatchEvents, 
  oppositeDefense = true
): string {
  if (!events) return "6-0";
  
  const defenseEventType = oppositeDefense ? 'opponent_defense_change' : 'defense_change';
  let chosen: any = null;
  
  for (const ev of events) {
    if (!ev.event) continue;
    if (ev.event !== defenseEventType) continue;
    if (ev.time <= shotTime) {
      if (!chosen || ev.time > chosen.time) {
        chosen = ev;
      }
    }
  }
  
  return chosen?.metadata || "6-0";
}


export function buildAttackByDefenseStats(
  shots: Shot[],
  events: MatchEvents
): {
  attackByOppDefense: Map<string, DefenseBucket>;
  fastBreaks: { total: number; scored: number; provoked7m: number; provoked2m: number };
} {
  const defenseTypes = new Set<string>();
  
  // Extract defense types from events
  if (events) {
    for (const ev of events) {
      if (!ev.event) continue;
      if (ev.event === 'opponent_defense_change') {
        defenseTypes.add(ev.metadata!);
      }
    }
  }
  
  if (defenseTypes.size === 0) defenseTypes.add("6-0");
  
  // Initialize maps
  const attackByOppDefense = new Map<string, DefenseBucket>();
  const fastBreaks = { total: 0, scored: 0, provoked7m: 0, provoked2m: 0 };
  
  for (const dt of Array.from(defenseTypes)) {
    attackByOppDefense.set(dt, {
      shots: { total: 0, scored: 0 },
      by9m: { total: 0, scored: 0 },
      by6m: { total: 0, scored: 0 },
      by7m: { total: 0, scored: 0 },
      byWing: { total: 0, scored: 0 },
      provoked7m: 0,
      provoked2m: 0,
    });
  }
  
  // Process shots for attack by defense
  const attackShots = shots.filter(s => s.result === 'goal' || s.result === 'miss');
  
  for (const shot of attackShots) {
    const defenseType = findDefenseAt(shot.time, events, true);
    const bucket = attackByOppDefense.get(defenseType) || attackByOppDefense.get("6-0")!;
    
    bucket.shots.total++;
    const scored = shot.result === 'goal';
    if (scored) bucket.shots.scored++;
    
    const area = labelShootingArea(shot.from);
    switch (area) {
      case "9M":
        bucket.by9m.total++;
        if (scored) bucket.by9m.scored++;
        break;
      case "6M":
        bucket.by6m.total++;
        if (scored) bucket.by6m.scored++;
        break;
      case "7M":
        bucket.by7m.total++;
        if (scored) bucket.by7m.scored++;
        break;
      case "Wing":
        bucket.byWing.total++;
        if (scored) bucket.byWing.scored++;
        break;
    }
    
    if (shot.fastbreak) {
      fastBreaks.total++;
      if (scored) fastBreaks.scored++;
    }
  }
  
  // Process events for provoked penalties
  if (events) {
    events.forEach(event => {
      if (!event.event) return;
      
      const defenseType = findDefenseAt(event.time, events, true);
      const bucket = attackByOppDefense.get(defenseType) || attackByOppDefense.get("6-0")!;
      
      if (event.event === 'provokePenalty') {
        bucket.provoked7m++;
      } else if (event.event === 'provokeTwoMin') {
        bucket.provoked2m++;
      }
    });
  }
  
  return { attackByOppDefense, fastBreaks };
}

export function buildDefenseByTypeStats(
  shots: Shot[],
  events: MatchEvents
): {
  defenseByType: Map<string, DefenseTypeBucket>;
  defensedFastBreaks: { total: number; saved: number; commitedSeven: number; twoMinutesCommited: number };
} {
  const defenseTypes = new Set<string>();
  
  // Extract defense types from events
  if (events) {
    for (const ev of events) {
      if (!ev.event) continue;
      if (ev.event === 'opponent_defense_change') {
        defenseTypes.add(ev.metadata!);
      }
    }
  }
  
  if (defenseTypes.size === 0) defenseTypes.add("6-0");
  
  // Initialize maps
  const defenseByType = new Map<string, DefenseTypeBucket>();
  const defensedFastBreaks = { total: 0, saved: 0, commitedSeven: 0, twoMinutesCommited: 0 };
  
  for (const dt of Array.from(defenseTypes)) {
    defenseByType.set(dt, {
      shots: { total: 0, saved: 0 },
      by9m: { total: 0, saved: 0 },
      by6m: { total: 0, saved: 0 },
      byWing: { total: 0, saved: 0 },
      steals: 0,
      commitedSeven: 0,
      twoMinutesCommitted: 0,
    });
  }
  
  // Process shots for defense by type
  const defenseShots = shots.filter(s => s.result === 'gkmiss' || s.result === 'gksave');
  
  for (const shot of defenseShots) {
    const defenseType = findDefenseAt(shot.time, events, true);
    const bucket = defenseByType.get(defenseType) || defenseByType.get("6-0")!;
    
    const saved = shot.result === 'gksave';
    bucket.shots.total++;
    if (saved) bucket.shots.saved++;
    
    const area = labelShootingArea(shot.from);
    switch (area) {
      case "9M":
        bucket.by9m.total++;
        if (saved) bucket.by9m.saved++;
        break;
      case "6M":
        bucket.by6m.total++;
        if (saved) bucket.by6m.saved++;
        break;
      case "Wing":
        bucket.byWing.total++;
        if (saved) bucket.byWing.saved++;
        break;
    }
    
    if (shot.fastbreak) {
      defensedFastBreaks.total++;
      if (saved) defensedFastBreaks.saved++;
    }
  }
  
  // Process events for defense statistics
  if (events) {
    events.forEach(event => {
      if (!event.event) return;
      
      const defenseType = findDefenseAt(event.time, events, true);
      const bucket = defenseByType.get(defenseType) || defenseByType.get("6-0")!;
      
      switch (event.event) {
        case 'steal':
          bucket.steals++;
          break;
        case 'penaltymade':
          bucket.commitedSeven++;
          break;
        case 'twominutes':
          bucket.twoMinutesCommitted++;
          break;
      }
    });
  }
  
  return { defenseByType, defensedFastBreaks };
}
