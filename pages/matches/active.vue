
<template>
  <!-- <div class="h-screen flex flex-col overflow-hidden"> -->
    <div v-if="store.loading.value" class="flex flex-col items-center justify-center min-h-screen bg-white text-center">
      <div class="relative w-24 h-24 mb-6">
        <div class="absolute inset-0 rounded-full border-8 border-[#42b883] opacity-20"></div>
        <div class="absolute inset-0 rounded-full border-8 border-t-[#42b883] border-transparent animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-xl font-bold text-[#42b883]">%</span>
        </div>
      </div>
      <h2 class="text-2xl font-semibold text-gray-800">Syncing match stats…</h2>
      <p class="text-gray-500 mt-2 text-sm">This may take a few seconds</p>
    </div>
    <!-- <div class="flex flex-1 overflow-hidden"> -->
    <div v-if="!match || !team" class="flex items-center justify-center h-full">
      <p class="text-lg text-gray-600"> 'Match not found.'</p>
    </div>
    <div v-else class="h-screen flex flex-col overflow-hidden">
      <!-- header -->
      <game-header />
      <div class="flex flex-1 overflow-hidden">
        <!-- Team Side -->
        <div class="flex flex-col pt-4 border-r border-gray-200 w-2/5 h-full justify-between overflow-x-hidden overflow-y-auto">
          <div class="flex flex-col justify-center">
            <!-- timeouts -->
            <!-- <div class="flex justify-between ml-12 mr-10 items-center">
             
              <button @click="store.matches.toggleEmptyGoal" 
              class="rounded-md select-none w-20 h-20 font-semibold text-lg flex text-gray-900 text-center items-center "
              :class="[
                store.matches.currentMatch.value?.emptyGoal ? 'bg-yellow-300 shadow-inner' : ' border border-gray-800 bg-white shadow-md ' 
              ]"
              >EMPTY GOAL</button>
            </div> -->
            <!-- Players -->
            <div class="h-20 w-full px-4">
              <div v-if="selectedPlayer" class="h-full w-full rounded bg-emerald-900 flex items-center justify-between px-8 text-white select-none">
                <div class="flex items-center space-x-3">
                  <span class="text-xl font-semibold">{{ selectedPlayer.name }}</span>
                  <div class="flex items-center space-x-1">
                    <span class="text-3xl font-semibold">{{ selectedPlayer.number }}</span>
                    <span class="text-xl font-semibold">{{ selectedPlayer.position }}</span>
                  </div>
                </div>
                <span v-if="selectedPlayer.currentStats" class="text-xl font-semibold rounded px-8 py-2"
                :class="[
                  selectedPlayer.currentStats?.value! < 0  ? 'bg-gradient-to-r from-red-700 from-10% via-red-800 via-30% to-red-900 to-90% text-white ' 
                  : selectedPlayer.currentStats?.value! > 0 ? 'bg-gradient-to-b from-emerald-600 from-10% via-emerald-700 via-50% to-emerald-600 to-90% text-white ' 
                  // : p.currentStats?.value > 0 ? 'bg-gradient-to-r from-emerald-700 from-10% via-emerald-800 via-30% to-emerald-900 to-90% text-white ' 
                  // : p.currentStats?.value > 0 ? 'bg-emerald-600 text-white border-emerald-800' 
                  : 'bg-gradient-to-r from-gray-200 from-10%  border to-white text-gray-900 border-gray-300',
                ]">
                {{ selectedPlayer.currentStats?.value! > 0 ? `+${selectedPlayer.currentStats?.value}` : selectedPlayer.currentStats?.value }}</span>
              </div>
              <div v-else class="h-full w-full rounded  flex items-center justify-center px-8 text-gray-800 select-none">
                <span class="text-xl font-semibold">No player selected. Overall stats visible.</span>
              </div>
            </div>
            <div class="flex flex-wrap w-full ml-8 space-x-6 py-6">
              <players-list 
              :stats-mode="store.selection.stats.value.goal" 
              :shooting-target="shootingTarget" 
              />
            </div>
            <!-- Defense System -->
            <div class="flex items-center justify-between mb-5 mx-8">
              <div class="flex items center text-xl">
                <span class="font-semibold">Defense:</span>
                <!-- v-model="store.currentMatch.value.defense" -->
                 <!-- {{ store.matches.currentMatch.value?.defenseSystem }} -->
                <select @input="changeDefenseSystem" 
                :value="store.matches.currentMatch.value?.defenseSystem" class="font-semibold underline ml-2">
                  <option value="6:0">6:0</option>
                  <option value="5:1">5:1</option>
                  <option value="3:2:1">3:2:1</option>
                  <option value="4:2">4:2</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>
              <div class="flex items-center text-xl">
                <span class="font-semibold">Opposite Defense:</span>
                <!-- v-model="store.currentMatch.value.oppositeDefense" -->
                <select @input="changeOppositeDefenseSystem" 
                :value="store.matches.currentMatch.value?.opponentDefenseSystem" class="font-semibold underline ml-2">
                  <option value="6:0">6:0</option>
                  <option value="5:1">5:1</option>
                  <option value="3:2:1">3:2:1</option>
                  <option value="4:2">4:2</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>
            </div>
            <div class="flex items-center justify-between mb-5 mx-8">
             
              <button @click="store.matches.toggleEmptyGoal('home')" 
                class="rounded-md select-none px-4 py-2 font-semibold text-lg flex text-gray-900 text-center items-center "
                :class="[
                  store.matches.currentMatch.value?.emptyGoalHome ? 'bg-yellow-300 shadow-inner' : ' border border-gray-800 bg-white shadow-md ' 
                ]"
              >EMPTY GOAL</button>
              <button @click="store.matches.toggleEmptyGoal('away')" 
                class="rounded-md select-none px-4 py-2 font-semibold text-lg flex text-gray-900 text-center items-center "
                :class="[
                  store.matches.currentMatch.value?.emptyGoalAway ? 'bg-yellow-300 shadow-inner' : ' border border-gray-800 bg-white shadow-md ' 
                ]"
              >OPPOSITE EMPTY GOAL</button>

            </div>
          </div>

        </div>
        <!-- Stats Side -->
        <div class="w-3/5 h-full flex flex-col px-10 py-10 bg-gray-100 overflow-x-hidden overflow-y-auto">
          <!-- <stats-headline class="sticky" v-if="gameMode==='stats'" :player="selectedPlayer" />
          <stats-overview v-if="gameMode==='stats'" :player="selectedPlayer"
            :is-stats-mode="gameMode === 'stats'" class="mb-5 mt-2"/> -->
          <goal 
            @position-click="onShootingTargetClick"
            :goalkeep-selected="selectedPlayer?.position === 'GK'"
            :shooting-target="shootingTarget"
            :shooting-area="shootingArea"
            :player="selectedPlayer"
            :stats-mode="store.selection.stats.value.goal"
            class="relative px-10 bg-gray-100"
          />
          <shooting-position
          v-if="shootingTarget !== null " 
            @position-click="onShootingAreaClick" 
            :player="selectedPlayer"
            :stats-mode="store.selection.stats.value.goal"
            :selected-shooting-target="shootingTarget"
            class="px-10 -mt-4 z-100" 
          />
          <!-- <player-performance-chart v-if="gameMode==='stats' && selectedPlayer" :player="selectedPlayer" /> -->
          <stats-options class="mt-5 flex-1" 
            :mode="gameMode"
            :goal-selected="shootingTarget !== null"
            :goalkeeper-selected="selectedPlayer?.position === 'GK'"
            :shooting-area="shootingArea"
            :shooting-target="shootingTarget"
            :player="selectedPlayer"
            :assist-primary="selectedPrimaryAssist"
            :assist-secondary="selectedSecondaryAssist"
            :mistake-player="selectedMistakePlayer"
            @shot-added="onShotAdded"
          />
        </div>
        <!-- <div class="relative w-19 h-full bg-gray-800 flex flex-col items-center justify-center ">
          <stats-icon 
          @click="toggleGameMode()" class="rounded-full w-16 h-16 transition-transform p-1 absolute shadow-lg border border-gray-400 text-center  -mt-40"
            :class="[  gameMode === 'stats' ? 'scale-125 -ml-8 bg-white text-gray-900' : 'bg-gray-300 text-gray-800 -ml-4']"
          />
          <attack @click="changeGameMode('attack')" class="rounded-full w-16 h-16 p-1 transition-transform absolute shadow-lg border border-gray-400 text-center "
            :class="gameMode === 'attack' ? 'scale-125 -ml-8 bg-white text-gray-900' : '-ml-4 bg-gray-300 text-gray-800'"
          />
          <defense @click="changeGameMode('defense')" class="rounded-full w-16 h-16 p-1 transition-transform absolute shadow-lg border border-gray-400 text-center  mt-40"
            :class="gameMode === 'defense' ? 'scale-125 -ml-8 bg-white text-gray-900' : 'bg-gray-300 text-gray-800 -ml-4'"
          /> 
        </div> -->
      </div>
    </div>
  <!-- </div> -->
  <!-- </div> -->
