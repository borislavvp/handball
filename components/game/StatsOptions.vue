<template>
    <div v-if="shootingTarget !== null" class="flex select-none flex-col w-full text-xl">
        <div class="relative flex flex-col bg-white px-4 pb-4">
            <span class="font-semibold text-gray-800 pt-2 pb-4">{{goalkeeperSelected ? 'Goalkeeper Saves Statistic' : 'Shooting Statistic' }}</span>
            <div v-if="goalkeeperSelected" class="flex justify-between gap-6 px-6 mb-4">
                <toggle-button :value="oneOnOneLost" @update:model-value="(val) => updateOneOnOneLost(val)" negative label="1-1 LOST" class="flex-1" /> 
                <toggle-button v-model="fastBreak" negative label="FASTBREAK" class="flex-1" /> 
            </div>
            <div v-else class="flex justify-between gap-6 px-6 mb-4">
                <toggle-button v-model="oneOnOneWin" label="1-1 WON" class="flex-1" /> 
                <toggle-button v-model="fastBreak" label="FASTBREAK" class="flex-1" /> 
            </div>
            <div class="flex w-full justify-between px-6 gap-6">
                <button @click="addShotToPlayer(goalkeeperSelected ? 'gkmiss' : 'miss')" class="rounded flex-1 p-4 bg-red-700 active:bg-red-900 focus:shadow-inner  font-semibold text-white">{{goalkeeperSelected ? 'GOAL' : 'MISS'}}</button>
                <button @click="addShotToPlayer('gksave')" v-if="goalkeeperSelected" class="rounded flex-1 p-4 bg-emerald-700 active:bg-emerald-900 focus:shadow-inner  font-semibold text-white">STOP</button>
                <button @click="addShotToPlayer('goal')" v-else class="rounded p-4 flex-1 shadow-md  bg-emerald-700 font-semibold text-white active:bg-emerald-900 focus:shadow-inner focus:border-0">GOAL</button>
            </div>
            <!-- @click="addShotToPlayer('goal')" -->
        </div>
    </div>
    <div v-else class="flex flex-col select-none w-full text-xl" >
        <div class="relative flex flex-col bg-white px-4 py-10 ">
            <!-- <span class="font-semibold text-emerald-800 pt-2 pb-2">Statistics</span> -->
            <span @click="store.selection.stats.value.general = !store.selection.stats.value.general"
            class="absolute top-0 select-none right-0 -mt-2 -mr-1 rounded-full px-3 py-1 text-2xl font-bold" 
            :class="store.selection.stats.value.general ? 'bg-yellow-300 shadow-inner text-gray-900' : 'text-gray-900 bg-white border border-gray-300 shadow-lg'">
            %</span>
            <div v-if="provokesOpenned" class="absolute flex flex-wrap gap-5 bg-white text-white rounded p-4 -mt-1 -ml-2">
                <button @click="increasePlayerStats('provokeTwoMin')" class="bg-emerald-700 p-1 rounded-full px-2 shadow-lg border border-emerald-900">2 MIN</button>
                <button @click="setPlayerProvokeTwoMinutes('provokePenalty')" class="bg-emerald-700 p-1 rounded-full px-2 shadow-lg border border-emerald-900">Penalty</button>
                <button @click="increasePlayerStats('provokeCard')" class="bg-emerald-700 p-1 rounded-full px-2 shadow-lg border border-emerald-900 flex items-center space-x-4">
                    YELLOW <span class="ml-2 h-6 w-4 bg-yellow-400" />
                </button>
                <button @click="setPlayerProvokeTwoMinutes('provokeCard')" class="bg-emerald-700 p-1 rounded-full px-2 shadow-lg border border-emerald-900 flex items-center space-x-4">
                    RED <span class="ml-2 h-6 w-4 bg-red-600" />
                </button>
                <button @click="setPlayerProvokeTwoMinutes('provokeCard')" class="bg-emerald-700 p-1 rounded-full px-2 shadow-lg border border-emerald-900 flex items-center space-x-4">
                    BLUE <span class="ml-2 h-6 w-4 bg-blue-600" />
                </button>
            </div>

            <div v-if="!store.selection.stats.value.general" >
                <div v-if="!goalkeeperSelected" class="flex flex-col gap-6">
                    <div class="flex flex-wrap gap-3">
                        <button @click="increasePlayerStats('block')" :class="positiveStatStyle">BLOCK</button>
                        <button @click="increasePlayerStats('steal')" :class="positiveStatStyle">STEAL</button>
                        <button @click="increasePlayerStats('defense')" :class="positiveStatStyle">DEFENSE</button>
                        <button @click="increasePlayerStats('defensex2')" :class="positiveStatStyle">DEFENSE + STEAL</button>
                        <button @click="toggleProvokes()" :class="[positiveStatStyle, provokesOpenned && 'bg-emerald-900']">PROVOKE</button>
                    </div>
                    <div class="flex flex-wrap gap-6">
                        <button @click="increasePlayerStats('lostball')" :class="negativeStatStyle">LOST BALL</button>
                        <button @click="increasePlayerStats('1on1lost')" :class="negativeStatStyle">1-1 LOST</button>
                        <button @click="increasePlayerStats('penaltymade')" :class="negativeStatStyle">PENALTY</button>
                        <button @click="increasePlayerStats('norebound')" :class="negativeStatStyle">NO REBOUND</button>
                    </div>
                    <div class="flex flex-wrap gap-6">
                        <button @click="setPlayerTwoMinutes()" :class="suspensionStatStyle">2 MIN</button>
                        <button @click="increasePlayerStats('yellowcard')" :class="suspensionStatStyle">YELLOW
                            <span class="ml-2 h-6 w-4 bg-yellow-400" />
                        </button>
                        <button @click="increasePlayerStats('redcard')" :class="suspensionStatStyle">RED
                            <span class="ml-2 h-6 w-4 bg-red-600" />
                        </button>
                        <button @click="increasePlayerStats('bluecard')" :class="suspensionStatStyle">BLUE
                            <span class="ml-2 h-6 w-4 bg-blue-600" />
                        </button>
                    </div>
                    
                </div>  
                <div v-if="goalkeeperSelected" class="flex flex-wrap gap-6">
                    <button @click="addShotToPlayer('goal')" :class="positiveStatStyle">GOAL</button>
                    <button @click="addShotToPlayer('goal', true)" :class="negativeStatStyle">EMPTY GOAL</button>
                </div>
            </div>
            <div v-else>
                <stats-overview :player="store.selection.player.value" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ShootingTarget, type Player, type ShootingArea, type ShootingResult, type Stats } from '~/types/handball';
