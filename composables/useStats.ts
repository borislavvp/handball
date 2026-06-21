import type { Player, PlayerCurrentStats, PlayerStats, Position, Shot, Stats, Team } from "~/types/handball";
import type { GameSelection } from "./useSelection";

export const useStats = (
    selection: GameSelection,
    team: ComputedRef<Team | undefined>) => {
    

    const attackValue = computed(() => {
        if(selection.player.value){
            return computeAttackValue(selection.player.value.currentStats!);
        }else{
            return computeTeamAttackValue();
        }
    })

    const defenseValue = computed(() => {
        if(selection.player.value){
            const value =  computeDefenseValue(selection.player.value.currentStats);
            return value ? value : 0;
        }else{
            return computeTeamDefenseValue();
        }
    })
    const gkSavesValue = computed(() => {
        if(selection.player.value){
            const value =  computeGKSavesValue(selection.player.value.currentStats);
            return value ? value : 0;
        }else{
            return computeTeamGKSavesValue();
        }


    })

    function computeTeamAttackValue() {
        const players = team.value?.players ?? [];
        let positive = 0;
        let negative = 0;
        players.forEach(player => {
            const stats = player.currentStats;
            if (!stats) return;
            positive += stats.goal + stats.assistprimary + stats.assistsecondary + stats.provokeCard +
                stats.provokePenalty + stats.provokeTwoMin + stats["1on1win"];
            negative += stats.miss + stats.lostball;
        });
        if (positive + negative === 0) return 0;
        return Math.round((positive / (positive + negative)) * 100);
    }

    function computeTeamDefenseValue() {
        const players = team.value?.players ?? [];
        let positive = 0;
        let negative = 0;
        players.forEach(player => {
            const stats = player.currentStats;
            if (!stats) return;
            positive += stats.steal + stats.block + stats.defense + stats.defensex2;
            negative += stats["1on1lost"] + stats.penaltymade + stats.norebound + stats.twominutes + stats.redcard + stats.bluecard;
        });
        if (positive + negative === 0) return 0;
        return Math.round((positive / (positive + negative)) * 100);
    }

    function computeTeamGKSavesValue() {
        const players = team.value?.players ?? [];
        let saves = 0;
        let total = 0;
        players.forEach(player => {
            const stats = player.currentStats;
            if (!stats) return;
            if (stats.gksave + stats.gkmiss === 0) return;
            saves += stats.gksave;
            total += stats.gksave + stats.gkmiss;
        });
        if (total === 0) return 0;
        return Math.round((saves / total) * 100);
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
        const positive = stats.goal + stats.assistprimary + stats.assistsecondary + stats.provokeCard +
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