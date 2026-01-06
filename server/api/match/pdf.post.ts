// server/api/match/[id]/stats.pdf.ts
import PDFDocument from "pdfkit";
import { defineEventHandler, readBody, createError } from "h3";
import { supabase } from "../../utils/databaseClient";
import { Match, MATCH_EVENTS, Player, PlayerStats, ShootingArea, ShootingTarget, Shot } from "~/types/handball";
import { GeneralMatchBody } from "~/types/dto";
import { AreaStats, DefenseBucket, DefenseTypeBucket, GoalkeeperRow, MatchEvents, PDF_CONFIG, PlayerRow, ScoreAtMinute, ScoreEvent, SHOOTING_AREAS, ShootingGrid } from "./pdf/types";
import { calculateEfficiency, drawPlayerGrid, drawTableRow, getAreaMapping, labelShootingArea, parseTimeToSeconds, secondsToMinutes } from "./pdf/utils";
import { calculateScoreProgression, drawScoreChartPage } from "./pdf/chart";
import { Database } from "~/types/database.types";
import { computeAttackDefenseStatsByPosition, drawHalfFieldAttackDefenseStats } from "./pdf/shooting";

// ==================== DATA FETCHING & PROCESSING ====================

async function fetchMatchData(matchId: number) {
  const { data: matchData, error: matchError } = await supabase
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
    supabase.from("player").select("*").eq("teamid", teamId),
    supabase.from("player_stats").select("*").eq("matchid", matchId),
    supabase.from("shots").select("*").eq("matchid", matchId),
    supabase.from("match_event").select("*").eq("matchid", matchId),
  ]);
  
  return {
    match: matchData,
    players: players.data || [],
    playerStats: playerStats.data || [],
    shots: shotsRaw.data || [],
    events: events.data || [],
  };
}

function processPlayerStats(
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

function calculatePlayerRow(
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
  });
  
  const oneOnOneTotal = (playerStat["1on1win"] ?? 0) + (playerStat["1on1lost"] ?? 0);
  
  return {
    id: player.id,
    number: player.number,
    name: player.name,
    value: playerStat.value ?? 0,
    goalsTotal,
    attempts,
    efficiency,
    ...counters,
    oneOnOne: { 
      scored: playerStat["1on1win"] ?? 0, 
      total: oneOnOneTotal 
    },
    assistsPrimary: playerStat.assistprimary ?? 0,
    assistsSecondary: playerStat.assistsecondary ?? 0,
    provoked7m: playerStat.provokePenalty ?? 0,
    provoked2m: playerStat.provokeTwoMin ?? 0,
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

function processGoalkeeperStats(
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
function calculateGoalkeeperTotals(goalkeepers: GoalkeeperRow[]): GoalkeeperRow {
  return goalkeepers.reduce((acc, gk) => ({
    id: 0,
    name: "Total",
    number: 0,
    value: Math.floor((acc.value + gk.value) / 2),
    totalSaves: acc.totalSaves + gk.totalSaves,
    attempts: acc.attempts + gk.attempts,
    efficiency: Math.floor((acc.efficiency + gk.efficiency) / 2),
    by9m: { saved: acc.by9m.saved + gk.by9m.saved, total: acc.by9m.total + gk.by9m.total },
    by6m: { saved: acc.by6m.saved + gk.by6m.saved, total: acc.by6m.total + gk.by6m.total },
    by7m: { saved: acc.by7m.saved + gk.by7m.saved, total: acc.by7m.total + gk.by7m.total },
    byWing: { saved: acc.byWing.saved + gk.byWing.saved, total: acc.byWing.total + gk.byWing.total },
    fastbreak: { saved: acc.fastbreak.saved + gk.fastbreak.saved, total: acc.fastbreak.total + gk.fastbreak.total },
  }), {
    id: 0,
    name: "",
    number: 0,
    value: 0,
    totalSaves: 0,
    attempts: 0,
    efficiency: 0,
    by9m: { saved: 0, total: 0 },
    by6m: { saved: 0, total: 0 },
    by7m: { saved: 0, total: 0 },
    byWing: { saved: 0, total: 0 },
    fastbreak: { saved: 0, total: 0 },
  });
}

function calculateTotalShootingDistribution(
  shootingTargets: Map<string, ShootingGrid>,
  isGoalkeeper: boolean
): ShootingGrid {
  const result: ShootingGrid = {
    squares: Array.from({ length: 9 }, () => ({ scored: 0, total: 0 })),
    missed: isGoalkeeper ? undefined : { left: 0, top: 0, right: 0 }
  };
  
  for (const grid of shootingTargets.values()) {
    grid.squares.forEach((square, i) => {
      result.squares[i].scored += square.scored;
      result.squares[i].total += square.total;
    });
    
    if (!isGoalkeeper && grid.missed) {
      result.missed!.left += grid.missed.left;
      result.missed!.top += grid.missed.top;
      result.missed!.right += grid.missed.right;
    }
  }
  
  return result;
}

function calculateGoalkeeperRow(
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
  });
  
  return {
    id: goalkeeper.id,
    number: goalkeeper.number,
    name: goalkeeper.name,
    value: goalkeeperStat.value ?? 0,
    totalSaves,
    attempts,
    efficiency,
    ...counters,
  };
}

