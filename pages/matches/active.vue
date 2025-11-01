
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
        <div class="flex flex-col pt-8 border-r border-gray-200 w-2/5 h-full justify-between overflow-x-hidden overflow-y-auto">
          <div class="flex flex-col justify-center">
            <!-- timeouts -->
            <div class="flex top-0 justify-between ml-12 mr-10 items-center">
              <button @click="store.matches.takeTimeout" 
              class="rounded-full select-none w-20 h-20 font-semibold text-4xl border flex justify-center items-center "
              :class="[
                store.matches.currentMatch.value?.timeoutsLeft ? 'text-gray-900 focus:bg-gray-100 bg-white border-gray-800 shadow-md' : 'bg-gray-200 text-gray-400 shadow-inner border-gray-400'
              ]"
              >
                T{{store.matches.currentMatch.value?.timeoutsLeft}}</button>
              <button @click="store.matches.toggleEmptyGoal" 
              class="rounded-md select-none w-20 h-20 font-semibold text-lg flex text-gray-900 text-center items-center "
              :class="[
                store.matches.currentMatch.value?.emptyGoal ? 'bg-yellow-300 shadow-inner' : ' border border-gray-800 bg-white shadow-md ' 
              ]"
              >EMPTY GOAL</button>
            </div>
            <!-- Players -->
            <div class="flex flex-wrap w-full ml-8 space-x-6 py-6">
              <button
                v-for="p in teamPlayers"
                  @click="onPlayerClick(p)"
                  :class="[
                  'relative  my-4 rounded-md w-24 h-24 flex items-center justify-center z-50 border-1 transition-colors',
                  ,
                  selectedPlayer?.id == p.id ? 'shadow-inner text-white border-emerald-900 bg-emerald-900' :
                   selectedAssist?.id == p.id ? 'shadow-inner text-gray-900 border-yellow-400 bg-yellow-300' :
                  // gameMode === 'stats' && !p.currentStats ? 'border-gray-400 bg-gray-200 text-gray-500' :
                   p.position === 'GK' ? ' text-white border-blue-700 bg-blue-400' : 
                  'border-gray-700 bg-white text-gray-900',
                  shouldAnimateAssistSelection(p) && 'animate-border border-white',
                ]">
                <span v-if="p.currentStats !== undefined" 
                class="absolute top-0 right-0 -mt-4 -mr-4 flex size-10  rounded-full text-lg border  items-center justify-center"
                :class="[
                  p.currentStats?.value < 0  ? 'bg-red-600 text-white border-red-800' 
                  : p.currentStats?.value > 0 ? 'bg-emerald-600 text-white border-emerald-800' 
                  : 'bg-white text-gray-900 border-gray-400',
                ]"
                >
                <p class="-ml-1">{{ p.currentStats.value > 0 ? `+${p.currentStats.value}` : p.currentStats.value }}</p>
              </span>
                <div class="flex flex-col items-center">
                  <div class="flex items-center space-x-1">
                    <span class="text-3xl font-semibold">{{ p.number }}</span>
                    <span class="text-xl font-semibold">{{ p.position }}</span>
                  </div>
                  <span class="text-md">{{ p.name.split(' ')[0] }}</span>
                </div>
              </button>
            </div>
            <!-- Defense System -->
            <div class="flex sticky items-center justify-between mb-5 mx-8">
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
              <div class="flex items center text-xl">
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
          </div>

        </div>
        <!-- Stats Side -->
        <div class="w-3/5 h-full flex flex-col p-10 bg-gray-100 overflow-x-hidden overflow-y-auto">
          <player-headline class="sticky" v-if="gameMode==='stats' && selectedPlayer" :player="selectedPlayer" />
          <goal 
          v-if="!(gameMode === 'stats' && (selectedPlayer ? !selectedPlayer?.currentStats: false))"
            @position-click="onShootingTargetClick"
            :goalkeep-selected="selectedPlayer?.position === 'GK'"
            :shooting-target="shootingTarget"
            :shooting-area="shootingArea"
            :player="selectedPlayer"
            :stats-mode="gameMode === 'stats'"
            class="px-10 bg-gray-100"
            :class="[!shootingTarget && 'sticky top-0 z-100']"
          />
          <shooting-position
          v-if="(gameMode !== 'stats' && shootingTarget !== null) || 
            (gameMode === 'stats' && (selectedPlayer ? selectedPlayer?.currentStats ? true : false : true))" 
            @position-click="onShootingAreaClick" 
            :player="selectedPlayer"
            :stats-mode="gameMode === 'stats'"
            :selected-shooting-target="shootingTarget"
            class="px-10 " 
          />
          <!-- <player-performance-chart v-if="gameMode==='stats' && selectedPlayer" :player="selectedPlayer" /> -->
          <stats-options class="mt-10 flex-1" 
            v-if="gameMode !== 'stats'"
            :mode="gameMode"
            :goal-selected="shootingTarget !== null"
            :goalkeeper-selected="selectedPlayer?.position === 'GK'"
            :shooting-area="shootingArea"
            :shooting-target="shootingTarget"
            :player="selectedPlayer"
            :assist="selectedAssist"
            @shotAdded="onShotAdded"
          />
        </div>
        <div class="relative w-18 h-full bg-gray-800 flex flex-col items-center justify-center ">
          <stats-icon 
          @click="changeGameMode('stats')" class="rounded-full w-16 h-16 transition-transform p-1 absolute shadow-lg border border-gray-400 text-center  -mt-40"
            :class="[  gameMode === 'stats' ? 'scale-125 -ml-8 bg-white text-gray-900' : 'bg-gray-300 text-gray-800 -ml-4']"
          />
          <attack @click="changeGameMode('attack')" class="rounded-full w-16 h-16 p-1 transition-transform absolute shadow-lg border border-gray-400 text-center "
            :class="gameMode === 'attack' ? 'scale-125 -ml-8 bg-white text-gray-900' : '-ml-4 bg-gray-300 text-gray-800'"
          />
          <defense @click="changeGameMode('defense')" class="rounded-full w-16 h-16 p-1 transition-transform absolute shadow-lg border border-gray-400 text-center  mt-40"
            :class="gameMode === 'defense' ? 'scale-125 -ml-8 bg-white text-gray-900' : 'bg-gray-300 text-gray-800 -ml-4'"
          /> 
        </div>
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
import PlayerHeadline from '~/components/game/PlayerHeadline.vue';
import PlayerPerformanceChart from '~/components/game/PlayerPerformanceChart.vue';
import GameHeader from '~/components/game/GameHeader.vue';
import ShootingPosition from '~/components/game/ShootingPosition.vue';
import StatsOptions from '~/components/game/StatsOptions.vue';

