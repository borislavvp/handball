<template>
  <button
    v-for="p in teamPlayers"
    @click="onPlayerClick(p)"
    :class="[
    'relative my-4 rounded-md w-24 h-24 flex items-center transition-colors justify-center z-50 border-1  select-none',
    // statsMode && !p.currentStats ? 'border-gray-200 bg-gray-200 text-gray-400' :
    store.selection.player.value?.id == p.id ? 'shadow-inner text-white border-emerald-900 bg-emerald-900' :
    store.selection.primaryAssist.value?.id == p.id ? 'shadow-inner text-white border-emerald-600 bg-emerald-600' :
    store.selection.secondaryAssist.value?.id == p.id ? 'shadow-inner text-gray-900 border-emerald-300 bg-emerald-300' :
    store.selection.mistakePlayer.value?.id == p.id ? 'shadow-inner text-gray-900 border-red-400 bg-red-400' :
    // gameMode === 'stats' && !p.currentStats ? 'border-gray-400 bg-gray-200 text-gray-500' :
    p.position === 'GK' ? 'text-white border-blue-700 bg-blue-400' : 
    'border-gray-700 bg-white text-gray-900',
    (shouldAnimatePlayerSelection() || shouldAnimateAssistSelection(p) || shouldAnimateMistakeSelection(p)) && 'animate-border border-white',
  ]">
    <two-minutes-tag 
      v-if="store.matches.currentMatch.value?.twoMinutesHome.includes(p.id)" 
      class="absolute bottom-0 left-0 -mb-4 -ml-4"
      :player-id="p.id"
    />
    <div class="flex items-center space-x-2 absolute bottom-0 right-0 -mb-3 mr-1 ">
      <span v-for="_ in p.currentStats?.twominutes" class="text-xl font-semibold text-gray-800 px-1 rounded bg-gray-200 border">2</span>
      <span v-if="p.currentStats?.bluecard" class=" h-7 w-5 bg-blue-400" />
      <span v-else-if="p.currentStats?.redcard" class=" h-7 w-5 bg-red-400" />
      <span v-else-if="p.currentStats?.yellowcard" class="h-7 w-5 bg-yellow-400" />
    </div>
    <span v-if="p.position === 'GK'" class="flex items-center space-x-1 py-1 px-2 bg-gradient-to-r from-gray-200 from-10% to-white text-black border border-gray-300 rounded-full absolute top-0 left-0 -mt-4 -ml-4">
      <wall class="h-7 w-7 "/>
      <p class="font-bold text-lg">{{ p.currentStats?.gksave }}</p>
    </span>
    <span v-if="p.currentStats !== undefined" 
      class="absolute top-0 right-0 -mt-4 -mr-4 flex size-10  rounded-full text-lg  font-semibold items-center justify-center"
      :class="[
        p.currentStats?.value < 0  ? 'bg-gradient-to-r from-red-700 from-10% via-red-800 via-30% to-red-900 to-90% text-white ' 
        : p.currentStats?.value > 0 ? 'bg-gradient-to-b from-emerald-600 from-10% via-emerald-700 via-50% to-emerald-600 to-90% text-white ' 
        // : p.currentStats?.value > 0 ? 'bg-gradient-to-r from-emerald-700 from-10% via-emerald-800 via-30% to-emerald-900 to-90% text-white ' 
        // : p.currentStats?.value > 0 ? 'bg-emerald-600 text-white border-emerald-800' 
        : 'bg-gradient-to-r from-gray-200 from-10%  border to-white text-gray-900 border-gray-300',
      ]"
      >
      <p :class="p.currentStats.value !== 0 && '-ml-1'">{{ p.currentStats.value > 0 ? `+${p.currentStats.value}` : p.currentStats.value }}</p>
    </span>
    <div class="flex flex-col items-center">
      <div class="flex items-center space-x-1">
        <span class="text-3xl font-semibold">{{ p.number }}</span>
        <span class="text-xl font-semibold">{{ p.position }}</span>
      </div>
      <span class="text-md">{{ p.name.split(' ')[0] }}</span>
    </div>
  </button>
</template> 

<script setup lang="ts">
import type { Player, ShootingTarget } from '~/types/handball';
import TwoMinutesTag from '~/components/game/TwoMinutesTag.vue';
import Wall from '../icons/wall.vue';

const props = defineProps<{
    statsMode: boolean;
    shootingTarget: ShootingTarget | null;
}>()

const emits = defineEmits<{
    (e: 'two-min-over', playerId: number): void;
}>();

const store = useHandballStore();

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
  const selectMistakePlayer = store.selection.player.value?.position === 'GK' && store.selection.oneOnOneLost.value;


  if(p.id === store.selection.player.value?.id){
    store.selection.player.value = null;
    store.selection.clearSelection();
  }else if (props.shootingTarget === null || store.selection.player.value === null || 
            (store.selection.player.value.position === 'GK' && !store.selection.oneOnOneLost.value)) {
      store.selection.player.value = p;
  }else{
    if(selectMistakePlayer){
      if(store.selection.mistakePlayer.value?.id === p.id){
        store.selection.mistakePlayer.value = null;
      }else{
        store.selection.mistakePlayer.value = p;
      }
    } else if (store.selection.primaryAssist.value?.id === p.id) {
      store.selection.primaryAssist.value = null;
    }else if (store.selection.secondaryAssist.value?.id === p.id) {
      store.selection.secondaryAssist.value = null;
    }else if(store.selection.primaryAssist.value === null){
      store.selection.primaryAssist.value = p;
    }else{
      store.selection.secondaryAssist.value = p;
    }
  }
}

const shouldAnimatePlayerSelection = () => {
  return !store.selection.player.value && 
  props.shootingTarget !== null && 
  (store.selection.primaryAssist.value === null || store.selection.secondaryAssist.value === null ||
   store.selection.mistakePlayer.value === null)
}

const shouldAnimateAssistSelection = (p:Player) => {
  return store.selection.player.value && 
  store.selection.player.value.position !== 'GK' && 
  store.selection.player.value.id !== p.id && 
  props.shootingTarget !== null && 
  store.selection.primaryAssist.value?.id !== p.id &&
  store.selection.secondaryAssist.value?.id !== p.id
}

const shouldAnimateMistakeSelection = (p:Player) => {
  return store.selection.player.value && 
  store.selection.player.value.position === 'GK' && 
  store.selection.player.value.id !== p.id && 
  props.shootingTarget !== null && 
  store.selection.mistakePlayer.value?.id !== p.id && 
  store.selection.oneOnOneLost.value 
}

function onTwoMinutesOver(playedId:number){
  emits('two-min-over', playedId);
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