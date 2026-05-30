
<template>
  <div class="relative min-h-[320px]">
    <div class="grid grid-cols-3 gap-4 p-6">
      <PlayerCard
        v-for="p in players"
        :key="p.id"
        :player="p"
        :match-id="matchId"
        :events="eventsByPlayer.get(p.id) || []"
        :roster="stats.roster"
        @stats-changed="emit('statsChanged')"
      />
    </div>
    <div
      v-if="store.fetching.value"
      class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 text-center backdrop-blur-sm"
    >
      <div class="relative mb-6 h-24 w-24">
        <div class="absolute inset-0 rounded-full border-8 border-[#42b883] opacity-20"></div>
        <div class="absolute inset-0 animate-spin rounded-full border-8 border-transparent border-t-[#42b883]"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-xl font-bold text-[#42b883]">%</span>
        </div>
      </div>
      <h2 class="text-2xl font-semibold text-gray-800">Updating player stats…</h2>
      <p class="mt-2 text-sm text-gray-500">This may take a few seconds</p>
    </div>
  </div>
</template>



<script setup lang="ts">
import type { MatchStats } from "~/shared/pdf/fetchMatchStats";
import PlayerCard from "./PlayerCard.vue"
const props = defineProps<{ stats: MatchStats, matchId: number }>()
const emit = defineEmits<{
  (e: 'statsChanged'): void;
}>()
const store = useHandballStore()

const players = computed(() => {
  const statsByPlayer = new Map(props.stats.players.map((player) => [player.id, player]))
  return props.stats.roster
    .filter((player) => player.position !== 'GK')
    .map((player) => statsByPlayer.get(player.id) || {
      id: player.id,
      number: player.number,
      name: player.name,
      value: 0,
      goalsTotal: 0,
      attempts: 0,
      efficiency: 0,
      by9m: { scored: 0, total: 0 },
      by6m: { scored: 0, total: 0 },
      byWing: { scored: 0, total: 0 },
      by7m: { scored: 0, total: 0 },
      fastbreak: { scored: 0, total: 0 },
      breakthrough: { scored: 0, total: 0 },
      assistsPrimary: 0,
      assistsSecondary: 0,
      provoked7m: 0,
      provoked2m: 0,
      provokedCard: 0,
      lostballs: 0,
      steals: 0,
      blocks: 0,
      norebounds: 0,
      penaltiesMade: 0,
      oneOnOneLost: 0,
      defense: 0,
      defenseAndSteal: 0,
      yellow: 0,
      twoMinutes: 0,
      red: 0,
      blue: 0,
    })
    .sort((a, b) => b.value - a.value)
})

const eventsByPlayer = computed(() => {
  const events = new Map<number, MatchStats['events']>()
  props.stats.events.forEach((event) => {
    if (!event.playerid) return
    if (!events.has(event.playerid)) events.set(event.playerid, [])
    events.get(event.playerid)!.push(event)
  })
  events.forEach((playerEvents) => {
    playerEvents.sort((a, b) => a.time.localeCompare(b.time))
  })
  return events
})


</script>
