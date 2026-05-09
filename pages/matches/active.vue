
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
        <div class="flex flex-col mt-4 border-r border-gray-200 w-2/5 h-full justify-between overflow-x-hidden overflow-y-auto">
          <div class="flex flex-col justify-center">
            <!-- Players -->
            <div class="h-20 w-full px-4">
              <selected-player-tag v-if="selectedPlayer" :selected-player="selectedPlayer" />
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
                <select @input="changeDefenseSystem" 
                :value="match.data.value.defenseSystem" class="font-semibold underline ml-2">
                  <option value="6:0">6:0</option>
                  <option value="5:1">5:1</option>
                  <option value="3:2:1">3:2:1</option>
                  <option value="4:2">4:2</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>
              <div class="flex items-center text-xl">
                <span class="font-semibold">Opposite Defense:</span>
                <select @input="changeOppositeDefenseSystem" 
                :value="match.data.value.opponentDefenseSystem" class="font-semibold underline ml-2">
                  <option value="6:0">6:0</option>
                  <option value="5:1">5:1</option>
                  <option value="3:2:1">3:2:1</option>
                  <option value="4:2">4:2</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>
            </div>
            <div class="flex items-center justify-between mb-5 mx-8">
             
              <button @click="match.toggleEmptyGoal('home')" 
                class="rounded-md select-none px-4 py-2 font-semibold text-lg flex text-gray-900 text-center items-center "
                :class="[
                  match.data.value.emptyGoalHome ? 'bg-yellow-300 shadow-inner' : ' border border-gray-800 bg-white shadow-md ' 
                ]"
              >EMPTY GOAL</button>
              <button @click="match.toggleEmptyGoal('away')" 
                class="rounded-md select-none px-4 py-2 font-semibold text-lg flex text-gray-900 text-center items-center "
                :class="[
                  match.data.value.emptyGoalAway ? 'bg-yellow-300 shadow-inner' : ' border border-gray-800 bg-white shadow-md ' 
                ]"
              >OPPOSITE EMPTY GOAL</button>

            </div>
          </div>

        </div>
        <!-- Stats Side -->
        <div class="w-3/5 h-full flex flex-col px-10 py-6 bg-gray-100 overflow-x-hidden" 
        :class="shootingTarget !== null ? 'overflow-y-auto' : 'overflow-y-hidden'">
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
            class="bg-white px-10 -mt-4 z-100" 
          />
          <stats-options 
            class="flex-1"
            :class="shootingTarget === null && 'mt-5'" 
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
        
      </div>
    </div>
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
import SelectedPlayerTag from '~/components/game/SelectedPlayerTag.vue';

const { $dialog } = useNuxtApp()

const store = useHandballStore();

const match = computed(() => store.matches.match.value || null);

const team = computed(() => match.value ? store.teams.getTeam(match.value.data.value.teamid) : null);

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

onMounted(async () => {
  if(!store.teams.selectedTeam.value){
    await store.initialize();
  }
})

onActivated(() => {
  if(match.value && (match.value.data.value.result)){
    $dialog.alert({
      title: 'Match Ended',
      message: 'This match has already ended. Please go back to matches overview.',
      okText: 'View Analysis',
    }).then(() => {
      useRouter().push('/matches');
    });
  }
})

watch(() => match.value?.data.value.id, () => {
  shootingTarget.value = null;
  shootingArea.value = null;
  store.selection.resetAll();
});

watch(() => match.value?.data.value.result, () => {
   if(match.value && (match.value.data.value.result)){
    $dialog.alert({
      title: 'Match Ended',
      message: 'This match has already ended. Please go back to matches overview.',
      okText: 'View Analysis',
    }).then(() => {
      useRouter().push(`/matches/${match.value?.data.value.id}`);
    });
  }
});

// const toggleGameMode = () => {
//   if(store.selection.gameMode.value === 'stats'){
//     store.selection.changeGameMode('attack');
//   }else{
//     store.selection.changeGameMode('stats');
//   }
//   const mode = store.selection.gameMode.value
//   if(mode === 'stats' && (selectedPlayer.value && !selectedPlayer.value?.currentStats)){
//     store.selection.player.value = null;
//   }
  
//   shootingTarget.value = null;
//   shootingArea.value = null;
//   store.selection.clearSelection();
// }


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
 match.value?.changeDefenseSystem((e.target as HTMLInputElement).value as DefenseSystem)
}

function changeOppositeDefenseSystem(e:Event) {
 match.value?.changeOpponentDefenseSystem((e.target as HTMLInputElement).value as DefenseSystem)
}

</script>

<style scoped>

</style>

