import type { CreatePlayerBody } from "~/types/dto";
import type { CurrentMatch, Player, PlayerStats, Position, Shot, Stats, Team } from "~/types/handball";
import type { LoadingState } from "./useLoading";

export const usePlayer = (
    loadingState: LoadingState,
    team: ComputedRef<Team | undefined>,
    currentMatch:Ref<CurrentMatch | null>) => {
    function getPlayer(playerId:number): Player | undefined {
        return team.value?.players.find(p => p.id === playerId);
    }
    async function getPlayerStats(playerId: number): Promise<PlayerStats[]>{
        const { $supabase } = useNuxtApp()
        loadingState.fetching.value = true;
        const {data, error} = await $supabase
            .from('player_stats')
            .select(`*,match (id,result,createdat,opponent,score, opponentScore, timeoutsLeft, shots(*))`)
            .eq('playerid', playerId)

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
            body: { name, number, position, teamId:team.value.id } as CreatePlayerBody
        })
        const p: Player = { 
            id: playerId as number,
            name, number, position, 
            currentShots:[],
            recentStats:[],
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
            body: data
        })
        }

        async function removePlayer(playerId: number) {
        if (!team.value) return;
        await $fetch(`/api/player/${playerId}`, { method: 'DELETE' })
        const index = team.value.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            team.value.players.splice(index, 1); 
        }
    }

    function initPlayerStats(){
        return {
            "1on1lost": 0,
            "1on1win": 0,
            goal: 0,
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
            penaltyscored: 0,
            miss: 0,
            safe: 0,
            lostball: 0,
            gkmiss: 0,
            gksave: 0,
            provokePenalty: 0,
            provokeTwoMin: 0,
            provokeCard: 0,
            block: 0,
            norebound: 0,
            value:0,
        } 
    }

    function addShotToPlayer(player: Player, shot: Shot, ) {
        if(!player.currentShots){
            player.currentShots = [];
        }
        player.currentShots.push(shot);
        $fetch('/api/shots', {
            method: 'POST',
            body: { matchId: currentMatch.value?.id, playerId: player.id, shot }
        })
        if(!player.currentStats){
            player.currentStats = initPlayerStats();
        }
        player.currentStats[shot.result] += 1;
        console.log("increment");
        if(shot.assistPrimary){
            console.log("increment assist primary");
            const player = getPlayer(shot.assistPrimary); 
            if(player){
                if(!player.currentStats){
                    console.log("init assist primary stats");
                    player.currentStats = initPlayerStats();
                }
                console.log("increment assist primary stats", player.currentStats.assistprimary);
                player.currentStats.assistprimary += 1;
                console.log("increment assist primary stats after", player.currentStats.assistprimary);
            }
        }
        if(shot.assistSecondary){
            const player = getPlayer(shot.assistSecondary); 
            if(player){
                if(!player.currentStats){
                    player.currentStats = initPlayerStats();
                }
                player.currentStats.assistsecondary += 1;
            }
        }
        currentMatch.value?.shots.push(shot)
        if(shot.result === 'gkmiss'){
            currentMatch.value!.opponentScore++;
        } else if(shot.result === 'goal'){
            currentMatch.value!.score++;
        }
        computePlayerValue(player);
    }

    function increasePlayerStat(player: Player, stat:Stats) {
        if(!player.currentStats){
            player.currentStats = initPlayerStats();
            player.currentStats[stat] += 1;
            computePlayerValue(player);
            $fetch('/api/stats', {
                method: 'POST',
                body: { matchId: currentMatch.value?.id, playerId: player.id, statType: stat }
            })
            return;
        }
        player.currentStats[stat] += 1;
        if(stat === 'twominutes'){
            if (player.currentStats.twominutes > 1){
            }
            player.hasTwoMinutes = true
        }
        computePlayerValue(player);
        $fetch('/api/stats', {
            method: 'PUT',
            body: { matchId: currentMatch.value?.id, playerId: player.id, statType: stat  }
        })
    }

    return {
        getPlayerStats,
        addPlayer,
        updatePlayer,
        removePlayer,
        addShotToPlayer,
        increasePlayerStat,
    }
}

export function computePlayerValue(player:Player) {
        const stats = player.currentStats;
        if(!stats) return 0;
        let value = 0;
        let attackValue = 0;
        let defenseValue = 0;
        
        // Field player: Goals - Misses + ((Assist + Unbalance + Provokes + 1-1 Win) - Lost balls) + Defense)
        // // Defense: (Steals + Blocks + Defense + Defenese x2) - 1-1 Lost - Penalty Made - No Rebound - Suspensions
        // Goalkeeper: (Saves/Total)*100 ,  Field Player Value
        attackValue = (stats.goal - stats.miss) + 
            ((stats.assistprimary + stats.assistsecondary + stats.provokeCard +
            stats.provokePenalty + stats.provokeTwoMin + stats["1on1win"]) - stats.lostball) 
        defenseValue = (stats.steal + stats.block + stats.defense + stats.defensex2) 
        - stats["1on1lost"] - stats.penaltymade - stats.norebound - stats.twominutes - stats.redcard - stats.bluecard;
        value = attackValue + defenseValue;

        // if(player.position === 'GK'){
        //     const totalShots = stats.gksave + stats.gkmiss;
        //     const savePercentage = totalShots > 0 ? Math.floor((stats.gksave / totalShots) * 10) : 0;
        //     stats.value = (savePercentage) + value;
        // }else{
        //     stats.value = value;
        // }
        stats.value = value;
    }
