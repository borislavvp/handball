<template>
  <div class="flex rounded-xl shadow p-4 flex-col">
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
          <span 
            class="flex size-10 rounded-full text-lg  font-semibold items-center justify-center"
            :class="[
              keeper.value < 0  ? 'bg-gradient-to-r from-red-700 from-10% via-red-800 via-30% to-red-900 to-90% text-white ' 
              : keeper.value > 0 ? 'bg-gradient-to-b from-emerald-600 from-10% via-emerald-700 via-50% to-emerald-600 to-90% text-white ' 
              : 'bg-gradient-to-r from-gray-200 from-10%  border to-white text-gray-900 border-gray-300',
            ]"
            >
            <p :class="keeper.value !== 0 && '-ml-1'">{{ keeper.value > 0 ? `+${keeper.value}` : keeper.value }}</p>
          </span>
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

</script>

<style scoped>
.keeper-card {
  background: #1c1c1c;
  padding: 16px;
  border-radius: 16px;
}
</style>
