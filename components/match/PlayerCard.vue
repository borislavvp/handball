
<template>
  <div
    class="bg-white rounded-xl shadow p-4 transition-colors"
    :class="cardFlashClass"
  >
    <div class="w-full flex justify-between items-center">
        <div class="font-bold text-lg">
          #{{ player.number }} {{ player.name }}
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-md border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-900"
            @click="editorOpen = true"
          >
            Events
          </button>
          <PlayerValueBadge :value="player.value" :player-id="player.id" />
        </div>
    </div>
    
    <!-- Shot distribution -->
    <div v-if="hasShots(player)" class="mt-4">
      <div class="mt-2 flex items-center">
        <div class="mr-4">
          Shots: {{ player.goalsTotal }}/{{ player.attempts }}
        </div>
        <div class="text-gray-800">
          Eff: {{ player.efficiency }}%
        </div>
      </div>
      <div class="mt-2 grid grid-cols-5 gap-2 text-xs text-center">
        <StatBadge v-if="player.by9m.total>0" label="9m" :class="getShotClass(player.by9m)"
        :value="`${player.by9m.scored}/${player.by9m.total}`" />
        <StatBadge v-if="player.by6m.total>0" label="6m" :class="getShotClass(player.by6m)"
        :value="`${player.by6m.scored}/${player.by6m.total}`" />
        <StatBadge v-if="player.byWing.total>0" label="Wing" :class="getShotClass(player.byWing)"
        :value="`${player.byWing.scored}/${player.byWing.total}`" />
        <StatBadge v-if="player.by7m.total>0" label="7m" :class="getShotClass(player.by7m)"
        :value="`${player.by7m.scored}/${player.by7m.total}`" />
        <StatBadge v-if="player.fastbreak.total>0" label="FB" :class="getShotClass(player.fastbreak)"
        :value="`${player.fastbreak.scored}/${player.fastbreak.total}`" />
        <StatBadge v-if="player.breakthrough.total>0" label="Brk" :class="getShotClass(player.breakthrough)"
        :value="`${player.breakthrough.scored}/${player.breakthrough.total}`" />
        <StatBadge v-if="player.assistsPrimary" class="bg-emerald-600 text-white"  label="1 Ast" :value="player.assistsPrimary" />
        <StatBadge v-if="player.assistsSecondary" class="bg-emerald-600 text-white"  label="2 Ast" :value="player.assistsSecondary" />
      </div>
    </div>
    <div v-if="hasExtraStats(player)" class="mt-4">
      <span>Defense</span>
      <div class="mt-2 grid grid-cols-5 gap-2 text-xs text-center">
        <StatBadge v-if="player.steals" class="bg-emerald-600 text-white"  label="Stl" :value="player.steals" />
        <StatBadge v-if="player.blocks" class="bg-emerald-600 text-white"  label="Blk" :value="player.blocks" />
        <StatBadge v-if="player.defense" class="bg-emerald-600 text-white"  label="Def" :value="player.defense" />
        <StatBadge v-if="player.defenseAndSteal" class="bg-emerald-600 text-white"  label="Def & Stl" :value="player.defenseAndSteal" />
        <StatBadge v-if="player.lostballs" class="bg-red-600 text-white"  label="LB" :value="player.lostballs" />
        <StatBadge v-if="player.oneOnOneLost" class="bg-red-600 text-white"  label="1-1 L" :value="player.oneOnOneLost" />
      </div>
    </div>
    <div v-if="hasProvokes(player)" class="mt-4">
      <span>Provokes</span>
      <div class="mt-2 grid grid-cols-5 gap-2 text-xs text-center">
        <StatBadge v-if="player.provoked2m" class="bg-emerald-600 text-white"  label="2M Prv" :value="player.provoked2m" />
        <StatBadge v-if="player.provoked7m" class="bg-emerald-600 text-white"  label="7M Prv" :value="player.provoked7m" />
        <StatBadge v-if="player.provokedCard" class="bg-emerald-600 text-white"  label="Card Prv" :value="player.provokedCard" />
      </div>
    </div>
    <div v-if="hasSuspensions(player)" class="mt-4">
      <span>Suspensions</span>
      <div class="mt-2 grid grid-cols-5 gap-2 text-xs text-center">
        <StatBadge v-if="player.twoMinutes" class="bg-white border-2 text-gray-900"  label="2M" :value="player.twoMinutes" />
        <StatBadge v-if="player.yellow" class="bg-yellow-500 text-white"  label="Yellow" :value="player.yellow" />
        <StatBadge v-if="player.red" class="bg-red-600 text-white"  label="Red" :value="player.red"/>
        <StatBadge v-if="player.blue" class="bg-blue-600 text-white"  label="Blue" :value="player.blue" />
      </div>
    </div>
    <TimedEventEditor
      v-if="editorOpen"
      :match-id="matchId"
      :player="player"
      :value="player.value"
      :events="events"
      :roster="roster"
      @close="editorOpen = false"
      @stats-changed="emit('statsChanged')"
    />
  </div>
