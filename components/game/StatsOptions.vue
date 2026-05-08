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
        <div class="relative flex flex-col bg-white justify-between p-4 h-98 ">
            <!-- <span class="font-semibold text-emerald-800 pt-2 pb-2">Statistics</span> -->
            <span @click="store.selection.stats.value.general = !store.selection.stats.value.general"
            class="absolute top-0 select-none right-0 -mt-3 -mr-4 rounded-full px-3 py-1 text-2xl font-bold" 
            :class="store.selection.stats.value.general ? 'bg-yellow-300 shadow-inner text-gray-900' : 'text-gray-900 bg-white border border-gray-300 shadow-lg'">
            %</span>
            <div v-if="provokesOpenned" class="absolute flex flex-wrap gap-5 items-center bg-white text-white font-semibold rounded p-4 h-28 -ml-2">
                <button @click="setPlayerProvokeTwoMinutes('provokeCard')" class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center space-x-4">
                    RED <span class="ml-2 h-6 w-4 bg-red-600" />
                </button>
                <button @click="setPlayerProvokeTwoMinutes('provokeCard')" class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center space-x-4">
                    BLUE <span class="ml-2 h-6 w-4 bg-blue-600" />
                </button>
                <button @click="increasePlayerStats('provokeCard')" class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center space-x-4">
                    YELLOW <span class="ml-2 h-6 w-4 bg-yellow-400" />
                </button>
                <button @click="increasePlayerStats('provokePenalty')" class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900">Penalty</button>
                <button @click="setPlayerProvokeTwoMinutes('provokeTwoMin')" class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900">2 MIN</button>
            </div>
            <div v-if="extraDefenseOpened" class="absolute right-0 flex flex-wrap gap-5 items-center bg-white text-white font-semibold rounded p-4 h-28 mr-5">
                <button @click="increasePlayerStats('defensex2')" class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center">
                    <span class="text-md">EXTRA</span>
                    <span class="text-2xl  -mt-1 font-bold">+</span>
                </button>
                <button @click="increasePlayerStats('steal')" class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center ">
                    <span class="text-md">STEAL</span>
                    <steal class="h-6 w-6 text-blue-800" />
                </button>
                <button @click="setPlayerProvokeTwoMinutes('block')" class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center ">
                    <span class="text-md">BLOCK</span>
                    <block class="h-6 w-6 text-gray-800" />
                </button>
            </div>

            <div v-if="!store.selection.stats.value.general" class="h-full" >
                <div v-if="!goalkeeperSelected" class="grid grid-rows-3 gap-8 px-4 mt-2">
                    <div class=" grid grid-cols-4 gap-16 ">
                        <button class="flex flex-col items-center" @click="increasePlayerStats('defense')" :class="positiveStatStyle">
                            <wrestling class="h-12 w-12 text-emerald-800" />
                            <span class="text-md ">DEFENSE</span>
                        </button>
                        <!-- @click="console.log('clicked')"  -->
                        <!-- v-on-long-press.prevent="(_) => toggleExtraDefense()" -->
                        <button class="flex flex-col items-center" 
                        @click="toggleExtraDefense()" 
                         :class="positiveStatStyle">
                            <sumo class="h-12 w-12 text-emerald-800" />
                            <span class="text-md ">DEFENSE+</span>
                        </button>
                        <button class="flex flex-col items-center" @click="addShotToPlayer('goal_empty')" :class="positiveStatStyle">
                            <longdistance class="h-12 w-20 text-emerald-800" />
                            <span class="text-md ">GOAL LD</span>
                        </button>
                        <button class="flex flex-col items-center" @click="toggleProvokes()" :class="positiveStatStyle">
                            <provoke class="h-12 w-12 text-emerald-800" />
                            <span class="text-md ">PROVOKE</span>
                        </button>
                        <!-- <button @click="increasePlayerStats('defensex2')" :class="positiveStatStyle">DEFENSE+</button>
                        <button @click="addShotToPlayer('goal_empty')" :class="positiveStatStyle">GOAL LD</button>
                        <button @click="toggleProvokes()" :class="[positiveStatStyle, provokesOpenned && 'bg-emerald-900']">PROVOKE</button> -->
                        <!-- <button @click="increasePlayerStats('block')" :class="positiveStatStyle">BLOCK</button>
                        <button @click="increasePlayerStats('steal')" :class="positiveStatStyle">STEAL</button> -->
                    </div>
                    <div class="grid grid-cols-4 gap-16 ">
                        
                        <button class="flex flex-col items-center" @click="increasePlayerStats('lostball')" :class="negativeStatStyle">
                            <lostball class="h-12 w-12 text-red-600" />
                            <span class="text-md ">LOST BALL</span>
                        </button>
                        <button class="flex flex-col items-center" @click="increasePlayerStats('1on1lost')" :class="negativeStatStyle">
                            <!-- <shield class="h-12 w-12 text-red-600" /> -->
                            <span class="text-4xl h-12  font-bold">1-1</span>
                            <span class="text-md ">1-1 LOST</span>
                        </button>
                        <button class="flex flex-col items-center" @click="increasePlayerStats('penaltymade')" :class="negativeStatStyle">
                            <whistle class="h-12 w-12 text-red-600" />
                            <span class="text-md ">PENALTY</span>
                        </button>
                        <button class="flex flex-col items-center" @click="increasePlayerStats('norebound')" :class="negativeStatStyle">
                            <norebound class="h-12 w-12 text-red-600" />
                            <span class="text-md ">REBOUND</span>
                        </button>
                        <!-- <button @click="increasePlayerStats('lostball')" :class="negativeStatStyle">LOST BALL</button>
                        <button @click="increasePlayerStats('1on1lost')" :class="negativeStatStyle">1-1 LOST</button>
                        <button @click="increasePlayerStats('penaltymade')" :class="negativeStatStyle">PENALTY</button>
                        <button @click="increasePlayerStats('norebound')" :class="negativeStatStyle">NO REBOUND</button> -->
                    </div>
                    <div class="grid grid-cols-4 gap-16">
                        
                        <button class="flex flex-col items-center" @click="setPlayerTwoMinutes()" :class="suspensionStatStyle">
                            <twofingers class="h-12 w-12 text-gray-800" />
                            <span class="text-md ">2 MIN</span>
                        </button>
                        <button class="flex flex-col justify-center items-center" @click="increasePlayerStats('yellowcard')" :class="suspensionStatStyle">
                            <span class="h-12 w-8 bg-yellow-500" />
                            <span class="text-md ">CARD</span>
                        </button>
                        <button class="flex flex-col justify-center items-center" @click="increasePlayerStats('redcard')" :class="suspensionStatStyle">
                            <span class="h-12 w-8 bg-red-600" />
                            <span class="text-md ">CARD</span>
                        </button>
                        <button class="flex flex-col justify-center items-center" @click="increasePlayerStats('bluecard')" :class="suspensionStatStyle">
                            <span class="h-12 w-8 bg-blue-600" />
                            <span class="text-md ">CARD</span>
                        </button>
                        <!-- <button @click="setPlayerTwoMinutes()" :class="suspensionStatStyle">2 MIN</button> -->
                        <!-- <button @click="increasePlayerStats('yellowcard')" :class="suspensionStatStyle">YELLOW
                            <span class="ml-2 h-6 w-4 bg-yellow-400" />
                        </button>
                        <button @click="increasePlayerStats('redcard')" :class="suspensionStatStyle">RED
                            <span class="ml-2 h-6 w-4 bg-red-600" />
                        </button>
                        <button @click="increasePlayerStats('bluecard')" :class="suspensionStatStyle">BLUE
                            <span class="ml-2 h-6 w-4 bg-blue-600" />
                        </button> -->
                    </div>
                    
                </div>  
                <div v-if="goalkeeperSelected" class="flex flex-col gap-6">
                    <div class="flex flex-wrap gap-3">
                        <button @click="addShotToPlayer('goal_empty')" :class="positiveStatStyle">GOAL</button>
                    </div>
                    <div class="flex flex-wrap gap-3">
                        <button @click="increasePlayerStats('lostball')" :class="negativeStatStyle">LOST BALL</button>
                        <button @click="addShotToPlayer('gkmiss_empty')" :class="negativeStatStyle">EMPTY GOAL</button>
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
            </div>
            <div v-else >
                <stats-overview :player="store.selection.player.value" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ShootingTarget, type Player, type ShootingArea, type ShootingResult, type Stats } from '~/types/handball';
