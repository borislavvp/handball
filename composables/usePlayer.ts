import type { CreatePlayerBody } from "~/types/dto";
import type { Player, PlayerCurrentStats, PlayerStats, Position, Shot, Stats, Team } from "~/types/handball";
import type { LoadingState } from "./useLoading";
import type { ActiveMatch } from "./useActiveMatch";

export const usePlayer = (
    loadingState: LoadingState,
    team: ComputedRef<Team | undefined>,
    currentMatch: ComputedRef<ActiveMatch | null>) => {
    function getPlayer(playerId:number): Player | undefined {
        return team.value?.players.find(p => p.id === playerId);
    }

    function getActiveMatchId() {
        return currentMatch.value?.data.value.id;
    }

    function initPlayerStats(): PlayerCurrentStats {
        return {
            "1on1lost": 0,
            "1on1win": 0,
            goal: 0,
            gkmiss_empty: 0,
            goal_empty: 0,
            defense: 0,
            assistprimary: 0,
            assistsecondary: 0,
            defensex2: 0,
            steal: 0,
            twominutes: 0,
            yellowcard: 0,
            redcard: 0,
            bluecard: 0,
            penaltymade: 0,
            miss: 0,
            lostball: 0,
            gkmiss: 0,
            gksave: 0,
            provokePenalty: 0,
            provokeTwoMin: 0,
            provokeCard: 0,
            block: 0,
            norebound: 0,
            value: 0,
        };
    }

    function getMatchState(player: Player, matchId: number) {
        if (!player.liveByMatch) {
            player.liveByMatch = {};
        }
        if (!player.liveByMatch[matchId]) {
            player.liveByMatch[matchId] = {
                stats: initPlayerStats(),
                shots: [],
            };
        }
        return player.liveByMatch[matchId]!;
    }

    function syncCurrentPlayerView(player: Player, matchId: number) {
        const state = getMatchState(player, matchId);
        player.currentStats = state.stats;
        player.currentShots = state.shots;
    }

    async function getPlayerStats(playerId: number): Promise<PlayerStats[]>{
        const { $supabase } = useNuxtApp();
        loadingState.fetching.value = true;
        const {data, error} = await $supabase
            .from('player_stats')
            .select(`*,match (id,result,createdat,opponent,score, opponentScore, timeoutsLeftHome, timeoutsLeftAway, shots(*))`)
            .eq('playerid', playerId);

        if (error){
            return [];
        }
        const p: PlayerStats[] = data;
        loadingState.fetching.value = false;
        return p;
    }

    async function addPlayer(name: string, position: Position["key"], number: number): Promise<Player | null> {
        if (!team.value) return null;
        loadingState.fetching.value = true;
        const playerId = await $fetch('/api/player', {
            method: 'POST',
            body: { name, number, position, teamId:team.value.id } as CreatePlayerBody,
        });
        const p: Player = {
            id: playerId as number,
            name,
            number,
            position,
            currentShots: [],
            currentStats: undefined,
            liveByMatch: {},
            recentStats: [],
            hasTwoMinutes: false,
            hasCard: null,
        };
        team.value?.players.push(p);
        loadingState.fetching.value = false;
        return p;
    }

    async function updatePlayer(data:Record<string, any>,playerId:number){
        await $fetch(`/api/player/${playerId}`, {
            method: 'PUT',
            body: data,
        });
    }

    async function removePlayer(playerId: number) {
        if (!team.value) return;
        await $fetch(`/api/player/${playerId}`, { method: 'DELETE' });
        const index = team.value.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            team.value.players.splice(index, 1);
        }
    }

    function addShotToPlayer(player: Player, shot: Shot) {
        const matchId = getActiveMatchId();
        if (!matchId) return;

        const playerState = getMatchState(player, matchId);
        playerState.shots.push(shot);
        playerState.stats[shot.result] += 1;

        if (shot.assistPrimary) {
            const assistPlayer = getPlayer(shot.assistPrimary);
            if (assistPlayer) {
                const assistState = getMatchState(assistPlayer, matchId);
                assistState.stats.assistprimary += 1;
                computePlayerValue(assistPlayer, assistState.stats);
                syncCurrentPlayerView(assistPlayer, matchId);
            }
        }

        if (shot.assistSecondary) {
            const assistPlayer = getPlayer(shot.assistSecondary);
            if (assistPlayer) {
                const assistState = getMatchState(assistPlayer, matchId);
                assistState.stats.assistsecondary += 1;
                computePlayerValue(assistPlayer, assistState.stats);
                syncCurrentPlayerView(assistPlayer, matchId);
            }
        }

        currentMatch.value?.data.value.shots.push(shot);
        computePlayerValue(player, playerState.stats);
        syncCurrentPlayerView(player, matchId);

        $fetch('/api/shots', {
            method: 'POST',
            body: { matchId, playerId: player.id, shot },
        });
    }

    function increasePlayerStat(player: Player, stat:Stats) {
        const matchId = getActiveMatchId();
        if (!matchId) return;

        const hasExistingState = Boolean(player.liveByMatch && player.liveByMatch[matchId]);
        const state = getMatchState(player, matchId);
        state.stats[stat] += 1;

        if (stat === 'twominutes') {
            player.hasTwoMinutes = true;
        }

        computePlayerValue(player, state.stats);
        syncCurrentPlayerView(player, matchId);

        $fetch('/api/stats', {
            method: hasExistingState ? 'PUT' : 'POST',
            body: { matchId, playerId: player.id, statType: stat, time: currentMatch.value?.data.value.time },
        });
    }

    return {
        getPlayerStats,
        addPlayer,
        updatePlayer,
        removePlayer,
        addShotToPlayer,
        increasePlayerStat,
        initPlayerStats,
        getMatchState,
        syncCurrentPlayerView,
    };
};

export function computePlayerValue(player: Player, statsInput?: PlayerCurrentStats) {
    const stats = statsInput ?? player.currentStats;
    if(!stats) return 0;

    const attackValue = (stats.goal - stats.miss) +
        ((stats.assistprimary + stats.assistsecondary + stats.provokeCard +
        stats.provokePenalty + stats.provokeTwoMin + stats["1on1win"]) - stats.lostball);

    const defenseValue = (stats.steal + stats.block + stats.defense + stats.defensex2)
        - stats["1on1lost"] - stats.penaltymade - stats.norebound - stats.twominutes - stats.redcard - stats.bluecard;

    stats.value = attackValue + defenseValue;

    return stats.value;
}