function calculateShootingTargets(
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
        grid.squares[targetIndex].total++;
        if (shot.result === 'goal') {
          grid.squares[targetIndex].scored++;
        }
      }
    });
    
    result.set(name, grid);
  });
  
  return result;
}

function calculateAreaStats(shots: Shot[]): Map<string, AreaStats> {
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

function findDefenseAt(
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

function buildAttackByDefenseStats(
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

function buildDefenseByTypeStats(
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


// ==================== PDF GENERATION SECTIONS ====================

function drawTitleSection(doc: PDFKit.PDFDocument, matchData: Database["public"]['Tables']['match']['Row'], homeName:string): void {
  doc.fontSize(PDF_CONFIG.fontSizes.title)
    .text(`Match Statistics — ${homeName.toUpperCase()} vs ${matchData.opponent.toUpperCase()}`, { align: "center" });
  
  doc.moveDown(0.25);
  doc.fontSize(PDF_CONFIG.fontSizes.small)
    .text(
      `Match ID: ${matchData.id}   Score: ${matchData.score} - ${matchData.opponentScore}   Result: ${matchData.result || ""}`,
      { align: "center" }
    );
  doc.moveDown(0.5);
}

function drawPlayersTable(
  doc: PDFKit.PDFDocument,
  players: PlayerRow[],
  startX: number,
  startY: number
): number {
  let y = startY;
  
  doc.font('Helvetica-Bold', PDF_CONFIG.fontSizes.header)
    .text("Stats per Player", startX, y);
  
  y += 8;
  
  const colWidths = [15, 75, 15, 25, 25, 25, 25, 25, 25, 25, 25, 20, 20, 15, 15, 15, 20, 15, 15, 15, 15, 20, 15, 15, 15, 15];
  const header = [
    "No", "Name", "V", "Tot", "%", "9m", "6m", "Wing", "7m", "FB", "1-1",
    "P.As.", 'S.As.', 'E7', 'E2', 'LB', 'Def', 'St.', 'BL', 'NR', 'C7', '1-1L',
    'YC', '2M', 'RC', 'BC'
  ];
  
  // Draw main header
  drawTableRow(doc, startX, y, ['Players', 'Goals/Shots', 'Attack', 'Defense', 'Suspensions'], [105, 200, 85, 100, 60], 14, true);
  y += 14;
  
  // Draw column headers
  drawTableRow(doc, startX, y, header, colWidths, 14, true);
  y += 14;
  
  // Draw player rows
  doc.fontSize(PDF_CONFIG.fontSizes.table);
  
  for (const player of players) {
    if (y + 12 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.y + 6;
    }
    
    const row = [
      player.number,
      player.name,
      player.value,
      `${player.goalsTotal}/${player.attempts}`,
      `${player.efficiency}%`,
      `${player.by9m.scored}/${player.by9m.total}`,
      `${player.by6m.scored}/${player.by6m.total}`,
      `${player.byWing.scored}/${player.byWing.total}`,
      `${player.by7m.scored}/${player.by7m.total}`,
      `${player.fastbreak.scored}/${player.fastbreak.total}`,
      `${player.oneOnOne.scored}/${player.oneOnOne.total}`,
      `${player.assistsPrimary}`,
      `${player.assistsSecondary}`,
      `${player.provoked7m}`,
      `${player.provoked2m}`,
      `${player.lostballs}`,
      `${player.defense}`,
      `${player.steals}`,
      `${player.blocks}`,
      `${player.norebounds}`,
      `${player.penaltiesMade}`,
      `${player.oneOnOneLost}`,
      `${player.yellow}`,
      `${player.twoMinutes}`,
      `${player.red}`,
      `${player.blue}`,
    ];
    
    y = drawTableRow(doc, startX, y, row, colWidths, 12);
  }
  
  return y;
}

function drawGoalkeepersTable(
  doc: PDFKit.PDFDocument,
  goalkeepers: GoalkeeperRow[],
  total: GoalkeeperRow,
  startX: number,
  startY: number
): number {
  let y = startY;
  
  y += 12;
  drawTableRow(doc, startX, y, ["Goalkeepers", "Saves/Shots"], [105, 175], 12, true);
  y += 12;
  
  const gkWidths = [15, 75, 15, 25, 25, 25, 25, 25, 25, 25];
  const gkCols = ["#", "Name", 'V', "Tot", "%", "9M", "6M", "Wing", "7M", "FB"];
  
  drawTableRow(doc, startX, y, gkCols, gkWidths, 12, true);
  y += 12;
  
  // Draw goalkeeper rows
  for (const gk of goalkeepers) {
    if (y + 12 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.y + 6;
    }
    
    const row = [
      gk.number,
      gk.name,
      gk.value,
      `${gk.totalSaves}/${gk.attempts}`,
      `${gk.efficiency}%`,
      `${gk.by9m.saved}/${gk.by9m.total}`,
      `${gk.by6m.saved}/${gk.by6m.total}`,
      `${gk.byWing.saved}/${gk.byWing.total}`,
      `${gk.by7m.saved}/${gk.by7m.total}`,
      `${gk.fastbreak.saved}/${gk.fastbreak.total}`,
    ];
    
    y = drawTableRow(doc, startX, y, row, gkWidths, 12);
  }
  
  // Draw total row
  const totalRow = [
    "",
    "TOTAL",
    total.value,
    `${total.totalSaves}/${total.attempts}`,
    `${total.efficiency}%`,
    `${total.by9m.saved}/${total.by9m.total}`,
    `${total.by6m.saved}/${total.by6m.total}`,
    `${total.byWing.saved}/${total.byWing.total}`,
    `${total.by7m.saved}/${total.by7m.total}`,
    `${total.fastbreak.saved}/${total.fastbreak.total}`,
  ];
  
  y = drawTableRow(doc, startX, y, totalRow, gkWidths, 12);
  y += 12;
  
  return y;
}

function drawAttackDefenseTables(
  doc: PDFKit.PDFDocument,
  attackByOppDefense: Map<string, DefenseBucket>,
  fastBreaks: { total: number; scored: number; provoked7m: number; provoked2m: number },
  defenseByType: Map<string, DefenseTypeBucket>,
  defensedFastBreaks: { total: number; saved: number; commitedSeven: number; twoMinutesCommited: number },
  startX: number,
  startY: number
): number {
  let y = startY;
  const savedX = startX;
  
  // Attack table
  doc.font('Helvetica-Bold', PDF_CONFIG.fontSizes.header)
    .text("Attack by type of defense", startX, y);
  
  y += 24;
  
  const attackWidths = [50, 30, 25, 25, 25, 25, 25, 25];
  const attackCols = ["", "Shots", "9M", "6M", "Wing", "7M", "E7", "E2"];
  
  drawTableRow(doc, startX, y, attackCols, attackWidths, 12, true);
  y += 12;
  
  for (const [defenseType, stats] of attackByOppDefense.entries()) {
    if (y + 12 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      startX = savedX;
      y = doc.y + 6;
    }
    
    const row = [
      defenseType,
      `${stats.shots.scored}/${stats.shots.total}`,
      `${stats.by9m.scored}/${stats.by9m.total}`,
      `${stats.by6m.scored}/${stats.by6m.total}`,
      `${stats.byWing.scored}/${stats.byWing.total}`,
      `${stats.by7m.scored}/${stats.by7m.total}`,
      stats.provoked7m,
      stats.provoked2m,
    ];
    
    y = drawTableRow(doc, startX, y, row, attackWidths, 12);
  }
  
  // Fastbreak row for attack
  y = drawTableRow(doc, startX, y, [
    'Fastbreak', 
    `${fastBreaks.scored}/${fastBreaks.total}`, 
    "-", "-", "-", "-", "-", "-"
  ], attackWidths, 12);
  
  // Reset for defense table
  y = startY;
  startX += 320;
  
  // Defense table
  doc.font('Helvetica-Bold', PDF_CONFIG.fontSizes.header)
    .text("Defense by type", startX, y);
  
  y += 24;
  
  const defenseWidths = [50, 30, 25, 25, 25, 25, 25, 25];
  const defenseCols = ["", "Total", "9M", "6M", "Wing", "Stl.", "C7", "2M"];
  
  drawTableRow(doc, startX, y, defenseCols, defenseWidths, 12, true);
  y += 12;
  
  for (const [defenseType, stats] of defenseByType.entries()) {
    if (y + 12 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      startX = savedX + 320;
      y = doc.y + 6;
    }
    
    const row = [
      defenseType,
      `${stats.shots.saved}/${stats.shots.total}`,
      `${stats.by9m.saved}/${stats.by9m.total}`,
      `${stats.by6m.saved}/${stats.by6m.total}`,
      `${stats.byWing.saved}/${stats.byWing.total}`,
      stats.steals,
      stats.commitedSeven,
      stats.twoMinutesCommitted,
    ];
    
    y = drawTableRow(doc, startX, y, row, defenseWidths, 12);
  }
  
  // Fastbreak row for defense
  y = drawTableRow(doc, startX, y, [
    'Fastbreak', 
    `${defensedFastBreaks.saved}/${defensedFastBreaks.total}`, 
    "-", "-", "-", "-", "-", "-"
  ], defenseWidths, 12);
  
  return y + 12;
}

function drawShootingDistribution(
  doc: PDFKit.PDFDocument,
  playerGrids: Map<string, ShootingGrid>,
  goalkeeperGrids: Map<string, ShootingGrid>,
  totalPlayerGrid: ShootingGrid,
  totalGoalkeeperGrid: ShootingGrid,
  startX: number,
  startY: number
): number {
  let y = startY;
  const gridXStart = startX;
  const perRow = 6;
  
  // Player grids
  doc.font('Helvetica-Bold',10).text("Shot distribution by player", gridXStart, y);
  y += 24;
  
  let colIdx = 0;
  let gridY = y;
  
  for (const [name, grid] of playerGrids.entries()) {
    if (colIdx >= perRow) {
      colIdx = 0;
      gridY += 90;
    }
    
    if (gridY + 90 > doc.page.height - doc.page.margins.bottom - 120) {
      doc.addPage();
      gridY = doc.y + 6;
    }
    
    drawPlayerGrid(doc, gridXStart + colIdx * 90, gridY, grid, name);
    colIdx++;
  }
  
  // Total player grid
  gridY += 90;
  colIdx = 0;
  drawPlayerGrid(doc, gridXStart + colIdx * 90, gridY, totalPlayerGrid, 'TOTAL');
  
  // Goalkeeper grids
  gridY += 100;
  colIdx = 0;
  
  doc.fontSize(10).text("Saves distribution by goalkeeper", gridXStart, gridY);
  gridY += 30;
  
  for (const [name, grid] of goalkeeperGrids.entries()) {
    if (colIdx >= perRow) {
      colIdx = 0;
      gridY += 90;
    }
    
    if (gridY + 90 > doc.page.height - doc.page.margins.bottom - 120) {
      doc.addPage();
      gridY = doc.y + 6;
    }
    
    drawPlayerGrid(doc, gridXStart + colIdx * 90, gridY, grid, name);
    colIdx++;
  }
  
  // Total goalkeeper grid
  drawPlayerGrid(doc, gridXStart + colIdx * 90, gridY, totalGoalkeeperGrid, 'TOTAL');
  return gridY + 100;
}

function drawShootingStatistics(
  doc: PDFKit.PDFDocument,
  areaStats: Map<string, AreaStats>,
  startX: number,
  startY: number
): number {
  let y = startY;
  
  doc.font('Helvetica-Bold',10).text("Shooting statistics", startX, y);
  y += 12;
  
  const areaW = [55, 30, 30, 30, 30, 30, 30];
  const areaCols = ["Position", "Goals", "Saved", "Out", "Block", "Total", "%"];
  
  y = drawTableRow(doc, startX, y, areaCols, areaW, 12, true);
  
  for (const [position, stats] of areaStats.entries()) {
    if (y + 12 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.y + 6;
    }
    
    const row = [
      position,
      stats.goals,
      stats.saved,
      stats.out,
      stats.block,
      stats.total,
      `${stats.percent}%`
    ];
    
    y = drawTableRow(doc, startX, y, row, areaW, 12);
  }
  
  return y;
}

import path from 'path'



// ==================== MAIN HANDLER ====================

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<GeneralMatchBody>(event);
    if (!body.matchId) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: "Match ID required" 
      });
    }
    
    // Fetch all data
    const { match, players, playerStats, shots, events } = await fetchMatchData(body.matchId);
    
    // Create player stats map for quick lookup
    const statsByPlayer = new Map<number, Partial<PlayerStats>>();
    playerStats.forEach(s => statsByPlayer.set(s.playerid, s));
    
    // Separate goalkeepers and field players
    const goalkeepers = players.filter(p => p.position === 'GK');
    const fieldPlayers = players.filter(p => p.position !== 'GK');
    
    // Process statistics
    const playersTable = processPlayerStats(fieldPlayers, statsByPlayer, shots);
    const goalkeepersTable = processGoalkeeperStats(goalkeepers, statsByPlayer, shots);
    
    // Calculate attack by defense and defense by type statistics
    const { attackByOppDefense, fastBreaks } = buildAttackByDefenseStats(shots, events);
    const { defenseByType, defensedFastBreaks } = buildDefenseByTypeStats(shots, events);

    // Calculate goalkeeper totals
    const gkTotals = goalkeepersTable.reduce((acc, gk) => ({
      id: 0,
      name: "Total",
      number: 0,
      value: Math.floor((acc.value + gk.value) / 2),
      totalSaves: acc.totalSaves + gk.totalSaves,
      attempts: acc.attempts + gk.attempts,
      efficiency: Math.floor((acc.efficiency + gk.efficiency) / 2),
      by9m: { saved: acc.by9m.saved + gk.by9m.saved, total: acc.by9m.total + gk.by9m.total },
      by6m: { saved: acc.by6m.saved + gk.by6m.saved, total: acc.by6m.total + gk.by6m.total },
      by7m: { saved: acc.by7m.saved + gk.by7m.saved, total: acc.by7m.total + gk.by7m.total },
      byWing: { saved: acc.byWing.saved + gk.byWing.saved, total: acc.byWing.total + gk.byWing.total },
      fastbreak: { saved: acc.fastbreak.saved + gk.fastbreak.saved, total: acc.fastbreak.total + gk.fastbreak.total },
    }), {
      id: 0,
      name: "",
      number: 0,
      value: 0,
      totalSaves: 0,
      attempts: 0,
      efficiency: 0,
      by9m: { saved: 0, total: 0 },
      by6m: { saved: 0, total: 0 },
      by7m: { saved: 0, total: 0 },
      byWing: { saved: 0, total: 0 },
      fastbreak: { saved: 0, total: 0 },
    });
    
    // Calculate shooting distributions
    const playerShootingTargets = calculateShootingTargets(fieldPlayers, shots, false);
    const goalkeeperShootingTargets = calculateShootingTargets(goalkeepers, shots, true);
    
    // Calculate total distributions
    const totalPlayerDistribution = Array.from(playerShootingTargets.values())
      .reduce((acc, grid) => {
        grid.squares.forEach((square, i) => {
          if (!acc.squares[i]) {
            acc.squares[i] = { scored: 0, total: 0 };
          }
          acc.squares[i].scored += square.scored;
          acc.squares[i].total += square.total;
        });
        
        if (grid.missed) {
          acc.missed!.left += grid.missed.left;
          acc.missed!.top += grid.missed.top;
          acc.missed!.right += grid.missed.right;
        }
        
        return acc;
      }, {
        squares: Array.from({ length: 9 }, () => ({ scored: 0, total: 0 })),
        missed: { left: 0, top: 0, right: 0 }
      });
    
    const totalGoalkeeperDistribution = Array.from(goalkeeperShootingTargets.values())
      .reduce((acc, grid) => {
        grid.squares.forEach((square, i) => {
          if (!acc.squares[i]) {
            acc.squares[i] = { scored: 0, total: 0 };
          }
          acc.squares[i].scored += square.scored;
          acc.squares[i].total += square.total;
        });
        return acc;
      }, {
        squares: Array.from({ length: 9 }, () => ({ scored: 0, total: 0 })),
        missed: undefined
      });
    
    // Calculate area statistics
    const areaStats = calculateAreaStats(shots);

    // Calculate score progression for the chart
    const scoreProgression = calculateScoreProgression(events);
    
    const attackDefenseStatsByPosition = computeAttackDefenseStatsByPosition(shots);
    // Generate PDF
    const doc = new PDFDocument({ size: PDF_CONFIG.size, margin: PDF_CONFIG.margin });
    const buffers: Uint8Array[] = [];
    
    doc.on("data", (chunk) => buffers.push(chunk));
    
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);
    });
    
    // Draw PDF sections
    drawTitleSection(doc, match,match.team.name);
    
    const startX = 20;
    let currentY = doc.y;
    
    // Page 1: Players and Goalkeepers
    currentY = drawPlayersTable(doc, playersTable, startX, currentY);
    currentY = drawGoalkeepersTable(doc, goalkeepersTable, gkTotals, startX, currentY);
    
    // Attack and Defense tables
    currentY = drawAttackDefenseTables(
      doc,
      attackByOppDefense,
      fastBreaks,
      defenseByType,
      defensedFastBreaks,
      startX,
      currentY
    );
    
    // Page 2: Shooting distributions
    doc.addPage();
    currentY = drawShootingDistribution(
      doc,
      playerShootingTargets,
      goalkeeperShootingTargets,
      totalPlayerDistribution,
      totalGoalkeeperDistribution,
      startX,
      doc.y + 6
    );

    const FIELD_IMAGE_PATH = path.resolve(
      process.cwd(),
      'server/assets/court.png'
    )
    drawHalfFieldAttackDefenseStats(doc, FIELD_IMAGE_PATH ,attackDefenseStatsByPosition, startX, currentY + 12);
    console.log(areaStats)
    drawShootingStatistics(doc, areaStats, startX + 320, currentY);
    

    // Page 4: Score progression chart
    drawScoreChartPage(doc, scoreProgression, match.team.name, match.opponent);


    // Finalize PDF
    doc.end();
    const pdf = await pdfPromise;
    
    // Return response
    const res = event.node.res;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=match_${body.matchId}_stats.pdf`);
    res.setHeader("Content-Length", String(pdf.length));
    res.end(pdf);
    
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error generating PDF: ${(error as Error).message}`
    });
  }
});