</template>

<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';
import { ShootingTarget, type DefenseSystem, type Player, type Position, type ShootingArea } from '~/types/handball';
import defense from '~/components/icons/defense2.vue';
import attack from '~/components/icons/attack.vue';
import statsIcon from '~/components/icons/statsIcon.vue';
import Goal from '~/components/game/Goal.vue';
import StatsHeadline from '~/components/game/StatsHeadline.vue';
import PlayersList from '~/components/game/PlayersList.vue';
import StatsOverview from '~/components/game/StatsOverview.vue';
// import PlayerPerformanceChart from '~/components/game/PlayerPerformanceChart.vue';
import GameHeader from '~/components/game/GameHeader.vue';
import ShootingPosition from '~/components/game/ShootingPosition.vue';
import StatsOptions from '~/components/game/StatsOptions.vue';
import type { GameMode } from '~/composables/useSelection';

const { $dialog } = useNuxtApp()
onMounted(async () => {
  if(!store.teams.selectedTeam.value){
    await store.initialize();
  }
})

onActivated(() => {
  if(store.matches.currentMatch.value && store.matches.currentMatch.value.result){
    $dialog.alert({
      title: 'Match Ended',
      message: 'This match has already ended. Please go back to matches overview.',
      okText: 'View Analysis',
    }).then(() => {
      useRouter().push('/matches');
    });
  }
})