import ToggleButton from '../shared/ToggleButton.vue';
import StatsOverview from './StatsOverview.vue';
import Wrestling from '../icons/wrestling.vue';
import Sumo from '../icons/sumo.vue';
import Provoke from '../icons/provoke.vue';
import Longdistance from '../icons/longdistance.vue';
import Norebound from '../icons/norebound.vue';
import Whistle from '../icons/whistle.vue';
import Lostball from '../icons/lostball.vue';
import Twofingers from '../icons/twofingers.vue';
import Steal from '../icons/steal.vue';
import Block from '../icons/block.vue';
// import { vOnLongPress } from '@vueuse/components'

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
const positiveStatStyle = "rounded-2xl border-2 border-emerald-700 p-2 bg-gray-10 h-24 text-emerald-700 font-semibold uppercase  active:bg-emerald-100 focus:shadow-inner";
const negativeStatStyle = "rounded-2xl border-2 border-red-700 p-2 bg-gray-10 h-24 text-red-700 font-semibold uppercase  active:bg-red-100 focus:shadow-inner";
const suspensionStatStyle = "flex items-center justify-center rounded-2xl h-24 p-2 border-2 border-gray-400 bg-gray-10 text-gray-700 font-semibold uppercase  active:bg-gray-100 focus:shadow-inner";
const oneOnOneWin = ref(false)
const oneOnOneLost = ref(false)
const fastBreak = ref(false)
const activeMatch = computed(() => store.matches.match.value!)
const { $dialog } = useNuxtApp();