</template>

<script setup lang="ts">
import type { MatchStats } from '~/shared/pdf/fetchMatchStats';
import StatBadge from './StatusBadge.vue'
import TimedEventEditor from './TimedEventEditor.vue'
import PlayerValueBadge from '../shared/PlayerValueBadge.vue'
const props = defineProps<{
  player: MatchStats['players'][number]
  matchId: number
  events: MatchStats['events']
  roster: MatchStats['roster']
}>()
const emit = defineEmits<{
  (e: 'statsChanged'): void;
}>()

const editorOpen = ref(false)
const cardFlashKind = ref<'positive' | 'negative' | 'neutral' | null>(null)
const cardFlashActive = ref(false)
const lastCardTimestamp = ref(0)
let cardFlashTimer: ReturnType<typeof setTimeout> | null = null

const cardFlashClass = computed(() => {
  if (!cardFlashActive.value || !cardFlashKind.value) return ''
  return `card-flash-${cardFlashKind.value}`
})

const triggerCardFlash = async (next: { kind: 'positive' | 'negative' | 'neutral' }) => {
  cardFlashKind.value = next.kind
  cardFlashActive.value = false
  await nextTick()
  cardFlashActive.value = true
  if (cardFlashTimer) clearTimeout(cardFlashTimer)
  cardFlashTimer = setTimeout(() => { cardFlashActive.value = false }, 1100)
}

const { flash } = usePlayerFlash()
watch(() => flash.value, (next) => {
  if (next.playerId !== props.player.id) return
  if (next.timestamp === 0) return
  if (next.timestamp === lastCardTimestamp.value) return
  lastCardTimestamp.value = next.timestamp
  triggerCardFlash(next)
})

onUnmounted(() => {
  if (cardFlashTimer) clearTimeout(cardFlashTimer)
})

const getShotClass = (data: { scored: number, total: number }) => {
  if (data.total === 0) {
    return 'bg-gray-300 text-gray-900 border-gray-400';
  }
  const efficiency = data.scored / data.total;
  if (efficiency >= 0.7) {
    return 'bg-emerald-700 text-white';
  } else if (efficiency >= 0.4) {
    return 'bg-amber-600 text-white';
  } else {
    return 'bg-red-800 text-white';
  }
}

const hasExtraStats = (player: MatchStats['players'][number]) => {
  return player.steals > 0 || player.blocks > 0 || player.defense > 0 || player.lostballs > 0 || player.norebounds > 0 || player.penaltiesMade > 0;
}

const hasSuspensions = (player: MatchStats['players'][number]) => {
  return player.twoMinutes > 0 || player.yellow > 0 || player.red > 0 || player.blue > 0;
}

const hasShots = (player: MatchStats['players'][number]) => {
  return player.attempts > 0;
}

const hasProvokes = (player: MatchStats['players'][number]) => {
  return player.provoked2m > 0 || player.provoked7m > 0 || player.provokedCard > 0;
}

</script>

<style scoped>
@keyframes flash-positive-bg {
    0%   { background-color: rgb(52, 211, 153); }
    100% { background-color: rgb(255, 255, 255); }
}

@keyframes flash-negative-bg {
    0%   { background-color: rgb(251, 113, 133); }
    100% { background-color: rgb(255, 255, 255); }
}

@keyframes flash-neutral-bg {
    0%   { background-color: rgb(96, 165, 250); }
    100% { background-color: rgb(255, 255, 255); }
}

.card-flash-positive {
    animation: flash-positive-bg 1s ease-out;
}

.card-flash-negative {
    animation: flash-negative-bg 1s ease-out;
}

.card-flash-neutral {
    animation: flash-neutral-bg 1s ease-out;
}
</style>
