// server/api/match/[id]/stats.ts
import type { Shot, Player, PlayerStats } from "~/types/handball";
import type { GoalkeeperRow, PlayerRow, DefenseBucket, DefenseTypeBucket, AreaStats, MatchEvents } from "~/types/pdf";
import {
  calculatePlayerRow,
  calculateGoalkeeperRow,
  processPlayerStats,
  processGoalkeeperStats,
  calculateShootingTargets,
  calculateTotalShootingDistribution,
  calculateAreaStats,
  buildAttackDefenseSuperiorityStats,
  buildAttackByDefenseStats,
  buildDefenseByTypeStats,
  fetchMatchData,
} from "./pdf";
import type { ShootingTabStats } from "~/types/stats";
import { shootingGridToHeatmapCells } from "./pdfShooting";
import type { Database } from "~/types/database.types";

// ==================== FETCH & PROCESS ALL STATS ====================


const computeStats = (players: Database["public"]['Tables']['player']['Row'][], playerStats: Partial<PlayerStats>[], shots: Shot[], events: MatchEvents) => {
    const playerStatsMap = new Map<number, Partial<PlayerStats>>();
    playerStats.forEach(stat => playerStatsMap.set(stat.playerid!, stat));

    // 3️⃣ Split out goalkeepers
    const goalkeepers = players.filter(p => p.position === "GK");
    const fieldPlayers = players.filter(p => p.position !== "GK");

    // 4️⃣ Compute player stats
    const playerRows: PlayerRow[] = processPlayerStats(fieldPlayers, playerStatsMap, shots);
    const goalkeeperRows: GoalkeeperRow[] = processGoalkeeperStats(goalkeepers, playerStatsMap, shots);
    const totalGoalkeeperRow: GoalkeeperRow = goalkeeperRows.reduce((acc, gk) => {
    return {
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
        breakthrough: { saved: acc.breakthrough.saved + gk.breakthrough.saved, total: acc.breakthrough.total + gk.breakthrough.total }
    };
    }, {
        id: 0, name: "", number: 0, value: 0, totalSaves: 0, attempts: 0, efficiency: 0,
        by9m: { saved: 0, total: 0 },
        by6m: { saved: 0, total: 0 },
        by7m: { saved: 0, total: 0 },
        byWing: { saved: 0, total: 0 },
        fastbreak: { saved: 0, total: 0 },
        breakthrough: { saved: 0, total: 0 }
    });

    // 5️⃣ Shooting heatmap
    const playerShootingTargets = calculateShootingTargets(fieldPlayers, shots, false);
    const goalkeeperShootingTargets = calculateShootingTargets(goalkeepers, shots, true);

    const totalPlayerGrid = calculateTotalShootingDistribution(playerShootingTargets, false);
    const totalGoalkeeperGrid = calculateTotalShootingDistribution(goalkeeperShootingTargets, true);

    const totalPlayerGridCells = shootingGridToHeatmapCells(totalPlayerGrid)
    const totalGoalkeeperGridCells = shootingGridToHeatmapCells(totalGoalkeeperGrid)

    const shootingTabStats: ShootingTabStats = {
        totalPlayerGrid: totalPlayerGridCells,
        totalGoalkeeperGrid: totalGoalkeeperGridCells,
    };

    // 6️⃣ Area stats
    const areaStats: Map<string, AreaStats> = calculateAreaStats(shots);

    // 7️⃣ Superiority stats
    const { attackSuperiority, defenseSuperiority } = buildAttackDefenseSuperiorityStats(shots, events);

    // 8️⃣ Attack by defense stats
    const { attackByOppDefense, fastBreaks } = buildAttackByDefenseStats(shots, events);

    // 9️⃣ Defense by type stats
    const { defenseByType, defensedFastBreaks } = buildDefenseByTypeStats(shots, events);

    return {
        players: playerRows,
        goalkeepers: goalkeeperRows,
        totalGoalkeeper: totalGoalkeeperRow,
        shooting: shootingTabStats,
        areaStats,
        attackSuperiority,
        defenseSuperiority,
        attackByOppDefense,
        fastBreaks,
        defenseByType,
        defensedFastBreaks,
    };
}

export async function fetchMatchStats(matchId: number) {
    const {players, playerStats, shots, events} = await fetchMatchData(matchId);
    // 2️⃣ Map player stats by playerId
    return computeStats(players, playerStats, shots, events);
}

export type MatchStats = ReturnType<typeof computeStats>;