onMounted(async () => {
  if(!store.teams.selectedTeam.value){
    await store.initialize();
  }
})

const store = useHandballStore();

const match = computed(() => store.matches.currentMatch.value || null);
const team = computed(() => match.value ? store.teams.getTeam(match.value.teamid) : null);

const shootingTarget = ref<ShootingTarget | null>(null);
const shootingArea = ref<ShootingArea | null>(null);

const gameMode = ref<"attack" | "defense" | "stats">("attack");

const selectedPlayer = ref<Player | null>(null);
const selectedAssist = ref<Player | null>(null);
const selectedPosition = ref<Position | null>(null);

const shouldAnimateAssistSelection = (p:Player) => {
  return gameMode.value !== "stats" && selectedPlayer.value && 
  selectedPlayer.value.position !== 'GK' && 
  selectedPlayer.value.id !== p.id && 
  shootingTarget.value !== null && selectedAssist.value?.id !== p.id
}

const changeGameMode = (mode:"attack" | "defense" | "stats") => {
  gameMode.value = mode;
  shootingTarget.value = null;
  shootingArea.value = null;
  selectedAssist.value = null;
}

const endCurrentMatch = (result: "WIN" | "LOST") => {
  store.matches.endMatch(result);
  useRouter().push("/matches")
}

const goBack = () => useRouter().back();

const teamPlayers = computed(() => {
  const players = store.teams.teams.value[0]?.players;
  if (!players) {
    return [];
  }
  return players.slice().sort((a, b) => {
    const GOALKEEPER_POSITION = 'GK';
    const aIsGK = a.position === GOALKEEPER_POSITION;
    const bIsGK = b.position === GOALKEEPER_POSITION;
    if (aIsGK && !bIsGK) {
      return -1;
    }
    if (!aIsGK && bIsGK) {
      return 1;
    }
    return 0;
  });
});


function onPlayerClick(p: Player) {
  if(p.id === selectedPlayer.value?.id){
    selectedPlayer.value = null;
    selectedAssist.value = null;
  }else if (gameMode.value === 'stats' || selectedPlayer.value === null || shootingTarget.value === null) {
    selectedPosition.value = {
      key: p.position,
      label: p.position,
      x: 0,
      y:50
    };
    selectedPlayer.value = p;
  }else if (selectedAssist.value?.id === p.id) {
    selectedAssist.value = null;
  }else{
    selectedAssist.value = p;
  }
}

function onShotAdded(){
  shootingTarget.value = null;
  shootingArea.value = null;
  selectedAssist.value = null;
}

function onShootingTargetClick(index: number | null){
  shootingTarget.value = index;
  if (shootingTarget.value === null) {
    shootingArea.value = null;
    selectedAssist.value = null;
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
@keyframes zebra-slide {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 16px 0;
  }
}

.animate-border::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px; /* border thickness */
  background-image: repeating-linear-gradient(
    45deg,
    black 0,
    black 15%,
    white 25%,
    white 50%
  );
  background-size: 16px 16px;
  animation: zebra-slide 0.5s linear infinite;
  
  /* Make only the border visible */
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  z-index: 0;
}


</style>

