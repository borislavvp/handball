<template>
    <div v-if="shootingTarget !== null" class="flex select-none flex-col w-full text-xl">
        <div class="relative flex flex-col bg-white px-4 pb-4">
            <span class="font-semibold text-gray-800 pt-2 pb-4">{{goalkeeperSelected ? 'Goalkeeper Saves Statistic' : 'Shooting Statistic' }}</span>
            <div class="flex w-full justify-between px-6 gap-6">
                <button @click="addShotToPlayer(goalkeeperSelected ? 'gkmiss' : 'miss')" class="rounded flex-1 p-4 bg-red-700 active:bg-red-900 focus:shadow-inner  font-semibold text-white">{{goalkeeperSelected ? 'GOAL' : 'MISS'}}</button>
                <button @click="addShotToPlayer('gksave')" v-if="goalkeeperSelected" class="rounded flex-1 p-4 bg-emerald-700 active:bg-emerald-900 focus:shadow-inner  font-semibold text-white">STOP</button>
                <button @click="addShotToPlayer('goal')" v-else class="rounded p-4 flex-1 shadow-md  bg-emerald-700 font-semibold text-white active:bg-emerald-900 focus:shadow-inner focus:border-0">GOAL</button>
            </div>
            <!-- @click="addShotToPlayer('goal')" -->
        </div>
    </div>
    <div v-else class="flex flex-col select-none w-full text-xl" >
        <div class="relative flex flex-col bg-white px-4 pb-4">
            <span class="font-semibold text-emerald-800 pt-2 pb-4">Positive</span>
            <div v-if="mode==='attack' && !goalkeeperSelected " class="flex flex-wrap gap-6">
                <button @click="increasePLayerStats('1on1win')" :class="positiveStatStyle">1-1 WON</button>
                <button @click="increasePLayerStats('unbalance')" :class="positiveStatStyle">UNBALANCE</button>
                <button @click="increasePLayerStats('provoke')" :class="positiveStatStyle">PROVOKE</button>
            </div>
            <div v-if="mode==='defense' && !goalkeeperSelected" class="flex flex-wrap gap-6">
                <button @click="increasePLayerStats('block')" :class="positiveStatStyle">BLOCK</button>
                <button @click="increasePLayerStats('steal')" :class="positiveStatStyle">STEAL</button>
                <button @click="increasePLayerStats('defense')" :class="positiveStatStyle">DEFENSE</button>
                <button @click="increasePLayerStats('defensex2')" :class="positiveStatStyle">DEFENSE + STEAL</button>
            </div>  
            <div v-if="goalkeeperSelected" class="flex flex-wrap gap-6">
                <button @click="addShotToPlayer('goal')" :class="positiveStatStyle">GOAL</button>
            </div>
        </div>
        <div class="relative flex flex-col bg-white px-4 pb-4 my-6">
            <span class="font-semibold text-red-800 pt-2 pb-4">Negative</span>
            <div v-if="mode==='attack' || goalkeeperSelected" class="flex flex-wrap gap-6">
                <button @click="increasePLayerStats('lostball')" :class="negativeStatStyle">LOST BALL</button>
            </div>
            <div v-if="mode==='defense' && !goalkeeperSelected" class="flex flex-wrap gap-6">
                <button @click="increasePLayerStats('1on1lost')" :class="negativeStatStyle">1-1 LOST</button>
                <button @click="increasePLayerStats('penaltymade')" :class="negativeStatStyle">7 METER</button>
                <button @click="increasePLayerStats('norebound')" :class="negativeStatStyle">NO REBOUND</button>
            </div>  
        </div>
        <div class="relative flex flex-col bg-white px-4 pb-4">
            <span class="font-semibold text-gray-800 pt-2 pb-4">Suspensions</span>
            <div class="flex flex-wrap gap-6">
                <button @click="increasePLayerStats('twominutes')" :class="suspensionStatStyle">2 MIN</button>
                <button @click="increasePLayerStats('card')" :class="suspensionStatStyle">YELLOW
                    <span class="ml-2 h-6 w-4 bg-yellow-400" />
                </button>
                <button @click="increasePLayerStats('card')" :class="suspensionStatStyle">RED
                    <span class="ml-2 h-6 w-4 bg-red-600" />
                </button>
                <button @click="increasePLayerStats('card')" :class="suspensionStatStyle">BLUE
                    <span class="ml-2 h-6 w-4 bg-blue-600" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Player, ShootingArea, ShootingResult, ShootingTarget, Stats } from '~/types/handball';

const props = defineProps<{
    mode: "attack" | "defense" | "stats",
    goalkeeperSelected: boolean,
    shootingArea: ShootingArea | null,
    shootingTarget: ShootingTarget | null,
    player: Player | null,
    assist: Player | null
}>()

const emit = defineEmits<{
    (e: 'shotAdded'): void
}>();

const store = useHandballStore();
const positiveStatStyle = "rounded p-4 bg-emerald-700 font-semibold text-white active:bg-emerald-900 focus:shadow-inner";
const negativeStatStyle = "rounded p-4 bg-red-700 font-semibold text-gray-100 active:bg-red-900 focus:shadow-inner";
const suspensionStatStyle = "flex items-center rounded p-4 bg-gray-200 font-semibold text-gray-900 active:bg-gray-400 focus:shadow-inner";


const increasePLayerStats = (stat:Stats) => {
    if(!props.player) return;
    store.players.increasePlayerStat(props.player, stat);
}
const addShotToPlayer = (result: ShootingResult) => {
    if(!props.player) return;

    if(props.player.position === 'GK' || (props.shootingTarget === null || !props.shootingArea)) return;
    store.players.addShotToPlayer(props.player, {
        from: props.shootingArea,
        to: props.shootingTarget,
        result: result,
        time: store.matches.currentMatch.value!.time,
    }, props.assist);
    emit('shotAdded')
}
</script>

<style scoped>


</style>