const store = useHandballStore();

const match = computed(() => store.matches.currentMatch.value || null);
const team = computed(() => match.value ? store.teams.getTeam(match.value.teamid) : null);

const shootingTarget = ref<ShootingTarget | null>(null);
const shootingArea = ref<ShootingArea | null>(null);

const gameMode = computed(() => store.selection.gameMode.value);

const selectedPlayer = computed<Player | null>(() => {
  return store.selection.player.value;
});

const selectedPrimaryAssist = computed<Player | null>(() => {
  return store.selection.primaryAssist.value;
});

const selectedSecondaryAssist = computed<Player | null>(() => {
  return store.selection.secondaryAssist.value;
});

const selectedMistakePlayer = computed<Player | null>(() => {
  return store.selection.mistakePlayer.value;
});

const toggleGameMode = () => {
  if(store.selection.gameMode.value === 'stats'){
    store.selection.changeGameMode('attack');
  }else{
    store.selection.changeGameMode('stats');
  }
  const mode = store.selection.gameMode.value
  if(mode === 'stats' && (selectedPlayer.value && !selectedPlayer.value?.currentStats)){
    store.selection.player.value = null;
  }
  
  shootingTarget.value = null;
  shootingArea.value = null;
  store.selection.clearSelection();
}

const endCurrentMatch = (result: "WIN" | "LOST") => {
  store.matches.endMatch(result);
  useRouter().push("/matches")
}

const goBack = () => useRouter().back();

function onShotAdded(){
  shootingTarget.value = null;
  shootingArea.value = null;
  store.selection.clearSelection();
}

function onShootingTargetClick(index: number | null){
  shootingTarget.value = index;
  if (shootingTarget.value === null) {
    shootingArea.value = null;
    store.selection.clearSelection();
  }
}


function onShootingAreaClick(index: ShootingArea | null){
  shootingArea.value = index;
}

function changeDefenseSystem(e:Event) {
 store.matches.changeDefenseSystem((e.target as HTMLInputElement).value as DefenseSystem)
}

function changeOppositeDefenseSystem(e:Event) {
 store.matches.changeOpponentDefenseSystem((e.target as HTMLInputElement).value as DefenseSystem)
}

</script>

<style scoped>

</style>

