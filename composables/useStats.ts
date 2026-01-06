import type { CreatePlayerBody } from "~/types/dto";
import type { CurrentMatch, Player, PlayerCurrentStats, PlayerStats, Position, Shot, Stats, Team } from "~/types/handball";
import type { LoadingState } from "./useLoading";
import type { GameSelection } from "./useSelection";

export const useStats = (
    selection: GameSelection,
    team: ComputedRef<Team | undefined>,
    currentMatch:Ref<CurrentMatch | null>) => {
    

    const attackValue = computed(() => {
        if(selection.player.value){
            return computeAttackValue(selection.player.value.currentStats!);
        }else{
            return computeTeamStats(computeAttackValue);
        }
    })

    const defenseValue = computed(() => {
        if(selection.player.value){
            const value =  computeDefenseValue(selection.player.value.currentStats);
            return value ? value : 0;
        }else{
            return computeTeamStats(computeDefenseValue);
        }
    })
    const gkSavesValue = computed(() => {
        if(selection.player.value){
            const value =  computeGKSavesValue(selection.player.value.currentStats);
            return value ? value : 0;
        }else{
            return computeTeamStats(computeGKSavesValue);
        }

       
    })
    function computeTeamStats(computeFn: (stats: PlayerCurrentStats) => number) {
        const value = team.value!.players.reduce((acc, player) => {
            const stats = player.currentStats;
            if (stats) {
                return acc + computeFn(stats);
            } else {
                return acc;
            }
        }, 0) / (team.value?.players.length || 1);

        return Math.round(value);
    }

    const computeGKSavesValue = (stats?: PlayerCurrentStats) => {
        if(!stats){
            return -1;
        }
        const positive = stats.gksave;
        const total = stats.gksave + stats.gkmiss;
        return Math.round(positive/(total > 0 ? total : 1) * 100);
    }

    const computeDefenseValue = (stats?: PlayerCurrentStats) => {
        if(!stats){
            return -1;
        }
        const positive = stats.steal + stats.block + stats.defense + stats.defensex2;
        const negative = stats["1on1lost"] + stats.penaltymade + stats.norebound + stats.twominutes + stats.redcard + stats.bluecard;

        const value = positive/(positive + negative);
        const final = (value ? value : 0) * 100
        return Math.round(final);
    }

    const computeAttackValue = (stats?: PlayerCurrentStats) => {
        if(!stats){
            return -1;
        }
        const positive = stats.goal  + stats.assistprimary + stats.assistsecondary + stats.provokeCard +
            stats.provokePenalty + stats.provokeTwoMin + stats["1on1win"]
        const negative = stats.miss + stats.lostball

        const value = positive/(positive + negative);
        const final = (value ? value : 0) * 100
        return Math.round(final);
    }
    

    return {
        defenseValue,
        attackValue,
        gkSavesValue
    }
}