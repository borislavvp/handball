<template>
  <div class="flex rounded-xl shadow p-4 flex-col transition-shadow" :class="cardFlashing && 'card-flash'">
    <div class="flex items-center justify-between font-semibold mb-3">
      <span>
        #{{ keeper.number }} {{ keeper.name }}
      </span>
      <span class="text-2xl">Eff. {{ keeper.efficiency }}%</span>
        <div class="flex items-center gap-2">
          <button
            class="rounded-md border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-900"
            @click="editorOpen = true"
          >
            Events
          </button>
          <PlayerValueBadge :value="keeper.value" :player-id="keeper.id" />
        </div>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <GKStat label="9m" :data="keeper.by9m" :no-recovery-count="keeper.stopsWithoutRecoveryByArea?.by9m" />
      <GKStat label="6m" :data="keeper.by6m" :no-recovery-count="keeper.stopsWithoutRecoveryByArea?.by6m" />
      <GKStat label="Wing" :data="keeper.byWing" :no-recovery-count="keeper.stopsWithoutRecoveryByArea?.byWing" />
      <GKStat label="7m" :data="keeper.by7m" :no-recovery-count="keeper.stopsWithoutRecoveryByArea?.by7m" />
      <GKStat label="FB" :data="keeper.fastbreak" :no-recovery-count="keeper.stopsWithoutRecoveryByArea?.fastbreak" />
    </div>
    <div class="mt-2 grid grid-cols-3 gap-2 text-xs text-center">
        <StatBadge v-if="keeper.assistsPrimary" class="bg-emerald-600 text-white"  label="1 Ast" :value="keeper.assistsPrimary" />
        <StatBadge v-if="keeper.assistsSecondary" class="bg-emerald-600 text-white"  label="2 Ast" :value="keeper.assistsSecondary" />
        <StatBadge v-if="keeper.lostball" class="bg-red-800 text-white"  label="LB" :value="keeper.lostball" />
        <StatBadge v-if="keeper.stopsWithoutRecovery" class="bg-orange-500 text-white" label="No RCV" :value="keeper.stopsWithoutRecovery" />
    </div>
    <TimedEventEditor
      v-if="editorOpen"
      :match-id="matchId"
      :player="keeper"
      :value="keeper.value"
      :events="events"
      :roster="roster"
      @close="editorOpen = false"
      @stats-changed="emit('statsChanged')"
    />
  </div>
</template>

<script setup lang="ts">
import type { MatchStats } from '~/shared/pdf/fetchMatchStats';
import GKStat from './GKStat.vue'
import StatBadge from './StatusBadge.vue'
import TimedEventEditor from './TimedEventEditor.vue'
import PlayerValueBadge from '../shared/PlayerValueBadge.vue'

const props = defineProps<{
  keeper: MatchStats['goalkeepers'][number]
  matchId: number
  events: MatchStats['events']
  roster: MatchStats['roster']
}>()
const emit = defineEmits<{
  (e: 'statsChanged'): void;
}>()
const editorOpen = ref(false)
const cardFlashing = ref(false)
let cardFlashTimer: ReturnType<typeof setTimeout> | null = null

const { flash } = usePlayerFlash()
watch(() => flash.value, (next) => {
  if (next.playerId !== props.keeper.id) return
  if (next.timestamp === 0) return
  cardFlashing.value = true
  if (cardFlashTimer) clearTimeout(cardFlashTimer)
  cardFlashTimer = setTimeout(() => { cardFlashing.value = false }, 1400)
})

onUnmounted(() => {
  if (cardFlashTimer) clearTimeout(cardFlashTimer)
})

</script>

<style scoped>
.keeper-card {
  background: #1c1c1c;
  padding: 16px;
  border-radius: 16px;
}

@keyframes card-flash {
    0% { box-shadow: 0 0 0 0 rgba(66, 184, 131, 0.7); }
    50% { box-shadow: 0 0 0 6px rgba(66, 184, 131, 0); }
    100% { box-shadow: 0 0 0 0 rgba(66, 184, 131, 0); }
}

@keyframes card-zebra {
    from { background-position: 0 0, 0 0; }
    to   { background-position: 0 0, 16px 0; }
}

.card-flash {
    border: 2px solid transparent;
    background-image:
        linear-gradient(white, white),
        repeating-linear-gradient(
            45deg,
            #42b883 0,
            #42b883 8%,
            #34a06b 16%,
            #42b883 24%
        );
    background-origin: border-box;
    background-clip: padding-box, border-box;
    animation: card-flash 1.2s ease-out, card-zebra 0.5s linear infinite;
}
</style>
