<template>
<div class="flex flex-wrap select-none justify-center  w-full text-xl">

    <stat-bar v-if="player?.position === 'GK'" :value="store.stats.gkSavesValue.value" label="Saves" :show-numbers="true" class="my-3"/>
    <stat-bar v-if="player?.position !== 'GK'" :value="store.stats.attackValue.value" label="Attack" :show-numbers="true" class="my-3"/>
    <stat-bar v-if="player?.position !== 'GK'" :value="store.stats.defenseValue.value" label="Defense" :show-numbers="true" />

    <div class="w-full mt-6 flex justify-start space-x-6 items-center ">
        <div v-for="stat in extraStats" class="rounded flex items-center justify-between border border-gray-200 px-4 py-2 w-full bg-gray-100 ">
            <p class="font-medium text-lg capitalize" >{{ stat.text }}</p >
            <p class="font-medium text-xl " :style="`color: ${stat.color}`">{{ stat.value }}</p>
        </div> 
    </div>
</div>
</template>

<script setup lang="ts">
import type { Player, Shot, Stats } from '~/types/handball';
import { getBinaryColor, getScoreColor } from '../utils/getScoreColor';
import StatBar from './StatBar.vue';

const props = defineProps<{
    player: Player | null;
}>()

const store = useHandballStore();

const upscale = (value: number) => {
    return Number((value  * 100).toFixed(0));
}


const saveEfficiency = computed(() => {
    let value = 0;
    let available = true;
    const getData = (shots: Shot[]) => {
        const saves = shots?.filter(s => s.result === 'gksave').length ?? 0 ;
        const total = (shots?.filter(s => s.result === 'gksave' || s.result === 'gkmiss').length ?? 1) 
        return upscale(saves / total);
    }
    if(props.player){
        if(props.player.position !== 'GK'){
            available = false;
        }else{
            value = getData(props.player.currentShots ?? []);
        }
    }else{
        if(!store.matches.currentMatch.value?.shots || store.matches.currentMatch.value?.shots.length === 0){
            available = false;
        }else{
            value = getData(store.matches.currentMatch.value?.shots ?? []);
        }
    }

    return {available, text:"SAVED", value: `${value}%`, color: getScoreColor(value).textColor};
})

const getStatPercentage = (text:string, stats: Stats[], inverted:boolean = false) => {
    let value = 0;
    let available = true;
    if(props.player ){
        if(!props.player.currentStats){
            available = false;
        }else{
            stats.forEach(stat => {
                value += props.player!.currentStats![stat];
            });
            if(value === 0) {
                available = false;
            }
        }
    }else{
        const players = store.teams.selectedTeam.value?.players;
        stats.forEach(stat => {
            value += players?.reduce((sum, player) => sum + (player.currentStats?.[stat] ?? 0), 0) ?? 0;
        });
        if(value === 0) {
            available = false;
        }
    }
    return {available, text, value, color: getBinaryColor(inverted ? value === 0 : value > 0)};
}

const steals = computed(() => getStatPercentage('Steals', ['steal']));
const blocks = computed(() => getStatPercentage('Blocks', ['block']));
const oneOnOneWin = computed(() => getStatPercentage('1-1 Wins', ['1on1win']));
const oneOnOneLost = computed(() => getStatPercentage('1-1 Lost', ['1on1lost'], true));
const assists = computed(() => getStatPercentage('Assists', ['assistprimary', 'assistsecondary']));
const provokes = computed(() => getStatPercentage('Provokes', ['provokeCard', 'provokeTwoMin', 'provokePenalty']));
const twoMinutes = computed(() => getStatPercentage('2 Mins', ['twominutes'], true));


const extraStats = computed(() => {
    const stats = [];
    if(props.player){
        if(assists.value.available){
            stats.push(assists.value);
        }
        if(twoMinutes.value.available){
            stats.push(twoMinutes.value);
        }
    }
    if(oneOnOneWin.value.available){
        stats.push(oneOnOneWin.value);
    }
    if(oneOnOneLost.value.available){
        stats.push(oneOnOneLost.value);
    }
    if(provokes.value.available){
        stats.push(provokes.value);
    }
    if(steals.value.available){
        stats.push(steals.value);
    }
    if(blocks.value.available){
        stats.push(blocks.value);
    }
    return stats;
})

const defenseEfficiency = computed(() => {
    if(props.player){
        const goodDefense = (props.player.currentStats?.steal ?? 0) + 
                            (props.player.currentStats?.block ?? 0) +
                            (props.player.currentStats?.defense ?? 0) +
                            (props.player.currentStats?.defensex2 ?? 0);

        const badDefense = (props.player.currentStats?.['1on1lost'] ?? 0) +
                            (props.player.currentStats?.norebound ?? 0) +
                            (props.player.currentStats?.twominutes ?? 0) +
                            (props.player.currentStats?.redcard ?? 0) +
                            (props.player.currentStats?.bluecard ?? 0);

        const value = badDefense === 0 ? 0 : upscale(goodDefense / (goodDefense+badDefense))
        return {available: value > 0, text: 'DEFENSE',goodDefense, badDefense, value: `${value}%`, color: getScoreColor(value).textColor};
    }
    const players = store.teams.selectedTeam.value?.players;

    const goodDefense = players?.reduce((sum, player) => sum + (player.currentStats?.steal ?? 0) + 
                                    (player.currentStats?.block ?? 0) +
                                    (player.currentStats?.defense ?? 0) +
                                    (player.currentStats?.defensex2 ?? 0) , 0) ?? 0;

    const badDefense = players?.reduce((sum, player) => sum + (player.currentStats?.['1on1lost'] ?? 0) +
                                    (player.currentStats?.norebound ?? 0) +
                                    (player.currentStats?.twominutes ?? 0) +
                                    (player.currentStats?.redcard ?? 0) +
                                    (player.currentStats?.bluecard ?? 0), 0) ?? 0;

    const value = badDefense === 0 ? 0 : upscale(goodDefense / (goodDefense+badDefense))

    return { available: value > 0,text: 'DEFENSE', goodDefense, badDefense, value: `${value}%`, color: getScoreColor(value).textColor};
})

</script>

<style scoped>

</style>