const provokesOpenned = ref(false)
const extraDefenseOpened = ref(false)

watch(() => props.player, (newVal) => {
    oneOnOneWin.value = false;
    oneOnOneLost.value = false;
    store.selection.oneOnOneLost.value = false;
})

const toggleExtraDefense = () => {
    extraDefenseOpened.value = !extraDefenseOpened.value
}

const toggleProvokes = () => {
    provokesOpenned.value = !provokesOpenned.value
}

const increasePlayerStats = (stat:Stats,player:Player = props.player!) => {
    store.players.increasePlayerStat(player, stat);
    store.selection.clearSelection();
    if(provokesOpenned.value){
        provokesOpenned.value = false
    }
}

const addShotToPlayer = (result: ShootingResult,) => {
    if(!props.player) {
        $dialog.alert({ title:"Please select a player!" })
        return;
    };

    let shootingArea = props.shootingArea;
    let shootingTarget = props.shootingTarget;

    if(result === 'gkmiss_empty' || result === 'goal_empty') {
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
    if(result === 'gkmiss' || result === 'gkmiss_empty'){
        activeMatch.value.increaseMatchScore("away")
    } else if(result === 'goal' || result === 'goal_empty'){
        activeMatch.value.increaseMatchScore("home")
        // increasePlayerStats('goal_empty', props.player!)
    }
    store.players.addShotToPlayer(props.player, {
        from: shootingArea,
        to: shootingTarget,
        result: result,
        time: activeMatch.value.data.value.time,
        playerid: props.player.id,
        fastbreak: fastBreak.value,
        breakthrough: props.goalkeeperSelected ? oneOnOneLost.value : oneOnOneWin.value,
        assistPrimary: store.selection.primaryAssist.value?.id || null,
        assistSecondary: store.selection.secondaryAssist.value?.id || null,
        mistakePlayer: store.selection.mistakePlayer.value?.id || null,
        matchid: activeMatch.value.data.value!.id,
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
    store.matches.match.value?.addTwoMinute(props.player!.id, "away");
    if(provokesOpenned.value){
        provokesOpenned.value = false
    }
}
const setPlayerTwoMinutes = () => {
    increasePlayerStats('twominutes')
    store.matches.match.value?.addTwoMinute(props.player!.id, "home");
    store.selection.clearSelection();
}

</script>

<style scoped>


</style>