import ToggleButton from '../shared/ToggleButton.vue';
import StatsOverview from './StatsOverview.vue';

const props = defineProps<{
    // mode: "attack" | "defense" | "stats",
    goalkeeperSelected: boolean,
    shootingArea: ShootingArea | null,
    shootingTarget: ShootingTarget | null,
    player: Player | null,
}>()

const emit = defineEmits<{
    (e: 'shotAdded'): void;
    (e: 'twoMinutes', playedId:number) : void
}>();

const store = useHandballStore();
const positiveStatStyle = "rounded p-4 bg-emerald-700 font-semibold uppercase text-white active:bg-emerald-900 focus:shadow-inner";
const negativeStatStyle = "rounded p-4 bg-red-700 font-semibold text-gray-100 active:bg-red-900 focus:shadow-inner";
const suspensionStatStyle = "flex items-center rounded p-4 bg-gray-200 font-semibold text-gray-900 active:bg-gray-400 focus:shadow-inner";
const oneOnOneWin = ref(false)
const oneOnOneLost = ref(false)
const fastBreak = ref(false)

const { $dialog } = useNuxtApp();

const provokesOpenned = ref(false)

watch(() => props.player, (newVal) => {
    oneOnOneWin.value = false;
    oneOnOneLost.value = false;
    store.selection.oneOnOneLost.value = false;
})

const toggleProvokes = () => {
    provokesOpenned.value = !provokesOpenned.value
}

const increasePlayerStats = (stat:Stats,player:Player = props.player!) => {
    store.players.increasePlayerStat(player, stat);
}

const addShotToPlayer = (result: ShootingResult, emptyGoal = false) => {
    if(!props.player) {
        $dialog.alert({ title:"Please select a player!" })
        return;
    };

    let shootingArea = props.shootingArea;
    let shootingTarget = props.shootingTarget;

    if(emptyGoal){
        shootingArea = 'CB9';
        shootingTarget = ShootingTarget.GOAL_MIDDLE_MIDDLE
    } else if(props.shootingTarget === null || props.shootingArea === null) {
        $dialog.alert( { title:"Please select shooting area and target!"})
        return;
    }else{
        shootingArea = props.shootingArea!;
        shootingTarget = props.shootingTarget!;
    }
    if(oneOnOneWin.value){
        increasePlayerStats('1on1win')
    }
    if(oneOnOneLost.value){
        increasePlayerStats('1on1lost',store.selection.mistakePlayer.value!)
    }
    store.players.addShotToPlayer(props.player, {
        from: shootingArea,
        to: shootingTarget,
        result: result,
        time: store.matches.currentMatch.value!.time,
        playerid: props.player.id,
        fastbreak: fastBreak.value,
        breakthrough: props.goalkeeperSelected ? oneOnOneLost.value : oneOnOneWin.value,
        assistPrimary: store.selection.primaryAssist.value?.id || null,
        assistSecondary: store.selection.secondaryAssist.value?.id || null,
        mistakePlayer: store.selection.mistakePlayer.value?.id || null,
        matchid: store.matches.currentMatch.value!.id,
    });

    oneOnOneWin.value = false;
    fastBreak.value = false;    
    oneOnOneLost.value = false;
    store.selection.clearSelection();
    emit('shotAdded')
}

const updateOneOnOneLost = (val:boolean) => {
    oneOnOneLost.value = val;
    store.selection.oneOnOneLost.value = val;
}

const setPlayerProvokeTwoMinutes = (stat: Stats) => {
    increasePlayerStats(stat)
    const index = store.matches.currentMatch.value!.twoMinutesAway.length > 0 ? 
    store.matches.currentMatch.value!.twoMinutesAway[store.matches.currentMatch.value!.twoMinutesAway.length - 1]! + 1 : 1; 

    store.matches.currentMatch.value?.twoMinutesAway.push(index)
}
const setPlayerTwoMinutes = () => {
    increasePlayerStats('twominutes')
    store.matches.currentMatch.value?.twoMinutesHome.push(props.player!.id)
}

</script>

<style scoped>


</style>
