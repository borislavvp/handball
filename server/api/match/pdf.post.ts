// server/api/match/[id]/stats.pdf.ts
import PDFDocument from "pdfkit";
import { defineEventHandler, readBody, createError } from "h3";
import { supabase } from "../../utils/databaseClient";
import { PlayerStats, } from "~/types/handball";
import { GeneralMatchBody } from "~/types/dto";
import { AreaStats, DefenseBucket, DefenseTypeBucket, GoalkeeperRow, PDF_CONFIG, PlayerRow,ShootingGrid } from "~/types/pdf";
import { drawPlayerGrid, drawTableRow, } from "./pdf/utils";
import {  drawScoreChartPage } from "./pdf/chart";
import { Database } from "~/types/database.types";
import { drawHalfFieldAttackDefenseStats } from "./pdf/shooting";
import { computeAttackDefenseStatsByPosition } from "~/shared/pdf/pdfShooting";
import { buildAttackByDefenseStats, buildAttackDefenseSuperiorityStats, buildDefenseByTypeStats, calculateAreaStats, calculateShootingTargets, 
  processGoalkeeperStats, processPlayerStats, SuperiortyResult } from "~/shared/pdf/pdf";
import { calculateScoreProgression } from "~/shared/pdf/pdfChart";

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
    "No", "Name", "V", "Tot", "%", "9m", "6m", "Wing", "7m", "FB", "Brk.",
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
      `${player.breakthrough.scored}/${player.breakthrough.total}`,
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
  drawTableRow(doc, startX, y, ["Goalkeepers", "Saves/Shots"], [105, 200], 12, true);
  y += 12;
  
  const gkWidths = [15, 75, 15, 25, 25, 25, 25, 25, 25, 25, 25];
  const gkCols = ["#", "Name", 'V', "Tot", "%", "9M", "6M", "Wing", "7M", "FB", "BT"];
  
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
      `${gk.breakthrough.saved}/${gk.breakthrough.total}`
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
  y += 24;
  
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
  
  y += 12;
  
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
  
  y += 12;
  
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
  
  return y + 24;
}

function drawAttackDefenseSuperiorityTables(
  doc: PDFKit.PDFDocument,
  attackSuperiority: Map<string, SuperiortyResult>,
  defenseSuperiority: Map<string, SuperiortyResult>,
  startX: number,
  startY: number
): number {
  let y = startY;
  const savedX = startX;
  
  // Attack table
  doc.font('Helvetica-Bold', PDF_CONFIG.fontSizes.header)
    .text("Attack with superiority", startX, y);
  
  y += 12;
  
  const mainWidths = [80,90,75];
  const mainCols = ["", "Attack", "Reaction"];
  drawTableRow(doc, startX, y, mainCols, mainWidths, 12, true);
  y += 12;

  const widths = [80, 30, 30, 30, 25, 25, 25];
  const widths_base = [80, 30, 30, 30,];
  const cols = ["", "Att.", "Eff.", "Shots", "FB", "LD", "Tot."];
  drawTableRow(doc, startX, y, cols, widths, 12, true);
  y += 12;
  
  for (const [defenseType, stats] of attackSuperiority.entries()) {
    if(defenseType === "6 on 6") continue; // Skip 6_6 as it's shown in base row
    if (y + 12 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      startX = savedX;
      y = doc.y + 6;
    }
    
    const row = [
      defenseType,
      `${stats.attacks}`,
      `${stats.eff}%`,
      `${stats.scored}/${stats.scored + stats.missed}`,
      `${stats.reactions.fb}`,
      `${stats.reactions.ld}`,
      `${stats.reactions.ld + stats.reactions.fb}`,
    ];
    
    y = drawTableRow(doc, startX, y, row, widths, 12);
  }
  
  const base_attack = attackSuperiority.get("6 on 6")!;
  y = drawTableRow(doc, startX, y, [
    '6 on 6', 
    `${base_attack.attacks}`,
    `${base_attack.eff}%`,
    `${base_attack.scored}/${base_attack.scored + base_attack.missed}`, 
  ], widths_base, 12);
  
  // Reset for defense table
  y = startY;
  startX += 320;
  
  // Defense table
  doc.font('Helvetica-Bold', PDF_CONFIG.fontSizes.header)
    .text("Defense with superiority", startX, y);
  
  y += 12;
  
  drawTableRow(doc, startX, y, mainCols, mainWidths, 12, true);
  y += 12;
  drawTableRow(doc, startX, y, cols, widths, 12, true);
  y += 12;
  
  for (const [defenseType, stats] of defenseSuperiority.entries()) {
    if(defenseType === "6 on 6") continue; // Skip 6_6 as it's shown in base row
    if (y + 12 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      startX = savedX;
      y = doc.y + 6;
    }
    
    const row = [
      defenseType,
      `${stats.attacks}`,
      `${stats.eff}%`,
      `${stats.scored}/${stats.scored + stats.missed}`,
      `${stats.reactions.fb}`,
      `${stats.reactions.ld}`,
      `${stats.reactions.ld + stats.reactions.fb}`,
    ];
    
    y = drawTableRow(doc, startX, y, row, widths, 12);
  }
  const base_defense = defenseSuperiority.get("6 on 6")!;
  y = drawTableRow(doc, startX, y, [
    '6 on 6', 
    `${base_defense.attacks}`,
    `${base_defense.eff}%`,
    `${base_defense.scored}/${base_defense.scored + base_defense.missed}`,
  ], widths_base, 12);
  
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
    const { attackSuperiority, defenseSuperiority } = buildAttackDefenseSuperiorityStats(shots, events);
    
    // Calculate goalkeeper totals
    const gkTotals = goalkeepersTable.reduce((acc, gk) => ({
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
      breakthrough: { saved: acc.breakthrough.saved + gk.breakthrough.saved, total: acc.breakthrough.total + gk.breakthrough.total }
    }), {
      id: 0,
      name: "",
      number: 0,
      value: 0,
      assistsPrimary:0,
      assistsSecondary:0,
      lostball:0,
      totalSaves: 0,
      attempts: 0,
      efficiency: 0,
      by9m: { saved: 0, total: 0 },
      by6m: { saved: 0, total: 0 },
      by7m: { saved: 0, total: 0 },
      byWing: { saved: 0, total: 0 },
      fastbreak: { saved: 0, total: 0 },
      breakthrough: { saved: 0, total: 0 }
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
    currentY = drawAttackDefenseSuperiorityTables(
      doc,
      attackSuperiority,
      defenseSuperiority,
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